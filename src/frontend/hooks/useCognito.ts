import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface CognitoUserPool {
  Id: string;
  Name: string;
  Arn?: string;
  Status?: string;
  LambdaConfig?: Record<string, string>;
  LastModifiedDate?: number;
  CreationDate?: number;
}

export interface CognitoUser {
  Username: string;
  UserStatus?: string;
  Enabled?: boolean;
  UserCreateDate?: number;
  UserLastModifiedDate?: number;
  Attributes?: { Name: string; Value: string }[];
}

export interface CognitoGroup {
  GroupName: string;
  UserPoolId: string;
  Description?: string;
  Precedence?: number;
  RoleArn?: string;
  CreationDate?: number;
  LastModifiedDate?: number;
}

export interface CognitoUserPoolClient {
  ClientId: string;
  UserPoolId: string;
  ClientName: string;
  CreationDate?: number;
  LastModifiedDate?: number;
}

// ── User Pools ───────────────────────────────────────────

export function useCognitoUserPools() {
  return useQuery<{ userPools: CognitoUserPool[]; total: number }>({
    queryKey: ["aws", "cognito", "user-pools"],
    queryFn: () => api("/aws/cognito/user-pools"),
    refetchInterval: 10000,
  });
}

export function useCognitoUserPool(id: string | null) {
  return useQuery<{ userPool: CognitoUserPool }>({
    queryKey: ["aws", "cognito", "user-pool", id],
    queryFn: () => api(`/aws/cognito/user-pools/${encodeURIComponent(id!)}`),
    enabled: !!id,
  });
}

export function useCreateCognitoUserPool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { poolName: string }) =>
      api("/aws/cognito/user-pools", { method: "POST", body: JSON.stringify(params) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "cognito", "user-pools"] }),
  });
}

export function useDeleteCognitoUserPool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/aws/cognito/user-pools/${encodeURIComponent(id)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "cognito", "user-pools"] }),
  });
}

// ── Users ────────────────────────────────────────────────

export function useCognitoUsers(userPoolId: string | null) {
  return useQuery<{ users: CognitoUser[]; total: number }>({
    queryKey: ["aws", "cognito", "users", userPoolId],
    queryFn: () => api(`/aws/cognito/user-pools/${encodeURIComponent(userPoolId!)}/users`),
    enabled: !!userPoolId,
  });
}

export function useCreateCognitoUser(userPoolId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      username: string;
      temporaryPassword?: string;
      userAttributes?: { Name: string; Value: string }[];
    }) =>
      api(`/aws/cognito/user-pools/${encodeURIComponent(userPoolId)}/users`, {
        method: "POST",
        body: JSON.stringify(params),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "cognito", "users", userPoolId] }),
  });
}

export function useDeleteCognitoUser(userPoolId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (username: string) =>
      api(
        `/aws/cognito/user-pools/${encodeURIComponent(userPoolId)}/users/${encodeURIComponent(username)}`,
        { method: "DELETE" }
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "cognito", "users", userPoolId] }),
  });
}

export function useDisableCognitoUser(userPoolId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (username: string) =>
      api(
        `/aws/cognito/user-pools/${encodeURIComponent(userPoolId)}/users/${encodeURIComponent(username)}/disable`,
        { method: "PUT" }
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "cognito", "users", userPoolId] }),
  });
}

export function useEnableCognitoUser(userPoolId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (username: string) =>
      api(
        `/aws/cognito/user-pools/${encodeURIComponent(userPoolId)}/users/${encodeURIComponent(username)}/enable`,
        { method: "PUT" }
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "cognito", "users", userPoolId] }),
  });
}

// ── Groups ───────────────────────────────────────────────

export function useCognitoGroups(userPoolId: string | null) {
  return useQuery<{ groups: CognitoGroup[]; total: number }>({
    queryKey: ["aws", "cognito", "groups", userPoolId],
    queryFn: () => api(`/aws/cognito/user-pools/${encodeURIComponent(userPoolId!)}/groups`),
    enabled: !!userPoolId,
  });
}

export function useCreateCognitoGroup(userPoolId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      groupName: string;
      description?: string;
      precedence?: number;
      roleArn?: string;
    }) =>
      api(`/aws/cognito/user-pools/${encodeURIComponent(userPoolId)}/groups`, {
        method: "POST",
        body: JSON.stringify(params),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "cognito", "groups", userPoolId] }),
  });
}

