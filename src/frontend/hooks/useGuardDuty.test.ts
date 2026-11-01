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
  useGuardDutyMembers,
  useCreateGuardDutyMembers,
  useGuardDutyOrgConfig,
  useUpdateGuardDutyOrgConfig,
  useEnableGuardDutyAdminAccount,
  useDisableGuardDutyAdminAccount,
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

// ─── Members / organization ──────────────────────────────

describe("useGuardDutyMembers", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ members: [], total: 0 });
    const { result } = renderHook(() => useGuardDutyMembers("d1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/guardduty/detectors/d1/members");
  });

  it("disabled when detectorId is null", () => {
    const { result } = renderHook(() => useGuardDutyMembers(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useCreateGuardDutyMembers", () => {
  it("posts accounts", async () => {
    mockApi.mockResolvedValueOnce({ created: true });
    const { result } = renderHook(() => useCreateGuardDutyMembers(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ detectorId: "d1", accounts: [{ accountId: "111", email: "a@b.c" }] });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/guardduty/detectors/d1/members", {
      method: "POST",
      body: JSON.stringify({ accounts: [{ accountId: "111", email: "a@b.c" }] }),
    });
  });
});

describe("useGuardDutyOrgConfig", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ autoEnable: false, memberAccountLimitReached: false });
    const { result } = renderHook(() => useGuardDutyOrgConfig("d1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/guardduty/detectors/d1/organization-config");
  });

  it("disabled when detectorId is null", () => {
    const { result } = renderHook(() => useGuardDutyOrgConfig(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useUpdateGuardDutyOrgConfig", () => {
  it("sends PUT with autoEnable", async () => {
    mockApi.mockResolvedValueOnce({ updated: true });
    const { result } = renderHook(() => useUpdateGuardDutyOrgConfig(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ detectorId: "d1", autoEnable: true });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/guardduty/detectors/d1/organization-config", {
      method: "PUT",
      body: JSON.stringify({ autoEnable: true }),
    });
  });
});

describe("useEnableGuardDutyAdminAccount", () => {
  it("posts admin account id", async () => {
    mockApi.mockResolvedValueOnce({ enabled: true });
    const { result } = renderHook(() => useEnableGuardDutyAdminAccount(), { wrapper: createWrapper() });
    await result.current.mutateAsync("111");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/guardduty/admin/enable", {
      method: "POST",
      body: JSON.stringify({ adminAccountId: "111" }),
    });
  });
});

describe("useDisableGuardDutyAdminAccount", () => {
  it("posts admin account id", async () => {
    mockApi.mockResolvedValueOnce({ disabled: true });
    const { result } = renderHook(() => useDisableGuardDutyAdminAccount(), { wrapper: createWrapper() });
    await result.current.mutateAsync("111");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/guardduty/admin/disable", {
      method: "POST",
      body: JSON.stringify({ adminAccountId: "111" }),
    });
  });
});
