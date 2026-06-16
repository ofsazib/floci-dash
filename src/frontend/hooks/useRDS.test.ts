// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const mockApi = vi.fn();
vi.mock("../lib/client", () => ({
  api: (...args: any[]) => mockApi(...args),
}));

import {
  useRDSDBInstances,
  useRDSDBInstance,
  useRDSCreateDBInstance,
  useRDSDeleteDBInstance,
  useRDSModifyDBInstance,
  useRDSRebootDBInstance,
  useRDSDBClusters,
  useRDSDBCluster,
  useRDSCreateDBCluster,
  useRDSDeleteDBCluster,
  useRDSParameterGroups,
  useRDSCreateParameterGroup,
  useRDSDeleteParameterGroup,
  useRDSParameterGroupParameters,
  useRDSModifyParameterGroupParameters,
  useRDSClusterParameterGroups,
  useRDSCreateClusterParameterGroup,
  useRDSDeleteClusterParameterGroup,
} from "./useRDS";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

// ─── DB Instances ─────────────────────────────────────────────────

describe("useRDSDBInstances", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ instances: [], total: 0 });
    const { result } = renderHook(() => useRDSDBInstances(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/rds/db-instances");
  });
});

describe("useRDSDBInstance", () => {
  it("does not call api when id is null", async () => {
    const { result } = renderHook(() => useRDSDBInstance(null), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with correct URL when id is provided", async () => {
    mockApi.mockResolvedValueOnce({ id: "db-1" });
    const { result } = renderHook(() => useRDSDBInstance("db-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/rds/db-instances/db-1");
  });
});

describe("useRDSCreateDBInstance", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useRDSCreateDBInstance(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ dbInstanceIdentifier: "db-1" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/rds/db-instances",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("serializes body to JSON", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useRDSCreateDBInstance(), { wrapper: createWrapper() });
    const payload = { dbInstanceIdentifier: "db-1", engine: "mysql" };
    await result.current.mutateAsync(payload);
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/rds/db-instances",
      expect.objectContaining({ body: JSON.stringify(payload) }),
    );
  });
});

describe("useRDSDeleteDBInstance", () => {
  it("calls api with DELETE method on the instance path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useRDSDeleteDBInstance(), { wrapper: createWrapper() });
    await result.current.mutateAsync("db-1");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/rds/db-instances/db-1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

describe("useRDSModifyDBInstance", () => {
  it("calls api with PATCH method and strips id from body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useRDSModifyDBInstance(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ id: "db-1", dbInstanceClass: "db.t3.micro" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/rds/db-instances/db-1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ dbInstanceClass: "db.t3.micro" }),
      }),
    );
  });
});

describe("useRDSRebootDBInstance", () => {
  it("calls api with POST method on the reboot path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useRDSRebootDBInstance(), { wrapper: createWrapper() });
    await result.current.mutateAsync("db-1");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/rds/db-instances/db-1/reboot",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

// ─── DB Clusters ──────────────────────────────────────────────────

describe("useRDSDBClusters", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ clusters: [], total: 0 });
    const { result } = renderHook(() => useRDSDBClusters(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/rds/db-clusters");
  });
});

describe("useRDSDBCluster", () => {
  it("does not call api when id is null", async () => {
    const { result } = renderHook(() => useRDSDBCluster(null), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with correct URL when id is provided", async () => {
    mockApi.mockResolvedValueOnce({ id: "cluster-1" });
    const { result } = renderHook(() => useRDSDBCluster("cluster-1"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/rds/db-clusters/cluster-1");
  });
});

describe("useRDSCreateDBCluster", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useRDSCreateDBCluster(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ dbClusterIdentifier: "cluster-1" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/rds/db-clusters",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

describe("useRDSDeleteDBCluster", () => {
  it("calls api with DELETE method on the cluster path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useRDSDeleteDBCluster(), { wrapper: createWrapper() });
    await result.current.mutateAsync("cluster-1");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/rds/db-clusters/cluster-1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

// ─── Parameter Groups ─────────────────────────────────────────────

describe("useRDSParameterGroups", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ parameterGroups: [], total: 0 });
    const { result } = renderHook(() => useRDSParameterGroups(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/rds/parameter-groups");
  });
});

describe("useRDSCreateParameterGroup", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useRDSCreateParameterGroup(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({ dbParameterGroupName: "pg-1" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/rds/parameter-groups",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

describe("useRDSDeleteParameterGroup", () => {
  it("calls api with DELETE method on the parameter group path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useRDSDeleteParameterGroup(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync("pg-1");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/rds/parameter-groups/pg-1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

describe("useRDSParameterGroupParameters", () => {
  it("does not call api when name is null", async () => {
    const { result } = renderHook(() => useRDSParameterGroupParameters(null), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with correct URL when name is provided", async () => {
    mockApi.mockResolvedValueOnce({ parameterGroup: "pg-1", parameters: [], total: 0 });
    const { result } = renderHook(() => useRDSParameterGroupParameters("pg-1"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/rds/parameter-groups/pg-1/parameters");
  });
});

describe("useRDSModifyParameterGroupParameters", () => {
  it("calls api with PATCH method and wraps parameters in body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useRDSModifyParameterGroupParameters(), {
      wrapper: createWrapper(),
    });
    const params = [{ parameterName: "p", parameterValue: "v" }];
    await result.current.mutateAsync({ name: "pg-1", parameters: params });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/rds/parameter-groups/pg-1/parameters",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ parameters: params }),
      }),
    );
  });
});

// ─── Cluster Parameter Groups ─────────────────────────────────────

describe("useRDSClusterParameterGroups", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ clusterParameterGroups: [], total: 0 });
    const { result } = renderHook(() => useRDSClusterParameterGroups(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/rds/cluster-parameter-groups");
  });
});

describe("useRDSCreateClusterParameterGroup", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useRDSCreateClusterParameterGroup(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({ dbClusterParameterGroupName: "cpg-1" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/rds/cluster-parameter-groups",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

describe("useRDSDeleteClusterParameterGroup", () => {
  it("calls api with DELETE method on the cluster parameter group path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useRDSDeleteClusterParameterGroup(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync("cpg-1");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/rds/cluster-parameter-groups/cpg-1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});
