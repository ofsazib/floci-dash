// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createWrapper } from "../../test/helpers";

const mockApi = vi.hoisted(() => vi.fn());
vi.mock("../lib/client", () => ({ api: (...args: any[]) => mockApi(...args) }));
vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual: any = await importOriginal();
  return { ...actual, useQueryClient: () => ({ invalidateQueries: vi.fn() }) };
});

import {
  useCostAndUsage,
  useDimensionValues,
  useCETags,
  useReservationCoverage,
  useReservationUtilization,
  useSavingsPlansCoverage,
  useSavingsPlansUtilization,
  useCostCategories,
} from "./useCE";

beforeEach(() => mockApi.mockReset());

const BODY = { timePeriod: { start: "2025-01", end: "2025-12" }, granularity: "MONTHLY", metrics: ["UnblendedCost"] };

describe("useCostAndUsage", () => {
  it("calls api with POST and correct URL", async () => {
    mockApi.mockResolvedValueOnce({ resultsByTime: [] });
    const { result } = renderHook(() => useCostAndUsage(), { wrapper: createWrapper() });
    await result.current.mutateAsync(BODY);
    expect(mockApi).toHaveBeenCalledWith("/aws/ce/cost-and-usage", {
      method: "POST",
      body: JSON.stringify(BODY),
    });
  });
});

describe("useDimensionValues", () => {
  it("calls api with POST and correct URL", async () => {
    mockApi.mockResolvedValueOnce({ dimensionValues: [] });
    const { result } = renderHook(() => useDimensionValues(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ timePeriod: BODY.timePeriod, dimension: "SERVICE" });
    expect(mockApi).toHaveBeenCalledWith("/aws/ce/dimension-values", {
      method: "POST",
      body: JSON.stringify({ timePeriod: BODY.timePeriod, dimension: "SERVICE" }),
    });
  });
});

describe("useCETags", () => {
  it("calls api with POST and correct URL", async () => {
    mockApi.mockResolvedValueOnce({ tags: [] });
    const { result } = renderHook(() => useCETags(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ timePeriod: BODY.timePeriod });
    expect(mockApi).toHaveBeenCalledWith("/aws/ce/tags", {
      method: "POST",
      body: JSON.stringify({ timePeriod: BODY.timePeriod }),
    });
  });
});

describe("useReservationCoverage", () => {
  it("calls api with POST and correct URL", async () => {
    mockApi.mockResolvedValueOnce({ coveragesByTime: [] });
    const { result } = renderHook(() => useReservationCoverage(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ timePeriod: BODY.timePeriod });
    expect(mockApi).toHaveBeenCalledWith("/aws/ce/reservation-coverage", {
      method: "POST",
      body: JSON.stringify({ timePeriod: BODY.timePeriod }),
    });
  });
});

describe("useReservationUtilization", () => {
  it("calls api with POST and correct URL", async () => {
    mockApi.mockResolvedValueOnce({ utilisationsByTime: [] });
    const { result } = renderHook(() => useReservationUtilization(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ timePeriod: BODY.timePeriod });
    expect(mockApi).toHaveBeenCalledWith("/aws/ce/reservation-utilization", {
      method: "POST",
      body: JSON.stringify({ timePeriod: BODY.timePeriod }),
    });
  });
});

describe("useSavingsPlansCoverage", () => {
  it("calls api with POST and correct URL", async () => {
    mockApi.mockResolvedValueOnce({ coveragesByTime: [] });
    const { result } = renderHook(() => useSavingsPlansCoverage(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ timePeriod: BODY.timePeriod });
    expect(mockApi).toHaveBeenCalledWith("/aws/ce/savings-plans-coverage", {
      method: "POST",
      body: JSON.stringify({ timePeriod: BODY.timePeriod }),
    });
  });
});

describe("useSavingsPlansUtilization", () => {
  it("calls api with POST and correct URL", async () => {
    mockApi.mockResolvedValueOnce({ utilisationsByTime: [] });
    const { result } = renderHook(() => useSavingsPlansUtilization(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ timePeriod: BODY.timePeriod });
    expect(mockApi).toHaveBeenCalledWith("/aws/ce/savings-plans-utilization", {
      method: "POST",
      body: JSON.stringify({ timePeriod: BODY.timePeriod }),
    });
  });
});

describe("useCostCategories", () => {
  it("calls api with POST and correct URL", async () => {
    mockApi.mockResolvedValueOnce({ costCategories: [] });
    const { result } = renderHook(() => useCostCategories(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ timePeriod: BODY.timePeriod });
    expect(mockApi).toHaveBeenCalledWith("/aws/ce/cost-categories", {
      method: "POST",
      body: JSON.stringify({ timePeriod: BODY.timePeriod }),
    });
  });
});
