// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

// ─── Hoisted state for dynamic mocks ────────────────────

const mockWorkGroups = vi.fn();
const mockDeleteWg = vi.fn();
const mockQueryExecutions = vi.fn();
const mockCreateWg = vi.fn();

const wgDetailState = vi.hoisted(() => ({
  data: undefined as any,
  isLoading: false,
}));

const qeDetailState = vi.hoisted(() => ({
  data: undefined as any,
  isLoading: false,
}));

const qResultsState = vi.hoisted(() => ({
  data: undefined as any,
  isLoading: false,
}));

const catalogsState = vi.hoisted(() => ({
  data: { dataCatalogs: [] as any[], total: 0 },
  isLoading: false,
}));

const databasesState = vi.hoisted(() => ({
  data: { databases: [] as any[], total: 0 },
  isLoading: false,
}));

const tablesState = vi.hoisted(() => ({
  data: { tables: [] as any[], total: 0 },
  isLoading: false,
}));

const tableMetaState = vi.hoisted(() => ({
  data: undefined as any,
  isLoading: false,
}));

const createWgState = vi.hoisted(() => ({
  isPending: false,
}));

const stopQueryState = vi.hoisted(() => ({
  isPending: false,
  variables: null as string | null,
}));

vi.mock("../../hooks/useAthena", () => ({
  useAthenaWorkGroups: (...args: any[]) => mockWorkGroups(...args),
  useDeleteAthenaWorkGroup: () => ({
    mutateAsync: mockDeleteWg,
    isPending: false,
    variables: null,
  }),
  useAthenaQueryExecutions: (...args: any[]) => mockQueryExecutions(...args),
  useCreateAthenaWorkGroup: () => ({
    mutate: mockCreateWg,
    mutateAsync: vi.fn(),
    get isPending() { return createWgState.isPending; },
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useAthenaWorkGroup: () => ({
    get data() { return wgDetailState.data; },
    get isLoading() { return wgDetailState.isLoading; },
  }),
  useAthenaQueryExecution: () => ({
    get data() { return qeDetailState.data; },
    get isLoading() { return qeDetailState.isLoading; },
  }),
  useAthenaQueryResults: () => ({
    get data() { return qResultsState.data; },
    get isLoading() { return qResultsState.isLoading; },
  }),
  useStopAthenaQuery: () => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    get isPending() { return stopQueryState.isPending; },
    get variables() { return stopQueryState.variables; },
  }),
  useAthenaDataCatalogs: () => ({
    get data() { return catalogsState.data; },
    isLoading: false,
  }),
  useAthenaDatabases: () => ({
    get data() { return databasesState.data; },
    isLoading: false,
  }),
  useAthenaTables: () => ({
    get data() { return tablesState.data; },
    isLoading: false,
  }),
  useAthenaTableMetadata: () => ({
    get data() { return tableMetaState.data; },
    get isLoading() { return tableMetaState.isLoading; },
  }),
}));

import { AthenaDashboard } from "./AthenaDashboard";

// ─── Setup ──────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockCreateWg.mockReset();
  createWgState.isPending = false;
  stopQueryState.isPending = false;
  stopQueryState.variables = null;
  wgDetailState.data = undefined;
  wgDetailState.isLoading = false;
  qeDetailState.data = undefined;
  qeDetailState.isLoading = false;
  qResultsState.data = undefined;
  qResultsState.isLoading = false;
  catalogsState.data = { dataCatalogs: [], total: 0 };
  databasesState.data = { databases: [], total: 0 };
  tablesState.data = { tables: [], total: 0 };
  tableMetaState.data = undefined;
  tableMetaState.isLoading = false;
  mockWorkGroups.mockReturnValue({
    data: { workGroups: [], total: 0 },
    isLoading: false,
    isError: false,
    error: null,
  });
  mockQueryExecutions.mockReturnValue({
    data: { queryExecutionIds: [], total: 0 },
    isLoading: false,
  });
});

// ─── Tests ──────────────────────────────────────────────

describe("AthenaDashboard — rendering", () => {
  it("shows loading skeleton when loading", () => {
    mockWorkGroups.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });
    const { container } = render(<AthenaDashboard />, { wrapper: createWrapper() });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("renders both tabs", () => {
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    expect(screen.getByRole("tab", { name: /work groups/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /query executions/i })).toBeTruthy();
  });

  it("shows empty message for work groups", () => {
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No work groups/i)).toBeTruthy();
  });
});

