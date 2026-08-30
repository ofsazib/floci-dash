import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const mockClient = vi.hoisted(() =>
  vi.fn(function () {
    return { send: mockSend };
  })
);

const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) {
      return { __cmdName: name, ...args };
    });
  };
});

vi.mock("@aws-sdk/client-appsync", () => ({
  AppSyncClient: mockClient,
  ListGraphqlApisCommand: createCmd("ListGraphqlApisCommand"),
  CreateGraphqlApiCommand: createCmd("CreateGraphqlApiCommand"),
  GetGraphqlApiCommand: createCmd("GetGraphqlApiCommand"),
  DeleteGraphqlApiCommand: createCmd("DeleteGraphqlApiCommand"),
  GetSchemaCreationStatusCommand: createCmd("GetSchemaCreationStatusCommand"),
  StartSchemaCreationCommand: createCmd("StartSchemaCreationCommand"),
  GetIntrospectionSchemaCommand: createCmd("GetIntrospectionSchemaCommand"),
  ListDataSourcesCommand: createCmd("ListDataSourcesCommand"),
  CreateDataSourceCommand: createCmd("CreateDataSourceCommand"),
  DeleteDataSourceCommand: createCmd("DeleteDataSourceCommand"),
  ListResolversCommand: createCmd("ListResolversCommand"),
  ListFunctionsCommand: createCmd("ListFunctionsCommand"),
  CreateFunctionCommand: createCmd("CreateFunctionCommand"),
  DeleteFunctionCommand: createCmd("DeleteFunctionCommand"),
  ListApiKeysCommand: createCmd("ListApiKeysCommand"),
  CreateApiKeyCommand: createCmd("CreateApiKeyCommand"),
  DeleteApiKeyCommand: createCmd("DeleteApiKeyCommand"),
  ListTypesCommand: createCmd("ListTypesCommand"),
  CreateResolverCommand: createCmd("CreateResolverCommand"),
  UpdateResolverCommand: createCmd("UpdateResolverCommand"),
  DeleteResolverCommand: createCmd("DeleteResolverCommand"),
  UpdateDataSourceCommand: createCmd("UpdateDataSourceCommand"),
  UpdateGraphqlApiCommand: createCmd("UpdateGraphqlApiCommand"),
  GetDataSourceCommand: createCmd("GetDataSourceCommand"),
  GetResolverCommand: createCmd("GetResolverCommand"),
  GetFunctionCommand: createCmd("GetFunctionCommand"),
  UpdateApiKeyCommand: createCmd("UpdateApiKeyCommand"),
  PutGraphqlApiEnvironmentVariablesCommand: createCmd("PutGraphqlApiEnvironmentVariablesCommand"),
  GetGraphqlApiEnvironmentVariablesCommand: createCmd("GetGraphqlApiEnvironmentVariablesCommand"),
  CreateDomainNameCommand: createCmd("CreateDomainNameCommand"),
  DeleteDomainNameCommand: createCmd("DeleteDomainNameCommand"),
  GetDomainNameCommand: createCmd("GetDomainNameCommand"),
  GetApiAssociationCommand: createCmd("GetApiAssociationCommand"),
  CreateChannelNamespaceCommand: createCmd("CreateChannelNamespaceCommand"),
  DeleteChannelNamespaceCommand: createCmd("DeleteChannelNamespaceCommand"),
  ListChannelNamespacesCommand: createCmd("ListChannelNamespacesCommand"),
  GetChannelNamespaceCommand: createCmd("GetChannelNamespaceCommand"),
  ListTagsForResourceCommand: createCmd("ListTagsForResourceCommand"),
  TagResourceCommand: createCmd("TagResourceCommand"),
  UntagResourceCommand: createCmd("UntagResourceCommand"),
  ListDomainNamesCommand: createCmd("ListDomainNamesCommand"),
}));

import app from "../../index";

beforeEach(() => {
  mockSend.mockReset();
});

// ─── GraphQL APIs ────────────────────────────────────────

