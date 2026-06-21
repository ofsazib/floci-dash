import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface ConfigRule {
  ConfigRuleName: string;
  ConfigRuleArn?: string;
  ConfigRuleId?: string;
  ConfigRuleState?: string;
  Source?: { Owner: string; SourceIdentifier: string };
}

export interface ConfigurationRecorder {
  name: string;
  roleARN: string;
  recordingGroup?: { allSupported?: boolean; includeGlobalResourceTypes?: boolean; resourceTypes?: string[] };
}

export interface ConformancePack {
  ConformancePackName: string;
  ConformancePackArn?: string;
  ConformancePackId?: string;
}

// ── Config Rules ─────────────────────────────────────────

export function useConfigRules() {
  return useQuery<{ rules: ConfigRule[]; total: number }>({
    queryKey: ["aws", "config", "rules"],
    queryFn: () => api("/aws/config/rules"),
    refetchInterval: 15000,
  });
}

export function usePutConfigRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { configRuleName: string; source?: { owner: string; sourceIdentifier: string } }) =>
      api("/aws/config/rules", { method: "POST", body: JSON.stringify(params) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "config", "rules"] }),
  });
}

export function useDeleteConfigRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/config/rules/${encodeURIComponent(name)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "config", "rules"] }),
  });
}

// ── Configuration Recorders ──────────────────────────────

export function useConfigRecorders() {
  return useQuery<{ recorders: ConfigurationRecorder[]; total: number }>({
    queryKey: ["aws", "config", "recorders"],
    queryFn: () => api("/aws/config/recorders"),
  });
}

export function useConfigRecorderStatuses() {
  return useQuery<{ statuses: any[]; total: number }>({
    queryKey: ["aws", "config", "recorder-statuses"],
    queryFn: () => api("/aws/config/recorders/status"),
  });
}

// ── Conformance Packs ────────────────────────────────────

export function useConformancePacks() {
  return useQuery<{ conformancePacks: ConformancePack[]; total: number }>({
    queryKey: ["aws", "config", "conformance-packs"],
    queryFn: () => api("/aws/config/conformance-packs"),
  });
}

export function useDeleteConformancePack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/config/conformance-packs/${encodeURIComponent(name)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "config", "conformance-packs"] }),
  });
}
