import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface S3TableBucket {
  arn: string | null;
  name: string;
  createdAt: string;
}

export function useS3TableBuckets() {
  return useQuery<{ buckets: S3TableBucket[]; total: number; nextToken: string | null }>({
    queryKey: ["aws", "s3tables", "buckets"],
    queryFn: () => api("/aws/s3tables/buckets"),
  });
}

export function useCreateS3TableBucket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api("/aws/s3tables/buckets", { method: "POST", body: JSON.stringify({ name }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "s3tables", "buckets"] }),
  });
}

export function useDeleteS3TableBucket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (arn: string) =>
      api(`/aws/s3tables/buckets/${encodeURIComponent(arn)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "s3tables", "buckets"] }),
  });
}

export function useS3TableNamespaces(bucketArn: string | null) {
  return useQuery<{ namespaces: any[]; total: number }>({
    queryKey: ["aws", "s3tables", "namespaces", bucketArn],
    queryFn: () =>
      api(`/aws/s3tables/namespaces/${encodeURIComponent(bucketArn!)}`),
    enabled: !!bucketArn,
  });
}

export function useCreateS3TableNamespace(bucketArn: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (namespace: string) =>
      api(`/aws/s3tables/namespaces/${encodeURIComponent(bucketArn!)}`, {
        method: "POST",
        body: JSON.stringify({ namespace }),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "s3tables", "namespaces"] }),
  });
}

export function useDeleteS3TableNamespace(bucketArn: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (namespace: string) =>
      api(
        `/aws/s3tables/namespaces/${encodeURIComponent(bucketArn!)}/${encodeURIComponent(namespace)}`,
        { method: "DELETE" }
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "s3tables", "namespaces"] }),
  });
}

export function useS3Tables(bucketArn: string | null, namespace: string | null) {
  return useQuery<{ tables: any[]; total: number }>({
    queryKey: ["aws", "s3tables", "tables", bucketArn, namespace],
    queryFn: () =>
      api(
        `/aws/s3tables/tables/${encodeURIComponent(bucketArn!)}/${encodeURIComponent(namespace!)}`
      ),
    enabled: !!bucketArn && !!namespace,
  });
}

export function useCreateS3Table(bucketArn: string | null, namespace: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; format: string }) =>
      api(
        `/aws/s3tables/tables/${encodeURIComponent(bucketArn!)}/${encodeURIComponent(namespace!)}`,
        { method: "POST", body: JSON.stringify(body) }
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "s3tables", "tables"] }),
  });
}

export function useDeleteS3Table(bucketArn: string | null, namespace: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tableName: string) =>
      api(
        `/aws/s3tables/tables/${encodeURIComponent(bucketArn!)}/${encodeURIComponent(
          namespace!
        )}/${encodeURIComponent(tableName)}`,
        { method: "DELETE" }
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "s3tables", "tables"] }),
  });
}
