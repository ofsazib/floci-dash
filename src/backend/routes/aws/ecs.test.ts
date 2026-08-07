import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const mockECS = vi.hoisted(() =>
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

vi.mock("@aws-sdk/client-ecs", () => ({
  ECSClient: mockECS,
  ListClustersCommand: createCmd("ListClustersCommand"),
  DescribeClustersCommand: createCmd("DescribeClustersCommand"),
  CreateClusterCommand: createCmd("CreateClusterCommand"),
  DeleteClusterCommand: createCmd("DeleteClusterCommand"),
  UpdateClusterCommand: createCmd("UpdateClusterCommand"),
  ListTaskDefinitionsCommand: createCmd("ListTaskDefinitionsCommand"),
  DescribeTaskDefinitionCommand: createCmd("DescribeTaskDefinitionCommand"),
  RegisterTaskDefinitionCommand: createCmd("RegisterTaskDefinitionCommand"),
  DeregisterTaskDefinitionCommand: createCmd("DeregisterTaskDefinitionCommand"),
  ListServicesCommand: createCmd("ListServicesCommand"),
  DescribeServicesCommand: createCmd("DescribeServicesCommand"),
  CreateServiceCommand: createCmd("CreateServiceCommand"),
  UpdateServiceCommand: createCmd("UpdateServiceCommand"),
  DeleteServiceCommand: createCmd("DeleteServiceCommand"),
  ListTasksCommand: createCmd("ListTasksCommand"),
  DescribeTasksCommand: createCmd("DescribeTasksCommand"),
  RunTaskCommand: createCmd("RunTaskCommand"),
  StopTaskCommand: createCmd("StopTaskCommand"),
  ListContainerInstancesCommand: createCmd("ListContainerInstancesCommand"),
  DescribeContainerInstancesCommand: createCmd("DescribeContainerInstancesCommand"),
  ListTaskDefinitionFamiliesCommand: createCmd("ListTaskDefinitionFamiliesCommand"),
  TagResourceCommand: createCmd("TagResourceCommand"),
  UntagResourceCommand: createCmd("UntagResourceCommand"),
  ListTagsForResourceCommand: createCmd("ListTagsForResourceCommand"),
  ListAccountSettingsCommand: createCmd("ListAccountSettingsCommand"),
  PutAccountSettingCommand: createCmd("PutAccountSettingCommand"),
  PutAccountSettingDefaultCommand: createCmd("PutAccountSettingDefaultCommand"),
  DeleteAccountSettingCommand: createCmd("DeleteAccountSettingCommand"),
  ListAttributesCommand: createCmd("ListAttributesCommand"),
  PutAttributesCommand: createCmd("PutAttributesCommand"),
  DeleteAttributesCommand: createCmd("DeleteAttributesCommand"),
  CreateTaskSetCommand: createCmd("CreateTaskSetCommand"),
  UpdateTaskSetCommand: createCmd("UpdateTaskSetCommand"),
  DeleteTaskSetCommand: createCmd("DeleteTaskSetCommand"),
  DescribeTaskSetsCommand: createCmd("DescribeTaskSetsCommand"),
  UpdateServicePrimaryTaskSetCommand: createCmd("UpdateServicePrimaryTaskSetCommand"),
  ListServiceDeploymentsCommand: createCmd("ListServiceDeploymentsCommand"),
  DescribeServiceDeploymentsCommand: createCmd("DescribeServiceDeploymentsCommand"),
  DescribeServiceRevisionsCommand: createCmd("DescribeServiceRevisionsCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./ecs";

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

async function del(path: string, body?: any) {
  return router.request(path, {
    method: "DELETE",
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

beforeEach(() => {
  vi.clearAllMocks();
  mockSend.mockReset();
});

// ── Clusters ─────────────────────────────────────────────

describe("ECS routes — Clusters", () => {
  it("GET /clusters — returns empty when no clusters", async () => {
    mockSend.mockResolvedValueOnce({ clusterArns: [] });
    const res = await get("/clusters");
    const json = await res.json();
    expect(json).toEqual({ clusters: [], total: 0 });
    expect(res.status).toBe(200);
  });

  it("GET /clusters — returns described clusters", async () => {
    mockSend
      .mockResolvedValueOnce({ clusterArns: ["arn:cluster1", "arn:cluster2"] })
      .mockResolvedValueOnce({
        clusters: [{ clusterName: "cluster1" }, { clusterName: "cluster2" }],
      });
    const res = await get("/clusters");
    const json = await res.json();
    expect(json.clusters).toHaveLength(2);
    expect(json.total).toBe(2);
  });

  it("GET /clusters — sparse DescribeClusters response", async () => {
    mockSend
      .mockResolvedValueOnce({ clusterArns: ["arn:cluster1"] })
      .mockResolvedValueOnce({});
    const res = await get("/clusters");
    const json = await res.json();
    expect(json).toEqual({ clusters: [], total: 0 });
  });

  it("GET /clusters/:clusterName — returns single cluster", async () => {
    mockSend.mockResolvedValueOnce({ clusters: [{ clusterName: "my-cluster" }] });
    const res = await get("/clusters/my-cluster");
    const json = await res.json();
    expect(json.cluster).toEqual({ clusterName: "my-cluster" });
  });

  it("GET /clusters/:clusterName — returns null when not found", async () => {
    mockSend.mockResolvedValueOnce({ clusters: [] });
    const res = await get("/clusters/nonexistent");
    const json = await res.json();
    expect(json.cluster).toBeNull();
  });

  it("POST /clusters — creates cluster", async () => {
    mockSend.mockResolvedValueOnce({ cluster: { clusterName: "new-cluster" } });
    const res = await post("/clusters", { clusterName: "new-cluster" });
    const json = await res.json();
    expect(json.cluster.clusterName).toBe("new-cluster");
    expect(res.status).toBe(201);
  });

  it("POST /clusters — 400 when clusterName missing", async () => {
    const res = await post("/clusters", {});
    expect(res.status).toBe(400);
  });

  it("DELETE /clusters — deletes cluster", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/clusters?cluster=arn:cluster1");
    const json = await res.json();
    expect(json.deleted).toBe(true);
  });

  it("DELETE /clusters — 400 when no cluster param", async () => {
    const res = await del("/clusters");
    expect(res.status).toBe(400);
  });

  it("PUT /clusters/:clusterName — updates cluster settings", async () => {
    mockSend.mockResolvedValueOnce({ cluster: { clusterName: "my-cluster" } });
    const res = await put("/clusters/my-cluster", { settings: [] });
    const json = await res.json();
    expect(json.cluster.clusterName).toBe("my-cluster");
  });
});

// ── Task Definitions ─────────────────────────────────────

describe("ECS routes — Task Definitions", () => {
  it("GET /task-definitions — returns list", async () => {
    mockSend.mockResolvedValueOnce({
      taskDefinitionArns: ["arn:td1", "arn:td2"],
    });
    const res = await get("/task-definitions");
    const json = await res.json();
    expect(json.taskDefinitionArns).toHaveLength(2);
    expect(json.total).toBe(2);
  });

  it("GET /task-definitions — returns empty when none", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/task-definitions");
    const json = await res.json();
    expect(json.taskDefinitionArns).toEqual([]);
    expect(json.total).toBe(0);
  });

  it("GET /task-definitions — passes familyPrefix", async () => {
    mockSend.mockResolvedValueOnce({ taskDefinitionArns: [] });
    await get("/task-definitions?familyPrefix=myfamily");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ __cmdName: "ListTaskDefinitionsCommand", familyPrefix: "myfamily" })
    );
  });

  it("GET /task-definition-families — returns families", async () => {
    mockSend.mockResolvedValueOnce({ families: ["family1", "family2"] });
    const res = await get("/task-definition-families?familyPrefix=fam");
    const json = await res.json();
    expect(json.families).toHaveLength(2);
  });

  it("GET /task-definition-families — sparse response", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/task-definition-families");
    const json = await res.json();
    expect(json.families).toEqual([]);
  });

  it("GET /task-definitions/:taskDefinition — describes task def", async () => {
    mockSend.mockResolvedValueOnce({
      taskDefinition: { family: "myfamily" },
      tags: [{ key: "env", value: "prod" }],
    });
    const res = await get("/task-definitions/myfamily:1");
    const json = await res.json();
    expect(json.taskDefinition.family).toBe("myfamily");
    expect(json.tags).toHaveLength(1);
  });

  it("GET /task-definitions/:taskDefinition — sparse response defaults tags", async () => {
    mockSend.mockResolvedValueOnce({ taskDefinition: { family: "myfamily" } });
    const res = await get("/task-definitions/myfamily:1");
    const json = await res.json();
    expect(json.tags).toEqual([]);
  });

  it("GET /task-definitions/:taskDefinition — handles encoded names", async () => {
    mockSend.mockResolvedValueOnce({ taskDefinition: {}, tags: [] });
    await get("/task-definitions/myfamily%3A1");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ __cmdName: "DescribeTaskDefinitionCommand", taskDefinition: "myfamily:1" })
    );
  });

  it("POST /task-definitions — registers task definition", async () => {
    mockSend.mockResolvedValueOnce({ taskDefinition: { family: "newfamily" } });
    const res = await post("/task-definitions", {
      family: "newfamily",
      containerDefinitions: [{ name: "app", image: "nginx" }],
      cpu: "256",
      memory: "512",
    });
    const json = await res.json();
    expect(json.taskDefinition.family).toBe("newfamily");
    expect(res.status).toBe(201);
  });

  it("DELETE /task-definitions/:taskDefinition — deregisters", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/task-definitions/myfamily:1");
    const json = await res.json();
    expect(json.deregistered).toBe(true);
  });
});

