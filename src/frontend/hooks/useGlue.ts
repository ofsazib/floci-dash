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

export function useUpdateGlueRegistry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { name: string; description: string }) =>
      api(`/aws/glue/registries/${encodeURIComponent(params.name)}`, {
        method: "PUT",
        body: JSON.stringify({ description: params.description }),
      }),
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

export function useGlueSchemaVersion(
  registryName: string | null,
  schemaName: string | null,
  versionNumber: number | null
) {
  return useQuery<{ version: any }>({
    queryKey: ["aws", "glue", "registries", registryName, "schemas", schemaName, "versions", versionNumber],
    queryFn: () =>
      api(
        `/aws/glue/registries/${encodeURIComponent(registryName!)}/schemas/${encodeURIComponent(schemaName!)}/versions/${versionNumber}`
      ),
    enabled: !!registryName && !!schemaName && versionNumber != null,
  });
}

export function useGlueSchemaVersionsDiff(
  registryName: string | null,
  schemaName: string | null,
  first: number | null,
  second: number | null
) {
  return useQuery<{ diff: any }>({
    queryKey: ["aws", "glue", "registries", registryName, "schemas", schemaName, "versions-diff", first, second],
    queryFn: () =>
      api(
        `/aws/glue/registries/${encodeURIComponent(registryName!)}/schemas/${encodeURIComponent(schemaName!)}/versions-diff?first=${first}&second=${second}`
      ),
    enabled: !!registryName && !!schemaName && first != null && second != null,
  });
}

export function useCheckSchemaVersionValidity() {
  return useMutation({
    mutationFn: (params: { dataFormat?: string; definition: string }) =>
      api("/aws/glue/schema-version-validity", { method: "POST", body: JSON.stringify(params) }),
  });
}

export function useSchemaVersionMetadata(versionId: string | null) {
  return useQuery<{ metadataInfoMap: Record<string, any>; schemaVersionId?: string }>({
    queryKey: ["aws", "glue", "schema-versions", versionId, "metadata"],
    queryFn: () => api(`/aws/glue/schema-versions/${encodeURIComponent(versionId!)}/metadata`),
    enabled: !!versionId,
  });
}

export function usePutSchemaVersionMetadata(versionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { key: string; value: string }) =>
      api(`/aws/glue/schema-versions/${encodeURIComponent(versionId)}/metadata`, {
        method: "POST",
        body: JSON.stringify(params),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "glue", "schema-versions", versionId, "metadata"] }),
  });
}

export function useRemoveSchemaVersionMetadata(versionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { key: string; value: string }) =>
      api(`/aws/glue/schema-versions/${encodeURIComponent(versionId)}/metadata/delete`, {
        method: "POST",
        body: JSON.stringify(params),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "glue", "schema-versions", versionId, "metadata"] }),
  });
}

// ─── User-Defined Functions ─────────────────────────────

export function useGlueUDFs(databaseName: string | null) {
  return useQuery<{ functions: any[]; total: number }>({
    queryKey: ["aws", "glue", "databases", databaseName, "functions"],
    queryFn: () => api(`/aws/glue/databases/${encodeURIComponent(databaseName!)}/functions`),
    enabled: !!databaseName,
  });
}

export function useCreateGlueUDF(databaseName: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { name: string; className: string; ownerName?: string; ownerType?: string }) =>
      api(`/aws/glue/databases/${encodeURIComponent(databaseName)}/functions`, {
        method: "POST",
        body: JSON.stringify(params),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "glue", "databases", databaseName, "functions"] }),
  });
}

export function useDeleteGlueUDF(databaseName: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (funcName: string) =>
      api(`/aws/glue/databases/${encodeURIComponent(databaseName)}/functions/${encodeURIComponent(funcName)}`, {
        method: "DELETE",
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "glue", "databases", databaseName, "functions"] }),
  });
}

