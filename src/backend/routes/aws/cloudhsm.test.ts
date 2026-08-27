import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) {
      return { __cmdName: name, ...args };
    });
  };
});

vi.mock("@aws-sdk/client-cloudhsm-v2", () => ({
  CloudHSMV2Client: vi.fn(function () {
    return { send: mockSend };
  }),
  DescribeClustersCommand: createCmd("DescribeClustersCommand"),
  CreateClusterCommand: createCmd("CreateClusterCommand"),
  DeleteClusterCommand: createCmd("DeleteClusterCommand"),
  DescribeBackupsCommand: createCmd("DescribeBackupsCommand"),
  DeleteBackupCommand: createCmd("DeleteBackupCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./cloudhsm";

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

async function delWithBody(path: string, body?: any) {
  return router.request(path, {
    method: "DELETE",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { "content-type": "application/json" } : undefined,
  });
}

beforeEach(() => {
  mockSend.mockReset();
});

describe("CloudHSM routes", () => {
  it("lists clusters", async () => {
    mockSend.mockResolvedValueOnce({
      Clusters: [{ ClusterId: "c-1", State: "ACTIVE" }],
      NextToken: "tok",
    });
    const res = await get("/clusters");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.total).toBe(1);
    expect(json.nextToken).toBe("tok");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("DescribeClustersCommand");
  });

  it("returns empty clusters list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/clusters");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ clusters: [], total: 0, nextToken: null });
  });

  it("gets cluster detail by filter", async () => {
    mockSend.mockResolvedValueOnce({
      Clusters: [
        {
          ClusterId: "c-1",
          State: "INITIALIZED",
          HsmType: "hsm1.medium",
          SubnetMapping: { "az-1": "subnet-1" },
          VpcId: "vpc-1",
          Hsms: { "hsm-1": {}, "hsm-2": {} },
          SecurityGroup: "sg-1",
          CreateTimestamp: 111,
          BackupRetentionPolicy: { Type: "DAYS", Value: "90" },
        },
      ],
    });
    const res = await get("/clusters/c-1");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.cluster.clusterId).toBe("c-1");
    expect(json.cluster.hsmCount).toBe(2);
    expect(json.cluster.createTimestamp).toBe("111");
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      __cmdName: "DescribeClustersCommand",
      Filters: { clusterIds: ["c-1"] },
    });
  });

  it("returns null cluster when filter misses", async () => {
    mockSend.mockResolvedValueOnce({ Clusters: [] });
    const res = await get("/clusters/nope");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ cluster: null });
  });

  it("returns null cluster when response empty", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/clusters/nope2");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ cluster: null });
  });

  it("defaults optional cluster detail fields when sparse", async () => {
    mockSend.mockResolvedValueOnce({ Clusters: [{}] });
    const res = await get("/clusters/c-9");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      cluster: {
        clusterId: null,
        state: null,
        hsmType: null,
        subnetMapping: {},
        vpcId: null,
        hsmCount: 0,
        securityGroup: null,
        createTimestamp: "",
        backupRetentionPolicy: null,
      },
    });
  });

  it("creates a cluster", async () => {
    mockSend.mockResolvedValueOnce({
      Cluster: { ClusterId: "c-new", State: "CREATE_IN_PROGRESS" },
    });
    const res = await post("/clusters", {
      hsmType: "hsm1.medium",
      subnetIds: ["subnet-1", "subnet-2"],
    });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({
      clusterId: "c-new",
      state: "CREATE_IN_PROGRESS",
    });
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      __cmdName: "CreateClusterCommand",
      HsmType: "hsm1.medium",
      SubnetIds: ["subnet-1", "subnet-2"],
    });
  });

  it("rejects create without hsmType", async () => {
    const res = await post("/clusters", { subnetIds: ["s"] });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "hsmType is required" });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("rejects create without subnetIds", async () => {
    const res = await post("/clusters", { hsmType: "hsm1.medium" });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "subnetIds are required" });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("rejects create with empty subnetIds", async () => {
    const res = await post("/clusters", { hsmType: "hsm1.medium", subnetIds: [] });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "subnetIds are required" });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("deletes a cluster", async () => {
    mockSend.mockResolvedValueOnce({ Cluster: { ClusterId: "c-1", State: "DELETED" } });
    const res = await delWithBody("/clusters/c-1");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ clusterId: "c-1", state: "DELETED" });
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      __cmdName: "DeleteClusterCommand",
      ClusterId: "c-1",
    });
  });

  it("defaults cluster id on delete when response sparse", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await delWithBody("/clusters/c-x");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ clusterId: "c-x", state: null });
  });

  it("lists backups with normalization", async () => {
    mockSend.mockResolvedValueOnce({
      Backups: [
        {
          BackupId: "b-1",
          ClusterId: "c-1",
          BackupState: "READY",
          CreateTimestamp: 222,
          NeverExpires: true,
        },
      ],
    });
    const res = await get("/backups");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.backups[0]).toEqual({
      backupId: "b-1",
      clusterId: "c-1",
      state: "READY",
      createTimestamp: "222",
      neverExpires: true,
    });
    expect(json.total).toBe(1);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("DescribeBackupsCommand");
  });

  it("returns empty backups list with defaults", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/backups");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ backups: [], total: 0, nextToken: null });
  });

  it("defaults backup fields when sparse", async () => {
    mockSend.mockResolvedValueOnce({ Backups: [{}] });
    const res = await get("/backups");
    const json = await res.json();
    expect(json.backups[0]).toEqual({
      backupId: null,
      clusterId: null,
      state: null,
      createTimestamp: "",
      neverExpires: false,
    });
  });

  it("deletes a backup", async () => {
    mockSend.mockResolvedValueOnce({ Backup: { BackupId: "b-1", BackupState: "DELETED" } });
    const res = await delWithBody("/backups/b-1");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ backupId: "b-1", state: "DELETED" });
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      __cmdName: "DeleteBackupCommand",
      BackupId: "b-1",
    });
  });

  it("defaults backup id on delete when response sparse", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await delWithBody("/backups/b-x");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ backupId: "b-x", state: null });
  });
});
