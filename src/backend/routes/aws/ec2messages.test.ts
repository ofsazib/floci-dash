import { describe, it, expect, beforeEach, vi } from "vitest";

const mockFetch = vi.hoisted(() => vi.fn());

vi.stubGlobal("fetch", mockFetch);

import router from "./ec2messages";

async function post(path: string, body?: any) {
  return router.request(path, {
    method: "POST",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { "content-type": "application/json" } : undefined,
  });
}

async function get(path: string) {
  return router.request(path, { method: "GET" });
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe("EC2 Messages Routes", () => {
  describe("POST /messages/get", () => {
    it("returns messages for an instance", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              Messages: [{ MessageId: "m-1", Payload: "{}" }],
            })
          ),
      });
      const res = await post("/messages/get", { Destination: "i-123" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.Messages).toHaveLength(1);
      expect(body.Messages[0].MessageId).toBe("m-1");
    });

    it("returns 400 when Destination missing", async () => {
      const res = await post("/messages/get", {});
      expect(res.status).toBe(400);
    });

    it("returns empty messages", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ Messages: [] })),
      });
      const res = await post("/messages/get", { Destination: "i-456" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.Messages).toEqual([]);
    });

    it("returns {} when the Floci response body is empty", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(""),
      });
      const res = await post("/messages/get", { Destination: "i-789" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({});
    });

    it("returns 500 when Floci responds with an error body", async () => {
      const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: "Service Unavailable",
        text: () => Promise.resolve("oops"),
      });
      const res = await post("/messages/get", { Destination: "i-err" });
      expect(res.status).toBe(500);
      expect(errSpy).toHaveBeenCalledWith(expect.objectContaining({ message: "EC2 Messages error 503: oops" }));
      errSpy.mockRestore();
    });

    it("falls back to statusText when the error body is unavailable", async () => {
      const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        text: () => Promise.reject(new Error("read failed")),
      });
      const res = await post("/messages/get", { Destination: "i-err2" });
      expect(res.status).toBe(500);
      expect(errSpy).toHaveBeenCalledWith(expect.objectContaining({ message: "EC2 Messages error 500: Internal Server Error" }));
      errSpy.mockRestore();
    });
  });

  describe("POST /messages/acknowledge", () => {
    it("acknowledges a message", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve("{}"),
      });
      const res = await post("/messages/acknowledge", { MessageId: "m-1" });
      expect(res.status).toBe(200);
    });

    it("returns 400 when MessageId missing", async () => {
      const res = await post("/messages/acknowledge", {});
      expect(res.status).toBe(400);
    });
  });

  describe("POST /messages/send-reply", () => {
    it("sends a reply", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve("{}"),
      });
      const res = await post("/messages/send-reply", {
        MessageId: "m-1",
        Payload: "{}",
      });
      expect(res.status).toBe(200);
    });

    it("returns 400 when MessageId missing", async () => {
      const res = await post("/messages/send-reply", { Payload: "{}" });
      expect(res.status).toBe(400);
    });
  });

  describe("POST /messages/fail", () => {
    it("fails a message", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve("{}"),
      });
      const res = await post("/messages/fail", {
        MessageId: "m-1",
        FailureType: "Timeout",
      });
      expect(res.status).toBe(200);
    });

    it("returns 400 when MessageId missing", async () => {
      const res = await post("/messages/fail", { FailureType: "Timeout" });
      expect(res.status).toBe(400);
    });

    it("defaults FailureType to Unknown when omitted", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve("{}"),
      });
      const res = await post("/messages/fail", { MessageId: "m-1" });
      expect(res.status).toBe(200);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toContain("localhost");
      expect(JSON.parse(init.body).FailureType).toBe("Unknown");
    });
  });

  describe("POST /messages/delete", () => {
    it("deletes a message", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve("{}"),
      });
      const res = await post("/messages/delete", { MessageId: "m-1" });
      expect(res.status).toBe(200);
    });

    it("returns 400 when MessageId missing", async () => {
      const res = await post("/messages/delete", {});
      expect(res.status).toBe(400);
    });
  });

  describe("GET /endpoint", () => {
    it("returns the endpoint", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              Endpoint: "ec2messages.us-east-1.amazonaws.com",
            })
          ),
      });
      const res = await get("/endpoint");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.Endpoint).toBe("ec2messages.us-east-1.amazonaws.com");
    });
  });
});
