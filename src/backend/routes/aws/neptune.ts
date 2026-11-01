import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { NeptuneClient } from "@aws-sdk/client-neptune";
import {
  ModifyDBClusterCommand,
  ModifyDBInstanceCommand,
} from "@aws-sdk/client-neptune";
import {
  DescribeDBClustersCommand,
  CreateDBClusterCommand,
  DeleteDBClusterCommand,
  DescribeDBInstancesCommand,
  CreateDBInstanceCommand,
  DeleteDBInstanceCommand,
  AddRoleToDBClusterCommand,
  RemoveRoleFromDBClusterCommand,
  DescribeGlobalClustersCommand,
  ListTagsForResourceCommand,
  AddTagsToResourceCommand,
  RemoveTagsFromResourceCommand,
} from "@aws-sdk/client-neptune";

const router = new Hono();
const getClient = () => create(NeptuneClient);

// ── Clusters ─────────────────────────────────────────────

router.get("/clusters", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new DescribeDBClustersCommand({}));
  const clusters = result.DBClusters || [];
  return c.json({ clusters, total: clusters.length });
});

router.get("/clusters/:id", async (c: Context) => {
  const id = c.req.param("id");
  const client = getClient();
  const result = await client.send(new DescribeDBClustersCommand({ DBClusterIdentifier: id }));
  const cluster = result.DBClusters?.[0];
  return c.json({ cluster });
});

router.post("/clusters", async (c: Context) => {
  const body = await c.req.json<{
    dbClusterIdentifier: string;
    engineVersion?: string;
    enableIAMDatabaseAuthentication?: boolean;
  }>();
  if (!body.dbClusterIdentifier) return c.json({ error: "dbClusterIdentifier is required" }, 400);

  const client = getClient();
  const result = await client.send(
    new CreateDBClusterCommand({
      DBClusterIdentifier: body.dbClusterIdentifier,
      Engine: "neptune",
      EngineVersion: body.engineVersion,
      EnableIAMDatabaseAuthentication: body.enableIAMDatabaseAuthentication,
    })
  );
  return c.json({ cluster: result.DBCluster }, 201);
});

router.delete("/clusters/:id", async (c: Context) => {
  const id = c.req.param("id");
  const client = getClient();
  await client.send(new DeleteDBClusterCommand({ DBClusterIdentifier: id }));
  return c.json({ deleted: true });
});

// ── Instances ────────────────────────────────────────────

router.get("/instances", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new DescribeDBInstancesCommand({}));
  const instances = result.DBInstances || [];
  return c.json({ instances, total: instances.length });
});

router.get("/instances/:id", async (c: Context) => {
  const id = c.req.param("id");
  const client = getClient();
  const result = await client.send(new DescribeDBInstancesCommand({ DBInstanceIdentifier: id }));
  const instance = result.DBInstances?.[0];
  return c.json({ instance });
});

router.post("/instances", async (c: Context) => {
  const body = await c.req.json<{
    dbInstanceIdentifier: string;
    dbClusterIdentifier: string;
    dbInstanceClass?: string;
  }>();
  if (!body.dbInstanceIdentifier) return c.json({ error: "dbInstanceIdentifier is required" }, 400);
  if (!body.dbClusterIdentifier) return c.json({ error: "dbClusterIdentifier is required" }, 400);

  const client = getClient();
  const result = await client.send(
    new CreateDBInstanceCommand({
      DBInstanceIdentifier: body.dbInstanceIdentifier,
      DBClusterIdentifier: body.dbClusterIdentifier,
      Engine: "neptune",
      DBInstanceClass: body.dbInstanceClass || "db.r5.large",
    })
  );
  return c.json({ instance: result.DBInstance }, 201);
});

router.delete("/instances/:id", async (c: Context) => {
  const id = c.req.param("id");
  const client = getClient();
  await client.send(new DeleteDBInstanceCommand({ DBInstanceIdentifier: id }));
  return c.json({ deleted: true });
});


router.patch("/clusters/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const body = await c.req.json<any>();
  const client = getClient();
  const result = await client.send(
    new ModifyDBClusterCommand({
      DBClusterIdentifier: id,
      EngineVersion: body.engineVersion,
      EnableIAMDatabaseAuthentication: body.iamDatabaseAuthenticationEnabled,
    })
  );
  return c.json({ cluster: result.DBCluster || null });
});

router.patch("/instances/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const body = await c.req.json<any>();
  const client = getClient();
  const result = await client.send(
    new ModifyDBInstanceCommand({
      DBInstanceIdentifier: id,
      DBInstanceClass: body.instanceClass,
    })
  );
  return c.json({ instance: result.DBInstance || null });
});

// ── Cluster IAM Roles ────────────────────────────────────

router.post("/clusters/:id/roles", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json<{ roleArn: string }>();
  if (!body.roleArn) return c.json({ error: "roleArn is required" }, 400);
  const client = getClient();
  await client.send(
    new AddRoleToDBClusterCommand({ DBClusterIdentifier: id, RoleArn: body.roleArn })
  );
  return c.json({ added: true });
});

router.delete("/clusters/:id/roles", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json<{ roleArn: string }>();
  if (!body.roleArn) return c.json({ error: "roleArn is required" }, 400);
  const client = getClient();
  await client.send(
    new RemoveRoleFromDBClusterCommand({ DBClusterIdentifier: id, RoleArn: body.roleArn })
  );
  return c.json({ removed: true });
});

// ── Global Clusters ──────────────────────────────────────

router.get("/global-clusters", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new DescribeGlobalClustersCommand({}));
  const globalClusters = result.GlobalClusters || [];
  return c.json({ globalClusters, total: globalClusters.length });
});

// ── Resource Tags ────────────────────────────────────────

router.get("/resource-tags", async (c: Context) => {
  const resourceName = c.req.query("resourceName");
  if (!resourceName) return c.json({ error: "resourceName is required" }, 400);
  const client = getClient();
  const result = await client.send(new ListTagsForResourceCommand({ ResourceName: resourceName }));
  const tags = result.TagList || [];
  return c.json({ resourceName, tags, total: tags.length });
});

router.post("/resource-tags", async (c: Context) => {
  const body = await c.req.json<{ resourceName: string; tags: Record<string, string> }>();
  if (!body.resourceName) return c.json({ error: "resourceName is required" }, 400);
  if (!body.tags || Object.keys(body.tags).length === 0)
    return c.json({ error: "tags are required" }, 400);
  const client = getClient();
  await client.send(
    new AddTagsToResourceCommand({
      ResourceName: body.resourceName,
      Tags: Object.entries(body.tags).map(([Key, Value]) => ({ Key, Value })),
    })
  );
  return c.json({ tagged: true });
});

router.delete("/resource-tags", async (c: Context) => {
  const body = await c.req.json<{ resourceName: string; tagKeys: string[] }>();
  if (!body.resourceName) return c.json({ error: "resourceName is required" }, 400);
  if (!body.tagKeys || body.tagKeys.length === 0)
    return c.json({ error: "tagKeys are required" }, 400);
  const client = getClient();
  await client.send(
    new RemoveTagsFromResourceCommand({ ResourceName: body.resourceName, TagKeys: body.tagKeys })
  );
  return c.json({ untagged: true });
});

export default router;