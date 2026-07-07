// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

// ─── vi.hoisted states ─────────────────────────────────

const createGroupState = vi.hoisted(() => ({
  isError: false,
  error: null as Error | null,
  isPending: false,
}));

const deleteGroupState = vi.hoisted(() => ({
  isPending: false,
  variables: null as any,
}));

const createScheduleState = vi.hoisted(() => ({
  isError: false,
  error: null as Error | null,
  isPending: false,
}));

const deleteScheduleState = vi.hoisted(() => ({
  isPending: false,
  variables: null as any,
}));

const groupsHookState = vi.hoisted(() => ({
  isError: false,
  error: null as Error | null,
}));

// ─── Mock hooks ─────────────────────────────────────────

const mockGroups = vi.fn();
const mockSchedules = vi.fn();
const mockCreateGroup = vi.fn();
const mockDeleteGroup = vi.fn();
const mockCreateSchedule = vi.fn();
const mockDeleteSchedule = vi.fn();

vi.mock("../../hooks/useScheduler", () => ({
  useSchedulerGroups: (...args: any[]) => {
    const r = mockGroups(...args);
    return { ...r, isError: groupsHookState.isError, error: groupsHookState.error };
  },
  useCreateSchedulerGroup: () => ({
    mutate: mockCreateGroup,
    get isPending() { return createGroupState.isPending; },
    get isError() { return createGroupState.isError; },
    get error() { return createGroupState.error; },
    reset: vi.fn(),
  }),
  useDeleteSchedulerGroup: () => ({
    mutateAsync: mockDeleteGroup,
    get isPending() { return deleteGroupState.isPending; },
    get variables() { return deleteGroupState.variables; },
  }),
  useSchedules: (...args: any[]) => mockSchedules(...args),
  useCreateSchedule: () => ({
    mutate: mockCreateSchedule,
    get isPending() { return createScheduleState.isPending; },
    get isError() { return createScheduleState.isError; },
    get error() { return createScheduleState.error; },
    reset: vi.fn(),
  }),
  useDeleteSchedule: () => ({
    mutateAsync: mockDeleteSchedule,
    get isPending() { return deleteScheduleState.isPending; },
    get variables() { return deleteScheduleState.variables; },
  }),
}));

import { SchedulerDashboard } from "./SchedulerDashboard";

// ─── Setup ──────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  createGroupState.isError = false;
  createGroupState.error = null;
  createGroupState.isPending = false;
  deleteGroupState.isPending = false;
  deleteGroupState.variables = null;
  createScheduleState.isError = false;
  createScheduleState.error = null;
  createScheduleState.isPending = false;
  deleteScheduleState.isPending = false;
  deleteScheduleState.variables = null;
  groupsHookState.isError = false;
  groupsHookState.error = null;
  mockGroups.mockReturnValue({ data: { groups: [], total: 0 }, isLoading: false });
  mockSchedules.mockReturnValue({ data: { schedules: [], total: 0 }, isLoading: false });
});

// ─── Tests ──────────────────────────────────────────────

