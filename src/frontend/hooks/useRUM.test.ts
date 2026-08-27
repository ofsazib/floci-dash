// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createWrapper } from "../../test/helpers";

const mockApi = vi.fn();
vi.mock("../lib/client", () => ({
  api: (...args: any[]) => mockApi(...args),
}));

import {
  useRUMAppMonitors,
  useRUMAppMonitor,
  useCreateRUMAppMonitor,
  useUpdateRUMAppMonitor,
  useDeleteRUMAppMonitor,
} from "./useRUM";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("RUM hooks", () => {
  it("useRUMAppMonitors fetches", async () => {
    mockApi.mockResolvedValueOnce({ appMonitors: [], total: 0, nextToken: null });
    const { result } = renderHook(() => useRUMAppMonitors(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/rum/appmonitors");
  });

  it("useRUMAppMonitor gated + encoded", async () => {
    mockApi.mockResolvedValueOnce({ appMonitor: null });
    const { result } = renderHook(() => useRUMAppMonitor("m 1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/rum/appmonitors/m%201");

    const idle = renderHook(() => useRUMAppMonitor(null), { wrapper: createWrapper() });
    expect(idle.result.current.fetchStatus).toBe("idle");
  });

  it("useCreateRUMAppMonitor posts", async () => {
    mockApi.mockResolvedValueOnce({ id: "i" });
    const body = { name: "m", domain: "example.com", platform: "web" };
    const { result } = renderHook(() => useCreateRUMAppMonitor(), { wrapper: createWrapper() });
    result.current.mutate(body);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/rum/appmonitors", {
      method: "POST",
      body: JSON.stringify(body),
    });
  });

  it("useUpdateRUMAppMonitor patches", async () => {
    mockApi.mockResolvedValueOnce({ updated: true });
    const { result } = renderHook(() => useUpdateRUMAppMonitor(), { wrapper: createWrapper() });
    result.current.mutate({ name: "m 1", domain: "d.example", domains: ["a.com"] });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/rum/appmonitors/m%201", {
      method: "PATCH",
      body: JSON.stringify({ domain: "d.example", domains: ["a.com"] }),
    });
  });

  it("useDeleteRUMAppMonitor deletes", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteRUMAppMonitor(), { wrapper: createWrapper() });
    result.current.mutate("m 1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/rum/appmonitors/m%201", { method: "DELETE" });
  });
});
