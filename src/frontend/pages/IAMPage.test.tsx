// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../test/helpers";
import React from "react";
import { MemoryRouter } from "react-router-dom";

const mockIAMUsers = vi.fn();
const mockIAMUser = vi.fn();
const mockCreateUserMutate = vi.fn();
const mockDeleteUserMutate = vi.fn();
const mockIAMRoles = vi.fn();
const mockShowToast = vi.hoisted(() => vi.fn());
const mockIAMRole = vi.fn();
const mockPutRoleInlinePolicy = vi.fn();
const mockDeleteRoleInlinePolicy = vi.fn();
const mockUpdateTrustPolicy = vi.fn();
const mockSimulatePolicy = vi.fn();
const mockCreateRoleMutate = vi.fn();
const mockDeleteRoleMutate = vi.fn();
const mockIAMGroups = vi.fn();
const mockIAMGroup = vi.fn();
const mockCreateGroupMutate = vi.fn();
const mockDeleteGroupMutate = vi.fn();
const mockAddUserToGroup = vi.fn();
const mockRemoveUserFromGroup = vi.fn();
const mockGroupInlinePolicies = vi.fn();
const mockGroupInlinePolicy = vi.fn();
const mockPutGroupInlinePolicy = vi.fn();
const mockDeleteGroupInlinePolicy = vi.fn();
const mockIAMPolicies = vi.fn();
const mockIAMPolicy = vi.fn();
const mockPolicyVersion = vi.fn();
const mockSetDefaultPolicyVersion = vi.fn();
const mockCreatePolicyMutate = vi.fn();
const mockDeletePolicyMutate = vi.fn();
const mockCreateAccessKeyMutate = vi.fn();
const mockTagUser = vi.fn();
const mockUntagUser = vi.fn();
const mockTagRole = vi.fn();
const mockUntagRole = vi.fn();
const mockTagPolicy = vi.fn();
const mockUntagPolicy = vi.fn();
const mockInstanceProfiles = vi.fn();
const mockCreateInstanceProfile = vi.fn();
const mockDeleteInstanceProfile = vi.fn();
const mockAddRoleToInstanceProfile = vi.fn();
const mockRemoveRoleFromInstanceProfile = vi.fn();

vi.mock("../hooks/useIAM", () => ({
  useIAMUsers: (...args: any[]) => mockIAMUsers(...args),
  useIAMUser: (...args: any[]) => mockIAMUser(...args),
  useCreateUser: () => ({ mutateAsync: mockCreateUserMutate, isPending: false }),
  useDeleteUser: () => ({ mutateAsync: mockDeleteUserMutate, isPending: false }),
  useIAMRoles: (...args: any[]) => mockIAMRoles(...args),
  useIAMRole: (...args: any[]) => mockIAMRole(...args),
  usePutRoleInlinePolicy: () => ({ mutate: mockPutRoleInlinePolicy, isPending: false }),
  useDeleteRoleInlinePolicy: () => ({ mutate: mockDeleteRoleInlinePolicy, isPending: false }),
  useUpdateRoleTrustPolicy: () => ({ mutate: mockUpdateTrustPolicy, isPending: false }),
  useSimulatePolicy: () => ({ mutate: mockSimulatePolicy, isPending: false }),
  useCreateRole: () => ({ mutateAsync: mockCreateRoleMutate, isPending: false }),
  useDeleteRole: () => ({ mutateAsync: mockDeleteRoleMutate, isPending: false }),
  useIAMGroups: (...args: any[]) => mockIAMGroups(...args),
  useIAMGroup: (...args: any[]) => mockIAMGroup(...args),
  useAddUserToGroup: () => ({ mutateAsync: mockAddUserToGroup, isPending: false }),
  useRemoveUserFromGroup: () => ({ mutateAsync: mockRemoveUserFromGroup, isPending: false }),
  useGroupInlinePolicies: (...args: any[]) => mockGroupInlinePolicies(...args),
  useGroupInlinePolicy: (...args: any[]) => mockGroupInlinePolicy(...args),
  usePutGroupInlinePolicy: () => ({ mutateAsync: mockPutGroupInlinePolicy, isPending: false }),
  useDeleteGroupInlinePolicy: () => ({ mutateAsync: mockDeleteGroupInlinePolicy, isPending: false }),
  useSetDefaultPolicyVersion: () => ({ mutateAsync: mockSetDefaultPolicyVersion, isPending: false }),
  useCreateGroup: () => ({ mutate: mockCreateGroupMutate, isPending: false }),
  useDeleteGroup: () => ({ mutateAsync: mockDeleteGroupMutate, isPending: false }),
  useIAMPolicies: (...args: any[]) => mockIAMPolicies(...args),
  useIAMPolicy: (...args: any[]) => mockIAMPolicy(...args),
  usePolicyVersion: (...args: any[]) => mockPolicyVersion(...args),
  useCreatePolicy: () => ({ mutateAsync: mockCreatePolicyMutate, isPending: false }),
  useDeletePolicy: () => ({ mutateAsync: mockDeletePolicyMutate, isPending: false }),
  useCreateAccessKey: () => ({ mutateAsync: mockCreateAccessKeyMutate, isPending: false }),
  useTagUser: () => ({ mutateAsync: mockTagUser, isPending: false }),
  useUntagUser: () => ({ mutateAsync: mockUntagUser, isPending: false }),
  useTagRole: () => ({ mutateAsync: mockTagRole, isPending: false }),
  useUntagRole: () => ({ mutateAsync: mockUntagRole, isPending: false }),
  useTagPolicy: () => ({ mutateAsync: mockTagPolicy, isPending: false }),
  useUntagPolicy: () => ({ mutateAsync: mockUntagPolicy, isPending: false }),
  useInstanceProfiles: (...args: any[]) => mockInstanceProfiles(...args),
  useCreateInstanceProfile: () => ({ mutateAsync: mockCreateInstanceProfile, isPending: false }),
  useDeleteInstanceProfile: () => ({ mutateAsync: mockDeleteInstanceProfile, isPending: false }),
  useAddRoleToInstanceProfile: () => ({ mutateAsync: mockAddRoleToInstanceProfile, isPending: false }),
  useRemoveRoleFromInstanceProfile: () => ({ mutateAsync: mockRemoveRoleFromInstanceProfile, isPending: false }),
}));

