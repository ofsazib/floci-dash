import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

// ─── GraphQL APIs ────────────────────────────────────────

export function useAppSyncApis() {
  return useQuery({
    queryKey: ["aws", "appsync", "apis"],
    queryFn: () => api<{ apis: any[]; total: number }>("/aws/appsync/apis"),
    refetchInterval: 15000,
  });
}

export function useAppSyncApi(apiId: string | null) {
  return useQuery({
    queryKey: ["aws", "appsync", "apis", apiId],
    queryFn: () => api<{ api: any }>(`/aws/appsync/apis/${apiId}`),
    enabled: !!apiId,
  });
}

export function useCreateAppSyncApi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/appsync/apis", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "appsync", "apis"] }),
  });
}

export function useDeleteAppSyncApi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (apiId: string) =>
      api(`/aws/appsync/apis/${apiId}`, { method: "DELETE" }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "appsync", "apis"] }),
  });
}

// ─── Schema ──────────────────────────────────────────────

export function useAppSyncSchema(apiId: string | null) {
  return useQuery({
    queryKey: ["aws", "appsync", "apis", apiId, "schema"],
    queryFn: () => api<{ schema: string }>(`/aws/appsync/apis/${apiId}/schema`),
    enabled: !!apiId,
  });
}

export function useAppSyncSchemaStatus(apiId: string | null) {
  return useQuery({
    queryKey: ["aws", "appsync", "apis", apiId, "schema", "status"],
    queryFn: () =>
      api<{ status: string; details: string }>(
        `/aws/appsync/apis/${apiId}/schema/status`
      ),
    enabled: !!apiId,
  });
}

export function useStartSchemaCreation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ apiId, definition }: { apiId: string; definition: string }) =>
      api(`/aws/appsync/apis/${apiId}/schema`, {
        method: "POST",
        body: JSON.stringify({ definition }),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "appsync", "apis"] }),
  });
}

// ─── Data Sources ────────────────────────────────────────

export function useAppSyncDataSources(apiId: string | null) {
  return useQuery({
    queryKey: ["aws", "appsync", "apis", apiId, "data-sources"],
    queryFn: () =>
      api<{ dataSources: any[]; total: number }>(
        `/aws/appsync/apis/${apiId}/data-sources`
      ),
    enabled: !!apiId,
  });
}

export function useCreateAppSyncDataSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ apiId, ...body }: any) =>
      api(`/aws/appsync/apis/${apiId}/data-sources`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "appsync", "apis"] }),
  });
}

export function useDeleteAppSyncDataSource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ apiId, name }: { apiId: string; name: string }) =>
      api(`/aws/appsync/apis/${apiId}/data-sources/${encodeURIComponent(name)}`, {
        method: "DELETE",
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "appsync", "apis"] }),
  });
}

// ─── Resolvers ───────────────────────────────────────────

export function useAppSyncResolvers(apiId: string | null) {
  return useQuery({
    queryKey: ["aws", "appsync", "apis", apiId, "resolvers"],
    queryFn: () =>
      api<{ resolvers: any[]; total: number }>(
        `/aws/appsync/apis/${apiId}/resolvers`
      ),
    enabled: !!apiId,
  });
}

// ─── Functions ───────────────────────────────────────────

export function useAppSyncFunctions(apiId: string | null) {
  return useQuery({
    queryKey: ["aws", "appsync", "apis", apiId, "functions"],
    queryFn: () =>
      api<{ functions: any[]; total: number }>(
        `/aws/appsync/apis/${apiId}/functions`
      ),
    enabled: !!apiId,
  });
}

export function useCreateAppSyncFunction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ apiId, ...body }: any) =>
      api(`/aws/appsync/apis/${apiId}/functions`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "appsync", "apis"] }),
  });
}

export function useDeleteAppSyncFunction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ apiId, functionId }: { apiId: string; functionId: string }) =>
      api(`/aws/appsync/apis/${apiId}/functions/${functionId}`, {
        method: "DELETE",
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "appsync", "apis"] }),
  });
}

// ─── API Keys ────────────────────────────────────────────

export function useAppSyncApiKeys(apiId: string | null) {
  return useQuery({
    queryKey: ["aws", "appsync", "apis", apiId, "api-keys"],
    queryFn: () =>
      api<{ apiKeys: any[]; total: number }>(
        `/aws/appsync/apis/${apiId}/api-keys`
      ),
    enabled: !!apiId,
  });
}

export function useCreateAppSyncApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ apiId, ...body }: any) =>
      api(`/aws/appsync/apis/${apiId}/api-keys`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "appsync", "apis"] }),
  });
}

export function useDeleteAppSyncApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ apiId, id }: { apiId: string; id: string }) =>
      api(`/aws/appsync/apis/${apiId}/api-keys/${id}`, { method: "DELETE" }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "appsync", "apis"] }),
  });
}

// ─── Types ───────────────────────────────────────────────

export function useAppSyncTypes(apiId: string | null) {
  return useQuery({
    queryKey: ["aws", "appsync", "apis", apiId, "types"],
    queryFn: () =>
      api<{ types: any[]; total: number }>(`/aws/appsync/apis/${apiId}/types`),
    enabled: !!apiId,
  });
}

