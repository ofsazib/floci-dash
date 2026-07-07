// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

// ─── Mock hooks ─────────────────────────────────────────

// Replication groups
const mockRG = vi.fn();
const mockCreateRG = vi.fn();
const mockDeleteRG = vi.fn();
// Cache clusters
const mockCC = vi.fn();
const mockCreateCC = vi.fn();
const mockDeleteCC = vi.fn();
// Users
const mockUsers = vi.fn();
const mockCreateUser = vi.fn();
const mockDeleteUser = vi.fn();

const createRGState = vi.hoisted(() => ({
  isError: false,
  error: null as Error | null,
  isPending: false,
}));
const deleteRGState = vi.hoisted(() => ({
  isPending: false,
  variables: null as any | null,
}));
const createCCState = vi.hoisted(() => ({
  isError: false,
  error: null as Error | null,
  isPending: false,
}));
const deleteCCState = vi.hoisted(() => ({
  isPending: false,
  variables: null as any | null,
}));
const createUserState = vi.hoisted(() => ({
  isError: false,
  error: null as Error | null,
  isPending: false,
}));
const deleteUserState = vi.hoisted(() => ({
  isPending: false,
  variables: null as any | null,
}));

vi.mock("../../hooks/useElastiCache", () => ({
  useElastiCacheReplicationGroups: (...args: any[]) => mockRG(...args),
  useElastiCacheCreateReplicationGroup: () => ({
    mutate: mockCreateRG,
    isPending: createRGState.isPending,
    isError: createRGState.isError,
    error: createRGState.error,
    reset: vi.fn(),
  }),
  useElastiCacheDeleteReplicationGroup: () => ({
    mutateAsync: mockDeleteRG,
    isPending: deleteRGState.isPending,
    variables: deleteRGState.variables,
  }),
  useElastiCacheCacheClusters: (...args: any[]) => mockCC(...args),
  useElastiCacheCreateCacheCluster: () => ({
    mutate: mockCreateCC,
    isPending: createCCState.isPending,
    isError: createCCState.isError,
    error: createCCState.error,
    reset: vi.fn(),
  }),
  useElastiCacheDeleteCacheCluster: () => ({
    mutateAsync: mockDeleteCC,
    isPending: deleteCCState.isPending,
    variables: deleteCCState.variables,
  }),
  useElastiCacheUsers: (...args: any[]) => mockUsers(...args),
  useElastiCacheCreateUser: () => ({
    mutate: mockCreateUser,
    isPending: createUserState.isPending,
    isError: createUserState.isError,
    error: createUserState.error,
    reset: vi.fn(),
  }),
  useElastiCacheDeleteUser: () => ({
    mutateAsync: mockDeleteUser,
    isPending: deleteUserState.isPending,
    variables: deleteUserState.variables,
  }),
}));

import { ElastiCacheDashboard } from "./ElastiCacheDashboard";

// ─── Setup ──────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  createRGState.isError = false;
  createRGState.error = null;
  createRGState.isPending = false;
  deleteRGState.isPending = false;
  deleteRGState.variables = null;
  createCCState.isError = false;
  createCCState.error = null;
  createCCState.isPending = false;
  deleteCCState.isPending = false;
  deleteCCState.variables = null;
  createUserState.isError = false;
  createUserState.error = null;
  createUserState.isPending = false;
  deleteUserState.isPending = false;
  deleteUserState.variables = null;

  [mockRG, mockCC, mockUsers].forEach((m) =>
    m.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    }),
  );
});

// ─── Tests ──────────────────────────────────────────────

