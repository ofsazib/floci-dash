import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import {
  KinesisAnalyticsV2Client,
  ListApplicationsCommand,
  DescribeApplicationCommand,
  CreateApplicationCommand,
  UpdateApplicationCommand,
  DeleteApplicationCommand,
  StartApplicationCommand,
  StopApplicationCommand,
  CreateApplicationSnapshotCommand,
  DescribeApplicationSnapshotCommand,
  ListApplicationSnapshotsCommand,
  DeleteApplicationSnapshotCommand,
  ListTagsForResourceCommand,
  TagResourceCommand,
  UntagResourceCommand,
} from "@aws-sdk/client-kinesis-analytics-v2";

const router = new Hono();
const getClient = () => create(KinesisAnalyticsV2Client);

// ── Applications ───────────────────────────────────────

router.get("/applications", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListApplicationsCommand({}));
  const applications = result.ApplicationSummaries || [];
/* istanbul ignore next */
  return c.json({ applications, total: applications.length });
});

router.get("/applications/:name", async (c: Context) => {
  const name = c.req.param("name")!;
  const client = getClient();
  const result = await client.send(
    new DescribeApplicationCommand({ ApplicationName: name })
  );
  const detail: any = result.ApplicationDetail;
  return c.json({
    application: detail
      ? {
          name: detail.ApplicationName,
          arn: detail.ApplicationARN,
          status: detail.ApplicationStatus,
          versionId: detail.ApplicationVersionId,
          runtimeEnvironment: detail.RuntimeEnvironment,
          applicationMode: detail.ApplicationMode,
          description: detail.ApplicationDescription,
          serviceExecutionRole: detail.ServiceExecutionRole,
          parallelism:
            detail.ApplicationConfiguration?.FlinkApplicationConfiguration
              ?.ParallelismConfiguration?.Parallelism,
          codeLocation: detail.ApplicationConfiguration?.ApplicationCodeConfiguration
            ?.CodeContent?.S3ContentLocation
            ? {
                bucketArn:
                  detail.ApplicationConfiguration.ApplicationCodeConfiguration.CodeContent
                    .S3ContentLocation.BucketARN,
                fileKey:
                  detail.ApplicationConfiguration.ApplicationCodeConfiguration.CodeContent
                    .S3ContentLocation.FileKey,
              }
            : null,
        }
      : null,
  });
});

router.post("/applications", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.name) return c.json({ error: "name is required" }, 400);
  if (!body.runtimeEnvironment)
    return c.json({ error: "runtimeEnvironment is required" }, 400);
  if (!body.serviceExecutionRole)
    return c.json({ error: "serviceExecutionRole is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CreateApplicationCommand({
      ApplicationName: body.name,
      RuntimeEnvironment: body.runtimeEnvironment,
      ServiceExecutionRole: body.serviceExecutionRole,
      ApplicationDescription: body.description,
      ApplicationMode: body.applicationMode,
      ApplicationConfiguration: body.codeBucket
        ? {
            ApplicationCodeConfiguration: {
              CodeContent: {
                S3ContentLocation: {
                  BucketARN: body.codeBucketArn || body.codeBucket,
                  FileKey: body.codeKey,
                },
              },
              CodeContentType: body.codeKey ? ("S3" as any) : undefined,
            },
            FlinkApplicationConfiguration: body.parallelism
              ? { ParallelismConfiguration: { Parallelism: body.parallelism, ConfigurationType: "CUSTOM" } }
              : undefined,
          }
        : undefined,
      Tags: body.tags,
    })
  );
  return c.json({ application: result.ApplicationDetail || null }, 201);
});

router.put("/applications/:name", async (c: Context) => {
  const name = c.req.param("name")!;
  const body = await c.req.json<any>();
  const client = getClient();
  const result = await client.send(
    new UpdateApplicationCommand({
      ApplicationName: name,
      ApplicationConfigurationUpdate: body.parallelism
        ? {
            FlinkApplicationConfigurationUpdate: {
              ParallelismConfigurationUpdate: {
                ParallelismUpdate: body.parallelism,
              },
            },
          }
        : undefined,
    })
  );
  return c.json({ application: result.ApplicationDetail || null });
});

