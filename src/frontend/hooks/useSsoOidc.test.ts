// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const mockApi = vi.fn();
vi.mock("../lib/client", () => ({
  api: (...args: any[]) => mockApi(...args),
}));

import {
  useSoRegisterClient,
  useSoStartDeviceAuthorization,
  useSoCreateToken,
} from "./useSsoOidc";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useSoRegisterClient", () => {
  it("POSTs clientName and scopes", async () => {
    mockApi.mockResolvedValueOnce({ clientId: "c1" });
    const { result } = renderHook(() => useSoRegisterClient(), { wrapper: createWrapper() });
    const input = { clientName: "cli", scopes: ["sso:account:access"] };
    await result.current.mutateAsync(input);
    expect(mockApi).toHaveBeenCalledWith("/aws/sso-oidc/clients", {
      method: "POST",
      body: JSON.stringify(input),
    });
  });
});

describe("useSoStartDeviceAuthorization", () => {
  it("POSTs clientId, secret, and startUrl", async () => {
    mockApi.mockResolvedValueOnce({ deviceCode: "d1" });
    const { result } = renderHook(() => useSoStartDeviceAuthorization(), {
      wrapper: createWrapper(),
    });
    const input = { clientId: "c1", clientSecret: "s1", startUrl: "https://start" };
    await result.current.mutateAsync(input);
    expect(mockApi).toHaveBeenCalledWith("/aws/sso-oidc/device-authorization", {
      method: "POST",
      body: JSON.stringify(input),
    });
  });
});

describe("useSoCreateToken", () => {
  it("POSTs the device code", async () => {
    mockApi.mockResolvedValueOnce({ accessToken: "a" });
    const { result } = renderHook(() => useSoCreateToken(), { wrapper: createWrapper() });
    const input = { clientId: "c1", clientSecret: "s1", deviceCode: "d1" };
    await result.current.mutateAsync(input);
    expect(mockApi).toHaveBeenCalledWith("/aws/sso-oidc/token", {
      method: "POST",
      body: JSON.stringify(input),
    });
  });
});
