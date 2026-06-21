// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createWrapper } from "../../test/helpers";

const mockApi = vi.hoisted(() => vi.fn());
vi.mock("../lib/client", () => ({ api: (...args: any[]) => mockApi(...args) }));
vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual: any = await importOriginal();
  return { ...actual, useQueryClient: () => ({ invalidateQueries: vi.fn() }) };
});

import {
  useCloudMapNamespaces,
  useCreateCloudMapNamespace,
  useDeleteCloudMapNamespace,
  useCloudMapServices,
  useDeleteCloudMapService,
  useCloudMapInstances,
} from "./useCloudMap";

beforeEach(() => mockApi.mockReset());

describe("useCloudMap hooks", () => {
  it("useCloudMapNamespaces calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ namespaces: [], total: 0 });
    const { result } = renderHook(() => useCloudMapNamespaces(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/servicediscovery/namespaces");
  });

  it("useCreateCloudMapNamespace calls POST", async () => {
    mockApi.mockResolvedValueOnce({ operationId: "op-1" });
    const { result } = renderHook(() => useCreateCloudMapNamespace(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "my-ns" });
    expect(mockApi).toHaveBeenCalledWith("/aws/servicediscovery/namespaces", {
      method: "POST",
      body: JSON.stringify({ name: "my-ns" }),
    });
  });

  it("useDeleteCloudMapNamespace calls DELETE", async () => {
    mockApi.mockResolvedValueOnce({ operationId: "op-1" });
    const { result } = renderHook(() => useDeleteCloudMapNamespace(), { wrapper: createWrapper() });
    await result.current.mutateAsync("ns-1");
    expect(mockApi).toHaveBeenCalledWith("/aws/servicediscovery/namespaces/ns-1", { method: "DELETE" });
  });

  it("useCloudMapServices calls correct URL with no filter", async () => {
    mockApi.mockResolvedValueOnce({ services: [], total: 0 });
    const { result } = renderHook(() => useCloudMapServices(null), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/servicediscovery/services");
  });

  it("useCloudMapServices with namespaceId filter", async () => {
    mockApi.mockResolvedValueOnce({ services: [], total: 0 });
    const { result } = renderHook(() => useCloudMapServices("ns-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/servicediscovery/services?namespaceId=ns-1");
  });

  it("useDeleteCloudMapService calls DELETE", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteCloudMapService(), { wrapper: createWrapper() });
    await result.current.mutateAsync("svc-1");
    expect(mockApi).toHaveBeenCalledWith("/aws/servicediscovery/services/svc-1", { method: "DELETE" });
  });

  it("useCloudMapInstances calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ instances: [], total: 0 });
    const { result } = renderHook(() => useCloudMapInstances("svc-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/servicediscovery/services/svc-1/instances");
  });

  it("useCloudMapInstances disabled when null", () => {
    const { result } = renderHook(() => useCloudMapInstances(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });
});
