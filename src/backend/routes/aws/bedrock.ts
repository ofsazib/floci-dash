import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { readJson } from "../../clients/read-json";
import {
  BedrockClient,
  CreateGuardrailCommand,
  GetGuardrailCommand,
  UpdateGuardrailCommand,
  DeleteGuardrailCommand,
  CreateGuardrailVersionCommand,
  ListGuardrailsCommand,
  TagResourceCommand,
  UntagResourceCommand,
  ListTagsForResourceCommand,
} from "@aws-sdk/client-bedrock";

const router = new Hono();
const getClient = () => create(BedrockClient);

// ── Guardrails ───────────────────────────────────────────

router.get("/guardrails", async (c: Context) => {
  const result: any = await getClient().send(new ListGuardrailsCommand({}));
  return c.json({
    guardrails: result.guardrails || [],
    total: result.guardrails?.length || 0,
  });
});

router.post("/guardrails", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.name) return c.json({ error: "name is required" }, 400);
  if (!body?.blockedInputMessaging)
    return c.json({ error: "blockedInputMessaging is required" }, 400);
  if (!body?.blockedOutputsMessaging)
    return c.json({ error: "blockedOutputsMessaging is required" }, 400);
  const result: any = await getClient().send(
    new CreateGuardrailCommand({
      name: body.name,
      description: body.description,
      blockedInputMessaging: body.blockedInputMessaging,
      blockedOutputsMessaging: body.blockedOutputsMessaging,
      topicPolicyConfig: body.topicPolicyConfig,
      contentPolicyConfig: body.contentPolicyConfig,
      wordPolicyConfig: body.wordPolicyConfig,
      sensitiveInformationPolicyConfig: body.sensitiveInformationPolicyConfig,
    })
  );
  return c.json({ guardrail: result }, 201);
});

router.get("/guardrails/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const result: any = await getClient().send(
    new GetGuardrailCommand({ guardrailIdentifier: id })
  );
  return c.json({ guardrail: result || null });
});

router.put("/guardrails/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const body: any = await readJson(c);
  if (!body?.name) return c.json({ error: "name is required" }, 400);
  if (!body?.blockedInputMessaging)
    return c.json({ error: "blockedInputMessaging is required" }, 400);
  if (!body?.blockedOutputsMessaging)
    return c.json({ error: "blockedOutputsMessaging is required" }, 400);
  const result: any = await getClient().send(
    new UpdateGuardrailCommand({
      guardrailIdentifier: id,
      name: body.name,
      description: body.description,
      blockedInputMessaging: body.blockedInputMessaging,
      blockedOutputsMessaging: body.blockedOutputsMessaging,
    })
  );
  return c.json({ guardrail: result });
});

router.post("/guardrails/:id/versions", async (c: Context) => {
  const id = c.req.param("id")!;
  const body: any = await readJson(c);
  const result: any = await getClient().send(
    new CreateGuardrailVersionCommand({
      guardrailIdentifier: id,
      description: body?.description,
    })
  );
  return c.json({ version: result.version, guardrailId: result.guardrailId }, 201);
});

router.delete("/guardrails/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  await getClient().send(
    new DeleteGuardrailCommand({
      guardrailIdentifier: id,
      guardrailVersion: c.req.query("version") || undefined,
    })
  );
  return c.json({ ok: true });
});

// ── Tags ─────────────────────────────────────────────────

router.get("/resources/tags", async (c: Context) => {
  const arn = c.req.query("arn");
  if (!arn) return c.json({ error: "arn query parameter is required" }, 400);
  const result: any = await getClient().send(
    new ListTagsForResourceCommand({ resourceARN: arn })
  );
  return c.json({ tags: result.tags || [] });
});

router.post("/resources/tags", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.resourceARN) return c.json({ error: "resourceARN is required" }, 400);
  if (!Array.isArray(body?.tags) || body.tags.length === 0)
    return c.json({ error: "tags array with at least one tag is required" }, 400);
  await getClient().send(
    new TagResourceCommand({ resourceARN: body.resourceARN, tags: body.tags })
  );
  return c.json({ ok: true });
});

router.post("/resources/tags/untag", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.resourceARN) return c.json({ error: "resourceARN is required" }, 400);
  if (!Array.isArray(body?.tagKeys) || body.tagKeys.length === 0)
    return c.json({ error: "tagKeys array with at least one key is required" }, 400);
  await getClient().send(
    new UntagResourceCommand({ resourceARN: body.resourceARN, tagKeys: body.tagKeys })
  );
  return c.json({ ok: true });
});

export default router;
