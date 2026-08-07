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
  LookupEventsCommand: createCmd("LookupEventsCommand"),
  GetEventSelectorsCommand: createCmd("GetEventSelectorsCommand"),
  PutEventSelectorsCommand: createCmd("PutEventSelectorsCommand"),
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

  // ── Lookup Events ────────────────────────────────────

  it("POST /trails/lookup-events — returns events", async () => {
    mockSend.mockResolvedValueOnce({
      Events: [
        {
          EventId: "evt-123",
          EventName: "CreateBucket",
          EventTime: new Date("2024-01-01T00:00:00Z"),
          EventSource: "s3.amazonaws.com",
          Username: "admin",
          CloudTrailEvent: '{"key":"value"}',
          Resources: [{ ResourceType: "AWS::S3::Bucket", ResourceName: "my-bucket" }],
        },
      ],
      NextToken: "next-page",
    });
    const res = await post("/trails/lookup-events", {
      startTime: "2024-01-01T00:00:00Z",
      maxResults: 10,
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.events[0].eventName).toBe("CreateBucket");
    expect(body.nextToken).toBe("next-page");
  });

  it("POST /trails/lookup-events — returns empty results", async () => {
    mockSend.mockResolvedValueOnce({ Events: [] });
    const res = await post("/trails/lookup-events", {});
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(0);
    expect(body.nextToken).toBeNull();
  });

  it("POST /trails/lookup-events — passes lookup attributes", async () => {
    mockSend.mockResolvedValueOnce({ Events: [] });
    await post("/trails/lookup-events", {
      lookupAttributes: [{ AttributeKey: "EventName", AttributeValue: "CreateBucket" }],
    });
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.LookupAttributes).toEqual([{ AttributeKey: "EventName", AttributeValue: "CreateBucket" }]);
  });

  it("POST /trails/lookup-events — passes endTime, nextToken, and eventCategory", async () => {
    mockSend.mockResolvedValueOnce({ Events: [] });
    await post("/trails/lookup-events", {
      endTime: "2024-01-02T00:00:00Z",
      nextToken: "tok-2",
      eventCategory: "Management",
    });
    const cmd = mockSend.mock.calls[0][0];
    expect(cmd.EndTime).toBeInstanceOf(Date);
    expect(cmd.NextToken).toBe("tok-2");
    expect(cmd.EventCategory).toBe("Management");
    expect(cmd.StartTime).toBeUndefined();
    expect(cmd.MaxResults).toBeUndefined();
  });

  it("POST /trails/lookup-events — sparse response defaults to empty events", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/trails/lookup-events", {});
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.events).toEqual([]);
    expect(body.total).toBe(0);
    expect(body.nextToken).toBeNull();
  });

  // ── Event Selectors ──────────────────────────────────

  it("GET /trails/:name/event-selectors — returns selectors", async () => {
    mockSend.mockResolvedValueOnce({
      EventSelectors: [{ ReadWriteType: "All", IncludeManagementEvents: true }],
      AdvancedEventSelectors: [],
    });
    const res = await get("/trails/trail-1/event-selectors");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.trailName).toBe("trail-1");
    expect(body.eventSelectors).toHaveLength(1);
    expect(body.advancedEventSelectors).toEqual([]);
  });

  it("GET /trails/:name/event-selectors — returns empty", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/trails/trail-1/event-selectors");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.eventSelectors).toEqual([]);
  });

  it("PUT /trails/:name/event-selectors — sets selectors", async () => {
    mockSend.mockResolvedValueOnce({
      EventSelectors: [{ ReadWriteType: "ReadOnly", IncludeManagementEvents: false }],
    });
    const res = await put("/trails/trail-1/event-selectors", {
      eventSelectors: [{ ReadWriteType: "ReadOnly", IncludeManagementEvents: false }],
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.updated).toBe(true);
    expect(body.eventSelectors[0].ReadWriteType).toBe("ReadOnly");
  });

  it("PUT /trails/:name/event-selectors — sparse response defaults to empty selectors", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await put("/trails/trail-1/event-selectors", {
      eventSelectors: [{ ReadWriteType: "All", IncludeManagementEvents: true }],
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.updated).toBe(true);
    expect(body.eventSelectors).toEqual([]);
    expect(body.advancedEventSelectors).toEqual([]);
  });

  it("PUT /trails/:name/event-selectors — 400 when nothing provided", async () => {
    const res = await put("/trails/trail-1/event-selectors", {});
    expect(res.status).toBe(400);
  });
});
