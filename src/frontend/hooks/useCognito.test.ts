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
  useInitiateAuth,
  useAdminInitiateAuth,
  useConfirmSignUp,
  useAdminRespondToAuthChallenge,
  useForgotPassword,
  useConfirmForgotPassword,
  useGetUser,
  useUpdateUserAttributes,
  useDeleteUserAttributes,
  useUserPoolClientSecrets,
  useAddUserPoolClientSecret,
  useDeleteUserPoolClientSecret,
  useCognitoUser,
  useAdminRemoveUserFromGroup,
  useAdminResetUserPassword,
  useAdminUpdateUserAttributes,
  useCognitoGroup,
  useUpdateCognitoGroup,
  useUpdateCognitoUserPool,
  useUpdateCognitoUserPoolClient,
  useCognitoTags,
  useTagCognitoUserPool,
  useUntagCognitoUserPool,
  useChangePassword,
  useSignUp,
  useRespondToAuthChallenge,
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

  // ─── AUTH FLOW TESTER ──────────────────────────────

  it("useInitiateAuth calls POST", async () => {
    mockApi.mockResolvedValueOnce({ result: { AuthenticationResult: { AccessToken: "token" } } });
    const { result } = renderHook(() => useInitiateAuth(POOL_ID), { wrapper: createWrapper() });
    await result.current.mutateAsync({ clientId: "client-1", authFlow: "USER_PASSWORD_AUTH", authParameters: { USERNAME: "user1", PASSWORD: "pass" } });
    expect(mockApi).toHaveBeenCalledWith(`/aws/cognito/user-pools/${POOL_ID}/auth/initiate`, {
      method: "POST",
      body: JSON.stringify({ clientId: "client-1", authFlow: "USER_PASSWORD_AUTH", authParameters: { USERNAME: "user1", PASSWORD: "pass" } }),
    });
  });

  it("useAdminInitiateAuth calls POST", async () => {
    mockApi.mockResolvedValueOnce({ result: { AuthenticationResult: { AccessToken: "token" } } });
    const { result } = renderHook(() => useAdminInitiateAuth(POOL_ID), { wrapper: createWrapper() });
    await result.current.mutateAsync({ clientId: "client-1", authFlow: "ADMIN_NO_SRP_AUTH", authParameters: { USERNAME: "user1", PASSWORD: "pass" } });
    expect(mockApi).toHaveBeenCalledWith(`/aws/cognito/user-pools/${POOL_ID}/auth/admin-initiate`, {
      method: "POST",
      body: JSON.stringify({ clientId: "client-1", authFlow: "ADMIN_NO_SRP_AUTH", authParameters: { USERNAME: "user1", PASSWORD: "pass" } }),
    });
  });

  it("useConfirmSignUp calls POST", async () => {
    mockApi.mockResolvedValueOnce({ confirmed: true });
    const { result } = renderHook(() => useConfirmSignUp(POOL_ID), { wrapper: createWrapper() });
    await result.current.mutateAsync({ clientId: "client-1", username: "user1", confirmationCode: "123456" });
    expect(mockApi).toHaveBeenCalledWith(`/aws/cognito/user-pools/${POOL_ID}/auth/confirm-sign-up`, {
      method: "POST",
      body: JSON.stringify({ clientId: "client-1", username: "user1", confirmationCode: "123456" }),
    });
  });

  it("useAdminRespondToAuthChallenge calls POST", async () => {
    mockApi.mockResolvedValueOnce({ result: { ChallengeName: "NEW_PASSWORD_REQUIRED" } });
    const { result } = renderHook(() => useAdminRespondToAuthChallenge(POOL_ID), { wrapper: createWrapper() });
    await result.current.mutateAsync({
      clientId: "client-1",
      challengeName: "NEW_PASSWORD_REQUIRED",
      challengeResponses: { USERNAME: "user1", NEW_PASSWORD: "Pass123!" },
    });
    expect(mockApi).toHaveBeenCalledWith(`/aws/cognito/user-pools/${POOL_ID}/auth/admin-respond-challenge`, {
      method: "POST",
      body: JSON.stringify({
        clientId: "client-1",
        challengeName: "NEW_PASSWORD_REQUIRED",
        challengeResponses: { USERNAME: "user1", NEW_PASSWORD: "Pass123!" },
      }),
    });
  });

  it("useForgotPassword calls POST", async () => {
    mockApi.mockResolvedValueOnce({ result: {} });
    const { result } = renderHook(() => useForgotPassword(POOL_ID), { wrapper: createWrapper() });
    await result.current.mutateAsync({ clientId: "client-1", username: "user1" });
    expect(mockApi).toHaveBeenCalledWith(`/aws/cognito/user-pools/${POOL_ID}/auth/forgot-password`, {
      method: "POST",
      body: JSON.stringify({ clientId: "client-1", username: "user1" }),
    });
  });

  it("useConfirmForgotPassword calls POST", async () => {
    mockApi.mockResolvedValueOnce({ result: {} });
    const { result } = renderHook(() => useConfirmForgotPassword(POOL_ID), { wrapper: createWrapper() });
    await result.current.mutateAsync({
      clientId: "client-1",
      username: "user1",
      confirmationCode: "123456",
      password: "NewPass123!",
    });
    expect(mockApi).toHaveBeenCalledWith(`/aws/cognito/user-pools/${POOL_ID}/auth/confirm-forgot-password`, {
      method: "POST",
      body: JSON.stringify({
        clientId: "client-1",
        username: "user1",
        confirmationCode: "123456",
        password: "NewPass123!",
      }),
    });
  });

  it("useGetUser calls POST", async () => {
    mockApi.mockResolvedValueOnce({ result: { Username: "user1" } });
    const { result } = renderHook(() => useGetUser(POOL_ID), { wrapper: createWrapper() });
    await result.current.mutateAsync({ accessToken: "access-token" });
    expect(mockApi).toHaveBeenCalledWith(`/aws/cognito/user-pools/${POOL_ID}/auth/get-user`, {
      method: "POST",
      body: JSON.stringify({ accessToken: "access-token" }),
    });
  });

  it("useUpdateUserAttributes calls POST", async () => {
    mockApi.mockResolvedValueOnce({ result: {} });
    const { result } = renderHook(() => useUpdateUserAttributes(POOL_ID), { wrapper: createWrapper() });
    await result.current.mutateAsync({
      accessToken: "access-token",
      userAttributes: [{ Name: "email", Value: "user@example.com" }],
    });
    expect(mockApi).toHaveBeenCalledWith(`/aws/cognito/user-pools/${POOL_ID}/auth/update-user-attributes`, {
      method: "POST",
      body: JSON.stringify({
        accessToken: "access-token",
        userAttributes: [{ Name: "email", Value: "user@example.com" }],
      }),
    });
  });

  it("useDeleteUserAttributes calls POST", async () => {
    mockApi.mockResolvedValueOnce({ result: {} });
    const { result } = renderHook(() => useDeleteUserAttributes(POOL_ID), { wrapper: createWrapper() });
    await result.current.mutateAsync({ accessToken: "access-token", userAttributeNames: ["email"] });
    expect(mockApi).toHaveBeenCalledWith(`/aws/cognito/user-pools/${POOL_ID}/auth/delete-user-attributes`, {
      method: "POST",
      body: JSON.stringify({ accessToken: "access-token", userAttributeNames: ["email"] }),
    });
  });

  it("useUserPoolClientSecrets calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ secrets: [] });
    const { result } = renderHook(() => useUserPoolClientSecrets(POOL_ID, "client-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(`/aws/cognito/user-pools/${POOL_ID}/clients/client-1/secrets`);
  });

  it("useUserPoolClientSecrets disabled when params null", () => {
    const { result } = renderHook(() => useUserPoolClientSecrets(null, null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useAddUserPoolClientSecret calls POST", async () => {
    mockApi.mockResolvedValueOnce({ secret: { ClientSecretId: "secret-1" } });
    const { result } = renderHook(() => useAddUserPoolClientSecret(POOL_ID), { wrapper: createWrapper() });
    await result.current.mutateAsync({ clientId: "client-1", clientSecret: "mysecret" });
    expect(mockApi).toHaveBeenCalledWith(`/aws/cognito/user-pools/${POOL_ID}/clients/client-1/secrets`, {
      method: "POST",
      body: JSON.stringify({ clientSecret: "mysecret" }),
    });
  });

  it("useDeleteUserPoolClientSecret calls DELETE", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteUserPoolClientSecret(POOL_ID), { wrapper: createWrapper() });
    await result.current.mutateAsync({ clientId: "client-1", secretId: "secret-1" });
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/cognito/user-pools/${POOL_ID}/clients/client-1/secrets/secret-1`,
      { method: "DELETE" }
    );
  });

  it("useCognitoUser is disabled when username is null", async () => {
    const { result } = renderHook(() => useCognitoUser(POOL_ID, null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useCognitoUser calls GET", async () => {
    mockApi.mockResolvedValueOnce({ user: { Username: "alice" } });
    const { result } = renderHook(() => useCognitoUser(POOL_ID, "alice"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(`/aws/cognito/user-pools/${POOL_ID}/users/alice`);
  });

  it("useAdminRemoveUserFromGroup calls DELETE", async () => {
    mockApi.mockResolvedValueOnce({ removed: true });
    const { result } = renderHook(() => useAdminRemoveUserFromGroup(POOL_ID), { wrapper: createWrapper() });
    await result.current.mutateAsync({ username: "alice", groupName: "admins" });
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/cognito/user-pools/${POOL_ID}/users/alice/groups/admins`,
      { method: "DELETE" }
    );
  });

  it("useAdminResetUserPassword calls POST", async () => {
    mockApi.mockResolvedValueOnce({ reset: true });
    const { result } = renderHook(() => useAdminResetUserPassword(POOL_ID), { wrapper: createWrapper() });
    await result.current.mutateAsync({ username: "alice" });
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/cognito/user-pools/${POOL_ID}/users/alice/reset-password`,
      { method: "POST" }
    );
  });

  it("useAdminUpdateUserAttributes calls POST with body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useAdminUpdateUserAttributes(POOL_ID), { wrapper: createWrapper() });
    await result.current.mutateAsync({
      username: "alice",
      userAttributes: [{ Name: "email", Value: "alice@x.com" }],
    });
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/cognito/user-pools/${POOL_ID}/users/alice/attributes`,
      expect.objectContaining({ method: "POST", body: JSON.stringify({ userAttributes: [{ Name: "email", Value: "alice@x.com" }] }) })
    );
  });

  it("useCognitoGroup is disabled when groupName is null", async () => {
    const { result } = renderHook(() => useCognitoGroup(POOL_ID, null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useCognitoGroup calls GET", async () => {
    mockApi.mockResolvedValueOnce({ group: { GroupName: "admins" } });
    const { result } = renderHook(() => useCognitoGroup(POOL_ID, "admins"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(`/aws/cognito/user-pools/${POOL_ID}/groups/admins`);
  });

  it("useUpdateCognitoGroup calls PUT with body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useUpdateCognitoGroup(POOL_ID), { wrapper: createWrapper() });
    await result.current.mutateAsync({ groupName: "admins", description: "New desc", precedence: 5 });
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/cognito/user-pools/${POOL_ID}/groups/admins`,
      expect.objectContaining({ method: "PUT", body: JSON.stringify({ description: "New desc", roleArn: undefined, precedence: 5 }) })
    );
  });

  it("useUpdateCognitoUserPool calls PUT with body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useUpdateCognitoUserPool(POOL_ID), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "renamed", mfaConfiguration: "ON" });
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/cognito/user-pools/${POOL_ID}`,
      expect.objectContaining({ method: "PUT", body: JSON.stringify({ name: "renamed", mfaConfiguration: "ON" }) })
    );
  });

  it("useUpdateCognitoUserPoolClient calls PUT with body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useUpdateCognitoUserPoolClient(POOL_ID), { wrapper: createWrapper() });
    await result.current.mutateAsync({ clientId: "client-1", name: "renamed", refreshTokenValidity: 30 });
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/cognito/user-pools/${POOL_ID}/clients/client-1`,
      expect.objectContaining({ method: "PUT", body: JSON.stringify({ clientId: "client-1", name: "renamed", refreshTokenValidity: 30 }) })
    );
  });

  it("useCognitoTags is disabled when userPoolId is null", async () => {
    const { result } = renderHook(() => useCognitoTags(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useCognitoTags calls GET", async () => {
    mockApi.mockResolvedValueOnce({ tags: { env: "prod" } });
    const { result } = renderHook(() => useCognitoTags(POOL_ID), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(`/aws/cognito/user-pools/${POOL_ID}/tags`);
  });

  it("useTagCognitoUserPool calls POST with body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useTagCognitoUserPool(POOL_ID), { wrapper: createWrapper() });
    await result.current.mutateAsync({ tags: { env: "prod" } });
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/cognito/user-pools/${POOL_ID}/tags`,
      expect.objectContaining({ method: "POST", body: JSON.stringify({ tags: { env: "prod" } }) })
    );
  });

  it("useUntagCognitoUserPool calls DELETE with body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useUntagCognitoUserPool(POOL_ID), { wrapper: createWrapper() });
    await result.current.mutateAsync({ tagKeys: ["env"] });
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/cognito/user-pools/${POOL_ID}/tags`,
      expect.objectContaining({ method: "DELETE", body: JSON.stringify({ tagKeys: ["env"] }) })
    );
  });

  it("useChangePassword calls POST with body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useChangePassword(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ accessToken: "tok", previousPassword: "old", proposedPassword: "new" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/cognito/auth/change-password",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ accessToken: "tok", previousPassword: "old", proposedPassword: "new" }) })
    );
  });

  it("useSignUp calls POST with body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useSignUp(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ clientId: "client-1", username: "bob", password: "Passw0rd!" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/cognito/auth/sign-up",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ clientId: "client-1", username: "bob", password: "Passw0rd!" }) })
    );
  });

  it("useRespondToAuthChallenge calls POST with body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useRespondToAuthChallenge(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ clientId: "client-1", challengeName: "NEW_PASSWORD_REQUIRED" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/cognito/auth/respond-challenge",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ clientId: "client-1", challengeName: "NEW_PASSWORD_REQUIRED" }) })
    );
  });
});
