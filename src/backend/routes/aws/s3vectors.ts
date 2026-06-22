import { Hono } from "hono";
import type { Context } from "hono";
import { flociFetch } from "../../clients/floci";

const router = new Hono();

// ── Vector Buckets ──────────────────────────────────────

router.get("/buckets", async (c: Context) => {
  const maxResults = c.req.query("maxResults") ? parseInt(c.req.query("maxResults")!) : undefined;
  const nextToken = c.req.query("nextToken");
  const prefix = c.req.query("prefix");
  const data = await flociFetch("/ListVectorBuckets", {
    method: "POST",
    body: JSON.stringify({ maxResults, nextToken, prefix }),
  });
  return c.json({
    buckets: data.vectorBuckets || [],
    total: (data.vectorBuckets || []).length,
    nextToken: data.nextToken,
  });
});

router.get("/buckets/:name", async (c: Context) => {
  const vectorBucketName = c.req.param("name");
  const data = await flociFetch("/GetVectorBucket", {
    method: "POST",
    body: JSON.stringify({ vectorBucketName }),
  });
  return c.json({ bucket: data.vectorBucket || null });
});

router.post("/buckets", async (c: Context) => {
  const body = await c.req.json();
  if (!body.vectorBucketName) return c.json({ error: "vectorBucketName is required" }, 400);
  const data = await flociFetch("/CreateVectorBucket", {
    method: "POST",
    body: JSON.stringify({
      vectorBucketName: body.vectorBucketName,
      encryptionConfiguration: body.encryptionConfiguration,
    }),
  });
  return c.json({ bucket: { vectorBucketArn: data.vectorBucketArn } }, 201);
});

router.delete("/buckets/:name", async (c: Context) => {
  const vectorBucketName = c.req.param("name");
  await flociFetch("/DeleteVectorBucket", {
    method: "POST",
    body: JSON.stringify({ vectorBucketName }),
  });
  return c.json({ deleted: true });
});

// ── Indexes ─────────────────────────────────────────────

router.get("/buckets/:name/indexes", async (c: Context) => {
  const vectorBucketName = c.req.param("name");
  const maxResults = c.req.query("maxResults") ? parseInt(c.req.query("maxResults")!) : undefined;
  const nextToken = c.req.query("nextToken");
  const prefix = c.req.query("prefix");
  const data = await flociFetch("/ListIndexes", {
    method: "POST",
    body: JSON.stringify({ vectorBucketName, maxResults, nextToken, prefix }),
  });
  return c.json({
    indexes: data.indexes || [],
    total: (data.indexes || []).length,
    nextToken: data.nextToken,
  });
});

router.get("/buckets/:name/indexes/:indexName", async (c: Context) => {
  const vectorBucketName = c.req.param("name");
  const indexName = c.req.param("indexName");
  const data = await flociFetch("/GetIndex", {
    method: "POST",
    body: JSON.stringify({ vectorBucketName, indexName }),
  });
  return c.json({ index: data.index || null });
});

router.post("/buckets/:name/indexes", async (c: Context) => {
  const vectorBucketName = c.req.param("name");
  const body = await c.req.json();
  if (!body.indexName || !body.dimension)
    return c.json({ error: "indexName and dimension are required" }, 400);
  const data = await flociFetch("/CreateIndex", {
    method: "POST",
    body: JSON.stringify({
      vectorBucketName,
      indexName: body.indexName,
      dimension: body.dimension,
      dataType: body.dataType || "float32",
      distanceMetric: body.distanceMetric || "cosine",
      metadataConfiguration: body.metadataConfiguration,
      encryptionConfiguration: body.encryptionConfiguration,
    }),
  });
  return c.json({ index: { indexArn: data.indexArn } }, 201);
});

router.delete("/buckets/:name/indexes/:indexName", async (c: Context) => {
  const vectorBucketName = c.req.param("name");
  const indexName = c.req.param("indexName");
  await flociFetch("/DeleteIndex", {
    method: "POST",
    body: JSON.stringify({ vectorBucketName, indexName }),
  });
  return c.json({ deleted: true });
});

// ── Vector Data ─────────────────────────────────────────

router.put("/buckets/:name/indexes/:indexName/vectors", async (c: Context) => {
  const vectorBucketName = c.req.param("name");
  const indexName = c.req.param("indexName");
  const body = await c.req.json();
  if (!body.vectors) return c.json({ error: "vectors array is required" }, 400);
  await flociFetch("/PutVectors", {
    method: "POST",
    body: JSON.stringify({ vectorBucketName, indexName, vectors: body.vectors }),
  });
  return c.json({ success: true });
});

router.get("/buckets/:name/indexes/:indexName/vectors", async (c: Context) => {
  const vectorBucketName = c.req.param("name");
  const indexName = c.req.param("indexName");
  const keys = c.req.query("keys")?.split(",") || [];
  const returnData = c.req.query("returnData") === "true";
  const returnMetadata = c.req.query("returnMetadata") === "true";
  if (!keys.length) return c.json({ vectors: [], total: 0 });
  const data = await flociFetch("/GetVectors", {
    method: "POST",
    body: JSON.stringify({ vectorBucketName, indexName, keys, returnData, returnMetadata }),
  });
  return c.json({ vectors: data.vectors || [], total: (data.vectors || []).length });
});

router.delete("/buckets/:name/indexes/:indexName/vectors", async (c: Context) => {
  const vectorBucketName = c.req.param("name");
  const indexName = c.req.param("indexName");
  const body = await c.req.json();
  if (!body.keys) return c.json({ error: "keys array is required" }, 400);
  await flociFetch("/DeleteVectors", {
    method: "POST",
    body: JSON.stringify({ vectorBucketName, indexName, keys: body.keys }),
  });
  return c.json({ deleted: true });
});

// ── Query ───────────────────────────────────────────────

router.post("/buckets/:name/indexes/:indexName/query", async (c: Context) => {
  const vectorBucketName = c.req.param("name");
  const indexName = c.req.param("indexName");
  const body = await c.req.json();
  if (!body.queryVector || !body.topK)
    return c.json({ error: "queryVector and topK are required" }, 400);
  const data = await flociFetch("/QueryVectors", {
    method: "POST",
    body: JSON.stringify({
      vectorBucketName,
      indexName,
      topK: body.topK,
      queryVector: { float32: body.queryVector },
      filter: body.filter,
      returnMetadata: body.returnMetadata,
      returnDistance: body.returnDistance !== false,
    }),
  });
  return c.json({
    vectors: data.vectors || [],
    distanceMetric: data.distanceMetric,
  });
});

export default router;
