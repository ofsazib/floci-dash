// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

const mockWebAcls = vi.fn();
const mockCreateWebAcl = vi.fn();
const mockDeleteWebAcl = vi.fn();
const mockIPSets = vi.fn();
const mockRegexSets = vi.fn();
const mockRuleGroups = vi.fn();
const mockCreateIPSetMutate = vi.fn();
const mockCreateRegexSetMutate = vi.fn();
const mockUpdateRegexSetMutate = vi.fn();
const mockCreateRuleGroupMutate = vi.fn();
const mockPutLoggingMutate = vi.fn();
const mockDeleteLoggingMutateAsync = vi.fn();
const mockAssociateMutate = vi.fn();
const mockDisassociateMutate = vi.fn();
const mockPutPermissionMutate = vi.fn();
const mockDeletePermissionMutateAsync = vi.fn();
const mockLoggingConfigs = vi.fn();
const mockWebAclForResource = vi.fn();
const mockResourcesForWebAcl = vi.fn();
const mockPermissionPolicy = vi.fn();
const mockRegexSetQuery = vi.fn();

// Controllable state for delete-hook loading states (hoisted so vi.mock can use them)
const deleteWebAclState = vi.hoisted(() => ({ isPending: false, variables: null as any }));
const deleteIPSetState = vi.hoisted(() => ({ isPending: false, variables: null as any }));
const deleteRegexSetState = vi.hoisted(() => ({ isPending: false, variables: null as any }));
const deleteRuleGroupState = vi.hoisted(() => ({ isPending: false, variables: null as any }));
const deleteLoggingState = vi.hoisted(() => ({ isPending: false, variables: null as any }));
const deletePermissionState = vi.hoisted(() => ({ isPending: false, variables: null as any }));

vi.mock("../../hooks/useWafV2", () => ({
  useWebACLs: (...args: any[]) => mockWebAcls(...args),
  useCreateWebACL: () => ({ mutate: mockCreateWebAcl, isPending: false }),
  useDeleteWebACL: () => ({ mutateAsync: mockDeleteWebAcl, isPending: deleteWebAclState.isPending, variables: deleteWebAclState.variables }),
  useIPSets: (...args: any[]) => mockIPSets(...args),
  useRegexPatternSets: (...args: any[]) => mockRegexSets(...args),
  useRuleGroups: (...args: any[]) => mockRuleGroups(...args),
  useCreateIPSet: () => ({ mutate: mockCreateIPSetMutate, isPending: false, isError: false, error: null, reset: vi.fn() }),
  useUpdateIPSet: () => ({ mutate: vi.fn(), isPending: false, isError: false, error: null, reset: vi.fn() }),
  useDeleteIPSet: () => ({ mutateAsync: vi.fn().mockResolvedValue({}), isPending: deleteIPSetState.isPending, variables: deleteIPSetState.variables }),
  useRegexPatternSet: (...args: any[]) => mockRegexSetQuery(...args),
  useCreateRegexPatternSet: () => ({ mutate: mockCreateRegexSetMutate, isPending: false, isError: false, error: null, reset: vi.fn() }),
  useUpdateRegexPatternSet: () => ({ mutate: mockUpdateRegexSetMutate, isPending: false, isError: false, error: null, reset: vi.fn() }),
  useDeleteRegexPatternSet: () => ({ mutateAsync: vi.fn().mockResolvedValue({}), isPending: deleteRegexSetState.isPending, variables: deleteRegexSetState.variables }),
  useCreateRuleGroup: () => ({ mutate: mockCreateRuleGroupMutate, isPending: false, isError: false, error: null, reset: vi.fn() }),
  useDeleteRuleGroup: () => ({ mutateAsync: vi.fn().mockResolvedValue({}), isPending: deleteRuleGroupState.isPending, variables: deleteRuleGroupState.variables }),
  useLoggingConfigurations: (...args: any[]) => mockLoggingConfigs(...args),
  usePutLoggingConfiguration: () => ({ mutate: mockPutLoggingMutate, isPending: false, isError: false, error: null, reset: vi.fn() }),
  useDeleteLoggingConfiguration: () => ({ mutateAsync: mockDeleteLoggingMutateAsync, isPending: deleteLoggingState.isPending, variables: deleteLoggingState.variables }),
  useAssociateWebACL: () => ({ mutate: mockAssociateMutate, isPending: false, isError: false, error: null, reset: vi.fn() }),
  useDisassociateWebACL: () => ({ mutate: mockDisassociateMutate, isPending: false, isError: false, error: null, reset: vi.fn() }),
  useGetWebACLForResource: (...args: any[]) => mockWebAclForResource(...args),
  useResourcesForWebACL: (...args: any[]) => mockResourcesForWebAcl(...args),
  usePermissionPolicy: (...args: any[]) => mockPermissionPolicy(...args),
  usePutPermissionPolicy: () => ({ mutate: mockPutPermissionMutate, isPending: false, isError: false, error: null, reset: vi.fn() }),
  useDeletePermissionPolicy: () => ({ mutateAsync: mockDeletePermissionMutateAsync, isPending: deletePermissionState.isPending, variables: deletePermissionState.variables }),
}));

import { WafV2Dashboard } from "./WafV2Dashboard";

