import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) {
      return { __cmdName: name, ...args };
    });
  };
});

vi.mock("@aws-sdk/client-eks", () => ({
  EKSClient: vi.fn(function () {
    return { send: mockSend };
  }),
  ListClustersCommand: createCmd("ListClustersCommand"),
  CreateClusterCommand: createCmd("CreateClusterCommand"),
  DescribeClusterCommand: createCmd("DescribeClusterCommand"),
  DeleteClusterCommand: createCmd("DeleteClusterCommand"),
  ListNodegroupsCommand: createCmd("ListNodegroupsCommand"),
  CreateNodegroupCommand: createCmd("CreateNodegroupCommand"),
  DescribeNodegroupCommand: createCmd("DescribeNodegroupCommand"),
  DeleteNodegroupCommand: createCmd("DeleteNodegroupCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: (Ctor: any, extra?: any) => new Ctor(extra),
}));

import router from "./eks";

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

beforeEach(() => {
  mockSend.mockReset();
});

describe("EKS Routes", () => {
  describe("Clusters", () => {
    it("GET /clusters — lists clusters with details", async () => {
      mockSend
        .mockResolvedValueOnce({ clusters: ["cluster-1", "cluster-2"] })
        .mockResolvedValueOnce({
          cluster: { name: "cluster-1", arn: "arn:aws:eks:us-east-1:123456789:cluster/cluster-1", status: "ACTIVE" },
        })
        .mockResolvedValueOnce({
          cluster: { name: "cluster-2", arn: "arn:aws:eks:us-east-1:123456789:cluster/cluster-2", status: "CREATING" },
        });
      const res = await get("/clusters");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(2);
      expect(body.clusters[0].name).toBe("cluster-1");
      expect(body.clusters[1].status).toBe("CREATING");
    });

    it("GET /clusters — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ clusters: [] });
      const res = await get("/clusters");
      const body = await res.json();
      expect(body.total).toBe(0);
      expect(body.clusters).toEqual([]);
    });

    it("POST /clusters — creates cluster (201)", async () => {
      mockSend.mockResolvedValueOnce({
        cluster: { name: "new-cluster", arn: "arn:aws:eks:us-east-1:123456789:cluster/new-cluster", status: "CREATING" },
      });
      const res = await post("/clusters", {
        name: "new-cluster",
        roleArn: "arn:aws:iam::123456789012:role/eks-role",
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.cluster.name).toBe("new-cluster");
    });

    it("POST /clusters — 400 when name missing", async () => {
      const res = await post("/clusters", { roleArn: "arn:aws:iam::123456789012:role/eks-role" });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("name is required");
    });

    it("POST /clusters — 400 when roleArn missing", async () => {
      const res = await post("/clusters", { name: "my-cluster" });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("roleArn is required");
    });

    it("GET /clusters/:name — describes cluster", async () => {
      mockSend.mockResolvedValueOnce({
        cluster: { name: "my-cluster", arn: "arn:aws:eks:us-east-1:123456789:cluster/my-cluster", status: "ACTIVE", version: "1.27" },
      });
      const res = await get("/clusters/my-cluster");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.cluster.name).toBe("my-cluster");
      expect(body.cluster.version).toBe("1.27");
    });

    it("DELETE /clusters/:name — deletes cluster", async () => {
      mockSend.mockResolvedValueOnce({
        cluster: { name: "my-cluster", status: "DELETING" },
      });
      const res = await del("/clusters/my-cluster");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
      expect(body.cluster.status).toBe("DELETING");
    });
  });

  describe("Node Groups", () => {
    it("GET /clusters/:name/node-groups — lists nodegroups with details", async () => {
      mockSend
        .mockResolvedValueOnce({ nodegroups: ["ng-1"] })
        .mockResolvedValueOnce({
          nodegroup: {
            nodegroupName: "ng-1",
            clusterName: "my-cluster",
            status: "ACTIVE",
            nodeRole: "arn:aws:iam::123456789012:role/node-role",
            subnets: ["subnet-123"],
            instanceTypes: ["t3.medium"],
          },
        });
      const res = await get("/clusters/my-cluster/node-groups");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.nodegroups[0].nodegroupName).toBe("ng-1");
    });

    it("GET /clusters/:name/node-groups — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ nodegroups: [] });
      const res = await get("/clusters/my-cluster/node-groups");
      const body = await res.json();
      expect(body.total).toBe(0);
      expect(body.nodegroups).toEqual([]);
    });

    it("POST /clusters/:name/node-groups — creates nodegroup (201)", async () => {
      mockSend.mockResolvedValueOnce({
        nodegroup: {
          nodegroupName: "new-ng",
          clusterName: "my-cluster",
          status: "CREATING",
        },
      });
      const res = await post("/clusters/my-cluster/node-groups", {
        nodegroupName: "new-ng",
        nodeRole: "arn:aws:iam::123456789012:role/node-role",
        subnets: ["subnet-123"],
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.nodegroup.nodegroupName).toBe("new-ng");
    });

    it("POST /clusters/:name/node-groups — 400 when nodegroupName missing", async () => {
      const res = await post("/clusters/my-cluster/node-groups", {
        nodeRole: "arn:aws:iam::123456789012:role/node-role",
        subnets: ["subnet-123"],
      });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("nodegroupName is required");
    });

    it("POST /clusters/:name/node-groups — 400 when nodeRole missing", async () => {
      const res = await post("/clusters/my-cluster/node-groups", {
        nodegroupName: "new-ng",
        subnets: ["subnet-123"],
      });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("nodeRole is required");
    });

    it("POST /clusters/:name/node-groups — 400 when subnets empty", async () => {
      const res = await post("/clusters/my-cluster/node-groups", {
        nodegroupName: "new-ng",
        nodeRole: "arn:aws:iam::123456789012:role/node-role",
        subnets: [],
      });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("subnets is required");
    });

    it("GET /clusters/:name/node-groups/:ngName — describes nodegroup", async () => {
      mockSend.mockResolvedValueOnce({
        nodegroup: {
          nodegroupName: "ng-1",
          clusterName: "my-cluster",
          status: "ACTIVE",
          version: "1.27",
        },
      });
      const res = await get("/clusters/my-cluster/node-groups/ng-1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.nodegroup.nodegroupName).toBe("ng-1");
    });

    it("DELETE /clusters/:name/node-groups/:ngName — deletes nodegroup", async () => {
      mockSend.mockResolvedValueOnce({
        nodegroup: { nodegroupName: "ng-1", status: "DELETING" },
      });
      const res = await del("/clusters/my-cluster/node-groups/ng-1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });
  });
});
