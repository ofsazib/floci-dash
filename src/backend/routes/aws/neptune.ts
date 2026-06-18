import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { NeptuneClient } from "@aws-sdk/client-neptune";
import {
  DescribeDBClustersCommand,
  CreateDBClusterCommand,
  DeleteDBClusterCommand,
  DescribeDBInstancesCommand,
  CreateDBInstanceCommand,
  DeleteDBInstanceCommand,
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

export default router;
