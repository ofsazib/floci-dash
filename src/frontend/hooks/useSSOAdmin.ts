import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface SSOInstance {
  InstanceArn: string;
  IdentityStoreId: string;
  Name?: string;
  OwnerAccountId?: string;
  Status?: string;
}

export interface SsoPermissionSet {
  PermissionSetArn: string;
  Name?: string;
  Description?: string | null;
  SessionDuration?: string | null;
  CreatedDate?: string;
}

export interface SsoAssignment {
  AccountId: string;
  PermissionSetArn: string;
  PrincipalId: string;
  PrincipalType: string;
}

export interface SsoOperationStatus {
  RequestId: string;
  Status: string;
  CreatedDate?: string;
  TargetId?: string;
  TargetType?: string;
  PermissionSetArn?: string;
  PrincipalId?: string;
  PrincipalType?: string;
  FailureReason?: string;
  AccountId?: string;
}

export interface SsoTag {
  key: string;
  value: string;
}

export interface SsoAccessControlAttribute {
  Key: string;
  Value: { Source: string[] };
}

export interface SsoRegion {
  RegionName: string;
  Status: string;
  IsPrimaryRegion: boolean;
  AddedDate?: string;
}

/** Builds an encoded querystring from required string params. */
function qs(params: Record<string, string>) {
  return new URLSearchParams(params).toString();
}

const SSO_KEY = ["aws", "ssoadmin"];

export function useSSOInstances() {
  return useQuery({
    queryKey: [...SSO_KEY, "instances"],
    queryFn: () => api<{ instances: SSOInstance[]; total: number }>("/aws/ssoadmin/instances"),
  });
}

// ── Permission Sets ──────────────────────────────────────

export function usePermissionSets(instanceArn: string | null) {
  return useQuery<{ permissionSets: SsoPermissionSet[]; total: number }>({
    queryKey: [...SSO_KEY, "permission-sets", instanceArn],
    queryFn: () =>
      api(`/aws/ssoadmin/permission-sets?instanceArn=${encodeURIComponent(instanceArn!)}`),
    enabled: !!instanceArn,
  });
}

export function usePermissionSetDetail(
  instanceArn: string | null,
  permissionSetArn: string | null
) {
  return useQuery<{ permissionSet: SsoPermissionSet | null }>({
    queryKey: [...SSO_KEY, "permission-set", instanceArn, permissionSetArn],
    queryFn: () =>
      api(
        `/aws/ssoadmin/permission-sets/detail?${qs({
          instanceArn: instanceArn!,
          permissionSetArn: permissionSetArn!,
        })}`
      ),
    enabled: !!instanceArn && !!permissionSetArn,
  });
}

export function useCreatePermissionSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      instanceArn: string;
      name: string;
      description?: string;
      sessionDuration?: string;
    }) => api("/aws/ssoadmin/permission-sets", { method: "POST", body: JSON.stringify(params) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: SSO_KEY }),
  });
}

export function useUpdatePermissionSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      instanceArn: string;
      permissionSetArn: string;
      description?: string;
      sessionDuration?: string;
    }) => api("/aws/ssoadmin/permission-sets", { method: "PUT", body: JSON.stringify(params) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: SSO_KEY }),
  });
}

export function useDeletePermissionSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { instanceArn: string; permissionSetArn: string }) =>
      api(`/aws/ssoadmin/permission-sets?${qs(params)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: SSO_KEY }),
  });
}

// ── Managed Policies ─────────────────────────────────────

export function useManagedPolicies(instanceArn: string | null, permissionSetArn: string | null) {
  return useQuery<{ policies: { Arn: string; Name: string }[]; total: number }>({
    queryKey: [...SSO_KEY, "managed-policies", instanceArn, permissionSetArn],
    queryFn: () =>
      api(
        `/aws/ssoadmin/managed-policies?${qs({
          instanceArn: instanceArn!,
          permissionSetArn: permissionSetArn!,
        })}`
      ),
    enabled: !!instanceArn && !!permissionSetArn,
  });
}

export function useAttachManagedPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { instanceArn: string; permissionSetArn: string; managedPolicyArn: string }) =>
      api("/aws/ssoadmin/managed-policies", { method: "POST", body: JSON.stringify(params) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: SSO_KEY }),
  });
}

export function useDetachManagedPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { instanceArn: string; permissionSetArn: string; managedPolicyArn: string }) =>
      api(`/aws/ssoadmin/managed-policies?${qs(params)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: SSO_KEY }),
  });
}

