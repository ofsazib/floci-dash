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
      api<{ user: any; groups: any[]; attachedPolicies: any[]; accessKeys: any[]; inlinePolicies: string[] }>(
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
    queryFn: () => api<{ policy: any; versions: any[] }>(`/aws/iam/policies/detail?arn=${encodeURIComponent(arn || "")}`),
    enabled: !!arn,
  });
}

export function usePolicyVersion(arn: string | null, versionId: string | null) {
  return useQuery({
    queryKey: ["aws", "iam", "policies", arn, "versions", versionId],
    queryFn: () =>
      api<{ versionId: string; document: string; isDefaultVersion: boolean }>(
        `/aws/iam/policies/version?arn=${encodeURIComponent(arn || "")}&versionId=${versionId}`
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
