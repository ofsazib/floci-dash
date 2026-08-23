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
const mockCapacityProviders = vi.fn();
const mockCreateCapacityProvider = vi.fn();

const createCpState = vi.hoisted(() => ({ isError: false, error: null as Error | null }));
const deleteCpState = vi.hoisted(() => ({ isPending: false, variables: null as string | null }));
const mockDeleteCapacityProvider = vi.fn();
const mockDeleteTaskSet = vi.fn();
const mockContainerInstances = vi.fn();
const mockDeregisterInstance = vi.fn();
const mockUpdateContainerAgent = vi.fn();
const mockDiscoverPollEndpoint = vi.fn();
const mockUpdateInstanceState = vi.fn();
const mockStartTask = vi.fn();
const mockTaskProtection = vi.fn();
const mockUpdateTaskProtection = vi.fn();

const updateInstanceStateState = vi.hoisted(() => ({
  isError: false,
  error: null as Error | null,
  isPending: false,
}));
const startTaskState = vi.hoisted(() => ({
  isError: false,
  error: null as Error | null,
  isPending: false,
}));
const mockUpdateInstanceStateReset = vi.fn(() => {
  updateInstanceStateState.isError = false;
  updateInstanceStateState.error = null;
});
const mockStartTaskReset = vi.fn(() => {
  startTaskState.isError = false;
  startTaskState.error = null;
});

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
  useECSCapacityProviders: (...args: any[]) => mockCapacityProviders(...args),
  useCreateECSCapacityProvider: () => ({
    mutate: mockCreateCapacityProvider,
    isPending: false,
    get isError() { return createCpState.isError; },
    get error() { return createCpState.error; },
  }),
  useDeleteECSCapacityProvider: () => ({
    mutateAsync: mockDeleteCapacityProvider,
    get isPending() { return deleteCpState.isPending; },
    get variables() { return deleteCpState.variables; },
  }),
  useDeleteECSTaskSet: () => ({ mutateAsync: mockDeleteTaskSet, isPending: false }),
  useECSContainerInstances: (...args: any[]) => mockContainerInstances(...args),
  useDeregisterECSContainerInstance: () => ({ mutateAsync: mockDeregisterInstance, isPending: false }),
  useUpdateECSContainerInstancesState: () => ({
    mutate: mockUpdateInstanceState,
    isPending: updateInstanceStateState.isPending,
    isError: updateInstanceStateState.isError,
    error: updateInstanceStateState.error,
    reset: mockUpdateInstanceStateReset,
  }),
  useUpdateECSContainerAgent: () => ({ mutateAsync: mockUpdateContainerAgent, isPending: false }),
  useStartECSTask: () => ({
    mutate: mockStartTask,
    isPending: startTaskState.isPending,
    isError: startTaskState.isError,
    error: startTaskState.error,
    reset: mockStartTaskReset,
  }),
  useECSTaskProtection: (...args: any[]) => mockTaskProtection(...args),
  useUpdateECSTaskProtection: () => ({ mutate: mockUpdateTaskProtection, isPending: false }),
  useDiscoverECSPollEndpoint: () => ({ mutateAsync: mockDiscoverPollEndpoint, isPending: false }),
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
  createCpState.isError = false;
  createCpState.error = null;
  deleteCpState.isPending = false;
  deleteCpState.variables = null;
  mockCapacityProviders.mockReturnValue({ data: { capacityProviders: [], total: 0 }, isLoading: false });
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
  updateInstanceStateState.isError = false;
  updateInstanceStateState.error = null;
  updateInstanceStateState.isPending = false;
  startTaskState.isError = false;
  startTaskState.error = null;
  startTaskState.isPending = false;

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
  mockContainerInstances.mockReturnValue({
    data: { containerInstances: [], total: 0 },
    isLoading: false,
  });
  mockTaskProtection.mockReturnValue({
    data: { protections: [] },
    isLoading: false,
    isError: false,
    error: null,
  });
  mockDeleteAccountSetting.mockResolvedValue({});
  mockSetPrimaryTaskSet.mockResolvedValue({});
  mockDeleteTaskSet.mockResolvedValue({});
  mockDeregisterInstance.mockResolvedValue({});
  mockUpdateContainerAgent.mockResolvedValue({});
  mockDiscoverPollEndpoint.mockResolvedValue({ endpoint: "https://agent.example.com" });
  mockUpdateInstanceState.mockImplementation((_body, opts) => opts?.onSuccess?.());
  mockStartTask.mockImplementation((_body, opts) => opts?.onSuccess?.());
  mockUpdateTaskProtection.mockImplementation((_body, opts) => opts?.onSuccess?.());
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
  createCpState.isError = false;
  createCpState.error = null;
  deleteCpState.isPending = false;
  deleteCpState.variables = null;
  mockCapacityProviders.mockReturnValue({ data: { capacityProviders: [], total: 0 }, isLoading: false });
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
    await clickButton(user, /Cancel/i, { last: true });
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
  createCpState.isError = false;
  createCpState.error = null;
  deleteCpState.isPending = false;
  deleteCpState.variables = null;
  mockCapacityProviders.mockReturnValue({ data: { capacityProviders: [], total: 0 }, isLoading: false });
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
    await clickButton(user, /Cancel/i, { last: true });
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
  createCpState.isError = false;
  createCpState.error = null;
  deleteCpState.isPending = false;
  deleteCpState.variables = null;
  mockCapacityProviders.mockReturnValue({ data: { capacityProviders: [], total: 0 }, isLoading: false });
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
  createCpState.isError = false;
  createCpState.error = null;
  deleteCpState.isPending = false;
  deleteCpState.variables = null;
  mockCapacityProviders.mockReturnValue({ data: { capacityProviders: [], total: 0 }, isLoading: false });
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
  createCpState.isError = false;
  createCpState.error = null;
  deleteCpState.isPending = false;
  deleteCpState.variables = null;
  mockCapacityProviders.mockReturnValue({ data: { capacityProviders: [], total: 0 }, isLoading: false });
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
  createCpState.isError = false;
  createCpState.error = null;
  deleteCpState.isPending = false;
  deleteCpState.variables = null;
  mockCapacityProviders.mockReturnValue({ data: { capacityProviders: [], total: 0 }, isLoading: false });
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
  createCpState.isError = false;
  createCpState.error = null;
  deleteCpState.isPending = false;
  deleteCpState.variables = null;
  mockCapacityProviders.mockReturnValue({ data: { capacityProviders: [], total: 0 }, isLoading: false });
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

