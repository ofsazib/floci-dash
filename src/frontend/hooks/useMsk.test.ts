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
  useMskClusters,
  useMskCluster,
  useCreateMskCluster,
  useDeleteMskCluster,
  useMskBootstrapBrokers,
} from "./useMsk";

beforeEach(() => mockApi.mockReset());

const ARN = "arn:aws:kafka:us-east-1:123:cluster/my-cluster/abc-123";

describe("useMsk hooks", () => {
  it("useMskClusters calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ clusters: [], total: 0 });
    const { result } = renderHook(() => useMskClusters(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/msk/clusters");
  });

  it("useMskCluster calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ cluster: {} });
    const { result } = renderHook(() => useMskCluster(ARN), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(`/aws/msk/clusters/${encodeURIComponent(ARN)}`);
  });

  it("useMskCluster disabled when null", () => {
    const { result } = renderHook(() => useMskCluster(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useCreateMskCluster calls POST", async () => {
    mockApi.mockResolvedValueOnce({ clusterArn: ARN });
    const { result } = renderHook(() => useCreateMskCluster(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ clusterName: "my-cluster" });
    expect(mockApi).toHaveBeenCalledWith("/aws/msk/clusters", {
      method: "POST",
      body: JSON.stringify({ clusterName: "my-cluster" }),
    });
  });

  it("useDeleteMskCluster calls DELETE", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteMskCluster(), { wrapper: createWrapper() });
    await result.current.mutateAsync(ARN);
    expect(mockApi).toHaveBeenCalledWith(`/aws/msk/clusters/${encodeURIComponent(ARN)}`, { method: "DELETE" });
  });

  it("useMskBootstrapBrokers calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ bootstrapBrokerString: "host:9092" });
    const { result } = renderHook(() => useMskBootstrapBrokers(ARN), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(`/aws/msk/clusters/${encodeURIComponent(ARN)}/bootstrap-brokers`);
  });

  it("useMskBootstrapBrokers disabled when null", () => {
    const { result } = renderHook(() => useMskBootstrapBrokers(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });
});
