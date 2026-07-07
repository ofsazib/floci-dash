// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

const mockClusters = vi.fn();
const mockDeleteCluster = vi.fn();

vi.mock("../../hooks/useMsk", () => ({
  useMskClusters: (...args: any[]) => mockClusters(...args),
  useDeleteMskCluster: () => ({ mutateAsync: mockDeleteCluster, isPending: false, variables: null }),
}));

import { MskDashboard } from "./MskDashboard";

beforeEach(() => {
  vi.clearAllMocks();
  mockClusters.mockReturnValue({ data: { clusters: [], total: 0 }, isLoading: false });
});

describe("MskDashboard", () => {
  it("shows loading skeleton", () => {
    mockClusters.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = render(<MskDashboard />, { wrapper: createWrapper() });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("shows empty message", () => {
    render(<MskDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No MSK clusters/i)).toBeTruthy();
  });

  it("renders clusters with data", () => {
    mockClusters.mockReturnValue({
      data: {
        clusters: [{
          ClusterName: "my-cluster",
          ClusterArn: "arn:aws:kafka:us-east-1:123:cluster/my-cluster",
          State: "ACTIVE",
          NumberOfBrokerNodes: 3,
          CurrentBrokerSoftwareInfo: { KafkaVersion: "3.5.0" },
          CreationTime: "2024-01-15T00:00:00Z",
        }],
        total: 1,
      },
      isLoading: false,
    });
    render(<MskDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-cluster")).toBeTruthy();
    expect(screen.getByText("ACTIVE")).toBeTruthy();
    expect(screen.getByText("3.5.0")).toBeTruthy();
  });

  it("shows dash for missing state", () => {
    mockClusters.mockReturnValue({
      data: { clusters: [{ ClusterName: "test", ClusterArn: "arn" }], total: 1 },
      isLoading: false,
    });
    render(<MskDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("test")).toBeTruthy();
    const dashes = screen.getAllByText("-");
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it("deletes a cluster", async () => {
    mockClusters.mockReturnValue({
      data: {
        clusters: [{
          ClusterName: "delete-me",
          ClusterArn: "arn:aws:kafka:us-east-1:123:cluster/delete-me",
          State: "ACTIVE",
        }],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<MskDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("delete-me")).toBeTruthy());

    const deleteBtn = screen.getByRole("button", { name: /Delete delete-me/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteCluster).toHaveBeenCalledWith("arn:aws:kafka:us-east-1:123:cluster/delete-me"));
  });

  it("filters clusters by name", async () => {
    mockClusters.mockReturnValue({
      data: {
        clusters: [
          { ClusterName: "alpha-cluster", ClusterArn: "arn1" },
          { ClusterName: "beta-cluster", ClusterArn: "arn2" },
        ],
        total: 2,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<MskDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("alpha-cluster")).toBeTruthy());

    const filterInput = screen.getByPlaceholderText("Find clusters by name");
    await user.type(filterInput, "beta");
    await waitFor(() => {
      expect(screen.queryByText("alpha-cluster")).toBeNull();
    });
  });
});
