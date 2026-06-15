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
  GetItemCommand: createCmd("GetItemCommand"),
  PutItemCommand: createCmd("PutItemCommand"),
  DeleteItemCommand: createCmd("DeleteItemCommand"),
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
});
