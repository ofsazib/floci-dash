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

// ─── ETL families (generic CRUD) ─────────────────────────

export function useGlueFamily(family: string) {
  return useQuery<{ items: any[]; total: number }>({
    queryKey: ["aws", "glue", family],
    queryFn: async () => {
      const res: any = await api(`/aws/glue/${family}`);
      return { items: res[family] || [], total: res.total };
    },
  });
}

export function useCreateGlueFamily(family: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api(`/aws/glue/${family}`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "glue", family] }),
  });
}

export function useDeleteGlueFamily(family: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/glue/${family}/${encodeURIComponent(name)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "glue", family] }),
  });
}

export function useUpdateGlueFamily(family: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { name: string; [k: string]: any }) =>
      api(`/aws/glue/${family}/${encodeURIComponent(params.name)}`, {
        method: "PUT",
        body: JSON.stringify(params),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "glue", family] }),
  });
}

// ─── Crawler lifecycle ──────────────────────────────────

export function useStartGlueCrawler() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/glue/crawlers/${encodeURIComponent(name)}/start`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "glue", "crawlers"] }),
  });
}

export function useStopGlueCrawler() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/glue/crawlers/${encodeURIComponent(name)}/stop`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "glue", "crawlers"] }),
  });
}

export function useGlueCrawlerMetrics() {
  return useQuery<{ metrics: any[]; total: number }>({
    queryKey: ["aws", "glue", "crawler-metrics"],
    queryFn: () => api("/aws/glue/crawler-metrics"),
  });
}

export function useStartGlueCrawlerSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (crawlerName: string) =>
      api("/aws/glue/crawler-schedule/start", { method: "POST", body: JSON.stringify({ crawlerName }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "glue"] }),
  });
}

export function useStopGlueCrawlerSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (crawlerName: string) =>
      api("/aws/glue/crawler-schedule/stop", { method: "POST", body: JSON.stringify({ crawlerName }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "glue"] }),
  });
}

export function useUpdateGlueCrawlerSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { crawlerName: string; schedule?: string }) =>
      api("/aws/glue/crawler-schedule", { method: "PUT", body: JSON.stringify(params) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "glue"] }),
  });
}

// ─── Job runs ───────────────────────────────────────────

export function useStartGlueJobRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (jobName: string) =>
      api(`/aws/glue/jobs/${encodeURIComponent(jobName)}/runs`, { method: "POST", body: JSON.stringify({}) }),
    onSuccess: (_d, jobName: string) => qc.invalidateQueries({ queryKey: ["aws", "glue", "job-runs", jobName] }),
  });
}

export function useGlueJobRuns(jobName: string | null) {
  return useQuery<{ runs: any[]; total: number }>({
    queryKey: ["aws", "glue", "job-runs", jobName],
    queryFn: () => api(`/aws/glue/jobs/${encodeURIComponent(jobName!)}/runs`),
    enabled: !!jobName,
  });
}

export function useGlueJobRun(jobName: string | null, runId: string | null) {
  return useQuery<{ run: any | null }>({
    queryKey: ["aws", "glue", "job-run", jobName, runId],
    queryFn: () => api(`/aws/glue/jobs/${encodeURIComponent(jobName!)}/runs/${encodeURIComponent(runId!)}`),
    enabled: !!jobName && !!runId,
  });
}

export function useGlueBatchGetJobs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (jobNames: string[]) =>
      api("/aws/glue/jobs/batch-get", { method: "POST", body: JSON.stringify({ jobNames }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "glue", "jobs"] }),
  });
}

export function useGlueBatchStopJobRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { jobName: string; jobRunIds?: string[] }) =>
      api("/aws/glue/jobs/batch-stop", { method: "POST", body: JSON.stringify(params) }),
    onSuccess: (_d, v: { jobName: string; jobRunIds?: string[] }) =>
      qc.invalidateQueries({ queryKey: ["aws", "glue", "job-runs", v.jobName] }),
  });
}

// ─── Trigger lifecycle ──────────────────────────────────

export function useStartGlueTrigger() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/glue/triggers/${encodeURIComponent(name)}/start`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "glue", "triggers"] }),
  });
}

export function useStopGlueTrigger() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/glue/triggers/${encodeURIComponent(name)}/stop`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "glue", "triggers"] }),
  });
}

// ─── Workflow runs ──────────────────────────────────────

