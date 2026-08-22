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
  useCreateFunctionUrl,
  useUpdateFunctionUrl,
  useDeleteFunctionUrl,
  useSetFunctionConcurrency,
  useDeleteFunctionConcurrency,
  useEventInvokeConfig,
  usePutEventInvokeConfig,
  useDeleteEventInvokeConfig,
  useCreateLayerVersion,
  useCodeSigningConfig,
  useAttachCodeSigningConfig,
  useDetachCodeSigningConfig,
  useCodeSigningConfigs,
  useCreateCodeSigningConfig,
  useDeleteCodeSigningConfig,
  useLambdaPolicy,
  useAddLambdaPermission,
  useRemoveLambdaPermission,
  useCreateEventSourceMapping,
  useUpdateEventSourceMapping,
  useUpdateLambdaAlias,
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

describe("useCreateEventSourceMapping", () => {
  it("posts mapping body and invalidates on success", async () => {
    mockApi.mockResolvedValueOnce({ eventSourceMapping: { UUID: "u1" } });
    const { result } = renderHook(() => useCreateEventSourceMapping("my-fn"), {
      wrapper: createWrapper(),
    });
    const data = await (result.current.mutateAsync as any)({
      eventSourceArn: "arn:aws:sqs:us-east-1::q1",
      functionName: "my-fn",
      startingPosition: "TRIM_HORIZON",
      batchSize: 5,
      maximumConcurrency: 3,
    });
    expect(data.eventSourceMapping.UUID).toBe("u1");
    expect(mockApi).toHaveBeenCalledWith("/aws/lambda/event-source-mappings", {
      method: "POST",
      body: JSON.stringify({
        eventSourceArn: "arn:aws:sqs:us-east-1::q1",
        functionName: "my-fn",
        startingPosition: "TRIM_HORIZON",
        batchSize: 5,
        maximumConcurrency: 3,
      }),
    });
  });
});

describe("useUpdateEventSourceMapping", () => {
  it("puts update body with uuid in path", async () => {
    mockApi.mockResolvedValueOnce({ eventSourceMapping: {} });
    const { result } = renderHook(() => useUpdateEventSourceMapping("my-fn"), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({
      uuid: "u1",
      batchSize: 10,
      enabled: false,
      maximumConcurrency: 7,
    });
    expect(mockApi).toHaveBeenCalledWith("/aws/lambda/event-source-mappings/u1", {
      method: "PUT",
      body: JSON.stringify({ batchSize: 10, enabled: false, maximumConcurrency: 7 }),
    });
  });
});

// ─── RESOURCE-BASED POLICY ──────────────────────────────

describe("useLambdaPolicy", () => {
  it("fetches policy when name provided", async () => {
    mockApi.mockResolvedValueOnce({ policy: { Statement: [] }, revisionId: "r1" });
    const { result } = renderHook(() => useLambdaPolicy("my-fn"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/lambda/functions/my-fn/policy");
  });

  it("is idle when name is null", () => {
    const { result } = renderHook(() => useLambdaPolicy(null), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useAddLambdaPermission", () => {
  it("posts permission body", async () => {
    mockApi.mockResolvedValueOnce({ statement: { Sid: "s1" } });
    const { result } = renderHook(() => useAddLambdaPermission("my-fn"), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({
      statementId: "s1",
      principal: "s3.amazonaws.com",
      action: "lambda:InvokeFunction",
      sourceArn: "arn:aws:s3:::b",
      sourceAccount: "123",
    });
    expect(mockApi).toHaveBeenCalledWith("/aws/lambda/functions/my-fn/policy", {
      method: "POST",
      body: JSON.stringify({
        statementId: "s1",
        principal: "s3.amazonaws.com",
        action: "lambda:InvokeFunction",
        sourceArn: "arn:aws:s3:::b",
        sourceAccount: "123",
      }),
    });
  });
});

describe("useRemoveLambdaPermission", () => {
  it("deletes statement by id", async () => {
    mockApi.mockResolvedValueOnce({ removed: true });
    const { result } = renderHook(() => useRemoveLambdaPermission("my-fn"), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync("s1");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/lambda/functions/my-fn/policy/s1",
      { method: "DELETE" }
    );
  });
});

describe("useUpdateLambdaAlias", () => {
  it("puts alias body with encoded names", async () => {
    mockApi.mockResolvedValueOnce({ alias: { Name: "prod" } });
    const { result } = renderHook(() => useUpdateLambdaAlias("my-fn"), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({
      aliasName: "prod",
      functionVersion: "3",
      description: "prod alias",
    });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/lambda/functions/my-fn/aliases/prod",
      {
        method: "PUT",
        body: JSON.stringify({
          aliasName: "prod",
          functionVersion: "3",
          description: "prod alias",
        }),
      }
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

describe("useSetFunctionConcurrency", () => {
  it("calls api with PUT method, name in path, value in body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useSetFunctionConcurrency(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "fn-1", reservedConcurrentExecutions: 5 });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/lambda/functions/fn-1/concurrency",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ reservedConcurrentExecutions: 5 }),
      })
    );
  });
});

describe("useDeleteFunctionConcurrency", () => {
  it("calls api with DELETE method and name in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteFunctionConcurrency(), { wrapper: createWrapper() });
    await result.current.mutateAsync("fn-1");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/lambda/functions/fn-1/concurrency",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

// ─── FUNCTION URL (CREATE/UPDATE) ───────────────────────

describe("useCreateFunctionUrl", () => {
  it("calls api with POST method, name in path, remaining fields in body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateFunctionUrl(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "fn-1", authType: "NONE" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/lambda/functions/fn-1/url",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ authType: "NONE" }),
      })
    );
  });
});

describe("useUpdateFunctionUrl", () => {
  it("calls api with PUT method, name in path, remaining fields in body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useUpdateFunctionUrl(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "fn-1", authType: "AWS_IAM" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/lambda/functions/fn-1/url",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ authType: "AWS_IAM" }),
      })
    );
  });
});

