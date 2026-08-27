// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createWrapper } from "../../test/helpers";

const mockApi = vi.fn();
vi.mock("../lib/client", () => ({
  api: (...args: any[]) => mockApi(...args),
}));

import {
  useAgentRuntimes,
  useAgentRuntime,
  useCreateAgentRuntime,
  useUpdateAgentRuntime,
  useDeleteAgentRuntime,
  useInvokeAgentRuntime,
} from "./useAgentCore";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AgentCore hooks", () => {
  it("useAgentRuntimes fetches", async () => {
    mockApi.mockResolvedValueOnce({ agentRuntimes: [], total: 0, nextToken: null });
    const { result } = renderHook(() => useAgentRuntimes(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/bedrockagentcore/runtimes");
  });

  it("useAgentRuntime gated + encoded", async () => {
    mockApi.mockResolvedValueOnce({ runtime: null });
    const { result } = renderHook(() => useAgentRuntime("rt 1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/bedrockagentcore/runtimes/rt%201");

    const idle = renderHook(() => useAgentRuntime(null), { wrapper: createWrapper() });
    expect(idle.result.current.fetchStatus).toBe("idle");
  });

  it("useCreateAgentRuntime posts", async () => {
    mockApi.mockResolvedValueOnce({ agentRuntimeId: "rt" });
    const body = { name: "n", roleArn: "r" };
    const { result } = renderHook(() => useCreateAgentRuntime(), { wrapper: createWrapper() });
    result.current.mutate(body);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/bedrockagentcore/runtimes", {
      method: "POST",
      body: JSON.stringify(body),
    });
  });

  it("useUpdateAgentRuntime patches", async () => {
    mockApi.mockResolvedValueOnce({ status: "UPDATING" });
    const { result } = renderHook(() => useUpdateAgentRuntime(), { wrapper: createWrapper() });
    result.current.mutate({ id: "rt 1", description: "d" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/bedrockagentcore/runtimes/rt%201", {
      method: "PATCH",
      body: JSON.stringify({ roleArn: undefined, description: "d" }),
    });
  });

  it("useDeleteAgentRuntime deletes", async () => {
    mockApi.mockResolvedValueOnce({ status: "DELETED" });
    const { result } = renderHook(() => useDeleteAgentRuntime(), { wrapper: createWrapper() });
    result.current.mutate("rt 1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/bedrockagentcore/runtimes/rt%201", {
      method: "DELETE",
    });
  });

  it("useInvokeAgentRuntime posts payload with default qualifier", async () => {
    mockApi.mockResolvedValueOnce({ answer: "hi" });
    const { result } = renderHook(() => useInvokeAgentRuntime(), { wrapper: createWrapper() });
    result.current.mutate({ arn: "arn:x", payload: { q: 1 } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/bedrockagentcore/invoke/arn%3Ax",
      {
        method: "POST",
        body: JSON.stringify({ payload: { q: 1 }, qualifier: "DEFAULT" }),
      }
    );
  });
});
