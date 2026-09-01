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
  GetAuthorizersCommand,
  GetAuthorizerCommand,
  CreateAuthorizerCommand,
  UpdateAuthorizerCommand,
  DeleteAuthorizerCommand,
  GetModelsCommand,
  GetModelCommand,
  CreateModelCommand,
  UpdateModelCommand,
  DeleteModelCommand,
  GetIntegrationResponsesCommand,
  GetIntegrationResponseCommand,
  CreateIntegrationResponseCommand,
  UpdateIntegrationResponseCommand,
  DeleteIntegrationResponseCommand,
  GetRouteResponsesCommand,
  GetRouteResponseCommand,
  CreateRouteResponseCommand,
  UpdateRouteResponseCommand,
  DeleteRouteResponseCommand,
  GetRouteCommand,
  UpdateRouteCommand,
  GetIntegrationCommand,
  UpdateIntegrationCommand,
  GetDeploymentCommand,
  UpdateDeploymentCommand,
  GetStageCommand,
  UpdateStageCommand,
  GetTagsCommand,
  TagResourceCommand,
  UntagResourceCommand,
} from "@aws-sdk/client-apigatewayv2";

const router = new Hono();
const getClient = () => create(ApiGatewayV2Client);

// ── APIs ─────────────────────────────────────────────────

router.get("/apis", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new GetApisCommand({}));
  const apis = result.Items || [];
/* istanbul ignore next */
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

// ── WebSocket (route resolution display) ─────────────────
// NOTE: Live per-connection management (@connections GetConnection/
// PostToConnection/DeleteConnection) requires ApiGatewayManagementApi with a
// live per-API callback endpoint, which is not wired in this codebase. This
// view focuses on WebSocket API discovery + route -> integration resolution.

router.get("/websocket-apis", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new GetApisCommand({}));
  const apis = (result.Items || [])
    .filter((a: any) => a.ProtocolType === "WEBSOCKET")
    .map((a: any) => ({
      ApiId: a.ApiId,
      Name: a.Name,
      ProtocolType: a.ProtocolType,
      ApiEndpoint: a.ApiEndpoint,
      RouteSelectionExpression: a.RouteSelectionExpression,
      CreatedDate: a.CreatedDate,
    }));
  return c.json({ apis, total: apis.length });
});

router.get("/apis/:apiId/websocket-routes", async (c: Context) => {
  const apiId = c.req.param("apiId");
  const client = getClient();
  const [routesResult, integrationsResult] = await Promise.all([
    client.send(new GetRoutesCommand({ ApiId: apiId })),
    client.send(new GetIntegrationsCommand({ ApiId: apiId })),
  ]);
  const integrationMap = new Map<string, any>();
  for (const i of integrationsResult.Items || []) {
    if (i.IntegrationId) integrationMap.set(i.IntegrationId, i);
  }
  const wellKnown = new Set(["$connect", "$disconnect", "$default"]);
  const routes = (routesResult.Items || []).map((r: any) => {
    const target = r.Target || null;
    const match = target ? /^integrations\/(.+)$/.exec(target) : null;
    const integrationId = match ? match[1] : null;
    const found = integrationId ? integrationMap.get(integrationId) : undefined;
    const integration = found
      ? {
          IntegrationId: found.IntegrationId,
          IntegrationType: found.IntegrationType,
          IntegrationUri: found.IntegrationUri,
          IntegrationMethod: found.IntegrationMethod,
        }
      : null;
    return {
      RouteId: r.RouteId,
      RouteKey: r.RouteKey,
      target,
      integrationId,
      integration,
      isWellKnown: wellKnown.has(r.RouteKey),
      authorizationType: r.AuthorizationType,
    };
  });
  return c.json({ routes, total: routes.length });
});

// ── G.96: authorizers, models, sub-resources, tags ──────

// Authorizers

