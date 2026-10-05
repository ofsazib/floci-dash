// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

const mockHooks = vi.hoisted(() => ({
  useShHub: vi.fn(),
  useShEnableHub: vi.fn(),
  useShUpdateHub: vi.fn(),
  useShAdminAccounts: vi.fn(),
  useShEnableAdmin: vi.fn(),
  useShOrgConfiguration: vi.fn(),
  useShUpdateOrgConfiguration: vi.fn(),
  useShAggregators: vi.fn(),
  useShCreateAggregator: vi.fn(),
  useShUpdateAggregator: vi.fn(),
  useShPolicies: vi.fn(),
  useShCreatePolicy: vi.fn(),
  useShAssociations: vi.fn(),
  useShAssociate: vi.fn(),
  useShDisassociate: vi.fn(),
}));

vi.mock("../../hooks/useSecurityHub", () => mockHooks);

const mockEnableHub = vi.fn();
const mockUpdateHub = vi.fn();
const mockEnableAdmin = vi.fn();
const mockUpdateOrgConfig = vi.fn();
const mockCreateAggregator = vi.fn();
const mockUpdateAggregator = vi.fn();
const mockCreatePolicy = vi.fn();
const mockAssociate = vi.fn();
const mockDisassociate = vi.fn();

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
const POLICY = { id: "p1", name: "baseline", serviceEnabled: true, updatedAt: "2026-10-01T00:00:00Z" };
const DISABLED_POLICY = { id: "p2", name: "permissive", serviceEnabled: false, updatedAt: "2026-10-01T01:00:00Z" };
const ASSOC = {
  targetId: "111111111111",
  targetType: "ACCOUNT",
  configurationPolicyId: "p1",
  associationStatus: "SUCCESS",
};

function hubQuery(enabled: boolean, overrides: Record<string, unknown> = {}) {
  return {
    data: enabled
      ? { enabled: true, hubArn: "arn:hub", autoEnableControls: true, controlFindingGenerator: "SECURITY_CONTROL" }
      : { enabled: false },
    isLoading: false,
    ...overrides,
  };
}

import SecurityHubDashboard from "./SecurityHubDashboard";

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
  mockHooks.useShHub.mockReturnValue(hubQuery(true));
  mockHooks.useShAdminAccounts.mockReturnValue(listQuery("adminAccounts", [ADMIN]));
  mockHooks.useShOrgConfiguration.mockReturnValue({
    data: {
      autoEnable: false,
      autoEnableStandards: "DEFAULT",
      organizationConfiguration: { configurationType: "LOCAL", status: "ENABLED" },
    },
    isLoading: false,
  });
  mockHooks.useShAggregators.mockReturnValue(listQuery("findingAggregators", []));
  mockHooks.useShPolicies.mockReturnValue(
    listQuery("configurationPolicySummaries", [POLICY, DISABLED_POLICY])
  );
  mockHooks.useShAssociations.mockReturnValue(
    listQuery("configurationPolicyAssociationSummaries", [ASSOC])
  );
  mockHooks.useShEnableHub.mockReturnValue(okMutation(mockEnableHub));
  mockHooks.useShUpdateHub.mockReturnValue(okMutation(mockUpdateHub));
  mockHooks.useShEnableAdmin.mockReturnValue(okMutation(mockEnableAdmin));
  mockHooks.useShUpdateOrgConfiguration.mockReturnValue(okMutation(mockUpdateOrgConfig));
  mockHooks.useShCreateAggregator.mockReturnValue(okMutation(mockCreateAggregator));
  mockHooks.useShUpdateAggregator.mockReturnValue(okMutation(mockUpdateAggregator));
  mockHooks.useShCreatePolicy.mockReturnValue(okMutation(mockCreatePolicy));
  mockHooks.useShAssociate.mockReturnValue(okMutation(mockAssociate));
  mockHooks.useShDisassociate.mockReturnValue(okMutation(mockDisassociate));
});

