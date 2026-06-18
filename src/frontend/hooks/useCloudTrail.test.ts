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
});
