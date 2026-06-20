import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { BatchClient } from "@aws-sdk/client-batch";
import {
  CreateComputeEnvironmentCommand,
  DescribeComputeEnvironmentsCommand,
  DeleteComputeEnvironmentCommand,
  CreateJobQueueCommand,
  DescribeJobQueuesCommand,
  DeleteJobQueueCommand,
  RegisterJobDefinitionCommand,
  DeregisterJobDefinitionCommand,
  DescribeJobDefinitionsCommand,
  SubmitJobCommand,
  DescribeJobsCommand,
  ListJobsCommand,
  TerminateJobCommand,
} from "@aws-sdk/client-batch";

const router = new Hono();
const getClient = () => create(BatchClient);

router.get("/compute-environments", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new DescribeComputeEnvironmentsCommand({}));
  return c.json({ computeEnvironments: result.computeEnvironments || [], total: result.computeEnvironments?.length || 0 });
});

router.post("/compute-environments", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.computeEnvironmentName) return c.json({ error: "computeEnvironmentName is required" }, 400);
  if (!body.type) return c.json({ error: "type is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CreateComputeEnvironmentCommand({
      computeEnvironmentName: body.computeEnvironmentName,
      type: body.type,
      state: body.state,
      computeResources: body.computeResources,
      serviceRole: body.serviceRole,
      tags: body.tags,
    })
  );
  return c.json({ computeEnvironmentName: result.computeEnvironmentName, computeEnvironmentArn: result.computeEnvironmentArn }, 201);
});

router.get("/compute-environments/:name", async (c: Context) => {
  const name = c.req.param("name")!;
  const client = getClient();
  const result = await client.send(new DescribeComputeEnvironmentsCommand({ computeEnvironments: [name] }));
  return c.json({ computeEnvironment: result.computeEnvironments?.[0] || null });
});

router.delete("/compute-environments/:name", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  await client.send(new DeleteComputeEnvironmentCommand({ computeEnvironment: name }));
  return c.json({ deleted: true });
});

router.get("/job-queues", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new DescribeJobQueuesCommand({}));
  return c.json({ jobQueues: result.jobQueues || [], total: result.jobQueues?.length || 0 });
});

router.post("/job-queues", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.jobQueueName) return c.json({ error: "jobQueueName is required" }, 400);
  if (body.priority === undefined || body.priority === null) return c.json({ error: "priority is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CreateJobQueueCommand({
      jobQueueName: body.jobQueueName,
      priority: body.priority,
      computeEnvironmentOrder: body.computeEnvironmentOrder,
      state: body.state,
      tags: body.tags,
    })
  );
  return c.json({ jobQueueName: result.jobQueueName, jobQueueArn: result.jobQueueArn }, 201);
});

router.get("/job-queues/:name", async (c: Context) => {
  const name = c.req.param("name")!;
  const client = getClient();
  const result = await client.send(new DescribeJobQueuesCommand({ jobQueues: [name] }));
  return c.json({ jobQueue: result.jobQueues?.[0] || null });
});

router.delete("/job-queues/:name", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  await client.send(new DeleteJobQueueCommand({ jobQueue: name }));
  return c.json({ deleted: true });
});

router.get("/job-definitions", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new DescribeJobDefinitionsCommand({}));
  return c.json({ jobDefinitions: result.jobDefinitions || [], total: result.jobDefinitions?.length || 0 });
});

router.post("/job-definitions", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.jobDefinitionName) return c.json({ error: "jobDefinitionName is required" }, 400);
  if (!body.type) return c.json({ error: "type is required" }, 400);
  if (!body.containerProperties) return c.json({ error: "containerProperties is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new RegisterJobDefinitionCommand({
      jobDefinitionName: body.jobDefinitionName,
      type: body.type,
      containerProperties: body.containerProperties,
      parameters: body.parameters,
      retryStrategy: body.retryStrategy,
      timeout: body.timeout,
      platformCapabilities: body.platformCapabilities,
      tags: body.tags,
    })
  );
  return c.json({ jobDefinitionName: result.jobDefinitionName, jobDefinitionArn: result.jobDefinitionArn, revision: result.revision }, 201);
});

router.get("/job-definitions/:name", async (c: Context) => {
  const name = c.req.param("name")!;
  const client = getClient();
  const result = await client.send(new DescribeJobDefinitionsCommand({ jobDefinitions: [name] }));
  return c.json({ jobDefinition: result.jobDefinitions?.[0] || null });
});

router.delete("/job-definitions/:name", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  await client.send(new DeregisterJobDefinitionCommand({ jobDefinition: name }));
  return c.json({ deleted: true });
});

router.post("/jobs", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.jobName) return c.json({ error: "jobName is required" }, 400);
  if (!body.jobQueue) return c.json({ error: "jobQueue is required" }, 400);
  if (!body.jobDefinition) return c.json({ error: "jobDefinition is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new SubmitJobCommand({
      jobName: body.jobName,
      jobQueue: body.jobQueue,
      jobDefinition: body.jobDefinition,
      containerOverrides: body.containerOverrides,
      parameters: body.parameters,
      retryStrategy: body.retryStrategy,
      timeout: body.timeout,
      tags: body.tags,
    })
  );
  return c.json({ jobId: result.jobId, jobArn: result.jobArn, jobName: result.jobName }, 201);
});

router.get("/jobs", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListJobsCommand({ jobQueue: "", jobStatus: "RUNNING" }));
  return c.json({ jobs: result.jobSummaryList || [], total: result.jobSummaryList?.length || 0 });
});

router.get("/jobs/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const client = getClient();
  const result = await client.send(new DescribeJobsCommand({ jobs: [id] }));
  return c.json({ job: result.jobs?.[0] || null });
});

router.post("/jobs/:id/terminate", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json<any>();
  const reason = body.reason || "Terminated by user";
  const client = getClient();
  await client.send(new TerminateJobCommand({ jobId: id, reason }));
  return c.json({ terminated: true });
});

export default router;
