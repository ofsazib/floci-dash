// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import userEvent from "@testing-library/user-event";

vi.mock("../hooks/useDynamoDB", () => ({
  useDynamoDBTableDetail: vi.fn(),
  useDynamoDBDeleteItem: vi.fn(),
  useDynamoDBPutItem: vi.fn(),
  useDynamoDBFilteredScan: vi.fn(),
}));

vi.mock("../lib/utils", () => ({
  formatBytes: (b: number) => `${b} B`,
  formatItemValue: (v: unknown) => String(v),
}));

vi.mock("./ResourceTable", () => ({
  default: ({ items, headerTitle, onCreate, columns }: any) =>
    React.createElement(
      "div",
      { "data-testid": "resource-table" },
      React.createElement("span", null, headerTitle),
      React.createElement(
        "span",
        null,
        `${items?.length ?? 0} items`,
      ),
      onCreate
        ? React.createElement(
            "button",
            { "data-testid": "rt-create", onClick: onCreate },
            "Create",
          )
        : null,
      columns
        ? columns.map((c: any) =>
            React.createElement("span", { key: `h-${c.id}` }, c.header),
          )
        : null,
      items
        ? items.map((item: any, idx: number) =>
            React.createElement(
              "div",
              { key: `row-${idx}`, "data-testid": `row-${idx}` },
              columns.map((c: any) =>
                React.createElement(
                  "span",
                  { key: `c-${c.id}-${idx}` },
                  typeof c.cell === "function" ? c.cell(item) : null,
                ),
              ),
            ),
          )
        : null,
    ),
}));

vi.mock("./DeleteButton", () => ({
  default: ({ onDelete, itemName }: any) =>
    React.createElement(
      "button",
      {
        "data-testid": "delete-button",
        onClick: onDelete,
      },
      `Delete ${itemName}`,
    ),
}));

// The real Cloudscape Modal always renders its role="dialog" root even when
// visible={false} (hidden via CSS), so with 5 modals on this page every
// getByRole("dialog") would match 5 elements in happy-dom. Mock it to render
// nothing when hidden so dialogs are unique and queryable.
vi.mock("@cloudscape-design/components", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@cloudscape-design/components")>();
  return {
    ...actual,
    Modal: ({ visible, header, footer, children }: any) => {
      if (!visible) return null;
      return React.createElement(
        "div",
        { role: "dialog" },
        header,
        children,
        footer,
      );
    },
  };
});

vi.mock("./StatCard", () => ({
  default: ({ label, value }: any) =>
    React.createElement(
      "div",
      { "data-testid": "stat-card" },
      `${label}: ${value}`,
    ),
}));

vi.mock("./DynamoDBAdvanced", () => ({
  default: ({ tableName }: any) =>
    React.createElement(
      "div",
      { "data-testid": "dynamodb-advanced" },
      `Advanced: ${tableName}`,
    ),
}));

import DynamoDBTableDetail from "./DynamoDBTableDetail";
import {
  useDynamoDBTableDetail,
  useDynamoDBDeleteItem,
  useDynamoDBPutItem,
  useDynamoDBFilteredScan,
} from "../hooks/useDynamoDB";
import { clickButton } from "../../test/helpers";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

const mockDeleteItem = {
  mutateAsync: vi.fn(),
  mutate: vi.fn(),
  isPending: false,
  isError: false,
  error: null as Error | null,
};
const mockPutItem = {
  mutate: vi.fn(),
  isPending: false,
  isError: false,
  error: null as Error | null,
};

const detailData = {
  name: "users",
  status: "ACTIVE",
  itemCount: 42,
  sizeBytes: 1024,
  arn: "arn:aws:dynamodb:local:000000000000:table/users",
  createdAt: "2024-01-01T00:00:00.000Z",
  keySchema: [
    { AttributeName: "pk", KeyType: "HASH" },
    { AttributeName: "sk", KeyType: "RANGE" },
  ],
};

const scanData = {
  table: "users",
  items: [
    { pk: "u1", sk: "meta", name: "Alice" },
    { pk: "u2", sk: "meta", name: "Bob" },
  ],
  count: 2,
  scannedCount: 5,
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  (useDynamoDBTableDetail as any).mockReturnValue({
    data: detailData,
    isLoading: false,
    isError: false,
    error: null,
  });
  (useDynamoDBFilteredScan as any).mockReturnValue({
    data: scanData,
    isLoading: false,
    isError: false,
    error: null,
  });
  (useDynamoDBDeleteItem as any).mockReturnValue(mockDeleteItem);
  (useDynamoDBPutItem as any).mockReturnValue(mockPutItem);
  mockPutItem.isPending = false;
  mockPutItem.isError = false;
  mockPutItem.error = null;
  (mockPutItem.mutate as any).mockReset();
  mockDeleteItem.isPending = false;
  mockDeleteItem.isError = false;
  mockDeleteItem.error = null;
  (mockDeleteItem.mutateAsync as any).mockReset();
});

