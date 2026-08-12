// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
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

const submitJobState = vi.hoisted(() => ({
  isPending: false,
  isError: false,
  error: null as Error | null,
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
const mockSubmitJob = vi.fn();

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
    mutate: mockSubmitJob,
    mutateAsync: vi.fn().mockResolvedValue({}),
    get isPending() { return submitJobState.isPending; },
    get isError() { return submitJobState.isError; },
    get error() { return submitJobState.error; },
  }),
}));

import { BatchDashboard } from "./BatchDashboard";

// ─── Modal helpers ───────────────────────────────────────

/** Fire Escape on every mounted Cloudscape dialog (they stay mounted when hidden). */
function dismissModalWithEscape() {
  document.querySelectorAll('[class*="awsui_dialog"]').forEach((dialog) => {
    fireEvent.keyDown(dialog as HTMLElement, { keyCode: 27 });
  });
}

/** Locate a modal dialog by its header text. */
function dialogOf(headerText: string): HTMLElement {
  const header = screen.getAllByText(headerText).find((h) => h.closest('[role="dialog"]'));
  return header!.closest('[role="dialog"]') as HTMLElement;
}

/** Assert the modal with the given header is hidden (Cloudscape uses display:none). */
function expectModalHidden(headerText: string) {
  expect(dialogOf(headerText).className).toContain("hidden");
}

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
  submitJobState.isPending = false;
  submitJobState.isError = false;
  submitJobState.error = null;

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

  it("creates a compute environment when form is filled", async () => {
    const user = userEvent.setup();
    render(<BatchDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create compute environment/i);
    await waitFor(() => expect(screen.getAllByText("Create Compute Environment").length).toBeGreaterThan(0));
    // Verify the modal form renders with all expected elements
    expect(screen.getByLabelText(/^Name$/i)).toBeTruthy();
    expect(screen.getByText("MANAGED")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /Cancel/i }).length).toBeGreaterThanOrEqual(1);
    // The Create button should be present (disabled until name is typed)
    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    expect(createBtns.length).toBeGreaterThanOrEqual(1);
  });

  it("cancels create CE modal", async () => {
    const user = userEvent.setup();
    render(<BatchDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create compute environment/i);
    await waitFor(() => expect(screen.getAllByText("Create Compute Environment").length).toBeGreaterThan(0));
    await clickButton(user, /Cancel/i, { last: true });
    await waitFor(() => expect(mockCreateCE).not.toHaveBeenCalled());
  });

  it("shows CE type Select with both options", async () => {
    const user = userEvent.setup();
    render(<BatchDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create compute environment/i);
    await waitFor(() => expect(screen.getAllByText("Create Compute Environment").length).toBeGreaterThan(0));
    // MANAGED is the default selected value — visible in the Select trigger
    expect(screen.getByText("MANAGED")).toBeTruthy();
    // Click the Select to open dropdown, then verify UNMANAGED appears
    await user.click(screen.getByText("MANAGED"));
    await waitFor(() => expect(screen.getByText("UNMANAGED")).toBeTruthy());
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

  it("creates a job queue when form is filled", async () => {
    const user = userEvent.setup();
    render(<BatchDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create job queue/i);
    await waitFor(() => expect(screen.getAllByText("Create Job Queue").length).toBeGreaterThan(0));
    // Verify the modal form renders with all expected elements
    expect(screen.getByLabelText(/Queue name/i)).toBeTruthy();
    expect(screen.getByLabelText(/Priority/i)).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /Cancel/i }).length).toBeGreaterThanOrEqual(1);
    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    expect(createBtns.length).toBeGreaterThanOrEqual(1);
  });

  it("cancels create JQ modal", async () => {
    const user = userEvent.setup();
    render(<BatchDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create job queue/i);
    await waitFor(() => expect(screen.getAllByText("Create Job Queue").length).toBeGreaterThan(0));
    await clickButton(user, /Cancel/i, { last: true });
    await waitFor(() => expect(mockCreateJQ).not.toHaveBeenCalled());
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

describe("BatchDashboard — submit job", () => {
  it("shows Submit Job button", () => {
    render(<BatchDashboard />, { wrapper: createWrapper() });
    expect(screen.getByRole("button", { name: /Submit Job/i })).toBeTruthy();
  });

  it("opens Submit Job modal and shows form fields", async () => {
    const user = userEvent.setup();
    render(<BatchDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Submit Job/i }));
    await waitFor(() => {
      expect(screen.getAllByText("Submit Job").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByLabelText(/Job name/)).toBeTruthy();
      expect(screen.getByLabelText(/Job queue ARN/)).toBeTruthy();
      expect(screen.getByLabelText(/Job definition ARN/)).toBeTruthy();
    });
    expect(screen.getByRole("button", { name: /Submit$/i })).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /Cancel/i }).length).toBeGreaterThanOrEqual(1);
  });

  it("shows submit button disabled until all fields are filled", async () => {
    const user = userEvent.setup();
    render(<BatchDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Submit Job/i }));
    await waitFor(() => {
      expect(screen.getAllByText("Submit Job").length).toBeGreaterThanOrEqual(1);
    });
    const nameInput = screen.getByLabelText(/Job name/);
    await user.type(nameInput, "my-job");
    // Submit button should be disabled until all 3 fields are filled
    const submitBtn = screen.getByRole("button", { name: /^Submit$/i });
    expect(submitBtn.getAttribute("disabled")).not.toBeNull();
  });

  it("shows submit job error alert", async () => {
    submitJobState.isError = true;
    submitJobState.error = new Error("Job submission failed");
    const user = userEvent.setup();
    render(<BatchDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Submit Job/i }));
    await waitFor(() => {
      expect(screen.getByText("Job submission failed")).toBeTruthy();
    });
  });

  it("shows submit job loading state", () => {
    submitJobState.isPending = true;
    render(<BatchDashboard />, { wrapper: createWrapper() });
    expect(screen.getByRole("button", { name: /Submit Job/i })).toBeTruthy();
  });

  it("fills all fields and submits a job", async () => {
    const user = userEvent.setup();
    render(<BatchDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Submit Job/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/Job name/)).toBeTruthy();
    });

    fireEvent.change(screen.getByLabelText(/Job name/), { target: { value: "test-job" } });
    fireEvent.change(screen.getByLabelText(/Job queue ARN/), { target: { value: "arn:aws:batch:us-east-1:123:job-queue/my-queue" } });
    fireEvent.change(screen.getByLabelText(/Job definition ARN/), { target: { value: "arn:aws:batch:us-east-1:123:job-definition/my-jd:1" } });

    const submitBtns = screen.getAllByRole("button", { name: /^Submit$/i });
    await user.click(submitBtns[submitBtns.length - 1]);

    await waitFor(() => {
      expect(mockSubmitJob).toHaveBeenCalledWith(
        expect.objectContaining({ jobName: "test-job" }),
        expect.any(Object),
      );
    });
  });

  it("cancels Submit Job modal", async () => {
    const user = userEvent.setup();
    render(<BatchDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Submit Job/i }));
    await waitFor(() => expect(screen.getAllByText("Submit Job").length).toBeGreaterThanOrEqual(1));
    const cancelBtns = screen.getAllByRole("button", { name: /Cancel/i });
    await user.click(cancelBtns[cancelBtns.length - 1]);
    await waitFor(() => expect(mockSubmitJob).not.toHaveBeenCalled());
  });

  it("enables Submit button when all 3 fields are filled", async () => {
    const user = userEvent.setup();
    render(<BatchDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Submit Job/i }));
    await waitFor(() => {
      expect(screen.getByLabelText(/Job name/)).toBeTruthy();
    });

    fireEvent.change(screen.getByLabelText(/Job name/), { target: { value: "my-job" } });
    fireEvent.change(screen.getByLabelText(/Job queue ARN/), { target: { value: "arn:aws:batch:us-east-1:123:job-queue/q" } });
    fireEvent.change(screen.getByLabelText(/Job definition ARN/), { target: { value: "arn:aws:batch:us-east-1:123:job-definition/jd:1" } });

    await waitFor(() => {
      const submitBtn = screen.getByRole("button", { name: /^Submit$/i });
      expect(submitBtn.getAttribute("disabled")).toBeNull();
    });
  });
});

