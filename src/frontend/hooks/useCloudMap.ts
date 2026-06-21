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
