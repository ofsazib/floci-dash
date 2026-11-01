import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export function useAMPWorkspaces() {
  return useQuery({
    queryKey: ["aws", "amp", "workspaces"],
    queryFn: () => api<{ workspaces: any[]; total: number }>("/aws/amp/workspaces"),
  });
}

export function useAMPWorkspace(workspaceId: string | null) {
  return useQuery({
    queryKey: ["aws", "amp", "workspaces", workspaceId],
    queryFn: () =>
      api<{ workspace: any }>(`/aws/amp/workspaces/${encodeURIComponent(workspaceId!)}`),
    enabled: !!workspaceId,
  });
}

export function useCreateAMPWorkspace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { alias: string; tags?: Record<string, string>; kmsKeyArn?: string }) =>
      api("/aws/amp/workspaces", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "amp", "workspaces"] }),
  });
}

export function useDeleteAMPWorkspace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (workspaceId: string) =>
      api(`/aws/amp/workspaces/${encodeURIComponent(workspaceId)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "amp", "workspaces"] }),
  });
}

export function useUpdateAMPWorkspaceAlias() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ workspaceId, alias }: { workspaceId: string; alias: string }) =>
      api(`/aws/amp/workspaces/${encodeURIComponent(workspaceId)}/alias`, {
        method: "PUT",
        body: JSON.stringify({ alias }),
      }),
    onSuccess: (_data, variables) =>
      Promise.all([
        qc.invalidateQueries({ queryKey: ["aws", "amp", "workspaces"] }),
        qc.invalidateQueries({
          queryKey: ["aws", "amp", "workspaces", variables.workspaceId],
        }),
      ]),
  });
}

export function useAMPTags(resourceArn: string | null) {
  return useQuery({
    queryKey: ["aws", "amp", "tags", resourceArn],
    queryFn: () =>
      api<{ tags: Record<string, string> }>(
        `/aws/amp/tags?resourceArn=${encodeURIComponent(resourceArn!)}`
      ),
    enabled: !!resourceArn,
  });
}

export function useAMPTagResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { resourceArn: string; tags: Record<string, string> }) =>
      api("/aws/amp/tags", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ["aws", "amp", "tags", variables.resourceArn] }),
  });
}

export function useAMPUntagResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { resourceArn: string; tagKeys: string[] }) =>
      api("/aws/amp/tags/untag", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ["aws", "amp", "tags", variables.resourceArn] }),
  });
}

// ─── Rule Groups Namespaces ─────────────────────────────

export function useAMPNamespaces(workspaceId: string | null) {
  return useQuery({
    queryKey: ["aws", "amp", "workspaces", workspaceId, "namespaces"],
    queryFn: () => api<{ namespaces: any[]; total: number }>(
      `/aws/amp/workspaces/${encodeURIComponent(workspaceId!)}/namespaces`
    ),
    enabled: !!workspaceId,
  });
}

export function useAMPNamespace(workspaceId: string | null, name: string | null) {
  return useQuery({
    queryKey: ["aws", "amp", "workspaces", workspaceId, "namespaces", name],
    queryFn: () => api<{ namespace: any }>(
      `/aws/amp/workspaces/${encodeURIComponent(workspaceId!)}/namespaces/${encodeURIComponent(name!)}`
    ),
    enabled: !!workspaceId && !!name,
  });
}

export function useCreateAMPNamespace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { workspaceId: string; name: string; data: string }) =>
      api(`/aws/amp/workspaces/${encodeURIComponent(body.workspaceId)}/namespaces`, {
        method: "POST",
        body: JSON.stringify({ name: body.name, data: body.data }),
      }),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ["aws", "amp", "workspaces", v.workspaceId, "namespaces"] }),
  });
}

export function useUpdateAMPNamespace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { workspaceId: string; name: string; data: string }) =>
      api(
        `/aws/amp/workspaces/${encodeURIComponent(body.workspaceId)}/namespaces/${encodeURIComponent(body.name)}`,
        { method: "PUT", body: JSON.stringify({ data: body.data }) }
      ),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ["aws", "amp", "workspaces", v.workspaceId, "namespaces"] }),
  });
}

export function useDeleteAMPNamespace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { workspaceId: string; name: string }) =>
      api(
        `/aws/amp/workspaces/${encodeURIComponent(body.workspaceId)}/namespaces/${encodeURIComponent(body.name)}`,
        { method: "DELETE" }
      ),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ["aws", "amp", "workspaces", v.workspaceId, "namespaces"] }),
  });
}