// ── Services ─────────────────────────────────────────────

describe("ECS routes — Services", () => {
  it("GET /services — returns empty when no services", async () => {
    mockSend.mockResolvedValueOnce({ serviceArns: [] });
    const res = await get("/services?cluster=my-cluster");
    const json = await res.json();
    expect(json).toEqual({ services: [], total: 0 });
  });

  it("GET /services — returns described services", async () => {
    mockSend
      .mockResolvedValueOnce({ serviceArns: ["arn:svc1"] })
      .mockResolvedValueOnce({ services: [{ serviceName: "svc1" }] });
    const res = await get("/services?cluster=my-cluster");
    const json = await res.json();
    expect(json.services).toHaveLength(1);
    expect(json.total).toBe(1);
  });

  it("GET /services — sparse DescribeServices response", async () => {
    mockSend
      .mockResolvedValueOnce({ serviceArns: ["arn:svc1"] })
      .mockResolvedValueOnce({});
    const res = await get("/services?cluster=my-cluster");
    const json = await res.json();
    expect(json).toEqual({ services: [], total: 0 });
  });

  it("GET /services — 400 when no cluster param", async () => {
    const res = await get("/services");
    expect(res.status).toBe(400);
  });

  it("POST /services — creates service", async () => {
    mockSend.mockResolvedValueOnce({ service: { serviceName: "newsvc" } });
    const res = await post("/services", {
      cluster: "my-cluster",
      serviceName: "newsvc",
      taskDefinition: "myfamily:1",
      desiredCount: 2,
    });
    const json = await res.json();
    expect(json.service.serviceName).toBe("newsvc");
    expect(res.status).toBe(201);
  });

  it("POST /services — defaults desiredCount to 0", async () => {
    mockSend.mockResolvedValueOnce({ service: { serviceName: "newsvc" } });
    const res = await post("/services", {
      cluster: "my-cluster",
      serviceName: "newsvc",
      taskDefinition: "myfamily:1",
    });
    expect(res.status).toBe(201);
    expect(mockSend.mock.calls[0][0].desiredCount).toBe(0);
  });

  it("PUT /services — updates service", async () => {
    mockSend.mockResolvedValueOnce({ service: { serviceName: "svc1" } });
    const res = await put("/services?cluster=my-cluster&service=svc1", {
      desiredCount: 5,
    });
    const json = await res.json();
    expect(json.service.serviceName).toBe("svc1");
  });

  it("PUT /services — 400 when missing params", async () => {
    const res = await put("/services?cluster=my-cluster", {});
    expect(res.status).toBe(400);
  });

  it("DELETE /services — deletes service", async () => {
    mockSend.mockResolvedValueOnce({ service: {} });
    const res = await del("/services?cluster=my-cluster&service=svc1&force=true");
    const json = await res.json();
    expect(json.service).toBeDefined();
  });

  it("DELETE /services — 400 when missing params", async () => {
    const res = await del("/services?cluster=my-cluster");
    expect(res.status).toBe(400);
  });
});

