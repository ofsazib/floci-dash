// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

// ─── Mock hooks ─────────────────────────────────────────

const mockExports = vi.fn();
const mockTables = vi.fn();
const mockCreateExport = vi.fn();
const mockDeleteExport = vi.fn();
const mockExportExecutions = vi.fn();

const createExportState = vi.hoisted(() => ({
  isError: false,
  error: null as Error | null,
}));

vi.mock("../../hooks/useBCMDataExports", () => ({
  useBCMExports: (...args: any[]) => mockExports(...args),
  useBCMTables: (...args: any[]) => mockTables(...args),
  useCreateBCMExport: () => ({
    mutate: mockCreateExport,
    isPending: false,
    isError: createExportState.isError,
    error: createExportState.error,
    reset: vi.fn(),
  }),
  useDeleteBCMExport: () => ({
    mutateAsync: mockDeleteExport,
    isPending: false,
    variables: null,
  }),
  useBCMExportExecutions: (...args: any[]) => mockExportExecutions(...args),
}));

import { BCMDashboard } from "./BCMDashboard";

const toastMock = vi.fn();
vi.mock("../../components/Toast", () => ({
  useToast: () => ({ showToast: toastMock }),
}));

// ─── Setup ──────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  createExportState.isError = false;
  createExportState.error = null;
  mockExports.mockReturnValue({
    data: { exports: [], total: 0 },
    isLoading: false,
    isError: false,
    error: null,
  });
  mockTables.mockReturnValue({
    data: { tables: [], total: 0 },
    isLoading: false,
    isError: false,
    error: null,
  });
  mockExportExecutions.mockReturnValue({
    data: { executions: [], total: 0 },
    isLoading: false,
    isError: false,
    error: null,
  });
});

// ─── Tests ──────────────────────────────────────────────