router.get("/apis/:apiId/authorizers", async (c: Context) => {
  const apiId = c.req.param("apiId");
  const client = getClient();
  const result = await client.send(new GetAuthorizersCommand({ ApiId: apiId }));
  const authorizers = result.Items || [];
  return c.json({ authorizers, total: authorizers.length });
});

router.get("/apis/:apiId/authorizers/:authorizerId", async (c: Context) => {
  const apiId = c.req.param("apiId");
  const authorizerId = c.req.param("authorizerId");
  const client = getClient();
  const result = await client.send(new GetAuthorizerCommand({ ApiId: apiId, AuthorizerId: authorizerId }));
  return c.json({ authorizer: result });
});

router.post("/apis/:apiId/authorizers", async (c: Context) => {
  const apiId = c.req.param("apiId");
  const body = await c.req.json<any>();
  if (!body.name) return c.json({ error: "name is required" }, 400);
  if (!body.authorizerType) return c.json({ error: "authorizerType is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CreateAuthorizerCommand({
      ApiId: apiId,
      Name: body.name,
      AuthorizerType: body.authorizerType,
      IdentitySource: body.identitySource || undefined,
      AuthorizerUri: body.authorizerUri || undefined,
      AuthorizerCredentialsArn: body.authorizerCredentialsArn || undefined,
      AuthorizerPayloadFormatVersion: body.authorizerPayloadFormatVersion || undefined,
      EnableSimpleResponses: body.enableSimpleResponses ?? undefined,
    })
  );
  return c.json({ authorizer: result }, 201);
});

router.put("/apis/:apiId/authorizers/:authorizerId", async (c: Context) => {
  const apiId = c.req.param("apiId");
  const authorizerId = c.req.param("authorizerId");
  const body = await c.req.json<any>();
  if (!body.name || !body.authorizerType) return c.json({ error: "name and authorizerType are required" }, 400);
  const client = getClient();
  const result = await client.send(
    new UpdateAuthorizerCommand({
      ApiId: apiId,
      AuthorizerId: authorizerId,
      Name: body.name,
      AuthorizerType: body.authorizerType,
      IdentitySource: body.identitySource || undefined,
      AuthorizerUri: body.authorizerUri || undefined,
      AuthorizerCredentialsArn: body.authorizerCredentialsArn || undefined,
      AuthorizerPayloadFormatVersion: body.authorizerPayloadFormatVersion || undefined,
      EnableSimpleResponses: body.enableSimpleResponses ?? undefined,
    })
  );
  return c.json({ authorizer: result });
});

router.delete("/apis/:apiId/authorizers/:authorizerId", async (c: Context) => {
  const apiId = c.req.param("apiId");
  const authorizerId = c.req.param("authorizerId");
  const client = getClient();
  await client.send(new DeleteAuthorizerCommand({ ApiId: apiId, AuthorizerId: authorizerId }));
  return c.json({ deleted: true });
});

// Models

router.get("/apis/:apiId/models", async (c: Context) => {
  const apiId = c.req.param("apiId");
  const client = getClient();
  const result = await client.send(new GetModelsCommand({ ApiId: apiId }));
  const models = result.Items || [];
  return c.json({ models, total: models.length });
});

router.get("/apis/:apiId/models/:modelId", async (c: Context) => {
  const apiId = c.req.param("apiId");
  const modelId = c.req.param("modelId");
  const client = getClient();
  const result = await client.send(new GetModelCommand({ ApiId: apiId, ModelId: modelId }));
  return c.json({ model: result });
});

router.post("/apis/:apiId/models", async (c: Context) => {
  const apiId = c.req.param("apiId");
  const body = await c.req.json<any>();
  if (!body.name) return c.json({ error: "name is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CreateModelCommand({
      ApiId: apiId,
      Name: body.name,
      ContentType: body.contentType || undefined,
      Description: body.description || undefined,
      Schema: body.schema || undefined,
    })
  );
  return c.json({ model: result }, 201);
});

