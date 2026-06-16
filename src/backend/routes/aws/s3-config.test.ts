import { describe, it, expect, beforeEach, vi } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn(function() { return { send: mockSend }; }),
  GetBucketVersioningCommand: vi.fn(function(args) { return args; }),
  PutBucketVersioningCommand: vi.fn(function(args) { return args; }),
  GetBucketTaggingCommand: vi.fn(function(args) { return args; }),
  PutBucketTaggingCommand: vi.fn(function(args) { return args; }),
  DeleteBucketTaggingCommand: vi.fn(function(args) { return args; }),
  GetBucketPolicyCommand: vi.fn(function(args) { return args; }),
  PutBucketPolicyCommand: vi.fn(function(args) { return args; }),
  DeleteBucketPolicyCommand: vi.fn(function(args) { return args; }),
  GetBucketLifecycleConfigurationCommand: vi.fn(function(args) { return args; }),
  PutBucketLifecycleConfigurationCommand: vi.fn(function(args) { return args; }),
  GetBucketCorsCommand: vi.fn(function(args) { return args; }),
  PutBucketCorsCommand: vi.fn(function(args) { return args; }),
  DeleteBucketCorsCommand: vi.fn(function(args) { return args; }),
  GetBucketWebsiteCommand: vi.fn(function(args) { return args; }),
  PutBucketWebsiteCommand: vi.fn(function(args) { return args; }),
  DeleteBucketWebsiteCommand: vi.fn(function(args) { return args; }),
  GetBucketEncryptionCommand: vi.fn(function(args) { return args; }),
  PutBucketEncryptionCommand: vi.fn(function(args) { return args; }),
  DeleteBucketEncryptionCommand: vi.fn(function(args) { return args; }),
  GetBucketNotificationConfigurationCommand: vi.fn(function(args) { return args; }),
  PutBucketNotificationConfigurationCommand: vi.fn(function(args) { return args; }),
  GetPublicAccessBlockCommand: vi.fn(function(args) { return args; }),
  PutPublicAccessBlockCommand: vi.fn(function(args) { return args; }),
  DeletePublicAccessBlockCommand: vi.fn(function(args) { return args; }),
  GetBucketLoggingCommand: vi.fn(function(args) { return args; }),
  PutBucketLoggingCommand: vi.fn(function(args) { return args; }),
}));

import router from "./s3-config";

const noSuchTagSet = vi.hoisted(() => {
  const err = new Error("No tags");
  err.name = "NoSuchTagSet";
  return err;
});

const noSuchPolicy = vi.hoisted(() => {
  const err = new Error("No policy");
  err.name = "NoSuchBucketPolicy";
  return err;
});

const noSuchLifecycle = vi.hoisted(() => {
  const err = new Error("No lifecycle");
  err.name = "NoSuchLifecycleConfiguration";
  return err;
});

const noSuchCors = vi.hoisted(() => {
  const err = new Error("No CORS");
  err.name = "NoSuchCORSConfiguration";
  return err;
});

const noSuchWebsite = vi.hoisted(() => {
  const err = new Error("No website");
  err.name = "NoSuchWebsiteConfiguration";
  return err;
});

const noSuchEncryption = vi.hoisted(() => {
  const err = new Error("No encryption");
  err.name = "ServerSideEncryptionConfigurationNotFoundError";
  return err;
});

const noSuchPublicAccessBlock = vi.hoisted(() => {
  const err = new Error("No PAB");
  err.name = "NoSuchPublicAccessBlockConfiguration";
  return err;
});

beforeEach(() => {
  mockSend.mockReset();
  mockSend.mockResolvedValue({});
});

async function get(path: string) {
  return router.request(path, { method: "GET" });
}

async function put(path: string, body?: any) {
  return router.request(path, {
    method: "PUT",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { "content-type": "application/json" } : undefined,
  });
}

async function del(path: string) {
  return router.request(path, { method: "DELETE" });
}