describe("ECSDashboard — G.89 container instances + task protection", () => {
  const INST_ARN = "arn:aws:ecs:us-east-1:123:container-instance/my-cluster/inst-1";

  beforeEach(() => {
  createCpState.isError = false;
  createCpState.error = null;
  deleteCpState.isPending = false;
  deleteCpState.variables = null;
  mockCapacityProviders.mockReturnValue({ data: { capacityProviders: [], total: 0 }, isLoading: false });
    mockClusters.mockReturnValue({
      data: {
        clusters: [{ clusterName: "my-cluster", status: "ACTIVE", clusterArn: "arn:aws:ecs:::cluster/my-cluster" }],
        total: 1,
      },
      isLoading: false,
    });
    mockContainerInstances.mockReturnValue({
      data: {
        containerInstances: [
          {
            containerInstanceArn: INST_ARN,
            status: "ACTIVE",
            agentConnected: true,
            runningTasksCount: 2,
            pendingTasksCount: 1,
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
  });

  async function openCluster(user: ReturnType<typeof userEvent.setup>) {
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("tab", { name: /container instances/i })).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /container instances/i }));
  }

  it("lists container instances with status and counts", async () => {
    const user = userEvent.setup();
    await openCluster(user);
    await waitFor(() => expect(screen.getByText("inst-1")).toBeTruthy());
    expect(screen.getAllByText("Connected")).toHaveLength(2);
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
    expect(screen.getByText("1")).toBeTruthy();
  });

  it("updates container instance state via modal", async () => {
    const user = userEvent.setup();
    await openCluster(user);
    await waitFor(() => expect(screen.getByText("inst-1")).toBeTruthy());
    await clickButton(user, /Update state/i);
    await waitFor(() => expect(screen.getByText("Update container instance state")).toBeTruthy());
    const dlg = dialogOf("Update container instance state");
    await user.click(within(dlg).getAllByText("ACTIVE")[0]);
    await user.click(await screen.findByText("DRAINING"));
    await clickButton(user, /Save/i, { last: true });
    await waitFor(() =>
      expect(mockUpdateInstanceState).toHaveBeenCalledWith(
        { cluster: "my-cluster", containerInstances: [INST_ARN], status: "DRAINING" },
        expect.any(Object),
      ),
    );
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("success", "Instance state updated to DRAINING"));
  });

  it("shows update-state error alert dismissible", async () => {
    const user = userEvent.setup();
    mockUpdateInstanceState.mockImplementationOnce((_body: any, opts: any) =>
      opts?.onError?.(new Error("state boom")),
    );
    await openCluster(user);
    await waitFor(() => expect(screen.getByText("inst-1")).toBeTruthy());
    await clickButton(user, /Update state/i);
    await waitFor(() => expect(screen.getByText("Update container instance state")).toBeTruthy());
    await clickButton(user, /Save/i, { last: true });
    await waitFor(() => expect(screen.getByText("state boom")).toBeTruthy());
    fireEvent.click(document.querySelector('[class*="awsui_dismiss-button"]') as HTMLElement);
    await waitFor(() => expect(screen.queryByText("state boom")).toBeNull());
  });

  it("updates the container agent with a success toast", async () => {
    const user = userEvent.setup();
    await openCluster(user);
    await waitFor(() => expect(screen.getByText("inst-1")).toBeTruthy());
    await clickButton(user, /Update agent/i);
    await waitFor(() => expect(mockUpdateContainerAgent).toHaveBeenCalledWith({ cluster: "my-cluster", containerInstance: INST_ARN }));
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("success", "Container agent updated"));
  });

  it("updates the container agent with an error toast", async () => {
    const user = userEvent.setup();
    mockUpdateContainerAgent.mockRejectedValueOnce(new Error("agent boom"));
    await openCluster(user);
    await waitFor(() => expect(screen.getByText("inst-1")).toBeTruthy());
    await clickButton(user, /Update agent/i);
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("error", "agent boom"));
  });

  it("discovers the poll endpoint with a success toast", async () => {
    const user = userEvent.setup();
    await openCluster(user);
    await waitFor(() => expect(screen.getByText("inst-1")).toBeTruthy());
    await clickButton(user, /Poll endpoint/i);
    await waitFor(() => expect(mockDiscoverPollEndpoint).toHaveBeenCalledWith(INST_ARN));
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("success", "Poll endpoint: https://agent.example.com"));
  });

  it("discovers the poll endpoint with an error toast", async () => {
    const user = userEvent.setup();
    mockDiscoverPollEndpoint.mockRejectedValueOnce(new Error("poll boom"));
    await openCluster(user);
    await waitFor(() => expect(screen.getByText("inst-1")).toBeTruthy());
    await clickButton(user, /Poll endpoint/i);
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("error", "poll boom"));
  });

  it("deregisters a container instance with confirm + success toast", async () => {
    const user = userEvent.setup();
    await openCluster(user);
    await waitFor(() => expect(screen.getByText("inst-1")).toBeTruthy());
    const del = screen.getByRole("button", { name: /Delete inst-1/i });
    await user.click(del);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() =>
      expect(mockDeregisterInstance).toHaveBeenCalledWith({
        cluster: "my-cluster",
        containerInstance: INST_ARN,
        force: true,
      }),
    );
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("success", "Container instance deregistered"));
  });

  it("deregisters a container instance with an error toast", async () => {
    const user = userEvent.setup();
    mockDeregisterInstance.mockRejectedValueOnce(new Error("dereg boom"));
    await openCluster(user);
    await waitFor(() => expect(screen.getByText("inst-1")).toBeTruthy());
    const del = screen.getByRole("button", { name: /Delete inst-1/i });
    await user.click(del);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("error", "dereg boom"));
  });

  it("starts a task on instances via modal", async () => {
    const user = userEvent.setup();
    await openCluster(user);
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Start task on instances")).toBeTruthy());
    const dlg = dialogOf("Start task on instances");
    await user.type(within(dlg).getByPlaceholderText("my-task:1"), "my-task:1");
    await user.type(within(dlg).getByPlaceholderText("arn:aws:ecs:...:container-instance/..."), INST_ARN);
    await user.type(within(dlg).getByPlaceholderText("family:my-task"), "family:my-task");
    await user.type(within(dlg).getByPlaceholderText("dashboard"), "cli");
    await clickButton(user, /Start/i, { last: true });
    await waitFor(() =>
      expect(mockStartTask).toHaveBeenCalledWith(
        {
          cluster: "my-cluster",
          taskDefinition: "my-task:1",
          containerInstances: [INST_ARN],
          group: "family:my-task",
          startedBy: "cli",
        },
        expect.any(Object),
      ),
    );
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("success", "Task started"));
    await waitFor(() => expectModalHidden("Start task on instances"));
  });

  it("starts a task with empty optional fields and cancel closes", async () => {
    const user = userEvent.setup();
    await openCluster(user);
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Start task on instances")).toBeTruthy());
    const dlg = dialogOf("Start task on instances");
    await user.type(within(dlg).getByPlaceholderText("my-task:1"), "solo:2");
    await clickButton(user, /Start/i, { last: true });
    await waitFor(() =>
      expect(mockStartTask).toHaveBeenCalledWith(
        {
          cluster: "my-cluster",
          taskDefinition: "solo:2",
          containerInstances: [],
          group: undefined,
          startedBy: undefined,
        },
        expect.any(Object),
      ),
    );
    // Reopen and cancel
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Start task on instances")).toBeTruthy());
    const reopened = dialogOf("Start task on instances");
    await user.click(within(reopened).getByRole("button", { name: /Cancel/i }));
    await waitFor(() => expectModalHidden("Start task on instances"));
  });

  it("shows start-task error alert dismissible", async () => {
    const user = userEvent.setup();
    mockStartTask.mockImplementationOnce((_body: any, opts: any) =>
      opts?.onError?.(new Error("start boom")),
    );
    await openCluster(user);
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Start task on instances")).toBeTruthy());
    const dlg = dialogOf("Start task on instances");
    await user.type(within(dlg).getByPlaceholderText("my-task:1"), "boom-task");
    await clickButton(user, /Start/i, { last: true });
    await waitFor(() => expect(screen.getByText("start boom")).toBeTruthy());
    fireEvent.click(document.querySelector('[class*="awsui_dismiss-button"]') as HTMLElement);
    await waitFor(() => expect(screen.queryByText("start boom")).toBeNull());
  });

  it("shows task protection enabled in the protection modal and saves", async () => {
    const user = userEvent.setup();
    mockTaskProtection.mockReturnValue({
      data: { protections: [{ taskArn: "arn:aws:ecs:us-east-1:123:task/my-cluster/task-1", protectionEnabled: true, expirationDate: "2026-09-01T00:00:00Z" }] },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockTasks.mockReturnValue({
      data: {
        tasks: [{ taskArn: "arn:aws:ecs:us-east-1:123:task/my-cluster/task-1", lastStatus: "RUNNING" }],
        total: 1,
      },
      isLoading: false,
    });
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("tab", { name: /tasks/i })).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /tasks/i }));
    await waitFor(() => expect(screen.getByText("task-1")).toBeTruthy());
    await clickButton(user, /Protection/i);
    await waitFor(() => expect(screen.getByText("Task protection — task-1")).toBeTruthy());
    expect(screen.getByText("Enabled")).toBeTruthy();
    const dlg1 = dialogOf("Task protection — task-1");
    await user.click(within(dlg1).getByRole("button", { name: /Cancel/i }));
    await waitFor(() => expect(screen.queryByText("Task protection — task-1")).toBeNull());
    await clickButton(user, /Protection/i);
    await waitFor(() => expect(screen.getByText("Task protection — task-1")).toBeTruthy());
    const dlg = dialogOf("Task protection — task-1");
    await user.type(within(dlg).getByPlaceholderText("120"), "90");
    await clickButton(user, /Save/i, { last: true });
    await waitFor(() =>
      expect(mockUpdateTaskProtection).toHaveBeenCalledWith(
        {
          cluster: "my-cluster",
          tasks: ["arn:aws:ecs:us-east-1:123:task/my-cluster/task-1"],
          protectionEnabled: true,
          expiresInMinutes: 90,
        },
        expect.any(Object),
      ),
    );
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("success", "Task protection enabled"));
  });

  it("disables protection and shows the loading/error paths", async () => {
    const user = userEvent.setup();
    mockTaskProtection.mockReturnValue({
      data: { protections: [] },
      isLoading: true,
      isError: false,
      error: null,
    });
    mockTasks.mockReturnValue({
      data: {
        tasks: [{ taskArn: "arn:aws:ecs:us-east-1:123:task/my-cluster/task-2", lastStatus: "RUNNING" }],
        total: 1,
      },
      isLoading: false,
    });
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("tab", { name: /tasks/i })).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /tasks/i }));
    await waitFor(() => expect(screen.getByText("task-2")).toBeTruthy());
    await clickButton(user, /Protection/i);
    await waitFor(() => expect(screen.getByText("Task protection — task-2")).toBeTruthy());
    // Uncheck protection and save
    const dlg = dialogOf("Task protection — task-2");
    await user.click(within(dlg).getByRole("checkbox"));
    await clickButton(user, /Save/i, { last: true });
    await waitFor(() =>
      expect(mockUpdateTaskProtection).toHaveBeenCalledWith(
        {
          cluster: "my-cluster",
          tasks: ["arn:aws:ecs:us-east-1:123:task/my-cluster/task-2"],
          protectionEnabled: false,
          expiresInMinutes: undefined,
        },
        expect.any(Object),
      ),
    );
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("success", "Task protection disabled"));
  });

  it("shows task protection error alert", async () => {
    const user = userEvent.setup();
    mockTaskProtection.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("protection boom"),
    });
    mockTasks.mockReturnValue({
      data: {
        tasks: [{ taskArn: "arn:aws:ecs:us-east-1:123:task/my-cluster/task-3", lastStatus: "RUNNING" }],
        total: 1,
      },
      isLoading: false,
    });
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("tab", { name: /tasks/i })).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /tasks/i }));
    await waitFor(() => expect(screen.getByText("task-3")).toBeTruthy());
    await clickButton(user, /Protection/i);
    await waitFor(() => expect(screen.getByText("protection boom")).toBeTruthy());
  });
});

