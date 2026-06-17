import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

// ─── Schedule Groups ─────────────────────────────────────

export function useSchedulerGroups() {
  return useQuery({
    queryKey: ["aws", "scheduler", "groups"],
    queryFn: () => api<{ groups: any[]; total: number }>("/aws/scheduler/groups"),
    refetchInterval: 15000,
  });
}

export function useCreateSchedulerGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; tags?: any[] }) =>
      api("/aws/scheduler/groups", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "scheduler", "groups"] }),
  });
}

export function useDeleteSchedulerGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/scheduler/groups/${encodeURIComponent(name)}`, { method: "DELETE" }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "scheduler", "groups"] }),
  });
}

// ─── Schedules ───────────────────────────────────────────

export function useSchedules(groupName?: string) {
  const g = groupName || "";
  return useQuery({
    queryKey: ["aws", "scheduler", "schedules", g],
    queryFn: () => {
      const qs = g ? `?group=${encodeURIComponent(g)}` : "";
      return api<{ schedules: any[]; total: number }>(`/aws/scheduler/schedules${qs}`);
    },
    refetchInterval: 15000,
  });
}

export function useSchedule(name: string | null, groupName?: string) {
  const g = groupName || "default";
  return useQuery({
    queryKey: ["aws", "scheduler", "schedules", g, name],
    queryFn: () => {
      const qs = `?group=${encodeURIComponent(g)}`;
      return api<{ schedule: any }>(
        `/aws/scheduler/schedules/${encodeURIComponent(name!)}${qs}`
      );
    },
    enabled: !!name,
  });
}

export function useCreateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/scheduler/schedules", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "scheduler", "schedules"] }),
  });
}

export function useDeleteSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, group }: { name: string; group?: string }) => {
      const qs = `?group=${encodeURIComponent(group || "default")}`;
      return api(
        `/aws/scheduler/schedules/${encodeURIComponent(name)}${qs}`,
        { method: "DELETE" }
      );
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "scheduler", "schedules"] }),
  });
}
