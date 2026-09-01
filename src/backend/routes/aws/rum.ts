import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import {
  RUMClient,
  ListAppMonitorsCommand,
  GetAppMonitorCommand,
  CreateAppMonitorCommand,
  UpdateAppMonitorCommand,
  DeleteAppMonitorCommand,
} from "@aws-sdk/client-rum";

const router = new Hono();
const getClient = () => create(RUMClient);

router.get("/appmonitors", async (c: Context) => {
  const client = getClient();
  const nextToken = c.req.query("nextToken");
  const result = await client.send(
    new ListAppMonitorsCommand({ NextToken: nextToken || undefined })
  );
  const monitors = result.AppMonitorSummaries || [];
/* istanbul ignore next */
  return c.json({ appMonitors: monitors, total: monitors.length, nextToken: result.NextToken ?? null });
});

router.get("/appmonitors/:name", async (c: Context) => {
  const name = c.req.param("name")!;
  const client = getClient();
  const result = await client.send(new GetAppMonitorCommand({ Name: name }));
  const monitor = result.AppMonitor;
  return c.json({
    appMonitor: monitor
      ? {
          id: monitor.Id,
          name: monitor.Name,
          domain: monitor.Domain,
          domainList: monitor.DomainList ?? [],
          state: monitor.State,
          platform: monitor.Platform,
          created: String(monitor.Created ?? ""),
          lastModified: String(monitor.LastModified ?? ""),
          tags: monitor.Tags,
        }
      : null,
  });
});

router.post("/appmonitors", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.name) return c.json({ error: "name is required" }, 400);
  if (!body.domain) return c.json({ error: "domain is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CreateAppMonitorCommand({
      Name: body.name,
      Domain: body.domain,
      Platform: body.platform,
    })
  );
  return c.json({ id: result.Id }, 201);
});

router.patch("/appmonitors/:name", async (c: Context) => {
  const name = c.req.param("name")!;
  const body = await c.req.json<any>();
  const client = getClient();
  await client.send(
    new UpdateAppMonitorCommand({
      Name: name,
      Domain: body.domain,
      DomainList: body.domains,
    })
  );
  return c.json({ updated: true });
});

router.delete("/appmonitors/:name", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  await client.send(new DeleteAppMonitorCommand({ Name: name }));
  return c.json({ deleted: true });
});

export default router;
