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
  GetBucketAclCommand: vi.fn(function(args) { return args; }),
  PutBucketAclCommand: vi.fn(function(args) { return args; }),
  PutObjectLockConfigurationCommand: vi.fn(function(args) { return args; }),
  GetObjectLockConfigurationCommand: vi.fn(function(args) { return args; }),
  PutObjectRetentionCommand: vi.fn(function(args) { return args; }),
  GetObjectRetentionCommand: vi.fn(function(args) { return args; }),
  PutObjectLegalHoldCommand: vi.fn(function(args) { return args; }),
  GetObjectLegalHoldCommand: vi.fn(function(args) { return args; }),
  PutBucketMetricsConfigurationCommand: vi.fn(function(args) { return args; }),
  GetBucketMetricsConfigurationCommand: vi.fn(function(args) { return args; }),
  ListBucketMetricsConfigurationsCommand: vi.fn(function(args) { return args; }),
  DeleteBucketMetricsConfigurationCommand: vi.fn(function(args) { return args; }),
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

const unexpectedError = vi.hoisted(() => {
  const err = new Error("Unexpected");
  err.name = "InternalError";
  return err;
});

const notFoundByStatus = vi.hoisted(() => {
  const err = new Error("Not found");
  err.name = "S3ServiceException"; // name does NOT match the NoSuch* names — exercises the $metadata 404 branch
  (err as any).$metadata = { httpStatusCode: 404 };
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

async function post(path: string, body?: any) {
  return router.request(path, {
    method: "POST",
    body: body != null ? JSON.stringify(body) : undefined,
    headers: body != null ? { "content-type": "application/json" } : undefined,
  });
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

    it("GET /buckets/:name/tags — sparse response falls back to empty tags", async () => {
      const res = await get("/buckets/my-bucket/tags");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.tags).toEqual([]);
      expect(body.total).toBe(0);
    });

    it("GET /buckets/:name/tags — returns empty on 404 via metadata status", async () => {
      mockSend.mockRejectedValueOnce(notFoundByStatus);
      const res = await get("/buckets/my-bucket/tags");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.tags).toEqual([]);
      expect(body.total).toBe(0);
    });

    it("GET /buckets/:name/tags — throws on unexpected error", async () => {
      mockSend.mockRejectedValueOnce(unexpectedError);
      const res = await get("/buckets/my-bucket/tags");
      expect(res.status).toBe(500);
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

    it("GET /buckets/:name/policy — sparse response falls back to null policy", async () => {
      const res = await get("/buckets/my-bucket/policy");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.policy).toBeNull();
      expect(body.hasPolicy).toBe(false);
    });

    it("GET /buckets/:name/policy — returns null on 404 via metadata status", async () => {
      mockSend.mockRejectedValueOnce(notFoundByStatus);
      const res = await get("/buckets/my-bucket/policy");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.policy).toBeNull();
      expect(body.hasPolicy).toBe(false);
    });

    it("GET /buckets/:name/policy — throws on unexpected error", async () => {
      mockSend.mockRejectedValueOnce(unexpectedError);
      const res = await get("/buckets/my-bucket/policy");
      expect(res.status).toBe(500);
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

    it("PUT /buckets/:name/policy — 400 on invalid JSON policy", async () => {
      const res = await put("/buckets/my-bucket/policy", { policy: "not-json" });
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

    it("GET /buckets/:name/lifecycle — sparse response falls back to empty rules", async () => {
      const res = await get("/buckets/my-bucket/lifecycle");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.rules).toEqual([]);
      expect(body.total).toBe(0);
    });

    it("GET /buckets/:name/lifecycle — returns empty on 404 via metadata status", async () => {
      mockSend.mockRejectedValueOnce(notFoundByStatus);
      const res = await get("/buckets/my-bucket/lifecycle");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.rules).toEqual([]);
    });

    it("GET /buckets/:name/lifecycle — throws on unexpected error", async () => {
      mockSend.mockRejectedValueOnce(unexpectedError);
      const res = await get("/buckets/my-bucket/lifecycle");
      expect(res.status).toBe(500);
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

    it("GET /buckets/:name/lifecycle — handles rule with Filter Prefix", async () => {
      mockSend.mockResolvedValueOnce({ Rules: [{ ID: "expire", Status: "Enabled", Filter: { Prefix: "docs/" } }] });
      const res = await get("/buckets/my-bucket/lifecycle");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.rules[0].prefix).toBe("docs/");
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

    it("GET /buckets/:name/cors — sparse response falls back to empty rules", async () => {
      const res = await get("/buckets/my-bucket/cors");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.rules).toEqual([]);
      expect(body.total).toBe(0);
    });

    it("GET /buckets/:name/cors — throws on unexpected error", async () => {
      mockSend.mockRejectedValueOnce(unexpectedError);
      const res = await get("/buckets/my-bucket/cors");
      expect(res.status).toBe(500);
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

    it("GET /buckets/:name/website — sparse response falls back to nulls", async () => {
      const res = await get("/buckets/my-bucket/website");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.indexDocument).toBeNull();
      expect(body.errorDocument).toBeNull();
      expect(body.redirectAllRequestsTo).toBeNull();
      expect(body.routingRules).toEqual([]);
    });

    it("GET /buckets/:name/website — throws on unexpected error", async () => {
      mockSend.mockRejectedValueOnce(unexpectedError);
      const res = await get("/buckets/my-bucket/website");
      expect(res.status).toBe(500);
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

    it("PUT /buckets/:name/website — sets redirectAllRequestsTo only", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/buckets/my-bucket/website", {
        redirectAllRequestsTo: { Protocol: "https", HostName: "example.com" },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.WebsiteConfiguration.RedirectAllRequestsTo.HostName).toBe("example.com");
      expect(cmd.WebsiteConfiguration.IndexDocument).toBeUndefined();
      expect(cmd.WebsiteConfiguration.ErrorDocument).toBeUndefined();
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

    it("GET /buckets/:name/encryption — sparse response falls back to empty rules", async () => {
      const res = await get("/buckets/my-bucket/encryption");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.rules).toEqual([]);
      expect(body.configured).toBe(true);
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

    it("GET /buckets/:name/encryption — throws on unexpected error", async () => {
      mockSend.mockRejectedValueOnce(unexpectedError);
      const res = await get("/buckets/my-bucket/encryption");
      expect(res.status).toBe(500);
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

    it("PUT /buckets/:name/notifications — fills empty config arrays", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/buckets/my-bucket/notifications", {
        lambdaNotifications: [{ LambdaFunctionArn: "arn:aws:lambda:us-east-1:123:function:f", Events: ["s3:ObjectCreated:*"] }],
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.NotificationConfiguration.QueueConfigurations).toEqual([]);
      expect(cmd.NotificationConfiguration.TopicConfigurations).toEqual([]);
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

    it("GET /buckets/:name/public-access-block — sparse response falls back to all false", async () => {
      const res = await get("/buckets/my-bucket/public-access-block");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.configured).toBe(true);
      expect(body.blockPublicAcls).toBe(false);
      expect(body.ignorePublicAcls).toBe(false);
      expect(body.blockPublicPolicy).toBe(false);
      expect(body.restrictPublicBuckets).toBe(false);
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

    it("PUT /buckets/:name/public-access-block — defaults missing flags to false", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/buckets/my-bucket/public-access-block", {});
      expect(res.status).toBe(200);
      const cmd = mockSend.mock.calls[0][0];
      expect(cmd.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(false);
      expect(cmd.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(false);
      expect(cmd.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(false);
      expect(cmd.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(false);
    });

    it("GET /buckets/:name/public-access-block — throws on unexpected error", async () => {
      mockSend.mockRejectedValueOnce(unexpectedError);
      const res = await get("/buckets/my-bucket/public-access-block");
      expect(res.status).toBe(500);
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

    it("PUT /buckets/:name/logging — defaults targetPrefix to empty", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/buckets/my-bucket/logging", { targetBucket: "logs-bucket" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.targetPrefix).toBe("");
      expect(mockSend.mock.calls[0][0].BucketLoggingStatus.LoggingEnabled.TargetPrefix).toBe("");
    });
  });

  describe("Bucket ACL", () => {
    it("GET /buckets/:name/acl — returns grants and owner", async () => {
      mockSend.mockResolvedValueOnce({
        Owner: { ID: "owner1", DisplayName: "Owner Name" },
        Grants: [
          { Grantee: { Type: "CanonicalUser", ID: "owner1", DisplayName: "Owner Name" }, Permission: "FULL_CONTROL" },
          { Grantee: { Type: "Group", URI: "http://acs.amazonaws.com/groups/global/AllUsers" }, Permission: "READ" },
        ],
      });
      const res = await get("/buckets/my-bucket/acl");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.bucket).toBe("my-bucket");
      expect(body.owner.displayName).toBe("Owner Name");
      expect(body.grants).toHaveLength(2);
      expect(body.grants[0].permission).toBe("FULL_CONTROL");
      expect(body.totalGrants).toBe(2);
    });

    it("GET /buckets/:name/acl — handles empty grants", async () => {
      mockSend.mockResolvedValueOnce({ Grants: [] });
      const res = await get("/buckets/my-bucket/acl");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.grants).toEqual([]);
      expect(body.totalGrants).toBe(0);
    });

    it("GET /buckets/:name/acl — sparse response falls back to empty grants", async () => {
      const res = await get("/buckets/my-bucket/acl");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.grants).toEqual([]);
      expect(body.totalGrants).toBe(0);
      expect(body.owner).toBeNull();
    });

    it("GET /buckets/:name/acl — grant without Grantee maps to null", async () => {
      mockSend.mockResolvedValueOnce({ Grants: [{ Permission: "READ" }] });
      const res = await get("/buckets/my-bucket/acl");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.grants[0].grantee).toBeNull();
      expect(body.grants[0].permission).toBe("READ");
    });

    it("PUT /buckets/:name/acl — sets canned ACL", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/buckets/my-bucket/acl", { cannedAcl: "public-read" });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
      expect(body.cannedAcl).toBe("public-read");
    });

    it("PUT /buckets/:name/acl — 400 on invalid canned ACL", async () => {
      const res = await put("/buckets/my-bucket/acl", { cannedAcl: "invalid-acl" });
      expect(res.status).toBe(400);
    });

    it("PUT /buckets/:name/acl — sets grants", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/buckets/my-bucket/acl", {
        grants: [{ Grantee: { Type: "Group", URI: "http://acs.amazonaws.com/groups/global/AllUsers" }, Permission: "READ" }],
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
      expect(body.grants).toBe(1);
    });

    it("PUT /buckets/:name/acl — sets grants with owner", async () => {
      mockSend.mockResolvedValueOnce({});
      const res = await put("/buckets/my-bucket/acl", {
        owner: { ID: "owner1", DisplayName: "Owner" },
        grants: [{ Grantee: { Type: "CanonicalUser", ID: "owner1" }, Permission: "FULL_CONTROL" }],
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.updated).toBe(true);
      expect(body.grants).toBe(1);
      expect(mockSend.mock.calls[0][0].AccessControlPolicy.Owner.ID).toBe("owner1");
    });

    it("PUT /buckets/:name/acl — 400 when grants is not an array", async () => {
      const res = await put("/buckets/my-bucket/acl", { grants: "not-an-array", cannedAcl: null });
      expect(res.status).toBe(400);
    });

    it("PUT /buckets/:name/acl — 400 when no cannedAcl or grants", async () => {
      const res = await put("/buckets/my-bucket/acl", {});
      expect(res.status).toBe(400);
    });
  });

});

describe("Object Lock Configuration", () => {
  it("GET /buckets/:name/object-lock — returns config", async () => {
    mockSend.mockResolvedValueOnce({
      ObjectLockConfiguration: { ObjectLockEnabled: "Enabled", Rule: { DefaultRetention: { Mode: "COMPLIANCE", Days: 30 } } },
    });
    const res = await get("/buckets/my-bucket/object-lock");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.objectLockConfiguration.ObjectLockEnabled).toBe("Enabled");
  });

  it("GET /buckets/:name/object-lock — returns null on 404", async () => {
    const err404 = new Error("Not found");
    (err404 as any).$metadata = { httpStatusCode: 404 };
    mockSend.mockRejectedValueOnce(err404);
    const res = await get("/buckets/my-bucket/object-lock");
    const body = await res.json();
    expect(body.objectLockConfiguration).toBeNull();
  });

  it("PUT /buckets/:name/object-lock — sets config", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await put("/buckets/my-bucket/object-lock", {
      objectLockConfiguration: { ObjectLockEnabled: "Enabled", Rule: { DefaultRetention: { Mode: "COMPLIANCE", Days: 7 } } },
    });
    expect(res.status).toBe(200);
    expect((await res.json()).updated).toBe(true);
  });
});

describe("Object Retention", () => {
  it("GET /buckets/:name/objects/:key/retention — returns retention", async () => {
    mockSend.mockResolvedValueOnce({
      Retention: { Mode: "GOVERNANCE", RetainUntilDate: new Date("2025-12-31") },
    });
    const res = await get("/buckets/my-bucket/objects/file.txt/retention");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.retention.Mode).toBe("GOVERNANCE");
  });

  it("PUT /buckets/:name/objects/:key/retention — sets retention", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await put("/buckets/my-bucket/objects/file.txt/retention", {
      retention: { Mode: "COMPLIANCE", RetainUntilDate: "2025-12-31T00:00:00Z" },
    });
    expect(res.status).toBe(200);
    expect((await res.json()).updated).toBe(true);
  });
});

describe("Object Legal Hold", () => {
  it("GET /buckets/:name/objects/:key/legal-hold — returns hold", async () => {
    mockSend.mockResolvedValueOnce({ LegalHold: { Status: "ON" } });
    const res = await get("/buckets/my-bucket/objects/file.txt/legal-hold");
    expect(res.status).toBe(200);
    expect((await res.json()).legalHold.Status).toBe("ON");
  });

  it("PUT /buckets/:name/objects/:key/legal-hold — sets hold", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await put("/buckets/my-bucket/objects/file.txt/legal-hold", {
      legalHold: { Status: "OFF" },
    });
    expect(res.status).toBe(200);
    expect((await res.json()).updated).toBe(true);
  });
});

describe("Bucket Metrics Configuration", () => {
  it("GET /buckets/:name/metrics — lists configs", async () => {
    mockSend.mockResolvedValueOnce({
      MetricsConfigurationList: [{ Id: "config-1" }, { Id: "config-2" }],
      IsTruncated: false,
    });
    const res = await get("/buckets/my-bucket/metrics");
    const body = await res.json();
    expect(body.total).toBe(2);
  });

  it("GET /buckets/:name/metrics?id=x — gets single config", async () => {
    mockSend.mockResolvedValueOnce({
      MetricsConfiguration: { Id: "config-1" },
    });
    const res = await get("/buckets/my-bucket/metrics?id=config-1");
    const body = await res.json();
    expect(body.metricsConfiguration.Id).toBe("config-1");
  });

  it("POST /buckets/:name/metrics — creates config", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/buckets/my-bucket/metrics", { id: "config-1", metricsConfiguration: { Prefix: "logs/" } });
    expect(res.status).toBe(201);
    expect((await res.json()).created).toBe(true);
  });

  it("POST /buckets/:name/metrics — 400 without id", async () => {
    const res = await post("/buckets/my-bucket/metrics", {});
    expect(res.status).toBe(400);
  });

  it("DELETE /buckets/:name/metrics/:id — deletes config", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await del("/buckets/my-bucket/metrics/config-1");
    expect(res.status).toBe(200);
    expect((await res.json()).deleted).toBe(true);
  });

  it("GET /buckets/:name/object-lock — returns null config when sparse", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/buckets/my-bucket/object-lock");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ objectLockConfiguration: null });
  });

  it("GET /buckets/:name/objects/:key/retention — returns null retention when sparse", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/buckets/my-bucket/objects/file.txt/retention");
    expect(await res.json()).toEqual({ retention: null });
  });

  it("GET /buckets/:name/objects/:key/legal-hold — returns null hold when sparse", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/buckets/my-bucket/objects/file.txt/legal-hold");
    expect(await res.json()).toEqual({ legalHold: null });
  });

  it("GET /buckets/:name/object-lock — rethrows non-404 errors", async () => {
    mockSend.mockRejectedValueOnce(Object.assign(new Error("boom"), { $metadata: { httpStatusCode: 500 } }));
    const res = await get("/buckets/my-bucket/object-lock");
    expect(res.status).toBe(500);
  });

  it("GET /buckets/:name/objects/:key/retention — returns null on 404", async () => {
    mockSend.mockRejectedValueOnce(Object.assign(new Error("nope"), { $metadata: { httpStatusCode: 404 } }));
    const res = await get("/buckets/my-bucket/objects/file.txt/retention");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ retention: null });
  });

  it("GET /buckets/:name/objects/:key/retention — rethrows non-404 errors", async () => {
    mockSend.mockRejectedValueOnce(Object.assign(new Error("boom"), { $metadata: { httpStatusCode: 500 } }));
    const res = await get("/buckets/my-bucket/objects/file.txt/retention");
    expect(res.status).toBe(500);
  });

  it("GET /buckets/:name/objects/:key/legal-hold — returns null on 404", async () => {
    mockSend.mockRejectedValueOnce(Object.assign(new Error("nope"), { $metadata: { httpStatusCode: 404 } }));
    const res = await get("/buckets/my-bucket/objects/file.txt/legal-hold");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ legalHold: null });
  });

  it("GET /buckets/:name/objects/:key/legal-hold — rethrows non-404 errors", async () => {
    mockSend.mockRejectedValueOnce(Object.assign(new Error("boom"), { $metadata: { httpStatusCode: 500 } }));
    const res = await get("/buckets/my-bucket/objects/file.txt/legal-hold");
    expect(res.status).toBe(500);
  });

  it("GET /buckets/:name/metrics?id=x — returns null config when missing", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/buckets/my-bucket/metrics?id=missing");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ metricsConfiguration: null });
  });

  it("GET /buckets/:name/metrics — empty list defaults", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await get("/buckets/my-bucket/metrics");
    const body = await res.json();
    expect(body).toEqual({ metricsConfigurations: [], continuationToken: undefined, isTruncated: undefined, total: 0 });
  });

  it("POST /buckets/:name/metrics — defaults metricsConfiguration", async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await post("/buckets/my-bucket/metrics", { id: "cfg" });
    expect(res.status).toBe(201);
    expect(mockSend.mock.calls[0][0].MetricsConfiguration).toEqual({});
  });
});
