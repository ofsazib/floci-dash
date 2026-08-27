import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export function useGuardDutyDetectors() {
  return useQuery<{ detectorIds: string[]; total: number; nextToken: string | null }>({
    queryKey: ["aws", "guardduty", "detectors"],
    queryFn: () => api("/aws/guardduty/detectors"),
  });
}

export function useGuardDutyDetector(id: string | null) {
  return useQuery<{ detector: any }>({
    queryKey: ["aws", "guardduty", "detectors", id],
    queryFn: () => api(`/aws/guardduty/detectors/${encodeURIComponent(id!)}`),
    enabled: !!id,
  });
}

export function useCreateGuardDutyDetector() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { enable: boolean; frequency?: string }) =>
      api("/aws/guardduty/detectors", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "guardduty", "detectors"] }),
  });
}

export function useUpdateGuardDutyDetector() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; enable?: boolean; frequency?: string }) =>
      api(`/aws/guardduty/detectors/${encodeURIComponent(params.id)}`, {
        method: "PATCH",
        body: JSON.stringify({ enable: params.enable, frequency: params.frequency }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "guardduty", "detectors"] }),
  });
}

export function useDeleteGuardDutyDetector() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/aws/guardduty/detectors/${encodeURIComponent(id)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "guardduty", "detectors"] }),
  });
}
