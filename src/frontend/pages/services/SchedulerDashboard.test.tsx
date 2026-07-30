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

const updateScheduleState = vi.hoisted(() => ({
  isError: false,
  error: null as Error | null,
  isPending: false,
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
const mockUpdateSchedule = vi.fn();

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
  useUpdateSchedule: () => ({
    mutate: mockUpdateSchedule,
    get isPending() { return updateScheduleState.isPending; },
    get isError() { return updateScheduleState.isError; },
    get error() { return updateScheduleState.error; },
    reset: vi.fn(),
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
  updateScheduleState.isError = false;
  updateScheduleState.error = null;
  updateScheduleState.isPending = false;
  groupsHookState.isError = false;
  groupsHookState.error = null;
  mockGroups.mockReturnValue({ data: { groups: [], total: 0 }, isLoading: false });
  mockSchedules.mockReturnValue({ data: { schedules: [], total: 0 }, isLoading: false });
  mockUpdateSchedule.mockReset();
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
  async function navigateToGroup(name: string) {
    const user = userEvent.setup();
    render(<SchedulerDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText(name)).toBeTruthy());
    await user.click(screen.getByRole("button", { name }));
    await waitFor(() => expect(screen.getByText(/Back to Schedule Groups/i)).toBeTruthy());
    return user;
  }

  beforeEach(() => {
    mockGroups.mockReturnValue({
      data: { groups: [{ Name: "my-group", State: "ACTIVE" }], total: 1 },
      isLoading: false,
    });
  });

  it("renders schedule count fallback for zero total", () => {
    mockSchedules.mockReturnValue({ data: { schedules: [], total: 0 } });
    mockGroups.mockReturnValue({
      data: { groups: [{ Name: "my-group", State: "ACTIVE" }], total: 1 },
      isLoading: false,
    });
    render(<SchedulerDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("0")).toBeTruthy();
  });

  it("navigates into group detail via clicking group name", async () => {
    mockSchedules.mockReturnValue({ data: { schedules: [], total: 0 }, isLoading: false });
    await navigateToGroup("my-group");
    expect(screen.getByText(/Group: my-group/)).toBeTruthy();
  });

  it("goes back to group list from detail", async () => {
    mockSchedules.mockReturnValue({ data: { schedules: [], total: 0 }, isLoading: false });
    const user = await navigateToGroup("my-group");
    mockGroups.mockReturnValue({ data: { groups: [], total: 0 }, isLoading: false });
    await user.click(screen.getByText(/Back to Schedule Groups/));
    await waitFor(() => expect(screen.getByText(/No schedule groups found/)).toBeTruthy());
  });

  it("shows loading for schedules", async () => {
    mockSchedules.mockReturnValue({ data: undefined, isLoading: true });
    await navigateToGroup("my-group");
    expect(screen.getByText(/Back to Schedule Groups/)).toBeTruthy();
  });

  it("shows empty schedules message", async () => {
    mockSchedules.mockReturnValue({ data: { schedules: [], total: 0 }, isLoading: false });
    await navigateToGroup("my-group");
    expect(screen.getByText(/No schedules in this group/)).toBeTruthy();
  });

  it("renders schedules with data", async () => {
    mockSchedules.mockReturnValue({
      data: {
        schedules: [{
          Name: "my-schedule",
          ScheduleExpression: "rate(5 minutes)",
          State: "ENABLED",
          Target: { Arn: "arn:aws:lambda:us-east-1:123:function:my-fn" },
        }],
        total: 1,
      },
      isLoading: false,
    });
    await navigateToGroup("my-group");
    expect(screen.getByText("my-schedule")).toBeTruthy();
    expect(screen.getByText("rate(5 minutes)")).toBeTruthy();
  });

  it("shows short target name from ARN", async () => {
    mockSchedules.mockReturnValue({
      data: {
        schedules: [{
          Name: "s1",
          ScheduleExpression: "rate(1 hour)",
          Target: { Arn: "arn:aws:lambda:us-east-1:123:function:my-fn" },
        }],
        total: 1,
      },
      isLoading: false,
    });
    await navigateToGroup("my-group");
    expect(screen.getByText("my-fn")).toBeTruthy();
  });

  it("shows full ARN as target when no colon", async () => {
    mockSchedules.mockReturnValue({
      data: {
        schedules: [{
          Name: "s2",
          ScheduleExpression: "cron(0 * * * ? *)",
          Target: { Arn: "simple-arn-no-colons" },
        }],
        total: 1,
      },
      isLoading: false,
    });
    await navigateToGroup("my-group");
    expect(screen.getByText("simple-arn-no-colons")).toBeTruthy();
  });

  it("shows em-dash for missing target ARN", async () => {
    mockSchedules.mockReturnValue({
      data: {
        schedules: [{
          Name: "s3",
          ScheduleExpression: "at(2024-01-01T00:00:00)",
          Target: {},
        }],
        total: 1,
      },
      isLoading: false,
    });
    await navigateToGroup("my-group");
    expect(screen.getByText("\u2014")).toBeTruthy();
  });

  it("defaults state to ENABLED when missing", async () => {
    mockSchedules.mockReturnValue({
      data: {
        schedules: [{
          Name: "no-state",
          ScheduleExpression: "rate(1 minute)",
        }],
        total: 1,
      },
      isLoading: false,
    });
    await navigateToGroup("my-group");
    expect(screen.getByText("ENABLED")).toBeTruthy();
  });

  it("filters schedules by name", async () => {
    const user = userEvent.setup();
    mockSchedules.mockReturnValue({
      data: {
        schedules: [
          { Name: "alpha-schedule", ScheduleExpression: "rate(1 min)" },
          { Name: "beta-schedule", ScheduleExpression: "rate(5 min)" },
        ],
        total: 2,
      },
      isLoading: false,
    });
    render(<SchedulerDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-group")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "my-group" }));
    await waitFor(() => expect(screen.getByText("alpha-schedule")).toBeTruthy());

    const filterInput = screen.getByPlaceholderText("Find schedules by name");
    await user.type(filterInput, "beta");
    await waitFor(() => expect(screen.queryByText("alpha-schedule")).toBeNull());
  });

  it("deletes a schedule via confirmation", async () => {
    const user = userEvent.setup();
    mockSchedules.mockReturnValue({
      data: {
        schedules: [{ Name: "to-delete", ScheduleExpression: "rate(1 min)" }],
        total: 1,
      },
      isLoading: false,
    });
    render(<SchedulerDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-group")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "my-group" }));
    await waitFor(() => expect(screen.getByText("to-delete")).toBeTruthy());

    const deleteBtn = screen.getByRole("button", { name: /Delete to-delete/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteSchedule).toHaveBeenCalledWith({ name: "to-delete", group: "my-group" }));
  });
});

describe("SchedulerDashboard — create schedule modal", () => {
  beforeEach(() => {
    mockGroups.mockReturnValue({
      data: { groups: [{ Name: "my-group", State: "ACTIVE" }], total: 1 },
      isLoading: false,
    });
    mockSchedules.mockReturnValue({ data: { schedules: [], total: 0 }, isLoading: false });
  });

  async function openCreateSchedule(user: any) {
    render(<SchedulerDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-group")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "my-group" }));
    await waitFor(() => expect(screen.getByText(/Back to Schedule Groups/)).toBeTruthy());
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Schedule name")).toBeTruthy());
  }

  it("opens create schedule modal", async () => {
    const user = userEvent.setup();
    await openCreateSchedule(user);
    expect(screen.getByText("Create schedule")).toBeTruthy();
  });

  it("cancels create schedule modal", async () => {
    const user = userEvent.setup();
    await openCreateSchedule(user);
    const cancelBtns = screen.getAllByRole("button", { name: /Cancel/i });
    await user.click(cancelBtns[cancelBtns.length - 1]);
    expect(mockCreateSchedule).not.toHaveBeenCalled();
  });

  it("shows create schedule error alert", async () => {
    createScheduleState.isError = true;
    createScheduleState.error = new Error("Schedule already exists");
    const user = userEvent.setup();
    await openCreateSchedule(user);
    expect(screen.getByText("Schedule already exists")).toBeTruthy();
    createScheduleState.isError = false;
    createScheduleState.error = null;
  });

  it("renders schedule form fields with defaults", async () => {
    const user = userEvent.setup();
    await openCreateSchedule(user);
    expect(screen.getByPlaceholderText("my-schedule")).toBeTruthy();
    expect(screen.getByPlaceholderText("rate(5 minutes)")).toBeTruthy();
    expect(screen.getByPlaceholderText(/arn:aws:lambda/)).toBeTruthy();
    expect(screen.getByPlaceholderText(/arn:aws:iam/)).toBeTruthy();
  });
});

describe("SchedulerDashboard — edit schedule modal", () => {
  beforeEach(() => {
    mockGroups.mockReturnValue({
      data: { groups: [{ Name: "my-group", State: "ACTIVE" }], total: 1 },
      isLoading: false,
    });
    mockSchedules.mockReturnValue({
      data: {
        schedules: [{
          Name: "edit-me",
          ScheduleExpression: "rate(1 hour)",
          State: "ENABLED",
          Description: "Test schedule",
          Target: { Arn: "arn:aws:lambda:us-east-1:123:function:my-fn", RoleArn: "arn:aws:iam::123:role/scheduler" },
        }],
        total: 1,
      },
      isLoading: false,
    });
  });

  async function openEditModal(user: any) {
    render(<SchedulerDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-group")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "my-group" }));
    await waitFor(() => expect(screen.getByText("edit-me")).toBeTruthy());
    const editBtn = screen.getByRole("button", { name: /Edit edit-me/i });
    await user.click(editBtn);
    await waitFor(() => expect(screen.getByText(/Edit schedule: edit-me/)).toBeTruthy());
  }

  it("opens edit schedule modal with pre-filled form", async () => {
    const user = userEvent.setup();
    await openEditModal(user);
    expect(screen.getByText(/Edit schedule: edit-me/)).toBeTruthy();
  });

  it("shows state select with ENABLED and DISABLED", async () => {
    const user = userEvent.setup();
    await openEditModal(user);
    expect(screen.getByText("ENABLED")).toBeTruthy();
  });

  it("cancels edit schedule modal", async () => {
    const user = userEvent.setup();
    await openEditModal(user);
    const cancelBtns = screen.getAllByRole("button", { name: /Cancel/i });
    await user.click(cancelBtns[cancelBtns.length - 1]);
    await waitFor(() => expect(screen.queryByText(/Edit schedule: edit-me/)).toBeNull());
  });

  it("shows edit schedule error alert", async () => {
    updateScheduleState.isError = true;
    updateScheduleState.error = new Error("Update failed");
    const user = userEvent.setup();
    await openEditModal(user);
    expect(screen.getByText("Update failed")).toBeTruthy();
  });
});

describe("SchedulerDashboard — submit flows", () => {
  beforeEach(() => {
    mockGroups.mockReturnValue({
      data: { groups: [{ Name: "my-group", State: "ACTIVE" }], total: 1 },
      isLoading: false,
    });
  });

  it("create schedule button is disabled when form empty", async () => {
    mockSchedules.mockReturnValue({ data: { schedules: [], total: 0 }, isLoading: false });
    const user = userEvent.setup();
    render(<SchedulerDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-group")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "my-group" }));
    await waitFor(() => expect(screen.getByText(/Back to Schedule Groups/)).toBeTruthy());
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create schedule")).toBeTruthy());
    // Create button should be disabled (no name, no target ARN)
    const createBtns = screen.getAllByRole("button", { name: /Create/i });
    const modalCreateBtn = createBtns[createBtns.length - 1];
    expect(modalCreateBtn).toBeDisabled();
  });

  it("submits create schedule form", async () => {
    mockSchedules.mockReturnValue({ data: { schedules: [], total: 0 }, isLoading: false });
    const user = userEvent.setup();
    render(<SchedulerDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-group")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "my-group" }));
    await waitFor(() => expect(screen.getByText(/Back to Schedule Groups/)).toBeTruthy());
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Schedule name")).toBeTruthy());

    await user.type(screen.getByPlaceholderText("my-schedule"), "new-schedule");
    await user.type(screen.getByPlaceholderText(/arn:aws:lambda/), "arn:aws:lambda:us-east-1:123:function:test-fn");

    const createBtns = screen.getAllByRole("button", { name: /Create/i });
    await user.click(createBtns[createBtns.length - 1]);

    await waitFor(() => {
      expect(mockCreateSchedule).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "new-schedule",
          groupName: "my-group",
          scheduleExpression: "rate(1 minute)",
          target: expect.objectContaining({ arn: "arn:aws:lambda:us-east-1:123:function:test-fn" }),
        }),
        expect.any(Object),
      );
    });
  });

  it("submits edit schedule form", async () => {
    mockSchedules.mockReturnValue({
      data: {
        schedules: [{
          Name: "edit-me",
          ScheduleExpression: "rate(1 hour)",
          State: "ENABLED",
          Target: { Arn: "arn:aws:lambda:us-east-1:123:function:my-fn" },
        }],
        total: 1,
      },
      isLoading: false,
    });

    const user = userEvent.setup();
    render(<SchedulerDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-group")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "my-group" }));
    await waitFor(() => expect(screen.getByText("edit-me")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Edit edit-me/i }));
    await waitFor(() => expect(screen.getByText(/Edit schedule: edit-me/)).toBeTruthy());

    const saveBtn = screen.getByRole("button", { name: /Save changes/i });
    await user.click(saveBtn);

    await waitFor(() => {
      expect(mockUpdateSchedule).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "edit-me",
          group: "my-group",
          scheduleExpression: "rate(1 hour)",
          state: "ENABLED",
        }),
        expect.any(Object),
      );
    });
  });
});

describe("SchedulerDashboard — data edge cases", () => {
  beforeEach(() => {
    mockGroups.mockReturnValue({
      data: { groups: [{ Name: "my-group", State: "ACTIVE" }], total: 1 },
      isLoading: false,
    });
    mockSchedules.mockReturnValue({ data: { schedules: [], total: 0 }, isLoading: false });
  });

  it("handles groups error state (renders without crashing)", () => {
    groupsHookState.isError = true;
    groupsHookState.error = new Error("Failed to load groups");
    mockGroups.mockReturnValue({ data: undefined, isLoading: false });
    render(<SchedulerDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No schedule groups found/i)).toBeTruthy();
  });

  it("handles undefined groups data", () => {
    mockGroups.mockReturnValue({ data: undefined, isLoading: false });
    render(<SchedulerDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No schedule groups found/i)).toBeTruthy();
  });

  it("handles null groups data", () => {
    mockGroups.mockReturnValue({ data: { groups: null, total: 0 }, isLoading: false });
    render(<SchedulerDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No schedule groups found/i)).toBeTruthy();
  });

  it("handles undefined schedules data in detail", async () => {
    mockSchedules.mockReturnValue({ data: undefined });
    const user = userEvent.setup();
    render(<SchedulerDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-group")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "my-group" }));
    await waitFor(() => expect(screen.getByText(/No schedules in this group/)).toBeTruthy());
  });

  it("handles null schedules data in detail", async () => {
    mockSchedules.mockReturnValue({ data: { schedules: null } });
    const user = userEvent.setup();
    render(<SchedulerDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-group")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "my-group" }));
    await waitFor(() => expect(screen.getByText(/No schedules in this group/)).toBeTruthy());
  });

  it("shows create schedule error fallback message", async () => {
    createScheduleState.isError = true;
    createScheduleState.error = {} as Error;
    const user = userEvent.setup();
    render(<SchedulerDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-group")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "my-group" }));
    await waitFor(() => expect(screen.getByText(/Back to Schedule Groups/)).toBeTruthy());
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create schedule")).toBeTruthy());
    expect(screen.getByText(/Failed to create schedule/)).toBeTruthy();
    createScheduleState.isError = false;
    createScheduleState.error = null;
  });

  it("shows update schedule error fallback message", async () => {
    updateScheduleState.isError = true;
    updateScheduleState.error = {} as Error;
    mockSchedules.mockReturnValue({
      data: { schedules: [{ Name: "edit-me", ScheduleExpression: "rate(1 hour)" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<SchedulerDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-group")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "my-group" }));
    await waitFor(() => expect(screen.getByText("edit-me")).toBeTruthy());
    const editBtn = screen.getByRole("button", { name: /Edit edit-me/i });
    await user.click(editBtn);
    await waitFor(() => expect(screen.getByText(/Edit schedule: edit-me/)).toBeTruthy());
    expect(screen.getByText(/Failed to update schedule/)).toBeTruthy();
  });

  it("shows delete schedule loading state", async () => {
    deleteScheduleState.isPending = true;
    mockSchedules.mockReturnValue({
      data: { schedules: [{ Name: "schedule-1", ScheduleExpression: "rate(1 min)" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<SchedulerDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-group")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "my-group" }));
    await waitFor(() => expect(screen.getByText("schedule-1")).toBeTruthy());
  });

  it("shows update schedule loading state", async () => {     updateScheduleState.isPending = true;
    mockSchedules.mockReturnValue({
      data: { schedules: [{ Name: "edit-me", ScheduleExpression: "rate(1 hour)" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<SchedulerDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-group")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "my-group" }));
    await waitFor(() => expect(screen.getByText("edit-me")).toBeTruthy());
  });

  it("shows create group error fallback message", async () => {
    createGroupState.isError = true;
    createGroupState.error = {} as Error;
    const user = userEvent.setup();
    render(<SchedulerDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create schedule group")).toBeTruthy());
    expect(screen.getByText(/Failed to create schedule group/)).toBeTruthy();
    createGroupState.isError = false;
    createGroupState.error = null;
  });

  it("submits create schedule with description", async () => {
    mockSchedules.mockReturnValue({ data: { schedules: [], total: 0 }, isLoading: false });
    const user = userEvent.setup();
    render(<SchedulerDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-group")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "my-group" }));
    await waitFor(() => expect(screen.getByText(/Back to Schedule Groups/)).toBeTruthy());
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Schedule name")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("my-schedule"), "described-schedule");
    await user.type(screen.getByPlaceholderText(/arn:aws:lambda/), "arn:aws:lambda:us-east-1:123:function:test");
    // Description is the 5th textbox in the create form (name, expr, target, role, description)
    const textboxes = screen.getAllByRole("textbox");
    const descInput = textboxes[4]; // 5th textbox = description
    await user.type(descInput, "A test description");
    const createBtns = screen.getAllByRole("button", { name: /Create/i });
    await user.click(createBtns[createBtns.length - 1]);
    await waitFor(() => {
      expect(mockCreateSchedule).toHaveBeenCalledWith(
        expect.objectContaining({ name: "described-schedule", description: "A test description" }),
        expect.any(Object),
      );
    });
  });

  it("edit modal Save changes enabled when form is filled", async () => {
    mockSchedules.mockReturnValue({
      data: {
        schedules: [{ Name: "edit-me", ScheduleExpression: "rate(1 hour)", Target: { Arn: "arn:aws:lambda:us-east-1:123:function:my-fn" } }],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<SchedulerDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-group")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "my-group" }));
    await waitFor(() => expect(screen.getByText("edit-me")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Edit edit-me/i }));
    await waitFor(() => expect(screen.getByText(/Edit schedule: edit-me/)).toBeTruthy());
    // Save changes should be enabled when expression and targetARN are pre-filled
    const saveBtn = screen.getByRole("button", { name: /Save changes/i });
    expect(saveBtn.getAttribute("disabled")).toBeNull();
  });

  it("openEdit pre-fills missing Target.Arn with empty string", async () => {
    mockSchedules.mockReturnValue({
      data: {
        schedules: [{ Name: "no-target", ScheduleExpression: "rate(1 min)", Target: {} }],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<SchedulerDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-group")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "my-group" }));
    await waitFor(() => expect(screen.getByText("no-target")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Edit no-target/i }));
    await waitFor(() => expect(screen.getByText(/Edit schedule: no-target/)).toBeTruthy());
    // Verify the form opens (targetArn falls back to empty string, Save disabled)
    const saveBtn = screen.getByRole("button", { name: /Save changes/i });
    expect(saveBtn).toBeDisabled();
  });

  it("edit schedule changes state to DISABLED and submits", async () => {
    mockSchedules.mockReturnValue({
      data: {
        schedules: [{ Name: "edit-me", ScheduleExpression: "rate(1 hour)", State: "ENABLED", Target: { Arn: "arn:aws:lambda:us-east-1:123:function:my-fn" } }],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<SchedulerDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-group")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "my-group" }));
    await waitFor(() => expect(screen.getByText("edit-me")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Edit edit-me/i }));
    await waitFor(() => expect(screen.getByText(/Edit schedule: edit-me/)).toBeTruthy());
    // Change state from ENABLED to DISABLED via Select dropdown
    const stateTrigger = screen.getByText("ENABLED");
    await user.click(stateTrigger);
    await waitFor(() => expect(screen.getByText("DISABLED")).toBeTruthy());
    await user.click(screen.getByText("DISABLED"));
    // Click Save changes
    await user.click(screen.getByRole("button", { name: /Save changes/i }));
    await waitFor(() => {
      expect(mockUpdateSchedule).toHaveBeenCalledWith(
        expect.objectContaining({ state: "DISABLED" }),
        expect.any(Object),
      );
    });
  });

  it("create schedule shows loading state", async () => {
    createScheduleState.isPending = true;
    const user = userEvent.setup();
    render(<SchedulerDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-group")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "my-group" }));
    await waitFor(() => expect(screen.getByText(/Back to Schedule Groups/)).toBeTruthy());
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create schedule")).toBeTruthy());
    expect(screen.getByText("Create schedule")).toBeTruthy();
    createScheduleState.isPending = false;
  });

  it("create schedule submits with role ARN", async () => {
    mockSchedules.mockReturnValue({ data: { schedules: [], total: 0 }, isLoading: false });
    const user = userEvent.setup();
    render(<SchedulerDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-group")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "my-group" }));
    await waitFor(() => expect(screen.getByText(/Back to Schedule Groups/)).toBeTruthy());
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Schedule name")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("my-schedule"), "role-schedule");
    await user.type(screen.getByPlaceholderText(/arn:aws:lambda/), "arn:aws:lambda:us-east-1:123:function:test-fn");
    await user.type(screen.getByPlaceholderText(/arn:aws:iam/), "arn:aws:iam::123:role/scheduler-role");
    const createBtns = screen.getAllByRole("button", { name: /Create/i });
    await user.click(createBtns[createBtns.length - 1]);
    await waitFor(() => {
      expect(mockCreateSchedule).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "role-schedule",
          target: expect.objectContaining({ roleArn: "arn:aws:iam::123:role/scheduler-role" }),
        }),
        expect.any(Object),
      );
    });
  });

  it("edit schedule modifies expression and description and submits", async () => {
    mockSchedules.mockReturnValue({
      data: {
        schedules: [{ Name: "edit-me", ScheduleExpression: "rate(1 hour)", State: "ENABLED", Description: "Test schedule", Target: { Arn: "arn:aws:lambda:us-east-1:123:function:my-fn" } }],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<SchedulerDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-group")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "my-group" }));
    await waitFor(() => expect(screen.getByText("edit-me")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Edit edit-me/i }));
    await waitFor(() => expect(screen.getByText(/Edit schedule: edit-me/)).toBeTruthy());
    // Target inputs by their pre-filled display values
    const exprInput = screen.getByDisplayValue("rate(1 hour)");
    await user.clear(exprInput);
    await user.type(exprInput, "cron(0 12 * * ? *)");
    const descInput = screen.getByDisplayValue("Test schedule");
    await user.clear(descInput);
    await user.type(descInput, "Updated description");
    await user.click(screen.getByRole("button", { name: /Save changes/i }));
    await waitFor(() => {
      expect(mockUpdateSchedule).toHaveBeenCalledWith(
        expect.objectContaining({
          scheduleExpression: "cron(0 12 * * ? *)",
          description: "Updated description",
        }),
        expect.any(Object),
      );
    });
  });
});
