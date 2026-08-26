import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) {
      return { __cmdName: name, ...args };
    });
  };
});

vi.mock("@aws-sdk/client-swf", () => ({
  SWFClient: vi.fn(function () {
    return { send: mockSend };
  }),
  ListDomainsCommand: createCmd("ListDomainsCommand"),
  DescribeDomainCommand: createCmd("DescribeDomainCommand"),
  RegisterDomainCommand: createCmd("RegisterDomainCommand"),
  DeprecateDomainCommand: createCmd("DeprecateDomainCommand"),
  UndeprecateDomainCommand: createCmd("UndeprecateDomainCommand"),
  ListWorkflowTypesCommand: createCmd("ListWorkflowTypesCommand"),
  DescribeWorkflowTypeCommand: createCmd("DescribeWorkflowTypeCommand"),
  RegisterWorkflowTypeCommand: createCmd("RegisterWorkflowTypeCommand"),
  DeprecateWorkflowTypeCommand: createCmd("DeprecateWorkflowTypeCommand"),
  UndeprecateWorkflowTypeCommand: createCmd("UndeprecateWorkflowTypeCommand"),
  DeleteWorkflowTypeCommand: createCmd("DeleteWorkflowTypeCommand"),
  ListActivityTypesCommand: createCmd("ListActivityTypesCommand"),
  DescribeActivityTypeCommand: createCmd("DescribeActivityTypeCommand"),
  RegisterActivityTypeCommand: createCmd("RegisterActivityTypeCommand"),
  DeprecateActivityTypeCommand: createCmd("DeprecateActivityTypeCommand"),
  UndeprecateActivityTypeCommand: createCmd("UndeprecateActivityTypeCommand"),
  DeleteActivityTypeCommand: createCmd("DeleteActivityTypeCommand"),
  ListOpenWorkflowExecutionsCommand: createCmd("ListOpenWorkflowExecutionsCommand"),
  ListClosedWorkflowExecutionsCommand: createCmd("ListClosedWorkflowExecutionsCommand"),
  StartWorkflowExecutionCommand: createCmd("StartWorkflowExecutionCommand"),
  DescribeWorkflowExecutionCommand: createCmd("DescribeWorkflowExecutionCommand"),
  GetWorkflowExecutionHistoryCommand: createCmd("GetWorkflowExecutionHistoryCommand"),
  TerminateWorkflowExecutionCommand: createCmd("TerminateWorkflowExecutionCommand"),
  SignalWorkflowExecutionCommand: createCmd("SignalWorkflowExecutionCommand"),
  RequestCancelWorkflowExecutionCommand: createCmd("RequestCancelWorkflowExecutionCommand"),
  ListTagsForResourceCommand: createCmd("ListTagsForResourceCommand"),
  TagResourceCommand: createCmd("TagResourceCommand"),
  UntagResourceCommand: createCmd("UntagResourceCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: (Ctor: any, extra?: any) => new Ctor(extra),
}));

import router from "./swf";

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

async function put(path: string, body?: any) {
  return router.request(path, {
    method: "PUT",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { "content-type": "application/json" } : undefined,
  });
}

async function del(path: string, body?: any) {
  return router.request(path, {
    method: "DELETE",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { "content-type": "application/json" } : undefined,
  });
}

beforeEach(() => {
  mockSend.mockReset();
});

describe("SWF Routes — Domains", () => {
  it("GET /swf/domains lists domains", async () => {
    mockSend.mockResolvedValueOnce({
      domainInfos: [{ name: "d1", status: "REGISTERED" }],
    });
    const res = await get("/domains");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.domains[0].name).toBe("d1");
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.registrationStatus).toBe("REGISTERED");
  });

  it("GET /swf/domains honors registrationStatus query", async () => {
    mockSend.mockResolvedValueOnce({ domainInfos: [] });
    await get("/domains?registrationStatus=DEPRECATED");
    expect(mockSend.mock.calls[0][0].registrationStatus).toBe("DEPRECATED");
  });

  it("GET /swf/domains returns empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/domains");
    expect((await res.json()).total).toBe(0);
  });

  it("GET /swf/domains/:name describes a domain", async () => {
    mockSend.mockResolvedValueOnce({ domainInfo: { name: "d1" } });
    const res = await get("/domains/d1");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.domain.domainInfo.name).toBe("d1");
  });

  it("POST /swf/domains registers a domain", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/domains", {
      name: "new-domain",
      description: "test",
      workflowExecutionRetentionPeriodInDays: "90",
      tags: { env: "dev" },
    });
    expect(res.status).toBe(201);
    expect((await res.json()).created).toBe(true);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.name).toBe("new-domain");
    expect(cmd.workflowExecutionRetentionPeriodInDays).toBe("90");
    expect(cmd.tags).toEqual([{ key: "env", value: "dev" }]);
  });

  it("POST /swf/domains defaults retention to 30 days and drops empty tags", async () => {
    mockSend.mockResolvedValueOnce({});
    await post("/domains", { name: "d" });
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.workflowExecutionRetentionPeriodInDays).toBe("30");
    expect(cmd.tags).toBeUndefined();
    expect(cmd.description).toBeUndefined();
  });

  it("POST /swf/domains returns 400 without name", async () => {
    const res = await post("/domains", {});
    expect(res.status).toBe(400);
  });

  it("POST /swf/domains/:name/deprecates a domain", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/domains/d1/deprecate");
    expect(res.status).toBe(200);
    expect(mockSend.mock.calls[0][0].name).toBe("d1");
  });

  it("POST /swf/domains/:name/undeprecates a domain", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/domains/d1/undeprecate");
    expect(res.status).toBe(200);
    expect((await res.json()).undeprecated).toBe(true);
  });
});