describe("ElastiCacheDashboard — replication groups", () => {
  it("shows empty state", () => {
    mockRG.mockReturnValue({ data: { replicationGroups: [], total: 0 }, isLoading: false });
    render(<ElastiCacheDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("No replication groups found")).toBeTruthy();
  });

  it("renders replication groups with data and deletes one", async () => {
    const user = userEvent.setup();
    mockRG.mockReturnValue({
      data: {
        replicationGroups: [
          { ReplicationGroupId: "my-rg", Status: "available", Description: "Test RG", MemberClusters: ["c1", "c2"] },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<ElastiCacheDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-rg")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();

    const deleteBtn = screen.getByRole("button", { name: /Delete my-rg/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteRG).toHaveBeenCalledWith({ ReplicationGroupId: "my-rg" }));
  });

  it("opens create replication group modal and submits", async () => {
    const user = userEvent.setup();
    mockRG.mockReturnValue({ data: { replicationGroups: [], total: 0 }, isLoading: false });
    render(<ElastiCacheDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getAllByText("Create Replication Group").length).toBeGreaterThan(0));
    const input = screen.getByPlaceholderText("my-rg");
    await user.type(input, "new-rg");
    await clickButton(user, /Create/i, { last: true });
    expect(mockCreateRG).toHaveBeenCalledWith(
      { ReplicationGroupId: "new-rg" },
      expect.any(Object),
    );
  });

  it("shows error alert when create RG fails", async () => {
    createRGState.isError = true;
    createRGState.error = new Error("RG already exists");
    const user = userEvent.setup();
    mockRG.mockReturnValue({ data: { replicationGroups: [], total: 0 }, isLoading: false });
    render(<ElastiCacheDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getAllByText("Create Replication Group").length).toBeGreaterThan(0));
    expect(screen.getByText("RG already exists")).toBeTruthy();
    createRGState.isError = false;
    createRGState.error = null;
  });

  it("shows delete RG loading state", () => {
    deleteRGState.isPending = true;
    deleteRGState.variables = { ReplicationGroupId: "my-rg" };
    mockRG.mockReturnValue({
      data: {
        replicationGroups: [{ ReplicationGroupId: "my-rg", Status: "available", Description: "Test RG", MemberClusters: ["c1"] }],
        total: 1,
      },
      isLoading: false,
    });
    render(<ElastiCacheDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-rg")).toBeTruthy();
  });
});

describe("ElastiCacheDashboard — cache clusters", () => {
  it("switches to cache clusters tab and shows empty state", async () => {
    const user = userEvent.setup();
    mockCC.mockReturnValue({ data: { cacheClusters: [], total: 0 }, isLoading: false });
    render(<ElastiCacheDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /cache clusters/i }));
    await waitFor(() => expect(screen.getByText("No cache clusters found")).toBeTruthy());
  });

  it("renders cache clusters with data and deletes one", async () => {
    const user = userEvent.setup();
    mockCC.mockReturnValue({
      data: {
        cacheClusters: [
          { CacheClusterId: "my-cc", CacheClusterStatus: "available", Engine: "memcached", CacheNodeType: "cache.t3.micro", NumCacheNodes: 1 },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<ElastiCacheDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /cache clusters/i }));
    await waitFor(() => {
      expect(screen.getByText("my-cc")).toBeTruthy();
      expect(screen.getByText("memcached")).toBeTruthy();
    });
    const deleteBtn = screen.getByRole("button", { name: /Delete my-cc/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteCC).toHaveBeenCalledWith({ CacheClusterId: "my-cc" }));
  });

  it("opens create cache cluster modal", async () => {
    const user = userEvent.setup();
    mockCC.mockReturnValue({ data: { cacheClusters: [], total: 0 }, isLoading: false });
    render(<ElastiCacheDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /cache clusters/i }));
    await waitFor(() => expect(screen.getByText("No cache clusters found")).toBeTruthy());
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getAllByText("Create Cache Cluster").length).toBeGreaterThan(0));
    const input = screen.getByPlaceholderText("my-cache-cluster");
    await user.type(input, "new-cc");
    await clickButton(user, /Create/i, { last: true });
    expect(mockCreateCC).toHaveBeenCalledWith(
      { CacheClusterId: "new-cc" },
      expect.any(Object),
    );
  });

  it("shows error alert when create CC fails", async () => {
    createCCState.isError = true;
    createCCState.error = new Error("CC limit reached");
    const user = userEvent.setup();
    mockCC.mockReturnValue({ data: { cacheClusters: [], total: 0 }, isLoading: false });
    render(<ElastiCacheDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /cache clusters/i }));
    await waitFor(() => expect(screen.getByText("No cache clusters found")).toBeTruthy());
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getAllByText("Create Cache Cluster").length).toBeGreaterThan(0));
    expect(screen.getByText("CC limit reached")).toBeTruthy();
    createCCState.isError = false;
    createCCState.error = null;
  });

  it("shows delete CC loading state", async () => {
    deleteCCState.isPending = true;
    deleteCCState.variables = { CacheClusterId: "my-cc" };
    mockCC.mockReturnValue({
      data: {
        cacheClusters: [{ CacheClusterId: "my-cc", CacheClusterStatus: "available", Engine: "memcached", CacheNodeType: "cache.t3.micro", NumCacheNodes: 1 }],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ElastiCacheDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /cache clusters/i }));
    await waitFor(() => expect(screen.getByText("my-cc")).toBeTruthy());
  });
});

