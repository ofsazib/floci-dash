import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { mockSend, createCmd } = vi.hoisted(() => {
  const mockSend = vi.fn();
  const createCmd = (name: string) => function (this: any, input: any) { return { __cmd: name, ...(input || {}) }; };
  return { mockSend, createCmd };
});

vi.mock("../../clients/aws", () => ({
  create: vi.fn(() => ({ send: mockSend })),
}));

vi.mock("@aws-sdk/client-network-firewall", () => ({
  NetworkFirewallClient: class {},
  AssociateAvailabilityZonesCommand: createCmd("AssociateAvailabilityZonesCommand"),
  AssociateFirewallPolicyCommand: createCmd("AssociateFirewallPolicyCommand"),
  AssociateSubnetsCommand: createCmd("AssociateSubnetsCommand"),
  CreateFirewallCommand: createCmd("CreateFirewallCommand"),
  CreateFirewallPolicyCommand: createCmd("CreateFirewallPolicyCommand"),
  CreateRuleGroupCommand: createCmd("CreateRuleGroupCommand"),
  DeleteFirewallCommand: createCmd("DeleteFirewallCommand"),
  DeleteFirewallPolicyCommand: createCmd("DeleteFirewallPolicyCommand"),
  DeleteRuleGroupCommand: createCmd("DeleteRuleGroupCommand"),
  DescribeFirewallCommand: createCmd("DescribeFirewallCommand"),
  DescribeFirewallPolicyCommand: createCmd("DescribeFirewallPolicyCommand"),
  DescribeLoggingConfigurationCommand: createCmd("DescribeLoggingConfigurationCommand"),
  DescribeRuleGroupCommand: createCmd("DescribeRuleGroupCommand"),
  DisassociateAvailabilityZonesCommand: createCmd("DisassociateAvailabilityZonesCommand"),
  DisassociateSubnetsCommand: createCmd("DisassociateSubnetsCommand"),
  ListFirewallPoliciesCommand: createCmd("ListFirewallPoliciesCommand"),
  ListFirewallsCommand: createCmd("ListFirewallsCommand"),
  ListRuleGroupsCommand: createCmd("ListRuleGroupsCommand"),
  UpdateAvailabilityZoneChangeProtectionCommand: createCmd("UpdateAvailabilityZoneChangeProtectionCommand"),
  UpdateFirewallAnalysisSettingsCommand: createCmd("UpdateFirewallAnalysisSettingsCommand"),
  UpdateFirewallDeleteProtectionCommand: createCmd("UpdateFirewallDeleteProtectionCommand"),
  UpdateFirewallDescriptionCommand: createCmd("UpdateFirewallDescriptionCommand"),
  UpdateFirewallPolicyChangeProtectionCommand: createCmd("UpdateFirewallPolicyChangeProtectionCommand"),
  UpdateFirewallPolicyCommand: createCmd("UpdateFirewallPolicyCommand"),
  UpdateLoggingConfigurationCommand: createCmd("UpdateLoggingConfigurationCommand"),
  UpdateRuleGroupCommand: createCmd("UpdateRuleGroupCommand"),
  UpdateSubnetChangeProtectionCommand: createCmd("UpdateSubnetChangeProtectionCommand"),
}));

import networkfirewallRoutes from "./networkfirewall";
import { Hono } from "hono";

const app = new Hono();
app.route("/", networkfirewallRoutes);

const get = (path: string) => app.request(path);
const post = (path: string, json?: any) =>
  app.request(path, json === undefined ? { method: "POST" } : { method: "POST", body: JSON.stringify(json), headers: { "content-type": "application/json" } });
const put = (path: string, json?: any) =>
  app.request(path, json === undefined ? { method: "PUT" } : { method: "PUT", body: JSON.stringify(json), headers: { "content-type": "application/json" } });
const del = (path: string) => app.request(path, { method: "DELETE" });

