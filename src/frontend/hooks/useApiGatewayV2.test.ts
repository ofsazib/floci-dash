// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createWrapper } from "../../test/helpers";

const mockApi = vi.hoisted(() => vi.fn());
vi.mock("../lib/client", () => ({ api: (...args: any[]) => mockApi(...args) }));
vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual: any = await importOriginal();
  return { ...actual, useQueryClient: () => ({ invalidateQueries: vi.fn() }) };
});

import {
  useApiGatewayV2Apis,
  useCreateApiGatewayV2Api,
  useDeleteApiGatewayV2Api,
  useApiGatewayV2Routes,
  useApiGatewayV2Integrations,
  useApiGatewayV2Stages,
  useApiGatewayV2Deployments,
  useCreateApiGatewayV2Deployment,
  useDeleteApiGatewayV2Route,
  useCreateApiGatewayV2Route,
  useDeleteApiGatewayV2Stage,
  useDeleteApiGatewayV2Deployment,
  useApiGatewayV2Authorizers,
  useCreateApiGatewayV2Authorizer,
  useUpdateApiGatewayV2Authorizer,
  useDeleteApiGatewayV2Authorizer,
  useApiGatewayV2Models,
  useCreateApiGatewayV2Model,
  useUpdateApiGatewayV2Model,
  useDeleteApiGatewayV2Model,
  useApiGatewayV2IntegrationResponses,
  useCreateApiGatewayV2IntegrationResponse,
  useDeleteApiGatewayV2IntegrationResponse,
  useApiGatewayV2RouteResponses,
  useCreateApiGatewayV2RouteResponse,
  useDeleteApiGatewayV2RouteResponse,
  useUpdateApiGatewayV2Route,
  useUpdateApiGatewayV2Integration,
  useUpdateApiGatewayV2Stage,
  useUpdateApiGatewayV2Deployment,
  useApiGatewayV2Tags,
  useTagApiGatewayV2Resource,
  useUntagApiGatewayV2Resource,
} from "./useApiGatewayV2";

beforeEach(() => mockApi.mockReset());

describe("useApiGatewayV2 hooks", () => {
  it("useApiGatewayV2Apis calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ apis: [], total: 0 });
    const { result } = renderHook(() => useApiGatewayV2Apis(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/apigatewayv2/apis");
  });

  it("useCreateApiGatewayV2Api calls POST", async () => {
    mockApi.mockResolvedValueOnce({ api: {} });
    const { result } = renderHook(() => useCreateApiGatewayV2Api(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "my-api" });
    expect(mockApi).toHaveBeenCalledWith("/aws/apigatewayv2/apis", {
      method: "POST",
      body: JSON.stringify({ name: "my-api" }),
    });
  });

  it("useDeleteApiGatewayV2Api calls DELETE", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteApiGatewayV2Api(), { wrapper: createWrapper() });
    await result.current.mutateAsync("api-1");
    expect(mockApi).toHaveBeenCalledWith("/aws/apigatewayv2/apis/api-1", { method: "DELETE" });
  });

  it("useApiGatewayV2Routes calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ routes: [], total: 0 });
    const { result } = renderHook(() => useApiGatewayV2Routes("api-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/apigatewayv2/apis/api-1/routes");
  });

  it("useApiGatewayV2Routes disabled when null", () => {
    const { result } = renderHook(() => useApiGatewayV2Routes(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useApiGatewayV2Integrations calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ integrations: [], total: 0 });
    const { result } = renderHook(() => useApiGatewayV2Integrations("api-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/apigatewayv2/apis/api-1/integrations");
  });

  it("useApiGatewayV2Stages calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ stages: [], total: 0 });
    const { result } = renderHook(() => useApiGatewayV2Stages("api-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/apigatewayv2/apis/api-1/stages");
  });

  it("useApiGatewayV2Deployments calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ deployments: [], total: 0 });
    const { result } = renderHook(() => useApiGatewayV2Deployments("api-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/apigatewayv2/apis/api-1/deployments");
  });

  it("useCreateApiGatewayV2Deployment calls POST", async () => {
    mockApi.mockResolvedValueOnce({ deployment: {} });
    const { result } = renderHook(() => useCreateApiGatewayV2Deployment("api-1"), { wrapper: createWrapper() });
    await result.current.mutateAsync({});
    expect(mockApi).toHaveBeenCalledWith("/aws/apigatewayv2/apis/api-1/deployments", {
      method: "POST",
      body: JSON.stringify({}),
    });
  });

  it("useDeleteApiGatewayV2Route calls DELETE", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteApiGatewayV2Route("api-1"), { wrapper: createWrapper() });
    await result.current.mutateAsync("route-1");
    expect(mockApi).toHaveBeenCalledWith("/aws/apigatewayv2/apis/api-1/routes/route-1", {
      method: "DELETE",
    });
  });

  it("useCreateApiGatewayV2Route calls POST", async () => {
    mockApi.mockResolvedValueOnce({ route: {} });
    const { result } = renderHook(() => useCreateApiGatewayV2Route("api-1"), { wrapper: createWrapper() });
    await result.current.mutateAsync({ routeKey: "$default", target: "integrations/int-1" });
    expect(mockApi).toHaveBeenCalledWith("/aws/apigatewayv2/apis/api-1/routes", {
      method: "POST",
      body: JSON.stringify({ routeKey: "$default", target: "integrations/int-1" }),
    });
  });

  it("useDeleteApiGatewayV2Stage calls DELETE with encoded stage name", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteApiGatewayV2Stage("api-1"), { wrapper: createWrapper() });
    await result.current.mutateAsync("prod stage");
    expect(mockApi).toHaveBeenCalledWith("/aws/apigatewayv2/apis/api-1/stages/prod%20stage", {
      method: "DELETE",
    });
  });

  it("useDeleteApiGatewayV2Deployment calls DELETE", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteApiGatewayV2Deployment("api-1"), { wrapper: createWrapper() });
    await result.current.mutateAsync("dep-1");
    expect(mockApi).toHaveBeenCalledWith("/aws/apigatewayv2/apis/api-1/deployments/dep-1", {
      method: "DELETE",
    });
  });
});

