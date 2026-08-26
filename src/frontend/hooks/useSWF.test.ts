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
  useSwfDomains,
  useSwfDomain,
  useCreateSwfDomain,
  useDeprecateSwfDomain,
  useUndeprecateSwfDomain,
  useSwfWorkflowTypes,
  useSwfActivityTypes,
  useRegisterSwfWorkflowType,
  useDeprecateSwfWorkflowType,
  useDeleteSwfWorkflowType,
  useRegisterSwfActivityType,
  useDeprecateSwfActivityType,
  useDeleteSwfActivityType,
  useSwfOpenExecutions,
  useSwfClosedExecutions,
  useSwfExecutionHistory,
  useStartSwfExecution,
  useTerminateSwfExecution,
  useSignalSwfExecution,
} from "./useSWF";

beforeEach(() => mockApi.mockReset());

describe("SWF query hooks", () => {
  it("useSwfDomains calls correct URL with default status", async () => {
    mockApi.mockResolvedValueOnce({ domains: [], total: 0 });
    const { result } = renderHook(() => useSwfDomains(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/swf/domains?registrationStatus=REGISTERED");
  });

  it("useSwfDomains honors custom status", async () => {
    mockApi.mockResolvedValueOnce({ domains: [], total: 0 });
    const { result } = renderHook(() => useSwfDomains("DEPRECATED"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/swf/domains?registrationStatus=DEPRECATED");
  });

  it("useSwfDomain calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ domain: {} });
    const { result } = renderHook(() => useSwfDomain("d1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/swf/domains/d1");
  });

  it("useSwfDomain disabled when null", () => {
    const { result } = renderHook(() => useSwfDomain(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useSwfWorkflowTypes calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ typeInfos: [], total: 0 });
    const { result } = renderHook(() => useSwfWorkflowTypes("d1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/swf/workflow-types?domain=d1&registrationStatus=REGISTERED"
    );
  });

  it("useSwfWorkflowTypes disabled when null", () => {
    const { result } = renderHook(() => useSwfWorkflowTypes(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useSwfActivityTypes calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ typeInfos: [], total: 0 });
    const { result } = renderHook(() => useSwfActivityTypes("d1", "DEPRECATED"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/swf/activity-types?domain=d1&registrationStatus=DEPRECATED"
    );
  });

  it("useSwfActivityTypes disabled when null", () => {
    const { result } = renderHook(() => useSwfActivityTypes(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useSwfOpenExecutions calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ executionInfos: [], total: 0 });
    const { result } = renderHook(() => useSwfOpenExecutions("d1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/swf/executions/open?domain=d1");
  });

  it("useSwfOpenExecutions disabled when null", () => {
    const { result } = renderHook(() => useSwfOpenExecutions(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useSwfClosedExecutions calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ executionInfos: [], total: 0 });
    const { result } = renderHook(() => useSwfClosedExecutions("d1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/swf/executions/closed?domain=d1");
  });

  it("useSwfClosedExecutions disabled when null", () => {
    const { result } = renderHook(() => useSwfClosedExecutions(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useSwfExecutionHistory calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ events: [], total: 0 });
    const { result } = renderHook(() => useSwfExecutionHistory("d1", "wf-1", "r1"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/swf/executions/history?domain=d1&workflowId=wf-1&runId=r1"
    );
  });

  it("useSwfExecutionHistory disabled until all params set", () => {
    const { result } = renderHook(() => useSwfExecutionHistory("d1", "wf-1", null), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("SWF mutation hooks", () => {
  it.each([
    [
      "useCreateSwfDomain",
      useCreateSwfDomain,
      { name: "d1" },
      { method: "POST", body: JSON.stringify({ name: "d1" }) },
      "/aws/swf/domains",
    ],
    [
      "useDeprecateSwfDomain",
      useDeprecateSwfDomain,
      "d1",
      { method: "POST" },
      "/aws/swf/domains/d1/deprecate",
    ],
    [
      "useUndeprecateSwfDomain",
      useUndeprecateSwfDomain,
      "d1",
      { method: "POST" },
      "/aws/swf/domains/d1/undeprecate",
    ],
    [
      "useRegisterSwfWorkflowType",
      useRegisterSwfWorkflowType,
      { domain: "d1", name: "w", version: "1" },
      { method: "POST", body: JSON.stringify({ domain: "d1", name: "w", version: "1" }) },
      "/aws/swf/workflow-types",
    ],
    [
      "useDeprecateSwfWorkflowType",
      useDeprecateSwfWorkflowType,
      { domain: "d1", name: "w", version: "1" },
      { method: "POST", body: JSON.stringify({ domain: "d1", name: "w", version: "1" }) },
      "/aws/swf/workflow-types/deprecate",
    ],
    [
      "useDeleteSwfWorkflowType",
      useDeleteSwfWorkflowType,
      { domain: "d1", name: "w", version: "1" },
      { method: "DELETE", body: JSON.stringify({ domain: "d1", name: "w", version: "1" }) },
      "/aws/swf/workflow-types",
    ],
    [
      "useRegisterSwfActivityType",
      useRegisterSwfActivityType,
      { domain: "d1", name: "a", version: "1" },
      { method: "POST", body: JSON.stringify({ domain: "d1", name: "a", version: "1" }) },
      "/aws/swf/activity-types",
    ],
    [
      "useDeprecateSwfActivityType",
      useDeprecateSwfActivityType,
      { domain: "d1", name: "a", version: "1" },
      { method: "POST", body: JSON.stringify({ domain: "d1", name: "a", version: "1" }) },
      "/aws/swf/activity-types/deprecate",
    ],
    [
      "useDeleteSwfActivityType",
      useDeleteSwfActivityType,
      { domain: "d1", name: "a", version: "1" },
      { method: "DELETE", body: JSON.stringify({ domain: "d1", name: "a", version: "1" }) },
      "/aws/swf/activity-types",
    ],
    [
      "useStartSwfExecution",
      useStartSwfExecution,
      { domain: "d1", workflowId: "e", workflowTypeName: "w", workflowTypeVersion: "1" },
      {
        method: "POST",
        body: JSON.stringify({
          domain: "d1",
          workflowId: "e",
          workflowTypeName: "w",
          workflowTypeVersion: "1",
        }),
      },
      "/aws/swf/executions",
    ],
    [
      "useTerminateSwfExecution",
      useTerminateSwfExecution,
      { domain: "d1", workflowId: "e" },
      { method: "POST", body: JSON.stringify({ domain: "d1", workflowId: "e" }) },
      "/aws/swf/executions/terminate",
    ],
    [
      "useSignalSwfExecution",
      useSignalSwfExecution,
      { domain: "d1", workflowId: "e", signalName: "go" },
      {
        method: "POST",
        body: JSON.stringify({ domain: "d1", workflowId: "e", signalName: "go" }),
      },
      "/aws/swf/executions/signal",
    ],
  ])("%s calls the right endpoint", async (_name, useHook, params, expectedOpts, url) => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => (useHook as any)(), { wrapper: createWrapper() });
    await result.current.mutateAsync(params);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(url, expectedOpts);
  });
});