describe("SecurityHubDashboard — hub tab", () => {
  it("renders the enabled hub", () => {
    render(<SecurityHubDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Hub ARN: arn:hub")).toBeTruthy();
    expect(screen.getByText("Control finding generator: SECURITY_CONTROL")).toBeTruthy();
  });

  it("saves the hub configuration and dismisses the alert", async () => {
    const user = userEvent.setup();
    mockUpdateHub.mockResolvedValueOnce({ updated: true });
    render(<SecurityHubDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Save configuration/i }));
    await waitFor(() =>
      expect(mockUpdateHub).toHaveBeenCalledWith({
        autoEnableControls: true,
        controlFindingGenerator: "SECURITY_CONTROL",
      })
    );
    await waitFor(() => expect(screen.getByText("Hub configuration updated.")).toBeTruthy());
    fireEvent.click(document.querySelector('[class*="awsui_dismiss-button"]') as HTMLElement);
    await waitFor(() =>
      expect(screen.queryByText("Hub configuration updated.")).toBeNull()
    );
  });

  it("shows a fallback error when saving fails", async () => {
    const user = userEvent.setup();
    mockUpdateHub.mockRejectedValueOnce({});
    render(<SecurityHubDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Save configuration/i }));
    await waitFor(() => expect(screen.getByText("Request failed")).toBeTruthy());
  });

  it("offers to enable the hub when it is not enabled", async () => {
    const user = userEvent.setup();
    mockHooks.useShHub.mockReturnValue(hubQuery(false));
    mockEnableHub.mockResolvedValueOnce({ enabled: true });
    render(<SecurityHubDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Security Hub is not enabled for this account.")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /Enable Security Hub/i }));
    await waitFor(() => expect(mockEnableHub).toHaveBeenCalledWith("SECURITY_CONTROL"));
    await waitFor(() => expect(screen.getByText("Security Hub enabled.")).toBeTruthy());
  });

  it("shows Loading while the hub query is in flight", () => {
    mockHooks.useShHub.mockReturnValue(hubQuery(true, { data: undefined, isLoading: true }));
    render(<SecurityHubDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Loading…")).toBeTruthy();
  });
});

describe("SecurityHubDashboard — organization tab", () => {
  it("renders delegated admins and org configuration", async () => {
    const user = userEvent.setup();
    render(<SecurityHubDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Organization/ }));
    await waitFor(() => expect(screen.getByText("111111111111")).toBeTruthy());
    expect(screen.getByText("Configuration type: LOCAL")).toBeTruthy();
    expect(screen.getByText("Status: ENABLED")).toBeTruthy();
    expect(screen.getByText("Auto-enable standards: DEFAULT")).toBeTruthy();
  });

  it("updates the org configuration with the toggle default", async () => {
    const user = userEvent.setup();
    mockUpdateOrgConfig.mockResolvedValueOnce({ updated: true });
    render(<SecurityHubDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Organization/ }));
    await user.click(screen.getByRole("button", { name: /Update configuration/i }));
    await waitFor(() =>
      expect(mockUpdateOrgConfig).toHaveBeenCalledWith({
        autoEnable: false,
        autoEnableStandards: "DEFAULT",
      })
    );
    await waitFor(() =>
      expect(screen.getByText("Organization configuration updated.")).toBeTruthy()
    );
  });

  it("shows a fallback error when the org update fails", async () => {
    const user = userEvent.setup();
    mockUpdateOrgConfig.mockRejectedValueOnce({});
    render(<SecurityHubDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Organization/ }));
    await user.click(screen.getByRole("button", { name: /Update configuration/i }));
    await waitFor(() => expect(screen.getByText("Request failed")).toBeTruthy());
  });

  it("shows Loading while the org configuration is in flight", async () => {
    const user = userEvent.setup();
    mockHooks.useShOrgConfiguration.mockReturnValue({ data: undefined, isLoading: true });
    render(<SecurityHubDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Organization/ }));
    await waitFor(() => expect(screen.getByText("Loading…")).toBeTruthy());
  });

  it("opens the delegated admin modal, validates, enables, and closes", async () => {
    const user = userEvent.setup();
    mockEnableAdmin.mockResolvedValueOnce({ adminAccountId: "222222222222" });
    render(<SecurityHubDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Organization/ }));
    await user.click(screen.getByRole("button", { name: /Create delegated admin/i }));
    const dlg = modalDlg("Enable delegated administrator");
    const enableBtn = dialogButton(dlg, "Enable") as HTMLButtonElement;
    expect(enableBtn.disabled).toBe(true);
    await user.type(dlg.querySelector("input") as HTMLElement, "222222222222");
    expect(enableBtn.disabled).toBe(false);
    await user.click(enableBtn);
    await waitFor(() => expect(mockEnableAdmin).toHaveBeenCalledWith({ accountId: "222222222222" }));
    await waitFor(() =>
      expect(screen.getByText("Delegated administrator 222222222222 enabled.")).toBeTruthy()
    );
    await waitFor(() => expect(dlg.className).toContain("hidden"));
  });
});

