import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { ApiGatewayV2Client } from "@aws-sdk/client-apigatewayv2";
import {
  GetApisCommand,
  CreateApiCommand,
  GetApiCommand,
  DeleteApiCommand,
  GetRoutesCommand,
  CreateRouteCommand,
  DeleteRouteCommand,
  GetIntegrationsCommand,
  CreateIntegrationCommand,
  DeleteIntegrationCommand,
  GetStagesCommand,
  CreateStageCommand,
  DeleteStageCommand,
  GetDeploymentsCommand,
  CreateDeploymentCommand,
  DeleteDeploymentCommand,
} from "@aws-sdk/client-apigatewayv2";

const router = new Hono();
const getClient = () => create(ApiGatewayV2Client);

// ── APIs ─────────────────────────────────────────────────

router.get("/apis", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new GetApisCommand({}));
  const apis = result.Items || [];
  return c.json({ apis, total: apis.length });
});

router.get("/apis/:apiId", async (c: Context) => {
  const apiId = c.req.param("apiId");
  const client = getClient();
  const result = await client.send(new GetApiCommand({ ApiId: apiId }));
  return c.json({ api: result });
});

router.post("/apis", async (c: Context) => {
  const body = await c.req.json<{
    name: string;
    protocolType?: string;
    description?: string;
    routeSelectionExpression?: string;
    apiKeySelectionExpression?: string;
    tags?: Record<string, string>;
    corsConfiguration?: any;
  }>();
  if (!body.name) return c.json({ error: "name is required" }, 400);

  const client = getClient();
  const result = await client.send(
    new CreateApiCommand({
      Name: body.name,
      ProtocolType: body.protocolType as any,
      Description: body.description,
      RouteSelectionExpression: body.routeSelectionExpression,
      ApiKeySelectionExpression: body.apiKeySelectionExpression,
      Tags: body.tags,
      CorsConfiguration: body.corsConfiguration,
    })
  );
  return c.json({ api: result }, 201);
});

router.delete("/apis/:apiId", async (c: Context) => {
  const apiId = c.req.param("apiId");
  const client = getClient();
  await client.send(new DeleteApiCommand({ ApiId: apiId }));
  return c.json({ deleted: true });
});

// ── Routes ───────────────────────────────────────────────

router.get("/apis/:apiId/routes", async (c: Context) => {
  const apiId = c.req.param("apiId");
  const client = getClient();
  const result = await client.send(new GetRoutesCommand({ ApiId: apiId }));
  const routes = result.Items || [];
  return c.json({ routes, total: routes.length });
});

router.post("/apis/:apiId/routes", async (c: Context) => {
  const apiId = c.req.param("apiId");
  const body = await c.req.json<{ routeKey: string; authorizationType?: string; target?: string }>();
  if (!body.routeKey) return c.json({ error: "routeKey is required" }, 400);

  const client = getClient();
  const result = await client.send(
    new CreateRouteCommand({
      ApiId: apiId,
      RouteKey: body.routeKey,
      AuthorizationType: body.authorizationType as any,
      Target: body.target,
    })
  );
  return c.json({ route: result }, 201);
});

router.delete("/apis/:apiId/routes/:routeId", async (c: Context) => {
  const apiId = c.req.param("apiId");
  const routeId = c.req.param("routeId");
  const client = getClient();
  await client.send(new DeleteRouteCommand({ ApiId: apiId, RouteId: routeId }));
  return c.json({ deleted: true });
});

// ── Integrations ─────────────────────────────────────────

router.get("/apis/:apiId/integrations", async (c: Context) => {
  const apiId = c.req.param("apiId");
  const client = getClient();
  const result = await client.send(new GetIntegrationsCommand({ ApiId: apiId }));
  const integrations = result.Items || [];
  return c.json({ integrations, total: integrations.length });
});

router.post("/apis/:apiId/integrations", async (c: Context) => {
  const apiId = c.req.param("apiId");
  const body = await c.req.json<{
    integrationType: string;
    integrationUri: string;
    integrationMethod?: string;
    payloadFormatVersion?: string;
    connectionType?: string;
  }>();
  if (!body.integrationType) return c.json({ error: "integrationType is required" }, 400);

  const client = getClient();
  const result = await client.send(
    new CreateIntegrationCommand({
      ApiId: apiId,
      IntegrationType: body.integrationType as any,
      IntegrationUri: body.integrationUri,
      IntegrationMethod: body.integrationMethod,
      PayloadFormatVersion: body.payloadFormatVersion,
      ConnectionType: body.connectionType as any,
    })
  );
  return c.json({ integration: result }, 201);
});

router.delete("/apis/:apiId/integrations/:integrationId", async (c: Context) => {
  const apiId = c.req.param("apiId");
  const integrationId = c.req.param("integrationId");
  const client = getClient();
  await client.send(new DeleteIntegrationCommand({ ApiId: apiId, IntegrationId: integrationId }));
  return c.json({ deleted: true });
});

// ── Stages ───────────────────────────────────────────────

router.get("/apis/:apiId/stages", async (c: Context) => {
  const apiId = c.req.param("apiId");
  const client = getClient();
  const result = await client.send(new GetStagesCommand({ ApiId: apiId }));
  const stages = result.Items || [];
  return c.json({ stages, total: stages.length });
});

router.post("/apis/:apiId/stages", async (c: Context) => {
  const apiId = c.req.param("apiId");
  const body = await c.req.json<{ stageName: string; autoDeploy?: boolean; deploymentId?: string }>();
  if (!body.stageName) return c.json({ error: "stageName is required" }, 400);

  const client = getClient();
  const result = await client.send(
    new CreateStageCommand({
      ApiId: apiId,
      StageName: body.stageName,
      AutoDeploy: body.autoDeploy,
      DeploymentId: body.deploymentId,
    })
  );
  return c.json({ stage: result }, 201);
});

router.delete("/apis/:apiId/stages/:stageName", async (c: Context) => {
  const apiId = c.req.param("apiId");
  const stageName = c.req.param("stageName");
  const client = getClient();
  await client.send(new DeleteStageCommand({ ApiId: apiId, StageName: stageName }));
  return c.json({ deleted: true });
});

// ── Deployments ──────────────────────────────────────────

router.get("/apis/:apiId/deployments", async (c: Context) => {
  const apiId = c.req.param("apiId");
  const client = getClient();
  const result = await client.send(new GetDeploymentsCommand({ ApiId: apiId }));
  const deployments = result.Items || [];
  return c.json({ deployments, total: deployments.length });
});

router.post("/apis/:apiId/deployments", async (c: Context) => {
  const apiId = c.req.param("apiId");
  const body = await c.req.json<{ description?: string; stageName?: string }>();
  const client = getClient();
  const result = await client.send(
    new CreateDeploymentCommand({
      ApiId: apiId,
      Description: body.description,
      StageName: body.stageName,
    })
  );
  return c.json({ deployment: result }, 201);
});

router.delete("/apis/:apiId/deployments/:deploymentId", async (c: Context) => {
  const apiId = c.req.param("apiId");
  const deploymentId = c.req.param("deploymentId");
  const client = getClient();
  await client.send(new DeleteDeploymentCommand({ ApiId: apiId, DeploymentId: deploymentId }));
  return c.json({ deleted: true });
});

export default router;
