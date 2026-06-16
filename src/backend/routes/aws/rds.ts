import { Hono } from "hono";
import type { Context } from "hono";
import {
  RDSClient,
  CreateDBInstanceCommand,
  DescribeDBInstancesCommand,
  DeleteDBInstanceCommand,
  ModifyDBInstanceCommand,
  RebootDBInstanceCommand,
  CreateDBClusterCommand,
  DescribeDBClustersCommand,
  DeleteDBClusterCommand,
  ModifyDBClusterCommand,
  CreateDBParameterGroupCommand,
  DescribeDBParameterGroupsCommand,
  DeleteDBParameterGroupCommand,
  ModifyDBParameterGroupCommand,
  DescribeDBParametersCommand,
  CreateDBClusterParameterGroupCommand,
  DescribeDBClusterParameterGroupsCommand,
  DeleteDBClusterParameterGroupCommand,
  ModifyDBClusterParameterGroupCommand,
  DescribeDBClusterParametersCommand,
} from "@aws-sdk/client-rds";
import { getAwsConfig } from "../../clients/aws";

const router = new Hono();

function rds(): RDSClient {
  return new RDSClient(getAwsConfig());
}

// ──────────────────────────────────────────────
//  DB Instances
// ──────────────────────────────────────────────

router.get("/db-instances", async (c: Context) => {
  const result = await rds().send(new DescribeDBInstancesCommand({}));
  const instances = (result.DBInstances || []).map((i) => ({
    id: i.DBInstanceIdentifier,
    engine: i.Engine,
    engineVersion: i.EngineVersion,
    status: i.DBInstanceStatus,
    dbInstanceClass: i.DBInstanceClass,
    allocatedStorage: i.AllocatedStorage,
    masterUsername: i.MasterUsername,
    endpoint: i.Endpoint
      ? { address: i.Endpoint.Address, port: i.Endpoint.Port }
      : undefined,
    dbName: i.DBName,
    dbClusterIdentifier: i.DBClusterIdentifier,
    parameterGroupName: i.DBParameterGroups?.[0]?.DBParameterGroupName,
    iamDatabaseAuthenticationEnabled: i.IAMDatabaseAuthenticationEnabled,
    createdAt: i.InstanceCreateTime?.toISOString(),
    arn: i.DBInstanceArn,
    vpcSecurityGroups: (i.VpcSecurityGroups || []).map(
      (sg: any) => sg.VpcSecurityGroupId
    ),
    publiclyAccessible: i.PubliclyAccessible,
    storageType: i.StorageType,
    multiAZ: i.MultiAZ,
    autoMinorVersionUpgrade: i.AutoMinorVersionUpgrade,
    preferredBackupWindow: i.PreferredBackupWindow,
    preferredMaintenanceWindow: i.PreferredMaintenanceWindow,
    backupRetentionPeriod: i.BackupRetentionPeriod,
    copyTagsToSnapshot: i.CopyTagsToSnapshot,
    tags: (i.TagList || []).map((t: any) => ({ key: t.Key, value: t.Value })),
  }));
  return c.json({ instances, total: instances.length });
});

