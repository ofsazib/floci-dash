import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export function useDocDBClusters() {
  return useQuery({
    queryKey: ["aws", "docdb", "clusters"],
    queryFn: () => api<{ clusters: any[] }>("/aws/docdb/clusters"),
  });
}

export function useCreateDocDBCluster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/docdb/clusters", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "docdb", "clusters"] }),
  });
}

export function useDeleteDocDBCluster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/aws/docdb/clusters/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "docdb", "clusters"] }),
  });
}

export function useModifyDocDBCluster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: any) =>
      api(`/aws/docdb/clusters/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "docdb", "clusters"] }),
  });
}

export function useDocDBInstances(clusterId?: string | null) {
  return useQuery({
    queryKey: ["aws", "docdb", "instances", clusterId],
    queryFn: () => api<{ instances: any[] }>("/aws/docdb/instances"),
    enabled: true,
  });
}

export function useCreateDocDBInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/docdb/instances", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "docdb", "instances"] }),
  });
}

export function useDeleteDocDBInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/aws/docdb/instances/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "docdb", "instances"] }),
  });
}
