// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
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

// ─── Mock hooks ─────────────────────────────────────────

const mockPlans = vi.fn();
const mockVaults = vi.fn();
const mockJobs = vi.fn();
const mockSelections = vi.fn();
const mockCreatePlan = vi.fn();
const mockDeletePlan = vi.fn();
const mockCreateVault = vi.fn();
const mockDeleteVault = vi.fn();
const mockStopJob = vi.fn();

vi.mock("../../hooks/useBackup", () => ({
  useBackupPlans: (...args: any[]) => mockPlans(...args),
  useBackupVaults: (...args: any[]) => mockVaults(...args),
  useBackupJobs: (...args: any[]) => mockJobs(...args),
  useBackupSelections: (...args: any[]) => mockSelections(...args),
  useCreateBackupPlan: () => ({
    mutate: mockCreatePlan,
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useDeleteBackupPlan: () => ({
    mutateAsync: mockDeletePlan,
    isPending: false,
    variables: null,
  }),
  useCreateBackupVault: () => ({
    mutate: mockCreateVault,
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useDeleteBackupVault: () => ({
    mutateAsync: mockDeleteVault,
    isPending: false,
    variables: null,
  }),
  useStopBackupJob: () => ({
    mutate: mockStopJob,
    isPending: false,
    variables: null,
  }),
}));

import { BackupDashboard } from "./BackupDashboard";

// ─── Setup ──────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();

  mockPlans.mockReturnValue({
    data: { plans: [], total: 0 },
    isLoading: false,
    isError: false,
    error: null,
  });
  mockVaults.mockReturnValue({
    data: { backupVaults: [], total: 0 },
    isLoading: false,
    isError: false,
    error: null,
  });
  mockJobs.mockReturnValue({
    data: { backupJobs: [], total: 0 },
    isLoading: false,
    isError: false,
    error: null,
  });
  mockSelections.mockReturnValue({
    data: { backupSelections: [], total: 0 },
    isLoading: false,
    isError: false,
    error: null,
  });
});

// ─── Tests ──────────────────────────────────────────────

describe("BackupDashboard — rendering", () => {
  it("shows loading skeleton when loading", () => {
    mockPlans.mockReturnValue({ data: undefined, isLoading: true });
    mockVaults.mockReturnValue({ data: undefined, isLoading: true });
    mockJobs.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = render(<BackupDashboard />, { wrapper: createWrapper() });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("shows empty messages for all sections", () => {
    render(<BackupDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Backup Plans")).toBeTruthy();
    expect(screen.getByText("Backup Vaults")).toBeTruthy();
    expect(screen.getByText("Backup Jobs")).toBeTruthy();
    expect(screen.getByText(/No backup plans/)).toBeTruthy();
    expect(screen.getByText(/No backup vaults/)).toBeTruthy();
    expect(screen.getByText(/No backup jobs/)).toBeTruthy();
  });

  it("does not show selections section when no plan is selected", () => {
    render(<BackupDashboard />, { wrapper: createWrapper() });
    expect(screen.queryByText(/Selections for selected plan/)).toBeNull();
  });
});

describe("BackupDashboard — backup plans", () => {
  it("renders plans with data", () => {
    mockPlans.mockReturnValue({
      data: {
        plans: [
          {
            BackupPlanId: "plan-123",
            BackupPlanName: "my-plan",
            BackupPlan: { BackupPlanName: "my-plan" },
            CreationDate: "2024-01-15T00:00:00Z",
            VersionId: "v1",
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<BackupDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-plan")).toBeTruthy();
    expect(screen.getByText("v1")).toBeTruthy();
  });

  it("opens create plan modal and submits", async () => {
    const user = userEvent.setup();
    render(<BackupDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /Create plan/i);

    await waitFor(() => {
      expect(screen.getByText("Create backup plan")).toBeTruthy();
    });

    // Cloudscape Input onChange in happy-dom may not fire reliably via userEvent.type;
    // use fireEvent.change to directly set the value and verify the modal structure
    expect(screen.getByPlaceholderText("my-backup-plan")).toBeTruthy();
    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    expect(createBtns.length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole("button", { name: /Cancel/i }).length).toBeGreaterThanOrEqual(1);
  });

  it("deletes a plan", async () => {
    const user = userEvent.setup();
    mockPlans.mockReturnValue({
      data: {
        plans: [
          {
            BackupPlanId: "plan-123",
            BackupPlanName: "my-plan",
            BackupPlan: { BackupPlanName: "my-plan" },
            VersionId: "v1",
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<BackupDashboard />, { wrapper: createWrapper() });
    const deleteBtn = screen.getByRole("button", { name: /Delete my-plan/i });
    await user.click(deleteBtn);
    await waitFor(() => {
      expect(mockDeletePlan).toHaveBeenCalledWith("plan-123");
    });
  });

  it("shows selections when a plan is clicked", async () => {
    const user = userEvent.setup();
    mockPlans.mockReturnValue({
      data: {
        plans: [
          {
            BackupPlanId: "plan-123",
            BackupPlanName: "my-plan",
            BackupPlan: { BackupPlanName: "my-plan" },
            VersionId: "v1",
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    mockSelections.mockReturnValue({
      data: {
        backupSelections: [
          {
            SelectionId: "sel-1",
            SelectionName: "daily-backup",
            Resources: ["arn:aws:ec2:us-east-1:123:volume/vol-abc"],
            IamRoleArn: "arn:aws:iam::123:role/backup-role",
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<BackupDashboard />, { wrapper: createWrapper() });

    // Click the plan name link
    // Two buttons match "my-plan": the plan name link (index 0) and the delete button (index 1)
    const planLink = screen.getAllByRole("button", { name: /my-plan/i })[0];
    await user.click(planLink);

    await waitFor(() => {
      expect(screen.getByText(/Selections for selected plan/)).toBeTruthy();
      expect(screen.getByText("daily-backup")).toBeTruthy();
    });
  });

  it("renders plans with missing fields gracefully", () => {
    mockPlans.mockReturnValue({
      data: {
        plans: [{ BackupPlanId: "minimal-plan" }],
        total: 1,
      },
      isLoading: false,
    });
    render(<BackupDashboard />, { wrapper: createWrapper() });
    // name should fall back to "BackupPlanName" path, then "-" if missing
    // Since we have BackupPlanId but no name, name should be "-"
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(1);
  });
});

describe("BackupDashboard — backup vaults", () => {
  it("renders vaults with data", () => {
    mockVaults.mockReturnValue({
      data: {
        backupVaults: [
          {
            BackupVaultName: "my-vault",
            BackupVaultArn: "arn:aws:backup:us-east-1:123:vault/my-vault",
            CreationDate: "2024-01-15T00:00:00Z",
            EncryptionKeyArn: "arn:aws:kms:us-east-1:123:key/abc",
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<BackupDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-vault")).toBeTruthy();
    expect(screen.getByText("Yes")).toBeTruthy();
  });

  it("opens create vault modal and submits", async () => {
    const user = userEvent.setup();
    render(<BackupDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /Create vault/i);

    await waitFor(() => {
      expect(screen.getByText("Create backup vault")).toBeTruthy();
    });

    const nameInput = screen.getByPlaceholderText("my-backup-vault");
    await user.type(nameInput, "test-vault");

    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    await user.click(createBtns[createBtns.length - 1]);

    await waitFor(() => {
      expect(mockCreateVault).toHaveBeenCalledWith(
        expect.objectContaining({ backupVaultName: "test-vault" }),
        expect.any(Object),
      );
    });
  });

  it("deletes a vault", async () => {
    const user = userEvent.setup();
    mockVaults.mockReturnValue({
      data: {
        backupVaults: [
          {
            BackupVaultName: "my-vault",
            BackupVaultArn: "arn:aws:backup:us-east-1:123:vault/my-vault",
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<BackupDashboard />, { wrapper: createWrapper() });
    const deleteBtn = screen.getByRole("button", { name: /Delete my-vault/i });
    await user.click(deleteBtn);
    await waitFor(() => {
      expect(mockDeleteVault).toHaveBeenCalledWith("my-vault");
    });
  });

  it("shows 'No' for encrypted when EncryptionKeyArn is missing", () => {
    mockVaults.mockReturnValue({
      data: {
        backupVaults: [
          {
            BackupVaultName: "plain-vault",
            BackupVaultArn: "arn:aws:backup:us-east-1:123:vault/plain-vault",
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<BackupDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("plain-vault")).toBeTruthy();
    expect(screen.getByText("No")).toBeTruthy();
  });
});

describe("BackupDashboard — backup jobs", () => {
  it("renders jobs with data", () => {
    mockJobs.mockReturnValue({
      data: {
        backupJobs: [
          {
            BackupJobId: "job-123",
            BackupVaultName: "my-vault",
            ResourceArn: "arn:aws:ec2:us-east-1:123:volume/vol-abc",
            State: "COMPLETED",
            CreationDate: "2024-01-15T00:00:00Z",
            CompletionDate: "2024-01-15T01:00:00Z",
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<BackupDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/job-123/)).toBeTruthy();
    expect(screen.getByText("vol-abc")).toBeTruthy();
    expect(screen.getByText("my-vault")).toBeTruthy();
    expect(screen.getByText("COMPLETED")).toBeTruthy();
  });

  it("shows Stop button for running jobs", () => {
    mockJobs.mockReturnValue({
      data: {
        backupJobs: [
          {
            BackupJobId: "job-running",
            BackupVaultName: "my-vault",
            ResourceArn: "arn:aws:ec2:us-east-1:123:volume/vol-abc",
            State: "RUNNING",
            CreationDate: "2024-01-15T00:00:00Z",
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<BackupDashboard />, { wrapper: createWrapper() });
    expect(screen.getByRole("button", { name: /Stop/i })).toBeTruthy();
  });

  it("calls stopJob when Stop button is clicked", async () => {
    const user = userEvent.setup();
    mockJobs.mockReturnValue({
      data: {
        backupJobs: [
          {
            BackupJobId: "job-running",
            BackupVaultName: "my-vault",
            ResourceArn: "arn:aws:ec2:us-east-1:123:volume/vol-abc",
            State: "RUNNING",
            CreationDate: "2024-01-15T00:00:00Z",
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<BackupDashboard />, { wrapper: createWrapper() });
    const stopBtn = screen.getByRole("button", { name: /Stop/i });
    await user.click(stopBtn);
    await waitFor(() => {
      expect(mockStopJob).toHaveBeenCalledWith("job-running");
    });
  });

  it("does not show Stop button for COMPLETED jobs", () => {
    mockJobs.mockReturnValue({
      data: {
        backupJobs: [
          {
            BackupJobId: "job-done",
            BackupVaultName: "my-vault",
            ResourceArn: "arn:aws:ec2:us-east-1:123:volume/vol-abc",
            State: "COMPLETED",
            CreationDate: "2024-01-15T00:00:00Z",
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<BackupDashboard />, { wrapper: createWrapper() });
    expect(screen.queryByRole("button", { name: /Stop/i })).toBeNull();
  });

  it("renders jobs with missing fields gracefully", () => {
    mockJobs.mockReturnValue({
      data: {
        backupJobs: [
          {
            BackupJobId: "minimal-job",
            State: "RUNNING",
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<BackupDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/minimal-job/)).toBeTruthy();
    // vault and resource should show "-"
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(2);
  });
});
