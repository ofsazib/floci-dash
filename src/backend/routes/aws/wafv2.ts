import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { WAFV2Client } from "@aws-sdk/client-wafv2";
import {
  ListWebACLsCommand,
  CreateWebACLCommand,
  GetWebACLCommand,
  DeleteWebACLCommand,
  ListIPSetsCommand,
  CreateIPSetCommand,
  GetIPSetCommand,
  DeleteIPSetCommand,
  ListRegexPatternSetsCommand,
  CreateRegexPatternSetCommand,
  GetRegexPatternSetCommand,
  DeleteRegexPatternSetCommand,
  ListRuleGroupsCommand,
  CreateRuleGroupCommand,
  GetRuleGroupCommand,
  DeleteRuleGroupCommand,
  ListTagsForResourceCommand,
  TagResourceCommand,
  UntagResourceCommand,
} from "@aws-sdk/client-wafv2";

const router = new Hono();
const getClient = () => create(WAFV2Client);

const VISIBILITY_CONFIG = {
  SampledRequestsEnabled: false,
  CloudWatchMetricsEnabled: false,
  MetricName: "floci",
};

// ── Web ACLs ──────────────────────────────────────────────

router.get("/web-acls", async (c: Context) => {
  const scope = c.req.query("scope") || "REGIONAL";
  const client = getClient();
  const result = await client.send(new ListWebACLsCommand({ Scope: scope as any }));
  const webAcls = result.WebACLs || [];
  return c.json({ webAcls, total: webAcls.length });
});

router.post("/web-acls", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.Name) return c.json({ error: "Name is required" }, 400);
  if (!body.Scope) return c.json({ error: "Scope is required" }, 400);

  const client = getClient();
  const result = await client.send(
    new CreateWebACLCommand({
      Name: body.Name,
      Scope: body.Scope,
      Description: body.Description,
      DefaultAction: body.DefaultAction || { Allow: {} },
      Rules: body.Rules,
      VisibilityConfig: body.VisibilityConfig || VISIBILITY_CONFIG,
      Tags: body.Tags,
    })
  );
  return c.json({ summary: result.Summary, created: true }, 201);
});

router.get("/web-acls/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const scope = c.req.query("scope") || "REGIONAL";
  const name = c.req.query("name");
  if (!name) return c.json({ error: "name query param required" }, 400);

  const client = getClient();
  const result = await client.send(new GetWebACLCommand({ Id: id, Name: name, Scope: scope as any }));
  return c.json({ webAcl: result.WebACL });
});

router.post("/web-acls/delete", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.Id || !body.Name || !body.Scope) return c.json({ error: "Id, Name, and Scope are required" }, 400);
  if (!body.LockToken) return c.json({ error: "LockToken is required" }, 400);

  const client = getClient();
  await client.send(
    new DeleteWebACLCommand({ Id: body.Id, Name: body.Name, Scope: body.Scope, LockToken: body.LockToken })
  );
  return c.json({ deleted: true });
});

// ── IP Sets ───────────────────────────────────────────────

router.get("/ip-sets", async (c: Context) => {
  const scope = c.req.query("scope") || "REGIONAL";
  const client = getClient();
  const result = await client.send(new ListIPSetsCommand({ Scope: scope as any }));
  const ipSets = result.IPSets || [];
  return c.json({ ipSets, total: ipSets.length });
});

router.post("/ip-sets", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.Name) return c.json({ error: "Name is required" }, 400);
  if (!body.Scope) return c.json({ error: "Scope is required" }, 400);

  const client = getClient();
  const result = await client.send(
    new CreateIPSetCommand({
      Name: body.Name,
      Scope: body.Scope,
      Description: body.Description,
      IPAddressVersion: body.IPAddressVersion || "IPV4",
      Addresses: body.Addresses || [],
      Tags: body.Tags,
    })
  );
  return c.json({ summary: result.Summary, created: true }, 201);
});

router.post("/ip-sets/delete", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.Id || !body.Name || !body.Scope) return c.json({ error: "Id, Name, and Scope are required" }, 400);
  if (!body.LockToken) return c.json({ error: "LockToken is required" }, 400);

  const client = getClient();
  await client.send(
    new DeleteIPSetCommand({ Id: body.Id, Name: body.Name, Scope: body.Scope, LockToken: body.LockToken })
  );
  return c.json({ deleted: true });
});

