import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const mockDDBClient = vi.hoisted(() =>
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

const mockMarshall = vi.hoisted(() => vi.fn((obj: any) => obj));
const mockUnmarshall = vi.hoisted(() => vi.fn((obj: any) => obj));

vi.mock("@aws-sdk/client-dynamodb", () => ({
  DynamoDBClient: mockDDBClient,
  ListTablesCommand: createCmd("ListTablesCommand"),
  CreateTableCommand: createCmd("CreateTableCommand"),
  DeleteTableCommand: createCmd("DeleteTableCommand"),
  DescribeTableCommand: createCmd("DescribeTableCommand"),
  ScanCommand: createCmd("ScanCommand"),
  QueryCommand: createCmd("QueryCommand"),
  GetItemCommand: createCmd("GetItemCommand"),
  PutItemCommand: createCmd("PutItemCommand"),
  DeleteItemCommand: createCmd("DeleteItemCommand"),
  EnableKinesisStreamingDestinationCommand: createCmd("EnableKinesisStreamingDestinationCommand"),
  DescribeKinesisStreamingDestinationCommand: createCmd("DescribeKinesisStreamingDestinationCommand"),
  DisableKinesisStreamingDestinationCommand: createCmd("DisableKinesisStreamingDestinationCommand"),
  KeyType: { HASH: "HASH", RANGE: "RANGE" },
  ScalarAttributeType: { S: "S", N: "N", B: "B" },
}));

vi.mock("@aws-sdk/util-dynamodb", () => ({
  marshall: mockMarshall,
  unmarshall: mockUnmarshall,
}));

vi.mock("../../clients/aws", () => ({
  getAwsConfig: () => ({
    endpoint: "http://localhost:4566",
    region: "us-east-1",
    credentials: { accessKeyId: "test", secretAccessKey: "test" },
  }),
}));

import router from "./dynamodb";

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

async function del(path: string) {
  return router.request(path, { method: "DELETE" });
}

async function put(path: string, body?: any) {
  return router.request(path, {
    method: "PUT",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { "content-type": "application/json" } : undefined,
  });
}

beforeEach(() => {
  mockSend.mockReset();
  mockDDBClient.mockClear();
  mockMarshall.mockImplementation((obj: any) => obj);
  mockUnmarshall.mockImplementation((obj: any) => obj);
});

describe("DynamoDB Routes", () => {
  describe("Tables", () => {
    it("GET /tables — lists tables", async () => {
      mockSend.mockResolvedValueOnce({ TableNames: ["users", "orders"] });
      const res = await get("/tables");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(2);
      expect(body.tables).toEqual(["users", "orders"]);
    });

    it("GET /tables — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ TableNames: [] });
      const res = await get("/tables");
      const body = await res.json();
      expect(body.total).toBe(0);
      expect(body.tables).toEqual([]);
    });

    it("GET /tables — sparse response defaults to empty array", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/tables");
      const body = await res.json();
      expect(body.total).toBe(0);
      expect(body.tables).toEqual([]);
    });

    it("POST /tables — creates a table", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/tables", {
        name: "users",
        hashKey: "userId",
        hashType: "S",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.created).toBe(true);
      expect(body.name).toBe("users");
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.TableName).toBe("users");
      expect(cmd.KeySchema[0].AttributeName).toBe("userId");
      expect(cmd.KeySchema[0].KeyType).toBe("HASH");
      expect(cmd.AttributeDefinitions[0].AttributeType).toBe("S");
    });

    it("POST /tables — supports range key", async () => {
      mockSend.mockResolvedValueOnce({});
      await post("/tables", {
        name: "orders",
        hashKey: "orderId",
        rangeKey: "createdAt",
        rangeType: "N",
      });
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.KeySchema).toHaveLength(2);
      expect(cmd.KeySchema[1].AttributeName).toBe("createdAt");
      expect(cmd.KeySchema[1].KeyType).toBe("RANGE");
      expect(cmd.AttributeDefinitions[1].AttributeType).toBe("N");
    });

    it("POST /tables — range key defaults rangeType to S", async () => {
      mockSend.mockResolvedValueOnce({});
      await post("/tables", {
        name: "orders2",
        hashKey: "orderId",
        rangeKey: "createdAt",
      });
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.KeySchema).toHaveLength(2);
      expect(cmd.AttributeDefinitions[1].AttributeType).toBe("S");
    });

    it("POST /tables — 400 when name or hashKey missing", async () => {
      let res = await post("/tables", { name: "test" });
      expect(res.status).toBe(400);
      res = await post("/tables", { hashKey: "id" });
      expect(res.status).toBe(400);
    });

    it("GET /tables/:name — describes a table", async () => {
      mockSend.mockResolvedValueOnce({
        Table: {
          TableName: "users",
          TableStatus: "ACTIVE",
          ItemCount: 100,
          TableSizeBytes: 1024,
          KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
          TableArn: "arn:aws:dynamodb:...",
          CreationDateTime: new Date("2025-01-01"),
          GlobalSecondaryIndexes: [
            {
              IndexName: "email-index",
              IndexStatus: "ACTIVE",
              ItemCount: 100,
              IndexSizeBytes: 512,
              KeySchema: [],
              Projection: { ProjectionType: "ALL" },
            },
          ],
          LocalSecondaryIndexes: [],
        },
      });
      const res = await get("/tables/users");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.name).toBe("users");
      expect(body.status).toBe("ACTIVE");
      expect(body.itemCount).toBe(100);
      expect(body.globalSecondaryIndexes).toHaveLength(1);
      expect(body.globalSecondaryIndexes[0].indexName).toBe("email-index");
    });

    it("GET /tables/:name — sparse Table without index keys defaults to empty arrays", async () => {
      mockSend.mockResolvedValueOnce({
        Table: {
          TableName: "users",
          TableStatus: "ACTIVE",
          ItemCount: 10,
          TableSizeBytes: 512,
          KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
          TableArn: "arn:aws:dynamodb:...",
          CreationDateTime: new Date("2025-01-01"),
        },
      });
      const res = await get("/tables/users");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.globalSecondaryIndexes).toEqual([]);
      expect(body.localSecondaryIndexes).toEqual([]);
    });

    it("GET /tables/:name — maps LocalSecondaryIndexes", async () => {
      mockSend.mockResolvedValueOnce({
        Table: {
          TableName: "users",
          TableStatus: "ACTIVE",
          KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
          LocalSecondaryIndexes: [
            {
              IndexName: "createdAt-index",
              KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
              Projection: { ProjectionType: "ALL" },
            },
          ],
        },
      });
      const res = await get("/tables/users");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.localSecondaryIndexes).toHaveLength(1);
      expect(body.localSecondaryIndexes[0].indexName).toBe("createdAt-index");
    });

    it("GET /tables/:name — returns 404 when table not found", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/tables/missing");
      expect(res.status).toBe(404);
    });

    it("DELETE /tables/:name — deletes a table", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/tables/users");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
      expect(body.name).toBe("users");
      expect(mockSend.mock.calls[0][0].TableName).toBe("users");
    });
  });

  describe("Items", () => {
    it("GET /tables/:name/items — scans items", async () => {
      mockSend.mockResolvedValueOnce({
        Items: [{ id: { S: "1" }, name: { S: "Alice" } }],
        Count: 1,
        ScannedCount: 1,
      });
      const res = await get("/tables/users/items");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.count).toBe(1);
      expect(body.table).toBe("users");
    });

    it("GET /tables/:name/items — returns empty scan", async () => {
      mockSend.mockResolvedValueOnce({ Items: [], Count: 0, ScannedCount: 0 });
      const res = await get("/tables/users/items");
      const body = await res.json();
      expect(body.count).toBe(0);
    });

    it("GET /tables/:name/items — sparse response defaults to empty array", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/tables/users/items");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.items).toEqual([]);
    });

    it("GET /tables/:name/items — returns lastEvaluatedKey when present", async () => {
      mockSend.mockResolvedValueOnce({
        Items: [{ id: { S: "1" } }],
        Count: 1,
        ScannedCount: 1,
        LastEvaluatedKey: { id: { S: "1" } },
      });
      const res = await get("/tables/users/items");
      const body = await res.json();
      expect(body.lastEvaluatedKey).toBeDefined();
    });

    it("POST /tables/:name/items/get — gets an item", async () => {
      mockSend.mockResolvedValueOnce({
        Item: { id: { S: "1" }, name: { S: "Alice" } },
      });
      const res = await post("/tables/users/items/get", { key: { id: "1" } });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.found).toBe(true);
    });

    it("POST /tables/:name/items/get — handles not found", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/tables/users/items/get", { key: { id: "999" } });
      const body = await res.json();
      expect(body.found).toBe(false);
      expect(body.item).toBeNull();
    });

    it("POST /tables/:name/items/get — 400 when key missing", async () => {
      const res = await post("/tables/users/items/get", {});
      expect(res.status).toBe(400);
    });

    it("PUT /tables/:name/items — puts an item", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/tables/users/items", {
        item: { id: "1", name: "Alice" },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.saved).toBe(true);
      expect(mockSend.mock.calls[0][0].TableName).toBe("users");
    });

    it("PUT /tables/:name/items — 400 when item missing", async () => {
      const res = await put("/tables/users/items", {});
      expect(res.status).toBe(400);
    });

    it("POST /tables/:name/items/delete — deletes an item", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/tables/users/items/delete", {
        key: { id: "1" },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
      expect(mockSend.mock.calls[0][0].TableName).toBe("users");
    });

    it("POST /tables/:name/items/delete — 400 when key missing", async () => {
      const res = await post("/tables/users/items/delete", {});
      expect(res.status).toBe(400);
    });

    it("GET /tables/:name/items — handles exclusiveStartKey", async () => {
      mockSend.mockResolvedValueOnce({
        Items: [{ id: { S: "2" } }],
        Count: 1,
        ScannedCount: 1,
      });
      const res = await get(
        "/tables/users/items?exclusiveStartKey=" +
          encodeURIComponent(JSON.stringify({ id: "1" }))
      );
      expect(res.status).toBe(200);
    });

    it("GET /tables/:name/items — 400 on invalid exclusiveStartKey", async () => {
      const res = await get("/tables/users/items?exclusiveStartKey=invalid-json");
      expect(res.status).toBe(400);
    });
  });

  describe("Query (filtered scan)", () => {
    function queryParamsForSend() {
      const call = mockSend.mock.calls[0][0];
      return call;
    }

    it("POST query — no filters returns items", async () => {
      mockSend.mockResolvedValueOnce({
        Items: [{ id: { S: "1" } }],
        Count: 1,
        ScannedCount: 1,
      });
      const res = await post("/tables/users/items/query", {});
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.count).toBe(1);
      expect(body.table).toBe("users");
      expect(queryParamsForSend().FilterExpression).toBeUndefined();
    });

    it("POST query — '=' operator", async () => {
      mockSend.mockResolvedValueOnce({ Items: [], Count: 0, ScannedCount: 0 });
      await post("/tables/users/items/query", {
        filters: [{ attribute: "status", operator: "=", value: "active" }],
      });
      const p = queryParamsForSend();
      expect(p.FilterExpression).toBe("#0 = :0");
    });

    it("POST query — '<>' operator", async () => {
      mockSend.mockResolvedValueOnce({ Items: [], Count: 0, ScannedCount: 0 });
      await post("/tables/users/items/query", {
        filters: [{ attribute: "status", operator: "<>", value: "x" }],
      });
      expect(queryParamsForSend().FilterExpression).toBe("#0 <> :0");
    });

    it("POST query — '<' operator", async () => {
      mockSend.mockResolvedValueOnce({ Items: [], Count: 0, ScannedCount: 0 });
      await post("/tables/users/items/query", {
        filters: [{ attribute: "age", operator: "<", value: 5 }],
      });
      expect(queryParamsForSend().FilterExpression).toBe("#0 < :0");
    });

    it("POST query — '>' operator", async () => {
      mockSend.mockResolvedValueOnce({ Items: [], Count: 0, ScannedCount: 0 });
      await post("/tables/users/items/query", {
        filters: [{ attribute: "age", operator: ">", value: 5 }],
      });
      expect(queryParamsForSend().FilterExpression).toBe("#0 > :0");
    });

    it("POST query — '<=' operator", async () => {
      mockSend.mockResolvedValueOnce({ Items: [], Count: 0, ScannedCount: 0 });
      await post("/tables/users/items/query", {
        filters: [{ attribute: "age", operator: "<=", value: 5 }],
      });
      expect(queryParamsForSend().FilterExpression).toBe("#0 <= :0");
    });

    it("POST query — '>=' operator", async () => {
      mockSend.mockResolvedValueOnce({ Items: [], Count: 0, ScannedCount: 0 });
      await post("/tables/users/items/query", {
        filters: [{ attribute: "age", operator: ">=", value: 5 }],
      });
      expect(queryParamsForSend().FilterExpression).toBe("#0 >= :0");
    });

    it("POST query — 'BEGINS_WITH' operator", async () => {
      mockSend.mockResolvedValueOnce({ Items: [], Count: 0, ScannedCount: 0 });
      await post("/tables/users/items/query", {
        filters: [{ attribute: "name", operator: "BEGINS_WITH", value: "Al" }],
      });
      expect(queryParamsForSend().FilterExpression).toBe("begins_with(#0, :0)");
    });

    it("POST query — 'EXISTS' operator (no value)", async () => {
      mockSend.mockResolvedValueOnce({ Items: [], Count: 0, ScannedCount: 0 });
      await post("/tables/users/items/query", {
        filters: [{ attribute: "email", operator: "EXISTS" }],
      });
      expect(queryParamsForSend().FilterExpression).toBe("attribute_exists(#0)");
    });

    it("POST query — 'NOT_EXISTS' operator (no value)", async () => {
      mockSend.mockResolvedValueOnce({ Items: [], Count: 0, ScannedCount: 0 });
      await post("/tables/users/items/query", {
        filters: [{ attribute: "email", operator: "NOT_EXISTS" }],
      });
      expect(queryParamsForSend().FilterExpression).toBe("attribute_not_exists(#0)");
    });

    it("POST query — 'CONTAINS' operator", async () => {
      mockSend.mockResolvedValueOnce({ Items: [], Count: 0, ScannedCount: 0 });
      await post("/tables/users/items/query", {
        filters: [{ attribute: "name", operator: "CONTAINS", value: "li" }],
      });
      expect(queryParamsForSend().FilterExpression).toBe("contains(#0, :0)");
    });

    it("POST query — unknown operator is skipped", async () => {
      mockSend.mockResolvedValueOnce({ Items: [], Count: 0, ScannedCount: 0 });
      await post("/tables/users/items/query", {
        filters: [{ attribute: "name", operator: "WEIRD", value: "x" }],
      });
      // No valid conditions → no FilterExpression
      expect(queryParamsForSend().FilterExpression).toBeUndefined();
    });

    it("POST query — multiple filters joined with AND by default", async () => {
      mockSend.mockResolvedValueOnce({ Items: [], Count: 0, ScannedCount: 0 });
      await post("/tables/users/items/query", {
        filters: [
          { attribute: "a", operator: "=", value: 1 },
          { attribute: "b", operator: "<", value: 2 },
        ],
      });
      expect(queryParamsForSend().FilterExpression).toBe("#0 = :0 AND #1 < :1");
    });

    it("POST query — multiple filters joined with OR", async () => {
      mockSend.mockResolvedValueOnce({ Items: [], Count: 0, ScannedCount: 0 });
      await post("/tables/users/items/query", {
        filters: [
          { attribute: "a", operator: "=", value: 1 },
          { attribute: "b", operator: "=", value: 2 },
        ],
        filterLogic: "OR",
      });
      expect(queryParamsForSend().FilterExpression).toBe("#0 = :0 OR #1 = :1");
    });

    it("POST query — passes exclusiveStartKey", async () => {
      mockSend.mockResolvedValueOnce({ Items: [], Count: 0, ScannedCount: 0 });
      await post("/tables/users/items/query", {
        exclusiveStartKey: { id: "5" },
      });
      expect(queryParamsForSend().ExclusiveStartKey).toEqual({ id: "5" });
    });

    it("POST query — returns lastEvaluatedKey when present", async () => {
      mockSend.mockResolvedValueOnce({
        Items: [{ id: { S: "1" } }],
        Count: 1,
        ScannedCount: 2,
        LastEvaluatedKey: { id: { S: "1" } },
      });
      const res = await post("/tables/users/items/query", {});
      const body = await res.json();
      expect(body.lastEvaluatedKey).toBeDefined();
    });

    it("POST query — sparse response defaults to empty array", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/tables/users/items/query", {});
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.items).toEqual([]);
    });
  });

  describe("Native Query (key-condition expression)", () => {
    function queryCmd() {
      const call = mockSend.mock.calls[0][0];
      return call;
    }

    it("POST query-native — requires keyConditionExpression", async () => {
      const res = await post("/tables/users/items/query-native", {});
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("keyConditionExpression");
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("POST query-native — issues QueryCommand with minimal params", async () => {
      mockSend.mockResolvedValueOnce({ Items: [{ id: { S: "1" } }], Count: 1, ScannedCount: 1 });
      const res = await post("/tables/users/items/query-native", {
        keyConditionExpression: "#pk = :v",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.count).toBe(1);
      expect(body.items).toEqual([{ id: { S: "1" } }]);
      const cmd = queryCmd();
      expect(cmd.__cmdName).toBe("QueryCommand");
      expect(cmd.TableName).toBe("users");
      expect(cmd.KeyConditionExpression).toBe("#pk = :v");
    });

    it("POST query-native — passes all optional params", async () => {
      mockSend.mockResolvedValueOnce({ Items: [], Count: 0, ScannedCount: 0 });
      const res = await post("/tables/users/items/query-native", {
        keyConditionExpression: "#pk = :v AND #sk > :s",
        expressionAttributeValues: { ":v": "user-1", ":s": 5 },
        expressionAttributeNames: { "#pk": "pk", "#sk": "sk" },
        indexName: "my-index",
        scanIndexForward: false,
        limit: 10,
        exclusiveStartKey: { pk: "user-1" },
        filterExpression: "#st = :st",
      });
      expect(res.status).toBe(200);
      const cmd = queryCmd();
      expect(cmd.__cmdName).toBe("QueryCommand");
      expect(cmd.ExpressionAttributeValues).toEqual({ ":v": "user-1", ":s": 5 });
      expect(cmd.ExpressionAttributeNames).toEqual({ "#pk": "pk", "#sk": "sk" });
      expect(cmd.IndexName).toBe("my-index");
      expect(cmd.ScanIndexForward).toBe(false);
      expect(cmd.Limit).toBe(10);
      expect(cmd.ExclusiveStartKey).toEqual({ pk: "user-1" });
      expect(cmd.FilterExpression).toBe("#st = :st");
    });

    it("POST query-native — omits empty optional params", async () => {
      mockSend.mockResolvedValueOnce({ Items: [], Count: 0, ScannedCount: 0 });
      const res = await post("/tables/users/items/query-native", {
        keyConditionExpression: "#pk = :v",
        expressionAttributeValues: {},
        expressionAttributeNames: {},
        scanIndexForward: undefined,
        limit: undefined,
        exclusiveStartKey: undefined,
        filterExpression: undefined,
      });
      expect(res.status).toBe(200);
      const cmd = queryCmd();
      expect(cmd.__cmdName).toBe("QueryCommand");
      expect(cmd.ExpressionAttributeValues).toBeUndefined();
      expect(cmd.ExpressionAttributeNames).toBeUndefined();
      expect(cmd.IndexName).toBeUndefined();
      expect(cmd.ScanIndexForward).toBeUndefined();
      expect(cmd.Limit).toBeUndefined();
      expect(cmd.ExclusiveStartKey).toBeUndefined();
      expect(cmd.FilterExpression).toBeUndefined();
    });

    it("POST query-native — returns lastEvaluatedKey when present", async () => {
      mockSend.mockResolvedValueOnce({
        Items: [{ id: { S: "1" } }],
        Count: 1,
        ScannedCount: 2,
        LastEvaluatedKey: { id: { S: "1" } },
      });
      const res = await post("/tables/users/items/query-native", {
        keyConditionExpression: "#pk = :v",
      });
      const body = await res.json();
      expect(body.lastEvaluatedKey).toEqual({ id: { S: "1" } });
    });

    it("POST query-native — sparse response defaults to empty array", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/tables/users/items/query-native", {
        keyConditionExpression: "#pk = :v",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.items).toEqual([]);
      expect(body.count).toBeUndefined();
    });
  });

  describe("Kinesis Streaming", () => {
    it("GET /tables/:name/kinesis-streaming — describes destinations", async () => {
      mockSend.mockResolvedValueOnce({
        KinesisDataStreamDestinations: [
          {
            StreamArn: "arn:aws:kinesis:us-east-1:000000000000:stream/my-stream",
            DestinationStatus: "ACTIVE",
            DestinationStatusDescription: "Stream is active",
          },
        ],
      });
      const res = await get("/tables/users/kinesis-streaming");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.destinations[0].streamArn).toBe("arn:aws:kinesis:us-east-1:000000000000:stream/my-stream");
      expect(body.destinations[0].destinationStatus).toBe("ACTIVE");
    });

    it("GET /tables/:name/kinesis-streaming — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ KinesisDataStreamDestinations: [] });
      const res = await get("/tables/users/kinesis-streaming");
      const body = await res.json();
      expect(body.total).toBe(0);
      expect(body.destinations).toEqual([]);
    });

    it("GET /tables/:name/kinesis-streaming — sparse response defaults to empty array", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/tables/users/kinesis-streaming");
      const body = await res.json();
      expect(body.total).toBe(0);
      expect(body.destinations).toEqual([]);
    });

    it("POST /tables/:name/kinesis-streaming/enable — enables streaming", async () => {
      mockSend.mockResolvedValueOnce({ DestinationStatus: "ACTIVE" });
      const res = await post("/tables/users/kinesis-streaming/enable", {
        streamArn: "arn:aws:kinesis:us-east-1:000000000000:stream/my-stream",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.enabled).toBe(true);
      expect(body.destinationStatus).toBe("ACTIVE");
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.TableName).toBe("users");
      expect(cmd.StreamArn).toBe("arn:aws:kinesis:us-east-1:000000000000:stream/my-stream");
    });

    it("POST /tables/:name/kinesis-streaming/enable — 400 when streamArn missing", async () => {
      const res = await post("/tables/users/kinesis-streaming/enable", {});
      expect(res.status).toBe(400);
    });

    it("POST /tables/:name/kinesis-streaming/disable — disables streaming", async () => {
      mockSend.mockResolvedValueOnce({ DestinationStatus: "DISABLED" });
      const res = await post("/tables/users/kinesis-streaming/disable", {
        streamArn: "arn:aws:kinesis:us-east-1:000000000000:stream/my-stream",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.disabled).toBe(true);
      expect(body.destinationStatus).toBe("DISABLED");
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.TableName).toBe("users");
      expect(cmd.StreamArn).toBe("arn:aws:kinesis:us-east-1:000000000000:stream/my-stream");
    });

    it("POST /tables/:name/kinesis-streaming/disable — 400 when streamArn missing", async () => {
      const res = await post("/tables/users/kinesis-streaming/disable", {});
      expect(res.status).toBe(400);
    });
  });
});
