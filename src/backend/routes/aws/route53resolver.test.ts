import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { mockSend, createCmd } = vi.hoisted(() => {
  const mockSend = vi.fn();
  const createCmd = (name: string) => function (this: any, input: any) { return { __cmd: name, ...(input || {}) }; };
  return { mockSend, createCmd };
});

vi.mock("../../clients/aws", () => ({
  create: vi.fn(() => ({ send: mockSend })),
}));

vi.mock("@aws-sdk/client-route53resolver", () => ({
  Route53ResolverClient: class {},
  CreateFirewallDomainListCommand: createCmd("CreateFirewallDomainListCommand"),
  CreateResolverEndpointCommand: createCmd("CreateResolverEndpointCommand"),
  CreateResolverRuleCommand: createCmd("CreateResolverRuleCommand"),
  DeleteFirewallDomainListCommand: createCmd("DeleteFirewallDomainListCommand"),
  DeleteResolverEndpointCommand: createCmd("DeleteResolverEndpointCommand"),
  DeleteResolverRuleCommand: createCmd("DeleteResolverRuleCommand"),
  GetFirewallDomainListCommand: createCmd("GetFirewallDomainListCommand"),
  GetResolverEndpointCommand: createCmd("GetResolverEndpointCommand"),
  GetResolverRuleAssociationCommand: createCmd("GetResolverRuleAssociationCommand"),
  GetResolverRuleCommand: createCmd("GetResolverRuleCommand"),
  ListFirewallDomainListsCommand: createCmd("ListFirewallDomainListsCommand"),
  ListResolverEndpointsCommand: createCmd("ListResolverEndpointsCommand"),
  ListResolverRuleAssociationsCommand: createCmd("ListResolverRuleAssociationsCommand"),
  ListResolverRulesCommand: createCmd("ListResolverRulesCommand"),
  UpdateResolverEndpointCommand: createCmd("UpdateResolverEndpointCommand"),
  UpdateResolverRuleCommand: createCmd("UpdateResolverRuleCommand"),
  AssociateResolverRuleCommand: createCmd("AssociateResolverRuleCommand"),
  DisassociateResolverRuleCommand: createCmd("DisassociateResolverRuleCommand"),
}));

import route53resolverRoutes from "./route53resolver";
import { Hono } from "hono";

const app = new Hono();
app.route("/", route53resolverRoutes);

const get = (path: string) => app.request(path);
const post = (path: string, json?: any) =>
  app.request(path, json === undefined ? { method: "POST" } : { method: "POST", body: JSON.stringify(json), headers: { "content-type": "application/json" } });
const patch = (path: string, json?: any) =>
  app.request(path, json === undefined ? { method: "PATCH" } : { method: "PATCH", body: JSON.stringify(json), headers: { "content-type": "application/json" } });
const del = (path: string) => app.request(path, { method: "DELETE" });

const endpoint = {
  Id: "rslvr-in-abc",
  Arn: "arn:aws:route53resolver:us-east-1:1:resolver-endpoint/rslvr-in-abc",
  Name: "in",
  Direction: "INBOUND",
  Status: "OPERATIONAL",
  IpAddressCount: 2,
  HostVPCId: "vpc-1",
  SecurityGroupIds: ["sg-1"],
  ResolverEndpointType: "IPV4",
};
const rule = {
  Id: "rslvr-rr-abc",
  Arn: "arn:aws:route53resolver:us-east-1:1:resolver-rule/rslvr-rr-abc",
  Name: "rule",
  DomainName: "example.com",
  RuleType: "FORWARD",
  Status: "COMPLETE",
  ResolverEndpointId: "rslvr-in-abc",
  TargetIps: [{ Ip: "10.0.0.1", Port: 53 }],
  ShareStatus: "NOT_SHARED",
};
const association = { Id: "rslvr-rrassoc-abc", ResolverRuleId: "rslvr-rr-abc", Name: "a", VPCId: "vpc-1", Status: "COMPLETE" };
const domainList = { Id: "rslvr-fdl-abc", Arn: "arn:aws:route53resolver:us-east-1:1:firewall-domain-list/rslvr-fdl-abc", Name: "custom", Status: "COMPLETE", DomainCount: 3 };

