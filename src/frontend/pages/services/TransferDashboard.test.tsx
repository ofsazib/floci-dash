// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

// ─── vi.hoisted mutable states ──────────────────────────

const createServerState = vi.hoisted(() => ({
  isPending: false,
  isError: false,
  error: null as Error | null,
}));

const deleteServerState = vi.hoisted(() => ({
  isPending: false,
  variables: null as string | null,
}));

const startServerState = vi.hoisted(() => ({
  isPending: false,
  variables: null as string | null,
}));

const stopServerState = vi.hoisted(() => ({
  isPending: false,
  variables: null as string | null,
}));

const createUserState = vi.hoisted(() => ({
  isPending: false,
  isError: false,
  error: null as Error | null,
}));

const deleteUserState = vi.hoisted(() => ({
  isPending: false,
  variables: null as { userName: string } | null,
}));

// ─── Mock hooks ─────────────────────────────────────────

const mockServers = vi.fn();
const mockUsers = vi.fn();
const mockCreateServer = vi.fn();
const mockDeleteServer = vi.fn();
const mockStartServer = vi.fn();
const mockStopServer = vi.fn();
const mockCreateUser = vi.fn();
const mockDeleteUser = vi.fn();

vi.mock("../../hooks/useTransfer", () => ({
  useTransferServers: (...args: any[]) => mockServers(...args),
  useTransferServer: (...args: any[]) => ({ data: undefined, isLoading: false }),
  useTransferUsers: (...args: any[]) => mockUsers(...args),
  useCreateTransferServer: () => ({
    mutate: mockCreateServer,
    get isPending() { return createServerState.isPending; },
    get isError() { return createServerState.isError; },
    get error() { return createServerState.error; },
  }),
  useDeleteTransferServer: () => ({
    mutateAsync: mockDeleteServer,
    get isPending() { return deleteServerState.isPending; },
    get variables() { return deleteServerState.variables; },
  }),
  useStartTransferServer: () => ({
    mutate: mockStartServer,
    get isPending() { return startServerState.isPending; },
    get variables() { return startServerState.variables; },
  }),
  useStopTransferServer: () => ({
    mutate: mockStopServer,
    get isPending() { return stopServerState.isPending; },
    get variables() { return stopServerState.variables; },
  }),
  useCreateTransferUser: () => ({
    mutate: mockCreateUser,
    get isPending() { return createUserState.isPending; },
    get isError() { return createUserState.isError; },
    get error() { return createUserState.error; },
  }),
  useDeleteTransferUser: () => ({
    mutateAsync: mockDeleteUser,
    get isPending() { return deleteUserState.isPending; },
    get variables() { return deleteUserState.variables; },
  }),
  useTransferTags: (...args: any[]) => ({ data: undefined, isLoading: false }),
}));

import { TransferDashboard } from "./TransferDashboard";

beforeEach(() => {
  vi.clearAllMocks();
  createServerState.isPending = false;
  createServerState.isError = false;
  createServerState.error = null;
  deleteServerState.isPending = false;
  deleteServerState.variables = null;
  startServerState.isPending = false;
  startServerState.variables = null;
  stopServerState.isPending = false;
  stopServerState.variables = null;
  createUserState.isPending = false;
  createUserState.isError = false;
  createUserState.error = null;
  deleteUserState.isPending = false;
  deleteUserState.variables = null;

  mockServers.mockReturnValue({ data: { servers: [], total: 0 }, isLoading: false });
  mockUsers.mockReturnValue({ data: { users: [], total: 0 }, isLoading: false });
});

