import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface NeptuneCluster {
  DBClusterIdentifier: string;
  Status: string;
  Engine: string;
  EngineVersion?: string;
  Endpoint?: string;
  ReaderEndpoint?: string;
  Port?: number;
  IAMDatabaseAuthenticationEnabled?: boolean;
  DBClusterArn?: string;
  DbClusterResourceId?: string;
  DBClusterMembers?: { DBInstanceIdentifier: string; IsClusterWriter: boolean }[];
  AllocatedStorage?: number;
  CreatedTime?: string;
}

export interface NeptuneInstance {
  DBInstanceIdentifier: string;
  DBClusterIdentifier?: string;
  DBInstanceClass?: string;
  Engine: string;
  EngineVersion?: string;
  DBInstanceStatus?: string;
  Endpoint?: { Address: string; Port: number };
  DBInstanceArn?: string;
  CreatedTime?: string;
}

// ── Clusters ─────────────────────────────────────────────

export function useNeptuneClusters() {
  return useQuery<{ clusters: NeptuneCluster[]; total: number }>({
    queryKey: ["aws", "neptune", "clusters"],
    queryFn: () => api("/aws/neptune/clusters"),
    refetchInterval: 10000,
  });
}

export function useNeptuneCluster(id: string | null) {
  return useQuery<{ cluster: NeptuneCluster }>({
    queryKey: ["aws", "neptune", "cluster", id],
    queryFn: () => api(`/aws/neptune/clusters/${encodeURIComponent(id!)}`),
    enabled: !!id,
  });
}

export function useCreateNeptuneCluster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      dbClusterIdentifier: string;
      engineVersion?: string;
      enableIAMDatabaseAuthentication?: boolean;
    }) =>
      api("/aws/neptune/clusters", { method: "POST", body: JSON.stringify(params) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "neptune", "clusters"] }),
  });
}

export function useDeleteNeptuneCluster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/aws/neptune/clusters/${encodeURIComponent(id)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "neptune", "clusters"] }),
  });
}

// ── Instances ────────────────────────────────────────────

export function useNeptuneInstances() {
  return useQuery<{ instances: NeptuneInstance[]; total: number }>({
    queryKey: ["aws", "neptune", "instances"],
    queryFn: () => api("/aws/neptune/instances"),
    refetchInterval: 10000,
  });
}

export function useCreateNeptuneInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      dbInstanceIdentifier: string;
      dbClusterIdentifier: string;
      dbInstanceClass?: string;
    }) =>
      api("/aws/neptune/instances", { method: "POST", body: JSON.stringify(params) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "neptune", "instances"] }),
  });
}

export function useDeleteNeptuneInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/aws/neptune/instances/${encodeURIComponent(id)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "neptune", "instances"] }),
  });
}
