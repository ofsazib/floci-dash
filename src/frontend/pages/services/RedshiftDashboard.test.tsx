// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createWrapper } from "../../../test/helpers";
import React from "react";

/**
 * Fire Escape on the innermost open Cloudscape dialog. Firing on every
 * mounted dialog would also close the outer details modal (which unmounts
 * its tabs), so only the last dialog — the topmost in DOM order — receives
 * the keydown.
 */
function dismissModalWithEscape() {
  // Cloudscape keeps dismissed modals mounted, marking their ancestors with an
  // `awsui_hidden_*` class. Open dialogs have no hidden ancestor; fire Escape
  // on the last open dialog (the topmost modal) only, so nested modals
  // dismiss without also closing the outer details modal.
  const open = Array.from(document.querySelectorAll<HTMLElement>('[class*="awsui_dialog"]')).filter(
    (d) => !d.closest('[class*="awsui_hidden"]')
  );
  if (open.length === 0) throw new Error("No open dialog");
  fireEvent.keyDown(open[open.length - 1], { keyCode: 27, key: "Escape" });
}

/** Assert the modal with the given header is gone (content unmounted). */
function expectModalGone(headerText: string) {
  expect(screen.queryByText(headerText)).toBeNull();
}

/** Click the dismiss (X) button of the topmost open modal — the last
 * dismiss-control in DOM order belongs to the innermost open modal. */
/** The currently-visible Cloudscape dialog element. */
function visibleDialog(): HTMLElement {
  const dialogs = Array.from(document.querySelectorAll<HTMLElement>('[class*="awsui_dialog"]'));
  const visible = dialogs.find((d) => !d.className.includes("hidden"));
  if (!visible) throw new Error("No visible dialog");
  return visible;
}

const mockClusters = vi.fn();
const mockSnapshots = vi.fn();
const mockParamGroups = vi.fn();
const mockParams = vi.fn();
const mockSubnetGroups = vi.fn();
const mockCreateCluster = vi.fn((..._a: any[]) => Promise.resolve({}));
const mockModifyCluster = vi.fn((..._a: any[]) => Promise.resolve({}));
const mockRebootCluster = vi.fn((..._a: any[]) => Promise.resolve({}));
const mockDeleteCluster = vi.fn((..._a: any[]) => Promise.resolve({}));
const mockCreateSnap = vi.fn((..._a: any[]) => Promise.resolve({}));
const mockDeleteSnap = vi.fn((..._a: any[]) => Promise.resolve({}));
const mockRestoreSnap = vi.fn((..._a: any[]) => Promise.resolve({}));
const mockCreatePg = vi.fn((..._a: any[]) => Promise.resolve({}));
const mockModifyPg = vi.fn((..._a: any[]) => Promise.resolve({}));
const mockDeletePg = vi.fn((..._a: any[]) => Promise.resolve({}));
const mockCreateSg = vi.fn((..._a: any[]) => Promise.resolve({}));
const mockModifySg = vi.fn((..._a: any[]) => Promise.resolve({}));
const mockDeleteSg = vi.fn((..._a: any[]) => Promise.resolve({}));
const mockTag = vi.fn((..._a: any[]) => Promise.resolve({}));
const mockUntag = vi.fn((..._a: any[]) => Promise.resolve({}));
const mockShowToast = vi.fn();

vi.mock("../../hooks/useRedshift", () => ({
  useRedshiftClusters: (...args: any[]) => mockClusters(...args),
  useRedshiftSnapshots: (...args: any[]) => mockSnapshots(...args),
  useRedshiftParameterGroups: (...args: any[]) => mockParamGroups(...args),
  useRedshiftParameters: (...args: any[]) => mockParams(...args),
  useRedshiftSubnetGroups: (...args: any[]) => mockSubnetGroups(...args),
  useCreateRedshiftCluster: () => ({ mutateAsync: mockCreateCluster, isPending: false }),
  useModifyRedshiftCluster: () => ({ mutateAsync: mockModifyCluster, isPending: false }),
  useRebootRedshiftCluster: () => ({ mutateAsync: mockRebootCluster, isPending: false }),
  useDeleteRedshiftCluster: () => ({ mutateAsync: mockDeleteCluster, isPending: false }),
  useCreateRedshiftSnapshot: () => ({ mutateAsync: mockCreateSnap, isPending: false }),
  useDeleteRedshiftSnapshot: () => ({ mutateAsync: mockDeleteSnap, isPending: false }),
  useRestoreRedshiftSnapshot: () => ({ mutateAsync: mockRestoreSnap, isPending: false }),
  useCreateRedshiftParameterGroup: () => ({ mutateAsync: mockCreatePg, isPending: false }),
  useModifyRedshiftParameterGroup: () => ({ mutateAsync: mockModifyPg, isPending: false }),
  useDeleteRedshiftParameterGroup: () => ({ mutateAsync: mockDeletePg, isPending: false }),
  useCreateRedshiftSubnetGroup: () => ({ mutateAsync: mockCreateSg, isPending: false }),
  useModifyRedshiftSubnetGroup: () => ({ mutateAsync: mockModifySg, isPending: false }),
  useDeleteRedshiftSubnetGroup: () => ({ mutateAsync: mockDeleteSg, isPending: false }),
  useRedshiftTagResource: () => ({ mutateAsync: mockTag, isPending: false }),
  useRedshiftUntagResource: () => ({ mutateAsync: mockUntag, isPending: false }),
}));

