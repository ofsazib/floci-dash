import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

// ── Brokers ────────────────────────────────────────────

export function useMQBrokers() {
  return useQuery({
    queryKey: ["mq", "brokers"],
    queryFn: () => api("/aws/mq/brokers"),
  });
}

export function useMQBroker(id: string | null) {
  return useQuery({
    queryKey: ["mq", "brokers", id],
    queryFn: () => api(`/aws/mq/brokers/${id}`),
    enabled: !!id,
  });
}

export function useCreateMQBroker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      api("/aws/mq/brokers", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mq", "brokers"] }),
  });
}

export function useDeleteMQBroker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/aws/mq/brokers/${encodeURIComponent(id)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mq", "brokers"] }),
  });
}

export function useRebootMQBroker() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/aws/mq/brokers/${encodeURIComponent(id)}/reboot`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mq", "brokers"] }),
  });
}

// ── Users ──────────────────────────────────────────────

export function useMQUsers(brokerId: string | null) {
  return useQuery({
    queryKey: ["mq", "brokers", brokerId, "users"],
    queryFn: () => api(`/aws/mq/brokers/${brokerId}/users`),
    enabled: !!brokerId,
  });
}

export function useCreateMQUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ brokerId, username, password, groups }: { brokerId: string; username: string; password: string; groups?: string[] }) =>
      api(`/aws/mq/brokers/${encodeURIComponent(brokerId)}/users/${encodeURIComponent(username)}`, {
        method: "POST",
        body: JSON.stringify({ password, groups }),
      }),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ["mq", "brokers", vars.brokerId, "users"] }),
  });
}

export function useDeleteMQUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ brokerId, username }: { brokerId: string; username: string }) =>
      api(`/aws/mq/brokers/${encodeURIComponent(brokerId)}/users/${encodeURIComponent(username)}`, { method: "DELETE" }),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ["mq", "brokers", vars.brokerId, "users"] }),
  });
}