export function useCreateAppSyncResolver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      apiId: string;
      typeName: string;
      fieldName: string;
      dataSourceName: string;
      requestMappingTemplate?: string;
      responseMappingTemplate?: string;
    }) =>
      api(`/aws/appsync/apis/${encodeURIComponent(params.apiId)}/types/${encodeURIComponent(params.typeName)}/resolvers`, {
        method: "POST",
        body: JSON.stringify(params),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "appsync"] }),
  });
}

export function useDeleteAppSyncResolver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { apiId: string; typeName: string; fieldName: string }) =>
      api(
        `/aws/appsync/apis/${encodeURIComponent(params.apiId)}/types/${encodeURIComponent(params.typeName)}/resolvers/${encodeURIComponent(params.fieldName)}`,
        { method: "DELETE" }
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "appsync"] }),
  });
}

// ─── P1 gap audit — AppSync extras ───────────────────────
export function useUpdateAppSyncApi(apiId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name?: string; authenticationType?: string }) =>
      api(`/aws/appsync/apis/${apiId}`, { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "appsync", "apis"] }),
  });
}

export function useGetAppSyncDataSource(apiId: string, name: string | null) {
  return useQuery<{ dataSource: unknown }>({
    queryKey: ["aws", "appsync", "data-source", apiId, name],
    queryFn: () => api(`/aws/appsync/apis/${apiId}/data-sources/${name}`),
    enabled: !!name,
  });
}

export function useAppSyncResolversByType(apiId: string, typeName: string | null) {
  return useQuery<{ resolvers: any[]; nextToken: string | null; total: number }>({
    queryKey: ["aws", "appsync", "resolvers-by-type", apiId, typeName],
    queryFn: () => api(`/aws/appsync/apis/${apiId}/resolvers-by-type/${typeName}/resolvers`),
    enabled: !!typeName,
  });
}

export function useAppSyncFunction(apiId: string, functionId: string | null) {
  return useQuery<{ functionConfiguration: unknown }>({
    queryKey: ["aws", "appsync", "function", apiId, functionId],
    queryFn: () => api(`/aws/appsync/apis/${apiId}/functions/${functionId}`),
    enabled: !!functionId,
  });
}

export function useUpdateAppSyncApiKey(apiId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ keyId, ...rest }: { keyId: string; description?: string; expires?: number }) =>
      api(`/aws/appsync/apis/${apiId}/api-keys/${keyId}`, { method: "PUT", body: JSON.stringify(rest) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "appsync", "api-keys", apiId] }),
  });
}

export function usePutAppSyncEnvVars(apiId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (environmentVariables: Record<string, string>) =>
      api(`/aws/appsync/apis/${apiId}/env-vars`, { method: "PUT", body: JSON.stringify({ environmentVariables }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "appsync", "env-vars", apiId] }),
  });
}

export function useGetAppSyncEnvVars(apiId: string) {
  return useQuery<{ environmentVariables: Record<string, string> }>({
    queryKey: ["aws", "appsync", "env-vars", apiId],
    queryFn: () => api(`/aws/appsync/apis/${apiId}/env-vars`),
  });
}

export function useAppSyncDomainNames() {
  return useQuery<{ domainNameConfigs: any[]; total: number }>({
    queryKey: ["aws", "appsync", "domain-names"],
    queryFn: () => api("/aws/appsync/domain-names"),
  });
}

export function useCreateAppSyncDomainName() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { domainName: string; certificateArn: string }) =>
      api("/aws/appsync/domain-names", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "appsync", "domain-names"] }),
  });
}

export function useDeleteAppSyncDomainName() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (domainName: string) =>
      api(`/aws/appsync/domain-names/${domainName}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "appsync", "domain-names"] }),
  });
}

export function useAppSyncApiAssociation(domainName: string | null) {
  return useQuery<{ apiAssociation: unknown }>({
    queryKey: ["aws", "appsync", "api-association", domainName],
    queryFn: () => api(`/aws/appsync/api-associations/${domainName}`),
    enabled: !!domainName,
  });
}

export function useAppSyncChannelNamespaces(apiId: string) {
  return useQuery<{ channelNamespaces: any[]; total: number }>({
    queryKey: ["aws", "appsync", "channel-namespaces", apiId],
    queryFn: () => api(`/aws/appsync/apis/${apiId}/channel-namespaces`),
  });
}

export function useCreateAppSyncChannelNamespace(apiId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string }) =>
      api(`/aws/appsync/apis/${apiId}/channel-namespaces`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "appsync", "channel-namespaces", apiId] }),
  });
}

export function useDeleteAppSyncChannelNamespace(apiId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/appsync/apis/${apiId}/channel-namespaces/${name}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "appsync", "channel-namespaces", apiId] }),
  });
}

export function useTagAppSyncResource() {
  return useMutation({
    mutationFn: (body: { arn: string; tags: Record<string, string> }) =>
      api("/aws/appsync/resources/tags", { method: "POST", body: JSON.stringify(body) }),
  });
}

export function useUntagAppSyncResource() {
  return useMutation({
    mutationFn: ({ arn, tagKeys }: { arn: string; tagKeys: string[] }) =>
      api(`/aws/appsync/resources/tags?arn=${encodeURIComponent(arn)}&tagKeys=${encodeURIComponent(tagKeys.join(","))}`, {
        method: "DELETE",
      }),
  });
}
