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
  usePublishStateMachineVersion,
  useStateMachineVersions,
  useDeleteStateMachineVersion,
  useStartExecution,
  useStopExecution,
  useCreateActivity,
  useDeleteActivity,
  useDescribeActivity,
  useGetActivityTask,
  useSendTaskSuccess,
  useSendTaskFailure,
  useSendTaskHeartbeat,
  useStartSyncExecution,
  useValidateStateMachineDefinition,
  useStateMachineTags,
  useTagStateMachine,
  useUntagStateMachine,
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

  // ── Versions ──────────────────────────────────────────

  it("useStateMachineVersions calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ versions: [], total: 0 });
    const { result } = renderHook(() => useStateMachineVersions(ARN), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(`/aws/stepfunctions/state-machines/${encodeURIComponent(ARN)}/versions`);
  });

  it("useStateMachineVersions disabled when null", () => {
    const { result } = renderHook(() => useStateMachineVersions(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("usePublishStateMachineVersion calls POST", async () => {
    mockApi.mockResolvedValueOnce({ stateMachineVersionArn: ARN + ":1", creationDate: 456 });
    const { result } = renderHook(() => usePublishStateMachineVersion(), { wrapper: createWrapper() });
    await result.current.mutateAsync(ARN);
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/stepfunctions/state-machines/${encodeURIComponent(ARN)}/versions`,
      expect.objectContaining({ method: "POST" })
    );
  });

  it("useDeleteStateMachineVersion calls DELETE", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteStateMachineVersion(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ arn: ARN, versionArn: ARN + ":1" });
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/stepfunctions/state-machines/${encodeURIComponent(ARN)}/versions/${encodeURIComponent(ARN + ":1")}`,
      { method: "DELETE" }
    );
  });

  // ── Execution control ─────────────────────────────────

  it("useStartExecution POSTs name + input", async () => {
    mockApi.mockResolvedValueOnce({ executionArn: ARN + ":exec", startDate: 1 });
    const { result } = renderHook(() => useStartExecution(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ arn: ARN, name: "run1", input: '{"x":1}' });
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/stepfunctions/state-machines/${encodeURIComponent(ARN)}/executions`,
      { method: "POST", body: JSON.stringify({ name: "run1", input: '{"x":1}' }) }
    );
  });

  it("useStopExecution POSTs to stop endpoint", async () => {
    const execArn = ARN + ":exec";
    mockApi.mockResolvedValueOnce({ stopDate: 2 });
    const { result } = renderHook(() => useStopExecution(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ executionArn: execArn, stateMachineArn: ARN, cause: "manual" });
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/stepfunctions/executions/${encodeURIComponent(execArn)}/stop`,
      { method: "POST", body: JSON.stringify({ cause: "manual", error: undefined }) }
    );
  });
});

