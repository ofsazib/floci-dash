import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { DocDBClient } from "@aws-sdk/client-docdb";
import {
  CreateDBClusterCommand,
  DescribeDBClustersCommand,
  DeleteDBClusterCommand,
  ModifyDBClusterCommand,
  CreateDBInstanceCommand,
  DescribeDBInstancesCommand,
  DeleteDBInstanceCommand,
  ModifyDBInstanceCommand,
} from "@aws-sdk/client-docdb";

const router = new Hono();
const getClient = () => create(DocDBClient);

router.get("/clusters", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new DescribeDBClustersCommand({}));
  return c.json({ clusters: result.DBClusters || [], total: result.DBClusters?.length || 0 });
});

router.post("/clusters", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.DBClusterIdentifier) return c.json({ error: "DBClusterIdentifier is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CreateDBClusterCommand({
      DBClusterIdentifier: body.DBClusterIdentifier,
      Engine: body.Engine ?? "docdb",
      EngineVersion: body.EngineVersion,
      MasterUsername: body.MasterUsername,
      MasterUserPassword: body.MasterUserPassword,
    })
  );
  return c.json({ cluster: result.DBCluster }, 201);
});

router.get("/clusters/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const client = getClient();
  const result = await client.send(new DescribeDBClustersCommand({ DBClusterIdentifier: id }));
  return c.json({ cluster: result.DBClusters?.[0] || null });
});

router.delete("/clusters/:id", async (c: Context) => {
  const id = c.req.param("id");
  const client = getClient();
  const result = await client.send(new DeleteDBClusterCommand({ DBClusterIdentifier: id }));
  return c.json({ deleted: true, cluster: result.DBCluster });
});

router.patch("/clusters/:id", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json<any>();
  const client = getClient();
  const result = await client.send(
    new ModifyDBClusterCommand({
      DBClusterIdentifier: id,
      EngineVersion: body.EngineVersion,
    })
  );
  return c.json({ cluster: result.DBCluster });
});

router.get("/instances", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new DescribeDBInstancesCommand({}));
  return c.json({ instances: result.DBInstances || [], total: result.DBInstances?.length || 0 });
});

router.post("/instances", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.DBInstanceIdentifier) return c.json({ error: "DBInstanceIdentifier is required" }, 400);
  if (!body.DBClusterIdentifier) return c.json({ error: "DBClusterIdentifier is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CreateDBInstanceCommand({
      DBInstanceIdentifier: body.DBInstanceIdentifier,
      DBClusterIdentifier: body.DBClusterIdentifier,
      DBInstanceClass: body.DBInstanceClass,
      Engine: body.Engine ?? "docdb",
    })
  );
  return c.json({ instance: result.DBInstance }, 201);
});

router.get("/instances/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const client = getClient();
  const result = await client.send(new DescribeDBInstancesCommand({ DBInstanceIdentifier: id }));
  return c.json({ instance: result.DBInstances?.[0] || null });
});

router.delete("/instances/:id", async (c: Context) => {
  const id = c.req.param("id");
  const client = getClient();
  const result = await client.send(new DeleteDBInstanceCommand({ DBInstanceIdentifier: id }));
  return c.json({ deleted: true, instance: result.DBInstance });
});

router.patch("/instances/:id", async (c: Context) => {
  const id = c.req.param("id");
  const body = await c.req.json<any>();
  const client = getClient();
  const result = await client.send(
    new ModifyDBInstanceCommand({
      DBInstanceIdentifier: id,
      DBInstanceClass: body.DBInstanceClass,
    })
  );
  return c.json({ instance: result.DBInstance });
});

export default router;
