import { Hono } from "hono";
import type { Context } from "hono";
import { getFlociEndpoint } from "../../clients/config";

const router = new Hono();

/**
 * AWS Sign-In has no AWS SDK shape — Floci exposes OAuth endpoints
 * (/v1/authorize, /_floci/signin/consent, /v1/token) that we proxy raw.
 */

router.get("/authorize", async (c: Context) => {
  const url = new URL(c.req.url);
  const qs = url.searchParams.toString();
  const res = await fetch(`${getFlociEndpoint()}/v1/authorize${qs ? `?${qs}` : ""}`, {
    redirect: "manual",
  });
  return c.json({ location: res.headers.get("location") || "" });
});

router.post("/consent", async (c: Context) => {
  const { requestId, action } = await c.req.json();
  if (!requestId || (action !== "continue" && action !== "cancel")) {
    return c.json({ error: "requestId and action (continue|cancel) are required" }, 400);
  }
  const res = await fetch(`${getFlociEndpoint()}/_floci/signin/consent`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ request_id: requestId, action }).toString(),
    redirect: "manual",
  });
  return c.json({ location: res.headers.get("location") || "" });
});

router.post("/token", async (c: Context) => {
  const body = await c.req.json();
  const res = await fetch(`${getFlociEndpoint()}/v1/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err: any = await res.json().catch(() => ({}));
    return c.json({ error: err.error || `Floci ${res.status}: ${res.statusText}` }, res.status as any);
  }
  return c.json(await res.json());
});

export default router;
