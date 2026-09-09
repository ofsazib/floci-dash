import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSend, mocks } = vi.hoisted(() => {
  const mockSend = vi.fn();
  const createCmd = (name: string) =>
    vi.fn(function (this: any, args?: any) {
      const cmd: any = { ...args, __cmdName: name };
      return cmd;
    });
  return {
    mockSend,
    mocks: {
      RedshiftClient: vi.fn(function (this: any) {
        return { send: mockSend };
      }),
      CreateClusterCommand: createCmd("CreateClusterCommand"),
      DescribeClustersCommand: createCmd("DescribeClustersCommand"),
      DeleteClusterCommand: createCmd("DeleteClusterCommand"),
      ModifyClusterCommand: createCmd("ModifyClusterCommand"),
      RebootClusterCommand: createCmd("RebootClusterCommand"),
      CreateClusterSnapshotCommand: createCmd("CreateClusterSnapshotCommand"),
      DescribeClusterSnapshotsCommand: createCmd("DescribeClusterSnapshotsCommand"),
      DeleteClusterSnapshotCommand: createCmd("DeleteClusterSnapshotCommand"),
      RestoreFromClusterSnapshotCommand: createCmd("RestoreFromClusterSnapshotCommand"),
      CreateClusterParameterGroupCommand: createCmd("CreateClusterParameterGroupCommand"),
      DescribeClusterParameterGroupsCommand: createCmd("DescribeClusterParameterGroupsCommand"),
      DescribeClusterParametersCommand: createCmd("DescribeClusterParametersCommand"),
      ModifyClusterParameterGroupCommand: createCmd("ModifyClusterParameterGroupCommand"),
      DeleteClusterParameterGroupCommand: createCmd("DeleteClusterParameterGroupCommand"),
      CreateClusterSubnetGroupCommand: createCmd("CreateClusterSubnetGroupCommand"),
      DescribeClusterSubnetGroupsCommand: createCmd("DescribeClusterSubnetGroupsCommand"),
      ModifyClusterSubnetGroupCommand: createCmd("ModifyClusterSubnetGroupCommand"),
      DeleteClusterSubnetGroupCommand: createCmd("DeleteClusterSubnetGroupCommand"),
      CreateTagsCommand: createCmd("CreateTagsCommand"),
      DeleteTagsCommand: createCmd("DeleteTagsCommand"),
      DescribeTagsCommand: createCmd("DescribeTagsCommand"),
    },
  };
});

vi.mock("@aws-sdk/client-redshift", () => mocks);

import router from "./redshift";

