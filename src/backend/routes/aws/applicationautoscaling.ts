import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { ApplicationAutoScalingClient } from "@aws-sdk/client-application-auto-scaling";
import {
  RegisterScalableTargetCommand,
  DescribeScalableTargetsCommand,
  DeregisterScalableTargetCommand,
  PutScalingPolicyCommand,
  DescribeScalingPoliciesCommand,
  DeleteScalingPolicyCommand,
  ListTagsForResourceCommand,
  TagResourceCommand,
  UntagResourceCommand,
} from "@aws-sdk/client-application-auto-scaling";

const router = new Hono();

const getClient = () => create(ApplicationAutoScalingClient);

// ─── Scalable targets ────────────────────────────────────

router.post("/scalable-targets", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.serviceNamespace) return c.json({ error: "serviceNamespace is required" }, 400);
  if (!body.resourceId) return c.json({ error: "resourceId is required" }, 400);
  if (!body.scalableDimension) return c.json({ error: "scalableDimension is required" }, 400);
  if (body.minCapacity == null || body.maxCapacity == null) {
    return c.json({ error: "minCapacity and maxCapacity are required" }, 400);
  }
  const result = await getClient().send(new RegisterScalableTargetCommand({
    ServiceNamespace: body.serviceNamespace,
    ResourceId: body.resourceId,
    ScalableDimension: body.scalableDimension,
    MinCapacity: body.minCapacity,
    MaxCapacity: body.maxCapacity,
    RoleARN: body.roleArn,
  }));
  return c.json({ scalableTargetARN: result.ScalableTargetARN ?? null }, 201);
});

router.get("/scalable-targets", async (c: Context) => {
  const client = getClient();
  const result = await getClient().send(new DescribeScalableTargetsCommand({
    ServiceNamespace: (c.req.query("serviceNamespace") as any) || "ecs",
    ResourceIds: c.req.query("resourceIds") ? c.req.query("resourceIds")!.split(",") : undefined,
    ScalableDimension: (c.req.query("scalableDimension") as any) || undefined,
  }));
  const scalableTargets = (result.ScalableTargets || []).map((t: any) => ({
    serviceNamespace: t.ServiceNamespace,
    resourceId: t.ResourceId,
    scalableDimension: t.ScalableDimension,
    minCapacity: t.MinCapacity,
    maxCapacity: t.MaxCapacity,
    roleArn: t.RoleARN,
  }));
  return c.json({ scalableTargets, total: scalableTargets.length });
});

router.delete("/scalable-targets", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.serviceNamespace || !body.resourceId || !body.scalableDimension) {
    return c.json({ error: "serviceNamespace, resourceId and scalableDimension are required" }, 400);
  }
  await getClient().send(new DeregisterScalableTargetCommand({
    ServiceNamespace: body.serviceNamespace,
    ResourceId: body.resourceId,
    ScalableDimension: body.scalableDimension,
  }));
  return c.json({ deregistered: true });
});

// ─── Scaling policies ────────────────────────────────────

router.post("/scalable-policies", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.policyName) return c.json({ error: "policyName is required" }, 400);
  if (!body.serviceNamespace) return c.json({ error: "serviceNamespace is required" }, 400);
  if (!body.resourceId) return c.json({ error: "resourceId is required" }, 400);
  if (!body.scalableDimension) return c.json({ error: "scalableDimension is required" }, 400);
  const result = await getClient().send(new PutScalingPolicyCommand({
    PolicyName: body.policyName,
    ServiceNamespace: body.serviceNamespace,
    ResourceId: body.resourceId,
    ScalableDimension: body.scalableDimension,
    PolicyType: body.policyType || "TargetTrackingScaling",
    TargetTrackingScalingPolicyConfiguration: body.targetTrackingConfiguration,
    StepScalingPolicyConfiguration: body.stepScalingConfiguration,
  }));
  return c.json({
    policyArn: result.PolicyARN ?? null,
    alarms: result.Alarms ?? [],
  }, 201);
});

router.get("/scalable-policies", async (c: Context) => {
  const client = getClient();
  const result = await getClient().send(new DescribeScalingPoliciesCommand({
    ServiceNamespace: (c.req.query("serviceNamespace") as any) || "ecs",
    ResourceId: c.req.query("resourceId"),
    ScalableDimension: (c.req.query("scalableDimension") as any) || undefined,
    PolicyNames: c.req.query("policyNames") ? c.req.query("policyNames")!.split(",") : undefined,
  }));
  const scalingPolicies = (result.ScalingPolicies || []).map((p: any) => ({
    name: p.PolicyName,
    arn: p.PolicyARN,
    serviceNamespace: p.ServiceNamespace,
    resourceId: p.ResourceId,
    scalableDimension: p.ScalableDimension,
    policyType: p.PolicyType,
    targetTracking: p.TargetTrackingScalingPolicyConfiguration ?? null,
    creationTime: p.CreationTime,
  }));
  return c.json({ scalingPolicies, total: scalingPolicies.length });
});

router.delete("/scalable-policies/:policyName", async (c: Context) => {
  const policyName = c.req.param("policyName")!;
  const serviceNamespace = (c.req.query("serviceNamespace") as any) || "ecs";
  const resourceId = c.req.query("resourceId") || "";
  const scalableDimension = (c.req.query("scalableDimension") as any) || "";
  if (!resourceId) return c.json({ error: "resourceId is required" }, 400);
  await getClient().send(new DeleteScalingPolicyCommand({
    PolicyName: policyName,
    ServiceNamespace: serviceNamespace,
    ResourceId: resourceId,
    ScalableDimension: scalableDimension,
  }));
  return c.json({ deleted: true });
});

// ─── Tags ────────────────────────────────────────────────

router.get("/resources/:resourceId/tags", async (c: Context) => {
  const resourceId = decodeURIComponent(c.req.param("resourceId")!);
  const result: any = await getClient().send(new ListTagsForResourceCommand({ ResourceId: resourceId } as any));
  return c.json({
    tags: (result.Tags || []).map((t: any) => ({ Key: t.Key, Value: t.Value })),
    total: (result.Tags || []).length,
  });
});

router.put("/resources/:resourceId/tags", async (c: Context) => {
  const resourceId = decodeURIComponent(c.req.param("resourceId")!);
  const body = await c.req.json<{ tags: Array<{ Key: string; Value: string }> }>();
  if (!body.tags) return c.json({ error: "tags is required" }, 400);
  await getClient().send(new TagResourceCommand({ ResourceId: resourceId, Tags: body.tags } as any));
  return c.json({ tagged: true });
});

router.delete("/resources/:resourceId/tags/:tagKey", async (c: Context) => {
  const resourceId = decodeURIComponent(c.req.param("resourceId")!);
  const tagKey = decodeURIComponent(c.req.param("tagKey")!);
  await getClient().send(new UntagResourceCommand({ ResourceId: resourceId, TagKeys: [tagKey] } as any));
  return c.json({ untagged: true });
});

export default router;
