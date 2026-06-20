import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export function useBatchComputeEnvironments() {
  return useQuery({
    queryKey: ["aws", "batch", "compute-environments"],
    queryFn: () => api<{ computeEnvironments: any[] }>("/aws/batch/compute-environments"),
  });
}

export function useCreateBatchComputeEnvironment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/batch/compute-environments", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "batch", "compute-environments"] }),
  });
}

export function useDeleteBatchComputeEnvironment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/batch/compute-environments/${name}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "batch", "compute-environments"] }),
  });
}

export function useBatchJobQueues() {
  return useQuery({
    queryKey: ["aws", "batch", "job-queues"],
    queryFn: () => api<{ jobQueues: any[] }>("/aws/batch/job-queues"),
  });
}

export function useCreateBatchJobQueue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/batch/job-queues", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "batch", "job-queues"] }),
  });
}

export function useDeleteBatchJobQueue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/batch/job-queues/${name}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "batch", "job-queues"] }),
  });
}

export function useBatchJobDefinitions() {
  return useQuery({
    queryKey: ["aws", "batch", "job-definitions"],
    queryFn: () => api<{ jobDefinitions: any[] }>("/aws/batch/job-definitions"),
  });
}

export function useRegisterBatchJobDefinition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/batch/job-definitions", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "batch", "job-definitions"] }),
  });
}

export function useDeregisterBatchJobDefinition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/batch/job-definitions/${name}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "batch", "job-definitions"] }),
  });
}

export function useBatchJobs() {
  return useQuery({
    queryKey: ["aws", "batch", "jobs"],
    queryFn: () => api<{ jobs: any[] }>("/aws/batch/jobs"),
  });
}

export function useSubmitBatchJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/batch/jobs", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "batch", "jobs"] }),
  });
}

export function useBatchJob(id: string | null) {
  return useQuery({
    queryKey: ["aws", "batch", "jobs", id],
    queryFn: () => api<any>(`/aws/batch/jobs/${id}`),
    enabled: !!id,
  });
}

export function useTerminateBatchJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      api(`/aws/batch/jobs/${id}/terminate`, { method: "POST", body: JSON.stringify({ reason }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "batch", "jobs"] }),
  });
}
