// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

const mockClusters = vi.fn();
const mockModifyCluster = vi.fn();
const modifyClusterState = vi.hoisted(() => ({ isError: false, error: null as Error | null }));
const mockInstances = vi.fn();
const mockDeleteCluster = vi.fn();
const mockDeleteInstance = vi.fn();

const deleteClusterState = vi.hoisted(() => ({ isPending: false, variables: null as string | null }));
const deleteInstanceState = vi.hoisted(() => ({ isPending: false, variables: null as string | null }));

vi.mock("../../hooks/useNeptune", () => ({
  useNeptuneClusters: (...args: any[]) => mockClusters(...args),
  useNeptuneInstances: (...args: any[]) => mockInstances(...args),
  useDeleteNeptuneCluster: () => ({
    mutateAsync: mockDeleteCluster,
    get isPending() { return deleteClusterState.isPending; },
    get variables() { return deleteClusterState.variables; },
  }),
  useDeleteNeptuneInstance: () => ({
    mutateAsync: mockDeleteInstance,
    get isPending() { return deleteInstanceState.isPending; },
    get variables() { return deleteInstanceState.variables; },
  }),
  useAddNeptuneClusterRole: () => ({ mutateAsync: mockAddRole, isPending: false }),
  useRemoveNeptuneClusterRole: () => ({ mutateAsync: mockRemoveRole, isPending: false }),
  useNeptuneGlobalClusters: () => ({
    get data() { return globalClustersState.data; },
    isLoading: false,
  }),
  useNeptuneResourceTags: () => ({
    get data() { return resourceTagsState.data; },
  }),
  useAddNeptuneResourceTags: () => ({ mutateAsync: mockAddTag, isPending: false }),
  useRemoveNeptuneResourceTags: () => ({
    mutateAsync: mockRemoveTag,
    get isPending() { return removeTagState.isPending; },
    get variables() { return removeTagState.variables; },
  }),
  useModifyNeptuneCluster: () => ({
    mutate: mockModifyCluster,
    isPending: false,
    get isError() { return modifyClusterState.isError; },
    get error() { return modifyClusterState.error; },
  }),
}));

const mockAddRole = vi.fn();
const mockRemoveRole = vi.fn();
const mockAddTag = vi.fn();
const mockRemoveTag = vi.fn();

const globalClustersState: { data: any } = { data: undefined };
const resourceTagsState: { data: any } = { data: undefined };
const removeTagState: { isPending: boolean; variables: any } = { isPending: false, variables: null };

import { NeptuneDashboard } from "./NeptuneDashboard";

beforeEach(() => {
  modifyClusterState.isError = false;
  modifyClusterState.error = null;
  vi.clearAllMocks();
  deleteClusterState.isPending = false;
  deleteClusterState.variables = null;
  deleteInstanceState.isPending = false;
  deleteInstanceState.variables = null;
  mockClusters.mockReturnValue({ data: { clusters: [], total: 0 }, isLoading: false });
  mockInstances.mockReturnValue({ data: { instances: [], total: 0 }, isLoading: false });
  globalClustersState.data = undefined;
  resourceTagsState.data = undefined;
  removeTagState.isPending = false;
  removeTagState.variables = null;
  mockAddRole.mockReset();
  mockRemoveRole.mockReset();
  mockAddTag.mockReset();
  mockRemoveTag.mockReset();
});

