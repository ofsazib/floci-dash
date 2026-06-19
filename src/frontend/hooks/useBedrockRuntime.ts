import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/client";

// ── Bedrock Runtime Operations ───────────────────────────

export function useBedrockConverse(modelId: string) {
  return useMutation({
    mutationFn: (params: {
      messages: { role: string; content: { text?: string }[] }[];
      system?: { text: string }[];
      inferenceConfig?: any;
    }) =>
      api(`/aws/bedrockruntime/models/${encodeURIComponent(modelId)}/converse`, {
        method: "POST",
        body: JSON.stringify(params),
      }),
  });
}

export function useBedrockInvokeModel(modelId: string) {
  return useMutation({
    mutationFn: (body: any) =>
      api(`/aws/bedrockruntime/models/${encodeURIComponent(modelId)}/invoke`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
  });
}
