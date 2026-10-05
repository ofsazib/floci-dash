// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createWrapper } from "../../../test/helpers";
import React from "react";

const mockHooks = vi.hoisted(() => ({
  useMcSession: vi.fn(),
  useMcEnableSession: vi.fn(),
  useMcAdminAccounts: vi.fn(),
  useMcEnableAdmin: vi.fn(),
  useMcOrgConfiguration: vi.fn(),
  useMcUpdateOrgConfiguration: vi.fn(),
  useMcMembers: vi.fn(),
  useMcCreateMember: vi.fn(),
}));

vi.mock("../../hooks/useMacie2", () => mockHooks);

const mockEnableSession = vi.fn();
const mockEnableAdmin = vi.fn();
const mockUpdateOrgConfig = vi.fn();
const mockCreateMember = vi.fn();

function okMutation(mock: ReturnType<typeof vi.fn>, isPending = false) {
  return { mutateAsync: mock, isPending };
}

function listQuery(key: string, items: unknown[], overrides: Record<string, unknown> = {}) {
  return {
    data: { [key]: items },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  };
}

const ADMIN = { accountId: "111111111111", status: "ENABLED" };
const MEMBER = {
  accountId: "222222222222",
  email: "member@example.com",
  relationshipStatus: "Created",
  administratorAccountId: "111111111111",
};

import Macie2Dashboard from "./Macie2Dashboard";

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

function checkbox(): HTMLInputElement {
  return document.querySelector('input[type="checkbox"]') as HTMLInputElement;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockHooks.useMcSession.mockReturnValue({
    data: { enabled: true, status: "ENABLED", serviceRole: "arn:role" },
    isLoading: false,
  });
  mockHooks.useMcAdminAccounts.mockReturnValue(listQuery("adminAccounts", [ADMIN]));
  mockHooks.useMcOrgConfiguration.mockReturnValue({
    data: { autoEnable: true },
    isLoading: false,
  });
  mockHooks.useMcMembers.mockReturnValue(listQuery("members", [MEMBER]));
  mockHooks.useMcEnableSession.mockReturnValue(okMutation(mockEnableSession));
  mockHooks.useMcEnableAdmin.mockReturnValue(okMutation(mockEnableAdmin));
  mockHooks.useMcUpdateOrgConfiguration.mockReturnValue(okMutation(mockUpdateOrgConfig));
  mockHooks.useMcCreateMember.mockReturnValue(okMutation(mockCreateMember));
});

describe("Macie2Dashboard — session tab", () => {
  it("renders the enabled session", () => {
    render(<Macie2Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Status: ENABLED")).toBeTruthy();
    expect(screen.getByText("Service role: arn:role")).toBeTruthy();
  });

  it("shows Loading while the session query is in flight", () => {
    mockHooks.useMcSession.mockReturnValue({ data: undefined, isLoading: true });
    mockHooks.useMcAdminAccounts.mockReturnValue(listQuery("adminAccounts", [], { data: undefined }));
    mockHooks.useMcMembers.mockReturnValue(listQuery("members", [], { data: undefined }));
    render(<Macie2Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Loading…")).toBeTruthy();
  });

  it("offers to enable Macie when the session is absent", async () => {
    const user = userEvent.setup();
    mockHooks.useMcSession.mockReturnValue({ data: { enabled: false }, isLoading: false });
    mockEnableSession.mockResolvedValueOnce({ enabled: true });
    render(<Macie2Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Macie is not enabled for this account.")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /Enable Macie/i }));
    await waitFor(() => expect(mockEnableSession).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText("Macie session enabled.")).toBeTruthy());
    fireEvent.click(document.querySelector('[class*="awsui_dismiss-button"]') as HTMLElement);
    await waitFor(() =>
      expect(screen.queryByText("Macie session enabled.")).toBeNull()
    );
  });

  it("shows a fallback error when enabling fails", async () => {
    const user = userEvent.setup();
    mockHooks.useMcSession.mockReturnValue({ data: { enabled: false }, isLoading: false });
    mockEnableSession.mockRejectedValueOnce({});
    render(<Macie2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Enable Macie/i }));
    await waitFor(() => expect(screen.getByText("Request failed")).toBeTruthy());
  });
});

