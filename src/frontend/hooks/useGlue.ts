import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface GlueDatabase {
  Name: string;
  Description?: string;
  LocationUri?: string;
  CreateTime?: number;
  Parameters?: Record<string, string>;
}

export interface GlueTable {
  Name: string;
  DatabaseName?: string;
  Description?: string;
  TableType?: string;
  CreateTime?: number;
  UpdateTime?: number;
  StorageDescriptor?: { Location?: string; Columns?: { Name: string; Type: string }[] };
  PartitionKeys?: { Name: string; Type: string }[];
}

// ── Databases ────────────────────────────────────────────

export function useGlueDatabases() {
  return useQuery<{ databases: GlueDatabase[]; total: number }>({
    queryKey: ["aws", "glue", "databases"],
    queryFn: () => api("/aws/glue/databases"),
    refetchInterval: 10000,
  });
}

export function useCreateGlueDatabase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { name: string; description?: string; locationUri?: string }) =>
      api("/aws/glue/databases", { method: "POST", body: JSON.stringify(params) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "glue", "databases"] }),
  });
}

export function useDeleteGlueDatabase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/glue/databases/${encodeURIComponent(name)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "glue", "databases"] }),
  });
}

// ── Tables ───────────────────────────────────────────────

export function useGlueTables(databaseName: string | null) {
  return useQuery<{ tables: GlueTable[]; total: number }>({
    queryKey: ["aws", "glue", "tables", databaseName],
    queryFn: () => api(`/aws/glue/databases/${encodeURIComponent(databaseName!)}/tables`),
    enabled: !!databaseName,
    refetchInterval: 10000,
  });
}

export function useDeleteGlueTable(databaseName: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tableName: string) =>
      api(
        `/aws/glue/databases/${encodeURIComponent(databaseName)}/tables/${encodeURIComponent(tableName)}`,
        { method: "DELETE" }
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "glue", "tables", databaseName] }),
  });
}

// ─── Schema Registry ────────────────────────────────────

export function useGlueRegistries() {
  return useQuery<{ registries: any[]; total: number }>({
    queryKey: ["aws", "glue", "registries"],
    queryFn: () => api("/aws/glue/registries"),
  });
}

export function useCreateGlueRegistry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { name: string; description?: string }) =>
      api("/aws/glue/registries", { method: "POST", body: JSON.stringify(params) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "glue", "registries"] }),
  });
}

export function useDeleteGlueRegistry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/glue/registries/${encodeURIComponent(name)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "glue", "registries"] }),
  });
}

export function useGlueSchemas(registryName: string | null) {
  return useQuery<{ schemas: any[]; total: number }>({
    queryKey: ["aws", "glue", "registries", registryName, "schemas"],
    queryFn: () => api(`/aws/glue/registries/${encodeURIComponent(registryName!)}/schemas`),
    enabled: !!registryName,
  });
}

export function useCreateGlueSchema(registryName: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { name: string; dataFormat?: string; compatibility?: string; description?: string; definition?: string }) =>
      api(`/aws/glue/registries/${encodeURIComponent(registryName)}/schemas`, {
        method: "POST",
        body: JSON.stringify(params),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "glue", "registries", registryName, "schemas"] }),
  });
}

export function useDeleteGlueSchema(registryName: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (schemaName: string) =>
      api(
        `/aws/glue/registries/${encodeURIComponent(registryName)}/schemas/${encodeURIComponent(schemaName)}`,
        { method: "DELETE" }
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "glue", "registries", registryName, "schemas"] }),
  });
}

export function useGlueSchemaVersions(registryName: string | null, schemaName: string | null) {
  return useQuery<{ versions: any[]; total: number }>({
    queryKey: ["aws", "glue", "registries", registryName, "schemas", schemaName, "versions"],
    queryFn: () =>
      api(
        `/aws/glue/registries/${encodeURIComponent(registryName!)}/schemas/${encodeURIComponent(schemaName!)}/versions`
      ),
    enabled: !!registryName && !!schemaName,
  });
}

export function useRegisterGlueSchemaVersion(registryName: string, schemaName: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { definition: string }) =>
      api(
        `/aws/glue/registries/${encodeURIComponent(registryName)}/schemas/${encodeURIComponent(schemaName)}/versions`,
        { method: "POST", body: JSON.stringify(params) }
      ),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ["aws", "glue", "registries", registryName, "schemas", schemaName, "versions"],
      }),
  });
}
