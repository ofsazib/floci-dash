import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.hoisted(() => vi.fn());
vi.mock("../../clients/floci", () => ({
  flociFetch: (...args: any[]) => mockFetch(...args),
}));

import router from "./bedrockagentcorecontrol";

describe("Bedrock Agent Core Control routes", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("Runtimes", () => {
    it("POST /runtimes lists runtimes", async () => {
      mockFetch.mockResolvedValueOnce({ agentRuntimes: [{ agentRuntimeId: "r1" }] });
      const res = await router.request("/runtimes", { method: "POST" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.agentRuntimes).toHaveLength(1);
    });

    it("PUT /runtimes creates a runtime", async () => {
      mockFetch.mockResolvedValueOnce({ agentRuntimeId: "r1", status: "CREATING" });
      const res = await router.request("/runtimes", {
        method: "PUT",
        body: JSON.stringify({ agentRuntimeName: "test" }),
        headers: { "content-type": "application/json" },
      });
      expect(res.status).toBe(202);
    });

    it("GET /runtimes/:id gets a runtime", async () => {
      mockFetch.mockResolvedValueOnce({ agentRuntimeId: "r1", status: "READY" });
      const res = await router.request("/runtimes/r1");
      expect(res.status).toBe(200);
    });

    it("PUT /runtimes/:id updates a runtime", async () => {
      mockFetch.mockResolvedValueOnce({ agentRuntimeId: "r1", status: "UPDATING" });
      const res = await router.request("/runtimes/r1", {
        method: "PUT",
        body: JSON.stringify({ description: "updated" }),
        headers: { "content-type": "application/json" },
      });
      expect(res.status).toBe(202);
    });

    it("DELETE /runtimes/:id deletes a runtime", async () => {
      mockFetch.mockResolvedValueOnce({ agentRuntimeId: "r1", status: "DELETING" });
      const res = await router.request("/runtimes/r1", { method: "DELETE" });
      expect(res.status).toBe(202);
    });

    it("POST /runtimes/:id/versions lists versions", async () => {
      mockFetch.mockResolvedValueOnce({ agentRuntimes: [] });
      const res = await router.request("/runtimes/r1/versions", { method: "POST" });
      expect(res.status).toBe(200);
    });
  });

  describe("Endpoints", () => {
    it("PUT /runtimes/:id/endpoints creates an endpoint", async () => {
      mockFetch.mockResolvedValueOnce({ endpointName: "ep1", status: "CREATING" });
      const res = await router.request("/runtimes/r1/endpoints", {
        method: "PUT",
        body: JSON.stringify({ name: "ep1" }),
        headers: { "content-type": "application/json" },
      });
      expect(res.status).toBe(202);
    });

    it("POST /runtimes/:id/endpoints lists endpoints", async () => {
      mockFetch.mockResolvedValueOnce({ runtimeEndpoints: [] });
      const res = await router.request("/runtimes/r1/endpoints", { method: "POST" });
      expect(res.status).toBe(200);
    });

    it("GET /runtimes/:id/endpoints/:name gets an endpoint", async () => {
      mockFetch.mockResolvedValueOnce({ endpointName: "ep1", status: "READY" });
      const res = await router.request("/runtimes/r1/endpoints/ep1");
      expect(res.status).toBe(200);
    });

    it("PUT /runtimes/:id/endpoints/:name updates an endpoint", async () => {
      mockFetch.mockResolvedValueOnce({ endpointName: "ep1", status: "UPDATING" });
      const res = await router.request("/runtimes/r1/endpoints/ep1", {
        method: "PUT",
        body: JSON.stringify({ description: "updated" }),
        headers: { "content-type": "application/json" },
      });
      expect(res.status).toBe(202);
    });

    it("DELETE /runtimes/:id/endpoints/:name deletes an endpoint", async () => {
      mockFetch.mockResolvedValueOnce({ endpointName: "ep1", status: "DELETING" });
      const res = await router.request("/runtimes/r1/endpoints/ep1", { method: "DELETE" });
      expect(res.status).toBe(202);
    });
  });
});
