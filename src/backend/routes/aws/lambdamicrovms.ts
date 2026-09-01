import { Hono } from "hono";
import type { Context } from "hono";
import { flociFetch } from "../../clients/floci";

const router = new Hono();
const BASE = "/2025-09-09";

// ── MicroVM Images ────────────────────────────────────────

router.get("/microvm-images", async (c: Context) => {
  const result = await flociFetch(`${BASE}/microvm-images`);
  return c.json(result);
});

router.get("/microvm-images/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const result = await flociFetch(`${BASE}/microvm-images/${encodeURIComponent(id)}`);
  return c.json(result);
});

router.post("/microvm-images", async (c: Context) => {
  const body = await c.req.json();
  if (!body.name) return c.json({ error: "name is required" }, 400);
/* istanbul ignore next */
  const result = await flociFetch(`${BASE}/microvm-images`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return c.json(result, 201);
});

router.put("/microvm-images/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const body = await c.req.json();
  const result = await flociFetch(`${BASE}/microvm-images/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return c.json(result);
});

router.delete("/microvm-images/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const result = await flociFetch(`${BASE}/microvm-images/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  return c.json(result);
});

// ── Versions ──────────────────────────────────────────────

router.get("/microvm-images/:imageId/versions", async (c: Context) => {
  const imageId = c.req.param("imageId")!;
  const result = await flociFetch(`${BASE}/microvm-images/${encodeURIComponent(imageId)}/versions`);
  return c.json(result);
});

router.get("/microvm-images/:imageId/versions/:version", async (c: Context) => {
  const { imageId, version } = c.req.param();
  const result = await flociFetch(
    `${BASE}/microvm-images/${encodeURIComponent(imageId)}/versions/${encodeURIComponent(version)}`
  );
  return c.json(result);
});

router.patch("/microvm-images/:imageId/versions/:version", async (c: Context) => {
  const { imageId, version } = c.req.param();
  const body = await c.req.json();
  const result = await flociFetch(
    `${BASE}/microvm-images/${encodeURIComponent(imageId)}/versions/${encodeURIComponent(version)}`,
    { method: "PATCH", body: JSON.stringify(body) }
  );
  return c.json(result);
});

router.delete("/microvm-images/:imageId/versions/:version", async (c: Context) => {
  const { imageId, version } = c.req.param();
  const result = await flociFetch(
    `${BASE}/microvm-images/${encodeURIComponent(imageId)}/versions/${encodeURIComponent(version)}`,
    { method: "DELETE" }
  );
  return c.json(result);
});

// ── Builds ────────────────────────────────────────────────

router.get("/microvm-images/:imageId/versions/:version/builds", async (c: Context) => {
  const { imageId, version } = c.req.param();
  const result = await flociFetch(
    `${BASE}/microvm-images/${encodeURIComponent(imageId)}/versions/${encodeURIComponent(version)}/builds`
  );
  return c.json(result);
});

router.get("/microvm-images/:imageId/versions/:version/builds/:buildId", async (c: Context) => {
  const { imageId, version, buildId } = c.req.param();
  const result = await flociFetch(
    `${BASE}/microvm-images/${encodeURIComponent(imageId)}/versions/${encodeURIComponent(version)}/builds/${encodeURIComponent(buildId)}`
  );
  return c.json(result);
});

// ── Managed Images ────────────────────────────────────────

router.get("/managed-microvm-images", async (c: Context) => {
  const result = await flociFetch(`${BASE}/managed-microvm-images`);
  return c.json(result);
});

router.get("/managed-microvm-images/:id/versions", async (c: Context) => {
  const id = c.req.param("id")!;
  const result = await flociFetch(`${BASE}/managed-microvm-images/${encodeURIComponent(id)}/versions`);
  return c.json(result);
});

// ── MicroVMs ──────────────────────────────────────────────

router.get("/microvms", async (c: Context) => {
  const result = await flociFetch(`${BASE}/microvms`);
  return c.json(result);
});

router.get("/microvms/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const result = await flociFetch(`${BASE}/microvms/${encodeURIComponent(id)}`);
  return c.json(result);
});

router.post("/microvms", async (c: Context) => {
  const body = await c.req.json();
  if (!body.imageIdentifier) return c.json({ error: "imageIdentifier is required" }, 400);
  const result = await flociFetch(`${BASE}/microvms`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return c.json(result);
});

router.delete("/microvms/:id", async (c: Context) => {
  const id = c.req.param("id")!;
  const result = await flociFetch(`${BASE}/microvms/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  return c.json(result);
});

export default router;
