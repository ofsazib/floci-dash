// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createWrapper } from "../../../test/helpers";
import React from "react";

/** Fire Escape on every mounted Cloudscape dialog (fires onDismiss). */
function dismissModalWithEscape() {
  document.querySelectorAll('[class*="awsui_dialog"]').forEach((dialog) => {
    fireEvent.keyDown(dialog as HTMLElement, { keyCode: 27, key: "Escape" });
  });
}

/** The topmost visible Cloudscape dialog (dismissed dialogs stay mounted with an awsui_hidden_* ancestor). */
function openDialog(): HTMLElement {
  const dialogs = Array.from(document.querySelectorAll<HTMLElement>('[class*="awsui_dialog"]'));
  const open = dialogs.filter((d) => !d.closest('[class*="awsui_hidden"]'));
  if (!open.length) throw new Error("No open dialog");
  return open[open.length - 1];
}

/** Click a named button inside the topmost visible dialog. */
async function clickInDialog(user: any, name: string) {
  await user.click(
    Array.from(openDialog().querySelectorAll("button")).find((b) => b.textContent?.trim() === name)!
  );
}

/** First <textarea> inside the topmost visible dialog (Cloudscape Textarea placeholder isn't queryable). */
function textareaInDialog(): HTMLTextAreaElement {
  return Array.from(openDialog().querySelectorAll("textarea"))[0] as HTMLTextAreaElement;
}

const mockEndpoints = vi.fn();
const mockRules = vi.fn();
const mockAssociations = vi.fn();
const mockDomainLists = vi.fn();
const mockCreateEndpoint = vi.fn(() => Promise.resolve({}));
const mockUpdateEndpoint = vi.fn(() => Promise.resolve({}));
const mockDeleteEndpoint = vi.fn(() => Promise.resolve({}));
const mockCreateRule = vi.fn(() => Promise.resolve({}));
const mockUpdateRule = vi.fn(() => Promise.resolve({}));
const mockDeleteRule = vi.fn(() => Promise.resolve({}));
const mockAssociate = vi.fn(() => Promise.resolve({}));
const mockDisassociate = vi.fn(() => Promise.resolve({}));
const mockCreateList = vi.fn(() => Promise.resolve({}));
const mockDeleteList = vi.fn(() => Promise.resolve({}));
const mockShowToast = vi.fn();

vi.mock("../../hooks/useRoute53Resolver", () => ({
  useResolverEndpoints: (...args: any[]) => mockEndpoints(...args),
  useCreateResolverEndpoint: () => ({ mutateAsync: mockCreateEndpoint, isPending: false }),
  useUpdateResolverEndpoint: () => ({ mutateAsync: mockUpdateEndpoint, isPending: false }),
  useDeleteResolverEndpoint: () => ({ mutateAsync: mockDeleteEndpoint, isPending: false }),
  useResolverRules: (...args: any[]) => mockRules(...args),
  useCreateResolverRule: () => ({ mutateAsync: mockCreateRule, isPending: false }),
  useUpdateResolverRule: () => ({ mutateAsync: mockUpdateRule, isPending: false }),
  useDeleteResolverRule: () => ({ mutateAsync: mockDeleteRule, isPending: false }),
  useResolverRuleAssociations: (...args: any[]) => mockAssociations(...args),
  useAssociateResolverRule: () => ({ mutateAsync: mockAssociate, isPending: false }),
  useDisassociateResolverRule: () => ({ mutateAsync: mockDisassociate, isPending: false }),
  useFirewallDomainLists: (...args: any[]) => mockDomainLists(...args),
  useCreateFirewallDomainList: () => ({ mutateAsync: mockCreateList, isPending: false }),
  useDeleteFirewallDomainList: () => ({ mutateAsync: mockDeleteList, isPending: false }),
}));

