// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

/**
 * Cloudscape Modal handles Escape via a React onKeyDown on the dialog element
 * (checking `event.keyCode === 27`). Dispatch it directly on the dialog since
 * user-event's keyboard() targets the active element in happy-dom.
 */
function dismissModalWithEscape() {
  const dialog = document.querySelector('[class*="awsui_dialog"]') as HTMLElement;
  fireEvent.keyDown(dialog, { keyCode: 27 });
}

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

const createSGState = vi.hoisted(() => ({
  isPending: false,
  isError: false,
  error: null as Error | null,
}));

const deleteSGState = vi.hoisted(() => ({
  isPending: false,
  variables: null as string | null,
}));

const addTagsState = vi.hoisted(() => ({
  isPending: false,
  isError: false,
  error: null as Error | null,
}));

const removeTagsState = vi.hoisted(() => ({
  isPending: false,
  isError: false,
  error: null as Error | null,
  variables: null as any,
}));

const mockAddTagsReset = vi.hoisted(() => vi.fn());
const mockRemoveTagsReset = vi.hoisted(() => vi.fn());

const mockApi = vi.hoisted(() => vi.fn());

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
const mockSubnetGroups = vi.fn();
const mockCreateSubnetGroup = vi.fn();
const mockDeleteSubnetGroup = vi.fn();
const mockModifyParams = vi.fn();
const mockModifyClusterParams = vi.fn();
const mockTags = vi.fn();
const mockAddTags = vi.fn();
const mockRemoveTags = vi.fn();

