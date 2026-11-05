// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const m = vi.hoisted(() => ({ clusters: vi.fn(), refetch: vi.fn() }));

vi.mock("../../../hooks/useECS", () => ({ useECSClusters: () => m.clusters() }));

import ClustersView, { clusterMonitoring } from "./ClustersView";

const alpha = {
  clusterName: "alpha",
  clusterArn: "arn:alpha",
  activeServicesCount: 3,
  pendingTasksCount: 1,
  runningTasksCount: 2,
  registeredContainerInstancesCount: 4,
  settings: [{ name: "containerInsights", value: "enabled" }],
  defaultCapacityProviderStrategy: [{ capacityProvider: "FARGATE" }, { capacityProvider: "FARGATE_SPOT" }],
};
const beta = { clusterName: "beta", clusterArn: "arn:beta" };

function data(clusters: any[] | undefined, extra: object = {}) {
  m.clusters.mockReturnValue({ data: clusters && { clusters, total: clusters.length }, isLoading: false, isError: false, error: null, refetch: m.refetch, ...extra });
}

beforeEach(() => {
  vi.clearAllMocks();
  data([alpha, beta]);
});

describe("clusterMonitoring", () => {
  it("reports Container Insights when enabled or enhanced", () => {
    expect(clusterMonitoring(alpha)).toBe("Container Insights");
    expect(clusterMonitoring({ settings: [{ name: "containerInsights", value: "enhanced" }] })).toBe("Container Insights");
    expect(clusterMonitoring({ settings: [{ name: "containerInsights", value: "disabled" }] })).toBe("Default");
    expect(clusterMonitoring({})).toBe("Default");
  });
});

describe("ClustersView", () => {
  it("lists clusters with the console columns", () => {
    render(<ClustersView onOpen={vi.fn()} onCreate={vi.fn()} />);
    expect(screen.getByRole("heading", { name: /Clusters/ })).toBeTruthy();
    expect(screen.getByText("(2)")).toBeTruthy();
    expect(screen.getByText("1 Pending | 2 Running")).toBeTruthy();
    expect(screen.getByText("No tasks running")).toBeTruthy();
    expect(screen.getByText("4 EC2")).toBeTruthy();
    expect(screen.getByText("FARGATE, FARGATE_SPOT")).toBeTruthy();
    expect(screen.getByText("No default found")).toBeTruthy();
    expect(screen.getByText("Container Insights")).toBeTruthy();
  });

  it("fills in a missing pending or running count", () => {
    data([{ clusterName: "r", runningTasksCount: 3 }, { clusterName: "p", pendingTasksCount: 2 }]);
    render(<ClustersView onOpen={vi.fn()} onCreate={vi.fn()} />);
    expect(screen.getByText("0 Pending | 3 Running")).toBeTruthy();
    expect(screen.getByText("2 Pending | 0 Running")).toBeTruthy();
  });

  it("shows when the list was last updated", () => {
    const at = Date.UTC(2026, 0, 18, 9, 24);
    data([alpha], { dataUpdatedAt: at });
    render(<ClustersView onOpen={vi.fn()} onCreate={vi.fn()} />);
    expect(screen.getByText(/Last updated/).textContent).toContain(new Date(at).toLocaleString());
  });

  it("opens a cluster, creates one and refreshes", () => {
    const onOpen = vi.fn();
    const onCreate = vi.fn();
    render(<ClustersView onOpen={onOpen} onCreate={onCreate} />);
    fireEvent.click(screen.getByRole("button", { name: "alpha" }));
    expect(onOpen).toHaveBeenCalledWith(alpha);
    fireEvent.click(screen.getByRole("button", { name: "Create cluster" }));
    expect(onCreate).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Refresh clusters" }));
    expect(m.refetch).toHaveBeenCalled();
  });

  it("shows a dash for a cluster without a name", () => {
    data([{}]);
    render(<ClustersView onOpen={vi.fn()} onCreate={vi.fn()} />);
    expect(screen.getByText("—")).toBeTruthy();
  });

  it("filters by name and shows no matches", () => {
    render(<ClustersView onOpen={vi.fn()} onCreate={vi.fn()} />);
    const input = screen.getByPlaceholderText("Search clusters");
    fireEvent.change(input, { target: { value: "ALP" } });
    expect(screen.queryByRole("button", { name: "beta" })).toBeNull();
    expect(screen.getAllByText("1 match").length).toBeGreaterThan(0);
    fireEvent.change(input, { target: { value: "zzz" } });
    expect(screen.getByText("No matches")).toBeTruthy();
  });

  it("offers Create cluster when there are none", () => {
    data(undefined);
    const onCreate = vi.fn();
    render(<ClustersView onOpen={vi.fn()} onCreate={onCreate} />);
    expect(screen.getByText("No clusters to display.")).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: "Create cluster" })[1]);
    expect(onCreate).toHaveBeenCalled();
  });

  it("filters out clusters without a name", () => {
    data([{}, beta]);
    render(<ClustersView onOpen={vi.fn()} onCreate={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText("Search clusters"), { target: { value: "be" } });
    expect(screen.queryByText("—")).toBeNull();
    expect(screen.getByRole("button", { name: "beta" })).toBeTruthy();
  });

  it("shows load errors with a fallback message", () => {
    data(undefined, { isError: true, error: new Error("Denied") });
    const { unmount } = render(<ClustersView onOpen={vi.fn()} onCreate={vi.fn()} />);
    expect(screen.getByText("Denied")).toBeTruthy();
    unmount();
    data(undefined, { isError: true, error: null });
    render(<ClustersView onOpen={vi.fn()} onCreate={vi.fn()} />);
    expect(screen.getByText("Unknown error")).toBeTruthy();
  });
});
