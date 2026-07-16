import { Hono } from "hono";
import type { Context } from "hono";
import {
  DynamoDBStreamsClient,
  ListStreamsCommand,
  DescribeStreamCommand,
  GetShardIteratorCommand,
  GetRecordsCommand,
} from "@aws-sdk/client-dynamodb-streams";
import { getAwsConfig } from "../../clients/aws";

const router = new Hono();

function streams(): DynamoDBStreamsClient {
  return new DynamoDBStreamsClient(getAwsConfig());
}

// ─── List Streams ─────────────────────────────────────────────────

router.get("/streams", async (c: Context) => {
  const tableName = c.req.query("tableName");
  const params: any = {};
  if (tableName) params.TableName = tableName;

  const result = await streams().send(new ListStreamsCommand(params));
  const streamList = (result.Streams || []).map((s) => ({
    streamArn: s.StreamArn,
    streamLabel: s.StreamLabel,
    tableName: s.TableName,
  }));
  return c.json({ streams: streamList, total: streamList.length });
});

// ─── Describe Stream ──────────────────────────────────────────────

router.get("/streams/:arn", async (c: Context) => {
  const streamArn = decodeURIComponent(c.req.param("arn") || "");
  const result = await streams().send(
    new DescribeStreamCommand({ StreamArn: streamArn })
  );
  const desc = result.StreamDescription;
  if (!desc) return c.json({ error: "Stream not found" }, 404);

  return c.json({
    streamArn: desc.StreamArn,
    streamLabel: desc.StreamLabel,
    streamStatus: desc.StreamStatus,
    streamViewType: desc.StreamViewType,
    tableName: desc.TableName,
    creationRequestDateTime: desc.CreationRequestDateTime,
    keySchema: (desc.KeySchema || []).map((k) => ({
      attributeName: k.AttributeName,
      keyType: k.KeyType,
    })),
    shards: (desc.Shards || []).map((s: any) => ({
      shardId: s.ShardId,
      parentShardId: s.ParentShardId || null,
      adjacentParentShardId: (s as any).AdjacentParentShardId || null,
      sequenceNumberRange: s.SequenceNumberRange
        ? {
            startingSequenceNumber:
              s.SequenceNumberRange.StartingSequenceNumber,
            endingSequenceNumber:
              s.SequenceNumberRange.EndingSequenceNumber || null,
          }
        : null,
    })),
    lastEvaluatedShardId: desc.LastEvaluatedShardId || null,
  });
});

// ─── Get Shard Iterator ───────────────────────────────────────────

router.post("/streams/:arn/shard-iterator", async (c: Context) => {
  const streamArn = decodeURIComponent(c.req.param("arn") || "");
  const { shardId, shardIteratorType, sequenceNumber } = await c.req.json<{
    shardId: string;
    shardIteratorType: string;
    sequenceNumber?: string;
  }>();

  if (!shardId || !shardIteratorType) {
    return c.json(
      { error: "shardId and shardIteratorType are required" },
      400
    );
  }

  const params: any = {
    StreamArn: streamArn,
    ShardId: shardId,
    ShardIteratorType: shardIteratorType,
  };
  if (sequenceNumber) params.SequenceNumber = sequenceNumber;

  const result = await streams().send(
    new GetShardIteratorCommand(params)
  );
  return c.json({ shardIterator: result.ShardIterator });
});

// ─── Get Records ──────────────────────────────────────────────────

router.post("/streams/records", async (c: Context) => {
  const { shardIterator, limit } = await c.req.json<{
    shardIterator: string;
    limit?: number;
  }>();

  if (!shardIterator) {
    return c.json({ error: "shardIterator is required" }, 400);
  }

  const params: any = { ShardIterator: shardIterator };
  if (limit) params.Limit = limit;

  const result = await streams().send(new GetRecordsCommand(params));
  const records = (result.Records || []).map((r) => ({
    eventID: r.eventID,
    eventName: r.eventName,
    eventVersion: r.eventVersion,
    eventSource: r.eventSource,
    awsRegion: r.awsRegion,
    dynamodb: r.dynamodb
      ? {
          approximateCreationDateTime:
            r.dynamodb.ApproximateCreationDateTime,
          keys: r.dynamodb.Keys || {},
          newImage: r.dynamodb.NewImage || {},
          oldImage: r.dynamodb.OldImage || {},
          sequenceNumber: r.dynamodb.SequenceNumber,
          sizeBytes: r.dynamodb.SizeBytes,
          streamViewType: r.dynamodb.StreamViewType,
        }
      : null,
    userIdentity: r.userIdentity || null,
  }));

  return c.json({
    records,
    total: records.length,
    nextShardIterator: result.NextShardIterator || null,
    millisBehindLatest: (result as any).MillisBehindLatest ?? 0,
  });
});

export default router;
