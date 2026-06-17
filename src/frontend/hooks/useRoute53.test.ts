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
  useRoute53HostedZones,
  useRoute53HostedZone,
  useCreateRoute53HostedZone,
  useDeleteRoute53HostedZone,
  useRoute53RecordSets,
  useCreateRoute53RecordSet,
  useDeleteRoute53RecordSet,
  useRoute53HealthChecks,
} from "./useRoute53";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

// ── Hosted Zones ─────────────────────────────────────────

describe("useRoute53HostedZones", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ hostedZones: [], total: 0 });
    const { result } = renderHook(() => useRoute53HostedZones(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/route53/hosted-zones");
  });
});

describe("useRoute53HostedZone", () => {
  it("does NOT call api when id is null", () => {
    renderHook(() => useRoute53HostedZone(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with id in path", async () => {
    mockApi.mockResolvedValueOnce({ hostedZone: {}, delegationSet: {} });
    const { result } = renderHook(() => useRoute53HostedZone("Z123"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/route53/hosted-zones/Z123");
  });
});

describe("useCreateRoute53HostedZone", () => {
  it("calls api with POST", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateRoute53HostedZone(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "test.com." });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/route53/hosted-zones",
      expect.objectContaining({ method: "POST" })
    );
  });
});

describe("useDeleteRoute53HostedZone", () => {
  it("calls api with DELETE and id in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteRoute53HostedZone(), { wrapper: createWrapper() });
    await result.current.mutateAsync("Z123");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/route53/hosted-zones/Z123",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

// ── Record Sets ──────────────────────────────────────────

describe("useRoute53RecordSets", () => {
  it("does NOT call api when zoneId is null", () => {
    renderHook(() => useRoute53RecordSets(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with zoneId in path", async () => {
    mockApi.mockResolvedValueOnce({ recordSets: [], total: 0 });
    const { result } = renderHook(() => useRoute53RecordSets("Z123"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/route53/hosted-zones/Z123/record-sets");
  });
});

describe("useCreateRoute53RecordSet", () => {
  it("calls api with POST and zoneId in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateRoute53RecordSet(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ zoneId: "Z1", action: "CREATE", name: "test.", type: "A" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/route53/hosted-zones/Z1/record-sets",
      expect.objectContaining({ method: "POST" })
    );
  });
});

describe("useDeleteRoute53RecordSet", () => {
  it("calls api with DELETE and encoded name/type params", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteRoute53RecordSet(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ zoneId: "Z1", name: "www.example.com.", type: "A" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/route53/hosted-zones/Z1/record-sets?name=www.example.com.&type=A",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

// ── Health Checks ────────────────────────────────────────

describe("useRoute53HealthChecks", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ healthChecks: [], total: 0 });
    const { result } = renderHook(() => useRoute53HealthChecks(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/route53/health-checks");
  });
});
