import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { readJson } from "../../clients/read-json";
import {
  OAMClient,
  ListSinksCommand,
  CreateSinkCommand,
  GetSinkCommand,
  DeleteSinkCommand,
  PutSinkPolicyCommand,
  GetSinkPolicyCommand,
  ListAttachedLinksCommand,
  ListLinksCommand,
  CreateLinkCommand,
  GetLinkCommand,
  UpdateLinkCommand,
  DeleteLinkCommand,
  ListTagsForResourceCommand,
  TagResourceCommand,
  UntagResourceCommand,
} from "@aws-sdk/client-oam";

const router = new Hono();
const getClient = () => create(OAMClient);

// ── Sinks ────────────────────────────────────────────────

router.get("/sinks", async (c: Context) => {
  const result: any = await getClient().send(new ListSinksCommand({}));
  return c.json({ sinks: result.Items || [], total: result.Items?.length || 0 });
});

router.post("/sinks", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.name) return c.json({ error: "name is required" }, 400);
  const result: any = await getClient().send(
    new CreateSinkCommand({ Name: body.name })
  );
  return c.json({ sink: result }, 201);
});

router.get("/sinks/:identifier", async (c: Context) => {
  const identifier = c.req.param("identifier")!;
  const result: any = await getClient().send(
    new GetSinkCommand({ Identifier: identifier })
  );
  return c.json({ sink: result || null });
});

router.delete("/sinks/:identifier", async (c: Context) => {
  const identifier = c.req.param("identifier")!;
  await getClient().send(new DeleteSinkCommand({ Identifier: identifier }));
  return c.json({ ok: true });
});

router.get("/sinks/:identifier/policy", async (c: Context) => {
  const identifier = c.req.param("identifier")!;
  const result: any = await getClient().send(
    new GetSinkPolicyCommand({ SinkIdentifier: identifier })
  );
  return c.json({
    policy: result.Policy ?? null,
    sinkArn: result.SinkArn,
    sinkId: result.SinkId,
  });
});

router.put("/sinks/:identifier/policy", async (c: Context) => {
  const identifier = c.req.param("identifier")!;
  const body: any = await readJson(c);
  if (!body?.policy) return c.json({ error: "policy is required" }, 400);
  const result: any = await getClient().send(
    new PutSinkPolicyCommand({ SinkIdentifier: identifier, Policy: body.policy })
  );
  return c.json({
    policy: result.Policy,
    sinkArn: result.SinkArn,
    sinkId: result.SinkId,
  });
});

router.get("/sinks/:identifier/attached-links", async (c: Context) => {
  const identifier = c.req.param("identifier")!;
  const result: any = await getClient().send(
    new ListAttachedLinksCommand({ SinkIdentifier: identifier })
  );
  return c.json({ links: result.Items || [], total: result.Items?.length || 0 });
});

// ── Links ────────────────────────────────────────────────

router.get("/links", async (c: Context) => {
  const result: any = await getClient().send(new ListLinksCommand({}));
  return c.json({ links: result.Items || [], total: result.Items?.length || 0 });
});

router.post("/links", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.sinkIdentifier) return c.json({ error: "sinkIdentifier is required" }, 400);
  if (!body?.labelTemplate) return c.json({ error: "labelTemplate is required" }, 400);
  if (!Array.isArray(body?.resourceTypes) || body.resourceTypes.length === 0)
    return c.json({ error: "resourceTypes array with at least one type is required" }, 400);
  const result: any = await getClient().send(
    new CreateLinkCommand({
      SinkIdentifier: body.sinkIdentifier,
      LabelTemplate: body.labelTemplate,
      ResourceTypes: body.resourceTypes,
      LinkConfiguration: body.linkConfiguration,
    })
  );
  return c.json({ link: result }, 201);
});

router.get("/links/:identifier", async (c: Context) => {
  const identifier = c.req.param("identifier")!;
  const result: any = await getClient().send(
    new GetLinkCommand({ Identifier: identifier })
  );
  return c.json({ link: result || null });
});

router.put("/links/:identifier", async (c: Context) => {
  const identifier = c.req.param("identifier")!;
  const body: any = await readJson(c);
  if (!Array.isArray(body?.resourceTypes) || body.resourceTypes.length === 0)
    return c.json({ error: "resourceTypes array with at least one type is required" }, 400);
  const result: any = await getClient().send(
    new UpdateLinkCommand({
      Identifier: identifier,
      ResourceTypes: body.resourceTypes,
      LinkConfiguration: body.linkConfiguration,
    })
  );
  return c.json({ link: result });
});

router.delete("/links/:identifier", async (c: Context) => {
  const identifier = c.req.param("identifier")!;
  await getClient().send(new DeleteLinkCommand({ Identifier: identifier }));
  return c.json({ ok: true });
});

// ── Tags (Floci returns capital-T Tags; accept both) ─────

router.get("/resources/tags", async (c: Context) => {
  const arn = c.req.query("arn");
  if (!arn) return c.json({ error: "arn query parameter is required" }, 400);
  const result: any = await getClient().send(
    new ListTagsForResourceCommand({ ResourceArn: arn })
  );
  return c.json({ tags: result.tags ?? result.Tags ?? {} });
});

router.post("/resources/tags", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.arn) return c.json({ error: "arn is required" }, 400);
  if (!body?.tags || typeof body.tags !== "object" || Object.keys(body.tags).length === 0)
    return c.json({ error: "tags object with at least one tag is required" }, 400);
  await getClient().send(new TagResourceCommand({ ResourceArn: body.arn, Tags: body.tags }));
  return c.json({ ok: true });
});

router.post("/resources/tags/untag", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.arn) return c.json({ error: "arn is required" }, 400);
  if (!Array.isArray(body?.tagKeys) || body.tagKeys.length === 0)
    return c.json({ error: "tagKeys array with at least one key is required" }, 400);
  await getClient().send(
    new UntagResourceCommand({ ResourceArn: body.arn, TagKeys: body.tagKeys })
  );
  return c.json({ ok: true });
});

export default router;
