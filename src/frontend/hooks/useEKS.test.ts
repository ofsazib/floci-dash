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
  useEKSClusters,
  useEKSCluster,
  useEKSCreateCluster,
  useEKSDeleteCluster,
  useEKSNodegroups,
  useEKSNodegroup,
  useEKSCreateNodegroup,
  useEKSDeleteNodegroup,
} from "./useEKS";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

// ─── CLUSTERS ─────────────────────────────────────────────

describe("useEKSClusters", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ clusters: [], total: 0 });
    const { result } = renderHook(() => useEKSClusters(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/eks/clusters");
  });

  it("forwards error", async () => {
    mockApi.mockRejectedValueOnce(new Error("fail"));
    const { result } = renderHook(() => useEKSClusters(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useEKSCluster", () => {
  it("does NOT call api when name is null", () => {
    renderHook(() => useEKSCluster(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with cluster name", async () => {
    mockApi.mockResolvedValueOnce({ cluster: { name: "my-cluster", status: "ACTIVE" } });
    const { result } = renderHook(() => useEKSCluster("my-cluster"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/eks/clusters/my-cluster");
  });
});

// ─── CREATE CLUSTER ───────────────────────────────────────

describe("useEKSCreateCluster", () => {
  it("calls api with POST method and body", async () => {
    mockApi.mockResolvedValueOnce({ cluster: { name: "new-cluster" } });
    const { result } = renderHook(() => useEKSCreateCluster(), { wrapper: createWrapper() });
    await result.current.mutateAsync({
      name: "new-cluster",
      roleArn: "arn:aws:iam::123456789012:role/eks-role",
    });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/eks/clusters",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          name: "new-cluster",
          roleArn: "arn:aws:iam::123456789012:role/eks-role",
          version: undefined,
          resourcesVpcConfig: undefined,
          tags: undefined,
        }),
      })
    );
  });

  it("invalidates clusters query on success", async () => {
    mockApi.mockResolvedValueOnce({ cluster: { name: "new-cluster" } });
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useEKSCreateCluster(), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: qc }, children),
    });
    await result.current.mutateAsync({
      name: "new-cluster",
      roleArn: "arn:aws:iam::123456789012:role/eks-role",
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["aws", "eks", "clusters"] });
  });
});

// ─── DELETE CLUSTER ───────────────────────────────────────

describe("useEKSDeleteCluster", () => {
  it("calls api with DELETE method", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useEKSDeleteCluster(), { wrapper: createWrapper() });
    await result.current.mutateAsync("my-cluster");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/eks/clusters/my-cluster",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("invalidates clusters query on success", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useEKSDeleteCluster(), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: qc }, children),
    });
    await result.current.mutateAsync("my-cluster");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["aws", "eks", "clusters"] });
  });
});

// ─── NODEGROUPS ───────────────────────────────────────────

describe("useEKSNodegroups", () => {
  it("does NOT call api when clusterName is null", () => {
    renderHook(() => useEKSNodegroups(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with cluster name", async () => {
    mockApi.mockResolvedValueOnce({ nodegroups: [], total: 0 });
    const { result } = renderHook(() => useEKSNodegroups("my-cluster"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/eks/clusters/my-cluster/node-groups");
  });
});

describe("useEKSNodegroup", () => {
  it("does NOT call api when clusterName is null", () => {
    renderHook(() => useEKSNodegroup(null, "my-ng"), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("does NOT call api when nodegroupName is null", () => {
    renderHook(() => useEKSNodegroup("my-cluster", null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with cluster and nodegroup names", async () => {
    mockApi.mockResolvedValueOnce({ nodegroup: { nodegroupName: "my-ng", status: "ACTIVE" } });
    const { result } = renderHook(() => useEKSNodegroup("my-cluster", "my-ng"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/eks/clusters/my-cluster/node-groups/my-ng");
  });
});

// ─── CREATE NODEGROUP ─────────────────────────────────────

describe("useEKSCreateNodegroup", () => {
  it("calls api with POST method and body", async () => {
    mockApi.mockResolvedValueOnce({ nodegroup: { nodegroupName: "new-ng" } });
    const { result } = renderHook(() => useEKSCreateNodegroup("my-cluster"), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({
      nodegroupName: "new-ng",
      nodeRole: "arn:aws:iam::123456789012:role/node-role",
      subnets: ["subnet-123"],
    });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/eks/clusters/my-cluster/node-groups",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          nodegroupName: "new-ng",
          nodeRole: "arn:aws:iam::123456789012:role/node-role",
          subnets: ["subnet-123"],
          instanceTypes: undefined,
          diskSize: undefined,
          scalingConfig: undefined,
          tags: undefined,
        }),
      })
    );
  });

  it("invalidates nodegroups query on success", async () => {
    mockApi.mockResolvedValueOnce({ nodegroup: { nodegroupName: "new-ng" } });
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useEKSCreateNodegroup("my-cluster"), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: qc }, children),
    });
    await result.current.mutateAsync({
      nodegroupName: "new-ng",
      nodeRole: "arn:aws:iam::123456789012:role/node-role",
      subnets: ["subnet-123"],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["aws", "eks", "nodegroups", "my-cluster"],
    });
  });
});

// ─── DELETE NODEGROUP ─────────────────────────────────────

describe("useEKSDeleteNodegroup", () => {
  it("calls api with DELETE method", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useEKSDeleteNodegroup("my-cluster"), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync("my-ng");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/eks/clusters/my-cluster/node-groups/my-ng",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("invalidates nodegroups query on success", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useEKSDeleteNodegroup("my-cluster"), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: qc }, children),
    });
    await result.current.mutateAsync("my-ng");
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["aws", "eks", "nodegroups", "my-cluster"],
    });
  });
});
