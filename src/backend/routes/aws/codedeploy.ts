import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import {
  CodeDeployClient,
  ListApplicationsCommand,
  CreateApplicationCommand,
  GetApplicationCommand,
  UpdateApplicationCommand,
  DeleteApplicationCommand,
  BatchGetApplicationsCommand,
  ListDeploymentGroupsCommand,
  CreateDeploymentGroupCommand,
  GetDeploymentGroupCommand,
  UpdateDeploymentGroupCommand,
  StopDeploymentCommand,
  DeleteDeploymentGroupCommand,
  BatchGetDeploymentGroupsCommand,
  ListDeploymentConfigsCommand,
  CreateDeploymentConfigCommand,
  GetDeploymentConfigCommand,
  DeleteDeploymentConfigCommand,
  CreateDeploymentCommand,
  ListDeploymentsCommand,
  BatchGetDeploymentsCommand,
  GetDeploymentCommand,
  ListTagsForResourceCommand,
  TagResourceCommand,
  UntagResourceCommand,
  RegisterOnPremisesInstanceCommand,
  DeregisterOnPremisesInstanceCommand,
  ListOnPremisesInstancesCommand,
  BatchGetOnPremisesInstancesCommand,
  GetOnPremisesInstanceCommand,
  AddTagsToOnPremisesInstancesCommand,
  RemoveTagsFromOnPremisesInstancesCommand,
  ContinueDeploymentCommand,
  PutLifecycleEventHookExecutionStatusCommand,
  ListDeploymentTargetsCommand,
  BatchGetDeploymentTargetsCommand,
} from "@aws-sdk/client-codedeploy";

const router = new Hono();
const getClient = () => create(CodeDeployClient);

// ─── Applications ───────────────────────────────────────

router.get("/applications", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListApplicationsCommand({}));
  const names = result.applications || [];
  if (!names.length) return c.json({ applications: [], total: 0 });
  const detailed = await client.send(new BatchGetApplicationsCommand({ applicationNames: names }));
  return c.json({
    applications: detailed.applicationsInfo || [],
    total: detailed.applicationsInfo?.length || 0,
  });
});

router.post("/applications", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.applicationName) return c.json({ error: "applicationName is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CreateApplicationCommand({ applicationName: body.applicationName })
  );
  return c.json({ applicationId: result.applicationId, created: true }, 201);
});

router.get("/applications/:name", async (c: Context) => {
  const name = c.req.param("name")!;
  const client = getClient();
  const result = await client.send(new GetApplicationCommand({ applicationName: name }));
  return c.json({ application: result.application || null });
});

router.put("/applications/:name", async (c: Context) => {
  const name = c.req.param("name")!;
  const body = await c.req.json<any>();
  const client = getClient();
  await client.send(
    new UpdateApplicationCommand({
      applicationName: name,
      newApplicationName: body.newApplicationName,
    })
  );
  return c.json({ updated: true });
});

router.delete("/applications/:name", async (c: Context) => {
  const name = c.req.param("name")!;
  const client = getClient();
  await client.send(new DeleteApplicationCommand({ applicationName: name }));
  return c.json({ deleted: true });
});

// ─── Deployment Groups ──────────────────────────────────

router.get("/applications/:name/deployment-groups", async (c: Context) => {
  const name = c.req.param("name")!;
  const client = getClient();
  const listResult = await client.send(new ListDeploymentGroupsCommand({ applicationName: name }));
  const groupNames = listResult.deploymentGroups || [];
  if (!groupNames.length) return c.json({ deploymentGroups: [], total: 0 });
  const detailed = await client.send(
    new BatchGetDeploymentGroupsCommand({ applicationName: name, deploymentGroupNames: groupNames })
  );
  return c.json({
    deploymentGroups: detailed.deploymentGroupsInfo || [],
    total: detailed.deploymentGroupsInfo?.length || 0,
  });
});

router.post("/applications/:name/deployment-groups", async (c: Context) => {
  const appName = c.req.param("name")!;
  const body = await c.req.json<any>();
  if (!body.deploymentGroupName || !body.serviceRoleArn) {
    return c.json({ error: "deploymentGroupName and serviceRoleArn are required" }, 400);
  }
  const client = getClient();
  const result = await client.send(
    new CreateDeploymentGroupCommand({
      applicationName: appName,
      deploymentGroupName: body.deploymentGroupName,
      serviceRoleArn: body.serviceRoleArn,
      deploymentConfigName: body.deploymentConfigName,
    })
  );
  return c.json({ deploymentGroupId: result.deploymentGroupId, created: true }, 201);
});

