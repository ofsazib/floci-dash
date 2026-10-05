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
  useMpAgreements,
  useMpAgreementDetail,
  useMpCancelAgreement,
  useMpEntitlements,
  useMpMeterUsage,
  useMpResolveCustomer,
  useMpEntities,
  useMpEntityDetail,
} from "./useMarketplace";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useMpAgreements", () => {
  it("fetches agreements", async () => {
    mockApi.mockResolvedValueOnce({ agreements: [] });
    const { result } = renderHook(() => useMpAgreements(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/marketplace/agreements");
  });

  it("encodes the agreement type", async () => {
    mockApi.mockResolvedValueOnce({ agreements: [] });
    const { result } = renderHook(() => useMpAgreements("Renewal Agreement"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/marketplace/agreements?agreementType=Renewal%20Agreement"
    );
  });
});

describe("useMpAgreementDetail", () => {
  it("POSTs the agreementId", async () => {
    mockApi.mockResolvedValueOnce({ agreement: {} });
    const { result } = renderHook(() => useMpAgreementDetail(), { wrapper: createWrapper() });
    await result.current.mutateAsync("agmt-1");
    expect(mockApi).toHaveBeenCalledWith("/aws/marketplace/agreements/describe", {
      method: "POST",
      body: JSON.stringify({ agreementId: "agmt-1" }),
    });
  });
});

describe("useMpCancelAgreement", () => {
  it("POSTs the cancellation", async () => {
    mockApi.mockResolvedValueOnce({ cancelled: true });
    const { result } = renderHook(() => useMpCancelAgreement(), { wrapper: createWrapper() });
    await result.current.mutateAsync("agmt-1");
    expect(mockApi).toHaveBeenCalledWith("/aws/marketplace/agreements/cancel", {
      method: "POST",
      body: JSON.stringify({ agreementId: "agmt-1" }),
    });
  });
});

describe("useMpEntitlements", () => {
  it("POSTs the product code", async () => {
    mockApi.mockResolvedValueOnce({ entitlements: [] });
    const { result } = renderHook(() => useMpEntitlements(), { wrapper: createWrapper() });
    await result.current.mutateAsync("prod-1");
    expect(mockApi).toHaveBeenCalledWith("/aws/marketplace/entitlements", {
      method: "POST",
      body: JSON.stringify({ productCode: "prod-1" }),
    });
  });
});

describe("useMpMeterUsage", () => {
  it("POSTs the usage record", async () => {
    mockApi.mockResolvedValueOnce({ meteringRecordId: "mr-1" });
    const { result } = renderHook(() => useMpMeterUsage(), { wrapper: createWrapper() });
    const input = { productCode: "prod-1", usageDimension: "hours", usageQuantity: 2 };
    await result.current.mutateAsync(input);
    expect(mockApi).toHaveBeenCalledWith("/aws/marketplace/metering/usage", {
      method: "POST",
      body: JSON.stringify(input),
    });
  });
});

describe("useMpResolveCustomer", () => {
  it("POSTs the registration token", async () => {
    mockApi.mockResolvedValueOnce({ productCode: "p" });
    const { result } = renderHook(() => useMpResolveCustomer(), { wrapper: createWrapper() });
    await result.current.mutateAsync("tok");
    expect(mockApi).toHaveBeenCalledWith("/aws/marketplace/metering/resolve-customer", {
      method: "POST",
      body: JSON.stringify({ registrationToken: "tok" }),
    });
  });
});

describe("useMpEntities", () => {
  it("fetches entities", async () => {
    mockApi.mockResolvedValueOnce({ entities: [] });
    const { result } = renderHook(() => useMpEntities(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/marketplace/catalog/entities");
  });

  it("encodes the entity type", async () => {
    mockApi.mockResolvedValueOnce({ entities: [] });
    const { result } = renderHook(() => useMpEntities("Amendment Type"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/marketplace/catalog/entities?entityType=Amendment%20Type"
    );
  });
});

describe("useMpEntityDetail", () => {
  it("GETs the entity with encoded id", async () => {
    mockApi.mockResolvedValueOnce({ entity: {} });
    const { result } = renderHook(() => useMpEntityDetail(), { wrapper: createWrapper() });
    await result.current.mutateAsync("e 1");
    expect(mockApi).toHaveBeenCalledWith("/aws/marketplace/catalog/entity?entityId=e%201", {
      method: "GET",
    });
  });
});
