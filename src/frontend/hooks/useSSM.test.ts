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
  useSSMParameters,
  useSSMParameter,
  usePutSSMParameter,
  useDeleteSSMParameter,
  useSSMParameterHistory,
  useSSMTags,
  useAddSSMTags,
  useRemoveSSMTags,
} from "./useSSM";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

// ── Parameters ───────────────────────────────────────────

describe("useSSMParameters", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ parameters: [], total: 0 });
    const { result } = renderHook(() => useSSMParameters(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ssm/parameters");
  });
});

describe("useSSMParameter", () => {
  it("does NOT call api when name is null", () => {
    renderHook(() => useSSMParameter(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with encoded name in path", async () => {
    mockApi.mockResolvedValueOnce({ parameter: {} });
    const { result } = renderHook(() => useSSMParameter("/app/config"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ssm/parameters/%2Fapp%2Fconfig");
  });
});

describe("usePutSSMParameter", () => {
  it("calls api with POST", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => usePutSSMParameter(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "/app/x", value: "y", type: "String" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ssm/parameters",
      expect.objectContaining({ method: "POST" })
    );
  });
});

describe("useDeleteSSMParameter", () => {
  it("calls api with DELETE and encoded name", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteSSMParameter(), { wrapper: createWrapper() });
    await result.current.mutateAsync("/app/config");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ssm/parameters/%2Fapp%2Fconfig",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

// ── Parameter History ────────────────────────────────────

describe("useSSMParameterHistory", () => {
  it("does NOT call api when name is null", () => {
    renderHook(() => useSSMParameterHistory(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with encoded name and /history path", async () => {
    mockApi.mockResolvedValueOnce({ history: [], total: 0 });
    const { result } = renderHook(() => useSSMParameterHistory("/app/config"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ssm/parameters/%2Fapp%2Fconfig/history");
  });
});

// ── Tags ────────────────────────────────────────────────

describe("useSSMTags", () => {
  it("does NOT call api when resourceId is null", () => {
    renderHook(() => useSSMTags(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with resourceId param", async () => {
    mockApi.mockResolvedValueOnce({ tags: [] });
    const { result } = renderHook(() => useSSMTags("/app/config"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ssm/tags?resourceId=%2Fapp%2Fconfig");
  });
});

describe("useAddSSMTags", () => {
  it("calls api with POST", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useAddSSMTags(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ resourceId: "/app/x", tags: [] });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ssm/tags",
      expect.objectContaining({ method: "POST" })
    );
  });
});

describe("useRemoveSSMTags", () => {
  it("calls api with DELETE and comma-separated tagKeys", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useRemoveSSMTags(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ resourceId: "/app/x", tagKeys: ["env", "team"] });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ssm/tags?resourceId=%2Fapp%2Fx&tagKeys=env,team",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});