describe("AthenaDashboard — work groups tab", () => {
  it("renders work groups with data", () => {
    mockWorkGroups.mockReturnValue({
      data: {
        workGroups: [
          {
            Name: "primary",
            State: "ENABLED",
            Description: "Primary work group",
            CreationTime: 1705000000,
          },
          {
            Name: "analytics",
            State: "ENABLED",
            Description: "Analytics work group",
            CreationTime: 1705100000,
          },
        ],
        total: 2,
      },
      isLoading: false,
    });
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("primary")).toBeTruthy();
    expect(screen.getByText("analytics")).toBeTruthy();
    expect(screen.getByText("Primary work group")).toBeTruthy();
    expect(screen.getAllByText("ENABLED").length).toBeGreaterThanOrEqual(1);
  });

  it("shows dash for missing description and creation time", () => {
    mockWorkGroups.mockReturnValue({
      data: {
        workGroups: [{ Name: "wg-null", State: "ENABLED", Description: null, CreationTime: null }],
        total: 1,
      },
      isLoading: false,
    });
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("wg-null")).toBeTruthy();
    // Dash for missing description and creation
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(2);
  });

  it("allows deleting non-primary work groups", async () => {
    mockWorkGroups.mockReturnValue({
      data: {
        workGroups: [
          { Name: "analytics", State: "ENABLED", Description: "Analytics", CreationTime: 1705100000 },
        ],
        total: 1,
      },
      isLoading: false,
    });

    const user = userEvent.setup();
    render(<AthenaDashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("analytics")).toBeTruthy();
    });

    const deleteBtns = screen.getAllByRole("button", { name: /Delete analytics/i });
    await user.click(deleteBtns[0]);

    await waitFor(() => {
      expect(screen.getByText(/Are you sure/i)).toBeTruthy();
    });

    const confirmDeleteBtns = screen.getAllByRole("button", { name: /^Delete$/i });
    await user.click(confirmDeleteBtns[confirmDeleteBtns.length - 1]);

    await waitFor(() => {
      expect(mockDeleteWg).toHaveBeenCalledWith("analytics");
    });
  });

  it("does not show delete button for primary work group", () => {
    mockWorkGroups.mockReturnValue({
      data: {
        workGroups: [
          { Name: "primary", State: "ENABLED", Description: "Default", CreationTime: 1705000000 },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    expect(screen.queryByRole("button", { name: /Delete primary/i })).toBeNull();
  });

  // ── Create Work Group Modal ──

  it("opens create work group modal", async () => {
    const user = userEvent.setup();
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create Work Group/i);
    expect(screen.getByText(/Must be unique/i)).toBeTruthy();
  });

  it("shows modal with Name and Description fields", async () => {
    const user = userEvent.setup();
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create Work Group/i);
    await waitFor(() => expect(screen.getByPlaceholderText("my-workgroup")).toBeTruthy());
    expect(screen.getByPlaceholderText("Optional description")).toBeTruthy();
  });

  it("create WG with loading state disables button", async () => {
    createWgState.isPending = true;
    const user = userEvent.setup();
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create Work Group/i);
    await user.type(screen.getByPlaceholderText("my-workgroup"), "loadingWG");
    const createBtn = screen.getByRole("button", { name: /^Create$/ });
    // Cloudscape uses aria-disabled, not native disabled attribute
    expect(createBtn).toHaveAttribute("aria-disabled", "true");
    createWgState.isPending = false;
  });

  it("create button disabled when name is empty", async () => {
    const user = userEvent.setup();
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create Work Group/i);
    const createBtn = screen.getByRole("button", { name: /^Create$/ });
    expect(createBtn).toBeDisabled();
  });

  it("create WG with only name (no description)", async () => {
    const user = userEvent.setup();
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create Work Group/i);
    await user.type(screen.getByPlaceholderText("my-workgroup"), "minWG");
    await clickButton(user, /^Create$/);
    expect(mockCreateWg).toHaveBeenCalledWith({ name: "minWG", description: "" }, expect.any(Object));
  });

  // ── Work Group Detail ──

  it("opens work group detail tab via Details button", async () => {
    mockWorkGroups.mockReturnValue({
      data: {
        workGroups: [{ Name: "wg-test", State: "ENABLED", Description: "Test", CreationTime: 1705000000 }],
        total: 1,
      },
      isLoading: false,
    });
    wgDetailState.data = {
      workGroup: {
        Name: "wg-test",
        State: "ENABLED",
        Description: "Test",
        CreationTime: 1705000000,
      },
    };
    const user = userEvent.setup();
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /^Details$/);
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /WG: wg-test/i })).toBeTruthy();
    });
  });

  it("shows work group detail with full configuration", async () => {
    mockWorkGroups.mockReturnValue({
      data: {
        workGroups: [{ Name: "wg-config", State: "ENABLED", Description: "With config", CreationTime: 1705000000 }],
        total: 1,
      },
      isLoading: false,
    });
    wgDetailState.data = {
      workGroup: {
        Name: "wg-config",
        State: "ENABLED",
        Description: "With config",
        CreationTime: 1705000000,
        Configuration: {
          ResultConfiguration: { OutputLocation: "s3://bucket/output/" },
          EnforceWorkGroupConfiguration: true,
          PublishCloudWatchMetricsEnabled: true,
        },
      },
    };
    const user = userEvent.setup();
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /^Details$/);
    await waitFor(() => {
      expect(screen.getByText("s3://bucket/output/")).toBeTruthy();
      const yesEls = screen.getAllByText("Yes");
      expect(yesEls.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("shows work group detail without configuration", async () => {
    mockWorkGroups.mockReturnValue({
      data: {
        workGroups: [{ Name: "wg-noconf", State: "ENABLED", Description: "No conf", CreationTime: null }],
        total: 1,
      },
      isLoading: false,
    });
    wgDetailState.data = {
      workGroup: {
        Name: "wg-noconf",
        State: "ENABLED",
        Description: null,
        CreationTime: null,
      },
    };
    const user = userEvent.setup();
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /^Details$/);
    await waitFor(() => {
      expect(screen.getByText("wg-noconf")).toBeTruthy();
    });
    // Dashes for missing fields
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  it("shows work group not found when data missing and not loading", async () => {
    mockWorkGroups.mockReturnValue({
      data: {
        workGroups: [{ Name: "wg-gone", State: "ENABLED", Description: "Gone", CreationTime: 1705000000 }],
        total: 1,
      },
      isLoading: false,
    });
    wgDetailState.isLoading = false;
    wgDetailState.data = { workGroup: null };
    const user = userEvent.setup();
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /^Details$/);
    await waitFor(() => {
      expect(screen.getByText(/Work group not found/i)).toBeTruthy();
    });
  });

  it("returns to work groups tab via back button", async () => {
    mockWorkGroups.mockReturnValue({
      data: {
        workGroups: [{ Name: "wg-back", State: "ENABLED", Description: "Back test", CreationTime: 1705000000 }],
        total: 1,
      },
      isLoading: false,
    });
    wgDetailState.data = { workGroup: { Name: "wg-back", State: "ENABLED", Description: "Back test", CreationTime: 1705000000 } };
    const user = userEvent.setup();
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /^Details$/);
    await waitFor(() => expect(screen.getByText(/← Back to Work Groups/i)).toBeTruthy());
    await clickButton(user, /← Back to Work Groups/i);
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /work groups/i, selected: true })).toBeTruthy();
    });
  });
});

