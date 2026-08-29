// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import {
  useAPIGatewayApis,
  useAPIGatewayApi,
  useCreateAPIGatewayApi,
  useDeleteAPIGatewayApi,
  useAPIGatewayResources,
  useAPIGatewayDeployments,
  useCreateAPIGatewayResource,
  useDeleteAPIGatewayResource,
  usePutAPIGatewayMethod,
  usePutAPIGatewayIntegration,
  useCreateAPIGatewayDeployment,
  useDeleteAPIGatewayDeployment,
  useAPIGatewayStages,
  useCreateAPIGatewayStage,
  useDeleteAPIGatewayStage,
  useAPIGatewayAuthorizers,
  useCreateAPIGatewayAuthorizer,
  useDeleteAPIGatewayAuthorizer,
  useAPIGatewayApiKeys,
  useCreateAPIGatewayApiKey,
  useDeleteAPIGatewayApiKey,
  useImportAPIGatewayApiKeys,
  useAPIGatewayUsagePlans,
  useCreateAPIGatewayUsagePlan,
  useDeleteAPIGatewayUsagePlan,
  useAPIGatewayRequestValidators,
  useCreateAPIGatewayRequestValidator,
  useDeleteAPIGatewayRequestValidator,
  useAPIGatewayModels,
  useCreateAPIGatewayModel,
  useDeleteAPIGatewayModel,
  useAPIGatewayDomainNames,
  useCreateAPIGatewayDomainName,
  useDeleteAPIGatewayDomainName,
  useAPIGatewayAccount,
} from "./useAPIGateway";
import { api } from "../lib/client";

vi.mock("../lib/client", () => ({
  api: vi.fn(),
}));

const mockedApi = vi.mocked(api);

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: qc }, children);
  };
}

beforeEach(() => {
  mockedApi.mockReset();
});

// ─── REST APIs ─────────────────────────────────────────

