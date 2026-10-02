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
  useAiEventIntegrations,
  useCreateAiEventIntegration,
  useDeleteAiEventIntegration,
  useAiDataIntegrations,
  useCreateAiDataIntegration,
  useDeleteAiDataIntegration,
} from "./useAppIntegrations";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useAiEventIntegrations", () => {
  it("fetches event integrations", async () => {
    mockApi.mockResolvedValueOnce({ eventIntegrations: [], total: 0 });
    const { result } = renderHook(() => useAiEventIntegrations(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/appintegrations/event-integrations");
  });
});

describe("useCreateAiEventIntegration", () => {
  it("POSTs the event integration body", async () => {
    mockApi.mockResolvedValueOnce({ eventIntegration: {} });
    const { result } = renderHook(() => useCreateAiEventIntegration(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({
      name: "ev1",
      eventBridgeBus: "bus",
      eventFilter: { Source: "aws.connect" },
      description: "d",
    });
    expect(mockApi).toHaveBeenCalledWith("/aws/appintegrations/event-integrations", {
      method: "POST",
      body: JSON.stringify({
        name: "ev1",
        eventBridgeBus: "bus",
        eventFilter: { Source: "aws.connect" },
        description: "d",
      }),
    });
  });
});

describe("useDeleteAiEventIntegration", () => {
  it("DELETEs with encoded name", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useDeleteAiEventIntegration(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync("ev 1");
    expect(mockApi).toHaveBeenCalledWith("/aws/appintegrations/event-integrations/ev%201", {
      method: "DELETE",
    });
  });
});

describe("useAiDataIntegrations", () => {
  it("fetches data integrations", async () => {
    mockApi.mockResolvedValueOnce({ dataIntegrations: [], total: 0 });
    const { result } = renderHook(() => useAiDataIntegrations(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/appintegrations/data-integrations");
  });
});

describe("useCreateAiDataIntegration", () => {
  it("POSTs the data integration body", async () => {
    mockApi.mockResolvedValueOnce({ dataIntegration: {} });
    const { result } = renderHook(() => useCreateAiDataIntegration(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({ name: "di1", sourceUri: "s3://b", kmsKey: "k" });
    expect(mockApi).toHaveBeenCalledWith("/aws/appintegrations/data-integrations", {
      method: "POST",
      body: JSON.stringify({ name: "di1", sourceUri: "s3://b", kmsKey: "k" }),
    });
  });
});

describe("useDeleteAiDataIntegration", () => {
  it("DELETEs with encoded id", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useDeleteAiDataIntegration(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync("di 1");
    expect(mockApi).toHaveBeenCalledWith("/aws/appintegrations/data-integrations/di%201", {
      method: "DELETE",
    });
  });
});
