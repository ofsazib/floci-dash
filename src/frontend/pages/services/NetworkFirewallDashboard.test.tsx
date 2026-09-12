// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createWrapper } from "../../../test/helpers";
import React from "react";

function dismissModalWithEscape() {
  document.querySelectorAll('[class*="awsui_dialog"]').forEach((dialog) => {
    fireEvent.keyDown(dialog as HTMLElement, { keyCode: 27, key: "Escape" });
  });
}

function openDialog(): HTMLElement {
  const dialogs = Array.from(document.querySelectorAll<HTMLElement>('[class*="awsui_dialog"]'));
  const open = dialogs.filter((d) => !d.closest('[class*="awsui_hidden"]'));
  if (!open.length) throw new Error("No open dialog");
  return open[open.length - 1];
}

async function clickInDialog(user: any, name: string) {
  await user.click(
    Array.from(openDialog().querySelectorAll("button")).find((b) => b.textContent?.trim() === name)!
  );
}

function textareaInDialog(): HTMLTextAreaElement {
  return Array.from(openDialog().querySelectorAll("textarea"))[0] as HTMLTextAreaElement;
}

const mockFirewalls = vi.fn();
const mockPolicies = vi.fn();
const mockRuleGroups = vi.fn();
const mockCreateFW = vi.fn(() => Promise.resolve({}));
const mockDeleteFW = vi.fn(() => Promise.resolve({}));
const mockDeleteProt = vi.fn(() => Promise.resolve({}));
const mockPolicyProt = vi.fn(() => Promise.resolve({}));
const mockSubnetProt = vi.fn(() => Promise.resolve({}));
const mockAzProt = vi.fn(() => Promise.resolve({}));
const mockUpdateDesc = vi.fn(() => Promise.resolve({}));
const mockAnalysis = vi.fn(() => Promise.resolve({}));
const mockAssocSubnets = vi.fn(() => Promise.resolve({}));
const mockDisassocSubnets = vi.fn(() => Promise.resolve({}));
const mockAssocPolicy = vi.fn(() => Promise.resolve({}));
const mockUpdateLogging = vi.fn(() => Promise.resolve({}));
const mockCreatePolicy = vi.fn(() => Promise.resolve({}));
const mockDeletePolicy = vi.fn(() => Promise.resolve({}));
const mockCreateRG = vi.fn(() => Promise.resolve({}));
const mockDeleteRG = vi.fn(() => Promise.resolve({}));
const mockShowToast = vi.fn();

vi.mock("../../hooks/useNetworkFirewall", () => ({
  useNfwFirewalls: (...args: any[]) => mockFirewalls(...args),
  useNfwFirewallDetail: () => ({ data: undefined }),
  useNfwCreateFirewall: () => ({ mutateAsync: mockCreateFW, isPending: false }),
  useNfwDeleteFirewall: () => ({ mutateAsync: mockDeleteFW, isPending: false }),
  useNfwDeleteProtection: () => ({ mutateAsync: mockDeleteProt, isPending: false }),
  useNfwPolicyChangeProtection: () => ({ mutateAsync: mockPolicyProt, isPending: false }),
  useNfwSubnetChangeProtection: () => ({ mutateAsync: mockSubnetProt, isPending: false }),
  useNfwAzChangeProtection: () => ({ mutateAsync: mockAzProt, isPending: false }),
  useNfwUpdateDescription: () => ({ mutateAsync: mockUpdateDesc, isPending: false }),
  useNfwAnalysisSettings: () => ({ mutateAsync: mockAnalysis, isPending: false }),
  useNfwAssociateSubnets: () => ({ mutateAsync: mockAssocSubnets, isPending: false }),
  useNfwDisassociateSubnets: () => ({ mutateAsync: mockDisassocSubnets, isPending: false }),
  useNfwAssociateZones: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useNfwDisassociateZones: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useNfwAssociatePolicy: () => ({ mutateAsync: mockAssocPolicy, isPending: false }),
  useNfwUpdateLogging: () => ({ mutateAsync: mockUpdateLogging, isPending: false }),
  useNfwLoggingConfig: () => ({ data: undefined }),
  useNfwPolicies: (...args: any[]) => mockPolicies(...args),
  useNfwPolicyDetail: () => ({ data: undefined }),
  useNfwCreatePolicy: () => ({ mutateAsync: mockCreatePolicy, isPending: false }),
  useNfwUpdatePolicy: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useNfwDeletePolicy: () => ({ mutateAsync: mockDeletePolicy, isPending: false }),
  useNfwRuleGroups: (...args: any[]) => mockRuleGroups(...args),
  useNfwRuleGroupDetail: () => ({ data: undefined }),
  useNfwCreateRuleGroup: () => ({ mutateAsync: mockCreateRG, isPending: false }),
  useNfwUpdateRuleGroup: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useNfwDeleteRuleGroup: () => ({ mutateAsync: mockDeleteRG, isPending: false }),
}));

