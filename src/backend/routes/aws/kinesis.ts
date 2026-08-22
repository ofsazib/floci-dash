import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { KinesisClient } from "@aws-sdk/client-kinesis";
import {
  ListStreamsCommand,
  DescribeStreamCommand,
  DescribeStreamSummaryCommand,
  CreateStreamCommand,
  DeleteStreamCommand,
  ListShardsCommand,
  ListStreamConsumersCommand,
  RegisterStreamConsumerCommand,
  DeregisterStreamConsumerCommand,
  DescribeStreamConsumerCommand,
  SubscribeToShardCommand,
  PutRecordCommand,
  PutRecordsCommand,
  GetShardIteratorCommand,
  GetRecordsCommand,
  ListTagsForStreamCommand,
  IncreaseStreamRetentionPeriodCommand,
  DecreaseStreamRetentionPeriodCommand,
  StartStreamEncryptionCommand,
  StopStreamEncryptionCommand,
  EnableEnhancedMonitoringCommand,
  DisableEnhancedMonitoringCommand,
  UpdateStreamModeCommand,
  SplitShardCommand,
  MergeShardsCommand,
  AddTagsToStreamCommand,
  RemoveTagsFromStreamCommand,
} from "@aws-sdk/client-kinesis";

const router = new Hono();
const getClient = () => create(KinesisClient);

// ── Streams ──────────────────────────────────────────────

router.get("/streams", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListStreamsCommand({}));
  const streamNames = result.StreamNames || [];

  if (!streamNames.length) return c.json({ streams: [], total: 0 });

  const detailed = await Promise.all(
    streamNames.map((name) =>
      client.send(new DescribeStreamSummaryCommand({ StreamName: name }))
    )
  );
  const streams = detailed
    .map((r) => r.StreamDescriptionSummary)
    .filter(Boolean);
  return c.json({ streams, total: streams.length });
});

router.get("/streams/:name", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  const result = await client.send(new DescribeStreamCommand({ StreamName: name }));
  return c.json({ stream: result.StreamDescription });
});

router.post("/streams", async (c: Context) => {
  const body = await c.req.json<{
    streamName: string;
    shardCount?: number;
    streamModeDetails?: { StreamMode: string };
  }>();
  if (!body.streamName) return c.json({ error: "streamName is required" }, 400);

  const client = getClient();
  await client.send(
    new CreateStreamCommand({
      StreamName: body.streamName,
      ShardCount: body.shardCount ?? 1,
      StreamModeDetails: body.streamModeDetails as any,
    })
  );
  return c.json({ created: true }, 201);
});

router.delete("/streams/:name", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  await client.send(new DeleteStreamCommand({ StreamName: name }));
  return c.json({ deleted: true });
});

// ── Shards ───────────────────────────────────────────────

router.get("/streams/:name/shards", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  const result = await client.send(new ListShardsCommand({ StreamName: name }));
  const shards = result.Shards || [];
  return c.json({ shards, total: shards.length });
});

// ── Consumers ────────────────────────────────────────────

router.get("/streams/:name/consumers", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  const describeResult = await client.send(new DescribeStreamCommand({ StreamName: name }));
  const streamARN = describeResult.StreamDescription?.StreamARN;
  if (!streamARN) return c.json({ consumers: [], total: 0 });

  const result = await client.send(new ListStreamConsumersCommand({ StreamARN: streamARN }));
  const consumers = result.Consumers || [];
  return c.json({ consumers, total: consumers.length });
});

router.post("/streams/:name/consumers", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<{ consumerName: string }>();
  if (!body.consumerName) return c.json({ error: "consumerName is required" }, 400);

  const client = getClient();
  const describeResult = await client.send(new DescribeStreamCommand({ StreamName: name }));
  const streamARN = describeResult.StreamDescription?.StreamARN;
  if (!streamARN) return c.json({ error: "stream not found" }, 404);

  const result = await client.send(
    new RegisterStreamConsumerCommand({
      StreamARN: streamARN,
      ConsumerName: body.consumerName,
    })
  );
  return c.json({ consumer: result.Consumer }, 201);
});

router.delete("/streams/:name/consumers/:consumerName", async (c: Context) => {
  const name = c.req.param("name");
  const consumerName = c.req.param("consumerName");
  const client = getClient();
  const describeResult = await client.send(new DescribeStreamCommand({ StreamName: name }));
  const streamARN = describeResult.StreamDescription?.StreamARN;
  if (!streamARN) return c.json({ error: "stream not found" }, 404);

  await client.send(
    new DeregisterStreamConsumerCommand({
      StreamARN: streamARN,
      ConsumerName: consumerName,
    })
  );
  return c.json({ deregistered: true });
});