beforeEach(() => {
  mockSend.mockReset();
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("networkfirewall — firewalls", () => {
  it("GET /firewalls maps and handles sparse/undefined", async () => {
    mockSend.mockResolvedValueOnce({
      Firewalls: [{ FirewallName: "fw", Arn: "arn:fw", FirewallPolicyArn: "arn:pol", VpcId: "vpc-1", SubnetMappings: [{ SubnetId: "subnet-1" }] }],
    });
    const b = await (await get("/firewalls")).json();
    expect(b.total).toBe(1);
    expect(b.firewalls[0]).toEqual({
      name: "fw", arn: "arn:fw", policyArn: "arn:pol", vpcId: "vpc-1",
      subnetMappings: [{ SubnetId: "subnet-1" }],
    });
    mockSend.mockResolvedValueOnce({});
    expect((await (await get("/firewalls")).json()).firewalls).toEqual([]);
    mockSend.mockResolvedValueOnce({ Firewalls: [{}] });
    const b2 = await (await get("/firewalls")).json();
    expect(b2.firewalls[0]).toEqual({ name: null, arn: undefined, policyArn: null, vpcId: null, subnetMappings: [] });
  });

  it("POST /firewalls creates and validates", async () => {
    mockSend.mockResolvedValueOnce({ Firewall: { FirewallName: "fw" }, FirewallStatus: { Status: "PROVISIONING" } });
    const res = await post("/firewalls", {
      name: "fw",
      vpcId: "vpc-1",
      subnetMappings: ["subnet-1", { SubnetId: "subnet-2" }],
      policyArn: "arn:pol",
      description: "d",
    });
    expect(res.status).toBe(201);
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      FirewallName: "fw",
      VpcId: "vpc-1",
      SubnetMappings: [{ SubnetId: "subnet-1" }, { SubnetId: "subnet-2" }],
      FirewallPolicyArn: "arn:pol",
    });
    expect((await post("/firewalls", { vpcId: "vpc" })).status).toBe(400);
    expect((await post("/firewalls", { name: "fw" })).status).toBe(400);
    expect((await post("/firewalls", { name: "fw", vpcId: "vpc" })).status).toBe(400);
  });

  it("GET/DELETE /firewalls/detail accept arn or name", async () => {
    mockSend.mockResolvedValueOnce({ Firewall: { FirewallName: "fw" }, FirewallStatus: {} });
    const b = await (await get("/firewalls/detail?name=fw")).json();
    expect(b.firewall).toMatchObject({ FirewallName: "fw" });
    mockSend.mockResolvedValueOnce({ Firewall: null });
    const b2 = await (await get("/firewalls/detail?arn=x")).json();
    expect(b2.firewall).toBeNull();
    expect((await get("/firewalls/detail")).status).toBe(400);
    mockSend.mockResolvedValueOnce({ Firewall: {} });
    expect(await (await del("/firewalls?name=fw")).json()).toEqual({ firewall: {} });
    expect((await del("/firewalls")).status).toBe(400);
  });

  it("protection routes dispatch per kind and validate", async () => {
    for (const path of [
      "/firewalls/delete-protection",
      "/firewalls/policy-change-protection",
      "/firewalls/subnet-change-protection",
      "/firewalls/az-change-protection",
    ]) {
      mockSend.mockResolvedValueOnce({ FirewallArn: "arn:fw", UpdateToken: "tok" });
      const res = await put(path, { name: "fw", enabled: true });
      expect(await res.json()).toEqual({ firewallArn: "arn:fw", updateToken: "tok" });
      expect(mockSend.mock.calls.at(-1)![0].Enabled).toBe(true);
      expect((await put(path, {})).status).toBe(400);
    }
    mockSend.mockResolvedValueOnce({ FirewallArn: "arn:fw" });
    const res = await put("/firewalls/delete-protection", { arn: "arn:fw", enabled: false });
    expect(await res.json()).toEqual({ firewallArn: "arn:fw", updateToken: undefined });
  });

  it("description route sends empty string when unset", async () => {
    mockSend.mockResolvedValueOnce({ FirewallArn: "arn:fw" });
    await put("/firewalls/description", { name: "fw", description: "hello" });
    expect(mockSend.mock.calls[0][0].Description).toBe("hello");
    mockSend.mockResolvedValueOnce({ FirewallArn: "arn:fw" });
    await put("/firewalls/description", { arn: "arn:fw" });
    expect(mockSend.mock.calls[1][0].Description).toBe("");
  });

  it("analysis settings route validates", async () => {
    mockSend.mockResolvedValueOnce({ FirewallAnalysisSettings: { EnabledAnalysisTypes: ["TLSInspection"] } });
    const b = await (await put("/firewalls/analysis-settings", {
      name: "fw",
      analysisSettings: '["TLSInspection"]',
    })).json();
    expect(b.analysisSettings).toMatchObject({ EnabledAnalysisTypes: ["TLSInspection"] });
    expect(mockSend.mock.calls[0][0].EnabledAnalysisTypes).toEqual(["TLSInspection"]);
    mockSend.mockResolvedValueOnce({});
    await put("/firewalls/analysis-settings", { name: "fw" });
    expect(mockSend.mock.calls[1][0].EnabledAnalysisTypes).toBeUndefined();
    expect((await put("/firewalls/analysis-settings", {})).status).toBe(400);
    expect((await put("/firewalls/analysis-settings", { name: "fw", analysisSettings: "{bad" })).status).toBe(400);
  });

  it("subnet/zone association routes validate", async () => {
    mockSend.mockResolvedValue({ Subnets: ["subnet-1"], AvailabilityZones: ["az-1"], UpdateToken: "t" });
    const b1 = await (await post("/firewalls/subnets/associate", { name: "fw", subnetIds: ["subnet-1"] })).json();
    expect(b1.subnets).toEqual(["subnet-1"]);
    const b2 = await (await post("/firewalls/subnets/disassociate", { arn: "arn:fw", subnetIds: ["subnet-1"] })).json();
    expect(b2.subnets).toEqual(["subnet-1"]);
    expect((await post("/firewalls/subnets/associate", {})).status).toBe(400);
    expect((await post("/firewalls/subnets/disassociate", { name: "fw" })).status).toBe(400);
    const b3 = await (await post("/firewalls/zones/associate", { name: "fw", zoneMappings: [] })).json();
    expect(b3.availabilityZones).toEqual(["az-1"]);
    expect((await post("/firewalls/zones/associate", {})).status).toBe(400);
    expect((await post("/firewalls/zones/disassociate", { name: "fw" })).status).toBe(200);
  });

  it("policy association validates", async () => {
    mockSend.mockResolvedValueOnce({ FirewallArn: "arn:fw", FirewallPolicyArn: "arn:pol" });
    const res = await put("/firewalls/policy", { name: "fw", policyArn: "arn:pol" });
    expect(await res.json()).toEqual({ firewallArn: "arn:fw", firewallPolicyArn: "arn:pol" });
    expect((await put("/firewalls/policy", { name: "fw" })).status).toBe(400);
    expect((await put("/firewalls/policy", { policyArn: "arn:pol" })).status).toBe(400);
  });

  it("logging routes accept object, JSON string, and validate", async () => {
    mockSend.mockResolvedValue({ LoggingConfiguration: { LogDestinationConfigs: [] } });
    const b1 = await (await put("/firewalls/logging", { name: "fw", loggingConfiguration: { LogDestinationConfigs: [] } })).json();
    expect(b1.loggingConfiguration).toEqual({ LogDestinationConfigs: [] });
    await put("/firewalls/logging", { name: "fw", loggingConfiguration: '{"LogDestinationConfigs":[]}' });
    expect(mockSend.mock.calls[1][0].LoggingConfiguration).toEqual({ LogDestinationConfigs: [] });
    await put("/firewalls/logging", { name: "fw" });
    expect(mockSend.mock.calls[2][0].LoggingConfiguration).toBeUndefined();
    expect((await put("/firewalls/logging", { name: "fw", loggingConfiguration: "{bad" })).status).toBe(400);
    expect((await put("/firewalls/logging", {})).status).toBe(400);
    const b2 = await (await get("/firewalls/logging?name=fw")).json();
    expect(b2.loggingConfiguration).toEqual({ LogDestinationConfigs: [] });
    expect((await get("/firewalls/logging")).status).toBe(400);
  });
});

