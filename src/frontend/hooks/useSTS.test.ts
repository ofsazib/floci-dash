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
  useSTSCallerIdentity,
  useSTSAssumeRole,
  useSTSGetSessionToken,
} from "./useSTS";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

// ─── CALLER IDENTITY ─────────────────────────────────────

describe("useSTSCallerIdentity", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ account: "123", arn: "arn", userId: "u" });
    const { result } = renderHook(() => useSTSCallerIdentity(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/sts/caller-identity");
  });

  it("forwards error", async () => {
    mockApi.mockRejectedValueOnce(new Error("fail"));
    const { result } = renderHook(() => useSTSCallerIdentity(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// ─── ASSUME ROLE ─────────────────────────────────────────

describe("useSTSAssumeRole", () => {
  it("calls api with POST method and body", async () => {
    mockApi.mockResolvedValueOnce({ accessKeyId: "a", secretAccessKey: "s", sessionToken: "t", expiration: "e" });
    const { result } = renderHook(() => useSTSAssumeRole(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ roleArn: "arn:aws:iam::123:role/demo", sessionName: "s" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/sts/assume-role",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ roleArn: "arn:aws:iam::123:role/demo", sessionName: "s" }),
      })
    );
  });
});

// ─── GET SESSION TOKEN ───────────────────────────────────

describe("useSTSGetSessionToken", () => {
  it("calls api with POST method and body", async () => {
    mockApi.mockResolvedValueOnce({ accessKeyId: "a", secretAccessKey: "s", sessionToken: "t", expiration: "e" });
    const { result } = renderHook(() => useSTSGetSessionToken(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ durationSeconds: 3600 });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/sts/session-token",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ durationSeconds: 3600 }),
      })
    );
  });
});
