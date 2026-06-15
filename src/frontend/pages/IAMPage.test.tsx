// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../test/helpers";
import React from "react";

const mockIAMUsers = vi.fn();
const mockIAMUser = vi.fn();
const mockCreateUserMutate = vi.fn();
const mockDeleteUser = vi.fn();
const mockIAMRoles = vi.fn();
const mockIAMRole = vi.fn();
const mockCreateRoleMutate = vi.fn();
const mockDeleteRole = vi.fn();
const mockIAMGroups = vi.fn();
const mockCreateGroup = vi.fn();
const mockDeleteGroup = vi.fn();
const mockIAMPolicies = vi.fn();
const mockIAMPolicy = vi.fn();
const mockPolicyVersion = vi.fn();
const mockCreatePolicyMutate = vi.fn();
const mockDeletePolicy = vi.fn();
const mockCreateAccessKey = vi.fn();
const mockInstanceProfiles = vi.fn();

vi.mock("../hooks/useIAM", () => ({
  useIAMUsers: (...args: any[]) => mockIAMUsers(...args),
  useIAMUser: (...args: any[]) => mockIAMUser(...args),
  useCreateUser: () => ({ mutateAsync: mockCreateUserMutate, isPending: false }),
  useDeleteUser: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useIAMRoles: (...args: any[]) => mockIAMRoles(...args),
  useIAMRole: (...args: any[]) => mockIAMRole(...args),
  useCreateRole: () => ({ mutateAsync: mockCreateRoleMutate, isPending: false }),
  useDeleteRole: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useIAMGroups: (...args: any[]) => mockIAMGroups(...args),
  useCreateGroup: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteGroup: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useIAMPolicies: (...args: any[]) => mockIAMPolicies(...args),
  useIAMPolicy: (...args: any[]) => mockIAMPolicy(...args),
  usePolicyVersion: (...args: any[]) => mockPolicyVersion(...args),
  useCreatePolicy: () => ({ mutateAsync: mockCreatePolicyMutate, isPending: false }),
  useDeletePolicy: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCreateAccessKey: () => ({ mutateAsync: vi.fn(), isPending: false }),
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

  // ─── Interaction Tests ──────────────────────────────────

  it("opens create role modal and submits", async () => {
    const user = userEvent.setup();
    render(<IAMPage />, { wrapper: createWrapper() });
    await clickButton(user, /Create role/i);
    await waitFor(() => {
      // Modal should show the default trust policy textarea
      expect(screen.getByText(/AssumeRolePolicyDocument/i)).toBeTruthy();
    });
    // Fill role name
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "test-role");
    await clickButton(user, /Create/i, { last: true });
    expect(mockCreateRoleMutate).toHaveBeenCalled();
  });

  it("opens create user modal from users tab", async () => {
    const user = userEvent.setup();
    render(<IAMPage />, { wrapper: createWrapper() });
    // Switch to users tab
    await user.click(screen.getByText("Users"));
    await waitFor(() => {
      expect(screen.getAllByText("Users").length).toBeGreaterThan(0);
    });
    await clickButton(user, /Create user/i);
    await waitFor(() => {
      expect(screen.getByDisplayValue("/")).toBeTruthy();
    });
    // Fill user name
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "new-user");
    await clickButton(user, /Create/i, { last: true });
    expect(mockCreateUserMutate).toHaveBeenCalled();
  });
});
