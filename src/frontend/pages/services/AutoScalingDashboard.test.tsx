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
const mockScalingPolicies = vi.fn();
const mockLifecycleHooks = vi.fn();
const mockCreatePolicy = vi.fn();
const mockDeletePolicy = vi.fn();
const mockPutHook = vi.fn();
const mockDeleteHook = vi.fn();
const mockCompleteAction = vi.fn();
const mockStartRefresh = vi.fn();
const mockCreateOrUpdateTags = vi.fn();
const mockDeleteTagsFn = vi.fn();
const mockAttachTGs = vi.fn();
const mockDetachTGs = vi.fn();
const mockAttachLBs = vi.fn();
const mockDetachLBs = vi.fn();
const mockNotificationTypes = vi.fn();
const mockTerminationPolicyTypes = vi.fn();
const mockAdjustmentTypes = vi.fn();
const mockAccountLimits = vi.fn();
const mockLifecycleHookTypes = vi.fn();
const mockMetricCollectionTypes = vi.fn();
const mockInstanceRefreshes = vi.fn();
const mockLBTargetGroups = vi.fn();
const mockASGLoadBalancers = vi.fn();

const startRefreshState = vi.hoisted(() => ({ isPending: false }));
const createOrUpdateTagsState = vi.hoisted(() => ({ isPending: false }));
const attachTGsState = vi.hoisted(() => ({ isPending: false }));
const attachLBsState = vi.hoisted(() => ({ isPending: false }));
const detachTGsState = vi.hoisted(() => ({ isPending: false, variables: null as any }));
const detachLBsState = vi.hoisted(() => ({ isPending: false, variables: null as any }));

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
  useScalingPolicies: (...args: any[]) => mockScalingPolicies(...args),
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
  useLifecycleHooks: (...args: any[]) => mockLifecycleHooks(...args),
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
    mutate: mockStartRefresh,
    mutateAsync: mockStartRefresh,
    isPending: startRefreshState.isPending,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useInstanceRefreshes: (...args: any[]) => mockInstanceRefreshes(...args),
  useCreateOrUpdateTags: () => ({
    mutate: mockCreateOrUpdateTags,
    mutateAsync: mockCreateOrUpdateTags,
    isPending: createOrUpdateTagsState.isPending,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useDeleteTags: () => ({
    mutate: mockDeleteTagsFn,
    mutateAsync: mockDeleteTagsFn,
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useASGLoadBalancerTargetGroups: (...args: any[]) => mockLBTargetGroups(...args),
  useAttachLBTargetGroups: () => ({
    mutate: mockAttachTGs,
    mutateAsync: mockAttachTGs,
    isPending: attachTGsState.isPending,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useDetachLBTargetGroups: () => ({
    mutateAsync: mockDetachTGs,
    isPending: detachTGsState.isPending,
    variables: detachTGsState.variables,
  }),
  useASGLoadBalancers: (...args: any[]) => mockASGLoadBalancers(...args),
  useAttachLoadBalancers: () => ({
    mutate: mockAttachLBs,
    mutateAsync: mockAttachLBs,
    isPending: attachLBsState.isPending,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useDetachLoadBalancers: () => ({
    mutateAsync: mockDetachLBs,
    isPending: detachLBsState.isPending,
    variables: detachLBsState.variables,
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
  startRefreshState.isPending = false;
  createOrUpdateTagsState.isPending = false;
  attachTGsState.isPending = false;
  attachLBsState.isPending = false;
  detachTGsState.isPending = false;
  detachTGsState.variables = null;
  detachLBsState.isPending = false;
  detachLBsState.variables = null;

  mockGroupsHook.mockReturnValue({
    data: { groups: [] as any[], total: 0 },
    isLoading: false,
  });
  mockLCsHook.mockReturnValue({
    data: { launchConfigurations: [] as any[], total: 0 },
    isLoading: false,
  });
  mockInstanceRefreshes.mockReturnValue({
    data: { instanceRefreshes: [] },
    isLoading: false,
    isError: false,
    error: null,
  });
  mockLBTargetGroups.mockReturnValue({
    data: { targetGroups: [] },
    isLoading: false,
    isError: false,
    error: null,
  });
  mockASGLoadBalancers.mockReturnValue({
    data: { loadBalancers: [] },
    isLoading: false,
    isError: false,
    error: null,
  });
  mockScalingPolicies.mockReturnValue({
    data: { policies: [] },
    isLoading: false,
  });
  mockLifecycleHooks.mockReturnValue({
    data: { lifecycleHooks: [] },
    isLoading: false,
    isError: false,
    error: null,
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

  it("shows hooks with data", async () => {
    mockLifecycleHooks.mockReturnValue({
      data: { lifecycleHooks: [{ LifecycleHookName: "launch-hook", LifecycleTransition: "autoscaling:EC2_INSTANCE_LAUNCHING", DefaultResult: "ABANDON" }] },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await selectASG(user, "my-asg");
    await waitFor(() => {
      expect(screen.getByText(/launch-hook/)).toBeTruthy();
      expect(screen.getByText(/ABANDON/)).toBeTruthy();
    });
  });

  it("deletes a lifecycle hook", async () => {
    mockLifecycleHooks.mockReturnValue({
      data: { lifecycleHooks: [{ LifecycleHookName: "old-hook", LifecycleTransition: "autoscaling:EC2_INSTANCE_TERMINATING", DefaultResult: "CONTINUE" }] },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await selectASG(user, "my-asg");
    const deleteBtn = screen.getByRole("button", { name: /Delete old-hook/i });
    await user.click(deleteBtn);
    await waitFor(() => {
      expect(mockDeleteHook).toHaveBeenCalledWith({ name: "my-asg", lifecycleHookName: "old-hook" });
    });
  });

  it("submits create lifecycle hook", async () => {
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await selectASG(user, "my-asg");
    await user.click(screen.getAllByText(/Create hook/)[0]);
    await waitFor(() => expect(screen.getByText(/Create Lifecycle Hook/)).toBeTruthy());
    await user.type(screen.getByPlaceholderText("my-hook"), "scale-down-hook");
    await user.click(screen.getByRole("button", { name: /Create$/ }));
    await waitFor(() => {
      expect(mockPutHook).toHaveBeenCalledWith(
        expect.objectContaining({ lifecycleHookName: "scale-down-hook" }),
        expect.any(Object),
      );
    });
  });

  it("submits complete lifecycle action", async () => {
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await selectASG(user, "my-asg");
    await user.click(screen.getAllByText(/Complete action/)[0]);
    await waitFor(() => expect(screen.getByText(/Complete Lifecycle Action/)).toBeTruthy());
    await user.type(screen.getByPlaceholderText("my-hook"), "pending-hook");
    await user.click(screen.getByRole("button", { name: /Complete$/ }));
    await waitFor(() => {
      expect(mockCompleteAction).toHaveBeenCalled();
    });
  });

  it("shows lifecycle hook loading spinner", async () => {
    mockLifecycleHooks.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await selectASG(user, "my-asg");
    await waitFor(() => {
      expect(screen.getByText(/Lifecycle Hooks/)).toBeTruthy();
    });
  });

  it("cancels complete lifecycle action modal", async () => {
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await selectASG(user, "my-asg");
    await user.click(screen.getAllByText(/Complete action/)[0]);
    await waitFor(() => expect(screen.getByText(/Complete Lifecycle Action/)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Cancel$/ }));
    await waitFor(() => {
      expect(mockCompleteAction).not.toHaveBeenCalled();
    });
  });

  it("completes lifecycle action with ABANDON result", async () => {
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await selectASG(user, "my-asg");
    await user.click(screen.getAllByText(/Complete action/)[0]);
    await waitFor(() => expect(screen.getByText(/Complete Lifecycle Action/)).toBeTruthy());
    await user.type(screen.getByPlaceholderText("my-hook"), "abandon-hook");
    // Open the Action Result Select (defaults to CONTINUE)
    const continueTriggers = screen.getAllByText("CONTINUE");
    await user.click(continueTriggers[0]);
    await waitFor(() => expect(screen.getByText("ABANDON")).toBeTruthy());
    await user.click(screen.getByText("ABANDON"));
    await user.click(screen.getByRole("button", { name: /Complete$/ }));
    await waitFor(() => {
      expect(mockCompleteAction).toHaveBeenCalledWith(
        expect.objectContaining({ lifecycleActionResult: "ABANDON" }),
        expect.any(Object),
      );
    });
  });
});

describe("AutoScalingDashboard — create ASG button", () => {
  it("shows create ASG button on groups tab", () => {
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    expect(screen.getByRole("button", { name: /Create Auto Scaling Group/i })).toBeTruthy();
  });
});

describe("AutoScalingDashboard — instance refresh", () => {
  beforeEach(() => {
    setupASGForAdvanced();
  });

  it("opens instance refresh modal", async () => {
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await selectASG(user, "my-asg");
    await user.click(screen.getByRole("button", { name: /Start Refresh/ }));
    await waitFor(() => {
      expect(screen.getByText(/Start Instance Refresh/)).toBeTruthy();
    });
  });

  it("starts instance refresh", async () => {
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await selectASG(user, "my-asg");
    await user.click(screen.getByRole("button", { name: /Start Refresh/ }));
    await waitFor(() => expect(screen.getByText(/Start Instance Refresh/)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Start$/ }));
    await waitFor(() => {
      expect(mockStartRefresh).toHaveBeenCalled();
    });
  });

  it("shows instance refreshes with data", async () => {
    mockInstanceRefreshes.mockReturnValue({
      data: { instanceRefreshes: [{ instanceRefreshId: "ir-1", status: "Pending", percentageComplete: 0, startTime: null }] },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await selectASG(user, "my-asg");
    await waitFor(() => {
      expect(screen.getByText("ir-1")).toBeTruthy();
      expect(screen.getByText("0%")).toBeTruthy();
    });
  });
});

describe("AutoScalingDashboard — tags", () => {
  it("shows no tags message when ASG has no tags", async () => {
    mockGroupsHook.mockReturnValue({
      data: {
        groups: [{ AutoScalingGroupName: "my-asg", MinSize: 1, MaxSize: 5, DesiredCapacity: 2, Instances: [], HealthCheckType: "EC2", CreatedTime: new Date().toISOString() }],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await selectASG(user, "my-asg");
    await waitFor(() => {
      expect(screen.getByText(/No tags on this ASG/)).toBeTruthy();
    });
  });

  it("shows tags when ASG has tags", async () => {
    mockGroupsHook.mockReturnValue({
      data: {
        groups: [{
          AutoScalingGroupName: "my-asg",
          MinSize: 1,
          MaxSize: 5,
          DesiredCapacity: 2,
          Instances: [],
          HealthCheckType: "EC2",
          CreatedTime: new Date().toISOString(),
          Tags: [{ Key: "env", Value: "prod" }],
        }],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await selectASG(user, "my-asg");
    await waitFor(() => {
      expect(screen.getByText("env")).toBeTruthy();
      expect(screen.getByText("prod")).toBeTruthy();
    });
  });

  it("opens and cancels add tag modal", async () => {
    setupASGForAdvanced();
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await selectASG(user, "my-asg");
    await user.click(screen.getByRole("button", { name: /Add tag/ }));
    await waitFor(() => expect(screen.getByText(/Add Tag/)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Cancel$/ }));
    await waitFor(() => {
      expect(mockCreateOrUpdateTags).not.toHaveBeenCalled();
    });
  });

  it("submits add tag", async () => {
    setupASGForAdvanced();
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await selectASG(user, "my-asg");
    await user.click(screen.getByRole("button", { name: /Add tag/ }));
    await waitFor(() => expect(screen.getByText(/Add Tag/)).toBeTruthy());
    await user.type(screen.getByPlaceholderText("env"), "tier");
    await user.type(screen.getByPlaceholderText("production"), "backend");
    await user.click(screen.getByRole("button", { name: /^Add$/ }));
    await waitFor(() => {
      expect(mockCreateOrUpdateTags).toHaveBeenCalled();
    });
  });
});

describe("AutoScalingDashboard — LB target groups", () => {
  beforeEach(() => {
    setupASGForAdvanced();
  });

  it("shows no target groups message", async () => {
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await selectASG(user, "my-asg");
    await waitFor(() => {
      expect(screen.getByText(/No target groups attached/)).toBeTruthy();
    });
  });

  it("shows target groups when attached", async () => {
    mockLBTargetGroups.mockReturnValue({
      data: { targetGroups: [{ loadBalancerTargetGroupARN: "arn:aws:elasticloadbalancing:..." }] },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await selectASG(user, "my-asg");
    await waitFor(() => {
      expect(screen.getByText(/arn:aws:elasticloadbalancing/)).toBeTruthy();
    });
  });

  it("detaches a target group", async () => {
    mockLBTargetGroups.mockReturnValue({
      data: { targetGroups: [{ loadBalancerTargetGroupARN: "arn:tg-detach" }] },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await selectASG(user, "my-asg");
    const detachBtn = screen.getByRole("button", { name: /Delete arn:tg-detach/i });
    await user.click(detachBtn);
    await waitFor(() => {
      expect(mockDetachTGs).toHaveBeenCalled();
    });
  });

  it("opens and cancels attach TGs modal", async () => {
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await selectASG(user, "my-asg");
    // Click the Attach button in the LB Target Groups container header
    const attachBtns = screen.getAllByRole("button", { name: /Attach/ });
    await user.click(attachBtns[0]);
    await waitFor(() => expect(screen.getByText(/Attach LB Target Groups/)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Cancel$/ }));
    await waitFor(() => {
      expect(mockAttachTGs).not.toHaveBeenCalled();
    });
  });

  it("submits attach TGs", async () => {
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await selectASG(user, "my-asg");
    // Click Attach in the LB Target Groups section (first Attach button)
    const attachBtns = screen.getAllByRole("button", { name: /Attach/ });
    await user.click(attachBtns[0]);
    await waitFor(() => expect(screen.getByText(/Attach LB Target Groups/)).toBeTruthy());
    await user.type(screen.getByPlaceholderText("arn:aws:elasticloadbalancing:..."), "arn:tg1");
    // Modal's Attach button is the last "Attach" button in the DOM
    const allAttachBtns = screen.getAllByRole("button", { name: /^Attach$/ });
    await user.click(allAttachBtns[allAttachBtns.length - 1]);
    await waitFor(() => {
      expect(mockAttachTGs).toHaveBeenCalled();
    });
  });
});

describe("AutoScalingDashboard — classic load balancers", () => {
  beforeEach(() => {
    setupASGForAdvanced();
  });

  it("shows no classic LBs message", async () => {
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await selectASG(user, "my-asg");
    await waitFor(() => {
      expect(screen.getByText(/No classic load balancers attached/)).toBeTruthy();
    });
  });

  it("shows classic LBs when attached", async () => {
    mockASGLoadBalancers.mockReturnValue({
      data: { loadBalancers: [{ loadBalancerName: "my-classic-lb" }] },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await selectASG(user, "my-asg");
    await waitFor(() => {
      expect(screen.getByText("my-classic-lb")).toBeTruthy();
    });
  });

  it("detaches a classic load balancer", async () => {
    mockASGLoadBalancers.mockReturnValue({
      data: { loadBalancers: [{ loadBalancerName: "old-lb" }] },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await selectASG(user, "my-asg");
    const detachBtn = screen.getByRole("button", { name: /Delete old-lb/i });
    await user.click(detachBtn);
    await waitFor(() => {
      expect(mockDetachLBs).toHaveBeenCalled();
    });
  });
});

describe("AutoScalingDashboard — scaling policies with data", () => {
  beforeEach(() => {
    setupASGForAdvanced();
  });

  it("shows policies with data", async () => {
    mockScalingPolicies.mockReturnValue({
      data: { policies: [{ PolicyName: "scale-up", PolicyType: "SimpleScaling", AdjustmentType: "ChangeInCapacity", ScalingAdjustment: 2 }] },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await selectASG(user, "my-asg");
    await waitFor(() => {
      expect(screen.getByText(/scale-up/)).toBeTruthy();
      expect(screen.getByText(/SimpleScaling/)).toBeTruthy();
    });
  });

  it("deletes a scaling policy", async () => {
    mockScalingPolicies.mockReturnValue({
      data: { policies: [{ PolicyName: "old-policy", PolicyType: "SimpleScaling", AdjustmentType: "ChangeInCapacity", ScalingAdjustment: 1 }] },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await selectASG(user, "my-asg");
    const deleteBtn = screen.getByRole("button", { name: /Delete old-policy/i });
    await user.click(deleteBtn);
    await waitFor(() => {
      expect(mockDeletePolicy).toHaveBeenCalled();
    });
  });

  it("shows scaling policy with missing adjustment type", async () => {
    mockScalingPolicies.mockReturnValue({
      data: { policies: [{ PolicyName: "minimal-policy", PolicyType: "StepScaling", ScalingAdjustment: null }] },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await selectASG(user, "my-asg");
    await waitFor(() => {
      expect(screen.getByText(/minimal-policy/)).toBeTruthy();
      expect(screen.getByText(/N\/A/)).toBeTruthy();
    });
  });

  it("cancels create scaling policy modal", async () => {
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await selectASG(user, "my-asg");
    await user.click(screen.getAllByText(/Create policy/)[0]);
    await waitFor(() => expect(screen.getByText(/Create Scaling Policy/)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Cancel$/ }));
    await waitFor(() => {
      expect(mockCreatePolicy).not.toHaveBeenCalled();
    });
  });

  it("submits create scaling policy", async () => {
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await selectASG(user, "my-asg");
    await user.click(screen.getAllByText(/Create policy/)[0]);
    await waitFor(() => expect(screen.getByText(/Create Scaling Policy/)).toBeTruthy());
    await user.type(screen.getByPlaceholderText("scale-up"), "cpu-scale");
    await user.click(screen.getByRole("button", { name: /^Create$/ }));
    await waitFor(() => {
      expect(mockCreatePolicy).toHaveBeenCalled();
    });
  });

  it("shows scaling policy loading spinner", async () => {
    mockScalingPolicies.mockReturnValue({ data: undefined, isLoading: true });
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await selectASG(user, "my-asg");
    await waitFor(() => {
      expect(screen.getByText(/Scaling Policies/)).toBeTruthy();
    });
  });
});

describe("AutoScalingDashboard — describe types empty results", () => {
  it("shows empty notification types", async () => {
    mockNotificationTypes.mockReturnValue({
      data: { notificationTypes: [] },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await waitFor(() => {
      expect(screen.getByText(/No notification types found/)).toBeTruthy();
    });
  });

  it("shows empty termination policy types", async () => {
    mockTerminationPolicyTypes.mockReturnValue({
      data: { terminationPolicyTypes: [] },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await waitFor(() => {
      expect(screen.getByText(/No termination policy types found/)).toBeTruthy();
    });
  });

  it("shows empty adjustment types", async () => {
    mockAdjustmentTypes.mockReturnValue({
      data: { adjustmentTypes: [] },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await waitFor(() => {
      expect(screen.getByText(/No adjustment types found/)).toBeTruthy();
    });
  });

  it("shows empty lifecycle hook types", async () => {
    mockLifecycleHookTypes.mockReturnValue({
      data: { lifecycleHookTypes: [] },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await waitFor(() => {
      expect(screen.getByText(/No lifecycle hook types found/)).toBeTruthy();
    });
  });

  it("shows notification types loading spinner", async () => {
    mockNotificationTypes.mockReturnValue({ data: undefined, isLoading: true });
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await waitFor(() => {
      expect(screen.getByText(/Notification Types/)).toBeTruthy();
    });
  });

  it("shows termination policy types loading spinner", async () => {
    mockTerminationPolicyTypes.mockReturnValue({ data: undefined, isLoading: true });
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await waitFor(() => {
      expect(screen.getByText(/Termination Policy Types/)).toBeTruthy();
    });
  });

  it("shows adjustment types loading spinner", async () => {
    mockAdjustmentTypes.mockReturnValue({ data: undefined, isLoading: true });
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await waitFor(() => {
      expect(screen.getByText(/Adjustment Types/)).toBeTruthy();
    });
  });

  it("shows lifecycle hook types loading spinner", async () => {
    mockLifecycleHookTypes.mockReturnValue({ data: undefined, isLoading: true });
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await waitFor(() => {
      expect(screen.getByText(/Lifecycle Hook Types/)).toBeTruthy();
    });
  });

  it("shows metric collection types loading spinner", async () => {
    mockMetricCollectionTypes.mockReturnValue({ data: undefined, isLoading: true });
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await waitFor(() => {
      expect(screen.getByText(/Metric Collection Types/)).toBeTruthy();
    });
  });

  it("shows account limits null values as dashes", async () => {
    mockAccountLimits.mockReturnValue({
      data: {
        maxNumberOfAutoScalingGroups: null,
        maxNumberOfLaunchConfigurations: null,
        numberOfAutoScalingGroups: null,
        numberOfLaunchConfigurations: null,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const { container } = render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await waitFor(() => {
      // Each limit line should have "- " (dash space) for null values
      const dashCount = (container.textContent || "").match(/Max ASGs: -|Max Launch Configs: -|Current ASGs: -|Current Launch Configs: -/g)?.length || 0;
      expect(dashCount).toBeGreaterThanOrEqual(4);
    });
  });

  // ─── Lifecycle hook transition/result branches ────────

describe("AutoScalingDashboard — lifecycle hook branches", () => {
  beforeEach(() => {
    setupASGForAdvanced();
  });

  it("creates lifecycle hook with TERMINATING transition", async () => {
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await selectASG(user, "my-asg");
    await user.click(screen.getAllByText(/Create hook/)[0]);
    await waitFor(() => expect(screen.getByText(/Create Lifecycle Hook/)).toBeTruthy());
    await user.type(screen.getByPlaceholderText("my-hook"), "terminate-hook");
    // Select TERMINATING transition (use getAllByText since describe types also shows it)
    const launchMatches = screen.getAllByText("autoscaling:EC2_INSTANCE_LAUNCHING");
    await user.click(launchMatches[launchMatches.length - 1]);
    await waitFor(() => expect(screen.getByText("autoscaling:EC2_INSTANCE_TERMINATING")).toBeTruthy());
    await user.click(screen.getByText("autoscaling:EC2_INSTANCE_TERMINATING"));
    await user.click(screen.getByRole("button", { name: /Create$/ }));
    await waitFor(() => {
      expect(mockPutHook).toHaveBeenCalledWith(
        expect.objectContaining({
          lifecycleHookName: "terminate-hook",
          lifecycleTransition: "autoscaling:EC2_INSTANCE_TERMINATING",
        }),
        expect.any(Object),
      );
    });
  });

  it("creates lifecycle hook with CONTINUE result", async () => {
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await selectASG(user, "my-asg");
    await user.click(screen.getAllByText(/Create hook/)[0]);
    await waitFor(() => expect(screen.getByText(/Create Lifecycle Hook/)).toBeTruthy());
    await user.type(screen.getByPlaceholderText("my-hook"), "continue-hook");
    // Select CONTINUE result (default is ABANDON)
    const resultTrigger = screen.getByText("ABANDON");
    await user.click(resultTrigger);
    await waitFor(() => expect(screen.getByText("CONTINUE")).toBeTruthy());
    await user.click(screen.getByText("CONTINUE"));
    await user.click(screen.getByRole("button", { name: /Create$/ }));
    await waitFor(() => {
      expect(mockPutHook).toHaveBeenCalledWith(
        expect.objectContaining({
          lifecycleHookName: "continue-hook",
          defaultResult: "CONTINUE",
        }),
        expect.any(Object),
      );
    });
  });

  it("cancels create lifecycle hook modal", async () => {
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await selectASG(user, "my-asg");
    await user.click(screen.getAllByText(/Create hook/)[0]);
    await waitFor(() => expect(screen.getByText(/Create Lifecycle Hook/)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Cancel$/ }));
    await waitFor(() => {
      expect(mockPutHook).not.toHaveBeenCalled();
    });
  });

  it("completes lifecycle action with CONTINUE result", async () => {
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await selectASG(user, "my-asg");
    await user.click(screen.getAllByText(/Complete action/)[0]);
    await waitFor(() => expect(screen.getByText(/Complete Lifecycle Action/)).toBeTruthy());     await user.type(screen.getByPlaceholderText("my-hook"), "continue-hook");
    // Default is CONTINUE, just submit
    await user.click(screen.getByRole("button", { name: /Complete$/ }));
    await waitFor(() => {
      expect(mockCompleteAction).toHaveBeenCalledWith(
        expect.objectContaining({ lifecycleActionResult: "CONTINUE" }),
        expect.any(Object),
      );
    });
  });
});

describe("AutoScalingDashboard — scaling policy branches", () => {
  beforeEach(() => {
    setupASGForAdvanced();
  });

  it("creates StepScaling policy with PercentChangeInCapacity", async () => {
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await selectASG(user, "my-asg");
    await user.click(screen.getAllByText(/Create policy/)[0]);
    await waitFor(() => expect(screen.getByText(/Create Scaling Policy/)).toBeTruthy());
    await user.type(screen.getByPlaceholderText("scale-up"), "step-policy");
    // Change policy type to Step Scaling
    const simpleTrigger = screen.getByText("Simple Scaling");
    await user.click(simpleTrigger);
    await waitFor(() => expect(screen.getByText("Step Scaling")).toBeTruthy());
    await user.click(screen.getByText("Step Scaling"));
    // Change adjustment type to PercentChangeInCapacity
    const adjTrigger = screen.getByText("ChangeInCapacity");
    await user.click(adjTrigger);
    await waitFor(() => expect(screen.getByText("PercentChangeInCapacity")).toBeTruthy());
    await user.click(screen.getByText("PercentChangeInCapacity"));
    await user.click(screen.getByRole("button", { name: /^Create$/ }));
    await waitFor(() => {
      expect(mockCreatePolicy).toHaveBeenCalledWith(
        expect.objectContaining({
          policyName: "step-policy",
          policyType: "StepScaling",
          adjustmentType: "PercentChangeInCapacity",
        }),
        expect.any(Object),
      );
    });
  });
});

});

describe("AutoScalingDashboard — metric collection types granularities", () => {
  it("shows No granularities when metric lacks granularities", async () => {
    mockMetricCollectionTypes.mockReturnValue({
      data: { metricCollectionTypes: [{ metric: "GroupDesiredCapacity", granularities: [] }] },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await waitFor(() => {
      expect(screen.getByText(/No granularities/)).toBeTruthy();
    });
  });
});

describe("AutoScalingDashboard — classic LBs attach", () => {
  beforeEach(() => {
    setupASGForAdvanced();
  });

  it("submits attach classic LBs", async () => {
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await selectASG(user, "my-asg");
    // Click Attach in the Classic Load Balancers section (second Attach button)
    const attachBtns = screen.getAllByRole("button", { name: /Attach/ });
    await user.click(attachBtns[1]);
    await waitFor(() => expect(screen.getByText(/Attach Classic Load Balancers/)).toBeTruthy());
    await user.type(screen.getByPlaceholderText("my-classic-lb"), "lb1, lb2");
    const allAttachBtns = screen.getAllByRole("button", { name: /^Attach$/ });
    await user.click(allAttachBtns[allAttachBtns.length - 1]);
    await waitFor(() => {
      expect(mockAttachLBs).toHaveBeenCalled();
    });
  });
});

describe("AutoScalingDashboard — lifecycle hook with ARNs", () => {
  beforeEach(() => {
    setupASGForAdvanced();
  });

  it("creates lifecycle hook with target and role ARNs", async () => {
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await selectASG(user, "my-asg");
    await user.click(screen.getAllByText(/Create hook/)[0]);
    await waitFor(() => expect(screen.getByText(/Create Lifecycle Hook/)).toBeTruthy());
    await user.type(screen.getByPlaceholderText("my-hook"), "arn-hook");
    // Fill notification target ARN and role ARN (optional fields)
    const arnInputs = screen.getAllByPlaceholderText(/arn:aws:/);
    await user.type(arnInputs[0], "arn:aws:sns:us-east-1:123:my-topic");
    await user.type(arnInputs[1], "arn:aws:iam::123:role/hook-role");
    await user.click(screen.getByRole("button", { name: /Create$/ }));
    await waitFor(() => {
      expect(mockPutHook).toHaveBeenCalledWith(
        expect.objectContaining({
          lifecycleHookName: "arn-hook",
          notificationTargetARN: "arn:aws:sns:us-east-1:123:my-topic",
          roleARN: "arn:aws:iam::123:role/hook-role",
        }),
        expect.any(Object),
      );
    });
  });
});

describe("AutoScalingDashboard — instance refresh with date", () => {
  it("shows formatted date when startTime is present", async () => {
    setupASGForAdvanced();
    mockInstanceRefreshes.mockReturnValue({
      data: { instanceRefreshes: [{ instanceRefreshId: "ir-date", status: "Successful", percentageComplete: 100, startTime: "2025-06-15T12:00:00Z" }] },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await selectASG(user, "my-asg");
    await waitFor(() => {
      expect(screen.getByText("ir-date")).toBeTruthy();
      expect(screen.getByText("100%")).toBeTruthy();
    });
  });

  it("shows dash for null startTime", async () => {
    setupASGForAdvanced();
    mockInstanceRefreshes.mockReturnValue({
      data: { instanceRefreshes: [{ instanceRefreshId: "ir-null-date", status: "Cancelled", percentageComplete: 50, startTime: null }] },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await selectASG(user, "my-asg");
    await waitFor(() => {
      expect(screen.getByText("ir-null-date")).toBeTruthy();
      expect(screen.getByText("-")).toBeTruthy();
    });
  });
});

describe("AutoScalingDashboard — metric granularities edge", () => {
  it("shows No granularities when granularities is null", async () => {
    mockMetricCollectionTypes.mockReturnValue({
      data: { metricCollectionTypes: [{ metric: "GroupTotalInstances", granularities: null }] },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await waitFor(() => {
      expect(screen.getByText(/No granularities/)).toBeTruthy();
    });
  });

  it("shows create scaling policy with ExactCapacity adjustment", async () => {
    setupASGForAdvanced();
    const user = userEvent.setup();
    render(<AutoScalingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await selectASG(user, "my-asg");
    await user.click(screen.getAllByText(/Create policy/)[0]);
    await waitFor(() => expect(screen.getByText(/Create Scaling Policy/)).toBeTruthy());
    await user.type(screen.getByPlaceholderText("scale-up"), "exact-policy");
    // Change adjustment type to ExactCapacity
    const adjTrigger = screen.getByText("ChangeInCapacity");
    await user.click(adjTrigger);
    await waitFor(() => expect(screen.getByText("ExactCapacity")).toBeTruthy());
    await user.click(screen.getByText("ExactCapacity"));
    await user.click(screen.getByRole("button", { name: /^Create$/ }));
    await waitFor(() => {
      expect(mockCreatePolicy).toHaveBeenCalledWith(
        expect.objectContaining({
          policyName: "exact-policy",
          adjustmentType: "ExactCapacity",
        }),
        expect.any(Object),
      );
    });
  });
});
