import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const mockR53 = vi.hoisted(() =>
  vi.fn(function () {
    return { send: mockSend };
  })
);

const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) {
      return { __cmdName: name, ...args };
    });
  };
});

vi.mock("@aws-sdk/client-route-53", () => ({
  Route53Client: mockR53,
  ListHostedZonesCommand: createCmd("ListHostedZonesCommand"),
  GetHostedZoneCommand: createCmd("GetHostedZoneCommand"),
  CreateHostedZoneCommand: createCmd("CreateHostedZoneCommand"),
  DeleteHostedZoneCommand: createCmd("DeleteHostedZoneCommand"),
  ListResourceRecordSetsCommand: createCmd("ListResourceRecordSetsCommand"),
  ChangeResourceRecordSetsCommand: createCmd("ChangeResourceRecordSetsCommand"),
  ListHealthChecksCommand: createCmd("ListHealthChecksCommand"),
  CreateHealthCheckCommand: createCmd("CreateHealthCheckCommand"),
  DeleteHealthCheckCommand: createCmd("DeleteHealthCheckCommand"),
  ListTagsForResourceCommand: createCmd("ListTagsForResourceCommand"),
  ChangeTagsForResourceCommand: createCmd("ChangeTagsForResourceCommand"),
  GetChangeCommand: createCmd("GetChangeCommand"),
  GetDNSSECCommand: createCmd("GetDNSSECCommand"),
  GetAccountLimitCommand: createCmd("GetAccountLimitCommand"),
  ListHostedZonesByNameCommand: createCmd("ListHostedZonesByNameCommand"),
  GetHostedZoneCountCommand: createCmd("GetHostedZoneCountCommand"),
  GetHealthCheckCommand: createCmd("GetHealthCheckCommand"),
  UpdateHealthCheckCommand: createCmd("UpdateHealthCheckCommand"),
  UpdateHostedZoneCommentCommand: createCmd("UpdateHostedZoneCommentCommand"),
  AssociateVPCWithHostedZoneCommand: createCmd("AssociateVPCWithHostedZoneCommand"),
  DisassociateVPCFromHostedZoneCommand: createCmd("DisassociateVPCFromHostedZoneCommand"),
  CreateVPCAssociationAuthorizationCommand: createCmd("CreateVPCAssociationAuthorizationCommand"),
  DeleteVPCAssociationAuthorizationCommand: createCmd("DeleteVPCAssociationAuthorizationCommand"),
  ListVPCAssociationAuthorizationsCommand: createCmd("ListVPCAssociationAuthorizationsCommand"),
  ListHostedZonesByVPCCommand: createCmd("ListHostedZonesByVPCCommand"),
  GetHealthCheckStatusCommand: createCmd("GetHealthCheckStatusCommand"),
  GetHostedZoneLimitCommand: createCmd("GetHostedZoneLimitCommand"),
}));

vi.mock("../../clients/aws", () => ({
  getAwsConfig: () => ({
    endpoint: "http://localhost:4566",
    region: "us-east-1",
    credentials: { accessKeyId: "test", secretAccessKey: "test" },
  }),
}));

import router from "./route53";

async function get(path: string) {
  return router.request(path, { method: "GET" });
}

async function post(path: string, body?: any) {
  return router.request(path, {
    method: "POST",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { "content-type": "application/json" } : undefined,
  });
}

async function put(path: string, body?: any) {
  return router.request(path, {
    method: "PUT",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { "content-type": "application/json" } : undefined,
  });
}

