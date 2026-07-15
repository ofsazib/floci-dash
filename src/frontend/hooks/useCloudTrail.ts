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

// ── Lookup Events ────────────────────────────────────────

export interface LookupEventsParams {
  startTime?: string;
  endTime?: string;
  lookupAttributes?: Array<{ AttributeKey: string; AttributeValue: string }>;
  maxResults?: number;
  nextToken?: string;
  eventCategory?: string;
}

export interface CloudTrailEvent {
  eventId: string;
  eventName: string;
  eventTime: string;
  eventSource: string;
  username: string;
  cloudTrailEvent: string;
  resources?: Array<{ ResourceType?: string; ResourceName?: string }>;
}

export interface LookupEventsResult {
  events: CloudTrailEvent[];
  nextToken: string | null;
  total: number;
}

export function useLookupEvents() {
  return useMutation({
    mutationFn: (params: LookupEventsParams) =>
      api<LookupEventsResult>("/aws/cloudtrail/trails/lookup-events", {
        method: "POST",
        body: JSON.stringify(params),
      }),
  });
}

// ── Event Selectors ──────────────────────────────────────

export interface EventSelector {
  ReadWriteType?: string;
  IncludeManagementEvents?: boolean;
  DataResources?: Array<{ Type: string; Values: string[] }>;
  ExcludeManagementEventSources?: string[];
}

export interface AdvancedEventSelector {
  Name?: string;
  FieldSelectors: Array<{ Field: string; Equals?: string[]; StartsWith?: string[]; EndsWith?: string[]; NotEquals?: string[]; NotStartsWith?: string[]; NotEndsWith?: string[] }>;
}

export interface EventSelectorsResult {
  trailName: string;
  eventSelectors: EventSelector[];
  advancedEventSelectors: AdvancedEventSelector[];
}

export function useEventSelectors(trailName: string | null) {
  return useQuery<EventSelectorsResult>({
    queryKey: ["aws", "cloudtrail", "event-selectors", trailName],
    queryFn: () => api(`/aws/cloudtrail/trails/${encodeURIComponent(trailName!)}/event-selectors`),
    enabled: !!trailName,
  });
}

export function usePutEventSelectors(trailName: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      eventSelectors?: EventSelector[];
      advancedEventSelectors?: AdvancedEventSelector[];
    }) =>
      api(`/aws/cloudtrail/trails/${encodeURIComponent(trailName)}/event-selectors`, {
        method: "PUT",
        body: JSON.stringify(params),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "cloudtrail", "event-selectors", trailName] }),
  });
}