describe("G.96 — authorizers, models, responses, tags hooks", () => {
  it("useApiGatewayV2Authorizers fetches with encoded id (and skips null)", async () => {
    mockApi.mockResolvedValueOnce({ authorizers: [], total: 0 });
    const { result } = renderHook(() => useApiGatewayV2Authorizers("api 1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/apigatewayv2/apis/api%201/authorizers");
    const { result: r2 } = renderHook(() => useApiGatewayV2Authorizers(null), { wrapper: createWrapper() });
    await waitFor(() => expect(r2.current.fetchStatus).toBe("idle"));
    expect(mockApi).not.toHaveBeenCalledWith("/aws/apigatewayv2/apis/null/authorizers");
  });

  it("useCreateApiGatewayV2Authorizer POSTs", async () => {
    mockApi.mockResolvedValueOnce({ authorizer: {} });
    const { result } = renderHook(() => useCreateApiGatewayV2Authorizer("api-1"), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "auth", authorizerType: "REQUEST" });
    expect(mockApi).toHaveBeenCalledWith("/aws/apigatewayv2/apis/api-1/authorizers", {
      method: "POST",
      body: JSON.stringify({ name: "auth", authorizerType: "REQUEST" }),
    });
  });

  it("useUpdateApiGatewayV2Authorizer PUTs with the id in the URL", async () => {
    mockApi.mockResolvedValueOnce({ authorizer: {} });
    const { result } = renderHook(() => useUpdateApiGatewayV2Authorizer("api-1"), { wrapper: createWrapper() });
    await result.current.mutateAsync({ authorizerId: "a-1", name: "renamed", authorizerType: "JWT" });
    expect(mockApi).toHaveBeenCalledWith("/aws/apigatewayv2/apis/api-1/authorizers/a-1", {
      method: "PUT",
      body: JSON.stringify({ authorizerId: "a-1", name: "renamed", authorizerType: "JWT" }),
    });
  });

  it("useDeleteApiGatewayV2Authorizer DELETEs", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteApiGatewayV2Authorizer("api-1"), { wrapper: createWrapper() });
    await result.current.mutateAsync("a-1");
    expect(mockApi).toHaveBeenCalledWith("/aws/apigatewayv2/apis/api-1/authorizers/a-1", { method: "DELETE" });
  });

  it("useApiGatewayV2Models fetches and skips null", async () => {
    mockApi.mockResolvedValueOnce({ models: [], total: 0 });
    const { result } = renderHook(() => useApiGatewayV2Models("api-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/apigatewayv2/apis/api-1/models");
    const { result: r2 } = renderHook(() => useApiGatewayV2Models(null), { wrapper: createWrapper() });
    await waitFor(() => expect(r2.current.fetchStatus).toBe("idle"));
  });

  it("useCreateApiGatewayV2Model POSTs", async () => {
    mockApi.mockResolvedValueOnce({ model: {} });
    const { result } = renderHook(() => useCreateApiGatewayV2Model("api-1"), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "pet", schema: "{}" });
    expect(mockApi).toHaveBeenCalledWith("/aws/apigatewayv2/apis/api-1/models", {
      method: "POST",
      body: JSON.stringify({ name: "pet", schema: "{}" }),
    });
  });

  it("useUpdateApiGatewayV2Model PUTs", async () => {
    mockApi.mockResolvedValueOnce({ model: {} });
    const { result } = renderHook(() => useUpdateApiGatewayV2Model("api-1"), { wrapper: createWrapper() });
    await result.current.mutateAsync({ modelId: "m-1", name: "pet2" });
    expect(mockApi).toHaveBeenCalledWith("/aws/apigatewayv2/apis/api-1/models/m-1", {
      method: "PUT",
      body: JSON.stringify({ modelId: "m-1", name: "pet2" }),
    });
  });

  it("useDeleteApiGatewayV2Model DELETEs", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteApiGatewayV2Model("api-1"), { wrapper: createWrapper() });
    await result.current.mutateAsync("m-1");
    expect(mockApi).toHaveBeenCalledWith("/aws/apigatewayv2/apis/api-1/models/m-1", { method: "DELETE" });
  });

  it("useApiGatewayV2IntegrationResponses fetches with both ids (and skips null)", async () => {
    mockApi.mockResolvedValueOnce({ integrationResponses: [], total: 0 });
    const { result } = renderHook(() => useApiGatewayV2IntegrationResponses("api-1", "i-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/apigatewayv2/apis/api-1/integrations/i-1/integrationresponses");
    const { result: r2 } = renderHook(() => useApiGatewayV2IntegrationResponses("api-1", null), { wrapper: createWrapper() });
    await waitFor(() => expect(r2.current.fetchStatus).toBe("idle"));
  });

  it("useCreate/DeleteApiGatewayV2IntegrationResponse", async () => {
    mockApi.mockResolvedValueOnce({ integrationResponse: {} });
    const { result } = renderHook(() => useCreateApiGatewayV2IntegrationResponse("api-1", "i-1"), { wrapper: createWrapper() });
    await result.current.mutateAsync({ integrationResponseKey: "200" });
    expect(mockApi).toHaveBeenCalledWith("/aws/apigatewayv2/apis/api-1/integrations/i-1/integrationresponses", {
      method: "POST",
      body: JSON.stringify({ integrationResponseKey: "200" }),
    });
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result: r2 } = renderHook(() => useDeleteApiGatewayV2IntegrationResponse("api-1", "i-1"), { wrapper: createWrapper() });
    await r2.current.mutateAsync("ir-1");
    expect(mockApi).toHaveBeenCalledWith("/aws/apigatewayv2/apis/api-1/integrations/i-1/integrationresponses/ir-1", { method: "DELETE" });
  });

  it("useApiGatewayV2RouteResponses fetches with both ids (and skips null)", async () => {
    mockApi.mockResolvedValueOnce({ routeResponses: [], total: 0 });
    const { result } = renderHook(() => useApiGatewayV2RouteResponses("api-1", "r-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/apigatewayv2/apis/api-1/routes/r-1/routeresponses");
    const { result: r2 } = renderHook(() => useApiGatewayV2RouteResponses(null, "r-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(r2.current.fetchStatus).toBe("idle"));
  });

  it("useCreate/DeleteApiGatewayV2RouteResponse", async () => {
    mockApi.mockResolvedValueOnce({ routeResponse: {} });
    const { result } = renderHook(() => useCreateApiGatewayV2RouteResponse("api-1", "r-1"), { wrapper: createWrapper() });
    await result.current.mutateAsync({ routeResponseKey: "default" });
    expect(mockApi).toHaveBeenCalledWith("/aws/apigatewayv2/apis/api-1/routes/r-1/routeresponses", {
      method: "POST",
      body: JSON.stringify({ routeResponseKey: "default" }),
    });
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result: r2 } = renderHook(() => useDeleteApiGatewayV2RouteResponse("api-1", "r-1"), { wrapper: createWrapper() });
    await r2.current.mutateAsync("rr-1");
    expect(mockApi).toHaveBeenCalledWith("/aws/apigatewayv2/apis/api-1/routes/r-1/routeresponses/rr-1", { method: "DELETE" });
  });

  it("useUpdateApiGatewayV2Route PUTs", async () => {
    mockApi.mockResolvedValueOnce({ route: {} });
    const { result } = renderHook(() => useUpdateApiGatewayV2Route("api-1"), { wrapper: createWrapper() });
    await result.current.mutateAsync({ routeId: "r-1", routeKey: "GET /x" });
    expect(mockApi).toHaveBeenCalledWith("/aws/apigatewayv2/apis/api-1/routes/r-1", {
      method: "PUT",
      body: JSON.stringify({ routeId: "r-1", routeKey: "GET /x" }),
    });
  });

  it("useUpdateApiGatewayV2Integration PUTs", async () => {
    mockApi.mockResolvedValueOnce({ integration: {} });
    const { result } = renderHook(() => useUpdateApiGatewayV2Integration("api-1"), { wrapper: createWrapper() });
    await result.current.mutateAsync({ integrationId: "i-1", integrationType: "AWS_PROXY" });
    expect(mockApi).toHaveBeenCalledWith("/aws/apigatewayv2/apis/api-1/integrations/i-1", {
      method: "PUT",
      body: JSON.stringify({ integrationId: "i-1", integrationType: "AWS_PROXY" }),
    });
  });

  it("useUpdateApiGatewayV2Stage PUTs with encoded stage name", async () => {
    mockApi.mockResolvedValueOnce({ stage: {} });
    const { result } = renderHook(() => useUpdateApiGatewayV2Stage("api-1"), { wrapper: createWrapper() });
    await result.current.mutateAsync({ stageName: "prod v2", autoDeploy: false });
    expect(mockApi).toHaveBeenCalledWith("/aws/apigatewayv2/apis/api-1/stages/prod%20v2", {
      method: "PUT",
      body: JSON.stringify({ stageName: "prod v2", autoDeploy: false }),
    });
  });

  it("useUpdateApiGatewayV2Deployment PUTs", async () => {
    mockApi.mockResolvedValueOnce({ deployment: {} });
    const { result } = renderHook(() => useUpdateApiGatewayV2Deployment("api-1"), { wrapper: createWrapper() });
    await result.current.mutateAsync({ deploymentId: "d-1", description: "v2" });
    expect(mockApi).toHaveBeenCalledWith("/aws/apigatewayv2/apis/api-1/deployments/d-1", {
      method: "PUT",
      body: JSON.stringify({ deploymentId: "d-1", description: "v2" }),
    });
  });

  it("useApiGatewayV2Tags fetches and skips null", async () => {
    mockApi.mockResolvedValueOnce({ tags: { env: "dev" } });
    const { result } = renderHook(() => useApiGatewayV2Tags("api-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/apigatewayv2/apis/api-1/tags");
    const { result: r2 } = renderHook(() => useApiGatewayV2Tags(null), { wrapper: createWrapper() });
    await waitFor(() => expect(r2.current.fetchStatus).toBe("idle"));
  });

  it("useTagApiGatewayV2Resource PUTs tags", async () => {
    mockApi.mockResolvedValueOnce({ tagged: true });
    const { result } = renderHook(() => useTagApiGatewayV2Resource("api-1"), { wrapper: createWrapper() });
    await result.current.mutateAsync({ env: "dev" });
    expect(mockApi).toHaveBeenCalledWith("/aws/apigatewayv2/apis/api-1/tags", {
      method: "PUT",
      body: JSON.stringify({ tags: { env: "dev" } }),
    });
  });

  it("useUntagApiGatewayV2Resource DELETEs tag keys", async () => {
    mockApi.mockResolvedValueOnce({ untagged: true });
    const { result } = renderHook(() => useUntagApiGatewayV2Resource("api-1"), { wrapper: createWrapper() });
    await result.current.mutateAsync(["env"]);
    expect(mockApi).toHaveBeenCalledWith("/aws/apigatewayv2/apis/api-1/tags", {
      method: "DELETE",
      body: JSON.stringify({ tagKeys: ["env"] }),
    });
  });
});
