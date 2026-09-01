import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface OrgOrganization {
  Id: string;
  Arn: string;
  MasterAccountArn?: string;
  MasterAccountId?: string;
  MasterAccountEmail?: string;
  FeatureSet?: string;
}

export interface OrgRoot {
  Id: string;
  Arn: string;
  Name: string;
  PolicyTypes?: { Type: string; Status: string }[];
}

export interface OrgOrganizationalUnit {
  Id: string;
  Arn: string;
  Name: string;
  Tags?: { Key: string; Value: string }[];
}

export interface OrgAccount {
  Id: string;
  Arn: string;
  Name: string;
  Email: string;
  Status: string;
  JoinedMethod?: string;
  JoinedTimestamp?: string;
}

export interface OrgPolicy {
  Id: string;
  Arn: string;
  Name: string;
  Description?: string;
  Type?: string;
  AwsManaged?: boolean;
}

// ── Organization ─────────────────────────────────────────

export function useOrg() {
  return useQuery<{ organization: OrgOrganization | null }>({
    queryKey: ["aws", "org"],
    queryFn: () => api("/aws/organizations/"),
  });
}

export function useCreateOrg() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api("/aws/organizations/create", { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "org"] }),
  });
}

export function useDeleteOrg() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api("/aws/organizations/delete", { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "org"] }),
  });
}

export function useEnableAllFeatures() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api("/aws/organizations/enable-all-features", { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "org"] }),
  });
}

// ── Roots ────────────────────────────────────────────────

export function useOrgRoots() {
  return useQuery<{ roots: OrgRoot[]; total: number }>({
    queryKey: ["aws", "org", "roots"],
    queryFn: () => api("/aws/organizations/roots"),
  });
}

// ── Organizational Units ─────────────────────────────────

export function useOrgOUs(parentId: string | null) {
  return useQuery<{ organizationalUnits: OrgOrganizationalUnit[]; total: number }>({
    queryKey: ["aws", "org", "ous", parentId],
    queryFn: () => api(`/aws/organizations/ous?parentId=${parentId}`),
    enabled: !!parentId,
  });
}

export function useOrgOU(id: string | null) {
  return useQuery<OrgOrganizationalUnit>({
    queryKey: ["aws", "org", "ou", id],
    queryFn: () => api(`/aws/organizations/ous/${id}`),
    enabled: !!id,
  });
}

export function useCreateOrgOU() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { parentId: string; name: string; tags?: Record<string, string> }) =>
      api("/aws/organizations/ous", { method: "POST", body: JSON.stringify(params) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "org"] }),
  });
}

export function useUpdateOrgOU() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; name: string }) =>
      api(`/aws/organizations/ous/${params.id}`, {
        method: "PUT",
        body: JSON.stringify({ name: params.name }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "org"] }),
  });
}

export function useDeleteOrgOU() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/aws/organizations/ous/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "org"] }),
  });
}

// ── Parents / Children ───────────────────────────────────

export function useOrgParents(childId: string | null) {
  return useQuery<{ parents: any[] }>({
    queryKey: ["aws", "org", "parents", childId],
    queryFn: () => api(`/aws/organizations/parents?childId=${childId}`),
    enabled: !!childId,
  });
}

export function useOrgChildren(parentId: string | null) {
  return useQuery<{ children: any[] }>({
    queryKey: ["aws", "org", "children", parentId],
    queryFn: () => api(`/aws/organizations/children?parentId=${parentId}`),
    enabled: !!parentId,
  });
}

// ── Accounts ─────────────────────────────────────────────

export function useOrgAccounts(parentId?: string | null) {
  return useQuery<{ accounts: OrgAccount[]; total: number }>({
    queryKey: ["aws", "org", "accounts", parentId],
    queryFn: () =>
      parentId
        ? api(`/aws/organizations/accounts?parentId=${parentId}`)
        : api("/aws/organizations/accounts"),
  });
}

export function useOrgAccount(id: string | null) {
  return useQuery<OrgAccount>({
    queryKey: ["aws", "org", "account", id],
    queryFn: () => api(`/aws/organizations/accounts/${id}`),
    enabled: !!id,
  });
}

