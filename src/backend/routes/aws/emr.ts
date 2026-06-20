import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { EMRClient } from "@aws-sdk/client-emr";
import {
  RunJobFlowCommand,
  DescribeClusterCommand,
  ListClustersCommand,
  TerminateJobFlowsCommand,
  SetTerminationProtectionCommand,
  ModifyClusterCommand,
  AddJobFlowStepsCommand,
  DescribeStepCommand,
  ListStepsCommand,
  CancelStepsCommand,
  AddInstanceGroupsCommand,
  ListInstanceGroupsCommand,
  AddInstanceFleetCommand,
  ListInstanceFleetsCommand,
  ListInstancesCommand,
  CreateSecurityConfigurationCommand,
  DescribeSecurityConfigurationCommand,
  DeleteSecurityConfigurationCommand,
  ListSecurityConfigurationsCommand,
  AddTagsCommand,
  RemoveTagsCommand,
} from "@aws-sdk/client-emr";

const router = new Hono();
const getClient = () => create(EMRClient);

router.get("/clusters", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListClustersCommand({}));
  return c.json({ clusters: result.Clusters || [], total: result.Clusters?.length || 0 });
});

router.post("/clusters", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.Name) return c.json({ error: "Name is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new RunJobFlowCommand({
      Name: body.Name,
      ReleaseLabel: body.ReleaseLabel,
      LogUri: body.LogUri,
      ServiceRole: body.ServiceRole,
      JobFlowRole: body.JobFlowRole,
      Instances: body.Instances,
      Steps: body.Steps,
      BootstrapActions: body.BootstrapActions,
      Applications: body.Applications,
      Configurations: body.Configurations,
      VisibleToAllUsers: body.VisibleToAllUsers,
      Tags: body.Tags,
      SecurityConfiguration: body.SecurityConfiguration,
      AutoScalingRole: body.AutoScalingRole,
      ScaleDownBehavior: body.ScaleDownBehavior,
      CustomAmiId: body.CustomAmiId,
      EbsRootVolumeSize: body.EbsRootVolumeSize,
      StepConcurrencyLevel: body.StepConcurrencyLevel,
    })
  );
  return c.json({ clusterId: result.JobFlowId, clusterArn: result.ClusterArn }, 201);
});

router.get("/clusters/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const client = getClient();
  const result = await client.send(new DescribeClusterCommand({ ClusterId: id }));
  return c.json({ cluster: result.Cluster || null });
});

router.delete("/clusters/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const client = getClient();
  await client.send(new TerminateJobFlowsCommand({ JobFlowIds: [id] }));
  return c.json({ terminated: true });
});

router.post("/clusters/:id/termination-protection", async (c: Context) => {
  const id = c.req.param("id")!;
  const body = await c.req.json<any>();
  const client = getClient();
  await client.send(new SetTerminationProtectionCommand({ JobFlowIds: [id], TerminationProtected: body.TerminationProtected ?? true }));
  return c.json({ updated: true });
});

router.patch("/clusters/:id", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json<any>();
  const client = getClient();
  const result = await client.send(new ModifyClusterCommand({ ClusterId: id, StepConcurrencyLevel: body.StepConcurrencyLevel }));
  return c.json({ stepConcurrencyLevel: result.StepConcurrencyLevel });
});

router.get("/clusters/:id/steps", async (c: Context) => {
  const id = c.req.param("id")!;
  const client = getClient();
  const result = await client.send(new ListStepsCommand({ ClusterId: id }));
  return c.json({ steps: result.Steps || [], total: result.Steps?.length || 0 });
});

router.post("/clusters/:id/steps", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json<any>();
  if (!body.Steps?.length) return c.json({ error: "Steps array is required" }, 400);
  const client = getClient();
  const result = await client.send(new AddJobFlowStepsCommand({ JobFlowId: id, Steps: body.Steps }));
  return c.json({ stepIds: result.StepIds || [] }, 201);
});

router.get("/clusters/:clusterId/steps/:stepId", async (c: Context) => {
  const { clusterId, stepId } = c.req.param();
  const client = getClient();
  const result = await client.send(new DescribeStepCommand({ ClusterId: clusterId!, StepId: stepId! }));
  return c.json({ step: result.Step || null });
});

