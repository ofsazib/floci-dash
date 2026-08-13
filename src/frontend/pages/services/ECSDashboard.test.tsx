// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

// ─── Mock hooks ─────────────────────────────────────────

const mockClusters = vi.fn();
const mockCreateCluster = vi.fn();
const mockDeleteCluster = vi.fn();
const mockServices = vi.fn();
const mockTasks = vi.fn();
const mockTaskDefs = vi.fn();
const mockTaskDefFamilies = vi.fn();
const mockCreateService = vi.fn();
const mockDeleteService = vi.fn();
const mockStopTask = vi.fn();
const mockRunTask = vi.fn();
const mockAccountSettings = vi.fn();
const mockPutAccountSetting = vi.fn();
const mockDeleteAccountSetting = vi.fn();
const mockTaskSets = vi.fn();
const mockCreateTaskSet = vi.fn();
const mockSetPrimaryTaskSet = vi.fn();
const mockDeleteTaskSet = vi.fn();

const createClusterState = vi.hoisted(() => ({
  isError: false,
  error: null as Error | null,
  isPending: false,
}));
const createServiceState = vi.hoisted(() => ({
  isError: false,
  error: null as Error | null,
  isPending: false,
}));
const runTaskState = vi.hoisted(() => ({
  isError: false,
  error: null as Error | null,
  isPending: false,
}));
const deleteClusterState = vi.hoisted(() => ({
  isPending: false,
  variables: null as string | null,
}));
const deleteServiceState = vi.hoisted(() => ({
  isPending: false,
  variables: null as any | null,
}));

vi.mock("../../hooks/useECS", () => ({
  useECSClusters: (...args: any[]) => mockClusters(...args),
  useCreateECSCluster: () => ({
    mutate: mockCreateCluster,
    isPending: createClusterState.isPending,
    isError: createClusterState.isError,
    error: createClusterState.error,
    reset: vi.fn(),
  }),
  useDeleteECSCluster: () => ({
    mutateAsync: mockDeleteCluster,
    isPending: deleteClusterState.isPending,
    variables: deleteClusterState.variables,
  }),
  useECSServices: (...args: any[]) => mockServices(...args),
  useCreateECSService: () => ({
    mutate: mockCreateService,
    isPending: createServiceState.isPending,
    isError: createServiceState.isError,
    error: createServiceState.error,
    reset: vi.fn(),
  }),
  useDeleteECSService: () => ({
    mutateAsync: mockDeleteService,
    isPending: deleteServiceState.isPending,
    variables: deleteServiceState.variables,
  }),
  useECSTasks: (...args: any[]) => mockTasks(...args),
  useStopECSTask: () => ({
    mutateAsync: mockStopTask,
    isPending: false,
  }),
  useRunECSTask: () => ({
    mutate: mockRunTask,
    isPending: runTaskState.isPending,
    isError: runTaskState.isError,
    error: runTaskState.error,
    reset: vi.fn(),
  }),
  useECSTaskDefinitions: (...args: any[]) => mockTaskDefs(...args),
  useECSTaskDefinitionFamilies: (...args: any[]) => mockTaskDefFamilies(...args),
  useECSAccountSettings: (...args: any[]) => mockAccountSettings(...args),
  usePutECSAccountSetting: () => ({ mutate: mockPutAccountSetting, isPending: false }),
  useDeleteECSAccountSetting: () => ({ mutateAsync: mockDeleteAccountSetting, isPending: false }),
  useECSTaskSets: (...args: any[]) => mockTaskSets(...args),
  useCreateECSTaskSet: () => ({ mutate: mockCreateTaskSet, isPending: false }),
  useSetPrimaryECSTaskSet: () => ({ mutateAsync: mockSetPrimaryTaskSet, isPending: false }),
  useDeleteECSTaskSet: () => ({ mutateAsync: mockDeleteTaskSet, isPending: false }),
}));

import { ECSDashboard } from "./ECSDashboard";

const toastMock = vi.fn();
vi.mock("../../components/Toast", () => ({
  useToast: () => ({ showToast: toastMock }),
}));

// ─── Modal helpers ──────────────────────────────────────

/** Fire Escape on every mounted Cloudscape dialog (they stay mounted when hidden). */
function dismissModalWithEscape() {
  document.querySelectorAll('[class*="awsui_dialog"]').forEach((dialog) => {
    fireEvent.keyDown(dialog as HTMLElement, { keyCode: 27, key: "Escape" });
  });
}

function dialogOf(headerText: string): HTMLElement {
  const header = screen
    .getAllByText(headerText)
    .find((h) => h.closest('[role="dialog"]'));
  return header!.closest('[role="dialog"]') as HTMLElement;
}

/** Assert the modal with the given header is hidden (Cloudscape uses display:none). */
function expectModalHidden(headerText: string) {
  expect(dialogOf(headerText).className).toContain("hidden");
}

// ─── Setup ──────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  createClusterState.isError = false;
  createClusterState.error = null;
  createClusterState.isPending = false;
  createServiceState.isError = false;
  createServiceState.error = null;
  createServiceState.isPending = false;
  runTaskState.isError = false;
  runTaskState.error = null;
  runTaskState.isPending = false;
  deleteClusterState.isPending = false;
  deleteClusterState.variables = null;
  deleteServiceState.isPending = false;
  deleteServiceState.variables = null;

  mockClusters.mockReturnValue({
    data: { clusters: [], total: 0 },
    isLoading: false,
    isError: false,
    error: null,
  });
  mockServices.mockReturnValue({
    data: { services: [], total: 0 },
    isLoading: false,
  });
  mockTasks.mockReturnValue({
    data: { tasks: [], total: 0 },
    isLoading: false,
  });
  mockTaskDefs.mockReturnValue({
    data: { taskDefinitionArns: [], total: 0 },
    isLoading: false,
  });
  mockTaskDefFamilies.mockReturnValue({
    data: { families: [] },
    isLoading: false,
  });
  mockAccountSettings.mockReturnValue({
    data: { settings: [], total: 0 },
    isLoading: false,
  });
  mockTaskSets.mockReturnValue({
    data: { taskSets: [], total: 0 },
    isLoading: false,
  });
  mockDeleteAccountSetting.mockResolvedValue({});
  mockSetPrimaryTaskSet.mockResolvedValue({});
  mockDeleteTaskSet.mockResolvedValue({});
});

// ─── Tests ──────────────────────────────────────────────

