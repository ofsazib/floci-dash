// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createWrapper } from "../../../test/helpers";
import React from "react";

const INSTANCE = "arn:aws:sso:::instance/ssoins-7223b02a5d9f7c8e";
const PS_ARN = "arn:aws:sso:::permissionSet/ssoins-7223b02a5d9f7c8e/ps-aaaaaaaaaaaaaaaa";
const PS_ARN2 = "arn:aws:sso:::permissionSet/ssoins-7223b02a5d9f7c8e/ps-bbbbbbbbbbbbbbbb";
const TTI_ARN =
  "arn:aws:sso::123456789012:trustedTokenIssuer/ssoins-7223b02a5d9f7c8e/tti-11111111-2222-3333-4444-555555555555";

const h = vi.hoisted(() => {
  const names = [
    "useSSOInstances",
    "usePermissionSets",
    "usePermissionSetDetail",
    "useCreatePermissionSet",
    "useUpdatePermissionSet",
    "useDeletePermissionSet",
    "useManagedPolicies",
    "useAttachManagedPolicy",
    "useDetachManagedPolicy",
    "useCustomerManagedPolicyReferences",
    "useAttachCustomerManagedPolicy",
    "useDetachCustomerManagedPolicy",
    "useInlinePolicy",
    "usePutInlinePolicy",
    "useDeleteInlinePolicy",
    "usePermissionsBoundary",
    "usePutPermissionsBoundary",
    "useDeletePermissionsBoundary",
    "useSsoTags",
    "useAddSsoTags",
    "useRemoveSsoTags",
    "useAccountAssignments",
    "useCreateAccountAssignment",
    "useDeleteAccountAssignment",
    "useAssignmentCreationStatuses",
    "useAssignmentDeletionStatuses",
    "usePermissionSetProvisioningStatuses",
    "useProvisionPermissionSet",
    "useAccountsForProvisionedPermissionSet",
    "useTrustedTokenIssuers",
    "useTrustedTokenIssuerDetail",
    "useCreateTrustedTokenIssuer",
    "useUpdateTrustedTokenIssuer",
    "useDeleteTrustedTokenIssuer",
    "useAccessControlAttributeConfiguration",
    "useCreateAccessControlConfig",
    "useUpdateAccessControlConfig",
    "useDeleteAccessControlConfig",
    "useSsoRegions",
    "useAddSsoRegion",
    "useRemoveSsoRegion",
  ];
  const hooks: Record<string, any> = {};
  for (const name of names) hooks[name] = vi.fn();
  return hooks;
});

vi.mock("../../hooks/useSSOAdmin", () => h);

const mut = vi.hoisted(() => {
  const m: Record<string, any> = {};
  for (const key of [
    "createPs",
    "updatePs",
    "deletePs",
    "attachPolicy",
    "detachPolicy",
    "attachCust",
    "detachCust",
    "putInline",
    "delInline",
    "putBoundary",
    "delBoundary",
    "addTags",
    "removeTags",
    "createAssignment",
    "deleteAssignment",
    "provision",
    "createTTI",
    "updateTTI",
    "deleteTTI",
    "createCfg",
    "updateCfg",
    "deleteCfg",
    "addRegion",
    "removeRegion",
  ]) {
    m[key] = vi.fn().mockResolvedValue({});
  }
  return m;
});

function query(data: any, overrides: Record<string, unknown> = {}) {
  return {
    data,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  };
}

function mutation(fn: any, overrides: Record<string, unknown> = {}) {
  return { mutateAsync: fn, isPending: false, ...overrides };
}

const INSTANCE_ROW = {
  InstanceArn: INSTANCE,
  IdentityStoreId: "d-9067f2a3c1",
  Name: "floci-identity-center",
  OwnerAccountId: "123456789012",
  Status: "ACTIVE",
};

const PS1 = {
  PermissionSetArn: PS_ARN,
  Name: "Admins",
  Description: "Admin access",
  SessionDuration: "PT1H",
};
const PS2 = { PermissionSetArn: PS_ARN2 };
const POLICY = {
  Arn: "arn:aws:iam::aws:policy/AdministratorAccess",
  Name: "AdministratorAccess",
};
const POLICY_NO_NAME = { Arn: "arn:aws:iam::aws:policy/NoNamePolicy" };
const ASSIGNMENT = {
  AccountId: "111122223333",
  PermissionSetArn: PS_ARN,
  PrincipalId: "user-uuid",
  PrincipalType: "USER",
};
const STATUS_ROW = { RequestId: "req-1", Status: "SUCCEEDED", CreatedDate: "2026-11-05T00:00:00Z" };
const STATUS_ROW_NO_DATE = { RequestId: "req-2", Status: "FAILED" };
const TTI_ROW = { Name: "okta", TrustedTokenIssuerArn: TTI_ARN, TrustedTokenIssuerType: "OIDC_JWT" };
const TTI_DETAIL = {
  Name: "okta",
  TrustedTokenIssuerArn: TTI_ARN,
  TrustedTokenIssuerType: "OIDC_JWT",
  TrustedTokenIssuerConfiguration: {
    OidcJwtConfiguration: {
      IssuerUrl: "https://okta.example.com",
      ClaimAttributePath: "sub",
      IdentityStoreAttributePath: "userName",
      JwksRetrievalOption: "OPEN_ID_DISCOVERY",
    },
  },
};
const ACA_CFG = {
  AccessControlAttributes: [{ Key: "costCenter", Value: { Source: ["$.costCenter"] } }],
};

