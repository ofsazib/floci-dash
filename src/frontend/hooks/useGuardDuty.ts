import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export function useGuardDutyDetectors() {
  return useQuery<{ detectorIds: string[]; total: number; nextToken: string | null }>({
    queryKey: ["aws", "guardduty", "detectors"],
    queryFn: () => api("/aws/guardduty/detectors"),
  });
}

export function useGuardDutyDetector(id: string | null) {
  return useQuery<{ detector: any }>({
    queryKey: ["aws", "guardduty", "detectors", id],
    queryFn: () => api(`/aws/guardduty/detectors/${encodeURIComponent(id!)}`),
    enabled: !!id,
  });
}

export function useCreateGuardDutyDetector() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { enable: boolean; frequency?: string }) =>
      api("/aws/guardduty/detectors", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "guardduty", "detectors"] }),
  });
}

export function useUpdateGuardDutyDetector() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; enable?: boolean; frequency?: string }) =>
      api(`/aws/guardduty/detectors/${encodeURIComponent(params.id)}`, {
        method: "PATCH",
        body: JSON.stringify({ enable: params.enable, frequency: params.frequency }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "guardduty", "detectors"] }),
  });
}

export function useDeleteGuardDutyDetector() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/aws/guardduty/detectors/${encodeURIComponent(id)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "guardduty", "detectors"] }),
  });
}

// ─── Members ────────────────────────────────────────────

export function useGuardDutyMembers(detectorId: string | null) {
  return useQuery<{ members: any[]; total: number }>({
    queryKey: ["aws", "guardduty", "detectors", detectorId, "members"],
    queryFn: () => api(`/aws/guardduty/detectors/${encodeURIComponent(detectorId!)}/members`),
    enabled: !!detectorId,
  });
}

export function useCreateGuardDutyMembers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { detectorId: string; accounts: { accountId: string; email?: string }[] }) =>
      api(`/aws/guardduty/detectors/${encodeURIComponent(params.detectorId)}/members`, {
        method: "POST",
        body: JSON.stringify({ accounts: params.accounts }),
      }),
    onSuccess: (_d, params) =>
      qc.invalidateQueries({ queryKey: ["aws", "guardduty", "detectors", params.detectorId, "members"] }),
  });
}

// ─── Organization configuration ─────────────────────────

export function useGuardDutyOrgConfig(detectorId: string | null) {
  return useQuery<{ autoEnable: boolean; memberAccountLimitReached: boolean }>({
    queryKey: ["aws", "guardduty", "detectors", detectorId, "orgConfig"],
    queryFn: () => api(`/aws/guardduty/detectors/${encodeURIComponent(detectorId!)}/organization-config`),
    enabled: !!detectorId,
  });
}

export function useUpdateGuardDutyOrgConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { detectorId: string; autoEnable: boolean }) =>
      api(`/aws/guardduty/detectors/${encodeURIComponent(params.detectorId)}/organization-config`, {
        method: "PUT",
        body: JSON.stringify({ autoEnable: params.autoEnable }),
      }),
    onSuccess: (_d, params) =>
      qc.invalidateQueries({ queryKey: ["aws", "guardduty", "detectors", params.detectorId, "orgConfig"] }),
  });
}

// ─── Organization admin account ─────────────────────────

export function useEnableGuardDutyAdminAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (adminAccountId: string) =>
      api("/aws/guardduty/admin/enable", {
        method: "POST",
        body: JSON.stringify({ adminAccountId }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "guardduty", "detectors"] }),
  });
}

export function useDisableGuardDutyAdminAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (adminAccountId: string) =>
      api("/aws/guardduty/admin/disable", {
        method: "POST",
        body: JSON.stringify({ adminAccountId }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "guardduty", "detectors"] }),
  });
}
