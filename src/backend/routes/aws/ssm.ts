import { Hono } from "hono";
import type { Context } from "hono";
import { getAwsConfig } from "../../clients/aws";
import { SSMClient } from "@aws-sdk/client-ssm";
import {
  DescribeParametersCommand,
  GetParameterCommand,
  GetParameterHistoryCommand,
  PutParameterCommand,
  DeleteParameterCommand,
  AddTagsToResourceCommand,
  ListTagsForResourceCommand,
  RemoveTagsFromResourceCommand,
} from "@aws-sdk/client-ssm";

const router = new Hono();
const getClient = () => new SSMClient(getAwsConfig());

// ── Parameters ───────────────────────────────────────────

router.get("/parameters", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new DescribeParametersCommand({}));
  return c.json({
    parameters: result.Parameters || [],
    total: result.Parameters?.length || 0,
  });
});

router.get("/parameters/:name", async (c: Context) => {
  const name = decodeURIComponent(c.req.param("name") || "");
  if (!name) return c.json({ error: "name param required" }, 400);
  const client = getClient();
  const result = await client.send(
    new GetParameterCommand({ Name: name, WithDecryption: true })
  );
  return c.json({ parameter: result.Parameter || null });
});

router.post("/parameters", async (c: Context) => {
  const body = await c.req.json();
  const client = getClient();
  const result = await client.send(
    new PutParameterCommand({
      Name: body.name,
      Value: body.value,
      Type: body.type || "String",
      Description: body.description,
      Overwrite: body.overwrite ?? false,
      Tags: body.tags,
    })
  );
  return c.json({ version: result.Version }, 201);
});

router.delete("/parameters/:name", async (c: Context) => {
  const name = decodeURIComponent(c.req.param("name") || "");
  if (!name) return c.json({ error: "name param required" }, 400);
  const client = getClient();
  await client.send(new DeleteParameterCommand({ Name: name }));
  return c.json({ deleted: true });
});

// ── Parameter History ────────────────────────────────────

router.get("/parameters/:name/history", async (c: Context) => {
  const name = decodeURIComponent(c.req.param("name") || "");
  if (!name) return c.json({ error: "name param required" }, 400);
  const client = getClient();
  const result = await client.send(
    new GetParameterHistoryCommand({ Name: name })
  );
  return c.json({
    history: result.Parameters || [],
    total: result.Parameters?.length || 0,
  });
});

// ── Tags ─────────────────────────────────────────────────

router.get("/tags", async (c: Context) => {
  const resourceId = c.req.query("resourceId");
  if (!resourceId) return c.json({ error: "resourceId query parameter required" }, 400);
  const client = getClient();
  const result = await client.send(
    new ListTagsForResourceCommand({
      ResourceType: "Parameter",
      ResourceId: resourceId,
    })
  );
  return c.json({ tags: result.TagList || [] });
});

router.post("/tags", async (c: Context) => {
  const body = await c.req.json();
  const client = getClient();
  await client.send(
    new AddTagsToResourceCommand({
      ResourceType: "Parameter",
      ResourceId: body.resourceId,
      Tags: body.tags,
    })
  );
  return c.json({ tagged: true });
});

router.delete("/tags", async (c: Context) => {
  const resourceId = c.req.query("resourceId");
  const tagKeys = c.req.query("tagKeys")?.split(",") || [];
  if (!resourceId) return c.json({ error: "resourceId query parameter required" }, 400);
  const client = getClient();
  await client.send(
    new RemoveTagsFromResourceCommand({
      ResourceType: "Parameter",
      ResourceId: resourceId,
      TagKeys: tagKeys,
    })
  );
  return c.json({ untagged: true });
});

export default router;
