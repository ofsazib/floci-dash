import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { OpenSearchClient } from "@aws-sdk/client-opensearch";
import {
  UpdateDomainConfigCommand,
  UpgradeDomainCommand,
  AddTagsCommand,
  ListTagsCommand,
  RemoveTagsCommand,
  DescribeDomainsCommand,
  DescribeDomainConfigCommand,
} from "@aws-sdk/client-opensearch";
import {
  ListDomainNamesCommand,
  DescribeDomainCommand,
  CreateDomainCommand,
  DeleteDomainCommand,
  ListVersionsCommand,
} from "@aws-sdk/client-opensearch";

const router = new Hono();
const getClient = () => create(OpenSearchClient);

// ── Domains ──────────────────────────────────────────────

router.get("/domains", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListDomainNamesCommand({}));
  const domains = result.DomainNames || [];
  return c.json({ domains, total: domains.length });
});

router.get("/domains/:name", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  const result = await client.send(new DescribeDomainCommand({ DomainName: name }));
  return c.json({ domain: result.DomainStatus });
});

router.post("/domains", async (c: Context) => {
  const body = await c.req.json<{
    domainName: string;
    engineVersion?: string;
    clusterConfig?: any;
    ebsOptions?: any;
  }>();
  if (!body.domainName) return c.json({ error: "domainName is required" }, 400);

  const client = getClient();
  const result = await client.send(
    new CreateDomainCommand({
      DomainName: body.domainName,
      EngineVersion: body.engineVersion,
      ClusterConfig: body.clusterConfig,
      EBSOptions: body.ebsOptions,
    })
  );
  return c.json({ domain: result.DomainStatus }, 201);
});

router.delete("/domains/:name", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  const result = await client.send(new DeleteDomainCommand({ DomainName: name }));
  return c.json({ domain: result.DomainStatus, deleted: true });
});

// ── Versions ─────────────────────────────────────────────

router.get("/versions", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListVersionsCommand({}));
  const versions = result.Versions || [];
  return c.json({ versions, total: versions.length });
});


router.put("/domains/:name/config", async (c: Context) => {
  const name = c.req.param("name")!;
  const body = await c.req.json<any>();
  const client = getClient();
  const result: any = await client.send(
    new UpdateDomainConfigCommand({
      DomainName: name,
      ClusterConfig: body.clusterConfig,
      EBSOptions: body.ebsOptions,
      AccessPolicies: body.accessPolicies,
    })
  );
  return c.json({ changeId: result.ChangeId || null });
});

router.post("/domains/:name/upgrade", async (c: Context) => {
  const name = c.req.param("name")!;
  const body = await c.req.json<{ targetVersion?: string; performCheckOnly?: boolean }>();
  if (!body.targetVersion) return c.json({ error: "targetVersion is required" }, 400);
  const client = getClient();
  await client.send(
    new UpgradeDomainCommand({
      DomainName: name,
      TargetVersion: body.targetVersion,
      PerformCheckOnly: body.performCheckOnly,
    })
  );
  return c.json({ upgradeStarted: true });
});

router.get("/domains/:name/tags", async (c: Context) => {
  const arn = c.req.query("arn");
  if (!arn) return c.json({ error: "arn query parameter required" }, 400);
  const client = getClient();
  const result = await client.send(new ListTagsCommand({ ARN: arn }));
  const tags = (result.TagList || []).map((t: any) => ({ key: t.Key, value: t.Value }));
  return c.json({ tags });
});

router.post("/domains/:name/tags", async (c: Context) => {
  const arn = c.req.query("arn");
  if (!arn) return c.json({ error: "arn query parameter required" }, 400);
  const body = await c.req.json<{ tags?: Record<string, string> }>();
  if (!body.tags || !Object.keys(body.tags).length)
    return c.json({ error: "tags is required" }, 400);
  const client = getClient();
  await client.send(
    new AddTagsCommand({
      ARN: arn,
      TagList: Object.entries(body.tags).map(([Key, Value]) => ({ Key, Value })),
    })
  );
  return c.json({ tagged: true });
});

// ─── Remove Tags ──────────────────────────────────────────────

router.post("/domains/:name/tags/remove", async (c: Context) => {
  const arn = c.req.query("arn");
  if (!arn) return c.json({ error: "arn query parameter required" }, 400);
  const body = await c.req.json<{ tagKeys?: string[] }>();
  if (!body.tagKeys || !Array.isArray(body.tagKeys) || !body.tagKeys.length)
    return c.json({ error: "tagKeys array is required" }, 400);
  const client = getClient();
  await client.send(new RemoveTagsCommand({
    ARN: arn,
    TagKeys: body.tagKeys,
  }));
  return c.json({ removed: true });
});

// ─── Describe Domains (batch) ────────────────────────────────────

router.post("/domains/describe", async (c: Context) => {
  const body = await c.req.json<{ domainNames?: string[] }>();
  if (!body.domainNames || !Array.isArray(body.domainNames) || !body.domainNames.length)
    return c.json({ error: "domainNames array is required" }, 400);
  const client = getClient();
  const result = await client.send(new DescribeDomainsCommand({
    DomainNames: body.domainNames,
  }));
  return c.json({ domainStatusList: result.DomainStatusList || [] });
});

// ─── Describe Domain Config ──────────────────────────────────────

router.get("/domains/:name/config", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  const result = await client.send(new DescribeDomainConfigCommand({ DomainName: name }));
  return c.json({ domainConfig: result.DomainConfig });
});

export default router;