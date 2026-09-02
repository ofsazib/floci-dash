import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface CloudMapNamespace {
  Id: string;
  Name: string;
  Type?: string;
  Arn?: string;
  Description?: string;
}

export interface CloudMapService {
  Id: string;
  Name: string;
  Arn?: string;
  NamespaceId?: string;
  Description?: string;
  Type?: string;
}

export interface CloudMapInstance {
  Id: string;
  ServiceId?: string;
  InstanceAttributes?: Record<string, string>;
}

// ── Namespaces ───────────────────────────────────────────

export function useCloudMapNamespaces() {
  return useQuery<{ namespaces: CloudMapNamespace[]; total: number }>({
    queryKey: ["aws", "cloudmap", "namespaces"],
    queryFn: () => api("/aws/servicediscovery/namespaces"),
    refetchInterval: 10000,
  });
}

export function useCreateCloudMapNamespace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { name: string; description?: string }) =>
      api("/aws/servicediscovery/namespaces", { method: "POST", body: JSON.stringify(params) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "cloudmap", "namespaces"] }),
  });
}

export function useDeleteCloudMapNamespace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/aws/servicediscovery/namespaces/${encodeURIComponent(id)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "cloudmap", "namespaces"] }),
  });
}

// ── Services ─────────────────────────────────────────────

export function useCloudMapServices(namespaceId: string | null) {
  const qs = namespaceId ? `?namespaceId=${encodeURIComponent(namespaceId)}` : "";
  return useQuery<{ services: CloudMapService[]; total: number }>({
    queryKey: ["aws", "cloudmap", "services", namespaceId],
    queryFn: () => api(`/aws/servicediscovery/services${qs}`),
    enabled: namespaceId !== undefined,
    refetchInterval: 10000,
  });
}

export function useDeleteCloudMapService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/aws/servicediscovery/services/${encodeURIComponent(id)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "cloudmap", "services"] }),
  });
}

// ── Instances ────────────────────────────────────────────

export function useCloudMapInstances(serviceId: string | null) {
  return useQuery<{ instances: CloudMapInstance[]; total: number }>({
    queryKey: ["aws", "cloudmap", "instances", serviceId],
    queryFn: () => api(`/aws/servicediscovery/services/${encodeURIComponent(serviceId!)}/instances`),
    enabled: !!serviceId,
  });
}

export function useRegisterCloudMapInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { serviceId: string; instanceId: string; attributes?: Record<string, string> }) =>
      api(`/aws/servicediscovery/services/${encodeURIComponent(params.serviceId)}/instances`, {
        method: "POST",
        body: JSON.stringify({ instanceId: params.instanceId, attributes: params.attributes }),
      }),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ["aws", "cloudmap", "instances", v.serviceId] }),
  });
}

export function useDeregisterCloudMapInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { serviceId: string; instanceId: string }) =>
      api(
        `/aws/servicediscovery/services/${encodeURIComponent(params.serviceId)}/instances/${encodeURIComponent(params.instanceId)}`,
        { method: "DELETE" }
      ),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ["aws", "cloudmap", "instances", v.serviceId] }),
  });
}

export function useDiscoverCloudMapInstances() {
  return useMutation({
    mutationFn: (body: { namespaceName: string; serviceName: string; maxResults?: number }) =>
      api("/aws/servicediscovery/discover", { method: "POST", body: JSON.stringify(body) }),
  });
}

export interface CloudMapOperation {
  id: string;
  status: string;
  createDate?: string;
  updateDate?: string;
  targets?: Record<string, string>;
}

export function useCloudMapOperations() {
  return useQuery<{ operations: CloudMapOperation[]; total: number }>({
    queryKey: ["aws", "cloudmap", "operations"],
    queryFn: () => api("/aws/servicediscovery/operations"),
  });
}

export function useCloudMapOperation(operationId: string | null) {
  return useQuery<{ operation: CloudMapOperation | null }>({
    queryKey: ["aws", "cloudmap", "operations", operationId],
    queryFn: () => api(`/aws/servicediscovery/operations/${encodeURIComponent(operationId!)}`),
    enabled: !!operationId,
  });
}

export function useCloudMapInstance(serviceId: string | null, instanceId: string | null) {
  return useQuery<any>({
    queryKey: ["aws", "cloudmap", "instances", serviceId, instanceId],
    queryFn: () =>
      api(
        `/aws/servicediscovery/services/${encodeURIComponent(serviceId!)}/instances/${encodeURIComponent(instanceId!)}`
      ),
    enabled: !!serviceId && !!instanceId,
  });
}

export function useCreateCloudMapPrivateDnsNamespace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; vpc: string; description?: string }) =>
      api("/aws/servicediscovery/namespaces/private-dns", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "cloudmap", "namespaces"] }),
  });
}

export function useCreateCloudMapPublicDnsNamespace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; description?: string }) =>
      api("/aws/servicediscovery/namespaces/public-dns", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "cloudmap", "namespaces"] }),
  });
}
