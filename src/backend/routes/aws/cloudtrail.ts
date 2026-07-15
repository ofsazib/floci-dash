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
  LookupEventsCommand,
  GetEventSelectorsCommand,
  PutEventSelectorsCommand,
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

// ── Lookup Events ────────────────────────────────────────

router.post("/trails/lookup-events", async (c: Context) => {
  const body = await c.req.json<{
    startTime?: string;
    endTime?: string;
    lookupAttributes?: Array<{ AttributeKey: string; AttributeValue: string }>;
    maxResults?: number;
    nextToken?: string;
    eventCategory?: string;
  }>();

  const client = getClient();
  const input: any = {};
  if (body.startTime) input.StartTime = new Date(body.startTime);
  if (body.endTime) input.EndTime = new Date(body.endTime);
  if (body.lookupAttributes && body.lookupAttributes.length > 0) {
    input.LookupAttributes = body.lookupAttributes;
  }
  if (body.maxResults) input.MaxResults = body.maxResults;
  if (body.nextToken) input.NextToken = body.nextToken;
  if (body.eventCategory) input.EventCategory = body.eventCategory;

  const result = await client.send(new LookupEventsCommand(input));
  return c.json({
    events: (result.Events || []).map((e: any) => ({
      eventId: e.EventId,
      eventName: e.EventName,
      eventTime: e.EventTime?.toISOString(),
      eventSource: e.EventSource,
      username: e.Username,
      cloudTrailEvent: e.CloudTrailEvent,
      resources: e.Resources,
    })),
    nextToken: result.NextToken || null,
    total: (result.Events || []).length,
  });
});

// ── Event Selectors ──────────────────────────────────────

router.get("/trails/:name/event-selectors", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  const result = await client.send(new GetEventSelectorsCommand({ TrailName: name }));
  return c.json({
    trailName: name,
    eventSelectors: result.EventSelectors || [],
    advancedEventSelectors: result.AdvancedEventSelectors || [],
  });
});

router.put("/trails/:name/event-selectors", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<{
    eventSelectors?: Array<{
      ReadWriteType?: string;
      IncludeManagementEvents?: boolean;
      DataResources?: Array<{ Type: string; Values: string[] }>;
      ExcludeManagementEventSources?: string[];
    }>;
    advancedEventSelectors?: Array<{
      Name?: string;
      FieldSelectors: Array<{ Field: string; Equals?: string[]; StartsWith?: string[]; EndsWith?: string[]; NotEquals?: string[]; NotStartsWith?: string[]; NotEndsWith?: string[] }>;
    }>;
  }>();

  if (!body.eventSelectors && !body.advancedEventSelectors) {
    return c.json({ error: "eventSelectors or advancedEventSelectors is required" }, 400);
  }

  const client = getClient();
  const result = await client.send(new PutEventSelectorsCommand({
    TrailName: name,
    EventSelectors: body.eventSelectors,
    AdvancedEventSelectors: body.advancedEventSelectors,
  }));
  return c.json({
    trailName: name,
    eventSelectors: result.EventSelectors || [],
    advancedEventSelectors: result.AdvancedEventSelectors || [],
    updated: true,
  });
});

export default router;
