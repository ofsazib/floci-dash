// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createWrapper } from "../../test/helpers";

const mockApi = vi.hoisted(() => vi.fn());

vi.mock("../lib/client", () => ({
  api: (...args: any[]) => mockApi(...args),
}));

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  };
});

import {
  useNeptuneClusters,
  useNeptuneCluster,
  useCreateNeptuneCluster,
  useDeleteNeptuneCluster,
  useNeptuneInstances,
  useCreateNeptuneInstance,
  useDeleteNeptuneInstance,
  useModifyNeptuneCluster,
  useModifyNeptuneInstance,
} from "./useNeptune";

beforeEach(() => mockApi.mockReset());

describe("useNeptune hooks", () => {
  it("useNeptuneClusters calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ clusters: [], total: 0 });
    const { result } = renderHook(() => useNeptuneClusters(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/neptune/clusters");
  });

  it("useNeptuneCluster calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ cluster: {} });
    const { result } = renderHook(() => useNeptuneCluster("c1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/neptune/clusters/c1");
  });

  it("useNeptuneCluster disabled when null", () => {
    const { result } = renderHook(() => useNeptuneCluster(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useCreateNeptuneCluster calls POST", async () => {
    mockApi.mockResolvedValueOnce({ cluster: {} });
    const { result } = renderHook(() => useCreateNeptuneCluster(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ dbClusterIdentifier: "c1" });
    expect(mockApi).toHaveBeenCalledWith("/aws/neptune/clusters", {
      method: "POST",
      body: JSON.stringify({ dbClusterIdentifier: "c1" }),
    });
  });

  it("useDeleteNeptuneCluster calls DELETE", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteNeptuneCluster(), { wrapper: createWrapper() });
    await result.current.mutateAsync("c1");
    expect(mockApi).toHaveBeenCalledWith("/aws/neptune/clusters/c1", { method: "DELETE" });
  });

  it("useNeptuneInstances calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ instances: [], total: 0 });
    const { result } = renderHook(() => useNeptuneInstances(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/neptune/instances");
  });

  it("useCreateNeptuneInstance calls POST", async () => {
    mockApi.mockResolvedValueOnce({ instance: {} });
    const { result } = renderHook(() => useCreateNeptuneInstance(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ dbInstanceIdentifier: "i1", dbClusterIdentifier: "c1" });
    expect(mockApi).toHaveBeenCalledWith("/aws/neptune/instances", {
      method: "POST",
      body: JSON.stringify({ dbInstanceIdentifier: "i1", dbClusterIdentifier: "c1" }),
    });
  });

  it("useDeleteNeptuneInstance calls DELETE", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteNeptuneInstance(), { wrapper: createWrapper() });
    await result.current.mutateAsync("i1");
    expect(mockApi).toHaveBeenCalledWith("/aws/neptune/instances/i1", { method: "DELETE" });
  });
});

describe("useModifyNeptuneCluster", () => {
  it("calls api with PATCH and body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useModifyNeptuneCluster(), { wrapper: createWrapper() });
    result.current.mutate({ id: "c 1", engineVersion: "1.3" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/neptune/clusters/c%201", {
      method: "PATCH",
      body: JSON.stringify({"engineVersion":"1.3","iamDatabaseAuthenticationEnabled":undefined}),
    });
  });
});

describe("useModifyNeptuneInstance", () => {
  it("calls api with PATCH and body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useModifyNeptuneInstance(), { wrapper: createWrapper() });
    result.current.mutate({ id: "i 1", instanceClass: "db.r5.large" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/neptune/instances/i%201", {
      method: "PATCH",
      body: JSON.stringify({"instanceClass":"db.r5.large"}),
    });
  });
});
