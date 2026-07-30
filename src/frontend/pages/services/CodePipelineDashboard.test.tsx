// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

// ─── Mock hooks ─────────────────────────────────────────

const mockPipelines = vi.fn();
const mockCreatePipeline = vi.fn();
const mockDeletePipeline = vi.fn();
const mockPipelineState = vi.fn();
const mockPipelineExecutions = vi.fn();
const mockStartExecution = vi.fn();
const mockStopExecution = vi.fn();
const mockRetryStage = vi.fn();
const mockWebhooks = vi.fn();
const mockCreateWebhook = vi.fn();
const mockDeleteWebhook = vi.fn();
const mockActionTypes = vi.fn();
const mockCreateActionType = vi.fn();

// Hoisted state for mutations that need dynamic behavior in tests
const hoisted = vi.hoisted(() => ({
  rollbackMutate: vi.fn(),
  rollbackMutateAsync: vi.fn().mockResolvedValue({}),
  rollbackIsPending: false,
  rollbackIsError: false,
  rollbackError: null as Error | null,
  overrideMutate: vi.fn(),
  overrideMutateAsync: vi.fn().mockResolvedValue({}),
  overrideIsPending: false,
  overrideIsError: false,
  overrideError: null as Error | null,
  registerMutateAsync: vi.fn().mockResolvedValue({}),
  registerIsPending: false,
  registerVariables: null as string | null,
  deregisterMutateAsync: vi.fn().mockResolvedValue({}),
  deregisterIsPending: false,
  deregisterVariables: null as string | null,
  pollMutateAsync: vi.fn().mockResolvedValue({ jobs: [] }),
  pollIsPending: false,
  deleteActionTypeMutate: vi.fn(),
  deleteActionTypeMutateAsync: vi.fn().mockResolvedValue({}),
  deleteActionTypeIsPending: false,
  deleteActionTypeVariables: null as any,
  jobDetailsData: null as any,
  jobDetailsIsLoading: false,
  jobDetailsIsError: false,
  jobDetailsError: null as Error | null,
  ruleExecutionsData: { ruleExecutionDetails: [] as any[], total: 0 },
  ruleExecutionsIsLoading: false,
}));

