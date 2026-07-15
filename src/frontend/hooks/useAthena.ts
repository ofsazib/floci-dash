import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface AthenaWorkGroup {
  Name: string;
  Description?: string;
  State?: string;
  CreationTime?: number;
}

export interface AthenaQueryExecution {
  QueryExecutionId: string;
  Query?: string;
  Status?: { State?: string; StateChangeReason?: string; SubmissionDateTime?: number; CompletionDateTime?: number };
  WorkGroup?: string;
  Statistics?: { EngineExecutionTimeInMillis?: number; DataScannedInBytes?: number };
}

// ── Work Groups ──────────────────────────────────────────

export function useAthenaWorkGroups() {
  return useQuery<{ workGroups: AthenaWorkGroup[]; total: number }>({
    queryKey: ["aws", "athena", "work-groups"],
    queryFn: () => api("/aws/athena/work-groups"),
    refetchInterval: 15000,
  });
}

export function useAthenaWorkGroup(name: string | null) {
  return useQuery<{ workGroup: any }>({
    queryKey: ["aws", "athena", "work-group", name],
    queryFn: () => api(`/aws/athena/work-groups/${encodeURIComponent(name!)}`),
    enabled: !!name,
  });
}

export function useCreateAthenaWorkGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { name: string; description?: string }) =>
      api("/aws/athena/work-groups", { method: "POST", body: JSON.stringify(params) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "athena", "work-groups"] }),
  });
}

export function useDeleteAthenaWorkGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/athena/work-groups/${encodeURIComponent(name)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "athena", "work-groups"] }),
  });
}

// ── Query Executions ─────────────────────────────────────

export function useAthenaQueryExecutions() {
  return useQuery<{ queryExecutionIds: string[]; total: number }>({
    queryKey: ["aws", "athena", "query-executions"],
    queryFn: () => api("/aws/athena/query-executions"),
    refetchInterval: 10000,
  });
}

export function useAthenaQueryExecution(id: string | null) {
  return useQuery<{ queryExecution: AthenaQueryExecution }>({
    queryKey: ["aws", "athena", "query-execution", id],
    queryFn: () => api(`/aws/athena/query-executions/${encodeURIComponent(id!)}`),
    enabled: !!id,
  });
}

export interface QueryResultsData {
  queryExecutionId: string;
  rows: string[][];
  headers: Array<{ name: string; type: string; label: string }>;
  nextToken: string | null;
  totalRows: number;
}

export function useAthenaQueryResults(id: string | null) {
  return useQuery<QueryResultsData>({
    queryKey: ["aws", "athena", "query-results", id],
    queryFn: () => api(`/aws/athena/query-executions/${encodeURIComponent(id!)}/results`),
    enabled: !!id,
  });
}

export function useStopAthenaQuery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/aws/athena/query-executions/${encodeURIComponent(id)}/stop`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aws", "athena", "query-executions"] });
      qc.invalidateQueries({ queryKey: ["aws", "athena", "query-execution"] });
    },
  });
}

// ── Data Catalogs ────────────────────────────────────────

export function useAthenaDataCatalogs() {
  return useQuery<{ dataCatalogs: any[]; total: number }>({
    queryKey: ["aws", "athena", "data-catalogs"],
    queryFn: () => api("/aws/athena/data-catalogs"),
  });
}

// ── Databases ────────────────────────────────────────────

export function useAthenaDatabases() {
  return useQuery<{ databases: any[]; total: number }>({
    queryKey: ["aws", "athena", "databases"],
    queryFn: () => api("/aws/athena/databases"),
  });
}

// ── Table Metadata ───────────────────────────────────────

export function useAthenaTables(databaseName: string | null) {
  return useQuery<{ tables: any[]; total: number }>({
    queryKey: ["aws", "athena", "tables", databaseName],
    queryFn: () => api(`/aws/athena/databases/${encodeURIComponent(databaseName!)}/tables`),
    enabled: !!databaseName,
  });
}

export function useAthenaTableMetadata(dbName: string | null, tableName: string | null) {
  return useQuery<{ tableMetadata: any }>({
    queryKey: ["aws", "athena", "table-metadata", dbName, tableName],
    queryFn: () =>
      api(`/aws/athena/databases/${encodeURIComponent(dbName!)}/tables/${encodeURIComponent(tableName!)}`),
    enabled: !!dbName && !!tableName,
  });
}
