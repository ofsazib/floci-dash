// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

const deleteSmState = vi.hoisted(() => ({ isPending: false, variables: null as string | null }));
const stopState = vi.hoisted(() => ({ isPending: false, variables: null as any | null }));
const deleteVersionState = vi.hoisted(() => ({ isPending: false, variables: null as any | null }));
const deleteActState = vi.hoisted(() => ({ isPending: false, variables: null as string | null }));

const mockStateMachines = vi.fn();
const mockDeleteSm = vi.fn();
const mockExecutions = vi.fn();
const mockActivities = vi.fn();
const mockStartExecution = vi.fn().mockResolvedValue({});
const mockStopExecution = vi.fn().mockResolvedValue({});
const mockVersions = vi.fn();
const mockPublishVersion = vi.fn();
const mockDeleteVersion = vi.fn();
const mockCreateActivity = vi.fn().mockResolvedValue({});
const mockDeleteActivity = vi.fn().mockResolvedValue({});
const mockGetActivityTask = vi.fn().mockResolvedValue({ task: null });
const mockSendTaskSuccess = vi.fn().mockResolvedValue({});
const mockSendTaskFailure = vi.fn().mockResolvedValue({});
const mockSendTaskHeartbeat = vi.fn().mockResolvedValue({});
const mockStartSyncExecution = vi.fn().mockResolvedValue({ execution: null });
const mockValidateDefinition = vi.fn().mockResolvedValue({ valid: true, errors: [] });
const mockStateMachineTags = vi.fn();
const mockTagStateMachine = vi.fn().mockResolvedValue({});
const mockUntagStateMachine = vi.fn().mockResolvedValue({});

