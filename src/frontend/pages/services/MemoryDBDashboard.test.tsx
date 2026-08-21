// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

const mockMemoryDBClusters = vi.fn();
const mockCreateCluster = vi.fn();
const mockDeleteCluster = vi.fn();
const mockMemoryDBUsers = vi.fn();
const mockCreateUser = vi.fn();
const mockDeleteUser = vi.fn();
const mockMemoryDBACLs = vi.fn();
const mockCreateACL = vi.fn();
const mockDeleteACL = vi.fn();
const mockShowToast = vi.fn();

let mockDeleteIsPending = false;
let mockDeleteVariables: string | null = null;
let mockDeleteACLIsPending = false;
let mockDeleteACLVariables: string | null = null;
let mockDeleteUserIsPending = false;
let mockDeleteUserVariables: string | null = null;

vi.mock("../../components/Toast", () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

vi.mock("../../hooks/useMemoryDB", () => ({
  useMemoryDBClusters: (...args: any[]) => mockMemoryDBClusters(...args),
  useCreateMemoryDBCluster: () => ({ mutate: mockCreateCluster, isPending: false }),
  useDeleteMemoryDBCluster: () => ({
    mutateAsync: mockDeleteCluster,
    isPending: mockDeleteIsPending,
    variables: mockDeleteVariables,
  }),
  useMemoryDBUsers: (...args: any[]) => mockMemoryDBUsers(...args),
  useCreateMemoryDBUser: () => ({ mutate: mockCreateUser, isPending: false }),
  useDeleteMemoryDBUser: () => ({
    mutateAsync: mockDeleteUser,
    isPending: mockDeleteUserIsPending,
    variables: mockDeleteUserVariables,
  }),
  useMemoryDBACLs: (...args: any[]) => mockMemoryDBACLs(...args),
  useCreateMemoryDBACL: () => ({ mutate: mockCreateACL, isPending: false }),
  useDeleteMemoryDBACL: () => ({
    mutateAsync: mockDeleteACL,
    isPending: mockDeleteACLIsPending,
    variables: mockDeleteACLVariables,
  }),
}));

import { MemoryDBDashboard } from "./MemoryDBDashboard";

beforeEach(() => {
  vi.clearAllMocks();
  mockDeleteIsPending = false;
  mockDeleteVariables = null;
  mockDeleteACLIsPending = false;
  mockDeleteACLVariables = null;
  mockDeleteUserIsPending = false;
  mockDeleteUserVariables = null;
  mockMemoryDBClusters.mockReturnValue({ data: { clusters: [], total: 0 }, isLoading: false });
  mockMemoryDBUsers.mockReturnValue({ data: { users: [], total: 0 }, isLoading: false });
  mockMemoryDBACLs.mockReturnValue({ data: { acls: [], total: 0 }, isLoading: false });
});

describe("MemoryDBDashboard", () => {
  it("shows loading skeleton", () => {
    mockMemoryDBClusters.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = render(<MemoryDBDashboard />, { wrapper: createWrapper() });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("shows empty state when no clusters", () => {
    const { container } = render(<MemoryDBDashboard />, { wrapper: createWrapper() });
    expect(container.querySelector('[class*="table"]')).toBeTruthy();
  });

  it("renders clusters with data", () => {
    mockMemoryDBClusters.mockReturnValue({
      data: {
        clusters: [{
          Name: "my-cluster",
          Status: "active",
          NodeType: "db.t4g.small",
          Engine: "redis",
          NumberOfShards: 2,
          ClusterEndpoint: { Address: "my-cluster.memorydb.amazonaws.com", Port: 6379 },
        }],
        total: 1,
      },
      isLoading: false,
    });
    render(<MemoryDBDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-cluster")).toBeTruthy();
    expect(screen.getByText("db.t4g.small")).toBeTruthy();
    expect(screen.getByText("my-cluster.memorydb.amazonaws.com:6379")).toBeTruthy();
  });

  it("shows dash for missing fields", () => {
    mockMemoryDBClusters.mockReturnValue({
      data: { clusters: [{ Name: "test" }], total: 1 },
      isLoading: false,
    });
    render(<MemoryDBDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("test")).toBeTruthy();
    const dashes = screen.getAllByText("-");
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it("opens create modal and submits", async () => {
    const user = userEvent.setup();
    render(<MemoryDBDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByRole("dialog")).toBeTruthy());

    const nameInput = screen.getByPlaceholderText("my-cluster");
    await user.type(nameInput, "new-cluster");

    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    await user.click(createBtns[createBtns.length - 1]);

    await waitFor(() => {
      expect(mockCreateCluster).toHaveBeenCalledWith(
        expect.objectContaining({ clusterName: "new-cluster" }),
        expect.any(Object),
      );
    });
  });

  it("cancels create modal", async () => {
    const user = userEvent.setup();
    render(<MemoryDBDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByRole("dialog")).toBeTruthy());
    await clickButton(user, /Cancel/i);
    expect(mockCreateCluster).not.toHaveBeenCalled();
  });

  it("deletes a cluster", async () => {
    mockMemoryDBClusters.mockReturnValue({
      data: { clusters: [{ Name: "delete-me", Status: "active", NodeType: "db.t4g.small", Engine: "redis", NumberOfShards: 1 }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<MemoryDBDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("delete-me")).toBeTruthy());

    const deleteBtn = screen.getByRole("button", { name: /Delete delete-me/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteCluster).toHaveBeenCalledWith("delete-me"));
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith("success", "Cluster delete-me deleted");
    });
  });

  it("shows error toast when cluster delete fails", async () => {
    mockMemoryDBClusters.mockReturnValue({
      data: { clusters: [{ Name: "delete-me", Status: "active" }], total: 1 },
      isLoading: false,
    });
    mockDeleteCluster.mockRejectedValue(new Error("Delete failed"));
    const user = userEvent.setup();
    render(<MemoryDBDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("delete-me")).toBeTruthy());

    await user.click(screen.getByRole("button", { name: /Delete delete-me/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith("error", "Delete failed");
    });
  });

  it("shows loading state on the row being deleted", async () => {
    mockMemoryDBClusters.mockReturnValue({
      data: { clusters: [{ Name: "delete-me", Status: "active" }], total: 1 },
      isLoading: false,
    });
    mockDeleteIsPending = true;
    mockDeleteVariables = "delete-me";
    render(<MemoryDBDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("delete-me")).toBeTruthy());
    expect(screen.getByRole("button", { name: /Delete delete-me/i })).toBeDisabled();
  });

  it("creates cluster with all fields and shows success toast", async () => {
    const user = userEvent.setup();
    mockCreateCluster.mockImplementation((_args: any, opts: any) => opts?.onSuccess?.());
    render(<MemoryDBDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByRole("dialog")).toBeTruthy());

    await user.type(screen.getByPlaceholderText("my-cluster"), "new-cluster");
    await user.type(screen.getByPlaceholderText("Optional description"), "My description");
    const nodeTypeInput = screen.getByPlaceholderText("db.t4g.small");
    await user.clear(nodeTypeInput);
    await user.type(nodeTypeInput, "db.t4g.medium");
    const engineInput = screen.getByPlaceholderText("redis");
    await user.clear(engineInput);
    await user.type(engineInput, "redis7");

    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    await user.click(createBtns[createBtns.length - 1]);

    await waitFor(() => {
      expect(mockCreateCluster).toHaveBeenCalledWith(
        expect.objectContaining({
          clusterName: "new-cluster",
          description: "My description",
          nodeType: "db.t4g.medium",
          engine: "redis7",
        }),
        expect.anything(),
      );
      expect(mockShowToast).toHaveBeenCalledWith("success", "Cluster new-cluster created");
    });
  });

  it("shows error toast when cluster creation fails", async () => {
    const user = userEvent.setup();
    mockCreateCluster.mockImplementation((_args: any, opts: any) => opts?.onError?.(new Error("Create failed")));
    render(<MemoryDBDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByRole("dialog")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("my-cluster"), "new-cluster");

    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    await user.click(createBtns[createBtns.length - 1]);

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith("error", "Create failed");
    });
  });

  it("dismisses create modal with Escape", async () => {
    const user = userEvent.setup();
    render(<MemoryDBDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByRole("dialog")).toBeTruthy());
    document.querySelectorAll('[class*="awsui_dialog"]').forEach((dialog) => {
      fireEvent.keyDown(dialog as HTMLElement, { keyCode: 27 });
    });
    expect(mockCreateCluster).not.toHaveBeenCalled();
  });

  it("filters clusters by name", async () => {
    mockMemoryDBClusters.mockReturnValue({
      data: {
        clusters: [
          { Name: "alpha", Status: "active" },
          { Name: "beta", Status: "active" },
        ],
        total: 2,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<MemoryDBDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("alpha")).toBeTruthy());

    const filterInput = screen.getByPlaceholderText("Find by name");
    await user.type(filterInput, "beta");
    await waitFor(() => expect(screen.queryByText("alpha")).toBeNull());
  });
});

