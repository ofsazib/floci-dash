// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
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

const mockPolicy = vi.fn();
const mockPutPolicy = vi.fn().mockResolvedValue({});
const mockDeletePolicy = vi.fn().mockResolvedValue({});
const mockImports = vi.fn();
const mockDescribeImport = vi.fn();

vi.mock("../../hooks/useDynamoDBAdvanced", () => ({
  useDynamoDBResourcePolicy: (...args: any[]) => mockPolicy(...args),
  useDynamoDBPutResourcePolicy: () => ({ mutateAsync: mockPutPolicy, isPending: false }),
  useDynamoDBDeleteResourcePolicy: () => ({ mutateAsync: mockDeletePolicy, isPending: false }),
  useDynamoDBImports: (...args: any[]) => mockImports(...args),
  useDynamoDBDescribeImport: (...args: any[]) => mockDescribeImport(...args),
}));

vi.mock("../../components/DeleteButton", () => ({
  default: ({ onDelete, itemName }: any) =>
    React.createElement(
      "button",
      { "data-testid": "delete-button", onClick: onDelete },
      `Delete ${itemName}`,
    ),
}));

vi.mock("../../components/DynamoDBTableDetail", () => ({
  default: ({ tableName, onBack }: any) =>
    React.createElement(
      "div",
      null,
      `Detail for ${tableName}`,
      React.createElement("button", { onClick: onBack }, "Back"),
    ),
}));

/**
 * Cloudscape Modal handles Escape via a React onKeyDown on the dialog element
 * (checking `event.keyCode === 27`). user-event's `keyboard()` targets the
 * active element (body), which never reaches the dialog in happy-dom, so we
 * dispatch the keydown on the dialog directly.
 */
