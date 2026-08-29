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
  useIAMUsers,
  useIAMUser,
  useCreateUser,
  useDeleteUser,
  useIAMRoles,
  useIAMRole,
  useCreateRole,
  useDeleteRole,
  useIAMGroups,
  useIAMGroup,
  useAddUserToGroup,
  useRemoveUserFromGroup,
  useGroupInlinePolicies,
  useGroupInlinePolicy,
  usePutGroupInlinePolicy,
  useDeleteGroupInlinePolicy,
  useSetDefaultPolicyVersion,
  useTagUser,
  useUntagUser,
  useTagRole,
  useUntagRole,
  useTagPolicy,
  useUntagPolicy,
  useCreateGroup,
  useDeleteGroup,
  useIAMPolicies,
  useIAMPolicy,
  usePolicyVersion,
  useCreatePolicy,
  useDeletePolicy,
  useCreateAccessKey,
  useDeleteAccessKey,
  useInstanceProfiles,
  useCreateInstanceProfile,
  useDeleteInstanceProfile,
  useAddRoleToInstanceProfile,
  useRemoveRoleFromInstanceProfile,
  useSetUserPermissionsBoundary,
  useDeleteUserPermissionsBoundary,
  useSetRolePermissionsBoundary,
  useDeleteRolePermissionsBoundary,
  usePutRoleInlinePolicy,
  useDeleteRoleInlinePolicy,
  useUpdateRoleTrustPolicy,
  useSimulatePolicy,
  useUpdateUser,
  useUpdateRole,
  useCreateServiceLinkedRole,
  useDeleteServiceLinkedRole,
  useServiceLinkedRoleDeletionStatus,
  useListEntitiesForPolicy,
  useCreatePolicyVersion,
  useDeletePolicyVersion,
  useAttachUserPolicy,
  useDetachUserPolicy,
  useAttachRolePolicy,
  useDetachRolePolicy,
  useAttachGroupPolicy,
  useDetachGroupPolicy,
  useListAttachedGroupPolicies,
  useListRoleInlinePolicies,
  useGetRoleInlinePolicy,
  useInstanceProfile,
  useListInstanceProfilesForRole,
  useAccessKeyLastUsed,
  useAccountAliases,
  useCreateAccountAlias,
  useDeleteAccountAlias,
  useAccountSummary,
  useOIDCProviders,
  useOIDCProvider,
  useCreateOIDCProvider,
  useDeleteOIDCProvider,
  useAddOIDCClientId,
  useRemoveOIDCClientId,
  useUpdateOIDCThumbprint,
  useLoginProfile,
} from "./useIAM";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

// ─── USERS ───────────────────────────────────────────────

describe("useIAMUsers", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ users: [], total: 0 });
    const { result } = renderHook(() => useIAMUsers(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/iam/users");
  });
});

describe("useIAMUser", () => {
  it("does NOT call api when name is null", () => {
    renderHook(() => useIAMUser(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with name in path when name provided", async () => {
    mockApi.mockResolvedValueOnce({ user: {}, groups: [], attachedPolicies: [], accessKeys: [], inlinePolicies: [] });
    const { result } = renderHook(() => useIAMUser("alice"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/iam/users/alice");
  });
});

describe("useCreateUser", () => {
  it("calls api with POST method and serialized body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateUser(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ userName: "alice" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/iam/users",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ userName: "alice" }),
      })
    );
  });
});

describe("useDeleteUser", () => {
  it("calls api with DELETE method and name in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteUser(), { wrapper: createWrapper() });
    await result.current.mutateAsync("alice");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/iam/users/alice",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

// ─── ROLES ───────────────────────────────────────────────

describe("useIAMRoles", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ roles: [], total: 0 });
    const { result } = renderHook(() => useIAMRoles(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/iam/roles");
  });
});

describe("useIAMRole", () => {
  it("does NOT call api when name is null", () => {
    renderHook(() => useIAMRole(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with name in path when name provided", async () => {
    mockApi.mockResolvedValueOnce({ role: {}, attachedPolicies: [], tags: {} });
    const { result } = renderHook(() => useIAMRole("admin"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/iam/roles/admin");
  });
});

describe("useCreateRole", () => {
  it("calls api with POST method and serialized body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateRole(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ roleName: "admin", assumeRolePolicyDocument: "{}" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/iam/roles",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ roleName: "admin", assumeRolePolicyDocument: "{}" }),
      })
    );
  });
});

