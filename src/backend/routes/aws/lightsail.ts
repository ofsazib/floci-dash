import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { LightsailClient } from "@aws-sdk/client-lightsail";
import {
  GetInstancesCommand,
  GetInstanceCommand,
  CreateInstancesCommand,
  DeleteInstanceCommand,
  StartInstanceCommand,
  StopInstanceCommand,
  RebootInstanceCommand,
  GetInstanceStateCommand,
  GetInstancePortStatesCommand,
  OpenInstancePublicPortsCommand,
  PutInstancePublicPortsCommand,
  CloseInstancePublicPortsCommand,
  GetDisksCommand,
  GetDiskCommand,
  CreateDiskCommand,
  AttachDiskCommand,
  DetachDiskCommand,
  DeleteDiskCommand,
  GetStaticIpsCommand,
  GetStaticIpCommand,
  AllocateStaticIpCommand,
  AttachStaticIpCommand,
  DetachStaticIpCommand,
  ReleaseStaticIpCommand,
  GetKeyPairsCommand,
  GetKeyPairCommand,
  CreateKeyPairCommand,
  DeleteKeyPairCommand,
  TagResourceCommand,
  UntagResourceCommand,
} from "@aws-sdk/client-lightsail";

const router = new Hono();
const getClient = () => create(LightsailClient);

// ── Instances ──────────────────────────────────────────

router.get("/instances", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new GetInstancesCommand({}));
  return c.json({ instances: result.instances ?? [] });
});

router.get("/instances/:name", async (c: Context) => {
  const instanceName = c.req.param("name");
  const client = getClient();
  const result = await client.send(new GetInstanceCommand({ instanceName }));
  return c.json({ instance: result.instance ?? null });
});

router.post("/instances", async (c: Context) => {
  const body = await c.req.json();
  if (!body.instanceNames?.length) return c.json({ error: "instanceNames is required" }, 400);
  if (!body.availabilityZone) return c.json({ error: "availabilityZone is required" }, 400);
  if (!body.bundleId) return c.json({ error: "bundleId is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CreateInstancesCommand({
      instanceNames: body.instanceNames,
      availabilityZone: body.availabilityZone,
      bundleId: body.bundleId,
      blueprintId: body.blueprintId,
      userData: body.userData,
      keyPairName: body.keyPairName,
      tags: body.tags,
    })
  );
  return c.json({ operations: result.operations ?? [] }, 201);
});

router.delete("/instances/:name", async (c: Context) => {
  const instanceName = c.req.param("name");
  const client = getClient();
  const result = await client.send(new DeleteInstanceCommand({ instanceName }));
  return c.json({ operations: result.operations ?? [] });
});

router.post("/instances/:name/start", async (c: Context) => {
  const instanceName = c.req.param("name");
  const client = getClient();
  const result = await client.send(new StartInstanceCommand({ instanceName }));
  return c.json({ operations: result.operations ?? [] });
});

router.post("/instances/:name/stop", async (c: Context) => {
  const instanceName = c.req.param("name");
  const client = getClient();
  const result = await client.send(new StopInstanceCommand({ instanceName }));
  return c.json({ operations: result.operations ?? [] });
});

router.post("/instances/:name/reboot", async (c: Context) => {
  const instanceName = c.req.param("name");
  const client = getClient();
  await client.send(new RebootInstanceCommand({ instanceName }));
  return c.json({ rebooted: true });
});

router.get("/instances/:name/state", async (c: Context) => {
  const instanceName = c.req.param("name");
  const client = getClient();
  const result = await client.send(new GetInstanceStateCommand({ instanceName }));
  return c.json({ state: result.state ?? null });
});

router.get("/instances/:name/ports", async (c: Context) => {
  const instanceName = c.req.param("name");
  const client = getClient();
  const result = await client.send(new GetInstancePortStatesCommand({ instanceName }));
  return c.json({ portStates: result.portStates ?? [] });
});

router.post("/instances/:name/open-ports", async (c: Context) => {
  const instanceName = c.req.param("name");
  const body = await c.req.json();
  const client = getClient();
  const result = await client.send(
    new OpenInstancePublicPortsCommand({
      instanceName,
      portInfo: body.portInfo ?? {},
    })
  );
  return c.json({ operation: result.operation ?? null });
});

router.post("/instances/:name/ports", async (c: Context) => {
  const instanceName = c.req.param("name");
  const body = await c.req.json();
  const client = getClient();
  const result = await client.send(
    new PutInstancePublicPortsCommand({
      instanceName,
      portInfos: body.portInfos ?? [],
    })
  );
  return c.json({ operation: result.operation ?? null });
});

router.post("/instances/:name/close-ports", async (c: Context) => {
  const instanceName = c.req.param("name");
  const body = await c.req.json();
  const client = getClient();
  const result = await client.send(
    new CloseInstancePublicPortsCommand({
      instanceName,
      portInfo: body.portInfo ?? {},
    })
  );
  return c.json({ operation: result.operation ?? null });
});

// ── Disks ──────────────────────────────────────────────

router.get("/disks", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new GetDisksCommand({}));
  return c.json({ disks: result.disks ?? [] });
});

router.get("/disks/:name", async (c: Context) => {
  const diskName = c.req.param("name");
  const client = getClient();
  const result = await client.send(new GetDiskCommand({ diskName }));
  return c.json({ disk: result.disk ?? null });
});

