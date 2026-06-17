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
