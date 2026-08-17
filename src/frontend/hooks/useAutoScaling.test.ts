// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createWrapper } from "../../test/helpers";

const mockApi = vi.hoisted(() => vi.fn());

vi.mock("../lib/client", () => ({
  api: (...args: any[]) => mockApi(...args),
}));

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: vi.fn(),
    }),
  };
});

import {
  useAutoScalingGroups,
  useCreateAutoScalingGroup,
  useUpdateAutoScalingGroup,
  useDeleteAutoScalingGroup,
  useSetDesiredCapacity,
  useLaunchConfigurations,
  useCreateLaunchConfiguration,
  useDeleteLaunchConfiguration,
  useASGInstances,
  useAttachInstances,
  useDetachInstances,
  useTerminateASGInstance,
  useScalingPolicies,
  useScalingActivities,
  useStartInstanceRefresh,
  useInstanceRefreshes,
  useCreateOrUpdateTags,
  useDeleteTags,
  useASGLoadBalancerTargetGroups,
  useAttachLBTargetGroups,
  useDetachLBTargetGroups,
  useASGLoadBalancers,
  useAttachLoadBalancers,
  useDetachLoadBalancers,
  useASGNotificationTypes,
  useASGTerminationPolicyTypes,
  useASGAdjustmentTypes,
  useASGAccountLimits,
  useASGLifecycleHookTypes,
  useASGMetricCollectionTypes,
  useCreateScalingPolicy,
  useDeleteScalingPolicy,
  useLifecycleHooks,
  usePutLifecycleHook,
  useDeleteLifecycleHook,
  useCompleteLifecycleAction,
} from "./useAutoScaling";

beforeEach(() => {
  mockApi.mockReset();
});

