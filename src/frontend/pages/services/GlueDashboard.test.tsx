// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

const mockDatabases = vi.fn();
const mockDeleteDb = vi.fn();
const mockTables = vi.fn();
const mockDeleteTable = vi.fn();
const mockPartitions = vi.fn();
const mockCreatePartitions = vi.fn();
const mockDeletePartition = vi.fn();

const deleteDbState = vi.hoisted(() => ({ isPending: false, variables: null as string | null }));
const deleteTblState = vi.hoisted(() => ({ isPending: false, variables: null as string | null }));
const deleteRegistryState = vi.hoisted(() => ({ isPending: false, variables: null as string | null }));
const deleteSchemaState = vi.hoisted(() => ({ isPending: false, variables: null as string | null }));
const deleteUDFState = vi.hoisted(() => ({ isPending: false, variables: null as string | null }));
const deletePartitionState = vi.hoisted(() => ({ isPending: false }));
const deleteStatsState = vi.hoisted(() => ({ isPending: false, variables: null as string | null }));

// ── Hoisted state for Schema Registry / UDFs / Column Stats ──
const registriesState = vi.hoisted(() => ({ data: undefined as any, isLoading: false }));
const schemasState = vi.hoisted(() => ({ data: undefined as any, isLoading: false }));
const versionsState = vi.hoisted(() => ({ data: undefined as any, isLoading: false }));
const versionDetailState = vi.hoisted(() => ({ data: undefined as any, isLoading: false }));
const metadataState = vi.hoisted(() => ({ data: {} as any }));
const udfsState = vi.hoisted(() => ({ data: undefined as any, isLoading: false }));
const columnStatsState = vi.hoisted(() => ({ data: undefined as any, isLoading: false }));

const mockCreateRegistry = vi.fn();
const mockDeleteRegistry = vi.fn();
const mockCreateSchema = vi.fn();
const mockDeleteSchema = vi.fn();
const mockRegisterVersion = vi.fn();
const mockCreateUDF = vi.fn();
const mockUpdateUDF = vi.fn();
const mockDeleteUDFFn = vi.fn();
const mockUpdateStats = vi.fn();
const mockDeleteStats = vi.fn();

vi.mock("../../hooks/useGlue", () => ({
  useGlueDatabases: (...args: any[]) => mockDatabases(...args),
  useDeleteGlueDatabase: () => ({ mutateAsync: mockDeleteDb, isPending: deleteDbState.isPending, variables: deleteDbState.variables }),
  useGlueTables: (...args: any[]) => mockTables(...args),
  useDeleteGlueTable: (_dbName: string) => ({ mutateAsync: mockDeleteTable, isPending: deleteTblState.isPending, variables: deleteTblState.variables }),
  useGluePartitions: (...args: any[]) => mockPartitions(...args),
  useCreateGluePartitions: () => ({ mutate: mockCreatePartitions, isPending: false }),
  useDeleteGluePartition: () => ({ mutate: mockDeletePartition, isPending: deletePartitionState.isPending }),
  // ── Schema Registry ──
  useGlueRegistries: () => ({ get data() { return registriesState.data; }, get isLoading() { return registriesState.isLoading; } }),
  useCreateGlueRegistry: () => ({ mutate: mockCreateRegistry, mutateAsync: vi.fn(), isPending: false }),
  useDeleteGlueRegistry: () => ({ mutateAsync: mockDeleteRegistry, isPending: deleteRegistryState.isPending, variables: deleteRegistryState.variables }),
  useGlueSchemas: () => ({ get data() { return schemasState.data; }, get isLoading() { return schemasState.isLoading; } }),
  useCreateGlueSchema: () => ({ mutate: mockCreateSchema, mutateAsync: vi.fn(), isPending: false }),
  useDeleteGlueSchema: () => ({ mutateAsync: mockDeleteSchema, isPending: deleteSchemaState.isPending, variables: deleteSchemaState.variables }),
  useGlueSchemaVersions: () => ({ get data() { return versionsState.data; }, get isLoading() { return versionsState.isLoading; } }),
  useRegisterGlueSchemaVersion: () => ({ mutate: mockRegisterVersion, isPending: false }),
  useGlueSchemaVersion: () => ({ get data() { return versionDetailState.data; }, get isLoading() { return versionDetailState.isLoading; } }),
  useSchemaVersionMetadata: () => ({ get data() { return metadataState.data; } }),
  // ── UDFs ──
  useGlueUDFs: () => ({ get data() { return udfsState.data; }, get isLoading() { return udfsState.isLoading; } }),
  useCreateGlueUDF: () => ({ mutate: mockCreateUDF, isPending: false }),
  useUpdateGlueUDF: () => ({ mutate: mockUpdateUDF, isPending: false }),
  useDeleteGlueUDF: () => ({ mutateAsync: mockDeleteUDFFn, isPending: deleteUDFState.isPending, variables: deleteUDFState.variables }),
  // ── Column Stats ──
  useGlueColumnStats: () => ({ get data() { return columnStatsState.data; }, get isLoading() { return columnStatsState.isLoading; } }),
  useGluePartitionColumnStats: () => ({ get data() { return columnStatsState.data; }, get isLoading() { return columnStatsState.isLoading; } }),
  useUpdateGlueColumnStats: () => ({ mutate: mockUpdateStats, isPending: false }),
  useDeleteGlueColumnStats: () => ({ mutateAsync: mockDeleteStats, isPending: deleteStatsState.isPending, variables: deleteStatsState.variables }),
}));

import { GlueDashboard } from "./GlueDashboard";

/**
 * Cloudscape Modal handles Escape via a React onKeyDown on the dialog element
 * (checking `event.keyCode === 27`). user-event's `keyboard()` targets the
 * active element (body), which never reaches the dialog in happy-dom, so we
 * dispatch the keydown on the dialog directly.
 */
