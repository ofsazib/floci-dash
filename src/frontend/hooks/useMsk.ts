import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface MskCluster {
  clusterArn: string;
  clusterName: string;
  state?: string;
  creationTime?: number;
  currentVersion?: string;
  numberOfBrokerNodes?: number;
}

// ── Clusters ─────────────────────────────────────────────

export function useMskClusters() {
  return useQuery<{ clusters: MskCluster[]; total: number }>({
    queryKey: ["aws", "msk", "clusters"],
    queryFn: () => api("/aws/msk/clusters"),
    refetchInterval: 10000,
  });
}

export function useMskCluster(arn: string | null) {
  return useQuery<{ cluster: MskCluster }>({
    queryKey: ["aws", "msk", "cluster", arn],
    queryFn: () => api(`/aws/msk/clusters/${encodeURIComponent(arn!)}`),
    enabled: !!arn,
  });
}

export function useCreateMskCluster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { clusterName: string; kafkaVersion?: string; brokerNodeCount?: number }) =>
      api("/aws/msk/clusters", { method: "POST", body: JSON.stringify(params) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "msk", "clusters"] }),
  });
}

export function useDeleteMskCluster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (arn: string) =>
      api(`/aws/msk/clusters/${encodeURIComponent(arn)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "msk", "clusters"] }),
  });
}

// ── Bootstrap Brokers ────────────────────────────────────

export function useMskBootstrapBrokers(arn: string | null) {
  return useQuery<{ bootstrapBrokerString?: string; bootstrapBrokerStringTls?: string }>({
    queryKey: ["aws", "msk", "bootstrap-brokers", arn],
    queryFn: () => api(`/aws/msk/clusters/${encodeURIComponent(arn!)}/bootstrap-brokers`),
    enabled: !!arn,
  });
}
