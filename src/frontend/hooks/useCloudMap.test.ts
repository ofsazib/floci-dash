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
  useRegisterCloudMapInstance,
  useDeregisterCloudMapInstance,
  useDiscoverCloudMapInstances,
  useCloudMapOperations,
  useCloudMapOperation,
  useCloudMapInstance,
  useCreateCloudMapPrivateDnsNamespace,
  useCreateCloudMapPublicDnsNamespace,
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

describe("CloudMap registration hooks", () => {
  it("useRegisterCloudMapInstance posts the registration", async () => {
    mockApi.mockResolvedValueOnce({ operationId: "op-1" });
    const { result } = renderHook(() => useRegisterCloudMapInstance(), { wrapper: createWrapper() });
    result.current.mutate({ serviceId: "s 1", instanceId: "i-1", attributes: { A: "B" } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/servicediscovery/services/s%201/instances", {
      method: "POST",
      body: JSON.stringify({ instanceId: "i-1", attributes: { A: "B" } }),
    });
  });

  it("useDeregisterCloudMapInstance deletes both ids encoded", async () => {
    mockApi.mockResolvedValueOnce({ operationId: "op-2" });
    const { result } = renderHook(() => useDeregisterCloudMapInstance(), { wrapper: createWrapper() });
    result.current.mutate({ serviceId: "s/1", instanceId: "i 1" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/servicediscovery/services/s%2F1/instances/i%201", {
      method: "DELETE",
    });
  });

  it("useDiscoverCloudMapInstances posts the discover body", async () => {
    mockApi.mockResolvedValueOnce({ instances: [], total: 0 });
    const { result } = renderHook(() => useDiscoverCloudMapInstances(), { wrapper: createWrapper() });
    result.current.mutate({ namespaceName: "ns", serviceName: "svc" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/servicediscovery/discover", {
      method: "POST",
      body: JSON.stringify({ namespaceName: "ns", serviceName: "svc" }),
    });
  });
});

describe("CloudMap operations/namespaces hooks", () => {
  it("useCloudMapOperations fetches", async () => {
    mockApi.mockResolvedValueOnce({ operations: [], total: 0 });
    const { result } = renderHook(() => useCloudMapOperations(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/servicediscovery/operations");
  });

  it("useCloudMapOperation fetches encoded id", async () => {
    mockApi.mockResolvedValueOnce({ operation: null });
    const { result } = renderHook(() => useCloudMapOperation("op 1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/servicediscovery/operations/op%201");
  });

  it("useCloudMapOperation disabled without id", () => {
    const { result } = renderHook(() => useCloudMapOperation(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useCloudMapInstance fetches both encoded", async () => {
    mockApi.mockResolvedValueOnce({ instance: null });
    const { result } = renderHook(() => useCloudMapInstance("s 1", "i 1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/servicediscovery/services/s%201/instances/i%201");
  });

  it("useCloudMapInstance disabled without ids", () => {
    const { result } = renderHook(() => useCloudMapInstance("s", null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useCreateCloudMapPrivateDnsNamespace posts name+vpc", async () => {
    mockApi.mockResolvedValueOnce({ operationId: "op-1" });
    const { result } = renderHook(() => useCreateCloudMapPrivateDnsNamespace(), { wrapper: createWrapper() });
    result.current.mutate({ name: "corp.internal", vpc: "vpc-1" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/servicediscovery/namespaces/private-dns", {
      method: "POST",
      body: JSON.stringify({ name: "corp.internal", vpc: "vpc-1" }),
    });
  });

  it("useCreateCloudMapPublicDnsNamespace posts name", async () => {
    mockApi.mockResolvedValueOnce({ operationId: "op-2" });
    const { result } = renderHook(() => useCreateCloudMapPublicDnsNamespace(), { wrapper: createWrapper() });
    result.current.mutate({ name: "example.com" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/servicediscovery/namespaces/public-dns", {
      method: "POST",
      body: JSON.stringify({ name: "example.com" }),
    });
  });
});