describe("GET /api/aws/appsync/apis", () => {
  it("returns list of GraphQL APIs", async () => {
    mockSend.mockResolvedValue({
      graphqlApis: [{ apiId: "abc123", name: "my-api", authenticationType: "API_KEY" }],
    });
    const res = await app.request("/api/aws/appsync/apis");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.apis).toHaveLength(1);
    expect(body.apis[0].name).toBe("my-api");
    expect(body.total).toBe(1);
  });

  it("returns empty list when no APIs exist", async () => {
    mockSend.mockResolvedValue({ graphqlApis: undefined });
    const res = await app.request("/api/aws/appsync/apis");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.apis).toHaveLength(0);
    expect(body.total).toBe(0);
  });
});

describe("GET /api/aws/appsync/apis/:apiId", () => {
  it("returns a single GraphQL API", async () => {
    mockSend.mockResolvedValue({ graphqlApi: { apiId: "abc123", name: "my-api" } });
    const res = await app.request("/api/aws/appsync/apis/abc123");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.api.name).toBe("my-api");
  });
});

describe("POST /api/aws/appsync/apis", () => {
  it("creates a GraphQL API", async () => {
    mockSend.mockResolvedValue({ graphqlApi: { apiId: "new123", name: "new-api" } });
    const res = await app.request("/api/aws/appsync/apis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "new-api", authenticationType: "API_KEY" }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.api.name).toBe("new-api");
  });

  it("creates API with logConfig, tags, xrayEnabled, and additionalAuthProviders", async () => {
    mockSend.mockResolvedValue({ graphqlApi: { apiId: "adv123", name: "advanced-api" } });
    const res = await app.request("/api/aws/appsync/apis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "advanced-api",
        authenticationType: "AMAZON_COGNITO_USER_POOLS",
        logConfig: { cloudWatchLogsRoleArn: "arn:aws:iam::123:role/logs", fieldLogLevel: "ALL" },
        tags: { env: "prod" },
        xrayEnabled: true,
        additionalAuthenticationProviders: [{ authenticationType: "API_KEY" }],
      }),
    });
    expect(res.status).toBe(201);
    expect(mockSend.mock.calls[0][0].authenticationType).toBe("AMAZON_COGNITO_USER_POOLS");
    expect(mockSend.mock.calls[0][0].logConfig.cloudWatchLogsRoleArn).toBe("arn:aws:iam::123:role/logs");
    expect(mockSend.mock.calls[0][0].tags.env).toBe("prod");
    expect(mockSend.mock.calls[0][0].xrayEnabled).toBe(true);
    expect(mockSend.mock.calls[0][0].additionalAuthenticationProviders).toHaveLength(1);
  });

  it("returns 400 if name is missing", async () => {
    const res = await app.request("/api/aws/appsync/apis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authenticationType: "API_KEY" }),
    });
    expect(res.status).toBe(400);
  });

  it("creates API with default authentication type", async () => {
    mockSend.mockResolvedValue({ graphqlApi: { apiId: "def456", name: "default-auth" } });
    const res = await app.request("/api/aws/appsync/apis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "default-auth" }),
    });
    expect(res.status).toBe(201);
    expect(mockSend.mock.calls[0][0].authenticationType).toBe("API_KEY");
  });
});

describe("DELETE /api/aws/appsync/apis/:apiId", () => {
  it("deletes a GraphQL API", async () => {
    mockSend.mockResolvedValue({});
    const res = await app.request("/api/aws/appsync/apis/abc123", { method: "DELETE" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
  });
});

// ─── Schema ──────────────────────────────────────────────

describe("GET /api/aws/appsync/apis/:apiId/schema", () => {
  it("returns introspection schema", async () => {
    const schemaText = "type Query { hello: String }";
    mockSend.mockResolvedValue({ schema: new TextEncoder().encode(schemaText) });
    const res = await app.request("/api/aws/appsync/apis/abc123/schema");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.schema).toBe(schemaText);
  });

  it("returns empty string when schema is not present", async () => {
    mockSend.mockResolvedValue({});
    const res = await app.request("/api/aws/appsync/apis/abc123/schema");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.schema).toBe("");
  });
});

