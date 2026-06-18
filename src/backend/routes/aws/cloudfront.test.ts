import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) {
      return { __cmdName: name, ...args };
    });
  };
});

vi.mock("@aws-sdk/client-cloudfront", () => ({
  CloudFrontClient: vi.fn(function () {
    return { send: mockSend };
  }),
  ListDistributionsCommand: createCmd("ListDistributionsCommand"),
  GetDistributionCommand: createCmd("GetDistributionCommand"),
  CreateDistributionCommand: createCmd("CreateDistributionCommand"),
  UpdateDistributionCommand: createCmd("UpdateDistributionCommand"),
  DeleteDistributionCommand: createCmd("DeleteDistributionCommand"),
  ListInvalidationsCommand: createCmd("ListInvalidationsCommand"),
  CreateInvalidationCommand: createCmd("CreateInvalidationCommand"),
  GetInvalidationCommand: createCmd("GetInvalidationCommand"),
  ListCachePoliciesCommand: createCmd("ListCachePoliciesCommand"),
  ListOriginAccessControlsCommand: createCmd("ListOriginAccessControlsCommand"),
  ListFunctionsCommand: createCmd("ListFunctionsCommand"),
  ListTagsForResourceCommand: createCmd("ListTagsForResourceCommand"),
}));

vi.mock("../../clients/aws", () => ({
  create: (Ctor: any, extra?: any) => new Ctor(extra),
}));

import router from "./cloudfront";

async function get(path: string) {
  return router.request(path, { method: "GET" });
}

async function post(path: string, body?: any) {
  return router.request(path, {
    method: "POST",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { "content-type": "application/json" } : undefined,
  });
}

async function put(path: string, body?: any, headers?: Record<string, string>) {
  return router.request(path, {
    method: "PUT",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: { "content-type": "application/json", ...headers },
  });
}

async function del(path: string, headers?: Record<string, string>) {
  return router.request(path, { method: "DELETE", headers });
}

beforeEach(() => {
  mockSend.mockReset();
});

describe("CloudFront Routes", () => {
  describe("Distributions", () => {
    it("GET /distributions — lists distributions", async () => {
      mockSend.mockResolvedValueOnce({
        DistributionList: {
          Items: [
            { Id: "E1234567", ARN: "arn:aws:cloudfront::123:distribution/E1234567", Status: "Deployed", DomainName: "d123.cloudfront.net", Enabled: true },
          ],
        },
      });
      const res = await get("/distributions");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.distributions[0].Id).toBe("E1234567");
    });

    it("GET /distributions — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ DistributionList: {} });
      const res = await get("/distributions");
      const body = await res.json();
      expect(body.total).toBe(0);
    });

    it("GET /distributions/:id — gets distribution detail", async () => {
      mockSend.mockResolvedValueOnce({
        Distribution: { Id: "E123", Status: "Deployed" },
        ETag: "E123ABC",
      });
      const res = await get("/distributions/E123");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.distribution.Id).toBe("E123");
      expect(body.eTag).toBe("E123ABC");
    });

    it("POST /distributions — creates distribution (201)", async () => {
      mockSend.mockResolvedValueOnce({
        Distribution: { Id: "E999" },
        Location: "https://cloudfront.amazonaws.com/distribution/E999",
      });
      const res = await post("/distributions", {
        distributionConfig: { enabled: true },
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.distribution.Id).toBe("E999");
      expect(body.location).toContain("E999");
    });

    it("POST /distributions — 400 if config missing", async () => {
      const res = await post("/distributions", {});
      expect(res.status).toBe(400);
    });

    it("PUT /distributions/:id — updates distribution", async () => {
      mockSend.mockResolvedValueOnce({
        Distribution: { Id: "E123" },
        ETag: "NEWETAG",
      });
      const res = await put("/distributions/E123", {
        distributionConfig: { enabled: false },
      }, { "If-Match": "OLDETAG" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.eTag).toBe("NEWETAG");
    });

    it("DELETE /distributions/:id — deletes with If-Match", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/distributions/E123", { "If-Match": "ETAG123" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });

    it("DELETE /distributions/:id — 400 if If-Match missing", async () => {
      const res = await del("/distributions/E123");
      expect(res.status).toBe(400);
    });
  });

  describe("Invalidations", () => {
    it("GET /distributions/:id/invalidations — lists invalidations", async () => {
      mockSend.mockResolvedValueOnce({
        InvalidationList: {
          Items: [{ Id: "I123", Status: "Completed" }],
        },
      });
      const res = await get("/distributions/E123/invalidations");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
    });

    it("GET /distributions/:id/invalidations — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ InvalidationList: {} });
      const res = await get("/distributions/E123/invalidations");
      const body = await res.json();
      expect(body.total).toBe(0);
    });

    it("POST /distributions/:id/invalidations — creates invalidation (201)", async () => {
      mockSend.mockResolvedValueOnce({
        Invalidation: { Id: "I999", Status: "InProgress" },
      });
      const res = await post("/distributions/E123/invalidations", {
        paths: ["/api/*", "/images/*"],
      });
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.invalidation.Id).toBe("I999");
    });

    it("POST /distributions/:id/invalidations — 400 if paths missing", async () => {
      const res = await post("/distributions/E123/invalidations", {});
      expect(res.status).toBe(400);
    });

    it("GET /distributions/:id/invalidations/:invId — gets invalidation", async () => {
      mockSend.mockResolvedValueOnce({
        Invalidation: { Id: "I123", Status: "Completed" },
      });
      const res = await get("/distributions/E123/invalidations/I123");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.invalidation.Id).toBe("I123");
    });
  });

  describe("Cache Policies", () => {
    it("GET /cache-policies — lists cache policies", async () => {
      mockSend.mockResolvedValueOnce({
        CachePolicyList: {
          Items: [{ Type: "managed", CachePolicy: { Id: "658327ea-f89d-4fab-a63d-7e88639e58f6", CachePolicyConfig: { Name: "Managed-CachingOptimized" } } }],
        },
      });
      const res = await get("/cache-policies");
      const body = await res.json();
      expect(body.total).toBe(1);
    });

    it("GET /cache-policies — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ CachePolicyList: {} });
      const res = await get("/cache-policies");
      const body = await res.json();
      expect(body.total).toBe(0);
    });
  });

  describe("Origin Access Controls", () => {
    it("GET /origin-access-controls — lists OACs", async () => {
      mockSend.mockResolvedValueOnce({
        OriginAccessControlList: {
          Items: [{ Id: "E123OAC" }],
        },
      });
      const res = await get("/origin-access-controls");
      const body = await res.json();
      expect(body.total).toBe(1);
    });
  });

  describe("Functions", () => {
    it("GET /functions — lists functions", async () => {
      mockSend.mockResolvedValueOnce({
        FunctionList: {
          Items: [{ Name: "my-func", FunctionARN: "arn:aws:cloudfront::123:function/my-func" }],
        },
      });
      const res = await get("/functions");
      const body = await res.json();
      expect(body.total).toBe(1);
    });
  });

  describe("Tags", () => {
    it("GET /tags — lists tags for resource", async () => {
      mockSend.mockResolvedValueOnce({
        Tags: { Items: [{ Key: "env", Value: "prod" }] },
      });
      const res = await get("/tags?resource=arn:aws:cloudfront::123:distribution/E123");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.tags.length).toBe(1);
    });

    it("GET /tags — 400 if resource missing", async () => {
      const res = await get("/tags");
      expect(res.status).toBe(400);
    });
  });
});
