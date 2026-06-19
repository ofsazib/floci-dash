import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { ServiceDiscoveryClient } from "@aws-sdk/client-servicediscovery";
import {
  ListNamespacesCommand,
  GetNamespaceCommand,
  CreateHttpNamespaceCommand,
  DeleteNamespaceCommand,
  ListServicesCommand,
  GetServiceCommand,
  CreateServiceCommand,
  DeleteServiceCommand,
  ListInstancesCommand,
} from "@aws-sdk/client-servicediscovery";

const router = new Hono();
const getClient = () => create(ServiceDiscoveryClient);

// ── Namespaces ───────────────────────────────────────────

router.get("/namespaces", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListNamespacesCommand({}));
  const namespaces = result.Namespaces || [];
  return c.json({ namespaces, total: namespaces.length });
});

router.get("/namespaces/:id", async (c: Context) => {
  const id = c.req.param("id");
  const client = getClient();
  const result = await client.send(new GetNamespaceCommand({ Id: id }));
  return c.json({ namespace: result.Namespace });
});

router.post("/namespaces", async (c: Context) => {
  const body = await c.req.json<{ name: string; description?: string }>();
  if (!body.name) return c.json({ error: "name is required" }, 400);

  const client = getClient();
  const result = await client.send(
    new CreateHttpNamespaceCommand({ Name: body.name, Description: body.description })
  );
  return c.json({ operationId: result.OperationId }, 201);
});

router.delete("/namespaces/:id", async (c: Context) => {
  const id = c.req.param("id");
  const client = getClient();
  const result = await client.send(new DeleteNamespaceCommand({ Id: id }));
  return c.json({ operationId: result.OperationId });
});

// ── Services ─────────────────────────────────────────────

router.get("/services", async (c: Context) => {
  const client = getClient();
  const namespaceId = c.req.query("namespaceId");
  const result = await client.send(
    new ListServicesCommand({ Filters: namespaceId ? [{ Name: "NAMESPACE_ID", Values: [namespaceId], Condition: "EQ" }] : undefined })
  );
  const services = result.Services || [];
  return c.json({ services, total: services.length });
});

router.get("/services/:id", async (c: Context) => {
  const id = c.req.param("id");
  const client = getClient();
  const result = await client.send(new GetServiceCommand({ Id: id }));
  return c.json({ service: result.Service });
});

router.post("/services", async (c: Context) => {
  const body = await c.req.json<{
    name: string;
    namespaceId?: string;
    description?: string;
    dnsConfig?: any;
  }>();
  if (!body.name) return c.json({ error: "name is required" }, 400);

  const client = getClient();
  const result = await client.send(
    new CreateServiceCommand({
      Name: body.name,
      NamespaceId: body.namespaceId,
      Description: body.description,
      DnsConfig: body.dnsConfig,
    })
  );
  return c.json({ service: result.Service }, 201);
});

router.delete("/services/:id", async (c: Context) => {
  const id = c.req.param("id");
  const client = getClient();
  await client.send(new DeleteServiceCommand({ Id: id }));
  return c.json({ deleted: true });
});

// ── Instances ────────────────────────────────────────────

router.get("/services/:id/instances", async (c: Context) => {
  const id = c.req.param("id");
  const client = getClient();
  const result = await client.send(new ListInstancesCommand({ ServiceId: id }));
  const instances = result.Instances || [];
  return c.json({ instances, total: instances.length });
});

export default router;
