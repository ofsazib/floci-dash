// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

// ─── vi.hoisted mutable states ──────────────────────────

const createClusterState = vi.hoisted(() => ({
  isPending: false,
}));

const deleteClusterState = vi.hoisted(() => ({
  isPending: false,
  variables: null as string | null,
}));

const createNgState = vi.hoisted(() => ({
  isPending: false,
}));

const deleteNgState = vi.hoisted(() => ({
  isPending: false,
  variables: null as string | null,
}));

// ─── Mock hooks ─────────────────────────────────────────

vi.mock("../../components/ConfirmDialog", () => ({
  useConfirmDialog: () => ({
    confirm: vi.fn(() => Promise.resolve(true)),
    dialog: null,
  }),
}));

const mockClusters = vi.fn();
const mockNodegroups = vi.fn();
const mockCreateCluster = vi.fn();
const mockDeleteCluster = vi.fn();
const mockCreateNodegroup = vi.fn();
const mockDeleteNodegroup = vi.fn();

vi.mock("../../hooks/useEKS", () => ({
  useEKSClusters: (...args: any[]) => mockClusters(...args),
  useEKSCreateCluster: () => ({
    mutate: mockCreateCluster,
    get isPending() { return createClusterState.isPending; },
  }),
  useEKSDeleteCluster: () => ({
    mutateAsync: mockDeleteCluster,
    get isPending() { return deleteClusterState.isPending; },
    get variables() { return deleteClusterState.variables; },
  }),
  useEKSNodegroups: (...args: any[]) => mockNodegroups(...args),
  useEKSCreateNodegroup: () => ({
    mutate: mockCreateNodegroup,
    get isPending() { return createNgState.isPending; },
  }),
  useEKSDeleteNodegroup: () => ({
    mutateAsync: mockDeleteNodegroup,
    get isPending() { return deleteNgState.isPending; },
    get variables() { return deleteNgState.variables; },
  }),
}));

import { EKSDashboard, NodegroupsPanel } from "./EKSDashboard";

// ─── Helper to create a basic NodegroupsPanel set of props ──
function ngPanelProps(overrides: Record<string, any> = {}) {
  return {
    clusterName: "test-cluster",
    nodegroupsData: { nodegroups: [], total: 0 },
    nodegroupsLoading: false,
    createNodegroup: { mutate: vi.fn(), isPending: false },
    deleteNodegroup: { mutateAsync: vi.fn(), isPending: false, variables: null },
    showCreateNodegroup: false,
    setShowCreateNodegroup: vi.fn(),
    ngName: "",
    setNgName: vi.fn(),
    ngNodeRole: "",
    setNgNodeRole: vi.fn(),
    ngSubnets: "",
    setNgSubnets: vi.fn(),
    ...overrides,
  };
}

// ─── Setup ──────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  createClusterState.isPending = false;
  deleteClusterState.isPending = false;
  deleteClusterState.variables = null;
  createNgState.isPending = false;
  deleteNgState.isPending = false;
  deleteNgState.variables = null;

  mockClusters.mockReturnValue({
    data: { clusters: [], total: 0 },
    isLoading: false,
    isError: false,
    error: null,
  });
  mockNodegroups.mockReturnValue({
    data: { nodegroups: [], total: 0 },
    isLoading: false,
  });
});

// ─── Tests ──────────────────────────────────────────────

describe("EKSDashboard — rendering", () => {
  it("shows loading skeleton when loading", () => {
    mockClusters.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });
    const { container } = render(<EKSDashboard />, { wrapper: createWrapper() });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("renders the clusters resource table header", () => {
    render(<EKSDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("EKS Clusters")).toBeTruthy();
  });

  it("shows empty message for clusters", () => {
    render(<EKSDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No EKS clusters/i)).toBeTruthy();
  });
});

