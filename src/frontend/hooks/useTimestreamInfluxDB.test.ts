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
  useTsInstances,
  useCreateTsInstance,
  useDeleteTsInstance,
  useRebootTsInstance,
  useTsClusters,
  useCreateTsCluster,
  useDeleteTsCluster,
  useTsBackups,
  useCreateTsBackup,
  useDeleteTsBackup,
  useTsParameterGroups,
  useCreateTsParameterGroup,
} from "./useTimestreamInfluxDB";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useTsInstances", () => {
  it("fetches instances", async () => {
    mockApi.mockResolvedValueOnce({ instances: [], total: 0 });
    const { result } = renderHook(() => useTsInstances(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/timestreaminfluxdb/db-instances");
  });
});

describe("useCreateTsInstance", () => {
  it("POSTs the instance body", async () => {
    mockApi.mockResolvedValueOnce({ instance: {} });
    const { result } = renderHook(() => useCreateTsInstance(), { wrapper: createWrapper() });
    await result.current.mutateAsync({
      name: "influx-1",
      password: "pw",
      dbInstanceType: "db.influx.medium",
      vpcSubnetIds: ["s1"],
      vpcSecurityGroupIds: ["sg1"],
      allocatedStorage: 20,
    });
    expect(mockApi).toHaveBeenCalledWith("/aws/timestreaminfluxdb/db-instances", {
      method: "POST",
      body: JSON.stringify({
        name: "influx-1",
        password: "pw",
        dbInstanceType: "db.influx.medium",
        vpcSubnetIds: ["s1"],
        vpcSecurityGroupIds: ["sg1"],
        allocatedStorage: 20,
      }),
    });
  });
});

describe("useDeleteTsInstance", () => {
  it("DELETEs with encoded name", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useDeleteTsInstance(), { wrapper: createWrapper() });
    await result.current.mutateAsync("influx 1");
    expect(mockApi).toHaveBeenCalledWith("/aws/timestreaminfluxdb/db-instances/influx%201", {
      method: "DELETE",
    });
  });
});

describe("useRebootTsInstance", () => {
  it("POSTs reboot with encoded name", async () => {
    mockApi.mockResolvedValueOnce({ instance: {} });
    const { result } = renderHook(() => useRebootTsInstance(), { wrapper: createWrapper() });
    await result.current.mutateAsync("influx 1");
    expect(mockApi).toHaveBeenCalledWith("/aws/timestreaminfluxdb/db-instances/influx%201/reboot", {
      method: "POST",
    });
  });
});

describe("useTsClusters", () => {
  it("fetches clusters", async () => {
    mockApi.mockResolvedValueOnce({ clusters: [], total: 0 });
    const { result } = renderHook(() => useTsClusters(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/timestreaminfluxdb/db-clusters");
  });
});

describe("useCreateTsCluster", () => {
  it("POSTs the cluster body", async () => {
    mockApi.mockResolvedValueOnce({ cluster: {} });
    const { result } = renderHook(() => useCreateTsCluster(), { wrapper: createWrapper() });
    await result.current.mutateAsync({
      name: "cluster-1",
      dbInstanceType: "t",
      vpcSubnetIds: ["s1", "s2"],
    });
    expect(mockApi).toHaveBeenCalledWith("/aws/timestreaminfluxdb/db-clusters", {
      method: "POST",
      body: JSON.stringify({
        name: "cluster-1",
        dbInstanceType: "t",
        vpcSubnetIds: ["s1", "s2"],
      }),
    });
  });
});

describe("useDeleteTsCluster", () => {
  it("DELETEs with encoded name", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useDeleteTsCluster(), { wrapper: createWrapper() });
    await result.current.mutateAsync("cluster 1");
    expect(mockApi).toHaveBeenCalledWith("/aws/timestreaminfluxdb/db-clusters/cluster%201", {
      method: "DELETE",
    });
  });
});

describe("useTsBackups", () => {
  it("fetches backups", async () => {
    mockApi.mockResolvedValueOnce({ backups: [], total: 0 });
    const { result } = renderHook(() => useTsBackups(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/timestreaminfluxdb/db-backups");
  });
});

describe("useCreateTsBackup", () => {
  it("POSTs the backup body", async () => {
    mockApi.mockResolvedValueOnce({ backup: {} });
    const { result } = renderHook(() => useCreateTsBackup(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "b1", dbResourceId: "r1" });
    expect(mockApi).toHaveBeenCalledWith("/aws/timestreaminfluxdb/db-backups", {
      method: "POST",
      body: JSON.stringify({ name: "b1", dbResourceId: "r1" }),
    });
  });
});

describe("useDeleteTsBackup", () => {
  it("DELETEs with encoded name", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useDeleteTsBackup(), { wrapper: createWrapper() });
    await result.current.mutateAsync("b 1");
    expect(mockApi).toHaveBeenCalledWith("/aws/timestreaminfluxdb/db-backups/b%201", {
      method: "DELETE",
    });
  });
});

describe("useTsParameterGroups", () => {
  it("fetches parameter groups", async () => {
    mockApi.mockResolvedValueOnce({ parameterGroups: [], total: 0 });
    const { result } = renderHook(() => useTsParameterGroups(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/timestreaminfluxdb/db-parameter-groups");
  });
});

describe("useCreateTsParameterGroup", () => {
  it("POSTs the parameter group body", async () => {
    mockApi.mockResolvedValueOnce({ parameterGroup: {} });
    const { result } = renderHook(() => useCreateTsParameterGroup(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "pg1", description: "d", parameters: [] });
    expect(mockApi).toHaveBeenCalledWith("/aws/timestreaminfluxdb/db-parameter-groups", {
      method: "POST",
      body: JSON.stringify({ name: "pg1", description: "d", parameters: [] }),
    });
  });
});
