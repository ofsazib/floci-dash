import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { mockSend, createCmd } = vi.hoisted(() => {
  const mockSend = vi.fn();
  const createCmd = (name: string) => function (this: any, input: any) { return { __cmd: name, ...(input || {}) }; };
  return { mockSend, createCmd };
});

vi.mock("../../clients/aws", () => ({
  create: vi.fn(() => ({ send: mockSend })),
}));

vi.mock("@aws-sdk/client-iot-data-plane", () => ({
  IoTDataPlaneClient: class {},
  DeleteThingShadowCommand: createCmd("DeleteThingShadowCommand"),
  GetThingShadowCommand: createCmd("GetThingShadowCommand"),
  ListNamedShadowsForThingCommand: createCmd("ListNamedShadowsForThingCommand"),
  PublishCommand: createCmd("PublishCommand"),
  UpdateThingShadowCommand: createCmd("UpdateThingShadowCommand"),
}));

import iotdataRoutes from "./iotdata";
import { Hono } from "hono";

const app = new Hono();
app.route("/", iotdataRoutes);

const get = (path: string) => app.request(path);
const post = (path: string, json?: any) =>
  app.request(path, json === undefined ? { method: "POST" } : { method: "POST", body: JSON.stringify(json), headers: { "content-type": "application/json" } });
const del = (path: string) => app.request(path, { method: "DELETE" });

const decode = (payload: any) => JSON.parse(new TextDecoder().decode(payload));

beforeEach(() => {
  mockSend.mockReset();
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("iotdata — shadows", () => {
  it("GET shadow returns parsed payload", async () => {
    mockSend.mockResolvedValueOnce({ payload: new TextEncoder().encode('{"state":{"reported":1}}') });
    const b = await (await get("/things/lamp/shadow")).json();
    expect(b.thingName).toBe("lamp");
    expect(b.payload).toEqual({ state: { reported: 1 } });
  });

  it("GET shadow returns null payload when not found", async () => {
    const err: any = new Error("nf"); err.name = "ResourceNotFoundException";
    mockSend.mockRejectedValueOnce(err);
    const b = await (await get("/things/lamp/shadow")).json();
    expect(b.payload).toBeNull();
  });

  it("GET shadow returns 500 on other errors (message and generic)", async () => {
    const err: any = new Error("boom"); err.name = "OtherError";
    mockSend.mockRejectedValueOnce(err);
    const res = await get("/things/lamp/shadow");
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("boom");
    mockSend.mockRejectedValueOnce({});
    const res2 = await get("/things/lamp/shadow");
    expect((await res2.json()).error).toBe("Failed to get shadow");
  });

  it("POST shadow validates payload", async () => {
    expect((await post("/things/lamp/shadow", {})).status).toBe(400);
    expect((await post("/things/lamp/shadow", { payload: "" })).status).toBe(400);
    expect((await post("/things/lamp/shadow", { payload: { nope: 1 } })).status).toBe(400);
    expect((await post("/things/lamp/shadow", { payload: "{bad" })).status).toBe(400);
    expect((await post("/things/lamp/shadow", { payload: '"str"' })).status).toBe(400);
  });

  it("POST shadow updates with object and string payloads", async () => {
    mockSend.mockResolvedValueOnce({ payload: new TextEncoder().encode('{"state":{}}') });
    const res = await post("/things/lamp/shadow", { payload: { state: { desired: 1 } } });
    expect(res.status).toBe(201);
    expect(decode(mockSend.mock.calls[0][0].payload)).toEqual({ state: { desired: 1 } });

    mockSend.mockResolvedValueOnce({ payload: new TextEncoder().encode('{"state":{}}') });
    await post("/things/lamp/shadow", { payload: '{"state":{"desired":2}}' });
    expect(decode(mockSend.mock.calls[1][0].payload)).toEqual({ state: { desired: 2 } });
  });

  it("DELETE shadow", async () => {
    const res = await del("/things/lamp/shadow");
    expect(await res.json()).toEqual({ ok: true });
    expect(mockSend.mock.calls[0][0]).toMatchObject({ thingName: "lamp" });
  });

  it("covers undefined-payload and sparse fallbacks", async () => {
    // GET shadow when SDK returns no payload
    mockSend.mockResolvedValueOnce({});
    const b = await (await get("/things/lamp/shadow")).json();
    expect(b.payload).toEqual({});

    // POST shadow when SDK returns no payload
    mockSend.mockResolvedValueOnce({});
    const res = await post("/things/lamp/shadow", { payload: { state: { desired: 1 } } });
    expect(res.status).toBe(201);
    expect((await res.json()).payload).toEqual({});

    // POST shadow when SDK resolves undefined
    mockSend.mockResolvedValueOnce(undefined);
    const res2 = await post("/things/lamp/shadow", { payload: { state: { desired: 2 } } });
    expect(res2.status).toBe(201);
    expect((await res2.json()).payload).toEqual({});

    // invalid JSON body hits the tolerant body() parser
    const bad = await app.request("/things/lamp/shadow", { method: "POST", body: "not-json", headers: { "content-type": "application/json" } });
    expect(bad.status).toBe(400);

    // named shadows with no results and a sparse result row
    mockSend.mockResolvedValueOnce({});
    const b2 = await (await get("/things/lamp/shadows")).json();
    expect(b2.shadows).toEqual([]);
    mockSend.mockResolvedValueOnce({ results: [{}] });
    const b3 = await (await get("/things/lamp/shadows")).json();
    expect(b3.shadows[0]).toEqual({ name: null, timestamp: null });
  });

  it("GET named shadows lists", async () => {
    mockSend.mockResolvedValueOnce({ results: [{ name: "named1", timestamp: 5 }] });
    const b = await (await get("/things/lamp/shadows")).json();
    expect(b.total).toBe(1);
    expect(b.shadows[0]).toEqual({ name: "named1", timestamp: 5 });
    mockSend.mockResolvedValueOnce({});
    const b2 = await (await get("/things/lamp/shadows")).json();
    expect(b2.shadows).toEqual([]);
  });
});

describe("iotdata — publish", () => {
  it("publishes with object payload", async () => {
    const res = await post("/publish", { topic: "a/b", payload: { on: true } });
    expect(await res.json()).toEqual({ ok: true });
    expect(mockSend.mock.calls[0][0].topic).toBe("a/b");
    expect(decode(mockSend.mock.calls[0][0].payload)).toEqual({ on: true });
  });

  it("publishes with string payload and defaults empty", async () => {
    await post("/publish", { topic: "a/b", payload: "hello" });
    expect(new TextDecoder().decode(mockSend.mock.calls[0][0].payload)).toBe("hello");
    await post("/publish", { topic: "a/b" });
    expect(new TextDecoder().decode(mockSend.mock.calls[1][0].payload)).toBe("{}");
  });

  it("POST /publish 400 without topic", async () => {
    expect((await post("/publish", { payload: {} })).status).toBe(400);
  });
});
