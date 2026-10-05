// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createWrapper } from "../../../test/helpers";
import React from "react";

const mockHooks = vi.hoisted(() => ({
  useDtAdminAccounts: vi.fn(),
  useDtEnableAdmin: vi.fn(),
  useDtGraphs: vi.fn(),
  useDtOrgConfiguration: vi.fn(),
  useDtUpdateOrgConfiguration: vi.fn(),
  useDtMembers: vi.fn(),
  useDtCreateMembers: vi.fn(),
  useDtStartMonitoring: vi.fn(),
}));

vi.mock("../../hooks/useDetective", () => mockHooks);

const mockEnableAdmin = vi.fn();
const mockUpdateOrgConfig = vi.fn();
const mockCreateMembers = vi.fn();
const mockStartMonitoring = vi.fn();

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

const ADMIN = { accountId: "111111111111" };
const GRAPH = { arn: "arn:aws:detective:us-east-1:111111111111:graph:g1" };
const MEMBER_PENDING = {
  accountId: "222222222222",
  emailAddress: "member@example.com",
  status: "ACCEPTED_BUT_DISABLED",
  invitationType: "ORGANIZATION",
};
const MEMBER_ENABLED = {
  accountId: "333333333333",
  emailAddress: "enabled@example.com",
  status: "ENABLED",
  invitationType: "ORGANIZATION",
};

import DetectiveDashboard from "./DetectiveDashboard";

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
  mockHooks.useDtAdminAccounts.mockReturnValue(listQuery("administrators", [ADMIN]));
  mockHooks.useDtGraphs.mockReturnValue(listQuery("graphList", [GRAPH]));
  mockHooks.useDtOrgConfiguration.mockReturnValue({ data: { autoEnable: true }, isLoading: false });
  mockHooks.useDtMembers.mockReturnValue(listQuery("memberDetails", [MEMBER_PENDING, MEMBER_ENABLED]));
  mockHooks.useDtEnableAdmin.mockReturnValue(okMutation(mockEnableAdmin));
  mockHooks.useDtUpdateOrgConfiguration.mockReturnValue(okMutation(mockUpdateOrgConfig));
  mockHooks.useDtCreateMembers.mockReturnValue(okMutation(mockCreateMembers));
  mockHooks.useDtStartMonitoring.mockReturnValue(okMutation(mockStartMonitoring));
});

describe("DetectiveDashboard — graph tab", () => {
  it("renders the graph and members", () => {
    render(<DetectiveDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(GRAPH.arn)).toBeTruthy();
    expect(screen.getByText("222222222222")).toBeTruthy();
    expect(screen.getByText("ACCEPTED_BUT_DISABLED")).toBeTruthy();
    expect(screen.getByText("member@example.com")).toBeTruthy();
    expect(screen.getByText("333333333333")).toBeTruthy();
    expect(screen.getAllByText("ORGANIZATION").length).toBe(2);
  });

  it("starts monitoring a non-enabled member", async () => {
    const user = userEvent.setup();
    mockStartMonitoring.mockResolvedValueOnce({ monitoring: true });
    render(<DetectiveDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Start monitoring/i }));
    await waitFor(() =>
      expect(mockStartMonitoring).toHaveBeenCalledWith({
        graphArn: GRAPH.arn,
        accountId: "222222222222",
      })
    );
    await waitFor(() =>
      expect(screen.getByText("Monitoring started for 222222222222.")).toBeTruthy()
    );
    fireEvent.click(document.querySelector('[class*="awsui_dismiss-button"]') as HTMLElement);
    await waitFor(() =>
      expect(screen.queryByText("Monitoring started for 222222222222.")).toBeNull()
    );
  });

  it("shows a fallback error when starting monitoring fails", async () => {
    const user = userEvent.setup();
    mockStartMonitoring.mockRejectedValueOnce({});
    render(<DetectiveDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Start monitoring/i }));
    await waitFor(() => expect(screen.getByText("Request failed")).toBeTruthy());
  });

  it("shows the no-graph empty state", () => {
    mockHooks.useDtGraphs.mockReturnValue(listQuery("graphList", []));
    mockHooks.useDtMembers.mockReturnValue(listQuery("memberDetails", []));
    render(<DetectiveDashboard />, { wrapper: createWrapper() });
    expect(
      screen.getByText(/No behavior graph found/)
    ).toBeTruthy();
  });

  it("shows Loading while graphs load", () => {
    mockHooks.useDtGraphs.mockReturnValue(listQuery("graphList", [], { data: undefined, isLoading: true }));
    mockHooks.useDtAdminAccounts.mockReturnValue(listQuery("administrators", [], { data: undefined }));
    mockHooks.useDtMembers.mockReturnValue(listQuery("memberDetails", [], { data: undefined }));
    render(<DetectiveDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Loading…")).toBeTruthy();
  });

  it("adds a member from the modal and closes it", async () => {
    const user = userEvent.setup();
    mockCreateMembers.mockResolvedValueOnce({ members: [], unprocessedAccounts: [] });
    render(<DetectiveDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create member/i }));
    const dlg = modalDlg("Add member account");
    const dialogInputs = Array.from(dlg.querySelectorAll("input")) as HTMLElement[];
    await user.type(dialogInputs[0], "222222222222");
    await user.type(dialogInputs[1], "member@example.com");
    await user.click(dialogButton(dlg, "Add"));
    await waitFor(() =>
      expect(mockCreateMembers).toHaveBeenCalledWith({
        graphArn: GRAPH.arn,
        accounts: [{ accountId: "222222222222", emailAddress: "member@example.com" }],
      })
    );
    await waitFor(() => expect(screen.getByText("Member 222222222222 added.")).toBeTruthy());
    await waitFor(() => expect(dlg.className).toContain("hidden"));
  });

  it("shows a fallback error when adding a member fails", async () => {
    const user = userEvent.setup();
    mockCreateMembers.mockRejectedValueOnce({});
    render(<DetectiveDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create member/i }));
    const dlg = modalDlg("Add member account");
    const dialogInputs = Array.from(dlg.querySelectorAll("input")) as HTMLElement[];
    await user.type(dialogInputs[0], "222222222222");
    await user.click(dialogButton(dlg, "Add"));
    await waitFor(() => expect(screen.getByText("Request failed")).toBeTruthy());
  });

  it("keeps Add disabled without an account id and closes on cancel", async () => {
    const user = userEvent.setup();
    render(<DetectiveDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create member/i }));
    const dlg = modalDlg("Add member account");
    const addBtn = dialogButton(dlg, "Add") as HTMLButtonElement;
    expect(addBtn.disabled).toBe(true);
    await user.type(dlg.querySelectorAll("input")[0] as HTMLElement, "2");
    expect(addBtn.disabled).toBe(false);
    await user.click(dialogButton(dlg, "Cancel"));
    await waitFor(() => expect(dlg.className).toContain("hidden"));
  });
});

