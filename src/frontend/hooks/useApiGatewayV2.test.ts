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
});
