import { Hono } from "hono";
import type { Context } from "hono";
import { create } from "../../clients/aws";
import {
  IoTDataPlaneClient,
  DeleteThingShadowCommand,
  GetThingShadowCommand,
  ListNamedShadowsForThingCommand,
  PublishCommand,
  UpdateThingShadowCommand,
} from "@aws-sdk/client-iot-data-plane";

const router = new Hono();
const getClient = () => create(IoTDataPlaneClient);

const badRequest = (c: Context, msg: string) => c.json({ error: msg }, 400);

const body = async (c: Context): Promise<any> => {
  try {
    return await c.req.json();
  } catch {
    return {};
  }
};

const decodeShadow = (payload: unknown): any =>
  JSON.parse(payload ? new TextDecoder().decode(payload as Uint8Array) : "{}");

const toBytes = (value: unknown): Uint8Array => {
  if (value === undefined || value === null) {
    return new TextEncoder().encode("{}");
  }
  if (typeof value === "object") {
    return new TextEncoder().encode(JSON.stringify(value));
  }
  return new TextEncoder().encode(String(value));
};

// ---------- Thing shadows ----------

router.get("/things/:thingName/shadow", async (c: Context) => {
  const thingName = c.req.param("thingName");
  try {
    const res: any = await getClient().send(
      new GetThingShadowCommand({ thingName }),
    );
    return c.json({ thingName, payload: decodeShadow(res?.payload) });
  } catch (e: any) {
    if (e?.name === "ResourceNotFoundException") {
      return c.json({ thingName, payload: null });
    }
    return c.json({ error: e?.message || "Failed to get shadow" }, 500);
  }
});

router.post("/things/:thingName/shadow", async (c: Context) => {
  const thingName = c.req.param("thingName");
  const b = await body(c);
  const payload = b.payload;
  if (payload === undefined || payload === null || payload === "") {
    return badRequest(c, "payload is required");
  }
  if (typeof payload === "object" && !payload.state) {
    return badRequest(c, "payload must contain a state object");
  }
  if (typeof payload !== "object") {
    try {
      const parsed = JSON.parse(String(payload));
      if (!parsed.state) return badRequest(c, "payload must contain a state object");
    } catch {
      return badRequest(c, "payload must be valid JSON");
    }
  }
  const res: any = await getClient().send(
    new UpdateThingShadowCommand({ thingName, payload: toBytes(payload) }),
  );
  return c.json({ thingName, payload: decodeShadow(res?.payload) }, 201);
});

router.delete("/things/:thingName/shadow", async (c: Context) => {
  const thingName = c.req.param("thingName");
  await getClient().send(new DeleteThingShadowCommand({ thingName }));
  return c.json({ ok: true });
});

router.get("/things/:thingName/shadows", async (c: Context) => {
  const thingName = c.req.param("thingName");
  const res: any = await getClient().send(
    new ListNamedShadowsForThingCommand({ thingName }),
  );
  const shadows = (res?.results || []).map((s: any) => ({
    name: s.name || null,
    timestamp: s.timestamp || null,
  }));
  return c.json({ shadows, total: shadows.length });
});

// ---------- Publish ----------

router.post("/publish", async (c: Context) => {
  const b = await body(c);
  const topic = b.topic;
  if (!topic) return badRequest(c, "topic is required");
  const res: any = await getClient().send(
    new PublishCommand({ topic, payload: toBytes(b.payload) }),
  );
  return c.json({ ok: true });
});

export default router;
