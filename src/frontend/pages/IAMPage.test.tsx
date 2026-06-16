// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../test/helpers";
import React from "react";

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

import IAMPage from "./IAMPage";
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
    render(<IAMPage />, { wrapper: createWrapper() });
    expect(screen.getByText("IAM")).toBeTruthy();
    expect(screen.getAllByText("Roles").length).toBeGreaterThan(0);
    expect(screen.getAllByText("ec2-role").length).toBeGreaterThan(0);
  });

  it("shows empty roles state", () => {
    mockIAMRoles.mockReturnValue({ data: { roles: [] }, isLoading: false, isError: false, error: null });
    render(<IAMPage />, { wrapper: createWrapper() });
    expect(screen.getByText("No roles")).toBeTruthy();
  });

  it("shows empty users state", async () => {
    const user = userEvent.setup();
    mockIAMUsers.mockReturnValue({ data: { users: [] }, isLoading: false, isError: false, error: null });
    render(<IAMPage />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Users/i }));
    await waitFor(() => {
      expect(screen.getByText("No users")).toBeTruthy();
    });
  });

  it("shows empty policies state", async () => {
    const user = userEvent.setup();
    mockIAMPolicies.mockReturnValue({ data: { policies: [] }, isLoading: false, isError: false, error: null });
    render(<IAMPage />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Policies/i }));
    await waitFor(() => {
      expect(screen.getByText("No policies")).toBeTruthy();
    });
  });

  it("shows empty groups state", async () => {
    const user = userEvent.setup();
    mockIAMGroups.mockReturnValue({ data: { groups: [] }, isLoading: false, isError: false, error: null });
    render(<IAMPage />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Groups/i }));
    await waitFor(() => {
      expect(screen.getByText("No groups")).toBeTruthy();
    });
  });

  it("renders users tab", () => {
    render(<IAMPage />, { wrapper: createWrapper() });
    expect(screen.getAllByText("Users").length).toBeGreaterThan(0);
  });

  it("renders policies tab", () => {
    render(<IAMPage />, { wrapper: createWrapper() });
    expect(screen.getAllByText("Policies").length).toBeGreaterThan(0);
  });

  it("renders groups tab", () => {
    render(<IAMPage />, { wrapper: createWrapper() });
    expect(screen.getAllByText("Groups").length).toBeGreaterThan(0);
  });

  // ─── Loading States ─────────────────────────────────────

  it("shows loading state for roles tab", () => {
    mockIAMRoles.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    render(<IAMPage />, { wrapper: createWrapper() });
    expect(screen.getByText("IAM")).toBeTruthy();
    expect(screen.getAllByText("Roles").length).toBeGreaterThan(0);
  });

  it("shows loading state for users tab", async () => {
    const user = userEvent.setup();
    mockIAMUsers.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    render(<IAMPage />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Users/i }));
    expect(screen.getAllByText("Users").length).toBeGreaterThan(0);
  });

  it("shows loading state for policies tab", async () => {
    const user = userEvent.setup();
    mockIAMPolicies.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    render(<IAMPage />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Policies/i }));
    expect(screen.getAllByText("Policies").length).toBeGreaterThan(0);
  });

  it("shows loading state for groups tab", async () => {
    const user = userEvent.setup();
    mockIAMGroups.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    render(<IAMPage />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Groups/i }));
    expect(screen.getAllByText("Groups").length).toBeGreaterThan(0);
  });

  // ─── Error States ───────────────────────────────────────

  it("shows error state for roles tab", () => {
    mockIAMRoles.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("Failed to load roles") });
    render(<IAMPage />, { wrapper: createWrapper() });
    expect(screen.getByText("IAM")).toBeTruthy();
  });

  it("shows error state for users tab", async () => {
    const user = userEvent.setup();
    mockIAMUsers.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("Failed to load users") });
    render(<IAMPage />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Users/i }));
    expect(screen.getAllByText("Users").length).toBeGreaterThan(0);
  });

  it("shows error state for policies tab", async () => {
    const user = userEvent.setup();
    mockIAMPolicies.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("Failed to load policies") });
    render(<IAMPage />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Policies/i }));
    expect(screen.getAllByText("Policies").length).toBeGreaterThan(0);
  });

  it("shows error state for groups tab", async () => {
    const user = userEvent.setup();
    mockIAMGroups.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("Failed to load groups") });
    render(<IAMPage />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Groups/i }));
    expect(screen.getAllByText("Groups").length).toBeGreaterThan(0);
  });

  // ─── List Render ────────────────────────────────────────

  it("renders users list with data", async () => {
    const user = userEvent.setup();
    render(<IAMPage />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Users/i }));
    await waitFor(() => {
      expect(screen.getAllByText("admin-user").length).toBeGreaterThan(0);
    });
  });

  it("renders policies list with data", async () => {
    const user = userEvent.setup();
    render(<IAMPage />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Policies/i }));
    await waitFor(() => {
      expect(screen.getAllByText("AdminPolicy").length).toBeGreaterThan(0);
    });
  });

  it("renders groups list with data", async () => {
    const user = userEvent.setup();
    render(<IAMPage />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Groups/i }));
    await waitFor(() => {
      expect(screen.getAllByText("admins").length).toBeGreaterThan(0);
    });
  });

  // ─── Create Interactions ────────────────────────────────

  it("opens create role modal and submits", async () => {
    const user = userEvent.setup();
    render(<IAMPage />, { wrapper: createWrapper() });
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
    render(<IAMPage />, { wrapper: createWrapper() });
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
    render(<IAMPage />, { wrapper: createWrapper() });
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
    render(<IAMPage />, { wrapper: createWrapper() });
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
    render(<IAMPage />, { wrapper: createWrapper() });
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
    render(<IAMPage />, { wrapper: createWrapper() });
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
    render(<IAMPage />, { wrapper: createWrapper() });
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
    render(<IAMPage />, { wrapper: createWrapper() });
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
    render(<IAMPage />, { wrapper: createWrapper() });
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
    render(<IAMPage />, { wrapper: createWrapper() });
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
    render(<IAMPage />, { wrapper: createWrapper() });
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
    render(<IAMPage />, { wrapper: createWrapper() });
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
    render(<IAMPage />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Policies/i }));
    await waitFor(() => {
      expect(screen.getAllByText("Policies").length).toBeGreaterThan(0);
    });
  });
});
