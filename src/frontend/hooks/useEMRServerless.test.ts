// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createWrapper } from "../../test/helpers";

const mockApi = vi.fn();
vi.mock("../lib/client", () => ({
  api: (...args: any[]) => mockApi(...args),
}));

import {
  useEMRServerlessApplications,
  useEMRServerlessApplication,
  useCreateEMRServerlessApplication,
  useUpdateEMRServerlessApplication,
  useDeleteEMRServerlessApplication,
  useStartEMRServerlessApplication,
  useStopEMRServerlessApplication,
} from "./useEMRServerless";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("EMR Serverless hooks", () => {
  it("useEMRServerlessApplications fetches", async () => {
    mockApi.mockResolvedValueOnce({ applications: [], total: 0 });
    const { result } = renderHook(() => useEMRServerlessApplications(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/emrserverless/applications");
  });

  it("useEMRServerlessApplication gated + encoded", async () => {
    mockApi.mockResolvedValueOnce({ application: null });
    const { result } = renderHook(() => useEMRServerlessApplication("a 1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/emrserverless/applications/a%201");

    const idle = renderHook(() => useEMRServerlessApplication(null), { wrapper: createWrapper() });
    expect(idle.result.current.fetchStatus).toBe("idle");
  });

  it("useCreateEMRServerlessApplication posts", async () => {
    mockApi.mockResolvedValueOnce({ applicationId: "a" });
    const { result } = renderHook(() => useCreateEMRServerlessApplication(), { wrapper: createWrapper() });
    result.current.mutate({ name: "a", releaseLabel: "emr-7.1.0", type: "SPARK" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/emrserverless/applications", {
      method: "POST",
      body: JSON.stringify({ name: "a", releaseLabel: "emr-7.1.0", type: "SPARK" }),
    });
  });

  it("useUpdateEMRServerlessApplication puts auto configs", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useUpdateEMRServerlessApplication(), { wrapper: createWrapper() });
    result.current.mutate({ id: "a", autoStart: true, autoStop: false });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/emrserverless/applications/a", {
      method: "PUT",
      body: JSON.stringify({ autoStart: true, autoStop: false }),
    });
  });

  it("useDeleteEMRServerlessApplication deletes", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteEMRServerlessApplication(), { wrapper: createWrapper() });
    result.current.mutate("a 1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/emrserverless/applications/a%201", { method: "DELETE" });
  });

  it("start + stop post to their endpoints", async () => {
    mockApi.mockResolvedValueOnce({ started: true });
    const s = renderHook(() => useStartEMRServerlessApplication(), { wrapper: createWrapper() });
    s.result.current.mutate("a");
    await waitFor(() => expect(s.result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/emrserverless/applications/a/start", { method: "POST" });

    mockApi.mockResolvedValueOnce({ stopped: true });
    const t = renderHook(() => useStopEMRServerlessApplication(), { wrapper: createWrapper() });
    t.result.current.mutate("a");
    await waitFor(() => expect(t.result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/emrserverless/applications/a/stop", { method: "POST" });
  });
});