async function del(path: string, body?: any) {
  return router.request(path, {
    method: "DELETE",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { "content-type": "application/json" } : undefined,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSend.mockReset();
});

// ── Hosted Zones ─────────────────────────────────────────

describe("Route53 routes — Hosted Zones", () => {
  it("GET /hosted-zones — returns list", async () => {
    mockSend.mockResolvedValueOnce({
      HostedZones: [{ Id: "/hostedzone/Z1", Name: "example.com." }],
    });
    const res = await get("/hosted-zones");
    const json = await res.json();
    expect(json.hostedZones).toHaveLength(1);
    expect(json.total).toBe(1);
  });

  it("GET /hosted-zones — returns empty when none", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/hosted-zones");
    const json = await res.json();
    expect(json.hostedZones).toEqual([]);
    expect(json.total).toBe(0);
  });

  it("GET /hosted-zones/:id — returns zone detail", async () => {
    mockSend.mockResolvedValueOnce({
      HostedZone: { Id: "/hostedzone/Z1", Name: "example.com." },
      DelegationSet: { NameServers: ["ns1.example.com"] },
    });
    const res = await get("/hosted-zones/Z1");
    const json = await res.json();
    expect(json.hostedZone.Name).toBe("example.com.");
    expect(json.delegationSet.NameServers).toHaveLength(1);
  });

  it("GET /hosted-zones/:id — returns null when not found", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/hosted-zones/unknown");
    const json = await res.json();
    expect(json.hostedZone).toBeNull();
  });

  it("POST /hosted-zones — creates zone", async () => {
    mockSend.mockResolvedValueOnce({
      HostedZone: { Id: "/hostedzone/Z2", Name: "new.com." },
      ChangeInfo: { Id: "/change/C1", Status: "INSYNC" },
    });
    const res = await post("/hosted-zones", { name: "new.com.", comment: "test" });
    const json = await res.json();
    expect(json.hostedZone.Name).toBe("new.com.");
    expect(res.status).toBe(201);
  });

  it("POST /hosted-zones — 400 when no name", async () => {
    const res = await post("/hosted-zones", {});
    expect(res.status).toBe(400);
  });

  it("POST /hosted-zones — generates callerReference when missing", async () => {
    mockSend.mockResolvedValueOnce({ HostedZone: {}, ChangeInfo: {} });
    await post("/hosted-zones", { name: "test.com." });
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "CreateHostedZoneCommand",
        CallerReference: expect.any(String),
      })
    );
  });

  it("DELETE /hosted-zones/:id — deletes zone", async () => {
    mockSend.mockResolvedValueOnce({ ChangeInfo: { Status: "INSYNC" } });
    const res = await del("/hosted-zones/Z1");
    const json = await res.json();
    expect(json.changeInfo.Status).toBe("INSYNC");
  });
});

// ── Resource Record Sets ─────────────────────────────────