router.get("/deployment-groups/:groupName", async (c: Context) => {
  const groupName = c.req.param("groupName")!;
  const appName = c.req.query("applicationName");
  if (!appName) return c.json({ error: "applicationName query param is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new GetDeploymentGroupCommand({ applicationName: appName, deploymentGroupName: groupName })
  );
  return c.json({ deploymentGroup: result.deploymentGroupInfo || null });
});

router.delete("/deployment-groups/:groupName", async (c: Context) => {
  const groupName = c.req.param("groupName")!;
  const appName = c.req.query("applicationName");
  if (!appName) return c.json({ error: "applicationName query param is required" }, 400);
  const client = getClient();
  await client.send(
    new DeleteDeploymentGroupCommand({ applicationName: appName, deploymentGroupName: groupName })
  );
  return c.json({ deleted: true });
});

// ─── Deployment Configs ─────────────────────────────────

router.get("/deployment-configs", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListDeploymentConfigsCommand({}));
  return c.json({
    deploymentConfigs: result.deploymentConfigsList || [],
    total: result.deploymentConfigsList?.length || 0,
  });
});

router.post("/deployment-configs", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.deploymentConfigName) return c.json({ error: "deploymentConfigName is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CreateDeploymentConfigCommand({
      deploymentConfigName: body.deploymentConfigName,
      minimumHealthyHosts: body.minimumHealthyHosts,
    })
  );
  return c.json({ deploymentConfigId: result.deploymentConfigId, created: true }, 201);
});

router.get("/deployment-configs/:name", async (c: Context) => {
  const name = c.req.param("name")!;
  const client = getClient();
  const result = await client.send(new GetDeploymentConfigCommand({ deploymentConfigName: name }));
  return c.json({ deploymentConfig: result.deploymentConfigInfo || null });
});

router.delete("/deployment-configs/:name", async (c: Context) => {
  const name = c.req.param("name")!;
  const client = getClient();
  await client.send(new DeleteDeploymentConfigCommand({ deploymentConfigName: name }));
  return c.json({ deleted: true });
});

// ─── Deployments ────────────────────────────────────────

router.post("/applications/:name/deployments", async (c: Context) => {
  const appName = c.req.param("name")!;
  const body = await c.req.json<any>();
  if (!body.deploymentGroupName) return c.json({ error: "deploymentGroupName is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CreateDeploymentCommand({
      applicationName: appName,
      deploymentGroupName: body.deploymentGroupName,
      description: body.description,
      deploymentConfigName: body.deploymentConfigName,
      revision: body.revision,
    })
  );
  return c.json({ deploymentId: result.deploymentId, created: true }, 201);
});

router.get("/applications/:name/deployments", async (c: Context) => {
  const name = c.req.param("name")!;
  const client = getClient();
  const listResult = await client.send(new ListDeploymentsCommand({ applicationName: name }));
  const ids = listResult.deployments || [];
  if (!ids.length) return c.json({ deployments: [], total: 0 });
  const detailed = await client.send(new BatchGetDeploymentsCommand({ deploymentIds: ids }));
  return c.json({
    deployments: detailed.deploymentsInfo || [],
    total: detailed.deploymentsInfo?.length || 0,
  });
});

router.post("/deployments/:id/stop", async (c: Context) => {
  const id = c.req.param("id");
  const client = getClient();
  const result = await client.send(new StopDeploymentCommand({ deploymentId: id }));
  return c.json({ status: result.status });
});

router.put("/deployment-groups/:app/:group", async (c: Context) => {
  const appName = c.req.param("app")!;
  const groupName = c.req.param("group")!;
  const body = await c.req.json<any>();
  const client = getClient();
  await client.send(
    new UpdateDeploymentGroupCommand({
      applicationName: appName,
      currentDeploymentGroupName: groupName,
      newDeploymentGroupName: body.newDeploymentGroupName,
      deploymentConfigName: body.deploymentConfigName,
      serviceRoleArn: body.serviceRoleArn,
    })
  );
  return c.json({ updated: true });
});

router.get("/deployments/:deployId", async (c: Context) => {
  const deployId = c.req.param("deployId")!;
  const client = getClient();
  const result = await client.send(new GetDeploymentCommand({ deploymentId: deployId }));
  return c.json({ deployment: result.deploymentInfo || null });
});

// ─── Tags ───────────────────────────────────────────────

router.get("/tags", async (c: Context) => {
  const resourceArn = c.req.query("resourceArn");
  if (!resourceArn) return c.json({ error: "resourceArn query param is required" }, 400);
  const client = getClient();
  const result = await client.send(new ListTagsForResourceCommand({ ResourceArn: resourceArn }));
  return c.json({ tags: result.Tags || [] });
});

