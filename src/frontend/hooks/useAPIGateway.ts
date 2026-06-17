import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

// ─── REST APIs ───────────────────────────────────────────

export function useAPIGatewayApis() {
  return useQuery({
    queryKey: ["aws", "apigateway", "rest-apis"],
    queryFn: () =>
      api<{ apis: any[]; total: number }>("/aws/apigateway/rest-apis"),
    refetchInterval: 15000,
  });
}

export function useAPIGatewayApi(apiId: string | null) {
  return useQuery({
    queryKey: ["aws", "apigateway", "rest-apis", apiId],
    queryFn: () => api<{ api: any }>(`/aws/apigateway/rest-apis/${apiId}`),
    enabled: !!apiId,
  });
}

export function useCreateAPIGatewayApi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/apigateway/rest-apis", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "apigateway", "rest-apis"] }),
  });
}

export function useDeleteAPIGatewayApi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (apiId: string) =>
      api(`/aws/apigateway/rest-apis/${apiId}`, { method: "DELETE" }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "apigateway", "rest-apis"] }),
  });
}

// ─── Resources ───────────────────────────────────────────

export function useAPIGatewayResources(apiId: string | null) {
  return useQuery({
    queryKey: ["aws", "apigateway", "rest-apis", apiId, "resources"],
    queryFn: () =>
      api<{ resources: any[]; total: number }>(`/aws/apigateway/rest-apis/${apiId}/resources`),
    enabled: !!apiId,
  });
}

// ─── Deployments ─────────────────────────────────────────

export function useAPIGatewayDeployments(apiId: string | null) {
  return useQuery({
    queryKey: ["aws", "apigateway", "rest-apis", apiId, "deployments"],
    queryFn: () =>
      api<{ deployments: any[]; total: number }>(`/aws/apigateway/rest-apis/${apiId}/deployments`),
    enabled: !!apiId,
  });
}