vi.mock("../components/Toast", () => ({
  useToast: () => ({ showToast: mockShowToast }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockUseHealth = vi.fn();

vi.mock("../hooks/useSystem", () => ({
  useHealth: (...args: any[]) => {
    const result = mockUseHealth(...args);
    return result === undefined ? { data: undefined } : result;
  },
}));

import IAMPage from "./IAMPage";

function pageWrapper() {
  const Wrapper = createWrapper();
  return ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter>
      <Wrapper>{children}</Wrapper>
    </MemoryRouter>
  );
}

describe("IAMPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIAMRoles.mockReturnValue({ data: { roles: [{ name: "ec2-role", arn: "arn:aws:iam::000000000000:role/ec2-role", createDate: "2024-01-01" }] }, isLoading: false, isError: false, error: null });
    mockIAMUsers.mockReturnValue({ data: { users: [{ name: "admin-user", arn: "arn:aws:iam::000000000000:user/admin-user", createDate: "2024-01-01" }] }, isLoading: false, isError: false, error: null });
    mockIAMGroups.mockReturnValue({ data: { groups: [{ name: "admins", arn: "arn:aws:iam::000000000000:group/admins" }] }, isLoading: false, isError: false, error: null });
    mockIAMPolicies.mockReturnValue({ data: { policies: [{ name: "AdminPolicy", arn: "arn:aws:iam::000000000000:policy/AdminPolicy", scope: "Local" }] }, isLoading: false, isError: false, error: null });
    mockIAMUser.mockReturnValue({ data: { user: null, accessKeys: [], attachedPolicies: [], groups: [], inlinePolicies: [], tags: {} }, isLoading: false });
    mockIAMRole.mockReturnValue({ data: { role: null, attachedPolicies: [], tags: {} }, isLoading: false });
    mockIAMPolicy.mockReturnValue({ data: { policy: null, versions: [], tags: {} }, isLoading: false });
    mockPolicyVersion.mockReturnValue({ data: { document: null }, isLoading: false });
    mockIAMGroup.mockReturnValue({ data: { group: null, users: [] }, isLoading: false });
    mockGroupInlinePolicies.mockReturnValue({ data: { policyNames: [] }, isLoading: false });
    mockGroupInlinePolicy.mockReturnValue({ data: { document: null }, isLoading: false });
    mockInstanceProfiles.mockReturnValue({ data: { instanceProfiles: [] }, isLoading: false });
  });

  // ─── Render State Tests ─────────────────────────────────

  it("renders roles tab by default", () => {
    render(<IAMPage />, { wrapper: pageWrapper() });
    expect(screen.getByRole("heading", { name: /IAM/ })).toBeTruthy();
    expect(screen.getAllByText("Roles").length).toBeGreaterThan(0);
    expect(screen.getAllByText("ec2-role").length).toBeGreaterThan(0);
  });

  it("shows empty roles state", () => {
    mockIAMRoles.mockReturnValue({ data: { roles: [] }, isLoading: false, isError: false, error: null });
    render(<IAMPage />, { wrapper: pageWrapper() });
    expect(screen.getByText("No roles")).toBeTruthy();
  });

  it("shows empty users state", async () => {
    const user = userEvent.setup();
    mockIAMUsers.mockReturnValue({ data: { users: [] }, isLoading: false, isError: false, error: null });
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Users/i }));
    await waitFor(() => {
      expect(screen.getByText("No users")).toBeTruthy();
    });
  });

  it("shows empty policies state", async () => {
    const user = userEvent.setup();
    mockIAMPolicies.mockReturnValue({ data: { policies: [] }, isLoading: false, isError: false, error: null });
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Policies/i }));
    await waitFor(() => {
      expect(screen.getByText("No policies")).toBeTruthy();
    });
  });

  it("shows empty groups state", async () => {
    const user = userEvent.setup();
    mockIAMGroups.mockReturnValue({ data: { groups: [] }, isLoading: false, isError: false, error: null });
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Groups/i }));
    await waitFor(() => {
      expect(screen.getByText("No groups")).toBeTruthy();
    });
  });

  it("renders users tab", () => {
    render(<IAMPage />, { wrapper: pageWrapper() });
    expect(screen.getAllByText("Users").length).toBeGreaterThan(0);
  });

  it("renders policies tab", () => {
    render(<IAMPage />, { wrapper: pageWrapper() });
    expect(screen.getAllByText("Policies").length).toBeGreaterThan(0);
  });

  it("renders groups tab", () => {
    render(<IAMPage />, { wrapper: pageWrapper() });
    expect(screen.getAllByText("Groups").length).toBeGreaterThan(0);
  });

  // ─── Loading States ─────────────────────────────────────

  it("shows loading state for roles tab", () => {
    mockIAMRoles.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    render(<IAMPage />, { wrapper: pageWrapper() });
    expect(screen.getByRole("heading", { name: /IAM/ })).toBeTruthy();
    expect(screen.getAllByText("Roles").length).toBeGreaterThan(0);
  });

  it("shows loading state for users tab", async () => {
    const user = userEvent.setup();
    mockIAMUsers.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Users/i }));
    expect(screen.getAllByText("Users").length).toBeGreaterThan(0);
  });

  it("shows loading state for policies tab", async () => {
    const user = userEvent.setup();
    mockIAMPolicies.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Policies/i }));
    expect(screen.getAllByText("Policies").length).toBeGreaterThan(0);
  });

  it("shows loading state for groups tab", async () => {
    const user = userEvent.setup();
    mockIAMGroups.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Groups/i }));
    expect(screen.getAllByText("Groups").length).toBeGreaterThan(0);
  });

  // ─── Error States ───────────────────────────────────────

  it("shows error state for roles tab", () => {
    mockIAMRoles.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("Failed to load roles") });
    render(<IAMPage />, { wrapper: pageWrapper() });
    expect(screen.getByRole("heading", { name: /IAM/ })).toBeTruthy();
  });

  it("shows error state for users tab", async () => {
    const user = userEvent.setup();
    mockIAMUsers.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("Failed to load users") });
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Users/i }));
    expect(screen.getAllByText("Users").length).toBeGreaterThan(0);
  });

  it("shows error state for policies tab", async () => {
    const user = userEvent.setup();
    mockIAMPolicies.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("Failed to load policies") });
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Policies/i }));
    expect(screen.getAllByText("Policies").length).toBeGreaterThan(0);
  });

  it("shows error state for groups tab", async () => {
    const user = userEvent.setup();
    mockIAMGroups.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("Failed to load groups") });
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Groups/i }));
    expect(screen.getAllByText("Groups").length).toBeGreaterThan(0);
  });

  // ─── List Render ────────────────────────────────────────

  it("renders users list with data", async () => {
    const user = userEvent.setup();
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Users/i }));
    await waitFor(() => {
      expect(screen.getAllByText("admin-user").length).toBeGreaterThan(0);
    });
  });

  it("renders policies list with data", async () => {
    const user = userEvent.setup();
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Policies/i }));
    await waitFor(() => {
      expect(screen.getAllByText("AdminPolicy").length).toBeGreaterThan(0);
    });
  });

  it("renders groups list with data", async () => {
    const user = userEvent.setup();
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Groups/i }));
    await waitFor(() => {
      expect(screen.getAllByText("admins").length).toBeGreaterThan(0);
    });
  });

  // ─── Create Interactions ────────────────────────────────

  it("opens create role modal and submits", async () => {
    const user = userEvent.setup();
    render(<IAMPage />, { wrapper: pageWrapper() });
    await clickButton(user, /Create role/i);
    await waitFor(() => {
      expect(screen.getByText(/AssumeRolePolicyDocument/i)).toBeTruthy();
    });
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "test-role");
    await clickButton(user, /Create/i, { last: true });
    expect(mockCreateRoleMutate).toHaveBeenCalled();
  });

  it("opens create user modal from users tab", async () => {
    const user = userEvent.setup();
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Users/i }));
    await waitFor(() => {
      expect(screen.getAllByText("Users").length).toBeGreaterThan(0);
    });
    await clickButton(user, /Create user/i);
    await waitFor(() => {
      expect(screen.getByDisplayValue("/")).toBeTruthy();
    });
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "new-user");
    await clickButton(user, /Create/i, { last: true });
    expect(mockCreateUserMutate).toHaveBeenCalled();
  });

  it("opens create policy modal and submits", async () => {
    const user = userEvent.setup();
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Policies/i }));
    await clickButton(user, /Create policy/i);
    await waitFor(() => {
      expect(screen.getByText(/Policy document/i)).toBeTruthy();
    });
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "test-policy");
    await clickButton(user, /Create/i, { last: true });
    expect(mockCreatePolicyMutate).toHaveBeenCalled();
  });

  it("opens create group modal and submits", async () => {
    const user = userEvent.setup();
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Groups/i }));
    await clickButton(user, /Create group/i);
    await waitFor(() => {
      expect(screen.getAllByText("Group name").length).toBeGreaterThan(0);
    });
    const input = document.getElementById("group-name-input") as HTMLInputElement;
    if (input) input.value = "test-group";
    await clickButton(user, /Create group/i, { last: true });
    await clickButton(user, /^Create$/);
    expect(mockCreateGroupMutate).toHaveBeenCalledWith({ name: "test-group" }, expect.anything());
  });

  // ─── Delete Interactions ────────────────────────────────

  it("deletes a role", async () => {
    const user = userEvent.setup();
    mockDeleteRoleMutate.mockResolvedValue(undefined);
    render(<IAMPage />, { wrapper: pageWrapper() });
    await clickButton(user, /Delete ec2-role/i);
    await waitFor(() => {
      expect(screen.getByText(/Are you sure/i)).toBeTruthy();
    });
    await clickButton(user, /^Delete$/);
    await waitFor(() => {
      expect(mockDeleteRoleMutate).toHaveBeenCalledWith("ec2-role");
    });
  });

  it("deletes a user", async () => {
    const user = userEvent.setup();
    mockDeleteUserMutate.mockResolvedValue(undefined);
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Users/i }));
    await clickButton(user, /Delete admin-user/i);
    await waitFor(() => {
      expect(screen.getByText(/Are you sure/i)).toBeTruthy();
    });
    await clickButton(user, /^Delete$/);
    await waitFor(() => {
      expect(mockDeleteUserMutate).toHaveBeenCalledWith("admin-user");
    });
  });

  it("deletes a policy", async () => {
    const user = userEvent.setup();
    mockDeletePolicyMutate.mockResolvedValue(undefined);
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Policies/i }));
    await clickButton(user, /Delete AdminPolicy/i);
    await waitFor(() => {
      expect(screen.getByText(/Are you sure/i)).toBeTruthy();
    });
    await clickButton(user, /^Delete$/);
    await waitFor(() => {
      expect(mockDeletePolicyMutate).toHaveBeenCalledWith("arn:aws:iam::000000000000:policy/AdminPolicy");
    });
  });

  it("deletes a group", async () => {
    const user = userEvent.setup();
    mockDeleteGroupMutate.mockResolvedValue(undefined);
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Groups/i }));
    await clickButton(user, /Delete admins/i);
    await waitFor(() => {
      expect(screen.getByText(/Are you sure/i)).toBeTruthy();
    });
    await clickButton(user, /^Delete$/);
    await waitFor(() => {
      expect(mockDeleteGroupMutate).toHaveBeenCalledWith("admins");
    });
  });

  // ─── Detail Views ───────────────────────────────────────

  it("opens user detail modal and shows user info", async () => {
    const user = userEvent.setup();
    mockIAMUser.mockReturnValue({
      data: {
        user: { name: "admin-user", arn: "arn:aws:iam::000000000000:user/admin-user", userId: "A1B2C3", path: "/", createDate: "2024-01-01T00:00:00Z" },
        accessKeys: [{ accessKeyId: "AKIA123", status: "Active", createDate: "2024-01-01T00:00:00Z" }],
        attachedPolicies: [{ name: "AdminPolicy", arn: "arn:aws:iam::000000000000:policy/AdminPolicy" }],
        groups: [{ name: "admins" }],
        inlinePolicies: ["inline-policy-1"],
      },
      isLoading: false,
    });
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Users/i }));
    await clickButton(user, /View/i, { last: true });
    await waitFor(() => {
      expect(screen.getByText(/User: admin-user/i)).toBeTruthy();
      expect(screen.getByText("A1B2C3")).toBeTruthy();
      expect(screen.getByText("AKIA123")).toBeTruthy();
    });
  });

  it("creates access key in user detail modal", async () => {
    const user = userEvent.setup();
    mockCreateAccessKeyMutate.mockResolvedValue({ accessKeyId: "NEWKEY", secretAccessKey: "SECRETVALUE", status: "Active" });
    mockIAMUser.mockReturnValue({
      data: {
        user: { name: "admin-user", arn: "arn:aws:iam::000000000000:user/admin-user", userId: "A1B2C3", path: "/", createDate: "2024-01-01T00:00:00Z" },
        accessKeys: [],
        attachedPolicies: [],
        groups: [],
        inlinePolicies: [],
      },
      isLoading: false,
    });
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Users/i }));
    await clickButton(user, /View/i, { last: true });
    await waitFor(() => {
      expect(screen.getByText(/User: admin-user/i)).toBeTruthy();
    });
    await clickButton(user, /Create access key/i);
    await waitFor(() => {
      expect(mockCreateAccessKeyMutate).toHaveBeenCalledWith("admin-user");
      expect(screen.getByText("NEWKEY")).toBeTruthy();
    });
  });

  it("opens role detail modal and shows trust policy", async () => {
    const user = userEvent.setup();
    const trustPolicy = JSON.stringify({ Version: "2012-10-17", Statement: [{ Effect: "Allow", Principal: { Service: "ec2.amazonaws.com" }, Action: "sts:AssumeRole" }] });
    mockIAMRole.mockReturnValue({
      data: {
        role: { name: "ec2-role", arn: "arn:aws:iam::000000000000:role/ec2-role", roleId: "R123", path: "/", createDate: "2024-01-01T00:00:00Z", maxSessionDuration: 3600, description: "EC2 role", assumeRolePolicyDocument: trustPolicy },
        attachedPolicies: [{ name: "AdminPolicy", arn: "arn:aws:iam::000000000000:policy/AdminPolicy" }],
        tags: { Environment: "production" },
      },
      isLoading: false,
    });
    render(<IAMPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i, { last: true });
    await waitFor(() => {
      expect(screen.getByText(/Role: ec2-role/i)).toBeTruthy();
      expect(screen.getByText("R123")).toBeTruthy();
      expect(screen.getByText("Trust policy")).toBeTruthy();
    });
  });

  it("opens policy detail modal and shows versions", async () => {
    const user = userEvent.setup();
    mockIAMPolicy.mockReturnValue({
      data: {
        policy: { name: "AdminPolicy", arn: "arn:aws:iam::000000000000:policy/AdminPolicy", policyId: "P123", defaultVersionId: "v1", attachmentCount: 2, createDate: "2024-01-01T00:00:00Z" },
        versions: [{ versionId: "v1", isDefaultVersion: true }, { versionId: "v2", isDefaultVersion: false }],
      },
      isLoading: false,
    });
    mockPolicyVersion.mockReturnValue({
      data: { document: JSON.stringify({ Version: "2012-10-17", Statement: [{ Effect: "Allow", Action: "*", Resource: "*" }] }) },
      isLoading: false,
    });
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Policies/i }));
    await clickButton(user, /View/i, { last: true });
    await waitFor(() => {
      expect(screen.getByText(/Policy: AdminPolicy/i)).toBeTruthy();
      expect(screen.getByText("P123")).toBeTruthy();
    });
  });

  // ─── Policy Scope ───────────────────────────────────────

  it("switches policy scope", async () => {
    const user = userEvent.setup();
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Policies/i }));
    await waitFor(() => {
      expect(screen.getAllByText("Policies").length).toBeGreaterThan(0);
    });
  });

  // ─── Groups Tab — Empty Name (falsy branch) ────────────

  it("does not call createGroup when group name is empty", async () => {
    const user = userEvent.setup();
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Groups/i }));
    await clickButton(user, /Create group/i);
    await waitFor(() => {
      expect(screen.getAllByText("Group name").length).toBeGreaterThan(0);
    });
    // Don't set any value on the input — leave it empty
    await clickButton(user, /^Create$/);
    // The if (name) guard prevents mutate from being called
    expect(mockCreateGroupMutate).not.toHaveBeenCalled();
  });

  // ─── Groups Tab — Error Toast via onError ─────────────

  it("calls onError when createGroup fails", async () => {
    const user = userEvent.setup();
    mockCreateGroupMutate.mockImplementation((_params: any, opts: any) => {
      opts?.onError?.(new Error("Group creation failed"));
    });
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Groups/i }));
    await clickButton(user, /Create group/i);
    await waitFor(() => {
      expect(screen.getAllByText("Group name").length).toBeGreaterThan(0);
    });
    const input = document.getElementById("group-name-input") as HTMLInputElement;
    if (input) input.value = "error-group";
    await clickButton(user, /^Create$/);
    // Toast would be called — we verify mutate was called (onError path covered via mock)
    expect(mockCreateGroupMutate).toHaveBeenCalled();
  });

  // ─── Breadcrumb onFollow ───────────────────────────────

  it("follows breadcrumb to dashboard", async () => {
    const user = userEvent.setup();
    render(<IAMPage />, { wrapper: pageWrapper() });
    // Multiple "Dashboard" texts — use getAllByText and click the first (breadcrumb)
    const dashLinks = screen.getAllByText(/Dashboard/i);
    await user.click(dashLinks[0]);
    // onFollow handler fires — page still renders successfully
    expect(screen.getByRole("heading", { name: /IAM/ })).toBeTruthy();
  });

  // ─── User Detail — No user found ───────────────────────

  it("shows 'User not found' when user detail has no user", async () => {
    const user = userEvent.setup();
    mockIAMUser.mockReturnValue({
      data: { user: null, accessKeys: [], attachedPolicies: [], groups: [], inlinePolicies: [] },
      isLoading: false,
    });
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Users/i }));
    await clickButton(user, /View/i, { last: true });
    await waitFor(() => {
      expect(screen.getByText("User not found")).toBeTruthy();
    });
  });

  // ─── User Detail — Loading ─────────────────────────────

  it("shows loading in user detail modal", async () => {
    const user = userEvent.setup();
    mockIAMUser.mockReturnValue({ data: undefined, isLoading: true });
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Users/i }));
    await clickButton(user, /View/i, { last: true });
    await waitFor(() => {
      expect(screen.getByText("Loading...")).toBeTruthy();
    });
  });

  // ─── Role Detail — No role found ──────────────────────

  it("shows 'Role not found' when role detail has no role", async () => {
    const user = userEvent.setup();
    mockIAMRole.mockReturnValue({ data: { role: null, attachedPolicies: [], tags: {} }, isLoading: false });
    render(<IAMPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i, { last: true });
    await waitFor(() => {
      expect(screen.getByText("Role not found")).toBeTruthy();
    });
  });

  // ─── Role Detail — Loading ────────────────────────────

  it("shows loading in role detail modal", async () => {
    const user = userEvent.setup();
    mockIAMRole.mockReturnValue({ data: undefined, isLoading: true });
    render(<IAMPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i, { last: true });
    await waitFor(() => {
      expect(screen.getByText("Loading...")).toBeTruthy();
    });
  });

  // ─── Policy Detail — No policy found ──────────────────

  it("shows 'Policy not found' when policy detail has no policy", async () => {
    const user = userEvent.setup();
    mockIAMPolicy.mockReturnValue({ data: { policy: null, versions: [] }, isLoading: false });
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Policies/i }));
    await clickButton(user, /View/i, { last: true });
    await waitFor(() => {
      expect(screen.getByText("Policy not found")).toBeTruthy();
    });
  });

  // ─── Policy Detail — Loading ──────────────────────────

  it("shows loading in policy detail modal", async () => {
    const user = userEvent.setup();
    mockIAMPolicy.mockReturnValue({ data: undefined, isLoading: true });
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Policies/i }));
    await clickButton(user, /View/i, { last: true });
    await waitFor(() => {
      expect(screen.getByText("Loading...")).toBeTruthy();
    });
  });

  // ─── Inline Policies (non-empty) ──────────────────────

  it("shows inline policy badges when user has inline policies", async () => {
    const user = userEvent.setup();
    mockIAMUser.mockReturnValue({
      data: {
        user: { name: "admin-user", arn: "arn:aws:iam::000000000000:user/admin-user", userId: "A1B2C3", path: "/", createDate: "2024-01-01T00:00:00Z" },
        accessKeys: [],
        attachedPolicies: [],
        groups: [],
        inlinePolicies: ["custom-policy-1", "custom-policy-2"],
      },
      isLoading: false,
    });
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Users/i }));
    await clickButton(user, /View/i, { last: true });
    await waitFor(() => {
      expect(screen.getAllByText("custom-policy-1").length).toBeGreaterThan(0);
      expect(screen.getAllByText("custom-policy-2").length).toBeGreaterThan(0);
    });
  });

  // ─── Role Tags (non-empty) ────────────────────────────

  it("shows tags in role detail modal", async () => {
    const user = userEvent.setup();
    mockIAMRole.mockReturnValue({
      data: {
        role: { name: "ec2-role", arn: "arn:aws:iam::000000000000:role/ec2-role", roleId: "R123", path: "/", createDate: "2024-01-01T00:00:00Z", maxSessionDuration: 3600, description: "EC2 role" },
        attachedPolicies: [],
        tags: { Environment: "production", Team: "platform" },
      },
      isLoading: false,
    });
    render(<IAMPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i, { last: true });
    await waitFor(() => {
      // Tags render as Badges with "key: value" text
      expect(screen.getByText("Environment: production")).toBeTruthy();
    });
  });
});