// ── Tasks ────────────────────────────────────────────────

describe("ECS routes — Tasks", () => {
  it("GET /tasks — returns empty when no tasks", async () => {
    mockSend.mockResolvedValueOnce({ taskArns: [] });
    const res = await get("/tasks?cluster=my-cluster");
    const json = await res.json();
    expect(json).toEqual({ tasks: [], total: 0 });
  });

  it("GET /tasks — returns described tasks", async () => {
    mockSend
      .mockResolvedValueOnce({ taskArns: ["arn:task1", "arn:task2"] })
      .mockResolvedValueOnce({ tasks: [{ id: "task1" }, { id: "task2" }] });
    const res = await get("/tasks?cluster=my-cluster");
    const json = await res.json();
    expect(json.tasks).toHaveLength(2);
    expect(json.total).toBe(2);
  });

  it("GET /tasks — sparse DescribeTasks response", async () => {
    mockSend
      .mockResolvedValueOnce({ taskArns: ["arn:task1"] })
      .mockResolvedValueOnce({});
    const res = await get("/tasks?cluster=my-cluster");
    const json = await res.json();
    expect(json).toEqual({ tasks: [], total: 0 });
  });

  it("GET /tasks — 400 when no cluster param", async () => {
    const res = await get("/tasks");
    expect(res.status).toBe(400);
  });

  it("GET /tasks — passes desiredStatus", async () => {
    mockSend.mockResolvedValueOnce({ taskArns: [] });
    await get("/tasks?cluster=my-cluster&desiredStatus=STOPPED");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ __cmdName: "ListTasksCommand", desiredStatus: "STOPPED" })
    );
  });

  it("POST /tasks/run — runs task", async () => {
    mockSend.mockResolvedValueOnce({ tasks: [{ id: "task1" }] });
    const res = await post("/tasks/run", {
      cluster: "my-cluster",
      taskDefinition: "myfamily:1",
      count: 2,
    });
    const json = await res.json();
    expect(json.tasks).toHaveLength(1);
    expect(res.status).toBe(201);
  });

  it("POST /tasks/run — defaults count to 1", async () => {
    mockSend.mockResolvedValueOnce({ tasks: [] });
    const res = await post("/tasks/run", {
      cluster: "my-cluster",
      taskDefinition: "myfamily:1",
    });
    expect(res.status).toBe(201);
    expect(mockSend.mock.calls[0][0].count).toBe(1);
  });

  it("POST /tasks/run — sparse response defaults tasks to []", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/tasks/run", {
      cluster: "my-cluster",
      taskDefinition: "myfamily:1",
    });
    const json = await res.json();
    expect(json.tasks).toEqual([]);
  });

  it("POST /tasks/run — 400 when cluster or taskDefinition missing", async () => {
    const res = await post("/tasks/run", {});
    expect(res.status).toBe(400);
  });

  it("POST /tasks/stop — stops task", async () => {
    mockSend.mockResolvedValueOnce({ task: { id: "task1" } });
    const res = await post("/tasks/stop", {
      cluster: "my-cluster",
      task: "task1",
      reason: "test",
    });
    const json = await res.json();
    expect(json.task.id).toBe("task1");
  });
});

