import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import {
  ComprehendClient,
  DetectSentimentCommand,
  DetectKeyPhrasesCommand,
  DetectDominantLanguageCommand,
  DetectPiiEntitiesCommand,
  ContainsPiiEntitiesCommand,
} from "@aws-sdk/client-comprehend";

const router = new Hono();
const getClient = () => create(ComprehendClient);

router.post("/detect-sentiment", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body?.text) return c.json({ error: "text is required" }, 400);
  if (!body?.languageCode) return c.json({ error: "languageCode is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new DetectSentimentCommand({ Text: body.text, LanguageCode: body.languageCode })
  );
  return c.json({
    sentiment: result.Sentiment ?? null,
    sentimentScore: result.SentimentScore ?? null,
  });
});

router.post("/detect-key-phrases", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body?.text) return c.json({ error: "text is required" }, 400);
  if (!body?.languageCode) return c.json({ error: "languageCode is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new DetectKeyPhrasesCommand({ Text: body.text, LanguageCode: body.languageCode })
  );
  return c.json({
    keyPhrases: (result.KeyPhrases || []).map((p: any) => ({
      score: p.Score,
      text: p.Text,
      beginOffset: p.BeginOffset,
      endOffset: p.EndOffset,
    })),
  });
});

router.post("/detect-dominant-language", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body?.text) return c.json({ error: "text is required" }, 400);
  const client = getClient();
  const result = await client.send(new DetectDominantLanguageCommand({ Text: body.text }));
  return c.json({
    languages: (result.Languages || []).map((l: any) => ({
      languageCode: l.LanguageCode,
      score: l.Score,
    })),
  });
});

router.post("/detect-pii-entities", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body?.text) return c.json({ error: "text is required" }, 400);
  if (!body?.languageCode) return c.json({ error: "languageCode is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new DetectPiiEntitiesCommand({ Text: body.text, LanguageCode: body.languageCode })
  );
  return c.json({
    entities: (result.Entities || []).map((e: any) => ({
      score: e.Score,
      type: e.Type,
      beginOffset: e.BeginOffset,
      endOffset: e.EndOffset,
    })),
  });
});

router.post("/contains-pii-entities", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body?.text) return c.json({ error: "text is required" }, 400);
  if (!body?.languageCode) return c.json({ error: "languageCode is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new ContainsPiiEntitiesCommand({ Text: body.text, LanguageCode: body.languageCode })
  );
  return c.json({
    labels: (result.Labels || []).map((l: any) => ({
      name: l.Name,
      score: l.Score,
    })),
  });
});

export default router;
