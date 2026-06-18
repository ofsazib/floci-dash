import { Hono } from "hono";
import type { Context } from "hono";
import { getAwsConfig } from "../../clients/aws";
import { AppSyncClient } from "@aws-sdk/client-appsync";
import {
  ListGraphqlApisCommand,
  CreateGraphqlApiCommand,
  GetGraphqlApiCommand,
  DeleteGraphqlApiCommand,
  GetSchemaCreationStatusCommand,
  StartSchemaCreationCommand,
  GetIntrospectionSchemaCommand,
  ListDataSourcesCommand,
  CreateDataSourceCommand,
  DeleteDataSourceCommand,
  ListResolversCommand,
  ListFunctionsCommand,
  CreateFunctionCommand,
  DeleteFunctionCommand,
  ListApiKeysCommand,
  CreateApiKeyCommand,
  DeleteApiKeyCommand,
  ListTypesCommand,
} from "@aws-sdk/client-appsync";

const router = new Hono();
const getClient = () => new AppSyncClient(getAwsConfig());

// ── GraphQL APIs ─────────────────────────────────────────

router.get("/apis", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListGraphqlApisCommand({}));
  const apis = result.graphqlApis || [];
  return c.json({ apis, total: apis.length });
});

router.get("/apis/:apiId", async (c: Context) => {
  const apiId = c.req.param("apiId");
  if (!apiId) return c.json({ error: "apiId param required" }, 400);
  const client = getClient();
  const result = await client.send(new GetGraphqlApiCommand({ apiId }));
  return c.json({ api: result.graphqlApi });
});

router.post("/apis", async (c: Context) => {
  const body = await c.req.json();
  if (!body.name) return c.json({ error: "name is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CreateGraphqlApiCommand({
      name: body.name,
      authenticationType: body.authenticationType || "API_KEY",
      logConfig: body.logConfig,
      additionalAuthenticationProviders: body.additionalAuthenticationProviders,
      tags: body.tags,
      xrayEnabled: body.xrayEnabled,
    })
  );
  return c.json({ api: result.graphqlApi }, 201);
});

router.delete("/apis/:apiId", async (c: Context) => {
  const apiId = c.req.param("apiId");
  if (!apiId) return c.json({ error: "apiId param required" }, 400);
  const client = getClient();
  await client.send(new DeleteGraphqlApiCommand({ apiId }));
  return c.json({ deleted: true });
});

// ── Schema ───────────────────────────────────────────────

router.get("/apis/:apiId/schema", async (c: Context) => {
  const apiId = c.req.param("apiId");
  if (!apiId) return c.json({ error: "apiId param required" }, 400);
  const client = getClient();
  const result = await client.send(
    new GetIntrospectionSchemaCommand({ apiId, format: "SDL" })
  );
  const schema = result.schema
    ? new TextDecoder().decode(result.schema as Uint8Array)
    : "";
  return c.json({ schema });
});

router.get("/apis/:apiId/schema/status", async (c: Context) => {
  const apiId = c.req.param("apiId");
  if (!apiId) return c.json({ error: "apiId param required" }, 400);
  const client = getClient();
  const result = await client.send(new GetSchemaCreationStatusCommand({ apiId }));
  return c.json({
    status: result.status,
    details: result.details,
  });
});

router.post("/apis/:apiId/schema", async (c: Context) => {
  const apiId = c.req.param("apiId");
  if (!apiId) return c.json({ error: "apiId param required" }, 400);
  const body = await c.req.json();
  if (!body.definition) return c.json({ error: "definition is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new StartSchemaCreationCommand({
      apiId,
      definition: new TextEncoder().encode(body.definition),
    })
  );
  return c.json({ status: result.status });
});

// ── Data Sources ─────────────────────────────────────────

router.get("/apis/:apiId/data-sources", async (c: Context) => {
  const apiId = c.req.param("apiId");
  if (!apiId) return c.json({ error: "apiId param required" }, 400);
  const client = getClient();
  const result = await client.send(new ListDataSourcesCommand({ apiId }));
  const dataSources = result.dataSources || [];
  return c.json({ dataSources, total: dataSources.length });
});

