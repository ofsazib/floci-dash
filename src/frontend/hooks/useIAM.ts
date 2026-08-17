import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

// ─── USERS ───────────────────────────────────────────────

export function useIAMUsers() {
  return useQuery({
    queryKey: ["aws", "iam", "users"],
    queryFn: () => api<{ users: any[]; total: number }>("/aws/iam/users"),
  });
}

export function useIAMUser(name: string | null) {
  return useQuery({
    queryKey: ["aws", "iam", "users", name],
    queryFn: () =>
      api<{ user: any; groups: any[]; attachedPolicies: any[]; accessKeys: any[]; inlinePolicies: string[]; tags: Record<string, string> }>(
        `/aws/iam/users/${name}`
      ),
    enabled: !!name,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api("/aws/iam/users", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "iam", "users"] }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api(`/aws/iam/users/${name}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "iam", "users"] }),
  });
}

// ─── ROLES ───────────────────────────────────────────────

export function useIAMRoles() {
  return useQuery({
    queryKey: ["aws", "iam", "roles"],
    queryFn: () => api<{ roles: any[]; total: number }>("/aws/iam/roles"),
  });
}

export function useIAMRole(name: string | null) {
  return useQuery({
    queryKey: ["aws", "iam", "roles", name],
    queryFn: () => api<{ role: any; attachedPolicies: any[]; tags: Record<string, string> }>(`/aws/iam/roles/${name}`),
    enabled: !!name,
  });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api("/aws/iam/roles", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "iam", "roles"] }),
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api(`/aws/iam/roles/${name}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "iam", "roles"] }),
  });
}

// ─── GROUPS ──────────────────────────────────────────────

export function useIAMGroups() {
  return useQuery({
    queryKey: ["aws", "iam", "groups"],
    queryFn: () => api<{ groups: any[]; total: number }>("/aws/iam/groups"),
  });
}

export function useIAMGroup(name: string | null) {
  return useQuery({
    queryKey: ["aws", "iam", "groups", name],
    queryFn: () => api<{ group: any; users: any[] }>(`/aws/iam/groups/${name}`),
    enabled: !!name,
  });
}

export function useAddUserToGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupName, userName }: { groupName: string; userName: string }) =>
      api(`/aws/iam/groups/${groupName}/users`, { method: "POST", body: JSON.stringify({ userName }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "iam"] }),
  });
}

export function useRemoveUserFromGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupName, userName }: { groupName: string; userName: string }) =>
      api(`/aws/iam/groups/${groupName}/users/${userName}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "iam"] }),
  });
}

export function useGroupInlinePolicies(groupName: string | null) {
  return useQuery({
    queryKey: ["aws", "iam", "groups", groupName, "inline-policies"],
    queryFn: () => api<{ policyNames: string[] }>(`/aws/iam/groups/${groupName}/inline-policies`),
    enabled: !!groupName,
  });
}

export function useGroupInlinePolicy(groupName: string | null, policyName: string | null) {
  return useQuery({
    queryKey: ["aws", "iam", "groups", groupName, "inline-policies", policyName],
    queryFn: () =>
      api<{ policyName: string; document: string | null }>(
        `/aws/iam/groups/${groupName}/inline-policies/${policyName}`
      ),
    enabled: !!groupName && !!policyName,
  });
}

export function usePutGroupInlinePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupName, policyName, document }: { groupName: string; policyName: string; document?: string }) =>
      api(`/aws/iam/groups/${groupName}/inline-policies`, {
        method: "PUT",
        body: JSON.stringify({ policyName, document }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "iam"] }),
  });
}

export function useDeleteGroupInlinePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupName, policyName }: { groupName: string; policyName: string }) =>
      api(`/aws/iam/groups/${groupName}/inline-policies/${policyName}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "iam"] }),
  });
}

export function useSetDefaultPolicyVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ arn, versionId }: { arn: string; versionId: string }) =>
      api(`/aws/iam/policies/${encodeURIComponent(arn)}/set-default-version`, {
        method: "POST",
        body: JSON.stringify({ versionId }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "iam"] }),
  });
}

export function useTagUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userName, tags }: { userName: string; tags: { Key: string; Value: string }[] }) =>
      api(`/aws/iam/users/${userName}/tags`, { method: "POST", body: JSON.stringify({ tags }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "iam"] }),
  });
}

export function useUntagUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userName, tagKeys }: { userName: string; tagKeys: string[] }) =>
      api(`/aws/iam/users/${userName}/tags`, { method: "DELETE", body: JSON.stringify({ tagKeys }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "iam"] }),
  });
}

export function useTagRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roleName, tags }: { roleName: string; tags: { Key: string; Value: string }[] }) =>
      api(`/aws/iam/roles/${roleName}/tags`, { method: "POST", body: JSON.stringify({ tags }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "iam"] }),
  });
}

