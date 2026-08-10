import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const mockWaf = vi.hoisted(() =>
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

vi.mock("@aws-sdk/client-wafv2", () => ({
  WAFV2Client: mockWaf,
  ListWebACLsCommand: createCmd("ListWebACLsCommand"),
  CreateWebACLCommand: createCmd("CreateWebACLCommand"),
  GetWebACLCommand: createCmd("GetWebACLCommand"),
  DeleteWebACLCommand: createCmd("DeleteWebACLCommand"),
  ListIPSetsCommand: createCmd("ListIPSetsCommand"),
  CreateIPSetCommand: createCmd("CreateIPSetCommand"),
  GetIPSetCommand: createCmd("GetIPSetCommand"),
  UpdateIPSetCommand: createCmd("UpdateIPSetCommand"),
  DeleteIPSetCommand: createCmd("DeleteIPSetCommand"),
  ListRegexPatternSetsCommand: createCmd("ListRegexPatternSetsCommand"),
  CreateRegexPatternSetCommand: createCmd("CreateRegexPatternSetCommand"),
  GetRegexPatternSetCommand: createCmd("GetRegexPatternSetCommand"),
  UpdateRegexPatternSetCommand: createCmd("UpdateRegexPatternSetCommand"),
  DeleteRegexPatternSetCommand: createCmd("DeleteRegexPatternSetCommand"),
  ListRuleGroupsCommand: createCmd("ListRuleGroupsCommand"),
  CreateRuleGroupCommand: createCmd("CreateRuleGroupCommand"),
  GetRuleGroupCommand: createCmd("GetRuleGroupCommand"),
  UpdateRuleGroupCommand: createCmd("UpdateRuleGroupCommand"),
  DeleteRuleGroupCommand: createCmd("DeleteRuleGroupCommand"),
  ListTagsForResourceCommand: createCmd("ListTagsForResourceCommand"),
  TagResourceCommand: createCmd("TagResourceCommand"),
  UntagResourceCommand: createCmd("UntagResourceCommand"),
  ListLoggingConfigurationsCommand: createCmd("ListLoggingConfigurationsCommand"),
  GetLoggingConfigurationCommand: createCmd("GetLoggingConfigurationCommand"),
  PutLoggingConfigurationCommand: createCmd("PutLoggingConfigurationCommand"),
  DeleteLoggingConfigurationCommand: createCmd("DeleteLoggingConfigurationCommand"),
  AssociateWebACLCommand: createCmd("AssociateWebACLCommand"),
  DisassociateWebACLCommand: createCmd("DisassociateWebACLCommand"),
  GetWebACLForResourceCommand: createCmd("GetWebACLForResourceCommand"),
  ListResourcesForWebACLCommand: createCmd("ListResourcesForWebACLCommand"),
  GetPermissionPolicyCommand: createCmd("GetPermissionPolicyCommand"),
  PutPermissionPolicyCommand: createCmd("PutPermissionPolicyCommand"),
  DeletePermissionPolicyCommand: createCmd("DeletePermissionPolicyCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: () => ({ send: mockSend }),
}));

import router from "./wafv2";

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

beforeEach(() => {
  mockSend.mockReset();
});

describe("WAFv2 Routes — Web ACLs", () => {
  it("GET /web-acls — lists web ACLs", async () => {
    mockSend.mockResolvedValueOnce({ WebACLs: [{ Name: "acl1", Id: "id-1" }] });
    const res = await get("/web-acls?scope=REGIONAL");
    const json = await res.json();
    expect(json.webAcls).toHaveLength(1);
    expect(json.total).toBe(1);
    expect(json.webAcls[0].Name).toBe("acl1");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("ListWebACLsCommand");
    expect(mockSend.mock.calls[0][0].Scope).toBe("REGIONAL");
  });

  it("GET /web-acls — defaults to REGIONAL scope", async () => {
    mockSend.mockResolvedValueOnce({ WebACLs: [] });
    await get("/web-acls");
    expect(mockSend.mock.calls[0][0].Scope).toBe("REGIONAL");
  });

  it("GET /web-acls — returns empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/web-acls");
    const json = await res.json();
    expect(json.webAcls).toEqual([]);
    expect(json.total).toBe(0);
  });

  it("POST /web-acls — creates web ACL", async () => {
    mockSend.mockResolvedValueOnce({ Summary: { Name: "new-acl", Id: "id-new" } });
    const res = await post("/web-acls", { Name: "new-acl", Scope: "REGIONAL" });
    const json = await res.json();
    expect(json.created).toBe(true);
    expect(json.summary.Name).toBe("new-acl");
    expect(res.status).toBe(201);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("CreateWebACLCommand");
    expect(mockSend.mock.calls[0][0].Name).toBe("new-acl");
    expect(mockSend.mock.calls[0][0].Scope).toBe("REGIONAL");
  });

  it("POST /web-acls — 400 when Name missing", async () => {
    const res = await post("/web-acls", { Scope: "REGIONAL" });
    expect(res.status).toBe(400);
  });

  it("POST /web-acls — 400 when Scope missing", async () => {
    const res = await post("/web-acls", { Name: "test" });
    expect(res.status).toBe(400);
  });

  it("POST /web-acls/delete — deletes web ACL", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/web-acls/delete", { Id: "id-1", Name: "acl1", Scope: "REGIONAL", LockToken: "lock-1" });
    const json = await res.json();
    expect(json.deleted).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("DeleteWebACLCommand");
    expect(mockSend.mock.calls[0][0].Id).toBe("id-1");
    expect(mockSend.mock.calls[0][0].LockToken).toBe("lock-1");
  });

  it("POST /web-acls/delete — 400 when missing params", async () => {
    const res = await post("/web-acls/delete", { Id: "id-1" });
    expect(res.status).toBe(400);
  });

  it("POST /web-acls/delete — 400 when LockToken missing", async () => {
    const res = await post("/web-acls/delete", { Id: "id-1", Name: "acl1", Scope: "REGIONAL" });
    expect(res.status).toBe(400);
  });

  it("GET /web-acls/:id — gets web ACL", async () => {
    mockSend.mockResolvedValueOnce({ WebACL: { Name: "acl1", Id: "id-1", DefaultAction: { Allow: {} } } });
    const res = await get("/web-acls/id-1?name=acl1&scope=REGIONAL");
    const json = await res.json();
    expect(json.webAcl.Name).toBe("acl1");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("GetWebACLCommand");
    expect(mockSend.mock.calls[0][0].Id).toBe("id-1");
    expect(mockSend.mock.calls[0][0].Name).toBe("acl1");
    expect(mockSend.mock.calls[0][0].Scope).toBe("REGIONAL");
  });

  it("GET /web-acls/:id — defaults to REGIONAL scope", async () => {
    mockSend.mockResolvedValueOnce({ WebACL: { Name: "acl1", Id: "id-1" } });
    await get("/web-acls/id-1?name=acl1");
    expect(mockSend.mock.calls[0][0].Scope).toBe("REGIONAL");
  });

  it("GET /web-acls/:id — 400 when name missing", async () => {
    const res = await get("/web-acls/id-1?scope=REGIONAL");
    expect(res.status).toBe(400);
  });
});

