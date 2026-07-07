// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

// ─── Mock hooks ─────────────────────────────────────────

const mockWorkGroups = vi.fn();
const mockDeleteWg = vi.fn();
const mockQueryExecutions = vi.fn();

vi.mock("../../hooks/useAthena", () => ({
  useAthenaWorkGroups: (...args: any[]) => mockWorkGroups(...args),
  useDeleteAthenaWorkGroup: () => ({
    mutateAsync: mockDeleteWg,
    isPending: false,
    variables: null,
  }),
  useAthenaQueryExecutions: (...args: any[]) => mockQueryExecutions(...args),
}));

import { AthenaDashboard } from "./AthenaDashboard";

// ─── Setup ──────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
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

    // Click delete button, then confirm in dialog
    const deleteBtns = screen.getAllByRole("button", { name: /Delete analytics/i });
    await user.click(deleteBtns[0]);

    await waitFor(() => {
      expect(screen.getByText(/Are you sure/i)).toBeTruthy();
    });

    // Click confirm Delete in dialog
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
});
