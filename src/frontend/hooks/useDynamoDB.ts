import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface DynamoDBTable {
  name: string;
  status: string;
  itemCount: number;
  sizeBytes: number;
  arn?: string;
  createdAt?: string;
}

export interface DynamoDBKeySchema {
  AttributeName: string;
  KeyType: string;
}

export interface DynamoDBTableDetail {
  name: string;
  status: string;
  itemCount: number;
  sizeBytes: number;
  keySchema: DynamoDBKeySchema[];
  arn?: string;
  createdAt?: string;
}

export function useDynamoDBTables() {
  return useQuery<{ tables: string[]; total: number }>({
    queryKey: ["aws", "dynamodb", "tables"],
    queryFn: () => api("/aws/dynamodb/tables"),
    refetchInterval: 10000,
  });
}

export function useDynamoDBTableDetail(name: string | null) {
  return useQuery<DynamoDBTableDetail>({
    queryKey: ["aws", "dynamodb", "table", name],
    queryFn: () => api(`/aws/dynamodb/tables/${name}`),
    enabled: !!name,
  });
}

export function useDynamoDBScan(table: string | null) {
  return useQuery<{ table: string; items: Record<string, any>[]; count: number }>({
    queryKey: ["aws", "dynamodb", "items", table],
    queryFn: () => api(`/aws/dynamodb/tables/${table}/items`),
    enabled: !!table,
    refetchInterval: 10000,
  });
}

export function useDynamoDBGetItem(table: string | null) {
  return useMutation({
    mutationFn: (key: Record<string, any>) =>
      api(`/aws/dynamodb/tables/${table}/items/get`, {
        method: "POST",
        body: JSON.stringify({ key }),
      }),
  });
}

export function useDynamoDBCreateTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      hashKey: string;
      hashType?: string;
      rangeKey?: string;
      rangeType?: string;
    }) =>
      api("/aws/dynamodb/tables", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "dynamodb", "tables"] }),
  });
}

export function useDynamoDBDeleteTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/dynamodb/tables/${name}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "dynamodb", "tables"] }),
  });
}

export function useDynamoDBPutItem(table: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (item: Record<string, any>) =>
      api(`/aws/dynamodb/tables/${table}/items`, {
        method: "PUT",
        body: JSON.stringify({ item }),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "dynamodb", "items", table] }),
  });
}

export function useDynamoDBDeleteItem(table: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (key: Record<string, any>) =>
      api(`/aws/dynamodb/tables/${table}/items/delete`, {
        method: "POST",
        body: JSON.stringify({ key }),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "dynamodb", "items", table] }),
  });
}
