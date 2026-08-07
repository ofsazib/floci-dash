import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { EventBridgeClient } from "@aws-sdk/client-eventbridge";
import {
  ListEventBusesCommand,
  CreateEventBusCommand,
  DeleteEventBusCommand,
  DescribeEventBusCommand,
  ListRulesCommand,
  PutRuleCommand,
  DeleteRuleCommand,
  DescribeRuleCommand,
  EnableRuleCommand,
  DisableRuleCommand,
  ListTargetsByRuleCommand,
  PutTargetsCommand,
  RemoveTargetsCommand,
  PutEventsCommand,
  ListArchivesCommand,
  CreateArchiveCommand,
  DeleteArchiveCommand,
  DescribeArchiveCommand,
  ListReplaysCommand,
  StartReplayCommand,
  DescribeReplayCommand,
  CancelReplayCommand,
  UpdateArchiveCommand,
  PutPermissionCommand,
  RemovePermissionCommand,
  TagResourceCommand,
  UntagResourceCommand,
  ListTagsForResourceCommand,
} from "@aws-sdk/client-eventbridge";
import { sanitizeName, sanitizeText } from "../../clients/sanitize";

const router = new Hono();
const getClient = () => create(EventBridgeClient);

router.get("/buses", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListEventBusesCommand({}));
  return c.json({ eventBuses: result.EventBuses || [] });
});

router.get("/buses/describe", async (c: Context) => {
  const name = c.req.query("name");
  if (!name) return c.json({ error: "name query parameter required" }, 400);
  const client = getClient();
  const result = await client.send(new DescribeEventBusCommand({ Name: name }));
  return c.json({ eventBus: result });
});

router.post("/buses/permissions", async (c: Context) => {
  const body = await c.req.json();
  if (!body.eventBusName || !body.statementId || !body.action || !body.principal) {
    return c.json({ error: "eventBusName, statementId, action, and principal are required" }, 400);
  }
  const client = getClient();
  await client.send(
    new PutPermissionCommand({
      EventBusName: sanitizeName(body.eventBusName, 256),
      StatementId: sanitizeName(body.statementId, 256),
      Action: sanitizeName(body.action, 256),
      Principal: sanitizeName(body.principal, 256),
      Condition: body.condition,
    })
  );
  return c.json({ granted: true }, 201);
});

router.delete("/buses/permissions", async (c: Context) => {
  const name = c.req.query("name");
  const statementId = c.req.query("statementId");
  if (!name) return c.json({ error: "name query parameter required" }, 400);
  const client = getClient();
  await client.send(
    new RemovePermissionCommand({
      EventBusName: name,
      StatementId: statementId || undefined,
      RemoveAllPermissions: statementId ? undefined : true,
    })
  );
  return c.json({ removed: true });
});

router.post("/buses", async (c: Context) => {
  const body = await c.req.json();
  const busName = sanitizeName(body.name || "", 256);
  if (!busName) return c.json({ error: "name is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CreateEventBusCommand({
      Name: busName,
      Description: sanitizeText(body.description || "", 1024),
      Tags: body.tags,
    })
  );
  return c.json({ eventBusArn: result.EventBusArn }, 201);
});

router.delete("/buses", async (c: Context) => {
  const name = c.req.query("name");
  if (!name) return c.json({ error: "name query parameter required" }, 400);
  const client = getClient();
  await client.send(new DeleteEventBusCommand({ Name: name }));
  return c.json({ deleted: true });
});

router.get("/rules", async (c: Context) => {
  const eventBusName = c.req.query("eventBusName");
  const client = getClient();
  const result = await client.send(
    new ListRulesCommand(eventBusName ? { EventBusName: eventBusName } : {})
  );
  return c.json({ rules: result.Rules || [] });
});

router.post("/rules", async (c: Context) => {
  const body = await c.req.json();
  const client = getClient();
  const result = await client.send(
    new PutRuleCommand({
      Name: sanitizeName(body.name || "", 256),
      EventBusName: sanitizeName(body.eventBusName || "", 256),
      EventPattern: body.eventPattern,
      ScheduleExpression: body.scheduleExpression,
      State: body.state,
      Description: sanitizeText(body.description || "", 1024),
      RoleArn: sanitizeName(body.roleArn || "", 2048),
    })
  );
  return c.json({ ruleArn: result.RuleArn }, 201);
});

router.delete("/rules", async (c: Context) => {
  const name = c.req.query("name");
  const eventBusName = c.req.query("eventBusName");
  if (!name) return c.json({ error: "name query parameter required" }, 400);
  const client = getClient();
  await client.send(new DeleteRuleCommand({ Name: name, EventBusName: eventBusName || undefined }));
  return c.json({ deleted: true });
});

router.post("/rules/enable", async (c: Context) => {
  const body = await c.req.json();
  if (!body.name) return c.json({ error: "name is required" }, 400);
  const client = getClient();
  await client.send(new EnableRuleCommand({ Name: body.name, EventBusName: body.eventBusName }));
  return c.json({ enabled: true });
});