describe("SWF Routes — Workflow Types", () => {
  it("GET /swf/workflow-types lists types", async () => {
    mockSend.mockResolvedValueOnce({
      typeInfos: [{ workflowType: { name: "w1", version: "1" } }],
    });
    const res = await get("/workflow-types?domain=d1");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(mockSend.mock.calls[0][0].domain).toBe("d1");
  });

  it("GET /swf/workflow-types returns 400 without domain", async () => {
    const res = await get("/workflow-types");
    expect(res.status).toBe(400);
  });

  it("GET /swf/workflow-types/detail describes a type", async () => {
    mockSend.mockResolvedValueOnce({ typeInfo: {}, configuration: {} });
    const res = await get("/workflow-types/detail?domain=d1&name=w1&version=1");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.typeInfo).toEqual({});
    expect(body.configuration).toEqual({});
  });

  it("GET /swf/workflow-types/detail returns 400 when missing params", async () => {
    const res = await get("/workflow-types/detail?domain=d1&name=w1");
    expect(res.status).toBe(400);
  });

  it("POST /swf/workflow-types registers a workflow type", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/workflow-types", {
      domain: "d1",
      name: "w1",
      version: "2",
      description: "desc",
      defaultTaskStartToCloseTimeout: "60",
      defaultExecutionStartToCloseTimeout: "3600",
      defaultTaskList: "main",
      defaultChildPolicy: "TERMINATE",
    });
    expect(res.status).toBe(201);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.defaultTaskList).toEqual({ name: "main" });
    expect(cmd.defaultChildPolicy).toBe("TERMINATE");
  });

  it("POST /swf/workflow-types works with minimal payload", async () => {
    mockSend.mockResolvedValueOnce({});
    await post("/workflow-types", { domain: "d1", name: "w1", version: "1" });
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.description).toBeUndefined();
    expect(cmd.defaultTaskList).toBeUndefined();
  });

  it.each([
    ["domain"],
    ["name"],
    ["version"],
  ])("POST /swf/workflow-types returns 400 without %s", async (field) => {
    const body: any = { domain: "d1", name: "w1", version: "1" };
    delete body[field];
    const res = await post("/workflow-types", body);
    expect(res.status).toBe(400);
  });

  it("POST /swf/workflow-types/deprecate deprecates a type", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/workflow-types/deprecate", { domain: "d1", name: "w1", version: "1" });
    expect((await res.json()).deprecated).toBe(true);
    expect(mockSend.mock.calls[0][0].workflowType).toEqual({ name: "w1", version: "1" });
  });

  it("POST /swf/workflow-types/deprecate returns 400 when missing params", async () => {
    const res = await post("/workflow-types/deprecate", { domain: "d1", name: "w1" });
    expect(res.status).toBe(400);
  });

  it("POST /swf/workflow-types/undeprecate undeprecates a type", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/workflow-types/undeprecate", { domain: "d1", name: "w1", version: "1" });
    expect(res.status).toBe(200);
    expect((await res.json()).undeprecated).toBe(true);
  });

  it("POST /swf/workflow-types/undeprecate returns 400 when missing params", async () => {
    const res = await post("/workflow-types/undeprecate", { domain: "d1", version: "1" });
    expect(res.status).toBe(400);
  });

  it("DELETE /swf/workflow-types deletes a type", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/workflow-types", { domain: "d1", name: "w1", version: "1" });
    expect((await res.json()).deleted).toBe(true);
  });

  it("DELETE /swf/workflow-types returns 400 when missing params", async () => {
    const res = await del("/workflow-types", { name: "w1", version: "1" });
    expect(res.status).toBe(400);
  });
});

