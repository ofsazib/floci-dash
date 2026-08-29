import { Hono } from "hono";
import type { Context } from "hono";
import { getAwsConfig } from "../../clients/aws";
import {
  APIGatewayClient,
  GetRestApisCommand,
  GetRestApiCommand,
  CreateRestApiCommand,
  DeleteRestApiCommand,
  GetResourcesCommand,
  GetDeploymentsCommand,
  // P1 gap audit — resource tree, methods, integrations, deployments, stages,
  // authorizers, api keys, usage plans, validators, models, domains, account
  CreateResourceCommand,
  GetResourceCommand,
  DeleteResourceCommand,
  UpdateResourceCommand,
  PutMethodCommand,
  GetMethodCommand,
  DeleteMethodCommand,
  PutMethodResponseCommand,
  GetMethodResponseCommand,
  DeleteMethodResponseCommand,
  PutIntegrationCommand,
  GetIntegrationCommand,
  DeleteIntegrationCommand,
  PutIntegrationResponseCommand,
  GetIntegrationResponseCommand,
  DeleteIntegrationResponseCommand,
  CreateDeploymentCommand,
  GetDeploymentCommand,
  DeleteDeploymentCommand,
  UpdateDeploymentCommand,
  CreateStageCommand,
  GetStagesCommand,
  GetStageCommand,
  UpdateStageCommand,
  DeleteStageCommand,
  CreateAuthorizerCommand,
  GetAuthorizersCommand,
  GetAuthorizerCommand,
  UpdateAuthorizerCommand,
  DeleteAuthorizerCommand,
  CreateApiKeyCommand,
  GetApiKeysCommand,
  GetApiKeyCommand,
  UpdateApiKeyCommand,
  DeleteApiKeyCommand,
  ImportApiKeysCommand,
  CreateUsagePlanCommand,
  GetUsagePlansCommand,
  GetUsagePlanCommand,
  UpdateUsagePlanCommand,
  DeleteUsagePlanCommand,
  CreateUsagePlanKeyCommand,
  GetUsagePlanKeysCommand,
  DeleteUsagePlanKeyCommand,
  GetUsageCommand,
  CreateRequestValidatorCommand,
  GetRequestValidatorsCommand,
  GetRequestValidatorCommand,
  UpdateRequestValidatorCommand,
  DeleteRequestValidatorCommand,
  CreateModelCommand,
  GetModelsCommand,
  GetModelCommand,
  UpdateModelCommand,
  DeleteModelCommand,
  CreateDomainNameCommand,
  GetDomainNamesCommand,
  GetDomainNameCommand,
  UpdateDomainNameCommand,
  DeleteDomainNameCommand,
  CreateBasePathMappingCommand,
  GetBasePathMappingsCommand,
  DeleteBasePathMappingCommand,
  GetAccountCommand,
  UpdateAccountCommand,
  ImportRestApiCommand,
  PutRestApiCommand,
  TagResourceCommand,
  UntagResourceCommand,
  GetTagsCommand,
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
  const client = getClient();
  await client.send(new DeleteRestApiCommand({ restApiId: apiId }));
  return c.json({ deleted: true });
});

// ── Resources ────────────────────────────────────────────

router.get("/rest-apis/:apiId/resources", async (c: Context) => {
  const apiId = c.req.param("apiId");
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
  const client = getClient();
  const result = await client.send(
    new GetDeploymentsCommand({ restApiId: apiId })
  );
  return c.json({
    deployments: result.items || [],
    total: result.items?.length || 0,
  });
});


// ────────────────────────────────────────────────────────────────
//  P1 gap audit — resource tree + methods + integrations
// ────────────────────────────────────────────────────────────────

router.post("/rest-apis/:apiId/resources", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  const body = await c.req.json<{ parentId: string; pathPart: string }>();
  if (!body.parentId || !body.pathPart) return c.json({ error: "parentId and pathPart are required" }, 400);
  const result = await getClient().send(new CreateResourceCommand({
    restApiId: apiId, parentId: body.parentId, pathPart: body.pathPart,
  }));
  return c.json({ id: result.id, path: result.path, parentId: result.parentId }, 201);
});