router.post("/db-instances", async (c: Context) => {
  const body = await c.req.json<{
    dbInstanceIdentifier: string;
    dbInstanceClass?: string;
    engine?: string;
    masterUsername?: string;
    masterPassword?: string;
    allocatedStorage?: number;
    dbName?: string;
    dbClusterIdentifier?: string;
    engineVersion?: string;
    publiclyAccessible?: boolean;
    storageType?: string;
    multiAZ?: boolean;
    autoMinorVersionUpgrade?: boolean;
    backupRetentionPeriod?: number;
    preferredBackupWindow?: string;
    preferredMaintenanceWindow?: string;
    copyTagsToSnapshot?: boolean;
    iamDatabaseAuthenticationEnabled?: boolean;
    parameterGroupName?: string;
    vpcSecurityGroupIds?: string[];
  }>();

  if (!body.dbInstanceIdentifier) {
    return c.json({ error: "DBInstanceIdentifier is required" }, 400);
  }

  const result = await rds().send(
    new CreateDBInstanceCommand({
      DBInstanceIdentifier: body.dbInstanceIdentifier,
      DBInstanceClass: body.dbInstanceClass || "db.t3.micro",
      Engine: body.engine || "postgres",
      MasterUsername: body.masterUsername || "admin",
      MasterUserPassword: body.masterPassword || "password",
      AllocatedStorage: body.allocatedStorage || 20,
      DBName: body.dbName,
      DBClusterIdentifier: body.dbClusterIdentifier,
      EngineVersion: body.engineVersion,
      PubliclyAccessible: body.publiclyAccessible ?? true,
      StorageType: body.storageType || "gp2",
      MultiAZ: body.multiAZ ?? false,
      AutoMinorVersionUpgrade: body.autoMinorVersionUpgrade ?? true,
      BackupRetentionPeriod: body.backupRetentionPeriod ?? 1,
      PreferredBackupWindow: body.preferredBackupWindow,
      PreferredMaintenanceWindow: body.preferredMaintenanceWindow,
      CopyTagsToSnapshot: body.copyTagsToSnapshot ?? false,
      EnableIAMDatabaseAuthentication:
        body.iamDatabaseAuthenticationEnabled ?? false,
      DBParameterGroupName: body.parameterGroupName,
      VpcSecurityGroupIds: body.vpcSecurityGroupIds,
    })
  );

  return c.json({
    id: result.DBInstance?.DBInstanceIdentifier,
    status: result.DBInstance?.DBInstanceStatus,
    arn: result.DBInstance?.DBInstanceArn,
    created: true,
  });
});

router.get("/db-instances/:id", async (c: Context) => {
  const id = c.req.param("id");
  const result = await rds().send(
    new DescribeDBInstancesCommand({
      DBInstanceIdentifier: id,
    })
  );
  const i = result.DBInstances?.[0];
  if (!i) return c.json({ error: "DB instance not found" }, 404);
  return c.json({
    id: i.DBInstanceIdentifier,
    engine: i.Engine,
    engineVersion: i.EngineVersion,
    status: i.DBInstanceStatus,
    dbInstanceClass: i.DBInstanceClass,
    allocatedStorage: i.AllocatedStorage,
    masterUsername: i.MasterUsername,
    endpoint: i.Endpoint
      ? { address: i.Endpoint.Address, port: i.Endpoint.Port }
      : undefined,
    dbName: i.DBName,
    dbClusterIdentifier: i.DBClusterIdentifier,
    parameterGroupName: i.DBParameterGroups?.[0]?.DBParameterGroupName,
    iamDatabaseAuthenticationEnabled: i.IAMDatabaseAuthenticationEnabled,
    createdAt: i.InstanceCreateTime?.toISOString(),
    arn: i.DBInstanceArn,
    vpcSecurityGroups: (i.VpcSecurityGroups || []).map(
      (sg: any) => sg.VpcSecurityGroupId
    ),
    publiclyAccessible: i.PubliclyAccessible,
    storageType: i.StorageType,
    multiAZ: i.MultiAZ,
    autoMinorVersionUpgrade: i.AutoMinorVersionUpgrade,
    preferredBackupWindow: i.PreferredBackupWindow,
    preferredMaintenanceWindow: i.PreferredMaintenanceWindow,
    backupRetentionPeriod: i.BackupRetentionPeriod,
    copyTagsToSnapshot: i.CopyTagsToSnapshot,
  });
});

router.delete("/db-instances/:id", async (c: Context) => {
  const id = c.req.param("id");
  await rds().send(
    new DeleteDBInstanceCommand({
      DBInstanceIdentifier: id,
      SkipFinalSnapshot: true,
    })
  );
  return c.json({ id, deleted: true });
});

router.patch("/db-instances/:id", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json<{
    masterUserPassword?: string;
    iamDatabaseAuthenticationEnabled?: boolean;
    dbInstanceClass?: string;
    allocatedStorage?: number;
    backupRetentionPeriod?: number;
    preferredMaintenanceWindow?: string;
    publiclyAccessible?: boolean;
    autoMinorVersionUpgrade?: boolean;
    copyTagsToSnapshot?: boolean;
  }>();

  const result = await rds().send(
    new ModifyDBInstanceCommand({
      DBInstanceIdentifier: id,
      MasterUserPassword: body.masterUserPassword,
      EnableIAMDatabaseAuthentication: body.iamDatabaseAuthenticationEnabled,
      DBInstanceClass: body.dbInstanceClass,
      AllocatedStorage: body.allocatedStorage,
      BackupRetentionPeriod: body.backupRetentionPeriod,
      PreferredMaintenanceWindow: body.preferredMaintenanceWindow,
      PubliclyAccessible: body.publiclyAccessible,
      AutoMinorVersionUpgrade: body.autoMinorVersionUpgrade,
      CopyTagsToSnapshot: body.copyTagsToSnapshot,
      ApplyImmediately: true,
    })
  );

  return c.json({
    id: result.DBInstance?.DBInstanceIdentifier,
    status: result.DBInstance?.DBInstanceStatus,
    modified: true,
  });
});