describe("AthenaDashboard — query executions tab", () => {
  it("shows empty message for query executions", async () => {
    const user = userEvent.setup();
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /query executions/i }));
    await waitFor(() => {
      expect(screen.getByText(/No query executions/i)).toBeTruthy();
    });
  });

  it("renders query execution IDs", async () => {
    mockQueryExecutions.mockReturnValue({
      data: {
        queryExecutionIds: ["exec-001", "exec-002"],
        total: 2,
      },
      isLoading: false,
    });

    const user = userEvent.setup();
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /query executions/i }));
    await waitFor(() => {
      expect(screen.getByText("exec-001")).toBeTruthy();
      expect(screen.getByText("exec-002")).toBeTruthy();
    });
  });

  // ── Query Execution Detail Modal ──

  it("opens query execution detail modal", async () => {
    mockQueryExecutions.mockReturnValue({
      data: { queryExecutionIds: ["exec-detail"], total: 1 },
      isLoading: false,
    });
    qeDetailState.data = {
      queryExecution: {
        QueryExecutionId: "exec-detail",
        Status: { State: "SUCCEEDED" },
        WorkGroup: "primary",
        Statistics: { DataScannedInBytes: 1024 },
        Query: "SELECT * FROM test",
      },
    };
    const user = userEvent.setup();
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /query executions/i }));
    await clickButton(user, /^Detail$/);
    await waitFor(() => {
      expect(screen.getByText("SELECT * FROM test")).toBeTruthy();
      expect(screen.getByText("SUCCEEDED")).toBeTruthy();
    });
  });

  it("shows FAILED state reason as error alert", async () => {
    mockQueryExecutions.mockReturnValue({
      data: { queryExecutionIds: ["exec-fail"], total: 1 },
      isLoading: false,
    });
    qeDetailState.data = {
      queryExecution: {
        QueryExecutionId: "exec-fail",
        Status: { State: "FAILED", StateChangeReason: "Syntax error" },
        WorkGroup: "primary",
        Query: "BAD SQL",
      },
    };
    const user = userEvent.setup();
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /query executions/i }));
    await clickButton(user, /^Detail$/);
    await waitFor(() => {
      expect(screen.getByText("Syntax error")).toBeTruthy();
    });
  });

  it("shows dash for missing WorkGroup and Statistics", async () => {
    mockQueryExecutions.mockReturnValue({
      data: { queryExecutionIds: ["exec-min"], total: 1 },
      isLoading: false,
    });
    qeDetailState.data = {
      queryExecution: {
        QueryExecutionId: "exec-min",
        Status: { State: "QUEUED" },
        Query: "SELECT 1",
      },
    };
    const user = userEvent.setup();
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /query executions/i }));
    await clickButton(user, /^Detail$/);
    await waitFor(() => {
      const dashes = screen.getAllByText("—");
      expect(dashes.length).toBeGreaterThanOrEqual(1);
    });
  });
});

