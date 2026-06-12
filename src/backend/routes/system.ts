import { Hono } from "hono";
import type { Context } from "hono";
import { flociFetch } from "../clients/floci";
import type { HealthResponse, InitResponse, InfoResponse } from "../types";

const router = new Hono();

router.get("/health", async (c: Context) => {
  const health = await flociFetch("/_floci/health") as any;
  const info = await flociFetch("/_floci/info") as InfoResponse;

  const services = health.services as Record<string, string>;
  const running = Object.values(services).filter((s: string) => s === "running").length;
  const total = Object.keys(services).length;

  const result: HealthResponse = {
    services: health.services,
    edition: health.edition || info.edition,
    original_edition: health.original_edition || info.original_edition,
    version: info.version || health.version,
    stats: { total, running, available: total - running },
  };

  return c.json(result);
});

router.get("/init", async (c: Context) => {
  const data = await flociFetch("/_floci/init") as InitResponse;
  return c.json(data);
});

export default router;