beforeEach(() => {
  vi.clearAllMocks();
  mockWebAcls.mockReturnValue({ data: { webAcls: [], total: 0 }, isLoading: false });
  mockIPSets.mockReturnValue({ data: { ipSets: [], total: 0 }, isLoading: false });
  mockRegexSets.mockReturnValue({ data: { regexPatternSets: [], total: 0 }, isLoading: false });
  mockRuleGroups.mockReturnValue({ data: { ruleGroups: [], total: 0 }, isLoading: false });
  mockLoggingConfigs.mockReturnValue({ data: { loggingConfigurations: [], total: 0 }, isLoading: false });
  mockWebAclForResource.mockReturnValue({ data: null, isLoading: false });
  mockResourcesForWebAcl.mockReturnValue({ data: null, isLoading: false });
  mockPermissionPolicy.mockReturnValue({ data: null, isLoading: false });
  mockRegexSetQuery.mockReturnValue({ data: null, isLoading: false, isError: false, error: null });
  deleteWebAclState.isPending = false;
  deleteWebAclState.variables = null;
  deleteIPSetState.isPending = false;
  deleteIPSetState.variables = null;
  deleteRegexSetState.isPending = false;
  deleteRegexSetState.variables = null;
  deleteRuleGroupState.isPending = false;
  deleteRuleGroupState.variables = null;
  deleteLoggingState.isPending = false;
  deleteLoggingState.variables = null;
  deletePermissionState.isPending = false;
  deletePermissionState.variables = null;
});

describe("WafV2Dashboard — create modals", () => {
  it("opens Create IP Set modal and cancels", async () => {
    const user = userEvent.setup();
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create IP set/i);
    await waitFor(() => expect(screen.getByText("Create IP Set")).toBeTruthy());
    const cancelBtns = screen.getAllByRole("button", { name: /Cancel/i });
    await user.click(cancelBtns[cancelBtns.length - 1]);
    expect(mockCreateIPSetMutate).not.toHaveBeenCalled();
  });

  it("opens Create Regex Pattern Set modal and cancels", async () => {
    const user = userEvent.setup();
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create regex set/i);
    await waitFor(() => expect(screen.getByText("Create Regex Pattern Set")).toBeTruthy());
    const cancelBtns = screen.getAllByRole("button", { name: /Cancel/i });
    await user.click(cancelBtns[cancelBtns.length - 1]);
    expect(mockCreateRegexSetMutate).not.toHaveBeenCalled();
  });

  it("opens Create Rule Group modal and cancels", async () => {
    const user = userEvent.setup();
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create rule group/i);
    await waitFor(() => expect(screen.getByText("Create Rule Group")).toBeTruthy());
    const cancelBtns = screen.getAllByRole("button", { name: /Cancel/i });
    await user.click(cancelBtns[cancelBtns.length - 1]);
    expect(mockCreateRuleGroupMutate).not.toHaveBeenCalled();
  });

  it("opens Configure Logging modal and cancels", async () => {
    const user = userEvent.setup();
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Configure logging/i);
    await waitFor(() => expect(screen.getByText("Configure Logging")).toBeTruthy());
    const cancelBtns = screen.getAllByRole("button", { name: /Cancel/i });
    await user.click(cancelBtns[cancelBtns.length - 1]);
    expect(mockPutLoggingMutate).not.toHaveBeenCalled();
  });

  it("opens Associate Web ACL modal and cancels", async () => {
    const user = userEvent.setup();
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    const assocBtns = screen.getAllByRole("button", { name: /Associate Web ACL/i });
    await user.click(assocBtns[0]);
    await waitFor(() => expect(screen.getByText(/Web ACL ARN/)).toBeTruthy());
    const cancelBtns = screen.getAllByRole("button", { name: /Cancel/i });
    await user.click(cancelBtns[cancelBtns.length - 1]);
    expect(mockAssociateMutate).not.toHaveBeenCalled();
  });

  it("opens Disassociate Web ACL modal and cancels", async () => {
    const user = userEvent.setup();
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    const disassocBtns = screen.getAllByRole("button", { name: /Disassociate Web ACL/i });
    await user.click(disassocBtns[0]);
    await waitFor(() => expect(screen.getByRole("button", { name: /^Disassociate$/ })).toBeTruthy());
    const cancelBtns = screen.getAllByRole("button", { name: /Cancel/i });
    await user.click(cancelBtns[cancelBtns.length - 1]);
    expect(mockDisassociateMutate).not.toHaveBeenCalled();
  });

  it("opens Put Permission Policy modal and cancels", async () => {
    const user = userEvent.setup();
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Put policy/i);
    await waitFor(() => expect(screen.getByText("Put Permission Policy")).toBeTruthy());
    const cancelBtns = screen.getAllByRole("button", { name: /Cancel/i });
    await user.click(cancelBtns[cancelBtns.length - 1]);
    expect(mockPutPermissionMutate).not.toHaveBeenCalled();
  });
});

