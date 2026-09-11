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
  useResolverEndpoints,
  useCreateResolverEndpoint,
  useUpdateResolverEndpoint,
  useDeleteResolverEndpoint,
  useResolverRules,
  useCreateResolverRule,
  useUpdateResolverRule,
  useDeleteResolverRule,
  useResolverRuleAssociations,
  useAssociateResolverRule,
  useDisassociateResolverRule,
  useFirewallDomainLists,
  useCreateFirewallDomainList,
  useDeleteFirewallDomainList,
} from "./useRoute53Resolver";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

describe("useResolverEndpoints", () => {
  it("fetches endpoints", async () => {
    mockApi.mockResolvedValueOnce({ endpoints: [], total: 0 });
    const { result } = renderHook(() => useResolverEndpoints(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/route53resolver/endpoints");
  });
});

describe("useCreateResolverEndpoint", () => {
  it("posts endpoint body", async () => {
    mockApi.mockResolvedValueOnce({ id: "ep" });
    const { result } = renderHook(() => useCreateResolverEndpoint(), { wrapper: createWrapper() });
    const body = { name: "in", direction: "INBOUND", ipAddresses: [{ SubnetId: "subnet-1" }] };
    result.current.mutate(body);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/route53resolver/endpoints", {
      method: "POST",
      body: JSON.stringify(body),
    });
  });
});

describe("useUpdateResolverEndpoint", () => {
  it("patches name and endpoint type", async () => {
    mockApi.mockResolvedValueOnce({ id: "ep1" });
    const { result } = renderHook(() => useUpdateResolverEndpoint(), { wrapper: createWrapper() });
    result.current.mutate({ id: "ep1", name: "renamed", endpointType: "IPV6" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/route53resolver/endpoints/ep1", {
      method: "PATCH",
      body: JSON.stringify({ name: "renamed", endpointType: "IPV6" }),
    });
  });
});

describe("useDeleteResolverEndpoint", () => {
  it("deletes by id", async () => {
    mockApi.mockResolvedValueOnce({ id: "ep1" });
    const { result } = renderHook(() => useDeleteResolverEndpoint(), { wrapper: createWrapper() });
    result.current.mutate("ep1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/route53resolver/endpoints/ep1", { method: "DELETE" });
  });
});

describe("useResolverRules", () => {
  it("fetches rules", async () => {
    mockApi.mockResolvedValueOnce({ rules: [], total: 0 });
    const { result } = renderHook(() => useResolverRules(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/route53resolver/rules");
  });
});

describe("useCreateResolverRule", () => {
  it("posts rule body", async () => {
    mockApi.mockResolvedValueOnce({ id: "r1" });
    const { result } = renderHook(() => useCreateResolverRule(), { wrapper: createWrapper() });
    const body = {
      name: "fwd",
      ruleType: "FORWARD",
      domainName: "example.com",
      targetIps: [{ Ip: "10.0.0.1", Port: 53 }],
      resolverEndpointId: "ep1",
    };
    result.current.mutate(body);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/route53resolver/rules", {
      method: "POST",
      body: JSON.stringify(body),
    });
  });
});

describe("useUpdateResolverRule", () => {
  it("patches rule name and target IPs", async () => {
    mockApi.mockResolvedValueOnce({ id: "r1" });
    const { result } = renderHook(() => useUpdateResolverRule(), { wrapper: createWrapper() });
    result.current.mutate({ id: "r1", name: "r2", targetIps: [{ Ip: "10.0.0.9" }] });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/route53resolver/rules/r1", {
      method: "PATCH",
      body: JSON.stringify({ name: "r2", targetIps: [{ Ip: "10.0.0.9" }] }),
    });
  });
});

describe("useDeleteResolverRule", () => {
  it("deletes by id", async () => {
    mockApi.mockResolvedValueOnce({ id: "r1" });
    const { result } = renderHook(() => useDeleteResolverRule(), { wrapper: createWrapper() });
    result.current.mutate("r1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/route53resolver/rules/r1", { method: "DELETE" });
  });
});

describe("useResolverRuleAssociations", () => {
  it("fetches associations", async () => {
    mockApi.mockResolvedValueOnce({ associations: [], total: 0 });
    const { result } = renderHook(() => useResolverRuleAssociations(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/route53resolver/rule-associations");
  });
});

describe("useAssociateResolverRule", () => {
  it("posts association body", async () => {
    mockApi.mockResolvedValueOnce({ id: "a1" });
    const { result } = renderHook(() => useAssociateResolverRule(), { wrapper: createWrapper() });
    const body = { resolverRuleId: "r1", vpcId: "vpc-1", name: "assoc" };
    result.current.mutate(body);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/route53resolver/rule-associations", {
      method: "POST",
      body: JSON.stringify(body),
    });
  });
});

describe("useDisassociateResolverRule", () => {
  it("posts to the disassociate route", async () => {
    mockApi.mockResolvedValueOnce({ id: "a1" });
    const { result } = renderHook(() => useDisassociateResolverRule(), { wrapper: createWrapper() });
    const body = { resolverRuleId: "r1", vpcId: "vpc-1" };
    result.current.mutate(body);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/route53resolver/rule-associations/disassociate", {
      method: "POST",
      body: JSON.stringify(body),
    });
  });
});

describe("useFirewallDomainLists", () => {
  it("fetches domain lists", async () => {
    mockApi.mockResolvedValueOnce({ domainLists: [], total: 0 });
    const { result } = renderHook(() => useFirewallDomainLists(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/route53resolver/firewall-domain-lists");
  });
});

describe("useCreateFirewallDomainList", () => {
  it("posts domain list name", async () => {
    mockApi.mockResolvedValueOnce({ id: "l1" });
    const { result } = renderHook(() => useCreateFirewallDomainList(), { wrapper: createWrapper() });
    result.current.mutate({ name: "custom" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/route53resolver/firewall-domain-lists", {
      method: "POST",
      body: JSON.stringify({ name: "custom" }),
    });
  });
});

describe("useDeleteFirewallDomainList", () => {
  it("deletes by id", async () => {
    mockApi.mockResolvedValueOnce({ id: "l1" });
    const { result } = renderHook(() => useDeleteFirewallDomainList(), { wrapper: createWrapper() });
    result.current.mutate("l1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/route53resolver/firewall-domain-lists/l1", { method: "DELETE" });
  });
});