vi.mock("../../hooks/useCodePipeline", () => ({
  usePipelines: (...args: any[]) => mockPipelines(...args),
  useCreatePipeline: () => ({
    mutate: mockCreatePipeline,
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useDeletePipeline: () => ({
    mutateAsync: mockDeletePipeline,
    isPending: false,
    variables: null,
  }),
  usePipelineState: (...args: any[]) => mockPipelineState(...args),
  usePipelineExecutions: (...args: any[]) => mockPipelineExecutions(...args),
  useStartPipelineExecution: () => ({
    mutate: mockStartExecution,
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useStopPipelineExecution: () => ({
    mutate: mockStopExecution,
    isPending: false,
  }),
  useRetryStageExecution: () => ({
    mutate: mockRetryStage,
    isPending: false,
  }),
  useWebhooks: (...args: any[]) => mockWebhooks(...args),
  useCreateWebhook: () => ({
    mutate: mockCreateWebhook,
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useDeleteWebhook: () => ({
    mutateAsync: mockDeleteWebhook,
    isPending: false,
    variables: null,
  }),
  useActionTypes: (...args: any[]) => mockActionTypes(...args),
  useCreateCustomActionType: () => ({
    mutate: mockCreateActionType,
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useDeleteCustomActionType: () => ({
    mutate: hoisted.deleteActionTypeMutate,
    mutateAsync: hoisted.deleteActionTypeMutateAsync,
    get isPending() { return hoisted.deleteActionTypeIsPending; },
    get variables() { return hoisted.deleteActionTypeVariables; },
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useRollbackStage: () => ({
    mutate: hoisted.rollbackMutate,
    mutateAsync: hoisted.rollbackMutateAsync,
    get isPending() { return hoisted.rollbackIsPending; },
    get isError() { return hoisted.rollbackIsError; },
    get error() { return hoisted.rollbackError; },
    reset: vi.fn(),
  }),
  useOverrideStageCondition: () => ({
    mutate: hoisted.overrideMutate,
    mutateAsync: hoisted.overrideMutateAsync,
    get isPending() { return hoisted.overrideIsPending; },
    get isError() { return hoisted.overrideIsError; },
    get error() { return hoisted.overrideError; },
    reset: vi.fn(),
  }),
  useRuleExecutions: () => ({
    get data() { return hoisted.ruleExecutionsData; },
    get isLoading() { return hoisted.ruleExecutionsIsLoading; },
    isError: false,
    error: null,
  }),
  useRegisterWebhook: () => ({
    mutateAsync: hoisted.registerMutateAsync,
    get isPending() { return hoisted.registerIsPending; },
    get variables() { return hoisted.registerVariables; },
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useDeregisterWebhook: () => ({
    mutateAsync: hoisted.deregisterMutateAsync,
    get isPending() { return hoisted.deregisterIsPending; },
    get variables() { return hoisted.deregisterVariables; },
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  usePollForJobs: () => ({
    mutateAsync: hoisted.pollMutateAsync,
    get isPending() { return hoisted.pollIsPending; },
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useJobDetails: () => ({
    get data() { return hoisted.jobDetailsData; },
    get isLoading() { return hoisted.jobDetailsIsLoading; },
    get isError() { return hoisted.jobDetailsIsError; },
    get error() { return hoisted.jobDetailsError; },
  }),
}));

import { CodePipelineDashboard } from "./CodePipelineDashboard";

// ─── Setup ──────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();

  // Reset hoisted state
  hoisted.rollbackIsPending = false;
  hoisted.rollbackIsError = false;
  hoisted.rollbackError = null;
  hoisted.overrideIsPending = false;
  hoisted.overrideIsError = false;
  hoisted.overrideError = null;
  hoisted.registerIsPending = false;
  hoisted.registerVariables = null;
  hoisted.deregisterIsPending = false;
  hoisted.deregisterVariables = null;
  hoisted.pollIsPending = false;
  hoisted.deleteActionTypeIsPending = false;
  hoisted.deleteActionTypeVariables = null;
  hoisted.jobDetailsData = { jobDetails: null };
  hoisted.jobDetailsIsLoading = false;
  hoisted.jobDetailsIsError = false;
  hoisted.jobDetailsError = null;
  hoisted.ruleExecutionsData = { ruleExecutionDetails: [], total: 0 };
  hoisted.ruleExecutionsIsLoading = false;

  mockPipelines.mockReturnValue({
    data: { pipelines: [], total: 0 },
    isLoading: false,
  });
  mockPipelineState.mockReturnValue({ data: undefined, isLoading: false });
  mockPipelineExecutions.mockReturnValue({ data: { executions: [], total: 0 }, isLoading: false });
  mockWebhooks.mockReturnValue({ data: { webhooks: [], total: 0 }, isLoading: false });
  mockActionTypes.mockReturnValue({ data: { actionTypes: [], total: 0 }, isLoading: false });
});

// ─── Tests ──────────────────────────────────────────────

describe("CodePipelineDashboard — pipelines tab", () => {
  it("shows loading skeleton", () => {
    mockPipelines.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = render(<CodePipelineDashboard />, { wrapper: createWrapper() });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("shows empty state", () => {
    render(<CodePipelineDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("No pipelines found")).toBeTruthy();
  });

  it("renders pipelines with data", () => {
    mockPipelines.mockReturnValue({
      data: {
        pipelines: [{ name: "my-pipe", version: 1, created: "2024-01-01T00:00:00Z", updated: "2024-01-02T00:00:00Z" }],
        total: 1,
      },
      isLoading: false,
    });
    render(<CodePipelineDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-pipe")).toBeTruthy();
    expect(screen.getAllByText("1").length).toBeGreaterThan(0);
  });

  it("opens create pipeline modal and submits", async () => {
    const user = userEvent.setup();
    render(<CodePipelineDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create pipeline")).toBeTruthy());
    const input = screen.getByPlaceholderText("my-pipeline");
    await user.type(input, "new-pipe");
    await clickButton(user, /Create/i, { last: true });
    expect(mockCreatePipeline).toHaveBeenCalledWith(
      expect.objectContaining({
        pipeline: expect.objectContaining({ name: "new-pipe" }),
      }),
      expect.any(Object),
    );
  });

  it("deletes a pipeline", async () => {
    const user = userEvent.setup();
    mockPipelines.mockReturnValue({
      data: { pipelines: [{ name: "my-pipe", version: 1 }], total: 1 },
      isLoading: false,
    });
    render(<CodePipelineDashboard />, { wrapper: createWrapper() });
    const deleteBtn = screen.getByRole("button", { name: /Delete my-pipe/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeletePipeline).toHaveBeenCalledWith("my-pipe"));
  });
});

describe("CodePipelineDashboard — pipeline detail and executions", () => {
  it("shows pipeline detail when selected", async () => {
    const user = userEvent.setup();
    mockPipelines.mockReturnValue({
      data: { pipelines: [{ name: "my-pipe", version: 1 }], total: 1 },
      isLoading: false,
    });
    mockPipelineState.mockReturnValue({
      data: { state: { pipelineVersion: 1, stageStates: [] } },
      isLoading: false,
    });
    render(<CodePipelineDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /my-pipe/i);
    await waitFor(() => expect(screen.getByText(/Pipeline: my-pipe/)).toBeTruthy());
    expect(screen.getByText("Start Execution")).toBeTruthy();
  });

  it("opens start execution modal", async () => {
    const user = userEvent.setup();
    mockPipelines.mockReturnValue({
      data: { pipelines: [{ name: "my-pipe", version: 1 }], total: 1 },
      isLoading: false,
    });
    mockPipelineState.mockReturnValue({
      data: { state: { pipelineVersion: 1, stageStates: [] } },
      isLoading: false,
    });
    render(<CodePipelineDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /my-pipe/i);
    await waitFor(() => expect(screen.getByText(/Pipeline: my-pipe/)).toBeTruthy());
    await clickButton(user, /Start Execution/i);
    await waitFor(() => expect(screen.getByText(/Start execution: my-pipe/)).toBeTruthy());
    await clickButton(user, /Start/i, { last: true });
    expect(mockStartExecution).toHaveBeenCalledWith(
      { name: "my-pipe" },
      expect.any(Object),
    );
  });
});

describe("CodePipelineDashboard — webhooks tab", () => {
  it("switches to webhooks tab and shows empty state", async () => {
    const user = userEvent.setup();
    render(<CodePipelineDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /webhooks/i }));
    await waitFor(() => expect(screen.getByText("No webhooks found")).toBeTruthy());
  });

  it("renders webhooks with data and deletes one", async () => {
    const user = userEvent.setup();
    mockWebhooks.mockReturnValue({
      data: {
        webhooks: [{ definition: { name: "my-hook", targetPipeline: "my-pipe", targetAction: "Source" }, url: "https://example.com/hook" }],
        total: 1,
      },
      isLoading: false,
    });
    render(<CodePipelineDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /webhooks/i }));
    await waitFor(() => expect(screen.getByText("my-hook")).toBeTruthy());
    const deleteBtn = screen.getByRole("button", { name: /Delete my-hook/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteWebhook).toHaveBeenCalledWith("my-hook"));
  });
});

describe("CodePipelineDashboard — action types tab", () => {
  it("switches to action types tab and shows empty state", async () => {
    const user = userEvent.setup();
    render(<CodePipelineDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /action types/i }));
    await waitFor(() => expect(screen.getByText("No action types found")).toBeTruthy());
  });

  it("renders action types with data", async () => {
    const user = userEvent.setup();
    mockActionTypes.mockReturnValue({
      data: {
        actionTypes: [{ id: { category: "Build", owner: "AWS", provider: "CodeBuild", version: "1" } }],
        total: 1,
      },
      isLoading: false,
    });
    render(<CodePipelineDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /action types/i }));
    await waitFor(() => {
      expect(screen.getByText("CodeBuild")).toBeTruthy();
      expect(screen.getAllByText("Build").length).toBeGreaterThan(0);
    });
  });

  it("opens create action type modal", async () => {
    const user = userEvent.setup();
    render(<CodePipelineDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /action types/i }));
    await waitFor(() => expect(screen.getByText("No action types found")).toBeTruthy());
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create custom action type")).toBeTruthy());
    const input = screen.getByPlaceholderText("MyCustomProvider");
    await user.type(input, "MyProvider");
    await clickButton(user, /Create/i, { last: true });
    expect(mockCreateActionType).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: expect.objectContaining({ provider: "MyProvider" }),
      }),
      expect.any(Object),
    );
  });
});

describe("CodePipelineDashboard — cancel and error paths for create modals", () => {
  it("cancels create pipeline modal", async () => {
    const user = userEvent.setup();
    render(<CodePipelineDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create pipeline")).toBeTruthy());
    await clickButton(user, /Cancel/i);
    await waitFor(() => expect(screen.getByText("No pipelines found")).toBeTruthy());
  });

  it("cancels create webhook modal", async () => {
    const user = userEvent.setup();
    render(<CodePipelineDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /webhooks/i }));
    await waitFor(() => expect(screen.getByText("No webhooks found")).toBeTruthy());
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create webhook")).toBeTruthy());
    await clickButton(user, /Cancel/i);
    await waitFor(() => expect(screen.getByText("No webhooks found")).toBeTruthy());
  });

  it("cancels create action type modal", async () => {
    const user = userEvent.setup();
    render(<CodePipelineDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /action types/i }));
    await waitFor(() => expect(screen.getByText("No action types found")).toBeTruthy());
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create custom action type")).toBeTruthy());
    await clickButton(user, /Cancel/i);
    await waitFor(() => expect(screen.getByText("No action types found")).toBeTruthy());
  });

  it("disables create pipeline button when name is empty", async () => {
    const user = userEvent.setup();
    render(<CodePipelineDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create pipeline")).toBeTruthy());
    const createBtns = screen.getAllByRole("button", { name: /Create/i });
    const submitBtn = createBtns[createBtns.length - 1];
    expect(submitBtn).toBeDisabled();
  });

  it("disables create webhook button when name is empty", async () => {
    const user = userEvent.setup();
    render(<CodePipelineDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /webhooks/i }));
    await waitFor(() => expect(screen.getByText("No webhooks found")).toBeTruthy());
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create webhook")).toBeTruthy());
    const createBtns = screen.getAllByRole("button", { name: /Create/i });
    const submitBtn = createBtns[createBtns.length - 1];
    expect(submitBtn).toBeDisabled();
  });

  it("disables create action type button when provider is empty", async () => {
    const user = userEvent.setup();
    render(<CodePipelineDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /action types/i }));
    await waitFor(() => expect(screen.getByText("No action types found")).toBeTruthy());
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create custom action type")).toBeTruthy());
    const createBtns = screen.getAllByRole("button", { name: /Create/i });
    const submitBtn = createBtns[createBtns.length - 1];
    expect(submitBtn).toBeDisabled();
  });
});