describe("DetectiveDashboard — organization tab", () => {
  it("renders administrators and the org configuration", async () => {
    const user = userEvent.setup();
    render(<DetectiveDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Organization/ }));
    await waitFor(() => expect(screen.getByText("111111111111")).toBeTruthy());
    expect(screen.getByText("Auto-enable member accounts: Yes")).toBeTruthy();
  });

  it("shows Loading while the org configuration is in flight", async () => {
    const user = userEvent.setup();
    mockHooks.useDtOrgConfiguration.mockReturnValue({ data: undefined, isLoading: true });
    render(<DetectiveDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Organization/ }));
    await waitFor(() => expect(screen.getByText("Loading…")).toBeTruthy());
  });

  it("shows the No arm when auto-enable is off", async () => {
    const user = userEvent.setup();
    mockHooks.useDtOrgConfiguration.mockReturnValue({ data: { autoEnable: false }, isLoading: false });
    render(<DetectiveDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Organization/ }));
    await waitFor(() =>
      expect(screen.getByText("Auto-enable member accounts: No")).toBeTruthy()
    );
  });

  it("updates the org configuration and dismisses the alert", async () => {
    const user = userEvent.setup();
    mockUpdateOrgConfig.mockResolvedValueOnce({ updated: true });
    render(<DetectiveDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Organization/ }));
    await user.click(document.querySelector('input[type="checkbox"]') as HTMLElement);
    await user.click(screen.getByRole("button", { name: /Update configuration/i }));
    await waitFor(() =>
      expect(mockUpdateOrgConfig).toHaveBeenCalledWith({
        graphArn: GRAPH.arn,
        autoEnable: true,
      })
    );
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
    render(<DetectiveDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Organization/ }));
    await user.click(screen.getByRole("button", { name: /Update configuration/i }));
    await waitFor(() => expect(screen.getByText("Request failed")).toBeTruthy());
  });

  it("enables an administrator from the modal, validates, and closes", async () => {
    const user = userEvent.setup();
    mockEnableAdmin.mockResolvedValueOnce({ enabled: true });
    render(<DetectiveDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Organization/ }));
    await user.click(screen.getByRole("button", { name: /Create administrator/i }));
    const dlg = modalDlg("Enable Detective administrator");
    const enableBtn = dialogButton(dlg, "Enable") as HTMLButtonElement;
    expect(enableBtn.disabled).toBe(true);
    await user.type(dlg.querySelector("input") as HTMLElement, "444444444444");
    expect(enableBtn.disabled).toBe(false);
    await user.click(enableBtn);
    await waitFor(() => expect(mockEnableAdmin).toHaveBeenCalledWith("444444444444"));
    await waitFor(() =>
      expect(screen.getByText("Detective administrator 444444444444 enabled.")).toBeTruthy()
    );
    await waitFor(() => expect(dlg.className).toContain("hidden"));
  });

  it("retains typed input after cancel and closes on escape", async () => {
    const user = userEvent.setup();
    render(<DetectiveDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Organization/ }));
    await user.click(screen.getByRole("button", { name: /Create administrator/i }));
    const dlg = modalDlg("Enable Detective administrator");
    await user.type(dlg.querySelector("input") as HTMLElement, "4");
    await user.click(dialogButton(dlg, "Cancel"));
    await waitFor(() => expect(dlg.className).toContain("hidden"));
    await user.click(screen.getByRole("button", { name: /Create administrator/i }));
    const dlg2 = modalDlg("Enable Detective administrator");
    expect((dlg2.querySelector("input") as HTMLInputElement).value).toBe("4");
    document.querySelectorAll('[class*="awsui_dialog"]').forEach((d) => {
      fireEvent.keyDown(d as HTMLElement, { keyCode: 27, key: "Escape" });
    });
    await waitFor(() => expect(dlg2.className).toContain("hidden"));
  });
});
