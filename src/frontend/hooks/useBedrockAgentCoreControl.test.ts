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
  useAgentRuntimes,
  useAgentRuntime,
  useCreateAgentRuntime,
  useUpdateAgentRuntime,
  useDeleteAgentRuntime,
  useAgentRuntimeVersions,
  useAgentRuntimeEndpoints,
  useAgentRuntimeEndpoint,
  useCreateAgentRuntimeEndpoint,
  useUpdateAgentRuntimeEndpoint,
  useDeleteAgentRuntimeEndpoint,
} from "./useBedrockAgentCoreControl";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

describe("useAgentRuntimes", () => {
  it("calls api with correct URL and method", async () => {
    mockApi.mockResolvedValueOnce({ agentRuntimes: [], nextToken: null });
    const { result } = renderHook(() => useAgentRuntimes(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/bedrockagentcorecontrol/runtimes", { method: "POST" });
    expect(result.current.data?.agentRuntimes).toEqual([]);
  });
});

describe("useAgentRuntime", () => {
  it("fetches when id provided", async () => {
    mockApi.mockResolvedValueOnce({ runtimeId: "r-1" });
    const { result } = renderHook(() => useAgentRuntime("r-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/bedrockagentcorecontrol/runtimes/r-1");
  });

  it("disabled when id is null", () => {
    const { result } = renderHook(() => useAgentRuntime(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
    expect(mockApi).not.toHaveBeenCalled();
  });
});

describe("useCreateAgentRuntime", () => {
  it("calls PUT and invalidates cache", async () => {
    mockApi.mockResolvedValueOnce({ runtimeId: "new" });
    const { result } = renderHook(() => useCreateAgentRuntime(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "test" });
    expect(mockApi).toHaveBeenCalledWith("/aws/bedrockagentcorecontrol/runtimes", {
      method: "PUT",
      body: JSON.stringify({ name: "test" }),
    });
  });
});

describe("useUpdateAgentRuntime", () => {
  it("calls PUT with id and invalidates cache", async () => {
    mockApi.mockResolvedValueOnce({ runtimeId: "r-1" });
    const { result } = renderHook(() => useUpdateAgentRuntime(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ id: "r-1", body: { name: "updated" } });
    expect(mockApi).toHaveBeenCalledWith("/aws/bedrockagentcorecontrol/runtimes/r-1", {
      method: "PUT",
      body: JSON.stringify({ name: "updated" }),
    });
  });
});

describe("useDeleteAgentRuntime", () => {
  it("calls DELETE and invalidates cache", async () => {
    mockApi.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useDeleteAgentRuntime(), { wrapper: createWrapper() });
    await result.current.mutateAsync("r-1");
    expect(mockApi).toHaveBeenCalledWith("/aws/bedrockagentcorecontrol/runtimes/r-1", { method: "DELETE" });
  });
});

describe("useAgentRuntimeVersions", () => {
  it("fetches versions when id provided", async () => {
    mockApi.mockResolvedValueOnce({ agentRuntimes: [] });
    const { result } = renderHook(() => useAgentRuntimeVersions("r-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/bedrockagentcorecontrol/runtimes/r-1/versions", { method: "POST" });
  });

  it("disabled when id is null", () => {
    const { result } = renderHook(() => useAgentRuntimeVersions(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useAgentRuntimeEndpoints", () => {
  it("fetches endpoints when id provided", async () => {
    mockApi.mockResolvedValueOnce({ runtimeEndpoints: [] });
    const { result } = renderHook(() => useAgentRuntimeEndpoints("r-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/bedrockagentcorecontrol/runtimes/r-1/endpoints", { method: "POST" });
  });

  it("disabled when id is null", () => {
    const { result } = renderHook(() => useAgentRuntimeEndpoints(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useAgentRuntimeEndpoint", () => {
  it("fetches when both ids provided", async () => {
    mockApi.mockResolvedValueOnce({ name: "ep-1" });
    const { result } = renderHook(() => useAgentRuntimeEndpoint("r-1", "ep-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/bedrockagentcorecontrol/runtimes/r-1/endpoints/ep-1");
  });

  it("disabled when runtimeId is null", () => {
    const { result } = renderHook(() => useAgentRuntimeEndpoint(null, "ep-1"), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("disabled when endpointName is null", () => {
    const { result } = renderHook(() => useAgentRuntimeEndpoint("r-1", null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useCreateAgentRuntimeEndpoint", () => {
  it("calls PUT with runtimeId and invalidates", async () => {
    mockApi.mockResolvedValueOnce({ name: "new-ep" });
    const { result } = renderHook(() => useCreateAgentRuntimeEndpoint(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ runtimeId: "r-1", body: { name: "new-ep" } });
    expect(mockApi).toHaveBeenCalledWith("/aws/bedrockagentcorecontrol/runtimes/r-1/endpoints", {
      method: "PUT",
      body: JSON.stringify({ name: "new-ep" }),
    });
  });
});

describe("useUpdateAgentRuntimeEndpoint", () => {
  it("calls PUT with runtimeId + name", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useUpdateAgentRuntimeEndpoint(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ runtimeId: "r-1", name: "ep-1", body: { config: {} } });
    expect(mockApi).toHaveBeenCalledWith("/aws/bedrockagentcorecontrol/runtimes/r-1/endpoints/ep-1", {
      method: "PUT",
      body: JSON.stringify({ config: {} }),
    });
  });
});

describe("useDeleteAgentRuntimeEndpoint", () => {
  it("calls DELETE with runtimeId + name", async () => {
    mockApi.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useDeleteAgentRuntimeEndpoint(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ runtimeId: "r-1", name: "ep-1" });
    expect(mockApi).toHaveBeenCalledWith("/aws/bedrockagentcorecontrol/runtimes/r-1/endpoints/ep-1", { method: "DELETE" });
  });
});