describe("WafV2Dashboard — Logging Configuration", () => {
  it("renders logging configs with data", () => {
    mockLoggingConfigs.mockReturnValue({
      data: {
        loggingConfigurations: [{ ResourceArn: "arn:aws:wafv2:...webacl/test", LogDestinationConfigs: ["arn:aws:logs:..."], ManagedByFirewallManager: true }],
        total: 1,
      },
      isLoading: false,
    });
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("arn:aws:wafv2:...webacl/test")).toBeTruthy();
    expect(screen.getByText("Yes")).toBeTruthy();
  });

  it("shows No for FMS Managed when false", () => {
    mockLoggingConfigs.mockReturnValue({
      data: {
        loggingConfigurations: [{ ResourceArn: "arn:...", LogDestinationConfigs: [], ManagedByFirewallManager: false }],
        total: 1,
      },
      isLoading: false,
    });
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("No")).toBeTruthy();
  });

  it("shows em-dash for empty log destinations", () => {
    mockLoggingConfigs.mockReturnValue({
      data: {
        loggingConfigurations: [{ ResourceArn: "arn:...", LogDestinationConfigs: [], ManagedByFirewallManager: false }],
        total: 1,
      },
      isLoading: false,
    });
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("\u2014")).toBeTruthy();
  });
});

