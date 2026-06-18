import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { PipesClient } from "@aws-sdk/client-pipes";
import {
  ListPipesCommand,
  CreatePipeCommand,
  DescribePipeCommand,
  UpdatePipeCommand,
  DeletePipeCommand,
  StartPipeCommand,
  StopPipeCommand,
} from "@aws-sdk/client-pipes";

const router = new Hono();
const getClient = () => create(PipesClient);

// ── Pipes ────────────────────────────────────────────────

router.get("/pipes", async (c: Context) => {
  const client = getClient();
  const namePrefix = c.req.query("namePrefix");
  const state = c.req.query("state");
  const result = await client.send(
    new ListPipesCommand({
      NamePrefix: namePrefix,
      DesiredState: state as any,
    })
  );
  const pipes = result.Pipes || [];
  return c.json({ pipes, total: pipes.length });
});

router.get("/pipes/:name", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  const result = await client.send(new DescribePipeCommand({ Name: name }));
  return c.json({ pipe: result });
});

router.post("/pipes", async (c: Context) => {
  const body = await c.req.json<{
    name: string;
    source: string;
    target: string;
    roleArn: string;
    description?: string;
    desiredState?: string;
    sourceParameters?: any;
    targetParameters?: any;
    enrichment?: string;
    tags?: Record<string, string>;
  }>();
  if (!body.name) return c.json({ error: "name is required" }, 400);
  if (!body.source) return c.json({ error: "source is required" }, 400);
  if (!body.target) return c.json({ error: "target is required" }, 400);
  if (!body.roleArn) return c.json({ error: "roleArn is required" }, 400);

  const client = getClient();
  const result = await client.send(
    new CreatePipeCommand({
      Name: body.name,
      Source: body.source,
      Target: body.target,
      RoleArn: body.roleArn,
      Description: body.description,
      DesiredState: body.desiredState as any,
      SourceParameters: body.sourceParameters,
      TargetParameters: body.targetParameters,
      Enrichment: body.enrichment,
      Tags: body.tags,
    })
  );
  return c.json({ pipe: result }, 201);
});

router.put("/pipes/:name", async (c: Context) => {
  const name = c.req.param("name");
  const body = await c.req.json<{
    roleArn?: string;
    description?: string;
    desiredState?: string;
    target?: string;
    enrichment?: string;
  }>();
  const client = getClient();
  const result = await client.send(
    new UpdatePipeCommand({
      Name: name,
      RoleArn: body.roleArn,
      Description: body.description,
      DesiredState: body.desiredState as any,
      Target: body.target,
      Enrichment: body.enrichment,
    })
  );
  return c.json({ pipe: result });
});

router.delete("/pipes/:name", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  await client.send(new DeletePipeCommand({ Name: name }));
  return c.json({ deleted: true });
});

router.post("/pipes/:name/start", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  const result = await client.send(new StartPipeCommand({ Name: name }));
  return c.json({ pipe: result });
});

router.post("/pipes/:name/stop", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  const result = await client.send(new StopPipeCommand({ Name: name }));
  return c.json({ pipe: result });
});

export default router;
