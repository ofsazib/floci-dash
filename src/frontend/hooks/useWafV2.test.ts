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
