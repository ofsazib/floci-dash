import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { CodePipelineClient } from "@aws-sdk/client-codepipeline";
import {
  ListPipelinesCommand,
  GetPipelineCommand,
  GetPipelineStateCommand,
  CreatePipelineCommand,
  UpdatePipelineCommand,
  DeletePipelineCommand,
  ListPipelineExecutionsCommand,
  GetPipelineExecutionCommand,
  StartPipelineExecutionCommand,
  StopPipelineExecutionCommand,
  RetryStageExecutionCommand,
  RollbackStageCommand,
  OverrideStageConditionCommand,
  DisableStageTransitionCommand,
  EnableStageTransitionCommand,
  PutApprovalResultCommand,
  ListActionExecutionsCommand,
  ListActionTypesCommand,
  CreateCustomActionTypeCommand,
  GetActionTypeCommand,
  UpdateActionTypeCommand,
  DeleteCustomActionTypeCommand,
  PutActionRevisionCommand,
  ListRuleExecutionsCommand,
  ListWebhooksCommand,
  PutWebhookCommand,
  DeleteWebhookCommand,
  RegisterWebhookWithThirdPartyCommand,
  DeregisterWebhookWithThirdPartyCommand,
  PollForJobsCommand,
  AcknowledgeJobCommand,
  GetJobDetailsCommand,
  PutJobSuccessResultCommand,
  PutJobFailureResultCommand,
  TagResourceCommand,
  UntagResourceCommand,
  ListTagsForResourceCommand,
} from "@aws-sdk/client-codepipeline";

const router = new Hono();
const getClient = () => create(CodePipelineClient);

// ── Pipelines ───────────────────────────────────────────

router.get("/pipelines", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListPipelinesCommand({}));
  return c.json({ pipelines: result.pipelines || [], total: result.pipelines?.length || 0 });
});

router.get("/pipelines/:name", async (c: Context) => {
  const name = decodeURIComponent(c.req.param("name") || "");
  if (!name) return c.json({ error: "name param required" }, 400);
  const client = getClient();
  const result = await client.send(new GetPipelineCommand({ name }));
  return c.json({ pipeline: result.pipeline || null, metadata: result.metadata || null });
});

router.get("/pipelines/:name/state", async (c: Context) => {
  const name = decodeURIComponent(c.req.param("name") || "");
  if (!name) return c.json({ error: "name param required" }, 400);
  const client = getClient();
  const result = await client.send(new GetPipelineStateCommand({ name }));
  return c.json({ state: result });
});

router.post("/pipelines", async (c: Context) => {
  const body = await c.req.json();
  if (!body.pipeline) return c.json({ error: "pipeline declaration is required" }, 400);
  const client = getClient();
  const result = await client.send(new CreatePipelineCommand({
    pipeline: body.pipeline,
    tags: body.tags,
  }));
  return c.json({ pipeline: result.pipeline }, 201);
});

router.put("/pipelines/:name", async (c: Context) => {
  const name = decodeURIComponent(c.req.param("name") || "");
  const body = await c.req.json();
  if (!body.pipeline) return c.json({ error: "pipeline declaration is required" }, 400);
  body.pipeline.name = name;
  const client = getClient();
  const result = await client.send(new UpdatePipelineCommand({ pipeline: body.pipeline }));
  return c.json({ pipeline: result.pipeline });
});

router.delete("/pipelines/:name", async (c: Context) => {
  const name = decodeURIComponent(c.req.param("name") || "");
  const client = getClient();
  await client.send(new DeletePipelineCommand({ name }));
  return c.json({ deleted: true });
});

// ── Executions ──────────────────────────────────────────

router.get("/pipelines/:name/executions", async (c: Context) => {
  const pipelineName = decodeURIComponent(c.req.param("name") || "");
  if (!pipelineName) return c.json({ error: "name param required" }, 400);
  const client = getClient();
  const result = await client.send(new ListPipelineExecutionsCommand({
    pipelineName,
    maxResults: Number(c.req.query("maxResults")) || 50,
    nextToken: c.req.query("nextToken"),
  }));
  return c.json({
    executions: result.pipelineExecutionSummaries || [],
    total: result.pipelineExecutionSummaries?.length || 0,
    nextToken: result.nextToken,
  });
});

