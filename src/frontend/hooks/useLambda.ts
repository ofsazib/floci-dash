import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

// ─── FUNCTIONS ──────────────────────────────────────────

export function useLambdaFunctions() {
  return useQuery({
    queryKey: ["aws", "lambda", "functions"],
    queryFn: () => api<{ functions: any[]; total: number }>("/lambda/functions"),
  });
}

export function useLambdaFunction(name: string | null) {
  return useQuery({
    queryKey: ["aws", "lambda", "functions", name],
    queryFn: () => api<{ configuration: any; code: any }>(`/lambda/functions/${name}`),
    enabled: !!name,
  });
}

export function useCreateFunction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) => api("/aws/lambda/functions", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "lambda", "functions"] }),
  });
}

export function useDeleteFunction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api(`/aws/lambda/functions/${name}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "lambda", "functions"] }),
  });
}

export function useUpdateFunctionConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, ...body }: any) =>
      api(`/aws/lambda/functions/${name}/configuration`, { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "lambda", "functions"] }),
  });
}

// ─── INVOKE ─────────────────────────────────────────────

export function useInvokeFunction() {
  return useMutation<any, Error, { name: string; payload: string }>({
    mutationFn: ({ name, payload }: { name: string; payload: string }) =>
      api(`/aws/lambda/functions/${name}/invocations`, {
        method: "POST",
        body: payload,
        headers: { "Content-Type": "application/json" },
      }),
  });
}

// ─── VERSIONS ───────────────────────────────────────────

export function useLambdaVersions(name: string | null) {
  return useQuery({
    queryKey: ["aws", "lambda", "functions", name, "versions"],
    queryFn: () => api<{ versions: any[]; total: number }>(`/lambda/functions/${name}/versions`),
    enabled: !!name,
  });
}

export function usePublishVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, description }: { name: string; description?: string }) =>
      api(`/aws/lambda/functions/${name}/versions`, { method: "POST", body: JSON.stringify({ description }) }),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ["aws", "lambda", "functions", vars.name, "versions"] }),
  });
}

// ─── ALIASES ────────────────────────────────────────────

export function useLambdaAliases(name: string | null) {
  return useQuery({
    queryKey: ["aws", "lambda", "functions", name, "aliases"],
    queryFn: () => api<{ aliases: any[]; total: number }>(`/lambda/functions/${name}/aliases`),
    enabled: !!name,
  });
}

// ─── EVENT SOURCE MAPPINGS ──────────────────────────────

export function useEventSourceMappings(functionName?: string) {
  return useQuery({
    queryKey: ["aws", "lambda", "event-source-mappings", functionName],
    queryFn: () =>
      api<{ eventSourceMappings: any[]; total: number }>(
        `/lambda/event-source-mappings${functionName ? `?functionName=${functionName}` : ""}`
      ),
  });
}

export function useDeleteEventSourceMapping() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (uuid: string) => api(`/aws/lambda/event-source-mappings/${uuid}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "lambda", "event-source-mappings"] }),
  });
}

// ─── LAYERS ─────────────────────────────────────────────

export function useLambdaLayers() {
  return useQuery({
    queryKey: ["aws", "lambda", "layers"],
    queryFn: () => api<{ layers: any[]; total: number }>("/lambda/layers"),
  });
}

export function useLambdaLayerVersions(name: string | null) {
  return useQuery({
    queryKey: ["aws", "lambda", "layers", name, "versions"],
    queryFn: () => api<{ versions: any[]; total: number }>(`/lambda/layers/${name}/versions`),
    enabled: !!name,
  });
}

export function useDeleteLayerVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, version }: { name: string; version: number }) =>
      api(`/aws/lambda/layers/${name}/versions/${version}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aws", "lambda", "layers"] });
    },
  });
}

// ─── TAGS ───────────────────────────────────────────────

export function useLambdaTags(arn: string | null) {
  return useQuery({
    queryKey: ["aws", "lambda", "tags", arn],
    queryFn: () => api<{ tags: Record<string, string> }>(`/lambda/tags/${arn}`),
    enabled: !!arn,
  });
}

// ─── FUNCTION URL ───────────────────────────────────────

export function useFunctionUrl(name: string | null) {
  return useQuery({
    queryKey: ["aws", "lambda", "functions", name, "url"],
    queryFn: () => api<{ url: string; authType: string; cors: any; invokeMode: string }>(`/lambda/functions/${name}/url`),
    enabled: !!name,
  });
}

// ─── CONCURRENCY ────────────────────────────────────────

export function useFunctionConcurrency(name: string | null) {
  return useQuery({
    queryKey: ["aws", "lambda", "functions", name, "concurrency"],
    queryFn: () => api<{ reservedConcurrentExecutions: number | undefined }>(`/lambda/functions/${name}/concurrency`),
    enabled: !!name,
  });
}