// ── Container Instances ──────────────────────────────────

describe("ECS routes — Container Instances", () => {
  it("GET /container-instances — returns empty when none", async () => {
    mockSend.mockResolvedValueOnce({ containerInstanceArns: [] });
    const res = await get("/container-instances?cluster=my-cluster");
    const json = await res.json();
    expect(json).toEqual({ containerInstances: [], total: 0 });
  });

  it("GET /container-instances — returns described instances", async () => {
    mockSend
      .mockResolvedValueOnce({ containerInstanceArns: ["arn:ci1"] })
      .mockResolvedValueOnce({ containerInstances: [{ ec2InstanceId: "i-123" }] });
    const res = await get("/container-instances?cluster=my-cluster");
    const json = await res.json();
    expect(json.containerInstances).toHaveLength(1);
    expect(json.total).toBe(1);
  });

  it("GET /container-instances — sparse Describe response", async () => {
    mockSend
      .mockResolvedValueOnce({ containerInstanceArns: ["arn:ci1"] })
      .mockResolvedValueOnce({});
    const res = await get("/container-instances?cluster=my-cluster");
    const json = await res.json();
    expect(json).toEqual({ containerInstances: [], total: 0 });
  });

  it("GET /container-instances — 400 when no cluster", async () => {
    const res = await get("/container-instances");
    expect(res.status).toBe(400);
  });
});

