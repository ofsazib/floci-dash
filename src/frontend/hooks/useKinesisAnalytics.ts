import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface KinesisAnalyticsApplication {
  ApplicationName: string;
  ApplicationARN?: string;
  ApplicationStatus?: string;
  ApplicationVersionId?: number;
  RuntimeEnvironment?: string;
  ApplicationMode?: string;
}

export function useKinesisAnalyticsApplications() {
  return useQuery<{ applications: KinesisAnalyticsApplication[]; total: number }>({
    queryKey: ["aws", "kinesisanalytics", "applications"],
    queryFn: () => api("/aws/kinesisanalytics/applications"),
  });
}

export function useKinesisAnalyticsApplication(name: string | null) {
  return useQuery<any>({
    queryKey: ["aws", "kinesisanalytics", "applications", name],
    queryFn: () => api(`/aws/kinesisanalytics/applications/${encodeURIComponent(name!)}`),
    enabled: !!name,
  });
}

export function useCreateKinesisAnalyticsApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      name: string;
      runtimeEnvironment: string;
      serviceExecutionRole: string;
      description?: string;
      codeBucket?: string;
      codeKey?: string;
      parallelism?: number;
    }) => api("/aws/kinesisanalytics/applications", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "kinesisanalytics", "applications"] }),
  });
}

export function useUpdateKinesisAnalyticsApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { name: string; parallelism?: number }) =>
      api(`/aws/kinesisanalytics/applications/${encodeURIComponent(params.name)}`, {
        method: "PUT",
        body: JSON.stringify({ parallelism: params.parallelism }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "kinesisanalytics", "applications"] }),
  });
}

export function useDeleteKinesisAnalyticsApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { name: string; createTimestamp: number }) =>
      api(
        `/aws/kinesisanalytics/applications/${encodeURIComponent(params.name)}?createTimestamp=${params.createTimestamp}`,
        { method: "DELETE" }
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "kinesisanalytics", "applications"] }),
  });
}

export function useStartKinesisAnalyticsApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/kinesisanalytics/applications/${encodeURIComponent(name)}/start`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "kinesisanalytics", "applications"] }),
  });
}

export function useStopKinesisAnalyticsApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/kinesisanalytics/applications/${encodeURIComponent(name)}/stop`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "kinesisanalytics", "applications"] }),
  });
}

// ── Snapshots ──────────────────────────────────────────

export function useKinesisAnalyticsSnapshots(applicationName: string | null) {
  return useQuery<any>({
    queryKey: ["aws", "kinesisanalytics", "applications", applicationName, "snapshots"],
    queryFn: () =>
      api(`/aws/kinesisanalytics/applications/${encodeURIComponent(applicationName!)}/snapshots`),
    enabled: !!applicationName,
  });
}

export function useCreateKinesisAnalyticsSnapshot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { applicationName: string; snapshotName: string }) =>
      api(`/aws/kinesisanalytics/applications/${encodeURIComponent(params.applicationName)}/snapshots`, {
        method: "POST",
        body: JSON.stringify({ snapshotName: params.snapshotName }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "kinesisanalytics", "applications"] }),
  });
}

export function useDeleteKinesisAnalyticsSnapshot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      applicationName: string;
      snapshotName: string;
      snapshotCreationTimestamp?: number;
    }) => {
      const q = params.snapshotCreationTimestamp
        ? `?snapshotCreationTimestamp=${params.snapshotCreationTimestamp}`
        : "";
      return api(
        `/aws/kinesisanalytics/applications/${encodeURIComponent(params.applicationName)}/snapshots/${encodeURIComponent(params.snapshotName)}${q}`,
        { method: "DELETE" }
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "kinesisanalytics", "applications"] }),
  });
}

// ── Tags ───────────────────────────────────────────────

export function useKinesisAnalyticsTags(arn: string | null) {
  return useQuery<{ tags: { key: string; value: string }[] }>({
    queryKey: ["aws", "kinesisanalytics", "tags", arn],
    queryFn: () =>
      api(`/aws/kinesisanalytics/applications/any/tags?arn=${encodeURIComponent(arn!)}`),
    enabled: !!arn,
  });
}

export function useAddKinesisAnalyticsTags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { arn: string; tags: Record<string, string> }) =>
      api(`/aws/kinesisanalytics/applications/any/tags?arn=${encodeURIComponent(params.arn)}`, {
        method: "POST",
        body: JSON.stringify({ tags: params.tags }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "kinesisanalytics", "tags"] }),
  });
}

export function useRemoveKinesisAnalyticsTags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { arn: string; tagKeys: string[] }) =>
      api(`/aws/kinesisanalytics/applications/any/tags?arn=${encodeURIComponent(params.arn)}`, {
        method: "DELETE",
        body: JSON.stringify({ tagKeys: params.tagKeys }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "kinesisanalytics", "tags"] }),
  });
}