router.delete("/applications/:name", async (c: Context) => {
  const name = c.req.param("name");
  const ts = c.req.query("createTimestamp");
  if (!ts) return c.json({ error: "createTimestamp query parameter required" }, 400);
  const client = getClient();
  await client.send(
    new DeleteApplicationCommand({
      ApplicationName: name,
      CreateTimestamp: new Date(Number(ts) * 1000),
    })
  );
  return c.json({ deleted: true });
});

router.post("/applications/:name/start", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  await client.send(new StartApplicationCommand({ ApplicationName: name }));
  return c.json({ started: true });
});

router.post("/applications/:name/stop", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  await client.send(new StopApplicationCommand({ ApplicationName: name }));
  return c.json({ stopped: true });
});

// ── Snapshots ──────────────────────────────────────────

router.get("/applications/:name/snapshots", async (c: Context) => {
  const name = c.req.param("name")!;
  const client = getClient();
  const result = await client.send(
    new ListApplicationSnapshotsCommand({ ApplicationName: name })
  );
  const snapshots = result.SnapshotSummaries || [];
  return c.json({ snapshots, total: snapshots.length });
});

router.post("/applications/:name/snapshots", async (c: Context) => {
  const name = c.req.param("name")!;
  const body = await c.req.json<{ snapshotName?: string }>();
  if (!body.snapshotName) return c.json({ error: "snapshotName is required" }, 400);
  const client = getClient();
  await client.send(
    new CreateApplicationSnapshotCommand({
      ApplicationName: name,
      SnapshotName: body.snapshotName,
    })
  );
  return c.json({ created: true }, 201);
});

router.get("/applications/:name/snapshots/:snapshotName", async (c: Context) => {
  const name = c.req.param("name")!;
  const snapshotName = c.req.param("snapshotName")!;
  const client = getClient();
  const result = await client.send(
    new DescribeApplicationSnapshotCommand({
      ApplicationName: name,
      SnapshotName: snapshotName,
    })
  );
  return c.json({ snapshot: result.SnapshotDetails || null });
});

router.delete("/applications/:name/snapshots/:snapshotName", async (c: Context) => {
  const name = c.req.param("name")!;
  const snapshotName = c.req.param("snapshotName")!;
  const ts = c.req.query("snapshotCreationTimestamp");
  const client = getClient();
  await client.send(
    new DeleteApplicationSnapshotCommand({
      ApplicationName: name,
      SnapshotName: snapshotName,
      SnapshotCreationTimestamp: ts ? new Date(Number(ts) * 1000) : undefined,
    })
  );
  return c.json({ deleted: true });
});

// ── Tags ───────────────────────────────────────────────

router.get("/applications/:name/tags", async (c: Context) => {
  const arn = c.req.query("arn");
  if (!arn) return c.json({ error: "arn query parameter required" }, 400);
  const client = getClient();
  const result = await client.send(
    new ListTagsForResourceCommand({ ResourceARN: arn })
  );
  const tags = (result.Tags || []).map((t: any) => ({ key: t.Key, value: t.Value }));
  return c.json({ tags });
});

router.post("/applications/:name/tags", async (c: Context) => {
  const arn = c.req.query("arn");
  if (!arn) return c.json({ error: "arn query parameter required" }, 400);
  const body = await c.req.json<{ tags?: Record<string, string> }>();
  if (!body.tags || !Object.keys(body.tags).length)
    return c.json({ error: "tags is required" }, 400);
  const client = getClient();
  await client.send(
    new TagResourceCommand({
      ResourceARN: arn,
      Tags: Object.entries(body.tags).map(([Key, Value]) => ({ Key, Value })),
    })
  );
  return c.json({ tagged: true });
});

router.delete("/applications/:name/tags", async (c: Context) => {
  const arn = c.req.query("arn");
  if (!arn) return c.json({ error: "arn query parameter required" }, 400);
  const body = await c.req.json<{ tagKeys?: string[] }>();
  if (!body.tagKeys?.length) return c.json({ error: "tagKeys is required" }, 400);
  const client = getClient();
  await client.send(
    new UntagResourceCommand({ ResourceARN: arn, TagKeys: body.tagKeys })
  );
  return c.json({ untagged: true });
});

export default router;