router.get("/rest-apis/:apiId/resources/:resourceId", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  const result = await getClient().send(new GetResourceCommand({
    restApiId: apiId, resourceId: c.req.param("resourceId")!,
  }));
  return c.json({ resource: result });
});

router.delete("/rest-apis/:apiId/resources/:resourceId", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  await getClient().send(new DeleteResourceCommand({
    restApiId: apiId, resourceId: c.req.param("resourceId")!,
  }));
  return c.json({ deleted: true });
});

router.put("/rest-apis/:apiId/resources/:resourceId", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  const body = await c.req.json<{ pathPart?: string }>();
  const result = await getClient().send(new UpdateResourceCommand({
    restApiId: apiId, resourceId: c.req.param("resourceId")!,
    patchOperations: body.pathPart
      ? [{ op: "replace", path: "/pathPart", value: body.pathPart }]
      : [],
  }));
  return c.json({ resource: result });
});

// ─── Methods ────────────────────────────────────────────────────

router.put("/rest-apis/:apiId/resources/:resourceId/methods/:httpMethod", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  const resourceId = c.req.param("resourceId")!;
  const httpMethod = c.req.param("httpMethod")!;
  const body = await c.req.json<any>();
  const result = await getClient().send(new PutMethodCommand({
    restApiId: apiId, resourceId, httpMethod,
    authorizationType: body.authorizationType || "NONE",
    authorizerId: body.authorizerId,
    apiKeyRequired: body.apiKeyRequired,
    requestParameters: body.requestParameters,
    requestModels: body.requestModels,
    requestValidatorId: body.requestValidatorId,
  }));
  return c.json({ method: result });
});

router.get("/rest-apis/:apiId/resources/:resourceId/methods/:httpMethod", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  const result = await getClient().send(new GetMethodCommand({
    restApiId: apiId, resourceId: c.req.param("resourceId")!, httpMethod: c.req.param("httpMethod")!,
  }));
  return c.json({ method: result });
});

router.delete("/rest-apis/:apiId/resources/:resourceId/methods/:httpMethod", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  await getClient().send(new DeleteMethodCommand({
    restApiId: apiId, resourceId: c.req.param("resourceId")!, httpMethod: c.req.param("httpMethod")!,
  }));
  return c.json({ deleted: true });
});

router.put("/rest-apis/:apiId/resources/:resourceId/methods/:httpMethod/responses/:statusCode", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  const body = await c.req.json<any>();
  const result = await getClient().send(new PutMethodResponseCommand({
    restApiId: apiId, resourceId: c.req.param("resourceId")!,
    httpMethod: c.req.param("httpMethod")!, statusCode: c.req.param("statusCode")!,
    responseParameters: body.responseParameters,
    responseModels: body.responseModels,
  }));
  return c.json({ methodResponse: result });
});

router.get("/rest-apis/:apiId/resources/:resourceId/methods/:httpMethod/responses/:statusCode", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  const result = await getClient().send(new GetMethodResponseCommand({
    restApiId: apiId, resourceId: c.req.param("resourceId")!,
    httpMethod: c.req.param("httpMethod")!, statusCode: c.req.param("statusCode")!,
  }));
  return c.json({ methodResponse: result });
});

router.delete("/rest-apis/:apiId/resources/:resourceId/methods/:httpMethod/responses/:statusCode", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  await getClient().send(new DeleteMethodResponseCommand({
    restApiId: apiId, resourceId: c.req.param("resourceId")!,
    httpMethod: c.req.param("httpMethod")!, statusCode: c.req.param("statusCode")!,
  }));
  return c.json({ deleted: true });
});

// ─── Integrations ───────────────────────────────────────────────

router.put("/rest-apis/:apiId/resources/:resourceId/methods/:httpMethod/integration", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  const body = await c.req.json<any>();
  if (!body.type) return c.json({ error: "type is required" }, 400);
  const result = await getClient().send(new PutIntegrationCommand({
    restApiId: apiId, resourceId: c.req.param("resourceId")!,
    httpMethod: c.req.param("httpMethod")!,
    type: body.type as any,
    integrationHttpMethod: body.integrationHttpMethod,
    uri: body.uri,
    credentials: body.credentials,
    requestParameters: body.requestParameters,
    requestTemplates: body.requestTemplates,
    passthroughBehavior: body.passthroughBehavior,
    timeoutInMillis: body.timeoutInMillis,
  }));
  return c.json({ integration: result });
});