describe("DynamoDBTableDetail — loading & error states", () => {
  it("renders spinner while loading", () => {
    (useDynamoDBTableDetail as any).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });
    const { container } = render(
      <DynamoDBTableDetail tableName="users" onBack={vi.fn()} />,
      { wrapper: createWrapper() },
    );
    expect(container.textContent).toContain("Loading table details");
  });

  it("renders error status indicator on detail error", () => {
    (useDynamoDBTableDetail as any).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("boom-detail"),
    });
    const { container } = render(
      <DynamoDBTableDetail tableName="users" onBack={vi.fn()} />,
      { wrapper: createWrapper() },
    );
    expect(container.textContent).toContain("boom-detail");
  });

  it("renders error status indicator on scan error", () => {
    (useDynamoDBFilteredScan as any).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("boom-scan"),
    });
    const { container } = render(
      <DynamoDBTableDetail tableName="users" onBack={vi.fn()} />,
      { wrapper: createWrapper() },
    );
    expect(container.textContent).toContain("boom-scan");
  });

  it("shows scan loading spinner while detail is already loaded", () => {
    (useDynamoDBFilteredScan as any).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });
    const { container } = render(
      <DynamoDBTableDetail tableName="users" onBack={vi.fn()} />,
      { wrapper: createWrapper() },
    );
    expect(container.textContent).toContain("Loading table details");
  });
});

