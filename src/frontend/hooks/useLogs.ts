import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

// ─── Log Group Types ─────────────────────────────────

export interface LogGroup {
  logGroupName: string;
  creationTime?: number;
  retentionInDays?: number;
  metricFilterCount?: number;
  arn?: string;
  storedBytes?: number;
  kmsKeyId?: string;
}

export interface LogGroupListResponse {
  logGroups: LogGroup[];
  total: number;
}

// ─── Log Stream Types ─────────────────────────────────

export interface LogStream {
  logStreamName: string;
  creationTime?: number;
  firstEventTimestamp?: number;
  lastEventTimestamp?: number;
  lastIngestionTime?: number;
  uploadSequenceToken?: string;
  storedBytes?: number;
}

export interface LogStreamListResponse {
  logStreams: LogStream[];
  total: number;
}

// ─── Log Event Types ──────────────────────────────────

export interface LogEvent {
  eventId?: string;
  timestamp?: number;
  message: string;
  ingestionTime?: number;
  logStreamName?: string;
}

export interface LogEventsResponse {
  events: LogEvent[];
  nextForwardToken?: string;
  nextBackwardToken?: string;
}

export interface FilteredLogEventsResponse {
  events: LogEvent[];
  searchedLogStreams?: Array<{ logStreamName: string; searchedCompletely: boolean }>;
  nextToken?: string;
}

// ─── Subscription Filter Types ────────────────────────

export interface SubscriptionFilter {
  filterName: string;
  logGroupName: string;
  filterPattern?: string;
  destinationArn: string;
  distribution?: string;
  creationTime?: number;
  roleArn?: string;
}

export interface SubscriptionFilterListResponse {
  subscriptionFilters: SubscriptionFilter[];
  total: number;
}

// ─── Log Group Hooks ──────────────────────────────────

export function useLogGroups(prefix?: string) {
  return useQuery<LogGroupListResponse>({
    queryKey: ["aws", "logs", "log-groups", prefix],
    queryFn: () =>
      api(`/aws/logs/log-groups${prefix ? `?prefix=${encodeURIComponent(prefix)}` : ""}`),
    refetchInterval: 15000,
  });
}

export function useCreateLogGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      logGroupName: string;
      tags?: Record<string, string>;
      kmsKeyId?: string;
    }) =>
      api("/aws/logs/log-groups", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "logs", "log-groups"] }),
  });
}

export function useDeleteLogGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/logs/log-groups/${encodeURIComponent(name)}`, { method: "DELETE" }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "logs", "log-groups"] }),
  });
}

export function usePutRetentionPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { logGroupName: string; retentionInDays: number }) =>
      api(`/aws/logs/log-groups/${encodeURIComponent(data.logGroupName)}/retention`, {
        method: "PUT",
        body: JSON.stringify({ retentionInDays: data.retentionInDays }),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "logs", "log-groups"] }),
  });
}

export function useDeleteRetentionPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/logs/log-groups/${encodeURIComponent(name)}/retention`, { method: "DELETE" }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "logs", "log-groups"] }),
  });
}

// ─── Log Stream Hooks ─────────────────────────────────

export function useLogStreams(logGroupName: string | null, prefix?: string) {
  return useQuery<LogStreamListResponse>({
    queryKey: ["aws", "logs", "log-groups", logGroupName, "streams", prefix],
    queryFn: () =>
      api(
        `/aws/logs/log-groups/${encodeURIComponent(logGroupName!)}/streams${prefix ? `?prefix=${encodeURIComponent(prefix)}` : ""}`
      ),
    enabled: !!logGroupName,
    refetchInterval: 10000,
  });
}

export function useCreateLogStream() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { logGroupName: string; logStreamName: string }) =>
      api(`/aws/logs/log-groups/${encodeURIComponent(data.logGroupName)}/streams`, {
        method: "POST",
        body: JSON.stringify({ logStreamName: data.logStreamName }),
      }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({
        queryKey: ["aws", "logs", "log-groups", variables.logGroupName, "streams"],
      }),
  });
}

export function useDeleteLogStream() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { logGroupName: string; logStreamName: string }) =>
      api(
        `/aws/logs/log-groups/${encodeURIComponent(data.logGroupName)}/streams/${encodeURIComponent(data.logStreamName)}`,
        { method: "DELETE" }
      ),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({
        queryKey: ["aws", "logs", "log-groups", variables.logGroupName, "streams"],
      }),
  });
}

// ─── Log Event Hooks ──────────────────────────────────

