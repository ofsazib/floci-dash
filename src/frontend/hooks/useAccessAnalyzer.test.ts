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
  useAaAnalyzers,
  useCreateAaAnalyzer,
  useDeleteAaAnalyzer,
} from "./useAccessAnalyzer";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useAaAnalyzers", () => {
  it("fetches analyzers", async () => {
    mockApi.mockResolvedValueOnce({ analyzers: [], total: 0 });
    const { result } = renderHook(() => useAaAnalyzers(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/accessanalyzer/analyzers");
  });
});

describe("useCreateAaAnalyzer", () => {
  it("POSTs the analyzer body", async () => {
    mockApi.mockResolvedValueOnce({ arn: "arn" });
    const { result } = renderHook(() => useCreateAaAnalyzer(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ analyzerName: "a1", type: "ACCOUNT" });
    expect(mockApi).toHaveBeenCalledWith("/aws/accessanalyzer/analyzers", {
      method: "POST",
      body: JSON.stringify({ analyzerName: "a1", type: "ACCOUNT" }),
    });
  });
});

describe("useDeleteAaAnalyzer", () => {
  it("DELETEs with encoded name", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useDeleteAaAnalyzer(), { wrapper: createWrapper() });
    await result.current.mutateAsync("a 1");
    expect(mockApi).toHaveBeenCalledWith("/aws/accessanalyzer/analyzers/a%201", {
      method: "DELETE",
    });
  });
});