describe("WAFv2 Routes — IP Sets", () => {
  it("GET /ip-sets — lists IP sets", async () => {
    mockSend.mockResolvedValueOnce({ IPSets: [{ Name: "set1", Id: "id-1" }] });
    const res = await get("/ip-sets?scope=CLOUDFRONT");
    const json = await res.json();
    expect(json.ipSets).toHaveLength(1);
    expect(mockSend.mock.calls[0][0].Scope).toBe("CLOUDFRONT");
  });

  it("GET /ip-sets — returns empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/ip-sets");
    const json = await res.json();
    expect(json.ipSets).toEqual([]);
    expect(json.total).toBe(0);
  });

  it("POST /ip-sets — creates IP set", async () => {
    mockSend.mockResolvedValueOnce({ Summary: { Name: "new-set" } });
    const res = await post("/ip-sets", { Name: "new-set", Scope: "REGIONAL", Addresses: ["192.168.0.0/24"] });
    const json = await res.json();
    expect(json.created).toBe(true);
    expect(res.status).toBe(201);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("CreateIPSetCommand");
    expect(mockSend.mock.calls[0][0].IPAddressVersion).toBe("IPV4");
  });

  it("POST /ip-sets — creates IP set without addresses", async () => {
    mockSend.mockResolvedValueOnce({ Summary: { Name: "new-set" } });
    const res = await post("/ip-sets", { Name: "new-set", Scope: "REGIONAL" });
    expect(res.status).toBe(201);
    expect(mockSend.mock.calls[0][0].Addresses).toEqual([]);
  });

  it("POST /ip-sets — 400 when Name missing", async () => {
    const res = await post("/ip-sets", { Scope: "REGIONAL" });
    expect(res.status).toBe(400);
  });

  it("POST /ip-sets — 400 when Scope missing", async () => {
    const res = await post("/ip-sets", { Name: "test" });
    expect(res.status).toBe(400);
  });

  it("GET /ip-sets/:id — gets IP set", async () => {
    mockSend.mockResolvedValueOnce({ IPSet: { Name: "set1", Id: "id-1", Addresses: ["10.0.0.0/24"] } });
    const res = await get("/ip-sets/id-1?name=set1&scope=REGIONAL");
    const json = await res.json();
    expect(json.ipSet.Name).toBe("set1");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("GetIPSetCommand");
    expect(mockSend.mock.calls[0][0].Id).toBe("id-1");
    expect(mockSend.mock.calls[0][0].Name).toBe("set1");
    expect(mockSend.mock.calls[0][0].Scope).toBe("REGIONAL");
  });

  it("GET /ip-sets/:id — 400 when name missing", async () => {
    const res = await get("/ip-sets/id-1");
    expect(res.status).toBe(400);
  });

  it("PUT /ip-sets/:id — updates IP set", async () => {
    mockSend.mockResolvedValueOnce({ LockToken: "lock-2" });
    const res = await router.request("/ip-sets/id-1", {
      method: "PUT",
      body: JSON.stringify({ Name: "set1", Scope: "REGIONAL", LockToken: "lock-1", Addresses: ["192.168.1.0/24"] }),
      headers: { "content-type": "application/json" },
    });
    const json = await res.json();
    expect(json.updated).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("UpdateIPSetCommand");
    expect(mockSend.mock.calls[0][0].Id).toBe("id-1");
    expect(mockSend.mock.calls[0][0].LockToken).toBe("lock-1");
    expect(mockSend.mock.calls[0][0].Addresses).toEqual(["192.168.1.0/24"]);
  });

  it("PUT /ip-sets/:id — updates IP set without addresses", async () => {
    mockSend.mockResolvedValueOnce({ LockToken: "lock-2" });
    const res = await router.request("/ip-sets/id-1", {
      method: "PUT",
      body: JSON.stringify({ Name: "set1", Scope: "REGIONAL", LockToken: "lock-1" }),
      headers: { "content-type": "application/json" },
    });
    expect(res.status).toBe(200);
    expect(mockSend.mock.calls[0][0].Addresses).toEqual([]);
  });

  it("PUT /ip-sets/:id — 400 when LockToken missing", async () => {
    const res = await router.request("/ip-sets/id-1", {
      method: "PUT",
      body: JSON.stringify({ Name: "set1", Scope: "REGIONAL" }),
      headers: { "content-type": "application/json" },
    });
    expect(res.status).toBe(400);
  });

  it("POST /ip-sets/delete — 400 when LockToken missing", async () => {
    const res = await post("/ip-sets/delete", { Id: "id-1", Name: "set1", Scope: "REGIONAL" });
    expect(res.status).toBe(400);
  });

  it("POST /ip-sets/delete — deletes IP set", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/ip-sets/delete", { Id: "id-1", Name: "set1", Scope: "REGIONAL", LockToken: "lock-1" });
    const json = await res.json();
    expect(json.deleted).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("DeleteIPSetCommand");
  });

  it("POST /ip-sets/delete — 400 when missing params", async () => {
    const res = await post("/ip-sets/delete", {});
    expect(res.status).toBe(400);
  });
});

