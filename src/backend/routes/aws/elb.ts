import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { ElasticLoadBalancingV2Client } from "@aws-sdk/client-elastic-load-balancing-v2";
import {
  DescribeLoadBalancersCommand,
  CreateLoadBalancerCommand,
  DeleteLoadBalancerCommand,
  DescribeLoadBalancerAttributesCommand,
  ModifyLoadBalancerAttributesCommand,
  DescribeTargetGroupsCommand,
  CreateTargetGroupCommand,
  DeleteTargetGroupCommand,
  DescribeTargetGroupAttributesCommand,
  ModifyTargetGroupAttributesCommand,
  DescribeListenersCommand,
  CreateListenerCommand,
  DeleteListenerCommand,
  DescribeListenerAttributesCommand,
  ModifyListenerAttributesCommand,
  RegisterTargetsCommand,
  DeregisterTargetsCommand,
  DescribeTargetHealthCommand,
  AddTagsCommand,
  RemoveTagsCommand,
} from "@aws-sdk/client-elastic-load-balancing-v2";

const router = new Hono();
const getClient = () => create(ElasticLoadBalancingV2Client);

// ── Load Balancers ────────────────────────────────────────

router.get("/load-balancers", async (c: Context) => {
  const client = getClient();
  const arns = c.req.query("arns")?.split(",");
  const names = c.req.query("names")?.split(",");
  const result = await client.send(
    new DescribeLoadBalancersCommand({
      LoadBalancerArns: arns || undefined,
      Names: names || undefined,
    })
  );
  const lbs = (result.LoadBalancers || []).map((lb) => ({
    loadBalancerArn: lb.LoadBalancerArn,
    loadBalancerName: lb.LoadBalancerName,
    dnsName: lb.DNSName,
    scheme: lb.Scheme,
    vpcId: lb.VpcId,
    state: lb.State?.Code,
    type: lb.Type,
    availabilityZones: lb.AvailabilityZones?.map((az) => az.ZoneName) || [],
    ipAddressType: lb.IpAddressType,
    createdTime: lb.CreatedTime?.toISOString() || null,
  }));
  return c.json({ loadBalancers: lbs, total: lbs.length });
});

router.post("/load-balancers", async (c: Context) => {
  const body = await c.req.json<{
    name: string;
    subnets: string[];
    securityGroups?: string[];
    scheme?: string;
    type?: string;
    ipAddressType?: string;
    tags?: Record<string, string>;
  }>();
  if (!body.name || !body.subnets?.length) {
    return c.json({ error: "name and subnets are required" }, 400);
  }
  const client = getClient();
  const tagList = body.tags
    ? Object.entries(body.tags).map(([Key, Value]) => ({ Key, Value }))
    : [];
  const result = await client.send(
    new CreateLoadBalancerCommand({
      Name: body.name,
      Subnets: body.subnets,
      SecurityGroups: body.securityGroups,
      Scheme: body.scheme as any || "internet-facing",
      Type: body.type as any || "application",
      IpAddressType: body.ipAddressType as any || "ipv4",
      Tags: tagList.length ? tagList : undefined,
    })
  );
  const lb = result.LoadBalancers?.[0];
  return c.json({ loadBalancer: lb }, 201);
});

router.delete("/load-balancers/:arn", async (c: Context) => {
  const arn = decodeURIComponent(c.req.param("arn") || "");
  const client = getClient();
  await client.send(new DeleteLoadBalancerCommand({ LoadBalancerArn: arn }));
  return c.json({ loadBalancerArn: arn, deleted: true });
});

router.get("/load-balancers/:arn/attributes", async (c: Context) => {
  const arn = decodeURIComponent(c.req.param("arn") || "");
  const client = getClient();
  const result = await client.send(
    new DescribeLoadBalancerAttributesCommand({ LoadBalancerArn: arn })
  );
  const attrs: Record<string, string> = {};
  for (const attr of result.Attributes || []) {
    attrs[attr.Key!] = attr.Value!;
  }
  return c.json({ loadBalancerArn: arn, attributes: attrs });
});

