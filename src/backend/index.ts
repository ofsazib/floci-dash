import { Hono } from "hono";
import { cors } from "hono/cors";
import { createAdaptorServer } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { readFile } from "node:fs/promises";
import systemRoutes from "./routes/system";
import inspectionRoutes from "./routes/inspection";
import activeRoutes from "./routes/active";
import awsRoutes from "./routes/aws/index";
import { setupTerminalWebSocket } from "./routes/aws/ec2-terminal";
import type { Server as HttpServer } from "node:http";

const app = new Hono();

const isProd = process.env.NODE_ENV === "production";

app.use("*", cors({ origin: ["http://localhost:5173", "http://localhost:3000", "http://localhost:9876", "http://localhost:9877"] }));

// Content Security Policy (production only)
if (isProd) {
  app.use("*", async (c: any, next: any) => {
    await next();
    c.res.headers.set(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        // Vite production builds use hashed script filenames — no inline scripts.
        "script-src 'self'",
        // Cloudscape Design System uses inline styles extensively.
        "style-src 'self' 'unsafe-inline'",
        // Floci logo uses an inline SVG data URI; S3 object preview images.
        "img-src 'self' data:",
        // API calls + WebSocket (EC2 terminal) — same origin.
        "connect-src 'self'",
        // Cloudscape font assets.
        "font-src 'self'",
        // S3 PDF preview is displayed in an iframe.
        "frame-src 'self'",
        // Worker scripts (e.g. for background tasks).
        "worker-src 'self' blob:",
        // Block object/plugin-based attacks.
        "object-src 'none'",
        // Restrict form actions to same origin.
        "form-action 'self'",
        // Block inline event handlers and javascript: URLs.
        "base-uri 'self'",
      ].join("; ")
    );
  });
}

app.onError((err: Error, c: any) => {
  console.error("Unhandled error:", err);
  return c.json({ error: err.message || "Internal server error" }, 500);
});

app.route("/api/system", systemRoutes);
app.route("/api/active", activeRoutes);
app.route("/api/inspect", inspectionRoutes);
app.route("/api/aws", awsRoutes);

app.get("/api/healthz", (c: any) => c.json({ status: "ok" }));

if (isProd) {
  app.use("/*", serveStatic({ root: "./dist/frontend" }));
  app.get("/*", async (c: any) => {
    const html = await readFile("./dist/frontend/index.html", "utf-8");
    return c.html(html);
  });
}

const port = Number(process.env.PORT) || 3000;

// Use createAdaptorServer to get the raw Node.js HTTP server for WebSocket support
const httpServer = createAdaptorServer({ fetch: app.fetch }) as HttpServer;

httpServer.listen(port, () => {
  console.log(`Floci Dashboard running on http://localhost:${port}`);
});

// Attach WebSocket server for EC2 terminal access
setupTerminalWebSocket(httpServer);

export default app;
