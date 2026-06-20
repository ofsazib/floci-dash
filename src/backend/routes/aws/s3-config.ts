import { Hono } from "hono";
import type { Context } from "hono";
import {
  S3Client,
  GetBucketVersioningCommand,
  PutBucketVersioningCommand,
  GetBucketTaggingCommand,
  PutBucketTaggingCommand,
  DeleteBucketTaggingCommand,
  GetBucketPolicyCommand,
  PutBucketPolicyCommand,
  DeleteBucketPolicyCommand,
  GetBucketLifecycleConfigurationCommand,
  PutBucketLifecycleConfigurationCommand,
  GetBucketCorsCommand,
  PutBucketCorsCommand,
  DeleteBucketCorsCommand,
  GetBucketWebsiteCommand,
  PutBucketWebsiteCommand,
  DeleteBucketWebsiteCommand,
  GetBucketEncryptionCommand,
  PutBucketEncryptionCommand,
  DeleteBucketEncryptionCommand,
  GetBucketNotificationConfigurationCommand,
  PutBucketNotificationConfigurationCommand,
  GetPublicAccessBlockCommand,
  PutPublicAccessBlockCommand,
  DeletePublicAccessBlockCommand,
  GetBucketLoggingCommand,
  PutBucketLoggingCommand,
  ServerSideEncryptionByDefault,
} from "@aws-sdk/client-s3";
import { getAwsConfig } from "../../clients/aws";
import { sanitizeBucketName, sanitizeName, validateJson } from "../../clients/sanitize";

const router = new Hono();

function s3(): S3Client {
  return new S3Client({ ...getAwsConfig(), forcePathStyle: true });
}

// ─── Bucket Versioning ────────────────────────────────────────────

router.get("/buckets/:name/versioning", async (c: Context) => {
  const name = c.req.param("name");
  const result = await s3().send(new GetBucketVersioningCommand({ Bucket: name }));
  return c.json({
    bucket: name,
    status: result.Status || "Suspended",
    mfaDelete: result.MFADelete || "Disabled",
  });
});

router.put("/buckets/:name/versioning", async (c: Context) => {
  const name = c.req.param("name");  const { status } = await c.req.json<{ status: string }>();
  if (!status || !["Enabled", "Suspended"].includes(status))
 {
    return c.json({ error: "Status must be 'Enabled' or 'Suspended'" }, 400);
  }
  await s3().send(new PutBucketVersioningCommand({ Bucket: name, VersioningConfiguration: { Status: status as any } }));
  return c.json({ bucket: name, status, updated: true });
});

// ─── Bucket Tags ──────────────────────────────────────────────────

router.get("/buckets/:name/tags", async (c: Context) => {
  const name = c.req.param("name");
  try {
    const result = await s3().send(new GetBucketTaggingCommand({ Bucket: name }));
    return c.json({ bucket: name, tags: result.TagSet || [], total: (result.TagSet || []).length });
  } catch (err: any) {
    if (err.name === "NoSuchTagSet" || err.$metadata?.httpStatusCode === 404) {
      return c.json({ bucket: name, tags: [], total: 0 });
    }
    throw err;
  }
});

router.put("/buckets/:name/tags", async (c: Context) => {
  const name = c.req.param("name");
  const { tags } = await c.req.json<{ tags: Array<{ Key: string; Value: string }> }>();
  if (!tags || !Array.isArray(tags)) {
    return c.json({ error: "Tags array is required" }, 400);
  }
  await s3().send(new PutBucketTaggingCommand({ Bucket: name, Tagging: { TagSet: tags } }));
  return c.json({ bucket: name, tags, updated: true });
});

router.delete("/buckets/:name/tags", async (c: Context) => {
  const name = c.req.param("name");
  await s3().send(new DeleteBucketTaggingCommand({ Bucket: name }));
  return c.json({ bucket: name, tags: [], deleted: true });
});

// ─── Bucket Policy ────────────────────────────────────────────────

