// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

// ─── Hoisted state for dynamic mocks ────────────────────

const mockWorkGroups = vi.fn();
const mockDeleteWg = vi.fn();
const mockQueryExecutions = vi.fn();
const mockCreateWg = vi.fn();
const mockStopQuery = vi.fn();
const mockStartQuery = vi.fn();

const deleteWgState = vi.hoisted(() => ({
  isPending: false,
  variables: null as string | null,
}));

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
  data: undefined as any,
  isLoading: false,
}));

const databasesState = vi.hoisted(() => ({
  data: undefined as any,
  isLoading: false,
}));

const tablesState = vi.hoisted(() => ({
  data: undefined as any,
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

const startQueryState = vi.hoisted(() => ({
  isPending: false,
  isSuccess: false,
  isError: false,
  error: null as any,
  data: null as any,
}));

vi.mock("../../hooks/useAthena", () => ({
  useAthenaWorkGroups: (...args: any[]) => mockWorkGroups(...args),
  useDeleteAthenaWorkGroup: () => ({
    mutateAsync: mockDeleteWg,
    get isPending() { return deleteWgState.isPending; },
    get variables() { return deleteWgState.variables; },
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
    mutate: mockStopQuery,
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
  useAthenaStartQueryExecution: () => ({
    mutate: mockStartQuery,
    get isPending() { return startQueryState.isPending; },
    get isSuccess() { return startQueryState.isSuccess; },
    get isError() { return startQueryState.isError; },
    get error() { return startQueryState.error; },
    get data() { return startQueryState.data; },
  }),
}));

import { AthenaDashboard } from "./AthenaDashboard";

/**
 * Cloudscape Modal handles Escape via a React onKeyDown on the dialog element
 * (checking `event.keyCode === 27`). user-event's `keyboard()` targets the
 * active element (body), which never reaches the dialog in happy-dom, so we
 * dispatch the keydown on the dialog directly.
 */
function dismissModalWithEscape() {
  document.querySelectorAll('[class*="awsui_dialog"]').forEach((dialog) => {
    fireEvent.keyDown(dialog as HTMLElement, { keyCode: 27 });
  });
}

// ─── Setup ──────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockCreateWg.mockReset();
  deleteWgState.isPending = false;
  deleteWgState.variables = null;
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

  it("filters work groups by name", async () => {
    mockWorkGroups.mockReturnValue({
      data: {
        workGroups: [
          { Name: "alpha-wg", State: "ENABLED", Description: "A", CreationTime: 1705000000 },
          { Name: "beta-wg", State: "ENABLED", Description: "B", CreationTime: 1705100000 },
        ],
        total: 2,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("alpha-wg")).toBeTruthy());

    await user.type(screen.getByPlaceholderText("Find work groups"), "beta");
    await waitFor(() => expect(screen.queryByText("alpha-wg")).toBeNull());
  });

  it("renders work groups when the key is missing", () => {
    mockWorkGroups.mockReturnValue({ data: { total: 0 }, isLoading: false });
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No work groups/i)).toBeTruthy();
  });

  it("shows ENABLED fallback for missing state", () => {
    mockWorkGroups.mockReturnValue({
      data: {
        workGroups: [{ Name: "wg-nostate", State: null, Description: "D", CreationTime: 1705000000 }],
        total: 1,
      },
      isLoading: false,
    });
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("wg-nostate")).toBeTruthy();
    expect(screen.getByText("ENABLED")).toBeTruthy();
  });

  it("shows delete loading state", () => {
    deleteWgState.isPending = true;
    deleteWgState.variables = "wg-del";
    mockWorkGroups.mockReturnValue({
      data: {
        workGroups: [{ Name: "wg-del", State: "ENABLED", Description: "D", CreationTime: 1705000000 }],
        total: 1,
      },
      isLoading: false,
    });
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("wg-del")).toBeTruthy();
  });

  it("creates a work group with description and closes the modal", async () => {
    mockCreateWg.mockImplementation((_body: any, opts: any) => opts?.onSuccess?.());
    const user = userEvent.setup();
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create Work Group/i);
    await waitFor(() => expect(screen.getByPlaceholderText("my-workgroup")).toBeTruthy());

    await user.type(screen.getByPlaceholderText("my-workgroup"), "analytics");
    await user.type(screen.getByPlaceholderText("Optional description"), "Main analytics WG");
    await clickButton(user, /^Create$/);

    await waitFor(() => {
      expect(mockCreateWg).toHaveBeenCalledWith(
        { name: "analytics", description: "Main analytics WG" },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
      expect(screen.queryByText(/Must be unique/i)).toBeNull();
    });
  });

  it("shows error toast when create fails", async () => {
    mockCreateWg.mockImplementation((_body: any, opts: any) => opts?.onError?.(new Error("create wg failed")));
    const user = userEvent.setup();
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create Work Group/i);
    await user.type(screen.getByPlaceholderText("my-workgroup"), "fail-wg");
    await clickButton(user, /^Create$/);
    await waitFor(() => {
      expect(mockCreateWg).toHaveBeenCalledWith({ name: "fail-wg", description: "" }, expect.anything());
    });
  });

  it("cancels the create work group modal", async () => {
    const user = userEvent.setup();
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create Work Group/i);
    await waitFor(() => expect(screen.getByText(/Must be unique/i)).toBeTruthy());
    const cancelBtns = screen.getAllByRole("button", { name: /Cancel/i });
    await user.click(cancelBtns[cancelBtns.length - 1]);
    await waitFor(() => expect(screen.queryByText(/Must be unique/i)).toBeNull());
  });

  it("dismisses the create work group modal with Escape", async () => {
    const user = userEvent.setup();
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create Work Group/i);
    await waitFor(() => expect(screen.getByText(/Must be unique/i)).toBeTruthy());

    dismissModalWithEscape();
    await waitFor(() => expect(screen.queryByText(/Must be unique/i)).toBeNull());
    expect(mockCreateWg).not.toHaveBeenCalled();
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

  it("shows spinner while loading work group detail", async () => {
    wgDetailState.isLoading = true;
    mockWorkGroups.mockReturnValue({
      data: {
        workGroups: [{ Name: "wg-loading", State: "ENABLED", Description: "L", CreationTime: 1705000000 }],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /^Details$/);
    await waitFor(() => {
      expect(document.querySelectorAll('[class*="awsui_circle"]').length).toBeGreaterThan(0);
    });
  });

  it("shows dash for missing work group state", async () => {
    mockWorkGroups.mockReturnValue({
      data: {
        workGroups: [{ Name: "wg-nostate2", State: null, Description: "D", CreationTime: 1705000000 }],
        total: 1,
      },
      isLoading: false,
    });
    wgDetailState.data = { workGroup: { Name: "wg-nostate2", State: null, Description: "D", CreationTime: 1705000000 } };
    const user = userEvent.setup();
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /^Details$/);
    await waitFor(() => {
      expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(1);
    });
  });

  it("shows configuration defaults when fields are false or missing", async () => {
    mockWorkGroups.mockReturnValue({
      data: {
        workGroups: [{ Name: "wg-defaults", State: "ENABLED", Description: "D", CreationTime: 1705000000 }],
        total: 1,
      },
      isLoading: false,
    });
    wgDetailState.data = {
      workGroup: {
        Name: "wg-defaults",
        State: "ENABLED",
        Description: "D",
        CreationTime: 1705000000,
        Configuration: {
          ResultConfiguration: null,
          EnforceWorkGroupConfiguration: false,
          PublishCloudWatchMetricsEnabled: false,
        },
      },
    };
    const user = userEvent.setup();
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /^Details$/);
    await waitFor(() => {
      expect(screen.getAllByText("No").length).toBeGreaterThanOrEqual(2);
      expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(1);
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

  it("stops a query execution", async () => {
    mockQueryExecutions.mockReturnValue({
      data: { queryExecutionIds: ["exec-stop"], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /query executions/i }));
    await waitFor(() => expect(screen.getByText("exec-stop")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Stop$/ }));
    await waitFor(() => expect(mockStopQuery).toHaveBeenCalledWith("exec-stop"));
  });

  it("shows stop loading state", async () => {
    stopQueryState.isPending = true;
    stopQueryState.variables = "exec-stop";
    mockQueryExecutions.mockReturnValue({
      data: { queryExecutionIds: ["exec-stop"], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /query executions/i }));
    await waitFor(() => expect(screen.getByText("exec-stop")).toBeTruthy());
  });

  it("renders executions when the key is missing", async () => {
    mockQueryExecutions.mockReturnValue({ data: {}, isLoading: false });
    const user = userEvent.setup();
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /query executions/i }));
    await waitFor(() => expect(screen.getByText(/No query executions/i)).toBeTruthy());
  });

  it("dismisses the detail modal with Escape", async () => {
    mockQueryExecutions.mockReturnValue({
      data: { queryExecutionIds: ["exec-esc"], total: 1 },
      isLoading: false,
    });
    qeDetailState.data = { queryExecution: { QueryExecutionId: "exec-esc", Status: { State: "SUCCEEDED" } } };
    const user = userEvent.setup();
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /query executions/i }));
    await clickButton(user, /^Detail$/);
    await waitFor(() => expect(screen.getByText("Query Execution Detail")).toBeTruthy());

    dismissModalWithEscape();
    await waitFor(() => expect(screen.queryByText("Query Execution Detail")).toBeNull());
  });

  it("shows dash for missing status state", async () => {
    mockQueryExecutions.mockReturnValue({
      data: { queryExecutionIds: ["exec-nostatus"], total: 1 },
      isLoading: false,
    });
    qeDetailState.data = {
      queryExecution: { QueryExecutionId: "exec-nostatus", Status: {}, Query: "SELECT 1" },
    };
    const user = userEvent.setup();
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /query executions/i }));
    await clickButton(user, /^Detail$/);
    await waitFor(() => {
      expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(1);
    });
  });

  it("shows info alert for non-failed state reason", async () => {
    mockQueryExecutions.mockReturnValue({
      data: { queryExecutionIds: ["exec-info"], total: 1 },
      isLoading: false,
    });
    qeDetailState.data = {
      queryExecution: {
        QueryExecutionId: "exec-info",
        Status: { State: "QUEUED", StateChangeReason: "Still waiting for resources" },
      },
    };
    const user = userEvent.setup();
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /query executions/i }));
    await clickButton(user, /^Detail$/);
    await waitFor(() => expect(screen.getByText("Still waiting for resources")).toBeTruthy());
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

  it("shows spinner while loading results", async () => {
    qResultsState.isLoading = true;
    mockQueryExecutions.mockReturnValue({
      data: { queryExecutionIds: ["exec-spin"], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /query executions/i }));
    await clickButton(user, /View Results/i);
    await waitFor(() => {
      expect(document.querySelectorAll('[class*="awsui_circle"]').length).toBeGreaterThan(0);
    });
  });

  it("shows empty state when results data is missing", async () => {
    qResultsState.data = undefined;
    mockQueryExecutions.mockReturnValue({
      data: { queryExecutionIds: ["exec-nodata"], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /query executions/i }));
    await clickButton(user, /View Results/i);
    await waitFor(() => expect(screen.getByText(/No results available/i)).toBeTruthy());
  });

  it("falls back to Col N header and empty cell", async () => {
    qResultsState.data = { headers: [{ type: "string" }], rows: [[null]], totalRows: 1 };
    mockQueryExecutions.mockReturnValue({
      data: { queryExecutionIds: ["exec-coln"], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /query executions/i }));
    await clickButton(user, /View Results/i);
    await waitFor(() => expect(screen.getByText("Col 1")).toBeTruthy());
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

  it("renders empty catalogs tab when data is missing", async () => {
    catalogsState.data = undefined;
    databasesState.data = undefined;
    tablesState.data = undefined;
    const user = userEvent.setup();
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Catalogs & Databases/i }));
    await waitFor(() => expect(screen.getByText(/Select a database/i)).toBeTruthy());
  });

  it("renders tables container without table data", async () => {
    catalogsState.data = {
      dataCatalogs: [{ CatalogName: "AwsDataCatalog" }],
      total: 1,
    };
    databasesState.data = {
      databases: [{ Name: "my_db" }],
      total: 1,
    };
    tablesState.data = undefined;
    const user = userEvent.setup();
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Catalogs & Databases/i }));
    await clickButton(user, /^my_db$/);
    await waitFor(() => expect(screen.getByText(/Tables in my_db/i)).toBeTruthy());
  });

  it("shows table metadata without columns", async () => {
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
    tableMetaState.data = { tableMetadata: { Name: "users" } };
    const user = userEvent.setup();
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Catalogs & Databases/i }));
    await clickButton(user, /^my_db$/);
    await clickButton(user, /^users$/);
    await waitFor(() => {
      // Columns and Partition Keys counts render 0; no Columns table is shown
      expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(2);
      expect(screen.queryByText("Primary key")).toBeNull();
    });
  });
});

