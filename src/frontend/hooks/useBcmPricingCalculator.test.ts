// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const mockApi = vi.fn();
vi.mock("../lib/client", () => ({
  api: (...args: any[]) => mockApi(...args),
}));

import {
  useBcmCreateEstimate,
  useBcmGetEstimate,
  useBcmDeleteEstimate,
  useBcmCreateUsage,
} from "./useBcmPricingCalculator";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useBcmCreateEstimate", () => {
  it("POSTs name and rateType", async () => {
    mockApi.mockResolvedValueOnce({ estimate: { id: "e1" } });
    const { result } = renderHook(() => useBcmCreateEstimate(), { wrapper: createWrapper() });
    const input = { name: "est", rateType: "BEFORE_DISCOUNTS" };
    await result.current.mutateAsync(input);
    expect(mockApi).toHaveBeenCalledWith("/aws/bcm-pricing-calculator/estimates", {
      method: "POST",
      body: JSON.stringify(input),
    });
  });
});

describe("useBcmGetEstimate", () => {
  it("POSTs the identifier", async () => {
    mockApi.mockResolvedValueOnce({ estimate: { id: "e1" } });
    const { result } = renderHook(() => useBcmGetEstimate(), { wrapper: createWrapper() });
    await result.current.mutateAsync("e1");
    expect(mockApi).toHaveBeenCalledWith("/aws/bcm-pricing-calculator/estimates/get", {
      method: "POST",
      body: JSON.stringify({ identifier: "e1" }),
    });
  });
});

describe("useBcmDeleteEstimate", () => {
  it("DELETEs with the identifier", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useBcmDeleteEstimate(), { wrapper: createWrapper() });
    await result.current.mutateAsync("e1");
    expect(mockApi).toHaveBeenCalledWith("/aws/bcm-pricing-calculator/estimates", {
      method: "DELETE",
      body: JSON.stringify({ identifier: "e1" }),
    });
  });
});

describe("useBcmCreateUsage", () => {
  it("POSTs the usage batch", async () => {
    mockApi.mockResolvedValueOnce({ items: [], errors: [] });
    const { result } = renderHook(() => useBcmCreateUsage(), { wrapper: createWrapper() });
    const input = {
      workloadEstimateId: "e1",
      usage: [{ serviceCode: "AmazonEC2", usageType: "t", operation: "o", amount: 2 }],
    };
    await result.current.mutateAsync(input);
    expect(mockApi).toHaveBeenCalledWith("/aws/bcm-pricing-calculator/estimates/usage", {
      method: "POST",
      body: JSON.stringify(input),
    });
  });
});
