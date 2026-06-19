import { Hono } from "hono";
import type { Context } from "hono";
import {
  ElastiCacheClient,
  DescribeReplicationGroupsCommand,
  CreateReplicationGroupCommand,
  DeleteReplicationGroupCommand,
  DescribeCacheClustersCommand,
  CreateCacheClusterCommand,
  DeleteCacheClusterCommand,
  DescribeUsersCommand,
  CreateUserCommand,
  DeleteUserCommand,
} from "@aws-sdk/client-elasticache";
import { create } from "../../clients/aws";

const router = new Hono();

function getClient() {
  return create(ElastiCacheClient);
}

// ─── Replication Groups ────────────────────────────────────

router.get("/replication-groups", async (c: Context) => {
  const result = await getClient().send(new DescribeReplicationGroupsCommand({}));
  const replicationGroups = result.ReplicationGroups || [];
  return c.json({ replicationGroups, total: replicationGroups.length });
});

router.post("/replication-groups", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.ReplicationGroupId) {
    return c.json({ error: "ReplicationGroupId is required" }, 400);
  }
  const result = await getClient().send(
    new CreateReplicationGroupCommand({
      ReplicationGroupId: body.ReplicationGroupId,
      ReplicationGroupDescription: body.Description,
      AuthToken: body.AuthToken,
    })
  );
  return c.json({ replicationGroup: result.ReplicationGroup, created: true });
});

router.post("/replication-groups/delete", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.ReplicationGroupId) {
    return c.json({ error: "ReplicationGroupId is required" }, 400);
  }
  await getClient().send(new DeleteReplicationGroupCommand({ ReplicationGroupId: body.ReplicationGroupId }));
  return c.json({ deleted: true });
});

// ─── Cache Clusters ──────────────────────────────────────

router.get("/cache-clusters", async (c: Context) => {
  const result = await getClient().send(new DescribeCacheClustersCommand({}));
  const cacheClusters = result.CacheClusters || [];
  return c.json({ cacheClusters, total: cacheClusters.length });
});

router.post("/cache-clusters", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.CacheClusterId) {
    return c.json({ error: "CacheClusterId is required" }, 400);
  }
  const result = await getClient().send(
    new CreateCacheClusterCommand({
      CacheClusterId: body.CacheClusterId,
      Engine: body.Engine || "memcached",
    })
  );
  return c.json({ cacheCluster: result.CacheCluster, created: true });
});

router.post("/cache-clusters/delete", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.CacheClusterId) {
    return c.json({ error: "CacheClusterId is required" }, 400);
  }
  await getClient().send(new DeleteCacheClusterCommand({ CacheClusterId: body.CacheClusterId }));
  return c.json({ deleted: true });
});

// ─── Users ────────────────────────────────────────────────

router.get("/users", async (c: Context) => {
  const result = await getClient().send(new DescribeUsersCommand({}));
  const users = result.Users || [];
  return c.json({ users, total: users.length });
});

router.post("/users", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.UserId) {
    return c.json({ error: "UserId is required" }, 400);
  }
  const result = await getClient().send(
    new CreateUserCommand({
      UserId: body.UserId,
      UserName: body.UserName || body.UserId,
      Engine: "redis",
      AccessString: body.AccessString || "on ~* +@all",
      AuthenticationMode: body.AuthenticationMode,
    })
  );
  return c.json({ user: result as any, created: true });
});

router.post("/users/delete", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.UserId) {
    return c.json({ error: "UserId is required" }, 400);
  }
  await getClient().send(new DeleteUserCommand({ UserId: body.UserId }));
  return c.json({ deleted: true });
});

export default router;
