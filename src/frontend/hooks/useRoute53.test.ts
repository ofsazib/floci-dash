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
  useRoute53HostedZones,
  useRoute53HostedZone,
  useCreateRoute53HostedZone,
  useDeleteRoute53HostedZone,
  useRoute53RecordSets,
  useCreateRoute53RecordSet,
  useDeleteRoute53RecordSet,
  useRoute53HealthChecks,
  useCreateRoute53HealthCheck,
  useDeleteRoute53HealthCheck,
  useRoute53Tags,
  useAddRoute53Tags,
  useRemoveRoute53Tags,
  useRoute53Change,
  useRoute53Dnssec,
  useRoute53AccountLimit,
  useUpdateRoute53HostedZoneComment,
  useAssociateRoute53VPC,
  useDisassociateRoute53VPC,
  useRoute53VPCAuthorizations,
  useCreateRoute53VPCAuthorization,
  useDeleteRoute53VPCAuthorization,
  useRoute53HostedZonesByVPC,
  useRoute53HealthCheckStatus,
  useRoute53HostedZoneLimit,
} from "./useRoute53";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

// ── Hosted Zones ─────────────────────────────────────────

describe("useRoute53HostedZones", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ hostedZones: [], total: 0 });
    const { result } = renderHook(() => useRoute53HostedZones(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/route53/hosted-zones");
  });
});

