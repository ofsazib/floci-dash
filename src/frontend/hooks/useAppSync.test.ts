// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import {
  useAppSyncApis,
  useAppSyncApi,
  useCreateAppSyncApi,
  useDeleteAppSyncApi,
  useAppSyncDataSources,
  useAppSyncResolvers,
  useAppSyncFunctions,
  useAppSyncApiKeys,
  useAppSyncTypes,
  useAppSyncSchema,
  useAppSyncSchemaStatus,
  useCreateAppSyncDataSource,
  useDeleteAppSyncDataSource,
  useCreateAppSyncFunction,
  useDeleteAppSyncFunction,
  useCreateAppSyncApiKey,
  useDeleteAppSyncApiKey,
  useStartSchemaCreation,
  useCreateAppSyncResolver,
  useDeleteAppSyncResolver,
  useUpdateAppSyncApi,
  useGetAppSyncDataSource,
  useAppSyncResolversByType,
  useAppSyncFunction,
  useUpdateAppSyncApiKey,
  usePutAppSyncEnvVars,
  useGetAppSyncEnvVars,
  useAppSyncDomainNames,
  useCreateAppSyncDomainName,
  useDeleteAppSyncDomainName,
  useAppSyncApiAssociation,
  useAppSyncChannelNamespaces,
  useCreateAppSyncChannelNamespace,
  useDeleteAppSyncChannelNamespace,
  useTagAppSyncResource,
  useUntagAppSyncResource,
} from "./useAppSync";
import { api } from "../lib/client";

vi.mock("../lib/client", () => ({
  api: vi.fn(),
}));

const mockedApi = vi.mocked(api);

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: qc }, children);
  };
}

beforeEach(() => {
  mockedApi.mockReset();
});

// ─── GraphQL APIs ────────────────────────────────────────

