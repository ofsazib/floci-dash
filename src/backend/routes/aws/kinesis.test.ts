import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) {
      return { __cmdName: name, ...args };
    });
  };
});

vi.mock("@aws-sdk/client-kinesis", () => ({
  KinesisClient: vi.fn(function () {
    return { send: mockSend };
  }),
  ListStreamsCommand: createCmd("ListStreamsCommand"),
  DescribeStreamCommand: createCmd("DescribeStreamCommand"),
  DescribeStreamSummaryCommand: createCmd("DescribeStreamSummaryCommand"),
  CreateStreamCommand: createCmd("CreateStreamCommand"),
  DeleteStreamCommand: createCmd("DeleteStreamCommand"),
  ListShardsCommand: createCmd("ListShardsCommand"),
  ListStreamConsumersCommand: createCmd("ListStreamConsumersCommand"),
  PutRecordCommand: createCmd("PutRecordCommand"),
  PutRecordsCommand: createCmd("PutRecordsCommand"),
  GetShardIteratorCommand: createCmd("GetShardIteratorCommand"),
  GetRecordsCommand: createCmd("GetRecordsCommand"),
  ListTagsForStreamCommand: createCmd("ListTagsForStreamCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: (Ctor: any, extra?: any) => new Ctor(extra),
}));

import router from "./kinesis";

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

beforeEach(() => {
  mockSend.mockReset();
});

describe("Kinesis Routes", () => {
  describe("Streams", () => {
    it("GET /streams — lists streams with summaries", async () => {
      mockSend
        .mockResolvedValueOnce({ StreamNames: ["stream-1", "stream-2"] })
        .mockResolvedValueOnce({
          StreamDescriptionSummary: { StreamName: "stream-1", StreamStatus: "ACTIVE", StreamARN: "arn:...:stream-1", OpenShardCount: 2 },
        })
        .mockResolvedValueOnce({
          StreamDescriptionSummary: { StreamName: "stream-2", StreamStatus: "CREATING", StreamARN: "arn:...:stream-2", OpenShardCount: 1 },
        });
      const res = await get("/streams");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(2);
      expect(body.streams[0].StreamName).toBe("stream-1");
    });

    it("GET /streams — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ StreamNames: [] });
      const res = await get("/streams");
      const body = await res.json();
      expect(body.total).toBe(0);
      expect(body.streams).toEqual([]);
    });

    it("GET /streams/:name — describes stream", async () => {
      mockSend.mockResolvedValueOnce({
        StreamDescription: { StreamName: "stream-1", StreamStatus: "ACTIVE" },
      });
      const res = await get("/streams/stream-1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.stream.StreamName).toBe("stream-1");
    });

    it("POST /streams — creates stream (201)", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/streams", {
        streamName: "stream-1",
        shardCount: 3,
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.created).toBe(true);
    });

    it("POST /streams — 400 if streamName missing", async () => {
      const res = await post("/streams", { shardCount: 3 });
      expect(res.status).toBe(400);
    });

    it("POST /streams — defaults shardCount to 1", async () => {
      mockSend.mockResolvedValueOnce({});
      await post("/streams", { streamName: "stream-1" });
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it("DELETE /streams/:name — deletes stream", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/streams/stream-1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });
  });

  describe("Shards", () => {
    it("GET /streams/:name/shards — lists shards", async () => {
      mockSend.mockResolvedValueOnce({
        Shards: [
          { ShardId: "shardId-000000000001", HashKeyRange: { StartingHashKey: "0", EndingHashKey: "999" } },
        ],
      });
      const res = await get("/streams/stream-1/shards");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
    });

    it("GET /streams/:name/shards — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ Shards: [] });
      const res = await get("/streams/stream-1/shards");
      const body = await res.json();
      expect(body.total).toBe(0);
    });
  });

  describe("Consumers", () => {
    it("GET /streams/:name/consumers — lists consumers", async () => {
      mockSend
        .mockResolvedValueOnce({
          StreamDescription: { StreamARN: "arn:aws:kinesis:us-east-1:123:stream/stream-1" },
        })
        .mockResolvedValueOnce({
          Consumers: [{ ConsumerName: "consumer-1", ConsumerStatus: "ACTIVE" }],
        });
      const res = await get("/streams/stream-1/consumers");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
    });

    it("GET /streams/:name/consumers — returns empty when no StreamARN", async () => {
      mockSend.mockResolvedValueOnce({ StreamDescription: {} });
      const res = await get("/streams/stream-1/consumers");
      const body = await res.json();
      expect(body.total).toBe(0);
    });
  });

  describe("Records", () => {
    it("POST /streams/:name/records — puts single record (201)", async () => {
      mockSend.mockResolvedValueOnce({
        SequenceNumber: "12345",
        ShardId: "shardId-000000000001",
      });
      const res = await post("/streams/stream-1/records", {
        data: "hello",
        partitionKey: "key1",
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.sequenceNumber).toBe("12345");
      expect(body.shardId).toBe("shardId-000000000001");
    });

    it("POST /streams/:name/records — 400 if data missing", async () => {
      const res = await post("/streams/stream-1/records", { partitionKey: "key1" });
      expect(res.status).toBe(400);
    });

    it("POST /streams/:name/records — 400 if partitionKey missing", async () => {
      const res = await post("/streams/stream-1/records", { data: "hello" });
      expect(res.status).toBe(400);
    });

    it("POST /streams/:name/records/batch — puts batch records (201)", async () => {
      mockSend.mockResolvedValueOnce({
        Records: [{ SequenceNumber: "123", ShardId: "shard-1" }],
        FailedRecordCount: 0,
      });
      const res = await post("/streams/stream-1/records/batch", {
        records: [{ data: "hello", partitionKey: "key1" }],
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.failedRecordCount).toBe(0);
    });

    it("POST /streams/:name/records/batch — 400 if records missing", async () => {
      const res = await post("/streams/stream-1/records/batch", {});
      expect(res.status).toBe(400);
    });

    it("GET /streams/:name/shards/:shardId/records — gets records", async () => {
      mockSend
        .mockResolvedValueOnce({ ShardIterator: "iterator-123" })
        .mockResolvedValueOnce({
          Records: [{ SequenceNumber: "123", PartitionKey: "key1" }],
          NextShardIterator: "iterator-456",
          MillisBehindLatest: 0,
        });
      const res = await get("/streams/stream-1/shards/shardId-000000000001/records?type=TRIM_HORIZON");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.records.length).toBe(1);
      expect(body.nextShardIterator).toBe("iterator-456");
    });

    it("GET /streams/:name/shards/:shardId/records — empty when no iterator", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/streams/stream-1/shards/shard-1/records");
      const body = await res.json();
      expect(body.records).toEqual([]);
    });
  });

  describe("Tags", () => {
    it("GET /streams/:name/tags — lists tags", async () => {
      mockSend.mockResolvedValueOnce({
        Tags: [{ Key: "env", Value: "prod" }],
      });
      const res = await get("/streams/stream-1/tags");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.tags.length).toBe(1);
    });

    it("GET /streams/:name/tags — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ Tags: [] });
      const res = await get("/streams/stream-1/tags");
      const body = await res.json();
      expect(body.tags).toEqual([]);
    });
  });
});