router.get("/streams/:name/consumers/:consumerName", async (c: Context) => {
  const name = c.req.param("name");
  const consumerName = c.req.param("consumerName");
  const client = getClient();
  const describeResult = await client.send(new DescribeStreamCommand({ StreamName: name }));
  const streamARN = describeResult.StreamDescription?.StreamARN;
  if (!streamARN) return c.json({ error: "stream not found" }, 404);

  const result = await client.send(
    new DescribeStreamConsumerCommand({
      StreamARN: streamARN,
      ConsumerName: consumerName,
    })
  );
  return c.json({ consumer: result.ConsumerDescription });
});

// ── SubscribeToShard (Enhanced Fan-out) ──────────────────

router.post("/streams/:name/subscribe-to-shard", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<{
    consumerARN: string;
    shardId: string;
    startingPosition?: { Type: string; SequenceNumber?: string; Timestamp?: number };
  }>();
  if (!body.consumerARN) return c.json({ error: "consumerARN is required" }, 400);
  if (!body.shardId) return c.json({ error: "shardId is required" }, 400);

  const client = getClient();
  const result = await client.send(
    new SubscribeToShardCommand({
      ConsumerARN: body.consumerARN,
      ShardId: body.shardId,
      StartingPosition: (body.startingPosition || { Type: "TRIM_HORIZON" }) as any,
    })
  );

  // Collect all events from the async event stream
  const events: any[] = [];
  if (result.EventStream) {
    for await (const event of result.EventStream) {
      const rec_event = (event as any).SubscribeToShardEvent;
      if (rec_event?.Records) {
        for (const rec of rec_event.Records) {
          events.push({
            sequenceNumber: rec.SequenceNumber,
            data: rec.Data ? Buffer.from(rec.Data).toString("base64") : null,
            partitionKey: rec.PartitionKey,
            approximateArrivalTimestamp: rec.ApproximateArrivalTimestamp,
            encryptionType: rec.EncryptionType,
          });
        }
      }
    }
  }

  return c.json({ events, total: events.length });
});

// ── Records (Data Plane) ─────────────────────────────────

router.post("/streams/:name/records", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<{
    data: string;
    partitionKey: string;
  }>();
  if (body.data === undefined) return c.json({ error: "data is required" }, 400);
  if (!body.partitionKey) return c.json({ error: "partitionKey is required" }, 400);

  const client = getClient();
  const result = await client.send(
    new PutRecordCommand({
      StreamName: name,
      Data: Buffer.from(body.data),
      PartitionKey: body.partitionKey,
    })
  );
  return c.json(
    { sequenceNumber: result.SequenceNumber, shardId: result.ShardId },
    201
  );
});

router.post("/streams/:name/records/batch", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<{
    records: { data: string; partitionKey: string }[];
  }>();
  if (!body.records?.length) return c.json({ error: "records is required" }, 400);

  const client = getClient();
  const result = await client.send(
    new PutRecordsCommand({
      StreamName: name,
      Records: body.records.map((r) => ({
        Data: Buffer.from(r.data),
        PartitionKey: r.partitionKey,
      })),
    })
  );
  return c.json(
    {
      records: result.Records || [],
      failedRecordCount: result.FailedRecordCount,
    },
    201
  );
});

router.get("/streams/:name/shards/:shardId/records", async (c: Context) => {
  const name = c.req.param("name");
  const shardId = c.req.param("shardId");
  const shardIteratorType = c.req.query("type") || "TRIM_HORIZON";
  const client = getClient();

  const iteratorResult = await client.send(
    new GetShardIteratorCommand({
      StreamName: name,
      ShardId: shardId,
      ShardIteratorType: shardIteratorType as any,
    })
  );
  const shardIterator = iteratorResult.ShardIterator;
  if (!shardIterator) return c.json({ records: [], total: 0 });

  const recordsResult = await client.send(
    new GetRecordsCommand({ ShardIterator: shardIterator })
  );
  return c.json({
    records: recordsResult.Records || [],
    nextShardIterator: recordsResult.NextShardIterator,
    millisBehindLatest: recordsResult.MillisBehindLatest,
  });
});

// ── Tags ─────────────────────────────────────────────────

router.get("/streams/:name/tags", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  const result = await client.send(new ListTagsForStreamCommand({ StreamName: name }));
  return c.json({ tags: result.Tags || [] });
});

router.put("/streams/:name/tags", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<{ tags?: Record<string, string> }>();
  if (!body.tags || !Object.keys(body.tags).length)
    return c.json({ error: "tags is required" }, 400);

  const client = getClient();
  await client.send(new AddTagsToStreamCommand({ StreamName: name, Tags: body.tags }));
  return c.json({ tagged: true });
});