router.post("/rules/disable", async (c: Context) => {
  const body = await c.req.json();
  if (!body.name) return c.json({ error: "name is required" }, 400);
  const client = getClient();
  await client.send(new DisableRuleCommand({ Name: body.name, EventBusName: body.eventBusName }));
  return c.json({ disabled: true });
});

router.get("/targets", async (c: Context) => {
  const rule = c.req.query("rule");
  const eventBusName = c.req.query("eventBusName");
  if (!rule) return c.json({ error: "rule query parameter required" }, 400);
  const client = getClient();
  const result = await client.send(
    new ListTargetsByRuleCommand({ Rule: rule, EventBusName: eventBusName || undefined })
  );
  return c.json({ targets: result.Targets || [] });
});

router.post("/targets", async (c: Context) => {
  const body = await c.req.json();
  if (!body.rule || !body.targets) return c.json({ error: "rule and targets are required" }, 400);
  const client = getClient();
  const result = await client.send(
    new PutTargetsCommand({
      Rule: body.rule,
      EventBusName: body.eventBusName,
      Targets: body.targets,
    })
  );
  return c.json({ failedEntries: result.FailedEntryCount || 0 });
});

router.delete("/targets", async (c: Context) => {
  const rule = c.req.query("rule");
  const ids = c.req.query("ids");
  const eventBusName = c.req.query("eventBusName");
  if (!rule || !ids) return c.json({ error: "rule and ids query parameters required" }, 400);
  const client = getClient();
  await client.send(
    new RemoveTargetsCommand({
      Rule: rule,
      EventBusName: eventBusName || undefined,
      Ids: ids.split(","),
    })
  );
  return c.json({ removed: true });
});

router.post("/put-events", async (c: Context) => {
  const body = await c.req.json();
  const client = getClient();
  const result = await client.send(new PutEventsCommand({ Entries: body.entries }));
  return c.json({
    failedCount: result.FailedEntryCount || 0,
    entries: result.Entries || [],
  });
});

router.get("/archives", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListArchivesCommand({}));
  return c.json({ archives: result.Archives || [] });
});

router.post("/archives", async (c: Context) => {
  const body = await c.req.json();
  const client = getClient();
  const result = await client.send(
    new CreateArchiveCommand({
      ArchiveName: sanitizeName(body.archiveName || "", 256),
      EventSourceArn: sanitizeName(body.eventSourceArn || "", 2048),
      Description: sanitizeText(body.description || "", 1024),
      EventPattern: body.eventPattern,
      RetentionDays: body.retentionDays,
    })
  );
  return c.json({ archiveArn: result.ArchiveArn, state: result.State }, 201);
});

router.delete("/archives", async (c: Context) => {
  const name = c.req.query("name");
  if (!name) return c.json({ error: "name query parameter required" }, 400);
  const client = getClient();
  await client.send(new DeleteArchiveCommand({ ArchiveName: name }));
  return c.json({ deleted: true });
});

router.get("/replays", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListReplaysCommand({}));
  return c.json({ replays: result.Replays || [] });
});

router.get("/archives/describe", async (c: Context) => {
  const name = c.req.query("name");
  if (!name) return c.json({ error: "name query parameter required" }, 400);
  const client = getClient();
  const result = await client.send(new DescribeArchiveCommand({ ArchiveName: name }));
  return c.json({ archive: result });
});

router.put("/archives", async (c: Context) => {
  const body = await c.req.json();
  if (!body.archiveName) return c.json({ error: "archiveName is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new UpdateArchiveCommand({
      ArchiveName: sanitizeName(body.archiveName, 256),
      Description: body.description != null ? sanitizeText(body.description || "", 1024) : undefined,
      EventPattern: body.eventPattern,
      RetentionDays: body.retentionDays,
    })
  );
  return c.json({ archiveArn: result.ArchiveArn, state: result.State });
});

router.post("/replays", async (c: Context) => {
  const body = await c.req.json();
  if (!body.replayName || !body.eventSourceArn || !body.eventStartTime) {
    return c.json({ error: "replayName, eventSourceArn, and eventStartTime are required" }, 400);
  }
  const client = getClient();
  const result = await client.send(
    new StartReplayCommand({
      ReplayName: sanitizeName(body.replayName, 256),
      EventSourceArn: sanitizeName(body.eventSourceArn, 2048),
      Description: body.description != null ? sanitizeText(body.description || "", 1024) : undefined,
      EventStartTime: new Date(body.eventStartTime),
      EventEndTime: body.eventEndTime ? new Date(body.eventEndTime) : undefined,
      Destination: body.destination,
    })
  );
  return c.json({ replayArn: result.ReplayArn, state: result.State }, 201);
});

router.get("/replays/describe", async (c: Context) => {
  const name = c.req.query("name");
  if (!name) return c.json({ error: "name query parameter required" }, 400);
  const client = getClient();
  const result = await client.send(new DescribeReplayCommand({ ReplayName: name }));
  return c.json({ replay: result });
});

router.delete("/replays", async (c: Context) => {
  const name = c.req.query("name");
  if (!name) return c.json({ error: "name query parameter required" }, 400);
  const client = getClient();
  await client.send(new CancelReplayCommand({ ReplayName: name }));
  return c.json({ cancelled: true });
});

export default router;
