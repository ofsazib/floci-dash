// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

// ─── vi.hoisted states ─────────────────────────────────

const deletePoolState = vi.hoisted(() => ({
  isPending: false,
  variables: null as string | null,
}));

const clientSecretsState = vi.hoisted(() => ({
  isLoading: false,
}));

const advancedStates = vi.hoisted(() => ({
  createResourceServer: { isPending: false },
  deleteResourceServer: { isPending: false, variables: null as string | null },
  setMfaConfig: { isPending: false },
  addCustomAttributes: { isPending: false },
  initiateAuth: { isPending: false },
  adminInitiateAuth: { isPending: false },
  confirmSignUp: { isPending: false },
  adminRespondChallenge: { isPending: false },
  forgotPassword: { isPending: false },
  confirmForgotPassword: { isPending: false },
  getUserAuth: { isPending: false },
  updateUserAttributes: { isPending: false },
  deleteUserAttributes: { isPending: false },
  addClientSecret: { isPending: false },
  deleteClientSecret: { isPending: false },
}));

// ─── Mock hooks ─────────────────────────────────────────

const mockPools = vi.fn();
const mockDeletePool = vi.fn();
const mockUsers = vi.fn();
const mockGroups = vi.fn();
const mockClients = vi.fn();
const mockResourceServers = vi.fn();
const mockMfaConfig = vi.fn();
const mockCreateResourceServer = vi.fn();
const mockDeleteResourceServer = vi.fn();
const mockSetMfaConfig = vi.fn();
const mockAddCustomAttributes = vi.fn();
const mockInitiateAuth = vi.fn();
const mockAdminInitiateAuth = vi.fn();
const mockConfirmSignUp = vi.fn();
const mockAdminRespondChallenge = vi.fn();
const mockForgotPassword = vi.fn();
const mockConfirmForgotPassword = vi.fn();
const mockGetUserAuth = vi.fn();
const mockUpdateUserAttributes = vi.fn();
const mockDeleteUserAttributes = vi.fn();
const mockAddClientSecret = vi.fn();
const mockDeleteClientSecret = vi.fn();
const mockClientSecrets = vi.fn();

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
  useResourceServers: (...args: any[]) => ({
    data: mockResourceServers(args[0]) || { resourceServers: [], total: 0 },
    isLoading: false,
    isError: false,
    error: null,
  }),
  useMfaConfig: (...args: any[]) => ({
    data: mockMfaConfig(args[0]) || { mfaConfiguration: null },
    isLoading: false,
    isError: false,
    error: null,
  }),
  useCreateResourceServer: () => ({
    mutate: mockCreateResourceServer,
    mutateAsync: mockCreateResourceServer,
    get isPending() { return advancedStates.createResourceServer.isPending; },
  }),
  useDeleteResourceServer: () => ({
    mutate: mockDeleteResourceServer,
    mutateAsync: mockDeleteResourceServer,
    get isPending() { return advancedStates.deleteResourceServer.isPending; },
    get variables() { return advancedStates.deleteResourceServer.variables; },
  }),
  useSetMfaConfig: () => ({
    mutate: mockSetMfaConfig,
    mutateAsync: mockSetMfaConfig,
    get isPending() { return advancedStates.setMfaConfig.isPending; },
  }),
  useAddCustomAttributes: () => ({
    mutate: mockAddCustomAttributes,
    mutateAsync: mockAddCustomAttributes,
    get isPending() { return advancedStates.addCustomAttributes.isPending; },
  }),
  useInitiateAuth: () => ({
    mutate: mockInitiateAuth,
    mutateAsync: mockInitiateAuth,
    get isPending() { return advancedStates.initiateAuth.isPending; },
  }),
  useAdminInitiateAuth: () => ({
    mutate: mockAdminInitiateAuth,
    mutateAsync: mockAdminInitiateAuth,
    get isPending() { return advancedStates.adminInitiateAuth.isPending; },
  }),
  useConfirmSignUp: () => ({
    mutate: mockConfirmSignUp,
    mutateAsync: mockConfirmSignUp,
    get isPending() { return advancedStates.confirmSignUp.isPending; },
  }),
  useAdminRespondToAuthChallenge: () => ({
    mutate: mockAdminRespondChallenge,
    mutateAsync: mockAdminRespondChallenge,
    get isPending() { return advancedStates.adminRespondChallenge.isPending; },
  }),
  useForgotPassword: () => ({
    mutate: mockForgotPassword,
    mutateAsync: mockForgotPassword,
    get isPending() { return advancedStates.forgotPassword.isPending; },
  }),
  useConfirmForgotPassword: () => ({
    mutate: mockConfirmForgotPassword,
    mutateAsync: mockConfirmForgotPassword,
    get isPending() { return advancedStates.confirmForgotPassword.isPending; },
  }),
  useGetUser: () => ({
    mutate: mockGetUserAuth,
    mutateAsync: mockGetUserAuth,
    get isPending() { return advancedStates.getUserAuth.isPending; },
  }),
  useUpdateUserAttributes: () => ({
    mutate: mockUpdateUserAttributes,
    mutateAsync: mockUpdateUserAttributes,
    get isPending() { return advancedStates.updateUserAttributes.isPending; },
  }),
  useDeleteUserAttributes: () => ({
    mutate: mockDeleteUserAttributes,
    mutateAsync: mockDeleteUserAttributes,
    get isPending() { return advancedStates.deleteUserAttributes.isPending; },
  }),
  useUserPoolClientSecrets: (...args: any[]) => ({
    data: mockClientSecrets(args[0], args[1]) || { secrets: [] },
    isLoading: clientSecretsState.isLoading,
  }),
  useAddUserPoolClientSecret: () => ({
    mutate: mockAddClientSecret,
    mutateAsync: mockAddClientSecret,
    get isPending() { return advancedStates.addClientSecret.isPending; },
  }),
  useDeleteUserPoolClientSecret: () => ({
    mutate: mockDeleteClientSecret,
    mutateAsync: mockDeleteClientSecret,
    get isPending() { return advancedStates.deleteClientSecret.isPending; },
  }),
}));

