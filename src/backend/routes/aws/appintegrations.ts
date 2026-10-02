import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { readJson } from "../../clients/read-json";
import {
  AppIntegrationsClient,
  ListEventIntegrationsCommand,
  CreateEventIntegrationCommand,
  GetEventIntegrationCommand,
  UpdateEventIntegrationCommand,
  DeleteEventIntegrationCommand,
  ListDataIntegrationsCommand,
  CreateDataIntegrationCommand,
  GetDataIntegrationCommand,
  UpdateDataIntegrationCommand,
  DeleteDataIntegrationCommand,
} from "@aws-sdk/client-appintegrations";

const router = new Hono();
const getClient = () => create(AppIntegrationsClient);

// ── Event integrations ───────────────────────────────────

router.get("/event-integrations", async (c: Context) => {
  const result: any = await getClient().send(new ListEventIntegrationsCommand({}));
  return c.json({
    eventIntegrations: result.EventIntegrations || [],
    total: result.EventIntegrations?.length || 0,
  });
});

router.post("/event-integrations", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.name) return c.json({ error: "name is required" }, 400);
  if (!body?.eventBridgeBus) return c.json({ error: "eventBridgeBus is required" }, 400);
  if (!body?.eventFilter?.Source) return c.json({ error: "eventFilter.Source is required" }, 400);
  const result: any = await getClient().send(
    new CreateEventIntegrationCommand({
      Name: body.name,
      Description: body.description,
      EventFilter: body.eventFilter,
      EventBridgeBus: body.eventBridgeBus,
      ClientToken: body.clientToken,
    })
  );
  return c.json({ eventIntegration: result }, 201);
});

router.get("/event-integrations/:name", async (c: Context) => {
  const name = c.req.param("name")!;
  const result: any = await getClient().send(
    new GetEventIntegrationCommand({ Name: name })
  );
  return c.json({ eventIntegration: result || null });
});

router.patch("/event-integrations/:name", async (c: Context) => {
  const name = c.req.param("name")!;
  const body: any = await readJson(c);
  if (!body?.description) return c.json({ error: "description is required" }, 400);
  await getClient().send(
    new UpdateEventIntegrationCommand({ Name: name, Description: body.description })
  );
  return c.json({ ok: true });
});

router.delete("/event-integrations/:name", async (c: Context) => {
  const name = c.req.param("name")!;
  await getClient().send(new DeleteEventIntegrationCommand({ Name: name }));
  return c.json({ ok: true });
});

// ── Data integrations ────────────────────────────────────

router.get("/data-integrations", async (c: Context) => {
  const result: any = await getClient().send(new ListDataIntegrationsCommand({}));
  return c.json({
    dataIntegrations: result.DataIntegrations || [],
    total: result.DataIntegrations?.length || 0,
  });
});

router.post("/data-integrations", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.name) return c.json({ error: "name is required" }, 400);
  if (!body?.sourceUri) return c.json({ error: "sourceUri is required" }, 400);
  if (!body?.kmsKey) return c.json({ error: "kmsKey is required" }, 400);
  const result: any = await getClient().send(
    new CreateDataIntegrationCommand({
      Name: body.name,
      Description: body.description,
      KmsKey: body.kmsKey,
      SourceURI: body.sourceUri,
      ScheduleConfig: body.scheduleConfig,
      FileConfiguration: body.fileConfiguration,
      ObjectConfiguration: body.objectConfiguration,
    })
  );
  return c.json({ dataIntegration: result }, 201);
});

router.get("/data-integrations/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const result: any = await getClient().send(
    new GetDataIntegrationCommand({ Identifier: id })
  );
  return c.json({ dataIntegration: result || null });
});

router.patch("/data-integrations/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const body: any = await readJson(c);
  if (!body?.name && !body?.description)
    return c.json({ error: "name or description is required" }, 400);
  await getClient().send(
    new UpdateDataIntegrationCommand({
      Identifier: id,
      Name: body.name,
      Description: body.description,
    })
  );
  return c.json({ ok: true });
});

router.delete("/data-integrations/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  // Shipped SDK types omit DeleteDataIntegrationCommandInput.Identifier; runtime accepts it.
  await getClient().send(new DeleteDataIntegrationCommand({ Identifier: id } as any));
  return c.json({ ok: true });
});

export default router;
