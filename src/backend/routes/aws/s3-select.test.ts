import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// The S3 Select tests stub globalThis.fetch directly (not vi.stubGlobal), so it
// must be restored after each test — otherwise the mock leaks into other test
// files that share a vitest fork worker and breaks real network fetches
// (e.g. src/backend/integration.test.ts).
const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

// Mock the config module to control floci endpoint
vi.mock("../../clients/config", () => ({
  getFlociEndpoint: vi.fn(() => "http://localhost:4566"),
}));

// Mock sanitize
vi.mock("../../clients/sanitize", () => ({
  sanitizeBucketName: vi.fn((name: string) => name),
  sanitizeS3Key: vi.fn((key: string) => key),
}));

import { getFlociEndpoint } from "../../clients/config";

// Import the router after mocks are set up (vi.mock is hoisted above imports)
import router from "./s3-select";

// Use Hono's built-in fetch for testing — more robust than manual route matching
async function executeRoute(method: string, path: string, body?: any) {
  const req = new Request(`http://localhost${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return router.fetch(req);
}

describe("s3-select routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /buckets/:name/select", () => {
    it("returns 404 for path with empty bucket param (Hono doesn't match empty segments)", async () => {
      const res = await executeRoute("POST", "/buckets//select", {
        key: "test.csv",
        expression: "SELECT * FROM S3Object",
      });
      expect(res.status).toBe(404);
    });

    it("returns 400 when key is missing", async () => {
      const res = await executeRoute("POST", "/buckets/my-bucket/select", {
        expression: "SELECT * FROM S3Object",
      });
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data.error).toContain("key");
    });

    it("returns 400 when expression is missing", async () => {
      const res = await executeRoute("POST", "/buckets/my-bucket/select", {
        key: "test.csv",
      });
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data.error).toContain("Expression");
    });

    it("returns 400 when expression is empty string", async () => {
      const res = await executeRoute("POST", "/buckets/my-bucket/select", {
        key: "test.csv",
        expression: "  ",
      });
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data.error).toContain("Expression");
    });

    it("returns 400 for invalid inputType", async () => {
      const res = await executeRoute("POST", "/buckets/my-bucket/select", {
        key: "test.csv",
        expression: "SELECT * FROM S3Object",
        inputType: "XML",
      });
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data.error).toContain("inputType");
    });

    it("returns 400 for invalid outputFormat", async () => {
      const res = await executeRoute("POST", "/buckets/my-bucket/select", {
        key: "test.csv",
        expression: "SELECT * FROM S3Object",
        outputFormat: "XML",
      });
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data.error).toContain("outputFormat");
    });

    it("accepts CSV input with default settings", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new Uint8Array(0)),
      });
      globalThis.fetch = mockFetch;

      const res = await executeRoute("POST", "/buckets/my-bucket/select", {
        key: "test.csv",
        expression: "SELECT * FROM S3Object LIMIT 10",
      });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.result).toBeDefined();
      expect(data.stats).toBeNull();
    });

    it("accepts JSON input type", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new Uint8Array(0)),
      });
      globalThis.fetch = mockFetch;

      const res = await executeRoute("POST", "/buckets/my-bucket/select", {
        key: "data.json",
        expression: "SELECT * FROM S3Object s LIMIT 5",
        inputType: "JSON",
        outputFormat: "JSON",
      });
      expect(res.status).toBe(200);
    });

    it("accepts fileHeaderInfo USE for CSV", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new Uint8Array(0)),
      });
      globalThis.fetch = mockFetch;

      const res = await executeRoute("POST", "/buckets/my-bucket/select", {
        key: "data.csv",
        expression: "SELECT name, age FROM S3Object",
        fileHeaderInfo: "USE",
      });
      expect(res.status).toBe(200);
    });

    it("constructs correct XML for CSV query", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new Uint8Array(0)),
      });
      globalThis.fetch = mockFetch;

      await executeRoute("POST", "/buckets/my-bucket/select", {
        key: "test.csv",
        expression: "SELECT * FROM S3Object LIMIT 50",
        fileHeaderInfo: "USE",
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toContain("my-bucket");
      expect(url).toContain("test.csv");
      expect(url).toContain("?select");
      expect(init.method).toBe("POST");
      expect(init.body).toContain("<Expression>SELECT * FROM S3Object LIMIT 50</Expression>");
      expect(init.body).toContain("<FileHeaderInfo>USE</FileHeaderInfo>");
      expect(init.body).toContain("<CSV>");
      expect(init.body).toContain("<OutputSerialization>");
    });

    it("constructs correct XML for JSON query", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new Uint8Array(0)),
      });
      globalThis.fetch = mockFetch;

      await executeRoute("POST", "/buckets/my-bucket/select", {
        key: "data.json",
        expression: "SELECT * FROM S3Object s WHERE s.age > 18",
        inputType: "JSON",
        outputFormat: "JSON",
      });

      const [, init] = mockFetch.mock.calls[0];
      expect(init.body).toContain("<JSON>");
      expect(init.body).toContain("<Type>DOCUMENT</Type>");
      expect(init.body).toContain("<Expression>SELECT * FROM S3Object s WHERE s.age &gt; 18</Expression>");
    });

    it("parses event stream Records correctly", async () => {
      const recordsPayload = new TextEncoder().encode("name,age\nAlice,30\nBob,25\n");
      const recordsMsg = buildEventStreamMessage(
        { ":message-type": "event", ":event-type": "Records", ":content-type": "application/octet-stream" },
        recordsPayload
      );
      const statsXml = "<Stats><BytesScanned>100</BytesScanned><BytesProcessed>100</BytesProcessed><BytesReturned>50</BytesReturned></Stats>";
      const statsMsg = buildEventStreamMessage(
        { ":message-type": "event", ":event-type": "Stats", ":content-type": "text/xml" },
        new TextEncoder().encode(statsXml)
      );
      const endMsg = buildEventStreamMessage(
        { ":message-type": "event", ":event-type": "End" },
        new Uint8Array(0)
      );

      const combined = new Uint8Array(recordsMsg.length + statsMsg.length + endMsg.length);
      combined.set(recordsMsg, 0);
      combined.set(statsMsg, recordsMsg.length);
      combined.set(endMsg, recordsMsg.length + statsMsg.length);

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(combined.buffer),
      });
      globalThis.fetch = mockFetch;

      const res = await executeRoute("POST", "/buckets/my-bucket/select", {
        key: "test.csv",
        expression: "SELECT * FROM S3Object",
      });
      const data = await res.json();
      expect(data.result).toBe("name,age\nAlice,30\nBob,25\n");
      expect(data.stats).toEqual({
        bytesScanned: 100,
        bytesProcessed: 100,
        bytesReturned: 50,
      });
    });

    it("parses event stream — message without :event-type header (|| '' fallback)", async () => {
      // A message with no :event-type header — should be silently skipped
      const unknownMsg = buildEventStreamMessage(
        { ":message-type": "event" },
        new TextEncoder().encode("some data")
      );
      const endMsg = buildEventStreamMessage(
        { ":message-type": "event", ":event-type": "End" },
        new Uint8Array(0)
      );

      const combined = new Uint8Array(unknownMsg.length + endMsg.length);
      combined.set(unknownMsg, 0);
      combined.set(endMsg, unknownMsg.length);

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(combined.buffer),
      });
      globalThis.fetch = mockFetch;

      const res = await executeRoute("POST", "/buckets/my-bucket/select", {
        key: "test.csv",
        expression: "SELECT * FROM S3Object",
      });
      const data = await res.json();
      expect(data.result).toBe("");
      expect(data.stats).toBeNull();
    });

    it("parses Stats with missing fields (ternary falsy branch)", async () => {
      const statsXml = "<Stats><BytesScanned>50</BytesScanned></Stats>";
      const statsMsg = buildEventStreamMessage(
        { ":message-type": "event", ":event-type": "Stats", ":content-type": "text/xml" },
        new TextEncoder().encode(statsXml)
      );
      const endMsg = buildEventStreamMessage(
        { ":message-type": "event", ":event-type": "End" },
        new Uint8Array(0)
      );

      const combined = new Uint8Array(statsMsg.length + endMsg.length);
      combined.set(statsMsg, 0);
      combined.set(endMsg, statsMsg.length);

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(combined.buffer),
      });
      globalThis.fetch = mockFetch;

      const res = await executeRoute("POST", "/buckets/my-bucket/select", {
        key: "test.csv",
        expression: "SELECT * FROM S3Object",
      });
      const data = await res.json();
      expect(data.stats).toEqual({
        bytesScanned: 50,
        bytesProcessed: 0,
        bytesReturned: 0,
      });
    });

    it("parses event stream — malformed binary with totalLen < 12", async () => {
      // Construct raw binary with totalLen = 11 (< 12) to trigger the validation break
      const buf = new ArrayBuffer(12);
      const view = new DataView(buf);
      view.setInt32(0, 11, false);  // totalLen < 12 → break
      view.setInt32(4, 0, false);   // headersLen = 0
      view.setInt32(8, 0, false);   // CRC placeholder
      const malformedData = new Uint8Array(buf);

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(malformedData.buffer),
      });
      globalThis.fetch = mockFetch;

      const res = await executeRoute("POST", "/buckets/my-bucket/select", {
        key: "test.csv",
        expression: "SELECT * FROM S3Object",
      });
      const data = await res.json();
      expect(data.result).toBe("");
      expect(data.stats).toBeNull();
    });

    it("parses Stats with no BytesScanned field (ternary falsy for scanned)", async () => {
      const statsXml = "<Stats><BytesProcessed>50</BytesProcessed></Stats>";
      const statsMsg = buildEventStreamMessage(
        { ":message-type": "event", ":event-type": "Stats", ":content-type": "text/xml" },
        new TextEncoder().encode(statsXml)
      );
      const endMsg = buildEventStreamMessage(
        { ":message-type": "event", ":event-type": "End" },
        new Uint8Array(0)
      );

      const combined = new Uint8Array(statsMsg.length + endMsg.length);
      combined.set(statsMsg, 0);
      combined.set(endMsg, statsMsg.length);

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(combined.buffer),
      });
      globalThis.fetch = mockFetch;

      const res = await executeRoute("POST", "/buckets/my-bucket/select", {
        key: "test.csv",
        expression: "SELECT * FROM S3Object",
      });
      const data = await res.json();
      expect(data.stats).toEqual({
        bytesScanned: 0,
        bytesProcessed: 50,
        bytesReturned: 0,
      });
    });

    it("handles Floci error response", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        text: () => Promise.resolve("<Error><Code>NoSuchKey</Code></Error>"),
      });
      globalThis.fetch = mockFetch;

      const res = await executeRoute("POST", "/buckets/my-bucket/select", {
        key: "nonexistent.csv",
        expression: "SELECT * FROM S3Object",
      });
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data.error).toContain("Floci");
    });

    it("handles network error gracefully", async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error("Connection refused"));
      globalThis.fetch = mockFetch;

      const res = await executeRoute("POST", "/buckets/my-bucket/select", {
        key: "test.csv",
        expression: "SELECT * FROM S3Object",
      });
      const data = await res.json();
      expect(res.status).toBe(500);
      expect(data.error).toBe("Connection refused");
    });

    it("handles Floci error with unreadable body (text() rejection fallback)", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        text: () => Promise.reject(new Error("stream destroyed")),
      });
      globalThis.fetch = mockFetch;

      const res = await executeRoute("POST", "/buckets/my-bucket/select", {
        key: "test.csv",
        expression: "SELECT * FROM S3Object",
      });
      const data = await res.json();
      expect(res.status).toBe(500);
      expect(data.error).toContain("Floci");
      expect(data.detail).toBe("");
    });

    it("returns 400 when bucket name sanitizes to empty", async () => {
      const { sanitizeBucketName } = await import("../../clients/sanitize");
      (sanitizeBucketName as any).mockReturnValueOnce("");

      const res = await executeRoute("POST", "/buckets/%25%25%25/select", {
        key: "test.csv",
        expression: "SELECT * FROM S3Object",
      });
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data.error).toContain("Invalid bucket name");
    });

    it("returns 400 when bucket name is empty string", async () => {
      const { sanitizeBucketName } = await import("../../clients/sanitize");
      (sanitizeBucketName as any).mockReturnValue("");

      const res = await executeRoute("POST", "/buckets/bad%20bucket/select", {
        key: "test.csv",
        expression: "SELECT * FROM S3Object",
      });
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data.error).toContain("Invalid bucket name");
    });
  });
});

// ── Event stream builder helper ───────────────────────────

function buildEventStreamMessage(
  headers: Record<string, string>,
  payload: Uint8Array
): Uint8Array {
  const headerEntries = Object.entries(headers);
  let headersBytes = 0;
  for (const [name, value] of headerEntries) {
    headersBytes += 1 + name.length + 1 + 2 + value.length;
  }

  const totalLen = 12 + headersBytes + payload.length + 4; // prelude + headers + payload + crc
  const buf = new ArrayBuffer(totalLen);
  const view = new DataView(buf);
  const arr = new Uint8Array(buf);

  // Total length (BE)
  view.setInt32(0, totalLen, false);
  // Headers length (BE)
  view.setInt32(4, headersBytes, false);
  // Prelude CRC (placeholder - not validated by parser)
  view.setInt32(8, 0, false);

  let offset = 12;
  for (const [name, value] of headerEntries) {
    arr[offset++] = name.length;
    for (let i = 0; i < name.length; i++) arr[offset++] = name.charCodeAt(i);
    arr[offset++] = 7; // string type
    view.setUint16(offset, value.length, false); offset += 2;
    for (let i = 0; i < value.length; i++) arr[offset++] = value.charCodeAt(i);
  }

  // Payload
  arr.set(payload, offset);
  offset += payload.length;

  // Message CRC (placeholder)
  view.setInt32(offset, 0, false);

  return arr;
}