describe("Macie2Dashboard — members tab", () => {
  it("renders members", async () => {
    const user = userEvent.setup();
    render(<Macie2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Members/ }));
    await waitFor(() => expect(screen.getByText("222222222222")).toBeTruthy());
    expect(screen.getByText("member@example.com")).toBeTruthy();
    expect(screen.getByText("Created")).toBeTruthy();
  });

  it("adds a member from the modal and closes it", async () => {
    const user = userEvent.setup();
    mockCreateMember.mockResolvedValueOnce({ arn: "arn:member" });
    render(<Macie2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Members/ }));
    await user.click(screen.getByRole("button", { name: /Create member/i }));
    const dlg = modalDlg("Add member account");
    const dialogInputs = Array.from(dlg.querySelectorAll("input")) as HTMLElement[];
    await user.type(dialogInputs[0], "222222222222");
    await user.type(dialogInputs[1], "member@example.com");
    await user.click(dialogButton(dlg, "Add"));
    await waitFor(() =>
      expect(mockCreateMember).toHaveBeenCalledWith({
        accountId: "222222222222",
        email: "member@example.com",
      })
    );
    await waitFor(() => expect(screen.getByText("Member 222222222222 added.")).toBeTruthy());
    await waitFor(() => expect(dlg.className).toContain("hidden"));
  });

  it("keeps Add disabled until account id and email are typed", async () => {
    const user = userEvent.setup();
    render(<Macie2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Members/ }));
    await user.click(screen.getByRole("button", { name: /Create member/i }));
    const dlg = modalDlg("Add member account");
    const addBtn = dialogButton(dlg, "Add") as HTMLButtonElement;
    expect(addBtn.disabled).toBe(true);
    const dialogInputs = Array.from(dlg.querySelectorAll("input")) as HTMLElement[];
    await user.type(dialogInputs[0], "2");
    expect(addBtn.disabled).toBe(true);
    await user.type(dialogInputs[1], "m@e.c");
    expect(addBtn.disabled).toBe(false);
    await user.click(dialogButton(dlg, "Cancel"));
    await waitFor(() => expect(dlg.className).toContain("hidden"));
  });

  it("shows a fallback error when adding a member fails", async () => {
    const user = userEvent.setup();
    mockCreateMember.mockRejectedValueOnce({});
    render(<Macie2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Members/ }));
    await user.click(screen.getByRole("button", { name: /Create member/i }));
    const dlg = modalDlg("Add member account");
    const dialogInputs = Array.from(dlg.querySelectorAll("input")) as HTMLElement[];
    await user.type(dialogInputs[0], "222222222222");
    await user.type(dialogInputs[1], "member@example.com");
    await user.click(dialogButton(dlg, "Add"));
    await waitFor(() => expect(screen.getByText("Request failed")).toBeTruthy());
  });
});

describe("Macie2Dashboard — organization tab", () => {
  it("renders administrators and the org configuration", async () => {
    const user = userEvent.setup();
    render(<Macie2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Organization/ }));
    await waitFor(() => expect(screen.getByText("111111111111")).toBeTruthy());
    expect(screen.getByText("Auto-enable member accounts: Yes")).toBeTruthy();
  });

  it("shows the No arm when auto-enable is off", async () => {
    const user = userEvent.setup();
    mockHooks.useMcOrgConfiguration.mockReturnValue({
      data: { autoEnable: false },
      isLoading: false,
    });
    render(<Macie2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Organization/ }));
    await waitFor(() =>
      expect(screen.getByText("Auto-enable member accounts: No")).toBeTruthy()
    );
  });

  it("shows Loading while the org configuration is in flight", async () => {
    const user = userEvent.setup();
    mockHooks.useMcOrgConfiguration.mockReturnValue({ data: undefined, isLoading: true });
    render(<Macie2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Organization/ }));
    await waitFor(() => expect(screen.getByText("Loading…")).toBeTruthy());
  });

  it("toggles auto-enable on and updates the configuration", async () => {
    const user = userEvent.setup();
    mockUpdateOrgConfig.mockResolvedValueOnce({ updated: true });
    render(<Macie2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Organization/ }));
    await user.click(checkbox());
    await user.click(screen.getByRole("button", { name: /Update configuration/i }));
    await waitFor(() => expect(mockUpdateOrgConfig).toHaveBeenCalledWith(true));
    await waitFor(() =>
      expect(screen.getByText("Organization configuration updated.")).toBeTruthy()
    );
    fireEvent.click(document.querySelector('[class*="awsui_dismiss-button"]') as HTMLElement);
    await waitFor(() =>
      expect(screen.queryByText("Organization configuration updated.")).toBeNull()
    );
  });

  it("shows a fallback error when the org update fails", async () => {
    const user = userEvent.setup();
    mockUpdateOrgConfig.mockRejectedValueOnce({});
    render(<Macie2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Organization/ }));
    await user.click(screen.getByRole("button", { name: /Update configuration/i }));
    await waitFor(() => expect(screen.getByText("Request failed")).toBeTruthy());
  });

  it("enables an administrator from the modal, validates, and closes", async () => {
    const user = userEvent.setup();
    mockEnableAdmin.mockResolvedValueOnce({ enabled: true });
    render(<Macie2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Organization/ }));
    await user.click(screen.getByRole("button", { name: /Create administrator/i }));
    const dlg = modalDlg("Enable Macie administrator");
    const enableBtn = dialogButton(dlg, "Enable") as HTMLButtonElement;
    expect(enableBtn.disabled).toBe(true);
    await user.type(dlg.querySelector("input") as HTMLElement, "444444444444");
    expect(enableBtn.disabled).toBe(false);
    await user.click(enableBtn);
    await waitFor(() => expect(mockEnableAdmin).toHaveBeenCalledWith("444444444444"));
    await waitFor(() =>
      expect(screen.getByText("Macie administrator 444444444444 enabled.")).toBeTruthy()
    );
    await waitFor(() => expect(dlg.className).toContain("hidden"));
  });

  it("cancels the administrator modal and closes on escape", async () => {
    const user = userEvent.setup();
    render(<Macie2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Organization/ }));
    await user.click(screen.getByRole("button", { name: /Create administrator/i }));
    const dlg = modalDlg("Enable Macie administrator");
    await user.click(dialogButton(dlg, "Cancel"));
    await waitFor(() => expect(dlg.className).toContain("hidden"));
    await user.click(screen.getByRole("button", { name: /Create administrator/i }));
    const dlg2 = modalDlg("Enable Macie administrator");
    document.querySelectorAll('[class*="awsui_dialog"]').forEach((d) => {
      fireEvent.keyDown(d as HTMLElement, { keyCode: 27, key: "Escape" });
    });
    await waitFor(() => expect(dlg2.className).toContain("hidden"));
  });
});
