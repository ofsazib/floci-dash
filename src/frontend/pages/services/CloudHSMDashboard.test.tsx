// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createWrapper } from "../../../test/helpers";
import React from "react";

const mockClusters = vi.fn();
const mockBackups = vi.fn();
const mockCreateMutate: any = vi.fn(() => Promise.resolve({}));
const mockDeleteClusterMutate = vi.fn(() => Promise.resolve({}));
const mockDeleteBackupMutate = vi.fn(() => Promise.resolve({}));

vi.mock("../../hooks/useCloudHSM", () => ({
  useCloudHsmClusters: (...args: any[]) => mockClusters(...args),
  useCloudHsmBackups: (...args: any[]) => mockBackups(...args),
  useCreateCloudHsmCluster: () => ({ mutateAsync: mockCreateMutate, isPending: false }),
  useDeleteCloudHsmCluster: () => ({ mutateAsync: mockDeleteClusterMutate, isPending: false }),
  useDeleteCloudHsmBackup: () => ({ mutateAsync: mockDeleteBackupMutate, isPending: false }),
}));

import { CloudHSMDashboard } from "./CloudHSMDashboard";

const CLUSTER = {
  ClusterId: "c-1",
  State: "ACTIVE",
  HsmType: "hsm1.medium",
  VpcId: "vpc-1",
  Hsms: { "hsm-1": {} },
};

describe("CloudHSMDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateMutate.mockImplementation(() => Promise.resolve({}));
    mockDeleteClusterMutate.mockImplementation(() => Promise.resolve({}));
    mockDeleteBackupMutate.mockImplementation(() => Promise.resolve({}));
    mockClusters.mockReturnValue({ data: { clusters: [], total: 0 }, isLoading: false });
    mockBackups.mockReturnValue({ data: { backups: [], total: 0 }, isLoading: false });
  });

  it("renders clusters tab with empty message", () => {
    render(<CloudHSMDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("CloudHSM Clusters")).toBeTruthy();
    expect(screen.getByText(/No CloudHSM clusters/)).toBeTruthy();
  });

  it("renders cluster rows with state indicators", () => {
    mockClusters.mockReturnValue({
      data: { clusters: [CLUSTER, { ...CLUSTER, ClusterId: "c-2", State: "DELETED" }], total: 2 },
      isLoading: false,
    });
    render(<CloudHSMDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("c-1")).toBeTruthy();
    expect(screen.getByText("c-2")).toBeTruthy();
    expect(screen.getByText("ACTIVE")).toBeTruthy();
    expect(screen.getByText("DELETED")).toBeTruthy();
  });

  it("shows backups tab content", async () => {
    mockBackups.mockReturnValue({
      data: {
        backups: [{ backupId: "b-1", clusterId: "c-1", state: "READY", createTimestamp: "222" }],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CloudHSMDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Backups"));
    expect(await screen.findByText("CloudHSM Backups")).toBeTruthy();
    expect(screen.getByText("b-1")).toBeTruthy();
  });

  it("creates a cluster with parsed subnets", async () => {
    const user = userEvent.setup();
    render(<CloudHSMDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Create Cluster" }));

    const subnetsInput = screen.getByLabelText(/Subnet IDs/);
    await user.clear(subnetsInput);
    await user.type(subnetsInput, "subnet-a, subnet-b ,");
    await user.click(screen.getByRole("button", { name: "Create" }));

    await screen.findByText("CloudHSM Clusters");
    expect(mockCreateMutate).toHaveBeenCalledWith({
      hsmType: "hsm1.medium",
      subnetIds: ["subnet-a", "subnet-b"],
    });
  });

  it("refuses create when subnets empty after parse", async () => {
    const user = userEvent.setup();
    render(<CloudHSMDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Create Cluster" }));

    const subnetsInput = screen.getByLabelText(/Subnet IDs/);
    await user.clear(subnetsInput);
    await user.type(subnetsInput, " , ");
    await user.click(screen.getByRole("button", { name: "Create" }));
    expect(mockCreateMutate).not.toHaveBeenCalled();
  });

  it("deletes a cluster via confirm dialog", async () => {
    mockClusters.mockReturnValue({
      data: { clusters: [CLUSTER], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CloudHSMDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Delete c-1/ }));
    await screen.findByText(/Are you sure/);
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await vi.waitFor(() => expect(mockDeleteClusterMutate).toHaveBeenCalledWith("c-1"));
  });

  it("deletes a backup via confirm dialog from backups tab", async () => {
    mockBackups.mockReturnValue({
      data: {
        backups: [{ backupId: "b-1", clusterId: "c-1", state: "READY", createTimestamp: "" }],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CloudHSMDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Backups"));
    await user.click(await screen.findByRole("button", { name: /Delete b-1/ }));
    await screen.findByText(/Are you sure/);
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await vi.waitFor(() => expect(mockDeleteBackupMutate).toHaveBeenCalledWith("b-1"));
  });
});