describe("WAFv2 Routes — Regex Pattern Sets", () => {
  it("GET /regex-pattern-sets — lists", async () => {
    mockSend.mockResolvedValueOnce({ RegexPatternSets: [{ Name: "rx1", Id: "id-1" }] });
    const res = await get("/regex-pattern-sets");
    const json = await res.json();
    expect(json.regexPatternSets).toHaveLength(1);
  });

  it("GET /regex-pattern-sets — empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/regex-pattern-sets");
    const json = await res.json();
    expect(json.regexPatternSets).toEqual([]);
  });

  it("POST /regex-pattern-sets — creates", async () => {
    mockSend.mockResolvedValueOnce({ Summary: { Name: "rx-new" } });
    const res = await post("/regex-pattern-sets", { Name: "rx-new", Scope: "REGIONAL" });
    expect(res.status).toBe(201);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("CreateRegexPatternSetCommand");
    expect(mockSend.mock.calls[0][0].RegularExpressionList).toEqual([]);
  });

  it("POST /regex-pattern-sets — 400 when Name missing", async () => {
    const res = await post("/regex-pattern-sets", { Scope: "REGIONAL" });
    expect(res.status).toBe(400);
  });

  it("POST /regex-pattern-sets — 400 when Scope missing", async () => {
    const res = await post("/regex-pattern-sets", { Name: "rx1" });
    expect(res.status).toBe(400);
  });

  it("GET /regex-pattern-sets/:id — gets one", async () => {
    mockSend.mockResolvedValueOnce({ RegexPatternSet: { Name: "rx1", Id: "id-1", RegularExpressionList: [{ RegexString: ".*" }] } });
    const res = await get("/regex-pattern-sets/id-1?name=rx1&scope=REGIONAL");
    const json = await res.json();
    expect(json.regexPatternSet.Name).toBe("rx1");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("GetRegexPatternSetCommand");
    expect(mockSend.mock.calls[0][0].Id).toBe("id-1");
    expect(mockSend.mock.calls[0][0].Name).toBe("rx1");
    expect(mockSend.mock.calls[0][0].Scope).toBe("REGIONAL");
  });

  it("GET /regex-pattern-sets/:id — 400 when name missing", async () => {
    const res = await get("/regex-pattern-sets/id-1");
    expect(res.status).toBe(400);
  });

  it("PUT /regex-pattern-sets/:id — updates", async () => {
    mockSend.mockResolvedValueOnce({ NextLockToken: "lock-2" });
    const res = await router.request("/regex-pattern-sets/id-1", {
      method: "PUT",
      body: JSON.stringify({ Name: "rx1", Scope: "REGIONAL", LockToken: "lock-1", RegularExpressionList: [{ RegexString: ".*foo.*" }] }),
      headers: { "content-type": "application/json" },
    });
    const json = await res.json();
    expect(json.updated).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("UpdateRegexPatternSetCommand");
    expect(mockSend.mock.calls[0][0].Id).toBe("id-1");
    expect(mockSend.mock.calls[0][0].LockToken).toBe("lock-1");
    expect(mockSend.mock.calls[0][0].RegularExpressionList).toEqual([{ RegexString: ".*foo.*" }]);
  });

  it("PUT /regex-pattern-sets/:id — updates without regex list", async () => {
    mockSend.mockResolvedValueOnce({ NextLockToken: "lock-2" });
    const res = await router.request("/regex-pattern-sets/id-1", {
      method: "PUT",
      body: JSON.stringify({ Name: "rx1", Scope: "REGIONAL", LockToken: "lock-1" }),
      headers: { "content-type": "application/json" },
    });
    expect(res.status).toBe(200);
    expect(mockSend.mock.calls[0][0].RegularExpressionList).toEqual([]);
  });

  it("PUT /regex-pattern-sets/:id — 400 when LockToken missing", async () => {
    const res = await router.request("/regex-pattern-sets/id-1", {
      method: "PUT",
      body: JSON.stringify({ Name: "rx1", Scope: "REGIONAL" }),
      headers: { "content-type": "application/json" },
    });
    expect(res.status).toBe(400);
  });

  it("POST /regex-pattern-sets/delete — deletes", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/regex-pattern-sets/delete", { Id: "id-1", Name: "rx1", Scope: "REGIONAL", LockToken: "lock-1" });
    const json = await res.json();
    expect(json.deleted).toBe(true);
  });

  it("POST /regex-pattern-sets/delete — 400 when missing params", async () => {
    const res = await post("/regex-pattern-sets/delete", {});
    expect(res.status).toBe(400);
  });

  it("POST /regex-pattern-sets/delete — 400 when LockToken missing", async () => {
    const res = await post("/regex-pattern-sets/delete", { Id: "id-1", Name: "rx1", Scope: "REGIONAL" });
    expect(res.status).toBe(400);
  });
});

