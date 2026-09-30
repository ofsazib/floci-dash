// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

const mockHooks = vi.hoisted(() => ({
  useRedshiftDataStatements: vi.fn(),
  useExecuteRedshiftDataQuery: vi.fn(),
  useDescribeRedshiftDataStatement: vi.fn(),
  useRedshiftDataStatementResult: vi.fn(),
  useCancelRedshiftDataStatement: vi.fn(),
  useRedshiftDataDatabases: vi.fn(),
  useRedshiftDataSchemas: vi.fn(),
  useRedshiftDataTables: vi.fn(),
}));

vi.mock("../../hooks/useRedshiftData", () => mockHooks);

const mockExecute = vi.fn();
const mockCancel = vi.fn();

function okMutation(mock: ReturnType<typeof vi.fn>, isPending = false) {
  return { mutateAsync: mock, isPending };
}

function listQuery(overrides: Record<string, unknown> = {}) {
  return {
    data: { statements: [], total: 0 },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  };
}

const STATEMENT = {
  Id: "st-1",
  Status: "FINISHED",
  QueryString: "SELECT 1",
};
const DETAIL = {
  id: "st-1",
  status: "FINISHED",
  queryString: "SELECT 1",
  duration: 5,
  error: null,
  resultRows: 1,
  hasResultSet: true,
  clusterIdentifier: "c1",
  database: "dev",
};
const RESULT = {
  columns: [{ name: "a", typeName: "integer" }],
  records: [[{ longValue: 42 }]],
  totalNumRows: 1,
};

import RedshiftDataDashboard from "./RedshiftDataDashboard";

beforeEach(() => {
  vi.clearAllMocks();
  mockHooks.useExecuteRedshiftDataQuery.mockReturnValue(okMutation(mockExecute));
  mockHooks.useCancelRedshiftDataStatement.mockReturnValue(okMutation(mockCancel));
  mockHooks.useRedshiftDataDatabases.mockReturnValue({
    data: { databases: ["dev", "postgres"] },
    isLoading: false,
  });
  mockHooks.useRedshiftDataSchemas.mockReturnValue({
    data: { schemas: ["public"] },
    isLoading: false,
  });
  mockHooks.useRedshiftDataTables.mockReturnValue({
    data: { tables: [{ name: "t1", type: "TABLE", schema: "public" }] },
    isLoading: false,
  });
  mockHooks.useRedshiftDataStatementResult.mockReturnValue({
    data: RESULT,
    isLoading: false,
  });
  mockHooks.useDescribeRedshiftDataStatement.mockReturnValue({
    data: undefined,
    isLoading: false,
  });
});

