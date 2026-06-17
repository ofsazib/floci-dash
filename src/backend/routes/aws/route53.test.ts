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

async function del(path: string) {
  return router.request(path, { method: "DELETE" });
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

  it("DELETE /hosted-zones/:id/record-sets — deletes record", async () => {
    mockSend.mockResolvedValueOnce({ ChangeInfo: { Status: "INSYNC" } });
    const res = await del("/hosted-zones/Z1/record-sets?name=www.example.com.&type=A");
    const json = await res.json();
    expect(json.changeInfo.Status).toBe("INSYNC");
  });

  it("DELETE /hosted-zones/:id/record-sets — 400 when missing params", async () => {
    const res = await del("/hosted-zones/Z1/record-sets?name=www.example.com.");
    expect(res.status).toBe(400);
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
});
