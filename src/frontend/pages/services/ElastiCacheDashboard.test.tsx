// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

// ─── vi.hoisted states ─────────────────────────────────

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

// ─── Mock hooks ─────────────────────────────────────────

const mockRG = vi.fn();
const mockCreateRG = vi.fn();
const mockDeleteRG = vi.fn();
const mockCC = vi.fn();
const mockCreateCC = vi.fn();
const mockDeleteCC = vi.fn();
const mockUsers = vi.fn();
const mockCreateUser = vi.fn();
const mockDeleteUser = vi.fn();

vi.mock("../../hooks/useElastiCache", () => ({
  useElastiCacheReplicationGroups: (...args: any[]) => mockRG(...args),
  useElastiCacheCreateReplicationGroup: () => ({
    mutate: mockCreateRG,
    get isPending() { return createRGState.isPending; },
    get isError() { return createRGState.isError; },
    get error() { return createRGState.error; },
    reset: vi.fn(),
  }),
  useElastiCacheDeleteReplicationGroup: () => ({
    mutateAsync: mockDeleteRG,
    get isPending() { return deleteRGState.isPending; },
    get variables() { return deleteRGState.variables; },
  }),
  useElastiCacheCacheClusters: (...args: any[]) => mockCC(...args),
  useElastiCacheCreateCacheCluster: () => ({
    mutate: mockCreateCC,
    get isPending() { return createCCState.isPending; },
    get isError() { return createCCState.isError; },
    get error() { return createCCState.error; },
    reset: vi.fn(),
  }),
  useElastiCacheDeleteCacheCluster: () => ({
    mutateAsync: mockDeleteCC,
    get isPending() { return deleteCCState.isPending; },
    get variables() { return deleteCCState.variables; },
  }),
  useElastiCacheUsers: (...args: any[]) => mockUsers(...args),
  useElastiCacheCreateUser: () => ({
    mutate: mockCreateUser,
    get isPending() { return createUserState.isPending; },
    get isError() { return createUserState.isError; },
    get error() { return createUserState.error; },
    reset: vi.fn(),
  }),
  useElastiCacheDeleteUser: () => ({
    mutateAsync: mockDeleteUser,
    get isPending() { return deleteUserState.isPending; },
    get variables() { return deleteUserState.variables; },
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

  it("renders replication groups with data", () => {
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
  });

  it("renders multiple replication groups", () => {
    mockRG.mockReturnValue({
      data: {
        replicationGroups: [
          { ReplicationGroupId: "rg-1", Status: "available", MemberClusters: ["c1"] },
          { ReplicationGroupId: "rg-2", Status: "creating", MemberClusters: ["c2", "c3"] },
        ],
        total: 2,
      },
      isLoading: false,
    });
    render(<ElastiCacheDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("rg-1")).toBeTruthy();
    expect(screen.getByText("rg-2")).toBeTruthy();
  });

  it("shows em-dash for missing description and snapshot retention", () => {
    mockRG.mockReturnValue({
      data: {
        replicationGroups: [{ ReplicationGroupId: "minimal", Status: "available", MemberClusters: [] }],
        total: 1,
      },
      isLoading: false,
    });
    render(<ElastiCacheDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("minimal")).toBeTruthy();
    // Description: rg.Description || "—" is the only column with an em-dash
    const dashes = screen.getAllByText("\u2014");
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it("filters replication groups by ID", async () => {
    mockRG.mockReturnValue({
      data: {
        replicationGroups: [
          { ReplicationGroupId: "alpha", Status: "available", MemberClusters: [] },
          { ReplicationGroupId: "beta", Status: "available", MemberClusters: [] },
        ],
        total: 2,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ElastiCacheDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("alpha")).toBeTruthy());

    const filterInput = screen.getByPlaceholderText("Find replication groups by ID");
    await user.type(filterInput, "beta");
    await waitFor(() => expect(screen.queryByText("alpha")).toBeNull());
  });

  it("deletes a replication group", async () => {
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

    const deleteBtn = screen.getByRole("button", { name: /Delete my-rg/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteRG).toHaveBeenCalledWith({ ReplicationGroupId: "my-rg" }));
  });

  it("opens create replication group modal and submits with optional fields", async () => {
    const user = userEvent.setup();
    mockRG.mockReturnValue({ data: { replicationGroups: [], total: 0 }, isLoading: false });
    render(<ElastiCacheDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getAllByText("Create Replication Group").length).toBeGreaterThan(0));

    const nameInput = screen.getByPlaceholderText("my-rg");
    await user.type(nameInput, "new-rg");
    const descInput = screen.getByPlaceholderText("My replication group");
    await user.type(descInput, "My description");
    const authInput = screen.getByPlaceholderText("my-auth-token");
    await user.type(authInput, "secret-token");

    await clickButton(user, /Create/i, { last: true });
    expect(mockCreateRG).toHaveBeenCalledWith(
      { ReplicationGroupId: "new-rg", Description: "My description", AuthToken: "secret-token" },
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

  it("shows create RG loading state", async () => {
    createRGState.isPending = true;
    const user = userEvent.setup();
    mockRG.mockReturnValue({ data: { replicationGroups: [], total: 0 }, isLoading: false });
    render(<ElastiCacheDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getAllByText("Create Replication Group").length).toBeGreaterThan(0));
  });

  it("shows delete RG loading state", () => {
    deleteRGState.isPending = true;
    deleteRGState.variables = { ReplicationGroupId: "my-rg" };
    mockRG.mockReturnValue({
      data: {
        replicationGroups: [{ ReplicationGroupId: "my-rg", Status: "available", MemberClusters: ["c1"] }],
        total: 1,
      },
      isLoading: false,
    });
    render(<ElastiCacheDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-rg")).toBeTruthy();
  });

  it("shows error status indicator when RG hook errors", () => {
    mockRG.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("Connection failed"),
    });
    render(<ElastiCacheDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Connection failed")).toBeTruthy();
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

  it("renders cache clusters with all fields", async () => {
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
  });

  it("shows em-dash for missing NumCacheNodes and CacheNodeType", async () => {
    const user = userEvent.setup();
    mockCC.mockReturnValue({
      data: {
        cacheClusters: [{ CacheClusterId: "minimal", CacheClusterStatus: "available" }],
        total: 1,
      },
      isLoading: false,
    });
    render(<ElastiCacheDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /cache clusters/i }));
    await waitFor(() => expect(screen.getByText("minimal")).toBeTruthy());
    // NumCacheNodes: cc.NumCacheNodes ?? "—", CacheNodeType: cc.CacheNodeType || "—"
    const dashes = screen.getAllByText("\u2014");
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  it("filters cache clusters by ID", async () => {
    const user = userEvent.setup();
    mockCC.mockReturnValue({
      data: {
        cacheClusters: [
          { CacheClusterId: "alpha-cc", CacheClusterStatus: "available" },
          { CacheClusterId: "beta-cc", CacheClusterStatus: "available" },
        ],
        total: 2,
      },
      isLoading: false,
    });
    render(<ElastiCacheDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /cache clusters/i }));
    await waitFor(() => expect(screen.getByText("alpha-cc")).toBeTruthy());

    const filterInput = screen.getByPlaceholderText("Find clusters by ID");
    await user.type(filterInput, "beta");
    await waitFor(() => expect(screen.queryByText("alpha-cc")).toBeNull());
  });

  it("deletes a cache cluster", async () => {
    const user = userEvent.setup();
    mockCC.mockReturnValue({
      data: {
        cacheClusters: [{ CacheClusterId: "my-cc", CacheClusterStatus: "available", Engine: "memcached" }],
        total: 1,
      },
      isLoading: false,
    });
    render(<ElastiCacheDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /cache clusters/i }));
    await waitFor(() => expect(screen.getByText("my-cc")).toBeTruthy());

    const deleteBtn = screen.getByRole("button", { name: /Delete my-cc/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteCC).toHaveBeenCalledWith({ CacheClusterId: "my-cc" }));
  });

  it("shows CC error status indicator", async () => {
    const user = userEvent.setup();
    mockCC.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("CC load failed"),
    });
    render(<ElastiCacheDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /cache clusters/i }));
    await waitFor(() => expect(screen.getByText("CC load failed")).toBeTruthy());
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

  it("renders users with all fields", async () => {
    const user = userEvent.setup();
    mockUsers.mockReturnValue({
      data: {
        users: [
          { UserId: "user-1", UserName: "myuser", Status: "active", Engine: "Redis", AccessString: "on ~* +@all" },
          { UserId: "user-2", UserName: "other", Status: "creating", Engine: "Memcached", AccessString: "on ~* -@dangerous" },
        ],
        total: 2,
      },
      isLoading: false,
    });
    render(<ElastiCacheDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /users/i }));
    await waitFor(() => expect(screen.getByText("user-1")).toBeTruthy());
    expect(screen.getByText("user-2")).toBeTruthy();
    expect(screen.getByText("myuser")).toBeTruthy();
  });

  it("shows em-dash for missing user fields", async () => {
    const user = userEvent.setup();
    mockUsers.mockReturnValue({
      data: {
        users: [{ UserId: "minimal", UserName: "m" }],
        total: 1,
      },
      isLoading: false,
    });
    render(<ElastiCacheDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /users/i }));
    await waitFor(() => expect(screen.getByText("minimal")).toBeTruthy());
    // Status: u.Status || "—", AccessString: u.AccessString || "—", Engine: u.Engine || "—"
    const dashes = screen.getAllByText("\u2014");
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  it("filters users by ID", async () => {
    const user = userEvent.setup();
    mockUsers.mockReturnValue({
      data: {
        users: [
          { UserId: "alpha", UserName: "a" },
          { UserId: "beta", UserName: "b" },
        ],
        total: 2,
      },
      isLoading: false,
    });
    render(<ElastiCacheDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /users/i }));
    await waitFor(() => expect(screen.getByText("alpha")).toBeTruthy());

    const filterInput = screen.getByPlaceholderText("Find users by ID");
    await user.type(filterInput, "beta");
    await waitFor(() => expect(screen.queryByText("alpha")).toBeNull());
  });

  it("filters users by userName", async () => {
    const user = userEvent.setup();
    mockUsers.mockReturnValue({
      data: {
        users: [
          { UserId: "u1", UserName: "alice" },
          { UserId: "u2", UserName: "bob" },
        ],
        total: 2,
      },
      isLoading: false,
    });
    render(<ElastiCacheDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /users/i }));
    await waitFor(() => expect(screen.getByText("u2")).toBeTruthy());

    const filterInput = screen.getByPlaceholderText("Find users by ID");
    await user.type(filterInput, "alice");
    await waitFor(() => expect(screen.queryByText("u2")).toBeNull());
  });

  it("creates user with all optional fields", async () => {
    const user = userEvent.setup();
    mockUsers.mockReturnValue({ data: { users: [], total: 0 }, isLoading: false });
    render(<ElastiCacheDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /users/i }));
    await waitFor(() => expect(screen.getByText("No users found")).toBeTruthy());
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create ElastiCache User")).toBeTruthy());

    await user.type(screen.getByPlaceholderText("my-user"), "new-user");
    await user.type(screen.getByPlaceholderText("My User"), "Alice");
    await user.type(screen.getByPlaceholderText("on ~* +@all"), "on ~* -@dangerous");

    await clickButton(user, /Create/i, { last: true });
    expect(mockCreateUser).toHaveBeenCalledWith(
      { UserId: "new-user", UserName: "Alice", AccessString: "on ~* -@dangerous" },
      expect.any(Object),
    );
  });

  it("shows users error status indicator", async () => {
    const user = userEvent.setup();
    mockUsers.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("User load failed"),
    });
    render(<ElastiCacheDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /users/i }));
    await waitFor(() => expect(screen.getByText("User load failed")).toBeTruthy());
  });
});
