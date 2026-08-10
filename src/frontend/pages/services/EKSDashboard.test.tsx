// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
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

/**
 * Cloudscape Modal handles Escape via a React onKeyDown on the dialog element
 * (checking `event.keyCode === 27`). user-event's `keyboard()` targets the
 * active element (body), which never reaches the dialog in happy-dom, so we
 * dispatch the keydown on the dialog directly.
 */
function dismissModalWithEscape() {
  const dialog = document.querySelector('[class*="awsui_dialog"]') as HTMLElement;
  fireEvent.keyDown(dialog, { keyCode: 27 });
}

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

  // Wire mutations to invoke `opts.onSuccess` so the onSuccess branches in
  // the dashboard (modal close + field reset) actually fire.
  mockCreateCluster.mockReset();
  mockCreateCluster.mockImplementation((_payload: any, opts?: any) => {
    opts?.onSuccess?.();
    return Promise.resolve({});
  });
  mockCreateNodegroup.mockReset();
  mockCreateNodegroup.mockImplementation((_payload: any, opts?: any) => {
    opts?.onSuccess?.();
    return Promise.resolve({});
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

  it("creates a nodegroup modal shows disabled Create button when fields are empty", async () => {
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

    // Verify all 3 form fields render
    expect(screen.getByPlaceholderText("my-nodegroup")).toBeTruthy();
    expect(screen.getByPlaceholderText("arn:aws:iam::123456789012:role/eks-node-role")).toBeTruthy();
    expect(screen.getByPlaceholderText("subnet-12345678, subnet-87654321")).toBeTruthy();

    // Verify Create button is disabled when fields are empty
    const createBtns = screen.getAllByRole("button", { name: /^Create$/ });
    expect(createBtns[createBtns.length - 1]).toBeDisabled();

    // Close via Cancel
    const cancelBtns = screen.getAllByRole("button", { name: /Cancel/i });
    await user.click(cancelBtns[cancelBtns.length - 1]);
    expect(setShow).toHaveBeenCalledWith(false);
  });

  it("deletes a nodegroup from the drill-down view", async () => {
    const deleteMutate = vi.fn();
    const user = userEvent.setup();
    render(
      <NodegroupsPanel
        {...ngPanelProps({
          nodegroupsData: {
            nodegroups: [
              {
                nodegroupName: "delete-ng",
                status: "ACTIVE",
              },
            ],
            total: 1,
          },
          deleteNodegroup: { mutateAsync: deleteMutate, isPending: false, variables: null },
        })}
      />,
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(screen.getByText("delete-ng")).toBeTruthy();
    });

    const deleteBtn = screen.getByRole("button", { name: /Delete delete-ng/i });
    await user.click(deleteBtn);

    await waitFor(() => {
      expect(deleteMutate).toHaveBeenCalledWith("delete-ng");
    });
  });

  it("filters clusters by name", async () => {
    mockClusters.mockReturnValue({
      data: {
        clusters: [
          {
            name: "my-cluster",
            status: "ACTIVE",
            version: "1.27",
            createdAt: "2025-01-15T00:00:00Z",
          },
          {
            name: "other-cluster",
            status: "ACTIVE",
            version: "1.27",
            createdAt: "2025-01-15T00:00:00Z",
          },
        ],
        total: 2,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<EKSDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-cluster")).toBeTruthy());
    expect(screen.getByText("other-cluster")).toBeTruthy();

    const filterInput = screen.getByPlaceholderText("Find clusters by name");
    await user.type(filterInput, "my");

    await waitFor(() => expect(screen.queryByText("other-cluster")).toBeNull());
    expect(screen.getByText("my-cluster")).toBeTruthy();
  });

  it("creates a cluster with a version and resets the form", async () => {
    const user = userEvent.setup();
    render(<EKSDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /Create cluster/i);
    await waitFor(() => expect(screen.getByText("Create EKS cluster")).toBeTruthy());

    // Create stays disabled until both name and role ARN are filled
    await user.type(screen.getByPlaceholderText("my-cluster"), "new-cluster");
    let createBtns = screen.getAllByRole("button", { name: /^Create$/ });
    expect(createBtns[createBtns.length - 1]).toBeDisabled();

    await user.type(
      screen.getByPlaceholderText("arn:aws:iam::123456789012:role/eks-role"),
      "arn:aws:iam::123456789012:role/eks-role",
    );
    await user.type(screen.getByPlaceholderText("1.27"), "1.27");

    createBtns = screen.getAllByRole("button", { name: /^Create$/ });
    expect(createBtns[createBtns.length - 1]).toBeEnabled();

    await user.click(createBtns[createBtns.length - 1]);

    await waitFor(() => {
      expect(mockCreateCluster).toHaveBeenCalledWith(
        {
          name: "new-cluster",
          roleArn: "arn:aws:iam::123456789012:role/eks-role",
          version: "1.27",
        },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
    });
    // onSuccess closes the modal
    await waitFor(() => {
      expect(screen.queryByText("Create EKS cluster")).toBeNull();
    });
  });

  it("creates a cluster without a version (falsy fallback)", async () => {
    const user = userEvent.setup();
    render(<EKSDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /Create cluster/i);
    await waitFor(() => expect(screen.getByText("Create EKS cluster")).toBeTruthy());

    await user.type(screen.getByPlaceholderText("my-cluster"), "no-version");
    await user.type(
      screen.getByPlaceholderText("arn:aws:iam::123456789012:role/eks-role"),
      "arn:aws:iam::123456789012:role/eks-role",
    );
    const createBtns = screen.getAllByRole("button", { name: /^Create$/ });
    await user.click(createBtns[createBtns.length - 1]);

    await waitFor(() => {
      expect(mockCreateCluster).toHaveBeenCalledWith(
        {
          name: "no-version",
          roleArn: "arn:aws:iam::123456789012:role/eks-role",
          version: undefined,
        },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
    });
  });

  it("dismisses create cluster modal with Escape key", async () => {
    const user = userEvent.setup();
    render(<EKSDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /Create cluster/i);
    await waitFor(() => expect(screen.getByText("Create EKS cluster")).toBeTruthy());

    dismissModalWithEscape();
    await waitFor(() => {
      expect(screen.queryByText("Create EKS cluster")).toBeNull();
    });
    // Modal did not create anything
    expect(mockCreateCluster).not.toHaveBeenCalled();
  });

  it("opens the node group create modal from the drill-down view", async () => {
    mockClusters.mockReturnValue({
      data: {
        clusters: [{ name: "drill-cluster", status: "ACTIVE" }],
        total: 1,
      },
      isLoading: false,
    });
    mockNodegroups.mockReturnValue({
      data: { nodegroups: [], total: 0 },
      isLoading: false,
    });

    const user = userEvent.setup();
    render(<EKSDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("drill-cluster")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "drill-cluster" }));
    await waitFor(() => expect(screen.getByText("Node Groups — drill-cluster")).toBeTruthy());

    await clickButton(user, /Create node group/i);
    await waitFor(() => expect(screen.getByText("Create node group")).toBeTruthy());
    expect(screen.getByPlaceholderText("my-nodegroup")).toBeTruthy();
    expect(screen.getByPlaceholderText("arn:aws:iam::123456789012:role/eks-node-role")).toBeTruthy();
    expect(screen.getByPlaceholderText("subnet-12345678, subnet-87654321")).toBeTruthy();
  });

  it("creates a node group with parsed subnets and resets the form", async () => {
    mockClusters.mockReturnValue({
      data: {
        clusters: [{ name: "drill-cluster", status: "ACTIVE" }],
        total: 1,
      },
      isLoading: false,
    });
    mockNodegroups.mockReturnValue({
      data: { nodegroups: [], total: 0 },
      isLoading: false,
    });

    const user = userEvent.setup();
    render(<EKSDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("drill-cluster")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "drill-cluster" }));
    await waitFor(() => expect(screen.getByText("Node Groups — drill-cluster")).toBeTruthy());

    await clickButton(user, /Create node group/i);
    await waitFor(() => expect(screen.getByText("Create node group")).toBeTruthy());

    await user.type(screen.getByPlaceholderText("my-nodegroup"), "my-ng");
    await user.type(
      screen.getByPlaceholderText("arn:aws:iam::123456789012:role/eks-node-role"),
      "arn:aws:iam::123456789012:role/eks-node-role",
    );
    // Trailing comma + spacey segments exercise split/trim/filter(Boolean)
    await user.type(screen.getByPlaceholderText("subnet-12345678, subnet-87654321"), "subnet-a, ,subnet-b, ");

    const createBtns = screen.getAllByRole("button", { name: /^Create$/ });
    expect(createBtns[createBtns.length - 1]).toBeEnabled();
    await user.click(createBtns[createBtns.length - 1]);

    await waitFor(() => {
      expect(mockCreateNodegroup).toHaveBeenCalledWith(
        {
          nodegroupName: "my-ng",
          nodeRole: "arn:aws:iam::123456789012:role/eks-node-role",
          subnets: ["subnet-a", "subnet-b"],
        },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
    });
    // onSuccess closes the modal
    await waitFor(() => {
      expect(screen.queryByText("Create node group")).toBeNull();
    });
  });

  it("keeps node group Create disabled until all fields are filled", async () => {
    mockClusters.mockReturnValue({
      data: {
        clusters: [{ name: "drill-cluster", status: "ACTIVE" }],
        total: 1,
      },
      isLoading: false,
    });
    mockNodegroups.mockReturnValue({
      data: { nodegroups: [], total: 0 },
      isLoading: false,
    });

    const user = userEvent.setup();
    render(<EKSDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("drill-cluster")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "drill-cluster" }));
    await waitFor(() => expect(screen.getByText("Node Groups — drill-cluster")).toBeTruthy());

    await clickButton(user, /Create node group/i);
    await waitFor(() => expect(screen.getByText("Create node group")).toBeTruthy());

    // Name filled, role + subnets empty -> still disabled
    await user.type(screen.getByPlaceholderText("my-nodegroup"), "partial-ng");
    let createBtns = screen.getAllByRole("button", { name: /^Create$/ });
    expect(createBtns[createBtns.length - 1]).toBeDisabled();

    // Name + role filled, subnets empty -> still disabled
    await user.type(
      screen.getByPlaceholderText("arn:aws:iam::123456789012:role/eks-node-role"),
      "arn:aws:iam::123456789012:role/eks-node-role",
    );
    createBtns = screen.getAllByRole("button", { name: /^Create$/ });
    expect(createBtns[createBtns.length - 1]).toBeDisabled();

    // All filled -> enabled
    await user.type(screen.getByPlaceholderText("subnet-12345678, subnet-87654321"), "subnet-1");
    createBtns = screen.getAllByRole("button", { name: /^Create$/ });
    expect(createBtns[createBtns.length - 1]).toBeEnabled();
  });

  it("dismisses create node group modal with Escape key", async () => {
    mockClusters.mockReturnValue({
      data: {
        clusters: [{ name: "drill-cluster", status: "ACTIVE" }],
        total: 1,
      },
      isLoading: false,
    });
    mockNodegroups.mockReturnValue({
      data: { nodegroups: [], total: 0 },
      isLoading: false,
    });

    const user = userEvent.setup();
    render(<EKSDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("drill-cluster")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "drill-cluster" }));
    await waitFor(() => expect(screen.getByText("Node Groups — drill-cluster")).toBeTruthy());

    await clickButton(user, /Create node group/i);
    await waitFor(() => expect(screen.getByText("Create node group")).toBeTruthy());

    dismissModalWithEscape();
    await waitFor(() => {
      expect(screen.queryByText("Create node group")).toBeNull();
    });
    expect(mockCreateNodegroup).not.toHaveBeenCalled();
  });

  it("filters node groups by name", async () => {
    mockClusters.mockReturnValue({
      data: {
        clusters: [{ name: "drill-cluster", status: "ACTIVE" }],
        total: 1,
      },
      isLoading: false,
    });
    mockNodegroups.mockReturnValue({
      data: {
        nodegroups: [
          { nodegroupName: "web-ng", status: "ACTIVE" },
          { nodegroupName: "db-ng", status: "ACTIVE" },
        ],
        total: 2,
      },
      isLoading: false,
    });

    const user = userEvent.setup();
    render(<EKSDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("drill-cluster")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "drill-cluster" }));
    await waitFor(() => expect(screen.getByText("web-ng")).toBeTruthy());
    expect(screen.getByText("db-ng")).toBeTruthy();

    const filterInput = screen.getByPlaceholderText("Find node groups by name");
    await user.type(filterInput, "web");

    await waitFor(() => expect(screen.queryByText("db-ng")).toBeNull());
    expect(screen.getByText("web-ng")).toBeTruthy();
  });
});
