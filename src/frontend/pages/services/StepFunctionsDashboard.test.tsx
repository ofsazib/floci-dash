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
const mockStartExecution = vi.fn().mockResolvedValue({});
const mockStopExecution = vi.fn().mockResolvedValue({});
const mockVersions = vi.fn();
const mockPublishVersion = vi.fn();
const mockDeleteVersion = vi.fn();

vi.mock("../../hooks/useStepFunctions", () => ({
  useStateMachines: (...args: any[]) => mockStateMachines(...args),
  useDeleteStateMachine: () => ({ mutateAsync: mockDeleteSm, isPending: false, variables: null }),
  useStateMachineExecutions: (...args: any[]) => mockExecutions(...args),
  useActivities: (...args: any[]) => mockActivities(...args),
  useStateMachineVersions: (...args: any[]) => mockVersions(...args),
  usePublishStateMachineVersion: () => ({ mutate: mockPublishVersion, mutateAsync: mockPublishVersion, isPending: false, isError: false, error: null, reset: vi.fn() }),
  useDeleteStateMachineVersion: () => ({ mutate: mockDeleteVersion, mutateAsync: mockDeleteVersion, isPending: false, isError: false, error: null, reset: vi.fn() }),
  useStartExecution: () => ({ mutate: vi.fn(), mutateAsync: mockStartExecution, isPending: false, variables: null, isError: false, error: null, reset: vi.fn() }),
  useStopExecution: () => ({ mutate: vi.fn(), mutateAsync: mockStopExecution, isPending: false, variables: null, isError: false, error: null, reset: vi.fn() }),
}));

import { StepFunctionsDashboard } from "./StepFunctionsDashboard";

beforeEach(() => {
  vi.clearAllMocks();
  mockStateMachines.mockReturnValue({ data: { stateMachines: [], total: 0 }, isLoading: false });
  mockExecutions.mockReturnValue({ data: { executions: [], total: 0 } });
  mockActivities.mockReturnValue({ data: { activities: [], total: 0 } });
  mockVersions.mockReturnValue({ data: { versions: [], total: 0 }, isLoading: false, isError: false, error: null });
  mockPublishVersion.mockResolvedValue({});
  mockDeleteVersion.mockResolvedValue({});
});

// ── Helper: select state machine from Cloudscape Select dropdown ──
async function selectVersionSM(user: ReturnType<typeof userEvent.setup>, smName: string) {
  const trigger = screen.getByRole("button", { name: /Choose a state machine/ });
  await user.click(trigger);
  await user.click(screen.getByRole("option", { name: smName }));
}

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

// ── Execution controls ────────────────────────────────

  const SM_ARN = "arn:aws:states:us-east-1:123:stateMachine:my-sm";

  async function openExecutions(user: ReturnType<typeof userEvent.setup>) {
    mockStateMachines.mockReturnValue({
      data: { stateMachines: [{ stateMachineArn: SM_ARN, name: "my-sm", type: "STANDARD", creationDate: "2024-01-15T00:00:00Z" }], total: 1 },
      isLoading: false,
    });
    render(<StepFunctionsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-sm")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "my-sm" }));
    await waitFor(() => expect(screen.getByText("Executions")).toBeTruthy());
  }

  it("starts an execution from the modal", async () => {
    const user = userEvent.setup();
    await openExecutions(user);

    await user.click(screen.getByRole("button", { name: /Start execution/i }));
    await waitFor(() => expect(screen.getByText(/JSON input/i)).toBeTruthy());
    await clickButton(user, /^Start$/i);
    await waitFor(() =>
      expect(mockStartExecution).toHaveBeenCalledWith(
        expect.objectContaining({ arn: SM_ARN, input: "{}" })
      )
    );
  });

  it("stops a running execution", async () => {
    mockExecutions.mockReturnValue({
      data: {
        executions: [{ executionArn: SM_ARN + ":exec", name: "run-1", status: "RUNNING", startDate: 1 }],
        total: 1,
      },
    });
    const user = userEvent.setup();
    await openExecutions(user);
    await waitFor(() => expect(screen.getByText("run-1")).toBeTruthy());

    await user.click(screen.getByRole("button", { name: /Stop/i }));
    await waitFor(() =>
      expect(mockStopExecution).toHaveBeenCalledWith(
        expect.objectContaining({ executionArn: SM_ARN + ":exec", stateMachineArn: SM_ARN })
      )
    );
  });

  it("does not show a Stop button for succeeded executions", async () => {
    mockExecutions.mockReturnValue({
      data: {
        executions: [{ executionArn: SM_ARN + ":exec", name: "done-1", status: "SUCCEEDED", startDate: 1, stopDate: 2 }],
        total: 1,
      },
    });
    const user = userEvent.setup();
    await openExecutions(user);
    await waitFor(() => expect(screen.getByText("done-1")).toBeTruthy());
    expect(screen.queryByRole("button", { name: /Stop/i })).toBeNull();
  });
});

describe("StepFunctionsDashboard — versions tab", () => {
  const SM_ARN = "arn:aws:states:us-east-1:123:stateMachine:my-sm";

  function setupStateMachines() {
    mockStateMachines.mockReturnValue({
      data: {
        stateMachines: [{ stateMachineArn: SM_ARN, name: "my-sm", type: "STANDARD", creationDate: "2024-01-15T00:00:00Z" }],
        total: 1,
      },
      isLoading: false,
    });
  }

  it("shows empty message on versions tab (no SM selected)", async () => {
    const user = userEvent.setup();
    render(<StepFunctionsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Versions/i }));
    await waitFor(() => {
      expect(screen.getByText(/Select a state machine to view versions/i)).toBeTruthy();
    });
  });

  it("shows publish button disabled when no SM selected", async () => {
    const user = userEvent.setup();
    render(<StepFunctionsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Versions/i }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Publish Version/i })).toBeTruthy();
    });
    const publishBtn = screen.getByRole("button", { name: /Publish Version/i });
    expect(publishBtn.getAttribute("disabled")).not.toBeNull();
  });

  it("shows empty versions message when SM selected but no versions", async () => {
    setupStateMachines();
    const user = userEvent.setup();
    render(<StepFunctionsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Versions/i }));
    await waitFor(() => {
      expect(screen.getByText("State Machine Versions")).toBeTruthy();
    });
    // Select a state machine via Cloudscape Select dropdown
    await selectVersionSM(user, "my-sm");
    await waitFor(() => {
      expect(screen.getByText(/No versions published yet/i)).toBeTruthy();
    });
  });

  it("shows versions with data and deletes one", async () => {
    setupStateMachines();
    mockVersions.mockReturnValue({
      data: {
        versions: [{ stateMachineVersionArn: SM_ARN + ":1" }],
        total: 1,
      },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<StepFunctionsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Versions/i }));
    await waitFor(() => {
      expect(screen.getByText("State Machine Versions")).toBeTruthy();
    });
    // Select a state machine via Cloudscape Select dropdown
    await selectVersionSM(user, "my-sm");
    await waitFor(() => {
      expect(screen.getByText(SM_ARN + ":1")).toBeTruthy();
      expect(screen.getByText("1")).toBeTruthy();
    });
    const deleteBtn = screen.getByRole("button", { name: /Delete 1/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => {
      expect(mockDeleteVersion).toHaveBeenCalledWith(
        expect.objectContaining({ arn: SM_ARN, versionArn: SM_ARN + ":1" })
      );
    });
  });
});
