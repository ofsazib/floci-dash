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
