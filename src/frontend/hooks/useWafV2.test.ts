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
  useWebACLs,
  useCreateWebACL,
  useWebACL,
  useDeleteWebACL,
  useUpdateWebACL,
  useCheckCapacity,
  useIPSets,
  useCreateIPSet,
  useDeleteIPSet,
  useRegexPatternSets,
  useCreateRegexPatternSet,
  useDeleteRegexPatternSet,
  useRuleGroups,
  useCreateRuleGroup,
  useDeleteRuleGroup,
  useWafTags,
  useTagWafResource,
  useUntagWafResource,
  useLoggingConfigurations,
  usePutLoggingConfiguration,
  useDeleteLoggingConfiguration,
  useAssociateWebACL,
  useDisassociateWebACL,
  useGetWebACLForResource,
  useResourcesForWebACL,
  usePermissionPolicy,
  usePutPermissionPolicy,
  useDeletePermissionPolicy,
} from "./useWafV2";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

// ─── Web ACLs ───────────────────────────────────────────

describe("useWebACLs", () => {
  it("calls api with scope param", async () => {
    mockApi.mockResolvedValueOnce({ webAcls: [], total: 0 });
    const { result } = renderHook(() => useWebACLs("CLOUDFRONT"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/wafv2/web-acls?scope=CLOUDFRONT");
  });

  it("defaults to REGIONAL scope", async () => {
    mockApi.mockResolvedValueOnce({ webAcls: [], total: 0 });
    const { result } = renderHook(() => useWebACLs(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/wafv2/web-acls?scope=REGIONAL");
  });
});

describe("useCreateWebACL", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateWebACL(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ Name: "acl1", Scope: "REGIONAL" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/wafv2/web-acls",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("falls back to REGIONAL when Scope is missing", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateWebACL(), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: qc }, children),
    });
    await result.current.mutateAsync({ Name: "acl1" });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["aws", "wafv2", "web-acls", "REGIONAL"] });
  });
});

describe("useWebACL", () => {
  it("does NOT call api when id is null", () => {
    renderHook(() => useWebACL(null, "name"), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("does NOT call api when name is null", () => {
    renderHook(() => useWebACL("id-1", null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with id and name when provided", async () => {
    mockApi.mockResolvedValueOnce({ webAcl: {} });
    const { result } = renderHook(() => useWebACL("id-1", "acl1", "REGIONAL"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/wafv2/web-acls/id-1?name=acl1&scope=REGIONAL"
    );
  });

  it("URL-encodes the name", async () => {
    mockApi.mockResolvedValueOnce({ webAcl: {} });
    const { result } = renderHook(() => useWebACL("id-1", "my acl/name"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/wafv2/web-acls/id-1?name=my%20acl%2Fname&scope=REGIONAL"
    );
  });
});

describe("useDeleteWebACL", () => {
  it("calls api with POST method and LockToken", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteWebACL(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ Id: "id-1", Name: "acl1", Scope: "REGIONAL", LockToken: "lock-1" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/wafv2/web-acls/delete",
      expect.objectContaining({ method: "POST" })
    );
    const callArgs = mockApi.mock.calls[0][1];
    expect(JSON.parse(callArgs.body)).toEqual({
      Id: "id-1",
      Name: "acl1",
      Scope: "REGIONAL",
      LockToken: "lock-1",
    });
  });
});

describe("useUpdateWebACL", () => {
  it("calls api with PUT method and encoded id", async () => {
    mockApi.mockResolvedValueOnce({ nextLockToken: "lock-2" });
    const { result } = renderHook(() => useUpdateWebACL(), { wrapper: createWrapper() });
    await result.current.mutateAsync({
      Id: "id/1",
      Name: "acl1",
      Scope: "CLOUDFRONT",
      LockToken: "lock-1",
      Description: "updated",
      Rules: [{ Name: "r1" }],
    });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/wafv2/web-acls/id%2F1",
      expect.objectContaining({ method: "PUT" })
    );
    const callArgs = mockApi.mock.calls[0][1];
    expect(JSON.parse(callArgs.body)).toEqual({
      Id: "id/1",
      Name: "acl1",
      Scope: "CLOUDFRONT",
      LockToken: "lock-1",
      Description: "updated",
      Rules: [{ Name: "r1" }],
    });
  });

  it("falls back to REGIONAL when Scope is missing", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useUpdateWebACL(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ Id: "id-1", Name: "acl1", LockToken: "lock-1" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/wafv2/web-acls/id-1",
      expect.objectContaining({ method: "PUT" })
    );
  });
});

describe("useCheckCapacity", () => {
  it("calls api with POST method and rules", async () => {
    mockApi.mockResolvedValueOnce({ capacity: 42 });
    const { result } = renderHook(() => useCheckCapacity(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ Rules: [{ Name: "r1" }], Scope: "REGIONAL" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/wafv2/capacity",
      expect.objectContaining({ method: "POST" })
    );
    const callArgs = mockApi.mock.calls[0][1];
    expect(JSON.parse(callArgs.body)).toEqual({ Rules: [{ Name: "r1" }], Scope: "REGIONAL" });
  });
});

// ─── IP Sets ────────────────────────────────────────────

describe("useIPSets", () => {
  it("calls api with scope param", async () => {
    mockApi.mockResolvedValueOnce({ ipSets: [], total: 0 });
    const { result } = renderHook(() => useIPSets("CLOUDFRONT"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/wafv2/ip-sets?scope=CLOUDFRONT");
  });
});

describe("useCreateIPSet", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateIPSet(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ Name: "set1", Scope: "REGIONAL" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/wafv2/ip-sets",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("falls back to REGIONAL when Scope is missing", async () => {
    mockApi.mockResolvedValueOnce({});
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useCreateIPSet(), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: qc }, children),
    });
    await result.current.mutateAsync({ Name: "set1" });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["aws", "wafv2", "ip-sets", "REGIONAL"] });
  });
});