// ── Customer Managed Policy References ───────────────────

export function useCustomerManagedPolicyReferences(
  instanceArn: string | null,
  permissionSetArn: string | null
) {
  return useQuery<{ references: { Name: string; Path?: string }[]; total: number }>({
    queryKey: [...SSO_KEY, "customer-managed-policies", instanceArn, permissionSetArn],
    queryFn: () =>
      api(
        `/aws/ssoadmin/customer-managed-policies?${qs({
          instanceArn: instanceArn!,
          permissionSetArn: permissionSetArn!,
        })}`
      ),
    enabled: !!instanceArn && !!permissionSetArn,
  });
}

export function useAttachCustomerManagedPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      instanceArn: string;
      permissionSetArn: string;
      name: string;
      path?: string;
    }) =>
      api("/aws/ssoadmin/customer-managed-policies", {
        method: "POST",
        body: JSON.stringify(params),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: SSO_KEY }),
  });
}

export function useDetachCustomerManagedPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { instanceArn: string; permissionSetArn: string; name: string; path?: string }) =>
      api(
        `/aws/ssoadmin/customer-managed-policies?${qs({
          instanceArn: params.instanceArn,
          permissionSetArn: params.permissionSetArn,
          name: params.name,
          ...(params.path ? { path: params.path } : {}),
        })}`,
        { method: "DELETE" }
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: SSO_KEY }),
  });
}

// ── Inline Policy ────────────────────────────────────────

export function useInlinePolicy(instanceArn: string | null, permissionSetArn: string | null) {
  return useQuery<{ inlinePolicy: string }>({
    queryKey: [...SSO_KEY, "inline-policy", instanceArn, permissionSetArn],
    queryFn: () =>
      api(
        `/aws/ssoadmin/inline-policy?${qs({
          instanceArn: instanceArn!,
          permissionSetArn: permissionSetArn!,
        })}`
      ),
    enabled: !!instanceArn && !!permissionSetArn,
  });
}

export function usePutInlinePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { instanceArn: string; permissionSetArn: string; inlinePolicy: string }) =>
      api("/aws/ssoadmin/inline-policy", { method: "PUT", body: JSON.stringify(params) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: SSO_KEY }),
  });
}

export function useDeleteInlinePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { instanceArn: string; permissionSetArn: string }) =>
      api(`/aws/ssoadmin/inline-policy?${qs(params)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: SSO_KEY }),
  });
}

// ── Permissions Boundary ─────────────────────────────────

export function usePermissionsBoundary(instanceArn: string | null, permissionSetArn: string | null) {
  return useQuery<{ permissionsBoundary: any | null }>({
    queryKey: [...SSO_KEY, "permissions-boundary", instanceArn, permissionSetArn],
    queryFn: () =>
      api(
        `/aws/ssoadmin/permissions-boundary?${qs({
          instanceArn: instanceArn!,
          permissionSetArn: permissionSetArn!,
        })}`
      ),
    enabled: !!instanceArn && !!permissionSetArn,
    retry: false,
  });
}

export function usePutPermissionsBoundary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      instanceArn: string;
      permissionSetArn: string;
      managedPolicyArn?: string;
      customerName?: string;
      customerPath?: string;
    }) =>
      api("/aws/ssoadmin/permissions-boundary", { method: "PUT", body: JSON.stringify(params) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: SSO_KEY }),
  });
}

export function useDeletePermissionsBoundary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { instanceArn: string; permissionSetArn: string }) =>
      api(`/aws/ssoadmin/permissions-boundary?${qs(params)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: SSO_KEY }),
  });
}

// ── Tags ─────────────────────────────────────────────────

export function useSsoTags(resourceArn: string | null) {
  return useQuery<{ tags: SsoTag[]; total: number }>({
    queryKey: [...SSO_KEY, "tags", resourceArn],
    queryFn: () => api(`/aws/ssoadmin/tags?resourceArn=${encodeURIComponent(resourceArn!)}`),
    enabled: !!resourceArn,
  });
}

