import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const mockDynamoClient = vi.hoisted(() =>
  vi.fn(function () { return { send: mockSend }; })
);

const mockMarshall = vi.hoisted(() => vi.fn((v) => v));
const mockUnmarshall = vi.hoisted(() => vi.fn((v) => v));

vi.mock("@aws-sdk/client-dynamodb", () => ({
  DynamoDBClient: mockDynamoClient,
  UpdateItemCommand: vi.fn(function(args) { return args; }),
  BatchGetItemCommand: vi.fn(function(args) { return args; }),
  BatchWriteItemCommand: vi.fn(function(args) { return args; }),
  TransactGetItemsCommand: vi.fn(function(args) { return args; }),
  TransactWriteItemsCommand: vi.fn(function(args) { return args; }),
  DescribeTimeToLiveCommand: vi.fn(function(args) { return args; }),
  UpdateTimeToLiveCommand: vi.fn(function(args) { return args; }),
  TagResourceCommand: vi.fn(function(args) { return args; }),
  UntagResourceCommand: vi.fn(function(args) { return args; }),
  ListTagsOfResourceCommand: vi.fn(function(args) { return args; }),
  DescribeContinuousBackupsCommand: vi.fn(function(args) { return args; }),
  UpdateContinuousBackupsCommand: vi.fn(function(args) { return args; }),
  ExecuteStatementCommand: vi.fn(function(args) { return args; }),
}));

vi.mock("@aws-sdk/util-dynamodb", () => ({
  marshall: mockMarshall,
  unmarshall: mockUnmarshall,
}));

import router from "./dynamodb-advanced";

type ReqInit = { method: string; body?: string; headers?: Record<string, string> };

async function get(path: string) {
  return router.request(path, { method: "GET" });
}

async function post(path: string, body?: any) {
  const init: ReqInit = { method: "POST" };
  if (body != null) {
    init.body = JSON.stringify(body);
    init.headers = { "content-type": "application/json" };
  }
  return router.request(path, init);
}

async function put(path: string, body?: any) {
  const init: ReqInit = { method: "PUT" };
  if (body != null) {
    init.body = JSON.stringify(body);
    init.headers = { "content-type": "application/json" };
  }
  return router.request(path, init);
}

async function del(path: string) {
  return router.request(path, { method: "DELETE" });
}

beforeEach(() => {
  mockSend.mockReset();
  mockSend.mockResolvedValue({});
  mockDynamoClient.mockClear();
  mockMarshall.mockImplementation((v) => v);
  mockUnmarshall.mockImplementation((v) => v);
});

