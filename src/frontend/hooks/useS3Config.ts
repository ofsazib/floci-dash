import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

// ─── Bucket Versioning ────────────────────────────────────────────

export interface S3BucketVersioning {
  bucket: string;
  status: string;
  mfaDelete: string;
}

export function useS3BucketVersioning(bucket: string | null) {
  return useQuery<S3BucketVersioning>({
    queryKey: ["aws", "s3", "versioning", bucket],
    queryFn: () => api(`/aws/s3/buckets/${bucket}/versioning`),
    enabled: !!bucket,
  });
}

export function useS3UpdateVersioning(bucket: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: string) =>
      api(`/aws/s3/buckets/${bucket}/versioning`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "s3", "versioning", bucket] }),
  });
}

// ─── Bucket Tags ──────────────────────────────────────────────────

export interface S3Tag {
  Key: string;
  Value: string;
}

export interface S3BucketTags {
  bucket: string;
  tags: S3Tag[];
  total: number;
}

export function useS3BucketTags(bucket: string | null) {
  return useQuery<S3BucketTags>({
    queryKey: ["aws", "s3", "tags", bucket],
    queryFn: () => api(`/aws/s3/buckets/${bucket}/tags`),
    enabled: !!bucket,
  });
}

export function useS3UpdateBucketTags(bucket: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tags: S3Tag[]) =>
      api(`/aws/s3/buckets/${bucket}/tags`, {
        method: "PUT",
        body: JSON.stringify({ tags }),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "s3", "tags", bucket] }),
  });
}

export function useS3DeleteBucketTags(bucket: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api(`/aws/s3/buckets/${bucket}/tags`, { method: "DELETE" }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "s3", "tags", bucket] }),
  });
}

// ─── Bucket Policy ────────────────────────────────────────────────

export interface S3BucketPolicy {
  bucket: string;
  policy: string | null;
  hasPolicy: boolean;
}

export function useS3BucketPolicy(bucket: string | null) {
  return useQuery<S3BucketPolicy>({
    queryKey: ["aws", "s3", "policy", bucket],
    queryFn: () => api(`/aws/s3/buckets/${bucket}/policy`),
    enabled: !!bucket,
  });
}

export function useS3UpdateBucketPolicy(bucket: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (policy: string | Record<string, any>) =>
      api(`/aws/s3/buckets/${bucket}/policy`, {
        method: "PUT",
        body: JSON.stringify({ policy }),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "s3", "policy", bucket] }),
  });
}

export function useS3DeleteBucketPolicy(bucket: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api(`/aws/s3/buckets/${bucket}/policy`, { method: "DELETE" }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "s3", "policy", bucket] }),
  });
}

// ─── Bucket Lifecycle ─────────────────────────────────────────────

export interface S3LifecycleRule {
  id?: string;
  status?: string;
  prefix?: string;
  transitions?: any[];
  expiration?: any;
  noncurrentVersionExpiration?: any;
}

export interface S3BucketLifecycle {
  bucket: string;
  rules: S3LifecycleRule[];
  total: number;
}

export function useS3BucketLifecycle(bucket: string | null) {
  return useQuery<S3BucketLifecycle>({
    queryKey: ["aws", "s3", "lifecycle", bucket],
    queryFn: () => api(`/aws/s3/buckets/${bucket}/lifecycle`),
    enabled: !!bucket,
  });
}

export function useS3UpdateBucketLifecycle(bucket: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rules: S3LifecycleRule[]) =>
      api(`/aws/s3/buckets/${bucket}/lifecycle`, {
        method: "PUT",
        body: JSON.stringify({ rules }),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "s3", "lifecycle", bucket] }),
  });
}

export function useS3DeleteBucketLifecycle(bucket: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api(`/aws/s3/buckets/${bucket}/lifecycle`, { method: "DELETE" }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "s3", "lifecycle", bucket] }),
  });
}

// ─── Bucket CORS ──────────────────────────────────────────────────

