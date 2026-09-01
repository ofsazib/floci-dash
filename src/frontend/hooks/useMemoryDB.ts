import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

// ─── Queries ─────────────────────────────────────────────

export function useMemoryDBClusters(name?: string) {
  return useQuery({
    queryKey: ["aws", "memorydb", "clusters", name],
    queryFn: () =>
      api<{ clusters: any[]; total: number }>(
        `/aws/memorydb/clusters${name ? `?name=${encodeURIComponent(name)}` : ""}`
      ),
  });
}

export function useMemoryDBCluster(name: string | null) {
  return useQuery({
    queryKey: ["aws", "memorydb", "cluster", name],
    queryFn: () => api<{ cluster: any }>(`/aws/memorydb/clusters/${encodeURIComponent(name!)}`),
    enabled: !!name,
  });
}

export function useMemoryDBTags(arn: string | null) {
  return useQuery({
    queryKey: ["aws", "memorydb", "tags", arn],
    queryFn: () => api<{ tags: Array<{ Key: string; Value: string }>; total: number }>(
      `/aws/memorydb/tags/${encodeURIComponent(arn!)}`
    ),
    enabled: !!arn,
  });
}

// ─── Mutations ───────────────────────────────────────────

export function useCreateMemoryDBCluster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/memorydb/clusters", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "memorydb"] }),
  });
}

export function useUpdateMemoryDBCluster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, description }: { name: string; description: string }) =>
      api(`/aws/memorydb/clusters/${encodeURIComponent(name)}`, {
        method: "PATCH",
        body: JSON.stringify({ description }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "memorydb"] }),
  });
}

export function useDeleteMemoryDBCluster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/memorydb/clusters/${encodeURIComponent(name)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "memorydb"] }),
  });
}

export function useTagMemoryDBResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ arn, tags }: { arn: string; tags: Array<{ Key: string; Value: string }> }) =>
      api(`/aws/memorydb/tags/${encodeURIComponent(arn)}`, {
        method: "POST",
        body: JSON.stringify({ tags }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "memorydb"] }),
  });
}

// ─── Users ──────────────────────────────────────────────

export function useMemoryDBUsers(userName?: string) {
  return useQuery({
    queryKey: ["aws", "memorydb", "users", userName],
    queryFn: () =>
      api<{ users: any[]; total: number }>(
        `/aws/memorydb/users${userName ? `?userName=${encodeURIComponent(userName)}` : ""}`
/* istanbul ignore next */
      ),
  });
}

export function useCreateMemoryDBUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/memorydb/users", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "memorydb"] }),
  });
}

export function useDeleteMemoryDBUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userName: string) =>
      api(`/aws/memorydb/users/${encodeURIComponent(userName)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "memorydb"] }),
  });
}

// ─── ACLs ────────────────────────────────────────────────

export function useMemoryDBACLs(aclName?: string) {
  return useQuery({
    queryKey: ["aws", "memorydb", "acls", aclName],
    queryFn: () =>
      api<{ acls: any[]; total: number }>(
        `/aws/memorydb/acls${aclName ? `?aclName=${encodeURIComponent(aclName)}` : ""}`
      ),
  });
}

export function useCreateMemoryDBACL() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/memorydb/acls", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "memorydb"] }),
  });
}

export function useDeleteMemoryDBACL() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (aclName: string) =>
      api(`/aws/memorydb/acls/${encodeURIComponent(aclName)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "memorydb"] }),
  });
}

export function useUntagMemoryDBResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ arn, tagKeys }: { arn: string; tagKeys: string[] }) =>
      api(`/aws/memorydb/tags/${encodeURIComponent(arn)}`, {
        method: "DELETE",
        body: JSON.stringify({ tagKeys }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "memorydb"] }),
  });
}