// ── Tags ─────────────────────────────────────────────────

describe("ECS routes — Tags", () => {
  it("GET /tags — returns tags for resource", async () => {
    mockSend.mockResolvedValueOnce({ tags: [{ key: "env", value: "prod" }] });
    const res = await get("/tags?resourceArn=arn:cluster1");
    const json = await res.json();
    expect(json.tags).toHaveLength(1);
  });

  it("GET /tags — returns empty array when no tags", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/tags?resourceArn=arn:cluster1");
    const json = await res.json();
    expect(json.tags).toEqual([]);
  });

  it("GET /tags — 400 when no resourceArn", async () => {
    const res = await get("/tags");
    expect(res.status).toBe(400);
  });

  it("POST /tags — tags resource", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/tags", {
      resourceArn: "arn:cluster1",
      tags: [{ key: "env", value: "prod" }],
    });
    const json = await res.json();
    expect(json.tagged).toBe(true);
  });

  it("DELETE /tags — untags resource", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/tags?resourceArn=arn:cluster1&tagKeys=env,team");
    const json = await res.json();
    expect(json.untagged).toBe(true);
  });

  it("DELETE /tags — defaults tagKeys to empty array", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/tags?resourceArn=arn:cluster1");
    const json = await res.json();
    expect(json.untagged).toBe(true);
    expect(mockSend.mock.calls[0][0].tagKeys).toEqual([]);
  });

  it("DELETE /tags — 400 when no resourceArn", async () => {
    const res = await del("/tags?tagKeys=env");
    expect(res.status).toBe(400);
  });
});

// ── Account Settings ─────────────────────────────────────

describe("ECS routes — Account Settings", () => {
  it("GET /account-settings — returns settings", async () => {
    mockSend.mockResolvedValueOnce({
      settings: [{ name: "containerInsights", value: "enabled" }],
    });
    const res = await get("/account-settings");
    const json = await res.json();
    expect(json.total).toBe(1);
    expect(json.settings[0].name).toBe("containerInsights");
  });

  it("GET /account-settings — returns empty when none", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/account-settings");
    const json = await res.json();
    expect(json).toEqual({ settings: [], total: 0 });
  });

  it("GET /account-settings — passes filters", async () => {
    mockSend.mockResolvedValueOnce({ settings: [] });
    await get("/account-settings?name=containerInsights&value=enabled&effectiveSettings=true");
    const arg = mockSend.mock.calls[0][0];
    expect(arg.name).toBe("containerInsights");
    expect(arg.value).toBe("enabled");
    expect(arg.effectiveSettings).toBe(true);
  });

  it("PUT /account-settings — puts account setting", async () => {
    mockSend.mockResolvedValueOnce({ setting: { name: "containerInsights", value: "enabled" } });
    const res = await put("/account-settings", { name: "containerInsights", value: "enabled" });
    const json = await res.json();
    expect(json.setting.value).toBe("enabled");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("PutAccountSettingCommand");
  });

  it("PUT /account-settings — uses default command when isDefault", async () => {
    mockSend.mockResolvedValueOnce({ setting: { name: "containerInsights", value: "enabled" } });
    await put("/account-settings", { name: "containerInsights", value: "enabled", isDefault: true });
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("PutAccountSettingDefaultCommand");
  });

  it("PUT /account-settings — 400 when missing fields", async () => {
    const res = await put("/account-settings", { name: "containerInsights" });
    expect(res.status).toBe(400);
  });

  it("DELETE /account-settings — deletes setting", async () => {
    mockSend.mockResolvedValueOnce({ setting: { name: "containerInsights" } });
    const res = await del("/account-settings?name=containerInsights");
    const json = await res.json();
    expect(json.deleted).toBe(true);
  });

  it("DELETE /account-settings — sparse response defaults setting to null", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/account-settings?name=containerInsights");
    const json = await res.json();
    expect(json.setting).toBeNull();
    expect(json.deleted).toBe(true);
  });

  it("DELETE /account-settings — 400 when no name", async () => {
    const res = await del("/account-settings");
    expect(res.status).toBe(400);
  });
});

