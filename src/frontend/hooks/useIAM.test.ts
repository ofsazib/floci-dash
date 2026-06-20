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
  useSetUserPermissionsBoundary,
  useDeleteUserPermissionsBoundary,
  useSetRolePermissionsBoundary,
  useDeleteRolePermissionsBoundary,
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

// ─── INSTANCE PROFILES ───────────────────────────────────

describe("useInstanceProfiles", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ instanceProfiles: [], total: 0 });
    const { result } = renderHook(() => useInstanceProfiles(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/iam/instance-profiles");
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
