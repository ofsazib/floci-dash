import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

// ─── Backup Plans ───────────────────────────────────────

export function useBackupPlans() {
  return useQuery({
    queryKey: ["aws", "backup", "plans"],
    queryFn: () => api<{ plans: any[]; total: number }>("/aws/backup/plans"),
  });
}

export function useCreateBackupPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/backup/plans", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "backup", "plans"] }),
  });
}

export function useBackupPlan(id: string | null) {
  return useQuery({
    queryKey: ["aws", "backup", "plans", id],
    queryFn: () => api<any>(`/aws/backup/plans/${encodeURIComponent(id!)}`),
    enabled: !!id,
  });
}

export function useDeleteBackupPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/aws/backup/plans/${encodeURIComponent(id)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "backup", "plans"] }),
  });
}

// ─── Backup Vaults ──────────────────────────────────────

export function useBackupVaults() {
  return useQuery({
    queryKey: ["aws", "backup", "backup-vaults"],
    queryFn: () => api<{ backupVaults: any[]; total: number }>("/aws/backup/backup-vaults"),
  });
}

export function useCreateBackupVault() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/backup/backup-vaults", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "backup", "backup-vaults"] }),
  });
}

export function useBackupVault(name: string | null) {
  return useQuery({
    queryKey: ["aws", "backup", "backup-vaults", name],
    queryFn: () => api<any>(`/aws/backup/backup-vaults/${encodeURIComponent(name!)}`),
    enabled: !!name,
  });
}

export function useDeleteBackupVault() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/backup/backup-vaults/${encodeURIComponent(name)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "backup", "backup-vaults"] }),
  });
}

// ─── Backup Selections ──────────────────────────────────

export function useBackupSelections(planId: string | null) {
  return useQuery({
    queryKey: ["aws", "backup", "plans", planId, "selections"],
    queryFn: () => api<{ backupSelections: any[]; total: number }>(
      `/aws/backup/plans/${encodeURIComponent(planId!)}/selections`
    ),
    enabled: !!planId,
  });
}

export function useCreateBackupSelection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, ...body }: any) =>
      api(`/aws/backup/plans/${encodeURIComponent(planId)}/selections`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({
        queryKey: ["aws", "backup", "plans", variables.planId, "selections"],
      }),
  });
}

export function useDeleteBackupSelection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, selectionId }: { planId: string; selectionId: string }) =>
      api(`/aws/backup/plans/${encodeURIComponent(planId)}/selections/${encodeURIComponent(selectionId)}`, {
        method: "DELETE",
      }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({
        queryKey: ["aws", "backup", "plans", variables.planId, "selections"],
      }),
  });
}

// ─── Backup Jobs ────────────────────────────────────────

export function useBackupJobs() {
  return useQuery({
    queryKey: ["aws", "backup", "jobs"],
    queryFn: () => api<{ backupJobs: any[]; total: number }>("/aws/backup/jobs"),
  });
}

export function useStartBackupJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/backup/jobs", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "backup", "jobs"] }),
  });
}

export function useBackupJob(jobId: string | null) {
  return useQuery({
    queryKey: ["aws", "backup", "jobs", jobId],
    queryFn: () => api<any>(`/aws/backup/jobs/${encodeURIComponent(jobId!)}`),
    enabled: !!jobId,
  });
}

export function useStopBackupJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) =>
      api(`/aws/backup/jobs/${encodeURIComponent(jobId)}/stop`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "backup", "jobs"] }),
  });
}

// ─── Tags ───────────────────────────────────────────────

export function useBackupTags(resourceArn: string | null) {
  return useQuery({
    queryKey: ["aws", "backup", "tags", resourceArn],
    queryFn: () =>
      api<{ tags: Record<string, string> }>(
        `/aws/backup/tags?resourceArn=${encodeURIComponent(resourceArn!)}`
      ),
    enabled: !!resourceArn,
  });
}

// ── Recovery Points ────────────────────────────────────

export interface BackupRecoveryPoint {
  arn: string;
  resourceArn: string;
  resourceType: string;
  status: string;
  creationDate?: string;
  vaultName: string;
}

