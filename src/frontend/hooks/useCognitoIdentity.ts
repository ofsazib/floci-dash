import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface IdentityPoolSummary {
  IdentityPoolId?: string;
  IdentityPoolName?: string;
}

export interface IdentityPool extends IdentityPoolSummary {
  AllowUnauthenticatedIdentities?: boolean;
  AllowClassicFlow?: boolean;
  SupportedLoginProviders?: Record<string, string>;
  DeveloperProviderName?: string;
  OpenIdConnectProviderARNs?: string[];
  SamlProviderARNs?: string[];
  IdentityPoolTags?: Record<string, string>;
  CognitoIdentityProviders?: {
    ProviderName?: string;
    ClientId?: string;
    ServerSideTokenCheck?: boolean;
  }[];
}

const enc = (id: string) => encodeURIComponent(id);

export function useIdentityPools() {
  return useQuery({
    queryKey: ["aws", "cognitoidentity"],
    queryFn: () => api<{ pools: IdentityPoolSummary[]; total: number }>("/aws/cognitoidentity/pools"),
  });
}

export function useCreateIdentityPool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; allowUnauthenticated: boolean; allowClassic?: boolean }) =>
      api<{ pool: IdentityPool }>("/aws/cognitoidentity/pools", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "cognitoidentity"] }),
  });
}

export function useIdentityPool(poolId: string | null) {
  return useQuery({
    queryKey: ["aws", "cognitoidentity", poolId],
    queryFn: () => api<{ pool: IdentityPool | null }>(`/aws/cognitoidentity/pools/${enc(poolId!)}`),
    enabled: !!poolId,
  });
}

export function useUpdateIdentityPool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ poolId, pool }: { poolId: string; pool: Partial<IdentityPool> }) =>
      api<{ pool: IdentityPool }>(`/aws/cognitoidentity/pools/${enc(poolId)}`, {
        method: "PUT",
        body: JSON.stringify({ pool }),
      }),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["aws", "cognitoidentity", v.poolId] }),
  });
}

export function useDeleteIdentityPool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (poolId: string) =>
      api(`/aws/cognitoidentity/pools/${enc(poolId)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "cognitoidentity"] }),
  });
}

export function useIdentityPoolRoles(poolId: string | null) {
  return useQuery({
    queryKey: ["aws", "cognitoidentity", poolId, "roles"],
    queryFn: () =>
      api<{ roles: Record<string, string> | null; roleMappings: Record<string, unknown> | null }>(
        `/aws/cognitoidentity/pools/${enc(poolId!)}/roles`
      ),
    enabled: !!poolId,
  });
}

export function useSetIdentityPoolRoles() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      poolId,
      roles,
    }: {
      poolId: string;
      roles: Record<string, string>;
    }) =>
      api(`/aws/cognitoidentity/pools/${enc(poolId)}/roles`, {
        method: "PUT",
        body: JSON.stringify({ roles }),
      }),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ["aws", "cognitoidentity", v.poolId, "roles"] }),
  });
}

export function useIdentityPoolTags(poolId: string | null) {
  return useQuery({
    queryKey: ["aws", "cognitoidentity", poolId, "tags"],
    queryFn: () =>
      api<{ tags: Record<string, string> }>(`/aws/cognitoidentity/pools/${enc(poolId!)}/tags`),
    enabled: !!poolId,
  });
}

export function useAddIdentityPoolTags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ poolId, tags }: { poolId: string; tags: Record<string, string> }) =>
      api(`/aws/cognitoidentity/pools/${enc(poolId)}/tags`, {
        method: "POST",
        body: JSON.stringify({ tags }),
      }),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ["aws", "cognitoidentity", v.poolId, "tags"] }),
  });
}

export function useRemoveIdentityPoolTags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ poolId, tagKeys }: { poolId: string; tagKeys: string[] }) =>
      api(`/aws/cognitoidentity/pools/${enc(poolId)}/tags/untag`, {
        method: "POST",
        body: JSON.stringify({ tagKeys }),
      }),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ["aws", "cognitoidentity", v.poolId, "tags"] }),
  });
}

export function usePrincipalTagAttributeMap(poolId: string | null, provider: string | null) {
  return useQuery({
    queryKey: ["aws", "cognitoidentity", poolId, "provider-tags", provider],
    queryFn: () =>
      api<{ useDefaults: boolean; principalTags: Record<string, string> }>(
        `/aws/cognitoidentity/pools/${enc(poolId!)}/provider-tags?provider=${enc(provider!)}`
      ),
    enabled: !!poolId && !!provider,
  });
}

export function useSetPrincipalTagAttributeMap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      poolId,
      identityProviderName,
      useDefaults,
      principalTags,
    }: {
      poolId: string;
      identityProviderName: string;
      useDefaults: boolean;
      principalTags: Record<string, string>;
    }) =>
      api(`/aws/cognitoidentity/pools/${enc(poolId)}/provider-tags`, {
        method: "PUT",
        body: JSON.stringify({ identityProviderName, useDefaults, principalTags }),
      }),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({
        queryKey: ["aws", "cognitoidentity", v.poolId, "provider-tags"],
      }),
  });
}