describe("WAFv2 Routes — Rule Groups", () => {
  it("GET /rule-groups — lists", async () => {
    mockSend.mockResolvedValueOnce({ RuleGroups: [{ Name: "rg1", Id: "id-1" }] });
    const res = await get("/rule-groups");
    const json = await res.json();
    expect(json.ruleGroups).toHaveLength(1);
  });

  it("GET /rule-groups — empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/rule-groups");
    const json = await res.json();
    expect(json.ruleGroups).toEqual([]);
  });

  it("POST /rule-groups — creates", async () => {
    mockSend.mockResolvedValueOnce({ Summary: { Name: "rg-new" } });
    const res = await post("/rule-groups", { Name: "rg-new", Scope: "REGIONAL" });
    expect(res.status).toBe(201);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("CreateRuleGroupCommand");
    expect(mockSend.mock.calls[0][0].Capacity).toBe(100);
  });

  it("POST /rule-groups — 400 when Name missing", async () => {
    const res = await post("/rule-groups", { Scope: "REGIONAL" });
    expect(res.status).toBe(400);
  });

  it("POST /rule-groups — 400 when Scope missing", async () => {
    const res = await post("/rule-groups", { Name: "rg1" });
    expect(res.status).toBe(400);
  });

  it("GET /rule-groups/:id — gets rule group", async () => {
    mockSend.mockResolvedValueOnce({ RuleGroup: { Name: "rg1", Id: "id-1", Capacity: 100 } });
    const res = await get("/rule-groups/id-1?name=rg1&scope=REGIONAL");
    const json = await res.json();
    expect(json.ruleGroup.Name).toBe("rg1");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("GetRuleGroupCommand");
    expect(mockSend.mock.calls[0][0].Id).toBe("id-1");
    expect(mockSend.mock.calls[0][0].Name).toBe("rg1");
    expect(mockSend.mock.calls[0][0].Scope).toBe("REGIONAL");
  });

  it("GET /rule-groups/:id — 400 when name missing", async () => {
    const res = await get("/rule-groups/id-1");
    expect(res.status).toBe(400);
  });

  it("PUT /rule-groups/:id — updates rule group", async () => {
    mockSend.mockResolvedValueOnce({ LockToken: "lock-2" });
    const res = await router.request("/rule-groups/id-1", {
      method: "PUT",
      body: JSON.stringify({ Name: "rg1", Scope: "REGIONAL", LockToken: "lock-1", Rules: [{ Name: "rule1", Priority: 1, Statement: {}, Action: { Allow: {} } }] }),
      headers: { "content-type": "application/json" },
    });
    const json = await res.json();
    expect(json.updated).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("UpdateRuleGroupCommand");
    expect(mockSend.mock.calls[0][0].Id).toBe("id-1");
    expect(mockSend.mock.calls[0][0].LockToken).toBe("lock-1");
    expect(mockSend.mock.calls[0][0].Rules).toHaveLength(1);
    expect(mockSend.mock.calls[0][0].Rules[0].Name).toBe("rule1");
  });

  it("PUT /rule-groups/:id — 400 when LockToken missing", async () => {
    const res = await router.request("/rule-groups/id-1", {
      method: "PUT",
      body: JSON.stringify({ Name: "rg1", Scope: "REGIONAL" }),
      headers: { "content-type": "application/json" },
    });
    expect(res.status).toBe(400);
  });

  it("POST /rule-groups/delete — deletes", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/rule-groups/delete", { Id: "id-1", Name: "rg1", Scope: "REGIONAL", LockToken: "lock-1" });
    const json = await res.json();
    expect(json.deleted).toBe(true);
  });

  it("POST /rule-groups/delete — 400 when missing params", async () => {
    const res = await post("/rule-groups/delete", {});
    expect(res.status).toBe(400);
  });

  it("POST /rule-groups/delete — 400 when LockToken missing", async () => {
    const res = await post("/rule-groups/delete", { Id: "id-1", Name: "rg1", Scope: "REGIONAL" });
    expect(res.status).toBe(400);
  });
});