vi.mock("../../components/Toast", () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

// Mock Cloudscape Select so options are clickable buttons, and Toggle so
// checked→unchecked transitions are deterministic under happy-dom
vi.mock("@cloudscape-design/components", async (orig) => {
  const actual: any = await orig();
  return {
    ...actual,
    Select: ({ selectedOption, onChange, options }: any) => (
      <div data-testid="mock-select">
        {options?.map((o: any) => (
          <button
            key={o.value}
            data-testid={`opt-${o.value}`}
            onClick={() => onChange?.({ detail: { selectedOption: o } })}
          >
            {o.label}
          </button>
        ))}
      </div>
    ),
    Toggle: ({ checked, onChange, children }: any) => (
      <button data-testid={`toggle-${checked}`} onClick={() => onChange?.({ detail: { checked: !checked } })}>
        {children}
      </button>
    ),
  };
});

import { RedshiftDashboard } from "./RedshiftDashboard";

const cluster = {
  ClusterIdentifier: "analytics",
  ClusterStatus: "available",
  NodeType: "ra3.xlplus",
  NumberOfNodes: 2,
  Endpoint: { Address: "analytics.local:5439" },
  Tags: [{ Key: "env", Value: "dev" }],
};

const snapshot = {
  SnapshotIdentifier: "snap-1",
  ClusterIdentifier: "analytics",
  Status: "available",
  SnapshotType: "manual",
};

const paramGroup = {
  ParameterGroupName: "pg-custom",
  ParameterGroupFamily: "redshift-1.0",
  Description: "test group",
};

const subnetGroup = {
  ClusterSubnetGroupName: "sg-custom",
  SubnetGroupStatus: "Complete",
  Description: "test subnet group",
};

function setupClusters(list: any[] = [cluster]) {
  mockClusters.mockReturnValue({ data: { clusters: list, total: list.length }, isLoading: false });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockClusters.mockReturnValue({ data: { clusters: [], total: 0 }, isLoading: false });
  mockSnapshots.mockReturnValue({ data: { snapshots: [], total: 0 }, isLoading: false });
  mockParamGroups.mockReturnValue({ data: { parameterGroups: [], total: 0 }, isLoading: false });
  mockParams.mockReturnValue({ data: { parameters: [], total: 0 }, isLoading: false });
  mockSubnetGroups.mockReturnValue({ data: { subnetGroups: [], total: 0 }, isLoading: false });
});

/** Shared tab-opening helpers used by multiple describes. */
async function openDetailsShared() {
  const user = userEvent.setup();
  setupClusters();
  render(<RedshiftDashboard />, { wrapper: createWrapper() });
  await user.click(screen.getByRole("button", { name: "Details" }));
  return user;
}

async function openSnapshotsShared() {
  const user = userEvent.setup();
  setupClusters();
  render(<RedshiftDashboard />, { wrapper: createWrapper() });
  await user.click(screen.getByRole("button", { name: "Details" }));
  await user.click(screen.getByRole("tab", { name: "Snapshots" }));
  return user;
}

async function openParamGroupsShared() {
  const user = userEvent.setup();
  setupClusters();
  render(<RedshiftDashboard />, { wrapper: createWrapper() });
  await user.click(screen.getByRole("button", { name: "Details" }));
  await user.click(screen.getByRole("tab", { name: "Parameter groups" }));
  return user;
}

async function openSubnetGroupsShared() {
  const user = userEvent.setup();
  setupClusters();
  render(<RedshiftDashboard />, { wrapper: createWrapper() });
  await user.click(screen.getByRole("button", { name: "Details" }));
  await user.click(screen.getByRole("tab", { name: "Subnet groups" }));
  return user;
}

