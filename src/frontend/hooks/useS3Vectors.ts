import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

// ── Vector Buckets ──────────────────────────────────────

export function useS3VectorsBuckets() {
  return useQuery({
    queryKey: ["aws", "s3vectors", "buckets"],
    queryFn: () => api<{ buckets: any[]; total: number }>("/aws/s3vectors/buckets"),
  });
}

export function useS3VectorsBucket(bucketName: string | null) {
  return useQuery({
    queryKey: ["aws", "s3vectors", "buckets", bucketName],
    queryFn: () => api<{ bucket: any }>(`/aws/s3vectors/buckets/${bucketName}`),
    enabled: !!bucketName,
  });
}

export function useS3VectorsCreateBucket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { vectorBucketName: string; encryptionConfiguration?: any }) =>
      api("/aws/s3vectors/buckets", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "s3vectors", "buckets"] }),
  });
}

export function useS3VectorsDeleteBucket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api(`/aws/s3vectors/buckets/${name}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "s3vectors", "buckets"] }),
  });
}

// ── Indexes ─────────────────────────────────────────────

export function useS3VectorsIndexes(bucketName: string | null) {
  return useQuery({
    queryKey: ["aws", "s3vectors", "buckets", bucketName, "indexes"],
    queryFn: () => api<{ indexes: any[]; total: number }>(
      `/aws/s3vectors/buckets/${bucketName}/indexes`
    ),
    enabled: !!bucketName,
  });
}

export function useS3VectorsIndex(bucketName: string | null, indexName: string | null) {
  return useQuery({
    queryKey: ["aws", "s3vectors", "buckets", bucketName, "indexes", indexName],
    queryFn: () => api<{ index: any }>(
      `/aws/s3vectors/buckets/${bucketName}/indexes/${indexName}`
    ),
    enabled: !!bucketName && !!indexName,
  });
}

export function useS3VectorsCreateIndex() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      bucketName: string;
      indexName: string;
      dimension: number;
      dataType?: string;
      distanceMetric?: string;
    }) =>
      api(`/aws/s3vectors/buckets/${body.bucketName}/indexes`, {
        method: "POST",
        body: JSON.stringify({
          indexName: body.indexName,
          dimension: body.dimension,
          dataType: body.dataType,
          distanceMetric: body.distanceMetric,
        }),
      }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({
        queryKey: ["aws", "s3vectors", "buckets", variables.bucketName, "indexes"],
      }),
  });
}

export function useS3VectorsDeleteIndex() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bucketName, indexName }: { bucketName: string; indexName: string }) =>
      api(`/aws/s3vectors/buckets/${bucketName}/indexes/${indexName}`, { method: "DELETE" }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({
        queryKey: ["aws", "s3vectors", "buckets", variables.bucketName, "indexes"],
      }),
  });
}

// ── Vector Data ─────────────────────────────────────────

export function useS3VectorsPutVectors() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      bucketName: string;
      indexName: string;
      vectors: Array<{ key: string; data: { float32: number[] }; metadata?: Record<string, any> }>;
    }) =>
      api(`/aws/s3vectors/buckets/${body.bucketName}/indexes/${body.indexName}/vectors`, {
        method: "PUT",
        body: JSON.stringify({ vectors: body.vectors }),
      }),
    onSuccess: () => {},
  });
}

export function useS3VectorsGetVectors(
  bucketName: string | null,
  indexName: string | null,
  keys: string[]
) {
  const keysParam = keys.length ? `keys=${encodeURIComponent(keys.join(","))}` : "";
  return useQuery({
    queryKey: ["aws", "s3vectors", "buckets", bucketName, "indexes", indexName, "vectors", keys],
    queryFn: () =>
      api<{ vectors: any[]; total: number }>(
        `/aws/s3vectors/buckets/${bucketName}/indexes/${indexName}/vectors?${keysParam}&returnData=true&returnMetadata=true`
      ),
    enabled: !!bucketName && !!indexName && keys.length > 0,
  });
}

export function useS3VectorsDeleteVectors() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      bucketName: string;
      indexName: string;
      keys: string[];
    }) =>
      api(`/aws/s3vectors/buckets/${body.bucketName}/indexes/${body.indexName}/vectors`, {
        method: "DELETE",
        body: JSON.stringify({ keys: body.keys }),
      }),
    onSuccess: () => {},
  });
}

// ── Query ───────────────────────────────────────────────

export function useS3VectorsQuery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      bucketName: string;
      indexName: string;
      queryVector: number[];
      topK: number;
      filter?: any;
      returnMetadata?: boolean;
    }) =>
      api(`/aws/s3vectors/buckets/${body.bucketName}/indexes/${body.indexName}/query`, {
        method: "POST",
        body: JSON.stringify({
          queryVector: body.queryVector,
          topK: body.topK,
          filter: body.filter,
          returnMetadata: body.returnMetadata,
        }),
      }),
    onSuccess: () => {},
  });
}
