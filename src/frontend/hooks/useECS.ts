import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

// ─── Clusters ────────────────────────────────────────────

export function useECSClusters() {
  return useQuery({
    queryKey: ["aws", "ecs", "clusters"],
    queryFn: () => api<{ clusters: any[]; total: number }>("/aws/ecs/clusters"),
    refetchInterval: 10000,
  });
}

export function useECSCluster(clusterName: string | null) {
  return useQuery({
    queryKey: ["aws", "ecs", "clusters", clusterName],
    queryFn: () =>
      api<{ cluster: any }>(`/aws/ecs/clusters/${clusterName}`),
    enabled: !!clusterName,
  });
}

export function useCreateECSCluster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/ecs/clusters", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ecs", "clusters"] }),
  });
}

export function useDeleteECSCluster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cluster: string) =>
      api(`/aws/ecs/clusters?cluster=${encodeURIComponent(cluster)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ecs", "clusters"] }),
  });
}

// ─── Task Definitions ────────────────────────────────────

export function useECSTaskDefinitions(familyPrefix?: string) {
  return useQuery({
    queryKey: ["aws", "ecs", "task-definitions", familyPrefix],
    queryFn: () => {
      const qs = familyPrefix ? `?familyPrefix=${encodeURIComponent(familyPrefix)}` : "";
      return api<{ taskDefinitionArns: string[]; total: number }>(`/aws/ecs/task-definitions${qs}`);
    },
    refetchInterval: 15000,
  });
}

export function useECSTaskDefinitionFamilies(prefix?: string) {
  return useQuery({
    queryKey: ["aws", "ecs", "task-definition-families", prefix],
    queryFn: () => {
      const qs = prefix ? `?familyPrefix=${encodeURIComponent(prefix)}` : "";
      return api<{ families: string[] }>(`/aws/ecs/task-definition-families${qs}`);
    },
  });
}

export function useECSTaskDefinition(taskDefinition: string | null) {
  return useQuery({
    queryKey: ["aws", "ecs", "task-definition", taskDefinition],
    queryFn: () =>
      api<{ taskDefinition: any; tags: any[] }>(
        `/aws/ecs/task-definitions/${encodeURIComponent(taskDefinition!)}`
      ),
    enabled: !!taskDefinition,
  });
}

export function useRegisterECSTaskDefinition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/ecs/task-definitions", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "ecs", "task-definitions"] }),
  });
}

export function useDeregisterECSTaskDefinition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskDefinition: string) =>
      api(`/aws/ecs/task-definitions/${encodeURIComponent(taskDefinition)}`, { method: "DELETE" }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "ecs", "task-definitions"] }),
  });
}

// ─── Services ────────────────────────────────────────────

export function useECSServices(cluster: string | null) {
  return useQuery({
    queryKey: ["aws", "ecs", "services", cluster],
    queryFn: () =>
      api<{ services: any[]; total: number }>(`/aws/ecs/services?cluster=${encodeURIComponent(cluster!)}`),
    enabled: !!cluster,
    refetchInterval: 10000,
  });
}

export function useCreateECSService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/ecs/services", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ecs", "services"] }),
  });
}

export function useUpdateECSService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cluster, service, ...body }: any) =>
      api(
        `/aws/ecs/services?cluster=${encodeURIComponent(cluster)}&service=${encodeURIComponent(service)}`,
        { method: "PUT", body: JSON.stringify(body) }
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ecs", "services"] }),
  });
}

export function useDeleteECSService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cluster, service, force }: any) =>
      api(
        `/aws/ecs/services?cluster=${encodeURIComponent(cluster)}&service=${encodeURIComponent(service)}&force=${force ? "true" : "false"}`,
        { method: "DELETE" }
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ecs", "services"] }),
  });
}

// ─── Tasks ───────────────────────────────────────────────

export function useECSTasks(cluster: string | null, desiredStatus?: string) {
  return useQuery({
    queryKey: ["aws", "ecs", "tasks", cluster, desiredStatus],
    queryFn: () => {
      const params = new URLSearchParams({ cluster: cluster! });
      if (desiredStatus) params.set("desiredStatus", desiredStatus);
      return api<{ tasks: any[]; total: number }>(`/aws/ecs/tasks?${params.toString()}`);
    },
    enabled: !!cluster,
    refetchInterval: 5000,
  });
}

export function useRunECSTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/ecs/tasks/run", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ecs", "tasks"] }),
  });
}

export function useStopECSTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/ecs/tasks/stop", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ecs", "tasks"] }),
  });
}

// ─── Container Instances ─────────────────────────────────

export function useECSContainerInstances(cluster: string | null) {
  return useQuery({
    queryKey: ["aws", "ecs", "container-instances", cluster],
    queryFn: () =>
      api<{ containerInstances: any[]; total: number }>(
        `/aws/ecs/container-instances?cluster=${encodeURIComponent(cluster!)}`
      ),
    enabled: !!cluster,
    refetchInterval: 15000,
  });
}

export function useECSContainerInstanceDetail(cluster: string | null, instanceId: string | null) {
  return useQuery({
    queryKey: ["aws", "ecs", "container-instances", cluster, instanceId],
    queryFn: () =>
      api<{ instance: any }>(
        `/aws/ecs/container-instances/${encodeURIComponent(instanceId!)}?cluster=${encodeURIComponent(cluster!)}`
      ),
    enabled: !!cluster && !!instanceId,
  });
}

export function useDeregisterECSContainerInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/ecs/container-instances/deregister", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["aws", "ecs", "container-instances", vars.cluster] }),
  });
}

export function useUpdateECSContainerInstancesState() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/ecs/container-instances/state", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["aws", "ecs", "container-instances", vars.cluster] }),
  });
}

export function useUpdateECSContainerAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/ecs/container-instances/agent", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["aws", "ecs", "container-instances", vars.cluster] }),
  });
}

export function useStartECSTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/ecs/tasks/start", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ecs", "tasks"] }),
  });
}

export function useECSTaskProtection(cluster: string | null, taskId: string | null) {
  return useQuery({
    queryKey: ["aws", "ecs", "tasks", "protection", cluster, taskId],
    queryFn: () =>
      api<{ protections: any[] }>(
        `/aws/ecs/tasks/${encodeURIComponent(taskId!)}/protection?cluster=${encodeURIComponent(cluster!)}`
      ),
    enabled: !!cluster && !!taskId,
  });
}

export function useUpdateECSTaskProtection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/ecs/tasks/protection", { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({ queryKey: ["aws", "ecs", "tasks", "protection", vars.cluster] }),
  });
}

export function useDiscoverECSPollEndpoint() {
  return useMutation({
    mutationFn: (containerInstance: string) =>
      api(`/aws/ecs/poll-endpoint?containerInstance=${encodeURIComponent(containerInstance)}`),
  });
}

// ─── Tags ────────────────────────────────────────────────

export function useECSTags(resourceArn: string | null) {
  return useQuery({
    queryKey: ["aws", "ecs", "tags", resourceArn],
    queryFn: () =>
      api<{ tags: any[] }>(`/aws/ecs/tags?resourceArn=${encodeURIComponent(resourceArn!)}`),
    enabled: !!resourceArn,
  });
}

export function useTagECSResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/ecs/tags", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ecs", "tags"] }),
  });
}

export function useUntagECSResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ resourceArn, tagKeys }: { resourceArn: string; tagKeys: string[] }) =>
      api(
        `/aws/ecs/tags?resourceArn=${encodeURIComponent(resourceArn)}&tagKeys=${tagKeys.join(",")}`,
        { method: "DELETE" }
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ecs", "tags"] }),
  });
}

// ─── Account Settings ────────────────────────────────────

export interface ECSAccountSetting {
  name?: string;
  value?: string;
  principalArn?: string;
}

export function useECSAccountSettings(effectiveSettings = false) {
  return useQuery({
    queryKey: ["aws", "ecs", "account-settings", effectiveSettings],
    queryFn: () => {
      const qs = effectiveSettings ? "?effectiveSettings=true" : "";
      return api<{ settings: ECSAccountSetting[]; total: number }>(`/aws/ecs/account-settings${qs}`);
    },
  });
}

export function usePutECSAccountSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; value: string; isDefault?: boolean }) =>
      api("/aws/ecs/account-settings", { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ecs", "account-settings"] }),
  });
}

export function useDeleteECSAccountSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/ecs/account-settings?name=${encodeURIComponent(name)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ecs", "account-settings"] }),
  });
}

// ─── Attributes ──────────────────────────────────────────

export interface ECSAttribute {
  name?: string;
  value?: string;
  targetType?: string;
  targetId?: string;
}

export function useECSAttributes(cluster: string | null, targetType = "container-instance") {
  return useQuery({
    queryKey: ["aws", "ecs", "attributes", cluster, targetType],
    queryFn: () =>
      api<{ attributes: ECSAttribute[]; total: number }>(
        `/aws/ecs/attributes?cluster=${encodeURIComponent(cluster!)}&targetType=${encodeURIComponent(targetType)}`
      ),
    enabled: !!cluster,
  });
}

export function usePutECSAttributes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { cluster?: string; attributes: ECSAttribute[] }) =>
      api("/aws/ecs/attributes", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ecs", "attributes"] }),
  });
}

export function useDeleteECSAttributes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { cluster?: string; attributes: ECSAttribute[] }) =>
      api("/aws/ecs/attributes", { method: "DELETE", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ecs", "attributes"] }),
  });
}

// ─── Task Sets ───────────────────────────────────────────

export interface ECSTaskSet {
  id?: string;
  taskSetArn?: string;
  status?: string;
  taskDefinition?: string;
  computedDesiredCount?: number;
  runningCount?: number;
  scale?: { value?: number; unit?: string };
}

export function useECSTaskSets(cluster: string | null, service: string | null) {
  return useQuery({
    queryKey: ["aws", "ecs", "task-sets", cluster, service],
    queryFn: () =>
      api<{ taskSets: ECSTaskSet[]; total: number }>(
        `/aws/ecs/task-sets?cluster=${encodeURIComponent(cluster!)}&service=${encodeURIComponent(service!)}`
      ),
    enabled: !!cluster && !!service,
  });
}

export function useCreateECSTaskSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/ecs/task-sets", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ecs", "task-sets"] }),
  });
}

export function useUpdateECSTaskSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { cluster: string; service: string; taskSet: string; scale: { value: number; unit: string } }) =>
      api("/aws/ecs/task-sets", { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ecs", "task-sets"] }),
  });
}

export function useSetPrimaryECSTaskSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { cluster: string; service: string; primaryTaskSet: string }) =>
      api("/aws/ecs/task-sets/primary", { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ecs", "task-sets"] }),
  });
}

export function useDeleteECSTaskSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cluster, service, taskSet, force }: { cluster: string; service: string; taskSet: string; force?: boolean }) =>
      api(
        `/aws/ecs/task-sets?cluster=${encodeURIComponent(cluster)}&service=${encodeURIComponent(service)}&taskSet=${encodeURIComponent(taskSet)}${force ? "&force=true" : ""}`,
        { method: "DELETE" }
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ecs", "task-sets"] }),
  });
}

// ─── Service Deployments ─────────────────────────────────

export function useECSServiceDeployments(service: string | null, cluster: string | null) {
  return useQuery({
    queryKey: ["aws", "ecs", "service-deployments", service, cluster],
    queryFn: () =>
      api<{ serviceDeployments: any[]; total: number }>(
        `/aws/ecs/service-deployments?service=${encodeURIComponent(service!)}${cluster ? `&cluster=${encodeURIComponent(cluster)}` : ""}`
      ),
    enabled: !!service,
  });
}