router.get("/pipelines/:name/executions/:executionId", async (c: Context) => {
  const pipelineName = decodeURIComponent(c.req.param("name") || "");
  const pipelineExecutionId = decodeURIComponent(c.req.param("executionId") || "");
  if (!pipelineName || !pipelineExecutionId)
    return c.json({ error: "name and executionId are required" }, 400);
  const client = getClient();
  const result = await client.send(new GetPipelineExecutionCommand({
    pipelineName,
    pipelineExecutionId,
  }));
  return c.json({ execution: result.pipelineExecution || null });
});

router.post("/pipelines/:name/executions", async (c: Context) => {
  const pipelineName = decodeURIComponent(c.req.param("name") || "");
  if (!pipelineName) return c.json({ error: "name param required" }, 400);
  const body = await c.req.json();
  const client = getClient();
  const result = await client.send(new StartPipelineExecutionCommand({
    name: pipelineName,
    clientRequestToken: body.clientRequestToken,
    sourceRevisions: body.sourceRevisions,
    variables: body.variables,
  }));
  return c.json({ pipelineExecutionId: result.pipelineExecutionId }, 201);
});

router.post("/pipelines/:name/executions/:executionId/stop", async (c: Context) => {
  const pipelineName = decodeURIComponent(c.req.param("name") || "");
  const pipelineExecutionId = decodeURIComponent(c.req.param("executionId") || "");
  const body = await c.req.json();
  if (!pipelineName || !pipelineExecutionId)
    return c.json({ error: "name and executionId are required" }, 400);
  const client = getClient();
  const result = await client.send(new StopPipelineExecutionCommand({
    pipelineName,
    pipelineExecutionId,
    abandon: body.abandon,
    reason: body.reason,
  }));
  return c.json({ pipelineExecutionId: result.pipelineExecutionId });
});

router.post("/pipelines/:name/executions/:executionId/retry", async (c: Context) => {
  const pipelineName = decodeURIComponent(c.req.param("name") || "");
  const pipelineExecutionId = decodeURIComponent(c.req.param("executionId") || "");
  const body = await c.req.json();
  if (!pipelineName || !pipelineExecutionId)
    return c.json({ error: "name and executionId are required" }, 400);
  if (!body.stageName)
    return c.json({ error: "stageName is required in request body" }, 400);
  const client = getClient();
  const result = await client.send(new RetryStageExecutionCommand({
    pipelineName,
    stageName: body.stageName,
    pipelineExecutionId,
    retryMode: body.retryMode || "FAILED_ACTIONS",
  }));
  return c.json({ pipelineExecutionId: result.pipelineExecutionId });
});

// ── Rollback Stage ──────────────────────────────────────

router.post("/pipelines/:name/executions/:executionId/rollback", async (c: Context) => {
  const pipelineName = decodeURIComponent(c.req.param("name") || "");
  const pipelineExecutionId = decodeURIComponent(c.req.param("executionId") || "");
  const body = await c.req.json();
  if (!pipelineName || !pipelineExecutionId)
    return c.json({ error: "name and executionId are required" }, 400);
  if (!body.stageName)
    return c.json({ error: "stageName is required" }, 400);
  const client = getClient();
  const result = await client.send(new RollbackStageCommand({
    pipelineName,
    stageName: body.stageName,
    targetPipelineExecutionId: pipelineExecutionId,
    ...(body.sourceRevision && { sourceRevision: body.sourceRevision }),
  }));
  return c.json({ pipelineExecutionId: result.pipelineExecutionId });
});

// ── Override Stage Condition ────────────────────────────

router.post("/pipelines/:name/executions/:executionId/override", async (c: Context) => {
  const pipelineName = decodeURIComponent(c.req.param("name") || "");
  const pipelineExecutionId = decodeURIComponent(c.req.param("executionId") || "");
  const body = await c.req.json();
  if (!pipelineName || !pipelineExecutionId)
    return c.json({ error: "name and executionId are required" }, 400);
  if (!body.stageName)
    return c.json({ error: "stageName is required" }, 400);
  if (!body.conditionName)
    return c.json({ error: "conditionName is required" }, 400);
  const client = getClient();
  await client.send(new OverrideStageConditionCommand({
    pipelineName,
    stageName: body.stageName,
    pipelineExecutionId,
    conditionType: body.conditionType || "SUCCESS",
  }));
  return c.json({ overridden: true });
});