describe("CodePipelineDashboard — pipeline detail with stage states and executions", () => {
  it("shows stage states with Succeeded and Failed statuses", async () => {
    const user = userEvent.setup();
    mockPipelines.mockReturnValue({
      data: { pipelines: [{ name: "my-pipe", version: 1 }], total: 1 },
      isLoading: false,
    });
    mockPipelineState.mockReturnValue({
      data: {
        state: {
          pipelineVersion: 2,
          stageStates: [
            {
              stageName: "Source",
              actionStates: [{ latestExecution: { status: "Succeeded" } }],
              inboundTransitionState: { enabled: true },
            },
            {
              stageName: "Deploy",
              actionStates: [{ latestExecution: { status: "Failed" } }],
              inboundTransitionState: { enabled: false },
            },
          ],
        },
      },
      isLoading: false,
    });
    mockPipelineExecutions.mockReturnValue({
      data: { executions: [], total: 0 },
      isLoading: false,
    });
    render(<CodePipelineDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /my-pipe/i);
    await waitFor(() => expect(screen.getByText(/Pipeline: my-pipe/)).toBeTruthy());
    // Stage states rendered
    expect(screen.getByText("Source")).toBeTruthy();
    expect(screen.getByText("Deploy")).toBeTruthy();
    // The Deploy stage has inboundTransitionState.enabled false → shows Disabled badge
    expect(screen.getByText("Disabled")).toBeTruthy();
    // Pipeline version
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
  });

  it("shows executions with InProgress and Failed status actions", async () => {
    const user = userEvent.setup();
    mockPipelines.mockReturnValue({
      data: { pipelines: [{ name: "my-pipe", version: 1 }], total: 1 },
      isLoading: false,
    });
    mockPipelineState.mockReturnValue({
      data: { state: { pipelineVersion: 1, stageStates: [{ stageName: "Source", actionStates: [{ latestExecution: { status: "Succeeded" } }], inboundTransitionState: { enabled: true } }] } },
      isLoading: false,
    });
    mockPipelineExecutions.mockReturnValue({
      data: {
        executions: [
          { pipelineExecutionId: "exec-1", status: "InProgress", startTime: "2024-01-01T00:00:00Z", lastUpdateTime: "2024-01-02T00:00:00Z" },
          { pipelineExecutionId: "exec-2", status: "Failed", startTime: "2024-01-01T00:00:00Z", lastUpdateTime: "2024-01-02T00:00:00Z" },
          { pipelineExecutionId: "exec-3", status: "Succeeded", startTime: "2024-01-01T00:00:00Z", lastUpdateTime: "2024-01-02T00:00:00Z" },
        ],
        total: 3,
      },
      isLoading: false,
    });
    render(<CodePipelineDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /my-pipe/i);
    await waitFor(() => expect(screen.getByText(/Pipeline: my-pipe/)).toBeTruthy());
    // Check executions rendered
    expect(screen.getByText("exec-1")).toBeTruthy();
    expect(screen.getByText("exec-2")).toBeTruthy();
    expect(screen.getByText("exec-3")).toBeTruthy();
    // Status indicators
    expect(screen.getByText("InProgress")).toBeTruthy();
    expect(screen.getByText("Failed")).toBeTruthy();
    expect(screen.getByText("Succeeded")).toBeTruthy();
    // Stop execution button for InProgress
    const stopBtn = screen.getAllByRole("button", { name: /Stop execution/i });
    expect(stopBtn.length).toBe(1);
    await user.click(stopBtn[0]);
    expect(mockStopExecution).toHaveBeenCalledWith({ name: "my-pipe", executionId: "exec-1" });
    // Retry stage button for Failed
    const retryBtn = screen.getAllByRole("button", { name: /Retry stage/i });
    expect(retryBtn.length).toBe(1);
    await user.click(retryBtn[0]);
    expect(mockRetryStage).toHaveBeenCalledWith({ name: "my-pipe", executionId: "exec-2" });
  });

  it("shows no Stop/Retry buttons for Succeeded executions", async () => {
    const user = userEvent.setup();
    mockPipelines.mockReturnValue({
      data: { pipelines: [{ name: "my-pipe", version: 1 }], total: 1 },
      isLoading: false,
    });
    mockPipelineState.mockReturnValue({
      data: { state: { pipelineVersion: 1, stageStates: [] } },
      isLoading: false,
    });
    mockPipelineExecutions.mockReturnValue({
      data: {
        executions: [{ pipelineExecutionId: "exec-s", status: "Succeeded", startTime: "2024-01-01T00:00:00Z", lastUpdateTime: "2024-01-02T00:00:00Z" }],
        total: 1,
      },
      isLoading: false,
    });
    render(<CodePipelineDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /my-pipe/i);
    await waitFor(() => expect(screen.getByText(/Pipeline: my-pipe/)).toBeTruthy());
    // No stop or retry buttons for Succeeded
    expect(screen.queryByRole("button", { name: /Stop execution/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /Retry stage/i })).toBeNull();
  });

  it("shows state loading indicator", async () => {
    const user = userEvent.setup();
    mockPipelines.mockReturnValue({
      data: { pipelines: [{ name: "my-pipe", version: 1 }], total: 1 },
      isLoading: false,
    });
    mockPipelineState.mockReturnValue({ data: undefined, isLoading: true });
    render(<CodePipelineDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /my-pipe/i);
    await waitFor(() => expect(screen.getByText(/Pipeline: my-pipe/)).toBeTruthy());
    // When state is loading, the component shows StatusIndicator type="loading" instead of "0 stages"
    expect(screen.getByText("State")).toBeTruthy();
  });

  it("shows executions empty state", async () => {
    const user = userEvent.setup();
    mockPipelines.mockReturnValue({
      data: { pipelines: [{ name: "my-pipe", version: 1 }], total: 1 },
      isLoading: false,
    });
    mockPipelineState.mockReturnValue({
      data: { state: { pipelineVersion: 1, stageStates: [] } },
      isLoading: false,
    });
    render(<CodePipelineDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /my-pipe/i);
    await waitFor(() => expect(screen.getByText(/Pipeline: my-pipe/)).toBeTruthy());
    expect(screen.getByText("No executions yet")).toBeTruthy();
  });

  it("deselects pipeline when clicked again", async () => {
    const user = userEvent.setup();
    mockPipelines.mockReturnValue({
      data: { pipelines: [{ name: "my-pipe", version: 1 }], total: 1 },
      isLoading: false,
    });
    render(<CodePipelineDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /my-pipe/i);
    await waitFor(() => expect(screen.getByText(/Pipeline: my-pipe/)).toBeTruthy());
    await clickButton(user, /my-pipe/i);
    await waitFor(() => expect(screen.queryByText(/Pipeline: my-pipe/)).toBeNull());
  });
});

