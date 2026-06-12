import { Hono } from "hono";
import type { Context } from "hono";
import {
  S3Client,
  ListBucketsCommand,
  CreateBucketCommand,
  DeleteBucketCommand,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getAwsConfig } from "../../clients/aws";

const router = new Hono();

function s3(): S3Client {
  return new S3Client({ ...getAwsConfig(), forcePathStyle: true });
}

// List all buckets
router.get("/buckets", async (c: Context) => {
  const result = await s3().send(new ListBucketsCommand({}));
  const buckets = (result.Buckets || []).map((b: { Name?: string; CreationDate?: Date }) => ({
    name: b.Name,
    createdAt: b.CreationDate?.toISOString() || null,
  }));
  return c.json({ buckets, total: buckets.length });
});

// Create bucket
router.post("/buckets", async (c: Context) => {
  const { name } = await c.req.json<{ name: string }>();
  if (!name) return c.json({ error: "Bucket name is required" }, 400);
  await s3().send(new CreateBucketCommand({ Bucket: name }));
  return c.json({ name, created: true });
});

// Delete bucket
router.delete("/buckets/:name", async (c: Context) => {
  const name = c.req.param("name");
  await s3().send(new DeleteBucketCommand({ Bucket: name }));
  return c.json({ name, deleted: true });
});

// List objects in a bucket
router.get("/buckets/:name/objects", async (c: Context) => {
  const name = c.req.param("name");
  const prefix = c.req.query("prefix") || "";
  const result = await s3().send(
    new ListObjectsV2Command({ Bucket: name, Prefix: prefix || undefined })
  );
  const objects = (result.Contents || []).map((o: { Key?: string; Size?: number; LastModified?: Date; ETag?: string }) => ({
    key: o.Key,
    size: o.Size,
    lastModified: o.LastModified?.toISOString() || null,
    etag: o.ETag?.replace(/"/g, ""),
  }));
  return c.json({ bucket: name, prefix, objects, total: objects.length, truncated: result.IsTruncated });
});

// Get object content (supports keys with slashes)
router.get("/buckets/:name/objects/*", async (c: Context) => {
  const bucket = c.req.param("name");
  const path = new URL(c.req.url).pathname;
  const key = decodeURIComponent(path.split("/objects/")[1] || "");
  if (!key) return c.json({ error: "Object key is required" }, 400);
  const result = await s3().send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  let body = "";
  try {
    body = result.Body ? await result.Body.transformToString("utf-8") : "";
  } catch {
    body = "[Binary content — cannot display]";
  }
  return c.json({
    bucket,
    key,
    contentType: result.ContentType,
    size: result.ContentLength,
    lastModified: result.LastModified?.toISOString(),
    body,
  });
});

// Upload object
router.put("/buckets/:name/objects", async (c: Context) => {
  const bucket = c.req.param("name");
  const { key, body, contentType } = await c.req.json<{
    key: string;
    body: string;
    contentType?: string;
  }>();
  if (!key) return c.json({ error: "Object key is required" }, 400);
  await s3().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body || "",
      ContentType: contentType || "text/plain",
    })
  );
  return c.json({ bucket, key, uploaded: true });
});

// Delete object (supports keys with slashes)
router.delete("/buckets/:name/objects/*", async (c: Context) => {
  const bucket = c.req.param("name");
  const path = new URL(c.req.url).pathname;
  const key = decodeURIComponent(path.split("/objects/")[1] || "");
  if (!key) return c.json({ error: "Object key is required" }, 400);
  await s3().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  return c.json({ bucket, key, deleted: true });
});

export default router;
