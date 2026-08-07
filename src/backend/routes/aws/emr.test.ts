import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const mockEMR = vi.hoisted(() =>
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

vi.mock("@aws-sdk/client-emr", () => ({
  EMRClient: mockEMR,
  RunJobFlowCommand: createCmd("RunJobFlowCommand"),
  DescribeClusterCommand: createCmd("DescribeClusterCommand"),
  ListClustersCommand: createCmd("ListClustersCommand"),
  TerminateJobFlowsCommand: createCmd("TerminateJobFlowsCommand"),
  SetTerminationProtectionCommand: createCmd("SetTerminationProtectionCommand"),
  ModifyClusterCommand: createCmd("ModifyClusterCommand"),
  AddJobFlowStepsCommand: createCmd("AddJobFlowStepsCommand"),
  DescribeStepCommand: createCmd("DescribeStepCommand"),
  ListStepsCommand: createCmd("ListStepsCommand"),
  CancelStepsCommand: createCmd("CancelStepsCommand"),
  AddInstanceGroupsCommand: createCmd("AddInstanceGroupsCommand"),
  ListInstanceGroupsCommand: createCmd("ListInstanceGroupsCommand"),
  AddInstanceFleetCommand: createCmd("AddInstanceFleetCommand"),
  ListInstanceFleetsCommand: createCmd("ListInstanceFleetsCommand"),
  ListInstancesCommand: createCmd("ListInstancesCommand"),
  CreateSecurityConfigurationCommand: createCmd("CreateSecurityConfigurationCommand"),
  DescribeSecurityConfigurationCommand: createCmd("DescribeSecurityConfigurationCommand"),
  DeleteSecurityConfigurationCommand: createCmd("DeleteSecurityConfigurationCommand"),
  ListSecurityConfigurationsCommand: createCmd("ListSecurityConfigurationsCommand"),
  AddTagsCommand: createCmd("AddTagsCommand"),
  RemoveTagsCommand: createCmd("RemoveTagsCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./emr";

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

async function patch(path: string, body?: any) {
  return router.request(path, {
    method: "PATCH",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { "content-type": "application/json" } : undefined,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSend.mockReset();
});

describe("EMR — Clusters", () => {
  it("GET /clusters — returns empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/clusters");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ clusters: [], total: 0 });
  });

  it("GET /clusters — returns clusters", async () => {
    mockSend.mockResolvedValueOnce({ Clusters: [{ Id: "j-123", Name: "test" }] });
    const res = await get("/clusters");
    const json = await res.json();
    expect(json.clusters).toHaveLength(1);
    expect(json.total).toBe(1);
  });

  it("GET /clusters/:id — returns single cluster", async () => {
    mockSend.mockResolvedValueOnce({ Cluster: { Id: "j-123", Name: "my-cluster" } });
    const res = await get("/clusters/j-123");
    const json = await res.json();
    expect(json.cluster).toEqual({ Id: "j-123", Name: "my-cluster" });
  });

  it("GET /clusters/:id — returns null when not found", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/clusters/nonexistent");
    const json = await res.json();
    expect(json.cluster).toBeNull();
  });

  it("POST /clusters — 400 when Name missing", async () => {
    const res = await post("/clusters", {});
    expect(res.status).toBe(400);
  });

  it("POST /clusters — runs job flow", async () => {
    mockSend.mockResolvedValueOnce({ JobFlowId: "j-123", ClusterArn: "arn:j-123" });
    const res = await post("/clusters", { Name: "test-cluster" });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.clusterId).toBe("j-123");
  });

  it("DELETE /clusters/:id — terminates job flows", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/clusters/j-123");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.terminated).toBe(true);
  });

  it("POST /clusters/:id/termination-protection — sets protection", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/clusters/j-123/termination-protection", { TerminationProtected: true });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.updated).toBe(true);
  });

  it("POST /clusters/:id/termination-protection — defaults TerminationProtected to true", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/clusters/j-123/termination-protection", {});
    expect(res.status).toBe(200);
    expect(mockSend.mock.calls[0][0].TerminationProtected).toBe(true);
  });

  it("PATCH /clusters/:id — modifies cluster", async () => {
    mockSend.mockResolvedValueOnce({ StepConcurrencyLevel: 2 });
    const res = await patch("/clusters/j-123", { StepConcurrencyLevel: 2 });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.stepConcurrencyLevel).toBe(2);
  });
});

