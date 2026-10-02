import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { readJson } from "../../clients/read-json";
import {
  AccessAnalyzerClient,
  ListAnalyzersCommand,
  CreateAnalyzerCommand,
  DeleteAnalyzerCommand,
} from "@aws-sdk/client-accessanalyzer";

const router = new Hono();
const getClient = () => create(AccessAnalyzerClient);

// ── Analyzers ────────────────────────────────────────────

router.get("/analyzers", async (c: Context) => {
  const result: any = await getClient().send(new ListAnalyzersCommand({}));
  return c.json({
    analyzers: result.analyzers || [],
    total: result.analyzers?.length || 0,
  });
});

router.post("/analyzers", async (c: Context) => {
  const body: any = await readJson(c);
  if (!body?.analyzerName) return c.json({ error: "analyzerName is required" }, 400);
  if (!body?.type) return c.json({ error: "type is required" }, 400);
  const result: any = await getClient().send(
    new CreateAnalyzerCommand({
      analyzerName: body.analyzerName,
      type: body.type,
    })
  );
  return c.json({ arn: result.arn }, 201);
});

router.delete("/analyzers/:name", async (c: Context) => {
  const name = c.req.param("name")!;
  await getClient().send(new DeleteAnalyzerCommand({ analyzerName: name }));
  return c.json({ ok: true });
});

export default router;
