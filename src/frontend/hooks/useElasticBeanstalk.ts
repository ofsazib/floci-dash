import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

// ─── Applications ─────────────────────────────────────

export function useApplications() {
  return useQuery({
    queryKey: ["aws", "elasticbeanstalk", "applications"],
    queryFn: () => api<{ applications: any[]; total: number }>("/aws/elasticbeanstalk/applications"),
  });
}

export function useApplication(name: string | null) {
  return useQuery({
    queryKey: ["aws", "elasticbeanstalk", "applications", name],
    queryFn: () => api<any>(`/aws/elasticbeanstalk/applications/${name}`),
    enabled: !!name,
  });
}

export function useCreateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/elasticbeanstalk/applications", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "elasticbeanstalk", "applications"] }),
  });
}

export function useDeleteApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/elasticbeanstalk/applications/${name}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "elasticbeanstalk", "applications"] }),
  });
}

// ─── Application Versions ─────────────────────────────

export function useApplicationVersions(appName: string | null) {
  return useQuery({
    queryKey: ["aws", "elasticbeanstalk", "applications", appName, "versions"],
    queryFn: () => api<{ versions: any[]; total: number }>(`/aws/elasticbeanstalk/applications/${appName}/versions`),
    enabled: !!appName,
  });
}

export function useCreateApplicationVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ appName, ...body }: any) =>
      api(`/aws/elasticbeanstalk/applications/${appName}/versions`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ["aws", "elasticbeanstalk", "applications", variables.appName, "versions"] }),
  });
}

export function useDeleteApplicationVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ appName, versionLabel }: { appName: string; versionLabel: string }) =>
      api(`/aws/elasticbeanstalk/applications/${appName}/versions/${encodeURIComponent(versionLabel)}`, { method: "DELETE" }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ["aws", "elasticbeanstalk", "applications", variables.appName, "versions"] }),
  });
}

// ─── Environments ─────────────────────────────────────

export function useEnvironments(appName: string | null) {
  return useQuery({
    queryKey: ["aws", "elasticbeanstalk", "applications", appName, "environments"],
    queryFn: () => api<{ environments: any[]; total: number }>(`/aws/elasticbeanstalk/applications/${appName}/environments`),
    enabled: !!appName,
  });
}

export function useEnvironment(appName: string | null, envName: string | null) {
  return useQuery({
    queryKey: ["aws", "elasticbeanstalk", "applications", appName, "environments", envName],
    queryFn: () => api<any>(`/aws/elasticbeanstalk/environments/${envName}?applicationName=${appName}`),
    enabled: !!appName && !!envName,
  });
}

export function useCreateEnvironment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ appName, ...body }: any) =>
      api(`/aws/elasticbeanstalk/applications/${appName}/environments`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ["aws", "elasticbeanstalk", "applications", variables.appName, "environments"] }),
  });
}

export function useDeleteEnvironment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (envName: string) =>
      api(`/aws/elasticbeanstalk/environments/${envName}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "elasticbeanstalk", "applications"] }),
  });
}

// ─── Configuration ────────────────────────────────────

export function useConfigurationSettings(appName: string | null, envName: string | null) {
  return useQuery({
    queryKey: ["aws", "elasticbeanstalk", "applications", appName, "environments", envName, "configuration"],
    queryFn: () => api<any>(`/aws/elasticbeanstalk/applications/${appName}/environments/${envName}/configuration`),
    enabled: !!appName && !!envName,
  });
}

// ─── Utility ──────────────────────────────────────────

export function useSolutionStacks() {
  return useQuery({
    queryKey: ["aws", "elasticbeanstalk", "solution-stacks"],
    queryFn: () => api<{ solutionStacks: string[] }>("/aws/elasticbeanstalk/solution-stacks"),
    staleTime: 5 * 60 * 1000, // solution stacks rarely change
  });
}

export function useCheckDnsAvailability() {
  return useMutation({
    mutationFn: (cnamePrefix: string) =>
      api<{ available: boolean; fullyQualifiedCNAME: string }>(`/aws/elasticbeanstalk/check-dns-availability/${cnamePrefix}`),
  });
}
