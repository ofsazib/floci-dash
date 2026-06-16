// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const mockApi = vi.fn();
vi.mock("../lib/client", () => ({
  api: (...args: any[]) => mockApi(...args),
}));

import { useServiceList, useServiceMutation } from "./useService";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

// ─── useServiceList ─────────────────────────────────────

describe("useServiceList", () => {
  it("does NOT call api because enabled is false", () => {
    renderHook(() => useServiceList("s3", "buckets"), {
      wrapper: createWrapper(),
    });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("stays disabled regardless of service/key arguments", () => {
    const { result } = renderHook(
      () => useServiceList("dynamodb", "tables"),
      { wrapper: createWrapper() }
    );
    expect(result.current.fetchStatus).toBe("idle");
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("exposes correct query key shape and can be manually fetched", async () => {
    mockApi.mockResolvedValueOnce({ items: [] });
    const { result } = renderHook(
      () => useServiceList<{ items: any[] }>("lambda", "functions"),
      { wrapper: createWrapper() }
    );
    await result.current.refetch();
    expect(mockApi).toHaveBeenCalledWith("/aws/lambda/functions");
  });
});

// ─── useServiceMutation ─────────────────────────────────

describe("useServiceMutation", () => {
  it("calls api with given method, path, and serialized body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useServiceMutation("s3"), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({
      method: "POST",
      path: "/buckets",
      body: { name: "b1" },
    });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/s3/buckets",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "b1" }),
      })
    );
  });

  it("omits body when not provided", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useServiceMutation("dynamodb"), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({
      method: "DELETE",
      path: "/tables/t1",
    });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/dynamodb/tables/t1",
      expect.objectContaining({
        method: "DELETE",
        body: undefined,
      })
    );
  });

  it("supports arbitrary HTTP methods and nested paths", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useServiceMutation("lambda"), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({
      method: "PUT",
      path: "/functions/fn-1/configuration",
      body: { memorySize: 512 },
    });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/lambda/functions/fn-1/configuration",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ memorySize: 512 }),
      })
    );
  });
});
