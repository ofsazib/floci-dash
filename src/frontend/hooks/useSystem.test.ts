// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const mockApi = vi.fn();
vi.mock("../lib/client", () => ({
  api: (...args: any[]) => mockApi(...args),
}));

import { useHealth, useInit, useActiveServices } from "./useSystem";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

// ─── Health ─────────────────────────────────────────────

describe("useHealth", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({
      services: {},
      edition: "community",
      original_edition: "community",
      version: "1.0.0",
      stats: { total: 0, running: 0, available: 0 },
    });
    const { result } = renderHook(() => useHealth(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/system/health");
  });
});

// ─── Init ───────────────────────────────────────────────

describe("useInit", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({
      completed: { boot: true, start: true, ready: true, shutdown: false },
      scripts: {},
    });
    const { result } = renderHook(() => useInit(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/system/init");
  });
});

// ─── Active services ────────────────────────────────────

describe("useActiveServices", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ activeCount: 0, activeServices: [] });
    const { result } = renderHook(() => useActiveServices(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/active");
  });
});
