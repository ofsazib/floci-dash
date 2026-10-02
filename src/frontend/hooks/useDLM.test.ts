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
  useDlmPolicies,
  useCreateDlmPolicy,
  useDeleteDlmPolicy,
} from "./useDLM";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useDlmPolicies", () => {
  it("fetches policies", async () => {
    mockApi.mockResolvedValueOnce({ policies: [], total: 0 });
    const { result } = renderHook(() => useDlmPolicies(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/dlm/policies");
  });
});

describe("useCreateDlmPolicy", () => {
  it("POSTs the policy body", async () => {
    mockApi.mockResolvedValueOnce({ policyId: "p1" });
    const { result } = renderHook(() => useCreateDlmPolicy(), { wrapper: createWrapper() });
    await result.current.mutateAsync({
      executionRoleArn: "role",
      description: "d",
      state: "ENABLED",
      policyDetails: [{ ResourceTypes: ["VOLUME"] }],
    });
    expect(mockApi).toHaveBeenCalledWith("/aws/dlm/policies", {
      method: "POST",
      body: JSON.stringify({
        executionRoleArn: "role",
        description: "d",
        state: "ENABLED",
        policyDetails: [{ ResourceTypes: ["VOLUME"] }],
      }),
    });
  });
});

describe("useDeleteDlmPolicy", () => {
  it("DELETEs with encoded id", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useDeleteDlmPolicy(), { wrapper: createWrapper() });
    await result.current.mutateAsync("p 1");
    expect(mockApi).toHaveBeenCalledWith("/aws/dlm/policies/p%201", {
      method: "DELETE",
    });
  });
});