export function useBackupRecoveryPoints(vaultName: string | null) {
  return useQuery<{ recoveryPoints: BackupRecoveryPoint[]; total: number }>({
    queryKey: ["aws", "backup", "vaults", vaultName, "recovery-points"],
    queryFn: () =>
      api(`/aws/backup/backup-vaults/${encodeURIComponent(vaultName!)}/recovery-points`),
    enabled: !!vaultName,
  });
}

export function useDeleteBackupRecoveryPoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { vaultName: string; arn: string }) =>
      api(
        `/aws/backup/backup-vaults/${encodeURIComponent(params.vaultName)}/recovery-points/${encodeURIComponent(params.arn)}`,
        { method: "DELETE" }
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "backup", "vaults"] }),
  });
}

// ─── Vault Access Policy ────────────────────────────────

export function useBackupVaultAccessPolicy(name: string | null) {
  return useQuery({
    queryKey: ["aws", "backup", "backup-vaults", name, "access-policy"],
    queryFn: () => api<{ policy: string | null }>(
      `/aws/backup/backup-vaults/${encodeURIComponent(name!)}/access-policy`
    ),
    enabled: !!name,
  });
}

export function usePutBackupVaultAccessPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { vaultName: string; policy: string }) =>
      api(`/aws/backup/backup-vaults/${encodeURIComponent(body.vaultName)}/access-policy`, {
        method: "PUT",
        body: JSON.stringify({ policy: body.policy }),
      }),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ["aws", "backup", "backup-vaults", v.vaultName, "access-policy"] }),
  });
}

export function useDeleteBackupVaultAccessPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vaultName: string) =>
      api(`/aws/backup/backup-vaults/${encodeURIComponent(vaultName)}/access-policy`, { method: "DELETE" }),
    onSuccess: (_d, vaultName) =>
      qc.invalidateQueries({ queryKey: ["aws", "backup", "backup-vaults", vaultName, "access-policy"] }),
  });
}

// ─── Vault Notifications ────────────────────────────────

export function useBackupVaultNotifications(name: string | null) {
  return useQuery({
    queryKey: ["aws", "backup", "backup-vaults", name, "notifications"],
    queryFn: () => api<{ notifications: { snsTopicArn: string | null; backupVaultEvents: string[] } }>(
      `/aws/backup/backup-vaults/${encodeURIComponent(name!)}/notifications`
    ),
    enabled: !!name,
  });
}

export function usePutBackupVaultNotifications() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { vaultName: string; snsTopicArn: string; backupVaultEvents: string[] }) =>
      api(`/aws/backup/backup-vaults/${encodeURIComponent(body.vaultName)}/notifications`, {
        method: "PUT",
        body: JSON.stringify({ snsTopicArn: body.snsTopicArn, backupVaultEvents: body.backupVaultEvents }),
      }),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ["aws", "backup", "backup-vaults", v.vaultName, "notifications"] }),
  });
}

export function useDeleteBackupVaultNotifications() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vaultName: string) =>
      api(`/aws/backup/backup-vaults/${encodeURIComponent(vaultName)}/notifications`, { method: "DELETE" }),
    onSuccess: (_d, vaultName) =>
      qc.invalidateQueries({ queryKey: ["aws", "backup", "backup-vaults", vaultName, "notifications"] }),
  });
}

// ─── Vault Lock ─────────────────────────────────────────

export function usePutBackupVaultLockConfiguration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { vaultName: string; retentionDays: number; maxRetentionDays?: number; changeableForDays?: number }) =>
      api(`/aws/backup/backup-vaults/${encodeURIComponent(body.vaultName)}/vault-lock`, {
        method: "PUT",
        body: JSON.stringify({
          retentionDays: body.retentionDays,
          maxRetentionDays: body.maxRetentionDays,
          changeableForDays: body.changeableForDays,
        }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "backup", "backup-vaults"] }),
  });
}

export function useDeleteBackupVaultLockConfiguration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vaultName: string) =>
      api(`/aws/backup/backup-vaults/${encodeURIComponent(vaultName)}/vault-lock`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "backup", "backup-vaults"] }),
  });
}
