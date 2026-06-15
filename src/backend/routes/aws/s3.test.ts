import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

const mockS3Client = vi.hoisted(() =>
  vi.fn(function () {
    return { send: mockSend };
  })
);

const createCmd = vi.hoisted(() => {
  return function (name: string) {
    return vi.fn(function (this: any, args?: any) {
      return { __cmdName: name, ...args };
    });
  };
});

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: mockS3Client,
  ListBucketsCommand: createCmd("ListBucketsCommand"),
  CreateBucketCommand: createCmd("CreateBucketCommand"),
  DeleteBucketCommand: createCmd("DeleteBucketCommand"),
  ListObjectsV2Command: createCmd("ListObjectsV2Command"),
  GetObjectCommand: createCmd("GetObjectCommand"),
  PutObjectCommand: createCmd("PutObjectCommand"),
  DeleteObjectCommand: createCmd("DeleteObjectCommand"),
}));

vi.mock("../../clients/aws", () => ({
  getAwsConfig: () => ({
    endpoint: "http://localhost:4566",
    region: "us-east-1",
    credentials: { accessKeyId: "test", secretAccessKey: "test" },
  }),
}));

import router from "./s3";

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

async function del(path: string) {
  return router.request(path, { method: "DELETE" });
}

beforeEach(() => {
  mockSend.mockReset();
  mockS3Client.mockClear();
});

describe("S3 Routes", () => {
  describe("Buckets", () => {
    it("GET /buckets — lists buckets", async () => {
      mockSend.mockResolvedValueOnce({
        Buckets: [
          { Name: "my-bucket", CreationDate: new Date("2025-01-01") },
        ],
      });
      const res = await get("/buckets");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.buckets[0].name).toBe("my-bucket");
    });

    it("GET /buckets — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ Buckets: [] });
      const res = await get("/buckets");
      const body = await res.json();
      expect(body.total).toBe(0);
      expect(body.buckets).toEqual([]);
    });

    it("POST /buckets — creates a bucket", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/buckets", { name: "new-bucket" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.created).toBe(true);
      expect(body.name).toBe("new-bucket");
      expect(mockSend.mock.calls[0][0].Bucket).toBe("new-bucket");
    });

    it("POST /buckets — 400 when name missing", async () => {
      const res = await post("/buckets", {});
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("Bucket name is required");
    });

    it("DELETE /buckets/:name — deletes a bucket", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/buckets/my-bucket");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
      expect(body.name).toBe("my-bucket");
      expect(mockSend.mock.calls[0][0].Bucket).toBe("my-bucket");
    });
  });

  describe("Objects", () => {
    it("GET /buckets/:name/objects — lists objects", async () => {
      mockSend.mockResolvedValueOnce({
        Contents: [
          {
            Key: "file.txt",
            Size: 100,
            LastModified: new Date("2025-01-01"),
            ETag: '"abc123"',
          },
        ],
      });
      const res = await get("/buckets/my-bucket/objects");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.objects[0].key).toBe("file.txt");
      expect(body.objects[0].size).toBe(100);
      expect(body.objects[0].etag).toBe("abc123");
    });

    it("GET /buckets/:name/objects — supports prefix filter", async () => {
      mockSend.mockResolvedValueOnce({ Contents: [] });
      const res = await get("/buckets/my-bucket/objects?prefix=logs/");
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].Prefix).toBe("logs/");
    });

    it("GET /buckets/:name/objects — returns empty list", async () => {
      mockSend.mockResolvedValueOnce({ Contents: [] });
      const res = await get("/buckets/my-bucket/objects");
      const body = await res.json();
      expect(body.total).toBe(0);
    });

    it("DELETE /buckets/:name/objects/* — deletes an object", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/buckets/my-bucket/objects/file.txt");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
      expect(mockSend.mock.calls[0][0].Bucket).toBe("my-bucket");
      expect(mockSend.mock.calls[0][0].Key).toBe("file.txt");
    });

    it("DELETE /buckets/:name/objects/* — 400 when key empty", async () => {
      const res = await del("/buckets/my-bucket/objects/");
      expect(res.status).toBe(400);
    });

    it("GET /buckets/:name/objects/* — gets object metadata and text body", async () => {
      const bodyContent = new TextEncoder().encode("Hello, world!");
      mockSend.mockResolvedValueOnce({
        ContentType: "text/plain",
        ContentLength: 13,
        LastModified: new Date("2025-01-01"),
        ETag: '"abc"',
        Body: {
          transformToByteArray: () => Promise.resolve(bodyContent),
          transformToString: () => Promise.resolve("Hello, world!"),
        },
      });
      const res = await get("/buckets/my-bucket/objects/hello.txt");
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.contentType).toBe("text/plain");
      expect(data.body).toBe("Hello, world!");
      expect(data.bodyEncoding).toBe("utf-8");
    });

    it("GET /buckets/:name/objects/* — handles binary content as base64", async () => {
      const bodyContent = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
      mockSend.mockResolvedValueOnce({
        ContentType: "image/png",
        ContentLength: 4,
        LastModified: new Date("2025-01-01"),
        ETag: '"img"',
        Body: {
          transformToByteArray: () => Promise.resolve(bodyContent),
        },
      });
      const res = await get("/buckets/my-bucket/objects/photo.png");
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.contentType).toBe("image/png");
      expect(data.bodyEncoding).toBe("base64");
      expect(data.body).toBeDefined();
    });

    it("GET /buckets/:name/objects/*/raw — streams raw content", async () => {
      const bodyContent = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]);
      mockSend.mockResolvedValueOnce({
        ContentType: "text/plain",
        ContentLength: 5,
        Body: {
          transformToByteArray: () => Promise.resolve(bodyContent),
        },
      });
      const res = await get("/buckets/my-bucket/objects/hello.txt/raw");
      expect(res.status).toBe(200);
      const raw = await res.text();
      expect(raw).toBe("Hello");
    });

    it("GET /buckets/:name/objects/* — 400 when key empty", async () => {
      const res = await get("/buckets/my-bucket/objects/");
      expect(res.status).toBe(400);
    });

    // Edge case: key with empty segments is handled gracefully
    it("GET /buckets/:name/objects/*/raw — handles empty key gracefully", async () => {
      mockSend.mockResolvedValueOnce({
        ContentType: "text/plain",
        ContentLength: 0,
        Body: {
          transformToByteArray: () => Promise.resolve(new Uint8Array()),
        },
      });
      const res = await get("/buckets/my-bucket/objects/empty-key.txt/raw");
      expect(res.status).toBe(200);
    });
  });
});
