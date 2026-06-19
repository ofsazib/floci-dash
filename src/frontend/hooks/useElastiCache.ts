import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

// ─── Replication Groups ────────────────────────────────────

export function useElastiCacheReplicationGroups() {
  return useQuery({
    queryKey: ["aws", "elasticache", "replication-groups"],
    queryFn: () => api<{ replicationGroups: any[]; total: number }>("/aws/elasticache/replication-groups"),
  });
}

export function useElastiCacheCreateReplicationGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/elasticache/replication-groups", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "elasticache", "replication-groups"] }),
  });
}

export function useElastiCacheDeleteReplicationGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/elasticache/replication-groups/delete", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "elasticache", "replication-groups"] }),
  });
}

// ─── Cache Clusters ──────────────────────────────────────

export function useElastiCacheCacheClusters() {
  return useQuery({
    queryKey: ["aws", "elasticache", "cache-clusters"],
    queryFn: () => api<{ cacheClusters: any[]; total: number }>("/aws/elasticache/cache-clusters"),
  });
}

export function useElastiCacheCreateCacheCluster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/elasticache/cache-clusters", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "elasticache", "cache-clusters"] }),
  });
}

export function useElastiCacheDeleteCacheCluster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/elasticache/cache-clusters/delete", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "elasticache", "cache-clusters"] }),
  });
}

// ─── Users ────────────────────────────────────────────────

export function useElastiCacheUsers() {
  return useQuery({
    queryKey: ["aws", "elasticache", "users"],
    queryFn: () => api<{ users: any[]; total: number }>("/aws/elasticache/users"),
  });
}

export function useElastiCacheCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/elasticache/users", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "elasticache", "users"] }),
  });
}

export function useElastiCacheDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/elasticache/users/delete", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "elasticache", "users"] }),
  });
}
