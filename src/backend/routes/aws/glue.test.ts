import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());
const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) { return { __cmdName: name, ...args }; });
  };
});

vi.mock("@aws-sdk/client-glue", () => ({
  GlueClient: vi.fn(function () { return { send: mockSend }; }),
  GetDatabasesCommand: createCmd("GetDatabasesCommand"),
  GetDatabaseCommand: createCmd("GetDatabaseCommand"),
  CreateDatabaseCommand: createCmd("CreateDatabaseCommand"),
  DeleteDatabaseCommand: createCmd("DeleteDatabaseCommand"),
  GetTablesCommand: createCmd("GetTablesCommand"),
  GetTableCommand: createCmd("GetTableCommand"),
  CreateTableCommand: createCmd("CreateTableCommand"),
  DeleteTableCommand: createCmd("DeleteTableCommand"),
  ListRegistriesCommand: createCmd("ListRegistriesCommand"),
  CreateRegistryCommand: createCmd("CreateRegistryCommand"),
  GetRegistryCommand: createCmd("GetRegistryCommand"),
  DeleteRegistryCommand: createCmd("DeleteRegistryCommand"),
  ListSchemasCommand: createCmd("ListSchemasCommand"),
  CreateSchemaCommand: createCmd("CreateSchemaCommand"),
  GetSchemaCommand: createCmd("GetSchemaCommand"),
  DeleteSchemaCommand: createCmd("DeleteSchemaCommand"),
  ListSchemaVersionsCommand: createCmd("ListSchemaVersionsCommand"),
  RegisterSchemaVersionCommand: createCmd("RegisterSchemaVersionCommand"),
  GetUserDefinedFunctionsCommand: createCmd("GetUserDefinedFunctionsCommand"),
  CreateUserDefinedFunctionCommand: createCmd("CreateUserDefinedFunctionCommand"),
  GetUserDefinedFunctionCommand: createCmd("GetUserDefinedFunctionCommand"),
  DeleteUserDefinedFunctionCommand: createCmd("DeleteUserDefinedFunctionCommand"),
  UpdateUserDefinedFunctionCommand: createCmd("UpdateUserDefinedFunctionCommand"),
  GetColumnStatisticsForTableCommand: createCmd("GetColumnStatisticsForTableCommand"),
  UpdateColumnStatisticsForTableCommand: createCmd("UpdateColumnStatisticsForTableCommand"),
  DeleteColumnStatisticsForTableCommand: createCmd("DeleteColumnStatisticsForTableCommand"),
  GetColumnStatisticsForPartitionCommand: createCmd("GetColumnStatisticsForPartitionCommand"),
  UpdateColumnStatisticsForPartitionCommand: createCmd("UpdateColumnStatisticsForPartitionCommand"),
  DeleteColumnStatisticsForPartitionCommand: createCmd("DeleteColumnStatisticsForPartitionCommand"),
}));

vi.mock("../../clients/aws", () => ({ create: (Ctor: any, extra?: any) => new Ctor(extra) }));

import router from "./glue";

async function get(p: string) { return router.request(p, { method: "GET" }); }
async function post(p: string, b?: any) {
  return router.request(p, { method: "POST", body: b != null ? JSON.stringify(b) : undefined, headers: b != null ? { "content-type": "application/json" } : undefined });
}
async function del(p: string) { return router.request(p, { method: "DELETE" }); }

beforeEach(() => mockSend.mockReset());