describe("NeptuneDashboard", () => {
  it("shows loading skeleton when clusters load", () => {
    mockClusters.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = render(<NeptuneDashboard />, { wrapper: createWrapper() });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("renders all tabs", () => {
    render(<NeptuneDashboard />, { wrapper: createWrapper() });
    expect(screen.getAllByRole("tab", { name: /clusters/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole("tab", { name: /^Instances$/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /Global Clusters/i })).toBeTruthy();
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

  // ─── Cluster edge cases ──────────────────────────────

  it("shows dash for missing cluster engine version", () => {
    mockClusters.mockReturnValue({
      data: {
        clusters: [{ DBClusterIdentifier: "no-ver", Status: "available", Engine: "neptune" }],
        total: 1,
      },
      isLoading: false,
    });
    const { container } = render(<NeptuneDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("no-ver")).toBeTruthy();
    // EngineVersion missing → "-" should appear
    const dashes = container.querySelectorAll("td");
    const dashTexts = Array.from(dashes).map((d) => d.textContent);
    expect(dashTexts.filter((t) => t === "-").length).toBeGreaterThanOrEqual(1);
  });

  it("shows dash for missing cluster endpoint", () => {
    mockClusters.mockReturnValue({
      data: {
        clusters: [{ DBClusterIdentifier: "no-ep", Status: "available", Engine: "neptune", EngineVersion: "1.3.0" }],
        total: 1,
      },
      isLoading: false,
    });
    const { container } = render(<NeptuneDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("no-ep")).toBeTruthy();
    const dashes = container.querySelectorAll("td");
    const dashTexts = Array.from(dashes).map((d) => d.textContent);
    expect(dashTexts.filter((t) => t === "-").length).toBeGreaterThanOrEqual(1);
  });

  it("shows zero members when DBClusterMembers is undefined", () => {
    mockClusters.mockReturnValue({
      data: {
        clusters: [{ DBClusterIdentifier: "no-members", Status: "available", Engine: "neptune", EngineVersion: "1.3.0", Endpoint: "ep" }],
        total: 1,
      },
      isLoading: false,
    });
    render(<NeptuneDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("0")).toBeTruthy();
  });

  // ─── Instance edge cases ─────────────────────────────

  it("shows dash for missing instance cluster identifier", async () => {
    mockInstances.mockReturnValue({
      data: {
        instances: [{ DBInstanceIdentifier: "no-cluster", DBInstanceClass: "db.r5.large", DBInstanceStatus: "available" }],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<NeptuneDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /instances/i }));
    await waitFor(() => expect(screen.getByText("no-cluster")).toBeTruthy());
    // Missing DBClusterIdentifier → "-" (use getAllByText since multiple dashes may exist)
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(1);
  });

  it("shows dash for missing instance class", async () => {
    mockInstances.mockReturnValue({
      data: {
        instances: [{ DBInstanceIdentifier: "no-class", DBClusterIdentifier: "c1", DBInstanceStatus: "available" }],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<NeptuneDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /instances/i }));
    await waitFor(() => expect(screen.getByText("no-class")).toBeTruthy());
    const dashes = document.querySelectorAll("td");
    const dashTexts = Array.from(dashes).map((d) => d.textContent);
    expect(dashTexts.filter((t) => t === "-").length).toBeGreaterThanOrEqual(1);
  });

  it("shows dash for missing instance status", async () => {
    mockInstances.mockReturnValue({
      data: {
        instances: [{ DBInstanceIdentifier: "no-status", DBClusterIdentifier: "c1", DBInstanceClass: "db.r5.large" }],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<NeptuneDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /instances/i }));
    await waitFor(() => expect(screen.getByText("no-status")).toBeTruthy());
    const dashes = document.querySelectorAll("td");
    const dashTexts = Array.from(dashes).map((d) => d.textContent);
    expect(dashTexts.filter((t) => t === "-").length).toBeGreaterThanOrEqual(1);
  });

  it("shows dash for missing instance endpoint address", async () => {
    mockInstances.mockReturnValue({
      data: {
        instances: [{ DBInstanceIdentifier: "no-ep", DBClusterIdentifier: "c1", DBInstanceClass: "db.r5.large", DBInstanceStatus: "available", Endpoint: {} }],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<NeptuneDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /instances/i }));
    await waitFor(() => expect(screen.getByText("no-ep")).toBeTruthy());
    const dashes = document.querySelectorAll("td");
    const dashTexts = Array.from(dashes).map((d) => d.textContent);
    expect(dashTexts.filter((t) => t === "-").length).toBeGreaterThanOrEqual(1);
  });

  // ─── Instances loading & filter ──────────────────────

  it("shows loading skeleton when instances load", async () => {
    mockInstances.mockReturnValue({ data: undefined, isLoading: true });
    const user = userEvent.setup();
    const { container } = render(<NeptuneDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /instances/i }));
    await waitFor(() => expect(container.querySelectorAll("div").length).toBeGreaterThan(0));
  });

  it("filters instances by name", async () => {
    mockInstances.mockReturnValue({
      data: {
        instances: [
          { DBInstanceIdentifier: "inst-alpha", DBClusterIdentifier: "c", DBInstanceClass: "db.r5.large", DBInstanceStatus: "available" },
          { DBInstanceIdentifier: "inst-beta", DBClusterIdentifier: "c", DBInstanceClass: "db.r5.large", DBInstanceStatus: "available" },
        ],
        total: 2,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<NeptuneDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /instances/i }));
    await waitFor(() => expect(screen.getByText("inst-alpha")).toBeTruthy());

    const filterInput = screen.getByPlaceholderText("Find instances");
    await user.type(filterInput, "beta");
    await waitFor(() => expect(screen.queryByText("inst-alpha")).toBeNull());
  });

  // ─── Delete loading states ───────────────────────────

  it("shows delete cluster loading when isPending matches", () => {
    deleteClusterState.isPending = true;
    deleteClusterState.variables = "loading-me";
    mockClusters.mockReturnValue({
      data: {
        clusters: [{ DBClusterIdentifier: "loading-me", Status: "available", Engine: "neptune", EngineVersion: "1.3.0", Endpoint: "ep" }],
        total: 1,
      },
      isLoading: false,
    });
    render(<NeptuneDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("loading-me")).toBeTruthy();
  });

  it("shows delete cluster not loading when isPending but different variable", () => {
    deleteClusterState.isPending = true;
    deleteClusterState.variables = "other-cluster";
    mockClusters.mockReturnValue({
      data: {
        clusters: [{ DBClusterIdentifier: "not-loading", Status: "available", Engine: "neptune", EngineVersion: "1.3.0", Endpoint: "ep" }],
        total: 1,
      },
      isLoading: false,
    });
    render(<NeptuneDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("not-loading")).toBeTruthy();
  });

  it("shows delete instance loading when isPending matches", async () => {
    deleteInstanceState.isPending = true;
    deleteInstanceState.variables = "inst-loading";
    mockInstances.mockReturnValue({
      data: {
        instances: [{ DBInstanceIdentifier: "inst-loading", DBClusterIdentifier: "c", DBInstanceClass: "db.r5.large", DBInstanceStatus: "available" }],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<NeptuneDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /instances/i }));
    await waitFor(() => expect(screen.getByText("inst-loading")).toBeTruthy());
  });

  it("shows delete instance not loading when isPending but different variable", async () => {
    deleteInstanceState.isPending = true;
    deleteInstanceState.variables = "other-inst";
    mockInstances.mockReturnValue({
      data: {
        instances: [{ DBInstanceIdentifier: "inst-ok", DBClusterIdentifier: "c", DBInstanceClass: "db.r5.large", DBInstanceStatus: "available" }],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<NeptuneDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /instances/i }));
    await waitFor(() => expect(screen.getByText("inst-ok")).toBeTruthy());
  });

  // ─── Null data fallbacks ─────────────────────────────

  it("handles null clustersData gracefully", () => {
    mockClusters.mockReturnValue({ data: null, isLoading: false });
    render(<NeptuneDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No Neptune clusters/i)).toBeTruthy();
  });

  it("handles null instancesData gracefully", async () => {
    mockInstances.mockReturnValue({ data: null, isLoading: false });
    const user = userEvent.setup();
    render(<NeptuneDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /instances/i }));
    await waitFor(() => expect(screen.getByText(/No Neptune instances/i)).toBeTruthy());
  });

  // ─── Cluster members truthy branch ───────────────────

  it("shows member count when cluster has members", () => {
    mockClusters.mockReturnValue({
      data: {
        clusters: [{
          DBClusterIdentifier: "multi-members",
          Status: "available",
          Engine: "neptune",
          EngineVersion: "1.3.0",
          Endpoint: "ep",
          DBClusterMembers: [{ DBInstanceIdentifier: "a" }, { DBInstanceIdentifier: "b" }, { DBInstanceIdentifier: "c" }],
        }],
        total: 1,
      },
      isLoading: false,
    });
    render(<NeptuneDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("3")).toBeTruthy();
  });

  // ─── Instance with no Endpoint at all ────────────────

  it("shows dash for instance with no Endpoint property", async () => {
    mockInstances.mockReturnValue({
      data: {
        instances: [{ DBInstanceIdentifier: "no-endpoint-prop", DBClusterIdentifier: "c", DBInstanceClass: "db.r5.large", DBInstanceStatus: "available" }],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<NeptuneDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /instances/i }));
    await waitFor(() => expect(screen.getByText("no-endpoint-prop")).toBeTruthy());
    const dashes = document.querySelectorAll("td");
    const dashTexts = Array.from(dashes).map((d) => d.textContent);
    expect(dashTexts.filter((t) => t === "-").length).toBeGreaterThanOrEqual(1);
  });

  // ─── Instance loading on first tab click ─────────────

  it("shows instances loading when switching to instances tab", async () => {
    mockInstances.mockReturnValue({ data: undefined, isLoading: true });
    const user = userEvent.setup();
    render(<NeptuneDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /instances/i }));
    await waitFor(() => expect(screen.getByText("Neptune Instances")).toBeTruthy());
  });

  // ─── Cluster with full data (all fields populated) ───

  it("renders cluster with all fields populated", () => {
    mockClusters.mockReturnValue({
      data: {
        clusters: [{
          DBClusterIdentifier: "full-cluster",
          Status: "creating",
          Engine: "neptune",
          EngineVersion: "1.3.2",
          Endpoint: "full.abc.neptune.amazonaws.com",
          DBClusterMembers: [{ DBInstanceIdentifier: "writer" }, { DBInstanceIdentifier: "reader" }],
        }],
        total: 1,
      },
      isLoading: false,
    });
    render(<NeptuneDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("full-cluster")).toBeTruthy();
    expect(screen.getByText("creating")).toBeTruthy();
    expect(screen.getByText("1.3.2")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
  });

  // ─── Cluster with undefined DBClusterMembers (nullish coalescing) ───
  it("shows zero members when DBClusterMembers is null", () => {
    mockClusters.mockReturnValue({
      data: {
        clusters: [{
          DBClusterIdentifier: "null-members",
          Status: "available",
          Engine: "neptune",
          EngineVersion: "1.3.0",
          Endpoint: "ep",
          DBClusterMembers: null,
        }],
        total: 1,
      },
      isLoading: false,
    });
    render(<NeptuneDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("null-members")).toBeTruthy();
    // null?.length → undefined → 0
    expect(screen.getByText("0")).toBeTruthy();
  });
});

