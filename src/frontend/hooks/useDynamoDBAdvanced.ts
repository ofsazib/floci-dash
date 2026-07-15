import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

// ─── UpdateTable ──────────────────────────────────────────────────

export interface UpdateTableParams {
  BillingMode?: "PROVISIONED" | "PAY_PER_REQUEST";
  ProvisionedThroughput?: { ReadCapacityUnits: number; WriteCapacityUnits: number };
  SSESpecification?: { Enabled: boolean; SSEType?: string; KMSMasterKeyId?: string };
  StreamSpecification?: { StreamEnabled: boolean; StreamViewType?: string };
  DeletionProtectionEnabled?: boolean;
  TableClass?: "STANDARD" | "STANDARD_INFREQUENT_ACCESS";
  AttributeDefinitions?: Array<{ AttributeName: string; AttributeType: string }>;
  GlobalSecondaryIndexUpdates?: Array<{
    Create?: {
      IndexName: string;
      KeySchema: Array<{ AttributeName: string; KeyType: string }>;
      Projection?: { ProjectionType?: string; NonKeyAttributes?: string[] };
      ProvisionedThroughput?: { ReadCapacityUnits: number; WriteCapacityUnits: number };
    };
    Delete?: { IndexName: string };
  }>;
}

export function useDynamoDBUpdateTable(table: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: UpdateTableParams) =>
      api(`/aws/dynamodb/tables/${table}/update`, {
        method: "PUT",
        body: JSON.stringify(params),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aws", "dynamodb", "table", table] });
      qc.invalidateQueries({ queryKey: ["aws", "dynamodb", "tables"] });
    },
  });
}

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

// ─── Exports ──────────────────────────────────────────────────────

export interface DynamoDBExport {
  exportArn: string;
  exportStatus: string;
  exportType: string;
  startTime: string | null;
  endTime: string | null;
  itemCount: number;
  exportManifest: string;
}

export interface DynamoDBExportList {
  exports: DynamoDBExport[];
  total: number;
  nextToken: string | null;
}

export function useDynamoDBExports(table: string | null) {
  return useQuery<DynamoDBExportList>({
    queryKey: ["aws", "dynamodb", "exports", table],
    queryFn: () => api(`/aws/dynamodb/tables/${table}/exports`),
    enabled: !!table,
    refetchInterval: 15000,
  });
}

export function useDynamoDBExportTable(table: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      s3Bucket: string;
      s3Prefix?: string;
      exportFormat?: string;
    }) =>
      api(`/aws/dynamodb/tables/${table}/exports`, {
        method: "POST",
        body: JSON.stringify(params),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "dynamodb", "exports", table] }),
  });
}

export interface DynamoDBExportDetail {
  exportArn: string;
  exportStatus: string;
  exportType: string;
  startTime: string | null;
  endTime: string | null;
  itemCount: number;
  s3Bucket: string;
  s3Prefix: string;
  exportManifest: string;
  tableArn: string;
  failureCode: string | null;
  failureMessage: string | null;
}

export function useDynamoDBDescribeExport(exportArn: string | null) {
  return useQuery<DynamoDBExportDetail>({
    queryKey: ["aws", "dynamodb", "export", exportArn],
    queryFn: () =>
      api(`/aws/dynamodb/exports?arn=${encodeURIComponent(exportArn!)}`),
    enabled: !!exportArn,
  });
}
