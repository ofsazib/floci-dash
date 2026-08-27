import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

// ─── FUNCTIONS ──────────────────────────────────────────

export function useLambdaFunctions() {
  return useQuery({
    queryKey: ["aws", "lambda", "functions"],
    queryFn: () => api<{ functions: any[]; total: number }>("/aws/lambda/functions"),
  });
}

export function useLambdaFunction(name: string | null) {
  return useQuery({
    queryKey: ["aws", "lambda", "functions", name],
    queryFn: () => api<{ configuration: any; code: any }>(`/aws/lambda/functions/${name}`),
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
    queryFn: () => api<{ versions: any[]; total: number }>(`/aws/lambda/functions/${name}/versions`),
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
    queryFn: () => api<{ aliases: any[]; total: number }>(`/aws/lambda/functions/${name}/aliases`),
    enabled: !!name,
  });
}

// ─── EVENT SOURCE MAPPINGS ──────────────────────────────

export function useEventSourceMappings(functionName?: string) {
  return useQuery({
    queryKey: ["aws", "lambda", "event-source-mappings", functionName],
    queryFn: () =>
      api<{ eventSourceMappings: any[]; total: number }>(
        `/aws/lambda/event-source-mappings${functionName ? `?functionName=${functionName}` : ""}`
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

export function useCreateEventSourceMapping(functionName?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      eventSourceArn: string;
      functionName: string;
      startingPosition?: string;
      batchSize?: number;
      maximumConcurrency?: number;
    }) =>
      api("/aws/lambda/event-source-mappings", {
        method: "POST",
        body: JSON.stringify(params),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "lambda", "event-source-mappings", functionName] }),
  });
}

export function useUpdateEventSourceMapping(functionName?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      uuid: string;
      batchSize?: number;
      enabled?: boolean;
      maximumConcurrency?: number;
    }) =>
      api(`/aws/lambda/event-source-mappings/${params.uuid}`, {
        method: "PUT",
        body: JSON.stringify({
          batchSize: params.batchSize,
          enabled: params.enabled,
          maximumConcurrency: params.maximumConcurrency,
        }),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "lambda", "event-source-mappings", functionName] }),
  });
}

// ─── RESOURCE-BASED POLICY ──────────────────────────────

export interface LambdaPolicyStatement {
  Sid: string;
  Effect: string;
  Principal: any;
  Action: string | string[];
  Resource?: string;
  Condition?: any;
}

export function useLambdaPolicy(name: string | null) {
  return useQuery<{ policy: { Statement: LambdaPolicyStatement[] } | null; revisionId: string | null }>({
    queryKey: ["aws", "lambda", "functions", name, "policy"],
    queryFn: () => api(`/aws/lambda/functions/${name}/policy`),
    enabled: !!name,
  });
}

export function useAddLambdaPermission(name: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      statementId: string;
      principal: string;
      action: string;
      sourceArn?: string;
      sourceAccount?: string;
    }) =>
      api(`/aws/lambda/functions/${encodeURIComponent(name)}/policy`, {
        method: "POST",
        body: JSON.stringify(params),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "lambda", "functions", name, "policy"] }),
  });
}

export function useRemoveLambdaPermission(name: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (statementId: string) =>
      api(`/aws/lambda/functions/${encodeURIComponent(name)}/policy/${encodeURIComponent(statementId)}`, {
        method: "DELETE",
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "lambda", "functions", name, "policy"] }),
  });
}

// ─── ALIAS UPDATE ───────────────────────────────────────

export function useUpdateLambdaAlias(name: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      aliasName: string;
      functionVersion?: string;
      description?: string;
    }) =>
      api(
        `/aws/lambda/functions/${encodeURIComponent(name)}/aliases/${encodeURIComponent(params.aliasName)}`,
        { method: "PUT", body: JSON.stringify(params) }
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "lambda", "functions", name, "aliases"] }),
  });
}

// ─── LAYERS ─────────────────────────────────────────────

export function useLambdaLayers() {
  return useQuery({
    queryKey: ["aws", "lambda", "layers"],
    queryFn: () => api<{ layers: any[]; total: number }>("/aws/lambda/layers"),
  });
}

export function useLambdaLayerVersions(name: string | null) {
  return useQuery({
    queryKey: ["aws", "lambda", "layers", name, "versions"],
    queryFn: () => api<{ versions: any[]; total: number }>(`/aws/lambda/layers/${name}/versions`),
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
    queryFn: () => api<{ tags: Record<string, string> }>(`/aws/lambda/tags/${arn}`),
    enabled: !!arn,
  });
}

// ─── FUNCTION URL ───────────────────────────────────────

export function useFunctionUrl(name: string | null) {
  return useQuery({
    queryKey: ["aws", "lambda", "functions", name, "url"],
    queryFn: () => api<{ url: string | null; authType: string | null; cors: any; invokeMode: string | null }>(`/aws/lambda/functions/${name}/url`),
    enabled: !!name,
  });
}

