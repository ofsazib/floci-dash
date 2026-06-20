import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const mockRDSData = vi.hoisted(() =>
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

vi.mock("@aws-sdk/client-rds-data", () => ({
  RDSDataClient: mockRDSData,
  ExecuteStatementCommand: createCmd("ExecuteStatementCommand"),
  BeginTransactionCommand: createCmd("BeginTransactionCommand"),
  CommitTransactionCommand: createCmd("CommitTransactionCommand"),
  RollbackTransactionCommand: createCmd("RollbackTransactionCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./rdsdata";

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

describe("RDS Data API — Execute", () => {
  it("POST /execute — 400 when sql missing", async () => {
    const res = await post("/execute", { resourceArn: "arn:rds:cluster", secretArn: "arn:secret" });
    expect(res.status).toBe(400);
  });

  it("POST /execute — 400 when resourceArn missing", async () => {
    const res = await post("/execute", { sql: "SELECT 1", secretArn: "arn:secret" });
    expect(res.status).toBe(400);
  });

  it("POST /execute — 400 when secretArn missing", async () => {
    const res = await post("/execute", { sql: "SELECT 1", resourceArn: "arn:rds:cluster" });
    expect(res.status).toBe(400);
  });

  it("POST /execute — executes statement", async () => {
    mockSend.mockResolvedValueOnce({ records: [["result"]], columnMetadata: [{ name: "col1" }], numberOfRecordsUpdated: 0 });
    const res = await post("/execute", { sql: "SELECT 1", resourceArn: "arn:rds:cluster", secretArn: "arn:secret" });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.records).toEqual([["result"]]);
    expect(json.columnMetadata).toEqual([{ name: "col1" }]);
    expect(json.numberOfRecordsUpdated).toBe(0);
  });
});

describe("RDS Data API — Transactions", () => {
  it("POST /begin-transaction — 400 when resourceArn missing", async () => {
    const res = await post("/begin-transaction", { secretArn: "arn:secret" });
    expect(res.status).toBe(400);
  });

  it("POST /begin-transaction — 400 when secretArn missing", async () => {
    const res = await post("/begin-transaction", { resourceArn: "arn:rds:cluster" });
    expect(res.status).toBe(400);
  });

  it("POST /begin-transaction — begins transaction", async () => {
    mockSend.mockResolvedValueOnce({ transactionId: "tx-1" });
    const res = await post("/begin-transaction", { resourceArn: "arn:rds:cluster", secretArn: "arn:secret" });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.transactionId).toBe("tx-1");
  });

  it("POST /commit-transaction — 400 when transactionId missing", async () => {
    const res = await post("/commit-transaction", { resourceArn: "arn:rds:cluster", secretArn: "arn:secret" });
    expect(res.status).toBe(400);
  });

  it("POST /commit-transaction — 400 when resourceArn missing", async () => {
    const res = await post("/commit-transaction", { transactionId: "tx-1", secretArn: "arn:secret" });
    expect(res.status).toBe(400);
  });

  it("POST /commit-transaction — 400 when secretArn missing", async () => {
    const res = await post("/commit-transaction", { transactionId: "tx-1", resourceArn: "arn:rds:cluster" });
    expect(res.status).toBe(400);
  });

  it("POST /commit-transaction — commits transaction", async () => {
    mockSend.mockResolvedValueOnce({ transactionStatus: "COMMITTED" });
    const res = await post("/commit-transaction", { transactionId: "tx-1", resourceArn: "arn:rds:cluster", secretArn: "arn:secret" });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.transactionStatus).toBe("COMMITTED");
  });

  it("POST /rollback-transaction — 400 when transactionId missing", async () => {
    const res = await post("/rollback-transaction", { resourceArn: "arn:rds:cluster", secretArn: "arn:secret" });
    expect(res.status).toBe(400);
  });

  it("POST /rollback-transaction — 400 when resourceArn missing", async () => {
    const res = await post("/rollback-transaction", { transactionId: "tx-1", secretArn: "arn:secret" });
    expect(res.status).toBe(400);
  });

  it("POST /rollback-transaction — 400 when secretArn missing", async () => {
    const res = await post("/rollback-transaction", { transactionId: "tx-1", resourceArn: "arn:rds:cluster" });
    expect(res.status).toBe(400);
  });

  it("POST /rollback-transaction — rolls back transaction", async () => {
    mockSend.mockResolvedValueOnce({ transactionStatus: "ROLLED_BACK" });
    const res = await post("/rollback-transaction", { transactionId: "tx-1", resourceArn: "arn:rds:cluster", secretArn: "arn:secret" });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.transactionStatus).toBe("ROLLED_BACK");
  });
});
