import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

const CE_KEY = ["aws", "ce"];

export function useCostAndUsage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/ce/cost-and-usage", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: CE_KEY }),
  });
}

export function useDimensionValues() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/ce/dimension-values", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: CE_KEY }),
  });
}

export function useCETags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/ce/tags", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: CE_KEY }),
  });
}

export function useReservationCoverage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/ce/reservation-coverage", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: CE_KEY }),
  });
}

export function useReservationUtilization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/ce/reservation-utilization", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: CE_KEY }),
  });
}

export function useSavingsPlansCoverage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/ce/savings-plans-coverage", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: CE_KEY }),
  });
}

export function useSavingsPlansUtilization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/ce/savings-plans-utilization", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: CE_KEY }),
  });
}

export function useCostCategories() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/ce/cost-categories", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: CE_KEY }),
  });
}

export function useCostAndUsageWithResources() {
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/ce/cost-and-usage-with-resources", { method: "POST", body: JSON.stringify(body) }),
  });
}

import { useQuery } from "@tanstack/react-query";

// ─── Cost anomaly monitors ──────────────────────────────

export function useCEAnomalyMonitors() {
  return useQuery({
    queryKey: [...CE_KEY, "anomaly-monitors"],
    queryFn: () => api<{ anomalyMonitors: any[]; total: number }>("/aws/ce/anomaly-monitors"),
  });
}

export function useCreateCEAnomalyMonitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { monitorName: string; monitorType: string; monitorDimension?: string }) =>
      api("/aws/ce/anomaly-monitors", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...CE_KEY, "anomaly-monitors"] }),
  });
}

export function useUpdateCEAnomalyMonitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { arn: string; monitorState: string }) =>
      api(`/aws/ce/anomaly-monitors/${encodeURIComponent(body.arn)}`, {
        method: "PUT",
        body: JSON.stringify({ monitorState: body.monitorState }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...CE_KEY, "anomaly-monitors"] }),
  });
}

export function useDeleteCEAnomalyMonitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (arn: string) =>
      api(`/aws/ce/anomaly-monitors/${encodeURIComponent(arn)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...CE_KEY, "anomaly-monitors"] }),
  });
}

// ─── Cost anomaly subscriptions ─────────────────────────

export function useCEAnomalySubscriptions() {
  return useQuery({
    queryKey: [...CE_KEY, "anomaly-subscriptions"],
    queryFn: () => api<{ anomalySubscriptions: any[]; total: number }>(
      "/aws/ce/anomaly-subscriptions"
    ),
  });
}

export function useCreateCEAnomalySubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      subscriptionName: string;
      monitorArn: string;
      subscribers: any[];
      threshold?: number;
      frequency?: string;
    }) => api("/aws/ce/anomaly-subscriptions", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...CE_KEY, "anomaly-subscriptions"] }),
  });
}

export function useUpdateCEAnomalySubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { arn: string; subscribers: any[]; threshold?: number; frequency?: string }) =>
      api(`/aws/ce/anomaly-subscriptions/${encodeURIComponent(body.arn)}`, {
        method: "PUT",
        body: JSON.stringify({
          subscribers: body.subscribers,
          threshold: body.threshold,
          frequency: body.frequency,
        }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...CE_KEY, "anomaly-subscriptions"] }),
  });
}

export function useDeleteCEAnomalySubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (arn: string) =>
      api(`/aws/ce/anomaly-subscriptions/${encodeURIComponent(arn)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...CE_KEY, "anomaly-subscriptions"] }),
  });
}

// ─── Resource tags ──────────────────────────────────────

export function useCEResourceTags(resourceArn: string | null) {
  return useQuery({
    queryKey: [...CE_KEY, "resource-tags", resourceArn],
    queryFn: () =>
      api<{ tags: Record<string, string>; arn: string }>(
        `/aws/ce/resource-tags?resourceArn=${encodeURIComponent(resourceArn!)}`
      ),
    enabled: !!resourceArn,
  });
}

export function useCETagResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { resourceArn: string; tags: Record<string, string> }) =>
      api("/aws/ce/resource-tags", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: [...CE_KEY, "resource-tags", v.resourceArn] }),
  });
}

export function useCEUntagResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { resourceArn: string; tagKeys: string[] }) =>
      api("/aws/ce/resource-tags/untag", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: [...CE_KEY, "resource-tags", v.resourceArn] }),
  });
}
