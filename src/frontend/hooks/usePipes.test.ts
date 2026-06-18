// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createWrapper } from "../../test/helpers";

const mockApi = vi.hoisted(() => vi.fn());

vi.mock("../lib/client", () => ({
  api: (...args: any[]) => mockApi(...args),
}));

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  };
});

import {
  usePipes,
  usePipe,
  useCreatePipe,
  useUpdatePipe,
  useDeletePipe,
  useStartPipe,
  useStopPipe,
} from "./usePipes";

beforeEach(() => mockApi.mockReset());

describe("usePipes hooks", () => {
  it("usePipes calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ pipes: [], total: 0 });
    const { result } = renderHook(() => usePipes(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/pipes/pipes");
  });

  it("usePipes with filters", async () => {
    mockApi.mockResolvedValueOnce({ pipes: [], total: 0 });
    const { result } = renderHook(() => usePipes("abc", "RUNNING"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/pipes/pipes?namePrefix=abc&state=RUNNING");
  });

  it("usePipe calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ pipe: {} });
    const { result } = renderHook(() => usePipe("p1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/pipes/pipes/p1");
  });

  it("usePipe disabled when null", () => {
    const { result } = renderHook(() => usePipe(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useCreatePipe calls POST", async () => {
    mockApi.mockResolvedValueOnce({ pipe: {} });
    const { result } = renderHook(() => useCreatePipe(), { wrapper: createWrapper() });
    await result.current.mutateAsync({
      name: "p1",
      source: "sqs:q",
      target: "lambda:f",
      roleArn: "arn:r",
    });
    expect(mockApi).toHaveBeenCalledWith("/aws/pipes/pipes", {
      method: "POST",
      body: JSON.stringify({ name: "p1", source: "sqs:q", target: "lambda:f", roleArn: "arn:r" }),
    });
  });

  it("useUpdatePipe calls PUT", async () => {
    mockApi.mockResolvedValueOnce({ pipe: {} });
    const { result } = renderHook(() => useUpdatePipe(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "p1", description: "updated" });
    expect(mockApi).toHaveBeenCalledWith("/aws/pipes/pipes/p1", {
      method: "PUT",
      body: JSON.stringify({ name: "p1", description: "updated" }),
    });
  });

  it("useDeletePipe calls DELETE", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeletePipe(), { wrapper: createWrapper() });
    await result.current.mutateAsync("p1");
    expect(mockApi).toHaveBeenCalledWith("/aws/pipes/pipes/p1", { method: "DELETE" });
  });

  it("useStartPipe calls POST", async () => {
    mockApi.mockResolvedValueOnce({ pipe: {} });
    const { result } = renderHook(() => useStartPipe(), { wrapper: createWrapper() });
    await result.current.mutateAsync("p1");
    expect(mockApi).toHaveBeenCalledWith("/aws/pipes/pipes/p1/start", { method: "POST" });
  });

  it("useStopPipe calls POST", async () => {
    mockApi.mockResolvedValueOnce({ pipe: {} });
    const { result } = renderHook(() => useStopPipe(), { wrapper: createWrapper() });
    await result.current.mutateAsync("p1");
    expect(mockApi).toHaveBeenCalledWith("/aws/pipes/pipes/p1/stop", { method: "POST" });
  });
});
