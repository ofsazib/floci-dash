import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface SmModel {
  ModelName?: string;
  ModelArn?: string;
  CreationTime?: number;
}

export interface SmEndpointConfig {
  EndpointConfigName?: string;
  EndpointConfigArn?: string;
  CreationTime?: number;
}

export interface SmEndpoint {
  EndpointName?: string;
  EndpointArn?: string;
  EndpointStatus?: string;
  EndpointConfigName?: string;
  LastModifiedTime?: number;
}

export interface SmTrainingJob {
  TrainingJobName?: string;
  TrainingJobArn?: string;
  TrainingJobStatus?: string;
  CreationTime?: number;
}

const enc = encodeURIComponent;

export function useSmModels() {
  return useQuery({
    queryKey: ["aws", "sagemaker", "models"],
    queryFn: () => api<{ models: SmModel[]; total: number }>("/aws/sagemaker/models"),
  });
}

export function useCreateSmModel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      modelName: string;
      primaryContainer?: Record<string, unknown>;
      containers?: Record<string, unknown>[];
      executionRoleArn?: string;
    }) =>
      api<{ modelArn: string }>("/aws/sagemaker/models", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "sagemaker", "models"] }),
  });
}

export function useDeleteSmModel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/sagemaker/models/${enc(name)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "sagemaker", "models"] }),
  });
}

export function useSmEndpointConfigs() {
  return useQuery({
    queryKey: ["aws", "sagemaker", "endpoint-configs"],
    queryFn: () =>
      api<{ configs: SmEndpointConfig[]; total: number }>(
        "/aws/sagemaker/endpoint-configs"
      ),
  });
}

export function useCreateSmEndpointConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      endpointConfigName: string;
      productionVariants: Record<string, unknown>[];
    }) =>
      api<{ endpointConfigArn: string }>("/aws/sagemaker/endpoint-configs", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "sagemaker", "endpoint-configs"] }),
  });
}

export function useDeleteSmEndpointConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/sagemaker/endpoint-configs/${enc(name)}`, { method: "DELETE" }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "sagemaker", "endpoint-configs"] }),
  });
}

export function useSmEndpoints() {
  return useQuery({
    queryKey: ["aws", "sagemaker", "endpoints"],
    queryFn: () =>
      api<{ endpoints: SmEndpoint[]; total: number }>("/aws/sagemaker/endpoints"),
  });
}

export function useCreateSmEndpoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { endpointName: string; endpointConfigName: string }) =>
      api<{ endpointArn: string }>("/aws/sagemaker/endpoints", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "sagemaker", "endpoints"] }),
  });
}

export function useUpdateSmEndpoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ endpointName, endpointConfigName }: { endpointName: string; endpointConfigName: string }) =>
      api<{ endpointArn: string }>(`/aws/sagemaker/endpoints/${enc(endpointName)}`, {
        method: "PUT",
        body: JSON.stringify({ endpointConfigName }),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "sagemaker", "endpoints"] }),
  });
}

export function useDeleteSmEndpoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/sagemaker/endpoints/${enc(name)}`, { method: "DELETE" }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "sagemaker", "endpoints"] }),
  });
}

export function useSmTrainingJobs() {
  return useQuery({
    queryKey: ["aws", "sagemaker", "training-jobs"],
    queryFn: () =>
      api<{ jobs: SmTrainingJob[]; total: number }>("/aws/sagemaker/training-jobs"),
  });
}

export function useCreateSmTrainingJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      trainingJobName: string;
      algorithmSpecification: Record<string, unknown>;
      inputDataConfig: Record<string, unknown>[];
      outputDataConfig?: Record<string, unknown>;
      roleArn?: string;
    }) =>
      api<{ trainingJobArn: string }>("/aws/sagemaker/training-jobs", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "sagemaker", "training-jobs"] }),
  });
}

export function useStopSmTrainingJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/sagemaker/training-jobs/${enc(name)}/stop`, { method: "POST" }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "sagemaker", "training-jobs"] }),
  });
}