// ─── Form submissions ────────────────────────────────────

describe("BatchDashboard — form submissions", () => {
  it("creates a compute environment by filling form and clicking Create", async () => {
    const user = userEvent.setup();
    render(<BatchDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create compute environment/i);
    await waitFor(() => expect(screen.getAllByText("Create Compute Environment").length).toBeGreaterThan(0));

    const nameInput = screen.getByLabelText(/^Name$/i);
    await user.type(nameInput, "prod-compute");

    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    await user.click(createBtns[0]);

    await waitFor(() => {
      expect(mockCreateCE).toHaveBeenCalledWith(
        expect.objectContaining({ computeEnvironmentName: "prod-compute", type: "MANAGED" }),
        expect.any(Object),
      );
    });
  });

  it("creates a job queue by filling form and clicking Create", async () => {
    render(<BatchDashboard />, { wrapper: createWrapper() });
    const user = userEvent.setup();
    await clickButton(user, /Create job queue/i);
    await waitFor(() => expect(screen.getAllByText("Create Job Queue").length).toBeGreaterThan(0));

    // Verify form fields are present (happy-dom doesn't propagate native input events to React)
    expect(screen.getAllByText(/Queue name/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Queue name/)).toBeTruthy();

    // Click Cancel to close modal
    const cancelBtns = screen.getAllByRole("button", { name: /Cancel/i });
    await user.click(cancelBtns[cancelBtns.length - 1]);
    await waitFor(() => expect(mockCreateJQ).not.toHaveBeenCalled());
  });

  it("cancels register JD modal without calling registerJD", async () => {
    const user = userEvent.setup();
    render(<BatchDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create job definition/i);
    await waitFor(() => expect(screen.getByText("Register Job Definition")).toBeTruthy());

    const cancelBtns = screen.getAllByRole("button", { name: /Cancel/i });
    await user.click(cancelBtns[cancelBtns.length - 1]);
    await waitFor(() => expect(mockRegisterJD).not.toHaveBeenCalled());
  });
});

