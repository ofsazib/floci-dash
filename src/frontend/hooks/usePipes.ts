import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface Pipe {
  Name: string;
  Arn: string;
  Source: string;
  Target: string;
  RoleArn?: string;
  Description?: string;
  DesiredState?: string;
  CurrentState?: string;
  Enrichment?: string;
  CreationTime?: number;
  LastModifiedTime?: number;
}

export function usePipes(namePrefix?: string, state?: string) {
  const params = new URLSearchParams();
  if (namePrefix) params.set("namePrefix", namePrefix);
  if (state) params.set("state", state);
  const qs = params.toString();
  return useQuery<{ pipes: Pipe[]; total: number }>({
    queryKey: ["aws", "pipes", namePrefix || "all", state || "all"],
    queryFn: () => api(`/aws/pipes/pipes${qs ? `?${qs}` : ""}`),
    refetchInterval: 10000,
  });
}

export function usePipe(name: string | null) {
  return useQuery<{ pipe: Pipe }>({
    queryKey: ["aws", "pipes", "pipe", name],
    queryFn: () => api(`/aws/pipes/pipes/${encodeURIComponent(name!)}`),
    enabled: !!name,
  });
}

export function useCreatePipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      name: string;
      source: string;
      target: string;
      roleArn: string;
      description?: string;
      desiredState?: string;
      enrichment?: string;
      sourceParameters?: any;
      targetParameters?: any;
      tags?: Record<string, string>;
    }) =>
      api("/aws/pipes/pipes", { method: "POST", body: JSON.stringify(params) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "pipes"] }),
  });
}

export function useUpdatePipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      name: string;
      roleArn?: string;
      description?: string;
      desiredState?: string;
      target?: string;
      enrichment?: string;
    }) =>
      api(`/aws/pipes/pipes/${encodeURIComponent(params.name)}`, {
        method: "PUT",
        body: JSON.stringify(params),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "pipes"] }),
  });
}

export function useDeletePipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/pipes/pipes/${encodeURIComponent(name)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "pipes"] }),
  });
}

export function useStartPipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/pipes/pipes/${encodeURIComponent(name)}/start`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "pipes"] }),
  });
}

export function useStopPipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/pipes/pipes/${encodeURIComponent(name)}/stop`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "pipes"] }),
  });
}
