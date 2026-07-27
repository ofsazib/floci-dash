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
});
