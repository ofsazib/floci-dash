// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createWrapper } from "../../test/helpers";

const mockApi = vi.fn();
vi.mock("../lib/client", () => ({
  api: (...args: any[]) => mockApi(...args),
}));

import {
  useGuardDutyDetectors,
  useGuardDutyDetector,
  useCreateGuardDutyDetector,
  useUpdateGuardDutyDetector,
  useDeleteGuardDutyDetector,
} from "./useGuardDuty";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GuardDuty hooks", () => {
  it("useGuardDutyDetectors fetches", async () => {
    mockApi.mockResolvedValueOnce({ detectorIds: [], total: 0, nextToken: null });
    const { result } = renderHook(() => useGuardDutyDetectors(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/guardduty/detectors");
  });

  it("useGuardDutyDetector gated + encoded", async () => {
    mockApi.mockResolvedValueOnce({ detector: null });
    const { result } = renderHook(() => useGuardDutyDetector("d 1"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/guardduty/detectors/d%201");

    const idle = renderHook(() => useGuardDutyDetector(null), { wrapper: createWrapper() });
    expect(idle.result.current.fetchStatus).toBe("idle");
  });

  it("useCreateGuardDutyDetector posts", async () => {
    mockApi.mockResolvedValueOnce({ detectorId: "d" });
    const body = { enable: true, frequency: "SIX_HOURS" };
    const { result } = renderHook(() => useCreateGuardDutyDetector(), {
      wrapper: createWrapper(),
    });
    result.current.mutate(body);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/guardduty/detectors", {
      method: "POST",
      body: JSON.stringify(body),
    });
  });

  it("useUpdateGuardDutyDetector patches", async () => {
    mockApi.mockResolvedValueOnce({ updated: true });
    const { result } = renderHook(() => useUpdateGuardDutyDetector(), {
      wrapper: createWrapper(),
    });
    result.current.mutate({ id: "d 1", enable: false });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/guardduty/detectors/d%201", {
      method: "PATCH",
      body: JSON.stringify({ enable: false, frequency: undefined }),
    });
  });

  it("useDeleteGuardDutyDetector deletes", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteGuardDutyDetector(), {
      wrapper: createWrapper(),
    });
    result.current.mutate("d 1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/guardduty/detectors/d%201", {
      method: "DELETE",
    });
  });
});
