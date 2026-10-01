import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const mockClient = vi.hoisted(() =>
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

vi.mock("@aws-sdk/client-timestream-influxdb", () => ({
  TimestreamInfluxDBClient: mockClient,
  ListDbInstancesCommand: createCmd("ListDbInstancesCommand"),
  CreateDbInstanceCommand: createCmd("CreateDbInstanceCommand"),
  GetDbInstanceCommand: createCmd("GetDbInstanceCommand"),
  UpdateDbInstanceCommand: createCmd("UpdateDbInstanceCommand"),
  DeleteDbInstanceCommand: createCmd("DeleteDbInstanceCommand"),
  RebootDbInstanceCommand: createCmd("RebootDbInstanceCommand"),
  ListDbClustersCommand: createCmd("ListDbClustersCommand"),
  CreateDbClusterCommand: createCmd("CreateDbClusterCommand"),
  DeleteDbClusterCommand: createCmd("DeleteDbClusterCommand"),
  ListDbBackupsCommand: createCmd("ListDbBackupsCommand"),
  CreateDbBackupCommand: createCmd("CreateDbBackupCommand"),
  DeleteDbBackupCommand: createCmd("DeleteDbBackupCommand"),
  ListDbParameterGroupsCommand: createCmd("ListDbParameterGroupsCommand"),
  CreateDbParameterGroupCommand: createCmd("CreateDbParameterGroupCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./timestreaminfluxdb";

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

async function put(path: string, body?: any) {
  return router.request(path, {
    method: "PUT",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { "content-type": "application/json" } : undefined,
  });
}

async function del(path: string) {
  return router.request(path, { method: "DELETE" });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSend.mockReset();
});

describe("db instances", () => {
  const CREATE = {
    name: "influx-1",
    password: "pw-123456",
    dbInstanceType: "db.influx.medium",
    vpcSubnetIds: ["subnet-1", "subnet-2"],
    vpcSecurityGroupIds: ["sg-1"],
    allocatedStorage: 20,
  };

  it("lists instances", async () => {
    mockSend.mockResolvedValueOnce({ items: [{ id: "i1", name: "influx-1", status: "RUNNING" }] });
    const res = await get("/db-instances");
    const json = await res.json();
    expect(json.total).toBe(1);
    expect(json.instances[0].status).toBe("RUNNING");
  });

  it("returns sparse instances", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/db-instances");
    const json = await res.json();
    expect(json.instances).toEqual([]);
  });

  it("creates an instance", async () => {
    mockSend.mockResolvedValueOnce({ id: "i1" });
    const res = await post("/db-instances", CREATE);
    expect(res.status).toBe(201);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "CreateDbInstanceCommand",
        name: "influx-1",
        password: "pw-123456",
        allocatedStorage: 20,
      })
    );
  });

  it("400 instance create without name", async () => {
    expect((await post("/db-instances", { ...CREATE, name: undefined })).status).toBe(400);
  });

  it("400 instance create without password", async () => {
    expect((await post("/db-instances", { ...CREATE, password: undefined })).status).toBe(400);
  });

  it("400 instance create without instance type", async () => {
    expect((await post("/db-instances", { ...CREATE, dbInstanceType: undefined })).status).toBe(400);
  });

  it("400 instance create without subnets", async () => {
    expect((await post("/db-instances", { ...CREATE, vpcSubnetIds: [] })).status).toBe(400);
    expect((await post("/db-instances", { ...CREATE, vpcSubnetIds: undefined })).status).toBe(400);
  });

  it("400 instance create without security groups", async () => {
    expect((await post("/db-instances", { ...CREATE, vpcSecurityGroupIds: [] })).status).toBe(400);
    expect((await post("/db-instances", { ...CREATE, vpcSecurityGroupIds: undefined })).status).toBe(400);
  });

  it("400 instance create without allocatedStorage", async () => {
    expect((await post("/db-instances", { ...CREATE, allocatedStorage: undefined })).status).toBe(400);
  });

  it("gets an instance", async () => {
    mockSend.mockResolvedValueOnce({ id: "i1", name: "influx-1" });
    const res = await get("/db-instances/influx-1");
    const json = await res.json();
    expect(json.instance.name).toBe("influx-1");
  });

  it("returns null instance when absent", async () => {
    mockSend.mockResolvedValueOnce(null);
    const res = await get("/db-instances/none");
    const json = await res.json();
    expect(json.instance).toBeNull();
  });

  it("updates an instance", async () => {
    mockSend.mockResolvedValueOnce({ id: "i1" });
    const res = await put("/db-instances/influx-1", {
      dbInstanceType: "db.influx.large",
      allocatedStorage: 40,
    });
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "UpdateDbInstanceCommand",
        identifier: "influx-1",
        dbInstanceType: "db.influx.large",
        allocatedStorage: 40,
      })
    );
  });

  it("400 instance update without instance type", async () => {
    expect((await put("/db-instances/influx-1", {})).status).toBe(400);
  });

  it("deletes an instance", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/db-instances/influx-1");
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "DeleteDbInstanceCommand",
        identifier: "influx-1",
      })
    );
  });

  it("reboots an instance", async () => {
    mockSend.mockResolvedValueOnce({ id: "i1" });
    const res = await post("/db-instances/influx-1/reboot");
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "RebootDbInstanceCommand",
        identifier: "influx-1",
      })
    );
  });
});