const get = (path: string) => router.request(path);
const post = (path: string, body?: any) =>
  router.request(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
const put = (path: string, body?: any) =>
  router.request(path, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
const del = (path: string) => router.request(path, { method: "DELETE" });

const cluster = {
  ClusterIdentifier: "my-cluster",
  ClusterStatus: "available",
  NodeType: "ra3.xlplus",
};
const snapshot = { SnapshotIdentifier: "snap-1", Status: "available" };
const pg = { ParameterGroupName: "pg-1", ParameterGroupFamily: "redshift-1.0" };
const sg = { ClusterSubnetGroupName: "sg-1", SubnetGroupStatus: "Complete" };

beforeEach(() => {
  mockSend.mockReset();
});

describe("Redshift — clusters", () => {
  it("GET /clusters — lists clusters without identifier", async () => {
    mockSend.mockResolvedValueOnce({ Clusters: [cluster] });
    const res = await get("/clusters");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.clusters).toHaveLength(1);
    expect(body.total).toBe(1);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("DescribeClustersCommand");
    expect(cmd.ClusterIdentifier).toBeUndefined();
  });

  it("GET /clusters — filters by identifier and falls back when undefined", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/clusters?identifier=my-cluster");
    const body = await res.json();
    expect(body.clusters).toEqual([]);
    expect(body.total).toBe(0);
    expect(mockSend.mock.calls[0][0].ClusterIdentifier).toBe("my-cluster");
  });

  it("POST /clusters — creates a cluster", async () => {
    mockSend.mockResolvedValueOnce({ Cluster: cluster });
    const res = await post("/clusters", {
      identifier: "my-cluster",
      nodeType: "ra3.xlplus",
      masterUsername: "admin",
      masterUserPassword: "Passw0rd!",
      subnetGroupName: "sg-1",
      vpcSecurityGroupIds: ["sg-abc"],
      numberOfNodes: 2,
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.cluster.ClusterIdentifier).toBe("my-cluster");
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("CreateClusterCommand");
    expect(cmd.NodeType).toBe("ra3.xlplus");
    expect(cmd.NumberOfNodes).toBe(2);
  });

  it("POST /clusters — 400 when required fields missing", async () => {
    const res = await post("/clusters", { identifier: "x" });
    expect(res.status).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("PUT /clusters/:id — modifies a cluster", async () => {
    mockSend.mockResolvedValueOnce({ Cluster: cluster });
    const res = await put("/clusters/my-cluster", {
      nodeType: "ra3.4xlarge",
      numberOfNodes: 4,
      securityGroups: ["default"],
      masterUserPassword: "NewPassw0rd!",
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.cluster.ClusterIdentifier).toBe("my-cluster");
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("ModifyClusterCommand");
    expect(cmd.ClusterIdentifier).toBe("my-cluster");
    expect(cmd.NodeType).toBe("ra3.4xlarge");
  });

  it("POST /clusters/:id/reboot — reboots a cluster", async () => {
    mockSend.mockResolvedValueOnce({ Cluster: cluster });
    const res = await post("/clusters/my-cluster/reboot");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.cluster.ClusterIdentifier).toBe("my-cluster");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("RebootClusterCommand");
  });

  it("DELETE /clusters/:id — deletes a cluster", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/clusters/my-cluster");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("DeleteClusterCommand");
    expect(cmd.ClusterIdentifier).toBe("my-cluster");
  });
});

describe("Redshift — snapshots", () => {
  it("GET /snapshots — lists snapshots", async () => {
    mockSend.mockResolvedValueOnce({ Snapshots: [snapshot] });
    const res = await get("/snapshots");
    const body = await res.json();
    expect(body.snapshots).toHaveLength(1);
    expect(body.total).toBe(1);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("DescribeClusterSnapshotsCommand");
    expect(mockSend.mock.calls[0][0].ClusterIdentifier).toBeUndefined();
  });

  it("GET /snapshots — filters by identifier and falls back when undefined", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/snapshots?identifier=my-cluster");
    const body = await res.json();
    expect(body.snapshots).toEqual([]);
    expect(mockSend.mock.calls[0][0].ClusterIdentifier).toBe("my-cluster");
  });

  it("POST /snapshots — creates a snapshot", async () => {
    mockSend.mockResolvedValueOnce({ Snapshot: snapshot });
    const res = await post("/snapshots", { identifier: "my-cluster", snapshotIdentifier: "snap-1" });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.snapshot.SnapshotIdentifier).toBe("snap-1");
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("CreateClusterSnapshotCommand");
    expect(cmd.SnapshotIdentifier).toBe("snap-1");
  });

  it("POST /snapshots — 400 when required fields missing", async () => {
    const res = await post("/snapshots", { identifier: "my-cluster" });
    expect(res.status).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("DELETE /snapshots/:id — deletes a snapshot", async () => {
    mockSend.mockResolvedValueOnce({ Snapshot: snapshot });
    const res = await del("/snapshots/snap-1");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.snapshot.SnapshotIdentifier).toBe("snap-1");
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("DeleteClusterSnapshotCommand");
    expect(cmd.SnapshotIdentifier).toBe("snap-1");
  });

  it("POST /snapshots/restore — restores from snapshot", async () => {
    mockSend.mockResolvedValueOnce({ Cluster: cluster });
    const res = await post("/snapshots/restore", {
      snapshotIdentifier: "snap-1",
      targetIdentifier: "restored",
      nodeType: "ra3.xlplus",
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.cluster.ClusterIdentifier).toBe("my-cluster");
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("RestoreFromClusterSnapshotCommand");
    expect(cmd.ClusterIdentifier).toBe("restored");
    expect(cmd.SnapshotIdentifier).toBe("snap-1");
  });

  it("POST /snapshots/restore — 400 when required fields missing", async () => {
    const res = await post("/snapshots/restore", { snapshotIdentifier: "snap-1" });
    expect(res.status).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
  });
});

describe("Redshift — parameter groups", () => {
  it("GET /parameter-groups — lists parameter groups", async () => {
    mockSend.mockResolvedValueOnce({ ParameterGroups: [pg] });
    const res = await get("/parameter-groups");
    const body = await res.json();
    expect(body.parameterGroups).toHaveLength(1);
    expect(body.total).toBe(1);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("DescribeClusterParameterGroupsCommand");
    expect(mockSend.mock.calls[0][0].ParameterGroupName).toBeUndefined();
  });

  it("GET /parameter-groups — filters by name and falls back when undefined", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/parameter-groups?name=pg-1");
    const body = await res.json();
    expect(body.parameterGroups).toEqual([]);
    expect(mockSend.mock.calls[0][0].ParameterGroupName).toBe("pg-1");
  });

  it("POST /parameter-groups — creates a parameter group", async () => {
    mockSend.mockResolvedValueOnce({ ParameterGroup: pg });
    const res = await post("/parameter-groups", {
      name: "pg-1",
      family: "redshift-1.0",
      description: "test",
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.parameterGroup.ParameterGroupName).toBe("pg-1");
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("CreateClusterParameterGroupCommand");
    expect(cmd.ParameterGroupFamily).toBe("redshift-1.0");
  });

  it("POST /parameter-groups — 400 when required fields missing", async () => {
    const res = await post("/parameter-groups", { name: "pg-1" });
    expect(res.status).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("GET /parameter-groups/:name/parameters — lists parameters", async () => {
    mockSend.mockResolvedValueOnce({ Parameters: [{ ParameterName: "require_ssl", ParameterValue: "true" }] });
    const res = await get("/parameter-groups/pg-1/parameters");
    const body = await res.json();
    expect(body.parameters).toHaveLength(1);
    expect(body.total).toBe(1);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("DescribeClusterParametersCommand");
    expect(cmd.ParameterGroupName).toBe("pg-1");
  });

  it("GET /parameter-groups/:name/parameters — falls back when undefined", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/parameter-groups/pg-1/parameters");
    const body = await res.json();
    expect(body.parameters).toEqual([]);
  });

  it("PUT /parameter-groups/:name — modifies parameters", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await put("/parameter-groups/pg-1", {
      parameters: [{ name: "require_ssl", value: "false" }],
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.updated).toBe(true);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("ModifyClusterParameterGroupCommand");
    expect(cmd.ParameterGroupName).toBe("pg-1");
    expect(cmd.Parameters).toEqual([{ ParameterName: "require_ssl", ParameterValue: "false" }]);
  });

  it("PUT /parameter-groups/:name — 400 when parameters not an array", async () => {
    const res = await put("/parameter-groups/pg-1", { parameters: "nope" });
    expect(res.status).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("DELETE /parameter-groups/:name — deletes a parameter group", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/parameter-groups/pg-1");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("DeleteClusterParameterGroupCommand");
    expect(cmd.ParameterGroupName).toBe("pg-1");
  });
});

describe("Redshift — subnet groups", () => {
  it("GET /subnet-groups — lists subnet groups", async () => {
    mockSend.mockResolvedValueOnce({ ClusterSubnetGroups: [sg] });
    const res = await get("/subnet-groups");
    const body = await res.json();
    expect(body.subnetGroups).toHaveLength(1);
    expect(body.total).toBe(1);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("DescribeClusterSubnetGroupsCommand");
    expect(mockSend.mock.calls[0][0].ClusterSubnetGroupName).toBeUndefined();
  });

  it("GET /subnet-groups — filters by name and falls back when undefined", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/subnet-groups?name=sg-1");
    const body = await res.json();
    expect(body.subnetGroups).toEqual([]);
    expect(mockSend.mock.calls[0][0].ClusterSubnetGroupName).toBe("sg-1");
  });

  it("POST /subnet-groups — creates a subnet group", async () => {
    mockSend.mockResolvedValueOnce({ ClusterSubnetGroup: sg });
    const res = await post("/subnet-groups", {
      name: "sg-1",
      subnetIds: ["subnet-1", "subnet-2"],
      description: "test",
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.subnetGroup.ClusterSubnetGroupName).toBe("sg-1");
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("CreateClusterSubnetGroupCommand");
    expect(cmd.SubnetIds).toEqual(["subnet-1", "subnet-2"]);
  });

  it("POST /subnet-groups — 400 when required fields missing", async () => {
    const res = await post("/subnet-groups", { name: "sg-1" });
    expect(res.status).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("PUT /subnet-groups/:name — modifies a subnet group", async () => {
    mockSend.mockResolvedValueOnce({ ClusterSubnetGroup: sg });
    const res = await put("/subnet-groups/sg-1", { subnetIds: ["subnet-3"], description: "upd" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.subnetGroup.ClusterSubnetGroupName).toBe("sg-1");
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("ModifyClusterSubnetGroupCommand");
    expect(cmd.SubnetIds).toEqual(["subnet-3"]);
  });

  it("PUT /subnet-groups/:name — 400 when subnetIds not an array", async () => {
    const res = await put("/subnet-groups/sg-1", {});
    expect(res.status).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("DELETE /subnet-groups/:name — deletes a subnet group", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/subnet-groups/sg-1");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("DeleteClusterSubnetGroupCommand");
    expect(cmd.ClusterSubnetGroupName).toBe("sg-1");
  });
});

describe("Redshift — tags", () => {
  it("POST /tags — sends CreateTagsCommand", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/tags", {
      resourceName: "arn:aws:redshift:us-east-1:123456789012:cluster:my-cluster",
      tags: [{ key: "env", value: "dev" }],
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tagged).toBe(true);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("CreateTagsCommand");
    expect(cmd.Tags).toEqual([{ Key: "env", Value: "dev" }]);
  });

  it("POST /tags — 400 when params missing", async () => {
    const res = await post("/tags", { resourceName: "arn" });
    expect(res.status).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("POST /tags/untag — sends DeleteTagsCommand", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/tags/untag", {
      resourceName: "arn:aws:redshift:us-east-1:123456789012:cluster:my-cluster",
      tagKeys: ["env"],
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.untagged).toBe(true);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("DeleteTagsCommand");
    expect(cmd.TagKeys).toEqual(["env"]);
  });

  it("POST /tags/untag — 400 when params missing", async () => {
    const res = await post("/tags/untag", { tagKeys: ["env"] });
    expect(res.status).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("GET /tags — lists tagged resources", async () => {
    mockSend.mockResolvedValueOnce({
      TaggedResources: [{ ResourceName: "arn", ResourceType: "cluster", Tag: { Key: "env" } }],
    });
    const res = await get("/tags");
    const body = await res.json();
    expect(body.taggedResources).toHaveLength(1);
    expect(body.total).toBe(1);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("DescribeTagsCommand");
  });

  it("GET /tags — falls back when undefined", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/tags");
    const body = await res.json();
    expect(body.taggedResources).toEqual([]);
    expect(body.total).toBe(0);
  });
});