describe("CodePipelineDashboard — filters for all tabs", () => {
  it("filters pipelines by name", async () => {
    const user = userEvent.setup();
    mockPipelines.mockReturnValue({
      data: { pipelines: [{ name: "alpha-pipe", version: 1 }, { name: "beta-pipe", version: 1 }], total: 2 },
      isLoading: false,
    });
    render(<CodePipelineDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("alpha-pipe")).toBeTruthy();
    expect(screen.getByText("beta-pipe")).toBeTruthy();
    const filterInput = screen.getByPlaceholderText("Find pipelines by name");
    await user.type(filterInput, "alpha");
    await waitFor(() => expect(screen.queryByText("beta-pipe")).toBeNull());
  });

  it("filters executions by ID", async () => {
    const user = userEvent.setup();
    mockPipelines.mockReturnValue({
      data: { pipelines: [{ name: "my-pipe", version: 1 }], total: 1 },
      isLoading: false,
    });
    mockPipelineState.mockReturnValue({
      data: { state: { pipelineVersion: 1, stageStates: [] } },
      isLoading: false,
    });
    mockPipelineExecutions.mockReturnValue({
      data: {
        executions: [
          { pipelineExecutionId: "exec-alpha", status: "Succeeded", startTime: "2024-01-01T00:00:00Z", lastUpdateTime: "2024-01-02T00:00:00Z" },
          { pipelineExecutionId: "exec-beta", status: "Succeeded", startTime: "2024-01-01T00:00:00Z", lastUpdateTime: "2024-01-02T00:00:00Z" },
        ],
        total: 2,
      },
      isLoading: false,
    });
    render(<CodePipelineDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /my-pipe/i);
    await waitFor(() => expect(screen.getByText(/Pipeline: my-pipe/)).toBeTruthy());
    expect(screen.getByText("exec-alpha")).toBeTruthy();
    const filterInput = screen.getByPlaceholderText("Find by execution ID");
    await user.type(filterInput, "beta");
    await waitFor(() => expect(screen.queryByText("exec-alpha")).toBeNull());
  });

  it("filters webhooks by name", async () => {
    const user = userEvent.setup();
    mockWebhooks.mockReturnValue({
      data: {
        webhooks: [
          { definition: { name: "alpha-webhook", targetPipeline: "p1", targetAction: "Source" }, url: "url1" },
          { definition: { name: "beta-webhook", targetPipeline: "p2", targetAction: "Build" }, url: "url2" },
        ],
        total: 2,
      },
      isLoading: false,
    });
    render(<CodePipelineDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /webhooks/i }));
    await waitFor(() => expect(screen.getByText("alpha-webhook")).toBeTruthy());
    const filterInput = screen.getByPlaceholderText("Find webhooks by name");
    await user.type(filterInput, "beta");
    await waitFor(() => expect(screen.queryByText("alpha-webhook")).toBeNull());
  });

  it("filters action types by provider", async () => {
    const user = userEvent.setup();
    mockActionTypes.mockReturnValue({
      data: {
        actionTypes: [
          { id: { category: "Build", owner: "AWS", provider: "CodeBuild", version: "1" } },
          { id: { category: "Test", owner: "AWS", provider: "CodeTest", version: "1" } },
        ],
        total: 2,
      },
      isLoading: false,
    });
    render(<CodePipelineDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /action types/i }));
    await waitFor(() => expect(screen.getByText("CodeBuild")).toBeTruthy());
    const filterInput = screen.getByPlaceholderText("Find action types by provider");
    await user.type(filterInput, "CodeTest");
    await waitFor(() => expect(screen.queryByText("CodeBuild")).toBeNull());
  });
});

