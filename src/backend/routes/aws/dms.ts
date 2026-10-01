import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { readJson } from "../../clients/read-json";
import {
  DatabaseMigrationServiceClient,
  CreateReplicationSubnetGroupCommand,
  DescribeReplicationSubnetGroupsCommand,
  DeleteReplicationSubnetGroupCommand,
  ListTagsForResourceCommand,
  AddTagsToResourceCommand,
  RemoveTagsFromResourceCommand,
} from "@aws-sdk/client-database-migration-service";

const router = new Hono();
const getClient = () => create(DatabaseMigrationServiceClient);

// ── Replication subnet groups ────────────────────────────

router.get("/subnet-groups", async (c: Context) => {
  const result: any = await getClient().send(
    new DescribeReplicationSubnetGroupsCommand({})
  );
  return c.json({
    subnetGroups: result.ReplicationSubnetGroups || [],
    total: result.ReplicationSubnetGroups?.length || 0,
  });
});

router.post("/subnet-groups", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.replicationSubnetGroupIdentifier)
    return c.json({ error: "replicationSubnetGroupIdentifier is required" }, 400);
  if (!body?.replicationSubnetGroupDescription)
    return c.json({ error: "replicationSubnetGroupDescription is required" }, 400);
  if (!Array.isArray(body?.subnetIds) || body.subnetIds.length === 0)
    return c.json({ error: "subnetIds array with at least one subnet is required" }, 400);
  const result: any = await getClient().send(
    new CreateReplicationSubnetGroupCommand({
      ReplicationSubnetGroupIdentifier: body.replicationSubnetGroupIdentifier,
      ReplicationSubnetGroupDescription: body.replicationSubnetGroupDescription,
      SubnetIds: body.subnetIds,
      Tags: body.tags,
    })
  );
  return c.json({ subnetGroup: result.ReplicationSubnetGroup || null }, 201);
});

router.delete("/subnet-groups/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  await getClient().send(
    new DeleteReplicationSubnetGroupCommand({
      ReplicationSubnetGroupIdentifier: id,
    })
  );
  return c.json({ ok: true });
});

// ── Tags (resource ARN addressed) ────────────────────────

router.get("/resources/tags", async (c: Context) => {
  const arn = c.req.query("arn");
  if (!arn) return c.json({ error: "arn query parameter is required" }, 400);
  const result: any = await getClient().send(
    new ListTagsForResourceCommand({ ResourceArn: arn })
  );
  return c.json({ tagList: result.TagList || [] });
});

router.post("/resources/tags", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.resourceArn) return c.json({ error: "resourceArn is required" }, 400);
  if (!Array.isArray(body?.tags) || body.tags.length === 0)
    return c.json({ error: "tags array with at least one tag is required" }, 400);
  await getClient().send(
    new AddTagsToResourceCommand({ ResourceArn: body.resourceArn, Tags: body.tags })
  );
  return c.json({ ok: true });
});

router.post("/resources/tags/untag", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.resourceArn) return c.json({ error: "resourceArn is required" }, 400);
  if (!Array.isArray(body?.tagKeys) || body.tagKeys.length === 0)
    return c.json({ error: "tagKeys array with at least one key is required" }, 400);
  await getClient().send(
    new RemoveTagsFromResourceCommand({
      ResourceArn: body.resourceArn,
      TagKeys: body.tagKeys,
    })
  );
  return c.json({ ok: true });
});

export default router;