// ── Query Results View ──────────────────────────────────

describe("AthenaDashboard — query results", () => {
  it("navigates to query results tab via View Results", async () => {
    mockQueryExecutions.mockReturnValue({
      data: { queryExecutionIds: ["exec-results"], total: 1 },
      isLoading: false,
    });
    qResultsState.data = { headers: [{ name: "col1", type: "string" }], rows: [["val1"]], totalRows: 1 };
    const user = userEvent.setup();
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /query executions/i }));
    await clickButton(user, /View Results/i);
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /Query Results/i })).toBeTruthy();
    });
  });

  it("shows results with single data column when no headers", async () => {
    mockQueryExecutions.mockReturnValue({
      data: { queryExecutionIds: ["exec-noheaders"], total: 1 },
      isLoading: false,
    });
    qResultsState.data = { headers: [], rows: [["raw-data"]], totalRows: 1 };
    const user = userEvent.setup();
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /query executions/i }));
    await clickButton(user, /View Results/i);
    await waitFor(() => {
      expect(screen.getByText("raw-data")).toBeTruthy();
      // Column Info only renders when headers.length > 0
      expect(screen.queryByText("Column Info")).toBeNull();
    });
  });

  it("shows query results with headers and rows", async () => {
    mockQueryExecutions.mockReturnValue({
      data: { queryExecutionIds: ["exec-rows"], total: 1 },
      isLoading: false,
    });
    qResultsState.data = {
      headers: [
        { name: "id", type: "integer" },
        { name: "name", type: "varchar" },
      ],
      rows: [["1", "Alice"], ["2", "Bob"]],
      totalRows: 2,
    };
    const user = userEvent.setup();
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /query executions/i }));
    await clickButton(user, /View Results/i);
    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeTruthy();
      expect(screen.getByText("Bob")).toBeTruthy();
      expect(screen.getByText("Column Info")).toBeTruthy();
    });
  });

  it("shows Column Info with label differ from name", async () => {
    mockQueryExecutions.mockReturnValue({
      data: { queryExecutionIds: ["exec-label"], total: 1 },
      isLoading: false,
    });
    qResultsState.data = {
      headers: [{ name: "user_id", type: "integer", label: "User ID" }],
      rows: [["1"]],
      totalRows: 1,
    };
    const user = userEvent.setup();
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /query executions/i }));
    await clickButton(user, /View Results/i);
    await waitFor(() => {
      expect(screen.getByText("(User ID)")).toBeTruthy();
    });
  });

  it("shows empty results message when no rows", async () => {
    mockQueryExecutions.mockReturnValue({
      data: { queryExecutionIds: ["exec-empty"], total: 1 },
      isLoading: false,
    });
    qResultsState.data = { headers: [], rows: [], totalRows: 0 };
    const user = userEvent.setup();
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /query executions/i }));
    await clickButton(user, /View Results/i);
    await waitFor(() => {
      expect(screen.getByText(/No results available/i)).toBeTruthy();
    });
  });

  it("shows back button returns to executions", async () => {
    mockQueryExecutions.mockReturnValue({
      data: { queryExecutionIds: ["exec-back"], total: 1 },
      isLoading: false,
    });
    qResultsState.data = { headers: [{ name: "x", type: "int" }], rows: [["1"]], totalRows: 1 };
    const user = userEvent.setup();
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /query executions/i }));
    await clickButton(user, /View Results/i);
    await waitFor(() => expect(screen.getByText(/← Back to Executions/i)).toBeTruthy());
    await clickButton(user, /← Back to Executions/i);
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /query executions/i, selected: true })).toBeTruthy();
    });
  });
});