router.get("/rest-apis/:apiId/resources/:resourceId/methods/:httpMethod/integration", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  const result = await getClient().send(new GetIntegrationCommand({
    restApiId: apiId, resourceId: c.req.param("resourceId")!, httpMethod: c.req.param("httpMethod")!,
  }));
  return c.json({ integration: result });
});

router.delete("/rest-apis/:apiId/resources/:resourceId/methods/:httpMethod/integration", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  await getClient().send(new DeleteIntegrationCommand({
    restApiId: apiId, resourceId: c.req.param("resourceId")!, httpMethod: c.req.param("httpMethod")!,
  }));
  return c.json({ deleted: true });
});

router.put("/rest-apis/:apiId/resources/:resourceId/methods/:httpMethod/integration/responses/:statusCode", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  const body = await c.req.json<any>();
  const result = await getClient().send(new PutIntegrationResponseCommand({
    restApiId: apiId, resourceId: c.req.param("resourceId")!,
    httpMethod: c.req.param("httpMethod")!, statusCode: c.req.param("statusCode")!,
    selectionPattern: body.selectionPattern,
    responseTemplates: body.responseTemplates,
    responseParameters: body.responseParameters,
  }));
  return c.json({ integrationResponse: result });
});

router.get("/rest-apis/:apiId/resources/:resourceId/methods/:httpMethod/integration/responses/:statusCode", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  const result = await getClient().send(new GetIntegrationResponseCommand({
    restApiId: apiId, resourceId: c.req.param("resourceId")!,
    httpMethod: c.req.param("httpMethod")!, statusCode: c.req.param("statusCode")!,
  }));
  return c.json({ integrationResponse: result });
});

router.delete("/rest-apis/:apiId/resources/:resourceId/methods/:httpMethod/integration/responses/:statusCode", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  await getClient().send(new DeleteIntegrationResponseCommand({
    restApiId: apiId, resourceId: c.req.param("resourceId")!,
    httpMethod: c.req.param("httpMethod")!, statusCode: c.req.param("statusCode")!,
  }));
  return c.json({ deleted: true });
});

// ─── Deployments ────────────────────────────────────────────────

router.post("/rest-apis/:apiId/deployments", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  const body = await c.req.json<{ stageName?: string; description?: string }>();
  const result = await getClient().send(new CreateDeploymentCommand({
    restApiId: apiId, stageName: body.stageName, description: body.description,
  }));
  return c.json({ id: result.id, createdDate: result.createdDate }, 201);
});

router.get("/rest-apis/:apiId/deployments/:deploymentId", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  const result = await getClient().send(new GetDeploymentCommand({
    restApiId: apiId, deploymentId: c.req.param("deploymentId")!,
  }));
  return c.json({ deployment: result });
});

router.delete("/rest-apis/:apiId/deployments/:deploymentId", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  await getClient().send(new DeleteDeploymentCommand({
    restApiId: apiId, deploymentId: c.req.param("deploymentId")!,
  }));
  return c.json({ deleted: true });
});

router.put("/rest-apis/:apiId/deployments/:deploymentId", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  const body = await c.req.json<{ description?: string }>();
  const result = await getClient().send(new UpdateDeploymentCommand({
    restApiId: apiId, deploymentId: c.req.param("deploymentId")!,
    patchOperations: body.description ? [{ op: "replace", path: "/description", value: body.description }] : [],
  }));
  return c.json({ deployment: result });
});

// ─── Stages ─────────────────────────────────────────────────────

router.post("/rest-apis/:apiId/stages", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  const body = await c.req.json<{ stageName: string; deploymentId?: string; description?: string }>();
  if (!body.stageName) return c.json({ error: "stageName is required" }, 400);
  const result = await getClient().send(new CreateStageCommand({
    restApiId: apiId, stageName: body.stageName,
    deploymentId: body.deploymentId, description: body.description,
  }));
  return c.json({ stage: result }, 201);
});

