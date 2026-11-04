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
  nextToken?: string;
}

export const LOGS_PAGE_SIZE = 10;

export function logsListQuery(opts: {
  prefix?: string;
  limit?: number;
  nextToken?: string;
  q?: string;
}): string {
  const qs = new URLSearchParams();
  if (opts.prefix) qs.set("prefix", opts.prefix);
  qs.set("limit", String(opts.limit ?? LOGS_PAGE_SIZE));
  if (opts.nextToken) qs.set("nextToken", opts.nextToken);
  if (opts.q) qs.set("q", opts.q);
  return `?${qs.toString()}`;
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
  nextToken?: string;
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

export function useLogGroups(
  prefix?: string,
  page?: { limit?: number; nextToken?: string; q?: string }
) {
  const limit = page?.limit ?? LOGS_PAGE_SIZE;
  const nextToken = page?.nextToken;
  const q = page?.q;
  return useQuery<LogGroupListResponse>({
    queryKey: ["aws", "logs", "log-groups", prefix, limit, nextToken, q],
    queryFn: () =>
      api(`/aws/logs/log-groups${logsListQuery({ prefix, limit, nextToken, q })}`),
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

export function useLogStreams(
  logGroupName: string | null,
  prefix?: string,
  page?: { limit?: number; nextToken?: string; q?: string }
) {
  const limit = page?.limit ?? LOGS_PAGE_SIZE;
  const nextToken = page?.nextToken;
  const q = page?.q;
  return useQuery<LogStreamListResponse>({
    queryKey: ["aws", "logs", "log-groups", logGroupName, "streams", prefix, limit, nextToken, q],
    queryFn: () =>
      api(
        `/aws/logs/log-groups/${encodeURIComponent(logGroupName!)}/streams${logsListQuery({ prefix, limit, nextToken, q })}`
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

/**
 * Search a single log stream with a CloudWatch filter pattern via FilterLogEvents.
 *
 * `startTimeOffsetMs` is a window size relative to "now" (e.g. 3_600_000 for the last
 * hour); the absolute `startTime` is recomputed on every fetch so the window tracks the
 * present time across auto-refresh ticks. Omit it to search all time. The query is only
 * enabled once a log group, stream, and non-empty filter pattern are all present.
 */
export function useFilteredLogEvents(
  logGroupName: string | null,
  logStreamName: string | null,
  options: {
    filterPattern?: string;
    startTimeOffsetMs?: number;
    limit?: number;
  },
  autoRefresh?: boolean
) {
  return useQuery<FilteredLogEventsResponse>({
    queryKey: [
      "aws",
      "logs",
      "log-groups",
      logGroupName,
      "streams",
      logStreamName,
      "filter-events",
      options,
    ],
    queryFn: () => {
      const body: {
        filterPattern?: string;
        logStreamNames: string[];
        startTime?: number;
        limit?: number;
      } = {
        filterPattern: options.filterPattern,
        logStreamNames: [logStreamName!],
      };
      if (options.startTimeOffsetMs) {
        body.startTime = Date.now() - options.startTimeOffsetMs;
      }
      if (options.limit) body.limit = options.limit;
      return api(
        `/aws/logs/log-groups/${encodeURIComponent(logGroupName!)}/filter-events`,
        {
          method: "POST",
          body: JSON.stringify(body),
        }
      );
    },
    enabled: !!logGroupName && !!logStreamName && !!options.filterPattern,
    refetchInterval: autoRefresh !== false ? 5000 : false,
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

export function useDataProtectionPolicy(logGroupName: string | null) {
  return useQuery<{
    logGroupIdentifier: string;
    policyDocument: string;
  }>({
    queryKey: ["aws", "logs", "data-protection", logGroupName],
    queryFn: () => api(`/aws/logs/log-groups/${encodeURIComponent(logGroupName!)}/data-protection`),
    enabled: !!logGroupName,
  });
}

// ─── KMS Key Association Hooks ────────────────────────

export function useAssociateKmsKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      logGroupName?: string;
      resourceIdentifier?: string;
      kmsKeyId: string;
    }) =>
      api("/aws/logs/log-groups/kms", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "logs", "log-groups"] }),
  });
}

export function useDisassociateKmsKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { logGroupName?: string; resourceIdentifier?: string }) =>
      api("/aws/logs/log-groups/kms/disassociate", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "logs", "log-groups"] }),
  });
}

// ─── Deletion Protection Hooks ────────────────────────

export function usePutLogGroupDeletionProtection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { logGroupIdentifier: string; deletionProtectionEnabled: boolean }) =>
      api(
        `/aws/logs/log-groups/${encodeURIComponent(data.logGroupIdentifier)}/deletion-protection`,
        {
          method: "PUT",
          body: JSON.stringify({ deletionProtectionEnabled: data.deletionProtectionEnabled }),
        }
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "logs", "log-groups"] }),
  });
}

// ─── Account Policy Hooks ─────────────────────────────

export interface AccountPolicy {
  accountId?: string;
  policyName: string;
  policyDocument: string;
  policyType: string;
  scope?: string;
  selectionCriteria?: string;
  lastUpdatedTime?: number;
}

export interface AccountPolicyListResponse {
  accountPolicies: AccountPolicy[];
  total: number;
}

