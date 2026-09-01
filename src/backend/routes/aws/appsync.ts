import { Hono } from "hono";
import type { Context } from "hono";
import { getAwsConfig } from "../../clients/aws";
import { AppSyncClient } from "@aws-sdk/client-appsync";
/* istanbul ignore start */
import {
  CreateResolverCommand,
  UpdateResolverCommand,
  DeleteResolverCommand,
  UpdateDataSourceCommand,
  // P1 gap audit
  UpdateGraphqlApiCommand,
  GetDataSourceCommand,
  GetResolverCommand,
  GetFunctionCommand,
  UpdateApiKeyCommand,
  PutGraphqlApiEnvironmentVariablesCommand,
  GetGraphqlApiEnvironmentVariablesCommand,
  CreateDomainNameCommand,
  DeleteDomainNameCommand,
  GetDomainNameCommand,
  ListDomainNamesCommand,
  GetApiAssociationCommand,
  CreateChannelNamespaceCommand,
  DeleteChannelNamespaceCommand,
  ListChannelNamespacesCommand,
  GetChannelNamespaceCommand,
  ListTagsForResourceCommand,
  TagResourceCommand,
  UntagResourceCommand,
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
/* istanbul ignore end */

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
  const client = getClient();
  await client.send(new DeleteGraphqlApiCommand({ apiId }));
  return c.json({ deleted: true });
});

// ── Schema ───────────────────────────────────────────────

router.get("/apis/:apiId/schema", async (c: Context) => {
  const apiId = c.req.param("apiId");
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
  const client = getClient();
  const result = await client.send(new GetSchemaCreationStatusCommand({ apiId }));
  return c.json({
    status: result.status,
    details: result.details,
  });
});

router.post("/apis/:apiId/schema", async (c: Context) => {
  const apiId = c.req.param("apiId");
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
  const client = getClient();
  const result = await client.send(new ListDataSourcesCommand({ apiId }));
  const dataSources = result.dataSources || [];
  return c.json({ dataSources, total: dataSources.length });
});

router.post("/apis/:apiId/data-sources", async (c: Context) => {
  const apiId = c.req.param("apiId");
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
  const client = getClient();
  await client.send(new DeleteDataSourceCommand({ apiId, name }));
  return c.json({ deleted: true });
});

// ── Resolvers ────────────────────────────────────────────

router.get("/apis/:apiId/resolvers", async (c: Context) => {
  const apiId = c.req.param("apiId");
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
  const client = getClient();
  const result = await client.send(new ListFunctionsCommand({ apiId }));
  const functions = result.functions || [];
  return c.json({ functions, total: functions.length });
});

router.post("/apis/:apiId/functions", async (c: Context) => {
  const apiId = c.req.param("apiId");
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
  const client = getClient();
  await client.send(new DeleteFunctionCommand({ apiId, functionId }));
  return c.json({ deleted: true });
});

// ── API Keys ─────────────────────────────────────────────

router.get("/apis/:apiId/api-keys", async (c: Context) => {
  const apiId = c.req.param("apiId");
  const client = getClient();
  const result = await client.send(new ListApiKeysCommand({ apiId }));
  const apiKeys = result.apiKeys || [];
  return c.json({ apiKeys, total: apiKeys.length });
});

router.post("/apis/:apiId/api-keys", async (c: Context) => {
  const apiId = c.req.param("apiId");
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
  const client = getClient();
  await client.send(new DeleteApiKeyCommand({ apiId, id }));
  return c.json({ deleted: true });
});

// ── Types ────────────────────────────────────────────────

router.get("/apis/:apiId/types", async (c: Context) => {
  const apiId = c.req.param("apiId");
  const client = getClient();
  const result = await client.send(
    new ListTypesCommand({ apiId, format: "SDL" })
  );
  const types = result.types || [];
  return c.json({ types, total: types.length });
});


router.post("/apis/:apiId/types/:typeName/resolvers", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  const typeName = c.req.param("typeName")!;
  const body = await c.req.json<any>();
  if (!body.fieldName) return c.json({ error: "fieldName is required" }, 400);
  if (!body.dataSourceName) return c.json({ error: "dataSourceName is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new CreateResolverCommand({
      apiId,
      typeName,
      fieldName: body.fieldName,
      dataSourceName: body.dataSourceName,
      requestMappingTemplate: body.requestMappingTemplate,
      responseMappingTemplate: body.responseMappingTemplate,
    })
  );
  return c.json({ resolver: result.resolver || null }, 201);
});

