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

export default router;