describe("SWF Routes — Activity Types", () => {
  it("GET /swf/activity-types lists activity types", async () => {
    mockSend.mockResolvedValueOnce({
      typeInfos: [{ activityType: { name: "a1", version: "1" } }],
    });
    const res = await get("/activity-types?domain=d1");
    expect((await res.json()).total).toBe(1);
  });

  it("GET /swf/activity-types returns 400 without domain", async () => {
    expect((await get("/activity-types")).status).toBe(400);
  });

  it("GET /swf/activity-types/detail describes an activity type", async () => {
    mockSend.mockResolvedValueOnce({ typeInfo: {}, configuration: {} });
    const res = await get("/activity-types/detail?domain=d1&name=a1&version=1");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.typeInfo).toBeDefined();
  });

  it("GET /swf/activity-types/detail returns 400 when missing params", async () => {
    expect((await get("/activity-types/detail?domain=d1")).status).toBe(400);
  });

  it("POST /swf/activity-types registers an activity type with all defaults", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/activity-types", {
      domain: "d1",
      name: "a1",
      version: "1",
      defaultTaskStartToCloseTimeout: "60",
      defaultTaskHeartbeatTimeout: "30",
      defaultTaskList: "tasks",
      defaultTaskScheduleToStartTimeout: "60",
      defaultTaskScheduleToCloseTimeout: "120",
    });
    expect(res.status).toBe(201);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.defaultTaskList).toEqual({ name: "tasks" });
    expect(cmd.defaultTaskHeartbeatTimeout).toBe("30");
  });

  it("POST /swf/activity-types works with minimal payload", async () => {
    mockSend.mockResolvedValueOnce({});
    await post("/activity-types", { domain: "d1", name: "a1", version: "1" });
    expect(mockSend.mock.calls[0][0].defaultTaskList).toBeUndefined();
  });

  it.each([
    ["domain"],
    ["name"],
    ["version"],
  ])("POST /swf/activity-types returns 400 without %s", async (field) => {
    const body: any = { domain: "d1", name: "a1", version: "1" };
    delete body[field];
    expect((await post("/activity-types", body)).status).toBe(400);
  });

  it("POST /swf/activity-types/deprecate deprecates an activity type", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/activity-types/deprecate", { domain: "d1", name: "a1", version: "1" });
    expect((await res.json()).deprecated).toBe(true);
  });

  it("POST /swf/activity-types/deprecate returns 400 when missing params", async () => {
    expect((await post("/activity-types/deprecate", { domain: "d1" })).status).toBe(400);
  });

  it("POST /swf/activity-types/undeprecate undeprecates an activity type", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/activity-types/undeprecate", { domain: "d1", name: "a1", version: "1" });
    expect((await res.json()).undeprecated).toBe(true);
  });

  it("POST /swf/activity-types/undeprecate returns 400 when missing params", async () => {
    expect((await post("/activity-types/undeprecate", { name: "a1" })).status).toBe(400);
  });

  it("DELETE /swf/activity-types deletes an activity type", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/activity-types", { domain: "d1", name: "a1", version: "1" });
    expect((await res.json()).deleted).toBe(true);
  });

  it("DELETE /swf/activity-types returns 400 when missing params", async () => {
    expect((await del("/activity-types", { domain: "d1", version: "1" })).status).toBe(400);
  });
});

