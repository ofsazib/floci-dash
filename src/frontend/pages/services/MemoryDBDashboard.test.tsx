// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

const mockMemoryDBClusters = vi.fn();
const mockCreateCluster = vi.fn();
const mockDeleteCluster = vi.fn();
const mockShowToast = vi.fn();

let mockDeleteIsPending = false;
let mockDeleteVariables: string | null = null;

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
}));

import { MemoryDBDashboard } from "./MemoryDBDashboard";

beforeEach(() => {
  vi.clearAllMocks();
  mockDeleteIsPending = false;
  mockDeleteVariables = null;
  mockMemoryDBClusters.mockReturnValue({ data: { clusters: [], total: 0 }, isLoading: false });
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
