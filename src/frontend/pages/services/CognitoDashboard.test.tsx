// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

// ─── vi.hoisted states ─────────────────────────────────

const deletePoolState = vi.hoisted(() => ({
  isPending: false,
  variables: null as string | null,
}));

// ─── Mock hooks ─────────────────────────────────────────

const mockPools = vi.fn();
const mockDeletePool = vi.fn();
const mockUsers = vi.fn();
const mockGroups = vi.fn();
const mockClients = vi.fn();

vi.mock("../../hooks/useCognito", () => ({
  useCognitoUserPools: (...args: any[]) => mockPools(...args),
  useDeleteCognitoUserPool: () => ({
    mutateAsync: mockDeletePool,
    get isPending() { return deletePoolState.isPending; },
    get variables() { return deletePoolState.variables; },
  }),
  useCognitoUsers: (...args: any[]) => mockUsers(...args),
  useCognitoGroups: (...args: any[]) => mockGroups(...args),
  useCognitoUserPoolClients: (...args: any[]) => mockClients(...args),
  useCreateCognitoUserPool: () => ({ mutate: vi.fn(), isPending: false }),
  useCreateCognitoUser: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteCognitoUser: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCreateCognitoGroup: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteCognitoGroup: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCreateCognitoUserPoolClient: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteCognitoUserPoolClient: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

import { CognitoDashboard } from "./CognitoDashboard";

// ─── Setup ──────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  deletePoolState.isPending = false;
  deletePoolState.variables = null;

  mockPools.mockReturnValue({ data: { userPools: [], total: 0 }, isLoading: false });
  mockUsers.mockReturnValue({ data: { users: [], total: 0 } });
  mockGroups.mockReturnValue({ data: { groups: [], total: 0 } });
  mockClients.mockReturnValue({ data: { clients: [], total: 0 } });
});

// ─── Tests ──────────────────────────────────────────────

describe("CognitoDashboard — pool list", () => {
  it("shows loading skeleton", () => {
    mockPools.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = render(<CognitoDashboard />, { wrapper: createWrapper() });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("shows empty message", () => {
    render(<CognitoDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No Cognito user pools/i)).toBeTruthy();
  });

  it("renders user pools with data", () => {
    mockPools.mockReturnValue({
      data: {
        userPools: [{ Id: "us-east-1_abc123", Name: "my-pool", Status: "Enabled", CreationDate: 1705000000 }],
        total: 1,
      },
      isLoading: false,
    });
    render(<CognitoDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-pool")).toBeTruthy();
    expect(screen.getByText("us-east-1_abc123")).toBeTruthy();
  });

  it("shows dash for missing created date", () => {
    mockPools.mockReturnValue({
      data: { userPools: [{ Id: "id-1", Name: "test", Status: "Enabled" }], total: 1 },
      isLoading: false,
    });
    render(<CognitoDashboard />, { wrapper: createWrapper() });
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(1);
  });

  it("shows delete pool loading state", () => {
    deletePoolState.isPending = true;
    deletePoolState.variables = "pool-1";
    mockPools.mockReturnValue({
      data: { userPools: [{ Id: "pool-1", Name: "delete-me", Status: "Enabled" }], total: 1 },
      isLoading: false,
    });
    render(<CognitoDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("delete-me")).toBeTruthy();
  });

  it("deletes a user pool", async () => {
    mockPools.mockReturnValue({
      data: { userPools: [{ Id: "pool-1", Name: "delete-me", Status: "Enabled" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CognitoDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("delete-me")).toBeTruthy());

    const deleteBtn = screen.getByRole("button", { name: /Delete delete-me/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeletePool).toHaveBeenCalledWith("pool-1"));
  });

  it("filters pools by name", async () => {
    mockPools.mockReturnValue({
      data: {
        userPools: [
          { Id: "id1", Name: "alpha-pool", Status: "Enabled" },
          { Id: "id2", Name: "beta-pool", Status: "Enabled" },
        ],
        total: 2,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CognitoDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("alpha-pool")).toBeTruthy());

    const filterInput = screen.getByPlaceholderText("Find user pools");
    await user.type(filterInput, "beta");
    await waitFor(() => expect(screen.queryByText("alpha-pool")).toBeNull());
  });
});

describe("CognitoDashboard — pool detail navigation", () => {
  it("navigates to pool detail and shows user tab", async () => {
    mockPools.mockReturnValue({
      data: { userPools: [{ Id: "pool-1", Name: "my-pool", Status: "Enabled", CreationDate: 1705000000 }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CognitoDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-pool")).toBeTruthy());

    await user.click(screen.getByText("my-pool"));
    await waitFor(() => expect(screen.getByText(/Users in pool-1/i)).toBeTruthy());
  });

  it("shows back button and returns to pool list", async () => {
    mockPools.mockReturnValue({
      data: { userPools: [{ Id: "p1", Name: "pool", Status: "Enabled" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CognitoDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("pool"));
    await user.click(screen.getByText("pool"));
    await waitFor(() => expect(screen.getByText(/Back to user pools/i)).toBeTruthy());

    // Click back and verify we return to pool list
    await user.click(screen.getByText(/Back to user pools/i));
    await waitFor(() => expect(screen.getByText("pool")).toBeTruthy());
    // Pool ID column should be visible again
    expect(screen.getByText("p1")).toBeTruthy();
  });

  it("shows groups and clients tabs in detail", async () => {
    mockPools.mockReturnValue({
      data: { userPools: [{ Id: "p1", Name: "pool", Status: "Enabled" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CognitoDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("pool"));
    await user.click(screen.getByText("pool"));
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /Users/i })).toBeTruthy();
      expect(screen.getByRole("tab", { name: /Groups/i })).toBeTruthy();
      expect(screen.getByRole("tab", { name: /App Clients/i })).toBeTruthy();
    });
  });
});

describe("CognitoDashboard — users tab", () => {
  it("renders users with all fields", async () => {
    mockPools.mockReturnValue({
      data: { userPools: [{ Id: "p1", Name: "pool", Status: "Enabled" }], total: 1 },
      isLoading: false,
    });
    mockUsers.mockReturnValue({
      data: {
        users: [
          { Username: "alice", UserStatus: "CONFIRMED", Enabled: true, UserCreateDate: 1705000000 },
          { Username: "bob", UserStatus: "UNCONFIRMED", Enabled: false },
        ],
        total: 2,
      },
    });
    const user = userEvent.setup();
    render(<CognitoDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("pool"));
    await user.click(screen.getByText("pool"));
    await waitFor(() => expect(screen.getByText("alice")).toBeTruthy());
    expect(screen.getByText("bob")).toBeTruthy();
    expect(screen.getByText("CONFIRMED")).toBeTruthy();
    expect(screen.getByText("UNCONFIRMED")).toBeTruthy();
    // Enabled: true → "Yes", false → "No"
    const yesMatches = screen.getAllByText("Yes");
    const noMatches = screen.getAllByText("No");
    expect(yesMatches.length).toBeGreaterThanOrEqual(1);
    expect(noMatches.length).toBeGreaterThanOrEqual(1);
    // User without UserCreateDate → "-"
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(1);
  });

  it("shows empty users tab", async () => {
    mockPools.mockReturnValue({
      data: { userPools: [{ Id: "p1", Name: "pool", Status: "Enabled" }], total: 1 },
      isLoading: false,
    });
    mockUsers.mockReturnValue({ data: { users: [], total: 0 } });
    const user = userEvent.setup();
    render(<CognitoDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("pool"));
    await user.click(screen.getByText("pool"));
    await waitFor(() => expect(screen.getByText(/No users/i)).toBeTruthy());
  });

  it("filters users by name", async () => {
    mockPools.mockReturnValue({
      data: { userPools: [{ Id: "p1", Name: "pool", Status: "Enabled" }], total: 1 },
      isLoading: false,
    });
    mockUsers.mockReturnValue({
      data: {
        users: [
          { Username: "alice", UserStatus: "CONFIRMED", Enabled: true },
          { Username: "bob", UserStatus: "CONFIRMED", Enabled: true },
        ],
        total: 2,
      },
    });
    const user = userEvent.setup();
    render(<CognitoDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("pool"));
    await user.click(screen.getByText("pool"));
    await waitFor(() => expect(screen.getByText("alice")).toBeTruthy());

    const filterInput = screen.getByPlaceholderText("Find users");
    await user.type(filterInput, "bob");
    await waitFor(() => expect(screen.queryByText("alice")).toBeNull());
  });
});

describe("CognitoDashboard — groups tab", () => {
  it("renders groups with all fields", async () => {
    mockPools.mockReturnValue({
      data: { userPools: [{ Id: "p1", Name: "pool", Status: "Enabled" }], total: 1 },
      isLoading: false,
    });
    mockGroups.mockReturnValue({
      data: {
        groups: [
          { GroupName: "admins", Description: "Admin group", Precedence: 1, RoleArn: "arn:aws:iam::123:role/admin" },
          { GroupName: "readers", Description: "Read-only", Precedence: 5, RoleArn: "arn:aws:iam::123:role/reader" },
        ],
        total: 2,
      },
    });
    const user = userEvent.setup();
    render(<CognitoDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("pool"));
    await user.click(screen.getByText("pool"));
    await user.click(screen.getByRole("tab", { name: /Groups/i }));
    await waitFor(() => expect(screen.getByText("admins")).toBeTruthy());
    expect(screen.getByText("readers")).toBeTruthy();
    expect(screen.getByText("Admin group")).toBeTruthy();
    expect(screen.getByText("arn:aws:iam::123:role/admin")).toBeTruthy();
  });

  it("shows dash for missing group fields", async () => {
    mockPools.mockReturnValue({
      data: { userPools: [{ Id: "p1", Name: "pool", Status: "Enabled" }], total: 1 },
      isLoading: false,
    });
    mockGroups.mockReturnValue({
      data: {
        groups: [{ GroupName: "minimal" }],
        total: 1,
      },
    });
    const user = userEvent.setup();
    render(<CognitoDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("pool"));
    await user.click(screen.getByText("pool"));
    await user.click(screen.getByRole("tab", { name: /Groups/i }));
    await waitFor(() => expect(screen.getByText("minimal")).toBeTruthy());
    // Description: g.Description || "-", RoleArn: g.RoleArn || "-", Precedence: g.Precedence ?? "-"
    const dashes = screen.getAllByText("-");
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  it("shows empty groups tab", async () => {
    mockPools.mockReturnValue({
      data: { userPools: [{ Id: "p1", Name: "pool", Status: "Enabled" }], total: 1 },
      isLoading: false,
    });
    mockGroups.mockReturnValue({ data: { groups: [], total: 0 } });
    const user = userEvent.setup();
    render(<CognitoDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("pool"));
    await user.click(screen.getByText("pool"));
    await user.click(screen.getByRole("tab", { name: /Groups/i }));
    await waitFor(() => expect(screen.getByText(/No groups/i)).toBeTruthy());
  });

  it("filters groups by name", async () => {
    mockPools.mockReturnValue({
      data: { userPools: [{ Id: "p1", Name: "pool", Status: "Enabled" }], total: 1 },
      isLoading: false,
    });
    mockGroups.mockReturnValue({
      data: {
        groups: [
          { GroupName: "admins" },
          { GroupName: "developers" },
        ],
        total: 2,
      },
    });
    const user = userEvent.setup();
    render(<CognitoDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("pool"));
    await user.click(screen.getByText("pool"));
    await user.click(screen.getByRole("tab", { name: /Groups/i }));
    await waitFor(() => expect(screen.getByText("admins")).toBeTruthy());

    const filterInput = screen.getByPlaceholderText("Find groups");
    await user.type(filterInput, "dev");
    await waitFor(() => expect(screen.queryByText("admins")).toBeNull());
  });
});

describe("CognitoDashboard — app clients tab", () => {
  it("renders app clients with all fields", async () => {
    mockPools.mockReturnValue({
      data: { userPools: [{ Id: "p1", Name: "pool", Status: "Enabled" }], total: 1 },
      isLoading: false,
    });
    mockClients.mockReturnValue({
      data: {
        clients: [
          { ClientId: "client-1", ClientName: "my-app", CreationDate: 1705000000 },
          { ClientId: "client-2", ClientName: "another-app", CreationDate: 1705100000 },
        ],
        total: 2,
      },
    });
    const user = userEvent.setup();
    render(<CognitoDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("pool"));
    await user.click(screen.getByText("pool"));
    await user.click(screen.getByRole("tab", { name: /App Clients/i }));
    await waitFor(() => expect(screen.getByText("my-app")).toBeTruthy());
    expect(screen.getByText("another-app")).toBeTruthy();
    expect(screen.getByText("client-1")).toBeTruthy();
    expect(screen.getByText("client-2")).toBeTruthy();
  });

  it("shows dash for missing client fields", async () => {
    mockPools.mockReturnValue({
      data: { userPools: [{ Id: "p1", Name: "pool", Status: "Enabled" }], total: 1 },
      isLoading: false,
    });
    mockClients.mockReturnValue({
      data: {
        clients: [{ ClientId: "client-min" }],
        total: 1,
      },
    });
    const user = userEvent.setup();
    render(<CognitoDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("pool"));
    await user.click(screen.getByText("pool"));
    await user.click(screen.getByRole("tab", { name: /App Clients/i }));
    await waitFor(() => expect(screen.getByText("client-min")).toBeTruthy());
    // Name: cl.ClientName (undefined → empty string in filter), Created: cl.CreationDate ? date : "-"
    // At minimum, the Created column shows "-"
    const dashes = screen.getAllByText("-");
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it("shows empty clients tab", async () => {
    mockPools.mockReturnValue({
      data: { userPools: [{ Id: "p1", Name: "pool", Status: "Enabled" }], total: 1 },
      isLoading: false,
    });
    mockClients.mockReturnValue({ data: { clients: [], total: 0 } });
    const user = userEvent.setup();
    render(<CognitoDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("pool"));
    await user.click(screen.getByText("pool"));
    await user.click(screen.getByRole("tab", { name: /App Clients/i }));
    await waitFor(() => expect(screen.getByText(/No app clients/i)).toBeTruthy());
  });

  it("filters clients by name", async () => {
    mockPools.mockReturnValue({
      data: { userPools: [{ Id: "p1", Name: "pool", Status: "Enabled" }], total: 1 },
      isLoading: false,
    });
    mockClients.mockReturnValue({
      data: {
        clients: [
          { ClientId: "c1", ClientName: "my-app" },
          { ClientId: "c2", ClientName: "other-app" },
        ],
        total: 2,
      },
    });
    const user = userEvent.setup();
    render(<CognitoDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("pool"));
    await user.click(screen.getByText("pool"));
    await user.click(screen.getByRole("tab", { name: /App Clients/i }));
    await waitFor(() => expect(screen.getByText("my-app")).toBeTruthy());

    const filterInput = screen.getByPlaceholderText("Find clients");
    await user.type(filterInput, "other");
    await waitFor(() => expect(screen.queryByText("my-app")).toBeNull());
  });

  it("handles client with null name in filter", async () => {
    mockPools.mockReturnValue({
      data: { userPools: [{ Id: "p1", Name: "pool", Status: "Enabled" }], total: 1 },
      isLoading: false,
    });
    mockClients.mockReturnValue({
      data: {
        clients: [
          { ClientId: "c1" },
          { ClientId: "c2", ClientName: "named" },
        ],
        total: 2,
      },
    });
    const user = userEvent.setup();
    render(<CognitoDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("pool"));
    await user.click(screen.getByText("pool"));
    await user.click(screen.getByRole("tab", { name: /App Clients/i }));
    await waitFor(() => expect(screen.getByText("named")).toBeTruthy());
  });
});