describe("CodePipelineDashboard — webhook and action type data rendering", () => {
  it("renders webhooks with data including fallback values", async () => {
    const user = userEvent.setup();
    mockWebhooks.mockReturnValue({
      data: {
        webhooks: [
          { definition: null as any, url: null as any },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<CodePipelineDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /webhooks/i }));
    await waitFor(() => expect(screen.getAllByText("—").length).toBeGreaterThan(0));
  });

  it("renders action types with fallback values", async () => {
    const user = userEvent.setup();
    mockActionTypes.mockReturnValue({
      data: {
        actionTypes: [{ id: null as any }],
        total: 1,
      },
      isLoading: false,
    });
    render(<CodePipelineDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /action types/i }));
    await waitFor(() => expect(screen.getAllByText("—").length).toBeGreaterThan(0));
  });

  it("shows loading state for webhooks and action types", async () => {
    const user = userEvent.setup();
    mockWebhooks.mockReturnValue({ data: undefined, isLoading: true });
    mockActionTypes.mockReturnValue({ data: undefined, isLoading: true });
    render(<CodePipelineDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /webhooks/i }));
    await waitFor(() => expect(screen.getByText("CodePipeline Webhooks")).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /action types/i }));
    await waitFor(() => expect(screen.getByText("Action Types")).toBeTruthy());
  });

  it("creates a webhook with form data", async () => {
    const user = userEvent.setup();
    mockPipelines.mockReturnValue({
      data: { pipelines: [{ name: "my-pipe", version: 1 }], total: 1 },
      isLoading: false,
    });
    render(<CodePipelineDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /webhooks/i }));
    await waitFor(() => expect(screen.getByText("No webhooks found")).toBeTruthy());
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create webhook")).toBeTruthy());
    const nameInput = screen.getByPlaceholderText("my-webhook");
    await user.type(nameInput, "new-hook");
    const urlInput = screen.getByPlaceholderText("https://example.com/webhook");
    await user.type(urlInput, "https://hook.example.com");
    await clickButton(user, /Create/i, { last: true });
    expect(mockCreateWebhook).toHaveBeenCalledWith(
      expect.objectContaining({
        webhook: expect.objectContaining({ name: "new-hook" }),
      }),
      expect.any(Object),
    );
  });

  it("uses selectedPipeline as target when creating webhook", async () => {
    const user = userEvent.setup();
    mockPipelines.mockReturnValue({
      data: { pipelines: [{ name: "my-pipe", version: 1 }], total: 1 },
      isLoading: false,
    });
    mockPipelineState.mockReturnValue({
      data: { state: { pipelineVersion: 1, stageStates: [] } },
      isLoading: false,
    });
    render(<CodePipelineDashboard />, { wrapper: createWrapper() });
    // Select a pipeline first
    await clickButton(user, /my-pipe/i);
    await waitFor(() => expect(screen.getByText(/Pipeline: my-pipe/)).toBeTruthy());
    // Switch to webhooks tab
    await user.click(screen.getByRole("tab", { name: /webhooks/i }));
    await waitFor(() => expect(screen.getByText("CodePipeline Webhooks")).toBeTruthy());
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create webhook")).toBeTruthy());
    const nameInput = screen.getByPlaceholderText("my-webhook");
    await user.type(nameInput, "hook-on-pipe");
    const urlInput = screen.getByPlaceholderText("https://example.com/webhook");
    await user.type(urlInput, "https://hook.example.com");
    await clickButton(user, /Create/i, { last: true });
    expect(mockCreateWebhook).toHaveBeenCalledWith(
      expect.objectContaining({
        webhook: expect.objectContaining({ name: "hook-on-pipe", targetPipeline: "my-pipe" }),
      }),
      expect.any(Object),
    );
  });

  it("shows fallback values for pipeline dates", () => {
    mockPipelines.mockReturnValue({
      data: {
        pipelines: [{ name: "no-date-pipe", version: null as any, created: null as any, updated: null as any }],
        total: 1,
      },
      isLoading: false,
    });
    render(<CodePipelineDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("no-date-pipe")).toBeTruthy();
    expect(screen.getByText("0")).toBeTruthy(); // version || 0
  });
});

// ─── Helper: select a pipeline and ensure a Failed execution is visible ───
async function setupWithFailedExec(user: ReturnType<typeof userEvent.setup>) {
  mockPipelines.mockReturnValue({
    data: { pipelines: [{ name: "my-pipe", version: 1 }], total: 1 },
    isLoading: false,
  });
  mockPipelineState.mockReturnValue({
    data: { state: { pipelineVersion: 1, stageStates: [] } },
    isLoading: false,
  });
  mockPipelineExecutions.mockReturnValue({
    data: {
      executions: [{ pipelineExecutionId: "exec-fail", status: "Failed", startTime: "2024-01-01T00:00:00Z", lastUpdateTime: "2024-01-02T00:00:00Z" }],
      total: 1,
    },
    isLoading: false,
  });
  render(<CodePipelineDashboard />, { wrapper: createWrapper() });
  await clickButton(user, /my-pipe/i);
  await waitFor(() => expect(screen.getByText(/Pipeline: my-pipe/)).toBeTruthy());
}