describe("TransferDashboard — servers", () => {
  it("shows loading skeleton", () => {
    mockServers.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = render(<TransferDashboard />, { wrapper: createWrapper() });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("shows empty message", () => {
    render(<TransferDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No transfer servers/i)).toBeTruthy();
  });

  it("renders servers with data", () => {
    mockServers.mockReturnValue({
      data: {
        servers: [{ ServerId: "s-12345678", Arn: "arn:aws:transfer:us-east-1:123:server/s-12345678", Domain: "S3", State: "ONLINE", Protocols: ["SFTP"], IdentityProviderType: "SERVICE_MANAGED", CreatedDate: "2024-01-15T00:00:00Z" }],
        total: 1,
      },
      isLoading: false,
    });
    const { container } = render(<TransferDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("s-12345678")).toBeTruthy();
    expect(container.textContent).toContain("S3");
    expect(screen.getByText("ONLINE")).toBeTruthy();
  });

  it("shows Start button for non-ONLINE servers", () => {
    mockServers.mockReturnValue({
      data: { servers: [{ ServerId: "s-offline", Domain: "S3", State: "OFFLINE", Protocols: ["SFTP"], IdentityProviderType: "SERVICE_MANAGED", CreatedDate: "2024-01-15T00:00:00Z" }], total: 1 },
      isLoading: false,
    });
    render(<TransferDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Start")).toBeTruthy();
  });

  it("shows Stop button for ONLINE servers", () => {
    mockServers.mockReturnValue({
      data: { servers: [{ ServerId: "s-online", Domain: "S3", State: "ONLINE", Protocols: ["SFTP"], IdentityProviderType: "SERVICE_MANAGED", CreatedDate: "2024-01-15T00:00:00Z" }], total: 1 },
      isLoading: false,
    });
    render(<TransferDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Stop")).toBeTruthy();
  });

  it("shows dash for missing arn, domain, protocol, created", () => {
    mockServers.mockReturnValue({
      data: { servers: [{ ServerId: "s-min" }], total: 1 },
      isLoading: false,
    });
    render(<TransferDashboard />, { wrapper: createWrapper() });
    const dashes = screen.getAllByText("-");
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it("renders multiple servers and filters by ID", async () => {
    mockServers.mockReturnValue({
      data: {
        servers: [
          { ServerId: "s-alpha", Domain: "S3", State: "OFFLINE", Protocols: ["SFTP"], IdentityProviderType: "SERVICE_MANAGED", CreatedDate: "2024-01-15T00:00:00Z" },
          { ServerId: "s-beta", Domain: "S3", State: "ONLINE", Protocols: ["SFTP"], IdentityProviderType: "SERVICE_MANAGED", CreatedDate: "2024-01-16T00:00:00Z" },
        ],
        total: 2,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<TransferDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("s-alpha")).toBeTruthy());

    const filterInput = screen.getByPlaceholderText("Find servers by ID");
    await user.type(filterInput, "s-beta");
    await waitFor(() => expect(screen.queryByText("s-alpha")).toBeNull());
  });

  it("handles _state field fallback for State", () => {
    mockServers.mockReturnValue({
      data: { servers: [{ ServerId: "s-1", Domain: "S3", _state: "ONLINE", Protocols: ["SFTP"], IdentityProviderType: "SERVICE_MANAGED" }], total: 1 },
      isLoading: false,
    });
    render(<TransferDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("ONLINE")).toBeTruthy();
  });

  it("handles EndpointType fallback for protocol", () => {
    mockServers.mockReturnValue({
      data: { servers: [{ ServerId: "s-1", Domain: "S3", State: "ONLINE", EndpointType: "VPC", IdentityProviderType: "SERVICE_MANAGED" }], total: 1 },
      isLoading: false,
    });
    render(<TransferDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("VPC")).toBeTruthy();
  });

  it("deletes a server", async () => {
    mockServers.mockReturnValue({
      data: { servers: [{ ServerId: "s-del", Domain: "S3", State: "OFFLINE", Protocols: ["SFTP"], IdentityProviderType: "SERVICE_MANAGED", CreatedDate: "2024-01-15T00:00:00Z" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<TransferDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("s-del")).toBeTruthy());

    const deleteBtn = screen.getByRole("button", { name: /Delete s-del/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteServer).toHaveBeenCalledWith("s-del"));
  });

  it("shows delete server loading state", () => {
    deleteServerState.isPending = true;
    deleteServerState.variables = "s-del";
    mockServers.mockReturnValue({
      data: { servers: [{ ServerId: "s-del", Domain: "S3", State: "OFFLINE", Protocols: ["SFTP"], IdentityProviderType: "SERVICE_MANAGED", CreatedDate: "2024-01-15T00:00:00Z" }], total: 1 },
      isLoading: false,
    });
    render(<TransferDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("s-del")).toBeTruthy();
  });

  it("shows start server loading state", () => {
    startServerState.isPending = true;
    startServerState.variables = "s-offline";
    mockServers.mockReturnValue({
      data: { servers: [{ ServerId: "s-offline", Domain: "S3", State: "OFFLINE", Protocols: ["SFTP"], IdentityProviderType: "SERVICE_MANAGED" }], total: 1 },
      isLoading: false,
    });
    render(<TransferDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("s-offline")).toBeTruthy();
  });

  it("shows stop server loading state", () => {
    stopServerState.isPending = true;
    stopServerState.variables = "s-online";
    mockServers.mockReturnValue({
      data: { servers: [{ ServerId: "s-online", Domain: "S3", State: "ONLINE", Protocols: ["SFTP"], IdentityProviderType: "SERVICE_MANAGED" }], total: 1 },
      isLoading: false,
    });
    render(<TransferDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("s-online")).toBeTruthy();
  });

  it("opens create server modal and has domain select", async () => {
    const user = userEvent.setup();
    const { container } = render(<TransferDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(container.textContent).toContain("Create"));
    expect(screen.getByLabelText(/Domain/)).toBeTruthy();
  });

  it("cancels create server modal", async () => {
    const user = userEvent.setup();
    const { container } = render(<TransferDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(container.textContent).toContain("Create"));
    await clickButton(user, /Cancel/i);
    expect(mockCreateServer).not.toHaveBeenCalled();
  });

  it("shows create server error alert", async () => {
    createServerState.isError = true;
    createServerState.error = new Error("Server creation failed");
    const user = userEvent.setup();
    render(<TransferDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => {
      expect(screen.getByText("Server creation failed")).toBeTruthy();
    });
  });
});

describe("TransferDashboard — users", () => {
  it("shows users when server is selected", async () => {
    mockServers.mockReturnValue({
      data: { servers: [{ ServerId: "s-001", Domain: "S3", State: "ONLINE", Protocols: ["SFTP"], IdentityProviderType: "SERVICE_MANAGED", CreatedDate: "2024-01-15T00:00:00Z" }], total: 1 },
      isLoading: false,
    });
    mockUsers.mockReturnValue({
      data: { users: [{ UserName: "my-user", Role: "arn:aws:iam::123:role/transfer-role", HomeDirectory: "/bucket/home", SshPublicKeyCount: 2 }], total: 1 },
    });
    const user = userEvent.setup();
    render(<TransferDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("s-001")).toBeTruthy());

    await user.click(screen.getByText("s-001"));
    await waitFor(() => {
      expect(screen.getByText("my-user")).toBeTruthy();
      expect(screen.getByText("Users for s-001")).toBeTruthy();
    });
  });

  it("shows dash for missing user fields", async () => {
    mockServers.mockReturnValue({
      data: { servers: [{ ServerId: "s-001", Domain: "S3", State: "ONLINE", Protocols: ["SFTP"], IdentityProviderType: "SERVICE_MANAGED", CreatedDate: "2024-01-15T00:00:00Z" }], total: 1 },
      isLoading: false,
    });
    mockUsers.mockReturnValue({
      data: { users: [{ UserName: "minimal" }], total: 1 },
    });
    const user = userEvent.setup();
    render(<TransferDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("s-001"));
    await waitFor(() => {
      const dashes = screen.getAllByText("-");
      expect(dashes.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("handles SshPublicKeys array fallback for ssh key count", async () => {
    mockServers.mockReturnValue({
      data: { servers: [{ ServerId: "s-001", Domain: "S3", State: "ONLINE", Protocols: ["SFTP"], IdentityProviderType: "SERVICE_MANAGED" }], total: 1 },
      isLoading: false,
    });
    mockUsers.mockReturnValue({
      data: { users: [{ UserName: "user1", Role: "arn:r1", HomeDirectory: "/home", SshPublicKeys: [{}, {}] }], total: 1 },
    });
    const user = userEvent.setup();
    render(<TransferDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("s-001"));
    await waitFor(() => expect(screen.getByText("2")).toBeTruthy());
  });

  it("deletes a user", async () => {
    mockServers.mockReturnValue({
      data: { servers: [{ ServerId: "s-001", Domain: "S3", State: "ONLINE", Protocols: ["SFTP"], IdentityProviderType: "SERVICE_MANAGED" }], total: 1 },
      isLoading: false,
    });
    mockUsers.mockReturnValue({
      data: { users: [{ UserName: "del-user", Role: "arn:r1", HomeDirectory: "/home" }], total: 1 },
    });
    const user = userEvent.setup();
    render(<TransferDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("s-001"));
    await waitFor(() => expect(screen.getByText("del-user")).toBeTruthy());

    const deleteBtn = screen.getByRole("button", { name: /Delete del-user/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => {
      expect(mockDeleteUser).toHaveBeenCalledWith(
        expect.objectContaining({ serverId: "s-001", userName: "del-user" }),
      );
    });
  });
});
