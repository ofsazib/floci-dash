import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export function useConnectInstances() {
  return useQuery({
    queryKey: ["aws", "connect", "instances"],
    queryFn: () => api<{ instances: any[]; total: number }>("/aws/connect/instances"),
  });
}

export function useConnectInstance(instanceId: string | null) {
  return useQuery({
    queryKey: ["aws", "connect", "instances", instanceId],
    queryFn: () =>
      api<{ instance: any }>(`/aws/connect/instances/${encodeURIComponent(instanceId!)}`),
    enabled: !!instanceId,
  });
}

export function useCreateConnectInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/connect/instances", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "connect", "instances"] }),
  });
}

export function useDeleteConnectInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (instanceId: string) =>
      api(`/aws/connect/instances/${encodeURIComponent(instanceId)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "connect", "instances"] }),
  });
}

export function useConnectAttributes(instanceId: string | null) {
  return useQuery({
    queryKey: ["aws", "connect", "instances", instanceId, "attributes"],
    queryFn: () =>
      api<{ attributes: any[]; total: number }>(
        `/aws/connect/instances/${encodeURIComponent(instanceId!)}/attributes`
      ),
    enabled: !!instanceId,
  });
}

export function useUpdateConnectAttribute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      instanceId,
      attributeType,
      value,
    }: {
      instanceId: string;
      attributeType: string;
      value: string;
    }) =>
      api(
        `/aws/connect/instances/${encodeURIComponent(instanceId)}/attribute/${encodeURIComponent(attributeType)}`,
        { method: "PUT", body: JSON.stringify({ value }) }
      ),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({
        queryKey: ["aws", "connect", "instances", variables.instanceId, "attributes"],
      }),
  });
}

export function useConnectStorageConfigs(instanceId: string | null) {
  return useQuery({
    queryKey: ["aws", "connect", "instances", instanceId, "storage-configs"],
    queryFn: () =>
      api<{ storageConfigs: any[]; total: number }>(
        `/aws/connect/instances/${encodeURIComponent(instanceId!)}/storage-configs`
      ),
    enabled: !!instanceId,
  });
}

export function useAssociateConnectStorageConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ instanceId, ...body }: { instanceId: string } & any) =>
      api(`/aws/connect/instances/${encodeURIComponent(instanceId)}/storage-configs`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({
        queryKey: ["aws", "connect", "instances", variables.instanceId, "storage-configs"],
      }),
  });
}

export function useDisassociateConnectStorageConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ instanceId, associationId }: { instanceId: string; associationId: string }) =>
      api(
        `/aws/connect/instances/${encodeURIComponent(instanceId)}/storage-configs/${encodeURIComponent(associationId)}`,
        { method: "DELETE" }
      ),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({
        queryKey: ["aws", "connect", "instances", variables.instanceId, "storage-configs"],
      }),
  });
}
