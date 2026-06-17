// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const mockApi = vi.fn();
vi.mock("../lib/client", () => ({
  api: (...args: any[]) => mockApi(...args),
}));

import {
  useCloudWatchMetrics,
  usePutMetricData,
  useMetricStatistics,
  useCloudWatchAlarms,
  useCreateAlarm,
  useDeleteAlarm,
  useSetAlarmState,
  useCloudWatchTags,
} from "./useCloudWatch";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

// ─── METRICS ─────────────────────────────────────────────

describe("useCloudWatchMetrics", () => {
  it("calls api without query string when namespace not provided", async () => {
    mockApi.mockResolvedValueOnce({ metrics: [], namespaces: [], total: 0 });
    const { result } = renderHook(() => useCloudWatchMetrics(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudwatch/metrics");
  });

  it("appends namespace when provided", async () => {
    mockApi.mockResolvedValueOnce({ metrics: [], namespaces: [], total: 0 });
    const { result } = renderHook(() => useCloudWatchMetrics("AWS/EC2"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudwatch/metrics?namespace=AWS/EC2");
  });
});

describe("usePutMetricData", () => {
  it("calls api with POST method and serialized body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => usePutMetricData(), { wrapper: createWrapper() });
    const body = { namespace: "App", data: [{ metricName: "Hits", value: 1 }] };
    await result.current.mutateAsync(body);
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/cloudwatch/metrics/data",
      expect.objectContaining({ method: "POST", body: JSON.stringify(body) })
    );
  });
});

describe("useMetricStatistics", () => {
  it("does NOT call api when namespace is empty", () => {
    renderHook(
      () =>
        useMetricStatistics({ namespace: "", metricName: "CPU" }),
      { wrapper: createWrapper() }
    );
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("does NOT call api when metricName is empty", () => {
    renderHook(
      () =>
        useMetricStatistics({ namespace: "AWS/EC2", metricName: "" }),
      { wrapper: createWrapper() }
    );
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("builds query string with required + default values", async () => {
    mockApi.mockResolvedValueOnce({ label: "l", datapoints: [] });
    renderHook(
      () => useMetricStatistics({ namespace: "AWS/EC2", metricName: "CPUUtilization" }),
      { wrapper: createWrapper() }
    );
    await vi.waitFor(() => {
      expect(mockApi).toHaveBeenCalled();
    });
    const url = mockApi.mock.calls[0][0] as string;
    expect(url.startsWith("/aws/cloudwatch/metrics/statistics?")).toBe(true);
    expect(url).toContain("namespace=AWS%2FEC2");
    expect(url).toContain("metricName=CPUUtilization");
    expect(url).toContain("period=60");
    expect(url).toContain("statistics=Average");
    expect(url).toContain("startTime=");
    expect(url).toContain("endTime=");
  });

  it("forwards custom params and dimensions in query string", async () => {
    mockApi.mockResolvedValueOnce({ label: "l", datapoints: [] });
    renderHook(
      () =>
        useMetricStatistics({
          namespace: "App",
          metricName: "Latency",
          period: 300,
          statistics: "Sum",
          startTime: "2024-01-01T00:00:00.000Z",
          endTime: "2024-01-01T01:00:00.000Z",
          dimensions: [{ Name: "Host", Value: "h1" }],
        }),
      { wrapper: createWrapper() }
    );
    await vi.waitFor(() => {
      expect(mockApi).toHaveBeenCalled();
    });
    const url = mockApi.mock.calls[0][0] as string;
    expect(url).toContain("namespace=App");
    expect(url).toContain("metricName=Latency");
    expect(url).toContain("period=300");
    expect(url).toContain("statistics=Sum");
    expect(url).toContain("startTime=2024-01-01T00%3A00%3A00.000Z");
    expect(url).toContain("endTime=2024-01-01T01%3A00%3A00.000Z");
    expect(url).toContain(
      `dimensions=${encodeURIComponent(JSON.stringify([{ Name: "Host", Value: "h1" }]))}`
    );
  });
});

// ─── ALARMS ──────────────────────────────────────────────

describe("useCloudWatchAlarms", () => {
  it("calls api without query string when state not provided", async () => {
    mockApi.mockResolvedValueOnce({ alarms: [], total: 0 });
    const { result } = renderHook(() => useCloudWatchAlarms(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudwatch/alarms");
  });

  it("appends state when provided", async () => {
    mockApi.mockResolvedValueOnce({ alarms: [], total: 0 });
    const { result } = renderHook(() => useCloudWatchAlarms("OK"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudwatch/alarms?state=OK");
  });
});

describe("useCreateAlarm", () => {
  it("calls api with POST method and serialized body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateAlarm(), { wrapper: createWrapper() });
    const body = { alarmName: "a", metricName: "CPU", threshold: 1 };
    await result.current.mutateAsync(body);
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/cloudwatch/alarms",
      expect.objectContaining({ method: "POST", body: JSON.stringify(body) })
    );
  });
});

describe("useDeleteAlarm", () => {
  it("calls api with DELETE method and name in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteAlarm(), { wrapper: createWrapper() });
    await result.current.mutateAsync("my-alarm");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/cloudwatch/alarms/my-alarm",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

describe("useSetAlarmState", () => {
  it("calls api with PUT method, name in path, state + reason in body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useSetAlarmState(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "my-alarm", state: "ALARM", reason: "test" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/cloudwatch/alarms/my-alarm/state",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ state: "ALARM", reason: "test" }),
      })
    );
  });
});

// ─── TAGS ────────────────────────────────────────────────

describe("useCloudWatchTags", () => {
  it("does NOT call api when arn is null", () => {
    renderHook(() => useCloudWatchTags(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with arn in path when provided", async () => {
    mockApi.mockResolvedValueOnce({ tags: { env: "prod" } });
    const { result } = renderHook(() => useCloudWatchTags("arn:aws:cloudwatch:us-east-1:1:alarm:a"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/cloudwatch/tags/arn:aws:cloudwatch:us-east-1:1:alarm:a"
    );
  });
});