function setDefaults() {
  h.useSSOInstances.mockReturnValue(query({ instances: [INSTANCE_ROW], total: 1 }));
  h.usePermissionSets.mockReturnValue(query({ permissionSets: [PS1, PS2], total: 2 }));
  h.usePermissionSetDetail.mockReturnValue(
    query({ permissionSet: { PermissionSetArn: PS_ARN, Name: "Admins", Description: "Admin access", SessionDuration: "PT1H" } })
  );
  h.useCreatePermissionSet.mockReturnValue(mutation(mut.createPs));
  h.useUpdatePermissionSet.mockReturnValue(mutation(mut.updatePs));
  h.useDeletePermissionSet.mockReturnValue(mutation(mut.deletePs, { isPending: false }));
  h.useManagedPolicies.mockReturnValue(
    query({ policies: [POLICY, POLICY_NO_NAME], total: 2 })
  );
  h.useAttachManagedPolicy.mockReturnValue(mutation(mut.attachPolicy));
  h.useDetachManagedPolicy.mockReturnValue(mutation(mut.detachPolicy));
  h.useCustomerManagedPolicyReferences.mockReturnValue(
    query({
      references: [
        { Name: "cust-policy", Path: "/team/" },
        { Name: "cust-nopath" },
      ],
      total: 2,
    })
  );
  h.useAttachCustomerManagedPolicy.mockReturnValue(mutation(mut.attachCust));
  h.useDetachCustomerManagedPolicy.mockReturnValue(mutation(mut.detachCust));
  h.useInlinePolicy.mockReturnValue(query({ inlinePolicy: '{"Version":"2012-10-17"}' }));
  h.usePutInlinePolicy.mockReturnValue(mutation(mut.putInline));
  h.useDeleteInlinePolicy.mockReturnValue(mutation(mut.delInline));
  h.usePermissionsBoundary.mockReturnValue(query({ permissionsBoundary: null }));
  h.usePutPermissionsBoundary.mockReturnValue(mutation(mut.putBoundary));
  h.useDeletePermissionsBoundary.mockReturnValue(mutation(mut.delBoundary));
  h.useSsoTags.mockReturnValue(query({ tags: [{ key: "env", value: "dev" }], total: 1 }));
  h.useAddSsoTags.mockReturnValue(mutation(mut.addTags));
  h.useRemoveSsoTags.mockReturnValue(mutation(mut.removeTags));
  h.useAccountAssignments.mockReturnValue(query({ assignments: [ASSIGNMENT], total: 1 }));
  h.useCreateAccountAssignment.mockReturnValue(mutation(mut.createAssignment));
  h.useDeleteAccountAssignment.mockReturnValue(mutation(mut.deleteAssignment));
  h.useAssignmentCreationStatuses.mockReturnValue(
    query({ statuses: [STATUS_ROW, STATUS_ROW_NO_DATE], total: 2 })
  );
  h.useAssignmentDeletionStatuses.mockReturnValue(
    query({ statuses: [STATUS_ROW_NO_DATE], total: 1 })
  );
  h.usePermissionSetProvisioningStatuses.mockReturnValue(
    query({ statuses: [STATUS_ROW, STATUS_ROW_NO_DATE], total: 2 })
  );
  h.useProvisionPermissionSet.mockReturnValue(mutation(mut.provision));
  h.useAccountsForProvisionedPermissionSet.mockReturnValue(
    query({ accountIds: ["111122223333"], total: 1 })
  );
  h.useTrustedTokenIssuers.mockReturnValue(query({ trustedTokenIssuers: [TTI_ROW], total: 1 }));
  h.useTrustedTokenIssuerDetail.mockReturnValue(query({ trustedTokenIssuer: TTI_DETAIL }));
  h.useCreateTrustedTokenIssuer.mockReturnValue(mutation(mut.createTTI));
  h.useUpdateTrustedTokenIssuer.mockReturnValue(mutation(mut.updateTTI));
  h.useDeleteTrustedTokenIssuer.mockReturnValue(mutation(mut.deleteTTI));
  h.useAccessControlAttributeConfiguration.mockReturnValue(query({ configuration: null }));
  h.useCreateAccessControlConfig.mockReturnValue(mutation(mut.createCfg));
  h.useUpdateAccessControlConfig.mockReturnValue(mutation(mut.updateCfg));
  h.useDeleteAccessControlConfig.mockReturnValue(mutation(mut.deleteCfg));
  h.useSsoRegions.mockReturnValue(
    query({
      regions: [
        { RegionName: "us-east-1", Status: "ACTIVE", IsPrimaryRegion: true, AddedDate: "2026-01-01" },
        { RegionName: "eu-west-1", Status: "ACTIVE", IsPrimaryRegion: false },
      ],
      total: 2,
    })
  );
  h.useAddSsoRegion.mockReturnValue(mutation(mut.addRegion));
  h.useRemoveSsoRegion.mockReturnValue(mutation(mut.removeRegion));
}

import { SSOAdminDashboard } from "./SSOAdminDashboard";

async function confirmDelete(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Delete" }));
}

beforeEach(() => {
  for (const key of Object.keys(mut)) mut[key].mockClear();
  setDefaults();
});

function setup(overrides: Record<string, any> = {}) {
  for (const [key, value] of Object.entries(overrides)) {
    (h as any)[key].mockReturnValue(value);
  }
  render(<SSOAdminDashboard />, { wrapper: createWrapper() });
}

/** Clicks the first Alert dismiss (X) button — used to dismiss the status alert. */
function clickAlertDismiss() {
  const buttons = Array.from(
    document.querySelectorAll('[class*="awsui_dismiss-button"]')
  ) as HTMLElement[];
  fireEvent.click(buttons[0] as HTMLElement);
}

/** Clicks the open modal's dismiss (X) control — only the open modal renders one. */
function clickModalDismiss() {
  const control = document.querySelector(
    '[class*="awsui_dismiss-control"]'
  ) as HTMLElement | null;
  fireEvent.click(control as HTMLElement);
}

/**
 * Returns the Cancel button inside the modal with the given header text
 * (modal portals render out of DOM order, so scope by header).
 */
function cancelInModal(headerText: string) {
  const heading = screen.getByRole("heading", { name: headerText }) as HTMLElement;
  let root: HTMLElement | null = heading;
  let cancel: HTMLElement | undefined;
  while (root && !cancel) {
    cancel = Array.from(root.querySelectorAll("button")).find(
      (b) => b.textContent === "Cancel"
    );
    if (!cancel) root = root.parentElement;
  }
  return cancel as HTMLElement;
}

async function gotoTab(user: ReturnType<typeof userEvent.setup>, name: RegExp) {
  await user.click(screen.getByRole("tab", { name }));
}

// ── Shell / instances ────────────────────────────────────

