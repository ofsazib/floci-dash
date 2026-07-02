import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

// ─── Pipelines ─────────────────────────────────────────

export function usePipelines() {
  return useQuery({
    queryKey: ["aws", "codepipeline", "pipelines"],
    queryFn: () => api<{ pipelines: any[]; total: number }>("/aws/codepipeline/pipelines"),
  });
}

export function useCreatePipeline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/codepipeline/pipelines", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "codepipeline", "pipelines"] }),
  });
}

export function usePipeline(name: string | null) {
  return useQuery({
    queryKey: ["aws", "codepipeline", "pipelines", name],
    queryFn: () => api<{ pipeline: any; metadata: any }>(`/aws/codepipeline/pipelines/${encodeURIComponent(name || "")}`),
    enabled: !!name,
  });
}

export function usePipelineState(name: string | null) {
  return useQuery({
    queryKey: ["aws", "codepipeline", "pipelines", name, "state"],
    queryFn: () => api<{ state: any }>(`/aws/codepipeline/pipelines/${encodeURIComponent(name || "")}/state`),
    enabled: !!name,
  });
}

export function useUpdatePipeline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, ...body }: any) =>
      api(`/aws/codepipeline/pipelines/${encodeURIComponent(name)}`, { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "codepipeline", "pipelines"] }),
  });
}

export function useDeletePipeline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/codepipeline/pipelines/${encodeURIComponent(name)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "codepipeline", "pipelines"] }),
  });
}

// ─── Executions ────────────────────────────────────────

export function usePipelineExecutions(name: string | null) {
  return useQuery({
    queryKey: ["aws", "codepipeline", "pipelines", name, "executions"],
    queryFn: () => api<{ executions: any[]; total: number; nextToken?: string }>(
      `/aws/codepipeline/pipelines/${encodeURIComponent(name || "")}/executions`
    ),
    enabled: !!name,
  });
}

export function useStartPipelineExecution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, ...body }: any) =>
      api(`/aws/codepipeline/pipelines/${encodeURIComponent(name)}/executions`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ["aws", "codepipeline", "pipelines", variables.name, "executions"] }),
  });
}

export function useStopPipelineExecution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, executionId, ...body }: any) =>
      api(`/aws/codepipeline/pipelines/${encodeURIComponent(name)}/executions/${encodeURIComponent(executionId)}/stop`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ["aws", "codepipeline", "pipelines", variables.name, "executions"] }),
  });
}

export function useRetryStageExecution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, executionId, ...body }: any) =>
      api(`/aws/codepipeline/pipelines/${encodeURIComponent(name)}/executions/${encodeURIComponent(executionId)}/retry`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ["aws", "codepipeline", "pipelines", variables.name, "executions"] }),
  });
}

// ─── Stage Transitions ─────────────────────────────────

export function useDisableStageTransition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, stageName, ...body }: any) =>
      api(`/aws/codepipeline/pipelines/${encodeURIComponent(name)}/transitions/${encodeURIComponent(stageName)}/disable`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ["aws", "codepipeline", "pipelines", variables.name, "state"] }),
  });
}

export function useEnableStageTransition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, stageName }: any) =>
      api(`/aws/codepipeline/pipelines/${encodeURIComponent(name)}/transitions/${encodeURIComponent(stageName)}/enable`, {
        method: "POST",
        body: JSON.stringify({}),
      }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ["aws", "codepipeline", "pipelines", variables.name, "state"] }),
  });
}

// ─── Approvals ─────────────────────────────────────────

export function usePutApprovalResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, ...body }: any) =>
      api(`/aws/codepipeline/pipelines/${encodeURIComponent(name)}/approvals`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ["aws", "codepipeline", "pipelines", variables.name, "state"] }),
  });
}

// ─── Action Executions ─────────────────────────────────

export function useActionExecutions(name: string | null, executionId?: string | null) {
  const searchParams = executionId ? `?executionId=${encodeURIComponent(executionId)}` : "";
  return useQuery({
    queryKey: ["aws", "codepipeline", "pipelines", name, "actions", executionId],
    queryFn: () => api<{ actions: any[]; total: number }>(
      `/aws/codepipeline/pipelines/${encodeURIComponent(name || "")}/actions${searchParams}`
    ),
    enabled: !!name,
  });
}

// ─── Action Types ──────────────────────────────────────

export function useActionTypes() {
  return useQuery({
    queryKey: ["aws", "codepipeline", "action-types"],
    queryFn: () => api<{ actionTypes: any[]; total: number }>("/aws/codepipeline/action-types"),
  });
}

export function useCreateCustomActionType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/codepipeline/action-types", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "codepipeline", "action-types"] }),
  });
}

// ─── Webhooks ──────────────────────────────────────────

export function useWebhooks() {
  return useQuery({
    queryKey: ["aws", "codepipeline", "webhooks"],
    queryFn: () => api<{ webhooks: any[]; total: number }>("/aws/codepipeline/webhooks"),
  });
}

export function useCreateWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/codepipeline/webhooks", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "codepipeline", "webhooks"] }),
  });
}

export function useDeleteWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/codepipeline/webhooks/${encodeURIComponent(name)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "codepipeline", "webhooks"] }),
  });
}
