// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

const mockStateMachines = vi.fn();
const mockDeleteSm = vi.fn();
const mockExecutions = vi.fn();
const mockActivities = vi.fn();

vi.mock("../../hooks/useStepFunctions", () => ({
  useStateMachines: (...args: any[]) => mockStateMachines(...args),
  useDeleteStateMachine: () => ({ mutateAsync: mockDeleteSm, isPending: false, variables: null }),
  useStateMachineExecutions: (...args: any[]) => mockExecutions(...args),
  useActivities: (...args: any[]) => mockActivities(...args),
}));

import { StepFunctionsDashboard } from "./StepFunctionsDashboard";

beforeEach(() => {
  vi.clearAllMocks();
  mockStateMachines.mockReturnValue({ data: { stateMachines: [], total: 0 }, isLoading: false });
  mockExecutions.mockReturnValue({ data: { executions: [], total: 0 } });
  mockActivities.mockReturnValue({ data: { activities: [], total: 0 } });
});

describe("StepFunctionsDashboard", () => {
  it("shows loading skeleton", () => {
    mockStateMachines.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = render(<StepFunctionsDashboard />, { wrapper: createWrapper() });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("renders both tabs", () => {
    render(<StepFunctionsDashboard />, { wrapper: createWrapper() });
    expect(screen.getByRole("tab", { name: /state machines/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /Activities/i })).toBeTruthy();
  });

  it("shows empty message for state machines", () => {
    render(<StepFunctionsDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No state machines/i)).toBeTruthy();
  });

  it("renders state machines with data", () => {
    mockStateMachines.mockReturnValue({
      data: {
        stateMachines: [{
          stateMachineArn: "arn:aws:states:us-east-1:123:stateMachine:my-sm",
          name: "my-sm",
          type: "STANDARD",
          creationDate: "2024-01-15T00:00:00Z",
        }],
        total: 1,
      },
      isLoading: false,
    });
    render(<StepFunctionsDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-sm")).toBeTruthy();
    expect(screen.getByText("STANDARD")).toBeTruthy();
  });

  it("shows dash for missing creation date", () => {
    mockStateMachines.mockReturnValue({
      data: { stateMachines: [{ stateMachineArn: "arn:aws:states:...:stateMachine:test", name: "test", type: "STANDARD" }], total: 1 },
      isLoading: false,
    });
    render(<StepFunctionsDashboard />, { wrapper: createWrapper() });
    const dashes = screen.getAllByText("-");
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it("navigates to executions detail view", async () => {
    mockStateMachines.mockReturnValue({
      data: {
        stateMachines: [{ stateMachineArn: "arn:aws:states:...:stateMachine:click-sm", name: "click-sm", type: "EXPRESS", creationDate: "2024-01-15T00:00:00Z" }],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    const { container } = render(<StepFunctionsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("click-sm")).toBeTruthy());

    await user.click(screen.getByText("click-sm"));
    await waitFor(() => {
      expect(container.textContent).toMatch(/Executions/i);
      expect(screen.getByText(/Back to state machines/i)).toBeTruthy();
    });
  });

  it("shows executions in detail view", async () => {
    mockStateMachines.mockReturnValue({
      data: {
        stateMachines: [{ stateMachineArn: "arn:aws:states:...:stateMachine:sm1", name: "sm1", type: "STANDARD", creationDate: "2024-01-15T00:00:00Z" }],
        total: 1,
      },
      isLoading: false,
    });
    mockExecutions.mockReturnValue({
      data: {
        executions: [{ name: "exec-001", status: "SUCCEEDED", startDate: "2024-01-16T00:00:00Z", stopDate: "2024-01-16T01:00:00Z" }],
        total: 1,
      },
    });
    const user = userEvent.setup();
    render(<StepFunctionsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("sm1"));
    await user.click(screen.getByText("sm1"));
    await waitFor(() => expect(screen.getByText("exec-001")).toBeTruthy());
    expect(screen.getByText("SUCCEEDED")).toBeTruthy();
  });

  it("shows activities tab data", async () => {
    mockActivities.mockReturnValue({
      data: {
        activities: [{ activityArn: "arn:aws:states:...:activity:act-1", name: "my-activity", creationDate: "2024-01-15T00:00:00Z" }],
        total: 1,
      },
    });
    const user = userEvent.setup();
    render(<StepFunctionsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Activities/i }));
    await waitFor(() => expect(screen.getByText("my-activity")).toBeTruthy());
  });

  it("shows empty message for activities tab", async () => {
    const user = userEvent.setup();
    render(<StepFunctionsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Activities/i }));
    await waitFor(() => expect(screen.getByText(/No activities/i)).toBeTruthy());
  });

  it("deletes a state machine", async () => {
    mockStateMachines.mockReturnValue({
      data: {
        stateMachines: [{ stateMachineArn: "arn:aws:states:...:stateMachine:delete-me", name: "delete-me", type: "STANDARD", creationDate: "2024-01-15T00:00:00Z" }],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<StepFunctionsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("delete-me")).toBeTruthy());

    const deleteBtn = screen.getByRole("button", { name: /Delete delete-me/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => {
      expect(mockDeleteSm).toHaveBeenCalledWith("arn:aws:states:...:stateMachine:delete-me");
    });
  });

  it("filters state machines by name", async () => {
    mockStateMachines.mockReturnValue({
      data: {
        stateMachines: [
          { stateMachineArn: "arn1", name: "alpha", type: "STANDARD", creationDate: "2024-01-15T00:00:00Z" },
          { stateMachineArn: "arn2", name: "beta", type: "EXPRESS", creationDate: "2024-01-16T00:00:00Z" },
        ],
        total: 2,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<StepFunctionsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("alpha")).toBeTruthy());

    const filterInput = screen.getByPlaceholderText("Find state machines");
    await user.type(filterInput, "beta");
    await waitFor(() => expect(screen.queryByText("alpha")).toBeNull());
  });
});