router.post("/clusters/:id/steps/cancel", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json<any>();
  if (!body.StepIds?.length) return c.json({ error: "StepIds array is required" }, 400);
  const client = getClient();
  const result = await client.send(new CancelStepsCommand({ ClusterId: id!, StepIds: body.StepIds }));
  return c.json({ cancelStepsInfoList: result.CancelStepsInfoList || [] });
});

router.get("/clusters/:id/instance-groups", async (c: Context) => {
  const id = c.req.param("id")!;
  const client = getClient();
  const result = await client.send(new ListInstanceGroupsCommand({ ClusterId: id }));
  return c.json({ instanceGroups: result.InstanceGroups || [], total: result.InstanceGroups?.length || 0 });
});

router.post("/clusters/:id/instance-groups", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json<any>();
  if (!body.InstanceGroups?.length) return c.json({ error: "InstanceGroups array is required" }, 400);
  const client = getClient();
  const result = await client.send(new AddInstanceGroupsCommand({ JobFlowId: id!, InstanceGroups: body.InstanceGroups }));
  return c.json({ instanceGroupIds: result.InstanceGroupIds || [] }, 201);
});

router.get("/clusters/:id/instance-fleets", async (c: Context) => {
  const id = c.req.param("id")!;
  const client = getClient();
  const result = await client.send(new ListInstanceFleetsCommand({ ClusterId: id }));
  return c.json({ instanceFleets: result.InstanceFleets || [], total: result.InstanceFleets?.length || 0 });
});

router.post("/clusters/:id/instance-fleets", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json<any>();
  if (!body.InstanceFleet) return c.json({ error: "InstanceFleet is required" }, 400);
  const client = getClient();
  const result = await client.send(new AddInstanceFleetCommand({ ClusterId: id!, InstanceFleet: body.InstanceFleet }));
  return c.json({ instanceFleetId: result.InstanceFleetId }, 201);
});

router.get("/clusters/:id/instances", async (c: Context) => {
  const id = c.req.param("id")!;
  const client = getClient();
  const result = await client.send(new ListInstancesCommand({ ClusterId: id }));
  return c.json({ instances: result.Instances || [], total: result.Instances?.length || 0 });
});

router.get("/security-configurations", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListSecurityConfigurationsCommand({}));
  return c.json({ securityConfigurations: result.SecurityConfigurations || [], total: result.SecurityConfigurations?.length || 0 });
});

router.post("/security-configurations", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.Name) return c.json({ error: "Name is required" }, 400);
  if (!body.SecurityConfiguration) return c.json({ error: "SecurityConfiguration is required" }, 400);
  const client = getClient();
  const result = await client.send(new CreateSecurityConfigurationCommand({ Name: body.Name, SecurityConfiguration: body.SecurityConfiguration }));
  return c.json({ name: result.Name, creationDateTime: result.CreationDateTime }, 201);
});

router.get("/security-configurations/:name", async (c: Context) => {
  const name = c.req.param("name")!;
  const client = getClient();
  const result = await client.send(new DescribeSecurityConfigurationCommand({ Name: name }));
  return c.json({ securityConfiguration: result || null });
});

router.delete("/security-configurations/:name", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  await client.send(new DeleteSecurityConfigurationCommand({ Name: name }));
  return c.json({ deleted: true });
});

router.post("/clusters/:id/tags", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json<any>();
  if (!body.Tags?.length) return c.json({ error: "Tags array is required" }, 400);
  const client = getClient();
  await client.send(new AddTagsCommand({ ResourceId: id!, Tags: body.Tags }));
  return c.json({ added: true });
});

router.post("/clusters/:id/tags/remove", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json<any>();
  if (!body.TagKeys?.length) return c.json({ error: "TagKeys array is required" }, 400);
  const client = getClient();
  await client.send(new RemoveTagsCommand({ ResourceId: id!, TagKeys: body.TagKeys }));
  return c.json({ removed: true });
});

export default router;
