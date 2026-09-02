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