router.put("/apis/:apiId/types/:typeName/resolvers/:fieldName", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  const typeName = c.req.param("typeName")!;
  const fieldName = c.req.param("fieldName")!;
  const body = await c.req.json<any>();
  const client = getClient();
  const result = await client.send(
    new UpdateResolverCommand({
      apiId,
      typeName,
      fieldName,
      dataSourceName: body.dataSourceName,
      requestMappingTemplate: body.requestMappingTemplate,
      responseMappingTemplate: body.responseMappingTemplate,
    })
  );
  return c.json({ resolver: result.resolver || null });
});

router.delete("/apis/:apiId/types/:typeName/resolvers/:fieldName", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  const typeName = c.req.param("typeName")!;
  const fieldName = c.req.param("fieldName")!;
  const client = getClient();
  await client.send(new DeleteResolverCommand({ apiId, typeName, fieldName }));
  return c.json({ deleted: true });
});

router.put("/apis/:apiId/datasources/:name", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  const name = c.req.param("name")!;
  const body = await c.req.json<any>();
  const client = getClient();
  const result = await client.send(
    new UpdateDataSourceCommand({
      apiId,
      name,
      type: body.type,
      serviceRoleArn: body.serviceRoleArn,
      dynamodbConfig: body.dynamodbConfig,
      lambdaConfig: body.lambdaConfig,
      httpConfig: body.httpConfig,
      description: body.description,
    })
  );
  return c.json({ dataSource: result.dataSource || null });
});


// ────────────────────────────────────────────────────────────────
//  P1 gap audit — AppSync extras
// ────────────────────────────────────────────────────────────────

router.put("/apis/:apiId", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  const body = await c.req.json<{ name?: string; authenticationType?: string }>();
  const result = await getClient().send(new UpdateGraphqlApiCommand({
    apiId,
    name: body.name,
    authenticationType: body.authenticationType as any,
  }));
  return c.json({ graphqlApi: result.graphqlApi ?? null });
});

router.get("/apis/:apiId/data-sources/:name", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  const result = await getClient().send(new GetDataSourceCommand({
    apiId, name: c.req.param("name")!,
  }));
  return c.json({ dataSource: (result as any).dataSource ?? result });
});

router.get("/apis/:apiId/resolvers-by-type/:typeName", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  const typeName = c.req.param("typeName")!;
  const result = await getClient().send(new GetResolverCommand({
    apiId, typeName, fieldName: c.req.query("fieldName") || "",
  })).catch((err: any) => { throw err; });
  return c.json({ resolver: result });
});

router.get("/apis/:apiId/functions/:functionId", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  const result = await getClient().send(new GetFunctionCommand({
    apiId, functionId: c.req.param("functionId")!,
  }));
  return c.json({ functionConfiguration: result.functionConfiguration ?? null });
});



router.put("/apis/:apiId/api-keys/:id", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  const body = await c.req.json<{ description?: string; expires?: number }>();
  const result = await getClient().send(new UpdateApiKeyCommand({
    apiId, id: c.req.param("id")!,
    description: body.description, expires: body.expires,
  }));
  return c.json({ apiKey: (result as any).apiKey ?? null });
});

router.get("/apis/:apiId/resolvers-by-type/:typeName/resolvers", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  const typeName = c.req.param("typeName")!;
  const client = getClient();
  const result = await client.send(new ListResolversCommand({
    apiId, typeName, maxResults: c.req.query("maxResults") ? parseInt(c.req.query("maxResults")!) : undefined,
    nextToken: c.req.query("nextToken"),
  }));
  return c.json({ resolvers: result.resolvers ?? [], nextToken: result.nextToken ?? null, total: (result.resolvers ?? []).length });
});

// ─── Environment variables ──────────────────────────────────────

router.put("/apis/:apiId/env-vars", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  const body = await c.req.json<{ environmentVariables: Record<string, string> }>();
  await getClient().send(new PutGraphqlApiEnvironmentVariablesCommand({
    apiId, environmentVariables: body.environmentVariables,
  }));
  return c.json({ updated: true });
});

router.get("/apis/:apiId/env-vars", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  const result = await getClient().send(new GetGraphqlApiEnvironmentVariablesCommand({ apiId }));
  return c.json({ environmentVariables: result.environmentVariables ?? {} });
});