describe("SecurityHubDashboard — aggregator tab", () => {
  it("updates an existing aggregator, trimming and dropping empty regions", async () => {
    const user = userEvent.setup();
    mockHooks.useShAggregators.mockReturnValue(
      listQuery("findingAggregators", [{ findingAggregatorArn: "arn:agg" }])
    );
    mockUpdateAggregator.mockResolvedValueOnce({ findingAggregatorArn: "arn:agg" });
    render(<SecurityHubDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Finding aggregator/ }));
    await waitFor(() => expect(screen.getByText("ARN: arn:agg")).toBeTruthy());
    const inputs = screen
      .getAllByRole("textbox")
      .filter((el) => (el as HTMLInputElement).value.includes("ALL_REGIONS"));
    await user.clear(inputs[0] as HTMLElement);
    await user.type(inputs[0] as HTMLElement, "SPECIFIED_REGIONS");
    const regionInput = screen.getAllByPlaceholderText("regions-csv")[0];
    await user.type(regionInput, "us-east-1, eu-west-1,");
    await user.click(screen.getByRole("button", { name: /Update aggregator/i }));
    await waitFor(() =>
      expect(mockUpdateAggregator).toHaveBeenCalledWith({
        findingAggregatorArn: "arn:agg",
        regionLinkingMode: "SPECIFIED_REGIONS",
        regions: ["us-east-1", "eu-west-1"],
      })
    );
  });

  it("creates an aggregator from the empty state and closes the modal", async () => {
    const user = userEvent.setup();
    mockCreateAggregator.mockResolvedValueOnce({ findingAggregatorArn: "arn:agg" });
    render(<SecurityHubDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Finding aggregator/ }));
    expect(screen.getByText("No finding aggregator configured.")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /Create finding aggregator/i }));
    const dlg = modalDlg("Create finding aggregator");
    await user.click(dialogButton(dlg, "Create"));
    await waitFor(() =>
      expect(mockCreateAggregator).toHaveBeenCalledWith({
        regionLinkingMode: "ALL_REGIONS",
        regions: [],
      })
    );
    await waitFor(() => expect(screen.getByText("Finding aggregator created.")).toBeTruthy());
    await waitFor(() => expect(dlg.className).toContain("hidden"));
  });

  it("shows a fallback error when the aggregator creation fails", async () => {
    const user = userEvent.setup();
    mockCreateAggregator.mockRejectedValueOnce({});
    render(<SecurityHubDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Finding aggregator/ }));
    await user.click(screen.getByRole("button", { name: /Create finding aggregator/i }));
    await user.click(dialogButton(modalDlg("Create finding aggregator"), "Create"));
    await waitFor(() => expect(screen.getByText("Request failed")).toBeTruthy());
  });

  it("shows Loading while aggregators load", async () => {
    const user = userEvent.setup();
    mockHooks.useShAggregators.mockReturnValue(
      listQuery("findingAggregators", [], { data: undefined, isLoading: true })
    );
    mockHooks.useShAdminAccounts.mockReturnValue(listQuery("adminAccounts", [], { data: undefined }));
    mockHooks.useShPolicies.mockReturnValue(
      listQuery("configurationPolicySummaries", [], { data: undefined })
    );
    mockHooks.useShAssociations.mockReturnValue(
      listQuery("configurationPolicyAssociationSummaries", [], { data: undefined })
    );
    render(<SecurityHubDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Finding aggregator/ }));
    await waitFor(() => expect(screen.getByText("Loading…")).toBeTruthy());
  });
});

