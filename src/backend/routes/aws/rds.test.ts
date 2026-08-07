import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const createCmd = vi.hoisted(() =>
  function (name: string) {
    return vi.fn(function (this: any, args?: any) {
      return { __cmdName: name, ...args };
    });
  }
);

vi.mock("@aws-sdk/client-rds", () => ({
  RDSClient: vi.fn(function() { return { send: mockSend }; }),
  CreateDBInstanceCommand: createCmd("CreateDBInstanceCommand"),
  DescribeDBInstancesCommand: createCmd("DescribeDBInstancesCommand"),
  DeleteDBInstanceCommand: createCmd("DeleteDBInstanceCommand"),
  ModifyDBInstanceCommand: createCmd("ModifyDBInstanceCommand"),
  RebootDBInstanceCommand: createCmd("RebootDBInstanceCommand"),
  CreateDBClusterCommand: createCmd("CreateDBClusterCommand"),
  DescribeDBClustersCommand: createCmd("DescribeDBClustersCommand"),
  DeleteDBClusterCommand: createCmd("DeleteDBClusterCommand"),
  ModifyDBClusterCommand: createCmd("ModifyDBClusterCommand"),
  CreateDBParameterGroupCommand: createCmd("CreateDBParameterGroupCommand"),
  DescribeDBParameterGroupsCommand: createCmd("DescribeDBParameterGroupsCommand"),
  DeleteDBParameterGroupCommand: createCmd("DeleteDBParameterGroupCommand"),
  ModifyDBParameterGroupCommand: createCmd("ModifyDBParameterGroupCommand"),
  DescribeDBParametersCommand: createCmd("DescribeDBParametersCommand"),
  CreateDBClusterParameterGroupCommand: createCmd("CreateDBClusterParameterGroupCommand"),
  DescribeDBClusterParameterGroupsCommand: createCmd("DescribeDBClusterParameterGroupsCommand"),
  DeleteDBClusterParameterGroupCommand: createCmd("DeleteDBClusterParameterGroupCommand"),
  ModifyDBClusterParameterGroupCommand: createCmd("ModifyDBClusterParameterGroupCommand"),
  DescribeDBClusterParametersCommand: createCmd("DescribeDBClusterParametersCommand"),
  CreateDBSubnetGroupCommand: createCmd("CreateDBSubnetGroupCommand"),
  DescribeDBSubnetGroupsCommand: createCmd("DescribeDBSubnetGroupsCommand"),
  ModifyDBSubnetGroupCommand: createCmd("ModifyDBSubnetGroupCommand"),
  DeleteDBSubnetGroupCommand: createCmd("DeleteDBSubnetGroupCommand"),
  DescribeOrderableDBInstanceOptionsCommand: createCmd("DescribeOrderableDBInstanceOptionsCommand"),
}));

import router from "./rds";

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

async function patch(path: string, body?: any) {
  return router.request(path, {
    method: "PATCH",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { "content-type": "application/json" } : undefined,
  });
}

beforeEach(() => {
  mockSend.mockReset();
  mockSend.mockResolvedValue({});
});

