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
  RegisterStreamConsumerCommand: createCmd("RegisterStreamConsumerCommand"),
  DeregisterStreamConsumerCommand: createCmd("DeregisterStreamConsumerCommand"),
  DescribeStreamConsumerCommand: createCmd("DescribeStreamConsumerCommand"),
  SubscribeToShardCommand: createCmd("SubscribeToShardCommand"),
  PutRecordCommand: createCmd("PutRecordCommand"),
  PutRecordsCommand: createCmd("PutRecordsCommand"),
  GetShardIteratorCommand: createCmd("GetShardIteratorCommand"),
  GetRecordsCommand: createCmd("GetRecordsCommand"),
  ListTagsForStreamCommand: createCmd("ListTagsForStreamCommand"),
  IncreaseStreamRetentionPeriodCommand: createCmd("IncreaseStreamRetentionPeriodCommand"),
  DecreaseStreamRetentionPeriodCommand: createCmd("DecreaseStreamRetentionPeriodCommand"),
  StartStreamEncryptionCommand: createCmd("StartStreamEncryptionCommand"),
  StopStreamEncryptionCommand: createCmd("StopStreamEncryptionCommand"),
  EnableEnhancedMonitoringCommand: createCmd("EnableEnhancedMonitoringCommand"),
  DisableEnhancedMonitoringCommand: createCmd("DisableEnhancedMonitoringCommand"),
  UpdateStreamModeCommand: createCmd("UpdateStreamModeCommand"),
  SplitShardCommand: createCmd("SplitShardCommand"),
  MergeShardsCommand: createCmd("MergeShardsCommand"),
  AddTagsToStreamCommand: createCmd("AddTagsToStreamCommand"),
  RemoveTagsFromStreamCommand: createCmd("RemoveTagsFromStreamCommand"),
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