beforeEach(() => {
  mockSend.mockReset();
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("route53resolver — firewall domain lists", () => {
  it("GET /firewall-domain-lists maps fields and fills defaults", async () => {
    mockSend.mockResolvedValueOnce({
      FirewallDomainLists: [{ Id: "l1", Name: "AWSManagedDomainsAggregateThreatList", Arn: "arn:1" }],
    });
    const res = await get("/firewall-domain-lists");
    expect(res.status).toBe(200);
    const b = await res.json();
    expect(b.total).toBe(1);
    expect(b.domainLists[0]).toMatchObject({ id: "l1", managedOwnerName: null, status: null, domainCount: null });
  });

  it("GET /firewall-domain-lists handles undefined FirewallDomainLists", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/firewall-domain-lists");
    expect((await res.json()).domainLists).toEqual([]);
  });

  it("POST /firewall-domain-lists creates", async () => {
    mockSend.mockResolvedValueOnce({ FirewallDomainList: { Id: "rslvr-fdl-abc", Name: "custom", Status: "COMPLETE", Arn: "arn" } });
    const res = await post("/firewall-domain-lists", { name: "custom", creatorRequestId: "tok" });
    expect(res.status).toBe(201);
    expect(mockSend.mock.calls[0][0]).toMatchObject({ Name: "custom", CreatorRequestId: "tok" });
  });

  it("POST /firewall-domain-lists 400 without name", async () => {
    expect((await post("/firewall-domain-lists", {})).status).toBe(400);
  });

  it("GET /firewall-domain-lists/:id returns mapped list", async () => {
    mockSend.mockResolvedValueOnce({ FirewallDomainList: { Id: "l1", Name: "managed", Arn: "arn", ManagedOwnerName: "Route 53 Resolver DNS Firewall" } });
    const res = await get("/firewall-domain-lists/l1");
    expect((await res.json()).domainList).toMatchObject({ id: "l1", managedOwnerName: "Route 53 Resolver DNS Firewall" });
  });

  it("GET /firewall-domain-lists/:id returns null when absent", async () => {
    mockSend.mockResolvedValueOnce({});
    expect((await (await get("/firewall-domain-lists/l1")).json()).domainList).toBeNull();
  });

  it("DELETE /firewall-domain-lists/:id", async () => {
    mockSend.mockResolvedValueOnce({ FirewallDomainList: { Id: "l1", Status: "DELETING" } });
    const res = await del("/firewall-domain-lists/l1");
    expect(await res.json()).toMatchObject({ id: "l1", status: "DELETING" });
  });
});

describe("route53resolver — endpoints", () => {
  it("GET /endpoints maps fields", async () => {
    mockSend.mockResolvedValueOnce({ ResolverEndpoints: [endpoint] });
    const res = await get("/endpoints");
    const b = await res.json();
    expect(b.total).toBe(1);
    expect(b.endpoints[0]).toMatchObject({ id: "rslvr-in-abc", ipAddressCount: 2, securityGroupIds: ["sg-1"] });
  });

  it("GET /endpoints handles undefined", async () => {
    mockSend.mockResolvedValueOnce({});
    expect((await (await get("/endpoints")).json()).endpoints).toEqual([]);
  });

  it("POST /endpoints creates", async () => {
    mockSend.mockResolvedValueOnce({ ResolverEndpoint: endpoint });
    const res = await post("/endpoints", {
      name: "in", direction: "INBOUND", ipAddresses: [{ SubnetId: "subnet-1", Ip: "10.0.0.5" }], securityGroupIds: ["sg-1"],
    });
    expect(res.status).toBe(201);
    expect(mockSend.mock.calls[0][0]).toMatchObject({ Name: "in", Direction: "INBOUND" });
  });

  it("POST /endpoints 400 without name", async () => {
    expect((await post("/endpoints", { direction: "INBOUND", ipAddresses: [{ SubnetId: "s" }] })).status).toBe(400);
  });

  it("POST /endpoints 400 without direction", async () => {
    expect((await post("/endpoints", { name: "n", ipAddresses: [{ SubnetId: "s" }] })).status).toBe(400);
  });

  it("POST /endpoints 400 without IP addresses", async () => {
    expect((await post("/endpoints", { name: "n", direction: "INBOUND" })).status).toBe(400);
    expect((await post("/endpoints", { name: "n", direction: "INBOUND", ipAddresses: [] })).status).toBe(400);
  });

  it("GET /endpoints/:id maps fields", async () => {
    mockSend.mockResolvedValueOnce({ ResolverEndpoint: endpoint });
    const res = await get("/endpoints/rslvr-in-abc");
    expect((await res.json()).endpoint).toMatchObject({ id: "rslvr-in-abc", hostVpcId: "vpc-1" });
  });

  it("GET /endpoints/:id returns null when absent", async () => {
    mockSend.mockResolvedValueOnce({});
    expect((await (await get("/endpoints/x")).json()).endpoint).toBeNull();
  });

  it("PATCH /endpoints/:id sends only present fields", async () => {
    mockSend.mockResolvedValueOnce({ ResolverEndpoint: endpoint });
    const res = await patch("/endpoints/rslvr-in-abc", { name: "renamed", endpointType: "DUALSTACK" });
    expect(await res.json()).toMatchObject({ id: "rslvr-in-abc" });
    expect(mockSend.mock.calls[0][0]).toMatchObject({ Name: "renamed", ResolverEndpointType: "DUALSTACK" });
  });

  it("PATCH /endpoints/:id sends bare id when body empty", async () => {
    mockSend.mockResolvedValueOnce({ ResolverEndpoint: endpoint });
    await patch("/endpoints/rslvr-in-abc", {});
    expect(mockSend.mock.calls[0][0].Config).toBeUndefined();
    expect(mockSend.mock.calls[0][0]).toEqual({ __cmd: "UpdateResolverEndpointCommand", ResolverEndpointId: "rslvr-in-abc" });
  });

  it("PATCH /endpoints/:id tolerates invalid body", async () => {
    mockSend.mockResolvedValueOnce({ ResolverEndpoint: endpoint });
    const res = await app.request("/endpoints/rslvr-in-abc", { method: "PATCH", body: "not-json", headers: { "content-type": "application/json" } });
    expect(res.status).toBe(200);
    expect(mockSend.mock.calls[0][0].Config).toBeUndefined();
    expect(mockSend.mock.calls[0][0]).toEqual({ __cmd: "UpdateResolverEndpointCommand", ResolverEndpointId: "rslvr-in-abc" });
  });

  it("DELETE /endpoints/:id", async () => {
    mockSend.mockResolvedValueOnce({ ResolverEndpoint: { Id: "rslvr-in-abc", Status: "DELETING" } });
    expect(await (await del("/endpoints/rslvr-in-abc")).json()).toMatchObject({ status: "DELETING" });
  });
});

describe("route53resolver — rules", () => {
  it("GET /rules maps fields", async () => {
    mockSend.mockResolvedValueOnce({ ResolverRules: [rule] });
    const res = await get("/rules");
    const b = await res.json();
    expect(b.total).toBe(1);
    expect(b.rules[0]).toMatchObject({ id: "rslvr-rr-abc", ruleType: "FORWARD", targetIps: rule.TargetIps });
  });

  it("GET /rules handles undefined", async () => {
    mockSend.mockResolvedValueOnce({});
    expect((await (await get("/rules")).json()).rules).toEqual([]);
  });

  it("POST /rules creates", async () => {
    mockSend.mockResolvedValueOnce({ ResolverRule: rule });
    const res = await post("/rules", {
      name: "rule", ruleType: "FORWARD", domainName: "example.com", targetIps: rule.TargetIps, resolverEndpointId: "rslvr-in-abc",
    });
    expect(res.status).toBe(201);
    expect(mockSend.mock.calls[0][0]).toMatchObject({ Name: "rule", RuleType: "FORWARD" });
  });

  it("POST /rules 400 without name", async () => {
    expect((await post("/rules", { ruleType: "FORWARD" })).status).toBe(400);
  });

  it("POST /rules 400 without ruleType", async () => {
    expect((await post("/rules", { name: "n" })).status).toBe(400);
  });

  it("POST /rules 400 with empty targetIps", async () => {
    expect((await post("/rules", { name: "n", ruleType: "FORWARD", targetIps: [] })).status).toBe(400);
  });

  it("GET /rules/:id maps fields", async () => {
    mockSend.mockResolvedValueOnce({ ResolverRule: rule });
    const res = await get("/rules/rslvr-rr-abc");
    expect((await res.json()).rule).toMatchObject({ id: "rslvr-rr-abc", domainName: "example.com" });
  });

  it("GET /rules/:id returns null when absent", async () => {
    mockSend.mockResolvedValueOnce({});
    expect((await (await get("/rules/x")).json()).rule).toBeNull();
  });

  it("PATCH /rules/:id builds Config from present fields", async () => {
    mockSend.mockResolvedValueOnce({ ResolverRule: rule });
    const res = await patch("/rules/rslvr-rr-abc", { name: "r2", targetIps: rule.TargetIps, resolverEndpointId: "ep" });
    expect(await res.json()).toMatchObject({ id: "rslvr-rr-abc" });
    expect(mockSend.mock.calls[0][0].Config).toMatchObject({ Name: "r2", ResolverEndpointId: "ep" });
  });

  it("PATCH /rules/:id sends empty Config when body empty", async () => {
    mockSend.mockResolvedValueOnce({ ResolverRule: rule });
    await patch("/rules/rslvr-rr-abc", {});
    expect(mockSend.mock.calls[0][0].Config).toEqual({});
  });

  it("PATCH /rules/:id tolerates invalid body", async () => {
    mockSend.mockResolvedValueOnce({ ResolverRule: rule });
    const res = await app.request("/rules/rslvr-rr-abc", { method: "PATCH", body: "not-json", headers: { "content-type": "application/json" } });
    expect(res.status).toBe(200);
    expect(mockSend.mock.calls[0][0].Config).toEqual({});
  });

  it("DELETE /rules/:id", async () => {
    mockSend.mockResolvedValueOnce({ ResolverRule: { Id: "rslvr-rr-abc", Status: "DELETING" } });
    expect(await (await del("/rules/rslvr-rr-abc")).json()).toMatchObject({ status: "DELETING" });
  });
});

describe("route53resolver — rule associations", () => {
  it("GET /rule-associations maps fields", async () => {
    mockSend.mockResolvedValueOnce({ ResolverRuleAssociations: [association] });
    const res = await get("/rule-associations");
    const b = await res.json();
    expect(b.total).toBe(1);
    expect(b.associations[0]).toMatchObject({ id: "rslvr-rrassoc-abc", vpcId: "vpc-1" });
  });

  it("GET /rule-associations handles undefined", async () => {
    mockSend.mockResolvedValueOnce({});
    expect((await (await get("/rule-associations")).json()).associations).toEqual([]);
  });

  it("POST /rule-associations associates", async () => {
    mockSend.mockResolvedValueOnce({ ResolverRuleAssociation: association });
    const res = await post("/rule-associations", { resolverRuleId: "rslvr-rr-abc", vpcId: "vpc-1", name: "a" });
    expect(res.status).toBe(201);
    expect(mockSend.mock.calls[0][0]).toMatchObject({ ResolverRuleId: "rslvr-rr-abc", VPCId: "vpc-1" });
  });

  it("POST /rule-associations 400 without ruleId or vpcId", async () => {
    expect((await post("/rule-associations", { vpcId: "vpc-1" })).status).toBe(400);
    expect((await post("/rule-associations", { resolverRuleId: "r" })).status).toBe(400);
  });

  it("POST /rule-associations/disassociate disassociates", async () => {
    mockSend.mockResolvedValueOnce({ ResolverRuleAssociation: { ...association, Status: "DELETING" } });
    const res = await post("/rule-associations/disassociate", { resolverRuleId: "rslvr-rr-abc", vpcId: "vpc-1" });
    expect(await res.json()).toMatchObject({ status: "DELETING" });
  });

  it("POST /rule-associations/disassociate 400 without ruleId or vpcId", async () => {
    expect((await post("/rule-associations/disassociate", { vpcId: "vpc-1" })).status).toBe(400);
    expect((await post("/rule-associations/disassociate", { resolverRuleId: "r" })).status).toBe(400);
  });

  it("POST /rule-associations/disassociate tolerates invalid body", async () => {
    const res = await app.request("/rule-associations/disassociate", { method: "POST", body: "not-json", headers: { "content-type": "application/json" } });
    expect(res.status).toBe(400);
  });

  it("GET /rule-associations/:id maps fields", async () => {
    mockSend.mockResolvedValueOnce({ ResolverRuleAssociation: association });
    const res = await get("/rule-associations/rslvr-rrassoc-abc");
    expect((await res.json()).association).toMatchObject({ id: "rslvr-rrassoc-abc" });
  });

  it("GET /rule-associations/:id returns null when absent", async () => {
    mockSend.mockResolvedValueOnce({});
    expect((await (await get("/rule-associations/x")).json()).association).toBeNull();
  });
});

describe("route53resolver — sparse/empty response fallbacks", () => {
  it("POST creates tolerate missing result objects", async () => {
    mockSend.mockResolvedValue({});
    expect((await post("/firewall-domain-lists", { name: "x" })).status).toBe(201);
    expect((await post("/endpoints", { name: "x", direction: "INBOUND", ipAddresses: [{ SubnetId: "s" }] })).status).toBe(201);
    expect((await post("/rules", { name: "x", ruleType: "FORWARD" })).status).toBe(201);
    expect((await post("/rule-associations", { resolverRuleId: "r", vpcId: "v" })).status).toBe(201);
    expect((await post("/rule-associations/disassociate", { resolverRuleId: "r", vpcId: "v" })).status).toBe(200);
    expect((await patch("/endpoints/e", { name: "n" })).status).toBe(200);
    expect((await patch("/rules/r", { name: "n" })).status).toBe(200);
    expect((await del("/firewall-domain-lists/l")).status).toBe(200);
    expect((await del("/endpoints/e")).status).toBe(200);
    expect((await del("/rules/r")).status).toBe(200);
  });

  it("GET lists fill sparse-row defaults", async () => {
    mockSend.mockResolvedValue({
      ResolverEndpoints: [{}],
      ResolverRules: [{}],
      ResolverRuleAssociations: [{}],
    });
    const eps = await (await get("/endpoints")).json();
    expect(eps.endpoints[0]).toEqual({
      id: undefined, arn: undefined, name: null, direction: null, status: null,
      ipAddressCount: 0, hostVpcId: null, securityGroupIds: [], endpointType: null,
    });
    const rules = await (await get("/rules")).json();
    expect(rules.rules[0].targetIps).toEqual([]);
    expect(rules.rules[0].name).toBeNull();
    const assoc = await (await get("/rule-associations")).json();
    expect(assoc.associations[0].vpcId).toBeNull();
  });

  it("GET /firewall-domain-lists fills managed list defaults", async () => {
    mockSend.mockResolvedValue({ FirewallDomainLists: [{}] });
    const b = await (await get("/firewall-domain-lists")).json();
    expect(b.domainLists[0]).toEqual({
      id: undefined, arn: undefined, name: undefined,
      managedOwnerName: null, creatorRequestId: null, domainCount: null, status: null,
    });
  });

  it("GET /firewall-domain-lists/:id fills detail defaults", async () => {
    mockSend.mockResolvedValue({ FirewallDomainList: { Id: "l" } });
    const b = await (await get("/firewall-domain-lists/l")).json();
    expect(b.domainList).toMatchObject({ id: "l", managedOwnerName: null, domainCount: null, status: null });
  });

  it("GET /endpoints/:id and /rules/:id fill sparse defaults", async () => {
    mockSend.mockResolvedValue({ ResolverEndpoint: { Id: "e" } });
    const e = await (await get("/endpoints/e")).json();
    expect(e.endpoint).toMatchObject({ id: "e", name: null, ipAddressCount: 0 });
    mockSend.mockResolvedValue({ ResolverRule: { Id: "r" } });
    const r = await (await get("/rules/r")).json();
    expect(r.rule).toMatchObject({ id: "r", name: null, targetIps: [] });
  });

  it("GET /rule-associations/:id fills sparse defaults", async () => {
    mockSend.mockResolvedValue({ ResolverRuleAssociation: { Id: "a" } });
    const b = await (await get("/rule-associations/a")).json();
    expect(b.association).toMatchObject({ id: "a", name: null, vpcId: null });
  });

  it("POST /endpoints defaults empty securityGroupIds", async () => {
    mockSend.mockResolvedValue({ ResolverEndpoint: endpoint });
    await post("/endpoints", { name: "x", direction: "INBOUND", ipAddresses: [{ SubnetId: "s" }] });
    expect(mockSend.mock.calls[0][0]).toMatchObject({ SecurityGroupIds: [] });
  });
});
