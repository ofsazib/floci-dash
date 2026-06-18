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