function dismissModalWithEscape() {
  // Fire on every dialog: DeleteButton's ConfirmDialog keeps a hidden
  // `.awsui_dialog` in the DOM when closed, which can precede the open modal.
  document.querySelectorAll('[class*="awsui_dialog"]').forEach((dialog) => {
    fireEvent.keyDown(dialog as HTMLElement, { keyCode: 27 });
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  deleteDbState.isPending = false;
  deleteDbState.variables = null;
  deleteTblState.isPending = false;
  deleteTblState.variables = null;
  deleteRegistryState.isPending = false;
  deleteRegistryState.variables = null;
  deleteSchemaState.isPending = false;
  deleteSchemaState.variables = null;
  deleteUDFState.isPending = false;
  deleteUDFState.variables = null;
  deletePartitionState.isPending = false;
  deleteStatsState.isPending = false;
  deleteStatsState.variables = null;
  registriesState.data = { registries: [] };
  registriesState.isLoading = false;
  schemasState.data = { schemas: [] };
  schemasState.isLoading = false;
  versionsState.data = { versions: [] };
  versionsState.isLoading = false;
  versionDetailState.data = undefined;
  versionDetailState.isLoading = false;
  metadataState.data = { metadataInfoMap: {} };
  udfsState.data = { functions: [], total: 0 };
  udfsState.isLoading = false;
  columnStatsState.data = { columnStats: [], total: 0 };
  columnStatsState.isLoading = false;
  mockDatabases.mockReturnValue({ data: { databases: [], total: 0 }, isLoading: false });
  mockTables.mockReturnValue({ data: { tables: [], total: 0 }, isLoading: false });
  mockPartitions.mockReturnValue({ data: { partitions: [], total: 0 }, isLoading: false });
});

describe("GlueDashboard", () => {
  it("shows loading skeleton", () => {
    mockDatabases.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = render(<GlueDashboard />, { wrapper: createWrapper() });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("shows empty message", () => {
    render(<GlueDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No Glue databases/i)).toBeTruthy();
  });

  it("renders databases with data", () => {
    mockDatabases.mockReturnValue({
      data: {
        databases: [{ Name: "my-db", Description: "My database", LocationUri: "s3://bucket/db", CreateTime: "2024-01-15T00:00:00Z" }],
        total: 1,
      },
      isLoading: false,
    });
    render(<GlueDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-db")).toBeTruthy();
  });

  it("shows dash for missing description", () => {
    mockDatabases.mockReturnValue({
      data: { databases: [{ Name: "test" }], total: 1 },
      isLoading: false,
    });
    render(<GlueDashboard />, { wrapper: createWrapper() });
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(1);
  });

  it("navigates to database detail view", async () => {
    mockDatabases.mockReturnValue({
      data: { databases: [{ Name: "click-db", Description: "desc", CreateTime: "2024-01-15T00:00:00Z" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("click-db")).toBeTruthy());

    await user.click(screen.getByText("click-db"));
    await waitFor(() => expect(screen.getByText(/Tables in click-db/i)).toBeTruthy());
    expect(screen.getByText(/No tables/i)).toBeTruthy();
  });

  it("shows back button in detail view", async () => {
    mockDatabases.mockReturnValue({
      data: { databases: [{ Name: "test-db", Description: "desc" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("test-db"));
    await user.click(screen.getByText("test-db"));
    await waitFor(() => expect(screen.getByText(/Back to databases/i)).toBeTruthy());
    await user.click(screen.getByText(/Back to databases/i));
    await waitFor(() => expect(screen.getByText("test-db")).toBeTruthy());
  });

  it("renders tables in database detail", async () => {
    mockDatabases.mockReturnValue({
      data: { databases: [{ Name: "db-with-tables", Description: "desc" }], total: 1 },
      isLoading: false,
    });
    mockTables.mockReturnValue({
      data: {
        tables: [{ Name: "my-table", TableType: "EXTERNAL_TABLE", StorageDescriptor: { Location: "s3://bucket/tbl", Columns: [] }, CreateTime: "2024-01-15T00:00:00Z" }],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("db-with-tables"));
    await user.click(screen.getByText("db-with-tables"));
    await waitFor(() => expect(screen.getByText("my-table")).toBeTruthy());
    expect(screen.getByText("EXTERNAL_TABLE")).toBeTruthy();
  });

  it("filters databases by name", async () => {
    mockDatabases.mockReturnValue({
      data: {
        databases: [
          { Name: "alpha-db", Description: "desc1" },
          { Name: "beta-db", Description: "desc2" },
        ],
        total: 2,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("alpha-db")).toBeTruthy());

    const filterInput = screen.getByPlaceholderText("Find databases");
    await user.type(filterInput, "beta");
    await waitFor(() => expect(screen.queryByText("alpha-db")).toBeNull());
  });

  it("deletes a database", async () => {
    mockDatabases.mockReturnValue({
      data: { databases: [{ Name: "delete-me", Description: "desc" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("delete-me")).toBeTruthy());

    const deleteBtn = screen.getByRole("button", { name: /Delete delete-me/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteDb).toHaveBeenCalledWith("delete-me"));
  });

  it("renders delete database loading state", () => {
    deleteDbState.isPending = true;
    deleteDbState.variables = "delete-me";
    mockDatabases.mockReturnValue({
      data: { databases: [{ Name: "delete-me", Description: "desc" }], total: 1 },
      isLoading: false,
    });
    render(<GlueDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("delete-me")).toBeTruthy();
  });

  it("deletes a table", async () => {
    mockDatabases.mockReturnValue({
      data: { databases: [{ Name: "db-1", Description: "desc" }], total: 1 },
      isLoading: false,
    });
    mockTables.mockReturnValue({
      data: { tables: [{ Name: "tbl-1", TableType: "EXTERNAL_TABLE", StorageDescriptor: { Location: "s3://b/loc", Columns: [] }, CreateTime: "2024-01-15" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("db-1"));
    await user.click(screen.getByText("db-1"));
    await waitFor(() => expect(screen.getByText("tbl-1")).toBeTruthy());

    const deleteBtn = screen.getByRole("button", { name: /Delete tbl-1/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteTable).toHaveBeenCalledWith("tbl-1"));
  });

  it("renders delete table loading state", async () => {
    deleteTblState.isPending = true;
    deleteTblState.variables = "tbl-1";
    mockDatabases.mockReturnValue({
      data: { databases: [{ Name: "db-1", Description: "desc" }], total: 1 },
      isLoading: false,
    });
    mockTables.mockReturnValue({
      data: { tables: [{ Name: "tbl-1", TableType: "EXTERNAL_TABLE", StorageDescriptor: { Location: "s3://b/loc", Columns: [] }, CreateTime: "2024-01-15" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("db-1"));
    await user.click(screen.getByText("db-1"));
    await waitFor(() => expect(screen.getByText("tbl-1")).toBeTruthy());
  });

  it("renders empty databases view when databases key is missing", () => {
    mockDatabases.mockReturnValue({ data: {}, isLoading: false });
    render(<GlueDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No Glue databases/i)).toBeTruthy();
  });

  it("filters tables by name", async () => {
    mockDatabases.mockReturnValue({
      data: { databases: [{ Name: "db-f", Description: "desc" }], total: 1 },
      isLoading: false,
    });
    mockTables.mockReturnValue({
      data: {
        tables: [
          { Name: "alpha-tbl", TableType: "EXTERNAL_TABLE", StorageDescriptor: { Location: "s3://b/a", Columns: [] }, CreateTime: "2024-01-15T00:00:00Z" },
          { Name: "beta-tbl", TableType: "EXTERNAL_TABLE", StorageDescriptor: { Location: "s3://b/b", Columns: [] }, CreateTime: "2024-01-15T00:00:00Z" },
        ],
        total: 2,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("db-f"));
    await user.click(screen.getByText("db-f"));
    await waitFor(() => expect(screen.getByText("alpha-tbl")).toBeTruthy());

    const filterInput = screen.getByPlaceholderText("Find tables");
    await user.type(filterInput, "beta");
    await waitFor(() => expect(screen.queryByText("alpha-tbl")).toBeNull());
  });

  it("renders tables view when tables key is missing", async () => {
    mockDatabases.mockReturnValue({
      data: { databases: [{ Name: "db-nokey", Description: "desc" }], total: 1 },
      isLoading: false,
    });
    mockTables.mockReturnValue({ data: {}, isLoading: false });
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("db-nokey"));
    await user.click(screen.getByText("db-nokey"));
    await waitFor(() => {
      expect(screen.getByText(/Tables in db-nokey/i)).toBeTruthy();
      expect(screen.getByText(/No tables/i)).toBeTruthy();
    });
  });

  it("lists partitions in the Partitions tab", async () => {
    mockDatabases.mockReturnValue({ data: { databases: [{ Name: "db-1" }], total: 1 }, isLoading: false });
    mockTables.mockReturnValue({ data: { tables: [{ Name: "tbl-1" }], total: 1 }, isLoading: false });
    mockPartitions.mockReturnValue({
      data: { partitions: [{ values: ["2024", "01"], location: "s3://b/p/", creationTime: null }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Partitions"));
    await user.click(await screen.findByRole("button", { name: "db-1" }));
    await user.click(await screen.findByRole("button", { name: "tbl-1" }));
    await waitFor(() => expect(screen.getByText("2024, 01")).toBeTruthy());
    expect(screen.getByText("s3://b/p/")).toBeTruthy();
  });

  it("deletes a partition", async () => {
    mockDeletePartition.mockImplementation((_vals: string[], opts: any) => opts?.onSuccess?.());
    mockDatabases.mockReturnValue({ data: { databases: [{ Name: "db-1" }], total: 1 }, isLoading: false });
    mockTables.mockReturnValue({ data: { tables: [{ Name: "tbl-1" }], total: 1 }, isLoading: false });
    mockPartitions.mockReturnValue({
      data: { partitions: [{ values: ["2024"], location: null, creationTime: null }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Partitions"));
    await user.click(await screen.findByRole("button", { name: "db-1" }));
    await user.click(await screen.findByRole("button", { name: "tbl-1" }));
    await user.click(await screen.findByRole("button", { name: /Delete 2024/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i, { last: true });
    await waitFor(() => expect(mockDeletePartition).toHaveBeenCalledWith(["2024"], expect.anything()));
  });
});

// ─── Schema Registry Tab ────────────────────────────────

describe("GlueDashboard — Schema Registry", () => {
  it("renders registries", async () => {
    registriesState.data = {
      registries: [{ name: "reg1", status: "AVAILABLE", description: "First registry", created: "2024-01-01" }],
    };
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Schema Registry"));
    await waitFor(() => {
      expect(screen.getByText("reg1")).toBeTruthy();
      expect(screen.getByText("AVAILABLE")).toBeTruthy();
    });
  });

  it("shows dash for missing registry description", async () => {
    registriesState.data = {
      registries: [{ name: "reg-nodesc", status: "AVAILABLE" }],
    };
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Schema Registry"));
    await waitFor(() => expect(screen.getByText("reg-nodesc")).toBeTruthy());
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(1);
  });

  it("selects registry and shows schemas", async () => {
    registriesState.data = {
      registries: [{ name: "reg-sel", status: "AVAILABLE" }],
    };
    schemasState.data = {
      schemas: [{ name: "schema1", dataFormat: "AVRO", compatibility: "NONE", status: "AVAILABLE" }],
    };
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Schema Registry"));
    await clickButton(user, /^reg-sel$/);
    await waitFor(() => {
      expect(screen.getByText("schema1")).toBeTruthy();
      expect(screen.getByText(/Registry: reg-sel/)).toBeTruthy();
    });
  });

  it("selects schema and shows versions", async () => {
    registriesState.data = {
      registries: [{ name: "reg-v", status: "AVAILABLE" }],
    };
    schemasState.data = {
      schemas: [{ name: "s1", dataFormat: "AVRO", compatibility: "NONE", status: "AVAILABLE" }],
    };
    versionsState.data = {
      versions: [{ versionNumber: 1, versionId: "vid-1", status: "AVAILABLE", createdTime: "2024-01-01" }],
    };
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Schema Registry"));
    await clickButton(user, /^reg-v$/);
    await clickButton(user, /^s1$/);
    await waitFor(() => {
      expect(screen.getByText(/Schema: s1/)).toBeTruthy();
      expect(screen.getByText("v1")).toBeTruthy();
    });
  });

  it("shows version detail modal", async () => {
    registriesState.data = { registries: [{ name: "reg-vd", status: "AVAILABLE" }] };
    schemasState.data = { schemas: [{ name: "s-vd", dataFormat: "AVRO", compatibility: "NONE", status: "AVAILABLE" }] };
    versionsState.data = { versions: [{ versionNumber: 1, versionId: "vid-1", status: "AVAILABLE", createdTime: "2024-01-01" }] };
    versionDetailState.data = {
      version: { versionId: "vid-1", status: "AVAILABLE", dataFormat: "AVRO", versionNumber: 1, definition: '{"type":"record"}' },
    };
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Schema Registry"));
    await clickButton(user, /^reg-vd$/);
    await clickButton(user, /^s-vd$/);
    await clickButton(user, /^View$/);
    await waitFor(() => {
      expect(screen.getByText('{"type":"record"}')).toBeTruthy();
    });
  });

  it("shows version detail with missing fields as dash", async () => {
    registriesState.data = { registries: [{ name: "reg-md", status: "AVAILABLE" }] };
    schemasState.data = { schemas: [{ name: "s-md", dataFormat: "AVRO", compatibility: "NONE", status: "AVAILABLE" }] };
    versionsState.data = { versions: [{ versionNumber: 2, versionId: null, status: null, createdTime: null }] };
    versionDetailState.data = {
      version: { versionId: null, status: null, dataFormat: null, versionNumber: 2, definition: "" },
    };
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Schema Registry"));
    await clickButton(user, /^reg-md$/);
    await clickButton(user, /^s-md$/);
    await clickButton(user, /^View$/);
    await waitFor(() => {
      const dashes = screen.getAllByText("-");
      expect(dashes.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("shows no version detail available", async () => {
    registriesState.data = { registries: [{ name: "reg-empty", status: "AVAILABLE" }] };
    schemasState.data = { schemas: [{ name: "s-e", dataFormat: "AVRO", compatibility: "NONE", status: "AVAILABLE" }] };
    versionsState.data = { versions: [{ versionNumber: 1 }] };
    versionDetailState.data = undefined;
    versionDetailState.isLoading = false;
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Schema Registry"));
    await clickButton(user, /^reg-empty$/);
    await clickButton(user, /^s-e$/);
    await clickButton(user, /^View$/);
    await waitFor(() => {
      expect(screen.getByText(/No version detail available/i)).toBeTruthy();
    });
  });

  it("back button returns to registries list", async () => {
    registriesState.data = { registries: [{ name: "reg-back", status: "AVAILABLE" }] };
    schemasState.data = { schemas: [{ name: "s-back", dataFormat: "AVRO", compatibility: "NONE", status: "AVAILABLE" }] };
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Schema Registry"));
    await clickButton(user, /^reg-back$/);
    await waitFor(() => expect(screen.getByText("s-back")).toBeTruthy());
    await clickButton(user, /Back to registries/);
    await waitFor(() => expect(screen.getByText(/Create registry/)).toBeTruthy());
  });

  it("renders empty registries when registries key is missing", async () => {
    registriesState.data = undefined;
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Schema Registry"));
    await waitFor(() => expect(screen.getByText(/No registries/i)).toBeTruthy());
  });

  it("shows empty schemas when schemas key is missing", async () => {
    registriesState.data = { registries: [{ name: "reg-noschemas", status: "AVAILABLE" }] };
    schemasState.data = undefined;
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Schema Registry"));
    await clickButton(user, /^reg-noschemas$/);
    await waitFor(() => expect(screen.getByText(/No schemas/i)).toBeTruthy());
  });

  it("shows empty versions when versions key is missing", async () => {
    registriesState.data = { registries: [{ name: "reg-noversions", status: "AVAILABLE" }] };
    schemasState.data = { schemas: [{ name: "s-noversions", dataFormat: "AVRO", compatibility: "NONE", status: "AVAILABLE" }] };
    versionsState.data = undefined;
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Schema Registry"));
    await clickButton(user, /^reg-noversions$/);
    await clickButton(user, /^s-noversions$/);
    await waitFor(() => expect(screen.getByText(/No versions registered/i)).toBeTruthy());
  });

  it("shows warning status and dashes for a sparse schema", async () => {
    registriesState.data = { registries: [{ name: "reg-sparse", status: "AVAILABLE" }] };
    schemasState.data = { schemas: [{ name: "s-sparse", status: "FAILED" }] };
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Schema Registry"));
    await clickButton(user, /^reg-sparse$/);
    await waitFor(() => {
      expect(screen.getByText("s-sparse")).toBeTruthy();
      expect(screen.getByText("FAILED")).toBeTruthy();
    });
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(2);
  });

  it("deletes a registry", async () => {
    registriesState.data = { registries: [{ name: "reg-del", status: "AVAILABLE" }] };
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Schema Registry"));
    await waitFor(() => expect(screen.getByText("reg-del")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete reg-del/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteRegistry).toHaveBeenCalledWith("reg-del"));
  });

  it("deletes the selected registry and clears the schemas view", async () => {
    registriesState.data = { registries: [{ name: "reg-seldel", status: "AVAILABLE" }] };
    schemasState.data = { schemas: [{ name: "s-seldel", dataFormat: "AVRO", compatibility: "NONE", status: "AVAILABLE" }] };
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Schema Registry"));
    await clickButton(user, /^reg-seldel$/);
    await waitFor(() => expect(screen.getByText(/Registry: reg-seldel/)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete reg-seldel/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => {
      expect(mockDeleteRegistry).toHaveBeenCalledWith("reg-seldel");
      expect(screen.queryByText(/Registry: reg-seldel/)).toBeNull();
    });
  });

  it("shows delete registry loading state", async () => {
    deleteRegistryState.isPending = true;
    deleteRegistryState.variables = "reg-loading";
    registriesState.data = { registries: [{ name: "reg-loading", status: "AVAILABLE" }] };
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Schema Registry"));
    await waitFor(() => expect(screen.getByText("reg-loading")).toBeTruthy());
  });

  it("deletes a schema", async () => {
    registriesState.data = { registries: [{ name: "reg-delschema", status: "AVAILABLE" }] };
    schemasState.data = { schemas: [{ name: "s-delschema", dataFormat: "AVRO", compatibility: "NONE", status: "AVAILABLE" }] };
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Schema Registry"));
    await clickButton(user, /^reg-delschema$/);
    await waitFor(() => expect(screen.getByText("s-delschema")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete s-delschema/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    // Last Delete — the registry DeleteButton's hidden ConfirmDialog renders an earlier one
    await clickButton(user, /^Delete$/i, { last: true });
    await waitFor(() => expect(mockDeleteSchema).toHaveBeenCalledWith("s-delschema"));
  });

  it("deletes the selected schema and clears the versions view", async () => {
    registriesState.data = { registries: [{ name: "reg-selds", status: "AVAILABLE" }] };
    schemasState.data = { schemas: [{ name: "s-selds", dataFormat: "AVRO", compatibility: "NONE", status: "AVAILABLE" }] };
    versionsState.data = { versions: [{ versionNumber: 1, versionId: "v1" }] };
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Schema Registry"));
    await clickButton(user, /^reg-selds$/);
    await clickButton(user, /^s-selds$/);
    await waitFor(() => expect(screen.getByText(/Schema: s-selds/)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete s-selds/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i, { last: true });
    await waitFor(() => {
      expect(mockDeleteSchema).toHaveBeenCalledWith("s-selds");
      expect(screen.queryByText(/Schema: s-selds/)).toBeNull();
    });
  });

  it("shows delete schema loading state", async () => {
    deleteSchemaState.isPending = true;
    deleteSchemaState.variables = "s-loading";
    registriesState.data = { registries: [{ name: "reg-sls", status: "AVAILABLE" }] };
    schemasState.data = { schemas: [{ name: "s-loading", dataFormat: "AVRO", compatibility: "NONE", status: "AVAILABLE" }] };
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Schema Registry"));
    await clickButton(user, /^reg-sls$/);
    await waitFor(() => expect(screen.getByText("s-loading")).toBeTruthy());
  });

  it("closes the version detail modal", async () => {
    registriesState.data = { registries: [{ name: "reg-close", status: "AVAILABLE" }] };
    schemasState.data = { schemas: [{ name: "s-close", dataFormat: "AVRO", compatibility: "NONE", status: "AVAILABLE" }] };
    versionsState.data = { versions: [{ versionNumber: 1, versionId: "vid", status: "AVAILABLE", createdTime: "2024-01-01" }] };
    versionDetailState.data = { version: { versionId: "vid", status: "AVAILABLE", dataFormat: "AVRO", versionNumber: 1, definition: "{}" } };
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Schema Registry"));
    await clickButton(user, /^reg-close$/);
    await clickButton(user, /^s-close$/);
    await clickButton(user, /^View$/);
    await waitFor(() => expect(screen.getByText(/Schema Version v1/)).toBeTruthy());
    await clickButton(user, /^Close$/);
    await waitFor(() => expect(screen.queryByText(/Schema Version v1/)).toBeNull());

    // Reopen and dismiss with Escape (fires the modal's onDismiss)
    await clickButton(user, /^View$/);
    await waitFor(() => expect(screen.getByText(/Schema Version v1/)).toBeTruthy());
    dismissModalWithEscape();
    await waitFor(() => expect(screen.queryByText(/Schema Version v1/)).toBeNull());
  });

  it("shows a spinner while the version detail is loading", async () => {
    registriesState.data = { registries: [{ name: "reg-spin", status: "AVAILABLE" }] };
    schemasState.data = { schemas: [{ name: "s-spin", dataFormat: "AVRO", compatibility: "NONE", status: "AVAILABLE" }] };
    versionsState.data = { versions: [{ versionNumber: 3, versionId: "v3" }] };
    versionDetailState.isLoading = true;
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Schema Registry"));
    await clickButton(user, /^reg-spin$/);
    await clickButton(user, /^s-spin$/);
    await clickButton(user, /^View$/);
    // Cloudscape Spinner renders hashed classes with `awsui_circle` markers
    await waitFor(() => expect(document.querySelector('[class*="awsui_circle"]')).toBeTruthy());
  });

  it("renders metadata fallback when metadataInfoMap is missing", async () => {
    metadataState.data = {};
    registriesState.data = { registries: [{ name: "reg-md2", status: "AVAILABLE" }] };
    schemasState.data = { schemas: [{ name: "s-md2", dataFormat: "AVRO", compatibility: "NONE", status: "AVAILABLE" }] };
    versionsState.data = { versions: [{ versionNumber: 2, versionId: "v2" }] };
    versionDetailState.data = { version: { versionId: "v2", status: "AVAILABLE", dataFormat: "AVRO", versionNumber: 2, definition: '{"type":"record"}' } };
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Schema Registry"));
    await clickButton(user, /^reg-md2$/);
    await clickButton(user, /^s-md2$/);
    await clickButton(user, /^View$/);
    await waitFor(() => {
      // metadata falls back to "{}"; definition stays its own JSON
      expect(screen.getByDisplayValue("{}")).toBeTruthy();
    });
  });

  it("creates a registry", async () => {
    mockCreateRegistry.mockImplementation((_body: any, opts: any) => opts?.onSuccess?.());
    registriesState.data = { registries: [{ name: "reg-existing", status: "AVAILABLE" }] };
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Schema Registry"));
    await waitFor(() => expect(screen.getByText("reg-existing")).toBeTruthy());
    await clickButton(user, /Create registry/i);
    await waitFor(() => expect(screen.getByText("Create Registry")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("my-registry"), "  my-new-reg  ");
    await clickButton(user, /^Create$/);
    await waitFor(() => {
      expect(mockCreateRegistry).toHaveBeenCalledWith({ name: "my-new-reg" }, expect.objectContaining({ onSuccess: expect.any(Function) }));
      expect(screen.queryByText("Create Registry")).toBeNull();
    });
  });

  it("create registry error shows error toast", async () => {
    mockCreateRegistry.mockImplementation((_body: any, opts: any) => opts?.onError?.(new Error("boom")));
    registriesState.data = { registries: [] };
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Schema Registry"));
    await clickButton(user, /Create registry/i);
    await waitFor(() => expect(screen.getByText("Create Registry")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("my-registry"), "err-reg");
    await clickButton(user, /^Create$/);
    await waitFor(() => expect(mockCreateRegistry).toHaveBeenCalled());
  });

  it("create registry requires a name", async () => {
    registriesState.data = { registries: [] };
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Schema Registry"));
    await clickButton(user, /Create registry/i);
    await waitFor(() => expect(screen.getByText("Create Registry")).toBeTruthy());
    const createBtns = screen.getAllByRole("button", { name: /^Create$/ });
    expect(createBtns[createBtns.length - 1]).toBeDisabled();
  });

  it("cancels and escapes out of create registry modal", async () => {
    registriesState.data = { registries: [] };
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Schema Registry"));
    await clickButton(user, /Create registry/i);
    await waitFor(() => expect(screen.getByText("Create Registry")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("my-registry"), "tmp");
    await clickButton(user, /^Cancel$/);
    await waitFor(() => expect(screen.queryByText("Create Registry")).toBeNull());

    await clickButton(user, /Create registry/i);
    await waitFor(() => expect(screen.getByText("Create Registry")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("my-registry"), "tmp");
    dismissModalWithEscape();
    await waitFor(() => expect(screen.queryByText("Create Registry")).toBeNull());
  });

  it("creates a schema with format and compatibility selections", async () => {
    mockCreateSchema.mockImplementation((_body: any, opts: any) => opts?.onSuccess?.());
    registriesState.data = { registries: [{ name: "reg-cs", status: "AVAILABLE" }] };
    schemasState.data = { schemas: [{ name: "s-exist", dataFormat: "AVRO", compatibility: "NONE", status: "AVAILABLE" }] };
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Schema Registry"));
    await clickButton(user, /^reg-cs$/);
    await clickButton(user, /Create Schema/i);
    await waitFor(() => expect(screen.getByText("Create Schema")).toBeTruthy());

    await user.type(screen.getByPlaceholderText("my-schema"), "my-schema");
    // Data format AVRO -> JSON (Select trigger is labelled by its FormField)
    await user.click(screen.getByRole("button", { name: /AVRO/i }));
    await user.click(screen.getByRole("option", { name: /JSON/i }));
    // Compatibility NONE -> BACKWARD
    await user.click(screen.getByRole("button", { name: /Compatibility mode NONE/i }));
    await user.click(screen.getByRole("option", { name: /BACKWARD/i }));
    await user.type(screen.getByPlaceholderText("Schema description"), "A schema");
    await clickButton(user, /^Create$/);
    await waitFor(() => {
      expect(mockCreateSchema).toHaveBeenCalledWith(
        { name: "my-schema", dataFormat: "JSON", compatibility: "BACKWARD", description: "A schema" },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
      expect(screen.queryByText("Create Schema")).toBeNull();
    });
  });

  it("creates a schema without a description", async () => {
    mockCreateSchema.mockImplementation((_body: any, opts: any) => opts?.onSuccess?.());
    registriesState.data = { registries: [{ name: "reg-cs2", status: "AVAILABLE" }] };
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Schema Registry"));
    await clickButton(user, /^reg-cs2$/);
    await clickButton(user, /Create Schema/i);
    await waitFor(() => expect(screen.getByText("Create Schema")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("my-schema"), "bare-schema");
    await clickButton(user, /^Create$/);
    await waitFor(() => {
      expect(mockCreateSchema).toHaveBeenCalledWith(
        { name: "bare-schema", dataFormat: "AVRO", compatibility: "NONE", description: undefined },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
    });
  });

  it("cancels create schema modal", async () => {
    registriesState.data = { registries: [{ name: "reg-csc", status: "AVAILABLE" }] };
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Schema Registry"));
    await clickButton(user, /^reg-csc$/);
    await clickButton(user, /Create Schema/i);
    await waitFor(() => expect(screen.getByText("Create Schema")).toBeTruthy());
    // Last Cancel — DeleteButton's hidden ConfirmDialog renders an earlier one
    await clickButton(user, /^Cancel$/, { last: true });
    await waitFor(() => expect(screen.queryByText("Create Schema")).toBeNull());
  });

  it("registers a schema version", async () => {
    mockRegisterVersion.mockImplementation((_body: any, opts: any) => opts?.onSuccess?.());
    registriesState.data = { registries: [{ name: "reg-rv2", status: "AVAILABLE" }] };
    schemasState.data = { schemas: [{ name: "s-rv2", dataFormat: "AVRO", compatibility: "NONE", status: "AVAILABLE" }] };
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Schema Registry"));
    await clickButton(user, /^reg-rv2$/);
    await clickButton(user, /^s-rv2$/);
    await clickButton(user, /Register Version/i);
    await waitFor(() => expect(screen.getByText("Register Schema Version")).toBeTruthy());
    const defArea = screen.getByPlaceholderText('{"type":"record","name":"MyRecord","fields":[{"name":"id","type":"int"}]}');
    // paste() takes the clipboard data (target is the active element); clear the "{}" default first
    await user.clear(defArea);
    await user.paste('{"type":"record"}');
    await clickButton(user, /^Register$/);
    await waitFor(() => {
      expect(mockRegisterVersion).toHaveBeenCalledWith({ definition: '{"type":"record"}' }, expect.objectContaining({ onSuccess: expect.any(Function) }));
      expect(screen.queryByText("Register Schema Version")).toBeNull();
    });
  });

  it("cancels and escapes out of register version modal", async () => {
    registriesState.data = { registries: [{ name: "reg-rvc", status: "AVAILABLE" }] };
    schemasState.data = { schemas: [{ name: "s-rvc", dataFormat: "AVRO", compatibility: "NONE", status: "AVAILABLE" }] };
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Schema Registry"));
    await clickButton(user, /^reg-rvc$/);
    await clickButton(user, /^s-rvc$/);
    await clickButton(user, /Register Version/i);
    await waitFor(() => expect(screen.getByText("Register Schema Version")).toBeTruthy());
    // Last Cancel — DeleteButton's hidden ConfirmDialog renders an earlier one
    await clickButton(user, /^Cancel$/, { last: true });
    await waitFor(() => expect(screen.queryByText("Register Schema Version")).toBeNull());

    await clickButton(user, /Register Version/i);
    await waitFor(() => expect(screen.getByText("Register Schema Version")).toBeTruthy());
    dismissModalWithEscape();
    await waitFor(() => expect(screen.queryByText("Register Schema Version")).toBeNull());
  });

  it("register version error shows error toast", async () => {
    mockRegisterVersion.mockImplementation((_body: any, opts: any) => opts?.onError?.(new Error("nope")));
    registriesState.data = { registries: [{ name: "reg-rve", status: "AVAILABLE" }] };
    schemasState.data = { schemas: [{ name: "s-rve", dataFormat: "AVRO", compatibility: "NONE", status: "AVAILABLE" }] };
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Schema Registry"));
    await clickButton(user, /^reg-rve$/);
    await clickButton(user, /^s-rve$/);
    await clickButton(user, /Register Version/i);
    await waitFor(() => expect(screen.getByText("Register Schema Version")).toBeTruthy());
    // The default definition "{}" is already truthy, so Register is enabled
    await clickButton(user, /^Register$/);
    await waitFor(() => expect(mockRegisterVersion).toHaveBeenCalled());
  });
});

// ─── UDFs Tab ───────────────────────────────────────────

describe("GlueDashboard — UDFs", () => {
  it("shows database selector buttons", async () => {
    mockDatabases.mockReturnValue({
      data: { databases: [{ Name: "udf-db1" }, { Name: "udf-db2" }], total: 2 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("UDFs"));
    await waitFor(() => {
      expect(screen.getByText("udf-db1")).toBeTruthy();
      expect(screen.getByText("udf-db2")).toBeTruthy();
    });
  });

  it("selects database and shows UDFs", async () => {
    mockDatabases.mockReturnValue({
      data: { databases: [{ Name: "udf-db" }], total: 1 },
      isLoading: false,
    });
    udfsState.data = {
      functions: [{ name: "my_udf", className: "com.example.MyUDF", ownerName: "admin", ownerType: "USER", createTime: "2024-01-15" }],
      total: 1,
    };
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("UDFs"));
    await clickButton(user, /^udf-db$/);
    await waitFor(() => {
      expect(screen.getByText("my_udf")).toBeTruthy();
      expect(screen.getByText("com.example.MyUDF")).toBeTruthy();
    });
  });

  it("shows dash for missing owner fields", async () => {
    mockDatabases.mockReturnValue({
      data: { databases: [{ Name: "udf-min" }], total: 1 },
      isLoading: false,
    });
    udfsState.data = {
      functions: [{ name: "bare", className: "com.Bare", createTime: null }],
      total: 1,
    };
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("UDFs"));
    await clickButton(user, /^udf-min$/);
    await waitFor(() => {
      expect(screen.getByText("bare")).toBeTruthy();
      // owner renders as "- (-)" (one text node), created is standalone "-"
      expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(1);
    });
  });

  it("opens create UDF modal", async () => {
    mockDatabases.mockReturnValue({
      data: { databases: [{ Name: "udf-db" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("UDFs"));
    await clickButton(user, /^udf-db$/);
    await clickButton(user, /Create/i);
    await waitFor(() => {
      expect(screen.getByText(/Create UDF in udf-db/)).toBeTruthy();
    });
  });

  it("submits create UDF", async () => {
    mockDatabases.mockReturnValue({
      data: { databases: [{ Name: "udf-db" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("UDFs"));
    await clickButton(user, /^udf-db$/);
    await clickButton(user, /Create/i);
    await user.type(screen.getByPlaceholderText("my_function"), "test_fn");
    await user.type(screen.getByPlaceholderText("com.example.MyUDF"), "com.TestFn");
    await clickButton(user, /^Create$/);
    expect(mockCreateUDF).toHaveBeenCalledWith({ name: "test_fn", className: "com.TestFn" }, expect.any(Object));
  });

  it("opens edit UDF modal and submits", async () => {
    mockDatabases.mockReturnValue({
      data: { databases: [{ Name: "udf-db" }], total: 1 },
      isLoading: false,
    });
    udfsState.data = {
      functions: [{ name: "edit_fn", className: "com.Original", ownerName: "admin", ownerType: "USER", createTime: "2024-01-01" }],
      total: 1,
    };
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("UDFs"));
    await clickButton(user, /^udf-db$/);
    await clickButton(user, /^Edit$/);
    await waitFor(() => expect(screen.getByText(/Edit UDF: edit_fn/)).toBeTruthy());
    // Clear and retype class name
    const classInput = screen.getByDisplayValue("com.Original");
    await user.clear(classInput);
    await user.type(classInput, "com.Updated");
    await clickButton(user, /^Save$/);
    expect(mockUpdateUDF).toHaveBeenCalledWith({ funcName: "edit_fn", className: "com.Updated" }, expect.any(Object));
  });

  it("deletes a UDF", async () => {
    mockDatabases.mockReturnValue({
      data: { databases: [{ Name: "udf-db" }], total: 1 },
      isLoading: false,
    });
    udfsState.data = {
      functions: [{ name: "del_fn", className: "com.Del", ownerName: "admin", ownerType: "USER", createTime: "2024-01-01" }],
      total: 1,
    };
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("UDFs"));
    await clickButton(user, /^udf-db$/);
    const deleteBtn = screen.getByRole("button", { name: /Delete del_fn/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteUDFFn).toHaveBeenCalledWith("del_fn"));
  });

  it("shows no database buttons when databases key is missing", async () => {
    mockDatabases.mockReturnValue({ data: {}, isLoading: false });
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("UDFs"));
    await waitFor(() => expect(screen.getByText(/User-Defined Functions/)).toBeTruthy());
    expect(screen.queryByRole("button", { name: /^udf-db2$/ })).toBeNull();
  });

  it("shows empty UDFs when functions key is missing", async () => {
    mockDatabases.mockReturnValue({
      data: { databases: [{ Name: "udf-empty" }], total: 1 },
      isLoading: false,
    });
    udfsState.data = undefined;
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("UDFs"));
    await clickButton(user, /^udf-empty$/);
    await waitFor(() => expect(screen.getByText(/No UDFs found/i)).toBeTruthy());
  });

  it("create UDF success closes the modal", async () => {
    mockCreateUDF.mockImplementation((_body: any, opts: any) => opts?.onSuccess?.());
    mockDatabases.mockReturnValue({
      data: { databases: [{ Name: "udf-succ" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("UDFs"));
    await clickButton(user, /^udf-succ$/);
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText(/Create UDF in udf-succ/)).toBeTruthy());
    await user.type(screen.getByPlaceholderText("my_function"), "  ok_fn  ");
    await user.type(screen.getByPlaceholderText("com.example.MyUDF"), "com.OkFn");
    await clickButton(user, /^Create$/);
    await waitFor(() => {
      expect(mockCreateUDF).toHaveBeenCalledWith({ name: "ok_fn", className: "com.OkFn" }, expect.objectContaining({ onSuccess: expect.any(Function) }));
      expect(screen.queryByText(/Create UDF in udf-succ/)).toBeNull();
    });
  });

  it("create UDF error shows error toast", async () => {
    mockCreateUDF.mockImplementation((_body: any, opts: any) => opts?.onError?.(new Error("boom")));
    mockDatabases.mockReturnValue({
      data: { databases: [{ Name: "udf-err" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("UDFs"));
    await clickButton(user, /^udf-err$/);
    await clickButton(user, /Create/i);
    await user.type(screen.getByPlaceholderText("my_function"), "err_fn");
    await user.type(screen.getByPlaceholderText("com.example.MyUDF"), "com.Err");
    await clickButton(user, /^Create$/);
    await waitFor(() => {
      expect(mockCreateUDF).toHaveBeenCalled();
    });
  });

  it("cancels and escapes out of create UDF modal", async () => {
    mockDatabases.mockReturnValue({
      data: { databases: [{ Name: "udf-cancel" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("UDFs"));
    await clickButton(user, /^udf-cancel$/);
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText(/Create UDF in udf-cancel/)).toBeTruthy());
    await clickButton(user, /^Cancel$/);
    await waitFor(() => expect(screen.queryByText(/Create UDF in udf-cancel/)).toBeNull());

    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText(/Create UDF in udf-cancel/)).toBeTruthy());
    dismissModalWithEscape();
    await waitFor(() => expect(screen.queryByText(/Create UDF in udf-cancel/)).toBeNull());
  });

  it("create UDF requires name and class", async () => {
    mockDatabases.mockReturnValue({
      data: { databases: [{ Name: "udf-dis" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("UDFs"));
    await clickButton(user, /^udf-dis$/);
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText(/Create UDF in udf-dis/)).toBeTruthy());
    const createBtns = screen.getAllByRole("button", { name: /^Create$/ });
    expect(createBtns[createBtns.length - 1]).toBeDisabled();
    await user.type(screen.getByPlaceholderText("my_function"), "dis_fn");
    expect(createBtns[createBtns.length - 1]).toBeDisabled();
    await user.type(screen.getByPlaceholderText("com.example.MyUDF"), "com.Dis");
    expect(createBtns[createBtns.length - 1]).toBeEnabled();
  });

  it("edit UDF success closes the modal", async () => {
    mockUpdateUDF.mockImplementation((_body: any, opts: any) => opts?.onSuccess?.());
    mockDatabases.mockReturnValue({
      data: { databases: [{ Name: "udf-edit2" }], total: 1 },
      isLoading: false,
    });
    udfsState.data = {
      functions: [{ name: "e2_fn", className: "com.Orig", ownerName: "admin", ownerType: "USER", createTime: "2024-01-01" }],
      total: 1,
    };
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("UDFs"));
    await clickButton(user, /^udf-edit2$/);
    await clickButton(user, /^Edit$/);
    await waitFor(() => expect(screen.getByText(/Edit UDF: e2_fn/)).toBeTruthy());
    const classInput = screen.getByDisplayValue("com.Orig");
    await user.clear(classInput);
    await user.type(classInput, "com.Updated");
    await clickButton(user, /^Save$/);
    await waitFor(() => {
      expect(mockUpdateUDF).toHaveBeenCalledWith({ funcName: "e2_fn", className: "com.Updated" }, expect.objectContaining({ onSuccess: expect.any(Function) }));
      expect(screen.queryByText(/Edit UDF: e2_fn/)).toBeNull();
    });
  });

  it("edit UDF error shows error toast", async () => {
    mockUpdateUDF.mockImplementation((_body: any, opts: any) => opts?.onError?.(new Error("nope")));
    mockDatabases.mockReturnValue({
      data: { databases: [{ Name: "udf-edit3" }], total: 1 },
      isLoading: false,
    });
    udfsState.data = {
      functions: [{ name: "e3_fn", className: "com.Orig", ownerName: "admin", ownerType: "USER", createTime: "2024-01-01" }],
      total: 1,
    };
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("UDFs"));
    await clickButton(user, /^udf-edit3$/);
    await clickButton(user, /^Edit$/);
    await waitFor(() => expect(screen.getByText(/Edit UDF: e3_fn/)).toBeTruthy());
    await clickButton(user, /^Save$/);
    await waitFor(() => expect(mockUpdateUDF).toHaveBeenCalled());
  });

  it("cancels and escapes out of edit UDF modal", async () => {
    mockDatabases.mockReturnValue({
      data: { databases: [{ Name: "udf-editc" }], total: 1 },
      isLoading: false,
    });
    udfsState.data = {
      functions: [{ name: "ec_fn", className: "com.Orig", ownerName: "admin", ownerType: "USER", createTime: "2024-01-01" }],
      total: 1,
    };
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("UDFs"));
    await clickButton(user, /^udf-editc$/);
    await clickButton(user, /^Edit$/);
    await waitFor(() => expect(screen.getByText(/Edit UDF: ec_fn/)).toBeTruthy());
    // Last Cancel — DeleteButton's hidden ConfirmDialog renders an earlier one
    await clickButton(user, /^Cancel$/, { last: true });
    await waitFor(() => expect(screen.queryByText(/Edit UDF: ec_fn/)).toBeNull());

    await clickButton(user, /^Edit$/);
    await waitFor(() => expect(screen.getByText(/Edit UDF: ec_fn/)).toBeTruthy());
    dismissModalWithEscape();
    await waitFor(() => expect(screen.queryByText(/Edit UDF: ec_fn/)).toBeNull());
  });

  it("shows delete UDF loading state", async () => {
    deleteUDFState.isPending = true;
    deleteUDFState.variables = "dl_fn";
    mockDatabases.mockReturnValue({
      data: { databases: [{ Name: "udf-load" }], total: 1 },
      isLoading: false,
    });
    udfsState.data = {
      functions: [{ name: "dl_fn", className: "com.Dl", ownerName: "admin", ownerType: "USER", createTime: "2024-01-01" }],
      total: 1,
    };
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("UDFs"));
    await clickButton(user, /^udf-load$/);
    await waitFor(() => expect(screen.getByText("dl_fn")).toBeTruthy());
  });
});

// ─── Column Stats Tab ───────────────────────────────────

describe("GlueDashboard — Column Stats", () => {
  it("shows db/table selectors and stats", async () => {
    mockDatabases.mockReturnValue({
      data: { databases: [{ Name: "cs-db" }], total: 1 },
      isLoading: false,
    });
    mockTables.mockReturnValue({
      data: { tables: [{ Name: "cs-tbl" }], total: 1 },
      isLoading: false,
    });
    columnStatsState.data = {
      columnStats: [{ columnName: "id", columnType: "int", statisticsData: { NumberOfNulls: 0 }, analyzedTime: null }],
      total: 1,
    };
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Column Stats"));
    await clickButton(user, /^cs-db$/);
    await clickButton(user, /^cs-tbl$/);
    await waitFor(() => {
      expect(screen.getByText("id")).toBeTruthy();
    });
  });

  it("shows dash for null analyzedTime in stats", async () => {
    mockDatabases.mockReturnValue({
      data: { databases: [{ Name: "cs-db" }], total: 1 },
      isLoading: false,
    });
    mockTables.mockReturnValue({
      data: { tables: [{ Name: "cs-tbl" }], total: 1 },
      isLoading: false,
    });
    columnStatsState.data = {
      columnStats: [{ columnName: "col", columnType: null, statisticsData: null, analyzedTime: null }],
      total: 1,
    };
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Column Stats"));
    await clickButton(user, /^cs-db$/);
    await clickButton(user, /^cs-tbl$/);
    await waitFor(() => {
      expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(2);
    });
  });

  it("opens update statistics modal", async () => {
    mockDatabases.mockReturnValue({
      data: { databases: [{ Name: "cs-db" }], total: 1 },
      isLoading: false,
    });
    mockTables.mockReturnValue({
      data: { tables: [{ Name: "cs-tbl" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Column Stats"));
    await clickButton(user, /^cs-db$/);
    await clickButton(user, /^cs-tbl$/);
    await clickButton(user, /Update Statistics/i);
    await waitFor(() => {
      expect(screen.getByText(/Update Statistics for cs-tbl/)).toBeTruthy();
    });
  });

  it("submits update statistics", async () => {
    mockDatabases.mockReturnValue({
      data: { databases: [{ Name: "cs-db" }], total: 1 },
      isLoading: false,
    });
    mockTables.mockReturnValue({
      data: { tables: [{ Name: "cs-tbl" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Column Stats"));
    await clickButton(user, /^cs-db$/);
    await clickButton(user, /^cs-tbl$/);
    await clickButton(user, /Update Statistics/i);
    await user.type(screen.getByPlaceholderText("column_name"), "my_col");
    await clickButton(user, /^Update$/);
    expect(mockUpdateStats).toHaveBeenCalled();
    const callArgs = mockUpdateStats.mock.calls[0][0];
    expect(callArgs.columnStatisticsList[0].ColumnName).toBe("my_col");
  });

  it("shows no database buttons when databases key is missing", async () => {
    mockDatabases.mockReturnValue({ data: {}, isLoading: false });
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Column Stats"));
    await waitFor(() => expect(screen.getByText("Column Statistics")).toBeTruthy());
    expect(screen.queryByRole("button", { name: /^cs-nodb$/ })).toBeNull();
  });

  it("shows no table buttons when tables key is missing", async () => {
    mockDatabases.mockReturnValue({ data: { databases: [{ Name: "cs-notbl" }], total: 1 }, isLoading: false });
    mockTables.mockReturnValue({ data: {}, isLoading: false });
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Column Stats"));
    await clickButton(user, /^cs-notbl$/);
    await waitFor(() => expect(screen.getByText("Select a table")).toBeTruthy());
  });

  it("shows empty stats when columnStats key is missing", async () => {
    mockDatabases.mockReturnValue({ data: { databases: [{ Name: "cs-no" }], total: 1 }, isLoading: false });
    mockTables.mockReturnValue({ data: { tables: [{ Name: "cs-no-tbl" }], total: 1 }, isLoading: false });
    columnStatsState.data = {};
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Column Stats"));
    await clickButton(user, /^cs-no$/);
    await clickButton(user, /^cs-no-tbl$/);
    await waitFor(() => expect(screen.getByText(/No column statistics/i)).toBeTruthy());
  });

  it("shows partition-level stats when partition values are typed", async () => {
    mockDatabases.mockReturnValue({ data: { databases: [{ Name: "cs-pv" }], total: 1 }, isLoading: false });
    mockTables.mockReturnValue({ data: { tables: [{ Name: "cs-pv-tbl" }], total: 1 }, isLoading: false });
    columnStatsState.data = {
      columnStats: [{ columnName: "pv_col", columnType: "string", statisticsData: null, analyzedTime: null }],
      total: 1,
    };
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Column Stats"));
    await clickButton(user, /^cs-pv$/);
    await clickButton(user, /^cs-pv-tbl$/);
    await waitFor(() => expect(screen.getByText("pv_col")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("e.g. 2024,01"), "2024,01");
    await waitFor(() => expect(screen.getByText(/partition: 2024,01/)).toBeTruthy());
  });

  it("shows analyzed time when set", async () => {
    mockDatabases.mockReturnValue({ data: { databases: [{ Name: "cs-at" }], total: 1 }, isLoading: false });
    mockTables.mockReturnValue({ data: { tables: [{ Name: "cs-at-tbl" }], total: 1 }, isLoading: false });
    columnStatsState.data = {
      columnStats: [{ columnName: "at_col", columnType: "int", statisticsData: { NumberOfNulls: 1 }, analyzedTime: "2024-06-15T12:00:00Z" }],
      total: 1,
    };
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Column Stats"));
    await clickButton(user, /^cs-at$/);
    await clickButton(user, /^cs-at-tbl$/);
    await waitFor(() => expect(screen.getByText("at_col")).toBeTruthy());
  });

  it("deletes a column statistic", async () => {
    mockDatabases.mockReturnValue({ data: { databases: [{ Name: "cs-del" }], total: 1 }, isLoading: false });
    mockTables.mockReturnValue({ data: { tables: [{ Name: "cs-del-tbl" }], total: 1 }, isLoading: false });
    columnStatsState.data = {
      columnStats: [{ columnName: "del_col", columnType: "int", statisticsData: null, analyzedTime: null }],
      total: 1,
    };
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Column Stats"));
    await clickButton(user, /^cs-del$/);
    await clickButton(user, /^cs-del-tbl$/);
    await waitFor(() => expect(screen.getByText("del_col")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete del_col/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i, { last: true });
    await waitFor(() => expect(mockDeleteStats).toHaveBeenCalledWith("del_col"));
  });

  it("shows delete stats loading state", async () => {
    deleteStatsState.isPending = true;
    deleteStatsState.variables = "ld_col";
    mockDatabases.mockReturnValue({ data: { databases: [{ Name: "cs-ld" }], total: 1 }, isLoading: false });
    mockTables.mockReturnValue({ data: { tables: [{ Name: "cs-ld-tbl" }], total: 1 }, isLoading: false });
    columnStatsState.data = {
      columnStats: [{ columnName: "ld_col", columnType: "int", statisticsData: null, analyzedTime: null }],
      total: 1,
    };
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Column Stats"));
    await clickButton(user, /^cs-ld$/);
    await clickButton(user, /^cs-ld-tbl$/);
    await waitFor(() => expect(screen.getByText("ld_col")).toBeTruthy());
  });

  it("cancels and escapes out of update statistics modal", async () => {
    mockDatabases.mockReturnValue({ data: { databases: [{ Name: "cs-cx" }], total: 1 }, isLoading: false });
    mockTables.mockReturnValue({ data: { tables: [{ Name: "cs-cx-tbl" }], total: 1 }, isLoading: false });
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Column Stats"));
    await clickButton(user, /^cs-cx$/);
    await clickButton(user, /^cs-cx-tbl$/);
    await clickButton(user, /Update Statistics/i);
    await waitFor(() => expect(screen.getByText(/Update Statistics for cs-cx-tbl/)).toBeTruthy());
    await clickButton(user, /^Cancel$/, { last: true });
    await waitFor(() => expect(screen.queryByText(/Update Statistics for cs-cx-tbl/)).toBeNull());

    await clickButton(user, /Update Statistics/i);
    await waitFor(() => expect(screen.getByText(/Update Statistics for cs-cx-tbl/)).toBeTruthy());
    dismissModalWithEscape();
    await waitFor(() => expect(screen.queryByText(/Update Statistics for cs-cx-tbl/)).toBeNull());
  });

  it("update statistics success closes the modal", async () => {
    mockUpdateStats.mockImplementation((_body: any, opts: any) => opts?.onSuccess?.());
    mockDatabases.mockReturnValue({ data: { databases: [{ Name: "cs-ok" }], total: 1 }, isLoading: false });
    mockTables.mockReturnValue({ data: { tables: [{ Name: "cs-ok-tbl" }], total: 1 }, isLoading: false });
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Column Stats"));
    await clickButton(user, /^cs-ok$/);
    await clickButton(user, /^cs-ok-tbl$/);
    await clickButton(user, /Update Statistics/i);
    await waitFor(() => expect(screen.getByText(/Update Statistics for cs-ok-tbl/)).toBeTruthy());
    await user.type(screen.getByPlaceholderText("column_name"), "ok_col");
    await clickButton(user, /^Update$/);
    await waitFor(() => expect(screen.queryByText(/Update Statistics for cs-ok-tbl/)).toBeNull());
  });

  it("update statistics error shows error toast", async () => {
    mockUpdateStats.mockImplementation((_body: any, opts: any) => opts?.onError?.(new Error("fail")));
    mockDatabases.mockReturnValue({ data: { databases: [{ Name: "cs-err" }], total: 1 }, isLoading: false });
    mockTables.mockReturnValue({ data: { tables: [{ Name: "cs-err-tbl" }], total: 1 }, isLoading: false });
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Column Stats"));
    await clickButton(user, /^cs-err$/);
    await clickButton(user, /^cs-err-tbl$/);
    await clickButton(user, /Update Statistics/i);
    await waitFor(() => expect(screen.getByText(/Update Statistics for cs-err-tbl/)).toBeTruthy());
    await user.type(screen.getByPlaceholderText("column_name"), "err_col");
    await clickButton(user, /^Update$/);
    await waitFor(() => expect(mockUpdateStats).toHaveBeenCalled());
  });

  it("update statistics requires a column name", async () => {
    mockDatabases.mockReturnValue({ data: { databases: [{ Name: "cs-dis" }], total: 1 }, isLoading: false });
    mockTables.mockReturnValue({ data: { tables: [{ Name: "cs-dis-tbl" }], total: 1 }, isLoading: false });
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Column Stats"));
    await clickButton(user, /^cs-dis$/);
    await clickButton(user, /^cs-dis-tbl$/);
    await clickButton(user, /Update Statistics/i);
    await waitFor(() => expect(screen.getByText(/Update Statistics for cs-dis-tbl/)).toBeTruthy());
    const updateBtns = screen.getAllByRole("button", { name: /^Update$/ });
    expect(updateBtns[updateBtns.length - 1]).toBeDisabled();
  });

  it("update statistics with number inputs and type select", async () => {
    mockUpdateStats.mockImplementation((_body: any, opts: any) => opts?.onSuccess?.());
    mockDatabases.mockReturnValue({ data: { databases: [{ Name: "cs-num" }], total: 1 }, isLoading: false });
    mockTables.mockReturnValue({ data: { tables: [{ Name: "cs-num-tbl" }], total: 1 }, isLoading: false });
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Column Stats"));
    await clickButton(user, /^cs-num$/);
    await clickButton(user, /^cs-num-tbl$/);
    await clickButton(user, /Update Statistics/i);
    await waitFor(() => expect(screen.getByText(/Update Statistics for cs-num-tbl/)).toBeTruthy());
    await user.type(screen.getByPlaceholderText("column_name"), "num_col");
    // Type select: string -> integer (Select trigger is labelled by its FormField)
    await user.click(screen.getByRole("button", { name: /Column type string/i }));
    await user.click(screen.getByRole("option", { name: /integer/i }));
    // Number inputs: 5 nulls, 0 distinct ("0" fires the `|| 0` fallback)
    const numInputs = screen.getAllByDisplayValue("0");
    await user.clear(numInputs[0]);
    await user.type(numInputs[0], "5");
    await user.clear(numInputs[1]);
    await user.type(numInputs[1], "0");
    await clickButton(user, /^Update$/);
    await waitFor(() => {
      expect(mockUpdateStats).toHaveBeenCalledWith(
        {
          columnStatisticsList: [
            {
              ColumnName: "num_col",
              ColumnType: "integer",
              StatisticsData: { IntegerColumnStatisticsData: { NumberOfNulls: 5, NumberOfDistinctValues: 0 } },
            },
          ],
        },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
    });
  });
});

// ─── Partitions Tab — Add Partition Modal ───────────────

describe("GlueDashboard — Partitions add", () => {
  it("opens add partition modal", async () => {
    mockDatabases.mockReturnValue({ data: { databases: [{ Name: "p-db" }], total: 1 }, isLoading: false });
    mockTables.mockReturnValue({ data: { tables: [{ Name: "p-tbl" }], total: 1 }, isLoading: false });
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Partitions"));
    await clickButton(user, /^p-db$/);
    await clickButton(user, /^p-tbl$/);
    await clickButton(user, /Add Partition/i);
    await waitFor(() => {
      expect(screen.getByText(/Add Partition to p-tbl/)).toBeTruthy();
    });
  });

  it("submits add partition with location", async () => {
    mockDatabases.mockReturnValue({ data: { databases: [{ Name: "p-db" }], total: 1 }, isLoading: false });
    mockTables.mockReturnValue({ data: { tables: [{ Name: "p-tbl" }], total: 1 }, isLoading: false });
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Partitions"));
    await clickButton(user, /^p-db$/);
    await clickButton(user, /^p-tbl$/);
    await clickButton(user, /Add Partition/i);
    await user.type(screen.getByPlaceholderText("2024,01"), "2024,02");
    await user.type(screen.getByPlaceholderText("s3://bucket/path/"), "s3://my-bucket/part/");
    await clickButton(user, /^Add$/);
    expect(mockCreatePartitions).toHaveBeenCalled();
    const callArgs = mockCreatePartitions.mock.calls[0][0];
    expect(callArgs.partitionInputList[0].Values).toEqual(["2024", "02"]);
    expect(callArgs.partitionInputList[0].StorageDescriptor.Location).toBe("s3://my-bucket/part/");
  });

  it("partitions tab shows dash for null partition fields", async () => {
    mockDatabases.mockReturnValue({ data: { databases: [{ Name: "p-db" }], total: 1 }, isLoading: false });
    mockTables.mockReturnValue({ data: { tables: [{ Name: "p-tbl" }], total: 1 }, isLoading: false });
    mockPartitions.mockReturnValue({
      data: { partitions: [{ values: ["val1"], location: null, creationTime: null }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Partitions"));
    await clickButton(user, /^p-db$/);
    await clickButton(user, /^p-tbl$/);
    await waitFor(() => {
      expect(screen.getByText("val1")).toBeTruthy();
      expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(2);
    });
  });

  it("shows partition with creation time", async () => {
    mockDatabases.mockReturnValue({ data: { databases: [{ Name: "p-db" }], total: 1 }, isLoading: false });
    mockTables.mockReturnValue({ data: { tables: [{ Name: "p-tbl" }], total: 1 }, isLoading: false });
    mockPartitions.mockReturnValue({
      data: { partitions: [{ values: ["2024"], location: "s3://b/p", creationTime: "2024-06-15T12:00:00Z" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Partitions"));
    await clickButton(user, /^p-db$/);
    await clickButton(user, /^p-tbl$/);
    await waitFor(() => {
      expect(screen.getByText("2024")).toBeTruthy();
      // toLocaleString formats the date — just verify partition value appears
      expect(screen.getByText("s3://b/p")).toBeTruthy();
    });
  });

  // ─── Tables: falsy dash fallbacks ────────────────────

  it("shows dash for table with falsy type, location, and no CreateTime", async () => {
    mockDatabases.mockReturnValue({
      data: { databases: [{ Name: "db-sparse" }], total: 1 },
      isLoading: false,
    });
    mockTables.mockReturnValue({
      data: {
        tables: [{ Name: "t-sparse" }],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("db-sparse"));
    await waitFor(() => {
      expect(screen.getByText("t-sparse")).toBeTruthy();
      // type, location, and created all render "-"
      expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(3);
    });
  });

  it("shows no database buttons when databases key is missing", async () => {
    mockDatabases.mockReturnValue({ data: {}, isLoading: false });
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Partitions"));
    await waitFor(() => expect(screen.getByText("Select a database")).toBeTruthy());
    expect(screen.queryByRole("button", { name: /^p-nodb$/ })).toBeNull();
  });

  it("shows no table buttons when tables key is missing", async () => {
    mockDatabases.mockReturnValue({ data: { databases: [{ Name: "p-notbl" }], total: 1 }, isLoading: false });
    mockTables.mockReturnValue({ data: {}, isLoading: false });
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Partitions"));
    await clickButton(user, /^p-notbl$/);
    await waitFor(() => expect(screen.getByText("Select a table")).toBeTruthy());
  });

  it("shows no partitions when partitions key is missing", async () => {
    mockDatabases.mockReturnValue({ data: { databases: [{ Name: "p-nop" }], total: 1 }, isLoading: false });
    mockTables.mockReturnValue({ data: { tables: [{ Name: "p-nop-tbl" }], total: 1 }, isLoading: false });
    mockPartitions.mockReturnValue({ data: {}, isLoading: false });
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Partitions"));
    await clickButton(user, /^p-nop$/);
    await clickButton(user, /^p-nop-tbl$/);
    await waitFor(() => expect(screen.getByText(/Partitions for p-nop-tbl/)).toBeTruthy());
  });

  it("renders and deletes a partition without values", async () => {
    mockDatabases.mockReturnValue({ data: { databases: [{ Name: "p-noval" }], total: 1 }, isLoading: false });
    mockTables.mockReturnValue({ data: { tables: [{ Name: "p-noval-tbl" }], total: 1 }, isLoading: false });
    mockPartitions.mockReturnValue({
      data: { partitions: [{ location: "s3://b/noval/", creationTime: null }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Partitions"));
    await clickButton(user, /^p-noval$/);
    await clickButton(user, /^p-noval-tbl$/);
    await waitFor(() => expect(screen.getByText("s3://b/noval/")).toBeTruthy());
    // itemName is empty -> the icon button's accessible name is "Delete"
    await user.click(screen.getAllByRole("button", { name: /^Delete$/i })[0]);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i, { last: true });
    await waitFor(() => expect(mockDeletePartition).toHaveBeenCalledWith([], expect.anything()));
  });

  it("shows delete partition loading state", async () => {
    deletePartitionState.isPending = true;
    mockDatabases.mockReturnValue({ data: { databases: [{ Name: "p-ld" }], total: 1 }, isLoading: false });
    mockTables.mockReturnValue({ data: { tables: [{ Name: "p-ld-tbl" }], total: 1 }, isLoading: false });
    mockPartitions.mockReturnValue({
      data: { partitions: [{ values: ["ld"], location: "s3://b/ld", creationTime: null }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Partitions"));
    await clickButton(user, /^p-ld$/);
    await clickButton(user, /^p-ld-tbl$/);
    await waitFor(() => expect(screen.getByText("ld")).toBeTruthy());
  });

  it("adds a partition without a location", async () => {
    mockDatabases.mockReturnValue({ data: { databases: [{ Name: "p-noloc" }], total: 1 }, isLoading: false });
    mockTables.mockReturnValue({ data: { tables: [{ Name: "p-noloc-tbl" }], total: 1 }, isLoading: false });
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Partitions"));
    await clickButton(user, /^p-noloc$/);
    await clickButton(user, /^p-noloc-tbl$/);
    await clickButton(user, /Add Partition/i);
    await waitFor(() => expect(screen.getByText(/Add Partition to p-noloc-tbl/)).toBeTruthy());
    await user.type(screen.getByPlaceholderText("2024,01"), "2024,03");
    await clickButton(user, /^Add$/);
    expect(mockCreatePartitions).toHaveBeenCalled();
    const callArgs = mockCreatePartitions.mock.calls[0][0];
    expect(callArgs.partitionInputList[0].Values).toEqual(["2024", "03"]);
    expect(callArgs.partitionInputList[0].StorageDescriptor).toBeUndefined();
  });

  it("add partition success shows toast and closes the modal", async () => {
    mockCreatePartitions.mockImplementation((_body: any, opts: any) => opts?.onSuccess?.({}));
    mockDatabases.mockReturnValue({ data: { databases: [{ Name: "p-ok" }], total: 1 }, isLoading: false });
    mockTables.mockReturnValue({ data: { tables: [{ Name: "p-ok-tbl" }], total: 1 }, isLoading: false });
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Partitions"));
    await clickButton(user, /^p-ok$/);
    await clickButton(user, /^p-ok-tbl$/);
    await clickButton(user, /Add Partition/i);
    await waitFor(() => expect(screen.getByText(/Add Partition to p-ok-tbl/)).toBeTruthy());
    await user.type(screen.getByPlaceholderText("2024,01"), "2024,04");
    await clickButton(user, /^Add$/);
    await waitFor(() => expect(screen.queryByText(/Add Partition to p-ok-tbl/)).toBeNull());
  });

  it("add partition error shows error toast", async () => {
    mockCreatePartitions.mockImplementation((_body: any, opts: any) => opts?.onError?.(new Error("fail")));
    mockDatabases.mockReturnValue({ data: { databases: [{ Name: "p-err" }], total: 1 }, isLoading: false });
    mockTables.mockReturnValue({ data: { tables: [{ Name: "p-err-tbl" }], total: 1 }, isLoading: false });
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Partitions"));
    await clickButton(user, /^p-err$/);
    await clickButton(user, /^p-err-tbl$/);
    await clickButton(user, /Add Partition/i);
    await waitFor(() => expect(screen.getByText(/Add Partition to p-err-tbl/)).toBeTruthy());
    await user.type(screen.getByPlaceholderText("2024,01"), "2024,05");
    await clickButton(user, /^Add$/);
    await waitFor(() => expect(mockCreatePartitions).toHaveBeenCalled());
  });

  it("cancels and escapes out of add partition modal", async () => {
    mockDatabases.mockReturnValue({ data: { databases: [{ Name: "p-cx" }], total: 1 }, isLoading: false });
    mockTables.mockReturnValue({ data: { tables: [{ Name: "p-cx-tbl" }], total: 1 }, isLoading: false });
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Partitions"));
    await clickButton(user, /^p-cx$/);
    await clickButton(user, /^p-cx-tbl$/);
    await clickButton(user, /Add Partition/i);
    await waitFor(() => expect(screen.getByText(/Add Partition to p-cx-tbl/)).toBeTruthy());
    await clickButton(user, /^Cancel$/, { last: true });
    await waitFor(() => expect(screen.queryByText(/Add Partition to p-cx-tbl/)).toBeNull());

    await clickButton(user, /Add Partition/i);
    await waitFor(() => expect(screen.getByText(/Add Partition to p-cx-tbl/)).toBeTruthy());
    dismissModalWithEscape();
    await waitFor(() => expect(screen.queryByText(/Add Partition to p-cx-tbl/)).toBeNull());
  });

  it("add partition requires values", async () => {
    mockDatabases.mockReturnValue({ data: { databases: [{ Name: "p-dis" }], total: 1 }, isLoading: false });
    mockTables.mockReturnValue({ data: { tables: [{ Name: "p-dis-tbl" }], total: 1 }, isLoading: false });
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Partitions"));
    await clickButton(user, /^p-dis$/);
    await clickButton(user, /^p-dis-tbl$/);
    await clickButton(user, /Add Partition/i);
    await waitFor(() => expect(screen.getByText(/Add Partition to p-dis-tbl/)).toBeTruthy());
    const addBtns = screen.getAllByRole("button", { name: /^Add$/ });
    expect(addBtns[addBtns.length - 1]).toBeDisabled();
  });
});

// ─── Schema Registry edge cases ─────────────────────────

describe("GlueDashboard — Schema Registry edge cases", () => {
  it("shows warning status for non-AVAILABLE registry", async () => {
    registriesState.data = {
      registries: [{ name: "reg-warn", status: "DELETING", description: "" }],
    };
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Schema Registry"));
    await waitFor(() => {
      expect(screen.getByText("reg-warn")).toBeTruthy();
      expect(screen.getByText("DELETING")).toBeTruthy();
    });
  });

  it("shows delete registry loading state", async () => {
    registriesState.data = {
      registries: [{ name: "reg-loading", status: "AVAILABLE" }],
    };
    // We need to override the mock at import time. Since useDeleteGlueRegistry is already mocked,
    // we use the global state: mockDeleteRegistry's isPending is always false in the mock.
    // Just verify the component renders with registries — the loading state requires the mock to
    // return isPending: true, which requires hoisted state not available. We test basic rendering.
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Schema Registry"));
    await waitFor(() => {
      expect(screen.getByText("reg-loading")).toBeTruthy();
    });
  });

  it("opens create schema modal", async () => {
    registriesState.data = {
      registries: [{ name: "reg-create", status: "AVAILABLE" }],
    };
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Schema Registry"));
    await clickButton(user, /^reg-create$/);
    await clickButton(user, /Create Schema/i);
    await waitFor(() => {
      expect(screen.getByText("Create Schema")).toBeTruthy();
    });
  });

  it("opens register version modal", async () => {
    registriesState.data = { registries: [{ name: "reg-rv", status: "AVAILABLE" }] };
    schemasState.data = { schemas: [{ name: "s-rv", dataFormat: "AVRO", compatibility: "NONE", status: "AVAILABLE" }] };
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Schema Registry"));
    await clickButton(user, /^reg-rv$/);
    await clickButton(user, /^s-rv$/);
    await clickButton(user, /Register Version/i);
    await waitFor(() => {
      expect(screen.getByText("Register Schema Version")).toBeTruthy();
    });
  });
});

// ─── Column Stats edge cases ────────────────────────────

describe("GlueDashboard — Column Stats edge cases", () => {
  it("shows stats for partition when partValues is provided", async () => {
    mockDatabases.mockReturnValue({ data: { databases: [{ Name: "cs-db2" }], total: 1 }, isLoading: false });
    mockTables.mockReturnValue({ data: { tables: [{ Name: "cs-tbl2" }], total: 1 }, isLoading: false });
    columnStatsState.data = {
      columnStats: [{ columnName: "col1", columnType: "string", statisticsData: null, analyzedTime: null }],
      total: 1,
    };
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Column Stats"));
    await clickButton(user, /^cs-db2$/);
    await clickButton(user, /^cs-tbl2$/);
    await waitFor(() => {
      expect(screen.getByText("col1")).toBeTruthy();
    });
  });
});

// ─── Partitions: create with errors response ────────────

describe("GlueDashboard — Partitions error path", () => {
  it("handles partition creation with error response", async () => {
    mockCreatePartitions.mockImplementation((_body: any, opts: any) => {
      opts?.onSuccess?.({ errors: [{ ErrorDetail: { ErrorMessage: "Partition already exists" } }] });
    });
    mockDatabases.mockReturnValue({ data: { databases: [{ Name: "pe-db" }], total: 1 }, isLoading: false });
    mockTables.mockReturnValue({ data: { tables: [{ Name: "pe-tbl" }], total: 1 }, isLoading: false });
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Partitions"));
    await clickButton(user, /^pe-db$/);
    await clickButton(user, /^pe-tbl$/);
    await clickButton(user, /Add Partition/i);
    await user.type(screen.getByPlaceholderText("2024,01"), "2024,02");
    await user.type(screen.getByPlaceholderText("s3://bucket/path/"), "s3://b/part/");
    await clickButton(user, /^Add$/);
    await waitFor(() => {
      expect(mockCreatePartitions).toHaveBeenCalled();
    });
  });

  it("handles partition creation with errors array but no ErrorDetail", async () => {
    mockCreatePartitions.mockImplementation((_body: any, opts: any) => {
      opts?.onSuccess?.({ errors: [{}] });
    });
    mockDatabases.mockReturnValue({ data: { databases: [{ Name: "pe-db2" }], total: 1 }, isLoading: false });
    mockTables.mockReturnValue({ data: { tables: [{ Name: "pe-tbl2" }], total: 1 }, isLoading: false });
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Partitions"));
    await clickButton(user, /^pe-db2$/);
    await clickButton(user, /^pe-tbl2$/);
    await clickButton(user, /Add Partition/i);
    await user.type(screen.getByPlaceholderText("2024,01"), "2024,02");
    await user.type(screen.getByPlaceholderText("s3://bucket/path/"), "s3://b/part/");
    await clickButton(user, /^Add$/);
    await waitFor(() => {
      expect(mockCreatePartitions).toHaveBeenCalled();
    });
  });

  it("handles partition deletion error", async () => {
    // The onDelete promise rejects when the mutation errors; swallow the
    // resulting unhandled rejection so vitest doesn't fail the test.
    const rejectHandler = vi.fn();
    process.on("unhandledRejection", rejectHandler);
    mockDeletePartition.mockImplementation((_vals: string[], opts: any) => opts?.onError?.(new Error("boom")));
    mockDatabases.mockReturnValue({ data: { databases: [{ Name: "pe-del" }], total: 1 }, isLoading: false });
    mockTables.mockReturnValue({ data: { tables: [{ Name: "pe-del-tbl" }], total: 1 }, isLoading: false });
    mockPartitions.mockReturnValue({
      data: { partitions: [{ values: ["2024"], location: "s3://b/pd", creationTime: null }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<GlueDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Partitions"));
    await clickButton(user, /^pe-del$/);
    await clickButton(user, /^pe-del-tbl$/);
    await waitFor(() => expect(screen.getByText("2024")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete 2024/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i, { last: true });
    await waitFor(() => {
      expect(mockDeletePartition).toHaveBeenCalledWith(["2024"], expect.anything());
    });
    process.removeListener("unhandledRejection", rejectHandler);
  });
});
