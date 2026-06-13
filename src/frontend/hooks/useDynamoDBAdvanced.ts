import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

// ─── UpdateItem ───────────────────────────────────────────────────

export function useDynamoDBUpdateItem(table: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      key,
      updates,
      conditionExpression,
      expressionAttributeNames,
      expressionAttributeValues,
    }: {
      key: Record<string, any>;
      updates: Record<string, any>;
      conditionExpression?: string;
      expressionAttributeNames?: Record<string, string>;
      expressionAttributeValues?: Record<string, any>;
    }) =>
      api(`/aws/dynamodb/tables/${table}/items/update`, {
        method: "POST",
        body: JSON.stringify({
          key,
          updates,
          conditionExpression,
          expressionAttributeNames,
          expressionAttributeValues,
        }),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "dynamodb", "items", table] }),
  });
}

// ─── BatchGetItem ─────────────────────────────────────────────────

export function useDynamoDBBatchGet() {
  return useMutation({
    mutationFn: (
      requests: Array<{ tableName: string; keys: Record<string, any>[] }>
    ) =>
      api("/aws/dynamodb/batch-get", {
        method: "POST",
        body: JSON.stringify({ requests }),
      }),
  });
}

// ─── BatchWriteItem ───────────────────────────────────────────────

export function useDynamoDBBatchWrite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      requests: Array<{
        tableName: string;
        type: "put" | "delete";
        item?: Record<string, any>;
        key?: Record<string, any>;
      }>
    ) =>
      api("/aws/dynamodb/batch-write", {
        method: "POST",
        body: JSON.stringify({ requests }),
      }),
    onSuccess: () => qc.invalidateQueries(),
  });
}

// ─── TransactGetItems ─────────────────────────────────────────────

export function useDynamoDBTransactGet() {
  return useMutation({
    mutationFn: (
      items: Array<{ tableName: string; key: Record<string, any> }>
    ) =>
      api("/aws/dynamodb/transaction/get", {
        method: "POST",
        body: JSON.stringify({ items }),
      }),
  });
}

// ─── TransactWriteItems ───────────────────────────────────────────

export function useDynamoDBTransactWrite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      items: Array<{
        type: "put" | "delete" | "update";
        tableName: string;
        item?: Record<string, any>;
        key?: Record<string, any>;
        updates?: Record<string, any>;
      }>
    ) =>
      api("/aws/dynamodb/transaction/write", {
        method: "POST",
        body: JSON.stringify({ items }),
      }),
    onSuccess: () => qc.invalidateQueries(),
  });
}

// ─── TTL ──────────────────────────────────────────────────────────

export interface DynamoDBTTL {
  table: string;
  enabled: boolean;
  status: string;
  attributeName: string | null;
}

export function useDynamoDBTTL(table: string | null) {
  return useQuery<DynamoDBTTL>({
    queryKey: ["aws", "dynamodb", "ttl", table],
    queryFn: () => api(`/aws/dynamodb/tables/${table}/ttl`),
    enabled: !!table,
  });
}

export function useDynamoDBUpdateTTL(table: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ enabled, attributeName }: { enabled: boolean; attributeName: string }) =>
      api(`/aws/dynamodb/tables/${table}/ttl`, {
        method: "PUT",
        body: JSON.stringify({ enabled, attributeName }),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "dynamodb", "ttl", table] }),
  });
}

// ─── Tags ─────────────────────────────────────────────────────────

export interface DynamoDBTag {
  Key: string;
  Value: string;
}

export interface DynamoDBTableTags {
  table: string;
  tags: DynamoDBTag[];
  total: number;
}

export function useDynamoDBTableTags(table: string | null) {
  return useQuery<DynamoDBTableTags>({
    queryKey: ["aws", "dynamodb", "tags", table],
    queryFn: () => api(`/aws/dynamodb/tables/${table}/tags`),
    enabled: !!table,
  });
}

export function useDynamoDBUpdateTags(table: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tags: DynamoDBTag[]) =>
      api(`/aws/dynamodb/tables/${table}/tags`, {
        method: "POST",
        body: JSON.stringify({ tags }),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "dynamodb", "tags", table] }),
  });
}

export function useDynamoDBDeleteTag(table: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tagKey: string) =>
      api(`/aws/dynamodb/tables/${table}/tags/${encodeURIComponent(tagKey)}`, {
        method: "DELETE",
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "dynamodb", "tags", table] }),
  });
}

// ─── Continuous Backups ───────────────────────────────────────────

export interface DynamoDBContinuousBackups {
  table: string;
  pointInTimeRecovery: {
    enabled: boolean;
    status: string;
  };
}

export function useDynamoDBContinuousBackups(table: string | null) {
  return useQuery<DynamoDBContinuousBackups>({
    queryKey: ["aws", "dynamodb", "backups", table],
    queryFn: () => api(`/aws/dynamodb/tables/${table}/backups`),
    enabled: !!table,
  });
}

export function useDynamoDBUpdateContinuousBackups(table: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (pointInTimeRecovery: boolean) =>
      api(`/aws/dynamodb/tables/${table}/backups`, {
        method: "PUT",
        body: JSON.stringify({ pointInTimeRecovery }),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "dynamodb", "backups", table] }),
  });
}

// ─── PartiQL ──────────────────────────────────────────────────────

export interface PartiQLResult {
  items: Record<string, any>[];
  count: number;
  nextToken: string | null;
}

export function useDynamoDBPartiQL() {
  return useMutation({
    mutationFn: ({
      statement,
      parameters,
      consistentRead,
      nextToken,
    }: {
      statement: string;
      parameters?: any[];
      consistentRead?: boolean;
      nextToken?: string;
    }) =>
      api("/aws/dynamodb/partiql/execute", {
        method: "POST",
        body: JSON.stringify({ statement, parameters, consistentRead, nextToken }),
      }),
  });
}
