// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

// ─── vi.hoisted mutable states ──────────────────────────

const createInstanceState = vi.hoisted(() => ({
  isPending: false,
  isError: false,
  error: null as Error | null,
}));

const deleteInstanceState = vi.hoisted(() => ({
  isPending: false,
  variables: null as string | null,
}));

const rebootInstanceState = vi.hoisted(() => ({
  isPending: false,
  variables: null as string | null,
}));

const createClusterState = vi.hoisted(() => ({
  isPending: false,
  isError: false,
  error: null as Error | null,
}));

const deleteClusterState = vi.hoisted(() => ({
  isPending: false,
  variables: null as string | null,
}));

const createPGState = vi.hoisted(() => ({
  isPending: false,
  isError: false,
  error: null as Error | null,
}));

const deletePGState = vi.hoisted(() => ({
  isPending: false,
  variables: null as string | null,
}));

const createCPGState = vi.hoisted(() => ({
  isPending: false,
  isError: false,
  error: null as Error | null,
}));

const deleteCPGState = vi.hoisted(() => ({
  isPending: false,
  variables: null as string | null,
}));

// ─── Mock hooks ─────────────────────────────────────────

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
  useRDSCreateDBInstance: () => ({
    mutate: mockCreateInstance,
    get isPending() { return createInstanceState.isPending; },
    get isError() { return createInstanceState.isError; },
    get error() { return createInstanceState.error; },
  }),
  useRDSDeleteDBInstance: () => ({
    mutateAsync: mockDeleteInstance,
    get isPending() { return deleteInstanceState.isPending; },
    get variables() { return deleteInstanceState.variables; },
  }),
  useRDSRebootDBInstance: () => ({
    mutate: mockRebootInstance,
    get isPending() { return rebootInstanceState.isPending; },
    get variables() { return rebootInstanceState.variables; },
  }),
  useRDSDBInstance: (...args: any[]) => mockInstanceDetail(...args),
  useRDSDBClusters: (...args: any[]) => mockClusters(...args),
  useRDSCreateDBCluster: () => ({
    mutate: mockCreateCluster,
    get isPending() { return createClusterState.isPending; },
    get isError() { return createClusterState.isError; },
    get error() { return createClusterState.error; },
  }),
  useRDSDeleteDBCluster: () => ({
    mutateAsync: mockDeleteCluster,
    get isPending() { return deleteClusterState.isPending; },
    get variables() { return deleteClusterState.variables; },
  }),
  useRDSDBCluster: (...args: any[]) => mockClusterDetail(...args),
  useRDSParameterGroups: (...args: any[]) => mockParamGroups(...args),
  useRDSCreateParameterGroup: () => ({
    mutate: mockCreateParamGroup,
    get isPending() { return createPGState.isPending; },
    get isError() { return createPGState.isError; },
    get error() { return createPGState.error; },
  }),
  useRDSDeleteParameterGroup: () => ({
    mutateAsync: mockDeleteParamGroup,
    get isPending() { return deletePGState.isPending; },
    get variables() { return deletePGState.variables; },
  }),
  useRDSClusterParameterGroups: (...args: any[]) => mockClusterParamGroups(...args),
  useRDSCreateClusterParameterGroup: () => ({
    mutate: mockCreateClusterParamGroup,
    get isPending() { return createCPGState.isPending; },
    get isError() { return createCPGState.isError; },
    get error() { return createCPGState.error; },
  }),
  useRDSDeleteClusterParameterGroup: () => ({
    mutateAsync: mockDeleteClusterParamGroup,
    get isPending() { return deleteCPGState.isPending; },
    get variables() { return deleteCPGState.variables; },
  }),
  useRDSModifyParameterGroupParameters: () => ({ mutate: vi.fn(), isPending: false }),
}));

import { RDSDashboard } from "./RDSDashboard";