describe("useDeleteIPSet", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteIPSet(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ Id: "id-1", Name: "set1", Scope: "REGIONAL", LockToken: "lock-1" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/wafv2/ip-sets/delete",
      expect.objectContaining({ method: "POST" })
    );
  });
});

// ─── Regex Pattern Sets ─────────────────────────────────

describe("useRegexPatternSets", () => {
  it("calls api with scope param", async () => {
    mockApi.mockResolvedValueOnce({ regexPatternSets: [], total: 0 });
    const { result } = renderHook(() => useRegexPatternSets("REGIONAL"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/wafv2/regex-pattern-sets?scope=REGIONAL");
  });
});

describe("useCreateRegexPatternSet", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateRegexPatternSet(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ Name: "rx1", Scope: "REGIONAL" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/wafv2/regex-pattern-sets",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("falls back to REGIONAL when Scope is missing", async () => {
    mockApi.mockResolvedValueOnce({});
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useCreateRegexPatternSet(), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: qc }, children),
    });
    await result.current.mutateAsync({ Name: "rx1" });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["aws", "wafv2", "regex-pattern-sets", "REGIONAL"] });
  });
});

describe("useDeleteRegexPatternSet", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteRegexPatternSet(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ Id: "id-1", Name: "rx1", Scope: "REGIONAL", LockToken: "lock-1" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/wafv2/regex-pattern-sets/delete",
      expect.objectContaining({ method: "POST" })
    );
  });
});

// ─── Rule Groups ────────────────────────────────────────

describe("useRuleGroups", () => {
  it("calls api with scope param", async () => {
    mockApi.mockResolvedValueOnce({ ruleGroups: [], total: 0 });
    const { result } = renderHook(() => useRuleGroups("REGIONAL"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/wafv2/rule-groups?scope=REGIONAL");
  });
});

describe("useCreateRuleGroup", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateRuleGroup(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ Name: "rg1", Scope: "REGIONAL" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/wafv2/rule-groups",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("falls back to REGIONAL when Scope is missing", async () => {
    mockApi.mockResolvedValueOnce({});
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useCreateRuleGroup(), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: qc }, children),
    });
    await result.current.mutateAsync({ Name: "rg1" });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["aws", "wafv2", "rule-groups", "REGIONAL"] });
  });
});

describe("useDeleteRuleGroup", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteRuleGroup(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ Id: "id-1", Name: "rg1", Scope: "REGIONAL", LockToken: "lock-1" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/wafv2/rule-groups/delete",
      expect.objectContaining({ method: "POST" })
    );
  });
});

// ─── Tags ───────────────────────────────────────────────

describe("useWafTags", () => {
  it("does NOT call api when resourceArn is null", () => {
    renderHook(() => useWafTags(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with URL-encoded resourceArn", async () => {
    mockApi.mockResolvedValueOnce({ tagList: [] });
    const { result } = renderHook(() => useWafTags("arn:aws:wafv2:::webacl/test"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/wafv2/tags?resourceArn=arn%3Aaws%3Awafv2%3A%3A%3Awebacl%2Ftest"
    );
  });
});

describe("useTagWafResource", () => {
  it("calls api with POST method and tags body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useTagWafResource(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ resourceArn: "arn:1", tags: [{ Key: "env", Value: "prod" }] });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/wafv2/tags",
      expect.objectContaining({ method: "POST" })
    );
    const callArgs = mockApi.mock.calls[0][1];
    expect(JSON.parse(callArgs.body)).toEqual({
      resourceArn: "arn:1",
      tags: [{ Key: "env", Value: "prod" }],
    });
  });
});

describe("useUntagWafResource", () => {
  it("calls api with POST method and tagKeys body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useUntagWafResource(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ resourceArn: "arn:1", tagKeys: ["env"] });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/wafv2/tags/untag",
      expect.objectContaining({ method: "POST" })
    );
    const callArgs = mockApi.mock.calls[0][1];
    expect(JSON.parse(callArgs.body)).toEqual({
      resourceArn: "arn:1",
      tagKeys: ["env"],
    });
  });
});