function dismissModalWithEscape() {
  const dialog = document.querySelector('[class*="awsui_dialog"]') as HTMLElement;
  fireEvent.keyDown(dialog, { keyCode: 27 });
}

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

  // Wire the create mutation to invoke `opts.onSuccess` so the onSuccess
  // branches in the dashboard (modal close + resetForm) actually fire.
  mockCreateTableMutate.mockReset();
  mockCreateTableMutate.mockImplementation((_payload: any, opts?: any) => {
    opts?.onSuccess?.();
    return Promise.resolve({});
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

// ─── Drill-down ─────────────────────────────────────────

describe("DynamoDBTables — detail drill-down", () => {
  it("opens table detail when a table name is clicked and goes back", async () => {
    const user = userEvent.setup();
    render(<DynamoDBTables />, { wrapper: createWrapper() });

    const tableBtn = screen.getByRole("button", { name: "my-table" });
    await user.click(tableBtn);

    await waitFor(() => {
      expect(screen.getByText("Detail for my-table")).toBeTruthy();
    });
    // List is replaced by the detail view
    expect(screen.queryByText("Tables")).toBeNull();

    await user.click(screen.getByRole("button", { name: /Back/i }));
    await waitFor(() => {
      expect(screen.getByText("Tables")).toBeTruthy();
    });
    expect(screen.getByRole("button", { name: "my-table" })).toBeTruthy();
  });
});

// ─── Modal close paths ──────────────────────────────────

describe("DynamoDBTables — create modal close", () => {
  it("Cancel closes the modal and resets the form without creating", async () => {
    const user = userEvent.setup();
    render(<DynamoDBTables />, { wrapper: createWrapper() });
    await user.click(screen.getAllByRole("button", { name: /Create Table/i })[0]);
    await waitFor(() => {
      expect(screen.getByText("Create DynamoDB table")).toBeTruthy();
    });

    await user.type(screen.getByPlaceholderText("my-table"), "test-table");
    await user.type(screen.getByPlaceholderText("pk"), "id");

    const cancelBtns = screen.getAllByRole("button", { name: /Cancel/i });
    await user.click(cancelBtns[cancelBtns.length - 1]);

    expect(mockCreateTableMutate).not.toHaveBeenCalled();
    // resetForm cleared the name field
    expect((screen.getByPlaceholderText("my-table") as HTMLInputElement).value).toBe("");
  });

  it("dismisses the create modal with Escape and resets the form", async () => {
    const user = userEvent.setup();
    render(<DynamoDBTables />, { wrapper: createWrapper() });
    await user.click(screen.getAllByRole("button", { name: /Create Table/i })[0]);
    await waitFor(() => {
      expect(screen.getByText("Create DynamoDB table")).toBeTruthy();
    });

    await user.type(screen.getByPlaceholderText("my-table"), "test-table");
    await user.type(screen.getByPlaceholderText("pk"), "id");

    dismissModalWithEscape();

    expect(mockCreateTableMutate).not.toHaveBeenCalled();
    expect((screen.getByPlaceholderText("my-table") as HTMLInputElement).value).toBe("");
  });
});

// ─── Key type selects ───────────────────────────────────

describe("DynamoDBTables — key type selects", () => {
  it("changes the partition key type and submits with it", async () => {
    const user = userEvent.setup();
    render(<DynamoDBTables />, { wrapper: createWrapper() });
    await user.click(screen.getAllByRole("button", { name: /Create Table/i })[0]);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("my-table")).toBeTruthy();
    });

    // Click the partition key type Select (default "String (S)") and pick Number
    await user.click(screen.getAllByText("String (S)")[0]);
    await user.click(screen.getAllByText("Number (N)")[0]);

    await user.type(screen.getByPlaceholderText("my-table"), "typed-table");
    await user.type(screen.getByPlaceholderText("pk"), "id");
    const submit = screen.getAllByRole("button", { name: /Create table/i });
    await user.click(submit[submit.length - 1]);

    await waitFor(() => {
      expect(mockCreateTableMutate).toHaveBeenCalledWith(
        expect.objectContaining({ name: "typed-table", hashKey: "id", hashType: "N" }),
        expect.any(Object),
      );
    });
  });

  it("shows the sort key type select after entering a range key and submits with it", async () => {
    const user = userEvent.setup();
    render(<DynamoDBTables />, { wrapper: createWrapper() });
    await user.click(screen.getAllByRole("button", { name: /Create Table/i })[0]);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("my-table")).toBeTruthy();
    });

    await user.type(screen.getByPlaceholderText("my-table"), "typed-table");
    await user.type(screen.getByPlaceholderText("pk"), "id");
    await user.type(screen.getByPlaceholderText("sk"), "sortKey");

    // Sort key type select appears; change it to Binary
    await user.click(screen.getAllByText("String (S)")[1]);
    await user.click(screen.getAllByText("Binary (B)")[0]);

    const submit = screen.getAllByRole("button", { name: /Create table/i });
    await user.click(submit[submit.length - 1]);

    await waitFor(() => {
      expect(mockCreateTableMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "typed-table",
          hashKey: "id",
          rangeKey: "sortKey",
          rangeType: "B",
        }),
        expect.any(Object),
      );
    });
  });
});