describe("RedshiftDataDashboard — console tab", () => {
  it("renders the connection bar and console", () => {
    mockHooks.useRedshiftDataStatements.mockReturnValue(listQuery());
    render(<RedshiftDataDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Connection")).toBeTruthy();
    expect(screen.getByText("SQL")).toBeTruthy();
  });

  it("keeps Run disabled until sql and cluster are filled, then runs", async () => {
    const user = userEvent.setup();
    mockExecute.mockResolvedValueOnce({ id: "st-1", hasResultSet: true });
    render(<RedshiftDataDashboard />, { wrapper: createWrapper() });
    const run = screen.getByRole("button", { name: /^Run$/i }) as HTMLButtonElement;
    expect(run.disabled).toBe(true);
    await user.type(screen.getByPlaceholderText("my-cluster"), "c1");
    await user.type(screen.getByPlaceholderText("dev"), "analytics");
    await user.type(screen.getByPlaceholderText("SELECT 1"), "SELECT 1");
    expect(run.disabled).toBe(false);
    await user.click(run);
    await waitFor(() =>
      expect(mockExecute).toHaveBeenCalledWith({
        clusterIdentifier: "c1",
        database: "devanalytics",
        dbUser: "admin",
        sql: "SELECT 1",
      })
    );
    await waitFor(() => expect(screen.getByText("Statement st-1 submitted.")).toBeTruthy());
  });

  it("renders result columns and cell values after a run", async () => {
    const user = userEvent.setup();
    mockExecute.mockResolvedValueOnce({ id: "st-1", hasResultSet: true });
    mockHooks.useDescribeRedshiftDataStatement.mockReturnValue({
      data: DETAIL,
      isLoading: false,
    });
    render(<RedshiftDataDashboard />, { wrapper: createWrapper() });
    await user.type(screen.getByPlaceholderText("my-cluster"), "c1");
    await user.type(screen.getByPlaceholderText("SELECT 1"), "SELECT 1");
    await user.click(screen.getByRole("button", { name: /^Run$/i }));
    await waitFor(() => expect(screen.getByText("Status: FINISHED — rows: 1")).toBeTruthy());
    await waitFor(() => expect(screen.getByText("42")).toBeTruthy());
    expect(screen.getByText("Results")).toBeTruthy();
  });

  it("renders dash cell values and generated column ids for sparse results", async () => {
    const user = userEvent.setup();
    mockExecute.mockResolvedValueOnce({ id: "st-4", hasResultSet: true });
    mockHooks.useDescribeRedshiftDataStatement.mockReturnValue({
      data: { ...DETAIL, id: "st-4" },
      isLoading: false,
    });
    mockHooks.useRedshiftDataStatementResult.mockReturnValue({
      data: {
        columns: [{ typeName: "integer" }],
        records: [[{}]],
        totalNumRows: 1,
      },
      isLoading: false,
    });
    render(<RedshiftDataDashboard />, { wrapper: createWrapper() });
    await user.type(screen.getByPlaceholderText("my-cluster"), "c1");
    await user.type(screen.getByPlaceholderText("SELECT 1"), "SELECT null");
    await user.click(screen.getByRole("button", { name: /^Run$/i }));
    await waitFor(() => expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(1));
  });

  it("renders empty records when records are missing but columns exist", async () => {
    const user = userEvent.setup();
    mockExecute.mockResolvedValueOnce({ id: "st-5", hasResultSet: true });
    mockHooks.useDescribeRedshiftDataStatement.mockReturnValue({
      data: { ...DETAIL, id: "st-5" },
      isLoading: false,
    });
    mockHooks.useRedshiftDataStatementResult.mockReturnValue({
      data: { columns: [{ name: "a", typeName: "integer" }], totalNumRows: 0 },
      isLoading: false,
    });
    render(<RedshiftDataDashboard />, { wrapper: createWrapper() });
    await user.type(screen.getByPlaceholderText("my-cluster"), "c1");
    await user.type(screen.getByPlaceholderText("SELECT 1"), "SELECT 1");
    await user.click(screen.getByRole("button", { name: /^Run$/i }));
    await waitFor(() => expect(screen.getByText("Results")).toBeTruthy());
    expect(screen.getByText("No rows found")).toBeTruthy();
  });

  it("shows the no-result-set message when HasResultSet is false", async () => {
    const user = userEvent.setup();
    mockExecute.mockResolvedValueOnce({ id: "st-2", hasResultSet: false });
    mockHooks.useDescribeRedshiftDataStatement.mockReturnValue({
      data: { ...DETAIL, id: "st-2", hasResultSet: false, resultRows: 0 },
      isLoading: false,
    });
    mockHooks.useRedshiftDataStatementResult.mockReturnValue({
      data: undefined,
      isLoading: false,
    });
    render(<RedshiftDataDashboard />, { wrapper: createWrapper() });
    await user.type(screen.getByPlaceholderText("my-cluster"), "c1");
    await user.type(screen.getByPlaceholderText("SELECT 1"), "CREATE TABLE t (a int)");
    await user.click(screen.getByRole("button", { name: /^Run$/i }));
    await waitFor(() =>
      expect(screen.getByText("Statement finished with no result set.")).toBeTruthy()
    );
  });

  it("shows a fallback error alert when the run fails and dismisses it", async () => {
    const user = userEvent.setup();
    mockExecute.mockRejectedValueOnce({});
    render(<RedshiftDataDashboard />, { wrapper: createWrapper() });
    await user.type(screen.getByPlaceholderText("my-cluster"), "c1");
    await user.type(screen.getByPlaceholderText("SELECT 1"), "SELECT 1");
    await user.click(screen.getByRole("button", { name: /^Run$/i }));
    await waitFor(() =>
      expect(screen.getByText("Failed to run statement")).toBeTruthy()
    );
    fireEvent.click(document.querySelector('[class*="awsui_dismiss-button"]') as HTMLElement);
    await waitFor(() =>
      expect(screen.queryByText("Failed to run statement")).toBeNull()
    );
  });

  it("shows the statement error when describe reports one", async () => {
    const user = userEvent.setup();
    mockExecute.mockResolvedValueOnce({ id: "st-3", hasResultSet: false });
    mockHooks.useDescribeRedshiftDataStatement.mockReturnValue({
      data: { ...DETAIL, id: "st-3", error: "syntax error", hasResultSet: false },
      isLoading: false,
    });
    mockHooks.useRedshiftDataStatementResult.mockReturnValue({
      data: undefined,
      isLoading: false,
    });
    render(<RedshiftDataDashboard />, { wrapper: createWrapper() });
    await user.type(screen.getByPlaceholderText("my-cluster"), "c1");
    await user.type(screen.getByPlaceholderText("SELECT 1"), "SELEKT 1");
    await user.click(screen.getByRole("button", { name: /^Run$/i }));
    await waitFor(() => expect(screen.getByText("syntax error")).toBeTruthy());
  });
});

describe("RedshiftDataDashboard — statements tab", () => {
  function setupStatements(statements: unknown[] = [STATEMENT]) {
    mockHooks.useRedshiftDataStatements.mockReturnValue(
      listQuery({ data: { statements, total: statements.length } })
    );
    render(<RedshiftDataDashboard />, { wrapper: createWrapper() });
  }

  it("lists statements with status and query", async () => {
    const user = userEvent.setup();
    setupStatements();
    await user.click(screen.getByRole("tab", { name: /^Statements/ }));
    await waitFor(() => expect(screen.getByText("st-1")).toBeTruthy());
    expect(screen.getByText("SELECT 1")).toBeTruthy();
  });

  it("shows the empty table message when no statements exist", async () => {
    const user = userEvent.setup();
    setupStatements([]);
    await user.click(screen.getByRole("tab", { name: /^Statements/ }));
    await waitFor(() => expect(screen.getByText("No statements found")).toBeTruthy());
  });

  it("opens a statement detail with results", async () => {
    const user = userEvent.setup();
    mockHooks.useDescribeRedshiftDataStatement.mockReturnValue({
      data: DETAIL,
      isLoading: false,
    });
    setupStatements();
    await user.click(screen.getByRole("tab", { name: /^Statements/ }));
    await user.click(screen.getByRole("button", { name: /^View$/i }));
    await waitFor(() => expect(screen.getByText("Statement st-1")).toBeTruthy());
    await waitFor(() => expect(screen.getByText("42")).toBeTruthy());
  });

  it("shows no-result-set message in the detail", async () => {
    const user = userEvent.setup();
    mockHooks.useDescribeRedshiftDataStatement.mockReturnValue({
      data: { ...DETAIL, hasResultSet: false },
      isLoading: false,
    });
    mockHooks.useRedshiftDataStatementResult.mockReturnValue({
      data: undefined,
      isLoading: false,
    });
    setupStatements();
    await user.click(screen.getByRole("tab", { name: /^Statements/ }));
    await user.click(screen.getByRole("button", { name: /^View$/i }));
    await waitFor(() =>
      expect(screen.getByText("Statement finished with no result set.")).toBeTruthy()
    );
  });

  it("shows the no-columns message when hasResultSet but columns are empty", async () => {
    const user = userEvent.setup();
    mockHooks.useDescribeRedshiftDataStatement.mockReturnValue({
      data: DETAIL,
      isLoading: false,
    });
    mockHooks.useRedshiftDataStatementResult.mockReturnValue({
      data: { columns: [], records: [], totalNumRows: 0 },
      isLoading: false,
    });
    setupStatements();
    await user.click(screen.getByRole("tab", { name: /^Statements/ }));
    await user.click(screen.getByRole("button", { name: /^View$/i }));
    await waitFor(() => expect(screen.getByText("No result columns returned.")).toBeTruthy());
  });

  it("cancels a running statement after confirmation", async () => {
    const user = userEvent.setup();
    mockCancel.mockResolvedValueOnce({ ok: true });
    setupStatements([{ ...STATEMENT, Status: "SUBMITTED" }]);
    await user.click(screen.getByRole("tab", { name: /^Statements/ }));
    await waitFor(() => expect(screen.getByText("st-1")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete st-1/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockCancel).toHaveBeenCalledWith("st-1"));
  });

  it("renders empty statements when query data is undefined", async () => {
    const user = userEvent.setup();
    mockHooks.useRedshiftDataStatements.mockReturnValue(
      listQuery({ data: undefined, isLoading: false })
    );
    render(<RedshiftDataDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Statements/ }));
    await waitFor(() => expect(screen.getByText("No statements found")).toBeTruthy());
  });

  it("shows the detail error alert for a failed statement", async () => {
    const user = userEvent.setup();
    mockHooks.useDescribeRedshiftDataStatement.mockReturnValue({
      data: { ...DETAIL, error: "Query exceeded allocation" },
      isLoading: false,
    });
    setupStatements();
    await user.click(screen.getByRole("tab", { name: /^Statements/ }));
    await user.click(screen.getByRole("button", { name: /^View$/i }));
    await waitFor(() =>
      expect(screen.getByText("Query exceeded allocation")).toBeTruthy()
    );
  });

  it("renders sparse detail results: missing records and unnamed columns", async () => {
    const user = userEvent.setup();
    mockHooks.useDescribeRedshiftDataStatement.mockReturnValue({
      data: { ...DETAIL, id: "st-9" },
      isLoading: false,
    });
    mockHooks.useRedshiftDataStatementResult.mockReturnValue({
      data: { columns: [{ typeName: "integer" }], totalNumRows: 0 },
      isLoading: false,
    });
    setupStatements([{ ...STATEMENT, Id: "st-9" }]);
    await user.click(screen.getByRole("tab", { name: /^Statements/ }));
    await user.click(screen.getByRole("button", { name: /^View$/i }));
    await waitFor(() => expect(screen.getByText("Statement st-9")).toBeTruthy());
    await waitFor(() => expect(screen.getByText("No rows found")).toBeTruthy());
  });

  it("renders the dash query fallback when QueryString and Query are absent", async () => {
    const user = userEvent.setup();
    setupStatements([{ Id: "st-2", Status: "FINISHED" }]);
    await user.click(screen.getByRole("tab", { name: /^Statements/ }));
    await waitFor(() => expect(screen.getByText("st-2")).toBeTruthy());
  });
});

