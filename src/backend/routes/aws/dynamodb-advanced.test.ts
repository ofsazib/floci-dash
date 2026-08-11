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
  UpdateTableCommand: vi.fn(function(args) { return args; }),
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
  ExecuteTransactionCommand: vi.fn(function(args) { return args; }),
  BatchExecuteStatementCommand: vi.fn(function(args) { return args; }),
  ExportTableToPointInTimeCommand: vi.fn(function(args) { return args; }),
  ListExportsCommand: vi.fn(function(args) { return args; }),
  DescribeExportCommand: vi.fn(function(args) { return args; }),
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
  describe("UpdateTable", () => {
    it("PUT /tables/:name/update — updates billing mode to PAY_PER_REQUEST", async () => {
      mockSend.mockResolvedValueOnce({
        TableDescription: { TableStatus: "UPDATING", BillingModeSummary: { BillingMode: "PAY_PER_REQUEST" } },
      });
      const res = await put("/tables/my-table/update", {
        BillingMode: "PAY_PER_REQUEST",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
      expect(body.billingMode).toBe("PAY_PER_REQUEST");
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.TableName).toBe("my-table");
      expect(cmd.BillingMode).toBe("PAY_PER_REQUEST");
    });

    it("PUT /tables/:name/update — updates provisioned throughput", async () => {
      mockSend.mockResolvedValueOnce({ TableDescription: { TableStatus: "ACTIVE" } });
      const res = await put("/tables/my-table/update", {
        ProvisionedThroughput: { ReadCapacityUnits: 10, WriteCapacityUnits: 5 },
      });
      expect(res.status).toBe(200);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.ProvisionedThroughput.ReadCapacityUnits).toBe(10);
      expect(cmd.ProvisionedThroughput.WriteCapacityUnits).toBe(5);
    });

    it("PUT /tables/:name/update — enables SSE with KMS key", async () => {
      mockSend.mockResolvedValueOnce({ TableDescription: { TableStatus: "UPDATING" } });
      const res = await put("/tables/my-table/update", {
        SSESpecification: { Enabled: true, SSEType: "KMS", KMSMasterKeyId: "arn:aws:kms:..." },
      });
      expect(res.status).toBe(200);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.SSESpecification.Enabled).toBe(true);
      expect(cmd.SSESpecification.SSEType).toBe("KMS");
      expect(cmd.SSESpecification.KMSMasterKeyId).toBe("arn:aws:kms:...");
    });

    it("PUT /tables/:name/update — enables stream specification", async () => {
      mockSend.mockResolvedValueOnce({ TableDescription: { TableStatus: "UPDATING" } });
      const res = await put("/tables/my-table/update", {
        StreamSpecification: { StreamEnabled: true, StreamViewType: "NEW_IMAGE" },
      });
      expect(res.status).toBe(200);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.StreamSpecification.StreamEnabled).toBe(true);
      expect(cmd.StreamSpecification.StreamViewType).toBe("NEW_IMAGE");
    });

    it("PUT /tables/:name/update — stream spec defaults view type when missing", async () => {
      mockSend.mockResolvedValueOnce({ TableDescription: { TableStatus: "UPDATING" } });
      const res = await put("/tables/my-table/update", {
        StreamSpecification: { StreamEnabled: true },
      });
      expect(res.status).toBe(200);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.StreamSpecification.StreamViewType).toBe("NEW_AND_OLD_IMAGES");
    });

    it("PUT /tables/:name/update — enables deletion protection and sets table class", async () => {
      mockSend.mockResolvedValueOnce({ TableDescription: { TableStatus: "UPDATING" } });
      const res = await put("/tables/my-table/update", {
        DeletionProtectionEnabled: true,
        TableClass: "STANDARD_INFREQUENT_ACCESS",
      });
      expect(res.status).toBe(200);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.DeletionProtectionEnabled).toBe(true);
      expect(cmd.TableClass).toBe("STANDARD_INFREQUENT_ACCESS");
    });

    it("PUT /tables/:name/update — creates and deletes GSIs with attribute defs", async () => {
      mockSend.mockResolvedValueOnce({ TableDescription: { TableStatus: "UPDATING" } });
      const res = await put("/tables/my-table/update", {
        GlobalSecondaryIndexUpdates: [
          {
            Create: {
              IndexName: "new-gsi",
              KeySchema: [
                { AttributeName: "gsi_pk", KeyType: "HASH" },
                { AttributeName: "gsi_sk", KeyType: "RANGE" },
              ],
              Projection: { ProjectionType: "ALL" },
              ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
            },
          },
          { Delete: { IndexName: "old-gsi" } },
        ],
        AttributeDefinitions: [
          { AttributeName: "gsi_pk", AttributeType: "S" },
          { AttributeName: "gsi_sk", AttributeType: "S" },
        ],
      });
      expect(res.status).toBe(200);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.GlobalSecondaryIndexUpdates).toHaveLength(2);
      expect(cmd.GlobalSecondaryIndexUpdates[0].Create.IndexName).toBe("new-gsi");
      expect(cmd.GlobalSecondaryIndexUpdates[1].Delete.IndexName).toBe("old-gsi");
      expect(cmd.AttributeDefinitions).toHaveLength(2);
    });

    it("PUT /tables/:name/update — 400 when body is empty", async () => {
      const res = await put("/tables/my-table/update", {});
      expect(res.status).toBe(400);
    });

    it("PUT /tables/:name/update — GSI create without projection defaults to ALL", async () => {
      mockSend.mockResolvedValueOnce({ TableDescription: { TableStatus: "UPDATING" } });
      const res = await put("/tables/my-table/update", {
        GlobalSecondaryIndexUpdates: [
          {
            Create: {
              IndexName: "minimal-gsi",
              KeySchema: [{ AttributeName: "pk", KeyType: "HASH" }],
            },
          },
        ],
      });
      expect(res.status).toBe(200);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.GlobalSecondaryIndexUpdates[0].Create.Projection.ProjectionType).toBe("ALL");
      expect(cmd.GlobalSecondaryIndexUpdates[0].Create.ProvisionedThroughput).toBeUndefined();
    });

    it("PUT /tables/:name/update — 400 when ProvisionedThroughput with PAY_PER_REQUEST", async () => {
      const res = await put("/tables/my-table/update", {
        BillingMode: "PAY_PER_REQUEST",
        ProvisionedThroughput: { ReadCapacityUnits: 10, WriteCapacityUnits: 5 },
      });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("ProvisionedThroughput");
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("PUT /tables/:name/update — SSE without SSEType or KMS key", async () => {
      mockSend.mockResolvedValueOnce({ TableDescription: { TableStatus: "UPDATING" } });
      const res = await put("/tables/my-table/update", {
        SSESpecification: { Enabled: true },
      });
      expect(res.status).toBe(200);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.SSESpecification.Enabled).toBe(true);
      expect(cmd.SSESpecification.SSEType).toBeUndefined();
      expect(cmd.SSESpecification.KMSMasterKeyId).toBeUndefined();
    });

    it("PUT /tables/:name/update — GSI create with empty Projection defaults type to ALL", async () => {
      mockSend.mockResolvedValueOnce({ TableDescription: { TableStatus: "UPDATING" } });
      const res = await put("/tables/my-table/update", {
        GlobalSecondaryIndexUpdates: [
          {
            Create: {
              IndexName: "proj-gsi",
              KeySchema: [{ AttributeName: "pk", KeyType: "HASH" }],
              Projection: {},
            },
          },
        ],
      });
      expect(res.status).toBe(200);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.GlobalSecondaryIndexUpdates[0].Create.Projection.ProjectionType).toBe("ALL");
    });

    it("PUT /tables/:name/update — GSI create with NonKeyAttributes", async () => {
      mockSend.mockResolvedValueOnce({ TableDescription: { TableStatus: "UPDATING" } });
      const res = await put("/tables/my-table/update", {
        GlobalSecondaryIndexUpdates: [
          {
            Create: {
              IndexName: "nka-gsi",
              KeySchema: [{ AttributeName: "pk", KeyType: "HASH" }],
              Projection: { ProjectionType: "INCLUDE", NonKeyAttributes: ["name", "email"] },
            },
          },
        ],
      });
      expect(res.status).toBe(200);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.GlobalSecondaryIndexUpdates[0].Create.Projection.ProjectionType).toBe("INCLUDE");
      expect(cmd.GlobalSecondaryIndexUpdates[0].Create.Projection.NonKeyAttributes).toEqual(["name", "email"]);
    });

    it("PUT /tables/:name/update — defaults status to UPDATING without TableDescription", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/tables/my-table/update", { BillingMode: "PAY_PER_REQUEST" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.tableStatus).toBe("UPDATING");
      expect(body.billingMode).toBe("PAY_PER_REQUEST");
      expect(body.streamSpecification).toBeNull();
    });
  });

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

    it("POST /tables/:name/items/update — attributes null when response has none", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/tables/my-table/items/update", {
        key: { pk: "123" },
        updates: { status: "active" },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.attributes).toBeNull();
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

    it("POST /batch-get — empty responses when Responses missing", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/batch-get", {
        requests: [{ tableName: "my-table", keys: [{ pk: "123" }] }],
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.responses).toEqual({});
      expect(body.unprocessedKeys).toEqual({});
    });

    it("POST /batch-get — returns unprocessed keys", async () => {
      mockSend.mockResolvedValueOnce({
        UnprocessedKeys: { "my-table": [{ Key: { pk: { S: "999" } } }] },
      });
      const res = await post("/batch-get", {
        requests: [{ tableName: "my-table", keys: [{ pk: "999" }] }],
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.unprocessedKeys["my-table"]).toHaveLength(1);
    });

    it("POST /batch-write — groups multiple requests for the same table", async () => {
      mockSend.mockResolvedValueOnce({ UnprocessedItems: {} });
      const res = await post("/batch-write", {
        requests: [
          { tableName: "my-table", type: "put", item: { pk: "1" } },
          { tableName: "my-table", type: "put", item: { pk: "2" } },
        ],
      });
      expect(res.status).toBe(200);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.RequestItems["my-table"]).toHaveLength(2);
    });

    it("POST /batch-write — skips requests without item or key", async () => {
      mockSend.mockResolvedValueOnce({ UnprocessedItems: {} });
      const res = await post("/batch-write", {
        requests: [
          { tableName: "my-table", type: "put" },
          { tableName: "other-table", type: "delete" },
        ],
      });
      expect(res.status).toBe(200);
      const cmd = mockSend.mock.calls[0][0];
      // Table buckets are created but no Put/Delete requests are pushed.
      expect(cmd.RequestItems["my-table"]).toEqual([]);
      expect(cmd.RequestItems["other-table"]).toEqual([]);
      const body = await res.json();
      expect(body.wrote).toBe(2);
    });

    it("POST /batch-write — unprocessed items reduce wrote count", async () => {
      mockSend.mockResolvedValueOnce({
        UnprocessedItems: { "my-table": [{ PutRequest: { Item: { pk: { S: "1" } } } }] },
      });
      const res = await post("/batch-write", {
        requests: [{ tableName: "my-table", type: "put", item: { pk: "1" } }],
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.wrote).toBe(0);
      expect(body.unprocessedItems["my-table"]).toHaveLength(1);
    });

    it("POST /batch-write — 400 when requests missing", async () => {
      const res = await post("/batch-write", {});
      expect(res.status).toBe(400);
    });

    it("POST /batch-write — 400 when requests is not an array", async () => {
      const res = await post("/batch-write", { requests: "nope" });
      expect(res.status).toBe(400);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("POST /batch-write — wrote count when UnprocessedItems missing", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/batch-write", {
        requests: [{ tableName: "my-table", type: "put", item: { pk: "123" } }],
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.wrote).toBe(1);
      expect(body.unprocessedItems).toEqual({});
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

    it("POST /transaction/get — empty responses when Responses missing", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/transaction/get", {
        items: [{ tableName: "my-table", key: { pk: "123" } }],
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.responses).toEqual([]);
      expect(body.total).toBe(0);
    });

    it("POST /transaction/get — null entries when Item missing", async () => {
      mockSend.mockResolvedValueOnce({ Responses: [{}] });
      const res = await post("/transaction/get", {
        items: [{ tableName: "my-table", key: { pk: "123" } }],
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.responses).toEqual([null]);
    });

    it("POST /transaction/write — update without updates builds empty expression", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/transaction/write", {
        items: [{ type: "update", tableName: "my-table", key: { pk: "123" } }],
      });
      expect(res.status).toBe(200);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.TransactItems[0].Update.UpdateExpression).toBe("SET ");
      expect(cmd.TransactItems[0].Update.ExpressionAttributeNames).toEqual({});
    });

    it("POST /transaction/write — 500 on unknown type", async () => {
      // Hono catches the thrown error and returns a 500 response.
      const res = await post("/transaction/write", {
        items: [{ type: "nope", tableName: "my-table" }],
      });
      expect(res.status).toBe(500);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("POST /transaction/write — 400 when items missing", async () => {
      const res = await post("/transaction/write", {});
      expect(res.status).toBe(400);
    });

    it("POST /transaction/write — 400 when items is not an array", async () => {
      const res = await post("/transaction/write", { items: "nope" });
      expect(res.status).toBe(400);
      expect(mockSend).not.toHaveBeenCalled();
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

    it("GET /tables/:name/ttl — DISABLED defaults when no description", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/tables/my-table/ttl");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.enabled).toBe(false);
      expect(body.status).toBe("DISABLED");
      expect(body.attributeName).toBeNull();
    });

    it("PUT /tables/:name/ttl — 400 when attributeName missing", async () => {
      const res = await put("/tables/my-table/ttl", { enabled: true });
      expect(res.status).toBe(400);
      expect(mockSend).not.toHaveBeenCalled();
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

    it("GET /tables/:name/tags — empty when Tags missing", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/tables/my-table/tags");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.tags).toEqual([]);
      expect(body.total).toBe(0);
    });

    it("POST /tables/:name/tags — 400 when tags missing", async () => {
      const res = await post("/tables/my-table/tags", {});
      expect(res.status).toBe(400);
      expect(mockSend).not.toHaveBeenCalled();
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

    it("GET /tables/:name/backups — DISABLED defaults when no description", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/tables/my-table/backups");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.pointInTimeRecovery.enabled).toBe(false);
      expect(body.pointInTimeRecovery.status).toBe("DISABLED");
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

    it("POST /partiql/execute — empty items when Items missing", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/partiql/execute", {
        statement: "SELECT * FROM my-table",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.items).toEqual([]);
      expect(body.count).toBe(0);
    });
  });

  describe("PartiQL Transaction", () => {
    it("POST /partiql/transaction — executes transaction", async () => {
      mockSend.mockResolvedValueOnce({
        Responses: [{ Item: { pk: { S: "123" } } }],
      });
      mockUnmarshall.mockReturnValueOnce({ pk: "123" });
      const res = await post("/partiql/transaction", {
        statements: [
          { Statement: "INSERT INTO t VALUE {'pk':'123'}" },
          { Statement: "UPDATE t SET name='done' WHERE pk='456'" },
        ],
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.responses).toBeDefined();
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.TransactStatements).toHaveLength(2);
      expect(cmd.TransactStatements[0].Statement).toBe("INSERT INTO t VALUE {'pk':'123'}");
    });

    it("POST /partiql/transaction — with parameters", async () => {
      mockSend.mockResolvedValueOnce({ Responses: [] });
      const res = await post("/partiql/transaction", {
        statements: [
          { Statement: "INSERT INTO t VALUE {'pk':?}", Parameters: [{ S: "val" }] },
        ],
      });
      expect(res.status).toBe(200);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.TransactStatements[0].Parameters).toBeDefined();
    });

    it("POST /partiql/transaction — 400 when statements empty", async () => {
      const res = await post("/partiql/transaction", { statements: [] });
      expect(res.status).toBe(400);
    });

    it("POST /partiql/transaction — 400 when statements missing", async () => {
      const res = await post("/partiql/transaction", {});
      expect(res.status).toBe(400);
    });

    it("POST /partiql/transaction — empty responses when Responses missing", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/partiql/transaction", {
        statements: [{ Statement: "INSERT INTO t VALUE {'pk':'1'}" }],
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.responses).toEqual([]);
      expect(body.total).toBe(0);
    });

    it("POST /partiql/transaction — empty entries when Item missing", async () => {
      mockSend.mockResolvedValueOnce({ Responses: [{}] });
      const res = await post("/partiql/transaction", {
        statements: [{ Statement: "INSERT INTO t VALUE {'pk':'1'}" }],
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.responses).toEqual([{}]);
    });
  });

  describe("PartiQL Batch", () => {
    it("POST /partiql/batch — executes batch statements", async () => {
      mockSend.mockResolvedValueOnce({
        Responses: [
          { TableName: "my-table", Item: { pk: { S: "123" } } },
          { TableName: "my-table", Error: { Code: "NotFound", Message: "Item not found" } },
        ],
      });
      mockUnmarshall.mockReturnValueOnce({ pk: "123" });
      const res = await post("/partiql/batch", {
        statements: [
          { Statement: "SELECT * FROM t WHERE pk='123'" },
          { Statement: "SELECT * FROM t WHERE pk='999'" },
        ],
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.responses).toHaveLength(2);
      expect(body.responses[0].item).toBeDefined();
      expect(body.responses[1].error).toBeDefined();
      expect(body.responses[1].error.Code).toBe("NotFound");
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.Statements).toHaveLength(2);
    });

    it("POST /partiql/batch — with ConsistentRead", async () => {
      mockSend.mockResolvedValueOnce({ Responses: [] });
      const res = await post("/partiql/batch", {
        statements: [
          { Statement: "SELECT * FROM t", ConsistentRead: true },
        ],
      });
      expect(res.status).toBe(200);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.Statements[0].ConsistentRead).toBe(true);
    });

    it("POST /partiql/batch — 400 when statements empty", async () => {
      const res = await post("/partiql/batch", { statements: [] });
      expect(res.status).toBe(400);
    });

    it("POST /partiql/batch — 400 when statements missing", async () => {
      const res = await post("/partiql/batch", {});
      expect(res.status).toBe(400);
    });

    it("POST /partiql/batch — with Parameters", async () => {
      mockSend.mockResolvedValueOnce({ Responses: [] });
      const res = await post("/partiql/batch", {
        statements: [{ Statement: "SELECT * FROM t WHERE pk = ?", Parameters: [{ S: "val" }] }],
      });
      expect(res.status).toBe(200);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.Statements[0].Parameters).toEqual([{ S: "val" }]);
    });

    it("POST /partiql/batch — empty responses when Responses missing", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/partiql/batch", {
        statements: [{ Statement: "SELECT * FROM t" }],
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.responses).toEqual([]);
      expect(body.total).toBe(0);
    });

    it("POST /partiql/batch — tableName null when missing", async () => {
      mockSend.mockResolvedValueOnce({ Responses: [{ Item: { pk: { S: "1" } } }] });
      const res = await post("/partiql/batch", {
        statements: [{ Statement: "SELECT * FROM t" }],
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.responses[0].tableName).toBeNull();
      expect(body.responses[0].item).toBeDefined();
    });
  });

  describe("Exports", () => {
    it("GET /tables/:name/exports — lists exports", async () => {
      mockSend.mockResolvedValueOnce({
        ExportSummaries: [
          {
            ExportArn: "arn:aws:dynamodb:us-east-1:000000000000:table/my-table/export/01700000000000-abc123",
            ExportStatus: "COMPLETED",
            StartTime: new Date("2025-01-01T00:00:00Z"),
            EndTime: new Date("2025-01-01T01:00:00Z"),
            ItemCount: 5000,
            ExportManifest: "s3://bucket/manifest.json",
          },
        ],
        NextToken: null,
      });
      const res = await get("/tables/my-table/exports");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.exports).toHaveLength(1);
      expect(body.exports[0].exportStatus).toBe("COMPLETED");
      expect(body.exports[0].exportArn).toBeDefined();
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.TableArn).toContain("my-table");
    });

    it("GET /tables/:name/exports — empty list when no exports", async () => {
      mockSend.mockResolvedValueOnce({ ExportSummaries: [] });
      const res = await get("/tables/my-table/exports");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.exports).toHaveLength(0);
      expect(body.total).toBe(0);
    });

    it("POST /tables/:name/exports — creates export", async () => {
      mockSend.mockResolvedValueOnce({
        ExportDescription: {
          ExportArn: "arn:aws:dynamodb:us-east-1:000000000000:table/my-table/export/01700000000000-xyz",
          ExportStatus: "IN_PROGRESS",
          StartTime: new Date(),
          S3Bucket: "my-bucket",
          S3Prefix: "exports/",
          ExportManifest: "s3://my-bucket/exports/manifest.json",
        },
      });
      const res = await post("/tables/my-table/exports", {
        s3Bucket: "my-bucket",
        s3Prefix: "exports/",
        exportFormat: "DYNAMODB_JSON",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.created).toBe(true);
      expect(body.exportStatus).toBe("IN_PROGRESS");
      expect(body.s3Bucket).toBe("my-bucket");
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.TableArn).toContain("my-table");
      expect(cmd.S3Bucket).toBe("my-bucket");
      expect(cmd.ExportFormat).toBe("DYNAMODB_JSON");
    });

    it("POST /tables/:name/exports — 400 when s3Bucket missing", async () => {
      const res = await post("/tables/my-table/exports", {});
      expect(res.status).toBe(400);
    });

    it("GET /exports — describes export by ARN", async () => {
      const testArn = "arn:aws:dynamodb:us-east-1:000000000000:table/my-table/export/01700000000000-abc123";
      mockSend.mockResolvedValueOnce({
        ExportDescription: {
          ExportArn: testArn,
          ExportStatus: "COMPLETED",
          ExportType: "FULL_EXPORT",
          StartTime: new Date("2025-01-01T00:00:00Z"),
          EndTime: new Date("2025-01-01T01:00:00Z"),
          ItemCount: 1000,
          S3Bucket: "my-bucket",
          S3Prefix: "exports/",
          ExportManifest: "s3://my-bucket/exports/manifest.json",
          TableArn: "arn:aws:dynamodb:us-east-1:000000000000:table/my-table",
          FailureCode: null,
          FailureMessage: null,
        },
      });
      const res = await get(`/exports?arn=${encodeURIComponent(testArn)}`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.exportArn).toBe(testArn);
      expect(body.exportStatus).toBe("COMPLETED");
      expect(body.itemCount).toBe(1000);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.ExportArn).toBe(testArn);
    });

    it("GET /exports — 400 when arn missing", async () => {
      const res = await get("/exports");
      expect(res.status).toBe(400);
    });

    it("GET /tables/:name/exports — empty when ExportSummaries missing", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/tables/my-table/exports");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.exports).toEqual([]);
      expect(body.total).toBe(0);
    });

    it("GET /tables/:name/exports — null times when summary lacks them", async () => {
      mockSend.mockResolvedValueOnce({
        ExportSummaries: [
          {
            ExportArn: "arn:aws:dynamodb:us-east-1:000000000000:table/my-table/export/01700000000000-abc",
            ExportStatus: "IN_PROGRESS",
          },
        ],
      });
      const res = await get("/tables/my-table/exports");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.exports[0].startTime).toBeNull();
      expect(body.exports[0].endTime).toBeNull();
    });

    it("POST /tables/:name/exports — defaults S3Prefix and ExportFormat", async () => {
      mockSend.mockResolvedValueOnce({ ExportDescription: {} });
      const res = await post("/tables/my-table/exports", { s3Bucket: "my-bucket" });
      expect(res.status).toBe(200);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.S3Prefix).toBe("");
      expect(cmd.ExportFormat).toBe("DYNAMODB_JSON");
    });

    it("POST /tables/:name/exports — with exportType and exportTime", async () => {
      mockSend.mockResolvedValueOnce({ ExportDescription: {} });
      const res = await post("/tables/my-table/exports", {
        s3Bucket: "my-bucket",
        exportType: "INCREMENTAL_EXPORT",
        exportTime: "2025-01-01T00:00:00Z",
      });
      expect(res.status).toBe(200);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.ExportType).toBe("INCREMENTAL_EXPORT");
      expect(cmd.ExportTime).toBeInstanceOf(Date);
    });

    it("POST /tables/:name/exports — defaults status to IN_PROGRESS without description", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/tables/my-table/exports", { s3Bucket: "my-bucket" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.exportStatus).toBe("IN_PROGRESS");
      expect(body.startTime).toBeNull();
    });

    it("GET /exports — null times when description missing", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/exports?arn=arn:aws:dynamodb:us-east-1:000000000000:table/my-table/export/01700000000000-abc");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.startTime).toBeNull();
      expect(body.endTime).toBeNull();
    });
  });
});
