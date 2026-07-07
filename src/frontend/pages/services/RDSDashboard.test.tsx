// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

const mockInstances = vi.fn();
const mockCreateInstance = vi.fn();
const mockDeleteInstance = vi.fn();
const mockRebootInstance = vi.fn();
const mockInstanceDetail = vi.fn();
const mockClusters = vi.fn();
const mockCreateCluster = vi.fn();
const mockDeleteCluster = vi.fn();
const mockClusterDetail = vi.fn();
const mockParamGroups = vi.fn();
const mockCreateParamGroup = vi.fn();
const mockDeleteParamGroup = vi.fn();
const mockClusterParamGroups = vi.fn();
const mockCreateClusterParamGroup = vi.fn();
const mockDeleteClusterParamGroup = vi.fn();

vi.mock("../../hooks/useRDS", () => ({
  useRDSDBInstances: (...args: any[]) => mockInstances(...args),
  useRDSCreateDBInstance: () => ({ mutate: mockCreateInstance, isPending: false }),
  useRDSDeleteDBInstance: () => ({ mutateAsync: mockDeleteInstance, isPending: false, variables: null }),
  useRDSRebootDBInstance: () => ({ mutate: mockRebootInstance, isPending: false, variables: null }),
  useRDSDBInstance: (...args: any[]) => mockInstanceDetail(...args),
  useRDSDBClusters: (...args: any[]) => mockClusters(...args),
  useRDSCreateDBCluster: () => ({ mutate: mockCreateCluster, isPending: false }),
  useRDSDeleteDBCluster: () => ({ mutateAsync: mockDeleteCluster, isPending: false, variables: null }),
  useRDSDBCluster: (...args: any[]) => mockClusterDetail(...args),
  useRDSParameterGroups: (...args: any[]) => mockParamGroups(...args),
  useRDSCreateParameterGroup: () => ({ mutate: mockCreateParamGroup, isPending: false }),
  useRDSDeleteParameterGroup: () => ({ mutateAsync: mockDeleteParamGroup, isPending: false, variables: null }),
  useRDSClusterParameterGroups: (...args: any[]) => mockClusterParamGroups(...args),
  useRDSCreateClusterParameterGroup: () => ({ mutate: mockCreateClusterParamGroup, isPending: false }),
  useRDSDeleteClusterParameterGroup: () => ({ mutateAsync: mockDeleteClusterParamGroup, isPending: false, variables: null }),
  useRDSModifyParameterGroupParameters: () => ({ mutate: vi.fn(), isPending: false }),
}));

import { RDSDashboard } from "./RDSDashboard";

beforeEach(() => {
  vi.clearAllMocks();
  mockInstances.mockReturnValue({ data: { instances: [], total: 0 }, isLoading: false, isError: false, error: null });
  mockClusters.mockReturnValue({ data: { clusters: [], total: 0 }, isLoading: false, isError: false, error: null });
  mockParamGroups.mockReturnValue({ data: { parameterGroups: [], total: 0 }, isLoading: false, isError: false, error: null });
  mockClusterParamGroups.mockReturnValue({ data: { clusterParameterGroups: [], total: 0 }, isLoading: false, isError: false, error: null });
  mockInstanceDetail.mockReturnValue({ data: undefined, isLoading: false, isError: false, error: null });
  mockClusterDetail.mockReturnValue({ data: undefined, isLoading: false, isError: false, error: null });
});

describe("RDSDashboard", () => {
  it("renders all four tabs", () => {
    render(<RDSDashboard />, { wrapper: createWrapper() });
    expect(screen.getByRole("tab", { name: /DB Instances/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /DB Clusters/i })).toBeTruthy();
    const tabs = screen.getAllByRole("tab");
    expect(tabs.length).toBeGreaterThanOrEqual(4);
  });

  it("shows empty message for DB instances", () => {
    render(<RDSDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No DB instances found/i)).toBeTruthy();
  });

  it("renders instances with data", () => {
    mockInstances.mockReturnValue({
      data: { instances: [{ id: "my-db", engine: "postgres", engineVersion: "16.4", status: "available", dbInstanceClass: "db.t3.micro", allocatedStorage: 20, masterUsername: "admin", endpoint: { address: "my-db.abc.rds.amazonaws.com", port: 5432 } }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const { container } = render(<RDSDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-db")).toBeTruthy();
    expect(screen.getByText("postgres")).toBeTruthy();
    expect(container.textContent).toContain("db.t3.micro");
  });

  it("shows empty message for DB clusters tab", async () => {
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /DB Clusters/i }));
    await waitFor(() => expect(screen.getByText(/No DB clusters found/i)).toBeTruthy());
  });

  it("renders clusters with data", async () => {
    mockClusters.mockReturnValue({
      data: { clusters: [{ id: "my-cluster", engine: "aurora-postgresql", engineVersion: "16.4", status: "available", masterUsername: "admin", databaseName: "mydb", endpoint: "my-cluster.cluster-abc.rds.amazonaws.com", clusterMembers: ["inst-1"] }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /DB Clusters/i }));
    await waitFor(() => expect(screen.getByText("my-cluster")).toBeTruthy());
  });

  it("shows empty message for parameter groups tab", async () => {
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    const tabs = screen.getAllByRole("tab");
    await user.click(tabs[2]);
    await waitFor(() => expect(screen.getByText(/No parameter groups found/i)).toBeTruthy());
  });

  it("shows empty message for cluster param groups tab", async () => {
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Cluster Parameter Groups/i }));
    await waitFor(() => expect(screen.getByText(/No cluster parameter groups found/i)).toBeTruthy());
  });

  it("opens create DB instance modal and validates disabled", async () => {
    const user = userEvent.setup();
    const { container } = render(<RDSDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /Create/i);
    await waitFor(() => expect(container.textContent).toContain("Create DB Instance"));

    // should be disabled since identifier is empty
    await waitFor(() => {
      expect(screen.getByPlaceholderText("my-database")).toBeTruthy();
    });
  });

  it("deletes a DB instance", async () => {
    mockInstances.mockReturnValue({
      data: { instances: [{ id: "delete-me", engine: "postgres", status: "available", dbInstanceClass: "db.t3.micro", allocatedStorage: 20 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("delete-me")).toBeTruthy());

    const deleteBtn = screen.getByRole("button", { name: /Delete delete-me/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteInstance).toHaveBeenCalledWith("delete-me"));
  });

  it("filters instances by name", async () => {
    mockInstances.mockReturnValue({
      data: {
        instances: [
          { id: "alpha-db", engine: "postgres", status: "available", dbInstanceClass: "db.t3.micro", allocatedStorage: 20 },
          { id: "beta-db", engine: "mysql", status: "available", dbInstanceClass: "db.t3.micro", allocatedStorage: 20 },
        ],
        total: 2,
      },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("alpha-db")).toBeTruthy());

    const filterInput = screen.getByPlaceholderText("Find instances by identifier");
    await user.type(filterInput, "beta");
    await waitFor(() => expect(screen.queryByText("alpha-db")).toBeNull());
  });
});
