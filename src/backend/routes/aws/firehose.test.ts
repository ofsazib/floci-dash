import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());
const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) { return { __cmdName: name, ...args }; });
  };
});

vi.mock("@aws-sdk/client-firehose", () => ({
  FirehoseClient: vi.fn(function () { return { send: mockSend }; }),
  ListDeliveryStreamsCommand: createCmd("ListDeliveryStreamsCommand"),
  DescribeDeliveryStreamCommand: createCmd("DescribeDeliveryStreamCommand"),
  CreateDeliveryStreamCommand: createCmd("CreateDeliveryStreamCommand"),
  DeleteDeliveryStreamCommand: createCmd("DeleteDeliveryStreamCommand"),
  PutRecordCommand: createCmd("PutRecordCommand"),
  PutRecordBatchCommand: createCmd("PutRecordBatchCommand"),
  ListTagsForDeliveryStreamCommand: createCmd("ListTagsForDeliveryStreamCommand"),
}));

vi.mock("../../clients/aws", () => ({ create: (Ctor: any, extra?: any) => new Ctor(extra) }));

import router from "./firehose";

async function get(p: string) { return router.request(p, { method: "GET" }); }
async function post(p: string, b?: any) {
  return router.request(p, { method: "POST", body: b != null ? JSON.stringify(b) : undefined, headers: b != null ? { "content-type": "application/json" } : undefined });
}
async function del(p: string) { return router.request(p, { method: "DELETE" }); }

beforeEach(() => mockSend.mockReset());

describe("Firehose Routes", () => {
  it("GET /streams — lists streams with details", async () => {
    mockSend
      .mockResolvedValueOnce({ DeliveryStreamNames: ["stream-1", "stream-2"] })
      .mockResolvedValueOnce({ DeliveryStreamDescription: { DeliveryStreamName: "stream-1", DeliveryStreamStatus: "ACTIVE" } })
      .mockResolvedValueOnce({ DeliveryStreamDescription: { DeliveryStreamName: "stream-2", DeliveryStreamStatus: "CREATING" } });
    const res = await get("/streams");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(2);
    expect(body.streams[0].DeliveryStreamName).toBe("stream-1");
  });

  it("GET /streams — returns empty list", async () => {
    mockSend.mockResolvedValueOnce({ DeliveryStreamNames: [] });
    const res = await get("/streams");
    const body = await res.json();
    expect(body.total).toBe(0);
    expect(body.streams).toEqual([]);
  });

  it("GET /streams/:name — describes stream", async () => {
    mockSend.mockResolvedValueOnce({
      DeliveryStreamDescription: { DeliveryStreamName: "stream-1", DeliveryStreamStatus: "ACTIVE" },
    });
    const res = await get("/streams/stream-1");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.stream.DeliveryStreamName).toBe("stream-1");
  });

  it("POST /streams — creates stream (201)", async () => {
    mockSend.mockResolvedValueOnce({ DeliveryStreamARN: "arn:aws:firehose:us-east-1:123:deliverystream/stream-1" });
    const res = await post("/streams", { deliveryStreamName: "stream-1" });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.deliveryStreamARN).toContain("stream-1");
  });

  it("POST /streams — 400 if name missing", async () => {
    const res = await post("/streams", {});
    expect(res.status).toBe(400);
  });

  it("DELETE /streams/:name — deletes stream", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/streams/stream-1");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
  });

  it("POST /streams/:name/records — puts record (201)", async () => {
    mockSend.mockResolvedValueOnce({ RecordId: "rec-1" });
    const res = await post("/streams/stream-1/records", { data: "hello" });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.recordId).toBe("rec-1");
  });

  it("POST /streams/:name/records — 400 if data missing", async () => {
    const res = await post("/streams/stream-1/records", {});
    expect(res.status).toBe(400);
  });

  it("POST /streams/:name/records/batch — puts batch (201)", async () => {
    mockSend.mockResolvedValueOnce({ FailedPutCount: 0, RequestResponses: [{ RecordId: "r1" }] });
    const res = await post("/streams/stream-1/records/batch", { records: [{ data: "a" }] });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.failedPutCount).toBe(0);
  });

  it("POST /streams/:name/records/batch — 400 if records missing", async () => {
    const res = await post("/streams/stream-1/records/batch", {});
    expect(res.status).toBe(400);
  });

  it("GET /streams/:name/tags — lists tags", async () => {
    mockSend.mockResolvedValueOnce({ Tags: [{ Key: "env", Value: "prod" }], HasMoreTags: false });
    const res = await get("/streams/stream-1/tags");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tags.length).toBe(1);
  });
});
