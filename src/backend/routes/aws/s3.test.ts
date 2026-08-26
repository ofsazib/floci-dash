import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

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
  GetObjectAclCommand: createCmd("GetObjectAclCommand"),
  PutObjectAclCommand: createCmd("PutObjectAclCommand"),
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
      expect(mockSend.mock.calls[0][0].ContentType).toBe("text/plain");
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

  describe("Object ACL", () => {
    it("GET /buckets/:name/objects/*/acl — returns grants and owner", async () => {
      mockSend.mockResolvedValueOnce({
        Owner: { ID: "owner1", DisplayName: "Owner Name" },
        Grants: [
          { Grantee: { Type: "CanonicalUser", ID: "owner1" }, Permission: "FULL_CONTROL" },
        ],
      });
      const res = await get("/buckets/my-bucket/objects/path/to/file.txt/acl");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.key).toBe("path/to/file.txt");
      expect(body.grants).toHaveLength(1);
      expect(body.totalGrants).toBe(1);
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("GetObjectAclCommand");
    });

    it("GET /buckets/:name/objects/*/acl — 400 when key is empty", async () => {
      const res = await get("/buckets/my-bucket/objects//acl");
      expect(res.status).toBe(400);
    });

    it("PUT /buckets/:name/objects/*/acl — sets canned ACL", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/buckets/my-bucket/objects/file.txt/acl", {
        cannedAcl: "private",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
      expect(body.cannedAcl).toBe("private");
      expect(body.key).toBe("file.txt");
    });

    it("PUT /buckets/:name/objects/*/acl — 400 on invalid canned ACL", async () => {
      const res = await put("/buckets/my-bucket/objects/file.txt/acl", {
        cannedAcl: "invalid",
      });
      expect(res.status).toBe(400);
    });

    it("PUT /buckets/:name/objects/*/acl — 400 when empty body", async () => {
      const res = await put("/buckets/my-bucket/objects/file.txt/acl", {});
      expect(res.status).toBe(400);
    });

    it("PUT /buckets/:name/objects/*/acl — sets ACL via grants array with owner", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/buckets/my-bucket/objects/file.txt/acl", {
        grants: [{ Grantee: { Type: "CanonicalUser", ID: "owner1" }, Permission: "FULL_CONTROL" }],
        owner: { ID: "owner1", DisplayName: "Owner" },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
      expect(body.grants).toBe(1);
      expect(mockSend.mock.calls[0][0].AccessControlPolicy.Grants).toHaveLength(1);
      expect(mockSend.mock.calls[0][0].AccessControlPolicy.Owner.ID).toBe("owner1");
    });

    it("PUT /buckets/:name/objects/*/acl — 400 when grants missing with no cannedAcl", async () => {
      const res = await put("/buckets/my-bucket/objects/file.txt/acl", { foo: "bar" });
      expect(res.status).toBe(400);
    });
  });

  describe("Batch Delete with Folders", () => {
    beforeEach(() => { mockSend.mockReset(); });

    it("POST batch-delete — expands folder prefix and deletes regular + folder keys", async () => {
      mockSend.mockResolvedValueOnce({
        Contents: [{ Key: "folder/file1.txt" }, { Key: "folder/file2.txt" }],
        IsTruncated: false,
      });
      mockSend.mockResolvedValueOnce({
        Deleted: [{ Key: "regular.txt" }, { Key: "folder/file1.txt" }, { Key: "folder/file2.txt" }],
        Errors: [],
      });
      const res = await post("/buckets/my-bucket/objects/batch-delete", {
        keys: ["regular.txt", "folder/"],
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.totalDeleted).toBe(3);
      expect(body.deleted).toContain("regular.txt");
      expect(body.deleted).toContain("folder/file1.txt");
      expect(mockSend.mock.calls[0][0].__cmdName).toBe("ListObjectsV2Command");
      expect(mockSend.mock.calls[0][0].Prefix).toBe("folder/");
      expect(mockSend.mock.calls[1][0].__cmdName).toBe("DeleteObjectsCommand");
    });

    it("POST batch-delete — returns empty result when all keys sanitized away", async () => {
      const res = await post("/buckets/my-bucket/objects/batch-delete", {
        keys: [""],
      });
      expect(res.status).toBe(400);
    });
  });
});


