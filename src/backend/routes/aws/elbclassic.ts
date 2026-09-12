import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import {
  ElasticLoadBalancingClient,
  AddTagsCommand,
  ApplySecurityGroupsToLoadBalancerCommand,
  AttachLoadBalancerToSubnetsCommand,
  ConfigureHealthCheckCommand,
  CreateLoadBalancerCommand,
  CreateLoadBalancerListenersCommand,
  DeleteLoadBalancerCommand,
  DeleteLoadBalancerListenersCommand,
  DeregisterInstancesFromLoadBalancerCommand,
  DescribeAccountLimitsCommand,
  DescribeInstanceHealthCommand,
  DescribeLoadBalancerAttributesCommand,
  DescribeLoadBalancersCommand,
  DescribeTagsCommand,
  DetachLoadBalancerFromSubnetsCommand,
  DisableAvailabilityZonesForLoadBalancerCommand,
  EnableAvailabilityZonesForLoadBalancerCommand,
  ModifyLoadBalancerAttributesCommand,
  RegisterInstancesWithLoadBalancerCommand,
  RemoveTagsCommand,
} from "@aws-sdk/client-elastic-load-balancing";

const router = new Hono();
const getClient = () => create(ElasticLoadBalancingClient);

const badRequest = (c: Context, msg: string) => c.json({ error: msg }, 400);

const body = async (c: Context): Promise<any> => {
  try {
    return await c.req.json();
  } catch {
    return {};
  }
};

const csv = (value: unknown): string[] =>
  typeof value === "string"
    ? value.split(",").map((s) => s.trim()).filter(Boolean)
    : Array.isArray(value)
      ? value
      : [];

const listener = (l: any) => ({
  Protocol: String(l.protocol || "").toUpperCase(),
  LoadBalancerPort: Number(l.port),
  InstancePort: Number(l.instancePort),
});

// ---------- Load balancers ----------

router.get("/load-balancers", async (c: Context) => {
  const res: any = await getClient().send(new DescribeLoadBalancersCommand({}));
  const loadBalancers = (res?.LoadBalancerDescriptions || []).map((lb: any) => ({
    name: lb.LoadBalancerName,
    dnsName: lb.DNSName || null,
    scheme: lb.Scheme || null,
    createdTime: lb.CreatedTime || null,
    vpcId: lb.VPCId || null,
    zones: lb.AvailabilityZones || [],
    subnets: lb.Subnets || [],
    securityGroups: lb.SecurityGroups || [],
    instances: (lb.Instances || []).map((i: any) => i.InstanceId),
    listeners: (lb.ListenerDescriptions || []).map((d: any) => d.Listener),
  }));
  return c.json({ loadBalancers, total: loadBalancers.length });
});

router.post("/load-balancers", async (c: Context) => {
  const b = await body(c);
  const LoadBalancerName = b.name;
  if (!LoadBalancerName) return badRequest(c, "name is required");
  const Zones = csv(b.zones);
  if (!Zones.length) return badRequest(c, "at least one availability zone is required");
  if (!b.listener?.protocol || !b.listener?.port || !b.listener?.instancePort) {
    return badRequest(c, "listener protocol, port and instancePort are required");
  }
  const res: any = await getClient().send(
    new CreateLoadBalancerCommand({
      LoadBalancerName,
      AvailabilityZones: Zones,
      Listeners: [listener(b.listener)],
      Scheme: b.scheme || undefined,
    }),
  );
  return c.json({ dnsName: res?.DNSName }, 201);
});

router.delete("/load-balancers", async (c: Context) => {
  const name = c.req.query("name");
  if (!name) return badRequest(c, "name is required");
  await getClient().send(new DeleteLoadBalancerCommand({ LoadBalancerName: name }));
  return c.json({ name });
});

router.get("/load-balancers/detail", async (c: Context) => {
  const name = c.req.query("name");
  if (!name) return badRequest(c, "name is required");
  const res: any = await getClient().send(
    new DescribeLoadBalancersCommand({ LoadBalancerNames: [name] }),
  );
  const lb = res?.LoadBalancerDescriptions?.[0];
  return c.json({ loadBalancer: lb || null });
});