// ── Stage Transitions ──────────────────────────────────

router.post("/pipelines/:name/transitions/:stageName/disable", async (c: Context) => {
  const pipelineName = decodeURIComponent(c.req.param("name") || "");
  const stageName = decodeURIComponent(c.req.param("stageName") || "");
  const body = await c.req.json();
  if (!pipelineName || !stageName)
    return c.json({ error: "name and stageName are required" }, 400);
  const client = getClient();
  await client.send(new DisableStageTransitionCommand({
    pipelineName,
    stageName,
    transitionType: body.transitionType || "Inbound",
    reason: body.reason || "Disabled from dashboard",
  }));
  return c.json({ disabled: true });
});

router.post("/pipelines/:name/transitions/:stageName/enable", async (c: Context) => {
  const pipelineName = decodeURIComponent(c.req.param("name") || "");
  const stageName = decodeURIComponent(c.req.param("stageName") || "");
  if (!pipelineName || !stageName)
    return c.json({ error: "name and stageName are required" }, 400);
  const client = getClient();
  await client.send(new EnableStageTransitionCommand({
    pipelineName,
    stageName,
    transitionType: "Inbound",
  }));
  return c.json({ enabled: true });
});

// ── Approvals ───────────────────────────────────────────

router.post("/pipelines/:name/approvals", async (c: Context) => {
  const pipelineName = decodeURIComponent(c.req.param("name") || "");
  const body = await c.req.json();
  if (!pipelineName || !body.stageName || !body.actionName || !body.token || !body.status)
    return c.json({ error: "pipelineName, stageName, actionName, token, and status are required" }, 400);
  const client = getClient();
  const result = await client.send(new PutApprovalResultCommand({
    pipelineName,
    stageName: body.stageName,
    actionName: body.actionName,
    token: body.token,
    result: { status: body.status, summary: body.summary },
  }));
  return c.json({ approvedAt: result.approvedAt });
});

// ── Action Executions ───────────────────────────────────

router.get("/pipelines/:name/actions", async (c: Context) => {
  const pipelineName = decodeURIComponent(c.req.param("name") || "");
  if (!pipelineName) return c.json({ error: "name param required" }, 400);
  const client = getClient();
  const result = await client.send(new ListActionExecutionsCommand({
    pipelineName,
    filter: { pipelineExecutionId: c.req.query("executionId") },
    maxResults: Number(c.req.query("maxResults")) || 100,
    nextToken: c.req.query("nextToken"),
  }));
  return c.json({
    actions: result.actionExecutionDetails || [],
    total: result.actionExecutionDetails?.length || 0,
    nextToken: result.nextToken,
  });
});

// ── Action Revisions ────────────────────────────────────

router.put("/pipelines/:name/actions/revision", async (c: Context) => {
  const pipelineName = decodeURIComponent(c.req.param("name") || "");
  const body = await c.req.json();
  if (!pipelineName) return c.json({ error: "name param required" }, 400);
  if (!body.actionName || !body.actionRevision)
    return c.json({ error: "actionName and actionRevision are required" }, 400);
  const client = getClient();
  await client.send(new PutActionRevisionCommand({
    pipelineName,
    actionName: body.actionName,
    actionRevision: body.actionRevision,
  }));
  return c.json({ updated: true });
});

// ── Action Types ────────────────────────────────────────

router.get("/action-types", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListActionTypesCommand({
    actionOwnerFilter: (c.req.query("owner") || undefined) as "AWS" | "ThirdParty" | "Custom" | undefined,
    regionFilter: c.req.query("region"),
  }));
  return c.json({ actionTypes: result.actionTypes || [], total: result.actionTypes?.length || 0 });
});

router.get("/action-types/:owner/:category/:provider/:version", async (c: Context) => {
  const owner = decodeURIComponent(c.req.param("owner") || "");
  const category = decodeURIComponent(c.req.param("category") || "");
  const provider = decodeURIComponent(c.req.param("provider") || "");
  const version = decodeURIComponent(c.req.param("version") || "");
  if (!owner || !category || !provider || !version)
    return c.json({ error: "owner, category, provider, and version are required" }, 400);
  const client = getClient();
  const result = await client.send(new GetActionTypeCommand({
    category: { owner, category, provider, version } as any,
  }));
  return c.json({ actionType: result.actionType || null });
});