describe("Route53 routes — Record Sets", () => {
  it("GET /hosted-zones/:id/record-sets — returns list", async () => {
    mockSend.mockResolvedValueOnce({
      ResourceRecordSets: [
        { Name: "example.com.", Type: "A", TTL: 300 },
        { Name: "www.example.com.", Type: "CNAME", TTL: 300 },
      ],
    });
    const res = await get("/hosted-zones/Z1/record-sets");
    const json = await res.json();
    expect(json.recordSets).toHaveLength(2);
    expect(json.total).toBe(2);
  });

  it("GET /hosted-zones/:id/record-sets — returns empty", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/hosted-zones/Z1/record-sets");
    const json = await res.json();
    expect(json.recordSets).toEqual([]);
    expect(json.total).toBe(0);
  });

  it("POST /hosted-zones/:id/record-sets — creates record", async () => {
    mockSend.mockResolvedValueOnce({ ChangeInfo: { Status: "PENDING" } });
    const res = await post("/hosted-zones/Z1/record-sets", {
      action: "CREATE",
      name: "www.example.com.",
      type: "A",
      ttl: 300,
      resourceRecords: [{ Value: "1.2.3.4" }],
    });
    const json = await res.json();
    expect(json.changeInfo.Status).toBe("PENDING");
    expect(res.status).toBe(201);
  });

  it("DELETE /hosted-zones/:id/record-sets — deletes record (bare form without ttl/records)", async () => {
    mockSend.mockResolvedValueOnce({ ChangeInfo: { Status: "INSYNC" } });
    const res = await del("/hosted-zones/Z1/record-sets?name=www.example.com.&type=A");
    const json = await res.json();
    expect(json.changeInfo.Status).toBe("INSYNC");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "ChangeResourceRecordSetsCommand",
        ChangeBatch: {
          Changes: [
            { Action: "DELETE", ResourceRecordSet: { Name: "www.example.com.", Type: "A" } },
          ],
        },
      })
    );
  });

  it("DELETE /hosted-zones/:id/record-sets — includes TTL and records when both provided", async () => {
    mockSend.mockResolvedValueOnce({ ChangeInfo: { Status: "INSYNC" } });
    const res = await del(
      "/hosted-zones/Z1/record-sets?name=www.example.com.&type=A&ttl=300&records=1.2.3.4%2C5.6.7.8"
    );
    const json = await res.json();
    expect(json.changeInfo.Status).toBe("INSYNC");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "ChangeResourceRecordSetsCommand",
        ChangeBatch: {
          Changes: [
            {
              Action: "DELETE",
              ResourceRecordSet: {
                Name: "www.example.com.",
                Type: "A",
                TTL: 300,
                ResourceRecords: [{ Value: "1.2.3.4" }, { Value: "5.6.7.8" }],
              },
            },
          ],
        },
      })
    );
  });

  it("DELETE /hosted-zones/:id/record-sets — falls back to bare form on non-numeric ttl", async () => {
    mockSend.mockResolvedValueOnce({ ChangeInfo: { Status: "INSYNC" } });
    const res = await del(
      "/hosted-zones/Z1/record-sets?name=www.example.com.&type=A&ttl=abc&records=1.2.3.4"
    );
    const json = await res.json();
    expect(json.changeInfo.Status).toBe("INSYNC");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        __cmdName: "ChangeResourceRecordSetsCommand",
        ChangeBatch: {
          Changes: [
            { Action: "DELETE", ResourceRecordSet: { Name: "www.example.com.", Type: "A" } },
          ],
        },
      })
    );
  });

  it("DELETE /hosted-zones/:id/record-sets — 400 when missing params", async () => {
    const res = await del("/hosted-zones/Z1/record-sets?name=www.example.com.");
    expect(res.status).toBe(400);
  });

  it("POST /hosted-zones/:id/record-sets — defaults action and TTL", async () => {
    mockSend.mockResolvedValueOnce({ ChangeInfo: { Status: "PENDING" } });
    const res = await post("/hosted-zones/Z1/record-sets", {
      name: "www.example.com.",
      type: "A",
      resourceRecords: [{ Value: "1.2.3.4" }],
    });
    expect(res.status).toBe(201);
    const cmd = mockSend.mock.calls[0][0];
    const change = cmd.ChangeBatch.Changes[0];
    expect(change.Action).toBe("CREATE");
    expect(change.ResourceRecordSet.TTL).toBe(300);
  });
});

// ── Health Checks ────────────────────────────────────────

