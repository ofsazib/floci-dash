// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

const mockHooks = vi.hoisted(() => ({
  useI2DelegatedAdmins: vi.fn(),
  useI2EnableDelegatedAdmin: vi.fn(),
  useI2DisableDelegatedAdmin: vi.fn(),
  useI2OrgConfiguration: vi.fn(),
  useI2UpdateOrgConfiguration: vi.fn(),
}));

vi.mock("../../hooks/useInspector2", () => mockHooks);

const mockEnableAdmin = vi.fn();
const mockDisableAdmin = vi.fn();
const mockUpdateOrg = vi.fn();

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

const ADMIN = { accountId: "111111111111", status: "ENABLED" };

import Inspector2Dashboard from "./Inspector2Dashboard";

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
  mockHooks.useI2DelegatedAdmins.mockReturnValue(listQuery("delegatedAdminAccounts", [ADMIN]));
  mockHooks.useI2OrgConfiguration.mockReturnValue({
    data: { organizationConfiguration: { ec2: true, ecr: false } },
    isLoading: false,
  });
  mockHooks.useI2EnableDelegatedAdmin.mockReturnValue(okMutation(mockEnableAdmin));
  mockHooks.useI2DisableDelegatedAdmin.mockReturnValue(okMutation(mockDisableAdmin));
  mockHooks.useI2UpdateOrgConfiguration.mockReturnValue(okMutation(mockUpdateOrg));
});

describe("Inspector2Dashboard — delegated admins tab", () => {
  it("renders delegated admins", async () => {
    render(<Inspector2Dashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("111111111111")).toBeTruthy());
    expect(screen.getByText("ENABLED")).toBeTruthy();
  });

  it("shows the empty table message", () => {
    mockHooks.useI2DelegatedAdmins.mockReturnValue(listQuery("delegatedAdminAccounts", []));
    render(<Inspector2Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("No delegated admins found")).toBeTruthy();
  });

  it("renders with undefined data (loading)", () => {
    mockHooks.useI2DelegatedAdmins.mockReturnValue(
      listQuery("delegatedAdminAccounts", [], { data: undefined, isLoading: true })
    );
    render(<Inspector2Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Delegated admins (0)")).toBeTruthy();
  });

  it("shows the error alert with fallback message", () => {
    mockHooks.useI2DelegatedAdmins.mockReturnValue(
      listQuery("delegatedAdminAccounts", [], { isError: true, error: null })
    );
    render(<Inspector2Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Failed to load delegated admins")).toBeTruthy();
  });

  it("shows the error alert with the server message", () => {
    mockHooks.useI2DelegatedAdmins.mockReturnValue(
      listQuery("delegatedAdminAccounts", [], { isError: true, error: new Error("denied") })
    );
    render(<Inspector2Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("denied")).toBeTruthy();
  });

  it("enables a delegated admin and dismisses the success alert", async () => {
    const user = userEvent.setup();
    mockEnableAdmin.mockResolvedValueOnce({ delegatedAdminAccountId: "a2" });
    render(<Inspector2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create delegated admin/i }));
    await user.type(screen.getByPlaceholderText("111111111111"), "222222222222");
    await user.click(dialogButton(modalDlg("Enable delegated admin"), "Enable"));
    await waitFor(() => expect(mockEnableAdmin).toHaveBeenCalledWith("222222222222"));
    await waitFor(() =>
      expect(screen.getByText("Delegated admin 222222222222 enabled.")).toBeTruthy()
    );
    fireEvent.click(document.querySelector('[class*="awsui_dismiss-button"]') as HTMLElement);
    await waitFor(() =>
      expect(screen.queryByText("Delegated admin 222222222222 enabled.")).toBeNull()
    );
  });

  it("keeps Enable disabled until an account id is typed and closes on Cancel", async () => {
    const user = userEvent.setup();
    render(<Inspector2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create delegated admin/i }));
    const dlg = modalDlg("Enable delegated admin");
    const enableBtn = dialogButton(dlg, "Enable") as HTMLButtonElement;
    expect(enableBtn.disabled).toBe(true);
    await user.type(dlg.querySelector("input") as HTMLElement, "2");
    expect(enableBtn.disabled).toBe(false);
    await user.click(dialogButton(dlg, "Cancel"));
    await waitFor(() => expect(dlg.className).toContain("hidden"));
    await user.click(screen.getByRole("button", { name: /Create delegated admin/i }));
    const dlg2 = modalDlg("Enable delegated admin");
    document.querySelectorAll('[class*="awsui_dialog"]').forEach((d) => {
      fireEvent.keyDown(d as HTMLElement, { keyCode: 27, key: "Escape" });
    });
    await waitFor(() => expect(dlg2.className).toContain("hidden"));
  });

  it("deletes a delegated admin after confirmation", async () => {
    const user = userEvent.setup();
    mockDisableAdmin.mockResolvedValueOnce({ delegatedAdminAccountId: "111111111111" });
    render(<Inspector2Dashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("111111111111")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete 111111111111/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDisableAdmin).toHaveBeenCalledWith("111111111111"));
  });
});

describe("Inspector2Dashboard — organization tab", () => {
  it("shows auto-enable values", async () => {
    const user = userEvent.setup();
    render(<Inspector2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Organization/ }));
    await waitFor(() => expect(screen.getByText("ec2: Yes")).toBeTruthy());
    expect(screen.getByText("ecr: No")).toBeTruthy();
  });

  it("shows the not-found message when org config is null", async () => {
    const user = userEvent.setup();
    mockHooks.useI2OrgConfiguration.mockReturnValue({
      data: { organizationConfiguration: null },
      isLoading: false,
    });
    render(<Inspector2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Organization/ }));
    await waitFor(() =>
      expect(screen.getByText("No organization configuration found.")).toBeTruthy()
    );
  });

  it("shows Loading while the org config query is in flight", async () => {
    const user = userEvent.setup();
    mockHooks.useI2OrgConfiguration.mockReturnValue({ data: undefined, isLoading: true });
    render(<Inspector2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Organization/ }));
    await waitFor(() => expect(screen.getByText("Loading…")).toBeTruthy());
  });

  it("refreshes the configuration and dismisses the success alert", async () => {
    const user = userEvent.setup();
    mockUpdateOrg.mockResolvedValueOnce({ organizationConfiguration: null });
    render(<Inspector2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Organization/ }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Refresh configuration/i })).toBeTruthy()
    );
    await user.click(screen.getByRole("button", { name: /Refresh configuration/i }));
    await waitFor(() =>
      expect(mockUpdateOrg).toHaveBeenCalledWith({ ec2: true, ecr: false })
    );
    await waitFor(() =>
      expect(screen.getByText("Organization configuration refreshed.")).toBeTruthy()
    );
    fireEvent.click(document.querySelector('[class*="awsui_dismiss-button"]') as HTMLElement);
    await waitFor(() =>
      expect(screen.queryByText("Organization configuration refreshed.")).toBeNull()
    );
  });

  it("shows a fallback error when the refresh fails", async () => {
    const user = userEvent.setup();
    mockUpdateOrg.mockRejectedValueOnce({});
    render(<Inspector2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Organization/ }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Refresh configuration/i })).toBeTruthy()
    );
    await user.click(screen.getByRole("button", { name: /Refresh configuration/i }));
    await waitFor(() => expect(screen.getByText("Request failed")).toBeTruthy());
  });
});
