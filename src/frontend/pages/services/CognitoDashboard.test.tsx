// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

const mockPools = vi.fn();
const mockDeletePool = vi.fn();
const mockUsers = vi.fn();
const mockGroups = vi.fn();
const mockClients = vi.fn();

const deletePoolState = vi.hoisted(() => ({
  isPending: false,
  variables: null as string | null,
}));

vi.mock("../../hooks/useCognito", () => ({
  useCognitoUserPools: (...args: any[]) => mockPools(...args),
  useDeleteCognitoUserPool: () => ({
    mutateAsync: mockDeletePool,
    isPending: deletePoolState.isPending,
    variables: deletePoolState.variables,
  }),
  useCognitoUsers: (...args: any[]) => mockUsers(...args),
  useCognitoGroups: (...args: any[]) => mockGroups(...args),
  useCognitoUserPoolClients: (...args: any[]) => mockClients(...args),
  useCreateCognitoUserPool: () => ({ mutate: vi.fn(), isPending: false }),
}));

import { CognitoDashboard } from "./CognitoDashboard";

beforeEach(() => {
  vi.clearAllMocks();
  deletePoolState.isPending = false;
  deletePoolState.variables = null;

  mockPools.mockReturnValue({ data: { userPools: [], total: 0 }, isLoading: false });
  mockUsers.mockReturnValue({ data: { users: [], total: 0 } });
  mockGroups.mockReturnValue({ data: { groups: [], total: 0 } });
  mockClients.mockReturnValue({ data: { clients: [], total: 0 } });
});

describe("CognitoDashboard", () => {
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

  it("shows back button in detail", async () => {
    mockPools.mockReturnValue({
      data: { userPools: [{ Id: "p1", Name: "pool", Status: "Enabled" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CognitoDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("pool"));
    await user.click(screen.getByText("pool"));
    await waitFor(() => expect(screen.getByText(/Back to user pools/i)).toBeTruthy());
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

  it("renders groups tab data", async () => {
    mockGroups.mockReturnValue({
      data: {
        groups: [{ GroupName: "admins", Description: "Admin group", Precedence: 1, RoleArn: "arn:aws:iam::123:role/admin" }],
        total: 1,
      },
    });
    mockPools.mockReturnValue({
      data: { userPools: [{ Id: "p1", Name: "pool", Status: "Enabled" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CognitoDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("pool"));
    await user.click(screen.getByText("pool"));
    await user.click(screen.getByRole("tab", { name: /Groups/i }));
    await waitFor(() => expect(screen.getByText("admins")).toBeTruthy());
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

  it("shows user detail with creation date", async () => {
    mockPools.mockReturnValue({
      data: { userPools: [{ Id: "p1", Name: "pool", Status: "Enabled" }], total: 1 },
      isLoading: false,
    });
    mockUsers.mockReturnValue({
      data: {
        users: [{ Username: "alice", UserStatus: "CONFIRMED", Enabled: true, UserCreateDate: 1705000000 }],
        total: 1,
      },
    });
    const user = userEvent.setup();
    render(<CognitoDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("pool"));
    await user.click(screen.getByText("pool"));
    await waitFor(() => expect(screen.getByText("alice")).toBeTruthy());
    // Enabled → "Yes"
    expect(screen.getByText("Yes")).toBeTruthy();
  });

  it("shows groups detail with required fields", async () => {
    mockPools.mockReturnValue({
      data: { userPools: [{ Id: "p1", Name: "pool", Status: "Enabled" }], total: 1 },
      isLoading: false,
    });
    mockGroups.mockReturnValue({
      data: {
        groups: [{ GroupName: "admins", Description: "Admin group", Precedence: 1, RoleArn: "arn:aws:iam::123:role/admin" }],
        total: 1,
      },
    });
    const user = userEvent.setup();
    render(<CognitoDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("pool"));
    await user.click(screen.getByText("pool"));
    await user.click(screen.getByRole("tab", { name: /Groups/i }));
    await waitFor(() => expect(screen.getByText("admins")).toBeTruthy());
    expect(screen.getByText("Admin group")).toBeTruthy();
    expect(screen.getByText("arn:aws:iam::123:role/admin")).toBeTruthy();
  });

  it("shows groups with missing fields as dash", async () => {
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
    // Description: g.Description || "-", RoleArn: g.RoleArn || "-"
    const dashes = screen.getAllByText("-");
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  it("shows app clients detail", async () => {
    mockPools.mockReturnValue({
      data: { userPools: [{ Id: "p1", Name: "pool", Status: "Enabled" }], total: 1 },
      isLoading: false,
    });
    mockClients.mockReturnValue({
      data: {
        clients: [{ ClientId: "client-1", ClientName: "my-app", CreationDate: 1705000000 }],
        total: 1,
      },
    });
    const user = userEvent.setup();
    render(<CognitoDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("pool"));
    await user.click(screen.getByText("pool"));
    await user.click(screen.getByRole("tab", { name: /App Clients/i }));
    await waitFor(() => expect(screen.getByText("my-app")).toBeTruthy());
    expect(screen.getByText("client-1")).toBeTruthy();
  });
});