router.get("/buckets/:name/policy", async (c: Context) => {
  const name = c.req.param("name");
  try {
    const result = await s3().send(new GetBucketPolicyCommand({ Bucket: name }));
    return c.json({ bucket: name, policy: result.Policy || null, hasPolicy: !!result.Policy });
  } catch (err: any) {
    if (err.name === "NoSuchBucketPolicy" || err.$metadata?.httpStatusCode === 404) {
      return c.json({ bucket: name, policy: null, hasPolicy: false });
    }
    throw err;
  }
});

router.put("/buckets/:name/policy", async (c: Context) => {
  const name = c.req.param("name");
  const { policy } = await c.req.json<{ policy: string | Record<string, any> }>();
  if (!policy) return c.json({ error: "Policy is required" }, 400);
  const policyString = typeof policy === "string" ? policy : JSON.stringify(policy);
  // Validate policy is parseable JSON
  const validation = validateJson(policyString, "object");
  if (!validation.valid) {
    return c.json({ error: `Invalid policy: ${validation.error}` }, 400);
  }
  await s3().send(new PutBucketPolicyCommand({ Bucket: name, Policy: policyString }));
  return c.json({ bucket: name, hasPolicy: true, updated: true });
});

router.delete("/buckets/:name/policy", async (c: Context) => {
  const name = c.req.param("name");
  await s3().send(new DeleteBucketPolicyCommand({ Bucket: name }));
  return c.json({ bucket: name, hasPolicy: false, deleted: true });
});

// ─── Bucket Lifecycle ─────────────────────────────────────────────

router.get("/buckets/:name/lifecycle", async (c: Context) => {
  const name = c.req.param("name");
  try {
    const result = await s3().send(new GetBucketLifecycleConfigurationCommand({ Bucket: name }));
    const rules = (result.Rules || []).map((r) => ({
      id: r.ID,
      status: r.Status,
      prefix: r.Filter?.Prefix || "",
      filter: r.Filter,
      transitions: r.Transitions,
      expiration: r.Expiration,
      noncurrentVersionExpiration: r.NoncurrentVersionExpiration,
      abortIncompleteMultipartUpload: r.AbortIncompleteMultipartUpload,
    }));
    return c.json({ bucket: name, rules, total: rules.length });
  } catch (err: any) {
    if (err.name === "NoSuchLifecycleConfiguration" || err.$metadata?.httpStatusCode === 404) {
      return c.json({ bucket: name, rules: [], total: 0 });
    }
    throw err;
  }
});

router.put("/buckets/:name/lifecycle", async (c: Context) => {
  const name = c.req.param("name");
  const { rules } = await c.req.json<{ rules: any[] }>();
  if (!rules || !Array.isArray(rules)) {
    return c.json({ error: "Rules array is required" }, 400);
  }
  await s3().send(new PutBucketLifecycleConfigurationCommand({ Bucket: name, LifecycleConfiguration: { Rules: rules } }));
  return c.json({ bucket: name, rules, updated: true });
});

router.delete("/buckets/:name/lifecycle", async (c: Context) => {
  const name = c.req.param("name");
  await s3().send(new PutBucketLifecycleConfigurationCommand({ Bucket: name, LifecycleConfiguration: { Rules: [] } }));
  return c.json({ bucket: name, rules: [], deleted: true });
});

// ─── Bucket CORS ──────────────────────────────────────────────────

router.get("/buckets/:name/cors", async (c: Context) => {
  const name = c.req.param("name");
  try {
    const result = await s3().send(new GetBucketCorsCommand({ Bucket: name }));
    return c.json({ bucket: name, rules: result.CORSRules || [], total: (result.CORSRules || []).length });
  } catch (err: any) {
    if (err.name === "NoSuchCORSConfiguration" || err.$metadata?.httpStatusCode === 404) {
      return c.json({ bucket: name, rules: [], total: 0 });
    }
    throw err;
  }
});

router.put("/buckets/:name/cors", async (c: Context) => {
  const name = c.req.param("name");
  const { rules } = await c.req.json<{ rules: any[] }>();
  if (!rules || !Array.isArray(rules)) {
    return c.json({ error: "Rules array is required" }, 400);
  }
  await s3().send(new PutBucketCorsCommand({ Bucket: name, CORSConfiguration: { CORSRules: rules } }));
  return c.json({ bucket: name, rules, updated: true });
});