describe("db clusters", () => {
  it("lists clusters", async () => {
    mockSend.mockResolvedValueOnce({ items: [{ id: "c1", name: "cluster-1" }] });
    const res = await get("/db-clusters");
    const json = await res.json();
    expect(json.total).toBe(1);
  });

  it("returns sparse clusters", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/db-clusters");
    const json = await res.json();
    expect(json.clusters).toEqual([]);
  });

  it("creates a cluster", async () => {
    mockSend.mockResolvedValueOnce({ id: "c1" });
    const res = await post("/db-clusters", {
      name: "cluster-1",
      dbInstanceType: "db.influx.medium",
      vpcSubnetIds: ["subnet-1", "subnet-2"],
    });
    expect(res.status).toBe(201);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "CreateDbClusterCommand",
        name: "cluster-1",
      })
    );
  });

  it("400 cluster create without name or type", async () => {
    expect((await post("/db-clusters", { dbInstanceType: "t" })).status).toBe(400);
    expect((await post("/db-clusters", { name: "c" })).status).toBe(400);
  });

  it("400 cluster create with fewer than two subnets", async () => {
    expect(
      (await post("/db-clusters", { name: "c", dbInstanceType: "t", vpcSubnetIds: ["s1"] })).status
    ).toBe(400);
    expect(
      (await post("/db-clusters", { name: "c", dbInstanceType: "t", vpcSubnetIds: [] })).status
    ).toBe(400);
  });

  it("deletes a cluster", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/db-clusters/cluster-1");
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "DeleteDbClusterCommand",
        identifier: "cluster-1",
      })
    );
  });
});

describe("db backups", () => {
  it("lists backups", async () => {
    mockSend.mockResolvedValueOnce({ items: [{ id: "b1", name: "backup-1" }] });
    const res = await get("/db-backups");
    const json = await res.json();
    expect(json.total).toBe(1);
  });

  it("returns sparse backups", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/db-backups");
    const json = await res.json();
    expect(json.backups).toEqual([]);
  });

  it("creates a backup", async () => {
    mockSend.mockResolvedValueOnce({ id: "b1" });
    const res = await post("/db-backups", { name: "backup-1", dbResourceId: "res-1" });
    expect(res.status).toBe(201);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "CreateDbBackupCommand",
        name: "backup-1",
        dbResourceId: "res-1",
      })
    );
  });

  it("400 backup create without name or resourceId", async () => {
    expect((await post("/db-backups", { dbResourceId: "r" })).status).toBe(400);
    expect((await post("/db-backups", { name: "b" })).status).toBe(400);
  });

  it("deletes a backup", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/db-backups/backup-1");
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "DeleteDbBackupCommand",
        identifier: "backup-1",
      })
    );
  });
});

describe("db parameter groups", () => {
  it("lists parameter groups", async () => {
    mockSend.mockResolvedValueOnce({ items: [{ id: "pg1", name: "pg-1" }] });
    const res = await get("/db-parameter-groups");
    const json = await res.json();
    expect(json.total).toBe(1);
  });

  it("returns sparse parameter groups", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/db-parameter-groups");
    const json = await res.json();
    expect(json.parameterGroups).toEqual([]);
  });

  it("creates a parameter group", async () => {
    mockSend.mockResolvedValueOnce({ id: "pg1" });
    const res = await post("/db-parameter-groups", {
      name: "pg-1",
      description: "test group",
      parameters: [],
    });
    expect(res.status).toBe(201);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "CreateDbParameterGroupCommand",
        name: "pg-1",
        description: "test group",
      })
    );
  });

  it("400 parameter group create without name, description or parameters", async () => {
    expect((await post("/db-parameter-groups", { description: "d", parameters: [] })).status).toBe(400);
    expect((await post("/db-parameter-groups", { name: "n", parameters: [] })).status).toBe(400);
    expect((await post("/db-parameter-groups", { name: "n", description: "d" })).status).toBe(400);
  });
});
