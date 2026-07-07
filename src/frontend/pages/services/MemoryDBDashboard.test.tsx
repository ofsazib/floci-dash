// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

const mockMemoryDBClusters = vi.fn();
const mockCreateCluster = vi.fn();
const mockDeleteCluster = vi.fn();

vi.mock("../../hooks/useMemoryDB", () => ({
  useMemoryDBClusters: (...args: any[]) => mockMemoryDBClusters(...args),
  useCreateMemoryDBCluster: () => ({ mutate: mockCreateCluster, isPending: false }),
  useDeleteMemoryDBCluster: () => ({ mutateAsync: mockDeleteCluster, isPending: false, variables: null }),
}));

import { MemoryDBDashboard } from "./MemoryDBDashboard";

beforeEach(() => {
  vi.clearAllMocks();
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
