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
  useIPSets,
  useIPSet,
  useCreateIPSet,
  useUpdateIPSet,
  useDeleteIPSet,
  useRegexPatternSets,
  useRegexPatternSet,
  useCreateRegexPatternSet,
  useUpdateRegexPatternSet,
  useDeleteRegexPatternSet,
  useRuleGroups,
  useRuleGroup,
  useCreateRuleGroup,
  useDeleteRuleGroup,
  useWafTags,
  useTagWafResource,
  useUntagWafResource,
  useLoggingConfigurations,
  useLoggingConfiguration,
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

// ─── Web ACLs ───────────────────────────────────────────

describe("useWebACLs", () => {
  it("calls api with default REGIONAL scope", async () => {
    mockApi.mockResolvedValueOnce({ webAcls: [], total: 0 });
    const { result } = renderHook(() => useWebACLs(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/wafv2/web-acls?scope=REGIONAL");
  });

  it("calls api with provided scope", async () => {
    mockApi.mockResolvedValueOnce({ webAcls: [], total: 0 });
    const { result } = renderHook(() => useWebACLs("CLOUDFRONT"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/wafv2/web-acls?scope=CLOUDFRONT");
  });
});

describe("useCreateWebACL", () => {
  it("calls api with POST and body", async () => {
    mockApi.mockResolvedValueOnce({ created: true });
    const { result } = renderHook(() => useCreateWebACL(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({ Name: "acl1", Scope: "REGIONAL" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/wafv2/web-acls",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ Name: "acl1", Scope: "REGIONAL" }),
      })
    );
  });

  it("invalidates with REGIONAL default when scope omitted", async () => {
    mockApi.mockResolvedValueOnce({ created: true });
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: qc }, children);
    const { result } = renderHook(() => useCreateWebACL(), { wrapper });
    await result.current.mutateAsync({ Name: "acl1" });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["aws", "wafv2", "web-acls", "REGIONAL"],
    });
  });
});

describe("useWebACL", () => {
  it("does not call api when id or name is null", async () => {
    const { result } = renderHook(() => useWebACL(null, null), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with encoded id, name and scope", async () => {
    mockApi.mockResolvedValueOnce({ webAcl: { Name: "acl 1", Id: "id-1" } });
    const { result } = renderHook(() => useWebACL("id-1", "acl 1", "REGIONAL"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/wafv2/web-acls/id-1?name=acl%201&scope=REGIONAL");
  });
});

describe("useDeleteWebACL", () => {
  it("calls api with POST to delete path and body", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteWebACL(), {
      wrapper: createWrapper(),
    });
    const body = { Id: "id-1", Name: "acl1", Scope: "REGIONAL", LockToken: "lock-1" };
    await result.current.mutateAsync(body);
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/wafv2/web-acls/delete",
      expect.objectContaining({ method: "POST", body: JSON.stringify(body) })
    );
  });
});

// ─── IP Sets ────────────────────────────────────────────

describe("useIPSets", () => {
  it("calls api with default REGIONAL scope", async () => {
    mockApi.mockResolvedValueOnce({ ipSets: [], total: 0 });
    const { result } = renderHook(() => useIPSets(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/wafv2/ip-sets?scope=REGIONAL");
  });

  it("calls api with provided scope", async () => {
    mockApi.mockResolvedValueOnce({ ipSets: [], total: 0 });
    const { result } = renderHook(() => useIPSets("CLOUDFRONT"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/wafv2/ip-sets?scope=CLOUDFRONT");
  });
});

describe("useIPSet", () => {
  it("does not call api when id or name is null", async () => {
    const { result } = renderHook(() => useIPSet(null, null), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with encoded id, name and scope", async () => {
    mockApi.mockResolvedValueOnce({ ipSet: { Name: "set 1", Id: "id-1" } });
    const { result } = renderHook(() => useIPSet("id-1", "set 1", "REGIONAL"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/wafv2/ip-sets/id-1?name=set%201&scope=REGIONAL");
  });
});

describe("useCreateIPSet", () => {
  it("calls api with POST and body", async () => {
    mockApi.mockResolvedValueOnce({ created: true });
    const { result } = renderHook(() => useCreateIPSet(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({ Name: "set1", Scope: "REGIONAL" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/wafv2/ip-sets",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ Name: "set1", Scope: "REGIONAL" }),
      })
    );
  });

  it("invalidates with REGIONAL default when scope omitted", async () => {
    mockApi.mockResolvedValueOnce({ created: true });
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: qc }, children);
    const { result } = renderHook(() => useCreateIPSet(), { wrapper });
    await result.current.mutateAsync({ Name: "set1" });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["aws", "wafv2", "ip-sets", "REGIONAL"],
    });
  });
});

describe("useUpdateIPSet", () => {
  it("calls api with PUT, encoded id URL, and body", async () => {
    mockApi.mockResolvedValueOnce({ updated: true });
    const { result } = renderHook(() => useUpdateIPSet(), {
      wrapper: createWrapper(),
    });
    const body = {
      Id: "id-1",
      Name: "set1",
      Scope: "REGIONAL",
      LockToken: "lock-1",
      Addresses: ["192.168.0.0/24"],
      Description: "desc",
    };
    await result.current.mutateAsync(body);
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/wafv2/ip-sets/id-1",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify(body),
      })
    );
  });
});

describe("useDeleteIPSet", () => {
  it("calls api with POST to delete path and body", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteIPSet(), {
      wrapper: createWrapper(),
    });
    const body = { Id: "id-1", Name: "set1", Scope: "REGIONAL", LockToken: "lock-1" };
    await result.current.mutateAsync(body);
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/wafv2/ip-sets/delete",
      expect.objectContaining({ method: "POST", body: JSON.stringify(body) })
    );
  });
});

