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
  useEC2NetworkAcls,
  useEC2CreateNetworkAcl,
  useEC2DeleteNetworkAcl,
  useEC2CreateNetworkAclEntry,
  useEC2DeleteNetworkAclEntry,
  useEC2ReplaceNetworkAclAssociation,
} from "./useEC2NetworkAcls";

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

describe("useEC2NetworkAcls", () => {
  it("calls api without filter", async () => {
    mockApi.mockResolvedValueOnce({ networkAcls: [], total: 0 });
    const { result } = renderHook(() => useEC2NetworkAcls(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ec2/network-acls?");
  });

  it("calls api with vpcId filter", async () => {
    mockApi.mockResolvedValueOnce({ networkAcls: [], total: 0 });
    const { result } = renderHook(() => useEC2NetworkAcls("vpc-123"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ec2/network-acls?vpcId=vpc-123"
    );
  });

  it("returns data", async () => {
    const data = {
      networkAcls: [{ networkAclId: "acl-abc", vpcId: "vpc-x", isDefault: true, entries: [], associations: [], tags: [] }],
      total: 1,
    };
    mockApi.mockResolvedValueOnce(data);
    const { result } = renderHook(() => useEC2NetworkAcls(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(data);
  });
});

describe("useEC2CreateNetworkAcl", () => {
  it("calls api with POST and vpcId body", async () => {
    mockApi.mockResolvedValueOnce({ networkAclId: "acl-new", created: true });
    const { result } = renderHook(() => useEC2CreateNetworkAcl(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({ vpcId: "vpc-abc" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ec2/network-acls",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ vpcId: "vpc-abc" }),
      })
    );
  });
});

describe("useEC2DeleteNetworkAcl", () => {
  it("calls api with DELETE", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useEC2DeleteNetworkAcl(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync("acl-abc");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ec2/network-acls/acl-abc",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

describe("useEC2CreateNetworkAclEntry", () => {
  it("calls api with POST and rule body", async () => {
    mockApi.mockResolvedValueOnce({ ruleAdded: true });
    const { result } = renderHook(() => useEC2CreateNetworkAclEntry(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({
      aclId: "acl-abc",
      ruleNumber: 100,
      protocol: "6",
      ruleAction: "allow",
      egress: false,
      cidrBlock: "0.0.0.0/0",
      portRangeFrom: 22,
      portRangeTo: 22,
    });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ec2/network-acls/acl-abc/entries",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          ruleNumber: 100,
          protocol: "6",
          ruleAction: "allow",
          egress: false,
          cidrBlock: "0.0.0.0/0",
          portRangeFrom: 22,
          portRangeTo: 22,
        }),
      })
    );
  });
});

describe("useEC2DeleteNetworkAclEntry", () => {
  it("calls api with DELETE and egress query param", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useEC2DeleteNetworkAclEntry(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({
      aclId: "acl-abc",
      ruleNumber: 100,
      egress: true,
    });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ec2/network-acls/acl-abc/entries/100?egress=true",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

describe("useEC2ReplaceNetworkAclAssociation", () => {
  it("calls api with POST and associationId body", async () => {
    mockApi.mockResolvedValueOnce({ replaced: true });
    const { result } = renderHook(() => useEC2ReplaceNetworkAclAssociation(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({
      aclId: "acl-abc",
      associationId: "aclassoc-old",
    });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ec2/network-acls/acl-abc/associations",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ associationId: "aclassoc-old" }),
      })
    );
  });
});
