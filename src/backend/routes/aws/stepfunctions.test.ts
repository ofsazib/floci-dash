import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());
const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) { return { __cmdName: name, ...args }; });
  };
});

vi.mock("@aws-sdk/client-sfn", () => ({
  SFNClient: vi.fn(function () { return { send: mockSend }; }),
  ListStateMachinesCommand: createCmd("ListStateMachinesCommand"),
  DescribeStateMachineCommand: createCmd("DescribeStateMachineCommand"),
  CreateStateMachineCommand: createCmd("CreateStateMachineCommand"),
  UpdateStateMachineCommand: createCmd("UpdateStateMachineCommand"),
  DeleteStateMachineCommand: createCmd("DeleteStateMachineCommand"),
  ListExecutionsCommand: createCmd("ListExecutionsCommand"),
  DescribeExecutionCommand: createCmd("DescribeExecutionCommand"),
  StartExecutionCommand: createCmd("StartExecutionCommand"),
  StopExecutionCommand: createCmd("StopExecutionCommand"),
  GetExecutionHistoryCommand: createCmd("GetExecutionHistoryCommand"),
  ListActivitiesCommand: createCmd("ListActivitiesCommand"),
  PublishStateMachineVersionCommand: createCmd("PublishStateMachineVersionCommand"),
  ListStateMachineVersionsCommand: createCmd("ListStateMachineVersionsCommand"),
  DeleteStateMachineVersionCommand: createCmd("DeleteStateMachineVersionCommand"),
  CreateActivityCommand: createCmd("CreateActivityCommand"),
  DeleteActivityCommand: createCmd("DeleteActivityCommand"),
  DescribeActivityCommand: createCmd("DescribeActivityCommand"),
  GetActivityTaskCommand: createCmd("GetActivityTaskCommand"),
  SendTaskSuccessCommand: createCmd("SendTaskSuccessCommand"),
  SendTaskFailureCommand: createCmd("SendTaskFailureCommand"),
  SendTaskHeartbeatCommand: createCmd("SendTaskHeartbeatCommand"),
  StartSyncExecutionCommand: createCmd("StartSyncExecutionCommand"),
  ValidateStateMachineDefinitionCommand: createCmd("ValidateStateMachineDefinitionCommand"),
  ListTagsForResourceCommand: createCmd("ListTagsForResourceCommand"),
  TagResourceCommand: createCmd("TagResourceCommand"),
  UntagResourceCommand: createCmd("UntagResourceCommand"),
}));

vi.mock("../../clients/aws", () => ({ create: (Ctor: any, extra?: any) => new Ctor(extra) }));

import router from "./stepfunctions";

const ARN = "arn:aws:states:us-east-1:123:stateMachine:my-sm";
const ARN_ENC = encodeURIComponent(ARN);

async function get(p: string) { return router.request(p, { method: "GET" }); }
async function post(p: string, b?: any) {
  return router.request(p, { method: "POST", body: b != null ? JSON.stringify(b) : undefined, headers: b != null ? { "content-type": "application/json" } : undefined });
}
async function del(p: string) { return router.request(p, { method: "DELETE" }); }
async function put(p: string, b?: any) {
  return router.request(p, { method: "PUT", body: b != null ? JSON.stringify(b) : undefined, headers: b != null ? { "content-type": "application/json" } : undefined });
}
async function delWithBody(p: string, b?: any) {
  return router.request(p, { method: "DELETE", body: b != null ? JSON.stringify(b) : undefined, headers: b != null ? { "content-type": "application/json" } : undefined });
}

beforeEach(() => mockSend.mockReset());

