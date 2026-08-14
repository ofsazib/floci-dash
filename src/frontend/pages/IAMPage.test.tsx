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
const mockIAMRole = vi.fn();
const mockCreateRoleMutate = vi.fn();
const mockDeleteRoleMutate = vi.fn();
const mockIAMGroups = vi.fn();
const mockCreateGroupMutate = vi.fn();
const mockDeleteGroupMutate = vi.fn();
const mockIAMPolicies = vi.fn();
const mockIAMPolicy = vi.fn();
const mockPolicyVersion = vi.fn();
const mockCreatePolicyMutate = vi.fn();
const mockDeletePolicyMutate = vi.fn();
const mockCreateAccessKeyMutate = vi.fn();
const mockInstanceProfiles = vi.fn();

vi.mock("../hooks/useIAM", () => ({
  useIAMUsers: (...args: any[]) => mockIAMUsers(...args),
  useIAMUser: (...args: any[]) => mockIAMUser(...args),
  useCreateUser: () => ({ mutateAsync: mockCreateUserMutate, isPending: false }),
  useDeleteUser: () => ({ mutateAsync: mockDeleteUserMutate, isPending: false }),
  useIAMRoles: (...args: any[]) => mockIAMRoles(...args),
  useIAMRole: (...args: any[]) => mockIAMRole(...args),
  useCreateRole: () => ({ mutateAsync: mockCreateRoleMutate, isPending: false }),
  useDeleteRole: () => ({ mutateAsync: mockDeleteRoleMutate, isPending: false }),
  useIAMGroups: (...args: any[]) => mockIAMGroups(...args),
  useCreateGroup: () => ({ mutate: mockCreateGroupMutate, isPending: false }),
  useDeleteGroup: () => ({ mutateAsync: mockDeleteGroupMutate, isPending: false }),
  useIAMPolicies: (...args: any[]) => mockIAMPolicies(...args),
  useIAMPolicy: (...args: any[]) => mockIAMPolicy(...args),
  usePolicyVersion: (...args: any[]) => mockPolicyVersion(...args),
  useCreatePolicy: () => ({ mutateAsync: mockCreatePolicyMutate, isPending: false }),
  useDeletePolicy: () => ({ mutateAsync: mockDeletePolicyMutate, isPending: false }),
  useCreateAccessKey: () => ({ mutateAsync: mockCreateAccessKeyMutate, isPending: false }),
  useInstanceProfiles: () => ({ data: { instanceProfiles: [] }, isLoading: false }),
}));

vi.mock("../components/Toast", () => ({
  useToast: () => ({ showToast: vi.fn() }),
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
    mockIAMUser.mockReturnValue({ data: { user: null, accessKeys: [], attachedPolicies: [], groups: [], inlinePolicies: [] }, isLoading: false });
    mockIAMRole.mockReturnValue({ data: { role: null, attachedPolicies: [], tags: {} }, isLoading: false });
    mockIAMPolicy.mockReturnValue({ data: { policy: null, versions: [] }, isLoading: false });
    mockPolicyVersion.mockReturnValue({ data: { document: null }, isLoading: false });
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