export function useAccountPolicies(policyType?: string | null) {
  return useQuery<AccountPolicyListResponse>({
    queryKey: ["aws", "logs", "account-policies", policyType ?? null],
    queryFn: () =>
      api(`/aws/logs/account-policies${policyType ? `?policyType=${encodeURIComponent(policyType)}` : ""}`),
  });
}

export function usePutAccountPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      policyName: string;
      policyDocument: string;
      policyType: string;
      scope?: string;
      selectionCriteria?: string;
    }) =>
      api("/aws/logs/account-policies", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "logs", "account-policies"] }),
  });
}

// ─── Metric Filter Hooks ──────────────────────────────

export interface MetricTransformation {
  metricName: string;
  metricNamespace: string;
  metricValue: string;
  defaultValue?: number;
  dimensions?: Record<string, string>;
  unit?: string;
}

export interface MetricFilter {
  filterName: string;
  filterPattern?: string;
  logGroupName?: string;
  creationTime?: number;
  applyOnTransformedLogs?: boolean;
  metricTransformations: MetricTransformation[];
}

export interface MetricFilterListResponse {
  metricFilters: MetricFilter[];
  total: number;
  nextToken?: string;
}

export function useMetricFilters(logGroupName: string | null) {
  return useQuery<MetricFilterListResponse>({
    queryKey: ["aws", "logs", "log-groups", logGroupName, "metric-filters"],
    queryFn: () =>
      api(`/aws/logs/log-groups/${encodeURIComponent(logGroupName!)}/metric-filters`),
    enabled: !!logGroupName,
  });
}

export function usePutMetricFilter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      logGroupName: string;
      filterName: string;
      filterPattern?: string;
      metricTransformations: MetricTransformation[];
      applyOnTransformedLogs?: boolean;
    }) =>
      api(`/aws/logs/log-groups/${encodeURIComponent(data.logGroupName)}/metric-filters`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({
        queryKey: ["aws", "logs", "log-groups", variables.logGroupName, "metric-filters"],
      }),
  });
}

export function useDeleteMetricFilter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { logGroupName: string; filterName: string }) =>
      api(
        `/aws/logs/log-groups/${encodeURIComponent(data.logGroupName)}/metric-filters/${encodeURIComponent(data.filterName)}`,
        { method: "DELETE" }
      ),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({
        queryKey: ["aws", "logs", "log-groups", variables.logGroupName, "metric-filters"],
      }),
  });
}

export interface MetricFilterMatch {
  eventNumber: number;
  eventMessage: string;
  extractedValues: Record<string, string>;
}

export function useTestMetricFilter() {
  return useMutation({
    mutationFn: (data: { filterPattern: string; logEventMessages: string[] }) =>
      api<{ matches: MetricFilterMatch[]; total: number }>("/aws/logs/metric-filters/test", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

// ─── Destination Hooks ────────────────────────────────

export interface LogDestination {
  destinationName: string;
  targetArn: string;
  roleArn?: string;
  arn?: string;
  creationTime?: number;
  accessPolicy?: string;
}

export function usePutDestination() {
  return useMutation({
    mutationFn: (data: { destinationName: string; targetArn: string; roleArn?: string }) =>
      api<{ destination: LogDestination }>("/aws/logs/destinations", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

export function usePutDestinationPolicy() {
  return useMutation({
    mutationFn: (data: { destinationName: string; accessPolicy: string }) =>
      api(`/aws/logs/destinations/${encodeURIComponent(data.destinationName)}/policy`, {
        method: "POST",
        body: JSON.stringify({ accessPolicy: data.accessPolicy }),
      }),
  });
}

// ─── Resource Policy Hooks ────────────────────────────

export interface ResourcePolicy {
  policyName: string;
  policyDocument: string;
  lastUpdatedTime?: number;
}

export function useResourcePolicies() {
  return useQuery<{ resourcePolicies: ResourcePolicy[]; total: number }>({
    queryKey: ["aws", "logs", "resource-policies"],
    queryFn: () => api("/aws/logs/resource-policies"),
  });
}

export function usePutResourcePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { policyName: string; policyDocument: string }) =>
      api("/aws/logs/resource-policies", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "logs", "resource-policies"] }),
  });
}

// ─── Logs Insights Hooks ──────────────────────────────

export interface InsightQueryResultRow {
  field: string;
  value: string;
}

export interface InsightQueryResults {
  queryId: string;
  status: string;
  results: InsightQueryResultRow[][];
  statistics: {
    recordsMatched: number;
    recordsScanned: number;
    bytesScanned: number;
  };
}

export function useStartQuery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      logGroupName?: string;
      logGroupNames?: string[];
      logGroupIdentifiers?: string[];
      startTime: number;
      endTime: number;
      queryString: string;
      limit?: number;
    }) =>
      api<{ queryId: string }>("/aws/logs/queries", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "logs", "queries"] }),
  });
}

export function useStopQuery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (queryId: string) =>
      api(`/aws/logs/queries/${encodeURIComponent(queryId)}/stop`, { method: "POST" }),
    onSuccess: (_data, queryId) =>
      qc.invalidateQueries({ queryKey: ["aws", "logs", "query-results", queryId] }),
  });
}

export function useQueryResults(queryId: string | null) {
  return useQuery<InsightQueryResults>({
    queryKey: ["aws", "logs", "query-results", queryId],
    queryFn: () => api(`/aws/logs/queries/${encodeURIComponent(queryId!)}`),
    enabled: !!queryId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "Running" || status === undefined ? 2000 : false;
    },
  });
}
