import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { ECSClient } from "@aws-sdk/client-ecs";
import {
  ListClustersCommand,
  DescribeClustersCommand,
  CreateClusterCommand,
  DeleteClusterCommand,
  UpdateClusterCommand,
  ListTaskDefinitionsCommand,
  DescribeTaskDefinitionCommand,
  RegisterTaskDefinitionCommand,
  DeregisterTaskDefinitionCommand,
  ListServicesCommand,
  DescribeServicesCommand,
  CreateServiceCommand,
  UpdateServiceCommand,
  DeleteServiceCommand,
  ListTasksCommand,
  DescribeTasksCommand,
  RunTaskCommand,
  StopTaskCommand,
  ListContainerInstancesCommand,
  DescribeContainerInstancesCommand,
  ListTaskDefinitionFamiliesCommand,
  TagResourceCommand,
  UntagResourceCommand,
  ListTagsForResourceCommand,
  ListAccountSettingsCommand,
  PutAccountSettingCommand,
  PutAccountSettingDefaultCommand,
  DeleteAccountSettingCommand,
  ListAttributesCommand,
  PutAttributesCommand,
  DeleteAttributesCommand,
  CreateTaskSetCommand,
  UpdateTaskSetCommand,
  DeleteTaskSetCommand,
  DescribeTaskSetsCommand,
  UpdateServicePrimaryTaskSetCommand,
  ListServiceDeploymentsCommand,
  DescribeServiceDeploymentsCommand,
  DescribeServiceRevisionsCommand,
} from "@aws-sdk/client-ecs";

const router = new Hono();
const getClient = () => create(ECSClient);

// ── Clusters ─────────────────────────────────────────────

router.get("/clusters", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListClustersCommand({}));
  if (!result.clusterArns?.length) return c.json({ clusters: [], total: 0 });
  const detailed = await client.send(
    new DescribeClustersCommand({ clusters: result.clusterArns })
  );
  return c.json({ clusters: detailed.clusters || [], total: detailed.clusters?.length || 0 });
});

router.get("/clusters/:clusterName", async (c: Context) => {
  const client = getClient();
  const clusterName = c.req.param("clusterName");
  const result = await client.send(
    new DescribeClustersCommand({ clusters: [clusterName!] })
  );
  return c.json({ cluster: result.clusters?.[0] || null });
});

