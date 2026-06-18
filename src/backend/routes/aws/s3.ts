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
  DeleteObjectsCommand,
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

// List objects in a bucket (with folder support via delimiter)
router.get("/buckets/:name/objects", async (c: Context) => {
  const name = c.req.param("name");
  const prefix = c.req.query("prefix") || "";
  const delimiter = c.req.query("delimiter") || "/";
  const result = await s3().send(
    new ListObjectsV2Command({
      Bucket: name,
      Prefix: prefix || undefined,
      Delimiter: delimiter || undefined,
    })
  );
  const objects = (result.Contents || [])
    .filter((o) => o.Key !== prefix)
    .map((o: { Key?: string; Size?: number; LastModified?: Date; ETag?: string }) => ({
      key: o.Key,
      size: o.Size,
      lastModified: o.LastModified?.toISOString() || null,
      etag: o.ETag?.replace(/"/g, ""),
    }));
  const folders = (result.CommonPrefixes || []).map((p: { Prefix?: string }) => ({
    prefix: p.Prefix || "",
    name: (p.Prefix || "").replace(prefix, "").replace(/\/$/, ""),
  }));
  return c.json({ bucket: name, prefix, objects, folders, total: objects.length, truncated: result.IsTruncated });
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

// Create folder (zero-byte marker object with trailing /)
router.put("/buckets/:name/folders", async (c: Context) => {
  const bucket = c.req.param("name");
  const { prefix } = await c.req.json<{ prefix: string }>();
  if (!prefix) return c.json({ error: "prefix is required" }, 400);
  await s3().send(new PutObjectCommand({ Bucket: bucket, Key: prefix, Body: "" }));
  return c.json({ bucket, prefix, created: true });
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

// Batch delete objects (up to 1000 keys per request)
router.post("/buckets/:name/objects/batch-delete", async (c: Context) => {
  const bucket = c.req.param("name");
  const { keys } = await c.req.json<{ keys: string[] }>();
  if (!keys || !Array.isArray(keys) || keys.length === 0) {
    return c.json({ error: "keys array is required" }, 400);
  }
  const result = await s3().send(
    new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: { Objects: keys.map((k) => ({ Key: k })) },
    })
  );
  return c.json({
    bucket,
    deleted: (result.Deleted || []).map((d) => d.Key),
    errors: (result.Errors || []).map((e) => ({ key: e.Key, code: e.Code, message: e.Message })),
  });
});

// Delete folder (recursive: list all objects under prefix, batch-delete in chunks of 1000)
router.post("/buckets/:name/folders/delete", async (c: Context) => {
  const bucket = c.req.param("name");
  const { prefix } = await c.req.json<{ prefix: string }>();
  if (!prefix) return c.json({ error: "prefix is required" }, 400);

  const client = s3();
  let allKeys: string[] = [];
  let continuationToken: string | undefined;

  // List all objects under the prefix (paginated)
  do {
    const listResult = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    );
    allKeys.push(...(listResult.Contents || []).map((o) => o.Key!));
    continuationToken = listResult.IsTruncated ? listResult.NextContinuationToken : undefined;
  } while (continuationToken);

  if (allKeys.length === 0) {
    return c.json({ bucket, prefix, deleted: [], totalDeleted: 0 });
  }

  // Batch delete in chunks of 1000 (S3 limit per DeleteObjects request)
  let totalDeleted = 0;
  const allErrors: Array<{ key: string | undefined; code: string | undefined; message: string | undefined }> = [];
  for (let i = 0; i < allKeys.length; i += 1000) {
    const chunk = allKeys.slice(i, i + 1000);
    const result = await client.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: chunk.map((k) => ({ Key: k })) },
      })
    );
    totalDeleted += result.Deleted?.length || 0;
    allErrors.push(...(result.Errors || []).map((e) => ({ key: e.Key, code: e.Code, message: e.Message })));
  }

  return c.json({
    bucket,
    prefix,
    deleted: allKeys,
    totalDeleted,
    errors: allErrors,
  });
});

export default router;