router.post("/disks", async (c: Context) => {
  const body = await c.req.json();
  if (!body.diskName) return c.json({ error: "diskName is required" }, 400);
  if (!body.availabilityZone) return c.json({ error: "availabilityZone is required" }, 400);
  if (!body.sizeInGb) return c.json({ error: "sizeInGb is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CreateDiskCommand({
      diskName: body.diskName,
      availabilityZone: body.availabilityZone,
      sizeInGb: body.sizeInGb,
      tags: body.tags,
    })
  );
  return c.json({ operations: result.operations ?? [] }, 201);
});

router.post("/disks/:name/attach", async (c: Context) => {
  const diskName = c.req.param("name");
  const body = await c.req.json();
  if (!body.instanceName) return c.json({ error: "instanceName is required" }, 400);
  if (!body.diskPath) return c.json({ error: "diskPath is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new AttachDiskCommand({
      diskName,
      instanceName: body.instanceName,
      diskPath: body.diskPath,
    })
  );
  return c.json({ operations: result.operations ?? [] });
});

router.post("/disks/:name/detach", async (c: Context) => {
  const diskName = c.req.param("name");
  const client = getClient();
  const result = await client.send(new DetachDiskCommand({ diskName }));
  return c.json({ operations: result.operations ?? [] });
});

router.delete("/disks/:name", async (c: Context) => {
  const diskName = c.req.param("name");
  const client = getClient();
  const result = await client.send(new DeleteDiskCommand({ diskName }));
  return c.json({ operations: result.operations ?? [] });
});

// ── Static IPs ─────────────────────────────────────────

router.get("/static-ips", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new GetStaticIpsCommand({}));
  return c.json({ staticIps: result.staticIps ?? [] });
});

router.get("/static-ips/:name", async (c: Context) => {
  const staticIpName = c.req.param("name");
  const client = getClient();
  const result = await client.send(new GetStaticIpCommand({ staticIpName }));
  return c.json({ staticIp: result.staticIp ?? null });
});

router.post("/static-ips", async (c: Context) => {
  const body = await c.req.json();
  if (!body.staticIpName) return c.json({ error: "staticIpName is required" }, 400);
  const client = getClient();
  const result = await client.send(new AllocateStaticIpCommand({ staticIpName: body.staticIpName }));
  return c.json({ operations: result.operations ?? [] }, 201);
});

router.post("/static-ips/:name/attach", async (c: Context) => {
  const staticIpName = c.req.param("name");
  const body = await c.req.json();
  if (!body.instanceName) return c.json({ error: "instanceName is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new AttachStaticIpCommand({ staticIpName, instanceName: body.instanceName })
  );
  return c.json({ operations: result.operations ?? [] });
});

router.post("/static-ips/:name/detach", async (c: Context) => {
  const staticIpName = c.req.param("name");
  const client = getClient();
  const result = await client.send(new DetachStaticIpCommand({ staticIpName }));
  return c.json({ operations: result.operations ?? [] });
});

router.delete("/static-ips/:name", async (c: Context) => {
  const staticIpName = c.req.param("name");
  const client = getClient();
  const result = await client.send(new ReleaseStaticIpCommand({ staticIpName }));
  return c.json({ operations: result.operations ?? [] });
});

// ── Key Pairs ──────────────────────────────────────────

router.get("/key-pairs", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new GetKeyPairsCommand({}));
  return c.json({ keyPairs: result.keyPairs ?? [] });
});

router.get("/key-pairs/:name", async (c: Context) => {
  const keyPairName = c.req.param("name");
  const client = getClient();
  const result = await client.send(new GetKeyPairCommand({ keyPairName }));
  return c.json({ keyPair: result.keyPair ?? null });
});

router.post("/key-pairs", async (c: Context) => {
  const body = await c.req.json();
  if (!body.keyPairName) return c.json({ error: "keyPairName is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CreateKeyPairCommand({
      keyPairName: body.keyPairName,
      tags: body.tags,
    })
  );
  return c.json({ keyPair: result.keyPair ?? null, privateKey: result.privateKeyBase64 ?? null }, 201);
});

router.delete("/key-pairs/:name", async (c: Context) => {
  const keyPairName = c.req.param("name");
  const client = getClient();
  await client.send(new DeleteKeyPairCommand({ keyPairName }));
  return c.json({ deleted: true });
});

// ── Tags ───────────────────────────────────────────────

router.post("/tags", async (c: Context) => {
  const body = await c.req.json();
  if (!body.resourceName || !body.tags?.length) return c.json({ error: "resourceName and tags are required" }, 400);
  const client = getClient();
  await client.send(
    new TagResourceCommand({
      resourceName: body.resourceName,
      resourceArn: body.resourceArn,
      tags: body.tags,
    })
  );
  return c.json({ tagged: true });
});

router.delete("/tags", async (c: Context) => {
  const body = await c.req.json();
  if (!body.resourceName || !body.tagKeys?.length) return c.json({ error: "resourceName and tagKeys are required" }, 400);
  const client = getClient();
  await client.send(
    new UntagResourceCommand({
      resourceName: body.resourceName,
      resourceArn: body.resourceArn,
      tagKeys: body.tagKeys,
    })
  );
  return c.json({ untagged: true });
});

export default router;
