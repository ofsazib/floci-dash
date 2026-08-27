import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface FisTemplateSummary {
  id?: string;
  description?: string;
  state?: string;
  creationTime?: string;
}

export function useFisExperimentTemplates() {
  return useQuery<{ experimentTemplates: FisTemplateSummary[]; total: number }>({
    queryKey: ["aws", "fis", "experiment-templates"],
    queryFn: () => api("/aws/fis/experiment-templates"),
  });
}

export function useFisExperimentTemplate(id: string | null) {
  return useQuery<{ experimentTemplate: any }>({
    queryKey: ["aws", "fis", "experiment-templates", id],
    queryFn: () => api(`/aws/fis/experiment-templates/${encodeURIComponent(id!)}`),
    enabled: !!id,
  });
}

export function useCreateFisExperimentTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; description: string; roleArn: string; actions: any }) =>
      api("/aws/fis/experiment-templates", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "fis", "experiment-templates"] }),
  });
}

export function useUpdateFisExperimentTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; description?: string; roleArn?: string }) =>
      api(`/aws/fis/experiment-templates/${encodeURIComponent(params.id)}`, {
        method: "PATCH",
        body: JSON.stringify({ description: params.description, roleArn: params.roleArn }),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "fis", "experiment-templates"] }),
  });
}

export function useDeleteFisExperimentTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/aws/fis/experiment-templates/${encodeURIComponent(id)}`, { method: "DELETE" }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "fis", "experiment-templates"] }),
  });
}

export function useFisExperiments() {
  return useQuery<{ experiments: any[]; total: number }>({
    queryKey: ["aws", "fis", "experiments"],
    queryFn: () => api("/aws/fis/experiments"),
  });
}

export function useStartFisExperiment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) =>
      api("/aws/fis/experiments", {
        method: "POST",
        body: JSON.stringify({ templateId }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "fis", "experiments"] }),
  });
}

export function useStopFisExperiment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/aws/fis/experiments/${encodeURIComponent(id)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "fis", "experiments"] }),
  });
}
