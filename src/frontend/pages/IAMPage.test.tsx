// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const mockIAMUsers = vi.fn();
const mockIAMUser = vi.fn();
const mockCreateUser = vi.fn();
const mockDeleteUser = vi.fn();
const mockIAMRoles = vi.fn();
const mockIAMRole = vi.fn();
const mockCreateRole = vi.fn();
const mockDeleteRole = vi.fn();
const mockIAMGroups = vi.fn();
const mockCreateGroup = vi.fn();
const mockDeleteGroup = vi.fn();
const mockIAMPolicies = vi.fn();
const mockIAMPolicy = vi.fn();
const mockPolicyVersion = vi.fn();
const mockCreatePolicy = vi.fn();
const mockDeletePolicy = vi.fn();
const mockCreateAccessKey = vi.fn();
const mockInstanceProfiles = vi.fn();

vi.mock("../hooks/useIAM", () => ({
  useIAMUsers: (...args: any[]) => mockIAMUsers(...args),
  useIAMUser: (...args: any[]) => mockIAMUser(...args),
  useCreateUser: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteUser: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useIAMRoles: (...args: any[]) => mockIAMRoles(...args),
  useIAMRole: (...args: any[]) => mockIAMRole(...args),
  useCreateRole: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteRole: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useIAMGroups: (...args: any[]) => mockIAMGroups(...args),
  useCreateGroup: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteGroup: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useIAMPolicies: (...args: any[]) => mockIAMPolicies(...args),
  useIAMPolicy: (...args: any[]) => mockIAMPolicy(...args),
  usePolicyVersion: (...args: any[]) => mockPolicyVersion(...args),
  useCreatePolicy: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeletePolicy: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCreateAccessKey: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useInstanceProfiles: () => ({ data: { instanceProfiles: [] }, isLoading: false }),
}));

vi.mock("../components/Toast", () => ({
  useToast: () => ({ showToast: vi.fn() }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import IAMPage from "./IAMPage";

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
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
});