describe("EMR — Steps", () => {
  it("GET /clusters/:id/steps — returns empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/clusters/j-123/steps");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ steps: [], total: 0 });
  });

  it("GET /clusters/:id/steps — returns steps", async () => {
    mockSend.mockResolvedValueOnce({ Steps: [{ Id: "s-1" }] });
    const res = await get("/clusters/j-123/steps");
    const json = await res.json();
    expect(json.steps).toHaveLength(1);
  });

  it("POST /clusters/:id/steps — 400 when Steps missing", async () => {
    const res = await post("/clusters/j-123/steps", {});
    expect(res.status).toBe(400);
  });

  it("POST /clusters/:id/steps — adds steps", async () => {
    mockSend.mockResolvedValueOnce({ StepIds: ["s-1"] });
    const res = await post("/clusters/j-123/steps", { Steps: [{ Name: "step1" }] });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.stepIds).toEqual(["s-1"]);
  });

  it("POST /clusters/:id/steps — sparse response falls back to empty stepIds", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/clusters/j-123/steps", { Steps: [{ Name: "step1" }] });
    expect(res.status).toBe(201);
    expect((await res.json()).stepIds).toEqual([]);
  });

  it("GET /clusters/:clusterId/steps/:stepId — returns single step", async () => {
    mockSend.mockResolvedValueOnce({ Step: { Id: "s-1", Name: "step1" } });
    const res = await get("/clusters/j-123/steps/s-1");
    const json = await res.json();
    expect(json.step).toEqual({ Id: "s-1", Name: "step1" });
  });

  it("GET /clusters/:clusterId/steps/:stepId — null when Step missing", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/clusters/j-123/steps/s-missing");
    expect((await res.json()).step).toBeNull();
  });

  it("POST /clusters/:id/steps/cancel — 400 when StepIds missing", async () => {
    const res = await post("/clusters/j-123/steps/cancel", {});
    expect(res.status).toBe(400);
  });

  it("POST /clusters/:id/steps/cancel — cancels steps", async () => {
    mockSend.mockResolvedValueOnce({ CancelStepsInfoList: [{ Status: "CANCELLED" }] });
    const res = await post("/clusters/j-123/steps/cancel", { StepIds: ["s-1"] });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.cancelStepsInfoList).toHaveLength(1);
  });

  it("POST /clusters/:id/steps/cancel — sparse response falls back to empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/clusters/j-123/steps/cancel", { StepIds: ["s-1"] });
    expect((await res.json()).cancelStepsInfoList).toEqual([]);
  });
});

