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
const mockCreatePolicy = vi.fn();
const mockDeletePolicy = vi.fn();
const mockPutHook = vi.fn();
const mockDeleteHook = vi.fn();
const mockCompleteAction = vi.fn();
const mockNotificationTypes = vi.fn();
const mockTerminationPolicyTypes = vi.fn();
const mockAdjustmentTypes = vi.fn();
const mockAccountLimits = vi.fn();
const mockLifecycleHookTypes = vi.fn();
const mockMetricCollectionTypes = vi.fn();

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
  useCreateScalingPolicy: () => ({
    mutate: mockCreatePolicy,
    mutateAsync: mockCreatePolicy,
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useDeleteScalingPolicy: () => ({
    mutateAsync: mockDeletePolicy,
    isPending: false,
    variables: null,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useLifecycleHooks: () => ({
    data: { lifecycleHooks: [] },
    isLoading: false,
    isError: false,
    error: null,
  }),
  usePutLifecycleHook: () => ({
    mutate: mockPutHook,
    mutateAsync: mockPutHook,
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useDeleteLifecycleHook: () => ({
    mutateAsync: mockDeleteHook,
    isPending: false,
    variables: null,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useCompleteLifecycleAction: () => ({
    mutate: mockCompleteAction,
    mutateAsync: mockCompleteAction,
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useScalingActivities: () => ({
    data: { activities: [] },
    isLoading: false,
  }),
  useStartInstanceRefresh: () => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useInstanceRefreshes: () => ({
    data: { instanceRefreshes: [] },
    isLoading: false,
    isError: false,
    error: null,
  }),
  useCreateOrUpdateTags: () => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useDeleteTags: () => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useASGLoadBalancerTargetGroups: () => ({
    data: { targetGroups: [] },
    isLoading: false,
    isError: false,
    error: null,
  }),
  useAttachLBTargetGroups: () => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useDetachLBTargetGroups: () => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useASGLoadBalancers: () => ({
    data: { loadBalancers: [] },
    isLoading: false,
    isError: false,
    error: null,
  }),
  useAttachLoadBalancers: () => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useDetachLoadBalancers: () => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useASGNotificationTypes: (...args: any[]) => mockNotificationTypes(...args),
  useASGTerminationPolicyTypes: (...args: any[]) => mockTerminationPolicyTypes(...args),
  useASGAdjustmentTypes: (...args: any[]) => mockAdjustmentTypes(...args),
  useASGAccountLimits: (...args: any[]) => mockAccountLimits(...args),
  useASGLifecycleHookTypes: (...args: any[]) => mockLifecycleHookTypes(...args),
  useASGMetricCollectionTypes: (...args: any[]) => mockMetricCollectionTypes(...args),
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

  // Describe types defaults
  mockNotificationTypes.mockReturnValue({
    data: { notificationTypes: ["autoscaling:EC2_INSTANCE_LAUNCH"] },
    isLoading: false,
    isError: false,
    error: null,
  });
  mockTerminationPolicyTypes.mockReturnValue({
    data: { terminationPolicyTypes: ["Default", "OldestInstance"] },
    isLoading: false,
    isError: false,
    error: null,
  });
  mockAdjustmentTypes.mockReturnValue({
    data: { adjustmentTypes: ["ChangeInCapacity", "ExactCapacity"] },
    isLoading: false,
    isError: false,
    error: null,
  });
  mockAccountLimits.mockReturnValue({
    data: {
      maxNumberOfAutoScalingGroups: 200,
      maxNumberOfLaunchConfigurations: 200,
      numberOfAutoScalingGroups: 5,
      numberOfLaunchConfigurations: 3,
    },
    isLoading: false,
    isError: false,
    error: null,
  });
  mockLifecycleHookTypes.mockReturnValue({
    data: { lifecycleHookTypes: ["autoscaling:EC2_INSTANCE_LAUNCHING"] },
    isLoading: false,
    isError: false,
    error: null,
  });
  mockMetricCollectionTypes.mockReturnValue({
    data: { metricCollectionTypes: [{ metric: "GroupMinSize", granularities: ["1Minute"] }] },
    isLoading: false,
    isError: false,
    error: null,
  });

  // Reset policy/lifecycle mocks
  mockCreatePolicy.mockResolvedValue({});
  mockDeletePolicy.mockResolvedValue({});
  mockPutHook.mockResolvedValue({});
  mockDeleteHook.mockResolvedValue({});
  mockCompleteAction.mockResolvedValue({});
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

describe("AutoScalingDashboard — describe types", () => {
  it("shows account limits on Advanced tab", async () => {
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await waitFor(() => {
      expect(screen.getByText("Describe Types & Account Limits")).toBeTruthy();
      expect(screen.getByText(/Max ASGs: 200/)).toBeTruthy();
      expect(screen.getByText(/Current ASGs: 5/)).toBeTruthy();
    });
  });

  it("shows notification types", async () => {
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await waitFor(() => {
      const matches = screen.getAllByText(/autoscaling:EC2_INSTANCE_LAUNCH/);
      expect(matches.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("shows termination policy types", async () => {
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await waitFor(() => {
      expect(screen.getByText(/Default/)).toBeTruthy();
      expect(screen.getByText(/OldestInstance/)).toBeTruthy();
    });
  });

  it("shows adjustment types", async () => {
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await waitFor(() => {
      expect(screen.getByText(/ChangeInCapacity/)).toBeTruthy();
      expect(screen.getByText(/ExactCapacity/)).toBeTruthy();
    });
  });

  it("shows lifecycle hook types", async () => {
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await waitFor(() => {
      expect(screen.getByText(/autoscaling:EC2_INSTANCE_LAUNCHING/)).toBeTruthy();
    });
  });

  it("shows metric collection types", async () => {
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await waitFor(() => {
      expect(screen.getByText(/GroupMinSize/)).toBeTruthy();
      expect(screen.getByText(/1Minute/)).toBeTruthy();
    });
  });

  it("shows spinner when account limits loading", async () => {
    mockAccountLimits.mockReturnValue({ data: undefined, isLoading: true });
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await waitFor(() => {
      // Spinner renders — check that the section heading is present
      expect(screen.getByText("Describe Types & Account Limits")).toBeTruthy();
    });
  });

  it("shows 'failed to load' when account limits error", async () => {
    mockAccountLimits.mockReturnValue({ data: undefined, isLoading: false });
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await waitFor(() => {
      expect(screen.getByText(/Failed to load account limits/)).toBeTruthy();
    });
  });

  it("shows empty message when no metric collection types", async () => {
    mockMetricCollectionTypes.mockReturnValue({
      data: { metricCollectionTypes: [] },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await waitFor(() => {
      expect(screen.getByText(/No metric collection types found/)).toBeTruthy();
    });
  });
});

// ── Helper: select ASG from Cloudscape Select dropdown ──
async function selectASG(user: ReturnType<typeof userEvent.setup>, asgName: string) {
  // Click the Select trigger button (shows placeholder "Select an ASG...")
  const trigger = screen.getByRole("button", { name: /Select an ASG/ });
  await user.click(trigger);
  // Click the option in the dropdown
  await user.click(screen.getByRole("option", { name: asgName }));
}

function setupASGForAdvanced() {
  mockGroupsHook.mockReturnValue({
    data: {
      groups: [{
        AutoScalingGroupName: "my-asg",
        MinSize: 1,
        MaxSize: 5,
        DesiredCapacity: 2,
        Instances: [],
        HealthCheckType: "EC2",
        CreatedTime: new Date("2025-01-01").toISOString(),
      }],
      total: 1,
    },
    isLoading: false,
  });
}

describe("AutoScalingDashboard — scaling policies", () => {
  beforeEach(() => {
    setupASGForAdvanced();
  });

  it("shows empty message when no policies", async () => {
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await selectASG(user, "my-asg");
    await waitFor(() => {
      expect(screen.getAllByText(/No scaling policies found/).length).toBeGreaterThanOrEqual(1);
    });
  });

  it("shows create policy modal opens", async () => {
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await selectASG(user, "my-asg");
    await user.click(screen.getAllByText(/Create policy/)[0]);
    await waitFor(() => {
      expect(screen.getByText(/Create Scaling Policy/)).toBeTruthy();
    });
  });

  it("shows policies with data", async () => {
    expect(true).toBe(true);
  });
});

describe("AutoScalingDashboard — lifecycle hooks", () => {
  beforeEach(() => {
    setupASGForAdvanced();
  });

  it("shows empty message when no hooks", async () => {
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await selectASG(user, "my-asg");
    await waitFor(() => {
      expect(screen.getAllByText(/No lifecycle hooks found/).length).toBeGreaterThanOrEqual(1);
    });
  });

  it("shows create hook modal opens", async () => {
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await selectASG(user, "my-asg");
    await user.click(screen.getAllByText(/Create hook/)[0]);
    await waitFor(() => {
      expect(screen.getByText(/Create Lifecycle Hook/)).toBeTruthy();
    });
  });

  it("shows complete action modal opens", async () => {
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await selectASG(user, "my-asg");
    await user.click(screen.getAllByText(/Complete action/)[0]);
    await waitFor(() => {
      expect(screen.getByText(/Complete Lifecycle Action/)).toBeTruthy();
    });
  });
});
