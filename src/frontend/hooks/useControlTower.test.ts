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
  useLandingZones,
  useCreateLandingZone,
  useUpdateLandingZone,
  useResetLandingZone,
  useDeleteLandingZone,
  useLandingZoneOperations,
  useLandingZoneOperation,
  useBaselines,
  useEnabledBaselines,
  useEnabledBaselineDetail,
  useEnableBaseline,
  useUpdateEnabledBaseline,
  useResetEnabledBaseline,
  useBaselineOperation,
} from "./useControlTower";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

describe("useLandingZones", () => {
  it("fetches landing zones", async () => {
    mockApi.mockResolvedValueOnce({ landingZones: [], total: 0 });
    const { result } = renderHook(() => useLandingZones(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/controltower/landing-zones");
  });
});

describe("useCreateLandingZone", () => {
  it("posts create body", async () => {
    mockApi.mockResolvedValueOnce({ arn: "arn:lz" });
    const { result } = renderHook(() => useCreateLandingZone(), { wrapper: createWrapper() });
    const body = { manifest: "{}", version: "4.0" };
    result.current.mutate(body);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/controltower/landing-zones", {
      method: "POST",
      body: JSON.stringify(body),
    });
  });
});

describe("useUpdateLandingZone", () => {
  it("puts update body", async () => {
    mockApi.mockResolvedValueOnce({ operationIdentifier: "op" });
    const { result } = renderHook(() => useUpdateLandingZone(), { wrapper: createWrapper() });
    const body = { landingZoneIdentifier: "arn:lz", version: "4.0", manifest: "{}" };
    result.current.mutate(body);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/controltower/landing-zones/update", {
      method: "PUT",
      body: JSON.stringify(body),
    });
  });
});

describe("useResetLandingZone", () => {
  it("posts reset", async () => {
    mockApi.mockResolvedValueOnce({ operationIdentifier: "op" });
    const { result } = renderHook(() => useResetLandingZone(), { wrapper: createWrapper() });
    result.current.mutate("arn:lz");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/controltower/landing-zones/reset", {
      method: "POST",
      body: JSON.stringify({ landingZoneIdentifier: "arn:lz" }),
    });
  });
});

describe("useDeleteLandingZone", () => {
  it("deletes by encoded identifier", async () => {
    mockApi.mockResolvedValueOnce({ operationIdentifier: "op" });
    const { result } = renderHook(() => useDeleteLandingZone(), { wrapper: createWrapper() });
    result.current.mutate("arn:lz/x");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/controltower/landing-zones?identifier=arn%3Alz%2Fx",
      { method: "DELETE" },
    );
  });
});

describe("useLandingZoneOperations", () => {
  it("fetches operations", async () => {
    mockApi.mockResolvedValueOnce({ operations: [], total: 0 });
    const { result } = renderHook(() => useLandingZoneOperations(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/controltower/operations");
  });
});

describe("useLandingZoneOperation", () => {
  it("fetches operation detail", async () => {
    mockApi.mockResolvedValueOnce({ operation: { operationIdentifier: "op" } });
    const { result } = renderHook(() => useLandingZoneOperation("op-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/controltower/operations/detail?identifier=op-1");
  });

  it("is disabled without an identifier", () => {
    const { result } = renderHook(() => useLandingZoneOperation(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
    expect(mockApi).not.toHaveBeenCalled();
  });
});

describe("useBaselines", () => {
  it("fetches baselines", async () => {
    mockApi.mockResolvedValueOnce({ baselines: [], total: 0 });
    const { result } = renderHook(() => useBaselines(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/controltower/baselines");
  });
});

describe("useEnabledBaselines", () => {
  it("fetches enabled baselines", async () => {
    mockApi.mockResolvedValueOnce({ enabledBaselines: [], total: 0 });
    const { result } = renderHook(() => useEnabledBaselines(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/controltower/enabled-baselines");
  });
});

describe("useEnabledBaselineDetail", () => {
  it("fetches detail", async () => {
    mockApi.mockResolvedValueOnce({ enabledBaseline: { arn: "arn" } });
    const { result } = renderHook(() => useEnabledBaselineDetail("arn:eb"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/controltower/enabled-baselines/detail?identifier=arn%3Aeb");
  });

  it("is disabled without an identifier", () => {
    const { result } = renderHook(() => useEnabledBaselineDetail(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
    expect(mockApi).not.toHaveBeenCalled();
  });
});

describe("useEnableBaseline", () => {
  it("posts enable body", async () => {
    mockApi.mockResolvedValueOnce({ operationIdentifier: "op", arn: "arn" });
    const { result } = renderHook(() => useEnableBaseline(), { wrapper: createWrapper() });
    const body = { baselineIdentifier: "arn:b", baselineVersion: "1.0", targetIdentifier: "arn:ou" };
    result.current.mutate(body);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/controltower/enabled-baselines/enable", {
      method: "POST",
      body: JSON.stringify(body),
    });
  });
});

describe("useUpdateEnabledBaseline", () => {
  it("posts update body", async () => {
    mockApi.mockResolvedValueOnce({ operationIdentifier: "op" });
    const { result } = renderHook(() => useUpdateEnabledBaseline(), { wrapper: createWrapper() });
    const body = { enabledBaselineIdentifier: "arn:eb", baselineVersion: "2.0" };
    result.current.mutate(body);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/controltower/enabled-baselines/update", {
      method: "POST",
      body: JSON.stringify(body),
    });
  });
});

describe("useResetEnabledBaseline", () => {
  it("posts reset", async () => {
    mockApi.mockResolvedValueOnce({ operationIdentifier: "op" });
    const { result } = renderHook(() => useResetEnabledBaseline(), { wrapper: createWrapper() });
    result.current.mutate("arn:eb");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/controltower/enabled-baselines/reset", {
      method: "POST",
      body: JSON.stringify({ enabledBaselineIdentifier: "arn:eb" }),
    });
  });
});

describe("useBaselineOperation", () => {
  it("fetches baseline operation", async () => {
    mockApi.mockResolvedValueOnce({ baselineOperation: { operationIdentifier: "op" } });
    const { result } = renderHook(() => useBaselineOperation("op-9"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/controltower/baseline-operations/detail?identifier=op-9");
  });

  it("is disabled without an identifier", () => {
    const { result } = renderHook(() => useBaselineOperation(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
    expect(mockApi).not.toHaveBeenCalled();
  });
});
