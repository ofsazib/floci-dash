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

const deleteDbState = vi.hoisted(() => ({ isPending: false, variables: null as string | null }));
const deleteTblState = vi.hoisted(() => ({ isPending: false, variables: null as string | null }));

vi.mock("../../hooks/useGlue", () => ({
  useGlueDatabases: (...args: any[]) => mockDatabases(...args),
  useDeleteGlueDatabase: () => ({ mutateAsync: mockDeleteDb, isPending: deleteDbState.isPending, variables: deleteDbState.variables }),
  useGlueTables: (...args: any[]) => mockTables(...args),
  useDeleteGlueTable: (dbName: string) => ({ mutateAsync: mockDeleteTable, isPending: deleteTblState.isPending, variables: deleteTblState.variables }),
}));

import { GlueDashboard } from "./GlueDashboard";

beforeEach(() => {
  vi.clearAllMocks();
  deleteDbState.isPending = false;
  deleteDbState.variables = null;
  deleteTblState.isPending = false;
  deleteTblState.variables = null;
  mockDatabases.mockReturnValue({ data: { databases: [], total: 0 }, isLoading: false });
  mockTables.mockReturnValue({ data: { tables: [], total: 0 }, isLoading: false });
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
});