router.get("/rest-apis/:apiId/stages", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  const result = await getClient().send(new GetStagesCommand({ restApiId: apiId }));
  return c.json({ stages: result.item || [], total: (result.item || []).length });
});

router.get("/rest-apis/:apiId/stages/:stageName", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  const result = await getClient().send(new GetStageCommand({
    restApiId: apiId, stageName: c.req.param("stageName")!,
  }));
  return c.json({ stage: result });
});

router.put("/rest-apis/:apiId/stages/:stageName", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  const body = await c.req.json<{ description?: string; patchOperations?: any[] }>();
  let patchOperations = body.patchOperations;
  if (!patchOperations && body.description) {
    patchOperations = [{ op: "replace", path: "/description", value: body.description }];
  }
  if (!patchOperations) patchOperations = [];
  const result = await getClient().send(new UpdateStageCommand({
    restApiId: apiId, stageName: c.req.param("stageName")!,
    patchOperations,
  }));
  return c.json({ stage: result });
});

router.delete("/rest-apis/:apiId/stages/:stageName", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  await getClient().send(new DeleteStageCommand({
    restApiId: apiId, stageName: c.req.param("stageName")!,
  }));
  return c.json({ deleted: true });
});

// ─── Authorizers ────────────────────────────────────────────────

router.post("/rest-apis/:apiId/authorizers", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  const body = await c.req.json<any>();
  if (!body.name) return c.json({ error: "name is required" }, 400);
  const result = await getClient().send(new CreateAuthorizerCommand({
    restApiId: apiId, name: body.name, type: body.type as any,
    providerARNs: body.providerARNs, authType: body.authType,
    authorizerUri: body.authorizerUri, authorizerCredentials: body.authorizerCredentials,
    identitySource: body.identitySource, identityValidationExpression: body.identityValidationExpression,
    authorizerResultTtlInSeconds: body.authorizerResultTtlInSeconds,
  }));
  return c.json({ authorizer: result }, 201);
});

router.get("/rest-apis/:apiId/authorizers", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  const result = await getClient().send(new GetAuthorizersCommand({ restApiId: apiId }));
  return c.json({ authorizers: result.items || [], total: (result.items || []).length });
});

router.get("/rest-apis/:apiId/authorizers/:authorizerId", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  const result = await getClient().send(new GetAuthorizerCommand({
    restApiId: apiId, authorizerId: c.req.param("authorizerId")!,
  }));
  return c.json({ authorizer: result });
});

router.put("/rest-apis/:apiId/authorizers/:authorizerId", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  const body = await c.req.json<{ patchOperations?: any[] }>();
  const result = await getClient().send(new UpdateAuthorizerCommand({
    restApiId: apiId, authorizerId: c.req.param("authorizerId")!,
    patchOperations: body.patchOperations ?? [],
  }));
  return c.json({ authorizer: result });
});

router.delete("/rest-apis/:apiId/authorizers/:authorizerId", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  await getClient().send(new DeleteAuthorizerCommand({
    restApiId: apiId, authorizerId: c.req.param("authorizerId")!,
  }));
  return c.json({ deleted: true });
});

// ─── API keys ───────────────────────────────────────────────────

router.post("/api-keys", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.name) return c.json({ error: "name is required" }, 400);
  const result = await getClient().send(new CreateApiKeyCommand({
    name: body.name, value: body.value, description: body.description, enabled: body.enabled ?? true,
  }));
  return c.json({ apiKey: result }, 201);
});

router.get("/api-keys", async (c: Context) => {
  const result = await getClient().send(new GetApiKeysCommand({}));
  return c.json({ apiKeys: result.items || [], total: (result.items || []).length });
});

router.get("/api-keys/:keyId", async (c: Context) => {
  const result = await getClient().send(new GetApiKeyCommand({ apiKey: c.req.param("keyId")!, includeValue: true }));
  return c.json({ apiKey: result });
});

