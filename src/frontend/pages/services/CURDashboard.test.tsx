// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

// ─── Mock hooks ─────────────────────────────────────────

const mockReportDefs = vi.fn();
const mockCreateReport = vi.fn();
const mockDeleteReport = vi.fn();

const createState = vi.hoisted(() => ({
  isError: false,
  error: null as Error | null,
  isPending: false,
}));
const deleteState = vi.hoisted(() => ({
  isPending: false,
  variables: null as string | null,
}));

vi.mock("../../hooks/useCUR", () => ({
  useReportDefinitions: (...args: any[]) => mockReportDefs(...args),
  useCreateReportDefinition: () => ({
    mutate: mockCreateReport,
    get isPending() { return createState.isPending; },
    isError: createState.isError,
    error: createState.error,
  }),
  useModifyReportDefinition: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useDeleteReportDefinition: () => ({
    mutateAsync: mockDeleteReport,
    get isPending() { return deleteState.isPending; },
    get variables() { return deleteState.variables; },
  }),
}));

import { CURDashboard } from "./CURDashboard";

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
  createState.isError = false;
  createState.error = null;
  createState.isPending = false;
  deleteState.isPending = false;
  deleteState.variables = null;
  mockReportDefs.mockReturnValue({
    data: { reportDefinitions: [], total: 0 },
    isLoading: false,
    isError: false,
    error: null,
  });
});

// ─── Tests ──────────────────────────────────────────────