router.post("/clusters", async (c: Context) => {
  const body = await c.req.json();
  if (!body.clusterName) return c.json({ error: "clusterName is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CreateClusterCommand({ clusterName: body.clusterName, tags: body.tags })
  );
  return c.json({ cluster: result.cluster }, 201);
});

router.delete("/clusters", async (c: Context) => {
  const cluster = c.req.query("cluster");
  if (!cluster) return c.json({ error: "cluster query parameter required" }, 400);
  const client = getClient();
  await client.send(new DeleteClusterCommand({ cluster }));
  return c.json({ deleted: true });
});

router.put("/clusters/:clusterName", async (c: Context) => {
  const body = await c.req.json();
  const client = getClient();
  const result = await client.send(
    new UpdateClusterCommand({ cluster: c.req.param("clusterName"), settings: body.settings })
  );
  return c.json({ cluster: result.cluster });
});

// ── Task Definitions ─────────────────────────────────────

router.get("/task-definitions", async (c: Context) => {
  const client = getClient();
  const familyPrefix = c.req.query("familyPrefix");
  const result = await client.send(
    new ListTaskDefinitionsCommand({ familyPrefix, status: "ACTIVE" })
  );
  return c.json({
    taskDefinitionArns: result.taskDefinitionArns || [],
    total: result.taskDefinitionArns?.length || 0,
  });
});

router.get("/task-definition-families", async (c: Context) => {
  const client = getClient();
  const prefix = c.req.query("familyPrefix");
  const result = await client.send(
    new ListTaskDefinitionFamiliesCommand({ familyPrefix: prefix, status: "ACTIVE" })
  );
  return c.json({ families: result.families || [] });
});

router.get("/task-definitions/:taskDefinition", async (c: Context) => {
  const client = getClient();
  const taskDefinition = decodeURIComponent(c.req.param("taskDefinition")!);
  const result = await client.send(
    new DescribeTaskDefinitionCommand({ taskDefinition })
  );
  return c.json({
    taskDefinition: result.taskDefinition,
    tags: result.tags || [],
  });
});

router.post("/task-definitions", async (c: Context) => {
  const body = await c.req.json();
  const client = getClient();
  const result = await client.send(
    new RegisterTaskDefinitionCommand({
      family: body.family,
      containerDefinitions: body.containerDefinitions,
      networkMode: body.networkMode,
      cpu: body.cpu,
      memory: body.memory,
      taskRoleArn: body.taskRoleArn,
      executionRoleArn: body.executionRoleArn,
      requiresCompatibilities: body.requiresCompatibilities,
    })
  );
  return c.json({ taskDefinition: result.taskDefinition }, 201);
});

router.delete("/task-definitions/:taskDefinition", async (c: Context) => {
  const taskDefinition = decodeURIComponent(c.req.param("taskDefinition")!);
  const client = getClient();
  await client.send(new DeregisterTaskDefinitionCommand({ taskDefinition }));
  return c.json({ deregistered: true });
});

// ── Services ─────────────────────────────────────────────

router.get("/services", async (c: Context) => {
  const cluster = c.req.query("cluster");
  if (!cluster) return c.json({ error: "cluster query parameter required" }, 400);
  const client = getClient();
  const listResult = await client.send(
    new ListServicesCommand({ cluster })
  );
  if (!listResult.serviceArns?.length) return c.json({ services: [], total: 0 });
  const detailed = await client.send(
    new DescribeServicesCommand({ cluster, services: listResult.serviceArns })
  );
  return c.json({ services: detailed.services || [], total: detailed.services?.length || 0 });
});

router.post("/services", async (c: Context) => {
  const body = await c.req.json();
  const client = getClient();
  const result = await client.send(
    new CreateServiceCommand({
      cluster: body.cluster,
      serviceName: body.serviceName,
      taskDefinition: body.taskDefinition,
      desiredCount: body.desiredCount || 0,
      launchType: body.launchType,
      loadBalancers: body.loadBalancers,
      networkConfiguration: body.networkConfiguration,
    })
  );
  return c.json({ service: result.service }, 201);
});

router.put("/services", async (c: Context) => {
  const cluster = c.req.query("cluster");
  const service = c.req.query("service");
  if (!cluster || !service)
    return c.json({ error: "cluster and service query parameters required" }, 400);
  const body = await c.req.json();
  const client = getClient();
  const result = await client.send(
    new UpdateServiceCommand({
      cluster,
      service,
      taskDefinition: body.taskDefinition,
      desiredCount: body.desiredCount,
    })
  );
  return c.json({ service: result.service });
});

router.delete("/services", async (c: Context) => {
  const cluster = c.req.query("cluster");
  const service = c.req.query("service");
  if (!cluster || !service)
    return c.json({ error: "cluster and service query parameters required" }, 400);
  const force = c.req.query("force") === "true";
  const client = getClient();
  const result = await client.send(
    new DeleteServiceCommand({ cluster, service, force })
  );
  return c.json({ service: result.service });
});

// ── Tasks ────────────────────────────────────────────────

router.get("/tasks", async (c: Context) => {
  const cluster = c.req.query("cluster");
  if (!cluster) return c.json({ error: "cluster query parameter required" }, 400);
  const desiredStatus = (c.req.query("desiredStatus") || "RUNNING") as
    | "RUNNING"
    | "STOPPED"
    | "PENDING";
  const client = getClient();
  const listResult = await client.send(
    new ListTasksCommand({ cluster, desiredStatus })
  );
  if (!listResult.taskArns?.length) return c.json({ tasks: [], total: 0 });
  const detailed = await client.send(
    new DescribeTasksCommand({ cluster, tasks: listResult.taskArns })
  );
  return c.json({ tasks: detailed.tasks || [], total: detailed.tasks?.length || 0 });
});

router.post("/tasks/run", async (c: Context) => {
  const body = await c.req.json();
  if (!body.cluster || !body.taskDefinition) return c.json({ error: "cluster and taskDefinition are required" }, 400);
  const client = getClient();
  const result = await client.send(
    new RunTaskCommand({
      cluster: body.cluster,
      taskDefinition: body.taskDefinition,
      count: body.count || 1,
      launchType: body.launchType,
      group: body.group,
      startedBy: body.startedBy,
    })
  );
  return c.json({ tasks: result.tasks || [] }, 201);
});

router.post("/tasks/stop", async (c: Context) => {
  const body = await c.req.json();
  const client = getClient();
  const result = await client.send(
    new StopTaskCommand({
      cluster: body.cluster,
      task: body.task,
      reason: body.reason,
    })
  );
  return c.json({ task: result.task });
});

// ── Container Instances ──────────────────────────────────

router.get("/container-instances", async (c: Context) => {
  const cluster = c.req.query("cluster");
  if (!cluster) return c.json({ error: "cluster query parameter required" }, 400);
  const client = getClient();
  const listResult = await client.send(
    new ListContainerInstancesCommand({ cluster })
  );
  if (!listResult.containerInstanceArns?.length)
    return c.json({ containerInstances: [], total: 0 });
  const detailed = await client.send(
    new DescribeContainerInstancesCommand({
      cluster,
      containerInstances: listResult.containerInstanceArns,
    })
  );
  return c.json({
    containerInstances: detailed.containerInstances || [],
    total: detailed.containerInstances?.length || 0,
  });
});

// ── Tags ─────────────────────────────────────────────────

router.get("/tags", async (c: Context) => {
  const resourceArn = c.req.query("resourceArn");
  if (!resourceArn) return c.json({ error: "resourceArn query parameter required" }, 400);
  const client = getClient();
  const result = await client.send(
    new ListTagsForResourceCommand({ resourceArn })
  );
  return c.json({ tags: result.tags || [] });
});

router.post("/tags", async (c: Context) => {
  const body = await c.req.json();
  const client = getClient();
  await client.send(
    new TagResourceCommand({ resourceArn: body.resourceArn, tags: body.tags })
  );
  return c.json({ tagged: true });
});

router.delete("/tags", async (c: Context) => {
  const resourceArn = c.req.query("resourceArn");
  const tagKeys = c.req.query("tagKeys")?.split(",") || [];
  if (!resourceArn) return c.json({ error: "resourceArn query parameter required" }, 400);
  const client = getClient();
  await client.send(
    new UntagResourceCommand({ resourceArn, tagKeys })
  );
  return c.json({ untagged: true });
});

// ── Account Settings ─────────────────────────────────────

router.get("/account-settings", async (c: Context) => {
  const client = getClient();
  const name = c.req.query("name");
  const value = c.req.query("value");
  const effectiveSettings = c.req.query("effectiveSettings");
  const result = await client.send(
    new ListAccountSettingsCommand({
      name: name as any,
      value,
      effectiveSettings: effectiveSettings === "true" ? true : undefined,
    })
  );
  return c.json({ settings: result.settings || [], total: result.settings?.length || 0 });
});

router.put("/account-settings", async (c: Context) => {
  const body = await c.req.json();
  if (!body.name || !body.value) {
    return c.json({ error: "name and value are required" }, 400);
  }
  const client = getClient();
  const result = await client.send(
    body.isDefault
      ? new PutAccountSettingDefaultCommand({ name: body.name, value: body.value })
      : new PutAccountSettingCommand({ name: body.name, value: body.value })
  );
  return c.json({ setting: result.setting });
});

router.delete("/account-settings", async (c: Context) => {
  const name = c.req.query("name");
  if (!name) return c.json({ error: "name query parameter required" }, 400);
  const client = getClient();
  const result = await client.send(new DeleteAccountSettingCommand({ name: name as any }));
  return c.json({ setting: result.setting || null, deleted: true });
});

// ── Attributes ───────────────────────────────────────────

router.get("/attributes", async (c: Context) => {
  const targetType = c.req.query("targetType") || "container-instance";
  const cluster = c.req.query("cluster");
  const attributeName = c.req.query("attributeName");
  const attributeValue = c.req.query("attributeValue");
  const client = getClient();
  const result = await client.send(
    new ListAttributesCommand({
      targetType: targetType as any,
      cluster,
      attributeName,
      attributeValue,
    })
  );
  return c.json({ attributes: result.attributes || [], total: result.attributes?.length || 0 });
});

router.post("/attributes", async (c: Context) => {
  const body = await c.req.json();
  if (!body.attributes?.length) {
    return c.json({ error: "attributes array is required" }, 400);
  }
  const client = getClient();
  const result = await client.send(
    new PutAttributesCommand({ cluster: body.cluster, attributes: body.attributes })
  );
  return c.json({ attributes: result.attributes || [] });
});

router.delete("/attributes", async (c: Context) => {
  const body = await c.req.json();
  if (!body.attributes?.length) {
    return c.json({ error: "attributes array is required" }, 400);
  }
  const client = getClient();
  await client.send(
    new DeleteAttributesCommand({ cluster: body.cluster, attributes: body.attributes })
  );
  return c.json({ deleted: true });
});

// ── Task Sets ────────────────────────────────────────────

router.get("/task-sets", async (c: Context) => {
  const cluster = c.req.query("cluster");
  const service = c.req.query("service");
  if (!cluster || !service) {
    return c.json({ error: "cluster and service query parameters required" }, 400);
  }
  const taskSets = c.req.query("taskSets")?.split(",").filter(Boolean);
  const client = getClient();
  const result = await client.send(
    new DescribeTaskSetsCommand({ cluster, service, taskSets })
  );
  return c.json({ taskSets: result.taskSets || [], total: result.taskSets?.length || 0 });
});

router.post("/task-sets", async (c: Context) => {
  const body = await c.req.json();
  if (!body.cluster || !body.service || !body.taskDefinition) {
    return c.json({ error: "cluster, service, and taskDefinition are required" }, 400);
  }
  const client = getClient();
  const result = await client.send(
    new CreateTaskSetCommand({
      cluster: body.cluster,
      service: body.service,
      taskDefinition: body.taskDefinition,
      launchType: body.launchType,
      networkConfiguration: body.networkConfiguration,
      loadBalancers: body.loadBalancers,
      serviceRegistries: body.serviceRegistries,
      scale: body.scale,
      externalId: body.externalId,
    })
  );
  return c.json({ taskSet: result.taskSet }, 201);
});

router.put("/task-sets", async (c: Context) => {
  const body = await c.req.json();
  if (!body.cluster || !body.service || !body.taskSet || !body.scale) {
    return c.json({ error: "cluster, service, taskSet, and scale are required" }, 400);
  }
  const client = getClient();
  const result = await client.send(
    new UpdateTaskSetCommand({
      cluster: body.cluster,
      service: body.service,
      taskSet: body.taskSet,
      scale: body.scale,
    })
  );
  return c.json({ taskSet: result.taskSet });
});

router.put("/task-sets/primary", async (c: Context) => {
  const body = await c.req.json();
  if (!body.cluster || !body.service || !body.primaryTaskSet) {
    return c.json({ error: "cluster, service, and primaryTaskSet are required" }, 400);
  }
  const client = getClient();
  const result = await client.send(
    new UpdateServicePrimaryTaskSetCommand({
      cluster: body.cluster,
      service: body.service,
      primaryTaskSet: body.primaryTaskSet,
    })
  );
  return c.json({ taskSet: result.taskSet });
});

router.delete("/task-sets", async (c: Context) => {
  const cluster = c.req.query("cluster");
  const service = c.req.query("service");
  const taskSet = c.req.query("taskSet");
  if (!cluster || !service || !taskSet) {
    return c.json({ error: "cluster, service, and taskSet query parameters required" }, 400);
  }
  const force = c.req.query("force") === "true";
  const client = getClient();
  const result = await client.send(
    new DeleteTaskSetCommand({ cluster, service, taskSet, force })
  );
  return c.json({ taskSet: result.taskSet || null, deleted: true });
});

// ── Service Deployments ──────────────────────────────────

router.get("/service-deployments", async (c: Context) => {
  const service = c.req.query("service");
  const cluster = c.req.query("cluster");
  if (!service) return c.json({ error: "service query parameter required" }, 400);
  const client = getClient();
  const result = await client.send(
    new ListServiceDeploymentsCommand({ service, cluster })
  );
  return c.json({
    serviceDeployments: result.serviceDeployments || [],
    total: result.serviceDeployments?.length || 0,
  });
});

router.get("/service-deployments/detail", async (c: Context) => {
  const arns = c.req.query("arns")?.split(",").filter(Boolean);
  if (!arns?.length) return c.json({ error: "arns query parameter required" }, 400);
  const client = getClient();
  const result = await client.send(
    new DescribeServiceDeploymentsCommand({ serviceDeploymentArns: arns })
  );
  return c.json({ serviceDeployments: result.serviceDeployments || [] });
});

router.get("/service-revisions", async (c: Context) => {
  const arns = c.req.query("arns")?.split(",").filter(Boolean);
  if (!arns?.length) return c.json({ error: "arns query parameter required" }, 400);
  const client = getClient();
  const result = await client.send(
    new DescribeServiceRevisionsCommand({ serviceRevisionArns: arns })
  );
  return c.json({ serviceRevisions: result.serviceRevisions || [] });
});

export default router;
