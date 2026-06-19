import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) {
      return { __cmdName: name, ...args };
    });
  };
});

vi.mock("@aws-sdk/client-elasticache", () => ({
  ElastiCacheClient: vi.fn(() => ({ send: mockSend })),
  DescribeReplicationGroupsCommand: createCmd("DescribeReplicationGroupsCommand"),
  CreateReplicationGroupCommand: createCmd("CreateReplicationGroupCommand"),
  DeleteReplicationGroupCommand: createCmd("DeleteReplicationGroupCommand"),
  DescribeCacheClustersCommand: createCmd("DescribeCacheClustersCommand"),
  CreateCacheClusterCommand: createCmd("CreateCacheClusterCommand"),
  DeleteCacheClusterCommand: createCmd("DeleteCacheClusterCommand"),
  DescribeUsersCommand: createCmd("DescribeUsersCommand"),
  CreateUserCommand: createCmd("CreateUserCommand"),
  DeleteUserCommand: createCmd("DeleteUserCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./elasticache";

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

beforeEach(() => {
  vi.clearAllMocks();
  mockSend.mockReset();
});

describe("ElastiCache Routes", () => {
  describe("Replication Groups", () => {
    it("GET /replication-groups — returns list", async () => {
      mockSend.mockResolvedValueOnce({
        ReplicationGroups: [{ ReplicationGroupId: "my-rg", Status: "available" }],
      });
      const res = await get("/replication-groups");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.replicationGroups[0].ReplicationGroupId).toBe("my-rg");
    });

    it("GET /replication-groups — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ ReplicationGroups: [] });
      const res = await get("/replication-groups");
      const body = await res.json();
      expect(body.total).toBe(0);
    });

    it("POST /replication-groups — creates with required fields", async () => {
      mockSend.mockResolvedValueOnce({
        ReplicationGroup: { ReplicationGroupId: "new-rg", Status: "creating" },
      });
      const res = await post("/replication-groups", { ReplicationGroupId: "new-rg" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.created).toBe(true);
      expect(body.replicationGroup.ReplicationGroupId).toBe("new-rg");
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("CreateReplicationGroupCommand");
    });

    it("POST /replication-groups — 400 when ReplicationGroupId missing", async () => {
      const res = await post("/replication-groups", {});
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("ReplicationGroupId is required");
    });

    it("POST /replication-groups/delete — deletes", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/replication-groups/delete", { ReplicationGroupId: "my-rg" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("DeleteReplicationGroupCommand");
    });

    it("POST /replication-groups/delete — 400 when ReplicationGroupId missing", async () => {
      const res = await post("/replication-groups/delete", {});
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("ReplicationGroupId is required");
    });
  });

  describe("Cache Clusters", () => {
    it("GET /cache-clusters — returns list", async () => {
      mockSend.mockResolvedValueOnce({
        CacheClusters: [{ CacheClusterId: "my-cache", Engine: "memcached", CacheClusterStatus: "available" }],
      });
      const res = await get("/cache-clusters");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.cacheClusters[0].CacheClusterId).toBe("my-cache");
    });

    it("GET /cache-clusters — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ CacheClusters: [] });
      const res = await get("/cache-clusters");
      const body = await res.json();
      expect(body.total).toBe(0);
    });

    it("POST /cache-clusters — creates with required fields", async () => {
      mockSend.mockResolvedValueOnce({
        CacheCluster: { CacheClusterId: "new-cache", Engine: "memcached", CacheClusterStatus: "creating" },
      });
      const res = await post("/cache-clusters", { CacheClusterId: "new-cache" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.created).toBe(true);
      expect(body.cacheCluster.CacheClusterId).toBe("new-cache");
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("CreateCacheClusterCommand");
    });

    it("POST /cache-clusters — 400 when CacheClusterId missing", async () => {
      const res = await post("/cache-clusters", {});
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("CacheClusterId is required");
    });

    it("POST /cache-clusters/delete — deletes", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/cache-clusters/delete", { CacheClusterId: "my-cache" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("DeleteCacheClusterCommand");
    });

    it("POST /cache-clusters/delete — 400 when CacheClusterId missing", async () => {
      const res = await post("/cache-clusters/delete", {});
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("CacheClusterId is required");
    });
  });

  describe("Users", () => {
    it("GET /users — returns list", async () => {
      mockSend.mockResolvedValueOnce({
        Users: [{ UserId: "user-1", UserName: "test-user" }],
      });
      const res = await get("/users");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.users[0].UserId).toBe("user-1");
    });

    it("POST /users — creates with required fields", async () => {
      mockSend.mockResolvedValueOnce({
        UserId: "new-user",
        UserName: "New User",
      });
      const res = await post("/users", { UserId: "new-user" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.created).toBe(true);
      expect(body.user.UserId).toBe("new-user");
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("CreateUserCommand");
    });

    it("POST /users — 400 when UserId missing", async () => {
      const res = await post("/users", {});
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("UserId is required");
    });

    it("POST /users/delete — deletes", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/users/delete", { UserId: "user-1" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("DeleteUserCommand");
    });

    it("POST /users/delete — 400 when UserId missing", async () => {
      const res = await post("/users/delete", {});
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("UserId is required");
    });
  });
});
