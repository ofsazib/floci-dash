// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const mockApi = vi.fn();
vi.mock("../lib/client", () => ({
  api: (...args: any[]) => mockApi(...args),
}));

import {
  useLogGroups,
  useCreateLogGroup,
  useDeleteLogGroup,
  usePutRetentionPolicy,
  useDeleteRetentionPolicy,
  useLogStreams,
  useCreateLogStream,
  useDeleteLogStream,
  useLogEvents,
  usePutLogEvents,
  useFilterLogEvents,
  useSubscriptionFilters,
  usePutSubscriptionFilter,
  useDeleteSubscriptionFilter,
  useLogGroupTags,
  useTagLogGroup,
  useUntagLogGroup,
} from "./useLogs";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

// ─── Log Group Hooks ──────────────────────────────────

describe("useLogGroups", () => {
  it("calls api without query string when prefix not provided", async () => {
    mockApi.mockResolvedValueOnce({ logGroups: [], total: 0 });
    const { result } = renderHook(() => useLogGroups(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/logs/log-groups");
  });

  it("appends encoded prefix when provided", async () => {
    mockApi.mockResolvedValueOnce({ logGroups: [], total: 0 });
    const { result } = renderHook(() => useLogGroups("/aws/lambda"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/logs/log-groups?prefix=${encodeURIComponent("/aws/lambda")}`
    );
  });
});

describe("useCreateLogGroup", () => {
  it("calls api with POST method and serialized body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateLogGroup(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ logGroupName: "/aws/lambda/test" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/logs/log-groups",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ logGroupName: "/aws/lambda/test" }),
      })
    );
  });
});

describe("useDeleteLogGroup", () => {
  it("calls api with DELETE method and encoded name in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteLogGroup(), { wrapper: createWrapper() });
    await result.current.mutateAsync("/aws/lambda/test");
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/logs/log-groups/${encodeURIComponent("/aws/lambda/test")}`,
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

describe("usePutRetentionPolicy", () => {
  it("calls api with PUT method, encoded name in path, retentionInDays in body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => usePutRetentionPolicy(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ logGroupName: "/aws/lambda/test", retentionInDays: 7 });
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/logs/log-groups/${encodeURIComponent("/aws/lambda/test")}/retention`,
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ retentionInDays: 7 }),
      })
    );
  });
});

describe("useDeleteRetentionPolicy", () => {
  it("calls api with DELETE method and encoded name in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteRetentionPolicy(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync("/aws/lambda/test");
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/logs/log-groups/${encodeURIComponent("/aws/lambda/test")}/retention`,
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

// ─── Log Stream Hooks ─────────────────────────────────

describe("useLogStreams", () => {
  it("does NOT call api when logGroupName is null", () => {
    renderHook(() => useLogStreams(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with encoded name in path when logGroupName provided (no prefix)", async () => {
    mockApi.mockResolvedValueOnce({ logStreams: [], total: 0 });
    const { result } = renderHook(() => useLogStreams("/aws/lambda/test"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/logs/log-groups/${encodeURIComponent("/aws/lambda/test")}/streams`
    );
  });

  it("appends encoded prefix when provided", async () => {
    mockApi.mockResolvedValueOnce({ logStreams: [], total: 0 });
    const { result } = renderHook(() => useLogStreams("/aws/lambda/test", "2024"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/logs/log-groups/${encodeURIComponent("/aws/lambda/test")}/streams?prefix=2024`
    );
  });
});

describe("useCreateLogStream", () => {
  it("calls api with POST method, encoded group in path, logStreamName in body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateLogStream(), { wrapper: createWrapper() });
    await result.current.mutateAsync({
      logGroupName: "/aws/lambda/test",
      logStreamName: "stream-1",
    });
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/logs/log-groups/${encodeURIComponent("/aws/lambda/test")}/streams`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ logStreamName: "stream-1" }),
      })
    );
  });
});

describe("useDeleteLogStream", () => {
  it("calls api with DELETE method, encoded group + stream in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteLogStream(), { wrapper: createWrapper() });
    await result.current.mutateAsync({
      logGroupName: "/aws/lambda/test",
      logStreamName: "stream 1",
    });
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/logs/log-groups/${encodeURIComponent("/aws/lambda/test")}/streams/${encodeURIComponent("stream 1")}`,
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

// ─── Log Event Hooks ──────────────────────────────────

describe("useLogEvents", () => {
  it("does NOT call api when logGroupName is null", () => {
    renderHook(() => useLogEvents(null, "stream-1"), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("does NOT call api when logStreamName is null", () => {
    renderHook(() => useLogEvents("/aws/lambda/test", null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with minimal URL when no options provided", async () => {
    mockApi.mockResolvedValueOnce({ events: [] });
    const { result } = renderHook(() => useLogEvents("/aws/lambda/test", "stream-1"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/logs/log-groups/${encodeURIComponent("/aws/lambda/test")}/streams/stream-1/events`
    );
  });

  it("builds query string from options", async () => {
    mockApi.mockResolvedValueOnce({ events: [] });
    const { result } = renderHook(
      () =>
        useLogEvents("/aws/lambda/test", "stream-1", {
          startTime: 1000,
          endTime: 2000,
          limit: 50,
          startFromHead: true,
          nextToken: "tok",
        }),
      { wrapper: createWrapper() }
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const url = mockApi.mock.calls[0][0] as string;
    expect(url).toContain(`/aws/logs/log-groups/${encodeURIComponent("/aws/lambda/test")}/streams/stream-1/events?`);
    expect(url).toContain("startTime=1000");
    expect(url).toContain("endTime=2000");
    expect(url).toContain("limit=50");
    expect(url).toContain("startFromHead=true");
    expect(url).toContain("nextToken=tok");
  });
});

describe("usePutLogEvents", () => {
  it("calls api with POST method, encoded group+stream in path, logEvents + sequenceToken in body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => usePutLogEvents(), { wrapper: createWrapper() });
    await result.current.mutateAsync({
      logGroupName: "/aws/lambda/test",
      logStreamName: "stream 1",
      logEvents: [{ timestamp: 1, message: "hi" }],
      sequenceToken: "tok",
    });
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/logs/log-groups/${encodeURIComponent("/aws/lambda/test")}/streams/${encodeURIComponent("stream 1")}/events`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          logEvents: [{ timestamp: 1, message: "hi" }],
          sequenceToken: "tok",
        }),
      })
    );
  });
});

describe("useFilterLogEvents", () => {
  it("calls api with POST method, encoded group in path, filter body", async () => {
    mockApi.mockResolvedValueOnce({ events: [] });
    const { result } = renderHook(() => useFilterLogEvents("/aws/lambda/test"), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({ filterPattern: "ERROR", limit: 10 });
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/logs/log-groups/${encodeURIComponent("/aws/lambda/test")}/filter-events`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ filterPattern: "ERROR", limit: 10 }),
      })
    );
  });
});

// ─── Subscription Filter Hooks ────────────────────────

describe("useSubscriptionFilters", () => {
  it("does NOT call api when logGroupName is null", () => {
    renderHook(() => useSubscriptionFilters(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with encoded name in path when logGroupName provided", async () => {
    mockApi.mockResolvedValueOnce({ subscriptionFilters: [], total: 0 });
    const { result } = renderHook(() => useSubscriptionFilters("/aws/lambda/test"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/logs/log-groups/${encodeURIComponent("/aws/lambda/test")}/subscription-filters`
    );
  });
});

describe("usePutSubscriptionFilter", () => {
  it("calls api with POST method, encoded group in path, serialized body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => usePutSubscriptionFilter(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({
      logGroupName: "/aws/lambda/test",
      filterName: "f1",
      filterPattern: "ERROR",
      destinationArn: "arn:aws:lambda:us-east-1:1:function:fn",
    });
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/logs/log-groups/${encodeURIComponent("/aws/lambda/test")}/subscription-filters`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          logGroupName: "/aws/lambda/test",
          filterName: "f1",
          filterPattern: "ERROR",
          destinationArn: "arn:aws:lambda:us-east-1:1:function:fn",
        }),
      })
    );
  });
});

describe("useDeleteSubscriptionFilter", () => {
  it("calls api with DELETE method, encoded group + filter in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteSubscriptionFilter(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({
      logGroupName: "/aws/lambda/test",
      filterName: "f 1",
    });
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/logs/log-groups/${encodeURIComponent("/aws/lambda/test")}/subscription-filters/${encodeURIComponent("f 1")}`,
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

// ─── Tag Hooks ────────────────────────────────────────

describe("useLogGroupTags", () => {
  it("does NOT call api when logGroupName is null", () => {
    renderHook(() => useLogGroupTags(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with encoded name in path when logGroupName provided", async () => {
    mockApi.mockResolvedValueOnce({ tags: { env: "prod" } });
    const { result } = renderHook(() => useLogGroupTags("/aws/lambda/test"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/logs/log-groups/${encodeURIComponent("/aws/lambda/test")}/tags`
    );
  });
});

describe("useTagLogGroup", () => {
  it("calls api with POST method, encoded name in path, tags wrapped in body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useTagLogGroup(), { wrapper: createWrapper() });
    await result.current.mutateAsync({
      logGroupName: "/aws/lambda/test",
      tags: { env: "prod" },
    });
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/logs/log-groups/${encodeURIComponent("/aws/lambda/test")}/tags`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ tags: { env: "prod" } }),
      })
    );
  });
});

describe("useUntagLogGroup", () => {
  it("calls api with DELETE method, encoded name in path, tags array in body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useUntagLogGroup(), { wrapper: createWrapper() });
    await result.current.mutateAsync({
      logGroupName: "/aws/lambda/test",
      tags: ["env", "team"],
    });
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/logs/log-groups/${encodeURIComponent("/aws/lambda/test")}/tags`,
      expect.objectContaining({
        method: "DELETE",
        body: JSON.stringify({ tags: ["env", "team"] }),
      })
    );
  });
});