describe("WafV2Dashboard — Associations", () => {
  it("shows association lookup inputs", () => {
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByPlaceholderText(/arn:aws:elasticloadbalancing/)).toBeTruthy();
    const webAclInputs = screen.getAllByPlaceholderText(/arn:aws:wafv2.*webacl/);
    expect(webAclInputs.length).toBeGreaterThanOrEqual(1);
  });

  it("Look up is disabled when resource ARN is empty", () => {
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    const lookupBtns = screen.getAllByRole("button", { name: /Look up/i });
    expect(lookupBtns[0]).toBeDisabled();
  });

  it("Load policy is disabled when ARN is empty", () => {
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByRole("button", { name: /Load policy/i })).toBeDisabled();
  });

  it("shows associated Web ACL result", async () => {
    mockWebAclForResource.mockReturnValue({
      data: { webAcl: { Name: "associated-acl", ARN: "arn:aws:wafv2:...webacl/acl" } },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    const resourceInput = screen.getByPlaceholderText(/arn:aws:elasticloadbalancing/);
    await user.type(resourceInput, "arn:aws:elasticloadbalancing:us-east-1:123:loadbalancer/my-lb");
    const lookupBtns = screen.getAllByRole("button", { name: /Look up/i });
    await user.click(lookupBtns[0]);
    await waitFor(() => expect(screen.getByText(/associated-acl/)).toBeTruthy());
  });

  it("shows no Web ACL result when none associated", async () => {
    mockWebAclForResource.mockReturnValue({
      data: { webAcl: null },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    const resourceInput = screen.getByPlaceholderText(/arn:aws:elasticloadbalancing/);
    await user.type(resourceInput, "arn:aws:elasticloadbalancing:us-east-1:123:loadbalancer/other");
    const lookupBtns = screen.getAllByRole("button", { name: /Look up/i });
    await user.click(lookupBtns[0]);
    await waitFor(() => expect(screen.getByText(/No Web ACL associated/)).toBeTruthy());
  });

  it("shows resources for a Web ACL", async () => {
    mockResourcesForWebAcl.mockReturnValue({
      data: { resourceArns: ["arn:aws:elasticloadbalancing:...:lb-1", "arn:aws:apigateway:...:api-1"] },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    const webAclInputs = screen.getAllByPlaceholderText(/arn:aws:wafv2.*webacl/);
    await user.type(webAclInputs[0], "arn:aws:wafv2:us-east-1:123:webacl/my-acl");
    const lookupBtns = screen.getAllByRole("button", { name: /Look up/i });
    await user.click(lookupBtns[1]);
    await waitFor(() => expect(screen.getByText(/lb-1/)).toBeTruthy());
  });

  it("shows no resources when Web ACL has none", async () => {
    mockResourcesForWebAcl.mockReturnValue({
      data: { resourceArns: [] },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    const webAclInputs = screen.getAllByPlaceholderText(/arn:aws:wafv2.*webacl/);
    await user.type(webAclInputs[0], "arn:aws:wafv2:us-east-1:123:webacl/empty-acl");
    const lookupBtns = screen.getAllByRole("button", { name: /Look up/i });
    await user.click(lookupBtns[1]);
    await waitFor(() => expect(screen.getByText(/No resources associated/)).toBeTruthy());
  });
});

describe("WafV2Dashboard — Permission Policy", () => {
  it("shows policy when loaded", async () => {
    mockPermissionPolicy.mockReturnValue({
      data: { policy: '{"Version": "2012-10-17", "Statement": []}' },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    const permInput = screen.getAllByPlaceholderText(/arn:aws:wafv2.*webacl/)[1];
    await user.type(permInput, "arn:aws:wafv2:us-east-1:123:webacl/my-acl");
    await clickButton(user, /Load policy/i);
    await waitFor(() => expect(screen.getByText(/"Version"/)).toBeTruthy());
  });

  it("shows no policy message", async () => {
    mockPermissionPolicy.mockReturnValue({
      data: { policy: null },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    const permInput = screen.getAllByPlaceholderText(/arn:aws:wafv2.*webacl/)[1];
    await user.type(permInput, "arn:aws:wafv2:us-east-1:123:webacl/no-policy");
    await clickButton(user, /Load policy/i);
    await waitFor(() => expect(screen.getByText(/No permission policy set/)).toBeTruthy());
  });
});

describe("WafV2Dashboard — fallbacks", () => {
  it("shows em-dash for missing description in web ACL", () => {
    mockWebAcls.mockReturnValue({
      data: { webAcls: [{ Name: "no-desc", Id: "acl-1" }], total: 1 },
      isLoading: false,
    });
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    const dashes = screen.getAllByText("\u2014");
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it("shows em-dash for missing ARN in web ACL", () => {
    mockWebAcls.mockReturnValue({
      data: { webAcls: [{ Name: "no-arn", Id: "acl-1", Description: "Has desc" }], total: 1 },
      isLoading: false,
    });
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("no-arn")).toBeTruthy();
  });
});

describe("WafV2Dashboard", () => {
  it("renders all section headers", () => {
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/WAF v2 Web ACLs/i)).toBeTruthy();
    expect(screen.getByText("IP Sets")).toBeTruthy();
    expect(screen.getByText("Regex Pattern Sets")).toBeTruthy();
    expect(screen.getByText("Rule Groups")).toBeTruthy();
  });

  it("shows empty messages for all sections", () => {
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No web ACLs found/i)).toBeTruthy();
    expect(screen.getByText(/No IP sets found/i)).toBeTruthy();
    expect(screen.getByText(/No regex pattern sets found/i)).toBeTruthy();
    expect(screen.getByText(/No rule groups found/i)).toBeTruthy();
  });

  it("renders web ACLs with data", () => {
    mockWebAcls.mockReturnValue({
      data: { webAcls: [{ Name: "my-acl", Id: "acl-1", Description: "My ACL", ARN: "arn:aws:wafv2:..." }], total: 1 },
      isLoading: false,
    });
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-acl")).toBeTruthy();
  });

  it("renders IP sets with data", () => {
    mockIPSets.mockReturnValue({
      data: { ipSets: [{ Name: "my-ipset", Id: "ip-1", Description: "My IP set" }], total: 1 },
      isLoading: false,
    });
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-ipset")).toBeTruthy();
  });

  it("renders regex pattern sets with data", () => {
    mockRegexSets.mockReturnValue({
      data: { regexPatternSets: [{ Name: "my-regex", Id: "re-1", Description: "My regex" }], total: 1 },
      isLoading: false,
    });
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-regex")).toBeTruthy();
  });

  it("renders rule groups with data", () => {
    mockRuleGroups.mockReturnValue({
      data: { ruleGroups: [{ Name: "my-rule", Id: "rule-1", Description: "My rule group" }], total: 1 },
      isLoading: false,
    });
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-rule")).toBeTruthy();
  });

  it("opens create Web ACL modal and submits", async () => {
    const user = userEvent.setup();
    const { container } = render(<WafV2Dashboard />, { wrapper: createWrapper() });

    await clickButton(user, /Create/i);
    await waitFor(() => expect(container.textContent).toContain("Create Web ACL"));

    const nameInput = screen.getByPlaceholderText("my-web-acl");
    await user.type(nameInput, "new-acl");

    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    await user.click(createBtns[createBtns.length - 1]);

    await waitFor(() => {
      expect(mockCreateWebAcl).toHaveBeenCalled();
    });
  });

  it("cancels create Web ACL modal", async () => {
    const user = userEvent.setup();
    const { container } = render(<WafV2Dashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(container.textContent).toContain("Create Web ACL"));
    await clickButton(user, /Cancel/i);
    expect(mockCreateWebAcl).not.toHaveBeenCalled();
  });

  it("deletes a web ACL", async () => {
    mockWebAcls.mockReturnValue({
      data: { webAcls: [{ Name: "delete-me", Id: "acl-1" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("delete-me")).toBeTruthy());

    const deleteBtn = screen.getByRole("button", { name: /Delete delete-me/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    // The confirm dialog's "Delete" button is the last match (a section
    // DeleteButton icon also matches /^Delete$/i via a trimmed aria-label).
    await clickButton(user, /^Delete$/i, { last: true });
    await waitFor(() => {
      expect(mockDeleteWebAcl).toHaveBeenCalledWith(
        expect.objectContaining({ Id: "acl-1", Name: "delete-me" }),
      );
    });
  });

  it("filters web ACLs by name", async () => {
    mockWebAcls.mockReturnValue({
      data: {
        webAcls: [
          { Name: "alpha-acl", Id: "id1" },
          { Name: "beta-acl", Id: "id2" },
        ],
        total: 2,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("alpha-acl")).toBeTruthy());

    const filterInput = screen.getByPlaceholderText("Find web ACLs by name");
    await user.type(filterInput, "beta");
    await waitFor(() => expect(screen.queryByText("alpha-acl")).toBeNull());
  });
});

describe("WafV2Dashboard — data edge cases", () => {
  it("handles undefined web ACLs in data", () => {
    mockWebAcls.mockReturnValue({ data: {}, isLoading: false });
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No web ACLs found/i)).toBeTruthy();
  });

  it("handles undefined IP sets in data", () => {
    mockIPSets.mockReturnValue({ data: {}, isLoading: false });
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No IP sets found/i)).toBeTruthy();
  });

  it("handles undefined regex sets in data", () => {
    mockRegexSets.mockReturnValue({ data: {}, isLoading: false });
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No regex pattern sets found/i)).toBeTruthy();
  });

  it("handles undefined rule groups in data", () => {
    mockRuleGroups.mockReturnValue({ data: {}, isLoading: false });
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No rule groups found/i)).toBeTruthy();
  });

  it("handles undefined logging configs in data", () => {
    mockLoggingConfigs.mockReturnValue({ data: {}, isLoading: false });
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No logging configurations found/i)).toBeTruthy();
  });

  it("handles null web ACLs in data", () => {
    mockWebAcls.mockReturnValue({ data: { webAcls: null }, isLoading: false });
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No web ACLs found/i)).toBeTruthy();
  });

  it("handles null IP sets in data", () => {
    mockIPSets.mockReturnValue({ data: { ipSets: null }, isLoading: false });
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No IP sets found/i)).toBeTruthy();
  });

  it("handles null regex sets in data", () => {
    mockRegexSets.mockReturnValue({ data: { regexPatternSets: null }, isLoading: false });
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No regex pattern sets found/i)).toBeTruthy();
  });

  it("handles null rule groups in data", () => {
    mockRuleGroups.mockReturnValue({ data: { ruleGroups: null }, isLoading: false });
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No rule groups found/i)).toBeTruthy();
  });

  it("handles null logging configs in data", () => {
    mockLoggingConfigs.mockReturnValue({ data: { loggingConfigurations: null }, isLoading: false });
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No logging configurations found/i)).toBeTruthy();
  });

  it("handles IP sets with total undefined", () => {
    mockIPSets.mockReturnValue({
      data: { ipSets: [{ Name: "my-ipset", Id: "ip-1" }] },
      isLoading: false,
    });
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-ipset")).toBeTruthy();
  });

  it("handles regex sets with total undefined", () => {
    mockRegexSets.mockReturnValue({
      data: { regexPatternSets: [{ Name: "my-regex", Id: "re-1" }] },
      isLoading: false,
    });
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-regex")).toBeTruthy();
  });

  it("handles rule groups with total undefined", () => {
    mockRuleGroups.mockReturnValue({
      data: { ruleGroups: [{ Name: "my-rule", Id: "rule-1" }] },
      isLoading: false,
    });
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-rule")).toBeTruthy();
  });

  it("renders IP sets with missing description as em-dash", () => {
    mockIPSets.mockReturnValue({
      data: { ipSets: [{ Name: "ip-no-desc", Id: "ip-1" }], total: 1 },
      isLoading: false,
    });
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("ip-no-desc")).toBeTruthy();
    expect(screen.getByText("\u2014")).toBeTruthy();
  });

  it("renders regex sets with missing description as em-dash", () => {
    mockRegexSets.mockReturnValue({
      data: { regexPatternSets: [{ Name: "re-no-desc", Id: "re-1" }], total: 1 },
      isLoading: false,
    });
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("re-no-desc")).toBeTruthy();
    expect(screen.getByText("\u2014")).toBeTruthy();
  });

  it("renders rule groups with missing description as em-dash", () => {
    mockRuleGroups.mockReturnValue({
      data: { ruleGroups: [{ Name: "rg-no-desc", Id: "rg-1" }], total: 1 },
      isLoading: false,
    });
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("rg-no-desc")).toBeTruthy();
    expect(screen.getByText("\u2014")).toBeTruthy();
  });
});

