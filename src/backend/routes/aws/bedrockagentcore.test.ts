import { describe, it, expect, beforeEach, vi } from "vitest";

const mockControlSend = vi.hoisted(() => vi.fn());
const mockDataSend = vi.hoisted(() => vi.fn());

const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) {
      return { __cmdName: name, ...args };
    });
  };
});

vi.mock("@aws-sdk/client-bedrock-agentcore-control", () => ({
  BedrockAgentCoreControlClient: vi.fn(function () {
    return { send: mockControlSend };
  }),
  ListAgentRuntimesCommand: createCmd("ListAgentRuntimesCommand"),
  GetAgentRuntimeCommand: createCmd("GetAgentRuntimeCommand"),
  CreateAgentRuntimeCommand: createCmd("CreateAgentRuntimeCommand"),
  UpdateAgentRuntimeCommand: createCmd("UpdateAgentRuntimeCommand"),
  DeleteAgentRuntimeCommand: createCmd("DeleteAgentRuntimeCommand"),
}));

vi.mock("@aws-sdk/client-bedrock-agentcore", () => ({
  BedrockAgentCoreClient: vi.fn(function () {
    return { send: mockDataSend };
  }),
  InvokeAgentRuntimeCommand: createCmd("InvokeAgentRuntimeCommand"),
}));

// The route builds two clients from the same create() factory; route both
// command families through one send() that dispatches on __cmdName.
vi.mock("../../clients/aws", () => ({
  create: () => ({
    send: (cmd: any) =>
      cmd.__cmdName === "InvokeAgentRuntimeCommand"
        ? mockDataSend(cmd)
        : mockControlSend(cmd),
  }),
}));

import router from "./bedrockagentcore";

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

async function patchReq(path: string, body?: any) {
  return router.request(path, {
    method: "PATCH",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { "content-type": "application/json" } : undefined,
  });
}

async function del(path: string) {
  return router.request(path, { method: "DELETE" });
}

beforeEach(() => {
  mockControlSend.mockReset();
  mockDataSend.mockReset();
});