describe("Route53 routes — Health Checks", () => {
  it("GET /health-checks — returns list", async () => {
    mockSend.mockResolvedValueOnce({
      HealthChecks: [{ Id: "hc1", CallerReference: "ref1" }],
    });
    const res = await get("/health-checks");
    const json = await res.json();
    expect(json.healthChecks).toHaveLength(1);
    expect(json.total).toBe(1);
  });

  it("GET /health-checks — returns empty", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/health-checks");
    const json = await res.json();
    expect(json.healthChecks).toEqual([]);
    expect(json.total).toBe(0);
  });

  it("POST /health-checks — creates health check", async () => {
    mockSend.mockResolvedValueOnce({
      HealthCheck: { Id: "hc2", CallerReference: "ref2" },
    });
    const res = await post("/health-checks", {
      IPAddr: "1.2.3.4",
      Port: 80,
      Type: "HTTP",
      ResourcePath: "/",
    });
    expect(res.status).toBe(200);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("CreateHealthCheckCommand");
    expect(cmd.HealthCheckConfig.Type).toBe("HTTP");
    const json = await res.json();
    expect(json.healthCheck.Id).toBe("hc2");
  });

  it("DELETE /health-checks/:id — deletes health check", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/health-checks/hc2");
    expect(res.status).toBe(200);
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.__cmdName).toBe("DeleteHealthCheckCommand");
    expect(cmd.HealthCheckId).toBe("hc2");
  });

  describe("Tags + change status + DNSSEC + limits", () => {
    it("GET /tags/:type/:id — maps ResourceTagSet", async () => {
      mockSend.mockResolvedValueOnce({ ResourceTagSet: { Tags: [{ Key: "env", Value: "prod" }] } });
      const res = await get("/tags/hostedzone/z-1");
      const body = await res.json();
      expect(body.tags).toEqual([{ key: "env", value: "prod" }]);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.__cmdName).toBe("ListTagsForResourceCommand");
      expect(cmd.ResourceId).toBe("z-1");
    });

    it("GET /tags — sparse fallback", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/tags/hostedzone/z-1");
      expect((await res.json()).tags).toEqual([]);
    });

    it("POST /tags — adds via ChangeTagsForResource", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/tags/healthcheck/hc-1", { tags: { team: "dns" } });
      const body = await res.json();
      expect(body.tagged).toBe(true);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.__cmdName).toBe("ChangeTagsForResourceCommand");
      expect(cmd.AddTags).toEqual([{ Key: "team", Value: "dns" }]);
    });

    it("POST /tags — 400 without tags", async () => {
      expect((await post("/tags/hostedzone/z-1", {})).status).toBe(400);
      expect((await post("/tags/hostedzone/z-1", { tags: {} })).status).toBe(400);
    });

    it("DELETE /tags — removes via RemoveTagKeys", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await router.request("/tags/hostedzone/z-1", {
        method: "DELETE",
        body: JSON.stringify({ tagKeys: ["env"] }),
        headers: { "content-type": "application/json" },
      });
      const body = await res.json();
      expect(body.untagged).toBe(true);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.RemoveTagKeys).toEqual(["env"]);
    });

    it("DELETE /tags — 400 without tagKeys", async () => {
      const res = await router.request("/tags/hostedzone/z-1", {
        method: "DELETE",
        body: JSON.stringify({}),
        headers: { "content-type": "application/json" },
      });
      expect(res.status).toBe(400);
    });

    it("GET /changes/:id — returns change info", async () => {
      mockSend.mockResolvedValueOnce({ ChangeInfo: { Id: "C-1", Status: "INSYNC" } });
      const res = await get("/changes/C-1");
      const body = await res.json();
      expect(body.changeInfo.Status).toBe("INSYNC");
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("GetChangeCommand");
    });

    it("GET /changes/:id — null on sparse", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/changes/C-1");
      expect((await res.json()).changeInfo).toBeNull();
    });

    it("GET /hostedzones/:id/dnssec — maps status and KSKs", async () => {
      mockSend.mockResolvedValueOnce({
        Status: { ServeSignature: "NOT_SIGNING", StatusMessage: "Zone is not signing" },
        KeySigningKeys: [{ Name: "ksk-1" }],
      });
      const res = await get("/hostedzones/z-1/dnssec");
      const body = await res.json();
      expect(body.status.ServeSignature).toBe("NOT_SIGNING");
      expect(body.keySigningKeys).toHaveLength(1);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("GetDNSSECCommand");
    });

    it("GET /hostedzones/:id/dnssec — sparse fallbacks", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/hostedzones/z-1/dnssec");
      const body = await res.json();
      expect(body.status).toBeNull();
      expect(body.keySigningKeys).toEqual([]);
    });

    it("GET /account-limit/:type — returns limit and count", async () => {
      mockSend.mockResolvedValueOnce({ AccountLimit: { Type: "MAX_HOSTED_ZONES_BY_OWNER", Value: 500 }, Count: 12 });
      const res = await get("/account-limit/MAX_HOSTED_ZONES_BY_OWNER");
      const body = await res.json();
      expect(body.limit.Value).toBe(500);
      expect(body.count).toBe(12);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("GetAccountLimitCommand");
    });

    it("GET /account-limit/:type — sparse count fallback", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/account-limit/MAX_HEALTH_CHECKS_BY_OWNER");
      const body = await res.json();
      expect(body.limit).toBeNull();
      expect(body.count).toBe(0);
    });
  });
});