describe("networkfirewall — policies", () => {
  it("GET /policies maps, handles undefined and sparse", async () => {
    mockSend.mockResolvedValueOnce({ FirewallPolicies: [{ Name: "p", Arn: "arn:p" }] });
    const b = await (await get("/policies")).json();
    expect(b.total).toBe(1);
    expect(b.policies[0]).toEqual({ name: "p", arn: "arn:p" });
    mockSend.mockResolvedValueOnce({});
    expect((await (await get("/policies")).json()).policies).toEqual([]);
    mockSend.mockResolvedValueOnce({ FirewallPolicies: [{}] });
    const b2 = await (await get("/policies")).json();
    expect(b2.policies[0]).toEqual({ name: null, arn: undefined });
  });

  it("POST /policies creates with defaults", async () => {
    mockSend.mockResolvedValueOnce({ FirewallPolicyResponse: { FirewallPolicyName: "p" } });
    const res = await post("/policies", { name: "p" });
    expect(res.status).toBe(201);
    expect(mockSend.mock.calls[0][0].FirewallPolicy).toEqual({
      StatelessDefaultActions: ["aws:forward_to_sfe"],
      StatelessFragmentDefaultActions: ["aws:forward_to_sfe"],
    });
    expect((await post("/policies", {})).status).toBe(400);
  });

  it("GET/PUT/DELETE /policies validate refs", async () => {
    mockSend.mockResolvedValueOnce({ FirewallPolicyResponse: { FirewallPolicyName: "p" }, FirewallPolicy: {} });
    const b = await (await get("/policies/detail?name=p")).json();
    expect(b.policyResponse).toMatchObject({ FirewallPolicyName: "p" });
    expect((await get("/policies/detail")).status).toBe(400);

    mockSend.mockResolvedValueOnce({ FirewallPolicyResponse: {} });
    const res = await put("/policies", { arn: "arn:p", firewallPolicy: { StatelessDefaultActions: ["x"] } });
    expect(await res.json()).toEqual({ policyResponse: {} });
    expect((await put("/policies", {})).status).toBe(400);

    mockSend.mockResolvedValueOnce({});
    expect(await (await del("/policies?arn=arn:p")).json()).toEqual({ ok: true });
    expect((await del("/policies")).status).toBe(400);
  });
});