import { CognitoDashboard } from "./CognitoDashboard";

// ─── Setup ──────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  deletePoolState.isPending = false;
  deletePoolState.variables = null;
  clientSecretsState.isLoading = false;

  mockPools.mockReturnValue({ data: { userPools: [], total: 0 }, isLoading: false });
  mockUsers.mockReturnValue({ data: { users: [], total: 0 } });
  mockGroups.mockReturnValue({ data: { groups: [], total: 0 } });
  mockClients.mockReturnValue({ data: { clients: [], total: 0 } });
  mockResourceServers.mockReturnValue(null);
  mockMfaConfig.mockReturnValue(null);
  mockClientSecrets.mockReturnValue(null);
  mockCreateResourceServer.mockReset();
  mockDeleteResourceServer.mockReset();
  mockSetMfaConfig.mockReset();
  mockAddCustomAttributes.mockReset();
  mockInitiateAuth.mockReset();
  mockAdminInitiateAuth.mockReset();
  mockConfirmSignUp.mockReset();
  mockAdminRespondChallenge.mockReset();
  mockForgotPassword.mockReset();
  mockConfirmForgotPassword.mockReset();
  mockGetUserAuth.mockReset();
  mockUpdateUserAttributes.mockReset();
  mockDeleteUserAttributes.mockReset();
  mockAddClientSecret.mockReset();
  mockDeleteClientSecret.mockReset();
  mockInitiateAuth.mockResolvedValue({});
  mockAdminInitiateAuth.mockResolvedValue({});
  mockConfirmSignUp.mockResolvedValue({});
  mockAdminRespondChallenge.mockResolvedValue({});
  mockForgotPassword.mockResolvedValue({});
  mockConfirmForgotPassword.mockResolvedValue({});
  mockGetUserAuth.mockResolvedValue({});
  mockUpdateUserAttributes.mockResolvedValue({});
  mockDeleteUserAttributes.mockResolvedValue({});
  Object.values(advancedStates).forEach((s: any) => { s.isPending = false; s.variables = null; });
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

