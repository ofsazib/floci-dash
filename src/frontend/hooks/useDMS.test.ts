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
  useDmsSubnetGroups,
  useCreateDmsSubnetGroup,
  useDeleteDmsSubnetGroup,
  useDmsTags,
  useAddDmsTags,
  useRemoveDmsTags,
} from "./useDMS";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useDmsSubnetGroups", () => {
  it("fetches subnet groups", async () => {
    mockApi.mockResolvedValueOnce({ subnetGroups: [], total: 0 });
    const { result } = renderHook(() => useDmsSubnetGroups(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/dms/subnet-groups");
  });
});

describe("useCreateDmsSubnetGroup", () => {
  it("POSTs the group body", async () => {
    mockApi.mockResolvedValueOnce({ subnetGroup: {} });
    const { result } = renderHook(() => useCreateDmsSubnetGroup(), { wrapper: createWrapper() });
    await result.current.mutateAsync({
      replicationSubnetGroupIdentifier: "g1",
      replicationSubnetGroupDescription: "d",
      subnetIds: ["s1"],
    });
    expect(mockApi).toHaveBeenCalledWith("/aws/dms/subnet-groups", {
      method: "POST",
      body: JSON.stringify({
        replicationSubnetGroupIdentifier: "g1",
        replicationSubnetGroupDescription: "d",
        subnetIds: ["s1"],
      }),
    });
  });
});

describe("useDeleteDmsSubnetGroup", () => {
  it("DELETEs with encoded id", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useDeleteDmsSubnetGroup(), { wrapper: createWrapper() });
    await result.current.mutateAsync("g 1");
    expect(mockApi).toHaveBeenCalledWith("/aws/dms/subnet-groups/g%201", {
      method: "DELETE",
    });
  });
});

describe("useDmsTags", () => {
  it("fetches tags with encoded arn", async () => {
    mockApi.mockResolvedValueOnce({ tagList: [] });
    const { result } = renderHook(() => useDmsTags("arn:x"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/dms/resources/tags?arn=arn%3Ax");
  });

  it("does not fetch when arn is null", () => {
    renderHook(() => useDmsTags(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });
});

describe("useAddDmsTags", () => {
  it("POSTs resourceArn and tags", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useAddDmsTags(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ arn: "arn:x", tags: [{ Key: "env", Value: "dev" }] });
    expect(mockApi).toHaveBeenCalledWith("/aws/dms/resources/tags", {
      method: "POST",
      body: JSON.stringify({ resourceArn: "arn:x", tags: [{ Key: "env", Value: "dev" }] }),
    });
  });
});

describe("useRemoveDmsTags", () => {
  it("POSTs resourceArn and tagKeys", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useRemoveDmsTags(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ arn: "arn:x", tagKeys: ["env"] });
    expect(mockApi).toHaveBeenCalledWith("/aws/dms/resources/tags/untag", {
      method: "POST",
      body: JSON.stringify({ resourceArn: "arn:x", tagKeys: ["env"] }),
    });
  });
});
