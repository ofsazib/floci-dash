// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const mockApi = vi.fn();
vi.mock("../lib/client", () => ({
  api: (...args: any[]) => mockApi(...args),
}));

import {
  useELBLoadBalancers,
  useELBCreateLoadBalancer,
  useELBDeleteLoadBalancer,
  useELBLoadBalancerAttributes,
  useELBTargetGroups,
  useELBListeners,
  useELBTargetHealth,
} from "./useELB";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

// ─── LOAD BALANCERS ───────────────────────────────────────

describe("useELBLoadBalancers", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ loadBalancers: [], total: 0 });
    const { result } = renderHook(() => useELBLoadBalancers(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/elb/load-balancers");
  });
});

// ─── CREATE LOAD BALANCER ─────────────────────────────────

describe("useELBCreateLoadBalancer", () => {
  it("calls api with POST method and body", async () => {
    mockApi.mockResolvedValueOnce({ loadBalancer: {} });
    const { result } = renderHook(() => useELBCreateLoadBalancer(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "new-lb", subnets: ["subnet-123"] });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/elb/load-balancers",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "new-lb", subnets: ["subnet-123"] }),
      })
    );
  });
});

// ─── DELETE LOAD BALANCER ─────────────────────────────────

describe("useELBDeleteLoadBalancer", () => {
  it("calls api with DELETE method", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useELBDeleteLoadBalancer(), { wrapper: createWrapper() });
    await result.current.mutateAsync("arn:aws:elasticloadbalancing:us-east-1:123:loadbalancer/my-lb");
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/elb/load-balancers/${encodeURIComponent("arn:aws:elasticloadbalancing:us-east-1:123:loadbalancer/my-lb")}`,
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

// ─── LOAD BALANCER ATTRIBUTES ─────────────────────────────

describe("useELBLoadBalancerAttributes", () => {
  it("does NOT call api when arn is null", () => {
    renderHook(() => useELBLoadBalancerAttributes(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api when arn provided", async () => {
    mockApi.mockResolvedValueOnce({ loadBalancerArn: "arn", attributes: {} });
    const { result } = renderHook(() => useELBLoadBalancerAttributes("arn:aws:elasticloadbalancing:us-east-1:123:loadbalancer/my-lb"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/elb/load-balancers/${encodeURIComponent("arn:aws:elasticloadbalancing:us-east-1:123:loadbalancer/my-lb")}/attributes`
    );
  });
});

// ─── TARGET GROUPS ────────────────────────────────────────

describe("useELBTargetGroups", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ targetGroups: [], total: 0 });
    const { result } = renderHook(() => useELBTargetGroups(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/elb/target-groups");
  });
});

// ─── LISTENERS ────────────────────────────────────────────

describe("useELBListeners", () => {
  it("does NOT call api when lbArn is null", () => {
    renderHook(() => useELBListeners(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api when lbArn provided", async () => {
    mockApi.mockResolvedValueOnce({ listeners: [], total: 0 });
    const { result } = renderHook(() => useELBListeners("arn:aws:elasticloadbalancing:us-east-1:123:loadbalancer/my-lb"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/elb/load-balancers/${encodeURIComponent("arn:aws:elasticloadbalancing:us-east-1:123:loadbalancer/my-lb")}/listeners`
    );
  });
});

// ─── TARGET HEALTH ────────────────────────────────────────

describe("useELBTargetHealth", () => {
  it("does NOT call api when tgArn is null", () => {
    renderHook(() => useELBTargetHealth(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api when tgArn provided", async () => {
    mockApi.mockResolvedValueOnce({ targets: [], total: 0 });
    const { result } = renderHook(() => useELBTargetHealth("arn:aws:elasticloadbalancing:us-east-1:123:targetgroup/my-tg/123"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/elb/target-groups/${encodeURIComponent("arn:aws:elasticloadbalancing:us-east-1:123:targetgroup/my-tg/123")}/health`
    );
  });
});