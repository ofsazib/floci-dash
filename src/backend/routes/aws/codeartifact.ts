import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { readJson } from "../../clients/read-json";
import {
  CodeartifactClient,
  ListDomainsCommand,
  CreateDomainCommand,
  DeleteDomainCommand,
  GetAuthorizationTokenCommand,
  ListRepositoriesCommand,
  CreateRepositoryCommand,
  DeleteRepositoryCommand,
  GetRepositoryEndpointCommand,
  AssociateExternalConnectionCommand,
  DisassociateExternalConnectionCommand,
} from "@aws-sdk/client-codeartifact";

const router = new Hono();
const getClient = () => create(CodeartifactClient);

// ── Domains ──────────────────────────────────────────────

router.get("/domains", async (c: Context) => {
  const result: any = await getClient().send(new ListDomainsCommand({}));
  return c.json({ domains: result.domains || [], nextToken: result.nextToken });
});

router.post("/domains", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.name) return c.json({ error: "name is required" }, 400);
  const result: any = await getClient().send(
    new CreateDomainCommand({
      domain: body.name,
      encryptionKey: body.encryptionKey,
      tags: body.tags,
    })
  );
  return c.json({ domain: result.domain || null }, 201);
});

router.delete("/domains", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.name) return c.json({ error: "name is required" }, 400);
  const result: any = await getClient().send(
    new DeleteDomainCommand({ domain: body.name })
  );
  return c.json({ domain: result.domain || null });
});

// ── Authorization token ──────────────────────────────────

router.post("/authorization-token", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.domain) return c.json({ error: "domain is required" }, 400);
  const result: any = await getClient().send(
    new GetAuthorizationTokenCommand({
      domain: body.domain,
      durationSeconds: body.durationSeconds,
    })
  );
  return c.json({
    authorizationToken: result.authorizationToken,
    expiration: result.expiration,
  });
});

// ── Repositories ─────────────────────────────────────────

router.get("/repositories", async (c: Context) => {
  const prefix = c.req.query("prefix");
  const result: any = await getClient().send(
    new ListRepositoriesCommand({
      repositoryPrefix: prefix || undefined,
    })
  );
  return c.json({ repositories: result.repositories || [], nextToken: result.nextToken });
});

router.post("/repositories", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.domain) return c.json({ error: "domain is required" }, 400);
  if (!body?.name) return c.json({ error: "name is required" }, 400);
  const result: any = await getClient().send(
    new CreateRepositoryCommand({
      domain: body.domain,
      repository: body.name,
      description: body.description,
      upstreams: Array.isArray(body.upstreams)
        ? body.upstreams.map((u: any) => ({ repositoryName: u }))
        : undefined,
    })
  );
  return c.json({ repository: result.repository || null }, 201);
});

router.delete("/repositories", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.domain) return c.json({ error: "domain is required" }, 400);
  if (!body?.name) return c.json({ error: "name is required" }, 400);
  const result: any = await getClient().send(
    new DeleteRepositoryCommand({ domain: body.domain, repository: body.name })
  );
  return c.json({ repository: result.repository || null });
});

router.get("/repositories/endpoint", async (c: Context) => {
  const domain = c.req.query("domain");
  const repository = c.req.query("repository");
  const format = c.req.query("format") || "npm";
  if (!domain || !repository)
    return c.json({ error: "domain and repository query params are required" }, 400);
  const result: any = await getClient().send(
    new GetRepositoryEndpointCommand({ domain, repository, format } as any)
  );
  return c.json({ repositoryEndpoint: result.repositoryEndpoint });
});

// ── External connections ─────────────────────────────────

router.post("/external-connections", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.domain) return c.json({ error: "domain is required" }, 400);
  if (!body?.repository) return c.json({ error: "repository is required" }, 400);
  if (!body?.externalConnection)
    return c.json({ error: "externalConnection is required" }, 400);
  const result: any = await getClient().send(
    new AssociateExternalConnectionCommand({
      domain: body.domain,
      repository: body.repository,
      externalConnection: body.externalConnection,
    })
  );
  return c.json({ repository: result.repository || null });
});

router.delete("/external-connections", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.domain) return c.json({ error: "domain is required" }, 400);
  if (!body?.repository) return c.json({ error: "repository is required" }, 400);
  if (!body?.externalConnection)
    return c.json({ error: "externalConnection is required" }, 400);
  const result: any = await getClient().send(
    new DisassociateExternalConnectionCommand({
      domain: body.domain,
      repository: body.repository,
      externalConnection: body.externalConnection,
    })
  );
  return c.json({ repository: result.repository || null });
});

export default router;
