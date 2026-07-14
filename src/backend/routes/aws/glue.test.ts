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
});
