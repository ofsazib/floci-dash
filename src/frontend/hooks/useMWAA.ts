import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface MWAAEnvironmentSummary {
  name: string;
}

export function useMWAAEnvironments() {
  return useQuery<{ environments: MWAAEnvironmentSummary[]; total: number }>({
    queryKey: ["aws", "mwaa", "environments"],
    queryFn: () => api("/aws/mwaa/environments"),
  });
}

export function useMWAAEnvironment(name: string | null) {
  return useQuery<{ environment: any }>({
    queryKey: ["aws", "mwaa", "environments", name],
    queryFn: () => api(`/aws/mwaa/environments/${encodeURIComponent(name!)}`),
    enabled: !!name,
  });
}

export function useCreateMWAAEnvironment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      name: string;
      sourceBucketArn: string;
      executionRoleArn: string;
      airflowVersion?: string;
      environmentClass?: string;
      dagS3Path?: string;
    }) =>
      api("/aws/mwaa/environments", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "mwaa", "environments"] }),
  });
}

export function useUpdateMWAAEnvironment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { name: string; airflowVersion?: string; environmentClass?: string }) =>
      api(`/aws/mwaa/environments/${encodeURIComponent(params.name)}`, {
        method: "PATCH",
        body: JSON.stringify({
          airflowVersion: params.airflowVersion,
          environmentClass: params.environmentClass,
        }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "mwaa", "environments"] }),
  });
}

export function useDeleteMWAAEnvironment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/mwaa/environments/${encodeURIComponent(name)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "mwaa", "environments"] }),
  });
}

export function useCreateMWAAWebToken() {
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/mwaa/environments/${encodeURIComponent(name)}/webtoken`, { method: "POST" }),
  });
}

export function useCreateMWAACliToken() {
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/mwaa/environments/${encodeURIComponent(name)}/clitoken`, { method: "POST" }),
  });
}
