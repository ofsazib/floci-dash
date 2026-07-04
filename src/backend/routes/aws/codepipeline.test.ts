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
  DisableStageTransitionCommand: createCmd("DisableStageTransitionCommand"),
  EnableStageTransitionCommand: createCmd("EnableStageTransitionCommand"),
  PutApprovalResultCommand: createCmd("PutApprovalResultCommand"),
  ListActionExecutionsCommand: createCmd("ListActionExecutionsCommand"),
  ListActionTypesCommand: createCmd("ListActionTypesCommand"),
  CreateCustomActionTypeCommand: createCmd("CreateCustomActionTypeCommand"),
  ListWebhooksCommand: createCmd("ListWebhooksCommand"),
  PutWebhookCommand: createCmd("PutWebhookCommand"),
  DeleteWebhookCommand: createCmd("DeleteWebhookCommand"),
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

    it("DELETE /pipelines/:name — deletes a pipeline", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/pipelines/my-pipeline");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
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
  });

  describe("Stage Transitions", () => {
    it("POST /pipelines/:name/transitions/:stageName/disable — disables transition", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/pipelines/my-pipeline/transitions/Deploy/disable", { reason: "maintenance" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.disabled).toBe(true);
    });

    it("POST /pipelines/:name/transitions/:stageName/enable — enables transition", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/pipelines/my-pipeline/transitions/Deploy/enable");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.enabled).toBe(true);
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

    it("POST /action-types — creates custom action type", async () => {
      mockSend.mockResolvedValueOnce({ actionType: { id: { owner: "Custom", provider: "MyProvider", category: "Build", version: "1" } } });
      const res = await post("/action-types", {
        actionType: { category: "Build", provider: "MyProvider", version: "1" },
      });
      expect(res.status).toBe(201);
    });

    it("POST /action-types — requires actionType", async () => {
      const res = await post("/action-types", {});
      expect(res.status).toBe(400);
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
});