vi.mock("../../hooks/useStepFunctions", () => ({
  useStateMachines: (...args: any[]) => mockStateMachines(...args),
  useDeleteStateMachine: () => ({
    mutateAsync: mockDeleteSm,
    get isPending() { return deleteSmState.isPending; },
    get variables() { return deleteSmState.variables; },
  }),
  useStateMachineExecutions: (...args: any[]) => mockExecutions(...args),
  useActivities: (...args: any[]) => mockActivities(...args),
  useStateMachineVersions: (...args: any[]) => mockVersions(...args),
  usePublishStateMachineVersion: () => ({ mutate: mockPublishVersion, mutateAsync: mockPublishVersion, isPending: false, isError: false, error: null, reset: vi.fn() }),
  useDeleteStateMachineVersion: () => ({
    mutate: mockDeleteVersion,
    mutateAsync: mockDeleteVersion,
    get isPending() { return deleteVersionState.isPending; },
    get variables() { return deleteVersionState.variables; },
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useStartExecution: () => ({ mutate: vi.fn(), mutateAsync: mockStartExecution, isPending: false, variables: null, isError: false, error: null, reset: vi.fn() }),
  useCreateActivity: () => ({ mutate: vi.fn(), mutateAsync: mockCreateActivity, isPending: false, variables: null, isError: false, error: null, reset: vi.fn() }),
  useDeleteActivity: () => ({
    mutate: vi.fn(),
    mutateAsync: mockDeleteActivity,
    get isPending() { return deleteActState.isPending; },
    get variables() { return deleteActState.variables; },
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useGetActivityTask: () => ({ mutate: vi.fn(), mutateAsync: mockGetActivityTask, isPending: false, variables: null, isError: false, error: null, reset: vi.fn() }),
  useSendTaskSuccess: () => ({ mutate: vi.fn(), mutateAsync: mockSendTaskSuccess, isPending: false, variables: null, isError: false, error: null, reset: vi.fn() }),
  useSendTaskFailure: () => ({ mutate: vi.fn(), mutateAsync: mockSendTaskFailure, isPending: false, variables: null, isError: false, error: null, reset: vi.fn() }),
  useSendTaskHeartbeat: () => ({ mutate: vi.fn(), mutateAsync: mockSendTaskHeartbeat, isPending: false, variables: null, isError: false, error: null, reset: vi.fn() }),
  useStartSyncExecution: () => ({ mutate: vi.fn(), mutateAsync: mockStartSyncExecution, isPending: false, variables: null, isError: false, error: null, reset: vi.fn() }),
  useValidateStateMachineDefinition: () => ({ mutate: vi.fn(), mutateAsync: mockValidateDefinition, isPending: false, variables: null, isError: false, error: null, reset: vi.fn() }),
  useStateMachineTags: (...args: any[]) => mockStateMachineTags(...args),
  useTagStateMachine: () => ({ mutate: vi.fn(), mutateAsync: mockTagStateMachine, isPending: false, variables: null, isError: false, error: null, reset: vi.fn() }),
  useUntagStateMachine: () => ({ mutate: vi.fn(), mutateAsync: mockUntagStateMachine, isPending: false, variables: null, isError: false, error: null, reset: vi.fn() }),
  useStopExecution: () => ({
    mutate: vi.fn(),
    mutateAsync: mockStopExecution,
    get isPending() { return stopState.isPending; },
    get variables() { return stopState.variables; },
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
}));

import { StepFunctionsDashboard } from "./StepFunctionsDashboard";

beforeEach(() => {
  vi.clearAllMocks();
  deleteSmState.isPending = false;
  deleteSmState.variables = null;
  stopState.isPending = false;
  stopState.variables = null;
  deleteVersionState.isPending = false;
  deleteVersionState.variables = null;
  deleteActState.isPending = false;
  deleteActState.variables = null;
  mockStateMachines.mockReturnValue({ data: { stateMachines: [], total: 0 }, isLoading: false });
  mockExecutions.mockReturnValue({ data: { executions: [], total: 0 } });
  mockActivities.mockReturnValue({ data: { activities: [], total: 0 } });
  mockVersions.mockReturnValue({ data: { versions: [], total: 0 }, isLoading: false, isError: false, error: null });
  mockPublishVersion.mockResolvedValue({});
  mockDeleteVersion.mockResolvedValue({});
  mockStateMachineTags.mockReturnValue({ data: [] });
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

  it("shows empty activities when activities data is undefined", async () => {
    mockActivities.mockReturnValue({ data: undefined });
    const user = userEvent.setup();
    render(<StepFunctionsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Activities/i }));
    await waitFor(() => expect(screen.getByText(/No activities/i)).toBeTruthy());
  });

  it("shows dash for activity missing creation date", async () => {
    mockActivities.mockReturnValue({
      data: { activities: [{ activityArn: "arn:act:1", name: "nodate-act" }], total: 1 },
    });
    const user = userEvent.setup();
    render(<StepFunctionsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Activities/i }));
    await waitFor(() => expect(screen.getByText("nodate-act")).toBeTruthy());
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(1);
  });

  it("filters activities by name", async () => {
    mockActivities.mockReturnValue({
      data: {
        activities: [
          { activityArn: "arn:act:a", name: "alpha-act", creationDate: "2024-01-15T00:00:00Z" },
          { activityArn: "arn:act:b", name: "beta-act", creationDate: "2024-01-16T00:00:00Z" },
        ],
        total: 2,
      },
    });
    const user = userEvent.setup();
    render(<StepFunctionsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Activities/i }));
    await waitFor(() => expect(screen.getByText("alpha-act")).toBeTruthy());
    const filterInput = screen.getByPlaceholderText("Find activities");
    await user.type(filterInput, "beta");
    await waitFor(() => expect(screen.queryByText("alpha-act")).toBeNull());
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

  it("shows empty message when state machines data is undefined", () => {
    mockStateMachines.mockReturnValue({ data: undefined, isLoading: false });
    render(<StepFunctionsDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No state machines/i)).toBeTruthy();
  });

  it("defaults missing state machine type to STANDARD", () => {
    mockStateMachines.mockReturnValue({
      data: { stateMachines: [{ stateMachineArn: "arn:no-type", name: "notype-sm", creationDate: "2024-01-15T00:00:00Z" }], total: 1 },
      isLoading: false,
    });
    render(<StepFunctionsDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("notype-sm")).toBeTruthy();
    expect(screen.getByText("STANDARD")).toBeTruthy();
  });

  it("shows delete state machine loading state", () => {
    const SM_ARN_LOAD = "arn:aws:states:us-east-1:123:stateMachine:loading-sm";
    deleteSmState.isPending = true;
    deleteSmState.variables = SM_ARN_LOAD;
    mockStateMachines.mockReturnValue({
      data: { stateMachines: [{ stateMachineArn: SM_ARN_LOAD, name: "loading-sm", type: "STANDARD" }], total: 1 },
      isLoading: false,
    });
    render(<StepFunctionsDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("loading-sm")).toBeTruthy();
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

  it("returns to the state machines list from the back button", async () => {
    const user = userEvent.setup();
    await openExecutions(user);
    await clickButton(user, /Back to state machines/i);
    await waitFor(() => expect(screen.getByText("my-sm")).toBeTruthy());
  });

  it("shows dashes for executions missing start and stop dates", async () => {
    mockExecutions.mockReturnValue({
      data: { executions: [{ executionArn: SM_ARN + ":exec", name: "nodates-1", status: "RUNNING" }], total: 1 },
    });
    const user = userEvent.setup();
    await openExecutions(user);
    await waitFor(() => expect(screen.getByText("nodates-1")).toBeTruthy());
    const dashes = screen.getAllByText("-");
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  it("shows empty executions when executions data is undefined", async () => {
    mockExecutions.mockReturnValue({ data: undefined });
    const user = userEvent.setup();
    await openExecutions(user);
    await waitFor(() => expect(screen.getByText(/No executions/i)).toBeTruthy());
  });

  it("starts execution with empty name and empty input", async () => {
    const user = userEvent.setup();
    await openExecutions(user);
    await user.click(screen.getByRole("button", { name: /Start execution/i }));
    await waitFor(() => expect(screen.getByText(/JSON input/i)).toBeTruthy());
    const textarea = screen.getAllByRole("textbox").find((el) => el.tagName === "TEXTAREA");
    expect(textarea).toBeTruthy();
    await user.clear(textarea as HTMLElement);
    await clickButton(user, /^Start$/i);
    await waitFor(() =>
      expect(mockStartExecution).toHaveBeenCalledWith(
        expect.objectContaining({ arn: SM_ARN, name: undefined, input: undefined })
      )
    );
  });

  it("types a name and custom input before starting", async () => {
    const user = userEvent.setup();
    await openExecutions(user);
    await user.click(screen.getByRole("button", { name: /Start execution/i }));
    await waitFor(() => expect(screen.getByText(/JSON input/i)).toBeTruthy());
    await user.type(screen.getByPlaceholderText("my-execution"), "exec-1");
    const textarea = screen.getAllByRole("textbox").find((el) => el.tagName === "TEXTAREA");
    await user.clear(textarea as HTMLElement);
    await user.type(textarea as HTMLElement, "custom-input");
    await clickButton(user, /^Start$/i);
    await waitFor(() =>
      expect(mockStartExecution).toHaveBeenCalledWith(
        expect.objectContaining({ arn: SM_ARN, name: "exec-1", input: "custom-input" })
      )
    );
  });

  it("shows error alert when start execution rejects with a message", async () => {
    mockStartExecution.mockRejectedValueOnce(new Error("Start failed"));
    const user = userEvent.setup();
    await openExecutions(user);
    await user.click(screen.getByRole("button", { name: /Start execution/i }));
    await waitFor(() => expect(screen.getByText(/JSON input/i)).toBeTruthy());
    await clickButton(user, /^Start$/i);
    await waitFor(() => expect(screen.getByText("Start failed")).toBeTruthy());
  });

  it("shows generic error when start execution rejects without a message", async () => {
    mockStartExecution.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    await openExecutions(user);
    await user.click(screen.getByRole("button", { name: /Start execution/i }));
    await waitFor(() => expect(screen.getByText(/JSON input/i)).toBeTruthy());
    await clickButton(user, /^Start$/i);
    await waitFor(() => expect(screen.getByText("Failed to start execution")).toBeTruthy());
  });

  it("cancels the start execution modal via the close button and Cancel", async () => {
    const user = userEvent.setup();
    await openExecutions(user);
    // Close via the dialog's dismiss button → onDismiss
    await user.click(screen.getByRole("button", { name: /Start execution/i }));
    await waitFor(() => expect(screen.getByText(/JSON input/i)).toBeTruthy());
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getAllByRole("button")[0]);
    await waitFor(() => expect(document.body.className).not.toContain("modal-open"));

    // Reopen and close via Cancel
    await user.click(screen.getByRole("button", { name: /Start execution/i }));
    await waitFor(() => expect(screen.getByText(/JSON input/i)).toBeTruthy());
    await clickButton(user, /^Cancel$/i);
    await waitFor(() => expect(document.body.className).not.toContain("modal-open"));
  });

  it("filters executions by name", async () => {
    mockExecutions.mockReturnValue({
      data: {
        executions: [
          { executionArn: SM_ARN + ":a", name: "alpha-exec", status: "SUCCEEDED", startDate: 1, stopDate: 2 },
          { executionArn: SM_ARN + ":b", name: "beta-exec", status: "SUCCEEDED", startDate: 1, stopDate: 2 },
        ],
        total: 2,
      },
    });
    const user = userEvent.setup();
    await openExecutions(user);
    await waitFor(() => expect(screen.getByText("alpha-exec")).toBeTruthy());
    const filterInput = screen.getByPlaceholderText("Find executions");
    await user.type(filterInput, "beta");
    await waitFor(() => expect(screen.queryByText("alpha-exec")).toBeNull());
  });

  it("shows stop button loading state for the matching execution", async () => {
    stopState.isPending = true;
    stopState.variables = { executionArn: SM_ARN + ":exec", stateMachineArn: SM_ARN };
    mockExecutions.mockReturnValue({
      data: { executions: [{ executionArn: SM_ARN + ":exec", name: "run-1", status: "RUNNING", startDate: 1 }], total: 1 },
    });
    const user = userEvent.setup();
    await openExecutions(user);
    await waitFor(() => expect(screen.getByText("run-1")).toBeTruthy());
    expect(screen.getByRole("button", { name: /Stop/i })).toBeTruthy();
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

  it("shows versions tab empty when no state machines exist", async () => {
    mockStateMachines.mockReturnValue({ data: undefined, isLoading: false });
    const user = userEvent.setup();
    render(<StepFunctionsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Versions/i }));
    await waitFor(() => {
      expect(screen.getByText(/Select a state machine to view versions/i)).toBeTruthy();
      expect(screen.getByRole("button", { name: /Choose a state machine/i })).toBeTruthy();
    });
  });

  it("publishes a version for the selected state machine", async () => {
    setupStateMachines();
    const user = userEvent.setup();
    render(<StepFunctionsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Versions/i }));
    await waitFor(() => expect(screen.getByText("State Machine Versions")).toBeTruthy());
    await selectVersionSM(user, "my-sm");
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Publish Version/i }).getAttribute("disabled")).toBeNull();
    });
    await clickButton(user, /Publish Version/i);
    await waitFor(() => expect(mockPublishVersion).toHaveBeenCalledWith(SM_ARN));
  });

  it("shows no versions message when versions data is undefined", async () => {
    setupStateMachines();
    mockVersions.mockReturnValue({ data: undefined, isLoading: false, isError: false, error: null });
    const user = userEvent.setup();
    render(<StepFunctionsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Versions/i }));
    await waitFor(() => expect(screen.getByText("State Machine Versions")).toBeTruthy());
    await selectVersionSM(user, "my-sm");
    await waitFor(() => expect(screen.getByText(/No versions published yet/i)).toBeTruthy());
  });

  it("shows dash revision and formatted date for a version without ARN", async () => {
    setupStateMachines();
    mockVersions.mockReturnValue({
      data: {
        versions: [{ creationDate: "2024-01-15T00:00:00Z" }],
        total: 1,
      },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<StepFunctionsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Versions/i }));
    await waitFor(() => expect(screen.getByText("State Machine Versions")).toBeTruthy());
    await selectVersionSM(user, "my-sm");
    await waitFor(() => {
      expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/2024/)).toBeTruthy();
    });
  });

  it("shows delete version loading state", async () => {
    setupStateMachines();
    deleteVersionState.isPending = true;
    deleteVersionState.variables = { arn: SM_ARN, versionArn: SM_ARN + ":1" };
    mockVersions.mockReturnValue({
      data: { versions: [{ stateMachineVersionArn: SM_ARN + ":1" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<StepFunctionsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Versions/i }));
    await waitFor(() => expect(screen.getByText("State Machine Versions")).toBeTruthy());
    await selectVersionSM(user, "my-sm");
    await waitFor(() => expect(screen.getByText(SM_ARN + ":1")).toBeTruthy());
  });

  it("filters versions by ARN", async () => {
    setupStateMachines();
    mockVersions.mockReturnValue({
      data: {
        versions: [
          { stateMachineVersionArn: SM_ARN + ":1" },
          { stateMachineVersionArn: SM_ARN + ":2" },
        ],
        total: 2,
      },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<StepFunctionsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Versions/i }));
    await waitFor(() => expect(screen.getByText("State Machine Versions")).toBeTruthy());
    await selectVersionSM(user, "my-sm");
    await waitFor(() => expect(screen.getByText(SM_ARN + ":1")).toBeTruthy());
    const filterInput = screen.getByPlaceholderText("Find versions");
    await user.type(filterInput, SM_ARN + ":2");
    await waitFor(() => expect(screen.queryByText(SM_ARN + ":1")).toBeNull());
  });
});

