import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { OpenSearchClient } from "@aws-sdk/client-opensearch";
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

export default router;
