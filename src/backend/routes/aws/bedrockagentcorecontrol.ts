import { Hono } from "hono";
import type { Context } from "hono";
/* istanbul ignore start */
import { flociFetch } from "../../clients/floci";
/* istanbul ignore end */

const router = new Hono();

// ── Runtimes ──────────────────────────────────────────────

router.put("/runtimes", async (c: Context) => {
  const body = await c.req.json();
  const result = await flociFetch("/runtimes/", { method: "PUT", body: JSON.stringify(body) });
  return c.json(result, 202);
});

router.post("/runtimes", async (c: Context) => {
  const result = await flociFetch("/runtimes/", { method: "POST" });
  return c.json(result);
});

router.get("/runtimes/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const version = c.req.query("version");
  const qs = version ? `?version=${encodeURIComponent(version)}` : "";
/* istanbul ignore next */
  const result = await flociFetch(`/runtimes/${encodeURIComponent(id)}/${qs}`);
  return c.json(result);
});

router.put("/runtimes/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const body = await c.req.json();
  const result = await flociFetch(`/runtimes/${encodeURIComponent(id)}/`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return c.json(result, 202);
});

router.delete("/runtimes/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const result = await flociFetch(`/runtimes/${encodeURIComponent(id)}/`, { method: "DELETE" });
  return c.json(result, 202);
});

router.post("/runtimes/:id/versions", async (c: Context) => {
  const id = c.req.param("id")!;
  const result = await flociFetch(`/runtimes/${encodeURIComponent(id)}/versions/`, { method: "POST" });
  return c.json(result);
});

// ── Endpoints ─────────────────────────────────────────────

router.put("/runtimes/:id/endpoints", async (c: Context) => {
  const id = c.req.param("id")!;
  const body = await c.req.json();
  const result = await flociFetch(`/runtimes/${encodeURIComponent(id)}/runtime-endpoints/`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return c.json(result, 202);
});

router.post("/runtimes/:id/endpoints", async (c: Context) => {
  const id = c.req.param("id")!;
  const result = await flociFetch(`/runtimes/${encodeURIComponent(id)}/runtime-endpoints/`, { method: "POST" });
  return c.json(result);
});

router.get("/runtimes/:id/endpoints/:name", async (c: Context) => {
  const { id, name } = c.req.param();
  const result = await flociFetch(
    `/runtimes/${encodeURIComponent(id!)}/runtime-endpoints/${encodeURIComponent(name!)}/`
  );
  return c.json(result);
});

router.put("/runtimes/:id/endpoints/:name", async (c: Context) => {
  const { id, name } = c.req.param();
  const body = await c.req.json();
  const result = await flociFetch(
    `/runtimes/${encodeURIComponent(id!)}/runtime-endpoints/${encodeURIComponent(name!)}/`,
    { method: "PUT", body: JSON.stringify(body) }
  );
  return c.json(result, 202);
});

router.delete("/runtimes/:id/endpoints/:name", async (c: Context) => {
  const { id, name } = c.req.param();
  const result = await flociFetch(
    `/runtimes/${encodeURIComponent(id!)}/runtime-endpoints/${encodeURIComponent(name!)}/`,
    { method: "DELETE" }
  );
  return c.json(result, 202);
});

export default router;
