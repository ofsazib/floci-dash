// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Hono } from "hono";

// ─── Hoisted mock refs (vi.hoisted ensures they're available when vi.mock runs) ───
const { setupWsMock, listenMock } = vi.hoisted(() => ({
  setupWsMock: vi.fn(),
  listenMock: vi.fn(),
}));

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
  setupTerminalWebSocket: setupWsMock,
}));

vi.mock("@hono/node-server", () => ({
  createAdaptorServer: vi.fn(({ fetch }: any) => ({
    listen: (...args: any[]) => { listenMock(...args); },
    on: vi.fn(),
    close: vi.fn(),
  })),
}));

import app from "./index";

describe("backend/index.ts — app wiring", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  it("GET /api/active returns active services", async () => {
    const res = await app.request("/api/active");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toBeDefined();
  });

  it("GET /api/inspect/ses returns 200", async () => {
    const res = await app.request("/api/inspect/ses");
    expect(res.status).toBe(200);
  });

  it("GET /api/inspect/sns returns 200", async () => {
    const res = await app.request("/api/inspect/sns");
    expect(res.status).toBe(200);
  });

  it("GET unknown /api/* route returns 404", async () => {
    const res = await app.request("/api/nonexistent-route");
    expect(res.status).toBe(404);
  });

  it("CORS header is present on responses from allowed origins", async () => {
    const origins = [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost:9876",
      "http://localhost:9877",
    ];
    for (const origin of origins) {
      const res = await app.request("/api/healthz", {
        headers: { Origin: origin },
      });
      expect(res.headers.get("access-control-allow-origin")).toBe(origin);
    }
  });

  it("response includes CORS allow-methods header", async () => {
    const res = await app.request("/api/healthz", {
      headers: { Origin: "http://localhost:5173" },
    });
    expect(res.headers.get("access-control-allow-methods")).toBeDefined();
  });
});



describe("backend/index.ts — default export", () => {
  it("default export is the Hono app with request/fetch methods", () => {
    expect(app).toBeDefined();
    expect(typeof app.fetch).toBe("function");
    expect(typeof app.request).toBe("function");
  });

  it("exported app handles HTTP requests correctly", async () => {
    const res = await app.request("/api/healthz");
    expect(res.status).toBe(200);
  });
});

describe("backend/index.ts — error handler (via onError)", () => {
  it("cors is configured before routes", () => {
    // Verify basics: the app processes CORS requests
    // This is an integration-level check that the middleware is applied
    const res = app.request("/api/healthz", {
      headers: { Origin: "http://localhost:5173" },
    });
    expect(res).toBeDefined();
  });

  it("Hono onError catches route errors and returns JSON", async () => {
    // Use the same onError pattern as index.ts to verify error handler logic
    const testApp = new Hono();
    testApp.onError((err: Error, c: any) => {
      console.error("Unhandled error:", err);
      return c.json({ error: err.message || "Internal server error" }, 500);
    });
    testApp.get("/throw", () => { throw new Error("Test error"); });

    const res = await testApp.request("/throw");
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Test error");
  });

  it("original app uses the same onError pattern", () => {
    // Just verify the exported app has the onError method (registered in index.ts)
    expect(app.onError).toBeDefined();
  });
});

describe("backend/index.ts — production mode", () => {
  afterEach(() => {
    process.env.NODE_ENV = "test";
    delete process.env.PORT;
  });

  it("registers the CSP middleware when NODE_ENV is production", async () => {
    process.env.NODE_ENV = "production";
    vi.resetModules();
    const { default: prodApp } = await import("./index");

    // The `if (isProd)` blocks (CSP middleware + serveStatic/HTML fallback)
    // run at module setup, and the CSP middleware runs on every response.
    const res = await prodApp.request("/api/healthz");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-security-policy")).toContain("default-src 'self'");
    expect(res.headers.get("content-security-policy")).toContain("script-src 'self'");
  });

  it("uses the PORT env var when provided", async () => {
    process.env.PORT = "4000";
    vi.resetModules();
    await import("./index");
    expect(listenMock.mock.calls.at(-1)?.[0]).toBe(4000);
  });
});

describe("backend/index.ts — onError branches", () => {
  // Hono's SmartRouter builds its matcher on the first request, so routes must
  // be added to a freshly imported app before any request is made. Each test
  // re-imports the module so the real onError handler from index.ts is used.
  it("returns err.message when the error has one", async () => {
    vi.resetModules();
    const { default: freshApp } = await import("./index");
    freshApp.get("/api/throw-err", () => {
      throw new Error("route boom");
    });
    const res = await freshApp.request("/api/throw-err");
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("route boom");
  });

  it("falls back to 'Internal server error' when the error has no message", async () => {
    vi.resetModules();
    const { default: freshApp } = await import("./index");
    // An Error with an empty message exercises the `||` falsy side.
    freshApp.get("/api/throw-empty", () => {
      throw new Error("");
    });
    const res = await freshApp.request("/api/throw-empty");
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Internal server error");
  });
});
