import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

// ─── Parameters ──────────────────────────────────────────

export function useSSMParameters() {
  return useQuery({
    queryKey: ["aws", "ssm", "parameters"],
    queryFn: () =>
      api<{ parameters: any[]; total: number }>("/aws/ssm/parameters"),
    refetchInterval: 15000,
  });
}

export function useSSMParameter(name: string | null) {
  return useQuery({
    queryKey: ["aws", "ssm", "parameters", name],
    queryFn: () =>
      api<{ parameter: any }>(`/aws/ssm/parameters/${encodeURIComponent(name!)}`),
    enabled: !!name,
  });
}

export function usePutSSMParameter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/ssm/parameters", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "ssm", "parameters"] }),
  });
}

export function useDeleteSSMParameter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/ssm/parameters/${encodeURIComponent(name)}`, { method: "DELETE" }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "ssm", "parameters"] }),
  });
}

export function useSSMGetParameters() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { Names: string[]; WithDecryption?: boolean }) =>
      api("/aws/ssm/parameters/batch", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "ssm", "parameters"] }),
  });
}

export function useSSMParametersByPath(path: string | null) {
  return useQuery({
    queryKey: ["aws", "ssm", "parameters-by-path", path],
    queryFn: () =>
      api<{ parameters: any[]; nextToken: string | null }>(
        `/aws/ssm/parameters-by-path?path=${encodeURIComponent(path!)}`
      ),
    enabled: !!path,
  });
}

export function useSSMDeleteParameters() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (names: string[]) =>
      api("/aws/ssm/parameters/delete-batch", { method: "POST", body: JSON.stringify({ Names: names }) }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "ssm", "parameters"] }),
  });
}

export function useSSMLabelParameter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { Name: string; ParameterVersion: number; Labels: string[] }) =>
      api("/aws/ssm/parameters/label", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "ssm", "parameters"] }),
  });
}

export function useSSMInstanceInformation() {
  return useQuery({
    queryKey: ["aws", "ssm", "instance-information"],
    queryFn: () =>
      api<{ instances: any[]; total: number }>("/aws/ssm/instance-information"),
    refetchInterval: 15000,
  });
}

// ─── Parameter History ───────────────────────────────────

export function useSSMParameterHistory(name: string | null) {
  return useQuery({
    queryKey: ["aws", "ssm", "parameters", name, "history"],
    queryFn: () =>
      api<{ history: any[]; total: number }>(
        `/aws/ssm/parameters/${encodeURIComponent(name!)}/history`
      ),
    enabled: !!name,
  });
}

// ─── Tags ────────────────────────────────────────────────

export function useSSMTags(resourceId: string | null) {
  return useQuery({
    queryKey: ["aws", "ssm", "tags", resourceId],
    queryFn: () =>
      api<{ tags: any[] }>(`/aws/ssm/tags?resourceId=${encodeURIComponent(resourceId!)}`),
    enabled: !!resourceId,
  });
}

export function useAddSSMTags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/ssm/tags", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "ssm", "tags"] }),
  });
}

export function useRemoveSSMTags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ resourceId, tagKeys }: { resourceId: string; tagKeys: string[] }) =>
      api(
        `/aws/ssm/tags?resourceId=${encodeURIComponent(resourceId)}&tagKeys=${tagKeys.join(",")}`,
        { method: "DELETE" }
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "ssm", "tags"] }),
  });
}

// ── Run Command ────────────────────────────────────────

export interface SSMCommand {
  commandId: string;
  documentName?: string;
  status?: string;
  requestedDateTime?: string;
  comment?: string;
  targetCount?: number;
}

export function useSSMCommands() {
  return useQuery<{ commands: SSMCommand[]; total: number }>({
    queryKey: ["aws", "ssm", "commands"],
    queryFn: () => api("/aws/ssm/commands"),
    refetchInterval: 10000,
  });
}

export function useSSMSendCommand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      documentName: string;
      instanceIds: string[];
      parameters?: Record<string, string[]>;
      comment?: string;
      timeoutSeconds?: number;
    }) => api("/aws/ssm/commands", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ssm", "commands"] }),
  });
}

export function useSSMCommandInvocations(commandId: string | null) {
  return useQuery<{ invocations: any[]; total: number }>({
    queryKey: ["aws", "ssm", "commands", commandId, "invocations"],
    queryFn: () => api(`/aws/ssm/commands/${encodeURIComponent(commandId!)}/invocations`),
    enabled: !!commandId,
  });
}

export function useSSMCancelCommand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commandId: string) =>
      api(`/aws/ssm/commands/${encodeURIComponent(commandId)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ssm", "commands"] }),
  });
}
