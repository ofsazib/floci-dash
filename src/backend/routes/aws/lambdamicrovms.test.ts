import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.hoisted(() => vi.fn());
vi.mock("../../clients/floci", () => ({
  flociFetch: (...args: any[]) => mockFetch(...args),
}));

import router from "./lambdamicrovms";

describe("Lambda MicroVMs routes", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("MicroVM Images", () => {
    it("GET /microvm-images lists images", async () => {
      mockFetch.mockResolvedValueOnce({ items: [{ name: "img1" }], nextToken: null });
      const res = await router.request("/microvm-images");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.items).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledWith("/2025-09-09/microvm-images");
    });

    it("GET /microvm-images/:id gets an image", async () => {
      mockFetch.mockResolvedValueOnce({ name: "img1", state: "ACTIVE" });
      const res = await router.request("/microvm-images/img-arn-1");
      expect(res.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledWith("/2025-09-09/microvm-images/img-arn-1");
    });

    it("POST /microvm-images creates an image", async () => {
      mockFetch.mockResolvedValueOnce({ name: "new-img", state: "CREATING" });
      const res = await router.request("/microvm-images", {
        method: "POST",
        body: JSON.stringify({ name: "new-img" }),
        headers: { "content-type": "application/json" },
      });
      expect(res.status).toBe(201);
    });

    it("POST /microvm-images returns 400 without name", async () => {
      const res = await router.request("/microvm-images", {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "content-type": "application/json" },
      });
      expect(res.status).toBe(400);
    });

    it("PUT /microvm-images/:id updates an image", async () => {
      mockFetch.mockResolvedValueOnce({ name: "img1", state: "UPDATING" });
      const res = await router.request("/microvm-images/img-arn-1", {
        method: "PUT",
        body: JSON.stringify({ description: "updated" }),
        headers: { "content-type": "application/json" },
      });
      expect(res.status).toBe(200);
    });

    it("DELETE /microvm-images/:id deletes an image", async () => {
      mockFetch.mockResolvedValueOnce({ imageIdentifier: "img-arn-1", state: "DELETING" });
      const res = await router.request("/microvm-images/img-arn-1", { method: "DELETE" });
      expect(res.status).toBe(200);
    });
  });

  describe("Versions", () => {
    it("GET /microvm-images/:imageId/versions lists versions", async () => {
      mockFetch.mockResolvedValueOnce({ items: [{ imageVersion: "v1" }], nextToken: null });
      const res = await router.request("/microvm-images/img-1/versions");
      expect(res.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledWith("/2025-09-09/microvm-images/img-1/versions");
    });

    it("GET /microvm-images/:imageId/versions/:version gets a version", async () => {
      mockFetch.mockResolvedValueOnce({ imageVersion: "v1", state: "ACTIVE" });
      const res = await router.request("/microvm-images/img-1/versions/v1");
      expect(res.status).toBe(200);
    });

    it("PATCH /microvm-images/:imageId/versions/:version updates a version", async () => {
      mockFetch.mockResolvedValueOnce({ imageVersion: "v1", status: "UPDATED" });
      const res = await router.request("/microvm-images/img-1/versions/v1", {
        method: "PATCH",
        body: JSON.stringify({ status: "UPDATED" }),
        headers: { "content-type": "application/json" },
      });
      expect(res.status).toBe(200);
    });

    it("DELETE /microvm-images/:imageId/versions/:version deletes a version", async () => {
      mockFetch.mockResolvedValueOnce({ state: "DELETING" });
      const res = await router.request("/microvm-images/img-1/versions/v1", { method: "DELETE" });
      expect(res.status).toBe(200);
    });
  });

  describe("Builds", () => {
    it("GET /microvm-images/:imageId/versions/:version/builds lists builds", async () => {
      mockFetch.mockResolvedValueOnce({ items: [{ buildId: "b1" }], nextToken: null });
      const res = await router.request("/microvm-images/img-1/versions/v1/builds");
      expect(res.status).toBe(200);
    });

    it("GET /microvm-images/:imageId/versions/:version/builds/:buildId gets a build", async () => {
      mockFetch.mockResolvedValueOnce({ buildId: "b1", buildState: "READY" });
      const res = await router.request("/microvm-images/img-1/versions/v1/builds/b1");
      expect(res.status).toBe(200);
    });
  });

  describe("Managed Images", () => {
    it("GET /managed-microvm-images lists managed images", async () => {
      mockFetch.mockResolvedValueOnce({ items: [], nextToken: null });
      const res = await router.request("/managed-microvm-images");
      expect(res.status).toBe(200);
    });

    it("GET /managed-microvm-images/:id/versions lists managed image versions", async () => {
      mockFetch.mockResolvedValueOnce({ items: [], nextToken: null });
      const res = await router.request("/managed-microvm-images/mi-1/versions");
      expect(res.status).toBe(200);
    });
  });

  describe("MicroVMs", () => {
    it("GET /microvms lists microvms", async () => {
      mockFetch.mockResolvedValueOnce({ items: [{ microvmId: "vm-1" }], nextToken: null });
      const res = await router.request("/microvms");
      expect(res.status).toBe(200);
    });

    it("GET /microvms/:id gets a microvm", async () => {
      mockFetch.mockResolvedValueOnce({ microvmId: "vm-1", state: "RUNNING" });
      const res = await router.request("/microvms/vm-1");
      expect(res.status).toBe(200);
    });

    it("POST /microvms runs a microvm", async () => {
      mockFetch.mockResolvedValueOnce({ microvmId: "vm-2", state: "PENDING" });
      const res = await router.request("/microvms", {
        method: "POST",
        body: JSON.stringify({ imageIdentifier: "img-1" }),
        headers: { "content-type": "application/json" },
      });
      expect(res.status).toBe(200);
    });

    it("POST /microvms returns 400 without imageIdentifier", async () => {
      const res = await router.request("/microvms", {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "content-type": "application/json" },
      });
      expect(res.status).toBe(400);
    });

    it("DELETE /microvms/:id terminates a microvm", async () => {
      mockFetch.mockResolvedValueOnce({});
      const res = await router.request("/microvms/vm-1", { method: "DELETE" });
      expect(res.status).toBe(200);
    });
  });
});
