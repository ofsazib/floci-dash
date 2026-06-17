// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("./clients/floci", () => ({
  flociFetch: vi.fn(async () => ({
    services: { s3: "running" },
    edition: "community",
    original_edition: "community",
    version: "1.0.0",
    stats: { total: 1, running: 1, available: 0 },
  })),
  flociHealthCheck: vi.fn(async () => true),
}));

vi.mock("./routes/aws/ec2-terminal", () => ({
  setupTerminalWebSocket: vi.fn(),
}));

vi.mock("@hono/node-server", () => ({
  createAdaptorServer: vi.fn(({ fetch }: any) => ({
    listen: vi.fn(),
    on: vi.fn(),
    close: vi.fn(),
  })),
}));

import app from "./index";

describe("backend/index.ts — app wiring", () => {
  it("GET /api/healthz returns { status: 'ok' }", async () => {
    const res = await app.request("/api/healthz");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ status: "ok" });
  });

  it("GET /api/system/health proxies through to floci", async () => {
    const res = await app.request("/api/system/health");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.services).toBeDefined();
    expect(body.stats).toBeDefined();
  });

  it("GET unknown /api/* route returns 404", async () => {
    const res = await app.request("/api/nonexistent-route");
    expect(res.status).toBe(404);
  });

  it("CORS header is present on responses from allowed origin", async () => {
    const res = await app.request("/api/healthz", {
      headers: { Origin: "http://localhost:5173" },
    });
    const corsHeader = res.headers.get("access-control-allow-origin");
    expect(corsHeader).toBe("http://localhost:5173");
  });
});
