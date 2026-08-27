// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createWrapper } from "../../test/helpers";

const mockApi = vi.fn();
vi.mock("../lib/client", () => ({
  api: (...args: any[]) => mockApi(...args),
}));

import {
  useMWAAEnvironments,
  useMWAAEnvironment,
  useCreateMWAAEnvironment,
  useUpdateMWAAEnvironment,
  useDeleteMWAAEnvironment,
  useCreateMWAAWebToken,
  useCreateMWAACliToken,
} from "./useMWAA";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("MWAA hooks", () => {
  it("useMWAAEnvironments fetches", async () => {
    mockApi.mockResolvedValueOnce({ environments: [], total: 0 });
    const { result } = renderHook(() => useMWAAEnvironments(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/mwaa/environments");
  });

  it("useMWAAEnvironment gated + encoded", async () => {
    mockApi.mockResolvedValueOnce({ environment: null });
    const { result } = renderHook(() => useMWAAEnvironment("e 1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/mwaa/environments/e%201");

    const idle = renderHook(() => useMWAAEnvironment(null), { wrapper: createWrapper() });
    expect(idle.result.current.fetchStatus).toBe("idle");
  });

  it("useCreateMWAAEnvironment posts", async () => {
    mockApi.mockResolvedValueOnce({ arn: "arn" });
    const body = {
      name: "env",
      sourceBucketArn: "b",
      executionRoleArn: "r",
      airflowVersion: "2.10.1",
      environmentClass: "ENV_TYPE_SMALL",
      dagS3Path: "dags/",
    };
    const { result } = renderHook(() => useCreateMWAAEnvironment(), { wrapper: createWrapper() });
    result.current.mutate(body);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/mwaa/environments", {
      method: "POST",
      body: JSON.stringify(body),
    });
  });

  it("useUpdateMWAAEnvironment patches", async () => {
    mockApi.mockResolvedValueOnce({ arn: "arn" });
    const { result } = renderHook(() => useUpdateMWAAEnvironment(), { wrapper: createWrapper() });
    result.current.mutate({ name: "e 1", airflowVersion: "2.10.2" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/mwaa/environments/e%201", {
      method: "PATCH",
      body: JSON.stringify({ airflowVersion: "2.10.2", environmentClass: undefined }),
    });
  });

  it("useDeleteMWAAEnvironment deletes", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteMWAAEnvironment(), { wrapper: createWrapper() });
    result.current.mutate("e 1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/mwaa/environments/e%201", { method: "DELETE" });
  });

  it("web + cli tokens post to their endpoints", async () => {
    mockApi.mockResolvedValueOnce({ webToken: "t" });
    const w = renderHook(() => useCreateMWAAWebToken(), { wrapper: createWrapper() });
    w.result.current.mutate("e");
    await waitFor(() => expect(w.result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/mwaa/environments/e/webtoken", { method: "POST" });

    mockApi.mockResolvedValueOnce({ cliToken: "c" });
    const c = renderHook(() => useCreateMWAACliToken(), { wrapper: createWrapper() });
    c.result.current.mutate("e");
    await waitFor(() => expect(c.result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/mwaa/environments/e/clitoken", { method: "POST" });
  });
});
