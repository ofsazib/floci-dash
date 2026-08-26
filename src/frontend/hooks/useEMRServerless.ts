import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface EMRServerlessApplicationSummary {
  id: string;
  name: string;
  state?: string;
  releaseLabel?: string;
  type?: string;
}

export function useEMRServerlessApplications() {
  return useQuery<{ applications: EMRServerlessApplicationSummary[]; total: number }>({
    queryKey: ["aws", "emrserverless", "applications"],
    queryFn: () => api("/aws/emrserverless/applications"),
  });
}

export function useEMRServerlessApplication(id: string | null) {
  return useQuery<any>({
    queryKey: ["aws", "emrserverless", "applications", id],
    queryFn: () => api(`/aws/emrserverless/applications/${encodeURIComponent(id!)}`),
    enabled: !!id,
  });
}

export function useCreateEMRServerlessApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; releaseLabel: string; type: string }) =>
      api("/aws/emrserverless/applications", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "emrserverless", "applications"] }),
  });
}

export function useUpdateEMRServerlessApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; autoStart?: boolean; autoStop?: boolean }) =>
      api(`/aws/emrserverless/applications/${encodeURIComponent(params.id)}`, {
        method: "PUT",
        body: JSON.stringify({ autoStart: params.autoStart, autoStop: params.autoStop }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "emrserverless", "applications"] }),
  });
}

export function useDeleteEMRServerlessApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/aws/emrserverless/applications/${encodeURIComponent(id)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "emrserverless", "applications"] }),
  });
}

export function useStartEMRServerlessApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/aws/emrserverless/applications/${encodeURIComponent(id)}/start`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "emrserverless", "applications"] }),
  });
}

export function useStopEMRServerlessApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/aws/emrserverless/applications/${encodeURIComponent(id)}/stop`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "emrserverless", "applications"] }),
  });
}
