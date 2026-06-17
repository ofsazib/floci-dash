import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

// ─── Parameters ──────────────────────────────────────────

export function useSSMParameters() {
  return useQuery({
    queryKey: ["aws", "ssm", "parameters"],
    queryFn: () =>
      api<{ parameters: any[]; total: number }>("/aws/ssm/parameters"),
    refetchInterval: 15000,
  });
}

export function useSSMParameter(name: string | null) {
  return useQuery({
    queryKey: ["aws", "ssm", "parameters", name],
    queryFn: () =>
      api<{ parameter: any }>(`/aws/ssm/parameters/${encodeURIComponent(name || "")}`),
    enabled: !!name,
  });
}

export function usePutSSMParameter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/ssm/parameters", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "ssm", "parameters"] }),
  });
}

export function useDeleteSSMParameter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/ssm/parameters/${encodeURIComponent(name)}`, { method: "DELETE" }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "ssm", "parameters"] }),
  });
}

// ─── Parameter History ───────────────────────────────────

export function useSSMParameterHistory(name: string | null) {
  return useQuery({
    queryKey: ["aws", "ssm", "parameters", name, "history"],
    queryFn: () =>
      api<{ history: any[]; total: number }>(
        `/aws/ssm/parameters/${encodeURIComponent(name || "")}/history`
      ),
    enabled: !!name,
  });
}

// ─── Tags ────────────────────────────────────────────────

export function useSSMTags(resourceId: string | null) {
  return useQuery({
    queryKey: ["aws", "ssm", "tags", resourceId],
    queryFn: () =>
      api<{ tags: any[] }>(`/aws/ssm/tags?resourceId=${encodeURIComponent(resourceId!)}`),
    enabled: !!resourceId,
  });
}

export function useAddSSMTags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/ssm/tags", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "ssm", "tags"] }),
  });
}

export function useRemoveSSMTags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ resourceId, tagKeys }: { resourceId: string; tagKeys: string[] }) =>
      api(
        `/aws/ssm/tags?resourceId=${encodeURIComponent(resourceId)}&tagKeys=${tagKeys.join(",")}`,
        { method: "DELETE" }
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "ssm", "tags"] }),
  });
}