router.put("/apis/:apiId/models/:modelId", async (c: Context) => {
  const apiId = c.req.param("apiId");
  const modelId = c.req.param("modelId");
  const body = await c.req.json<any>();
  if (!body.name) return c.json({ error: "name is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new UpdateModelCommand({
      ApiId: apiId,
      ModelId: modelId,
      Name: body.name,
      ContentType: body.contentType || undefined,
      Description: body.description || undefined,
      Schema: body.schema || undefined,
    })
  );
  return c.json({ model: result });
});

router.delete("/apis/:apiId/models/:modelId", async (c: Context) => {
  const apiId = c.req.param("apiId");
  const modelId = c.req.param("modelId");
  const client = getClient();
  await client.send(new DeleteModelCommand({ ApiId: apiId, ModelId: modelId }));
  return c.json({ deleted: true });
});

// Integration responses

router.get("/apis/:apiId/integrations/:integrationId/integrationresponses", async (c: Context) => {
  const apiId = c.req.param("apiId");
  const integrationId = c.req.param("integrationId");
  const client = getClient();
  const result = await client.send(new GetIntegrationResponsesCommand({ ApiId: apiId, IntegrationId: integrationId }));
  const items = result.Items || [];
  return c.json({ integrationResponses: items, total: items.length });
});

router.get("/apis/:apiId/integrations/:integrationId/integrationresponses/:responseId", async (c: Context) => {
  const apiId = c.req.param("apiId");
  const integrationId = c.req.param("integrationId");
  const responseId = c.req.param("responseId");
  const client = getClient();
  const result = await client.send(
    new GetIntegrationResponseCommand({ ApiId: apiId, IntegrationId: integrationId, IntegrationResponseId: responseId })
  );
  return c.json({ integrationResponse: result });
});

router.post("/apis/:apiId/integrations/:integrationId/integrationresponses", async (c: Context) => {
  const apiId = c.req.param("apiId");
  const integrationId = c.req.param("integrationId");
  const body = await c.req.json<any>();
  if (!body.integrationResponseKey) return c.json({ error: "integrationResponseKey is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CreateIntegrationResponseCommand({
      ApiId: apiId,
      IntegrationId: integrationId,
      IntegrationResponseKey: body.integrationResponseKey,
      ContentHandlingStrategy: body.contentHandlingStrategy || undefined,
      ResponseTemplates: body.responseTemplates || undefined,
      ResponseParameters: body.responseParameters || undefined,
      TemplateSelectionExpression: body.templateSelectionExpression || undefined,
    })
  );
  return c.json({ integrationResponse: result }, 201);
});

router.put("/apis/:apiId/integrations/:integrationId/integrationresponses/:responseId", async (c: Context) => {
  const apiId = c.req.param("apiId");
  const integrationId = c.req.param("integrationId");
  const responseId = c.req.param("responseId");
  const body = await c.req.json<any>();
  if (!body.integrationResponseKey) return c.json({ error: "integrationResponseKey is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new UpdateIntegrationResponseCommand({
      ApiId: apiId,
      IntegrationId: integrationId,
      IntegrationResponseId: responseId,
      IntegrationResponseKey: body.integrationResponseKey,
      ContentHandlingStrategy: body.contentHandlingStrategy || undefined,
      ResponseTemplates: body.responseTemplates || undefined,
      ResponseParameters: body.responseParameters || undefined,
      TemplateSelectionExpression: body.templateSelectionExpression || undefined,
    })
  );
  return c.json({ integrationResponse: result });
});

router.delete("/apis/:apiId/integrations/:integrationId/integrationresponses/:responseId", async (c: Context) => {
  const apiId = c.req.param("apiId");
  const integrationId = c.req.param("integrationId");
  const responseId = c.req.param("responseId");
  const client = getClient();
  await client.send(
    new DeleteIntegrationResponseCommand({ ApiId: apiId, IntegrationId: integrationId, IntegrationResponseId: responseId })
  );
  return c.json({ deleted: true });
});

