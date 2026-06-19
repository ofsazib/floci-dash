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

// ── Activities ───────────────────────────────────────────

export function useActivities() {
  return useQuery<{ activities: any[]; total: number }>({
    queryKey: ["aws", "stepfunctions", "activities"],
    queryFn: () => api("/aws/stepfunctions/activities"),
  });
}