router.delete("/buckets/:name/cors", async (c: Context) => {
  const name = c.req.param("name");
  await s3().send(new DeleteBucketCorsCommand({ Bucket: name }));
  return c.json({ bucket: name, rules: [], deleted: true });
});

// ─── Bucket Website ───────────────────────────────────────────────

router.get("/buckets/:name/website", async (c: Context) => {
  const name = c.req.param("name");
  try {
    const result = await s3().send(new GetBucketWebsiteCommand({ Bucket: name }));
    return c.json({
      bucket: name,
      indexDocument: result.IndexDocument?.Suffix || null,
      errorDocument: result.ErrorDocument?.Key || null,
      redirectAllRequestsTo: result.RedirectAllRequestsTo || null,
      routingRules: result.RoutingRules || [],
      configured: true,
    });
  } catch (err: any) {
    if (err.name === "NoSuchWebsiteConfiguration" || err.$metadata?.httpStatusCode === 404) {
      return c.json({ bucket: name, configured: false });
    }
    throw err;
  }
});

router.put("/buckets/:name/website", async (c: Context) => {
  const name = c.req.param("name");
  const config = await c.req.json<{
    indexDocument?: string;
    errorDocument?: string;
    redirectAllRequestsTo?: { Protocol?: string; HostName?: string };
  }>();
  if (!config.indexDocument && !config.redirectAllRequestsTo) {
    return c.json({ error: "indexDocument or redirectAllRequestsTo is required" }, 400);
  }
  const websiteConfig: any = {};
  if (config.indexDocument) websiteConfig.IndexDocument = { Suffix: config.indexDocument };
  if (config.errorDocument) websiteConfig.ErrorDocument = { Key: config.errorDocument };
  if (config.redirectAllRequestsTo) websiteConfig.RedirectAllRequestsTo = config.redirectAllRequestsTo;
  await s3().send(new PutBucketWebsiteCommand({ Bucket: name, WebsiteConfiguration: websiteConfig }));
  return c.json({ bucket: name, configured: true, updated: true });
});

router.delete("/buckets/:name/website", async (c: Context) => {
  const name = c.req.param("name");
  await s3().send(new DeleteBucketWebsiteCommand({ Bucket: name }));
  return c.json({ bucket: name, configured: false, deleted: true });
});

// ─── Bucket Encryption ────────────────────────────────────────────

router.get("/buckets/:name/encryption", async (c: Context) => {
  const name = c.req.param("name");
  try {
    const result = await s3().send(new GetBucketEncryptionCommand({ Bucket: name }));
    const rules = result.ServerSideEncryptionConfiguration?.Rules || [];
    return c.json({ bucket: name, rules, configured: true });
  } catch (err: any) {
    if (err.name === "ServerSideEncryptionConfigurationNotFoundError" || err.$metadata?.httpStatusCode === 404) {
      return c.json({ bucket: name, rules: [], configured: false });
    }
    throw err;
  }
});

router.put("/buckets/:name/encryption", async (c: Context) => {
  const name = c.req.param("name");
  const { sseAlgorithm } = await c.req.json<{ sseAlgorithm: string }>();
  if (!sseAlgorithm) return c.json({ error: "sseAlgorithm is required" }, 400);
  const sse: ServerSideEncryptionByDefault = { SSEAlgorithm: sseAlgorithm as any };
  await s3().send(new PutBucketEncryptionCommand({
    Bucket: name,
    ServerSideEncryptionConfiguration: { Rules: [{ ApplyServerSideEncryptionByDefault: sse }] },
  }));
  return c.json({ bucket: name, configured: true, sseAlgorithm, updated: true });
});

router.delete("/buckets/:name/encryption", async (c: Context) => {
  const name = c.req.param("name");
  await s3().send(new DeleteBucketEncryptionCommand({ Bucket: name }));
  return c.json({ bucket: name, configured: false, deleted: true });
});

// ─── Bucket Notification Configuration ────────────────────────────

router.get("/buckets/:name/notifications", async (c: Context) => {
  const name = c.req.param("name");
  const result = await s3().send(new GetBucketNotificationConfigurationCommand({ Bucket: name }));
  const lambda = result.LambdaFunctionConfigurations || [];
  const sqs = result.QueueConfigurations || [];
  const sns = result.TopicConfigurations || [];
  return c.json({
    bucket: name,
    lambdaNotifications: lambda,
    sqsNotifications: sqs,
    snsNotifications: sns,
    total: lambda.length + sqs.length + sns.length,
  });
});

