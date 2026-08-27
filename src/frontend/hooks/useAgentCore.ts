import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface AgentRuntimeSummary {
  agentRuntimeId?: string;
  agentRuntimeName?: string;
  status?: string;
  description?: string;
  latestVersion?: string;
}

export function useAgentRuntimes() {
  return useQuery<{ agentRuntimes: AgentRuntimeSummary[]; total: number; nextToken: string | null }>({
    queryKey: ["aws", "bedrockagentcore", "runtimes"],
    queryFn: () => api("/aws/bedrockagentcore/runtimes"),
  });
}

export function useAgentRuntime(id: string | null) {
  return useQuery<{ runtime: any }>({
    queryKey: ["aws", "bedrockagentcore", "runtimes", id],
    queryFn: () => api(`/aws/bedrockagentcore/runtimes/${encodeURIComponent(id!)}`),
    enabled: !!id,
  });
}

export function useCreateAgentRuntime() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      name: string;
      roleArn: string;
      description?: string;
      containerUri?: string;
    }) =>
      api("/aws/bedrockagentcore/runtimes", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "bedrockagentcore", "runtimes"] }),
  });
}

export function useUpdateAgentRuntime() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; roleArn?: string; description?: string }) =>
      api(`/aws/bedrockagentcore/runtimes/${encodeURIComponent(params.id)}`, {
        method: "PATCH",
        body: JSON.stringify({ roleArn: params.roleArn, description: params.description }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "bedrockagentcore", "runtimes"] }),
  });
}

export function useDeleteAgentRuntime() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/aws/bedrockagentcore/runtimes/${encodeURIComponent(id)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "bedrockagentcore", "runtimes"] }),
  });
}

export function useInvokeAgentRuntime() {
  return useMutation({
    mutationFn: (params: { arn: string; payload: unknown; qualifier?: string }) =>
      api(`/aws/bedrockagentcore/invoke/${encodeURIComponent(params.arn)}`, {
        method: "POST",
        body: JSON.stringify({
          payload: params.payload,
          qualifier: params.qualifier ?? "DEFAULT",
        }),
      }),
  });
}