describe("useAutoScaling hooks", () => {
  describe("useAutoScalingGroups", () => {
    it("calls correct URL", async () => {
      mockApi.mockResolvedValueOnce({ groups: [], total: 0 });
      const { result } = renderHook(() => useAutoScalingGroups(), {
        wrapper: createWrapper(),
      });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi).toHaveBeenCalledWith("/aws/autoscaling/groups");
    });
  });

  describe("useCreateAutoScalingGroup", () => {
    it("calls POST with correct params", async () => {
      mockApi.mockResolvedValueOnce({ created: true });
      const { result } = renderHook(() => useCreateAutoScalingGroup(), {
        wrapper: createWrapper(),
      });
      await result.current.mutateAsync({
        autoScalingGroupName: "asg-1",
        minSize: 1,
        maxSize: 5,
      });
      expect(mockApi).toHaveBeenCalledWith("/aws/autoscaling/groups", {
        method: "POST",
        body: JSON.stringify({ autoScalingGroupName: "asg-1", minSize: 1, maxSize: 5 }),
      });
    });
  });

  describe("useUpdateAutoScalingGroup", () => {
    it("calls PUT with correct URL", async () => {
      mockApi.mockResolvedValueOnce({ updated: true });
      const { result } = renderHook(() => useUpdateAutoScalingGroup(), {
        wrapper: createWrapper(),
      });
      await result.current.mutateAsync({ name: "asg-1", maxSize: 10 });
      expect(mockApi).toHaveBeenCalledWith("/aws/autoscaling/groups/asg-1", {
        method: "PUT",
        body: JSON.stringify({ name: "asg-1", maxSize: 10 }),
      });
    });
  });

  describe("useDeleteAutoScalingGroup", () => {
    it("calls DELETE with correct URL", async () => {
      mockApi.mockResolvedValueOnce({ deleted: true });
      const { result } = renderHook(() => useDeleteAutoScalingGroup(), {
        wrapper: createWrapper(),
      });
      await result.current.mutateAsync("asg-1");
      expect(mockApi).toHaveBeenCalledWith(
        "/aws/autoscaling/groups/asg-1?force=true",
        { method: "DELETE" }
      );
    });
  });

  describe("useSetDesiredCapacity", () => {
    it("calls PUT with correct URL and body", async () => {
      mockApi.mockResolvedValueOnce({ updated: true });
      const { result } = renderHook(() => useSetDesiredCapacity(), {
        wrapper: createWrapper(),
      });
      await result.current.mutateAsync({ name: "asg-1", desiredCapacity: 3 });
      expect(mockApi).toHaveBeenCalledWith("/aws/autoscaling/groups/asg-1/desired-capacity", {
        method: "PUT",
        body: JSON.stringify({ desiredCapacity: 3 }),
      });
    });
  });

  describe("useLaunchConfigurations", () => {
    it("calls correct URL", async () => {
      mockApi.mockResolvedValueOnce({ launchConfigurations: [], total: 0 });
      const { result } = renderHook(() => useLaunchConfigurations(), {
        wrapper: createWrapper(),
      });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi).toHaveBeenCalledWith("/aws/autoscaling/launch-configurations");
    });
  });

  describe("useCreateLaunchConfiguration", () => {
    it("calls api with POST body", async () => {
      mockApi.mockResolvedValueOnce({});
      const { result } = renderHook(() => useCreateLaunchConfiguration(), {
        wrapper: createWrapper(),
      });
      await result.current.mutateAsync({ LaunchConfigurationName: "lc-1", ImageId: "ami-1" });
      expect(mockApi).toHaveBeenCalledWith(
        "/aws/autoscaling/launch-configurations",
        expect.objectContaining({ method: "POST" })
      );
      expect(JSON.parse(mockApi.mock.calls[0][1].body)).toEqual({
        LaunchConfigurationName: "lc-1",
        ImageId: "ami-1",
      });
    });
  });

  describe("useDeleteLaunchConfiguration", () => {
    it("calls api with DELETE and encoded name", async () => {
      mockApi.mockResolvedValueOnce({});
      const { result } = renderHook(() => useDeleteLaunchConfiguration(), {
        wrapper: createWrapper(),
      });
      await result.current.mutateAsync("lc/1");
      expect(mockApi).toHaveBeenCalledWith(
        "/aws/autoscaling/launch-configurations/lc%2F1",
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });

  describe("useASGInstances", () => {
    it("does NOT call api when groupName is null", () => {
      renderHook(() => useASGInstances(null), { wrapper: createWrapper() });
      expect(mockApi).not.toHaveBeenCalled();
    });

    it("calls api with encoded group name", async () => {
      mockApi.mockResolvedValueOnce({ instances: [], total: 0 });
      const { result } = renderHook(() => useASGInstances("my asg"), {
        wrapper: createWrapper(),
      });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi).toHaveBeenCalledWith("/aws/autoscaling/groups/my%20asg/instances");
    });
  });

  describe("useAttachInstances", () => {
    it("calls api with POST and instance ids", async () => {
      mockApi.mockResolvedValueOnce({});
      const { result } = renderHook(() => useAttachInstances(), {
        wrapper: createWrapper(),
      });
      await result.current.mutateAsync({ name: "asg-1", InstanceIds: ["i-1"] });
      expect(mockApi).toHaveBeenCalledWith(
        "/aws/autoscaling/groups/asg-1/instances/attach",
        expect.objectContaining({ method: "POST" })
      );
      expect(JSON.parse(mockApi.mock.calls[0][1].body)).toEqual({ InstanceIds: ["i-1"] });
    });
  });

  describe("useDetachInstances", () => {
    it("calls api with POST and capacity flag", async () => {
      mockApi.mockResolvedValueOnce({});
      const { result } = renderHook(() => useDetachInstances(), {
        wrapper: createWrapper(),
      });
      await result.current.mutateAsync({
        name: "asg-1",
        InstanceIds: ["i-1"],
        ShouldDecrementDesiredCapacity: true,
      });
      expect(mockApi).toHaveBeenCalledWith(
        "/aws/autoscaling/groups/asg-1/instances/detach",
        expect.objectContaining({ method: "POST" })
      );
      expect(JSON.parse(mockApi.mock.calls[0][1].body)).toEqual({
        InstanceIds: ["i-1"],
        ShouldDecrementDesiredCapacity: true,
      });
    });
  });

  describe("useTerminateASGInstance", () => {
    it("calls api with POST and instance id", async () => {
      mockApi.mockResolvedValueOnce({});
      const { result } = renderHook(() => useTerminateASGInstance(), {
        wrapper: createWrapper(),
      });
      await result.current.mutateAsync({ InstanceId: "i-1", ShouldDecrementDesiredCapacity: false });
      expect(mockApi).toHaveBeenCalledWith(
        "/aws/autoscaling/instances/terminate",
        expect.objectContaining({ method: "POST" })
      );
      expect(JSON.parse(mockApi.mock.calls[0][1].body)).toEqual({
        InstanceId: "i-1",
        ShouldDecrementDesiredCapacity: false,
      });
    });
  });

  describe("useScalingPolicies", () => {
    it("calls correct URL when groupName provided", async () => {
      mockApi.mockResolvedValueOnce({ policies: [], total: 0 });
      const { result } = renderHook(() => useScalingPolicies("asg-1"), {
        wrapper: createWrapper(),
      });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi).toHaveBeenCalledWith("/aws/autoscaling/groups/asg-1/policies");
    });

    it("disabled when groupName is null", () => {
      const { result } = renderHook(() => useScalingPolicies(null), {
        wrapper: createWrapper(),
      });
      expect(result.current.fetchStatus).toBe("idle");
      expect(mockApi).not.toHaveBeenCalled();
    });
  });

  describe("useScalingActivities", () => {
    it("calls correct URL when groupName provided", async () => {
      mockApi.mockResolvedValueOnce({ activities: [], total: 0 });
      const { result } = renderHook(() => useScalingActivities("asg-1"), {
        wrapper: createWrapper(),
      });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi).toHaveBeenCalledWith("/aws/autoscaling/groups/asg-1/activities");
    });

    it("disabled when groupName is null", () => {
      const { result } = renderHook(() => useScalingActivities(null), {
        wrapper: createWrapper(),
      });
      expect(result.current.fetchStatus).toBe("idle");
      expect(mockApi).not.toHaveBeenCalled();
    });
  });

  describe("useStartInstanceRefresh", () => {
    it("calls api with POST method", async () => {
      mockApi.mockResolvedValueOnce({});
      const { result } = renderHook(() => useStartInstanceRefresh(), { wrapper: createWrapper() });
      await result.current.mutateAsync({ name: "asg-1", minHealthyPercentage: 90 });
      expect(mockApi).toHaveBeenCalledWith(
        "/aws/autoscaling/groups/asg-1/instance-refresh",
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  describe("useInstanceRefreshes", () => {
    it("does NOT call api when null", () => {
      renderHook(() => useInstanceRefreshes(null), { wrapper: createWrapper() });
      expect(mockApi).not.toHaveBeenCalled();
    });

    it("calls api when provided", async () => {
      mockApi.mockResolvedValueOnce({ instanceRefreshes: [], total: 0 });
      const { result } = renderHook(() => useInstanceRefreshes("asg-1"), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi).toHaveBeenCalledWith("/aws/autoscaling/groups/asg-1/instance-refreshes");
    });
  });

  describe("useCreateOrUpdateTags", () => {
    it("calls api with POST method", async () => {
      mockApi.mockResolvedValueOnce({});
      const { result } = renderHook(() => useCreateOrUpdateTags(), { wrapper: createWrapper() });
      await result.current.mutateAsync({ name: "asg-1", tags: [{ key: "env", value: "prod" }] });
      expect(mockApi).toHaveBeenCalledWith(
        "/aws/autoscaling/groups/asg-1/tags",
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  describe("useDeleteTags", () => {
    it("calls api with POST method", async () => {
      mockApi.mockResolvedValueOnce({});
      const { result } = renderHook(() => useDeleteTags(), { wrapper: createWrapper() });
      await result.current.mutateAsync({ name: "asg-1", tagKeys: ["env"] });
      expect(mockApi).toHaveBeenCalledWith(
        "/aws/autoscaling/groups/asg-1/tags/delete",
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  describe("useASGLoadBalancerTargetGroups", () => {
    it("does NOT call api when null", () => {
      renderHook(() => useASGLoadBalancerTargetGroups(null), { wrapper: createWrapper() });
      expect(mockApi).not.toHaveBeenCalled();
    });

    it("calls api when provided", async () => {
      mockApi.mockResolvedValueOnce({ targetGroups: [], total: 0 });
      const { result } = renderHook(() => useASGLoadBalancerTargetGroups("asg-1"), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi).toHaveBeenCalledWith("/aws/autoscaling/groups/asg-1/lb-target-groups");
    });
  });

  describe("useAttachLBTargetGroups", () => {
    it("calls api with POST method", async () => {
      mockApi.mockResolvedValueOnce({});
      const { result } = renderHook(() => useAttachLBTargetGroups(), { wrapper: createWrapper() });
      await result.current.mutateAsync({ name: "asg-1", targetGroupARNs: ["arn:tg1"] });
      expect(mockApi).toHaveBeenCalledWith(
        "/aws/autoscaling/groups/asg-1/lb-target-groups",
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  describe("useDetachLBTargetGroups", () => {
    it("calls api with POST method", async () => {
      mockApi.mockResolvedValueOnce({});
      const { result } = renderHook(() => useDetachLBTargetGroups(), { wrapper: createWrapper() });
      await result.current.mutateAsync({ name: "asg-1", targetGroupARNs: ["arn:tg1"] });
      expect(mockApi).toHaveBeenCalledWith(
        "/aws/autoscaling/groups/asg-1/lb-target-groups/detach",
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  describe("useASGLoadBalancers", () => {
    it("does NOT call api when null", () => {
      renderHook(() => useASGLoadBalancers(null), { wrapper: createWrapper() });
      expect(mockApi).not.toHaveBeenCalled();
    });

    it("calls api when provided", async () => {
      mockApi.mockResolvedValueOnce({ loadBalancers: [], total: 0 });
      const { result } = renderHook(() => useASGLoadBalancers("asg-1"), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi).toHaveBeenCalledWith("/aws/autoscaling/groups/asg-1/load-balancers");
    });
  });

  describe("useAttachLoadBalancers", () => {
    it("calls api with POST method", async () => {
      mockApi.mockResolvedValueOnce({});
      const { result } = renderHook(() => useAttachLoadBalancers(), { wrapper: createWrapper() });
      await result.current.mutateAsync({ name: "asg-1", loadBalancerNames: ["my-clb"] });
      expect(mockApi).toHaveBeenCalledWith(
        "/aws/autoscaling/groups/asg-1/load-balancers",
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  describe("useDetachLoadBalancers", () => {
    it("calls api with POST method", async () => {
      mockApi.mockResolvedValueOnce({});
      const { result } = renderHook(() => useDetachLoadBalancers(), { wrapper: createWrapper() });
      await result.current.mutateAsync({ name: "asg-1", loadBalancerNames: ["my-clb"] });
      expect(mockApi).toHaveBeenCalledWith(
        "/aws/autoscaling/groups/asg-1/load-balancers/detach",
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  // ─── Describe Types ────────────────────────────────────

  describe("useASGNotificationTypes", () => {
    it("calls correct URL", async () => {
      mockApi.mockResolvedValueOnce({ notificationTypes: [] });
      const { result } = renderHook(() => useASGNotificationTypes(), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi).toHaveBeenCalledWith("/aws/autoscaling/notification-types");
    });
  });

  describe("useASGTerminationPolicyTypes", () => {
    it("calls correct URL", async () => {
      mockApi.mockResolvedValueOnce({ terminationPolicyTypes: [] });
      const { result } = renderHook(() => useASGTerminationPolicyTypes(), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi).toHaveBeenCalledWith("/aws/autoscaling/termination-policy-types");
    });
  });

  describe("useASGAdjustmentTypes", () => {
    it("calls correct URL", async () => {
      mockApi.mockResolvedValueOnce({ adjustmentTypes: [] });
      const { result } = renderHook(() => useASGAdjustmentTypes(), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi).toHaveBeenCalledWith("/aws/autoscaling/adjustment-types");
    });
  });

  describe("useASGAccountLimits", () => {
    it("calls correct URL", async () => {
      mockApi.mockResolvedValueOnce({});
      const { result } = renderHook(() => useASGAccountLimits(), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi).toHaveBeenCalledWith("/aws/autoscaling/account-limits");
    });
  });

  describe("useASGLifecycleHookTypes", () => {
    it("calls correct URL", async () => {
      mockApi.mockResolvedValueOnce({ lifecycleHookTypes: [] });
      const { result } = renderHook(() => useASGLifecycleHookTypes(), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi).toHaveBeenCalledWith("/aws/autoscaling/lifecycle-hook-types");
    });
  });

  describe("useASGMetricCollectionTypes", () => {
    it("calls correct URL", async () => {
      mockApi.mockResolvedValueOnce({ metricCollectionTypes: [] });
      const { result } = renderHook(() => useASGMetricCollectionTypes(), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi).toHaveBeenCalledWith("/aws/autoscaling/metric-collection-types");
    });
  });

  // ─── Policies ──────────────────────────────────────────

  describe("useCreateScalingPolicy", () => {
    it("calls api with POST method", async () => {
      mockApi.mockResolvedValueOnce({});
      const { result } = renderHook(() => useCreateScalingPolicy(), { wrapper: createWrapper() });
      await result.current.mutateAsync({ name: "asg-1", policyName: "scale-up", policyType: "SimpleScaling" });
      expect(mockApi).toHaveBeenCalledWith(
        "/aws/autoscaling/groups/asg-1/policies",
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  describe("useDeleteScalingPolicy", () => {
    it("calls api with DELETE method", async () => {
      mockApi.mockResolvedValueOnce({});
      const { result } = renderHook(() => useDeleteScalingPolicy(), { wrapper: createWrapper() });
      await result.current.mutateAsync({ name: "asg-1", policyName: "scale-up" });
      expect(mockApi).toHaveBeenCalledWith(
        "/aws/autoscaling/groups/asg-1/policies/scale-up",
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });

  // ─── Lifecycle Hooks ───────────────────────────────────

  describe("useLifecycleHooks", () => {
    it("does NOT call api when null", () => {
      renderHook(() => useLifecycleHooks(null), { wrapper: createWrapper() });
      expect(mockApi).not.toHaveBeenCalled();
    });

    it("calls api when provided", async () => {
      mockApi.mockResolvedValueOnce({ lifecycleHooks: [], total: 0 });
      const { result } = renderHook(() => useLifecycleHooks("asg-1"), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi).toHaveBeenCalledWith("/aws/autoscaling/groups/asg-1/lifecycle-hooks");
    });
  });

  describe("usePutLifecycleHook", () => {
    it("calls api with POST method", async () => {
      mockApi.mockResolvedValueOnce({});
      const { result } = renderHook(() => usePutLifecycleHook(), { wrapper: createWrapper() });
      await result.current.mutateAsync({ name: "asg-1", lifecycleHookName: "my-hook", lifecycleTransition: "autoscaling:EC2_INSTANCE_LAUNCHING" });
      expect(mockApi).toHaveBeenCalledWith(
        "/aws/autoscaling/groups/asg-1/lifecycle-hooks",
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  describe("useDeleteLifecycleHook", () => {
    it("calls api with DELETE method", async () => {
      mockApi.mockResolvedValueOnce({});
      const { result } = renderHook(() => useDeleteLifecycleHook(), { wrapper: createWrapper() });
      await result.current.mutateAsync({ name: "asg-1", lifecycleHookName: "my-hook" });
      expect(mockApi).toHaveBeenCalledWith(
        "/aws/autoscaling/groups/asg-1/lifecycle-hooks/my-hook",
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });

  describe("useCompleteLifecycleAction", () => {
    it("calls api with POST method", async () => {
      mockApi.mockResolvedValueOnce({});
      const { result } = renderHook(() => useCompleteLifecycleAction(), { wrapper: createWrapper() });
      await result.current.mutateAsync({
        name: "asg-1",
        lifecycleHookName: "my-hook",
        lifecycleActionResult: "CONTINUE",
      });
      expect(mockApi).toHaveBeenCalledWith(
        "/aws/autoscaling/groups/asg-1/lifecycle-hooks/complete",
        expect.objectContaining({ method: "POST" })
      );
    });
  });
});