describe("SWF Routes — Executions", () => {
  it("GET /swf/executions/open lists open executions", async () => {
    mockSend.mockResolvedValueOnce({
      executionInfos: [{ execution: { workflowId: "e1", runId: "r1" } }],
    });
    const res = await get("/executions/open?domain=d1&startedAfter=2024-01-01T00:00:00Z");
    expect((await res.json()).total).toBe(1);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.startTimeFilter.oldestDate).toEqual(new Date("2024-01-01T00:00:00Z"));
  });

  it("GET /swf/executions/open defaults oldestDate to epoch", async () => {
    mockSend.mockResolvedValueOnce({ executionInfos: [] });
    await get("/executions/open?domain=d1");
    expect(mockSend.mock.calls[0][0].startTimeFilter.oldestDate).toEqual(new Date(0));
  });

  it("GET /swf/executions/open returns 400 without domain", async () => {
    expect((await get("/executions/open")).status).toBe(400);
  });

  it("GET /swf/executions/closed lists closed executions", async () => {
    mockSend.mockResolvedValueOnce({
      executionInfos: [{ execution: { workflowId: "e1" }, closeStatus: "COMPLETED" }],
    });
    const res = await get("/executions/closed?domain=d1");
    expect((await res.json()).total).toBe(1);
  });

  it("GET /swf/executions/closed returns 400 without domain", async () => {
    expect((await get("/executions/closed")).status).toBe(400);
  });

  it("POST /swf/executions starts a workflow execution", async () => {
    mockSend.mockResolvedValueOnce({ runId: "run-1234567890" });
    const res = await post("/executions", {
      domain: "d1",
      workflowId: "wf-1",
      workflowTypeName: "w1",
      workflowTypeVersion: "1",
      taskList: "main",
      input: "{}",
      executionStartToCloseTimeout: "3600",
      taskStartToCloseTimeout: "60",
      childPolicy: "TERMINATE",
      tagList: ["t1"],
    });
    expect(res.status).toBe(201);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.taskList).toEqual({ name: "main" });
    expect(cmd.tagList).toEqual(["t1"]);
  });

  it("POST /swf/executions works with minimal payload", async () => {
    mockSend.mockResolvedValueOnce({ runId: "r" });
    await post("/executions", {
      domain: "d1",
      workflowId: "wf-1",
      workflowTypeName: "w1",
      workflowTypeVersion: "1",
    });
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.taskList).toBeUndefined();
    expect(cmd.input).toBeUndefined();
  });

  it.each([
    ["domain"],
    ["workflowId"],
    ["workflowTypeName"],
    ["workflowTypeVersion"],
  ])("POST /swf/executions returns 400 without %s", async (field) => {
    const body: any = {
      domain: "d1",
      workflowId: "wf-1",
      workflowTypeName: "w1",
      workflowTypeVersion: "1",
    };
    delete body[field];
    expect((await post("/executions", body)).status).toBe(400);
  });

  it("GET /swf/executions/detail describes an execution", async () => {
    mockSend.mockResolvedValueOnce({ executionInfo: { execution: { workflowId: "e1" } } });
    const res = await get("/executions/detail?domain=d1&workflowId=e1&runId=r1");
    const body = await res.json();
    expect(body.executionInfo.execution.workflowId).toBe("e1");
  });

  it("GET /swf/executions/detail returns 400 when missing params", async () => {
    expect((await get("/executions/detail?domain=d1&workflowId=e1")).status).toBe(400);
  });

  it("GET /swf/executions/history lists events", async () => {
    mockSend.mockResolvedValueOnce({ events: [{ eventId: 1 }] });
    const res = await get("/executions/history?domain=d1&workflowId=e1&runId=r1");
    const body = await res.json();
    expect(body.total).toBe(1);
  });

  it("GET /swf/executions/history returns empty list on sparse response", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/executions/history?domain=d1&workflowId=e1&runId=r1");
    expect((await res.json()).total).toBe(0);
  });

  it("GET /swf/executions/history returns 400 when missing params", async () => {
    expect((await get("/executions/history?domain=d1&runId=r1")).status).toBe(400);
  });

  it("POST /swf/executions/terminate terminates an execution", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/executions/terminate", {
      domain: "d1",
      workflowId: "e1",
      runId: "r1",
      reason: "done",
    });
    expect((await res.json()).terminated).toBe(true);
  });

  it("POST /swf/executions/terminate works without optional fields", async () => {
    mockSend.mockResolvedValueOnce({});
    await post("/executions/terminate", { domain: "d1", workflowId: "e1" });
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.runId).toBeUndefined();
    expect(cmd.reason).toBeUndefined();
  });

  it.each(["domain", "workflowId"])(
    "POST /swf/executions/terminate returns 400 without %s",
    async (field) => {
      const body: any = { domain: "d1", workflowId: "e1" };
      delete body[field];
      expect((await post("/executions/terminate", body)).status).toBe(400);
    }
  );

  it("POST /swf/executions/signal signals an execution", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/executions/signal", {
      domain: "d1",
      workflowId: "e1",
      signalName: "go",
      input: "{}",
    });
    expect((await res.json()).signaled).toBe(true);
  });

  it("POST /swf/executions/signal works without input", async () => {
    mockSend.mockResolvedValueOnce({});
    await post("/executions/signal", { domain: "d1", workflowId: "e1", signalName: "go" });
    expect(mockSend.mock.calls[0][0].input).toBeUndefined();
  });

  it.each(["domain", "workflowId", "signalName"])(
    "POST /swf/executions/signal returns 400 without %s",
    async (field) => {
      const body: any = { domain: "d1", workflowId: "e1", signalName: "go" };
      delete body[field];
      expect((await post("/executions/signal", body)).status).toBe(400);
    }
  );

  it("POST /swf/executions/request-cancel requests cancellation", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/executions/request-cancel", {
      domain: "d1",
      workflowId: "e1",
      runId: "r1",
    });
    expect((await res.json()).cancelRequested).toBe(true);
  });

  it("POST /swf/executions/request-cancel works without runId", async () => {
    mockSend.mockResolvedValueOnce({});
    await post("/executions/request-cancel", { domain: "d1", workflowId: "e1" });
    expect(mockSend.mock.calls[0][0].runId).toBeUndefined();
  });

  it.each(["domain", "workflowId"])(
    "POST /swf/executions/request-cancel returns 400 without %s",
    async (field) => {
      const body: any = { domain: "d1", workflowId: "e1" };
      delete body[field];
      expect((await post("/executions/request-cancel", body)).status).toBe(400);
    }
  );
});

