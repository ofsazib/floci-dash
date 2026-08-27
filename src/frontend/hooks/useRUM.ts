import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface RUMAppMonitorSummary {
  Id?: string;
  Name?: string;
  State?: string;
  Platform?: string;
}

export function useRUMAppMonitors() {
  return useQuery<{ appMonitors: RUMAppMonitorSummary[]; total: number; nextToken: string | null }>({
    queryKey: ["aws", "rum", "appmonitors"],
    queryFn: () => api("/aws/rum/appmonitors"),
  });
}

export function useRUMAppMonitor(name: string | null) {
  return useQuery<{ appMonitor: any }>({
    queryKey: ["aws", "rum", "appmonitors", name],
    queryFn: () => api(`/aws/rum/appmonitors/${encodeURIComponent(name!)}`),
    enabled: !!name,
  });
}

export function useCreateRUMAppMonitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; domain: string; platform?: string }) =>
      api("/aws/rum/appmonitors", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "rum", "appmonitors"] }),
  });
}

export function useUpdateRUMAppMonitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { name: string; domain?: string; domains?: string[] }) =>
      api(`/aws/rum/appmonitors/${encodeURIComponent(params.name)}`, {
        method: "PATCH",
        body: JSON.stringify({ domain: params.domain, domains: params.domains }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "rum", "appmonitors"] }),
  });
}

export function useDeleteRUMAppMonitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/rum/appmonitors/${encodeURIComponent(name)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "rum", "appmonitors"] }),
  });
}
