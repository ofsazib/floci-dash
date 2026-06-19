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
  useStateMachines,
  useStateMachine,
  useCreateStateMachine,
  useDeleteStateMachine,
  useStateMachineExecutions,
  useExecutionHistory,
  useActivities,
} from "./useStepFunctions";

beforeEach(() => mockApi.mockReset());

const ARN = "arn:aws:states:us-east-1:123:stateMachine:my-sm";

describe("useStepFunctions hooks", () => {
  it("useStateMachines calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ stateMachines: [], total: 0 });
    const { result } = renderHook(() => useStateMachines(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/stepfunctions/state-machines");
  });

  it("useStateMachine calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ stateMachine: {} });
    const { result } = renderHook(() => useStateMachine(ARN), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(`/aws/stepfunctions/state-machines/${encodeURIComponent(ARN)}`);
  });

  it("useStateMachine disabled when null", () => {
    const { result } = renderHook(() => useStateMachine(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useCreateStateMachine calls POST", async () => {
    mockApi.mockResolvedValueOnce({ stateMachineArn: ARN });
    const { result } = renderHook(() => useCreateStateMachine(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "sm", definition: "{}", roleArn: "arn:r" });
    expect(mockApi).toHaveBeenCalledWith("/aws/stepfunctions/state-machines", {
      method: "POST",
      body: JSON.stringify({ name: "sm", definition: "{}", roleArn: "arn:r" }),
    });
  });

  it("useDeleteStateMachine calls DELETE", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteStateMachine(), { wrapper: createWrapper() });
    await result.current.mutateAsync(ARN);
    expect(mockApi).toHaveBeenCalledWith(`/aws/stepfunctions/state-machines/${encodeURIComponent(ARN)}`, { method: "DELETE" });
  });

  it("useStateMachineExecutions calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ executions: [], total: 0 });
    const { result } = renderHook(() => useStateMachineExecutions(ARN), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(`/aws/stepfunctions/state-machines/${encodeURIComponent(ARN)}/executions`);
  });

  it("useStateMachineExecutions disabled when null", () => {
    const { result } = renderHook(() => useStateMachineExecutions(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useExecutionHistory calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ events: [], total: 0 });
    const { result } = renderHook(() => useExecutionHistory(ARN), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(`/aws/stepfunctions/executions/${encodeURIComponent(ARN)}/history`);
  });

  it("useExecutionHistory disabled when null", () => {
    const { result } = renderHook(() => useExecutionHistory(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useActivities calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ activities: [], total: 0 });
    const { result } = renderHook(() => useActivities(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/stepfunctions/activities");
  });
});