// Route responses

router.get("/apis/:apiId/routes/:routeId/routeresponses", async (c: Context) => {
  const apiId = c.req.param("apiId");
  const routeId = c.req.param("routeId");
  const client = getClient();
  const result = await client.send(new GetRouteResponsesCommand({ ApiId: apiId, RouteId: routeId }));
  const items = result.Items || [];
  return c.json({ routeResponses: items, total: items.length });
});

router.get("/apis/:apiId/routes/:routeId/routeresponses/:responseId", async (c: Context) => {
  const apiId = c.req.param("apiId");
  const routeId = c.req.param("routeId");
  const responseId = c.req.param("responseId");
  const client = getClient();
  const result = await client.send(
    new GetRouteResponseCommand({ ApiId: apiId, RouteId: routeId, RouteResponseId: responseId })
  );
  return c.json({ routeResponse: result });
});

router.post("/apis/:apiId/routes/:routeId/routeresponses", async (c: Context) => {
  const apiId = c.req.param("apiId");
  const routeId = c.req.param("routeId");
  const body = await c.req.json<any>();
  if (!body.routeResponseKey) return c.json({ error: "routeResponseKey is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CreateRouteResponseCommand({
      ApiId: apiId,
      RouteId: routeId,
      RouteResponseKey: body.routeResponseKey,
      ModelSelectionExpression: body.modelSelectionExpression || undefined,
      ResponseModels: body.responseModels || undefined,
      ResponseParameters: body.responseParameters || undefined,
    })
  );
  return c.json({ routeResponse: result }, 201);
});

router.put("/apis/:apiId/routes/:routeId/routeresponses/:responseId", async (c: Context) => {
  const apiId = c.req.param("apiId");
  const routeId = c.req.param("routeId");
  const responseId = c.req.param("responseId");
  const body = await c.req.json<any>();
  if (!body.routeResponseKey) return c.json({ error: "routeResponseKey is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new UpdateRouteResponseCommand({
      ApiId: apiId,
      RouteId: routeId,
      RouteResponseId: responseId,
      RouteResponseKey: body.routeResponseKey,
      ModelSelectionExpression: body.modelSelectionExpression || undefined,
      ResponseModels: body.responseModels || undefined,
      ResponseParameters: body.responseParameters || undefined,
    })
  );
  return c.json({ routeResponse: result });
});

router.delete("/apis/:apiId/routes/:routeId/routeresponses/:responseId", async (c: Context) => {
  const apiId = c.req.param("apiId");
  const routeId = c.req.param("routeId");
  const responseId = c.req.param("responseId");
  const client = getClient();
  await client.send(
    new DeleteRouteResponseCommand({ ApiId: apiId, RouteId: routeId, RouteResponseId: responseId })
  );
  return c.json({ deleted: true });
});

// Single get / update for routes, integrations, stages, deployments

router.get("/apis/:apiId/routes/:routeId", async (c: Context) => {
  const apiId = c.req.param("apiId");
  const routeId = c.req.param("routeId");
  const client = getClient();
  const result = await client.send(new GetRouteCommand({ ApiId: apiId, RouteId: routeId }));
  return c.json({ route: result });
});

router.put("/apis/:apiId/routes/:routeId", async (c: Context) => {
  const apiId = c.req.param("apiId");
  const routeId = c.req.param("routeId");
  const body = await c.req.json<any>();
  if (!body.routeKey) return c.json({ error: "routeKey is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new UpdateRouteCommand({
      ApiId: apiId,
      RouteId: routeId,
      RouteKey: body.routeKey,
      AuthorizationType: body.authorizationType || undefined,
      Target: body.target || undefined,
      AuthorizerId: body.authorizerId || undefined,
    })
  );
  return c.json({ route: result });
});

