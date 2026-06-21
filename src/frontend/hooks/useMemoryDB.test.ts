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
  useMemoryDBClusters,
  useMemoryDBCluster,
  useMemoryDBTags,
  useCreateMemoryDBCluster,
  useUpdateMemoryDBCluster,
  useDeleteMemoryDBCluster,
  useTagMemoryDBResource,
  useUntagMemoryDBResource,
} from "./useMemoryDB";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

describe("useMemoryDBClusters", () => {
  it("calls api with correct URL without name", async () => {
    mockApi.mockResolvedValueOnce({ clusters: [], total: 0 });
    const { result } = renderHook(() => useMemoryDBClusters(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/memorydb/clusters");
  });

  it("appends ?name= query when name provided", async () => {
    mockApi.mockResolvedValueOnce({ clusters: [], total: 0 });
    const { result } = renderHook(() => useMemoryDBClusters("my-cluster"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/memorydb/clusters?name=my-cluster");
  });
});

describe("useMemoryDBCluster", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ cluster: {} });
    const { result } = renderHook(() => useMemoryDBCluster("c1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/memorydb/clusters/c1");
  });

  it("is disabled when name is null", () => {
    const { result } = renderHook(() => useMemoryDBCluster(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useMemoryDBTags", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ tags: [], total: 0 });
    const { result } = renderHook(() => useMemoryDBTags("arn:aws:memorydb:::cluster/c1"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/memorydb/tags/arn%3Aaws%3Amemorydb%3A%3A%3Acluster%2Fc1");
  });

  it("is disabled when arn is null", () => {
    const { result } = renderHook(() => useMemoryDBTags(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useCreateMemoryDBCluster", () => {
  it("POSTs with correct body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateMemoryDBCluster(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ ClusterName: "my-cluster" });
    expect(mockApi).toHaveBeenCalledWith("/aws/memorydb/clusters", {
      method: "POST",
      body: JSON.stringify({ ClusterName: "my-cluster" }),
    });
  });
});

describe("useUpdateMemoryDBCluster", () => {
  it("PATCHes with correct body and name in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useUpdateMemoryDBCluster(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "c1", description: "updated" });
    expect(mockApi).toHaveBeenCalledWith("/aws/memorydb/clusters/c1", {
      method: "PATCH",
      body: JSON.stringify({ description: "updated" }),
    });
  });
});

describe("useDeleteMemoryDBCluster", () => {
  it("DELETEs with name in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteMemoryDBCluster(), { wrapper: createWrapper() });
    await result.current.mutateAsync("c1");
    expect(mockApi).toHaveBeenCalledWith("/aws/memorydb/clusters/c1", { method: "DELETE" });
  });
});

describe("useTagMemoryDBResource", () => {
  it("POSTs tags with arn in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useTagMemoryDBResource(), { wrapper: createWrapper() });
    const tags = [{ Key: "env", Value: "prod" }];
    await result.current.mutateAsync({ arn: "arn:1", tags });
    expect(mockApi).toHaveBeenCalledWith("/aws/memorydb/tags/arn%3A1", {
      method: "POST",
      body: JSON.stringify({ tags }),
    });
  });
});

describe("useUntagMemoryDBResource", () => {
  it("DELETEs with tagKeys body and arn in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useUntagMemoryDBResource(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ arn: "arn:1", tagKeys: ["env"] });
    expect(mockApi).toHaveBeenCalledWith("/aws/memorydb/tags/arn%3A1", {
      method: "DELETE",
      body: JSON.stringify({ tagKeys: ["env"] }),
    });
  });
});
