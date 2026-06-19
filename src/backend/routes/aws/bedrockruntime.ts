import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import {
  ConverseCommand,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

const router = new Hono();
const getClient = () => create(BedrockRuntimeClient);

// ── Model Operations ─────────────────────────────────────

router.post("/models/:modelId/converse", async (c: Context) => {
  const modelId = c.req.param("modelId");
  const body = await c.req.json();
  if (!body.messages?.length) return c.json({ error: "messages is required" }, 400);

  const client = getClient();
  const result = await client.send(
    new ConverseCommand({
      modelId,
      messages: body.messages,
      system: body.system,
      inferenceConfig: body.inferenceConfig,
    })
  );
  return c.json({ output: result.output, stopReason: result.stopReason, usage: result.usage, metrics: result.metrics });
});

router.post("/models/:modelId/invoke", async (c: Context) => {
  const modelId = c.req.param("modelId");
  const rawBody = await c.req.arrayBuffer();

  const client = getClient();
  const result = await client.send(
    new InvokeModelCommand({
      modelId,
      body: new Uint8Array(rawBody),
    })
  );
  return c.json({ body: result.body ? JSON.parse(Buffer.from(result.body).toString()) : null, contentType: result.contentType });
});

export default router;
