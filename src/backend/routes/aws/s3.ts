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

/** Per-file upload limit. The AWS SDK v3 buffers each file into a Buffer
 *  to compute the body checksum required by SigV4, so this caps peak memory. */
const MAX_FILE_SIZE = parseInt(process.env.S3_MAX_UPLOAD_BYTES || "") || 50 * 1024 * 1024;

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

// Stream raw object content with correct Content-Type — used for "Open in browser"
// Must be defined BEFORE the catch-all /* route.
router.get("/buckets/:name/objects/*/raw", async (c: Context) => {
  const bucket = c.req.param("name");
  const path = new URL(c.req.url).pathname;
  const key = decodeURIComponent(path.split("/objects/")[1]?.replace(/\/raw$/, "") || "");
  if (!key) return c.json({ error: "Object key is required" }, 400);
  const result = await s3().send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const contentType = result.ContentType || "application/octet-stream";
  const bytes = result.Body ? await result.Body.transformToByteArray() : new Uint8Array();
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(result.ContentLength || bytes.length),
      "Cache-Control": "no-cache",
    },
  });
});

// Get object metadata + content (supports keys with slashes)
router.get("/buckets/:name/objects/*", async (c: Context) => {
  const bucket = c.req.param("name");
  const path = new URL(c.req.url).pathname;
  const key = decodeURIComponent(path.split("/objects/")[1] || "");
  if (!key) return c.json({ error: "Object key is required" }, 400);
  const result = await s3().send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const contentType = result.ContentType || "application/octet-stream";
  let body: string;
  let bodyEncoding = "utf-8";
  if (result.Body) {
    // Binary types: return base64 so frontend can render inline or download
    const isBinaryType =
      /^(image|audio|video)\//.test(contentType) ||
      contentType === "application/octet-stream" ||
      contentType === "application/pdf";
    if (isBinaryType) {
      const bytes = await result.Body.transformToByteArray();
      body = Buffer.from(bytes).toString("base64");
      bodyEncoding = "base64";
    } else {
      try {
        body = await result.Body.transformToString("utf-8");
      } catch {
        const bytes = await result.Body.transformToByteArray();
        body = Buffer.from(bytes).toString("base64");
        bodyEncoding = "base64";
      }
    }
  } else {
    body = "";
  }
  return c.json({
    bucket,
    key,
    contentType,
    size: result.ContentLength,
    lastModified: result.LastModified?.toISOString(),
    etag: result.ETag?.replace(/"/g, ""),
    body,
    bodyEncoding,
  });
});

// Upload one or more files via multipart/form-data.
// Field name is "files" (one or many). Optional ?prefix=... is prepended to each filename.
router.post("/buckets/:name/objects/upload", async (c: Context) => {
  const bucket = c.req.param("name");
  const prefix = c.req.query("prefix") || "";
  const body = await c.req.parseBody();
  const raw = body["files"];
  const fileList: File[] = Array.isArray(raw)
    ? raw.filter((f): f is File => f instanceof File)
    : raw instanceof File
    ? [raw]
    : [];
  if (fileList.length === 0) {
    return c.json({ error: "No files provided" }, 400);
  }
  const client = s3();
  const results = await Promise.all(
    fileList.map(async (file) => {
      const key = `${prefix}${file.name}`;
      try {
        if (file.size > MAX_FILE_SIZE) {
          return {
            key,
            size: file.size,
            status: "error" as const,
            error: `File exceeds ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)} MB limit (${(file.size / 1024 / 1024).toFixed(1)} MB)`,
          };
        }
        // Buffer the file so the AWS SDK v3 can compute the body checksum
        // required by SigV4. Passing a streaming `File` directly fails with
        // "Unable to calculate hash for flowing readable stream".
        const body = Buffer.from(await file.arrayBuffer());
        await client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: body,
            ContentType: file.type || "application/octet-stream",
          })
        );
        return { key, size: file.size, status: "uploaded" as const };
      } catch (err) {
        return {
          key,
          size: file.size,
          status: "error" as const,
          error: (err as Error).message,
        };
      }
    })
  );
  const uploaded = results.filter((r) => r.status === "uploaded").length;
  const failed = results.length - uploaded;
  return c.json({ bucket, prefix, uploaded, failed, results });
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
