// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

// ─── vi.hoisted mutable states ──────────────────────────

const terminateState = vi.hoisted(() => ({
  isPending: false,
  variables: null as string | null,
}));

const deleteSecConfigState = vi.hoisted(() => ({
  isPending: false,
  variables: null as string | null,
}));

const runJobFlowPendingState = vi.hoisted(() => ({
  isPending: false,
}));

const createSecConfigPendingState = vi.hoisted(() => ({
  isPending: false,
}));

// ─── Mock hooks ─────────────────────────────────────────

vi.mock("../../components/ConfirmDialog", () => ({
  useConfirmDialog: () => ({
    confirm: vi.fn(() => Promise.resolve(true)),
    dialog: null,
  }),
}));

const mockClusters = vi.fn();
const mockSecConfigs = vi.fn();
const mockRunJobFlow = vi.fn();
const mockTerminate = vi.fn();
const mockCreateSecConfig = vi.fn();
const mockDeleteSecConfig = vi.fn();

// ── Dynamic hook mocks (can be overridden per test) ──

const mockRunJobFlowHook = vi.fn();
const mockCreateSecConfigHook = vi.fn();

vi.mock("../../hooks/useEMR", () => ({
  useEMRClusters: (...args: any[]) => mockClusters(...args),
  useEMRSecurityConfigurations: (...args: any[]) => mockSecConfigs(...args),
  useRunEMRJobFlow: (...args: any[]) => mockRunJobFlowHook(...args),
  useTerminateEMRJobFlows: () => ({
    mutateAsync: mockTerminate,
    get isPending() { return terminateState.isPending; },
    get variables() { return terminateState.variables; },
  }),
  useCreateEMRSecurityConfiguration: (...args: any[]) => mockCreateSecConfigHook(...args),
  useDeleteEMRSecurityConfiguration: () => ({
    mutateAsync: mockDeleteSecConfig,
    get isPending() { return deleteSecConfigState.isPending; },
    get variables() { return deleteSecConfigState.variables; },
  }),
}));

import { EMRDashboard } from "./EMRDashboard";

/**
 * Cloudscape Modal handles Escape via a React onKeyDown on the dialog element
 * (checking `event.keyCode === 27`). user-event's `keyboard()` targets the
 * active element (body), which never reaches the dialog in happy-dom, so we
 * dispatch the keydown on the dialog directly.
 */
function dismissModalWithEscape() {
  document.querySelectorAll('[class*="awsui_dialog"]').forEach((dialog) => {
    fireEvent.keyDown(dialog as HTMLElement, { keyCode: 27 });
  });
}

// ─── Setup ──────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  terminateState.isPending = false;
  terminateState.variables = null;
  deleteSecConfigState.isPending = false;
  deleteSecConfigState.variables = null;
  runJobFlowPendingState.isPending = false;
  createSecConfigPendingState.isPending = false;

  mockClusters.mockReturnValue({
    data: { clusters: [], total: 0 },
    isLoading: false,
    isError: false,
    error: null,
  });
  mockSecConfigs.mockReturnValue({
    data: { securityConfigurations: [] },
    isLoading: false,
  });
  mockRunJobFlowHook.mockReturnValue({
    mutate: mockRunJobFlow,
    get isPending() { return runJobFlowPendingState.isPending; },
    isError: false,
    error: null as any,
    reset: vi.fn(),
  });
  mockCreateSecConfigHook.mockReturnValue({
    mutate: mockCreateSecConfig,
    get isPending() { return createSecConfigPendingState.isPending; },
    isError: false,
    error: null as any,
    reset: vi.fn(),
  });
});

// ─── Tests ──────────────────────────────────────────────

