import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const mockRedshiftData = vi.hoisted(() =>
  vi.fn(function () {
    return { send: mockSend };
  })
);

const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) {
      return { __cmdName: name, ...args };
    });
  };
});

vi.mock("@aws-sdk/client-redshift-data", () => ({
  RedshiftDataClient: mockRedshiftData,
  ExecuteStatementCommand: createCmd("ExecuteStatementCommand"),
  BatchExecuteStatementCommand: createCmd("BatchExecuteStatementCommand"),
  DescribeStatementCommand: createCmd("DescribeStatementCommand"),
  GetStatementResultCommand: createCmd("GetStatementResultCommand"),
  ListStatementsCommand: createCmd("ListStatementsCommand"),
  CancelStatementCommand: createCmd("CancelStatementCommand"),
  ListDatabasesCommand: createCmd("ListDatabasesCommand"),
  ListSchemasCommand: createCmd("ListSchemasCommand"),
  ListTablesCommand: createCmd("ListTablesCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./redshiftdata";

async function get(path: string) {
  return router.request(path, { method: "GET" });
}

async function post(path: string, body?: any) {
  return router.request(path, {
    method: "POST",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { "content-type": "application/json" } : undefined,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSend.mockReset();
});

describe("POST /query", () => {
  it("executes a statement", async () => {
    mockSend.mockResolvedValueOnce({
      Id: "st-1",
      ClusterIdentifier: "c1",
      Database: "dev",
      HasResultSet: true,
    });
    const res = await post("/query", {
      clusterIdentifier: "c1",
      database: "dev",
      dbUser: "admin",
      sql: "SELECT 1",
    });
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.id).toBe("st-1");
    expect(json.hasResultSet).toBe(true);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "ExecuteStatementCommand",
        ClusterIdentifier: "c1",
        Database: "dev",
        DbUser: "admin",
        Sql: "SELECT 1",
      })
    );
  });

  it("400 when sql missing", async () => {
    expect(
      (await post("/query", { database: "dev", clusterIdentifier: "c1" })).status
    ).toBe(400);
  });

  it("400 when database missing", async () => {
    expect((await post("/query", { sql: "SELECT 1", clusterIdentifier: "c1" })).status).toBe(400);
  });

  it("400 when clusterIdentifier missing", async () => {
    expect((await post("/query", { sql: "SELECT 1", database: "dev" })).status).toBe(400);
  });

  it("400 when dbUser missing", async () => {
    expect(
      (await post("/query", { sql: "SELECT 1", database: "dev", clusterIdentifier: "c1" })).status
    ).toBe(400);
  });
});

describe("POST /query/batch", () => {
  it("executes a batch", async () => {
    mockSend.mockResolvedValueOnce({ Id: "batch-1" });
    const res = await post("/query/batch", {
      clusterIdentifier: "c1",
      database: "dev",
      dbUser: "admin",
      sqls: ["SELECT 1", "SELECT 2"],
    });
    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.id).toBe("batch-1");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "BatchExecuteStatementCommand",
        Sqls: ["SELECT 1", "SELECT 2"],
      })
    );
  });

  it("400 when sqls missing or empty", async () => {
    expect((await post("/query/batch", { database: "dev", clusterIdentifier: "c1" })).status).toBe(400);
    expect(
      (await post("/query/batch", { sqls: [], database: "dev", clusterIdentifier: "c1" })).status
    ).toBe(400);
  });

  it("400 when database or cluster missing", async () => {
    expect((await post("/query/batch", { sqls: ["SELECT 1"], clusterIdentifier: "c1" })).status).toBe(400);
    expect((await post("/query/batch", { sqls: ["SELECT 1"], database: "dev" })).status).toBe(400);
  });

  it("400 when dbUser missing", async () => {
    expect(
      (await post("/query/batch", { sqls: ["SELECT 1"], database: "dev", clusterIdentifier: "c1" })).status
    ).toBe(400);
  });
});

describe("GET /statements", () => {
  it("lists statements", async () => {
    mockSend.mockResolvedValueOnce({
      Statements: [{ Id: "st-1", Status: "FINISHED", QueryString: "SELECT 1" }],
    });
    const res = await get("/statements");
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.total).toBe(1);
    expect(json.statements[0].Status).toBe("FINISHED");
  });

  it("returns sparse statements", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/statements");
    const json = await res.json();
    expect(json.statements).toEqual([]);
    expect(json.total).toBe(0);
  });
});