export function useUntagRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roleName, tagKeys }: { roleName: string; tagKeys: string[] }) =>
      api(`/aws/iam/roles/${roleName}/tags`, { method: "DELETE", body: JSON.stringify({ tagKeys }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "iam"] }),
  });
}

export function useTagPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ arn, tags }: { arn: string; tags: { Key: string; Value: string }[] }) =>
      api(`/aws/iam/policies/${encodeURIComponent(arn)}/tags`, { method: "POST", body: JSON.stringify({ tags }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "iam"] }),
  });
}

export function useUntagPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ arn, tagKeys }: { arn: string; tagKeys: string[] }) =>
      api(`/aws/iam/policies/${encodeURIComponent(arn)}/tags`, {
        method: "DELETE",
        body: JSON.stringify({ tagKeys }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "iam"] }),
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api("/aws/iam/groups", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "iam", "groups"] }),
  });
}

export function useDeleteGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api(`/aws/iam/groups/${name}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "iam", "groups"] }),
  });
}

// ─── POLICIES ────────────────────────────────────────────

export function useIAMPolicies(scope?: string) {
  return useQuery({
    queryKey: ["aws", "iam", "policies", scope],
    queryFn: () =>
      api<{ policies: any[]; total: number }>(`/aws/iam/policies?scope=${scope || "Local"}`),
  });
}

export function useIAMPolicy(arn: string | null) {
  return useQuery({
    queryKey: ["aws", "iam", "policies", arn],
    queryFn: () =>      api<{ policy: any; versions: any[]; tags: Record<string, string> }>(`/aws/iam/policies/detail?arn=${encodeURIComponent(arn!)}`),
    enabled: !!arn,
  });
}

export function usePolicyVersion(arn: string | null, versionId: string | null) {
  return useQuery({
    queryKey: ["aws", "iam", "policies", arn, "versions", versionId],
    queryFn: () =>
      api<{ versionId: string; document: string; isDefaultVersion: boolean }>(
        `/aws/iam/policies/version?arn=${encodeURIComponent(arn!)}&versionId=${versionId}`
      ),
    enabled: !!arn && !!versionId,
  });
}

export function useCreatePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api("/aws/iam/policies", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "iam", "policies"] }),
  });
}

export function useDeletePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (arn: string) => api(`/aws/iam/policies?arn=${encodeURIComponent(arn)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "iam", "policies"] }),
  });
}

// ─── ACCESS KEYS ─────────────────────────────────────────

export function useCreateAccessKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userName: string) => api(`/aws/iam/users/${userName}/access-keys`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "iam"] }),
  });
}

export function useDeleteAccessKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userName, id }: { userName: string; id: string }) =>
      api(`/aws/iam/users/${userName}/access-keys/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "iam"] }),
  });
}

// ─── INSTANCE PROFILES ───────────────────────────────────

export function useInstanceProfiles() {
  return useQuery({
    queryKey: ["aws", "iam", "instance-profiles"],
    queryFn: () => api<{ instanceProfiles: any[]; total: number }>("/aws/iam/instance-profiles"),
  });
}

export function useCreateInstanceProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; path?: string }) =>
      api("/aws/iam/instance-profiles", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "iam"] }),
  });
}

export function useDeleteInstanceProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api(`/aws/iam/instance-profiles/${name}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "iam"] }),
  });
}

export function useAddRoleToInstanceProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, roleName }: { name: string; roleName: string }) =>
      api(`/aws/iam/instance-profiles/${name}/roles/${roleName}`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "iam"] }),
  });
}

export function useRemoveRoleFromInstanceProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, roleName }: { name: string; roleName: string }) =>
      api(`/aws/iam/instance-profiles/${name}/roles/${roleName}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "iam"] }),
  });
}

// ─── PERMISSION BOUNDARIES ───────────────────────────────

export function useSetUserPermissionsBoundary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userName, permissionsBoundary }: { userName: string; permissionsBoundary: string }) =>
      api(`/aws/iam/users/${userName}/permissions-boundary`, {
        method: "PUT",
        body: JSON.stringify({ permissionsBoundary }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "iam"] }),
  });
}

export function useDeleteUserPermissionsBoundary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userName: string) =>
      api(`/aws/iam/users/${userName}/permissions-boundary`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "iam"] }),
  });
}

export function useSetRolePermissionsBoundary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roleName, permissionsBoundary }: { roleName: string; permissionsBoundary: string }) =>
      api(`/aws/iam/roles/${roleName}/permissions-boundary`, {
        method: "PUT",
        body: JSON.stringify({ permissionsBoundary }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "iam"] }),
  });
}

export function useDeleteRolePermissionsBoundary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (roleName: string) =>
      api(`/aws/iam/roles/${roleName}/permissions-boundary`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "iam"] }),
  });
}