router.post("/action-types", async (c: Context) => {
  const body = await c.req.json();
  if (!body.actionType) return c.json({ error: "actionType is required" }, 400);
  const client = getClient();
  const result = await client.send(new CreateCustomActionTypeCommand({
    category: body.actionType.category,
    provider: body.actionType.provider,
    version: body.actionType.version || "1",
    inputArtifactDetails: body.actionType.inputArtifactDetails || { minimumCount: 0, maximumCount: 5 },
    outputArtifactDetails: body.actionType.outputArtifactDetails || { minimumCount: 0, maximumCount: 5 },
    configurationProperties: body.actionType.configurationProperties,
    settings: body.actionType.settings,
  }));
  return c.json({ actionType: result.actionType }, 201);
});

router.put("/action-types/:owner/:category/:provider/:version", async (c: Context) => {
  const owner = decodeURIComponent(c.req.param("owner") || "");
  const category = decodeURIComponent(c.req.param("category") || "");
  const provider = decodeURIComponent(c.req.param("provider") || "");
  const version = decodeURIComponent(c.req.param("version") || "");
  const body = await c.req.json();
  if (!owner || !category || !provider || !version)
    return c.json({ error: "owner, category, provider, and version are required" }, 400);
  const client = getClient();
  await client.send(new UpdateActionTypeCommand({
    actionType: {
      id: { owner, category, provider, version },
      ...body.actionType,
    } as any,
  }));
  return c.json({ updated: true });
});

router.delete("/action-types/:owner/:category/:provider/:version", async (c: Context) => {
  const owner = decodeURIComponent(c.req.param("owner") || "");
  const category = decodeURIComponent(c.req.param("category") || "");
  const provider = decodeURIComponent(c.req.param("provider") || "");
  const version = decodeURIComponent(c.req.param("version") || "");
  if (!owner || !category || !provider || !version)
    return c.json({ error: "owner, category, provider, and version are required" }, 400);
  const client = getClient();
  await client.send(new DeleteCustomActionTypeCommand({
    category: { owner, category, provider, version } as any,
  }));
  return c.json({ deleted: true });
});

// ── Webhooks ────────────────────────────────────────────

router.get("/webhooks", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListWebhooksCommand({
    MaxResults: Number(c.req.query("maxResults")) || 100,
    NextToken: c.req.query("nextToken"),
  }));
  return c.json({
    webhooks: result.webhooks || [],
    total: result.webhooks?.length || 0,
    NextToken: result.NextToken,
  });
});

router.post("/webhooks", async (c: Context) => {
  const body = await c.req.json();
  if (!body.webhook) return c.json({ error: "webhook definition is required" }, 400);
  const client = getClient();
  const result = await client.send(new PutWebhookCommand({
    webhook: body.webhook,
    tags: body.tags,
  }));
  return c.json({ webhook: result.webhook }, 201);
});

router.delete("/webhooks/:name", async (c: Context) => {
  const name = decodeURIComponent(c.req.param("name") || "");
  if (!name) return c.json({ error: "name param required" }, 400);
  const client = getClient();
  await client.send(new DeleteWebhookCommand({ name }));
  return c.json({ deleted: true });
});

router.post("/webhooks/:name/register", async (c: Context) => {
  const name = decodeURIComponent(c.req.param("name") || "");
  if (!name) return c.json({ error: "name param required" }, 400);
  const client = getClient();
  await client.send(new RegisterWebhookWithThirdPartyCommand({ webhookName: name }));
  return c.json({ registered: true });
});

router.post("/webhooks/:name/deregister", async (c: Context) => {
  const name = decodeURIComponent(c.req.param("name") || "");
  if (!name) return c.json({ error: "name param required" }, 400);
  const client = getClient();
  await client.send(new DeregisterWebhookWithThirdPartyCommand({ webhookName: name }));
  return c.json({ deregistered: true });
});

// ── Rule Executions ──────────────────────────────────────

