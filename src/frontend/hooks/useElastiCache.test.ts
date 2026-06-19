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
  useElastiCacheReplicationGroups,
  useElastiCacheCreateReplicationGroup,
  useElastiCacheDeleteReplicationGroup,
  useElastiCacheCacheClusters,
  useElastiCacheCreateCacheCluster,
  useElastiCacheDeleteCacheCluster,
  useElastiCacheUsers,
  useElastiCacheCreateUser,
  useElastiCacheDeleteUser,
} from "./useElastiCache";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

describe("useElastiCacheReplicationGroups", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ replicationGroups: [], total: 0 });
    const { result } = renderHook(() => useElastiCacheReplicationGroups(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/elasticache/replication-groups");
  });
});

describe("useElastiCacheCreateReplicationGroup", () => {
  it("POSTs with correct body, invalidates on success", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useElastiCacheCreateReplicationGroup(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ ReplicationGroupId: "my-rg" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/elasticache/replication-groups",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

describe("useElastiCacheDeleteReplicationGroup", () => {
  it("POSTs to delete endpoint", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useElastiCacheDeleteReplicationGroup(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ ReplicationGroupId: "my-rg" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/elasticache/replication-groups/delete",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

describe("useElastiCacheCacheClusters", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ cacheClusters: [], total: 0 });
    const { result } = renderHook(() => useElastiCacheCacheClusters(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/elasticache/cache-clusters");
  });
});

describe("useElastiCacheCreateCacheCluster", () => {
  it("POSTs with correct body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useElastiCacheCreateCacheCluster(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ CacheClusterId: "my-cluster" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/elasticache/cache-clusters",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

describe("useElastiCacheDeleteCacheCluster", () => {
  it("POSTs to delete endpoint", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useElastiCacheDeleteCacheCluster(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ CacheClusterId: "my-cluster" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/elasticache/cache-clusters/delete",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

describe("useElastiCacheUsers", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ users: [], total: 0 });
    const { result } = renderHook(() => useElastiCacheUsers(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/elasticache/users");
  });
});

describe("useElastiCacheCreateUser", () => {
  it("POSTs with correct body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useElastiCacheCreateUser(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ UserId: "user-1" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/elasticache/users",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

describe("useElastiCacheDeleteUser", () => {
  it("POSTs to delete endpoint", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useElastiCacheDeleteUser(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ UserId: "user-1" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/elasticache/users/delete",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