describe("WAFv2 Routes — Tags", () => {
  it("GET /tags — lists tags for resource", async () => {
    mockSend.mockResolvedValueOnce({ TagInfoForResource: { TagList: [{ Key: "env", Value: "prod" }] } });
    const res = await get("/tags?resourceArn=arn:aws:wafv2:::webacl/test");
    const json = await res.json();
    expect(json.tagList).toHaveLength(1);
    expect(json.tagList[0].Key).toBe("env");
  });

  it("GET /tags — returns empty when no tags", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/tags?resourceArn=arn:1");
    const json = await res.json();
    expect(json.tagList).toEqual([]);
  });

  it("GET /tags — 400 when resourceArn missing", async () => {
    const res = await get("/tags");
    expect(res.status).toBe(400);
  });

  it("POST /tags — tags resource", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/tags", { resourceArn: "arn:1", tags: [{ Key: "env", Value: "prod" }] });
    const json = await res.json();
    expect(json.tagged).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("TagResourceCommand");
    expect(mockSend.mock.calls[0][0].ResourceARN).toBe("arn:1");
    expect(mockSend.mock.calls[0][0].Tags).toHaveLength(1);
  });

  it("POST /tags — 400 when missing params", async () => {
    const res = await post("/tags", {});
    expect(res.status).toBe(400);
  });

  it("POST /tags — 400 when tags missing", async () => {
    const res = await post("/tags", { resourceArn: "arn:1" });
    expect(res.status).toBe(400);
  });

  it("POST /tags/untag — untags resource", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/tags/untag", { resourceArn: "arn:1", tagKeys: ["env"] });
    const json = await res.json();
    expect(json.untagged).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("UntagResourceCommand");
    expect(mockSend.mock.calls[0][0].ResourceARN).toBe("arn:1");
    expect(mockSend.mock.calls[0][0].TagKeys).toEqual(["env"]);
  });

  it("POST /tags/untag — 400 when missing params", async () => {
    const res = await post("/tags/untag", {});
    expect(res.status).toBe(400);
  });

  it("POST /tags/untag — 400 when tagKeys missing", async () => {
    const res = await post("/tags/untag", { resourceArn: "arn:1" });
    expect(res.status).toBe(400);
  });
});