describe("networkfirewall — rule groups", () => {
  it("GET /rule-groups filters by type, handles undefined and sparse", async () => {
    mockSend.mockResolvedValueOnce({ RuleGroups: [{ Name: "g", Arn: "arn:g", Type: "STATEFUL" }] });
    const b = await (await get("/rule-groups?type=STATEFUL")).json();
    expect(b.total).toBe(1);
    expect(mockSend.mock.calls[0][0]).toMatchObject({ Type: "STATEFUL" });
    mockSend.mockResolvedValueOnce({});
    expect((await (await get("/rule-groups")).json()).ruleGroups).toEqual([]);
    mockSend.mockResolvedValueOnce({ RuleGroups: [{}] });
    const b2 = await (await get("/rule-groups")).json();
    expect(b2.ruleGroups[0]).toEqual({ name: null, arn: undefined, type: null });
  });

  it("POST /rule-groups creates and validates", async () => {
    mockSend.mockResolvedValueOnce({ RuleGroupResponse: { RuleGroupName: "g" } });
    const res = await post("/rule-groups", {
      name: "g",
      type: "STATEFUL",
      capacity: 100,
      ruleGroup: '{"rulesSource":{"rulesString":"pass all"}}',
    });
    expect(res.status).toBe(201);
    expect(mockSend.mock.calls[0][0]).toMatchObject({
      RuleGroupName: "g", Type: "STATEFUL", Capacity: 100,
      RuleGroup: { rulesSource: { rulesString: "pass all" } },
    });
    expect((await post("/rule-groups", { type: "STATEFUL", capacity: 1 })).status).toBe(400);
    expect((await post("/rule-groups", { name: "g", capacity: 1 })).status).toBe(400);
    expect((await post("/rule-groups", { name: "g", type: "STATEFUL" })).status).toBe(400);
    expect((await post("/rule-groups", { name: "g", type: "STATEFUL", capacity: 1, ruleGroup: "{bad" })).status).toBe(400);
  });

  it("routes tolerate undefined SDK results", async () => {
    mockSend.mockResolvedValue(undefined);
    expect((await (await put("/firewalls/logging", { name: "fw", loggingConfiguration: "{}" })).json()).loggingConfiguration).toBeNull();
    expect((await (await get("/firewalls/logging?name=fw")).json()).loggingConfiguration).toBeNull();
    const b1 = await (await post("/firewalls/subnets/associate", { name: "fw", subnetIds: ["s"] })).json();
    expect(b1.subnets).toEqual([]);
    const b2 = await (await post("/firewalls/zones/associate", { name: "fw", zoneMappings: [] })).json();
    expect(b2.availabilityZones).toEqual([]);
    const b3 = await (await get("/policies/detail?name=p")).json();
    expect(b3.policyResponse).toBeNull();
    expect(b3.policy).toBeNull();
    const b4 = await (await put("/policies", { name: "p" })).json();
    expect(b4.policyResponse).toBeUndefined();
    const b5 = await (await get("/rule-groups/detail?name=g")).json();
    expect(b5.ruleGroupResponse).toBeNull();
    expect(b5.ruleGroup).toBeNull();
    const b6 = await (await put("/rule-groups", { name: "g" })).json();
    expect(b6.ruleGroupResponse).toBeUndefined();
    const b7 = await (await post("/rule-groups", { name: "g", type: "STATEFUL", capacity: 1 })).json();
    expect(b7.ruleGroupResponse).toBeUndefined();
    await post("/firewalls", { name: "fw", vpcId: "vpc", subnetMappings: ["s"] });
    const createCall = mockSend.mock.calls.at(-1)![0];
    expect(createCall.FirewallPolicyArn).toBeUndefined();
    expect(createCall.Description).toBeUndefined();
    const bad = await app.request("/firewalls", { method: "POST", body: "not-json", headers: { "content-type": "application/json" } });
    expect(bad.status).toBe(400);
  });

  it("GET/PUT/DELETE /rule-groups validate refs", async () => {
    mockSend.mockResolvedValueOnce({ RuleGroupResponse: {}, RuleGroup: { rulesSource: {} } });
    const b = await (await get("/rule-groups/detail?name=g")).json();
    expect(b.ruleGroup).toMatchObject({ rulesSource: {} });
    expect((await get("/rule-groups/detail")).status).toBe(400);

    mockSend.mockResolvedValueOnce({ RuleGroupResponse: {} });
    const res = await put("/rule-groups", { arn: "arn:g", ruleGroup: '{"rulesSource":{}}' });
    expect(await res.json()).toEqual({ ruleGroupResponse: {} });
    expect((await put("/rule-groups", {})).status).toBe(400);
    expect((await put("/rule-groups", { arn: "arn:g", ruleGroup: "{bad" })).status).toBe(400);

    mockSend.mockResolvedValueOnce({});
    expect(await (await del("/rule-groups?name=g")).json()).toEqual({ ok: true });
    expect((await del("/rule-groups")).status).toBe(400);
  });
});