describe("RDS Routes", () => {
  describe("DB Instances", () => {
    it("GET /db-instances — lists instances", async () => {
      mockSend.mockResolvedValueOnce({
        DBInstances: [
          {
            DBInstanceIdentifier: "db-001",
            DBInstanceClass: "db.t3.micro",
            Engine: "postgres",
            DBInstanceStatus: "available",
            Endpoint: { Address: "db-001.xxx.rds.amazonaws.com", Port: 5432 },
            MasterUsername: "admin",
            AllocatedStorage: 20,
            DBName: "mydb",
            VpcSecurityGroups: [{ VpcSecurityGroupId: "sg-001", Status: "active" }],
            DBSubnetGroup: { VpcId: "vpc-001" },
            MultiAZ: false,
            EngineVersion: "16.3",
            AutoMinorVersionUpgrade: true,
            PubliclyAccessible: false,
            StorageType: "gp2",
            Iops: null,
            StorageEncrypted: false,
            CopyTagsToSnapshot: false,
            DeletionProtection: false,
            InstanceCreateTime: new Date("2025-01-01T00:00:00Z"),
            PreferredBackupWindow: "03:00-04:00",
            PreferredMaintenanceWindow: "sun:05:00-sun:06:00",
            LatestRestorableTime: new Date("2025-01-02T00:00:00Z"),
            TagList: [{ Key: "env", Value: "prod" }],
          },
        ],
      });
      const res = await get("/db-instances");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.instances[0].id).toBe("db-001");
      expect(body.instances[0].engine).toBe("postgres");
      expect(body.instances[0].status).toBe("available");
      expect(body.instances[0].tags).toEqual([{ key: "env", value: "prod" }]);
    });

    it("GET /db-instances — empty list", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/db-instances");
      const body = await res.json();
      expect(body.total).toBe(0);
    });

    it("GET /db-instances — sparse instance maps optional fields to undefined/empty", async () => {
      mockSend.mockResolvedValueOnce({ DBInstances: [{ DBInstanceIdentifier: "db-sparse" }] });
      const res = await get("/db-instances");
      const body = await res.json();
      expect(body.instances[0].endpoint).toBeUndefined();
      expect(body.instances[0].vpcSecurityGroups).toEqual([]);
      expect(body.instances[0].tags).toEqual([]);
    });

    it("POST /db-instances — creates instance", async () => {
      mockSend.mockResolvedValueOnce({
        DBInstance: { DBInstanceIdentifier: "db-new", DBInstanceStatus: "creating" },
      });
      const res = await post("/db-instances", {
        dbInstanceIdentifier: "db-new",
        dbInstanceClass: "db.t3.large",
        engine: "mysql",
        masterUsername: "admin",
        masterUserPassword: "pass123",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.created).toBe(true);
      expect(body.id).toBe("db-new");
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.DBInstanceIdentifier).toBe("db-new");
      expect(cmd.DBInstanceClass).toBe("db.t3.large");
      expect(cmd.Engine).toBe("mysql");
    });

    it("POST /db-instances — uses defaults when fields omitted", async () => {
      mockSend.mockResolvedValueOnce({
        DBInstance: { DBInstanceIdentifier: "db-default", DBInstanceStatus: "creating" },
      });
      const res = await post("/db-instances", { dbInstanceIdentifier: "db-default" });
      expect(res.status).toBe(200);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.DBInstanceClass).toBe("db.t3.micro");
      expect(cmd.Engine).toBe("postgres");
      expect(cmd.MasterUsername).toBe("admin");
    });

    it("POST /db-instances — 400 when identifier missing", async () => {
      const res = await post("/db-instances", {});
      expect(res.status).toBe(400);
    });

    it("GET /db-instances/:id — returns detail", async () => {
      mockSend.mockResolvedValueOnce({
        DBInstances: [{ DBInstanceIdentifier: "db-001", DBInstanceClass: "db.t3.micro", Engine: "postgres", DBInstanceStatus: "available", AllocatedStorage: 20, MasterUsername: "admin", TagList: [], InstanceCreateTime: new Date(), VpcSecurityGroups: [], DBSubnetGroup: {}, MultiAZ: false, EngineVersion: "", AutoMinorVersionUpgrade: false, PubliclyAccessible: false, StorageType: "", StorageEncrypted: false, CopyTagsToSnapshot: false, DeletionProtection: false, PreferredBackupWindow: "", PreferredMaintenanceWindow: "", Iops: null }],
      });
      const res = await get("/db-instances/db-001");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.id).toBe("db-001");
    });

    it("GET /db-instances/:id — maps endpoint and vpc security groups", async () => {
      mockSend.mockResolvedValueOnce({
        DBInstances: [{
          DBInstanceIdentifier: "db-002",
          DBInstanceClass: "db.t3.micro",
          Engine: "postgres",
          DBInstanceStatus: "available",
          AllocatedStorage: 20,
          MasterUsername: "admin",
          Endpoint: { Address: "db-002.xxx.rds.amazonaws.com", Port: 5432 },
          VpcSecurityGroups: [{ VpcSecurityGroupId: "sg-002", Status: "active" }],
        }],
      });
      const res = await get("/db-instances/db-002");
      const body = await res.json();
      expect(body.endpoint).toEqual({ address: "db-002.xxx.rds.amazonaws.com", port: 5432 });
      expect(body.vpcSecurityGroups).toEqual(["sg-002"]);
    });

    it("GET /db-instances/:id — sparse instance maps vpcSecurityGroups to empty", async () => {
      mockSend.mockResolvedValueOnce({
        DBInstances: [{ DBInstanceIdentifier: "db-sparse" }],
      });
      const res = await get("/db-instances/db-sparse");
      expect((await res.json()).vpcSecurityGroups).toEqual([]);
    });

    it("GET /db-instances/:id — 404 when not found", async () => {
      mockSend.mockResolvedValueOnce({ DBInstances: [] });
      const res = await get("/db-instances/db-missing");
      expect(res.status).toBe(404);
    });

    it("DELETE /db-instances/:id — deletes instance", async () => {
      mockSend.mockResolvedValueOnce({ DBInstance: { DBInstanceIdentifier: "db-001" } });
      const res = await del("/db-instances/db-001");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.DBInstanceIdentifier).toBe("db-001");
      expect(cmd.SkipFinalSnapshot).toBe(true);
    });

    it("PATCH /db-instances/:id — modifies instance", async () => {
      mockSend.mockResolvedValueOnce({ DBInstance: {} });
      const res = await patch("/db-instances/db-001", {
        dbInstanceClass: "db.t3.large",
        applyImmediately: true,
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.modified).toBe(true);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.DBInstanceIdentifier).toBe("db-001");
      expect(cmd.DBInstanceClass).toBe("db.t3.large");
      expect(cmd.ApplyImmediately).toBe(true);
    });

    it("POST /db-instances/:id/reboot — reboots instance", async () => {
      mockSend.mockResolvedValueOnce({ DBInstance: {} });
      const res = await post("/db-instances/db-001/reboot");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.rebooting).toBe(true);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.DBInstanceIdentifier).toBe("db-001");
    });
  });

  describe("DB Clusters", () => {
    it("GET /db-clusters — lists clusters", async () => {
      mockSend.mockResolvedValueOnce({
        DBClusters: [
          {
            DBClusterIdentifier: "cluster-001",
            Engine: "aurora-postgresql",
            Status: "available",
            DatabaseName: "mydb",
            MasterUsername: "admin",
            AllocatedStorage: 1,
            VpcSecurityGroups: [],
            EngineVersion: "16.3",
            StorageEncrypted: false,
            DeletionProtection: false,
            ClusterCreateTime: new Date(),
            TagList: [],
            DBClusterMembers: [{ DBInstanceIdentifier: "db-001" }],
          },
        ],
      });
      const res = await get("/db-clusters");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.clusters[0].id).toBe("cluster-001");
      expect(body.clusters[0].clusterMembers).toEqual(["db-001"]);
    });

    it("GET /db-clusters — empty when DBClusters key missing", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/db-clusters");
      expect((await res.json()).total).toBe(0);
    });

    it("GET /db-clusters — cluster without DBClusterMembers maps to empty", async () => {
      mockSend.mockResolvedValueOnce({ DBClusters: [{ DBClusterIdentifier: "cluster-sparse" }] });
      const res = await get("/db-clusters");
      expect((await res.json()).clusters[0].clusterMembers).toEqual([]);
    });

    it("POST /db-clusters — creates cluster", async () => {
      mockSend.mockResolvedValueOnce({
        DBCluster: { DBClusterIdentifier: "cluster-new", Status: "creating" },
      });
      const res = await post("/db-clusters", {
        dbClusterIdentifier: "cluster-new",
        engine: "aurora-mysql",
        masterUsername: "admin",
        masterUserPassword: "pass123",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.created).toBe(true);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.DBClusterIdentifier).toBe("cluster-new");
      expect(cmd.Engine).toBe("aurora-mysql");
    });

    it("POST /db-clusters — 400 when identifier missing", async () => {
      const res = await post("/db-clusters", { engine: "aurora" });
      expect(res.status).toBe(400);
    });

    it("POST /db-clusters — uses defaults when fields omitted", async () => {
      mockSend.mockResolvedValueOnce({
        DBCluster: { DBClusterIdentifier: "cluster-default", Status: "creating" },
      });
      const res = await post("/db-clusters", { dbClusterIdentifier: "cluster-default" });
      expect(res.status).toBe(200);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.Engine).toBe("aurora-postgresql");
      expect(cmd.MasterUsername).toBe("admin");
      expect(cmd.MasterUserPassword).toBe("password");
    });

    it("GET /db-clusters/:id — returns detail", async () => {
      mockSend.mockResolvedValueOnce({
        DBClusters: [{ DBClusterIdentifier: "cluster-001", Engine: "aurora-postgresql", Status: "available", MasterUsername: "admin", DatabaseName: "mydb", AllocatedStorage: 1, EngineVersion: "", VpcSecurityGroups: [], StorageEncrypted: false, DeletionProtection: false, ClusterCreateTime: new Date(), TagList: [], DBClusterMembers: [{ DBInstanceIdentifier: "db-001" }] }],
      });
      const res = await get("/db-clusters/cluster-001");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.id).toBe("cluster-001");
      expect(body.clusterMembers).toEqual(["db-001"]);
    });

    it("GET /db-clusters/:id — 404 when not found", async () => {
      mockSend.mockResolvedValueOnce({ DBClusters: [] });
      const res = await get("/db-clusters/cluster-missing");
      expect(res.status).toBe(404);
    });

    it("GET /db-clusters/:id — sparse cluster maps clusterMembers to empty", async () => {
      mockSend.mockResolvedValueOnce({ DBClusters: [{ DBClusterIdentifier: "cluster-sparse" }] });
      const res = await get("/db-clusters/cluster-sparse");
      expect((await res.json()).clusterMembers).toEqual([]);
    });

    it("DELETE /db-clusters/:id — deletes cluster", async () => {
      mockSend.mockResolvedValueOnce({ DBCluster: {} });
      const res = await del("/db-clusters/cluster-001");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.DBClusterIdentifier).toBe("cluster-001");
      expect(cmd.SkipFinalSnapshot).toBe(true);
    });

    it("PATCH /db-clusters/:id — modifies cluster", async () => {
      mockSend.mockResolvedValueOnce({ DBCluster: {} });
      const res = await patch("/db-clusters/cluster-001", {
        applyImmediately: true,
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.modified).toBe(true);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.DBClusterIdentifier).toBe("cluster-001");
      expect(cmd.ApplyImmediately).toBe(true);
    });
  });

  describe("Parameter Groups", () => {
    it("GET /parameter-groups — lists groups", async () => {
      mockSend.mockResolvedValueOnce({
        DBParameterGroups: [
          {
            DBParameterGroupName: "pg-001",
            DBParameterGroupFamily: "postgres16",
            Description: "Custom PG",
          },
        ],
      });
      const res = await get("/parameter-groups");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.parameterGroups[0].name).toBe("pg-001");
    });

    it("POST /parameter-groups — creates group", async () => {
      mockSend.mockResolvedValueOnce({
        DBParameterGroup: { DBParameterGroupName: "pg-new" },
      });
      const res = await post("/parameter-groups", {
        dbParameterGroupName: "pg-new",
        dbParameterGroupFamily: "postgres16",
        description: "My PG",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.created).toBe(true);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.DBParameterGroupName).toBe("pg-new");
      expect(cmd.DBParameterGroupFamily).toBe("postgres16");
    });

    it("POST /parameter-groups — 400 when name missing", async () => {
      const res = await post("/parameter-groups", {});
      expect(res.status).toBe(400);
    });

    it("POST /parameter-groups — uses defaults when family and description omitted", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/parameter-groups", { dbParameterGroupName: "pg-default" });
      expect(res.status).toBe(200);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.DBParameterGroupFamily).toBe("postgres16");
      expect(cmd.Description).toBe("Parameter group pg-default");
    });

    it("DELETE /parameter-groups/:name — deletes group", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/parameter-groups/pg-001");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });

    it("GET /parameter-groups/:name/parameters — lists parameters", async () => {
      mockSend.mockResolvedValueOnce({
        Parameters: [{ ParameterName: "max_connections", ParameterValue: "100" }],
      });
      const res = await get("/parameter-groups/pg-001/parameters");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.parameters[0].name).toBe("max_connections");
    });

    it("GET /parameter-groups/:name/parameters — empty when Parameters key missing", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/parameter-groups/pg-001/parameters");
      const body = await res.json();
      expect(body.parameters).toEqual([]);
      expect(body.total).toBe(0);
    });

    it("PATCH /parameter-groups/:name/parameters — modifies parameters", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await patch("/parameter-groups/pg-001/parameters", {
        parameters: [{ parameterName: "max_connections", parameterValue: "200", applyMethod: "immediate" }],
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.modified).toBe(true);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.DBParameterGroupName).toBe("pg-001");
      expect(cmd.Parameters[0].ParameterName).toBe("max_connections");
      expect(cmd.Parameters[0].ParameterValue).toBe("200");
    });

    it("PATCH /parameter-groups/:name/parameters — defaults applyMethod to immediate", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await patch("/parameter-groups/pg-001/parameters", {
        parameters: [{ parameterName: "max_connections", parameterValue: "300" }],
      });
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].Parameters[0].ApplyMethod).toBe("immediate");
    });

    it("PATCH /parameter-groups/:name/parameters — 400 when parameters missing", async () => {
      const res = await patch("/parameter-groups/pg-001/parameters", {});
      expect(res.status).toBe(400);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("GET /parameter-groups — empty when DBParameterGroups key missing", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/parameter-groups");
      expect((await res.json()).total).toBe(0);
    });
  });

  describe("Cluster Parameter Groups", () => {
    it("GET /cluster-parameter-groups — lists groups", async () => {
      mockSend.mockResolvedValueOnce({
        DBClusterParameterGroups: [
          {
            DBClusterParameterGroupName: "cpg-001",
            DBParameterGroupFamily: "aurora-postgresql16",
            Description: "Custom CPG",
          },
        ],
      });
      const res = await get("/cluster-parameter-groups");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.clusterParameterGroups[0].name).toBe("cpg-001");
    });

    it("POST /cluster-parameter-groups — creates group", async () => {
      mockSend.mockResolvedValueOnce({
        DBClusterParameterGroup: { DBClusterParameterGroupName: "cpg-new" },
      });
      const res = await post("/cluster-parameter-groups", {
        dbClusterParameterGroupName: "cpg-new",
        dbParameterGroupFamily: "aurora-postgresql16",
        description: "My CPG",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.created).toBe(true);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.DBClusterParameterGroupName).toBe("cpg-new");
    });

    it("POST /cluster-parameter-groups — 400 when name missing", async () => {
      const res = await post("/cluster-parameter-groups", {});
      expect(res.status).toBe(400);
    });

    it("POST /cluster-parameter-groups — uses defaults when family and description omitted", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/cluster-parameter-groups", { dbClusterParameterGroupName: "cpg-default" });
      expect(res.status).toBe(200);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.DBParameterGroupFamily).toBe("aurora-postgresql16");
      expect(cmd.Description).toBe("Cluster parameter group cpg-default");
    });

    it("DELETE /cluster-parameter-groups/:name — deletes group", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/cluster-parameter-groups/cpg-001");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });

    it("GET /cluster-parameter-groups/:name/parameters — lists parameters", async () => {
      mockSend.mockResolvedValueOnce({
        Parameters: [{ ParameterName: "timezone", ParameterValue: "UTC" }],
      });
      const res = await get("/cluster-parameter-groups/cpg-001/parameters");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
    });

    it("GET /cluster-parameter-groups/:name/parameters — empty when Parameters key missing", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/cluster-parameter-groups/cpg-001/parameters");
      const body = await res.json();
      expect(body.parameters).toEqual([]);
      expect(body.total).toBe(0);
    });

    it("PATCH /cluster-parameter-groups/:name/parameters — modifies parameters", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await patch("/cluster-parameter-groups/cpg-001/parameters", {
        parameters: [{ parameterName: "timezone", parameterValue: "PST", applyMethod: "immediate" }],
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.modified).toBe(true);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.DBClusterParameterGroupName).toBe("cpg-001");
      expect(cmd.Parameters[0].ParameterName).toBe("timezone");
    });

    it("PATCH /cluster-parameter-groups/:name/parameters — defaults applyMethod to immediate", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await patch("/cluster-parameter-groups/cpg-001/parameters", {
        parameters: [{ parameterName: "timezone", parameterValue: "EST" }],
      });
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].Parameters[0].ApplyMethod).toBe("immediate");
    });

    it("PATCH /cluster-parameter-groups/:name/parameters — 400 when parameters missing", async () => {
      const res = await patch("/cluster-parameter-groups/cpg-001/parameters", {});
      expect(res.status).toBe(400);
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("GET /cluster-parameter-groups — empty when DBClusterParameterGroups key missing", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/cluster-parameter-groups");
      expect((await res.json()).total).toBe(0);
    });
  });

  describe("DB Subnet Groups", () => {
    it("GET /db-subnet-groups — lists subnet groups", async () => {
      mockSend.mockResolvedValueOnce({
        DBSubnetGroups: [{
          DBSubnetGroupName: "sg-001",
          DBSubnetGroupDescription: "My subnet group",
          VpcId: "vpc-001",
          SubnetGroupStatus: "Complete",
          Subnets: [{ SubnetIdentifier: "subnet-abc", SubnetAvailabilityZone: { Name: "us-east-1a" }, SubnetStatus: "Active" }],
          DBSubnetGroupArn: "arn:...",
        }],
      });
      const res = await get("/db-subnet-groups");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.subnetGroups[0].name).toBe("sg-001");
      expect(body.subnetGroups[0].subnets.length).toBe(1);
    });

    it("GET /db-subnet-groups — empty list", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/db-subnet-groups");
      const body = await res.json();
      expect(body.total).toBe(0);
    });

    it("GET /db-subnet-groups — subnet group without Subnets maps to empty", async () => {
      mockSend.mockResolvedValueOnce({
        DBSubnetGroups: [{ DBSubnetGroupName: "sg-sparse", DBSubnetGroupDescription: "d", VpcId: "vpc-001", SubnetGroupStatus: "Complete" }],
      });
      const res = await get("/db-subnet-groups");
      const body = await res.json();
      expect(body.subnetGroups[0].subnets).toEqual([]);
    });

    it("POST /db-subnet-groups — creates subnet group", async () => {
      mockSend.mockResolvedValueOnce({
        DBSubnetGroup: { DBSubnetGroupName: "sg-new", DBSubnetGroupArn: "arn:..." },
      });
      const res = await post("/db-subnet-groups", {
        dbSubnetGroupName: "sg-new",
        dbSubnetGroupDescription: "My group",
        subnetIds: ["subnet-abc", "subnet-def"],
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.created).toBe(true);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.DBSubnetGroupName).toBe("sg-new");
      expect(cmd.SubnetIds).toEqual(["subnet-abc", "subnet-def"]);
    });

    it("POST /db-subnet-groups — uses default description when omitted", async () => {
      mockSend.mockResolvedValueOnce({
        DBSubnetGroup: { DBSubnetGroupName: "sg-default", DBSubnetGroupArn: "arn:..." },
      });
      const res = await post("/db-subnet-groups", {
        dbSubnetGroupName: "sg-default",
        subnetIds: ["subnet-abc"],
      });
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].DBSubnetGroupDescription).toBe("Subnet group for sg-default");
    });

    it("POST /db-subnet-groups — 400 when name missing", async () => {
      const res = await post("/db-subnet-groups", { subnetIds: ["subnet-abc"] });
      expect(res.status).toBe(400);
    });

    it("POST /db-subnet-groups — 400 when subnetIds missing", async () => {
      const res = await post("/db-subnet-groups", { dbSubnetGroupName: "sg" });
      expect(res.status).toBe(400);
    });

    it("PATCH /db-subnet-groups/:name — modifies subnet group", async () => {
      mockSend.mockResolvedValueOnce({ DBSubnetGroup: { DBSubnetGroupName: "sg-001" } });
      const res = await patch("/db-subnet-groups/sg-001", {
        dbSubnetGroupDescription: "Updated",
        subnetIds: ["subnet-xyz"],
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.modified).toBe(true);
    });

    it("PATCH /db-subnet-groups/:name — 400 when subnetIds missing", async () => {
      const res = await patch("/db-subnet-groups/sg-001", {});
      expect(res.status).toBe(400);
    });

    it("DELETE /db-subnet-groups/:name — deletes subnet group", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/db-subnet-groups/sg-001");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });
  });

  describe("Orderable DB Instance Options", () => {
    it("GET /orderable-db-instance-options — lists options", async () => {
      mockSend.mockResolvedValueOnce({
        OrderableDBInstanceOptions: [{ EngineVersion: "16.4", DBInstanceClass: "db.t3.micro", Vpc: true }],
      });
      const res = await get("/orderable-db-instance-options?engine=postgres");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.engine).toBe("postgres");
    });

    it("GET /orderable-db-instance-options — sparse option falls back to false booleans", async () => {
      mockSend.mockResolvedValueOnce({
        OrderableDBInstanceOptions: [{ EngineVersion: "16.4", DBInstanceClass: "db.t3.micro" }],
      });
      const res = await get("/orderable-db-instance-options");
      const body = await res.json();
      expect(body.options[0].vpc).toBe(false);
      expect(body.options[0].multiAZCapable).toBe(false);
      expect(body.options[0].supportsIamAuth).toBe(false);
      expect(body.options[0].supportsEncryption).toBe(false);
    });

    it("GET /orderable-db-instance-options — defaults to postgres", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/orderable-db-instance-options");
      const body = await res.json();
      expect(body.engine).toBe("postgres");
      expect(body.options).toEqual([]);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.Engine).toBe("postgres");
    });
  });
});
