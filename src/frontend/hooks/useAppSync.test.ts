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
