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
  useCostAndUsageWithResources,
  useCEAnomalyMonitors,
  useCreateCEAnomalyMonitor,
  useUpdateCEAnomalyMonitor,
  useDeleteCEAnomalyMonitor,
  useCEAnomalySubscriptions,
  useCreateCEAnomalySubscription,
  useUpdateCEAnomalySubscription,
  useDeleteCEAnomalySubscription,
  useCEResourceTags,
  useCETagResource,
  useCEUntagResource,
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

describe("useCostAndUsageWithResources", () => {
  it("posts to the with-resources endpoint", async () => {
    mockApi.mockResolvedValueOnce({ resultsByTime: [], total: 0 });
    const { result } = renderHook(() => useCostAndUsageWithResources(), { wrapper: createWrapper() });
    result.current.mutate({ timePeriod: { start: "a", end: "b" }, granularity: "MONTHLY", metrics: ["UnblendedCost"] });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ce/cost-and-usage-with-resources", {
      method: "POST",
      body: JSON.stringify({ timePeriod: { start: "a", end: "b" }, granularity: "MONTHLY", metrics: ["UnblendedCost"] }),
    });
  });
});

// ─── Anomaly monitors ────────────────────────────────────

describe("useCEAnomalyMonitors", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ anomalyMonitors: [], total: 0 });
    const { result } = renderHook(() => useCEAnomalyMonitors(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ce/anomaly-monitors");
  });
});

describe("useCreateCEAnomalyMonitor", () => {
  it("posts monitor body", async () => {
    mockApi.mockResolvedValueOnce({ monitorArn: "arn" });
    const { result } = renderHook(() => useCreateCEAnomalyMonitor(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ monitorName: "m1", monitorType: "DIMENSIONAL", monitorDimension: "SERVICE" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ce/anomaly-monitors", {
      method: "POST",
      body: JSON.stringify({ monitorName: "m1", monitorType: "DIMENSIONAL", monitorDimension: "SERVICE" }),
    });
  });
});

describe("useUpdateCEAnomalyMonitor", () => {
  it("sends PUT with monitorState", async () => {
    mockApi.mockResolvedValueOnce({ updated: true });
    const { result } = renderHook(() => useUpdateCEAnomalyMonitor(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ arn: "arn:m", monitorState: "PAUSED" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ce/anomaly-monitors/arn%3Am", {
      method: "PUT",
      body: JSON.stringify({ monitorState: "PAUSED" }),
    });
  });
});

describe("useDeleteCEAnomalyMonitor", () => {
  it("sends DELETE", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteCEAnomalyMonitor(), { wrapper: createWrapper() });
    await result.current.mutateAsync("arn:m");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ce/anomaly-monitors/arn%3Am", { method: "DELETE" });
  });
});

// ─── Anomaly subscriptions ───────────────────────────────

describe("useCEAnomalySubscriptions", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ anomalySubscriptions: [], total: 0 });
    const { result } = renderHook(() => useCEAnomalySubscriptions(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ce/anomaly-subscriptions");
  });
});

describe("useCreateCEAnomalySubscription", () => {
  it("posts subscription body", async () => {
    mockApi.mockResolvedValueOnce({ subscriptionArn: "arn" });
    const { result } = renderHook(() => useCreateCEAnomalySubscription(), { wrapper: createWrapper() });
    const body = { subscriptionName: "s1", monitorArn: "m", subscribers: [{ Type: "EMAIL" }], threshold: 10, frequency: "DAILY" };
    await result.current.mutateAsync(body);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ce/anomaly-subscriptions", {
      method: "POST",
      body: JSON.stringify(body),
    });
  });
});

describe("useUpdateCEAnomalySubscription", () => {
  it("sends PUT with subscribers", async () => {
    mockApi.mockResolvedValueOnce({ updated: true });
    const { result } = renderHook(() => useUpdateCEAnomalySubscription(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ arn: "arn:s", subscribers: [{ Type: "EMAIL" }], threshold: 5 });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ce/anomaly-subscriptions/arn%3As", {
      method: "PUT",
      body: JSON.stringify({ subscribers: [{ Type: "EMAIL" }], threshold: 5, frequency: undefined }),
    });
  });
});

describe("useDeleteCEAnomalySubscription", () => {
  it("sends DELETE", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteCEAnomalySubscription(), { wrapper: createWrapper() });
    await result.current.mutateAsync("arn:s");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ce/anomaly-subscriptions/arn%3As", { method: "DELETE" });
  });
});

// ─── Resource tags ───────────────────────────────────────

describe("useCEResourceTags", () => {
  it("calls api with encoded arn", async () => {
    mockApi.mockResolvedValueOnce({ tags: {}, arn: "arn:m" });
    const { result } = renderHook(() => useCEResourceTags("arn:m"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ce/resource-tags?resourceArn=arn%3Am");
  });

  it("disabled when resourceArn is null", () => {
    const { result } = renderHook(() => useCEResourceTags(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useCETagResource", () => {
  it("posts tags", async () => {
    mockApi.mockResolvedValueOnce({ tagged: true });
    const { result } = renderHook(() => useCETagResource(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ resourceArn: "arn:m", tags: { env: "prod" } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ce/resource-tags", {
      method: "POST",
      body: JSON.stringify({ resourceArn: "arn:m", tags: { env: "prod" } }),
    });
  });
});

describe("useCEUntagResource", () => {
  it("posts tag keys", async () => {
    mockApi.mockResolvedValueOnce({ untagged: true });
    const { result } = renderHook(() => useCEUntagResource(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ resourceArn: "arn:m", tagKeys: ["env"] });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ce/resource-tags/untag", {
      method: "POST",
      body: JSON.stringify({ resourceArn: "arn:m", tagKeys: ["env"] }),
    });
  });
});