describe("PUT /state-machines/:arn — UpdateStateMachine", () => {
  it("updates definition", async () => {
    mockSend.mockResolvedValueOnce({ updateDate: new Date("2026-01-01"), stateMachineVersionArn: "arn:arn:ver:1" });
    const res = await put(`/state-machines/${encodeURIComponent("arn:aws:states:us-east-1:1:stateMachine:sm")}`, { definition: "{}" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.stateMachineVersionArn).toBe("arn:arn:ver:1");
    expect(mockSend.mock.calls[0][0].definition).toBe("{}");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("UpdateStateMachineCommand");
  });

  it("updates roleArn only", async () => {
    mockSend.mockResolvedValueOnce({ updateDate: new Date("2026-01-01") });
    const res = await put(`/state-machines/${encodeURIComponent("arn:aws:states:us-east-1:1:stateMachine:sm")}`, { roleArn: "arn:aws:iam::1:role/x" });
    expect(res.status).toBe(200);
    expect(mockSend.mock.calls[0][0].roleArn).toBe("arn:aws:iam::1:role/x");
  });

  it("400 when neither definition nor roleArn", async () => {
    const res = await put(`/state-machines/${encodeURIComponent("arn:aws:states:us-east-1:1:stateMachine:sm")}`, {});
    expect(res.status).toBe(400);
  });
});

describe("Step Functions Routes", () => {
  it("GET /state-machines — lists SMs", async () => {
    mockSend.mockResolvedValueOnce({ stateMachines: [{ stateMachineArn: ARN, name: "my-sm" }] });
    const res = await get("/state-machines");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
  });

  it("GET /state-machines — empty", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/state-machines");
    const body = await res.json();
    expect(body.total).toBe(0);
  });

  it("GET /state-machines/:arn — describes SM", async () => {
    mockSend.mockResolvedValueOnce({ name: "my-sm", stateMachineArn: ARN });
    const res = await get(`/state-machines/${ARN_ENC}`);
    expect(res.status).toBe(200);
  });

  it("POST /state-machines — creates SM (201)", async () => {
    mockSend.mockResolvedValueOnce({ stateMachineArn: ARN, creationDate: 123 });
    const res = await post("/state-machines", { name: "my-sm", definition: "{}", roleArn: "arn:r" });
    expect(res.status).toBe(201);
  });

  it("POST /state-machines — 400 if name missing", async () => {
    const res = await post("/state-machines", { definition: "{}", roleArn: "arn:r" });
    expect(res.status).toBe(400);
  });

  it("POST /state-machines — 400 if roleArn missing", async () => {
    const res = await post("/state-machines", { name: "sm", definition: "{}" });
    expect(res.status).toBe(400);
  });

  it("POST /state-machines — 400 if definition missing", async () => {
    const res = await post("/state-machines", { name: "sm", roleArn: "arn:r" });
    expect(res.status).toBe(400);
  });

  it("DELETE /state-machines/:arn — deletes SM", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del(`/state-machines/${ARN_ENC}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
  });

  it("GET /state-machines/:arn/executions — lists executions", async () => {
    mockSend.mockResolvedValueOnce({ executions: [{ executionArn: "exec-1", status: "SUCCEEDED" }] });
    const res = await get(`/state-machines/${ARN_ENC}/executions`);
    const body = await res.json();
    expect(body.total).toBe(1);
  });

  it("GET /state-machines/:arn/executions — empty when executions key missing", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get(`/state-machines/${ARN_ENC}/executions`);
    const body = await res.json();
    expect(body.executions).toEqual([]);
    expect(body.total).toBe(0);
  });

  it("GET /executions/:arn — describes execution", async () => {
    mockSend.mockResolvedValueOnce({ executionArn: "exec-1", status: "RUNNING" });
    const res = await get(`/executions/${encodeURIComponent("arn:...:execution")}`);
    expect(res.status).toBe(200);
  });

  it("POST /state-machines/:arn/executions — starts execution (201)", async () => {
    mockSend.mockResolvedValueOnce({ executionArn: "exec-1", startDate: 123 });
    const res = await post(`/state-machines/${ARN_ENC}/executions`, {});
    expect(res.status).toBe(201);
  });

  it("POST /executions/:arn/stop — stops execution", async () => {
    mockSend.mockResolvedValueOnce({ stopDate: 456 });
    const res = await post(`/executions/${encodeURIComponent("arn:...:exec")}/stop`, {});
    expect(res.status).toBe(200);
  });

  it("GET /executions/:arn/history — lists events", async () => {
    mockSend.mockResolvedValueOnce({ events: [{ id: 1, type: "ExecutionStarted" }] });
    const res = await get(`/executions/${encodeURIComponent("arn:...:exec")}/history`);
    const body = await res.json();
    expect(body.total).toBe(1);
  });

  it("GET /executions/:arn/history — empty when events key missing", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get(`/executions/${encodeURIComponent("arn:...:exec")}/history`);
    const body = await res.json();
    expect(body.events).toEqual([]);
    expect(body.total).toBe(0);
  });

  it("GET /activities — lists activities", async () => {
    mockSend.mockResolvedValueOnce({ activities: [{ activityArn: "arn:...:act", name: "my-act" }] });
    const res = await get("/activities");
    const body = await res.json();
    expect(body.total).toBe(1);
  });

  it("GET /activities — empty when activities key missing", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/activities");
    const body = await res.json();
    expect(body.activities).toEqual([]);
    expect(body.total).toBe(0);
  });

  // ── Versions ────────────────────────────────────────

  it("POST /state-machines/:arn/versions — publishes version (201)", async () => {
    mockSend.mockResolvedValueOnce({ stateMachineVersionArn: ARN + ":1", creationDate: 456 });
    const res = await post(`/state-machines/${ARN_ENC}/versions`, {});
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.stateMachineVersionArn).toBe(ARN + ":1");
  });

  it("GET /state-machines/:arn/versions — lists versions", async () => {
    mockSend.mockResolvedValueOnce({ stateMachineVersions: [{ stateMachineVersionArn: ARN + ":1" }, { stateMachineVersionArn: ARN + ":2" }] });
    const res = await get(`/state-machines/${ARN_ENC}/versions`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(2);
  });

  it("GET /state-machines/:arn/versions — empty result", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get(`/state-machines/${ARN_ENC}/versions`);
    const body = await res.json();
    expect(body.total).toBe(0);
  });

  it("DELETE /state-machines/:arn/versions/:versionArn — deletes version", async () => {
    mockSend.mockResolvedValueOnce({});
    const versionArn = ARN + ":1";
    const res = await del(`/state-machines/${ARN_ENC}/versions/${encodeURIComponent(versionArn)}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
  });
});

