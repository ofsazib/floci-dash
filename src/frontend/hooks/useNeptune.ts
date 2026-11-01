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

export function useModifyNeptuneCluster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; engineVersion?: string; iamDatabaseAuthenticationEnabled?: boolean }) =>
      api(`/aws/neptune/clusters/${encodeURIComponent(params.id)}`, {
        method: "PATCH",
        body: JSON.stringify({
          engineVersion: params.engineVersion,
          iamDatabaseAuthenticationEnabled: params.iamDatabaseAuthenticationEnabled,
        }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "neptune"] }),
  });
}

export function useModifyNeptuneInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; instanceClass?: string }) =>
      api(`/aws/neptune/instances/${encodeURIComponent(params.id)}`, {
        method: "PATCH",
        body: JSON.stringify({ instanceClass: params.instanceClass }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "neptune"] }),
  });
}

// ── Cluster roles, global clusters, resource tags (E.9 batch 2) ──

export function useAddNeptuneClusterRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; roleArn: string }) =>
      api(`/aws/neptune/clusters/${encodeURIComponent(params.id)}/roles`, {
        method: "POST",
        body: JSON.stringify({ roleArn: params.roleArn }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "neptune", "clusters"] }),
  });
}

export function useRemoveNeptuneClusterRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; roleArn: string }) =>
      api(`/aws/neptune/clusters/${encodeURIComponent(params.id)}/roles`, {
        method: "DELETE",
        body: JSON.stringify({ roleArn: params.roleArn }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "neptune", "clusters"] }),
  });
}

export function useNeptuneGlobalClusters() {
  return useQuery<{ globalClusters: any[]; total: number }>({
    queryKey: ["aws", "neptune", "global-clusters"],
    queryFn: () => api("/aws/neptune/global-clusters"),
  });
}

export function useNeptuneResourceTags(resourceName: string | null) {
  return useQuery<{ resourceName: string; tags: Array<{ Key: string; Value: string }>; total: number }>({
    queryKey: ["aws", "neptune", "resource-tags", resourceName],
    queryFn: () => api(`/aws/neptune/resource-tags?resourceName=${encodeURIComponent(resourceName!)}`),
    enabled: !!resourceName,
  });
}

export function useAddNeptuneResourceTags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { resourceName: string; tags: Record<string, string> }) =>
      api("/aws/neptune/resource-tags", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: (_d, variables) =>
      qc.invalidateQueries({ queryKey: ["aws", "neptune", "resource-tags", variables.resourceName] }),
  });
}

export function useRemoveNeptuneResourceTags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { resourceName: string; tagKeys: string[] }) =>
      api("/aws/neptune/resource-tags", { method: "DELETE", body: JSON.stringify(data) }),
    onSuccess: (_d, variables) =>
      qc.invalidateQueries({ queryKey: ["aws", "neptune", "resource-tags", variables.resourceName] }),
  });
}
