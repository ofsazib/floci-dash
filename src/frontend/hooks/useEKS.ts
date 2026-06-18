import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface EKSCluster {
  name: string;
  arn: string;
  createdAt: string;
  version: string | null;
  endpoint: string | null;
  roleArn: string;
  status: string;
  platformVersion: string | null;
  tags: Record<string, string>;
  resourcesVpcConfig: any;
  kubernetesNetworkConfig: any;
  certificateAuthority: any;
}

export interface EKSNodegroup {
  nodegroupName: string;
  nodegroupArn: string;
  clusterName: string;
  version: string | null;
  releaseVersion: string | null;
  createdAt: string;
  status: string;
  capacityType: string | null;
  scalingConfig: { minSize?: number; maxSize?: number; desiredSize?: number } | null;
  instanceTypes: string[];
  subnets: string[];
  nodeRole: string;
  diskSize: number | null;
  tags: Record<string, string>;
}

// ── Clusters ──────────────────────────────────────────────

export function useEKSClusters() {
  return useQuery<{ clusters: EKSCluster[]; total: number }>({
    queryKey: ["aws", "eks", "clusters"],
    queryFn: () => api("/aws/eks/clusters"),
    refetchInterval: 10000,
  });
}

export function useEKSCluster(name: string | null) {
  return useQuery<{ cluster: EKSCluster }>({
    queryKey: ["aws", "eks", "cluster", name],
    queryFn: () => api(`/aws/eks/clusters/${encodeURIComponent(name!)}`),
    enabled: !!name,
  });
}

export function useEKSCreateCluster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      name: string;
      version?: string;
      roleArn: string;
      resourcesVpcConfig?: { subnetIds?: string[]; securityGroupIds?: string[] };
      tags?: Record<string, string>;
    }) =>
      api("/aws/eks/clusters", {
        method: "POST",
        body: JSON.stringify(params),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "eks", "clusters"] }),
  });
}

export function useEKSDeleteCluster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/eks/clusters/${encodeURIComponent(name)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "eks", "clusters"] }),
  });
}

// ── Node Groups ───────────────────────────────────────────

export function useEKSNodegroups(clusterName: string | null) {
  return useQuery<{ nodegroups: EKSNodegroup[]; total: number }>({
    queryKey: ["aws", "eks", "nodegroups", clusterName],
    queryFn: () => api(`/aws/eks/clusters/${encodeURIComponent(clusterName!)}/node-groups`),
    enabled: !!clusterName,
    refetchInterval: 10000,
  });
}

export function useEKSNodegroup(clusterName: string | null, nodegroupName: string | null) {
  return useQuery<{ nodegroup: EKSNodegroup }>({
    queryKey: ["aws", "eks", "nodegroup", clusterName, nodegroupName],
    queryFn: () =>
      api(
        `/aws/eks/clusters/${encodeURIComponent(clusterName!)}/node-groups/${encodeURIComponent(nodegroupName!)}`
      ),
    enabled: !!clusterName && !!nodegroupName,
  });
}

export function useEKSCreateNodegroup(clusterName: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      nodegroupName: string;
      nodeRole: string;
      subnets: string[];
      instanceTypes?: string[];
      diskSize?: number;
      scalingConfig?: { minSize?: number; maxSize?: number; desiredSize?: number };
      tags?: Record<string, string>;
    }) =>
      api(`/aws/eks/clusters/${encodeURIComponent(clusterName)}/node-groups`, {
        method: "POST",
        body: JSON.stringify(params),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "eks", "nodegroups", clusterName] }),
  });
}

export function useEKSDeleteNodegroup(clusterName: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (nodegroupName: string) =>
      api(
        `/aws/eks/clusters/${encodeURIComponent(clusterName)}/node-groups/${encodeURIComponent(nodegroupName)}`,
        { method: "DELETE" }
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "eks", "nodegroups", clusterName] }),
  });
}