describe("ElastiCacheDashboard — users", () => {
  it("switches to users tab and shows empty state", async () => {
    const user = userEvent.setup();
    mockUsers.mockReturnValue({ data: { users: [], total: 0 }, isLoading: false });
    render(<ElastiCacheDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /users/i }));
    await waitFor(() => expect(screen.getByText("No users found")).toBeTruthy());
  });

  it("renders users with data and deletes one", async () => {
    const user = userEvent.setup();
    mockUsers.mockReturnValue({
      data: {
        users: [
          { UserId: "user-1", UserName: "myuser", Status: "active", Engine: "Redis", AccessString: "on ~* +@all" },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<ElastiCacheDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /users/i }));
    await waitFor(() => expect(screen.getByText("user-1")).toBeTruthy());
    const deleteBtn = screen.getByRole("button", { name: /Delete user-1/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteUser).toHaveBeenCalledWith({ UserId: "user-1" }));
  });

  it("opens create user modal", async () => {
    const user = userEvent.setup();
    mockUsers.mockReturnValue({ data: { users: [], total: 0 }, isLoading: false });
    render(<ElastiCacheDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /users/i }));
    await waitFor(() => expect(screen.getByText("No users found")).toBeTruthy());
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create ElastiCache User")).toBeTruthy());
    const input = screen.getByPlaceholderText("my-user");
    await user.type(input, "new-user");
    await clickButton(user, /Create/i, { last: true });
    expect(mockCreateUser).toHaveBeenCalledWith(
      { UserId: "new-user" },
      expect.any(Object),
    );
  });

  it("shows error alert when create user fails", async () => {
    createUserState.isError = true;
    createUserState.error = new Error("User already exists");
    const user = userEvent.setup();
    mockUsers.mockReturnValue({ data: { users: [], total: 0 }, isLoading: false });
    render(<ElastiCacheDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /users/i }));
    await waitFor(() => expect(screen.getByText("No users found")).toBeTruthy());
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create ElastiCache User")).toBeTruthy());
    expect(screen.getByText("User already exists")).toBeTruthy();
    createUserState.isError = false;
    createUserState.error = null;
  });

  it("shows delete user loading state", async () => {
    deleteUserState.isPending = true;
    deleteUserState.variables = { UserId: "user-1" };
    mockUsers.mockReturnValue({
      data: {
        users: [{ UserId: "user-1", UserName: "myuser", Status: "active", Engine: "Redis", AccessString: "on ~* +@all" }],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ElastiCacheDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /users/i }));
    await waitFor(() => expect(screen.getByText("user-1")).toBeTruthy());
  });
});
