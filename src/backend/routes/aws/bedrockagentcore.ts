import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import {
  BedrockAgentCoreControlClient,
  ListAgentRuntimesCommand,
  GetAgentRuntimeCommand,
  CreateAgentRuntimeCommand,
  UpdateAgentRuntimeCommand,
  DeleteAgentRuntimeCommand,
} from "@aws-sdk/client-bedrock-agentcore-control";
import {
  BedrockAgentCoreClient,
  InvokeAgentRuntimeCommand,
} from "@aws-sdk/client-bedrock-agentcore";

const router = new Hono();
const getControlClient = () => create(BedrockAgentCoreControlClient);
const getDataClient = () => create(BedrockAgentCoreClient);

router.get("/runtimes", async (c: Context) => {
  const client = getControlClient();
  const result = await client.send(new ListAgentRuntimesCommand({}));
  const runtimes = result.agentRuntimes || [];
/* istanbul ignore next */
  return c.json({ agentRuntimes: runtimes, total: runtimes.length, nextToken: result.nextToken ?? null });
});

router.get("/runtimes/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const client = getControlClient();
  const result = await client.send(new GetAgentRuntimeCommand({ agentRuntimeId: id }));
  return c.json({
    runtime: {
      agentRuntimeArn: result.agentRuntimeArn,
      agentRuntimeId: result.agentRuntimeId,
      agentRuntimeName: result.agentRuntimeName,
      agentRuntimeVersion: result.agentRuntimeVersion,
      description: result.description ?? null,
      roleArn: result.roleArn ?? null,
      status: result.status,
      createdAt: String(result.createdAt ?? ""),
      lastUpdatedAt: String(result.lastUpdatedAt ?? ""),
    },
  });
});

router.post("/runtimes", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.name) return c.json({ error: "name is required" }, 400);
  if (!body.roleArn) return c.json({ error: "roleArn is required" }, 400);
  const client = getControlClient();
  const result = await client.send(
    new CreateAgentRuntimeCommand({
      agentRuntimeName: body.name,
      roleArn: body.roleArn,
      description: body.description,
      agentRuntimeArtifact: body.artifact ?? { containerConfiguration: { containerUri: body.containerUri ?? "" } },
      networkConfiguration: body.networkConfiguration ?? { networkMode: "PUBLIC" },
      authorizerConfiguration: body.authorizerConfiguration,
      protocolConfiguration: body.protocolConfiguration,
      environmentVariables: body.environmentVariables,
    })
  );
  return c.json(
    {
      agentRuntimeArn: result.agentRuntimeArn,
      agentRuntimeId: result.agentRuntimeId,
      agentRuntimeVersion: result.agentRuntimeVersion,
      status: result.status,
    },
    202
  );
});

router.patch("/runtimes/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const body = await c.req.json<any>();
  const client = getControlClient();
  const result = await client.send(
    new UpdateAgentRuntimeCommand({
      agentRuntimeId: id,
      roleArn: body.roleArn,
      description: body.description,
      agentRuntimeArtifact: body.artifact,
      environmentVariables: body.environmentVariables,
    })
  );
  return c.json(
    {
      agentRuntimeArn: result.agentRuntimeArn,
      agentRuntimeVersion: result.agentRuntimeVersion,
      status: result.status,
    },
    202
  );
});

router.delete("/runtimes/:id", async (c: Context) => {
  const id = c.req.param("id");
  const client = getControlClient();
  const result = await client.send(new DeleteAgentRuntimeCommand({ agentRuntimeId: id }));
  return c.json({ agentRuntimeId: result.agentRuntimeId, status: result.status });
});

router.post("/invoke/:arn{.+}", async (c: Context) => {
  const arn = c.req.param("arn")!;
  const body = await c.req.json<any>().catch(() => ({}));
  if (!body.payload && body.payload !== "") {
    return c.json({ error: "payload is required" }, 400);
  }
  const client = getDataClient();
  const result = await client.send(
    new InvokeAgentRuntimeCommand({
      agentRuntimeArn: decodeURIComponent(arn),
      qualifier: body.qualifier ?? "DEFAULT",
      contentType: body.contentType ?? "application/json",
      accept: "application/json",
      payload: typeof body.payload === "string" ? body.payload : JSON.stringify(body.payload),
    })
  );
  const text = result.response
    ? await new Response(result.response as ReadableStream).text()
    : "";
  return c.newResponse(text || "", 200, {
    "content-type": result.contentType || "application/json",
  });
});

export default router;