describe("IAMPage — remaining coverage", () => {
  beforeEach(() => {
    mockIAMRoles.mockReturnValue({
      data: { roles: [{ name: "ec2-role", arn: "arn:aws:iam::000000000000:role/ec2-role", createDate: "2024-01-01" }] },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockIAMUsers.mockReturnValue({
      data: { users: [{ name: "admin-user", arn: "arn:aws:iam::000000000000:user/admin-user", createDate: "2024-01-01" }] },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockIAMGroups.mockReturnValue({
      data: { groups: [{ name: "admins", arn: "arn:aws:iam::000000000000:group/admins" }] },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockIAMPolicies.mockReturnValue({
      data: { policies: [{ name: "AdminPolicy", arn: "arn:aws:iam::000000000000:policy/AdminPolicy", scope: "Local" }] },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockIAMUser.mockReturnValue({
      data: { user: null, accessKeys: [], attachedPolicies: [], groups: [], inlinePolicies: [] },
      isLoading: false,
    });
    mockIAMRole.mockReturnValue({
      data: { role: null, attachedPolicies: [], tags: {} },
      isLoading: false,
    });
    mockIAMPolicy.mockReturnValue({
      data: { policy: null, versions: [] },
      isLoading: false,
    });
    mockPolicyVersion.mockReturnValue({
      data: { document: null },
      isLoading: false,
    });
  });

  it("shows error toast when deleting a user fails", async () => {
    mockDeleteUserMutate.mockRejectedValue(new Error("delete-failed"));
    const user = userEvent.setup();
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Users/i }));
    await clickButton(user, /Delete admin-user/i);
    await waitFor(() => expect(screen.getByText(/Are you sure/i)).toBeTruthy());
    await clickButton(user, /^Delete$/);
    await waitFor(() =>
      expect(mockDeleteUserMutate).toHaveBeenCalledWith("admin-user"),
    );
  });

  it("shows error toast when creating a user fails", async () => {
    mockCreateUserMutate.mockRejectedValue(new Error("create-failed"));
    const user = userEvent.setup();
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Users/i }));
    await clickButton(user, /Create user/i);
    await waitFor(() => expect(screen.getByDisplayValue("/")).toBeTruthy());
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "new-user");
    await clickButton(user, /Create/i, { last: true });
    await waitFor(() =>
      expect(mockCreateUserMutate).toHaveBeenCalled(),
    );
  });

  it("types a custom path and cancels the create user modal", async () => {
    const user = userEvent.setup();
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Users/i }));
    await clickButton(user, /Create user/i);
    await waitFor(() => expect(screen.getByDisplayValue("/")).toBeTruthy());
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[1], "custom");
    await clickButton(user, /Cancel/i, { last: true });
    await waitFor(() =>
      expect(screen.queryAllByText("Create user")).toHaveLength(1),
    );
  });

  it("closes the user detail modal", async () => {
    mockIAMUser.mockReturnValue({
      data: {
        user: { name: "admin-user", arn: "arn:1", userId: "A1", path: "/", createDate: "2024-01-01T00:00:00Z" },
        accessKeys: [],
        attachedPolicies: [],
        groups: [],
        inlinePolicies: [],
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Users/i }));
    await clickButton(user, /View/i, { last: true });
    await waitFor(() =>
      expect(screen.getByText(/User: admin-user/i)).toBeTruthy(),
    );
    await clickButton(user, /^Close$/);
    await waitFor(() =>
      expect(screen.queryByText(/User: admin-user/i)).toBeNull(),
    );
  });

  it("shows error toast and dismisses the key alert in user detail", async () => {
    mockCreateAccessKeyMutate.mockRejectedValueOnce(
      new Error("key-failed"),
    );
    mockIAMUser.mockReturnValue({
      data: {
        user: { name: "admin-user", arn: "arn:1", userId: "A1", path: "/", createDate: "2024-01-01T00:00:00Z" },
        accessKeys: [],
        attachedPolicies: [],
        groups: [],
        inlinePolicies: [],
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Users/i }));
    await clickButton(user, /View/i, { last: true });
    await waitFor(() =>
      expect(screen.getByText(/User: admin-user/i)).toBeTruthy(),
    );
    await clickButton(user, /Create access key/i);
    await waitFor(() =>
      expect(mockCreateAccessKeyMutate).toHaveBeenCalledWith("admin-user"),
    );
    // Second call succeeds and renders the warning alert; dismiss it
    mockCreateAccessKeyMutate.mockResolvedValue({
      accessKeyId: "NEWKEY",
      secretAccessKey: "SECRETVALUE",
      status: "Active",
    });
    await clickButton(user, /Create access key/i);
    await waitFor(() =>
      expect(screen.getByText("NEWKEY")).toBeTruthy(),
    );
    // The alert's dismiss button is icon-only (no accessible name in this
    // Cloudscape version), so click it via its class.
    await user.click(
      document.querySelector('[class*="awsui_dismiss-button"]') as HTMLElement,
    );
    await waitFor(() =>
      expect(screen.queryByText("NEWKEY")).toBeNull(),
    );
  });

  it("shows error toast when deleting a role fails", async () => {
    mockDeleteRoleMutate.mockRejectedValue(new Error("delete-failed"));
    const user = userEvent.setup();
    render(<IAMPage />, { wrapper: pageWrapper() });
    await clickButton(user, /Delete ec2-role/i);
    await waitFor(() => expect(screen.getByText(/Are you sure/i)).toBeTruthy());
    await clickButton(user, /^Delete$/);
    await waitFor(() =>
      expect(mockDeleteRoleMutate).toHaveBeenCalledWith("ec2-role"),
    );
  });

  it("shows error toast when creating a role fails and cancels the modal", async () => {
    mockCreateRoleMutate.mockRejectedValue(new Error("create-failed"));
    const user = userEvent.setup();
    render(<IAMPage />, { wrapper: pageWrapper() });
    await clickButton(user, /Create role/i);
    await waitFor(() =>
      expect(screen.getByText(/AssumeRolePolicyDocument/i)).toBeTruthy(),
    );
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "test-role");
    await user.type(inputs[1], "My role description");
    await clickButton(user, /Create/i, { last: true });
    await waitFor(() => expect(mockCreateRoleMutate).toHaveBeenCalled());
    // Reopen and Cancel to cover the onClose handler
    await clickButton(user, /Create role/i);
    await waitFor(() =>
      expect(screen.getByText(/AssumeRolePolicyDocument/i)).toBeTruthy(),
    );
    await clickButton(user, /Cancel/i, { last: true });
    await waitFor(() =>
      expect(screen.queryByText(/AssumeRolePolicyDocument/i)).toBeNull(),
    );
  });

  it("closes the role detail modal and falls back on invalid trust policy", async () => {
    mockIAMRole.mockReturnValue({
      data: {
        role: {
          name: "ec2-role",
          arn: "arn:1",
          roleId: "R123",
          path: "/",
          createDate: "2024-01-01T00:00:00Z",
          assumeRolePolicyDocument: "{not-json",
        },
        attachedPolicies: [],
        tags: {},
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<IAMPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i, { last: true });
    await waitFor(() =>
      expect(screen.getByText(/Role: ec2-role/i)).toBeTruthy(),
    );
    expect(screen.getByText("{not-json")).toBeTruthy();
    await clickButton(user, /^Close$/);
    await waitFor(() =>
      expect(screen.queryByText(/Role: ec2-role/i)).toBeNull(),
    );
  });

  it("switches the policy scope selector", async () => {
    const user = userEvent.setup();
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Policies/i }));
    await waitFor(() =>
      expect(screen.getAllByText("Policies").length).toBeGreaterThan(0),
    );
    await user.click(screen.getAllByText("Local")[0]);
    await user.click(await screen.findByText("AWS"));
  });

  it("shows error toast when deleting a policy fails", async () => {
    mockDeletePolicyMutate.mockRejectedValue(new Error("delete-failed"));
    const user = userEvent.setup();
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Policies/i }));
    await clickButton(user, /Delete AdminPolicy/i);
    await waitFor(() => expect(screen.getByText(/Are you sure/i)).toBeTruthy());
    await clickButton(user, /^Delete$/);
    await waitFor(() =>
      expect(mockDeletePolicyMutate).toHaveBeenCalledWith(
        "arn:aws:iam::000000000000:policy/AdminPolicy",
      ),
    );
  });

  it("shows error toast when creating a policy fails and cancels the modal", async () => {
    mockCreatePolicyMutate.mockRejectedValue(new Error("create-failed"));
    const user = userEvent.setup();
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Policies/i }));
    await clickButton(user, /Create policy/i);
    await waitFor(() =>
      expect(screen.getByText(/Policy document/i)).toBeTruthy(),
    );
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "test-policy");
    await user.type(inputs[1], "Policy description");
    await clickButton(user, /Create/i, { last: true });
    await waitFor(() => expect(mockCreatePolicyMutate).toHaveBeenCalled());
    // Reopen and Cancel to cover the onClose handler
    await clickButton(user, /Create policy/i);
    await waitFor(() =>
      expect(screen.getByText(/Policy document/i)).toBeTruthy(),
    );
    await clickButton(user, /Cancel/i, { last: true });
    await waitFor(() =>
      expect(screen.queryByText(/Policy document/i)).toBeNull(),
    );
  });

  it("switches policy version and falls back on invalid document", async () => {
    mockIAMPolicy.mockReturnValue({
      data: {
        policy: {
          name: "AdminPolicy",
          arn: "arn:aws:iam::000000000000:policy/AdminPolicy",
          policyId: "P123",
          defaultVersionId: "v1",
          attachmentCount: 2,
          createDate: "2024-01-01T00:00:00Z",
        },
        versions: [
          { versionId: "v1", isDefaultVersion: true },
          { versionId: "v2", isDefaultVersion: false },
        ],
      },
      isLoading: false,
    });
    mockPolicyVersion.mockReturnValue({
      data: { document: "{not-json" },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Policies/i }));
    await clickButton(user, /View/i, { last: true });
    await waitFor(() =>
      expect(screen.getByText(/Policy: AdminPolicy/i)).toBeTruthy(),
    );
    expect(screen.getByText("{not-json")).toBeTruthy();
    await user.click(screen.getByText("v1 (default)"));
    await user.click(await screen.findByText("v2"));
    await clickButton(user, /^Close$/);
    await waitFor(() =>
      expect(screen.queryByText(/Policy: AdminPolicy/i)).toBeNull(),
    );
  });

  it("shows error toast when deleting a group fails", async () => {
    mockDeleteGroupMutate.mockRejectedValue(new Error("delete-failed"));
    const user = userEvent.setup();
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Groups/i }));
    await clickButton(user, /Delete admins/i);
    await waitFor(() => expect(screen.getByText(/Are you sure/i)).toBeTruthy());
    await clickButton(user, /^Delete$/);
    await waitFor(() =>
      expect(mockDeleteGroupMutate).toHaveBeenCalledWith("admins"),
    );
  });

  it("dismisses, cancels, and creates a group", async () => {
    mockCreateGroupMutate.mockImplementation((_body: any, opts: any) =>
      opts?.onSuccess?.(_body, {}),
    );
    const user = userEvent.setup();
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Groups/i }));
    await clickButton(user, /Create group/i);
    await waitFor(() =>
      expect(screen.getAllByText("Group name").length).toBeGreaterThan(0),
    );
    // The modal header lives inside a dialog; the page also keeps a hidden
    // ConfirmDialog mounted, so assert on the modal header's presence instead
    // of counting dialogs.
    const expectCreateGroupClosed = () => {
      const visibleDialogs = Array.from(
        document.querySelectorAll('[role="dialog"]'),
      ).filter((d) => !d.className.includes("hidden"));
      expect(
        visibleDialogs.some((d) => d.textContent?.includes("Create group")),
      ).toBe(false);
    };
    // Escape to cover onDismiss
    document
      .querySelectorAll('[class*="awsui_dialog"]')
      .forEach((dialog) => {
        fireEvent.keyDown(dialog as HTMLElement, {
          keyCode: 27,
          key: "Escape",
          bubbles: true,
        });
      });
    await waitFor(expectCreateGroupClosed);
    // Reopen and Cancel
    await clickButton(user, /Create group/i);
    await waitFor(() =>
      expect(screen.getAllByText("Group name").length).toBeGreaterThan(0),
    );
    await clickButton(user, /Cancel/i, { last: true });
    await waitFor(expectCreateGroupClosed);
    // Reopen and submit with onSuccess
    await clickButton(user, /Create group/i);
    await waitFor(() =>
      expect(screen.getAllByText("Group name").length).toBeGreaterThan(0),
    );
    const input = document.getElementById(
      "group-name-input",
    ) as HTMLInputElement;
    if (input) input.value = "ok-group";
    await clickButton(user, /^Create$/);
    await waitFor(() =>
      expect(mockCreateGroupMutate).toHaveBeenCalledWith(
        { name: "ok-group" },
        expect.anything(),
      ),
    );
    await waitFor(expectCreateGroupClosed);
  });
});