// ── Regex Pattern Sets ────────────────────────────────────

router.get("/regex-pattern-sets", async (c: Context) => {
  const scope = c.req.query("scope") || "REGIONAL";
  const client = getClient();
  const result = await client.send(new ListRegexPatternSetsCommand({ Scope: scope as any }));
  const regexSets = result.RegexPatternSets || [];
  return c.json({ regexPatternSets: regexSets, total: regexSets.length });
});

router.post("/regex-pattern-sets", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.Name) return c.json({ error: "Name is required" }, 400);
  if (!body.Scope) return c.json({ error: "Scope is required" }, 400);

  const client = getClient();
  const result = await client.send(
    new CreateRegexPatternSetCommand({
      Name: body.Name,
      Scope: body.Scope,
      Description: body.Description,
      RegularExpressionList: body.RegularExpressionList || [],
    })
  );
  return c.json({ summary: result.Summary, created: true }, 201);
});

router.post("/regex-pattern-sets/delete", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.Id || !body.Name || !body.Scope) return c.json({ error: "Id, Name, and Scope are required" }, 400);
  if (!body.LockToken) return c.json({ error: "LockToken is required" }, 400);

  const client = getClient();
  await client.send(
    new DeleteRegexPatternSetCommand({ Id: body.Id, Name: body.Name, Scope: body.Scope, LockToken: body.LockToken })
  );
  return c.json({ deleted: true });
});

// ── Rule Groups ───────────────────────────────────────────

router.get("/rule-groups", async (c: Context) => {
  const scope = c.req.query("scope") || "REGIONAL";
  const client = getClient();
  const result = await client.send(new ListRuleGroupsCommand({ Scope: scope as any }));
  const ruleGroups = result.RuleGroups || [];
  return c.json({ ruleGroups, total: ruleGroups.length });
});

router.post("/rule-groups", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.Name) return c.json({ error: "Name is required" }, 400);
  if (!body.Scope) return c.json({ error: "Scope is required" }, 400);

  const client = getClient();
  const result = await client.send(
    new CreateRuleGroupCommand({
      Name: body.Name,
      Scope: body.Scope,
      Capacity: body.Capacity || 100,
      Description: body.Description,
      Rules: body.Rules,
      VisibilityConfig: body.VisibilityConfig || VISIBILITY_CONFIG,
    })
  );
  return c.json({ summary: result.Summary, created: true }, 201);
});

router.post("/rule-groups/delete", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.Id || !body.Name || !body.Scope) return c.json({ error: "Id, Name, and Scope are required" }, 400);
  if (!body.LockToken) return c.json({ error: "LockToken is required" }, 400);

  const client = getClient();
  await client.send(
    new DeleteRuleGroupCommand({ Id: body.Id, Name: body.Name, Scope: body.Scope, LockToken: body.LockToken })
  );
  return c.json({ deleted: true });
});

// ── Tags ──────────────────────────────────────────────────

router.get("/tags", async (c: Context) => {
  const resourceArn = c.req.query("resourceArn");
  if (!resourceArn) return c.json({ error: "resourceArn query param required" }, 400);

  const client = getClient();
  const result = await client.send(new ListTagsForResourceCommand({ ResourceARN: resourceArn }));
  return c.json({ tagList: result.TagInfoForResource?.TagList || [] });
});

router.post("/tags", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.resourceArn || !body.tags) return c.json({ error: "resourceArn and tags are required" }, 400);

  const client = getClient();
  await client.send(new TagResourceCommand({ ResourceARN: body.resourceArn, Tags: body.tags }));
  return c.json({ tagged: true });
});

router.post("/tags/untag", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.resourceArn || !body.tagKeys) return c.json({ error: "resourceArn and tagKeys are required" }, 400);

  const client = getClient();
  await client.send(new UntagResourceCommand({ ResourceARN: body.resourceArn, TagKeys: body.tagKeys }));
  return c.json({ untagged: true });
});

export default router;
