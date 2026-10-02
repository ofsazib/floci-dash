import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface AiEventIntegration {
  Name?: string;
  EventIntegrationArn?: string;
  Description?: string;
}

export interface AiDataIntegration {
  Arn?: string;
  Name?: string;
  SourceURI?: string;
}

const enc = encodeURIComponent;

export function useAiEventIntegrations() {
  return useQuery({
    queryKey: ["aws", "appintegrations", "event-integrations"],
    queryFn: () =>
      api<{ eventIntegrations: AiEventIntegration[]; total: number }>(
        "/aws/appintegrations/event-integrations"
      ),
  });
}

export function useCreateAiEventIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      name: string;
      eventBridgeBus: string;
      eventFilter: { Source: string };
      description?: string;
    }) =>
      api<{ eventIntegration: AiEventIntegration }>(
        "/aws/appintegrations/event-integrations",
        { method: "POST", body: JSON.stringify(body) }
      ),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ["aws", "appintegrations", "event-integrations"],
      }),
  });
}

export function useDeleteAiEventIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/appintegrations/event-integrations/${enc(name)}`, { method: "DELETE" }),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ["aws", "appintegrations", "event-integrations"],
      }),
  });
}

export function useAiDataIntegrations() {
  return useQuery({
    queryKey: ["aws", "appintegrations", "data-integrations"],
    queryFn: () =>
      api<{ dataIntegrations: AiDataIntegration[]; total: number }>(
        "/aws/appintegrations/data-integrations"
      ),
  });
}

export function useCreateAiDataIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; sourceUri: string; kmsKey: string }) =>
      api<{ dataIntegration: AiDataIntegration }>("/aws/appintegrations/data-integrations", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ["aws", "appintegrations", "data-integrations"],
      }),
  });
}

export function useDeleteAiDataIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/aws/appintegrations/data-integrations/${enc(id)}`, { method: "DELETE" }),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ["aws", "appintegrations", "data-integrations"],
      }),
  });
}
