import { Hono } from "hono";
import type { Context } from "hono";
import { getAwsConfig } from "../../clients/aws";
import { APIGatewayClient } from "@aws-sdk/client-api-gateway";
import {
  GetRestApisCommand,
  GetRestApiCommand,
  CreateRestApiCommand,
  DeleteRestApiCommand,
  GetResourcesCommand,
  GetDeploymentsCommand,
} from "@aws-sdk/client-api-gateway";

const router = new Hono();
const getClient = () => new APIGatewayClient(getAwsConfig());

// ── REST APIs ────────────────────────────────────────────

router.get("/rest-apis", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new GetRestApisCommand({}));
  return c.json({
    apis: result.items || [],
    total: result.items?.length || 0,
  });
});

router.get("/rest-apis/:apiId", async (c: Context) => {
  const apiId = c.req.param("apiId");
  if (!apiId) return c.json({ error: "apiId param required" }, 400);
  const client = getClient();
  const result = await client.send(new GetRestApiCommand({ restApiId: apiId }));
  return c.json({ api: result });
});

router.post("/rest-apis", async (c: Context) => {
  const body = await c.req.json();
  if (!body.name) return c.json({ error: "name is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CreateRestApiCommand({
      name: body.name,
      description: body.description,
      version: body.version,
      apiKeySource: body.apiKeySource,
      endpointConfiguration: body.endpointConfiguration,
    })
  );
  return c.json({ api: result }, 201);
});

router.delete("/rest-apis/:apiId", async (c: Context) => {
  const apiId = c.req.param("apiId");
  if (!apiId) return c.json({ error: "apiId param required" }, 400);
  const client = getClient();
  await client.send(new DeleteRestApiCommand({ restApiId: apiId }));
  return c.json({ deleted: true });
});

// ── Resources ────────────────────────────────────────────

router.get("/rest-apis/:apiId/resources", async (c: Context) => {
  const apiId = c.req.param("apiId");
  if (!apiId) return c.json({ error: "apiId param required" }, 400);
  const client = getClient();
  const result = await client.send(
    new GetResourcesCommand({ restApiId: apiId })
  );
  return c.json({
    resources: result.items || [],
    total: result.items?.length || 0,
  });
});

// ── Deployments ──────────────────────────────────────────

router.get("/rest-apis/:apiId/deployments", async (c: Context) => {
  const apiId = c.req.param("apiId");
  if (!apiId) return c.json({ error: "apiId param required" }, 400);
  const client = getClient();
  const result = await client.send(
    new GetDeploymentsCommand({ restApiId: apiId })
  );
  return c.json({
    deployments: result.items || [],
    total: result.items?.length || 0,
  });
});

export default router;