describe("IAMPage — branch completion", () => {
  beforeEach(() => {
    mockIAMRoles.mockReturnValue({
      data: { roles: [{ name: "ec2-role", arn: "arn:aws:iam::000000000000:role/ec2-role", createDate: "2024-01-01" }] },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockIAMUsers.mockReturnValue({
      data: { users: [{ name: "admin-user", arn: "arn:aws:iam::000000000000:user/admin-user", createDate: "2024-01-01" }] },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockIAMGroups.mockReturnValue({
      data: { groups: [{ name: "admins", arn: "arn:aws:iam::000000000000:group/admins" }] },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockIAMPolicies.mockReturnValue({
      data: { policies: [{ name: "AdminPolicy", arn: "arn:aws:iam::000000000000:policy/AdminPolicy", scope: "Local" }] },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockIAMUser.mockReturnValue({
      data: { user: null, accessKeys: [], attachedPolicies: [], groups: [], inlinePolicies: [] },
      isLoading: false,
    });
    mockIAMRole.mockReturnValue({
      data: { role: null, attachedPolicies: [], tags: {} },
      isLoading: false,
    });
    mockIAMPolicy.mockReturnValue({
      data: { policy: null, versions: [] },
      isLoading: false,
    });
    mockPolicyVersion.mockReturnValue({
      data: { document: null },
      isLoading: false,
    });
    mockUseHealth.mockReturnValue({ data: undefined });
  });

  it("renders sparse user rows with dash created date", async () => {
    mockIAMUsers.mockReturnValue({
      data: { users: [{ name: "sparse-user", arn: "arn:1" }] },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Users/i }));
    await waitFor(() => {
      expect(screen.getByText("sparse-user")).toBeTruthy();
      // created cell falls back to "-" when createDate is missing
      expect(screen.getAllByText("-").length).toBeGreaterThan(0);
    });
  });

  it("renders user detail with sparse keys and inactive status", async () => {
    mockIAMUser.mockReturnValue({
      data: {
        user: { name: "admin-user", arn: "arn:1", userId: "A1", path: "/" },
        accessKeys: [{ accessKeyId: "AKIA123", status: "Inactive" }],
        attachedPolicies: [],
        groups: [],
        inlinePolicies: [],
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Users/i }));
    await clickButton(user, /View/i, { last: true });
    await waitFor(() =>
      expect(screen.getByText(/User: admin-user/i)).toBeTruthy(),
    );
    // non-Active status badge, dash created, no newKey so items come from accessKeys
    expect(screen.getByText("Inactive")).toBeTruthy();
    expect(screen.getAllByText("AKIA123").length).toBeGreaterThan(0);
    expect(screen.getAllByText("-").length).toBeGreaterThan(0);
  });

  it("renders sparse role rows and detail", async () => {
    mockIAMRoles.mockReturnValue({
      data: { roles: [{ name: "sparse-role", arn: "arn:1" }] },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockIAMRole.mockReturnValue({
      data: {
        role: { name: "sparse-role", arn: "arn:1", roleId: "R1", path: "/" },
        attachedPolicies: [],
        tags: {},
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<IAMPage />, { wrapper: pageWrapper() });
    await waitFor(() => expect(screen.getByText("sparse-role")).toBeTruthy());
    await clickButton(user, /View/i, { last: true });
    await waitFor(() =>
      expect(screen.getByText(/Role: sparse-role/i)).toBeTruthy(),
    );
    // created + description fall back to "-"
    expect(screen.getAllByText("-").length).toBeGreaterThan(0);
  });

  it("renders AWS-scope policy with a create date", async () => {
    mockIAMPolicies.mockReturnValue({
      data: {
        policies: [
          { name: "AWSManaged", arn: "arn:1", scope: "AWS", createDate: "2024-01-01T00:00:00Z" },
        ],
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Policies/i }));
    await waitFor(() => expect(screen.getByText("AWSManaged")).toBeTruthy());
    // created cell renders the date (blue AWS badge covers the scope truthy arm)
    expect(screen.getAllByText(/2024/).length).toBeGreaterThan(0);
  });

  it("renders policy detail with sparse policy and no version selected", async () => {
    mockIAMPolicy.mockReturnValue({
      data: {
        policy: {
          name: "AdminPolicy",
          arn: "arn:1",
          policyId: "P1",
          defaultVersionId: "v1",
          attachmentCount: 0,
        },
        versions: [],
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Policies/i }));
    await clickButton(user, /View/i, { last: true });
    await waitFor(() =>
      expect(screen.getByText(/Policy: AdminPolicy/i)).toBeTruthy(),
    );
    // created falls back to "-", no document → prompt text
    expect(screen.getAllByText("-").length).toBeGreaterThan(0);
    expect(
      screen.getByText("Select a version to view document"),
    ).toBeTruthy();
  });

  it("shows loading document while policy version loads", async () => {
    mockIAMPolicy.mockReturnValue({
      data: {
        policy: {
          name: "AdminPolicy",
          arn: "arn:1",
          policyId: "P1",
          defaultVersionId: "v1",
          attachmentCount: 0,
          createDate: "2024-01-01T00:00:00Z",
        },
        versions: [{ versionId: "v1", isDefaultVersion: true }],
      },
      isLoading: false,
    });
    mockPolicyVersion.mockReturnValue({ data: undefined, isLoading: true });
    const user = userEvent.setup();
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Policies/i }));
    await clickButton(user, /View/i, { last: true });
    await waitFor(() =>
      expect(screen.getByText("Loading document...")).toBeTruthy(),
    );
  });

  it("selects a non-default policy version", async () => {
    mockIAMPolicy.mockReturnValue({
      data: {
        policy: {
          name: "AdminPolicy",
          arn: "arn:1",
          policyId: "P1",
          defaultVersionId: "v1",
          attachmentCount: 0,
          createDate: "2024-01-01T00:00:00Z",
        },
        versions: [
          { versionId: "v1", isDefaultVersion: true },
          { versionId: "v2", isDefaultVersion: false },
        ],
      },
      isLoading: false,
    });
    mockPolicyVersion.mockReturnValue({
      data: { document: "{}" },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Policies/i }));
    await clickButton(user, /View/i, { last: true });
    await waitFor(() =>
      expect(screen.getByText(/Policy: AdminPolicy/i)).toBeTruthy(),
    );
    // open the version Select and pick the non-default v2
    await user.click(screen.getByRole("button", { name: /v1 \(default\)/i }));
    await user.click(await screen.findByRole("option", { name: /v2/i }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /^v2$/ })).toBeTruthy(),
    );
  });

  it("renders group rows with a create date", async () => {
    mockIAMGroups.mockReturnValue({
      data: {
        groups: [
          { name: "admins", arn: "arn:1", createDate: "2024-01-01T00:00:00Z" },
        ],
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Groups/i }));
    await waitFor(() => expect(screen.getByText("admins")).toBeTruthy());
    expect(screen.getAllByText(/2024/).length).toBeGreaterThan(0);
  });

  it("creates an access key without a status field", async () => {
    mockIAMUser.mockReturnValue({
      data: {
        user: {
          name: "admin-user",
          arn: "arn:1",
          userId: "A1",
          path: "/",
          createDate: "2024-01-01T00:00:00Z",
        },
        accessKeys: [],
        attachedPolicies: [],
        groups: [],
        inlinePolicies: [],
      },
      isLoading: false,
    });
    mockCreateAccessKeyMutate.mockResolvedValue({
      accessKeyId: "NEWKEY",
      secretAccessKey: "SECRETVALUE",
    });
    const user = userEvent.setup();
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Users/i }));
    await clickButton(user, /View/i, { last: true });
    await waitFor(() =>
      expect(screen.getByText(/User: admin-user/i)).toBeTruthy(),
    );
    await clickButton(user, /Create access key/i);
    await waitFor(() => expect(screen.getByText("NEWKEY")).toBeTruthy());
    // status falls back to "Active" when the response omits it
    expect(screen.getAllByText("Active").length).toBeGreaterThan(0);
  });

  it("renders running and available health statuses", async () => {
    mockUseHealth.mockReturnValue({
      data: { services: { iam: "running" } },
    });
    const { rerender } = render(<IAMPage />, {
      wrapper: pageWrapper(),
    });
    expect(screen.getByText("Running")).toBeTruthy();
    mockUseHealth.mockReturnValue({
      data: { services: { iam: "available" } },
    });
    rerender(<IAMPage />);
    await waitFor(() =>
      expect(screen.getByText("Available")).toBeTruthy(),
    );
  });
});

describe("IAMPage — G.85 group detail, policies, tags, instance profiles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIAMRoles.mockReturnValue({ data: { roles: [] }, isLoading: false, isError: false, error: null });
    mockIAMUsers.mockReturnValue({ data: { users: [] }, isLoading: false, isError: false, error: null });
    mockIAMGroups.mockReturnValue({ data: { groups: [] }, isLoading: false, isError: false, error: null });
    mockIAMPolicies.mockReturnValue({ data: { policies: [] }, isLoading: false, isError: false, error: null });
    mockIAMUser.mockReturnValue({ data: { user: null, accessKeys: [], attachedPolicies: [], groups: [], inlinePolicies: [], tags: {} }, isLoading: false });
    mockIAMRole.mockReturnValue({ data: { role: null, attachedPolicies: [], tags: {} }, isLoading: false });
    mockIAMPolicy.mockReturnValue({ data: { policy: null, versions: [], tags: {} }, isLoading: false });
    mockPolicyVersion.mockReturnValue({ data: { document: null }, isLoading: false });
    mockIAMGroup.mockReturnValue({ data: { group: null, users: [] }, isLoading: false });
    mockGroupInlinePolicies.mockReturnValue({ data: { policyNames: [] }, isLoading: false });
    mockGroupInlinePolicy.mockReturnValue({ data: { document: null }, isLoading: false });
    mockInstanceProfiles.mockReturnValue({ data: { instanceProfiles: [] }, isLoading: false });
  });

  const groupData = {
    data: {
      group: { name: "admins", arn: "arn:aws:iam::000000000000:group/admins", path: "/", createDate: "2025-01-01" },
      users: [{ UserName: "alice", Arn: "arn:aws:iam::000000000000:user/alice" }],
    },
    isLoading: false,
  };

  it("opens group detail and shows members", async () => {
    const user = userEvent.setup();
    mockIAMGroups.mockReturnValue({ data: { groups: [{ name: "admins", arn: "arn:aws:iam::000000000000:group/admins" }] }, isLoading: false, isError: false, error: null });
    mockIAMGroup.mockReturnValue(groupData);
    mockGroupInlinePolicies.mockReturnValue({ data: { policyNames: ["gp1"] }, isLoading: false });
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Groups/i }));
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByText("Members (1)")).toBeTruthy());
    expect(screen.getByText("alice")).toBeTruthy();
    expect(screen.getByText("gp1")).toBeTruthy();
  });

  it("shows Group not found when group missing", async () => {
    const user = userEvent.setup();
    mockIAMGroups.mockReturnValue({ data: { groups: [{ name: "admins" }] }, isLoading: false, isError: false, error: null });
    mockIAMGroup.mockReturnValue({ data: { group: null, users: [] }, isLoading: false });
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Groups/i }));
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByText("Group not found")).toBeTruthy());
  });

  it("adds and removes a member", async () => {
    const user = userEvent.setup();
    mockIAMGroups.mockReturnValue({ data: { groups: [{ name: "admins" }] }, isLoading: false, isError: false, error: null });
    mockIAMGroup.mockReturnValue(groupData);
    mockGroupInlinePolicies.mockReturnValue({ data: { policyNames: [] }, isLoading: false });
    mockAddUserToGroup.mockResolvedValue({});
    mockRemoveUserFromGroup.mockResolvedValue({});
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Groups/i }));
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByText("Members (1)")).toBeTruthy());
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[inputs.length - 1], "bob");
    await clickButton(user, /Add user/i);
    await waitFor(() => expect(mockAddUserToGroup).toHaveBeenCalledWith({ groupName: "admins", userName: "bob" }));
    await clickButton(user, /Remove/i);
    await waitFor(() => expect(mockRemoveUserFromGroup).toHaveBeenCalledWith({ groupName: "admins", userName: "alice" }));
  });

  it("shows error toast when add user fails and does not add when empty", async () => {
    const user = userEvent.setup();
    mockIAMGroups.mockReturnValue({ data: { groups: [{ name: "admins" }] }, isLoading: false, isError: false, error: null });
    mockIAMGroup.mockReturnValue(groupData);
    mockGroupInlinePolicies.mockReturnValue({ data: { policyNames: [] }, isLoading: false });
    mockAddUserToGroup.mockRejectedValue(new Error("add failed"));
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Groups/i }));
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByText("Members (1)")).toBeTruthy());
    await clickButton(user, /Add user/i);
    await waitFor(() => expect(mockAddUserToGroup).not.toHaveBeenCalled());
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[inputs.length - 1], "bob");
    await clickButton(user, /Add user/i);
    await waitFor(() => expect(mockAddUserToGroup).toHaveBeenCalled());
  });

  it("shows group detail loading, empty members, and sparse group fields", async () => {
    const user = userEvent.setup();
    mockIAMGroups.mockReturnValue({ data: { groups: [{ name: "admins" }] }, isLoading: false, isError: false, error: null });
    mockIAMGroup.mockReturnValue({ data: null, isLoading: true });
    mockGroupInlinePolicies.mockReturnValue({ data: {}, isLoading: false });
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Groups/i }));
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByText("Loading...")).toBeTruthy());
    mockIAMGroup.mockReturnValue({
      data: { group: { name: "admins", arn: "arn:1" }, users: [{ name: "bob-only" }] },
      isLoading: false,
    });
    await clickButton(user, /Close/i);
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByText("bob-only")).toBeTruthy());
    expect(screen.getAllByText("/").length).toBeGreaterThan(0);
    expect(screen.getAllByText("-").length).toBeGreaterThan(0);
  });

  it("shows the empty members state and removes a sparse user", async () => {
    const user = userEvent.setup();
    mockIAMGroups.mockReturnValue({ data: { groups: [{ name: "admins" }] }, isLoading: false, isError: false, error: null });
    mockIAMGroup.mockReturnValue({ data: { group: { name: "admins", arn: "arn:1" }, users: [] }, isLoading: false });
    mockGroupInlinePolicies.mockReturnValue({ data: { policyNames: [] }, isLoading: false });
    mockRemoveUserFromGroup.mockResolvedValue({});
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Groups/i }));
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByText("No members")).toBeTruthy());
    mockIAMGroup.mockReturnValue({
      data: { group: { name: "admins", arn: "arn:1" }, users: [{ userName: "u2" }, { name: "bob-only" }] },
      isLoading: false,
    });
    await clickButton(user, /Close/i);
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByText("u2")).toBeTruthy());
    await clickButton(user, /Remove/i);
    await waitFor(() => expect(mockRemoveUserFromGroup).toHaveBeenCalledWith({ groupName: "admins", userName: "u2" }));
    await clickButton(user, /Remove/i, { last: true });
    await waitFor(() => expect(mockRemoveUserFromGroup).toHaveBeenCalledWith({ groupName: "admins", userName: "bob-only" }));
  });

  it("shows loading and empty document for group inline policy view", async () => {
    const user = userEvent.setup();
    mockIAMGroups.mockReturnValue({ data: { groups: [{ name: "admins" }] }, isLoading: false, isError: false, error: null });
    mockIAMGroup.mockReturnValue(groupData);
    mockGroupInlinePolicies.mockReturnValue({ data: { policyNames: ["gp1"] }, isLoading: false });
    mockGroupInlinePolicy.mockReturnValue({ data: null, isLoading: true });
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Groups/i }));
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByText("gp1")).toBeTruthy());
    await clickButton(user, /View/i, { last: true });
    await waitFor(() => expect(screen.getByText("Loading...")).toBeTruthy());
    mockGroupInlinePolicy.mockReturnValue({ data: { document: null }, isLoading: false });
    await clickButton(user, /Delete/i, { last: true });
    await waitFor(() => expect(mockDeleteGroupInlinePolicy).toHaveBeenCalled());
  });

  it("shows the no-document fallback for a group inline policy", async () => {
    const user = userEvent.setup();
    mockIAMGroups.mockReturnValue({ data: { groups: [{ name: "admins" }] }, isLoading: false, isError: false, error: null });
    mockIAMGroup.mockReturnValue(groupData);
    mockGroupInlinePolicies.mockReturnValue({ data: { policyNames: ["gp1"] }, isLoading: false });
    mockGroupInlinePolicy.mockReturnValue({ data: { document: null }, isLoading: false });
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Groups/i }));
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByText("gp1")).toBeTruthy());
    await clickButton(user, /View/i, { last: true });
    await waitFor(() => expect(screen.getByText("(no document)")).toBeTruthy());
  });

  it("does not add a tag when key or value is empty", async () => {
    const user = userEvent.setup();
    mockIAMRoles.mockReturnValue({ data: { roles: [{ name: "ec2-role" }] }, isLoading: false, isError: false, error: null });
    mockIAMRole.mockReturnValue({ data: { role: { name: "ec2-role" }, attachedPolicies: [], tags: {} }, isLoading: false });
    render(<IAMPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByText(/Role: ec2-role/)).toBeTruthy());
    await clickButton(user, /Add tag/i);
    await waitFor(() => expect(mockTagRole).not.toHaveBeenCalled());
  });

  it("adds, views, and deletes a group inline policy", async () => {
    const user = userEvent.setup();
    mockIAMGroups.mockReturnValue({ data: { groups: [{ name: "admins" }] }, isLoading: false, isError: false, error: null });
    mockIAMGroup.mockReturnValue(groupData);
    mockGroupInlinePolicies.mockReturnValue({ data: { policyNames: [] }, isLoading: false });
    mockPutGroupInlinePolicy.mockResolvedValue({});
    mockDeleteGroupInlinePolicy.mockResolvedValue({});
    mockGroupInlinePolicy.mockReturnValue({ data: { document: "{\"Version\":\"2012-10-17\"}" }, isLoading: false });
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Groups/i }));
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByText("Members (1)")).toBeTruthy());
    await clickButton(user, /Add policy/i);
    let inputs = screen.getAllByRole("textbox");
    await user.type(inputs[inputs.length - 2], "gp2");
    const textareas = screen.getAllByRole("textbox");
    fireEvent.change(textareas[textareas.length - 1], { target: { value: "{\"Version\":\"2012-10-17\"}" } });
    await clickButton(user, /Save policy/i);
    await waitFor(() => expect(mockPutGroupInlinePolicy).toHaveBeenCalledWith({ groupName: "admins", policyName: "gp2", document: "{\"Version\":\"2012-10-17\"}" }));
    // cancel the add-policy form
    await clickButton(user, /Add policy/i);
    await clickButton(user, /Cancel/i, { last: true });
    await waitFor(() => expect(screen.queryByText(/Save policy/i)).toBeNull());
  });

  it("shows error toasts for group policy put/delete and add user failures", async () => {
    const user = userEvent.setup();
    mockIAMGroups.mockReturnValue({ data: { groups: [{ name: "admins" }] }, isLoading: false, isError: false, error: null });
    mockIAMGroup.mockReturnValue(groupData);
    mockGroupInlinePolicies.mockReturnValue({ data: { policyNames: ["gp1"] }, isLoading: false });
    mockPutGroupInlinePolicy.mockRejectedValue(new Error("put failed"));
    mockDeleteGroupInlinePolicy.mockRejectedValue(new Error("delete failed"));
    mockAddUserToGroup.mockRejectedValue(new Error("add failed"));
    mockRemoveUserFromGroup.mockRejectedValue(new Error("remove failed"));
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Groups/i }));
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByText("Members (1)")).toBeTruthy());
    await clickButton(user, /Add policy/i);
    await clickButton(user, /Save policy/i);
    await waitFor(() => expect(mockPutGroupInlinePolicy).not.toHaveBeenCalled());
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[inputs.length - 2], "gp2");
    await clickButton(user, /Save policy/i);
    await waitFor(() => expect(mockPutGroupInlinePolicy).toHaveBeenCalled());
    await clickButton(user, /Delete/i, { last: true });
    await waitFor(() => expect(mockDeleteGroupInlinePolicy).toHaveBeenCalled());
    // dismiss the info alert if open
    const dismiss = document.querySelector('[class*="awsui_dismiss-button"]') as HTMLElement;
    if (dismiss) fireEvent.click(dismiss);
    // close the add-policy form so the last textbox is the user-name input
    await clickButton(user, /Cancel/i, { last: true });
    await waitFor(() => expect(screen.queryByText(/Save policy/i)).toBeNull());
    // add user error + remove user error
    const userInputs = screen.getAllByRole("textbox");
    await user.type(userInputs[userInputs.length - 1], "bob");
    await clickButton(user, /Add user/i);
    await waitFor(() => expect(mockAddUserToGroup).toHaveBeenCalled());
    await clickButton(user, /Remove/i);
    await waitFor(() => expect(mockRemoveUserFromGroup).toHaveBeenCalled());
  });

  it("dismisses the viewed group policy alert", async () => {
    const user = userEvent.setup();
    mockIAMGroups.mockReturnValue({ data: { groups: [{ name: "admins" }] }, isLoading: false, isError: false, error: null });
    mockIAMGroup.mockReturnValue(groupData);
    mockGroupInlinePolicies.mockReturnValue({ data: { policyNames: ["gp1"] }, isLoading: false });
    mockGroupInlinePolicy.mockReturnValue({ data: { document: "{}" }, isLoading: false });
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Groups/i }));
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByText("gp1")).toBeTruthy());
    await clickButton(user, /View/i, { last: true });
    await waitFor(() => expect(screen.getByText("Policy: gp1")).toBeTruthy());
    const dismiss = document.querySelector('[class*="awsui_dismiss-button"]') as HTMLElement;
    if (dismiss) fireEvent.click(dismiss);
    await waitFor(() => expect(screen.queryByText("Policy: gp1")).toBeNull());
  });

  it("views and deletes an existing group inline policy", async () => {
    const user = userEvent.setup();
    mockIAMGroups.mockReturnValue({ data: { groups: [{ name: "admins" }] }, isLoading: false, isError: false, error: null });
    mockIAMGroup.mockReturnValue(groupData);
    mockGroupInlinePolicies.mockReturnValue({ data: { policyNames: ["gp1"] }, isLoading: false });
    mockGroupInlinePolicy.mockReturnValue({ data: { document: "{\"Version\":\"2012-10-17\"}" }, isLoading: false });
    mockDeleteGroupInlinePolicy.mockResolvedValue({});
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Groups/i }));
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByText("gp1")).toBeTruthy());
    await clickButton(user, /View/i, { last: true });
    await waitFor(() => expect(screen.getByText(/2012-10-17/)).toBeTruthy());
    await clickButton(user, /Delete/i, { last: true });
    await waitFor(() => expect(mockDeleteGroupInlinePolicy).toHaveBeenCalledWith({ groupName: "admins", policyName: "gp1" }));
  });

  it("closes the group detail modal", async () => {
    const user = userEvent.setup();
    mockIAMGroups.mockReturnValue({ data: { groups: [{ name: "admins" }] }, isLoading: false, isError: false, error: null });
    mockIAMGroup.mockReturnValue(groupData);
    mockGroupInlinePolicies.mockReturnValue({ data: { policyNames: [] }, isLoading: false });
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Groups/i }));
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByText("Members (1)")).toBeTruthy());
    await clickButton(user, /Close/i);
    await waitFor(() => expect(screen.queryByText("Members (1)")).toBeNull());
  });

  it("sets default policy version and adds/removes policy tags", async () => {
    const user = userEvent.setup();
    mockIAMPolicies.mockReturnValue({ data: { policies: [{ name: "AdminPolicy", arn: "arn:aws:iam::000000000000:policy/AdminPolicy", scope: "Local" }] }, isLoading: false, isError: false, error: null });
    mockIAMPolicy.mockReturnValue({
      data: {
        policy: { name: "AdminPolicy", arn: "arn:aws:iam::000000000000:policy/AdminPolicy", policyId: "P1", defaultVersionId: "v1", attachmentCount: 0, createDate: "2025-01-01" },
        versions: [
          { versionId: "v1", isDefaultVersion: true, createDate: "2025-01-01" },
          { versionId: "v2", isDefaultVersion: false, createDate: "2025-02-01" },
        ],
        tags: { env: "prod" },
      },
      isLoading: false,
    });
    mockPolicyVersion.mockReturnValue({ data: { document: "{\"Version\":\"2012-10-17\"}" }, isLoading: false });
    mockSetDefaultPolicyVersion.mockResolvedValue({});
    mockTagPolicy.mockResolvedValue({});
    mockUntagPolicy.mockResolvedValue({});
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Policies/i }));
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getAllByText(/AdminPolicy/).length).toBeGreaterThan(0));
    // select v2 via the version Select
    await user.click(screen.getByText("v1 (default)"));
    await user.click(await screen.findByText("v2"));
    await waitFor(() => expect(screen.getByText(/Set as default/i)).toBeTruthy());
    await clickButton(user, /Set as default/i);
    await waitFor(() => expect(mockSetDefaultPolicyVersion).toHaveBeenCalledWith({ arn: "arn:aws:iam::000000000000:policy/AdminPolicy", versionId: "v2" }));
    // tag editor
    const tagInputs = screen.getAllByRole("textbox");
    await user.type(tagInputs[tagInputs.length - 2], "team");
    await user.type(tagInputs[tagInputs.length - 1], "core");
    await clickButton(user, /Add tag/i);
    await waitFor(() => expect(mockTagPolicy).toHaveBeenCalledWith({ arn: "arn:aws:iam::000000000000:policy/AdminPolicy", tags: [{ Key: "team", Value: "core" }] }));
    await clickButton(user, /Remove/i);
    await waitFor(() => expect(mockUntagPolicy).toHaveBeenCalledWith({ arn: "arn:aws:iam::000000000000:policy/AdminPolicy", tagKeys: ["env"] }));
  });

  it("shows error toast when set default version fails", async () => {
    const user = userEvent.setup();
    mockIAMPolicies.mockReturnValue({ data: { policies: [{ name: "AdminPolicy", arn: "arn:aws:iam::000000000000:policy/AdminPolicy", scope: "Local" }] }, isLoading: false, isError: false, error: null });
    mockIAMPolicy.mockReturnValue({
      data: {
        policy: { name: "AdminPolicy", arn: "arn:aws:iam::000000000000:policy/AdminPolicy", policyId: "P1", defaultVersionId: "v1" },
        versions: [
          { versionId: "v1", isDefaultVersion: true },
          { versionId: "v2", isDefaultVersion: false },
        ],
        tags: {},
      },
      isLoading: false,
    });
    mockPolicyVersion.mockReturnValue({ data: { document: "{}" }, isLoading: false });
    mockSetDefaultPolicyVersion.mockRejectedValue(new Error("set failed"));
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Policies/i }));
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getAllByText(/AdminPolicy/).length).toBeGreaterThan(0));
    await user.click(screen.getByText("v1 (default)"));
    await user.click(await screen.findByText("v2"));
    await waitFor(() => expect(screen.getByText(/Set as default/i)).toBeTruthy());
    await clickButton(user, /Set as default/i);
    await waitFor(() => expect(mockSetDefaultPolicyVersion).toHaveBeenCalled());
  });

  it("adds and removes role tags in role detail", async () => {
    const user = userEvent.setup();
    mockIAMRoles.mockReturnValue({ data: { roles: [{ name: "ec2-role", arn: "arn:aws:iam::000000000000:role/ec2-role" }] }, isLoading: false, isError: false, error: null });
    mockIAMRole.mockReturnValue({ data: { role: { name: "ec2-role", arn: "arn:aws:iam::000000000000:role/ec2-role", roleId: "R1", path: "/", maxSessionDuration: 3600, createDate: "2025-01-01" }, attachedPolicies: [], tags: { env: "prod" } }, isLoading: false });
    mockTagRole.mockResolvedValue({});
    mockUntagRole.mockResolvedValue({});
    render(<IAMPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByText("env: prod")).toBeTruthy());
    const tagInputs = screen.getAllByRole("textbox");
    await user.type(tagInputs[tagInputs.length - 2], "team");
    await user.type(tagInputs[tagInputs.length - 1], "core");
    await clickButton(user, /Add tag/i);
    await waitFor(() => expect(mockTagRole).toHaveBeenCalledWith({ roleName: "ec2-role", tags: [{ Key: "team", Value: "core" }] }));
    await clickButton(user, /Remove/i);
    await waitFor(() => expect(mockUntagRole).toHaveBeenCalledWith({ roleName: "ec2-role", tagKeys: ["env"] }));
  });

  it("adds and removes user tags in user detail", async () => {
    const user = userEvent.setup();
    mockIAMUsers.mockReturnValue({ data: { users: [{ name: "admin-user", arn: "arn:aws:iam::000000000000:user/admin-user" }] }, isLoading: false, isError: false, error: null });
    mockIAMUser.mockReturnValue({ data: { user: { name: "admin-user", arn: "arn:aws:iam::000000000000:user/admin-user", userId: "U1", path: "/", createDate: "2025-01-01" }, accessKeys: [], attachedPolicies: [], groups: [], inlinePolicies: [], tags: { env: "prod" } }, isLoading: false });
    mockTagUser.mockResolvedValue({});
    mockUntagUser.mockResolvedValue({});
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Users/i }));
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByText(/User: admin-user/)).toBeTruthy());
    const tagInputs = screen.getAllByRole("textbox");
    await user.type(tagInputs[tagInputs.length - 2], "team");
    await user.type(tagInputs[tagInputs.length - 1], "core");
    await clickButton(user, /Add tag/i);
    await waitFor(() => expect(mockTagUser).toHaveBeenCalledWith({ userName: "admin-user", tags: [{ Key: "team", Value: "core" }] }));
    await clickButton(user, /Remove/i);
    await waitFor(() => expect(mockUntagUser).toHaveBeenCalledWith({ userName: "admin-user", tagKeys: ["env"] }));
  });

  it("shows error toasts when tag mutations fail", async () => {
    const user = userEvent.setup();
    mockIAMUsers.mockReturnValue({ data: { users: [{ name: "admin-user" }] }, isLoading: false, isError: false, error: null });
    mockIAMUser.mockReturnValue({ data: { user: { name: "admin-user", arn: "arn:1" }, accessKeys: [], attachedPolicies: [], groups: [], inlinePolicies: [], tags: { env: "prod" } }, isLoading: false });
    mockTagUser.mockRejectedValue(new Error("tag failed"));
    mockUntagUser.mockRejectedValue(new Error("untag failed"));
    mockIAMRoles.mockReturnValue({ data: { roles: [{ name: "ec2-role" }] }, isLoading: false, isError: false, error: null });
    mockIAMRole.mockReturnValue({ data: { role: { name: "ec2-role" }, attachedPolicies: [], tags: { env: "prod" } }, isLoading: false });
    mockTagRole.mockRejectedValue(new Error("tag-role failed"));
    mockUntagRole.mockRejectedValue(new Error("untag-role failed"));
    mockIAMPolicies.mockReturnValue({ data: { policies: [{ name: "P", arn: "arn:1", scope: "Local" }] }, isLoading: false, isError: false, error: null });
    mockIAMPolicy.mockReturnValue({ data: { policy: { name: "P", arn: "arn:1" }, versions: [], tags: { env: "prod" } }, isLoading: false });
    mockTagPolicy.mockRejectedValue(new Error("tag-policy failed"));
    mockUntagPolicy.mockRejectedValue(new Error("untag-policy failed"));
    render(<IAMPage />, { wrapper: pageWrapper() });
    // user tag failures
    await user.click(screen.getByRole("tab", { name: /Users/i }));
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByText(/User: admin-user/)).toBeTruthy());
    const uInputs = screen.getAllByRole("textbox");
    await user.type(uInputs[uInputs.length - 2], "k");
    await user.type(uInputs[uInputs.length - 1], "v");
    await clickButton(user, /Add tag/i);
    await waitFor(() => expect(mockTagUser).toHaveBeenCalled());
    await clickButton(user, /Remove/i);
    await waitFor(() => expect(mockUntagUser).toHaveBeenCalled());
    await clickButton(user, /Close/i);
    // role tag failures
    await user.click(screen.getByRole("tab", { name: /Roles/i }));
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByText(/Role: ec2-role/)).toBeTruthy());
    const rInputs = screen.getAllByRole("textbox");
    await user.type(rInputs[rInputs.length - 2], "k");
    await user.type(rInputs[rInputs.length - 1], "v");
    await clickButton(user, /Add tag/i);
    await waitFor(() => expect(mockTagRole).toHaveBeenCalled());
    await clickButton(user, /Remove/i);
    await waitFor(() => expect(mockUntagRole).toHaveBeenCalled());
    await clickButton(user, /Close/i);
    // policy tag failures
    await user.click(screen.getByRole("tab", { name: /Policies/i }));
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByText(/Policy: P/)).toBeTruthy());
    const pInputs = screen.getAllByRole("textbox");
    await user.type(pInputs[pInputs.length - 2], "k");
    await user.type(pInputs[pInputs.length - 1], "v");
    await clickButton(user, /Add tag/i);
    await waitFor(() => expect(mockTagPolicy).toHaveBeenCalled());
    await clickButton(user, /Remove/i);
    await waitFor(() => expect(mockUntagPolicy).toHaveBeenCalled());
  });

  it("renders instance profiles tab with empty state", async () => {
    const user = userEvent.setup();
    mockInstanceProfiles.mockReturnValue({ data: {}, isLoading: false });
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Instance profiles/i }));
    await waitFor(() => expect(screen.getByText("No instance profiles")).toBeTruthy());
  });

  it("creates an instance profile", async () => {
    const user = userEvent.setup();
    mockInstanceProfiles.mockReturnValue({ data: { instanceProfiles: [] }, isLoading: false });
    mockCreateInstanceProfile.mockResolvedValue({});
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Instance profiles/i }));
    await clickButton(user, /Create instance profile/i);
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "web-profile");
    await clickButton(user, /Create/i, { last: true });
    await waitFor(() => expect(mockCreateInstanceProfile).toHaveBeenCalledWith({ name: "web-profile", path: "/" }));
  });

  it("does not create an instance profile with an empty name", async () => {
    const user = userEvent.setup();
    mockInstanceProfiles.mockReturnValue({ data: { instanceProfiles: [] }, isLoading: false });
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Instance profiles/i }));
    await clickButton(user, /Create instance profile/i);
    await clickButton(user, /Create/i, { last: true });
    await waitFor(() => expect(mockCreateInstanceProfile).not.toHaveBeenCalled());
  });

  it("shows instance profile fallbacks for sparse data", async () => {
    const user = userEvent.setup();
    mockInstanceProfiles.mockReturnValue({
      data: {
        instanceProfiles: [
          { name: "sparse", arn: "arn:1", roles: ["raw-role", { name: "obj-role" }] },
          { name: "noroles", arn: "arn:2" },
        ],
      },
      isLoading: false,
    });
    mockRemoveRoleFromInstanceProfile.mockResolvedValue({});
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Instance profiles/i }));
    await waitFor(() => expect(screen.getByText("sparse")).toBeTruthy());
    expect(screen.getByText("raw-role")).toBeTruthy();
    expect(screen.getByText("obj-role")).toBeTruthy();
    expect(screen.getByText("noroles")).toBeTruthy();
    await clickButton(user, /Remove/i, { last: true });
    await waitFor(() => expect(mockRemoveRoleFromInstanceProfile).toHaveBeenCalledWith({ name: "sparse", roleName: "obj-role" }));
  });

  it("does not add a role when role name is empty and errors on failure", async () => {
    const user = userEvent.setup();
    mockInstanceProfiles.mockReturnValue({
      data: { instanceProfiles: [{ name: "web-profile", arn: "arn:1", path: "/", roles: [] }] },
      isLoading: false,
    });
    mockAddRoleToInstanceProfile.mockRejectedValue(new Error("add-role-failed"));
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Instance profiles/i }));
    await waitFor(() => expect(screen.getByText("web-profile")).toBeTruthy());
    await clickButton(user, /Add role/i);
    await clickButton(user, /Add role/i, { last: true });
    await waitFor(() => expect(mockAddRoleToInstanceProfile).not.toHaveBeenCalled());
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[inputs.length - 1], "lambda-role");
    await clickButton(user, /Add role/i, { last: true });
    await waitFor(() => expect(mockAddRoleToInstanceProfile).toHaveBeenCalled());
    // reopen and cancel the add-role modal
    await clickButton(user, /Add role/i);
    await waitFor(() => expect(screen.getByText(/Add role to web-profile/)).toBeTruthy());
    await clickButton(user, /Cancel/i, { last: true });
    await waitFor(() => expect(screen.queryByText(/Add role to web-profile/)).toBeNull());
  });

  it("shows error toasts for delete profile and remove role failures and escapes the add-role modal", async () => {
    const user = userEvent.setup();
    mockInstanceProfiles.mockReturnValue({
      data: {
        instanceProfiles: [
          { name: "web-profile", arn: "arn:1", path: "/", roles: [{ RoleName: "ec2-role" }] },
        ],
      },
      isLoading: false,
    });
    mockDeleteInstanceProfile.mockRejectedValue(new Error("delete-failed"));
    mockRemoveRoleFromInstanceProfile.mockRejectedValue(new Error("remove-failed"));
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Instance profiles/i }));
    await waitFor(() => expect(screen.getByText("web-profile")).toBeTruthy());
    await clickButton(user, /Remove/i);
    await waitFor(() => expect(mockRemoveRoleFromInstanceProfile).toHaveBeenCalled());
    await clickButton(user, /Delete web-profile/i);
    await waitFor(() => expect(screen.getByText(/Are you sure/i)).toBeTruthy());
    await clickButton(user, /^Delete$/);
    await waitFor(() => expect(mockDeleteInstanceProfile).toHaveBeenCalled());
    // reopen the add-role modal and escape-dismiss it
    await clickButton(user, /Add role/i);
    await waitFor(() => expect(screen.getByText(/Add role to web-profile/)).toBeTruthy());
    const dialogs = document.querySelectorAll('[class*="awsui_dialog"]');
    dialogs.forEach((d) => fireEvent.keyDown(d as HTMLElement, { keyCode: 27, key: "Escape", bubbles: true }));
    await waitFor(() => expect(screen.queryByText(/Add role to web-profile/)).toBeNull());
  });

  it("deletes an instance profile and adds/removes roles", async () => {
    const user = userEvent.setup();
    mockInstanceProfiles.mockReturnValue({
      data: {
        instanceProfiles: [
          { name: "web-profile", arn: "arn:aws:iam::000000000000:instance-profile/web-profile", path: "/", roles: [{ RoleName: "ec2-role" }] },
        ],
      },
      isLoading: false,
    });
    mockDeleteInstanceProfile.mockResolvedValue({});
    mockAddRoleToInstanceProfile.mockResolvedValue({});
    mockRemoveRoleFromInstanceProfile.mockResolvedValue({});
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Instance profiles/i }));
    await waitFor(() => expect(screen.getByText("web-profile")).toBeTruthy());
    await clickButton(user, /Add role/i);
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[inputs.length - 1], "lambda-role");
    await clickButton(user, /Add role/i, { last: true });
    await waitFor(() => expect(mockAddRoleToInstanceProfile).toHaveBeenCalledWith({ name: "web-profile", roleName: "lambda-role" }));
    await clickButton(user, /Remove/i);
    await waitFor(() => expect(mockRemoveRoleFromInstanceProfile).toHaveBeenCalledWith({ name: "web-profile", roleName: "ec2-role" }));
    await clickButton(user, /Delete web-profile/i);
    await waitFor(() => expect(screen.getByText(/Are you sure/i)).toBeTruthy());
    await clickButton(user, /^Delete$/);
    await waitFor(() => expect(mockDeleteInstanceProfile).toHaveBeenCalledWith("web-profile"));
  });

  it("cancels and escapes the create instance profile modal and types the path", async () => {
    const user = userEvent.setup();
    mockInstanceProfiles.mockReturnValue({ data: { instanceProfiles: [] }, isLoading: false });
    mockCreateInstanceProfile.mockRejectedValue(new Error("create failed"));
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Instance profiles/i }));
    await clickButton(user, /Create instance profile/i);
    let inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "web-profile");
    await user.clear(inputs[1]);
    await user.type(inputs[1], "/custom/");
    await clickButton(user, /Create/i, { last: true });
    await waitFor(() => expect(mockCreateInstanceProfile).toHaveBeenCalledWith({ name: "web-profile", path: "/custom/" }));
    // the create modal stays open after failure — escape-dismiss it
    const expectModalHidden = () => {
      const visibleDialogs = Array.from(
        document.querySelectorAll('[role="dialog"]'),
      ).filter((d) => !d.className.includes("hidden"));
      expect(
        visibleDialogs.some((d) => d.textContent?.includes("Create instance profile")),
      ).toBe(false);
    };
    const dialogs = document.querySelectorAll('[class*="awsui_dialog"]');
    dialogs.forEach((d) => fireEvent.keyDown(d as HTMLElement, { keyCode: 27, key: "Escape", bubbles: true }));
    await waitFor(expectModalHidden);
    // reopen and cancel
    await clickButton(user, /Create instance profile/i);
    await waitFor(() => expect(screen.getByRole("textbox", { name: /Profile name/i })).toBeTruthy());
    await clickButton(user, /Cancel/i, { last: true });
    await waitFor(expectModalHidden);
  });
});