describe("WAFv2 Routes — Logging Configuration", () => {
  it("GET /logging-config — lists logging configs", async () => {
    mockSend.mockResolvedValueOnce({ LoggingConfigurations: [{ ResourceArn: "arn:1", LogDestinationConfigs: ["arn:log:1"] }] });
    const res = await get("/logging-config?scope=REGIONAL");
    const json = await res.json();
    expect(json.loggingConfigurations).toHaveLength(1);
    expect(json.total).toBe(1);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("ListLoggingConfigurationsCommand");
  });

  it("GET /logging-config — returns empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/logging-config");
    const json = await res.json();
    expect(json.loggingConfigurations).toEqual([]);
    expect(json.total).toBe(0);
  });

  it("GET /logging-config/:resourceArn — gets config", async () => {
    mockSend.mockResolvedValueOnce({ LoggingConfiguration: { ResourceArn: "arn:1", LogDestinationConfigs: ["arn:log:1"] } });
    const res = await get("/logging-config/arn%3A1");
    const json = await res.json();
    expect(json.loggingConfiguration).toBeDefined();
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("GetLoggingConfigurationCommand");
    expect(mockSend.mock.calls[0][0].ResourceArn).toBe("arn:1");
  });

  it("GET /logging-config/:resourceArn — returns null when not configured", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/logging-config/arn%3A1");
    const json = await res.json();
    expect(json.loggingConfiguration).toBeNull();
  });

  it("PUT /logging-config — creates logging config", async () => {
    mockSend.mockResolvedValueOnce({ LoggingConfiguration: { ResourceArn: "arn:1", LogDestinationConfigs: ["arn:log:1"] } });
    const res = await router.request("/logging-config", {
      method: "PUT",
      body: JSON.stringify({ ResourceArn: "arn:1", LogDestinationConfigs: ["arn:log:1"] }),
      headers: { "content-type": "application/json" },
    });
    const json = await res.json();
    expect(json.created).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("PutLoggingConfigurationCommand");
    expect(mockSend.mock.calls[0][0].LoggingConfiguration.ResourceArn).toBe("arn:1");
  });

  it("PUT /logging-config — 400 when missing params", async () => {
    const res = await router.request("/logging-config", {
      method: "PUT",
      body: JSON.stringify({ ResourceArn: "arn:1" }),
      headers: { "content-type": "application/json" },
    });
    expect(res.status).toBe(400);
  });

  it("POST /logging-config/delete — deletes config", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/logging-config/delete", { ResourceArn: "arn:1" });
    const json = await res.json();
    expect(json.deleted).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("DeleteLoggingConfigurationCommand");
    expect(mockSend.mock.calls[0][0].ResourceArn).toBe("arn:1");
  });

  it("POST /logging-config/delete — 400 when ResourceArn missing", async () => {
    const res = await post("/logging-config/delete", {});
    expect(res.status).toBe(400);
  });
});

