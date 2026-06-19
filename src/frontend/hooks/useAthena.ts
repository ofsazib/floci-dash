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
