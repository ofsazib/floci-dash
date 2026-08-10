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
  UpdateRegistryCommand: createCmd("UpdateRegistryCommand"),
  GetSchemaVersionCommand: createCmd("GetSchemaVersionCommand"),
  GetSchemaVersionsDiffCommand: createCmd("GetSchemaVersionsDiffCommand"),
  CheckSchemaVersionValidityCommand: createCmd("CheckSchemaVersionValidityCommand"),
  PutSchemaVersionMetadataCommand: createCmd("PutSchemaVersionMetadataCommand"),
  RemoveSchemaVersionMetadataCommand: createCmd("RemoveSchemaVersionMetadataCommand"),
  QuerySchemaVersionMetadataCommand: createCmd("QuerySchemaVersionMetadataCommand"),
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
  GetPartitionsCommand: createCmd("GetPartitionsCommand"),
  GetPartitionCommand: createCmd("GetPartitionCommand"),
  BatchCreatePartitionCommand: createCmd("BatchCreatePartitionCommand"),
  BatchGetPartitionCommand: createCmd("BatchGetPartitionCommand"),
  UpdatePartitionCommand: createCmd("UpdatePartitionCommand"),
  DeletePartitionCommand: createCmd("DeletePartitionCommand"),
  BatchUpdatePartitionCommand: createCmd("BatchUpdatePartitionCommand"),
}));

vi.mock("../../clients/aws", () => ({ create: (Ctor: any, extra?: any) => new Ctor(extra) }));

import router from "./glue";