router.post("/db-instances/:id/reboot", async (c: Context) => {
  const id = c.req.param("id");
  await rds().send(
    new RebootDBInstanceCommand({
      DBInstanceIdentifier: id,
    })
  );
  return c.json({ id, rebooting: true });
});

// ──────────────────────────────────────────────
//  DB Clusters
// ──────────────────────────────────────────────

router.get("/db-clusters", async (c: Context) => {
  const result = await rds().send(new DescribeDBClustersCommand({}));
  const clusters = (result.DBClusters || []).map((cl) => ({
    id: cl.DBClusterIdentifier,
    engine: cl.Engine,
    engineVersion: cl.EngineVersion,
    status: cl.Status,
    masterUsername: cl.MasterUsername,
    databaseName: cl.DatabaseName,
    endpoint: cl.Endpoint,
    readerEndpoint: cl.ReaderEndpoint,
    port: cl.Port,
    parameterGroupName: cl.DBClusterParameterGroup,
    iamDatabaseAuthenticationEnabled: cl.IAMDatabaseAuthenticationEnabled,
    clusterMembers: (cl.DBClusterMembers || []).map(
      (m: any) => m.DBInstanceIdentifier
    ),
    createdAt: cl.ClusterCreateTime?.toISOString(),
    arn: cl.DBClusterArn,
    allocatedStorage: cl.AllocatedStorage,
    backupRetentionPeriod: cl.BackupRetentionPeriod,
    preferredBackupWindow: cl.PreferredBackupWindow,
    preferredMaintenanceWindow: cl.PreferredMaintenanceWindow,
    copyTagsToSnapshot: cl.CopyTagsToSnapshot,
  }));
  return c.json({ clusters, total: clusters.length });
});

router.post("/db-clusters", async (c: Context) => {
  const body = await c.req.json<{
    dbClusterIdentifier: string;
    engine?: string;
    engineVersion?: string;
    masterUsername?: string;
    masterPassword?: string;
    databaseName?: string;
    allocatedStorage?: number;
    backupRetentionPeriod?: number;
    preferredBackupWindow?: string;
    preferredMaintenanceWindow?: string;
    copyTagsToSnapshot?: boolean;
    iamDatabaseAuthenticationEnabled?: boolean;
    parameterGroupName?: string;
  }>();

  if (!body.dbClusterIdentifier) {
    return c.json({ error: "DBClusterIdentifier is required" }, 400);
  }

  const result = await rds().send(
    new CreateDBClusterCommand({
      DBClusterIdentifier: body.dbClusterIdentifier,
      Engine: body.engine || "aurora-postgresql",
      EngineVersion: body.engineVersion,
      MasterUsername: body.masterUsername || "admin",
      MasterUserPassword: body.masterPassword || "password",
      DatabaseName: body.databaseName,
      AllocatedStorage: body.allocatedStorage,
      BackupRetentionPeriod: body.backupRetentionPeriod,
      PreferredBackupWindow: body.preferredBackupWindow,
      PreferredMaintenanceWindow: body.preferredMaintenanceWindow,
      CopyTagsToSnapshot: body.copyTagsToSnapshot,
      EnableIAMDatabaseAuthentication:
        body.iamDatabaseAuthenticationEnabled ?? false,
      DBClusterParameterGroupName: body.parameterGroupName,
    })
  );

  return c.json({
    id: result.DBCluster?.DBClusterIdentifier,
    status: result.DBCluster?.Status,
    arn: result.DBCluster?.DBClusterArn,
    created: true,
  });
});

