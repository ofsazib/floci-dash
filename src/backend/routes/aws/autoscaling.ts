import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { AutoScalingClient } from "@aws-sdk/client-auto-scaling";
import {
  DescribeAutoScalingGroupsCommand,
  CreateAutoScalingGroupCommand,
  UpdateAutoScalingGroupCommand,
  DeleteAutoScalingGroupCommand,
  SetDesiredCapacityCommand,
  DescribeLaunchConfigurationsCommand,
  DescribePoliciesCommand,
  DescribeScalingActivitiesCommand,
  StartInstanceRefreshCommand,
  DescribeInstanceRefreshesCommand,
  CreateOrUpdateTagsCommand,
  DeleteTagsCommand,
  AttachLoadBalancerTargetGroupsCommand,
  DetachLoadBalancerTargetGroupsCommand,
  DescribeLoadBalancerTargetGroupsCommand,
  AttachLoadBalancersCommand,
  DetachLoadBalancersCommand,
  DescribeLoadBalancersCommand,
  DescribeAutoScalingNotificationTypesCommand,
  DescribeTerminationPolicyTypesCommand,
  DescribeAdjustmentTypesCommand,
  DescribeAccountLimitsCommand,
  DescribeLifecycleHookTypesCommand,
  DescribeMetricCollectionTypesCommand,
  PutScalingPolicyCommand,
  DeletePolicyCommand,
  PutLifecycleHookCommand,
  DeleteLifecycleHookCommand,
  DescribeLifecycleHooksCommand,
  CompleteLifecycleActionCommand,
} from "@aws-sdk/client-auto-scaling";

const router = new Hono();
const getClient = () => create(AutoScalingClient);

// ── Auto Scaling Groups ──────────────────────────────────

router.get("/groups", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new DescribeAutoScalingGroupsCommand({}));
  const groups = result.AutoScalingGroups || [];
  return c.json({ groups, total: groups.length });
});

router.post("/groups", async (c: Context) => {
  const body = await c.req.json<{
    autoScalingGroupName: string;
    minSize: number;
    maxSize: number;
    desiredCapacity?: number;
    launchConfigurationName?: string;
    launchTemplate?: { LaunchTemplateName?: string; Version?: string };
    availabilityZones?: string[];
    targetGroupARNs?: string[];
    loadBalancerNames?: string[];
    healthCheckType?: string;
    healthCheckGracePeriod?: number;
    defaultInstanceWarmup?: number;
    tags?: { key: string; value: string; propagateAtLaunch?: boolean }[];
  }>();
  if (!body.autoScalingGroupName) return c.json({ error: "autoScalingGroupName is required" }, 400);
  if (body.minSize === undefined) return c.json({ error: "minSize is required" }, 400);
  if (body.maxSize === undefined) return c.json({ error: "maxSize is required" }, 400);

  const client = getClient();
  const result = await client.send(
    new CreateAutoScalingGroupCommand({
      AutoScalingGroupName: body.autoScalingGroupName,
      MinSize: body.minSize,
      MaxSize: body.maxSize,
      DesiredCapacity: body.desiredCapacity,
      LaunchConfigurationName: body.launchConfigurationName,
      LaunchTemplate: body.launchTemplate,
      AvailabilityZones: body.availabilityZones,
      TargetGroupARNs: body.targetGroupARNs,
      LoadBalancerNames: body.loadBalancerNames,
      HealthCheckType: body.healthCheckType,
      HealthCheckGracePeriod: body.healthCheckGracePeriod,
      DefaultInstanceWarmup: body.defaultInstanceWarmup,
      Tags: body.tags?.map((t) => ({
        Key: t.key,
        Value: t.value,
        PropagateAtLaunch: t.propagateAtLaunch ?? true,
      })),
    })
  );
  return c.json({ created: true }, 201);
});

router.put("/groups/:name", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<{
    minSize?: number;
    maxSize?: number;
    desiredCapacity?: number;
    launchConfigurationName?: string;
    launchTemplate?: { LaunchTemplateName?: string; Version?: string };
  }>();
  const client = getClient();
  await client.send(
    new UpdateAutoScalingGroupCommand({
      AutoScalingGroupName: name,
      MinSize: body.minSize,
      MaxSize: body.maxSize,
      DesiredCapacity: body.desiredCapacity,
      LaunchConfigurationName: body.launchConfigurationName,
      LaunchTemplate: body.launchTemplate,
    })
  );
  return c.json({ updated: true });
});