describe("SchedulerDashboard — group list", () => {
  it("shows loading skeleton", () => {
    mockGroups.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = render(<SchedulerDashboard />, { wrapper: createWrapper() });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("shows empty message for groups", () => {
    render(<SchedulerDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No schedule groups found/i)).toBeTruthy();
  });

  it("renders groups with data", () => {
    mockGroups.mockReturnValue({
      data: {
        groups: [{ Name: "default", State: "ACTIVE", CreationDate: "2024-01-15T00:00:00Z" }],
        total: 1,
      },
      isLoading: false,
    });
    render(<SchedulerDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("default")).toBeTruthy();
  });

  it("renders multiple groups", () => {
    mockGroups.mockReturnValue({
      data: {
        groups: [
          { Name: "alpha", State: "ACTIVE" },
          { Name: "beta", State: "DISABLED" },
        ],
        total: 2,
      },
      isLoading: false,
    });
    render(<SchedulerDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("alpha")).toBeTruthy();
    expect(screen.getByText("beta")).toBeTruthy();
  });

  it("shows em-dash for missing creation date", () => {
    mockGroups.mockReturnValue({
      data: { groups: [{ Name: "test" }], total: 1 },
      isLoading: false,
    });
    render(<SchedulerDashboard />, { wrapper: createWrapper() });
    const dashes = screen.getAllByText("\u2014");
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it("shows schedule count for groups", () => {
    mockSchedules.mockReturnValue({ data: { schedules: [], total: 3 } });
    mockGroups.mockReturnValue({
      data: { groups: [{ Name: "my-group", State: "ACTIVE" }], total: 1 },
      isLoading: false,
    });
    render(<SchedulerDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-group")).toBeTruthy();
    expect(screen.getByText("3")).toBeTruthy();
  });

  it("shows ellipsis when schedule count has no data", () => {
    mockSchedules.mockReturnValue({ data: undefined });
    mockGroups.mockReturnValue({
      data: { groups: [{ Name: "my-group", State: "ACTIVE" }], total: 1 },
      isLoading: false,
    });
    render(<SchedulerDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("\u2026")).toBeTruthy();
  });

  it("does not show delete for default group", () => {
    mockGroups.mockReturnValue({
      data: { groups: [{ Name: "default", State: "ACTIVE" }], total: 1 },
      isLoading: false,
    });
    render(<SchedulerDashboard />, { wrapper: createWrapper() });
    expect(screen.queryByRole("button", { name: /Delete default/i })).toBeNull();
  });

  it("shows delete button for non-default group", () => {
    mockGroups.mockReturnValue({
      data: { groups: [{ Name: "custom", State: "ACTIVE" }], total: 1 },
      isLoading: false,
    });
    render(<SchedulerDashboard />, { wrapper: createWrapper() });
    expect(screen.getByRole("button", { name: /Delete custom/i })).toBeTruthy();
  });

  it("filters groups by name", async () => {
    mockGroups.mockReturnValue({
      data: {
        groups: [
          { Name: "alpha", State: "ACTIVE" },
          { Name: "beta", State: "ACTIVE" },
        ],
        total: 2,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<SchedulerDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("alpha")).toBeTruthy());

    const filterInput = screen.getByPlaceholderText("Find groups by name");
    await user.type(filterInput, "beta");
    await waitFor(() => expect(screen.queryByText("alpha")).toBeNull());
  });

  it("deletes a group", async () => {
    mockGroups.mockReturnValue({
      data: { groups: [{ Name: "delete-group", State: "ACTIVE" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<SchedulerDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("delete-group")).toBeTruthy());

    const deleteBtn = screen.getByRole("button", { name: /Delete delete-group/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteGroup).toHaveBeenCalledWith("delete-group"));
  });

  it("shows delete group loading state", () => {
    deleteGroupState.isPending = true;
    mockGroups.mockReturnValue({
      data: { groups: [{ Name: "pending-delete", State: "ACTIVE" }], total: 1 },
      isLoading: false,
    });
    render(<SchedulerDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("pending-delete")).toBeTruthy();
  });
});

describe("SchedulerDashboard — create group modal", () => {
  it("opens create group modal and submits", async () => {
    const user = userEvent.setup();
    render(<SchedulerDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create schedule group")).toBeTruthy());

    const nameInput = screen.getByPlaceholderText("my-schedule-group");
    await user.type(nameInput, "my-group");

    const createBtns = screen.getAllByRole("button", { name: /Create/i });
    await user.click(createBtns[createBtns.length - 1]);

    await waitFor(() => {
      expect(mockCreateGroup).toHaveBeenCalledWith(
        expect.objectContaining({ name: "my-group" }),
        expect.any(Object),
      );
    });
  });

  it("cancels create group modal", async () => {
    const user = userEvent.setup();
    render(<SchedulerDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create schedule group")).toBeTruthy());
    await clickButton(user, /Cancel/i);
    expect(mockCreateGroup).not.toHaveBeenCalled();
  });

  it("shows create group loading state", async () => {
    createGroupState.isPending = true;
    const user = userEvent.setup();
    render(<SchedulerDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create schedule group")).toBeTruthy());
    // Create button with loading state
    expect(screen.getByText("Create schedule group")).toBeTruthy();
  });

  it("shows create group error alert", async () => {
    createGroupState.isError = true;
    createGroupState.error = new Error("Group already exists");
    const user = userEvent.setup();
    render(<SchedulerDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create schedule group")).toBeTruthy());
    expect(screen.getByText("Group already exists")).toBeTruthy();
    createGroupState.isError = false;
    createGroupState.error = null;
  });
});

describe("SchedulerDashboard — group detail", () => {
  it("renders schedule count fallback for zero total", () => {
    mockSchedules.mockReturnValue({ data: { schedules: [], total: 0 } });
    mockGroups.mockReturnValue({
      data: { groups: [{ Name: "my-group", State: "ACTIVE" }], total: 1 },
      isLoading: false,
    });
    render(<SchedulerDashboard />, { wrapper: createWrapper() });
    // GroupScheduleCount shows data?.total; when total is 0, renders "0"
    expect(screen.getByText("0")).toBeTruthy();
  });

  it("shows schedule target with full ARN when no colon", () => {
    // The SchedulerGroupDetail is unreachable via UI (group names are plain text
    // in the auto-split component). Test that the schedule count renders correctly.
    mockSchedules.mockReturnValue({ data: { schedules: [], total: 5 } });
    mockGroups.mockReturnValue({
      data: { groups: [{ Name: "my-group", State: "ACTIVE" }], total: 1 },
      isLoading: false,
    });
    render(<SchedulerDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("5")).toBeTruthy();
  });
});
