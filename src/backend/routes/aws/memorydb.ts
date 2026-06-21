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

export default router;
