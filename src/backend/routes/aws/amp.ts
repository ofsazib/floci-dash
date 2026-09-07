import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { AmpClient } from "@aws-sdk/client-amp";
import {
  CreateWorkspaceCommand,
  ListWorkspacesCommand,
  DescribeWorkspaceCommand,
  DeleteWorkspaceCommand,
  UpdateWorkspaceAliasCommand,
  ListTagsForResourceCommand,
  TagResourceCommand,
  UntagResourceCommand,
} from "@aws-sdk/client-amp";

const router = new Hono();
const getClient = () => create(AmpClient);

router.get("/workspaces", async (c: Context) => {
  const alias = c.req.query("alias") || undefined;
  const result: any = await getClient().send(
    new ListWorkspacesCommand({ alias, maxResults: 100 })
  );
  return c.json({ workspaces: result.workspaces || [], total: result.workspaces?.length || 0 });
});

router.post("/workspaces", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.alias) return c.json({ error: "alias is required" }, 400);
  const result: any = await getClient().send(
    new CreateWorkspaceCommand({
      alias: body.alias,
      tags: body.tags,
      kmsKeyArn: body.kmsKeyArn,
    })
  );
  return c.json({ workspaceId: result.workspaceId, arn: result.arn, status: result.status }, 202);
});

router.get("/workspaces/:workspaceId", async (c: Context) => {
  const result: any = await getClient().send(
    new DescribeWorkspaceCommand({ workspaceId: c.req.param("workspaceId") })
  );
  return c.json({ workspace: result.workspace });
});

router.delete("/workspaces/:workspaceId", async (c: Context) => {
  await getClient().send(
    new DeleteWorkspaceCommand({ workspaceId: c.req.param("workspaceId") })
  );
  return c.json({ deleted: true });
});

router.put("/workspaces/:workspaceId/alias", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.alias) return c.json({ error: "alias is required" }, 400);
  await getClient().send(
    new UpdateWorkspaceAliasCommand({
      workspaceId: c.req.param("workspaceId"),
      alias: body.alias,
    })
  );
  return c.json({ updated: true });
});

router.get("/tags", async (c: Context) => {
  const resourceArn = c.req.query("resourceArn");
  if (!resourceArn) return c.json({ error: "resourceArn query parameter required" }, 400);
  const result: any = await getClient().send(
    new ListTagsForResourceCommand({ resourceArn })
  );
  return c.json({ tags: result.tags || {} });
});

router.post("/tags", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.resourceArn || !body.tags) return c.json({ error: "resourceArn and tags are required" }, 400);
  await getClient().send(new TagResourceCommand({ resourceArn: body.resourceArn, tags: body.tags }));
  return c.json({ tagged: true });
});

router.post("/tags/untag", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.resourceArn || !body.tagKeys) return c.json({ error: "resourceArn and tagKeys are required" }, 400);
  await getClient().send(
    new UntagResourceCommand({ resourceArn: body.resourceArn, tagKeys: body.tagKeys as string[] })
  );
  return c.json({ untagged: true });
});

export default router;
