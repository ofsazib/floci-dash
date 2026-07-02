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
  usePipelines,
  useCreatePipeline,
  usePipeline,
  usePipelineState,
  useDeletePipeline,
  usePipelineExecutions,
  useStartPipelineExecution,
  useStopPipelineExecution,
  useRetryStageExecution,
  useWebhooks,
  useCreateWebhook,
  useDeleteWebhook,
  useActionTypes,
  useCreateCustomActionType,
} from "./useCodePipeline";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

// ─── Pipelines ─────────────────────────────────────────

describe("usePipelines", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ pipelines: [], total: 0 });
    const { result } = renderHook(() => usePipelines(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/codepipeline/pipelines");
  });
});

describe("useCreatePipeline", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreatePipeline(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ pipeline: { name: "test" } });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/codepipeline/pipelines",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("invalidates pipelines query on success", async () => {
    mockApi.mockResolvedValueOnce({});
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useCreatePipeline(), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: qc }, children),
    });
    await result.current.mutateAsync({ pipeline: { name: "test" } });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["aws", "codepipeline", "pipelines"] });
  });
});

describe("usePipeline", () => {
  it("does NOT call api when name is null", () => {
    renderHook(() => usePipeline(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with encoded name in path", async () => {
    mockApi.mockResolvedValueOnce({ pipeline: {}, metadata: {} });
    const { result } = renderHook(() => usePipeline("my-pipeline"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/codepipeline/pipelines/my-pipeline");
  });
});

describe("usePipelineState", () => {
  it("does NOT call api when name is null", () => {
    renderHook(() => usePipelineState(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with name in path", async () => {
    mockApi.mockResolvedValueOnce({ state: {} });
    const { result } = renderHook(() => usePipelineState("my-pipeline"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/codepipeline/pipelines/my-pipeline/state");
  });
});

describe("useDeletePipeline", () => {
  it("calls api with DELETE method and name in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeletePipeline(), { wrapper: createWrapper() });
    await result.current.mutateAsync("my-pipeline");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/codepipeline/pipelines/my-pipeline",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

// ─── Executions ────────────────────────────────────────

describe("usePipelineExecutions", () => {
  it("does NOT call api when name is null", () => {
    renderHook(() => usePipelineExecutions(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with name in path", async () => {
    mockApi.mockResolvedValueOnce({ executions: [], total: 0 });
    const { result } = renderHook(() => usePipelineExecutions("my-pipeline"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/codepipeline/pipelines/my-pipeline/executions");
  });
});

describe("useStartPipelineExecution", () => {
  it("calls api with POST method and name in path", async () => {
    mockApi.mockResolvedValueOnce({ pipelineExecutionId: "exec-1" });
    const { result } = renderHook(() => useStartPipelineExecution(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "my-pipeline" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/codepipeline/pipelines/my-pipeline/executions",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("invalidates executions query on success", async () => {
    mockApi.mockResolvedValueOnce({ pipelineExecutionId: "exec-1" });
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useStartPipelineExecution(), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: qc }, children),
    });
    await result.current.mutateAsync({ name: "my-pipeline" });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["aws", "codepipeline", "pipelines", "my-pipeline", "executions"],
    });
  });
});

describe("useStopPipelineExecution", () => {
  it("calls api with POST method and encoded params", async () => {
    mockApi.mockResolvedValueOnce({ pipelineExecutionId: "exec-1" });
    const { result } = renderHook(() => useStopPipelineExecution(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "my-pipeline", executionId: "exec-1", abandon: false, reason: "test" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/codepipeline/pipelines/my-pipeline/executions/exec-1/stop",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

describe("useRetryStageExecution", () => {
  it("calls api with POST method and retryMode", async () => {
    mockApi.mockResolvedValueOnce({ pipelineExecutionId: "exec-1" });
    const { result } = renderHook(() => useRetryStageExecution(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "my-pipeline", executionId: "exec-1", retryMode: "FAILED_ACTIONS" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/codepipeline/pipelines/my-pipeline/executions/exec-1/retry",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

// ─── Webhooks ──────────────────────────────────────────

describe("useWebhooks", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ webhooks: [], total: 0 });
    const { result } = renderHook(() => useWebhooks(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/codepipeline/webhooks");
  });
});

describe("useCreateWebhook", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateWebhook(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ webhook: { name: "test" } });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/codepipeline/webhooks",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("invalidates webhooks query on success", async () => {
    mockApi.mockResolvedValueOnce({});
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useCreateWebhook(), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: qc }, children),
    });
    await result.current.mutateAsync({ webhook: { name: "test" } });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["aws", "codepipeline", "webhooks"] });
  });
});

describe("useDeleteWebhook", () => {
  it("calls api with DELETE method and encoded name", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteWebhook(), { wrapper: createWrapper() });
    await result.current.mutateAsync("my-hook");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/codepipeline/webhooks/my-hook",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

// ─── Action Types ──────────────────────────────────────

describe("useActionTypes", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ actionTypes: [], total: 0 });
    const { result } = renderHook(() => useActionTypes(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/codepipeline/action-types");
  });
});

describe("useCreateCustomActionType", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateCustomActionType(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ actionType: { category: "Build", provider: "MyProvider" } });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/codepipeline/action-types",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("invalidates action types query on success", async () => {
    mockApi.mockResolvedValueOnce({});
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useCreateCustomActionType(), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: qc }, children),
    });
    await result.current.mutateAsync({ actionType: { category: "Build", provider: "MyProvider" } });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["aws", "codepipeline", "action-types"] });
  });
});