describe("useDeleteFunctionUrl", () => {
  it("calls api with DELETE method and name in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteFunctionUrl(), { wrapper: createWrapper() });
    await result.current.mutateAsync("fn-1");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/lambda/functions/fn-1/url",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

// ─── EVENT INVOKE CONFIG ────────────────────────────────

describe("useEventInvokeConfig", () => {
  it("does NOT call api when name is null", () => {
    renderHook(() => useEventInvokeConfig(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with /event-invoke-config path when name provided", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useEventInvokeConfig("fn-1"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/lambda/functions/fn-1/event-invoke-config");
  });
});

describe("usePutEventInvokeConfig", () => {
  it("calls api with PUT method, name in path, remaining fields in body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => usePutEventInvokeConfig(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "fn-1", maximumRetryAttempts: 2 });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/lambda/functions/fn-1/event-invoke-config",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ maximumRetryAttempts: 2 }),
      })
    );
  });
});

describe("useDeleteEventInvokeConfig", () => {
  it("calls api with DELETE method and name in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteEventInvokeConfig(), { wrapper: createWrapper() });
    await result.current.mutateAsync("fn-1");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/lambda/functions/fn-1/event-invoke-config",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

// ─── CREATE LAYER VERSION ───────────────────────────────

describe("useCreateLayerVersion", () => {
  it("calls api with POST method, name in path, remaining fields in body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateLayerVersion(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "layer-1", zipFile: "base64...", compatibleRuntimes: ["nodejs22.x"] });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/lambda/layers/layer-1/versions",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ zipFile: "base64...", compatibleRuntimes: ["nodejs22.x"] }),
      })
    );
  });
});

// ─── CODE SIGNING CONFIG ────────────────────────────────

describe("useCodeSigningConfig", () => {
  it("does NOT call api when name is null", () => {
    renderHook(() => useCodeSigningConfig(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with name in path when name provided", async () => {
    mockApi.mockResolvedValueOnce({ codeSigningConfigArn: "arn:1" });
    const { result } = renderHook(() => useCodeSigningConfig("fn-1"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/lambda/functions/fn-1/code-signing-config"
    );
  });
});

describe("useAttachCodeSigningConfig", () => {
  it("calls api with PUT method, name in path, arn in body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useAttachCodeSigningConfig(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({
      name: "fn-1",
      codeSigningConfigArn: "arn:cs:1",
    });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/lambda/functions/fn-1/code-signing-config",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ codeSigningConfigArn: "arn:cs:1" }),
      })
    );
  });

  it("invalidates the function code-signing query on success", async () => {
    mockApi.mockResolvedValueOnce({});
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useAttachCodeSigningConfig(), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: qc }, children),
    });
    await result.current.mutateAsync({
      name: "fn-1",
      codeSigningConfigArn: "arn:cs:1",
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["aws", "lambda", "functions", "fn-1", "code-signing-config"],
    });
  });
});

describe("useDetachCodeSigningConfig", () => {
  it("calls api with DELETE method and name in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDetachCodeSigningConfig(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync("fn-1");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/lambda/functions/fn-1/code-signing-config",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("invalidates the function code-signing query on success", async () => {
    mockApi.mockResolvedValueOnce({});
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useDetachCodeSigningConfig(), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: qc }, children),
    });
    await result.current.mutateAsync("fn-1");
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["aws", "lambda", "functions", "fn-1", "code-signing-config"],
    });
  });
});

describe("useCodeSigningConfigs", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ codeSigningConfigs: [], total: 0 });
    const { result } = renderHook(() => useCodeSigningConfigs(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/lambda/code-signing-configs");
  });
});

describe("useCreateCodeSigningConfig", () => {
  it("calls api with POST method and serialized body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateCodeSigningConfig(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({ description: "sig", signingProfiles: ["p1"] });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/lambda/code-signing-configs",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ description: "sig", signingProfiles: ["p1"] }),
      })
    );
  });

  it("invalidates the code-signing-configs query on success", async () => {
    mockApi.mockResolvedValueOnce({});
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useCreateCodeSigningConfig(), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: qc }, children),
    });
    await result.current.mutateAsync({ description: "sig" });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["aws", "lambda", "code-signing-configs"],
    });
  });
});

describe("useDeleteCodeSigningConfig", () => {
  it("calls api with DELETE method and encoded arn in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteCodeSigningConfig(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync("arn:aws:lambda:us-east-1:123:code-signing-config:csc-1");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/lambda/code-signing-configs/arn%3Aaws%3Alambda%3Aus-east-1%3A123%3Acode-signing-config%3Acsc-1",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("invalidates the code-signing-configs query on success", async () => {
    mockApi.mockResolvedValueOnce({});
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useDeleteCodeSigningConfig(), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: qc }, children),
    });
    await result.current.mutateAsync("arn:1");
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["aws", "lambda", "code-signing-configs"],
    });
  });
});
