import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

// ─── Applications ─────────────────────────────────────

export function useCodeDeployApplications() {
  return useQuery({
    queryKey: ["aws", "codedeploy", "applications"],
    queryFn: () => api<{ applications: any[]; total: number }>("/aws/codedeploy/applications"),
  });
}

export function useCreateCodeDeployApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/codedeploy/applications", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "codedeploy", "applications"] }),
  });
}

export function useCodeDeployApplication(name: string | null) {
  return useQuery({
    queryKey: ["aws", "codedeploy", "applications", name],
    queryFn: () => api<any>(`/aws/codedeploy/applications/${name}`),
    enabled: !!name,
  });
}

export function useDeleteCodeDeployApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/codedeploy/applications/${name}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "codedeploy", "applications"] }),
  });
}

// ─── Deployment Groups ────────────────────────────────

export function useCodeDeployDeploymentGroups(name: string | null) {
  return useQuery({
    queryKey: ["aws", "codedeploy", "applications", name, "deployment-groups"],
    queryFn: () => api<{ deploymentGroups: any[]; total: number }>(`/aws/codedeploy/applications/${name}/deployment-groups`),
    enabled: !!name,
  });
}

export function useCreateCodeDeployDeploymentGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ appName, ...body }: any) =>
      api(`/aws/codedeploy/applications/${appName}/deployment-groups`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({
        queryKey: ["aws", "codedeploy", "applications", variables.appName, "deployment-groups"],
      }),
  });
}

// ─── Deployment Configs ───────────────────────────────

export function useCodeDeployDeploymentConfigs() {
  return useQuery({
    queryKey: ["aws", "codedeploy", "deployment-configs"],
    queryFn: () => api<{ deploymentConfigs: any[]; total: number }>("/aws/codedeploy/deployment-configs"),
  });
}

export function useCreateCodeDeployDeploymentConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/codedeploy/deployment-configs", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "codedeploy", "deployment-configs"] }),
  });
}

// ─── Deployments ──────────────────────────────────────

export function useCreateCodeDeployDeployment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ appName, ...body }: any) =>
      api(`/aws/codedeploy/applications/${appName}/deployments`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({
        queryKey: ["aws", "codedeploy", "applications", variables.appName, "deployments"],
      }),
  });
}

export function useCodeDeployDeployments(name: string | null) {
  return useQuery({
    queryKey: ["aws", "codedeploy", "applications", name, "deployments"],
    queryFn: () => api<{ deployments: any[]; total: number }>(`/aws/codedeploy/applications/${name}/deployments`),
    enabled: !!name,
  });
}
