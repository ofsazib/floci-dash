// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createWrapper } from "../../test/helpers";

const mockApi = vi.fn();
vi.mock("../lib/client", () => ({
  api: (...args: any[]) => mockApi(...args),
}));

import { useServiceQuotas, useRequestServiceQuotaIncrease } from "./useServiceQuotas";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Service Quotas hooks", () => {
  it("useServiceQuotas fetches applied quotas for a service code", async () => {
    mockApi.mockResolvedValueOnce({ quotas: [], total: 0, nextToken: null, defaults: false });
    const { result } = renderHook(() => useServiceQuotas("lambda"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/servicequotas/quotas?serviceCode=lambda&defaults=false");
  });

  it("useServiceQuotas fetches defaults when defaults=true", async () => {
    mockApi.mockResolvedValueOnce({ quotas: [], total: 0, nextToken: null, defaults: true });
    const { result } = renderHook(() => useServiceQuotas("ec 2", true), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/servicequotas/quotas?serviceCode=ec%202&defaults=true");
  });

  it("useServiceQuotas is idle when serviceCode is null", async () => {
    const { result } = renderHook(() => useServiceQuotas(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("useRequestServiceQuotaIncrease posts and invalidates", async () => {
    mockApi.mockResolvedValueOnce({ requestedQuota: { status: "PENDING" } });
    const body = { serviceCode: "lambda", quotaCode: "L-B99A9384", desiredValue: 10000 };
    const { result } = renderHook(() => useRequestServiceQuotaIncrease(), { wrapper: createWrapper() });
    result.current.mutate(body);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/servicequotas/quotas/request-increase", {
      method: "POST",
      body: JSON.stringify(body),
    });
  });
});
