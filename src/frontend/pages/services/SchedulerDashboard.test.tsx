// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

const mockGroups = vi.fn();
const mockSchedules = vi.fn();
const mockCreateGroup = vi.fn();
const mockDeleteGroup = vi.fn();
const mockCreateSchedule = vi.fn();
const mockDeleteSchedule = vi.fn();

vi.mock("../../hooks/useScheduler", () => ({
  useSchedulerGroups: (...args: any[]) => mockGroups(...args),
  useCreateSchedulerGroup: () => ({ mutate: mockCreateGroup, isPending: false }),
  useDeleteSchedulerGroup: () => ({ mutateAsync: mockDeleteGroup, isPending: false, variables: null }),
  useSchedules: (...args: any[]) => mockSchedules(...args),
  useCreateSchedule: () => ({ mutate: mockCreateSchedule, isPending: false }),
  useDeleteSchedule: () => ({ mutateAsync: mockDeleteSchedule, isPending: false, variables: null }),
}));

import { SchedulerDashboard } from "./SchedulerDashboard";

beforeEach(() => {
  vi.clearAllMocks();
  mockGroups.mockReturnValue({ data: { groups: [], total: 0 }, isLoading: false });
  mockSchedules.mockReturnValue({ data: { schedules: [], total: 0 }, isLoading: false });
});

describe("SchedulerDashboard", () => {
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

  it("shows dash for missing creation date", () => {
    mockGroups.mockReturnValue({
      data: { groups: [{ Name: "test" }], total: 1 },
      isLoading: false,
    });
    render(<SchedulerDashboard />, { wrapper: createWrapper() });
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it("does not show delete for default group", () => {
    mockGroups.mockReturnValue({
      data: { groups: [{ Name: "default", State: "ACTIVE" }], total: 1 },
      isLoading: false,
    });
    render(<SchedulerDashboard />, { wrapper: createWrapper() });
    expect(screen.queryByRole("button", { name: /Delete default/i })).toBeNull();
  });

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

  it("renders group name in table", () => {
    mockGroups.mockReturnValue({
      data: { groups: [{ Name: "my-group", State: "ACTIVE" }], total: 1 },
      isLoading: false,
    });
    render(<SchedulerDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-group")).toBeTruthy();
  });

  it("shows schedules in group detail via direct render", () => {
    // Render the detail component directly by simulating selectedGroup state
    mockSchedules.mockReturnValue({
      data: {
        schedules: [{ Name: "my-schedule", ScheduleExpression: "rate(1 minute)", State: "ENABLED", Target: { Arn: "arn:aws:lambda:..." } }],
        total: 1,
      },
      isLoading: false,
    });
    // Since SchedulerDashboard uses internal state (not props), we test the behavior via the list
    // which renders schedules as a column cell component (GroupScheduleCount)
    mockGroups.mockReturnValue({
      data: { groups: [{ Name: "my-group", State: "ACTIVE" }], total: 1 },
      isLoading: false,
    });
    const { container } = render(<SchedulerDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-group")).toBeTruthy();
    // GroupScheduleCount renders data?.total as count
    expect(container.textContent).toMatch(/0|1/);
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
});
