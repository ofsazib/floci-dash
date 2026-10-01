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
  useBedrockGuardrails,
  useCreateBedrockGuardrail,
  useDeleteBedrockGuardrail,
} from "./useBedrockGuardrails";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useBedrockGuardrails", () => {
  it("fetches guardrails", async () => {
    mockApi.mockResolvedValueOnce({ guardrails: [], total: 0 });
    const { result } = renderHook(() => useBedrockGuardrails(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/bedrock/guardrails");
  });
});

describe("useCreateBedrockGuardrail", () => {
  it("POSTs the guardrail body", async () => {
    mockApi.mockResolvedValueOnce({ guardrail: {} });
    const { result } = renderHook(() => useCreateBedrockGuardrail(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({
      name: "safe",
      blockedInputMessaging: "in",
      blockedOutputsMessaging: "out",
    });
    expect(mockApi).toHaveBeenCalledWith("/aws/bedrock/guardrails", {
      method: "POST",
      body: JSON.stringify({
        name: "safe",
        blockedInputMessaging: "in",
        blockedOutputsMessaging: "out",
      }),
    });
  });
});

describe("useDeleteBedrockGuardrail", () => {
  it("DELETEs with encoded id", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useDeleteBedrockGuardrail(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({ id: "gr 1" });
    expect(mockApi).toHaveBeenCalledWith("/aws/bedrock/guardrails/gr%201", {
      method: "DELETE",
    });
  });

  it("appends a version query when given", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useDeleteBedrockGuardrail(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({ id: "gr-1", version: "2" });
    expect(mockApi).toHaveBeenCalledWith("/aws/bedrock/guardrails/gr-1?version=2", {
      method: "DELETE",
    });
  });
});
