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

// ─── On-Premises Instances ─────────────────────────────

export function useCodeDeployOnPremInstances() {
  return useQuery({
    queryKey: ["aws", "codedeploy", "on-prem-instances"],
    queryFn: () => api<{ instances: any[]; total: number }>("/aws/codedeploy/on-prem-instances"),
  });
}

export function useRegisterCodeDeployOnPremInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { instanceName: string; iamSessionArn?: string; iamUserArn?: string }) =>
      api("/aws/codedeploy/on-prem-instances", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "codedeploy", "on-prem-instances"] }),
  });
}

export function useDeregisterCodeDeployOnPremInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/codedeploy/on-prem-instances/${encodeURIComponent(name)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "codedeploy", "on-prem-instances"] }),
  });
}

export function useAddCodeDeployOnPremTags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { instanceNames: string[]; tags: { Key: string; Value: string }[] }) =>
      api("/aws/codedeploy/on-prem-instances/tags", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "codedeploy", "on-prem-instances"] }),
  });
}

export function useRemoveCodeDeployOnPremTags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { instanceNames: string[]; tags: { Key: string; Value: string }[] }) =>
      api("/aws/codedeploy/on-prem-instances/untag", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "codedeploy", "on-prem-instances"] }),
  });
}

// ─── Deployment Targets & Lifecycle ────────────────────

export function useContinueCodeDeployDeployment() {
  return useMutation({
    mutationFn: (id: string) =>
      api(`/aws/codedeploy/deployments/${encodeURIComponent(id)}/continue`, { method: "POST" }),
  });
}

export function usePutCodeDeployLifecycleHookStatus() {
  return useMutation({
    mutationFn: (params: { id: string; lifecycleEventHookExecutionId: string; status?: string }) =>
      api(`/aws/codedeploy/deployments/${encodeURIComponent(params.id)}/lifecycle-hook-status`, {
        method: "POST",
        body: JSON.stringify({
          lifecycleEventHookExecutionId: params.lifecycleEventHookExecutionId,
          status: params.status,
        }),
      }),
  });
}

export function useCodeDeployDeploymentTargets(id: string | null) {
  return useQuery({
    queryKey: ["aws", "codedeploy", "deployments", id, "targets"],
    queryFn: async () => {
      const list = await api<{ targetIds: string[] }>(
        `/aws/codedeploy/deployments/${id}/targets`
      );
      if (!list.targetIds?.length) return { targets: [] as any[] };
      const detailed = await api<{ targets: any[] }>(
        `/aws/codedeploy/deployments/${id}/targets`,
        { method: "POST", body: JSON.stringify({ targetIds: list.targetIds }) }
      );
      return { targets: detailed.targets || [] };
    },
    enabled: !!id,
  });
}

export function useStopCodeDeployDeployment() {
  return useMutation({
    mutationFn: (id: string) =>
      api(`/aws/codedeploy/deployments/${encodeURIComponent(id)}/stop`, { method: "POST" }),
  });
}

export function useUpdateCodeDeployDeploymentGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      appName: string;
      groupName: string;
      newDeploymentGroupName?: string;
      deploymentConfigName?: string;
      serviceRoleArn?: string;
    }) =>
      api(
        `/aws/codedeploy/deployment-groups/${encodeURIComponent(params.appName)}/${encodeURIComponent(params.groupName)}`,
        {
          method: "PUT",
          body: JSON.stringify({
            newDeploymentGroupName: params.newDeploymentGroupName,
            deploymentConfigName: params.deploymentConfigName,
            serviceRoleArn: params.serviceRoleArn,
          }),
        }
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "codedeploy", "applications"] }),
  });
}
