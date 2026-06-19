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
  DeleteStateMachineCommand: createCmd("DeleteStateMachineCommand"),
  ListExecutionsCommand: createCmd("ListExecutionsCommand"),
  DescribeExecutionCommand: createCmd("DescribeExecutionCommand"),
  StartExecutionCommand: createCmd("StartExecutionCommand"),
  StopExecutionCommand: createCmd("StopExecutionCommand"),
  GetExecutionHistoryCommand: createCmd("GetExecutionHistoryCommand"),
  ListActivitiesCommand: createCmd("ListActivitiesCommand"),
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

beforeEach(() => mockSend.mockReset());

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

  it("GET /activities — lists activities", async () => {
    mockSend.mockResolvedValueOnce({ activities: [{ activityArn: "arn:...:act", name: "my-act" }] });
    const res = await get("/activities");
    const body = await res.json();
    expect(body.total).toBe(1);
  });
});
