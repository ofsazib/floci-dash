import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface StatementSummary {
  Id?: string;
  Status?: string;
  QueryString?: string;
  Query?: string;
  SubmittedAt?: number;
  Duration?: number;
}

export interface StatementDetail {
  id: string;
  status: string;
  queryString: string;
  duration: number;
  error: string | null;
  resultRows: number;
  hasResultSet: boolean;
  clusterIdentifier: string | null;
  database: string;
}

export interface ResultColumn {
  name: string;
  typeName: string;
}

const enc = encodeURIComponent;

export function useRedshiftDataStatements() {
  return useQuery({
    queryKey: ["aws", "redshiftdata", "statements"],
    queryFn: () =>
      api<{ statements: StatementSummary[]; total: number }>(
        "/aws/redshiftdata/statements"
      ),
  });
}

export function useExecuteRedshiftDataQuery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      clusterIdentifier: string;
      database: string;
      dbUser: string;
      sql: string;
    }) =>
      api<{ id: string; hasResultSet: boolean }>("/aws/redshiftdata/query", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "redshiftdata", "statements"] }),
  });
}

export function useDescribeRedshiftDataStatement(id: string | null) {
  return useQuery({
    queryKey: ["aws", "redshiftdata", "statements", id],
    queryFn: () =>
      api<StatementDetail>(`/aws/redshiftdata/statements/${enc(id!)}`),
    enabled: !!id,
  });
}

export function useRedshiftDataStatementResult(id: string | null) {
  return useQuery({
    queryKey: ["aws", "redshiftdata", "statements", id, "result"],
    queryFn: () =>
      api<{
        columns: ResultColumn[];
        records: Record<string, unknown>[][];
        totalNumRows: number;
      }>(`/aws/redshiftdata/statements/${enc(id!)}/result`),
    enabled: !!id,
  });
}

export function useCancelRedshiftDataStatement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/aws/redshiftdata/statements/${enc(id)}/cancel`, { method: "POST" }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "redshiftdata", "statements"] }),
  });
}

export function useRedshiftDataDatabases(cluster: string | null, dbUser: string | null) {
  return useQuery({
    queryKey: ["aws", "redshiftdata", "databases", cluster, dbUser],
    queryFn: () =>
      api<{ databases: string[] }>(
        `/aws/redshiftdata/databases?cluster=${enc(cluster!)}&dbUser=${enc(dbUser!)}`
      ),
    enabled: !!cluster && !!dbUser,
  });
}

export function useRedshiftDataSchemas(
  cluster: string | null,
  database: string | null,
  dbUser: string | null
) {
  return useQuery({
    queryKey: ["aws", "redshiftdata", "schemas", cluster, database, dbUser],
    queryFn: () =>
      api<{ schemas: string[] }>(
        `/aws/redshiftdata/schemas?cluster=${enc(cluster!)}&database=${enc(database!)}&dbUser=${enc(dbUser!)}`
      ),
    enabled: !!cluster && !!database && !!dbUser,
  });
}

export function useRedshiftDataTables(
  cluster: string | null,
  database: string | null,
  schema: string | null,
  dbUser: string | null
) {
  return useQuery({
    queryKey: ["aws", "redshiftdata", "tables", cluster, database, schema, dbUser],
    queryFn: () =>
      api<{ tables: { name?: string; type?: string; schema?: string }[] }>(
        `/aws/redshiftdata/tables?cluster=${enc(cluster!)}&database=${enc(database!)}&schema=${enc(schema!)}&dbUser=${enc(dbUser!)}`
      ),
    enabled: !!cluster && !!database && !!schema && !!dbUser,
  });
}