router.delete("/groups/:name", async (c: Context) => {
  const name = c.req.param("name");
  const forceDelete = c.req.query("force") === "true";
  const client = getClient();
  await client.send(
    new DeleteAutoScalingGroupCommand({
      AutoScalingGroupName: name,
      ForceDelete: forceDelete,
    })
  );
  return c.json({ deleted: true });
});

router.put("/groups/:name/desired-capacity", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<{ desiredCapacity: number }>();
  if (body.desiredCapacity === undefined) return c.json({ error: "desiredCapacity is required" }, 400);
  const client = getClient();
  await client.send(
    new SetDesiredCapacityCommand({
      AutoScalingGroupName: name,
      DesiredCapacity: body.desiredCapacity,
    })
  );
  return c.json({ updated: true });
});

// ── Launch Configurations ────────────────────────────────

router.get("/launch-configurations", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new DescribeLaunchConfigurationsCommand({}));
  const launchConfigurations = result.LaunchConfigurations || [];
  return c.json({ launchConfigurations, total: launchConfigurations.length });
});

// ── Scaling Policies ─────────────────────────────────────

router.get("/groups/:name/policies", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  const result = await client.send(
    new DescribePoliciesCommand({ AutoScalingGroupName: name })
  );
  const policies = result.ScalingPolicies || [];
  return c.json({ policies, total: policies.length });
});

router.post("/groups/:name/policies", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<{
    policyName: string;
    policyType?: string;
    adjustmentType?: string;
    scalingAdjustment?: number;
    cooldown?: number;
    minAdjustmentMagnitude?: number;
    estimatedInstanceWarmup?: number;
    metricAggregationType?: string;
    targetTrackingConfig?: any;
    stepAdjustments?: any[];
  }>();
  if (!body.policyName) return c.json({ error: "policyName is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new PutScalingPolicyCommand({
      AutoScalingGroupName: name,
      PolicyName: body.policyName,
      PolicyType: body.policyType || "SimpleScaling",
      AdjustmentType: body.adjustmentType,
      ScalingAdjustment: body.scalingAdjustment,
      Cooldown: body.cooldown,
      MinAdjustmentMagnitude: body.minAdjustmentMagnitude,
      EstimatedInstanceWarmup: body.estimatedInstanceWarmup,
      MetricAggregationType: body.metricAggregationType,
      TargetTrackingConfiguration: body.targetTrackingConfig,
      StepAdjustments: body.stepAdjustments,
    })
  );
  return c.json({ policyARN: result.PolicyARN, created: true }, 201);
});

router.delete("/groups/:name/policies/:policyName", async (c: Context) => {
  const name = c.req.param("name");
  const policyName = decodeURIComponent(c.req.param("policyName")!);
  const client = getClient();
  await client.send(
    new DeletePolicyCommand({
      AutoScalingGroupName: name,
      PolicyName: policyName,
    })
  );
  return c.json({ deleted: true });
});

// ── Scaling Activities ───────────────────────────────────

router.get("/groups/:name/activities", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  const result = await client.send(
    new DescribeScalingActivitiesCommand({ AutoScalingGroupName: name })
  );
  const activities = result.Activities || [];
  return c.json({ activities, total: activities.length });
});

// ── Lifecycle Hooks ─────────────────────────────────────

router.get("/groups/:name/lifecycle-hooks", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  const result = await client.send(
    new DescribeLifecycleHooksCommand({ AutoScalingGroupName: name })
  );
  const hooks = result.LifecycleHooks || [];
  return c.json({ lifecycleHooks: hooks, total: hooks.length });
});

router.post("/groups/:name/lifecycle-hooks", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<{
    lifecycleHookName: string;
    lifecycleTransition: string;
    notificationTargetARN?: string;
    roleARN?: string;
    heartbeatTimeout?: number;
    defaultResult?: string;
    notificationMetadata?: string;
  }>();
  if (!body.lifecycleHookName) return c.json({ error: "lifecycleHookName is required" }, 400);
  if (!body.lifecycleTransition) return c.json({ error: "lifecycleTransition is required" }, 400);
  const client = getClient();
  await client.send(
    new PutLifecycleHookCommand({
      AutoScalingGroupName: name,
      LifecycleHookName: body.lifecycleHookName,
      LifecycleTransition: body.lifecycleTransition,
      NotificationTargetARN: body.notificationTargetARN,
      RoleARN: body.roleARN,
      HeartbeatTimeout: body.heartbeatTimeout,
      DefaultResult: body.defaultResult,
      NotificationMetadata: body.notificationMetadata,
    })
  );
  return c.json({ created: true }, 201);
});