router.get("/pipelines/:name/rules", async (c: Context) => {
  const pipelineName = decodeURIComponent(c.req.param("name") || "");
  if (!pipelineName) return c.json({ error: "name param required" }, 400);
  const client = getClient();
  const result = await client.send(new ListRuleExecutionsCommand({
    pipelineName,
    maxResults: Number(c.req.query("maxResults")) || 50,
    nextToken: c.req.query("nextToken"),
  }));
  return c.json({
    ruleExecutionDetails: result.ruleExecutionDetails || [],
    total: result.ruleExecutionDetails?.length || 0,
    nextToken: result.nextToken,
  });
});

// ── Jobs ─────────────────────────────────────────────────

router.post("/action-types/:category/:provider/jobs/poll", async (c: Context) => {
  const category = decodeURIComponent(c.req.param("category") || "");
  const provider = decodeURIComponent(c.req.param("provider") || "");
  if (!category || !provider)
    return c.json({ error: "category and provider are required" }, 400);
  const client = getClient();
  const result = await client.send(new PollForJobsCommand({
    actionTypeId: { category, owner: "Custom", provider, version: "1" },
    maxBatchSize: Number(c.req.query("maxBatchSize")) || 10,
    queryParam: c.req.query("queryParam") ? JSON.parse(c.req.query("queryParam")!) : undefined,
  }));
  return c.json({ jobs: result.jobs || [], total: result.jobs?.length || 0 });
});

router.post("/jobs/:jobId/acknowledge", async (c: Context) => {
  const jobId = decodeURIComponent(c.req.param("jobId") || "");
  const body = await c.req.json();
  if (!jobId) return c.json({ error: "jobId is required" }, 400);
  const client = getClient();
  const result = await client.send(new AcknowledgeJobCommand({
    jobId,
    nonce: body.nonce,
  }));
  return c.json({ status: result.status });
});

router.get("/jobs/:jobId", async (c: Context) => {
  const jobId = decodeURIComponent(c.req.param("jobId") || "");
  if (!jobId) return c.json({ error: "jobId is required" }, 400);
  const client = getClient();
  const result = await client.send(new GetJobDetailsCommand({ jobId }));
  return c.json({ jobDetails: result.jobDetails || null });
});

router.put("/jobs/:jobId/result", async (c: Context) => {
  const jobId = decodeURIComponent(c.req.param("jobId") || "");
  const body = await c.req.json();
  if (!jobId) return c.json({ error: "jobId is required" }, 400);
  if (!body.status) return c.json({ error: "status (Success/Failure) is required" }, 400);
  const client = getClient();
  if (body.status === "Success") {
    const result = await client.send(new PutJobSuccessResultCommand({
      jobId,
      currentRevision: body.currentRevision,
      continuationToken: body.continuationToken,
      executionDetails: body.executionDetails,
    }));
    return c.json({ result: "success" });
  } else {
    await client.send(new PutJobFailureResultCommand({
      jobId,
      failureDetails: {
        type: body.failureType || "JobFailed",
        message: body.message || "Job failed",
        externalExecutionId: body.externalExecutionId,
      },
    }));
    return c.json({ result: "failure" });
  }
});

// ── Tags ─────────────────────────────────────────────────

router.post("/tags", async (c: Context) => {
  const body = await c.req.json();
  if (!body.resourceArn || !body.tags)
    return c.json({ error: "resourceArn and tags are required" }, 400);
  const client = getClient();
  await client.send(new TagResourceCommand({ resourceArn: body.resourceArn, tags: body.tags }));
  return c.json({ tagged: true });
});

router.delete("/tags", async (c: Context) => {
  const resourceArn = c.req.query("resourceArn");
  const tagKeys = c.req.query("tagKeys")?.split(",");
  if (!resourceArn || !tagKeys?.length)
    return c.json({ error: "resourceArn and tagKeys are required" }, 400);
  const client = getClient();
  await client.send(new UntagResourceCommand({ resourceArn, tagKeys }));
  return c.json({ untagged: true });
});

router.get("/tags", async (c: Context) => {
  const resourceArn = c.req.query("resourceArn");
  if (!resourceArn) return c.json({ error: "resourceArn query required" }, 400);
  const client = getClient();
  const result = await client.send(new ListTagsForResourceCommand({ resourceArn }));
  return c.json({ tags: result.tags || [] });
});

export default router;