describe("WAFv2 Routes — Web ACL Associations", () => {
  it("POST /associate — associates web ACL", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/associate", { WebACLArn: "arn:waf:1", ResourceArn: "arn:elb:1" });
    const json = await res.json();
    expect(json.associated).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("AssociateWebACLCommand");
    expect(mockSend.mock.calls[0][0].WebACLArn).toBe("arn:waf:1");
    expect(mockSend.mock.calls[0][0].ResourceArn).toBe("arn:elb:1");
  });

  it("POST /associate — 400 when missing params", async () => {
    const res = await post("/associate", {});
    expect(res.status).toBe(400);
  });

  it("POST /associate — 400 when ResourceArn missing", async () => {
    const res = await post("/associate", { WebACLArn: "arn:waf:1" });
    expect(res.status).toBe(400);
  });

  it("POST /disassociate — disassociates web ACL", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/disassociate", { ResourceArn: "arn:elb:1" });
    const json = await res.json();
    expect(json.disassociated).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("DisassociateWebACLCommand");
    expect(mockSend.mock.calls[0][0].ResourceArn).toBe("arn:elb:1");
  });

  it("POST /disassociate — 400 when ResourceArn missing", async () => {
    const res = await post("/disassociate", {});
    expect(res.status).toBe(400);
  });

  it("GET /web-acl-for-resource — finds web ACL", async () => {
    mockSend.mockResolvedValueOnce({ WebACL: { Name: "my-acl", ARN: "arn:waf:1" } });
    const res = await get("/web-acl-for-resource?resourceArn=arn:elb:1");
    const json = await res.json();
    expect(json.webAcl.Name).toBe("my-acl");
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("GetWebACLForResourceCommand");
  });

  it("GET /web-acl-for-resource — returns null when no ACL", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/web-acl-for-resource?resourceArn=arn:elb:1");
    const json = await res.json();
    expect(json.webAcl).toBeNull();
  });

  it("GET /web-acl-for-resource — 400 when resourceArn missing", async () => {
    const res = await get("/web-acl-for-resource");
    expect(res.status).toBe(400);
  });

  it("GET /resources-for-web-acl — lists resources", async () => {
    mockSend.mockResolvedValueOnce({ ResourceArns: ["arn:elb:1", "arn:elb:2"] });
    const res = await get("/resources-for-web-acl?webACLArn=arn:waf:1");
    const json = await res.json();
    expect(json.resourceArns).toHaveLength(2);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("ListResourcesForWebACLCommand");
  });

  it("GET /resources-for-web-acl — returns empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/resources-for-web-acl?webACLArn=arn:waf:1");
    const json = await res.json();
    expect(json.resourceArns).toEqual([]);
  });

  it("GET /resources-for-web-acl — 400 when webACLArn missing", async () => {
    const res = await get("/resources-for-web-acl");
    expect(res.status).toBe(400);
  });
});