describe("GET /api/aws/appsync/apis/:apiId/schema/status", () => {
  it("returns schema creation status", async () => {
    mockSend.mockResolvedValue({ status: "ACTIVE", details: "" });
    const res = await app.request("/api/aws/appsync/apis/abc123/schema/status");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ACTIVE");
  });
});

describe("POST /api/aws/appsync/apis/:apiId/schema", () => {
  it("starts schema creation", async () => {
    mockSend.mockResolvedValue({ status: "PROCESSING" });
    const res = await app.request("/api/aws/appsync/apis/abc123/schema", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ definition: "type Query { hello: String }" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("PROCESSING");
  });

  it("returns 400 if definition is missing", async () => {
    const res = await app.request("/api/aws/appsync/apis/abc123/schema", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });
});

// ─── Data Sources ────────────────────────────────────────

describe("GET /api/aws/appsync/apis/:apiId/data-sources", () => {
  it("returns data sources for an API", async () => {
    mockSend.mockResolvedValue({
      dataSources: [{ name: "ds1", type: "AWS_LAMBDA" }],
    });
    const res = await app.request("/api/aws/appsync/apis/abc123/data-sources");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.dataSources).toHaveLength(1);
    expect(body.total).toBe(1);
  });

  it("returns empty list when no data sources exist", async () => {
    mockSend.mockResolvedValue({ dataSources: undefined });
    const res = await app.request("/api/aws/appsync/apis/abc123/data-sources");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.dataSources).toHaveLength(0);
  });
});

describe("POST /api/aws/appsync/apis/:apiId/data-sources", () => {
  it("creates a data source", async () => {
    mockSend.mockResolvedValue({ dataSource: { name: "ds1", type: "NONE" } });
    const res = await app.request("/api/aws/appsync/apis/abc123/data-sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "ds1", type: "NONE" }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.dataSource.name).toBe("ds1");
  });

  it("creates a data source with default type NONE when type is omitted", async () => {
    mockSend.mockResolvedValue({ dataSource: { name: "ds3", type: "NONE" } });
    const res = await app.request("/api/aws/appsync/apis/abc123/data-sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "ds3" }),
    });
    expect(res.status).toBe(201);
    expect(mockSend.mock.calls[0][0].type).toBe("NONE");
  });

  it("creates a data source with explicit type and advanced config", async () => {
    mockSend.mockResolvedValue({ dataSource: { name: "ds2", type: "AWS_LAMBDA" } });
    const res = await app.request("/api/aws/appsync/apis/abc123/data-sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "ds2",
        type: "AWS_LAMBDA",
        description: "Lambda data source",
        serviceRoleArn: "arn:aws:iam::123:role/appsync",
        dynamodbConfig: { tableName: "MyTable", awsRegion: "us-east-1" },
      }),
    });
    expect(res.status).toBe(201);
    expect(mockSend.mock.calls[0][0].type).toBe("AWS_LAMBDA");
    expect(mockSend.mock.calls[0][0].description).toBe("Lambda data source");
    expect(mockSend.mock.calls[0][0].serviceRoleArn).toBe("arn:aws:iam::123:role/appsync");
    expect(mockSend.mock.calls[0][0].dynamodbConfig.tableName).toBe("MyTable");
  });

  it("returns 400 if name is missing", async () => {
    const res = await app.request("/api/aws/appsync/apis/abc123/data-sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "NONE" }),
    });
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/aws/appsync/apis/:apiId/data-sources/:name", () => {
  it("deletes a data source", async () => {
    mockSend.mockResolvedValue({});
    const res = await app.request("/api/aws/appsync/apis/abc123/data-sources/ds1", {
      method: "DELETE",
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
  });
});

// ─── Resolvers ───────────────────────────────────────────

describe("GET /api/aws/appsync/apis/:apiId/resolvers", () => {
  it("returns resolvers for an API", async () => {
    mockSend.mockResolvedValue({
      resolvers: [{ fieldName: "getPost", typeName: "Query", kind: "UNIT" }],
    });
    const res = await app.request("/api/aws/appsync/apis/abc123/resolvers");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.resolvers).toHaveLength(1);
    expect(body.total).toBe(1);
  });

  it("returns empty list when no resolvers exist", async () => {
    mockSend.mockResolvedValue({ resolvers: undefined });
    const res = await app.request("/api/aws/appsync/apis/abc123/resolvers");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.resolvers).toHaveLength(0);
  });
});

