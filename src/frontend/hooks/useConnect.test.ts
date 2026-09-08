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
  useConnectInstances,
  useConnectInstance,
  useCreateConnectInstance,
  useDeleteConnectInstance,
  useConnectAttributes,
  useUpdateConnectAttribute,
  useConnectStorageConfigs,
  useAssociateConnectStorageConfig,
  useDisassociateConnectStorageConfig,
} from "./useConnect";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

describe("useConnectInstances", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ instances: [], total: 0 });
    const { result } = renderHook(() => useConnectInstances(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/connect/instances");
  });
});

describe("useConnectInstance", () => {
  it("does NOT call api when instanceId is null", () => {
    renderHook(() => useConnectInstance(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with encoded instanceId when provided", async () => {
    mockApi.mockResolvedValueOnce({ instance: {} });
    const { result } = renderHook(() => useConnectInstance("inst-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/connect/instances/inst-1");
  });
});

describe("useCreateConnectInstance", () => {
  it("POSTs body and invalidates instances", async () => {
    mockApi.mockResolvedValueOnce({ id: "inst-new" });
    const { result } = renderHook(() => useCreateConnectInstance(), { wrapper: createWrapper() });
    result.current.mutate({ IdentityManagementType: "CONNECT_MANAGED" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/connect/instances", {
      method: "POST",
      body: JSON.stringify({ IdentityManagementType: "CONNECT_MANAGED" }),
    });
  });
});

describe("useDeleteConnectInstance", () => {
  it("DELETEs by instanceId", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteConnectInstance(), { wrapper: createWrapper() });
    result.current.mutate("inst-1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/connect/instances/inst-1", { method: "DELETE" });
  });
});

describe("useConnectAttributes", () => {
  it("does NOT call api when instanceId is null", () => {
    renderHook(() => useConnectAttributes(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with encoded instanceId when provided", async () => {
    mockApi.mockResolvedValueOnce({ attributes: [], total: 0 });
    const { result } = renderHook(() => useConnectAttributes("inst-1"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/connect/instances/inst-1/attributes");
  });
});

describe("useUpdateConnectAttribute", () => {
  it("PUTs value and invalidates attributes", async () => {
    mockApi.mockResolvedValueOnce({ updated: true });
    const { result } = renderHook(() => useUpdateConnectAttribute(), { wrapper: createWrapper() });
    result.current.mutate({ instanceId: "inst-1", attributeType: "INBOUND_CALLS", value: "true" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/connect/instances/inst-1/attribute/INBOUND_CALLS", {
      method: "PUT",
      body: JSON.stringify({ value: "true" }),
    });
  });
});

describe("useConnectStorageConfigs", () => {
  it("does NOT call api when instanceId is null", () => {
    renderHook(() => useConnectStorageConfigs(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with encoded instanceId when provided", async () => {
    mockApi.mockResolvedValueOnce({ storageConfigs: [], total: 0 });
    const { result } = renderHook(() => useConnectStorageConfigs("inst-1"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/connect/instances/inst-1/storage-configs");
  });
});

describe("useAssociateConnectStorageConfig", () => {
  it("POSTs config body", async () => {
    mockApi.mockResolvedValueOnce({ associationId: "assoc-1" });
    const { result } = renderHook(() => useAssociateConnectStorageConfig(), {
      wrapper: createWrapper(),
    });
    result.current.mutate({
      instanceId: "inst-1",
      ResourceType: "CHAT_TRANSCRIPTS",
      StorageConfig: { StorageType: "S3" },
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/connect/instances/inst-1/storage-configs", {
      method: "POST",
      body: JSON.stringify({
        ResourceType: "CHAT_TRANSCRIPTS",
        StorageConfig: { StorageType: "S3" },
      }),
    });
  });
});

describe("useDisassociateConnectStorageConfig", () => {
  it("DELETEs by associationId", async () => {
    mockApi.mockResolvedValueOnce({ disassociated: true });
    const { result } = renderHook(() => useDisassociateConnectStorageConfig(), {
      wrapper: createWrapper(),
    });
    result.current.mutate({ instanceId: "inst-1", associationId: "assoc-1" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/connect/instances/inst-1/storage-configs/assoc-1", {
      method: "DELETE",
    });
  });
});
