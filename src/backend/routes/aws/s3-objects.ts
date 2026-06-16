import { Hono } from "hono";
import type { Context } from "hono";
import {
  S3Client,
  GetObjectTaggingCommand,
  PutObjectTaggingCommand,
  DeleteObjectTaggingCommand,
  GetObjectAttributesCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  ObjectAttributes,
} from "@aws-sdk/client-s3";
import { getAwsConfig } from "../../clients/aws";

const router = new Hono();

function s3(): S3Client {
  return new S3Client({ ...getAwsConfig(), forcePathStyle: true });
}

// ─── Object Tags ──────────────────────────────────────────────────

router.get("/buckets/:name/objects/*/tags", async (c: Context) => {
  const bucket = c.req.param("name");
  const path = new URL(c.req.url).pathname;
  const key = decodeURIComponent(path.split("/objects/")[1]?.split("/tags")[0] || "");
  if (!key) return c.json({ error: "Object key is required" }, 400);
  const result = await s3().send(new GetObjectTaggingCommand({ Bucket: bucket, Key: key }));
  return c.json({ bucket, key, tags: result.TagSet || [], total: (result.TagSet || []).length });
});

router.put("/buckets/:name/objects/*/tags", async (c: Context) => {
  const bucket = c.req.param("name");
  const path = new URL(c.req.url).pathname;
  const key = decodeURIComponent(path.split("/objects/")[1]?.split("/tags")[0] || "");
  if (!key) return c.json({ error: "Object key is required" }, 400);
  const { tags } = await c.req.json<{ tags: Array<{ Key: string; Value: string }> }>();
  if (!tags || !Array.isArray(tags)) return c.json({ error: "Tags array is required" }, 400);
  await s3().send(new PutObjectTaggingCommand({
    Bucket: bucket,
    Key: key,
    Tagging: { TagSet: tags },
  }));
  return c.json({ bucket, key, tags, updated: true });
});

router.delete("/buckets/:name/objects/*/tags", async (c: Context) => {
  const bucket = c.req.param("name");
  const path = new URL(c.req.url).pathname;
  const key = decodeURIComponent(path.split("/objects/")[1]?.split("/tags")[0] || "");
  if (!key) return c.json({ error: "Object key is required" }, 400);
  await s3().send(new DeleteObjectTaggingCommand({ Bucket: bucket, Key: key }));
  return c.json({ bucket, key, tags: [], deleted: true });
});

// ─── Object Attributes ────────────────────────────────────────────

router.get("/buckets/:name/objects/*/attributes", async (c: Context) => {
  const bucket = c.req.param("name");
  const path = new URL(c.req.url).pathname;
  const key = decodeURIComponent(path.split("/objects/")[1]?.split("/attributes")[0] || "");
  if (!key) return c.json({ error: "Object key is required" }, 400);
  const result = await s3().send(new GetObjectAttributesCommand({
    Bucket: bucket,
    Key: key,
    ObjectAttributes: [
      ObjectAttributes.CHECKSUM,
      ObjectAttributes.ETAG,
      ObjectAttributes.OBJECT_PARTS,
      ObjectAttributes.STORAGE_CLASS,
      ObjectAttributes.OBJECT_SIZE,
    ],
  }));
  return c.json({
    bucket,
    key,
    etag: result.ETag,
    checksum: result.Checksum,
    objectParts: result.ObjectParts,
    storageClass: result.StorageClass,
    objectSize: result.ObjectSize,
  });
});

// ─── Head Bucket (check existence) ────────────────────────────────

router.get("/buckets/:name/head", async (c: Context) => {
  const name = c.req.param("name");
  try {
    await s3().send(new HeadBucketCommand({ Bucket: name }));
    return c.json({ bucket: name, exists: true });
  } catch (err: any) {
    if (err.$metadata?.httpStatusCode === 404) {
      return c.json({ bucket: name, exists: false }, 404);
    }
    if (err.$metadata?.httpStatusCode === 403) {
      return c.json({ bucket: name, exists: true, accessDenied: true }, 403);
    }
    throw err;
  }
});

// ─── Head Object (metadata without body) ──────────────────────────

router.get("/buckets/:name/objects/*/head", async (c: Context) => {
  const bucket = c.req.param("name");
  const path = new URL(c.req.url).pathname;
  const key = decodeURIComponent(path.split("/objects/")[1]?.split("/head")[0] || "");
  if (!key) return c.json({ error: "Object key is required" }, 400);
  try {
    const result = await s3().send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return c.json({
      bucket,
      key,
      contentType: result.ContentType,
      contentLength: result.ContentLength,
      lastModified: result.LastModified?.toISOString(),
      etag: result.ETag?.replace(/"/g, ""),
      metadata: result.Metadata || {},
    });
  } catch (err: any) {
    if (err.$metadata?.httpStatusCode === 404) {
      return c.json({ bucket, key, exists: false }, 404);
    }
    throw err;
  }
});

export default router;
