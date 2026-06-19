import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { SFNClient } from "@aws-sdk/client-sfn";
import {
  ListStateMachinesCommand,
  DescribeStateMachineCommand,
  CreateStateMachineCommand,
  DeleteStateMachineCommand,
  ListExecutionsCommand,
  DescribeExecutionCommand,
  StartExecutionCommand,
  StopExecutionCommand,
  GetExecutionHistoryCommand,
  ListActivitiesCommand,
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

// ── Activities ───────────────────────────────────────────

router.get("/activities", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListActivitiesCommand({}));
  const activities = result.activities || [];
  return c.json({ activities, total: activities.length });
});

export default router;