describe("EMR — Instance Groups & Fleets", () => {
  it("GET /clusters/:id/instance-groups — returns list", async () => {
    mockSend.mockResolvedValueOnce({ InstanceGroups: [{ InstanceGroupId: "ig-1" }] });
    const res = await get("/clusters/j-123/instance-groups");
    const json = await res.json();
    expect(json.instanceGroups).toHaveLength(1);
  });

  it("GET /clusters/:id/instance-groups — empty when InstanceGroups key missing", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/clusters/j-123/instance-groups");
    const json = await res.json();
    expect(json.instanceGroups).toEqual([]);
    expect(json.total).toBe(0);
  });

  it("POST /clusters/:id/instance-groups — 400 when InstanceGroups missing", async () => {
    const res = await post("/clusters/j-123/instance-groups", {});
    expect(res.status).toBe(400);
  });

  it("POST /clusters/:id/instance-groups — adds groups", async () => {
    mockSend.mockResolvedValueOnce({ InstanceGroupIds: ["ig-1"] });
    const res = await post("/clusters/j-123/instance-groups", { InstanceGroups: [{ InstanceRole: "CORE" }] });
    expect(res.status).toBe(201);
  });

  it("POST /clusters/:id/instance-groups — sparse response falls back to empty ids", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/clusters/j-123/instance-groups", { InstanceGroups: [{ InstanceRole: "CORE" }] });
    expect(res.status).toBe(201);
    expect((await res.json()).instanceGroupIds).toEqual([]);
  });

  it("GET /clusters/:id/instance-fleets — returns list", async () => {
    mockSend.mockResolvedValueOnce({ InstanceFleets: [{ InstanceFleetId: "if-1" }] });
    const res = await get("/clusters/j-123/instance-fleets");
    const json = await res.json();
    expect(json.instanceFleets).toHaveLength(1);
  });

  it("GET /clusters/:id/instance-fleets — empty when InstanceFleets key missing", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/clusters/j-123/instance-fleets");
    const json = await res.json();
    expect(json.instanceFleets).toEqual([]);
    expect(json.total).toBe(0);
  });

  it("POST /clusters/:id/instance-fleets — 400 when InstanceFleet missing", async () => {
    const res = await post("/clusters/j-123/instance-fleets", {});
    expect(res.status).toBe(400);
  });

  it("POST /clusters/:id/instance-fleets — adds fleet", async () => {
    mockSend.mockResolvedValueOnce({ InstanceFleetId: "if-1" });
    const res = await post("/clusters/j-123/instance-fleets", { InstanceFleet: { InstanceFleetType: "CORE" } });
    expect(res.status).toBe(201);
  });

  it("GET /clusters/:id/instances — returns list", async () => {
    mockSend.mockResolvedValueOnce({ Instances: [{ InstanceId: "i-1" }] });
    const res = await get("/clusters/j-123/instances");
    const json = await res.json();
    expect(json.instances).toHaveLength(1);
  });

  it("GET /clusters/:id/instances — empty when Instances key missing", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/clusters/j-123/instances");
    const json = await res.json();
    expect(json.instances).toEqual([]);
    expect(json.total).toBe(0);
  });
});

describe("EMR — Security Configurations", () => {
  it("GET /security-configurations — returns empty", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/security-configurations");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ securityConfigurations: [], total: 0 });
  });

  it("GET /security-configurations — returns configs", async () => {
    mockSend.mockResolvedValueOnce({ SecurityConfigurations: [{ Name: "sc1" }] });
    const res = await get("/security-configurations");
    const json = await res.json();
    expect(json.securityConfigurations).toHaveLength(1);
  });

  it("POST /security-configurations — 400 when Name missing", async () => {
    const res = await post("/security-configurations", { SecurityConfiguration: "{}" });
    expect(res.status).toBe(400);
  });

  it("POST /security-configurations — 400 when SecurityConfiguration missing", async () => {
    const res = await post("/security-configurations", { Name: "sc1" });
    expect(res.status).toBe(400);
  });

  it("POST /security-configurations — creates config", async () => {
    mockSend.mockResolvedValueOnce({ Name: "sc1", CreationDateTime: new Date() });
    const res = await post("/security-configurations", { Name: "sc1", SecurityConfiguration: "{}" });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.name).toBe("sc1");
  });

  it("GET /security-configurations/:name — returns single", async () => {
    mockSend.mockResolvedValueOnce({ Name: "sc1" });
    const res = await get("/security-configurations/sc1");
    const json = await res.json();
    expect(json.securityConfiguration.Name).toBe("sc1");
  });

  it("GET /security-configurations/:name — null when response empty", async () => {
    mockSend.mockResolvedValueOnce(undefined as any);
    const res = await get("/security-configurations/sc-missing");
    expect((await res.json()).securityConfiguration).toBeNull();
  });

  it("DELETE /security-configurations/:name — deletes", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/security-configurations/sc1");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.deleted).toBe(true);
  });
});

describe("EMR — Tags", () => {
  it("POST /clusters/:id/tags — 400 when Tags missing", async () => {
    const res = await post("/clusters/j-123/tags", {});
    expect(res.status).toBe(400);
  });

  it("POST /clusters/:id/tags — adds tags", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/clusters/j-123/tags", { Tags: [{ Key: "env", Value: "test" }] });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.added).toBe(true);
  });

  it("POST /clusters/:id/tags/remove — 400 when TagKeys missing", async () => {
    const res = await post("/clusters/j-123/tags/remove", {});
    expect(res.status).toBe(400);
  });

  it("POST /clusters/:id/tags/remove — removes tags", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/clusters/j-123/tags/remove", { TagKeys: ["env"] });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.removed).toBe(true);
  });
});
