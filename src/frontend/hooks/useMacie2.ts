import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface McAdminAccount {
  accountId?: string;
  status?: string;
}

export interface McSession {
  enabled: boolean;
  status?: string;
  serviceRole?: string;
}

export interface McMember {
  accountId?: string;
  administratorAccountId?: string;
  masterAccountId?: string;
  arn?: string;
  email?: string;
  relationshipStatus?: string;
  invitedAt?: string;
  updatedAt?: string;
}

export function useMcSession() {
  return useQuery({
    queryKey: ["aws", "macie2", "session"],
    queryFn: () => api<McSession>("/aws/macie2/session"),
  });
}

export function useMcEnableSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api<{ enabled: boolean }>("/aws/macie2/session/enable", { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "macie2"] }),
  });
}

export function useMcAdminAccounts() {
  return useQuery({
    queryKey: ["aws", "macie2", "admins"],
    queryFn: () =>
      api<{ adminAccounts: McAdminAccount[] }>("/aws/macie2/organization/admins"),
  });
}

export function useMcEnableAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (accountId: string) =>
      api<{ enabled: boolean }>("/aws/macie2/organization/admins/enable", {
        method: "POST",
        body: JSON.stringify({ accountId }),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "macie2", "admins"] }),
  });
}

export function useMcOrgConfiguration() {
  return useQuery({
    queryKey: ["aws", "macie2", "org-configuration"],
    queryFn: () => api<{ autoEnable: boolean }>("/aws/macie2/organization/configuration"),
  });
}

export function useMcUpdateOrgConfiguration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (autoEnable: boolean) =>
      api<{ updated: boolean }>("/aws/macie2/organization/configuration", {
        method: "PATCH",
        body: JSON.stringify({ autoEnable }),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "macie2", "org-configuration"] }),
  });
}

export function useMcMembers(onlyAssociated?: boolean) {
  return useQuery({
    queryKey: ["aws", "macie2", "members", onlyAssociated ?? false],
    queryFn: () =>
      api<{ members: McMember[]; nextToken?: string }>(
        `/aws/macie2/members${onlyAssociated ? "?onlyAssociated=true" : ""}`
      ),
  });
}

export function useMcCreateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { accountId: string; email: string; tags?: Record<string, string> }) =>
      api<{ arn: string }>("/aws/macie2/members", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "macie2", "members"] }),
  });
}
