// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const mockApi = vi.fn();
vi.mock("../lib/client", () => ({
  api: (...args: any[]) => mockApi(...args),
}));

import {
  useLambdaFunctions,
  useLambdaFunction,
  useCreateFunction,
  useDeleteFunction,
  useUpdateFunctionConfig,
  useInvokeFunction,
  useLambdaVersions,
  usePublishVersion,
  useLambdaAliases,
  useEventSourceMappings,
  useDeleteEventSourceMapping,
  useLambdaLayers,
  useLambdaLayerVersions,
  useDeleteLayerVersion,
  useLambdaTags,
  useFunctionUrl,
  useFunctionConcurrency,
} from "./useLambda";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

// ─── FUNCTIONS ──────────────────────────────────────────

describe("useLambdaFunctions", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ functions: [], total: 0 });
    const { result } = renderHook(() => useLambdaFunctions(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/lambda/functions");
  });
});

describe("useLambdaFunction", () => {
  it("does NOT call api when name is null", () => {
    renderHook(() => useLambdaFunction(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with name in path when name provided", async () => {
    mockApi.mockResolvedValueOnce({ configuration: {}, code: {} });
    const { result } = renderHook(() => useLambdaFunction("fn-1"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/lambda/functions/fn-1");
  });
});

describe("useCreateFunction", () => {
  it("calls api with POST method and serialized body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateFunction(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ functionName: "fn-1", runtime: "nodejs22.x" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/lambda/functions",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ functionName: "fn-1", runtime: "nodejs22.x" }),
      })
    );
  });
});

describe("useDeleteFunction", () => {
  it("calls api with DELETE method and name in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteFunction(), { wrapper: createWrapper() });
    await result.current.mutateAsync("fn-1");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/lambda/functions/fn-1",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

describe("useUpdateFunctionConfig", () => {
  it("calls api with PUT method, name in path, remaining fields in body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useUpdateFunctionConfig(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({ name: "fn-1", runtime: "nodejs22.x", memorySize: 512 });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/lambda/functions/fn-1/configuration",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ runtime: "nodejs22.x", memorySize: 512 }),
      })
    );
  });
});

describe("useInvokeFunction", () => {
  it("calls api with POST method, raw payload body, and json content-type header", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useInvokeFunction(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "fn-1", payload: '{"key":"v"}' });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/lambda/functions/fn-1/invocations",
      expect.objectContaining({
        method: "POST",
        body: '{"key":"v"}',
        headers: { "Content-Type": "application/json" },
      })
    );
  });
});

// ─── VERSIONS ───────────────────────────────────────────

describe("useLambdaVersions", () => {
  it("does NOT call api when name is null", () => {
    renderHook(() => useLambdaVersions(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with versions URL when name provided", async () => {
    mockApi.mockResolvedValueOnce({ versions: [], total: 0 });
    const { result } = renderHook(() => useLambdaVersions("fn-1"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/lambda/functions/fn-1/versions");
  });
});

describe("usePublishVersion", () => {
  it("calls api with POST method, name in path, description in body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => usePublishVersion(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "fn-1", description: "rel-1" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/lambda/functions/fn-1/versions",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ description: "rel-1" }),
      })
    );
  });

  it("passes undefined description when not provided", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => usePublishVersion(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "fn-1" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/lambda/functions/fn-1/versions",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ description: undefined }),
      })
    );
  });
});

// ─── ALIASES ────────────────────────────────────────────

describe("useLambdaAliases", () => {
  it("does NOT call api when name is null", () => {
    renderHook(() => useLambdaAliases(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with aliases URL when name provided", async () => {
    mockApi.mockResolvedValueOnce({ aliases: [], total: 0 });
    const { result } = renderHook(() => useLambdaAliases("fn-1"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/lambda/functions/fn-1/aliases");
  });
});

// ─── EVENT SOURCE MAPPINGS ──────────────────────────────

describe("useEventSourceMappings", () => {
  it("calls api without query string when functionName not provided", async () => {
    mockApi.mockResolvedValueOnce({ eventSourceMappings: [], total: 0 });
    const { result } = renderHook(() => useEventSourceMappings(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/lambda/event-source-mappings");
  });

  it("appends functionName when provided", async () => {
    mockApi.mockResolvedValueOnce({ eventSourceMappings: [], total: 0 });
    const { result } = renderHook(() => useEventSourceMappings("fn-1"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/lambda/event-source-mappings?functionName=fn-1"
    );
  });
});

describe("useDeleteEventSourceMapping", () => {
  it("calls api with DELETE method and uuid in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteEventSourceMapping(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync("uuid-123");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/lambda/event-source-mappings/uuid-123",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

// ─── LAYERS ─────────────────────────────────────────────

describe("useLambdaLayers", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ layers: [], total: 0 });
    const { result } = renderHook(() => useLambdaLayers(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/lambda/layers");
  });
});

describe("useLambdaLayerVersions", () => {
  it("does NOT call api when name is null", () => {
    renderHook(() => useLambdaLayerVersions(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with layer versions URL when name provided", async () => {
    mockApi.mockResolvedValueOnce({ versions: [], total: 0 });
    const { result } = renderHook(() => useLambdaLayerVersions("layer-1"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/lambda/layers/layer-1/versions");
  });
});

describe("useDeleteLayerVersion", () => {
  it("calls api with DELETE method, name + version in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteLayerVersion(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "layer-1", version: 3 });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/lambda/layers/layer-1/versions/3",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

// ─── TAGS ───────────────────────────────────────────────

describe("useLambdaTags", () => {
  it("does NOT call api when arn is null", () => {
    renderHook(() => useLambdaTags(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with arn in path when arn provided", async () => {
    mockApi.mockResolvedValueOnce({ tags: {} });
    const { result } = renderHook(() => useLambdaTags("arn:aws:lambda:us-east-1:1:function:fn-1"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/lambda/tags/arn:aws:lambda:us-east-1:1:function:fn-1"
    );
  });
});

// ─── FUNCTION URL ───────────────────────────────────────

describe("useFunctionUrl", () => {
  it("does NOT call api when name is null", () => {
    renderHook(() => useFunctionUrl(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with /url path when name provided", async () => {
    mockApi.mockResolvedValueOnce({ url: "https://x", authType: "NONE", cors: {}, invokeMode: "BUFFERED" });
    const { result } = renderHook(() => useFunctionUrl("fn-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/lambda/functions/fn-1/url");
  });
});

// ─── CONCURRENCY ────────────────────────────────────────

describe("useFunctionConcurrency", () => {
  it("does NOT call api when name is null", () => {
    renderHook(() => useFunctionConcurrency(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with /concurrency path when name provided", async () => {
    mockApi.mockResolvedValueOnce({ reservedConcurrentExecutions: 10 });
    const { result } = renderHook(() => useFunctionConcurrency("fn-1"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/lambda/functions/fn-1/concurrency");
  });
});
