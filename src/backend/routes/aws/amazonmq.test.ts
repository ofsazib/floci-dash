import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.hoisted(() => vi.fn());

vi.mock("../../clients/floci", () => ({
  flociFetch: mockFetch,
}));

import router from "./amazonmq";

describe("AmazonMQ routes", () => {
  beforeEach(() => vi.clearAllMocks());

  const get = (path: string) => router.request(path);
  const post = (path: string, body?: any) =>
    router.request(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
  const del = (path: string) =>
    router.request(path, { method: "DELETE" });

  // ── Brokers ────────────────────────────────────────────

  describe("GET /brokers", () => {
    it("returns brokers list", async () => {
      mockFetch.mockResolvedValueOnce({ brokers: [{ brokerId: "b-1", brokerName: "my-broker" }] });
      const res = await get("/brokers");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.brokers).toHaveLength(1);
      // Floci serves MQ at /v1/brokers — guard against the old /_aws/mq prefix
      expect(mockFetch.mock.calls[0][0]).toBe("/v1/brokers");
    });

    it("returns empty list", async () => {
      mockFetch.mockResolvedValueOnce({});
      const res = await get("/brokers");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.brokers).toEqual([]);
    });
  });

  describe("GET /brokers/:id", () => {
    it("returns a broker", async () => {
      mockFetch.mockResolvedValueOnce({ brokerId: "b-1", brokerName: "my-broker" });
      const res = await get("/brokers/b-1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.broker.brokerId).toBe("b-1");
    });
  });

  describe("POST /brokers", () => {
    it("creates a broker", async () => {
      mockFetch.mockResolvedValueOnce({ brokerId: "b-new", brokerArn: "arn:mq:..." });
      const res = await post("/brokers", { brokerName: "new-broker", engineType: "ActiveMQ", hostInstanceType: "mq.t2.micro" });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.brokerId).toBe("b-new");
    });

    it("returns 400 without brokerName", async () => {
      const res = await post("/brokers", { engineType: "ActiveMQ", hostInstanceType: "mq.t2.micro" });
      expect(res.status).toBe(400);
    });

    it("returns 400 without engineType", async () => {
      const res = await post("/brokers", { brokerName: "b-1", hostInstanceType: "mq.t2.micro" });
      expect(res.status).toBe(400);
    });

    it("returns 400 without hostInstanceType", async () => {
      const res = await post("/brokers", { brokerName: "b-1", engineType: "ActiveMQ" });
      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /brokers/:id", () => {
    it("deletes a broker", async () => {
      mockFetch.mockResolvedValueOnce({ deleted: true });
      const res = await del("/brokers/b-1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });
  });

  describe("POST /brokers/:id/reboot", () => {
    it("reboots a broker", async () => {
      mockFetch.mockResolvedValueOnce({});
      const res = await post("/brokers/b-1/reboot");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.rebooted).toBe(true);
    });
  });

  // ── Users ──────────────────────────────────────────────

  describe("GET /brokers/:id/users", () => {
    it("returns users list", async () => {
      mockFetch.mockResolvedValueOnce({ users: [{ username: "admin" }] });
      const res = await get("/brokers/b-1/users");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.users).toHaveLength(1);
    });

    it("returns empty list", async () => {
      mockFetch.mockResolvedValueOnce({});
      const res = await get("/brokers/b-1/users");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.users).toEqual([]);
    });
  });

  describe("GET /brokers/:id/users/:username", () => {
    it("returns a user", async () => {
      mockFetch.mockResolvedValueOnce({ username: "admin", groups: ["admin"] });
      const res = await get("/brokers/b-1/users/admin");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.user.username).toBe("admin");
    });
  });

  describe("POST /brokers/:id/users/:username", () => {
    it("creates a user", async () => {
      mockFetch.mockResolvedValueOnce({ username: "new-user" });
      const res = await post("/brokers/b-1/users/new-user", { password: "pass123" });
      expect(res.status).toBe(201);
    });

    it("returns 400 without password", async () => {
      const res = await post("/brokers/b-1/users/new-user", {});
      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /brokers/:id/users/:username", () => {
    it("deletes a user", async () => {
      mockFetch.mockResolvedValueOnce({ deleted: true });
      const res = await del("/brokers/b-1/users/admin");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });
  });
});
