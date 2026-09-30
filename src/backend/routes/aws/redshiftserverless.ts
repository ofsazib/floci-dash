import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { readJson } from "../../clients/read-json";
import {
  RedshiftServerlessClient,
  ListNamespacesCommand,
  CreateNamespaceCommand,
  GetNamespaceCommand,
  UpdateNamespaceCommand,
  DeleteNamespaceCommand,
  ListTagsForResourceCommand,
  TagResourceCommand,
  UntagResourceCommand,
} from "@aws-sdk/client-redshift-serverless";

const router = new Hono();
const getClient = () => create(RedshiftServerlessClient);

router.get("/namespaces", async (c: Context) => {
  const result: any = await getClient().send(new ListNamespacesCommand({}));
  return c.json({
    namespaces: result.namespaces || [],
    total: result.namespaces?.length || 0,
  });
});

router.post("/namespaces", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.namespaceName) return c.json({ error: "namespaceName is required" }, 400);
  if (!body?.dbName) return c.json({ error: "dbName is required" }, 400);
  if (!body?.adminUsername) return c.json({ error: "adminUsername is required" }, 400);
  const result: any = await getClient().send(
    new CreateNamespaceCommand({
      namespaceName: body.namespaceName,
      dbName: body.dbName,
      adminUsername: body.adminUsername,
      kmsKeyId: body.kmsKeyId,
      defaultIamRoleArn: body.defaultIamRoleArn,
      iamRoles: body.iamRoles,
      logExports: body.logExports,
    })
  );
  return c.json({ namespace: result.namespace }, 201);
});

router.get("/namespaces/:name", async (c: Context) => {
  const name = c.req.param("name")!;
  const result: any = await getClient().send(
    new GetNamespaceCommand({ namespaceName: name })
  );
  return c.json({ namespace: result.namespace || null });
});

router.put("/namespaces/:name", async (c: Context) => {
  const name = c.req.param("name")!;
  const body: any = await readJson(c);
  if (!body?.adminUsername && !body?.defaultIamRoleArn && !body?.kmsKeyId && !body?.iamRoles && !body?.logExports)
    return c.json(
      { error: "at least one of adminUsername, defaultIamRoleArn, kmsKeyId, iamRoles, logExports is required" },
      400
    );
  const result: any = await getClient().send(
    new UpdateNamespaceCommand({
      namespaceName: name,
      adminUsername: body.adminUsername,
      kmsKeyId: body.kmsKeyId,
      defaultIamRoleArn: body.defaultIamRoleArn,
      iamRoles: body.iamRoles,
      logExports: body.logExports,
    })
  );
  return c.json({ namespace: result.namespace });
});

router.delete("/namespaces/:name", async (c: Context) => {
  const name = c.req.param("name")!;
  const result: any = await getClient().send(
    new DeleteNamespaceCommand({ namespaceName: name })
  );
  return c.json({ ok: true, namespace: result.namespace || null });
});

// ── Tags (addressed by the namespace's own ARN) ──────────

router.get("/namespaces/:name/tags", async (c: Context) => {
  const arn = c.req.query("arn");
  if (!arn) return c.json({ error: "arn query parameter is required" }, 400);
  const result: any = await getClient().send(
    new ListTagsForResourceCommand({ resourceArn: arn })
  );
  return c.json({ tags: result.tags || [] });
});

router.post("/namespaces/:name/tags", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.arn) return c.json({ error: "arn is required" }, 400);
  if (!Array.isArray(body?.tags) || body.tags.length === 0)
    return c.json({ error: "tags array with at least one tag is required" }, 400);
  await getClient().send(
    new TagResourceCommand({ resourceArn: body.arn, tags: body.tags })
  );
  return c.json({ ok: true });
});

router.post("/namespaces/:name/tags/untag", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.arn) return c.json({ error: "arn is required" }, 400);
  if (!Array.isArray(body?.tagKeys) || body.tagKeys.length === 0)
    return c.json({ error: "tagKeys array with at least one key is required" }, 400);
  await getClient().send(
    new UntagResourceCommand({ resourceArn: body.arn, tagKeys: body.tagKeys })
  );
  return c.json({ ok: true });
});

export default router;