export function useAddSsoTags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { resourceArn: string; tags: Record<string, string> }) =>
      api("/aws/ssoadmin/tags", { method: "POST", body: JSON.stringify(params) }),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: [...SSO_KEY, "tags", v.resourceArn] }),
  });
}

export function useRemoveSsoTags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { resourceArn: string; tagKeys: string[] }) =>
      api("/aws/ssoadmin/tags/untag", { method: "POST", body: JSON.stringify(params) }),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: [...SSO_KEY, "tags", v.resourceArn] }),
  });
}

// ── Account Assignments ──────────────────────────────────

export function useAccountAssignments(
  instanceArn: string | null,
  accountId: string | null,
  permissionSetArn: string | null
) {
  return useQuery<{ assignments: SsoAssignment[]; total: number }>({
    queryKey: [...SSO_KEY, "account-assignments", instanceArn, accountId, permissionSetArn],
    queryFn: () =>
      api(
        `/aws/ssoadmin/account-assignments?${qs({
          instanceArn: instanceArn!,
          accountId: accountId!,
          permissionSetArn: permissionSetArn!,
        })}`
      ),
    enabled: !!instanceArn && !!accountId && !!permissionSetArn,
  });
}

export function useCreateAccountAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      instanceArn: string;
      targetId: string;
      permissionSetArn: string;
      principalId: string;
      principalType: string;
    }) =>
      api("/aws/ssoadmin/account-assignments", { method: "POST", body: JSON.stringify(params) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: SSO_KEY }),
  });
}

