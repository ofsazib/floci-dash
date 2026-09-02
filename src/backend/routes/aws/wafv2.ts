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
  UpdateIPSetCommand,
  DeleteIPSetCommand,
  ListRegexPatternSetsCommand,
  CreateRegexPatternSetCommand,
  GetRegexPatternSetCommand,
  UpdateRegexPatternSetCommand,
  DeleteRegexPatternSetCommand,
  ListRuleGroupsCommand,
  CreateRuleGroupCommand,
  GetRuleGroupCommand,
  UpdateRuleGroupCommand,
  DeleteRuleGroupCommand,
  ListTagsForResourceCommand,
  TagResourceCommand,
  UntagResourceCommand,
  ListLoggingConfigurationsCommand,
  GetLoggingConfigurationCommand,
  PutLoggingConfigurationCommand,
  DeleteLoggingConfigurationCommand,
  AssociateWebACLCommand,
  DisassociateWebACLCommand,
  GetWebACLForResourceCommand,
  ListResourcesForWebACLCommand,
  UpdateWebACLCommand,
  CheckCapacityCommand,
  GetPermissionPolicyCommand,
  PutPermissionPolicyCommand,
  DeletePermissionPolicyCommand,
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

router.put("/web-acls/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const body = await c.req.json<any>();
  if (!body.Name) return c.json({ error: "Name is required" }, 400);
  if (!body.Scope) return c.json({ error: "Scope is required" }, 400);
  if (!body.LockToken) return c.json({ error: "LockToken is required" }, 400);

  const client = getClient();
  const result = await client.send(
    new UpdateWebACLCommand({
      Id: id,
      Name: body.Name,
      Scope: body.Scope,
      LockToken: body.LockToken,
      Description: body.Description,
      DefaultAction: body.DefaultAction || { Allow: {} },
      Rules: body.Rules,
      VisibilityConfig: body.VisibilityConfig || VISIBILITY_CONFIG,
      CustomResponseBodies: body.CustomResponseBodies,
      CaptchaConfig: body.CaptchaConfig,
      ChallengeConfig: body.ChallengeConfig,
      TokenDomains: body.TokenDomains,
      AssociationConfig: body.AssociationConfig,
    })
  );
  return c.json({ nextLockToken: result.NextLockToken });
});

router.post("/capacity", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.Rules) return c.json({ error: "Rules are required" }, 400);
  const scope = body.Scope || "REGIONAL";

  const client = getClient();
  const result = await client.send(
    new CheckCapacityCommand({ Rules: body.Rules, Scope: scope })
  );
  return c.json({ capacity: result.Capacity });
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

router.get("/ip-sets/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const scope = c.req.query("scope") || "REGIONAL";
  const name = c.req.query("name");
  if (!name) return c.json({ error: "name query param required" }, 400);

  const client = getClient();
  const result = await client.send(new GetIPSetCommand({ Id: id, Name: name, Scope: scope as any }));
  const ipSet = result.IPSet;
  return c.json({ ipSet });
});

router.put("/ip-sets/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const body = await c.req.json<any>();
  if (!body.Name || !body.Scope || !body.LockToken) return c.json({ error: "Name, Scope, and LockToken are required" }, 400);

  const client = getClient();
  const result = await client.send(
    new UpdateIPSetCommand({
      Id: id,
      Name: body.Name,
      Scope: body.Scope,
      LockToken: body.LockToken,
      Description: body.Description,
      Addresses: body.Addresses || [],
    })
  );
  return c.json({ lockToken: (result as any).LockToken, updated: true });
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

router.get("/regex-pattern-sets/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const scope = c.req.query("scope") || "REGIONAL";
  const name = c.req.query("name");
  if (!name) return c.json({ error: "name query param required" }, 400);

  const client = getClient();
  const result = await client.send(new GetRegexPatternSetCommand({ Id: id, Name: name, Scope: scope as any }));
  return c.json({ regexPatternSet: result.RegexPatternSet });
});

router.put("/regex-pattern-sets/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const body = await c.req.json<any>();
  if (!body.Name || !body.Scope || !body.LockToken) return c.json({ error: "Name, Scope, and LockToken are required" }, 400);

  const client = getClient();
  const result = await client.send(
    new UpdateRegexPatternSetCommand({
      Id: id,
      Name: body.Name,
      Scope: body.Scope,
      LockToken: body.LockToken,
      Description: body.Description,
      RegularExpressionList: body.RegularExpressionList || [],
    })
  );
  return c.json({ lockToken: (result as any).LockToken, updated: true });
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

router.get("/rule-groups/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const scope = c.req.query("scope") || "REGIONAL";
  const name = c.req.query("name");
  if (!name) return c.json({ error: "name query param required" }, 400);

  const client = getClient();
  const result = await client.send(new GetRuleGroupCommand({ Id: id, Name: name, Scope: scope as any }));
  return c.json({ ruleGroup: result.RuleGroup });
});