describe("CodePipelineDashboard — rollback and override modals", () => {
  it("opens rollback modal from Failed execution", async () => {
    const user = userEvent.setup();
    await setupWithFailedExec(user);
    const rollbackBtn = screen.getByRole("button", { name: /Rollback stage/i });
    await user.click(rollbackBtn);
    await waitFor(() => expect(screen.getByText(/Rollback Stage/)).toBeTruthy());
  });

  it("opens rollback modal and checks disabled state", async () => {
    const user = userEvent.setup();
    await setupWithFailedExec(user);
    await user.click(screen.getByRole("button", { name: /Rollback stage/i }));
    await waitFor(() => expect(screen.getByText(/Rollback Stage/)).toBeTruthy());
    // Rollback button should be disabled when stage name is empty
    const rollbackBtns = screen.getAllByRole("button", { name: /Rollback/i });
    const submitBtn = rollbackBtns[rollbackBtns.length - 1];
    expect(submitBtn).toBeDisabled();
  });

  it("rollback modal renders stage name input", async () => {
    const user = userEvent.setup();
    await setupWithFailedExec(user);
    await user.click(screen.getByRole("button", { name: /Rollback stage/i }));
    await waitFor(() => {
      expect(screen.getByText(/Rollback Stage/)).toBeTruthy();
      expect(screen.getAllByPlaceholderText("Deploy").length).toBeGreaterThan(0);
    });
  });

  it("opens override condition modal from Failed execution", async () => {
    const user = userEvent.setup();
    await setupWithFailedExec(user);
    const overrideBtn = screen.getByRole("button", { name: /Override condition/i });
    await user.click(overrideBtn);
    await waitFor(() => expect(screen.getByText(/Override Stage Condition/)).toBeTruthy());
  });

  it("submits override with stage and condition names", async () => {
    const user = userEvent.setup();
    await setupWithFailedExec(user);
    await user.click(screen.getByRole("button", { name: /Override condition/i }));
    await waitFor(() => expect(screen.getByText(/Override Stage Condition/)).toBeTruthy());
    const deployInputs = screen.getAllByPlaceholderText("Deploy");
    await user.type(deployInputs[deployInputs.length - 1], "Deploy");
    const condInputs = screen.getAllByPlaceholderText("CheckForCondition");
    await user.type(condInputs[condInputs.length - 1], "CheckForCondition");
    await clickButton(user, /Override/i, { last: true });
    await waitFor(() => expect(hoisted.overrideMutate).toHaveBeenCalledWith(
      { name: "my-pipe", executionId: "exec-fail", stageName: "Deploy", conditionName: "CheckForCondition" },
      expect.any(Object),
    ));
  });

  it("opens override modal and checks it renders", async () => {
    const user = userEvent.setup();
    await setupWithFailedExec(user);
    await user.click(screen.getByRole("button", { name: /Override condition/i }));
    await waitFor(() => {
      expect(screen.getByText(/Override Stage Condition/)).toBeTruthy();
      expect(screen.getByText("Stage name")).toBeTruthy();
      expect(screen.getByText("Condition name")).toBeTruthy();
    });
  });

  it("override button disabled when stage name or condition empty", async () => {
    const user = userEvent.setup();
    await setupWithFailedExec(user);
    await user.click(screen.getByRole("button", { name: /Override condition/i }));
    await waitFor(() => expect(screen.getByText(/Override Stage Condition/)).toBeTruthy());
    const overrideBtns = screen.getAllByRole("button", { name: /Override/i });
    const submitBtn = overrideBtns[overrideBtns.length - 1];
    expect(submitBtn).toBeDisabled();
  });
});

describe("CodePipelineDashboard — Rules tab", () => {
  it("shows Rules tab as disabled when no pipeline selected", () => {
    render(<CodePipelineDashboard />, { wrapper: createWrapper() });
    const rulesTab = screen.getByRole("tab", { name: /Rules/i });
    expect(rulesTab).toHaveAttribute("aria-disabled", "true");
  });

  it("shows rule executions when pipeline selected", async () => {
    const user = userEvent.setup();
    mockPipelines.mockReturnValue({
      data: { pipelines: [{ name: "my-pipe", version: 1 }], total: 1 },
      isLoading: false,
    });
    mockPipelineState.mockReturnValue({
      data: { state: { pipelineVersion: 1, stageStates: [] } },
      isLoading: false,
    });
    hoisted.ruleExecutionsData = {
      ruleExecutionDetails: [{ ruleExecutionId: "rule-1", status: "Succeeded", ruleName: "CheckRule", startTime: "2024-01-01T00:00:00Z", lastUpdateTime: "2024-01-02T00:00:00Z" }],
      total: 1,
    };
    render(<CodePipelineDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /my-pipe/i);
    await waitFor(() => expect(screen.getByText(/Pipeline: my-pipe/)).toBeTruthy());
    // Switch to Rules tab
    await user.click(screen.getByRole("tab", { name: /Rules/ }));
    await waitFor(() => {
      expect(screen.getByText("CheckRule")).toBeTruthy();
      expect(screen.getByText("Succeeded")).toBeTruthy();
    });
  });

  it("shows fallback values for rule executions with null fields", async () => {
    const user = userEvent.setup();
    mockPipelines.mockReturnValue({
      data: { pipelines: [{ name: "my-pipe", version: 1 }], total: 1 },
      isLoading: false,
    });
    mockPipelineState.mockReturnValue({
      data: { state: { pipelineVersion: 1, stageStates: [] } },
      isLoading: false,
    });
    hoisted.ruleExecutionsData = {
      ruleExecutionDetails: [{ ruleExecutionId: null, status: null, ruleName: null, startTime: null, lastUpdateTime: null }],
      total: 1,
    };
    render(<CodePipelineDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /my-pipe/i);
    await waitFor(() => expect(screen.getByText(/Pipeline: my-pipe/)).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /Rules/ }));
    await waitFor(() => expect(screen.getAllByText("—").length).toBeGreaterThan(0));
  });

  it("shows rule executions with Failed status", async () => {
    const user = userEvent.setup();
    mockPipelines.mockReturnValue({
      data: { pipelines: [{ name: "my-pipe", version: 1 }], total: 1 },
      isLoading: false,
    });
    mockPipelineState.mockReturnValue({
      data: { state: { pipelineVersion: 1, stageStates: [] } },
      isLoading: false,
    });
    hoisted.ruleExecutionsData = {
      ruleExecutionDetails: [{ ruleExecutionId: "rule-f", status: "Failed", ruleName: "FailRule", startTime: "2024-01-01T00:00:00Z", lastUpdateTime: "2024-01-02T00:00:00Z" }],
      total: 1,
    };
    render(<CodePipelineDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /my-pipe/i);
    await waitFor(() => expect(screen.getByText(/Pipeline: my-pipe/)).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /Rules/ }));
    await waitFor(() => expect(screen.getByText("Failed")).toBeTruthy());
  });
});

