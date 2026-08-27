import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) {
      return { __cmdName: name, ...args };
    });
  };
});

vi.mock("@aws-sdk/client-fis", () => ({
  FisClient: vi.fn(function () {
    return { send: mockSend };
  }),
  ListExperimentTemplatesCommand: createCmd("ListExperimentTemplatesCommand"),
  GetExperimentTemplateCommand: createCmd("GetExperimentTemplateCommand"),
  CreateExperimentTemplateCommand: createCmd("CreateExperimentTemplateCommand"),
  UpdateExperimentTemplateCommand: createCmd("UpdateExperimentTemplateCommand"),
  DeleteExperimentTemplateCommand: createCmd("DeleteExperimentTemplateCommand"),
  ListExperimentsCommand: createCmd("ListExperimentsCommand"),
  GetExperimentCommand: createCmd("GetExperimentCommand"),
  StartExperimentCommand: createCmd("StartExperimentCommand"),
  StopExperimentCommand: createCmd("StopExperimentCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./fis";

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
  mockSend.mockReset();
});

describe("FIS routes", () => {
  it("lists experiment templates", async () => {
    mockSend.mockResolvedValueOnce({
      experimentTemplates: [
        { id: "tpl-1", description: "d", state: { status: "available" } },
      ],
    });
    const res = await get("/experiment-templates");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.experimentTemplates).toHaveLength(1);
    expect(json.total).toBe(1);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("ListExperimentTemplatesCommand");
  });

  it("returns empty templates list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/experiment-templates");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ experimentTemplates: [], total: 0 });
  });

  it("gets template detail", async () => {
    mockSend.mockResolvedValueOnce({
      experimentTemplate: {
        id: "tpl-1",
        description: "desc",
        title: "My Template",
        state: { status: "available" },
        targets: { t1: {}, t2: {} },
        actions: { a1: {} },
        stopConditions: [{ source: "none" }],
        roleArn: "arn:role",
        tags: {},
      },
    });
    const res = await get("/experiment-templates/tpl-1");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.experimentTemplate.title).toBe("My Template");
    expect(json.experimentTemplate.targets).toEqual(["t1", "t2"]);
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      __cmdName: "GetExperimentTemplateCommand",
      id: "tpl-1",
    });
  });

  it("returns null template when missing", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/experiment-templates/nope");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ experimentTemplate: null });
  });

  it("defaults optional template detail fields when absent", async () => {
    mockSend.mockResolvedValueOnce({
      experimentTemplate: {
        id: "tpl-2",
        state: { status: "unavailable" },
        stopConditions: null,
        tags: null,
      },
    });
    const res = await get("/experiment-templates/tpl-2");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      experimentTemplate: {
        id: "tpl-2",
        description: null,
        title: null,
        state: "unavailable",
        targets: [],
        actions: [],
        stopConditions: [],
        roleArn: null,
        tags: {},
      },
    });
  });

  it("creates a template", async () => {
    mockSend.mockResolvedValueOnce({
      experimentTemplate: { id: "tpl-new", state: { status: "available" } },
    });
    const res = await post("/experiment-templates", {
      name: "tpl",
      description: "d",
      roleArn: "arn:role",
      actions: { a: {} },
    });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ id: "tpl-new", state: "available" });
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      __cmdName: "CreateExperimentTemplateCommand",
      tags: { Name: "tpl" },
      stopConditions: [{ source: "none" }],
    });
  });

  it("rejects create without description", async () => {
    const res = await post("/experiment-templates", { roleArn: "r", actions: {} });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "description is required" });
  });

  it("rejects create without roleArn", async () => {
    const res = await post("/experiment-templates", { description: "d", actions: {} });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "roleArn is required" });
  });

  it("rejects create without actions", async () => {
    const res = await post("/experiment-templates", { description: "d", roleArn: "r" });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "actions are required" });
  });

  it("creates a template with defaults for omitted optional fields", async () => {
    mockSend.mockResolvedValueOnce({ experimentTemplate: { id: "tpl-3" } });
    const res = await post("/experiment-templates", {
      description: "d",
      roleArn: "arn:role",
      actions: { a: {} },
    });
    expect(res.status).toBe(201);
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      __cmdName: "CreateExperimentTemplateCommand",
      targets: {},
      tags: { Name: "" },
      stopConditions: [{ source: "none" }],
    });
  });

  it("updates a template", async () => {
    mockSend.mockResolvedValueOnce({
      experimentTemplate: { id: "tpl-1", state: { status: "available" } },
    });
    const res = await patchReq("/experiment-templates/tpl-1", {
      description: "new-desc",
      roleArn: "arn:r2",
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: "tpl-1", state: "available" });
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      __cmdName: "UpdateExperimentTemplateCommand",
      id: "tpl-1",
      description: "new-desc",
    });
  });

  it("returns null state when update response lacks it", async () => {
    mockSend.mockResolvedValueOnce({ experimentTemplate: {} });
    const res = await patchReq("/experiment-templates/tpl-x", {});
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: undefined, state: null });
  });

  it("deletes a template", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/experiment-templates/tpl-1");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ deleted: true });
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      __cmdName: "DeleteExperimentTemplateCommand",
      id: "tpl-1",
    });
  });

  it("lists experiments", async () => {
    mockSend.mockResolvedValueOnce({
      experiments: [{ id: "exp-1" }],
    });
    const res = await get("/experiments");
    expect(res.status).toBe(200);
    expect((await res.json()).total).toBe(1);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("ListExperimentsCommand");
  });

  it("returns empty experiments list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/experiments");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ experiments: [], total: 0 });
  });

  it("gets experiment detail with instants", async () => {
    mockSend.mockResolvedValueOnce({
      experiment: {
        id: "exp-1",
        experimentTemplateId: "tpl-1",
        state: { status: "running" },
        startTime: 111,
        endTime: 222,
        stopReason: "manual",
      },
    });
    const res = await get("/experiments/exp-1");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.experiment.state).toBe("running");
    expect(json.experiment.startTime).toBe("111");
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      __cmdName: "GetExperimentCommand",
      id: "exp-1",
    });
  });

  it("defaults optional experiment fields when absent", async () => {
    mockSend.mockResolvedValueOnce({ experiment: { id: "exp-2", state: {} } });
    const res = await get("/experiments/exp-2");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      experiment: {
        id: "exp-2",
        templateId: null,
        state: null,
        startTime: "",
        endTime: "",
        stopReason: null,
      },
    });
  });

  it("returns null experiment when absent", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/experiments/exp-x");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ experiment: null });
  });

  it("starts an experiment", async () => {
    mockSend.mockResolvedValueOnce({
      experiment: { id: "exp-2", state: { status: "pending" } },
    });
    const res = await post("/experiments", { templateId: "tpl-1" });
    expect(res.status).toBe(202);
    expect(await res.json()).toEqual({ id: "exp-2", state: "pending" });
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      __cmdName: "StartExperimentCommand",
      experimentTemplateId: "tpl-1",
    });
  });

  it("rejects start without templateId", async () => {
    const res = await post("/experiments", {});
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "templateId is required" });
  });

  it("start tolerates absent experiment in response", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/experiments", { templateId: "tpl-1" });
    expect(res.status).toBe(202);
    expect(await res.json()).toEqual({ id: undefined, state: null });
  });

  it("stops an experiment via DELETE", async () => {
    mockSend.mockResolvedValueOnce({
      experiment: { id: "exp-1", state: { status: "stopping" } },
    });
    const res = await del("/experiments/exp-1");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: "exp-1", state: "stopping" });
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      __cmdName: "StopExperimentCommand",
      id: "exp-1",
    });
  });
});
