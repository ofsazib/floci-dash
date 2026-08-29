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

// ─── P1 gap audit — full API GW v1 surface ───────────────
export function useCreateAPIGatewayResource(apiId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { parentId: string; pathPart: string }) =>
      api(`/aws/apigateway/rest-apis/${apiId}/resources`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "apigateway", "resources", apiId] }),
  });
}

export function useDeleteAPIGatewayResource(apiId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (resourceId: string) =>
      api(`/aws/apigateway/rest-apis/${apiId}/resources/${resourceId}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "apigateway", "resources", apiId] }),
  });
}

export function usePutAPIGatewayMethod(apiId: string, resourceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { httpMethod: string; authorizationType?: string; apiKeyRequired?: boolean }) =>
      api(`/aws/apigateway/rest-apis/${apiId}/resources/${resourceId}/methods/${body.httpMethod}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "apigateway", "resources", apiId] }),
  });
}

export function usePutAPIGatewayIntegration(apiId: string, resourceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { httpMethod: string; type: string; integrationHttpMethod?: string; uri?: string }) =>
      api(`/aws/apigateway/rest-apis/${apiId}/resources/${resourceId}/methods/${body.httpMethod}/integration`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "apigateway", "resources", apiId] }),
  });
}

export function useCreateAPIGatewayDeployment(apiId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { stageName?: string; description?: string }) =>
      api(`/aws/apigateway/rest-apis/${apiId}/deployments`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aws", "apigateway", "deployments", apiId] });
      qc.invalidateQueries({ queryKey: ["aws", "apigateway", "stages", apiId] });
    },
  });
}

export function useDeleteAPIGatewayDeployment(apiId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (deploymentId: string) =>
      api(`/aws/apigateway/rest-apis/${apiId}/deployments/${deploymentId}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "apigateway", "deployments", apiId] }),
  });
}

export function useAPIGatewayStages(apiId: string | null) {
  return useQuery<{ stages: any[]; total: number }>({
    queryKey: ["aws", "apigateway", "stages", apiId],
    queryFn: () => api(`/aws/apigateway/rest-apis/${apiId}/stages`),
    enabled: !!apiId,
  });
}

export function useCreateAPIGatewayStage(apiId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { stageName: string; deploymentId?: string; description?: string }) =>
      api(`/aws/apigateway/rest-apis/${apiId}/stages`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "apigateway", "stages", apiId] }),
  });
}

export function useDeleteAPIGatewayStage(apiId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (stageName: string) =>
      api(`/aws/apigateway/rest-apis/${apiId}/stages/${stageName}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "apigateway", "stages", apiId] }),
  });
}

export function useAPIGatewayAuthorizers(apiId: string | null) {
  return useQuery<{ authorizers: any[]; total: number }>({
    queryKey: ["aws", "apigateway", "authorizers", apiId],
    queryFn: () => api(`/aws/apigateway/rest-apis/${apiId}/authorizers`),
    enabled: !!apiId,
  });
}

export function useCreateAPIGatewayAuthorizer(apiId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; type: string; providerARNs?: string[]; authorizerUri?: string }) =>
      api(`/aws/apigateway/rest-apis/${apiId}/authorizers`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "apigateway", "authorizers", apiId] }),
  });
}

export function useDeleteAPIGatewayAuthorizer(apiId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (authorizerId: string) =>
      api(`/aws/apigateway/rest-apis/${apiId}/authorizers/${authorizerId}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "apigateway", "authorizers", apiId] }),
  });
}

export function useAPIGatewayApiKeys() {
  return useQuery<{ apiKeys: any[]; total: number }>({
    queryKey: ["aws", "apigateway", "api-keys"],
    queryFn: () => api("/aws/apigateway/api-keys"),
  });
}

export function useCreateAPIGatewayApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; value?: string; description?: string; enabled?: boolean }) =>
      api("/aws/apigateway/api-keys", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "apigateway", "api-keys"] }),
  });
}

export function useDeleteAPIGatewayApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (keyId: string) => api(`/aws/apigateway/api-keys/${keyId}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "apigateway", "api-keys"] }),
  });
}

export function useImportAPIGatewayApiKeys() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { csv: string; format?: string }) =>
      api("/aws/apigateway/api-keys/import", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "apigateway", "api-keys"] }),
  });
}

export function useAPIGatewayUsagePlans() {
  return useQuery<{ usagePlans: any[]; total: number }>({
    queryKey: ["aws", "apigateway", "usage-plans"],
    queryFn: () => api("/aws/apigateway/usage-plans"),
  });
}

export function useCreateAPIGatewayUsagePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; description?: string; throttle?: unknown; quota?: unknown }) =>
      api("/aws/apigateway/usage-plans", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "apigateway", "usage-plans"] }),
  });
}

export function useDeleteAPIGatewayUsagePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) => api(`/aws/apigateway/usage-plans/${planId}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "apigateway", "usage-plans"] }),
  });
}

export function useAPIGatewayRequestValidators(apiId: string | null) {
  return useQuery<{ requestValidators: any[]; total: number }>({
    queryKey: ["aws", "apigateway", "request-validators", apiId],
    queryFn: () => api(`/aws/apigateway/rest-apis/${apiId}/request-validators`),
    enabled: !!apiId,
  });
}

export function useCreateAPIGatewayRequestValidator(apiId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; validateRequestBody?: boolean; validateRequestParameters?: boolean }) =>
      api(`/aws/apigateway/rest-apis/${apiId}/request-validators`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "apigateway", "request-validators", apiId] }),
  });
}

export function useDeleteAPIGatewayRequestValidator(apiId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (validatorId: string) =>
      api(`/aws/apigateway/rest-apis/${apiId}/request-validators/${validatorId}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "apigateway", "request-validators", apiId] }),
  });
}

export function useAPIGatewayModels(apiId: string | null) {
  return useQuery<{ models: any[]; total: number }>({
    queryKey: ["aws", "apigateway", "models", apiId],
    queryFn: () => api(`/aws/apigateway/rest-apis/${apiId}/models`),
    enabled: !!apiId,
  });
}

export function useCreateAPIGatewayModel(apiId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; contentType: string; schema: string; description?: string }) =>
      api(`/aws/apigateway/rest-apis/${apiId}/models`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "apigateway", "models", apiId] }),
  });
}

export function useDeleteAPIGatewayModel(apiId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (modelName: string) =>
      api(`/aws/apigateway/rest-apis/${apiId}/models/${modelName}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "apigateway", "models", apiId] }),
  });
}

export function useAPIGatewayDomainNames() {
  return useQuery<{ domainNames: any[]; total: number }>({
    queryKey: ["aws", "apigateway", "domain-names"],
    queryFn: () => api("/aws/apigateway/domain-names"),
  });
}

export function useCreateAPIGatewayDomainName() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { domainName: string }) =>
      api("/aws/apigateway/domain-names", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "apigateway", "domain-names"] }),
  });
}

export function useDeleteAPIGatewayDomainName() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (domainName: string) =>
      api(`/aws/apigateway/domain-names/${domainName}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "apigateway", "domain-names"] }),
  });
}

export function useAPIGatewayAccount() {
  return useQuery<{ account: unknown }>({
    queryKey: ["aws", "apigateway", "account"],
    queryFn: () => api("/aws/apigateway/account"),
  });
}
