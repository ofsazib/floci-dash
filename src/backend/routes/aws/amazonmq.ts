import { Hono } from "hono";
import type { Context } from "hono";
import { flociFetch } from "../../clients/floci";

const router = new Hono();

// ── Brokers ────────────────────────────────────────────

router.get("/brokers", async (c: Context) => {
  const data = await flociFetch("/_aws/mq/v1/brokers");
  return c.json({ brokers: data.brokers || data.brokerSummaries || [], total: (data.brokers || data.brokerSummaries || []).length });
});

router.get("/brokers/:id", async (c: Context) => {
  const brokerId = c.req.param("id");
  const data = await flociFetch(`/_aws/mq/v1/brokers/${brokerId}`);
  return c.json({ broker: data });
});

router.post("/brokers", async (c: Context) => {
  const body = await c.req.json();
  if (!body.brokerName) return c.json({ error: "brokerName is required" }, 400);
  if (!body.engineType) return c.json({ error: "engineType is required" }, 400);
  if (!body.hostInstanceType) return c.json({ error: "hostInstanceType is required" }, 400);
  const data = await flociFetch("/_aws/mq/v1/brokers", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return c.json(data, 201);
});

router.delete("/brokers/:id", async (c: Context) => {
  const brokerId = c.req.param("id");
  await flociFetch(`/_aws/mq/v1/brokers/${brokerId}`, { method: "DELETE" });
  return c.json({ deleted: true });
});

router.post("/brokers/:id/reboot", async (c: Context) => {
  const brokerId = c.req.param("id");
  await flociFetch(`/_aws/mq/v1/brokers/${brokerId}/reboot`, { method: "POST" });
  return c.json({ rebooted: true });
});

// ── Users ──────────────────────────────────────────────

router.get("/brokers/:id/users", async (c: Context) => {
  const brokerId = c.req.param("id");
  const data = await flociFetch(`/_aws/mq/v1/brokers/${brokerId}/users`);
  return c.json({ users: data.users || [], total: (data.users || []).length });
});

router.get("/brokers/:id/users/:username", async (c: Context) => {
  const brokerId = c.req.param("id");
  const username = c.req.param("username");
  const data = await flociFetch(`/_aws/mq/v1/brokers/${brokerId}/users/${username}`);
  return c.json({ user: data });
});

router.post("/brokers/:id/users/:username", async (c: Context) => {
  const brokerId = c.req.param("id");
  const username = c.req.param("username");
  const body = await c.req.json();
  if (!body.password) return c.json({ error: "password is required" }, 400);
  const data = await flociFetch(`/_aws/mq/v1/brokers/${brokerId}/users/${username}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return c.json(data, 201);
});

router.delete("/brokers/:id/users/:username", async (c: Context) => {
  const brokerId = c.req.param("id");
  const username = c.req.param("username");
  await flociFetch(`/_aws/mq/v1/brokers/${brokerId}/users/${username}`, { method: "DELETE" });
  return c.json({ deleted: true });
});

export default router;
