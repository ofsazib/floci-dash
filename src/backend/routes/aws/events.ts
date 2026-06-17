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
  TagResourceCommand,
  UntagResourceCommand,
  ListTagsForResourceCommand,
} from "@aws-sdk/client-eventbridge";

const router = new Hono();
const getClient = () => create(EventBridgeClient);

router.get("/buses", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListEventBusesCommand({}));
  return c.json({ eventBuses: result.EventBuses || [] });
});

router.post("/buses", async (c: Context) => {
  const body = await c.req.json();
  if (!body.name) return c.json({ error: "name is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CreateEventBusCommand({
      Name: body.name,
      Description: body.description,
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
      Name: body.name,
      EventBusName: body.eventBusName,
      EventPattern: body.eventPattern,
      ScheduleExpression: body.scheduleExpression,
      State: body.state,
      Description: body.description,
      RoleArn: body.roleArn,
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
      ArchiveName: body.archiveName,
      EventSourceArn: body.eventSourceArn,
      Description: body.description,
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

export default router;
