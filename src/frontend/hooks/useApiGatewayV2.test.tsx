// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const mockApi = vi.fn();
vi.mock("../lib/client", () => ({
  api: (...args: any[]) => mockApi(...args),
}));

import {
  useApiGatewayV2Apis,
  useCreateApiGatewayV2Api,
  useDeleteApiGatewayV2Api,
  useApiGatewayV2Routes,
  useApiGatewayV2Integrations,
  useApiGatewayV2Stages,
  useApiGatewayV2Deployments,
  useApiGatewayV2WebSocketApis,
  useApiGatewayV2WebSocketRoutes,
} from "./useApiGatewayV2";

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

describe("useApiGatewayV2Apis", () => {
  it("calls api with apis path", async () => {
    mockApi.mockResolvedValueOnce({ apis: [], total: 0 });
    const { result } = renderHook(() => useApiGatewayV2Apis(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/apigatewayv2/apis");
  });
});

describe("useCreateApiGatewayV2Api", () => {
  it("posts to apis with body", async () => {
    mockApi.mockResolvedValueOnce({ api: { ApiId: "new" } });
    const { result } = renderHook(() => useCreateApiGatewayV2Api(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "my-api", protocolType: "WEBSOCKET" });
    expect(mockApi).toHaveBeenCalledWith("/aws/apigatewayv2/apis", {
      method: "POST",
      body: JSON.stringify({ name: "my-api", protocolType: "WEBSOCKET" }),
    });
  });
});

describe("useDeleteApiGatewayV2Api", () => {
  it("deletes by apiId (encoded)", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteApiGatewayV2Api(), { wrapper: createWrapper() });
    await result.current.mutateAsync("api id");
    expect(mockApi).toHaveBeenCalledWith("/aws/apigatewayv2/apis/api%20id", { method: "DELETE" });
  });
});

describe("useApiGatewayV2Routes", () => {
  it("is disabled when apiId is null", () => {
    const { result } = renderHook(() => useApiGatewayV2Routes(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls routes path with encoded apiId", async () => {
    mockApi.mockResolvedValueOnce({ routes: [], total: 0 });
    const { result } = renderHook(() => useApiGatewayV2Routes("api-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/apigatewayv2/apis/api-1/routes");
  });
});

describe("useApiGatewayV2Integrations", () => {
  it("calls integrations path", async () => {
    mockApi.mockResolvedValueOnce({ integrations: [], total: 0 });
    const { result } = renderHook(() => useApiGatewayV2Integrations("api-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/apigatewayv2/apis/api-1/integrations");
  });
});

describe("useApiGatewayV2Stages", () => {
  it("calls stages path", async () => {
    mockApi.mockResolvedValueOnce({ stages: [], total: 0 });
    const { result } = renderHook(() => useApiGatewayV2Stages("api-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/apigatewayv2/apis/api-1/stages");
  });
});

describe("useApiGatewayV2Deployments", () => {
  it("calls deployments path", async () => {
    mockApi.mockResolvedValueOnce({ deployments: [], total: 0 });
    const { result } = renderHook(() => useApiGatewayV2Deployments("api-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/apigatewayv2/apis/api-1/deployments");
  });
});

describe("useApiGatewayV2WebSocketApis", () => {
  it("calls websocket-apis path", async () => {
    mockApi.mockResolvedValueOnce({ apis: [], total: 0 });
    const { result } = renderHook(() => useApiGatewayV2WebSocketApis(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/apigatewayv2/websocket-apis");
  });

  it("returns websocket api data", async () => {
    const data = { apis: [{ ApiId: "ws-1", Name: "ws", ProtocolType: "WEBSOCKET" }], total: 1 };
    mockApi.mockResolvedValueOnce(data);
    const { result } = renderHook(() => useApiGatewayV2WebSocketApis(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(data);
  });
});

describe("useApiGatewayV2WebSocketRoutes", () => {
  it("is disabled when apiId is null", () => {
    const { result } = renderHook(() => useApiGatewayV2WebSocketRoutes(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls websocket-routes path with encoded apiId", async () => {
    mockApi.mockResolvedValueOnce({ routes: [], total: 0 });
    const { result } = renderHook(() => useApiGatewayV2WebSocketRoutes("api 1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/apigatewayv2/apis/api%201/websocket-routes");
  });

  it("returns resolved route data", async () => {
    const data = {
      routes: [
        {
          RouteId: "r-1",
          RouteKey: "$connect",
          target: "integrations/int-1",
          integrationId: "int-1",
          integration: { IntegrationId: "int-1", IntegrationType: "AWS_PROXY" },
          isWellKnown: true,
          authorizationType: "NONE",
        },
      ],
      total: 1,
    };
    mockApi.mockResolvedValueOnce(data);
    const { result } = renderHook(() => useApiGatewayV2WebSocketRoutes("api-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(data);
  });
});
