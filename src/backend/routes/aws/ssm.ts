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
  GetParametersCommand,
  GetParametersByPathCommand,
  DeleteParametersCommand,
  LabelParameterVersionCommand,
  DescribeInstanceInformationCommand,
  AddTagsToResourceCommand,
  ListTagsForResourceCommand,
  RemoveTagsFromResourceCommand,
} from "@aws-sdk/client-ssm";
import { sanitizeName, sanitizeText } from "../../clients/sanitize";

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
  const name = decodeURIComponent(c.req.param("name")!);
  const client = getClient();
  const result = await client.send(
    new GetParameterCommand({ Name: name, WithDecryption: true })
  );
  return c.json({ parameter: result.Parameter || null });
});

router.post("/parameters", async (c: Context) => {
  const body = await c.req.json();
  const paramName = sanitizeName(body.name || "", 2048);
  const paramValue = sanitizeText(body.value || "", 4096);
  if (!paramName || !paramValue) return c.json({ error: "name and value are required" }, 400);
  const client = getClient();
  const result = await client.send(
    new PutParameterCommand({
      Name: paramName,
      Value: paramValue,
      Type: body.type || "String",
      Description: sanitizeText(body.description || "", 1024),
      Overwrite: body.overwrite ?? false,
      Tags: body.tags,
    })
  );
  return c.json({ version: result.Version }, 201);
});

router.delete("/parameters/:name", async (c: Context) => {
  const name = decodeURIComponent(c.req.param("name")!);
  const client = getClient();
  await client.send(new DeleteParameterCommand({ Name: name }));
  return c.json({ deleted: true });
});

router.post("/parameters/batch", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.Names || !Array.isArray(body.Names) || body.Names.length === 0)
    return c.json({ error: "Names must be a non-empty array" }, 400);
  const client = getClient();
  const result = await client.send(
    new GetParametersCommand({ Names: body.Names, WithDecryption: body.WithDecryption })
  );
  return c.json({ parameters: result.Parameters || [], invalidParameters: result.InvalidParameters || [] });
});

router.get("/parameters-by-path", async (c: Context) => {
  const path = c.req.query("path");
  if (!path) return c.json({ error: "path query parameter required" }, 400);
  const client = getClient();
  const result = await client.send(
    new GetParametersByPathCommand({
      Path: path,
      Recursive: c.req.query("recursive") === "true",
      WithDecryption: c.req.query("withDecryption") === "true",
    })
  );
  return c.json({ parameters: result.Parameters || [], nextToken: result.NextToken || null });
});

router.post("/parameters/delete-batch", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.Names || !Array.isArray(body.Names) || body.Names.length === 0)
    return c.json({ error: "Names must be a non-empty array" }, 400);
  const client = getClient();
  const result = await client.send(new DeleteParametersCommand({ Names: body.Names }));
  return c.json({ deletedParameters: result.DeletedParameters || [], invalidParameters: result.InvalidParameters || [] });
});

router.post("/parameters/label", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.Name) return c.json({ error: "Name is required" }, 400);
  if (body.ParameterVersion == null) return c.json({ error: "ParameterVersion is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new LabelParameterVersionCommand({
      Name: body.Name,
      ParameterVersion: body.ParameterVersion,
      Labels: body.Labels || [],
    })
  );
  return c.json({ invalidLabels: result.InvalidLabels || [], parameterVersion: result.ParameterVersion });
});

router.get("/instance-information", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new DescribeInstanceInformationCommand({}));
  return c.json({ instances: result.InstanceInformationList || [], total: (result.InstanceInformationList || []).length });
});

// ── Parameter History ────────────────────────────────────

router.get("/parameters/:name/history", async (c: Context) => {
  const name = decodeURIComponent(c.req.param("name")!);
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