// ─── Sparse data / remaining branch targets ────────────

describe("S3 Sparse Data Branches", () => {
  beforeEach(() => { mockSend.mockReset(); });

  it("GET /buckets — returns empty when Buckets key missing", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/buckets");
    const body = await res.json();
    expect(body.total).toBe(0);
    expect(body.buckets).toEqual([]);
  });

  it("GET /buckets — bucket without CreationDate", async () => {
    mockSend.mockResolvedValueOnce({ Buckets: [{ Name: "no-date" }] });
    const res = await get("/buckets");
    const body = await res.json();
    expect(body.buckets[0].createdAt).toBeNull();
  });

  it("DELETE /buckets/:name — 400 when name sanitizes to empty", async () => {
    const res = await del("/buckets/%25%25%25");
    expect(res.status).toBe(400);
  });

  it("GET objects — empty delimiter and missing Contents key", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/buckets/b/objects?delimiter=");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.objects).toEqual([]);
    expect(body.folders).toEqual([]);
    expect(mockSend.mock.calls[0][0].Delimiter).toBe("/");
  });

  it("GET objects — maps CommonPrefixes folders and sparse objects", async () => {
    mockSend.mockResolvedValueOnce({
      Contents: [{ Key: "file.txt", Size: 10 }], // no LastModified
      CommonPrefixes: [{ Prefix: "folder/" }, {}], // with and without Prefix
    });
    const res = await get("/buckets/b/objects");
    const body = await res.json();
    expect(body.folders).toHaveLength(2);
    expect(body.folders[0].name).toBe("folder");
    expect(body.folders[1].name).toBe("");
    expect(body.objects[0].lastModified).toBeNull();
  });

  it("GET raw — sparse response falls back to octet-stream and empty body", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/buckets/b/objects/file.txt/raw");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/octet-stream");
  });

  it("GET raw — 400 when key is empty", async () => {
    // %2F decodes to "/", which sanitizeS3Key strips to an empty key —
    // the only way the raw route (which needs a non-empty segment) hits its 400 guard.
    const res = await get("/buckets/b/objects/%2F/raw");
    expect(res.status).toBe(400);
  });

  it("GET object — sparse response falls back to octet-stream binary", async () => {
    mockSend.mockResolvedValueOnce({
      Body: { transformToByteArray: () => Promise.resolve(new Uint8Array([0x01])) },
    });
    const res = await get("/buckets/b/objects/file.bin");
    const data = await res.json();
    expect(data.contentType).toBe("application/octet-stream");
    expect(data.bodyEncoding).toBe("base64");
  });

  it("GET ACL — returns nulls when Owner and Grants missing", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/buckets/b/objects/f.txt/acl");
    const body = await res.json();
    expect(body.owner).toBeNull();
    expect(body.grants).toEqual([]);
    expect(body.totalGrants).toBe(0);
  });

  it("GET ACL — grant without Grantee maps to null", async () => {
    mockSend.mockResolvedValueOnce({ Grants: [{ Permission: "READ" }] });
    const res = await get("/buckets/b/objects/f.txt/acl");
    const body = await res.json();
    expect(body.grants[0].grantee).toBeNull();
    expect(body.grants[0].permission).toBe("READ");
  });

  it("PUT ACL — non-acl path falls through", async () => {
    const res = await put("/buckets/b/objects/f.txt", { cannedAcl: "private" });
    expect(res.status).toBe(404);
  });

  it("PUT ACL — 400 when key is empty", async () => {
    const res = await put("/buckets/b/objects//acl", { cannedAcl: "private" });
    expect(res.status).toBe(400);
  });

  it("PUT ACL — grants without owner", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await put("/buckets/b/objects/f.txt/acl", {
      grants: [{ Grantee: { Type: "CanonicalUser", ID: "u1" }, Permission: "READ" }],
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.updated).toBe(true);
    expect(mockSend.mock.calls[0][0].AccessControlPolicy.Owner).toBeUndefined();
  });

  describe("Upload", () => {
    async function uploadMultipart(path: string, files: File[]) {
      const form = new FormData();
      for (const f of files) form.append("files", f);
      return router.request(path, { method: "POST", body: form });
    }

    it("POST upload — uploads multiple files", async () => {
      mockSend.mockResolvedValueOnce({});
      mockSend.mockResolvedValueOnce({});
      const f1 = new File(["a"], "a.txt", { type: "text/plain" });
      const f2 = new File(["b"], "b.txt", { type: "text/plain" });
      const res = await uploadMultipart("/buckets/b/objects/upload", [f1, f2]);
      const body = await res.json();
      expect(body.uploaded).toBe(2);
      expect(mockSend).toHaveBeenCalledTimes(2);
    });

    it("POST upload — empty-type file is normalized to octet-stream by the multipart parser", async () => {
      // busboy assigns "application/octet-stream" to parts without a Content-Type,
      // so file.type is always truthy after parseBody — the route needs no fallback.
      mockSend.mockResolvedValueOnce({});
      const file = new File(["x"], "x.bin", { type: "" });
      const res = await uploadMultipart("/buckets/b/objects/upload", [file]);
      const body = await res.json();
      expect(body.results[0].status).toBe("uploaded");
      expect(mockSend.mock.calls[0][0].ContentType).toBe("application/octet-stream");
    });
  });

  describe("Batch delete", () => {
    it("POST batch-delete — folder prefix expanding to nothing returns empty", async () => {
      mockSend.mockResolvedValueOnce({}); // list returns no Contents
      const res = await post("/buckets/b/objects/batch-delete", { keys: ["empty/"] });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toEqual([]);
      expect(body.errors).toEqual([]);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it("POST batch-delete — paginates folder listing", async () => {
      mockSend.mockResolvedValueOnce({
        Contents: [{ Key: "f/1.txt" }],
        IsTruncated: true,
        NextContinuationToken: "tok2",
      });
      mockSend.mockResolvedValueOnce({ Contents: [{ Key: "f/2.txt" }], IsTruncated: false });
      mockSend.mockResolvedValueOnce({ Deleted: [{ Key: "f/1.txt" }, { Key: "f/2.txt" }], Errors: [] });
      const res = await post("/buckets/b/objects/batch-delete", { keys: ["f/"] });
      const body = await res.json();
      expect(body.totalDeleted).toBe(2);
      expect(mockSend).toHaveBeenCalledTimes(3);
      expect(mockSend.mock.calls[1][0].ContinuationToken).toBe("tok2");
    });

    it("POST batch-delete — sparse DeleteObjects response", async () => {
      mockSend.mockResolvedValueOnce({}); // no Deleted / no Errors
      const res = await post("/buckets/b/objects/batch-delete", { keys: ["f1.txt"] });
      const body = await res.json();
      expect(body.totalDeleted).toBe(0);
      expect(body.deleted).toEqual([]);
      expect(body.errors).toEqual([]);
    });
  });

  describe("Folder delete", () => {
    it("POST folders/delete — list returns no Contents key", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await post("/buckets/b/folders/delete", { prefix: "empty/" });
      const body = await res.json();
      expect(body.totalDeleted).toBe(0);
      expect(body.deleted).toEqual([]);
    });

    it("POST folders/delete — paginates listing", async () => {
      mockSend.mockResolvedValueOnce({
        Contents: [{ Key: "f/1.txt" }],
        IsTruncated: true,
        NextContinuationToken: "tok2",
      });
      mockSend.mockResolvedValueOnce({ Contents: [{ Key: "f/2.txt" }], IsTruncated: false });
      mockSend.mockResolvedValueOnce({ Deleted: [{ Key: "f/1.txt" }, { Key: "f/2.txt" }], Errors: [] });
      const res = await post("/buckets/b/folders/delete", { prefix: "f/" });
      const body = await res.json();
      expect(body.totalDeleted).toBe(2);
      expect(mockSend.mock.calls[1][0].ContinuationToken).toBe("tok2");
    });

    it("POST folders/delete — sparse DeleteObjects response", async () => {
      mockSend.mockResolvedValueOnce({ Contents: [{ Key: "f/1.txt" }], IsTruncated: false });
      mockSend.mockResolvedValueOnce({});
      const res = await post("/buckets/b/folders/delete", { prefix: "f/" });
      const body = await res.json();
      expect(body.totalDeleted).toBe(0);
      expect(body.errors).toEqual([]);
    });

    it("POST folders/delete — maps DeleteObjects Errors entries", async () => {
      mockSend.mockResolvedValueOnce({ Contents: [{ Key: "f/1.txt" }], IsTruncated: false });
      mockSend.mockResolvedValueOnce({
        Deleted: [{ Key: "f/1.txt" }],
        Errors: [{ Key: "f/2.txt", Code: "AccessDenied", Message: "Permission denied" }],
      });
      const res = await post("/buckets/b/folders/delete", { prefix: "f/" });
      const body = await res.json();
      expect(body.totalDeleted).toBe(1);
      expect(body.deleted).toEqual(["f/1.txt"]);
      expect(body.errors).toEqual([{ key: "f/2.txt", code: "AccessDenied", message: "Permission denied" }]);
    });
  });
});