async function get(p: string) { return router.request(p, { method: "GET" }); }
async function post(p: string, b?: any) {
  return router.request(p, { method: "POST", body: b != null ? JSON.stringify(b) : undefined, headers: b != null ? { "content-type": "application/json" } : undefined });
}
async function del(p: string) { return router.request(p, { method: "DELETE" }); }
async function put(p: string, b?: any) {
  return router.request(p, { method: "PUT", body: b != null ? JSON.stringify(b) : undefined, headers: b != null ? { "content-type": "application/json" } : undefined });
}

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

  // UpdateRegistry
  it("PUT /registries/:name — updates registry description", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await put("/registries/reg-1", { description: "new desc" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.updated).toBe(true);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "UpdateRegistryCommand",
        RegistryId: { RegistryName: "reg-1" },
        Description: "new desc",
      })
    );
  });

  it("PUT /registries/:name — 400 if description missing", async () => {
    const res = await put("/registries/reg-1", {});
    expect(res.status).toBe(400);
  });

  // GetSchemaVersion
  it("GET versions/:versionNumber — gets a specific schema version", async () => {
    mockSend.mockResolvedValueOnce({
      SchemaVersionId: "v-id-1",
      VersionNumber: 2,
      Status: "AVAILABLE",
      SchemaDefinition: '{"type":"record"}',
      DataFormat: "AVRO",
    });
    const res = await get("/registries/reg-1/schemas/s-1/versions/2");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.version.versionNumber).toBe(2);
    expect(body.version.definition).toBe('{"type":"record"}');
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "GetSchemaVersionCommand",
        SchemaId: { RegistryName: "reg-1", SchemaName: "s-1" },
        SchemaVersionNumber: { VersionNumber: 2 },
      })
    );
  });

  // GetSchemaVersionsDiff
  it("GET versions-diff — returns diff", async () => {
    mockSend.mockResolvedValueOnce({ Diff: "some-diff" });
    const res = await get("/registries/reg-1/schemas/s-1/versions-diff?first=1&second=2");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.diff).toBe("some-diff");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "GetSchemaVersionsDiffCommand",
        SchemaId: { RegistryName: "reg-1", SchemaName: "s-1" },
        FirstSchemaVersionNumber: { VersionNumber: 1 },
        SecondSchemaVersionNumber: { VersionNumber: 2 },
        SchemaDiffType: "SYNTAX_DIFF",
      })
    );
  });

  it("GET versions-diff — 400 without first/second", async () => {
    const res = await get("/registries/reg-1/schemas/s-1/versions-diff?first=1");
    expect(res.status).toBe(400);
  });

  // CheckSchemaVersionValidity
  it("POST /schema-version-validity — returns validity", async () => {
    mockSend.mockResolvedValueOnce({ Valid: true, Error: undefined });
    const res = await post("/schema-version-validity", { dataFormat: "AVRO", definition: '{"type":"record"}' });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.valid).toBe(true);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "CheckSchemaVersionValidityCommand",
        DataFormat: "AVRO",
        SchemaDefinition: '{"type":"record"}',
      })
    );
  });

  it("POST /schema-version-validity — 400 without definition", async () => {
    const res = await post("/schema-version-validity", {});
    expect(res.status).toBe(400);
  });

  it("POST /schema-version-validity — defaults dataFormat to AVRO", async () => {
    mockSend.mockResolvedValueOnce({ Valid: true, Error: undefined });
    const res = await post("/schema-version-validity", { definition: '{"type":"record"}' });
    expect(res.status).toBe(200);
    expect(mockSend.mock.calls[0][0].DataFormat).toBe("AVRO");
  });

  // QuerySchemaVersionMetadata
  it("GET /schema-versions/:versionId/metadata — returns metadata map", async () => {
    mockSend.mockResolvedValueOnce({ MetadataInfoMap: { owner: { MetadataValue: "team" } }, SchemaVersionId: "v-id-1" });
    const res = await get("/schema-versions/v-id-1/metadata");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.metadataInfoMap.owner.MetadataValue).toBe("team");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ __cmdName: "QuerySchemaVersionMetadataCommand", SchemaVersionId: "v-id-1" })
    );
  });

  it("GET /schema-versions/:versionId/metadata — empty map", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/schema-versions/v-id-1/metadata");
    const body = await res.json();
    expect(body.metadataInfoMap).toEqual({});
  });

  // PutSchemaVersionMetadata
  it("POST /schema-versions/:versionId/metadata — adds metadata", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/schema-versions/v-id-1/metadata", { key: "owner", value: "team" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.added).toBe(true);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "PutSchemaVersionMetadataCommand",
        SchemaVersionId: "v-id-1",
        MetadataKeyValue: { MetadataKey: "owner", MetadataValue: "team" },
      })
    );
  });

  it("POST /schema-versions/:versionId/metadata — 400 without key/value", async () => {
    const res = await post("/schema-versions/v-id-1/metadata", { key: "owner" });
    expect(res.status).toBe(400);
  });

  // RemoveSchemaVersionMetadata
  it("POST /schema-versions/:versionId/metadata/delete — removes metadata", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/schema-versions/v-id-1/metadata/delete", { key: "owner", value: "team" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.removed).toBe(true);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "RemoveSchemaVersionMetadataCommand",
        SchemaVersionId: "v-id-1",
        MetadataKeyValue: { MetadataKey: "owner", MetadataValue: "team" },
      })
    );
  });

  it("POST /schema-versions/:versionId/metadata/delete — 400 without key/value", async () => {
    const res = await post("/schema-versions/v-id-1/metadata/delete", { value: "team" });
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

  it("GET /databases/:dbName/functions/:funcName — 404 when function not found", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/databases/mydb/functions/missing");
    expect(res.status).toBe(404);
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

  it("GET /databases/:dbName/tables/:tableName/column-stats — sparse response defaults to empty array", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/databases/mydb/tables/tbl1/column-stats");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(0);
    expect(body.columnStats).toEqual([]);
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

  it("GET with values — sparse response defaults to empty array", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/databases/mydb/tables/tbl1/partitions/column-stats?values=2024");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(0);
    expect(body.columnStats).toEqual([]);
  });

  it("GET with values — error returns empty", async () => {
    mockSend.mockRejectedValueOnce(new Error("not found"));
    const res = await get("/databases/mydb/tables/tbl1/partitions/column-stats?values=2024");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(0);
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

  it("POST partitions/column-stats — 400 without partitionValues", async () => {
    const res = await post("/databases/mydb/tables/tbl1/partitions/column-stats", {
      columnStatisticsList: [{ ColumnName: "col1" }],
    });
    expect(res.status).toBe(400);
  });

  it("POST partitions/column-stats — 400 without columnStatisticsList", async () => {
    const res = await post("/databases/mydb/tables/tbl1/partitions/column-stats", {
      partitionValues: ["2024"],
    });
    expect(res.status).toBe(400);
  });

  it("DELETE partitions/column-stats — deletes partition stat", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await router.request("/databases/mydb/tables/tbl1/partitions/column-stats?column=col1&values=2024", { method: "DELETE" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
  });

  it("DELETE partitions/column-stats — 400 without column", async () => {
    const res = await router.request("/databases/mydb/tables/tbl1/partitions/column-stats?values=2024", { method: "DELETE" });
    expect(res.status).toBe(400);
  });

  it("DELETE partitions/column-stats — 400 without values", async () => {
    const res = await router.request("/databases/mydb/tables/tbl1/partitions/column-stats?column=col1", { method: "DELETE" });
    expect(res.status).toBe(400);
  });

  // Partitions
  it("GET /databases/:dbName/tables/:tableName/partitions — lists partitions", async () => {
    mockSend.mockResolvedValueOnce({
      Partitions: [
        { Values: ["2024", "01"], DatabaseName: "mydb", TableName: "tbl1", StorageDescriptor: { Location: "s3://b/p/" }, CreationTime: new Date() },
      ],
    });
    const res = await get("/databases/mydb/tables/tbl1/partitions");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.partitions[0].values).toEqual(["2024", "01"]);
    expect(body.partitions[0].location).toBe("s3://b/p/");
  });

  it("GET /databases/:dbName/tables/:tableName/partitions — passes expression", async () => {
    mockSend.mockResolvedValueOnce({ Partitions: [] });
    const res = await get("/databases/mydb/tables/tbl1/partitions?expression=year%3D2024");
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({ Expression: "year=2024" }));
  });

  it("GET /databases/:dbName/tables/:tableName/partitions — sparse response and partition without Values", async () => {
    mockSend.mockResolvedValueOnce({ Partitions: [{ DatabaseName: "mydb", TableName: "tbl1" }] });
    const res = await get("/databases/mydb/tables/tbl1/partitions");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.partitions[0].values).toEqual([]);
    expect(body.partitions[0].location).toBeNull();
    expect(body.partitions[0].parameters).toEqual({});
  });

  it("GET /databases/:dbName/tables/:tableName/partitions — sparse response defaults to empty array", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/databases/mydb/tables/tbl1/partitions");
    const body = await res.json();
    expect(body.total).toBe(0);
    expect(body.partitions).toEqual([]);
  });

  it("GET partitions/get — returns a single partition", async () => {
    mockSend.mockResolvedValueOnce({ Partition: { Values: ["2024"], DatabaseName: "mydb", TableName: "tbl1" } });
    const res = await get("/databases/mydb/tables/tbl1/partitions/get?values=2024");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.partition.values).toEqual(["2024"]);
  });

  it("GET partitions/get — 400 without values", async () => {
    const res = await get("/databases/mydb/tables/tbl1/partitions/get");
    expect(res.status).toBe(400);
  });

  it("GET partitions/get — 404 when not found", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/databases/mydb/tables/tbl1/partitions/get?values=2024");
    expect(res.status).toBe(404);
  });

  it("POST partitions — batch creates partitions", async () => {
    mockSend.mockResolvedValueOnce({ Errors: [] });
    const res = await post("/databases/mydb/tables/tbl1/partitions", {
      partitionInputList: [{ Values: ["2024", "01"] }],
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.created).toBe(true);
    expect(body.errors).toEqual([]);
  });

  it("POST partitions — 400 without partitionInputList", async () => {
    const res = await post("/databases/mydb/tables/tbl1/partitions", {});
    expect(res.status).toBe(400);
  });

  it("POST partitions — sparse response defaults errors to empty array", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/databases/mydb/tables/tbl1/partitions", {
      partitionInputList: [{ Values: ["2024"] }],
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.created).toBe(true);
    expect(body.errors).toEqual([]);
  });

  it("POST partitions/batch-get — returns partitions", async () => {
    mockSend.mockResolvedValueOnce({ Partitions: [{ Values: ["2024"] }], UnprocessedKeys: [] });
    const res = await post("/databases/mydb/tables/tbl1/partitions/batch-get", {
      partitionsToGet: [{ Values: ["2024"] }],
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
  });

  it("POST partitions/batch-get — 400 without partitionsToGet", async () => {
    const res = await post("/databases/mydb/tables/tbl1/partitions/batch-get", {});
    expect(res.status).toBe(400);
  });

  it("POST partitions/batch-get — sparse response defaults to empty arrays", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/databases/mydb/tables/tbl1/partitions/batch-get", {
      partitionsToGet: [{ Values: ["2024"] }],
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(0);
    expect(body.partitions).toEqual([]);
    expect(body.unprocessedKeys).toEqual([]);
  });

  it("POST partitions/batch-update — batch updates partitions", async () => {
    mockSend.mockResolvedValueOnce({ Errors: [] });
    const res = await post("/databases/mydb/tables/tbl1/partitions/batch-update", {
      entries: [{ PartitionValueList: ["2024"], PartitionInput: { Values: ["2024"] } }],
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.updated).toBe(true);
    expect(body.errors).toEqual([]);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "BatchUpdatePartitionCommand",
        DatabaseName: "mydb",
        TableName: "tbl1",
        Entries: [{ PartitionValueList: ["2024"], PartitionInput: { Values: ["2024"] } }],
      })
    );
  });

  it("POST partitions/batch-update — 400 without entries", async () => {
    const res = await post("/databases/mydb/tables/tbl1/partitions/batch-update", {});
    expect(res.status).toBe(400);
  });

  it("POST partitions/batch-update — sparse response defaults errors to empty array", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/databases/mydb/tables/tbl1/partitions/batch-update", {
      entries: [{ PartitionValueList: ["2024"], PartitionInput: { Values: ["2024"] } }],
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.updated).toBe(true);
    expect(body.errors).toEqual([]);
  });

  it("PUT partitions — updates a partition", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await router.request("/databases/mydb/tables/tbl1/partitions", {
      method: "PUT",
      body: JSON.stringify({ partitionValueList: ["2024"], partitionInput: { Values: ["2024"] } }),
      headers: { "content-type": "application/json" },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.updated).toBe(true);
  });

  it("PUT partitions — 400 without partitionValueList", async () => {
    const res = await router.request("/databases/mydb/tables/tbl1/partitions", {
      method: "PUT",
      body: JSON.stringify({ partitionInput: {} }),
      headers: { "content-type": "application/json" },
    });
    expect(res.status).toBe(400);
  });

  it("PUT partitions — 400 without partitionInput", async () => {
    const res = await router.request("/databases/mydb/tables/tbl1/partitions", {
      method: "PUT",
      body: JSON.stringify({ partitionValueList: ["2024"] }),
      headers: { "content-type": "application/json" },
    });
    expect(res.status).toBe(400);
  });

  it("DELETE partitions — deletes a partition", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await router.request("/databases/mydb/tables/tbl1/partitions?values=2024&values=01", { method: "DELETE" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
    expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({ PartitionValues: ["2024", "01"] }));
  });

  it("DELETE partitions — 400 without values", async () => {
    const res = await router.request("/databases/mydb/tables/tbl1/partitions", { method: "DELETE" });
    expect(res.status).toBe(400);
  });
});