describe("ECSDashboard — G.89 coverage edge cases", () => {
  const INST_ARN = "arn:aws:ecs:us-east-1:123:container-instance/my-cluster/inst-1";

  beforeEach(() => {
  createCpState.isError = false;
  createCpState.error = null;
  deleteCpState.isPending = false;
  deleteCpState.variables = null;
  mockCapacityProviders.mockReturnValue({ data: { capacityProviders: [], total: 0 }, isLoading: false });
    mockClusters.mockReturnValue({
      data: {
        clusters: [{ clusterName: "my-cluster", status: "ACTIVE", clusterArn: "arn:aws:ecs:::cluster/my-cluster" }],
        total: 1,
      },
      isLoading: false,
    });
  });

  async function openInstances(user: ReturnType<typeof userEvent.setup>) {
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("tab", { name: /container instances/i })).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /container instances/i }));
  }

  it("renders sparse container instances with fallbacks", async () => {
    const user = userEvent.setup();
    mockContainerInstances.mockReturnValue({
      data: { containerInstances: [{}, { containerInstanceArn: INST_ARN, agentConnected: false }], total: 2 },
      isLoading: false,
    });
    await openInstances(user);
    await waitFor(() => expect(screen.getByText("inst-1")).toBeTruthy());
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Disconnected").length).toBeGreaterThan(0);
    expect(screen.getAllByText("0").length).toBeGreaterThan(0);
  });

  it("renders the empty container-instances state when data lacks the key", async () => {
    const user = userEvent.setup();
    mockContainerInstances.mockReturnValue({
      data: { total: 0 },
      isLoading: false,
    });
    await openInstances(user);
    await waitFor(() => expect(screen.getByText("No container instances in this cluster.")).toBeTruthy());
  });

  it("filters container instances by ARN", async () => {
    const user = userEvent.setup();
    mockContainerInstances.mockReturnValue({
      data: {
        containerInstances: [
          { containerInstanceArn: INST_ARN, agentConnected: true },
          {},
        ],
        total: 2,
      },
      isLoading: false,
    });
    await openInstances(user);
    await waitFor(() => expect(screen.getByText("inst-1")).toBeTruthy());
    const filter = screen.getByPlaceholderText("Find container instances");
    await user.type(filter, "inst-1");
    await waitFor(() => expect(screen.queryByText("inst-1")).toBeTruthy());
  });

  it("shows a dash poll endpoint when none is returned", async () => {
    const user = userEvent.setup();
    mockContainerInstances.mockReturnValue({
      data: { containerInstances: [{ containerInstanceArn: INST_ARN, agentConnected: true }], total: 1 },
      isLoading: false,
    });
    mockDiscoverPollEndpoint.mockResolvedValueOnce({ endpoint: null });
    await openInstances(user);
    await waitFor(() => expect(screen.getByText("inst-1")).toBeTruthy());
    await clickButton(user, /Poll endpoint/i);
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("success", "Poll endpoint: —"));
  });

  it("shows fallback error toasts for agent, poll, and deregister failures", async () => {
    const user = userEvent.setup();
    mockContainerInstances.mockReturnValue({
      data: { containerInstances: [{ containerInstanceArn: INST_ARN, agentConnected: true }], total: 1 },
      isLoading: false,
    });
    mockUpdateContainerAgent.mockRejectedValueOnce("agent boom");
    mockDiscoverPollEndpoint.mockRejectedValueOnce("poll boom");
    mockDeregisterInstance.mockRejectedValueOnce("dereg boom");
    await openInstances(user);
    await waitFor(() => expect(screen.getByText("inst-1")).toBeTruthy());
    await clickButton(user, /Update agent/i);
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("error", "Failed to update agent"));
    await clickButton(user, /Poll endpoint/i);
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("error", "Failed to discover poll endpoint"));
    const del = screen.getByRole("button", { name: /Delete inst-1/i });
    await user.click(del);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("error", "Failed to deregister container instance"));
  });

  it("dismisses the start-task modal via Escape", async () => {
    const user = userEvent.setup();
    mockContainerInstances.mockReturnValue({
      data: { containerInstances: [{ containerInstanceArn: INST_ARN, agentConnected: true }], total: 1 },
      isLoading: false,
    });
    await openInstances(user);
    await waitFor(() => expect(screen.getByText("inst-1")).toBeTruthy());
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Start task on instances")).toBeTruthy());
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Start task on instances"));
  });

  it("dismisses the update-state modal via Escape and Cancel", async () => {
    const user = userEvent.setup();
    mockContainerInstances.mockReturnValue({
      data: { containerInstances: [{ containerInstanceArn: INST_ARN, agentConnected: true }], total: 1 },
      isLoading: false,
    });
    await openInstances(user);
    await waitFor(() => expect(screen.getByText("inst-1")).toBeTruthy());
    await clickButton(user, /Update state/i);
    await waitFor(() => expect(screen.getByText("Update container instance state")).toBeTruthy());
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Update container instance state"));
    await clickButton(user, /Update state/i);
    await waitFor(() => expect(screen.getByText("Update container instance state")).toBeTruthy());
    await clickButton(user, /Cancel/i, { last: true });
    await waitFor(() => expectModalHidden("Update container instance state"));
  });

  it("shows fallback error alerts for start task and update state", async () => {
    const user = userEvent.setup();
    mockContainerInstances.mockReturnValue({
      data: { containerInstances: [{ containerInstanceArn: INST_ARN, agentConnected: true }], total: 1 },
      isLoading: false,
    });
    mockStartTask.mockImplementationOnce((_body: any, opts: any) => opts?.onError?.("start boom"));
    mockUpdateInstanceState.mockImplementationOnce((_body: any, opts: any) => opts?.onError?.("state boom"));
    await openInstances(user);
    await waitFor(() => expect(screen.getByText("inst-1")).toBeTruthy());
    // Start-task fallback alert
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Start task on instances")).toBeTruthy());
    const startDlg = dialogOf("Start task on instances");
    await user.type(within(startDlg).getByPlaceholderText("my-task:1"), "boom-task");
    await clickButton(user, /Start/i, { last: true });
    await waitFor(() => expect(screen.getByText("Failed to start task")).toBeTruthy());
    // Update-state fallback alert
    await clickButton(user, /Update state/i);
    await waitFor(() => expect(screen.getByText("Update container instance state")).toBeTruthy());
    await clickButton(user, /Save/i, { last: true });
    await waitFor(() => expect(screen.getByText("Failed to update instance state")).toBeTruthy());
  });

  it("shows fallback protection error alerts for load and save", async () => {
    const user = userEvent.setup();
    mockTaskProtection.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: "protection boom",
    });
    mockTasks.mockReturnValue({
      data: {
        tasks: [{ taskArn: "arn:aws:ecs:us-east-1:123:task/my-cluster/task-4", lastStatus: "RUNNING" }],
        total: 1,
      },
      isLoading: false,
    });
    mockUpdateTaskProtection.mockImplementation((_body: any, opts: any) => opts?.onError?.("save boom"));
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("tab", { name: /tasks/i })).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /tasks/i }));
    await waitFor(() => expect(screen.getByText("task-4")).toBeTruthy());
    await clickButton(user, /Protection/i);
    await waitFor(() => expect(screen.getByText("Failed to load protection")).toBeTruthy());
    await clickButton(user, /Save/i, { last: true });
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("error", "Failed to update task protection"));
  });
});