// ─── Functions ───────────────────────────────────────────

describe("GET /api/aws/appsync/apis/:apiId/functions", () => {
  it("returns functions for an API", async () => {
    mockSend.mockResolvedValue({
      functions: [{ functionId: "fn1", name: "my-fn" }],
    });
    const res = await app.request("/api/aws/appsync/apis/abc123/functions");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.functions).toHaveLength(1);
    expect(body.total).toBe(1);
  });

  it("returns empty list when no functions exist", async () => {
    mockSend.mockResolvedValue({ functions: undefined });
    const res = await app.request("/api/aws/appsync/apis/abc123/functions");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.functions).toHaveLength(0);
  });
});

describe("POST /api/aws/appsync/apis/:apiId/functions", () => {
  it("creates a function", async () => {
    mockSend.mockResolvedValue({
      functionConfiguration: { functionId: "fn1", name: "my-fn" },
    });
    const res = await app.request("/api/aws/appsync/apis/abc123/functions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "my-fn", dataSourceName: "ds1" }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.function.name).toBe("my-fn");
  });

  it("creates a function with explicit version and all fields", async () => {
    mockSend.mockResolvedValue({
      functionConfiguration: { functionId: "fn2", name: "full-fn" },
    });
    const res = await app.request("/api/aws/appsync/apis/abc123/functions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "full-fn",
        dataSourceName: "ds1",
        description: "My full function",
        code: "export function handler() { return {}; }",
        requestMappingTemplate: '{"version":"2018-05-29"}',
        responseMappingTemplate: '$util.toJson($ctx.result)',
        functionVersion: "2018-05-29",
      }),
    });
    expect(res.status).toBe(201);
    expect(mockSend.mock.calls[0][0].functionVersion).toBe("2018-05-29");
    expect(mockSend.mock.calls[0][0].dataSourceName).toBe("ds1");
    expect(mockSend.mock.calls[0][0].description).toBe("My full function");
    expect(mockSend.mock.calls[0][0].code).toContain("export function handler");
    expect(mockSend.mock.calls[0][0].requestMappingTemplate).toContain("2018-05-29");
    expect(mockSend.mock.calls[0][0].responseMappingTemplate).toContain("$util.toJson");
  });

  it("returns 400 if name is missing", async () => {
    const res = await app.request("/api/aws/appsync/apis/abc123/functions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataSourceName: "ds1" }),
    });
    expect(res.status).toBe(400);
  });

  it("creates a function with default function version", async () => {
    mockSend.mockResolvedValue({
      functionConfiguration: { functionId: "fn2", name: "default-ver" },
    });
    const res = await app.request("/api/aws/appsync/apis/abc123/functions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "default-ver" }),
    });
    expect(res.status).toBe(201);
    expect(mockSend.mock.calls[0][0].functionVersion).toBe("2018-05-29");
  });
});

describe("DELETE /api/aws/appsync/apis/:apiId/functions/:functionId", () => {
  it("deletes a function", async () => {
    mockSend.mockResolvedValue({});
    const res = await app.request("/api/aws/appsync/apis/abc123/functions/fn1", {
      method: "DELETE",
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
  });
});

// ─── API Keys ────────────────────────────────────────────

describe("GET /api/aws/appsync/apis/:apiId/api-keys", () => {
  it("returns API keys for an API", async () => {
    mockSend.mockResolvedValue({
      apiKeys: [{ id: "key1", description: "Test key" }],
    });
    const res = await app.request("/api/aws/appsync/apis/abc123/api-keys");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.apiKeys).toHaveLength(1);
    expect(body.total).toBe(1);
  });

  it("returns empty list when no API keys exist", async () => {
    mockSend.mockResolvedValue({ apiKeys: undefined });
    const res = await app.request("/api/aws/appsync/apis/abc123/api-keys");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.apiKeys).toHaveLength(0);
  });
});

