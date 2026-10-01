import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { readJson } from "../../clients/read-json";
import {
  TimestreamInfluxDBClient,
  ListDbInstancesCommand,
  CreateDbInstanceCommand,
  GetDbInstanceCommand,
  UpdateDbInstanceCommand,
  DeleteDbInstanceCommand,
  RebootDbInstanceCommand,
  ListDbClustersCommand,
  CreateDbClusterCommand,
  DeleteDbClusterCommand,
  ListDbBackupsCommand,
  CreateDbBackupCommand,
  DeleteDbBackupCommand,
  ListDbParameterGroupsCommand,
  CreateDbParameterGroupCommand,
} from "@aws-sdk/client-timestream-influxdb";

const router = new Hono();
const getClient = () => create(TimestreamInfluxDBClient);

// ── DB instances ─────────────────────────────────────────

router.get("/db-instances", async (c: Context) => {
  const result: any = await getClient().send(new ListDbInstancesCommand({}));
  return c.json({
    instances: result.items || [],
    total: result.items?.length || 0,
  });
});

router.post("/db-instances", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.name) return c.json({ error: "name is required" }, 400);
  if (!body?.password) return c.json({ error: "password is required" }, 400);
  if (!body?.dbInstanceType) return c.json({ error: "dbInstanceType is required" }, 400);
  if (!body?.vpcSubnetIds || body.vpcSubnetIds.length === 0)
    return c.json({ error: "vpcSubnetIds with at least one subnet is required" }, 400);
  if (!body?.vpcSecurityGroupIds || body.vpcSecurityGroupIds.length === 0)
    return c.json({ error: "vpcSecurityGroupIds with at least one group is required" }, 400);
  if (!body?.allocatedStorage) return c.json({ error: "allocatedStorage is required" }, 400);
  const result: any = await getClient().send(
    new CreateDbInstanceCommand({
      name: body.name,
      username: body.username,
      password: body.password,
      dbInstanceType: body.dbInstanceType,
      vpcSubnetIds: body.vpcSubnetIds,
      vpcSecurityGroupIds: body.vpcSecurityGroupIds,
      allocatedStorage: body.allocatedStorage,
    })
  );
  return c.json({ instance: result }, 201);
});

router.get("/db-instances/:name", async (c: Context) => {
  const name = c.req.param("name")!;
  const result: any = await getClient().send(
    new GetDbInstanceCommand({ identifier: name })
  );
  return c.json({ instance: result || null });
});

router.put("/db-instances/:name", async (c: Context) => {
  const name = c.req.param("name")!;
  const body: any = await readJson(c);
  if (!body?.dbInstanceType) return c.json({ error: "dbInstanceType is required" }, 400);
  const result: any = await getClient().send(
    new UpdateDbInstanceCommand({
      identifier: name,
      dbInstanceType: body.dbInstanceType,
      dbStorageType: body.dbStorageType,
      allocatedStorage: body.allocatedStorage,
    })
  );
  return c.json({ instance: result });
});

router.delete("/db-instances/:name", async (c: Context) => {
  const name = c.req.param("name")!;
  await getClient().send(new DeleteDbInstanceCommand({ identifier: name }));
  return c.json({ ok: true });
});

router.post("/db-instances/:name/reboot", async (c: Context) => {
  const name = c.req.param("name")!;
  const result: any = await getClient().send(
    new RebootDbInstanceCommand({ identifier: name })
  );
  return c.json({ instance: result });
});

// ── DB clusters ──────────────────────────────────────────

router.get("/db-clusters", async (c: Context) => {
  const result: any = await getClient().send(new ListDbClustersCommand({}));
  return c.json({
    clusters: result.items || [],
    total: result.items?.length || 0,
  });
});

router.post("/db-clusters", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.name) return c.json({ error: "name is required" }, 400);
  if (!body?.dbInstanceType) return c.json({ error: "dbInstanceType is required" }, 400);
  if (!body?.vpcSubnetIds || body.vpcSubnetIds.length < 2)
    return c.json({ error: "vpcSubnetIds with at least two subnets is required" }, 400);
  const result: any = await getClient().send(
    new CreateDbClusterCommand({
      name: body.name,
      dbInstanceType: body.dbInstanceType,
      vpcSubnetIds: body.vpcSubnetIds,
      vpcSecurityGroupIds: body.vpcSecurityGroupIds,
    })
  );
  return c.json({ cluster: result }, 201);
});

router.delete("/db-clusters/:name", async (c: Context) => {
  const name = c.req.param("name")!;
  // Shipped SDK types omit DeleteDbClusterCommandInput.identifier; runtime accepts it.
  await getClient().send(new DeleteDbClusterCommand({ identifier: name } as any));
  return c.json({ ok: true });
});

// ── DB backups ───────────────────────────────────────────

router.get("/db-backups", async (c: Context) => {
  const result: any = await getClient().send(new ListDbBackupsCommand({}));
  return c.json({ backups: result.items || [], total: result.items?.length || 0 });
});

router.post("/db-backups", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.name) return c.json({ error: "name is required" }, 400);
  if (!body?.dbResourceId) return c.json({ error: "dbResourceId is required" }, 400);
  const result: any = await getClient().send(
    new CreateDbBackupCommand({
      name: body.name,
      dbResourceId: body.dbResourceId,
    })
  );
  return c.json({ backup: result }, 201);
});

router.delete("/db-backups/:name", async (c: Context) => {
  const name = c.req.param("name")!;
  await getClient().send(new DeleteDbBackupCommand({ identifier: name }));
  return c.json({ ok: true });
});

// ── DB parameter groups ──────────────────────────────────

router.get("/db-parameter-groups", async (c: Context) => {
  const result: any = await getClient().send(new ListDbParameterGroupsCommand({}));
  return c.json({
    parameterGroups: result.items || [],
    total: result.items?.length || 0,
  });
});

router.post("/db-parameter-groups", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.name) return c.json({ error: "name is required" }, 400);
  if (!body?.description) return c.json({ error: "description is required" }, 400);
  if (!body?.parameters) return c.json({ error: "parameters is required" }, 400);
  const result: any = await getClient().send(
    new CreateDbParameterGroupCommand({
      name: body.name,
      description: body.description,
      parameters: body.parameters,
    })
  );
  return c.json({ parameterGroup: result }, 201);
});

export default router;
