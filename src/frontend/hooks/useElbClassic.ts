import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface ElbClassicLoadBalancer {
  name: string;
  dnsName: string | null;
  scheme: string | null;
  createdTime: string | null;
  vpcId: string | null;
  zones: string[];
  subnets: string[];
  securityGroups: string[];
  instances: string[];
  listeners: any[];
}

const BASE = "/aws/elb-classic";
const nameQ = (name: string) => `?name=${encodeURIComponent(name)}`;

// ---------- Load balancers ----------

export function useElbLoadBalancers() {
  return useQuery({
    queryKey: ["elbclassic", "load-balancers"],
    queryFn: () =>
      api<{ loadBalancers: ElbClassicLoadBalancer[]; total: number }>(`${BASE}/load-balancers`),
  });
}

export function useElbLoadBalancerDetail(name: string | null) {
  return useQuery({
    queryKey: ["elbclassic", "load-balancers", "detail", name],
    queryFn: () => api<{ loadBalancer: any }>(`${BASE}/load-balancers/detail${nameQ(name!)}`),
    enabled: !!name,
  });
}

export function useElbCreateLoadBalancer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      name: string;
      zones: string;
      listener: { protocol: string; port: string; instancePort: string };
      scheme?: string;
    }) => api(`${BASE}/load-balancers`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["elbclassic"] }),
  });
}

export function useElbDeleteLoadBalancer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api(`${BASE}/load-balancers${nameQ(name)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["elbclassic"] }),
  });
}

export function useElbAttributes(name: string | null) {
  return useQuery({
    queryKey: ["elbclassic", "attributes", name],
    queryFn: () => api<any>(`${BASE}/load-balancers/attributes${nameQ(name!)}`),
    enabled: !!name,
  });
}

export function useElbUpdateAttributes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; attributes: any }) =>
      api(`${BASE}/load-balancers/attributes`, { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["elbclassic"] }),
  });
}

// ---------- Listeners ----------

export function useElbAddListeners() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      name: string;
      listeners: { protocol: string; port: string; instancePort: string }[];
    }) => api(`${BASE}/listeners`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["elbclassic"] }),
  });
}

export function useElbDeleteListeners() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; ports: string }) =>
      api(`${BASE}/listeners${nameQ(body.name)}&ports=${encodeURIComponent(body.ports)}`, {
        method: "DELETE",
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["elbclassic"] }),
  });
}

// ---------- Instances and health ----------

export function useElbInstanceHealth(name: string | null) {
  return useQuery({
    queryKey: ["elbclassic", "health", name],
    queryFn: () =>
      api<{ instanceStates: any[]; total: number }>(`${BASE}/health${nameQ(name!)}`),
    enabled: !!name,
  });
}

export function useElbRegisterInstances() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; instances: string }) =>
      api(`${BASE}/instances/register`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["elbclassic"] }),
  });
}

export function useElbDeregisterInstances() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; instances: string }) =>
      api(`${BASE}/instances/deregister`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["elbclassic"] }),
  });
}

export function useElbConfigureHealthCheck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      name: string;
      healthCheck: {
        target: string;
        interval?: string;
        timeout?: string;
        healthyThreshold?: string;
        unhealthyThreshold?: string;
      };
    }) => api(`${BASE}/health-check`, { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["elbclassic"] }),
  });
}

// ---------- Networking ----------

export function useElbApplySecurityGroups() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; securityGroups: string }) =>
      api(`${BASE}/security-groups`, { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["elbclassic"] }),
  });
}

export function useElbAttachSubnets() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; subnets: string }) =>
      api(`${BASE}/subnets/attach`, { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["elbclassic"] }),
  });
}

export function useElbDetachSubnets() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; subnets: string }) =>
      api(`${BASE}/subnets/detach`, { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["elbclassic"] }),
  });
}

export function useElbEnableZones() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; zones: string }) =>
      api(`${BASE}/zones/enable`, { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["elbclassic"] }),
  });
}

export function useElbDisableZones() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; zones: string }) =>
      api(`${BASE}/zones/disable`, { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["elbclassic"] }),
  });
}

// ---------- Tags ----------

export function useElbTags(name: string | null) {
  return useQuery({
    queryKey: ["elbclassic", "tags", name],
    queryFn: () => api<{ tags: { Key: string; Value?: string }[] }>(`${BASE}/tags${nameQ(name!)}`),
    enabled: !!name,
  });
}

export function useElbAddTags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; tags: { Key: string; Value?: string }[] }) =>
      api(`${BASE}/tags`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["elbclassic"] }),
  });
}

export function useElbRemoveTags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; keys: string }) =>
      api(`${BASE}/tags/remove`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["elbclassic"] }),
  });
}

export function useElbAccountLimits() {
  return useQuery({
    queryKey: ["elbclassic", "account-limits"],
    queryFn: () => api<{ limits: any[] }>(`${BASE}/account-limits`),
  });
}