describe("WafV2Dashboard — form submissions", () => {
  it("creates an IP set by filling form and submitting", async () => {
    const user = userEvent.setup();
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create IP set/i);
    await waitFor(() => expect(screen.getByText("Create IP Set")).toBeTruthy());

    // Fill in name
    await user.type(screen.getByPlaceholderText("my-ip-set"), "test-ip-set");

    // Click Create
    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    await user.click(createBtns[createBtns.length - 1]);

    await waitFor(() => {
      expect(mockCreateIPSetMutate).toHaveBeenCalledTimes(1);
    });
  });

  it("creates a regex pattern set by filling form and submitting", async () => {
    const user = userEvent.setup();
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create regex set/i);
    await waitFor(() => expect(screen.getByText("Create Regex Pattern Set")).toBeTruthy());

    // Fill in name
    await user.type(screen.getByPlaceholderText("my-regex-set"), "test-regex");

    // Click Create
    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    await user.click(createBtns[createBtns.length - 1]);

    await waitFor(() => {
      expect(mockCreateRegexSetMutate).toHaveBeenCalledTimes(1);
    });
  });

  it("creates a rule group by filling form and submitting", async () => {
    const user = userEvent.setup();
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create rule group/i);
    await waitFor(() => expect(screen.getByText("Create Rule Group")).toBeTruthy());

    // Fill in name
    await user.type(screen.getByPlaceholderText("my-rule-group"), "test-rule-group");

    // Click Create
    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    await user.click(createBtns[createBtns.length - 1]);

    await waitFor(() => {
      expect(mockCreateRuleGroupMutate).toHaveBeenCalledTimes(1);
    });
  });

  it("opens Configure Logging modal and shows Save button", async () => {
    const user = userEvent.setup();
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Configure logging/i);
    await waitFor(() => expect(screen.getByText("Configure Logging")).toBeTruthy());
    expect(screen.getByRole("button", { name: /Save/i })).toBeTruthy();
  });
});