export function useDeleteCognitoGroup(userPoolId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (groupName: string) =>
      api(
        `/aws/cognito/user-pools/${encodeURIComponent(userPoolId)}/groups/${encodeURIComponent(groupName)}`,
        { method: "DELETE" }
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "cognito", "groups", userPoolId] }),
  });
}

// ── User Pool Clients ────────────────────────────────────

export function useCognitoUserPoolClients(userPoolId: string | null) {
  return useQuery<{ clients: CognitoUserPoolClient[]; total: number }>({
    queryKey: ["aws", "cognito", "clients", userPoolId],
    queryFn: () => api(`/aws/cognito/user-pools/${encodeURIComponent(userPoolId!)}/clients`),
    enabled: !!userPoolId,
  });
}

export function useCreateCognitoUserPoolClient(userPoolId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      clientName: string;
      generateSecret?: boolean;
      callbackURLs?: string[];
      logoutURLs?: string[];
    }) =>
      api(`/aws/cognito/user-pools/${encodeURIComponent(userPoolId)}/clients`, {
        method: "POST",
        body: JSON.stringify(params),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "cognito", "clients", userPoolId] }),
  });
}

export function useDeleteCognitoUserPoolClient(userPoolId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (clientId: string) =>
      api(
        `/aws/cognito/user-pools/${encodeURIComponent(userPoolId)}/clients/${encodeURIComponent(clientId)}`,
        { method: "DELETE" }
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "cognito", "clients", userPoolId] }),
  });
}

// ─── Resource Servers ────────────────────────────────────

export function useResourceServers(userPoolId: string | null) {
  return useQuery<{ resourceServers: any[]; total: number }>({
    queryKey: ["aws", "cognito", "resource-servers", userPoolId],
    queryFn: () => api(`/aws/cognito/user-pools/${encodeURIComponent(userPoolId!)}/resource-servers`),
    enabled: !!userPoolId,
  });
}

export function useCreateResourceServer(userPoolId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { identifier: string; name: string; scopes?: { ScopeName: string; ScopeDescription: string }[] }) =>
      api(`/aws/cognito/user-pools/${encodeURIComponent(userPoolId)}/resource-servers`, { method: "POST", body: JSON.stringify(params) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "cognito", "resource-servers", userPoolId] }),
  });
}

