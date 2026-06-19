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
  DeleteIPSetCommand: createCmd("DeleteIPSetCommand"),
  ListRegexPatternSetsCommand: createCmd("ListRegexPatternSetsCommand"),
  CreateRegexPatternSetCommand: createCmd("CreateRegexPatternSetCommand"),
  GetRegexPatternSetCommand: createCmd("GetRegexPatternSetCommand"),
  DeleteRegexPatternSetCommand: createCmd("DeleteRegexPatternSetCommand"),
  ListRuleGroupsCommand: createCmd("ListRuleGroupsCommand"),
  CreateRuleGroupCommand: createCmd("CreateRuleGroupCommand"),
  GetRuleGroupCommand: createCmd("GetRuleGroupCommand"),
  DeleteRuleGroupCommand: createCmd("DeleteRuleGroupCommand"),
  ListTagsForResourceCommand: createCmd("ListTagsForResourceCommand"),
  TagResourceCommand: createCmd("TagResourceCommand"),
  UntagResourceCommand: createCmd("UntagResourceCommand"),
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

  it("POST /ip-sets — 400 when Name missing", async () => {
    const res = await post("/ip-sets", { Scope: "REGIONAL" });
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