describe("WafV2Dashboard — Edit Regex Set Modal", () => {
  it("shows Edit Regex Set modal", async () => {
    mockRegexSets.mockReturnValue({
      data: {
        regexPatternSets: [{ Name: "my-regex", Id: "re-1", Description: "Test regex" }],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-regex")).toBeTruthy());

    const editBtns = screen.getAllByRole("button", { name: /Edit/i });
    await user.click(editBtns[0]);

    await waitFor(() => {
      expect(screen.getByText(/Edit Regex Pattern Set/)).toBeTruthy();
    });
  });

  it("cancels Edit Regex Set modal", async () => {
    mockRegexSets.mockReturnValue({
      data: { regexPatternSets: [{ Name: "my-regex", Id: "re-1", Description: "Test" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-regex")).toBeTruthy());

    const editBtns = screen.getAllByRole("button", { name: /Edit/i });
    await user.click(editBtns[0]);
    await waitFor(() => expect(screen.getByText(/Edit Regex Pattern Set/)).toBeTruthy());

    const cancelBtns = screen.getAllByRole("button", { name: /Cancel/i });
    await user.click(cancelBtns[cancelBtns.length - 1]);
    await waitFor(() => expect(mockUpdateRegexSetMutate).not.toHaveBeenCalled());
  });
});

describe("WafV2Dashboard — delete loading states", () => {
  it("shows loading state on web ACL delete while pending", async () => {
    mockWebAcls.mockReturnValue({
      data: { webAcls: [{ Name: "pending-acl", Id: "acl-1" }], total: 1 },
      isLoading: false,
    });
    deleteWebAclState.isPending = true;
    deleteWebAclState.variables = { Name: "pending-acl" };
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("pending-acl")).toBeTruthy());
    expect(screen.getByRole("button", { name: /Delete pending-acl/i })).toBeDisabled();
  });

  it("shows loading state on IP set delete while pending", async () => {
    mockIPSets.mockReturnValue({
      data: { ipSets: [{ Name: "pending-ip", Id: "ip-1" }], total: 1 },
      isLoading: false,
    });
    deleteIPSetState.isPending = true;
    deleteIPSetState.variables = { Name: "pending-ip" };
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("pending-ip")).toBeTruthy());
    expect(screen.getByRole("button", { name: /Delete pending-ip/i })).toBeDisabled();
  });

  it("shows loading state on regex set delete while pending", async () => {
    mockRegexSets.mockReturnValue({
      data: { regexPatternSets: [{ Name: "pending-regex", Id: "re-1" }], total: 1 },
      isLoading: false,
    });
    deleteRegexSetState.isPending = true;
    deleteRegexSetState.variables = { Name: "pending-regex" };
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("pending-regex")).toBeTruthy());
    expect(screen.getByRole("button", { name: /Delete pending-regex/i })).toBeDisabled();
  });

  it("shows loading state on rule group delete while pending", async () => {
    mockRuleGroups.mockReturnValue({
      data: { ruleGroups: [{ Name: "pending-rule", Id: "rg-1" }], total: 1 },
      isLoading: false,
    });
    deleteRuleGroupState.isPending = true;
    deleteRuleGroupState.variables = { Name: "pending-rule" };
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("pending-rule")).toBeTruthy());
    expect(screen.getByRole("button", { name: /Delete pending-rule/i })).toBeDisabled();
  });

  it("shows loading state on logging config delete while pending", async () => {
    mockLoggingConfigs.mockReturnValue({
      data: {
        loggingConfigurations: [{ ResourceArn: "arn:...:webacl/log-acl", LogDestinationConfigs: ["arn:..."] }],
        total: 1,
      },
      isLoading: false,
    });
    deleteLoggingState.isPending = true;
    deleteLoggingState.variables = { ResourceArn: "arn:...:webacl/log-acl" };
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("arn:...:webacl/log-acl")).toBeTruthy());
    expect(screen.getByRole("button", { name: /Delete arn:\.\.\.:webacl\/log-acl/i })).toBeDisabled();
  });

  it("shows loading state on permission policy delete while pending", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<WafV2Dashboard />, { wrapper: createWrapper() });
    const permInput = screen.getAllByPlaceholderText(/arn:aws:wafv2.*webacl/)[1];
    await user.type(permInput, "arn:aws:wafv2:us-east-1:123:webacl/perm");
    deletePermissionState.isPending = true;
    deletePermissionState.variables = { ResourceArn: "arn:aws:wafv2:us-east-1:123:webacl/perm" };
    // Re-render so the hook re-reads the hoisted loading state; React preserves
    // the internal permissionResourceArn state (same component type/position).
    rerender(<WafV2Dashboard />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Delete arn:aws:wafv2:us-east-1:123:webacl\/perm/i })).toBeDisabled()
    );
  });
});