describe("SSOAdminDashboard — shell", () => {
  it("renders the header and instance rows, auto-selecting the first instance", async () => {
    setup();
    expect(screen.getByText("IAM Identity Center (SSO Admin)")).toBeTruthy();
    expect(screen.getByText("floci-identity-center")).toBeTruthy();
    await waitFor(() =>
      expect(screen.getByRole("tab", { name: /Permission Sets/ })).toBeTruthy()
    );
  });

  it("shows loading state while instances load", () => {
    setup({ useSSOInstances: query(undefined, { isLoading: true }) });
    expect(screen.getByText("Loading instances...")).toBeTruthy();
  });

  it("shows dashes for missing optional instance fields and empty PS list arms", () => {
    setup({
      useSSOInstances: query({
        instances: [
          { InstanceArn: "arn:aws:sso:::instance/x", IdentityStoreId: "d-2" },
          { InstanceArn: "arn:aws:sso:::instance/y" },
        ],
        total: 2,
      }),
    });
    expect(screen.getByText("arn:aws:sso:::instance/x")).toBeTruthy();
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(4);
  });

  it("filters instances by name", async () => {
    const user = userEvent.setup();
    setup({
      useSSOInstances: query({
        instances: [
          INSTANCE_ROW,
          { ...INSTANCE_ROW, Name: "other", InstanceArn: "arn:aws:sso:::instance/y" },
          { InstanceArn: "arn:aws:sso:::instance/z" },
        ],
        total: 3,
      }),
    });
    await waitFor(() => expect(screen.getByText("floci-identity-center")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("Find instances by name or ARN"), "other");
    await waitFor(() => expect(screen.queryByText("floci-identity-center")).toBeNull());
  });

  it("shows the no-instance alert when instances are missing", () => {
    setup({ useSSOInstances: query(undefined) });
    expect(screen.getByText(/No Identity Center instance found in Floci/i)).toBeTruthy();
    expect(screen.getByText("No Identity Center instances")).toBeTruthy();
  });
});

// ── Permission Sets ──────────────────────────────────────

describe("SSOAdminDashboard — permission sets", () => {
  it("renders permission set rows including unnamed sets", async () => {
    setup();
    expect(screen.getByText("Admins")).toBeTruthy();
    expect(screen.getByText(PS_ARN)).toBeTruthy();
    expect(screen.getByRole("button", { name: `Delete ${PS_ARN2}` })).toBeTruthy();
  });

  it("shows the empty message when the list has no items", () => {
    setup({ usePermissionSets: query({ permissionSets: [], total: 0 }) });
    expect(screen.getByText("No permission sets")).toBeTruthy();
  });

  it("shows the empty message when list data is undefined", () => {
    setup({ usePermissionSets: query(undefined) });
    expect(screen.getByText("No permission sets")).toBeTruthy();
  });

  it("opens the create modal, creates a permission set and reports success", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole("button", { name: "Create permission set" }));
    await user.type(screen.getByPlaceholderText("Permission set name"), "DevTeam");
    await user.type(screen.getByPlaceholderText("Description"), "Devs");
    await user.clear(screen.getByPlaceholderText("PT1H"));
    await user.type(screen.getByPlaceholderText("PT1H"), "PT2H");
    await user.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() =>
      expect(mut.createPs).toHaveBeenCalledWith({
        instanceArn: INSTANCE,
        name: "DevTeam",
        description: "Devs",
        sessionDuration: "PT2H",
      })
    );
    expect(screen.getByText("Permission set DevTeam created.")).toBeTruthy();
    clickAlertDismiss();
    await waitFor(() =>
      expect(screen.queryByText("Permission set DevTeam created.")).toBeNull()
    );
  });

  it("surfaces create errors with their message", async () => {
    mut.createPs.mockRejectedValueOnce(new Error("Permission set already exists"));
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole("button", { name: "Create permission set" }));
    await user.type(screen.getByPlaceholderText("Permission set name"), "DevTeam");
    await user.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() =>
      expect(screen.getByText("Permission set already exists")).toBeTruthy()
    );
  });

  it("falls back to a generic message for message-less errors", async () => {
    mut.createPs.mockRejectedValueOnce({});
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole("button", { name: "Create permission set" }));
    await user.type(screen.getByPlaceholderText("Permission set name"), "DevTeam");
    await user.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() =>
      expect(screen.getByText("Failed to create permission set")).toBeTruthy()
    );
  });

  it("deletes a permission set after confirmation", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole("button", { name: "Delete Admins" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() =>
      expect(mut.deletePs).toHaveBeenCalledWith({ instanceArn: INSTANCE, permissionSetArn: PS_ARN })
    );
  });

  it("opens the manage panel with policy, tag and provisioning sections, then closes it", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getAllByRole("button", { name: "Manage" })[0]);
    expect(screen.getByText(/Manage Admins/)).toBeTruthy();
    expect(screen.getByText("Attached managed policies")).toBeTruthy();
    expect(screen.getByText("Customer managed policy references")).toBeTruthy();
    expect(screen.getByText("Permissions boundary")).toBeTruthy();
    expect(screen.getByText("No permissions boundary configured")).toBeTruthy();
    expect(screen.getByText("Provisioning")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Delete arn:aws:iam::aws:policy/NoNamePolicy" })
    ).toBeTruthy();
    expect(screen.getByText("/")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByText(/Manage Admins/)).toBeNull();
  });

  it("saves overview changes", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getAllByRole("button", { name: "Manage" })[0]);
    const descriptionInput = screen.getAllByPlaceholderText("Description")[0];
    await user.clear(descriptionInput);
    await user.type(descriptionInput, "New description");
    await user.click(screen.getByRole("button", { name: "Save details" }));
    await waitFor(() =>
      expect(mut.updatePs).toHaveBeenCalledWith({
        instanceArn: INSTANCE,
        permissionSetArn: PS_ARN,
        description: "New description",
        sessionDuration: "PT1H",
      })
    );
  });

  it("attaches a managed policy", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getAllByRole("button", { name: "Manage" })[0]);
    await user.type(
      screen.getByPlaceholderText("Managed policy ARN"),
      "arn:aws:iam::aws:policy/ReadOnlyAccess"
    );
    await user.click(screen.getByRole("button", { name: "Attach policy" }));
    await waitFor(() =>
      expect(mut.attachPolicy).toHaveBeenCalledWith({
        instanceArn: INSTANCE,
        permissionSetArn: PS_ARN,
        managedPolicyArn: "arn:aws:iam::aws:policy/ReadOnlyAccess",
      })
    );
  });

  it("detaches a managed policy after confirmation", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getAllByRole("button", { name: "Manage" })[0]);
    await user.click(screen.getByRole("button", { name: "Delete AdministratorAccess" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() =>
      expect(mut.detachPolicy).toHaveBeenCalledWith({
        instanceArn: INSTANCE,
        permissionSetArn: PS_ARN,
        managedPolicyArn: POLICY.Arn,
      })
    );
  });

  it("attaches a customer managed policy reference", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getAllByRole("button", { name: "Manage" })[0]);
    await user.type(screen.getByPlaceholderText("Reference name"), "cust-2");
    await user.type(screen.getByPlaceholderText("Reference path"), "/other/");
    await user.click(screen.getByRole("button", { name: "Attach reference" }));
    await waitFor(() =>
      expect(mut.attachCust).toHaveBeenCalledWith({
        instanceArn: INSTANCE,
        permissionSetArn: PS_ARN,
        name: "cust-2",
        path: "/other/",
      })
    );
  });

  it("detaches a customer managed policy reference after confirmation", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getAllByRole("button", { name: "Manage" })[0]);
    await user.click(screen.getByRole("button", { name: "Delete cust-policy" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() =>
      expect(mut.detachCust).toHaveBeenCalledWith({
        instanceArn: INSTANCE,
        permissionSetArn: PS_ARN,
        name: "cust-policy",
        path: "/team/",
      })
    );
  });

  it("pre-fills and saves the inline policy", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getAllByRole("button", { name: "Manage" })[0]);
    const textarea = screen.getByPlaceholderText("Inline policy JSON");
    expect((textarea as HTMLTextAreaElement).value).toContain("2012-10-17");
    fireEvent.change(textarea, { target: { value: '{"Effect":"Allow"}' } });
    await user.click(screen.getByRole("button", { name: "Save policy" }));
    await waitFor(() =>
      expect(mut.putInline).toHaveBeenCalledWith({
        instanceArn: INSTANCE,
        permissionSetArn: PS_ARN,
        inlinePolicy: '{"Effect":"Allow"}',
      })
    );
  });

  it("deletes the inline policy", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getAllByRole("button", { name: "Manage" })[0]);
    await user.click(screen.getByRole("button", { name: "Delete policy" }));
    await waitFor(() =>
      expect(mut.delInline).toHaveBeenCalledWith({ instanceArn: INSTANCE, permissionSetArn: PS_ARN })
    );
  });

  it("sets a managed-policy boundary", async () => {
    const user = userEvent.setup();
    setup({
      usePermissionsBoundary: query({
        permissionsBoundary: { ManagedPolicyArn: "arn:aws:iam::aws:policy/ReadOnlyAccess" },
      }),
    });
    await user.click(screen.getAllByRole("button", { name: "Manage" })[0]);
    expect(screen.getByText("arn:aws:iam::aws:policy/ReadOnlyAccess")).toBeTruthy();
    await user.type(
      screen.getByPlaceholderText("Boundary managed policy ARN"),
      "arn:aws:iam::aws:policy/PowerUserAccess"
    );
    await user.click(screen.getByRole("button", { name: "Set boundary" }));
    await waitFor(() =>
      expect(mut.putBoundary).toHaveBeenCalledWith({
        instanceArn: INSTANCE,
        permissionSetArn: PS_ARN,
        managedPolicyArn: "arn:aws:iam::aws:policy/PowerUserAccess",
        customerName: undefined,
        customerPath: undefined,
      })
    );
  });

  it("sets a customer-reference boundary when no managed ARN is given", async () => {
    const user = userEvent.setup();
    setup({
      usePermissionsBoundary: query({
        permissionsBoundary: {
          CustomerManagedPolicyReference: { Name: "cust-b", Path: "/team/" },
        },
      }),
    });
    await user.click(screen.getAllByRole("button", { name: "Manage" })[0]);
    expect(screen.getByText(/cust-b/)).toBeTruthy();
    await user.type(screen.getByPlaceholderText("Boundary reference name"), "cust-2");
    await user.click(screen.getByRole("button", { name: "Set boundary" }));
    await waitFor(() =>
      expect(mut.putBoundary).toHaveBeenCalledWith({
        instanceArn: INSTANCE,
        permissionSetArn: PS_ARN,
        managedPolicyArn: undefined,
        customerName: "cust-2",
        customerPath: undefined,
      })
    );
  });

  it("removes the permissions boundary", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getAllByRole("button", { name: "Manage" })[0]);
    await user.click(screen.getByRole("button", { name: "Remove boundary" }));
    await waitFor(() =>
      expect(mut.delBoundary).toHaveBeenCalledWith({ instanceArn: INSTANCE, permissionSetArn: PS_ARN })
    );
  });

  it("adds and removes tags", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getAllByRole("button", { name: "Manage" })[0]);
    await user.type(screen.getByPlaceholderText("Tag key"), "team");
    await user.type(screen.getByPlaceholderText("Tag value"), "platform");
    await user.click(screen.getByRole("button", { name: "Add tag" }));
    await waitFor(() =>
      expect(mut.addTags).toHaveBeenCalledWith({
        resourceArn: PS_ARN,
        tags: { team: "platform" },
      })
    );
    await user.click(screen.getByRole("button", { name: "Delete env" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() =>
      expect(mut.removeTags).toHaveBeenCalledWith({ resourceArn: PS_ARN, tagKeys: ["env"] })
    );
  });

  it("provisions the permission set to one account", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getAllByRole("button", { name: "Manage" })[0]);
    await user.type(screen.getByPlaceholderText("Target account ID"), "111122223333");
    await user.click(screen.getByRole("button", { name: "Provision" }));
    await waitFor(() =>
      expect(mut.provision).toHaveBeenCalledWith({
        instanceArn: INSTANCE,
        permissionSetArn: PS_ARN,
        targetType: "AWS_ACCOUNT",
        targetId: "111122223333",
      })
    );
    expect(screen.getByText("Provisioned accounts: 111122223333")).toBeTruthy();
    expect(screen.getByText("req-1")).toBeTruthy();
  });

  it("provisions to all provisioned accounts", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getAllByRole("button", { name: "Manage" })[0]);
    await user.click(screen.getByRole("button", { name: "Provision all accounts" }));
    await waitFor(() =>
      expect(mut.provision).toHaveBeenCalledWith({
        instanceArn: INSTANCE,
        permissionSetArn: PS_ARN,
        targetType: "ALL_PROVISIONED_ACCOUNTS",
      })
    );
  });

  it("closes the create modal with Cancel and dismiss", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole("button", { name: "Create permission set" }));
    expect(screen.getByPlaceholderText("Permission set name")).toBeTruthy();
    await user.click(cancelInModal("Create permission set"));
    expect(mut.createPs).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Create permission set" }));
    clickModalDismiss();
    expect(mut.createPs).not.toHaveBeenCalled();
  });

  it("closes the manage panel when deleting the managed set", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getAllByRole("button", { name: "Manage" })[0]);
    expect(screen.getByText(/Manage Admins/)).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Delete Admins" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() =>
      expect(screen.queryByText(/Manage Admins/)).toBeNull()
    );
  });

  it("surfaces permission set delete errors", async () => {
    mut.deletePs.mockRejectedValueOnce(new Error("permission set in use"));
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole("button", { name: "Delete Admins" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(screen.getByText("permission set in use")).toBeTruthy());
  });

  it("surfaces attach policy errors", async () => {
    mut.attachPolicy.mockRejectedValueOnce(new Error("policy quota exceeded"));
    const user = userEvent.setup();
    setup();
    await user.click(screen.getAllByRole("button", { name: "Manage" })[0]);
    await user.type(
      screen.getByPlaceholderText("Managed policy ARN"),
      "arn:aws:iam::aws:policy/ReadOnlyAccess"
    );
    await user.click(screen.getByRole("button", { name: "Attach policy" }));
    await waitFor(() => expect(screen.getByText("policy quota exceeded")).toBeTruthy());
  });

  it("saves overview with typed description and session", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getAllByRole("button", { name: "Manage" })[0]);
    const descriptionInput = screen.getAllByPlaceholderText("Description")[0];
    await user.clear(descriptionInput);
    await user.type(descriptionInput, "New description");
    const sessionInput = screen.getAllByPlaceholderText("PT1H")[0];
    await user.clear(sessionInput);
    await user.type(sessionInput, "PT4H");
    await user.click(screen.getByRole("button", { name: "Save details" }));
    await waitFor(() =>
      expect(mut.updatePs).toHaveBeenCalledWith({
        instanceArn: INSTANCE,
        permissionSetArn: PS_ARN,
        description: "New description",
        sessionDuration: "PT4H",
      })
    );
  });

  it("saves overview with cleared fields as undefined", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getAllByRole("button", { name: "Manage" })[0]);
    await user.clear(screen.getAllByPlaceholderText("Description")[0]);
    await user.clear(screen.getAllByPlaceholderText("PT1H")[0]);
    await user.click(screen.getByRole("button", { name: "Save details" }));
    await waitFor(() =>
      expect(mut.updatePs).toHaveBeenCalledWith({
        instanceArn: INSTANCE,
        permissionSetArn: PS_ARN,
        description: undefined,
        sessionDuration: undefined,
      })
    );
  });

  it("shows the ARN header for a detail without a name and empty prefill", async () => {
    const user = userEvent.setup();
    setup({
      usePermissionSetDetail: query({ permissionSet: { PermissionSetArn: PS_ARN2 } }),
    });
    await user.click(screen.getAllByRole("button", { name: "Manage" })[1]);
    expect(
      screen.getByRole("heading", {
        name: new RegExp(`Manage ${PS_ARN2.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`),
      })
    ).toBeTruthy();
    await waitFor(() => {
      expect((screen.getAllByPlaceholderText("Description")[0] as HTMLInputElement).value).toBe("");
      expect((screen.getAllByPlaceholderText("PT1H")[0] as HTMLInputElement).value).toBe("");
    });
  });

  it("shows empty policy sections when their data is undefined", async () => {
    const user = userEvent.setup();
    setup({
      useManagedPolicies: query(undefined),
      useCustomerManagedPolicyReferences: query(undefined),
      useInlinePolicy: query(undefined),
    });
    await user.click(screen.getAllByRole("button", { name: "Manage" })[0]);
    expect(screen.getByText("No managed policies attached")).toBeTruthy();
    expect(screen.getByText("No customer managed policy references")).toBeTruthy();
    expect((screen.getByPlaceholderText("Inline policy JSON") as HTMLTextAreaElement).value).toBe("");
  });

  it("attaches a customer reference without a path", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getAllByRole("button", { name: "Manage" })[0]);
    await user.type(screen.getByPlaceholderText("Reference name"), "cust-3");
    await user.click(screen.getByRole("button", { name: "Attach reference" }));
    await waitFor(() =>
      expect(mut.attachCust).toHaveBeenCalledWith({
        instanceArn: INSTANCE,
        permissionSetArn: PS_ARN,
        name: "cust-3",
        path: undefined,
      })
    );
  });

  it("shows a customer boundary with the default path and sets an empty boundary", async () => {
    const user = userEvent.setup();
    setup({
      usePermissionsBoundary: query({
        permissionsBoundary: { CustomerManagedPolicyReference: { Name: "cust-b" } },
      }),
    });
    await user.click(screen.getAllByRole("button", { name: "Manage" })[0]);
    expect(screen.getByText("cust-b /")).toBeTruthy();
    await user.type(screen.getByPlaceholderText("Boundary reference path"), "/other/");
    await user.click(screen.getByRole("button", { name: "Set boundary" }));
    await waitFor(() =>
      expect(mut.putBoundary).toHaveBeenCalledWith({
        instanceArn: INSTANCE,
        permissionSetArn: PS_ARN,
        managedPolicyArn: undefined,
        customerName: undefined,
        customerPath: "/other/",
      })
    );
  });

  it("shows empty tags and provisioning data states", async () => {
    const user = userEvent.setup();
    setup({
      useSsoTags: query(undefined),
      useAccountsForProvisionedPermissionSet: query(undefined),
      usePermissionSetProvisioningStatuses: query(undefined),
    });
    await user.click(screen.getAllByRole("button", { name: "Manage" })[0]);
    expect(screen.getByText("No tags")).toBeTruthy();
    expect(screen.getByText("Provisioned accounts: none")).toBeTruthy();
    expect(screen.getByText("No provisioning operations")).toBeTruthy();
  });

  it("creates a permission set without a session duration", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole("button", { name: "Create permission set" }));
    await user.type(screen.getByPlaceholderText("Permission set name"), "NoSession");
    await user.clear(screen.getByPlaceholderText("PT1H"));
    await user.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() =>
      expect(mut.createPs).toHaveBeenCalledWith({
        instanceArn: INSTANCE,
        name: "NoSession",
        description: undefined,
        sessionDuration: undefined,
      })
    );
  });
});