describe("G.84 — activities, sync executions, validation, tags", () => {
  const ACT = "arn:aws:states:us-east-1:123:activity:my-act";

  it("useCreateActivity POSTs and invalidates", async () => {
    mockApi.mockResolvedValueOnce({ activity: { activityArn: ACT } });
    const { result } = renderHook(() => useCreateActivity(), { wrapper: createWrapper() });
    await result.current.mutateAsync("my-act");
    expect(mockApi).toHaveBeenCalledWith("/aws/stepfunctions/activities", {
      method: "POST",
      body: JSON.stringify({ name: "my-act" }),
    });
  });

  it("useDeleteActivity DELETEs the encoded arn", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteActivity(), { wrapper: createWrapper() });
    await result.current.mutateAsync(ACT);
    expect(mockApi).toHaveBeenCalledWith(`/aws/stepfunctions/activities/${encodeURIComponent(ACT)}`, {
      method: "DELETE",
    });
  });

  it("useDescribeActivity GETs the encoded arn", async () => {
    mockApi.mockResolvedValueOnce({ activity: { activityArn: ACT } });
    const { result } = renderHook(() => useDescribeActivity(), { wrapper: createWrapper() });
    await result.current.mutateAsync(ACT);
    expect(mockApi).toHaveBeenCalledWith(`/aws/stepfunctions/activities/${encodeURIComponent(ACT)}`);
  });

  it("useGetActivityTask POSTs worker name", async () => {
    mockApi.mockResolvedValueOnce({ task: { taskToken: "tok" } });
    const { result } = renderHook(() => useGetActivityTask(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ arn: ACT, workerName: "w1" });
    expect(mockApi).toHaveBeenCalledWith(`/aws/stepfunctions/activities/${encodeURIComponent(ACT)}/tasks`, {
      method: "POST",
      body: JSON.stringify({ workerName: "w1" }),
    });
  });

  it("useSendTaskSuccess POSTs token + output", async () => {
    mockApi.mockResolvedValueOnce({ success: true });
    const { result } = renderHook(() => useSendTaskSuccess(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ arn: ACT, taskToken: "tok", output: "{}" });
    expect(mockApi).toHaveBeenCalledWith(`/aws/stepfunctions/activities/${encodeURIComponent(ACT)}/tasks/success`, {
      method: "POST",
      body: JSON.stringify({ taskToken: "tok", output: "{}" }),
    });
  });

  it("useSendTaskFailure POSTs error + cause", async () => {
    mockApi.mockResolvedValueOnce({ success: true });
    const { result } = renderHook(() => useSendTaskFailure(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ arn: ACT, taskToken: "tok", error: "E", cause: "C" });
    expect(mockApi).toHaveBeenCalledWith(`/aws/stepfunctions/activities/${encodeURIComponent(ACT)}/tasks/failure`, {
      method: "POST",
      body: JSON.stringify({ taskToken: "tok", error: "E", cause: "C" }),
    });
  });

  it("useSendTaskHeartbeat POSTs token", async () => {
    mockApi.mockResolvedValueOnce({ success: true });
    const { result } = renderHook(() => useSendTaskHeartbeat(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ arn: ACT, taskToken: "tok" });
    expect(mockApi).toHaveBeenCalledWith(`/aws/stepfunctions/activities/${encodeURIComponent(ACT)}/tasks/heartbeat`, {
      method: "POST",
      body: JSON.stringify({ taskToken: "tok" }),
    });
  });

  it("useStartSyncExecution POSTs name + input", async () => {
    mockApi.mockResolvedValueOnce({ execution: { executionArn: "arn:exec" } });
    const { result } = renderHook(() => useStartSyncExecution(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ arn: ARN, name: "run1", input: "{}" });
    expect(mockApi).toHaveBeenCalledWith(`/aws/stepfunctions/state-machines/${encodeURIComponent(ARN)}/sync-executions`, {
      method: "POST",
      body: JSON.stringify({ name: "run1", input: "{}" }),
    });
  });

  it("useValidateStateMachineDefinition POSTs definition + type", async () => {
    mockApi.mockResolvedValueOnce({ valid: true, errors: [] });
    const { result } = renderHook(() => useValidateStateMachineDefinition(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ definition: "{}", type: "STANDARD" });
    expect(mockApi).toHaveBeenCalledWith("/aws/stepfunctions/state-machines/validate", {
      method: "POST",
      body: JSON.stringify({ definition: "{}", type: "STANDARD" }),
    });
  });

  it("useStateMachineTags fetches when arn set", async () => {
    mockApi.mockResolvedValueOnce([{ key: "env", value: "prod" }]);
    const { result } = renderHook(() => useStateMachineTags(ARN), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(`/aws/stepfunctions/state-machines/${encodeURIComponent(ARN)}/tags`);
  });

  it("useStateMachineTags skips when arn null", async () => {
    const { result } = renderHook(() => useStateMachineTags(null), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("useTagStateMachine PUTs tags", async () => {
    mockApi.mockResolvedValueOnce({ success: true });
    const { result } = renderHook(() => useTagStateMachine(ARN), { wrapper: createWrapper() });
    await result.current.mutateAsync([{ key: "env", value: "prod" }]);
    expect(mockApi).toHaveBeenCalledWith(`/aws/stepfunctions/state-machines/${encodeURIComponent(ARN)}/tags`, {
      method: "PUT",
      body: JSON.stringify({ tags: [{ key: "env", value: "prod" }] }),
    });
  });

  it("useUntagStateMachine DELETEs tag keys", async () => {
    mockApi.mockResolvedValueOnce({ success: true });
    const { result } = renderHook(() => useUntagStateMachine(ARN), { wrapper: createWrapper() });
    await result.current.mutateAsync(["env"]);
    expect(mockApi).toHaveBeenCalledWith(`/aws/stepfunctions/state-machines/${encodeURIComponent(ARN)}/tags`, {
      method: "DELETE",
      body: JSON.stringify({ tagKeys: ["env"] }),
    });
  });
});
