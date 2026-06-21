import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const mockMemoryDB = vi.hoisted(() =>
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

vi.mock("@aws-sdk/client-memorydb", () => ({
  MemoryDBClient: mockMemoryDB,
  DescribeClustersCommand: createCmd("DescribeClustersCommand"),
  CreateClusterCommand: createCmd("CreateClusterCommand"),
  UpdateClusterCommand: createCmd("UpdateClusterCommand"),
  DeleteClusterCommand: createCmd("DeleteClusterCommand"),
  ListTagsCommand: createCmd("ListTagsCommand"),
  TagResourceCommand: createCmd("TagResourceCommand"),
  UntagResourceCommand: createCmd("UntagResourceCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./memorydb";

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

async function patch(path: string, body?: any) {
  return router.request(path, {
    method: "PATCH",
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
  vi.clearAllMocks();
  mockSend.mockReset();
});

describe("MemoryDB — Clusters", () => {
  it("GET /clusters — returns empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/clusters");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ clusters: [], total: 0 });
  });

  it("GET /clusters — returns clusters", async () => {
    mockSend.mockResolvedValueOnce({
      Clusters: [{ ClusterName: "c1", Status: "available" }],
    });
    const res = await get("/clusters");
    const json = await res.json();
    expect(json.clusters).toHaveLength(1);
    expect(json.total).toBe(1);
    expect(json.clusters[0].ClusterName).toBe("c1");
  });

  it("GET /clusters?name=c1 — passes ClusterName filter", async () => {
    mockSend.mockResolvedValueOnce({
      Clusters: [{ ClusterName: "c1" }],
    });
    await get("/clusters?name=c1");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("DescribeClustersCommand");
    expect(mockSend.mock.calls[0][0].ClusterName).toBe("c1");
  });

  it("GET /clusters/:name — returns single cluster", async () => {
    mockSend.mockResolvedValueOnce({
      Clusters: [{ ClusterName: "my-cluster" }],
    });
    const res = await get("/clusters/my-cluster");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.cluster).toEqual({ ClusterName: "my-cluster" });
  });

  it("GET /clusters/:name — returns null when not found", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/clusters/nonexistent");
    const json = await res.json();
    expect(json.cluster).toBeNull();
  });

  it("POST /clusters — 400 when clusterName missing", async () => {
    const res = await post("/clusters", {});
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("clusterName is required");
  });

  it("POST /clusters — creates cluster", async () => {
    mockSend.mockResolvedValueOnce({
      Cluster: { ClusterName: "c1", Status: "creating" },
    });
    const res = await post("/clusters", { clusterName: "c1" });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.cluster.ClusterName).toBe("c1");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("CreateClusterCommand");
    expect(mockSend.mock.calls[0][0].ClusterName).toBe("c1");
  });

  it("PATCH /clusters/:name — updates cluster description", async () => {
    mockSend.mockResolvedValueOnce({
      Cluster: { ClusterName: "c1", Description: "updated" },
    });
    const res = await patch("/clusters/c1", { description: "updated" });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.cluster.Description).toBe("updated");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("UpdateClusterCommand");
    expect(mockSend.mock.calls[0][0].ClusterName).toBe("c1");
    expect(mockSend.mock.calls[0][0].Description).toBe("updated");
  });

  it("DELETE /clusters/:name — deletes cluster", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/clusters/my-cluster");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.deleted).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("DeleteClusterCommand");
    expect(mockSend.mock.calls[0][0].ClusterName).toBe("my-cluster");
  });
});

describe("MemoryDB — Tags", () => {
  it("GET /tags/:arn — returns empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/tags/arn%3Aaws%3Amemorydb%3A%3Acluster%2Fc1");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ tags: [], total: 0 });
  });

  it("GET /tags/:arn — returns tags", async () => {
    mockSend.mockResolvedValueOnce({
      TagList: [{ Key: "env", Value: "prod" }],
    });
    const res = await get("/tags/arn%3Aaws%3Amemorydb%3A%3Acluster%2Fc1");
    const json = await res.json();
    expect(json.tags).toHaveLength(1);
    expect(json.total).toBe(1);
    expect(json.tags[0]).toEqual({ Key: "env", Value: "prod" });
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("ListTagsCommand");
  });

  it("POST /tags/:arn — 400 when tags missing", async () => {
    const res = await post("/tags/some-arn", {});
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("tags array is required");
  });

  it("POST /tags/:arn — 400 when tags not an array", async () => {
    const res = await post("/tags/some-arn", { tags: "not-an-array" });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("tags array is required");
  });

  it("POST /tags/:arn — tags resource", async () => {
    mockSend.mockResolvedValueOnce({
      TagList: [{ Key: "env", Value: "prod" }],
    });
    const res = await post("/tags/some-arn", {
      tags: [{ Key: "env", Value: "prod" }],
    });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.tags).toHaveLength(1);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("TagResourceCommand");
    expect(mockSend.mock.calls[0][0].ResourceArn).toBe("some-arn");
    expect(mockSend.mock.calls[0][0].Tags).toEqual([{ Key: "env", Value: "prod" }]);
  });

  it("DELETE /tags/:arn — 400 when tagKeys missing", async () => {
    const res = await del("/tags/some-arn", {});
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("tagKeys array is required");
  });

  it("DELETE /tags/:arn — 400 when tagKeys not an array", async () => {
    const res = await del("/tags/some-arn", { tagKeys: "nope" });
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("tagKeys array is required");
  });

  it("DELETE /tags/:arn — untags resource", async () => {
    mockSend.mockResolvedValueOnce({ TagList: [] });
    const res = await del("/tags/some-arn", { tagKeys: ["env"] });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.tags).toEqual([]);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("UntagResourceCommand");
    expect(mockSend.mock.calls[0][0].ResourceArn).toBe("some-arn");
    expect(mockSend.mock.calls[0][0].TagKeys).toEqual(["env"]);
  });
});