describe("useRoute53HostedZone", () => {
  it("does NOT call api when id is null", () => {
    renderHook(() => useRoute53HostedZone(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with id in path", async () => {
    mockApi.mockResolvedValueOnce({ hostedZone: {}, delegationSet: {} });
    const { result } = renderHook(() => useRoute53HostedZone("Z123"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/route53/hosted-zones/Z123");
  });
});

describe("useCreateRoute53HostedZone", () => {
  it("calls api with POST", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateRoute53HostedZone(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "test.com." });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/route53/hosted-zones",
      expect.objectContaining({ method: "POST" })
    );
  });
});

describe("useDeleteRoute53HostedZone", () => {
  it("calls api with DELETE and id in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteRoute53HostedZone(), { wrapper: createWrapper() });
    await result.current.mutateAsync("Z123");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/route53/hosted-zones/Z123",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

// ── Record Sets ──────────────────────────────────────────

describe("useRoute53RecordSets", () => {
  it("does NOT call api when zoneId is null", () => {
    renderHook(() => useRoute53RecordSets(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with zoneId in path", async () => {
    mockApi.mockResolvedValueOnce({ recordSets: [], total: 0 });
    const { result } = renderHook(() => useRoute53RecordSets("Z123"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/route53/hosted-zones/Z123/record-sets");
  });
});

describe("useCreateRoute53RecordSet", () => {
  it("calls api with POST and zoneId in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateRoute53RecordSet(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ zoneId: "Z1", action: "CREATE", name: "test.", type: "A" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/route53/hosted-zones/Z1/record-sets",
      expect.objectContaining({ method: "POST" })
    );
  });
});

describe("useDeleteRoute53RecordSet", () => {
  it("calls api with DELETE and encoded name/type params", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteRoute53RecordSet(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ zoneId: "Z1", name: "www.example.com.", type: "A" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/route53/hosted-zones/Z1/record-sets?name=www.example.com.&type=A",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("appends ttl and records when both provided", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteRoute53RecordSet(), { wrapper: createWrapper() });
    await result.current.mutateAsync({
      zoneId: "Z1",
      name: "www.example.com.",
      type: "A",
      ttl: 300,
      records: ["192.0.2.1", "192.0.2.2"],
    });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/route53/hosted-zones/Z1/record-sets?name=www.example.com.&type=A&ttl=300&records=192.0.2.1%2C192.0.2.2",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("omits ttl when records list is empty", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteRoute53RecordSet(), { wrapper: createWrapper() });
    await result.current.mutateAsync({
      zoneId: "Z1",
      name: "www.example.com.",
      type: "A",
      ttl: 300,
      records: [],
    });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/route53/hosted-zones/Z1/record-sets?name=www.example.com.&type=A",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

// ── Health Checks ────────────────────────────────────────

describe("useRoute53HealthChecks", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ healthChecks: [], total: 0 });
    const { result } = renderHook(() => useRoute53HealthChecks(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/route53/health-checks");
  });
});

describe("useCreateRoute53HealthCheck", () => {
  it("calls api with POST and body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateRoute53HealthCheck(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ IPAddr: "1.2.3.4", Port: 80, Type: "HTTP" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/route53/health-checks",
      expect.objectContaining({ method: "POST" })
    );
  });
});

describe("useDeleteRoute53HealthCheck", () => {
  it("calls api with DELETE and encoded id", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteRoute53HealthCheck(), { wrapper: createWrapper() });
    await result.current.mutateAsync("hc-123");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/route53/health-checks/hc-123",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

describe("Route53 tags/change/dnssec/limit hooks", () => {
  it("useRoute53Tags fetches encoded", async () => {
    mockApi.mockResolvedValueOnce({ tags: [] });
    const { result } = renderHook(() => useRoute53Tags("hostedzone", "z 1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/route53/tags/hostedzone/z%201");
  });

  it("useRoute53Tags disabled without id", () => {
    const { result } = renderHook(() => useRoute53Tags("hostedzone", null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useAddRoute53Tags posts", async () => {
    mockApi.mockResolvedValueOnce({ tagged: true });
    const { result } = renderHook(() => useAddRoute53Tags(), { wrapper: createWrapper() });
    result.current.mutate({ resourceType: "hostedzone", resourceId: "z-1", tags: { env: "prod" } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/route53/tags/hostedzone/z-1", {
      method: "POST",
      body: JSON.stringify({ tags: { env: "prod" } }),
    });
  });

  it("useRemoveRoute53Tags deletes", async () => {
    mockApi.mockResolvedValueOnce({ untagged: true });
    const { result } = renderHook(() => useRemoveRoute53Tags(), { wrapper: createWrapper() });
    result.current.mutate({ resourceType: "hostedzone", resourceId: "z-1", tagKeys: ["env"] });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/route53/tags/hostedzone/z-1", {
      method: "DELETE",
      body: JSON.stringify({ tagKeys: ["env"] }),
    });
  });

  it("useRoute53Change fetches encoded", async () => {
    mockApi.mockResolvedValueOnce({ changeInfo: null });
    const { result } = renderHook(() => useRoute53Change("C 1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/route53/changes/C%201");
  });

  it("useRoute53Dnssec fetches", async () => {
    mockApi.mockResolvedValueOnce({ status: null, keySigningKeys: [] });
    const { result } = renderHook(() => useRoute53Dnssec("z-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/route53/hostedzones/z-1/dnssec");
  });

  it("useRoute53AccountLimit fetches", async () => {
    mockApi.mockResolvedValueOnce({ limit: null, count: 0 });
    const { result } = renderHook(() => useRoute53AccountLimit("MAX_HOSTED_ZONES_BY_OWNER"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/route53/account-limit/MAX_HOSTED_ZONES_BY_OWNER");
  });
});

// ─── Comment / VPC association ───────────────────────────

describe("useUpdateRoute53HostedZoneComment", () => {
  it("sends PUT with comment", async () => {
    mockApi.mockResolvedValueOnce({ updated: true });
    const { result } = renderHook(() => useUpdateRoute53HostedZoneComment(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ id: "Z1", comment: "hi" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/route53/hosted-zones/Z1/comment", {
      method: "PUT",
      body: JSON.stringify({ comment: "hi" }),
    });
  });
});

describe("useAssociateRoute53VPC", () => {
  it("posts VPC details", async () => {
    mockApi.mockResolvedValueOnce({ changeInfo: {} });
    const { result } = renderHook(() => useAssociateRoute53VPC(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ id: "Z1", vpcId: "vpc-1", vpcRegion: "us-east-1" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/route53/hosted-zones/Z1/associate-vpc", {
      method: "POST",
      body: JSON.stringify({ vpcId: "vpc-1", vpcRegion: "us-east-1" }),
    });
  });
});

describe("useDisassociateRoute53VPC", () => {
  it("posts VPC details", async () => {
    mockApi.mockResolvedValueOnce({ changeInfo: {} });
    const { result } = renderHook(() => useDisassociateRoute53VPC(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ id: "Z1", vpcId: "vpc-1", vpcRegion: "us-east-1" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/route53/hosted-zones/Z1/disassociate-vpc", {
      method: "POST",
      body: JSON.stringify({ vpcId: "vpc-1", vpcRegion: "us-east-1" }),
    });
  });
});

describe("useRoute53VPCAuthorizations", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ authorizations: [], total: 0 });
    const { result } = renderHook(() => useRoute53VPCAuthorizations("Z1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/route53/hosted-zones/Z1/vpc-authorizations");
  });

  it("disabled when zoneId is null", () => {
    const { result } = renderHook(() => useRoute53VPCAuthorizations(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useCreateRoute53VPCAuthorization", () => {
  it("posts VPC details", async () => {
    mockApi.mockResolvedValueOnce({ vpc: {} });
    const { result } = renderHook(() => useCreateRoute53VPCAuthorization(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ id: "Z1", vpcId: "vpc-1", vpcRegion: "us-east-1" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/route53/hosted-zones/Z1/vpc-authorizations", {
      method: "POST",
      body: JSON.stringify({ vpcId: "vpc-1", vpcRegion: "us-east-1" }),
    });
  });
});

describe("useDeleteRoute53VPCAuthorization", () => {
  it("sends DELETE with VPC details", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteRoute53VPCAuthorization(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ id: "Z1", vpcId: "vpc-1", vpcRegion: "us-east-1" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/route53/hosted-zones/Z1/vpc-authorizations", {
      method: "DELETE",
      body: JSON.stringify({ vpcId: "vpc-1", vpcRegion: "us-east-1" }),
    });
  });
});

describe("useRoute53HostedZonesByVPC", () => {
  it("calls api with encoded vpcId", async () => {
    mockApi.mockResolvedValueOnce({ hostedZoneSummaries: [], total: 0 });
    const { result } = renderHook(() => useRoute53HostedZonesByVPC("vpc 1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/route53/hosted-zones-by-vpc?vpcId=vpc%201");
  });

  it("disabled when vpcId is null", () => {
    const { result } = renderHook(() => useRoute53HostedZonesByVPC(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useRoute53HealthCheckStatus", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ observations: [], total: 0 });
    const { result } = renderHook(() => useRoute53HealthCheckStatus("H1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/route53/health-checks/H1/status");
  });

  it("disabled when healthCheckId is null", () => {
    const { result } = renderHook(() => useRoute53HealthCheckStatus(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useRoute53HostedZoneLimit", () => {
  it("calls api with encoded ids", async () => {
    mockApi.mockResolvedValueOnce({ limit: "MAX_VPC_ASSOCIATIONS", value: 500, count: 1 });
    const { result } = renderHook(() => useRoute53HostedZoneLimit("Z1", "MAX_VPC_ASSOCIATIONS"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/route53/hosted-zones/Z1/limit/MAX_VPC_ASSOCIATIONS");
  });

  it("disabled when zoneId is null", () => {
    const { result } = renderHook(() => useRoute53HostedZoneLimit(null, "MAX_VPC_ASSOCIATIONS"), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });
});
