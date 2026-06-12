import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { readFile } from "node:fs/promises";
import systemRoutes from "./routes/system";
import inspectionRoutes from "./routes/inspection";
import awsRoutes from "./routes/aws/index";

const app = new Hono();

app.use("*", cors({ origin: ["http://localhost:5173", "http://localhost:3000"] }));

app.onError((err: Error, c: any) => {
  console.error("Unhandled error:", err);
  return c.json({ error: err.message || "Internal server error" }, 500);
});

app.route("/api/system", systemRoutes);
app.route("/api/inspect", inspectionRoutes);
app.route("/api/aws", awsRoutes);

app.get("/api/healthz", (c: any) => c.json({ status: "ok" }));

const isProd = process.env.NODE_ENV === "production";
if (isProd) {
  app.use("/*", serveStatic({ root: "./dist/frontend" }));
  app.get("/*", async (c: any) => {
    const html = await readFile("./dist/frontend/index.html", "utf-8");
    return c.html(html);
  });
}

const port = Number(process.env.PORT) || 3000;

if (process.argv[1]?.endsWith("index.js") || process.argv[1]?.endsWith("index.ts")) {
  serve({ fetch: app.fetch, port }, (info: any) => {
    console.log(`Floci Dashboard running on http://localhost:${info.port}`);
  });
}

export default app;
