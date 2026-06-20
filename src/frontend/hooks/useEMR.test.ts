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
  useEMRClusters,
  useRunEMRJobFlow,
  useEMRCluster,
  useTerminateEMRJobFlows,
  useEMRSteps,
  useAddEMRSteps,
  useEMRSecurityConfigurations,
  useCreateEMRSecurityConfiguration,
  useDeleteEMRSecurityConfiguration,
} from "./useEMR";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

describe("useEMRClusters", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ clusters: [], total: 0 });
    const { result } = renderHook(() => useEMRClusters(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/emr/clusters");
  });
});

describe("useRunEMRJobFlow", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useRunEMRJobFlow(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ Name: "test-cluster" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/emr/clusters",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

describe("useEMRCluster", () => {
  it("does NOT call api when id is null", () => {
    renderHook(() => useEMRCluster(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with id in path when provided", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useEMRCluster("j-123"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/emr/clusters/j-123");
  });
});

describe("useTerminateEMRJobFlows", () => {
  it("calls api with DELETE method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useTerminateEMRJobFlows(), { wrapper: createWrapper() });
    await result.current.mutateAsync("j-123");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/emr/clusters/j-123",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

describe("useEMRSteps", () => {
  it("does NOT call api when clusterId is null", () => {
    renderHook(() => useEMRSteps(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with clusterId in path when provided", async () => {
    mockApi.mockResolvedValueOnce({ steps: [] });
    const { result } = renderHook(() => useEMRSteps("j-123"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/emr/clusters/j-123/steps");
  });
});

describe("useAddEMRSteps", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useAddEMRSteps(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ clusterId: "j-123", Steps: [{ Name: "step1" }] });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/emr/clusters/j-123/steps",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

describe("useEMRSecurityConfigurations", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ securityConfigurations: [], total: 0 });
    const { result } = renderHook(() => useEMRSecurityConfigurations(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/emr/security-configurations");
  });
});

describe("useCreateEMRSecurityConfiguration", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateEMRSecurityConfiguration(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ Name: "sc1", SecurityConfiguration: "{}" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/emr/security-configurations",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

describe("useDeleteEMRSecurityConfiguration", () => {
  it("calls api with DELETE method and name in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteEMRSecurityConfiguration(), { wrapper: createWrapper() });
    await result.current.mutateAsync("sc1");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/emr/security-configurations/sc1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});