// ─── Logging Configuration ──────────────────────────────

describe("useLoggingConfigurations", () => {
  it("calls api with scope param", async () => {
    mockApi.mockResolvedValueOnce({ loggingConfigurations: [], total: 0 });
    const { result } = renderHook(() => useLoggingConfigurations("REGIONAL"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/wafv2/logging-config?scope=REGIONAL");
  });

  it("defaults to REGIONAL scope", async () => {
    mockApi.mockResolvedValueOnce({ loggingConfigurations: [], total: 0 });
    const { result } = renderHook(() => useLoggingConfigurations(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/wafv2/logging-config?scope=REGIONAL");
  });
});

describe("usePutLoggingConfiguration", () => {
  it("calls api with PUT method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => usePutLoggingConfiguration(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ ResourceArn: "arn:1", LogDestinationConfigs: ["arn:log:1"] });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/wafv2/logging-config",
      expect.objectContaining({ method: "PUT" })
    );
  });
});

describe("useDeleteLoggingConfiguration", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteLoggingConfiguration(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ ResourceArn: "arn:1" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/wafv2/logging-config/delete",
      expect.objectContaining({ method: "POST" })
    );
  });
});

// ─── Web ACL Associations ────────────────────────────────

describe("useAssociateWebACL", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useAssociateWebACL(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ WebACLArn: "arn:waf:1", ResourceArn: "arn:elb:1" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/wafv2/associate",
      expect.objectContaining({ method: "POST" })
    );
    const callArgs = mockApi.mock.calls[0][1];
    expect(JSON.parse(callArgs.body)).toEqual({
      WebACLArn: "arn:waf:1",
      ResourceArn: "arn:elb:1",
    });
  });
});

describe("useDisassociateWebACL", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDisassociateWebACL(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ ResourceArn: "arn:elb:1" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/wafv2/disassociate",
      expect.objectContaining({ method: "POST" })
    );
  });
});

describe("useGetWebACLForResource", () => {
  it("does NOT call api when resourceArn is null", () => {
    renderHook(() => useGetWebACLForResource(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with URL-encoded resourceArn", async () => {
    mockApi.mockResolvedValueOnce({ webAcl: { Name: "my-acl" } });
    const { result } = renderHook(() => useGetWebACLForResource("arn:elb:1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/wafv2/web-acl-for-resource?resourceArn=arn%3Aelb%3A1");
  });
});

describe("useResourcesForWebACL", () => {
  it("does NOT call api when webACLArn is null", () => {
    renderHook(() => useResourcesForWebACL(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with URL-encoded webACLArn", async () => {
    mockApi.mockResolvedValueOnce({ resourceArns: [] });
    const { result } = renderHook(() => useResourcesForWebACL("arn:waf:1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/wafv2/resources-for-web-acl?webACLArn=arn%3Awaf%3A1");
  });
});

// ─── Permission Policy ──────────────────────────────────

describe("usePermissionPolicy", () => {
  it("does NOT call api when resourceArn is null", () => {
    renderHook(() => usePermissionPolicy(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with URL-encoded resourceArn", async () => {
    mockApi.mockResolvedValueOnce({ policy: '{"Version":"2012-10-17"}' });
    const { result } = renderHook(() => usePermissionPolicy("arn:waf:1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/wafv2/permission-policy?resourceArn=arn%3Awaf%3A1");
  });
});

describe("usePutPermissionPolicy", () => {
  it("calls api with PUT method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => usePutPermissionPolicy(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ ResourceArn: "arn:waf:1", Policy: '{"Version":"2012-10-17"}' });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/wafv2/permission-policy",
      expect.objectContaining({ method: "PUT" })
    );
    const callArgs = mockApi.mock.calls[0][1];
    expect(JSON.parse(callArgs.body)).toEqual({
      ResourceArn: "arn:waf:1",
      Policy: '{"Version":"2012-10-17"}',
    });
  });
});

describe("useDeletePermissionPolicy", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeletePermissionPolicy(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ ResourceArn: "arn:waf:1" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/wafv2/permission-policy/delete",
      expect.objectContaining({ method: "POST" })
    );
  });
});