describe("UsersTab", () => {
  beforeEach(() => {
    mockMemoryDBUsers.mockReturnValue({ data: { users: [], total: 0 }, isLoading: false });
  });

  it("switches to Users tab", async () => {
    const user = userEvent.setup();
    render(<MemoryDBDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Users/i }));
    expect(screen.getAllByText("Users").length).toBeGreaterThan(0);
  });

  it("shows users list", async () => {
    mockMemoryDBUsers.mockReturnValue({
      data: { users: [{ UserName: "u1", Status: "active", AccessString: "on ~* +@all" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<MemoryDBDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Users/i }));
    await waitFor(() => expect(screen.getByText("u1")).toBeTruthy());
  });

  it("creates a user", async () => {
    mockCreateUser.mockImplementation((_args: any, opts: any) => { opts?.onSuccess?.(); });
    const user = userEvent.setup();
    render(<MemoryDBDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Users/i }));
    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    await user.click(createBtns[createBtns.length - 1]);
    await waitFor(() => expect(screen.getByRole("dialog")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("my-user"), "new-user");
    await user.type(screen.getByPlaceholderText("on ~\* +@all"), "on ~* +@all");
    const submitBtns = screen.getAllByRole("button", { name: /^Create$/i });
    await user.click(submitBtns[submitBtns.length - 1]);
    await waitFor(() => expect(mockCreateUser).toHaveBeenCalled());
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("success", expect.stringContaining("created")));
  });

  it("deletes a user", async () => {
    mockDeleteUser.mockResolvedValueOnce(undefined);
    mockMemoryDBUsers.mockReturnValue({
      data: { users: [{ UserName: "u1", Status: "active", AccessString: "on ~*" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<MemoryDBDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Users/i }));
    await waitFor(() => expect(screen.getByText("u1")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete u1/i }));
    await waitFor(() => {
      const dialogs = screen.getAllByRole("dialog");
      expect(dialogs.length).toBeGreaterThanOrEqual(1);
    });
    const deleteBtns = screen.getAllByRole("button", { name: /^Delete$/i });
    await user.click(deleteBtns[deleteBtns.length - 1]);
    await waitFor(() => expect(mockDeleteUser).toHaveBeenCalledWith("u1"));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("success", expect.stringContaining("deleted")));
  });

  it("shows error toast when user delete fails", async () => {
    mockDeleteUser.mockRejectedValueOnce(new Error("delete failed"));
    mockMemoryDBUsers.mockReturnValue({
      data: { users: [{ UserName: "u1", Status: "active", AccessString: "on ~*" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<MemoryDBDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Users/i }));
    await waitFor(() => expect(screen.getByText("u1")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete u1/i }));
    await waitFor(() => {
      const dialogs = screen.getAllByRole("dialog");
      expect(dialogs.length).toBeGreaterThanOrEqual(1);
    });
    const deleteBtns = screen.getAllByRole("button", { name: /^Delete$/i });
    await user.click(deleteBtns[deleteBtns.length - 1]);
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "delete failed"));
  });

  it("shows error toast when user creation fails", async () => {
    mockCreateUser.mockImplementation((_args: any, opts: any) => { opts?.onError?.(new Error("create failed")); });
    const user = userEvent.setup();
    render(<MemoryDBDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Users/i }));
    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    await user.click(createBtns[createBtns.length - 1]);
    await waitFor(() => expect(screen.getByRole("dialog")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("my-user"), "new-user");
    const submitBtns = screen.getAllByRole("button", { name: /^Create$/i });
    await user.click(submitBtns[submitBtns.length - 1]);
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "create failed"));
  });

  it("handles users data without users key", async () => {
    mockMemoryDBUsers.mockReturnValue({ data: {}, isLoading: false });
    render(<MemoryDBDashboard />, { wrapper: createWrapper() });
    await screen.getByRole("tab", { name: /Users/i }).click();
    await waitFor(() => expect(screen.getAllByText("Users").length).toBeGreaterThan(0));
  });
});