router.get("/load-balancers/attributes", async (c: Context) => {
  const name = c.req.query("name");
  if (!name) return badRequest(c, "name is required");
  const res: any = await getClient().send(
    new DescribeLoadBalancerAttributesCommand({ LoadBalancerName: name }),
  );
  return c.json(res);
});

router.put("/load-balancers/attributes", async (c: Context) => {
  const b = await body(c);
  const LoadBalancerName = b.name;
  if (!LoadBalancerName) return badRequest(c, "name is required");
  if (!b.attributes || typeof b.attributes !== "object") {
    return badRequest(c, "attributes must be a JSON object");
  }
  const res: any = await getClient().send(
    new ModifyLoadBalancerAttributesCommand({ LoadBalancerName, LoadBalancerAttributes: b.attributes }),
  );
  return c.json(res);
});

// ---------- Listeners ----------

router.post("/listeners", async (c: Context) => {
  const b = await body(c);
  const LoadBalancerName = b.name;
  if (!LoadBalancerName) return badRequest(c, "name is required");
  if (!Array.isArray(b.listeners) || !b.listeners.length) {
    return badRequest(c, "at least one listener is required");
  }
  await getClient().send(
    new CreateLoadBalancerListenersCommand({
      LoadBalancerName,
      Listeners: b.listeners.map(listener),
    }),
  );
  return c.json({ ok: true }, 201);
});

router.delete("/listeners", async (c: Context) => {
  const name = c.req.query("name");
  const ports = csv(c.req.query("ports")).map(Number);
  if (!name) return badRequest(c, "name is required");
  if (!ports.length) return badRequest(c, "at least one port is required");
  await getClient().send(
    new DeleteLoadBalancerListenersCommand({
      LoadBalancerName: name,
      LoadBalancerPorts: ports,
    }),
  );
  return c.json({ ok: true });
});

// ---------- Instances and health ----------

router.get("/health", async (c: Context) => {
  const name = c.req.query("name");
  if (!name) return badRequest(c, "name is required");
  const res: any = await getClient().send(
    new DescribeInstanceHealthCommand({ LoadBalancerName: name }),
  );
  const instanceStates = (res?.InstanceStates || []).map((s: any) => ({
    instanceId: s.InstanceId,
    state: s.State || null,
    reasonCode: s.ReasonCode || null,
    description: s.Description || null,
  }));
  return c.json({ instanceStates, total: instanceStates.length });
});

router.post("/instances/register", async (c: Context) => {
  const b = await body(c);
  const LoadBalancerName = b.name;
  if (!LoadBalancerName) return badRequest(c, "name is required");
  const instances = csv(b.instances);
  if (!instances.length) return badRequest(c, "at least one instance id is required");
  const res: any = await getClient().send(
    new RegisterInstancesWithLoadBalancerCommand({
      LoadBalancerName,
      Instances: instances.map((InstanceId) => ({ InstanceId })),
    }),
  );
  return c.json({ instances: res?.Instances || [] }, 201);
});

router.post("/instances/deregister", async (c: Context) => {
  const b = await body(c);
  const LoadBalancerName = b.name;
  if (!LoadBalancerName) return badRequest(c, "name is required");
  const instances = csv(b.instances);
  if (!instances.length) return badRequest(c, "at least one instance id is required");
  const res: any = await getClient().send(
    new DeregisterInstancesFromLoadBalancerCommand({
      LoadBalancerName,
      Instances: instances.map((InstanceId) => ({ InstanceId })),
    }),
  );
  return c.json({ instances: res?.Instances || [] });
});

router.put("/health-check", async (c: Context) => {
  const b = await body(c);
  const LoadBalancerName = b.name;
  if (!LoadBalancerName) return badRequest(c, "name is required");
  const hc = b.healthCheck || {};
  if (!hc.target) return badRequest(c, "healthCheck.target is required");
  const res: any = await getClient().send(
    new ConfigureHealthCheckCommand({
      LoadBalancerName,
      HealthCheck: {
        Target: hc.target,
        Interval: Number(hc.interval ?? 30),
        Timeout: Number(hc.timeout ?? 5),
        HealthyThreshold: Number(hc.healthyThreshold ?? 2),
        UnhealthyThreshold: Number(hc.unhealthyThreshold ?? 2),
      },
    }),
  );
  return c.json({ healthCheck: res?.HealthCheck });
});