describe("SWF Routes — Tags", () => {
  it("GET /swf/tags lists resource tags", async () => {
    mockSend.mockResolvedValueOnce({ tags: [{ key: "env", value: "dev" }] });
    const res = await get("/tags?resourceArn=arn:swf");
    expect((await res.json()).tags).toHaveLength(1);
  });

  it("GET /swf/tags defaults sparse response to empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/tags?resourceArn=arn:swf");
    expect((await res.json()).tags).toEqual([]);
  });

  it("GET /swf/tags returns 400 without resourceArn", async () => {
    expect((await get("/tags")).status).toBe(400);
  });

  it("PUT /swf/tags adds resource tags", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await put("/tags", {
      resourceArn: "arn:swf",
      tagsToAdd: { env: "prod" },
    });
    expect((await res.json()).tagged).toBe(true);
    expect(mockSend.mock.calls[0][0].tags).toEqual([{ key: "env", value: "prod" }]);
  });

  it("PUT /swf/tags returns 400 without resourceArn", async () => {
    expect((await put("/tags", { tagsToAdd: { a: "b" } })).status).toBe(400);
  });

  it("PUT /swf/tags returns 400 with empty tagsToAdd", async () => {
    expect((await put("/tags", { resourceArn: "arn:swf", tagsToAdd: {} })).status).toBe(400);
  });

  it("DELETE /swf/tags removes resource tags", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/tags", { resourceArn: "arn:swf", tagKeys: ["env"] });
    expect((await res.json()).untagged).toBe(true);
    expect(mockSend.mock.calls[0][0].tagKeys).toEqual(["env"]);
  });

  it("DELETE /swf/tags returns 400 without resourceArn", async () => {
    expect((await del("/tags", { tagKeys: ["env"] })).status).toBe(400);
  });

  it("DELETE /swf/tags returns 400 with empty tagKeys", async () => {
    expect((await del("/tags", { resourceArn: "arn:swf", tagKeys: [] })).status).toBe(400);
  });
});

describe("SWF empty-list fallback arms", () => {
  it("GET /swf/workflow-types handles missing typeInfos", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/workflow-types?domain=d1");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.domains ?? body.typeInfos).toEqual([]);
  });

  it("GET /swf/activity-types handles missing typeInfos", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/activity-types?domain=d1");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.typeInfos ?? body.domains).toEqual([]);
  });

  it("GET /swf/executions/open handles missing executionInfos", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/executions/open?domain=d1");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.executionInfos).toEqual([]);
  });

  it("GET /swf/executions/closed handles missing executionInfos", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/executions/closed?domain=d1");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.executionInfos).toEqual([]);
  });
});

  it("PUT /swf/tags returns 400 when tagsToAdd is absent", async () => {
    expect((await put("/tags", { resourceArn: "arn:swf" })).status).toBe(400);
  });