router.delete("/groups/:name/lifecycle-hooks/:hookName", async (c: Context) => {
  const name = c.req.param("name");
  const hookName = decodeURIComponent(c.req.param("hookName")!);
  const client = getClient();
  await client.send(
    new DeleteLifecycleHookCommand({
      AutoScalingGroupName: name,
      LifecycleHookName: hookName,
    })
  );
  return c.json({ deleted: true });
});

router.post("/groups/:name/lifecycle-hooks/complete", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<{
    lifecycleHookName: string;
    lifecycleActionResult: string;
    instanceId?: string;
    lifecycleActionToken?: string;
  }>();
  if (!body.lifecycleHookName) return c.json({ error: "lifecycleHookName is required" }, 400);
  if (!body.lifecycleActionResult) return c.json({ error: "lifecycleActionResult is required" }, 400);
  const client = getClient();
  await client.send(
    new CompleteLifecycleActionCommand({
      AutoScalingGroupName: name,
      LifecycleHookName: body.lifecycleHookName,
      LifecycleActionResult: body.lifecycleActionResult,
      InstanceId: body.instanceId,
      LifecycleActionToken: body.lifecycleActionToken,
    })
  );
  return c.json({ completed: true });
});

// ── Instance Refresh ─────────────────────────────────────

router.post("/groups/:name/instance-refresh", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<{ minHealthyPercentage?: number; instanceWarmup?: number; checkpoints?: any[] }>();
  const client = getClient();
  const result = await client.send(
    new StartInstanceRefreshCommand({
      AutoScalingGroupName: name,
      Preferences: body.minHealthyPercentage !== undefined ? {
        MinHealthyPercentage: body.minHealthyPercentage,
        InstanceWarmup: body.instanceWarmup,
        CheckpointPercentages: body.checkpoints,
      } : undefined,
    })
  );
  return c.json({ instanceRefreshId: result.InstanceRefreshId, started: true }, 201);
});

router.get("/groups/:name/instance-refreshes", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  const result = await client.send(
    new DescribeInstanceRefreshesCommand({ AutoScalingGroupName: name })
  );
  const refreshes = (result.InstanceRefreshes || []).map((r) => ({
    instanceRefreshId: r.InstanceRefreshId,
    status: r.Status,
    statusReason: r.StatusReason,
    startTime: r.StartTime?.toISOString(),
    endTime: r.EndTime?.toISOString(),
    percentageComplete: r.PercentageComplete,
    instancesToUpdate: r.InstancesToUpdate,
  }));
  return c.json({ instanceRefreshes: refreshes, total: refreshes.length });
});

// ── Tags ─────────────────────────────────────────────────

router.post("/groups/:name/tags", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<{ tags: { key: string; value: string; propagateAtLaunch?: boolean }[] }>();
  if (!body.tags?.length) return c.json({ error: "tags is required" }, 400);
  const client = getClient();
  await client.send(
    new CreateOrUpdateTagsCommand({
      Tags: body.tags.map((t) => ({
        ResourceId: name,
        ResourceType: "auto-scaling-group",
        Key: t.key,
        Value: t.value,
        PropagateAtLaunch: t.propagateAtLaunch ?? true,
      })),
    })
  );
  return c.json({ updated: true });
});

router.post("/groups/:name/tags/delete", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<{ tagKeys: string[] }>();
  if (!body.tagKeys?.length) return c.json({ error: "tagKeys is required" }, 400);
  const client = getClient();
  await client.send(
    new DeleteTagsCommand({
      Tags: body.tagKeys.map((key) => ({
        ResourceId: name,
        ResourceType: "auto-scaling-group",
        Key: key,
        Value: "",
        PropagateAtLaunch: true,
      })),
    })
  );
  return c.json({ deleted: true });
});

// ── LB Target Groups ─────────────────────────────────────

