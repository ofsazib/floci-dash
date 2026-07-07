// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

// ─── Mock ConfirmDialog ─────────────────────────────────

vi.mock("../../components/ConfirmDialog", () => ({
  useConfirmDialog: () => ({
    confirm: vi.fn(() => Promise.resolve(true)),
    dialog: null,
  }),
}));

// ─── Mock hooks ─────────────────────────────────────────

const mockClusters = vi.fn();
const mockInstances = vi.fn();
const mockCreateCluster = vi.fn();
const mockDeleteCluster = vi.fn();
const mockCreateInstance = vi.fn();
const mockDeleteInstance = vi.fn();

const createClusterState = vi.hoisted(() => ({
  isError: false,
  error: null as Error | null,
  isPending: false,
}));
const createInstanceState = vi.hoisted(() => ({
  isError: false,
  error: null as Error | null,
  isPending: false,
}));

vi.mock("../../hooks/useDocDB", () => ({
  useDocDBClusters: (...args: any[]) => mockClusters(...args),
  useDocDBInstances: (...args: any[]) => mockInstances(...args),
  useCreateDocDBCluster: () => ({
    mutate: mockCreateCluster,
    isPending: createClusterState.isPending,
    isError: createClusterState.isError,
    error: createClusterState.error,
    reset: vi.fn(),
  }),
  useDeleteDocDBCluster: () => ({
    mutateAsync: mockDeleteCluster,
    isPending: false,
    variables: null,
  }),
  useCreateDocDBInstance: () => ({
    mutate: mockCreateInstance,
    isPending: createInstanceState.isPending,
    isError: createInstanceState.isError,
    error: createInstanceState.error,
    reset: vi.fn(),
  }),
  useDeleteDocDBInstance: () => ({
    mutateAsync: mockDeleteInstance,
    isPending: false,
    variables: null,
  }),
}));

import { DocDBDashboard } from "./DocDBDashboard";

// ─── Setup ──────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  createClusterState.isError = false;
  createClusterState.error = null;
  createClusterState.isPending = false;
  createInstanceState.isError = false;
  createInstanceState.error = null;
  createInstanceState.isPending = false;

  mockClusters.mockReturnValue({
    data: { clusters: [] },
    isLoading: false,
    isError: false,
    error: null,
  });
  mockInstances.mockReturnValue({
    data: { instances: [] },
    isLoading: false,
    isError: false,
    error: null,
  });
});

// ─── Tests ──────────────────────────────────────────────

