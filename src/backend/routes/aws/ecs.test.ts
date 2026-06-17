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

  it("DELETE /tags — 400 when no resourceArn", async () => {
    const res = await del("/tags?tagKeys=env");
    expect(res.status).toBe(400);
  });
});