describe("DynamoDBTables — E.9 resource policy and imports", () => {
  beforeEach(() => {
    mockPolicy.mockReturnValue({ data: undefined });
    mockImports.mockReturnValue({ data: undefined });
    mockDescribeImport.mockReturnValue({ data: undefined });
    mockPutPolicy.mockResolvedValue({});
    mockDeletePolicy.mockResolvedValue({});
  });

  it("shows the policy and imports section with no table typed", () => {
    render(<DynamoDBTables />, { wrapper: createWrapper() });
    expect(screen.getByText(/Resource policy & S3 imports/)).toBeTruthy();
    expect(mockPolicy).toHaveBeenCalledWith(null);
  });

  it("shows the current policy for a typed table and saves a new policy", async () => {
    const user = userEvent.setup();
    render(<DynamoDBTables />, { wrapper: createWrapper() });
    await user.type(screen.getByPlaceholderText("Table name for policy"), "my-table");
    mockPolicy.mockReturnValue({ data: { policy: '{"v":9}', revisionId: "rev-1" } });
    await user.type(screen.getByPlaceholderText("Table name for policy"), "my-table");
    await waitFor(() => expect(document.body.textContent).toContain("revision rev-1"));
    await waitFor(() => expect(mockPolicy).toHaveBeenCalledWith("my-table"));
    fireEvent.change(screen.getByPlaceholderText("New policy JSON"), { target: { value: '{"v":10}' } });
    await user.click(screen.getByRole("button", { name: /Save policy/i }));
    await waitFor(() => expect(mockPutPolicy).toHaveBeenCalledWith({ policy: '{"v":10}' }));
    await waitFor(() => expect(screen.getByText("Policy saved.")).toBeTruthy());
  });

  it("deletes a policy and shows the confirmation", async () => {
    const user = userEvent.setup();
    render(<DynamoDBTables />, { wrapper: createWrapper() });
    await user.type(screen.getByPlaceholderText("Table name for policy"), "my-table");
    await user.click(screen.getByRole("button", { name: /Delete policy/i }));
    await waitFor(() => expect(mockDeletePolicy).toHaveBeenCalledWith(undefined));
    await waitFor(() => expect(screen.getByText("Policy deleted.")).toBeTruthy());
  });

  it("shows save and delete failures", async () => {
    mockPutPolicy.mockRejectedValueOnce({});
    mockDeletePolicy.mockRejectedValueOnce({});
    const user = userEvent.setup();
    render(<DynamoDBTables />, { wrapper: createWrapper() });
    await user.type(screen.getByPlaceholderText("Table name for policy"), "my-table");
    await user.click(screen.getByRole("button", { name: /Save policy/i }));
    await waitFor(() => expect(screen.getByText("Failed to save policy.")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete policy/i }));
    await waitFor(() => expect(screen.getByText("Failed to delete policy.")).toBeTruthy());
  });

  it("shows import fallbacks for sparse data", async () => {
    mockImports.mockReturnValue({ data: undefined });
    mockDescribeImport.mockReturnValue({ data: {} });
    const user = userEvent.setup();
    render(<DynamoDBTables />, { wrapper: createWrapper() });
    await user.type(screen.getByPlaceholderText("Table ARN to list imports"), "arn:t");
    await waitFor(() => expect(mockImports).toHaveBeenCalledWith("arn:t"));
    await waitFor(() => expect(screen.getByText(/0 found/)).toBeTruthy());
    await user.type(screen.getByPlaceholderText("Import ARN to describe"), "arn:i");
    await waitFor(() => expect(mockDescribeImport).toHaveBeenCalledWith("arn:i"));
    await waitFor(() => expect(document.body.textContent).toContain("Import —: — — — items"));
  });

  it("renders an import row with missing status", async () => {
    mockImports.mockReturnValue({ data: { imports: [{ importArn: "arn:x" }], total: 1 } });
    const user = userEvent.setup();
    render(<DynamoDBTables />, { wrapper: createWrapper() });
    await user.type(screen.getByPlaceholderText("Table ARN to list imports"), "arn:t");
    await waitFor(() => expect(document.body.textContent).toContain("arn:x — —"));
  });

  it("lists imports for a table ARN", async () => {
    mockImports.mockReturnValue({
      data: { imports: [{ importArn: "arn:import:1", importStatus: "COMPLETED" }], total: 1 },
    });
    const user = userEvent.setup();
    render(<DynamoDBTables />, { wrapper: createWrapper() });
    await user.type(screen.getByPlaceholderText("Table ARN to list imports"), "arn:t");
    await waitFor(() => expect(mockImports).toHaveBeenCalledWith("arn:t"));
    await waitFor(() => expect(screen.getByText(/1 found/)).toBeTruthy());
    expect(screen.getByText(/arn:import:1 — COMPLETED/)).toBeTruthy();
  });

  it("describes an import by ARN", async () => {
    mockDescribeImport.mockReturnValue({
      data: { importArn: "arn:import:2", importStatus: "FAILED", importedItemCount: 3 },
    });
    const user = userEvent.setup();
    render(<DynamoDBTables />, { wrapper: createWrapper() });
    await user.type(screen.getByPlaceholderText("Import ARN to describe"), "arn:import:2");
    await waitFor(() => expect(mockDescribeImport).toHaveBeenCalledWith("arn:import:2"));
    await waitFor(() => expect(screen.getByText(/Import arn:import:2: FAILED — 3 items/)).toBeTruthy());
  });
});
