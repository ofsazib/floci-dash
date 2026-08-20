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

export interface ApiGatewayV2WebSocketRouteIntegration {
  IntegrationId: string;
  IntegrationType?: string;
  IntegrationUri?: string;
  IntegrationMethod?: string;
}

export interface ApiGatewayV2WebSocketRoute {
  RouteId: string;
  RouteKey: string;
  target: string | null;
  integrationId: string | null;
  integration: ApiGatewayV2WebSocketRouteIntegration | null;
  isWellKnown: boolean;
  authorizationType?: string;
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

// ── WebSocket (route resolution display) ─────────────────

export function useApiGatewayV2WebSocketApis() {
  return useQuery<{ apis: ApiGatewayV2Api[]; total: number }>({
    queryKey: ["aws", "apigatewayv2", "websocket-apis"],
    queryFn: () => api("/aws/apigatewayv2/websocket-apis"),
    refetchInterval: 10000,
  });
}

export function useApiGatewayV2WebSocketRoutes(apiId: string | null) {
  return useQuery<{ routes: ApiGatewayV2WebSocketRoute[]; total: number }>({
    queryKey: ["aws", "apigatewayv2", "websocket-routes", apiId],
    queryFn: () =>
      api(`/aws/apigatewayv2/apis/${encodeURIComponent(apiId!)}/websocket-routes`),
    enabled: !!apiId,
  });
}

// ── G.96: authorizers, models, responses, tags ──────────

export function useApiGatewayV2Authorizers(apiId: string | null) {
  return useQuery<{ authorizers: any[]; total: number }>({
    queryKey: ["aws", "apigatewayv2", "authorizers", apiId],
    queryFn: () => api(`/aws/apigatewayv2/apis/${encodeURIComponent(apiId!)}/authorizers`),
    enabled: !!apiId,
  });
}

export function useCreateApiGatewayV2Authorizer(apiId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: any) =>
      api(`/aws/apigatewayv2/apis/${encodeURIComponent(apiId)}/authorizers`, {
        method: "POST",
        body: JSON.stringify(params),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "apigatewayv2", "authorizers", apiId] }),
  });
}

export function useUpdateApiGatewayV2Authorizer(apiId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { authorizerId: string } & Record<string, any>) =>
      api(
        `/aws/apigatewayv2/apis/${encodeURIComponent(apiId)}/authorizers/${encodeURIComponent(params.authorizerId)}`,
        { method: "PUT", body: JSON.stringify(params) }
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "apigatewayv2", "authorizers", apiId] }),
  });
}

export function useDeleteApiGatewayV2Authorizer(apiId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (authorizerId: string) =>
      api(
        `/aws/apigatewayv2/apis/${encodeURIComponent(apiId)}/authorizers/${encodeURIComponent(authorizerId)}`,
        { method: "DELETE" }
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "apigatewayv2", "authorizers", apiId] }),
  });
}

export function useApiGatewayV2Models(apiId: string | null) {
  return useQuery<{ models: any[]; total: number }>({
    queryKey: ["aws", "apigatewayv2", "models", apiId],
    queryFn: () => api(`/aws/apigatewayv2/apis/${encodeURIComponent(apiId!)}/models`),
    enabled: !!apiId,
  });
}

export function useCreateApiGatewayV2Model(apiId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: any) =>
      api(`/aws/apigatewayv2/apis/${encodeURIComponent(apiId)}/models`, {
        method: "POST",
        body: JSON.stringify(params),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "apigatewayv2", "models", apiId] }),
  });
}

export function useUpdateApiGatewayV2Model(apiId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { modelId: string } & Record<string, any>) =>
      api(
        `/aws/apigatewayv2/apis/${encodeURIComponent(apiId)}/models/${encodeURIComponent(params.modelId)}`,
        { method: "PUT", body: JSON.stringify(params) }
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "apigatewayv2", "models", apiId] }),
  });
}

export function useDeleteApiGatewayV2Model(apiId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (modelId: string) =>
      api(
        `/aws/apigatewayv2/apis/${encodeURIComponent(apiId)}/models/${encodeURIComponent(modelId)}`,
        { method: "DELETE" }
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "apigatewayv2", "models", apiId] }),
  });
}

export function useApiGatewayV2IntegrationResponses(apiId: string | null, integrationId: string | null) {
  return useQuery<{ integrationResponses: any[]; total: number }>({
    queryKey: ["aws", "apigatewayv2", "integration-responses", apiId, integrationId],
    queryFn: () =>
      api(
        `/aws/apigatewayv2/apis/${encodeURIComponent(apiId!)}/integrations/${encodeURIComponent(integrationId!)}/integrationresponses`
      ),
    enabled: !!apiId && !!integrationId,
  });
}

