import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { readJson } from "../../clients/read-json";
import {
  SageMakerClient,
  CreateModelCommand,
  ListModelsCommand,
  DescribeModelCommand,
  DeleteModelCommand,
  CreateEndpointConfigCommand,
  ListEndpointConfigsCommand,
  DeleteEndpointConfigCommand,
  CreateEndpointCommand,
  ListEndpointsCommand,
  DescribeEndpointCommand,
  UpdateEndpointCommand,
  DeleteEndpointCommand,
  CreateTrainingJobCommand,
  ListTrainingJobsCommand,
  DescribeTrainingJobCommand,
  StopTrainingJobCommand,
  AddTagsCommand,
  ListTagsCommand,
} from "@aws-sdk/client-sagemaker";

const router = new Hono();
const getClient = () => create(SageMakerClient);

// ── Models ───────────────────────────────────────────────

router.post("/models", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.modelName) return c.json({ error: "modelName is required" }, 400);
  if (!body?.primaryContainer && !body?.containers)
    return c.json({ error: "primaryContainer or containers is required" }, 400);
  const result: any = await getClient().send(
    new CreateModelCommand({
      ModelName: body.modelName,
      PrimaryContainer: body.primaryContainer,
      Containers: body.containers,
      ExecutionRoleArn: body.executionRoleArn,
    })
  );
  return c.json({ modelArn: result.ModelArn }, 201);
});

router.get("/models", async (c: Context) => {
  const result: any = await getClient().send(new ListModelsCommand({}));
  return c.json({ models: result.Models || [], total: result.Models?.length || 0 });
});

router.get("/models/:name", async (c: Context) => {
  const name = c.req.param("name")!;
  const result: any = await getClient().send(
    new DescribeModelCommand({ ModelName: name })
  );
  return c.json({ model: result || null });
});

router.delete("/models/:name", async (c: Context) => {
  const name = c.req.param("name")!;
  await getClient().send(new DeleteModelCommand({ ModelName: name }));
  return c.json({ ok: true });
});

// ── Endpoint configs ─────────────────────────────────────

router.post("/endpoint-configs", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.endpointConfigName)
    return c.json({ error: "endpointConfigName is required" }, 400);
  if (!Array.isArray(body?.productionVariants) || body.productionVariants.length === 0)
    return c.json({ error: "productionVariants array with at least one variant is required" }, 400);
  const result: any = await getClient().send(
    new CreateEndpointConfigCommand({
      EndpointConfigName: body.endpointConfigName,
      ProductionVariants: body.productionVariants,
    })
  );
  return c.json({ endpointConfigArn: result.EndpointConfigArn }, 201);
});

router.get("/endpoint-configs", async (c: Context) => {
  const result: any = await getClient().send(new ListEndpointConfigsCommand({}));
  return c.json({
    configs: result.EndpointConfigs || [],
    total: result.EndpointConfigs?.length || 0,
  });
});

router.delete("/endpoint-configs/:name", async (c: Context) => {
  const name = c.req.param("name")!;
  await getClient().send(
    new DeleteEndpointConfigCommand({ EndpointConfigName: name })
  );
  return c.json({ ok: true });
});

// ── Endpoints ────────────────────────────────────────────

router.post("/endpoints", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.endpointName) return c.json({ error: "endpointName is required" }, 400);
  if (!body?.endpointConfigName)
    return c.json({ error: "endpointConfigName is required" }, 400);
  const result: any = await getClient().send(
    new CreateEndpointCommand({
      EndpointName: body.endpointName,
      EndpointConfigName: body.endpointConfigName,
    })
  );
  return c.json({ endpointArn: result.EndpointArn }, 201);
});

router.get("/endpoints", async (c: Context) => {
  const result: any = await getClient().send(new ListEndpointsCommand({}));
  return c.json({ endpoints: result.Endpoints || [], total: result.Endpoints?.length || 0 });
});

router.get("/endpoints/:name", async (c: Context) => {
  const name = c.req.param("name")!;
  const result: any = await getClient().send(
    new DescribeEndpointCommand({ EndpointName: name })
  );
  return c.json({ endpoint: result || null });
});

router.put("/endpoints/:name", async (c: Context) => {
  const name = c.req.param("name")!;
  const body: any = await readJson(c);
  if (!body?.endpointConfigName)
    return c.json({ error: "endpointConfigName is required" }, 400);
  const result: any = await getClient().send(
    new UpdateEndpointCommand({
      EndpointName: name,
      EndpointConfigName: body.endpointConfigName,
    })
  );
  return c.json({ endpointArn: result.EndpointArn });
});

router.delete("/endpoints/:name", async (c: Context) => {
  const name = c.req.param("name")!;
  await getClient().send(new DeleteEndpointCommand({ EndpointName: name }));
  return c.json({ ok: true });
});

// ── Training jobs ────────────────────────────────────────

router.post("/training-jobs", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.trainingJobName) return c.json({ error: "trainingJobName is required" }, 400);
  if (!body?.algorithmSpecification?.TrainingImage)
    return c.json({ error: "algorithmSpecification.TrainingImage is required" }, 400);
  if (!Array.isArray(body?.inputDataConfig) || body.inputDataConfig.length === 0)
    return c.json({ error: "inputDataConfig array with at least one channel is required" }, 400);
  const result: any = await getClient().send(
    new CreateTrainingJobCommand({
      TrainingJobName: body.trainingJobName,
      AlgorithmSpecification: body.algorithmSpecification,
      InputDataConfig: body.inputDataConfig,
      OutputDataConfig: body.outputDataConfig,
      ResourceConfig: body.resourceConfig,
      StoppingCondition: body.stoppingCondition,
      RoleArn: body.roleArn,
    })
  );
  return c.json({ trainingJobArn: result.TrainingJobArn }, 201);
});

router.get("/training-jobs", async (c: Context) => {
  const result: any = await getClient().send(new ListTrainingJobsCommand({}));
  return c.json({
    jobs: result.TrainingJobSummaries || [],
    total: result.TrainingJobSummaries?.length || 0,
  });
});

router.get("/training-jobs/:name", async (c: Context) => {
  const name = c.req.param("name")!;
  const result: any = await getClient().send(
    new DescribeTrainingJobCommand({ TrainingJobName: name })
  );
  return c.json({ job: result || null });
});

router.post("/training-jobs/:name/stop", async (c: Context) => {
  const name = c.req.param("name")!;
  await getClient().send(new StopTrainingJobCommand({ TrainingJobName: name }));
  return c.json({ ok: true });
});

// ── Tags ─────────────────────────────────────────────────

router.get("/resources/tags", async (c: Context) => {
  const arn = c.req.query("arn");
  if (!arn) return c.json({ error: "arn query parameter is required" }, 400);
  const result: any = await getClient().send(
    new ListTagsCommand({ ResourceArn: arn })
  );
  return c.json({ tags: result.Tags || [] });
});

router.post("/resources/tags", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.resourceArn) return c.json({ error: "resourceArn is required" }, 400);
  if (!Array.isArray(body?.tags) || body.tags.length === 0)
    return c.json({ error: "tags array with at least one tag is required" }, 400);
  await getClient().send(
    new AddTagsCommand({ ResourceArn: body.resourceArn, Tags: body.tags })
  );
  return c.json({ ok: true });
});

export default router;