vi.mock("../../lib/client", () => ({ api: (...args: any[]) => mockApi(...args) }));

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
  useRDSModifyParameterGroupParameters: () => ({ mutate: mockModifyParams, isPending: false }),
  useRDSModifyClusterParameterGroupParameters: () => ({ mutate: mockModifyClusterParams, isPending: false }),
  useDBSubnetGroups: (...args: any[]) => mockSubnetGroups(...args),
  useCreateDBSubnetGroup: () => ({
    mutate: mockCreateSubnetGroup,
    mutateAsync: vi.fn().mockResolvedValue({}),
    get isPending() { return createSGState.isPending; },
    get isError() { return createSGState.isError; },
    get error() { return createSGState.error; },
  }),
  useDeleteDBSubnetGroup: () => ({
    mutateAsync: mockDeleteSubnetGroup,
    get isPending() { return deleteSGState.isPending; },
    get variables() { return deleteSGState.variables; },
  }),
  useRDSTags: (...args: any[]) => mockTags(...args),
  useRDSAddTags: () => ({
    mutateAsync: mockAddTags,
    reset: mockAddTagsReset,
    get isPending() { return addTagsState.isPending; },
    get isError() { return addTagsState.isError; },
    get error() { return addTagsState.error; },
  }),
  useRDSRemoveTags: () => ({
    mutateAsync: mockRemoveTags,
    reset: mockRemoveTagsReset,
    get isPending() { return removeTagsState.isPending; },
    get isError() { return removeTagsState.isError; },
    get error() { return removeTagsState.error; },
    get variables() { return removeTagsState.variables; },
  }),
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
  createSGState.isPending = false;
  createSGState.isError = false;
  createSGState.error = null;
  deleteSGState.isPending = false;
  deleteSGState.variables = null;
  addTagsState.isPending = false;
  addTagsState.isError = false;
  addTagsState.error = null;
  removeTagsState.isPending = false;
  removeTagsState.isError = false;
  removeTagsState.error = null;
  removeTagsState.variables = null;
  mockAddTagsReset.mockClear();
  mockRemoveTagsReset.mockClear();

  mockApi.mockReset();

  mockInstances.mockReturnValue({ data: { instances: [], total: 0 }, isLoading: false, isError: false, error: null });
  mockClusters.mockReturnValue({ data: { clusters: [], total: 0 }, isLoading: false, isError: false, error: null });
  mockParamGroups.mockReturnValue({ data: { parameterGroups: [], total: 0 }, isLoading: false, isError: false, error: null });
  mockClusterParamGroups.mockReturnValue({ data: { clusterParameterGroups: [], total: 0 }, isLoading: false, isError: false, error: null });
  mockSubnetGroups.mockReturnValue({ data: { subnetGroups: [], total: 0 }, isLoading: false, isError: false, error: null });
  mockInstanceDetail.mockReturnValue({ data: undefined, isLoading: false, isError: false, error: null });
  mockClusterDetail.mockReturnValue({ data: undefined, isLoading: false, isError: false, error: null });
  mockTags.mockReturnValue({ data: undefined, isLoading: false, isError: false, error: null });
  mockCreateInstance.mockImplementation((_body, opts) => opts?.onSuccess?.());
  mockCreateCluster.mockImplementation((_body, opts) => opts?.onSuccess?.());
  mockCreateParamGroup.mockImplementation((_body, opts) => opts?.onSuccess?.());
  mockCreateClusterParamGroup.mockImplementation((_body, opts) => opts?.onSuccess?.());
  mockCreateSubnetGroup.mockImplementation((_body, opts) => opts?.onSuccess?.());
  mockModifyParams.mockImplementation((_body, opts) => opts?.onSuccess?.());
  mockModifyClusterParams.mockImplementation((_body, opts) => opts?.onSuccess?.());
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

  it("creates a DB instance from the create modal", async () => {
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByPlaceholderText("my-database")).toBeTruthy());
    const input = screen.getByPlaceholderText("my-database");
    await user.type(input, "created-db");
    await clickButton(user, /^Create instance$/i);
    await waitFor(() => {
      expect(mockCreateInstance).toHaveBeenCalledWith(
        expect.objectContaining({ dbInstanceIdentifier: "created-db" }),
        expect.any(Object),
      );
    });
  });

  it("cancels the create instance modal and resets the form", async () => {
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /^Create DB Instance$/i);
    const input = screen.getByPlaceholderText("my-database");
    await user.type(input, "temp-db");
    await clickButton(user, /^Cancel$/i);
    await waitFor(() => expect((input as HTMLInputElement).value).toBe(""));
  });

  it("dismisses the create instance modal with Escape", async () => {
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /^Create DB Instance$/i);
    const input = screen.getByPlaceholderText("my-database");
    await user.type(input, "temp-db");
    dismissModalWithEscape();
    await waitFor(() => expect((input as HTMLInputElement).value).toBe(""));
  });

  it("creates a DB instance with all form fields", async () => {
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /^Create DB Instance$/i);
    await user.type(screen.getByPlaceholderText("my-database"), "full-db");
    // Engine select -> MySQL
    await user.click(screen.getByRole("button", { name: /PostgreSQL/i }));
    await user.click(screen.getByRole("option", { name: /MySQL/i }));
    // Class select -> db.t3.small
    await user.click(screen.getByRole("button", { name: /db.t3.micro/i }));
    await user.click(screen.getByRole("option", { name: /db.t3.small/i }));
    const userInput = screen.getByDisplayValue("admin");
    await user.clear(userInput);
    await user.type(userInput, "root");
    const passInput = screen.getByDisplayValue("password");
    await user.clear(passInput);
    await user.type(passInput, "secret");
    const storageInput = screen.getByDisplayValue("20");
    await user.clear(storageInput);
    await user.type(storageInput, "30");
    await user.type(screen.getByPlaceholderText("mydb"), "appdb");
    await user.type(screen.getByPlaceholderText("16.4"), "16.5");
    await clickButton(user, /^Create instance$/i);
    await waitFor(() => {
      expect(mockCreateInstance).toHaveBeenCalledWith(
        expect.objectContaining({
          dbInstanceIdentifier: "full-db",
          engine: "mysql",
          dbInstanceClass: "db.t3.small",
          masterUsername: "root",
          masterPassword: "secret",
          allocatedStorage: 30,
          dbName: "appdb",
          engineVersion: "16.5",
        }),
        expect.any(Object),
      );
    });
  });

  it("shows create instance fallback error message", async () => {
    createInstanceState.isError = true;
    createInstanceState.error = new Error();
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /^Create DB Instance$/i);
    await waitFor(() => expect(screen.getByText(/Failed to create DB instance/i)).toBeTruthy());
  });

  it("falls back to 20 GB when allocated storage is not a number", async () => {
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /^Create DB Instance$/i);
    await user.type(screen.getByPlaceholderText("my-database"), "storage-db");
    const storageInput = screen.getByDisplayValue("20");
    await user.clear(storageInput);
    await user.type(storageInput, "abc");
    await clickButton(user, /^Create instance$/i);
    await waitFor(() => {
      expect(mockCreateInstance).toHaveBeenCalledWith(
        expect.objectContaining({ dbInstanceIdentifier: "storage-db", allocatedStorage: 20 }),
        expect.any(Object),
      );
    });
  });

  it("shows instances fallback error message", () => {
    mockInstances.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: {} });
    render(<RDSDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/Failed to load DB instances/i)).toBeTruthy();
  });

  it("shows Yes/Enabled for instance detail boolean flags", async () => {
    mockInstances.mockReturnValue({
      data: { instances: [{ id: "flag-db", engine: "postgres", status: "available", dbInstanceClass: "db.t3.micro", allocatedStorage: 20 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockInstanceDetail.mockReturnValue({
      data: { id: "flag-db", engine: "postgres", status: "available", dbInstanceClass: "db.t3.micro", allocatedStorage: 20, masterUsername: "admin", endpoint: { address: "a", port: 1 }, publiclyAccessible: true, multiAZ: true, storageType: "gp3", backupRetentionPeriod: 7, autoMinorVersionUpgrade: true, iamDatabaseAuthenticationEnabled: true, copyTagsToSnapshot: true, dbName: "app", dbClusterIdentifier: "cluster", parameterGroupName: "pg", arn: "arn" },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "flag-db" }));
    await waitFor(() => {
      expect(screen.getAllByText("Yes").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Enabled").length).toBeGreaterThanOrEqual(1);
    });
  });

  it("reboots an instance from the detail view", async () => {
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
    await waitFor(() => expect(screen.getByRole("button", { name: /^Reboot$/i })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Reboot$/i }));
    await waitFor(() => expect(mockRebootInstance).toHaveBeenCalledWith("my-db"));
  });

  it("deletes an instance from the detail view and goes back", async () => {
    mockDeleteInstance.mockResolvedValue({});
    mockInstances.mockReturnValue({
      data: { instances: [{ id: "del-detail", engine: "postgres", status: "available", dbInstanceClass: "db.t3.micro", allocatedStorage: 20, masterUsername: "admin" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockInstanceDetail.mockReturnValue({
      data: { id: "del-detail", engine: "postgres", status: "available", dbInstanceClass: "db.t3.micro", allocatedStorage: 20, masterUsername: "admin" },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "del-detail" }));
    await waitFor(() => expect(screen.getByText(/Back to DB Instances/i)).toBeTruthy());
    const delBtn = screen.getByRole("button", { name: /Delete del-detail/i });
    await user.click(delBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteInstance).toHaveBeenCalledWith("del-detail"));
    await waitFor(() => expect(screen.queryByText(/Back to DB Instances/i)).toBeNull());
  });

  it("shows delete loading in instance detail", async () => {
    deleteInstanceState.isPending = true;
    deleteInstanceState.variables = "my-db";
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
  });

  it("shows instance detail fallback error message", async () => {
    mockInstances.mockReturnValue({
      data: { instances: [{ id: "my-db", engine: "postgres", status: "available", dbInstanceClass: "db.t3.micro", allocatedStorage: 20 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockInstanceDetail.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: {} });
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "my-db" }));
    await waitFor(() => expect(screen.getByText(/Failed to load instance details/i)).toBeTruthy());
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

  it("creates a DB cluster from the create modal", async () => {
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /DB Clusters/i }));
    await waitFor(() => expect(screen.getByText(/No DB clusters found/i)).toBeTruthy());
    await clickButton(user, /Create DB Cluster/i);
    await waitFor(() => expect(screen.getByPlaceholderText("my-cluster")).toBeTruthy());
    const input = screen.getByPlaceholderText("my-cluster");
    await user.type(input, "created-cluster");
    await clickButton(user, /^Create cluster$/i);
    await waitFor(() => {
      expect(mockCreateCluster).toHaveBeenCalledWith(
        expect.objectContaining({ dbClusterIdentifier: "created-cluster" }),
        expect.any(Object),
      );
    });
  });

  it("cancels the create cluster modal and resets the form", async () => {
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /DB Clusters/i }));
    await clickButton(user, /^Create DB Cluster$/i);
    const input = screen.getByPlaceholderText("my-cluster");
    await user.type(input, "temp-cluster");
    await clickButton(user, /^Cancel$/i);
    await waitFor(() => expect((input as HTMLInputElement).value).toBe(""));
  });

  it("dismisses the create cluster modal with Escape", async () => {
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /DB Clusters/i }));
    await clickButton(user, /^Create DB Cluster$/i);
    const input = screen.getByPlaceholderText("my-cluster");
    await user.type(input, "temp-cluster");
    dismissModalWithEscape();
    await waitFor(() => expect((input as HTMLInputElement).value).toBe(""));
  });

  it("creates a DB cluster with all form fields", async () => {
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /DB Clusters/i }));
    await clickButton(user, /^Create DB Cluster$/i);
    await user.type(screen.getByPlaceholderText("my-cluster"), "full-cluster");
    // Engine select -> Aurora MySQL
    await user.click(screen.getByRole("button", { name: /Aurora PostgreSQL/i }));
    await user.click(screen.getByRole("option", { name: /Aurora MySQL/i }));
    await user.type(screen.getByPlaceholderText("16.4"), "15.2");
    const userInput = screen.getByDisplayValue("admin");
    await user.clear(userInput);
    await user.type(userInput, "root");
    const passInput = screen.getByDisplayValue("password");
    await user.clear(passInput);
    await user.type(passInput, "secret");
    await user.type(screen.getByPlaceholderText("mydb"), "appdb");
    await clickButton(user, /^Create cluster$/i);
    await waitFor(() => {
      expect(mockCreateCluster).toHaveBeenCalledWith(
        expect.objectContaining({
          dbClusterIdentifier: "full-cluster",
          engine: "aurora-mysql",
          engineVersion: "15.2",
          masterUsername: "root",
          masterPassword: "secret",
          databaseName: "appdb",
        }),
        expect.any(Object),
      );
    });
  });

  it("shows create cluster fallback error message", async () => {
    createClusterState.isError = true;
    createClusterState.error = new Error();
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /DB Clusters/i }));
    await clickButton(user, /^Create DB Cluster$/i);
    await waitFor(() => expect(screen.getByText(/Failed to create DB cluster/i)).toBeTruthy());
  });

  it("shows clusters fallback error message", async () => {
    mockClusters.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: {} });
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /DB Clusters/i }));
    await waitFor(() => expect(screen.getByText(/Failed to load DB clusters/i)).toBeTruthy());
  });

  it("shows cluster detail null data gracefully", async () => {
    mockClusters.mockReturnValue({
      data: { clusters: [{ id: "null-cluster", engine: "aurora-postgresql", status: "available", masterUsername: "admin", clusterMembers: [] }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockClusterDetail.mockReturnValue({ data: null, isLoading: false, isError: false, error: null });
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /DB Clusters/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: "null-cluster" })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "null-cluster" }));
    await waitFor(() => expect(screen.queryByText("null-cluster")).toBeNull());
  });

  it("shows cluster detail copyTags to snapshots", async () => {
    mockClusters.mockReturnValue({
      data: { clusters: [{ id: "flag-cluster", engine: "aurora-postgresql", status: "available", masterUsername: "admin", clusterMembers: [] }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockClusterDetail.mockReturnValue({
      data: { id: "flag-cluster", engine: "aurora-postgresql", status: "available", masterUsername: "admin", clusterMembers: [], copyTagsToSnapshot: true, iamDatabaseAuthenticationEnabled: false, allocatedStorage: 0, backupRetentionPeriod: 0 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /DB Clusters/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: "flag-cluster" })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "flag-cluster" }));
    await waitFor(() => expect(screen.getByText("Yes")).toBeTruthy());
  });

  it("deletes a cluster from the detail view and goes back", async () => {
    mockDeleteCluster.mockResolvedValue({});
    mockClusters.mockReturnValue({
      data: { clusters: [{ id: "del-cluster", engine: "aurora-postgresql", status: "available", masterUsername: "admin", clusterMembers: [] }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockClusterDetail.mockReturnValue({
      data: { id: "del-cluster", engine: "aurora-postgresql", status: "available", masterUsername: "admin", clusterMembers: [] },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /DB Clusters/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: "del-cluster" })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "del-cluster" }));
    await waitFor(() => expect(screen.getByText(/Back to DB Clusters/i)).toBeTruthy());
    const delBtn = screen.getByRole("button", { name: /Delete del-cluster/i });
    await user.click(delBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteCluster).toHaveBeenCalledWith("del-cluster"));
    await waitFor(() => expect(screen.queryByText(/Back to DB Clusters/i)).toBeNull());
  });

  it("shows delete loading in cluster detail", async () => {
    deleteClusterState.isPending = true;
    deleteClusterState.variables = "my-cluster";
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
  });

  it("shows cluster detail fallback error message", async () => {
    mockClusters.mockReturnValue({
      data: { clusters: [{ id: "fail-cluster", engine: "aurora-postgresql", status: "available", masterUsername: "admin", clusterMembers: [] }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockClusterDetail.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: {} });
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /DB Clusters/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: "fail-cluster" })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "fail-cluster" }));
    await waitFor(() => expect(screen.getByText(/Failed to load cluster details/i)).toBeTruthy());
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

  it("creates a parameter group with a description", async () => {
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    const tabs = screen.getAllByRole("tab");
    await user.click(tabs[2]);
    await clickButton(user, /^Create Parameter Group$/i);
    await user.type(screen.getByPlaceholderText("my-params"), "my-pg");
    // Family select -> mysql8
    await user.click(screen.getByRole("button", { name: /postgres16/i }));
    await user.click(screen.getByRole("option", { name: /mysql8/i }));
    await user.type(screen.getByPlaceholderText("My custom parameter group"), "Custom params");
    await clickButton(user, /^Create group$/i);
    await waitFor(() => {
      expect(mockCreateParamGroup).toHaveBeenCalledWith(
        expect.objectContaining({
          dbParameterGroupName: "my-pg",
          dbParameterGroupFamily: "mysql8",
          description: "Custom params",
        }),
        expect.any(Object),
      );
    });
  });

  it("creates a parameter group without a description", async () => {
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    const tabs = screen.getAllByRole("tab");
    await user.click(tabs[2]);
    await clickButton(user, /^Create Parameter Group$/i);
    await user.type(screen.getByPlaceholderText("my-params"), "plain-pg");
    await clickButton(user, /^Create group$/i);
    await waitFor(() => {
      expect(mockCreateParamGroup).toHaveBeenCalledWith(
        expect.objectContaining({ dbParameterGroupName: "plain-pg", description: undefined }),
        expect.any(Object),
      );
    });
  });

  it("cancels the create parameter group modal and resets the form", async () => {
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    const tabs = screen.getAllByRole("tab");
    await user.click(tabs[2]);
    await clickButton(user, /^Create Parameter Group$/i);
    const input = screen.getByPlaceholderText("my-params");
    await user.type(input, "temp-pg");
    await clickButton(user, /^Cancel$/i);
    await waitFor(() => expect((input as HTMLInputElement).value).toBe(""));
  });

  it("dismisses the create parameter group modal with Escape", async () => {
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    const tabs = screen.getAllByRole("tab");
    await user.click(tabs[2]);
    await clickButton(user, /^Create Parameter Group$/i);
    const input = screen.getByPlaceholderText("my-params");
    await user.type(input, "temp-pg");
    dismissModalWithEscape();
    await waitFor(() => expect((input as HTMLInputElement).value).toBe(""));
  });

  it("shows create parameter group fallback error message", async () => {
    createPGState.isError = true;
    createPGState.error = new Error();
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    const tabs = screen.getAllByRole("tab");
    await user.click(tabs[2]);
    await clickButton(user, /^Create Parameter Group$/i);
    await waitFor(() => expect(screen.getByText(/Failed to create parameter group/i)).toBeTruthy());
  });

  it("shows parameter groups fallback error message", async () => {
    mockParamGroups.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: {} });
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    const tabs = screen.getAllByRole("tab");
    await user.click(tabs[2]);
    await waitFor(() => expect(screen.getByText(/Failed to load parameter groups/i)).toBeTruthy());
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

  it("shows CPG fallback error message", async () => {
    mockClusterParamGroups.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: {} });
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Cluster Parameter Groups/i }));
    await waitFor(() => expect(screen.getByText(/Failed to load cluster parameter groups/i)).toBeTruthy());
  });

  it("creates a cluster parameter group with a description", async () => {
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Cluster Parameter Groups/i }));
    await clickButton(user, /^Create Cluster Parameter Group$/i);
    await user.type(screen.getByPlaceholderText("my-cluster-params"), "my-cpg");
    // Family select -> aurora-mysql8
    await user.click(screen.getByRole("button", { name: /aurora-postgresql16/i }));
    await user.click(screen.getByRole("option", { name: /aurora-mysql8/i }));
    await user.type(screen.getByPlaceholderText("My custom cluster parameter group"), "Cluster params");
    await clickButton(user, /^Create group$/i);
    await waitFor(() => {
      expect(mockCreateClusterParamGroup).toHaveBeenCalledWith(
        expect.objectContaining({
          dbClusterParameterGroupName: "my-cpg",
          dbParameterGroupFamily: "aurora-mysql8",
          description: "Cluster params",
        }),
        expect.any(Object),
      );
    });
  });

  it("creates a cluster parameter group without a description", async () => {
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Cluster Parameter Groups/i }));
    await clickButton(user, /^Create Cluster Parameter Group$/i);
    await user.type(screen.getByPlaceholderText("my-cluster-params"), "plain-cpg");
    await clickButton(user, /^Create group$/i);
    await waitFor(() => {
      expect(mockCreateClusterParamGroup).toHaveBeenCalledWith(
        expect.objectContaining({ dbClusterParameterGroupName: "plain-cpg", description: undefined }),
        expect.any(Object),
      );
    });
  });

  it("cancels the create cluster parameter group modal and resets the form", async () => {
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Cluster Parameter Groups/i }));
    await clickButton(user, /^Create Cluster Parameter Group$/i);
    const input = screen.getByPlaceholderText("my-cluster-params");
    await user.type(input, "temp-cpg");
    await clickButton(user, /^Cancel$/i);
    await waitFor(() => expect((input as HTMLInputElement).value).toBe(""));
  });

  it("dismisses the create cluster parameter group modal with Escape", async () => {
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Cluster Parameter Groups/i }));
    await clickButton(user, /^Create Cluster Parameter Group$/i);
    const input = screen.getByPlaceholderText("my-cluster-params");
    await user.type(input, "temp-cpg");
    dismissModalWithEscape();
    await waitFor(() => expect((input as HTMLInputElement).value).toBe(""));
  });

  it("shows create cluster parameter group error alert", async () => {
    createCPGState.isError = true;
    createCPGState.error = new Error("CPG exists");
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Cluster Parameter Groups/i }));
    await clickButton(user, /^Create Cluster Parameter Group$/i);
    await waitFor(() => expect(screen.getByText("CPG exists")).toBeTruthy());
  });

  it("shows create cluster parameter group fallback error message", async () => {
    createCPGState.isError = true;
    createCPGState.error = new Error();
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Cluster Parameter Groups/i }));
    await clickButton(user, /^Create Cluster Parameter Group$/i);
    await waitFor(() => expect(screen.getByText(/Failed to create cluster parameter group/i)).toBeTruthy());
  });

  it("deletes a cluster parameter group", async () => {
    mockClusterParamGroups.mockReturnValue({
      data: { clusterParameterGroups: [{ name: "del-cpg", family: "aurora-postgresql16", description: "To delete" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Cluster Parameter Groups/i }));
    await waitFor(() => expect(screen.getByText("del-cpg")).toBeTruthy());
    const deleteBtn = screen.getByRole("button", { name: /Delete del-cpg/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteClusterParamGroup).toHaveBeenCalledWith("del-cpg"));
  });
});

