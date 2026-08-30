import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

// ── Agent Runtimes ────────────────────────────────────────

export function useAgentRuntimes() {
  return useQuery<{ agentRuntimes: any[]; nextToken?: string }>({
    queryKey: ["aws", "bedrockagentcorecontrol", "runtimes"],
    queryFn: () => api("/aws/bedrockagentcorecontrol/runtimes", { method: "POST" }),
    refetchInterval: 10000,
  });
}

export function useAgentRuntime(id: string | null) {
  return useQuery<any>({
    queryKey: ["aws", "bedrockagentcorecontrol", "runtimes", id],
    queryFn: () => api(`/aws/bedrockagentcorecontrol/runtimes/${encodeURIComponent(id!)}`),
    enabled: !!id,
  });
}

export function useCreateAgentRuntime() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/bedrockagentcorecontrol/runtimes", {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "bedrockagentcorecontrol", "runtimes"] }),
  });
}

export function useUpdateAgentRuntime() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; body: any }) =>
      api(`/aws/bedrockagentcorecontrol/runtimes/${encodeURIComponent(params.id)}`, {
        method: "PUT",
        body: JSON.stringify(params.body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "bedrockagentcorecontrol", "runtimes"] }),
  });
}

export function useDeleteAgentRuntime() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/aws/bedrockagentcorecontrol/runtimes/${encodeURIComponent(id)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "bedrockagentcorecontrol", "runtimes"] }),
  });
}

// ── Runtime Versions ──────────────────────────────────────

export function useAgentRuntimeVersions(id: string | null) {
  return useQuery<{ agentRuntimes: any[]; nextToken?: string }>({
    queryKey: ["aws", "bedrockagentcorecontrol", "versions", id],
    queryFn: () => api(`/aws/bedrockagentcorecontrol/runtimes/${encodeURIComponent(id!)}/versions`, { method: "POST" }),
    enabled: !!id,
  });
}

// ── Endpoints ─────────────────────────────────────────────

export function useAgentRuntimeEndpoints(id: string | null) {
  return useQuery<{ runtimeEndpoints: any[]; nextToken?: string }>({
    queryKey: ["aws", "bedrockagentcorecontrol", "endpoints", id],
    queryFn: () => api(`/aws/bedrockagentcorecontrol/runtimes/${encodeURIComponent(id!)}/endpoints`, { method: "POST" }),
    enabled: !!id,
  });
}

export function useAgentRuntimeEndpoint(runtimeId: string | null, endpointName: string | null) {
  return useQuery<any>({
    queryKey: ["aws", "bedrockagentcorecontrol", "endpoints", runtimeId, endpointName],
    queryFn: () =>
      api(`/aws/bedrockagentcorecontrol/runtimes/${encodeURIComponent(runtimeId!)}/endpoints/${encodeURIComponent(endpointName!)}`),
    enabled: !!runtimeId && !!endpointName,
  });
}

export function useCreateAgentRuntimeEndpoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { runtimeId: string; body: any }) =>
      api(`/aws/bedrockagentcorecontrol/runtimes/${encodeURIComponent(params.runtimeId)}/endpoints`, {
        method: "PUT",
        body: JSON.stringify(params.body),
      }),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["aws", "bedrockagentcorecontrol", "endpoints", v.runtimeId] }),
  });
}

export function useUpdateAgentRuntimeEndpoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { runtimeId: string; name: string; body: any }) =>
      api(`/aws/bedrockagentcorecontrol/runtimes/${encodeURIComponent(params.runtimeId)}/endpoints/${encodeURIComponent(params.name)}`, {
        method: "PUT",
        body: JSON.stringify(params.body),
      }),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["aws", "bedrockagentcorecontrol", "endpoints", v.runtimeId] }),
  });
}

export function useDeleteAgentRuntimeEndpoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { runtimeId: string; name: string }) =>
      api(`/aws/bedrockagentcorecontrol/runtimes/${encodeURIComponent(params.runtimeId)}/endpoints/${encodeURIComponent(params.name)}`, {
        method: "DELETE",
      }),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["aws", "bedrockagentcorecontrol", "endpoints", v.runtimeId] }),
  });
}
