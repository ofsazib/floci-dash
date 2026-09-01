import { Hono } from "hono";
import type { Context } from "hono";
import {
  MemoryDBClient,
  DescribeClustersCommand,
  CreateClusterCommand,
  UpdateClusterCommand,
  DeleteClusterCommand,
  ListTagsCommand,
  TagResourceCommand,
  UntagResourceCommand,
  CreateUserCommand,
  DescribeUsersCommand,
  DeleteUserCommand,
  CreateACLCommand,
  DescribeACLsCommand,
  DeleteACLCommand,
} from "@aws-sdk/client-memorydb";
import { create } from "../../clients/aws";

const router = new Hono();
function getClient() {
  return create(MemoryDBClient);
}

// ─── Clusters ─────────────────────────────────────────────

router.get("/clusters", async (c: Context) => {
  const name = c.req.query("name");
  const result = await getClient().send(
    new DescribeClustersCommand(name ? { ClusterName: name } : {})
  );
  const clusters = result.Clusters || [];
/* istanbul ignore next */
  return c.json({ clusters, total: clusters.length });
});

router.get("/clusters/:name", async (c: Context) => {
  const name = c.req.param("name");
  const result = await getClient().send(new DescribeClustersCommand({ ClusterName: name }));
  return c.json({ cluster: result.Clusters?.[0] || null });
});

router.post("/clusters", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.clusterName) return c.json({ error: "clusterName is required" }, 400);
  const result = await getClient().send(
    new CreateClusterCommand({
      ClusterName: body.clusterName,
      Description: body.description,
      NodeType: body.nodeType,
      NumShards: body.numShards,
      Engine: body.engine,
      EngineVersion: body.engineVersion,
      ACLName: body.aclName,
      TLSEnabled: body.tlsEnabled,
      Tags: body.tags,
    })
  );
  return c.json({ cluster: result.Cluster }, 201);
});

router.patch("/clusters/:name", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<any>();
  const result = await getClient().send(
    new UpdateClusterCommand({
      ClusterName: name,
      Description: body.description,
    })
  );
  return c.json({ cluster: result.Cluster });
});

router.delete("/clusters/:name", async (c: Context) => {
  const name = c.req.param("name");
  await getClient().send(new DeleteClusterCommand({ ClusterName: name }));
  return c.json({ deleted: true });
});

// ─── Tags ─────────────────────────────────────────────────

router.get("/tags/:arn", async (c: Context) => {
  const arn = c.req.param("arn");
  const result = await getClient().send(new ListTagsCommand({ ResourceArn: arn }));
  return c.json({ tags: result.TagList || [], total: result.TagList?.length || 0 });
});

router.post("/tags/:arn", async (c: Context) => {
  const arn = c.req.param("arn");
  const { tags } = await c.req.json<{ tags: Array<{ Key: string; Value: string }> }>();
  if (!tags || !Array.isArray(tags)) return c.json({ error: "tags array is required" }, 400);
  const result = await getClient().send(new TagResourceCommand({ ResourceArn: arn, Tags: tags }));
  return c.json({ tags: result.TagList || [] }, 201);
});

router.delete("/tags/:arn", async (c: Context) => {
  const arn = c.req.param("arn");
  const { tagKeys } = await c.req.json<{ tagKeys: string[] }>();
  if (!tagKeys || !Array.isArray(tagKeys)) return c.json({ error: "tagKeys array is required" }, 400);
  const result = await getClient().send(new UntagResourceCommand({ ResourceArn: arn, TagKeys: tagKeys }));
  return c.json({ tags: result.TagList || [] });
});

// ─── Users ──────────────────────────────────────────────

router.get("/users", async (c: Context) => {
  const userName = c.req.query("userName");
  const result = await getClient().send(
    new DescribeUsersCommand(userName ? { UserName: userName } : {})
  );
  const users = result.Users || [];
  return c.json({ users, total: users.length });
});

router.post("/users", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.userName) return c.json({ error: "userName is required" }, 400);
  const result = await getClient().send(
    new CreateUserCommand({
      UserName: body.userName,
      AuthenticationMode: body.authenticationMode,
      AccessString: body.accessString,
      Tags: body.tags,
    })
  );
  return c.json({ user: result.User }, 201);
});

router.delete("/users/:userName", async (c: Context) => {
  const userName = c.req.param("userName");
  await getClient().send(new DeleteUserCommand({ UserName: userName }));
  return c.json({ deleted: true });
});

// ─── ACLs ────────────────────────────────────────────────

router.get("/acls", async (c: Context) => {
  const aclName = c.req.query("aclName");
  const result = await getClient().send(
    new DescribeACLsCommand(aclName ? { ACLName: aclName } : {})
  );
  const acls = result.ACLs || [];
  return c.json({ acls, total: acls.length });
});

router.post("/acls", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.aclName) return c.json({ error: "aclName is required" }, 400);
  const result = await getClient().send(
    new CreateACLCommand({
      ACLName: body.aclName,
      UserNames: body.userNames,
      Tags: body.tags,
    })
  );
  return c.json({ acl: result.ACL }, 201);
});

router.delete("/acls/:aclName", async (c: Context) => {
  const aclName = c.req.param("aclName");
  await getClient().send(new DeleteACLCommand({ ACLName: aclName }));
  return c.json({ deleted: true });
});

export default router;
