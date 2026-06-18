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

  it("returns 400 if name is missing", async () => {
    const res = await app.request("/api/aws/appsync/apis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authenticationType: "API_KEY" }),
    });
    expect(res.status).toBe(400);
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

  it("returns 400 if name is missing", async () => {
    const res = await app.request("/api/aws/appsync/apis/abc123/functions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataSourceName: "ds1" }),
    });
    expect(res.status).toBe(400);
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
    mockSend.mockResolvedValue({ apiKey: { id: "key2", apiKey: "da2-abc123def456", description: "New key" } });
    const res = await app.request("/api/aws/appsync/apis/abc123/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: "New key" }),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.apiKey).toBe("da2-abc123def456");
    expect(body.id).toBe("key2");
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
});
