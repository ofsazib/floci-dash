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
  useRedshiftClusters,
  useCreateRedshiftCluster,
  useModifyRedshiftCluster,
  useRebootRedshiftCluster,
  useDeleteRedshiftCluster,
  useRedshiftSnapshots,
  useCreateRedshiftSnapshot,
  useDeleteRedshiftSnapshot,
  useRestoreRedshiftSnapshot,
  useRedshiftParameterGroups,
  useCreateRedshiftParameterGroup,
  useRedshiftParameters,
  useModifyRedshiftParameterGroup,
  useDeleteRedshiftParameterGroup,
  useRedshiftSubnetGroups,
  useCreateRedshiftSubnetGroup,
  useModifyRedshiftSubnetGroup,
  useDeleteRedshiftSubnetGroup,
  useRedshiftTagResource,
  useRedshiftUntagResource,
  useRedshiftTags,
} from "./useRedshift";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

describe("useRedshiftClusters", () => {
  it("calls api without identifier by default", async () => {
    mockApi.mockResolvedValueOnce({ clusters: [], total: 0 });
    const { result } = renderHook(() => useRedshiftClusters(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/redshift/clusters");
  });

  it("calls api with identifier when provided", async () => {
    mockApi.mockResolvedValueOnce({ clusters: [], total: 0 });
    renderHook(() => useRedshiftClusters("my-cluster"), { wrapper: createWrapper() });
    await waitFor(() =>
      expect(mockApi).toHaveBeenCalledWith("/aws/redshift/clusters?identifier=my-cluster")
    );
  });
});

describe("useCreateRedshiftCluster", () => {
  it("POSTs body", async () => {
    mockApi.mockResolvedValueOnce({ cluster: {} });
    const { result } = renderHook(() => useCreateRedshiftCluster(), { wrapper: createWrapper() });
    result.current.mutate({ identifier: "c1", nodeType: "ra3.xlplus" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/redshift/clusters", {
      method: "POST",
      body: JSON.stringify({ identifier: "c1", nodeType: "ra3.xlplus" }),
    });
  });
});

describe("useModifyRedshiftCluster", () => {
  it("PUTs to the encoded id", async () => {
    mockApi.mockResolvedValueOnce({ cluster: {} });
    const { result } = renderHook(() => useModifyRedshiftCluster(), { wrapper: createWrapper() });
    result.current.mutate({ id: "c 1", nodeType: "ra3.4xlarge" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/redshift/clusters/" + encodeURIComponent("c 1"), {
      method: "PUT",
      body: JSON.stringify({ nodeType: "ra3.4xlarge" }),
    });
  });
});

describe("useRebootRedshiftCluster", () => {
  it("POSTs reboot", async () => {
    mockApi.mockResolvedValueOnce({ cluster: {} });
    const { result } = renderHook(() => useRebootRedshiftCluster(), { wrapper: createWrapper() });
    result.current.mutate("c1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/redshift/clusters/c1/reboot", { method: "POST" });
  });
});

describe("useDeleteRedshiftCluster", () => {
  it("DELETEs by encoded id", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteRedshiftCluster(), { wrapper: createWrapper() });
    result.current.mutate("c 1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/redshift/clusters/" + encodeURIComponent("c 1"), {
      method: "DELETE",
    });
  });
});

describe("useRedshiftSnapshots", () => {
  it("calls api without identifier by default", async () => {
    mockApi.mockResolvedValueOnce({ snapshots: [], total: 0 });
    const { result } = renderHook(() => useRedshiftSnapshots(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/redshift/snapshots");
  });

  it("calls api with identifier when provided", async () => {
    mockApi.mockResolvedValueOnce({ snapshots: [], total: 0 });
    renderHook(() => useRedshiftSnapshots("my-cluster"), { wrapper: createWrapper() });
    await waitFor(() =>
      expect(mockApi).toHaveBeenCalledWith("/aws/redshift/snapshots?identifier=my-cluster")
    );
  });
});

describe("useCreateRedshiftSnapshot", () => {
  it("POSTs body", async () => {
    mockApi.mockResolvedValueOnce({ snapshot: {} });
    const { result } = renderHook(() => useCreateRedshiftSnapshot(), { wrapper: createWrapper() });
    result.current.mutate({ identifier: "c1", snapshotIdentifier: "snap-1" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/redshift/snapshots", {
      method: "POST",
      body: JSON.stringify({ identifier: "c1", snapshotIdentifier: "snap-1" }),
    });
  });
});

describe("useDeleteRedshiftSnapshot", () => {
  it("DELETEs by encoded id", async () => {
    mockApi.mockResolvedValueOnce({ snapshot: {} });
    const { result } = renderHook(() => useDeleteRedshiftSnapshot(), { wrapper: createWrapper() });
    result.current.mutate("snap 1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/redshift/snapshots/" + encodeURIComponent("snap 1"), {
      method: "DELETE",
    });
  });
});

describe("useRestoreRedshiftSnapshot", () => {
  it("POSTs restore body", async () => {
    mockApi.mockResolvedValueOnce({ cluster: {} });
    const { result } = renderHook(() => useRestoreRedshiftSnapshot(), { wrapper: createWrapper() });
    result.current.mutate({ snapshotIdentifier: "snap-1", targetIdentifier: "restored" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/redshift/snapshots/restore", {
      method: "POST",
      body: JSON.stringify({ snapshotIdentifier: "snap-1", targetIdentifier: "restored" }),
    });
  });
});

describe("useRedshiftParameterGroups", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ parameterGroups: [], total: 0 });
    const { result } = renderHook(() => useRedshiftParameterGroups(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/redshift/parameter-groups");
  });
});

