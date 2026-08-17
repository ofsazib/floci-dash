// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

/** Assert the modal with the given header is hidden (Cloudscape uses display:none). */
function expectModalHidden(headerText: string) {
  const header = screen
    .getAllByText(headerText)
    .find((h) => h.closest('[role="dialog"]'));
  const dialog = header!.closest('[role="dialog"]') as HTMLElement;
  expect(dialog.className).toContain("hidden");
}

/** Cloudscape Modal handles Escape via a React onKeyDown on the dialog element. */
function dismissModalWithEscape() {
  const dialog = Array.from(document.querySelectorAll('[class*="awsui_dialog"]'))
    .filter((d) => !d.className.includes("hidden"))
    .pop() as HTMLElement;
  fireEvent.keyDown(dialog, { keyCode: 27, key: "Escape" });
}

/** The currently visible Cloudscape dialog (hidden ones stay mounted with display:none). */
function visibleDialog(): HTMLElement {
  const dialogs = Array.from(document.querySelectorAll('[role="dialog"]')).filter(
    (d) => !d.className.includes("hidden"),
  );
  return dialogs[dialogs.length - 1] as HTMLElement;
}

const toastMock = vi.fn();
vi.mock("../../components/Toast", () => ({
  useToast: () => ({ showToast: toastMock }),
}));

const mockWebAcls = vi.fn();
const mockCreateWebAcl = vi.fn();
const mockDeleteWebAcl = vi.fn();
const mockUpdateWebAclMutate = vi.fn();
const mockCheckCapacityMutate = vi.fn();
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
  useUpdateWebACL: () => ({ mutate: mockUpdateWebAclMutate, isPending: false, isError: false, error: null, reset: vi.fn() }),
  useCheckCapacity: () => ({ mutate: mockCheckCapacityMutate, isPending: false, isError: false, error: null, reset: vi.fn() }),
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
  mockUpdateWebAclMutate.mockReset();
  mockUpdateWebAclMutate.mockImplementation((_payload: any, opts?: any) => {
    opts?.onSuccess?.();
    return Promise.resolve({});
  });
  mockCheckCapacityMutate.mockReset();
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