router.get("/apis/:apiId/integrations/:integrationId", async (c: Context) => {
  const apiId = c.req.param("apiId");
  const integrationId = c.req.param("integrationId");
  const client = getClient();
  const result = await client.send(new GetIntegrationCommand({ ApiId: apiId, IntegrationId: integrationId }));
  return c.json({ integration: result });
});

router.put("/apis/:apiId/integrations/:integrationId", async (c: Context) => {
  const apiId = c.req.param("apiId");
  const integrationId = c.req.param("integrationId");
  const body = await c.req.json<any>();
  if (!body.integrationType) return c.json({ error: "integrationType is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new UpdateIntegrationCommand({
      ApiId: apiId,
      IntegrationId: integrationId,
      IntegrationType: body.integrationType,
      IntegrationUri: body.integrationUri || undefined,
      IntegrationMethod: body.integrationMethod || undefined,
      PayloadFormatVersion: body.payloadFormatVersion || undefined,
      ConnectionType: body.connectionType || undefined,
    })
  );
  return c.json({ integration: result });
});

router.get("/apis/:apiId/deployments/:deploymentId", async (c: Context) => {
  const apiId = c.req.param("apiId");
  const deploymentId = c.req.param("deploymentId");
  const client = getClient();
  const result = await client.send(new GetDeploymentCommand({ ApiId: apiId, DeploymentId: deploymentId }));
  return c.json({ deployment: result });
});

router.put("/apis/:apiId/deployments/:deploymentId", async (c: Context) => {
  const apiId = c.req.param("apiId");
  const deploymentId = c.req.param("deploymentId");
  const body = await c.req.json<{ description?: string }>();
  const client = getClient();
  const result = await client.send(
    new UpdateDeploymentCommand({ ApiId: apiId, DeploymentId: deploymentId, Description: body.description })
  );
  return c.json({ deployment: result });
});

router.get("/apis/:apiId/stages/:stageName", async (c: Context) => {
  const apiId = c.req.param("apiId");
  const stageName = c.req.param("stageName");
  const client = getClient();
  const result = await client.send(new GetStageCommand({ ApiId: apiId, StageName: stageName }));
  return c.json({ stage: result });
});

router.put("/apis/:apiId/stages/:stageName", async (c: Context) => {
  const apiId = c.req.param("apiId");
  const stageName = c.req.param("stageName");
  const body = await c.req.json<any>();
  const client = getClient();
  const result = await client.send(
    new UpdateStageCommand({
      ApiId: apiId,
      StageName: stageName,
      AutoDeploy: body.autoDeploy ?? undefined,
      DeploymentId: body.deploymentId || undefined,
      Description: body.description || undefined,
    })
  );
  return c.json({ stage: result });
});

// Tags

router.get("/apis/:apiId/tags", async (c: Context) => {
  const apiId = c.req.param("apiId");
  const client = getClient();
  const result = await client.send(new GetTagsCommand({ ResourceArn: apiId }));
  return c.json({ tags: result.Tags || {} });
});

router.put("/apis/:apiId/tags", async (c: Context) => {
  const apiId = c.req.param("apiId");
  const body = await c.req.json<{ tags?: Record<string, string> }>();
  if (!body.tags) return c.json({ error: "tags is required" }, 400);
  const client = getClient();
  await client.send(new TagResourceCommand({ ResourceArn: apiId, Tags: body.tags }));
  return c.json({ tagged: true });
});

router.delete("/apis/:apiId/tags", async (c: Context) => {
  const apiId = c.req.param("apiId");
  const body = await c.req.json<{ tagKeys?: string[] }>();
  if (!body.tagKeys?.length) return c.json({ error: "tagKeys is required" }, 400);
  const client = getClient();
  await client.send(new UntagResourceCommand({ ResourceArn: apiId, TagKeys: body.tagKeys }));
  return c.json({ untagged: true });
});

export default router;
