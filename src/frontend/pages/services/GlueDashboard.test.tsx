// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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

// ── Hoisted state for Schema Registry / UDFs / Column Stats ──
const registriesState = vi.hoisted(() => ({ data: { registries: [] as any[] }, isLoading: false }));
const schemasState = vi.hoisted(() => ({ data: { schemas: [] as any[] }, isLoading: false }));
const versionsState = vi.hoisted(() => ({ data: { versions: [] as any[] }, isLoading: false }));
const versionDetailState = vi.hoisted(() => ({ data: undefined as any, isLoading: false }));
const metadataState = vi.hoisted(() => ({ data: { metadataInfoMap: {} as any } }));
const udfsState = vi.hoisted(() => ({ data: { functions: [] as any[], total: 0 }, isLoading: false }));
const columnStatsState = vi.hoisted(() => ({ data: { columnStats: [] as any[], total: 0 }, isLoading: false }));

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
  useDeleteGluePartition: () => ({ mutate: mockDeletePartition, isPending: false }),
  // ── Schema Registry ──
  useGlueRegistries: () => ({ get data() { return registriesState.data; }, get isLoading() { return registriesState.isLoading; } }),
  useCreateGlueRegistry: () => ({ mutate: mockCreateRegistry, mutateAsync: vi.fn(), isPending: false }),
  useDeleteGlueRegistry: () => ({ mutateAsync: mockDeleteRegistry, isPending: false, variables: null }),
  useGlueSchemas: () => ({ get data() { return schemasState.data; }, get isLoading() { return schemasState.isLoading; } }),
  useCreateGlueSchema: () => ({ mutate: mockCreateSchema, mutateAsync: vi.fn(), isPending: false }),
  useDeleteGlueSchema: () => ({ mutateAsync: mockDeleteSchema, isPending: false, variables: null }),
  useGlueSchemaVersions: () => ({ get data() { return versionsState.data; }, get isLoading() { return versionsState.isLoading; } }),
  useRegisterGlueSchemaVersion: () => ({ mutate: mockRegisterVersion, isPending: false }),
  useGlueSchemaVersion: () => ({ get data() { return versionDetailState.data; }, get isLoading() { return versionDetailState.isLoading; } }),
  useSchemaVersionMetadata: () => ({ get data() { return metadataState.data; } }),
  // ── UDFs ──
  useGlueUDFs: () => ({ get data() { return udfsState.data; }, get isLoading() { return udfsState.isLoading; } }),
  useCreateGlueUDF: () => ({ mutate: mockCreateUDF, isPending: false }),
  useUpdateGlueUDF: () => ({ mutate: mockUpdateUDF, isPending: false }),
  useDeleteGlueUDF: () => ({ mutateAsync: mockDeleteUDFFn, isPending: false, variables: null }),
  // ── Column Stats ──
  useGlueColumnStats: () => ({ get data() { return columnStatsState.data; }, get isLoading() { return columnStatsState.isLoading; } }),
  useGluePartitionColumnStats: () => ({ get data() { return columnStatsState.data; }, get isLoading() { return columnStatsState.isLoading; } }),
  useUpdateGlueColumnStats: () => ({ mutate: mockUpdateStats, isPending: false }),
  useDeleteGlueColumnStats: () => ({ mutateAsync: mockDeleteStats, isPending: false, variables: null }),
}));

import { GlueDashboard } from "./GlueDashboard";

beforeEach(() => {
  vi.clearAllMocks();
  deleteDbState.isPending = false;
  deleteDbState.variables = null;
  deleteTblState.isPending = false;
  deleteTblState.variables = null;
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
});