router.get("/db-clusters/:id", async (c: Context) => {
  const id = c.req.param("id");
  const result = await rds().send(
    new DescribeDBClustersCommand({
      DBClusterIdentifier: id,
    })
  );
  const cl = result.DBClusters?.[0];
  if (!cl) return c.json({ error: "DB cluster not found" }, 404);
  return c.json({
    id: cl.DBClusterIdentifier,
    engine: cl.Engine,
    engineVersion: cl.EngineVersion,
    status: cl.Status,
    masterUsername: cl.MasterUsername,
    databaseName: cl.DatabaseName,
    endpoint: cl.Endpoint,
    readerEndpoint: cl.ReaderEndpoint,
    port: cl.Port,
    parameterGroupName: cl.DBClusterParameterGroup,
    iamDatabaseAuthenticationEnabled: cl.IAMDatabaseAuthenticationEnabled,
    clusterMembers: (cl.DBClusterMembers || []).map(
      (m: any) => m.DBInstanceIdentifier
    ),
    createdAt: cl.ClusterCreateTime?.toISOString(),
    arn: cl.DBClusterArn,
    allocatedStorage: cl.AllocatedStorage,
    backupRetentionPeriod: cl.BackupRetentionPeriod,
    preferredBackupWindow: cl.PreferredBackupWindow,
    preferredMaintenanceWindow: cl.PreferredMaintenanceWindow,
    copyTagsToSnapshot: cl.CopyTagsToSnapshot,
  });
});

router.delete("/db-clusters/:id", async (c: Context) => {
  const id = c.req.param("id");
  await rds().send(
    new DeleteDBClusterCommand({
      DBClusterIdentifier: id,
      SkipFinalSnapshot: true,
    })
  );
  return c.json({ id, deleted: true });
});

router.patch("/db-clusters/:id", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json<{
    masterUserPassword?: string;
    iamDatabaseAuthenticationEnabled?: boolean;
    backupRetentionPeriod?: number;
    preferredMaintenanceWindow?: string;
    copyTagsToSnapshot?: boolean;
  }>();

  const result = await rds().send(
    new ModifyDBClusterCommand({
      DBClusterIdentifier: id,
      MasterUserPassword: body.masterUserPassword,
      EnableIAMDatabaseAuthentication: body.iamDatabaseAuthenticationEnabled,
      BackupRetentionPeriod: body.backupRetentionPeriod,
      PreferredMaintenanceWindow: body.preferredMaintenanceWindow,
      CopyTagsToSnapshot: body.copyTagsToSnapshot,
      ApplyImmediately: true,
    })
  );

  return c.json({
    id: result.DBCluster?.DBClusterIdentifier,
    status: result.DBCluster?.Status,
    modified: true,
  });
});

// ──────────────────────────────────────────────
//  DB Parameter Groups
// ──────────────────────────────────────────────

router.get("/parameter-groups", async (c: Context) => {
  const result = await rds().send(new DescribeDBParameterGroupsCommand({}));
  const groups = (result.DBParameterGroups || []).map((g) => ({
    name: g.DBParameterGroupName,
    family: g.DBParameterGroupFamily,
    description: g.Description,
    arn: g.DBParameterGroupArn,
  }));
  return c.json({ parameterGroups: groups, total: groups.length });
});

router.post("/parameter-groups", async (c: Context) => {
  const body = await c.req.json<{
    dbParameterGroupName: string;
    dbParameterGroupFamily?: string;
    description?: string;
  }>();

  if (!body.dbParameterGroupName) {
    return c.json({ error: "DBParameterGroupName is required" }, 400);
  }

  await rds().send(
    new CreateDBParameterGroupCommand({
      DBParameterGroupName: body.dbParameterGroupName,
      DBParameterGroupFamily: body.dbParameterGroupFamily || "postgres16",
      Description: body.description || `Parameter group ${body.dbParameterGroupName}`,
    })
  );

  return c.json({ name: body.dbParameterGroupName, created: true });
});

router.delete("/parameter-groups/:name", async (c: Context) => {
  const name = c.req.param("name");
  await rds().send(
    new DeleteDBParameterGroupCommand({
      DBParameterGroupName: name,
    })
  );
  return c.json({ name, deleted: true });
});

