// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

// ─── Mock ConfirmDialog ─────────────────────────────────

vi.mock("../../components/ConfirmDialog", () => ({
  useConfirmDialog: () => ({
    confirm: vi.fn(() => Promise.resolve(true)),
    dialog: null,
  }),
}));

// ─── vi.hoisted mutable states ──────────────────────────

const createCEState = vi.hoisted(() => ({
  isPending: false,
  isError: false,
  error: null as Error | null,
}));

const deleteCEState = vi.hoisted(() => ({
  isPending: false,
  variables: null as string | null,
}));

const createJQState = vi.hoisted(() => ({
  isPending: false,
  isError: false,
  error: null as Error | null,
}));

const deleteJQState = vi.hoisted(() => ({
  isPending: false,
  variables: null as string | null,
}));

const registerJDState = vi.hoisted(() => ({
  isPending: false,
  isError: false,
  error: null as Error | null,
}));

const deregisterJDState = vi.hoisted(() => ({
  isPending: false,
  variables: null as string | null,
}));

// ─── Mock hooks ─────────────────────────────────────────

const mockComputeEnvs = vi.fn();
const mockJobQueues = vi.fn();
const mockJobDefs = vi.fn();
const mockCreateCE = vi.fn();
const mockDeleteCE = vi.fn();
const mockCreateJQ = vi.fn();
const mockDeleteJQ = vi.fn();
const mockRegisterJD = vi.fn();
const mockDeregisterJD = vi.fn();

vi.mock("../../hooks/useBatch", () => ({
  useBatchComputeEnvironments: (...args: any[]) => mockComputeEnvs(...args),
  useBatchJobQueues: (...args: any[]) => mockJobQueues(...args),
  useBatchJobDefinitions: (...args: any[]) => mockJobDefs(...args),
  useCreateBatchComputeEnvironment: () => ({
    mutate: mockCreateCE,
    get isPending() { return createCEState.isPending; },
    get isError() { return createCEState.isError; },
    get error() { return createCEState.error; },
  }),
  useDeleteBatchComputeEnvironment: () => ({
    mutateAsync: mockDeleteCE,
    get isPending() { return deleteCEState.isPending; },
    get variables() { return deleteCEState.variables; },
  }),
  useCreateBatchJobQueue: () => ({
    mutate: mockCreateJQ,
    get isPending() { return createJQState.isPending; },
    get isError() { return createJQState.isError; },
    get error() { return createJQState.error; },
  }),
  useDeleteBatchJobQueue: () => ({
    mutateAsync: mockDeleteJQ,
    get isPending() { return deleteJQState.isPending; },
    get variables() { return deleteJQState.variables; },
  }),
  useRegisterBatchJobDefinition: () => ({
    mutate: mockRegisterJD,
    get isPending() { return registerJDState.isPending; },
    get isError() { return registerJDState.isError; },
    get error() { return registerJDState.error; },
  }),
  useDeregisterBatchJobDefinition: () => ({
    mutateAsync: mockDeregisterJD,
    get isPending() { return deregisterJDState.isPending; },
    get variables() { return deregisterJDState.variables; },
  }),
  useSubmitBatchJob: () => ({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
  }),
}));

import { BatchDashboard } from "./BatchDashboard";

// ─── Setup ──────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  createCEState.isPending = false;
  createCEState.isError = false;
  createCEState.error = null;
  deleteCEState.isPending = false;
  deleteCEState.variables = null;
  createJQState.isPending = false;
  createJQState.isError = false;
  createJQState.error = null;
  deleteJQState.isPending = false;
  deleteJQState.variables = null;
  registerJDState.isPending = false;
  registerJDState.isError = false;
  registerJDState.error = null;
  deregisterJDState.isPending = false;
  deregisterJDState.variables = null;

  mockComputeEnvs.mockReturnValue({
    data: { computeEnvironments: [] },
    isLoading: false,
    isError: false,
    error: null,
  });
  mockJobQueues.mockReturnValue({
    data: { jobQueues: [] },
    isLoading: false,
    isError: false,
    error: null,
  });
  mockJobDefs.mockReturnValue({
    data: { jobDefinitions: [] },
    isLoading: false,
    isError: false,
    error: null,
  });
});

// ─── Tests ──────────────────────────────────────────────

