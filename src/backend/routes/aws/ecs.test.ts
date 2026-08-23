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
  DeregisterContainerInstanceCommand: createCmd("DeregisterContainerInstanceCommand"),
  UpdateContainerInstancesStateCommand: createCmd("UpdateContainerInstancesStateCommand"),
  UpdateContainerAgentCommand: createCmd("UpdateContainerAgentCommand"),
  StartTaskCommand: createCmd("StartTaskCommand"),
  GetTaskProtectionCommand: createCmd("GetTaskProtectionCommand"),
  UpdateTaskProtectionCommand: createCmd("UpdateTaskProtectionCommand"),
  DiscoverPollEndpointCommand: createCmd("DiscoverPollEndpointCommand"),
  DescribeCapacityProvidersCommand: createCmd("DescribeCapacityProvidersCommand"),
  CreateCapacityProviderCommand: createCmd("CreateCapacityProviderCommand"),
  UpdateCapacityProviderCommand: createCmd("UpdateCapacityProviderCommand"),
  DeleteCapacityProviderCommand: createCmd("DeleteCapacityProviderCommand"),
  PutClusterCapacityProvidersCommand: createCmd("PutClusterCapacityProvidersCommand"),
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

describe("G.89 — container instances, task protection, poll endpoint", () => {
  const CLUSTER = "my-cluster";
  const INST = "arn:aws:ecs:us-east-1:123:container-instance/my-cluster/abc123";
  const INST_ENC = encodeURIComponent(INST);
  const TASK = "arn:aws:ecs:us-east-1:123:task/my-cluster/task-1";
  const TASK_ENC = encodeURIComponent(TASK);

  it("GET /container-instances/:instanceId — describes a single instance", async () => {
    mockSend.mockResolvedValueOnce({ containerInstances: [{ containerInstanceArn: INST, status: "ACTIVE" }] });
    const res = await get(`/container-instances/${INST_ENC}?cluster=${CLUSTER}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.instance.containerInstanceArn).toBe(INST);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("DescribeContainerInstancesCommand");
    expect(mockSend.mock.calls[0][0].containerInstances).toEqual([INST]);
  });

  it("GET /container-instances/:instanceId — 400 without cluster", async () => {
    const res = await get(`/container-instances/${INST_ENC}`);
    expect(res.status).toBe(400);
  });

  it("GET /container-instances/:instanceId — null when sparse", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get(`/container-instances/${INST_ENC}?cluster=${CLUSTER}`);
    const body = await res.json();
    expect(body.instance).toBeNull();
  });

  it("POST /container-instances/deregister — deregisters", async () => {
    mockSend.mockResolvedValueOnce({ containerInstance: { containerInstanceArn: INST } });
    const res = await post("/container-instances/deregister", { cluster: CLUSTER, containerInstance: INST });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.instance.containerInstanceArn).toBe(INST);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("DeregisterContainerInstanceCommand");
    expect(mockSend.mock.calls[0][0].force).toBe(false);
  });

  it("POST /container-instances/deregister — 400 without cluster or instance", async () => {
    const res = await post("/container-instances/deregister", { cluster: CLUSTER });
    expect(res.status).toBe(400);
  });

  it("POST /container-instances/deregister — null when sparse and force passthrough", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/container-instances/deregister", { cluster: CLUSTER, containerInstance: INST, force: true });
    const body = await res.json();
    expect(body.instance).toBeNull();
    expect(mockSend.mock.calls[0][0].force).toBe(true);
  });

  it("POST /container-instances/state — updates instance state", async () => {
    mockSend.mockResolvedValueOnce({ containerInstances: [{ containerInstanceArn: INST, status: "DRAINING" }] });
    const res = await post("/container-instances/state", {
      cluster: CLUSTER,
      containerInstances: [INST],
      status: "DRAINING",
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.instances[0].status).toBe("DRAINING");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("UpdateContainerInstancesStateCommand");
    expect(mockSend.mock.calls[0][0].status).toBe("DRAINING");
  });

  it("POST /container-instances/state — 400 without required fields", async () => {
    const res = await post("/container-instances/state", { cluster: CLUSTER, containerInstances: [] });
    expect(res.status).toBe(400);
    const res2 = await post("/container-instances/state", { cluster: CLUSTER, containerInstances: [INST] });
    expect(res2.status).toBe(400);
  });

  it("POST /container-instances/state — empty when sparse", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/container-instances/state", {
      cluster: CLUSTER,
      containerInstances: [INST],
      status: "ACTIVE",
    });
    const body = await res.json();
    expect(body.instances).toEqual([]);
  });

  it("POST /container-instances/agent — updates the agent", async () => {
    mockSend.mockResolvedValueOnce({ containerInstance: { containerInstanceArn: INST, agentConnected: true } });
    const res = await post("/container-instances/agent", { cluster: CLUSTER, containerInstance: INST });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.instance.agentConnected).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("UpdateContainerAgentCommand");
  });

  it("POST /container-instances/agent — 400 without cluster or instance", async () => {
    const res = await post("/container-instances/agent", { cluster: CLUSTER });
    expect(res.status).toBe(400);
  });

  it("POST /container-instances/agent — null when sparse", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/container-instances/agent", { cluster: CLUSTER, containerInstance: INST });
    const body = await res.json();
    expect(body.instance).toBeNull();
  });

  it("POST /tasks/start — starts a task", async () => {
    mockSend.mockResolvedValueOnce({ tasks: [{ taskArn: TASK }] });
    const res = await post("/tasks/start", {
      cluster: CLUSTER,
      taskDefinition: "my-task:1",
      containerInstances: [INST],
      group: "g",
      startedBy: "dash",
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.tasks[0].taskArn).toBe(TASK);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("StartTaskCommand");
    expect(mockSend.mock.calls[0][0].containerInstances).toEqual([INST]);
  });

  it("POST /tasks/start — 400 without cluster or taskDefinition", async () => {
    const res = await post("/tasks/start", { cluster: CLUSTER });
    expect(res.status).toBe(400);
  });

  it("POST /tasks/start — omits empty optionals", async () => {
    mockSend.mockResolvedValueOnce({});
    await post("/tasks/start", { cluster: CLUSTER, taskDefinition: "my-task:1" });
    expect(mockSend.mock.calls[0][0].containerInstances).toBeUndefined();
    expect(mockSend.mock.calls[0][0].group).toBeUndefined();
    expect(mockSend.mock.calls[0][0].startedBy).toBeUndefined();
  });

  it("GET /tasks/:taskId/protection — gets protection", async () => {
    mockSend.mockResolvedValueOnce({ protectedTasks: [{ taskArn: TASK, protectionEnabled: true }] });
    const res = await get(`/tasks/${TASK_ENC}/protection?cluster=${CLUSTER}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.protections[0].protectionEnabled).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("GetTaskProtectionCommand");
    expect(mockSend.mock.calls[0][0].tasks).toEqual([TASK]);
  });

  it("GET /tasks/:taskId/protection — 400 without cluster", async () => {
    const res = await get(`/tasks/${TASK_ENC}/protection`);
    expect(res.status).toBe(400);
  });

  it("GET /tasks/:taskId/protection — sparse empty protections", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get(`/tasks/${TASK_ENC}/protection?cluster=${CLUSTER}`);
    const body = await res.json();
    expect(body.protections).toEqual([]);
  });

  it("PUT /tasks/protection — updates protection", async () => {
    mockSend.mockResolvedValueOnce({ protectedTasks: [{ taskArn: TASK, protectionEnabled: false }] });
    const res = await put("/tasks/protection", {
      cluster: CLUSTER,
      tasks: [TASK],
      protectionEnabled: false,
      expiresInMinutes: 30,
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.protections[0].protectionEnabled).toBe(false);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("UpdateTaskProtectionCommand");
    expect(mockSend.mock.calls[0][0].expiresInMinutes).toBe(30);
  });

  it("PUT /tasks/protection — 400 without required fields", async () => {
    const res = await put("/tasks/protection", { cluster: CLUSTER, tasks: [] });
    expect(res.status).toBe(400);
    const res2 = await put("/tasks/protection", { cluster: CLUSTER, tasks: [TASK] });
    expect(res2.status).toBe(400);
  });

  it("PUT /tasks/protection — omits empty expiresInMinutes", async () => {
    mockSend.mockResolvedValueOnce({});
    await put("/tasks/protection", { cluster: CLUSTER, tasks: [TASK], protectionEnabled: true });
    expect(mockSend.mock.calls[0][0].expiresInMinutes).toBeUndefined();
  });

  it("GET /poll-endpoint — discovers the poll endpoint", async () => {
    mockSend.mockResolvedValueOnce({ endpoint: "https://ecs-agent.example.com" });
    const res = await get(`/poll-endpoint?containerInstance=${INST_ENC}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.endpoint).toBe("https://ecs-agent.example.com");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("DiscoverPollEndpointCommand");
    expect(mockSend.mock.calls[0][0].containerInstance).toBe(INST);
  });

  it("GET /poll-endpoint — 400 without containerInstance", async () => {
    const res = await get("/poll-endpoint");
    expect(res.status).toBe(400);
  });

  it("GET /poll-endpoint — null when sparse", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get(`/poll-endpoint?containerInstance=${INST_ENC}`);
    const body = await res.json();
    expect(body.endpoint).toBeNull();
  });

  describe("Capacity Providers", () => {
    it("GET /capacity-providers — maps providers", async () => {
      mockSend.mockResolvedValueOnce({
        capacityProviders: [{
          name: "cp-1",
          status: "ACTIVE",
          autoScalingGroupProvider: { autoScalingGroupArn: "arn:asg" },
          tags: [{ key: "env", value: "prod" }],
        }],
      });
      const res = await get("/capacity-providers");
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.capacityProviders[0]).toEqual({
        name: "cp-1",
        status: "ACTIVE",
        autoScalingGroupProvider: { autoScalingGroupArn: "arn:asg" },
        tags: [{ key: "env", value: "prod" }],
      });
    });

    it("GET /capacity-providers — sparse fallbacks", async () => {
      mockSend.mockResolvedValueOnce({ capacityProviders: [{ name: "cp-1" }] });
      const res = await get("/capacity-providers");
      const body = await res.json();
      expect(body.capacityProviders[0].autoScalingGroupProvider).toBeNull();
      expect(body.capacityProviders[0].tags).toEqual([]);
    });

    it("GET /capacity-providers — passes cluster filter", async () => {
      mockSend.mockResolvedValueOnce({});
      await get("/capacity-providers?cluster=c1");
      expect(mockSend.mock.calls[0][0].cluster).toBe("c1");
    });

    it("POST /capacity-providers — creates with defaults", async () => {
      mockSend.mockResolvedValueOnce({ capacityProvider: { name: "cp-1" } });
      const res = await post("/capacity-providers", {
        name: "cp-1",
        autoScalingGroupArn: "arn:asg",
        managedScaling: {},
      });
      expect(res.status).toBe(201);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.__cmdName).toBe("CreateCapacityProviderCommand");
      expect(cmd.autoScalingGroupProvider.managedScaling.status).toBe("ENABLED");
      expect(cmd.autoScalingGroupProvider.managedTerminationProtection).toBe("DISABLED");
    });

    it("POST /capacity-providers — 400 without name", async () => {
      const res = await post("/capacity-providers", { autoScalingGroupArn: "arn" });
      expect(res.status).toBe(400);
    });

    it("POST /capacity-providers — 400 without ASG arn", async () => {
      const res = await post("/capacity-providers", { name: "cp-1" });
      expect(res.status).toBe(400);
    });

    it("POST /capacity-providers — null provider on sparse response", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/capacity-providers", { name: "cp-1", autoScalingGroupArn: "arn" });
      expect((await res.json()).capacityProvider).toBeNull();
    });

    it("POST /capacity-providers — uses explicit managed scaling status", async () => {
      mockSend.mockResolvedValueOnce({});
      await post("/capacity-providers", {
        name: "cp-1",
        autoScalingGroupArn: "arn",
        managedScaling: { status: "DISABLED", targetCapacity: 20 },
      });
      expect(mockSend.mock.calls[0][0].autoScalingGroupProvider.managedScaling.status).toBe("DISABLED");
    });

    it("POST /capacity-providers — omits managed scaling when absent", async () => {
      mockSend.mockResolvedValueOnce({});
      await post("/capacity-providers", { name: "cp-1", autoScalingGroupArn: "arn" });
      expect(mockSend.mock.calls[0][0].autoScalingGroupProvider.managedScaling).toBeUndefined();
    });

    it("PUT /capacity-providers/:name — defaults status when only capacity set", async () => {
      mockSend.mockResolvedValueOnce({});
      await put("/capacity-providers/cp-1", {
        autoScalingGroupArn: "arn",
        managedScaling: { targetCapacity: 75 },
      });
      expect(mockSend.mock.calls[0][0].autoScalingGroupProvider.managedScaling.status).toBe("ENABLED");
      expect(mockSend.mock.calls[0][0].autoScalingGroupProvider.managedScaling.targetCapacity).toBe(75);
    });

    it("PUT /capacity-providers/:name — omits managed scaling when absent", async () => {
      mockSend.mockResolvedValueOnce({});
      await put("/capacity-providers/cp-1", { autoScalingGroupArn: "arn" });
      expect(mockSend.mock.calls[0][0].autoScalingGroupProvider.managedScaling).toBeUndefined();
    });

    it("PUT /capacity-providers/:name — updates managed scaling", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/capacity-providers/cp-1", {
        autoScalingGroupArn: "arn:asg",
        managedScaling: { status: "DISABLED", targetCapacity: 50 },
      });
      expect(res.status).toBe(200);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.__cmdName).toBe("UpdateCapacityProviderCommand");
      expect(cmd.autoScalingGroupProvider.managedScaling.targetCapacity).toBe(50);
    });

    it("PUT /capacity-providers/:name — null cluster on sparse put-cluster response", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/clusters/c1/capacity-providers", { capacityProviders: ["FARGATE"] });
      expect((await res.json()).cluster).toBeNull();
    });

    it("PUT /capacity-providers/:name — 400 without ASG arn", async () => {
      const res = await put("/capacity-providers/cp-1", {});
      expect(res.status).toBe(400);
    });

    it("DELETE /capacity-providers/:name — deletes", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/capacity-providers/cp-1");
      expect((await res.json()).deleted).toBe(true);
      expect(mockSend.mock.calls[0][0].capacityProvider).toBe("cp-1");
    });

    it("PUT /clusters/:name/capacity-providers — associates providers", async () => {
      mockSend.mockResolvedValueOnce({ cluster: { clusterName: "c1" } });
      const res = await put("/clusters/c1/capacity-providers", {
        capacityProviders: ["FARGATE", "cp-1"],
        defaultCapacityProviderStrategy: [{ capacityProvider: "cp-1", weight: 1 }],
      });
      const body = await res.json();
      expect(body.cluster.clusterName).toBe("c1");
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.__cmdName).toBe("PutClusterCapacityProvidersCommand");
      expect(cmd.capacityProviders).toEqual(["FARGATE", "cp-1"]);
    });

    it("PUT /clusters/:name/capacity-providers — 400 without providers", async () => {
      const res = await put("/clusters/c1/capacity-providers", {});
      expect(res.status).toBe(400);
    });
  });
});
