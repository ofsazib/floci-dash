// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createWrapper } from "../../../test/helpers";
import React from "react";

// ─── Mock hooks ─────────────────────────────────────────

const mockOrg = vi.fn();
const mockCreateOrg = vi.fn();
const mockDeleteOrg = vi.fn();
const mockRoots = vi.fn();
const mockOUs = vi.fn();
const mockCreateOU = vi.fn();
const mockDeleteOU = vi.fn();
const mockAccounts = vi.fn();
const mockCreateAccount = vi.fn();
const mockCloseAccount = vi.fn();
const mockPolicies = vi.fn();
const mockCreatePolicy = vi.fn();
const mockDeletePolicy = vi.fn();
const mockAttachPolicy = vi.fn();
const mockDetachPolicy = vi.fn();
const mockPolicyTargets = vi.fn();
const mockTargetPolicies = vi.fn();

vi.mock("../../hooks/useOrganizations", () => ({
  useOrg: (...args: any[]) => mockOrg(...args),
  useCreateOrg: () => ({ mutateAsync: mockCreateOrg, isPending: false }),
  useDeleteOrg: () => ({ mutateAsync: mockDeleteOrg, isPending: false }),
  useOrgRoots: (...args: any[]) => mockRoots(...args),
  useOrgOUs: (...args: any[]) => mockOUs(...args),
  useCreateOrgOU: () => ({ mutateAsync: mockCreateOU, isPending: false }),
  useDeleteOrgOU: () => ({ mutateAsync: mockDeleteOU, isPending: false }),
  useOrgAccounts: (...args: any[]) => mockAccounts(...args),
  useCreateOrgAccount: () => ({ mutateAsync: mockCreateAccount, isPending: false }),
  useCloseOrgAccount: () => ({ mutateAsync: mockCloseAccount, isPending: false }),
  useOrgPolicies: (...args: any[]) => mockPolicies(...args),
  useCreateOrgPolicy: () => ({ mutateAsync: mockCreatePolicy, isPending: false }),
  useDeleteOrgPolicy: () => ({ mutateAsync: mockDeletePolicy, isPending: false }),
  useAttachOrgPolicy: () => ({ mutateAsync: mockAttachPolicy, isPending: false }),
  useDetachOrgPolicy: () => ({ mutateAsync: mockDetachPolicy, isPending: false }),
  useOrgPolicyTargets: () => ({ data: mockPolicyTargets(), isLoading: false }),
  useOrgTargetPolicies: () => ({ data: mockTargetPolicies(), isLoading: false }),
}));