describe("GET /statements/:id", () => {
  it("describes a statement", async () => {
    mockSend.mockResolvedValueOnce({
      Id: "st-1",
      Status: "FINISHED",
      QueryString: "SELECT 1",
      Duration: 5,
      ResultRows: 1,
      HasResultSet: true,
      Database: "dev",
    });
    const res = await get("/statements/st-1");
    const json = await res.json();
    expect(json.status).toBe("FINISHED");
    expect(json.hasResultSet).toBe(true);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "DescribeStatementCommand",
        Id: "st-1",
      })
    );
  });

  it("nulls optional fields when absent", async () => {
    mockSend.mockResolvedValueOnce({ Id: "st-1", Status: "FAILED" });
    const res = await get("/statements/st-1");
    const json = await res.json();
    expect(json.error).toBeNull();
    expect(json.clusterIdentifier).toBeNull();
  });
});

describe("GET /statements/:id/result", () => {
  it("returns columns and records", async () => {
    mockSend.mockResolvedValueOnce({
      ColumnMetadata: [{ name: "a", typeName: "integer" }],
      Records: [[{ longValue: 1 }]],
      TotalNumRows: 1,
    });
    const res = await get("/statements/st-1/result");
    const json = await res.json();
    expect(json.columns).toEqual([{ name: "a", typeName: "integer" }]);
    expect(json.records).toEqual([[{ longValue: 1 }]]);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "GetStatementResultCommand",
        Id: "st-1",
      })
    );
  });

  it("returns sparse columns and records", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/statements/st-1/result");
    const json = await res.json();
    expect(json.columns).toEqual([]);
    expect(json.records).toEqual([]);
    expect(json.totalNumRows).toBe(0);
  });
});

describe("POST /statements/:id/cancel", () => {
  it("cancels a statement", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/statements/st-1/cancel");
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "CancelStatementCommand",
        Id: "st-1",
      })
    );
  });
});

describe("catalog", () => {
  it("lists databases for a cluster", async () => {
    mockSend.mockResolvedValueOnce({ Databases: ["dev", "postgres"] });
    const res = await get("/databases?cluster=c1&dbUser=admin");
    const json = await res.json();
    expect(json.databases).toEqual(["dev", "postgres"]);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "ListDatabasesCommand",
        ClusterIdentifier: "c1",
        Database: "dev",
        DbUser: "admin",
      })
    );
  });

  it("400 databases without cluster", async () => {
    expect((await get("/databases")).status).toBe(400);
  });

  it("400 databases without dbUser", async () => {
    expect((await get("/databases?cluster=c1")).status).toBe(400);
  });

  it("lists schemas for cluster and database", async () => {
    mockSend.mockResolvedValueOnce({ Schemas: ["public", "information_schema"] });
    const res = await get("/schemas?cluster=c1&database=dev&dbUser=admin");
    const json = await res.json();
    expect(json.schemas).toContain("public");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "ListSchemasCommand",
        Database: "dev",
        DbUser: "admin",
      })
    );
  });

  it("400 schemas without database", async () => {
    expect((await get("/schemas?cluster=c1")).status).toBe(400);
  });

  it("400 schemas without dbUser", async () => {
    expect((await get("/schemas?cluster=c1&database=dev")).status).toBe(400);
  });

  it("lists tables for a schema", async () => {
    mockSend.mockResolvedValueOnce({
      Tables: [{ name: "t1", type: "TABLE", schema: "public" }],
    });
    const res = await get("/tables?cluster=c1&database=dev&schema=public&dbUser=admin");
    const json = await res.json();
    expect(json.tables[0].name).toBe("t1");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "ListTablesCommand",
        SchemaPattern: "public",
        DbUser: "admin",
      })
    );
  });

  it("400 tables without schema", async () => {
    expect((await get("/tables?cluster=c1&database=dev")).status).toBe(400);
  });

  it("400 tables without dbUser", async () => {
    expect((await get("/tables?cluster=c1&database=dev&schema=public")).status).toBe(400);
  });

  it("returns sparse databases", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/databases?cluster=c1&dbUser=admin");
    const json = await res.json();
    expect(json.databases).toEqual([]);
  });
});
