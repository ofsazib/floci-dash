// @vitest-environment happy-dom
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createWrapper } from "../../../test/helpers";
import React from "react";

// ─── Mock hooks ─────────────────────────────────────────

const mockExecute = vi.fn();
const mockBeginTx = vi.fn();
const mockCommitTx = vi.fn();
const mockRollbackTx = vi.fn();
const mockExecuteHook = vi.fn();
const mockBeginTxHook = vi.fn();
const mockCommitTxHook = vi.fn();
const mockRollbackTxHook = vi.fn();

vi.mock("../../hooks/useRDSData", () => ({
  useExecuteRDSDataStatement: (...args: any[]) => mockExecuteHook(...args),
  useBeginRDSDataTransaction: (...args: any[]) => mockBeginTxHook(...args),
  useCommitRDSDataTransaction: (...args: any[]) => mockCommitTxHook(...args),
  useRollbackRDSDataTransaction: (...args: any[]) => mockRollbackTxHook(...args),
}));

import { RDSDataDashboard } from "./RDSDataDashboard";

// ─── Setup ──────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockExecuteHook.mockReturnValue({
    mutate: mockExecute,
    isPending: false,
    isError: false,
    error: null as any,
    data: undefined,
    reset: vi.fn(),
  });
  mockBeginTxHook.mockReturnValue({
    mutate: mockBeginTx,
    isPending: false,
    isError: false,
    error: null as any,
    data: undefined,
    reset: vi.fn(),
  });
  mockCommitTxHook.mockReturnValue({
    mutate: mockCommitTx,
    isPending: false,
    isError: false,
    error: null as any,
    data: undefined,
    reset: vi.fn(),
  });
  mockRollbackTxHook.mockReturnValue({
    mutate: mockRollbackTx,
    isPending: false,
    isError: false,
    error: null as any,
    data: undefined,
    reset: vi.fn(),
  });
});

// ─── Tests ──────────────────────────────────────────────

describe("RDSDataDashboard — rendering", () => {
  it("renders SQL Editor header", () => {
    render(<RDSDataDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("SQL Editor")).toBeTruthy();
  });

  it("renders all form fields and buttons", () => {
    render(<RDSDataDashboard />, { wrapper: createWrapper() });
    expect(screen.getByLabelText(/Resource ARN/)).toBeTruthy();
    expect(screen.getByLabelText(/Secret ARN/)).toBeTruthy();
    expect(screen.getByLabelText(/Database/)).toBeTruthy();
    expect(screen.getByLabelText(/SQL Statement/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /Execute/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Begin Transaction/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^Commit$/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^Rollback$/ })).toBeTruthy();
  });

  it("disables Execute button when inputs are empty", () => {
    render(<RDSDataDashboard />, { wrapper: createWrapper() });
    expect(screen.getByRole("button", { name: /Execute/i })).toBeDisabled();
  });

  it("disables Begin Transaction when Resource ARN and Secret ARN are empty", () => {
    render(<RDSDataDashboard />, { wrapper: createWrapper() });
    expect(screen.getByRole("button", { name: /Begin Transaction/i })).toBeDisabled();
  });

  it("disables Commit and Rollback when no transaction ID", () => {
    render(<RDSDataDashboard />, { wrapper: createWrapper() });
    expect(screen.getByRole("button", { name: /^Commit$/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /^Rollback$/ })).toBeDisabled();
  });

  it("does not show Transaction ID field initially", () => {
    render(<RDSDataDashboard />, { wrapper: createWrapper() });
    expect(screen.queryByLabelText(/Transaction ID/)).toBeNull();
  });

  it("does not show Result container initially", () => {
    render(<RDSDataDashboard />, { wrapper: createWrapper() });
    expect(screen.queryByText("Result")).toBeNull();
  });
});