describe("BCMDashboard — exports list", () => {
  it("shows empty state", () => {
    render(<BCMDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No exports found/i)).toBeTruthy();
  });

  it("renders exports list with data", () => {
    mockExports.mockReturnValue({
      data: {
        exports: [
          { ExportArn: "arn:aws:bcm-data-exports:us-east-1:123:export/my-export", Name: "MyExport" },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<BCMDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("MyExport")).toBeTruthy();
  });

  it("shows loading state", () => {
    mockExports.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });
    const { container } = render(<BCMDashboard />, { wrapper: createWrapper() });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("shows error state", () => {
    mockExports.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("Access denied"),
    });
    render(<BCMDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Access denied")).toBeTruthy();
  });

  it("opens create export modal and submits", async () => {
    const user = userEvent.setup();
    render(<BCMDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /create/i);
    await waitFor(() => expect(screen.getByText("Create BCM Data Export")).toBeTruthy());

    const nameInput = screen.getByPlaceholderText("my-bcm-export");
    await user.type(nameInput, "test-export");

    await clickButton(user, /^Create$/i, { last: true });
    await waitFor(() => {
      expect(mockCreateExport).toHaveBeenCalledWith(
        { Name: "test-export", Export: {} },
        expect.any(Object),
      );
    });
  });

  it("cancels create export modal does not call mutation", async () => {
    const user = userEvent.setup();
    render(<BCMDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /create/i);
    await waitFor(() => expect(screen.getByText("Create BCM Data Export")).toBeTruthy());
    await clickButton(user, /Cancel/i);
    expect(mockCreateExport).not.toHaveBeenCalled();
  });

  it("does not create export with empty name", async () => {
    const user = userEvent.setup();
    render(<BCMDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /create/i);
    await waitFor(() => expect(screen.getByText("Create BCM Data Export")).toBeTruthy());

    // Click Create with empty name — handleCreate early returns
    const createBtn = screen.getAllByRole("button", { name: /^Create$/i });
    await user.click(createBtn[createBtn.length - 1]);

    expect(mockCreateExport).not.toHaveBeenCalled();
  });

  it("shows error alert when createExport fails", async () => {
    createExportState.isError = true;
    createExportState.error = new Error("Export name already exists");

    const user = userEvent.setup();
    render(<BCMDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /create/i);
    await waitFor(() => expect(screen.getByText("Create BCM Data Export")).toBeTruthy());

    expect(screen.getByText("Export name already exists")).toBeTruthy();

    createExportState.isError = false;
    createExportState.error = null;
  });

  it("deletes an export", async () => {
    mockExports.mockReturnValue({
      data: {
        exports: [
          { ExportArn: "arn:aws:bcm-data-exports:us-east-1:123:export/del-export", Name: "DelExport" },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<BCMDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("DelExport")).toBeTruthy());
    const deleteBtn = screen.getByRole("button", {
      name: /Delete arn:aws:bcm-data-exports:us-east-1:123:export\/del-export/i,
    });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => {
      expect(mockDeleteExport).toHaveBeenCalledWith("arn:aws:bcm-data-exports:us-east-1:123:export/del-export");
    });
  });
});

describe("BCMDashboard — export executions", () => {
  it("shows export executions when item is clicked", async () => {
    mockExports.mockReturnValue({
      data: {
        exports: [
          { ExportArn: "arn:aws:bcm-data-exports:us-east-1:123:export/my-export", Name: "MyExport" },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<BCMDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("MyExport")).toBeTruthy());
    await user.click(screen.getByText("MyExport"));
    await waitFor(() => {
      expect(
        screen.getByText(/Executions for arn:aws:bcm-data-exports:us-east-1:123:export\/my-export/i),
      ).toBeTruthy();
    });
  });

  it("hides export executions when clicked again", async () => {
    mockExports.mockReturnValue({
      data: {
        exports: [
          { ExportArn: "arn:aws:bcm-data-exports:us-east-1:123:export/my-export", Name: "MyExport" },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<BCMDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("MyExport")).toBeTruthy());
    await user.click(screen.getByText("MyExport"));
    await waitFor(() => {
      expect(
        screen.getByText(/Executions for arn:aws:bcm-data-exports:us-east-1:123:export\/my-export/i),
      ).toBeTruthy();
    });
    await user.click(screen.getByText("MyExport"));
    await waitFor(() => {
      expect(
        screen.queryByText(/Executions for arn:aws:bcm-data-exports:us-east-1:123:export\/my-export/i),
      ).toBeNull();
    });
  });

  it("shows export executions with data", async () => {
    mockExports.mockReturnValue({
      data: {
        exports: [
          { ExportArn: "arn:aws:bcm-data-exports:us-east-1:123:export/data-export", Name: "DataExport" },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockExportExecutions.mockReturnValue({
      data: {
        executions: [
          {
            ExecutionId: "exec-001",
            Status: "COMPLETED",
            CreatedAt: "2024-06-01T00:00:00Z",
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<BCMDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("DataExport")).toBeTruthy());
    await user.click(screen.getByText("DataExport"));
    await waitFor(() => {
      expect(screen.getByText("exec-001")).toBeTruthy();
      expect(screen.getByText("COMPLETED")).toBeTruthy();
    });
  });

  it("shows export name fallback to exportArn when name is empty", async () => {
    mockExports.mockReturnValue({
      data: {
        exports: [
          { ExportArn: "arn:aws:bcm-data-exports:us-east-1:123:export/no-name-export", Name: null },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<BCMDashboard />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(
        screen.getByText("arn:aws:bcm-data-exports:us-east-1:123:export/no-name-export"),
      ).toBeTruthy();
    });
  });
});

describe("BCMDashboard — tables", () => {
  it("renders BCM Tables container", () => {
    render(<BCMDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("BCM Tables")).toBeTruthy();
  });

  it("renders tables with data", () => {
    mockTables.mockReturnValue({
      data: {
        tables: [
          { TableName: "cost_and_usage_report", Description: "Cost and usage data" },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<BCMDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("cost_and_usage_report")).toBeTruthy();
    expect(screen.getByText("Cost and usage data")).toBeTruthy();
  });

  it("shows em-dash for null table descriptions", () => {
    mockTables.mockReturnValue({
      data: {
        tables: [
          { TableName: "some_table", Description: null },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<BCMDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("some_table")).toBeTruthy();
    const dashes = screen.getAllByText("\u2014");
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it("shows empty message when no tables", () => {
    render(<BCMDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No tables available/i)).toBeTruthy();
  });
});
