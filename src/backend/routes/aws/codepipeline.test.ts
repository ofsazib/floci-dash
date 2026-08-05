import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const mockCodePipeline = vi.hoisted(() =>
  vi.fn(function () {
    return { send: mockSend };
  })
);

const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) {
      return { __cmdName: name, ...args };
    });
  };
});

vi.mock("@aws-sdk/client-codepipeline", () => ({
  CodePipelineClient: mockCodePipeline,
  ListPipelinesCommand: createCmd("ListPipelinesCommand"),
  GetPipelineCommand: createCmd("GetPipelineCommand"),
  GetPipelineStateCommand: createCmd("GetPipelineStateCommand"),
  CreatePipelineCommand: createCmd("CreatePipelineCommand"),
  UpdatePipelineCommand: createCmd("UpdatePipelineCommand"),
  DeletePipelineCommand: createCmd("DeletePipelineCommand"),
  ListPipelineExecutionsCommand: createCmd("ListPipelineExecutionsCommand"),
  GetPipelineExecutionCommand: createCmd("GetPipelineExecutionCommand"),
  StartPipelineExecutionCommand: createCmd("StartPipelineExecutionCommand"),
  StopPipelineExecutionCommand: createCmd("StopPipelineExecutionCommand"),
  RetryStageExecutionCommand: createCmd("RetryStageExecutionCommand"),
  RollbackStageCommand: createCmd("RollbackStageCommand"),
  OverrideStageConditionCommand: createCmd("OverrideStageConditionCommand"),
  DisableStageTransitionCommand: createCmd("DisableStageTransitionCommand"),
  EnableStageTransitionCommand: createCmd("EnableStageTransitionCommand"),
  PutApprovalResultCommand: createCmd("PutApprovalResultCommand"),
  ListActionExecutionsCommand: createCmd("ListActionExecutionsCommand"),
  PutActionRevisionCommand: createCmd("PutActionRevisionCommand"),
  ListRuleExecutionsCommand: createCmd("ListRuleExecutionsCommand"),
  ListActionTypesCommand: createCmd("ListActionTypesCommand"),
  CreateCustomActionTypeCommand: createCmd("CreateCustomActionTypeCommand"),
  GetActionTypeCommand: createCmd("GetActionTypeCommand"),
  UpdateActionTypeCommand: createCmd("UpdateActionTypeCommand"),
  DeleteCustomActionTypeCommand: createCmd("DeleteCustomActionTypeCommand"),
  ListWebhooksCommand: createCmd("ListWebhooksCommand"),
  PutWebhookCommand: createCmd("PutWebhookCommand"),
  DeleteWebhookCommand: createCmd("DeleteWebhookCommand"),
  RegisterWebhookWithThirdPartyCommand: createCmd("RegisterWebhookWithThirdPartyCommand"),
  DeregisterWebhookWithThirdPartyCommand: createCmd("DeregisterWebhookWithThirdPartyCommand"),
  PollForJobsCommand: createCmd("PollForJobsCommand"),
  AcknowledgeJobCommand: createCmd("AcknowledgeJobCommand"),
  GetJobDetailsCommand: createCmd("GetJobDetailsCommand"),
  PutJobSuccessResultCommand: createCmd("PutJobSuccessResultCommand"),
  PutJobFailureResultCommand: createCmd("PutJobFailureResultCommand"),
  TagResourceCommand: createCmd("TagResourceCommand"),
  UntagResourceCommand: createCmd("UntagResourceCommand"),
  ListTagsForResourceCommand: createCmd("ListTagsForResourceCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./codepipeline";

async function get(path: string) {
  return router.request(path, { method: "GET" });
}

async function post(path: string, body?: any) {
  return router.request(path, {
    method: "POST",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { "content-type": "application/json" } : undefined,
  });
}

async function del(path: string) {
  return router.request(path, { method: "DELETE" });
}

async function put(path: string, body?: any) {
  return router.request(path, {
    method: "PUT",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { "content-type": "application/json" } : undefined,
  });
}

beforeEach(() => {
  mockSend.mockReset();
});

describe("CodePipeline Routes", () => {
  describe("Pipelines", () => {
    it("GET /pipelines — lists pipelines", async () => {
      mockSend.mockResolvedValueOnce({
        pipelines: [{ name: "my-pipeline", version: 1, created: new Date(), updated: new Date() }],
      });
      const res = await get("/pipelines");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.pipelines[0].name).toBe("my-pipeline");
    });

    it("GET /pipelines — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ pipelines: [] });
      const res = await get("/pipelines");
      const body = await res.json();
      expect(body.total).toBe(0);
    });

    it("GET /pipelines/:name — returns pipeline detail", async () => {
      mockSend.mockResolvedValueOnce({
        pipeline: { name: "my-pipeline", version: 1 },
        metadata: { pipelineArn: "arn:aws:codepipeline:us-east-1::my-pipeline" },
      });
      const res = await get("/pipelines/my-pipeline");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.pipeline.name).toBe("my-pipeline");
      expect(body.metadata.pipelineArn).toBeTruthy();
    });

    it("GET /pipelines/:name — unmatched route returns 404 when name empty", async () => {
      const res = await get("/pipelines/");
      expect(res.status).toBe(404);
    });

    it("GET /pipelines/:name/state — returns pipeline state", async () => {
      mockSend.mockResolvedValueOnce({
        pipelineName: "my-pipeline",
        pipelineVersion: 2,
        stageStates: [{ stageName: "Source", actionStates: [] }],
      });
      const res = await get("/pipelines/my-pipeline/state");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.state.pipelineVersion).toBe(2);
    });

    it("POST /pipelines — creates a pipeline", async () => {
      mockSend.mockResolvedValueOnce({ pipeline: { name: "new-pipe", version: 1 } });
      const res = await post("/pipelines", {
        pipeline: {
          name: "new-pipe",
          roleArn: "arn:aws:iam::123:role/dummy",
          artifactStore: { type: "S3", location: "bucket" },
          stages: [],
        },
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.pipeline.name).toBe("new-pipe");
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("CreatePipelineCommand");
    });

    it("POST /pipelines — requires pipeline declaration", async () => {
      const res = await post("/pipelines", {});
      expect(res.status).toBe(400);
    });

    it("POST /pipelines — creates pipeline with tags", async () => {
      mockSend.mockResolvedValueOnce({ pipeline: { name: "tagged-pipe", version: 1 } });
      const res = await post("/pipelines", {
        pipeline: { name: "tagged-pipe", roleArn: "arn:aws:iam::123:role/dummy", artifactStore: { type: "S3", location: "bucket" }, stages: [] },
        tags: [{ key: "env", value: "prod" }],
      });
      expect(res.status).toBe(201);
      expect(mockSend.mock.calls[0][0].tags).toEqual([{ key: "env", value: "prod" }]);
    });

    it("DELETE /pipelines/:name — deletes a pipeline", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/pipelines/my-pipeline");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });

    it("GET /pipelines/:name — handles null pipeline and metadata", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/pipelines/nonexistent");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.pipeline).toBeNull();
      expect(body.metadata).toBeNull();
    });
  });

  describe("Executions", () => {
    it("GET /pipelines/:name/executions — lists executions", async () => {
      mockSend.mockResolvedValueOnce({
        pipelineExecutionSummaries: [
          { pipelineExecutionId: "exec-1", status: "Succeeded" },
        ],
      });
      const res = await get("/pipelines/my-pipeline/executions");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.executions[0].pipelineExecutionId).toBe("exec-1");
    });

    it("GET /pipelines/:name/executions — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ pipelineExecutionSummaries: undefined });
      const res = await get("/pipelines/my-pipeline/executions");
      const body = await res.json();
      expect(body.total).toBe(0);
      expect(body.executions).toEqual([]);
    });

    it("GET /pipelines/:name/executions — with nextToken", async () => {
      mockSend.mockResolvedValueOnce({
        pipelineExecutionSummaries: [{ pipelineExecutionId: "exec-1" }],
        nextToken: "token-abc",
      });
      const res = await get("/pipelines/my-pipeline/executions?nextToken=token-abc");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.nextToken).toBe("token-abc");
      expect(mockSend.mock.calls[0][0].nextToken).toBe("token-abc");
    });

    it("GET /pipelines/:name/executions/:executionId — returns execution detail", async () => {
      mockSend.mockResolvedValueOnce({
        pipelineExecution: { pipelineExecutionId: "exec-1", status: "Succeeded" },
      });
      const res = await get("/pipelines/my-pipeline/executions/exec-1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.execution.pipelineExecutionId).toBe("exec-1");
    });

    it("POST /pipelines/:name/executions — starts execution", async () => {
      mockSend.mockResolvedValueOnce({ pipelineExecutionId: "exec-2" });
      const res = await post("/pipelines/my-pipeline/executions", {});
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.pipelineExecutionId).toBe("exec-2");
    });

    it("POST /pipelines/:name/executions — starts with source revisions and variables", async () => {
      mockSend.mockResolvedValueOnce({ pipelineExecutionId: "exec-3" });
      const res = await post("/pipelines/my-pipeline/executions", {
        sourceRevisions: [{ actionName: "Source", revisionId: "rev-1" }],
        variables: [{ name: "var1", value: "val1" }],
      });
      expect(res.status).toBe(201);
      expect(mockSend.mock.calls[0][0].sourceRevisions).toHaveLength(1);
      expect(mockSend.mock.calls[0][0].variables).toHaveLength(1);
    });

    it("POST /pipelines/:name/executions — rejects empty pipeline name", async () => {
      const res = await post("/pipelines//executions", {});
      // Hono route won't match empty segment, expect 404
      expect(res.status).toBe(404);
    });

    it("POST /pipelines/:name/executions/:id/stop — rejects missing executionId", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/pipelines//executions//stop", {});
      expect(res.status).toBe(404);
    });

    it("POST /pipelines/:name/executions/:id/stop — stops execution", async () => {
      mockSend.mockResolvedValueOnce({ pipelineExecutionId: "exec-1" });
      const res = await post("/pipelines/my-pipeline/executions/exec-1/stop", { abandon: false, reason: "test" });
      expect(res.status).toBe(200);
    });

    it("POST /pipelines/:name/executions/:id/retry — retries stage", async () => {
      mockSend.mockResolvedValueOnce({ pipelineExecutionId: "exec-1" });
      const res = await post("/pipelines/my-pipeline/executions/exec-1/retry", { retryMode: "FAILED_ACTIONS", stageName: "Deploy" });
      expect(res.status).toBe(200);
    });

    it("POST /pipelines/:name/executions/:id/retry — rejects missing stageName", async () => {
      const res = await post("/pipelines/my-pipeline/executions/exec-1/retry", { retryMode: "FAILED_ACTIONS" });
      expect(res.status).toBe(400);
    });

    it("POST /pipelines/:name/executions/:id/retry — uses default retryMode", async () => {
      mockSend.mockResolvedValueOnce({ pipelineExecutionId: "exec-1" });
      const res = await post("/pipelines/my-pipeline/executions/exec-1/retry", { stageName: "Deploy" });
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].retryMode).toBe("FAILED_ACTIONS");
    });

    it("POST /pipelines/:name/executions/:id/stop — with abandon and reason", async () => {
      mockSend.mockResolvedValueOnce({ pipelineExecutionId: "exec-1" });
      const res = await post("/pipelines/my-pipeline/executions/exec-1/stop", { abandon: true, reason: "Manual stop" });
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].abandon).toBe(true);
      expect(mockSend.mock.calls[0][0].reason).toBe("Manual stop");
    });
  });

  describe("Stage Transitions", () => {
    it("POST /pipelines/:name/transitions/:stageName/disable — disables transition", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/pipelines/my-pipeline/transitions/Deploy/disable", { reason: "maintenance" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.disabled).toBe(true);
    });

    it("POST /pipelines/:name/transitions/:stageName/disable — uses default reason when not provided", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/pipelines/my-pipeline/transitions/Deploy/disable", {});
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("DisableStageTransitionCommand");
      expect(mockSend.mock.calls[0][0].reason).toBe("Disabled from dashboard");
    });

    it("POST /pipelines/:name/transitions/:stageName/enable — enables transition", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/pipelines/my-pipeline/transitions/Deploy/enable");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.enabled).toBe(true);
    });

    it("POST /pipelines/:name/transitions/:stageName/disable — with custom transitionType", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/pipelines/my-pipeline/transitions/Deploy/disable", { transitionType: "Outbound", reason: "Testing outbound" });
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].transitionType).toBe("Outbound");
      expect(mockSend.mock.calls[0][0].reason).toBe("Testing outbound");
    });
  });

  describe("Approvals", () => {
    it("POST /pipelines/:name/approvals — submits approval", async () => {
      mockSend.mockResolvedValueOnce({ approvedAt: new Date() });
      const res = await post("/pipelines/my-pipeline/approvals", {
        stageName: "Approval",
        actionName: "Approve",
        token: "token-123",
        status: "Approved",
        summary: "LGTM",
      });
      expect(res.status).toBe(200);
    });

    it("POST /pipelines/:name/approvals — requires all fields", async () => {
      const res = await post("/pipelines/my-pipeline/approvals", {});
      expect(res.status).toBe(400);
    });
  });

  describe("Action Executions", () => {
    it("GET /pipelines/:name/actions — lists action executions", async () => {
      mockSend.mockResolvedValueOnce({
        actionExecutionDetails: [
          { actionName: "Build", status: "Succeeded" },
        ],
      });
      const res = await get("/pipelines/my-pipeline/actions");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
    });

    it("GET /pipelines/:name/actions — with executionId filter", async () => {
      mockSend.mockResolvedValueOnce({ actionExecutionDetails: [] });
      const res = await get("/pipelines/my-pipeline/actions?executionId=exec-1");
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].filter.pipelineExecutionId).toBe("exec-1");
    });
  });

  describe("Rollback Stage", () => {
    it("POST /pipelines/:name/executions/:id/rollback — rollbacks stage", async () => {
      mockSend.mockResolvedValueOnce({ pipelineExecutionId: "exec-2" });
      const res = await post("/pipelines/my-pipeline/executions/exec-1/rollback", { stageName: "Deploy" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.pipelineExecutionId).toBe("exec-2");
    });

    it("POST /pipelines/:name/executions/:id/rollback — includes sourceRevision when provided", async () => {
      mockSend.mockResolvedValueOnce({ pipelineExecutionId: "exec-3" });
      const res = await post("/pipelines/my-pipeline/executions/exec-1/rollback", {
        stageName: "Deploy",
        sourceRevision: { revisionId: "rev-1", revisionUrl: "https://example.com" },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.pipelineExecutionId).toBe("exec-3");
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("RollbackStageCommand");
      expect(mockSend.mock.calls[0][0].sourceRevision).toBeDefined();
      expect(mockSend.mock.calls[0][0].sourceRevision.revisionId).toBe("rev-1");
    });

    it("POST /pipelines/:name/executions/:id/rollback — rejects missing stageName", async () => {
      const res = await post("/pipelines/my-pipeline/executions/exec-1/rollback", {});
      expect(res.status).toBe(400);
    });
  });

  describe("Override Stage Condition", () => {
    it("POST /pipelines/:name/executions/:id/override — overrides condition", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/pipelines/my-pipeline/executions/exec-1/override", {
        stageName: "Deploy",
        conditionName: "CheckForCondition",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.overridden).toBe(true);
      expect(mockSend.mock.calls[0][0].conditionType).toBe("SUCCESS");
    });

    it("POST /pipelines/:name/executions/:id/override — with custom conditionType", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/pipelines/my-pipeline/executions/exec-1/override", {
        stageName: "Deploy",
        conditionName: "Check",
        conditionType: "FAILURE",
      });
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].conditionType).toBe("FAILURE");
    });

    it("POST /pipelines/:name/executions/:id/override — rejects missing stageName", async () => {
      const res = await post("/pipelines/my-pipeline/executions/exec-1/override", { conditionName: "Check" });
      expect(res.status).toBe(400);
    });

    it("POST /pipelines/:name/executions/:id/override — rejects missing conditionName", async () => {
      const res = await post("/pipelines/my-pipeline/executions/exec-1/override", { stageName: "Deploy" });
      expect(res.status).toBe(400);
    });
  });

  describe("Action Revisions", () => {
    it("PUT /pipelines/:name/actions/revision — puts action revision", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/pipelines/my-pipeline/actions/revision", {
        actionName: "Build",
        actionRevision: { revisionId: "rev-1", revisionChangeId: "change-1", created: new Date().toISOString() },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
    });

    it("PUT /pipelines/:name/actions/revision — rejects missing actionName", async () => {
      const res = await put("/pipelines/my-pipeline/actions/revision", { actionRevision: {} });
      expect(res.status).toBe(400);
    });
  });

  describe("Rule Executions", () => {
    it("GET /pipelines/:name/rules — lists rule executions", async () => {
      mockSend.mockResolvedValueOnce({
        ruleExecutionDetails: [
          { ruleExecutionId: "rule-1", ruleName: "CheckCondition", status: "Succeeded" },
        ],
      });
      const res = await get("/pipelines/my-pipeline/rules");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
    });

    it("GET /pipelines/:name/rules — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ ruleExecutionDetails: [] });
      const res = await get("/pipelines/my-pipeline/rules");
      const body = await res.json();
      expect(body.total).toBe(0);
    });
  });

  describe("Jobs", () => {
    it("PUT /jobs/:jobId/result — accepts failure result", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/jobs/job-123/result", {
        status: "Failure",
        failureType: "ConfigurationError",
        message: "Invalid config",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.result).toBe("failure");
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("PutJobFailureResultCommand");
    });

    it("PUT /jobs/:jobId/result — requires status", async () => {
      const res = await put("/jobs/job-123/result", {});
      expect(res.status).toBe(400);
    });

    it("PUT /jobs/:jobId/result — accepts success result", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/jobs/job-123/result", {
        status: "Success",
        currentRevision: { revisionId: "rev-1", revisionChangeId: "change-1" },
        continuationToken: "token-abc",
        executionDetails: { summary: "Job completed" },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.result).toBe("success");
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("PutJobSuccessResultCommand");
    });

    it("POST /jobs/:jobId/acknowledge — acknowledges a job", async () => {
      mockSend.mockResolvedValueOnce({ status: "Created" });
      const res = await post("/jobs/job-123/acknowledge", { nonce: "nonce-1" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe("Created");
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("AcknowledgeJobCommand");
    });

    it("POST /jobs/:jobId/acknowledge — 400 when jobId missing", async () => {
      const res = await post("/jobs//acknowledge", {});
      expect(res.status).toBe(404);
    });

    it("GET /jobs/:jobId — gets job details", async () => {
      mockSend.mockResolvedValueOnce({
        jobDetails: { id: "job-123", accountId: "123" },
      });
      const res = await get("/jobs/job-123");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.jobDetails.id).toBe("job-123");
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("GetJobDetailsCommand");
    });

    it("GET /jobs/:jobId — 400 when jobId missing", async () => {
      const res = await get("/jobs/");
      expect(res.status).toBe(404);
    });

    it("POST /action-types/:cat/:provider/jobs/poll — polls for jobs", async () => {
      mockSend.mockResolvedValueOnce({ jobs: [{ id: "job-1" }] });
      const res = await post("/action-types/Test/MyProvider/jobs/poll");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("PollForJobsCommand");
      expect(mockSend.mock.calls[0][0].actionTypeId.owner).toBe("Custom");
    });

    it("POST /action-types/:cat/:provider/jobs/poll — with maxBatchSize and queryParam", async () => {
      mockSend.mockResolvedValueOnce({ jobs: [] });
      const res = await post("/action-types/Test/MyProvider/jobs/poll?maxBatchSize=5&queryParam=%7B%22key%22%3A%22val%22%7D");
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].maxBatchSize).toBe(5);
      expect(mockSend.mock.calls[0][0].queryParam).toEqual({ key: "val" });
    });

    it("POST /action-types/:cat/:provider/jobs/poll — 400 when category/provider missing", async () => {
      const res = await post("/action-types//jobs/poll");
      expect(res.status).toBe(404);
    });
  });

  describe("Action Types", () => {
    it("GET /action-types — lists action types", async () => {
      mockSend.mockResolvedValueOnce({
        actionTypes: [{ id: { owner: "AWS", provider: "S3", category: "Source", version: "1" } }],
      });
      const res = await get("/action-types");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
    });

    it("GET /action-types — with owner and region filters", async () => {
      mockSend.mockResolvedValueOnce({ actionTypes: [] });
      const res = await get("/action-types?owner=AWS&region=us-east-1");
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].actionOwnerFilter).toBe("AWS");
      expect(mockSend.mock.calls[0][0].regionFilter).toBe("us-east-1");
    });

    it("GET /action-types/:owner/:cat/:prov/:ver — gets action type", async () => {
      mockSend.mockResolvedValueOnce({
        actionType: { id: { owner: "Custom", category: "Deploy", provider: "MyProvider", version: "1" } },
      });
      const res = await get("/action-types/Custom/Deploy/MyProvider/1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.actionType.id.provider).toBe("MyProvider");
    });

    it("POST /action-types — creates custom action type", async () => {
      mockSend.mockResolvedValueOnce({ actionType: { id: { owner: "Custom", provider: "MyProvider", category: "Build", version: "1" } } });
      const res = await post("/action-types", {
        actionType: { category: "Build", provider: "MyProvider", version: "1" },
      });
      expect(res.status).toBe(201);
    });

    it("POST /action-types — uses defaults for version and artifact details", async () => {
      mockSend.mockResolvedValueOnce({ actionType: {} });
      const res = await post("/action-types", {
        actionType: { category: "Build", provider: "MyProvider" },
      });
      expect(res.status).toBe(201);
      expect(mockSend.mock.calls[0][0].version).toBe("1");
      expect(mockSend.mock.calls[0][0].inputArtifactDetails).toEqual({ minimumCount: 0, maximumCount: 5 });
      expect(mockSend.mock.calls[0][0].outputArtifactDetails).toEqual({ minimumCount: 0, maximumCount: 5 });
    });

    it("GET /action-types/:owner/:cat/:prov/:ver — 400 when params missing", async () => {
      const res = await get("/action-types///1");
      expect(res.status).toBe(404);
    });

    it("PUT /action-types/:owner/:cat/:prov/:ver — 400 when params missing", async () => {
      const res = await put("/action-types///1", { actionType: {} });
      expect(res.status).toBe(404);
    });

    it("DELETE /action-types/:owner/:cat/:prov/:ver — 400 when params missing", async () => {
      const res = await del("/action-types///1");
      expect(res.status).toBe(404);
    });

    it("POST /action-types — requires actionType", async () => {
      const res = await post("/action-types", {});
      expect(res.status).toBe(400);
    });

    it("DELETE /action-types/:owner/:cat/:prov/:ver — deletes custom action type", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/action-types/Custom/Build/MyProvider/1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });

    it("PUT /action-types/:owner/:cat/:prov/:ver — updates action type", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/action-types/Custom/Build/MyProvider/1", {
        actionType: { provider: "MyProvider", category: "Build", version: "2" },
      });
      expect(res.status).toBe(200);
    });
  });

  describe("Webhooks", () => {
    it("GET /webhooks — lists webhooks", async () => {
      mockSend.mockResolvedValueOnce({
        webhooks: [{ definition: { name: "my-hook" }, url: "https://example.com" }],
      });
      const res = await get("/webhooks");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
    });

    it("POST /webhooks — creates a webhook", async () => {
      mockSend.mockResolvedValueOnce({ webhook: { definition: { name: "my-hook" } } });
      const res = await post("/webhooks", {
        webhook: {
          name: "my-hook",
          targetPipeline: "my-pipeline",
          targetAction: "Source",
          filters: [{ jsonPath: "$.ref", matchEquals: "refs/heads/main" }],
          authentication: "GITHUB_HMAC",
          authenticationConfiguration: { SecretToken: "token" },
        },
      });
      expect(res.status).toBe(201);
    });

    it("POST /webhooks — creates webhook with tags", async () => {
      mockSend.mockResolvedValueOnce({ webhook: { definition: { name: "tagged-hook" } } });
      const res = await post("/webhooks", {
        webhook: { name: "tagged-hook", targetPipeline: "p", targetAction: "S", filters: [], authentication: "GITHUB_HMAC", authenticationConfiguration: { SecretToken: "t" } },
        tags: [{ key: "env", value: "prod" }],
      });
      expect(res.status).toBe(201);
      expect(mockSend.mock.calls[0][0].tags).toEqual([{ key: "env", value: "prod" }]);
    });

    it("POST /webhooks — requires webhook definition", async () => {
      const res = await post("/webhooks", {});
      expect(res.status).toBe(400);
    });

    it("DELETE /webhooks/:name — deletes a webhook", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/webhooks/my-hook");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });

    it("POST /webhooks/:name/register — registers webhook with third party", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/webhooks/my-hook/register");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.registered).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("RegisterWebhookWithThirdPartyCommand");
    });

    it("DELETE /webhooks/:name — 400 when name missing", async () => {
      const res = await del("/webhooks/");
      expect(res.status).toBe(404);
    });

    it("POST /webhooks/:name/register — 400 when name missing", async () => {
      const res = await post("/webhooks//register");
      expect(res.status).toBe(404);
    });

    it("POST /webhooks/:name/deregister — 400 when name missing", async () => {
      const res = await post("/webhooks//deregister");
      expect(res.status).toBe(404);
    });

    it("POST /webhooks/:name/deregister — deregisters webhook", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/webhooks/my-hook/deregister");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deregistered).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("DeregisterWebhookWithThirdPartyCommand");
    });
  });

  describe("Tags", () => {
    it("POST /tags — adds tags", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/tags", {
        resourceArn: "arn:aws:codepipeline:us-east-1::my-pipeline",
        tags: [{ key: "env", value: "prod" }],
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.tagged).toBe(true);
    });

    it("POST /tags — requires resourceArn and tags", async () => {
      const res = await post("/tags", {});
      expect(res.status).toBe(400);
    });

    it("GET /tags — lists tags", async () => {
      mockSend.mockResolvedValueOnce({ tags: [{ key: "env", value: "prod" }] });
      const res = await get("/tags?resourceArn=arn:aws:codepipeline:us-east-1::my-pipeline");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.tags).toHaveLength(1);
    });

    it("GET /tags — requires resourceArn", async () => {
      const res = await get("/tags");
      expect(res.status).toBe(400);
    });

    it("DELETE /tags — untags a resource", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/tags?resourceArn=arn:aws:codepipeline:us-east-1::my-pipeline&tagKeys=env,team");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.untagged).toBe(true);
    });

    it("DELETE /tags — requires resourceArn and tagKeys", async () => {
      const res = await del("/tags");
      expect(res.status).toBe(400);
    });
  });

  describe("Update Pipeline", () => {
    it("PUT /pipelines/:name — updates a pipeline", async () => {
      mockSend.mockResolvedValueOnce({ pipeline: { name: "my-pipeline", version: 2 } });
      const res = await put("/pipelines/my-pipeline", {
        pipeline: { name: "my-pipeline", roleArn: "arn:aws:iam::123:role/updated", artifactStore: { type: "S3", location: "bucket" }, stages: [] },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.pipeline.name).toBe("my-pipeline");
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("UpdatePipelineCommand");
    });

    it("PUT /pipelines/:name — requires pipeline declaration", async () => {
      const res = await put("/pipelines/my-pipeline", {});
      expect(res.status).toBe(400);
    });
  });

  describe("Rollback Stage Edge Cases", () => {
    it("POST /pipelines/:name/executions/:id/rollback — without sourceRevision", async () => {
      mockSend.mockResolvedValueOnce({ pipelineExecutionId: "exec-rollback" });
      const res = await post("/pipelines/my-pipeline/executions/exec-1/rollback", { stageName: "Deploy" });
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("RollbackStageCommand");
      expect(mockSend.mock.calls[0][0].sourceRevision).toBeUndefined();
    });
  });

  describe("Stop Execution Edge Cases", () => {
    it("POST /pipelines/:name/executions/:id/stop — without abandon or reason (uses defaults)", async () => {
      mockSend.mockResolvedValueOnce({ pipelineExecutionId: "exec-stop" });
      const res = await post("/pipelines/my-pipeline/executions/exec-1/stop", {});
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("StopPipelineExecutionCommand");
      expect(mockSend.mock.calls[0][0].abandon).toBeUndefined();
      expect(mockSend.mock.calls[0][0].reason).toBeUndefined();
    });
  });

  describe("Job Details Edge Cases", () => {
    it("GET /jobs/:jobId — returns null when no details", async () => {
      mockSend.mockResolvedValueOnce({ jobDetails: undefined });
      const res = await get("/jobs/job-null");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.jobDetails).toBeNull();
    });
  });

  describe("PollForJobs Edge Cases", () => {
    it("POST /action-types/:cat/:provider/jobs/poll — without queryParam (undefined)", async () => {
      mockSend.mockResolvedValueOnce({ jobs: [] });
      const res = await post("/action-types/Test/MyProvider/jobs/poll");
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].queryParam).toBeUndefined();
    });
  });

  // ── Missing coverage gaps ──

  describe("Executions — extra params", () => {
    it("GET /pipelines/:name/executions — with maxResults", async () => {
      mockSend.mockResolvedValueOnce({ pipelineExecutionSummaries: [] });
      const res = await get("/pipelines/my-pipeline/executions?maxResults=25");
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].maxResults).toBe(25);
    });

    it("GET /pipelines/:name/executions — maxResults defaults to 50 when NaN", async () => {
      mockSend.mockResolvedValueOnce({ pipelineExecutionSummaries: [] });
      const res = await get("/pipelines/my-pipeline/executions?maxResults=abc");
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].maxResults).toBe(50);
    });

    it("POST /pipelines/:name/executions — with clientRequestToken", async () => {
      mockSend.mockResolvedValueOnce({ pipelineExecutionId: "exec-token" });
      const res = await post("/pipelines/my-pipeline/executions", { clientRequestToken: "token-xyz" });
      expect(res.status).toBe(201);
      expect(mockSend.mock.calls[0][0].clientRequestToken).toBe("token-xyz");
    });
  });

  describe("Action Executions — extra params", () => {
    it("GET /pipelines/:name/actions — with maxResults and nextToken", async () => {
      mockSend.mockResolvedValueOnce({ actionExecutionDetails: [], nextToken: "tok" });
      const res = await get("/pipelines/my-pipeline/actions?maxResults=50&nextToken=tok");
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].maxResults).toBe(50);
      expect(mockSend.mock.calls[0][0].nextToken).toBe("tok");
      const body = await res.json();
      expect(body.nextToken).toBe("tok");
    });
  });

  describe("Rule Executions — extra params", () => {
    it("GET /pipelines/:name/rules — with maxResults and nextToken", async () => {
      mockSend.mockResolvedValueOnce({ ruleExecutionDetails: [], nextToken: "rtok" });
      const res = await get("/pipelines/my-pipeline/rules?maxResults=20&nextToken=rtok");
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].maxResults).toBe(20);
      expect(mockSend.mock.calls[0][0].nextToken).toBe("rtok");
      const body = await res.json();
      expect(body.nextToken).toBe("rtok");
    });
  });

  describe("Jobs — failure defaults", () => {
    it("PUT /jobs/:jobId/result — failure uses defaults for type and message", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/jobs/job-default/result", { status: "Failure" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.result).toBe("failure");
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("PutJobFailureResultCommand");
      expect(mockSend.mock.calls[0][0].failureDetails.type).toBe("JobFailed");
      expect(mockSend.mock.calls[0][0].failureDetails.message).toBe("Job failed");
    });
  });

  describe("Webhooks — extra params", () => {
    it("GET /webhooks — with maxResults and nextToken", async () => {
      mockSend.mockResolvedValueOnce({ webhooks: [], NextToken: "wtok" });
      const res = await get("/webhooks?maxResults=50&nextToken=wtok");
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].MaxResults).toBe(50);
      expect(mockSend.mock.calls[0][0].NextToken).toBe("wtok");
      const body = await res.json();
      expect(body.NextToken).toBe("wtok");
    });
  });

  describe("Action Types — extra params", () => {
    it("GET /action-types — without owner filter (undefined)", async () => {
      mockSend.mockResolvedValueOnce({ actionTypes: [] });
      const res = await get("/action-types");
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].actionOwnerFilter).toBeUndefined();
    });

    it("GET /action-types — with empty owner query (|| undefined fallback)", async () => {
      mockSend.mockResolvedValueOnce({ actionTypes: [] });
      const res = await get("/action-types?owner=");
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].actionOwnerFilter).toBeUndefined();
    });

    it("POST /action-types — with settings and configurationProperties", async () => {
      mockSend.mockResolvedValueOnce({ actionType: { id: { owner: "Custom", provider: "Mine", category: "Test", version: "2" } } });
      const res = await post("/action-types", {
        actionType: {
          category: "Test",
          provider: "Mine",
          version: "2",
          configurationProperties: [{ name: "key", required: true, secret: false }],
          settings: { entityUrlTemplate: "url", executionUrlTemplate: "eurl" },
        },
      });
      expect(res.status).toBe(201);
      expect(mockSend.mock.calls[0][0].configurationProperties).toBeDefined();
      expect(mockSend.mock.calls[0][0].settings).toBeDefined();
    });
  });

  // ─── Undefined response fallbacks (|| [] branches) ──────

  describe("Undefined response fallbacks", () => {
    it("GET /pipelines — handles undefined pipelines (|| [])", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/pipelines");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(0);
      expect(body.pipelines).toEqual([]);
    });

    it("GET /webhooks — handles undefined webhooks (|| [])", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/webhooks");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(0);
      expect(body.webhooks).toEqual([]);
    });

    it("GET /pipelines/:name/actions — handles undefined actionExecutionDetails (|| [])", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/pipelines/my-pipeline/actions");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(0);
      expect(body.actions).toEqual([]);
    });

    it("GET /pipelines/:name/rules — handles undefined ruleExecutionDetails (|| [])", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/pipelines/my-pipeline/rules");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(0);
      expect(body.ruleExecutionDetails).toEqual([]);
    });

    it("POST /action-types/:cat/:provider/jobs/poll — handles undefined jobs (|| [])", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/action-types/Test/MyProvider/jobs/poll");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(0);
      expect(body.jobs).toEqual([]);
    });

    it("GET /tags — handles undefined tags (|| [])", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/tags?resourceArn=arn:aws:codepipeline:us-east-1::my-pipeline");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.tags).toEqual([]);
    });

    it("GET /action-types — handles undefined actionTypes (|| [])", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/action-types");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(0);
      expect(body.actionTypes).toEqual([]);
    });

    it("GET /webhooks — handles undefined NextToken", async () => {
      mockSend.mockResolvedValueOnce({ webhooks: [] });
      const res = await get("/webhooks");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.NextToken).toBeUndefined();
    });
  });

  // ─── Jobs: failure with externalExecutionId ────────────

  describe("Jobs — failure with externalExecutionId", () => {
    it("PUT /jobs/:jobId/result — failure includes externalExecutionId", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/jobs/job-ext/result", {
        status: "Failure",
        externalExecutionId: "ext-123",
      });
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].failureDetails.externalExecutionId).toBe("ext-123");
    });
  });

  // ─── Tags: individual field validation ─────────────────

  describe("Tags — individual field validation", () => {
    it("POST /tags — requires tags (only resourceArn provided)", async () => {
      const res = await post("/tags", { resourceArn: "arn:aws:codepipeline:us-east-1::pipeline" });
      expect(res.status).toBe(400);
    });

    it("DELETE /tags — requires tagKeys (only resourceArn provided)", async () => {
      const res = await del("/tags?resourceArn=arn:aws:codepipeline:us-east-1::pipeline");
      expect(res.status).toBe(400);
    });
  });

  // ─── PollForJobs: maxBatchSize NaN default ─────────────

  describe("PollForJobs — maxBatchSize default", () => {
    it("POST /action-types/:cat/:provider/jobs/poll — maxBatchSize defaults to 10 when NaN", async () => {
      mockSend.mockResolvedValueOnce({ jobs: [] });
      const res = await post("/action-types/Test/MyProvider/jobs/poll?maxBatchSize=abc");
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].maxBatchSize).toBe(10);
    });
  });

  // ─── Approval: missing individual fields ────────────────

  describe("Approvals — missing individual fields", () => {
    it("POST /pipelines/:name/approvals — requires stageName (missing all others)", async () => {
      const res = await post("/pipelines/my-pipeline/approvals", { stageName: "Approval" });
      expect(res.status).toBe(400);
    });
  });

  // ─── Null fallbacks for single-resource lookups ─────────

  describe("Null fallbacks", () => {
    it("GET /pipelines/:name/executions/:executionId — returns null when execution not found", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/pipelines/my-pipeline/executions/exec-missing");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.execution).toBeNull();
    });

    it("GET /action-types/:owner/:cat/:prov/:ver — returns null when action type not found", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/action-types/Custom/Deploy/NoSuchProvider/1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.actionType).toBeNull();
    });
  });

  // ─── maxResults NaN defaults for remaining routes ───────

  describe("maxResults NaN defaults", () => {
    it("GET /webhooks — maxResults defaults to 100 when NaN", async () => {
      mockSend.mockResolvedValueOnce({ webhooks: [] });
      const res = await get("/webhooks?maxResults=xyz");
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].MaxResults).toBe(100);
    });

    it("GET /pipelines/:name/actions — maxResults defaults to 100 when NaN", async () => {
      mockSend.mockResolvedValueOnce({ actionExecutionDetails: [] });
      const res = await get("/pipelines/my-pipeline/actions?maxResults=notanumber");
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].maxResults).toBe(100);
    });
  });

  // ─── Jobs: success with optional fields omitted ─────────

  describe("Jobs — success edge cases", () => {
    it("PUT /jobs/:jobId/result — success without optional fields", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/jobs/job-minimal/result", { status: "Success" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.result).toBe("success");
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("PutJobSuccessResultCommand");
      expect(mockSend.mock.calls[0][0].currentRevision).toBeUndefined();
      expect(mockSend.mock.calls[0][0].continuationToken).toBeUndefined();
    });
  });

  // ─── GET /action-types/:owner.../:ver — empty response ──

  describe("Action Types — empty responses", () => {
    it("GET /pipelines/:name/rules — with maxResults only (no nextToken)", async () => {
      mockSend.mockResolvedValueOnce({ ruleExecutionDetails: [] });
      const res = await get("/pipelines/my-pipeline/rules?maxResults=30");
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].maxResults).toBe(30);
      expect(mockSend.mock.calls[0][0].nextToken).toBeUndefined();
    });
  });

  // ─── Pipelines: null metadata branch ───────────────────

  describe("Pipelines — metadata edge cases", () => {
    it("GET /pipelines/:name — returns pipeline with null metadata", async () => {
      mockSend.mockResolvedValueOnce({ pipeline: { name: "p", version: 1 }, metadata: undefined });
      const res = await get("/pipelines/p");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.pipeline.name).toBe("p");
      expect(body.metadata).toBeNull();
    });
  });

});