describe("DynamoDB Advanced", () => {
  describe("Update Item", () => {
    it("POST /tables/:name/items/update — updates item", async () => {
      mockSend.mockResolvedValueOnce({ Attributes: { key: { S: "val" } } });
      mockUnmarshall.mockReturnValueOnce({ key: "val" });
      const res = await post("/tables/my-table/items/update", {
        key: { pk: "123" },
        updates: { status: "active", count: 5 },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.TableName).toBe("my-table");
      expect(cmd.UpdateExpression).toContain("SET");
    });

    it("POST /tables/:name/items/update — with condition expression", async () => {
      mockSend.mockResolvedValueOnce({ Attributes: {} });
      const res = await post("/tables/my-table/items/update", {
        key: { pk: "123" },
        updates: { status: "active" },
        conditionExpression: "attribute_exists(pk)",
      });
      expect(res.status).toBe(200);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.ConditionExpression).toBe("attribute_exists(pk)");
    });

    it("POST /tables/:name/items/update — 400 when key missing", async () => {
      const res = await post("/tables/my-table/items/update", { updates: { x: 1 } });
      expect(res.status).toBe(400);
    });

    it("POST /tables/:name/items/update — 400 when updates missing", async () => {
      const res = await post("/tables/my-table/items/update", { key: { pk: "1" } });
      expect(res.status).toBe(400);
    });
  });

  describe("Batch Get / Write", () => {
    it("POST /batch-get — gets items", async () => {
      mockSend.mockResolvedValueOnce({
        Responses: { "my-table": [{ key: { S: "123" } }] },
        UnprocessedKeys: {},
      });
      mockUnmarshall.mockReturnValueOnce({ key: "123" });
      const res = await post("/batch-get", {
        requests: [{ tableName: "my-table", keys: [{ pk: "123" }] }],
      });
      expect(res.status).toBe(200);
    });

    it("POST /batch-get — 400 when requests missing", async () => {
      const res = await post("/batch-get", {});
      expect(res.status).toBe(400);
    });

    it("POST /batch-write — writes items (put)", async () => {
      mockSend.mockResolvedValueOnce({ UnprocessedItems: {} });
      const res = await post("/batch-write", {
        requests: [{ tableName: "my-table", type: "put", item: { pk: "123" } }],
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.wrote).toBe(1);
    });

    it("POST /batch-write — writes items (delete)", async () => {
      mockSend.mockResolvedValueOnce({ UnprocessedItems: {} });
      const res = await post("/batch-write", {
        requests: [{ tableName: "my-table", type: "delete", key: { pk: "123" } }],
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.wrote).toBe(1);
      expect(mockSend.mock.calls[0][0].RequestItems["my-table"][0].DeleteRequest).toBeDefined();
    });

    it("POST /batch-write — 400 when requests missing", async () => {
      const res = await post("/batch-write", {});
      expect(res.status).toBe(400);
    });
  });

  describe("Transactions", () => {
    it("POST /transaction/get — gets items", async () => {
      mockSend.mockResolvedValueOnce({
        Responses: [{ Item: { key: { S: "val" } } }],
      });
      mockUnmarshall.mockReturnValueOnce({ key: "val" });
      const res = await post("/transaction/get", {
        items: [{ tableName: "my-table", key: { pk: "123" } }],
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.responses).toBeDefined();
    });

    it("POST /transaction/get — 400 when items missing", async () => {
      const res = await post("/transaction/get", {});
      expect(res.status).toBe(400);
    });

    it("POST /transaction/write — writes items (put)", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/transaction/write", {
        items: [{ type: "put", tableName: "my-table", item: { pk: "123" } }],
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.written).toBe(1);
    });

    it("POST /transaction/write — writes items (delete)", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/transaction/write", {
        items: [{ type: "delete", tableName: "my-table", key: { pk: "123" } }],
      });
      expect(res.status).toBe(200);
      expect((await res.json()).written).toBe(1);
    });

    it("POST /transaction/write — writes items (update)", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/transaction/write", {
        items: [{ type: "update", tableName: "my-table", key: { pk: "123" }, updates: { status: "active" } }],
      });
      expect(res.status).toBe(200);
      expect((await res.json()).written).toBe(1);
      expect(mockSend.mock.calls[0][0].TransactItems[0].Update).toBeDefined();
    });

    it("POST /transaction/write — 400 when items missing", async () => {
      const res = await post("/transaction/write", {});
      expect(res.status).toBe(400);
    });
  });

  describe("TTL", () => {
    it("GET /tables/:name/ttl — returns TTL config", async () => {
      mockSend.mockResolvedValueOnce({
        TimeToLiveDescription: { TimeToLiveStatus: "ENABLED", AttributeName: "expire" },
      });
      const res = await get("/tables/my-table/ttl");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe("ENABLED");
    });

    it("PUT /tables/:name/ttl — enables TTL", async () => {
      mockSend.mockResolvedValueOnce({ TimeToLiveSpecification: {} });
      const res = await put("/tables/my-table/ttl", {
        enabled: true,
        attributeName: "expire",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.TableName).toBe("my-table");
      expect(cmd.TimeToLiveSpecification.Enabled).toBe(true);
      expect(cmd.TimeToLiveSpecification.AttributeName).toBe("expire");
    });

    it("PUT /tables/:name/ttl — disables TTL", async () => {
      mockSend.mockResolvedValueOnce({ TimeToLiveSpecification: {} });
      const res = await put("/tables/my-table/ttl", { enabled: false, attributeName: "expire" });
      expect(res.status).toBe(200);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.TimeToLiveSpecification.Enabled).toBe(false);
    });
  });

  describe("Tags", () => {
    it("GET /tables/:name/tags — lists tags", async () => {
      mockSend.mockResolvedValueOnce({ Tags: [{ Key: "env", Value: "prod" }] });
      const res = await get("/tables/my-table/tags");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.tags).toHaveLength(1);
    });

    it("POST /tables/:name/tags — tags resource", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/tables/my-table/tags", {
        tags: [{ Key: "env", Value: "prod" }],
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
    });

    it("DELETE /tables/:name/tags/:tagKey — untags resource", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/tables/my-table/tags/env");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });
  });

  describe("Backups", () => {
    it("GET /tables/:name/backups — returns backup config", async () => {
      mockSend.mockResolvedValueOnce({
        ContinuousBackupsDescription: {
          ContinuousBackupsStatus: "ENABLED",
          PointInTimeRecoveryDescription: { PointInTimeRecoveryStatus: "ENABLED" },
        },
      });
      const res = await get("/tables/my-table/backups");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.pointInTimeRecovery.enabled).toBe(true);
    });

    it("PUT /tables/:name/backups — enables PITR", async () => {
      mockSend.mockResolvedValueOnce({ ContinuousBackupsDescription: {} });
      const res = await put("/tables/my-table/backups", {
        pointInTimeRecovery: true,
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.TableName).toBe("my-table");
      expect(cmd.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });

    it("PUT /tables/:name/backups — disables PITR", async () => {
      mockSend.mockResolvedValueOnce({ ContinuousBackupsDescription: {} });
      const res = await put("/tables/my-table/backups", {
        pointInTimeRecovery: false,
      });
      expect(res.status).toBe(200);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(false);
    });
  });

  describe("PartiQL", () => {
    it("POST /partiql/execute — executes statement", async () => {
      mockSend.mockResolvedValueOnce({
        Items: [{ pk: { S: "123" } }],
      });
      mockUnmarshall.mockReturnValueOnce({ pk: "123" });
      const res = await post("/partiql/execute", {
        statement: "SELECT * FROM my-table WHERE pk = ?",
        parameters: [{ S: "123" }],
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.items).toBeDefined();
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.Statement).toBe("SELECT * FROM my-table WHERE pk = ?");
    });

    it("POST /partiql/execute — without parameters", async () => {
      mockSend.mockResolvedValueOnce({ Items: [] });
      const res = await post("/partiql/execute", {
        statement: "SELECT * FROM my-table",
      });
      expect(res.status).toBe(200);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.Statement).toBe("SELECT * FROM my-table");
      expect(cmd.Parameters).toBeUndefined();
    });

    it("POST /partiql/execute — 400 when statement missing", async () => {
      const res = await post("/partiql/execute", {});
      expect(res.status).toBe(400);
    });

    it("POST /partiql/execute — with consistentRead and nextToken", async () => {
      mockSend.mockResolvedValueOnce({ Items: [], NextToken: "next-token" });
      const res = await post("/partiql/execute", {
        statement: "SELECT * FROM my-table",
        consistentRead: true,
        nextToken: "prev-token",
      });
      expect(res.status).toBe(200);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.ConsistentRead).toBe(true);
      expect(cmd.NextToken).toBe("prev-token");
      const body = await res.json();
      expect(body.nextToken).toBe("next-token");
    });
  });
});