// ─── P1 gap audit ─────────────────────────────────────────

describe("Route53 P1 extras — sparse fallbacks", () => {
  beforeEach(() => mockSend.mockReset());

  it("list hosted zones by name — missing Config/NextDNSName/IsTruncated fall back", async () => {
    mockSend.mockResolvedValueOnce({ HostedZones: [{ Id: "hz-2", Name: "y." }], IsTruncated: true });
    const res = await router.request("/hosted-zones-by-name?dnsName=y.");
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.zones[0].private).toBe(false);
    expect(body.truncated).toBe(true);
  });

  it("list hosted zones by name — sparse response defaults truncated/dnsName", async () => {
    mockSend.mockResolvedValueOnce({});
    const body = await (await router.request("/hosted-zones-by-name")).json();
    expect(body.zones).toEqual([]);
    expect(body.total).toBe(0);
    expect(body.dnsName).toBeNull();
    expect(body.truncated).toBe(false);
  });

  it("list hosted zones by name — maxItems parses to integer", async () => {
    mockSend.mockResolvedValueOnce({ HostedZones: [] });
    await router.request("/hosted-zones-by-name?maxItems=5");
    expect(mockSend.mock.calls[0][0].MaxItems).toBe(5);
  });

  it("PUT health check — missing HealthCheck falls back to null", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await router.request("/health-checks/h-8", {
      method: "PUT",
      body: JSON.stringify({ healthThreshold: 3 }),
      headers: { "content-type": "application/json" },
    });
    expect(res.status).toBe(200);
    expect((await res.json()).healthCheck).toBeNull();
  });

  it("hosted zone count — missing count falls back to 0", async () => {
    mockSend.mockResolvedValueOnce({});
    expect((await (await router.request("/hosted-zone-count")).json()).count).toBe(0);
  });

  it("get health check — missing HealthCheck falls back to null", async () => {
    mockSend.mockResolvedValueOnce({});
    const body = await (await router.request("/health-checks/h-9")).json();
    expect(body.healthCheck).toBeNull();
  });

  it("associate-vpc — missing ChangeInfo falls back to null", async () => {
    mockSend.mockResolvedValueOnce({});
    const body = await (await post("/hosted-zones/Z1/associate-vpc", { vpcId: "v", vpcRegion: "r" })).json();
    expect(body.changeInfo).toBeNull();
  });

  it("disassociate-vpc — missing ChangeInfo falls back to null", async () => {
    mockSend.mockResolvedValueOnce({});
    const body = await (await post("/hosted-zones/Z1/disassociate-vpc", { vpcId: "v", vpcRegion: "r" })).json();
    expect(body.changeInfo).toBeNull();
  });

  it("hosted-zones-by-vpc — empty summaries fall back to empty array", async () => {
    mockSend.mockResolvedValueOnce({});
    const body = await (await get("/hosted-zones-by-vpc?vpcId=vpc-1")).json();
    expect(body.hostedZoneSummaries).toEqual([]);
    expect(body.total).toBe(0);
  });

  it("hosted-zones-by-vpc — owner null when no owning account/service", async () => {
    mockSend.mockResolvedValueOnce({ HostedZoneSummaries: [{ HostedZoneId: "Z9", Name: "z." }] });
    const body = await (await get("/hosted-zones-by-vpc?vpcId=vpc-1")).json();
    expect(body.hostedZoneSummaries[0].owner).toBeNull();
  });

  it("health check status — observation with statusReport but no region/ip", async () => {
    mockSend.mockResolvedValueOnce({
      HealthCheckObservations: [{ StatusReport: { Status: "Failure" } }],
    });
    const body = await (await get("/health-checks/H2/status")).json();
    expect(body.observations[0].region).toBeNull();
    expect(body.observations[0].ipAddress).toBeNull();
    expect(body.observations[0].statusReport.status).toBe("Failure");
  });
});