export function useDeleteAccountAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      instanceArn: string;
      targetId: string;
      permissionSetArn: string;
      principalId: string;
      principalType: string;
    }) => api(`/aws/ssoadmin/account-assignments?${qs(params)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: SSO_KEY }),
  });
}

export function useAssignmentCreationStatuses(instanceArn: string | null) {
  return useQuery<{ statuses: SsoOperationStatus[]; total: number }>({
    queryKey: [...SSO_KEY, "assignment-creation-status", instanceArn],
    queryFn: () =>
      api(`/aws/ssoadmin/assignment-creation-status?instanceArn=${encodeURIComponent(instanceArn!)}`),
    enabled: !!instanceArn,
  });
}

export function useAssignmentDeletionStatuses(instanceArn: string | null) {
  return useQuery<{ statuses: SsoOperationStatus[]; total: number }>({
    queryKey: [...SSO_KEY, "assignment-deletion-status", instanceArn],
    queryFn: () =>
      api(`/aws/ssoadmin/assignment-deletion-status?instanceArn=${encodeURIComponent(instanceArn!)}`),
    enabled: !!instanceArn,
  });
}

// ── Provisioning ─────────────────────────────────────────

export function usePermissionSetProvisioningStatuses(instanceArn: string | null) {
  return useQuery<{ statuses: SsoOperationStatus[]; total: number }>({
    queryKey: [...SSO_KEY, "ps-provisioning-status", instanceArn],
    queryFn: () =>
      api(
        `/aws/ssoadmin/permission-set-provisioning-status?instanceArn=${encodeURIComponent(instanceArn!)}`
      ),
    enabled: !!instanceArn,
  });
}

export function useProvisionPermissionSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      instanceArn: string;
      permissionSetArn: string;
      targetType: string;
      targetId?: string;
    }) =>
      api("/aws/ssoadmin/provision-permission-set", {
        method: "POST",
        body: JSON.stringify(params),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: SSO_KEY }),
  });
}

export function useAccountsForProvisionedPermissionSet(
  instanceArn: string | null,
  permissionSetArn: string | null
) {
  return useQuery<{ accountIds: string[]; total: number }>({
    queryKey: [...SSO_KEY, "accounts-for-provisioned", instanceArn, permissionSetArn],
    queryFn: () =>
      api(
        `/aws/ssoadmin/accounts-for-provisioned-permission-set?${qs({
          instanceArn: instanceArn!,
          permissionSetArn: permissionSetArn!,
        })}`
      ),
    enabled: !!instanceArn && !!permissionSetArn,
  });
}

// ── Trusted Token Issuers ────────────────────────────────

export function useTrustedTokenIssuers(instanceArn: string | null) {
  return useQuery<{ trustedTokenIssuers: any[]; total: number }>({
    queryKey: [...SSO_KEY, "trusted-token-issuers", instanceArn],
    queryFn: () =>
      api(`/aws/ssoadmin/trusted-token-issuers?instanceArn=${encodeURIComponent(instanceArn!)}`),
    enabled: !!instanceArn,
  });
}

export function useTrustedTokenIssuerDetail(trustedTokenIssuerArn: string | null) {
  return useQuery<{ trustedTokenIssuer: any | null }>({
    queryKey: [...SSO_KEY, "trusted-token-issuer", trustedTokenIssuerArn],
    queryFn: () =>
      api(
        `/aws/ssoadmin/trusted-token-issuers/detail?trustedTokenIssuerArn=${encodeURIComponent(
          trustedTokenIssuerArn!
        )}`
      ),
    enabled: !!trustedTokenIssuerArn,
  });
}

export function useCreateTrustedTokenIssuer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      instanceArn: string;
      name: string;
      issuerUrl: string;
      claimAttributePath: string;
      identityStoreAttributePath: string;
    }) =>
      api("/aws/ssoadmin/trusted-token-issuers", { method: "POST", body: JSON.stringify(params) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: SSO_KEY }),
  });
}

export function useUpdateTrustedTokenIssuer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      trustedTokenIssuerArn: string;
      name?: string;
      claimAttributePath?: string;
      identityStoreAttributePath?: string;
      jwksRetrievalOption?: string;
    }) => api("/aws/ssoadmin/trusted-token-issuers", { method: "PUT", body: JSON.stringify(params) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: SSO_KEY }),
  });
}

export function useDeleteTrustedTokenIssuer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (trustedTokenIssuerArn: string) =>
      api(`/aws/ssoadmin/trusted-token-issuers?trustedTokenIssuerArn=${encodeURIComponent(trustedTokenIssuerArn)}`, {
        method: "DELETE",
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: SSO_KEY }),
  });
}

// ── Instance Access Control Attributes ───────────────────

export function useAccessControlAttributeConfiguration(instanceArn: string | null) {
  return useQuery<{
    configuration: { AccessControlAttributes: SsoAccessControlAttribute[] } | null;
    status?: string;
    statusReason?: string;
  }>({
    queryKey: [...SSO_KEY, "access-control-attributes", instanceArn],
    queryFn: () =>
      api(
        `/aws/ssoadmin/access-control-attribute-configuration?instanceArn=${encodeURIComponent(
          instanceArn!
        )}`
      ),
    enabled: !!instanceArn,
    retry: false,
  });
}

export function useCreateAccessControlConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { instanceArn: string; attributes: { key: string; source: string }[] }) =>
      api("/aws/ssoadmin/access-control-attribute-configuration", {
        method: "POST",
        body: JSON.stringify(params),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: SSO_KEY }),
  });
}

export function useUpdateAccessControlConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { instanceArn: string; attributes: { key: string; source: string }[] }) =>
      api("/aws/ssoadmin/access-control-attribute-configuration", {
        method: "PUT",
        body: JSON.stringify(params),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: SSO_KEY }),
  });
}

export function useDeleteAccessControlConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (instanceArn: string) =>
      api(`/aws/ssoadmin/access-control-attribute-configuration?instanceArn=${encodeURIComponent(instanceArn)}`, {
        method: "DELETE",
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: SSO_KEY }),
  });
}

// ── Regions ──────────────────────────────────────────────

export function useSsoRegions(instanceArn: string | null) {
  return useQuery<{ regions: SsoRegion[]; total: number }>({
    queryKey: [...SSO_KEY, "regions", instanceArn],
    queryFn: () => api(`/aws/ssoadmin/regions?instanceArn=${encodeURIComponent(instanceArn!)}`),
    enabled: !!instanceArn,
  });
}

export function useAddSsoRegion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { instanceArn: string; regionName: string }) =>
      api("/aws/ssoadmin/regions", { method: "POST", body: JSON.stringify(params) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: SSO_KEY }),
  });
}

export function useRemoveSsoRegion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { instanceArn: string; regionName: string }) =>
      api(`/aws/ssoadmin/regions?${qs(params)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: SSO_KEY }),
  });
}