describe("WafV2Dashboard — modal dismiss & success paths", () => {
  it("dismisses create Web ACL modal with Escape, Cancel, and closes on success", async () => {
    mockCreateWebAcl.mockImplementation((_body: any, opts: any) =>
      opts?.onSuccess?.(),
    );
    const user = userEvent.setup();
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create Web ACL/i);
    await waitFor(() =>
      expect(screen.getAllByText("Create Web ACL").length).toBeGreaterThan(1),
    );
    document
      .querySelectorAll('[class*="awsui_dialog"]')
      .forEach((dialog) => {
        fireEvent.keyDown(dialog as HTMLElement, { keyCode: 27, key: "Escape" });
      });
    await waitFor(() => expectModalHidden("Create Web ACL"));
    // Reopen and Cancel
    await clickButton(user, /Create Web ACL/i);
    await waitFor(() =>
      expect(screen.getAllByText("Create Web ACL").length).toBeGreaterThan(1),
    );
    const cancelBtns = screen.getAllByRole("button", { name: /Cancel/i });
    await user.click(cancelBtns[cancelBtns.length - 1]);
    await waitFor(() => expectModalHidden("Create Web ACL"));
    // Reopen, fill, and submit with onSuccess
    await clickButton(user, /Create Web ACL/i);
    await waitFor(() =>
      expect(screen.getAllByText("Create Web ACL").length).toBeGreaterThan(1),
    );
    await user.type(screen.getByPlaceholderText("my-web-acl"), "acl-ok");
    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    await user.click(createBtns[createBtns.length - 1]);
    await waitFor(() => {
      expect(mockCreateWebAcl).toHaveBeenCalledWith(
        expect.objectContaining({ Name: "acl-ok" }),
        expect.any(Object),
      );
    });
    await waitFor(() => expectModalHidden("Create Web ACL"));
  });

  it("creates an IP set with description and addresses and shows success toast", async () => {
    mockCreateIPSetMutate.mockImplementation((_body: any, opts: any) =>
      opts?.onSuccess?.(),
    );
    const user = userEvent.setup();
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create IP set/i);
    await waitFor(() =>
      expect(screen.getByText("Create IP Set")).toBeTruthy(),
    );
    await user.type(screen.getByPlaceholderText("my-ip-set"), "blocked");
    await user.type(screen.getByPlaceholderText("Blocked IPs"), "My blocked IPs");
    await user.type(screen.getByPlaceholderText("10.0.0.0/8"), "10.0.0.0/8");
    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    await user.click(createBtns[createBtns.length - 1]);
    await waitFor(() => {
      expect(mockCreateIPSetMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          Name: "blocked",
          Description: "My blocked IPs",
          Addresses: ["10.0.0.0/8"],
        }),
        expect.any(Object),
      );
    });
    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith("success", "IP set created"),
    );
  });

  it("creates a regex pattern set with patterns and shows success toast", async () => {
    mockCreateRegexSetMutate.mockImplementation((_body: any, opts: any) =>
      opts?.onSuccess?.(),
    );
    const user = userEvent.setup();
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create regex set/i);
    await waitFor(() =>
      expect(screen.getByText("Create Regex Pattern Set")).toBeTruthy(),
    );
    await user.type(screen.getByPlaceholderText("my-regex-set"), "sql");
    await user.type(
      screen.getByPlaceholderText("SQL injection patterns"),
      "desc",
    );
    await user.type(
      screen.getByPlaceholderText(".*union.*select.*"),
      ".*union.*select.*",
    );
    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    await user.click(createBtns[createBtns.length - 1]);
    await waitFor(() => {
      expect(mockCreateRegexSetMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          Name: "sql",
          RegularExpressionList: [{ RegexString: ".*union.*select.*" }],
        }),
        expect.any(Object),
      );
    });
    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(
        "success",
        "Regex pattern set created",
      ),
    );
  });

  it("updates a regex pattern set and shows success toast", async () => {
    mockUpdateRegexSetMutate.mockImplementation((_body: any, opts: any) =>
      opts?.onSuccess?.(),
    );
    mockRegexSets.mockReturnValue({
      data: {
        regexPatternSets: [{ Name: "my-regex", Id: "re-1", Description: "Test" }],
        total: 1,
      },
      isLoading: false,
    });
    mockRegexSetQuery.mockReturnValue({
      data: {
        regexPatternSet: {
          Id: "re-1",
          Name: "my-regex",
          Description: "old",
          LockToken: "lt-1",
          RegularExpressionList: [{ RegexString: "a" }],
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
    await waitFor(() =>
      expect(screen.getByText(/Edit Regex Pattern Set/)).toBeTruthy(),
    );
    await user.type(
      screen.getByPlaceholderText("SQL injection patterns"),
      "new-pattern",
    );
    await user.type(
      screen.getAllByPlaceholderText(".*union.*select.*")[0],
      "new-regex",
    );
    const saveBtns = screen.getAllByRole("button", { name: /^Save$/i });
    await user.click(saveBtns[saveBtns.length - 1]);
    await waitFor(() => {
      expect(mockUpdateRegexSetMutate).toHaveBeenCalledWith(
        expect.objectContaining({ Id: "re-1", LockToken: "lt-1" }),
        expect.any(Object),
      );
    });
    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(
        "success",
        "Regex pattern set updated",
      ),
    );
  });

  it("creates a rule group with description and shows success toast", async () => {
    mockCreateRuleGroupMutate.mockImplementation((_body: any, opts: any) =>
      opts?.onSuccess?.(),
    );
    const user = userEvent.setup();
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create rule group/i);
    await waitFor(() =>
      expect(screen.getByText("Create Rule Group")).toBeTruthy(),
    );
    await user.type(screen.getByPlaceholderText("my-rule-group"), "rg");
    await user.type(
      screen.getByPlaceholderText("Rate limiting rules"),
      "desc",
    );
    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    await user.click(createBtns[createBtns.length - 1]);
    await waitFor(() => {
      expect(mockCreateRuleGroupMutate).toHaveBeenCalledWith(
        expect.objectContaining({ Name: "rg", Description: "desc" }),
        expect.any(Object),
      );
    });
    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith("success", "Rule group created"),
    );
  });

  it("saves a logging configuration and shows success toast", async () => {
    mockPutLoggingMutate.mockImplementation((_body: any, opts: any) =>
      opts?.onSuccess?.(),
    );
    const user = userEvent.setup();
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Configure logging/i);
    await waitFor(() =>
      expect(screen.getByText("Configure Logging")).toBeTruthy(),
    );
    const dialog = visibleDialog();
    await user.type(
      within(dialog).getByPlaceholderText("arn:aws:wafv2:...:webacl/..."),
      "arn:aws:wafv2:us-east-1:123:webacl/a1",
    );
    await user.type(
      within(dialog).getByPlaceholderText("arn:aws:logs:..."),
      "arn:aws:logs:us-east-1:123:log-group:lg1",
    );
    await user.click(screen.getByRole("button", { name: /^Save$/i }));
    await waitFor(() => {
      expect(mockPutLoggingMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          ResourceArn: "arn:aws:wafv2:us-east-1:123:webacl/a1",
        }),
        expect.any(Object),
      );
    });
    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(
        "success",
        "Logging configuration saved",
      ),
    );
  });

  it("associates a web ACL and shows success toast", async () => {
    mockAssociateMutate.mockImplementation((_body: any, opts: any) =>
      opts?.onSuccess?.(),
    );
    const user = userEvent.setup();
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    const assocBtns = screen.getAllByRole("button", {
      name: /Associate Web ACL/i,
    });
    await user.click(assocBtns[0]);
    await waitFor(() =>
      expect(screen.getByText(/Web ACL ARN/)).toBeTruthy(),
    );
    const dialog = visibleDialog();
    await user.type(
      within(dialog).getByPlaceholderText("arn:aws:wafv2:...:webacl/..."),
      "arn:aws:wafv2:us-east-1:123:webacl/a1",
    );
    await user.type(
      within(dialog).getByPlaceholderText("arn:aws:elasticloadbalancing:..."),
      "arn:aws:elasticloadbalancing:us-east-1:123:loadbalancer/app/lb1",
    );
    await user.click(
      screen.getAllByRole("button", { name: /^Associate$/ })[
        screen.getAllByRole("button", { name: /^Associate$/ }).length - 1
      ],
    );
    await waitFor(() => {
      expect(mockAssociateMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          ResourceArn: "arn:aws:elasticloadbalancing:us-east-1:123:loadbalancer/app/lb1",
        }),
        expect.any(Object),
      );
    });
    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith("success", "Web ACL associated"),
    );
  });

  it("disassociates a web ACL and shows success toast", async () => {
    mockDisassociateMutate.mockImplementation((_body: any, opts: any) =>
      opts?.onSuccess?.(),
    );
    const user = userEvent.setup();
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    const disassocBtns = screen.getAllByRole("button", {
      name: /Disassociate Web ACL/i,
    });
    await user.click(disassocBtns[0]);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /^Disassociate$/ }),
      ).toBeTruthy(),
    );
    const dialog = visibleDialog();
    await user.type(
      within(dialog).getByPlaceholderText("arn:aws:elasticloadbalancing:..."),
      "arn:aws:elasticloadbalancing:us-east-1:123:loadbalancer/app/lb1",
    );
    await user.click(
      screen.getAllByRole("button", { name: /^Disassociate$/ })[
        screen.getAllByRole("button", { name: /^Disassociate$/ }).length - 1
      ],
    );
    await waitFor(() => {
      expect(mockDisassociateMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          ResourceArn: "arn:aws:elasticloadbalancing:us-east-1:123:loadbalancer/app/lb1",
        }),
        expect.any(Object),
      );
    });
    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(
        "success",
        "Web ACL disassociated",
      ),
    );
  });

  it("puts a permission policy and shows success toast", async () => {
    mockPutPermissionMutate.mockImplementation((_body: any, opts: any) =>
      opts?.onSuccess?.(),
    );
    const user = userEvent.setup();
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Put policy/i);
    await waitFor(() =>
      expect(screen.getByText("Put Permission Policy")).toBeTruthy(),
    );
    const dialog = visibleDialog();
    await user.type(
      within(dialog).getByPlaceholderText("arn:aws:wafv2:...:webacl/..."),
      "arn:aws:wafv2:us-east-1:123:webacl/a1",
    );
    fireEvent.change(
      within(dialog).getByPlaceholderText('{"Version": "2012-10-17", ...}'),
      { target: { value: '{"Version":"2012-10-17","Statement":[]}' } },
    );
    await user.click(screen.getByRole("button", { name: /^Save$/i }));
    await waitFor(() => {
      expect(mockPutPermissionMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          ResourceArn: "arn:aws:wafv2:us-east-1:123:webacl/a1",
        }),
        expect.any(Object),
      );
    });
    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(
        "success",
        "Permission policy saved",
      ),
    );
  });

  it("deletes an IP set via confirmation", async () => {
    mockIPSets.mockReturnValue({
      data: {
        ipSets: [{ Name: "blocked", Id: "ip-1" }],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("blocked")).toBeTruthy());
    const deleteBtn = screen.getByRole("button", {
      name: /Delete blocked/i,
    });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i, { last: true });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Delete blocked/i })).toBeTruthy();
    });
  });

  it("deletes a regex pattern set via confirmation", async () => {
    mockRegexSets.mockReturnValue({
      data: {
        regexPatternSets: [{ Name: "regexi", Id: "re-1" }],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("regexi")).toBeTruthy());
    await user.click(
      screen.getByRole("button", { name: /Delete regexi/i }),
    );
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i, { last: true });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Delete regexi/i })).toBeTruthy(),
    );
  });

  it("deletes a rule group via confirmation", async () => {
    mockRuleGroups.mockReturnValue({
      data: { ruleGroups: [{ Name: "rg-del", Id: "rg-1" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("rg-del")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete rg-del/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i, { last: true });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Delete rg-del/i })).toBeTruthy(),
    );
  });

  it("deletes a logging configuration via confirmation", async () => {
    mockLoggingConfigs.mockReturnValue({
      data: {
        loggingConfigurations: [
          { ResourceArn: "arn:aws:wafv2:us-east-1:123:webacl/a1", LogDestinationConfigs: ["lg"] },
        ],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    await waitFor(() =>
      expect(screen.getByText("arn:aws:wafv2:us-east-1:123:webacl/a1")).toBeTruthy(),
    );
    await user.click(
      screen.getByRole("button", {
        name: /Delete arn:aws:wafv2:us-east-1:123:webacl\/a1/i,
      }),
    );
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i, { last: true });
    await waitFor(() =>
      expect(
        screen.getByRole("button", {
          name: /Delete arn:aws:wafv2:us-east-1:123:webacl\/a1/i,
        }),
      ).toBeTruthy(),
    );
  });

  it("deletes a permission policy via confirmation", async () => {
    const user = userEvent.setup();
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    // The permission section input is the last of the two page-level ARN inputs
    await user.type(
      screen.getAllByPlaceholderText("arn:aws:wafv2:...:webacl/...")[1],
      "arn:aws:wafv2:us-east-1:123:webacl/a1",
    );
    await user.click(
      screen.getByRole("button", {
        name: /Delete arn:aws:wafv2:us-east-1:123:webacl\/a1/i,
      }),
    );
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i, { last: true });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Put policy/i })).toBeTruthy();
    });
  });
});

