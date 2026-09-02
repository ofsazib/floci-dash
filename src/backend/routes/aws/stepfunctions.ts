import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { SFNClient } from "@aws-sdk/client-sfn";
import {
  ListStateMachinesCommand,
  DescribeStateMachineCommand,
  CreateStateMachineCommand,
  UpdateStateMachineCommand,
  DeleteStateMachineCommand,
  ListExecutionsCommand,
  DescribeExecutionCommand,
  StartExecutionCommand,
  StopExecutionCommand,
  GetExecutionHistoryCommand,
  ListActivitiesCommand,
  PublishStateMachineVersionCommand,
  ListStateMachineVersionsCommand,
  DeleteStateMachineVersionCommand,
  CreateActivityCommand,
  DeleteActivityCommand,
  DescribeActivityCommand,
  GetActivityTaskCommand,
  SendTaskSuccessCommand,
  SendTaskFailureCommand,
  SendTaskHeartbeatCommand,
  StartSyncExecutionCommand,
  ValidateStateMachineDefinitionCommand,
  ListTagsForResourceCommand,
  TagResourceCommand,
  UntagResourceCommand,
} from "@aws-sdk/client-sfn";

const router = new Hono();
const getClient = () => create(SFNClient);

// ── State Machines ───────────────────────────────────────

router.get("/state-machines", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListStateMachinesCommand({}));
  const stateMachines = result.stateMachines || [];
  return c.json({ stateMachines, total: stateMachines.length });
});

router.get("/state-machines/:arn", async (c: Context) => {
  const arn = decodeURIComponent(c.req.param("arn")!);
  const client = getClient();
  const result = await client.send(new DescribeStateMachineCommand({ stateMachineArn: arn }));
  return c.json({ stateMachine: result });
});

router.post("/state-machines", async (c: Context) => {
  const body = await c.req.json<{
    name: string;
    definition: string;
    roleArn: string;
    type?: string;
  }>();
  if (!body.name) return c.json({ error: "name is required" }, 400);
  if (!body.definition) return c.json({ error: "definition is required" }, 400);
  if (!body.roleArn) return c.json({ error: "roleArn is required" }, 400);

  const client = getClient();
  const result = await client.send(
    new CreateStateMachineCommand({
      name: body.name,
      definition: body.definition,
      roleArn: body.roleArn,
      type: body.type as any,
    })
  );
  return c.json({ stateMachineArn: result.stateMachineArn, creationDate: result.creationDate }, 201);
});

router.put("/state-machines/:arn", async (c: Context) => {
  const arn = decodeURIComponent(c.req.param("arn")!);
  const body = await c.req.json<{ definition?: string; roleArn?: string }>();
  if (!body.definition && !body.roleArn) {
    return c.json({ error: "definition or roleArn is required" }, 400);
  }
  const client = getClient();
  const result = await client.send(
    new UpdateStateMachineCommand({
      stateMachineArn: arn,
      definition: body.definition,
      roleArn: body.roleArn,
    })
  );
  return c.json({
    stateMachineArn: arn,
    stateMachineVersionArn: result.stateMachineVersionArn,
    updateDate: result.updateDate,
  });
});

router.delete("/state-machines/:arn", async (c: Context) => {
  const arn = decodeURIComponent(c.req.param("arn")!);
  const client = getClient();
  await client.send(new DeleteStateMachineCommand({ stateMachineArn: arn }));
  return c.json({ deleted: true });
});

// ── Executions ───────────────────────────────────────────

router.get("/state-machines/:arn/executions", async (c: Context) => {
  const arn = decodeURIComponent(c.req.param("arn")!);
  const client = getClient();
  const result = await client.send(new ListExecutionsCommand({ stateMachineArn: arn }));
  const executions = result.executions || [];
  return c.json({ executions, total: executions.length });
});

router.get("/executions/:arn", async (c: Context) => {
  const arn = decodeURIComponent(c.req.param("arn")!);
  const client = getClient();
  const result = await client.send(new DescribeExecutionCommand({ executionArn: arn }));
  return c.json({ execution: result });
});

router.post("/state-machines/:arn/executions", async (c: Context) => {
  const arn = decodeURIComponent(c.req.param("arn")!);
  const body = await c.req.json<{ name?: string; input?: string }>();
  const client = getClient();
  const result = await client.send(
    new StartExecutionCommand({
      stateMachineArn: arn,
      name: body.name,
      input: body.input,
    })
  );
  return c.json({ executionArn: result.executionArn, startDate: result.startDate }, 201);
});

router.post("/executions/:arn/stop", async (c: Context) => {
  const arn = decodeURIComponent(c.req.param("arn")!);
  const body = await c.req.json<{ cause?: string; error?: string }>();
  const client = getClient();
  const result = await client.send(
    new StopExecutionCommand({ executionArn: arn, cause: body.cause, error: body.error })
  );
  return c.json({ stopDate: result.stopDate });
});

router.get("/executions/:arn/history", async (c: Context) => {
  const arn = decodeURIComponent(c.req.param("arn")!);
  const client = getClient();
  const result = await client.send(new GetExecutionHistoryCommand({ executionArn: arn }));
  const events = result.events || [];
  return c.json({ events, total: events.length });
});

// ── Versions ────────────────────────────────────────────