describe("RedshiftDashboard — clusters table", () => {
  it("renders empty state", () => {
    render(<RedshiftDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("No Redshift clusters. Create one to get started.")).toBeTruthy();
  });

  it("renders loading state", () => {
    mockClusters.mockReturnValue({ data: undefined, isLoading: true });
    render(<RedshiftDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Loading resources...")).toBeTruthy();
  });

  it("renders cluster rows with status and endpoint", () => {
    setupClusters();
    render(<RedshiftDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("analytics")).toBeTruthy();
    expect(screen.getByText("ra3.xlplus")).toBeTruthy();
    expect(screen.getByText("analytics.local:5439")).toBeTruthy();
  });

  it("renders sparse cluster row (no endpoint, no nodes)", () => {
    setupClusters([{ ClusterIdentifier: "minimal", ClusterStatus: "paused" }]);
    render(<RedshiftDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("minimal")).toBeTruthy();
    expect(screen.getByText("paused")).toBeTruthy();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("shows UNKNOWN indicator when cluster status is missing", () => {
    setupClusters([{ ClusterIdentifier: "nostatus" }]);
    render(<RedshiftDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("UNKNOWN")).toBeTruthy();
  });

  it("shows in-progress indicator for creating/modifying clusters", () => {
    setupClusters([{ ClusterIdentifier: "c1", ClusterStatus: "creating" }]);
    const { unmount } = render(<RedshiftDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("creating")).toBeTruthy();
    unmount();
    setupClusters([{ ClusterIdentifier: "c2", ClusterStatus: "modifying" }]);
    render(<RedshiftDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("modifying")).toBeTruthy();
  });
});

describe("RedshiftDashboard — create cluster", () => {
  it("creates a cluster from the modal", async () => {
    const user = userEvent.setup();
    render(<RedshiftDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Create Redshift cluster" }));
    await user.type(screen.getByLabelText("Cluster identifier"), "new-cluster");
    await user.clear(screen.getByLabelText("Master username"));
    await user.type(screen.getByLabelText("Master username"), "admin2");
    await user.type(screen.getByLabelText("Master user password"), "Passw0rd!");
    await user.click(screen.getByRole("button", { name: "Create cluster" }));
    await waitFor(() => expect(mockCreateCluster).toHaveBeenCalled());
    const body = mockCreateCluster.mock.calls[0][0];
    expect(body.identifier).toBe("new-cluster");
    expect(body.masterUsername).toBe("admin2");
    expect(body.nodeType).toBe("ra3.xlplus");
    expect(mockShowToast).toHaveBeenCalledWith("success", "Cluster new-cluster created");
  });

  it("keeps the submit disabled until required fields are filled", async () => {
    const user = userEvent.setup();
    render(<RedshiftDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Create Redshift cluster" }));
    expect(
      (screen.getByRole("button", { name: "Create cluster" }) as HTMLButtonElement).disabled
    ).toBe(true);
  });

  it("changes node type via select", async () => {
    const user = userEvent.setup();
    setupClusters();
    render(<RedshiftDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Create Redshift cluster" }));
    await user.click(screen.getByTestId("opt-dc2.large"));
    await user.type(screen.getByLabelText("Cluster identifier"), "c");
    await user.type(screen.getByLabelText("Master user password"), "p");
    await user.click(screen.getByRole("button", { name: "Create cluster" }));
    await waitFor(() => expect(mockCreateCluster).toHaveBeenCalled());
    expect(mockCreateCluster.mock.calls[0][0].nodeType).toBe("dc2.large");
  });

  it("shows create error toast on failure", async () => {
    const user = userEvent.setup();
    mockCreateCluster.mockRejectedValueOnce(new Error("boom"));
    render(<RedshiftDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Create Redshift cluster" }));
    await user.type(screen.getByLabelText("Cluster identifier"), "c");
    await user.type(screen.getByLabelText("Master user password"), "p");
    await user.click(screen.getByRole("button", { name: "Create cluster" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "boom"));
  });

  it("dismisses the create modal", async () => {
    const user = userEvent.setup();
    render(<RedshiftDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Create Redshift cluster" }));
    dismissModalWithEscape();
    await waitFor(() => expect(screen.queryByText("Master username")).toBeNull());
  });
});

describe("RedshiftDashboard — cluster actions", () => {
  it("reboots a cluster", async () => {
    const user = userEvent.setup();
    setupClusters();
    render(<RedshiftDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Reboot" }));
    await waitFor(() => expect(mockRebootCluster).toHaveBeenCalledWith("analytics"));
    expect(mockShowToast).toHaveBeenCalledWith("success", "Cluster analytics reboot initiated");
  });

  it("shows reboot error toast on failure", async () => {
    const user = userEvent.setup();
    mockRebootCluster.mockRejectedValueOnce(new Error("reboot failed"));
    setupClusters();
    render(<RedshiftDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Reboot" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "reboot failed"));
  });

  it("shows delete cluster error toast on failure", async () => {
    mockDeleteCluster.mockRejectedValueOnce(new Error("delete failed"));
    setupClusters();
    const user = userEvent.setup();
    render(<RedshiftDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Delete analytics" }));
    await user.click(screen.getByRole("button", { name: /^Delete$/ }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "delete failed"));
  });

  it("deletes a cluster after confirm", async () => {
    const user = userEvent.setup();
    setupClusters();
    render(<RedshiftDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Delete analytics" }));
    await user.click(screen.getByRole("button", { name: /^Delete$/ }));
    await waitFor(() => expect(mockDeleteCluster).toHaveBeenCalledWith("analytics"));
    expect(mockShowToast).toHaveBeenCalledWith("success", "Cluster deleted");
  });
});

describe("RedshiftDashboard — cluster details", () => {
  async function openDetails() {
    const user = userEvent.setup();
    setupClusters();
    render(<RedshiftDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Details" }));
    return user;
  }

  it("opens details modal with Modify tab", async () => {
    await openDetails();
    expect(screen.getByText("Cluster details — analytics")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Apply changes" })).toBeTruthy();
  });

  it("modifies node type from the Modify tab", async () => {
    const user = await openDetails();
    await user.click(screen.getByTestId("opt-ra3.4xlarge"));
    await user.click(screen.getByRole("button", { name: "Apply changes" }));
    await waitFor(() => expect(mockModifyCluster).toHaveBeenCalled());
    const body = mockModifyCluster.mock.calls[0][0];
    expect(body.id).toBe("analytics");
    expect(body.nodeType).toBe("ra3.4xlarge");
  });

  it("modifies with empty node type (keep current)", async () => {
    const user = await openDetails();
    await user.click(screen.getByRole("button", { name: "Apply changes" }));
    await waitFor(() => expect(mockModifyCluster).toHaveBeenCalled());
    expect(mockModifyCluster.mock.calls[0][0].nodeType).toBeUndefined();
  });

  it("shows modify error toast on failure", async () => {
    mockModifyCluster.mockRejectedValueOnce(new Error("modify failed"));
    const user = await openDetails();
    await user.click(screen.getByRole("button", { name: "Apply changes" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "modify failed"));
  });

  it("shows existing tags and adds a tag", async () => {
    const user = await openDetails();
    await user.click(screen.getByRole("tab", { name: "Tags" }));
    expect(screen.getByText(/env = dev/)).toBeTruthy();
    await user.type(screen.getByPlaceholderText("Tag key"), "team");
    await user.type(screen.getByPlaceholderText("Tag value"), "data");
    await user.click(screen.getByRole("button", { name: "Add tag" }));
    await waitFor(() => expect(mockTag).toHaveBeenCalled());
    const body = mockTag.mock.calls[0][0];
    expect(body.resourceName).toBe("arn:aws:redshift:local:000000000000:cluster:analytics");
    expect(body.tags).toEqual([{ key: "team", value: "data" }]);
  });

  it("removes a tag", async () => {
    const user = await openDetails();
    await user.click(screen.getByRole("tab", { name: "Tags" }));
    await user.click(screen.getByRole("button", { name: "Remove" }));
    await waitFor(() => expect(mockUntag).toHaveBeenCalled());
    const body = mockUntag.mock.calls[0][0];
    expect(body.tagKeys).toEqual(["env"]);
  });

  it("shows empty tags alert when no tags", async () => {
    const user = userEvent.setup();
    setupClusters([{ ClusterIdentifier: "analytics", ClusterStatus: "available" }]);
    render(<RedshiftDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Details" }));
    await user.click(screen.getByRole("tab", { name: "Tags" }));
    expect(screen.getByText("No tags on this cluster.")).toBeTruthy();
  });

  it("shows tag error toast on failure", async () => {
    mockTag.mockRejectedValueOnce(new Error("tag failed"));
    const user = await openDetails();
    await user.click(screen.getByRole("tab", { name: "Tags" }));
    await user.type(screen.getByPlaceholderText("Tag key"), "k");
    await user.click(screen.getByRole("button", { name: "Add tag" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "tag failed"));
  });

  it("shows untag error toast on failure", async () => {
    mockUntag.mockRejectedValueOnce(new Error("untag failed"));
    const user = await openDetails();
    await user.click(screen.getByRole("tab", { name: "Tags" }));
    await user.click(screen.getByRole("button", { name: "Remove" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "untag failed"));
  });

  it("closes details with Escape", async () => {
    await openDetails();
    await screen.findByRole("button", { name: "Apply changes" });
    dismissModalWithEscape();
    await waitFor(() => expect(screen.queryByRole("button", { name: "Apply changes" })).toBeNull());
  });
});

describe("RedshiftDashboard — snapshots tab", () => {
  async function openSnapshots() {
    const user = userEvent.setup();
    setupClusters();
    render(<RedshiftDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Details" }));
    await user.click(screen.getByRole("tab", { name: "Snapshots" }));
    return user;
  }

  it("renders empty snapshots", async () => {
    await openSnapshots();
    expect(screen.getByText("No snapshots")).toBeTruthy();
  });

  it("falls back to empty list when snapshots payload is undefined", async () => {
    mockSnapshots.mockReturnValue({ data: {}, isLoading: false });
    await openSnapshots();
    expect(screen.getByText("No snapshots")).toBeTruthy();
  });

  it("renders snapshot rows", async () => {
    mockSnapshots.mockReturnValue({ data: { snapshots: [snapshot], total: 1 }, isLoading: false });
    await openSnapshots();
    expect(screen.getByText("snap-1")).toBeTruthy();
    expect(screen.getByText("manual")).toBeTruthy();
  });

  it("creates a snapshot", async () => {
    const user = await openSnapshots();
    await user.click(screen.getByRole("button", { name: "Create snapshot" }));
    const inputs = screen.getAllByLabelText("Cluster identifier");
    await user.type(inputs[inputs.length - 1], "analytics");
    await user.type(screen.getByLabelText("Snapshot identifier"), "snap-2");
    await user.click(screen.getAllByRole("button", { name: "Create snapshot" }).slice(-1)[0]);
    await waitFor(() => expect(mockCreateSnap).toHaveBeenCalled());
    expect(mockCreateSnap.mock.calls[0][0]).toEqual({
      identifier: "analytics",
      snapshotIdentifier: "snap-2",
    });
  });

  it("shows create snapshot error toast on failure", async () => {
    mockCreateSnap.mockRejectedValueOnce(new Error("snap failed"));
    const user = await openSnapshots();
    await user.click(screen.getByRole("button", { name: "Create snapshot" }));
    const inputs = screen.getAllByLabelText("Cluster identifier");
    await user.type(inputs[inputs.length - 1], "analytics");
    await user.type(screen.getByLabelText("Snapshot identifier"), "snap-2");
    await user.click(screen.getAllByRole("button", { name: "Create snapshot" }).slice(-1)[0]);
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "snap failed"));
  });

  it("deletes a snapshot", async () => {
    mockSnapshots.mockReturnValue({ data: { snapshots: [snapshot], total: 1 }, isLoading: false });
    const user = await openSnapshots();
    await user.click(screen.getByRole("button", { name: "Delete snap-1" }));
    await user.click(screen.getByRole("button", { name: /^Delete$/ }));
    await waitFor(() => expect(mockDeleteSnap).toHaveBeenCalledWith("snap-1"));
    expect(mockShowToast).toHaveBeenCalledWith("success", "Snapshot deleted");
  });

  it("dismisses the create snapshot modal", async () => {
    const user = await openSnapshots();
    await user.click(screen.getByRole("button", { name: "Create snapshot" }));
    dismissModalWithEscape();
    await waitFor(() => expect(screen.queryByLabelText("Snapshot identifier")).toBeNull());
  });

  it("shows delete snapshot error toast on failure", async () => {
    mockDeleteSnap.mockRejectedValueOnce(new Error("snap delete failed"));
    mockSnapshots.mockReturnValue({ data: { snapshots: [snapshot], total: 1 }, isLoading: false });
    const user = await openSnapshots();
    await user.click(screen.getByRole("button", { name: "Delete snap-1" }));
    await user.click(screen.getByRole("button", { name: /^Delete$/ }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "snap delete failed"));
  });

  it("restores a snapshot", async () => {
    mockSnapshots.mockReturnValue({ data: { snapshots: [snapshot], total: 1 }, isLoading: false });
    const user = await openSnapshots();
    await user.click(screen.getByRole("button", { name: "Restore" }));
    await user.type(screen.getByLabelText("New cluster identifier"), "restored");
    await user.click(screen.getByRole("button", { name: "Restore cluster" }));
    await waitFor(() => expect(mockRestoreSnap).toHaveBeenCalled());
    const body = mockRestoreSnap.mock.calls[0][0];
    expect(body.snapshotIdentifier).toBe("snap-1");
    expect(body.targetIdentifier).toBe("restored");
  });

  it("shows restore error toast on failure", async () => {
    mockRestoreSnap.mockRejectedValueOnce(new Error("restore failed"));
    mockSnapshots.mockReturnValue({ data: { snapshots: [snapshot], total: 1 }, isLoading: false });
    const user = await openSnapshots();
    await user.click(screen.getByRole("button", { name: "Restore" }));
    await user.type(screen.getByLabelText("New cluster identifier"), "restored");
    await user.click(screen.getByRole("button", { name: "Restore cluster" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "restore failed"));
  });

  it("dismisses the restore modal", async () => {
    mockSnapshots.mockReturnValue({ data: { snapshots: [snapshot], total: 1 }, isLoading: false });
    const user = await openSnapshots();
    await user.click(screen.getByRole("button", { name: "Restore" }));
    dismissModalWithEscape();
    await waitFor(() => expect(screen.queryByLabelText("New cluster identifier")).toBeNull());
  });
});

describe("RedshiftDashboard — parameter groups tab", () => {
  async function openParamGroups() {
    const user = userEvent.setup();
    setupClusters();
    render(<RedshiftDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Details" }));
    await user.click(screen.getByRole("tab", { name: "Parameter groups" }));
    return user;
  }

  it("renders empty parameter groups", async () => {
    await openParamGroups();
    expect(screen.getByText("No parameter groups")).toBeTruthy();
  });

  it("falls back to empty list when parameterGroups payload is undefined", async () => {
    mockParamGroups.mockReturnValue({ data: {}, isLoading: false });
    await openParamGroups();
    expect(screen.getByText("No parameter groups")).toBeTruthy();
  });

  it("falls back to empty list when parameters payload is undefined", async () => {
    mockParamGroups.mockReturnValue({ data: { parameterGroups: [paramGroup], total: 1 }, isLoading: false });
    mockParams.mockReturnValue({ data: {}, isLoading: false });
    const user = await openParamGroups();
    await user.click(screen.getByRole("button", { name: "Parameters" }));
    expect(screen.getByText("No parameters")).toBeTruthy();
  });

  it("renders — and empty edit value for null ParameterValue", async () => {
    mockParamGroups.mockReturnValue({ data: { parameterGroups: [paramGroup], total: 1 }, isLoading: false });
    mockParams.mockReturnValue({
      data: { parameters: [{ ParameterName: "wlm", ParameterValue: null }] },
      isLoading: false,
    });
    const user = await openParamGroups();
    await user.click(screen.getByRole("button", { name: "Parameters" }));
    expect(screen.getByText("—")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect((screen.getByPlaceholderText("New value") as HTMLInputElement).value).toBe("");
  });

  it("renders parameter group rows", async () => {
    mockParamGroups.mockReturnValue({
      data: { parameterGroups: [paramGroup], total: 1 },
      isLoading: false,
    });
    await openParamGroups();
    expect(screen.getByText("pg-custom")).toBeTruthy();
    expect(screen.getByText("test group")).toBeTruthy();
  });

  it("renders sparse parameter group row (no description)", async () => {
    mockParamGroups.mockReturnValue({
      data: { parameterGroups: [{ ParameterGroupName: "pg-x", ParameterGroupFamily: "redshift-1.0" }], total: 1 },
      isLoading: false,
    });
    await openParamGroups();
    expect(screen.getByText("pg-x")).toBeTruthy();
  });

  it("creates a parameter group", async () => {
    const user = await openParamGroups();
    await user.click(screen.getByRole("button", { name: "Create parameter group" }));
    await user.type(screen.getByLabelText("Name"), "pg-new");
    await user.click(screen.getAllByRole("button", { name: "Create parameter group" }).slice(-1)[0]);
    await waitFor(() => expect(mockCreatePg).toHaveBeenCalled());
    expect(mockCreatePg.mock.calls[0][0].name).toBe("pg-new");
    expect(mockCreatePg.mock.calls[0][0].family).toBe("redshift-1.0");
  });

  it("changes family via select", async () => {
    const user = await openParamGroups();
    await user.click(screen.getByRole("button", { name: "Create parameter group" }));
    await user.type(screen.getByLabelText("Name"), "pg-new");
    await user.click(screen.getByTestId("opt-redshift-2.0"));
    await user.click(screen.getAllByRole("button", { name: "Create parameter group" }).slice(-1)[0]);
    await waitFor(() => expect(mockCreatePg).toHaveBeenCalled());
    expect(mockCreatePg.mock.calls[0][0].family).toBe("redshift-2.0");
  });

  it("shows create parameter group error toast on failure", async () => {
    mockCreatePg.mockRejectedValueOnce(new Error("pg failed"));
    const user = await openParamGroups();
    await user.click(screen.getByRole("button", { name: "Create parameter group" }));
    await user.type(screen.getByLabelText("Name"), "pg-new");
    await user.click(screen.getAllByRole("button", { name: "Create parameter group" }).slice(-1)[0]);
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "pg failed"));
  });

  it("deletes a parameter group", async () => {
    mockParamGroups.mockReturnValue({
      data: { parameterGroups: [paramGroup], total: 1 },
      isLoading: false,
    });
    const user = await openParamGroups();
    await user.click(screen.getByRole("button", { name: "Delete pg-custom" }));
    await user.click(screen.getByRole("button", { name: /^Delete$/ }));
    await waitFor(() => expect(mockDeletePg).toHaveBeenCalledWith("pg-custom"));
    expect(mockShowToast).toHaveBeenCalledWith("success", "Parameter group deleted");
  });

  it("dismisses the create parameter group modal", async () => {
    const user = await openParamGroups();
    await user.click(screen.getByRole("button", { name: "Create parameter group" }));
    dismissModalWithEscape();
    await waitFor(() => expect(screen.queryByLabelText("Description (optional)")).toBeNull());
  });

  it("types a description when creating a parameter group", async () => {
    const user = await openParamGroups();
    await user.click(screen.getByRole("button", { name: "Create parameter group" }));
    await user.type(screen.getByLabelText("Name"), "pg-new");
    await user.type(screen.getByLabelText("Description (optional)"), "desc");
    await user.click(screen.getAllByRole("button", { name: "Create parameter group" }).slice(-1)[0]);
    await waitFor(() => expect(mockCreatePg).toHaveBeenCalled());
    expect(mockCreatePg.mock.calls[0][0].description).toBe("desc");
  });

  it("shows delete parameter group error toast on failure", async () => {
    mockDeletePg.mockRejectedValueOnce(new Error("pg delete failed"));
    mockParamGroups.mockReturnValue({
      data: { parameterGroups: [paramGroup], total: 1 },
      isLoading: false,
    });
    const user = await openParamGroups();
    await user.click(screen.getByRole("button", { name: "Delete pg-custom" }));
    await user.click(screen.getByRole("button", { name: /^Delete$/ }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "pg delete failed"));
  });

  it("views and edits a parameter", async () => {
    mockParamGroups.mockReturnValue({
      data: { parameterGroups: [paramGroup], total: 1 },
      isLoading: false,
    });
    mockParams.mockReturnValue({
      data: { parameters: [{ ParameterName: "require_ssl", ParameterValue: "true" }], total: 1 },
      isLoading: false,
    });
    const user = await openParamGroups();
    await user.click(screen.getByRole("button", { name: "Parameters" }));
    expect(screen.getByText("require_ssl")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Edit" }));
    const input = screen.getByPlaceholderText("New value");
    await user.clear(input);
    await user.type(input, "false");
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(mockModifyPg).toHaveBeenCalled());
    const body = mockModifyPg.mock.calls[0][0];
    expect(body.name).toBe("pg-custom");
    expect(body.parameters).toEqual([{ name: "require_ssl", value: "false" }]);
  });

  it("shows parameter edit error toast on failure", async () => {
    mockModifyPg.mockRejectedValueOnce(new Error("param failed"));
    mockParamGroups.mockReturnValue({
      data: { parameterGroups: [paramGroup], total: 1 },
      isLoading: false,
    });
    mockParams.mockReturnValue({
      data: { parameters: [{ ParameterName: "require_ssl", ParameterValue: "true" }], total: 1 },
      isLoading: false,
    });
    const user = await openParamGroups();
    await user.click(screen.getByRole("button", { name: "Parameters" }));
    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.type(screen.getByPlaceholderText("New value"), "false");
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "param failed"));
  });

  it("cancels a parameter edit", async () => {
    mockParamGroups.mockReturnValue({
      data: { parameterGroups: [paramGroup], total: 1 },
      isLoading: false,
    });
    mockParams.mockReturnValue({
      data: { parameters: [{ ParameterName: "require_ssl", ParameterValue: "true" }], total: 1 },
      isLoading: false,
    });
    const user = await openParamGroups();
    await user.click(screen.getByRole("button", { name: "Parameters" }));
    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getAllByRole("button", { name: "Cancel" }).slice(-1)[0]);
    expect(mockModifyPg).not.toHaveBeenCalled();
  });

  it("keeps Save disabled with empty value", async () => {
    mockParamGroups.mockReturnValue({
      data: { parameterGroups: [paramGroup], total: 1 },
      isLoading: false,
    });
    mockParams.mockReturnValue({
      data: { parameters: [{ ParameterName: "require_ssl", ParameterValue: "true" }], total: 1 },
      isLoading: false,
    });
    const user = await openParamGroups();
    await user.click(screen.getByRole("button", { name: "Parameters" }));
    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.clear(screen.getByPlaceholderText("New value"));
    expect((screen.getByRole("button", { name: "Save" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("closes the parameters modal", async () => {
    mockParamGroups.mockReturnValue({
      data: { parameterGroups: [paramGroup], total: 1 },
      isLoading: false,
    });
    const user = await openParamGroups();
    await user.click(screen.getByRole("button", { name: "Parameters" }));
    dismissModalWithEscape();
    await waitFor(() => expect(screen.queryByText("Parameters")).toBeNull());
  });
});

describe("RedshiftDashboard — subnet groups tab", () => {
  async function openSubnetGroups() {
    const user = userEvent.setup();
    setupClusters();
    render(<RedshiftDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Details" }));
    await user.click(screen.getByRole("tab", { name: "Subnet groups" }));
    return user;
  }

  it("renders empty subnet groups", async () => {
    await openSubnetGroups();
    expect(screen.getByText("No subnet groups")).toBeTruthy();
  });

  it("falls back to empty list when subnetGroups payload is undefined", async () => {
    mockSubnetGroups.mockReturnValue({ data: {}, isLoading: false });
    await openSubnetGroups();
    expect(screen.getByText("No subnet groups")).toBeTruthy();
  });

  it("renders subnet group rows", async () => {
    mockSubnetGroups.mockReturnValue({
      data: { subnetGroups: [subnetGroup], total: 1 },
      isLoading: false,
    });
    await openSubnetGroups();
    expect(screen.getByText("sg-custom")).toBeTruthy();
    expect(screen.getByText("test subnet group")).toBeTruthy();
  });

  it("renders sparse subnet group row (no description)", async () => {
    mockSubnetGroups.mockReturnValue({
      data: { subnetGroups: [{ ClusterSubnetGroupName: "sg-x", SubnetGroupStatus: "Complete" }], total: 1 },
      isLoading: false,
    });
    await openSubnetGroups();
    expect(screen.getByText("sg-x")).toBeTruthy();
  });

  it("creates a subnet group", async () => {
    const user = await openSubnetGroups();
    await user.click(screen.getByRole("button", { name: "Create subnet group" }));
    await user.type(screen.getByLabelText("Name"), "sg-new");
    await user.type(screen.getByLabelText("Subnet IDs (comma-separated)"), "subnet-1, subnet-2");
    await user.click(screen.getAllByRole("button", { name: "Create subnet group" }).slice(-1)[0]);
    await waitFor(() => expect(mockCreateSg).toHaveBeenCalled());
    expect(mockCreateSg.mock.calls[0][0].subnetIds).toEqual(["subnet-1", "subnet-2"]);
  });

  it("shows create subnet group error toast on failure", async () => {
    mockCreateSg.mockRejectedValueOnce(new Error("sg failed"));
    const user = await openSubnetGroups();
    await user.click(screen.getByRole("button", { name: "Create subnet group" }));
    await user.type(screen.getByLabelText("Name"), "sg-new");
    await user.type(screen.getByLabelText("Subnet IDs (comma-separated)"), "subnet-1");
    await user.click(screen.getAllByRole("button", { name: "Create subnet group" }).slice(-1)[0]);
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "sg failed"));
  });

  it("edits a subnet group", async () => {
    mockSubnetGroups.mockReturnValue({
      data: { subnetGroups: [subnetGroup], total: 1 },
      isLoading: false,
    });
    const user = await openSubnetGroups();
    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.type(screen.getByLabelText("Subnet IDs (comma-separated)"), "subnet-9");
    await user.click(screen.getByRole("button", { name: "Update subnet group" }));
    await waitFor(() => expect(mockModifySg).toHaveBeenCalled());
    const body = mockModifySg.mock.calls[0][0];
    expect(body.name).toBe("sg-custom");
    expect(body.subnetIds).toEqual(["subnet-9"]);
  });

  it("shows edit subnet group error toast on failure", async () => {
    mockModifySg.mockRejectedValueOnce(new Error("sg edit failed"));
    mockSubnetGroups.mockReturnValue({
      data: { subnetGroups: [subnetGroup], total: 1 },
      isLoading: false,
    });
    const user = await openSubnetGroups();
    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.type(screen.getByLabelText("Subnet IDs (comma-separated)"), "subnet-9");
    await user.click(screen.getByRole("button", { name: "Update subnet group" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "sg edit failed"));
  });

  it("keeps Update disabled with empty subnet ids", async () => {
    mockSubnetGroups.mockReturnValue({
      data: { subnetGroups: [subnetGroup], total: 1 },
      isLoading: false,
    });
    const user = await openSubnetGroups();
    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(
      (screen.getByRole("button", { name: "Update subnet group" }) as HTMLButtonElement).disabled
    ).toBe(true);
  });

  it("deletes a subnet group", async () => {
    mockSubnetGroups.mockReturnValue({
      data: { subnetGroups: [subnetGroup], total: 1 },
      isLoading: false,
    });
    const user = await openSubnetGroups();
    await user.click(screen.getByRole("button", { name: "Delete sg-custom" }));
    await user.click(screen.getByRole("button", { name: /^Delete$/ }));
    await waitFor(() => expect(mockDeleteSg).toHaveBeenCalledWith("sg-custom"));
    expect(mockShowToast).toHaveBeenCalledWith("success", "Subnet group deleted");
  });

  it("dismisses the create subnet group modal", async () => {
    const user = await openSubnetGroups();
    await user.click(screen.getByRole("button", { name: "Create subnet group" }));
    dismissModalWithEscape();
    await waitFor(() => expect(screen.queryByLabelText("Subnet IDs (comma-separated)")).toBeNull());
  });

  it("types a description when creating a subnet group", async () => {
    const user = await openSubnetGroups();
    await user.click(screen.getByRole("button", { name: "Create subnet group" }));
    await user.type(screen.getByLabelText("Name"), "sg-new");
    await user.type(screen.getByLabelText("Description (optional)"), "desc");
    await user.type(screen.getByLabelText("Subnet IDs (comma-separated)"), "subnet-1");
    await user.click(screen.getAllByRole("button", { name: "Create subnet group" }).slice(-1)[0]);
    await waitFor(() => expect(mockCreateSg).toHaveBeenCalled());
    expect((mockCreateSg.mock.calls as unknown as [[{ description: string }]])[0][0].description).toBe(
      "desc"
    );
  });

  it("shows delete subnet group error toast on failure", async () => {
    mockDeleteSg.mockRejectedValueOnce(new Error("sg delete failed"));
    mockSubnetGroups.mockReturnValue({
      data: { subnetGroups: [subnetGroup], total: 1 },
      isLoading: false,
    });
    const user = await openSubnetGroups();
    await user.click(screen.getByRole("button", { name: "Delete sg-custom" }));
    await user.click(screen.getByRole("button", { name: /^Delete$/ }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "sg delete failed"));
  });

  it("dismisses the edit subnet group modal", async () => {
    mockSubnetGroups.mockReturnValue({
      data: { subnetGroups: [subnetGroup], total: 1 },
      isLoading: false,
    });
    const user = await openSubnetGroups();
    await user.click(screen.getByRole("button", { name: "Edit" }));
    dismissModalWithEscape();
    await waitFor(() => expect(screen.queryByLabelText("Subnet IDs (comma-separated)")).toBeNull());
  });
});


describe("RedshiftDashboard — error message fallbacks", () => {
  /** Reject with a non-Error so `e?.message` is undefined and the `||` fallback fires. */
  function fail(fn: any) {
    fn.mockRejectedValueOnce("nope");
  }

  it("create cluster fallback message", async () => {
    fail(mockCreateCluster);
    const user = userEvent.setup();
    render(<RedshiftDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Create Redshift cluster" }));
    await user.type(screen.getByLabelText("Cluster identifier"), "c");
    await user.type(screen.getByLabelText("Master user password"), "p");
    await user.click(screen.getByRole("button", { name: "Create cluster" }));
    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to create cluster")
    );
  });

  it("modify cluster fallback message", async () => {
    fail(mockModifyCluster);
    const user = await openDetailsShared();
    await user.click(screen.getByRole("button", { name: "Apply changes" }));
    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to modify cluster")
    );
  });

  it("reboot cluster fallback message", async () => {
    fail(mockRebootCluster);
    const user = userEvent.setup();
    setupClusters();
    render(<RedshiftDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Reboot" }));
    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to reboot cluster")
    );
  });

  it("delete cluster fallback message", async () => {
    fail(mockDeleteCluster);
    const user = userEvent.setup();
    setupClusters();
    render(<RedshiftDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Delete analytics" }));
    await user.click(screen.getByRole("button", { name: /^Delete$/ }));
    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to delete cluster")
    );
  });

  it("add tag fallback message", async () => {
    fail(mockTag);
    const user = await openDetailsShared();
    await user.click(screen.getByRole("tab", { name: "Tags" }));
    await user.type(screen.getByPlaceholderText("Tag key"), "k");
    await user.click(screen.getByRole("button", { name: "Add tag" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to add tag"));
  });

  it("remove tag fallback message", async () => {
    fail(mockUntag);
    const user = await openDetailsShared();
    await user.click(screen.getByRole("tab", { name: "Tags" }));
    await user.click(screen.getByRole("button", { name: "Remove" }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to remove tag"));
  });

  it("create snapshot fallback message", async () => {
    fail(mockCreateSnap);
    const user = await openSnapshotsShared();
    await user.click(screen.getByRole("button", { name: "Create snapshot" }));
    const inputs = screen.getAllByLabelText("Cluster identifier");
    await user.type(inputs[inputs.length - 1], "analytics");
    await user.type(screen.getByLabelText("Snapshot identifier"), "s");
    await user.click(screen.getAllByRole("button", { name: "Create snapshot" }).slice(-1)[0]);
    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to create snapshot")
    );
  });

  it("delete snapshot fallback message", async () => {
    fail(mockDeleteSnap);
    mockSnapshots.mockReturnValue({ data: { snapshots: [snapshot], total: 1 }, isLoading: false });
    const user = await openSnapshotsShared();
    await user.click(screen.getByRole("button", { name: "Delete snap-1" }));
    await user.click(screen.getByRole("button", { name: /^Delete$/ }));
    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to delete snapshot")
    );
  });

  it("restore snapshot fallback message", async () => {
    fail(mockRestoreSnap);
    mockSnapshots.mockReturnValue({ data: { snapshots: [snapshot], total: 1 }, isLoading: false });
    const user = await openSnapshotsShared();
    await user.click(screen.getByRole("button", { name: "Restore" }));
    await user.type(screen.getByLabelText("New cluster identifier"), "r");
    await user.click(screen.getByRole("button", { name: "Restore cluster" }));
    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to restore from snapshot")
    );
  });

  it("create parameter group fallback message", async () => {
    fail(mockCreatePg);
    const user = await openParamGroupsShared();
    await user.click(screen.getByRole("button", { name: "Create parameter group" }));
    await user.type(screen.getByLabelText("Name"), "pg-x");
    await user.click(screen.getAllByRole("button", { name: "Create parameter group" }).slice(-1)[0]);
    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to create parameter group")
    );
  });

  it("modify parameter fallback message", async () => {
    fail(mockModifyPg);
    mockParamGroups.mockReturnValue({ data: { parameterGroups: [paramGroup], total: 1 }, isLoading: false });
    mockParams.mockReturnValue({
      data: { parameters: [{ ParameterName: "wlm", ParameterValue: "auto" }] },
      isLoading: false,
    });
    const user = await openParamGroupsShared();
    await user.click(screen.getByRole("button", { name: "Parameters" }));
    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.type(screen.getByPlaceholderText("New value"), "v");
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to update parameter")
    );
  });

  it("delete parameter group fallback message", async () => {
    fail(mockDeletePg);
    mockParamGroups.mockReturnValue({ data: { parameterGroups: [paramGroup], total: 1 }, isLoading: false });
    const user = await openParamGroupsShared();
    await user.click(screen.getByRole("button", { name: "Delete pg-custom" }));
    await user.click(screen.getByRole("button", { name: /^Delete$/ }));
    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to delete parameter group")
    );
  });

  it("create subnet group fallback message", async () => {
    fail(mockCreateSg);
    const user = await openSubnetGroupsShared();
    await user.click(screen.getByRole("button", { name: "Create subnet group" }));
    await user.type(screen.getByLabelText("Name"), "sg-x");
    await user.type(screen.getByLabelText("Subnet IDs (comma-separated)"), "subnet-1");
    await user.click(screen.getAllByRole("button", { name: "Create subnet group" }).slice(-1)[0]);
    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to create subnet group")
    );
  });

  it("update subnet group fallback message", async () => {
    fail(mockModifySg);
    mockSubnetGroups.mockReturnValue({ data: { subnetGroups: [subnetGroup], total: 1 }, isLoading: false });
    const user = await openSubnetGroupsShared();
    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.type(screen.getByLabelText("Subnet IDs (comma-separated)"), ",subnet-2");
    await user.click(screen.getByRole("button", { name: "Update subnet group" }));
    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to update subnet group")
    );
  });

  it("delete subnet group fallback message", async () => {
    fail(mockDeleteSg);
    mockSubnetGroups.mockReturnValue({ data: { subnetGroups: [subnetGroup], total: 1 }, isLoading: false });
    const user = await openSubnetGroupsShared();
    await user.click(screen.getByRole("button", { name: "Delete sg-custom" }));
    await user.click(screen.getByRole("button", { name: /^Delete$/ }));
    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to delete subnet group")
    );
  });
});