export function useLogEvents(
  logGroupName: string | null,
  logStreamName: string | null,
  options?: {
    startTime?: number;
    endTime?: number;
    limit?: number;
    startFromHead?: boolean;
    nextToken?: string;
  },
  autoRefresh?: boolean
) {
  return useQuery<LogEventsResponse>({
    queryKey: [
      "aws",
      "logs",
      "log-groups",
      logGroupName,
      "streams",
      logStreamName,
      "events",
      options,
    ],
    queryFn: () => {
      const params = new URLSearchParams();
      if (options?.startTime) params.set("startTime", String(options.startTime));
      if (options?.endTime) params.set("endTime", String(options.endTime));
      if (options?.limit) params.set("limit", String(options.limit));
      if (options?.startFromHead !== undefined)
        params.set("startFromHead", String(options.startFromHead));
      if (options?.nextToken) params.set("nextToken", options.nextToken);
      const qs = params.toString();
      return api(
        `/aws/logs/log-groups/${encodeURIComponent(logGroupName!)}/streams/${encodeURIComponent(logStreamName!)}/events${qs ? `?${qs}` : ""}`
      );
    },
    enabled: !!logGroupName && !!logStreamName,
    refetchInterval: autoRefresh !== false ? 5000 : false,
  });
}

export function usePutLogEvents() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      logGroupName: string;
      logStreamName: string;
      logEvents: Array<{ timestamp: number; message: string }>;
      sequenceToken?: string;
    }) =>
      api(
        `/aws/logs/log-groups/${encodeURIComponent(data.logGroupName)}/streams/${encodeURIComponent(data.logStreamName)}/events`,
        {
          method: "POST",
          body: JSON.stringify({
            logEvents: data.logEvents,
            sequenceToken: data.sequenceToken,
          }),
        }
      ),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: ["aws", "logs", "log-groups", variables.logGroupName, "streams", variables.logStreamName, "events"],
      });
    },
  });
}

// ─── Filter Log Events ────────────────────────────────

export function useFilterLogEvents(logGroupName: string | null) {
  return useMutation({
    mutationFn: (data: {
      filterPattern?: string;
      startTime?: number;
      endTime?: number;
      limit?: number;
      logStreamNames?: string[];
    }) =>
      api(`/aws/logs/log-groups/${encodeURIComponent(logGroupName!)}/filter-events`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

// ─── Subscription Filter Hooks ────────────────────────

export function useSubscriptionFilters(logGroupName: string | null) {
  return useQuery<SubscriptionFilterListResponse>({
    queryKey: ["aws", "logs", "log-groups", logGroupName, "subscription-filters"],
    queryFn: () =>
      api(`/aws/logs/log-groups/${encodeURIComponent(logGroupName!)}/subscription-filters`),
    enabled: !!logGroupName,
  });
}

export function usePutSubscriptionFilter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      logGroupName: string;
      filterName: string;
      filterPattern?: string;
      destinationArn: string;
      distribution?: string;
      roleArn?: string;
    }) =>
      api(`/aws/logs/log-groups/${encodeURIComponent(data.logGroupName)}/subscription-filters`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({
        queryKey: ["aws", "logs", "log-groups", variables.logGroupName, "subscription-filters"],
      }),
  });
}

export function useDeleteSubscriptionFilter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { logGroupName: string; filterName: string }) =>
      api(
        `/aws/logs/log-groups/${encodeURIComponent(data.logGroupName)}/subscription-filters/${encodeURIComponent(data.filterName)}`,
        { method: "DELETE" }
      ),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({
        queryKey: ["aws", "logs", "log-groups", variables.logGroupName, "subscription-filters"],
      }),
  });
}

// ─── Tag Hooks ────────────────────────────────────────

export function useLogGroupTags(logGroupName: string | null) {
  return useQuery<{ tags: Record<string, string> }>({
    queryKey: ["aws", "logs", "log-groups", logGroupName, "tags"],
    queryFn: () =>
      api(`/aws/logs/log-groups/${encodeURIComponent(logGroupName!)}/tags`),
    enabled: !!logGroupName,
  });
}

export function useTagLogGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { logGroupName: string; tags: Record<string, string> }) =>
      api(`/aws/logs/log-groups/${encodeURIComponent(data.logGroupName)}/tags`, {
        method: "POST",
        body: JSON.stringify({ tags: data.tags }),
      }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({
        queryKey: ["aws", "logs", "log-groups", variables.logGroupName, "tags"],
      }),
  });
}

export function useUntagLogGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { logGroupName: string; tags: string[] }) =>
      api(`/aws/logs/log-groups/${encodeURIComponent(data.logGroupName)}/tags`, {
        method: "DELETE",
        body: JSON.stringify({ tags: data.tags }),
      }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({
        queryKey: ["aws", "logs", "log-groups", variables.logGroupName, "tags"],
      }),
  });
}