describe("Glue Routes", () => {
  it("GET /databases — lists databases", async () => {
    mockSend.mockResolvedValueOnce({ DatabaseList: [{ Name: "default", Description: "Default" }] });
    const res = await get("/databases");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
  });

  it("GET /databases — empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/databases");
    const body = await res.json();
    expect(body.total).toBe(0);
  });

  it("GET /databases/:name — gets database", async () => {
    mockSend.mockResolvedValueOnce({ Database: { Name: "default" } });
    const res = await get("/databases/default");
    expect(res.status).toBe(200);
  });

  it("POST /databases — creates database (201)", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/databases", { name: "mydb" });
    expect(res.status).toBe(201);
  });

  it("POST /databases — 400 if name missing", async () => {
    const res = await post("/databases", {});
    expect(res.status).toBe(400);
  });

  it("DELETE /databases/:name — deletes database", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/databases/mydb");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
  });

  it("GET /databases/:dbName/tables — lists tables", async () => {
    mockSend.mockResolvedValueOnce({ TableList: [{ Name: "table-1", TableType: "EXTERNAL_TABLE" }] });
    const res = await get("/databases/mydb/tables");
    const body = await res.json();
    expect(body.total).toBe(1);
  });

  it("GET /databases/:dbName/tables — empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/databases/mydb/tables");
    const body = await res.json();
    expect(body.total).toBe(0);
  });

  it("GET /databases/:dbName/tables/:tableName — gets table", async () => {
    mockSend.mockResolvedValueOnce({ Table: { Name: "table-1" } });
    const res = await get("/databases/mydb/tables/table-1");
    expect(res.status).toBe(200);
  });

  it("POST /databases/:dbName/tables — creates table (201)", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/databases/mydb/tables", { name: "table-1" });
    expect(res.status).toBe(201);
  });

  it("POST /databases/:dbName/tables — 400 if name missing", async () => {
    const res = await post("/databases/mydb/tables", {});
    expect(res.status).toBe(400);
  });

  it("DELETE /databases/:dbName/tables/:tableName — deletes table", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/databases/mydb/tables/table-1");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
  });

  // Schema Registry
  it("GET /registries — lists registries", async () => {
    mockSend.mockResolvedValueOnce({
      Registries: [{ RegistryName: "reg-1", RegistryArn: "arn:...", Status: "AVAILABLE", Description: "Test" }],
    });
    const res = await get("/registries");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.registries[0].name).toBe("reg-1");
  });

  it("GET /registries — empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/registries");
    const body = await res.json();
    expect(body.total).toBe(0);
  });

  it("POST /registries — creates registry (201)", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/registries", { name: "reg-1" });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.created).toBe(true);
  });

  it("POST /registries — 400 if name missing", async () => {
    const res = await post("/registries", {});
    expect(res.status).toBe(400);
  });

  it("GET /registries/:name — gets a registry", async () => {
    mockSend.mockResolvedValueOnce({ RegistryName: "reg-1", Status: "AVAILABLE" });
    const res = await get("/registries/reg-1");
    expect(res.status).toBe(200);
  });

  it("DELETE /registries/:name — deletes registry", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/registries/reg-1");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
  });

  // Schemas
  it("GET /registries/:regName/schemas — lists schemas", async () => {
    mockSend.mockResolvedValueOnce({
      Schemas: [{ SchemaName: "s-1", SchemaStatus: "AVAILABLE", DataFormat: "AVRO", Compatibility: "NONE" }],
    });
    const res = await get("/registries/reg-1/schemas");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.schemas[0].name).toBe("s-1");
  });

  it("GET /registries/:regName/schemas — empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/registries/reg-1/schemas");
    const body = await res.json();
    expect(body.total).toBe(0);
  });

  it("POST /registries/:regName/schemas — creates schema (201)", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/registries/reg-1/schemas", { name: "s-1" });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.created).toBe(true);
  });

  it("POST /registries/:regName/schemas — 400 if name missing", async () => {
    const res = await post("/registries/reg-1/schemas", {});
    expect(res.status).toBe(400);
  });

  it("GET /registries/:regName/schemas/:schemaName — gets a schema", async () => {
    mockSend.mockResolvedValueOnce({ SchemaName: "s-1" });
    const res = await get("/registries/reg-1/schemas/s-1");
    expect(res.status).toBe(200);
  });

  it("DELETE /registries/:regName/schemas/:schemaName — deletes schema", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/registries/reg-1/schemas/s-1");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
  });

  // Schema Versions
  it("GET /registries/:regName/schemas/:schemaName/versions — lists versions", async () => {
    mockSend.mockResolvedValueOnce({
      Schemas: [{ SchemaVersionId: "v1", VersionNumber: 1, Status: "AVAILABLE", CreatedTime: "2025-01-01" }],
    });
    const res = await get("/registries/reg-1/schemas/s-1/versions");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.versions[0].versionNumber).toBe(1);
  });

  it("GET /registries/:regName/schemas/:schemaName/versions — empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/registries/reg-1/schemas/s-1/versions");
    const body = await res.json();
    expect(body.total).toBe(0);
  });

  it("POST /registries/:regName/schemas/:schemaName/versions — registers version (201)", async () => {
    mockSend.mockResolvedValueOnce({ SchemaVersionId: "v1" });
    const res = await post("/registries/reg-1/schemas/s-1/versions", { definition: '{"type":"record"}' });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.registered).toBe(true);
  });

  it("POST /registries/:regName/schemas/:schemaName/versions — 400 if definition missing", async () => {
    const res = await post("/registries/reg-1/schemas/s-1/versions", {});
    expect(res.status).toBe(400);
  });

  // UDFs
  it("GET /databases/:dbName/functions — lists UDFs", async () => {
    mockSend.mockResolvedValueOnce({
      UserDefinedFunctions: [{ FunctionName: "my_udf", ClassName: "com.example.MyUDF", OwnerName: "admin", OwnerType: "USER" }],
    });
    const res = await get("/databases/mydb/functions");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.functions[0].name).toBe("my_udf");
  });

  it("GET /databases/:dbName/functions — empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/databases/mydb/functions");
    const body = await res.json();
    expect(body.total).toBe(0);
  });

  it("POST /databases/:dbName/functions — creates UDF (201)", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/databases/mydb/functions", { name: "my_udf", className: "com.example.MyUDF" });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.created).toBe(true);
  });

  it("POST /databases/:dbName/functions — 400 if name missing", async () => {
    const res = await post("/databases/mydb/functions", { className: "c" });
    expect(res.status).toBe(400);
  });

  it("GET /databases/:dbName/functions/:funcName — gets UDF", async () => {
    mockSend.mockResolvedValueOnce({ UserDefinedFunction: { FunctionName: "my_udf", ClassName: "c" } });
    const res = await get("/databases/mydb/functions/my_udf");
    expect(res.status).toBe(200);
  });

  it("DELETE /databases/:dbName/functions/:funcName — deletes UDF", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/databases/mydb/functions/my_udf");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
  });

  it("PUT /databases/:dbName/functions/:funcName — updates UDF", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await router.request("/databases/mydb/functions/my_udf", {
      method: "PUT",
      body: JSON.stringify({ className: "com.example.New" }),
      headers: { "content-type": "application/json" },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.updated).toBe(true);
  });

  // Column Stats (Table)
  it("GET /databases/:dbName/tables/:tableName/column-stats — lists stats", async () => {
    mockSend.mockResolvedValueOnce({
      ColumnStatisticsList: [{ ColumnName: "col1", ColumnType: "string", AnalyzedTime: new Date() }],
    });
    const res = await get("/databases/mydb/tables/tbl1/column-stats");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.columnStats[0].columnName).toBe("col1");
  });

  it("GET /databases/:dbName/tables/:tableName/column-stats — error returns empty", async () => {
    mockSend.mockRejectedValueOnce(new Error("not found"));
    const res = await get("/databases/mydb/tables/tbl1/column-stats");
    const body = await res.json();
    expect(body.total).toBe(0);
  });

  it("POST /databases/:dbName/tables/:tableName/column-stats — updates stats", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/databases/mydb/tables/tbl1/column-stats", { columnStatisticsList: [{ ColumnName: "col1" }] });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.updated).toBe(true);
  });

  it("POST /databases/:dbName/tables/:tableName/column-stats — 400 if list missing", async () => {
    const res = await post("/databases/mydb/tables/tbl1/column-stats", {});
    expect(res.status).toBe(400);
  });

  it("DELETE /databases/:dbName/tables/:tableName/column-stats — deletes column stat", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await router.request("/databases/mydb/tables/tbl1/column-stats?column=col1", { method: "DELETE" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
  });

  it("DELETE /databases/:dbName/tables/:tableName/column-stats — 400 if column missing", async () => {
    const res = await router.request("/databases/mydb/tables/tbl1/column-stats", { method: "DELETE" });
    expect(res.status).toBe(400);
  });

  // Column Stats (Partition)
  it("GET with values — lists partition stats", async () => {
    mockSend.mockResolvedValueOnce({
      ColumnStatisticsList: [{ ColumnName: "col1", ColumnType: "string" }],
    });
    const res = await get("/databases/mydb/tables/tbl1/partitions/column-stats?values=2024");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
  });

  it("GET with values — 400 if values missing", async () => {
    const res = await get("/databases/mydb/tables/tbl1/partitions/column-stats");
    expect(res.status).toBe(400);
  });

  it("POST partitions/column-stats — updates partition stats", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/databases/mydb/tables/tbl1/partitions/column-stats", {
      partitionValues: ["2024"],
      columnStatisticsList: [{ ColumnName: "col1" }],
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.updated).toBe(true);
  });

  it("DELETE partitions/column-stats — deletes partition stat", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await router.request("/databases/mydb/tables/tbl1/partitions/column-stats?column=col1&values=2024", { method: "DELETE" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
  });
});
