// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const mockApi = vi.fn();
vi.mock("../lib/client", () => ({ api: (...args: any[]) => mockApi(...args) }));

import {
  useAASScalableTargets,
  useRegisterAAScalableTarget,
  useDeregisterAAScalableTarget,
  useAASScalingPolicies,
  usePutAASScalingPolicy,
  useDeleteAASScalingPolicy,
  useAASResourceTags,
  useTagAASResource,
  useUntagAASResource,
} from "./useApplicationAutoScaling";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: qc }, children);
  };
}

beforeEach(() => {
  mockApi.mockReset();
});

describe("useAASScalableTargets", () => {
  it("queries targets by namespace", async () => {
    mockApi.mockResolvedValueOnce({ scalableTargets: [], total: 0 });
    const { result } = renderHook(() => useAASScalableTargets("ecs"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/applicationautoscaling/scalable-targets?serviceNamespace=ecs");
  });
  it("disabled without namespace", () => {
    const { result } = renderHook(() => useAASScalableTargets(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useRegisterAAScalableTarget", () => {
  it("registers and invalidates", async () => {
    mockApi.mockResolvedValueOnce({ scalableTargetARN: "arn:x" });
    const { result } = renderHook(() => useRegisterAAScalableTarget("ecs"), { wrapper: createWrapper() });
    await result.current.mutateAsync({ resourceId: "c/s", scalableDimension: "d", minCapacity: 1, maxCapacity: 5 });
    expect(mockApi).toHaveBeenCalledWith("/aws/applicationautoscaling/scalable-targets", {
      method: "POST",
      body: JSON.stringify({ resourceId: "c/s", scalableDimension: "d", minCapacity: 1, maxCapacity: 5, serviceNamespace: "ecs" }),
    });
  });
});

describe("useDeregisterAAScalableTarget", () => {
  it("deregisters", async () => {
    mockApi.mockResolvedValueOnce({ deregistered: true });
    const { result } = renderHook(() => useDeregisterAAScalableTarget("ecs"), { wrapper: createWrapper() });
    await result.current.mutateAsync({ resourceId: "c/s", scalableDimension: "d" });
    expect(mockApi).toHaveBeenCalledWith("/aws/applicationautoscaling/scalable-targets", {
      method: "DELETE",
      body: JSON.stringify({ resourceId: "c/s", scalableDimension: "d", serviceNamespace: "ecs" }),
    });
  });
});

describe("useAASScalingPolicies", () => {
  it("queries policies", async () => {
    mockApi.mockResolvedValueOnce({ scalingPolicies: [], total: 0 });
    const { result } = renderHook(() => useAASScalingPolicies("ecs"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const idle = renderHook(() => useAASScalingPolicies(null), { wrapper: createWrapper() });
    expect(idle.result.current.fetchStatus).toBe("idle");
  });
});

describe("usePutAASScalingPolicy", () => {
  it("puts policy", async () => {
    mockApi.mockResolvedValueOnce({ policyArn: "arn:p" });
    const { result } = renderHook(() => usePutAASScalingPolicy("ecs"), { wrapper: createWrapper() });
    await result.current.mutateAsync({ policyName: "p", resourceId: "r", scalableDimension: "d" });
    expect(mockApi).toHaveBeenCalledWith("/aws/applicationautoscaling/scalable-policies", {
      method: "POST",
      body: JSON.stringify({ policyName: "p", resourceId: "r", scalableDimension: "d", serviceNamespace: "ecs" }),
    });
  });
});

describe("useDeleteAASScalingPolicy", () => {
  it("deletes policy", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteAASScalingPolicy("ecs"), { wrapper: createWrapper() });
    await result.current.mutateAsync({ policyName: "p", resourceId: "r", scalableDimension: "d" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/applicationautoscaling/scalable-policies/p?serviceNamespace=ecs&resourceId=r&scalableDimension=d",
      { method: "DELETE" },
    );
  });
});

describe("tags hooks", () => {
  it("lists resource tags + disabled arm", async () => {
    mockApi.mockResolvedValueOnce({ tags: [{ Key: "a", Value: "b" }], total: 1 });
    const tags = renderHook(() => useAASResourceTags("c/s"), { wrapper: createWrapper() });
    await waitFor(() => expect(tags.result.current.isSuccess).toBe(true));
    const idle = renderHook(() => useAASResourceTags(null), { wrapper: createWrapper() });
    expect(idle.result.current.fetchStatus).toBe("idle");
  });
  it("tags resource", async () => {
    mockApi.mockResolvedValueOnce({ tagged: true });
    const { result } = renderHook(() => useTagAASResource("c/s"), { wrapper: createWrapper() });
    await result.current.mutateAsync([{ Key: "a", Value: "b" }]);
    expect(mockApi).toHaveBeenCalledWith("/aws/applicationautoscaling/resources/c%2Fs/tags", {
      method: "PUT",
      body: JSON.stringify({ tags: [{ Key: "a", Value: "b" }] }),
    });
  });
  it("untags resource", async () => {
    mockApi.mockResolvedValueOnce({ untagged: true });
    const { result } = renderHook(() => useUntagAASResource("c/s"), { wrapper: createWrapper() });
    await result.current.mutateAsync("a");
    expect(mockApi).toHaveBeenCalledWith("/aws/applicationautoscaling/resources/c%2Fs/tags/a", { method: "DELETE" });
  });
});