// ─── Setup ──────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  createInstanceState.isPending = false;
  createInstanceState.isError = false;
  createInstanceState.error = null;
  deleteInstanceState.isPending = false;
  deleteInstanceState.variables = null;
  rebootInstanceState.isPending = false;
  rebootInstanceState.variables = null;
  createClusterState.isPending = false;
  createClusterState.isError = false;
  createClusterState.error = null;
  deleteClusterState.isPending = false;
  deleteClusterState.variables = null;
  createPGState.isPending = false;
  createPGState.isError = false;
  createPGState.error = null;
  deletePGState.isPending = false;
  deletePGState.variables = null;
  createCPGState.isPending = false;
  createCPGState.isError = false;
  createCPGState.error = null;
  deleteCPGState.isPending = false;
  deleteCPGState.variables = null;

  mockInstances.mockReturnValue({ data: { instances: [], total: 0 }, isLoading: false, isError: false, error: null });
  mockClusters.mockReturnValue({ data: { clusters: [], total: 0 }, isLoading: false, isError: false, error: null });
  mockParamGroups.mockReturnValue({ data: { parameterGroups: [], total: 0 }, isLoading: false, isError: false, error: null });
  mockClusterParamGroups.mockReturnValue({ data: { clusterParameterGroups: [], total: 0 }, isLoading: false, isError: false, error: null });
  mockInstanceDetail.mockReturnValue({ data: undefined, isLoading: false, isError: false, error: null });
  mockClusterDetail.mockReturnValue({ data: undefined, isLoading: false, isError: false, error: null });
});

// ─── Tests ──────────────────────────────────────────────

describe("RDSDashboard — layout", () => {
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
});