describe("DocDBDashboard — rendering", () => {
  it("shows loading skeleton when loading", () => {
    mockClusters.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = render(<DocDBDashboard />, { wrapper: createWrapper() });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("shows empty messages for both tables", () => {
    render(<DocDBDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No cluster/i)).toBeTruthy();
    expect(screen.getByText("DB Instances")).toBeTruthy();
  });

  it("shows both table headers", () => {
    render(<DocDBDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("DB Clusters")).toBeTruthy();
    expect(screen.getByText("DB Instances")).toBeTruthy();
  });
});

describe("DocDBDashboard — DB clusters", () => {
  it("renders clusters with data", () => {
    mockClusters.mockReturnValue({
      data: {
        clusters: [
          {
            DBClusterIdentifier: "my-cluster",
            Engine: "docdb",
            EngineVersion: "4.0",
            Status: "available",
            Endpoint: "my-cluster.cluster-xxxxx.us-east-1.docdb.amazonaws.com",
          },
        ],
      },
      isLoading: false,
    });
    render(<DocDBDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-cluster")).toBeTruthy();
    expect(screen.getByText("docdb")).toBeTruthy();
    expect(screen.getByText("4.0")).toBeTruthy();
    expect(screen.getByText("available")).toBeTruthy();
  });

  it("shows error alert when create cluster fails", async () => {
    createClusterState.isError = true;
    createClusterState.error = new Error("Cluster limit reached");
    const user = userEvent.setup();
    render(<DocDBDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /Create cluster/i);
    await waitFor(() => {
      expect(screen.getByText("Create DB Cluster")).toBeTruthy();
    });
    expect(screen.getByText("Cluster limit reached")).toBeTruthy();

    createClusterState.isError = false;
    createClusterState.error = null;
  });

  it("opens create cluster modal", async () => {
    const user = userEvent.setup();
    render(<DocDBDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /Create cluster/i);

    await waitFor(() => {
      expect(screen.getByText("Create DB Cluster")).toBeTruthy();
    });
  });

  it("opens create cluster modal and shows form fields", async () => {
    const user = userEvent.setup();
    render(<DocDBDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /Create cluster/i);

    await waitFor(() => {
      expect(screen.getByText("Create DB Cluster")).toBeTruthy();
      expect(screen.getByLabelText(/Master username/)).toBeTruthy();
      expect(screen.getByLabelText(/Master password/)).toBeTruthy();
      expect(screen.getAllByLabelText(/Cluster identifier/).length).toBeGreaterThanOrEqual(1);
    });
  });

  it("deletes a cluster", async () => {
    const user = userEvent.setup();
    mockClusters.mockReturnValue({
      data: {
        clusters: [
          {
            DBClusterIdentifier: "my-cluster",
            Engine: "docdb",
            EngineVersion: "4.0",
            Status: "available",
            Endpoint: "my-cluster.cluster-xxxxx.us-east-1.docdb.amazonaws.com",
          },
        ],
      },
      isLoading: false,
    });
    render(<DocDBDashboard />, { wrapper: createWrapper() });
    const deleteBtn = screen.getByRole("button", { name: /Delete my-cluster/i });
    await user.click(deleteBtn);
    await waitFor(() => {
      expect(mockDeleteCluster).toHaveBeenCalledWith("my-cluster");
    });
  });

  it("renders clusters with missing fields gracefully", () => {
    mockClusters.mockReturnValue({
      data: {
        clusters: [{ DBClusterIdentifier: "minimal-cluster" }],
      },
      isLoading: false,
    });
    render(<DocDBDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("minimal-cluster")).toBeTruthy();
  });
});

describe("DocDBDashboard — DB instances", () => {
  it("renders instances with data", () => {
    mockInstances.mockReturnValue({
      data: {
        instances: [
          {
            DBInstanceIdentifier: "my-instance",
            DBClusterIdentifier: "my-cluster",
            DBInstanceClass: "db.r5.large",
            DBInstanceStatus: "available",
          },
        ],
      },
      isLoading: false,
    });
    render(<DocDBDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-instance")).toBeTruthy();
    expect(screen.getByText("my-cluster")).toBeTruthy();
    expect(screen.getByText("db.r5.large")).toBeTruthy();
    expect(screen.getByText("available")).toBeTruthy();
  });

  it("shows error alert when create instance fails", async () => {
    createInstanceState.isError = true;
    createInstanceState.error = new Error("Invalid instance config");
    const user = userEvent.setup();
    render(<DocDBDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /Create instance/i);
    await waitFor(() => {
      expect(screen.getByText("Create DB Instance")).toBeTruthy();
    });
    expect(screen.getByText("Invalid instance config")).toBeTruthy();

    createInstanceState.isError = false;
    createInstanceState.error = null;
  });

  it("opens create instance modal", async () => {
    const user = userEvent.setup();
    render(<DocDBDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /Create instance/i);

    await waitFor(() => {
      expect(screen.getByText("Create DB Instance")).toBeTruthy();
    });
  });

  it("creates an instance when form is filled and submitted", async () => {
    const user = userEvent.setup();
    render(<DocDBDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /Create instance/i);

    await waitFor(() => {
      expect(screen.getByText("Create DB Instance")).toBeTruthy();
    });

    const idInput = screen.getByLabelText(/Instance identifier/);
    await user.type(idInput, "test-instance");

    const clusterInput = screen.getAllByLabelText(/Cluster identifier/)[1];
    await user.type(clusterInput, "my-cluster");

    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    await user.click(createBtns[createBtns.length - 1]);

    await waitFor(() => {
      expect(mockCreateInstance).toHaveBeenCalledWith(
        expect.objectContaining({
          DBInstanceIdentifier: "test-instance",
          DBClusterIdentifier: "my-cluster",
        }),
        expect.any(Object),
      );
    });
  });

  it("deletes an instance", async () => {
    const user = userEvent.setup();
    mockInstances.mockReturnValue({
      data: {
        instances: [
          {
            DBInstanceIdentifier: "my-instance",
            DBClusterIdentifier: "my-cluster",
            DBInstanceClass: "db.r5.large",
            DBInstanceStatus: "available",
          },
        ],
      },
      isLoading: false,
    });
    render(<DocDBDashboard />, { wrapper: createWrapper() });
    const deleteBtn = screen.getByRole("button", { name: /Delete my-instance/i });
    await user.click(deleteBtn);
    await waitFor(() => {
      expect(mockDeleteInstance).toHaveBeenCalledWith("my-instance");
    });
  });
});