router.post("/apis/:apiId/data-sources", async (c: Context) => {
  const apiId = c.req.param("apiId");
  if (!apiId) return c.json({ error: "apiId param required" }, 400);
  const body = await c.req.json();
  if (!body.name) return c.json({ error: "name is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CreateDataSourceCommand({
      apiId,
      name: body.name,
      type: body.type || "NONE",
      description: body.description,
      serviceRoleArn: body.serviceRoleArn,
      dynamodbConfig: body.dynamodbConfig,
      lambdaConfig: body.lambdaConfig,
      httpConfig: body.httpConfig,
    })
  );
  return c.json({ dataSource: result.dataSource }, 201);
});

router.delete("/apis/:apiId/data-sources/:name", async (c: Context) => {
  const apiId = c.req.param("apiId");
  const name = c.req.param("name");
  if (!apiId || !name) return c.json({ error: "apiId and name params required" }, 400);
  const client = getClient();
  await client.send(new DeleteDataSourceCommand({ apiId, name }));
  return c.json({ deleted: true });
});

// ── Resolvers ────────────────────────────────────────────

router.get("/apis/:apiId/resolvers", async (c: Context) => {
  const apiId = c.req.param("apiId");
  if (!apiId) return c.json({ error: "apiId param required" }, 400);
  const client = getClient();
  const result = await client.send(
    new ListResolversCommand({ apiId, typeName: "Query" })
  );
  const resolvers = result.resolvers || [];
  return c.json({ resolvers, total: resolvers.length });
});

// ── Functions ────────────────────────────────────────────

router.get("/apis/:apiId/functions", async (c: Context) => {
  const apiId = c.req.param("apiId");
  if (!apiId) return c.json({ error: "apiId param required" }, 400);
  const client = getClient();
  const result = await client.send(new ListFunctionsCommand({ apiId }));
  const functions = result.functions || [];
  return c.json({ functions, total: functions.length });
});

router.post("/apis/:apiId/functions", async (c: Context) => {
  const apiId = c.req.param("apiId");
  if (!apiId) return c.json({ error: "apiId param required" }, 400);
  const body = await c.req.json();
  if (!body.name) return c.json({ error: "name is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CreateFunctionCommand({
      apiId,
      name: body.name,
      dataSourceName: body.dataSourceName,
      description: body.description,
      code: body.code,
      requestMappingTemplate: body.requestMappingTemplate,
      responseMappingTemplate: body.responseMappingTemplate,
      functionVersion: body.functionVersion || "2018-05-29",
    })
  );
  return c.json({ function: result.functionConfiguration }, 201);
});

router.delete("/apis/:apiId/functions/:functionId", async (c: Context) => {
  const apiId = c.req.param("apiId");
  const functionId = c.req.param("functionId");
  if (!apiId || !functionId)
    return c.json({ error: "apiId and functionId params required" }, 400);
  const client = getClient();
  await client.send(new DeleteFunctionCommand({ apiId, functionId }));
  return c.json({ deleted: true });
});

// ── API Keys ─────────────────────────────────────────────

router.get("/apis/:apiId/api-keys", async (c: Context) => {
  const apiId = c.req.param("apiId");
  if (!apiId) return c.json({ error: "apiId param required" }, 400);
  const client = getClient();
  const result = await client.send(new ListApiKeysCommand({ apiId }));
  const apiKeys = result.apiKeys || [];
  return c.json({ apiKeys, total: apiKeys.length });
});

router.post("/apis/:apiId/api-keys", async (c: Context) => {
  const apiId = c.req.param("apiId");
  if (!apiId) return c.json({ error: "apiId param required" }, 400);
  const body = await c.req.json();
  const client = getClient();
  const result = await client.send(
    new CreateApiKeyCommand({
      apiId,
      description: body.description,
      expires: body.expires,
    })
  );
  return c.json({ apiKey: result.apiKey?.id || null, id: result.apiKey?.id, expires: result.apiKey?.expires }, 201);
});

router.delete("/apis/:apiId/api-keys/:id", async (c: Context) => {
  const apiId = c.req.param("apiId");
  const id = c.req.param("id");
  if (!apiId || !id) return c.json({ error: "apiId and id params required" }, 400);
  const client = getClient();
  await client.send(new DeleteApiKeyCommand({ apiId, id }));
  return c.json({ deleted: true });
});

// ── Types ────────────────────────────────────────────────

router.get("/apis/:apiId/types", async (c: Context) => {
  const apiId = c.req.param("apiId");
  if (!apiId) return c.json({ error: "apiId param required" }, 400);
  const client = getClient();
  const result = await client.send(
    new ListTypesCommand({ apiId, format: "SDL" })
  );
  const types = result.types || [];
  return c.json({ types, total: types.length });
});

export default router;
