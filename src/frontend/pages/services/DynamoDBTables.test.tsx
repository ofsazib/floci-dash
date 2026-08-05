// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { createWrapper } from "../../../test/helpers";
import React from "react";
import userEvent from "@testing-library/user-event";

const mockTables = vi.fn();
const mockCreateTableMutate = vi.fn();
const mockDeleteTableMutateAsync = vi.fn();

const deleteTableState = vi.hoisted(() => ({ isPending: false, variables: null as string | null }));
const createTableState = vi.hoisted(() => ({ isPending: false, isError: false, error: null as Error | null }));

vi.mock("../../hooks/useDynamoDB", () => ({
  useDynamoDBTables: (...args: any[]) => mockTables(...args),
  useDynamoDBCreateTable: () => ({ mutate: mockCreateTableMutate, ...createTableState }),
  useDynamoDBDeleteTable: () => ({ mutateAsync: mockDeleteTableMutateAsync, ...deleteTableState }),
}));

vi.mock("../../components/DeleteButton", () => ({
  default: ({ onDelete, itemName }: any) =>
    React.createElement(
      "button",
      { "data-testid": "delete-button", onClick: onDelete },
      `Delete ${itemName}`,
    ),
}));

vi.mock("../../components/Toast", () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

import { DynamoDBTables } from "./DynamoDBTables";

beforeEach(() => {
  vi.clearAllMocks();
  deleteTableState.isPending = false;
  deleteTableState.variables = null;
  createTableState.isPending = false;
  createTableState.isError = false;
  createTableState.error = null;
  mockTables.mockReturnValue({
    data: { tables: ["my-table", "other-table"], total: 2 },
    isLoading: false,
    isError: false,
    error: null,
  });
});

describe("DynamoDBTables — render states", () => {
  it("renders tables from data", () => {
    render(<DynamoDBTables />, { wrapper: createWrapper() });
    expect(screen.getByText("my-table")).toBeTruthy();
    expect(screen.getByText("other-table")).toBeTruthy();
    expect(screen.getByText("(2)")).toBeTruthy();
  });

  it("shows empty state when no tables", () => {
    mockTables.mockReturnValue({
      data: { tables: [], total: 0 },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<DynamoDBTables />, { wrapper: createWrapper() });
    expect(screen.getByText("No tables found")).toBeTruthy();
  });

  it("shows loading state", () => {
    mockTables.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });
    render(<DynamoDBTables />, { wrapper: createWrapper() });
    expect(screen.getByText("Loading resources...")).toBeTruthy();
  });

  it("shows error state", () => {
    mockTables.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("Failed to load tables"),
    });
    render(<DynamoDBTables />, { wrapper: createWrapper() });
    expect(screen.getByText("Failed to load tables")).toBeTruthy();
  });
});

describe("DynamoDBTables — create modal", () => {
  it("opens create modal when Create is clicked", async () => {
    const user = userEvent.setup();
    render(<DynamoDBTables />, { wrapper: createWrapper() });
    const createButtons = screen.getAllByRole("button", { name: /Create Table/i });
    await user.click(createButtons[0]);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("my-table")).toBeTruthy();
    });
    expect(screen.getByText("Create DynamoDB table")).toBeTruthy();
  });

  it("fills form and creates table", async () => {
    const user = userEvent.setup();
    render(<DynamoDBTables />, { wrapper: createWrapper() });
    const createButtons = screen.getAllByRole("button", { name: /Create Table/i });
    await user.click(createButtons[0]);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("my-table")).toBeTruthy();
    });
    await user.type(screen.getByPlaceholderText("my-table"), "test-table");
    await user.type(screen.getByPlaceholderText("pk"), "id");
    const submit = screen.getAllByRole("button", { name: /Create table/i });
    await user.click(submit[submit.length - 1]);
    expect(mockCreateTableMutate).toHaveBeenCalledWith(
      expect.objectContaining({ name: "test-table", hashKey: "id" }),
      expect.any(Object)
    );
  });

  it("disables create button when name is empty", async () => {
    const user = userEvent.setup();
    render(<DynamoDBTables />, { wrapper: createWrapper() });
    const createButtons = screen.getAllByRole("button", { name: /Create Table/i });
    await user.click(createButtons[0]);
    await waitFor(() => {
      expect(screen.getByText("Create table")).toBeTruthy();
    });
    const modalCreateBtns = screen.getAllByRole("button", { name: /Create table/i });
    expect(modalCreateBtns[modalCreateBtns.length - 1]).toHaveProperty("disabled", true);
  });
});

