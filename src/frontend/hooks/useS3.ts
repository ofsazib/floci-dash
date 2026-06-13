import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface S3Bucket {
  name: string;
  createdAt: string | null;
}

export interface S3Object {
  key: string;
  size: number;
  lastModified: string | null;
  etag: string;
}

export interface S3ObjectDetail {
  bucket: string;
  key: string;
  contentType: string;
  size: number;
  lastModified: string;
  etag: string;
  body: string;
  bodyEncoding: "utf-8" | "base64";
}

export function useS3Buckets() {
  return useQuery<{ buckets: S3Bucket[]; total: number }>({
    queryKey: ["aws", "s3", "buckets"],
    queryFn: () => api("/aws/s3/buckets"),
    refetchInterval: 10000,
  });
}

export function useS3Objects(bucket: string | null) {
  return useQuery<{ bucket: string; objects: S3Object[]; total: number }>({
    queryKey: ["aws", "s3", "objects", bucket],
    queryFn: () => api(`/aws/s3/buckets/${bucket}/objects`),
    enabled: !!bucket,
    refetchInterval: 10000,
  });
}

export function useS3ObjectDetail(bucket: string | null, key: string | null) {
  return useQuery<S3ObjectDetail>({
    queryKey: ["aws", "s3", "object", bucket, key],
    queryFn: () => api(`/aws/s3/buckets/${bucket}/objects/${encodeURIComponent(key!)}`),
    enabled: !!bucket && !!key,
  });
}

export function useS3CreateBucket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api("/aws/s3/buckets", { method: "POST", body: JSON.stringify({ name }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "s3", "buckets"] }),
  });
}

export function useS3DeleteBucket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/s3/buckets/${name}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "s3", "buckets"] }),
  });
}

export interface S3UploadResult {
  key: string;
  size: number;
  status: "uploaded" | "error";
  error?: string;
}

export interface S3UploadFilesResponse {
  bucket: string;
  prefix: string;
  uploaded: number;
  failed: number;
  results: S3UploadResult[];
}

export function useS3UploadFiles(bucket: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ files, prefix }: { files: File[]; prefix?: string }) => {
      const fd = new FormData();
      for (const f of files) fd.append("files", f, f.name);
      const qs = prefix ? `?prefix=${encodeURIComponent(prefix)}` : "";
      const res = await fetch(`/api/aws/s3/buckets/${bucket}/objects/upload${qs}`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Upload failed: ${res.statusText}`);
      }
      return res.json() as Promise<S3UploadFilesResponse>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "s3", "objects", bucket] }),
  });
}

export function useS3DeleteObject(bucket: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (key: string) =>
      api(`/aws/s3/buckets/${bucket}/objects/${encodeURIComponent(key)}`, {
        method: "DELETE",
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "s3", "objects", bucket] }),
  });
}
