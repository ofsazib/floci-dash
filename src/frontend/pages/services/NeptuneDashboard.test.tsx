// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

const mockClusters = vi.fn();
const mockInstances = vi.fn();
const mockDeleteCluster = vi.fn();
const mockDeleteInstance = vi.fn();

vi.mock("../../hooks/useNeptune", () => ({
  useNeptuneClusters: (...args: any[]) => mockClusters(...args),
  useNeptuneInstances: (...args: any[]) => mockInstances(...args),
  useDeleteNeptuneCluster: () => ({ mutateAsync: mockDeleteCluster, isPending: false, variables: null }),
  useDeleteNeptuneInstance: () => ({ mutateAsync: mockDeleteInstance, isPending: false, variables: null }),
}));

import { NeptuneDashboard } from "./NeptuneDashboard";

beforeEach(() => {
  vi.clearAllMocks();
  mockClusters.mockReturnValue({ data: { clusters: [], total: 0 }, isLoading: false });
  mockInstances.mockReturnValue({ data: { instances: [], total: 0 }, isLoading: false });
});

describe("NeptuneDashboard", () => {
  it("shows loading skeleton when clusters load", () => {
    mockClusters.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = render(<NeptuneDashboard />, { wrapper: createWrapper() });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("renders both tabs", () => {
    render(<NeptuneDashboard />, { wrapper: createWrapper() });
    expect(screen.getByRole("tab", { name: /clusters/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /instances/i })).toBeTruthy();
  });

  it("shows empty message for clusters", () => {
    render(<NeptuneDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No Neptune clusters/i)).toBeTruthy();
  });

  it("renders clusters with data", () => {
    mockClusters.mockReturnValue({
      data: {
        clusters: [{
          DBClusterIdentifier: "my-cluster",
          Status: "available",
          Engine: "neptune",
          EngineVersion: "1.3.0",
          Endpoint: "my-cluster.abc.neptune.amazonaws.com",
          DBClusterMembers: [{ DBInstanceIdentifier: "inst-1" }],
        }],
        total: 1,
      },
      isLoading: false,
    });
    render(<NeptuneDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-cluster")).toBeTruthy();
    expect(screen.getByText("available")).toBeTruthy();
    expect(screen.getByText("neptune")).toBeTruthy();
  });

  it("renders instances tab when clicked", async () => {
    mockInstances.mockReturnValue({
      data: {
        instances: [{
          DBInstanceIdentifier: "my-instance",
          DBClusterIdentifier: "my-cluster",
          DBInstanceClass: "db.r5.large",
          DBInstanceStatus: "available",
          Endpoint: { Address: "my-instance.abc.neptune.amazonaws.com" },
        }],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<NeptuneDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /instances/i }));
    await waitFor(() => expect(screen.getByText("my-instance")).toBeTruthy());
    expect(screen.getByText("db.r5.large")).toBeTruthy();
  });

  it("shows empty message for instances tab", async () => {
    const user = userEvent.setup();
    render(<NeptuneDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /instances/i }));
    await waitFor(() => expect(screen.getByText(/No Neptune instances/i)).toBeTruthy());
  });

  it("deletes a cluster", async () => {
    mockClusters.mockReturnValue({
      data: {
        clusters: [{ DBClusterIdentifier: "delete-me", Status: "available", Engine: "neptune" }],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<NeptuneDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("delete-me")).toBeTruthy());

    const deleteBtn = screen.getByRole("button", { name: /Delete delete-me/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteCluster).toHaveBeenCalledWith("delete-me"));
  });

  it("deletes an instance", async () => {
    mockInstances.mockReturnValue({
      data: {
        instances: [{ DBInstanceIdentifier: "del-inst", DBClusterIdentifier: "c", DBInstanceClass: "db.r5.large", DBInstanceStatus: "available" }],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<NeptuneDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /instances/i }));
    await waitFor(() => expect(screen.getByText("del-inst")).toBeTruthy());

    const deleteBtn = screen.getByRole("button", { name: /Delete del-inst/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteInstance).toHaveBeenCalledWith("del-inst"));
  });

  it("filters clusters by name", async () => {
    mockClusters.mockReturnValue({
      data: {
        clusters: [
          { DBClusterIdentifier: "alpha", Status: "available", Engine: "neptune" },
          { DBClusterIdentifier: "beta", Status: "available", Engine: "neptune" },
        ],
        total: 2,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<NeptuneDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("alpha")).toBeTruthy());

    const filterInput = screen.getByPlaceholderText("Find clusters");
    await user.type(filterInput, "beta");
    await waitFor(() => expect(screen.queryByText("alpha")).toBeNull());
  });
});
