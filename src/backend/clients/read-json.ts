import type { Context } from "hono";

// Parse a JSON request body, treating absent/invalid bodies as an empty object.
// Centralised so the failure path has one covered implementation instead of an
// untestable inline `.catch(() => ({}))` per route handler.
export async function readJson(c: Context): Promise<any> {
  try {
    return await c.req.json();
  } catch {
    return {};
  }
}