describe("WafV2Dashboard — misc edge cases", () => {
  it("filters web ACLs without crashing when a name is missing", async () => {
    mockWebAcls.mockReturnValue({
      data: {
        webAcls: [{ Name: null, Id: "id-null" }, { Name: "beta-acl", Id: "id-beta" }],
        total: 2,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("beta-acl")).toBeTruthy());
    const filterInput = screen.getByPlaceholderText("Find web ACLs by name");
    await user.type(filterInput, "beta");
    await waitFor(() => expect(screen.getByText("beta-acl")).toBeTruthy());
  });

  it("shows em-dash when logging config lacks destinations field", () => {
    mockLoggingConfigs.mockReturnValue({
      data: {
        loggingConfigurations: [{ ResourceArn: "arn:...", ManagedByFirewallManager: false }],
        total: 1,
      },
      isLoading: false,
    });
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("\u2014")).toBeTruthy();
  });

  it("rule group capacity falls back to 100 when cleared", async () => {
    const user = userEvent.setup();
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create rule group/i);
    await waitFor(() => expect(screen.getByText("Create Rule Group")).toBeTruthy());
    const capInput = screen.getByDisplayValue("100");
    fireEvent.change(capInput, { target: { value: "" } });
    expect(screen.getByDisplayValue("100")).toBeTruthy();
    fireEvent.change(screen.getByDisplayValue("100"), { target: { value: "250" } });
    expect(screen.getByDisplayValue("250")).toBeTruthy();
  });
});

describe("WafV2Dashboard — modal saves", () => {
  it("saves a logging configuration", async () => {
    const user = userEvent.setup();
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Configure logging/i);
    await waitFor(() => expect(screen.getByText("Configure Logging")).toBeTruthy());
    const arnInputs = screen.getAllByPlaceholderText(/arn:aws:wafv2.*webacl/);
    await user.type(arnInputs[arnInputs.length - 1], "arn:aws:wafv2:us-east-1:123:webacl/log");
    await user.type(screen.getByPlaceholderText("arn:aws:logs:..."), "arn:aws:logs:us-east-1:123:log-group:lg");
    await clickButton(user, /Save/i);
    await waitFor(() =>
      expect(mockPutLoggingMutate).toHaveBeenCalledWith(
        expect.objectContaining({ ResourceArn: "arn:aws:wafv2:us-east-1:123:webacl/log" }),
        expect.objectContaining({ onSuccess: expect.any(Function) })
      )
    );
  });

  it("logging Save is disabled until both fields are filled", async () => {
    const user = userEvent.setup();
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Configure logging/i);
    await waitFor(() => expect(screen.getByText("Configure Logging")).toBeTruthy());
    const arnInputs = screen.getAllByPlaceholderText(/arn:aws:wafv2.*webacl/);
    await user.type(arnInputs[arnInputs.length - 1], "arn:aws:wafv2:us-east-1:123:webacl/log");
    expect(screen.getByRole("button", { name: /Save/i })).toBeDisabled();
  });

  it("associates a web ACL to a resource", async () => {
    const user = userEvent.setup();
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getAllByRole("button", { name: /Associate Web ACL/i })[0]);
    await waitFor(() => expect(screen.getByText(/Web ACL ARN/)).toBeTruthy());
    const arnInputs = screen.getAllByPlaceholderText(/arn:aws:wafv2.*webacl/);
    await user.type(arnInputs[arnInputs.length - 1], "arn:aws:wafv2:us-east-1:123:webacl/acl");
    const lbInputs = screen.getAllByPlaceholderText("arn:aws:elasticloadbalancing:...");
    await user.type(lbInputs[lbInputs.length - 1], "arn:aws:elasticloadbalancing:us-east-1:123:loadbalancer/lb");
    await clickButton(user, /^Associate$/i);
    await waitFor(() =>
      expect(mockAssociateMutate).toHaveBeenCalledWith(
        expect.objectContaining({ WebACLArn: "arn:aws:wafv2:us-east-1:123:webacl/acl" }),
        expect.objectContaining({ onSuccess: expect.any(Function) })
      )
    );
  });

  it("Associate is disabled until both fields are filled", async () => {
    const user = userEvent.setup();
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getAllByRole("button", { name: /Associate Web ACL/i })[0]);
    await waitFor(() => expect(screen.getByText(/Web ACL ARN/)).toBeTruthy());
    const arnInputs = screen.getAllByPlaceholderText(/arn:aws:wafv2.*webacl/);
    await user.type(arnInputs[arnInputs.length - 1], "arn:aws:wafv2:us-east-1:123:webacl/acl");
    expect(screen.getByRole("button", { name: /^Associate$/i })).toBeDisabled();
  });

  it("disassociates a web ACL from a resource", async () => {
    const user = userEvent.setup();
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getAllByRole("button", { name: /Disassociate Web ACL/i })[0]);
    await waitFor(() => expect(screen.getByRole("button", { name: /^Disassociate$/ })).toBeTruthy());
    const lbInputs = screen.getAllByPlaceholderText("arn:aws:elasticloadbalancing:...");
    await user.type(lbInputs[lbInputs.length - 1], "arn:aws:elasticloadbalancing:us-east-1:123:loadbalancer/lb");
    await clickButton(user, /^Disassociate$/i);
    await waitFor(() =>
      expect(mockDisassociateMutate).toHaveBeenCalledWith(
        expect.objectContaining({ ResourceArn: "arn:aws:elasticloadbalancing:us-east-1:123:loadbalancer/lb" }),
        expect.objectContaining({ onSuccess: expect.any(Function) })
      )
    );
  });

  it("saves a permission policy", async () => {
    const user = userEvent.setup();
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Put policy/i);
    await waitFor(() => expect(screen.getByText("Put Permission Policy")).toBeTruthy());
    const arnInputs = screen.getAllByPlaceholderText(/arn:aws:wafv2.*webacl/);
    await user.type(arnInputs[arnInputs.length - 1], "arn:aws:wafv2:us-east-1:123:webacl/perm");
    // fireEvent.change avoids userEvent parsing the JSON braces as keyboard descriptors
    fireEvent.change(screen.getByPlaceholderText('{"Version": "2012-10-17", ...}'), {
      target: { value: '{"Version": "2012-10-17"}' },
    });
    await clickButton(user, /Save/i);
    await waitFor(() =>
      expect(mockPutPermissionMutate).toHaveBeenCalledWith(
        expect.objectContaining({ ResourceArn: "arn:aws:wafv2:us-east-1:123:webacl/perm" }),
        expect.objectContaining({ onSuccess: expect.any(Function) })
      )
    );
  });

  it("permission policy Save is disabled until policy is entered", async () => {
    const user = userEvent.setup();
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Put policy/i);
    await waitFor(() => expect(screen.getByText("Put Permission Policy")).toBeTruthy());
    const arnInputs = screen.getAllByPlaceholderText(/arn:aws:wafv2.*webacl/);
    await user.type(arnInputs[arnInputs.length - 1], "arn:aws:wafv2:us-east-1:123:webacl/perm");
    expect(screen.getByRole("button", { name: /Save/i })).toBeDisabled();
  });
});