describe("CodePipelineDashboard — Jobs tab", () => {
  it("shows Poll for jobs button on jobs tab", async () => {
    const user = userEvent.setup();
    render(<CodePipelineDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Jobs/i }));
    await waitFor(() => expect(screen.getByText(/Poll for jobs/)).toBeTruthy());
  });

  it("opens poll jobs modal", async () => {
    const user = userEvent.setup();
    render(<CodePipelineDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Jobs/i }));
    await waitFor(() => expect(screen.getByText(/Poll for jobs/)).toBeTruthy());
    await clickButton(user, /Poll for jobs/i);
    await waitFor(() => expect(screen.getByText(/Poll for Jobs/)).toBeTruthy());
  });

  it("polls and shows empty results", async () => {
    const user = userEvent.setup();
    hoisted.pollMutateAsync.mockResolvedValue({ jobs: [] });
    render(<CodePipelineDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Jobs/i }));
    await waitFor(() => expect(screen.getByText(/Poll for jobs/)).toBeTruthy());
    await clickButton(user, /Poll for jobs/i);
    await waitFor(() => expect(screen.getByText(/Poll for Jobs/)).toBeTruthy());
    const providerInput = screen.getByPlaceholderText("MyCustomProvider");
    await user.type(providerInput, "MyProvider");
    await clickButton(user, /^Poll$/i, { last: true });
    await waitFor(() => expect(screen.getByText(/No jobs found/)).toBeTruthy());
  });

  it("polls and shows job results", async () => {
    const user = userEvent.setup();
    hoisted.pollMutateAsync.mockResolvedValue({ jobs: [{ id: "job-1", accountId: "123", nonce: "abc", data: {} }] });
    render(<CodePipelineDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Jobs/i }));
    await waitFor(() => expect(screen.getByText(/Poll for jobs/)).toBeTruthy());
    await clickButton(user, /Poll for jobs/i);
    await waitFor(() => expect(screen.getByText(/Poll for Jobs/)).toBeTruthy());
    const providerInput = screen.getByPlaceholderText("MyCustomProvider");
    await user.type(providerInput, "MyProvider");
    await clickButton(user, /^Poll$/i, { last: true });
    await waitFor(() => {
      expect(screen.getByText("job-1")).toBeTruthy();
      expect(screen.getByText("123")).toBeTruthy();
    });
  });

  it("opens poll jobs modal with Provider input", async () => {
    const user = userEvent.setup();
    render(<CodePipelineDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Jobs/i }));
    await waitFor(() => expect(screen.getByText(/Poll for jobs/)).toBeTruthy());
    await clickButton(user, /Poll for jobs/i);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("MyCustomProvider")).toBeTruthy();
    });
  });

  it("shows job detail modal", async () => {
    const user = userEvent.setup();
    hoisted.pollMutateAsync.mockResolvedValue({ jobs: [{ id: "job-1", accountId: "123", nonce: null, data: {} }] });
    render(<CodePipelineDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Jobs/i }));
    await waitFor(() => expect(screen.getByText(/Poll for jobs/)).toBeTruthy());
    await clickButton(user, /Poll for jobs/i);
    await waitFor(() => expect(screen.getByText(/Poll for Jobs/)).toBeTruthy());
    const providerInput = screen.getByPlaceholderText("MyCustomProvider");
    await user.type(providerInput, "MyProvider");
    await clickButton(user, /^Poll$/i, { last: true });
    await waitFor(() => expect(screen.getAllByText("job-1").length).toBeGreaterThan(0));
    // Click Details button
    await clickButton(user, /Details/i);
    await waitFor(() => expect(screen.getByText(/Job Detail:/)).toBeTruthy());
  });

  it("job detail view shows loading spinner", async () => {
    const user = userEvent.setup();
    hoisted.pollMutateAsync.mockResolvedValue({ jobs: [{ id: "job-1", accountId: "123" }] });
    hoisted.jobDetailsIsLoading = true;
    hoisted.jobDetailsData = undefined as any;
    render(<CodePipelineDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Jobs/i }));
    await waitFor(() => expect(screen.getByText(/Poll for jobs/)).toBeTruthy());
    await clickButton(user, /Poll for jobs/i);
    await waitFor(() => expect(screen.getByText(/Poll for Jobs/)).toBeTruthy());
    const providerInput = screen.getByPlaceholderText("MyCustomProvider");
    await user.type(providerInput, "MyProvider");
    await clickButton(user, /^Poll$/i, { last: true });
    await waitFor(() => expect(screen.getAllByText("job-1").length).toBeGreaterThan(0));
    await clickButton(user, /Details/i);
    await waitFor(() => expect(screen.getByText(/Job Detail:/)).toBeTruthy());
    // When isLoading, JobDetailView returns <Spinner /> — just verify modal opened
    expect(screen.getByText(/Job Detail:/)).toBeTruthy();
  });

  it("job detail view shows error", async () => {
    const user = userEvent.setup();
    hoisted.pollMutateAsync.mockResolvedValue({ jobs: [{ id: "job-1", accountId: "123" }] });
    hoisted.jobDetailsIsError = true;
    hoisted.jobDetailsError = new Error("Fetch failed");
    render(<CodePipelineDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Jobs/i }));
    await waitFor(() => expect(screen.getByText(/Poll for jobs/)).toBeTruthy());
    await clickButton(user, /Poll for jobs/i);
    await waitFor(() => expect(screen.getByText(/Poll for Jobs/)).toBeTruthy());
    const providerInput = screen.getByPlaceholderText("MyCustomProvider");
    await user.type(providerInput, "MyProvider");
    await clickButton(user, /^Poll$/i, { last: true });
    await waitFor(() => expect(screen.getByText("job-1")).toBeTruthy());
    await clickButton(user, /Details/i);
    await waitFor(() => expect(screen.getByText("Fetch failed")).toBeTruthy());
  });

  it("job detail view shows not found for null details", async () => {
    const user = userEvent.setup();
    hoisted.pollMutateAsync.mockResolvedValue({ jobs: [{ id: "job-1", accountId: "123" }] });
    hoisted.jobDetailsData = { jobDetails: null };
    render(<CodePipelineDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Jobs/i }));
    await waitFor(() => expect(screen.getByText(/Poll for jobs/)).toBeTruthy());
    await clickButton(user, /Poll for jobs/i);
    await waitFor(() => expect(screen.getByText(/Poll for Jobs/)).toBeTruthy());
    const providerInput = screen.getByPlaceholderText("MyCustomProvider");
    await user.type(providerInput, "MyProvider");
    await clickButton(user, /^Poll$/i, { last: true });
    await waitFor(() => expect(screen.getByText("job-1")).toBeTruthy());
    await clickButton(user, /Details/i);
    await waitFor(() => expect(screen.getByText(/No job details found/)).toBeTruthy());
  });

  it("job detail view renders job data JSON", async () => {
    const user = userEvent.setup();
    hoisted.pollMutateAsync.mockResolvedValue({ jobs: [{ id: "job-1", accountId: "123" }] });
    hoisted.jobDetailsData = { jobDetails: { id: "job-1", accountId: "123", data: { action: "build" } } };
    render(<CodePipelineDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Jobs/i }));
    await waitFor(() => expect(screen.getByText(/Poll for jobs/)).toBeTruthy());
    await clickButton(user, /Poll for jobs/i);
    await waitFor(() => expect(screen.getByText(/Poll for Jobs/)).toBeTruthy());
    const providerInput = screen.getByPlaceholderText("MyCustomProvider");
    await user.type(providerInput, "MyProvider");
    await clickButton(user, /^Poll$/i, { last: true });
    await waitFor(() => expect(screen.getAllByText("job-1").length).toBeGreaterThan(0));
    await clickButton(user, /Details/i);
    await waitFor(() => expect(screen.getByText(/Job Data/)).toBeTruthy());
  });
});