router.get("/parameter-groups/:name/parameters", async (c: Context) => {
  const name = c.req.param("name");
  const result = await rds().send(
    new DescribeDBParametersCommand({
      DBParameterGroupName: name,
    })
  );
  const parameters = (result.Parameters || []).map((p) => ({
    name: p.ParameterName,
    value: p.ParameterValue,
    description: p.Description,
    allowedValues: p.AllowedValues,
    applyType: p.ApplyType,
    dataType: p.DataType,
    source: p.Source,
    isModifiable: p.IsModifiable,
    minimumEngineVersion: p.MinimumEngineVersion,
    applyMethod: p.ApplyMethod,
  }));
  return c.json({ parameterGroup: name, parameters, total: parameters.length });
});

router.patch("/parameter-groups/:name/parameters", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<{
    parameters: Array<{ parameterName: string; parameterValue: string; applyMethod?: string }>;
  }>();

  if (!body.parameters || body.parameters.length === 0) {
    return c.json({ error: "At least one parameter is required" }, 400);
  }

  await rds().send(
    new ModifyDBParameterGroupCommand({
      DBParameterGroupName: name,
      Parameters: body.parameters.map((p) => ({
        ParameterName: p.parameterName,
        ParameterValue: p.parameterValue,
        ApplyMethod: (p.applyMethod as "immediate" | "pending-reboot") || "immediate",
      })),
    })
  );

  return c.json({ parameterGroup: name, modified: true });
});

// ──────────────────────────────────────────────
//  DB Cluster Parameter Groups
// ──────────────────────────────────────────────

router.get("/cluster-parameter-groups", async (c: Context) => {
  const result = await rds().send(
    new DescribeDBClusterParameterGroupsCommand({})
  );
  const groups = (result.DBClusterParameterGroups || []).map((g) => ({
    name: g.DBClusterParameterGroupName,
    family: g.DBParameterGroupFamily,
    description: g.Description,
    arn: g.DBClusterParameterGroupArn,
  }));
  return c.json({ clusterParameterGroups: groups, total: groups.length });
});

router.post("/cluster-parameter-groups", async (c: Context) => {
  const body = await c.req.json<{
    dbClusterParameterGroupName: string;
    dbParameterGroupFamily?: string;
    description?: string;
  }>();

  if (!body.dbClusterParameterGroupName) {
    return c.json({ error: "DBClusterParameterGroupName is required" }, 400);
  }

  await rds().send(
    new CreateDBClusterParameterGroupCommand({
      DBClusterParameterGroupName: body.dbClusterParameterGroupName,
      DBParameterGroupFamily: body.dbParameterGroupFamily || "aurora-postgresql16",
      Description:
        body.description ||
        `Cluster parameter group ${body.dbClusterParameterGroupName}`,
    })
  );

  return c.json({ name: body.dbClusterParameterGroupName, created: true });
});

router.delete("/cluster-parameter-groups/:name", async (c: Context) => {
  const name = c.req.param("name");
  await rds().send(
    new DeleteDBClusterParameterGroupCommand({
      DBClusterParameterGroupName: name,
    })
  );
  return c.json({ name, deleted: true });
});

router.get("/cluster-parameter-groups/:name/parameters", async (c: Context) => {
  const name = c.req.param("name");
  const result = await rds().send(
    new DescribeDBClusterParametersCommand({
      DBClusterParameterGroupName: name,
    })
  );
  const parameters = (result.Parameters || []).map((p) => ({
    name: p.ParameterName,
    value: p.ParameterValue,
    description: p.Description,
    allowedValues: p.AllowedValues,
    applyType: p.ApplyType,
    dataType: p.DataType,
    source: p.Source,
    isModifiable: p.IsModifiable,
    minimumEngineVersion: p.MinimumEngineVersion,
    applyMethod: p.ApplyMethod,
  }));
  return c.json({
    clusterParameterGroup: name,
    parameters,
    total: parameters.length,
  });
});

router.patch("/cluster-parameter-groups/:name/parameters", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<{
    parameters: Array<{ parameterName: string; parameterValue: string; applyMethod?: string }>;
  }>();

  if (!body.parameters || body.parameters.length === 0) {
    return c.json({ error: "At least one parameter is required" }, 400);
  }

  await rds().send(
    new ModifyDBClusterParameterGroupCommand({
      DBClusterParameterGroupName: name,
      Parameters: body.parameters.map((p) => ({
        ParameterName: p.parameterName,
        ParameterValue: p.parameterValue,
        ApplyMethod: (p.applyMethod as "immediate" | "pending-reboot") || "immediate",
      })),
    })
  );

  return c.json({ clusterParameterGroup: name, modified: true });
});

export default router;
