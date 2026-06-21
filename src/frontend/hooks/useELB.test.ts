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
  useELBCreateTargetGroup,
  useELBDeleteTargetGroup,
  useELBListeners,
  useELBTargetHealth,
  useELBCreateListener,
  useELBDeleteListener,
  useELBRegisterTargets,
  useELBDeregisterTargets,
} from "./useELB";

const LB_ARN = "arn:aws:elasticloadbalancing:us-east-1:123:loadbalancer/my-lb";
const TG_ARN = "arn:aws:elasticloadbalancing:us-east-1:123:targetgroup/my-tg/123";
const ENC_LB = encodeURIComponent(LB_ARN);
const ENC_TG = encodeURIComponent(TG_ARN);

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
    expect(mockApi).toHaveBeenCalledWith("/aws/elasticloadbalancing/load-balancers");
  });
});

// ─── CREATE LOAD BALANCER ─────────────────────────────────

describe("useELBCreateLoadBalancer", () => {
  it("calls api with POST method and body", async () => {
    mockApi.mockResolvedValueOnce({ loadBalancer: {} });
    const { result } = renderHook(() => useELBCreateLoadBalancer(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "new-lb", subnets: ["subnet-123"] });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/elasticloadbalancing/load-balancers",
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
    await result.current.mutateAsync(LB_ARN);
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/elasticloadbalancing/load-balancers/${ENC_LB}`,
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
    const { result } = renderHook(() => useELBLoadBalancerAttributes(LB_ARN), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/elasticloadbalancing/load-balancers/${ENC_LB}/attributes`
    );
  });
});

// ─── TARGET GROUPS ────────────────────────────────────────

describe("useELBTargetGroups", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ targetGroups: [], total: 0 });
    const { result } = renderHook(() => useELBTargetGroups(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/elasticloadbalancing/target-groups");
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
    const { result } = renderHook(() => useELBListeners(LB_ARN), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/elasticloadbalancing/load-balancers/${ENC_LB}/listeners`
    );
  });
});

// ─── CREATE TARGET GROUP ───────────────────────────────────

describe("useELBCreateTargetGroup", () => {
  it("calls api with POST method and body", async () => {
    mockApi.mockResolvedValueOnce({ targetGroup: {} });
    const { result } = renderHook(() => useELBCreateTargetGroup(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "tg1", protocol: "HTTP", port: 80, vpcId: "vpc-123" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/elasticloadbalancing/target-groups",
      expect.objectContaining({ method: "POST" })
    );
  });
});

// ─── DELETE TARGET GROUP ───────────────────────────────────

describe("useELBDeleteTargetGroup", () => {
  it("calls api with DELETE method and arn in path", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useELBDeleteTargetGroup(), { wrapper: createWrapper() });
    await result.current.mutateAsync(TG_ARN);
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/elasticloadbalancing/target-groups/${ENC_TG}`,
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

// ─── CREATE LISTENER ───────────────────────────────────────

describe("useELBCreateListener", () => {
  it("calls api with POST method and lbArn in path", async () => {
    mockApi.mockResolvedValueOnce({ listener: {} });
    const { result } = renderHook(() => useELBCreateListener(LB_ARN), { wrapper: createWrapper() });
    await result.current.mutateAsync({ protocol: "HTTP", port: 80, defaultActions: [{ Type: "forward" }] });
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/elasticloadbalancing/load-balancers/${ENC_LB}/listeners`,
      expect.objectContaining({ method: "POST" })
    );
  });
});

// ─── DELETE LISTENER ───────────────────────────────────────

describe("useELBDeleteListener", () => {
  it("calls api with DELETE method and arn in path", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useELBDeleteListener(), { wrapper: createWrapper() });
    await result.current.mutateAsync(LB_ARN);
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/elasticloadbalancing/listeners/${ENC_LB}`,
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

// ─── REGISTER TARGETS ─────────────────────────────────────

describe("useELBRegisterTargets", () => {
  it("calls api with POST method and targets body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useELBRegisterTargets(TG_ARN), { wrapper: createWrapper() });
    await result.current.mutateAsync([{ id: "i-123" }]);
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/elasticloadbalancing/target-groups/${ENC_TG}/register`,
      expect.objectContaining({ method: "POST" })
    );
  });
});

// ─── DEREGISTER TARGETS ────────────────────────────────────

describe("useELBDeregisterTargets", () => {
  it("calls api with POST method and targets body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useELBDeregisterTargets(TG_ARN), { wrapper: createWrapper() });
    await result.current.mutateAsync([{ id: "i-123" }]);
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/elasticloadbalancing/target-groups/${ENC_TG}/deregister`,
      expect.objectContaining({ method: "POST" })
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
    const { result } = renderHook(() => useELBTargetHealth(TG_ARN), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/elasticloadbalancing/target-groups/${ENC_TG}/health`
    );
  });
});