describe("SecurityHubDashboard — policies tab", () => {
  it("renders policies and associations", async () => {
    const user = userEvent.setup();
    render(<SecurityHubDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Configuration policies/ }));
    await waitFor(() => expect(screen.getByText("baseline")).toBeTruthy());
    expect(screen.getByText("permissive")).toBeTruthy();
    expect(screen.getByText("Yes")).toBeTruthy();
    expect(screen.getByText("No")).toBeTruthy();
    expect(screen.getByText("2026-10-01T00:00:00Z")).toBeTruthy();
    expect(screen.getAllByText("111111111111").length).toBeGreaterThan(0);
    expect(screen.getByText("SUCCESS")).toBeTruthy();
  });

  it("disables Associate until policy id and target are typed, then associates", async () => {
    const user = userEvent.setup();
    mockAssociate.mockResolvedValueOnce({ associationStatus: "PENDING" });
    render(<SecurityHubDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Configuration policies/ }));
    const associateBtn = screen.getByRole("button", { name: /^Associate$/ }) as HTMLButtonElement;
    expect(associateBtn.disabled).toBe(true);
    await user.type(screen.getByPlaceholderText("policy-id"), "p1");
    await user.type(screen.getByPlaceholderText("target-account-id"), "222222222222");
    expect(associateBtn.disabled).toBe(false);
    await user.click(associateBtn);
    await waitFor(() =>
      expect(mockAssociate).toHaveBeenCalledWith({
        targetAccountId: "222222222222",
        configurationPolicyIdentifier: "p1",
      })
    );
    await waitFor(() =>
      expect(screen.getByText("Association for 222222222222 started.")).toBeTruthy()
    );
  });

  it("shows a fallback error when associating fails", async () => {
    const user = userEvent.setup();
    mockAssociate.mockRejectedValueOnce({});
    render(<SecurityHubDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Configuration policies/ }));
    await user.type(screen.getByPlaceholderText("policy-id"), "p1");
    await user.type(screen.getByPlaceholderText("target-account-id"), "222222222222");
    await user.click(screen.getByRole("button", { name: /^Associate$/ }));
    await waitFor(() => expect(screen.getByText("Request failed")).toBeTruthy());
  });

  it("disassociates from the row action after confirmation", async () => {
    const user = userEvent.setup();
    mockDisassociate.mockResolvedValueOnce({ disassociating: true });
    render(<SecurityHubDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Configuration policies/ }));
    await waitFor(() => expect(screen.getByText("SUCCESS")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete 111111111111/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() =>
      expect(mockDisassociate).toHaveBeenCalledWith({
        targetAccountId: "111111111111",
        configurationPolicyIdentifier: "p1",
      })
    );
    await waitFor(() => expect(screen.getByText("Association for 111111111111 removed.")).toBeTruthy());
  });

  it("creates a configuration policy and closes the modal", async () => {
    const user = userEvent.setup();
    mockCreatePolicy.mockResolvedValueOnce({ id: "p2" });
    render(<SecurityHubDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Configuration policies/ }));
    await user.click(screen.getByRole("button", { name: /Create configuration policy/i }));
    const dlg = modalDlg("Create configuration policy");
    const dialogInputs = Array.from(dlg.querySelectorAll("input")) as HTMLElement[];
    await user.type(dialogInputs[0], "hardened");
    await user.type(dialogInputs[1], "locked down");
    await user.click(dialogButton(dlg, "Create"));
    await waitFor(() =>
      expect(mockCreatePolicy).toHaveBeenCalledWith({
        name: "hardened",
        description: "locked down",
        configurationPolicy: { SecurityHub: { ServiceEnabled: true } },
      })
    );
    await waitFor(() =>
      expect(screen.getByText("Configuration policy hardened created.")).toBeTruthy()
    );
    await waitFor(() => expect(dlg.className).toContain("hidden"));
  });
});

