import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface ApiGatewayV2Api {
  ApiId: string;
  Name: string;
  ProtocolType?: string;
  ApiEndpoint?: string;
  Description?: string;
  RouteSelectionExpression?: string;
  CreatedDate?: number;
  Tags?: Record<string, string>;
}

export interface ApiGatewayV2Route {
  RouteId: string;
  RouteKey: string;
  AuthorizationType?: string;
  Target?: string;
}

export interface ApiGatewayV2Integration {
  IntegrationId: string;
  IntegrationType: string;
  IntegrationUri?: string;
  IntegrationMethod?: string;
  PayloadFormatVersion?: string;
  ConnectionType?: string;
}

export interface ApiGatewayV2Stage {
  StageName: string;
  AutoDeploy?: boolean;
  DeploymentId?: string;
  CreatedDate?: number;
  LastUpdatedDate?: number;
}

export interface ApiGatewayV2Deployment {
  DeploymentId: string;
  DeploymentStatus?: string;
  CreatedDate?: number;
  Description?: string;
}

// ── APIs ─────────────────────────────────────────────────

export function useApiGatewayV2Apis() {
  return useQuery<{ apis: ApiGatewayV2Api[]; total: number }>({
    queryKey: ["aws", "apigatewayv2", "apis"],
    queryFn: () => api("/aws/apigatewayv2/apis"),
    refetchInterval: 10000,
  });
}

export function useCreateApiGatewayV2Api() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      name: string;
      protocolType?: string;
      description?: string;
      routeSelectionExpression?: string;
    }) =>
      api("/aws/apigatewayv2/apis", { method: "POST", body: JSON.stringify(params) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "apigatewayv2", "apis"] }),
  });
}

export function useDeleteApiGatewayV2Api() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (apiId: string) =>
      api(`/aws/apigatewayv2/apis/${encodeURIComponent(apiId)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "apigatewayv2", "apis"] }),
  });
}

// ── Routes ───────────────────────────────────────────────

export function useApiGatewayV2Routes(apiId: string | null) {
  return useQuery<{ routes: ApiGatewayV2Route[]; total: number }>({
    queryKey: ["aws", "apigatewayv2", "routes", apiId],
    queryFn: () => api(`/aws/apigatewayv2/apis/${encodeURIComponent(apiId!)}/routes`),
    enabled: !!apiId,
  });
}

export function useCreateApiGatewayV2Route(apiId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { routeKey: string; authorizationType?: string; target?: string }) =>
      api(`/aws/apigatewayv2/apis/${encodeURIComponent(apiId)}/routes`, {
        method: "POST",
        body: JSON.stringify(params),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "apigatewayv2", "routes", apiId] }),
  });
}

export function useDeleteApiGatewayV2Route(apiId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (routeId: string) =>
      api(
        `/aws/apigatewayv2/apis/${encodeURIComponent(apiId)}/routes/${encodeURIComponent(routeId)}`,
        { method: "DELETE" }
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "apigatewayv2", "routes", apiId] }),
  });
}

// ── Integrations ─────────────────────────────────────────

export function useApiGatewayV2Integrations(apiId: string | null) {
  return useQuery<{ integrations: ApiGatewayV2Integration[]; total: number }>({
    queryKey: ["aws", "apigatewayv2", "integrations", apiId],
    queryFn: () => api(`/aws/apigatewayv2/apis/${encodeURIComponent(apiId!)}/integrations`),
    enabled: !!apiId,
  });
}

// ── Stages ───────────────────────────────────────────────

export function useApiGatewayV2Stages(apiId: string | null) {
  return useQuery<{ stages: ApiGatewayV2Stage[]; total: number }>({
    queryKey: ["aws", "apigatewayv2", "stages", apiId],
    queryFn: () => api(`/aws/apigatewayv2/apis/${encodeURIComponent(apiId!)}/stages`),
    enabled: !!apiId,
  });
}

export function useDeleteApiGatewayV2Stage(apiId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (stageName: string) =>
      api(
        `/aws/apigatewayv2/apis/${encodeURIComponent(apiId)}/stages/${encodeURIComponent(stageName)}`,
        { method: "DELETE" }
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "apigatewayv2", "stages", apiId] }),
  });
}

// ── Deployments ──────────────────────────────────────────

export function useApiGatewayV2Deployments(apiId: string | null) {
  return useQuery<{ deployments: ApiGatewayV2Deployment[]; total: number }>({
    queryKey: ["aws", "apigatewayv2", "deployments", apiId],
    queryFn: () => api(`/aws/apigatewayv2/apis/${encodeURIComponent(apiId!)}/deployments`),
    enabled: !!apiId,
  });
}

export function useCreateApiGatewayV2Deployment(apiId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { description?: string; stageName?: string }) =>
      api(`/aws/apigatewayv2/apis/${encodeURIComponent(apiId)}/deployments`, {
        method: "POST",
        body: JSON.stringify(params),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "apigatewayv2", "deployments", apiId] }),
  });
}

export function useDeleteApiGatewayV2Deployment(apiId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (deploymentId: string) =>
      api(
        `/aws/apigatewayv2/apis/${encodeURIComponent(apiId)}/deployments/${encodeURIComponent(deploymentId)}`,
        { method: "DELETE" }
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "apigatewayv2", "deployments", apiId] }),
  });
}