router.put("/api-keys/:keyId", async (c: Context) => {
  const body = await c.req.json<{ patchOperations?: any[] }>();
  const result = await getClient().send(new UpdateApiKeyCommand({
    apiKey: c.req.param("keyId")!, patchOperations: body.patchOperations ?? [],
  }));
  return c.json({ apiKey: result });
});

router.delete("/api-keys/:keyId", async (c: Context) => {
  await getClient().send(new DeleteApiKeyCommand({ apiKey: c.req.param("keyId")! }));
  return c.json({ deleted: true });
});

router.post("/api-keys/import", async (c: Context) => {
  const body = await c.req.json<{ csv: string; format?: string }>();
  if (!body.csv) return c.json({ error: "csv is required" }, 400);
  const result = await getClient().send(new ImportApiKeysCommand({
    body: body.csv, format: (body.format as any) || "csv",
  }));
  let ids: string[];
  if (result.ids) {
    ids = result.ids;
  } else {
    ids = [];
  }
  return c.json({ ids, imported: ids.length }, 201);
});

// ─── Usage plans ────────────────────────────────────────────────

router.post("/usage-plans", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.name) return c.json({ error: "name is required" }, 400);
  const result = await getClient().send(new CreateUsagePlanCommand({
    name: body.name, description: body.description,
    apiStages: body.apiStages, throttle: body.throttle, quota: body.quota,
  }));
  return c.json({ usagePlan: result }, 201);
});

router.get("/usage-plans", async (c: Context) => {
  const result = await getClient().send(new GetUsagePlansCommand({}));
  return c.json({ usagePlans: result.items || [], total: (result.items || []).length });
});

router.get("/usage-plans/:planId", async (c: Context) => {
  const result = await getClient().send(new GetUsagePlanCommand({ usagePlanId: c.req.param("planId")! }));
  return c.json({ usagePlan: result });
});

router.put("/usage-plans/:planId", async (c: Context) => {
  const body = await c.req.json<{ patchOperations?: any[] }>();
  const result = await getClient().send(new UpdateUsagePlanCommand({
    usagePlanId: c.req.param("planId")!, patchOperations: body.patchOperations ?? [],
  }));
  return c.json({ usagePlan: result });
});

router.delete("/usage-plans/:planId", async (c: Context) => {
  await getClient().send(new DeleteUsagePlanCommand({ usagePlanId: c.req.param("planId")! }));
  return c.json({ deleted: true });
});

router.post("/usage-plans/:planId/keys", async (c: Context) => {
  const body = await c.req.json<{ keyId: string }>();
  if (!body.keyId) return c.json({ error: "keyId is required" }, 400);
  const result = await getClient().send(new CreateUsagePlanKeyCommand({
    usagePlanId: c.req.param("planId")!, keyId: body.keyId, keyType: "API_KEY",
  }));
  return c.json({ usagePlanKey: result }, 201);
});

router.get("/usage-plans/:planId/keys", async (c: Context) => {
  const result = await getClient().send(new GetUsagePlanKeysCommand({ usagePlanId: c.req.param("planId")! }));
  return c.json({ keys: result.items || [], total: (result.items || []).length });
});

router.delete("/usage-plans/:planId/keys/:keyId", async (c: Context) => {
  await getClient().send(new DeleteUsagePlanKeyCommand({
    usagePlanId: c.req.param("planId")!, keyId: c.req.param("keyId")!,
  }));
  return c.json({ deleted: true });
});

router.get("/usage-plans/:planId/usage", async (c: Context) => {
  const result = await getClient().send(new GetUsageCommand({
    usagePlanId: c.req.param("planId")!,
    keyId: c.req.query("keyId"),
    startDate: c.req.query("startDate")!,
    endDate: c.req.query("endDate")!,
  }));
  return c.json({ usage: result.items ?? {}, startDate: result.startDate, endDate: result.endDate });
});

// ─── Request validators ─────────────────────────────────────────

router.post("/rest-apis/:apiId/request-validators", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  const body = await c.req.json<{ name: string; validateRequestBody?: boolean; validateRequestParameters?: boolean }>();
  if (!body.name) return c.json({ error: "name is required" }, 400);
  const result = await getClient().send(new CreateRequestValidatorCommand({
    restApiId: apiId, name: body.name,
    validateRequestBody: body.validateRequestBody,
    validateRequestParameters: body.validateRequestParameters,
  }));
  return c.json({ requestValidator: result }, 201);
});

