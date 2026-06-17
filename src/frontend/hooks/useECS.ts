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
        `/aws/ecs/task-definitions/${encodeURIComponent(taskDefinition || "")}`
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
