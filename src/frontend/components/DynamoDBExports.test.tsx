// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../test/helpers";
import React from "react";

const mockExports = vi.fn();
const mockExportTable = vi.fn();
const mockDescribeExport = vi.fn();

const exportsState = vi.hoisted(() => ({
  isLoading: false,
  isError: false,
  error: null as Error | null,
}));

const exportTableState = vi.hoisted(() => ({
  isPending: false,
  isError: false,
  error: null as Error | null,
}));

const describeState = vi.hoisted(() => ({
  data: undefined as any,
  isLoading: false,
}));

vi.mock("../hooks/useDynamoDBAdvanced", () => ({
  useDynamoDBExports: () => ({
    get data() { return mockExports(); },
    get isLoading() { return exportsState.isLoading; },
    get isError() { return exportsState.isError; },
    get error() { return exportsState.error; },
  }),
  useDynamoDBExportTable: () => ({
    mutateAsync: mockExportTable,
    get isPending() { return exportTableState.isPending; },
    get isError() { return exportTableState.isError; },
    get error() { return exportTableState.error; },
  }),
  useDynamoDBDescribeExport: () => ({
    get data() { return describeState.data; },
    get isLoading() { return describeState.isLoading; },
  }),
}));

import DynamoDBExports from "./DynamoDBExports";

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

beforeEach(() => {
  vi.clearAllMocks();
  exportsState.isLoading = false;
  exportsState.isError = false;
  exportsState.error = null;
  exportTableState.isPending = false;
  exportTableState.isError = false;
  exportTableState.error = null;
  describeState.data = undefined;
  describeState.isLoading = false;
  mockExports.mockReturnValue({ exports: [], total: 0 });
});