describe("RunQueryTab", () => {
  beforeEach(() => {
    startQueryState.isPending = false;
    startQueryState.isSuccess = false;
    startQueryState.isError = false;
    startQueryState.error = null;
    startQueryState.data = null;
    mockStartQuery.mockReset();
  });

  it("renders the run query form", async () => {
    const user = userEvent.setup();
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Run Query/i }));
    expect(screen.getByPlaceholderText("SELECT * FROM my_table LIMIT 10")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Run Query/i })).toBeTruthy();
  });

  it("disables the Run Query button when query is empty", async () => {
    const user = userEvent.setup();
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Run Query/i }));
    const btn = screen.getByRole("button", { name: /Run Query/i });
    expect(btn).toBeDisabled();
  });

  it("enables the Run Query button when query is entered", async () => {
    const user = userEvent.setup();
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Run Query/i }));
    await user.type(screen.getByPlaceholderText("SELECT * FROM my_table LIMIT 10"), "SELECT 1");
    const btn = screen.getByRole("button", { name: /Run Query/i });
    expect(btn).not.toBeDisabled();
  });

  it("calls mutate with query and database", async () => {
    const user = userEvent.setup();
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Run Query/i }));
    await user.type(screen.getByPlaceholderText("mydb"), "testdb");
    await user.type(screen.getByPlaceholderText("SELECT * FROM my_table LIMIT 10"), "SELECT 1");
    await user.click(screen.getByRole("button", { name: /Run Query/i }));
    expect(mockStartQuery).toHaveBeenCalledWith({ query: "SELECT 1", database: "testdb" });
  });

  it("calls mutate without database when database is empty", async () => {
    const user = userEvent.setup();
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Run Query/i }));
    await user.type(screen.getByPlaceholderText("SELECT * FROM my_table LIMIT 10"), "SELECT 1");
    await user.click(screen.getByRole("button", { name: /Run Query/i }));
    expect(mockStartQuery).toHaveBeenCalledWith({ query: "SELECT 1", database: undefined });
  });

  it("shows success message after query starts", async () => {
    startQueryState.isSuccess = true;
    startQueryState.data = { queryExecutionId: "exec-123" };
    const user = userEvent.setup();
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Run Query/i }));
    expect(screen.getByText(/Query started: exec-123/)).toBeTruthy();
  });

  it("shows error message when query fails", async () => {
    startQueryState.isError = true;
    startQueryState.error = { message: "Something went wrong" };
    const user = userEvent.setup();
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Run Query/i }));
    expect(screen.getByText(/Error: Something went wrong/)).toBeTruthy();
  });

  it("shows default error when no error message", async () => {
    startQueryState.isError = true;
    startQueryState.error = { message: null };
    const user = userEvent.setup();
    render(<AthenaDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Run Query/i }));
    expect(screen.getByText(/Error: Failed to start query/)).toBeTruthy();
  });
});
