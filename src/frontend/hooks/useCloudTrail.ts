import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface CloudTrailTrail {
  Name: string;
  TrailARN: string;
  S3BucketName?: string;
  IncludeGlobalServiceEvents?: boolean;
  IsMultiRegionTrail?: boolean;
  IsOrganizationTrail?: boolean;
  HomeRegion?: string;
  CreationDate?: number;
  HasCustomEventSelectors?: boolean;
  HasInsightSelectors?: boolean;
  CloudWatchLogsLogGroupArn?: string;
  CloudWatchLogsRoleArn?: string;
  KmsKeyId?: string;
  IsLogging?: boolean;
}

// ── Trails ───────────────────────────────────────────────

export function useCloudTrailTrails() {
  return useQuery<{ trails: CloudTrailTrail[]; total: number }>({
    queryKey: ["aws", "cloudtrail", "trails"],
    queryFn: () => api("/aws/cloudtrail/trails"),
    refetchInterval: 10000,
  });
}

export function useCreateCloudTrailTrail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      name: string;
      s3BucketName?: string;
      includeGlobalServiceEvents?: boolean;
      isMultiRegionTrail?: boolean;
      isOrganizationTrail?: boolean;
    }) =>
      api("/aws/cloudtrail/trails", { method: "POST", body: JSON.stringify(params) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "cloudtrail", "trails"] }),
  });
}

export function useUpdateCloudTrailTrail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      name: string;
      s3BucketName?: string;
      includeGlobalServiceEvents?: boolean;
      isMultiRegionTrail?: boolean;
    }) =>
      api(`/aws/cloudtrail/trails/${encodeURIComponent(params.name)}`, {
        method: "PUT",
        body: JSON.stringify(params),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "cloudtrail", "trails"] }),
  });
}

export function useDeleteCloudTrailTrail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/cloudtrail/trails/${encodeURIComponent(name)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "cloudtrail", "trails"] }),
  });
}

export function useStartCloudTrailLogging() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/cloudtrail/trails/${encodeURIComponent(name)}/start`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "cloudtrail", "trails"] }),
  });
}

export function useStopCloudTrailLogging() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/cloudtrail/trails/${encodeURIComponent(name)}/stop`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "cloudtrail", "trails"] }),
  });
}
