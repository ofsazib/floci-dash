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
  useIdentityPools,
  useCreateIdentityPool,
  useIdentityPool,
  useUpdateIdentityPool,
  useDeleteIdentityPool,
  useIdentityPoolRoles,
  useSetIdentityPoolRoles,
  useIdentityPoolTags,
  useAddIdentityPoolTags,
  useRemoveIdentityPoolTags,
  usePrincipalTagAttributeMap,
  useSetPrincipalTagAttributeMap,
} from "./useCognitoIdentity";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useIdentityPools", () => {
  it("fetches the pools list", async () => {
    mockApi.mockResolvedValueOnce({ pools: [{ IdentityPoolId: "p1" }], total: 1 });
    const { result } = renderHook(() => useIdentityPools(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/cognitoidentity/pools");
  });
});

describe("useCreateIdentityPool", () => {
  it("POSTs the pool body", async () => {
    mockApi.mockResolvedValueOnce({ pool: { IdentityPoolId: "p1" } });
    const { result } = renderHook(() => useCreateIdentityPool(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "app", allowUnauthenticated: true, allowClassic: true });
    expect(mockApi).toHaveBeenCalledWith("/aws/cognitoidentity/pools", {
      method: "POST",
      body: JSON.stringify({ name: "app", allowUnauthenticated: true, allowClassic: true }),
    });
  });
});

describe("useIdentityPool", () => {
  it("fetches the pool with encoded id", async () => {
    mockApi.mockResolvedValueOnce({ pool: { IdentityPoolId: "us-east-1:a b" } });
    const { result } = renderHook(() => useIdentityPool("us-east-1:a b"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/cognitoidentity/pools/us-east-1%3Aa%20b");
  });

  it("does not fetch when poolId is null", () => {
    renderHook(() => useIdentityPool(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });
});

describe("useUpdateIdentityPool", () => {
  it("PUTs the pool body", async () => {
    mockApi.mockResolvedValueOnce({ pool: {} });
    const { result } = renderHook(() => useUpdateIdentityPool(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ poolId: "p1", pool: { IdentityPoolName: "new" } });
    expect(mockApi).toHaveBeenCalledWith("/aws/cognitoidentity/pools/p1", {
      method: "PUT",
      body: JSON.stringify({ pool: { IdentityPoolName: "new" } }),
    });
  });
});

describe("useDeleteIdentityPool", () => {
  it("DELETEs with encoded id", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useDeleteIdentityPool(), { wrapper: createWrapper() });
    await result.current.mutateAsync("us-east-1:a b");
    expect(mockApi).toHaveBeenCalledWith("/aws/cognitoidentity/pools/us-east-1%3Aa%20b", {
      method: "DELETE",
    });
  });
});

describe("useIdentityPoolRoles", () => {
  it("fetches roles", async () => {
    mockApi.mockResolvedValueOnce({ roles: { authenticated: "r" }, roleMappings: {} });
    const { result } = renderHook(() => useIdentityPoolRoles("p1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/cognitoidentity/pools/p1/roles");
  });

  it("does not fetch when poolId is null", () => {
    renderHook(() => useIdentityPoolRoles(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });
});

describe("useSetIdentityPoolRoles", () => {
  it("PUTs the roles body", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useSetIdentityPoolRoles(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ poolId: "p1", roles: { authenticated: "r" } });
    expect(mockApi).toHaveBeenCalledWith("/aws/cognitoidentity/pools/p1/roles", {
      method: "PUT",
      body: JSON.stringify({ roles: { authenticated: "r" } }),
    });
  });
});

describe("useIdentityPoolTags", () => {
  it("fetches tags", async () => {
    mockApi.mockResolvedValueOnce({ tags: { env: "dev" } });
    const { result } = renderHook(() => useIdentityPoolTags("p1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/cognitoidentity/pools/p1/tags");
  });

  it("does not fetch when poolId is null", () => {
    renderHook(() => useIdentityPoolTags(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });
});

describe("useAddIdentityPoolTags", () => {
  it("POSTs the tags body", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useAddIdentityPoolTags(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ poolId: "p1", tags: { env: "dev" } });
    expect(mockApi).toHaveBeenCalledWith("/aws/cognitoidentity/pools/p1/tags", {
      method: "POST",
      body: JSON.stringify({ tags: { env: "dev" } }),
    });
  });
});

describe("useRemoveIdentityPoolTags", () => {
  it("POSTs the tagKeys body", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useRemoveIdentityPoolTags(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ poolId: "p1", tagKeys: ["env"] });
    expect(mockApi).toHaveBeenCalledWith("/aws/cognitoidentity/pools/p1/tags/untag", {
      method: "POST",
      body: JSON.stringify({ tagKeys: ["env"] }),
    });
  });
});

describe("usePrincipalTagAttributeMap", () => {
  it("fetches with encoded provider", async () => {
    mockApi.mockResolvedValueOnce({ useDefaults: true, principalTags: {} });
    const { result } = renderHook(() => usePrincipalTagAttributeMap("p1", "login.app"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/cognitoidentity/pools/p1/provider-tags?provider=login.app"
    );
  });

  it("does not fetch when provider is null", () => {
    renderHook(() => usePrincipalTagAttributeMap("p1", null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });
});

describe("useSetPrincipalTagAttributeMap", () => {
  it("PUTs the map body", async () => {
    mockApi.mockResolvedValueOnce({ useDefaults: false, principalTags: {} });
    const { result } = renderHook(() => useSetPrincipalTagAttributeMap(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({
      poolId: "p1",
      identityProviderName: "login.app",
      useDefaults: true,
      principalTags: { sub: "${sub}" },
    });
    expect(mockApi).toHaveBeenCalledWith("/aws/cognitoidentity/pools/p1/provider-tags", {
      method: "PUT",
      body: JSON.stringify({
        identityProviderName: "login.app",
        useDefaults: true,
        principalTags: { sub: "${sub}" },
      }),
    });
  });
});