router.post("/state-machines/:arn/versions", async (c: Context) => {
  const arn = decodeURIComponent(c.req.param("arn")!);
  const client = getClient();
  const result = await client.send(
    new PublishStateMachineVersionCommand({ stateMachineArn: arn })
  );
  return c.json({ stateMachineVersionArn: result.stateMachineVersionArn, creationDate: result.creationDate }, 201);
});

router.get("/state-machines/:arn/versions", async (c: Context) => {
  const arn = decodeURIComponent(c.req.param("arn")!);
  const client = getClient();
  const result = await client.send(
    new ListStateMachineVersionsCommand({ stateMachineArn: arn })
  );
  const versions = result.stateMachineVersions || [];
  return c.json({ versions, total: versions.length });
});

router.delete("/state-machines/:arn/versions/:versionArn", async (c: Context) => {
  const versionArn = decodeURIComponent(c.req.param("versionArn")!);
  const client = getClient();
  await client.send(
    new DeleteStateMachineVersionCommand({ stateMachineVersionArn: versionArn })
  );
  return c.json({ deleted: true });
});

// ── Activities ───────────────────────────────────────────

router.get("/activities", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListActivitiesCommand({}));
  const activities = result.activities || [];
  return c.json({ activities, total: activities.length });
});

router.post("/activities", async (c: Context) => {
  const body = await c.req.json();
  if (!body.name) return c.json({ error: "Activity name is required" }, 400);
  const client = getClient();
  const result = await client.send(new CreateActivityCommand({ name: body.name }));
  return c.json(result.activityArn ? { activity: result } : { activity: null });
});

router.delete("/activities/:arn", async (c: Context) => {
  const client = getClient();
  await client.send(new DeleteActivityCommand({ activityArn: decodeURIComponent(c.req.param("arn")!) }));
  return c.json({ deleted: true });
});

router.get("/activities/:arn", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new DescribeActivityCommand({ activityArn: decodeURIComponent(c.req.param("arn")!) }));
  return c.json(result.activityArn ? { activity: result } : { activity: null });
});

router.post("/activities/:arn/tasks", async (c: Context) => {
  const body = await c.req.json();
  if (!body.workerName) return c.json({ error: "Worker name is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new GetActivityTaskCommand({ activityArn: decodeURIComponent(c.req.param("arn")!), workerName: body.workerName })
  );
  return c.json(result.taskToken ? { task: result } : { task: null });
});

router.post("/activities/:arn/tasks/success", async (c: Context) => {
  const body = await c.req.json();
  if (!body.taskToken) return c.json({ error: "Task token is required" }, 400);
  const client = getClient();
  await client.send(
    new SendTaskSuccessCommand({
      taskToken: body.taskToken,
      output: body.output ?? "{}",
    })
  );
  return c.json({ success: true });
});

router.post("/activities/:arn/tasks/failure", async (c: Context) => {
  const body = await c.req.json();
  if (!body.taskToken) return c.json({ error: "Task token is required" }, 400);
  const client = getClient();
  await client.send(
    new SendTaskFailureCommand({
      taskToken: body.taskToken,
      error: body.error || undefined,
      cause: body.cause || undefined,
    })
  );
  return c.json({ success: true });
});

router.post("/activities/:arn/tasks/heartbeat", async (c: Context) => {
  const body = await c.req.json();
  if (!body.taskToken) return c.json({ error: "Task token is required" }, 400);
  const client = getClient();
  await client.send(new SendTaskHeartbeatCommand({ taskToken: body.taskToken }));
  return c.json({ success: true });
});

// ── Sync executions + validation + tags ───────────────────

router.post("/state-machines/:arn/sync-executions", async (c: Context) => {
  const body = await c.req.json();
  const client = getClient();
  const result = await client.send(
    new StartSyncExecutionCommand({
      stateMachineArn: decodeURIComponent(c.req.param("arn")!),
      name: body.name || undefined,
      input: body.input || undefined,
    })
  );
  return c.json(result.executionArn ? { execution: result } : { execution: null });
});

router.post("/state-machines/validate", async (c: Context) => {
  const body = await c.req.json();
  if (!body.definition) return c.json({ error: "Definition is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new ValidateStateMachineDefinitionCommand({
      definition: body.definition,
      type: body.type || undefined,
    })
  );
  return c.json({
    valid: result.result ? result.result === "OK" : null,
    errors: result.diagnostics || [],
  });
});

router.get("/state-machines/:arn/tags", async (c: Context) => {
  const client = getClient();
  const result = await client.send(
    new ListTagsForResourceCommand({ resourceArn: decodeURIComponent(c.req.param("arn")!) })
  );
  return c.json(result.tags || []);
});

router.put("/state-machines/:arn/tags", async (c: Context) => {
  const body = await c.req.json();
  if (!body.tags || !Array.isArray(body.tags) || body.tags.length === 0) {
    return c.json({ error: "At least one tag is required" }, 400);
  }
  const client = getClient();
  await client.send(
    new TagResourceCommand({ resourceArn: decodeURIComponent(c.req.param("arn")!), tags: body.tags })
  );
  return c.json({ success: true });
});

router.delete("/state-machines/:arn/tags", async (c: Context) => {
  const body = await c.req.json();
  if (!body.tagKeys || !Array.isArray(body.tagKeys) || body.tagKeys.length === 0) {
    return c.json({ error: "At least one tag key is required" }, 400);
  }
  const client = getClient();
  await client.send(
    new UntagResourceCommand({ resourceArn: decodeURIComponent(c.req.param("arn")!), tagKeys: body.tagKeys })
  );
  return c.json({ success: true });
});

export default router;
