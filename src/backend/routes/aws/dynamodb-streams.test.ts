import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const mockDDBStreamsClient = vi.hoisted(() =>
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

vi.mock("@aws-sdk/client-dynamodb-streams", () => ({
  DynamoDBStreamsClient: mockDDBStreamsClient,
  ListStreamsCommand: createCmd("ListStreamsCommand"),
  DescribeStreamCommand: createCmd("DescribeStreamCommand"),
  GetShardIteratorCommand: createCmd("GetShardIteratorCommand"),
  GetRecordsCommand: createCmd("GetRecordsCommand"),
}));

vi.mock("../../clients/aws", () => ({
  getAwsConfig: () => ({
    endpoint: "http://localhost:4566",
    region: "us-east-1",
    credentials: { accessKeyId: "test", secretAccessKey: "test" },
  }),
}));

import router from "./dynamodb-streams";

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
  mockSend.mockReset();
  mockDDBStreamsClient.mockClear();
});

describe("DynamoDB Streams Routes", () => {
  describe("List Streams", () => {
    it("GET /streams — lists streams", async () => {
      mockSend.mockResolvedValueOnce({
        Streams: [
          {
            StreamArn: "arn:aws:dynamodb:us-east-1:123456789012:table/users/stream/2025-01-01",
            StreamLabel: "2025-01-01",
            TableName: "users",
          },
        ],
      });
      const res = await get("/streams");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.streams[0].tableName).toBe("users");
      expect(body.streams[0].streamArn).toContain("users");
    });

    it("GET /streams — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ Streams: [] });
      const res = await get("/streams");
      const body = await res.json();
      expect(body.total).toBe(0);
      expect(body.streams).toEqual([]);
    });

    it("GET /streams — filters by tableName query param", async () => {
      mockSend.mockResolvedValueOnce({ Streams: [] });
      const res = await get("/streams?tableName=users");
      expect(res.status).toBe(200);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.TableName).toBe("users");
    });

    it("GET /streams — no tableName filter when not provided", async () => {
      mockSend.mockResolvedValueOnce({ Streams: [] });
      await get("/streams");
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.TableName).toBeUndefined();
    });
  });

  describe("Describe Stream", () => {
    const streamArn = "arn:aws:dynamodb:us-east-1:123456789012:table/users/stream/2025-01-01";

    it("GET /streams/:arn — describes a stream", async () => {
      mockSend.mockResolvedValueOnce({
        StreamDescription: {
          StreamArn: streamArn,
          StreamLabel: "2025-01-01",
          StreamStatus: "ENABLED",
          StreamViewType: "NEW_AND_OLD_IMAGES",
          TableName: "users",
          CreationRequestDateTime: new Date("2025-01-01"),
          KeySchema: [
            { AttributeName: "pk", KeyType: "HASH" },
            { AttributeName: "sk", KeyType: "RANGE" },
          ],
          Shards: [
            {
              ShardId: "shardId-000000000",
              SequenceNumberRange: {
                StartingSequenceNumber: "000000000000000000001",
              },
            },
          ],
        },
      });
      const res = await get(`/streams/${encodeURIComponent(streamArn)}`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.tableName).toBe("users");
      expect(body.streamStatus).toBe("ENABLED");
      expect(body.streamViewType).toBe("NEW_AND_OLD_IMAGES");
      expect(body.keySchema).toHaveLength(2);
      expect(body.keySchema[0].attributeName).toBe("pk");
      expect(body.keySchema[0].keyType).toBe("HASH");
      expect(body.shards).toHaveLength(1);
      expect(body.shards[0].shardId).toBe("shardId-000000000");
      expect(body.shards[0].sequenceNumberRange.startingSequenceNumber).toBe("000000000000000000001");
      expect(body.shards[0].sequenceNumberRange.endingSequenceNumber).toBeNull();
      expect(body.shards[0].parentShardId).toBeNull();
    });

    it("GET /streams/:arn — returns 404 when stream not found", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get(`/streams/${encodeURIComponent(streamArn)}`);
      expect(res.status).toBe(404);
    });

    it("GET /streams/:arn — handles shard with parent and end sequence", async () => {
      mockSend.mockResolvedValueOnce({
        StreamDescription: {
          StreamArn: streamArn,
          StreamLabel: "2025-01-01",
          StreamStatus: "ENABLED",
          StreamViewType: "KEYS_ONLY",
          TableName: "users",
          CreationRequestDateTime: new Date("2025-01-01"),
          KeySchema: [],
          Shards: [
            {
              ShardId: "shardId-000000001",
              ParentShardId: "shardId-000000000",
              AdjacentParentShardId: "shardId-000000000",
              SequenceNumberRange: {
                StartingSequenceNumber: "100",
                EndingSequenceNumber: "200",
              },
            },
          ],
          LastEvaluatedShardId: "shardId-000000001",
        },
      });
      const res = await get(`/streams/${encodeURIComponent(streamArn)}`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.shards[0].parentShardId).toBe("shardId-000000000");
      expect(body.shards[0].adjacentParentShardId).toBe("shardId-000000000");
      expect(body.shards[0].sequenceNumberRange.endingSequenceNumber).toBe("200");
      expect(body.lastEvaluatedShardId).toBe("shardId-000000001");
    });
  });

  describe("Get Shard Iterator", () => {
    const streamArn = "arn:aws:dynamodb:us-east-1:123456789012:table/users/stream/2025-01-01";

    it("POST /streams/:arn/shard-iterator — returns iterator", async () => {
      mockSend.mockResolvedValueOnce({
        ShardIterator: "arn:aws:dynamodb:...iterator#1",
      });
      const res = await post(
        `/streams/${encodeURIComponent(streamArn)}/shard-iterator`,
        { shardId: "shardId-000000000", shardIteratorType: "TRIM_HORIZON" }
      );
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.shardIterator).toBe("arn:aws:dynamodb:...iterator#1");
    });

    it("POST /streams/:arn/shard-iterator — includes sequence number when provided", async () => {
      mockSend.mockResolvedValueOnce({ ShardIterator: "iter" });
      await post(
        `/streams/${encodeURIComponent(streamArn)}/shard-iterator`,
        {
          shardId: "shardId-000000000",
          shardIteratorType: "AT_SEQUENCE_NUMBER",
          sequenceNumber: "000000000001",
        }
      );
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.SequenceNumber).toBe("000000000001");
      expect(cmd.ShardIteratorType).toBe("AT_SEQUENCE_NUMBER");
    });

    it("POST /streams/:arn/shard-iterator — 400 when shardId missing", async () => {
      const res = await post(
        `/streams/${encodeURIComponent(streamArn)}/shard-iterator`,
        { shardIteratorType: "LATEST" }
      );
      expect(res.status).toBe(400);
    });

    it("POST /streams/:arn/shard-iterator — 400 when shardIteratorType missing", async () => {
      const res = await post(
        `/streams/${encodeURIComponent(streamArn)}/shard-iterator`,
        { shardId: "shardId-000000000" }
      );
      expect(res.status).toBe(400);
    });

    it("POST /streams/:arn/shard-iterator — 400 when both missing", async () => {
      const res = await post(
        `/streams/${encodeURIComponent(streamArn)}/shard-iterator`,
        {}
      );
      expect(res.status).toBe(400);
    });
  });

  describe("Get Records", () => {
    it("POST /streams/records — returns records with next iterator", async () => {
      mockSend.mockResolvedValueOnce({
        Records: [
          {
            eventID: "abc123",
            eventName: "INSERT",
            eventVersion: "1.1",
            eventSource: "aws:dynamodb",
            awsRegion: "us-east-1",
            dynamodb: {
              ApproximateCreationDateTime: 1700000000,
              Keys: { pk: { S: "user1" } },
              NewImage: { pk: { S: "user1" }, name: { S: "Alice" } },
              OldImage: {},
              SequenceNumber: "000000000001",
              SizeBytes: 50,
              StreamViewType: "NEW_AND_OLD_IMAGES",
            },
          },
        ],
        NextShardIterator: "next-iterator-123",
        MillisBehindLatest: 0,
      });
      const res = await post("/streams/records", {
        shardIterator: "iterator-abc",
        limit: 25,
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.records[0].eventName).toBe("INSERT");
      expect(body.records[0].dynamodb.keys).toEqual({ pk: { S: "user1" } });
      expect(body.records[0].dynamodb.newImage.name).toEqual({ S: "Alice" });
      expect(body.nextShardIterator).toBe("next-iterator-123");
      expect(body.millisBehindLatest).toBe(0);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.ShardIterator).toBe("iterator-abc");
      expect(cmd.Limit).toBe(25);
    });

    it("POST /streams/records — handles empty records", async () => {
      mockSend.mockResolvedValueOnce({
        Records: [],
        NextShardIterator: null,
        MillisBehindLatest: 0,
      });
      const res = await post("/streams/records", {
        shardIterator: "iterator-abc",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(0);
      expect(body.records).toEqual([]);
      expect(body.nextShardIterator).toBeNull();
    });

    it("POST /streams/records — handles MODIFY and REMOVE events", async () => {
      mockSend.mockResolvedValueOnce({
        Records: [
          {
            eventID: "mod1",
            eventName: "MODIFY",
            eventVersion: "1.1",
            eventSource: "aws:dynamodb",
            awsRegion: "us-east-1",
            dynamodb: {
              ApproximateCreationDateTime: 1700000001,
              Keys: { pk: { S: "user1" } },
              NewImage: { pk: { S: "user1" }, name: { S: "Bob" } },
              OldImage: { pk: { S: "user1" }, name: { S: "Alice" } },
              SequenceNumber: "000000000002",
              SizeBytes: 50,
              StreamViewType: "NEW_AND_OLD_IMAGES",
            },
          },
          {
            eventID: "del1",
            eventName: "REMOVE",
            eventVersion: "1.1",
            eventSource: "aws:dynamodb",
            awsRegion: "us-east-1",
            dynamodb: {
              ApproximateCreationDateTime: 1700000002,
              Keys: { pk: { S: "user2" } },
              NewImage: {},
              OldImage: { pk: { S: "user2" }, name: { S: "Charlie" } },
              SequenceNumber: "000000000003",
              SizeBytes: 50,
              StreamViewType: "NEW_AND_OLD_IMAGES",
            },
          },
        ],
        NextShardIterator: null,
        MillisBehindLatest: 500,
      });
      const res = await post("/streams/records", {
        shardIterator: "iterator-xyz",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(2);
      expect(body.records[0].eventName).toBe("MODIFY");
      expect(body.records[1].eventName).toBe("REMOVE");
      expect(body.records[0].dynamodb.oldImage).toBeDefined();
      expect(body.millisBehindLatest).toBe(500);
    });

    it("POST /streams/records — 400 when shardIterator missing", async () => {
      const res = await post("/streams/records", {});
      expect(res.status).toBe(400);
    });

    it("POST /streams/records — handles record without dynamodb data", async () => {
      mockSend.mockResolvedValueOnce({
        Records: [
          {
            eventID: "evt1",
            eventName: "INSERT",
            eventVersion: "1.1",
            eventSource: "aws:dynamodb",
            awsRegion: "us-east-1",
          },
        ],
        NextShardIterator: null,
        MillisBehindLatest: 0,
      });
      const res = await post("/streams/records", {
        shardIterator: "iter",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.records[0].dynamodb).toBeNull();
    });

    it("POST /streams/records — default limit not set when omitted", async () => {
      mockSend.mockResolvedValueOnce({
        Records: [],
        NextShardIterator: null,
        MillisBehindLatest: 0,
      });
      await post("/streams/records", { shardIterator: "iter" });
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.Limit).toBeUndefined();
    });
  });
});