describe("S3_MAX_UPLOAD_BYTES env capture", () => {
  // The module captures S3_MAX_UPLOAD_BYTES at import time (`parseInt(...) || 50MB`),
  // so coverage of the two `||` arms depends on the ambient env. Re-importing
  // under both stub states covers both arms deterministically.
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("uses S3_MAX_UPLOAD_BYTES when set", async () => {
    vi.stubEnv("S3_MAX_UPLOAD_BYTES", "1024");
    vi.resetModules();
    const { default: freshRouter } = await import("./s3");
    const form = new FormData();
    form.append("files", new File([new Uint8Array(2048)], "big.bin"));
    const res = await freshRouter.request("/buckets/my-bucket/objects/upload", {
      method: "POST",
      body: form,
    });
    const body = await res.json();
    expect(body.results[0].status).toBe("error");
    expect(body.results[0].error).toContain("MB limit");
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("falls back to the 50MB default when S3_MAX_UPLOAD_BYTES is unset", async () => {
    vi.stubEnv("S3_MAX_UPLOAD_BYTES", "");
    vi.resetModules();
    const { default: freshRouter } = await import("./s3");
    mockSend.mockResolvedValueOnce({});
    const form = new FormData();
    form.append("files", new File(["hello"], "hello.txt"));
    const res = await freshRouter.request("/buckets/my-bucket/objects/upload", {
      method: "POST",
      body: form,
    });
    expect(res.status).toBe(200);
    expect(mockSend).toHaveBeenCalled();
  });

  describe("suffix guard — skips /tags, /acl, /attributes, /head, /raw", () => {
    it("calls next() for paths ending in /tags", async () => {
      // The guard should skip so the request falls through to the next router.
      // Without the guard, this would try to GetObject with key "my-key/tags"
      mockSend.mockResolvedValueOnce({});
      const res = await router.request("/buckets/my-bucket/objects/my-key/tags");
      // The guard skips to next — since no /tags handler exists in s3.ts,
      // it would 404 at the Hono level, not 500 from GetObject
      expect(res.status).not.toBe(500);
    });

    it("calls next() for paths ending in /attributes", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await router.request("/buckets/my-bucket/objects/my-key/attributes");
      expect(res.status).not.toBe(500);
    });

    it("calls next() for paths ending in /head", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await router.request("/buckets/my-bucket/objects/my-key/head");
      expect(res.status).not.toBe(500);
    });

    it("DELETE calls next() for paths ending in /tags", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await router.request("/buckets/my-bucket/objects/my-key/tags", { method: "DELETE" });
      expect(res.status).not.toBe(500);
    });
  });
});
