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
  useVpStores,
  useCreateVpStore,
  useDeleteVpStore,
  useVpPolicies,
  useCreateVpPolicy,
  useDeleteVpPolicy,
  useVpIdentitySources,
  useCreateVpIdentitySource,
  useDeleteVpIdentitySource,
  useVpIsAuthorized,
} from "./useVerifiedPermissions";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useVpStores", () => {
  it("fetches stores", async () => {
    mockApi.mockResolvedValueOnce({ stores: [], total: 0 });
    const { result } = renderHook(() => useVpStores(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/verifiedpermissions/stores");
  });
});

describe("useCreateVpStore", () => {
  it("POSTs the store body", async () => {
    mockApi.mockResolvedValueOnce({ store: {} });
    const { result } = renderHook(() => useCreateVpStore(), { wrapper: createWrapper() });
    await result.current.mutateAsync({
      name: "app",
      validationSettings: { mode: "OFF" },
    });
    expect(mockApi).toHaveBeenCalledWith("/aws/verifiedpermissions/stores", {
      method: "POST",
      body: JSON.stringify({ name: "app", validationSettings: { mode: "OFF" } }),
    });
  });
});

describe("useDeleteVpStore", () => {
  it("DELETEs with encoded id", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useDeleteVpStore(), { wrapper: createWrapper() });
    await result.current.mutateAsync("Ps 1");
    expect(mockApi).toHaveBeenCalledWith("/aws/verifiedpermissions/stores/Ps%201", {
      method: "DELETE",
    });
  });
});

describe("useVpPolicies", () => {
  it("fetches policies", async () => {
    mockApi.mockResolvedValueOnce({ policies: [], total: 0 });
    const { result } = renderHook(() => useVpPolicies("Ps-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/verifiedpermissions/stores/Ps-1/policies");
  });

  it("does not fetch when store id is null", () => {
    renderHook(() => useVpPolicies(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });
});

describe("useCreateVpPolicy", () => {
  it("POSTs the policy definition", async () => {
    mockApi.mockResolvedValueOnce({ policy: {} });
    const { result } = renderHook(() => useCreateVpPolicy(), { wrapper: createWrapper() });
    await result.current.mutateAsync({
      storeId: "Ps-1",
      name: "permit",
      statement: "permit(principal, action, resource);",
    });
    expect(mockApi).toHaveBeenCalledWith("/aws/verifiedpermissions/stores/Ps-1/policies", {
      method: "POST",
      body: JSON.stringify({
        name: "permit",
        definition: { static: { statement: "permit(principal, action, resource);" } },
      }),
    });
  });
});

describe("useDeleteVpPolicy", () => {
  it("DELETEs with encoded ids", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useDeleteVpPolicy(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ storeId: "Ps-1", policyId: "p 1" });
    expect(mockApi).toHaveBeenCalledWith("/aws/verifiedpermissions/stores/Ps-1/policies/p%201", {
      method: "DELETE",
    });
  });
});

describe("useVpIdentitySources", () => {
  it("fetches identity sources", async () => {
    mockApi.mockResolvedValueOnce({ identitySources: [], total: 0 });
    const { result } = renderHook(() => useVpIdentitySources("Ps-1"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/verifiedpermissions/stores/Ps-1/identity-sources");
  });

  it("does not fetch when store id is null", () => {
    renderHook(() => useVpIdentitySources(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });
});

describe("useCreateVpIdentitySource", () => {
  it("POSTs the cognito configuration", async () => {
    mockApi.mockResolvedValueOnce({ identitySource: {} });
    const { result } = renderHook(() => useCreateVpIdentitySource(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({ storeId: "Ps-1", userPoolArn: "arn:pool" });
    expect(mockApi).toHaveBeenCalledWith("/aws/verifiedpermissions/stores/Ps-1/identity-sources", {
      method: "POST",
      body: JSON.stringify({
        configuration: { cognitoUserPool: { userPoolArn: "arn:pool" } },
      }),
    });
  });
});

describe("useDeleteVpIdentitySource", () => {
  it("DELETEs with encoded ids", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useDeleteVpIdentitySource(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({ storeId: "Ps-1", sourceId: "is 1" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/verifiedpermissions/stores/Ps-1/identity-sources/is%201",
      { method: "DELETE" }
    );
  });
});

describe("useVpIsAuthorized", () => {
  it("POSTs the authorization request", async () => {
    mockApi.mockResolvedValueOnce({ decision: "ALLOW", determiningPolicies: [], errors: [] });
    const { result } = renderHook(() => useVpIsAuthorized(), { wrapper: createWrapper() });
    const decision = await result.current.mutateAsync({
      storeId: "Ps-1",
      principal: "u1",
      action: "view",
      resource: "doc1",
    });
    expect(decision.decision).toBe("ALLOW");
    expect(mockApi).toHaveBeenCalledWith("/aws/verifiedpermissions/stores/Ps-1/is-authorized", {
      method: "POST",
      body: JSON.stringify({
        principal: { entityType: "User", entityId: "u1" },
        action: { actionType: "Action", actionId: "view" },
        resource: { entityType: "Document", entityId: "doc1" },
      }),
    });
  });
});