export function useCreateOrgAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      email: string;
      name?: string;
      iamUserAccessToBilling?: string;
      parentId?: string;
      roleName?: string;
    }) =>
      api("/aws/organizations/accounts", { method: "POST", body: JSON.stringify(params) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "org"] }),
  });
}

export function useMoveOrgAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { accountId: string; sourceParentId: string; destinationParentId: string }) =>
      api("/aws/organizations/accounts/move", { method: "POST", body: JSON.stringify(params) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "org"] }),
  });
}

export function useRemoveOrgAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (accountId: string) =>
      api("/aws/organizations/accounts/remove", {
        method: "POST",
        body: JSON.stringify({ accountId }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "org"] }),
  });
}

export function useLeaveOrg() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api("/aws/organizations/accounts/leave", { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "org"] }),
  });
}

export function useCloseOrgAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (accountId: string) =>
      api("/aws/organizations/accounts/close", {
        method: "POST",
        body: JSON.stringify({ accountId }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "org"] }),
  });
}

// ── Policies ─────────────────────────────────────────────

export function useOrgPolicies(filter = "SERVICE_CONTROL_POLICY") {
/* istanbul ignore next */
  return useQuery<{ policies: OrgPolicy[]; total: number }>({
    queryKey: ["aws", "org", "policies", filter],
    queryFn: () => api(`/aws/organizations/policies?filter=${filter}`),
  });
}

export function useOrgPolicy(id: string | null) {
  return useQuery<OrgPolicy>({
    queryKey: ["aws", "org", "policy", id],
    queryFn: () => api(`/aws/organizations/policies/${id}`),
    enabled: !!id,
  });
}

export function useCreateOrgPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { name: string; description?: string; content: string; type?: string }) =>
      api("/aws/organizations/policies", { method: "POST", body: JSON.stringify(params) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "org"] }),
  });
}

export function useUpdateOrgPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; name?: string; description?: string; content?: string }) =>
      api(`/aws/organizations/policies/${params.id}`, {
        method: "PUT",
        body: JSON.stringify({ name: params.name, description: params.description, content: params.content }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "org"] }),
  });
}

export function useDeleteOrgPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/aws/organizations/policies/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "org"] }),
  });
}

export function useAttachOrgPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { policyId: string; targetId: string }) =>
      api("/aws/organizations/policies/attach", { method: "POST", body: JSON.stringify(params) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "org"] }),
  });
}

export function useDetachOrgPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { policyId: string; targetId: string }) =>
      api("/aws/organizations/policies/detach", { method: "POST", body: JSON.stringify(params) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "org"] }),
  });
}

export function useOrgPolicyTargets(policyId: string | null) {
  return useQuery<{ targets: any[] }>({
    queryKey: ["aws", "org", "policy-targets", policyId],
    queryFn: () => api(`/aws/organizations/policies/${policyId}/targets`),
    enabled: !!policyId,
  });
}

export function useOrgTargetPolicies(targetId: string | null) {
  return useQuery<{ policies: OrgPolicy[] }>({
    queryKey: ["aws", "org", "target-policies", targetId],
    queryFn: () => api(`/aws/organizations/targets/${targetId}/policies`),
    enabled: !!targetId,
  });
}

// ── Tags ─────────────────────────────────────────────────

export function useOrgTags(resourceArn: string | null) {
  return useQuery<{ tags: { Key: string; Value: string }[] }>({
    queryKey: ["aws", "org", "tags", resourceArn],
    queryFn: () => api(`/aws/organizations/tags?resourceArn=${resourceArn}`),
    enabled: !!resourceArn,
  });
}

export function useTagOrgResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { resourceArn: string; tags: Record<string, string> }) =>
      api("/aws/organizations/tags", { method: "POST", body: JSON.stringify(params) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "org"] }),
  });
}

export function useUntagOrgResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { resourceArn: string; tagKeys: string[] }) =>
      api("/aws/organizations/tags/remove", { method: "POST", body: JSON.stringify(params) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "org"] }),
  });
}
