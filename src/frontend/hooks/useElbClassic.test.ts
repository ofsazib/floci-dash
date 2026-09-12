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
  useElbLoadBalancers,
  useElbLoadBalancerDetail,
  useElbCreateLoadBalancer,
  useElbDeleteLoadBalancer,
  useElbAttributes,
  useElbUpdateAttributes,
  useElbAddListeners,
  useElbDeleteListeners,
  useElbInstanceHealth,
  useElbRegisterInstances,
  useElbDeregisterInstances,
  useElbConfigureHealthCheck,
  useElbApplySecurityGroups,
  useElbAttachSubnets,
  useElbDetachSubnets,
  useElbEnableZones,
  useElbDisableZones,
  useElbTags,
  useElbAddTags,
  useElbRemoveTags,
  useElbAccountLimits,
} from "./useElbClassic";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

describe("useElbLoadBalancers", () => {
  it("fetches load balancers", async () => {
    mockApi.mockResolvedValueOnce({ loadBalancers: [], total: 0 });
    const { result } = renderHook(() => useElbLoadBalancers(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/elb-classic/load-balancers");
  });
});

describe("useElbLoadBalancerDetail", () => {
  it("fetches detail with encoded name", async () => {
    mockApi.mockResolvedValueOnce({ loadBalancer: {} });
    const { result } = renderHook(() => useElbLoadBalancerDetail("web lb"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/elb-classic/load-balancers/detail?name=web%20lb");
  });

  it("is disabled without a name", () => {
    const { result } = renderHook(() => useElbLoadBalancerDetail(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
    expect(mockApi).not.toHaveBeenCalled();
  });
});

describe("useElbCreateLoadBalancer", () => {
  it("posts create body", async () => {
    mockApi.mockResolvedValueOnce({ dnsName: "dns" });
    const { result } = renderHook(() => useElbCreateLoadBalancer(), { wrapper: createWrapper() });
    const body = { name: "web", zones: "a", listener: { protocol: "http", port: "80", instancePort: "8080" } };
    result.current.mutate(body);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/elb-classic/load-balancers", {
      method: "POST",
      body: JSON.stringify(body),
    });
  });
});

describe("useElbDeleteLoadBalancer", () => {
  it("deletes by name", async () => {
    mockApi.mockResolvedValueOnce({ name: "web" });
    const { result } = renderHook(() => useElbDeleteLoadBalancer(), { wrapper: createWrapper() });
    result.current.mutate("web");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/elb-classic/load-balancers?name=web", { method: "DELETE" });
  });
});

describe("useElbAttributes", () => {
  it("fetches attributes", async () => {
    mockApi.mockResolvedValueOnce({ LoadBalancerAttributes: {} });
    const { result } = renderHook(() => useElbAttributes("web"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/elb-classic/load-balancers/attributes?name=web");
  });

  it("is disabled without a name", () => {
    const { result } = renderHook(() => useElbAttributes(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useElbUpdateAttributes", () => {
  it("puts attributes", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useElbUpdateAttributes(), { wrapper: createWrapper() });
    result.current.mutate({ name: "web", attributes: { a: 1 } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/elb-classic/load-balancers/attributes", {
      method: "PUT",
      body: JSON.stringify({ name: "web", attributes: { a: 1 } }),
    });
  });
});

describe("useElbAddListeners", () => {
  it("posts listeners", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useElbAddListeners(), { wrapper: createWrapper() });
    result.current.mutate({ name: "web", listeners: [{ protocol: "http", port: "80", instancePort: "8080" }] });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/elb-classic/listeners", {
      method: "POST",
      body: JSON.stringify({ name: "web", listeners: [{ protocol: "http", port: "80", instancePort: "8080" }] }),
    });
  });
});

describe("useElbDeleteListeners", () => {
  it("deletes by ports", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useElbDeleteListeners(), { wrapper: createWrapper() });
    result.current.mutate({ name: "web", ports: "80,443" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/elb-classic/listeners?name=web&ports=80%2C443", {
      method: "DELETE",
    });
  });
});

describe("useElbInstanceHealth", () => {
  it("fetches health", async () => {
    mockApi.mockResolvedValueOnce({ instanceStates: [], total: 0 });
    const { result } = renderHook(() => useElbInstanceHealth("web"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/elb-classic/health?name=web");
  });

  it("is disabled without a name", () => {
    const { result } = renderHook(() => useElbInstanceHealth(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("instance register/deregister", () => {
  it("registers instances", async () => {
    mockApi.mockResolvedValueOnce({ instances: [] });
    const { result } = renderHook(() => useElbRegisterInstances(), { wrapper: createWrapper() });
    result.current.mutate({ name: "web", instances: "i-1" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/elb-classic/instances/register", {
      method: "POST",
      body: JSON.stringify({ name: "web", instances: "i-1" }),
    });
  });

  it("deregisters instances", async () => {
    mockApi.mockResolvedValueOnce({ instances: [] });
    const { result } = renderHook(() => useElbDeregisterInstances(), { wrapper: createWrapper() });
    result.current.mutate({ name: "web", instances: "i-1" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/elb-classic/instances/deregister", {
      method: "POST",
      body: JSON.stringify({ name: "web", instances: "i-1" }),
    });
  });
});

describe("useElbConfigureHealthCheck", () => {
  it("puts health check", async () => {
    mockApi.mockResolvedValueOnce({ healthCheck: {} });
    const { result } = renderHook(() => useElbConfigureHealthCheck(), { wrapper: createWrapper() });
    result.current.mutate({ name: "web", healthCheck: { target: "HTTP:80/" } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/elb-classic/health-check", {
      method: "PUT",
      body: JSON.stringify({ name: "web", healthCheck: { target: "HTTP:80/" } }),
    });
  });
});

describe("networking hooks", () => {
  it("applies security groups", async () => {
    mockApi.mockResolvedValueOnce({ securityGroups: [] });
    const { result } = renderHook(() => useElbApplySecurityGroups(), { wrapper: createWrapper() });
    result.current.mutate({ name: "web", securityGroups: "sg-1" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/elb-classic/security-groups", {
      method: "PUT",
      body: JSON.stringify({ name: "web", securityGroups: "sg-1" }),
    });
  });

  it("attaches subnets", async () => {
    mockApi.mockResolvedValueOnce({ subnets: [] });
    const { result } = renderHook(() => useElbAttachSubnets(), { wrapper: createWrapper() });
    result.current.mutate({ name: "web", subnets: "subnet-1" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/elb-classic/subnets/attach", {
      method: "PUT",
      body: JSON.stringify({ name: "web", subnets: "subnet-1" }),
    });
  });

  it("detaches subnets", async () => {
    mockApi.mockResolvedValueOnce({ subnets: [] });
    const { result } = renderHook(() => useElbDetachSubnets(), { wrapper: createWrapper() });
    result.current.mutate({ name: "web", subnets: "subnet-1" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/elb-classic/subnets/detach", {
      method: "PUT",
      body: JSON.stringify({ name: "web", subnets: "subnet-1" }),
    });
  });

  it("enables zones", async () => {
    mockApi.mockResolvedValueOnce({ zones: [] });
    const { result } = renderHook(() => useElbEnableZones(), { wrapper: createWrapper() });
    result.current.mutate({ name: "web", zones: "us-east-1a" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/elb-classic/zones/enable", {
      method: "PUT",
      body: JSON.stringify({ name: "web", zones: "us-east-1a" }),
    });
  });

  it("disables zones", async () => {
    mockApi.mockResolvedValueOnce({ zones: [] });
    const { result } = renderHook(() => useElbDisableZones(), { wrapper: createWrapper() });
    result.current.mutate({ name: "web", zones: "us-east-1a" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/elb-classic/zones/disable", {
      method: "PUT",
      body: JSON.stringify({ name: "web", zones: "us-east-1a" }),
    });
  });
});

describe("tag hooks", () => {
  it("fetches tags", async () => {
    mockApi.mockResolvedValueOnce({ tags: [] });
    const { result } = renderHook(() => useElbTags("web"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/elb-classic/tags?name=web");
  });

  it("is disabled without a name", () => {
    const { result } = renderHook(() => useElbTags(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("adds tags", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useElbAddTags(), { wrapper: createWrapper() });
    result.current.mutate({ name: "web", tags: [{ Key: "k" }] });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/elb-classic/tags", {
      method: "POST",
      body: JSON.stringify({ name: "web", tags: [{ Key: "k" }] }),
    });
  });

  it("removes tags", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useElbRemoveTags(), { wrapper: createWrapper() });
    result.current.mutate({ name: "web", keys: "k" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/elb-classic/tags/remove", {
      method: "POST",
      body: JSON.stringify({ name: "web", keys: "k" }),
    });
  });
});

describe("useElbAccountLimits", () => {
  it("fetches limits", async () => {
    mockApi.mockResolvedValueOnce({ limits: [] });
    const { result } = renderHook(() => useElbAccountLimits(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/elb-classic/account-limits");
  });
});
