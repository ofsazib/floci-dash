import { describe, it, expect, beforeEach, vi } from "vitest";
import router from "./system";

const mockFlociFetch = vi.hoisted(() => vi.fn());
vi.mock("../clients/floci", () => ({ flociFetch: mockFlociFetch }));

beforeEach(() => {
  mockFlociFetch.mockReset();
});

describe("System Routes", () => {
  it("GET /health — returns aggregated health + info", async () => {
    mockFlociFetch
      .mockResolvedValueOnce({ services: { s3: "running", ec2: "stopped" }, edition: "Community", original_edition: "Community" })
      .mockResolvedValueOnce({ version: "1.5.22", edition: "Community" });
    const res = await router.request("/health", { method: "GET" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.version).toBe("1.5.22");
    expect(body.stats.total).toBe(2);
    expect(body.stats.running).toBe(1);
    expect(body.stats.available).toBe(1);
    expect(body.services.s3).toBe("running");
  });

  it("GET /health — handles missing info fields", async () => {
    mockFlociFetch
      .mockResolvedValueOnce({ services: {} })
      .mockResolvedValueOnce({});
    const res = await router.request("/health", { method: "GET" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.stats.total).toBe(0);
    expect(body.stats.running).toBe(0);
  });

  it("GET /init — returns init data", async () => {
    mockFlociFetch.mockResolvedValueOnce({ status: "initialized" });
    const res = await router.request("/init", { method: "GET" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("initialized");
  });
});