export function useCreateApiGatewayV2IntegrationResponse(apiId: string, integrationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: any) =>
      api(
        `/aws/apigatewayv2/apis/${encodeURIComponent(apiId)}/integrations/${encodeURIComponent(integrationId)}/integrationresponses`,
        { method: "POST", body: JSON.stringify(params) }
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "apigatewayv2", "integration-responses", apiId, integrationId] }),
  });
}

export function useDeleteApiGatewayV2IntegrationResponse(apiId: string, integrationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (responseId: string) =>
      api(
        `/aws/apigatewayv2/apis/${encodeURIComponent(apiId)}/integrations/${encodeURIComponent(integrationId)}/integrationresponses/${encodeURIComponent(responseId)}`,
        { method: "DELETE" }
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "apigatewayv2", "integration-responses", apiId, integrationId] }),
  });
}

export function useApiGatewayV2RouteResponses(apiId: string | null, routeId: string | null) {
  return useQuery<{ routeResponses: any[]; total: number }>({
    queryKey: ["aws", "apigatewayv2", "route-responses", apiId, routeId],
    queryFn: () =>
      api(
        `/aws/apigatewayv2/apis/${encodeURIComponent(apiId!)}/routes/${encodeURIComponent(routeId!)}/routeresponses`
      ),
    enabled: !!apiId && !!routeId,
  });
}

export function useCreateApiGatewayV2RouteResponse(apiId: string, routeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: any) =>
      api(
        `/aws/apigatewayv2/apis/${encodeURIComponent(apiId)}/routes/${encodeURIComponent(routeId)}/routeresponses`,
        { method: "POST", body: JSON.stringify(params) }
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "apigatewayv2", "route-responses", apiId, routeId] }),
  });
}

export function useDeleteApiGatewayV2RouteResponse(apiId: string, routeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (responseId: string) =>
      api(
        `/aws/apigatewayv2/apis/${encodeURIComponent(apiId)}/routes/${encodeURIComponent(routeId)}/routeresponses/${encodeURIComponent(responseId)}`,
        { method: "DELETE" }
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "apigatewayv2", "route-responses", apiId, routeId] }),
  });
}

export function useUpdateApiGatewayV2Route(apiId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { routeId: string } & Record<string, any>) =>
      api(
        `/aws/apigatewayv2/apis/${encodeURIComponent(apiId)}/routes/${encodeURIComponent(params.routeId)}`,
        { method: "PUT", body: JSON.stringify(params) }
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "apigatewayv2", "routes", apiId] }),
  });
}

export function useUpdateApiGatewayV2Integration(apiId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { integrationId: string } & Record<string, any>) =>
      api(
        `/aws/apigatewayv2/apis/${encodeURIComponent(apiId)}/integrations/${encodeURIComponent(params.integrationId)}`,
        { method: "PUT", body: JSON.stringify(params) }
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "apigatewayv2", "integrations", apiId] }),
  });
}

export function useUpdateApiGatewayV2Stage(apiId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { stageName: string } & Record<string, any>) =>
      api(
        `/aws/apigatewayv2/apis/${encodeURIComponent(apiId)}/stages/${encodeURIComponent(params.stageName)}`,
        { method: "PUT", body: JSON.stringify(params) }
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "apigatewayv2", "stages", apiId] }),
  });
}

export function useUpdateApiGatewayV2Deployment(apiId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { deploymentId: string } & Record<string, any>) =>
      api(
        `/aws/apigatewayv2/apis/${encodeURIComponent(apiId)}/deployments/${encodeURIComponent(params.deploymentId)}`,
        { method: "PUT", body: JSON.stringify(params) }
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "apigatewayv2", "deployments", apiId] }),
  });
}

export function useApiGatewayV2Tags(apiId: string | null) {
  return useQuery<{ tags: Record<string, string> }>({
    queryKey: ["aws", "apigatewayv2", "tags", apiId],
    queryFn: () => api(`/aws/apigatewayv2/apis/${encodeURIComponent(apiId!)}/tags`),
    enabled: !!apiId,
  });
}

export function useTagApiGatewayV2Resource(apiId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tags: Record<string, string>) =>
      api(`/aws/apigatewayv2/apis/${encodeURIComponent(apiId)}/tags`, {
        method: "PUT",
        body: JSON.stringify({ tags }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "apigatewayv2", "tags", apiId] }),
  });
}

export function useUntagApiGatewayV2Resource(apiId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tagKeys: string[]) =>
      api(`/aws/apigatewayv2/apis/${encodeURIComponent(apiId)}/tags`, {
        method: "DELETE",
        body: JSON.stringify({ tagKeys }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "apigatewayv2", "tags", apiId] }),
  });
}