describe("WafV2Dashboard — Edit Regex Set data states", () => {
  it("loads and saves the regex set from the query", async () => {
    mockRegexSets.mockReturnValue({
      data: { regexPatternSets: [{ Name: "my-regex", Id: "re-1", Description: "Test" }], total: 1 },
      isLoading: false,
    });
    mockRegexSetQuery.mockReturnValue({
      data: {
        regexPatternSet: {
          Description: "SQL patterns",
          RegularExpressionList: [{ RegexString: ".*union.*" }, { RegexString: ".*select.*" }],
          LockToken: "tok-1",
        },
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-regex")).toBeTruthy());
    await user.click(screen.getAllByRole("button", { name: /Edit/i })[0]);
    await waitFor(() => expect(screen.getByDisplayValue("SQL patterns")).toBeTruthy());
    const textarea = screen.getByPlaceholderText(".*union.*select.*") as HTMLTextAreaElement;
    expect(textarea.value).toBe(".*union.*\n.*select.*");
    await clickButton(user, /Save/i);
    await waitFor(() =>
      expect(mockUpdateRegexSetMutate).toHaveBeenCalledWith(
        expect.objectContaining({ Id: "re-1", Name: "my-regex", LockToken: "tok-1", Description: "SQL patterns" }),
        expect.objectContaining({ onSuccess: expect.any(Function) })
      )
    );
  });

  it("handles minimal regex set data and saves without description", async () => {
    mockRegexSets.mockReturnValue({
      data: { regexPatternSets: [{ Name: "my-regex", Id: "re-1" }], total: 1 },
      isLoading: false,
    });
    mockRegexSetQuery.mockReturnValue({
      data: { regexPatternSet: { LockToken: "tok-2" } },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-regex")).toBeTruthy());
    await user.click(screen.getAllByRole("button", { name: /Edit/i })[0]);
    await waitFor(() => expect(screen.getByPlaceholderText(".*union.*select.*")).toBeTruthy());
    await clickButton(user, /Save/i);
    await waitFor(() =>
      expect(mockUpdateRegexSetMutate).toHaveBeenCalledWith(
        expect.objectContaining({ Description: undefined, RegularExpressionList: [] }),
        expect.objectContaining({ onSuccess: expect.any(Function) })
      )
    );
  });

  it("shows a spinner while the regex set query is loading", async () => {
    mockRegexSets.mockReturnValue({
      data: { regexPatternSets: [{ Name: "my-regex", Id: "re-1" }], total: 1 },
      isLoading: false,
    });
    mockRegexSetQuery.mockReturnValue({ data: null, isLoading: true, isError: false, error: null });
    const user = userEvent.setup();
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-regex")).toBeTruthy());
    await user.click(screen.getAllByRole("button", { name: /Edit/i })[0]);
    await waitFor(() => expect(screen.getByText(/Edit Regex Pattern Set/)).toBeTruthy());
    expect(screen.queryByPlaceholderText(".*union.*select.*")).toBeFalsy();
  });

  it("shows an error alert when the regex set query fails", async () => {
    mockRegexSets.mockReturnValue({
      data: { regexPatternSets: [{ Name: "my-regex", Id: "re-1" }], total: 1 },
      isLoading: false,
    });
    mockRegexSetQuery.mockReturnValue({ data: null, isLoading: false, isError: true, error: new Error("x") });
    const user = userEvent.setup();
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-regex")).toBeTruthy());
    await user.click(screen.getAllByRole("button", { name: /Edit/i })[0]);
    await waitFor(() => expect(screen.getByText("Failed to load regex pattern set.")).toBeTruthy());
  });
});