router.post("/tags", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.resourceArn || !body.tags) {
    return c.json({ error: "resourceArn and tags are required" }, 400);
  }
  const client = getClient();
  await client.send(
    new TagResourceCommand({ ResourceArn: body.resourceArn, Tags: body.tags })
  );
  return c.json({ tagged: true });
});

router.post("/tags/untag", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.resourceArn || !body.tagKeys) {
    return c.json({ error: "resourceArn and tagKeys are required" }, 400);
  }
  const client = getClient();
  await client.send(
    new UntagResourceCommand({ ResourceArn: body.resourceArn, TagKeys: body.tagKeys })
  );
  return c.json({ untagged: true });
});

// ─── On-Premises Instances ─────────────────────────────

router.get("/on-prem-instances", async (c: Context) => {
  const registrationStatus = c.req.query("registrationStatus");
  const client = getClient();
  const listResult = await client.send(
    new ListOnPremisesInstancesCommand(
      registrationStatus ? { registrationStatus: registrationStatus as any } : {}
    )
  );
  const names = listResult.instanceNames || [];
  if (!names.length) return c.json({ instances: [], total: 0 });
  const detailed = await client.send(
    new BatchGetOnPremisesInstancesCommand({ instanceNames: names })
  );
  return c.json({ instances: detailed.instanceInfos || [], total: detailed.instanceInfos?.length || 0 });
});

router.post("/on-prem-instances", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.instanceName) return c.json({ error: "instanceName is required" }, 400);
  const client = getClient();
  await client.send(
    new RegisterOnPremisesInstanceCommand({
      instanceName: body.instanceName,
      iamSessionArn: body.iamSessionArn,
      iamUserArn: body.iamUserArn,
    })
  );
  return c.json({ registered: true }, 201);
});

router.get("/on-prem-instances/:name", async (c: Context) => {
  const name = c.req.param("name")!;
  const client = getClient();
  const result = await client.send(
    new GetOnPremisesInstanceCommand({ instanceName: name })
  );
  return c.json({ instance: result.instanceInfo || null });
});

router.delete("/on-prem-instances/:name", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  await client.send(new DeregisterOnPremisesInstanceCommand({ instanceName: name }));
  return c.json({ deregistered: true });
});

router.post("/on-prem-instances/tags", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.instanceNames?.length) return c.json({ error: "instanceNames is required" }, 400);
  if (!body.tags?.length) return c.json({ error: "tags is required" }, 400);
  const client = getClient();
  await client.send(
    new AddTagsToOnPremisesInstancesCommand({ instanceNames: body.instanceNames, tags: body.tags })
  );
  return c.json({ tagged: true });
});

router.post("/on-prem-instances/untag", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.instanceNames?.length) return c.json({ error: "instanceNames is required" }, 400);
  if (!body.tags?.length) return c.json({ error: "tags is required" }, 400);
  const client = getClient();
  await client.send(
    new RemoveTagsFromOnPremisesInstancesCommand({ instanceNames: body.instanceNames, tags: body.tags })
  );
  return c.json({ untagged: true });
});

// ─── Deployment Targets & Lifecycle ─────────────────────

router.post("/deployments/:id/continue", async (c: Context) => {
  const id = c.req.param("id");
  const client = getClient();
  await client.send(new ContinueDeploymentCommand({ deploymentId: id }));
  return c.json({ continued: true });
});

router.post("/deployments/:id/lifecycle-hook-status", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json<any>();
  if (!body.lifecycleEventHookExecutionId)
    return c.json({ error: "lifecycleEventHookExecutionId is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new PutLifecycleEventHookExecutionStatusCommand({
      deploymentId: id,
      lifecycleEventHookExecutionId: body.lifecycleEventHookExecutionId,
      status: body.status,
    })
  );
  return c.json({ lifecycleEventHookExecutionId: result.lifecycleEventHookExecutionId });
});

router.get("/deployments/:id/targets", async (c: Context) => {
  const id = c.req.param("id")!;
  const client = getClient();
  const result = await client.send(
    new ListDeploymentTargetsCommand({ deploymentId: id })
  );
  return c.json({ targetIds: result.targetIds || [] });
});

router.post("/deployments/:id/targets", async (c: Context) => {
  const id = c.req.param("id")!;
  const body = await c.req.json<any>();
  if (!body.targetIds?.length) return c.json({ error: "targetIds is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new BatchGetDeploymentTargetsCommand({ deploymentId: id, targetIds: body.targetIds })
  );
  return c.json({ targets: result.deploymentTargets || [] });
});

export default router;
