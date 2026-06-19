import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());
const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) { return { __cmdName: name, ...args }; });
  };
});

vi.mock("@aws-sdk/client-athena", () => ({
  AthenaClient: vi.fn(function () { return { send: mockSend }; }),
  ListWorkGroupsCommand: createCmd("ListWorkGroupsCommand"),
  CreateWorkGroupCommand: createCmd("CreateWorkGroupCommand"),
  DeleteWorkGroupCommand: createCmd("DeleteWorkGroupCommand"),
  ListQueryExecutionsCommand: createCmd("ListQueryExecutionsCommand"),
  GetQueryExecutionCommand: createCmd("GetQueryExecutionCommand"),
  StopQueryExecutionCommand: createCmd("StopQueryExecutionCommand"),
  ListDataCatalogsCommand: createCmd("ListDataCatalogsCommand"),
  GetDataCatalogCommand: createCmd("GetDataCatalogCommand"),
  ListDatabasesCommand: createCmd("ListDatabasesCommand"),
  ListTableMetadataCommand: createCmd("ListTableMetadataCommand"),
}));

vi.mock("../../clients/aws", () => ({ create: (Ctor: any, extra?: any) => new Ctor(extra) }));

import router from "./athena";

async function get(p: string) { return router.request(p, { method: "GET" }); }
async function post(p: string, b?: any) {
  return router.request(p, { method: "POST", body: b != null ? JSON.stringify(b) : undefined, headers: b != null ? { "content-type": "application/json" } : undefined });
}
async function del(p: string) { return router.request(p, { method: "DELETE" }); }

beforeEach(() => mockSend.mockReset());

describe("Athena Routes", () => {
  it("GET /work-groups — lists work groups", async () => {
    mockSend.mockResolvedValueOnce({ WorkGroups: [{ Name: "primary", State: "ENABLED" }] });
    const res = await get("/work-groups");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
  });

  it("GET /work-groups — empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/work-groups");
    const body = await res.json();
    expect(body.total).toBe(0);
  });

  it("POST /work-groups — creates work group (201)", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/work-groups", { name: "my-wg" });
    expect(res.status).toBe(201);
  });

  it("POST /work-groups — 400 if name missing", async () => {
    const res = await post("/work-groups", {});
    expect(res.status).toBe(400);
  });

  it("DELETE /work-groups/:name — deletes work group", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/work-groups/my-wg");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
  });

  it("GET /query-executions — lists IDs", async () => {
    mockSend.mockResolvedValueOnce({ QueryExecutionIds: ["qe-1", "qe-2"] });
    const res = await get("/query-executions");
    const body = await res.json();
    expect(body.total).toBe(2);
  });

  it("GET /query-executions — empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/query-executions");
    const body = await res.json();
    expect(body.total).toBe(0);
  });

  it("GET /query-executions/:id — gets execution", async () => {
    mockSend.mockResolvedValueOnce({ QueryExecution: { QueryExecutionId: "qe-1", Status: { State: "SUCCEEDED" } } });
    const res = await get("/query-executions/qe-1");
    expect(res.status).toBe(200);
  });

  it("POST /query-executions/:id/stop — stops query", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/query-executions/qe-1/stop");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.stopped).toBe(true);
  });

  it("GET /data-catalogs — lists catalogs", async () => {
    mockSend.mockResolvedValueOnce({ DataCatalogsSummary: [{ CatalogName: "AwsDataCatalog", Type: "GLUE" }] });
    const res = await get("/data-catalogs");
    const body = await res.json();
    expect(body.total).toBe(1);
  });

  it("GET /data-catalogs/:name — gets catalog", async () => {
    mockSend.mockResolvedValueOnce({ DataCatalog: { Name: "AwsDataCatalog", Type: "GLUE" } });
    const res = await get("/data-catalogs/AwsDataCatalog");
    expect(res.status).toBe(200);
  });

  it("GET /databases — lists databases", async () => {
    mockSend.mockResolvedValueOnce({ DatabaseList: [{ Name: "default" }] });
    const res = await get("/databases");
    const body = await res.json();
    expect(body.total).toBe(1);
  });

  it("GET /databases/:dbName/tables — lists tables", async () => {
    mockSend.mockResolvedValueOnce({ TableMetadataList: [{ Name: "my_table" }] });
    const res = await get("/databases/default/tables");
    const body = await res.json();
    expect(body.total).toBe(1);
  });
});