export function useDeleteFunctionUrl() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/lambda/functions/${name}/url`, { method: "DELETE" }),
    onSuccess: (_data, name) =>
      qc.invalidateQueries({ queryKey: ["aws", "lambda", "functions", name, "url"] }),
  });
}

export function useCreateFunctionUrl() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, ...body }: any) =>
      api(`/aws/lambda/functions/${name}/url`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ["aws", "lambda", "functions", vars.name, "url"] }),
  });
}

export function useUpdateFunctionUrl() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, ...body }: any) =>
      api(`/aws/lambda/functions/${name}/url`, { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ["aws", "lambda", "functions", vars.name, "url"] }),
  });
}

// ─── CONCURRENCY ────────────────────────────────────────

export function useFunctionConcurrency(name: string | null) {
  return useQuery({
    queryKey: ["aws", "lambda", "functions", name, "concurrency"],
    queryFn: () => api<{ reservedConcurrentExecutions: number | undefined }>(`/aws/lambda/functions/${name}/concurrency`),
    enabled: !!name,
  });
}

export function useSetFunctionConcurrency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, reservedConcurrentExecutions }: { name: string; reservedConcurrentExecutions: number }) =>
      api(`/aws/lambda/functions/${name}/concurrency`, {
        method: "PUT",
        body: JSON.stringify({ reservedConcurrentExecutions }),
      }),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ["aws", "lambda", "functions", vars.name, "concurrency"] }),
  });
}

export function useDeleteFunctionConcurrency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/lambda/functions/${name}/concurrency`, { method: "DELETE" }),
    onSuccess: (_data, name) =>
      qc.invalidateQueries({ queryKey: ["aws", "lambda", "functions", name, "concurrency"] }),
  });
}

// ─── EVENT INVOKE CONFIG ────────────────────────────────

export function useEventInvokeConfig(name: string | null) {
  return useQuery({
    queryKey: ["aws", "lambda", "functions", name, "event-invoke-config"],
    queryFn: () =>
      api<{ maximumRetryAttempts?: number; maximumEventAgeInSeconds?: number; destinationConfig?: any; functionArn?: string }>(
        `/aws/lambda/functions/${name}/event-invoke-config`
      ),
    enabled: !!name,
  });
}

export function usePutEventInvokeConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, ...body }: any) =>
      api(`/aws/lambda/functions/${name}/event-invoke-config`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ["aws", "lambda", "functions", vars.name, "event-invoke-config"] }),
  });
}

export function useDeleteEventInvokeConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/lambda/functions/${name}/event-invoke-config`, { method: "DELETE" }),
    onSuccess: (_data, name) =>
      qc.invalidateQueries({ queryKey: ["aws", "lambda", "functions", name, "event-invoke-config"] }),
  });
}

// ─── CREATE LAYER VERSION ───────────────────────────────

export function useCreateLayerVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, ...body }: any) =>
      api(`/aws/lambda/layers/${name}/versions`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aws", "lambda", "layers"] });
    },
  });
}

// ─── CODE SIGNING CONFIG ────────────────────────────────

export function useCodeSigningConfig(name: string | null) {
  return useQuery({
    queryKey: ["aws", "lambda", "functions", name, "code-signing-config"],
    queryFn: () =>
      api<{ codeSigningConfigArn?: string; functionName?: string }>(
        `/aws/lambda/functions/${name}/code-signing-config`
      ),
    enabled: !!name,
  });
}

export function useAttachCodeSigningConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, codeSigningConfigArn }: { name: string; codeSigningConfigArn: string }) =>
      api(`/aws/lambda/functions/${name}/code-signing-config`, {
        method: "PUT",
        body: JSON.stringify({ codeSigningConfigArn }),
      }),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ["aws", "lambda", "functions", vars.name, "code-signing-config"] }),
  });
}

export function useDetachCodeSigningConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/lambda/functions/${name}/code-signing-config`, { method: "DELETE" }),
    onSuccess: (_data, name) =>
      qc.invalidateQueries({ queryKey: ["aws", "lambda", "functions", name, "code-signing-config"] }),
  });
}

export function useCodeSigningConfigs() {
  return useQuery({
    queryKey: ["aws", "lambda", "code-signing-configs"],
    queryFn: () =>
      api<{ codeSigningConfigs: any[]; total: number }>("/aws/lambda/code-signing-configs"),
  });
}

export function useCreateCodeSigningConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api(`/aws/lambda/code-signing-configs`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "lambda", "code-signing-configs"] }),
  });
}

export function useDeleteCodeSigningConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (arn: string) =>
      api(`/aws/lambda/code-signing-configs/${encodeURIComponent(arn)}`, { method: "DELETE" }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "lambda", "code-signing-configs"] }),
  });
}
