// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createWrapper } from "../../test/helpers";

const mockApi = vi.hoisted(() => vi.fn());

vi.mock("../lib/client", () => ({
  api: (...args: any[]) => mockApi(...args),
}));

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  };
});

import {
  useCognitoUserPools,
  useCognitoUserPool,
  useCreateCognitoUserPool,
  useDeleteCognitoUserPool,
  useCognitoUsers,
  useCreateCognitoUser,
  useDeleteCognitoUser,
  useDisableCognitoUser,
  useEnableCognitoUser,
  useCognitoGroups,
  useCreateCognitoGroup,
  useDeleteCognitoGroup,
  useCognitoUserPoolClients,
  useCreateCognitoUserPoolClient,
  useDeleteCognitoUserPoolClient,
  useResourceServers,
  useCreateResourceServer,
  useDeleteResourceServer,
  useMfaConfig,
  useSetMfaConfig,
  useAddCustomAttributes,
  useAdminDeleteUserAttributes,
  useAdminUserGlobalSignOut,
  useAdminConfirmSignUp,
  useAdminListGroupsForUser,
  useListUsersInGroup,
} from "./useCognito";

beforeEach(() => mockApi.mockReset());

describe("useCognito hooks", () => {
  const POOL_ID = "us-east-1_abc";

  it("useCognitoUserPools calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ userPools: [], total: 0 });
    const { result } = renderHook(() => useCognitoUserPools(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/cognito/user-pools");
  });

  it("useCognitoUserPool calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ userPool: {} });
    const { result } = renderHook(() => useCognitoUserPool(POOL_ID), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(`/aws/cognito/user-pools/${POOL_ID}`);
  });

  it("useCognitoUserPool disabled when null", () => {
    const { result } = renderHook(() => useCognitoUserPool(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useCreateCognitoUserPool calls POST", async () => {
    mockApi.mockResolvedValueOnce({ userPool: {} });
    const { result } = renderHook(() => useCreateCognitoUserPool(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ poolName: "mypool" });
    expect(mockApi).toHaveBeenCalledWith("/aws/cognito/user-pools", {
      method: "POST",
      body: JSON.stringify({ poolName: "mypool" }),
    });
  });

  it("useDeleteCognitoUserPool calls DELETE", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteCognitoUserPool(), { wrapper: createWrapper() });
    await result.current.mutateAsync(POOL_ID);
    expect(mockApi).toHaveBeenCalledWith(`/aws/cognito/user-pools/${POOL_ID}`, {
      method: "DELETE",
    });
  });

  it("useCognitoUsers calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ users: [], total: 0 });
    const { result } = renderHook(() => useCognitoUsers(POOL_ID), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(`/aws/cognito/user-pools/${POOL_ID}/users`);
  });

  it("useCognitoUsers disabled when null", () => {
    const { result } = renderHook(() => useCognitoUsers(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useCreateCognitoUser calls POST", async () => {
    mockApi.mockResolvedValueOnce({ user: {} });
    const { result } = renderHook(() => useCreateCognitoUser(POOL_ID), { wrapper: createWrapper() });
    await result.current.mutateAsync({ username: "user1" });
    expect(mockApi).toHaveBeenCalledWith(`/aws/cognito/user-pools/${POOL_ID}/users`, {
      method: "POST",
      body: JSON.stringify({ username: "user1" }),
    });
  });

  it("useDeleteCognitoUser calls DELETE", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteCognitoUser(POOL_ID), { wrapper: createWrapper() });
    await result.current.mutateAsync("user1");
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/cognito/user-pools/${POOL_ID}/users/user1`,
      { method: "DELETE" }
    );
  });

  it("useDisableCognitoUser calls PUT disable", async () => {
    mockApi.mockResolvedValueOnce({ disabled: true });
    const { result } = renderHook(() => useDisableCognitoUser(POOL_ID), { wrapper: createWrapper() });
    await result.current.mutateAsync("user1");
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/cognito/user-pools/${POOL_ID}/users/user1/disable`,
      { method: "PUT" }
    );
  });

  it("useEnableCognitoUser calls PUT enable", async () => {
    mockApi.mockResolvedValueOnce({ enabled: true });
    const { result } = renderHook(() => useEnableCognitoUser(POOL_ID), { wrapper: createWrapper() });
    await result.current.mutateAsync("user1");
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/cognito/user-pools/${POOL_ID}/users/user1/enable`,
      { method: "PUT" }
    );
  });

  it("useCognitoGroups calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ groups: [], total: 0 });
    const { result } = renderHook(() => useCognitoGroups(POOL_ID), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(`/aws/cognito/user-pools/${POOL_ID}/groups`);
  });

  it("useCognitoGroups disabled when null", () => {
    const { result } = renderHook(() => useCognitoGroups(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useCreateCognitoGroup calls POST", async () => {
    mockApi.mockResolvedValueOnce({ group: {} });
    const { result } = renderHook(() => useCreateCognitoGroup(POOL_ID), { wrapper: createWrapper() });
    await result.current.mutateAsync({ groupName: "admins" });
    expect(mockApi).toHaveBeenCalledWith(`/aws/cognito/user-pools/${POOL_ID}/groups`, {
      method: "POST",
      body: JSON.stringify({ groupName: "admins" }),
    });
  });

  it("useDeleteCognitoGroup calls DELETE", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteCognitoGroup(POOL_ID), { wrapper: createWrapper() });
    await result.current.mutateAsync("admins");
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/cognito/user-pools/${POOL_ID}/groups/admins`,
      { method: "DELETE" }
    );
  });

  it("useCognitoUserPoolClients calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ clients: [], total: 0 });
    const { result } = renderHook(() => useCognitoUserPoolClients(POOL_ID), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(`/aws/cognito/user-pools/${POOL_ID}/clients`);
  });

  it("useCognitoUserPoolClients disabled when null", () => {
    const { result } = renderHook(() => useCognitoUserPoolClients(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useCreateCognitoUserPoolClient calls POST", async () => {
    mockApi.mockResolvedValueOnce({ client: {} });
    const { result } = renderHook(() => useCreateCognitoUserPoolClient(POOL_ID), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({ clientName: "myapp" });
    expect(mockApi).toHaveBeenCalledWith(`/aws/cognito/user-pools/${POOL_ID}/clients`, {
      method: "POST",
      body: JSON.stringify({ clientName: "myapp" }),
    });
  });

  it("useDeleteCognitoUserPoolClient calls DELETE", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteCognitoUserPoolClient(POOL_ID), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync("client-1");
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/cognito/user-pools/${POOL_ID}/clients/client-1`,
      { method: "DELETE" }
    );
  });

  // ─── RESOURCE SERVERS ──────────────────────────────

  it("useResourceServers calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ resourceServers: [], total: 0 });
    const { result } = renderHook(() => useResourceServers(POOL_ID), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(`/aws/cognito/user-pools/${POOL_ID}/resource-servers`);
  });

  it("useResourceServers disabled when null", () => {
    const { result } = renderHook(() => useResourceServers(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useCreateResourceServer calls POST", async () => {
    mockApi.mockResolvedValueOnce({ created: true });
    const { result } = renderHook(() => useCreateResourceServer(POOL_ID), { wrapper: createWrapper() });
    await result.current.mutateAsync({ identifier: "https://api.example.com", name: "My API" });
    expect(mockApi).toHaveBeenCalledWith(`/aws/cognito/user-pools/${POOL_ID}/resource-servers`, {
      method: "POST",
      body: JSON.stringify({ identifier: "https://api.example.com", name: "My API" }),
    });
  });

  it("useDeleteResourceServer calls DELETE", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteResourceServer(POOL_ID), { wrapper: createWrapper() });
    await result.current.mutateAsync("https://api.example.com");
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/cognito/user-pools/${POOL_ID}/resource-servers/${encodeURIComponent("https://api.example.com")}`,
      { method: "DELETE" }
    );
  });

  // ─── MFA CONFIG ────────────────────────────────────

  it("useMfaConfig calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ mfaConfiguration: "OFF" });
    const { result } = renderHook(() => useMfaConfig(POOL_ID), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(`/aws/cognito/user-pools/${POOL_ID}/mfa-config`);
  });

  it("useMfaConfig disabled when null", () => {
    const { result } = renderHook(() => useMfaConfig(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useSetMfaConfig calls PUT", async () => {
    mockApi.mockResolvedValueOnce({ updated: true });
    const { result } = renderHook(() => useSetMfaConfig(POOL_ID), { wrapper: createWrapper() });
    await result.current.mutateAsync({ mfaConfiguration: "ON" });
    expect(mockApi).toHaveBeenCalledWith(`/aws/cognito/user-pools/${POOL_ID}/mfa-config`, {
      method: "PUT",
      body: JSON.stringify({ mfaConfiguration: "ON" }),
    });
  });

  // ─── CUSTOM ATTRIBUTES ─────────────────────────────

  it("useAddCustomAttributes calls POST", async () => {
    mockApi.mockResolvedValueOnce({ added: true });
    const { result } = renderHook(() => useAddCustomAttributes(POOL_ID), { wrapper: createWrapper() });
    await result.current.mutateAsync({ customAttributes: [{ Name: "custom:role", AttributeDataType: "string" }] });
    expect(mockApi).toHaveBeenCalledWith(`/aws/cognito/user-pools/${POOL_ID}/custom-attributes`, {
      method: "POST",
      body: JSON.stringify({ customAttributes: [{ Name: "custom:role", AttributeDataType: "string" }] }),
    });
  });

  // ─── ADMIN USER OPERATIONS ─────────────────────────

  it("useAdminDeleteUserAttributes calls POST", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useAdminDeleteUserAttributes(POOL_ID), { wrapper: createWrapper() });
    await result.current.mutateAsync({ username: "user1", userAttributeNames: ["custom:role"] });
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/cognito/user-pools/${POOL_ID}/users/user1/delete-attributes`,
      { method: "POST", body: JSON.stringify({ userAttributeNames: ["custom:role"] }) }
    );
  });

  it("useAdminUserGlobalSignOut calls POST", async () => {
    mockApi.mockResolvedValueOnce({ signedOut: true });
    const { result } = renderHook(() => useAdminUserGlobalSignOut(POOL_ID), { wrapper: createWrapper() });
    await result.current.mutateAsync("user1");
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/cognito/user-pools/${POOL_ID}/users/user1/sign-out`,
      { method: "POST" }
    );
  });

  it("useAdminConfirmSignUp calls POST", async () => {
    mockApi.mockResolvedValueOnce({ confirmed: true });
    const { result } = renderHook(() => useAdminConfirmSignUp(POOL_ID), { wrapper: createWrapper() });
    await result.current.mutateAsync("user1");
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/cognito/user-pools/${POOL_ID}/users/user1/confirm`,
      { method: "POST" }
    );
  });

  it("useAdminListGroupsForUser calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ groups: [], total: 0 });
    const { result } = renderHook(() => useAdminListGroupsForUser(POOL_ID, "user1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(`/aws/cognito/user-pools/${POOL_ID}/users/user1/groups`);
  });

  it("useAdminListGroupsForUser disabled when params null", () => {
    const { result } = renderHook(() => useAdminListGroupsForUser(null, null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  // ─── GROUP MEMBERS ─────────────────────────────────

  it("useListUsersInGroup calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ users: [], total: 0 });
    const { result } = renderHook(() => useListUsersInGroup(POOL_ID, "admins"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(`/aws/cognito/user-pools/${POOL_ID}/groups/admins/users`);
  });

  it("useListUsersInGroup disabled when params null", () => {
    const { result } = renderHook(() => useListUsersInGroup(null, null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });
});
