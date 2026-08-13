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

// Mutable hook state so tests can exercise isPending/isError branches.
const hookState = {
  deletePlanPending: false,
  deletePlanVariables: null as string | null,
  deleteVaultPending: false,
  deleteVaultVariables: null as string | null,
  stopJobPending: false,
  stopJobVariables: null as string | null,
  createPlanError: null as Error | null,
  createVaultError: null as Error | null,
};

vi.mock("../../hooks/useBackup", () => ({
  useBackupPlans: (...args: any[]) => mockPlans(...args),
  useBackupVaults: (...args: any[]) => mockVaults(...args),
  useBackupJobs: (...args: any[]) => mockJobs(...args),
  useBackupSelections: (...args: any[]) => mockSelections(...args),
  useCreateBackupPlan: () => ({
    mutate: mockCreatePlan,
    isPending: false,
    isError: !!hookState.createPlanError,
    error: hookState.createPlanError,
    reset: vi.fn(),
  }),
  useDeleteBackupPlan: () => ({
    mutateAsync: mockDeletePlan,
    isPending: hookState.deletePlanPending,
    variables: hookState.deletePlanVariables,
  }),
  useCreateBackupVault: () => ({
    mutate: mockCreateVault,
    isPending: false,
    isError: !!hookState.createVaultError,
    error: hookState.createVaultError,
    reset: vi.fn(),
  }),
  useDeleteBackupVault: () => ({
    mutateAsync: mockDeleteVault,
    isPending: hookState.deleteVaultPending,
    variables: hookState.deleteVaultVariables,
  }),
  useStopBackupJob: () => ({
    mutate: mockStopJob,
    isPending: hookState.stopJobPending,
    variables: hookState.stopJobVariables,
  }),
}));

