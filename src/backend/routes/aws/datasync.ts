import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { readJson } from "../../clients/read-json";
import {
  DataSyncClient,
  ListAgentsCommand,
  CreateAgentCommand,
  DescribeAgentCommand,
  UpdateAgentCommand,
  DeleteAgentCommand,
  ListLocationsCommand,
  CreateLocationAzureBlobCommand,
  DescribeLocationAzureBlobCommand,
  UpdateLocationAzureBlobCommand,
  DeleteLocationCommand,
  ListTasksCommand,
  CreateTaskCommand,
  DescribeTaskCommand,
  UpdateTaskCommand,
  DeleteTaskCommand,
  ListTagsForResourceCommand,
  TagResourceCommand,
  UntagResourceCommand,
} from "@aws-sdk/client-datasync";

const router = new Hono();
const getClient = () => create(DataSyncClient);

// ── Agents ───────────────────────────────────────────────

router.get("/agents", async (c: Context) => {
  const result: any = await getClient().send(new ListAgentsCommand({}));
  return c.json({ agents: result.Agents || [], total: result.Agents?.length || 0 });
});

router.post("/agents", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.activationKey) return c.json({ error: "activationKey is required" }, 400);
  const result: any = await getClient().send(
    new CreateAgentCommand({
      ActivationKey: body.activationKey,
      AgentName: body.agentName,
    })
  );
  return c.json({ agentArn: result.AgentArn }, 201);
});

router.get("/agents/:arn{.+}", async (c: Context) => {
  const arn = c.req.param("arn")!;
  const result: any = await getClient().send(
    new DescribeAgentCommand({ AgentArn: arn })
  );
  return c.json({ agent: result || null });
});

router.put("/agents/:arn{.+}", async (c: Context) => {
  const arn = c.req.param("arn")!;
  const body: any = await readJson(c);
  if (!body?.name) return c.json({ error: "name is required" }, 400);
  await getClient().send(new UpdateAgentCommand({ AgentArn: arn, Name: body.name }));
  return c.json({ ok: true });
});

router.delete("/agents/:arn{.+}", async (c: Context) => {
  const arn = c.req.param("arn")!;
  await getClient().send(new DeleteAgentCommand({ AgentArn: arn }));
  return c.json({ ok: true });
});

// ── Locations (Azure Blob) ───────────────────────────────

router.get("/locations", async (c: Context) => {
  const result: any = await getClient().send(new ListLocationsCommand({}));
  return c.json({ locations: result.Locations || [], total: result.Locations?.length || 0 });
});

router.post("/locations", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.blobType) return c.json({ error: "blobType is required" }, 400);
  if (!body?.containerUrl) return c.json({ error: "containerUrl is required" }, 400);
  if (!body?.agentArns || body.agentArns.length === 0)
    return c.json({ error: "agentArns with at least one agent is required" }, 400);
  const result: any = await getClient().send(
    new CreateLocationAzureBlobCommand({
      BlobType: body.blobType,
      ContainerUrl: body.containerUrl,
      AgentArns: body.agentArns,
      AuthenticationType: body.authenticationType,
      Subdirectory: body.subdirectory,
    })
  );
  return c.json({ locationArn: result.LocationArn }, 201);
});

router.get("/locations/:arn{.+}", async (c: Context) => {
  const arn = c.req.param("arn")!;
  const result: any = await getClient().send(
    new DescribeLocationAzureBlobCommand({ LocationArn: arn })
  );
  return c.json({ location: result || null });
});

router.put("/locations/:arn{.+}", async (c: Context) => {
  const arn = c.req.param("arn")!;
  const body: any = await readJson(c);
  await getClient().send(
    new UpdateLocationAzureBlobCommand({
      LocationArn: arn,
      Subdirectory: body.subdirectory,
    })
  );
  return c.json({ ok: true });
});

router.delete("/locations/:arn{.+}", async (c: Context) => {
  const arn = c.req.param("arn")!;
  await getClient().send(new DeleteLocationCommand({ LocationArn: arn }));
  return c.json({ ok: true });
});

// ── Tasks ────────────────────────────────────────────────

router.get("/tasks", async (c: Context) => {
  const result: any = await getClient().send(new ListTasksCommand({}));
  return c.json({ tasks: result.Tasks || [], total: result.Tasks?.length || 0 });
});

router.post("/tasks", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.sourceLocationArn) return c.json({ error: "sourceLocationArn is required" }, 400);
  if (!body?.destinationLocationArn)
    return c.json({ error: "destinationLocationArn is required" }, 400);
  const result: any = await getClient().send(
    new CreateTaskCommand({
      SourceLocationArn: body.sourceLocationArn,
      DestinationLocationArn: body.destinationLocationArn,
      Name: body.name,
    })
  );
  return c.json({ taskArn: result.TaskArn }, 201);
});

router.get("/tasks/:arn{.+}", async (c: Context) => {
  const arn = c.req.param("arn")!;
  const result: any = await getClient().send(
    new DescribeTaskCommand({ TaskArn: arn })
  );
  return c.json({ task: result || null });
});

router.put("/tasks/:arn{.+}", async (c: Context) => {
  const arn = c.req.param("arn")!;
  const body: any = await readJson(c);
  if (!body?.name) return c.json({ error: "name is required" }, 400);
  await getClient().send(new UpdateTaskCommand({ TaskArn: arn, Name: body.name }));
  return c.json({ ok: true });
});

router.delete("/tasks/:arn{.+}", async (c: Context) => {
  const arn = c.req.param("arn")!;
  await getClient().send(new DeleteTaskCommand({ TaskArn: arn }));
  return c.json({ ok: true });
});

// ── Tags ─────────────────────────────────────────────────

router.get("/resources/tags", async (c: Context) => {
  const arn = c.req.query("arn");
  if (!arn) return c.json({ error: "arn query parameter is required" }, 400);
  const result: any = await getClient().send(
    new ListTagsForResourceCommand({ ResourceArn: arn })
  );
  return c.json({ tags: result.Tags || [] });
});

router.post("/resources/tags/untag", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.resourceArn) return c.json({ error: "resourceArn is required" }, 400);
  if (!Array.isArray(body?.tagKeys) || body.tagKeys.length === 0)
    return c.json({ error: "tagKeys array with at least one key is required" }, 400);
  await getClient().send(
    new UntagResourceCommand({ ResourceArn: body.resourceArn, TagKeys: body.tagKeys } as any)
  );
  return c.json({ ok: true });
});

router.post("/resources/tags", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.resourceArn) return c.json({ error: "resourceArn is required" }, 400);
  if (!Array.isArray(body?.tags) || body.tags.length === 0)
    return c.json({ error: "tags array with at least one tag is required" }, 400);
  await getClient().send(
    new TagResourceCommand({ ResourceArn: body.resourceArn, Tags: body.tags })
  );
  return c.json({ ok: true });
});

export default router;
