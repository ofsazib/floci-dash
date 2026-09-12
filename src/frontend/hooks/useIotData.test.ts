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
  useIotShadow,
  useIotUpdateShadow,
  useIotDeleteShadow,
  useIotNamedShadows,
  useIotPublish,
} from "./useIotData";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

describe("useIotShadow", () => {
  it("fetches shadow with encoded thing name", async () => {
    mockApi.mockResolvedValueOnce({ thingName: "lamp", payload: {} });
    const { result } = renderHook(() => useIotShadow("lamp 1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/iotdata/things/lamp%201/shadow");
  });

  it("is disabled without a thing name", () => {
    const { result } = renderHook(() => useIotShadow(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
    expect(mockApi).not.toHaveBeenCalled();
  });
});

describe("useIotUpdateShadow", () => {
  it("posts payload", async () => {
    mockApi.mockResolvedValueOnce({ payload: {} });
    const { result } = renderHook(() => useIotUpdateShadow(), { wrapper: createWrapper() });
    result.current.mutate({ thingName: "lamp", payload: '{"state":{}}' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/iotdata/things/lamp/shadow", {
      method: "POST",
      body: JSON.stringify({ payload: '{"state":{}}' }),
    });
  });
});

describe("useIotDeleteShadow", () => {
  it("deletes shadow", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useIotDeleteShadow(), { wrapper: createWrapper() });
    result.current.mutate("lamp");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/iotdata/things/lamp/shadow", { method: "DELETE" });
  });
});

describe("useIotNamedShadows", () => {
  it("fetches named shadows", async () => {
    mockApi.mockResolvedValueOnce({ shadows: [], total: 0 });
    const { result } = renderHook(() => useIotNamedShadows("lamp"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/iotdata/things/lamp/shadows");
  });

  it("is disabled without a thing name", () => {
    const { result } = renderHook(() => useIotNamedShadows(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useIotPublish", () => {
  it("publishes", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useIotPublish(), { wrapper: createWrapper() });
    result.current.mutate({ topic: "a/b", payload: "x" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/iotdata/publish", {
      method: "POST",
      body: JSON.stringify({ topic: "a/b", payload: "x" }),
    });
  });
});
