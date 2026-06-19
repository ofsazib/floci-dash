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
  useAppConfigApplications,
  useCreateAppConfigApplication,
  useDeleteAppConfigApplication,
  useAppConfigEnvironments,
  useAppConfigProfiles,
} from "./useAppConfig";

beforeEach(() => mockApi.mockReset());

describe("useAppConfig hooks", () => {
  it("useAppConfigApplications calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ applications: [], total: 0 });
    const { result } = renderHook(() => useAppConfigApplications(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/appconfig/applications");
  });

  it("useCreateAppConfigApplication calls POST", async () => {
    mockApi.mockResolvedValueOnce({ application: {} });
    const { result } = renderHook(() => useCreateAppConfigApplication(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "myapp" });
    expect(mockApi).toHaveBeenCalledWith("/aws/appconfig/applications", {
      method: "POST",
      body: JSON.stringify({ name: "myapp" }),
    });
  });

  it("useDeleteAppConfigApplication calls DELETE", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteAppConfigApplication(), { wrapper: createWrapper() });
    await result.current.mutateAsync("app-1");
    expect(mockApi).toHaveBeenCalledWith("/aws/appconfig/applications/app-1", { method: "DELETE" });
  });

  it("useAppConfigEnvironments calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ environments: [], total: 0 });
    const { result } = renderHook(() => useAppConfigEnvironments("app-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/appconfig/applications/app-1/environments");
  });

  it("useAppConfigEnvironments disabled when null", () => {
    const { result } = renderHook(() => useAppConfigEnvironments(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useAppConfigProfiles calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ profiles: [], total: 0 });
    const { result } = renderHook(() => useAppConfigProfiles("app-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/appconfig/applications/app-1/configuration-profiles");
  });

  it("useAppConfigProfiles disabled when null", () => {
    const { result } = renderHook(() => useAppConfigProfiles(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });
});
