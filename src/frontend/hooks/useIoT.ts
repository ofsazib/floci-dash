import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

// ─── Endpoint ────────────────────────────────────────

export function useEndpoint() {
  return useQuery({
    queryKey: ["aws", "iot", "endpoint"],
    queryFn: () => api<{ endpointAddress: string }>("/aws/iot/endpoint"),
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Things ──────────────────────────────────────────

export function useThings() {
  return useQuery({
    queryKey: ["aws", "iot", "things"],
    queryFn: () => api<{ things: any[]; total: number }>("/aws/iot/things"),
  });
}

export function useThing(thingName: string | null) {
  return useQuery({
    queryKey: ["aws", "iot", "things", thingName],
    queryFn: () => api<any>(`/aws/iot/things/${thingName}`),
    enabled: !!thingName,
  });
}

export function useCreateThing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/iot/things", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "iot", "things"] }),
  });
}

export function useDeleteThing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (thingName: string) =>
      api(`/aws/iot/things/${thingName}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "iot", "things"] }),
  });
}

// ─── Thing Types ─────────────────────────────────────

export function useThingTypes() {
  return useQuery({
    queryKey: ["aws", "iot", "thing-types"],
    queryFn: () => api<{ thingTypes: any[]; total: number }>("/aws/iot/thing-types"),
  });
}

export function useCreateThingType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/iot/thing-types", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "iot", "thing-types"] }),
  });
}

export function useDeleteThingType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (thingTypeName: string) =>
      api(`/aws/iot/thing-types/${thingTypeName}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "iot", "thing-types"] }),
  });
}

// ─── Certificates ─────────────────────────────────────

export function useCertificates() {
  return useQuery({
    queryKey: ["aws", "iot", "certificates"],
    queryFn: () => api<{ certificates: any[]; total: number }>("/aws/iot/certificates"),
  });
}

export function useCertificate(certificateId: string | null) {
  return useQuery({
    queryKey: ["aws", "iot", "certificates", certificateId],
    queryFn: () => api<any>(`/aws/iot/certificates/${certificateId}`),
    enabled: !!certificateId,
  });
}

export function useCreateKeysAndCertificate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api("/aws/iot/certificates/keys-and-certificate", { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "iot", "certificates"] }),
  });
}

export function useUpdateCertificateStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ certificateId, newStatus }: { certificateId: string; newStatus: string }) =>
      api(`/aws/iot/certificates/${certificateId}`, {
        method: "PUT",
        body: JSON.stringify({ newStatus }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "iot", "certificates"] }),
  });
}

export function useDeleteCertificate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (certificateId: string) =>
      api(`/aws/iot/certificates/${certificateId}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "iot", "certificates"] }),
  });
}

// ─── Policies ─────────────────────────────────────────

export function usePolicies() {
  return useQuery({
    queryKey: ["aws", "iot", "policies"],
    queryFn: () => api<{ policies: any[]; total: number }>("/aws/iot/policies"),
  });
}

export function usePolicy(policyName: string | null) {
  return useQuery({
    queryKey: ["aws", "iot", "policies", policyName],
    queryFn: () => api<any>(`/aws/iot/policies/${policyName}`),
    enabled: !!policyName,
  });
}

export function useCreatePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/iot/policies", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "iot", "policies"] }),
  });
}

export function useDeletePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (policyName: string) =>
      api(`/aws/iot/policies/${policyName}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "iot", "policies"] }),
  });
}

// ─── Policy Versions ──────────────────────────────────

export function usePolicyVersions(policyName: string | null) {
  return useQuery({
    queryKey: ["aws", "iot", "policies", policyName, "versions"],
    queryFn: () => api<{ policyVersions: any[]; total: number }>(`/aws/iot/policies/${policyName}/versions`),
    enabled: !!policyName,
  });
}

export function useCreatePolicyVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ policyName, ...body }: any) =>
      api(`/aws/iot/policies/${policyName}/versions`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ["aws", "iot", "policies", variables.policyName, "versions"] }),
  });
}

// ─── Topic Rules ──────────────────────────────────────

export function useTopicRules() {
  return useQuery({
    queryKey: ["aws", "iot", "topic-rules"],
    queryFn: () => api<{ rules: any[]; total: number }>("/aws/iot/topic-rules"),
  });
}

export function useTopicRule(ruleName: string | null) {
  return useQuery({
    queryKey: ["aws", "iot", "topic-rules", ruleName],
    queryFn: () => api<any>(`/aws/iot/topic-rules/${ruleName}`),
    enabled: !!ruleName,
  });
}

export function useCreateTopicRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/iot/topic-rules", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "iot", "topic-rules"] }),
  });
}

export function useDeleteTopicRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ruleName: string) =>
      api(`/aws/iot/topic-rules/${ruleName}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "iot", "topic-rules"] }),
  });
}

export function useEnableTopicRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ruleName: string) =>
      api(`/aws/iot/topic-rules/${ruleName}/enable`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "iot", "topic-rules"] }),
  });
}

export function useDisableTopicRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ruleName: string) =>
      api(`/aws/iot/topic-rules/${ruleName}/disable`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "iot", "topic-rules"] }),
  });
}

// ─── Shadows ──────────────────────────────────────────

export function useShadow(thingName: string | null) {
  return useQuery({
    queryKey: ["aws", "iot", "things", thingName, "shadow"],
    queryFn: () => api<any>(`/aws/iot/things/${thingName}/shadow`),
    enabled: !!thingName,
  });
}

export function useUpdateShadow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ thingName, ...body }: any) =>
      api(`/aws/iot/things/${thingName}/shadow`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ["aws", "iot", "things", variables.thingName, "shadow"] }),
  });
}

// ─── Tags ─────────────────────────────────────────────

export function useIoTTags(resourceArn: string | null) {
  return useQuery({
    queryKey: ["aws", "iot", "tags", resourceArn],
    queryFn: () => api<{ tags: any[] }>(`/aws/iot/tags?resourceArn=${encodeURIComponent(resourceArn || "")}`),
    enabled: !!resourceArn,
  });
}

export function useTagIoTResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { resourceArn: string; tags: any[] }) =>
      api("/aws/iot/tags", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ["aws", "iot", "tags", variables.resourceArn] }),
  });
}

// ─── Jobs ─────────────────────────────────────────────

export function useThingJobs(thingName: string | null) {
  return useQuery({
    queryKey: ["aws", "iot", "things", thingName, "jobs"],
    queryFn: () => api<{ executionSummaries: any[] }>(`/aws/iot/things/${thingName}/jobs`),
    enabled: !!thingName,
  });
}