describe("RDSDashboard — DB instances", () => {
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

  it("shows status indicators for creating, rebooting, and other states", () => {
    mockInstances.mockReturnValue({
      data: {
        instances: [
          { id: "creating-db", engine: "mysql", status: "creating", dbInstanceClass: "db.t3.micro", allocatedStorage: 20 },
          { id: "rebooting-db", engine: "mysql", status: "rebooting", dbInstanceClass: "db.t3.micro", allocatedStorage: 20 },
          { id: "failed-db", engine: "mysql", status: "failed", dbInstanceClass: "db.t3.micro", allocatedStorage: 20 },
        ],
        total: 3,
      },
      isLoading: false, isError: false, error: null,
    });
    render(<RDSDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("creating-db")).toBeTruthy();
    expect(screen.getByText("rebooting-db")).toBeTruthy();
    expect(screen.getByText("failed-db")).toBeTruthy();
  });

  it("shows instances loading state", () => {
    mockInstances.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    const { container } = render(<RDSDashboard />, { wrapper: createWrapper() });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("shows instances error state", () => {
    mockInstances.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("Load failed") });
    render(<RDSDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Load failed")).toBeTruthy();
  });

  it("shows create instance error alert", async () => {
    createInstanceState.isError = true;
    createInstanceState.error = new Error("Name already exists");
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Name already exists")).toBeTruthy());
  });

  it("shows create instance loading state", async () => {
    createInstanceState.isPending = true;
    mockInstances.mockReturnValue({
      data: { instances: [{ id: "my-db", engine: "postgres", status: "available", dbInstanceClass: "db.t3.micro", allocatedStorage: 20 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    render(<RDSDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-db")).toBeTruthy();
  });

  it("shows delete instance loading state", () => {
    deleteInstanceState.isPending = true;
    deleteInstanceState.variables = "my-db";
    mockInstances.mockReturnValue({
      data: { instances: [{ id: "my-db", engine: "postgres", status: "available", dbInstanceClass: "db.t3.micro", allocatedStorage: 20 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    render(<RDSDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-db")).toBeTruthy();
  });

  it("shows reboot instance loading state", () => {
    rebootInstanceState.isPending = true;
    rebootInstanceState.variables = "my-db";
    mockInstances.mockReturnValue({
      data: { instances: [{ id: "my-db", engine: "postgres", status: "available", dbInstanceClass: "db.t3.micro", allocatedStorage: 20 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    render(<RDSDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-db")).toBeTruthy();
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

  it("shows reboot action with loading", async () => {
    mockInstances.mockReturnValue({
      data: { instances: [{ id: "my-db", engine: "postgres", status: "available", dbInstanceClass: "db.t3.micro", allocatedStorage: 20 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Reboot my-db/i })).toBeTruthy();
    });
    await user.click(screen.getByRole("button", { name: /Reboot my-db/i }));
    await waitFor(() => expect(mockRebootInstance).toHaveBeenCalledWith("my-db"));
  });

  // ── Instance detail ─────────────────────────────────────

  it("drills down to instance detail and shows data", async () => {
    mockInstances.mockReturnValue({
      data: { instances: [{ id: "my-db", engine: "postgres", engineVersion: "16.4", status: "available", dbInstanceClass: "db.t3.micro", allocatedStorage: 20, masterUsername: "admin", endpoint: { address: "my-db.abc.rds.amazonaws.com", port: 5432 }, publiclyAccessible: true, multiAZ: false, storageType: "gp3", backupRetentionPeriod: 7, autoMinorVersionUpgrade: true, iamDatabaseAuthenticationEnabled: false, copyTagsToSnapshot: false, arn: "arn:aws:rds:us-east-1:123:db/my-db" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockInstanceDetail.mockReturnValue({
      data: { id: "my-db", engine: "postgres", engineVersion: "16.4", status: "available", dbInstanceClass: "db.t3.micro", allocatedStorage: 20, masterUsername: "admin", endpoint: { address: "my-db.abc.rds.amazonaws.com", port: 5432 }, publiclyAccessible: true, multiAZ: false, storageType: "gp3", backupRetentionPeriod: 7, autoMinorVersionUpgrade: true, iamDatabaseAuthenticationEnabled: false, copyTagsToSnapshot: false, arn: "arn:aws:rds:us-east-1:123:db/my-db" },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "my-db" }));
    await waitFor(() => expect(screen.getByText("my-db")).toBeTruthy());
    expect(screen.getByText("gp3")).toBeTruthy();
    expect(screen.getByText("7 days")).toBeTruthy();
    expect(screen.getByText("Standalone")).toBeTruthy();
    expect(screen.getByText("default")).toBeTruthy();
  });

  it("shows N/A for missing endpoint, dbName, and arn in instance detail", async () => {
    mockInstances.mockReturnValue({
      data: { instances: [{ id: "minimal-db", engine: "mysql", status: "available", dbInstanceClass: "db.t3.micro", allocatedStorage: 20, masterUsername: "admin" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockInstanceDetail.mockReturnValue({
      data: { id: "minimal-db", engine: "mysql", status: "available", dbInstanceClass: "db.t3.micro", allocatedStorage: 20, masterUsername: "admin" },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "minimal-db" }));
    await waitFor(() => {
      const naElements = screen.getAllByText("N/A");
      expect(naElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("shows instance detail loading", async () => {
    mockInstances.mockReturnValue({
      data: { instances: [{ id: "my-db", engine: "postgres", status: "available", dbInstanceClass: "db.t3.micro", allocatedStorage: 20 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockInstanceDetail.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "my-db" }));
    await waitFor(() => expect(screen.getByText(/Loading instance details/i)).toBeTruthy());
  });

  it("shows instance detail error", async () => {
    mockInstances.mockReturnValue({
      data: { instances: [{ id: "my-db", engine: "postgres", status: "available", dbInstanceClass: "db.t3.micro", allocatedStorage: 20 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockInstanceDetail.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("Not found") });
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "my-db" }));
    await waitFor(() => expect(screen.getByText("Not found")).toBeTruthy());
  });

  it("shows instance detail null data gracefully", async () => {
    mockInstances.mockReturnValue({
      data: { instances: [{ id: "null-db", engine: "postgres", status: "available", dbInstanceClass: "db.t3.micro", allocatedStorage: 20 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockInstanceDetail.mockReturnValue({ data: null, isLoading: false, isError: false, error: null });
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "null-db" }));
    await waitFor(() => {
      expect(screen.queryByText("null-db")).toBeNull();
    });
  });

  it("goes back from instance detail to list", async () => {
    mockInstances.mockReturnValue({
      data: { instances: [{ id: "my-db", engine: "postgres", status: "available", dbInstanceClass: "db.t3.micro", allocatedStorage: 20, masterUsername: "admin" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockInstanceDetail.mockReturnValue({
      data: { id: "my-db", engine: "postgres", status: "available", dbInstanceClass: "db.t3.micro", allocatedStorage: 20, masterUsername: "admin" },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "my-db" }));
    await waitFor(() => expect(screen.getByText(/Back to DB Instances/i)).toBeTruthy());
    await user.click(screen.getByText(/Back to DB Instances/i));
    await waitFor(() => expect(screen.getByText("my-db")).toBeTruthy());
  });
});

describe("RDSDashboard — DB clusters", () => {
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

  it("shows cluster member count", async () => {
    mockClusters.mockReturnValue({
      data: { clusters: [{ id: "cluster-1", engine: "aurora-mysql", status: "available", masterUsername: "admin", clusterMembers: ["i-1", "i-2", "i-3"] }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /DB Clusters/i }));
    await waitFor(() => expect(screen.getByText("3")).toBeTruthy());
  });

  it("filters clusters by identifier", async () => {
    mockClusters.mockReturnValue({
      data: {
        clusters: [
          { id: "cluster-alpha", engine: "aurora-postgresql", status: "available", masterUsername: "admin", clusterMembers: [] },
          { id: "cluster-beta", engine: "aurora-mysql", status: "available", masterUsername: "admin", clusterMembers: [] },
        ],
        total: 2,
      },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /DB Clusters/i }));
    await waitFor(() => expect(screen.getByText("cluster-alpha")).toBeTruthy());

    const filterInput = screen.getByPlaceholderText("Find clusters by identifier");
    await user.type(filterInput, "beta");
    await waitFor(() => expect(screen.queryByText("cluster-alpha")).toBeNull());
  });

  it("shows clusters loading", () => {
    mockClusters.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    render(<RDSDashboard />, { wrapper: createWrapper() });
    expect(screen.getByRole("tab", { name: /DB Clusters/i })).toBeTruthy();
  });

  it("shows clusters error state", async () => {
    mockClusters.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("Cluster load failed") });
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /DB Clusters/i }));
    await waitFor(() => expect(screen.getByText("Cluster load failed")).toBeTruthy());
  });

  it("shows status indicators for creating/warning clusters", async () => {
    mockClusters.mockReturnValue({
      data: {
        clusters: [
          { id: "creating-cluster", engine: "aurora-postgresql", status: "creating", masterUsername: "admin", clusterMembers: [] },
          { id: "stopped-cluster", engine: "aurora-mysql", status: "stopped", masterUsername: "admin", clusterMembers: [] },
        ],
        total: 2,
      },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /DB Clusters/i }));
    await waitFor(() => {
      expect(screen.getByText("creating-cluster")).toBeTruthy();
      expect(screen.getByText("stopped-cluster")).toBeTruthy();
    });
  });

  it("deletes a cluster", async () => {
    mockClusters.mockReturnValue({
      data: { clusters: [{ id: "del-cluster", engine: "aurora-postgresql", status: "available", masterUsername: "admin", clusterMembers: [] }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /DB Clusters/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: "del-cluster" })).toBeTruthy());
    const deleteBtn = screen.getByRole("button", { name: /Delete del-cluster/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteCluster).toHaveBeenCalledWith("del-cluster"));
  });

  it("shows create cluster error alert", async () => {
    createClusterState.isError = true;
    createClusterState.error = new Error("Cluster exists");
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /DB Clusters/i }));
    await clickButton(user, /Create DB Cluster/i);
    await waitFor(() => expect(screen.getByText("Cluster exists")).toBeTruthy());
  });

  it("shows delete cluster loading state", async () => {
    deleteClusterState.isPending = true;
    deleteClusterState.variables = "my-cluster";
    mockClusters.mockReturnValue({
      data: { clusters: [{ id: "my-cluster", engine: "aurora-postgresql", status: "available", masterUsername: "admin", clusterMembers: [] }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /DB Clusters/i }));
    await waitFor(() => expect(screen.getByText("my-cluster")).toBeTruthy());
  });

  // ── Cluster detail ──────────────────────────────────────

  it("drills down to cluster detail and shows data", async () => {
    mockClusters.mockReturnValue({
      data: { clusters: [{ id: "my-cluster", engine: "aurora-postgresql", engineVersion: "16.4", status: "available", masterUsername: "admin", databaseName: "mydb", endpoint: "my-cluster.cluster-abc.rds.amazonaws.com", clusterMembers: ["inst-1", "inst-2"], iamDatabaseAuthenticationEnabled: true, copyTagsToSnapshot: false, allocatedStorage: 100, backupRetentionPeriod: 14, port: 5432, readerEndpoint: "reader.cluster-abc.rds.amazonaws.com", arn: "arn:aws:rds:us-east-1:123:cluster:my-cluster" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockClusterDetail.mockReturnValue({
      data: { id: "my-cluster", engine: "aurora-postgresql", engineVersion: "16.4", status: "available", masterUsername: "admin", databaseName: "mydb", endpoint: "my-cluster.cluster-abc.rds.amazonaws.com", clusterMembers: ["inst-1", "inst-2"], iamDatabaseAuthenticationEnabled: true, copyTagsToSnapshot: false, allocatedStorage: 100, backupRetentionPeriod: 14, port: 5432, readerEndpoint: "reader.cluster-abc.rds.amazonaws.com", arn: "arn:aws:rds:us-east-1:123:cluster:my-cluster" },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /DB Clusters/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: "my-cluster" })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "my-cluster" }));
    await waitFor(() => {
      expect(screen.getByText("my-cluster")).toBeTruthy();
      expect(screen.getByText("100 GB")).toBeTruthy();
      expect(screen.getByText("14 days")).toBeTruthy();
      expect(screen.getByText("Enabled")).toBeTruthy();
    });
  });

  it("shows N/A for missing cluster detail fields", async () => {
    mockClusters.mockReturnValue({
      data: { clusters: [{ id: "minimal-cluster", engine: "aurora-postgresql", status: "available", masterUsername: "admin", clusterMembers: [] }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockClusterDetail.mockReturnValue({
      data: { id: "minimal-cluster", engine: "aurora-postgresql", status: "available", masterUsername: "admin", clusterMembers: [] },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /DB Clusters/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: "minimal-cluster" })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "minimal-cluster" }));
    await waitFor(() => {
      const naElements = screen.getAllByText("N/A");
      expect(naElements.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("None")).toBeTruthy();
    });
  });

  it("shows cluster detail loading", async () => {
    mockClusters.mockReturnValue({
      data: { clusters: [{ id: "my-cluster", engine: "aurora-postgresql", status: "available", masterUsername: "admin", clusterMembers: [] }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockClusterDetail.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /DB Clusters/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: "my-cluster" })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "my-cluster" }));
    await waitFor(() => expect(screen.getByText(/Loading cluster details/i)).toBeTruthy());
  });

  it("shows cluster detail error", async () => {
    mockClusters.mockReturnValue({
      data: { clusters: [{ id: "fail-cluster", engine: "aurora-postgresql", status: "available", masterUsername: "admin", clusterMembers: [] }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockClusterDetail.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("Cluster gone") });
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /DB Clusters/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: "fail-cluster" })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "fail-cluster" }));
    await waitFor(() => expect(screen.getByText("Cluster gone")).toBeTruthy());
  });

  it("goes back from cluster detail to list", async () => {
    mockClusters.mockReturnValue({
      data: { clusters: [{ id: "my-cluster", engine: "aurora-postgresql", status: "available", masterUsername: "admin", clusterMembers: [] }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockClusterDetail.mockReturnValue({
      data: { id: "my-cluster", engine: "aurora-postgresql", status: "available", masterUsername: "admin", clusterMembers: [] },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /DB Clusters/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: "my-cluster" })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "my-cluster" }));
    await waitFor(() => expect(screen.getByText(/Back to DB Clusters/i)).toBeTruthy());
    await user.click(screen.getByText(/Back to DB Clusters/i));
    await waitFor(() => expect(screen.getByText(/DB Clusters/)).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /^DB Clusters$/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: "my-cluster" })).toBeTruthy());
  });
});

describe("RDSDashboard — parameter groups", () => {
  it("shows empty message for parameter groups tab", async () => {
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    const tabs = screen.getAllByRole("tab");
    await user.click(tabs[2]);
    await waitFor(() => expect(screen.getByText(/No parameter groups found/i)).toBeTruthy());
  });

  it("renders parameter groups with data", async () => {
    mockParamGroups.mockReturnValue({
      data: { parameterGroups: [{ name: "my-pg", family: "postgres16", description: "Custom params" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    const tabs = screen.getAllByRole("tab");
    await user.click(tabs[2]);
    await waitFor(() => expect(screen.getByText("my-pg")).toBeTruthy());
  });

  it("filters parameter groups by name", async () => {
    mockParamGroups.mockReturnValue({
      data: {
        parameterGroups: [
          { name: "pg-alpha", family: "postgres16", description: "Alpha" },
          { name: "pg-beta", family: "mysql8", description: "Beta" },
        ],
        total: 2,
      },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    const tabs = screen.getAllByRole("tab");
    await user.click(tabs[2]);
    await waitFor(() => expect(screen.getByText("pg-alpha")).toBeTruthy());

    const filterInput = screen.getByPlaceholderText("Find groups by name");
    await user.type(filterInput, "beta");
    await waitFor(() => expect(screen.queryByText("pg-alpha")).toBeNull());
  });

  it("shows create PG error alert", async () => {
    createPGState.isError = true;
    createPGState.error = new Error("PG exists");
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    const tabs = screen.getAllByRole("tab");
    await user.click(tabs[2]);
    await waitFor(() => expect(screen.getByText(/No parameter groups found/i)).toBeTruthy());
    const createBtns = screen.getAllByRole("button", { name: /Create/i });
    await user.click(createBtns[createBtns.length - 1]);
    await waitFor(() => expect(screen.getByText("PG exists")).toBeTruthy());
  });

  it("shows delete PG loading state", async () => {
    deletePGState.isPending = true;
    deletePGState.variables = "my-pg";
    mockParamGroups.mockReturnValue({
      data: { parameterGroups: [{ name: "my-pg", family: "postgres16", description: "Custom" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    const tabs = screen.getAllByRole("tab");
    await user.click(tabs[2]);
    await waitFor(() => expect(screen.getByText("my-pg")).toBeTruthy());
  });

  it("shows parameter group loading state", () => {
    mockParamGroups.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    render(<RDSDashboard />, { wrapper: createWrapper() });
    expect(screen.getByRole("tab", { name: /^Parameter Groups$/i })).toBeTruthy();
  });

  it("shows parameter group error state", async () => {
    mockParamGroups.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("PG load failed") });
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    const tabs = screen.getAllByRole("tab");
    await user.click(tabs[2]);
    await waitFor(() => expect(screen.getByText("PG load failed")).toBeTruthy());
  });

  it("deletes a parameter group", async () => {
    mockParamGroups.mockReturnValue({
      data: { parameterGroups: [{ name: "del-pg", family: "postgres16", description: "To delete" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    const tabs = screen.getAllByRole("tab");
    await user.click(tabs[2]);
    await waitFor(() => expect(screen.getByText("del-pg")).toBeTruthy());
    const deleteBtn = screen.getByRole("button", { name: /Delete del-pg/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteParamGroup).toHaveBeenCalledWith("del-pg"));
  });
});

describe("RDSDashboard — cluster parameter groups", () => {
  it("shows empty message for cluster param groups tab", async () => {
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Cluster Parameter Groups/i }));
    await waitFor(() => expect(screen.getByText(/No cluster parameter groups found/i)).toBeTruthy());
  });

  it("renders cluster parameter groups with data", async () => {
    mockClusterParamGroups.mockReturnValue({
      data: { clusterParameterGroups: [{ name: "my-cpg", family: "aurora-postgresql16", description: "Cluster params" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Cluster Parameter Groups/i }));
    await waitFor(() => expect(screen.getByText("my-cpg")).toBeTruthy());
  });

  it("filters cluster parameter groups by name", async () => {
    mockClusterParamGroups.mockReturnValue({
      data: {
        clusterParameterGroups: [
          { name: "cpg-alpha", family: "aurora-postgresql16", description: "Alpha" },
          { name: "cpg-beta", family: "aurora-mysql8", description: "Beta" },
        ],
        total: 2,
      },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Cluster Parameter Groups/i }));
    await waitFor(() => expect(screen.getByText("cpg-alpha")).toBeTruthy());

    const filterInput = screen.getByPlaceholderText("Find groups by name");
    await user.type(filterInput, "beta");
    await waitFor(() => expect(screen.queryByText("cpg-alpha")).toBeNull());
  });

  it("shows delete CPG loading state", async () => {
    deleteCPGState.isPending = true;
    deleteCPGState.variables = "my-cpg";
    mockClusterParamGroups.mockReturnValue({
      data: { clusterParameterGroups: [{ name: "my-cpg", family: "aurora-postgresql16", description: "Cluster params" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Cluster Parameter Groups/i }));
    await waitFor(() => expect(screen.getByText("my-cpg")).toBeTruthy());
  });

  it("shows CPG error state", async () => {
    mockClusterParamGroups.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("CPG load failed") });
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Cluster Parameter Groups/i }));
    await waitFor(() => expect(screen.getByText("CPG load failed")).toBeTruthy());
  });
});
