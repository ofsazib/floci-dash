// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createWrapper } from "../../../test/helpers";
import React from "react";

const mockHooks = vi.hoisted(() => ({
  useCcControls: vi.fn(),
  useCcControl: vi.fn(),
}));

vi.mock("../../hooks/useControlCatalog", () => mockHooks);

function listQuery(key: string, items: unknown[], overrides: Record<string, unknown> = {}) {
  return {
    data: { [key]: items, total: items.length },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  };
}

const CONTROL = {
  Arn: "arn:aws:controlcatalog:us-east-1:control/1",
  Name: "audit-lock",
  Behavior: "PROACTIVE",
  Severity: "CRITICAL",
};

import ControlCatalogDashboard from "./ControlCatalogDashboard";

beforeEach(() => {
  vi.clearAllMocks();
  mockHooks.useCcControls.mockReturnValue(listQuery("controls", [CONTROL]));
  mockHooks.useCcControl.mockReturnValue({ data: undefined, isLoading: false });
});

describe("ControlCatalogDashboard", () => {
  it("renders controls with fields", async () => {
    render(<ControlCatalogDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("audit-lock")).toBeTruthy());
    expect(screen.getByText("PROACTIVE")).toBeTruthy();
    expect(screen.getByText("CRITICAL")).toBeTruthy();
  });

  it("shows the empty table message", () => {
    mockHooks.useCcControls.mockReturnValue(listQuery("controls", []));
    render(<ControlCatalogDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("No controls found")).toBeTruthy();
  });

  it("renders with undefined data (loading)", () => {
    mockHooks.useCcControls.mockReturnValue(
      listQuery("controls", [], { data: undefined, isLoading: true })
    );
    render(<ControlCatalogDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Controls")).toBeTruthy();
  });

  it("shows the error alert with fallback message", () => {
    mockHooks.useCcControls.mockReturnValue(
      listQuery("controls", [], { isError: true, error: null })
    );
    render(<ControlCatalogDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Failed to load controls")).toBeTruthy();
  });

  it("drills into a control and shows detail fields", async () => {
    const user = userEvent.setup();
    mockHooks.useCcControl.mockReturnValue({
      data: {
        control: {
          ...CONTROL,
          Description: "locks it down",
          ParameterRequirementSummary: "NONE",
        },
      },
      isLoading: false,
    });
    render(<ControlCatalogDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("audit-lock")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^View$/i }));
    await waitFor(() => expect(screen.getByText("Back to controls")).toBeTruthy());
    expect(screen.getByText("locks it down")).toBeTruthy();
    expect(screen.getByText("NONE")).toBeTruthy();
    await user.click(screen.getByText("Back to controls"));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /^View$/i })).toBeTruthy()
    );
  });

  it("shows the not-found message when detail is null", async () => {
    const user = userEvent.setup();
    mockHooks.useCcControl.mockReturnValue({ data: { control: null }, isLoading: false });
    render(<ControlCatalogDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /^View$/i }));
    await waitFor(() => expect(screen.getByText("Control not found.")).toBeTruthy());
  });

  it("shows Loading while the detail query is in flight", async () => {
    const user = userEvent.setup();
    mockHooks.useCcControl.mockReturnValue({ data: undefined, isLoading: true });
    render(<ControlCatalogDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /^View$/i }));
    await waitFor(() => expect(screen.getByText("Loading…")).toBeTruthy());
  });

  it("renders dash fallbacks for a control with missing optional fields", async () => {
    const user = userEvent.setup();
    mockHooks.useCcControl.mockReturnValue({
      data: { control: { Arn: CONTROL.Arn, Name: "bare" } },
      isLoading: false,
    });
    render(<ControlCatalogDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /^View$/i }));
    await waitFor(() => expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(3));
  });
});