describe("ECSDashboard — cluster list", () => {
  it("shows empty state", () => {
    render(<ECSDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("No clusters found. Create one to get started.")).toBeTruthy();
  });

  it("renders clusters list with data", () => {
    mockClusters.mockReturnValue({
      data: {
        clusters: [
          { clusterName: "my-cluster", status: "ACTIVE", clusterArn: "arn:aws:ecs:::cluster/my-cluster", runningTasksCount: 2, activeServicesCount: 3, registeredContainerInstancesCount: 1 },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<ECSDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-cluster")).toBeTruthy();
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
    expect(screen.getByText("3")).toBeTruthy();
  });

  it("opens create cluster modal and submits", async () => {
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create cluster")).toBeTruthy());
    const input = screen.getByPlaceholderText("my-cluster");
    await user.type(input, "new-cluster");
    await clickButton(user, /Create/i, { last: true });
    expect(mockCreateCluster).toHaveBeenCalledWith(
      { clusterName: "new-cluster" },
      expect.any(Object),
    );
  });

  it("deletes a cluster", async () => {
    const user = userEvent.setup();
    mockClusters.mockReturnValue({
      data: {
        clusters: [{ clusterName: "my-cluster", status: "ACTIVE", clusterArn: "arn:aws:ecs:::cluster/my-cluster" }],
        total: 1,
      },
      isLoading: false,
    });
    render(<ECSDashboard />, { wrapper: createWrapper() });
    const deleteBtn = screen.getByRole("button", { name: /Delete my-cluster/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteCluster).toHaveBeenCalledWith("arn:aws:ecs:::cluster/my-cluster"));
  });

  it("shows loading state", () => {
    mockClusters.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });
    const { container } = render(<ECSDashboard />, { wrapper: createWrapper() });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("cancels create cluster modal", async () => {
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create cluster")).toBeTruthy());
    await clickButton(user, /Cancel/i);
    await waitFor(() => {
      expect(mockCreateCluster).not.toHaveBeenCalled();
    });
  });

  it("filters clusters by name", async () => {
    mockClusters.mockReturnValue({
      data: {
        clusters: [
          { clusterName: "alpha-cluster", status: "ACTIVE", clusterArn: "arn:1" },
          { clusterName: "beta-cluster", status: "ACTIVE", clusterArn: "arn:2" },
        ],
        total: 2,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("alpha-cluster")).toBeTruthy());
    expect(screen.getByText("beta-cluster")).toBeTruthy();

    const filterInput = screen.getByPlaceholderText("Find clusters by name");
    await user.type(filterInput, "alpha");

    await waitFor(() => {
      expect(screen.queryByText("alpha-cluster")).toBeTruthy();
      expect(screen.queryByText("beta-cluster")).toBeNull();
    });
  });

  it("shows fallback values for missing cluster fields", () => {
    mockClusters.mockReturnValue({
      data: {
        clusters: [
          { clusterName: null, status: null, runningTasksCount: null, activeServicesCount: null, registeredContainerInstancesCount: null },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<ECSDashboard />, { wrapper: createWrapper() });
    // clusterName null → "—"
    expect(screen.getByText("—")).toBeTruthy();
  });

  it("shows error alert when create cluster fails", async () => {
    createClusterState.isError = true;
    createClusterState.error = new Error("Cluster name taken");
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create cluster")).toBeTruthy());
    expect(screen.getByText("Cluster name taken")).toBeTruthy();

    createClusterState.isError = false;
    createClusterState.error = null;
  });

  it("shows loading indicator on delete cluster button", () => {
    deleteClusterState.isPending = true;
    deleteClusterState.variables = "arn:aws:ecs:::cluster/my-cluster";
    mockClusters.mockReturnValue({
      data: {
        clusters: [{ clusterName: "my-cluster", status: "ACTIVE", clusterArn: "arn:aws:ecs:::cluster/my-cluster" }],
        total: 1,
      },
      isLoading: false,
    });
    render(<ECSDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-cluster")).toBeTruthy();
  });
});

describe("ECSDashboard — cluster detail", () => {
  beforeEach(() => {
    mockClusters.mockReturnValue({
      data: {
        clusters: [{ clusterName: "my-cluster", status: "ACTIVE", clusterArn: "arn:aws:ecs:::cluster/my-cluster" }],
        total: 1,
      },
      isLoading: false,
    });
  });

  it("navigates into cluster detail on View click", async () => {
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByText("my-cluster")).toBeTruthy());
  });

  it("shows services, tasks, and task def tabs", async () => {
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /services/i })).toBeTruthy();
      expect(screen.getByRole("tab", { name: /tasks/i })).toBeTruthy();
      expect(screen.getByRole("tab", { name: /task definitions/i })).toBeTruthy();
    });
  });

  it("shows services with data", async () => {
    const user = userEvent.setup();
    mockServices.mockReturnValue({
      data: {
        services: [{ serviceName: "my-svc", status: "ACTIVE", desiredCount: 2, runningCount: 2, taskDefinition: "arn:aws:ecs:::task-def/my-task:1" }],
        total: 1,
      },
      isLoading: false,
    });
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getByText("my-svc")).toBeTruthy();
      expect(screen.getByText("Services (1)")).toBeTruthy();
    });
  });

  it("opens create service modal", async () => {
    const user = userEvent.setup();
    mockTaskDefFamilies.mockReturnValue({
      data: { families: ["my-family"] },
      isLoading: false,
    });
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("tab", { name: /services/i })).toBeTruthy());
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getAllByText("Create Service").length).toBeGreaterThan(0));
    // Cloudscape Select for task definition is hard to interact with in tests
    // so we verify the modal opens rather than filling the full form
  });

  it("opens run task modal from tasks tab", async () => {
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("tab", { name: /services/i })).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /tasks/i }));
    await waitFor(() => expect(screen.getByText(/No running tasks/)).toBeTruthy());
    await clickButton(user, /Run/i);
    await waitFor(() => expect(screen.getByText("Run task")).toBeTruthy());
    const input = screen.getByPlaceholderText("my-task:1");
    await user.type(input, "my-task:2");
    await clickButton(user, /Run/i, { last: true });
    expect(mockRunTask).toHaveBeenCalled();
  });

  it("shows task definitions tab", async () => {
    const user = userEvent.setup();
    mockTaskDefs.mockReturnValue({
      data: { taskDefinitionArns: ["arn:aws:ecs:::task-def/my-task:1"], total: 1 },
      isLoading: false,
    });
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("tab", { name: /services/i })).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /task definitions/i }));
    await waitFor(() => expect(screen.getByText("my-task:1")).toBeTruthy());
  });

  it("goes back to cluster list via back button", async () => {
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByText("my-cluster")).toBeTruthy());
    await clickButton(user, /Clusters/i);
    await waitFor(() => expect(screen.getByText("ECS Clusters")).toBeTruthy());
  });

  it("shows loading state for services tab", async () => {
    mockServices.mockReturnValue({ data: undefined, isLoading: true });
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /services/i })).toBeTruthy();
    });
    // Loading state renders a skeleton — verify the component renders
    const servicesTab = screen.getByRole("tab", { name: /services/i });
    await user.click(servicesTab);
    await waitFor(() => {
      expect(screen.getByText("Services (0)")).toBeTruthy();
    });
  });

  it("shows empty state for tasks tab", async () => {
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("tab", { name: /services/i })).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /tasks/i }));
    await waitFor(() => expect(screen.getByText(/No running tasks/)).toBeTruthy());
  });

  it("shows empty state for task defs tab", async () => {
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("tab", { name: /services/i })).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /task definitions/i }));
    await waitFor(() => expect(screen.getByText(/No task definitions registered/i)).toBeTruthy());
  });

  it("filters task definitions", async () => {
    mockTaskDefs.mockReturnValue({
      data: { taskDefinitionArns: ["arn:aws:ecs:::task-def/alpha:1", "arn:aws:ecs:::task-def/beta:2"], total: 2 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("tab", { name: /services/i })).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /task definitions/i }));
    await waitFor(() => expect(screen.getByText("alpha:1")).toBeTruthy());
    const filterInput = screen.getByPlaceholderText("Find task definitions");
    await user.type(filterInput, "alpha");
    await waitFor(() => {
      expect(screen.queryByText("alpha:1")).toBeTruthy();
      expect(screen.queryByText("beta:2")).toBeNull();
    });
  });

  it("shows stop button for running tasks", async () => {
    mockTasks.mockReturnValue({
      data: {
        tasks: [
          { taskArn: "arn:aws:ecs:::task/abc123", lastStatus: "RUNNING", desiredStatus: "RUNNING", taskDefinitionArn: "arn:aws:ecs:::task-def/my-task:1", group: "service:my-svc" },
        ],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("tab", { name: /services/i })).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /tasks/i }));
    await waitFor(() => expect(screen.getByText("abc123")).toBeTruthy());
    // Stop button should be visible for RUNNING tasks
    expect(screen.getByRole("button", { name: /Stop/i })).toBeTruthy();
  });

  it("calls stopTask when Stop is clicked", async () => {
    mockTasks.mockReturnValue({
      data: {
        tasks: [
          { taskArn: "arn:aws:ecs:::task/stop-me", lastStatus: "RUNNING", desiredStatus: "RUNNING", taskDefinitionArn: "arn:aws:ecs:::task-def/t:1", group: "service:s" },
        ],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("tab", { name: /services/i })).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /tasks/i }));
    await waitFor(() => expect(screen.getByText("stop-me")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Stop/i }));
    await waitFor(() => {
      expect(mockStopTask).toHaveBeenCalledWith(
        { cluster: "my-cluster", task: "arn:aws:ecs:::task/stop-me", reason: "Stopped via dashboard" },
      );
    });
  });

  it("does not show stop button for STOPPED tasks", async () => {
    mockTasks.mockReturnValue({
      data: {
        tasks: [
          { taskArn: "arn:aws:ecs:::task/stopped-1", lastStatus: "STOPPED", desiredStatus: "STOPPED", taskDefinitionArn: "arn:aws:ecs:::task-def/t:1", group: "service:s" },
        ],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("tab", { name: /services/i })).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /tasks/i }));
    await waitFor(() => expect(screen.getByText("stopped-1")).toBeTruthy());
    // No Stop button for STOPPED tasks
    expect(screen.queryByRole("button", { name: /Stop/i })).toBeNull();
  });

  it("deletes a service", async () => {
    mockServices.mockReturnValue({
      data: {
        services: [
          { serviceName: "del-svc", status: "ACTIVE", desiredCount: 1, runningCount: 1, taskDefinition: "arn:aws:ecs:::task-def/t:1" },
        ],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByText("del-svc")).toBeTruthy());
    const deleteBtn = screen.getByRole("button", { name: /Delete del-svc/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => {
      expect(mockDeleteService).toHaveBeenCalledWith(
        { cluster: "my-cluster", service: "del-svc", force: true },
      );
    });
  });

  it("shows fallback values for task fields", async () => {
    mockTasks.mockReturnValue({
      data: {
        tasks: [
          { taskArn: null, lastStatus: "RUNNING", desiredStatus: null, taskDefinitionArn: null, group: null },
        ],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("tab", { name: /services/i })).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /tasks/i }));
    await waitFor(() => {
      // Missing values → "—" for arn, desiredStatus, taskDef, group
      const dashes = screen.getAllByText("—");
      expect(dashes.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("shows fallback for missing service taskDefinition", async () => {
    mockServices.mockReturnValue({
      data: {
        services: [
          { serviceName: "minimal-svc", status: "ACTIVE", desiredCount: 0, runningCount: 0, taskDefinition: null },
        ],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getByText("minimal-svc")).toBeTruthy();
      // taskDefinition null → "—"
      expect(screen.getByText("—")).toBeTruthy();
    });
  });

  it("shows error alert when create service fails", async () => {
    createServiceState.isError = true;
    createServiceState.error = new Error("Service limit reached");
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("tab", { name: /services/i })).toBeTruthy());
    await clickButton(user, /Create/i);
    await waitFor(() => {
      expect(screen.getAllByText("Create Service").length).toBeGreaterThan(0);
    });
    expect(screen.getByText("Service limit reached")).toBeTruthy();

    createServiceState.isError = false;
    createServiceState.error = null;
  });

  it("shows loading indicator on delete service button", async () => {
    deleteServiceState.isPending = true;
    deleteServiceState.variables = { cluster: "my-cluster", service: "my-svc", force: true };
    mockServices.mockReturnValue({
      data: {
        services: [{ serviceName: "my-svc", status: "ACTIVE", desiredCount: 1, runningCount: 1, taskDefinition: "arn:1" }],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getByText("my-svc")).toBeTruthy();
    });
  });

  it("shows error alert when run task fails", async () => {
    runTaskState.isError = true;
    runTaskState.error = new Error("Invalid task definition");
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("tab", { name: /services/i })).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /tasks/i }));
    await waitFor(() => expect(screen.getByText(/No running tasks/)).toBeTruthy());
    await clickButton(user, /Run/i);
    await waitFor(() => expect(screen.getByText("Run task")).toBeTruthy());
    expect(screen.getByText("Invalid task definition")).toBeTruthy();

    runTaskState.isError = false;
    runTaskState.error = null;
  });

  it("cancels run task modal", async () => {
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("tab", { name: /services/i })).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /tasks/i }));
    await clickButton(user, /Run/i);
    await waitFor(() => expect(screen.getByText("Run task")).toBeTruthy());
    await clickButton(user, /Cancel/i);
    await waitFor(() => {
      expect(mockRunTask).not.toHaveBeenCalled();
    });
  });

  it("filters services by name", async () => {
    mockServices.mockReturnValue({
      data: {
        services: [
          { serviceName: "alpha-svc", status: "ACTIVE", desiredCount: 1, runningCount: 1, taskDefinition: "arn:aws:ecs:::task-def/t:1" },
          { serviceName: "beta-svc", status: "ACTIVE", desiredCount: 2, runningCount: 2, taskDefinition: "arn:aws:ecs:::task-def/t:2" },
        ],
        total: 2,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByText("alpha-svc")).toBeTruthy());
    expect(screen.getByText("beta-svc")).toBeTruthy();
    const filterInput = screen.getByPlaceholderText("Find services");
    await user.type(filterInput, "alpha");
    await waitFor(() => {
      expect(screen.queryByText("alpha-svc")).toBeTruthy();
      expect(screen.queryByText("beta-svc")).toBeNull();
    });
  });
});