router.put("/load-balancers/:arn/attributes", async (c: Context) => {
  const arn = decodeURIComponent(c.req.param("arn") || "");
  const body = await c.req.json<{ attributes: Record<string, string> }>();
  const client = getClient();
  const attributes = Object.entries(body.attributes || {}).map(([Key, Value]) => ({ Key, Value }));
  await client.send(
    new ModifyLoadBalancerAttributesCommand({
      LoadBalancerArn: arn,
      Attributes: attributes,
    })
  );
  return c.json({ loadBalancerArn: arn, updated: true });
});

// ── Target Groups ─────────────────────────────────────────

router.get("/target-groups", async (c: Context) => {
  const client = getClient();
  const lbArn = c.req.query("loadBalancerArn");
  const result = await client.send(
    new DescribeTargetGroupsCommand({
      LoadBalancerArn: lbArn || undefined,
    })
  );
  const tgs = (result.TargetGroups || []).map((tg) => ({
    targetGroupArn: tg.TargetGroupArn,
    targetGroupName: tg.TargetGroupName,
    protocol: tg.Protocol,
    port: tg.Port,
    vpcId: tg.VpcId,
    targetType: tg.TargetType,
    healthCheckProtocol: tg.HealthCheckProtocol,
    healthCheckPort: tg.HealthCheckPort,
    healthCheckEnabled: tg.HealthCheckEnabled,
    healthCheckIntervalSeconds: tg.HealthCheckIntervalSeconds,
    healthyThresholdCount: tg.HealthyThresholdCount,
    unhealthyThresholdCount: tg.UnhealthyThresholdCount,
  }));
  return c.json({ targetGroups: tgs, total: tgs.length });
});

router.post("/target-groups", async (c: Context) => {
  const body = await c.req.json<{
    name: string;
    protocol: string;
    port: number;
    vpcId: string;
    targetType?: string;
  }>();
  if (!body.name || !body.protocol || !body.port || !body.vpcId) {
    return c.json({ error: "name, protocol, port, and vpcId are required" }, 400);
  }
  const client = getClient();
  const result = await client.send(
    new CreateTargetGroupCommand({
      Name: body.name,
      Protocol: body.protocol as any,
      Port: body.port,
      VpcId: body.vpcId,
      TargetType: body.targetType as any || "instance",
    })
  );
  return c.json({ targetGroup: result.TargetGroups?.[0] }, 201);
});

router.delete("/target-groups/:arn", async (c: Context) => {
  const arn = decodeURIComponent(c.req.param("arn") || "");
  const client = getClient();
  await client.send(new DeleteTargetGroupCommand({ TargetGroupArn: arn }));
  return c.json({ targetGroupArn: arn, deleted: true });
});

router.get("/target-groups/:arn/attributes", async (c: Context) => {
  const arn = decodeURIComponent(c.req.param("arn") || "");
  const client = getClient();
  const result = await client.send(
    new DescribeTargetGroupAttributesCommand({ TargetGroupArn: arn })
  );
  const attrs: Record<string, string> = {};
  for (const attr of result.Attributes || []) {
    attrs[attr.Key!] = attr.Value!;
  }
  return c.json({ targetGroupArn: arn, attributes: attrs });
});

router.get("/target-groups/:arn/health", async (c: Context) => {
  const arn = decodeURIComponent(c.req.param("arn") || "");
  const client = getClient();
  const result = await client.send(
    new DescribeTargetHealthCommand({ TargetGroupArn: arn })
  );
  const targets = (result.TargetHealthDescriptions || []).map((t) => ({
    target: t.Target?.Id,
    port: t.Target?.Port,
    healthState: t.TargetHealth?.State,
    reason: t.TargetHealth?.Reason,
    description: t.TargetHealth?.Description,
  }));
  return c.json({ targets, total: targets.length });
});

// ── Listeners ─────────────────────────────────────────────