export function useStartGlueWorkflowRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/glue/workflows/${encodeURIComponent(name)}/runs`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "glue", "workflow-runs", name] }),
  });
}

export function useGlueWorkflowRuns(name: string | null) {
  return useQuery<{ runs: any[]; total: number }>({
    queryKey: ["aws", "glue", "workflow-runs", name],
    queryFn: () => api(`/aws/glue/workflows/${encodeURIComponent(name!)}/runs`),
    enabled: !!name,
  });
}

export function useGlueWorkflowRun(name: string | null, runId: string | null) {
  return useQuery<{ run: any | null }>({
    queryKey: ["aws", "glue", "workflow-run", name, runId],
    queryFn: () => api(`/aws/glue/workflows/${encodeURIComponent(name!)}/runs/${encodeURIComponent(runId!)}`),
    enabled: !!name && !!runId,
  });
}

export function useStopGlueWorkflowRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { name: string; runId: string }) =>
      api(`/aws/glue/workflows/${encodeURIComponent(params.name)}/runs/${encodeURIComponent(params.runId)}/stop`, { method: "POST" }),
    onSuccess: (_d, v: { name: string; runId: string }) => qc.invalidateQueries({ queryKey: ["aws", "glue", "workflow-runs", v.name] }),
  });
}

export function useResumeGlueWorkflowRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { name: string; runId: string }) =>
      api(`/aws/glue/workflows/${encodeURIComponent(params.name)}/runs/${encodeURIComponent(params.runId)}/resume`, { method: "POST" }),
    onSuccess: (_d, v: { name: string; runId: string }) => qc.invalidateQueries({ queryKey: ["aws", "glue", "workflow-runs", v.name] }),
  });
}

export function useGlueWorkflowRunProperties(name: string | null, runId: string | null) {
  return useQuery<{ runProperties: Record<string, string> | null }>({
    queryKey: ["aws", "glue", "workflow-run-properties", name, runId],
    queryFn: () => api(`/aws/glue/workflows/${encodeURIComponent(name!)}/runs/${encodeURIComponent(runId!)}/properties`),
    enabled: !!name && !!runId,
  });
}

export function usePutGlueWorkflowRunProperties(name: string, runId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (runProperties: Record<string, string>) =>
      api(`/aws/glue/workflows/${encodeURIComponent(name)}/runs/${encodeURIComponent(runId)}/properties`, {
        method: "PUT",
        body: JSON.stringify({ runProperties }),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "glue", "workflow-run-properties", name, runId] }),
  });
}

export function useGlueBatchGetWorkflows() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (names: string[]) =>
      api("/aws/glue/workflows/batch-get", { method: "POST", body: JSON.stringify({ names }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "glue", "workflows"] }),
  });
}

// ─── Connection extras ──────────────────────────────────

export function useGlueBatchDeleteConnections() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (connectionNames: string[]) =>
      api("/aws/glue/connections/batch-delete", { method: "POST", body: JSON.stringify({ connectionNames }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "glue", "connections"] }),
  });
}

export function useTestGlueConnection() {
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/glue/connections/test", { method: "POST", body: JSON.stringify(body) }),
  });
}

// ─── Resource policies / catalog / data quality / search ──

export function useGlueResourcePolicy() {
  return useQuery<{ policyInJson: string | null }>({
    queryKey: ["aws", "glue", "resource-policy"],
    queryFn: () => api("/aws/glue/resource-policy"),
  });
}

export function useGlueResourcePolicies() {
  return useQuery<{ policies: any[]; total: number }>({
    queryKey: ["aws", "glue", "resource-policies"],
    queryFn: () => api("/aws/glue/resource-policies"),
  });
}

export function usePutGlueResourcePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (policyInJson: string) =>
      api("/aws/glue/resource-policy", { method: "PUT", body: JSON.stringify({ policyInJson }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "glue", "resource-policy"] }),
  });
}

export function useDeleteGlueResourcePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api("/aws/glue/resource-policy", { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "glue", "resource-policy"] }),
  });
}

export function useGlueDataCatalogEncryptionSettings() {
  return useQuery<{ dataCatalogEncryptionSettings: any | null }>({
    queryKey: ["aws", "glue", "data-catalog-encryption-settings"],
    queryFn: () => api("/aws/glue/data-catalog-encryption-settings"),
  });
}

export function usePutGlueDataCatalogEncryptionSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dataCatalogEncryptionSettings: any) =>
      api("/aws/glue/data-catalog-encryption-settings", {
        method: "PUT",
        body: JSON.stringify({ dataCatalogEncryptionSettings }),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "glue", "data-catalog-encryption-settings"] }),
  });
}

export function useGlueDataQualityRulesets() {
  return useQuery<{ rulesets: any[]; total: number }>({
    queryKey: ["aws", "glue", "data-quality-rulesets"],
    queryFn: () => api("/aws/glue/data-quality-rulesets"),
  });
}

export function useSearchGlueTables(searchText: string | null) {
  return useQuery<{ tables: any[]; total: number }>({
    queryKey: ["aws", "glue", "search-tables", searchText],
    queryFn: () => api(`/aws/glue/search-tables?text=${encodeURIComponent(searchText!)}`),
    enabled: !!searchText,
  });
}
