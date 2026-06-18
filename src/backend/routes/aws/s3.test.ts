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
  DeleteObjectsCommand: createCmd("DeleteObjectsCommand"),
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

async function put(path: string, body?: any) {
  return router.request(path, {
    method: "PUT",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { "content-type": "application/json" } : undefined,
  });
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

    it("GET /buckets/:name/objects/* — falls back to base64 when text decode fails", async () => {
      const bodyContent = new Uint8Array([0xff, 0xfe]);
      mockSend.mockResolvedValueOnce({
        ContentType: "text/plain",
        ContentLength: 2,
        Body: {
          transformToByteArray: () => Promise.resolve(bodyContent),
          transformToString: () => Promise.reject(new Error("bad decode")),
        },
      });
      const res = await get("/buckets/my-bucket/objects/broken.txt");
      const data = await res.json();
      expect(data.bodyEncoding).toBe("base64");
    });

    it("GET /buckets/:name/objects/* — returns empty body when no Body", async () => {
      mockSend.mockResolvedValueOnce({
        ContentType: "text/plain",
        ContentLength: 0,
      });
      const res = await get("/buckets/my-bucket/objects/empty");
      const data = await res.json();
      expect(data.body).toBe("");
      expect(data.bodyEncoding).toBe("utf-8");
    });
  });

  describe("Upload", () => {
    async function uploadMultipart(path: string, files: File[]) {
      const form = new FormData();
      for (const f of files) form.append("files", f);
      return router.request(path, { method: "POST", body: form });
    }

    it("POST upload — uploads a single file", async () => {
      mockSend.mockResolvedValueOnce({});
      const file = new File(["hello"], "hello.txt", { type: "text/plain" });
      const res = await uploadMultipart("/buckets/my-bucket/objects/upload", [file]);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.uploaded).toBe(1);
      expect(body.failed).toBe(0);
      expect(body.results[0].status).toBe("uploaded");
      expect(body.results[0].key).toBe("hello.txt");
      expect(mockSend.mock.calls[0][0].Bucket).toBe("my-bucket");
      expect(mockSend.mock.calls[0][0].Key).toBe("hello.txt");
    });

    it("POST upload — applies prefix query param", async () => {
      mockSend.mockResolvedValueOnce({});
      const file = new File(["x"], "x.txt");
      await uploadMultipart("/buckets/my-bucket/objects/upload?prefix=logs/", [file]);
      expect(mockSend.mock.calls[0][0].Key).toBe("logs/x.txt");
    });

    it("POST upload — 400 when no files provided", async () => {
      const form = new FormData();
      const res = await router.request("/buckets/my-bucket/objects/upload", {
        method: "POST",
        body: form,
      });
      expect(res.status).toBe(400);
    });

    it("POST upload — returns error result for oversized file", async () => {
      const huge = new File([new Uint8Array(51 * 1024 * 1024)], "big.bin");
      const res = await uploadMultipart("/buckets/my-bucket/objects/upload", [huge]);
      const body = await res.json();
      expect(body.failed).toBe(1);
      expect(body.results[0].status).toBe("error");
      expect(body.results[0].error).toContain("MB limit");
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("POST upload — returns error result when PutObject throws", async () => {
      mockSend.mockRejectedValueOnce(new Error("AccessDenied"));
      const file = new File(["x"], "x.txt");
      const res = await uploadMultipart("/buckets/my-bucket/objects/upload", [file]);
      const body = await res.json();
      expect(body.uploaded).toBe(0);
      expect(body.failed).toBe(1);
      expect(body.results[0].status).toBe("error");
      expect(body.results[0].error).toBe("AccessDenied");
    });
  });

  describe("Folders", () => {
    it("PUT /buckets/:name/folders — creates folder marker", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/buckets/my-bucket/folders", { prefix: "logs/2024/" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.created).toBe(true);
      expect(body.prefix).toBe("logs/2024/");
      expect(mockSend.mock.calls[0][0].Bucket).toBe("my-bucket");
      expect(mockSend.mock.calls[0][0].Key).toBe("logs/2024/");
      expect(mockSend.mock.calls[0][0].Body).toBe("");
    });

    it("PUT /buckets/:name/folders — 400 when prefix missing", async () => {
      const res = await put("/buckets/my-bucket/folders", {});
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("prefix");
    });

    it("PUT /buckets/:name/folders — propagates SDK error", async () => {
      mockSend.mockRejectedValueOnce(new Error("AccessDenied"));
      const res = await put("/buckets/my-bucket/folders", { prefix: "noaccess/" });
      expect(res.status).toBe(500);
    });
  });

  describe("Batch Delete", () => {
    beforeEach(() => { mockSend.mockReset(); });

    it("POST /buckets/:name/objects/batch-delete — deletes multiple objects", async () => {
      mockSend.mockResolvedValueOnce({
        Deleted: [{ Key: "file1.txt" }, { Key: "file2.txt" }],
        Errors: [],
      });
      const res = await post("/buckets/my-bucket/objects/batch-delete", { keys: ["file1.txt", "file2.txt"] });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toEqual(["file1.txt", "file2.txt"]);
      expect(body.errors).toEqual([]);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("DeleteObjectsCommand");
      expect(mockSend.mock.calls[0][0].Bucket).toBe("my-bucket");
      expect(mockSend.mock.calls[0][0].Delete.Objects).toEqual([{ Key: "file1.txt" }, { Key: "file2.txt" }]);
    });

    it("POST /buckets/:name/objects/batch-delete — 400 when keys missing", async () => {
      const res = await post("/buckets/my-bucket/objects/batch-delete", {});
      expect(res.status).toBe(400);
    });

    it("POST /buckets/:name/objects/batch-delete — 400 when keys is empty", async () => {
      const res = await post("/buckets/my-bucket/objects/batch-delete", { keys: [] });
      expect(res.status).toBe(400);
    });

    it("POST /buckets/:name/objects/batch-delete — reports partial errors", async () => {
      mockSend.mockResolvedValueOnce({
        Deleted: [{ Key: "file1.txt" }],
        Errors: [{ Key: "file2.txt", Code: "AccessDenied", Message: "Permission denied" }],
      });
      const res = await post("/buckets/my-bucket/objects/batch-delete", { keys: ["file1.txt", "file2.txt"] });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toEqual(["file1.txt"]);
      expect(body.errors).toHaveLength(1);
      expect(body.errors[0].key).toBe("file2.txt");
      expect(body.errors[0].code).toBe("AccessDenied");
    });
  });

  describe("Folder Delete", () => {
    beforeEach(() => { mockSend.mockReset(); });

    it("POST /buckets/:name/folders/delete — recursively deletes folder", async () => {
      mockSend.mockResolvedValueOnce({
        Contents: [{ Key: "myfolder/file1.txt" }, { Key: "myfolder/file2.txt" }, { Key: "myfolder/" }],
        IsTruncated: false,
      });
      mockSend.mockResolvedValueOnce({
        Deleted: [{ Key: "myfolder/file1.txt" }, { Key: "myfolder/file2.txt" }, { Key: "myfolder/" }],
        Errors: [],
      });
      const res = await post("/buckets/my-bucket/folders/delete", { prefix: "myfolder/" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.totalDeleted).toBe(3);
      expect(body.deleted).toHaveLength(3);
      expect(body.errors).toEqual([]);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("ListObjectsV2Command");
      expect(mockSend.mock.calls[1][0].__cmdName).toBe("DeleteObjectsCommand");
    });

    it("POST /buckets/:name/folders/delete — 400 when prefix missing", async () => {
      const res = await post("/buckets/my-bucket/folders/delete", {});
      expect(res.status).toBe(400);
    });

    it("POST /buckets/:name/folders/delete — empty result when folder has no objects", async () => {
      mockSend.mockResolvedValueOnce({ Contents: [], IsTruncated: false });
      const res = await post("/buckets/my-bucket/folders/delete", { prefix: "empty/" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.totalDeleted).toBe(0);
      expect(body.deleted).toEqual([]);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });
});