describe("DynamoDBTables — delete", () => {
  it("calls deleteTable.mutateAsync with table name", async () => {
    const user = userEvent.setup();
    render(<DynamoDBTables />, { wrapper: createWrapper() });
    // DeleteButton renders as a button with "Delete my-table" text
    const deleteBtn = screen.getByText("Delete my-table");
    await user.click(deleteBtn);
    await waitFor(() => {
      expect(mockDeleteTableMutateAsync).toHaveBeenCalledWith("my-table");
    });
  });
});

describe("DynamoDBTables — filter", () => {
  it("filters tables by search term", async () => {
    const user = userEvent.setup();
    render(<DynamoDBTables />, { wrapper: createWrapper() });
    expect(screen.getByText("my-table")).toBeTruthy();
    expect(screen.getByText("other-table")).toBeTruthy();

    const filterInput = screen.getByPlaceholderText("Find tables by name");
    await user.type(filterInput, "my-table");

    await waitFor(() => {
      expect(screen.getByText("my-table")).toBeTruthy();
      expect(screen.queryByText("other-table")).toBeNull();
    });
  });
});

// ─── Error & edge cases ─────────────────────────────────

describe("DynamoDBTables — error fallbacks", () => {
  it("shows generic error when isError true with null error", () => {
    mockTables.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: null,
    });
    render(<DynamoDBTables />, { wrapper: createWrapper() });
    expect(screen.getByText("Failed to load tables")).toBeTruthy();
  });

  it("shows create error alert with message", async () => {
    const user = userEvent.setup();
    createTableState.isError = true;
    createTableState.error = new Error("Table already exists");
    render(<DynamoDBTables />, { wrapper: createWrapper() });
    const createButtons = screen.getAllByRole("button", { name: /Create Table/i });
    await user.click(createButtons[0]);
    await waitFor(() => {
      expect(screen.getByText("Table already exists")).toBeTruthy();
    });
  });

  it("shows generic create error when isError true with null error", async () => {
    const user = userEvent.setup();
    createTableState.isError = true;
    createTableState.error = null;
    render(<DynamoDBTables />, { wrapper: createWrapper() });
    const createButtons = screen.getAllByRole("button", { name: /Create Table/i });
    await user.click(createButtons[0]);
    await waitFor(() => {
      expect(screen.getByText("Failed to create table")).toBeTruthy();
    });
  });
});

// ─── Create with range key ──────────────────────────────

describe("DynamoDBTables — create with range key", () => {
  it("fills range key and submits with rangeKey in payload", async () => {
    const user = userEvent.setup();
    render(<DynamoDBTables />, { wrapper: createWrapper() });
    const createButtons = screen.getAllByRole("button", { name: /Create Table/i });
    await user.click(createButtons[0]);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("my-table")).toBeTruthy();
    });
    await user.type(screen.getByPlaceholderText("my-table"), "test-table");
    await user.type(screen.getByPlaceholderText("pk"), "id");
    await user.type(screen.getByPlaceholderText("sk"), "sortKey");
    const submit = screen.getAllByRole("button", { name: /Create table/i });
    await user.click(submit[submit.length - 1]);
    expect(mockCreateTableMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "test-table",
        hashKey: "id",
        rangeKey: "sortKey",
      }),
      expect.any(Object)
    );
  });
});

// ─── Delete loading state ───────────────────────────────

describe("DynamoDBTables — delete loading", () => {
  it("renders delete buttons when isPending with matching variables", () => {
    deleteTableState.isPending = true;
    deleteTableState.variables = "my-table";
    render(<DynamoDBTables />, { wrapper: createWrapper() });
    expect(screen.getByText("my-table")).toBeTruthy();
    // Two tables = two delete buttons
    expect(screen.getAllByTestId("delete-button")).toHaveLength(2);
  });

  it("renders delete buttons when isPending with non-matching variables", () => {
    deleteTableState.isPending = true;
    deleteTableState.variables = "other-table";
    render(<DynamoDBTables />, { wrapper: createWrapper() });
    expect(screen.getByText("my-table")).toBeTruthy();
    expect(screen.getAllByTestId("delete-button")).toHaveLength(2);
  });
});