router.get("/groups/:name/lb-target-groups", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  const result = await client.send(
    new DescribeLoadBalancerTargetGroupsCommand({ AutoScalingGroupName: name })
  );
  const tgs = (result.LoadBalancerTargetGroups || []).map((tg) => ({
    loadBalancerTargetGroupARN: tg.LoadBalancerTargetGroupARN,
    state: tg.State,
  }));
  return c.json({ targetGroups: tgs, total: tgs.length });
});

router.post("/groups/:name/lb-target-groups", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<{ targetGroupARNs: string[] }>();
  if (!body.targetGroupARNs?.length) return c.json({ error: "targetGroupARNs is required" }, 400);
  const client = getClient();
  await client.send(
    new AttachLoadBalancerTargetGroupsCommand({
      AutoScalingGroupName: name,
      TargetGroupARNs: body.targetGroupARNs,
    })
  );
  return c.json({ attached: true });
});

router.post("/groups/:name/lb-target-groups/detach", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<{ targetGroupARNs: string[] }>();
  if (!body.targetGroupARNs?.length) return c.json({ error: "targetGroupARNs is required" }, 400);
  const client = getClient();
  await client.send(
    new DetachLoadBalancerTargetGroupsCommand({
      AutoScalingGroupName: name,
      TargetGroupARNs: body.targetGroupARNs,
    })
  );
  return c.json({ detached: true });
});

// ── Classic Load Balancers ───────────────────────────────

router.get("/groups/:name/load-balancers", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  const result = await client.send(
    new DescribeLoadBalancersCommand({ AutoScalingGroupName: name })
  );
  const lbs = (result.LoadBalancers || []).map((lb) => ({
    loadBalancerName: lb.LoadBalancerName,
    state: lb.State,
  }));
  return c.json({ loadBalancers: lbs, total: lbs.length });
});

router.post("/groups/:name/load-balancers", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<{ loadBalancerNames: string[] }>();
  if (!body.loadBalancerNames?.length) return c.json({ error: "loadBalancerNames is required" }, 400);
  const client = getClient();
  await client.send(
    new AttachLoadBalancersCommand({
      AutoScalingGroupName: name,
      LoadBalancerNames: body.loadBalancerNames,
    })
  );
  return c.json({ attached: true });
});

router.post("/groups/:name/load-balancers/detach", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<{ loadBalancerNames: string[] }>();
  if (!body.loadBalancerNames?.length) return c.json({ error: "loadBalancerNames is required" }, 400);
  const client = getClient();
  await client.send(
    new DetachLoadBalancersCommand({
      AutoScalingGroupName: name,
      LoadBalancerNames: body.loadBalancerNames,
    })
  );
  return c.json({ detached: true });
});

// ── Describe Types ─────────────────────────────────────

router.get("/notification-types", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new DescribeAutoScalingNotificationTypesCommand({}));
  return c.json({ notificationTypes: result.AutoScalingNotificationTypes || [] });
});

router.get("/termination-policy-types", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new DescribeTerminationPolicyTypesCommand({}));
  return c.json({ terminationPolicyTypes: result.TerminationPolicyTypes || [] });
});

router.get("/adjustment-types", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new DescribeAdjustmentTypesCommand({}));
  const types = (result.AdjustmentTypes || []).map((t) => t.AdjustmentType);
  return c.json({ adjustmentTypes: types });
});

router.get("/account-limits", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new DescribeAccountLimitsCommand({}));
  return c.json({
    maxNumberOfAutoScalingGroups: result.MaxNumberOfAutoScalingGroups,
    maxNumberOfLaunchConfigurations: result.MaxNumberOfLaunchConfigurations,
    numberOfAutoScalingGroups: result.NumberOfAutoScalingGroups,
    numberOfLaunchConfigurations: result.NumberOfLaunchConfigurations,
  });
});

router.get("/lifecycle-hook-types", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new DescribeLifecycleHookTypesCommand({}));
  return c.json({ lifecycleHookTypes: result.LifecycleHookTypes || [] });
});

router.get("/metric-collection-types", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new DescribeMetricCollectionTypesCommand({}));
  const metrics = ((result.Metrics || []) as any[]).map((m: any) => ({
    metric: m.Metric,
    granularities: (m.Granularities || []).map((g: any) => g.Granularity),
  }));
  return c.json({ metricCollectionTypes: metrics });
});

export default router;