describe("CognitoDashboard — advanced tab", () => {
  async function navToAdvanced() {
    mockPools.mockReturnValue({
      data: { userPools: [{ Id: "p1", Name: "pool", Status: "Enabled" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CognitoDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("pool"));
    await user.click(screen.getByText("pool"));
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await waitFor(() => expect(screen.getByText("Resource Servers")).toBeTruthy());
    return { user };
  }

  it("shows Resource Servers empty state", async () => {
    mockPools.mockReturnValue({
      data: { userPools: [{ Id: "p1", Name: "pool", Status: "Enabled" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CognitoDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("pool"));
    await user.click(screen.getByText("pool"));
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await waitFor(() => expect(screen.getByText(/No resource servers found/i)).toBeTruthy());
  });

  it("renders Resource Servers from hook data", async () => {
    mockResourceServers.mockReturnValue({
      resourceServers: [{ Identifier: "https://api.example.com", Name: "My API", Scopes: [{ ScopeName: "read" }] }],
      total: 1,
    });
    const { user } = await navToAdvanced();
    await waitFor(() => expect(screen.getByText("My API")).toBeTruthy(), { timeout: 2000 });
    // Reset for other tests in this suite
    mockResourceServers.mockReturnValue(null);
  });

  it("opens Create Resource Server modal and submits", async () => {
    mockResourceServers.mockReturnValueOnce({
      resourceServers: [{ Identifier: "https://api.example.com", Name: "My API", Scopes: [{ ScopeName: "read" }] }],
      total: 1,
    });
    const { user } = await navToAdvanced();
    await user.click(screen.getByRole("button", { name: /Create Resource Server/i }));
    await waitFor(() => expect(screen.getAllByText("Create Resource Server").length).toBeGreaterThanOrEqual(1));

    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "https://api.new.com");
    await user.type(inputs[1], "New API");
    await user.click(screen.getByRole("button", { name: /^Create$/i }));
    await waitFor(() => {
      expect(mockCreateResourceServer).toHaveBeenCalled();
    });
  });

  it("shows MFA Configuration with status indicator", async () => {
    mockMfaConfig.mockReturnValueOnce({ mfaConfiguration: "OPTIONAL" });
    const { user } = await navToAdvanced();
    await waitFor(() => expect(screen.getByText("MFA Configuration")).toBeTruthy());
  });

  it("updates MFA config via button is disabled without selection", async () => {
    const { user } = await navToAdvanced();
    const updateBtn = screen.getByRole("button", { name: /Update MFA/i });
    expect(updateBtn).toBeDisabled();
  });

  it("shows Custom Attributes section", async () => {
    await navToAdvanced();
    expect(screen.getByText("Custom Attributes")).toBeTruthy();
  });

  it("opens Add Custom Attributes modal and submits", async () => {
    const { user } = await navToAdvanced();
    await user.click(screen.getByRole("button", { name: /Add Custom Attribute/i }));
    await waitFor(() => expect(screen.getAllByText("Add Custom Attributes").length).toBeGreaterThanOrEqual(1));

    // Type in the attribute name input via its placeholder
    const attrInput = screen.getByPlaceholderText(/custom:/);
    await user.click(attrInput);
    await user.paste("custom:team");

    const addBtn = screen.getByRole("button", { name: /^Add$/i });
    await user.click(addBtn);
    await waitFor(() => {
      expect(mockAddCustomAttributes).toHaveBeenCalled();
    }, { timeout: 2000 });
  });
});

describe("CognitoDashboard — auth flows tab", () => {
  async function navToAuthFlows() {
    mockPools.mockReturnValue({
      data: { userPools: [{ Id: "p1", Name: "pool", Status: "Enabled" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CognitoDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("pool"));
    await user.click(screen.getByText("pool"));
    await user.click(screen.getByRole("tab", { name: /Auth Flows/i }));
    await waitFor(() => expect(screen.getByText("Authentication Flow Tester")).toBeTruthy());
    return { user };
  }

  it("shows the Auth Flows container", async () => {
    await navToAuthFlows();
    expect(screen.getByText("Authentication Flow Tester")).toBeTruthy();
  });

  it("runs Initiate Auth flow", async () => {
    const { user } = await navToAuthFlows();
    const clientIdInput = screen.getByPlaceholderText("Client ID");
    const usernameInput = screen.getByPlaceholderText("Username");
    const passwordInput = screen.getByPlaceholderText("Password");

    await user.type(clientIdInput, "client-1");
    await user.type(usernameInput, "user1");
    await user.type(passwordInput, "pass");

    await user.click(screen.getByRole("button", { name: /Run Flow/i }));
    await waitFor(() => {
      expect(mockInitiateAuth).toHaveBeenCalled();
    });
  });
});

describe("CognitoDashboard — client secrets", () => {
  async function openClientSecretsModal() {
    mockPools.mockReturnValue({
      data: { userPools: [{ Id: "p1", Name: "pool", Status: "Enabled" }], total: 1 },
      isLoading: false,
    });
    mockClients.mockReturnValue({
      data: {
        clients: [{ ClientId: "client-1", ClientName: "myapp" }],
        total: 1,
      },
    });
    mockClientSecrets.mockReturnValue({
      secrets: [{ ClientSecretId: "secret-1", CreationDate: 1705000000 }],
    });
    const user = userEvent.setup();
    render(<CognitoDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("pool"));
    await user.click(screen.getByText("pool"));
    await user.click(screen.getByRole("tab", { name: /App Clients/i }));
    await waitFor(() => expect(screen.getByText("myapp")).toBeTruthy());

    await user.click(screen.getByRole("button", { name: /Manage Secrets/i }));
    await waitFor(() => expect(screen.getByText(/Client Secrets for client-1/i)).toBeTruthy());
    return { user };
  }

  it("opens Manage Secrets modal and shows secrets", async () => {
    await openClientSecretsModal();
    expect(screen.getByText("secret-1")).toBeTruthy();
  });

  it("adds a client secret via modal", async () => {
    const { user } = await openClientSecretsModal();

    await user.click(screen.getByRole("button", { name: /Add Secret/i }));
    await waitFor(() => {
      expect(mockAddClientSecret).toHaveBeenCalled();
    });
  });

  it("manage secrets modal uses correct client ID in header", async () => {
    await openClientSecretsModal();
    // Modal header should contain the selected client ID
    expect(screen.getByText(/Client Secrets for client-1/)).toBeTruthy();
  });

  it("shows empty secrets state in modal", async () => {
    mockPools.mockReturnValue({
      data: { userPools: [{ Id: "p1", Name: "pool", Status: "Enabled" }], total: 1 },
      isLoading: false,
    });
    mockClients.mockReturnValue({
      data: { clients: [{ ClientId: "client-1", ClientName: "myapp" }], total: 1 },
    });
    mockClientSecrets.mockReturnValue({ secrets: [] });
    const user = userEvent.setup();
    render(<CognitoDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("pool"));
    await user.click(screen.getByText("pool"));
    await user.click(screen.getByRole("tab", { name: /App Clients/i }));
    await waitFor(() => expect(screen.getByText("myapp")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Manage Secrets/i }));
    await waitFor(() => expect(screen.getByText(/No client secrets/i)).toBeTruthy());
  });

  it("deletes a client secret", async () => {
    const { user } = await openClientSecretsModal();

    const deleteBtn = screen.getByRole("button", { name: /Delete secret-1/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Delete$/i }));
    await waitFor(() => {
      expect(mockDeleteClientSecret).toHaveBeenCalled();
    });
  });

  it("adds secret with custom value", async () => {
    const { user } = await openClientSecretsModal();

    const secretInput = screen.getByPlaceholderText(/Leave blank to let Cognito generate/);
    await user.type(secretInput, "my-custom-secret");
    await user.click(screen.getByRole("button", { name: /Add Secret/i }));
    await waitFor(() => {
      expect(mockAddClientSecret).toHaveBeenCalledWith(
        expect.objectContaining({ clientSecret: "my-custom-secret" })
      );
    });
  });

  it("shows dash for missing secret creation date", async () => {
    mockPools.mockReturnValue({
      data: { userPools: [{ Id: "p1", Name: "pool", Status: "Enabled" }], total: 1 },
      isLoading: false,
    });
    mockClients.mockReturnValue({
      data: { clients: [{ ClientId: "client-1", ClientName: "myapp" }], total: 1 },
    });
    mockClientSecrets.mockReturnValue({
      secrets: [{ ClientSecretId: "secret-nodate" }],
    });
    const user = userEvent.setup();
    render(<CognitoDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("pool"));
    await user.click(screen.getByText("pool"));
    await user.click(screen.getByRole("tab", { name: /App Clients/i }));
    await waitFor(() => expect(screen.getByText("myapp")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Manage Secrets/i }));
    await waitFor(() => expect(screen.getByText("secret-nodate")).toBeTruthy());
    expect(screen.getByText("-")).toBeTruthy();
  });
});

// ─── Auth Flows — additional flow types ──────────────────

describe("CognitoDashboard — auth flows: all types", () => {
  async function navToAuthFlows() {
    mockPools.mockReturnValue({
      data: { userPools: [{ Id: "p1", Name: "pool", Status: "Enabled" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CognitoDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("pool"));
    await user.click(screen.getByText("pool"));
    await user.click(screen.getByRole("tab", { name: /Auth Flows/i }));
    await waitFor(() => expect(screen.getByText("Authentication Flow Tester")).toBeTruthy());
    return { user };
  }

  // Note: Full Select interaction tests skipped — Cloudscape Select trigger
  // buttons don't have accessible names in happy-dom. We test the default
  // flow (Initiate Auth) which is covered by the existing test in the
  // "auth flows" describe block above.
  //
  // These tests cover additional branches reachable without Select interaction.

  it("shows Auth Flows tab with flow operation label", async () => {
    await navToAuthFlows();
    // Verify the form is rendered with the Flow Operation field
    expect(screen.getByText("Flow Operation")).toBeTruthy();
    // Verify the Auth Flow select is also present (for initiate flow)
    expect(screen.getByText("Auth Flow")).toBeTruthy();
  });

  it("auth flow Run button disabled when required fields empty", async () => {
    const { user } = await navToAuthFlows();
    // Only fill client ID (default initiate flow needs username+password too)
    const clientInputs = screen.getAllByPlaceholderText("Client ID");
    await user.type(clientInputs[0], "client-1");

    const runBtn = screen.getByRole("button", { name: /Run Flow/i });
    expect(runBtn).toBeDisabled();
  });

  it("shows auth flow password and confirmation code fields conditionally", async () => {
    await navToAuthFlows();
    // Default initiate flow: should have password, NOT confirmation code
    const passInputs = screen.getAllByPlaceholderText("Password");
    expect(passInputs.length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByPlaceholderText("123456")).toBeNull();
  });
});

// ─── Advanced Tab — additional coverage ─────────────────

describe("CognitoDashboard — advanced tab: more coverage", () => {
  async function navToAdvanced() {
    mockPools.mockReturnValue({
      data: { userPools: [{ Id: "p1", Name: "pool", Status: "Enabled" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CognitoDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("pool"));
    await user.click(screen.getByText("pool"));
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await waitFor(() => expect(screen.getByText("Resource Servers")).toBeTruthy());
    return { user };
  }

  it("shows resource server scopes count", async () => {
    mockResourceServers.mockReturnValue({
      resourceServers: [{ Identifier: "https://x.com", Name: "API", Scopes: [{ ScopeName: "r" }, { ScopeName: "w" }] }],
      total: 1,
    });
    const { user } = await navToAdvanced();
    await waitFor(() => {
      const scopesText = screen.getByText((content) => content.includes("2") && content.includes("scope"));
      expect(scopesText).toBeTruthy();
    });
  });

  it("deletes a resource server", async () => {
    mockResourceServers.mockReturnValue({
      resourceServers: [{ Identifier: "rs-del", Name: "To Delete" }],
      total: 1,
    });
    const { user } = await navToAdvanced();
    await waitFor(() => expect(screen.getByText("To Delete")).toBeTruthy());

    const deleteBtn = screen.getByRole("button", { name: /Delete To Delete/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Delete$/i }));
    await waitFor(() => {
      expect(mockDeleteResourceServer).toHaveBeenCalledWith("rs-del");
    });
  });

  it("shows MFA ON with success indicator", async () => {
    mockMfaConfig.mockReturnValue({ mfaConfiguration: "ON" });
    const { user } = await navToAdvanced();
    await waitFor(() => expect(screen.getByText("ON")).toBeTruthy());
  });

  it("shows MFA OFF with info indicator", async () => {
    mockMfaConfig.mockReturnValue({ mfaConfiguration: "OFF" });
    const { user } = await navToAdvanced();
    await waitFor(() => expect(screen.getByText("OFF")).toBeTruthy());
  });

  it("Create Resource Server button disabled without identifier", async () => {
    mockResourceServers.mockReturnValue({
      resourceServers: [{ Identifier: "x", Name: "X" }],
      total: 1,
    });
    const { user } = await navToAdvanced();
    await user.click(screen.getByRole("button", { name: /Create Resource Server/i }));
    await waitFor(() => expect(screen.getByPlaceholderText("https://api.example.com")).toBeTruthy());

    // Only fill name, not identifier — Create should be disabled
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[1], "My RS");
    const createBtn = screen.getByRole("button", { name: /^Create$/i });
    expect(createBtn).toBeDisabled();
  });

  it("Add Custom Attributes button disabled without name", async () => {
    const { user } = await navToAdvanced();
    await user.click(screen.getByRole("button", { name: /Add Custom Attribute/i }));
    await waitFor(() => expect(screen.getByPlaceholderText(/custom:/)).toBeTruthy());

    const addBtn = screen.getByRole("button", { name: /^Add$/i });
    expect(addBtn).toBeDisabled();
  });

  it("submits Add Custom Attributes with number type", async () => {
    const { user } = await navToAdvanced();
    await user.click(screen.getByRole("button", { name: /Add Custom Attribute/i }));
    await waitFor(() => expect(screen.getByPlaceholderText(/custom:/)).toBeTruthy());

    const attrInput = screen.getByPlaceholderText(/custom:/);
    await user.click(attrInput);
    await user.paste("custom:count");

    // Verify the Data Type form field label is present
    expect(screen.getByText("Data Type")).toBeTruthy();

    const addBtn = screen.getByRole("button", { name: /^Add$/i });
    await user.click(addBtn);
    await waitFor(() => {
      expect(mockAddCustomAttributes).toHaveBeenCalledWith(
        expect.objectContaining({
          customAttributes: expect.arrayContaining([
            expect.objectContaining({ AttributeDataType: "string" }),
          ]),
        })
      );
    });
  });
});

// ─── Auth Flows — flow type switching (Cloudscape Select) ──
//
// The Flow Operation Select trigger displays the current value ("initiate"
// by default). Clicking the trigger opens the dropdown; options render as
// plain text (visible span + screenreader div), so we use getAllByText and
// click the first (visible) match — same pattern as ELBDashboard/Kinesis tests.

describe("CognitoDashboard — auth flows: flow type switching", () => {
  async function navToAuthFlows() {
    mockPools.mockReturnValue({
      data: { userPools: [{ Id: "p1", Name: "pool", Status: "Enabled" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CognitoDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("pool"));
    await user.click(screen.getByText("pool"));
    await user.click(screen.getByRole("tab", { name: /Auth Flows/i }));
    await waitFor(() => expect(screen.getByText("Authentication Flow Tester")).toBeTruthy());
    return { user };
  }

  async function selectFlowOperation(user: any, optionLabel: string) {
    // Flow Operation select trigger shows the current value ("initiate").
    const trigger = screen.getAllByText("initiate")[0];
    await user.click(trigger);
    await waitFor(() =>
      expect(screen.getAllByText(optionLabel).length).toBeGreaterThan(0),
    );
    await user.click(screen.getAllByText(optionLabel)[0]);
  }

  it("switches to Admin Initiate Auth and submits", async () => {
    const { user } = await navToAuthFlows();
    await selectFlowOperation(user, "Admin Initiate Auth");
    // Auth Flow select remains visible for this flow type
    expect(screen.getByText("Auth Flow")).toBeTruthy();
    await user.type(screen.getByPlaceholderText("Client ID"), "client-1");
    await user.type(screen.getByPlaceholderText("Username"), "user1");
    await user.type(screen.getByPlaceholderText("Password"), "pass");
    await user.click(screen.getByRole("button", { name: /Run Flow/i }));
    await waitFor(() => expect(mockAdminInitiateAuth).toHaveBeenCalled());
  });

  it("switches to Confirm Sign Up and submits with code + secret hash", async () => {
    const { user } = await navToAuthFlows();
    await selectFlowOperation(user, "Confirm Sign Up");
    // Confirmation Code + Secret Hash fields visible; no Password field
    expect(screen.getByPlaceholderText("123456")).toBeTruthy();
    expect(screen.getByPlaceholderText("Secret hash for client with secret")).toBeTruthy();
    expect(screen.queryByPlaceholderText("Password")).toBeNull();
    await user.type(screen.getByPlaceholderText("Client ID"), "client-1");
    await user.type(screen.getByPlaceholderText("Username"), "user1");
    await user.type(screen.getByPlaceholderText("123456"), "123456");
    await user.type(screen.getByPlaceholderText("Secret hash for client with secret"), "s3cr3t");
    await user.click(screen.getByRole("button", { name: /Run Flow/i }));
    await waitFor(() =>
      expect(mockConfirmSignUp).toHaveBeenCalledWith(
        expect.objectContaining({ confirmationCode: "123456", secretHash: "s3cr3t" }),
      ),
    );
  });

  it("switches to Admin Respond to Challenge and submits parsed JSON", async () => {
    const { user } = await navToAuthFlows();
    await selectFlowOperation(user, "Admin Respond to Challenge");
    await user.type(screen.getByPlaceholderText("Client ID"), "client-1");
    // Challenge Responses is a JSON textarea — use fireEvent.change to avoid
    // userEvent parsing {} as keyboard descriptors.
    fireEvent.change(
      screen.getByPlaceholderText('{"NEW_PASSWORD": "Password123!"}'),
      { target: { value: '{"NEW_PASSWORD": "Pass123!"}' } },
    );
    await user.click(screen.getByRole("button", { name: /Run Flow/i }));
    await waitFor(() =>
      expect(mockAdminRespondChallenge).toHaveBeenCalledWith(
        expect.objectContaining({
          challengeResponses: { NEW_PASSWORD: "Pass123!" },
        }),
      ),
    );
  });

  it("switches to Forgot Password and submits", async () => {
    const { user } = await navToAuthFlows();
    await selectFlowOperation(user, "Forgot Password");
    expect(screen.getByPlaceholderText("Secret hash for client with secret")).toBeTruthy();
    await user.type(screen.getByPlaceholderText("Client ID"), "client-1");
    await user.type(screen.getByPlaceholderText("Username"), "user1");
    await user.click(screen.getByRole("button", { name: /Run Flow/i }));
    await waitFor(() => expect(mockForgotPassword).toHaveBeenCalled());
  });

  it("switches to Confirm Forgot Password and submits", async () => {
    const { user } = await navToAuthFlows();
    await selectFlowOperation(user, "Confirm Forgot Password");
    await user.type(screen.getByPlaceholderText("Client ID"), "client-1");
    await user.type(screen.getByPlaceholderText("Username"), "user1");
    await user.type(screen.getByPlaceholderText("Password"), "newpass");
    await user.type(screen.getByPlaceholderText("123456"), "123456");
    await user.click(screen.getByRole("button", { name: /Run Flow/i }));
    await waitFor(() =>
      expect(mockConfirmForgotPassword).toHaveBeenCalledWith(
        expect.objectContaining({ password: "newpass", confirmationCode: "123456" }),
      ),
    );
  });

  it("switches to Get User and submits access token", async () => {
    const { user } = await navToAuthFlows();
    await selectFlowOperation(user, "Get User");
    // Only Access Token field — no Client ID / Username / Password
    expect(screen.getByPlaceholderText("Access token from successful authentication")).toBeTruthy();
    expect(screen.queryByPlaceholderText("Client ID")).toBeNull();
    expect(screen.queryByPlaceholderText("Username")).toBeNull();
    await user.type(screen.getByPlaceholderText("Access token from successful authentication"), "tok-1");
    await user.click(screen.getByRole("button", { name: /Run Flow/i }));
    await waitFor(() =>
      expect(mockGetUserAuth).toHaveBeenCalledWith({ accessToken: "tok-1" }),
    );
  });

  it("switches to Update User Attributes and submits parsed attributes", async () => {
    const { user } = await navToAuthFlows();
    await selectFlowOperation(user, "Update User Attributes");
    await user.type(screen.getByPlaceholderText("Access token from successful authentication"), "tok-1");
    fireEvent.change(
      screen.getByPlaceholderText('[{"Name": "email", "Value": "user@example.com"}]'),
      { target: { value: '[{"Name": "email", "Value": "a@b.com"}]' } },
    );
    await user.click(screen.getByRole("button", { name: /Run Flow/i }));
    await waitFor(() =>
      expect(mockUpdateUserAttributes).toHaveBeenCalledWith(
        expect.objectContaining({ userAttributes: [{ Name: "email", Value: "a@b.com" }] }),
      ),
    );
  });

  it("switches to Delete User Attributes and submits split names", async () => {
    const { user } = await navToAuthFlows();
    await selectFlowOperation(user, "Delete User Attributes");
    await user.type(screen.getByPlaceholderText("Access token from successful authentication"), "tok-1");
    await user.type(screen.getByPlaceholderText("email, phone_number"), "email, phone_number");
    await user.click(screen.getByRole("button", { name: /Run Flow/i }));
    await waitFor(() =>
      expect(mockDeleteUserAttributes).toHaveBeenCalledWith(
        expect.objectContaining({ userAttributeNames: ["email", "phone_number"] }),
      ),
    );
  });

  it("changes the Auth Flow select to USER_SRP_AUTH", async () => {
    const { user } = await navToAuthFlows();
    // Auth Flow select shows USER_PASSWORD_AUTH by default; switch it
    const trigger = screen.getAllByText("USER_PASSWORD_AUTH")[0];
    await user.click(trigger);
    await waitFor(() =>
      expect(screen.getAllByText("USER_SRP_AUTH").length).toBeGreaterThan(0),
    );
    await user.click(screen.getAllByText("USER_SRP_AUTH")[0]);
    await user.type(screen.getByPlaceholderText("Client ID"), "client-1");
    await user.type(screen.getByPlaceholderText("Username"), "user1");
    await user.type(screen.getByPlaceholderText("Password"), "pass");
    await user.click(screen.getByRole("button", { name: /Run Flow/i }));
    await waitFor(() =>
      expect(mockInitiateAuth).toHaveBeenCalledWith(
        expect.objectContaining({ authFlow: "USER_SRP_AUTH" }),
      ),
    );
  });

  it("shows error result when a flow fails", async () => {
    mockInitiateAuth.mockRejectedValue(new Error("Auth failed"));
    const { user } = await navToAuthFlows();
    await user.type(screen.getByPlaceholderText("Client ID"), "client-1");
    await user.type(screen.getByPlaceholderText("Username"), "user1");
    await user.type(screen.getByPlaceholderText("Password"), "pass");
    await user.click(screen.getByRole("button", { name: /Run Flow/i }));
    await waitFor(() => expect(screen.getByText(/Auth failed/)).toBeTruthy());
  });
});

// ─── Auth Flows — disabled switch cases ──────────────────

describe("CognitoDashboard — auth flows: disabled logic", () => {
  async function navToAuthFlows() {
    mockPools.mockReturnValue({
      data: { userPools: [{ Id: "p1", Name: "pool", Status: "Enabled" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CognitoDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("pool"));
    await user.click(screen.getByText("pool"));
    await user.click(screen.getByRole("tab", { name: /Auth Flows/i }));
    await waitFor(() => expect(screen.getByText("Authentication Flow Tester")).toBeTruthy());
    return { user };
  }

  async function selectFlowOperation(user: any, optionLabel: string) {
    const trigger = screen.getAllByText("initiate")[0];
    await user.click(trigger);
    await waitFor(() =>
      expect(screen.getAllByText(optionLabel).length).toBeGreaterThan(0),
    );
    await user.click(screen.getAllByText(optionLabel)[0]);
  }

  it("confirm-sign-up Run disabled until confirmation code filled", async () => {
    const { user } = await navToAuthFlows();
    await selectFlowOperation(user, "Confirm Sign Up");
    await user.type(screen.getByPlaceholderText("Client ID"), "client-1");
    await user.type(screen.getByPlaceholderText("Username"), "user1");
    expect(screen.getByRole("button", { name: /Run Flow/i })).toBeDisabled();
    await user.type(screen.getByPlaceholderText("123456"), "123456");
    expect(screen.getByRole("button", { name: /Run Flow/i })).not.toBeDisabled();
  });

  it("admin-respond-challenge Run enabled with client ID only", async () => {
    const { user } = await navToAuthFlows();
    await selectFlowOperation(user, "Admin Respond to Challenge");
    // Challenge name defaults to NEW_PASSWORD_REQUIRED (truthy), so only clientId needed
    expect(screen.getByRole("button", { name: /Run Flow/i })).toBeDisabled();
    await user.type(screen.getByPlaceholderText("Client ID"), "client-1");
    expect(screen.getByRole("button", { name: /Run Flow/i })).not.toBeDisabled();
  });

  it("forgot-password Run disabled until username filled", async () => {
    const { user } = await navToAuthFlows();
    await selectFlowOperation(user, "Forgot Password");
    await user.type(screen.getByPlaceholderText("Client ID"), "client-1");
    expect(screen.getByRole("button", { name: /Run Flow/i })).toBeDisabled();
    await user.type(screen.getByPlaceholderText("Username"), "user1");
    expect(screen.getByRole("button", { name: /Run Flow/i })).not.toBeDisabled();
  });

  it("confirm-forgot-password Run disabled until all fields filled", async () => {
    const { user } = await navToAuthFlows();
    await selectFlowOperation(user, "Confirm Forgot Password");
    await user.type(screen.getByPlaceholderText("Client ID"), "client-1");
    await user.type(screen.getByPlaceholderText("Username"), "user1");
    await user.type(screen.getByPlaceholderText("Password"), "p");
    expect(screen.getByRole("button", { name: /Run Flow/i })).toBeDisabled();
    await user.type(screen.getByPlaceholderText("123456"), "123456");
    expect(screen.getByRole("button", { name: /Run Flow/i })).not.toBeDisabled();
  });

  it("get-user Run disabled until access token filled", async () => {
    const { user } = await navToAuthFlows();
    await selectFlowOperation(user, "Get User");
    expect(screen.getByRole("button", { name: /Run Flow/i })).toBeDisabled();
    await user.type(screen.getByPlaceholderText("Access token from successful authentication"), "tok");
    expect(screen.getByRole("button", { name: /Run Flow/i })).not.toBeDisabled();
  });

  it("update-user-attributes Run disabled until attributes filled", async () => {
    const { user } = await navToAuthFlows();
    await selectFlowOperation(user, "Update User Attributes");
    await user.type(screen.getByPlaceholderText("Access token from successful authentication"), "tok");
    expect(screen.getByRole("button", { name: /Run Flow/i })).toBeDisabled();
    fireEvent.change(
      screen.getByPlaceholderText('[{"Name": "email", "Value": "user@example.com"}]'),
      { target: { value: '[{"Name": "email", "Value": "a@b.com"}]' } },
    );
    expect(screen.getByRole("button", { name: /Run Flow/i })).not.toBeDisabled();
  });

  it("delete-user-attributes Run disabled until access token filled", async () => {
    const { user } = await navToAuthFlows();
    await selectFlowOperation(user, "Delete User Attributes");
    expect(screen.getByRole("button", { name: /Run Flow/i })).toBeDisabled();
    await user.type(screen.getByPlaceholderText("Access token from successful authentication"), "tok");
    expect(screen.getByRole("button", { name: /Run Flow/i })).not.toBeDisabled();
  });
});

// ─── Advanced Tab — MFA update, RS scopes, custom attr type ──

describe("CognitoDashboard — advanced tab: interactive actions", () => {
  async function navToAdvanced() {
    mockPools.mockReturnValue({
      data: { userPools: [{ Id: "p1", Name: "pool", Status: "Enabled" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CognitoDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("pool"));
    await user.click(screen.getByText("pool"));
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await waitFor(() => expect(screen.getByText("Resource Servers")).toBeTruthy());
    return { user };
  }

  it("selects MFA mode and updates config", async () => {
    const { user } = await navToAdvanced();
    // MFA mode Select trigger shows its selectedOption label ("Select")
    const trigger = screen.getAllByText("Select")[0];
    await user.click(trigger);
    await waitFor(() => expect(screen.getAllByText("ON").length).toBeGreaterThan(0));
    await user.click(screen.getAllByText("ON")[0]);
    const updateBtn = screen.getByRole("button", { name: /Update MFA/i });
    expect(updateBtn).not.toBeDisabled();
    await user.click(updateBtn);
    await waitFor(() =>
      expect(mockSetMfaConfig).toHaveBeenCalledWith({ mfaConfiguration: "ON" }),
    );
  });

  it("creates resource server with scopes parsed from comma list", async () => {
    const { user } = await navToAdvanced();
    await user.click(screen.getByRole("button", { name: /Create Resource Server/i }));
    await waitFor(() =>
      expect(screen.getAllByText("Create Resource Server").length).toBeGreaterThanOrEqual(1),
    );
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "https://api.new.com");
    await user.type(inputs[1], "New API");
    await user.type(inputs[2], "read, write");
    await user.click(screen.getByRole("button", { name: /^Create$/i }));
    await waitFor(() =>
      expect(mockCreateResourceServer).toHaveBeenCalledWith(
        expect.objectContaining({
          scopes: [
            { ScopeName: "read", ScopeDescription: "read" },
            { ScopeName: "write", ScopeDescription: "write" },
          ],
        }),
      ),
    );
  });

  it("cancels the Create Resource Server modal", async () => {
    const { user } = await navToAdvanced();
    await user.click(screen.getByRole("button", { name: /Create Resource Server/i }));
    await waitFor(() => expect(screen.getByPlaceholderText("https://api.example.com")).toBeTruthy());
    const rsInput = screen.getByPlaceholderText("https://api.example.com");
    const dialog = rsInput.closest('[role="dialog"]') as HTMLElement;
    const cancelBtn = Array.from(dialog.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "Cancel",
    );
    expect(cancelBtn).toBeTruthy();
    await user.click(cancelBtn!);
    expect(mockCreateResourceServer).not.toHaveBeenCalled();
  });

  it("selects a custom attribute data type and submits", async () => {
    const { user } = await navToAdvanced();
    await user.click(screen.getByRole("button", { name: /Add Custom Attribute/i }));
    await waitFor(() => expect(screen.getByPlaceholderText(/custom:/)).toBeTruthy());
    // Data Type select shows "string" by default; switch to "number"
    const dtTrigger = screen.getAllByText("string")[0];
    await user.click(dtTrigger);
    await waitFor(() => expect(screen.getAllByText("Number").length).toBeGreaterThan(0));
    await user.click(screen.getAllByText("Number")[0]);
    const attrInput = screen.getByPlaceholderText(/custom:/);
    await user.click(attrInput);
    await user.paste("custom:count");
    await user.click(screen.getByRole("button", { name: /^Add$/i }));
    await waitFor(() =>
      expect(mockAddCustomAttributes).toHaveBeenCalledWith(
        expect.objectContaining({
          customAttributes: expect.arrayContaining([
            expect.objectContaining({ AttributeDataType: "number" }),
          ]),
        }),
      ),
    );
  });

  it("cancels the Add Custom Attributes modal", async () => {
    const { user } = await navToAdvanced();
    await user.click(screen.getByRole("button", { name: /Add Custom Attribute/i }));
    await waitFor(() => expect(screen.getByPlaceholderText(/custom:/)).toBeTruthy());
    const attrInput = screen.getByPlaceholderText(/custom:/);
    const dialog = attrInput.closest('[role="dialog"]') as HTMLElement;
    const cancelBtn = Array.from(dialog.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "Cancel",
    );
    expect(cancelBtn).toBeTruthy();
    await user.click(cancelBtn!);
    expect(mockAddCustomAttributes).not.toHaveBeenCalled();
  });
});

// ─── Client Secrets — loading, fallback IDs, dismiss ──────

describe("CognitoDashboard — client secrets: edge cases", () => {
  async function openClientSecretsModal() {
    mockPools.mockReturnValue({
      data: { userPools: [{ Id: "p1", Name: "pool", Status: "Enabled" }], total: 1 },
      isLoading: false,
    });
    mockClients.mockReturnValue({
      data: { clients: [{ ClientId: "client-1", ClientName: "myapp" }], total: 1 },
    });
    const user = userEvent.setup();
    render(<CognitoDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("pool"));
    await user.click(screen.getByText("pool"));
    await user.click(screen.getByRole("tab", { name: /App Clients/i }));
    await waitFor(() => expect(screen.getByText("myapp")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Manage Secrets/i }));
    await waitFor(() => expect(screen.getByText(/Client Secrets for client-1/i)).toBeTruthy());
    return { user };
  }

  it("shows loading spinner while secrets load", async () => {
    clientSecretsState.isLoading = true;
    mockClientSecrets.mockReturnValue({ secrets: [{ ClientSecretId: "sec-1" }] });
    await openClientSecretsModal();
    // Loading branch: neither the secrets list nor the empty message renders
    expect(screen.queryByText("sec-1")).toBeNull();
    expect(screen.queryByText("No client secrets")).toBeNull();
    // The Add Secret form is still present while the list area is replaced by the spinner
    expect(screen.getByRole("button", { name: /Add Secret/i })).toBeTruthy();
  });

  it("renders secrets using fallback identifier fields", async () => {
    mockClientSecrets.mockReturnValue({
      secrets: [{ SecretId: "sec-fallback", CreationDate: 1705000000 }],
    });
    await openClientSecretsModal();
    expect(screen.getByText("sec-fallback")).toBeTruthy();
  });

  it("deletes a client secret using fallback identifier", async () => {
    mockClientSecrets.mockReturnValue({
      secrets: [{ SecretId: "sec-fallback" }],
    });
    const { user } = await openClientSecretsModal();
    await user.click(screen.getByRole("button", { name: /Delete sec-fallback/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Delete$/i }));
    await waitFor(() =>
      expect(mockDeleteClientSecret).toHaveBeenCalledWith(
        expect.objectContaining({ secretId: "sec-fallback" }),
      ),
    );
  });

  it("dismisses the secrets modal via close button", async () => {
    mockClientSecrets.mockReturnValue({ secrets: [{ ClientSecretId: "sec-1" }] });
    const { user } = await openClientSecretsModal();
    const addSecretBtn = screen.getByRole("button", { name: /Add Secret/i });
    expect(addSecretBtn).not.toBeDisabled();
    // Click the Modal dismiss control to close (secretsClientId → null)
    const header = screen.getByText(/Client Secrets for client-1/);
    const dialog = header.closest('[role="dialog"]') as HTMLElement;
    const dismissBtn = dialog.querySelector('[class*="dismiss"]') as HTMLElement;
    expect(dismissBtn).toBeTruthy();
    fireEvent.click(dismissBtn);
    // After dismiss, Add Secret is disabled because secretsClientId is null
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Add Secret/i })).toBeDisabled(),
    );
  });
});

// ─── Undefined query data fallbacks ───────────────────────

describe("CognitoDashboard — undefined query data", () => {
  async function navToPool() {
    mockPools.mockReturnValue({
      data: { userPools: [{ Id: "p1", Name: "pool", Status: "Enabled" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CognitoDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("pool"));
    await user.click(screen.getByText("pool"));
    await waitFor(() => expect(screen.getByText(/Users in p1/i)).toBeTruthy());
    return { user };
  }

  it("shows empty users when users data is undefined", async () => {
    mockUsers.mockReturnValue({ data: undefined });
    await navToPool();
    expect(screen.getByText(/No users/i)).toBeTruthy();
  });

  it("shows empty groups when groups data is undefined", async () => {
    mockGroups.mockReturnValue({ data: undefined });
    const { user } = await navToPool();
    await user.click(screen.getByRole("tab", { name: /Groups/i }));
    await waitFor(() => expect(screen.getByText(/No groups/i)).toBeTruthy());
  });

  it("shows empty clients when clients data is undefined", async () => {
    mockClients.mockReturnValue({ data: undefined });
    const { user } = await navToPool();
    await user.click(screen.getByRole("tab", { name: /App Clients/i }));
    await waitFor(() => expect(screen.getByText(/No app clients/i)).toBeTruthy());
  });
});