describe("Bedrock AgentCore routes", () => {
  it("lists runtimes", async () => {
    mockControlSend.mockResolvedValueOnce({
      agentRuntimes: [
        { agentRuntimeId: "rt-1", agentRuntimeName: "agent-a", status: "ACTIVE" },
      ],
      nextToken: "tok",
    });
    const res = await get("/runtimes");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.agentRuntimes).toHaveLength(1);
    expect(json.total).toBe(1);
    expect(json.nextToken).toBe("tok");
    expect(mockControlSend.mock.calls[0][0].__cmdName).toBe("ListAgentRuntimesCommand");
  });

  it("returns empty list when no runtimes", async () => {
    mockControlSend.mockResolvedValueOnce({});
    const res = await get("/runtimes");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ agentRuntimes: [], total: 0, nextToken: null });
  });

  it("gets runtime detail", async () => {
    mockControlSend.mockResolvedValueOnce({
      agentRuntimeArn: "arn:rt",
      agentRuntimeId: "rt-1",
      agentRuntimeName: "agent-a",
      agentRuntimeVersion: "1",
      description: "d",
      roleArn: "arn:role",
      status: "ACTIVE",
      createdAt: 111,
      lastUpdatedAt: 222,
    });
    const res = await get("/runtimes/rt-1");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.runtime.agentRuntimeName).toBe("agent-a");
    expect(json.runtime.createdAt).toBe("111");
    expect(mockControlSend.mock.calls[0][0]).toMatchObject({
      __cmdName: "GetAgentRuntimeCommand",
      agentRuntimeId: "rt-1",
    });
  });

  it("defaults optional detail fields when absent", async () => {
    mockControlSend.mockResolvedValueOnce({ agentRuntimeId: "rt-9" });
    const res = await get("/runtimes/rt-9");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      runtime: {
        agentRuntimeArn: undefined,
        agentRuntimeId: "rt-9",
        agentRuntimeName: undefined,
        agentRuntimeVersion: undefined,
        description: null,
        roleArn: null,
        status: undefined,
        createdAt: "",
        lastUpdatedAt: "",
      },
    });
  });

  it("creates a runtime", async () => {
    mockControlSend.mockResolvedValueOnce({
      agentRuntimeArn: "arn:new",
      agentRuntimeId: "rt-2",
      agentRuntimeVersion: "1",
      status: "CREATING",
    });
    const res = await post("/runtimes", {
      name: "agent-b",
      roleArn: "arn:role",
      containerUri: "123.dkr.ecr.us-east-1.amazonaws.com/img:latest",
    });
    expect(res.status).toBe(202);
    const json = await res.json();
    expect(json.agentRuntimeId).toBe("rt-2");
    expect(mockControlSend.mock.calls[0][0]).toMatchObject({
      __cmdName: "CreateAgentRuntimeCommand",
      agentRuntimeName: "agent-b",
    });
  });

  it("creates a runtime with defaults when artifact omitted entirely", async () => {
    mockControlSend.mockResolvedValueOnce({ agentRuntimeId: "rt-3", status: "CREATING" });
    const res = await post("/runtimes", { name: "agent-c", roleArn: "arn:role" });
    expect(res.status).toBe(202);
    const cmd = mockControlSend.mock.calls[0][0];
    expect(cmd.agentRuntimeArtifact).toEqual({
      containerConfiguration: { containerUri: "" },
    });
    expect(cmd.networkConfiguration).toEqual({ networkMode: "PUBLIC" });
  });

  it("rejects create without name", async () => {
    const res = await post("/runtimes", { roleArn: "r" });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "name is required" });
  });

  it("rejects create without roleArn", async () => {
    const res = await post("/runtimes", { name: "n" });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "roleArn is required" });
  });

  it("updates a runtime", async () => {
    mockControlSend.mockResolvedValueOnce({
      agentRuntimeArn: "arn:upd",
      agentRuntimeVersion: "2",
      status: "UPDATING",
    });
    const res = await patchReq("/runtimes/rt-1", { description: "new", roleArn: "arn:r2" });
    expect(res.status).toBe(202);
    expect(await res.json()).toEqual({
      agentRuntimeArn: "arn:upd",
      agentRuntimeVersion: "2",
      status: "UPDATING",
    });
    expect(mockControlSend.mock.calls[0][0]).toMatchObject({
      __cmdName: "UpdateAgentRuntimeCommand",
      agentRuntimeId: "rt-1",
    });
  });

  it("deletes a runtime", async () => {
    mockControlSend.mockResolvedValueOnce({ agentRuntimeId: "rt-1", status: "DELETED" });
    const res = await del("/runtimes/rt-1");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ agentRuntimeId: "rt-1", status: "DELETED" });
    expect(mockControlSend.mock.calls[0][0]).toMatchObject({
      __cmdName: "DeleteAgentRuntimeCommand",
      agentRuntimeId: "rt-1",
    });
  });

  it("invokes a runtime with string payload", async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('{"answer":"hi"}'));
        controller.close();
      },
    });
    mockDataSend.mockResolvedValueOnce({
      response: stream,
      contentType: "application/json",
    });
    const res = await post(
      "/invoke/arn%3Aaws%3Abedrock%3A%3A%3Aruntime%2Frt-1",
      { payload: '{"question":"hello?"}' }
    );
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('{"answer":"hi"}');
    expect(mockDataSend.mock.calls[0][0]).toMatchObject({
      __cmdName: "InvokeAgentRuntimeCommand",
      qualifier: "DEFAULT",
      contentType: "application/json",
    });
  });

  it("serializes object payloads as JSON and uses response fallback text", async () => {
    mockDataSend.mockResolvedValueOnce({ response: undefined, contentType: undefined });
    const res = await post("/invoke/arn%3Ax", { payload: { q: 1 } });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("");
    expect(mockDataSend.mock.calls[0][0].payload).toBe('{"q":1}');
  });

  it("rejects invoke without payload", async () => {
    const res = await post("/invoke/arn%3Ax", {});
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "payload is required" });
  });

  it("treats non-JSON invoke body as empty object then rejects", async () => {
    const res = await router.request("/invoke/arn%3Ax", {
      method: "POST",
      body: "not-json{{",
      headers: { "content-type": "application/json" },
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "payload is required" });
  });
});