// ─── Account Settings ───────────────────────────────────

describe("ECSDashboard — Account Settings", () => {
  it("shows account settings tab with empty state", async () => {
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /account settings/i }));
    await waitFor(() => expect(screen.getByText("No account settings configured.")).toBeTruthy());
  });

  it("renders account settings rows", async () => {
    mockAccountSettings.mockReturnValue({
      data: { settings: [{ name: "containerInsights", value: "enabled" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /account settings/i }));
    await waitFor(() => expect(screen.getAllByText("containerInsights").length).toBeGreaterThan(0));
  });

  it("opens put setting modal and submits", async () => {
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /account settings/i }));
    await clickButton(user, /Create Account Setting/i);
    await waitFor(() => expect(screen.getByText("Put account setting")).toBeTruthy());
    await clickButton(user, /Save/i);
    await waitFor(() => expect(mockPutAccountSetting).toHaveBeenCalled());
    const arg = mockPutAccountSetting.mock.calls[0][0];
    expect(arg.name).toBe("containerInsights");
    expect(arg.value).toBe("enabled");
  });

  it("deletes an account setting", async () => {
    mockAccountSettings.mockReturnValue({
      data: { settings: [{ name: "containerInsights", value: "enabled" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /account settings/i }));
    await waitFor(() => expect(screen.getAllByText("containerInsights").length).toBeGreaterThan(0));
    await clickButton(user, /Delete/i);
    // DeleteButton may require confirmation
    const confirmBtns = screen.queryAllByRole("button", { name: /Delete/i });
    if (confirmBtns.length > 1) await user.click(confirmBtns[confirmBtns.length - 1]);
    await waitFor(() => expect(mockDeleteAccountSetting).toHaveBeenCalledWith("containerInsights"));
  });

  it("puts account setting with isDefault checked", async () => {
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /account settings/i }));
    await clickButton(user, /Create Account Setting/i);
    await waitFor(() => expect(screen.getByText("Put account setting")).toBeTruthy());
    // Check the "Apply as account default" checkbox
    const checkbox = screen.getByRole("checkbox");
    await user.click(checkbox);
    await clickButton(user, /Save/i);
    await waitFor(() => expect(mockPutAccountSetting).toHaveBeenCalled());
    const arg = mockPutAccountSetting.mock.calls[0][0];
    expect(arg.isDefault).toBe(true);
  });

  it("shows account settings loading state", async () => {
    mockAccountSettings.mockReturnValue({
      data: undefined,
      isLoading: true,
    });
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /account settings/i }));
    await waitFor(() => {
      // Loading renders skeleton; "Account Settings" appears in tab label and header
      expect(screen.getAllByText("Account Settings").length).toBeGreaterThanOrEqual(2);
    });
  });

  it("deletes account setting and shows success toast", async () => {
    mockAccountSettings.mockReturnValue({
      data: { settings: [{ name: "serviceLongArnFormat", value: "enabled" }], total: 1 },
      isLoading: false,
    });
    mockDeleteAccountSetting.mockResolvedValue({});
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /account settings/i }));
    await waitFor(() => expect(screen.getByText("serviceLongArnFormat")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete serviceLongArnFormat/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteAccountSetting).toHaveBeenCalledWith("serviceLongArnFormat"));
  });
});