// ─── Domain names ───────────────────────────────────────────────

router.post("/domain-names", async (c: Context) => {
  const body = await c.req.json<{ domainName: string; certificateArn: string }>();
  if (!body.domainName || !body.certificateArn) {
    return c.json({ error: "domainName and certificateArn are required" }, 400);
  }
  const result = await getClient().send(new CreateDomainNameCommand({
    domainName: body.domainName, certificateArn: body.certificateArn,
  }));
  return c.json({ domainNameConfig: result.domainNameConfig ?? null }, 201);
});

router.get("/domain-names", async (c: Context) => {
  const result = await getClient().send(new ListDomainNamesCommand({}));
  return c.json({ domainNameConfigs: result.domainNameConfigs ?? [], total: (result.domainNameConfigs ?? []).length });
});

router.get("/domain-names/:domainName", async (c: Context) => {
  const result = await getClient().send(new GetDomainNameCommand({
    domainName: c.req.param("domainName")!,
  }));
  return c.json({ domainNameConfig: (result as any).domainNameConfig ?? null });
});

router.delete("/domain-names/:domainName", async (c: Context) => {
  await getClient().send(new DeleteDomainNameCommand({
    domainName: c.req.param("domainName")!,
  }));
  return c.json({ deleted: true });
});

// ─── API associations (merged APIs) ─────────────────────────────

router.get("/api-associations/:domainName", async (c: Context) => {
  const result = await getClient().send(new GetApiAssociationCommand({
    domainName: c.req.param("domainName")!,
  }));
  return c.json({ apiAssociation: result.apiAssociation ?? null });
});



// ─── Channel namespaces (real-time) ─────────────────────────────

router.post("/apis/:apiId/channel-namespaces", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  const body = await c.req.json<{ name: string }>();
  if (!body.name) return c.json({ error: "name is required" }, 400);
  const result = await getClient().send(new CreateChannelNamespaceCommand({ apiId, name: body.name }));
  return c.json({ channelNamespace: result.channelNamespace ?? null }, 201);
});

router.get("/apis/:apiId/channel-namespaces", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  const result = await getClient().send(new ListChannelNamespacesCommand({ apiId }));
  return c.json({
    channelNamespaces: result.channelNamespaces ?? [],
    total: (result.channelNamespaces ?? []).length,
  });
});

router.get("/apis/:apiId/channel-namespaces/:name", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  const result = await getClient().send(new GetChannelNamespaceCommand({
    apiId, name: c.req.param("name")!,
  }));
  return c.json({ channelNamespace: result.channelNamespace ?? null });
});

router.delete("/apis/:apiId/channel-namespaces/:name", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  await getClient().send(new DeleteChannelNamespaceCommand({
    apiId, name: c.req.param("name")!,
  }));
  return c.json({ deleted: true });
});

// ─── Tags ───────────────────────────────────────────────────────

router.get("/resources/tags", async (c: Context) => {
  const arn = c.req.query("arn") || "";
  if (!arn) return c.json({ error: "arn is required" }, 400);
  const result = await getClient().send(new ListTagsForResourceCommand({ resourceArn: arn }));
  return c.json({ tags: result.tags ?? {} });
});

router.post("/resources/tags", async (c: Context) => {
  const body = await c.req.json<{ arn: string; tags: Record<string, string> }>();
  if (!body.arn || !body.tags) return c.json({ error: "arn and tags are required" }, 400);
  await getClient().send(new TagResourceCommand({ resourceArn: body.arn, tags: body.tags }));
  return c.json({ tagged: true });
});

router.delete("/resources/tags", async (c: Context) => {
  const arn = c.req.query("arn") || "";
  const tagKeys = (c.req.query("tagKeys") || "").split(",").filter(Boolean);
  if (!arn || !tagKeys.length) return c.json({ error: "arn and tagKeys are required" }, 400);
  await getClient().send(new UntagResourceCommand({ resourceArn: arn, tagKeys }));
  return c.json({ untagged: true });
});

// ─── Enhanced metrics ───────────────────────────────────────────

router.get("/apis/:apiId/metrics-config", async (c: Context) => {
  const apiId = c.req.param("apiId")!;
  const result = await getClient().send(new GetGraphqlApiCommand({ apiId }));
  return c.json({ metricsConfig: (result.graphqlApi as any)?.metricsConfig ?? null });
});

export default router;