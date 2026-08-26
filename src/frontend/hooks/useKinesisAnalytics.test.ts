// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createWrapper } from "../../test/helpers";

const mockApi = vi.fn();
vi.mock("../lib/client", () => ({
  api: (...args: any[]) => mockApi(...args),
}));

import {
  useKinesisAnalyticsApplications,
  useKinesisAnalyticsApplication,
  useCreateKinesisAnalyticsApplication,
  useUpdateKinesisAnalyticsApplication,
  useDeleteKinesisAnalyticsApplication,
  useStartKinesisAnalyticsApplication,
  useStopKinesisAnalyticsApplication,
  useKinesisAnalyticsSnapshots,
  useCreateKinesisAnalyticsSnapshot,
  useDeleteKinesisAnalyticsSnapshot,
  useKinesisAnalyticsTags,
  useAddKinesisAnalyticsTags,
  useRemoveKinesisAnalyticsTags,
} from "./useKinesisAnalytics";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Kinesis Analytics hooks — applications", () => {
  it("useKinesisAnalyticsApplications fetches", async () => {
    mockApi.mockResolvedValueOnce({ applications: [], total: 0 });
    const { result } = renderHook(() => useKinesisAnalyticsApplications(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/kinesisanalytics/applications");
  });

  it("useKinesisAnalyticsApplication fetches encoded + disabled gate", async () => {
    mockApi.mockResolvedValueOnce({ application: null });
    const { result } = renderHook(() => useKinesisAnalyticsApplication("app 1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/kinesisanalytics/applications/app%201");

    const idle = renderHook(() => useKinesisAnalyticsApplication(null), { wrapper: createWrapper() });
    expect(idle.result.current.fetchStatus).toBe("idle");
  });

  it("useCreateKinesisAnalyticsApplication posts body", async () => {
    mockApi.mockResolvedValueOnce({ application: {} });
    const { result } = renderHook(() => useCreateKinesisAnalyticsApplication(), { wrapper: createWrapper() });
    result.current.mutate({ name: "a", runtimeEnvironment: "FLINK-1_19", serviceExecutionRole: "r" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/kinesisanalytics/applications", {
      method: "POST",
      body: JSON.stringify({ name: "a", runtimeEnvironment: "FLINK-1_19", serviceExecutionRole: "r" }),
    });
  });

  it("useUpdateKinesisAnalyticsApplication puts parallelism", async () => {
    mockApi.mockResolvedValueOnce({ application: {} });
    const { result } = renderHook(() => useUpdateKinesisAnalyticsApplication(), { wrapper: createWrapper() });
    result.current.mutate({ name: "a", parallelism: 4 });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/kinesisanalytics/applications/a", {
      method: "PUT",
      body: JSON.stringify({ parallelism: 4 }),
    });
  });

  it("useDeleteKinesisAnalyticsApplication deletes with timestamp", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteKinesisAnalyticsApplication(), { wrapper: createWrapper() });
    result.current.mutate({ name: "a", createTimestamp: 1700000000 });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/kinesisanalytics/applications/a?createTimestamp=1700000000",
      { method: "DELETE" }
    );
  });

  it("useStartKinesisAnalyticsApplication posts start", async () => {
    mockApi.mockResolvedValueOnce({ started: true });
    const { result } = renderHook(() => useStartKinesisAnalyticsApplication(), { wrapper: createWrapper() });
    result.current.mutate("a");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/kinesisanalytics/applications/a/start", { method: "POST" });
  });

  it("useStopKinesisAnalyticsApplication posts stop", async () => {
    mockApi.mockResolvedValueOnce({ stopped: true });
    const { result } = renderHook(() => useStopKinesisAnalyticsApplication(), { wrapper: createWrapper() });
    result.current.mutate("a");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/kinesisanalytics/applications/a/stop", { method: "POST" });
  });
});

describe("Kinesis Analytics hooks — snapshots", () => {
  it("useKinesisAnalyticsSnapshots fetches gated", async () => {
    mockApi.mockResolvedValueOnce({ snapshots: [], total: 0 });
    const { result } = renderHook(() => useKinesisAnalyticsSnapshots("a"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/kinesisanalytics/applications/a/snapshots");

    const idle = renderHook(() => useKinesisAnalyticsSnapshots(null), { wrapper: createWrapper() });
    expect(idle.result.current.fetchStatus).toBe("idle");
  });

  it("useCreateKinesisAnalyticsSnapshot posts name", async () => {
    mockApi.mockResolvedValueOnce({ created: true });
    const { result } = renderHook(() => useCreateKinesisAnalyticsSnapshot(), { wrapper: createWrapper() });
    result.current.mutate({ applicationName: "a", snapshotName: "s1" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/kinesisanalytics/applications/a/snapshots", {
      method: "POST",
      body: JSON.stringify({ snapshotName: "s1" }),
    });
  });

  it("useDeleteKinesisAnalyticsSnapshot deletes with and without timestamp", async () => {
    mockApi.mockResolvedValue({ deleted: true });
    const { result } = renderHook(() => useDeleteKinesisAnalyticsSnapshot(), { wrapper: createWrapper() });
    result.current.mutate({ applicationName: "a", snapshotName: "s 1", snapshotCreationTimestamp: 1700000000 });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/kinesisanalytics/applications/a/snapshots/s%201?snapshotCreationTimestamp=1700000000",
      { method: "DELETE" }
    );

    result.current.reset();
    mockApi.mockClear();
    result.current.mutate({ applicationName: "a", snapshotName: "s1" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/kinesisanalytics/applications/a/snapshots/s1",
      { method: "DELETE" }
    );
  });
});

describe("Kinesis Analytics hooks — tags", () => {
  it("useKinesisAnalyticsTags fetches encoded arn + gate", async () => {
    mockApi.mockResolvedValueOnce({ tags: [] });
    const { result } = renderHook(() => useKinesisAnalyticsTags("arn:a/b"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/kinesisanalytics/applications/any/tags?arn=arn%3Aa%2Fb"
    );

    const idle = renderHook(() => useKinesisAnalyticsTags(null), { wrapper: createWrapper() });
    expect(idle.result.current.fetchStatus).toBe("idle");
  });

  it("useAddKinesisAnalyticsTags posts", async () => {
    mockApi.mockResolvedValueOnce({ tagged: true });
    const { result } = renderHook(() => useAddKinesisAnalyticsTags(), { wrapper: createWrapper() });
    result.current.mutate({ arn: "arn:x", tags: { env: "prod" } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/kinesisanalytics/applications/any/tags?arn=arn%3Ax",
      { method: "POST", body: JSON.stringify({ tags: { env: "prod" } }) }
    );
  });

  it("useRemoveKinesisAnalyticsTags deletes", async () => {
    mockApi.mockResolvedValueOnce({ untagged: true });
    const { result } = renderHook(() => useRemoveKinesisAnalyticsTags(), { wrapper: createWrapper() });
    result.current.mutate({ arn: "arn:x", tagKeys: ["env"] });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/kinesisanalytics/applications/any/tags?arn=arn%3Ax",
      { method: "DELETE", body: JSON.stringify({ tagKeys: ["env"] }) }
    );
  });
});