vi.mock("../../components/Toast", () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

import { default as Route53ResolverDashboard } from "./Route53ResolverDashboard";

const endpoint = {
  id: "rslvr-in-abc",
  arn: "arn:aws:route53resolver:us-east-1:1:resolver-endpoint/rslvr-in-abc",
  name: "in",
  direction: "INBOUND",
  status: "OPERATIONAL",
  ipAddressCount: 2,
  hostVpcId: "vpc-1",
  endpointType: "IPV4",
};
const bareEndpoint = { id: "rslvr-out-bare" };
const rule = {
  id: "rslvr-rr-abc",
  name: "fwd",
  domainName: "example.com",
  ruleType: "FORWARD",
  status: "COMPLETE",
  targetIps: [{ Ip: "10.0.0.1", Port: 53 }],
  resolverEndpointId: "rslvr-in-abc",
};
const bareRule = { id: "rslvr-rr-bare" };
const association = {
  id: "rslvr-rrassoc-abc",
  name: "assoc",
  resolverRuleId: "rslvr-rr-abc",
  vpcId: "vpc-1",
  status: "COMPLETE",
};
const bareAssociation = { id: "rslvr-rrassoc-bare" };
const domainList = {
  id: "rslvr-fdl-abc",
  name: "custom",
  managedOwnerName: "Route 53 Resolver DNS Firewall",
  status: "COMPLETE",
  domainCount: 3,
};
const bareDomainList = {};

function setupAll() {
  mockEndpoints.mockReturnValue({ data: { endpoints: [endpoint, bareEndpoint], total: 2 }, isLoading: false });
  mockRules.mockReturnValue({ data: { rules: [rule, bareRule], total: 2 }, isLoading: false });
  mockAssociations.mockReturnValue({ data: { associations: [association, bareAssociation], total: 2 }, isLoading: false });
  mockDomainLists.mockReturnValue({ data: { domainLists: [domainList, bareDomainList], total: 2 }, isLoading: false });
}

async function clickTab(user: any, name: string) {
  await user.click(await screen.findByRole("tab", { name }));
}

beforeEach(() => {
  vi.clearAllMocks();
  setupAll();
});

describe("Route53ResolverDashboard — Endpoints tab", () => {
  it("lists endpoints with mapped fields and em-dash fallbacks", async () => {
    const user = userEvent.setup();
    render(<Route53ResolverDashboard />, { wrapper: createWrapper() });
    expect(await screen.findByText("in")).toBeTruthy();
    expect(screen.getByText("rslvr-in-abc")).toBeTruthy();
    expect(screen.getByText("OPERATIONAL")).toBeTruthy();
    expect(screen.getByText("vpc-1")).toBeTruthy();
    expect(screen.getByText("rslvr-out-bare")).toBeTruthy();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("creates an endpoint with direction, IPs and security groups", async () => {
    const user = userEvent.setup();
    render(<Route53ResolverDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Create endpoint" }));
    const createBtn = screen.getByRole("button", { name: "Create" }) as HTMLButtonElement;
    expect(createBtn.disabled).toBe(true);
    await user.type(screen.getByPlaceholderText("inbound-endpoint"), "out");
    await user.type(screen.getByPlaceholderText("sg-1, sg-2"), "sg-1, sg-2");
    fireEvent.change(textareaInDialog(), {
      target: { value: "subnet-1,10.0.0.5\nsubnet-2" },
    });
    await user.click(screen.getByRole("button", { name: "INBOUND" }));
    await user.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() =>
      expect(mockCreateEndpoint).toHaveBeenCalledWith({
        name: "out",
        direction: "OUTBOUND",
        ipAddresses: [{ SubnetId: "subnet-1", Ip: "10.0.0.5" }, { SubnetId: "subnet-2" }],
        securityGroupIds: ["sg-1", "sg-2"],
      }),
    );
    expect(mockShowToast).toHaveBeenCalledWith("success", "Resolver endpoint created");
  });

  it("keeps create disabled without an IP address", async () => {
    const user = userEvent.setup();
    render(<Route53ResolverDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Create endpoint" }));
    await user.type(screen.getByPlaceholderText("inbound-endpoint"), "out");
    expect((screen.getByRole("button", { name: "Create" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("shows error toast on create failure", async () => {
    mockCreateEndpoint.mockRejectedValueOnce(new Error("quota"));
    const user = userEvent.setup();
    render(<Route53ResolverDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Create endpoint" }));
    await user.type(screen.getByPlaceholderText("inbound-endpoint"), "out");
    fireEvent.change(textareaInDialog(), { target: { value: "subnet-1" } });
    await user.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "quota"));
  });

  it("shows generic error toast on endpoint create failure", async () => {
    mockCreateEndpoint.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<Route53ResolverDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Create endpoint" }));
    await user.type(screen.getByPlaceholderText("inbound-endpoint"), "out");
    fireEvent.change(textareaInDialog(), { target: { value: "subnet-1" } });
    await user.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to create endpoint"));
  });

  it("renders em-dashes for an endpoint row with no fields", async () => {
    mockEndpoints.mockReturnValue({ data: { endpoints: [{}], total: 1 }, isLoading: false });
    const user = userEvent.setup();
    render(<Route53ResolverDashboard />, { wrapper: createWrapper() });
    const dashes = await screen.findAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(4);
  });

  it("edits an endpoint name and type", async () => {
    const user = userEvent.setup();
    render(<Route53ResolverDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Edit rslvr-in-abc" }));
    const dialog = openDialog();
    const nameInput = Array.from(dialog.querySelectorAll("input")).find(
      (i) => (i as HTMLInputElement).value === "in",
    ) as HTMLInputElement;
    await user.clear(nameInput);
    await user.type(nameInput, "renamed");
    await user.click(screen.getByRole("button", { name: "IPV4" }));
    await clickInDialog(user, "Save");
    await waitFor(() =>
      expect(mockUpdateEndpoint).toHaveBeenCalledWith({ id: "rslvr-in-abc", name: "renamed", endpointType: "DUALSTACK" }),
    );
    expect(mockShowToast).toHaveBeenCalledWith("success", "Resolver endpoint updated");
  });

  it("edits a bare endpoint applying defaults", async () => {
    const user = userEvent.setup();
    render(<Route53ResolverDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Edit rslvr-out-bare" }));
    await clickInDialog(user, "Save");
    await waitFor(() =>
      expect(mockUpdateEndpoint).toHaveBeenCalledWith({ id: "rslvr-out-bare", name: "", endpointType: "IPV4" }),
    );
  });

  it("shows generic error toast on update failure", async () => {
    mockUpdateEndpoint.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<Route53ResolverDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Edit rslvr-in-abc" }));
    await clickInDialog(user, "Save");
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to update endpoint"));
  });

  it("deletes an endpoint after confirm", async () => {
    const user = userEvent.setup();
    render(<Route53ResolverDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Delete rslvr-in-abc" }));
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() => expect(mockDeleteEndpoint).toHaveBeenCalledWith("rslvr-in-abc"));
    expect(mockShowToast).toHaveBeenCalledWith("success", "Resolver endpoint deleted");
  });

  it("shows delete error toast with message", async () => {
    mockDeleteEndpoint.mockRejectedValueOnce(new Error("busy"));
    const user = userEvent.setup();
    render(<Route53ResolverDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Delete rslvr-in-abc" }));
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "busy"));
  });

  it("shows generic delete error toast", async () => {
    mockDeleteEndpoint.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<Route53ResolverDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Delete rslvr-in-abc" }));
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to delete endpoint"));
  });

  it("dismisses the create and edit modals via Cancel and Escape", async () => {
    const user = userEvent.setup();
    render(<Route53ResolverDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Create endpoint" }));
    await user.type(screen.getByPlaceholderText("inbound-endpoint"), "x");
    await clickInDialog(user, "Cancel");
    await user.click(screen.getByRole("button", { name: "Create endpoint" }));
    await waitFor(() => expect(screen.getByText("Create resolver endpoint")).toBeTruthy());
    dismissModalWithEscape();
    await user.click(await screen.findByRole("button", { name: "Edit rslvr-in-abc" }));
    await clickInDialog(user, "Cancel");
    await user.click(await screen.findByRole("button", { name: "Edit rslvr-in-abc" }));
    dismissModalWithEscape();
    expect(mockCreateEndpoint).not.toHaveBeenCalled();
    expect(mockUpdateEndpoint).not.toHaveBeenCalled();
  });
});

describe("Route53ResolverDashboard — Rules tab", () => {
  it("lists rules with targets and fallbacks", async () => {
    const user = userEvent.setup();
    render(<Route53ResolverDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Rules");
    expect(await screen.findByText("fwd")).toBeTruthy();
    expect(screen.getByText("example.com")).toBeTruthy();
    expect(screen.getByText("10.0.0.1")).toBeTruthy();
    expect(screen.getAllByText("rslvr-in-abc").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Edit rslvr-rr-bare" })).toBeTruthy();
  });

  it("creates a rule with type, domain, targets and endpoint", async () => {
    const user = userEvent.setup();
    render(<Route53ResolverDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Rules");
    await user.click(screen.getByRole("button", { name: "Create rule" }));
    expect((screen.getByRole("button", { name: "Create" }) as HTMLButtonElement).disabled).toBe(true);
    await user.type(screen.getByPlaceholderText("forward-example"), "fwd2");
    await user.click(screen.getByRole("button", { name: "FORWARD" }));
    await user.type(screen.getByPlaceholderText("example.com"), "test.com");
    fireEvent.change(textareaInDialog(), {
      target: { value: "10.0.0.9,5353\n10.0.0.8" },
    });
    await user.type(screen.getByPlaceholderText("rslvr-in-abc123"), "rslvr-in-abc");
    await user.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() =>
      expect(mockCreateRule).toHaveBeenCalledWith({
        name: "fwd2",
        ruleType: "SYSTEM",
        domainName: "test.com",
        targetIps: [{ Ip: "10.0.0.9", Port: 5353 }, { Ip: "10.0.0.8" }],
        resolverEndpointId: "rslvr-in-abc",
      }),
    );
    expect(mockShowToast).toHaveBeenCalledWith("success", "Resolver rule created");
  });

  it("creates a name-only rule sending undefined optionals", async () => {
    const user = userEvent.setup();
    render(<Route53ResolverDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Rules");
    await user.click(screen.getByRole("button", { name: "Create rule" }));
    await user.type(screen.getByPlaceholderText("forward-example"), "sys");
    await user.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() =>
      expect(mockCreateRule).toHaveBeenCalledWith({
        name: "sys",
        ruleType: "FORWARD",
        domainName: undefined,
        targetIps: undefined,
        resolverEndpointId: undefined,
      }),
    );
  });

  it("shows error toast on rule create failure", async () => {
    mockCreateRule.mockRejectedValueOnce(new Error("bad"));
    const user = userEvent.setup();
    render(<Route53ResolverDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Rules");
    await user.click(screen.getByRole("button", { name: "Create rule" }));
    await user.type(screen.getByPlaceholderText("forward-example"), "sys");
    await user.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "bad"));
  });

  it("shows generic error toast on rule create failure", async () => {
    mockCreateRule.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<Route53ResolverDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Rules");
    await user.click(screen.getByRole("button", { name: "Create rule" }));
    await user.type(screen.getByPlaceholderText("forward-example"), "sys");
    await user.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to create rule"));
  });

  it("edits a rule name and targets", async () => {
    const user = userEvent.setup();
    render(<Route53ResolverDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Rules");
    await user.click(await screen.findByRole("button", { name: "Edit rslvr-rr-abc" }));
    const dialog = openDialog();
    const nameInput = Array.from(dialog.querySelectorAll("input")).find(
      (i) => (i as HTMLInputElement).value === "fwd",
    ) as HTMLInputElement;
    await user.clear(nameInput);
    await user.type(nameInput, "fwd3");
    await clickInDialog(user, "Save");
    await waitFor(() =>
      expect(mockUpdateRule).toHaveBeenCalledWith({
        id: "rslvr-rr-abc",
        name: "fwd3",
        targetIps: [{ Ip: "10.0.0.1" }],
      }),
    );
    expect(mockShowToast).toHaveBeenCalledWith("success", "Resolver rule updated");
  });

  it("sends undefined targets when the edit textarea is cleared", async () => {
    const user = userEvent.setup();
    render(<Route53ResolverDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Rules");
    await user.click(await screen.findByRole("button", { name: "Edit rslvr-rr-abc" }));
    const dialog = openDialog();
    const textarea = Array.from(dialog.querySelectorAll("textarea"))[0] as HTMLTextAreaElement;
    await user.clear(textarea);
    await clickInDialog(user, "Save");
    await waitFor(() =>
      expect(mockUpdateRule).toHaveBeenCalledWith({
        id: "rslvr-rr-abc",
        name: "fwd",
        targetIps: undefined,
      }),
    );
  });

  it("edits a bare rule applying defaults", async () => {
    const user = userEvent.setup();
    render(<Route53ResolverDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Rules");
    await user.click(await screen.findByRole("button", { name: "Edit rslvr-rr-bare" }));
    await clickInDialog(user, "Save");
    await waitFor(() =>
      expect(mockUpdateRule).toHaveBeenCalledWith({
        id: "rslvr-rr-bare",
        name: "",
        targetIps: undefined,
      }),
    );
  });

  it("cancels the rule edit modal", async () => {
    const user = userEvent.setup();
    render(<Route53ResolverDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Rules");
    await user.click(await screen.findByRole("button", { name: "Edit rslvr-rr-abc" }));
    await clickInDialog(user, "Cancel");
    await user.click(await screen.findByRole("button", { name: "Edit rslvr-rr-abc" }));
    dismissModalWithEscape();
    expect(mockUpdateRule).not.toHaveBeenCalled();
  });

  it("shows generic error toast on rule update failure", async () => {
    mockUpdateRule.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<Route53ResolverDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Rules");
    await user.click(await screen.findByRole("button", { name: "Edit rslvr-rr-abc" }));
    await clickInDialog(user, "Save");
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to update rule"));
  });

  it("deletes a rule and shows the generic error toast on failure", async () => {
    mockDeleteRule.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<Route53ResolverDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Rules");
    await user.click(await screen.findByRole("button", { name: "Delete rslvr-rr-abc" }));
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to delete rule"));
  });

  it("deletes a rule successfully", async () => {
    const user = userEvent.setup();
    render(<Route53ResolverDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Rules");
    await user.click(await screen.findByRole("button", { name: "Delete rslvr-rr-abc" }));
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() => expect(mockDeleteRule).toHaveBeenCalledWith("rslvr-rr-abc"));
    expect(mockShowToast).toHaveBeenCalledWith("success", "Resolver rule deleted");
  });

  it("dismisses the rule create modal via Cancel and Escape", async () => {
    const user = userEvent.setup();
    render(<Route53ResolverDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Rules");
    await user.click(screen.getByRole("button", { name: "Create rule" }));
    await user.type(screen.getByPlaceholderText("forward-example"), "x");
    await clickInDialog(user, "Cancel");
    await user.click(screen.getByRole("button", { name: "Create rule" }));
    await waitFor(() => expect(screen.getByText("Create resolver rule")).toBeTruthy());
    dismissModalWithEscape();
    expect(mockCreateRule).not.toHaveBeenCalled();
  });
});

describe("Route53ResolverDashboard — Associations tab", () => {
  it("lists associations with a disabled disassociate for bare rows", async () => {
    const user = userEvent.setup();
    render(<Route53ResolverDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Rule associations");
    expect(await screen.findByText("assoc")).toBeTruthy();
    expect(screen.getByText("rslvr-rr-abc")).toBeTruthy();
    expect(screen.getByText("vpc-1")).toBeTruthy();
    const buttons = screen.getAllByRole("button", { name: "Disassociate" });
    expect((buttons[0] as HTMLButtonElement).disabled).toBe(false);
    expect((buttons[1] as HTMLButtonElement).disabled).toBe(true);
  });

  it("associates a rule with a VPC, cycling rules and applying name default", async () => {
    const user = userEvent.setup();
    render(<Route53ResolverDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Rule associations");
    await user.click(screen.getByRole("button", { name: "Create association" }));
    expect(screen.getByRole("button", { name: "fwd (rslvr-rr-abc)" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "fwd (rslvr-rr-abc)" }));
    expect(
      screen.getByRole("button", { name: "rslvr-rr-bare (rslvr-rr-bare)" }),
    ).toBeTruthy();
    expect((screen.getByRole("button", { name: "Associate" }) as HTMLButtonElement).disabled).toBe(true);
    await user.type(screen.getByPlaceholderText("vpc-0abc123"), "vpc-9");
    await user.click(screen.getByRole("button", { name: "Associate" }));
    await waitFor(() =>
      expect(mockAssociate).toHaveBeenCalledWith({
        resolverRuleId: "rslvr-rr-bare",
        vpcId: "vpc-9",
        name: undefined,
      }),
    );
    expect(mockShowToast).toHaveBeenCalledWith("success", "Rule associated with VPC");
  });

  it("associates with an optional name", async () => {
    const user = userEvent.setup();
    render(<Route53ResolverDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Rule associations");
    await user.click(screen.getByRole("button", { name: "Create association" }));
    await user.type(screen.getByPlaceholderText("vpc-0abc123"), "vpc-9");
    const dialog = openDialog();
    const nameInput = Array.from(dialog.querySelectorAll("input")).at(-1) as HTMLInputElement;
    await user.type(nameInput, "named");
    await user.click(screen.getByRole("button", { name: "Associate" }));
    await waitFor(() =>
      expect(mockAssociate).toHaveBeenCalledWith({
        resolverRuleId: "rslvr-rr-abc",
        vpcId: "vpc-9",
        name: "named",
      }),
    );
  });

  it("shows error toast on associate failure", async () => {
    mockAssociate.mockRejectedValueOnce(new Error("taken"));
    const user = userEvent.setup();
    render(<Route53ResolverDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Rule associations");
    await user.click(screen.getByRole("button", { name: "Create association" }));
    await user.type(screen.getByPlaceholderText("vpc-0abc123"), "vpc-9");
    await user.click(screen.getByRole("button", { name: "Associate" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "taken"));
  });

  it("shows generic error toast on associate failure", async () => {
    mockAssociate.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<Route53ResolverDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Rule associations");
    await user.click(screen.getByRole("button", { name: "Create association" }));
    await user.type(screen.getByPlaceholderText("vpc-0abc123"), "vpc-9");
    await user.click(screen.getByRole("button", { name: "Associate" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to associate rule"));
  });

  it("shows generic error toast on disassociate failure", async () => {
    mockDisassociate.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<Route53ResolverDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Rule associations");
    await user.click((await screen.findAllByRole("button", { name: "Disassociate" }))[0]);
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to disassociate rule"));
  });

  it("disassociates successfully", async () => {
    const user = userEvent.setup();
    render(<Route53ResolverDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Rule associations");
    await user.click((await screen.findAllByRole("button", { name: "Disassociate" }))[0]);
    await waitFor(() =>
      expect(mockDisassociate).toHaveBeenCalledWith({ resolverRuleId: "rslvr-rr-abc", vpcId: "vpc-1" }),
    );
    expect(mockShowToast).toHaveBeenCalledWith("success", "Rule disassociated");
  });

  it("shows no rules available when the rule list is empty", async () => {
    mockRules.mockReturnValue({ data: { rules: [], total: 0 }, isLoading: false });
    const user = userEvent.setup();
    render(<Route53ResolverDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Rule associations");
    await user.click(screen.getByRole("button", { name: "Create association" }));
    const noRules = screen.getByRole("button", { name: "No rules available" }) as HTMLButtonElement;
    expect(noRules).toBeTruthy();
    expect(noRules.disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Associate" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("dismisses the associate modal via Cancel and Escape", async () => {
    const user = userEvent.setup();
    render(<Route53ResolverDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Rule associations");
    await user.click(screen.getByRole("button", { name: "Create association" }));
    await user.type(screen.getByPlaceholderText("vpc-0abc123"), "vpc-1");
    await clickInDialog(user, "Cancel");
    await user.click(screen.getByRole("button", { name: "Create association" }));
    await waitFor(() => expect(screen.getByText("Associate rule with VPC")).toBeTruthy());
    dismissModalWithEscape();
    expect(mockAssociate).not.toHaveBeenCalled();
  });
});

describe("Route53ResolverDashboard — Firewall domain lists tab", () => {
  it("lists domain lists with managed owner and fallbacks", async () => {
    const user = userEvent.setup();
    render(<Route53ResolverDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Firewall domain lists");
    expect(await screen.findByText("custom")).toBeTruthy();
    expect(screen.getByText("rslvr-fdl-abc")).toBeTruthy();
    expect(screen.getByText("Route 53 Resolver DNS Firewall")).toBeTruthy();
    expect(screen.getByText("3")).toBeTruthy();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("creates a domain list", async () => {
    const user = userEvent.setup();
    render(<Route53ResolverDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Firewall domain lists");
    await user.click(screen.getByRole("button", { name: "Create domain list" }));
    expect((screen.getByRole("button", { name: "Create" }) as HTMLButtonElement).disabled).toBe(true);
    await user.type(screen.getByPlaceholderText("my-domain-list"), "mine");
    await user.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() => expect(mockCreateList).toHaveBeenCalledWith({ name: "mine" }));
    expect(mockShowToast).toHaveBeenCalledWith("success", "Firewall domain list created");
  });

  it("shows error toast on domain list create failure", async () => {
    mockCreateList.mockRejectedValueOnce(new Error("dup"));
    const user = userEvent.setup();
    render(<Route53ResolverDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Firewall domain lists");
    await user.click(screen.getByRole("button", { name: "Create domain list" }));
    await user.type(screen.getByPlaceholderText("my-domain-list"), "mine");
    await user.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "dup"));
  });

  it("shows generic error toast on domain list create failure", async () => {
    mockCreateList.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<Route53ResolverDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Firewall domain lists");
    await user.click(screen.getByRole("button", { name: "Create domain list" }));
    await user.type(screen.getByPlaceholderText("my-domain-list"), "mine");
    await user.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to create domain list"));
  });

  it("deletes a domain list and shows the generic error toast on failure", async () => {
    mockDeleteList.mockRejectedValueOnce("boom");
    const user = userEvent.setup();
    render(<Route53ResolverDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Firewall domain lists");
    await user.click(await screen.findByRole("button", { name: "Delete rslvr-fdl-abc" }));
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to delete domain list"));
  });

  it("deletes a domain list and shows the success toast", async () => {
    const user = userEvent.setup();
    render(<Route53ResolverDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Firewall domain lists");
    await user.click(await screen.findByRole("button", { name: "Delete rslvr-fdl-abc" }));
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await waitFor(() => expect(mockDeleteList).toHaveBeenCalledWith("rslvr-fdl-abc"));
    expect(mockShowToast).toHaveBeenCalledWith("success", "Firewall domain list deleted");
  });

  it("dismisses the domain list create modal via Cancel and Escape", async () => {
    const user = userEvent.setup();
    render(<Route53ResolverDashboard />, { wrapper: createWrapper() });
    await clickTab(user, "Firewall domain lists");
    await user.click(screen.getByRole("button", { name: "Create domain list" }));
    await user.type(screen.getByPlaceholderText("my-domain-list"), "x");
    await clickInDialog(user, "Cancel");
    await user.click(screen.getByRole("button", { name: "Create domain list" }));
    await waitFor(() => expect(screen.getByText("Create firewall domain list")).toBeTruthy());
    dismissModalWithEscape();
    expect(mockCreateList).not.toHaveBeenCalled();
  });
});

describe("Route53ResolverDashboard — fallback rendering", () => {
  it("renders create buttons when all hooks return undefined data", async () => {
    mockEndpoints.mockReturnValue({ data: undefined, isLoading: false });
    mockRules.mockReturnValue({ data: undefined, isLoading: false });
    mockAssociations.mockReturnValue({ data: undefined, isLoading: false });
    mockDomainLists.mockReturnValue({ data: undefined, isLoading: false });
    const user = userEvent.setup();
    render(<Route53ResolverDashboard />, { wrapper: createWrapper() });
    expect(await screen.findByRole("button", { name: "Create endpoint" })).toBeTruthy();
    await user.click(screen.getByRole("tab", { name: "Rules" }));
    expect(screen.getByRole("button", { name: "Create rule" })).toBeTruthy();
    await user.click(screen.getByRole("tab", { name: "Rule associations" }));
    expect(screen.getByRole("button", { name: "Create association" })).toBeTruthy();
    await user.click(screen.getByRole("tab", { name: "Firewall domain lists" }));
    expect(screen.getByRole("button", { name: "Create domain list" })).toBeTruthy();
  });

  it("renders empty tables when all lists are empty", async () => {
    mockEndpoints.mockReturnValue({ data: { endpoints: [], total: 0 }, isLoading: false });
    mockRules.mockReturnValue({ data: { rules: [], total: 0 }, isLoading: false });
    mockAssociations.mockReturnValue({ data: { associations: [], total: 0 }, isLoading: false });
    mockDomainLists.mockReturnValue({ data: { domainLists: [], total: 0 }, isLoading: false });
    const user = userEvent.setup();
    render(<Route53ResolverDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.queryByText("rslvr-in-abc")).toBeNull());
    for (const name of ["Rules", "Rule associations", "Firewall domain lists"]) {
      await user.click(screen.getByRole("tab", { name }));
    }
    expect(screen.queryByText("rslvr-rr-abc")).toBeNull();
    expect(screen.queryByText("rslvr-rrassoc-abc")).toBeNull();
    expect(screen.queryByText("rslvr-fdl-abc")).toBeNull();
  });
});