describe("POST /api/aws/appsync/apis/:apiId/api-keys", () => {
  it("creates an API key", async () => {
    mockSend.mockResolvedValue({ apiKey: { id: "key2", description: "New key" } });
    const res = await app.request("/api/aws/appsync/apis/abc123/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: "New key" }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.apiKey).toBe("key2");
    expect(body.id).toBe("key2");
  });

  it("creates API key with expires and handles null apiKey", async () => {
    mockSend.mockResolvedValue({ apiKey: null });
    const res = await app.request("/api/aws/appsync/apis/abc123/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: "Expiring key", expires: 1735689600 }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.apiKey).toBeNull();
    expect(body.id).toBeUndefined();
    expect(mockSend.mock.calls[0][0].expires).toBe(1735689600);
  });
});

describe("DELETE /api/aws/appsync/apis/:apiId/api-keys/:id", () => {
  it("deletes an API key", async () => {
    mockSend.mockResolvedValue({});
    const res = await app.request("/api/aws/appsync/apis/abc123/api-keys/key1", {
      method: "DELETE",
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
  });
});

// ─── Types ───────────────────────────────────────────────

describe("GET /api/aws/appsync/apis/:apiId/types", () => {
  it("returns types for an API", async () => {
    mockSend.mockResolvedValue({
      types: [{ name: "Post", format: "SDL" }],
    });
    const res = await app.request("/api/aws/appsync/apis/abc123/types");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.types).toHaveLength(1);
    expect(body.total).toBe(1);
  });

  it("returns empty list when no types exist", async () => {
    mockSend.mockResolvedValue({ types: undefined });
    const res = await app.request("/api/aws/appsync/apis/abc123/types");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.types).toHaveLength(0);
  });


async function post(path: string, body?: any) {
  return app.request("/api/aws/appsync" + path, {
    method: "POST",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { "content-type": "application/json" } : undefined,
  });
}
async function put(path: string, body?: any) {
  return app.request("/api/aws/appsync" + path, {
    method: "PUT",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { "content-type": "application/json" } : undefined,
  });
}
async function del(path: string) {
  return app.request("/api/aws/appsync" + path, { method: "DELETE" });
}
  describe("Resolver + datasource mutations", () => {
    it("POST /apis/:apiId/types/:typeName/resolvers — creates a resolver", async () => {
      mockSend.mockResolvedValueOnce({ resolver: { fieldName: "getPost", typeName: "Query" } });
      const res = await post("/apis/api-1/types/Query/resolvers", {
        fieldName: "getPost",
        dataSourceName: "ds-1",
        requestMappingTemplate: "{version: '2018-05-29'}",
      });
      expect(res.status).toBe(201);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.__cmdName).toBe("CreateResolverCommand");
      expect(cmd.typeName).toBe("Query");
      expect(cmd.dataSourceName).toBe("ds-1");
    });

    it("POST resolvers — 400 without fieldName", async () => {
      const res = await post("/apis/api-1/types/Query/resolvers", { dataSourceName: "ds" });
      expect(res.status).toBe(400);
    });

    it("POST resolvers — 400 without dataSourceName", async () => {
      const res = await post("/apis/api-1/types/Query/resolvers", { fieldName: "f" });
      expect(res.status).toBe(400);
    });

    it("POST resolvers — null resolver on sparse", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/apis/api-1/types/Query/resolvers", { fieldName: "f", dataSourceName: "d" });
      expect((await res.json()).resolver).toBeNull();
    });

    it("PUT .../resolvers/:fieldName — updates templates", async () => {
      mockSend.mockResolvedValueOnce({ resolver: { fieldName: "getPost" } });
      const res = await put("/apis/api-1/types/Query/resolvers/getPost", {
        requestMappingTemplate: "{new}",
      });
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.__cmdName).toBe("UpdateResolverCommand");
      expect(cmd.fieldName).toBe("getPost");
    });

    it("PUT .../resolvers/:fieldName — null on sparse", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/apis/api-1/types/Query/resolvers/getPost", {});
      expect((await res.json()).resolver).toBeNull();
    });

    it("DELETE .../resolvers/:fieldName — deletes", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/apis/api-1/types/Query/resolvers/getPost");
      expect((await res.json()).deleted).toBe(true);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("DeleteResolverCommand");
    });

    it("PUT /apis/:apiId/datasources/:name — updates a data source", async () => {
      mockSend.mockResolvedValueOnce({ dataSource: { name: "ds-1" } });
      const res = await put("/apis/api-1/datasources/ds-1", {
        type: "AWS_LAMBDA",
        lambdaConfig: { lambdaFunctionArn: "arn:fn" },
      });
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.__cmdName).toBe("UpdateDataSourceCommand");
      expect(cmd.lambdaConfig.lambdaFunctionArn).toBe("arn:fn");
    });

    it("PUT /apis/:apiId/datasources/:name — null on sparse", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/apis/api-1/datasources/ds-1", {});
      expect((await res.json()).dataSource).toBeNull();
    });
  });
});