describe("useCreateRedshiftParameterGroup", () => {
  it("POSTs body", async () => {
    mockApi.mockResolvedValueOnce({ parameterGroup: {} });
    const { result } = renderHook(() => useCreateRedshiftParameterGroup(), {
      wrapper: createWrapper(),
    });
    result.current.mutate({ name: "pg-1", family: "redshift-1.0" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/redshift/parameter-groups", {
      method: "POST",
      body: JSON.stringify({ name: "pg-1", family: "redshift-1.0" }),
    });
  });
});

describe("useRedshiftParameters", () => {
  it("does NOT call api when name is null", () => {
    renderHook(() => useRedshiftParameters(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with encoded name when provided", async () => {
    mockApi.mockResolvedValueOnce({ parameters: [], total: 0 });
    const { result } = renderHook(() => useRedshiftParameters("pg 1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/redshift/parameter-groups/" + encodeURIComponent("pg 1") + "/parameters"
    );
  });
});

describe("useModifyRedshiftParameterGroup", () => {
  it("PUTs parameters", async () => {
    mockApi.mockResolvedValueOnce({ updated: true });
    const { result } = renderHook(() => useModifyRedshiftParameterGroup(), {
      wrapper: createWrapper(),
    });
    result.current.mutate({ name: "pg-1", parameters: [{ name: "require_ssl", value: "true" }] });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/redshift/parameter-groups/pg-1", {
      method: "PUT",
      body: JSON.stringify({ parameters: [{ name: "require_ssl", value: "true" }] }),
    });
  });
});

describe("useDeleteRedshiftParameterGroup", () => {
  it("DELETEs by encoded name", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteRedshiftParameterGroup(), {
      wrapper: createWrapper(),
    });
    result.current.mutate("pg 1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/redshift/parameter-groups/" + encodeURIComponent("pg 1"),
      { method: "DELETE" }
    );
  });
});

describe("useRedshiftSubnetGroups", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ subnetGroups: [], total: 0 });
    const { result } = renderHook(() => useRedshiftSubnetGroups(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/redshift/subnet-groups");
  });
});

describe("useCreateRedshiftSubnetGroup", () => {
  it("POSTs body", async () => {
    mockApi.mockResolvedValueOnce({ subnetGroup: {} });
    const { result } = renderHook(() => useCreateRedshiftSubnetGroup(), { wrapper: createWrapper() });
    result.current.mutate({ name: "sg-1", subnetIds: ["subnet-1"] });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/redshift/subnet-groups", {
      method: "POST",
      body: JSON.stringify({ name: "sg-1", subnetIds: ["subnet-1"] }),
    });
  });
});

describe("useModifyRedshiftSubnetGroup", () => {
  it("PUTs body", async () => {
    mockApi.mockResolvedValueOnce({ subnetGroup: {} });
    const { result } = renderHook(() => useModifyRedshiftSubnetGroup(), { wrapper: createWrapper() });
    result.current.mutate({ name: "sg-1", subnetIds: ["subnet-2"] });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/redshift/subnet-groups/sg-1", {
      method: "PUT",
      body: JSON.stringify({ subnetIds: ["subnet-2"] }),
    });
  });
});

describe("useDeleteRedshiftSubnetGroup", () => {
  it("DELETEs by encoded name", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteRedshiftSubnetGroup(), { wrapper: createWrapper() });
    result.current.mutate("sg 1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/redshift/subnet-groups/" + encodeURIComponent("sg 1"), {
      method: "DELETE",
    });
  });
});

describe("useRedshiftTagResource", () => {
  it("POSTs tags", async () => {
    mockApi.mockResolvedValueOnce({ tagged: true });
    const { result } = renderHook(() => useRedshiftTagResource(), { wrapper: createWrapper() });
    result.current.mutate({ resourceName: "arn", tags: [{ key: "env", value: "dev" }] });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/redshift/tags", {
      method: "POST",
      body: JSON.stringify({ resourceName: "arn", tags: [{ key: "env", value: "dev" }] }),
    });
  });
});

describe("useRedshiftUntagResource", () => {
  it("POSTs tagKeys", async () => {
    mockApi.mockResolvedValueOnce({ untagged: true });
    const { result } = renderHook(() => useRedshiftUntagResource(), { wrapper: createWrapper() });
    result.current.mutate({ resourceName: "arn", tagKeys: ["env"] });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/redshift/tags/untag", {
      method: "POST",
      body: JSON.stringify({ resourceName: "arn", tagKeys: ["env"] }),
    });
  });
});

describe("useRedshiftTags", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ taggedResources: [], total: 0 });
    const { result } = renderHook(() => useRedshiftTags(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/redshift/tags");
  });
});
