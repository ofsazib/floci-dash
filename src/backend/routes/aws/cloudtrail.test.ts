import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());
const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) { return { __cmdName: name, ...args }; });
  };
});

vi.mock("@aws-sdk/client-cloudtrail", () => ({
  CloudTrailClient: vi.fn(function () { return { send: mockSend }; }),
  DescribeTrailsCommand: createCmd("DescribeTrailsCommand"),
  CreateTrailCommand: createCmd("CreateTrailCommand"),
  UpdateTrailCommand: createCmd("UpdateTrailCommand"),
  DeleteTrailCommand: createCmd("DeleteTrailCommand"),
  StartLoggingCommand: createCmd("StartLoggingCommand"),
  StopLoggingCommand: createCmd("StopLoggingCommand"),
  GetTrailStatusCommand: createCmd("GetTrailStatusCommand"),
}));

vi.mock("../../clients/aws", () => ({ create: (Ctor: any, extra?: any) => new Ctor(extra) }));

import router from "./cloudtrail";

async function get(p: string) { return router.request(p, { method: "GET" }); }
async function post(p: string, b?: any) {
  return router.request(p, { method: "POST", body: b != null ? JSON.stringify(b) : undefined, headers: b != null ? { "content-type": "application/json" } : undefined });
}
async function put(p: string, b?: any) {
  return router.request(p, { method: "PUT", body: b != null ? JSON.stringify(b) : undefined, headers: b != null ? { "content-type": "application/json" } : undefined });
}
async function del(p: string) { return router.request(p, { method: "DELETE" }); }

beforeEach(() => mockSend.mockReset());

describe("CloudTrail Routes", () => {
  it("GET /trails — lists trails", async () => {
    mockSend.mockResolvedValueOnce({ trailList: [{ Name: "trail-1", TrailARN: "arn:...:trail-1" }] });
    const res = await get("/trails");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
  });

  it("GET /trails — empty list", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/trails");
    const body = await res.json();
    expect(body.total).toBe(0);
  });

  it("POST /trails — creates trail (201)", async () => {
    mockSend.mockResolvedValueOnce({ Name: "trail-1", TrailARN: "arn:..." });
    const res = await post("/trails", { name: "trail-1" });
    expect(res.status).toBe(201);
  });

  it("POST /trails — 400 if name missing", async () => {
    const res = await post("/trails", {});
    expect(res.status).toBe(400);
  });

  it("PUT /trails/:name — updates trail", async () => {
    mockSend.mockResolvedValueOnce({ Name: "trail-1" });
    const res = await put("/trails/trail-1", { s3BucketName: "new-bucket" });
    expect(res.status).toBe(200);
  });

  it("DELETE /trails/:name — deletes trail", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/trails/trail-1");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
  });

  it("POST /trails/:name/start — starts logging", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/trails/trail-1/start");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.started).toBe(true);
  });

  it("POST /trails/:name/stop — stops logging", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/trails/trail-1/stop");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.stopped).toBe(true);
  });

  it("GET /trails/:name/status — gets trail status", async () => {
    mockSend.mockResolvedValueOnce({ IsLogging: true });
    const res = await get("/trails/trail-1/status");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.isLogging).toBe(true);
  });
});