export function useUpdateGlueUDF(databaseName: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { funcName: string; className?: string; ownerName?: string; ownerType?: string }) =>
      api(`/aws/glue/databases/${encodeURIComponent(databaseName)}/functions/${encodeURIComponent(params.funcName)}`, {
        method: "PUT",
        body: JSON.stringify({ className: params.className, ownerName: params.ownerName, ownerType: params.ownerType }),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "glue", "databases", databaseName, "functions"] }),
  });
}

// ─── Column Statistics ──────────────────────────────────

export function useGlueColumnStats(databaseName: string | null, tableName: string | null) {
  return useQuery<{ columnStats: any[]; total: number }>({
    queryKey: ["aws", "glue", "databases", databaseName, "tables", tableName, "columnStats"],
    queryFn: () => api(`/aws/glue/databases/${encodeURIComponent(databaseName!)}/tables/${encodeURIComponent(tableName!)}/column-stats`),
    enabled: !!databaseName && !!tableName,
  });
}

export function useUpdateGlueColumnStats(databaseName: string, tableName: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { columnStatisticsList: any[] }) =>
      api(`/aws/glue/databases/${encodeURIComponent(databaseName)}/tables/${encodeURIComponent(tableName)}/column-stats`, {
        method: "POST",
        body: JSON.stringify(params),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "glue", "databases", databaseName, "tables", tableName, "columnStats"] }),
  });
}

export function useGluePartitionColumnStats(
  databaseName: string | null,
  tableName: string | null,
  partitionValues: string[]
) {
  const queryString = partitionValues.map((v) => `values=${encodeURIComponent(v)}`).join("&");
  return useQuery<{ columnStats: any[]; total: number }>({
    queryKey: ["aws", "glue", "databases", databaseName, "tables", tableName, "partitions", "columnStats", partitionValues],
    queryFn: () =>
      api(
        `/aws/glue/databases/${encodeURIComponent(databaseName!)}/tables/${encodeURIComponent(tableName!)}/partitions/column-stats?${queryString}`
      ),
    enabled: !!databaseName && !!tableName && partitionValues.length > 0,
  });
}

export function useDeleteGlueColumnStats(databaseName: string, tableName: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (columnName: string) =>
      api(
        `/aws/glue/databases/${encodeURIComponent(databaseName)}/tables/${encodeURIComponent(tableName)}/column-stats?column=${encodeURIComponent(columnName)}`,
        { method: "DELETE" }
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "glue", "databases", databaseName, "tables", tableName, "columnStats"] }),
  });
}

// ─── Partitions ─────────────────────────────────────────

export function useGluePartitions(databaseName: string | null, tableName: string | null) {
  return useQuery<{ partitions: any[]; total: number }>({
    queryKey: ["aws", "glue", "databases", databaseName, "tables", tableName, "partitions"],
    queryFn: () =>
      api(`/aws/glue/databases/${encodeURIComponent(databaseName!)}/tables/${encodeURIComponent(tableName!)}/partitions`),
    enabled: !!databaseName && !!tableName,
  });
}

export function useCreateGluePartitions(databaseName: string, tableName: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { partitionInputList: any[] }) =>
      api(`/aws/glue/databases/${encodeURIComponent(databaseName)}/tables/${encodeURIComponent(tableName)}/partitions`, {
        method: "POST",
        body: JSON.stringify(params),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "glue", "databases", databaseName, "tables", tableName, "partitions"] }),
  });
}

export function useUpdateGluePartition(databaseName: string, tableName: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { partitionValueList: string[]; partitionInput: any }) =>
      api(`/aws/glue/databases/${encodeURIComponent(databaseName)}/tables/${encodeURIComponent(tableName)}/partitions`, {
        method: "PUT",
        body: JSON.stringify(params),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "glue", "databases", databaseName, "tables", tableName, "partitions"] }),
  });
}

export function useBatchUpdateGluePartitions(databaseName: string, tableName: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { entries: { PartitionValueList: string[]; PartitionInput: any }[] }) =>
      api(`/aws/glue/databases/${encodeURIComponent(databaseName)}/tables/${encodeURIComponent(tableName)}/partitions/batch-update`, {
        method: "POST",
        body: JSON.stringify(params),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "glue", "databases", databaseName, "tables", tableName, "partitions"] }),
  });
}

