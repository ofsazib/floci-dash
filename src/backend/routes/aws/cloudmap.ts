import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { ServiceDiscoveryClient } from "@aws-sdk/client-servicediscovery";
import {
  CreatePrivateDnsNamespaceCommand,
  CreatePublicDnsNamespaceCommand,
  GetOperationCommand,
  ListOperationsCommand,
  GetInstanceCommand,
} from "@aws-sdk/client-servicediscovery";
import {
  RegisterInstanceCommand,
  DeregisterInstanceCommand,
  DiscoverInstancesCommand,
  GetInstancesHealthStatusCommand,
} from "@aws-sdk/client-servicediscovery";
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
  DiscoverInstancesRevisionCommand,
  ListTagsForResourceCommand,
  TagResourceCommand,
  UntagResourceCommand,
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


router.post("/services/:id/instances", async (c: Context) => {
  const serviceId = c.req.param("id")!;
  const body = await c.req.json<any>();
  if (!body.instanceId) return c.json({ error: "instanceId is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new RegisterInstanceCommand({
      ServiceId: serviceId,
      InstanceId: body.instanceId,
      Attributes: body.attributes,
    })
  );
  return c.json({ operationId: result.OperationId || null }, 201);
});

router.delete("/services/:id/instances/:instanceId", async (c: Context) => {
  const serviceId = c.req.param("id")!;
  const instanceId = c.req.param("instanceId")!;
  const client = getClient();
  const result = await client.send(
    new DeregisterInstanceCommand({ ServiceId: serviceId, InstanceId: instanceId })
  );
  return c.json({ operationId: result.OperationId || null });
});

router.get("/services/:id/instances/health", async (c: Context) => {
  const serviceId = c.req.param("id")!;
  const client = getClient();
  const result = await client.send(
    new GetInstancesHealthStatusCommand({ ServiceId: serviceId })
  );
  return c.json({ status: result.Status || {} });
});

router.post("/discover", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.namespaceName) return c.json({ error: "namespaceName is required" }, 400);
  if (!body.serviceName) return c.json({ error: "serviceName is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new DiscoverInstancesCommand({
      NamespaceName: body.namespaceName,
      ServiceName: body.serviceName,
      MaxResults: body.maxResults,
    })
  );
  const instances = (result.Instances || []).map((inst: any) => ({
    instanceId: inst.InstanceId,
    namespaceName: inst.NamespaceName,
    serviceName: inst.ServiceName,
    attributes: inst.Attributes || {},
  }));
  return c.json({ instances, total: instances.length });
});


// ── DNS Namespaces ─────────────────────────────────────

router.post("/namespaces/private-dns", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.name) return c.json({ error: "name is required" }, 400);
  if (!body.vpc) return c.json({ error: "vpc is required" }, 400);
  const client = getClient();
  const result: any = await client.send(
    new CreatePrivateDnsNamespaceCommand({
      Name: body.name,
      Vpc: body.vpc,
      Description: body.description,
    })
  );
  return c.json({ operationId: result.OperationId, namespace: result.Namespace || null }, 201);
});

router.post("/namespaces/public-dns", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.name) return c.json({ error: "name is required" }, 400);
  const client = getClient();
  const result: any = await client.send(
    new CreatePublicDnsNamespaceCommand({
      Name: body.name,
      Description: body.description,
    })
  );
  return c.json({ operationId: result.OperationId, namespace: result.Namespace || null }, 201);
});

// ── Operations ─────────────────────────────────────────

router.get("/operations", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListOperationsCommand({}));
  const operations = (result.Operations || []).map((op: any) => ({
    id: op.Id,
    status: op.Status,
  }));
  return c.json({ operations, total: operations.length });
});

router.get("/operations/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const client = getClient();
  const result = await client.send(new GetOperationCommand({ OperationId: id }));
  const op = result.Operation;
  return c.json({
    operation: op
      ? {
          id: op.Id,
          status: op.Status,
          createDate: op.CreateDate,
          updateDate: op.UpdateDate,
          targets: op.Targets || {},
        }
      : null,
  });
});

// ── Instance detail ────────────────────────────────────

router.get("/services/:id/instances/:instanceId", async (c: Context) => {
  const serviceId = c.req.param("id")!;
  const instanceId = c.req.param("instanceId")!;
  const client = getClient();
  const result = await client.send(
    new GetInstanceCommand({ ServiceId: serviceId, InstanceId: instanceId })
  );
  const inst = result.Instance;
  return c.json({
    instance: inst
      ? { id: inst.Id, attributes: inst.Attributes || {} }
      : null,
  });
});


// ── P1 gap audit ─────────────────────────────────────────

router.get("/discover-instances-revision", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new DiscoverInstancesRevisionCommand({
    NamespaceName: c.req.query("namespaceName") || "",
    ServiceName: c.req.query("serviceName") || "",
  }));
  return c.json({ instancesRevision: result.InstancesRevision ?? null });
});

router.get("/resources/tags", async (c: Context) => {
  const arn = c.req.query("arn") || "";
  if (!arn) return c.json({ error: "arn is required" }, 400);
  const client = getClient();
  const result = await client.send(new ListTagsForResourceCommand({ ResourceARN: arn }));
  return c.json({ tags: result.Tags ?? [] });
});

router.post("/resources/tags", async (c: Context) => {
  const body = await c.req.json<{ arn: string; tags: Array<{ Key: string; Value: string }> }>();
  if (!body.arn || !body.tags) return c.json({ error: "arn and tags are required" }, 400);
  const client = getClient();
  await client.send(new TagResourceCommand({ ResourceARN: body.arn, Tags: body.tags }));
  return c.json({ tagged: true });
});

router.delete("/resources/tags", async (c: Context) => {
  const arn = c.req.query("arn") || "";
  const tagKeys = (c.req.query("tagKeys") || "").split(",").filter(Boolean);
  if (!arn || !tagKeys.length) return c.json({ error: "arn and tagKeys are required" }, 400);
  const client = getClient();
  await client.send(new UntagResourceCommand({ ResourceARN: arn, TagKeys: tagKeys }));
  return c.json({ untagged: true });
});


export default router;