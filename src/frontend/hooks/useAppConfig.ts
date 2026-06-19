import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface AppConfigApplication {
  Id: string;
  Name: string;
  Description?: string;
}

export interface AppConfigEnvironment {
  Id: string;
  Name: string;
  ApplicationId: string;
  Description?: string;
  State?: string;
}

export interface AppConfigConfigurationProfile {
  Id: string;
  Name: string;
  ApplicationId: string;
  Type?: string;
  LocationUri?: string;
}

// ── Applications ─────────────────────────────────────────

export function useAppConfigApplications() {
  return useQuery<{ applications: AppConfigApplication[]; total: number }>({
    queryKey: ["aws", "appconfig", "applications"],
    queryFn: () => api("/aws/appconfig/applications"),
    refetchInterval: 10000,
  });
}

export function useCreateAppConfigApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { name: string; description?: string }) =>
      api("/aws/appconfig/applications", { method: "POST", body: JSON.stringify(params) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "appconfig", "applications"] }),
  });
}

export function useDeleteAppConfigApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/aws/appconfig/applications/${encodeURIComponent(id)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "appconfig", "applications"] }),
  });
}

// ── Environments ─────────────────────────────────────────

export function useAppConfigEnvironments(applicationId: string | null) {
  return useQuery<{ environments: AppConfigEnvironment[]; total: number }>({
    queryKey: ["aws", "appconfig", "environments", applicationId],
    queryFn: () => api(`/aws/appconfig/applications/${encodeURIComponent(applicationId!)}/environments`),
    enabled: !!applicationId,
  });
}

// ── Configuration Profiles ───────────────────────────────

export function useAppConfigProfiles(applicationId: string | null) {
  return useQuery<{ profiles: AppConfigConfigurationProfile[]; total: number }>({
    queryKey: ["aws", "appconfig", "profiles", applicationId],
    queryFn: () => api(`/aws/appconfig/applications/${encodeURIComponent(applicationId!)}/configuration-profiles`),
    enabled: !!applicationId,
  });
}