vi.mock("../../components/Toast", () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

// Mock Cloudscape Toggle for deterministic transitions
vi.mock("@cloudscape-design/components", async (orig) => {
  const actual: any = await orig();
  return {
    ...actual,
    Toggle: ({ checked, onChange, children }: any) => (
      <button data-testid={`toggle-${checked}-${children}`} onClick={() => onChange?.({ detail: { checked: !checked } })}>
        {children}
      </button>
    ),
  };
});

import { default as NetworkFirewallDashboard } from "./NetworkFirewallDashboard";

const fw = {
  name: "fw",
  arn: "arn:fw",
  policyArn: "arn:pol",
  vpcId: "vpc-1",
  subnetMappings: [{ SubnetId: "subnet-1" }],
};

function setupAll() {
  mockFirewalls.mockReturnValue({ data: { firewalls: [fw, {}], total: 2 }, isLoading: false });
  mockPolicies.mockReturnValue({ data: { policies: [{ name: "pol", arn: "arn:pol" }, {}], total: 2 }, isLoading: false });
  mockRuleGroups.mockReturnValue({
    data: { ruleGroups: [{ name: "grp", arn: "arn:grp", type: "STATEFUL" }, {}], total: 2 },
    isLoading: false,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  setupAll();
});

async function clickTab(user: any, name: string) {
  await user.click(await screen.findByRole("tab", { name }));
}

describe("NetworkFirewallDashboard — Firewalls tab", () => {
  it("lists firewalls", async () => {
    render(<NetworkFirewallDashboard />, { wrapper: createWrapper() });
    expect(await screen.findByText("fw")).toBeTruthy();
    expect(screen.getByText("arn:pol")).toBeTruthy();
    expect(screen.getByText("subnet-1")).toBeTruthy();
  });

  it("creates a firewall", async () => {
    const user = userEvent.setup();
    render(<NetworkFirewallDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Create firewall" }));
    expect((screen.getByRole("button", { name: "Create" }) as HTMLButtonElement).disabled).toBe(true);
    await user.type(screen.getByPlaceholderText("fw-1"), "fw2");
    await user.type(screen.getByPlaceholderText("vpc-1"), "vpc-2");
    await user.type(screen.getByPlaceholderText("subnet-1, subnet-2"), "subnet-9");
    await user.type(screen.getByLabelText("Firewall policy ARN (optional)"), "arn:pol");
    await clickInDialog(user, "Create");
    await waitFor(() =>
      expect(mockCreateFW).toHaveBeenCalledWith({
        name: "fw2", vpcId: "vpc-2", subnetMappings: ["subnet-9"], policyArn: "arn:pol",
      }),
    );
    expect(mockShowToast).toHaveBeenCalledWith("success", "Firewall created");
  });

  it("shows generic create error toast", async () => {
    mockCreateFW.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<NetworkFirewallDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Create firewall" }));
    await user.type(screen.getByPlaceholderText("fw-1"), "fw2");
    await user.type(screen.getByPlaceholderText("vpc-1"), "vpc-2");
    await user.type(screen.getByPlaceholderText("subnet-1, subnet-2"), "subnet-9");
    await clickInDialog(user, "Create");
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to create firewall"));
  });

  it("saves all protections, description and analysis settings", async () => {
    const user = userEvent.setup();
    render(<NetworkFirewallDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: `Configure arn:fw` }));
    fireEvent.click(screen.getByTestId("toggle-false-Delete protection"));
    fireEvent.click(screen.getByTestId("toggle-false-Firewall policy change protection"));
    fireEvent.click(screen.getByTestId("toggle-false-Subnet change protection"));
    fireEvent.click(screen.getByTestId("toggle-false-Availability zone change protection"));
    fireEvent.change(screen.getByLabelText("Description"), { target: { value: "updated" } });
    fireEvent.change(Array.from(openDialog().querySelectorAll("textarea"))[0], {
      target: { value: "{}" },
    });
    await waitFor(() =>
      expect(
        screen.getByTestId("toggle-true-Delete protection"),
      ).toBeTruthy(),
    );
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(mockAzProt).toHaveBeenCalledWith({ arn: "arn:fw", enabled: true }));
    expect(mockDeleteProt).toHaveBeenCalledWith({ arn: "arn:fw", enabled: true });
    expect(mockPolicyProt).toHaveBeenCalledWith({ arn: "arn:fw", enabled: true });
    expect(mockSubnetProt).toHaveBeenCalledWith({ arn: "arn:fw", enabled: true });
    expect(mockUpdateDesc).toHaveBeenCalledWith({ arn: "arn:fw", description: "updated" });
    expect(mockAnalysis).toHaveBeenCalledWith({ arn: "arn:fw", analysisSettings: "{}" });
    expect(mockShowToast).toHaveBeenCalledWith("success", "Firewall settings saved");
  });

  it("shows generic error toast when a protection save fails", async () => {
    mockDeleteProt.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<NetworkFirewallDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: `Configure arn:fw` }));
    await clickInDialog(user, "Save");
    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to save firewall settings"),
    );
    expect(mockAnalysis).not.toHaveBeenCalled();
  });

  it("skips analysis settings when empty", async () => {
    const user = userEvent.setup();
    render(<NetworkFirewallDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: `Configure arn:fw` }));
    await clickInDialog(user, "Save");
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("success", "Firewall settings saved"));
    expect(mockAnalysis).not.toHaveBeenCalled();
  });

  it("associates and disassociates subnets", async () => {
    const user = userEvent.setup();
    render(<NetworkFirewallDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: `Configure arn:fw` }));
    await user.type(screen.getByLabelText("Associate subnets (comma-separated)"), "subnet-9");
    await user.click(screen.getByRole("button", { name: "Associate subnets" }));
    await waitFor(() =>
      expect(mockAssocSubnets).toHaveBeenCalledWith({ arn: "arn:fw", subnetIds: ["subnet-9"] }),
    );
    await user.type(screen.getByLabelText("Disassociate subnets (comma-separated)"), "subnet-1");
    await user.click(screen.getByRole("button", { name: "Disassociate subnets" }));
    await waitFor(() =>
      expect(mockDisassocSubnets).toHaveBeenCalledWith({ arn: "arn:fw", subnetIds: ["subnet-1"] }),
    );
    expect(mockShowToast).toHaveBeenCalledWith("success", "Subnets associated");
    expect(mockShowToast).toHaveBeenCalledWith("success", "Subnets disassociated");
  });

  it("associates a policy and updates logging", async () => {
    const user = userEvent.setup();
    render(<NetworkFirewallDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: `Configure arn:fw` }));
    await user.type(screen.getByLabelText("Associate firewall policy ARN"), "arn:newpol");
    await user.click(screen.getByRole("button", { name: "Associate policy" }));
    await waitFor(() => expect(mockAssocPolicy).toHaveBeenCalledWith({ arn: "arn:fw", policyArn: "arn:newpol" }));
    expect(mockShowToast).toHaveBeenCalledWith("success", "Firewall policy associated");
    const loggingArea = Array.from(openDialog().querySelectorAll("textarea")).at(-1)!;
    fireEvent.change(loggingArea, { target: { value: '{"a":1}' } });
    await user.click(screen.getByRole("button", { name: "Update logging" }));
    await waitFor(() =>
      expect(mockUpdateLogging).toHaveBeenCalledWith({ arn: "arn:fw", loggingConfiguration: '{"a":1}' }),
    );
    expect(mockShowToast).toHaveBeenCalledWith("success", "Logging configuration updated");
  });

  it("shows error toasts for subnet and policy actions", async () => {
    mockAssocSubnets.mockRejectedValueOnce("boom");
    mockDisassocSubnets.mockRejectedValueOnce("boom");
    mockAssocPolicy.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<NetworkFirewallDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: `Configure arn:fw` }));
    await user.type(screen.getByLabelText("Associate subnets (comma-separated)"), "subnet-9");
    await user.click(screen.getByRole("button", { name: "Associate subnets" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to update subnets"));
    await user.type(screen.getByLabelText("Disassociate subnets (comma-separated)"), "subnet-1");
    await user.click(screen.getByRole("button", { name: "Disassociate subnets" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to update subnets"));
    await user.type(screen.getByLabelText("Associate firewall policy ARN"), "arn:x");
    await user.click(screen.getByRole("button", { name: "Associate policy" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to associate policy"));
  });

  it("shows error toast for logging update", async () => {
    mockUpdateLogging.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<NetworkFirewallDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: `Configure arn:fw` }));
    await user.click(screen.getByRole("button", { name: "Update logging" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to update logging"));
  });

  it("cancels the settings and create modals", async () => {
    const user = userEvent.setup();
    render(<NetworkFirewallDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: `Configure arn:fw` }));
    await clickInDialog(user, "Cancel");
    await user.click(await screen.findByRole("button", { name: `Configure arn:fw` }));
    dismissModalWithEscape();
    await user.click(screen.getByRole("button", { name: "Create firewall" }));
    await clickInDialog(user, "Cancel");
    expect(mockCreateFW).not.toHaveBeenCalled();
    expect(mockDeleteProt).not.toHaveBeenCalled();
  });

  it("deletes a firewall (generic error then success)", async () => {
    mockDeleteFW.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<NetworkFirewallDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Delete arn:fw" }));
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to delete firewall"));
    await user.click(await screen.findByRole("button", { name: "Delete arn:fw" }));
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() => expect(mockDeleteFW).toHaveBeenCalledWith({ arn: "arn:fw" }));
    expect(mockShowToast).toHaveBeenCalledWith("success", "Firewall deleted");
  });
});

describe("NetworkFirewallDashboard — Policies tab", () => {
  it("lists policies", async () => {
    const user = userEvent.setup();
    render(<NetworkFirewallDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Policies");
    expect(await screen.findByText("pol")).toBeTruthy();
  });

  it("creates a policy with and without stateless actions", async () => {
    const user = userEvent.setup();
    render(<NetworkFirewallDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Policies");
    await user.click(screen.getByRole("button", { name: "Create policy" }));
    await user.type(screen.getByPlaceholderText("pol-1"), "pol2");
    await user.type(screen.getByPlaceholderText("aws:forward_to_sfe"), "aws:drop, aws:forward_to_sfe");
    await clickInDialog(user, "Create");
    await waitFor(() =>
      expect(mockCreatePolicy).toHaveBeenCalledWith({
        name: "pol2",
        firewallPolicy: { statelessDefaultActions: ["aws:drop", "aws:forward_to_sfe"] },
      }),
    );
    await user.click(screen.getByRole("button", { name: "Create policy" }));
    await user.clear(screen.getByPlaceholderText("pol-1"));
    await user.type(screen.getByPlaceholderText("pol-1"), "pol3");
    await user.clear(screen.getByPlaceholderText("aws:forward_to_sfe"));
    await clickInDialog(user, "Create");
    await waitFor(() => expect(mockCreatePolicy).toHaveBeenCalledWith({ name: "pol3", firewallPolicy: undefined }));
  });

  it("shows generic create policy error toast", async () => {
    mockCreatePolicy.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<NetworkFirewallDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Policies");
    await user.click(screen.getByRole("button", { name: "Create policy" }));
    await user.type(screen.getByPlaceholderText("pol-1"), "p9");
    await clickInDialog(user, "Create");
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to create policy"));
  });

  it("cancels the policy create modal", async () => {
    const user = userEvent.setup();
    render(<NetworkFirewallDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Policies");
    await user.click(screen.getByRole("button", { name: "Create policy" }));
    await clickInDialog(user, "Cancel");
    await user.click(screen.getByRole("button", { name: "Create policy" }));
    await waitFor(() => expect(openDialog()).toBeTruthy());
    dismissModalWithEscape();
    expect(mockCreatePolicy).not.toHaveBeenCalled();
  });

  it("deletes a policy (generic error then success)", async () => {
    mockDeletePolicy.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<NetworkFirewallDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Policies");
    await user.click(await screen.findByRole("button", { name: "Delete arn:pol" }));
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to delete policy"));
    await user.click(await screen.findByRole("button", { name: "Delete arn:pol" }));
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() => expect(mockDeletePolicy).toHaveBeenCalledWith({ arn: "arn:pol" }));
    expect(mockShowToast).toHaveBeenCalledWith("success", "Firewall policy deleted");
  });
});

describe("NetworkFirewallDashboard — Rule groups tab", () => {
  it("lists rule groups and cycles the type", async () => {
    const user = userEvent.setup();
    render(<NetworkFirewallDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Rule groups");
    expect(await screen.findByText("grp")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Create rule group" }));
    await user.click(screen.getByRole("button", { name: "STATEFUL" }));
    expect(screen.getByRole("button", { name: "STATELESS" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "STATELESS" }));
    expect(screen.getByRole("button", { name: "STATEFUL" })).toBeTruthy();
    dismissAndCheck();
    function dismissAndCheck() {
      fireEvent.keyDown(openDialog(), { keyCode: 27, key: "Escape" });
      expect(mockCreateRG).not.toHaveBeenCalled();
    }
  });

  it("creates a rule group with rules", async () => {
    const user = userEvent.setup();
    render(<NetworkFirewallDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Rule groups");
    await user.click(screen.getByRole("button", { name: "Create rule group" }));
    await user.type(screen.getByPlaceholderText("group-1"), "grp2");
    fireEvent.change(textareaInDialog(), { target: { value: "pass all" } });
    await clickInDialog(user, "Create");
    await waitFor(() =>
      expect(mockCreateRG).toHaveBeenCalledWith({
        name: "grp2",
        type: "STATEFUL",
        capacity: "100",
        ruleGroup: '{"rulesSource":{"rulesString":"pass all"}}',
      }),
    );
    expect(mockShowToast).toHaveBeenCalledWith("success", "Rule group created");
  });

  it("shows generic create error toast", async () => {
    mockCreateRG.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<NetworkFirewallDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Rule groups");
    await user.click(screen.getByRole("button", { name: "Create rule group" }));
    await user.type(screen.getByPlaceholderText("group-1"), "grp2");
    await clickInDialog(user, "Create");
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to create rule group"));
  });

  it("creates a rule group with typed capacity and cancels the modal", async () => {
    const user = userEvent.setup();
    render(<NetworkFirewallDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Rule groups");
    await user.click(screen.getByRole("button", { name: "Create rule group" }));
    await user.clear(screen.getByLabelText("Capacity"));
    await user.type(screen.getByLabelText("Capacity"), "200");
    await clickInDialog(user, "Cancel");
    await user.click(screen.getByRole("button", { name: "Create rule group" }));
    await waitFor(() => expect(openDialog()).toBeTruthy());
    dismissModalWithEscape();
    expect(mockCreateRG).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Create rule group" }));
    await user.clear(screen.getByLabelText("Capacity"));
    await user.type(screen.getByLabelText("Capacity"), "200");
    await user.type(screen.getByPlaceholderText("group-1"), "grp9");
    await clickInDialog(user, "Create");
    await waitFor(() =>
      expect(mockCreateRG).toHaveBeenCalledWith({
        name: "grp9", type: "STATEFUL", capacity: "200", ruleGroup: undefined,
      }),
    );
  });

  it("deletes a rule group (generic error then success)", async () => {
    mockDeleteRG.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<NetworkFirewallDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Rule groups");
    await user.click(await screen.findByRole("button", { name: "Delete arn:grp" }));
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to delete rule group"));
    await user.click(await screen.findByRole("button", { name: "Delete arn:grp" }));
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() => expect(mockDeleteRG).toHaveBeenCalledWith({ arn: "arn:grp" }));
    expect(mockShowToast).toHaveBeenCalledWith("success", "Rule group deleted");
  });
});

describe("NetworkFirewallDashboard — fallback rendering", () => {
  it("renders create buttons when hooks return undefined data", async () => {
    mockFirewalls.mockReturnValue({ data: undefined, isLoading: false });
    mockPolicies.mockReturnValue({ data: undefined, isLoading: false });
    mockRuleGroups.mockReturnValue({ data: undefined, isLoading: false });
    const user = userEvent.setup();
    render(<NetworkFirewallDashboard />, { wrapper: createWrapper() });
    expect(await screen.findByRole("button", { name: "Create firewall" })).toBeTruthy();
    await user.click(await screen.findByRole("tab", { name: "Policies" }));
    expect(await screen.findByRole("button", { name: "Create policy" })).toBeTruthy();
    await user.click(await screen.findByRole("tab", { name: "Rule groups" }));
    expect(await screen.findByRole("button", { name: "Create rule group" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Create rule group" })).toBeTruthy();
  });
});