describe("useAPIGatewayApis", () => {
  it("fetches REST APIs", async () => {
    mockedApi.mockResolvedValue({ apis: [{ id: "1", name: "api1" }], total: 1 });
    const { result } = renderHook(() => useAPIGatewayApis(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.apis).toHaveLength(1);
    expect(mockedApi).toHaveBeenCalledWith("/aws/apigateway/rest-apis");
  });
});

describe("useAPIGatewayApi", () => {
  it("fetches a single REST API", async () => {
    mockedApi.mockResolvedValue({ api: { id: "abc", name: "my-api" } });
    const { result } = renderHook(() => useAPIGatewayApi("abc"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.api.name).toBe("my-api");
    expect(mockedApi).toHaveBeenCalledWith("/aws/apigateway/rest-apis/abc");
  });

  it("is disabled when apiId is null", () => {
    const { result } = renderHook(() => useAPIGatewayApi(null), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useCreateAPIGatewayApi", () => {
  it("creates a REST API and invalidates list query", async () => {
    mockedApi.mockResolvedValue({ api: { id: "new", name: "new-api" } });
    const { result } = renderHook(() => useCreateAPIGatewayApi(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({ name: "new-api" });
    expect(mockedApi).toHaveBeenCalledWith("/aws/apigateway/rest-apis", {
      method: "POST",
      body: JSON.stringify({ name: "new-api" }),
    });
  });
});

describe("useDeleteAPIGatewayApi", () => {
  it("deletes a REST API and invalidates list query", async () => {
    mockedApi.mockResolvedValue({ deleted: true });
    const { result } = renderHook(() => useDeleteAPIGatewayApi(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync("abc123");
    expect(mockedApi).toHaveBeenCalledWith("/aws/apigateway/rest-apis/abc123", {
      method: "DELETE",
    });
  });
});

// ─── Resources ─────────────────────────────────────────

describe("useAPIGatewayResources", () => {
  it("fetches resources for an API", async () => {
    mockedApi.mockResolvedValue({
      resources: [{ id: "res1", path: "/pets" }],
      total: 1,
    });
    const { result } = renderHook(() => useAPIGatewayResources("abc"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.resources).toHaveLength(1);
    expect(mockedApi).toHaveBeenCalledWith("/aws/apigateway/rest-apis/abc/resources");
  });

  it("is disabled when apiId is null", () => {
    const { result } = renderHook(() => useAPIGatewayResources(null), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe("idle");
  });
});

// ─── Deployments ───────────────────────────────────────

describe("useAPIGatewayDeployments", () => {
  it("fetches deployments for an API", async () => {
    mockedApi.mockResolvedValue({
      deployments: [{ id: "dep1", stageName: "prod" }],
      total: 1,
    });
    const { result } = renderHook(() => useAPIGatewayDeployments("abc"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.deployments).toHaveLength(1);
    expect(mockedApi).toHaveBeenCalledWith("/aws/apigateway/rest-apis/abc/deployments");
  });

  it("is disabled when apiId is null", () => {
    const { result } = renderHook(() => useAPIGatewayDeployments(null), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe("idle");
  });
});

// ─── P1 gap audit hooks ─────────────────────────────────
describe("useApiGateway — P1 gap hooks", () => {
  it("resource create/delete", async () => {
    mockedApi.mockResolvedValueOnce({ id: "res-1" });
    const { result } = renderHook(() => useCreateAPIGatewayResource("api1"), { wrapper: createWrapper() });
    await result.current.mutateAsync({ parentId: "root", pathPart: "users" });
    expect(mockedApi).toHaveBeenCalledWith("/aws/apigateway/rest-apis/api1/resources", {
      method: "POST",
      body: JSON.stringify({ parentId: "root", pathPart: "users" }),
    });
    mockedApi.mockResolvedValueOnce({ deleted: true });
    const { result: delR } = renderHook(() => useDeleteAPIGatewayResource("api1"), { wrapper: createWrapper() });
    await delR.current.mutateAsync("res-1");
    expect(mockedApi).toHaveBeenCalledWith("/aws/apigateway/rest-apis/api1/resources/res-1", { method: "DELETE" });
  });

  it("method + integration PUTs", async () => {
    mockedApi.mockResolvedValueOnce({});
    const { result: method } = renderHook(() => usePutAPIGatewayMethod("api1", "res-1"), { wrapper: createWrapper() });
    await method.current.mutateAsync({ httpMethod: "GET", authorizationType: "NONE" });
    expect(mockedApi).toHaveBeenCalledWith("/aws/apigateway/rest-apis/api1/resources/res-1/methods/GET", {
      method: "PUT",
      body: JSON.stringify({ httpMethod: "GET", authorizationType: "NONE" }),
    });
    mockedApi.mockResolvedValueOnce({});
    const { result: integ } = renderHook(() => usePutAPIGatewayIntegration("api1", "res-1"), { wrapper: createWrapper() });
    await integ.current.mutateAsync({ httpMethod: "GET", type: "MOCK" });
    expect(mockedApi).toHaveBeenCalledWith("/aws/apigateway/rest-apis/api1/resources/res-1/methods/GET/integration", {
      method: "PUT",
      body: JSON.stringify({ httpMethod: "GET", type: "MOCK" }),
    });
  });

  it("deployments create/delete", async () => {
    mockedApi.mockResolvedValueOnce({ id: "dep-1" });
    const { result: createR } = renderHook(() => useCreateAPIGatewayDeployment("api1"), { wrapper: createWrapper() });
    await createR.current.mutateAsync({ stageName: "dev" });
    expect(mockedApi).toHaveBeenCalledWith("/aws/apigateway/rest-apis/api1/deployments", {
      method: "POST",
      body: JSON.stringify({ stageName: "dev" }),
    });
    mockedApi.mockResolvedValueOnce({ deleted: true });
    const { result: delR } = renderHook(() => useDeleteAPIGatewayDeployment("api1"), { wrapper: createWrapper() });
    await delR.current.mutateAsync("dep-1");
  });

  it("stages query/create/delete + disabled arm", async () => {
    mockedApi.mockResolvedValueOnce({ stages: [], total: 0 });
    const stages = renderHook(() => useAPIGatewayStages("api1"), { wrapper: createWrapper() });
    await waitFor(() => expect(stages.result.current.isSuccess).toBe(true));
    mockedApi.mockResolvedValueOnce({ stage: {} });
    const { result: createR } = renderHook(() => useCreateAPIGatewayStage("api1"), { wrapper: createWrapper() });
    await createR.current.mutateAsync({ stageName: "dev" });
    mockedApi.mockResolvedValueOnce({ deleted: true });
    const { result: delR } = renderHook(() => useDeleteAPIGatewayStage("api1"), { wrapper: createWrapper() });
    await delR.current.mutateAsync("dev");
    const idle = renderHook(() => useAPIGatewayStages(null), { wrapper: createWrapper() });
    expect(idle.result.current.fetchStatus).toBe("idle");
  });

  it("authorizers query/create/delete", async () => {
    mockedApi.mockResolvedValueOnce({ authorizers: [], total: 0 });
    const list = renderHook(() => useAPIGatewayAuthorizers("api1"), { wrapper: createWrapper() });
    await waitFor(() => expect(list.result.current.isSuccess).toBe(true));
    mockedApi.mockResolvedValueOnce({ authorizer: {} });
    const { result: createR } = renderHook(() => useCreateAPIGatewayAuthorizer("api1"), { wrapper: createWrapper() });
    await createR.current.mutateAsync({ name: "a1", type: "NONE" });
    mockedApi.mockResolvedValueOnce({ deleted: true });
    const { result: delR } = renderHook(() => useDeleteAPIGatewayAuthorizer("api1"), { wrapper: createWrapper() });
    await delR.current.mutateAsync("auth-1");
  });

  it("api keys query/create/delete/import", async () => {
    mockedApi.mockResolvedValueOnce({ apiKeys: [], total: 0 });
    const list = renderHook(() => useAPIGatewayApiKeys(), { wrapper: createWrapper() });
    await waitFor(() => expect(list.result.current.isSuccess).toBe(true));
    mockedApi.mockResolvedValueOnce({ apiKey: {} });
    const { result: createR } = renderHook(() => useCreateAPIGatewayApiKey(), { wrapper: createWrapper() });
    await createR.current.mutateAsync({ name: "k1" });
    mockedApi.mockResolvedValueOnce({ deleted: true });
    const { result: delR } = renderHook(() => useDeleteAPIGatewayApiKey(), { wrapper: createWrapper() });
    await delR.current.mutateAsync("k1");
    mockedApi.mockResolvedValueOnce({ ids: ["k2"] });
    const { result: impR } = renderHook(() => useImportAPIGatewayApiKeys(), { wrapper: createWrapper() });
    await impR.current.mutateAsync({ csv: "n,k" });
    expect(mockedApi).toHaveBeenCalledWith("/aws/apigateway/api-keys/import", {
      method: "POST",
      body: JSON.stringify({ csv: "n,k" }),
    });
  });

  it("usage plans query/create/delete", async () => {
    mockedApi.mockResolvedValueOnce({ usagePlans: [], total: 0 });
    const list = renderHook(() => useAPIGatewayUsagePlans(), { wrapper: createWrapper() });
    await waitFor(() => expect(list.result.current.isSuccess).toBe(true));
    mockedApi.mockResolvedValueOnce({ usagePlan: {} });
    const { result: createR } = renderHook(() => useCreateAPIGatewayUsagePlan(), { wrapper: createWrapper() });
    await createR.current.mutateAsync({ name: "p1" });
    mockedApi.mockResolvedValueOnce({ deleted: true });
    const { result: delR } = renderHook(() => useDeleteAPIGatewayUsagePlan(), { wrapper: createWrapper() });
    await delR.current.mutateAsync("up-1");
  });

  it("request validators query/create/delete + disabled arm", async () => {
    mockedApi.mockResolvedValueOnce({ requestValidators: [], total: 0 });
    const list = renderHook(() => useAPIGatewayRequestValidators("api1"), { wrapper: createWrapper() });
    await waitFor(() => expect(list.result.current.isSuccess).toBe(true));
    mockedApi.mockResolvedValueOnce({ requestValidator: {} });
    const { result: createR } = renderHook(() => useCreateAPIGatewayRequestValidator("api1"), { wrapper: createWrapper() });
    await createR.current.mutateAsync({ name: "v1" });
    mockedApi.mockResolvedValueOnce({ deleted: true });
    const { result: delR } = renderHook(() => useDeleteAPIGatewayRequestValidator("api1"), { wrapper: createWrapper() });
    await delR.current.mutateAsync("v1");
    const idle = renderHook(() => useAPIGatewayRequestValidators(null), { wrapper: createWrapper() });
    expect(idle.result.current.fetchStatus).toBe("idle");
  });

  it("models query/create/delete + disabled arm", async () => {
    mockedApi.mockResolvedValueOnce({ models: [], total: 0 });
    const list = renderHook(() => useAPIGatewayModels("api1"), { wrapper: createWrapper() });
    await waitFor(() => expect(list.result.current.isSuccess).toBe(true));
    mockedApi.mockResolvedValueOnce({ model: {} });
    const { result: createR } = renderHook(() => useCreateAPIGatewayModel("api1"), { wrapper: createWrapper() });
    await createR.current.mutateAsync({ name: "m1", contentType: "application/json", schema: "{}" });
    mockedApi.mockResolvedValueOnce({ deleted: true });
    const { result: delR } = renderHook(() => useDeleteAPIGatewayModel("api1"), { wrapper: createWrapper() });
    await delR.current.mutateAsync("m1");
    const idle = renderHook(() => useAPIGatewayModels(null), { wrapper: createWrapper() });
    expect(idle.result.current.fetchStatus).toBe("idle");
  });

  it("domain names query/create/delete", async () => {
    mockedApi.mockResolvedValueOnce({ domainNames: [], total: 0 });
    const list = renderHook(() => useAPIGatewayDomainNames(), { wrapper: createWrapper() });
    await waitFor(() => expect(list.result.current.isSuccess).toBe(true));
    mockedApi.mockResolvedValueOnce({ domainName: {} });
    const { result: createR } = renderHook(() => useCreateAPIGatewayDomainName(), { wrapper: createWrapper() });
    await createR.current.mutateAsync({ domainName: "api.example.com" });
    mockedApi.mockResolvedValueOnce({ deleted: true });
    const { result: delR } = renderHook(() => useDeleteAPIGatewayDomainName(), { wrapper: createWrapper() });
    await delR.current.mutateAsync("api.example.com");
  });

  it("account query", async () => {
    mockedApi.mockResolvedValueOnce({ account: {} });
    const account = renderHook(() => useAPIGatewayAccount(), { wrapper: createWrapper() });
    await waitFor(() => expect(account.result.current.isSuccess).toBe(true));
    expect(mockedApi).toHaveBeenCalledWith("/aws/apigateway/account");
  });
});
