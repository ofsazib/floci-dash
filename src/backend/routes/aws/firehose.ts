import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { FirehoseClient } from "@aws-sdk/client-firehose";
import {
  ListDeliveryStreamsCommand,
  DescribeDeliveryStreamCommand,
  CreateDeliveryStreamCommand,
  DeleteDeliveryStreamCommand,
  PutRecordCommand,
  PutRecordBatchCommand,
  ListTagsForDeliveryStreamCommand,
} from "@aws-sdk/client-firehose";

const router = new Hono();
const getClient = () => create(FirehoseClient);

// ── Delivery Streams ─────────────────────────────────────

router.get("/streams", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListDeliveryStreamsCommand({}));
  const streamNames = result.DeliveryStreamNames || [];

  if (!streamNames.length) return c.json({ streams: [], total: 0 });

  const detailed = await Promise.all(
    streamNames.map((name) => client.send(new DescribeDeliveryStreamCommand({ DeliveryStreamName: name })))
  );
  const streams = detailed.map((r) => r.DeliveryStreamDescription).filter(Boolean);
  return c.json({ streams, total: streams.length });
});

router.get("/streams/:name", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  const result = await client.send(new DescribeDeliveryStreamCommand({ DeliveryStreamName: name }));
  return c.json({ stream: result.DeliveryStreamDescription });
});

router.post("/streams", async (c: Context) => {
  const body = await c.req.json<{
    deliveryStreamName: string;
    s3DestinationConfiguration?: {
      bucketARN: string;
      prefix?: string;
      bufferingHints?: { sizeInMBs?: number; intervalInSeconds?: number };
    };
  }>();
  if (!body.deliveryStreamName) return c.json({ error: "deliveryStreamName is required" }, 400);

  const client = getClient();
  const result = await client.send(
    new CreateDeliveryStreamCommand({
      DeliveryStreamName: body.deliveryStreamName,
      S3DestinationConfiguration: body.s3DestinationConfiguration as any,
    })
  );
  return c.json({ deliveryStreamARN: result.DeliveryStreamARN }, 201);
});

router.delete("/streams/:name", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  await client.send(new DeleteDeliveryStreamCommand({ DeliveryStreamName: name }));
  return c.json({ deleted: true });
});

// ── Records (Data Plane) ─────────────────────────────────

router.post("/streams/:name/records", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<{ data: string }>();
  if (body.data === undefined) return c.json({ error: "data is required" }, 400);

  const client = getClient();
  const result = await client.send(
    new PutRecordCommand({
      DeliveryStreamName: name,
      Record: { Data: Buffer.from(body.data) },
    })
  );
  return c.json({ recordId: result.RecordId }, 201);
});

router.post("/streams/:name/records/batch", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<{ records: { data: string }[] }>();
  if (!body.records?.length) return c.json({ error: "records is required" }, 400);

  const client = getClient();
  const result = await client.send(
    new PutRecordBatchCommand({
      DeliveryStreamName: name,
      Records: body.records.map((r) => ({ Data: Buffer.from(r.data) })),
    })
  );
  return c.json(
    { failedPutCount: result.FailedPutCount, requestResponses: result.RequestResponses || [] },
    201
  );
});

// ── Tags ─────────────────────────────────────────────────

router.get("/streams/:name/tags", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  const result = await client.send(new ListTagsForDeliveryStreamCommand({ DeliveryStreamName: name }));
  return c.json({ tags: result.Tags || [], hasMoreTags: result.HasMoreTags });
});

export default router;
