import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { TextractClient } from "@aws-sdk/client-textract";
import {
  DetectDocumentTextCommand,
  AnalyzeDocumentCommand,
  StartDocumentTextDetectionCommand,
  GetDocumentTextDetectionCommand,
  StartDocumentAnalysisCommand,
  GetDocumentAnalysisCommand,
} from "@aws-sdk/client-textract";

const router = new Hono();
const getClient = () => create(TextractClient);

// ── Synchronous Operations ───────────────────────────────

router.post("/detect-document-text", async (c: Context) => {
  const body = await c.req.json();
  const client = getClient();
  const result = await client.send(
    new DetectDocumentTextCommand({
      Document: body.document,
    })
  );
  return c.json({
    documentMetadata: result.DocumentMetadata,
    blocks: result.Blocks,
    modelVersion: result.DetectDocumentTextModelVersion,
  });
});

router.post("/analyze-document", async (c: Context) => {
  const body = await c.req.json();
  const client = getClient();
  const result = await client.send(
    new AnalyzeDocumentCommand({
      Document: body.document,
      FeatureTypes: body.featureTypes,
    })
  );
  return c.json({
    documentMetadata: result.DocumentMetadata,
    blocks: result.Blocks,
    modelVersion: result.AnalyzeDocumentModelVersion,
  });
});

// ── Async Operations ─────────────────────────────────────

router.post("/document-text-detection/start", async (c: Context) => {
  const body = await c.req.json();
  const client = getClient();
  const result = await client.send(
    new StartDocumentTextDetectionCommand({
      DocumentLocation: body.documentLocation,
    })
  );
  return c.json({ jobId: result.JobId }, 201);
});

router.get("/document-text-detection/:jobId", async (c: Context) => {
  const jobId = c.req.param("jobId");
  const client = getClient();
  const result = await client.send(
    new GetDocumentTextDetectionCommand({ JobId: jobId })
  );
  return c.json({
    jobStatus: result.JobStatus,
    documentMetadata: result.DocumentMetadata,
    blocks: result.Blocks,
  });
});

router.post("/document-analysis/start", async (c: Context) => {
  const body = await c.req.json();
  const client = getClient();
  const result = await client.send(
    new StartDocumentAnalysisCommand({
      DocumentLocation: body.documentLocation,
      FeatureTypes: body.featureTypes,
    })
  );
  return c.json({ jobId: result.JobId }, 201);
});

router.get("/document-analysis/:jobId", async (c: Context) => {
  const jobId = c.req.param("jobId");
  const client = getClient();
  const result = await client.send(
    new GetDocumentAnalysisCommand({ JobId: jobId })
  );
  return c.json({
    jobStatus: result.JobStatus,
    documentMetadata: result.DocumentMetadata,
    blocks: result.Blocks,
  });
});

export default router;
