import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import {
  EMRServerlessClient,
  ListApplicationsCommand,
  GetApplicationCommand,
  CreateApplicationCommand,
  UpdateApplicationCommand,
  DeleteApplicationCommand,
  StartApplicationCommand,
  StopApplicationCommand,
} from "@aws-sdk/client-emr-serverless";

const router = new Hono();
const getClient = () => create(EMRServerlessClient);

router.get("/applications", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListApplicationsCommand({}));
  const applications = result.applications || [];
  return c.json({ applications, nextToken: result.nextToken || null, total: applications.length });
});

router.get("/applications/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const client = getClient();
  const result = await client.send(new GetApplicationCommand({ applicationId: id }));
  const app: any = result.application;
  return c.json({
    application: app
      ? {
          id: app.id,
          arn: app.arn,
          name: app.name,
          status: app.state,
          releaseLabel: app.releaseLabel,
          type: app.type,
          createdAt: app.createdAt,
          updatedAt: app.updatedAt,
          autoStart: app.autoStartConfiguration?.enabled,
          autoStop: app.autoStopConfiguration?.enabled,
        }
      : null,
  });
});

router.post("/applications", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.name) return c.json({ error: "name is required" }, 400);
  if (!body.releaseLabel) return c.json({ error: "releaseLabel is required" }, 400);
  if (!body.type) return c.json({ error: "type is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CreateApplicationCommand({
      name: body.name,
      releaseLabel: body.releaseLabel,
      type: body.type,
    })
  );
  return c.json(
    { applicationId: result.applicationId, arn: result.arn, name: body.name },
    201
  );
});

router.put("/applications/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const body = await c.req.json<any>();
  const client = getClient();
  const result = await client.send(
    new UpdateApplicationCommand({
      applicationId: id,
      autoStartConfiguration:
        body.autoStart !== undefined ? { enabled: body.autoStart } : undefined,
      autoStopConfiguration:
        body.autoStop !== undefined ? { enabled: body.autoStop } : undefined,
    })
  );
  return c.json({ application: result.application || null });
});

router.delete("/applications/:id", async (c: Context) => {
  const id = c.req.param("id");
  const client = getClient();
  await client.send(new DeleteApplicationCommand({ applicationId: id }));
  return c.json({ deleted: true });
});

router.post("/applications/:id/start", async (c: Context) => {
  const id = c.req.param("id");
  const client = getClient();
  await client.send(new StartApplicationCommand({ applicationId: id }));
  return c.json({ started: true });
});

router.post("/applications/:id/stop", async (c: Context) => {
  const id = c.req.param("id");
  const client = getClient();
  await client.send(new StopApplicationCommand({ applicationId: id }));
  return c.json({ stopped: true });
});

export default router;