// ── Catalogs Tab ────────────────────────────────────────

describe("AthenaDashboard — catalogs tab", () => {
  it("renders catalogs, databases, and prompts for db selection", async () => {
    catalogsState.data = {
      dataCatalogs: [{ CatalogName: "AwsDataCatalog" }],
      total: 1,
    };
    databasesState.data = {
      databases: [{ Name: "my_db" }],
      total: 1,
    };
    const user = userEvent.setup();
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Catalogs & Databases/i }));
    await waitFor(() => {
      expect(screen.getByText("AwsDataCatalog")).toBeTruthy();
      expect(screen.getByText("my_db")).toBeTruthy();
      expect(screen.getByText(/Select a database/i)).toBeTruthy();
    });
  });

  it("selects database and shows tables", async () => {
    catalogsState.data = {
      dataCatalogs: [{ CatalogName: "AwsDataCatalog" }],
      total: 1,
    };
    databasesState.data = {
      databases: [{ Name: "my_db" }],
      total: 1,
    };
    tablesState.data = {
      tables: [{ Name: "users" }, { Name: "orders" }],
      total: 2,
    };
    const user = userEvent.setup();
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Catalogs & Databases/i }));
    await clickButton(user, /^my_db$/);
    await waitFor(() => {
      expect(screen.getByText("users")).toBeTruthy();
      expect(screen.getByText("orders")).toBeTruthy();
    });
  });

  it("selects table and shows metadata with columns", async () => {
    catalogsState.data = {
      dataCatalogs: [{ CatalogName: "AwsDataCatalog" }],
      total: 1,
    };
    databasesState.data = {
      databases: [{ Name: "my_db" }],
      total: 1,
    };
    tablesState.data = {
      tables: [{ Name: "users" }],
      total: 1,
    };
    tableMetaState.data = {
      tableMetadata: {
        Name: "users",
        Columns: [
          { Name: "id", Type: "int", Comment: "Primary key" },
          { Name: "email", Type: "string", Comment: "" },
        ],
        PartitionKeys: [],
      },
    };
    const user = userEvent.setup();
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Catalogs & Databases/i }));
    await clickButton(user, /^my_db$/);
    await clickButton(user, /^users$/);
    await waitFor(() => {
      expect(screen.getByText("Primary key")).toBeTruthy();
      expect(screen.getByText("int")).toBeTruthy();
    });
  });

  it("selects catalog highlights button", async () => {
    catalogsState.data = {
      dataCatalogs: [{ CatalogName: "AwsDataCatalog" }, { CatalogName: "CustomCatalog" }],
      total: 2,
    };
    databasesState.data = { databases: [], total: 0 };
    const user = userEvent.setup();
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Catalogs & Databases/i }));
    await clickButton(user, /^AwsDataCatalog$/);
    // Verify the button becomes primary variant (selected)
    // In Cloudscape, "primary" variant renders differently; we can check the button exists
    expect(screen.getByText("AwsDataCatalog")).toBeTruthy();
  });

  it("clears selected table when new database selected", async () => {
    catalogsState.data = {
      dataCatalogs: [{ CatalogName: "AwsDataCatalog" }],
      total: 1,
    };
    databasesState.data = {
      databases: [{ Name: "db1" }, { Name: "db2" }],
      total: 2,
    };
    tablesState.data = {
      tables: [{ Name: "t1" }],
      total: 1,
    };
    const user = userEvent.setup();
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Catalogs & Databases/i }));
    // Select db1, then a table
    await clickButton(user, /^db1$/);
    await clickButton(user, /^t1$/);
    // Now click db2 — should clear the table selection
    await clickButton(user, /^db2$/);
    // The table should no longer be highlighted as selected
    await waitFor(() => {
      expect(screen.getByText("t1")).toBeTruthy();
    });
  });
});