describe("DynamoDBExports", () => {
  it("shows loading spinner", () => {
    exportsState.isLoading = true;
    render(<DynamoDBExports tableName="test-table" />, { wrapper: createWrapper() });
    expect(screen.getByText(/Loading exports/)).toBeTruthy();
  });

  it("shows error state", () => {
    exportsState.isError = true;
    exportsState.error = new Error("Server error");
    render(<DynamoDBExports tableName="test-table" />, { wrapper: createWrapper() });
    expect(screen.getByText("Server error")).toBeTruthy();
  });

  it("shows error with fallback", () => {
    exportsState.isError = true;
    exportsState.error = null as any;
    render(<DynamoDBExports tableName="test-table" />, { wrapper: createWrapper() });
    expect(screen.getByText("Failed to load exports")).toBeTruthy();
  });

  it("shows empty state", () => {
    render(<DynamoDBExports tableName="test-table" />, { wrapper: createWrapper() });
    expect(screen.getByText("No exports")).toBeTruthy();
  });

  it("renders exports with data", () => {
    mockExports.mockReturnValue({
      exports: [{
        exportArn: "arn:aws:dynamodb:us-east-1:123:table/test-table/export/abc",
        exportStatus: "COMPLETED",
        itemCount: 1500,
        startTime: "2024-01-15T12:00:00Z",
        endTime: "2024-01-15T12:05:00Z",
      }],
      total: 1,
    });
    render(<DynamoDBExports tableName="test-table" />, { wrapper: createWrapper() });
    expect(screen.getByText("Completed")).toBeTruthy();
    expect(screen.getByText("1,500")).toBeTruthy();
  });

  it("shows dash for null timestamps and itemCount", () => {
    mockExports.mockReturnValue({
      exports: [{
        exportArn: "arn:aws:dynamodb:us-east-1:123:table/test-table/export/xyz",
        exportStatus: "IN_PROGRESS",
        itemCount: null,
        startTime: null,
        endTime: null,
      }],
      total: 1,
    });
    render(<DynamoDBExports tableName="test-table" />, { wrapper: createWrapper() });
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(3);
  });

  it("opens create export modal", async () => {
    const user = userEvent.setup();
    render(<DynamoDBExports tableName="test-table" />, { wrapper: createWrapper() });
    await clickButton(user, /Export to S3/);
    await waitFor(() => {
      expect(screen.getByText(/Export test-table to Amazon S3/)).toBeTruthy();
    });
  });

  it("export button disabled when S3 bucket empty", async () => {
    const user = userEvent.setup();
    render(<DynamoDBExports tableName="test-table" />, { wrapper: createWrapper() });
    await clickButton(user, /Export to S3/);
    const exportBtn = screen.getByRole("button", { name: /^Export$/ });
    expect((exportBtn as HTMLButtonElement).disabled || exportBtn.getAttribute("aria-disabled") === "true").toBe(true);
  });

  it("submits export with bucket and prefix", async () => {
    const user = userEvent.setup();
    render(<DynamoDBExports tableName="test-table" />, { wrapper: createWrapper() });
    await clickButton(user, /Export to S3/);
    await user.type(screen.getByPlaceholderText("my-export-bucket"), "my-bucket");
    await user.type(screen.getByPlaceholderText("exports/my-table/"), "data/exports/");
    await clickButton(user, /^Export$/);
    expect(mockExportTable).toHaveBeenCalledWith(
      { s3Bucket: "my-bucket", s3Prefix: "data/exports/", exportFormat: "DYNAMODB_JSON" },
      expect.any(Object)
    );
  });

  it("submits export with only bucket (no prefix)", async () => {
    const user = userEvent.setup();
    render(<DynamoDBExports tableName="test-table" />, { wrapper: createWrapper() });
    await clickButton(user, /Export to S3/);
    await user.type(screen.getByPlaceholderText("my-export-bucket"), "my-bucket");
    await clickButton(user, /^Export$/);
    expect(mockExportTable).toHaveBeenCalledWith(
      { s3Bucket: "my-bucket", s3Prefix: undefined, exportFormat: "DYNAMODB_JSON" },
      expect.any(Object)
    );
  });

  it("shows export detail modal", async () => {
    mockExports.mockReturnValue({
      exports: [{
        exportArn: "arn:aws:dynamodb:us-east-1:123:table/test-table/export/abc",
        exportStatus: "COMPLETED",
        itemCount: 100,
        startTime: "2024-01-15T12:00:00Z",
        endTime: "2024-01-15T12:05:00Z",
      }],
      total: 1,
    });
    describeState.data = {
      exportArn: "arn:...",
      exportStatus: "COMPLETED",
      exportType: "FULL_EXPORT",
      itemCount: 100,
      s3Bucket: "my-bucket",
      s3Prefix: "exports/",
      startTime: "2024-01-15T12:00:00Z",
      endTime: "2024-01-15T12:05:00Z",
      tableArn: "arn:aws:dynamodb:us-east-1:123:table/test-table",
    };
    const user = userEvent.setup();
    render(<DynamoDBExports tableName="test-table" />, { wrapper: createWrapper() });
    await clickButton(user, /^Details$/);
    await waitFor(() => {
      expect(screen.getByText("FULL_EXPORT")).toBeTruthy();
    });
  });

  it("shows export detail with failure code", async () => {
    mockExports.mockReturnValue({
      exports: [{
        exportArn: "arn:fail",
        exportStatus: "FAILED",
        itemCount: 0,
      }],
      total: 1,
    });
    describeState.data = {
      exportStatus: "FAILED",
      failureCode: "InternalError",
      failureMessage: "Something went wrong",
    };
    const user = userEvent.setup();
    render(<DynamoDBExports tableName="test-table" />, { wrapper: createWrapper() });
    await clickButton(user, /^Details$/);
    await waitFor(() => {
      expect(screen.getByText(/InternalError/)).toBeTruthy();
      expect(screen.getByText("Something went wrong")).toBeTruthy();
    });
  });

  it("shows export detail with dash for null fields", async () => {
    mockExports.mockReturnValue({
      exports: [{
        exportArn: "arn:minimal",
        exportStatus: "IN_PROGRESS",
        itemCount: null,
      }],
      total: 1,
    });
    describeState.data = {
      exportStatus: "IN_PROGRESS",
      exportType: null,
      itemCount: null,
      s3Bucket: null,
      s3Prefix: null,
      startTime: null,
      endTime: null,
      tableArn: null,
    };
    const user = userEvent.setup();
    render(<DynamoDBExports tableName="test-table" />, { wrapper: createWrapper() });
    await clickButton(user, /^Details$/);
    await waitFor(() => {
      const dashes = screen.getAllByText("—");
      expect(dashes.length).toBeGreaterThanOrEqual(5);
    });
  });

  it("shows export not found in detail modal", async () => {
    mockExports.mockReturnValue({
      exports: [{
        exportArn: "arn:missing",
        exportStatus: "IN_PROGRESS",
      }],
      total: 1,
    });
    describeState.data = undefined;
    describeState.isLoading = false;
    const user = userEvent.setup();
    render(<DynamoDBExports tableName="test-table" />, { wrapper: createWrapper() });
    await clickButton(user, /^Details$/);
    await waitFor(() => {
      expect(screen.getByText("Export not found")).toBeTruthy();
    });
  });

  it("shows detail loading spinner", async () => {
    mockExports.mockReturnValue({
      exports: [{
        exportArn: "arn:loading",
        exportStatus: "IN_PROGRESS",
      }],
      total: 1,
    });
    describeState.isLoading = true;
    const user = userEvent.setup();
    render(<DynamoDBExports tableName="test-table" />, { wrapper: createWrapper() });
    await clickButton(user, /^Details$/);
    await waitFor(() => {
      expect(screen.getByText("Export Details")).toBeTruthy();
    });
  });

  it("cancels create export modal without submitting", async () => {
    const user = userEvent.setup();
    render(<DynamoDBExports tableName="test-table" />, { wrapper: createWrapper() });
    await clickButton(user, /Export to S3/i);
    await waitFor(() => expect(screen.getByText("Export test-table to Amazon S3")).toBeTruthy());
    await clickButton(user, /Cancel/i);
    expect(mockExportTable).not.toHaveBeenCalled();
  });

  it("dismisses create export modal with Escape", async () => {
    const user = userEvent.setup();
    render(<DynamoDBExports tableName="test-table" />, { wrapper: createWrapper() });
    await clickButton(user, /Export to S3/i);
    await waitFor(() => expect(screen.getByText("Export test-table to Amazon S3")).toBeTruthy());
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Export test-table to Amazon S3"));
  });

  it("submits export and closes the modal on success", async () => {
    mockExportTable.mockImplementation((_payload: unknown, opts?: { onSuccess?: () => void }) => {
      opts?.onSuccess?.();
      return Promise.resolve({});
    });
    const user = userEvent.setup();
    render(<DynamoDBExports tableName="test-table" />, { wrapper: createWrapper() });
    await clickButton(user, /Export to S3/i);
    await user.type(screen.getByPlaceholderText("my-export-bucket"), "my-bucket");
    await clickButton(user, /^Export$/i);
    await waitFor(() => expectModalHidden("Export test-table to Amazon S3"));
  });

  it("changes the export format via the Select", async () => {
    const user = userEvent.setup();
    render(<DynamoDBExports tableName="test-table" />, { wrapper: createWrapper() });
    await clickButton(user, /Export to S3/i);
    await user.click(screen.getByRole("button", { name: /DynamoDB JSON/i }));
    await user.click(screen.getByRole("option", { name: /Ion/i }));
    expect(screen.getByRole("button", { name: /Ion/i })).toBeTruthy();
  });

  it("closes export detail modal with the Close button", async () => {
    mockExports.mockReturnValue({
      exports: [{ exportArn: "arn:aws:dynamodb:us-east-1:123:table/test-table/export/abc", exportStatus: "COMPLETED" }],
      total: 1,
    });
    const user = userEvent.setup();
    render(<DynamoDBExports tableName="test-table" />, { wrapper: createWrapper() });
    await clickButton(user, /^Details$/);
    await waitFor(() => expect(screen.getByText("Export Details")).toBeTruthy());
    await user.click(within(dialogOf("Export Details")).getByRole("button", { name: /Close/i }));
    await waitFor(() => expectModalHidden("Export Details"));
  });

  it("dismisses export detail modal with Escape", async () => {
    mockExports.mockReturnValue({
      exports: [{ exportArn: "arn:aws:dynamodb:us-east-1:123:table/test-table/export/abc", exportStatus: "COMPLETED" }],
      total: 1,
    });
    const user = userEvent.setup();
    render(<DynamoDBExports tableName="test-table" />, { wrapper: createWrapper() });
    await clickButton(user, /^Details$/);
    await waitFor(() => expect(screen.getByText("Export Details")).toBeTruthy());
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Export Details"));
  });
});