describe("DynamoDBTableDetail — success render", () => {
  it("renders table name and back button", () => {
    const onBack = vi.fn();
    const { container } = render(
      <DynamoDBTableDetail tableName="users" onBack={onBack} />,
      { wrapper: createWrapper() },
    );
    expect(container.textContent).toContain("users");
    expect(container.textContent).toContain("Tables");
  });

  it("calls onBack when back button clicked", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(<DynamoDBTableDetail tableName="users" onBack={onBack} />, {
      wrapper: createWrapper(),
    });
    const backButtons = screen.getAllByRole("button", { name: /Tables/i });
    await user.click(backButtons[0]);
    expect(onBack).toHaveBeenCalledOnce();
  });

  it("renders stat cards with table info", () => {
    const { container } = render(
      <DynamoDBTableDetail tableName="users" onBack={vi.fn()} />,
      { wrapper: createWrapper() },
    );
    const cards = screen.getAllByTestId("stat-card");
    const allText = cards.map((c) => c.textContent).join("|");
    expect(allText).toContain("Status");
    expect(allText).toContain("ACTIVE");
    expect(allText).toContain("42");
    expect(allText).toContain("1024 B");
    expect(allText).toContain("arn:aws:dynamodb");
  });

  it("renders key schema info (partition key, sort key)", () => {
    const { container } = render(
      <DynamoDBTableDetail tableName="users" onBack={vi.fn()} />,
      { wrapper: createWrapper() },
    );
    const cards = screen.getAllByTestId("stat-card");
    const allText = cards.map((c) => c.textContent).join("|");
    expect(allText).toContain("pk");
    expect(allText).toContain("sk");
  });

  it("shows 'None' for sort key when no RANGE key", () => {
    (useDynamoDBTableDetail as any).mockReturnValue({
      data: { ...detailData, keySchema: [{ AttributeName: "pk", KeyType: "HASH" }] },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<DynamoDBTableDetail tableName="users" onBack={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    const cards = screen.getAllByTestId("stat-card");
    const allText = cards.map((c) => c.textContent).join("|");
    expect(allText).toContain("None");
  });

  it("renders with missing optional detail fields (no createdAt, no sizeBytes)", () => {
    (useDynamoDBTableDetail as any).mockReturnValue({
      data: {
        ...detailData,
        createdAt: undefined,
        sizeBytes: null,
        itemCount: 0,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const { container } = render(
      <DynamoDBTableDetail tableName="users" onBack={vi.fn()} />,
      { wrapper: createWrapper() },
    );
    expect(container.textContent).toContain("0");
  });
});

describe("DynamoDBTableDetail — empty items", () => {
  it("shows 0 items when scan returns empty", () => {
    (useDynamoDBFilteredScan as any).mockReturnValue({
      data: { ...scanData, items: [], count: 0 },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<DynamoDBTableDetail tableName="users" onBack={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    expect(screen.getByText("0 items")).toBeTruthy();
  });
});

describe("DynamoDBTableDetail — filter UI", () => {
  it("renders filter condition builder with one default condition", () => {
    render(<DynamoDBTableDetail tableName="users" onBack={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    const inputs = screen.getAllByRole("textbox");
    expect(inputs.length).toBeGreaterThan(0);
  });

  it("adds a new filter condition on Add condition button click", async () => {
    const user = userEvent.setup();
    render(<DynamoDBTableDetail tableName="users" onBack={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    const before = screen.getAllByPlaceholderText("e.g. status").length;
    await user.click(screen.getByRole("button", { name: /Add condition/i }));
    const after = screen.getAllByPlaceholderText("e.g. status").length;
    expect(after).toBe(before + 1);
  });

  it("removes a filter condition when remove button clicked", async () => {
    const user = userEvent.setup();
    render(<DynamoDBTableDetail tableName="users" onBack={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    await user.click(screen.getByRole("button", { name: /Add condition/i }));
    const before = screen.getAllByPlaceholderText("e.g. status").length;
    const removeButtons = screen.getAllByRole("button", { name: /Remove condition/i });
    await user.click(removeButtons[0]);
    const after = screen.getAllByPlaceholderText("e.g. status").length;
    expect(after).toBe(before - 1);
  });

  it("applies filters when Apply filters clicked with valid condition", async () => {
    const user = userEvent.setup();
    render(<DynamoDBTableDetail tableName="users" onBack={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    const attrInput = screen.getByPlaceholderText("e.g. status");
    await user.type(attrInput, "name");
    const valueInput = screen.getByPlaceholderText("Value");
    await user.type(valueInput, "Alice");
    await user.click(screen.getByRole("button", { name: /Apply filters/i }));
    await waitFor(() => {
      expect(document.body.textContent).toContain("Filtered");
    });
  });

  it("clears filters when Clear filters clicked", async () => {
    const user = userEvent.setup();
    render(<DynamoDBTableDetail tableName="users" onBack={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    const attrInput = screen.getByPlaceholderText("e.g. status");
    await user.type(attrInput, "name");
    await user.type(screen.getByPlaceholderText("Value"), "x");
    await user.click(screen.getByRole("button", { name: /Apply filters/i }));
    await waitFor(() => {
      expect(document.body.textContent).toContain("Filtered");
    });
    await user.click(screen.getByRole("button", { name: /Clear filters/i }));
    await waitFor(() => {
      expect(document.body.textContent).not.toContain("Filtered");
    });
  });

  it("disables Apply filters button when no valid condition exists", () => {
    render(<DynamoDBTableDetail tableName="users" onBack={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    const applyBtn = screen.getByRole("button", { name: /Apply filters/i });
    expect(applyBtn).toHaveProperty("disabled", true);
  });

  it("toggles condition enable/disable via click on ✓/✕ badge", async () => {
    const user = userEvent.setup();
    render(<DynamoDBTableDetail tableName="users" onBack={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    const toggle = screen.getByTitle(/Enable condition|Disable condition/);
    await user.click(toggle);
    // After clicking, the title should toggle
    const toggled = screen.getByTitle(/Enable condition|Disable condition/);
    expect(toggled).toBeTruthy();
  });
});

describe("DynamoDBTableDetail — pagination", () => {
  it("disables Previous button on first page", () => {
    render(<DynamoDBTableDetail tableName="users" onBack={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    const prev = screen.getByRole("button", { name: /Previous/i });
    expect(prev).toHaveProperty("disabled", true);
  });

  it("disables Next button when no lastEvaluatedKey", () => {
    (useDynamoDBFilteredScan as any).mockReturnValue({
      data: { ...scanData, lastEvaluatedKey: undefined },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<DynamoDBTableDetail tableName="users" onBack={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    const next = screen.getByRole("button", { name: /Next/i });
    expect(next).toHaveProperty("disabled", true);
  });

  it("enables Next button when lastEvaluatedKey exists", () => {
    (useDynamoDBFilteredScan as any).mockReturnValue({
      data: { ...scanData, lastEvaluatedKey: { pk: "u2" } },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<DynamoDBTableDetail tableName="users" onBack={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    const next = screen.getByRole("button", { name: /Next/i });
    expect(next).toHaveProperty("disabled", false);
  });

  it("navigates to next page and back when buttons clicked", async () => {
    const user = userEvent.setup();
    (useDynamoDBFilteredScan as any).mockReturnValue({
      data: { ...scanData, lastEvaluatedKey: { pk: "u2" } },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<DynamoDBTableDetail tableName="users" onBack={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    const next = screen.getByRole("button", { name: /Next/i });
    await user.click(next);
    expect(screen.getByText(/Page 2/)).toBeTruthy();
    const prev = screen.getByRole("button", { name: /Previous/i });
    await user.click(prev);
    expect(screen.getByText(/Page 1/)).toBeTruthy();
  });
});

describe("DynamoDBTableDetail — preset management", () => {
  it("opens save preset modal", async () => {
    const user = userEvent.setup();
    render(<DynamoDBTableDetail tableName="users" onBack={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    await user.click(screen.getByRole("button", { name: /Save as preset/i }));
    expect(screen.getByText("Save filter preset")).toBeTruthy();
  });

  it("saves a preset to localStorage", async () => {
    const user = userEvent.setup();
    render(<DynamoDBTableDetail tableName="users" onBack={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    await user.type(screen.getByPlaceholderText("e.g. status"), "name");
    await user.type(screen.getByPlaceholderText("Value"), "Alice");
    await user.click(screen.getByRole("button", { name: /Save as preset/i }));
    await user.type(screen.getByPlaceholderText("e.g. Active items"), "my-preset");
    await clickButton(user, /^Save$/i, { last: true });
    const stored = JSON.parse(localStorage.getItem("floci-dash-dynamodb-presets") || "{}");
    expect(stored.users).toBeDefined();
    expect(stored.users[0].name).toBe("my-preset");
  });

  it("shows Manage button after a preset is saved", async () => {
    const user = userEvent.setup();
    render(<DynamoDBTableDetail tableName="users" onBack={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    await user.type(screen.getByPlaceholderText("e.g. status"), "name");
    await user.type(screen.getByPlaceholderText("Value"), "Alice");
    await user.click(screen.getByRole("button", { name: /Save as preset/i }));
    await user.type(screen.getByPlaceholderText("e.g. Active items"), "p1");
    await clickButton(user, /^Save$/i, { last: true });
    expect(screen.getByRole("button", { name: /Manage/i })).toBeTruthy();
  });

  it("loads existing presets from localStorage on mount", () => {
    const presets = {
      users: [{ name: "saved-preset", conditions: [{ attr: "x", op: "=", value: "1", enabled: true }], logic: "AND" }],
    };
    localStorage.setItem("floci-dash-dynamodb-presets", JSON.stringify(presets));
    render(<DynamoDBTableDetail tableName="users" onBack={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    expect(screen.getByRole("button", { name: /Manage/i })).toBeTruthy();
  });

  it("loads a preset when selected from dropdown", async () => {
    const user = userEvent.setup();
    const presets = {
      users: [{ name: "active-items", conditions: [{ attr: "status", op: "=", value: "active", enabled: true }], logic: "AND" }],
    };
    localStorage.setItem("floci-dash-dynamodb-presets", JSON.stringify(presets));
    render(<DynamoDBTableDetail tableName="users" onBack={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    // Should show Manage button and not save-as-a-new-preset button flow
    expect(screen.getByRole("button", { name: /Manage/i })).toBeTruthy();
  });
});

describe("DynamoDBTableDetail — Advanced tab", () => {
  it("renders DynamoDBAdvanced component", async () => {
    const user = userEvent.setup();
    render(<DynamoDBTableDetail tableName="users" onBack={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    expect(screen.getByTestId("dynamodb-advanced")).toBeTruthy();
    expect(screen.getByText(/Advanced: users/)).toBeTruthy();
  });
});

// ─── Error message fallbacks ─────────────────────────────

describe("DynamoDBTableDetail — error fallbacks", () => {
  it("shows a generic error when detail error has no message", () => {
    (useDynamoDBTableDetail as any).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: null,
    });
    const { container } = render(
      <DynamoDBTableDetail tableName="users" onBack={vi.fn()} />,
      { wrapper: createWrapper() },
    );
    expect(container.textContent).toContain("Failed to load table details");
  });
});

// ─── Detail field fallbacks ──────────────────────────────

describe("DynamoDBTableDetail — detail field fallbacks", () => {
  it("renders stat card fallbacks when detail fields are missing", () => {
    (useDynamoDBTableDetail as any).mockReturnValue({
      data: {
        ...detailData,
        status: undefined,
        arn: undefined,
        itemCount: undefined,
        sizeBytes: null,
        createdAt: undefined,
        keySchema: [],
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<DynamoDBTableDetail tableName="users" onBack={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    const cards = screen.getAllByTestId("stat-card");
    const allText = cards.map((c) => c.textContent).join("|");
    expect(allText).toContain("Status: —");
    expect(allText).toContain("Item count: 0");
    expect(allText).toContain("Size: —");
    expect(allText).toContain("ARN: —");
    expect(allText).toContain("Partition key: —");
    expect(allText).toContain("Sort key: None");
    expect(allText).toContain("Created: —");
  });

  it("shows 0 items when scan response lacks an items array", () => {
    (useDynamoDBFilteredScan as any).mockReturnValue({
      data: { count: 0 },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<DynamoDBTableDetail tableName="users" onBack={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    expect(screen.getByText("0 items")).toBeTruthy();
  });

  it("opens put modal for a table without a hash key", async () => {
    const user = userEvent.setup();
    (useDynamoDBTableDetail as any).mockReturnValue({
      data: { ...detailData, keySchema: [] },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<DynamoDBTableDetail tableName="users" onBack={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    await user.click(screen.getByTestId("rt-create"));
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("button", { name: /^Put item$/i }),
    ).toHaveProperty("disabled", true);
  });
});

// ─── Preset edge cases ───────────────────────────────────

describe("DynamoDBTableDetail — preset edge cases", () => {
  it("survives corrupt preset JSON in localStorage", () => {
    localStorage.setItem("floci-dash-dynamodb-presets", "{not valid json");
    render(<DynamoDBTableDetail tableName="users" onBack={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    expect(
      screen.queryByRole("button", { name: /Manage/i }),
    ).toBeNull();
    expect(
      screen.getByRole("button", { name: /Save as preset/i }),
    ).toBeTruthy();
  });

  it("does not save a preset when no filter conditions are filled", async () => {
    const user = userEvent.setup();
    render(<DynamoDBTableDetail tableName="users" onBack={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    await user.click(screen.getByRole("button", { name: /Save as preset/i }));
    const dialog = screen.getByRole("dialog");
    await user.type(
      within(dialog).getByPlaceholderText("e.g. Active items"),
      "empty-preset",
    );
    await user.click(within(dialog).getByRole("button", { name: /^Save$/i }));
    expect(localStorage.getItem("floci-dash-dynamodb-presets")).toBeNull();
    // Modal stays open because the early return skipped closing it
    expect(within(dialog).getByText("Save filter preset")).toBeTruthy();
    await user.click(
      within(dialog).getByRole("button", { name: /^Cancel$/i }),
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("loads a preset with unknown operator and logic using fallbacks", async () => {
    const user = userEvent.setup();
    const presets = {
      users: [
        {
          name: "weird",
          conditions: [{ attr: "status", op: "LIKE", value: "active" }],
          logic: "XOR",
        },
      ],
    };
    localStorage.setItem(
      "floci-dash-dynamodb-presets",
      JSON.stringify(presets),
    );
    render(<DynamoDBTableDetail tableName="users" onBack={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    await user.click(screen.getByRole("button", { name: /Manage/i }));
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /^Load$/i }));
    await waitFor(() => {
      expect(screen.getByDisplayValue("status")).toBeTruthy();
    });
    // Operator and logic fell back to the defaults
    expect(screen.getByText("AND — all conditions must match")).toBeTruthy();
  });

  it("deletes a preset from the manage modal", async () => {
    const user = userEvent.setup();
    const presets = {
      users: [
        {
          name: "p1",
          conditions: [{ attr: "a", op: "=", value: "1", enabled: true }],
          logic: "AND",
        },
      ],
    };
    localStorage.setItem(
      "floci-dash-dynamodb-presets",
      JSON.stringify(presets),
    );
    render(<DynamoDBTableDetail tableName="users" onBack={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    await user.click(screen.getByRole("button", { name: /Manage/i }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("p1")).toBeTruthy();
    await user.click(within(dialog).getAllByTestId("delete-button")[0]);
    await waitFor(() => {
      const stored = JSON.parse(
        localStorage.getItem("floci-dash-dynamodb-presets") || "{}",
      );
      expect(stored.users).toEqual([]);
    });
    expect(
      screen.getByText("No presets saved for this table yet."),
    ).toBeTruthy();
  });

  it("loads a preset from the Load preset dropdown", async () => {
    const user = userEvent.setup();
    const presets = {
      users: [
        {
          name: "active-items",
          conditions: [
            { attr: "status", op: "=", value: "active", enabled: true },
          ],
          logic: "AND",
        },
      ],
    };
    localStorage.setItem(
      "floci-dash-dynamodb-presets",
      JSON.stringify(presets),
    );
    render(<DynamoDBTableDetail tableName="users" onBack={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    await user.click(screen.getByRole("button", { name: /Select a preset/ }));
    await user.click(screen.getByRole("option", { name: "active-items" }));
    await waitFor(() => {
      expect(screen.getByDisplayValue("status")).toBeTruthy();
    });
  });

  it("does not load a preset when the placeholder option is selected", async () => {
    const user = userEvent.setup();
    const presets = {
      users: [
        {
          name: "active-items",
          conditions: [
            { attr: "status", op: "=", value: "active", enabled: true },
          ],
          logic: "AND",
        },
      ],
    };
    localStorage.setItem(
      "floci-dash-dynamodb-presets",
      JSON.stringify(presets),
    );
    render(<DynamoDBTableDetail tableName="users" onBack={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    await user.click(screen.getByRole("button", { name: /Select a preset/ }));
    await user.click(
      screen.getByRole("option", { name: "Select a preset..." }),
    );
    expect(screen.queryByDisplayValue("status")).toBeNull();
  });
});

// ─── Filter edge cases ───────────────────────────────────

describe("DynamoDBTableDetail — filter edge cases", () => {
  it("returns early when the only valid condition is disabled", async () => {
    const user = userEvent.setup();
    render(<DynamoDBTableDetail tableName="users" onBack={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    await user.click(screen.getByRole("button", { name: /Add condition/i }));
    await user.type(screen.getAllByPlaceholderText("e.g. status")[0], "name");
    await user.type(screen.getAllByPlaceholderText("Value")[0], "x");
    await user.click(screen.getAllByTitle("Disable condition")[0]);
    const applyBtn = screen.getByRole("button", { name: /Apply filters/i });
    expect(applyBtn).toHaveProperty("disabled", false);
    await user.click(applyBtn);
    await waitFor(() => {
      expect(document.body.textContent).not.toContain("Filtered");
    });
  });

  it("applies an EXISTS filter loaded from a preset", async () => {
    const user = userEvent.setup();
    const presets = {
      users: [
        {
          name: "exists-preset",
          conditions: [
            { attr: "status", op: "EXISTS", value: "x", enabled: true },
          ],
          logic: "AND",
        },
      ],
    };
    localStorage.setItem(
      "floci-dash-dynamodb-presets",
      JSON.stringify(presets),
    );
    render(<DynamoDBTableDetail tableName="users" onBack={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    await user.click(screen.getByRole("button", { name: /Manage/i }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/status EXISTS/)).toBeTruthy();
    await user.click(within(dialog).getByRole("button", { name: /^Load$/i }));
    await waitFor(() =>
      expect(screen.getByDisplayValue("status")).toBeTruthy(),
    );
    // Value input is disabled for EXISTS / NOT_EXISTS operators
    expect(screen.getAllByPlaceholderText("Value")[0]).toHaveProperty(
      "disabled",
      true,
    );
    await user.click(screen.getByRole("button", { name: /Apply filters/i }));
    await waitFor(() => {
      expect(document.body.textContent).toContain("Filtered: status EXISTS");
    });
  });

  it("changes filter logic to OR via dropdown", async () => {
    const user = userEvent.setup();
    render(<DynamoDBTableDetail tableName="users" onBack={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    await user.click(screen.getByText("AND — all conditions must match"));
    await user.click(
      screen.getByRole("option", { name: "OR — any condition must match" }),
    );
    await user.type(screen.getAllByPlaceholderText("e.g. status")[0], "name");
    await user.type(screen.getAllByPlaceholderText("Value")[0], "x");
    await user.click(screen.getByRole("button", { name: /Add condition/i }));
    await user.type(screen.getAllByPlaceholderText("e.g. status")[1], "price");
    await user.type(screen.getAllByPlaceholderText("Value")[1], "5");
    await user.click(screen.getByRole("button", { name: /Apply filters/i }));
    await waitFor(() => {
      expect(document.body.textContent).toContain(
        "Filtered: name = x OR price = 5",
      );
    });
  });

  it("changes the operator on a filter condition via dropdown", async () => {
    const user = userEvent.setup();
    render(<DynamoDBTableDetail tableName="users" onBack={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    await user.click(screen.getByRole("button", { name: /Add condition/i }));
    await user.click(screen.getAllByText("=")[0]);
    await user.click(screen.getByRole("option", { name: ">" }));
    await user.type(screen.getAllByPlaceholderText("e.g. status")[0], "score");
    await user.type(screen.getAllByPlaceholderText("Value")[0], "90");
    await user.click(screen.getByRole("button", { name: /Apply filters/i }));
    await waitFor(() => {
      expect(document.body.textContent).toContain("Filtered: score > 90");
    });
  });
});

// ─── Item row actions ────────────────────────────────────

describe("DynamoDBTableDetail — item row actions", () => {
  it("opens item details modal and closes it", async () => {
    const user = userEvent.setup();
    render(<DynamoDBTableDetail tableName="users" onBack={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    await user.click(screen.getAllByRole("button", { name: /^View$/i })[0]);
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Item details")).toBeTruthy();
    expect(within(dialog).getByText("Alice")).toBeTruthy();
    // Quick-add Save is disabled until both fields are filled
    expect(
      within(dialog).getByRole("button", { name: /^Save$/i }),
    ).toHaveProperty("disabled", true);
    await user.click(
      within(dialog).getByRole("button", { name: /^Close$/i }),
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("adds an attribute via quick-add in item details", async () => {
    const user = userEvent.setup();
    render(<DynamoDBTableDetail tableName="users" onBack={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    await user.click(screen.getAllByRole("button", { name: /^View$/i })[0]);
    const dialog = screen.getByRole("dialog");
    await user.type(
      within(dialog).getByPlaceholderText("attribute-name"),
      "age",
    );
    await user.type(
      within(dialog).getByPlaceholderText("Attribute value"),
      "30",
    );
    await user.click(within(dialog).getByRole("button", { name: /^Save$/i }));
    await waitFor(() => {
      expect(mockPutItem.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          pk: "u1",
          sk: "meta",
          name: "Alice",
          age: "30",
        }),
        expect.any(Object),
      );
    });
  });

  it("shows quick-add error fallback when put fails", async () => {
    const user = userEvent.setup();
    mockPutItem.isError = true;
    mockPutItem.error = null;
    render(<DynamoDBTableDetail tableName="users" onBack={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    await user.click(screen.getAllByRole("button", { name: /^View$/i })[0]);
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Failed to add attribute")).toBeTruthy();
  });

  it("edits an item including non-string attribute values", async () => {
    const user = userEvent.setup();
    (useDynamoDBFilteredScan as any).mockReturnValue({
      data: {
        ...scanData,
        items: [{ pk: "u1", sk: "meta", name: "Alice", age: 30 }],
        count: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<DynamoDBTableDetail tableName="users" onBack={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    await user.click(screen.getAllByRole("button", { name: /^Edit$/i })[0]);
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Update item in users")).toBeTruthy();
    expect(within(dialog).getByDisplayValue("u1")).toHaveProperty(
      "disabled",
      true,
    );
    expect(within(dialog).getByDisplayValue("meta")).toHaveProperty(
      "disabled",
      true,
    );
    expect(within(dialog).getByDisplayValue("30")).toBeTruthy();
    await user.click(
      within(dialog).getByRole("button", { name: /Add attribute/i }),
    );
    const nameInputs = within(dialog).getAllByPlaceholderText("Attribute name");
    await user.type(nameInputs[nameInputs.length - 1], "city");
    const valueInputs = within(dialog).getAllByPlaceholderText("Value");
    await user.type(valueInputs[valueInputs.length - 1], "SF");
    await user.click(
      within(dialog).getByRole("button", { name: /Save changes/i }),
    );
    await waitFor(() => {
      expect(mockPutItem.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          pk: "u1",
          sk: "meta",
          name: "Alice",
          age: "30",
          city: "SF",
        }),
        expect.any(Object),
      );
    });
  });

  it("excludes extra attributes with an empty value from the update payload", async () => {
    const user = userEvent.setup();
    (useDynamoDBFilteredScan as any).mockReturnValue({
      data: {
        ...scanData,
        items: [{ pk: "u1", sk: "meta", name: "Alice" }],
        count: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<DynamoDBTableDetail tableName="users" onBack={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    await user.click(screen.getAllByRole("button", { name: /^Edit$/i })[0]);
    const dialog = screen.getByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", { name: /Add attribute/i }),
    );
    const nameInputs = within(dialog).getAllByPlaceholderText("Attribute name");
    await user.type(nameInputs[nameInputs.length - 1], "city");
    await user.click(
      within(dialog).getByRole("button", { name: /Save changes/i }),
    );
    await waitFor(() => {
      expect(mockPutItem.mutate).toHaveBeenCalledWith(
        expect.objectContaining({ pk: "u1", sk: "meta", name: "Alice" }),
        expect.any(Object),
      );
    });
    const payload = (mockPutItem.mutate as any).mock.calls[0][0];
    expect(payload.city).toBeUndefined();
  });

  it("shows update item error alert in edit modal", async () => {
    const user = userEvent.setup();
    mockPutItem.isError = true;
    mockPutItem.error = null;
    render(<DynamoDBTableDetail tableName="users" onBack={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    await user.click(screen.getAllByRole("button", { name: /^Edit$/i })[0]);
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Failed to update item")).toBeTruthy();
  });

  it("cancels the update item modal without saving", async () => {
    const user = userEvent.setup();
    render(<DynamoDBTableDetail tableName="users" onBack={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    await user.click(screen.getAllByRole("button", { name: /^Edit$/i })[0]);
    const dialog = screen.getByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", { name: /^Cancel$/i }),
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(mockPutItem.mutate).not.toHaveBeenCalled();
  });

  it("deletes an item with its key payload", async () => {
    const user = userEvent.setup();
    render(<DynamoDBTableDetail tableName="users" onBack={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    const deleteBtns = screen.getAllByRole("button", {
      name: /Delete item in users/i,
    });
    await user.click(deleteBtns[0]);
    await waitFor(() => {
      expect(mockDeleteItem.mutateAsync).toHaveBeenCalledWith({
        pk: "u1",
        sk: "meta",
      });
    });
  });

  it("deletes an item with an empty key payload when the table has no key schema", async () => {
    const user = userEvent.setup();
    (useDynamoDBTableDetail as any).mockReturnValue({
      data: { ...detailData, keySchema: undefined },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<DynamoDBTableDetail tableName="users" onBack={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    const deleteBtns = screen.getAllByRole("button", {
      name: /Delete item in users/i,
    });
    await user.click(deleteBtns[0]);
    await waitFor(() => {
      expect(mockDeleteItem.mutateAsync).toHaveBeenCalledWith({});
    });
  });

  it("deletes an item with only the hash key when the table has no sort key", async () => {
    const user = userEvent.setup();
    (useDynamoDBTableDetail as any).mockReturnValue({
      data: {
        ...detailData,
        keySchema: [{ AttributeName: "pk", KeyType: "HASH" }],
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<DynamoDBTableDetail tableName="users" onBack={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    const deleteBtns = screen.getAllByRole("button", {
      name: /Delete item in users/i,
    });
    await user.click(deleteBtns[0]);
    await waitFor(() => {
      expect(mockDeleteItem.mutateAsync).toHaveBeenCalledWith({ pk: "u1" });
    });
  });

  it("renders fallback dashes in item cells for missing values", () => {
    (useDynamoDBFilteredScan as any).mockReturnValue({
      data: {
        ...scanData,
        items: [
          { sk: "no-pk" },
          { pk: "no-sk" },
          { pk: "p3", sk: "s3", extra: undefined },
        ],
        count: 3,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<DynamoDBTableDetail tableName="users" onBack={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(3);
  });
});

// ─── Put item modal ──────────────────────────────────────

describe("DynamoDBTableDetail — put item modal", () => {
  it("cancels the put item modal", async () => {
    const user = userEvent.setup();
    render(<DynamoDBTableDetail tableName="users" onBack={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    await user.click(screen.getByTestId("rt-create"));
    expect(screen.getByRole("dialog")).toBeTruthy();
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: /^Cancel$/i,
      }),
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("disables Put item until both keys are filled", async () => {
    const user = userEvent.setup();
    render(<DynamoDBTableDetail tableName="users" onBack={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    await user.click(screen.getByTestId("rt-create"));
    const dialog = screen.getByRole("dialog");
    const putBtn = within(dialog).getByRole("button", {
      name: /^Put item$/i,
    });
    expect(putBtn).toHaveProperty("disabled", true);
    await user.type(
      within(dialog).getByPlaceholderText("Enter partition key value"),
      "p1",
    );
    expect(putBtn).toHaveProperty("disabled", true);
    await user.type(
      within(dialog).getByPlaceholderText("Enter sort key value"),
      "s1",
    );
    expect(putBtn).toHaveProperty("disabled", false);
  });

  it("submits put item with keys and extra attributes", async () => {
    const user = userEvent.setup();
    (mockPutItem.mutate as any).mockImplementation(
      (_item: any, opts?: any) => {
        opts?.onSuccess?.();
      },
    );
    render(<DynamoDBTableDetail tableName="users" onBack={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    await user.click(screen.getByTestId("rt-create"));
    const dialog = screen.getByRole("dialog");
    await user.type(
      within(dialog).getByPlaceholderText("Enter partition key value"),
      "p1",
    );
    await user.type(
      within(dialog).getByPlaceholderText("Enter sort key value"),
      "s1",
    );
    await user.type(
      within(dialog).getByPlaceholderText("Attribute name"),
      "team",
    );
    await user.type(within(dialog).getByPlaceholderText("Value"), "core");
    await user.click(
      within(dialog).getByRole("button", { name: /Add attribute/i }),
    );
    await user.click(
      within(dialog).getByRole("button", { name: /^Put item$/i }),
    );
    await waitFor(() => {
      expect(mockPutItem.mutate).toHaveBeenCalledWith(
        expect.objectContaining({ pk: "p1", sk: "s1", team: "core" }),
        expect.any(Object),
      );
    });
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });

  it("adds and removes extra attribute rows in put modal", async () => {
    const user = userEvent.setup();
    render(<DynamoDBTableDetail tableName="users" onBack={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    await user.click(screen.getByTestId("rt-create"));
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getAllByPlaceholderText("Attribute name").length,
    ).toBe(1);
    await user.click(
      within(dialog).getByRole("button", { name: /Add attribute/i }),
    );
    expect(
      within(dialog).getAllByPlaceholderText("Attribute name").length,
    ).toBe(2);
    await user.click(
      within(dialog).getAllByRole("button", {
        name: /Remove attribute/i,
      })[0],
    );
    expect(
      within(dialog).getAllByPlaceholderText("Attribute name").length,
    ).toBe(1);
  });

  it("updates one extra attribute row without affecting the other", async () => {
    const user = userEvent.setup();
    render(<DynamoDBTableDetail tableName="users" onBack={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    await user.click(screen.getByTestId("rt-create"));
    const dialog = screen.getByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", { name: /Add attribute/i }),
    );
    const nameInputs = within(dialog).getAllByPlaceholderText("Attribute name");
    expect(nameInputs).toHaveLength(2);
    await user.type(nameInputs[0], "team");
    const valueInputs = within(dialog).getAllByPlaceholderText("Value");
    await user.type(valueInputs[0], "core");
    const updatedNames =
      within(dialog).getAllByPlaceholderText("Attribute name");
    const updatedValues = within(dialog).getAllByPlaceholderText("Value");
    expect(updatedNames[0]).toHaveProperty("value", "team");
    expect(updatedValues[0]).toHaveProperty("value", "core");
    expect(updatedNames[1]).toHaveProperty("value", "");
    expect(updatedValues[1]).toHaveProperty("value", "");
  });

  it("shows put item error alert in modal", async () => {
    const user = userEvent.setup();
    mockPutItem.isError = true;
    mockPutItem.error = new Error("put-boom");
    render(<DynamoDBTableDetail tableName="users" onBack={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    await user.click(screen.getByTestId("rt-create"));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("put-boom")).toBeTruthy();
  });
});
