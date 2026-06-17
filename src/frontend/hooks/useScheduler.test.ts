// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import {
  useSchedulerGroups,
  useCreateSchedulerGroup,
  useDeleteSchedulerGroup,
  useSchedules,
  useSchedule,
  useCreateSchedule,
  useDeleteSchedule,
} from "./useScheduler";
import { api } from "../lib/client";

vi.mock("../lib/client", () => ({
  api: vi.fn(),
}));

const mockedApi = vi.mocked(api);

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: qc }, children);
  };
}

beforeEach(() => {
  mockedApi.mockReset();
});

// ─── Schedule Groups ─────────────────────────────────────

describe("useSchedulerGroups", () => {
  it("fetches schedule groups", async () => {
    mockedApi.mockResolvedValue({ groups: [{ Name: "default" }], total: 1 });
    const { result } = renderHook(() => useSchedulerGroups(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.groups).toHaveLength(1);
    expect(mockedApi).toHaveBeenCalledWith("/aws/scheduler/groups");
  });
});

describe("useCreateSchedulerGroup", () => {
  it("creates a schedule group", async () => {
    mockedApi.mockResolvedValue({ groupArn: "arn:aws:scheduler:us-east-1:123:schedule-group/my-group" });
    const { result } = renderHook(() => useCreateSchedulerGroup(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "my-group" });
    expect(mockedApi).toHaveBeenCalledWith("/aws/scheduler/groups", {
      method: "POST",
      body: JSON.stringify({ name: "my-group" }),
    });
  });
});

describe("useDeleteSchedulerGroup", () => {
  it("deletes a schedule group", async () => {
    mockedApi.mockResolvedValue({ deleted: true });
    const { result } = renderHook(() => useDeleteSchedulerGroup(), { wrapper: createWrapper() });
    await result.current.mutateAsync("my-group");
    expect(mockedApi).toHaveBeenCalledWith("/aws/scheduler/groups/my-group", {
      method: "DELETE",
    });
  });
});

// ─── Schedules ───────────────────────────────────────────

describe("useSchedules", () => {
  it("fetches schedules without group filter", async () => {
    mockedApi.mockResolvedValue({ schedules: [{ Name: "s1" }], total: 1 });
    const { result } = renderHook(() => useSchedules(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.schedules).toHaveLength(1);
    expect(mockedApi).toHaveBeenCalledWith("/aws/scheduler/schedules");
  });

  it("fetches schedules with group filter", async () => {
    mockedApi.mockResolvedValue({ schedules: [], total: 0 });
    const { result } = renderHook(() => useSchedules("my-group"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi).toHaveBeenCalledWith("/aws/scheduler/schedules?group=my-group");
  });
});

describe("useSchedule", () => {
  it("fetches a single schedule", async () => {
    mockedApi.mockResolvedValue({ schedule: { Name: "s1", ScheduleExpression: "rate(1 minute)" } });
    const { result } = renderHook(() => useSchedule("s1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.schedule.Name).toBe("s1");
    expect(mockedApi).toHaveBeenCalledWith("/aws/scheduler/schedules/s1?group=default");
  });

  it("is disabled when name is null", () => {
    const { result } = renderHook(() => useSchedule(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useCreateSchedule", () => {
  it("creates a schedule", async () => {
    mockedApi.mockResolvedValue({ scheduleArn: "arn:aws:scheduler:us-east-1:123:schedule/default/new-schedule" });
    const { result } = renderHook(() => useCreateSchedule(), { wrapper: createWrapper() });
    await result.current.mutateAsync({
      name: "new-schedule",
      groupName: "default",
      scheduleExpression: "rate(5 minutes)",
      target: { arn: "arn:aws:lambda:us-east-1:123:function:fn" },
    });
    expect(mockedApi).toHaveBeenCalledWith("/aws/scheduler/schedules", {
      method: "POST",
      body: JSON.stringify({
        name: "new-schedule",
        groupName: "default",
        scheduleExpression: "rate(5 minutes)",
        target: { arn: "arn:aws:lambda:us-east-1:123:function:fn" },
      }),
    });
  });
});

describe("useDeleteSchedule", () => {
  it("deletes a schedule", async () => {
    mockedApi.mockResolvedValue({ deleted: true });
    const { result } = renderHook(() => useDeleteSchedule(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "my-schedule", group: "my-group" });
    expect(mockedApi).toHaveBeenCalledWith(
      "/aws/scheduler/schedules/my-schedule?group=my-group",
      { method: "DELETE" }
    );
  });

  it("deletes a schedule with default group", async () => {
    mockedApi.mockResolvedValue({ deleted: true });
    const { result } = renderHook(() => useDeleteSchedule(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "my-schedule" });
    expect(mockedApi).toHaveBeenCalledWith(
      "/aws/scheduler/schedules/my-schedule?group=default",
      { method: "DELETE" }
    );
  });
});