router.get("/rest-apis/:apiId/request-validators", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  const result = await getClient().send(new GetRequestValidatorsCommand({ restApiId: apiId }));
  return c.json({ requestValidators: result.items || [], total: (result.items || []).length });
});

router.get("/rest-apis/:apiId/request-validators/:validatorId", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  const result = await getClient().send(new GetRequestValidatorCommand({
    restApiId: apiId, requestValidatorId: c.req.param("validatorId")!,
  }));
  return c.json({ requestValidator: result });
});

router.put("/rest-apis/:apiId/request-validators/:validatorId", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  const body = await c.req.json<{ patchOperations?: any[] }>();
  const result = await getClient().send(new UpdateRequestValidatorCommand({
    restApiId: apiId, requestValidatorId: c.req.param("validatorId")!,
    patchOperations: body.patchOperations ?? [],
  }));
  return c.json({ requestValidator: result });
});

router.delete("/rest-apis/:apiId/request-validators/:validatorId", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  await getClient().send(new DeleteRequestValidatorCommand({
    restApiId: apiId, requestValidatorId: c.req.param("validatorId")!,
  }));
  return c.json({ deleted: true });
});

// ─── Models ─────────────────────────────────────────────────────

router.post("/rest-apis/:apiId/models", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  const body = await c.req.json<{ name: string; contentType: string; schema: string; description?: string }>();
  if (!body.name || !body.contentType || !body.schema) {
    return c.json({ error: "name, contentType and schema are required" }, 400);
  }
  const result = await getClient().send(new CreateModelCommand({
    restApiId: apiId, name: body.name, contentType: body.contentType,
    schema: body.schema, description: body.description,
  }));
  return c.json({ model: result }, 201);
});

router.get("/rest-apis/:apiId/models", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  const result = await getClient().send(new GetModelsCommand({ restApiId: apiId }));
  return c.json({ models: result.items || [], total: (result.items || []).length });
});

router.get("/rest-apis/:apiId/models/:modelName", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  const result = await getClient().send(new GetModelCommand({
    restApiId: apiId, modelName: c.req.param("modelName")!, flatten: false,
  }));
  return c.json({ model: result });
});

router.put("/rest-apis/:apiId/models/:modelName", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  const body = await c.req.json<{ patchOperations?: any[] }>();
  const result = await getClient().send(new UpdateModelCommand({
    restApiId: apiId, modelName: c.req.param("modelName")!,
    patchOperations: body.patchOperations ?? [],
  }));
  return c.json({ model: result });
});

router.delete("/rest-apis/:apiId/models/:modelName", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  await getClient().send(new DeleteModelCommand({
    restApiId: apiId, modelName: c.req.param("modelName")!,
  }));
  return c.json({ deleted: true });
});

// ─── Domain names + base path mappings ──────────────────────────

router.post("/domain-names", async (c: Context) => {
  const body = await c.req.json<{ domainName: string }>();
  if (!body.domainName) return c.json({ error: "domainName is required" }, 400);
  const result = await getClient().send(new CreateDomainNameCommand({ domainName: body.domainName }));
  return c.json({ domainName: result }, 201);
});

router.get("/domain-names", async (c: Context) => {
  const result = await getClient().send(new GetDomainNamesCommand({}));
  return c.json({ domainNames: result.items || [], total: (result.items || []).length });
});

router.get("/domain-names/:domainName", async (c: Context) => {
  const result = await getClient().send(new GetDomainNameCommand({ domainName: c.req.param("domainName")! }));
  return c.json({ domainName: result });
});

router.put("/domain-names/:domainName", async (c: Context) => {
  const body = await c.req.json<{ patchOperations?: any[] }>();
  const result = await getClient().send(new UpdateDomainNameCommand({
    domainName: c.req.param("domainName")!, patchOperations: body.patchOperations ?? [],
  }));
  return c.json({ domainName: result });
});

