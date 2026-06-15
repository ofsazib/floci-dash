import { describe, it, expect, beforeEach, vi } from "vitest";
import router from "./inspection";

const mockFlociFetch = vi.hoisted(() => vi.fn());
vi.mock("../clients/floci", () => ({ flociFetch: mockFlociFetch }));

beforeEach(() => {
  mockFlociFetch.mockReset();
});

describe("Inspection Routes", () => {
  it("GET /sqs/messages — requires queueUrl", async () => {
    const res = await router.request("/sqs/messages", { method: "GET" });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("queueUrl");
  });

  it("GET /sqs/messages — returns messages for queue", async () => {
    mockFlociFetch.mockResolvedValueOnce({ messages: [{ body: "test" }] });
    const res = await router.request("/sqs/messages?queueUrl=http://localhost:4566/queue/my-queue", { method: "GET" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.messages).toHaveLength(1);
  });

  it("GET /ses — returns SES inbox", async () => {
    mockFlociFetch.mockResolvedValueOnce({ emails: [{ subject: "Hello" }] });
    const res = await router.request("/ses", { method: "GET" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.emails[0].subject).toBe("Hello");
  });

  it("DELETE /ses — clears SES inbox", async () => {
    mockFlociFetch.mockResolvedValueOnce({});
    const res = await router.request("/ses", { method: "DELETE" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.cleared).toBe(true);
  });

  it("GET /sns — returns SNS inbox", async () => {
    mockFlociFetch.mockResolvedValueOnce({ notifications: [] });
    const res = await router.request("/sns", { method: "GET" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.notifications).toEqual([]);
  });

  it("DELETE /sns — clears SNS inbox", async () => {
    mockFlociFetch.mockResolvedValueOnce({});
    const res = await router.request("/sns", { method: "DELETE" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.cleared).toBe(true);
  });
});