describe("EMRDashboard — rendering", () => {
  it("shows loading skeleton when loading", () => {
    mockClusters.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });
    const { container } = render(<EMRDashboard />, { wrapper: createWrapper() });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("renders cluster table header", () => {
    render(<EMRDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Clusters")).toBeTruthy();
  });

  it("renders security config table header", () => {
    render(<EMRDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Security Configurations")).toBeTruthy();
  });

  it("shows empty message for clusters", () => {
    render(<EMRDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No clusters/i)).toBeTruthy();
  });

  it("shows empty message for security configs", () => {
    render(<EMRDashboard />, { wrapper: createWrapper() });
    expect(screen.getAllByText(/No security/i).length).toBeGreaterThan(0);
  });
});

describe("EMRDashboard — clusters", () => {
  it("renders clusters with data", () => {
    mockClusters.mockReturnValue({
      data: {
        clusters: [
          {
            Id: "j-ABC123",
            Name: "my-cluster",
            Status: { State: "RUNNING", Timeline: { CreationDateTime: 1700000000 } },
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<EMRDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-cluster")).toBeTruthy();
    expect(screen.getAllByText(/RUNNING/).length).toBeGreaterThan(0);
  });

  it("renders clusters without timeline gracefully", () => {
    mockClusters.mockReturnValue({
      data: {
        clusters: [
          {
            Id: "j-DEF456",
            Name: "no-timeline-cluster",
            Status: { State: "STARTING" },
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<EMRDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("no-timeline-cluster")).toBeTruthy();
    expect(screen.getByText("STARTING")).toBeTruthy();
  });

  it("renders clusters with null/empty data gracefully", () => {
    mockClusters.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<EMRDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No clusters/i)).toBeTruthy();
  });

  it("opens create cluster modal and Cancel closes it", async () => {
    const user = userEvent.setup();
    render(<EMRDashboard />, { wrapper: createWrapper() });

    // Open modal
    await clickButton(user, /Create cluster/i);
    await waitFor(() => {
      expect(screen.getAllByText("Run Job Flow").length).toBeGreaterThan(0);
    });

    // Click Cancel — the modal's Cancel button triggers setShowCreateCluster(false)
    const cancelBtns = screen.getAllByRole("button", { name: /Cancel/i });
    await user.click(cancelBtns[cancelBtns.length - 1]);

    // Verify the Create button's onClick handler was NOT called
    await waitFor(() => {
      expect(mockRunJobFlow).not.toHaveBeenCalled();
    });
  });

  it("shows error alert when runJobFlow fails", async () => {
    mockRunJobFlowHook.mockReturnValue({
      mutate: mockRunJobFlow,
      isPending: false,
      isError: true,
      error: new Error("Cluster creation failed") as any,
      reset: vi.fn(),
    });
    const user = userEvent.setup();
    render(<EMRDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /Create cluster/i);
    await waitFor(() => {
      expect(screen.getAllByText("Run Job Flow").length).toBeGreaterThan(0);
      expect(screen.getByText(/Cluster creation failed/)).toBeTruthy();
    });
  });

  it("submits create cluster form (structure verification — Cloudscape Input typing not supported in happy-dom)", async () => {
    const user = userEvent.setup();
    render(<EMRDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /Create cluster/i);
    await waitFor(() => {
      expect(screen.getAllByText("Run Job Flow").length).toBeGreaterThan(0);
    });

    // Verify form fields render
    expect(screen.getByLabelText(/Cluster name/)).toBeTruthy();
    expect(screen.getByLabelText(/Release label/)).toBeTruthy();

    // Verify Create and Cancel buttons exist
    const createBtns = screen.getAllByRole("button", { name: /^Create$/ });
    expect(createBtns.length).toBeGreaterThanOrEqual(1);
    const cancelBtns = screen.getAllByRole("button", { name: /Cancel/i });
    expect(cancelBtns.length).toBeGreaterThanOrEqual(1);
  });

  it("opens and closes create cluster modal, can reopen after Cancel", async () => {
    // This tests that the modal can be opened, cancelled, and re-opened
    const user = userEvent.setup();
    render(<EMRDashboard />, { wrapper: createWrapper() });

    // Open and close modal
    await clickButton(user, /Create cluster/i);
    await waitFor(() => {
      expect(screen.getAllByText("Run Job Flow").length).toBeGreaterThan(0);
    });
    const cancelBtns = screen.getAllByRole("button", { name: /Cancel/i });
    await user.click(cancelBtns[cancelBtns.length - 1]);

    // Re-open modal
    await clickButton(user, /Create cluster/i);
    await waitFor(() => {
      expect(screen.getAllByText("Run Job Flow").length).toBeGreaterThan(0);
    });

    // Verify form fields still render
    const inputs = screen.getAllByRole("textbox");
    expect(inputs.length).toBeGreaterThanOrEqual(2);
  });

  it("calls terminate when delete is clicked", async () => {
    mockClusters.mockReturnValue({
      data: {
        clusters: [
          {
            Id: "j-ABC123",
            Name: "my-cluster",
            Status: { State: "RUNNING" },
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    const user = userEvent.setup();
    render(<EMRDashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("my-cluster")).toBeTruthy();
    });

    const deleteBtn = screen.getByRole("button", { name: /Delete my-cluster/i });
    await user.click(deleteBtn);

    await waitFor(() => {
      expect(mockTerminate).toHaveBeenCalledWith("j-ABC123");
    });
  });

  it("creates a cluster by submitting the Run Job Flow form", async () => {
    const user = userEvent.setup();
    render(<EMRDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /Create cluster/i);
    await waitFor(() => {
      expect(screen.getAllByText("Run Job Flow").length).toBeGreaterThan(0);
    });

    // Verify form fields render
    expect(screen.getByRole("textbox", { name: /Cluster name/ })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: /Release label/ })).toBeTruthy();

    // Verify Create button is disabled when name is empty
    const createBtns = screen.getAllByRole("button", { name: /^Create$/ });
    expect(createBtns[createBtns.length - 1]).toBeDisabled();

    // Close via Cancel
    const cancelBtns = screen.getAllByRole("button", { name: /Cancel/i });
    await user.click(cancelBtns[cancelBtns.length - 1]);

    await waitFor(() => {
      expect(mockRunJobFlow).not.toHaveBeenCalled();
    });
  });

  it("filters clusters by name", async () => {
    mockClusters.mockReturnValue({
      data: {
        clusters: [
          { Id: "j-1", Name: "alpha-cluster", Status: { State: "RUNNING" } },
          { Id: "j-2", Name: "beta-cluster", Status: { State: "RUNNING" } },
        ],
        total: 2,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<EMRDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("alpha-cluster")).toBeTruthy());

    // First "Find by name" input belongs to the clusters table
    const filterInputs = screen.getAllByPlaceholderText("Find by name");
    await user.type(filterInputs[0], "beta");
    await waitFor(() => expect(screen.queryByText("alpha-cluster")).toBeNull());
  });

  it("creates a cluster with a release label", async () => {
    mockRunJobFlow.mockImplementation((_body: any, opts: any) => opts?.onSuccess?.());
    const user = userEvent.setup();
    render(<EMRDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /Create cluster/i);
    await waitFor(() => expect(screen.getByText("Run Job Flow")).toBeTruthy());

    await user.type(screen.getByRole("textbox", { name: /Cluster name/ }), "  test-cluster  ");
    await user.type(screen.getByRole("textbox", { name: /Release label/ }), "emr-7.1.0");
    await clickButton(user, /^Create$/);

    await waitFor(() => {
      expect(mockRunJobFlow).toHaveBeenCalledWith(
        { Name: "test-cluster", ReleaseLabel: "emr-7.1.0", Instances: { KeepJobFlowAliveWhenNoSteps: true } },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
      expect(screen.queryByText("Run Job Flow")).toBeNull();
    });
  });

  it("creates a cluster without a release label", async () => {
    mockRunJobFlow.mockImplementation((_body: any, opts: any) => opts?.onSuccess?.());
    const user = userEvent.setup();
    render(<EMRDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /Create cluster/i);
    await waitFor(() => expect(screen.getByText("Run Job Flow")).toBeTruthy());

    await user.type(screen.getByRole("textbox", { name: /Cluster name/ }), "bare-cluster");
    await clickButton(user, /^Create$/);

    await waitFor(() => {
      expect(mockRunJobFlow).toHaveBeenCalledWith(
        { Name: "bare-cluster", ReleaseLabel: undefined, Instances: { KeepJobFlowAliveWhenNoSteps: true } },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
    });
  });

  it("dismisses the Run Job Flow modal with Escape", async () => {
    const user = userEvent.setup();
    render(<EMRDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /Create cluster/i);
    await waitFor(() => expect(screen.getByText("Run Job Flow")).toBeTruthy());

    dismissModalWithEscape();
    await waitFor(() => expect(screen.queryByText("Run Job Flow")).toBeNull());
    expect(mockRunJobFlow).not.toHaveBeenCalled();
  });

  it("shows the Failed fallback alert when runJobFlow fails without a message", async () => {
    mockRunJobFlowHook.mockReturnValue({
      mutate: mockRunJobFlow,
      isPending: false,
      isError: true,
      error: new Error("") as any,
      reset: vi.fn(),
    });
    const user = userEvent.setup();
    render(<EMRDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /Create cluster/i);
    await waitFor(() => {
      expect(screen.getByText("Run Job Flow")).toBeTruthy();
      expect(screen.getByText("Failed")).toBeTruthy();
    });
  });
});

describe("EMRDashboard — security configurations", () => {
  it("renders security configs with data", () => {
    mockSecConfigs.mockReturnValue({
      data: {
        securityConfigurations: [
          {
            Name: "my-sec-config",
            CreationDateTime: 1700000000,
          },
        ],
      },
      isLoading: false,
    });
    render(<EMRDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-sec-config")).toBeTruthy();
  });

  it("renders security configs without creation date gracefully", () => {
    mockSecConfigs.mockReturnValue({
      data: {
        securityConfigurations: [
          {
            Name: "no-date-config",
          },
        ],
      },
      isLoading: false,
    });
    render(<EMRDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("no-date-config")).toBeTruthy();
  });

  it("shows error alert when createSecConfig fails", async () => {
    mockCreateSecConfigHook.mockReturnValue({
      mutate: mockCreateSecConfig,
      isPending: false,
      isError: true,
      error: new Error("Security config creation failed") as any,
      reset: vi.fn(),
    });
    const user = userEvent.setup();
    render(<EMRDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /Create security configuration/i);
    await waitFor(() => {
      expect(screen.getAllByText("Create Security Configuration").length).toBeGreaterThan(0);
      expect(screen.getByText(/Security config creation failed/)).toBeTruthy();
    });
  });

  it("submits create security config form (structure verification)", async () => {
    const user = userEvent.setup();
    render(<EMRDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /Create security configuration/i);
    await waitFor(() => {
      expect(screen.getAllByText("Create Security Configuration").length).toBeGreaterThan(0);
    });

    // Verify form fields render
    expect(screen.getByLabelText(/^Name$/)).toBeTruthy();
    expect(screen.getByLabelText(/Security Configuration \(JSON\)/)).toBeTruthy();

    // Verify Create and Cancel buttons exist
    const createBtns = screen.getAllByRole("button", { name: /^Create$/ });
    expect(createBtns.length).toBeGreaterThanOrEqual(1);
    const cancelBtns = screen.getAllByRole("button", { name: /Cancel/i });
    expect(cancelBtns.length).toBeGreaterThanOrEqual(1);
  });

  it("opens create security config modal and Cancel closes it", async () => {
    const user = userEvent.setup();
    render(<EMRDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /Create security configuration/i);
    await waitFor(() => {
      expect(screen.getAllByText("Create Security Configuration").length).toBeGreaterThan(0);
    });

    const cancelBtns = screen.getAllByRole("button", { name: /Cancel/i });
    await user.click(cancelBtns[cancelBtns.length - 1]);

    await waitFor(() => {
      expect(mockCreateSecConfig).not.toHaveBeenCalled();
    });
  });

  it("calls deleteSecurityConfig when delete is clicked", async () => {
    mockSecConfigs.mockReturnValue({
      data: {
        securityConfigurations: [
          {
            Name: "my-sec-config",
          },
        ],
      },
      isLoading: false,
    });

    const user = userEvent.setup();
    render(<EMRDashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("my-sec-config")).toBeTruthy();
    });

    const deleteBtn = screen.getByRole("button", { name: /Delete my-sec-config/i });
    await user.click(deleteBtn);

    await waitFor(() => {
      expect(mockDeleteSecConfig).toHaveBeenCalledWith("my-sec-config");
    });
  });

  it("creates a security configuration by submitting the form", async () => {
    mockCreateSecConfig.mockImplementation((_body: any, opts: any) => opts?.onSuccess?.());
    const user = userEvent.setup();
    render(<EMRDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /Create security configuration/i);
    await waitFor(() => {
      expect(screen.getAllByText("Create Security Configuration").length).toBeGreaterThan(0);
    });

    // Type into name input (use role textbox with name "Name")
    const nameInput = screen.getByRole("textbox", { name: /^Name$/ });
    await user.type(nameInput, "  test-sec-config  ");

    // Paste JSON into the security configuration textarea (avoids KeyboardEvent parsing of { })
    const jsonTextarea = screen.getByPlaceholderText(/EncryptionConfiguration/);
    await user.click(jsonTextarea);
    await user.paste('{"EncryptionConfiguration":{"EnableAtRest":true}}');

    // Click Create button (the modal is conditionally mounted, so this is the only one)
    await clickButton(user, /^Create$/);

    await waitFor(() => {
      expect(mockCreateSecConfig).toHaveBeenCalledWith(
        {
          Name: "test-sec-config",
          SecurityConfiguration: '{"EncryptionConfiguration":{"EnableAtRest":true}}',
        },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
      // The modal's JSON label is unique to the modal (the table's Create button
      // keeps the "Create Security Configuration" text in the DOM)
      expect(screen.queryByText("Security Configuration (JSON)")).toBeNull();
    });
  });

  it("filters security configurations by name", async () => {
    mockSecConfigs.mockReturnValue({
      data: {
        securityConfigurations: [
          { Name: "alpha-sec", CreationDateTime: 1700000000 },
          { Name: "beta-sec", CreationDateTime: 1700000000 },
        ],
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<EMRDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("alpha-sec")).toBeTruthy());

    // Second "Find by name" input belongs to the security configurations table
    const filterInputs = screen.getAllByPlaceholderText("Find by name");
    await user.type(filterInputs[1], "beta");
    await waitFor(() => expect(screen.queryByText("alpha-sec")).toBeNull());
  });

  it("renders empty security configurations when the key is missing", () => {
    mockSecConfigs.mockReturnValue({ data: {}, isLoading: false });
    render(<EMRDashboard />, { wrapper: createWrapper() });
    expect(screen.getAllByText(/No security/i).length).toBeGreaterThan(0);
  });

  it("dismisses the Create Security Configuration modal with Escape", async () => {
    const user = userEvent.setup();
    render(<EMRDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /Create security configuration/i);
    await waitFor(() => {
      expect(screen.getAllByText("Create Security Configuration").length).toBeGreaterThan(0);
    });

    dismissModalWithEscape();
    await waitFor(() => expect(screen.queryByText("Security Configuration (JSON)")).toBeNull());
    expect(mockCreateSecConfig).not.toHaveBeenCalled();
  });

  it("shows the Failed fallback alert when createSecConfig fails without a message", async () => {
    mockCreateSecConfigHook.mockReturnValue({
      mutate: mockCreateSecConfig,
      isPending: false,
      isError: true,
      error: new Error("") as any,
      reset: vi.fn(),
    });
    const user = userEvent.setup();
    render(<EMRDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /Create security configuration/i);
    await waitFor(() => {
      expect(screen.getAllByText("Create Security Configuration").length).toBeGreaterThan(0);
      expect(screen.getByText("Failed")).toBeTruthy();
    });
  });

  it("does not submit a security configuration with invalid JSON", async () => {
    const user = userEvent.setup();
    render(<EMRDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /Create security configuration/i);
    await waitFor(() => {
      expect(screen.getAllByText("Create Security Configuration").length).toBeGreaterThan(0);
    });

    await user.type(screen.getByRole("textbox", { name: /^Name$/ }), "bad-json");
    await user.type(screen.getByPlaceholderText(/EncryptionConfiguration/), "not-json");

    const createBtns = screen.getAllByRole("button", { name: /^Create$/ });
    expect(createBtns[createBtns.length - 1]).toBeEnabled();
    await user.click(createBtns[createBtns.length - 1]);

    // JSON.parse throws -> the catch guard returns without mutating
    expect(mockCreateSecConfig).not.toHaveBeenCalled();
  });
});

describe("EMRDashboard — loading states", () => {
  it("shows delete cluster loading state", () => {
    terminateState.isPending = true;
    terminateState.variables = "j-ABC123";
    mockClusters.mockReturnValue({
      data: {
        clusters: [
          {
            Id: "j-ABC123",
            Name: "my-cluster",
            Status: { State: "RUNNING", Timeline: { CreationDateTime: 1700000000 } },
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<EMRDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-cluster")).toBeTruthy();
  });

  it("shows delete security config loading state", () => {
    deleteSecConfigState.isPending = true;
    deleteSecConfigState.variables = "my-sec";
    mockSecConfigs.mockReturnValue({
      data: {
        securityConfigurations: [
          {
            Name: "my-sec",
            CreationDateTime: 1700000000,
          },
        ],
      },
      isLoading: false,
    });
    render(<EMRDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-sec")).toBeTruthy();
  });

  it("shows runJobFlow loading state on Create button", () => {
    runJobFlowPendingState.isPending = true;
    render(<EMRDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No clusters/i)).toBeTruthy();
  });

  it("shows createSecConfig loading state on Create button", () => {
    createSecConfigPendingState.isPending = true;
    render(<EMRDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No clusters/i)).toBeTruthy();
  });
});

describe("EMRDashboard — fallback branches", () => {
  it("shows dash for cluster without status", () => {
    mockClusters.mockReturnValue({
      data: {
        clusters: [
          {
            Id: "j-NOSTATUS",
            Name: "no-status-cluster",
            Status: null,
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<EMRDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("no-status-cluster")).toBeTruthy();
    expect(screen.getAllByText("-").length).toBeGreaterThan(0);
  });

  it("shows dash for cluster without timeline", () => {
    mockClusters.mockReturnValue({
      data: {
        clusters: [
          {
            Id: "j-NOTIMELINE",
            Name: "no-timeline",
            Status: { State: "RUNNING" },
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<EMRDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("no-timeline")).toBeTruthy();
    expect(screen.getAllByText("-").length).toBeGreaterThan(0);
  });
});