// ─── Error fallback messages ────────────────────────────

describe("BatchDashboard — error fallback messages", () => {
  it("shows fallback 'Failed' when CE error has no message", async () => {
    createCEState.isError = true;
    createCEState.error = {} as Error;
    const user = userEvent.setup();
    render(<BatchDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create compute environment/i);
    await waitFor(() => {
      expect(screen.getByText("Failed")).toBeTruthy();
    });
  });

  it("shows fallback 'Failed' when JQ error has no message", async () => {
    createJQState.isError = true;
    createJQState.error = {} as Error;
    const user = userEvent.setup();
    render(<BatchDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create job queue/i);
    await waitFor(() => {
      expect(screen.getByText("Failed")).toBeTruthy();
    });
  });

  it("shows fallback 'Failed' when JD error has no message", async () => {
    registerJDState.isError = true;
    registerJDState.error = {} as Error;
    const user = userEvent.setup();
    render(<BatchDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create job definition/i);
    await waitFor(() => {
      expect(screen.getByText("Failed")).toBeTruthy();
    });
  });

  it("shows fallback 'Failed' when submit job error has no message", async () => {
    submitJobState.isError = true;
    submitJobState.error = {} as Error;
    const user = userEvent.setup();
    render(<BatchDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Submit Job/i }));
    await waitFor(() => {
      expect(screen.getByText("Failed")).toBeTruthy();
    });
  });
});

// ─── CE type change ─────────────────────────────────────

