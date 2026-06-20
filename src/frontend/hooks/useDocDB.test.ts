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
  useDocDBClusters,
  useCreateDocDBCluster,
  useDeleteDocDBCluster,
  useModifyDocDBCluster,
  useDocDBInstances,
  useCreateDocDBInstance,
  useDeleteDocDBInstance,
} from "./useDocDB";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

describe("useDocDBClusters", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ clusters: [], total: 0 });
    const { result } = renderHook(() => useDocDBClusters(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/docdb/clusters");
  });
});

describe("useCreateDocDBCluster", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateDocDBCluster(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ DBClusterIdentifier: "c1" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/docdb/clusters",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

describe("useDeleteDocDBCluster", () => {
  it("calls api with DELETE method and id in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteDocDBCluster(), { wrapper: createWrapper() });
    await result.current.mutateAsync("c1");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/docdb/clusters/c1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

describe("useModifyDocDBCluster", () => {
  it("calls api with PATCH method and id in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useModifyDocDBCluster(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ id: "c1", EngineVersion: "5.0" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/docdb/clusters/c1",
      expect.objectContaining({ method: "PATCH" }),
    );
  });
});

describe("useDocDBInstances", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ instances: [], total: 0 });
    const { result } = renderHook(() => useDocDBInstances(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/docdb/instances");
  });
});

describe("useCreateDocDBInstance", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateDocDBInstance(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ DBInstanceIdentifier: "i1", DBClusterIdentifier: "c1" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/docdb/instances",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

describe("useDeleteDocDBInstance", () => {
  it("calls api with DELETE method and id in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteDocDBInstance(), { wrapper: createWrapper() });
    await result.current.mutateAsync("i1");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/docdb/instances/i1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});
