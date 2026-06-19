import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

// ─── Servers ────────────────────────────────────────────

export function useTransferServers() {
  return useQuery({
    queryKey: ["aws", "transfer", "servers"],
    queryFn: () => api<{ servers: any[]; total: number }>("/aws/transfer/servers"),
  });
}

export function useCreateTransferServer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/transfer/servers", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "transfer", "servers"] }),
  });
}

export function useTransferServer(serverId: string | null) {
  return useQuery({
    queryKey: ["aws", "transfer", "servers", serverId],
    queryFn: () => api<any>(`/aws/transfer/servers/${encodeURIComponent(serverId!)}`),
    enabled: !!serverId,
  });
}

export function useDeleteTransferServer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (serverId: string) =>
      api(`/aws/transfer/servers/${encodeURIComponent(serverId)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "transfer", "servers"] }),
  });
}

export function useStartTransferServer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (serverId: string) =>
      api(`/aws/transfer/servers/${encodeURIComponent(serverId)}/start`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "transfer", "servers"] }),
  });
}

export function useStopTransferServer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (serverId: string) =>
      api(`/aws/transfer/servers/${encodeURIComponent(serverId)}/stop`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "transfer", "servers"] }),
  });
}

// ─── Users ──────────────────────────────────────────────

export function useTransferUsers(serverId: string | null) {
  return useQuery({
    queryKey: ["aws", "transfer", "servers", serverId, "users"],
    queryFn: () => api<{ users: any[]; total: number }>(
      `/aws/transfer/servers/${encodeURIComponent(serverId!)}/users`
    ),
    enabled: !!serverId,
  });
}

export function useCreateTransferUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ serverId, ...body }: any) =>
      api(`/aws/transfer/servers/${encodeURIComponent(serverId)}/users`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({
        queryKey: ["aws", "transfer", "servers", variables.serverId, "users"],
      }),
  });
}

export function useTransferUser(serverId: string | null, userName: string | null) {
  return useQuery({
    queryKey: ["aws", "transfer", "servers", serverId, "users", userName],
    queryFn: () =>
      api<any>(
        `/aws/transfer/servers/${encodeURIComponent(serverId!)}/users/${encodeURIComponent(userName!)}`
      ),
    enabled: !!serverId && !!userName,
  });
}

export function useDeleteTransferUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ serverId, userName }: { serverId: string; userName: string }) =>
      api(
        `/aws/transfer/servers/${encodeURIComponent(serverId)}/users/${encodeURIComponent(userName)}`,
        { method: "DELETE" }
      ),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({
        queryKey: ["aws", "transfer", "servers", variables.serverId, "users"],
      }),
  });
}

// ─── Tags ───────────────────────────────────────────────

export function useTransferTags(resourceArn: string | null) {
  return useQuery({
    queryKey: ["aws", "transfer", "tags", resourceArn],
    queryFn: () =>
      api<{ tags: any[] }>(`/aws/transfer/tags?resourceArn=${encodeURIComponent(resourceArn!)}`),
    enabled: !!resourceArn,
  });
}