export function useDeleteResourceServer(userPoolId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (identifier: string) =>
      api(`/aws/cognito/user-pools/${encodeURIComponent(userPoolId)}/resource-servers/${encodeURIComponent(identifier)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "cognito", "resource-servers", userPoolId] }),
  });
}

// ─── MFA Config ──────────────────────────────────────────

export function useMfaConfig(userPoolId: string | null) {
  return useQuery<any>({
    queryKey: ["aws", "cognito", "mfa-config", userPoolId],
    queryFn: () => api(`/aws/cognito/user-pools/${encodeURIComponent(userPoolId!)}/mfa-config`),
    enabled: !!userPoolId,
  });
}

export function useSetMfaConfig(userPoolId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { mfaConfiguration: string; smsAuthenticationMessage?: string }) =>
      api(`/aws/cognito/user-pools/${encodeURIComponent(userPoolId)}/mfa-config`, { method: "PUT", body: JSON.stringify(params) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "cognito", "mfa-config", userPoolId] }),
  });
}

// ─── Custom Attributes ───────────────────────────────────

export function useAddCustomAttributes(userPoolId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { customAttributes: { Name: string; AttributeDataType?: string; Mutable?: boolean; Required?: boolean }[] }) =>
      api(`/aws/cognito/user-pools/${encodeURIComponent(userPoolId)}/custom-attributes`, { method: "POST", body: JSON.stringify(params) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "cognito", "user-pool", userPoolId] }),
  });
}

// ─── Admin User Operations ───────────────────────────────

export function useAdminDeleteUserAttributes(userPoolId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { username: string; userAttributeNames: string[] }) =>
      api(`/aws/cognito/user-pools/${encodeURIComponent(userPoolId)}/users/${encodeURIComponent(params.username)}/delete-attributes`, { method: "POST", body: JSON.stringify({ userAttributeNames: params.userAttributeNames }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "cognito", "users", userPoolId] }),
  });
}

export function useAdminUserGlobalSignOut(userPoolId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (username: string) =>
      api(`/aws/cognito/user-pools/${encodeURIComponent(userPoolId)}/users/${encodeURIComponent(username)}/sign-out`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "cognito", "users", userPoolId] }),
  });
}

export function useAdminConfirmSignUp(userPoolId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (username: string) =>
      api(`/aws/cognito/user-pools/${encodeURIComponent(userPoolId)}/users/${encodeURIComponent(username)}/confirm`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "cognito", "users", userPoolId] }),
  });
}

export function useAdminListGroupsForUser(userPoolId: string | null, username: string | null) {
  return useQuery<{ groups: any[]; total: number }>({
    queryKey: ["aws", "cognito", "user-groups", userPoolId, username],
    queryFn: () => api(`/aws/cognito/user-pools/${encodeURIComponent(userPoolId!)}/users/${encodeURIComponent(username!)}/groups`),
    enabled: !!userPoolId && !!username,
  });
}

// ─── Group Members ───────────────────────────────────────

export function useListUsersInGroup(userPoolId: string | null, groupName: string | null) {
  return useQuery<{ users: any[]; total: number }>({
    queryKey: ["aws", "cognito", "group-users", userPoolId, groupName],
    queryFn: () => api(`/aws/cognito/user-pools/${encodeURIComponent(userPoolId!)}/groups/${encodeURIComponent(groupName!)}/users`),
    enabled: !!userPoolId && !!groupName,
  });
}

// ─── Client Secrets ──────────────────────────────────────

export function useUserPoolClientSecrets(userPoolId: string | null, clientId: string | null) {
  return useQuery<{ secrets: any[] }>({
    queryKey: ["aws", "cognito", "client-secrets", userPoolId, clientId],
    queryFn: () => api(`/aws/cognito/user-pools/${encodeURIComponent(userPoolId!)}/clients/${encodeURIComponent(clientId!)}/secrets`),
    enabled: !!userPoolId && !!clientId,
  });
}

// ─── Auth Flow Tester ─────────────────────────────────────

export interface AuthFlowResult {
  ChallengeName?: string;
  Session?: string;
  AuthenticationResult?: {
    AccessToken?: string;
    IdToken?: string;
    RefreshToken?: string;
    TokenType?: string;
    ExpiresIn?: number;
  };
}

export function useInitiateAuth(userPoolId: string) {
  return useMutation<{ result: AuthFlowResult }, Error, { clientId: string; authFlow: string; authParameters?: Record<string, string> }>({
    mutationFn: (params) =>
      api(`/aws/cognito/user-pools/${encodeURIComponent(userPoolId)}/auth/initiate`, {
        method: "POST",
        body: JSON.stringify(params),
      }),
  });
}

export function useAdminInitiateAuth(userPoolId: string) {
  return useMutation<{ result: AuthFlowResult }, Error, { clientId: string; authFlow: string; authParameters?: Record<string, string> }>({
    mutationFn: (params) =>
      api(`/aws/cognito/user-pools/${encodeURIComponent(userPoolId)}/auth/admin-initiate`, {
        method: "POST",
        body: JSON.stringify(params),
      }),
  });
}

export function useConfirmSignUp(userPoolId: string) {
  return useMutation<{ confirmed: boolean }, Error, { clientId: string; username: string; confirmationCode: string; secretHash?: string }>({
    mutationFn: (params) =>
      api(`/aws/cognito/user-pools/${encodeURIComponent(userPoolId)}/auth/confirm-sign-up`, {
        method: "POST",
        body: JSON.stringify(params),
      }),
  });
}

export function useAdminRespondToAuthChallenge(userPoolId: string) {
  return useMutation<{ result: AuthFlowResult }, Error, { clientId: string; challengeName: string; challengeResponses?: Record<string, string>; session?: string }>({
    mutationFn: (params) =>
      api(`/aws/cognito/user-pools/${encodeURIComponent(userPoolId)}/auth/admin-respond-challenge`, {
        method: "POST",
        body: JSON.stringify(params),
      }),
  });
}

export function useForgotPassword(userPoolId: string) {
  return useMutation<{ result: any }, Error, { clientId: string; username: string; secretHash?: string }>({
    mutationFn: (params) =>
      api(`/aws/cognito/user-pools/${encodeURIComponent(userPoolId)}/auth/forgot-password`, {
        method: "POST",
        body: JSON.stringify(params),
      }),
  });
}

export function useConfirmForgotPassword(userPoolId: string) {
  return useMutation<{ result: any }, Error, { clientId: string; username: string; confirmationCode: string; password: string; secretHash?: string }>({
    mutationFn: (params) =>
      api(`/aws/cognito/user-pools/${encodeURIComponent(userPoolId)}/auth/confirm-forgot-password`, {
        method: "POST",
        body: JSON.stringify(params),
      }),
  });
}

export function useGetUser(userPoolId: string) {
  return useMutation<{ result: any }, Error, { accessToken: string }>({
    mutationFn: (params) =>
      api(`/aws/cognito/user-pools/${encodeURIComponent(userPoolId)}/auth/get-user`, {
        method: "POST",
        body: JSON.stringify(params),
      }),
  });
}

export function useUpdateUserAttributes(userPoolId: string) {
  return useMutation<{ result: any }, Error, { accessToken: string; userAttributes: { Name: string; Value: string }[] }>({
    mutationFn: (params) =>
      api(`/aws/cognito/user-pools/${encodeURIComponent(userPoolId)}/auth/update-user-attributes`, {
        method: "POST",
        body: JSON.stringify(params),
      }),
  });
}

export function useDeleteUserAttributes(userPoolId: string) {
  return useMutation<{ result: any }, Error, { accessToken: string; userAttributeNames: string[] }>({
    mutationFn: (params) =>
      api(`/aws/cognito/user-pools/${encodeURIComponent(userPoolId)}/auth/delete-user-attributes`, {
        method: "POST",
        body: JSON.stringify(params),
      }),
  });
}

export function useAddUserPoolClientSecret(userPoolId: string) {
  const qc = useQueryClient();
  return useMutation<{ secret: any }, Error, { clientId: string; clientSecret?: string }>({
    mutationFn: (params) =>
      api(`/aws/cognito/user-pools/${encodeURIComponent(userPoolId)}/clients/${encodeURIComponent(params.clientId)}/secrets`, {
        method: "POST",
        body: JSON.stringify({ clientSecret: params.clientSecret }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "cognito", "client-secrets", userPoolId] }),
  });
}

export function useDeleteUserPoolClientSecret(userPoolId: string) {
  const qc = useQueryClient();
  return useMutation<{ deleted: boolean }, Error, { clientId: string; secretId: string }>({
    mutationFn: (params) =>
      api(`/aws/cognito/user-pools/${encodeURIComponent(userPoolId)}/clients/${encodeURIComponent(params.clientId)}/secrets/${encodeURIComponent(params.secretId)}`, {
        method: "DELETE",
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "cognito", "client-secrets", userPoolId] }),
  });
}

// ── G.86 Admin User Ops ─────────────────────────────────

export function useCognitoUser(userPoolId: string | null, username: string | null) {
  return useQuery<{ user: any }>({
    queryKey: ["aws", "cognito", "users", userPoolId, username],
    queryFn: () =>
      api(`/aws/cognito/user-pools/${encodeURIComponent(userPoolId!)}/users/${encodeURIComponent(username!)}`),
    enabled: !!userPoolId && !!username,
  });
}

export function useAdminRemoveUserFromGroup(userPoolId: string) {
  const qc = useQueryClient();
  return useMutation<{ removed: boolean }, Error, { username: string; groupName: string }>({
    mutationFn: (params) =>
      api(`/aws/cognito/user-pools/${encodeURIComponent(userPoolId)}/users/${encodeURIComponent(params.username)}/groups/${encodeURIComponent(params.groupName)}`, {
        method: "DELETE",
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "cognito"] }),
  });
}

export function useAdminResetUserPassword(userPoolId: string) {
  const qc = useQueryClient();
  return useMutation<{ reset: boolean }, Error, { username: string }>({
    mutationFn: (params) =>
      api(`/aws/cognito/user-pools/${encodeURIComponent(userPoolId)}/users/${encodeURIComponent(params.username)}/reset-password`, {
        method: "POST",
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "cognito"] }),
  });
}

export function useAdminUpdateUserAttributes(userPoolId: string) {
  const qc = useQueryClient();
  return useMutation<{ result: any }, Error, { username: string; userAttributes: { Name: string; Value: string }[] }>({
    mutationFn: (params) =>
      api(`/aws/cognito/user-pools/${encodeURIComponent(userPoolId)}/users/${encodeURIComponent(params.username)}/attributes`, {
        method: "POST",
        body: JSON.stringify({ userAttributes: params.userAttributes }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "cognito"] }),
  });
}

export function useCognitoGroup(userPoolId: string | null, groupName: string | null) {
  return useQuery<{ group: any }>({
    queryKey: ["aws", "cognito", "groups", userPoolId, groupName],
    queryFn: () =>
      api(`/aws/cognito/user-pools/${encodeURIComponent(userPoolId!)}/groups/${encodeURIComponent(groupName!)}`),
    enabled: !!userPoolId && !!groupName,
  });
}

export function useUpdateCognitoGroup(userPoolId: string) {
  const qc = useQueryClient();
  return useMutation<{ group: any }, Error, { groupName: string; description?: string; roleArn?: string; precedence?: number }>({
    mutationFn: (params) =>
      api(`/aws/cognito/user-pools/${encodeURIComponent(userPoolId)}/groups/${encodeURIComponent(params.groupName)}`, {
        method: "PUT",
        body: JSON.stringify({
          description: params.description,
          roleArn: params.roleArn,
          precedence: params.precedence,
        }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "cognito"] }),
  });
}

export function useUpdateCognitoUserPool(userPoolId: string) {
  const qc = useQueryClient();
  return useMutation<{ result: any }, Error, {
    name?: string;
    mfaConfiguration?: string;
    autoVerifiedAttributes?: string[];
  }>({
    mutationFn: (params) =>
      api(`/aws/cognito/user-pools/${encodeURIComponent(userPoolId)}`, {
        method: "PUT",
        body: JSON.stringify(params),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "cognito"] }),
  });
}

export function useUpdateCognitoUserPoolClient(userPoolId: string) {
  const qc = useQueryClient();
  return useMutation<{ result: any }, Error, {
    clientId: string;
    name?: string;
    refreshTokenValidity?: number;
    callbackURLs?: string[];
  }>({
    mutationFn: (params) =>
      api(`/aws/cognito/user-pools/${encodeURIComponent(userPoolId)}/clients/${encodeURIComponent(params.clientId)}`, {
        method: "PUT",
        body: JSON.stringify(params),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "cognito"] }),
  });
}

export function useCognitoTags(userPoolId: string | null) {
  return useQuery<{ tags: Record<string, string> }>({
    queryKey: ["aws", "cognito", "tags", userPoolId],
    queryFn: () => api(`/aws/cognito/user-pools/${encodeURIComponent(userPoolId!)}/tags`),
    enabled: !!userPoolId,
  });
}

export function useTagCognitoUserPool(userPoolId: string) {
  const qc = useQueryClient();
  return useMutation<{ tagged: boolean }, Error, { tags: Record<string, string> }>({
    mutationFn: (params) =>
      api(`/aws/cognito/user-pools/${encodeURIComponent(userPoolId)}/tags`, {
        method: "POST",
        body: JSON.stringify({ tags: params.tags }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "cognito"] }),
  });
}

export function useUntagCognitoUserPool(userPoolId: string) {
  const qc = useQueryClient();
  return useMutation<{ untagged: boolean }, Error, { tagKeys: string[] }>({
    mutationFn: (params) =>
      api(`/aws/cognito/user-pools/${encodeURIComponent(userPoolId)}/tags`, {
        method: "DELETE",
        body: JSON.stringify({ tagKeys: params.tagKeys }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "cognito"] }),
  });
}

export function useChangePassword() {
  const qc = useQueryClient();
  return useMutation<{ result: any }, Error, { accessToken: string; previousPassword: string; proposedPassword: string }>({
    mutationFn: (params) =>
      api("/aws/cognito/auth/change-password", {
        method: "POST",
        body: JSON.stringify(params),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "cognito"] }),
  });
}

export function useSignUp() {
  const qc = useQueryClient();
  return useMutation<{ result: any }, Error, {
    clientId: string;
    username: string;
    password: string;
    userAttributes?: { Name: string; Value: string }[];
    secretHash?: string;
  }>({
    mutationFn: (params) =>
      api("/aws/cognito/auth/sign-up", {
        method: "POST",
        body: JSON.stringify(params),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "cognito"] }),
  });
}

export function useRespondToAuthChallenge() {
  const qc = useQueryClient();
  return useMutation<{ result: any }, Error, {
    clientId: string;
    challengeName: string;
    challengeResponses?: Record<string, string>;
    session?: string;
  }>({
    mutationFn: (params) =>
      api("/aws/cognito/auth/respond-challenge", {
        method: "POST",
        body: JSON.stringify(params),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "cognito"] }),
  });
}

export function useAdminAddUserToGroup(userPoolId: string) {
  const qc = useQueryClient();
  return useMutation<{ added: boolean }, Error, { username: string; groupName: string }>({
    mutationFn: (params) =>
      api(`/aws/cognito/user-pools/${encodeURIComponent(userPoolId)}/users/${encodeURIComponent(params.username)}/groups/${encodeURIComponent(params.groupName)}`, {
        method: "POST",
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "cognito"] }),
  });
}