describe("S3 Config", () => {
  describe("Versioning", () => {
    it("GET /buckets/:name/versioning — returns status", async () => {
      mockSend.mockResolvedValueOnce({ Status: "Enabled" });
      const res = await get("/buckets/my-bucket/versioning");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe("Enabled");
      expect(body.bucket).toBe("my-bucket");
    });

    it("GET /buckets/:name/versioning — defaults to Suspended", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/buckets/my-bucket/versioning");
      const body = await res.json();
      expect(body.status).toBe("Suspended");
    });

    it("PUT /buckets/:name/versioning — enables", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/buckets/my-bucket/versioning", { status: "Enabled" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
      expect(mockSend.mock.calls[0][0].Bucket).toBe("my-bucket");
      expect(mockSend.mock.calls[0][0].VersioningConfiguration.Status).toBe("Enabled");
    });

    it("PUT /buckets/:name/versioning — suspends", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/buckets/my-bucket/versioning", { status: "Suspended" });
      expect(res.status).toBe(200);
      expect(mockSend.mock.calls[0][0].VersioningConfiguration.Status).toBe("Suspended");
    });

    it("PUT /buckets/:name/versioning — 400 on invalid status", async () => {
      const res = await put("/buckets/my-bucket/versioning", { status: "Invalid" });
      expect(res.status).toBe(400);
    });
  });

  describe("Bucket Tags", () => {
    it("GET /buckets/:name/tags — returns tags", async () => {
      mockSend.mockResolvedValueOnce({ TagSet: [{ Key: "env", Value: "prod" }] });
      const res = await get("/buckets/my-bucket/tags");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.tags).toHaveLength(1);
    });

    it("GET /buckets/:name/tags — returns empty on NoSuchTagSet", async () => {
      mockSend.mockRejectedValueOnce(noSuchTagSet);
      const res = await get("/buckets/my-bucket/tags");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.tags).toEqual([]);
      expect(body.total).toBe(0);
    });

    it("PUT /buckets/:name/tags — sets tags", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/buckets/my-bucket/tags", {
        tags: [{ Key: "env", Value: "staging" }],
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
    });

    it("PUT /buckets/:name/tags — 400 when tags missing", async () => {
      const res = await put("/buckets/my-bucket/tags", {});
      expect(res.status).toBe(400);
    });

    it("DELETE /buckets/:name/tags — deletes tags", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/buckets/my-bucket/tags");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });
  });

  describe("Bucket Policy", () => {
    it("GET /buckets/:name/policy — returns policy", async () => {
      mockSend.mockResolvedValueOnce({ Policy: '{"Version":"2012-10-17"}' });
      const res = await get("/buckets/my-bucket/policy");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.policy).toBe('{"Version":"2012-10-17"}');
      expect(body.hasPolicy).toBe(true);
    });

    it("GET /buckets/:name/policy — returns null on 404", async () => {
      mockSend.mockRejectedValueOnce(noSuchPolicy);
      const res = await get("/buckets/my-bucket/policy");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.policy).toBeNull();
      expect(body.hasPolicy).toBe(false);
    });

    it("PUT /buckets/:name/policy — sets policy as string", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/buckets/my-bucket/policy", {
        policy: '{"Version":"2012-10-17"}',
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
      expect(typeof mockSend.mock.calls[0][0].Policy).toBe("string");
    });

    it("PUT /buckets/:name/policy — sets policy as object", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/buckets/my-bucket/policy", {
        policy: { Version: "2012-10-17" },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
    });

    it("PUT /buckets/:name/policy — 400 when policy missing", async () => {
      const res = await put("/buckets/my-bucket/policy", {});
      expect(res.status).toBe(400);
    });

    it("DELETE /buckets/:name/policy — deletes policy", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/buckets/my-bucket/policy");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });
  });

  describe("Lifecycle", () => {
    it("GET /buckets/:name/lifecycle — returns rules", async () => {
      mockSend.mockResolvedValueOnce({ Rules: [{ ID: "expire", Status: "Enabled" }] });
      const res = await get("/buckets/my-bucket/lifecycle");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.rules[0].id).toBe("expire");
    });

    it("GET /buckets/:name/lifecycle — returns empty on 404", async () => {
      mockSend.mockRejectedValueOnce(noSuchLifecycle);
      const res = await get("/buckets/my-bucket/lifecycle");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.rules).toEqual([]);
      expect(body.total).toBe(0);
    });

    it("PUT /buckets/:name/lifecycle — sets rules", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/buckets/my-bucket/lifecycle", {
        rules: [{ ID: "expire", Status: "Enabled" }],
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
    });

    it("PUT /buckets/:name/lifecycle — 400 when rules missing", async () => {
      const res = await put("/buckets/my-bucket/lifecycle", {});
      expect(res.status).toBe(400);
    });

    it("DELETE /buckets/:name/lifecycle — clears rules", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/buckets/my-bucket/lifecycle");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
      expect(body.rules).toEqual([]);
    });
  });

  describe("CORS", () => {
    it("GET /buckets/:name/cors — returns rules", async () => {
      mockSend.mockResolvedValueOnce({ CORSRules: [{ AllowedOrigins: ["*"] }] });
      const res = await get("/buckets/my-bucket/cors");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.rules[0].AllowedOrigins).toEqual(["*"]);
    });

    it("GET /buckets/:name/cors — returns empty on 404", async () => {
      mockSend.mockRejectedValueOnce(noSuchCors);
      const res = await get("/buckets/my-bucket/cors");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.rules).toEqual([]);
    });

    it("PUT /buckets/:name/cors — sets rules", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/buckets/my-bucket/cors", {
        rules: [{ AllowedOrigins: ["*"], AllowedMethods: ["GET"] }],
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
    });

    it("PUT /buckets/:name/cors — 400 when rules missing", async () => {
      const res = await put("/buckets/my-bucket/cors", {});
      expect(res.status).toBe(400);
    });

    it("DELETE /buckets/:name/cors — deletes rules", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/buckets/my-bucket/cors");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
      expect(body.rules).toEqual([]);
    });
  });

  describe("Website", () => {
    it("GET /buckets/:name/website — returns config", async () => {
      mockSend.mockResolvedValueOnce({ IndexDocument: { Suffix: "index.html" } });
      const res = await get("/buckets/my-bucket/website");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.indexDocument).toBe("index.html");
      expect(body.configured).toBe(true);
    });

    it("GET /buckets/:name/website — returns not configured on 404", async () => {
      mockSend.mockRejectedValueOnce(noSuchWebsite);
      const res = await get("/buckets/my-bucket/website");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.configured).toBe(false);
    });

    it("PUT /buckets/:name/website — sets config", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/buckets/my-bucket/website", {
        indexDocument: "index.html",
        errorDocument: "error.html",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
      expect(body.configured).toBe(true);
    });

    it("PUT /buckets/:name/website — 400 when missing indexDocument and redirect", async () => {
      const res = await put("/buckets/my-bucket/website", { errorDocument: "e.html" });
      expect(res.status).toBe(400);
    });

    it("DELETE /buckets/:name/website — deletes website config", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/buckets/my-bucket/website");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });
  });

  describe("Encryption", () => {
    it("GET /buckets/:name/encryption — returns config", async () => {
      mockSend.mockResolvedValueOnce({
        ServerSideEncryptionConfiguration: {
          Rules: [{ ApplyServerSideEncryptionByDefault: { SSEAlgorithm: "AES256" } }],
        },
      });
      const res = await get("/buckets/my-bucket/encryption");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.configured).toBe(true);
      expect(body.rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm).toBe("AES256");
    });

    it("GET /buckets/:name/encryption — returns not configured on 404", async () => {
      mockSend.mockRejectedValueOnce(noSuchEncryption);
      const res = await get("/buckets/my-bucket/encryption");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.configured).toBe(false);
      expect(body.rules).toEqual([]);
    });

    it("PUT /buckets/:name/encryption — sets encryption", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/buckets/my-bucket/encryption", { sseAlgorithm: "AES256" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
      expect(body.sseAlgorithm).toBe("AES256");
    });

    it("PUT /buckets/:name/encryption — 400 when algorithm missing", async () => {
      const res = await put("/buckets/my-bucket/encryption", {});
      expect(res.status).toBe(400);
    });

    it("DELETE /buckets/:name/encryption — deletes encryption", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/buckets/my-bucket/encryption");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });
  });

  describe("Notifications", () => {
    it("GET /buckets/:name/notifications — returns config", async () => {
      mockSend.mockResolvedValueOnce({ TopicConfigurations: [{ TopicArn: "arn:aws:sns:..." }] });
      const res = await get("/buckets/my-bucket/notifications");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(1);
      expect(body.snsNotifications).toHaveLength(1);
    });

    it("GET /buckets/:name/notifications — handles empty config", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/buckets/my-bucket/notifications");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.total).toBe(0);
    });

    it("PUT /buckets/:name/notifications — sets config", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/buckets/my-bucket/notifications", {
        snsNotifications: [{ TopicArn: "arn:aws:sns:us-east-1:123:topic", Events: ["s3:ObjectCreated:*"] }],
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
    });
  });

  describe("Public Access Block", () => {
    it("GET /buckets/:name/public-access-block — returns config", async () => {
      mockSend.mockResolvedValueOnce({
        PublicAccessBlockConfiguration: { BlockPublicAcls: true, IgnorePublicAcls: false, BlockPublicPolicy: true, RestrictPublicBuckets: false },
      });
      const res = await get("/buckets/my-bucket/public-access-block");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.configured).toBe(true);
      expect(body.blockPublicAcls).toBe(true);
    });

    it("GET /buckets/:name/public-access-block — returns not configured on 404", async () => {
      mockSend.mockRejectedValueOnce(noSuchPublicAccessBlock);
      const res = await get("/buckets/my-bucket/public-access-block");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.configured).toBe(false);
    });

    it("PUT /buckets/:name/public-access-block — sets config", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/buckets/my-bucket/public-access-block", {
        blockPublicAcls: true,
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
      expect(mockSend.mock.calls[0][0].PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
    });

    it("DELETE /buckets/:name/public-access-block — deletes config", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await del("/buckets/my-bucket/public-access-block");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleted).toBe(true);
    });
  });

  describe("Logging", () => {
    it("GET /buckets/:name/logging — returns config when enabled", async () => {
      mockSend.mockResolvedValueOnce({
        LoggingEnabled: { TargetBucket: "logs-bucket", TargetPrefix: "prefix/" },
      });
      const res = await get("/buckets/my-bucket/logging");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.targetBucket).toBe("logs-bucket");
      expect(body.targetPrefix).toBe("prefix/");
      expect(body.enabled).toBe(true);
    });

    it("GET /buckets/:name/logging — returns disabled when not configured", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await get("/buckets/my-bucket/logging");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.enabled).toBe(false);
      expect(body.targetBucket).toBeNull();
    });

    it("PUT /buckets/:name/logging — enables logging", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/buckets/my-bucket/logging", {
        targetBucket: "logs-bucket",
        targetPrefix: "prefix/",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
      expect(mockSend.mock.calls[0][0].BucketLoggingStatus.LoggingEnabled.TargetBucket).toBe("logs-bucket");
    });

    it("PUT /buckets/:name/logging — 400 when targetBucket missing", async () => {
      const res = await put("/buckets/my-bucket/logging", {});
      expect(res.status).toBe(400);
    });
  });
});