describe("DynamoDBExports — sparse-data branches", () => {
  it("shows the raw status for an unknown export status", async () => {
    mockExports.mockReturnValue({
      exports: [{ exportArn: "arn:unknown", exportStatus: "PENDING", itemCount: 5 }],
      total: 1,
    });
    render(<DynamoDBExports tableName="test-table" />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("PENDING")).toBeTruthy());
  });

  it("shows the empty state when exports data is undefined", async () => {
    mockExports.mockReturnValue(undefined);
    render(<DynamoDBExports tableName="test-table" />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("No exports")).toBeTruthy());
  });

  it("shows a dash for an export without an ARN", async () => {
    mockExports.mockReturnValue({
      exports: [{ exportStatus: "COMPLETED" }],
      total: 1,
    });
    render(<DynamoDBExports tableName="test-table" />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("Completed")).toBeTruthy());
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(2);
  });

  it("shows the default message when the export error has no message", async () => {
    exportTableState.isError = true;
    exportTableState.error = new Error();
    const user = userEvent.setup();
    render(<DynamoDBExports tableName="test-table" />, { wrapper: createWrapper() });
    await clickButton(user, /Export to S3/i);
    await waitFor(() => expect(screen.getByText("Failed to create export")).toBeTruthy());
  });

  it("shows the manifest in the export detail modal", async () => {
    mockExports.mockReturnValue({
      exports: [{ exportArn: "arn:manifest", exportStatus: "COMPLETED" }],
      total: 1,
    });
    describeState.data = {
      exportStatus: "COMPLETED",
      exportManifest: "s3://bucket/manifest.json",
    };
    const user = userEvent.setup();
    render(<DynamoDBExports tableName="test-table" />, { wrapper: createWrapper() });
    await clickButton(user, /^Details$/);
    await waitFor(() => expect(screen.getByText("s3://bucket/manifest.json")).toBeTruthy());
  });

  it("shows the default failure message when none is provided", async () => {
    mockExports.mockReturnValue({
      exports: [{ exportArn: "arn:fail2", exportStatus: "FAILED" }],
      total: 1,
    });
    describeState.data = {
      exportStatus: "FAILED",
      failureCode: "InternalError",
    };
    const user = userEvent.setup();
    render(<DynamoDBExports tableName="test-table" />, { wrapper: createWrapper() });
    await clickButton(user, /^Details$/);
    await waitFor(() => expect(screen.getByText("No failure message available")).toBeTruthy());
  });
});