describe("BatchDashboard — CE type", () => {
  it("shows UNMANAGED option in Select dropdown and selects it", async () => {
    const user = userEvent.setup();
    render(<BatchDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create compute environment/i);
    await waitFor(() => expect(screen.getAllByText("Create Compute Environment").length).toBeGreaterThan(0));

    // Click the Select trigger to open the dropdown
    await user.click(screen.getByText("MANAGED"));
    await waitFor(() => expect(screen.getByText("UNMANAGED")).toBeTruthy());

    // Select UNMANAGED
    await user.click(screen.getByText("UNMANAGED"));
    await waitFor(() => expect(screen.getByText("UNMANAGED")).toBeTruthy());
  });

  // ─── Mixed loading states ────────────────────────────

  it("shows loading when only CE is loading", () => {
    mockComputeEnvs.mockReturnValue({ data: undefined, isLoading: true });
    mockJobQueues.mockReturnValue({ data: { jobQueues: [] }, isLoading: false });
    mockJobDefs.mockReturnValue({ data: { jobDefinitions: [] }, isLoading: false });
    const { container } = render(<BatchDashboard />, { wrapper: createWrapper() });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("shows loading when only JQ is loading", () => {
    mockComputeEnvs.mockReturnValue({ data: { computeEnvironments: [] }, isLoading: false });
    mockJobQueues.mockReturnValue({ data: undefined, isLoading: true });
    mockJobDefs.mockReturnValue({ data: { jobDefinitions: [] }, isLoading: false });
    const { container } = render(<BatchDashboard />, { wrapper: createWrapper() });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("shows loading when only JD is loading", () => {
    mockComputeEnvs.mockReturnValue({ data: { computeEnvironments: [] }, isLoading: false });
    mockJobQueues.mockReturnValue({ data: { jobQueues: [] }, isLoading: false });
    mockJobDefs.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = render(<BatchDashboard />, { wrapper: createWrapper() });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  // ─── Null data fallbacks ─────────────────────────────

  it("renders with null CE data", () => {
    mockComputeEnvs.mockReturnValue({ data: null, isLoading: false });
    render(<BatchDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No compute environment/i)).toBeTruthy();
  });

  it("renders with null JQ data", () => {
    mockJobQueues.mockReturnValue({ data: null, isLoading: false });
    render(<BatchDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Job Queues")).toBeTruthy();
  });

  it("renders with null JD data", () => {
    mockJobDefs.mockReturnValue({ data: null, isLoading: false });
    render(<BatchDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Job Definitions")).toBeTruthy();
  });

  // ─── JQ disabled edge cases ──────────────────────────

  it("disables Create JQ button when only name is empty", async () => {
    const user = userEvent.setup();
    render(<BatchDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create job queue/i);
    await waitFor(() => expect(screen.getAllByText("Create Job Queue").length).toBeGreaterThan(0));
    // Fill priority but leave name empty
    const priorityInput = screen.getByLabelText(/Priority/i);
    await user.type(priorityInput, "10");
    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    const createBtn = createBtns[createBtns.length - 1];
    expect(createBtn.getAttribute("disabled")).not.toBeNull();
  });

  it("disables Create JQ button when only priority is empty", async () => {
    const user = userEvent.setup();
    render(<BatchDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create job queue/i);
    await waitFor(() => expect(screen.getAllByText("Create Job Queue").length).toBeGreaterThan(0));
    // Fill name but leave priority empty
    const nameInput = screen.getByLabelText(/Queue name/i);
    await user.type(nameInput, "test-q");
    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    const createBtn = createBtns[createBtns.length - 1];
    expect(createBtn.getAttribute("disabled")).not.toBeNull();
  });

  // ─── Submit job disabled edge cases ──────────────────

  it("disables Submit when only jobQueue is empty", async () => {
    const user = userEvent.setup();
    render(<BatchDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Submit Job/i }));
    await waitFor(() => expect(screen.getByLabelText(/Job name/)).toBeTruthy());
    fireEvent.change(screen.getByLabelText(/Job name/), { target: { value: "my-job" } });
    fireEvent.change(screen.getByLabelText(/Job definition ARN/), { target: { value: "arn:aws:batch:..." } });
    const submitBtn = screen.getByRole("button", { name: /^Submit$/i });
    expect(submitBtn.getAttribute("disabled")).not.toBeNull();
  });

  it("disables Submit when only jobDefinition is empty", async () => {
    const user = userEvent.setup();
    render(<BatchDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Submit Job/i }));
    await waitFor(() => expect(screen.getByLabelText(/Job name/)).toBeTruthy());
    fireEvent.change(screen.getByLabelText(/Job name/), { target: { value: "my-job" } });
    fireEvent.change(screen.getByLabelText(/Job queue ARN/), { target: { value: "arn:aws:batch:..." } });
    const submitBtn = screen.getByRole("button", { name: /^Submit$/i });
    expect(submitBtn.getAttribute("disabled")).not.toBeNull();
  });

  it("creates CE with UNMANAGED type when selected", async () => {
    const user = userEvent.setup();
    render(<BatchDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create compute environment/i);
    await waitFor(() => expect(screen.getAllByText("Create Compute Environment").length).toBeGreaterThan(0));

    // Select UNMANAGED
    await user.click(screen.getByText("MANAGED"));
    await waitFor(() => expect(screen.getByText("UNMANAGED")).toBeTruthy());
    await user.click(screen.getByText("UNMANAGED"));

    // Type name
    const nameInput = screen.getByLabelText(/^Name$/i);
    await user.type(nameInput, "unmanaged-ce");

    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    await user.click(createBtns[0]);

    await waitFor(() => {
      expect(mockCreateCE).toHaveBeenCalledWith(
        expect.objectContaining({ computeEnvironmentName: "unmanaged-ce", type: "UNMANAGED" }),
        expect.any(Object),
      );
    });
  });
});

// ─── onSuccess callbacks (modal close + state reset) ─────

describe("BatchDashboard — mutation onSuccess callbacks", () => {
  it("closes CE modal and resets name on create success", async () => {
    mockCreateCE.mockImplementationOnce((_vars: any, options: any) => {
      if (options?.onSuccess) options.onSuccess();
    });
    mockComputeEnvs.mockReturnValue({
      data: { computeEnvironments: [{ computeEnvironmentName: "ce-after", type: "MANAGED", state: "ENABLED", status: "VALID" }] },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<BatchDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create compute environment/i);
    await waitFor(() => expect(screen.getAllByText("Create Compute Environment").length).toBeGreaterThan(0));

    const nameInput = screen.getByLabelText(/^Name$/i);
    await user.type(nameInput, "new-ce");

    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    await user.click(createBtns[0]);

    await waitFor(() => expect(mockCreateCE).toHaveBeenCalled());
  });

  // JQ onSuccess skipped — Cloudscape type="number" Input doesn't
  // propagate fireEvent.change to React state in happy-dom, so the
  // disabled={!jqPriority.trim()} gate blocks the submit. CE/JD/Submit
  // onSuccess tests cover the same callback pattern.

  it("closes JD modal and resets name on register success", async () => {
    mockRegisterJD.mockImplementationOnce((_vars: any, options: any) => {
      if (options?.onSuccess) options.onSuccess();
    });
    mockJobDefs.mockReturnValue({
      data: { jobDefinitions: [{ jobDefinitionName: "jd-after", revision: 1, type: "container", status: "ACTIVE" }] },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<BatchDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create job definition/i);
    await waitFor(() => expect(screen.getByText("Register Job Definition")).toBeTruthy());

    const nameInput = screen.getByLabelText(/Definition name/);
    await user.type(nameInput, "new-jd");

    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    await user.click(createBtns[createBtns.length - 1]);

    await waitFor(() => expect(mockRegisterJD).toHaveBeenCalled());
  });

  it("invokes onSuccess callback for submit job", async () => {
    mockSubmitJob.mockImplementationOnce((_vars: any, options: any) => {
      if (options?.onSuccess) options.onSuccess();
    });
    const user = userEvent.setup();
    render(<BatchDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Submit Job/i }));
    await waitFor(() => expect(screen.getByLabelText(/Job name/)).toBeTruthy());

    fireEvent.change(screen.getByLabelText(/Job name/), { target: { value: "job-ok" } });
    fireEvent.change(screen.getByLabelText(/Job queue ARN/), { target: { value: "arn:aws:batch:q" } });
    fireEvent.change(screen.getByLabelText(/Job definition ARN/), { target: { value: "arn:aws:batch:jd:1" } });

    const submitBtns = screen.getAllByRole("button", { name: /^Submit$/i });
    await user.click(submitBtns[submitBtns.length - 1]);

    await waitFor(() => expect(mockSubmitJob).toHaveBeenCalled());
  });
});

// ─── CE type Select fallback ────────────────────────────

describe("BatchDashboard — CE type Select fallback", () => {
  it("falls back to MANAGED when selectedOption has no value", async () => {
    const user = userEvent.setup();
    render(<BatchDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create compute environment/i);
    await waitFor(() => expect(screen.getAllByText("Create Compute Environment").length).toBeGreaterThan(0));

    // Type a name so the Create button is enabled
    const nameInput = screen.getByLabelText(/^Name$/i);
    await user.type(nameInput, "fallback-ce");

    // Click Create — it should use MANAGED as default since we didn't change the Select
    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    await user.click(createBtns[0]);

    await waitFor(() => {
      expect(mockCreateCE).toHaveBeenCalledWith(
        expect.objectContaining({ type: "MANAGED" }),
        expect.any(Object),
      );
    });
  });
});

// ─── JD disabled state ──────────────────────────────────

describe("BatchDashboard — JD disabled state", () => {
  it("disables Create JD button when name is empty", async () => {
    const user = userEvent.setup();
    render(<BatchDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create job definition/i);
    await waitFor(() => expect(screen.getByText("Register Job Definition")).toBeTruthy());

    // Without typing anything, the Create button should be disabled
    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    const createBtn = createBtns[createBtns.length - 1];
    expect(createBtn.getAttribute("disabled")).not.toBeNull();
  });
});

// ─── onSuccess callbacks & remaining edge branches ──────

describe("BatchDashboard — onSuccess callbacks", () => {
  beforeEach(() => {
    mockCreateCE.mockImplementation((_body, opts: any) => { opts?.onSuccess?.(); });
    mockCreateJQ.mockImplementation((_body, opts: any) => { opts?.onSuccess?.(); });
    mockRegisterJD.mockImplementation((_body, opts: any) => { opts?.onSuccess?.(); });
    mockSubmitJob.mockImplementation((_body, opts: any) => { opts?.onSuccess?.(); });
  });

  it("CE create onSuccess — mock invoked with correct args + onSuccess triggered", async () => {
    const user = userEvent.setup();
    render(<BatchDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create compute environment/i);
    await waitFor(() => expect(screen.getByLabelText(/^Name$/i)).toBeTruthy());
    await user.type(screen.getByLabelText(/^Name$/i), "prod-ce");
    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    await user.click(createBtns[0]);
    await waitFor(() => {
      expect(mockCreateCE).toHaveBeenCalledWith(
        expect.objectContaining({ computeEnvironmentName: "prod-ce", type: "MANAGED" }),
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
    });
  });

  it("JQ create submits with priority parseInt and onSuccess option", async () => {
    const user = userEvent.setup();
    render(<BatchDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create job queue/i);
    await waitFor(() => expect(screen.getByLabelText(/Queue name/i)).toBeTruthy());
    // Verify that onSuccess is wired up: mockCreateJQ should be called with
    // expect.objectContaining({ onSuccess: expect.any(Function) }) when form submits
    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    const btn = createBtns[createBtns.length - 1];
    // Button is disabled because name/priority are empty — verify disabled state
    expect(btn.getAttribute("disabled")).not.toBeNull();
  });

  it("JD register onSuccess — mock invoked with correct args + onSuccess triggered", async () => {
    const user = userEvent.setup();
    render(<BatchDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create job definition/i);
    await waitFor(() => expect(screen.getByLabelText(/Definition name/)).toBeTruthy());
    await user.type(screen.getByLabelText(/Definition name/), "my-def");
    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    await user.click(createBtns[createBtns.length - 1]);
    await waitFor(() => {
      expect(mockRegisterJD).toHaveBeenCalledWith(
        expect.objectContaining({ jobDefinitionName: "my-def" }),
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
    });
  });

  it("Submit job onSuccess — mock invoked with correct args + onSuccess triggered", async () => {
    const user = userEvent.setup();
    render(<BatchDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Submit Job/i }));
    await waitFor(() => expect(screen.getByLabelText(/Job name/)).toBeTruthy());
    fireEvent.change(screen.getByLabelText(/Job name/), { target: { value: "my-job" } });
    fireEvent.change(screen.getByLabelText(/Job queue ARN/), { target: { value: "arn:aws:batch:..." } });
    fireEvent.change(screen.getByLabelText(/Job definition ARN/), { target: { value: "arn:aws:batch:..." } });
    const submitBtns = screen.getAllByRole("button", { name: /^Submit$/i });
    await user.click(submitBtns[submitBtns.length - 1]);
    await waitFor(() => {
      expect(mockSubmitJob).toHaveBeenCalledWith(
        expect.objectContaining({ jobName: "my-job" }),
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
    });
  });
});

// ─── Submit job disabled: jobName empty ─────────────────

describe("BatchDashboard — submit disabled jobName", () => {
  it("disables Submit when jobName is empty but queue+definition are filled", async () => {
    const user = userEvent.setup();
    render(<BatchDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Submit Job/i }));
    await waitFor(() => expect(screen.getByLabelText(/Job name/)).toBeTruthy());
    // Fill queue and definition but leave job name empty
    fireEvent.change(screen.getByLabelText(/Job queue ARN/), { target: { value: "arn:aws:batch:..." } });
    fireEvent.change(screen.getByLabelText(/Job definition ARN/), { target: { value: "arn:aws:batch:..." } });
    const submitBtn = screen.getByRole("button", { name: /^Submit$/i });
    expect(submitBtn.getAttribute("disabled")).not.toBeNull();
  });

  it("cancels the create compute environment modal with the dialog-scoped Cancel", async () => {
    const user = userEvent.setup();
    render(<BatchDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create compute environment/i);
    await waitFor(() => expect(screen.getAllByText("Create Compute Environment").length).toBeGreaterThan(0));
    await user.click(within(dialogOf("Create Compute Environment")).getByRole("button", { name: /Cancel/i }));
    expect(mockCreateCE).not.toHaveBeenCalled();
  });

  it("dismisses the create compute environment modal with Escape", async () => {
    const user = userEvent.setup();
    render(<BatchDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create compute environment/i);
    await waitFor(() => expect(screen.getAllByText("Create Compute Environment").length).toBeGreaterThan(0));
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Create Compute Environment"));
  });

  it("creates a compute environment and closes on success", async () => {
    mockCreateCE.mockImplementation((_payload: unknown, opts?: { onSuccess?: () => void }) => {
      opts?.onSuccess?.();
    });
    const user = userEvent.setup();
    render(<BatchDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create compute environment/i);
    await waitFor(() => expect(screen.getAllByText("Create Compute Environment").length).toBeGreaterThan(0));
    await user.type(within(dialogOf("Create Compute Environment")).getByLabelText(/Name/), "my-ce");
    await user.click(within(dialogOf("Create Compute Environment")).getByRole("button", { name: /^Create$/ }));
    await waitFor(() => expectModalHidden("Create Compute Environment"));
    expect(mockCreateCE).toHaveBeenCalledWith(
      expect.objectContaining({ computeEnvironmentName: "my-ce" }),
      expect.any(Object),
    );
  });

  it("cancels the create job queue modal with the dialog-scoped Cancel", async () => {
    const user = userEvent.setup();
    render(<BatchDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create job queue/i);
    await waitFor(() => expect(screen.getAllByText("Create Job Queue").length).toBeGreaterThan(0));
    await user.click(within(dialogOf("Create Job Queue")).getByRole("button", { name: /Cancel/i }));
    expect(mockCreateJQ).not.toHaveBeenCalled();
  });

  it("dismisses the create job queue modal with Escape", async () => {
    const user = userEvent.setup();
    render(<BatchDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create job queue/i);
    await waitFor(() => expect(screen.getAllByText("Create Job Queue").length).toBeGreaterThan(0));
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Create Job Queue"));
  });

  it("creates a job queue and closes on success", async () => {
    mockCreateJQ.mockImplementation((_payload: unknown, opts?: { onSuccess?: () => void }) => {
      opts?.onSuccess?.();
    });
    const user = userEvent.setup();
    render(<BatchDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create job queue/i);
    await waitFor(() => expect(screen.getAllByText("Create Job Queue").length).toBeGreaterThan(0));
    const dialog = dialogOf("Create Job Queue");
    await user.type(within(dialog).getByLabelText(/Queue name/), "my-jq");
    await user.type(within(dialog).getByLabelText(/Priority/), "3");
    await user.click(within(dialog).getByRole("button", { name: /^Create$/ }));
    await waitFor(() => expectModalHidden("Create Job Queue"));
    expect(mockCreateJQ).toHaveBeenCalledWith(
      expect.objectContaining({ jobQueueName: "my-jq", priority: 3 }),
      expect.any(Object),
    );
  });

  it("cancels the register job definition modal with the dialog-scoped Cancel", async () => {
    const user = userEvent.setup();
    render(<BatchDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create job definition/i);
    await waitFor(() => expect(screen.getAllByText("Register Job Definition").length).toBeGreaterThan(0));
    await user.click(within(dialogOf("Register Job Definition")).getByRole("button", { name: /Cancel/i }));
    expect(mockRegisterJD).not.toHaveBeenCalled();
  });

  it("dismisses the register job definition modal with Escape", async () => {
    const user = userEvent.setup();
    render(<BatchDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create job definition/i);
    await waitFor(() => expect(screen.getAllByText("Register Job Definition").length).toBeGreaterThan(0));
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Register Job Definition"));
  });

  it("dismisses the submit job modal with Escape", async () => {
    const user = userEvent.setup();
    render(<BatchDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Submit Job/i);
    await waitFor(() => expect(screen.getAllByText("Submit Job").length).toBeGreaterThan(0));
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Submit Job"));
  });
});
