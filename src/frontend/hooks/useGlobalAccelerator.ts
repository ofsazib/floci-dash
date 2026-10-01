import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface GaAccelerator {
  AcceleratorArn?: string;
  Name?: string;
  IpAddressType?: string;
  Enabled?: boolean;
  Status?: string;
  DnsName?: string;
}

export interface GaListener {
  ListenerArn?: string;
  PortRanges?: { FromPort?: number; ToPort?: number }[];
  Protocol?: string;
  ClientAffinity?: string;
}

export interface GaEndpointGroup {
  EndpointGroupArn?: string;
  EndpointGroupRegion?: string;
  TrafficDialPercentage?: number;
}

const enc = encodeURIComponent;

export function useGaAccelerators() {
  return useQuery({
    queryKey: ["aws", "globalaccelerator", "accelerators"],
    queryFn: () =>
      api<{ accelerators: GaAccelerator[]; total: number }>(
        "/aws/globalaccelerator/accelerators"
      ),
  });
}

export function useCreateGaAccelerator() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; enabled?: boolean; ipAddressType?: string }) =>
      api<{ accelerator: GaAccelerator }>("/aws/globalaccelerator/accelerators", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "globalaccelerator", "accelerators"] }),
  });
}

export function useDeleteGaAccelerator() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (arn: string) =>
      api(`/aws/globalaccelerator/accelerators/${arn}`, { method: "DELETE" }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "globalaccelerator", "accelerators"] }),
  });
}

export function useGaListeners(acceleratorArn: string | null) {
  return useQuery({
    queryKey: ["aws", "globalaccelerator", "listeners", acceleratorArn],
    queryFn: () =>
      api<{ listeners: GaListener[]; total: number }>(
        `/aws/globalaccelerator/accelerators/listeners?acceleratorArn=${enc(acceleratorArn!)}`
      ),
    enabled: !!acceleratorArn,
  });
}

export function useCreateGaListener() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      acceleratorArn: string;
      portRanges: { FromPort: number; ToPort: number }[];
      protocol?: string;
    }) =>
      api<{ listener: GaListener }>("/aws/globalaccelerator/listeners", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({
        queryKey: ["aws", "globalaccelerator", "listeners", v.acceleratorArn],
      }),
  });
}

export function useDeleteGaListener() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (arn: string) =>
      api(`/aws/globalaccelerator/listeners/${arn}`, { method: "DELETE" }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "globalaccelerator", "listeners"] }),
  });
}

export function useGaEndpointGroups(listenerArn: string | null) {
  return useQuery({
    queryKey: ["aws", "globalaccelerator", "endpoint-groups", listenerArn],
    queryFn: () =>
      api<{ endpointGroups: GaEndpointGroup[]; total: number }>(
        `/aws/globalaccelerator/listeners/endpoint-groups?listenerArn=${enc(listenerArn!)}`
      ),
    enabled: !!listenerArn,
  });
}

export function useCreateGaEndpointGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { listenerArn: string; endpointGroupRegion: string }) =>
      api<{ endpointGroup: GaEndpointGroup }>("/aws/globalaccelerator/endpoint-groups", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({
        queryKey: ["aws", "globalaccelerator", "endpoint-groups", v.listenerArn],
      }),
  });
}

export function useDeleteGaEndpointGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (arn: string) =>
      api(`/aws/globalaccelerator/endpoint-groups/${arn}`, { method: "DELETE" }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "globalaccelerator", "endpoint-groups"] }),
  });
}
