// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import {
  useAPIGatewayApis,
  useAPIGatewayApi,
  useCreateAPIGatewayApi,
  useDeleteAPIGatewayApi,
  useAPIGatewayResources,
  useAPIGatewayDeployments,
} from "./useAPIGateway";
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

// ─── REST APIs ─────────────────────────────────────────

describe("useAPIGatewayApis", () => {
  it("fetches REST APIs", async () => {
    mockedApi.mockResolvedValue({ apis: [{ id: "1", name: "api1" }], total: 1 });
    const { result } = renderHook(() => useAPIGatewayApis(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.apis).toHaveLength(1);
    expect(mockedApi).toHaveBeenCalledWith("/aws/apigateway/rest-apis");
  });
});

describe("useAPIGatewayApi", () => {
  it("fetches a single REST API", async () => {
    mockedApi.mockResolvedValue({ api: { id: "abc", name: "my-api" } });
    const { result } = renderHook(() => useAPIGatewayApi("abc"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.api.name).toBe("my-api");
    expect(mockedApi).toHaveBeenCalledWith("/aws/apigateway/rest-apis/abc");
  });

  it("is disabled when apiId is null", () => {
    const { result } = renderHook(() => useAPIGatewayApi(null), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useCreateAPIGatewayApi", () => {
  it("creates a REST API and invalidates list query", async () => {
    mockedApi.mockResolvedValue({ api: { id: "new", name: "new-api" } });
    const { result } = renderHook(() => useCreateAPIGatewayApi(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({ name: "new-api" });
    expect(mockedApi).toHaveBeenCalledWith("/aws/apigateway/rest-apis", {
      method: "POST",
      body: JSON.stringify({ name: "new-api" }),
    });
  });
});

describe("useDeleteAPIGatewayApi", () => {
  it("deletes a REST API and invalidates list query", async () => {
    mockedApi.mockResolvedValue({ deleted: true });
    const { result } = renderHook(() => useDeleteAPIGatewayApi(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync("abc123");
    expect(mockedApi).toHaveBeenCalledWith("/aws/apigateway/rest-apis/abc123", {
      method: "DELETE",
    });
  });
});

// ─── Resources ─────────────────────────────────────────

describe("useAPIGatewayResources", () => {
  it("fetches resources for an API", async () => {
    mockedApi.mockResolvedValue({
      resources: [{ id: "res1", path: "/pets" }],
      total: 1,
    });
    const { result } = renderHook(() => useAPIGatewayResources("abc"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.resources).toHaveLength(1);
    expect(mockedApi).toHaveBeenCalledWith("/aws/apigateway/rest-apis/abc/resources");
  });

  it("is disabled when apiId is null", () => {
    const { result } = renderHook(() => useAPIGatewayResources(null), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe("idle");
  });
});

// ─── Deployments ───────────────────────────────────────

describe("useAPIGatewayDeployments", () => {
  it("fetches deployments for an API", async () => {
    mockedApi.mockResolvedValue({
      deployments: [{ id: "dep1", stageName: "prod" }],
      total: 1,
    });
    const { result } = renderHook(() => useAPIGatewayDeployments("abc"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.deployments).toHaveLength(1);
    expect(mockedApi).toHaveBeenCalledWith("/aws/apigateway/rest-apis/abc/deployments");
  });

  it("is disabled when apiId is null", () => {
    const { result } = renderHook(() => useAPIGatewayDeployments(null), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe("idle");
  });
});
