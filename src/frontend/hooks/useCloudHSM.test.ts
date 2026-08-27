// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createWrapper } from "../../test/helpers";

const mockApi = vi.fn();
vi.mock("../lib/client", () => ({
  api: (...args: any[]) => mockApi(...args),
}));

import {
  useCloudHsmClusters,
  useCloudHsmBackups,
  useCreateCloudHsmCluster,
  useDeleteCloudHsmCluster,
  useDeleteCloudHsmBackup,
} from "./useCloudHSM";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("CloudHSM hooks", () => {
  it("useCloudHsmClusters fetches", async () => {
    mockApi.mockResolvedValueOnce({ clusters: [], total: 0, nextToken: null });
    const { result } = renderHook(() => useCloudHsmClusters(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudhsm/clusters");
  });

  it("useCloudHsmBackups fetches", async () => {
    mockApi.mockResolvedValueOnce({ backups: [], total: 0, nextToken: null });
    const { result } = renderHook(() => useCloudHsmBackups(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudhsm/backups");
  });

  it("useCreateCloudHsmCluster posts", async () => {
    mockApi.mockResolvedValueOnce({ clusterId: "c" });
    const body = { hsmType: "hsm1.medium", subnetIds: ["s1"] };
    const { result } = renderHook(() => useCreateCloudHsmCluster(), {
      wrapper: createWrapper(),
    });
    result.current.mutate(body);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudhsm/clusters", {
      method: "POST",
      body: JSON.stringify(body),
    });
  });

  it("useDeleteCloudHsmCluster deletes encoded", async () => {
    mockApi.mockResolvedValueOnce({ state: "DELETED" });
    const { result } = renderHook(() => useDeleteCloudHsmCluster(), {
      wrapper: createWrapper(),
    });
    result.current.mutate("c 1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudhsm/clusters/c%201", {
      method: "DELETE",
    });
  });

  it("useDeleteCloudHsmBackup deletes encoded", async () => {
    mockApi.mockResolvedValueOnce({ state: "DELETED" });
    const { result } = renderHook(() => useDeleteCloudHsmBackup(), {
      wrapper: createWrapper(),
    });
    result.current.mutate("b 1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudhsm/backups/b%201", {
      method: "DELETE",
    });
  });
});