describe("useDeleteRole", () => {
  it("calls api with DELETE method and name in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteRole(), { wrapper: createWrapper() });
    await result.current.mutateAsync("admin");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/iam/roles/admin",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

// ─── GROUPS ──────────────────────────────────────────────

describe("useIAMGroups", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ groups: [], total: 0 });
    const { result } = renderHook(() => useIAMGroups(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/iam/groups");
  });
});

describe("useCreateGroup", () => {
  it("calls api with POST method and serialized body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateGroup(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ groupName: "devs" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/iam/groups",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ groupName: "devs" }),
      })
    );
  });
});

describe("useDeleteGroup", () => {
  it("calls api with DELETE method and name in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteGroup(), { wrapper: createWrapper() });
    await result.current.mutateAsync("devs");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/iam/groups/devs",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

// ─── POLICIES ────────────────────────────────────────────

describe("useIAMPolicies", () => {
  it("defaults scope to Local when none provided", async () => {
    mockApi.mockResolvedValueOnce({ policies: [], total: 0 });
    const { result } = renderHook(() => useIAMPolicies(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/iam/policies?scope=Local");
  });

  it("uses provided scope in query string", async () => {
    mockApi.mockResolvedValueOnce({ policies: [], total: 0 });
    const { result } = renderHook(() => useIAMPolicies("AWS"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/iam/policies?scope=AWS");
  });
});

describe("useIAMPolicy", () => {
  it("does NOT call api when arn is null", () => {
    renderHook(() => useIAMPolicy(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with arn encoded in query string", async () => {
    mockApi.mockResolvedValueOnce({ policy: {}, versions: [] });
    const { result } = renderHook(
      () => useIAMPolicy("arn:aws:iam::aws:policy/AdministratorAccess"),
      { wrapper: createWrapper() }
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/iam/policies/detail?arn=${encodeURIComponent("arn:aws:iam::aws:policy/AdministratorAccess")}`
    );
  });
});

describe("usePolicyVersion", () => {
  it("does NOT call api when arn is null", () => {
    renderHook(() => usePolicyVersion(null, "v1"), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("does NOT call api when versionId is null", () => {
    renderHook(() => usePolicyVersion("arn:x", null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with arn + versionId when both provided", async () => {
    mockApi.mockResolvedValueOnce({ versionId: "v1", document: "{}", isDefaultVersion: true });
    const { result } = renderHook(() => usePolicyVersion("arn:x", "v1"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/iam/policies/version?arn=${encodeURIComponent("arn:x")}&versionId=v1`
    );
  });
});

describe("useCreatePolicy", () => {
  it("calls api with POST method and serialized body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreatePolicy(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ policyName: "p1", policyDocument: "{}" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/iam/policies",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ policyName: "p1", policyDocument: "{}" }),
      })
    );
  });
});

describe("useDeletePolicy", () => {
  it("calls api with DELETE method and encoded arn in query", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeletePolicy(), { wrapper: createWrapper() });
    await result.current.mutateAsync("arn:aws:iam::123:policy/p1");
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/iam/policies?arn=${encodeURIComponent("arn:aws:iam::123:policy/p1")}`,
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

// ─── ACCESS KEYS ─────────────────────────────────────────

describe("useCreateAccessKey", () => {
  it("calls api with POST method and userName in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateAccessKey(), { wrapper: createWrapper() });
    await result.current.mutateAsync("alice");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/iam/users/alice/access-keys",
      expect.objectContaining({ method: "POST" })
    );
  });
});

describe("useDeleteAccessKey", () => {
  it("calls api with DELETE method and userName + id in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteAccessKey(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ userName: "alice", id: "AKIA123" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/iam/users/alice/access-keys/AKIA123",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

// ─── GROUPS ────────────────────────────────────────────────

describe("useIAMGroup", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ group: {}, users: [] });
    const { result } = renderHook(() => useIAMGroup("admins"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/iam/groups/admins");
  });

  it("is disabled when name is null", () => {
    const { result } = renderHook(() => useIAMGroup(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useAddUserToGroup", () => {
  it("calls api with POST method and body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useAddUserToGroup(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ groupName: "admins", userName: "alice" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/iam/groups/admins/users",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ userName: "alice" }) })
    );
  });
});

describe("useRemoveUserFromGroup", () => {
  it("calls api with DELETE method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useRemoveUserFromGroup(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ groupName: "admins", userName: "alice" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/iam/groups/admins/users/alice",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

describe("useGroupInlinePolicies", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ policyNames: [] });
    const { result } = renderHook(() => useGroupInlinePolicies("admins"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/iam/groups/admins/inline-policies");
  });

  it("is disabled when groupName is null", () => {
    const { result } = renderHook(() => useGroupInlinePolicies(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useGroupInlinePolicy", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ policyName: "gp1", document: "{}" });
    const { result } = renderHook(() => useGroupInlinePolicy("admins", "gp1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/iam/groups/admins/inline-policies/gp1");
  });

  it("is disabled when policyName is null", () => {
    const { result } = renderHook(() => useGroupInlinePolicy("admins", null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("usePutGroupInlinePolicy", () => {
  it("calls api with PUT method and body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => usePutGroupInlinePolicy(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ groupName: "admins", policyName: "gp1", document: "{}" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/iam/groups/admins/inline-policies",
      expect.objectContaining({ method: "PUT", body: JSON.stringify({ policyName: "gp1", document: "{}" }) })
    );
  });
});

describe("useDeleteGroupInlinePolicy", () => {
  it("calls api with DELETE method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteGroupInlinePolicy(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ groupName: "admins", policyName: "gp1" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/iam/groups/admins/inline-policies/gp1",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

describe("useSetDefaultPolicyVersion", () => {
  it("calls api with POST method and body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useSetDefaultPolicyVersion(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ arn: "arn:aws:iam::123:policy/p1", versionId: "v2" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/iam/policies/arn%3Aaws%3Aiam%3A%3A123%3Apolicy%2Fp1/set-default-version",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ versionId: "v2" }) })
    );
  });
});

describe("useTagUser", () => {
  it("calls api with POST method and body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useTagUser(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ userName: "alice", tags: [{ Key: "env", Value: "prod" }] });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/iam/users/alice/tags",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ tags: [{ Key: "env", Value: "prod" }] }) })
    );
  });
});

describe("useUntagUser", () => {
  it("calls api with DELETE method and body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useUntagUser(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ userName: "alice", tagKeys: ["env"] });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/iam/users/alice/tags",
      expect.objectContaining({ method: "DELETE", body: JSON.stringify({ tagKeys: ["env"] }) })
    );
  });
});

describe("useTagRole", () => {
  it("calls api with POST method and body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useTagRole(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ roleName: "my-role", tags: [{ Key: "env", Value: "prod" }] });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/iam/roles/my-role/tags",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ tags: [{ Key: "env", Value: "prod" }] }) })
    );
  });
});

describe("useUntagRole", () => {
  it("calls api with DELETE method and body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useUntagRole(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ roleName: "my-role", tagKeys: ["env"] });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/iam/roles/my-role/tags",
      expect.objectContaining({ method: "DELETE", body: JSON.stringify({ tagKeys: ["env"] }) })
    );
  });
});

describe("useTagPolicy", () => {
  it("calls api with POST method and body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useTagPolicy(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ arn: "arn:aws:iam::123:policy/p1", tags: [{ Key: "env", Value: "prod" }] });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/iam/policies/arn%3Aaws%3Aiam%3A%3A123%3Apolicy%2Fp1/tags",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ tags: [{ Key: "env", Value: "prod" }] }) })
    );
  });
});

describe("useUntagPolicy", () => {
  it("calls api with DELETE method and body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useUntagPolicy(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ arn: "arn:aws:iam::123:policy/p1", tagKeys: ["env"] });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/iam/policies/arn%3Aaws%3Aiam%3A%3A123%3Apolicy%2Fp1/tags",
      expect.objectContaining({ method: "DELETE", body: JSON.stringify({ tagKeys: ["env"] }) })
    );
  });
});

// ─── INSTANCE PROFILES ───────────────────────────────────

describe("useInstanceProfiles", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ instanceProfiles: [], total: 0 });
    const { result } = renderHook(() => useInstanceProfiles(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/iam/instance-profiles");
  });
});

describe("useCreateInstanceProfile", () => {
  it("calls api with POST method and body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateInstanceProfile(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "web-profile", path: "/" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/iam/instance-profiles",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ name: "web-profile", path: "/" }) })
    );
  });
});

describe("useDeleteInstanceProfile", () => {
  it("calls api with DELETE method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteInstanceProfile(), { wrapper: createWrapper() });
    await result.current.mutateAsync("web-profile");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/iam/instance-profiles/web-profile",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

describe("useAddRoleToInstanceProfile", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useAddRoleToInstanceProfile(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "web-profile", roleName: "ec2-role" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/iam/instance-profiles/web-profile/roles/ec2-role",
      expect.objectContaining({ method: "POST" })
    );
  });
});

describe("useRemoveRoleFromInstanceProfile", () => {
  it("calls api with DELETE method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useRemoveRoleFromInstanceProfile(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "web-profile", roleName: "ec2-role" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/iam/instance-profiles/web-profile/roles/ec2-role",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

// ─── PERMISSION BOUNDARIES ────────────────────────────────

describe("useSetUserPermissionsBoundary", () => {
  it("calls api with PUT method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useSetUserPermissionsBoundary(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ userName: "alice", permissionsBoundary: "arn:aws:iam::123:policy/boundary" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/iam/users/alice/permissions-boundary",
      expect.objectContaining({ method: "PUT" })
    );
  });
});

describe("useDeleteUserPermissionsBoundary", () => {
  it("calls api with DELETE method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteUserPermissionsBoundary(), { wrapper: createWrapper() });
    await result.current.mutateAsync("alice");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/iam/users/alice/permissions-boundary",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

describe("useSetRolePermissionsBoundary", () => {
  it("calls api with PUT method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useSetRolePermissionsBoundary(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ roleName: "my-role", permissionsBoundary: "arn:aws:iam::123:policy/boundary" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/iam/roles/my-role/permissions-boundary",
      expect.objectContaining({ method: "PUT" })
    );
  });
});

describe("useDeleteRolePermissionsBoundary", () => {
  it("calls api with DELETE method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteRolePermissionsBoundary(), { wrapper: createWrapper() });
    await result.current.mutateAsync("my-role");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/iam/roles/my-role/permissions-boundary",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

describe("IAM role policy hooks", () => {
  it("usePutRoleInlinePolicy puts by role name", async () => {
    mockApi.mockResolvedValueOnce({ updated: true });
    const { result } = renderHook(() => usePutRoleInlinePolicy(), { wrapper: createWrapper() });
    result.current.mutate({ roleName: "r 1", policyName: "p", document: "{}" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/iam/roles/r%201/inline-policies", {
      method: "PUT",
      body: JSON.stringify({ policyName: "p", document: "{}" }),
    });
  });

  it("useDeleteRoleInlinePolicy deletes both encoded", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteRoleInlinePolicy(), { wrapper: createWrapper() });
    result.current.mutate({ roleName: "r/1", policyName: "p 1" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/iam/roles/r%2F1/inline-policies/p%201", {
      method: "DELETE",
    });
  });

  it("useUpdateRoleTrustPolicy puts the trust doc", async () => {
    mockApi.mockResolvedValueOnce({ updated: true });
    const { result } = renderHook(() => useUpdateRoleTrustPolicy(), { wrapper: createWrapper() });
    result.current.mutate({ roleName: "r1", document: "{}" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/iam/roles/r1/trust-policy", {
      method: "PUT",
      body: JSON.stringify({ document: "{}" }),
    });
  });

  it("useSimulatePolicy posts the simulation", async () => {
    mockApi.mockResolvedValueOnce({ evaluations: [], total: 0 });
    const { result } = renderHook(() => useSimulatePolicy(), { wrapper: createWrapper() });
    result.current.mutate({ policySourceArn: "arn:x", actionNames: ["s3:Get"] });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/iam/simulate", {
      method: "POST",
      body: JSON.stringify({ policySourceArn: "arn:x", actionNames: ["s3:Get"] }),
    });
  });
});

// ─── P1 gap audit hooks ─────────────────────────────────
describe("useIAM — P1 gap hooks", () => {
  it("useUpdateUser PUTs rename", async () => {
    mockApi.mockResolvedValueOnce({ renamed: true });
    const { result } = renderHook(() => useUpdateUser(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "old", newName: "new" });
    expect(mockApi).toHaveBeenCalledWith("/aws/iam/users/old", {
      method: "PUT",
      body: JSON.stringify({ newName: "new" }),
    });
  });

  it("useUpdateRole PUTs description", async () => {
    mockApi.mockResolvedValueOnce({ updated: true });
    const { result } = renderHook(() => useUpdateRole(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "r1", description: "d" });
    expect(mockApi).toHaveBeenCalledWith("/aws/iam/roles/r1", {
      method: "PUT",
      body: JSON.stringify({ description: "d" }),
    });
  });

  it("service-linked role create/delete/status", async () => {
    mockApi.mockResolvedValueOnce({ role: {} });
    const { result: createR } = renderHook(() => useCreateServiceLinkedRole(), { wrapper: createWrapper() });
    await createR.current.mutateAsync({ roleName: "ecs.amazonaws.com" });
    expect(mockApi).toHaveBeenCalledWith("/aws/iam/roles/service-linked", {
      method: "POST",
      body: JSON.stringify({ roleName: "ecs.amazonaws.com" }),
    });

    mockApi.mockResolvedValueOnce({ deleted: true, deletionTaskId: "t1" });
    const { result: delR } = renderHook(() => useDeleteServiceLinkedRole(), { wrapper: createWrapper() });
    await delR.current.mutateAsync("slr");
    expect(mockApi).toHaveBeenCalledWith("/aws/iam/roles/service-linked/slr", { method: "DELETE" });

    mockApi.mockResolvedValueOnce({ status: "SUCCEEDED", reason: null, roleName: "slr" });
    const { result } = renderHook(() => useServiceLinkedRoleDeletionStatus("slr"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/iam/roles/service-linked/slr/deletion-status");
  });

  it("policy versions create/delete + entities", async () => {
    mockApi.mockResolvedValueOnce({ versionId: "v2" });
    const { result: createR } = renderHook(() => useCreatePolicyVersion(), { wrapper: createWrapper() });
    await createR.current.mutateAsync({ arn: "arn:p", document: "{}", setAsDefault: true });
    expect(mockApi).toHaveBeenCalledWith("/aws/iam/policies/arn%3Ap/versions", {
      method: "POST",
      body: JSON.stringify({ document: "{}", setAsDefault: true }),
    });

    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result: delR } = renderHook(() => useDeletePolicyVersion(), { wrapper: createWrapper() });
    await delR.current.mutateAsync({ arn: "arn:p", versionId: "v1" });
    expect(mockApi).toHaveBeenCalledWith("/aws/iam/policies/arn%3Ap/versions/v1", { method: "DELETE" });

    mockApi.mockResolvedValueOnce({ policyUsers: [], policyRoles: [], policyGroups: [], total: 0 });
    const { result } = renderHook(() => useListEntitiesForPolicy("arn:p"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/iam/policies/entities?policyArn=arn%3Ap");
  });

  it("entities query disabled without arn", () => {
    const { result } = renderHook(() => useListEntitiesForPolicy(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("attach/detach user+role+group policies", async () => {
    mockApi.mockResolvedValue({ attached: true });
    const { result: attachU } = renderHook(() => useAttachUserPolicy(), { wrapper: createWrapper() });
    await attachU.current.mutateAsync({ userName: "u1", policyArn: "arn:p" });
    expect(mockApi).toHaveBeenCalledWith("/aws/iam/users/u1/policies", {
      method: "POST",
      body: JSON.stringify({ policyArn: "arn:p" }),
    });
    const { result: detachU } = renderHook(() => useDetachUserPolicy(), { wrapper: createWrapper() });
    await detachU.current.mutateAsync({ userName: "u1", policyArn: "arn:p" });
    expect(mockApi).toHaveBeenCalledWith("/aws/iam/users/u1/policies/arn%3Ap", { method: "DELETE" });
    const { result: attachR } = renderHook(() => useAttachRolePolicy(), { wrapper: createWrapper() });
    await attachR.current.mutateAsync({ roleName: "r1", policyArn: "arn:p" });
    expect(mockApi).toHaveBeenCalledWith("/aws/iam/roles/r1/policies", {
      method: "POST",
      body: JSON.stringify({ policyArn: "arn:p" }),
    });
    const { result: detachR } = renderHook(() => useDetachRolePolicy(), { wrapper: createWrapper() });
    await detachR.current.mutateAsync({ roleName: "r1", policyArn: "arn:p" });
    expect(mockApi).toHaveBeenCalledWith("/aws/iam/roles/r1/policies/arn%3Ap", { method: "DELETE" });
    const { result: attachG } = renderHook(() => useAttachGroupPolicy(), { wrapper: createWrapper() });
    await attachG.current.mutateAsync({ groupName: "g1", policyArn: "arn:p" });
    expect(mockApi).toHaveBeenCalledWith("/aws/iam/groups/g1/policies", {
      method: "POST",
      body: JSON.stringify({ policyArn: "arn:p" }),
    });
    const { result: detachG } = renderHook(() => useDetachGroupPolicy(), { wrapper: createWrapper() });
    await detachG.current.mutateAsync({ groupName: "g1", policyArn: "arn:p" });
    expect(mockApi).toHaveBeenCalledWith("/aws/iam/groups/g1/policies/arn%3Ap", { method: "DELETE" });
  });

  it("400 when policyArn missing", async () => {
    mockApi.mockRejectedValueOnce(new Error("policyArn is required"));
    const { result } = renderHook(() => useAttachUserPolicy(), { wrapper: createWrapper() });
    await expect(result.current.mutateAsync({ userName: "u1", policyArn: "" })).rejects.toThrow();
  });

  it("group attached policies query", async () => {
    mockApi.mockResolvedValueOnce({ attachedPolicies: [{ name: "p", arn: "arn:p" }], total: 1 });
    const { result } = renderHook(() => useListAttachedGroupPolicies("g1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it("group attached policies query disabled without group", () => {
    const { result } = renderHook(() => useListAttachedGroupPolicies(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("role inline policies list + get", async () => {
    mockApi.mockResolvedValueOnce({ policyNames: ["p1"], total: 1 });
    const { result: list } = renderHook(() => useListRoleInlinePolicies("r1"), { wrapper: createWrapper() });
    await waitFor(() => expect(list.current.isSuccess).toBe(true));
    mockApi.mockResolvedValueOnce({ policyName: "p1", document: "{}" });
    const { result: get } = renderHook(() => useGetRoleInlinePolicy("r1", "p1"), { wrapper: createWrapper() });
    await waitFor(() => expect(get.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/iam/roles/r1/inline-policies/p1");
  });

  it("instance profiles + access key last used", async () => {
    mockApi.mockResolvedValueOnce({ instanceProfile: {} });
    const { result: ip } = renderHook(() => useInstanceProfile("ip1"), { wrapper: createWrapper() });
    await waitFor(() => expect(ip.current.isSuccess).toBe(true));
    mockApi.mockResolvedValueOnce({ instanceProfiles: [], total: 0 });
    const { result: ips } = renderHook(() => useListInstanceProfilesForRole("r1"), { wrapper: createWrapper() });
    await waitFor(() => expect(ips.current.isSuccess).toBe(true));
    mockApi.mockResolvedValueOnce({ userName: "u1", lastUsedDate: null, service: "s3", region: null });
    const { result: lu } = renderHook(() => useAccessKeyLastUsed("u1", "AKIA1"), { wrapper: createWrapper() });
    await waitFor(() => expect(lu.current.isSuccess).toBe(true));
  });

  it("account aliases + summary", async () => {
    mockApi.mockResolvedValueOnce({ aliases: ["a"], total: 1 });
    const { result: aliases } = renderHook(() => useAccountAliases(), { wrapper: createWrapper() });
    await waitFor(() => expect(aliases.current.isSuccess).toBe(true));
    mockApi.mockResolvedValueOnce({ created: true });
    const { result: createR } = renderHook(() => useCreateAccountAlias(), { wrapper: createWrapper() });
    await createR.current.mutateAsync("a2");
    expect(mockApi).toHaveBeenCalledWith("/aws/iam/account/aliases", {
      method: "POST",
      body: JSON.stringify({ alias: "a2" }),
    });
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result: delR } = renderHook(() => useDeleteAccountAlias(), { wrapper: createWrapper() });
    await delR.current.mutateAsync("a2");
    expect(mockApi).toHaveBeenCalledWith("/aws/iam/account/aliases/a2", { method: "DELETE" });
    mockApi.mockResolvedValueOnce({ summary: { Users: 1 } });
    const { result: summary } = renderHook(() => useAccountSummary(), { wrapper: createWrapper() });
    await waitFor(() => expect(summary.current.isSuccess).toBe(true));
  });

  it("OIDC provider hooks", async () => {
    mockApi.mockResolvedValueOnce({ providers: ["arn:o"], total: 1 });
    const { result: list } = renderHook(() => useOIDCProviders(), { wrapper: createWrapper() });
    await waitFor(() => expect(list.current.isSuccess).toBe(true));
    mockApi.mockResolvedValueOnce({ url: "https://idp", clientIds: ["c"], thumbprints: ["t"], createDate: null });
    const { result: getR } = renderHook(() => useOIDCProvider("arn:o"), { wrapper: createWrapper() });
    await waitFor(() => expect(getR.current.isSuccess).toBe(true));
    mockApi.mockResolvedValueOnce({ openIdConnectProviderArn: "arn:o" });
    const { result: createR } = renderHook(() => useCreateOIDCProvider(), { wrapper: createWrapper() });
    await createR.current.mutateAsync({ url: "https://idp" });
    expect(mockApi).toHaveBeenCalledWith("/aws/iam/oidc-providers", {
      method: "POST",
      body: JSON.stringify({ url: "https://idp" }),
    });
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result: delR } = renderHook(() => useDeleteOIDCProvider(), { wrapper: createWrapper() });
    await delR.current.mutateAsync("arn:o");
    expect(mockApi).toHaveBeenCalledWith("/aws/iam/oidc-providers/arn%3Ao", { method: "DELETE" });
    mockApi.mockResolvedValueOnce({ added: true });
    const { result: addId } = renderHook(() => useAddOIDCClientId("arn:o"), { wrapper: createWrapper() });
    await addId.current.mutateAsync("c2");
    expect(mockApi).toHaveBeenCalledWith("/aws/iam/oidc-providers/arn%3Ao/client-ids", {
      method: "POST",
      body: JSON.stringify({ clientId: "c2" }),
    });
    mockApi.mockResolvedValueOnce({ removed: true });
    const { result: remId } = renderHook(() => useRemoveOIDCClientId("arn:o"), { wrapper: createWrapper() });
    await remId.current.mutateAsync("c2");
    expect(mockApi).toHaveBeenCalledWith("/aws/iam/oidc-providers/arn%3Ao/client-ids/c2", { method: "DELETE" });
    mockApi.mockResolvedValueOnce({ updated: true });
    const { result: thumb } = renderHook(() => useUpdateOIDCThumbprint("arn:o"), { wrapper: createWrapper() });
    await thumb.current.mutateAsync(["tp"]);
    expect(mockApi).toHaveBeenCalledWith("/aws/iam/oidc-providers/arn%3Ao/thumbprint", {
      method: "PUT",
      body: JSON.stringify({ thumbprints: ["tp"] }),
    });
  });

  it("OIDC provider query disabled without arn", () => {
    const { result } = renderHook(() => useOIDCProvider(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("login profile query", async () => {
    mockApi.mockResolvedValueOnce({ userName: "u1", createdAt: null });
    const { result } = renderHook(() => useLoginProfile("u1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