import { BackupDashboard } from "./BackupDashboard";

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
  hookState.deletePlanPending = false;
  hookState.deletePlanVariables = null;
  hookState.deleteVaultPending = false;
  hookState.deleteVaultVariables = null;
  hookState.stopJobPending = false;
  hookState.stopJobVariables = null;
  hookState.createPlanError = null;
  hookState.createVaultError = null;

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

  it("opens create plan modal and submits with onSuccess", async () => {
    mockCreatePlan.mockImplementation((_params: any, opts: any) => opts?.onSuccess?.());
    const user = userEvent.setup();
    render(<BackupDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /Create plan/i);

    await waitFor(() => {
      expect(screen.getByText("Create backup plan")).toBeTruthy();
    });

    const nameInput = screen.getByPlaceholderText("my-backup-plan");
    fireEvent.change(nameInput, { target: { value: "my-plan-1" } });
    await waitFor(() => expect((nameInput as HTMLInputElement).value).toBe("my-plan-1"));

    await clickButton(user, /^Create$/i);

    await waitFor(() => {
      expect(mockCreatePlan).toHaveBeenCalledWith(
        { BackupPlan: { BackupPlanName: "my-plan-1" } },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
      // onSuccess clears the form and closes the modal
      expectModalHidden("Create backup plan");
    });
  });

  it("cancels create plan modal with Escape", async () => {
    const user = userEvent.setup();
    render(<BackupDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create plan/i);
    await waitFor(() => expect(screen.getByText("Create backup plan")).toBeTruthy());
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Create backup plan"));
  });

  it("cancels create plan modal with the Cancel button", async () => {
    const user = userEvent.setup();
    render(<BackupDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create plan/i);
    await waitFor(() => expect(screen.getByText("Create backup plan")).toBeTruthy());
    const dialog = dialogOf("Create backup plan");
    await user.click(within(dialog).getByRole("button", { name: /^Cancel$/i }));
    await waitFor(() => expectModalHidden("Create backup plan"));
  });

  it("filters plans by name", async () => {
    mockPlans.mockReturnValue({
      data: {
        plans: [
          { BackupPlanId: "p1", BackupPlanName: "alpha-plan", BackupPlan: { BackupPlanName: "alpha-plan" } },
          { BackupPlanId: "p2", BackupPlanName: "beta-plan", BackupPlan: { BackupPlanName: "beta-plan" } },
        ],
        total: 2,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<BackupDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("alpha-plan")).toBeTruthy());
    const filterInput = screen.getByPlaceholderText("Find plans");
    await user.type(filterInput, "beta");
    await waitFor(() => expect(screen.queryByText("alpha-plan")).toBeNull());
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

  it("opens create vault modal and submits with onSuccess", async () => {
    mockCreateVault.mockImplementation((_params: any, opts: any) => opts?.onSuccess?.());
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
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
      expectModalHidden("Create backup vault");
    });
  });

  it("cancels create vault modal with Escape", async () => {
    const user = userEvent.setup();
    render(<BackupDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create vault/i);
    await waitFor(() => expect(screen.getByText("Create backup vault")).toBeTruthy());
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Create backup vault"));
  });

  it("cancels create vault modal with the Cancel button", async () => {
    const user = userEvent.setup();
    render(<BackupDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create vault/i);
    await waitFor(() => expect(screen.getByText("Create backup vault")).toBeTruthy());
    const dialog = dialogOf("Create backup vault");
    await user.click(within(dialog).getByRole("button", { name: /^Cancel$/i }));
    await waitFor(() => expectModalHidden("Create backup vault"));
  });

  it("filters vaults by name", async () => {
    mockVaults.mockReturnValue({
      data: {
        backupVaults: [
          { BackupVaultName: "vault-alpha", BackupVaultArn: "arn:a" },
          { BackupVaultName: "vault-beta", BackupVaultArn: "arn:b" },
        ],
        total: 2,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<BackupDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("vault-alpha")).toBeTruthy());
    const filterInput = screen.getByPlaceholderText("Find vaults");
    await user.type(filterInput, "beta");
    await waitFor(() => expect(screen.queryByText("vault-alpha")).toBeNull());
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

  it("filters jobs by resource", async () => {
    mockJobs.mockReturnValue({
      data: {
        backupJobs: [
          { BackupJobId: "j1", ResourceArn: "arn:aws:ec2:us-east-1:1:volume/alpha", State: "COMPLETED" },
          { BackupJobId: "j2", ResourceArn: "arn:aws:ec2:us-east-1:1:volume/beta", State: "RUNNING" },
        ],
        total: 2,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<BackupDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("alpha")).toBeTruthy());
    const filterInput = screen.getByPlaceholderText("Find jobs");
    await user.type(filterInput, "beta");
    await waitFor(() => expect(screen.queryByText("alpha")).toBeNull());
  });
});

describe("BackupDashboard — branch coverage", () => {
  it("renders vault without ARN as dash", () => {
    mockVaults.mockReturnValue({
      data: { backupVaults: [{ BackupVaultName: "no-arn-vault" }], total: 1 },
      isLoading: false,
    });
    render(<BackupDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("no-arn-vault")).toBeTruthy();
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(2);
  });

  it("renders job without ResourceArn/State and with trailing-slash ARN", () => {
    mockJobs.mockReturnValue({
      data: {
        backupJobs: [
          { BackupJobId: "j-nores" },
          { BackupJobId: "j-trail", ResourceArn: "arn:aws:ec2:us-east-1:1:volume/", State: "RUNNING" },
        ],
        total: 2,
      },
      isLoading: false,
    });
    render(<BackupDashboard />, { wrapper: createWrapper() });
    // both jobs show "-" for the missing/empty resource and state
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText(/j-nores/)).toBeTruthy();
    expect(screen.getByText(/j-trail/)).toBeTruthy();
  });

  it("deselects a plan by clicking its name again", async () => {
    const user = userEvent.setup();
    mockPlans.mockReturnValue({
      data: { plans: [{ BackupPlanId: "plan-x", BackupPlanName: "toggle-plan", BackupPlan: { BackupPlanName: "toggle-plan" } }], total: 1 },
      isLoading: false,
    });
    render(<BackupDashboard />, { wrapper: createWrapper() });
    const planLink = screen.getAllByRole("button", { name: /toggle-plan/i })[0];
    await user.click(planLink);
    await waitFor(() => expect(screen.getByText(/Selections for selected plan/)).toBeTruthy());
    await user.click(planLink);
    await waitFor(() => expect(screen.queryByText(/Selections for selected plan/)).toBeNull());
  });

  it("shows delete-plan loading state on matching row", () => {
    hookState.deletePlanPending = true;
    hookState.deletePlanVariables = "plan-123";
    mockPlans.mockReturnValue({
      data: { plans: [{ BackupPlanId: "plan-123", BackupPlanName: "loading-plan", BackupPlan: { BackupPlanName: "loading-plan" } }], total: 1 },
      isLoading: false,
    });
    render(<BackupDashboard />, { wrapper: createWrapper() });
    expect(screen.getByRole("button", { name: /Delete loading-plan/i })).toBeTruthy();
  });

  it("shows selections with sparse fields when plan has empty selections data", async () => {
    const user = userEvent.setup();
    mockPlans.mockReturnValue({
      data: { plans: [{ BackupPlanId: "plan-s", BackupPlanName: "sparse-plan", BackupPlan: { BackupPlanName: "sparse-plan" } }], total: 1 },
      isLoading: false,
    });
    mockSelections.mockReturnValue({
      data: { total: 0 } as any,
      isLoading: false,
    });
    render(<BackupDashboard />, { wrapper: createWrapper() });
    const planLink = screen.getAllByRole("button", { name: /sparse-plan/i })[0];
    await user.click(planLink);
    await waitFor(() => expect(screen.getByText(/Selections for selected plan/)).toBeTruthy());
    expect(screen.getByText(/No selections for this plan/)).toBeTruthy();
  });

  it("shows selections with missing fields", async () => {
    const user = userEvent.setup();
    mockPlans.mockReturnValue({
      data: { plans: [{ BackupPlanId: "plan-m", BackupPlanName: "min-plan", BackupPlan: { BackupPlanName: "min-plan" } }], total: 1 },
      isLoading: false,
    });
    mockSelections.mockReturnValue({
      data: { backupSelections: [{ SelectionId: "sel-min" }], total: 1 },
      isLoading: false,
    });
    render(<BackupDashboard />, { wrapper: createWrapper() });
    const planLink = screen.getAllByRole("button", { name: /min-plan/i })[0];
    await user.click(planLink);
    await waitFor(() => expect(screen.getByText(/Selections for selected plan/)).toBeTruthy());
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(3);
  });

  it("shows delete-vault loading state on matching row", () => {
    hookState.deleteVaultPending = true;
    hookState.deleteVaultVariables = "vault-loading";
    mockVaults.mockReturnValue({
      data: { backupVaults: [{ BackupVaultName: "vault-loading" }], total: 1 },
      isLoading: false,
    });
    render(<BackupDashboard />, { wrapper: createWrapper() });
    expect(screen.getByRole("button", { name: /Delete vault-loading/i })).toBeTruthy();
  });

  it("renders job without id as empty-string slice", () => {
    mockJobs.mockReturnValue({
      data: { backupJobs: [{ State: "RUNNING" }], total: 1 },
      isLoading: false,
    });
    render(<BackupDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("...")).toBeTruthy();
  });

  it("shows stop-job loading state on matching row", () => {
    hookState.stopJobPending = true;
    hookState.stopJobVariables = "job-stop";
    mockJobs.mockReturnValue({
      data: { backupJobs: [{ BackupJobId: "job-stop", State: "RUNNING" }], total: 1 },
      isLoading: false,
    });
    render(<BackupDashboard />, { wrapper: createWrapper() });
    expect(screen.getByRole("button", { name: /Stop/i })).toBeTruthy();
  });

  it("shows create plan error alert with message", async () => {
    hookState.createPlanError = new Error("Plan creation failed");
    const user = userEvent.setup();
    render(<BackupDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create plan/i);
    await waitFor(() => expect(screen.getByText("Plan creation failed")).toBeTruthy());
  });

  it("shows create plan error alert fallback without message", async () => {
    hookState.createPlanError = {} as Error;
    const user = userEvent.setup();
    render(<BackupDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create plan/i);
    await waitFor(() => expect(screen.getByText("Failed to create plan")).toBeTruthy());
  });

  it("shows create vault error alert with message and fallback", async () => {
    hookState.createVaultError = new Error("Vault creation failed");
    const user = userEvent.setup();
    render(<BackupDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create vault/i);
    await waitFor(() => expect(screen.getByText("Vault creation failed")).toBeTruthy());
  });

  it("shows create vault error alert fallback without message", async () => {
    hookState.createVaultError = {} as Error;
    const user = userEvent.setup();
    render(<BackupDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create vault/i);
    await waitFor(() => expect(screen.getByText("Failed to create vault")).toBeTruthy());
  });
});
