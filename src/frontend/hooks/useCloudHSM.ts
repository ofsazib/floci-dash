import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface CloudHsmBackup {
  backupId: string | null;
  clusterId: string | null;
  state: string | null;
  createTimestamp: string;
  neverExpires: boolean;
}

export function useCloudHsmClusters() {
  return useQuery<{ clusters: any[]; total: number; nextToken: string | null }>({
    queryKey: ["aws", "cloudhsm", "clusters"],
    queryFn: () => api("/aws/cloudhsm/clusters"),
  });
}

export function useCloudHsmBackups() {
  return useQuery<{ backups: CloudHsmBackup[]; total: number; nextToken: string | null }>({
    queryKey: ["aws", "cloudhsm", "backups"],
    queryFn: () => api("/aws/cloudhsm/backups"),
  });
}

export function useCreateCloudHsmCluster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { hsmType: string; subnetIds: string[] }) =>
      api("/aws/cloudhsm/clusters", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "cloudhsm", "clusters"] }),
  });
}

export function useDeleteCloudHsmCluster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/aws/cloudhsm/clusters/${encodeURIComponent(id)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "cloudhsm", "clusters"] }),
  });
}

export function useDeleteCloudHsmBackup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/aws/cloudhsm/backups/${encodeURIComponent(id)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "cloudhsm", "backups"] }),
  });
}
