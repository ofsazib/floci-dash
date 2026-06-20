import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const mockDocDB = vi.hoisted(() =>
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

vi.mock("@aws-sdk/client-docdb", () => ({
  DocDBClient: mockDocDB,
  CreateDBClusterCommand: createCmd("CreateDBClusterCommand"),
  DescribeDBClustersCommand: createCmd("DescribeDBClustersCommand"),
  DeleteDBClusterCommand: createCmd("DeleteDBClusterCommand"),
  ModifyDBClusterCommand: createCmd("ModifyDBClusterCommand"),
  CreateDBInstanceCommand: createCmd("CreateDBInstanceCommand"),
  DescribeDBInstancesCommand: createCmd("DescribeDBInstancesCommand"),
  DeleteDBInstanceCommand: createCmd("DeleteDBInstanceCommand"),
  ModifyDBInstanceCommand: createCmd("ModifyDBInstanceCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./docdb";

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

describe("DocDB — Clusters", () => {
  it("GET /clusters — returns empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/clusters");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ clusters: [], total: 0 });
  });

  it("GET /clusters — returns clusters", async () => {
    mockSend.mockResolvedValueOnce({ DBClusters: [{ DBClusterIdentifier: "c1" }] });
    const res = await get("/clusters");
    const json = await res.json();
    expect(json.clusters).toHaveLength(1);
    expect(json.total).toBe(1);
  });

  it("GET /clusters/:id — returns single cluster", async () => {
    mockSend.mockResolvedValueOnce({ DBClusters: [{ DBClusterIdentifier: "my-cluster" }] });
    const res = await get("/clusters/my-cluster");
    const json = await res.json();
    expect(json.cluster).toEqual({ DBClusterIdentifier: "my-cluster" });
  });

  it("GET /clusters/:id — returns null when not found", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/clusters/nonexistent");
    const json = await res.json();
    expect(json.cluster).toBeNull();
  });

  it("POST /clusters — 400 when DBClusterIdentifier missing", async () => {
    const res = await post("/clusters", {});
    expect(res.status).toBe(400);
  });

  it("POST /clusters — creates cluster", async () => {
    mockSend.mockResolvedValueOnce({ DBCluster: { DBClusterIdentifier: "c1" } });
    const res = await post("/clusters", { DBClusterIdentifier: "c1" });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.cluster.DBClusterIdentifier).toBe("c1");
  });

  it("DELETE /clusters/:id — deletes cluster", async () => {
    mockSend.mockResolvedValueOnce({ DBCluster: {} });
    const res = await del("/clusters/my-cluster");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.deleted).toBe(true);
  });

  it("PATCH /clusters/:id — modifies cluster", async () => {
    mockSend.mockResolvedValueOnce({ DBCluster: { DBClusterIdentifier: "c1" } });
    const res = await patch("/clusters/c1", { EngineVersion: "5.0" });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.cluster.DBClusterIdentifier).toBe("c1");
  });
});

describe("DocDB — Instances", () => {
  it("GET /instances — returns empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/instances");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ instances: [], total: 0 });
  });

  it("GET /instances — returns instances", async () => {
    mockSend.mockResolvedValueOnce({ DBInstances: [{ DBInstanceIdentifier: "i1" }] });
    const res = await get("/instances");
    const json = await res.json();
    expect(json.instances).toHaveLength(1);
  });

  it("GET /instances/:id — returns single instance", async () => {
    mockSend.mockResolvedValueOnce({ DBInstances: [{ DBInstanceIdentifier: "my-inst" }] });
    const res = await get("/instances/my-inst");
    const json = await res.json();
    expect(json.instance).toEqual({ DBInstanceIdentifier: "my-inst" });
  });

  it("POST /instances — 400 when DBInstanceIdentifier missing", async () => {
    const res = await post("/instances", { DBClusterIdentifier: "c1" });
    expect(res.status).toBe(400);
  });

  it("POST /instances — 400 when DBClusterIdentifier missing", async () => {
    const res = await post("/instances", { DBInstanceIdentifier: "i1" });
    expect(res.status).toBe(400);
  });

  it("POST /instances — creates instance", async () => {
    mockSend.mockResolvedValueOnce({ DBInstance: { DBInstanceIdentifier: "i1" } });
    const res = await post("/instances", { DBInstanceIdentifier: "i1", DBClusterIdentifier: "c1" });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.instance.DBInstanceIdentifier).toBe("i1");
  });

  it("DELETE /instances/:id — deletes instance", async () => {
    mockSend.mockResolvedValueOnce({ DBInstance: {} });
    const res = await del("/instances/my-inst");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.deleted).toBe(true);
  });

  it("PATCH /instances/:id — modifies instance", async () => {
    mockSend.mockResolvedValueOnce({ DBInstance: { DBInstanceIdentifier: "i1" } });
    const res = await patch("/instances/i1", { DBInstanceClass: "db.r5.large" });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.instance.DBInstanceIdentifier).toBe("i1");
  });
});
