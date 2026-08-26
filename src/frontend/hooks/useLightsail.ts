import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

// ── Instances ──────────────────────────────────────────

export function useLightsailInstances() {
  return useQuery({
    queryKey: ["lightsail", "instances"],
    queryFn: () => api("/api/aws/lightsail/instances"),
  });
}

export function useLightsailInstance(name: string | null) {
  return useQuery({
    queryKey: ["lightsail", "instances", name],
    queryFn: () => api(`/api/aws/lightsail/instances/${name}`),
    enabled: !!name,
  });
}

export function useCreateLightsailInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      api("/api/aws/lightsail/instances", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lightsail", "instances"] }),
  });
}

export function useDeleteLightsailInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/api/aws/lightsail/instances/${encodeURIComponent(name)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lightsail", "instances"] }),
  });
}

export function useStartLightsailInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/api/aws/lightsail/instances/${encodeURIComponent(name)}/start`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lightsail", "instances"] }),
  });
}

export function useStopLightsailInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/api/aws/lightsail/instances/${encodeURIComponent(name)}/stop`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lightsail", "instances"] }),
  });
}

export function useRebootLightsailInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/api/aws/lightsail/instances/${encodeURIComponent(name)}/reboot`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lightsail", "instances"] }),
  });
}

// ── Disks ──────────────────────────────────────────────

export function useLightsailDisks() {
  return useQuery({
    queryKey: ["lightsail", "disks"],
    queryFn: () => api("/api/aws/lightsail/disks"),
  });
}

export function useLightsailDisk(name: string | null) {
  return useQuery({
    queryKey: ["lightsail", "disks", name],
    queryFn: () => api(`/api/aws/lightsail/disks/${name}`),
    enabled: !!name,
  });
}

export function useCreateLightsailDisk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      api("/api/aws/lightsail/disks", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lightsail", "disks"] }),
  });
}

export function useDeleteLightsailDisk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/api/aws/lightsail/disks/${encodeURIComponent(name)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lightsail", "disks"] }),
  });
}

// ── Static IPs ─────────────────────────────────────────

export function useLightsailStaticIps() {
  return useQuery({
    queryKey: ["lightsail", "staticIps"],
    queryFn: () => api("/api/aws/lightsail/static-ips"),
  });
}

export function useAllocateLightsailStaticIp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      api("/api/aws/lightsail/static-ips", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lightsail", "staticIps"] }),
  });
}

export function useReleaseLightsailStaticIp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/api/aws/lightsail/static-ips/${encodeURIComponent(name)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lightsail", "staticIps"] }),
  });
}

export function useAttachLightsailStaticIp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, instanceName }: { name: string; instanceName: string }) =>
      api(`/api/aws/lightsail/static-ips/${encodeURIComponent(name)}/attach`, {
        method: "POST",
        body: JSON.stringify({ instanceName }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lightsail", "staticIps"] }),
  });
}

export function useDetachLightsailStaticIp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/api/aws/lightsail/static-ips/${encodeURIComponent(name)}/detach`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lightsail", "staticIps"] }),
  });
}

// ── Key Pairs ──────────────────────────────────────────

export function useLightsailKeyPairs() {
  return useQuery({
    queryKey: ["lightsail", "keyPairs"],
    queryFn: () => api("/api/aws/lightsail/key-pairs"),
  });
}

export function useCreateLightsailKeyPair() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      api("/api/aws/lightsail/key-pairs", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lightsail", "keyPairs"] }),
  });
}

export function useDeleteLightsailKeyPair() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/api/aws/lightsail/key-pairs/${encodeURIComponent(name)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lightsail", "keyPairs"] }),
  });
}
