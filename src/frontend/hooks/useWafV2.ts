import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

// ─── Web ACLs ───────────────────────────────────────────

export function useWebACLs(scope: string = "REGIONAL") {
  return useQuery({
    queryKey: ["aws", "wafv2", "web-acls", scope],
    queryFn: () => api<{ webAcls: any[]; total: number }>(`/aws/wafv2/web-acls?scope=${scope}`),
  });
}

export function useCreateWebACL() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/wafv2/web-acls", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ["aws", "wafv2", "web-acls", (variables as any).Scope || "REGIONAL"] }),
  });
}

export function useWebACL(id: string | null, name: string | null, scope: string = "REGIONAL") {
  return useQuery({
    queryKey: ["aws", "wafv2", "web-acls", scope, id],
    queryFn: () =>
      api<any>(`/aws/wafv2/web-acls/${encodeURIComponent(id!)}?name=${encodeURIComponent(name!)}&scope=${scope}`),
    enabled: !!id && !!name,
  });
}

export function useDeleteWebACL() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { Id: string; Name: string; Scope: string; LockToken: string }) =>
      api("/aws/wafv2/web-acls/delete", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ["aws", "wafv2", "web-acls", variables.Scope] }),
  });
}

// ─── IP Sets ────────────────────────────────────────────

export function useIPSets(scope: string = "REGIONAL") {
  return useQuery({
    queryKey: ["aws", "wafv2", "ip-sets", scope],
    queryFn: () => api<{ ipSets: any[]; total: number }>(`/aws/wafv2/ip-sets?scope=${scope}`),
  });
}

export function useCreateIPSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/wafv2/ip-sets", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ["aws", "wafv2", "ip-sets", (variables as any).Scope || "REGIONAL"] }),
  });
}

export function useDeleteIPSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { Id: string; Name: string; Scope: string; LockToken: string }) =>
      api("/aws/wafv2/ip-sets/delete", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ["aws", "wafv2", "ip-sets", variables.Scope] }),
  });
}

// ─── Regex Pattern Sets ─────────────────────────────────

export function useRegexPatternSets(scope: string = "REGIONAL") {
  return useQuery({
    queryKey: ["aws", "wafv2", "regex-pattern-sets", scope],
    queryFn: () => api<{ regexPatternSets: any[]; total: number }>(`/aws/wafv2/regex-pattern-sets?scope=${scope}`),
  });
}

export function useCreateRegexPatternSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/wafv2/regex-pattern-sets", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ["aws", "wafv2", "regex-pattern-sets", (variables as any).Scope || "REGIONAL"] }),
  });
}

export function useDeleteRegexPatternSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { Id: string; Name: string; Scope: string; LockToken: string }) =>
      api("/aws/wafv2/regex-pattern-sets/delete", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ["aws", "wafv2", "regex-pattern-sets", variables.Scope] }),
  });
}

// ─── Rule Groups ────────────────────────────────────────

export function useRuleGroups(scope: string = "REGIONAL") {
  return useQuery({
    queryKey: ["aws", "wafv2", "rule-groups", scope],
    queryFn: () => api<{ ruleGroups: any[]; total: number }>(`/aws/wafv2/rule-groups?scope=${scope}`),
  });
}

export function useCreateRuleGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/wafv2/rule-groups", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ["aws", "wafv2", "rule-groups", (variables as any).Scope || "REGIONAL"] }),
  });
}

export function useDeleteRuleGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { Id: string; Name: string; Scope: string; LockToken: string }) =>
      api("/aws/wafv2/rule-groups/delete", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ["aws", "wafv2", "rule-groups", variables.Scope] }),
  });
}

// ─── Tags ───────────────────────────────────────────────

export function useWafTags(resourceArn: string | null) {
  return useQuery({
    queryKey: ["aws", "wafv2", "tags", resourceArn],
    queryFn: () => api<{ tagList: any[] }>(`/aws/wafv2/tags?resourceArn=${encodeURIComponent(resourceArn!)}`),
    enabled: !!resourceArn,
  });
}

export function useTagWafResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { resourceArn: string; tags: any[] }) =>
      api("/aws/wafv2/tags", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "wafv2", "tags"] }),
  });
}

export function useUntagWafResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { resourceArn: string; tagKeys: string[] }) =>
      api("/aws/wafv2/tags/untag", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "wafv2", "tags"] }),
  });
}