describe("RDSDashboard — DB subnet groups", () => {
  it("shows empty message for subnet groups tab", async () => {
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /DB Subnet Groups/i }));
    await waitFor(() => expect(screen.getByText(/No DB subnet groups found/i)).toBeTruthy());
  });

  it("renders subnet groups with data", async () => {
    mockSubnetGroups.mockReturnValue({
      data: {
        subnetGroups: [
          { name: "my-sg", description: "My subnet group", vpcId: "vpc-1234", status: "Complete", subnets: [{ subnetId: "subnet-abc" }, { subnetId: "subnet-def" }] },
        ],
        total: 1,
      },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /DB Subnet Groups/i }));
    await waitFor(() => {
      expect(screen.getByText("my-sg")).toBeTruthy();
      expect(screen.getByText("My subnet group")).toBeTruthy();
      expect(screen.getByText("vpc-1234")).toBeTruthy();
      expect(screen.getByText("Complete")).toBeTruthy();
      expect(screen.getByText("2")).toBeTruthy();
    });
  });

  it("shows dashes for missing subnet group fields", async () => {
    mockSubnetGroups.mockReturnValue({
      data: { subnetGroups: [{ name: "minimal-sg", subnets: [] }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /DB Subnet Groups/i }));
    await waitFor(() => {
      expect(screen.getByText("minimal-sg")).toBeTruthy();
      expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText("0")).toBeTruthy();
    });
  });

  it("shows status indicator for in-progress subnet groups", async () => {
    mockSubnetGroups.mockReturnValue({
      data: {
        subnetGroups: [
          { name: "pending-sg", description: "Pending", vpcId: "vpc-5678", status: "Creating", subnets: [{ subnetId: "subnet-xyz" }] },
        ],
        total: 1,
      },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /DB Subnet Groups/i }));
    await waitFor(() => {
      expect(screen.getByText("Creating")).toBeTruthy();
    });
  });

  it("filters subnet groups by name", async () => {
    mockSubnetGroups.mockReturnValue({
      data: {
        subnetGroups: [
          { name: "sg-alpha", description: "Alpha", vpcId: "vpc-1", status: "Complete", subnets: [] },
          { name: "sg-beta", description: "Beta", vpcId: "vpc-2", status: "Complete", subnets: [] },
        ],
        total: 2,
      },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /DB Subnet Groups/i }));
    await waitFor(() => expect(screen.getByText("sg-alpha")).toBeTruthy());

    const filterInput = screen.getByPlaceholderText("Find subnet groups by name");
    await user.type(filterInput, "beta");
    await waitFor(() => expect(screen.queryByText("sg-alpha")).toBeNull());
  });

  it("shows subnet groups loading state", () => {
    mockSubnetGroups.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    render(<RDSDashboard />, { wrapper: createWrapper() });
    expect(screen.getByRole("tab", { name: /DB Subnet Groups/i })).toBeTruthy();
  });

  it("shows subnet groups error state", async () => {
    mockSubnetGroups.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("SG load failed") });
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /DB Subnet Groups/i }));
    await waitFor(() => expect(screen.getByText("SG load failed")).toBeTruthy());
  });

  it("opens create subnet group modal and shows form fields", async () => {
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /DB Subnet Groups/i }));
    await clickButton(user, /Create/i);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("my-subnet-group")).toBeTruthy();
    });
    expect(screen.getByPlaceholderText("My subnet group")).toBeTruthy();
    expect(screen.getByPlaceholderText("subnet-abc123, subnet-def456")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Cancel/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Create subnet group/i })).toBeTruthy();
  });

  it("shows create subnet group error alert", async () => {
    createSGState.isError = true;
    createSGState.error = new Error("Name exists");
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /DB Subnet Groups/i }));
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Name exists")).toBeTruthy());
  });

  it("shows delete subnet group loading state", async () => {
    deleteSGState.isPending = true;
    deleteSGState.variables = "my-sg";
    mockSubnetGroups.mockReturnValue({
      data: {
        subnetGroups: [{ name: "my-sg", description: "My SG", vpcId: "vpc-1", status: "Complete", subnets: [] }],
        total: 1,
      },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /DB Subnet Groups/i }));
    await waitFor(() => expect(screen.getByText("my-sg")).toBeTruthy());
  });

  it("deletes a subnet group", async () => {
    mockSubnetGroups.mockReturnValue({
      data: {
        subnetGroups: [{ name: "del-sg", description: "To delete", vpcId: "vpc-1", status: "Complete", subnets: [] }],
        total: 1,
      },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /DB Subnet Groups/i }));
    await waitFor(() => screen.getByText("del-sg"));

    const deleteBtn = screen.getByRole("button", { name: /Delete del-sg/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteSubnetGroup).toHaveBeenCalledWith("del-sg"));
  });

  it("creates a subnet group from the create modal", async () => {
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /DB Subnet Groups/i }));
    await waitFor(() => expect(screen.getByText(/No DB subnet groups found/i)).toBeTruthy());
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByPlaceholderText("my-subnet-group")).toBeTruthy());
    const nameInput = screen.getByPlaceholderText("my-subnet-group");
    await user.type(nameInput, "new-sg");
    const subnetInput = screen.getByPlaceholderText("subnet-abc123, subnet-def456");
    await user.type(subnetInput, "subnet-xyz");
    await clickButton(user, /^Create subnet group$/i);
    await waitFor(() => {
      expect(mockCreateSubnetGroup).toHaveBeenCalledWith(
        expect.objectContaining({ dbSubnetGroupName: "new-sg" }),
        expect.any(Object),
      );
    });
  });

  it("creates a subnet group with a description and multiple subnets", async () => {
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /DB Subnet Groups/i }));
    await waitFor(() => expect(screen.getByText(/No DB subnet groups found/i)).toBeTruthy());
    await clickButton(user, /^Create DB Subnet Group$/i);
    await user.type(screen.getByPlaceholderText("my-subnet-group"), "desc-sg");
    await user.type(screen.getByPlaceholderText("My subnet group"), "My description");
    await user.type(screen.getByPlaceholderText("subnet-abc123, subnet-def456"), "subnet-1, subnet-2, ");
    await clickButton(user, /^Create subnet group$/i);
    await waitFor(() => {
      expect(mockCreateSubnetGroup).toHaveBeenCalledWith(
        expect.objectContaining({
          dbSubnetGroupName: "desc-sg",
          dbSubnetGroupDescription: "My description",
          subnetIds: ["subnet-1", "subnet-2"],
        }),
        expect.any(Object),
      );
    });
  });

  it("cancels the create subnet group modal and resets the form", async () => {
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /DB Subnet Groups/i }));
    await clickButton(user, /^Create DB Subnet Group$/i);
    const input = screen.getByPlaceholderText("my-subnet-group");
    await user.type(input, "temp-sg");
    await clickButton(user, /^Cancel$/i);
    await waitFor(() => expect((input as HTMLInputElement).value).toBe(""));
  });

  it("dismisses the create subnet group modal with Escape", async () => {
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /DB Subnet Groups/i }));
    await clickButton(user, /^Create DB Subnet Group$/i);
    const input = screen.getByPlaceholderText("my-subnet-group");
    await user.type(input, "temp-sg");
    dismissModalWithEscape();
    await waitFor(() => expect((input as HTMLInputElement).value).toBe(""));
  });

  it("shows create subnet group fallback error message", async () => {
    createSGState.isError = true;
    createSGState.error = new Error();
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /DB Subnet Groups/i }));
    await clickButton(user, /^Create DB Subnet Group$/i);
    await waitFor(() => expect(screen.getByText(/Failed to create subnet group/i)).toBeTruthy());
  });

  it("shows subnet groups fallback error message", async () => {
    mockSubnetGroups.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: {} });
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /DB Subnet Groups/i }));
    await waitFor(() => expect(screen.getByText(/Failed to load subnet groups/i)).toBeTruthy());
  });
});

