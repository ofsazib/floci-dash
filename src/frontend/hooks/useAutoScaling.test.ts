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
  useScalingPolicies,
  useScalingActivities,
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
});
