import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface I2DelegatedAdmin {
  accountId?: string;
  status?: string;
}

export interface I2AccountStatus {
  accountId?: string;
  status?: string;
}

const enc = encodeURIComponent;

export function useI2DelegatedAdmins() {
  return useQuery({
    queryKey: ["aws", "inspector2", "delegated-admins"],
    queryFn: () =>
      api<{ delegatedAdminAccounts: I2DelegatedAdmin[]; total: number }>(
        "/aws/inspector2/delegated-admins"
      ),
  });
}

export function useI2EnableDelegatedAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (accountId: string) =>
      api<{ delegatedAdminAccountId: string }>(
        "/aws/inspector2/delegated-admins/enable",
        { method: "POST", body: JSON.stringify({ accountId }) }
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "inspector2", "delegated-admins"] }),
  });
}

export function useI2DisableDelegatedAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (accountId: string) =>
      api<{ delegatedAdminAccountId: string }>(
        "/aws/inspector2/delegated-admins/disable",
        { method: "POST", body: JSON.stringify({ accountId }) }
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "inspector2", "delegated-admins"] }),
  });
}

export function useI2AccountStatus(accountIds: string[] | null) {
  return useQuery({
    queryKey: ["aws", "inspector2", "account-status", accountIds],
    queryFn: () =>
      api<{ accounts: I2AccountStatus[]; failedAccounts: unknown[] }>(
        "/aws/inspector2/account-status",
        { method: "POST", body: JSON.stringify({ accountIds }) }
      ),
    enabled: !!accountIds && accountIds.length > 0,
  });
}

export function useI2Enable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (resourceTypes: string[]) =>
      api<{ accounts: I2AccountStatus[] }>("/aws/inspector2/enable", {
        method: "POST",
        body: JSON.stringify({ resourceTypes }),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "inspector2"] }),
  });
}

export function useI2OrgConfiguration() {
  return useQuery({
    queryKey: ["aws", "inspector2", "org-configuration"],
    queryFn: () =>
      api<{ organizationConfiguration: Record<string, boolean> | null }>(
        "/aws/inspector2/organization-configuration"
      ),
  });
}

export function useI2UpdateOrgConfiguration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (autoEnable: Record<string, boolean>) =>
      api<{ organizationConfiguration: Record<string, boolean> | null }>(
        "/aws/inspector2/organization-configuration",
        { method: "PUT", body: JSON.stringify({ autoEnable }) }
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "inspector2", "org-configuration"] }),
  });
}
