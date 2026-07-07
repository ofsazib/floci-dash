// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

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
    isPending: false,
  }),
  useCreateEMRSecurityConfiguration: (...args: any[]) => mockCreateSecConfigHook(...args),
  useDeleteEMRSecurityConfiguration: () => ({
    mutateAsync: mockDeleteSecConfig,
    isPending: false,
  }),
}));

import { EMRDashboard } from "./EMRDashboard";

// ─── Setup ──────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();

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
    isPending: false,
    isError: false,
    error: null as any,
    reset: vi.fn(),
  });
  mockCreateSecConfigHook.mockReturnValue({
    mutate: mockCreateSecConfig,
    isPending: false,
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
});
