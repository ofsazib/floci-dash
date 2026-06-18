import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { CloudTrailClient } from "@aws-sdk/client-cloudtrail";
import {
  DescribeTrailsCommand,
  CreateTrailCommand,
  UpdateTrailCommand,
  DeleteTrailCommand,
  StartLoggingCommand,
  StopLoggingCommand,
  GetTrailStatusCommand,
} from "@aws-sdk/client-cloudtrail";

const router = new Hono();
const getClient = () => create(CloudTrailClient);

// ── Trails ───────────────────────────────────────────────

router.get("/trails", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new DescribeTrailsCommand({}));
  const trails = result.trailList || [];
  return c.json({ trails, total: trails.length });
});

router.post("/trails", async (c: Context) => {
  const body = await c.req.json<{
    name: string;
    s3BucketName?: string;
    includeGlobalServiceEvents?: boolean;
    isMultiRegionTrail?: boolean;
    isOrganizationTrail?: boolean;
  }>();
  if (!body.name) return c.json({ error: "name is required" }, 400);

  const client = getClient();
  const result = await client.send(
    new CreateTrailCommand({
      Name: body.name,
      S3BucketName: body.s3BucketName,
      IncludeGlobalServiceEvents: body.includeGlobalServiceEvents,
      IsMultiRegionTrail: body.isMultiRegionTrail,
      IsOrganizationTrail: body.isOrganizationTrail,
    })
  );
  return c.json({ trail: result }, 201);
});

router.put("/trails/:name", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<{
    s3BucketName?: string;
    includeGlobalServiceEvents?: boolean;
    isMultiRegionTrail?: boolean;
  }>();
  const client = getClient();
  const result = await client.send(
    new UpdateTrailCommand({
      Name: name,
      S3BucketName: body.s3BucketName,
      IncludeGlobalServiceEvents: body.includeGlobalServiceEvents,
      IsMultiRegionTrail: body.isMultiRegionTrail,
    })
  );
  return c.json({ trail: result });
});

router.delete("/trails/:name", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  await client.send(new DeleteTrailCommand({ Name: name }));
  return c.json({ deleted: true });
});

// ── Logging ──────────────────────────────────────────────

router.post("/trails/:name/start", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  await client.send(new StartLoggingCommand({ Name: name }));
  return c.json({ started: true });
});

router.post("/trails/:name/stop", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  await client.send(new StopLoggingCommand({ Name: name }));
  return c.json({ stopped: true });
});

router.get("/trails/:name/status", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  const result = await client.send(new GetTrailStatusCommand({ Name: name }));
  return c.json({
    isLogging: result.IsLogging,
    latestDeliveryTime: result.LatestDeliveryTime,
  });
});

export default router;