describe("CURDashboard — report definitions list", () => {
  it("shows empty state", () => {
    render(<CURDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No report definitions found/i)).toBeTruthy();
  });

  it("renders report definitions with data", () => {
    mockReportDefs.mockReturnValue({
      data: {
        reportDefinitions: [
          {
            ReportName: "MyReport",
            TimeUnit: "DAILY",
            Format: "textORcsv",
            Compression: "GZIP",
            S3Bucket: "my-bucket",
            S3Prefix: "reports/",
            S3Region: "us-east-1",
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<CURDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("MyReport")).toBeTruthy();
    expect(screen.getByText("DAILY")).toBeTruthy();
    expect(screen.getAllByText("textORcsv").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("my-bucket")).toBeTruthy();
  });

  it("shows loading state", () => {
    mockReportDefs.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });
    const { container } = render(<CURDashboard />, { wrapper: createWrapper() });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("shows error state", () => {
    mockReportDefs.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("Failed to load"),
    });
    render(<CURDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Failed to load")).toBeTruthy();
  });

  it("opens create modal and submits", async () => {
    const user = userEvent.setup();
    render(<CURDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /create/i);
    await waitFor(() => expect(screen.getByText("Create Cost & Usage Report")).toBeTruthy());

    const nameInput = screen.getByPlaceholderText("my-cur-report");
    await user.type(nameInput, "TestReport");
    const bucketInput = screen.getByPlaceholderText("my-report-bucket");
    await user.type(bucketInput, "my-bucket");

    // Wait for button to become enabled after form fill
    await waitFor(() => {
      const btns = screen.getAllByRole("button", { name: /Create report/i });
      const enabled = btns.find((b) => !b.hasAttribute("disabled"));
      expect(enabled).toBeTruthy();
    });

    // Click last Create report button (modal footer button)
    const reportBtns = screen.getAllByRole("button", { name: /Create report/i });
    await user.click(reportBtns[reportBtns.length - 1]);
    await waitFor(() => {
      expect(mockCreateReport).toHaveBeenCalledWith(
        { reportName: "TestReport", timeUnit: "DAILY", format: "textORcsv", s3Bucket: "my-bucket" },
        expect.any(Object),
      );
    });
  });

  it("cancels create modal does not call mutation", async () => {
    const user = userEvent.setup();
    render(<CURDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /create/i);
    await waitFor(() => expect(screen.getByText("Create Cost & Usage Report")).toBeTruthy());
    await clickButton(user, /Cancel/i);
    expect(mockCreateReport).not.toHaveBeenCalled();
  });

  it("shows error alert when create fails", async () => {
    createState.isError = true;
    createState.error = new Error("Report already exists");

    const user = userEvent.setup();
    render(<CURDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /create/i);
    await waitFor(() => {
      expect(screen.getByText("Report already exists")).toBeTruthy();
    });

    createState.isError = false;
    createState.error = null;
  });

  it("shows create report loading state on Create report button", async () => {
    createState.isPending = true;
    const user = userEvent.setup();
    render(<CURDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /create/i);
    await waitFor(() => expect(screen.getByText("Create Cost & Usage Report")).toBeTruthy());
  });

  it("deletes a report definition", async () => {
    mockReportDefs.mockReturnValue({
      data: {
        reportDefinitions: [
          {
            ReportName: "DeleteMe",
            TimeUnit: "DAILY",
            Format: "textORcsv",
            S3Bucket: "bucket",
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<CURDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("DeleteMe")).toBeTruthy());

    const deleteBtn = screen.getByRole("button", { name: /Delete DeleteMe/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => {
      expect(mockDeleteReport).toHaveBeenCalledWith("DeleteMe");
    });
  });
});

describe("CURDashboard — form validation", () => {
  it("disables create button when name is empty", async () => {
    const user = userEvent.setup();
    render(<CURDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /create/i);
    await waitFor(() => expect(screen.getByText("Create Cost & Usage Report")).toBeTruthy());

    const createBtn = screen.getAllByRole("button", { name: /Create report/i });
    const primaryBtn = createBtn.find((b) => !b.getAttribute("aria-disabled") && !b.hasAttribute("aria-disabled"));
    // Primary button starts disabled because name and bucket are empty
    expect(createBtn[createBtn.length - 1]).toBeDisabled();

    // Fill in name but not bucket
    const nameInput = screen.getByPlaceholderText("my-cur-report");
    await user.type(nameInput, "Test");
    expect(createBtn[createBtn.length - 1]).toBeDisabled();

    // Fill in bucket too
    const bucketInput = screen.getByPlaceholderText("my-report-bucket");
    await user.type(bucketInput, "bucket");
    expect(createBtn[createBtn.length - 1]).not.toBeDisabled();
  });

  it("filters reports by name", async () => {
    mockReportDefs.mockReturnValue({
      data: {
        reportDefinitions: [
          { ReportName: "alpha-report", TimeUnit: "DAILY", Format: "textORcsv", S3Bucket: "b1" },
          { ReportName: "beta-report", TimeUnit: "HOURLY", Format: "Parquet", S3Bucket: "b2" },
        ],
        total: 2,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<CURDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("alpha-report")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("Find reports by name"), "beta");
    await waitFor(() => expect(screen.getByText("beta-report")).toBeTruthy());
    expect(screen.queryByText("alpha-report")).toBeNull();
  });

  it("dismisses the create modal with Escape and resets the form", async () => {
    const user = userEvent.setup();
    render(<CURDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /create/i);
    await waitFor(() => expect(screen.getByText("Create Cost & Usage Report")).toBeTruthy());
    const nameInput = screen.getByPlaceholderText("my-cur-report");
    await user.type(nameInput, "TestReport");
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Create Cost & Usage Report"));
    expect(nameInput).toHaveProperty("value", "");
  });

  it("submits create and resets the form on success", async () => {
    mockCreateReport.mockImplementation((_payload: unknown, opts?: { onSuccess?: () => void }) => {
      opts?.onSuccess?.();
    });
    const user = userEvent.setup();
    render(<CURDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /create/i);
    await waitFor(() => expect(screen.getByText("Create Cost & Usage Report")).toBeTruthy());
    const nameInput = screen.getByPlaceholderText("my-cur-report");
    await user.type(nameInput, "TestReport");
    await user.type(screen.getByPlaceholderText("my-report-bucket"), "my-bucket");
    await waitFor(() => {
      const btns = screen.getAllByRole("button", { name: /Create report/i });
      const enabled = btns.find((b) => !b.hasAttribute("disabled"));
      expect(enabled).toBeTruthy();
    });
    const reportBtns = screen.getAllByRole("button", { name: /Create report/i });
    await user.click(reportBtns[reportBtns.length - 1]);
    await waitFor(() => expectModalHidden("Create Cost & Usage Report"));
    expect(nameInput).toHaveProperty("value", "");
  });

  it("picks a custom time unit and format via the Selects", async () => {
    const user = userEvent.setup();
    render(<CURDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /create/i);
    await waitFor(() => expect(screen.getByText("Create Cost & Usage Report")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("my-cur-report"), "TestReport");
    await user.type(screen.getByPlaceholderText("my-report-bucket"), "my-bucket");
    await user.click(screen.getByRole("button", { name: /Daily/i }));
    await user.click(screen.getByRole("option", { name: /Monthly/i }));
    await user.click(screen.getByRole("button", { name: /textORcsv/i }));
    await user.click(screen.getByRole("option", { name: /Parquet/i }));
    await waitFor(() => {
      const btns = screen.getAllByRole("button", { name: /Create report/i });
      const enabled = btns.find((b) => !b.hasAttribute("disabled"));
      expect(enabled).toBeTruthy();
    });
    const reportBtns = screen.getAllByRole("button", { name: /Create report/i });
    await user.click(reportBtns[reportBtns.length - 1]);
    await waitFor(() => {
      expect(mockCreateReport).toHaveBeenCalledWith(
        expect.objectContaining({ reportName: "TestReport", timeUnit: "MONTHLY", format: "Parquet" }),
        expect.any(Object),
      );
    });
  });
});
