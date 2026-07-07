import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn(function() { return { send: mockSend }; }),
  GetObjectTaggingCommand: vi.fn(function(args) { return args; }),
  PutObjectTaggingCommand: vi.fn(function(args) { return args; }),
  DeleteObjectTaggingCommand: vi.fn(function(args) { return args; }),
  GetObjectAttributesCommand: vi.fn(function(args) { return args; }),
  HeadBucketCommand: vi.fn(function(args) { return args; }),
  HeadObjectCommand: vi.fn(function(args) { return args; }),
  ObjectAttributes: { CHECKSUM: "Checksum", ETAG: "ETag", OBJECT_PARTS: "ObjectParts", STORAGE_CLASS: "StorageClass", OBJECT_SIZE: "ObjectSize" },
}));

import router from "./s3-objects";

const notFound = vi.hoisted(() => {
  const err = new Error("Not found");
  err.name = "NotFound";
  (err as any).$metadata = { httpStatusCode: 404 };
  return err;
});

const accessDenied = vi.hoisted(() => {
  const err = new Error("Forbidden");
  err.name = "AccessDenied";
  (err as any).$metadata = { httpStatusCode: 403 };
  return err;
});

beforeEach(() => {
  mockSend.mockReset();
  mockSend.mockResolvedValue({});
});

async function get(path: string) {
  return router.request(path, { method: "GET" });
}

async function put(path: string, body?: any) {
  return router.request(path, {
    method: "PUT",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { "content-type": "application/json" } : undefined,
  });
}

async function del(path: string) {
  return router.request(path, { method: "DELETE" });
}

async function head(path: string) {
  return router.request(path, { method: "GET" });
}


describe("S3 Objects", () => {
  describe("Object Tags", () => {
    it("GET /buckets/:name/objects/*/tags — lists tags", async () => {
      mockSend.mockResolvedValueOnce({
        TagSet: [{ Key: "env", Value: "prod" }, { Key: "owner", Value: "team" }],
      });
      const res = await get("/buckets/my-bucket/objects/mykey/tags");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(2);
      expect(body.tags[0].Key).toBe("env");
      expect(body.bucket).toBe("my-bucket");
      expect(body.key).toBe("mykey");
    });

    it("GET /buckets/:name/objects/*/tags — handles empty tags", async () => {
      mockSend.mockResolvedValueOnce({ TagSet: [] });
      const res = await get("/buckets/my-bucket/objects/mykey/tags");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(0);
      expect(body.tags).toEqual([]);
    });

    it("PUT /buckets/:name/objects/*/tags — sets tags", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/buckets/my-bucket/objects/mykey/tags", {
        tags: [{ Key: "env", Value: "staging" }],
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
      expect(mockSend.mock.calls[0][0].Bucket).toBe("my-bucket");
      expect(mockSend.mock.calls[0][0].Key).toBe("mykey");
      expect(mockSend.mock.calls[0][0].Tagging.TagSet[0].Key).toBe("env");
    });

    it("PUT /buckets/:name/objects/*/tags — 400 when tags missing", async () => {
      const res = await put("/buckets/my-bucket/objects/mykey/tags", {});
      expect(res.status).toBe(400);
    });

    it("PUT /buckets/:name/objects/*/tags — 400 when tags not an array", async () => {
      const res = await put("/buckets/my-bucket/objects/mykey/tags", {
        tags: "not-an-array",
      });
      expect(res.status).toBe(400);
    });

    it("DELETE /buckets/:name/objects/*/tags — deletes tags", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/buckets/my-bucket/objects/mykey/tags");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });

  });

  describe("Object Attributes", () => {
    it("GET /buckets/:name/objects/*/attributes — returns attributes", async () => {
      mockSend.mockResolvedValueOnce({
        ETag: '"abc123"',
        ObjectSize: 1024,
        StorageClass: "STANDARD",
      });
      const res = await get("/buckets/my-bucket/objects/mykey/attributes");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.etag).toBe('"abc123"');
      expect(body.objectSize).toBe(1024);
      expect(body.key).toBe("mykey");
    });

    it("GET /buckets/:name/objects/*/attributes — handles encoded key", async () => {
      mockSend.mockResolvedValueOnce({ ETag: '"def456"', ObjectSize: 2048 });
      const res = await get("/buckets/my-bucket/objects/nested%2Fkey/attributes");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.etag).toBe('"def456"');
      expect(body.key).toBe("nested/key");
    });
  });

  describe("Head Operations", () => {
    it("HEAD /buckets/:name — returns 200 when bucket exists", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await head("/buckets/my-bucket/head");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.exists).toBe(true);
    });

    it("HEAD /buckets/:name — returns 404 error when not found", async () => {
      mockSend.mockRejectedValueOnce(notFound);
      const res = await head("/buckets/my-bucket/head");
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.exists).toBe(false);
    });

    it("HEAD /buckets/:name — returns 403 when access denied", async () => {
      mockSend.mockRejectedValueOnce(accessDenied);
      const res = await head("/buckets/my-bucket/head");
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.accessDenied).toBe(true);
    });

    it("HEAD /buckets/:name/objects/* — returns metadata when object exists", async () => {
      mockSend.mockResolvedValueOnce({
        ContentLength: 512,
        ContentType: "text/plain",
        LastModified: new Date("2025-01-01T00:00:00Z"),
        ETag: '"xyz789"',
        Metadata: { key: "value" },
      });
      const res = await head("/buckets/my-bucket/objects/mykey/head");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.contentType).toBe("text/plain");
      expect(body.contentLength).toBe(512);
      expect(body.etag).toBe("xyz789");
      expect(body.metadata).toEqual({ key: "value" });
    });

    it("HEAD /buckets/:name/objects/* — returns 404 when object not found", async () => {
      mockSend.mockRejectedValueOnce(notFound);
      const res = await head("/buckets/my-bucket/objects/mykey/head");
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.exists).toBe(false);
    });

  });
});
