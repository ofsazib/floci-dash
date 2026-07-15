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
  useCloudTrailTrails,
  useCreateCloudTrailTrail,
  useUpdateCloudTrailTrail,
  useDeleteCloudTrailTrail,
  useStartCloudTrailLogging,
  useStopCloudTrailLogging,
  useLookupEvents,
  useEventSelectors,
  usePutEventSelectors,
} from "./useCloudTrail";

beforeEach(() => mockApi.mockReset());

describe("useCloudTrail hooks", () => {
  it("useCloudTrailTrails calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ trails: [], total: 0 });
    const { result } = renderHook(() => useCloudTrailTrails(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudtrail/trails");
  });

  it("useCreateCloudTrailTrail calls POST", async () => {
    mockApi.mockResolvedValueOnce({ trail: {} });
    const { result } = renderHook(() => useCreateCloudTrailTrail(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "trail-1" });
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudtrail/trails", {
      method: "POST",
      body: JSON.stringify({ name: "trail-1" }),
    });
  });

  it("useUpdateCloudTrailTrail calls PUT", async () => {
    mockApi.mockResolvedValueOnce({ trail: {} });
    const { result } = renderHook(() => useUpdateCloudTrailTrail(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "trail-1", s3BucketName: "bucket" });
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudtrail/trails/trail-1", {
      method: "PUT",
      body: JSON.stringify({ name: "trail-1", s3BucketName: "bucket" }),
    });
  });

  it("useDeleteCloudTrailTrail calls DELETE", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteCloudTrailTrail(), { wrapper: createWrapper() });
    await result.current.mutateAsync("trail-1");
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudtrail/trails/trail-1", { method: "DELETE" });
  });

  it("useStartCloudTrailLogging calls POST", async () => {
    mockApi.mockResolvedValueOnce({ started: true });
    const { result } = renderHook(() => useStartCloudTrailLogging(), { wrapper: createWrapper() });
    await result.current.mutateAsync("trail-1");
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudtrail/trails/trail-1/start", { method: "POST" });
  });

  it("useStopCloudTrailLogging calls POST", async () => {
    mockApi.mockResolvedValueOnce({ stopped: true });
    const { result } = renderHook(() => useStopCloudTrailLogging(), { wrapper: createWrapper() });
    await result.current.mutateAsync("trail-1");
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudtrail/trails/trail-1/stop", { method: "POST" });
  });

  // ── Lookup Events ────────────────────────────────────

  it("useLookupEvents calls POST", async () => {
    mockApi.mockResolvedValueOnce({ events: [], nextToken: null, total: 0 });
    const { result } = renderHook(() => useLookupEvents(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ maxResults: 10 });
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudtrail/trails/lookup-events", {
      method: "POST",
      body: JSON.stringify({ maxResults: 10 }),
    });
  });

  it("useLookupEvents passes lookup attributes", async () => {
    mockApi.mockResolvedValueOnce({ events: [], nextToken: null, total: 0 });
    const { result } = renderHook(() => useLookupEvents(), { wrapper: createWrapper() });
    await result.current.mutateAsync({
      startTime: "2024-01-01",
      lookupAttributes: [{ AttributeKey: "EventName", AttributeValue: "CreateBucket" }],
    });
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudtrail/trails/lookup-events", {
      method: "POST",
      body: JSON.stringify({
        startTime: "2024-01-01",
        lookupAttributes: [{ AttributeKey: "EventName", AttributeValue: "CreateBucket" }],
      }),
    });
  });

  // ── Event Selectors ──────────────────────────────────

  it("useEventSelectors does not call api when trailName is null", async () => {
    const { result } = renderHook(() => useEventSelectors(null), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("useEventSelectors calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ trailName: "trail-1", eventSelectors: [], advancedEventSelectors: [] });
    const { result } = renderHook(() => useEventSelectors("trail-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudtrail/trails/trail-1/event-selectors");
  });

  it("usePutEventSelectors calls PUT", async () => {
    mockApi.mockResolvedValueOnce({ trailName: "trail-1", eventSelectors: [], updated: true });
    const { result } = renderHook(() => usePutEventSelectors("trail-1"), { wrapper: createWrapper() });
    await result.current.mutateAsync({
      eventSelectors: [{ ReadWriteType: "ReadOnly", IncludeManagementEvents: false }],
    });
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudtrail/trails/trail-1/event-selectors", {
      method: "PUT",
      body: JSON.stringify({
        eventSelectors: [{ ReadWriteType: "ReadOnly", IncludeManagementEvents: false }],
      }),
    });
  });
});
