import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import {
  TranslateClient,
  TranslateTextCommand,
  TranslateDocumentCommand,
  ListLanguagesCommand,
  type ListLanguagesCommandInput,
} from "@aws-sdk/client-translate";

const router = new Hono();
const getClient = () => create(TranslateClient);

router.get("/languages", async (c: Context) => {
  const rawDisplay = c.req.query("displayLanguageCode");
  const displayLanguageCode = (rawDisplay || undefined) as
    | NonNullable<ListLanguagesCommandInput["DisplayLanguageCode"]>
    | undefined;
  const client = getClient();
  const result = await client.send(new ListLanguagesCommand({ DisplayLanguageCode: displayLanguageCode }));
  const languages = (result.Languages || []).map((l: any) => ({
    languageCode: l.LanguageCode,
    languageName: l.LanguageName,
  }));
  return c.json({ languages, displayLanguageCode: result.DisplayLanguageCode ?? "en" });
});

router.post("/translate-text", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body?.text) return c.json({ error: "text is required" }, 400);
  if (!body?.sourceLanguageCode) return c.json({ error: "sourceLanguageCode is required" }, 400);
  if (!body?.targetLanguageCode) return c.json({ error: "targetLanguageCode is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new TranslateTextCommand({
      Text: body.text,
      SourceLanguageCode: body.sourceLanguageCode,
      TargetLanguageCode: body.targetLanguageCode,
      TerminologyNames: body.terminologyNames,
    })
  );
  return c.json({
    translatedText: result.TranslatedText,
    sourceLanguageCode: result.SourceLanguageCode,
    targetLanguageCode: result.TargetLanguageCode,
    appliedTerminologies: result.AppliedTerminologies || [],
  });
});

router.post("/translate-document", async (c: Context) => {
  const body = await c.req.json<any>();
  if (!body?.content) return c.json({ error: "content is required" }, 400);
  if (!body?.contentType) return c.json({ error: "contentType is required" }, 400);
  if (!body?.sourceLanguageCode) return c.json({ error: "sourceLanguageCode is required" }, 400);
  if (!body?.targetLanguageCode) return c.json({ error: "targetLanguageCode is required" }, 400);
  const client = getClient();
  const result = await client.send(
    new TranslateDocumentCommand({
      Document: {
        Content: Buffer.from(body.content, "utf8"),
        ContentType: body.contentType,
      },
      SourceLanguageCode: body.sourceLanguageCode,
      TargetLanguageCode: body.targetLanguageCode,
    })
  );
  const translatedContent = result.TranslatedDocument?.Content
    ? Buffer.from(result.TranslatedDocument.Content).toString("utf8")
    : null;
  return c.json({
    translatedDocument: translatedContent,
    sourceLanguageCode: result.SourceLanguageCode,
    targetLanguageCode: result.TargetLanguageCode,
  });
});

export default router;
