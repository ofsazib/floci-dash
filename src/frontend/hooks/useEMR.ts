import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export function useEMRClusters() {
  return useQuery({
    queryKey: ["aws", "emr", "clusters"],
    queryFn: () => api<{ clusters: any[] }>("/aws/emr/clusters"),
  });
}

export function useRunEMRJobFlow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/emr/clusters", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "emr", "clusters"] }),
  });
}

export function useEMRCluster(id: string | null) {
  return useQuery({
    queryKey: ["aws", "emr", "clusters", id],
    queryFn: () => api<any>(`/aws/emr/clusters/${id}`),
    enabled: !!id,
  });
}

export function useTerminateEMRJobFlows() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/aws/emr/clusters/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "emr", "clusters"] }),
  });
}

export function useEMRSteps(clusterId: string | null) {
  return useQuery({
    queryKey: ["aws", "emr", "clusters", clusterId, "steps"],
    queryFn: () => api<{ steps: any[] }>(`/aws/emr/clusters/${clusterId}/steps`),
    enabled: !!clusterId,
  });
}

export function useAddEMRSteps() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ clusterId, Steps }: { clusterId: string; Steps: any[] }) =>
      api(`/aws/emr/clusters/${clusterId}/steps`, { method: "POST", body: JSON.stringify({ Steps }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aws", "emr", "clusters"] });
    },
  });
}

export function useEMRSecurityConfigurations() {
  return useQuery({
    queryKey: ["aws", "emr", "security-configurations"],
    queryFn: () => api<{ securityConfigurations: any[] }>("/aws/emr/security-configurations"),
  });
}

export function useCreateEMRSecurityConfiguration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/emr/security-configurations", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "emr", "security-configurations"] }),
  });
}

export function useDeleteEMRSecurityConfiguration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/emr/security-configurations/${name}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "emr", "security-configurations"] }),
  });
}