// ─── Regex Pattern Sets ─────────────────────────────────

describe("useRegexPatternSets", () => {
  it("calls api with default REGIONAL scope", async () => {
    mockApi.mockResolvedValueOnce({ regexPatternSets: [], total: 0 });
    const { result } = renderHook(() => useRegexPatternSets(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/wafv2/regex-pattern-sets?scope=REGIONAL");
  });

  it("calls api with provided scope", async () => {
    mockApi.mockResolvedValueOnce({ regexPatternSets: [], total: 0 });
    const { result } = renderHook(() => useRegexPatternSets("CLOUDFRONT"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/wafv2/regex-pattern-sets?scope=CLOUDFRONT");
  });
});

describe("useRegexPatternSet", () => {
  it("does not call api when id or name is null", async () => {
    const { result } = renderHook(() => useRegexPatternSet(null, null), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with encoded id, name and scope", async () => {
    mockApi.mockResolvedValueOnce({ regexPatternSet: { Name: "rx 1", Id: "id-1" } });
    const { result } = renderHook(() => useRegexPatternSet("id-1", "rx 1", "REGIONAL"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/wafv2/regex-pattern-sets/id-1?name=rx%201&scope=REGIONAL");
  });
});

describe("useCreateRegexPatternSet", () => {
  it("calls api with POST and body", async () => {
    mockApi.mockResolvedValueOnce({ created: true });
    const { result } = renderHook(() => useCreateRegexPatternSet(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({ Name: "rx1", Scope: "REGIONAL" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/wafv2/regex-pattern-sets",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ Name: "rx1", Scope: "REGIONAL" }),
      })
    );
  });

  it("invalidates with REGIONAL default when scope omitted", async () => {
    mockApi.mockResolvedValueOnce({ created: true });
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: qc }, children);
    const { result } = renderHook(() => useCreateRegexPatternSet(), { wrapper });
    await result.current.mutateAsync({ Name: "rx1" });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["aws", "wafv2", "regex-pattern-sets", "REGIONAL"],
    });
  });
});

describe("useUpdateRegexPatternSet", () => {
  it("calls api with PUT, encoded id URL, and body", async () => {
    mockApi.mockResolvedValueOnce({ updated: true });
    const { result } = renderHook(() => useUpdateRegexPatternSet(), {
      wrapper: createWrapper(),
    });
    const body = {
      Id: "id-1",
      Name: "rx1",
      Scope: "REGIONAL",
      LockToken: "lock-1",
      RegularExpressionList: [{ RegexString: ".*foo.*" }],
      Description: "desc",
    };
    await result.current.mutateAsync(body);
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/wafv2/regex-pattern-sets/id-1",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify(body),
      })
    );
  });
});

describe("useDeleteRegexPatternSet", () => {
  it("calls api with POST to delete path and body", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteRegexPatternSet(), {
      wrapper: createWrapper(),
    });
    const body = { Id: "id-1", Name: "rx1", Scope: "REGIONAL", LockToken: "lock-1" };
    await result.current.mutateAsync(body);
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/wafv2/regex-pattern-sets/delete",
      expect.objectContaining({ method: "POST", body: JSON.stringify(body) })
    );
  });
});