async function delBody(path: string, body: any) {
  return router.request(path, {
    method: "DELETE",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
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

    it("GET /streams — sparse response defaults to empty list", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/streams");
      const body = await res.json();
      expect(body.total).toBe(0);
      expect(body.streams).toEqual([]);
      expect(mockSend).toHaveBeenCalledTimes(1);
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

    it("GET /streams/:name/shards — sparse response defaults to empty list", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/streams/stream-1/shards");
      const body = await res.json();
      expect(body.shards).toEqual([]);
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

    it("GET /streams/:name/consumers — sparse consumers response defaults to empty list", async () => {
      mockSend
        .mockResolvedValueOnce({
          StreamDescription: { StreamARN: "arn:aws:kinesis:us-east-1:123:stream/stream-1" },
        })
        .mockResolvedValueOnce({});
      const res = await get("/streams/stream-1/consumers");
      const body = await res.json();
      expect(body.consumers).toEqual([]);
      expect(body.total).toBe(0);
    });

    it("POST /streams/:name/consumers — registers consumer (201)", async () => {
      mockSend
        .mockResolvedValueOnce({
          StreamDescription: { StreamARN: "arn:aws:kinesis:us-east-1:123:stream/stream-1" },
        })
        .mockResolvedValueOnce({
          Consumer: { ConsumerName: "my-consumer", ConsumerStatus: "ACTIVE" },
        });
      const res = await post("/streams/stream-1/consumers", { consumerName: "my-consumer" });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.consumer.ConsumerName).toBe("my-consumer");
    });

    it("POST /streams/:name/consumers — 400 if consumerName missing", async () => {
      const res = await post("/streams/stream-1/consumers", {});
      expect(res.status).toBe(400);
    });

    it("POST /streams/:name/consumers — 404 if stream not found", async () => {
      mockSend.mockResolvedValueOnce({ StreamDescription: {} });
      const res = await post("/streams/stream-1/consumers", { consumerName: "my-consumer" });
      expect(res.status).toBe(404);
    });

    it("DELETE /streams/:name/consumers/:consumerName — deregisters consumer", async () => {
      mockSend.mockResolvedValueOnce({
        StreamDescription: { StreamARN: "arn:aws:kinesis:us-east-1:123:stream/stream-1" },
      }).mockResolvedValueOnce({});
      const res = await del("/streams/stream-1/consumers/my-consumer");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deregistered).toBe(true);
    });

    it("DELETE /streams/:name/consumers/:consumerName — 404 if stream not found", async () => {
      mockSend.mockResolvedValueOnce({ StreamDescription: {} });
      const res = await del("/streams/stream-1/consumers/my-consumer");
      expect(res.status).toBe(404);
    });

    it("GET /streams/:name/consumers/:consumerName — describes consumer", async () => {
      mockSend.mockResolvedValueOnce({
        StreamDescription: { StreamARN: "arn:aws:kinesis:us-east-1:123:stream/stream-1" },
      }).mockResolvedValueOnce({
        ConsumerDescription: { ConsumerName: "my-consumer", ConsumerStatus: "ACTIVE", ConsumerARN: "arn:..." },
      });
      const res = await get("/streams/stream-1/consumers/my-consumer");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.consumer.ConsumerName).toBe("my-consumer");
    });

    it("GET /streams/:name/consumers/:consumerName — 404 if stream not found", async () => {
      mockSend.mockResolvedValueOnce({ StreamDescription: {} });
      const res = await get("/streams/stream-1/consumers/my-consumer");
      expect(res.status).toBe(404);
    });
  });

  describe("SubscribeToShard", () => {
    it("POST /streams/:name/subscribe-to-shard — subscribes and returns events", async () => {
      // Mock an async event stream that yields a SubscribeToShardEvent
      const mockEventStream = (async function* () {
        yield {
          SubscribeToShardEvent: {
            Records: [
              {
                SequenceNumber: "123",
                Data: Buffer.from("hello"),
                PartitionKey: "key1",
                ApproximateArrivalTimestamp: new Date("2026-01-01"),
                EncryptionType: "KMS",
              },
            ],
          },
        };
      })();

      mockSend.mockResolvedValueOnce({
        EventStream: mockEventStream,
      });

      const res = await post("/streams/stream-1/subscribe-to-shard", {
        consumerARN: "arn:aws:kinesis:us-east-1:123:stream/stream-1/consumer/my-consumer",
        shardId: "shardId-000000000001",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.events[0].sequenceNumber).toBe("123");
      expect(body.events[0].partitionKey).toBe("key1");
      expect(body.events[0].data).toBe("aGVsbG8="); // Buffer.from("hello") base64
    });

    it("POST /streams/:name/subscribe-to-shard — 400 if consumerARN missing", async () => {
      const res = await post("/streams/stream-1/subscribe-to-shard", { shardId: "shard-1" });
      expect(res.status).toBe(400);
    });

    it("POST /streams/:name/subscribe-to-shard — 400 if shardId missing", async () => {
      const res = await post("/streams/stream-1/subscribe-to-shard", { consumerARN: "arn:..." });
      expect(res.status).toBe(400);
    });

    it("POST /streams/:name/subscribe-to-shard — empty when no EventStream", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/streams/stream-1/subscribe-to-shard", {
        consumerARN: "arn:...",
        shardId: "shard-1",
      });
      const body = await res.json();
      expect(body.total).toBe(0);
      expect(body.events).toEqual([]);
    });

    it("POST /streams/:name/subscribe-to-shard — skips events without records", async () => {
      const mockEventStream = (async function* () {
        yield {};
      })();
      mockSend.mockResolvedValueOnce({ EventStream: mockEventStream });
      const res = await post("/streams/stream-1/subscribe-to-shard", {
        consumerARN: "arn:...",
        shardId: "shard-1",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(0);
      expect(body.events).toEqual([]);
    });

    it("POST /streams/:name/subscribe-to-shard — record without data maps to null", async () => {
      const mockEventStream = (async function* () {
        yield {
          SubscribeToShardEvent: {
            Records: [{ SequenceNumber: "456", PartitionKey: "key2" }],
          },
        };
      })();
      mockSend.mockResolvedValueOnce({ EventStream: mockEventStream });
      const res = await post("/streams/stream-1/subscribe-to-shard", {
        consumerARN: "arn:...",
        shardId: "shard-1",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.events[0].data).toBeNull();
      expect(body.events[0].sequenceNumber).toBe("456");
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

    it("POST /streams/:name/records/batch — sparse response defaults to empty records", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/streams/stream-1/records/batch", {
        records: [{ data: "hello", partitionKey: "key1" }],
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.records).toEqual([]);
      expect(body.failedRecordCount).toBeUndefined();
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

    it("GET /streams/:name/shards/:shardId/records — sparse records response defaults to empty", async () => {
      mockSend
        .mockResolvedValueOnce({ ShardIterator: "iterator-123" })
        .mockResolvedValueOnce({});
      const res = await get("/streams/stream-1/shards/shard-1/records?type=TRIM_HORIZON");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.records).toEqual([]);
      expect(body.nextShardIterator).toBeUndefined();
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

    it("GET /streams/:name/tags — sparse response defaults to empty list", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/streams/stream-1/tags");
      const body = await res.json();
      expect(body.tags).toEqual([]);
    });

    it("PUT /streams/:name/tags — adds tags", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/streams/stream-1/tags", { tags: { env: "prod" } });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.tagged).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          __cmdName: "AddTagsToStreamCommand",
          StreamName: "stream-1",
          Tags: { env: "prod" },
        })
      );
    });

    it("PUT /streams/:name/tags — 400 when tags missing", async () => {
      const res = await put("/streams/stream-1/tags", {});
      expect(res.status).toBe(400);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("PUT /streams/:name/tags — 400 when tags empty object", async () => {
      const res = await put("/streams/stream-1/tags", { tags: {} });
      expect(res.status).toBe(400);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("DELETE /streams/:name/tags — removes tags", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await delBody("/streams/stream-1/tags", { tagKeys: ["env"] });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.untagged).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          __cmdName: "RemoveTagsFromStreamCommand",
          StreamName: "stream-1",
          TagKeys: ["env"],
        })
      );
    });

    it("DELETE /streams/:name/tags — 400 when tagKeys missing", async () => {
      const res = await delBody("/streams/stream-1/tags", {});
      expect(res.status).toBe(400);
      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  describe("Stream Management", () => {
    it("POST /streams/:name/retention/increase — increases retention", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/streams/stream-1/retention/increase", { retentionPeriodHours: 48 });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          __cmdName: "IncreaseStreamRetentionPeriodCommand",
          StreamName: "stream-1",
          RetentionPeriodHours: 48,
        })
      );
    });

    it("POST /streams/:name/retention/increase — 400 when hours missing", async () => {
      const res = await post("/streams/stream-1/retention/increase", {});
      expect(res.status).toBe(400);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("POST /streams/:name/retention/decrease — decreases retention", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/streams/stream-1/retention/decrease", { retentionPeriodHours: 24 });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          __cmdName: "DecreaseStreamRetentionPeriodCommand",
          RetentionPeriodHours: 24,
        })
      );
    });

    it("POST /streams/:name/retention/decrease — 400 when hours missing", async () => {
      const res = await post("/streams/stream-1/retention/decrease", {});
      expect(res.status).toBe(400);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("POST /streams/:name/encryption/start — starts encryption", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/streams/stream-1/encryption/start", {
        encryptionType: "KMS",
        keyId: "alias/aws/kinesis",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          __cmdName: "StartStreamEncryptionCommand",
          StreamName: "stream-1",
          EncryptionType: "KMS",
          KeyId: "alias/aws/kinesis",
        })
      );
    });

    it("POST /streams/:name/encryption/start — 400 when encryptionType missing", async () => {
      const res = await post("/streams/stream-1/encryption/start", { keyId: "k1" });
      expect(res.status).toBe(400);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("POST /streams/:name/encryption/start — 400 when keyId missing", async () => {
      const res = await post("/streams/stream-1/encryption/start", { encryptionType: "KMS" });
      expect(res.status).toBe(400);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("POST /streams/:name/encryption/stop — stops encryption", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/streams/stream-1/encryption/stop");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          __cmdName: "StopStreamEncryptionCommand",
          StreamName: "stream-1",
        })
      );
    });

    it("POST /streams/:name/monitoring/enable — enables and maps metrics", async () => {
      mockSend.mockResolvedValueOnce({
        StreamName: "stream-1",
        StreamARN: "arn:aws:kinesis:us-east-1::stream/stream-1",
        CurrentShardLevelMetrics: ["IncomingBytes"],
        DesiredShardLevelMetrics: ["IncomingBytes", "OutgoingBytes"],
      });
      const res = await post("/streams/stream-1/monitoring/enable", {
        shardLevelMetrics: ["IncomingBytes"],
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.streamName).toBe("stream-1");
      expect(body.streamARN).toContain("stream-1");
      expect(body.currentShardLevelMetrics).toEqual(["IncomingBytes"]);
      expect(body.desiredShardLevelMetrics).toEqual(["IncomingBytes", "OutgoingBytes"]);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          __cmdName: "EnableEnhancedMonitoringCommand",
          ShardLevelMetrics: ["IncomingBytes"],
        })
      );
    });

    it("POST /streams/:name/monitoring/enable — sparse response defaults to empty arrays", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/streams/stream-1/monitoring/enable", { shardLevelMetrics: [] });
      const body = await res.json();
      expect(body.currentShardLevelMetrics).toEqual([]);
      expect(body.desiredShardLevelMetrics).toEqual([]);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({ ShardLevelMetrics: [] })
      );
    });

    it("POST /streams/:name/monitoring/enable — omits metrics field when not provided", async () => {
      mockSend.mockResolvedValueOnce({ CurrentShardLevelMetrics: [] });
      const res = await post("/streams/stream-1/monitoring/enable", {});
      expect(res.status).toBe(200);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({ ShardLevelMetrics: [] })
      );
    });

    it("POST /streams/:name/monitoring/disable — disables and returns metrics", async () => {
      mockSend.mockResolvedValueOnce({
        StreamName: "stream-1",
        CurrentShardLevelMetrics: [],
        DesiredShardLevelMetrics: [],
      });
      const res = await post("/streams/stream-1/monitoring/disable", {
        shardLevelMetrics: ["IncomingBytes"],
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.streamName).toBe("stream-1");
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          __cmdName: "DisableEnhancedMonitoringCommand",
        })
      );
    });

    it("PUT /streams/:name/stream-mode — updates mode via ARN", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/streams/stream-1/stream-mode", {
        streamARN: "arn:aws:kinesis:us-east-1::stream/stream-1",
        streamMode: "ON_DEMAND",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          __cmdName: "UpdateStreamModeCommand",
          StreamARN: "arn:aws:kinesis:us-east-1::stream/stream-1",
          StreamModeDetails: { StreamMode: "ON_DEMAND" },
        })
      );
    });

    it("PUT /streams/:name/stream-mode — 400 when streamARN missing", async () => {
      const res = await put("/streams/stream-1/stream-mode", { streamMode: "ON_DEMAND" });
      expect(res.status).toBe(400);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("PUT /streams/:name/stream-mode — 400 when streamMode missing", async () => {
      const res = await put("/streams/stream-1/stream-mode", {
        streamARN: "arn:aws:kinesis:us-east-1::stream/stream-1",
      });
      expect(res.status).toBe(400);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("POST /streams/:name/shards/split — splits shard", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/streams/stream-1/shards/split", {
        shardToSplit: "shardId-000000000000",
        newStartingHashKey: "170141183460469231731687303715884105728",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.split).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          __cmdName: "SplitShardCommand",
          ShardToSplit: "shardId-000000000000",
          NewStartingHashKey: "170141183460469231731687303715884105728",
        })
      );
    });

    it("POST /streams/:name/shards/split — 400 when shardToSplit missing", async () => {
      const res = await post("/streams/stream-1/shards/split", { newStartingHashKey: "1" });
      expect(res.status).toBe(400);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("POST /streams/:name/shards/split — 400 when newStartingHashKey missing", async () => {
      const res = await post("/streams/stream-1/shards/split", { shardToSplit: "shardId-1" });
      expect(res.status).toBe(400);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("POST /streams/:name/shards/merge — merges shards", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/streams/stream-1/shards/merge", {
        shardToMerge: "shardId-1",
        adjacentShardToMerge: "shardId-2",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.merged).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          __cmdName: "MergeShardsCommand",
          ShardToMerge: "shardId-1",
          AdjacentShardToMerge: "shardId-2",
        })
      );
    });

    it("POST /streams/:name/shards/merge — 400 when shardToMerge missing", async () => {
      const res = await post("/streams/stream-1/shards/merge", { adjacentShardToMerge: "s2" });
      expect(res.status).toBe(400);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("POST /streams/:name/shards/merge — 400 when adjacentShardToMerge missing", async () => {
      const res = await post("/streams/stream-1/shards/merge", { shardToMerge: "s1" });
      expect(res.status).toBe(400);
      expect(mockSend).not.toHaveBeenCalled();
    });
  });
});