describe("WAFv2 Routes — Permission Policy", () => {
  it("GET /permission-policy — gets policy", async () => {
    mockSend.mockResolvedValueOnce({ Policy: '{"Version":"2012-10-17"}' });
    const res = await get("/permission-policy?resourceArn=arn:waf:1");
    const json = await res.json();
    expect(json.policy).toBe('{"Version":"2012-10-17"}');
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("GetPermissionPolicyCommand");
  });

  it("GET /permission-policy — returns null when no policy", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/permission-policy?resourceArn=arn:waf:1");
    const json = await res.json();
    expect(json.policy).toBeNull();
  });

  it("GET /permission-policy — 400 when resourceArn missing", async () => {
    const res = await get("/permission-policy");
    expect(res.status).toBe(400);
  });

  it("PUT /permission-policy — puts policy", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await router.request("/permission-policy", {
      method: "PUT",
      body: JSON.stringify({ ResourceArn: "arn:waf:1", Policy: '{"Version":"2012-10-17"}' }),
      headers: { "content-type": "application/json" },
    });
    const json = await res.json();
    expect(json.created).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("PutPermissionPolicyCommand");
    expect(mockSend.mock.calls[0][0].ResourceArn).toBe("arn:waf:1");
    expect(mockSend.mock.calls[0][0].Policy).toBe('{"Version":"2012-10-17"}');
  });

  it("PUT /permission-policy — 400 when missing params", async () => {
    const res = await router.request("/permission-policy", {
      method: "PUT",
      body: JSON.stringify({ ResourceArn: "arn:waf:1" }),
      headers: { "content-type": "application/json" },
    });
    expect(res.status).toBe(400);
  });

  it("POST /permission-policy/delete — deletes policy", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/permission-policy/delete", { ResourceArn: "arn:waf:1" });
    const json = await res.json();
    expect(json.deleted).toBe(true);
    expect(mockSend.mock.calls[0][0].__cmdName).toBe("DeletePermissionPolicyCommand");
    expect(mockSend.mock.calls[0][0].ResourceArn).toBe("arn:waf:1");
  });

  it("POST /permission-policy/delete — 400 when ResourceArn missing", async () => {
    const res = await post("/permission-policy/delete", {});
    expect(res.status).toBe(400);
  });
});