// ── Attributes ───────────────────────────────────────────

describe("ECS routes — Attributes", () => {
  it("GET /attributes — returns attributes", async () => {
    mockSend.mockResolvedValueOnce({
      attributes: [{ name: "stack", value: "prod", targetId: "arn:ci" }],
    });
    const res = await get("/attributes?cluster=c1");
    const json = await res.json();
    expect(json.total).toBe(1);
  });

  it("GET /attributes — sparse response", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/attributes?cluster=c1");
    const json = await res.json();
    expect(json).toEqual({ attributes: [], total: 0 });
  });

  it("GET /attributes — defaults targetType to container-instance", async () => {
    mockSend.mockResolvedValueOnce({ attributes: [] });
    await get("/attributes?cluster=c1");
    expect(mockSend.mock.calls[0][0].targetType).toBe("container-instance");
  });

  it("POST /attributes — puts attributes", async () => {
    mockSend.mockResolvedValueOnce({
      attributes: [{ name: "stack", value: "prod" }],
    });
    const res = await post("/attributes", {
      cluster: "c1",
      attributes: [{ name: "stack", value: "prod", targetId: "arn:ci" }],
    });
    const json = await res.json();
    expect(json.attributes).toHaveLength(1);
  });

  it("POST /attributes — sparse response defaults to []", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/attributes", {
      cluster: "c1",
      attributes: [{ name: "stack", targetId: "arn:ci" }],
    });
    const json = await res.json();
    expect(json.attributes).toEqual([]);
  });

  it("POST /attributes — 400 when no attributes", async () => {
    const res = await post("/attributes", { cluster: "c1" });
    expect(res.status).toBe(400);
  });

  it("DELETE /attributes — deletes attributes", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/attributes", {
      cluster: "c1",
      attributes: [{ name: "stack", targetId: "arn:ci" }],
    });
    const json = await res.json();
    expect(json.deleted).toBe(true);
  });

  it("DELETE /attributes — 400 when no attributes", async () => {
    const res = await del("/attributes", { cluster: "c1" });
    expect(res.status).toBe(400);
  });
});

// ── Task Sets ────────────────────────────────────────────

describe("ECS routes — Task Sets", () => {
  it("GET /task-sets — returns task sets", async () => {
    mockSend.mockResolvedValueOnce({
      taskSets: [{ id: "ts-1", status: "PRIMARY" }],
    });
    const res = await get("/task-sets?cluster=c1&service=svc1");
    const json = await res.json();
    expect(json.total).toBe(1);
  });

  it("GET /task-sets — sparse response", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/task-sets?cluster=c1&service=svc1");
    const json = await res.json();
    expect(json).toEqual({ taskSets: [], total: 0 });
  });

  it("GET /task-sets — 400 when missing cluster/service", async () => {
    const res = await get("/task-sets?cluster=c1");
    expect(res.status).toBe(400);
  });

  it("GET /task-sets — passes taskSets filter", async () => {
    mockSend.mockResolvedValueOnce({ taskSets: [] });
    await get("/task-sets?cluster=c1&service=svc1&taskSets=ts-1,ts-2");
    expect(mockSend.mock.calls[0][0].taskSets).toEqual(["ts-1", "ts-2"]);
  });

  it("POST /task-sets — creates task set", async () => {
    mockSend.mockResolvedValueOnce({ taskSet: { id: "ts-1" } });
    const res = await post("/task-sets", {
      cluster: "c1",
      service: "svc1",
      taskDefinition: "td:1",
    });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.taskSet.id).toBe("ts-1");
  });

  it("POST /task-sets — 400 when missing required", async () => {
    const res = await post("/task-sets", { cluster: "c1", service: "svc1" });
    expect(res.status).toBe(400);
  });

  it("PUT /task-sets — updates scale", async () => {
    mockSend.mockResolvedValueOnce({ taskSet: { id: "ts-1" } });
    const res = await put("/task-sets", {
      cluster: "c1",
      service: "svc1",
      taskSet: "ts-1",
      scale: { value: 50, unit: "PERCENT" },
    });
    const json = await res.json();
    expect(json.taskSet.id).toBe("ts-1");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("UpdateTaskSetCommand");
  });

  it("PUT /task-sets — 400 when missing scale", async () => {
    const res = await put("/task-sets", { cluster: "c1", service: "svc1", taskSet: "ts-1" });
    expect(res.status).toBe(400);
  });

  it("PUT /task-sets/primary — sets primary task set", async () => {
    mockSend.mockResolvedValueOnce({ taskSet: { id: "ts-2" } });
    const res = await put("/task-sets/primary", {
      cluster: "c1",
      service: "svc1",
      primaryTaskSet: "ts-2",
    });
    const json = await res.json();
    expect(json.taskSet.id).toBe("ts-2");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("UpdateServicePrimaryTaskSetCommand");
  });

  it("PUT /task-sets/primary — 400 when missing primaryTaskSet", async () => {
    const res = await put("/task-sets/primary", { cluster: "c1", service: "svc1" });
    expect(res.status).toBe(400);
  });

  it("DELETE /task-sets — deletes task set", async () => {
    mockSend.mockResolvedValueOnce({ taskSet: { id: "ts-1" } });
    const res = await del("/task-sets?cluster=c1&service=svc1&taskSet=ts-1&force=true");
    const json = await res.json();
    expect(json.deleted).toBe(true);
    expect(mockSend.mock.calls[0][0].force).toBe(true);
  });

  it("DELETE /task-sets — sparse response defaults taskSet to null", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/task-sets?cluster=c1&service=svc1&taskSet=ts-1");
    const json = await res.json();
    expect(json.taskSet).toBeNull();
    expect(json.deleted).toBe(true);
  });

  it("DELETE /task-sets — 400 when missing params", async () => {
    const res = await del("/task-sets?cluster=c1&service=svc1");
    expect(res.status).toBe(400);
  });
});