describe("RDSDashboard — parameter group drill-down", () => {
  it("drills down to parameter group parameters and shows data", async () => {
    mockParamGroups.mockReturnValue({
      data: { parameterGroups: [{ name: "my-pg", family: "postgres16", description: "Custom params" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockApi.mockResolvedValueOnce({
      parameters: [
        { name: "max_connections", value: "100", applyType: "static", source: "user", isModifiable: false },
        { name: "timezone", value: "UTC", applyType: "dynamic", source: "engine-default", isModifiable: true },
      ],
      total: 2,
    });

    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    const tabs = screen.getAllByRole("tab");
    await user.click(tabs[2]);

    await waitFor(() => expect(screen.getByRole("button", { name: "my-pg" })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "my-pg" }));

    await waitFor(() => {
      expect(screen.getByText("Parameters")).toBeTruthy();
      expect(screen.getByText(/Parameter group: my-pg/i)).toBeTruthy();
    });
    expect(screen.getByText("max_connections")).toBeTruthy();
    expect(screen.getByText("100")).toBeTruthy();
    expect(screen.getByText("timezone")).toBeTruthy();
    expect(screen.getByText("UTC")).toBeTruthy();
    expect(screen.getByText("static")).toBeTruthy();
    expect(screen.getByText("dynamic")).toBeTruthy();
    expect(screen.getByText("user")).toBeTruthy();
    expect(screen.getByText("engine-default")).toBeTruthy();
    expect(screen.getByText("No")).toBeTruthy();
    expect(screen.getByText("Yes")).toBeTruthy();
  });

  it("shows (not set) for parameter values that are null", async () => {
    mockParamGroups.mockReturnValue({
      data: { parameterGroups: [{ name: "my-pg", family: "postgres16", description: "Custom params" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockApi.mockResolvedValueOnce({
      parameters: [
        { name: "null_param", value: null, applyType: "static", source: "engine-default", isModifiable: false },
      ],
      total: 1,
    });

    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    const tabs = screen.getAllByRole("tab");
    await user.click(tabs[2]);

    await waitFor(() => expect(screen.getByRole("button", { name: "my-pg" })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "my-pg" }));

    await waitFor(() => {
      expect(screen.getByText("(not set)")).toBeTruthy();
    });
  });

  it("shows parameters loading state", async () => {
    mockParamGroups.mockReturnValue({
      data: { parameterGroups: [{ name: "my-pg", family: "postgres16", description: "Custom params" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockApi.mockReturnValue(new Promise(() => {}));

    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    const tabs = screen.getAllByRole("tab");
    await user.click(tabs[2]);

    await waitFor(() => expect(screen.getByRole("button", { name: "my-pg" })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "my-pg" }));

    // Should still render Parameters header and Back button when loading
    await waitFor(() => {
      expect(screen.getByText("Parameters")).toBeTruthy();
      expect(screen.getByText(/Back to Parameter Groups/i)).toBeTruthy();
    });
  });

  it("shows parameters error state", async () => {
    mockParamGroups.mockReturnValue({
      data: { parameterGroups: [{ name: "my-pg", family: "postgres16", description: "Custom params" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockApi.mockRejectedValueOnce(new Error("Failed to load parameters"));

    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    const tabs = screen.getAllByRole("tab");
    await user.click(tabs[2]);

    await waitFor(() => expect(screen.getByRole("button", { name: "my-pg" })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "my-pg" }));

    await waitFor(() => {
      expect(screen.getByText("Failed to load parameters")).toBeTruthy();
    });
  });

  it("opens edit parameter modal for modifiable parameters", async () => {
    mockParamGroups.mockReturnValue({
      data: { parameterGroups: [{ name: "my-pg", family: "postgres16", description: "Custom params" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockApi.mockResolvedValueOnce({
      parameters: [
        { name: "timezone", value: "UTC", applyType: "dynamic", source: "engine-default", isModifiable: true },
      ],
      total: 1,
    });

    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    const tabs = screen.getAllByRole("tab");
    await user.click(tabs[2]);

    await waitFor(() => expect(screen.getByRole("button", { name: "my-pg" })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "my-pg" }));

    await waitFor(() => {
      expect(screen.getByText("timezone")).toBeTruthy();
    });

    const editBtn = screen.getByRole("button", { name: /Edit timezone/i });
    await user.click(editBtn);

    await waitFor(() => {
      expect(screen.getByText(/Edit parameter: timezone/i)).toBeTruthy();
    });
    expect(screen.getByDisplayValue("UTC")).toBeTruthy();
    // Modal should have Save and Cancel buttons
    expect(screen.getByRole("button", { name: /Save/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Cancel/i })).toBeTruthy();
  });

  it("goes back from parameter drill-down to list", async () => {
    mockParamGroups.mockReturnValue({
      data: { parameterGroups: [{ name: "my-pg", family: "postgres16", description: "Custom params" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockApi.mockResolvedValueOnce({
      parameters: [{ name: "max_connections", value: "100", applyType: "static", source: "user", isModifiable: false }],
      total: 1,
    });

    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    const tabs = screen.getAllByRole("tab");
    await user.click(tabs[2]);

    await waitFor(() => expect(screen.getByRole("button", { name: "my-pg" })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "my-pg" }));

    await waitFor(() => {
      expect(screen.getByText(/Parameter group: my-pg/i)).toBeTruthy();
    });

    await user.click(screen.getByText(/Back to Parameter Groups/i));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "my-pg" })).toBeTruthy();
    });
  });

  it("filters parameters by name in the drill-down view", async () => {
    mockParamGroups.mockReturnValue({
      data: { parameterGroups: [{ name: "my-pg", family: "postgres16", description: "Custom params" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockApi.mockResolvedValueOnce({
      parameters: [
        { name: "max_connections", value: "100", applyType: "static", source: "user", isModifiable: false },
        { name: "timezone", value: "UTC", applyType: "dynamic", source: "engine-default", isModifiable: true },
      ],
      total: 2,
    });

    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    const tabs = screen.getAllByRole("tab");
    await user.click(tabs[2]);

    await waitFor(() => expect(screen.getByRole("button", { name: "my-pg" })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "my-pg" }));

    await waitFor(() => expect(screen.getByText("max_connections")).toBeTruthy());

    const filterInput = screen.getByPlaceholderText("Find parameters by name");
    await user.type(filterInput, "timezone");
    await waitFor(() => expect(screen.queryByText("max_connections")).toBeNull());
  });

  it("saves an edited parameter value", async () => {
    mockParamGroups.mockReturnValue({
      data: { parameterGroups: [{ name: "my-pg", family: "postgres16", description: "Custom params" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockApi.mockResolvedValueOnce({
      parameters: [{ name: "timezone", value: "UTC", applyType: "dynamic", source: "engine-default", isModifiable: true }],
      total: 1,
    });

    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    const tabs = screen.getAllByRole("tab");
    await user.click(tabs[2]);
    await waitFor(() => expect(screen.getByRole("button", { name: "my-pg" })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "my-pg" }));
    await waitFor(() => expect(screen.getByText("timezone")).toBeTruthy());

    const editBtn = screen.getByRole("button", { name: /Edit timezone/i });
    await user.click(editBtn);
    await waitFor(() => expect(screen.getByText(/Edit parameter: timezone/i)).toBeTruthy());
    const valueInput = screen.getByDisplayValue("UTC");
    await user.clear(valueInput);
    await user.type(valueInput, "UTC+2");
    await clickButton(user, /^Save$/i);
    await waitFor(() => {
      expect(mockModifyParams).toHaveBeenCalledWith(
        { name: "my-pg", parameters: [{ parameterName: "timezone", parameterValue: "UTC+2" }] },
        expect.any(Object),
      );
    });
  });

  it("cancels the edit parameter modal without saving", async () => {
    mockParamGroups.mockReturnValue({
      data: { parameterGroups: [{ name: "my-pg", family: "postgres16", description: "Custom params" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockApi.mockResolvedValueOnce({
      parameters: [{ name: "timezone", value: "UTC", applyType: "dynamic", source: "engine-default", isModifiable: true }],
      total: 1,
    });

    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    const tabs = screen.getAllByRole("tab");
    await user.click(tabs[2]);
    await waitFor(() => expect(screen.getByRole("button", { name: "my-pg" })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "my-pg" }));
    await waitFor(() => expect(screen.getByText("timezone")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Edit timezone/i }));
    await waitFor(() => expect(screen.getByText(/Edit parameter: timezone/i)).toBeTruthy());
    await clickButton(user, /^Cancel$/i);
    await waitFor(() => expect(mockModifyParams).not.toHaveBeenCalled());
  });

  it("dismisses the edit parameter modal with Escape", async () => {
    mockParamGroups.mockReturnValue({
      data: { parameterGroups: [{ name: "my-pg", family: "postgres16", description: "Custom params" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockApi.mockResolvedValueOnce({
      parameters: [{ name: "timezone", value: "UTC", applyType: "dynamic", source: "engine-default", isModifiable: true }],
      total: 1,
    });

    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    const tabs = screen.getAllByRole("tab");
    await user.click(tabs[2]);
    await waitFor(() => expect(screen.getByRole("button", { name: "my-pg" })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "my-pg" }));
    await waitFor(() => expect(screen.getByText("timezone")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Edit timezone/i }));
    await waitFor(() => expect(screen.getByText(/Edit parameter: timezone/i)).toBeTruthy());
    dismissModalWithEscape();
    await waitFor(() => expect(mockModifyParams).not.toHaveBeenCalled());
  });

  it("opens edit modal for modifiable parameter with null value", async () => {
    mockParamGroups.mockReturnValue({
      data: { parameterGroups: [{ name: "my-pg", family: "postgres16", description: "Custom params" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockApi.mockResolvedValueOnce({
      parameters: [{ name: "null_param", value: null, applyType: "dynamic", source: "user", isModifiable: true }],
      total: 1,
    });

    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    const tabs = screen.getAllByRole("tab");
    await user.click(tabs[2]);
    await waitFor(() => expect(screen.getByRole("button", { name: "my-pg" })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "my-pg" }));
    await waitFor(() => expect(screen.getByText("null_param")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Edit null_param/i }));
    await waitFor(() => expect(screen.getByText(/Edit parameter: null_param/i)).toBeTruthy());
  });

  it("shows fallback type and source for sparse parameters", async () => {
    mockParamGroups.mockReturnValue({
      data: { parameterGroups: [{ name: "my-pg", family: "postgres16", description: "Custom params" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockApi.mockResolvedValueOnce({
      parameters: [{ name: "sparse", value: "1", isModifiable: false }],
      total: 1,
    });

    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    const tabs = screen.getAllByRole("tab");
    await user.click(tabs[2]);
    await waitFor(() => expect(screen.getByRole("button", { name: "my-pg" })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "my-pg" }));
    await waitFor(() => {
      expect(screen.getByText("sparse")).toBeTruthy();
      expect(screen.getByText("static")).toBeTruthy();
      expect(screen.getByText("engine-default")).toBeTruthy();
    });
  });

  it("shows parameters fallback error message", async () => {
    mockParamGroups.mockReturnValue({
      data: { parameterGroups: [{ name: "my-pg", family: "postgres16", description: "Custom params" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockApi.mockRejectedValueOnce(new Error());

    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    const tabs = screen.getAllByRole("tab");
    await user.click(tabs[2]);
    await waitFor(() => expect(screen.getByRole("button", { name: "my-pg" })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "my-pg" }));
    await waitFor(() => expect(screen.getByText(/Failed to load parameters/i)).toBeTruthy());
  });
});

describe("RDSDashboard — cluster parameter group drill-down", () => {
  it("drills down to cluster parameter group parameters", async () => {
    mockClusterParamGroups.mockReturnValue({
      data: {
        clusterParameterGroups: [{ name: "my-cpg", family: "aurora-postgresql16", description: "Cluster params" }],
        total: 1,
      },
      isLoading: false, isError: false, error: null,
    });
    mockApi.mockResolvedValueOnce({
      parameters: [
        { name: "shared_buffers", value: "256MB", applyType: "static", source: "user", isModifiable: false },
      ],
      total: 1,
    });

    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Cluster Parameter Groups/i }));

    await waitFor(() => expect(screen.getByRole("button", { name: "my-cpg" })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "my-cpg" }));

    await waitFor(() => {
      expect(screen.getByText("Parameters")).toBeTruthy();
      expect(screen.getByText(/Cluster Parameter group: my-cpg/i)).toBeTruthy();
      expect(screen.getByText("shared_buffers")).toBeTruthy();
      expect(screen.getByText("256MB")).toBeTruthy();
      expect(screen.getByText(/Back to Cluster Parameter Groups/i)).toBeTruthy();
    });
  });

  it("shows cluster parameter group drill-down loading state", async () => {
    mockClusterParamGroups.mockReturnValue({
      data: {
        clusterParameterGroups: [{ name: "my-cpg", family: "aurora-postgresql16", description: "Cluster params" }],
        total: 1,
      },
      isLoading: false, isError: false, error: null,
    });
    mockApi.mockReturnValue(new Promise(() => {}));

    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Cluster Parameter Groups/i }));

    await waitFor(() => expect(screen.getByRole("button", { name: "my-cpg" })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "my-cpg" }));

    await waitFor(() => {
      expect(screen.getByText("Parameters")).toBeTruthy();
      expect(screen.getByText(/Back to Cluster Parameter Groups/i)).toBeTruthy();
    });
  });

  it("goes back from cluster parameter drill-down to list", async () => {
    mockClusterParamGroups.mockReturnValue({
      data: {
        clusterParameterGroups: [{ name: "my-cpg", family: "aurora-postgresql16", description: "Cluster params" }],
        total: 1,
      },
      isLoading: false, isError: false, error: null,
    });
    mockApi.mockResolvedValueOnce({
      parameters: [{ name: "shared_buffers", value: "256MB", applyType: "static", source: "user", isModifiable: false }],
      total: 1,
    });

    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Cluster Parameter Groups/i }));

    await waitFor(() => expect(screen.getByRole("button", { name: "my-cpg" })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "my-cpg" }));

    await waitFor(() => {
      expect(screen.getByText(/Cluster Parameter group: my-cpg/i)).toBeTruthy();
    });

    await user.click(screen.getByText(/Back to Cluster Parameter Groups/i));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "my-cpg" })).toBeTruthy();
    });
  });

  it("saves an edited cluster parameter value", async () => {
    mockClusterParamGroups.mockReturnValue({
      data: {
        clusterParameterGroups: [{ name: "my-cpg", family: "aurora-postgresql16", description: "Cluster params" }],
        total: 1,
      },
      isLoading: false, isError: false, error: null,
    });
    mockApi.mockResolvedValueOnce({
      parameters: [{ name: "timezone", value: "UTC", applyType: "dynamic", source: "engine-default", isModifiable: true }],
      total: 1,
    });

    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Cluster Parameter Groups/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: "my-cpg" })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "my-cpg" }));
    await waitFor(() => expect(screen.getByText("timezone")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Edit timezone/i }));
    await waitFor(() => expect(screen.getByText(/Edit parameter: timezone/i)).toBeTruthy());
    const valueInput = screen.getByDisplayValue("UTC");
    await user.clear(valueInput);
    await user.type(valueInput, "UTC+2");
    await clickButton(user, /^Save$/i);
    await waitFor(() => {
      expect(mockModifyClusterParams).toHaveBeenCalledWith(
        { name: "my-cpg", parameters: [{ parameterName: "timezone", parameterValue: "UTC+2" }] },
        expect.any(Object),
      );
    });
  });
});

describe("RDSDashboard — tags editor", () => {
  function setupInstanceDetail(arn?: string) {
    mockInstances.mockReturnValue({
      data: { instances: [{ id: "my-db", engine: "postgres", status: "available", dbInstanceClass: "db.t3.micro", allocatedStorage: 20 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockInstanceDetail.mockReturnValue({
      data: { id: "my-db", engine: "postgres", status: "available", dbInstanceClass: "db.t3.micro", allocatedStorage: 20, arn },
      isLoading: false, isError: false, error: null,
    });
  }

  it("renders tags for the instance ARN", async () => {
    setupInstanceDetail("arn:aws:rds:db:my-db");
    mockTags.mockReturnValue({ data: { tags: [{ key: "env", value: "prod" }] } });
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "my-db" }));
    expect(await screen.findByText("Tags (1)")).toBeTruthy();
    expect(screen.getByText("env")).toBeTruthy();
    expect(screen.getByText("prod")).toBeTruthy();
    expect(mockTags).toHaveBeenCalledWith("arn:aws:rds:db:my-db");
  });

  it("shows No tags when the list is empty", async () => {
    setupInstanceDetail("arn:x");
    mockTags.mockReturnValue({ data: { tags: [] } });
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "my-db" }));
    expect(await screen.findByText("No tags")).toBeTruthy();
  });

  it("adds a tag and clears the inputs on success", async () => {
    setupInstanceDetail("arn:x");
    mockTags.mockReturnValue({ data: { tags: [] } });
    mockAddTags.mockResolvedValue({});
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "my-db" }));
    await screen.findByText("No tags");
    await user.type(screen.getByRole("textbox", { name: /^Key$/i }), "team");
    await user.type(screen.getByRole("textbox", { name: /^Value$/i }), "db");
    await user.click(screen.getByRole("button", { name: /Add tag/i }));
    await waitFor(() => expect(mockAddTags).toHaveBeenCalledWith({ arn: "arn:x", tags: { team: "db" } }));
    await waitFor(() => {
      expect((screen.getByRole("textbox", { name: /^Key$/i }) as HTMLInputElement).value).toBe("");
      expect((screen.getByRole("textbox", { name: /^Value$/i }) as HTMLInputElement).value).toBe("");
    });
  });

  it("keeps Add tag disabled until a key is entered", async () => {
    setupInstanceDetail("arn:x");
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "my-db" }));
    const btn = await screen.findByRole("button", { name: /Add tag/i });
    expect(btn.hasAttribute("disabled")).toBe(true);
  });

  it("removes a tag after confirmation", async () => {
    setupInstanceDetail("arn:x");
    mockTags.mockReturnValue({ data: { tags: [{ key: "env", value: "prod" }] } });
    mockRemoveTags.mockResolvedValue({});
    removeTagsState.variables = { tagKeys: ["env"] };
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "my-db" }));
    await screen.findByText("env");
    await user.click(screen.getByRole("button", { name: /Delete env/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockRemoveTags).toHaveBeenCalledWith({ arn: "arn:x", tagKeys: ["env"] }));
  });

  it("shows the add-tags error message and dismisses it", async () => {
    setupInstanceDetail("arn:x");
    addTagsState.isError = true;
    addTagsState.error = new Error("add failed");
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "my-db" }));
    expect(await screen.findByText("add failed")).toBeTruthy();
    const dismiss = document.querySelector('[class*="awsui_dismiss-button"]') as HTMLElement;
    fireEvent.click(dismiss);
    await waitFor(() => expect(mockAddTagsReset).toHaveBeenCalled());
  });

  it("falls back to a generic add-tags error message", async () => {
    setupInstanceDetail("arn:x");
    addTagsState.isError = true;
    addTagsState.error = null;
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "my-db" }));
    expect(await screen.findByText("Failed to add tags")).toBeTruthy();
  });

  it("shows the remove-tags error message and dismisses it", async () => {
    setupInstanceDetail("arn:x");
    removeTagsState.isError = true;
    removeTagsState.error = new Error("remove failed");
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "my-db" }));
    expect(await screen.findByText("remove failed")).toBeTruthy();
    const dismiss = document.querySelector('[class*="awsui_dismiss-button"]') as HTMLElement;
    fireEvent.click(dismiss);
    await waitFor(() => expect(mockRemoveTagsReset).toHaveBeenCalled());
  });

  it("falls back to a generic remove-tags error message", async () => {
    setupInstanceDetail("arn:x");
    removeTagsState.isError = true;
    removeTagsState.error = null;
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "my-db" }));
    expect(await screen.findByText("Failed to remove tag")).toBeTruthy();
  });

  it("disables the tag delete button while that tag removal is pending", async () => {
    setupInstanceDetail("arn:x");
    mockTags.mockReturnValue({ data: { tags: [{ key: "env", value: "prod" }] } });
    removeTagsState.isPending = true;
    removeTagsState.variables = { tagKeys: ["env"] };
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "my-db" }));
    const btn = await screen.findByRole("button", { name: /Delete env/i });
    expect(btn.hasAttribute("disabled")).toBe(true);
  });

  it("renders tags editor in cluster detail too", async () => {
    mockClusters.mockReturnValue({
      data: { clusters: [{ id: "my-cluster", engine: "aurora-postgresql", status: "available", clusterMembers: [] }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockClusterDetail.mockReturnValue({
      data: { id: "my-cluster", engine: "aurora-postgresql", status: "available", arn: "arn:cluster", clusterMembers: [] },
      isLoading: false, isError: false, error: null,
    });
    mockTags.mockReturnValue({ data: { tags: [{ key: "k", value: "v" }] } });
    const user = userEvent.setup();
    render(<RDSDashboard />, { wrapper: createWrapper() });
    const tabs = screen.getAllByRole("tab");
    await user.click(tabs[1]);
    await user.click(screen.getByRole("button", { name: "my-cluster" }));
    expect(await screen.findByText("k")).toBeTruthy();
    expect(mockTags).toHaveBeenCalledWith("arn:cluster");
  });
});