describe("SecurityHubDashboard — toggles and modal dismissals", () => {
  function checkbox(): HTMLInputElement {
    return document.querySelector('input[type="checkbox"]') as HTMLInputElement;
  }

  function escapeModals() {
    document.querySelectorAll('[class*="awsui_dialog"]').forEach((d) => {
      fireEvent.keyDown(d as HTMLElement, { keyCode: 27, key: "Escape" });
    });
  }

  async function openAndCloseByCancelAndEscape(
    user: ReturnType<typeof userEvent.setup>,
    openName: RegExp,
    header: string
  ) {
    await user.click(screen.getByRole("button", { name: openName }));
    let dlg = modalDlg(header);
    await user.click(dialogButton(dlg, "Cancel"));
    await waitFor(() => expect(dlg.className).toContain("hidden"));
    await user.click(screen.getByRole("button", { name: openName }));
    dlg = modalDlg(header);
    escapeModals();
    await waitFor(() => expect(dlg.className).toContain("hidden"));
  }

  it("toggles auto-enable controls off and saves", async () => {
    const user = userEvent.setup();
    mockUpdateHub.mockResolvedValueOnce({ updated: true });
    render(<SecurityHubDashboard />, { wrapper: createWrapper() });
    await user.click(checkbox());
    await user.click(screen.getByRole("button", { name: /Save configuration/i }));
    await waitFor(() =>
      expect(mockUpdateHub).toHaveBeenCalledWith({
        autoEnableControls: false,
        controlFindingGenerator: "SECURITY_CONTROL",
      })
    );
  });

  it("toggles org auto-enable on and updates", async () => {
    const user = userEvent.setup();
    mockUpdateOrgConfig.mockResolvedValueOnce({ updated: true });
    render(<SecurityHubDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Organization/ }));
    await user.click(checkbox());
    await user.click(screen.getByRole("button", { name: /Update configuration/i }));
    await waitFor(() =>
      expect(mockUpdateOrgConfig).toHaveBeenCalledWith({
        autoEnable: true,
        autoEnableStandards: "DEFAULT",
      })
    );
  });

  it("types into the delegated admin modal, cancels, reopens, and escapes", async () => {
    const user = userEvent.setup();
    render(<SecurityHubDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Organization/ }));
    await user.click(screen.getByRole("button", { name: /Create delegated admin/i }));
    const dlg = modalDlg("Enable delegated administrator");
    await user.type(dlg.querySelector("input") as HTMLElement, "3");
    await openAndCloseByCancelAndEscape(user, /Create delegated admin/i, "Enable delegated administrator");
  });

  it("types into the create aggregator modal, cancels, reopens, and escapes", async () => {
    const user = userEvent.setup();
    render(<SecurityHubDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Finding aggregator/ }));
    await user.click(screen.getByRole("button", { name: /Create finding aggregator/i }));
    const dlg = modalDlg("Create finding aggregator");
    const dialogInputs = Array.from(dlg.querySelectorAll("input")) as HTMLElement[];
    await user.type(dialogInputs[0], "SPECIFIED_REGIONS");
    await user.type(dialogInputs[1], "us-east-1");
    await openAndCloseByCancelAndEscape(user, /Create finding aggregator/i, "Create finding aggregator");
  });

  it("cancels and escapes the create policy modal", async () => {
    const user = userEvent.setup();
    render(<SecurityHubDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Configuration policies/ }));
    await openAndCloseByCancelAndEscape(user, /Create configuration policy/i, "Create configuration policy");
  });
});