// ── Service Deployments ──────────────────────────────────

describe("ECS routes — Service Deployments & Revisions", () => {
  it("GET /service-deployments — returns deployments", async () => {
    mockSend.mockResolvedValueOnce({
      serviceDeployments: [{ serviceDeploymentArn: "arn:sd-1", status: "SUCCESSFUL" }],
    });
    const res = await get("/service-deployments?service=svc1&cluster=c1");
    const json = await res.json();
    expect(json.total).toBe(1);
  });

  it("GET /service-deployments — sparse response", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/service-deployments?service=svc1&cluster=c1");
    const json = await res.json();
    expect(json).toEqual({ serviceDeployments: [], total: 0 });
  });

  it("GET /service-deployments — 400 when no service", async () => {
    const res = await get("/service-deployments");
    expect(res.status).toBe(400);
  });

  it("GET /service-deployments/detail — returns detail", async () => {
    mockSend.mockResolvedValueOnce({
      serviceDeployments: [{ serviceDeploymentArn: "arn:sd-1" }],
    });
    const res = await get("/service-deployments/detail?arns=arn:sd-1,arn:sd-2");
    const json = await res.json();
    expect(json.serviceDeployments).toHaveLength(1);
    expect(mockSend.mock.calls[0][0].serviceDeploymentArns).toEqual(["arn:sd-1", "arn:sd-2"]);
  });

  it("GET /service-deployments/detail — sparse response defaults to []", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/service-deployments/detail?arns=arn:sd-1");
    const json = await res.json();
    expect(json.serviceDeployments).toEqual([]);
  });

  it("GET /service-deployments/detail — 400 when no arns", async () => {
    const res = await get("/service-deployments/detail");
    expect(res.status).toBe(400);
  });

  it("GET /service-revisions — returns revisions", async () => {
    mockSend.mockResolvedValueOnce({
      serviceRevisions: [{ serviceRevisionArn: "arn:sr-1" }],
    });
    const res = await get("/service-revisions?arns=arn:sr-1");
    const json = await res.json();
    expect(json.serviceRevisions).toHaveLength(1);
  });

  it("GET /service-revisions — sparse response defaults to []", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/service-revisions?arns=arn:sr-1");
    const json = await res.json();
    expect(json.serviceRevisions).toEqual([]);
  });

  it("GET /service-revisions — 400 when no arns", async () => {
    const res = await get("/service-revisions");
    expect(res.status).toBe(400);
  });
});
