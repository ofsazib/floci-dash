// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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
}));

import { ECSDashboard } from "./ECSDashboard";

const toastMock = vi.fn();
vi.mock("../../components/Toast", () => ({
  useToast: () => ({ showToast: toastMock }),
}));

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