export interface S3CorsRule {
  ID?: string;
  AllowedHeaders?: string[];
  AllowedMethods?: string[];
  AllowedOrigins?: string[];
  ExposeHeaders?: string[];
  MaxAgeSeconds?: number;
}

export interface S3BucketCors {
  bucket: string;
  rules: S3CorsRule[];
  total: number;
}

export function useS3BucketCors(bucket: string | null) {
  return useQuery<S3BucketCors>({
    queryKey: ["aws", "s3", "cors", bucket],
    queryFn: () => api(`/aws/s3/buckets/${bucket}/cors`),
    enabled: !!bucket,
  });
}

export function useS3UpdateBucketCors(bucket: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rules: S3CorsRule[]) =>
      api(`/aws/s3/buckets/${bucket}/cors`, {
        method: "PUT",
        body: JSON.stringify({ rules }),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "s3", "cors", bucket] }),
  });
}

export function useS3DeleteBucketCors(bucket: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api(`/aws/s3/buckets/${bucket}/cors`, { method: "DELETE" }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "s3", "cors", bucket] }),
  });
}

// ─── Bucket Website ───────────────────────────────────────────────

export interface S3BucketWebsite {
  bucket: string;
  indexDocument: string | null;
  errorDocument: string | null;
  redirectAllRequestsTo: any | null;
  routingRules: any[];
  configured: boolean;
}

export function useS3BucketWebsite(bucket: string | null) {
  return useQuery<S3BucketWebsite>({
    queryKey: ["aws", "s3", "website", bucket],
    queryFn: () => api(`/aws/s3/buckets/${bucket}/website`),
    enabled: !!bucket,
  });
}

export function useS3UpdateBucketWebsite(bucket: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (config: { indexDocument?: string; errorDocument?: string }) =>
      api(`/aws/s3/buckets/${bucket}/website`, {
        method: "PUT",
        body: JSON.stringify(config),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "s3", "website", bucket] }),
  });
}

export function useS3DeleteBucketWebsite(bucket: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api(`/aws/s3/buckets/${bucket}/website`, { method: "DELETE" }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "s3", "website", bucket] }),
  });
}

// ─── Bucket Encryption ────────────────────────────────────────────

export interface S3BucketEncryption {
  bucket: string;
  rules: any[];
  configured: boolean;
}

export function useS3BucketEncryption(bucket: string | null) {
  return useQuery<S3BucketEncryption>({
    queryKey: ["aws", "s3", "encryption", bucket],
    queryFn: () => api(`/aws/s3/buckets/${bucket}/encryption`),
    enabled: !!bucket,
  });
}

export function useS3UpdateBucketEncryption(bucket: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sseAlgorithm: string) =>
      api(`/aws/s3/buckets/${bucket}/encryption`, {
        method: "PUT",
        body: JSON.stringify({ sseAlgorithm }),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "s3", "encryption", bucket] }),
  });
}

export function useS3DeleteBucketEncryption(bucket: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api(`/aws/s3/buckets/${bucket}/encryption`, { method: "DELETE" }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "s3", "encryption", bucket] }),
  });
}

// ─── Bucket Notifications ─────────────────────────────────────────

export interface S3BucketNotifications {
  bucket: string;
  lambdaNotifications: any[];
  sqsNotifications: any[];
  snsNotifications: any[];
  total: number;
}

export function useS3BucketNotifications(bucket: string | null) {
  return useQuery<S3BucketNotifications>({
    queryKey: ["aws", "s3", "notifications", bucket],
    queryFn: () => api(`/aws/s3/buckets/${bucket}/notifications`),
    enabled: !!bucket,
  });
}

export function useS3UpdateBucketNotifications(bucket: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (config: { lambdaNotifications?: any[]; sqsNotifications?: any[]; snsNotifications?: any[] }) =>
      api(`/aws/s3/buckets/${bucket}/notifications`, {
        method: "PUT",
        body: JSON.stringify(config),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "s3", "notifications", bucket] }),
  });
}

// ─── Public Access Block ──────────────────────────────────────────