describe("ACLsTab", () => {
  beforeEach(() => {
    mockMemoryDBACLs.mockReturnValue({ data: { acls: [], total: 0 }, isLoading: false });
  });

  it("switches to ACLs tab", async () => {
    const user = userEvent.setup();
    render(<MemoryDBDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /ACLs/i }));
    expect(screen.getAllByText("ACLs").length).toBeGreaterThan(0);
  });

  it("shows ACLs list", async () => {
    mockMemoryDBACLs.mockReturnValue({
      data: { acls: [{ ACLName: "a1", Status: "active", UserNames: ["u1"] }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<MemoryDBDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /ACLs/i }));
    await waitFor(() => expect(screen.getByText("a1")).toBeTruthy());
  });

  it("creates an ACL", async () => {
    mockCreateACL.mockImplementation((_args: any, opts: any) => { opts?.onSuccess?.(); });
    const user = userEvent.setup();
    render(<MemoryDBDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /ACLs/i }));
    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    await user.click(createBtns[createBtns.length - 1]);
    await waitFor(() => expect(screen.getByRole("dialog")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("my-acl"), "new-acl");
    const submitBtns = screen.getAllByRole("button", { name: /^Create$/i });
    await user.click(submitBtns[submitBtns.length - 1]);
    await waitFor(() => expect(mockCreateACL).toHaveBeenCalled());
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("success", expect.stringContaining("created")));
  });

  it("deletes an ACL", async () => {
    mockDeleteACL.mockResolvedValueOnce(undefined);
    mockMemoryDBACLs.mockReturnValue({
      data: { acls: [{ ACLName: "a1", Status: "active", UserNames: ["u1"] }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<MemoryDBDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /ACLs/i }));
    await waitFor(() => expect(screen.getByText("a1")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete a1/i }));
    await waitFor(() => {
      const dialogs = screen.getAllByRole("dialog");
      expect(dialogs.length).toBeGreaterThanOrEqual(1);
    });
    const deleteBtns = screen.getAllByRole("button", { name: /^Delete$/i });
    await user.click(deleteBtns[deleteBtns.length - 1]);
    await waitFor(() => expect(mockDeleteACL).toHaveBeenCalledWith("a1"));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("success", expect.stringContaining("deleted")));
  });

  it("shows error toast when ACL delete fails", async () => {
    mockDeleteACL.mockRejectedValueOnce(new Error("acl delete failed"));
    mockMemoryDBACLs.mockReturnValue({
      data: { acls: [{ ACLName: "a1", Status: "active", UserNames: ["u1"] }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<MemoryDBDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /ACLs/i }));
    await waitFor(() => expect(screen.getByText("a1")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete a1/i }));
    await waitFor(() => {
      const dialogs = screen.getAllByRole("dialog");
      expect(dialogs.length).toBeGreaterThanOrEqual(1);
    });
    const deleteBtns = screen.getAllByRole("button", { name: /^Delete$/i });
    await user.click(deleteBtns[deleteBtns.length - 1]);
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "acl delete failed"));
  });

  it("shows error toast when ACL creation fails", async () => {
    mockCreateACL.mockImplementation((_args: any, opts: any) => { opts?.onError?.(new Error("acl create failed")); });
    const user = userEvent.setup();
    render(<MemoryDBDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /ACLs/i }));
    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    await user.click(createBtns[createBtns.length - 1]);
    await waitFor(() => expect(screen.getByRole("dialog")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("my-acl"), "new-acl");
    const submitBtns = screen.getAllByRole("button", { name: /^Create$/i });
    await user.click(submitBtns[submitBtns.length - 1]);
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "acl create failed"));
  });
});
