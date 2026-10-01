import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { readJson } from "../../clients/read-json";
import {
  GlobalAcceleratorClient,
  ListAcceleratorsCommand,
  CreateAcceleratorCommand,
  DescribeAcceleratorCommand,
  UpdateAcceleratorCommand,
  DeleteAcceleratorCommand,
  ListListenersCommand,
  CreateListenerCommand,
  DeleteListenerCommand,
  ListEndpointGroupsCommand,
  CreateEndpointGroupCommand,
  UpdateEndpointGroupCommand,
  DeleteEndpointGroupCommand,
  AddEndpointsCommand,
  ListTagsForResourceCommand,
  TagResourceCommand,
  UntagResourceCommand,
} from "@aws-sdk/client-global-accelerator";

const router = new Hono();
const getClient = () => create(GlobalAcceleratorClient);

// ── Accelerators ─────────────────────────────────────────

// Registered before the :arn wildcard so "listeners" isn't captured as an ARN.
router.get("/accelerators/listeners", async (c: Context) => {
  const arn = c.req.query("acceleratorArn");
  if (!arn) return c.json({ error: "acceleratorArn query parameter is required" }, 400);
  const result: any = await getClient().send(
    new ListListenersCommand({ AcceleratorArn: arn })
  );
  return c.json({ listeners: result.Listeners || [], total: result.Listeners?.length || 0 });
});


router.get("/accelerators", async (c: Context) => {
  const result: any = await getClient().send(new ListAcceleratorsCommand({}));
  return c.json({
    accelerators: result.Accelerators || [],
    total: result.Accelerators?.length || 0,
  });
});

router.post("/accelerators", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.name) return c.json({ error: "name is required" }, 400);
  const result: any = await getClient().send(
    new CreateAcceleratorCommand({
      Name: body.name,
      IpAddressType: body.ipAddressType,
      Enabled: body.enabled,
    })
  );
  return c.json({ accelerator: result.Accelerator }, 201);
});

router.get("/accelerators/:arn{.+}", async (c: Context) => {
  const arn = c.req.param("arn")!;
  const result: any = await getClient().send(
    new DescribeAcceleratorCommand({ AcceleratorArn: arn })
  );
  return c.json({ accelerator: result?.Accelerator || null });
});

router.put("/accelerators/:arn{.+}", async (c: Context) => {
  const arn = c.req.param("arn")!;
  const body: any = await readJson(c);
  const result: any = await getClient().send(
    new UpdateAcceleratorCommand({
      AcceleratorArn: arn,
      Name: body.name,
      Enabled: body.enabled,
    })
  );
  return c.json({ accelerator: result?.Accelerator });
});

router.delete("/accelerators/:arn{.+}", async (c: Context) => {
  const arn = c.req.param("arn")!;
  await getClient().send(new DeleteAcceleratorCommand({ AcceleratorArn: arn }));
  return c.json({ ok: true });
});

// ── Listeners ────────────────────────────────────────────

router.post("/listeners", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.acceleratorArn) return c.json({ error: "acceleratorArn is required" }, 400);
  if (!Array.isArray(body?.portRanges) || body.portRanges.length === 0)
    return c.json({ error: "portRanges array with at least one range is required" }, 400);
  const result: any = await getClient().send(
    new CreateListenerCommand({
      AcceleratorArn: body.acceleratorArn,
      PortRanges: body.portRanges,
      Protocol: body.protocol || "TCP",
      ClientAffinity: body.clientAffinity,
    })
  );
  return c.json({ listener: result.Listener }, 201);
});

router.delete("/listeners/:arn{.+}", async (c: Context) => {
  const arn = c.req.param("arn")!;
  await getClient().send(new DeleteListenerCommand({ ListenerArn: arn }));
  return c.json({ ok: true });
});

// ── Endpoint groups ──────────────────────────────────────

router.get("/listeners/endpoint-groups", async (c: Context) => {
  const arn = c.req.query("listenerArn");
  if (!arn) return c.json({ error: "listenerArn query parameter is required" }, 400);
  const result: any = await getClient().send(
    new ListEndpointGroupsCommand({ ListenerArn: arn })
  );
  return c.json({ endpointGroups: result.EndpointGroups || [], total: result.EndpointGroups?.length || 0 });
});

router.post("/endpoint-groups", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.listenerArn) return c.json({ error: "listenerArn is required" }, 400);
  if (!body?.endpointGroupRegion)
    return c.json({ error: "endpointGroupRegion is required" }, 400);
  const result: any = await getClient().send(
    new CreateEndpointGroupCommand({
      ListenerArn: body.listenerArn,
      EndpointGroupRegion: body.endpointGroupRegion,
      TrafficDialPercentage: body.trafficDialPercentage,
      HealthCheckPort: body.healthCheckPort,
    })
  );
  return c.json({ endpointGroup: result.EndpointGroup }, 201);
});

router.put("/endpoint-groups/:arn{.+}", async (c: Context) => {
  const arn = c.req.param("arn")!;
  const body: any = await readJson(c);
  const result: any = await getClient().send(
    new UpdateEndpointGroupCommand({
      EndpointGroupArn: arn,
      TrafficDialPercentage: body.trafficDialPercentage,
    })
  );
  return c.json({ endpointGroup: result.EndpointGroup });
});

router.delete("/endpoint-groups/:arn{.+}", async (c: Context) => {
  const arn = c.req.param("arn")!;
  await getClient().send(new DeleteEndpointGroupCommand({ EndpointGroupArn: arn }));
  return c.json({ ok: true });
});

router.post("/endpoint-groups/:arn{.+}/endpoints", async (c: Context) => {
  const arn = c.req.param("arn")!;
  const body: any = await readJson(c);
  if (!Array.isArray(body?.endpointConfigurations) || body.endpointConfigurations.length === 0)
    return c.json({ error: "endpointConfigurations array with at least one entry is required" }, 400);
  // Floci reads EndpointIdentifiers (matching current AWS API); the shipped
  // SDK types still lag behind, hence the assertion.
  const result: any = await getClient().send(
    new AddEndpointsCommand({
      EndpointIdentifiers: body.endpointConfigurations,
      EndpointGroupArn: arn,
    } as any)
  );
  return c.json({ endpointDescriptions: result.EndpointDescriptions || [] }, 201);
});

// ── Tags ─────────────────────────────────────────────────

router.get("/resources/tags", async (c: Context) => {
  const arn = c.req.query("arn");
  if (!arn) return c.json({ error: "arn query parameter is required" }, 400);
  const result: any = await getClient().send(
    new ListTagsForResourceCommand({ ResourceArn: arn })
  );
  return c.json({ tags: result.Tags || [] });
});

router.post("/resources/tags", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.resourceArn) return c.json({ error: "resourceArn is required" }, 400);
  if (!Array.isArray(body?.tags) || body.tags.length === 0)
    return c.json({ error: "tags array with at least one tag is required" }, 400);
  await getClient().send(
    new TagResourceCommand({ ResourceArn: body.resourceArn, Tags: body.tags })
  );
  return c.json({ ok: true });
});

router.post("/resources/tags/untag", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.resourceArn) return c.json({ error: "resourceArn is required" }, 400);
  if (!Array.isArray(body?.tagKeys) || body.tagKeys.length === 0)
    return c.json({ error: "tagKeys array with at least one key is required" }, 400);
  await getClient().send(
    new UntagResourceCommand({ ResourceArn: body.resourceArn, TagKeys: body.tagKeys })
  );
  return c.json({ ok: true });
});

export default router;