router.delete("/streams/:name/tags", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<{ tagKeys?: string[] }>();
  if (!body.tagKeys?.length) return c.json({ error: "tagKeys is required" }, 400);

  const client = getClient();
  await client.send(
    new RemoveTagsFromStreamCommand({ StreamName: name, TagKeys: body.tagKeys })
  );
  return c.json({ untagged: true });
});

// ── Retention ────────────────────────────────────────────

async function changeRetention(c: Context, command: any) {
  const name = c.req.param("name");
  const body = await c.req.json<{ retentionPeriodHours?: number }>();
  if (!body.retentionPeriodHours)
    return c.json({ error: "retentionPeriodHours is required" }, 400);

  const client = getClient();
  await client.send(new command({ StreamName: name, RetentionPeriodHours: body.retentionPeriodHours }));
  return c.json({ updated: true });
}

router.post("/streams/:name/retention/increase", (c: Context) => changeRetention(c, IncreaseStreamRetentionPeriodCommand));
router.post("/streams/:name/retention/decrease", (c: Context) => changeRetention(c, DecreaseStreamRetentionPeriodCommand));

// ── Encryption ───────────────────────────────────────────

router.post("/streams/:name/encryption/start", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<{ encryptionType?: string; keyId?: string }>();
  if (!body.encryptionType) return c.json({ error: "encryptionType is required" }, 400);
  if (!body.keyId) return c.json({ error: "keyId is required" }, 400);

  const client = getClient();
  await client.send(
    new StartStreamEncryptionCommand({
      StreamName: name,
      EncryptionType: body.encryptionType as any,
      KeyId: body.keyId,
    })
  );
  return c.json({ updated: true });
});

router.post("/streams/:name/encryption/stop", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  // AWS requires EncryptionType/KeyId on StopStreamEncryption; Floci ignores them
  await client.send(
    new StopStreamEncryptionCommand({
      StreamName: name,
      EncryptionType: "NONE",
      KeyId: "",
    })
  );
  return c.json({ updated: true });
});

// ── Enhanced Monitoring ──────────────────────────────────

async function changeMonitoring(c: Context, command: any) {
  const name = c.req.param("name");
  const body = await c.req.json<{ shardLevelMetrics?: string[] }>();

  const client = getClient();
  const result: any = await client.send(
    new command({ StreamName: name, ShardLevelMetrics: body.shardLevelMetrics || [] })
  );
  return c.json({
    streamName: result.StreamName,
    streamARN: result.StreamARN,
    currentShardLevelMetrics: result.CurrentShardLevelMetrics || [],
    desiredShardLevelMetrics: result.DesiredShardLevelMetrics || [],
  });
}

router.post("/streams/:name/monitoring/enable", (c: Context) => changeMonitoring(c, EnableEnhancedMonitoringCommand));
router.post("/streams/:name/monitoring/disable", (c: Context) => changeMonitoring(c, DisableEnhancedMonitoringCommand));

// ── Stream Mode ──────────────────────────────────────────

router.put("/streams/:name/stream-mode", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<{ streamARN?: string; streamMode?: string }>();
  if (!body.streamARN) return c.json({ error: "streamARN is required" }, 400);
  if (!body.streamMode) return c.json({ error: "streamMode is required" }, 400);

  const client = getClient();
  await client.send(
    new UpdateStreamModeCommand({
      // Floci requires StreamARN only — StreamName is not valid per the AWS API
      StreamARN: body.streamARN,
      StreamModeDetails: { StreamMode: body.streamMode as any },
    })
  );
  return c.json({ updated: true });
});

// ── Resharding ───────────────────────────────────────────

router.post("/streams/:name/shards/split", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<{ shardToSplit?: string; newStartingHashKey?: string }>();
  if (!body.shardToSplit) return c.json({ error: "shardToSplit is required" }, 400);
  if (!body.newStartingHashKey)
    return c.json({ error: "newStartingHashKey is required" }, 400);

  const client = getClient();
  await client.send(
    new SplitShardCommand({
      StreamName: name,
      ShardToSplit: body.shardToSplit,
      NewStartingHashKey: body.newStartingHashKey,
    })
  );
  return c.json({ split: true });
});

router.post("/streams/:name/shards/merge", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<{ shardToMerge?: string; adjacentShardToMerge?: string }>();
  if (!body.shardToMerge) return c.json({ error: "shardToMerge is required" }, 400);
  if (!body.adjacentShardToMerge)
    return c.json({ error: "adjacentShardToMerge is required" }, 400);

  const client = getClient();
  await client.send(
    new MergeShardsCommand({
      StreamName: name,
      ShardToMerge: body.shardToMerge,
      AdjacentShardToMerge: body.adjacentShardToMerge,
    })
  );
  return c.json({ merged: true });
});

export default router;