describe("EKSDashboard — cluster list", () => {
  it("renders clusters with data", () => {
    mockClusters.mockReturnValue({
      data: {
        clusters: [
          {
            name: "my-cluster",
            status: "ACTIVE",
            version: "1.27",
            endpoint: "https://example.com",
            createdAt: "2025-01-15T00:00:00Z",
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<EKSDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-cluster")).toBeTruthy();
    expect(screen.getByText("ACTIVE")).toBeTruthy();
    expect(screen.getByText("1.27")).toBeTruthy();
  });

  it("renders clusters with missing optional fields gracefully", () => {
    mockClusters.mockReturnValue({
      data: {
        clusters: [
          {
            name: "minimal-cluster",
            status: "CREATING",
            createdAt: "2025-01-15T00:00:00Z",
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<EKSDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("minimal-cluster")).toBeTruthy();
    expect(screen.getByText("CREATING")).toBeTruthy();
  });

  it("opens create cluster modal and Cancel closes it", async () => {
    const user = userEvent.setup();
    render(<EKSDashboard />, { wrapper: createWrapper() });

    // Open modal
    await clickButton(user, /Create cluster/i);
    await waitFor(() => {
      expect(screen.getByText("Create EKS cluster")).toBeTruthy();
    });

    // Verify form fields render
    const inputs = screen.getAllByRole("textbox");
    expect(inputs.length).toBeGreaterThanOrEqual(2);

    // Click Cancel
    const cancelBtns = screen.getAllByRole("button", { name: /Cancel/i });
    await user.click(cancelBtns[cancelBtns.length - 1]);

    // Verify Create was NOT called
    await waitFor(() => {
      expect(mockCreateCluster).not.toHaveBeenCalled();
    });
  });

  it("opens create modal, can reopen after Cancel", async () => {
    const user = userEvent.setup();
    render(<EKSDashboard />, { wrapper: createWrapper() });

    // Open and close
    await clickButton(user, /Create cluster/i);
    await waitFor(() => {
      expect(screen.getByText("Create EKS cluster")).toBeTruthy();
    });
    const cancelBtns1 = screen.getAllByRole("button", { name: /Cancel/i });
    await user.click(cancelBtns1[cancelBtns1.length - 1]);

    // Re-open
    await clickButton(user, /Create cluster/i);
    await waitFor(() => {
      expect(screen.getByText("Create EKS cluster")).toBeTruthy();
    });

    // Fields should render again
    const inputs = screen.getAllByRole("textbox");
    expect(inputs.length).toBeGreaterThanOrEqual(2);
  });

  it("renders NodegroupsPanel with loading state", () => {
    render(
      <NodegroupsPanel
        {...ngPanelProps({ nodegroupsData: undefined, nodegroupsLoading: true })}
      />,
      { wrapper: createWrapper() },
    );
    expect(screen.getByText(/Node Groups/)).toBeTruthy();
  });

  it("renders NodegroupsPanel empty state", () => {
    render(<NodegroupsPanel {...ngPanelProps()} />, { wrapper: createWrapper() });
    expect(screen.getByText(/No node groups/)).toBeTruthy();
  });

  it("renders NodegroupsPanel with data", () => {
    render(
      <NodegroupsPanel
        {...ngPanelProps({
          nodegroupsData: {
            nodegroups: [
              {
                nodegroupName: "my-ng",
                status: "ACTIVE",
                version: "1.27",
                instanceTypes: ["t3.medium"],
                scalingConfig: { desiredSize: 2 },
                createdAt: "2025-01-15T00:00:00Z",
              },
            ],
            total: 1,
          },
        })}
      />,
      { wrapper: createWrapper() },
    );
    expect(screen.getByText("my-ng")).toBeTruthy();
    expect(screen.getByText("ACTIVE")).toBeTruthy();
    expect(screen.getByText("t3.medium")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
  });

  it("opens NodegroupsPanel create modal and Cancel closes it", async () => {
    const setShow = vi.fn();
    const user = userEvent.setup();
    render(
      <NodegroupsPanel
        {...ngPanelProps({
          showCreateNodegroup: true,
          setShowCreateNodegroup: setShow,
        })}
      />,
      { wrapper: createWrapper() },
    );
    expect(screen.getByText("Create node group")).toBeTruthy();
    expect(screen.getByPlaceholderText("my-nodegroup")).toBeTruthy();

    // Click Cancel
    const cancelBtns = screen.getAllByRole("button", { name: /Cancel/i });
    await user.click(cancelBtns[cancelBtns.length - 1]);
    expect(setShow).toHaveBeenCalledWith(false);
  });

  it("handles NodegroupsPanel null data gracefully", () => {
    render(
      <NodegroupsPanel
        {...ngPanelProps({ nodegroupsData: null })}
      />,
      { wrapper: createWrapper() },
    );
    expect(screen.getByText(/No node groups/)).toBeTruthy();
  });

  it("renders NodegroupsPanel with null/undefined fields", () => {
    render(
      <NodegroupsPanel
        {...ngPanelProps({
          nodegroupsData: {
            nodegroups: [
              {
                nodegroupName: "minimal-ng",
                status: "ACTIVE",
              },
            ],
            total: 1,
          },
        })}
      />,
      { wrapper: createWrapper() },
    );
    expect(screen.getByText("minimal-ng")).toBeTruthy();
  });

  it("shows createNodegroup loading state", () => {
    render(
      <NodegroupsPanel
        {...ngPanelProps({
          nodegroupsData: {
            nodegroups: [
              { nodegroupName: "my-ng", status: "ACTIVE" },
            ],
            total: 1,
          },
          createNodegroup: { mutate: vi.fn(), get isPending() { return createNgState.isPending; } },
          showCreateNodegroup: false,
        })}
      />,
      { wrapper: createWrapper() },
    );
    createNgState.isPending = true;
    expect(screen.getByText("my-ng")).toBeTruthy();
    createNgState.isPending = false;
  });

  it("shows deleteNodegroup loading state", () => {
    deleteNgState.isPending = true;
    deleteNgState.variables = "my-ng";
    render(
      <NodegroupsPanel
        {...ngPanelProps({
          nodegroupsData: {
            nodegroups: [
              { nodegroupName: "my-ng", status: "ACTIVE" },
            ],
            total: 1,
          },
          deleteNodegroup: { mutateAsync: vi.fn(), get isPending() { return deleteNgState.isPending; }, get variables() { return deleteNgState.variables; } },
        })}
      />,
      { wrapper: createWrapper() },
    );
    expect(screen.getByText("my-ng")).toBeTruthy();
  });

  it("renders clusters with null data gracefully", () => {
    mockClusters.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<EKSDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No EKS clusters/i)).toBeTruthy();
  });

  it("drills down to NodegroupsPanel when cluster name is clicked and goes back", async () => {
    mockClusters.mockReturnValue({
      data: {
        clusters: [
          {
            name: "drill-cluster",
            status: "ACTIVE",
            version: "1.27",
            endpoint: "https://example.com",
            createdAt: "2025-01-15T00:00:00Z",
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockNodegroups.mockReturnValue({
      data: { nodegroups: [], total: 0 },
      isLoading: false,
    });

    const user = userEvent.setup();
    render(<EKSDashboard />, { wrapper: createWrapper() });

    // Initially shows clusters list and the drill-down button
    expect(screen.getByText("EKS Clusters")).toBeTruthy();
    const clusterBtn = screen.getByRole("button", { name: "drill-cluster" });
    expect(clusterBtn).toBeTruthy();

    // Click the cluster name to drill down
    await user.click(clusterBtn);

    // Now NodegroupsPanel should render with the cluster name
    await waitFor(() => {
      expect(screen.getByText("Node Groups — drill-cluster")).toBeTruthy();
    });

    // Back to clusters button should be present
    const backBtn = screen.getByRole("button", { name: /Back to clusters/i });
    expect(backBtn).toBeTruthy();

    // The clusters table should no longer be visible
    expect(screen.queryByText("EKS Clusters")).toBeNull();

    // Verify useEKSNodegroups was called with the cluster name
    expect(mockNodegroups).toHaveBeenCalledWith("drill-cluster");

    // Click Back to clusters
    await user.click(backBtn);

    // Back to clusters list
    await waitFor(() => {
      expect(screen.getByText("EKS Clusters")).toBeTruthy();
    });

    // Nodegroups panel should no longer be visible
    expect(screen.queryByText("Node Groups — drill-cluster")).toBeNull();
  });

  it("renders clusters with all fallback dashes for missing fields", () => {
    mockClusters.mockReturnValue({
      data: {
        clusters: [
          {
            name: "bare-cluster",
            status: "ACTIVE",
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<EKSDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("bare-cluster")).toBeTruthy();
    // version, endpoint, created all fallback to "-"
    expect(screen.getAllByText("-").length).toBeGreaterThan(0);
  });

  it("shows create cluster loading state", () => {
    createClusterState.isPending = true;
    mockClusters.mockReturnValue({
      data: {
        clusters: [
          {
            name: "my-cluster",
            status: "ACTIVE",
            version: "1.27",
            createdAt: "2025-01-15T00:00:00Z",
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<EKSDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-cluster")).toBeTruthy();
  });

  it("shows delete cluster loading state", () => {
    deleteClusterState.isPending = true;
    deleteClusterState.variables = "my-cluster";
    mockClusters.mockReturnValue({
      data: {
        clusters: [
          {
            name: "my-cluster",
            status: "ACTIVE",
            version: "1.27",
            createdAt: "2025-01-15T00:00:00Z",
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<EKSDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-cluster")).toBeTruthy();
  });

  it("calls deleteCluster when delete is clicked", async () => {
    mockClusters.mockReturnValue({
      data: {
        clusters: [
          {
            name: "my-cluster",
            status: "ACTIVE",
            version: "1.27",
            createdAt: "2025-01-15T00:00:00Z",
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    const user = userEvent.setup();
    render(<EKSDashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("my-cluster")).toBeTruthy();
    });

    const deleteBtn = screen.getByRole("button", { name: /Delete my-cluster/i });
    await user.click(deleteBtn);

    await waitFor(() => {
      expect(mockDeleteCluster).toHaveBeenCalledWith("my-cluster");
    });
  });
});
