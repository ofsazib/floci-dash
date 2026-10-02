// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

const mockHooks = vi.hoisted(() => ({
  useAaAnalyzers: vi.fn(),
  useCreateAaAnalyzer: vi.fn(),
  useDeleteAaAnalyzer: vi.fn(),
}));

vi.mock("../../hooks/useAccessAnalyzer", () => mockHooks);

const mockCreate = vi.fn();
const mockDelete = vi.fn();

function okMutation(mock: ReturnType<typeof vi.fn>, isPending = false) {
  return { mutateAsync: mock, isPending };
}

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

const ANALYZER = { arn: "arn:aa", name: "a1", type: "ACCOUNT", status: "ACTIVE" };

import AccessAnalyzerDashboard from "./AccessAnalyzerDashboard";

function modalDlg(header: string): HTMLElement {
  return screen
    .getAllByText(header)
    .map((t) => t.closest('[role="dialog"]'))
    .find((d) => d) as HTMLElement;
}

function dialogButton(dlg: HTMLElement, text: string): HTMLElement {
  return Array.from(dlg.querySelectorAll("button")).find(
    (b) => b.textContent === text
  ) as HTMLElement;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockHooks.useCreateAaAnalyzer.mockReturnValue(okMutation(mockCreate));
  mockHooks.useDeleteAaAnalyzer.mockReturnValue(okMutation(mockDelete));
});

describe("AccessAnalyzerDashboard", () => {
  it("renders analyzers with fields", async () => {
    mockHooks.useAaAnalyzers.mockReturnValue(listQuery("analyzers", [ANALYZER]));
    render(<AccessAnalyzerDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("a1")).toBeTruthy());
    expect(screen.getByText("ACCOUNT")).toBeTruthy();
    expect(screen.getByText("ACTIVE")).toBeTruthy();
  });

  it("shows the empty table message", () => {
    mockHooks.useAaAnalyzers.mockReturnValue(listQuery("analyzers", []));
    render(<AccessAnalyzerDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("No analyzers found")).toBeTruthy();
  });

  it("renders with undefined data (loading)", () => {
    mockHooks.useAaAnalyzers.mockReturnValue(
      listQuery("analyzers", [], { data: undefined, isLoading: true })
    );
    render(<AccessAnalyzerDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Analyzers")).toBeTruthy();
  });

  it("shows the error alert with fallback message", () => {
    mockHooks.useAaAnalyzers.mockReturnValue(
      listQuery("analyzers", [], { isError: true, error: null })
    );
    render(<AccessAnalyzerDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Failed to load analyzers")).toBeTruthy();
  });

  it("creates an analyzer and dismisses the success alert", async () => {
    const user = userEvent.setup();
    mockCreate.mockResolvedValueOnce({ arn: "arn" });
    render(<AccessAnalyzerDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create analyzer/i }));
    await user.type(screen.getByPlaceholderText("my-analyzer"), "a2");
    await user.click(screen.getByRole("button", { name: /^Create$/i }));
    await waitFor(() =>
      expect(mockCreate).toHaveBeenCalledWith({ analyzerName: "a2", type: "ACCOUNT" })
    );
    await waitFor(() => expect(screen.getByText("Analyzer a2 created.")).toBeTruthy());
    fireEvent.click(document.querySelector('[class*="awsui_dismiss-button"]') as HTMLElement);
    await waitFor(() =>
      expect(screen.queryByText("Analyzer a2 created.")).toBeNull()
    );
  });

  it("shows a fallback error when create fails", async () => {
    const user = userEvent.setup();
    mockCreate.mockRejectedValueOnce({});
    render(<AccessAnalyzerDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create analyzer/i }));
    await user.type(screen.getByPlaceholderText("my-analyzer"), "a2");
    await user.click(screen.getByRole("button", { name: /^Create$/i }));
    await waitFor(() => expect(screen.getByText("Failed to create analyzer")).toBeTruthy());
  });

  it("changes the analyzer type input before creating", async () => {
    const user = userEvent.setup();
    mockCreate.mockResolvedValueOnce({ arn: "arn" });
    render(<AccessAnalyzerDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create analyzer/i }));
    const dlg = modalDlg("Create analyzer");
    const inputs = dlg.querySelectorAll("input");
    await user.type(inputs[0] as HTMLElement, "a3");
    await user.type(inputs[1] as HTMLElement, "ORG");
    await user.click(dialogButton(dlg, "Create"));
    await waitFor(() =>
      expect(mockCreate).toHaveBeenCalledWith({ analyzerName: "a3", type: "ACCOUNTORG" })
    );
  });

  it("keeps Create disabled until a name is typed and closes on Cancel and Escape", async () => {
    const user = userEvent.setup();
    render(<AccessAnalyzerDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create analyzer/i }));
    const dlg = modalDlg("Create analyzer");
    const createBtn = dialogButton(dlg, "Create") as HTMLButtonElement;
    expect(createBtn.disabled).toBe(true);
    await user.type(dlg.querySelector("input") as HTMLElement, "x");
    expect(createBtn.disabled).toBe(false);
    await user.click(dialogButton(dlg, "Cancel"));
    await waitFor(() => expect(dlg.className).toContain("hidden"));
    await user.click(screen.getByRole("button", { name: /Create analyzer/i }));
    const dlg2 = modalDlg("Create analyzer");
    document.querySelectorAll('[class*="awsui_dialog"]').forEach((d) => {
      fireEvent.keyDown(d as HTMLElement, { keyCode: 27, key: "Escape" });
    });
    await waitFor(() => expect(dlg2.className).toContain("hidden"));
  });

  it("deletes an analyzer after confirmation", async () => {
    const user = userEvent.setup();
    mockDelete.mockResolvedValueOnce({ ok: true });
    mockHooks.useAaAnalyzers.mockReturnValue(listQuery("analyzers", [ANALYZER]));
    render(<AccessAnalyzerDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("a1")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete a1/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith("a1"));
  });

  it("shows a delete success alert and dismisses it", async () => {
    const user = userEvent.setup();
    mockDelete.mockResolvedValueOnce({ ok: true });
    mockHooks.useAaAnalyzers.mockReturnValue(listQuery("analyzers", [ANALYZER]));
    render(<AccessAnalyzerDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("a1")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete a1/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(screen.getByText("Analyzer a1 deleted.")).toBeTruthy());
    fireEvent.click(document.querySelector('[class*="awsui_dismiss-button"]') as HTMLElement);
    await waitFor(() =>
      expect(screen.queryByText("Analyzer a1 deleted.")).toBeNull()
    );
  });
});
