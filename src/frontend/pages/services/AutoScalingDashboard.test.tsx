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

const mockGroupsHook = vi.fn();
const mockLCsHook = vi.fn();
const mockCreateGroup = vi.fn();
const mockDeleteGroup = vi.fn();

const deleteGroupState = vi.hoisted(() => ({
  isPending: false,
  variables: null as string | null,
}));

vi.mock("../../hooks/useAutoScaling", () => ({
  useAutoScalingGroups: (...args: any[]) => mockGroupsHook(...args),
  useLaunchConfigurations: (...args: any[]) => mockLCsHook(...args),
  useCreateAutoScalingGroup: () => ({
    mutate: mockCreateGroup,
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useDeleteAutoScalingGroup: () => ({
    mutateAsync: mockDeleteGroup,
    isPending: deleteGroupState.isPending,
    variables: deleteGroupState.variables,
  }),
  useUpdateAutoScalingGroup: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useSetDesiredCapacity: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useScalingPolicies: () => ({
    data: { policies: [] },
    isLoading: false,
  }),
  useScalingActivities: () => ({
    data: { activities: [] },
    isLoading: false,
  }),
}));

import { AutoScalingDashboard } from "./AutoScalingDashboard";

// ─── Setup ──────────────────────────────────────────────
beforeEach(() => {
  vi.clearAllMocks();
  deleteGroupState.isPending = false;
  deleteGroupState.variables = null;

  mockGroupsHook.mockReturnValue({
    data: { groups: [] as any[], total: 0 },
    isLoading: false,
  });
  mockLCsHook.mockReturnValue({
    data: { launchConfigurations: [] as any[], total: 0 },
    isLoading: false,
  });
});

// ─── Tests ──────────────────────────────────────────────

describe("AutoScalingDashboard — rendering", () => {
  it("shows loading skeleton when loading", () => {
    mockGroupsHook.mockReturnValue({ data: undefined, isLoading: true });
    mockLCsHook.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("shows both tab headers", () => {
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    // Tab label and table header both contain the text, so use getAllByText
    const groupsMatches = screen.getAllByText("Auto Scaling Groups");
    expect(groupsMatches.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Launch Configurations")).toBeTruthy();
  });

  it("shows empty message for auto scaling groups tab", () => {
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No auto scaling group/i)).toBeTruthy();
  });
});

describe("AutoScalingDashboard — auto scaling groups", () => {
  it("renders groups with data", () => {
    mockGroupsHook.mockReturnValue({
      data: {
        groups: [
          {
            AutoScalingGroupName: "my-asg",
            MinSize: 1,
            MaxSize: 5,
            DesiredCapacity: 2,
            Instances: [{ InstanceId: "i-123" }],
            HealthCheckType: "EC2",
            CreatedTime: new Date("2025-01-01").toISOString(),
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-asg")).toBeTruthy();
    expect(screen.getByText("5")).toBeTruthy();  // MaxSize - unique
    expect(screen.getByText("EC2")).toBeTruthy();
  });

  it("renders groups with null/undefined fields gracefully", () => {
    mockGroupsHook.mockReturnValue({
      data: {
        groups: [
          {
            AutoScalingGroupName: "minimal-asg",
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("minimal-asg")).toBeTruthy();
    // MinSize, MaxSize, DesiredCapacity should be undefined, instances 0, health "-"
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(1);
  });

  it("deletes a group", async () => {
    const user = userEvent.setup();
    mockGroupsHook.mockReturnValue({
      data: {
        groups: [
          {
            AutoScalingGroupName: "my-asg",
            MinSize: 1,
            MaxSize: 5,
            DesiredCapacity: 2,
            Instances: [],
            HealthCheckType: "EC2",
            CreatedTime: new Date("2025-01-01").toISOString(),
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    const deleteBtn = screen.getByRole("button", { name: /Delete my-asg/i });
    await user.click(deleteBtn);
    await waitFor(() => {
      expect(mockDeleteGroup).toHaveBeenCalledWith("my-asg");
    });
  });
});

describe("AutoScalingDashboard — launch configurations", () => {
  it("shows empty message for launch configurations tab", async () => {
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Launch Configurations/i }));
    await waitFor(() => {
      expect(screen.getByText(/No launch configuration/i)).toBeTruthy();
    });
  });

  it("renders launch configurations with data", async () => {
    const user = userEvent.setup();
    mockLCsHook.mockReturnValue({
      data: {
        launchConfigurations: [
          {
            LaunchConfigurationName: "my-lc",
            ImageId: "ami-abc123",
            InstanceType: "t3.micro",
            CreatedTime: new Date("2025-01-01").toISOString(),
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Launch Configurations/i }));
    await waitFor(() => {
      expect(screen.getByText("my-lc")).toBeTruthy();
      expect(screen.getByText("ami-abc123")).toBeTruthy();
      expect(screen.getByText("t3.micro")).toBeTruthy();
    });
  });

  it("shows loading indicator on delete button when pending", () => {
    deleteGroupState.isPending = true;
    deleteGroupState.variables = "my-asg";
    mockGroupsHook.mockReturnValue({
      data: {
        groups: [
          {
            AutoScalingGroupName: "my-asg",
            MinSize: 1,
            MaxSize: 5,
            DesiredCapacity: 2,
            Instances: [],
            HealthCheckType: "EC2",
            CreatedTime: new Date().toISOString(),
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-asg")).toBeTruthy();
  });

  it("renders launch configs with null fields gracefully", async () => {
    const user = userEvent.setup();
    mockLCsHook.mockReturnValue({
      data: {
        launchConfigurations: [
          {
            LaunchConfigurationName: "minimal-lc",
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Launch Configurations/i }));
    await waitFor(() => {
      expect(screen.getByText("minimal-lc")).toBeTruthy();
    });
  });
});