router.put("/buckets/:name/notifications", async (c: Context) => {
  const name = c.req.param("name");
  const { lambdaNotifications, sqsNotifications, snsNotifications } = await c.req.json<{
    lambdaNotifications?: any[];
    sqsNotifications?: any[];
    snsNotifications?: any[];
  }>();
  await s3().send(new PutBucketNotificationConfigurationCommand({
    Bucket: name,
    NotificationConfiguration: {
      LambdaFunctionConfigurations: lambdaNotifications || [],
      QueueConfigurations: sqsNotifications || [],
      TopicConfigurations: snsNotifications || [],
    },
  }));
  return c.json({ bucket: name, updated: true });
});

// ─── Public Access Block ──────────────────────────────────────────

router.get("/buckets/:name/public-access-block", async (c: Context) => {
  const name = c.req.param("name");
  try {
    const result = await s3().send(new GetPublicAccessBlockCommand({ Bucket: name }));
    const config = result.PublicAccessBlockConfiguration || {};
    return c.json({
      bucket: name,
      blockPublicAcls: config.BlockPublicAcls ?? false,
      ignorePublicAcls: config.IgnorePublicAcls ?? false,
      blockPublicPolicy: config.BlockPublicPolicy ?? false,
      restrictPublicBuckets: config.RestrictPublicBuckets ?? false,
      configured: true,
    });
  } catch (err: any) {
    if (err.name === "NoSuchPublicAccessBlockConfiguration" || err.$metadata?.httpStatusCode === 404) {
      return c.json({ bucket: name, configured: false, blockPublicAcls: false, ignorePublicAcls: false, blockPublicPolicy: false, restrictPublicBuckets: false });
    }
    throw err;
  }
});

router.put("/buckets/:name/public-access-block", async (c: Context) => {
  const name = c.req.param("name");
  const config = await c.req.json<{
    blockPublicAcls?: boolean;
    ignorePublicAcls?: boolean;
    blockPublicPolicy?: boolean;
    restrictPublicBuckets?: boolean;
  }>();
  await s3().send(new PutPublicAccessBlockCommand({
    Bucket: name,
    PublicAccessBlockConfiguration: {
      BlockPublicAcls: config.blockPublicAcls ?? false,
      IgnorePublicAcls: config.ignorePublicAcls ?? false,
      BlockPublicPolicy: config.blockPublicPolicy ?? false,
      RestrictPublicBuckets: config.restrictPublicBuckets ?? false,
    },
  }));
  return c.json({ bucket: name, configured: true, ...config, updated: true });
});

router.delete("/buckets/:name/public-access-block", async (c: Context) => {
  const name = c.req.param("name");
  await s3().send(new DeletePublicAccessBlockCommand({ Bucket: name }));
  return c.json({ bucket: name, configured: false, deleted: true });
});

// ─── Bucket Logging ───────────────────────────────────────────────

router.get("/buckets/:name/logging", async (c: Context) => {
  const name = c.req.param("name");
  const result = await s3().send(new GetBucketLoggingCommand({ Bucket: name }));
  return c.json({
    bucket: name,
    targetBucket: result.LoggingEnabled?.TargetBucket || null,
    targetPrefix: result.LoggingEnabled?.TargetPrefix || null,
    enabled: !!result.LoggingEnabled,
  });
});

router.put("/buckets/:name/logging", async (c: Context) => {
  const name = c.req.param("name");
  const { targetBucket, targetPrefix } = await c.req.json<{ targetBucket: string; targetPrefix?: string }>();
  if (!targetBucket) return c.json({ error: "targetBucket is required" }, 400);
  await s3().send(new PutBucketLoggingCommand({
    Bucket: name,
    BucketLoggingStatus: {
      LoggingEnabled: { TargetBucket: targetBucket, TargetPrefix: targetPrefix || "" },
    },
  }));
  return c.json({ bucket: name, targetBucket, targetPrefix: targetPrefix || "", enabled: true, updated: true });
});

export default router;