// ─── Rule Groups ────────────────────────────────────────

describe("useRuleGroups", () => {
  it("calls api with default REGIONAL scope", async () => {
    mockApi.mockResolvedValueOnce({ ruleGroups: [], total: 0 });
    const { result } = renderHook(() => useRuleGroups(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/wafv2/rule-groups?scope=REGIONAL");
  });

  it("calls api with provided scope", async () => {
    mockApi.mockResolvedValueOnce({ ruleGroups: [], total: 0 });
    const { result } = renderHook(() => useRuleGroups("CLOUDFRONT"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/wafv2/rule-groups?scope=CLOUDFRONT");
  });
});

describe("useRuleGroup", () => {
  it("does not call api when id or name is null", async () => {
    const { result } = renderHook(() => useRuleGroup(null, null), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with encoded id, name and scope", async () => {
    mockApi.mockResolvedValueOnce({ ruleGroup: { Name: "rg 1", Id: "id-1" } });
    const { result } = renderHook(() => useRuleGroup("id-1", "rg 1", "REGIONAL"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/wafv2/rule-groups/id-1?name=rg%201&scope=REGIONAL");
  });
});

describe("useCreateRuleGroup", () => {
  it("calls api with POST and body", async () => {
    mockApi.mockResolvedValueOnce({ created: true });
    const { result } = renderHook(() => useCreateRuleGroup(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({ Name: "rg1", Scope: "REGIONAL" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/wafv2/rule-groups",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ Name: "rg1", Scope: "REGIONAL" }),
      })
    );
  });

  it("invalidates with REGIONAL default when scope omitted", async () => {
    mockApi.mockResolvedValueOnce({ created: true });
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: qc }, children);
    const { result } = renderHook(() => useCreateRuleGroup(), { wrapper });
    await result.current.mutateAsync({ Name: "rg1" });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["aws", "wafv2", "rule-groups", "REGIONAL"],
    });
  });
});

describe("useDeleteRuleGroup", () => {
  it("calls api with POST to delete path and body", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteRuleGroup(), {
      wrapper: createWrapper(),
    });
    const body = { Id: "id-1", Name: "rg1", Scope: "REGIONAL", LockToken: "lock-1" };
    await result.current.mutateAsync(body);
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/wafv2/rule-groups/delete",
      expect.objectContaining({ method: "POST", body: JSON.stringify(body) })
    );
  });
});

// ─── Tags ───────────────────────────────────────────────

describe("useWafTags", () => {
  it("does not call api when resourceArn is null", async () => {
    const { result } = renderHook(() => useWafTags(null), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with encoded resourceArn query param", async () => {
    mockApi.mockResolvedValueOnce({ tagList: [{ Key: "env", Value: "prod" }] });
    const { result } = renderHook(() => useWafTags("arn:aws:wafv2:::webacl/x"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/wafv2/tags?resourceArn=${encodeURIComponent("arn:aws:wafv2:::webacl/x")}`
    );
  });
});

describe("useTagWafResource", () => {
  it("calls api with POST and body", async () => {
    mockApi.mockResolvedValueOnce({ tagged: true });
    const { result } = renderHook(() => useTagWafResource(), {
      wrapper: createWrapper(),
    });
    const body = { resourceArn: "arn:1", tags: [{ Key: "env", Value: "prod" }] };
    await result.current.mutateAsync(body);
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/wafv2/tags",
      expect.objectContaining({ method: "POST", body: JSON.stringify(body) })
    );
  });
});

describe("useUntagWafResource", () => {
  it("calls api with POST to untag path", async () => {
    mockApi.mockResolvedValueOnce({ untagged: true });
    const { result } = renderHook(() => useUntagWafResource(), {
      wrapper: createWrapper(),
    });
    const body = { resourceArn: "arn:1", tagKeys: ["env"] };
    await result.current.mutateAsync(body);
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/wafv2/tags/untag",
      expect.objectContaining({ method: "POST", body: JSON.stringify(body) })
    );
  });
});

// ─── Logging Configuration ──────────────────────────────

describe("useLoggingConfigurations", () => {
  it("calls api with default scope", async () => {
    mockApi.mockResolvedValueOnce({ loggingConfigurations: [], total: 0 });
    const { result } = renderHook(() => useLoggingConfigurations(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/wafv2/logging-config?scope=REGIONAL");
  });
});

describe("useLoggingConfiguration", () => {
  it("does not call api when resourceArn is null", async () => {
    const { result } = renderHook(() => useLoggingConfiguration(null), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with encoded resourceArn in path", async () => {
    mockApi.mockResolvedValueOnce({ loggingConfiguration: null });
    const { result } = renderHook(() => useLoggingConfiguration("arn:aws:wafv2:::webacl/x"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/wafv2/logging-config/${encodeURIComponent("arn:aws:wafv2:::webacl/x")}`
    );
  });
});

describe("usePutLoggingConfiguration", () => {
  it("calls api with PUT and body", async () => {
    mockApi.mockResolvedValueOnce({ created: true });
    const { result } = renderHook(() => usePutLoggingConfiguration(), {
      wrapper: createWrapper(),
    });
    const body = { ResourceArn: "arn:1", LogDestinationConfigs: ["arn:log:1"] };
    await result.current.mutateAsync(body);
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/wafv2/logging-config",
      expect.objectContaining({ method: "PUT", body: JSON.stringify(body) })
    );
  });
});

describe("useDeleteLoggingConfiguration", () => {
  it("calls api with POST to delete path", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteLoggingConfiguration(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({ ResourceArn: "arn:1" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/wafv2/logging-config/delete",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ ResourceArn: "arn:1" }) })
    );
  });
});

// ─── Associations ───────────────────────────────────────

describe("useAssociateWebACL", () => {
  it("calls api with POST to associate path", async () => {
    mockApi.mockResolvedValueOnce({ associated: true });
    const { result } = renderHook(() => useAssociateWebACL(), {
      wrapper: createWrapper(),
    });
    const body = { WebACLArn: "arn:waf:1", ResourceArn: "arn:elb:1" };
    await result.current.mutateAsync(body);
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/wafv2/associate",
      expect.objectContaining({ method: "POST", body: JSON.stringify(body) })
    );
  });
});

describe("useDisassociateWebACL", () => {
  it("calls api with POST to disassociate path", async () => {
    mockApi.mockResolvedValueOnce({ disassociated: true });
    const { result } = renderHook(() => useDisassociateWebACL(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({ ResourceArn: "arn:elb:1" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/wafv2/disassociate",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ ResourceArn: "arn:elb:1" }) })
    );
  });
});

describe("useGetWebACLForResource", () => {
  it("does not call api when resourceArn is null", async () => {
    const { result } = renderHook(() => useGetWebACLForResource(null), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with encoded resourceArn query param", async () => {
    mockApi.mockResolvedValueOnce({ webAcl: null });
    const { result } = renderHook(() => useGetWebACLForResource("arn:elb:1"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/wafv2/web-acl-for-resource?resourceArn=${encodeURIComponent("arn:elb:1")}`
    );
  });
});

describe("useResourcesForWebACL", () => {
  it("calls api with encoded webACLArn query param", async () => {
    mockApi.mockResolvedValueOnce({ resourceArns: [] });
    const { result } = renderHook(() => useResourcesForWebACL("arn:waf:1"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/wafv2/resources-for-web-acl?webACLArn=${encodeURIComponent("arn:waf:1")}`
    );
  });
});

// ─── Permission Policy ──────────────────────────────────

describe("usePermissionPolicy", () => {
  it("does not call api when resourceArn is null", async () => {
    const { result } = renderHook(() => usePermissionPolicy(null), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with encoded resourceArn query param", async () => {
    mockApi.mockResolvedValueOnce({ policy: null });
    const { result } = renderHook(() => usePermissionPolicy("arn:waf:1"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/wafv2/permission-policy?resourceArn=${encodeURIComponent("arn:waf:1")}`
    );
  });
});

describe("usePutPermissionPolicy", () => {
  it("calls api with PUT and body", async () => {
    mockApi.mockResolvedValueOnce({ created: true });
    const { result } = renderHook(() => usePutPermissionPolicy(), {
      wrapper: createWrapper(),
    });
    const body = { ResourceArn: "arn:waf:1", Policy: "{}" };
    await result.current.mutateAsync(body);
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/wafv2/permission-policy",
      expect.objectContaining({ method: "PUT", body: JSON.stringify(body) })
    );
  });
});

describe("useDeletePermissionPolicy", () => {
  it("calls api with POST to delete path", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeletePermissionPolicy(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({ ResourceArn: "arn:waf:1" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/wafv2/permission-policy/delete",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ ResourceArn: "arn:waf:1" }) })
    );
  });
});
