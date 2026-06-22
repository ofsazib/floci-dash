import { describe, it, expect, beforeEach, vi } from "vitest";

const mockFlociFetch = vi.hoisted(() => vi.fn());

vi.mock("../../clients/floci", () => ({
  flociFetch: mockFlociFetch,
}));

import router from "./s3vectors";

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

async function del(path: string, body?: any) {
  return router.request(path, {
    method: "DELETE",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { "content-type": "application/json" } : undefined,
  });
}

async function put(path: string, body?: any) {
  return router.request(path, {
    method: "PUT",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { "content-type": "application/json" } : undefined,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockFlociFetch.mockReset();
});

describe("S3 Vector Search - buckets", () => {
  it("GET /buckets - lists vector buckets", async () => {
    mockFlociFetch.mockResolvedValueOnce({
      vectorBuckets: [{ vectorBucketName: "bucket1" }, { vectorBucketName: "bucket2" }],
    });
    const res = await get("/buckets");
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.buckets).toHaveLength(2);
    expect(body.total).toBe(2);
  });

  it("GET /buckets - empty list", async () => {
    mockFlociFetch.mockResolvedValueOnce({});
    const res = await get("/buckets");
    const body = await res.json();
    expect(body.buckets).toEqual([]);
    expect(body.total).toBe(0);
  });

  it("GET /buckets/:name - gets single bucket", async () => {
    mockFlociFetch.mockResolvedValueOnce({
      vectorBucket: { vectorBucketName: "bucket1", vectorBucketArn: "arn:aws:s3vectors:bucket1" },
    });
    const res = await get("/buckets/bucket1");
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.bucket.vectorBucketName).toBe("bucket1");
  });

  it("GET /buckets/:name - bucket not found", async () => {
    mockFlociFetch.mockResolvedValueOnce({});
    const res = await get("/buckets/nonexistent");
    const body = await res.json();
    expect(body.bucket).toBeNull();
  });

  it("POST /buckets - creates a bucket", async () => {
    mockFlociFetch.mockResolvedValueOnce({ vectorBucketArn: "arn:aws:s3vectors:bucket-new" });
    const res = await post("/buckets", { vectorBucketName: "bucket-new" });
    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.bucket.vectorBucketArn).toBeTruthy();
  });

  it("POST /buckets - rejects missing name", async () => {
    const res = await post("/buckets", {});
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toBe("vectorBucketName is required");
  });

  it("DELETE /buckets/:name - deletes a bucket", async () => {
    mockFlociFetch.mockResolvedValueOnce({});
    const res = await del("/buckets/bucket1");
    const body = await res.json();
    expect(body.deleted).toBe(true);
  });
});

describe("S3 Vector Search - indexes", () => {
  it("GET /buckets/:name/indexes - lists indexes", async () => {
    mockFlociFetch.mockResolvedValueOnce({
      indexes: [{ indexName: "idx1", dimension: 128 }],
    });
    const res = await get("/buckets/b1/indexes");
    const body = await res.json();
    expect(body.indexes).toHaveLength(1);
    expect(body.total).toBe(1);
  });

  it("GET /buckets/:name/indexes/:indexName - gets single index", async () => {
    mockFlociFetch.mockResolvedValueOnce({
      index: { indexName: "idx1", dimension: 128 },
    });
    const res = await get("/buckets/b1/indexes/idx1");
    const body = await res.json();
    expect(body.index.indexName).toBe("idx1");
  });

  it("POST /buckets/:name/indexes - creates an index", async () => {
    mockFlociFetch.mockResolvedValueOnce({ indexArn: "arn:aws:s3vectors:b1/idx1" });
    const res = await post("/buckets/b1/indexes", { indexName: "idx1", dimension: 128 });
    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.index.indexArn).toBeTruthy();
  });

  it("POST /buckets/:name/indexes - rejects missing fields", async () => {
    const res = await post("/buckets/b1/indexes", {});
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toContain("indexName");
  });

  it("DELETE /buckets/:name/indexes/:indexName - deletes an index", async () => {
    mockFlociFetch.mockResolvedValueOnce({});
    const res = await del("/buckets/b1/indexes/idx1");
    const body = await res.json();
    expect(body.deleted).toBe(true);
  });
});

describe("S3 Vector Search - vectors", () => {
  it("PUT /buckets/:name/indexes/:indexName/vectors - stores vectors", async () => {
    mockFlociFetch.mockResolvedValueOnce({});
    const vectors = [{ key: "v1", data: { float32: [0.1, 0.2] } }];
    const res = await put("/buckets/b1/indexes/idx1/vectors", { vectors });
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("PUT /buckets/:name/indexes/:indexName/vectors - rejects missing vectors", async () => {
    const res = await put("/buckets/b1/indexes/idx1/vectors", {});
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toContain("vectors");
  });

  it("GET /buckets/:name/indexes/:indexName/vectors - gets vectors by keys", async () => {
    mockFlociFetch.mockResolvedValueOnce({
      vectors: [{ key: "v1", data: { float32: [0.1] } }],
    });
    const res = await get("/buckets/b1/indexes/idx1/vectors?keys=v1&returnData=true&returnMetadata=true");
    const body = await res.json();
    expect(body.vectors).toHaveLength(1);
    expect(body.total).toBe(1);
  });

  it("GET /buckets/:name/indexes/:indexName/vectors - empty keys returns empty", async () => {
    const res = await get("/buckets/b1/indexes/idx1/vectors");
    const body = await res.json();
    expect(body.vectors).toEqual([]);
    expect(body.total).toBe(0);
  });

  it("DELETE /buckets/:name/indexes/:indexName/vectors - deletes vectors", async () => {
    mockFlociFetch.mockResolvedValueOnce({});
    const res = await del("/buckets/b1/indexes/idx1/vectors", { keys: ["v1", "v2"] });
    const body = await res.json();
    expect(body.deleted).toBe(true);
  });

  it("DELETE /buckets/:name/indexes/:indexName/vectors - rejects missing keys", async () => {
    const res = await del("/buckets/b1/indexes/idx1/vectors", {});
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toContain("keys");
  });
});

describe("S3 Vector Search - query", () => {
  it("POST /buckets/:name/indexes/:indexName/query - queries vectors", async () => {
    mockFlociFetch.mockResolvedValueOnce({
      vectors: [{ key: "v1", distance: 0.05 }],
      distanceMetric: "cosine",
    });
    const res = await post("/buckets/b1/indexes/idx1/query", {
      queryVector: [0.1, 0.2, 0.3],
      topK: 10,
    });
    const body = await res.json();
    expect(body.vectors).toHaveLength(1);
    expect(body.distanceMetric).toBe("cosine");
  });

  it("POST /buckets/:name/indexes/:indexName/query - rejects missing fields", async () => {
    const res = await post("/buckets/b1/indexes/idx1/query", { queryVector: [0.1] });
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toContain("topK");
  });

  it("POST /buckets/:name/indexes/:indexName/query - rejects missing queryVector", async () => {
    const res = await post("/buckets/b1/indexes/idx1/query", { topK: 10 });
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error).toContain("queryVector");
  });
});