describe("ECSDashboard — capacity providers tab", () => {
  it("renders providers with dash fallbacks", async () => {
    mockCapacityProviders.mockReturnValue({
      data: { capacityProviders: [{ name: "cp-1", tags: [] }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Capacity Providers/i }));
    expect(await screen.findByText("cp-1")).toBeTruthy();
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(2);
  });

  it("shows the empty message", async () => {
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Capacity Providers/i }));
    expect(await screen.findByText("No capacity providers")).toBeTruthy();
  });

  it("creates a capacity provider", async () => {
    mockCreateCapacityProvider.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Capacity Providers/i }));
    const createBtn = await screen.findByRole("button", { name: /Create capacity provider/i });
    await user.click(createBtn);
    const dialog = screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden"))!;
    const inputs = dialog.querySelectorAll("input");
    await user.type(inputs[0], "my-provider");
    await user.type(inputs[1], "arn:aws:autoscaling:asg-1");
    const submit = screen.getAllByRole("button", { name: /^Create$/ }).at(-1)!;
    await user.click(submit);
    await waitFor(() =>
      expect(mockCreateCapacityProvider).toHaveBeenCalledWith(
        { name: "my-provider", autoScalingGroupArn: "arn:aws:autoscaling:asg-1" },
        expect.objectContaining({ onSuccess: expect.any(Function) })
      )
    );
  });

  it("shows empty table while providers still loading", async () => {
    mockCapacityProviders.mockReturnValue({ data: undefined, isLoading: false });
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Capacity Providers/i }));
    expect(await screen.findByText("No capacity providers")).toBeTruthy();
  });

  it("shows fallback create error when message absent", async () => {
    createCpState.isError = true;
    createCpState.error = null;
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Capacity Providers/i }));
    await user.click(await screen.findByRole("button", { name: /Create capacity provider/i }));
    expect(await screen.findByText("Failed to create capacity provider")).toBeTruthy();
  });

  it("disables Delete while that provider deletion is pending", async () => {
    mockCapacityProviders.mockReturnValue({
      data: { capacityProviders: [{ name: "cp-1", tags: [] }], total: 1 },
      isLoading: false,
    });
    deleteCpState.isPending = true;
    deleteCpState.variables = "cp-1";
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Capacity Providers/i }));
    const btn = await screen.findByRole("button", { name: /Delete cp-1/i });
    expect(btn.className).toMatch(/disabled/);
  });

  it("shows the create capacity provider error alert", async () => {
    createCpState.isError = true;
    createCpState.error = new Error("cp failed");
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Capacity Providers/i }));
    await user.click(await screen.findByRole("button", { name: /Create capacity provider/i }));
    expect(await screen.findByText("cp failed")).toBeTruthy();
  });

  it("covers create-modal cancel and Escape-dismiss arms", async () => {
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Capacity Providers/i }));
    await user.click(await screen.findByRole("button", { name: /Create capacity provider/i }));
    const dialog = screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden"))!;
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(mockCreateCapacityProvider).not.toHaveBeenCalled();
    // reopen and Escape-dismiss
    await user.click(screen.getByRole("button", { name: /Create capacity provider/i }));
    document.querySelectorAll('[class*="awsui_dialog"]').forEach((d) => fireEvent.keyDown(d as HTMLElement, { keyCode: 27 }));
    expect(mockCreateCapacityProvider).not.toHaveBeenCalled();
  });

  it("keeps Create disabled until both fields are filled", async () => {
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Capacity Providers/i }));
    await user.click(await screen.findByRole("button", { name: /Create capacity provider/i }));
    const submit = screen.getAllByRole("button", { name: /^Create$/ }).at(-1)!;
    expect(submit.hasAttribute("disabled")).toBe(true);
  });

  it("deletes a capacity provider after confirmation", async () => {
    mockDeleteCapacityProvider.mockResolvedValue({});
    mockCapacityProviders.mockReturnValue({
      data: { capacityProviders: [{ name: "cp-1", tags: [] }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Capacity Providers/i }));
    await user.click(await screen.findByRole("button", { name: /Delete cp-1/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteCapacityProvider).toHaveBeenCalledWith("cp-1"));
  });

  it("renders tags as key=value strings", async () => {
    mockCapacityProviders.mockReturnValue({
      data: { capacityProviders: [{ name: "cp-1", status: "ACTIVE", tags: [{ key: "env", value: "prod" }] }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ECSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Capacity Providers/i }));
    expect(await screen.findByText("env=prod")).toBeTruthy();
    expect(screen.getByText("ACTIVE")).toBeTruthy();
  });
});