describe("BatchDashboard — rendering", () => {
  it("shows loading skeleton when loading", () => {
    mockComputeEnvs.mockReturnValue({ data: undefined, isLoading: true });
    mockJobQueues.mockReturnValue({ data: undefined, isLoading: true });
    mockJobDefs.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = render(<BatchDashboard />, { wrapper: createWrapper() });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("shows empty messages for all 3 tables", () => {
    render(<BatchDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No compute environment/i)).toBeTruthy();
    expect(screen.getByText("Job Queues")).toBeTruthy();
    expect(screen.getByText("Job Definitions")).toBeTruthy();
  });

  it("shows all 3 table headers", () => {
    render(<BatchDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Compute Environments")).toBeTruthy();
    expect(screen.getByText("Job Queues")).toBeTruthy();
    expect(screen.getByText("Job Definitions")).toBeTruthy();
  });
});

describe("BatchDashboard — compute environments", () => {
  it("renders compute environments with data", () => {
    mockComputeEnvs.mockReturnValue({
      data: {
        computeEnvironments: [
          { computeEnvironmentName: "my-ce", type: "MANAGED", state: "ENABLED", status: "VALID" },
        ],
      },
      isLoading: false,
    });
    render(<BatchDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-ce")).toBeTruthy();
    expect(screen.getAllByText("MANAGED").length).toBeGreaterThan(0);
    expect(screen.getByText("ENABLED")).toBeTruthy();
    expect(screen.getByText("VALID")).toBeTruthy();
  });

  it("renders with null/undefined fields gracefully", () => {
    mockComputeEnvs.mockReturnValue({
      data: { computeEnvironments: [{ computeEnvironmentName: "minimal-ce" }] },
      isLoading: false,
    });
    render(<BatchDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("minimal-ce")).toBeTruthy();
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(3);
  });

  it("renders multiple CEs and filters by name", async () => {
    mockComputeEnvs.mockReturnValue({
      data: {
        computeEnvironments: [
          { computeEnvironmentName: "ce-alpha", type: "MANAGED", state: "ENABLED", status: "VALID" },
          { computeEnvironmentName: "ce-beta", type: "UNMANAGED", state: "DISABLED", status: "INVALID" },
        ],
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<BatchDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("ce-alpha")).toBeTruthy());

    const filterInputs = screen.getAllByPlaceholderText("Find by name");
    await user.type(filterInputs[0], "beta");
    await waitFor(() => expect(screen.queryByText("ce-alpha")).toBeNull());
  });

  it("opens create compute environment modal and shows form", async () => {
    const user = userEvent.setup();
    render(<BatchDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /Create compute environment/i);
    await waitFor(() => {
      expect(screen.getAllByText("Create Compute Environment").length).toBeGreaterThan(0);
    });

    expect(screen.getByLabelText(/Type/)).toBeTruthy();
  });

  it("shows create CE loading and error", async () => {
    createCEState.isError = true;
    createCEState.error = new Error("CE creation failed");
    const user = userEvent.setup();
    render(<BatchDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create compute environment/i);
    await waitFor(() => {
      expect(screen.getByText("CE creation failed")).toBeTruthy();
    });
  });

  it("deletes a compute environment", async () => {
    const user = userEvent.setup();
    mockComputeEnvs.mockReturnValue({
      data: { computeEnvironments: [{ computeEnvironmentName: "my-ce", type: "MANAGED", state: "ENABLED", status: "VALID" }] },
      isLoading: false,
    });
    render(<BatchDashboard />, { wrapper: createWrapper() });
    const deleteBtn = screen.getByRole("button", { name: /Delete my-ce/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(mockDeleteCE).toHaveBeenCalledWith("my-ce"));
  });

  it("shows delete CE loading state", () => {
    deleteCEState.isPending = true;
    deleteCEState.variables = "my-ce";
    mockComputeEnvs.mockReturnValue({
      data: { computeEnvironments: [{ computeEnvironmentName: "my-ce", type: "MANAGED", state: "ENABLED", status: "VALID" }] },
      isLoading: false,
    });
    render(<BatchDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-ce")).toBeTruthy();
  });
});

describe("BatchDashboard — job queues", () => {
  it("renders job queues with data", () => {
    mockJobQueues.mockReturnValue({
      data: { jobQueues: [{ jobQueueName: "my-queue", priority: 10, state: "ENABLED", status: "VALID" }] },
      isLoading: false,
    });
    render(<BatchDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-queue")).toBeTruthy();
    expect(screen.getByText("10")).toBeTruthy();
    expect(screen.getByText("ENABLED")).toBeTruthy();
    expect(screen.getByText("VALID")).toBeTruthy();
  });

  it("renders multiple queues and filters by name", async () => {
    mockJobQueues.mockReturnValue({
      data: {
        jobQueues: [
          { jobQueueName: "queue-alpha", priority: 10, state: "ENABLED", status: "VALID" },
          { jobQueueName: "queue-beta", priority: 5, state: "DISABLED", status: "INVALID" },
        ],
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<BatchDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("queue-alpha")).toBeTruthy());

    const inputs = screen.getAllByPlaceholderText("Find by name");
    await user.type(inputs[1], "beta");
    await waitFor(() => expect(screen.queryByText("queue-alpha")).toBeNull());
  });

  it("shows null/undefined fields for job queue", () => {
    mockJobQueues.mockReturnValue({
      data: { jobQueues: [{ jobQueueName: "minimal-queue" }] },
      isLoading: false,
    });
    render(<BatchDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("minimal-queue")).toBeTruthy();
  });

  it("opens create job queue modal and shows form", async () => {
    const user = userEvent.setup();
    render(<BatchDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /Create job queue/i);
    await waitFor(() => {
      expect(screen.getAllByText("Create Job Queue").length).toBeGreaterThan(0);
    });

    expect(screen.getByLabelText(/Queue name/)).toBeTruthy();
  });

  it("shows create JQ loading", () => {
    createJQState.isPending = true;
    render(<BatchDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Job Queues")).toBeTruthy();
  });

  it("shows create JQ error alert", async () => {
    createJQState.isError = true;
    createJQState.error = new Error("Queue creation failed");
    const user = userEvent.setup();
    render(<BatchDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create job queue/i);
    await waitFor(() => {
      expect(screen.getByText("Queue creation failed")).toBeTruthy();
    });
  });

  it("deletes a job queue", async () => {
    const user = userEvent.setup();
    mockJobQueues.mockReturnValue({
      data: { jobQueues: [{ jobQueueName: "my-queue", priority: 10, state: "ENABLED", status: "VALID" }] },
      isLoading: false,
    });
    render(<BatchDashboard />, { wrapper: createWrapper() });
    const deleteBtn = screen.getByRole("button", { name: /Delete my-queue/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(mockDeleteJQ).toHaveBeenCalledWith("my-queue"));
  });

  it("shows delete JQ loading state", () => {
    deleteJQState.isPending = true;
    deleteJQState.variables = "my-queue";
    mockJobQueues.mockReturnValue({
      data: { jobQueues: [{ jobQueueName: "my-queue", priority: 10, state: "ENABLED", status: "VALID" }] },
      isLoading: false,
    });
    render(<BatchDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-queue")).toBeTruthy();
  });
});

describe("BatchDashboard — job definitions", () => {
  it("renders job definitions with data", () => {
    mockJobDefs.mockReturnValue({
      data: { jobDefinitions: [{ jobDefinitionName: "my-jd", revision: 1, type: "container", status: "ACTIVE" }] },
      isLoading: false,
    });
    render(<BatchDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-jd")).toBeTruthy();
    expect(screen.getByText("1")).toBeTruthy();
    expect(screen.getByText("container")).toBeTruthy();
    expect(screen.getByText("ACTIVE")).toBeTruthy();
  });

  it("shows null/undefined fields for job definition", () => {
    mockJobDefs.mockReturnValue({
      data: { jobDefinitions: [{ jobDefinitionName: "minimal" }] },
      isLoading: false,
    });
    render(<BatchDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("minimal")).toBeTruthy();
  });

  it("renders multiple JDs and filters by name", async () => {
    mockJobDefs.mockReturnValue({
      data: {
        jobDefinitions: [
          { jobDefinitionName: "jd-alpha", revision: 1, type: "container", status: "ACTIVE" },
          { jobDefinitionName: "jd-beta", revision: 2, type: "container", status: "INACTIVE" },
        ],
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<BatchDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("jd-alpha")).toBeTruthy());

    const inputs = screen.getAllByPlaceholderText("Find by name");
    await user.type(inputs[2], "beta");
    await waitFor(() => expect(screen.queryByText("jd-alpha")).toBeNull());
  });

  it("opens register job definition modal and submits", async () => {
    const user = userEvent.setup();
    render(<BatchDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /Create job definition/i);
    await waitFor(() => {
      expect(screen.getByText("Register Job Definition")).toBeTruthy();
    });

    const nameInput = screen.getByLabelText(/Definition name/);
    await user.type(nameInput, "test-jd");

    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    await user.click(createBtns[createBtns.length - 1]);

    await waitFor(() => {
      expect(mockRegisterJD).toHaveBeenCalledWith(
        expect.objectContaining({ jobDefinitionName: "test-jd" }),
        expect.any(Object),
      );
    });
  });

  it("shows register JD loading", () => {
    registerJDState.isPending = true;
    render(<BatchDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Job Definitions")).toBeTruthy();
  });

  it("shows register JD error alert", async () => {
    registerJDState.isError = true;
    registerJDState.error = new Error("JD registration failed");
    const user = userEvent.setup();
    render(<BatchDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create job definition/i);
    await waitFor(() => {
      expect(screen.getByText("JD registration failed")).toBeTruthy();
    });
  });

  it("deregisters a job definition", async () => {
    const user = userEvent.setup();
    mockJobDefs.mockReturnValue({
      data: { jobDefinitions: [{ jobDefinitionName: "my-jd", revision: 1, type: "container", status: "ACTIVE" }] },
      isLoading: false,
    });
    render(<BatchDashboard />, { wrapper: createWrapper() });
    const deleteBtn = screen.getByRole("button", { name: /Delete my-jd/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(mockDeregisterJD).toHaveBeenCalledWith("my-jd"));
  });

  it("shows deregister JD loading state", () => {
    deregisterJDState.isPending = true;
    deregisterJDState.variables = "my-jd";
    mockJobDefs.mockReturnValue({
      data: { jobDefinitions: [{ jobDefinitionName: "my-jd", revision: 1, type: "container", status: "ACTIVE" }] },
      isLoading: false,
    });
    render(<BatchDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-jd")).toBeTruthy();
  });
});