// ---------- Networking ----------

router.put("/security-groups", async (c: Context) => {
  const b = await body(c);
  if (!b.name) return badRequest(c, "name is required");
  const groups = csv(b.securityGroups);
  if (!groups.length) return badRequest(c, "at least one security group is required");
  const res: any = await getClient().send(
    new ApplySecurityGroupsToLoadBalancerCommand({ LoadBalancerName: b.name, SecurityGroups: groups }),
  );
  return c.json({ securityGroups: res?.SecurityGroups || [] });
});

router.put("/subnets/attach", async (c: Context) => {
  const b = await body(c);
  if (!b.name) return badRequest(c, "name is required");
  const subnets = csv(b.subnets);
  if (!subnets.length) return badRequest(c, "at least one subnet is required");
  const res: any = await getClient().send(
    new AttachLoadBalancerToSubnetsCommand({ LoadBalancerName: b.name, Subnets: subnets }),
  );
  return c.json({ subnets: res?.Subnets || [] });
});

router.put("/subnets/detach", async (c: Context) => {
  const b = await body(c);
  if (!b.name) return badRequest(c, "name is required");
  const subnets = csv(b.subnets);
  if (!subnets.length) return badRequest(c, "at least one subnet is required");
  const res: any = await getClient().send(
    new DetachLoadBalancerFromSubnetsCommand({ LoadBalancerName: b.name, Subnets: subnets }),
  );
  return c.json({ subnets: res?.Subnets || [] });
});

router.put("/zones/enable", async (c: Context) => {
  const b = await body(c);
  if (!b.name) return badRequest(c, "name is required");
  const zones = csv(b.zones);
  if (!zones.length) return badRequest(c, "at least one availability zone is required");
  const res: any = await getClient().send(
    new EnableAvailabilityZonesForLoadBalancerCommand({ LoadBalancerName: b.name, AvailabilityZones: zones }),
  );
  return c.json({ zones: res?.AvailabilityZones || [] });
});

router.put("/zones/disable", async (c: Context) => {
  const b = await body(c);
  if (!b.name) return badRequest(c, "name is required");
  const zones = csv(b.zones);
  if (!zones.length) return badRequest(c, "at least one availability zone is required");
  const res: any = await getClient().send(
    new DisableAvailabilityZonesForLoadBalancerCommand({ LoadBalancerName: b.name, AvailabilityZones: zones }),
  );
  return c.json({ zones: res?.AvailabilityZones || [] });
});

// ---------- Tags and limits ----------

router.get("/tags", async (c: Context) => {
  const name = c.req.query("name");
  if (!name) return badRequest(c, "name is required");
  const res: any = await getClient().send(
    new DescribeTagsCommand({ LoadBalancerNames: [name] }),
  );
  const descriptions = res?.TagDescriptions || [];
  return c.json({ tags: descriptions[0]?.Tags || [] });
});

router.post("/tags", async (c: Context) => {
  const b = await body(c);
  if (!b.name) return badRequest(c, "name is required");
  if (!Array.isArray(b.tags) || !b.tags.length) {
    return badRequest(c, "at least one tag is required");
  }
  await getClient().send(
    new AddTagsCommand({ LoadBalancerNames: [b.name], Tags: b.tags }),
  );
  return c.json({ ok: true }, 201);
});

router.post("/tags/remove", async (c: Context) => {
  const b = await body(c);
  if (!b.name) return badRequest(c, "name is required");
  if (!Array.isArray(b.keys) || !b.keys.length) {
    return badRequest(c, "at least one tag key is required");
  }
  await getClient().send(
    new RemoveTagsCommand({
      LoadBalancerNames: [b.name],
      Tags: b.keys.map((Key: string) => ({ Key })),
    }),
  );
  return c.json({ ok: true });
});

router.get("/account-limits", async (c: Context) => {
  const res: any = await getClient().send(new DescribeAccountLimitsCommand({}));
  return c.json({ limits: res?.Limits || [] });
});

export default router;