router.get("/load-balancers/:arn/listeners", async (c: Context) => {
  const lbArn = decodeURIComponent(c.req.param("arn") || "");
  const client = getClient();
  const result = await client.send(
    new DescribeListenersCommand({ LoadBalancerArn: lbArn })
  );
  const listeners = (result.Listeners || []).map((l) => ({
    listenerArn: l.ListenerArn,
    loadBalancerArn: l.LoadBalancerArn,
    protocol: l.Protocol,
    port: l.Port,
    defaultActions: l.DefaultActions,
    certificates: l.Certificates,
  }));
  return c.json({ listeners, total: listeners.length });
});

router.post("/load-balancers/:arn/listeners", async (c: Context) => {
  const lbArn = decodeURIComponent(c.req.param("arn") || "");
  const body = await c.req.json<{
    protocol: string;
    port: number;
    defaultActions: any[];
    certificates?: any[];
  }>();
  if (!body.protocol || !body.port || !body.defaultActions?.length) {
    return c.json({ error: "protocol, port, and defaultActions are required" }, 400);
  }
  const client = getClient();
  const result = await client.send(
    new CreateListenerCommand({
      LoadBalancerArn: lbArn,
      Protocol: body.protocol as any,
      Port: body.port,
      DefaultActions: body.defaultActions,
      Certificates: body.certificates,
    })
  );
  return c.json({ listener: result.Listeners?.[0] }, 201);
});

router.delete("/listeners/:arn", async (c: Context) => {
  const arn = decodeURIComponent(c.req.param("arn") || "");
  const client = getClient();
  await client.send(new DeleteListenerCommand({ ListenerArn: arn }));
  return c.json({ listenerArn: arn, deleted: true });
});

router.get("/listeners/:arn/attributes", async (c: Context) => {
  const arn = decodeURIComponent(c.req.param("arn") || "");
  const client = getClient();
  const result = await client.send(
    new DescribeListenerAttributesCommand({ ListenerArn: arn })
  );
  const attrs: Record<string, string> = {};
  for (const attr of result.Attributes || []) {
    attrs[attr.Key!] = attr.Value!;
  }
  return c.json({ listenerArn: arn, attributes: attrs });
});

// ── Target Registration ───────────────────────────────────

router.post("/target-groups/:arn/register", async (c: Context) => {
  const tgArn = decodeURIComponent(c.req.param("arn") || "");
  const body = await c.req.json<{ targets: Array<{ id: string; port?: number }> }>();
  if (!body.targets?.length) return c.json({ error: "targets are required" }, 400);
  const client = getClient();
  await client.send(
    new RegisterTargetsCommand({
      TargetGroupArn: tgArn,
      Targets: body.targets.map((t) => ({ Id: t.id, Port: t.port })),
    })
  );
  return c.json({ registered: true });
});

router.post("/target-groups/:arn/deregister", async (c: Context) => {
  const tgArn = decodeURIComponent(c.req.param("arn") || "");
  const body = await c.req.json<{ targets: Array<{ id: string; port?: number }> }>();
  if (!body.targets?.length) return c.json({ error: "targets are required" }, 400);
  const client = getClient();
  await client.send(
    new DeregisterTargetsCommand({
      TargetGroupArn: tgArn,
      Targets: body.targets.map((t) => ({ Id: t.id, Port: t.port })),
    })
  );
  return c.json({ deregistered: true });
});

// ── Tags ──────────────────────────────────────────────────

router.post("/tags", async (c: Context) => {
  const body = await c.req.json<{ resourceArns: string[]; tags: Record<string, string> }>();
  const client = getClient();
  const tagList = Object.entries(body.tags || {}).map(([Key, Value]) => ({ Key, Value }));
  await client.send(
    new AddTagsCommand({
      ResourceArns: body.resourceArns,
      Tags: tagList,
    })
  );
  return c.json({ updated: true });
});

router.delete("/tags", async (c: Context) => {
  const body = await c.req.json<{ resourceArns: string[]; tagKeys: string[] }>();
  const client = getClient();
  await client.send(
    new RemoveTagsCommand({
      ResourceArns: body.resourceArns,
      TagKeys: body.tagKeys || [],
    })
  );
  return c.json({ updated: true });
});

export default router;