vi.mock("../../components/Toast", () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

// Mock ResourceTable to expose onDelete + render items
vi.mock("../../components/ResourceTable", () => ({
  __esModule: true,
  default: ({ items, onDelete, columns, headerTitle, emptyMessage, loading }: any) => (
    <div data-testid={`rt-${headerTitle}`}>
      {loading && <span>loading</span>}
      {items.length === 0 && <span>{emptyMessage}</span>}
      {items.map((item: any) => (
        <div key={item.Id || item.id || item.Name}>
          <span data-testid="item-name">{item.Name || item.name}</span>
          {columns?.map((col: any) => (
            <span key={col.id} data-testid={`col-${col.id}`}>{col.cell(item)}</span>
          ))}
          {onDelete && (
            <button data-testid="delete-btn" onClick={() => onDelete(item)}>
              Delete
            </button>
          )}
        </div>
      ))}
    </div>
  ),
}));

// Mock Modal to render content and expose onDismiss / Cancel
vi.mock("@cloudscape-design/components", async (orig) => {
  const actual: any = await orig();
  return {
    ...actual,
    Modal: ({ visible, onDismiss, children, header }: any) =>
      visible ? (
        <div data-testid="modal">
          <span data-testid="modal-header">{header}</span>
          <button data-testid="modal-dismiss" onClick={onDismiss}>
            Dismiss
          </button>
          {children}
        </div>
      ) : null,
  };
});

import { OrganizationsDashboard } from "./OrganizationsDashboard";

beforeEach(() => {
  vi.clearAllMocks();
  mockOrg.mockReturnValue({ data: undefined, isLoading: true });
  mockRoots.mockReturnValue({ data: { roots: [], total: 0 }, isLoading: false });
  mockOUs.mockReturnValue({ data: { organizationalUnits: [], total: 0 }, isLoading: false });
  mockAccounts.mockReturnValue({ data: { accounts: [], total: 0 }, isLoading: false });
  mockPolicies.mockReturnValue({ data: { policies: [], total: 0 }, isLoading: false });
  mockPolicyTargets.mockReturnValue(undefined);
  mockTargetPolicies.mockReturnValue(undefined);
});

describe("OrganizationsDashboard", () => {
  // ── Loading / empty states ──────────────────────────

  it("shows loading when org is loading", () => {
    mockOrg.mockReturnValue({ data: undefined, isLoading: true });
    render(<OrganizationsDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/Loading/)).toBeTruthy();
  });

  it("shows empty state when no org", () => {
    mockOrg.mockReturnValue({ data: undefined, isLoading: false });
    render(<OrganizationsDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No organization/)).toBeTruthy();
  });

  // ── Org with data ───────────────────────────────────

  it("shows org details with delete button", () => {
    mockOrg.mockReturnValue({
      data: { organization: { Id: "o-123", Arn: "arn:aws:organizations::123:org/o-123" } },
      isLoading: false,
    });
    mockRoots.mockReturnValue({
      data: { roots: [{ Id: "r-1", Name: "Root" }], total: 1 },
      isLoading: false,
    });
    render(<OrganizationsDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("o-123")).toBeTruthy();
    expect(screen.getByText("Active")).toBeTruthy();
  });

  it("shows no roots when roots empty", () => {
    mockOrg.mockReturnValue({
      data: { organization: { Id: "o-1", Arn: "arn:org" } },
      isLoading: false,
    });
    render(<OrganizationsDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No roots/)).toBeTruthy();
  });

  it("renders multiple roots", () => {
    mockOrg.mockReturnValue({
      data: { organization: { Id: "o-1", Arn: "arn:org" } },
      isLoading: false,
    });
    mockRoots.mockReturnValue({
      data: { roots: [{ Id: "r-1", Name: "Root1" }, { Id: "r-2", Name: "Root2" }], total: 2 },
      isLoading: false,
    });
    render(<OrganizationsDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/Root1/)).toBeTruthy();
    expect(screen.getByText(/Root2/)).toBeTruthy();
  });

  // ── Create / Delete org ─────────────────────────────

  it("creates org successfully", async () => {
    mockOrg.mockReturnValue({ data: undefined, isLoading: false });
    mockCreateOrg.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    render(<OrganizationsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create Organization/i }));
    await waitFor(() => expect(mockCreateOrg).toHaveBeenCalled());
  });

  it("handles create org error (Error instance)", async () => {
    mockOrg.mockReturnValue({ data: undefined, isLoading: false });
    mockCreateOrg.mockRejectedValueOnce(new Error("already exists"));
    const user = userEvent.setup();
    render(<OrganizationsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create Organization/i }));
    await waitFor(() => expect(mockCreateOrg).toHaveBeenCalled());
  });

  it("handles create org non-Error rejection", async () => {
    mockOrg.mockReturnValue({ data: undefined, isLoading: false });
    mockCreateOrg.mockRejectedValueOnce("string err");
    const user = userEvent.setup();
    render(<OrganizationsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create Organization/i }));
    await waitFor(() => expect(mockCreateOrg).toHaveBeenCalled());
  });

  it("deletes org successfully", async () => {
    mockOrg.mockReturnValue({
      data: { organization: { Id: "o-1", Arn: "arn:org" } },
      isLoading: false,
    });
    mockDeleteOrg.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    render(<OrganizationsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Delete Organization/i }));
    await waitFor(() => expect(mockDeleteOrg).toHaveBeenCalled());
  });

  it("handles delete org error (Error instance)", async () => {
    mockOrg.mockReturnValue({
      data: { organization: { Id: "o-1", Arn: "arn:org" } },
      isLoading: false,
    });
    mockDeleteOrg.mockRejectedValueOnce(new Error("cant delete"));
    const user = userEvent.setup();
    render(<OrganizationsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Delete Organization/i }));
    await waitFor(() => expect(mockDeleteOrg).toHaveBeenCalled());
  });

  it("handles delete org non-Error rejection", async () => {
    mockOrg.mockReturnValue({
      data: { organization: { Id: "o-1", Arn: "arn:org" } },
      isLoading: false,
    });
    mockDeleteOrg.mockRejectedValueOnce("string err");
    const user = userEvent.setup();
    render(<OrganizationsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Delete Organization/i }));
    await waitFor(() => expect(mockDeleteOrg).toHaveBeenCalled());
  });

  // ── Tab switching ───────────────────────────────────

  it("switches between tabs", async () => {
    mockOrg.mockReturnValue({ data: undefined, isLoading: false });
    const user = userEvent.setup();
    render(<OrganizationsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Organizational Units/ }));
    expect(screen.getByRole("tab", { name: /Organizational Units/ }).getAttribute("aria-selected")).toBe("true");
    await user.click(screen.getByRole("tab", { name: /Accounts/ }));
    expect(screen.getByRole("tab", { name: /Accounts/ }).getAttribute("aria-selected")).toBe("true");
    await user.click(screen.getByRole("tab", { name: /Policies/ }));
    expect(screen.getByRole("tab", { name: /Policies/ }).getAttribute("aria-selected")).toBe("true");
  });

  // ── OUs tab ─────────────────────────────────────────

  it("shows empty OUs message", async () => {
    mockOrg.mockReturnValue({ data: undefined, isLoading: false });
    const user = userEvent.setup();
    render(<OrganizationsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Organizational Units/ }));
    expect(screen.getByText(/No OUs in this root/)).toBeTruthy();
  });

  it("validates OU name empty", async () => {
    mockOrg.mockReturnValue({ data: undefined, isLoading: false });
    const user = userEvent.setup();
    render(<OrganizationsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Organizational Units/ }));
    await user.click(screen.getByRole("button", { name: /Create OU/i }));
    const createBtn = screen.getAllByRole("button", { name: /^Create$/i })[0];
    await user.click(createBtn);
    expect(screen.getByText("Name is required")).toBeTruthy();
  });

  it("validates rootId required when no roots", async () => {
    mockOrg.mockReturnValue({ data: undefined, isLoading: false });
    mockRoots.mockReturnValue({ data: { roots: [], total: 0 }, isLoading: false });
    const user = userEvent.setup();
    render(<OrganizationsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Organizational Units/ }));
    await user.click(screen.getByRole("button", { name: /Create OU/i }));
    await user.type(screen.getByPlaceholderText("my-ou"), "test-ou");
    const createBtn = screen.getAllByRole("button", { name: /^Create$/i })[0];
    await user.click(createBtn);
    expect(screen.getByText("Select a root first")).toBeTruthy();
  });

  it("creates OU successfully", async () => {
    mockOrg.mockReturnValue({ data: undefined, isLoading: false });
    mockRoots.mockReturnValue({ data: { roots: [{ Id: "r-1", Name: "Root" }], total: 1 }, isLoading: false });
    mockCreateOU.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    render(<OrganizationsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Organizational Units/ }));
    await user.click(screen.getByRole("button", { name: /Create OU/i }));
    await user.type(screen.getByPlaceholderText("my-ou"), "test-ou");
    await user.click(screen.getAllByRole("button", { name: /^Create$/i })[0]);
    await waitFor(() => expect(mockCreateOU).toHaveBeenCalled());
  });

  it("handles create OU error (Error instance)", async () => {
    mockOrg.mockReturnValue({ data: undefined, isLoading: false });
    mockRoots.mockReturnValue({ data: { roots: [{ Id: "r-1", Name: "Root" }], total: 1 }, isLoading: false });
    mockCreateOU.mockRejectedValueOnce(new Error("ou create failed"));
    const user = userEvent.setup();
    render(<OrganizationsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Organizational Units/ }));
    await user.click(screen.getByRole("button", { name: /Create OU/i }));
    await user.type(screen.getByPlaceholderText("my-ou"), "test-ou");
    await user.click(screen.getAllByRole("button", { name: /^Create$/i })[0]);
    await waitFor(() => expect(mockCreateOU).toHaveBeenCalled());
  });

  it("handles create OU non-Error rejection", async () => {
    mockOrg.mockReturnValue({ data: undefined, isLoading: false });
    mockRoots.mockReturnValue({ data: { roots: [{ Id: "r-1", Name: "Root" }], total: 1 }, isLoading: false });
    mockCreateOU.mockRejectedValueOnce("string err");
    const user = userEvent.setup();
    render(<OrganizationsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Organizational Units/ }));
    await user.click(screen.getByRole("button", { name: /Create OU/i }));
    await user.type(screen.getByPlaceholderText("my-ou"), "test-ou");
    await user.click(screen.getAllByRole("button", { name: /^Create$/i })[0]);
    await waitFor(() => expect(mockCreateOU).toHaveBeenCalled());
  });

  it("deletes OU via ResourceTable onDelete", async () => {
    mockOrg.mockReturnValue({ data: undefined, isLoading: false });
    mockOUs.mockReturnValue({ data: { organizationalUnits: [{ id: "ou-1", name: "Test OU" }], total: 1 }, isLoading: false });
    mockDeleteOU.mockResolvedValueOnce(undefined);
    render(<OrganizationsDashboard />, { wrapper: createWrapper() });
    const u = userEvent.setup();
    await u.click(screen.getByRole("tab", { name: /Organizational Units/ }));
    await u.click(screen.getAllByTestId("delete-btn")[0]);
    await waitFor(() => expect(mockDeleteOU).toHaveBeenCalledWith("ou-1"));
  });

  it("handles OU delete error via ResourceTable", async () => {
    mockOrg.mockReturnValue({ data: undefined, isLoading: false });
    mockOUs.mockReturnValue({ data: { organizationalUnits: [{ id: "ou-1", name: "Test OU" }], total: 1 }, isLoading: false });
    mockDeleteOU.mockRejectedValueOnce(new Error("delete failed"));
    render(<OrganizationsDashboard />, { wrapper: createWrapper() });
    const u = userEvent.setup();
    await u.click(screen.getByRole("tab", { name: /Organizational Units/ }));
    await u.click(screen.getAllByTestId("delete-btn")[0]);
    await waitFor(() => expect(mockDeleteOU).toHaveBeenCalled());
  });

  it("dismisses create OU modal", async () => {
    mockOrg.mockReturnValue({ data: undefined, isLoading: false });
    const user = userEvent.setup();
    render(<OrganizationsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Organizational Units/ }));
    await user.click(screen.getByRole("button", { name: /Create OU/i }));
    expect(screen.getByTestId("modal")).toBeTruthy();
    await user.click(screen.getByTestId("modal-dismiss"));
    expect(screen.queryByTestId("modal")).toBeNull();
  });

  it("cancel OU create closes modal", async () => {
    mockOrg.mockReturnValue({ data: undefined, isLoading: false });
    const user = userEvent.setup();
    render(<OrganizationsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Organizational Units/ }));
    await user.click(screen.getByRole("button", { name: /Create OU/i }));
    expect(screen.getByTestId("modal")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /^Cancel$/i }));
    expect(screen.queryByTestId("modal")).toBeNull();
  });

  // ── Accounts tab ────────────────────────────────────

  it("shows empty accounts message", async () => {
    mockOrg.mockReturnValue({ data: undefined, isLoading: false });
    const user = userEvent.setup();
    render(<OrganizationsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Accounts/ }));
    expect(screen.getByText(/No accounts/)).toBeTruthy();
  });

  it("validates email required for account creation", async () => {
    mockOrg.mockReturnValue({ data: undefined, isLoading: false });
    const user = userEvent.setup();
    render(<OrganizationsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Accounts/ }));
    await user.click(screen.getByRole("button", { name: /Create Account/i }));
    await user.click(screen.getAllByRole("button", { name: /^Create$/i })[0]);
    expect(screen.getByText("Email is required")).toBeTruthy();
  });

  it("creates account successfully", async () => {
    mockOrg.mockReturnValue({ data: undefined, isLoading: false });
    mockRoots.mockReturnValue({ data: { roots: [{ Id: "r-1", Name: "Root" }], total: 1 }, isLoading: false });
    mockCreateAccount.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    render(<OrganizationsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Accounts/ }));
    await user.click(screen.getByRole("button", { name: /Create Account/i }));
    await user.type(screen.getByPlaceholderText("account@example.com"), "a@b.com");
    await user.type(screen.getByPlaceholderText("My Account"), "My Acct");
    await user.click(screen.getAllByRole("button", { name: /^Create$/i })[0]);
    await waitFor(() => expect(mockCreateAccount).toHaveBeenCalled());
  });

  it("handles create account error (Error)", async () => {
    mockOrg.mockReturnValue({ data: undefined, isLoading: false });
    mockCreateAccount.mockRejectedValueOnce(new Error("acct err"));
    const user = userEvent.setup();
    render(<OrganizationsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Accounts/ }));
    await user.click(screen.getByRole("button", { name: /Create Account/i }));
    await user.type(screen.getByPlaceholderText("account@example.com"), "a@b.com");
    await user.click(screen.getAllByRole("button", { name: /^Create$/i })[0]);
    await waitFor(() => expect(mockCreateAccount).toHaveBeenCalled());
  });

  it("handles create account non-Error rejection", async () => {
    mockOrg.mockReturnValue({ data: undefined, isLoading: false });
    mockCreateAccount.mockRejectedValueOnce("string err");
    const user = userEvent.setup();
    render(<OrganizationsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Accounts/ }));
    await user.click(screen.getByRole("button", { name: /Create Account/i }));
    await user.type(screen.getByPlaceholderText("account@example.com"), "a@b.com");
    await user.click(screen.getAllByRole("button", { name: /^Create$/i })[0]);
    await waitFor(() => expect(mockCreateAccount).toHaveBeenCalled());
  });

  it("dismisses create account modal", async () => {
    mockOrg.mockReturnValue({ data: undefined, isLoading: false });
    const user = userEvent.setup();
    render(<OrganizationsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Accounts/ }));
    await user.click(screen.getByRole("button", { name: /Create Account/i }));
    expect(screen.getByTestId("modal")).toBeTruthy();
    await user.click(screen.getByTestId("modal-dismiss"));
    expect(screen.queryByTestId("modal")).toBeNull();
  });

  it("cancel account create closes modal", async () => {
    mockOrg.mockReturnValue({ data: undefined, isLoading: false });
    const user = userEvent.setup();
    render(<OrganizationsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Accounts/ }));
    await user.click(screen.getByRole("button", { name: /Create Account/i }));
    expect(screen.getByTestId("modal")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /^Cancel$/i }));
    expect(screen.queryByTestId("modal")).toBeNull();
  });

  it("deletes account via ResourceTable", async () => {
    mockOrg.mockReturnValue({ data: undefined, isLoading: false });
    mockAccounts.mockReturnValue({ data: { accounts: [{ id: "a-1", name: "Acct1" }], total: 1 }, isLoading: false });
    mockCloseAccount.mockResolvedValueOnce(undefined);
    render(<OrganizationsDashboard />, { wrapper: createWrapper() });
    const u = userEvent.setup();
    await u.click(screen.getByRole("tab", { name: /Accounts/ }));
    await u.click(screen.getAllByTestId("delete-btn")[0]);
    await waitFor(() => expect(mockCloseAccount).toHaveBeenCalledWith("a-1"));
  });

  it("handles account close error", async () => {
    mockOrg.mockReturnValue({ data: undefined, isLoading: false });
    mockAccounts.mockReturnValue({ data: { accounts: [{ id: "a-1", name: "Acct1" }], total: 1 }, isLoading: false });
    mockCloseAccount.mockRejectedValueOnce(new Error("close failed"));
    render(<OrganizationsDashboard />, { wrapper: createWrapper() });
    const u = userEvent.setup();
    await u.click(screen.getByRole("tab", { name: /Accounts/ }));
    await u.click(screen.getAllByTestId("delete-btn")[0]);
    await waitFor(() => expect(mockCloseAccount).toHaveBeenCalled());
  });

  // ── Policies tab ────────────────────────────────────

  it("shows empty policies message", async () => {
    mockOrg.mockReturnValue({ data: undefined, isLoading: false });
    const user = userEvent.setup();
    render(<OrganizationsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Policies/ }));
    expect(screen.getByText(/No policies/)).toBeTruthy();
  });

  it("validates policy name and content required", async () => {
    mockOrg.mockReturnValue({ data: undefined, isLoading: false });
    const user = userEvent.setup();
    render(<OrganizationsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Policies/ }));
    await user.click(screen.getByRole("button", { name: /Create Policy/i }));
    await user.click(screen.getAllByRole("button", { name: /^Create$/i })[0]);
    expect(screen.getByText("Name and content are required")).toBeTruthy();
  });

  it("creates policy successfully", async () => {
    mockOrg.mockReturnValue({ data: undefined, isLoading: false });
    mockCreatePolicy.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    render(<OrganizationsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Policies/ }));
    await user.click(screen.getByRole("button", { name: /Create Policy/i }));
    await user.type(screen.getByPlaceholderText("my-scp"), "my-policy");
    fireEvent.change(screen.getByPlaceholderText(/Version/), { target: { value: '{"Version":"2012-10-17","Statement":[]}' } });
    await user.click(screen.getAllByRole("button", { name: /^Create$/i })[0]);
    await waitFor(() => expect(mockCreatePolicy).toHaveBeenCalled());
  });

  it("handles create policy error (Error)", async () => {
    mockOrg.mockReturnValue({ data: undefined, isLoading: false });
    mockCreatePolicy.mockRejectedValueOnce(new Error("policy err"));
    const user = userEvent.setup();
    render(<OrganizationsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Policies/ }));
    await user.click(screen.getByRole("button", { name: /Create Policy/i }));
    await user.type(screen.getByPlaceholderText("my-scp"), "my-policy");
    fireEvent.change(screen.getByPlaceholderText(/Version/), { target: { value: '{"Statement":[]}' } });
    await user.click(screen.getAllByRole("button", { name: /^Create$/i })[0]);
    await waitFor(() => expect(mockCreatePolicy).toHaveBeenCalled());
  });

  it("handles create policy non-Error rejection", async () => {
    mockOrg.mockReturnValue({ data: undefined, isLoading: false });
    mockCreatePolicy.mockRejectedValueOnce("string err");
    const user = userEvent.setup();
    render(<OrganizationsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Policies/ }));
    await user.click(screen.getByRole("button", { name: /Create Policy/i }));
    await user.type(screen.getByPlaceholderText("my-scp"), "my-policy");
    fireEvent.change(screen.getByPlaceholderText(/Version/), { target: { value: '{"Statement":[]}' } });
    await user.click(screen.getAllByRole("button", { name: /^Create$/i })[0]);
    await waitFor(() => expect(mockCreatePolicy).toHaveBeenCalled());
  });

  it("dismisses create policy modal", async () => {
    mockOrg.mockReturnValue({ data: undefined, isLoading: false });
    const user = userEvent.setup();
    render(<OrganizationsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Policies/ }));
    await user.click(screen.getByRole("button", { name: /Create Policy/i }));
    expect(screen.getByTestId("modal")).toBeTruthy();
    await user.click(screen.getByTestId("modal-dismiss"));
    expect(screen.queryByTestId("modal")).toBeNull();
  });

  it("cancel policy create closes modal", async () => {
    mockOrg.mockReturnValue({ data: undefined, isLoading: false });
    const user = userEvent.setup();
    render(<OrganizationsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Policies/ }));
    await user.click(screen.getByRole("button", { name: /Create Policy/i }));
    expect(screen.getByTestId("modal")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /^Cancel$/i }));
    expect(screen.queryByTestId("modal")).toBeNull();
  });

  it("deletes policy via ResourceTable", async () => {
    mockOrg.mockReturnValue({ data: undefined, isLoading: false });
    mockPolicies.mockReturnValue({ data: { policies: [{ id: "p-1", name: "Test SCP" }], total: 1 }, isLoading: false });
    mockDeletePolicy.mockResolvedValueOnce(undefined);
    render(<OrganizationsDashboard />, { wrapper: createWrapper() });
    const u = userEvent.setup();
    await u.click(screen.getByRole("tab", { name: /Policies/ }));
    await u.click(screen.getAllByTestId("delete-btn")[0]);
    await waitFor(() => expect(mockDeletePolicy).toHaveBeenCalledWith("p-1"));
  });

  it("handles policy delete error", async () => {
    mockOrg.mockReturnValue({ data: undefined, isLoading: false });
    mockPolicies.mockReturnValue({ data: { policies: [{ id: "p-1", name: "Test SCP" }], total: 1 }, isLoading: false });
    mockDeletePolicy.mockRejectedValueOnce(new Error("delete failed"));
    render(<OrganizationsDashboard />, { wrapper: createWrapper() });
    const u = userEvent.setup();
    await u.click(screen.getByRole("tab", { name: /Policies/ }));
    await u.click(screen.getAllByTestId("delete-btn")[0]);
    await waitFor(() => expect(mockDeletePolicy).toHaveBeenCalled());
  });

  // ── Branch coverage: fallback arms ────────────────

  it("covers || [] fallback when OUs data missing", async () => {
    mockOrg.mockReturnValue({ data: undefined, isLoading: false });
    mockOUs.mockReturnValue({ data: { total: 0 }, isLoading: false });
    render(<OrganizationsDashboard />, { wrapper: createWrapper() });
    const u = userEvent.setup();
    await u.click(screen.getByRole("tab", { name: /Organizational Units/ }));
    expect(screen.getByText(/No OUs in this root/)).toBeTruthy();
  });

  it("covers || [] fallback when accounts data missing", async () => {
    mockOrg.mockReturnValue({ data: undefined, isLoading: false });
    mockAccounts.mockReturnValue({ data: { total: 0 }, isLoading: false });
    render(<OrganizationsDashboard />, { wrapper: createWrapper() });
    const u = userEvent.setup();
    await u.click(screen.getByRole("tab", { name: /Accounts/ }));
    expect(screen.getByText(/No accounts/)).toBeTruthy();
  });

  it("covers || [] fallback when policies data missing", async () => {
    mockOrg.mockReturnValue({ data: undefined, isLoading: false });
    mockPolicies.mockReturnValue({ data: { total: 0 }, isLoading: false });
    render(<OrganizationsDashboard />, { wrapper: createWrapper() });
    const u = userEvent.setup();
    await u.click(screen.getByRole("tab", { name: /Policies/ }));
    expect(screen.getByText(/No policies/)).toBeTruthy();
  });

  it("covers ACTIVE status indicator and awsManaged", async () => {
    mockOrg.mockReturnValue({ data: undefined, isLoading: false });
    mockAccounts.mockReturnValue({ data: { accounts: [{ id: "a-1", name: "Acct1", status: "ACTIVE" }], total: 1 }, isLoading: false });
    mockPolicies.mockReturnValue({ data: { policies: [{ id: "p-1", name: "Pol1", awsManaged: true }], total: 1 }, isLoading: false });
    render(<OrganizationsDashboard />, { wrapper: createWrapper() });
    const u = userEvent.setup();
    await u.click(screen.getByRole("tab", { name: /Accounts/ }));
    expect(screen.getByText(/ACTIVE/)).toBeTruthy();
    await u.click(screen.getByRole("tab", { name: /Policies/ }));
    expect(screen.getByText(/Yes/)).toBeTruthy();
  });

  it("covers non-Error OU delete rejection", async () => {
    mockOrg.mockReturnValue({ data: undefined, isLoading: false });
    mockOUs.mockReturnValue({ data: { organizationalUnits: [{ id: "ou-1", name: "Test OU" }], total: 1 }, isLoading: false });
    mockDeleteOU.mockRejectedValueOnce("string error");
    render(<OrganizationsDashboard />, { wrapper: createWrapper() });
    const u = userEvent.setup();
    await u.click(screen.getByRole("tab", { name: /Organizational Units/ }));
    await u.click(screen.getAllByTestId("delete-btn")[0]);
    await waitFor(() => expect(mockDeleteOU).toHaveBeenCalled());
  });

  it("covers non-Error account close rejection", async () => {
    mockOrg.mockReturnValue({ data: undefined, isLoading: false });
    mockAccounts.mockReturnValue({ data: { accounts: [{ id: "a-1", name: "Acct1" }], total: 1 }, isLoading: false });
    mockCloseAccount.mockRejectedValueOnce("string error");
    render(<OrganizationsDashboard />, { wrapper: createWrapper() });
    const u = userEvent.setup();
    await u.click(screen.getByRole("tab", { name: /Accounts/ }));
    await u.click(screen.getAllByTestId("delete-btn")[0]);
    await waitFor(() => expect(mockCloseAccount).toHaveBeenCalled());
  });

  it("covers non-Error policy delete rejection", async () => {
    mockOrg.mockReturnValue({ data: undefined, isLoading: false });
    mockPolicies.mockReturnValue({ data: { policies: [{ id: "p-1", name: "Pol1" }], total: 1 }, isLoading: false });
    mockDeletePolicy.mockRejectedValueOnce("string error");
    render(<OrganizationsDashboard />, { wrapper: createWrapper() });
    const u = userEvent.setup();
    await u.click(screen.getByRole("tab", { name: /Policies/ }));
    await u.click(screen.getAllByTestId("delete-btn")[0]);
    await waitFor(() => expect(mockDeletePolicy).toHaveBeenCalled());
  });

  // ── Root selection ──────────────────────────────────

  it("selects a root", async () => {
    mockOrg.mockReturnValue({ data: { organization: { Id: "o-1", Arn: "arn:org" } }, isLoading: false });
    mockRoots.mockReturnValue({ data: { roots: [{ Id: "r-1", Name: "Root1" }, { Id: "r-2", Name: "Root2" }], total: 2 }, isLoading: false });
    const user = userEvent.setup();
    render(<OrganizationsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText(/Root2/));
    expect(screen.getByText(/Root2/)).toBeTruthy();
  });
});
