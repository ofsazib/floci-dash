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
  CreateRuleGroupsNamespaceCommand,
  ListRuleGroupsNamespacesCommand,
  DescribeRuleGroupsNamespaceCommand,
  PutRuleGroupsNamespaceCommand,
  DeleteRuleGroupsNamespaceCommand,
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

// ── Rule Groups Namespaces ─────────────────────────────────

router.get("/workspaces/:workspaceId/namespaces", async (c: Context) => {
  const workspaceId = c.req.param("workspaceId");
  const result: any = await getClient().send(
    new ListRuleGroupsNamespacesCommand({ workspaceId, maxResults: 100 })
  );
  const namespaces = (result.ruleGroupsNamespaces || []).map((n: any) => ({
    name: n.name,
    arn: n.arn,
    status: n.status?.statusCode ?? n.status,
    createdAt: n.createdAt,
    modifiedAt: n.modifiedAt,
  }));
  return c.json({ namespaces, total: namespaces.length });
});

router.post("/workspaces/:workspaceId/namespaces", async (c: Context) => {
  const workspaceId = c.req.param("workspaceId");
  const body = await c.req.json<any>();
  if (!body.name) return c.json({ error: "name is required" }, 400);
  if (!body.data) return c.json({ error: "data is required" }, 400);
  const result: any = await getClient().send(
    new CreateRuleGroupsNamespaceCommand({
      workspaceId,
      name: body.name,
      data: body.data,
      clientToken: body.clientToken,
    })
  );
  return c.json({ name: result.name, arn: result.arn, status: result.status }, 202);
});

router.get("/workspaces/:workspaceId/namespaces/:name", async (c: Context) => {
  const workspaceId = c.req.param("workspaceId");
  const name = c.req.param("name");
  try {
    const result: any = await getClient().send(
      new DescribeRuleGroupsNamespaceCommand({ workspaceId, name })
    );
    const ns = result.ruleGroupsNamespace;
    return c.json({
      namespace: ns
        ? {
            name: ns.name,
            arn: ns.arn,
            status: ns.status?.statusCode ?? ns.status,
            createdAt: ns.createdAt,
            modifiedAt: ns.modifiedAt,
            data: ns.data,
          }
        : null,
    });
  } catch (err: any) {
    if (err.name === "ResourceNotFoundException") {
      return c.json({ error: "Namespace not found" }, 404);
    }
    throw err;
  }
});

router.put("/workspaces/:workspaceId/namespaces/:name", async (c: Context) => {
  const workspaceId = c.req.param("workspaceId");
  const name = c.req.param("name");
  const body = await c.req.json<any>();
  if (!body.data) return c.json({ error: "data is required" }, 400);
  const result: any = await getClient().send(
    new PutRuleGroupsNamespaceCommand({
      workspaceId,
      name,
      data: body.data,
      clientToken: body.clientToken,
    })
  );
  return c.json({ name: result.name, arn: result.arn, status: result.status, updatedAt: true });
});

router.delete("/workspaces/:workspaceId/namespaces/:name", async (c: Context) => {
  const workspaceId = c.req.param("workspaceId");
  const name = c.req.param("name");
  await getClient().send(new DeleteRuleGroupsNamespaceCommand({ workspaceId, name }));
  return c.json({ deleted: true });
});

export default router;