router.delete("/domain-names/:domainName", async (c: Context) => {
  await getClient().send(new DeleteDomainNameCommand({ domainName: c.req.param("domainName")! }));
  return c.json({ deleted: true });
});

router.post("/domain-names/:domainName/base-path-mappings", async (c: Context) => {
  const domainName = c.req.param("domainName")!;
  const body = await c.req.json<{ restApiId: string; stage?: string; basePath?: string }>();
  if (!body.restApiId) return c.json({ error: "restApiId is required" }, 400);
  const result = await getClient().send(new CreateBasePathMappingCommand({
    domainName, restApiId: body.restApiId, stage: body.stage, basePath: body.basePath,
  }));
  return c.json({ basePathMapping: result }, 201);
});

router.get("/domain-names/:domainName/base-path-mappings", async (c: Context) => {
  const domainName = c.req.param("domainName")!;
  const result = await getClient().send(new GetBasePathMappingsCommand({ domainName }));
  return c.json({ basePathMappings: result.items || [], total: (result.items || []).length });
});

router.delete("/domain-names/:domainName/base-path-mappings/:basePath", async (c: Context) => {
  const domainName = c.req.param("domainName")!;
  const basePath = c.req.param("basePath")!;
  await getClient().send(new DeleteBasePathMappingCommand({
    domainName, basePath: basePath === "(none)" ? "(none)" : basePath,
  }));
  return c.json({ deleted: true });
});

// ─── Account, import/export, tags ───────────────────────────────

router.get("/account", async (c: Context) => {
  const result = await getClient().send(new GetAccountCommand({}));
  return c.json({ account: result });
});

router.put("/account", async (c: Context) => {
  const body = await c.req.json<{ patchOperations?: any[] }>();
  const result = await getClient().send(new UpdateAccountCommand({
    patchOperations: body.patchOperations ?? [],
  }));
  return c.json({ account: result });
});

router.post("/rest-apis/import", async (c: Context) => {
  const body = await c.req.json<{ spec: unknown; failOnWarnings?: boolean }>();
  if (!body.spec) return c.json({ error: "spec (OpenAPI document) is required" }, 400);
  let specBody: string;
  if (typeof body.spec === "string") {
    specBody = body.spec;
  } else {
    specBody = JSON.stringify(body.spec);
  }
  const result = await getClient().send(new ImportRestApiCommand({
    body: specBody,
    failOnWarnings: body.failOnWarnings,
  }));
  return c.json({ api: result }, 201);
});

router.put("/rest-apis/:apiId", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  const body = await c.req.json<{ spec: unknown; mode?: "merge" | "overwrite" }>();
  if (!body.spec) return c.json({ error: "spec (OpenAPI document) is required" }, 400);
  let specBody: string;
  if (typeof body.spec === "string") {
    specBody = body.spec;
  } else {
    specBody = JSON.stringify(body.spec);
  }
  const result = await getClient().send(new PutRestApiCommand({
    restApiId: apiId,
    body: specBody,
    mode: body.mode as any,
  }));
  return c.json({ api: result });
});

router.post("/rest-apis/:apiId/tags", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  const body = await c.req.json<{ tags: Record<string, string> }>();
  if (!body.tags) return c.json({ error: "tags is required" }, 400);
  await getClient().send(new TagResourceCommand({
    resourceArn: `arn:aws:apigateway:us-east-1::/restapis/${apiId}`,
    tags: body.tags,
  }));
  return c.json({ tagged: true });
});

router.delete("/rest-apis/:apiId/tags", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  const tagKeys = (c.req.query("tagKeys") || "").split(",").filter(Boolean);
  if (!tagKeys.length) return c.json({ error: "tagKeys is required" }, 400);
  await getClient().send(new UntagResourceCommand({
    resourceArn: `arn:aws:apigateway:us-east-1::/restapis/${apiId}`,
    tagKeys,
  }));
  return c.json({ untagged: true });
});

router.get("/rest-apis/:apiId/tags", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  const result = await getClient().send(new GetTagsCommand({
    resourceArn: `arn:aws:apigateway:us-east-1::/restapis/${apiId}`,
  }));
  return c.json({ tags: result.tags ?? {} });
});

export default router;
