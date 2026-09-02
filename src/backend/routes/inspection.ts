import { Hono } from "hono";
import type { Context } from "hono";
import { flociFetch } from "../clients/floci";

const router = new Hono();

router.get("/sqs/messages", async (c: Context) => {
  const queueUrl = c.req.query("queueUrl");
  if (!queueUrl) return c.json({ error: "queueUrl query parameter required" }, 400);
  const data = await flociFetch(`/_aws/sqs/messages?QueueUrl=${encodeURIComponent(queueUrl)}`);
  return c.json(data);
});

router.get("/ses", async (c: Context) => {
  const data = await flociFetch("/_aws/ses");
  return c.json(data);
});

router.delete("/ses", async (c: Context) => {
  await flociFetch("/_aws/ses", { method: "DELETE" });
  return c.json({ cleared: true });
});

router.get("/sns", async (c: Context) => {
  const data = await flociFetch("/_aws/sns");
  return c.json(data);
});

router.delete("/sns", async (c: Context) => {
  await flociFetch("/_aws/sns", { method: "DELETE" });
  return c.json({ cleared: true });
});

export default router;
