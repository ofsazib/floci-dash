import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface CloudFrontDistributionSummary {
  Id: string;
  ARN: string;
  Status: string;
  LastModifiedTime?: string;
  DomainName: string;
  Aliases: { Quantity: number; Items?: string[] };
  Origins: { Quantity: number; Items?: any[] };
  DefaultCacheBehavior: any;
  Enabled: boolean;
  Comment?: string;
  PriceClass?: string;
  ViewerCertificate?: any;
}

export interface CloudFrontDistribution extends CloudFrontDistributionSummary {
  DistributionConfig: any;
  InProgressInvalidationBatches?: number;
  ActiveTrustedSigners?: any;
  ActiveTrustedKeyGroups?: any;
}

export interface CloudFrontInvalidation {
  Id: string;
  Status: string;
  CreateTime: string;
  InvalidationBatch: {
    CallerReference: string;
    Paths: { Quantity: number; Items: string[] };
  };
}

export interface CloudFrontCachePolicy {
  Type: string;
  CachePolicy: {
    Id: string;
    LastModifiedTime?: string;
    CachePolicyConfig: {
      Name: string;
      Comment?: string;
      MinTTL?: number;
      MaxTTL?: number;
      DefaultTTL?: number;
    };
  };
}

export interface CloudFrontOriginAccessControl {
  Id: string;
  OriginAccessControlConfig?: {
    Name: string;
    Description?: string;
    SigningProtocol?: string;
    SigningBehavior?: string;
    OriginAccessControlOriginType?: string;
  };
}

export interface CloudFrontFunction {
  Name: string;
  FunctionARN: string;
  Status?: string;
  Stage?: string;
  LastModifiedTime?: string;
  FunctionMetadata?: {
    CreatedTime?: string;
    Stage?: string;
  };
  FunctionConfig?: {
    Comment?: string;
    Runtime?: string;
  };
}

// ── Distributions ────────────────────────────────────────

export function useCloudFrontDistributions() {
  return useQuery<{ distributions: CloudFrontDistributionSummary[]; total: number }>({
    queryKey: ["aws", "cloudfront", "distributions"],
    queryFn: () => api("/aws/cloudfront/distributions"),
    refetchInterval: 15000,
  });
}

export function useCloudFrontDistribution(id: string | null) {
  return useQuery<{ distribution: CloudFrontDistribution; eTag: string }>({
    queryKey: ["aws", "cloudfront", "distribution", id],
    queryFn: () => api(`/aws/cloudfront/distributions/${encodeURIComponent(id!)}`),
    enabled: !!id,
  });
}

export function useCreateCloudFrontDistribution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { distributionConfig: any }) =>
      api("/aws/cloudfront/distributions", {
        method: "POST",
        body: JSON.stringify(params),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "cloudfront", "distributions"] }),
  });
}

export function useDeleteCloudFrontDistribution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; eTag: string }) =>
      api(`/aws/cloudfront/distributions/${encodeURIComponent(params.id)}`, {
        method: "DELETE",
        headers: { "If-Match": params.eTag },
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "cloudfront", "distributions"] }),
  });
}

// ── Invalidations ────────────────────────────────────────

export function useCloudFrontInvalidations(distributionId: string | null) {
  return useQuery<{ invalidations: CloudFrontInvalidation[]; total: number }>({
    queryKey: ["aws", "cloudfront", "invalidations", distributionId],
    queryFn: () =>
      api(`/aws/cloudfront/distributions/${encodeURIComponent(distributionId!)}/invalidations`),
    enabled: !!distributionId,
  });
}

export function useCreateCloudFrontInvalidation(distributionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { paths: string[]; callerReference?: string }) =>
      api(`/aws/cloudfront/distributions/${encodeURIComponent(distributionId)}/invalidations`, {
        method: "POST",
        body: JSON.stringify(params),
      }),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ["aws", "cloudfront", "invalidations", distributionId],
      }),
  });
}

// ── Cache Policies ───────────────────────────────────────

export function useCloudFrontCachePolicies() {
  return useQuery<{ cachePolicies: CloudFrontCachePolicy[]; total: number }>({
    queryKey: ["aws", "cloudfront", "cache-policies"],
    queryFn: () => api("/aws/cloudfront/cache-policies"),
  });
}

// ── Origin Access Controls ───────────────────────────────

export function useCloudFrontOriginAccessControls() {
  return useQuery<{ originAccessControls: CloudFrontOriginAccessControl[]; total: number }>({
    queryKey: ["aws", "cloudfront", "origin-access-controls"],
    queryFn: () => api("/aws/cloudfront/origin-access-controls"),
  });
}

// ── Functions ────────────────────────────────────────────

export function useCloudFrontFunctions() {
  return useQuery<{ functions: CloudFrontFunction[]; total: number }>({
    queryKey: ["aws", "cloudfront", "functions"],
    queryFn: () => api("/aws/cloudfront/functions"),
  });
}

// ── Tags ─────────────────────────────────────────────────

export function useCloudFrontTags(resource: string | null) {
  return useQuery<{ tags: { Key: string; Value: string }[] }>({
    queryKey: ["aws", "cloudfront", "tags", resource],
    queryFn: () =>
      api(`/aws/cloudfront/tags?resource=${encodeURIComponent(resource!)}`),
    enabled: !!resource,
  });
}