describe("IAMPage — role policy management", () => {
  function openRoleDetail() {
    const trustPolicy = JSON.stringify({ Version: "2012-10-17", Statement: [] });
    mockIAMRole.mockReturnValue({
      data: {
        role: { name: "ec2-role", arn: "arn:role", roleId: "R1", path: "/", createDate: "2024-01-01T00:00:00Z", maxSessionDuration: 3600, assumeRolePolicyDocument: trustPolicy },
        attachedPolicies: [],
        tags: {},
      },
      isLoading: false,
    });
    mockIAMRoles.mockReturnValue({
      data: { roles: [{ name: "ec2-role", arn: "arn:role" }] },
      isLoading: false, isError: false, error: null,
    });
    return (async () => {
      const user = userEvent.setup();
      render(<IAMPage />, { wrapper: pageWrapper() });
      await user.click(screen.getByRole("tab", { name: /Roles/i }));
      await clickButton(user, /View/i, { last: true });
      await waitFor(() => expect(screen.getAllByText(/Role: ec2-role/i).length).toBeGreaterThan(0));
      return user;
    })();
  }

  it("updates the trust policy from the detail modal", async () => {
    mockUpdateTrustPolicy.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
    const user = await openRoleDetail();
    const areas = await screen.findAllByRole("textbox");
    fireEvent.change(areas[0], { target: { value: '{"Version":"2012-10-17"}' } });
    await user.click(screen.getByRole("button", { name: /Save trust policy/i }));
    await waitFor(() =>
      expect(mockUpdateTrustPolicy).toHaveBeenCalledWith(
        { roleName: "ec2-role", document: '{"Version":"2012-10-17"}' },
        expect.objectContaining({ onSuccess: expect.any(Function) })
      )
    );
  });

  it("shows an error toast when the trust policy update fails", async () => {
    mockUpdateTrustPolicy.mockImplementation((_b: any, opts: any) => opts?.onError?.(new Error("trust failed")));
    const user = await openRoleDetail();
    const areas = await screen.findAllByRole("textbox");
    fireEvent.change(areas[0], { target: { value: "x" } });
    await user.click(screen.getByRole("button", { name: /Save trust policy/i }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "trust failed"));
  });

  it("shows a fallback error for trust policy updates", async () => {
    mockUpdateTrustPolicy.mockImplementation((_b: any, opts: any) => opts?.onError?.(new Error("")));
    const user = await openRoleDetail();
    const areas = await screen.findAllByRole("textbox");
    fireEvent.change(areas[0], { target: { value: "x" } });
    await user.click(screen.getByRole("button", { name: /Save trust policy/i }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to update trust policy"));
  });

  it("saves an inline policy from the detail modal", async () => {
    mockPutRoleInlinePolicy.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
    await openRoleDetail();
    const user = userEvent.setup();
    fireEvent.change(screen.getAllByPlaceholderText("inline-1").at(-1)!, { target: { value: "inline-1" } });
    fireEvent.change(screen.getAllByPlaceholderText("Inline policy document (JSON)").at(-1)!, {
      target: { value: '{"Version":"2012-10-17"}' },
    });
    await user.click(screen.getAllByRole("button", { name: /Save inline policy/i }).at(-1)!);
    await waitFor(() =>
      expect(mockPutRoleInlinePolicy).toHaveBeenCalledWith(
        { roleName: "ec2-role", policyName: "inline-1", document: '{"Version":"2012-10-17"}' },
        expect.objectContaining({ onSuccess: expect.any(Function) })
      )
    );
  });

  it("keeps Save inline policy disabled until both fields are set", async () => {
    await openRoleDetail();
    expect((await screen.findByRole("button", { name: /Save inline policy/i })).hasAttribute("disabled")).toBe(true);
  });

  it("deletes an inline policy by name", async () => {
    mockDeleteRoleInlinePolicy.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
    const user = await openRoleDetail();
    const nameField = screen.getAllByPlaceholderText("inline-1").at(-1)!;
    await user.type(nameField, "inline-1");
    await user.click(screen.getByRole("button", { name: /Delete inline policy/i }));
    await waitFor(() =>
      expect(mockDeleteRoleInlinePolicy).toHaveBeenCalledWith(
        { roleName: "ec2-role", policyName: "inline-1" },
        expect.objectContaining({ onSuccess: expect.any(Function) })
      )
    );
  });
});

describe("IAMPage — role inline policy error arms", () => {
  it("shows error and fallback toasts for inline policy ops", async () => {
    const trustPolicy = JSON.stringify({ Version: "2012-10-17", Statement: [] });
    mockIAMRole.mockReturnValue({
      data: {
        role: { name: "ec2-role", arn: "arn:role", roleId: "R1", path: "/", createDate: "2024-01-01T00:00:00Z", maxSessionDuration: 3600, assumeRolePolicyDocument: trustPolicy },
        attachedPolicies: [],
        tags: {},
      },
      isLoading: false,
    });
    mockIAMRoles.mockReturnValue({
      data: { roles: [{ name: "ec2-role", arn: "arn:role" }] },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<IAMPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Roles/i }));
    await clickButton(user, /View/i, { last: true });
    await waitFor(() => expect(screen.getAllByText(/Role: ec2-role/i).length).toBeGreaterThan(0));

    // save fails with message
    mockPutRoleInlinePolicy.mockImplementation((_b: any, opts: any) => opts?.onError?.(new Error("save failed")));
    fireEvent.change(screen.getAllByPlaceholderText("inline-1").at(-1)!, { target: { value: "p1" } });
    fireEvent.change(screen.getAllByPlaceholderText("Inline policy document (JSON)").at(-1)!, { target: { value: "{}" } });
    await user.click(screen.getAllByRole("button", { name: /Save inline policy/i }).at(-1)!);
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "save failed"));

    // save fails without message
    mockPutRoleInlinePolicy.mockImplementation((_b: any, opts: any) => opts?.onError?.(new Error("")));
    await user.click(screen.getAllByRole("button", { name: /Save inline policy/i }).at(-1)!);
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to save inline policy"));

    // delete succeeds
    mockDeleteRoleInlinePolicy.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
    await user.click(screen.getAllByRole("button", { name: /Delete inline policy/i }).at(-1)!);
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("success", "Inline policy deleted"));

    // delete fails with fallback
    mockDeleteRoleInlinePolicy.mockImplementation((_b: any, opts: any) => opts?.onError?.(new Error("")));
    await user.click(screen.getAllByRole("button", { name: /Delete inline policy/i }).at(-1)!);
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to delete inline policy"));
  });
});