describe("WafV2Dashboard — edit web ACL + capacity check", () => {
  const ACL = { Name: "my-acl", Id: "acl-1", Description: "My ACL", ARN: "arn:aws:wafv2:us-east-1:123:regional/webacl/my-acl/abc" };

  async function openEdit(user: ReturnType<typeof userEvent.setup>) {
    mockWebAcls.mockReturnValue({ data: { webAcls: [ACL], total: 1 }, isLoading: false });
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-acl")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Edit$/i }));
    await waitFor(() =>
      expect(screen.getByRole("dialog", { name: /Edit Web ACL — my-acl/ })).toBeTruthy(),
    );
  }

  it("opens the edit modal with prefilled description and saves", async () => {
    const user = userEvent.setup();
    await openEdit(user);
    const dialog = () =>
      within(screen.getByRole("dialog", { name: /Edit Web ACL — my-acl/ }));
    expect(dialog().getByDisplayValue("My ACL")).toBeTruthy();
    // Edit the description
    await user.clear(dialog().getByRole("textbox", { name: /Description/i }));
    await user.type(dialog().getByRole("textbox", { name: /Description/i }), "Renamed ACL");
    // Switch default action to Block and add a rule
    await user.click(dialog().getByRole("button", { name: /Allow/i }));
    await user.click(screen.getByRole("option", { name: /Block/i }));
    fireEvent.change(dialog().getByRole("textbox", { name: /Rules \(JSON array\)/i }), {
      target: { value: '[{"Name": "r1", "Priority": 1}]' },
    });
    await user.click(dialog().getByRole("button", { name: /^Save$/i }));
    await waitFor(() =>
      expect(mockUpdateWebAclMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          Id: "acl-1",
          Name: "my-acl",
          Scope: "REGIONAL",
          LockToken: "placeholder",
          Description: "Renamed ACL",
          DefaultAction: { Block: {} },
          Rules: [{ Name: "r1", Priority: 1 }],
        }),
        expect.anything(),
      ),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: /Edit Web ACL/ })).toBeNull(),
    );
    expect(toastMock).toHaveBeenCalledWith("success", "Web ACL updated");
  });

  it("omits the description when it is the em-dash placeholder", async () => {
    mockWebAcls.mockReturnValue({
      data: { webAcls: [{ Name: "no-desc", Id: "acl-2", ARN: "arn:2" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<WafV2Dashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("no-desc")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Edit$/i }));
    await waitFor(() =>
      expect(screen.getByRole("dialog", { name: /Edit Web ACL — no-desc/ })).toBeTruthy(),
    );
    const dialog = () =>
      within(screen.getByRole("dialog", { name: /Edit Web ACL — no-desc/ }));
    expect(dialog().getByRole("textbox", { name: /Description/i })).toHaveValue("");
    await user.click(dialog().getByRole("button", { name: /^Save$/i }));
    await waitFor(() =>
      expect(mockUpdateWebAclMutate).toHaveBeenCalledWith(
        expect.objectContaining({ Description: undefined }),
        expect.anything(),
      ),
    );
  });

  it("shows a validation error for invalid rules JSON and fixes it", async () => {
    const user = userEvent.setup();
    await openEdit(user);
    const dialog = () =>
      within(screen.getByRole("dialog", { name: /Edit Web ACL — my-acl/ }));
    fireEvent.change(dialog().getByRole("textbox", { name: /Rules \(JSON array\)/i }), {
      target: { value: "{not json" },
    });
    await user.click(dialog().getByRole("button", { name: /^Save$/i }));
    await waitFor(() => expect(screen.getByText("Rules must be valid JSON")).toBeTruthy());
    expect(mockUpdateWebAclMutate).not.toHaveBeenCalled();
    // Dismiss the error alert
    const dismiss = document.querySelector('[class*="awsui_dismiss-button"]') as HTMLElement;
    fireEvent.click(dismiss);
    await waitFor(() => expect(screen.queryByText("Rules must be valid JSON")).toBeNull());
  });

  it("shows the fallback error when the update fails without a message", async () => {
    mockUpdateWebAclMutate.mockImplementation((_payload: any, opts?: any) => {
      opts?.onError?.(new Error());
      return Promise.reject(new Error());
    });
    const user = userEvent.setup();
    await openEdit(user);
    const dialog = () =>
      within(screen.getByRole("dialog", { name: /Edit Web ACL — my-acl/ }));
    await user.click(dialog().getByRole("button", { name: /^Save$/i }));
    await waitFor(() =>
      expect(screen.getByText("Failed to update web ACL")).toBeTruthy(),
    );
  });

  it("checks capacity and shows the result", async () => {
    mockCheckCapacityMutate.mockImplementation((_payload: any, opts?: any) => {
      opts?.onSuccess?.({ capacity: 1500 });
      return Promise.resolve({ capacity: 1500 });
    });
    const user = userEvent.setup();
    await openEdit(user);
    const dialog = () =>
      within(screen.getByRole("dialog", { name: /Edit Web ACL — my-acl/ }));
    fireEvent.change(dialog().getByRole("textbox", { name: /Rules \(JSON array\)/i }), {
      target: { value: '[{"Name": "r1", "Priority": 1}]' },
    });
    await user.click(dialog().getByRole("button", { name: /Check capacity/i }));
    await waitFor(() => expect(screen.getByText("Capacity: 1500 units")).toBeTruthy());
    expect(mockCheckCapacityMutate).toHaveBeenCalledWith(
      expect.objectContaining({ Rules: [{ Name: "r1", Priority: 1 }], Scope: "REGIONAL" }),
      expect.anything(),
    );
    // Dismiss the success alert
    const dismiss = document.querySelector('[class*="awsui_dismiss-button"]') as HTMLElement;
    fireEvent.click(dismiss);
    await waitFor(() => expect(screen.queryByText("Capacity: 1500 units")).toBeNull());
  });

  it("shows capacity errors for invalid JSON and failed checks", async () => {
    const user = userEvent.setup();
    await openEdit(user);
    const dialog = () =>
      within(screen.getByRole("dialog", { name: /Edit Web ACL — my-acl/ }));
    fireEvent.change(dialog().getByRole("textbox", { name: /Rules \(JSON array\)/i }), {
      target: { value: "bad json" },
    });
    await user.click(dialog().getByRole("button", { name: /Check capacity/i }));
    await waitFor(() =>
      expect(screen.getByText("Rules must be valid JSON")).toBeTruthy(),
    );
    // Fix the JSON, then fail the check with a message-less error
    fireEvent.change(dialog().getByRole("textbox", { name: /Rules \(JSON array\)/i }), {
      target: { value: "[]" },
    });
    mockCheckCapacityMutate.mockImplementation((_payload: any, opts?: any) => {
      opts?.onError?.(new Error());
      return Promise.reject(new Error());
    });
    await user.click(dialog().getByRole("button", { name: /Check capacity/i }));
    await waitFor(() =>
      expect(screen.getByText("Capacity check failed")).toBeTruthy(),
    );
    // Dismiss the capacity error alert
    const dismiss = document.querySelector('[class*="awsui_dismiss-button"]') as HTMLElement;
    fireEvent.click(dismiss);
    await waitFor(() =>
      expect(screen.queryByText("Capacity check failed")).toBeNull(),
    );
  });

  it("falls back to an empty rules array when the rules textarea is cleared", async () => {
    const user = userEvent.setup();
    await openEdit(user);
    const dialog = () =>
      within(screen.getByRole("dialog", { name: /Edit Web ACL — my-acl/ }));
    await user.clear(dialog().getByRole("textbox", { name: /Rules \(JSON array\)/i }));
    await user.click(dialog().getByRole("button", { name: /^Save$/i }));
    await waitFor(() =>
      expect(mockUpdateWebAclMutate).toHaveBeenCalledWith(
        expect.objectContaining({ Rules: [] }),
        expect.anything(),
      ),
    );
  });

  it("checks capacity with the empty-rules fallback", async () => {
    mockCheckCapacityMutate.mockImplementation((_payload: any, opts?: any) => {
      opts?.onSuccess?.({ capacity: 0 });
      return Promise.resolve({ capacity: 0 });
    });
    const user = userEvent.setup();
    await openEdit(user);
    const dialog = () =>
      within(screen.getByRole("dialog", { name: /Edit Web ACL — my-acl/ }));
    await user.clear(dialog().getByRole("textbox", { name: /Rules \(JSON array\)/i }));
    await user.click(dialog().getByRole("button", { name: /Check capacity/i }));
    await waitFor(() =>
      expect(mockCheckCapacityMutate).toHaveBeenCalledWith(
        expect.objectContaining({ Rules: [] }),
        expect.anything(),
      ),
    );
  });

  it("dismisses the edit modal with Escape", async () => {
    const user = userEvent.setup();
    await openEdit(user);
    dismissModalWithEscape();
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: /Edit Web ACL/ })).toBeNull(),
    );
  });

  it("cancels the edit modal", async () => {
    const user = userEvent.setup();
    await openEdit(user);
    const dialog = () =>
      within(screen.getByRole("dialog", { name: /Edit Web ACL — my-acl/ }));
    await user.click(dialog().getByRole("button", { name: /^Cancel$/i }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: /Edit Web ACL/ })).toBeNull(),
    );
  });
});
