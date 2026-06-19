import { Hono } from "hono";
import type { Context } from "hono";

const FLOCI_URL = process.env.FLOCI_URL || "http://localhost:4566";

async function flociEc2Messages(body: Record<string, unknown>, target: string) {
  const res = await fetch(`${FLOCI_URL}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target": `AmazonSSMMessageDeliveryService.${target}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`EC2 Messages error ${res.status}: ${text || res.statusText}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

const router = new Hono();

router.post("/messages/get", async (c: Context) => {
  const { Destination } = await c.req.json();
  if (!Destination) return c.json({ error: "Destination is required" }, 400);
  const result = await flociEc2Messages({ Destination }, "GetMessages");
  return c.json(result);
});

router.post("/messages/acknowledge", async (c: Context) => {
  const { MessageId } = await c.req.json();
  if (!MessageId) return c.json({ error: "MessageId is required" }, 400);
  const result = await flociEc2Messages({ MessageId }, "AcknowledgeMessage");
  return c.json(result);
});

router.post("/messages/send-reply", async (c: Context) => {
  const { MessageId, Payload } = await c.req.json();
  if (!MessageId) return c.json({ error: "MessageId is required" }, 400);
  const result = await flociEc2Messages({ MessageId, Payload }, "SendReply");
  return c.json(result);
});

router.post("/messages/fail", async (c: Context) => {
  const { MessageId, FailureType } = await c.req.json();
  if (!MessageId) return c.json({ error: "MessageId is required" }, 400);
  const result = await flociEc2Messages(
    { MessageId, FailureType: FailureType || "Unknown" },
    "FailMessage"
  );
  return c.json(result);
});

router.post("/messages/delete", async (c: Context) => {
  const { MessageId } = await c.req.json();
  if (!MessageId) return c.json({ error: "MessageId is required" }, 400);
  const result = await flociEc2Messages({ MessageId }, "DeleteMessage");
  return c.json(result);
});

router.get("/endpoint", async (c: Context) => {
  const result = await flociEc2Messages({}, "GetEndpoint");
  return c.json(result);
});

export default router;
