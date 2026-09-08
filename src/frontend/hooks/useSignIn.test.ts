// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const mockApi = vi.fn();
vi.mock("../lib/client", () => ({
  api: (...args: any[]) => mockApi(...args),
}));

import { useAuthorize, useConsent, useSignInToken } from "./useSignIn";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

describe("useAuthorize", () => {
  it("calls the authorize endpoint with encoded params", async () => {
    mockApi.mockResolvedValueOnce({ location: "/_floci/signin/consent?request_id=abc" });
    const { result } = renderHook(() => useAuthorize(), { wrapper: createWrapper() });
    result.current.mutate({ client_id: "cli", scope: "aws", redirect_uri: "http://x/cb" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      `/api/signin/authorize?${new URLSearchParams({ client_id: "cli", scope: "aws", redirect_uri: "http://x/cb" })}`,
    );
    expect(result.current.data?.location).toContain("request_id=abc");
  });
});

describe("useConsent", () => {
  it("posts continue with requestId and action", async () => {
    mockApi.mockResolvedValueOnce({ location: "/v1/token?code=xyz" });
    const { result } = renderHook(() => useConsent(), { wrapper: createWrapper() });
    result.current.mutate({ requestId: "abc", action: "continue" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/api/signin/consent", {
      method: "POST",
      body: JSON.stringify({ requestId: "abc", action: "continue" }),
    });
  });

  it("posts cancel action", async () => {
    mockApi.mockResolvedValueOnce({ location: "/v1/authorize?error=access_denied" });
    const { result } = renderHook(() => useConsent(), { wrapper: createWrapper() });
    result.current.mutate({ requestId: "abc", action: "cancel" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(JSON.parse(mockApi.mock.calls[0][1].body).action).toBe("cancel");
  });
});

describe("useSignInToken", () => {
  it("posts the token exchange body", async () => {
    mockApi.mockResolvedValueOnce({ tokenType: "aws_sigv4", expiresIn: 3600 });
    const { result } = renderHook(() => useSignInToken(), { wrapper: createWrapper() });
    result.current.mutate({ grant_type: "authorization_code", code: "xyz" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/api/signin/token", {
      method: "POST",
      body: JSON.stringify({ grant_type: "authorization_code", code: "xyz" }),
    });
    expect(result.current.data?.tokenType).toBe("aws_sigv4");
  });
});