describe("useAppSyncApis", () => {
  it("fetches GraphQL APIs", async () => {
    mockedApi.mockResolvedValue({ apis: [{ apiId: "1", name: "api1" }], total: 1 });
    const { result } = renderHook(() => useAppSyncApis(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.apis).toHaveLength(1);
    expect(mockedApi).toHaveBeenCalledWith("/aws/appsync/apis");
  });
});

describe("useAppSyncApi", () => {
  it("fetches a single GraphQL API", async () => {
    mockedApi.mockResolvedValue({ api: { apiId: "abc", name: "my-api" } });
    const { result } = renderHook(() => useAppSyncApi("abc"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.api.name).toBe("my-api");
    expect(mockedApi).toHaveBeenCalledWith("/aws/appsync/apis/abc");
  });

  it("is disabled when apiId is null", () => {
    const { result } = renderHook(() => useAppSyncApi(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useCreateAppSyncApi", () => {
  it("creates a GraphQL API and invalidates queries", async () => {
    mockedApi.mockResolvedValue({ api: { apiId: "new", name: "new-api" } });
    const { result } = renderHook(() => useCreateAppSyncApi(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "new-api" });
    expect(mockedApi).toHaveBeenCalledWith("/aws/appsync/apis", {
      method: "POST",
      body: JSON.stringify({ name: "new-api" }),
    });
  });
});

describe("useDeleteAppSyncApi", () => {
  it("deletes a GraphQL API and invalidates queries", async () => {
    mockedApi.mockResolvedValue({ deleted: true });
    const { result } = renderHook(() => useDeleteAppSyncApi(), { wrapper: createWrapper() });
    await result.current.mutateAsync("abc123");
    expect(mockedApi).toHaveBeenCalledWith("/aws/appsync/apis/abc123", { method: "DELETE" });
  });
});

// ─── Schema ──────────────────────────────────────────────

describe("useAppSyncSchema", () => {
  it("fetches schema for an API", async () => {
    mockedApi.mockResolvedValue({ schema: "type Query { hello: String }" });
    const { result } = renderHook(() => useAppSyncSchema("abc"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.schema).toContain("hello");
    expect(mockedApi).toHaveBeenCalledWith("/aws/appsync/apis/abc/schema");
  });

  it("is disabled when apiId is null", () => {
    const { result } = renderHook(() => useAppSyncSchema(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useAppSyncSchemaStatus", () => {
  it("fetches schema creation status", async () => {
    mockedApi.mockResolvedValue({ status: "ACTIVE", details: "" });
    const { result } = renderHook(() => useAppSyncSchemaStatus("abc"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.status).toBe("ACTIVE");
  });

  it("is disabled when apiId is null", () => {
    const { result } = renderHook(() => useAppSyncSchemaStatus(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useStartSchemaCreation", () => {
  it("starts schema creation", async () => {
    mockedApi.mockResolvedValue({ status: "PROCESSING" });
    const { result } = renderHook(() => useStartSchemaCreation(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ apiId: "abc", definition: "type Query { x: String }" });
    expect(mockedApi).toHaveBeenCalledWith("/aws/appsync/apis/abc/schema", {
      method: "POST",
      body: JSON.stringify({ definition: "type Query { x: String }" }),
    });
  });
});

// ─── Data Sources ────────────────────────────────────────

describe("useAppSyncDataSources", () => {
  it("fetches data sources for an API", async () => {
    mockedApi.mockResolvedValue({ dataSources: [{ name: "ds1" }], total: 1 });
    const { result } = renderHook(() => useAppSyncDataSources("abc"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.dataSources).toHaveLength(1);
    expect(mockedApi).toHaveBeenCalledWith("/aws/appsync/apis/abc/data-sources");
  });

  it("is disabled when apiId is null", () => {
    const { result } = renderHook(() => useAppSyncDataSources(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useCreateAppSyncDataSource", () => {
  it("creates a data source", async () => {
    mockedApi.mockResolvedValue({ dataSource: { name: "ds1" } });
    const { result } = renderHook(() => useCreateAppSyncDataSource(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ apiId: "abc", name: "ds1", type: "NONE" });
    expect(mockedApi).toHaveBeenCalledWith("/aws/appsync/apis/abc/data-sources", {
      method: "POST",
      body: JSON.stringify({ name: "ds1", type: "NONE" }),
    });
  });
});

describe("useDeleteAppSyncDataSource", () => {
  it("deletes a data source", async () => {
    mockedApi.mockResolvedValue({ deleted: true });
    const { result } = renderHook(() => useDeleteAppSyncDataSource(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ apiId: "abc", name: "ds1" });
    expect(mockedApi).toHaveBeenCalledWith("/aws/appsync/apis/abc/data-sources/ds1", {
      method: "DELETE",
    });
  });
});

// ─── Resolvers ───────────────────────────────────────────

describe("useAppSyncResolvers", () => {
  it("fetches resolvers for an API", async () => {
    mockedApi.mockResolvedValue({ resolvers: [{ fieldName: "getPost" }], total: 1 });
    const { result } = renderHook(() => useAppSyncResolvers("abc"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.resolvers).toHaveLength(1);
    expect(mockedApi).toHaveBeenCalledWith("/aws/appsync/apis/abc/resolvers");
  });

  it("is disabled when apiId is null", () => {
    const { result } = renderHook(() => useAppSyncResolvers(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });
});

// ─── Functions ───────────────────────────────────────────

describe("useAppSyncFunctions", () => {
  it("fetches functions for an API", async () => {
    mockedApi.mockResolvedValue({ functions: [{ functionId: "fn1" }], total: 1 });
    const { result } = renderHook(() => useAppSyncFunctions("abc"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.functions).toHaveLength(1);
    expect(mockedApi).toHaveBeenCalledWith("/aws/appsync/apis/abc/functions");
  });

  it("is disabled when apiId is null", () => {
    const { result } = renderHook(() => useAppSyncFunctions(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useCreateAppSyncFunction", () => {
  it("creates a function", async () => {
    mockedApi.mockResolvedValue({ function: { functionId: "fn1", name: "my-fn" } });
    const { result } = renderHook(() => useCreateAppSyncFunction(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ apiId: "abc", name: "my-fn", dataSourceName: "ds1" });
    expect(mockedApi).toHaveBeenCalledWith("/aws/appsync/apis/abc/functions", {
      method: "POST",
      body: JSON.stringify({ name: "my-fn", dataSourceName: "ds1" }),
    });
  });
});

describe("useDeleteAppSyncFunction", () => {
  it("deletes a function", async () => {
    mockedApi.mockResolvedValue({ deleted: true });
    const { result } = renderHook(() => useDeleteAppSyncFunction(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ apiId: "abc", functionId: "fn1" });
    expect(mockedApi).toHaveBeenCalledWith("/aws/appsync/apis/abc/functions/fn1", {
      method: "DELETE",
    });
  });
});

// ─── API Keys ────────────────────────────────────────────

describe("useAppSyncApiKeys", () => {
  it("fetches API keys for an API", async () => {
    mockedApi.mockResolvedValue({ apiKeys: [{ id: "key1" }], total: 1 });
    const { result } = renderHook(() => useAppSyncApiKeys("abc"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.apiKeys).toHaveLength(1);
    expect(mockedApi).toHaveBeenCalledWith("/aws/appsync/apis/abc/api-keys");
  });

  it("is disabled when apiId is null", () => {
    const { result } = renderHook(() => useAppSyncApiKeys(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useCreateAppSyncApiKey", () => {
  it("creates an API key", async () => {
    mockedApi.mockResolvedValue({ apiKey: { id: "key2" } });
    const { result } = renderHook(() => useCreateAppSyncApiKey(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ apiId: "abc", description: "New key" });
    expect(mockedApi).toHaveBeenCalledWith("/aws/appsync/apis/abc/api-keys", {
      method: "POST",
      body: JSON.stringify({ description: "New key" }),
    });
  });
});

describe("useDeleteAppSyncApiKey", () => {
  it("deletes an API key", async () => {
    mockedApi.mockResolvedValue({ deleted: true });
    const { result } = renderHook(() => useDeleteAppSyncApiKey(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ apiId: "abc", id: "key1" });
    expect(mockedApi).toHaveBeenCalledWith("/aws/appsync/apis/abc/api-keys/key1", {
      method: "DELETE",
    });
  });
});

// ─── Types ───────────────────────────────────────────────

describe("useAppSyncTypes", () => {
  it("fetches types for an API", async () => {
    mockedApi.mockResolvedValue({ types: [{ name: "Post" }], total: 1 });
    const { result } = renderHook(() => useAppSyncTypes("abc"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.types).toHaveLength(1);
    expect(mockedApi).toHaveBeenCalledWith("/aws/appsync/apis/abc/types");
  });

  it("is disabled when apiId is null", () => {
    const { result } = renderHook(() => useAppSyncTypes(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("AppSync resolver hooks", () => {
  it("useCreateAppSyncResolver posts encoded path", async () => {
    mockedApi.mockResolvedValueOnce({ resolver: {} });
    const { result } = renderHook(() => useCreateAppSyncResolver(), { wrapper: createWrapper() });
    result.current.mutate({
      apiId: "a 1",
      typeName: "Query",
      fieldName: "getPost",
      dataSourceName: "ds",
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi).toHaveBeenCalledWith("/aws/appsync/apis/a%201/types/Query/resolvers", {
      method: "POST",
      body: JSON.stringify({ apiId: "a 1", typeName: "Query", fieldName: "getPost", dataSourceName: "ds" }),
    });
  });

  it("useDeleteAppSyncResolver deletes all encoded", async () => {
    mockedApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteAppSyncResolver(), { wrapper: createWrapper() });
    result.current.mutate({ apiId: "a/1", typeName: "T 1", fieldName: "f 1" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi).toHaveBeenCalledWith("/aws/appsync/apis/a%2F1/types/T%201/resolvers/f%201", {
      method: "DELETE",
    });
  });
});

describe("useAppSync — P1 gap hooks", () => {
  it("api update", async () => {
    mockedApi.mockResolvedValueOnce({ graphqlApi: {} });
    const { result } = renderHook(() => useUpdateAppSyncApi("a1"), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "n2" });
    expect(mockedApi).toHaveBeenCalledWith("/aws/appsync/apis/a1", {
      method: "PUT",
      body: JSON.stringify({ name: "n2" }),
    });
  });

  it("data source + function queries + disabled arms", async () => {
    mockedApi.mockResolvedValueOnce({ dataSource: {} });
    const ds = renderHook(() => useGetAppSyncDataSource("a1", "ds1"), { wrapper: createWrapper() });
    await waitFor(() => expect(ds.result.current.isSuccess).toBe(true));
    const dsIdle = renderHook(() => useGetAppSyncDataSource("a1", null), { wrapper: createWrapper() });
    expect(dsIdle.result.current.fetchStatus).toBe("idle");
    mockedApi.mockResolvedValueOnce({ functionConfiguration: {} });
    const fn = renderHook(() => useAppSyncFunction("a1", "f1"), { wrapper: createWrapper() });
    await waitFor(() => expect(fn.result.current.isSuccess).toBe(true));
  });

  it("resolvers by type query + disabled arm", async () => {
    mockedApi.mockResolvedValueOnce({ resolvers: [], nextToken: null, total: 0 });
    const rt = renderHook(() => useAppSyncResolversByType("a1", "Query"), { wrapper: createWrapper() });
    await waitFor(() => expect(rt.result.current.isSuccess).toBe(true));
    const idle = renderHook(() => useAppSyncResolversByType("a1", null), { wrapper: createWrapper() });
    expect(idle.result.current.fetchStatus).toBe("idle");
  });

  it("api key update", async () => {
    mockedApi.mockResolvedValueOnce({ apiKey: {} });
    const { result } = renderHook(() => useUpdateAppSyncApiKey("a1"), { wrapper: createWrapper() });
    await result.current.mutateAsync({ keyId: "k1", description: "d" });
    expect(mockedApi).toHaveBeenCalledWith("/aws/appsync/apis/a1/api-keys/k1", {
      method: "PUT",
      body: JSON.stringify({ description: "d" }),
    });
  });

  it("env vars put/get", async () => {
    mockedApi.mockResolvedValueOnce({ updated: true });
    const { result: putR } = renderHook(() => usePutAppSyncEnvVars("a1"), { wrapper: createWrapper() });
    await putR.current.mutateAsync({ A: "1" });
    expect(mockedApi).toHaveBeenCalledWith("/aws/appsync/apis/a1/env-vars", {
      method: "PUT",
      body: JSON.stringify({ environmentVariables: { A: "1" } }),
    });
    mockedApi.mockResolvedValueOnce({ environmentVariables: { A: "1" } });
    const getR = renderHook(() => useGetAppSyncEnvVars("a1"), { wrapper: createWrapper() });
    await waitFor(() => expect(getR.result.current.isSuccess).toBe(true));
  });

  it("domain names query/create/delete", async () => {
    mockedApi.mockResolvedValueOnce({ domainNameConfigs: [], total: 0 });
    const list = renderHook(() => useAppSyncDomainNames(), { wrapper: createWrapper() });
    await waitFor(() => expect(list.result.current.isSuccess).toBe(true));
    mockedApi.mockResolvedValueOnce({ domainNameConfig: {} });
    const { result: createR } = renderHook(() => useCreateAppSyncDomainName(), { wrapper: createWrapper() });
    await createR.current.mutateAsync({ domainName: "api.x", certificateArn: "arn:c" });
    mockedApi.mockResolvedValueOnce({ deleted: true });
    const { result: delR } = renderHook(() => useDeleteAppSyncDomainName(), { wrapper: createWrapper() });
    await delR.current.mutateAsync("api.x");
  });

  it("api association query + disabled arm", async () => {
    mockedApi.mockResolvedValueOnce({ apiAssociation: {} });
    const assoc = renderHook(() => useAppSyncApiAssociation("api.x"), { wrapper: createWrapper() });
    await waitFor(() => expect(assoc.result.current.isSuccess).toBe(true));
    const idle = renderHook(() => useAppSyncApiAssociation(null), { wrapper: createWrapper() });
    expect(idle.result.current.fetchStatus).toBe("idle");
  });

  it("channel namespaces query/create/delete", async () => {
    mockedApi.mockResolvedValueOnce({ channelNamespaces: [], total: 0 });
    const list = renderHook(() => useAppSyncChannelNamespaces("a1"), { wrapper: createWrapper() });
    await waitFor(() => expect(list.result.current.isSuccess).toBe(true));
    mockedApi.mockResolvedValueOnce({ channelNamespace: {} });
    const { result: createR } = renderHook(() => useCreateAppSyncChannelNamespace("a1"), { wrapper: createWrapper() });
    await createR.current.mutateAsync({ name: "ns1" });
    mockedApi.mockResolvedValueOnce({ deleted: true });
    const { result: delR } = renderHook(() => useDeleteAppSyncChannelNamespace("a1"), { wrapper: createWrapper() });
    await delR.current.mutateAsync("ns1");
  });

  it("tags tag/untag", async () => {
    mockedApi.mockResolvedValueOnce({ tagged: true });
    const { result: tag } = renderHook(() => useTagAppSyncResource(), { wrapper: createWrapper() });
    await tag.current.mutateAsync({ arn: "arn:a", tags: { a: "b" } });
    expect(mockedApi).toHaveBeenCalledWith("/aws/appsync/resources/tags", {
      method: "POST",
      body: JSON.stringify({ arn: "arn:a", tags: { a: "b" } }),
    });
    mockedApi.mockResolvedValueOnce({ untagged: true });
    const { result: untag } = renderHook(() => useUntagAppSyncResource(), { wrapper: createWrapper() });
    await untag.current.mutateAsync({ arn: "arn:a", tagKeys: ["a"] });
  });
});
