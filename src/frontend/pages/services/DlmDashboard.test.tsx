// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

const mockHooks = vi.hoisted(() => ({
  useDlmPolicies: vi.fn(),
  useCreateDlmPolicy: vi.fn(),
  useDeleteDlmPolicy: vi.fn(),
}));

vi.mock("../../hooks/useDLM", () => mockHooks);

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

const POLICY = { PolicyId: "p1", Description: "nightly", State: "ENABLED" };

import DlmDashboard from "./DlmDashboard";

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
  mockHooks.useCreateDlmPolicy.mockReturnValue(okMutation(mockCreate));
  mockHooks.useDeleteDlmPolicy.mockReturnValue(okMutation(mockDelete));
});

describe("DlmDashboard", () => {
  it("renders policies with fields", async () => {
    mockHooks.useDlmPolicies.mockReturnValue(listQuery("policies", [POLICY]));
    render(<DlmDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("p1")).toBeTruthy());
    expect(screen.getByText("nightly")).toBeTruthy();
    expect(screen.getByText("ENABLED")).toBeTruthy();
  });

  it("shows the empty table message", () => {
    mockHooks.useDlmPolicies.mockReturnValue(listQuery("policies", []));
    render(<DlmDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("No lifecycle policies found")).toBeTruthy();
  });

  it("renders with undefined data (loading)", () => {
    mockHooks.useDlmPolicies.mockReturnValue(
      listQuery("policies", [], { data: undefined, isLoading: true })
    );
    render(<DlmDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Lifecycle policies")).toBeTruthy();
  });

  it("shows the error alert with fallback message", () => {
    mockHooks.useDlmPolicies.mockReturnValue(
      listQuery("policies", [], { isError: true, error: null })
    );
    render(<DlmDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Failed to load policies")).toBeTruthy();
  });

  it("creates a policy and dismisses the success alert", async () => {
    const user = userEvent.setup();
    mockCreate.mockResolvedValueOnce({ policyId: "p2" });
    render(<DlmDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create lifecycle policy/i }));
    const dlg = modalDlg("Create lifecycle policy");
    const inputs = dlg.querySelectorAll("input");
    await user.type(inputs[0] as HTMLElement, "weekly");
    await user.type(inputs[1] as HTMLElement, "role");
    await user.type(dlg.querySelector("textarea") as HTMLElement, "backup=daily");
    await user.click(dialogButton(dlg, "Create"));
    await waitFor(() =>
      expect(mockCreate).toHaveBeenCalledWith({
        executionRoleArn: "role",
        description: "weekly",
        state: "ENABLED",
        policyDetails: [
          {
            ResourceTypes: ["VOLUME"],
            TargetTags: [{ Key: "backup", Value: "daily" }],
          },
        ],
      })
    );
    await waitFor(() =>
      expect(screen.getByText('Policy "weekly" created.')).toBeTruthy()
    );
    fireEvent.click(document.querySelector('[class*="awsui_dismiss-button"]') as HTMLElement);
    await waitFor(() =>
      expect(screen.queryByText('Policy "weekly" created.')).toBeNull()
    );
  });

  it("shows a fallback error when create fails", async () => {
    const user = userEvent.setup();
    mockCreate.mockRejectedValueOnce({});
    render(<DlmDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create lifecycle policy/i }));
    const dlg = modalDlg("Create lifecycle policy");
    const inputs = dlg.querySelectorAll("input");
    await user.type(inputs[0] as HTMLElement, "w");
    await user.type(inputs[1] as HTMLElement, "r");
    await user.type(dlg.querySelector("textarea") as HTMLElement, "b=d");
    await user.click(dialogButton(dlg, "Create"));
    await waitFor(() => expect(screen.getByText("Failed to create policy")).toBeTruthy());
  });

  it("keeps Create disabled until fields are filled and closes on Cancel", async () => {
    const user = userEvent.setup();
    render(<DlmDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create lifecycle policy/i }));
    const dlg = modalDlg("Create lifecycle policy");
    const createBtn = dialogButton(dlg, "Create") as HTMLButtonElement;
    expect(createBtn.disabled).toBe(true);
    const inputs = dlg.querySelectorAll("input");
    await user.type(inputs[0] as HTMLElement, "d");
    await user.type(inputs[1] as HTMLElement, "r");
    await user.type(dlg.querySelector("textarea") as HTMLElement, "b=d");
    expect(createBtn.disabled).toBe(false);
    await user.click(dialogButton(dlg, "Cancel"));
    await waitFor(() => expect(dlg.className).toContain("hidden"));
    await user.click(screen.getByRole("button", { name: /Create lifecycle policy/i }));
    const dlg2 = modalDlg("Create lifecycle policy");
    document.querySelectorAll('[class*="awsui_dialog"]').forEach((d) => {
      fireEvent.keyDown(d as HTMLElement, { keyCode: 27, key: "Escape" });
    });
    await waitFor(() => expect(dlg2.className).toContain("hidden"));
  });

  it("deletes a policy after confirmation", async () => {
    const user = userEvent.setup();
    mockDelete.mockResolvedValueOnce({ ok: true });
    mockHooks.useDlmPolicies.mockReturnValue(listQuery("policies", [POLICY]));
    render(<DlmDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("p1")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete p1/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith("p1"));
  });

  it("shows a delete success alert and dismisses it", async () => {
    const user = userEvent.setup();
    mockDelete.mockResolvedValueOnce({ ok: true });
    mockHooks.useDlmPolicies.mockReturnValue(listQuery("policies", [POLICY]));
    render(<DlmDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("p1")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete p1/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(screen.getByText("Policy p1 deleted.")).toBeTruthy());
    fireEvent.click(document.querySelector('[class*="awsui_dismiss-button"]') as HTMLElement);
    await waitFor(() =>
      expect(screen.queryByText("Policy p1 deleted.")).toBeNull()
    );
  });
});