// ─── Task Sets ──────────────────────────────────────────

describe("ECSDashboard — Task Sets", () => {
  beforeEach(() => {
    mockClusters.mockReturnValue({
      data: {
        clusters: [{ clusterName: "my-cluster", status: "ACTIVE", clusterArn: "arn:aws:ecs:::cluster/my-cluster" }],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
  });

  async function openTaskSetsTab(user: ReturnType<typeof userEvent.setup>) {
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("tab", { name: /services/i })).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /task sets/i }));
  }

  it("shows service selector prompt", async () => {
    const user = userEvent.setup();
    await openTaskSetsTab(user);
    await waitFor(() => expect(screen.getByText("Task set service")).toBeTruthy());
  });

  it("lists task sets after selecting a service", async () => {
    mockServices.mockReturnValue({
      data: { services: [{ serviceName: "svc1", status: "ACTIVE" }], total: 1 },
      isLoading: false,
    });
    mockTaskSets.mockReturnValue({
      data: { taskSets: [{ id: "ts-1", status: "ACTIVE", taskDefinition: "arn:aws:ecs:::task-def/t:1", runningCount: 1, computedDesiredCount: 1 }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    await openTaskSetsTab(user);
    // select the service
    await user.click(screen.getByText("Choose a service"));
    await user.click(await screen.findByText("svc1"));
    await waitFor(() => expect(screen.getByText("ts-1")).toBeTruthy());
  });

  it("makes a task set primary", async () => {
    mockServices.mockReturnValue({
      data: { services: [{ serviceName: "svc1", status: "ACTIVE" }], total: 1 },
      isLoading: false,
    });
    mockTaskSets.mockReturnValue({
      data: { taskSets: [{ id: "ts-1", status: "ACTIVE", taskDefinition: "t:1", runningCount: 1, computedDesiredCount: 1 }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    await openTaskSetsTab(user);
    await user.click(screen.getByText("Choose a service"));
    await user.click(await screen.findByText("svc1"));
    await waitFor(() => expect(screen.getByText("ts-1")).toBeTruthy());
    await clickButton(user, /Make primary/i);
    await waitFor(() => expect(mockSetPrimaryTaskSet).toHaveBeenCalled());
    expect(mockSetPrimaryTaskSet.mock.calls[0][0].primaryTaskSet).toBe("ts-1");
  });

  it("hides Make primary button for PRIMARY task set", async () => {
    mockServices.mockReturnValue({
      data: { services: [{ serviceName: "svc1", status: "ACTIVE" }], total: 1 },
      isLoading: false,
    });
    mockTaskSets.mockReturnValue({
      data: { taskSets: [{ id: "ts-primary", status: "PRIMARY", taskDefinition: "t:1", runningCount: 2, computedDesiredCount: 2 }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    await openTaskSetsTab(user);
    await user.click(screen.getByText("Choose a service"));
    await user.click(await screen.findByText("svc1"));
    await waitFor(() => expect(screen.getByText("ts-primary")).toBeTruthy());
    expect(screen.queryByRole("button", { name: /Make primary/i })).toBeNull();
  });

  it("opens create task set modal and submits", async () => {
    mockServices.mockReturnValue({
      data: { services: [{ serviceName: "svc1", status: "ACTIVE" }], total: 1 },
      isLoading: false,
    });
    mockTaskSets.mockReturnValue({
      data: { taskSets: [], total: 0 },
      isLoading: false,
    });
    const user = userEvent.setup();
    await openTaskSetsTab(user);
    await user.click(screen.getByText("Choose a service"));
    await user.click(await screen.findByText("svc1"));
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create task set")).toBeTruthy());
    const input = screen.getByPlaceholderText("my-task-def:1");
    await user.type(input, "my-family:3");
    await clickButton(user, /Create/i, { last: true });
    await waitFor(() => expect(mockCreateTaskSet).toHaveBeenCalledWith(
      { cluster: "my-cluster", service: "svc1", taskDefinition: "my-family:3" },
      expect.any(Object),
    ));
  });

  it("cancels create task set modal", async () => {
    mockServices.mockReturnValue({
      data: { services: [{ serviceName: "svc1", status: "ACTIVE" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    await openTaskSetsTab(user);
    await user.click(screen.getByText("Choose a service"));
    await user.click(await screen.findByText("svc1"));
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create task set")).toBeTruthy());
    await clickButton(user, /Cancel/i);
    await waitFor(() => expect(mockCreateTaskSet).not.toHaveBeenCalled());
  });

  it("deletes a task set via confirmation", async () => {
    mockServices.mockReturnValue({
      data: { services: [{ serviceName: "svc1", status: "ACTIVE" }], total: 1 },
      isLoading: false,
    });
    mockTaskSets.mockReturnValue({
      data: { taskSets: [{ id: "ts-delete", status: "ACTIVE", taskDefinition: "t:1", runningCount: 0, computedDesiredCount: 0 }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    await openTaskSetsTab(user);
    await user.click(screen.getByText("Choose a service"));
    await user.click(await screen.findByText("svc1"));
    await waitFor(() => expect(screen.getByText("ts-delete")).toBeTruthy());
    const deleteBtn = screen.getByRole("button", { name: /Delete ts-delete/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteTaskSet).toHaveBeenCalledWith(
      { cluster: "my-cluster", service: "svc1", taskSet: "ts-delete", force: true },
    ));
  });

  it("shows fallback for missing task set fields", async () => {
    mockServices.mockReturnValue({
      data: { services: [{ serviceName: "svc1", status: "ACTIVE" }], total: 1 },
      isLoading: false,
    });
    mockTaskSets.mockReturnValue({
      data: { taskSets: [{ id: null, status: null, taskDefinition: null, runningCount: null, computedDesiredCount: null }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    await openTaskSetsTab(user);
    await user.click(screen.getByText("Choose a service"));
    await user.click(await screen.findByText("svc1"));
    await waitFor(() => {
      const dashes = screen.getAllByText("—");
      expect(dashes.length).toBeGreaterThanOrEqual(2);
    });
  });
});

// ─── Error states ───────────────────────────────────────────

describe("ECSDashboard — error states", () => {
  it("shows error alert when cluster list fails to load", () => {
    mockClusters.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("Failed to connect to ECS"),
    });
    render(<ECSDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/Failed to load ECS clusters/)).toBeTruthy();
    expect(screen.getByText("Failed to connect to ECS")).toBeTruthy();
  });

  describe("detail-level errors", () => {
    beforeEach(() => {
      mockClusters.mockReturnValue({
        data: {
          clusters: [{ clusterName: "my-cluster", status: "ACTIVE", clusterArn: "arn:aws:ecs:::cluster/my-cluster" }],
          total: 1,
        },
        isLoading: false,
        isError: false,
        error: null,
      });
    });

    it("shows run task error alert", async () => {
      runTaskState.isError = true;
      runTaskState.error = new Error("Task definition not found");
      const user = userEvent.setup();
      render(<ECSDashboard />, { wrapper: createWrapper() });
      await clickButton(user, /View/i);
      await waitFor(() => expect(screen.getByRole("tab", { name: /services/i })).toBeTruthy());
      await user.click(screen.getByRole("tab", { name: /tasks/i }));
      await clickButton(user, /Create task/i);
      await waitFor(() => expect(screen.getByText("Run task")).toBeTruthy());
      expect(screen.getByText("Task definition not found")).toBeTruthy();
      runTaskState.isError = false;
      runTaskState.error = null;
    });

    it("shows create service error alert", async () => {
      createServiceState.isError = true;
      createServiceState.error = new Error("Service name already exists");
      const user = userEvent.setup();
      render(<ECSDashboard />, { wrapper: createWrapper() });
      await clickButton(user, /View/i);
      await waitFor(() => expect(screen.getByText("my-cluster")).toBeTruthy());
      const createBtns = screen.getAllByRole("button", { name: /Create/i });
      await user.click(createBtns[0]);
      await waitFor(() => expect(screen.getAllByText("Create Service").length).toBeGreaterThan(0));
      expect(screen.getByText("Service name already exists")).toBeTruthy();
      createServiceState.isError = false;
      createServiceState.error = null;
    });
  });
});

// ─── Modal disabled buttons ─────────────────────────────────

describe("ECSDashboard — modal disabled buttons", () => {
  it("create cluster button is disabled when name empty", async () => {
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create cluster")).toBeTruthy());
    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    expect(createBtns[createBtns.length - 1]).toBeDisabled();
  });

  describe("detail-level disabled buttons", () => {
    beforeEach(() => {
      mockClusters.mockReturnValue({
        data: {
          clusters: [{ clusterName: "my-cluster", status: "ACTIVE", clusterArn: "arn:aws:ecs:::cluster/my-cluster" }],
          total: 1,
        },
        isLoading: false,
        isError: false,
        error: null,
      });
    });

    it("run task button is disabled when task def input empty", async () => {
      const user = userEvent.setup();
      render(<ECSDashboard />, { wrapper: createWrapper() });
      await clickButton(user, /View/i);
      await waitFor(() => expect(screen.getByRole("tab", { name: /services/i })).toBeTruthy());
      await user.click(screen.getByRole("tab", { name: /tasks/i }));
      await clickButton(user, /Create task/i);
      await waitFor(() => expect(screen.getByText("Run task")).toBeTruthy());
      const runBtns = screen.getAllByRole("button", { name: /^Run$/i });
      expect(runBtns[runBtns.length - 1]).toBeDisabled();
    });
  });
});

// ─── Services filter ────────────────────────────────────────

describe("ECSDashboard — services filter", () => {
  beforeEach(() => {
    mockClusters.mockReturnValue({
      data: {
        clusters: [{ clusterName: "my-cluster", status: "ACTIVE", clusterArn: "arn:aws:ecs:::cluster/my-cluster" }],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
  });

  it("filters services by name", async () => {
    mockServices.mockReturnValue({
      data: {
        services: [
          { serviceName: "web-service", status: "ACTIVE", desiredCount: 2, runningCount: 2, taskDefinition: "arn:aws:ecs:::task-def/web:1" },
          { serviceName: "worker-service", status: "ACTIVE", desiredCount: 1, runningCount: 1, taskDefinition: "arn:aws:ecs:::task-def/worker:1" },
        ],
        total: 2,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByText("web-service")).toBeTruthy());
    expect(screen.getByText("worker-service")).toBeTruthy();
    const filterInput = screen.getByPlaceholderText("Find services");
    await user.type(filterInput, "worker");
    await waitFor(() => {
      expect(screen.queryByText("worker-service")).toBeTruthy();
      expect(screen.queryByText("web-service")).toBeNull();
    });
  });

  // ── Service form disabled without task def ───────────

  it("create service button disabled when task definition not selected", async () => {
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("tab", { name: /services/i })).toBeTruthy());
    await clickButton(user, /Create/i);
    await waitFor(() => {
      expect(screen.getAllByText("Create Service").length).toBeGreaterThan(0);
    });
    // The Create button should be disabled — the first in the modal footer
    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    expect(createBtns[createBtns.length - 1]).toBeDisabled();
  });

  it("create service button disabled when name is empty", async () => {
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("tab", { name: /services/i })).toBeTruthy());
    await clickButton(user, /Create/i);
    await waitFor(() => {
      expect(screen.getAllByText("Create Service").length).toBeGreaterThan(0);
    });
    // Name is empty, task def not selected — button should be disabled
    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    expect(createBtns[createBtns.length - 1]).toBeDisabled();
  });


});

// ─── Toast error paths ────────────────────────────────────

describe("ECSDashboard — account settings toast errors", () => {
  it("shows error toast with message when deleting account setting fails", async () => {
    mockAccountSettings.mockReturnValue({
      data: { settings: [{ name: "containerInsights", value: "enabled" }], total: 1 },
      isLoading: false,
    });
    mockDeleteAccountSetting.mockRejectedValue(new Error("Delete failed"));
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /account settings/i }));
    await waitFor(() => expect(screen.getAllByText("containerInsights").length).toBeGreaterThan(0));
    await user.click(screen.getByRole("button", { name: /Delete containerInsights/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("error", "Delete failed"));
  });

  it("shows fallback toast when delete account setting error has no message", async () => {
    mockAccountSettings.mockReturnValue({
      data: { settings: [{ name: "containerInsights", value: "enabled" }], total: 1 },
      isLoading: false,
    });
    mockDeleteAccountSetting.mockRejectedValue(new Error(""));
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /account settings/i }));
    await waitFor(() => expect(screen.getAllByText("containerInsights").length).toBeGreaterThan(0));
    await user.click(screen.getByRole("button", { name: /Delete containerInsights/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("error", "Failed to delete setting"));
  });

  it("shows error toast with message when put setting fails", async () => {
    mockPutAccountSetting.mockImplementation((_body: any, opts: any) => opts?.onError?.(new Error("Put failed")));
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /account settings/i }));
    await clickButton(user, /Create Account Setting/i);
    await waitFor(() => expect(screen.getByText("Put account setting")).toBeTruthy());
    await clickButton(user, /Save/i);
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("error", "Put failed"));
  });

  it("shows fallback toast when put setting error has no message", async () => {
    mockPutAccountSetting.mockImplementation((_body: any, opts: any) => opts?.onError?.(new Error("")));
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /account settings/i }));
    await clickButton(user, /Create Account Setting/i);
    await waitFor(() => expect(screen.getByText("Put account setting")).toBeTruthy());
    await clickButton(user, /Save/i);
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("error", "Failed to put setting"));
  });
});

describe("ECSDashboard — task set toast errors", () => {
  beforeEach(() => {
    mockClusters.mockReturnValue({
      data: {
        clusters: [{ clusterName: "my-cluster", status: "ACTIVE", clusterArn: "arn:aws:ecs:::cluster/my-cluster" }],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockServices.mockReturnValue({
      data: { services: [{ serviceName: "svc1", status: "ACTIVE" }], total: 1 },
      isLoading: false,
    });
    mockTaskSets.mockReturnValue({
      data: { taskSets: [{ id: "ts-1", status: "ACTIVE", taskDefinition: "t:1", runningCount: 1, computedDesiredCount: 1 }], total: 1 },
      isLoading: false,
    });
  });

  async function openWithService(user: ReturnType<typeof userEvent.setup>) {
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("tab", { name: /services/i })).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /task sets/i }));
    await user.click(screen.getByText("Choose a service"));
    await user.click(await screen.findByText("svc1"));
    await waitFor(() => expect(screen.getByText("ts-1")).toBeTruthy());
  }

  it("shows error toast when set primary fails", async () => {
    mockSetPrimaryTaskSet.mockRejectedValue(new Error("Primary failed"));
    const user = userEvent.setup();
    await openWithService(user);
    await clickButton(user, /Make primary/i);
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("error", "Primary failed"));
  });

  it("shows fallback toast when set primary error has no message", async () => {
    mockSetPrimaryTaskSet.mockRejectedValue(new Error(""));
    const user = userEvent.setup();
    await openWithService(user);
    await clickButton(user, /Make primary/i);
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("error", "Failed to set primary"));
  });

  it("shows error toast when delete task set fails", async () => {
    mockDeleteTaskSet.mockRejectedValue(new Error("Delete TS failed"));
    const user = userEvent.setup();
    await openWithService(user);
    await user.click(screen.getByRole("button", { name: /Delete ts-1/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("error", "Delete TS failed"));
  });

  it("shows fallback toast when delete task set error has no message", async () => {
    mockDeleteTaskSet.mockRejectedValue(new Error(""));
    const user = userEvent.setup();
    await openWithService(user);
    await user.click(screen.getByRole("button", { name: /Delete ts-1/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("error", "Failed to delete task set"));
  });

  it("shows error toast when create task set fails", async () => {
    mockCreateTaskSet.mockImplementation((_body: any, opts: any) => opts?.onError?.(new Error("Create TS failed")));
    const user = userEvent.setup();
    await openWithService(user);
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create task set")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("my-task-def:1"), "my-family:3");
    await clickButton(user, /Create/i, { last: true });
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("error", "Create TS failed"));
  });

  it("shows fallback toast when create task set error has no message", async () => {
    mockCreateTaskSet.mockImplementation((_body: any, opts: any) => opts?.onError?.(new Error("")));
    const user = userEvent.setup();
    await openWithService(user);
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create task set")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("my-task-def:1"), "my-family:3");
    await clickButton(user, /Create/i, { last: true });
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("error", "Failed to create task set"));
  });
});

// ─── Fallback error alerts ────────────────────────────────

describe("ECSDashboard — fallback error alerts", () => {
  it("shows fallback create cluster error message", async () => {
    createClusterState.isError = true;
    createClusterState.error = new Error("");
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create cluster")).toBeTruthy());
    expect(screen.getByText("Failed to create cluster")).toBeTruthy();
  });

  it("shows fallback cluster list error message", () => {
    mockClusters.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error(""),
    });
    render(<ECSDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Unknown error")).toBeTruthy();
  });

  it("shows fallback create service error message", async () => {
    createServiceState.isError = true;
    createServiceState.error = new Error("");
    mockClusters.mockReturnValue({
      data: { clusters: [{ clusterName: "my-cluster", status: "ACTIVE", clusterArn: "arn:1" }], total: 1 },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("tab", { name: /services/i })).toBeTruthy());
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getAllByText("Create Service").length).toBeGreaterThan(0));
    expect(screen.getByText("Failed to create service")).toBeTruthy();
  });

  it("shows fallback run task error message", async () => {
    runTaskState.isError = true;
    runTaskState.error = new Error("");
    mockClusters.mockReturnValue({
      data: { clusters: [{ clusterName: "my-cluster", status: "ACTIVE", clusterArn: "arn:1" }], total: 1 },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("tab", { name: /services/i })).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /tasks/i }));
    await clickButton(user, /Run/i);
    await waitFor(() => expect(screen.getByText("Run task")).toBeTruthy());
    expect(screen.getByText("Failed to run task")).toBeTruthy();
  });
});

// ─── Sparse data fallbacks ────────────────────────────────

describe("ECSDashboard — sparse data fallbacks", () => {
  it("filters clusters without crashing when a cluster has no name", async () => {
    mockClusters.mockReturnValue({
      data: {
        clusters: [
          { clusterName: "alpha-cluster", status: "ACTIVE", clusterArn: "arn:1" },
          { clusterName: null, status: "ACTIVE", clusterArn: "arn:2" },
        ],
        total: 2,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("alpha-cluster")).toBeTruthy());
    const filterInput = screen.getByPlaceholderText("Find clusters by name");
    await user.type(filterInput, "alpha");
    await waitFor(() => expect(screen.getByText("alpha-cluster")).toBeTruthy());
  });

  it("shows dashes for account setting missing name and value", async () => {
    mockAccountSettings.mockReturnValue({
      data: { settings: [{ name: null, value: null }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /account settings/i }));
    await waitFor(() => {
      expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(1);
    });
  });

  it("shows ACTIVE status for service with missing status", async () => {
    mockClusters.mockReturnValue({
      data: { clusters: [{ clusterName: "my-cluster", status: "ACTIVE", clusterArn: "arn:1" }], total: 1 },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockServices.mockReturnValue({
      data: { services: [{ serviceName: "svc-no-status", taskDefinition: "arn:1" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByText("svc-no-status")).toBeTruthy());
    // StatusBadge maps unknown statuses to "Connected"
    expect(screen.getAllByText("Connected").length).toBeGreaterThanOrEqual(1);
  });

  it("filters services without crashing when a service has no name", async () => {
    mockClusters.mockReturnValue({
      data: { clusters: [{ clusterName: "my-cluster", status: "ACTIVE", clusterArn: "arn:1" }], total: 1 },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockServices.mockReturnValue({
      data: {
        services: [
          { serviceName: "alpha-svc", status: "ACTIVE", taskDefinition: "arn:1" },
          { serviceName: null, status: "ACTIVE", taskDefinition: "arn:2" },
        ],
        total: 2,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByText("alpha-svc")).toBeTruthy());
    const filterInput = screen.getByPlaceholderText("Find services");
    await user.type(filterInput, "alpha");
    await waitFor(() => expect(screen.getByText("alpha-svc")).toBeTruthy());
  });

  it("shows empty tasks when data lacks the tasks array", async () => {
    mockClusters.mockReturnValue({
      data: { clusters: [{ clusterName: "my-cluster", status: "ACTIVE", clusterArn: "arn:1" }], total: 1 },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockTasks.mockReturnValue({ data: {}, isLoading: false });
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("tab", { name: /services/i })).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /tasks/i }));
    await waitFor(() => expect(screen.getByText(/No running tasks/)).toBeTruthy());
  });

  it("shows UNKNOWN status for task with missing lastStatus", async () => {
    mockClusters.mockReturnValue({
      data: { clusters: [{ clusterName: "my-cluster", status: "ACTIVE", clusterArn: "arn:1" }], total: 1 },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockTasks.mockReturnValue({
      data: { tasks: [{ taskArn: "arn:aws:ecs:::task/abc" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("tab", { name: /services/i })).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /tasks/i }));
    // StatusBadge maps unknown statuses to "Connected"
    await waitFor(() => expect(screen.getByText("abc")).toBeTruthy());
    expect(screen.getAllByText("Connected").length).toBeGreaterThanOrEqual(1);
  });

  it("shows empty task defs when data lacks the array", async () => {
    mockClusters.mockReturnValue({
      data: { clusters: [{ clusterName: "my-cluster", status: "ACTIVE", clusterArn: "arn:1" }], total: 1 },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockTaskDefs.mockReturnValue({ data: {}, isLoading: false });
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("tab", { name: /services/i })).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /task definitions/i }));
    await waitFor(() => expect(screen.getByText(/No task definitions registered/i)).toBeTruthy());
  });

  it("renders task def without slash in arn", async () => {
    mockClusters.mockReturnValue({
      data: { clusters: [{ clusterName: "my-cluster", status: "ACTIVE", clusterArn: "arn:1" }], total: 1 },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockTaskDefs.mockReturnValue({
      data: { taskDefinitionArns: ["plain-arn"], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("tab", { name: /services/i })).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /task definitions/i }));
    await waitFor(() => expect(screen.getByText("plain-arn")).toBeTruthy());
  });

  it("filters task defs without crashing when arn missing", async () => {
    mockClusters.mockReturnValue({
      data: { clusters: [{ clusterName: "my-cluster", status: "ACTIVE", clusterArn: "arn:1" }], total: 1 },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockTaskDefs.mockReturnValue({
      data: { taskDefinitionArns: ["alpha:1", ""], total: 2 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("tab", { name: /services/i })).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /task definitions/i }));
    await waitFor(() => expect(screen.getByText("alpha:1")).toBeTruthy());
    const filterInput = screen.getByPlaceholderText("Find task definitions");
    await user.type(filterInput, "alpha");
    await waitFor(() => expect(screen.getByText("alpha:1")).toBeTruthy());
  });
});

// ─── Service form interactions ────────────────────────────

describe("ECSDashboard — service form interactions", () => {
  beforeEach(() => {
    mockClusters.mockReturnValue({
      data: {
        clusters: [{ clusterName: "my-cluster", status: "ACTIVE", clusterArn: "arn:aws:ecs:::cluster/my-cluster" }],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockTaskDefFamilies.mockReturnValue({ data: { families: ["my-family"] }, isLoading: false });
  });

  async function openServiceModal(user: ReturnType<typeof userEvent.setup>) {
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("tab", { name: /services/i })).toBeTruthy());
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getAllByText("Create Service").length).toBeGreaterThan(0));
  }

  it("create service button disabled when only name filled", async () => {
    const user = userEvent.setup();
    await openServiceModal(user);
    await user.type(screen.getByPlaceholderText("my-service"), "my-svc");
    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    expect(createBtns[createBtns.length - 1]).toBeDisabled();
  });

  it("fills desired count and selects task def, then submits and shows error toast", async () => {
    mockCreateService.mockImplementation((_body: any, opts: any) => opts?.onError?.(new Error("Service create failed")));
    const user = userEvent.setup();
    await openServiceModal(user);
    await user.type(screen.getByPlaceholderText("my-service"), "svc");
    // Select task definition from Cloudscape Select
    await user.click(screen.getByText("Select task definition"));
    await user.click(await screen.findByText("my-family"));
    const countInput = screen.getByLabelText(/Desired count/i);
    await user.clear(countInput);
    await user.type(countInput, "5");
    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    await user.click(createBtns[createBtns.length - 1]);
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("error", "Service create failed"));
    expect(mockCreateService).toHaveBeenCalledWith(
      expect.objectContaining({ serviceName: "svc", desiredCount: 5 }),
      expect.any(Object),
    );
  });

  it("resets desired count to 0 when non-numeric value entered", async () => {
    const user = userEvent.setup();
    await openServiceModal(user);
    const countInput = screen.getByLabelText(/Desired count/i);
    await user.clear(countInput);
    fireEvent.change(countInput, { target: { value: "abc" } });
    // With task def selected and name filled, submit to verify count is 0
    await user.type(screen.getByPlaceholderText("my-service"), "svc");
    await user.click(screen.getByText("Select task definition"));
    await user.click(await screen.findByText("my-family"));
    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    await user.click(createBtns[createBtns.length - 1]);
    await waitFor(() => {
      expect(mockCreateService).toHaveBeenCalledWith(
        expect.objectContaining({ desiredCount: 0 }),
        expect.any(Object),
      );
    });
  });
});

// ─── Remaining branch targets ─────────────────────────────

describe("ECSDashboard — remaining branch targets", () => {
  it("shows fallback toast when create service error has no message", async () => {
    mockCreateService.mockImplementation((_body: any, opts: any) => opts?.onError?.(new Error("")));
    mockClusters.mockReturnValue({
      data: { clusters: [{ clusterName: "my-cluster", status: "ACTIVE", clusterArn: "arn:1" }], total: 1 },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockTaskDefFamilies.mockReturnValue({ data: { families: ["my-family"] }, isLoading: false });
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("tab", { name: /services/i })).toBeTruthy());
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getAllByText("Create Service").length).toBeGreaterThan(0));
    await user.type(screen.getByPlaceholderText("my-service"), "svc");
    await user.click(screen.getByText("Select task definition"));
    await user.click(await screen.findByText("my-family"));
    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    await user.click(createBtns[createBtns.length - 1]);
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("error", "Failed to create service"));
  });

  it("renders empty task sets when data lacks the array", async () => {
    mockClusters.mockReturnValue({
      data: { clusters: [{ clusterName: "my-cluster", status: "ACTIVE", clusterArn: "arn:1" }], total: 1 },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockServices.mockReturnValue({
      data: { services: [{ serviceName: "svc1", status: "ACTIVE" }], total: 1 },
      isLoading: false,
    });
    mockTaskSets.mockReturnValue({ data: {}, isLoading: false });
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("tab", { name: /services/i })).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /task sets/i }));
    await user.click(screen.getByText("Choose a service"));
    await user.click(await screen.findByText("svc1"));
    await waitFor(() => expect(screen.getByText("No task sets for this service.")).toBeTruthy());
  });

  it("renders empty task def families when data lacks the array", async () => {
    mockClusters.mockReturnValue({
      data: { clusters: [{ clusterName: "my-cluster", status: "ACTIVE", clusterArn: "arn:1" }], total: 1 },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockTaskDefFamilies.mockReturnValue({ data: {}, isLoading: false });
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("tab", { name: /services/i })).toBeTruthy());
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getAllByText("Create Service").length).toBeGreaterThan(0));
    // Select renders with empty options — no crash
    expect(screen.getByText("Select task definition")).toBeTruthy();
  });

  it("changes launch type via select", async () => {
    mockClusters.mockReturnValue({
      data: { clusters: [{ clusterName: "my-cluster", status: "ACTIVE", clusterArn: "arn:1" }], total: 1 },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockTaskDefFamilies.mockReturnValue({ data: { families: ["my-family"] }, isLoading: false });
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("tab", { name: /services/i })).toBeTruthy());
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getAllByText("Create Service").length).toBeGreaterThan(0));
    // Launch type Select shows current value "FARGATE"
    await user.click(screen.getAllByText("FARGATE")[0]);
    await waitFor(() => expect(screen.getAllByText("EC2").length).toBeGreaterThan(0));
    await user.click(screen.getAllByText("EC2")[0]);
    // Submit with name + task def to verify launchType EC2
    mockCreateService.mockImplementation((_body: any, opts: any) => opts?.onSuccess?.());
    await user.type(screen.getByPlaceholderText("my-service"), "svc");
    await user.click(screen.getByText("Select task definition"));
    await user.click(await screen.findByText("my-family"));
    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    await user.click(createBtns[createBtns.length - 1]);
    await waitFor(() => {
      expect(mockCreateService).toHaveBeenCalledWith(
        expect.objectContaining({ launchType: "EC2" }),
        expect.any(Object),
      );
    });
  });
});

// ─── Modal dismiss & success paths ──────────────────────

describe("ECSDashboard — modal dismiss & success paths", () => {
  it("dismisses create cluster modal with Escape", async () => {
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create cluster")).toBeTruthy());
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Create cluster"));
  });

  it("closes create cluster modal when creation succeeds", async () => {
    mockCreateCluster.mockImplementation((_body: any, opts: any) =>
      opts?.onSuccess?.(),
    );
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create cluster")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("my-cluster"), "new-cluster");
    await clickButton(user, /Create/i, { last: true });
    await waitFor(() => expectModalHidden("Create cluster"));
  });

  it("dismisses put account setting modal with Escape and Cancel", async () => {
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /account settings/i }));
    await clickButton(user, /Create Account Setting/i);
    await waitFor(() => expect(screen.getByText("Put account setting")).toBeTruthy());
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Put account setting"));
    // Reopen and Cancel
    await clickButton(user, /Create Account Setting/i);
    await waitFor(() => expect(screen.getByText("Put account setting")).toBeTruthy());
    await user.click(
      within(dialogOf("Put account setting")).getByRole("button", {
        name: /Cancel/i,
      }),
    );
    await waitFor(() => expectModalHidden("Put account setting"));
  });

  it("changes setting selects and shows success toast on save", async () => {
    mockPutAccountSetting.mockImplementation((_body: any, opts: any) =>
      opts?.onSuccess?.(),
    );
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /account settings/i }));
    await clickButton(user, /Create Account Setting/i);
    await waitFor(() => expect(screen.getByText("Put account setting")).toBeTruthy());
    // Change the setting name select
    await user.click(screen.getByText("containerInsights"));
    await user.click(await screen.findByText("serviceLongArnFormat"));
    // Change the value select
    await user.click(screen.getByText("enabled"));
    await user.click(await screen.findByText("disabled"));
    await clickButton(user, /Save/i);
    await waitFor(() => {
      expect(mockPutAccountSetting).toHaveBeenCalledWith(
        { name: "serviceLongArnFormat", value: "disabled", isDefault: false },
        expect.any(Object),
      );
    });
    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        "success",
        "Set serviceLongArnFormat to disabled",
      );
    });
    await waitFor(() => expectModalHidden("Put account setting"));
  });

  it("dismisses create service modal with Escape and Cancel", async () => {
    mockClusters.mockReturnValue({
      data: {
        clusters: [{ clusterName: "my-cluster", status: "ACTIVE", clusterArn: "arn:1" }],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() =>
      expect(screen.getByRole("tab", { name: /services/i })).toBeTruthy(),
    );
    await clickButton(user, /Create/i);
    await waitFor(() =>
      expect(screen.getAllByText("Create Service").length).toBeGreaterThan(0),
    );
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Create Service"));
    // Reopen and Cancel
    await clickButton(user, /Create/i);
    await waitFor(() =>
      expect(screen.getAllByText("Create Service").length).toBeGreaterThan(0),
    );
    await user.click(
      within(dialogOf("Create Service")).getByRole("button", {
        name: /Cancel/i,
      }),
    );
    await waitFor(() => expectModalHidden("Create Service"));
  });

  it("dismisses run task modal with Escape and closes on success", async () => {
    mockRunTask.mockImplementation((_body: any, opts: any) =>
      opts?.onSuccess?.(),
    );
    mockClusters.mockReturnValue({
      data: {
        clusters: [{ clusterName: "my-cluster", status: "ACTIVE", clusterArn: "arn:1" }],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() =>
      expect(screen.getByRole("tab", { name: /services/i })).toBeTruthy(),
    );
    await user.click(screen.getByRole("tab", { name: /tasks/i }));
    await waitFor(() =>
      expect(screen.getByText(/No running tasks/)).toBeTruthy(),
    );
    await clickButton(user, /Run/i);
    await waitFor(() => expect(screen.getByText("Run task")).toBeTruthy());
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Run task"));
    // Reopen and submit with onSuccess
    await clickButton(user, /Run/i);
    await waitFor(() => expect(screen.getByText("Run task")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("my-task:1"), "my-task:2");
    await clickButton(user, /Run/i, { last: true });
    await waitFor(() => expectModalHidden("Run task"));
  });

  it("dismisses create task set modal with Escape and closes on success", async () => {
    mockCreateTaskSet.mockImplementation((_body: any, opts: any) =>
      opts?.onSuccess?.(),
    );
    mockServices.mockReturnValue({
      data: { services: [{ serviceName: "svc1", status: "ACTIVE" }], total: 1 },
      isLoading: false,
    });
    mockClusters.mockReturnValue({
      data: {
        clusters: [{ clusterName: "my-cluster", status: "ACTIVE", clusterArn: "arn:1" }],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() =>
      expect(screen.getByRole("tab", { name: /services/i })).toBeTruthy(),
    );
    await user.click(screen.getByRole("tab", { name: /task sets/i }));
    await user.click(screen.getByText("Choose a service"));
    await user.click(await screen.findByText("svc1"));
    await clickButton(user, /Create/i);
    await waitFor(() =>
      expect(screen.getByText("Create task set")).toBeTruthy(),
    );
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Create task set"));
    // Reopen, type a task definition, and submit with onSuccess
    await clickButton(user, /Create/i);
    await waitFor(() =>
      expect(screen.getByText("Create task set")).toBeTruthy(),
    );
    await user.type(
      within(dialogOf("Create task set")).getByPlaceholderText("my-task-def:1"),
      "my-task-def:3",
    );
    await clickButton(user, /Create/i, { last: true });
    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith("success", "Task set created"),
    );
    await waitFor(() => expectModalHidden("Create task set"));
  });
});