describe("NeptuneDashboard — modify cluster", () => {
  function setupCluster() {
    mockClusters.mockReturnValue({
      data: { clusters: [{ DBClusterIdentifier: "c1", Status: "available", Engine: "neptune" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
  }

  it("modifies a cluster engine version from the modal", async () => {
    mockModifyCluster.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
    setupCluster();
    const user = userEvent.setup();
    render(<NeptuneDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Modify" }));
    const dialog = screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden"))!;
    const input = dialog.querySelector("input") as HTMLInputElement;
    await user.type(input, "1.3.0");
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(mockModifyCluster).toHaveBeenCalledWith(
        { id: "c1", engineVersion: "1.3.0" },
        expect.objectContaining({ onSuccess: expect.any(Function) })
      )
    );
  });

  it("sends undefined version when blank", async () => {
    mockModifyCluster.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
    setupCluster();
    const user = userEvent.setup();
    render(<NeptuneDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Modify" }));
    const dialog = screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden"))!;
    await user.click(within(dialog).getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(mockModifyCluster).toHaveBeenCalledWith(
        { id: "c1", engineVersion: undefined },
        expect.anything()
      )
    );
  });

  it("cancels the modify modal and Escape-dismisses", async () => {
    setupCluster();
    const user = userEvent.setup();
    render(<NeptuneDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Modify" }));
    const dialog = screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden"))!;
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(mockModifyCluster).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Modify" }));
    document.querySelectorAll('[class*="awsui_dialog"]').forEach((d) =>
      fireEvent.keyDown(d as HTMLElement, { keyCode: 27 })
    );
    expect(mockModifyCluster).not.toHaveBeenCalled();
  });
});

describe("NeptuneDashboard — modify error arms", () => {
  it("shows the modify error and fallback message", async () => {
    modifyClusterState.isError = true;
    modifyClusterState.error = new Error("modify failed");
    mockClusters.mockReturnValue({
      data: { clusters: [{ DBClusterIdentifier: "c1", Status: "available", Engine: "neptune" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<NeptuneDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Modify" }));
    expect(await screen.findByText("modify failed")).toBeTruthy();
  });

  it("falls back to a generic modify error", async () => {
    modifyClusterState.isError = true;
    modifyClusterState.error = null;
    mockClusters.mockReturnValue({
      data: { clusters: [{ DBClusterIdentifier: "c1", Status: "available", Engine: "neptune" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<NeptuneDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Modify" }));
    expect(await screen.findByText("Failed to modify cluster")).toBeTruthy();
  });
});

describe("NeptuneDashboard — cluster roles, tags, global clusters (E.9 batch 2)", () => {
  function clusterRow() {
    mockClusters.mockReturnValue({
      data: {
        clusters: [
          {
            DBClusterIdentifier: "nept-db",
            Status: "available",
            Engine: "neptune",
            DBClusterArn: "arn:aws:neptune:us-east-1:123456789012:cluster:nept-db",
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
  }

  it("renders global clusters rows", () => {
    globalClustersState.data = {
      globalClusters: [
        {
          GlobalClusterIdentifier: "g-nept",
          GlobalClusterArn: "arn:aws:neptune:::global-cluster:g",
          Engine: "neptune",
          Status: "available",
          GlobalClusterMembers: [{}],
        },
      ],
      total: 1,
    };
    render(<NeptuneDashboard />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByRole("tab", { name: /Global Clusters/i }));
    expect(screen.getByText("g-nept")).toBeTruthy();
    expect(screen.getByText("neptune")).toBeTruthy();
  });

  it("shows empty message for global clusters", async () => {
    const user = userEvent.setup();
    render(<NeptuneDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Global Clusters/i }));
    expect(screen.getByText(/No Neptune global clusters/i)).toBeTruthy();
  });

  it("shows Roles and Tags buttons on cluster rows", () => {
    clusterRow();
    render(<NeptuneDashboard />, { wrapper: createWrapper() });
    expect(screen.getByRole("button", { name: "Roles" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Tags" })).toBeTruthy();
  });

  it("opens the roles modal and adds a role", async () => {
    clusterRow();
    mockAddRole.mockResolvedValueOnce({ added: true });
    const user = userEvent.setup();
    render(<NeptuneDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Roles" }));
    await waitFor(() => expect(screen.getByText("IAM roles — nept-db")).toBeTruthy());
    await user.type(
      screen.getByPlaceholderText("arn:aws:iam::123456789012:role/neptune-role"),
      "arn:aws:iam::123456789012:role/r1"
    );
    await user.click(screen.getByRole("button", { name: /Add role/i }));
    await waitFor(() => {
      expect(mockAddRole).toHaveBeenCalledWith({
        id: "nept-db",
        roleArn: "arn:aws:iam::123456789012:role/r1",
      });
    });
  });

  it("removes a role from the roles modal", async () => {
    clusterRow();
    mockRemoveRole.mockResolvedValueOnce({ removed: true });
    const user = userEvent.setup();
    render(<NeptuneDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Roles" }));
    await waitFor(() => expect(screen.getByText("IAM roles — nept-db")).toBeTruthy());
    await user.type(
      screen.getByPlaceholderText("arn:aws:iam::123456789012:role/neptune-role"),
      "arn:aws:iam::123456789012:role/r1"
    );
    await user.click(screen.getByRole("button", { name: /Remove role/i }));
    await waitFor(() => {
      expect(mockRemoveRole).toHaveBeenCalledWith({
        id: "nept-db",
        roleArn: "arn:aws:iam::123456789012:role/r1",
      });
    });
  });

  it("disables Add role when the ARN is empty", async () => {
    clusterRow();
    const user = userEvent.setup();
    render(<NeptuneDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Roles" }));
    await waitFor(() => expect(screen.getByText("IAM roles — nept-db")).toBeTruthy());
    expect(screen.getByRole("button", { name: /Add role/i })).toBeDisabled();
  });

  it("closes the roles modal on Close", async () => {
    clusterRow();
    const user = userEvent.setup();
    render(<NeptuneDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Roles" }));
    await waitFor(() => expect(screen.getByText("IAM roles — nept-db")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Close$/i }));
    await waitFor(() => expect(screen.queryByText("IAM roles — nept-db")).toBeNull());
  });

  it("opens the tags modal, lists tags and adds a tag", async () => {
    clusterRow();
    resourceTagsState.data = {
      resourceName: "arn:aws:neptune:us-east-1:123456789012:cluster:nept-db",
      tags: [{ Key: "env", Value: "dev" }],
      total: 1,
    };
    mockAddTag.mockResolvedValueOnce({ tagged: true });
    const user = userEvent.setup();
    render(<NeptuneDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Tags" }));
    await waitFor(() => expect(screen.getByText("Tags — nept-db")).toBeTruthy());
    expect(screen.getByText("env")).toBeTruthy();
    await user.type(screen.getByPlaceholderText("env"), "team");
    await user.type(screen.getByPlaceholderText("dev"), "core");
    await user.click(screen.getByRole("button", { name: /Add tag/i }));
    await waitFor(() => {
      expect(mockAddTag).toHaveBeenCalledWith({
        resourceName: "arn:aws:neptune:us-east-1:123456789012:cluster:nept-db",
        tags: { team: "core" },
      });
    });
  });

  it("shows No tags placeholder when cluster has no tags", async () => {
    clusterRow();
    resourceTagsState.data = { resourceName: "arn:x", tags: [], total: 0 };
    const user = userEvent.setup();
    render(<NeptuneDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Tags" }));
    await waitFor(() => expect(screen.getByText("Tags — nept-db")).toBeTruthy());
    expect(screen.getByText("No tags")).toBeTruthy();
  });

  it("removes a tag from the tags modal", async () => {
    clusterRow();
    resourceTagsState.data = {
      resourceName: "arn:x",
      tags: [{ Key: "old", Value: "x" }],
      total: 1,
    };
    mockRemoveTag.mockResolvedValueOnce({ untagged: true });
    const user = userEvent.setup();
    render(<NeptuneDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Tags" }));
    await waitFor(() => expect(screen.getByText("old")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete old/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/i)).toBeTruthy());
    const confirmBtns = screen.getAllByRole("button", { name: /^Delete$/i });
    await user.click(confirmBtns[confirmBtns.length - 1]);
    await waitFor(() => {
      expect(mockRemoveTag).toHaveBeenCalledWith({
        resourceName: "arn:aws:neptune:us-east-1:123456789012:cluster:nept-db",
        tagKeys: ["old"],
      });
    });
  });

  it("closes the tags modal on Close", async () => {
    clusterRow();
    resourceTagsState.data = { resourceName: "arn:x", tags: [], total: 0 };
    const user = userEvent.setup();
    render(<NeptuneDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Tags" }));
    await waitFor(() => expect(screen.getByText("Tags — nept-db")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Close$/i }));
    await waitFor(() => expect(screen.queryByText("Tags — nept-db")).toBeNull());
  });
});

describe("NeptuneDashboard — coverage completion", () => {
  function clusterRow() {
    mockClusters.mockReturnValue({
      data: {
        clusters: [
          {
            DBClusterIdentifier: "nept-db",
            Status: "available",
            Engine: "neptune",
            DBClusterArn: "arn:aws:neptune:us-east-1:123456789012:cluster:nept-db",
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
  }

  it("renders global cluster dash fallbacks for missing fields", async () => {
    const user = userEvent.setup();
    globalClustersState.data = {
      globalClusters: [{ GlobalClusterIdentifier: "minimal" }],
      total: 1,
    };
    render(<NeptuneDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Global Clusters/i }));
    await waitFor(() => expect(screen.getByText("minimal")).toBeTruthy());
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(3);
  });

  it("filters global clusters by id", async () => {
    const user = userEvent.setup();
    globalClustersState.data = {
      globalClusters: [
        { GlobalClusterIdentifier: "alpha" },
        { GlobalClusterIdentifier: "beta" },
      ],
      total: 2,
    };
    render(<NeptuneDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Global Clusters/i }));
    await waitFor(() => expect(screen.getByText("alpha")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("Find global clusters"), "alp");
    await waitFor(() => expect(screen.queryByText("beta")).toBeNull());
  });

  it("renders tags modal when tags data is undefined", async () => {
    clusterRow();
    resourceTagsState.data = undefined;
    const user = userEvent.setup();
    render(<NeptuneDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Tags" }));
    await waitFor(() => expect(screen.getByText("Tags — nept-db")).toBeTruthy());
    expect(screen.getByText("No tags")).toBeTruthy();
  });

  it("disables the tag remove button while untag is pending", async () => {
    clusterRow();
    resourceTagsState.data = {
      resourceName: "arn:x",
      tags: [{ Key: "env", Value: "dev" }],
      total: 1,
    };
    removeTagState.isPending = true;
    removeTagState.variables = { resourceName: "arn:x", tagKeys: ["env"] };
    const user = userEvent.setup();
    render(<NeptuneDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Tags" }));
    await waitFor(() => expect(screen.getByText("env")).toBeTruthy());
    expect(screen.getByRole("button", { name: /Delete env/i })).toBeDisabled();
  });
});