describe("G.84 — activities, task callbacks, sync executions, validation, tags", () => {
  const ACT = "arn:aws:states:us-east-1:123:activity:my-act";
  const ACT_ENC = encodeURIComponent(ACT);

  it("POST /activities — creates an activity", async () => {
    mockSend.mockResolvedValueOnce({ activityArn: ACT, name: "my-act" });
    const res = await post("/activities", { name: "my-act" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.activity.name).toBe("my-act");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("CreateActivityCommand");
    expect(mockSend.mock.calls[0][0].name).toBe("my-act");
  });

  it("POST /activities — 400 without name", async () => {
    const res = await post("/activities", {});
    expect(res.status).toBe(400);
  });

  it("POST /activities — null activity when sparse", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/activities", { name: "my-act" });
    const body = await res.json();
    expect(body.activity).toBeNull();
  });

  it("DELETE /activities/:arn — deletes an activity", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del(`/activities/${ACT_ENC}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
    expect(mockSend.mock.calls[0][0].activityArn).toBe(ACT);
  });

  it("GET /activities/:arn — describes an activity", async () => {
    mockSend.mockResolvedValueOnce({ activityArn: ACT, name: "my-act" });
    const res = await get(`/activities/${ACT_ENC}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.activity.name).toBe("my-act");
  });

  it("GET /activities/:arn — null when sparse", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get(`/activities/${ACT_ENC}`);
    const body = await res.json();
    expect(body.activity).toBeNull();
  });

  it("POST /activities/:arn/tasks — gets an activity task", async () => {
    mockSend.mockResolvedValueOnce({ taskToken: "tok-1", input: "{}" });
    const res = await post(`/activities/${ACT_ENC}/tasks`, { workerName: "worker-1" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.task.taskToken).toBe("tok-1");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("GetActivityTaskCommand");
    expect(mockSend.mock.calls[0][0].workerName).toBe("worker-1");
  });

  it("POST /activities/:arn/tasks — 400 without workerName", async () => {
    const res = await post(`/activities/${ACT_ENC}/tasks`, {});
    expect(res.status).toBe(400);
  });

  it("POST /activities/:arn/tasks — null task when sparse", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post(`/activities/${ACT_ENC}/tasks`, { workerName: "w" });
    const body = await res.json();
    expect(body.task).toBeNull();
  });

  it("POST /activities/:arn/tasks/success — sends success with default output", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post(`/activities/${ACT_ENC}/tasks/success`, { taskToken: "tok-1" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("SendTaskSuccessCommand");
    expect(mockSend.mock.calls[0][0].output).toBe("{}");
  });

  it("POST /activities/:arn/tasks/success — passes custom output", async () => {
    mockSend.mockResolvedValueOnce({});
    await post(`/activities/${ACT_ENC}/tasks/success`, { taskToken: "tok-1", output: '{"a":1}' });
    expect(mockSend.mock.calls[0][0].output).toBe('{"a":1}');
  });

  it("POST /activities/:arn/tasks/success — 400 without taskToken", async () => {
    const res = await post(`/activities/${ACT_ENC}/tasks/success`, {});
    expect(res.status).toBe(400);
  });

  it("POST /activities/:arn/tasks/failure — sends failure with optional error/cause", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post(`/activities/${ACT_ENC}/tasks/failure`, { taskToken: "tok-1", error: "Err", cause: "why" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("SendTaskFailureCommand");
    expect(mockSend.mock.calls[0][0].error).toBe("Err");
    expect(mockSend.mock.calls[0][0].cause).toBe("why");
  });

  it("POST /activities/:arn/tasks/failure — omits empty error/cause", async () => {
    mockSend.mockResolvedValueOnce({});
    await post(`/activities/${ACT_ENC}/tasks/failure`, { taskToken: "tok-1" });
    expect(mockSend.mock.calls[0][0].error).toBeUndefined();
    expect(mockSend.mock.calls[0][0].cause).toBeUndefined();
  });

  it("POST /activities/:arn/tasks/failure — 400 without taskToken", async () => {
    const res = await post(`/activities/${ACT_ENC}/tasks/failure`, {});
    expect(res.status).toBe(400);
  });

  it("POST /activities/:arn/tasks/heartbeat — sends heartbeat", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post(`/activities/${ACT_ENC}/tasks/heartbeat`, { taskToken: "tok-1" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("SendTaskHeartbeatCommand");
  });

  it("POST /activities/:arn/tasks/heartbeat — 400 without taskToken", async () => {
    const res = await post(`/activities/${ACT_ENC}/tasks/heartbeat`, {});
    expect(res.status).toBe(400);
  });

  it("POST /state-machines/:arn/sync-executions — starts a sync execution", async () => {
    mockSend.mockResolvedValueOnce({ executionArn: "arn:exec", status: "SUCCEEDED", output: "{}" });
    const res = await post(`/state-machines/${ARN_ENC}/sync-executions`, { name: "run-1", input: '{"k":1}' });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.execution.status).toBe("SUCCEEDED");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("StartSyncExecutionCommand");
    expect(mockSend.mock.calls[0][0].stateMachineArn).toBe(ARN);
  });

  it("POST /state-machines/:arn/sync-executions — omits empty name/input", async () => {
    mockSend.mockResolvedValueOnce({ executionArn: "arn:exec" });
    await post(`/state-machines/${ARN_ENC}/sync-executions`, {});
    expect(mockSend.mock.calls[0][0].name).toBeUndefined();
    expect(mockSend.mock.calls[0][0].input).toBeUndefined();
  });

  it("POST /state-machines/:arn/sync-executions — null when sparse", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post(`/state-machines/${ARN_ENC}/sync-executions`, {});
    const body = await res.json();
    expect(body.execution).toBeNull();
  });

  it("POST /state-machines/validate — validates a definition", async () => {
    mockSend.mockResolvedValueOnce({ result: "OK", diagnostics: [] });
    const res = await post("/state-machines/validate", { definition: "{}", type: "STANDARD" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.valid).toBe(true);
    expect(body.errors).toEqual([]);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("ValidateStateMachineDefinitionCommand");
  });

  it("POST /state-machines/validate — FAIL result with diagnostics", async () => {
    mockSend.mockResolvedValueOnce({ result: "FAIL", diagnostics: [{ code: "NO_START_STATE", message: "bad" }] });
    const res = await post("/state-machines/validate", { definition: "{}" });
    const body = await res.json();
    expect(body.valid).toBe(false);
    expect(body.errors).toEqual([{ code: "NO_START_STATE", message: "bad" }]);
  });

  it("POST /state-machines/validate — 400 without definition", async () => {
    const res = await post("/state-machines/validate", {});
    expect(res.status).toBe(400);
  });

  it("POST /state-machines/validate — omits type and nulls valid when sparse", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/state-machines/validate", { definition: "{}" });
    const body = await res.json();
    expect(body.valid).toBeNull();
    expect(body.errors).toEqual([]);
    expect(mockSend.mock.calls[0][0].type).toBeUndefined();
  });

  it("GET /state-machines/:arn/tags — lists tags", async () => {
    mockSend.mockResolvedValueOnce({ tags: [{ key: "env", value: "prod" }] });
    const res = await get(`/state-machines/${ARN_ENC}/tags`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([{ key: "env", value: "prod" }]);
    expect(mockSend.mock.calls[0][0].resourceArn).toBe(ARN);
  });

  it("GET /state-machines/:arn/tags — empty when sparse", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get(`/state-machines/${ARN_ENC}/tags`);
    const body = await res.json();
    expect(body).toEqual([]);
  });

  it("PUT /state-machines/:arn/tags — tags a state machine", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await put(`/state-machines/${ARN_ENC}/tags`, { tags: [{ key: "env", value: "prod" }] });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("TagResourceCommand");
  });

  it("PUT /state-machines/:arn/tags — 400 without tags", async () => {
    const res = await put(`/state-machines/${ARN_ENC}/tags`, {});
    expect(res.status).toBe(400);
    const res2 = await put(`/state-machines/${ARN_ENC}/tags`, { tags: [] });
    expect(res2.status).toBe(400);
  });

  it("DELETE /state-machines/:arn/tags — untags a state machine", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await delWithBody(`/state-machines/${ARN_ENC}/tags`, { tagKeys: ["env"] });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("UntagResourceCommand");
    expect(mockSend.mock.calls[0][0].tagKeys).toEqual(["env"]);
  });

  it("DELETE /state-machines/:arn/tags — 400 without tagKeys", async () => {
    const res = await delWithBody(`/state-machines/${ARN_ENC}/tags`, {});
    expect(res.status).toBe(400);
  });
});
