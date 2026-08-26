// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createWrapper } from "../../test/helpers";
import {
  useOrg,
  useCreateOrg,
  useDeleteOrg,
  useOrgRoots,
  useOrgOUs,
  useCreateOrgOU,
  useDeleteOrgOU,
  useOrgAccounts,
  useCreateOrgAccount,
  useCloseOrgAccount,
  useOrgPolicies,
  useCreateOrgPolicy,
  useDeleteOrgPolicy,
  useAttachOrgPolicy,
  useDetachOrgPolicy,
  useOrgPolicyTargets,
  useOrgTargetPolicies,
  useOrgTags,
  useTagOrgResource,
  useUntagOrgResource,
  useMoveOrgAccount,
  useRemoveOrgAccount,
  useLeaveOrg,
  useEnableAllFeatures,
  useUpdateOrgOU,
  useUpdateOrgPolicy,
  useOrgOU,
  useOrgParents,
  useOrgChildren,
  useOrgAccount,
  useOrgPolicy,
} from "./useOrganizations";

const mockApi = vi.hoisted(() => vi.fn());
vi.mock("../lib/client", () => ({
  api: (...args: any[]) => mockApi(...args),
}));

describe("Organizations query hooks", () => {
  beforeEach(() => vi.clearAllMocks());

  it("useOrg calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ organization: { Id: "o-1" } });
    const { result } = renderHook(() => useOrg(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/organizations/");
  });

  it("useOrgRoots calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ roots: [], total: 0 });
    const { result } = renderHook(() => useOrgRoots(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/organizations/roots");
  });

  it("useOrgOUs calls correct URL when parentId provided", async () => {
    mockApi.mockResolvedValueOnce({ organizationalUnits: [], total: 0 });
    const { result } = renderHook(() => useOrgOUs("r-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/organizations/ous?parentId=r-1");
  });

  it("useOrgOUs disabled when null", () => {
    const { result } = renderHook(() => useOrgOUs(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useOrgAccounts calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ accounts: [], total: 0 });
    const { result } = renderHook(() => useOrgAccounts(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/organizations/accounts");
  });

  it("useOrgAccounts with parentId calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ accounts: [], total: 0 });
    const { result } = renderHook(() => useOrgAccounts("r-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/organizations/accounts?parentId=r-1");
  });

  it("useOrgPolicies calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ policies: [], total: 0 });
    const { result } = renderHook(() => useOrgPolicies(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/organizations/policies?filter=SERVICE_CONTROL_POLICY");
  });

  it("useOrgPolicyTargets calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ targets: [] });
    const { result } = renderHook(() => useOrgPolicyTargets("p-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/organizations/policies/p-1/targets");
  });

  it("useOrgPolicyTargets disabled when null", () => {
    const { result } = renderHook(() => useOrgPolicyTargets(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useOrgTargetPolicies calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ policies: [] });
    const { result } = renderHook(() => useOrgTargetPolicies("ou-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/organizations/targets/ou-1/policies");
  });

  it("useOrgTargetPolicies disabled when null", () => {
    const { result } = renderHook(() => useOrgTargetPolicies(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useOrgTags calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ tags: [] });
    const { result } = renderHook(() => useOrgTags("arn:org"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/organizations/tags?resourceArn=arn:org");
  });

  it("useOrgTags disabled when null", () => {
    const { result } = renderHook(() => useOrgTags(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("Organizations mutation hooks", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([
    ["useCreateOrg", useCreateOrg, "/aws/organizations/create", "POST"],
    ["useDeleteOrg", useDeleteOrg, "/aws/organizations/delete", "POST"],
  ])("%s calls correct URL", async (_name, useHook, url, method) => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => (useHook as any)(), { wrapper: createWrapper() });
    await result.current.mutateAsync();
    expect(mockApi).toHaveBeenCalledWith(url, { method });
  });

  it("useOrgOUs calls correct URL with parentId", async () => {
    mockApi.mockResolvedValueOnce({ organizationalUnits: [] });
    const { result } = renderHook(() => useOrgOUs("r-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/organizations/ous?parentId=r-1");
  });

  it("useCreateOrgOU calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ organizationalUnit: { Id: "ou-new" } });
    const { result } = renderHook(() => useCreateOrgOU(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ parentId: "r-1", name: "Test" });
    expect(mockApi).toHaveBeenCalledWith("/aws/organizations/ous", {
      method: "POST",
      body: JSON.stringify({ parentId: "r-1", name: "Test" }),
    });
  });

  it("useDeleteOrgOU calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteOrgOU(), { wrapper: createWrapper() });
    await result.current.mutateAsync("ou-1");
    expect(mockApi).toHaveBeenCalledWith("/aws/organizations/ous/ou-1", { method: "DELETE" });
  });

  it("useCreateOrgAccount calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ createAccountStatus: { Id: "car-1" } });
    const { result } = renderHook(() => useCreateOrgAccount(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ email: "test@test.com" });
    expect(mockApi).toHaveBeenCalledWith("/aws/organizations/accounts", {
      method: "POST",
      body: JSON.stringify({ email: "test@test.com" }),
    });
  });

  it("useCloseOrgAccount calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCloseOrgAccount(), { wrapper: createWrapper() });
    await result.current.mutateAsync("123");
    expect(mockApi).toHaveBeenCalledWith("/aws/organizations/accounts/close", {
      method: "POST",
      body: JSON.stringify({ accountId: "123" }),
    });
  });

  it("useCreateOrgPolicy calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ policy: { Id: "p-new" } });
    const { result } = renderHook(() => useCreateOrgPolicy(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "Test", content: "{}" });
    expect(mockApi).toHaveBeenCalledWith("/aws/organizations/policies", {
      method: "POST",
      body: JSON.stringify({ name: "Test", content: "{}" }),
    });
  });

  it("useDeleteOrgPolicy calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteOrgPolicy(), { wrapper: createWrapper() });
    await result.current.mutateAsync("p-1");
    expect(mockApi).toHaveBeenCalledWith("/aws/organizations/policies/p-1", { method: "DELETE" });
  });

  it("useAttachOrgPolicy calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useAttachOrgPolicy(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ policyId: "p-1", targetId: "ou-1" });
    expect(mockApi).toHaveBeenCalledWith("/aws/organizations/policies/attach", {
      method: "POST",
      body: JSON.stringify({ policyId: "p-1", targetId: "ou-1" }),
    });
  });

  it("useDetachOrgPolicy calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDetachOrgPolicy(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ policyId: "p-1", targetId: "ou-1" });
    expect(mockApi).toHaveBeenCalledWith("/aws/organizations/policies/detach", {
      method: "POST",
      body: JSON.stringify({ policyId: "p-1", targetId: "ou-1" }),
    });
  });

  it("useTagOrgResource calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useTagOrgResource(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ resourceArn: "arn:org", tags: { env: "dev" } });
    expect(mockApi).toHaveBeenCalledWith("/aws/organizations/tags", {
      method: "POST",
      body: JSON.stringify({ resourceArn: "arn:org", tags: { env: "dev" } }),
    });
  });

  it("useUntagOrgResource calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useUntagOrgResource(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ resourceArn: "arn:org", tagKeys: ["env"] });
    expect(mockApi).toHaveBeenCalledWith("/aws/organizations/tags/remove", {
      method: "POST",
      body: JSON.stringify({ resourceArn: "arn:org", tagKeys: ["env"] }),
    });
  });

  it("useMoveOrgAccount calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useMoveOrgAccount(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ accountId: "123", sourceParentId: "r-1", destinationParentId: "r-2" });
    expect(mockApi).toHaveBeenCalledWith("/aws/organizations/accounts/move", {
      method: "POST",
      body: JSON.stringify({ accountId: "123", sourceParentId: "r-1", destinationParentId: "r-2" }),
    });
  });

  it("useRemoveOrgAccount calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useRemoveOrgAccount(), { wrapper: createWrapper() });
    await result.current.mutateAsync("123");
    expect(mockApi).toHaveBeenCalledWith("/aws/organizations/accounts/remove", {
      method: "POST",
      body: JSON.stringify({ accountId: "123" }),
    });
  });

  it("useLeaveOrg calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useLeaveOrg(), { wrapper: createWrapper() });
    await result.current.mutateAsync();
    expect(mockApi).toHaveBeenCalledWith("/aws/organizations/accounts/leave", { method: "POST" });
  });

  it("useEnableAllFeatures calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useEnableAllFeatures(), { wrapper: createWrapper() });
    await result.current.mutateAsync();
    expect(mockApi).toHaveBeenCalledWith("/aws/organizations/enable-all-features", { method: "POST" });
  });

  it("useUpdateOrgOU calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useUpdateOrgOU(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ id: "ou-1", name: "Updated" });
    expect(mockApi).toHaveBeenCalledWith("/aws/organizations/ous/ou-1", {
      method: "PUT",
      body: JSON.stringify({ name: "Updated" }),
    });
  });

  it("useUpdateOrgPolicy calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useUpdateOrgPolicy(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ id: "p-1", name: "Updated" });
    expect(mockApi).toHaveBeenCalledWith("/aws/organizations/policies/p-1", {
      method: "PUT",
      body: JSON.stringify({ name: "Updated", description: undefined, content: undefined }),
    });
  });

  it("useOrgOU calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ id: "ou-1", name: "Test OU" });
    const { result } = renderHook(() => useOrgOU("ou-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/organizations/ous/ou-1");
  });

  it("useOrgOU disabled when null", () => {
    const { result } = renderHook(() => useOrgOU(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useOrgParents calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ parents: [] });
    const { result } = renderHook(() => useOrgParents("child-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/organizations/parents?childId=child-1");
  });

  it("useOrgParents disabled when null", () => {
    const { result } = renderHook(() => useOrgParents(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useOrgChildren calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ children: [] });
    const { result } = renderHook(() => useOrgChildren("parent-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/organizations/children?parentId=parent-1");
  });

  it("useOrgChildren disabled when null", () => {
    const { result } = renderHook(() => useOrgChildren(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useOrgAccount calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ id: "a-1", name: "Test Acct" });
    const { result } = renderHook(() => useOrgAccount("a-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/organizations/accounts/a-1");
  });

  it("useOrgAccount disabled when null", () => {
    const { result } = renderHook(() => useOrgAccount(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useOrgPolicy calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ id: "p-1", name: "Test SCP" });
    const { result } = renderHook(() => useOrgPolicy("p-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/organizations/policies/p-1");
  });

  it("useOrgPolicy disabled when null", () => {
    const { result } = renderHook(() => useOrgPolicy(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });
});
