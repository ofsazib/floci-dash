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

// ── Conformance Pack Status ──────────────────────────────

export function useConformancePackStatuses() {
  return useQuery<{ statuses: any[]; total: number }>({
    queryKey: ["aws", "config", "conformance-pack-statuses"],
    queryFn: () => api("/aws/config/conformance-packs/status"),
  });
}

// ── Compliance & Evaluation ──────────────────────────────

export function useComplianceByConfigRule() {
  return useQuery<{ compliance: any[]; total: number }>({
    queryKey: ["aws", "config", "compliance"],
    queryFn: () => api("/aws/config/rules/compliance"),
    refetchInterval: 30000,
  });
}

export function useConfigRuleEvaluationStatus() {
  return useQuery<{ statuses: any[]; total: number }>({
    queryKey: ["aws", "config", "evaluation-statuses"],
    queryFn: () => api("/aws/config/rules/evaluation-status"),
  });
}

export function useStartConfigRulesEvaluation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ruleNames?: string[]) =>
      api("/aws/config/rules/evaluate", { method: "POST", body: JSON.stringify({ ruleNames }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aws", "config", "evaluation-statuses"] });
      qc.invalidateQueries({ queryKey: ["aws", "config", "compliance"] });
    },
  });
}

// ── Tags ─────────────────────────────────────────────────

export interface ConfigTag {
  key: string;
  value: string;
}

export function useConfigTags(arn: string | null) {
  return useQuery<{ tags: ConfigTag[] }>({
    queryKey: ["aws", "config", "tags", arn],
    queryFn: () => api(`/aws/config/tags?arn=${encodeURIComponent(arn!)}`),
    enabled: !!arn,
  });
}

export function useAddConfigTags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { arn: string; tags: Record<string, string> }) =>
      api("/aws/config/tags", { method: "POST", body: JSON.stringify(params) }),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["aws", "config", "tags", v.arn] }),
  });
}

export function useRemoveConfigTags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { arn: string; tagKeys: string[] }) =>
      api("/aws/config/tags/untag", { method: "POST", body: JSON.stringify(params) }),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["aws", "config", "tags", v.arn] }),
  });
}

// ── Aggregation Authorizations ──────────────────────────

export interface AggregationAuthorization {
  AuthorizedAccountId: string;
  AuthorizedAwsRegion: string;
  AggregationAuthorizationArn?: string;
}

export function useAggregationAuthorizations() {
  return useQuery<{ authorizations: AggregationAuthorization[]; total: number }>({
    queryKey: ["aws", "config", "aggregation-authorizations"],
    queryFn: () => api("/aws/config/aggregation-authorizations"),
  });
}

export function usePutAggregationAuthorization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { authorizedAccountId: string; authorizedAwsRegion: string }) =>
      api("/aws/config/aggregation-authorizations", { method: "POST", body: JSON.stringify(params) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "config", "aggregation-authorizations"] }),
  });
}

export function useDeleteAggregationAuthorization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { authorizedAccountId: string; authorizedAwsRegion: string }) =>
      api("/aws/config/aggregation-authorizations", { method: "DELETE", body: JSON.stringify(params) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "config", "aggregation-authorizations"] }),
  });
}

// ── Retention Configurations ────────────────────────────

export function useRetentionConfigurations() {
  return useQuery<{ retentionConfigurations: any[]; total: number }>({
    queryKey: ["aws", "config", "retention-configurations"],
    queryFn: () => api("/aws/config/retention-configurations"),
  });
}

export function usePutRetentionConfiguration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (retentionPeriodInDays: number) =>
      api("/aws/config/retention-configurations", { method: "PUT", body: JSON.stringify({ retentionPeriodInDays }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "config", "retention-configurations"] }),
  });
}

export function useDeleteRetentionConfiguration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/config/retention-configurations/${encodeURIComponent(name)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "config", "retention-configurations"] }),
  });
}

// ── Delivery Channel / Evaluation Results (delete) ──────

export function useDeleteDeliveryChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/config/delivery-channels/${encodeURIComponent(name)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "config"] }),
  });
}

export function useDeleteEvaluationResults() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ruleName: string) =>
      api(`/aws/config/rules/${encodeURIComponent(ruleName)}/evaluation-results`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "config", "evaluation-statuses"] }),
  });
}

// ── Compliance ──────────────────────────────────────────

export function useComplianceByResource() {
  return useQuery<{ compliance: any[]; total: number }>({
    queryKey: ["aws", "config", "compliance-by-resource"],
    queryFn: () => api("/aws/config/compliance-by-resource"),
  });
}

export function useComplianceDetailsByConfigRule(ruleName: string | null) {
  return useQuery<{ evaluationResults: any[]; total: number }>({
    queryKey: ["aws", "config", "compliance-details-rule", ruleName],
    queryFn: () => api(`/aws/config/compliance-details/by-rule/${encodeURIComponent(ruleName!)}`),
    enabled: !!ruleName,
  });
}

export function useComplianceDetailsByResource(resourceType: string | null, resourceId: string | null) {
  return useQuery<{ evaluationResults: any[]; total: number }>({
    queryKey: ["aws", "config", "compliance-details-resource", resourceType, resourceId],
    queryFn: () =>
      api(`/aws/config/compliance-details/by-resource?resourceType=${encodeURIComponent(resourceType!)}&resourceId=${encodeURIComponent(resourceId!)}`),
    enabled: !!resourceType && !!resourceId,
  });
}

export function useComplianceSummaryByConfigRule() {
  return useQuery<{ complianceSummary: any | null }>({
    queryKey: ["aws", "config", "compliance-summary-rule"],
    queryFn: () => api("/aws/config/compliance-summary/by-config-rule"),
  });
}

export function useComplianceSummaryByResourceType(resourceTypes: string | null) {
  return useQuery<{ summaries: any[]; total: number }>({
    queryKey: ["aws", "config", "compliance-summary-resource-type", resourceTypes],
    queryFn: () => api(`/aws/config/compliance-summary/by-resource-type?resourceTypes=${encodeURIComponent(resourceTypes!)}`),
    enabled: !!resourceTypes,
  });
}