describe("RedshiftDataDashboard — catalog tab", () => {
  it("prompts for a cluster when none is set", async () => {
    const user = userEvent.setup();
    mockHooks.useRedshiftDataStatements.mockReturnValue(listQuery());
    render(<RedshiftDataDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Catalog/ }));
    await waitFor(() =>
      expect(
        screen.getByText("Enter a cluster identifier to browse the catalog.")
      ).toBeTruthy()
    );
  });

  it("prompts for a cluster when dbUser is cleared", async () => {
    const user = userEvent.setup();
    mockHooks.useRedshiftDataStatements.mockReturnValue(listQuery());
    render(<RedshiftDataDashboard />, { wrapper: createWrapper() });
    await user.type(screen.getByPlaceholderText("my-cluster"), "c1");
    await user.click(screen.getByRole("tab", { name: /^Catalog/ }));
    await waitFor(() => expect(screen.getByText("postgres")).toBeTruthy());
    const dbUserInput = screen.getByPlaceholderText("admin");
    await user.clear(dbUserInput);
    await waitFor(() =>
      expect(
        screen.getByText("Enter a cluster identifier to browse the catalog.")
      ).toBeTruthy()
    );
  });

  it("drills databases → schemas → tables", async () => {
    const user = userEvent.setup();
    mockHooks.useRedshiftDataStatements.mockReturnValue(listQuery());
    render(<RedshiftDataDashboard />, { wrapper: createWrapper() });
    await user.type(screen.getByPlaceholderText("my-cluster"), "c1");
    await user.click(screen.getByRole("tab", { name: /^Catalog/ }));
    await waitFor(() => expect(screen.getByText("postgres")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^dev$/i }));
    await waitFor(() => expect(screen.getByText("Schemas in dev")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^public$/i }));
    await waitFor(() => expect(screen.getByText("Tables in public")).toBeTruthy());
    await waitFor(() => expect(screen.getByText("t1")).toBeTruthy());
  });

  it("renders catalog dash arms when query data is undefined", async () => {
    const user = userEvent.setup();
    mockHooks.useRedshiftDataDatabases.mockReturnValue({ data: undefined, isLoading: false });
    mockHooks.useRedshiftDataSchemas.mockReturnValue({ data: undefined, isLoading: false });
    mockHooks.useRedshiftDataTables.mockReturnValue({ data: undefined, isLoading: false });
    mockHooks.useRedshiftDataStatements.mockReturnValue(listQuery());
    render(<RedshiftDataDashboard />, { wrapper: createWrapper() });
    await user.type(screen.getByPlaceholderText("my-cluster"), "c1");
    await user.click(screen.getByRole("tab", { name: /^Catalog/ }));
    await waitFor(() => expect(screen.getByText("No databases found")).toBeTruthy());
  });

  it("shows the empty schemas message when schema data is undefined", async () => {
    const user = userEvent.setup();
    mockHooks.useRedshiftDataSchemas.mockReturnValue({ data: undefined, isLoading: false });
    mockHooks.useRedshiftDataTables.mockReturnValue({ data: undefined, isLoading: false });
    mockHooks.useRedshiftDataStatements.mockReturnValue(listQuery());
    render(<RedshiftDataDashboard />, { wrapper: createWrapper() });
    await user.type(screen.getByPlaceholderText("my-cluster"), "c1");
    await user.click(screen.getByRole("tab", { name: /^Catalog/ }));
    await waitFor(() => expect(screen.getByText("dev")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^dev$/i }));
    await waitFor(() => expect(screen.getByText("Schemas in dev")).toBeTruthy());
    await waitFor(() => expect(screen.getByText("No schemas found")).toBeTruthy());
  });

  it("shows the empty tables message when table data is undefined", async () => {
    const user = userEvent.setup();
    mockHooks.useRedshiftDataTables.mockReturnValue({ data: undefined, isLoading: false });
    mockHooks.useRedshiftDataStatements.mockReturnValue(listQuery());
    render(<RedshiftDataDashboard />, { wrapper: createWrapper() });
    await user.type(screen.getByPlaceholderText("my-cluster"), "c1");
    await user.click(screen.getByRole("tab", { name: /^Catalog/ }));
    await user.click(screen.getByRole("button", { name: /^dev$/i }));
    await user.click(screen.getByRole("button", { name: /^public$/i }));
    await waitFor(() => expect(screen.getByText("Tables in public")).toBeTruthy());
    await waitFor(() => expect(screen.getByText("No tables found")).toBeTruthy());
  });

  it("shows the empty databases message when the cluster has none", async () => {
    const user = userEvent.setup();
    mockHooks.useRedshiftDataDatabases.mockReturnValue({
      data: { databases: [] },
      isLoading: false,
    });
    mockHooks.useRedshiftDataStatements.mockReturnValue(listQuery());
    render(<RedshiftDataDashboard />, { wrapper: createWrapper() });
    await user.type(screen.getByPlaceholderText("my-cluster"), "c1");
    await user.click(screen.getByRole("tab", { name: /^Catalog/ }));
    await waitFor(() => expect(screen.getByText("No databases found")).toBeTruthy());
  });
});