describe("CodePipelineDashboard — webhook register/deregister and delete action type", () => {
  it("clicks register webhook button", async () => {
    const user = userEvent.setup();
    mockWebhooks.mockReturnValue({
      data: {
        webhooks: [{ definition: { name: "my-hook", targetPipeline: "my-pipe", targetAction: "Source" }, url: "https://example.com/hook" }],
        total: 1,
      },
      isLoading: false,
    });
    render(<CodePipelineDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /webhooks/i }));
    await waitFor(() => expect(screen.getByText("my-hook")).toBeTruthy());
    const buttons = screen.getAllByRole("button", { name: /Register webhook/i });
    await user.click(buttons[0]);
    await waitFor(() => expect(hoisted.registerMutateAsync).toHaveBeenCalledWith("my-hook"));
  });

  it("clicks deregister webhook button", async () => {
    const user = userEvent.setup();
    mockWebhooks.mockReturnValue({
      data: {
        webhooks: [{ definition: { name: "my-hook", targetPipeline: "my-pipe", targetAction: "Source" }, url: "https://example.com/hook" }],
        total: 1,
      },
      isLoading: false,
    });
    render(<CodePipelineDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /webhooks/i }));
    await waitFor(() => expect(screen.getByText("my-hook")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Deregister webhook/i }));
    await waitFor(() => expect(hoisted.deregisterMutateAsync).toHaveBeenCalledWith("my-hook"));
  });

  it("opens delete action type confirm modal", async () => {
    const user = userEvent.setup();
    mockActionTypes.mockReturnValue({
      data: {
        actionTypes: [{ id: { category: "Build", owner: "AWS", provider: "CodeBuild", version: "1" } }],
        total: 1,
      },
      isLoading: false,
    });
    render(<CodePipelineDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /action types/i }));
    await waitFor(() => expect(screen.getByText("CodeBuild")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete action type CodeBuild/i }));
    await waitFor(() => {
      expect(screen.getByText(/Are you sure you want to delete the action type/)).toBeTruthy();
      expect(screen.getAllByText("CodeBuild").length).toBeGreaterThan(0);
    });
  });

  it("confirms delete action type", async () => {
    const user = userEvent.setup();
    mockActionTypes.mockReturnValue({
      data: {
        actionTypes: [{ id: { category: "Build", owner: "AWS", provider: "CodeBuild", version: "1" } }],
        total: 1,
      },
      isLoading: false,
    });
    render(<CodePipelineDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /action types/i }));
    await waitFor(() => expect(screen.getByText("CodeBuild")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete action type CodeBuild/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i, { last: true });
    await waitFor(() => expect(hoisted.deleteActionTypeMutate).toHaveBeenCalledWith(
      { owner: "AWS", category: "Build", provider: "CodeBuild", version: "1" },
      expect.any(Object),
    ));
  });
});

describe("CodePipelineDashboard — stage status other and execution fallbacks", () => {
  it("shows 'in-progress' status for stage with unknown action status", async () => {
    const user = userEvent.setup();
    mockPipelines.mockReturnValue({
      data: { pipelines: [{ name: "my-pipe", version: 1 }], total: 1 },
      isLoading: false,
    });
    mockPipelineState.mockReturnValue({
      data: {
        state: {
          pipelineVersion: 1,
          stageStates: [
            { stageName: "Approval", actionStates: [{ latestExecution: { status: "Superseded" } }], inboundTransitionState: { enabled: true } },
          ],
        },
      },
      isLoading: false,
    });
    mockPipelineExecutions.mockReturnValue({ data: { executions: [], total: 0 }, isLoading: false });
    render(<CodePipelineDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /my-pipe/i);
    await waitFor(() => expect(screen.getByText(/Pipeline: my-pipe/)).toBeTruthy());
    expect(screen.getByText("Approval")).toBeTruthy();
  });

  it("shows fallback values for executions with null fields", async () => {
    const user = userEvent.setup();
    mockPipelines.mockReturnValue({
      data: { pipelines: [{ name: "my-pipe", version: 1 }], total: 1 },
      isLoading: false,
    });
    mockPipelineState.mockReturnValue({
      data: { state: { pipelineVersion: 1, stageStates: [] } },
      isLoading: false,
    });
    mockPipelineExecutions.mockReturnValue({
      data: {
        executions: [{
          pipelineExecutionId: null as any,
          status: null as any,
          startTime: null as any,
          lastUpdateTime: null as any,
        }],
        total: 1,
      },
      isLoading: false,
    });
    render(<CodePipelineDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /my-pipe/i);
    await waitFor(() => expect(screen.getByText(/Pipeline: my-pipe/)).toBeTruthy());
    // Multiple "—" values for null fields
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(3);
  });
});
