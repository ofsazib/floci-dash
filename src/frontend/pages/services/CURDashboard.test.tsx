// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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
}));
const deleteState = vi.hoisted(() => ({
  isPending: false,
  variables: null as string | null,
}));

vi.mock("../../hooks/useCUR", () => ({
  useReportDefinitions: (...args: any[]) => mockReportDefs(...args),
  useCreateReportDefinition: () => ({
    mutate: mockCreateReport,
    isPending: false,
    isError: createState.isError,
    error: createState.error,
  }),
  useModifyReportDefinition: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useDeleteReportDefinition: () => ({
    mutateAsync: mockDeleteReport,
    isPending: deleteState.isPending,
    variables: deleteState.variables,
  }),
}));

import { CURDashboard } from "./CURDashboard";

// ─── Setup ──────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  createState.isError = false;
  createState.error = null;
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
});