describe("Route53 P1 extras", () => {
  it("list hosted zones by name", async () => {
    mockSend.mockResolvedValueOnce({ HostedZones: [{ Id: "hz-1", Name: "x.", Config: { PrivateZone: false } }], IsTruncated: false });
    const res = await router.request("/hosted-zones-by-name?dnsName=x.");
    const body = await res.json();
    expect(body.total).toBe(1);
  });
  it("hosted zone count", async () => {
    mockSend.mockResolvedValueOnce({ HostedZoneCount: 5 });
    expect((await (await router.request("/hosted-zone-count")).json()).count).toBe(5);
  });
  it("get + update health check", async () => {
    mockSend
      .mockResolvedValueOnce({ HealthCheck: { Id: "h-1" } })
      .mockResolvedValueOnce({ HealthCheck: { Id: "h-1" } });
    expect((await router.request("/health-checks/h-1")).status).toBe(200);
    const res = await router.request("/health-checks/h-1", { method: "PUT", body: JSON.stringify({ healthThreshold: 3 }), headers: { "content-type": "application/json" } });
    expect(res.status).toBe(200);
  });
});

// ── Comment / VPC association / authorizations / limits ────

describe("Route53 — hosted zone comment and VPC association", () => {
  beforeEach(() => mockSend.mockReset());

  it("PUT /hosted-zones/:id/comment — updates comment", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await put("/hosted-zones/Z123/comment", { comment: "hello" });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.updated).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("UpdateHostedZoneCommentCommand");
    expect(mockSend.mock.calls[0][0].Comment).toBe("hello");
  });

  it("PUT /hosted-zones/:id/comment — 400 when comment not a string", async () => {
    expect((await put("/hosted-zones/Z123/comment", { comment: 5 })).status).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("POST /hosted-zones/:id/associate-vpc — associates a VPC", async () => {
    mockSend.mockResolvedValueOnce({ ChangeInfo: { Id: "ch-1", Status: "PENDING" } });
    const res = await post("/hosted-zones/Z123/associate-vpc", { vpcId: "vpc-1", vpcRegion: "us-east-1" });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.changeInfo.Id).toBe("ch-1");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("AssociateVPCWithHostedZoneCommand");
    expect(mockSend.mock.calls[0][0].VPC.VPCId).toBe("vpc-1");
  });

  it("POST /hosted-zones/:id/associate-vpc — 400 when vpc fields missing", async () => {
    expect((await post("/hosted-zones/Z123/associate-vpc", { vpcId: "vpc-1" })).status).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("POST /hosted-zones/:id/disassociate-vpc — disassociates a VPC", async () => {
    mockSend.mockResolvedValueOnce({ ChangeInfo: { Id: "ch-2" } });
    const res = await post("/hosted-zones/Z123/disassociate-vpc", { vpcId: "vpc-1", vpcRegion: "us-east-1" });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.changeInfo.Id).toBe("ch-2");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("DisassociateVPCFromHostedZoneCommand");
  });

  it("POST /hosted-zones/:id/disassociate-vpc — 400 when vpc fields missing", async () => {
    expect((await post("/hosted-zones/Z123/disassociate-vpc", {})).status).toBe(400);
  });

  it("POST /hosted-zones/:id/vpc-authorizations — creates authorization", async () => {
    mockSend.mockResolvedValueOnce({ VPC: { VPCId: "vpc-1", VPCRegion: "us-east-1" } });
    const res = await post("/hosted-zones/Z123/vpc-authorizations", { vpcId: "vpc-1", vpcRegion: "us-east-1" });
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.vpc.vpcId).toBe("vpc-1");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("CreateVPCAssociationAuthorizationCommand");
  });

  it("POST /hosted-zones/:id/vpc-authorizations — null vpc when missing", async () => {
    mockSend.mockResolvedValueOnce({});
    const body = await (await post("/hosted-zones/Z123/vpc-authorizations", { vpcId: "v", vpcRegion: "r" })).json();
    expect(body.vpc).toBeNull();
  });

  it("POST /hosted-zones/:id/vpc-authorizations — 400 when fields missing", async () => {
    expect((await post("/hosted-zones/Z123/vpc-authorizations", { vpcId: "vpc-1" })).status).toBe(400);
  });

  it("DELETE /hosted-zones/:id/vpc-authorizations — deletes authorization", async () => {
    mockSend.mockResolvedValueOnce({});
    const body = await (await del("/hosted-zones/Z123/vpc-authorizations", { vpcId: "vpc-1", vpcRegion: "us-east-1" })).json();
    expect(body.deleted).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("DeleteVPCAssociationAuthorizationCommand");
  });

  it("DELETE /hosted-zones/:id/vpc-authorizations — 400 when fields missing", async () => {
    expect((await del("/hosted-zones/Z123/vpc-authorizations", {})).status).toBe(400);
  });

  it("GET /hosted-zones/:id/vpc-authorizations — lists authorizations", async () => {
    mockSend.mockResolvedValueOnce({
      Authorizations: [{ VPCId: "vpc-1", VPCRegion: "us-east-1" }],
    });
    const res = await get("/hosted-zones/Z123/vpc-authorizations");
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.total).toBe(1);
    expect(body.authorizations[0].vpcId).toBe("vpc-1");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("ListVPCAssociationAuthorizationsCommand");
  });

  it("GET /hosted-zones/:id/vpc-authorizations — empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const body = await (await get("/hosted-zones/Z123/vpc-authorizations")).json();
    expect(body.authorizations).toEqual([]);
  });

  it("GET /hosted-zones-by-vpc — lists zones for a VPC", async () => {
    mockSend.mockResolvedValueOnce({
      HostedZoneSummaries: [{ HostedZoneId: "Z1", Name: "example.com.", Owner: { OwningAccount: "111" } }],
    });
    const res = await get("/hosted-zones-by-vpc?vpcId=vpc-1");
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.total).toBe(1);
    expect(body.hostedZoneSummaries[0].owner).toBe("111");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("ListHostedZonesByVPCCommand");
    expect(mockSend.mock.calls[0][0].VPCRegion).toBe("us-east-1");
  });

  it("GET /hosted-zones-by-vpc — owner falls back to owning service", async () => {
    mockSend.mockResolvedValueOnce({
      HostedZoneSummaries: [{ HostedZoneId: "Z1", Name: "svc.", Owner: { OwningService: "cloudmap" } }],
    });
    const body = await (await get("/hosted-zones-by-vpc?vpcId=vpc-1")).json();
    expect(body.hostedZoneSummaries[0].owner).toBe("cloudmap");
  });

  it("GET /hosted-zones-by-vpc — 400 when vpcId missing", async () => {
    expect((await get("/hosted-zones-by-vpc")).status).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("GET /health-checks/:id/status — returns observations", async () => {
    mockSend.mockResolvedValueOnce({
      HealthCheckObservations: [
        { Region: "us-east-1", IPAddress: "1.2.3.4", StatusReport: { Status: "Success", CheckedTime: "t" } },
        { Region: "us-west-2" },
      ],
    });
    const res = await get("/health-checks/H1/status");
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.total).toBe(2);
    expect(body.observations[0].statusReport.status).toBe("Success");
    expect(body.observations[1].statusReport).toBeNull();
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("GetHealthCheckStatusCommand");
  });

  it("GET /health-checks/:id/status — empty observations", async () => {
    mockSend.mockResolvedValueOnce({});
    const body = await (await get("/health-checks/H1/status")).json();
    expect(body.observations).toEqual([]);
  });

  it("GET /hosted-zones/:id/limit/:type — returns limit", async () => {
    mockSend.mockResolvedValueOnce({ Value: 500, Count: 3 });
    const res = await get("/hosted-zones/Z123/limit/MAX_VPC_ASSOCIATIONS");
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.value).toBe(500);
    expect(body.count).toBe(3);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("GetHostedZoneLimitCommand");
  });

  it("GET /hosted-zones/:id/limit/:type — null values when missing", async () => {
    mockSend.mockResolvedValueOnce({});
    const body = await (await get("/hosted-zones/Z123/limit/MAX_VPC_ASSOCIATIONS")).json();
    expect(body.value).toBeNull();
    expect(body.count).toBeNull();
  });
});