export interface S3PublicAccessBlock {
  bucket: string;
  blockPublicAcls: boolean;
  ignorePublicAcls: boolean;
  blockPublicPolicy: boolean;
  restrictPublicBuckets: boolean;
  configured: boolean;
}

export function useS3PublicAccessBlock(bucket: string | null) {
  return useQuery<S3PublicAccessBlock>({
    queryKey: ["aws", "s3", "public-access-block", bucket],
    queryFn: () => api(`/aws/s3/buckets/${bucket}/public-access-block`),
    enabled: !!bucket,
  });
}

export function useS3UpdatePublicAccessBlock(bucket: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (config: { blockPublicAcls?: boolean; ignorePublicAcls?: boolean; blockPublicPolicy?: boolean; restrictPublicBuckets?: boolean }) =>
      api(`/aws/s3/buckets/${bucket}/public-access-block`, {
        method: "PUT",
        body: JSON.stringify(config),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "s3", "public-access-block", bucket] }),
  });
}

export function useS3DeletePublicAccessBlock(bucket: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api(`/aws/s3/buckets/${bucket}/public-access-block`, { method: "DELETE" }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "s3", "public-access-block", bucket] }),
  });
}

// ─── Bucket Logging ───────────────────────────────────────────────

export interface S3BucketLogging {
  bucket: string;
  targetBucket: string | null;
  targetPrefix: string | null;
  enabled: boolean;
}

export function useS3BucketLogging(bucket: string | null) {
  return useQuery<S3BucketLogging>({
    queryKey: ["aws", "s3", "logging", bucket],
    queryFn: () => api(`/aws/s3/buckets/${bucket}/logging`),
    enabled: !!bucket,
  });
}

export function useS3UpdateBucketLogging(bucket: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (config: { targetBucket: string; targetPrefix?: string }) =>
      api(`/aws/s3/buckets/${bucket}/logging`, {
        method: "PUT",
        body: JSON.stringify(config),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "s3", "logging", bucket] }),
  });
}

// ─── Object Tags ──────────────────────────────────────────────────

export function useS3ObjectTags(bucket: string | null, key: string | null) {
  return useQuery<{ bucket: string; key: string; tags: S3Tag[]; total: number }>({
    queryKey: ["aws", "s3", "object-tags", bucket, key],
    queryFn: () => api(`/aws/s3/buckets/${bucket}/objects/${encodeURIComponent(key!)}/tags`),
    enabled: !!bucket && !!key,
  });
}

export function useS3UpdateObjectTags(bucket: string, key: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tags: S3Tag[]) =>
      api(`/aws/s3/buckets/${bucket}/objects/${encodeURIComponent(key)}/tags`, {
        method: "PUT",
        body: JSON.stringify({ tags }),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "s3", "object-tags", bucket, key] }),
  });
}

export function useS3DeleteObjectTags(bucket: string, key: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api(`/aws/s3/buckets/${bucket}/objects/${encodeURIComponent(key)}/tags`, { method: "DELETE" }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "s3", "object-tags", bucket, key] }),
  });
}

// ─── Object Attributes ────────────────────────────────────────────

export interface S3ObjectAttributes {
  bucket: string;
  key: string;
  etag?: string;
  checksum?: any;
  objectParts?: any;
  storageClass?: string;
  objectSize?: number;
}

export function useS3ObjectAttributes(bucket: string | null, key: string | null) {
  return useQuery<S3ObjectAttributes>({
    queryKey: ["aws", "s3", "object-attributes", bucket, key],
    queryFn: () => api(`/aws/s3/buckets/${bucket}/objects/${encodeURIComponent(key!)}/attributes`),
    enabled: !!bucket && !!key,
  });
}

// ─── Head Bucket ──────────────────────────────────────────────────

export function useS3HeadBucket(bucket: string | null) {
  return useQuery<{ bucket: string; exists: boolean }>({
    queryKey: ["aws", "s3", "head-bucket", bucket],
    queryFn: () => api(`/aws/s3/buckets/${bucket}`),
    enabled: !!bucket,
  });
}
