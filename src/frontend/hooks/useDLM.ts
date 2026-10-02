import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface DlmPolicySummary {
  PolicyId?: string;
  Description?: string;
  State?: string;
}

export interface DlmPolicy extends DlmPolicySummary {
  ExecutionRoleArn?: string;
  DateCreated?: number;
  DateModified?: number;
  PolicyDetails?: Record<string, unknown>[];
}

const enc = encodeURIComponent;

export function useDlmPolicies() {
  return useQuery({
    queryKey: ["aws", "dlm", "policies"],
    queryFn: () =>
      api<{ policies: DlmPolicySummary[]; total: number }>("/aws/dlm/policies"),
  });
}

export function useCreateDlmPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      executionRoleArn: string;
      description: string;
      state: string;
      policyDetails: Record<string, unknown>[];
    }) =>
      api<{ policyId: string }>("/aws/dlm/policies", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "dlm", "policies"] }),
  });
}

export function useDeleteDlmPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/aws/dlm/policies/${enc(id)}`, { method: "DELETE" }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "dlm", "policies"] }),
  });
}
