import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

// ─── METRICS ─────────────────────────────────────────────

export function useCloudWatchMetrics(namespace?: string) {
  return useQuery({
    queryKey: ["aws", "cloudwatch", "metrics", namespace],
    queryFn: () =>
      api<{ metrics: any[]; namespaces: string[]; total: number }>(
        `/aws/cloudwatch/metrics${namespace ? `?namespace=${namespace}` : ""}`
      ),
  });
}

export function usePutMetricData() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/cloudwatch/metrics/data", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "cloudwatch"] }),
  });
}

export function useMetricStatistics(params: {
  namespace: string;
  metricName: string;
  period?: number;
  statistics?: string;
  startTime?: string;
  endTime?: string;
  dimensions?: any[];
}) {
  const qs = new URLSearchParams({
    namespace: params.namespace,
    metricName: params.metricName,
    period: String(params.period || 60),
    statistics: params.statistics || "Average",
    startTime: params.startTime || new Date(Date.now() - 3600000).toISOString(),
    endTime: params.endTime || new Date().toISOString(),
  });
  if (params.dimensions?.length) {
    qs.set("dimensions", JSON.stringify(params.dimensions));
  }
  return useQuery({
    queryKey: ["aws", "cloudwatch", "statistics", qs.toString()],
    queryFn: () => api<{ label: string; datapoints: any[] }>(`/aws/cloudwatch/metrics/statistics?${qs.toString()}`),
    enabled: !!params.namespace && !!params.metricName,
  });
}

// ─── ALARMS ──────────────────────────────────────────────

export function useCloudWatchAlarms(state?: string) {
  return useQuery({
    queryKey: ["aws", "cloudwatch", "alarms", state],
    queryFn: () =>
      api<{ alarms: any[]; total: number }>(
        `/aws/cloudwatch/alarms${state ? `?state=${state}` : ""}`
      ),
  });
}

export function useCreateAlarm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/cloudwatch/alarms", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "cloudwatch", "alarms"] }),
  });
}

export function useDeleteAlarm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api(`/aws/cloudwatch/alarms/${name}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "cloudwatch", "alarms"] }),
  });
}

export function useSetAlarmState() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, state, reason }: { name: string; state: string; reason: string }) =>
      api(`/aws/cloudwatch/alarms/${name}/state`, { method: "PUT", body: JSON.stringify({ state, reason }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "cloudwatch", "alarms"] }),
  });
}

// ─── TAGS ────────────────────────────────────────────────

export function useCloudWatchTags(arn: string | null) {
  return useQuery({
    queryKey: ["aws", "cloudwatch", "tags", arn],
    queryFn: () => api<{ tags: Record<string, string> }>(`/aws/cloudwatch/tags/${arn}`),
    enabled: !!arn,
  });
}

// ─── DASHBOARDS ──────────────────────────────────────────

export interface CloudWatchDashboardEntry {
  dashboardName: string;
  dashboardArn: string;
  lastModified?: number;
  size?: number;
}

export function useCloudWatchDashboards() {
  return useQuery<{ dashboards: CloudWatchDashboardEntry[]; total: number }>({
    queryKey: ["aws", "cloudwatch", "dashboards"],
    queryFn: () => api("/aws/cloudwatch/dashboards"),
  });
}

export function useCloudWatchDashboard(name: string | null) {
  return useQuery<{
    dashboardName: string;
    dashboardArn: string;
    dashboardBody: string;
  }>({
    queryKey: ["aws", "cloudwatch", "dashboards", name],
    queryFn: () => api(`/aws/cloudwatch/dashboards/${encodeURIComponent(name!)}`),
    enabled: !!name,
  });
}

export function usePutDashboard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { dashboardName: string; dashboardBody: string }) =>
      api("/aws/cloudwatch/dashboards/" + encodeURIComponent(data.dashboardName), {
        method: "PUT",
        body: JSON.stringify({ dashboardBody: data.dashboardBody }),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "cloudwatch", "dashboards"] }),
  });
}

export function useDeleteDashboard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/cloudwatch/dashboards/${encodeURIComponent(name)}`, { method: "DELETE" }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "cloudwatch", "dashboards"] }),
  });
}

// ─── METRIC STREAMS ──────────────────────────────────────

export interface MetricStream {
  arn: string;
  name: string;
  firehoseArn: string;
  state: string;
  outputFormat: string;
  creationDate?: number;
  lastUpdateDate?: number;
}

export function useMetricStreams() {
  return useQuery<{ metricStreams: MetricStream[]; total: number; nextToken?: string }>({
    queryKey: ["aws", "cloudwatch", "metric-streams"],
    queryFn: () => api("/aws/cloudwatch/metric-streams"),
  });
}

export function useMetricStream(name: string | null) {
  return useQuery<MetricStream & { roleArn?: string; includeFilters: Array<{ namespace: string; metricNames: string[] }>; excludeFilters: Array<{ namespace: string; metricNames: string[] }> }>({
    queryKey: ["aws", "cloudwatch", "metric-streams", name],
    queryFn: () => api(`/aws/cloudwatch/metric-streams/${encodeURIComponent(name!)}`),
    enabled: !!name,
  });
}

export function usePutMetricStream() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      firehoseArn: string;
      roleArn: string;
      outputFormat: string;
    }) =>
      api(`/aws/cloudwatch/metric-streams/${encodeURIComponent(data.name)}`, {
        method: "PUT",
        body: JSON.stringify({
          firehoseArn: data.firehoseArn,
          roleArn: data.roleArn,
          outputFormat: data.outputFormat,
        }),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "cloudwatch", "metric-streams"] }),
  });
}

export function useDeleteMetricStream() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/cloudwatch/metric-streams/${encodeURIComponent(name)}`, { method: "DELETE" }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "cloudwatch", "metric-streams"] }),
  });
}

export function useStartMetricStreams() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (names: string[]) =>
      api("/aws/cloudwatch/metric-streams/start", {
        method: "POST",
        body: JSON.stringify({ names }),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "cloudwatch", "metric-streams"] }),
  });
}

export function useStopMetricStreams() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (names: string[]) =>
      api("/aws/cloudwatch/metric-streams/stop", {
        method: "POST",
        body: JSON.stringify({ names }),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "cloudwatch", "metric-streams"] }),
  });
}