router.put("/rule-groups/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const body = await c.req.json<any>();
  if (!body.Name || !body.Scope || !body.LockToken) return c.json({ error: "Name, Scope, and LockToken are required" }, 400);

  const client = getClient();
  const result = await client.send(
    new UpdateRuleGroupCommand({
      Id: id,
      Name: body.Name,
      Scope: body.Scope,
      LockToken: body.LockToken,
      Description: body.Description,
      Rules: body.Rules,
      VisibilityConfig: body.VisibilityConfig || { SampledRequestsEnabled: false, CloudWatchMetricsEnabled: false, MetricName: "floci" },
    })
  );
  return c.json({ lockToken: (result as any).LockToken, updated: true });
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

// ── Logging Configuration ────────────────────────────────

router.get("/logging-config", async (c: Context) => {
  const scope = c.req.query("scope") || "REGIONAL";
  const client = getClient();
  const result = await client.send(new ListLoggingConfigurationsCommand({ Scope: scope as any }));
  const loggingConfigurations = result.LoggingConfigurations || [];
  return c.json({ loggingConfigurations, total: loggingConfigurations.length });
});

router.get("/logging-config/:resourceArn", async (c: Context) => {
  const resourceArn = c.req.param("resourceArn")!;
  const client = getClient();
  const result = await client.send(new GetLoggingConfigurationCommand({ ResourceArn: resourceArn }));
  return c.json({ loggingConfiguration: result.LoggingConfiguration || null });
});

router.put("/logging-config", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.ResourceArn || !body.LogDestinationConfigs) return c.json({ error: "ResourceArn and LogDestinationConfigs are required" }, 400);

  const client = getClient();
  const result = await client.send(
    new PutLoggingConfigurationCommand({
      LoggingConfiguration: {
        ResourceArn: body.ResourceArn,
        LogDestinationConfigs: body.LogDestinationConfigs,
        RedactedFields: body.RedactedFields,
        ManagedByFirewallManager: body.ManagedByFirewallManager,
        LoggingFilter: body.LoggingFilter,
        LogScope: body.LogScope,
        LogType: body.LogType,
      },
    })
  );
  return c.json({ loggingConfiguration: result.LoggingConfiguration, created: true });
});

router.post("/logging-config/delete", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.ResourceArn) return c.json({ error: "ResourceArn is required" }, 400);

  const client = getClient();
  await client.send(new DeleteLoggingConfigurationCommand({ ResourceArn: body.ResourceArn }));
  return c.json({ deleted: true });
});

// ── Web ACL Associations ─────────────────────────────────

router.post("/associate", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.WebACLArn || !body.ResourceArn) return c.json({ error: "WebACLArn and ResourceArn are required" }, 400);

  const client = getClient();
  await client.send(new AssociateWebACLCommand({ WebACLArn: body.WebACLArn, ResourceArn: body.ResourceArn }));
  return c.json({ associated: true });
});

router.post("/disassociate", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.ResourceArn) return c.json({ error: "ResourceArn is required" }, 400);

  const client = getClient();
  await client.send(new DisassociateWebACLCommand({ ResourceArn: body.ResourceArn }));
  return c.json({ disassociated: true });
});

router.get("/web-acl-for-resource", async (c: Context) => {
  const resourceArn = c.req.query("resourceArn");
  if (!resourceArn) return c.json({ error: "resourceArn query param required" }, 400);

  const client = getClient();
  const result = await client.send(new GetWebACLForResourceCommand({ ResourceArn: resourceArn }));
  return c.json({ webAcl: result.WebACL || null });
});

router.get("/resources-for-web-acl", async (c: Context) => {
  const webACLArn = c.req.query("webACLArn");
  if (!webACLArn) return c.json({ error: "webACLArn query param required" }, 400);

  const client = getClient();
  const result = await client.send(new ListResourcesForWebACLCommand({ WebACLArn: webACLArn }));
  return c.json({ resourceArns: result.ResourceArns || [] });
});

// ── Permission Policy ────────────────────────────────────

router.get("/permission-policy", async (c: Context) => {
  const resourceArn = c.req.query("resourceArn");
  if (!resourceArn) return c.json({ error: "resourceArn query param required" }, 400);

  const client = getClient();
  const result = await client.send(new GetPermissionPolicyCommand({ ResourceArn: resourceArn }));
  return c.json({ policy: result.Policy || null });
});

router.put("/permission-policy", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.ResourceArn || !body.Policy) return c.json({ error: "ResourceArn and Policy are required" }, 400);

  const client = getClient();
  await client.send(new PutPermissionPolicyCommand({ ResourceArn: body.ResourceArn, Policy: body.Policy }));
  return c.json({ created: true });
});

router.post("/permission-policy/delete", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body.ResourceArn) return c.json({ error: "ResourceArn is required" }, 400);

  const client = getClient();
  await client.send(new DeletePermissionPolicyCommand({ ResourceArn: body.ResourceArn }));
  return c.json({ deleted: true });
});

export default router;
