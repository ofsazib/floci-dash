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
  PutRecordCommand,
  PutRecordsCommand,
  GetShardIteratorCommand,
  GetRecordsCommand,
  ListTagsForStreamCommand,
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

export default router;