describe("RDSDataDashboard — error alerts", () => {
  it("shows error alert when execute fails", () => {
    mockExecuteHook.mockReturnValue({
      mutate: mockExecute,
      isPending: false,
      isError: true,
      error: new Error("Execution failed") as any,
      data: undefined,
      reset: vi.fn(),
    });
    render(<RDSDataDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Execution failed")).toBeTruthy();
  });

  it("shows error alert when begin transaction fails", () => {
    mockBeginTxHook.mockReturnValue({
      mutate: mockBeginTx,
      isPending: false,
      isError: true,
      error: new Error("Begin TX failed") as any,
      data: undefined,
      reset: vi.fn(),
    });
    render(<RDSDataDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Begin TX failed")).toBeTruthy();
  });

});

describe("RDSDataDashboard — interactions", () => {
  it("calls execute mutation with filled fields", async () => {
    const user = userEvent.setup();
    // Make mockExecute invoke onSuccess to show Result container
    mockExecute.mockImplementation((_args: any, opts?: any) => {
      if (opts?.onSuccess) opts.onSuccess({ formattedRecords: [], numberOfRecordsUpdated: 0 });
    });

    render(<RDSDataDashboard />, { wrapper: createWrapper() });

    await user.type(screen.getByLabelText(/Resource ARN/), "arn:aws:rds:cluster:my-cluster");
    await user.type(screen.getByLabelText(/Secret ARN/), "arn:aws:secretsmanager:secret:my-secret");
    await user.type(screen.getByLabelText(/SQL Statement/), "SELECT * FROM my_table");
    await user.type(screen.getByLabelText(/Database/), "mydb");

    await user.click(screen.getByRole("button", { name: /Execute/i }));

    await waitFor(() => {
      expect(mockExecute).toHaveBeenCalledWith(
        {
          sql: "SELECT * FROM my_table",
          resourceArn: "arn:aws:rds:cluster:my-cluster",
          secretArn: "arn:aws:secretsmanager:secret:my-secret",
          database: "mydb",
          transactionId: undefined,
          includeResultMetadata: true,
        },
        expect.any(Object),
      );
    });

    // Result container should appear after onSuccess
    await waitFor(() => expect(screen.getByText("Result")).toBeTruthy());
  });

  it("calls begin transaction mutation", async () => {
    const user = userEvent.setup();
    // Make mockBeginTx invoke onSuccess to set transactionId
    mockBeginTx.mockImplementation((_args: any, opts?: any) => {
      if (opts?.onSuccess) opts.onSuccess({ transactionId: "tx-123" });
    });

    render(<RDSDataDashboard />, { wrapper: createWrapper() });

    await user.type(screen.getByLabelText(/Resource ARN/), "arn:aws:rds:cluster:my-cluster");
    await user.type(screen.getByLabelText(/Secret ARN/), "arn:aws:secretsmanager:secret:my-secret");
    await user.type(screen.getByPlaceholderText("mydb"), "mydb");

    await user.click(screen.getByRole("button", { name: /Begin Transaction/i }));

    await waitFor(() => {
      expect(mockBeginTx).toHaveBeenCalled();
      const args = mockBeginTx.mock.calls[0][0];
      expect(args.resourceArn).toBe("arn:aws:rds:cluster:my-cluster");
      expect(args.secretArn).toBe("arn:aws:secretsmanager:secret:my-secret");
      expect(args.database).toBe("mydb");
    });

    // Transaction ID field should appear after onSuccess
    await waitFor(() => expect(screen.getByLabelText(/Transaction ID/)).toBeTruthy());
  });

  it("calls commit mutation", async () => {
    const user = userEvent.setup();
    // Simulate active transaction
    mockBeginTx.mockImplementation((_args: any, opts?: any) => {
      if (opts?.onSuccess) opts.onSuccess({ transactionId: "tx-456" });
    });
    mockCommitTx.mockImplementation((_args: any, opts?: any) => {
      if (opts?.onSuccess) opts.onSuccess();
    });

    render(<RDSDataDashboard />, { wrapper: createWrapper() });

    await user.type(screen.getByLabelText(/Resource ARN/), "arn:aws:rds:cluster:c");
    await user.type(screen.getByLabelText(/Secret ARN/), "arn:aws:secretsmanager:secret:s");

    // Begin transaction
    await user.click(screen.getByRole("button", { name: /Begin Transaction/i }));
    await waitFor(() => expect(screen.getByLabelText(/Transaction ID/)).toBeTruthy());

    // Now Commit is enabled and can be clicked
    await user.click(screen.getByRole("button", { name: /^Commit$/ }));

    await waitFor(() => {
      expect(mockCommitTx).toHaveBeenCalledWith(
        {
          transactionId: "tx-456",
          resourceArn: "arn:aws:rds:cluster:c",
          secretArn: "arn:aws:secretsmanager:secret:s",
        },
        expect.any(Object),
      );
    });
  });

  it("calls rollback mutation", async () => {
    const user = userEvent.setup();
    // Simulate active transaction
    mockBeginTx.mockImplementation((_args: any, opts?: any) => {
      if (opts?.onSuccess) opts.onSuccess({ transactionId: "tx-789" });
    });
    mockRollbackTx.mockImplementation((_args: any, opts?: any) => {
      if (opts?.onSuccess) opts.onSuccess();
    });

    render(<RDSDataDashboard />, { wrapper: createWrapper() });

    await user.type(screen.getByLabelText(/Resource ARN/), "arn:aws:rds:cluster:c");
    await user.type(screen.getByLabelText(/Secret ARN/), "arn:aws:secretsmanager:secret:s");

    // Begin transaction
    await user.click(screen.getByRole("button", { name: /Begin Transaction/i }));
    await waitFor(() => expect(screen.getByLabelText(/Transaction ID/)).toBeTruthy());

    // Now Rollback is enabled
    await user.click(screen.getByRole("button", { name: /^Rollback$/ }));

    await waitFor(() => {
      expect(mockRollbackTx).toHaveBeenCalledWith(
        {
          transactionId: "tx-789",
          resourceArn: "arn:aws:rds:cluster:c",
          secretArn: "arn:aws:secretsmanager:secret:s",
        },
        expect.any(Object),
      );
    });
  });

  it("sends empty database as undefined", async () => {
    const user = userEvent.setup();
    render(<RDSDataDashboard />, { wrapper: createWrapper() });

    // Only fill required fields, leave database empty
    await user.type(screen.getByLabelText(/Resource ARN/), "arn:aws:rds:cluster:c");
    await user.type(screen.getByLabelText(/Secret ARN/), "arn:aws:secretsmanager:secret:s");
    await user.type(screen.getByLabelText(/SQL Statement/), "SELECT 1");

    await user.click(screen.getByRole("button", { name: /Execute/i }));

    await waitFor(() => {
      expect(mockExecute).toHaveBeenCalled();
      const call = mockExecute.mock.calls[0][0];
      expect(call.database).toBeUndefined();
      expect(call.transactionId).toBeUndefined();
    });
  });
});