export function useDeleteGluePartition(databaseName: string, tableName: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (partitionValues: string[]) => {
      const queryString = partitionValues.map((v) => `values=${encodeURIComponent(v)}`).join("&");
      return api(
        `/aws/glue/databases/${encodeURIComponent(databaseName)}/tables/${encodeURIComponent(tableName)}/partitions?${queryString}`,
        { method: "DELETE" }
      );
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "glue", "databases", databaseName, "tables", tableName, "partitions"] }),
  });
}

export function useUpdateGlueTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { databaseName: string; tableName: string; tableInput: any }) =>
      api(
        `/aws/glue/databases/${encodeURIComponent(params.databaseName)}/tables/${encodeURIComponent(params.tableName)}`,
        { method: "PUT", body: JSON.stringify({ tableInput: params.tableInput }) }
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "glue"] }),
  });
}

export function useUpdateGlueDatabase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { databaseName: string; databaseInput: any }) =>
      api(`/aws/glue/databases/${encodeURIComponent(params.databaseName)}`, {
        method: "PUT",
        body: JSON.stringify({ databaseInput: params.databaseInput }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "glue"] }),
  });
}

export function useGlueTableVersions(databaseName: string | null, tableName: string | null) {
  return useQuery<any>({
    queryKey: ["aws", "glue", "databases", databaseName, "tables", tableName, "versions"],
    queryFn: () =>
      api(`/aws/glue/databases/${encodeURIComponent(databaseName!)}/tables/${encodeURIComponent(tableName!)}/versions`),
    enabled: !!databaseName && !!tableName,
  });
}

export function useBatchDeleteGlueTables() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { databaseName: string; tableNames: string[] }) =>
      api(`/aws/glue/databases/${encodeURIComponent(params.databaseName)}/tables/batch-delete`, {
        method: "POST",
        body: JSON.stringify({ tableNames: params.tableNames }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "glue"] }),
  });
}

// ─── Tags ──────────────────────────────────────────────

export function useGlueTags(resourceArn: string | null) {
  return useQuery<{ tags: Record<string, string> }>({
    queryKey: ["aws", "glue", "tags", resourceArn],
    queryFn: () => api(`/aws/glue/tags?resourceArn=${encodeURIComponent(resourceArn!)}`),
    enabled: !!resourceArn,
  });
}

export function useTagGlueResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { resourceArn: string; tags: Record<string, string> }) =>
      api("/aws/glue/tags", { method: "POST", body: JSON.stringify(params) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "glue"] }),
  });
}

export function useUntagGlueResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { resourceArn: string; tagKeys: string[] }) => {
      const qs = params.tagKeys.map((k) => `tagKey=${encodeURIComponent(k)}`).join("&");
      return api(`/aws/glue/tags/${encodeURIComponent(params.resourceArn)}?${qs}`, { method: "DELETE" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "glue"] }),
  });
}

// ─── Schema extras ─────────────────────────────────────

export function useUpdateGlueSchema(registryName: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { schemaName: string; compatibility?: string; description?: string }) =>
      api(`/aws/glue/registries/${encodeURIComponent(registryName)}/schemas/${encodeURIComponent(params.schemaName)}`, {
        method: "PUT",
        body: JSON.stringify({ compatibility: params.compatibility, description: params.description }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "glue", "registries", registryName, "schemas"] }),
  });
}

export function useDeleteGlueSchemaVersions(registryName: string, schemaName: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (versions: string) =>
      api(`/aws/glue/registries/${encodeURIComponent(registryName)}/schemas/${encodeURIComponent(schemaName)}/versions`, {
        method: "DELETE",
        body: JSON.stringify({ versions }),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "glue", "registries", registryName, "schemas", schemaName, "versions"] }),
  });
}

export function useGetGlueSchemaByDefinition() {
  return useMutation({
    mutationFn: (params: { registryName?: string; schemaName?: string; definition: string }) =>
      api("/aws/glue/schemas/by-definition", { method: "POST", body: JSON.stringify(params) }),
  });
}