// ── Account Assignments ──────────────────────────────────

describe("SSOAdminDashboard — account assignments", () => {
  it("selects a permission set and shows the Selected indicator", async () => {
    const user = userEvent.setup();
    setup();
    await gotoTab(user, /Account Assignments/);
    await user.type(screen.getByPlaceholderText("Account ID (12 digits)"), "111122223333");
    const selectButtons = screen.getAllByRole("button", { name: "Select" });
    expect(selectButtons.length).toBe(2);
    await user.click(selectButtons[0]);
    expect(screen.getByText("Selected")).toBeTruthy();
    expect(screen.getByText("user-uuid")).toBeTruthy();
  });

  it("creates an assignment for a GROUP principal", async () => {
    const user = userEvent.setup();
    setup();
    await gotoTab(user, /Account Assignments/);
    await user.type(screen.getByPlaceholderText("Account ID (12 digits)"), "111122223333");
    await user.click(screen.getAllByRole("button", { name: "Select" })[0]);
    await user.click(screen.getByRole("button", { name: "GROUP" }));
    await user.type(
      screen.getByPlaceholderText("Principal ID (user or group UUID)"),
      "group-uuid"
    );
    await user.click(screen.getByRole("button", { name: "Create assignment" }));
    await waitFor(() =>
      expect(mut.createAssignment).toHaveBeenCalledWith({
        instanceArn: INSTANCE,
        targetId: "111122223333",
        permissionSetArn: PS_ARN,
        principalId: "group-uuid",
        principalType: "GROUP",
      })
    );
    expect(screen.getByText("Account assignment created.")).toBeTruthy();
  });

  it("deletes an assignment after confirmation", async () => {
    const user = userEvent.setup();
    setup();
    await gotoTab(user, /Account Assignments/);
    await user.type(screen.getByPlaceholderText("Account ID (12 digits)"), "111122223333");
    await user.click(screen.getAllByRole("button", { name: "Select" })[0]);
    await user.click(screen.getByRole("button", { name: "Delete user-uuid" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() =>
      expect(mut.deleteAssignment).toHaveBeenCalledWith({
        instanceArn: INSTANCE,
        targetId: "111122223333",
        permissionSetArn: PS_ARN,
        principalId: "user-uuid",
        principalType: "USER",
      })
    );
  });

  it("renders creation and deletion status tables", async () => {
    const user = userEvent.setup();
    setup();
    await gotoTab(user, /Account Assignments/);
    expect(screen.getByText("Assignment creation statuses")).toBeTruthy();
    expect(screen.getByText("Assignment deletion statuses")).toBeTruthy();
    expect(screen.getAllByText("req-1").length).toBeGreaterThanOrEqual(1);
  });

  it("shows empty statuses when data is undefined", async () => {
    const user = userEvent.setup();
    setup({
      useAssignmentCreationStatuses: query(undefined),
      useAssignmentDeletionStatuses: query(undefined),
    });
    await gotoTab(user, /Account Assignments/);
    expect(screen.getByText("No assignment creation operations")).toBeTruthy();
    expect(screen.getByText("No assignment deletion operations")).toBeTruthy();
  });

  it("shows empty assignments when data is undefined", async () => {
    const user = userEvent.setup();
    setup({ useAccountAssignments: query(undefined) });
    await gotoTab(user, /Account Assignments/);
    await user.type(screen.getByPlaceholderText("Account ID (12 digits)"), "111122223333");
    await user.click(screen.getAllByRole("button", { name: "Select" })[0]);
    expect(screen.getByText("No account assignments")).toBeTruthy();
  });

  it("shows an empty permission set list when the list data is undefined", async () => {
    const user = userEvent.setup();
    setup({ usePermissionSets: query(undefined) });
    await gotoTab(user, /Account Assignments/);
    expect(screen.getAllByText("No permission sets").length).toBeGreaterThanOrEqual(1);
  });

  it("surfaces issuer update errors", async () => {
    mut.updateTTI.mockRejectedValueOnce(new Error("issuer update failed"));
    const user = userEvent.setup();
    setup();
    await gotoTab(user, /Trusted Token Issuers/);
    await user.click(screen.getByRole("button", { name: "Edit" }));
    await waitFor(() =>
      expect(
        (screen.getAllByPlaceholderText("Issuer name")[0] as HTMLInputElement).value
      ).toBe("okta")
    );
    await user.click(screen.getByRole("button", { name: "Save issuer" }));
    await waitFor(() => expect(screen.getByText("issuer update failed")).toBeTruthy());
  });

  it("surfaces assignment create errors", async () => {
    mut.createAssignment.mockRejectedValueOnce(new Error("assignment exists"));
    const user = userEvent.setup();
    setup();
    await gotoTab(user, /Account Assignments/);
    await user.type(screen.getByPlaceholderText("Account ID (12 digits)"), "111122223333");
    await user.click(screen.getAllByRole("button", { name: "Select" })[0]);
    await user.type(
      screen.getByPlaceholderText("Principal ID (user or group UUID)"),
      "user-2"
    );
    await user.click(screen.getByRole("button", { name: "Create assignment" }));
    await waitFor(() => expect(screen.getByText("assignment exists")).toBeTruthy());
  });

  it("switches back to USER principal type and creates", async () => {
    const user = userEvent.setup();
    setup();
    await gotoTab(user, /Account Assignments/);
    await user.type(screen.getByPlaceholderText("Account ID (12 digits)"), "111122223333");
    await user.click(screen.getAllByRole("button", { name: "Select" })[0]);
    await user.click(screen.getByRole("button", { name: "GROUP" }));
    await user.click(screen.getByRole("button", { name: "USER" }));
    await user.type(
      screen.getByPlaceholderText("Principal ID (user or group UUID)"),
      "user-3"
    );
    await user.click(screen.getByRole("button", { name: "Create assignment" }));
    await waitFor(() =>
      expect(mut.createAssignment).toHaveBeenCalledWith(
        expect.objectContaining({ principalType: "USER" })
      )
    );
  });

  it("surfaces assignment delete errors", async () => {
    mut.deleteAssignment.mockRejectedValueOnce(new Error("delete failed"));
    const user = userEvent.setup();
    setup();
    await gotoTab(user, /Account Assignments/);
    await user.type(screen.getByPlaceholderText("Account ID (12 digits)"), "111122223333");
    await user.click(screen.getAllByRole("button", { name: "Select" })[0]);
    await user.click(screen.getByRole("button", { name: "Delete user-uuid" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(screen.getByText("delete failed")).toBeTruthy());
  });
});

// ── Trusted Token Issuers ────────────────────────────────

describe("SSOAdminDashboard — trusted token issuers", () => {
  it("renders issuer rows and the empty message", async () => {
    const user = userEvent.setup();
    setup();
    await gotoTab(user, /Trusted Token Issuers/);
    expect(screen.getByText("okta")).toBeTruthy();
  });

  it("shows the empty message when no issuers", async () => {
    const user = userEvent.setup();
    setup({ useTrustedTokenIssuers: query({ trustedTokenIssuers: [], total: 0 }) });
    await gotoTab(user, /Trusted Token Issuers/);
    expect(screen.getByText("No trusted token issuers")).toBeTruthy();
  });

  it("views an issuer with its OIDC configuration", async () => {
    const user = userEvent.setup();
    setup();
    await gotoTab(user, /Trusted Token Issuers/);
    await user.click(screen.getByRole("button", { name: "View" }));
    await waitFor(() =>
      expect(screen.getByText("https://okta.example.com")).toBeTruthy()
    );
    expect(screen.getByText("sub")).toBeTruthy();
    expect(screen.getByText("userName")).toBeTruthy();
    expect(screen.getByText("OPEN_ID_DISCOVERY")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Done" }));
    clickModalDismiss();
  });

  it("creates a trusted token issuer", async () => {
    const user = userEvent.setup();
    setup();
    await gotoTab(user, /Trusted Token Issuers/);
    await user.click(screen.getByRole("button", { name: "Create trusted token issuer" }));
    const nameInputs = screen.getAllByPlaceholderText("Issuer name");
    await user.type(nameInputs[nameInputs.length - 1], "ping");
    await user.type(screen.getByPlaceholderText("Issuer URL"), "https://ping.example.com");
    const claimInputs = screen.getAllByPlaceholderText("Claim attribute path");
    await user.type(claimInputs[claimInputs.length - 1], "email");
    const storeInputs = screen.getAllByPlaceholderText("Identity store attribute path");
    await user.type(storeInputs[storeInputs.length - 1], "email");
    await user.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() =>
      expect(mut.createTTI).toHaveBeenCalledWith({
        instanceArn: INSTANCE,
        name: "ping",
        issuerUrl: "https://ping.example.com",
        claimAttributePath: "email",
        identityStoreAttributePath: "email",
      })
    );
  });

  it("edits an issuer pre-filled from describe", async () => {
    const user = userEvent.setup();
    setup();
    await gotoTab(user, /Trusted Token Issuers/);
    await user.click(screen.getByRole("button", { name: "Edit" }));
    await waitFor(() =>
      expect((screen.getAllByPlaceholderText("Issuer name")[0] as HTMLInputElement).value).toBe("okta")
    );
    await user.click(screen.getByRole("button", { name: "Save issuer" }));
    await waitFor(() =>
      expect(mut.updateTTI).toHaveBeenCalledWith({
        trustedTokenIssuerArn: TTI_ARN,
        name: "okta",
        claimAttributePath: "sub",
        identityStoreAttributePath: "userName",
      })
    );
    expect(screen.getByText("Trusted token issuer updated.")).toBeTruthy();
  });

  it("leaves edit fields empty when describe has no configuration", async () => {
    const user = userEvent.setup();
    setup({
      useTrustedTokenIssuerDetail: query({
        trustedTokenIssuer: { Name: "okta", TrustedTokenIssuerArn: TTI_ARN },
      }),
    });
    await gotoTab(user, /Trusted Token Issuers/);
    await user.click(screen.getByRole("button", { name: "Edit" }));
    await waitFor(() =>
      expect((screen.getAllByPlaceholderText("Claim attribute path")[0] as HTMLInputElement).value).toBe("")
    );
    expect(
      (screen.getAllByPlaceholderText("Identity store attribute path")[0] as HTMLInputElement).value
    ).toBe("");
  });

  it("deletes a trusted token issuer after confirmation", async () => {
    const user = userEvent.setup();
    setup();
    await gotoTab(user, /Trusted Token Issuers/);
    await user.click(screen.getByRole("button", { name: "Delete okta" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(mut.deleteTTI).toHaveBeenCalledWith(TTI_ARN));
  });

  it("views an issuer without name or configuration", async () => {
    const user = userEvent.setup();
    setup({
      useTrustedTokenIssuerDetail: query({
        trustedTokenIssuer: { TrustedTokenIssuerArn: TTI_ARN },
      }),
    });
    await gotoTab(user, /Trusted Token Issuers/);
    await user.click(screen.getByRole("button", { name: "View" }));
    await waitFor(() => expect(screen.getByText("Trusted token issuer")).toBeTruthy());
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(4);
  });

  it("shows empty issuer list when data is undefined", async () => {
    const user = userEvent.setup();
    setup({ useTrustedTokenIssuers: query(undefined) });
    await gotoTab(user, /Trusted Token Issuers/);
    expect(screen.getByText("No trusted token issuers")).toBeTruthy();
  });

  it("edits issuer fields and saves", async () => {
    const user = userEvent.setup();
    setup();
    await gotoTab(user, /Trusted Token Issuers/);
    await user.click(screen.getByRole("button", { name: "Edit" }));
    await waitFor(() =>
      expect(
        (screen.getAllByPlaceholderText("Issuer name")[0] as HTMLInputElement).value
      ).toBe("okta")
    );
    const nameInput = screen.getAllByPlaceholderText("Issuer name")[0];
    await user.clear(nameInput);
    await user.type(nameInput, "okta-renamed");
    const claimInput = screen.getAllByPlaceholderText("Claim attribute path")[0];
    await user.clear(claimInput);
    await user.type(claimInput, "preferred_username");
    const storeInput = screen.getAllByPlaceholderText("Identity store attribute path")[0];
    await user.clear(storeInput);
    await user.type(storeInput, "userName");
    await user.click(screen.getByRole("button", { name: "Save issuer" }));
    await waitFor(() =>
      expect(mut.updateTTI).toHaveBeenCalledWith({
        trustedTokenIssuerArn: TTI_ARN,
        name: "okta-renamed",
        claimAttributePath: "preferred_username",
        identityStoreAttributePath: "userName",
      })
    );
  });

  it("cancels the edit modal without saving", async () => {
    const user = userEvent.setup();
    setup({ useTrustedTokenIssuerDetail: query(undefined) });
    await gotoTab(user, /Trusted Token Issuers/);
    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByRole("button", { name: "Save issuer" })).toBeTruthy();
    await user.click(cancelInModal("Edit trusted token issuer"));
    expect(mut.updateTTI).not.toHaveBeenCalled();
    clickModalDismiss();
    expect(mut.updateTTI).not.toHaveBeenCalled();
  });

  it("saves an edit with cleared fields as undefined", async () => {
    const user = userEvent.setup();
    setup({
      useTrustedTokenIssuerDetail: query({
        trustedTokenIssuer: { TrustedTokenIssuerArn: TTI_ARN },
      }),
    });
    await gotoTab(user, /Trusted Token Issuers/);
    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("button", { name: "Save issuer" }));
    await waitFor(() =>
      expect(mut.updateTTI).toHaveBeenCalledWith({
        trustedTokenIssuerArn: TTI_ARN,
        name: undefined,
        claimAttributePath: undefined,
        identityStoreAttributePath: undefined,
      })
    );
  });

  it("cancels and dismisses the create modal without creating", async () => {
    const user = userEvent.setup();
    setup();
    await gotoTab(user, /Trusted Token Issuers/);
    await user.click(screen.getByRole("button", { name: "Create trusted token issuer" }));
    expect(screen.getByPlaceholderText("Issuer URL")).toBeTruthy();
    await user.click(cancelInModal("Create trusted token issuer"));
    expect(mut.createTTI).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Create trusted token issuer" }));
    clickModalDismiss();
    expect(mut.createTTI).not.toHaveBeenCalled();
  });

  it("surfaces trusted token issuer create and delete errors", async () => {
    mut.createTTI.mockRejectedValueOnce(new Error("issuer quota"));
    const user = userEvent.setup();
    setup();
    await gotoTab(user, /Trusted Token Issuers/);
    await user.click(screen.getByRole("button", { name: "Create trusted token issuer" }));
    const nameInputs = screen.getAllByPlaceholderText("Issuer name");
    await user.type(nameInputs[nameInputs.length - 1], "ping");
    await user.type(screen.getByPlaceholderText("Issuer URL"), "https://ping.example.com");
    const claimInputs = screen.getAllByPlaceholderText("Claim attribute path");
    await user.type(claimInputs[claimInputs.length - 1], "email");
    const storeInputs = screen.getAllByPlaceholderText("Identity store attribute path");
    await user.type(storeInputs[storeInputs.length - 1], "email");
    await user.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() => expect(screen.getByText("issuer quota")).toBeTruthy());
    mut.deleteTTI.mockRejectedValueOnce(new Error("issuer delete failed"));
    await user.click(screen.getByRole("button", { name: "Delete okta" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(screen.getByText("issuer delete failed")).toBeTruthy());
  });

  it("clears view and edit state when deleting the opened issuer", async () => {
    const user = userEvent.setup();
    setup();
    await gotoTab(user, /Trusted Token Issuers/);
    await user.click(screen.getByRole("button", { name: "View" }));
    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("button", { name: "Delete okta" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(mut.deleteTTI).toHaveBeenCalled());
  });
});

// ── Access Control Attributes ────────────────────────────

describe("SSOAdminDashboard — access control attributes", () => {
  it("shows loading state", async () => {
    const user = userEvent.setup();
    setup({
      useAccessControlAttributeConfiguration: query(undefined, { isLoading: true }),
    });
    await gotoTab(user, /Access Control Attributes/);
    expect(
      screen.getByText("Loading access control attribute configuration...")
    ).toBeTruthy();
  });

  it("shows the create form when no configuration exists (error state)", async () => {
    const user = userEvent.setup();
    setup({
      useAccessControlAttributeConfiguration: query(undefined, { isError: true }),
    });
    await gotoTab(user, /Access Control Attributes/);
    expect(screen.getByText("Configure access control attributes")).toBeTruthy();
    expect(screen.getByText(/No configuration exists for this instance yet/i)).toBeTruthy();
  });

  it("shows the create form when configuration is null", async () => {
    const user = userEvent.setup();
    setup();
    await gotoTab(user, /Access Control Attributes/);
    expect(screen.getByText(/Define attributes to enable attribute-based access control/i)).toBeTruthy();
  });

  it("renders configured attributes with update and delete actions", async () => {
    const user = userEvent.setup();
    setup({
      useAccessControlAttributeConfiguration: query({
        configuration: ACA_CFG,
        status: "ENABLED",
      }),
    });
    await gotoTab(user, /Access Control Attributes/);
    expect(screen.getByText("costCenter")).toBeTruthy();
    expect(screen.getByText("$.costCenter")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Update configuration" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Delete access control attribute configuration" })
    ).toBeTruthy();
  });

  it("updates rows, then creates the configuration", async () => {
    const user = userEvent.setup();
    setup();
    await gotoTab(user, /Access Control Attributes/);
    const createBtn = screen.getByRole("button", { name: "Create configuration" });
    expect((createBtn as HTMLButtonElement).disabled).toBe(true);
    await user.type(screen.getByPlaceholderText("Attribute key"), "dept");
    await user.type(
      screen.getByPlaceholderText("Attribute source (e.g. $.costCenter)"),
      "$.dept"
    );
    await user.click(screen.getByRole("button", { name: "Create configuration" }));
    await waitFor(() =>
      expect(mut.createCfg).toHaveBeenCalledWith({
        instanceArn: INSTANCE,
        attributes: [{ key: "dept", source: "$.dept" }],
      })
    );
    expect(screen.getByText("Access control attribute configuration created.")).toBeTruthy();
  });

  it("adds and removes attribute rows", async () => {
    const user = userEvent.setup();
    setup();
    await gotoTab(user, /Access Control Attributes/);
    await user.click(screen.getByRole("button", { name: "Add attribute" }));
    const keys = screen.getAllByPlaceholderText("Attribute key");
    expect(keys.length).toBe(2);
    await user.type(keys[0], "first");
    await user.click(screen.getAllByRole("button", { name: "Remove attribute" })[1]);
    expect(screen.getAllByPlaceholderText("Attribute key").length).toBe(1);
    expect((screen.getAllByPlaceholderText("Attribute key")[0] as HTMLInputElement).value).toBe(
      "first"
    );
  });

  it("pre-fills rows from the configuration and updates", async () => {
    const user = userEvent.setup();
    setup({
      useAccessControlAttributeConfiguration: query({
        configuration: ACA_CFG,
        status: "ENABLED",
      }),
    });
    await gotoTab(user, /Access Control Attributes/);
    await user.click(screen.getByRole("button", { name: "Update configuration" }));
    await waitFor(() =>
      expect(mut.updateCfg).toHaveBeenCalledWith({
        instanceArn: INSTANCE,
        attributes: [{ key: "costCenter", source: "$.costCenter" }],
      })
    );
    expect(screen.getByText("Access control attribute configuration updated.")).toBeTruthy();
  });

  it("pre-fills an empty source when the attribute has no sources", async () => {
    const user = userEvent.setup();
    setup({
      useAccessControlAttributeConfiguration: query({
        configuration: {
          AccessControlAttributes: [{ Key: "dept", Value: { Source: [] } }],
        },
      }),
    });
    await gotoTab(user, /Access Control Attributes/);
    await user.click(screen.getByRole("button", { name: "Update configuration" }));
    await waitFor(() =>
      expect(mut.updateCfg).toHaveBeenCalledWith({
        instanceArn: INSTANCE,
        attributes: [{ key: "dept", source: "" }],
      })
    );
  });

  it("deletes the configuration after confirmation", async () => {
    const user = userEvent.setup();
    setup({
      useAccessControlAttributeConfiguration: query({
        configuration: ACA_CFG,
        status: "ENABLED",
      }),
    });
    await gotoTab(user, /Access Control Attributes/);
    await user.click(
      screen.getByRole("button", { name: "Delete access control attribute configuration" })
    );
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(mut.deleteCfg).toHaveBeenCalledWith(INSTANCE));
  });

  it("surfaces configuration delete errors", async () => {
    mut.deleteCfg.mockRejectedValueOnce(new Error("config locked"));
    const user = userEvent.setup();
    setup({
      useAccessControlAttributeConfiguration: query({
        configuration: ACA_CFG,
        status: "ENABLED",
      }),
    });
    await gotoTab(user, /Access Control Attributes/);
    await user.click(
      screen.getByRole("button", { name: "Delete access control attribute configuration" })
    );
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(screen.getByText("config locked")).toBeTruthy());
  });

  it("shows an empty attribute table when the configuration has no attributes", async () => {
    const user = userEvent.setup();
    setup({
      useAccessControlAttributeConfiguration: query({ configuration: {} }),
    });
    await gotoTab(user, /Access Control Attributes/);
    expect(screen.getByText("No access control attributes")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Update configuration" })).toBeTruthy();
  });

  it("surfaces access control configuration save errors", async () => {
    mut.createCfg.mockRejectedValueOnce(new Error("attribute invalid"));
    const user = userEvent.setup();
    setup();
    await gotoTab(user, /Access Control Attributes/);
    await user.type(screen.getByPlaceholderText("Attribute key"), "dept");
    await user.type(
      screen.getByPlaceholderText("Attribute source (e.g. $.costCenter)"),
      "$.dept"
    );
    await user.click(screen.getByRole("button", { name: "Create configuration" }));
    await waitFor(() => expect(screen.getByText("attribute invalid")).toBeTruthy());
  });
});

// ── Regions ──────────────────────────────────────────────

describe("SSOAdminDashboard — regions", () => {
  it("renders region rows with primary flags", async () => {
    const user = userEvent.setup();
    setup();
    await gotoTab(user, /Regions/);
    expect(screen.getByText("us-east-1")).toBeTruthy();
    expect(screen.getByText("eu-west-1")).toBeTruthy();
    const yes = screen.getByText("Yes");
    expect(yes).toBeTruthy();
    expect(screen.getByText("No")).toBeTruthy();
  });

  it("shows the empty message when no regions", async () => {
    const user = userEvent.setup();
    setup({ useSsoRegions: query({ regions: [], total: 0 }) });
    await gotoTab(user, /Regions/);
    expect(screen.getByText("No regions")).toBeTruthy();
  });

  it("adds a region", async () => {
    const user = userEvent.setup();
    setup();
    await gotoTab(user, /Regions/);
    await user.type(screen.getByPlaceholderText("Region code (e.g. eu-west-1)"), "ap-south-1");
    await user.click(screen.getByRole("button", { name: "Add region" }));
    await waitFor(() =>
      expect(mut.addRegion).toHaveBeenCalledWith({ instanceArn: INSTANCE, regionName: "ap-south-1" })
    );
    expect(screen.getByText("Region ap-south-1 is being added.")).toBeTruthy();
  });

  it("removes a region after confirmation", async () => {
    const user = userEvent.setup();
    setup();
    await gotoTab(user, /Regions/);
    await user.click(screen.getByRole("button", { name: "Delete eu-west-1" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() =>
      expect(mut.removeRegion).toHaveBeenCalledWith({ instanceArn: INSTANCE, regionName: "eu-west-1" })
    );
  });

  it("shows no regions when data is undefined", async () => {
    const user = userEvent.setup();
    setup({ useSsoRegions: query(undefined) });
    await gotoTab(user, /Regions/);
    expect(screen.getByText("No regions")).toBeTruthy();
  });

  it("surfaces add and remove region errors", async () => {
    mut.addRegion.mockRejectedValueOnce(new Error("region quota"));
    const user = userEvent.setup();
    setup();
    await gotoTab(user, /Regions/);
    await user.type(screen.getByPlaceholderText("Region code (e.g. eu-west-1)"), "ap-south-1");
    await user.click(screen.getByRole("button", { name: "Add region" }));
    await waitFor(() => expect(screen.getByText("region quota")).toBeTruthy());
    mut.removeRegion.mockRejectedValueOnce(new Error("region busy"));
    await user.click(screen.getByRole("button", { name: "Delete eu-west-1" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(screen.getByText("region busy")).toBeTruthy());
  });
});