// ─── P1 gap audit — AppSync extras ──────────────────────

const AG = "/api/aws/appsync";
const j = async (r: Response) => await r.json();

describe("AppSync extras", () => {
  it("update API", async () => {
    mockSend.mockResolvedValueOnce({ graphqlApi: { apiId: "a1", name: "renamed" } });
    const res = await app.request(`${AG}/apis/a1`, { method: "PUT", body: JSON.stringify({ name: "renamed" }), headers: { "content-type": "application/json" } });
    expect(res.status).toBe(200);
    expect(mockSend.mock.calls[0][0]).toMatchObject({ __cmdName: "UpdateGraphqlApiCommand", apiId: "a1", name: "renamed" });
  });

  it("get data source / resolver / function / api key / update key", async () => {
    mockSend
      .mockResolvedValueOnce({ dataSource: { name: "ds1" } })
      .mockResolvedValueOnce({ resolver: { fieldName: "f1" } })
      .mockResolvedValueOnce({ resolvers: [], nextToken: null })
      .mockResolvedValueOnce({ functionConfiguration: { functionId: "fn1" } })
      .mockResolvedValueOnce({ apiKey: { id: "k1" } });
    const ds = await app.request(`${AG}/apis/a1/data-sources/ds1`);
    expect((await ds.json()).dataSource.name).toBe("ds1");
    const resolver = await app.request(`${AG}/apis/a1/resolvers-by-type/Query/resolvers?fieldName=f1`);
    expect(resolver.status).toBe(200);
    // single-get resolver (GetResolver)
    mockSend.mockResolvedValueOnce({ resolver: { fieldName: "f1" } });
    const getRes = await app.request(`${AG}/apis/a1/resolvers-by-type/Query?fieldName=f1`);
    expect(getRes.status).toBe(200);
    expect(mockSend.mock.calls[2][0]).toMatchObject({ __cmdName: "GetResolverCommand", typeName: "Query", fieldName: "f1" });
    // list resolvers-by-type with maxResults
    mockSend.mockResolvedValueOnce({ resolvers: [], nextToken: null });
    const listByType = await app.request(`${AG}/apis/a1/resolvers-by-type/Query/resolvers?maxResults=5`);
    expect(listByType.status).toBe(200);
    expect(mockSend.mock.calls[3][0].maxResults).toBe(5);

    const fn = await app.request(`${AG}/apis/a1/functions/fn1`);
    expect(fn.status).toBe(200);
    expect(mockSend.mock.calls[4][0].functionId).toBe("fn1");
    const up = await app.request(`${AG}/apis/a1/api-keys/k1`, { method: "PUT", body: JSON.stringify({ description: "d" }), headers: { "content-type": "application/json" } });
    expect(up.status).toBe(200);
  });

  it("GetResolver error arm — rethrows to 500", async () => {
    mockSend.mockRejectedValueOnce(Object.assign(new Error("boom"), { $metadata: { httpStatusCode: 500 } }));
    const errRes = await app.request(`${AG}/apis/a1/resolvers-by-type/Query?fieldName=f1`);
    expect(errRes.status).toBe(500);
  });

  it("env vars put/get", async () => {
    mockSend
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ environmentVariables: { A: "1" } });
    expect((await app.request(`${AG}/apis/a1/env-vars`, { method: "PUT", body: JSON.stringify({ environmentVariables: { A: "1" } }), headers: { "content-type": "application/json" } })).status).toBe(200);
    expect((await j(await app.request(`${AG}/apis/a1/env-vars`))).environmentVariables).toEqual({ A: "1" });
  });

  it("domain names create/list/get/delete", async () => {
    mockSend
      .mockResolvedValueOnce({ domainNameConfig: { domainName: "api.x" } })
      .mockResolvedValueOnce({ domainNameConfigs: [{ domainName: "api.x" }] })
      .mockResolvedValueOnce({ domainNameConfig: { domainName: "api.x" } })
      .mockResolvedValueOnce({});
    expect((await app.request(`${AG}/domain-names`, { method: "POST", body: JSON.stringify({ domainName: "api.x", certificateArn: "arn:c" }), headers: { "content-type": "application/json" } })).status).toBe(201);
    expect((await j(await app.request(`${AG}/domain-names`))).total).toBe(1);
    expect((await app.request(`${AG}/domain-names/api.x`)).status).toBe(200);
    expect((await app.request(`${AG}/domain-names/api.x`, { method: "DELETE" })).status).toBe(200);
    expect((await app.request(`${AG}/domain-names`, { method: "POST", body: "{}", headers: { "content-type": "application/json" } })).status).toBe(400);
  });

  it("api association get + delete missing command skipped", async () => {
    mockSend.mockResolvedValueOnce({ apiAssociation: { associationId: "as-1" } });
    const res = await app.request(`${AG}/api-associations/api.x`);
    expect((await res.json()).apiAssociation.associationId).toBe("as-1");
  });

  it("channel namespaces CRUD", async () => {
    mockSend
      .mockResolvedValueOnce({ channelNamespace: { name: "ns1" } })
      .mockResolvedValueOnce({ channelNamespaces: [{ name: "ns1" }] })
      .mockResolvedValueOnce({ channelNamespace: { name: "ns1" } })
      .mockResolvedValueOnce({});
    expect((await app.request(`${AG}/apis/a1/channel-namespaces`, { method: "POST", body: JSON.stringify({ name: "ns1" }), headers: { "content-type": "application/json" } })).status).toBe(201);
    expect((await j(await app.request(`${AG}/apis/a1/channel-namespaces`))).total).toBe(1);
    expect((await app.request(`${AG}/apis/a1/channel-namespaces/ns1`)).status).toBe(200);
    expect((await app.request(`${AG}/apis/a1/channel-namespaces/ns1`, { method: "DELETE" })).status).toBe(200);
    expect((await app.request(`${AG}/apis/a1/channel-namespaces`, { method: "POST", body: "{}", headers: { "content-type": "application/json" } })).status).toBe(400);
  });

  it("tags get/put/delete + metrics config", async () => {
    mockSend
      .mockResolvedValueOnce({ tags: { a: "b" } })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ graphqlApi: { metricsConfig: { enabled: true } } });
    expect((await j(await app.request(`${AG}/resources/tags?arn=arn%3Aa`))).tags).toEqual({ a: "b" });
    expect((await app.request(`${AG}/resources/tags`, { method: "POST", body: JSON.stringify({ arn: "arn:a", tags: { a: "b" } }), headers: { "content-type": "application/json" } })).status).toBe(200);
    expect((await app.request(`${AG}/resources/tags?arn=arn%3Aa&tagKeys=a`, { method: "DELETE" })).status).toBe(200);
    expect((await j(await app.request(`${AG}/apis/a1/metrics-config`))).metricsConfig.enabled).toBe(true);
    expect((await app.request(`${AG}/resources/tags`, { method: "POST", body: "{}", headers: { "content-type": "application/json" } })).status).toBe(400);
    expect((await app.request(`${AG}/resources/tags`, { method: "DELETE" })).status).toBe(400);
    expect((await app.request(`${AG}/resources/tags`)).status).toBe(400);
  });
});
