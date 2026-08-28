import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface StateMachineListItem {
  stateMachineArn: string;
  name: string;
  type?: string;
  creationDate?: number;
}

export interface Execution {
  executionArn: string;
  stateMachineArn?: string;
  name?: string;
  status?: string;
  startDate?: number;
  stopDate?: number;
}

// ── State Machines ───────────────────────────────────────

export function useStateMachines() {
  return useQuery<{ stateMachines: StateMachineListItem[]; total: number }>({
    queryKey: ["aws", "stepfunctions", "state-machines"],
    queryFn: () => api("/aws/stepfunctions/state-machines"),
    refetchInterval: 10000,
  });
}

export function useStateMachine(arn: string | null) {
  return useQuery<{ stateMachine: any }>({
    queryKey: ["aws", "stepfunctions", "state-machine", arn],
    queryFn: () => api(`/aws/stepfunctions/state-machines/${encodeURIComponent(arn!)}`),
    enabled: !!arn,
  });
}

export function useCreateStateMachine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { name: string; definition: string; roleArn: string; type?: string }) =>
      api("/aws/stepfunctions/state-machines", { method: "POST", body: JSON.stringify(params) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "stepfunctions", "state-machines"] }),
  });
}

export function useUpdateStateMachine(arn: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { definition?: string; roleArn?: string }) =>
      api(`/aws/stepfunctions/state-machines/${encodeURIComponent(arn)}`, {
        method: "PUT",
        body: JSON.stringify(params),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aws", "stepfunctions", "state-machines"] });
      qc.invalidateQueries({ queryKey: ["aws", "stepfunctions", "state-machine", arn] });
    },
  });
}

export function useDeleteStateMachine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (arn: string) =>
      api(`/aws/stepfunctions/state-machines/${encodeURIComponent(arn)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "stepfunctions", "state-machines"] }),
  });
}

// ── Executions ───────────────────────────────────────────

export function useStateMachineExecutions(arn: string | null) {
  return useQuery<{ executions: Execution[]; total: number }>({
    queryKey: ["aws", "stepfunctions", "executions", arn],
    queryFn: () => api(`/aws/stepfunctions/state-machines/${encodeURIComponent(arn!)}/executions`),
    enabled: !!arn,
  });
}

export function useExecutionHistory(arn: string | null) {
  return useQuery<{ events: any[]; total: number }>({
    queryKey: ["aws", "stepfunctions", "history", arn],
    queryFn: () => api(`/aws/stepfunctions/executions/${encodeURIComponent(arn!)}/history`),
    enabled: !!arn,
  });
}

export function useStartExecution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ arn, name, input }: { arn: string; name?: string; input?: string }) =>
      api(`/aws/stepfunctions/state-machines/${encodeURIComponent(arn)}/executions`, {
        method: "POST",
        body: JSON.stringify({ name, input }),
      }),
    onSuccess: (_data, { arn }) =>
      qc.invalidateQueries({ queryKey: ["aws", "stepfunctions", "executions", arn] }),
  });
}

export function useStopExecution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ executionArn, cause, error }: { executionArn: string; stateMachineArn?: string; cause?: string; error?: string }) =>
      api(`/aws/stepfunctions/executions/${encodeURIComponent(executionArn)}/stop`, {
        method: "POST",
        body: JSON.stringify({ cause, error }),
      }),
    onSuccess: (_data, { stateMachineArn }) =>
      qc.invalidateQueries({ queryKey: ["aws", "stepfunctions", "executions", stateMachineArn] }),
  });
}

// ── Versions ────────────────────────────────────────────

export function usePublishStateMachineVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (arn: string) =>
      api(`/aws/stepfunctions/state-machines/${encodeURIComponent(arn)}/versions`, { method: "POST" }),
    onSuccess: (_data, arn) => {
      qc.invalidateQueries({ queryKey: ["aws", "stepfunctions", "versions", arn] });
    },
  });
}

export function useStateMachineVersions(arn: string | null) {
  return useQuery<{ versions: any[]; total: number }>({
    queryKey: ["aws", "stepfunctions", "versions", arn],
    queryFn: () => api(`/aws/stepfunctions/state-machines/${encodeURIComponent(arn!)}/versions`),
    enabled: !!arn,
  });
}

export function useDeleteStateMachineVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ arn, versionArn }: { arn: string; versionArn: string }) =>
      api(
        `/aws/stepfunctions/state-machines/${encodeURIComponent(arn)}/versions/${encodeURIComponent(versionArn)}`,
        { method: "DELETE" }
      ),
    onSuccess: (_data, { arn }) => {
      qc.invalidateQueries({ queryKey: ["aws", "stepfunctions", "versions", arn] });
    },
  });
}

// ── Activities ───────────────────────────────────────────

export function useActivities() {
  return useQuery<{ activities: any[]; total: number }>({
    queryKey: ["aws", "stepfunctions", "activities"],
    queryFn: () => api("/aws/stepfunctions/activities"),
  });
}

export function useCreateActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api("/aws/stepfunctions/activities", { method: "POST", body: JSON.stringify({ name }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "stepfunctions", "activities"] }),
  });
}

export function useDeleteActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (arn: string) =>
      api(`/aws/stepfunctions/activities/${encodeURIComponent(arn)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "stepfunctions", "activities"] }),
  });
}

