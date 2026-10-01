import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface BedrockGuardrailSummary {
  id?: string;
  arn?: string;
  name?: string;
  description?: string;
  status?: string;
  version?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BedrockGuardrail extends BedrockGuardrailSummary {
  blockedInputMessaging?: string;
  blockedOutputsMessaging?: string;
  guardrailId?: string;
}

const enc = encodeURIComponent;

export function useBedrockGuardrails() {
  return useQuery({
    queryKey: ["aws", "bedrock", "guardrails"],
    queryFn: () =>
      api<{ guardrails: BedrockGuardrailSummary[]; total: number }>(
        "/aws/bedrock/guardrails"
      ),
  });
}

export function useCreateBedrockGuardrail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      name: string;
      description?: string;
      blockedInputMessaging: string;
      blockedOutputsMessaging: string;
    }) =>
      api<{ guardrail: BedrockGuardrail }>("/aws/bedrock/guardrails", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "bedrock", "guardrails"] }),
  });
}

export function useDeleteBedrockGuardrail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: { id: string; version?: string }) =>
      api(
        `/aws/bedrock/guardrails/${enc(id)}${version ? `?version=${enc(version)}` : ""}`,
        { method: "DELETE" }
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "bedrock", "guardrails"] }),
  });
}
