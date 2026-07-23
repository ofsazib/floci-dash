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

const advancedStates = vi.hoisted(() => ({
  createResourceServer: { isPending: false },
  deleteResourceServer: { isPending: false, variables: null as string | null },
  setMfaConfig: { isPending: false },
  addCustomAttributes: { isPending: false },
  initiateAuth: { isPending: false },
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
  useAdminInitiateAuth: () => ({ mutate: vi.fn(), mutateAsync: vi.fn().mockResolvedValue({}), isPending: false }),
  useConfirmSignUp: () => ({ mutate: vi.fn(), mutateAsync: vi.fn().mockResolvedValue({}), isPending: false }),
  useAdminRespondToAuthChallenge: () => ({ mutate: vi.fn(), mutateAsync: vi.fn().mockResolvedValue({}), isPending: false }),
  useForgotPassword: () => ({ mutate: vi.fn(), mutateAsync: vi.fn().mockResolvedValue({}), isPending: false }),
  useConfirmForgotPassword: () => ({ mutate: vi.fn(), mutateAsync: vi.fn().mockResolvedValue({}), isPending: false }),
  useGetUser: () => ({ mutate: vi.fn(), mutateAsync: vi.fn().mockResolvedValue({}), isPending: false }),
  useUpdateUserAttributes: () => ({ mutate: vi.fn(), mutateAsync: vi.fn().mockResolvedValue({}), isPending: false }),
  useDeleteUserAttributes: () => ({ mutate: vi.fn(), mutateAsync: vi.fn().mockResolvedValue({}), isPending: false }),
  useUserPoolClientSecrets: (...args: any[]) => ({
    data: mockClientSecrets(args[0], args[1]) || { secrets: [] },
    isLoading: false,
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
  mockAddClientSecret.mockReset();
  mockDeleteClientSecret.mockReset();
  mockInitiateAuth.mockResolvedValue({});
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
});
