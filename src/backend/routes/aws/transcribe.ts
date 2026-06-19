import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { TranscribeClient } from "@aws-sdk/client-transcribe";
import {
  ListTranscriptionJobsCommand,
  GetTranscriptionJobCommand,
  StartTranscriptionJobCommand,
  DeleteTranscriptionJobCommand,
  ListVocabulariesCommand,
} from "@aws-sdk/client-transcribe";

const router = new Hono();
const getClient = () => create(TranscribeClient);

// ── Transcription Jobs ───────────────────────────────────

router.get("/jobs", async (c: Context) => {
  const status = c.req.query("status") as any;
  const client = getClient();
  const result = await client.send(
    new ListTranscriptionJobsCommand({ Status: status })
  );
  const jobs = result.TranscriptionJobSummaries || [];
  return c.json({ jobs, total: jobs.length });
});

router.get("/jobs/:name", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  const result = await client.send(
    new GetTranscriptionJobCommand({ TranscriptionJobName: name })
  );
  return c.json({ job: result.TranscriptionJob });
});

router.post("/jobs", async (c: Context) => {
  const body = await c.req.json<{
    transcriptionJobName: string;
    media: { mediaFileUri: string };
    languageCode?: string;
    mediaFormat?: string;
  }>();
  if (!body.transcriptionJobName) return c.json({ error: "transcriptionJobName is required" }, 400);
  if (!body.media?.mediaFileUri) return c.json({ error: "media.mediaFileUri is required" }, 400);

  const client = getClient();
  const result = await client.send(
    new StartTranscriptionJobCommand({
      TranscriptionJobName: body.transcriptionJobName,
      Media: { MediaFileUri: body.media.mediaFileUri },
      LanguageCode: body.languageCode as any,
      MediaFormat: body.mediaFormat as any,
    })
  );
  return c.json({ job: result.TranscriptionJob }, 201);
});

router.delete("/jobs/:name", async (c: Context) => {
  const name = c.req.param("name");
  const client = getClient();
  await client.send(new DeleteTranscriptionJobCommand({ TranscriptionJobName: name }));
  return c.json({ deleted: true });
});

// ── Vocabularies ─────────────────────────────────────────

router.get("/vocabularies", async (c: Context) => {
  const client = getClient();
  const result = await client.send(new ListVocabulariesCommand({}));
  const vocabularies = result.Vocabularies || [];
  return c.json({ vocabularies, total: vocabularies.length });
});

export default router;
