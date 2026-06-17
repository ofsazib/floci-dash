// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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
            React.createElement("span", { key: c.id }, c.header),
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

const mockDeleteItem = { mutateAsync: vi.fn(), mutate: vi.fn(), isPending: false, isError: false, error: null };
const mockPutItem = { mutate: vi.fn(), isPending: false, isError: false, error: null };

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
      expect(containerFilterBadge()).toBe(true);
    });
  });

  it("clears filters when Clear filters clicked", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <DynamoDBTableDetail tableName="users" onBack={vi.fn()} />,
      { wrapper: createWrapper() },
    );
    const attrInput = screen.getByPlaceholderText("e.g. status");
    await user.type(attrInput, "name");
    await user.type(screen.getByPlaceholderText("Value"), "x");
    await user.click(screen.getByRole("button", { name: /Apply filters/i }));
    await waitFor(() => {
      expect(container.textContent).toContain("Filtered");
    });
    await user.click(screen.getByRole("button", { name: /Clear filters/i }));
    await waitFor(() => {
      expect(container.textContent).not.toContain("Filtered");
    });
  });

  it("disables Apply filters button when no valid condition exists", () => {
    render(<DynamoDBTableDetail tableName="users" onBack={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    const applyBtn = screen.getByRole("button", { name: /Apply filters/i });
    expect(applyBtn).toHaveProperty("disabled", true);
  });

  function containerFilterBadge() {
    return document.body.textContent?.includes("Filtered") ?? false;
  }
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
    const stored = JSON.parse(localStorage.getItem("floci-dashboard-dynamodb-presets") || "{}");
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
    localStorage.setItem("floci-dashboard-dynamodb-presets", JSON.stringify(presets));
    render(<DynamoDBTableDetail tableName="users" onBack={vi.fn()} />, {
      wrapper: createWrapper(),
    });
    expect(screen.getByRole("button", { name: /Manage/i })).toBeTruthy();
  });
});
