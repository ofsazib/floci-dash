import { Hono } from "hono";
import type { Context } from "hono";
import { getAwsConfig } from "../../clients/aws";
import { SchedulerClient } from "@aws-sdk/client-scheduler";
import {
  ListScheduleGroupsCommand,
  CreateScheduleGroupCommand,
  DeleteScheduleGroupCommand,
  ListSchedulesCommand,
  GetScheduleCommand,
  CreateScheduleCommand,
  UpdateScheduleCommand,
  DeleteScheduleCommand,
} from "@aws-sdk/client-scheduler";

const router = new Hono();
const getClient = () => new SchedulerClient(getAwsConfig());

// ── Schedule Groups ──────────────────────────────────────

router.get("/groups", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListScheduleGroupsCommand({}));
  const groups = result.ScheduleGroups || [];
  return c.json({ groups, total: groups.length });
});

router.post("/groups", async (c: Context) => {
  const body = await c.req.json();
  if (!body.name) return c.json({ error: "name is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CreateScheduleGroupCommand({
      Name: body.name,
      Tags: body.tags,
    })
  );
  return c.json({ groupArn: result.ScheduleGroupArn }, 201);
});

router.delete("/groups/:name", async (c: Context) => {
  const name = c.req.param("name");
  if (!name) return c.json({ error: "name param required" }, 400);
  const client = getClient();
  await client.send(new DeleteScheduleGroupCommand({ Name: name }));
  return c.json({ deleted: true });
});

// ── Schedules ────────────────────────────────────────────

router.get("/schedules", async (c: Context) => {
  const groupName = c.req.query("group");
  const client = getClient();
  const result = await client.send(
    new ListSchedulesCommand({ GroupName: groupName || undefined })
  );
  const schedules = result.Schedules || [];
  return c.json({ schedules, total: schedules.length });
});

router.get("/schedules/:name", async (c: Context) => {
  const name = c.req.param("name");
  const groupName = c.req.query("group");
  if (!name) return c.json({ error: "name param required" }, 400);
  const client = getClient();
  const result = await client.send(
    new GetScheduleCommand({ Name: name, GroupName: groupName || "default" })
  );
  return c.json({ schedule: result });
});

router.post("/schedules", async (c: Context) => {
  const body = await c.req.json();
  if (!body.name) return c.json({ error: "name is required" }, 400);
  if (!body.scheduleExpression) return c.json({ error: "scheduleExpression is required" }, 400);
  if (!body.target || !body.target.Arn) return c.json({ error: "target.Arn is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CreateScheduleCommand({
      Name: body.name,
      GroupName: body.groupName || "default",
      ScheduleExpression: body.scheduleExpression,
      Description: body.description,
      FlexibleTimeWindow: body.flexibleTimeWindow || { Mode: "OFF" },
      Target: body.target,
      State: body.state || "ENABLED",
    })
  );
  return c.json({ scheduleArn: result.ScheduleArn }, 201);
});

router.put("/schedules/:name", async (c: Context) => {
  const name = c.req.param("name");
  const groupName = c.req.query("group");
  const body = await c.req.json();
  if (!name) return c.json({ error: "name param required" }, 400);
  const client = getClient();
  const result = await client.send(
    new UpdateScheduleCommand({
      Name: name,
      GroupName: groupName || "default",
      ScheduleExpression: body.scheduleExpression,
      Description: body.description,
      FlexibleTimeWindow: body.flexibleTimeWindow || { Mode: "OFF" },
      Target: body.target,
      State: body.state,
    })
  );
  return c.json({ scheduleArn: result.ScheduleArn });
});

router.delete("/schedules/:name", async (c: Context) => {
  const name = c.req.param("name");
  const groupName = c.req.query("group");
  if (!name) return c.json({ error: "name param required" }, 400);
  const client = getClient();
  await client.send(
    new DeleteScheduleCommand({ Name: name, GroupName: groupName || "default" })
  );
  return c.json({ deleted: true });
});

export default router;