export function useDescribeActivity() {
  return useMutation({
    mutationFn: (arn: string) => api(`/aws/stepfunctions/activities/${encodeURIComponent(arn)}`),
  });
}

export function useGetActivityTask() {
  return useMutation({
    mutationFn: ({ arn, workerName }: { arn: string; workerName: string }) =>
      api(`/aws/stepfunctions/activities/${encodeURIComponent(arn)}/tasks`, {
        method: "POST",
        body: JSON.stringify({ workerName }),
      }),
  });
}

export function useSendTaskSuccess() {
  return useMutation({
    mutationFn: ({ arn, taskToken, output }: { arn: string; taskToken: string; output?: string }) =>
      api(`/aws/stepfunctions/activities/${encodeURIComponent(arn)}/tasks/success`, {
        method: "POST",
        body: JSON.stringify({ taskToken, output }),
      }),
  });
}

export function useSendTaskFailure() {
  return useMutation({
    mutationFn: ({ arn, taskToken, error, cause }: { arn: string; taskToken: string; error?: string; cause?: string }) =>
      api(`/aws/stepfunctions/activities/${encodeURIComponent(arn)}/tasks/failure`, {
        method: "POST",
        body: JSON.stringify({ taskToken, error, cause }),
      }),
  });
}

export function useSendTaskHeartbeat() {
  return useMutation({
    mutationFn: ({ arn, taskToken }: { arn: string; taskToken: string }) =>
      api(`/aws/stepfunctions/activities/${encodeURIComponent(arn)}/tasks/heartbeat`, {
        method: "POST",
        body: JSON.stringify({ taskToken }),
      }),
  });
}

// ── Sync executions + validation + tags ──────────────────

export function useStartSyncExecution() {
  return useMutation({
    mutationFn: ({ arn, name, input }: { arn: string; name?: string; input?: string }) =>
      api(`/aws/stepfunctions/state-machines/${encodeURIComponent(arn)}/sync-executions`, {
        method: "POST",
        body: JSON.stringify({ name, input }),
      }),
  });
}

export function useValidateStateMachineDefinition() {
  return useMutation({
    mutationFn: ({ definition, type }: { definition: string; type?: string }) =>
      api("/aws/stepfunctions/state-machines/validate", {
        method: "POST",
        body: JSON.stringify({ definition, type }),
      }),
  });
}

export function useStateMachineTags(arn: string | null) {
  return useQuery<any[]>({
    queryKey: ["aws", "stepfunctions", "tags", arn],
    queryFn: () => api(`/aws/stepfunctions/state-machines/${encodeURIComponent(arn!)}/tags`),
    enabled: !!arn,
  });
}

export function useTagStateMachine(arn: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tags: { key: string; value: string }[]) =>
      api(`/aws/stepfunctions/state-machines/${encodeURIComponent(arn)}/tags`, {
        method: "PUT",
        body: JSON.stringify({ tags }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "stepfunctions", "tags", arn] }),
  });
}

export function useUntagStateMachine(arn: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tagKeys: string[]) =>
      api(`/aws/stepfunctions/state-machines/${encodeURIComponent(arn)}/tags`, {
        method: "DELETE",
        body: JSON.stringify({ tagKeys }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "stepfunctions", "tags", arn] }),
  });
}