/** True when every dialog containing the given text has a hidden class. */
function modalHidden(text: string): boolean {
  const headers = screen.queryAllByText(text).filter((h) => h.closest('[role="dialog"]'));
  if (headers.length === 0) return true; // unmounted entirely
  return headers.every((h) => h.closest('[role="dialog"]')!.className.includes("hidden"));
}

/** Click a button inside the visible dialog whose header contains the given text. */
async function clickDialogButton(user: ReturnType<typeof userEvent.setup>, headerText: string | RegExp, name: RegExp | string) {
  const header = screen
    .getAllByText(headerText)
    .find((h) => {
      const d = h.closest('[role="dialog"]');
      return d && !d.className.includes("hidden");
    });
  const dialog = header!.closest('[role="dialog"]') as HTMLElement;
  await user.click(within(dialog).getByRole("button", { name }));
}

describe("StepFunctionsDashboard — G.84 activities, task callbacks, sync runs, validation, tags", () => {
  const SM = { stateMachineArn: "arn:aws:states:us-east-1:123:stateMachine:my-sm", name: "my-sm", type: "STANDARD", creationDate: "2024-01-15T00:00:00Z" };
  const ACT = { activityArn: "arn:aws:states:us-east-1:123:activity:act-1", name: "act-1", creationDate: "2024-01-15T00:00:00Z" };

  async function openActivities(user: ReturnType<typeof userEvent.setup>) {
    render(<StepFunctionsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Activities/i }));
    await waitFor(() => expect(screen.getByText("act-1")).toBeTruthy());
  }

  it("creates an activity via the modal", async () => {
    mockActivities.mockReturnValue({ data: { activities: [ACT], total: 1 } });
    const user = userEvent.setup();
    render(<StepFunctionsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Activities/i }));
    await waitFor(() => expect(screen.getByText("act-1")).toBeTruthy());
    await clickButton(user, /Create activity/i);
    await waitFor(() => expect(screen.getAllByText("Create activity").length).toBeGreaterThanOrEqual(2));
    // Create stays disabled without a name
    expect(screen.getByRole("button", { name: /Create$/i }).hasAttribute("disabled")).toBe(true);
    await user.type(screen.getByPlaceholderText("my-activity"), "act-2");
    await clickButton(user, /Create$/i);
    await waitFor(() => expect(mockCreateActivity).toHaveBeenCalledWith("act-2"));
    await waitFor(() => expect(modalHidden("Create activity")).toBe(true));
  });

  it("creates an activity with a trimmed name", async () => {
    mockActivities.mockReturnValue({ data: { activities: [ACT], total: 1 } });
    const user = userEvent.setup();
    render(<StepFunctionsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Activities/i }));
    await waitFor(() => expect(screen.getByText("act-1")).toBeTruthy());
    await clickButton(user, /Create activity/i);
    await waitFor(() => expect(screen.getAllByText("Create activity").length).toBeGreaterThanOrEqual(2));
    await user.type(screen.getByPlaceholderText("my-activity"), "  padded  ");
    await clickButton(user, /Create$/i);
    await waitFor(() => expect(mockCreateActivity).toHaveBeenCalledWith("padded"));
    await waitFor(() => expect(modalHidden("Create activity")).toBe(true));
  });

  it("shows create-activity error and cancels", async () => {
    mockActivities.mockReturnValue({ data: { activities: [ACT], total: 1 } });
    mockCreateActivity.mockRejectedValueOnce(new Error("boom"));
    const user = userEvent.setup();
    render(<StepFunctionsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Activities/i }));
    await waitFor(() => expect(screen.getByText("act-1")).toBeTruthy());
    await clickButton(user, /Create activity/i);
    await waitFor(() => expect(screen.getAllByText("Create activity").length).toBeGreaterThanOrEqual(2));
    await user.type(screen.getByPlaceholderText("my-activity"), "act-2");
    await clickButton(user, /Create$/i);
    await waitFor(() => expect(screen.getByText("boom")).toBeTruthy());
    await clickButton(user, /Cancel/i);
    await waitFor(() => expect(modalHidden("Create activity")).toBe(true));
  });

  it("deletes an activity", async () => {
    mockActivities.mockReturnValue({ data: { activities: [ACT], total: 1 } });
    const user = userEvent.setup();
    render(<StepFunctionsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Activities/i }));
    await waitFor(() => expect(screen.getByText("act-1")).toBeTruthy());
    // DeleteButton opens a confirm dialog with a Delete confirm button
    const deleteBtn = screen.getAllByRole("button", { name: /Delete/i })[0];
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getAllByRole("button", { name: /Delete/i }).length).toBeGreaterThan(1));
    const confirms = screen.getAllByRole("button", { name: /Delete/i });
    await user.click(confirms[confirms.length - 1]);
    await waitFor(() =>
      expect(mockDeleteActivity).toHaveBeenCalledWith("arn:aws:states:us-east-1:123:activity:act-1")
    );
  });

  it("polls for a task and sends success", async () => {
    mockActivities.mockReturnValue({ data: { activities: [ACT], total: 1 } });
    mockGetActivityTask.mockResolvedValue({ task: { taskToken: "tok-1", input: '{"x":1}' } });
    const user = userEvent.setup();
    await openActivities(user);
    await clickButton(user, /Task callbacks/i);
    await waitFor(() => expect(screen.getByText(/Task callbacks:/)).toBeTruthy());
    expect(screen.getByText(/No task fetched yet/)).toBeTruthy();
    await user.type(screen.getByPlaceholderText("Worker name"), "w1");
    await clickButton(user, /Poll for task/i);
    await waitFor(() =>
      expect(mockGetActivityTask).toHaveBeenCalledWith({
        arn: "arn:aws:states:us-east-1:123:activity:act-1",
        workerName: "w1",
      })
    );
    await waitFor(() => expect(screen.getByText("tok-1")).toBeTruthy());
    await clickButton(user, /Send success/i);
    await waitFor(() =>
      expect(mockSendTaskSuccess).toHaveBeenCalledWith({
        arn: "arn:aws:states:us-east-1:123:activity:act-1",
        taskToken: "tok-1",
        output: "{}",
      })
    );
  });

  it("polls with no task available and sends failure + heartbeat", async () => {
    mockActivities.mockReturnValue({ data: { activities: [ACT], total: 1 } });
    mockGetActivityTask.mockResolvedValue({ task: { taskToken: "tok-2", input: "{}" } });
    const user = userEvent.setup();
    await openActivities(user);
    await clickButton(user, /Task callbacks/i);
    await waitFor(() => expect(screen.getByText(/Task callbacks:/)).toBeTruthy());
    await user.type(screen.getByPlaceholderText("Worker name"), "w2");
    await clickButton(user, /Poll for task/i);
    await waitFor(() => expect(screen.getByText("tok-2")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("Error name"), "TaskFailed");
    await user.type(screen.getByPlaceholderText("Cause"), "bad input");
    await clickButton(user, /Send failure/i);
    await waitFor(() =>
      expect(mockSendTaskFailure).toHaveBeenCalledWith({
        arn: "arn:aws:states:us-east-1:123:activity:act-1",
        taskToken: "tok-2",
        error: "TaskFailed",
        cause: "bad input",
      })
    );
    // reopen and heartbeat
    await clickButton(user, /Task callbacks/i);
    await waitFor(() => expect(screen.getByText(/Task callbacks:/)).toBeTruthy());
    await user.type(screen.getByPlaceholderText("Worker name"), "w3");
    await clickButton(user, /Poll for task/i);
    await waitFor(() => expect(screen.getByText("tok-2")).toBeTruthy());
    await clickButton(user, /Heartbeat/i);
    await waitFor(() =>
      expect(mockSendTaskHeartbeat).toHaveBeenCalledWith({
        arn: "arn:aws:states:us-east-1:123:activity:act-1",
        taskToken: "tok-2",
      })
    );
    await clickButton(user, /Close/i);
  });

  it("shows task-callback errors and the sparse no-task state", async () => {
    mockActivities.mockReturnValue({ data: { activities: [ACT], total: 1 } });
    mockGetActivityTask.mockRejectedValueOnce(new Error("no work"));
    const user = userEvent.setup();
    await openActivities(user);
    await clickButton(user, /Task callbacks/i);
    await waitFor(() => expect(screen.getByText(/Task callbacks:/)).toBeTruthy());
    await user.type(screen.getByPlaceholderText("Worker name"), "w1");
    await clickButton(user, /Poll for task/i);
    await waitFor(() => expect(screen.getByText("no work")).toBeTruthy());
    // sparse: no task token → task: null → stays in the no-task state
    mockGetActivityTask.mockResolvedValue({});
    await clickButton(user, /Poll for task/i);
    await waitFor(() => expect(screen.getByText(/No task fetched yet/)).toBeTruthy());
    await clickButton(user, /Close/i);
  });

  it("manages state machine tags — add, remove, empty, close", async () => {
    mockStateMachines.mockReturnValue({ data: { stateMachines: [SM], total: 1 }, isLoading: false });
    mockStateMachineTags.mockReturnValue({ data: [{ key: "env", value: "prod" }] });
    const user = userEvent.setup();
    render(<StepFunctionsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-sm")).toBeTruthy());
    await clickButton(user, /^Tags$/i);
    await waitFor(() => expect(screen.getByText(/Tags for state machine/)).toBeTruthy());
    const tagsDialog = screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden")) as HTMLElement;
    expect(within(tagsDialog).getByText("env:")).toBeTruthy();
    await user.click(within(tagsDialog).getByRole("button", { name: /Remove/i }));
    await waitFor(() => expect(mockUntagStateMachine).toHaveBeenCalledWith(["env"]));
    await user.type(within(tagsDialog).getByPlaceholderText("Key"), "team");
    await user.type(within(tagsDialog).getByPlaceholderText("Value"), "core");
    await user.click(within(tagsDialog).getByRole("button", { name: /Add tag/i }));
    await waitFor(() =>
      expect(mockTagStateMachine).toHaveBeenCalledWith([{ key: "team", value: "core" }])
    );
    await user.click(within(tagsDialog).getByRole("button", { name: /Close/i }));
  });

  it("shows the no-tags state and keeps Add tag disabled without a key", async () => {
    mockStateMachines.mockReturnValue({ data: { stateMachines: [SM], total: 1 }, isLoading: false });
    mockStateMachineTags.mockReturnValue({ data: [] });
    const user = userEvent.setup();
    render(<StepFunctionsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-sm")).toBeTruthy());
    await clickButton(user, /^Tags$/i);
    await waitFor(() => expect(screen.getByText("No tags found.")).toBeTruthy());
    const tagsDialog = screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden")) as HTMLElement;
    expect(within(tagsDialog).getByRole("button", { name: /Add tag/i }).hasAttribute("disabled")).toBe(true);
    await user.type(within(tagsDialog).getByPlaceholderText("Key"), "k");
    await user.type(within(tagsDialog).getByPlaceholderText("Value"), "v");
    await user.click(within(tagsDialog).getByRole("button", { name: /Add tag/i }));
    await waitFor(() => expect(mockTagStateMachine).toHaveBeenCalledWith([{ key: "k", value: "v" }]));
  });

  it("runs a sync execution and shows the result", async () => {
    mockStateMachines.mockReturnValue({ data: { stateMachines: [SM], total: 1 }, isLoading: false });
    mockStartSyncExecution.mockResolvedValue({
      execution: { executionArn: "arn:exec:1", status: "SUCCEEDED" },
    });
    const user = userEvent.setup();
    render(<StepFunctionsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-sm")).toBeTruthy());
    await clickButton(user, /Sync run/i);
    await waitFor(() => expect(screen.getByText(/Sync run:/)).toBeTruthy());
    await user.type(screen.getByPlaceholderText("my-sync-run"), "run-1");
    await clickButton(user, /Run$/i, { last: true });
    await waitFor(() =>
      expect(mockStartSyncExecution).toHaveBeenCalledWith({
        arn: "arn:aws:states:us-east-1:123:stateMachine:my-sm",
        name: "run-1",
        input: "{}",
      })
    );
    await waitFor(() => expect(screen.getByText(/SUCCEEDED/)).toBeTruthy());
    await clickButton(user, /Cancel/i);
  });

  it("shows sync-run error and sparse result", async () => {
    mockStateMachines.mockReturnValue({ data: { stateMachines: [SM], total: 1 }, isLoading: false });
    mockStartSyncExecution.mockRejectedValueOnce(new Error("sync boom"));
    const user = userEvent.setup();
    render(<StepFunctionsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-sm")).toBeTruthy());
    await clickButton(user, /Sync run/i);
    await waitFor(() => expect(screen.getByText(/Sync run:/)).toBeTruthy());
    await clickButton(user, /Run$/i, { last: true });
    await waitFor(() => expect(screen.getByText("sync boom")).toBeTruthy());
    // sparse execution → no success alert, error cleared on retry
    mockStartSyncExecution.mockResolvedValue({});
    await clickButton(user, /Run$/i, { last: true });
    await waitFor(() => expect(screen.queryByText("sync boom")).toBeNull());
  });

  it("validates a definition — valid, invalid with diagnostics, error, cancel", async () => {
    mockStateMachines.mockReturnValue({ data: { stateMachines: [SM], total: 1 }, isLoading: false });
    const user = userEvent.setup();
    render(<StepFunctionsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-sm")).toBeTruthy());
    await clickButton(user, /Validate definition/i);
    await waitFor(() => expect(screen.getByText("Validate state machine definition")).toBeTruthy());
    // disabled without definition
    expect(screen.getByRole("button", { name: /Validate$/i }).hasAttribute("disabled")).toBe(true);
    fireEvent.change(screen.getByLabelText(/Definition/), { target: { value: "{}" } });
    await clickButton(user, /Validate$/i);
    await waitFor(() => expect(mockValidateDefinition).toHaveBeenCalledWith({ definition: "{}" }));
    await waitFor(() => expect(screen.getByText("Definition is valid.")).toBeTruthy());
    // invalid with diagnostics
    mockValidateDefinition.mockResolvedValueOnce({
      valid: false,
      errors: [{ code: "NO_START_STATE", message: "missing start" }],
    });
    await clickButton(user, /Validate$/i);
    await waitFor(() => expect(screen.getByText(/NO_START_STATE missing start/)).toBeTruthy());
    // invalid without diagnostics
    mockValidateDefinition.mockResolvedValueOnce({ valid: false, errors: [] });
    await clickButton(user, /Validate$/i);
    await waitFor(() => expect(screen.getByText("Definition is invalid.")).toBeTruthy());
    // error
    mockValidateDefinition.mockRejectedValueOnce(new Error("validate boom"));
    await clickButton(user, /Validate$/i);
    await waitFor(() => expect(screen.getByText("validate boom")).toBeTruthy());
    await clickDialogButton(user, "Validate state machine definition", /Close/i);
    await waitFor(() => expect(modalHidden("Validate state machine definition")).toBe(true));
  });

  it("shows message-less fallback errors across the new modals", async () => {
    mockActivities.mockReturnValue({ data: { activities: [ACT], total: 1 } });
    mockStateMachines.mockReturnValue({ data: { stateMachines: [SM], total: 1 }, isLoading: false });
    mockCreateActivity.mockRejectedValueOnce({});
    mockGetActivityTask.mockRejectedValueOnce({});
    mockSendTaskSuccess.mockRejectedValueOnce({});
    mockSendTaskFailure.mockRejectedValueOnce({});
    mockSendTaskHeartbeat.mockRejectedValueOnce({});
    mockStartSyncExecution.mockRejectedValueOnce({});
    mockValidateDefinition.mockRejectedValueOnce({});
    const user = userEvent.setup();
    // create fallback
    render(<StepFunctionsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Activities/i }));
    await waitFor(() => expect(screen.getByText("act-1")).toBeTruthy());
    await clickButton(user, /Create activity/i);
    await waitFor(() => expect(screen.getAllByText("Create activity").length).toBeGreaterThanOrEqual(2));
    await user.type(screen.getByPlaceholderText("my-activity"), "a1");
    await clickButton(user, /Create$/i);
    await waitFor(() => expect(screen.getByText("Failed to create activity")).toBeTruthy());
    await clickButton(user, /Cancel/i);
    await waitFor(() => expect(modalHidden("Create activity")).toBe(true));
    // task-callback fallbacks
    await clickButton(user, /Task callbacks/i);
    await waitFor(() => expect(screen.getByText(/Task callbacks:/)).toBeTruthy());
    await user.type(screen.getByPlaceholderText("Worker name"), "w1");
    await clickButton(user, /Poll for task/i);
    await waitFor(() => expect(screen.getByText("Failed to get activity task")).toBeTruthy());
    // poll succeeds with a sparse task
    mockGetActivityTask.mockResolvedValue({ task: {} });
    await clickButton(user, /Poll for task/i);
    await waitFor(() => expect(screen.getByText("—")).toBeTruthy());
    // send success failure
    await clickButton(user, /Send success/i);
    await waitFor(() => expect(screen.getByText("Failed to send task success")).toBeTruthy());
    // send failure failure
    await clickButton(user, /Send failure/i);
    await waitFor(() => expect(screen.getByText("Failed to send task failure")).toBeTruthy());
    // heartbeat failure
    await clickButton(user, /Heartbeat/i);
    await waitFor(() => expect(screen.getByText("Failed to send heartbeat")).toBeTruthy());
    await clickButton(user, /Close/i);
    // sync-run + validate fallbacks on the state machines tab
    await user.click(screen.getByRole("tab", { name: /State Machines/i }));
    await waitFor(() => expect(screen.getByText("my-sm")).toBeTruthy());
    await clickButton(user, /Sync run/i);
    await waitFor(() => expect(screen.getByText(/Sync run:/)).toBeTruthy());
    await clickButton(user, /Run$/i, { last: true });
    await waitFor(() => expect(screen.getByText("Failed to run sync execution")).toBeTruthy());
    await clickDialogButton(user, /Sync run:/, /Cancel/i);
    await waitFor(() => expect(modalHidden("Sync run: arn:aws:states:us-east-1:123:stateMachine:my-sm")).toBe(true));
    await clickButton(user, /Validate definition/i);
    await waitFor(() => expect(screen.getByText("Validate state machine definition")).toBeTruthy());
    fireEvent.change(screen.getByLabelText(/Definition/), { target: { value: "{}" } });
    await clickButton(user, /Validate$/i);
    await waitFor(() => expect(screen.getByText("Failed to validate definition")).toBeTruthy());
  });

  it("sends failure with empty optional fields and types output before success", async () => {
    mockActivities.mockReturnValue({ data: { activities: [ACT], total: 1 } });
    mockGetActivityTask.mockResolvedValue({ task: { taskToken: "tok-3", input: "{}" } });
    mockSendTaskSuccess.mockResolvedValue({});
    const user = userEvent.setup();
    await openActivities(user);
    await clickButton(user, /Task callbacks/i);
    await waitFor(() => expect(screen.getByText(/Task callbacks:/)).toBeTruthy());
    await user.type(screen.getByPlaceholderText("Worker name"), "w1");
    await clickButton(user, /Poll for task/i);
    await waitFor(() => expect(screen.getByText("tok-3")).toBeTruthy());
    // type a custom output, then clear it back to {} default is covered elsewhere; type non-empty
    const outputInput = screen.getByPlaceholderText('{"result": "ok"}');
    await user.type(outputInput, "x");
    await clickButton(user, /Send success/i);
    await waitFor(() =>
      expect(mockSendTaskSuccess).toHaveBeenCalledWith({
        arn: "arn:aws:states:us-east-1:123:activity:act-1",
        taskToken: "tok-3",
        output: "{}x",
      })
    );
    // reopen, poll, send failure with empty error/cause → undefined
    mockGetActivityTask.mockResolvedValue({ task: { taskToken: "tok-4", input: "{}" } });
    await clickButton(user, /Task callbacks/i);
    await waitFor(() => expect(screen.getByText(/Task callbacks:/)).toBeTruthy());
    await user.type(screen.getByPlaceholderText("Worker name"), "w2");
    await clickButton(user, /Poll for task/i);
    await waitFor(() => expect(screen.getByText("tok-4")).toBeTruthy());
    await clickButton(user, /Send failure/i);
    await waitFor(() =>
      expect(mockSendTaskFailure).toHaveBeenCalledWith({
        arn: "arn:aws:states:us-east-1:123:activity:act-1",
        taskToken: "tok-4",
        error: undefined,
        cause: undefined,
      })
    );
  });

  it("dismisses every new modal with Escape and shows the activity delete loading state", async () => {
    mockActivities.mockReturnValue({ data: { activities: [ACT], total: 1 } });
    mockStateMachines.mockReturnValue({ data: { stateMachines: [SM], total: 1 }, isLoading: false });
    deleteActState.isPending = true;
    deleteActState.variables = ACT.activityArn;
    const user = userEvent.setup();
    render(<StepFunctionsDashboard />, { wrapper: createWrapper() });
    // activity delete loading state renders
    await user.click(screen.getByRole("tab", { name: /Activities/i }));
    await waitFor(() => expect(screen.getByText("act-1")).toBeTruthy());
    // Escape-dismiss the create modal
    await clickButton(user, /Create activity/i);
    await waitFor(() => expect(screen.getAllByText("Create activity").length).toBeGreaterThanOrEqual(2));
    dismissWithEscape();
    await waitFor(() => expect(modalHidden("Create activity")).toBe(true));
    // Escape-dismiss the task-callbacks modal
    await clickButton(user, /Task callbacks/i);
    await waitFor(() => expect(screen.getByText(/Task callbacks:/)).toBeTruthy());
    dismissWithEscape();
    await waitFor(() => expect(modalHidden("Task callbacks: " + ACT.activityArn)).toBe(true));
    // Escape-dismiss the validate modal
    await user.click(screen.getByRole("tab", { name: /State Machines/i }));
    await waitFor(() => expect(screen.getByText("my-sm")).toBeTruthy());
    await clickButton(user, /Validate definition/i);
    await waitFor(() => expect(screen.getByText("Validate state machine definition")).toBeTruthy());
    dismissWithEscape();
    await waitFor(() => expect(modalHidden("Validate state machine definition")).toBe(true));
    // Escape-dismiss the sync modal (from the row button)
    await clickButton(user, /Sync run/i);
    await waitFor(() => expect(screen.getByText(/Sync run:/)).toBeTruthy());
    dismissWithEscape();
    await waitFor(() => expect(modalHidden("Sync run: " + SM.stateMachineArn)).toBe(true));
    // Escape-dismiss the tags modal and show the sparse no-tags state
    mockStateMachineTags.mockReturnValue({ data: undefined });
    await clickButton(user, /^Tags$/i);
    await waitFor(() => expect(screen.getByText("No tags found.")).toBeTruthy());
    dismissWithEscape();
    await waitFor(() => expect(modalHidden("Tags for state machine")).toBe(true));
  });

  it("sync run omits empty input and shows dashes for a sparse execution", async () => {
    mockStateMachines.mockReturnValue({ data: { stateMachines: [SM], total: 1 }, isLoading: false });
    mockStartSyncExecution.mockResolvedValue({ execution: {} });
    const user = userEvent.setup();
    render(<StepFunctionsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-sm")).toBeTruthy());
    await clickButton(user, /Sync run/i);
    await waitFor(() => expect(screen.getByText(/Sync run:/)).toBeTruthy());
    await user.type(screen.getByPlaceholderText("my-sync-run"), "only-name");
    const inputArea = screen.getByLabelText(/Input/);
    await user.clear(inputArea);
    await clickButton(user, /Run$/i, { last: true });
    await waitFor(() =>
      expect(mockStartSyncExecution).toHaveBeenCalledWith({
        arn: SM.stateMachineArn,
        name: "only-name",
        input: undefined,
      })
    );
    await waitFor(() =>
      expect(document.querySelectorAll('[class*="awsui_alert"]').length).toBeGreaterThanOrEqual(1)
    );
    expect(
      Array.from(document.querySelectorAll('[class*="awsui_alert"]')).some((a) =>
        a.textContent?.includes("Execution ARN: —")
      )
    ).toBe(true);
  });

  it("validate diagnostics without code or message render as blank pieces", async () => {
    mockStateMachines.mockReturnValue({ data: { stateMachines: [SM], total: 1 }, isLoading: false });
    const user = userEvent.setup();
    render(<StepFunctionsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-sm")).toBeTruthy());
    await clickButton(user, /Validate definition/i);
    await waitFor(() => expect(screen.getByText("Validate state machine definition")).toBeTruthy());
    fireEvent.change(screen.getByLabelText(/Definition/), { target: { value: "{}" } });
    mockValidateDefinition.mockResolvedValueOnce({ valid: false, errors: [{ message: "only message" }] });
    await clickButton(user, /Validate$/i);
    await waitFor(() => expect(screen.getByText(/only message/)).toBeTruthy());
    mockValidateDefinition.mockResolvedValueOnce({ valid: false, errors: [{ code: "ONLY_CODE" }] });
    await clickButton(user, /Validate$/i);
    await waitFor(() => expect(screen.getByText("ONLY_CODE")).toBeTruthy());
    // result without an errors key falls back to the invalid message
    mockValidateDefinition.mockResolvedValueOnce({ valid: false });
    await clickButton(user, /Validate$/i);
    await waitFor(() => expect(screen.getByText("Definition is invalid.")).toBeTruthy());
  });
});

/** Fire Escape on every Cloudscape dialog (dismisses whichever is open). */
function dismissWithEscape() {
  document.querySelectorAll('[class*="awsui_dialog"]').forEach((dialog) => {
    fireEvent.keyDown(dialog as HTMLElement, { keyCode: 27 });
  });
}
