import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) {
      return { __cmdName: name, ...args };
    });
  };
});

vi.mock("@aws-sdk/client-neptune", () => ({
  NeptuneClient: vi.fn(function () {
    return { send: mockSend };
  }),
  DescribeDBClustersCommand: createCmd("DescribeDBClustersCommand"),
  CreateDBClusterCommand: createCmd("CreateDBClusterCommand"),
  DeleteDBClusterCommand: createCmd("DeleteDBClusterCommand"),
  DescribeDBInstancesCommand: createCmd("DescribeDBInstancesCommand"),
  CreateDBInstanceCommand: createCmd("CreateDBInstanceCommand"),
  DeleteDBInstanceCommand: createCmd("DeleteDBInstanceCommand"),
  ModifyDBClusterCommand: createCmd("ModifyDBClusterCommand"),
  ModifyDBInstanceCommand: createCmd("ModifyDBInstanceCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: (Ctor: any, extra?: any) => new Ctor(extra),
}));

import router from "./neptune";

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

describe("Neptune Routes", () => {
  describe("Clusters", () => {
    it("GET /clusters — lists clusters", async () => {
      mockSend.mockResolvedValueOnce({
        DBClusters: [
          { DBClusterIdentifier: "cluster-1", Status: "available", Engine: "neptune" },
        ],
      });
      const res = await get("/clusters");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.clusters[0].DBClusterIdentifier).toBe("cluster-1");
    });

    it("GET /clusters — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ DBClusters: [] });
      const res = await get("/clusters");
      const body = await res.json();
      expect(body.total).toBe(0);
    });

    it("GET /clusters — sparse response defaults to empty array", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/clusters");
      const body = await res.json();
      expect(body.clusters).toEqual([]);
      expect(body.total).toBe(0);
    });

    it("GET /clusters/:id — describes cluster", async () => {
      mockSend.mockResolvedValueOnce({
        DBClusters: [{ DBClusterIdentifier: "cluster-1", Status: "available" }],
      });
      const res = await get("/clusters/cluster-1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.cluster.DBClusterIdentifier).toBe("cluster-1");
    });

    it("POST /clusters — creates cluster (201)", async () => {
      mockSend.mockResolvedValueOnce({ DBCluster: { DBClusterIdentifier: "cluster-1" } });
      const res = await post("/clusters", { dbClusterIdentifier: "cluster-1" });
      expect(res.status).toBe(201);
    });

    it("POST /clusters — 400 if identifier missing", async () => {
      const res = await post("/clusters", {});
      expect(res.status).toBe(400);
    });

    it("DELETE /clusters/:id — deletes cluster", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/clusters/cluster-1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });
  });

  describe("Instances", () => {
    it("GET /instances — lists instances", async () => {
      mockSend.mockResolvedValueOnce({
        DBInstances: [{ DBInstanceIdentifier: "inst-1", DBInstanceStatus: "available" }],
      });
      const res = await get("/instances");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
    });

    it("GET /instances — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ DBInstances: [] });
      const res = await get("/instances");
      const body = await res.json();
      expect(body.total).toBe(0);
    });

    it("GET /instances — sparse response defaults to empty array", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/instances");
      const body = await res.json();
      expect(body.instances).toEqual([]);
      expect(body.total).toBe(0);
    });

    it("GET /instances/:id — describes instance", async () => {
      mockSend.mockResolvedValueOnce({
        DBInstances: [{ DBInstanceIdentifier: "inst-1" }],
      });
      const res = await get("/instances/inst-1");
      expect(res.status).toBe(200);
    });

    it("POST /instances — creates instance (201)", async () => {
      mockSend.mockResolvedValueOnce({ DBInstance: { DBInstanceIdentifier: "inst-1" } });
      const res = await post("/instances", {
        dbInstanceIdentifier: "inst-1",
        dbClusterIdentifier: "cluster-1",
      });
      expect(res.status).toBe(201);
    });

    it("POST /instances — 400 if identifier missing", async () => {
      const res = await post("/instances", { dbClusterIdentifier: "c1" });
      expect(res.status).toBe(400);
    });

    it("POST /instances — 400 if cluster identifier missing", async () => {
      const res = await post("/instances", { dbInstanceIdentifier: "i1" });
      expect(res.status).toBe(400);
    });

    it("DELETE /instances/:id — deletes instance", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/instances/inst-1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });
  });

  describe("Modify cluster + instance", () => {
    it("PATCH /clusters/:id — modifies the cluster", async () => {
      mockSend.mockResolvedValueOnce({ DBCluster: { DBClusterIdentifier: "c1" } });
      const res = await router.request("/clusters/c1", {
        method: "PATCH",
        body: JSON.stringify({ engineVersion: "1.3.0", iamDatabaseAuthenticationEnabled: true }),
        headers: { "content-type": "application/json" },
      });
      const body = await res.json();
      expect(body.cluster.DBClusterIdentifier).toBe("c1");
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.__cmdName).toBe("ModifyDBClusterCommand");
      expect(cmd.EngineVersion).toBe("1.3.0");
      expect(cmd.EnableIAMDatabaseAuthentication).toBe(true);
    });

    it("PATCH /clusters/:id — null on sparse response", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await router.request("/clusters/c1", {
        method: "PATCH",
        body: "{}",
        headers: { "content-type": "application/json" },
      });
      expect((await res.json()).cluster).toBeNull();
    });

    it("PATCH /instances/:id — null on sparse response", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await router.request("/instances/i1", {
        method: "PATCH",
        body: "{}",
        headers: { "content-type": "application/json" },
      });
      expect((await res.json()).instance).toBeNull();
    });

    it("PATCH /instances/:id — modifies the instance class", async () => {
      mockSend.mockResolvedValueOnce({ DBInstance: { DBInstanceIdentifier: "i1" } });
      const res = await router.request("/instances/i1", {
        method: "PATCH",
        body: JSON.stringify({ instanceClass: "db.r5.large" }),
        headers: { "content-type": "application/json" },
      });
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.__cmdName).toBe("ModifyDBInstanceCommand");
      expect(cmd.DBInstanceClass).toBe("db.r5.large");
    });
  });
});
