// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const mockApi = vi.fn();
vi.mock("../lib/client", () => ({
  api: (...args: any[]) => mockApi(...args),
}));

import {
  useS3BucketVersioning,
  useS3UpdateVersioning,
  useS3BucketTags,
  useS3UpdateBucketTags,
  useS3DeleteBucketTags,
  useS3BucketPolicy,
  useS3UpdateBucketPolicy,
  useS3DeleteBucketPolicy,
  useS3BucketLifecycle,
  useS3UpdateBucketLifecycle,
  useS3DeleteBucketLifecycle,
  useS3BucketCors,
  useS3UpdateBucketCors,
  useS3DeleteBucketCors,
  useS3BucketWebsite,
  useS3UpdateBucketWebsite,
  useS3DeleteBucketWebsite,
  useS3BucketEncryption,
  useS3UpdateBucketEncryption,
  useS3DeleteBucketEncryption,
  useS3BucketNotifications,
  useS3UpdateBucketNotifications,
  useS3PublicAccessBlock,
  useS3UpdatePublicAccessBlock,
  useS3DeletePublicAccessBlock,
  useS3BucketLogging,
  useS3UpdateBucketLogging,
  useS3ObjectTags,
  useS3UpdateObjectTags,
  useS3DeleteObjectTags,
  useS3ObjectAttributes,
  useS3HeadBucket,
} from "./useS3Config";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

const BUCKET = "my-bucket";
const KEY = "path/to/object.txt";
const ENCODED_KEY = encodeURIComponent(KEY);

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

// ─── Versioning ───────────────────────────────────────────────────

describe("useS3BucketVersioning", () => {
  it("does not call api when bucket is null", async () => {
    const { result } = renderHook(() => useS3BucketVersioning(null), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with correct URL when bucket is provided", async () => {
    mockApi.mockResolvedValueOnce({ bucket: BUCKET, status: "Enabled", mfaDelete: "Disabled" });
    const { result } = renderHook(() => useS3BucketVersioning(BUCKET), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(`/aws/s3/buckets/${BUCKET}/versioning`);
  });
});

describe("useS3UpdateVersioning", () => {
  it("calls api with PUT method and serialized status", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useS3UpdateVersioning(BUCKET), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync("Enabled");
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/s3/buckets/${BUCKET}/versioning`,
      expect.objectContaining({ method: "PUT", body: JSON.stringify({ status: "Enabled" }) }),
    );
  });
});

// ─── Bucket Tags ──────────────────────────────────────────────────

describe("useS3BucketTags", () => {
  it("does not call api when bucket is null", async () => {
    const { result } = renderHook(() => useS3BucketTags(null), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with correct URL when bucket is provided", async () => {
    mockApi.mockResolvedValueOnce({ bucket: BUCKET, tags: [], total: 0 });
    const { result } = renderHook(() => useS3BucketTags(BUCKET), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(`/aws/s3/buckets/${BUCKET}/tags`);
  });
});

describe("useS3UpdateBucketTags", () => {
  it("calls api with PUT method and wrapped tags", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useS3UpdateBucketTags(BUCKET), {
      wrapper: createWrapper(),
    });
    const tags = [{ Key: "env", Value: "prod" }];
    await result.current.mutateAsync(tags);
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/s3/buckets/${BUCKET}/tags`,
      expect.objectContaining({ method: "PUT", body: JSON.stringify({ tags }) }),
    );
  });
});

describe("useS3DeleteBucketTags", () => {
  it("calls api with DELETE method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useS3DeleteBucketTags(BUCKET), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync();
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/s3/buckets/${BUCKET}/tags`,
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

// ─── Bucket Policy ────────────────────────────────────────────────

describe("useS3BucketPolicy", () => {
  it("does not call api when bucket is null", async () => {
    const { result } = renderHook(() => useS3BucketPolicy(null), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with correct URL when bucket is provided", async () => {
    mockApi.mockResolvedValueOnce({ bucket: BUCKET, policy: null, hasPolicy: false });
    const { result } = renderHook(() => useS3BucketPolicy(BUCKET), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(`/aws/s3/buckets/${BUCKET}/policy`);
  });
});

describe("useS3UpdateBucketPolicy", () => {
  it("calls api with PUT method and wrapped policy", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useS3UpdateBucketPolicy(BUCKET), {
      wrapper: createWrapper(),
    });
    const policy = { Version: "2012-10-17" };
    await result.current.mutateAsync(policy);
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/s3/buckets/${BUCKET}/policy`,
      expect.objectContaining({ method: "PUT", body: JSON.stringify({ policy }) }),
    );
  });
});

describe("useS3DeleteBucketPolicy", () => {
  it("calls api with DELETE method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useS3DeleteBucketPolicy(BUCKET), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync();
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/s3/buckets/${BUCKET}/policy`,
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

// ─── Bucket Lifecycle ─────────────────────────────────────────────

describe("useS3BucketLifecycle", () => {
  it("does not call api when bucket is null", async () => {
    const { result } = renderHook(() => useS3BucketLifecycle(null), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with correct URL when bucket is provided", async () => {
    mockApi.mockResolvedValueOnce({ bucket: BUCKET, rules: [], total: 0 });
    const { result } = renderHook(() => useS3BucketLifecycle(BUCKET), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(`/aws/s3/buckets/${BUCKET}/lifecycle`);
  });
});

describe("useS3UpdateBucketLifecycle", () => {
  it("calls api with PUT method and wrapped rules", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useS3UpdateBucketLifecycle(BUCKET), {
      wrapper: createWrapper(),
    });
    const rules = [{ id: "r1", status: "Enabled" }];
    await result.current.mutateAsync(rules);
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/s3/buckets/${BUCKET}/lifecycle`,
      expect.objectContaining({ method: "PUT", body: JSON.stringify({ rules }) }),
    );
  });
});

describe("useS3DeleteBucketLifecycle", () => {
  it("calls api with DELETE method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useS3DeleteBucketLifecycle(BUCKET), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync();
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/s3/buckets/${BUCKET}/lifecycle`,
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

// ─── Bucket CORS ──────────────────────────────────────────────────

describe("useS3BucketCors", () => {
  it("does not call api when bucket is null", async () => {
    const { result } = renderHook(() => useS3BucketCors(null), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with correct URL when bucket is provided", async () => {
    mockApi.mockResolvedValueOnce({ bucket: BUCKET, rules: [], total: 0 });
    const { result } = renderHook(() => useS3BucketCors(BUCKET), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(`/aws/s3/buckets/${BUCKET}/cors`);
  });
});

describe("useS3UpdateBucketCors", () => {
  it("calls api with PUT method and wrapped rules", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useS3UpdateBucketCors(BUCKET), {
      wrapper: createWrapper(),
    });
    const rules = [{ AllowedMethods: ["GET"], AllowedOrigins: ["*"] }];
    await result.current.mutateAsync(rules);
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/s3/buckets/${BUCKET}/cors`,
      expect.objectContaining({ method: "PUT", body: JSON.stringify({ rules }) }),
    );
  });
});

describe("useS3DeleteBucketCors", () => {
  it("calls api with DELETE method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useS3DeleteBucketCors(BUCKET), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync();
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/s3/buckets/${BUCKET}/cors`,
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

// ─── Bucket Website ───────────────────────────────────────────────

describe("useS3BucketWebsite", () => {
  it("does not call api when bucket is null", async () => {
    const { result } = renderHook(() => useS3BucketWebsite(null), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with correct URL when bucket is provided", async () => {
    mockApi.mockResolvedValueOnce({
      bucket: BUCKET,
      indexDocument: null,
      errorDocument: null,
      redirectAllRequestsTo: null,
      routingRules: [],
      configured: false,
    });
    const { result } = renderHook(() => useS3BucketWebsite(BUCKET), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(`/aws/s3/buckets/${BUCKET}/website`);
  });
});

describe("useS3UpdateBucketWebsite", () => {
  it("calls api with PUT method and serialized config", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useS3UpdateBucketWebsite(BUCKET), {
      wrapper: createWrapper(),
    });
    const config = { indexDocument: "index.html" };
    await result.current.mutateAsync(config);
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/s3/buckets/${BUCKET}/website`,
      expect.objectContaining({ method: "PUT", body: JSON.stringify(config) }),
    );
  });
});

describe("useS3DeleteBucketWebsite", () => {
  it("calls api with DELETE method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useS3DeleteBucketWebsite(BUCKET), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync();
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/s3/buckets/${BUCKET}/website`,
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

// ─── Bucket Encryption ────────────────────────────────────────────

describe("useS3BucketEncryption", () => {
  it("does not call api when bucket is null", async () => {
    const { result } = renderHook(() => useS3BucketEncryption(null), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with correct URL when bucket is provided", async () => {
    mockApi.mockResolvedValueOnce({ bucket: BUCKET, rules: [], configured: false });
    const { result } = renderHook(() => useS3BucketEncryption(BUCKET), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(`/aws/s3/buckets/${BUCKET}/encryption`);
  });
});

describe("useS3UpdateBucketEncryption", () => {
  it("calls api with PUT method and serialized sseAlgorithm", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useS3UpdateBucketEncryption(BUCKET), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync("AES256");
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/s3/buckets/${BUCKET}/encryption`,
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ sseAlgorithm: "AES256" }),
      }),
    );
  });
});

describe("useS3DeleteBucketEncryption", () => {
  it("calls api with DELETE method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useS3DeleteBucketEncryption(BUCKET), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync();
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/s3/buckets/${BUCKET}/encryption`,
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

// ─── Bucket Notifications ─────────────────────────────────────────

describe("useS3BucketNotifications", () => {
  it("does not call api when bucket is null", async () => {
    const { result } = renderHook(() => useS3BucketNotifications(null), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with correct URL when bucket is provided", async () => {
    mockApi.mockResolvedValueOnce({
      bucket: BUCKET,
      lambdaNotifications: [],
      sqsNotifications: [],
      snsNotifications: [],
      total: 0,
    });
    const { result } = renderHook(() => useS3BucketNotifications(BUCKET), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(`/aws/s3/buckets/${BUCKET}/notifications`);
  });
});

describe("useS3UpdateBucketNotifications", () => {
  it("calls api with PUT method and serialized config", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useS3UpdateBucketNotifications(BUCKET), {
      wrapper: createWrapper(),
    });
    const config = { sqsNotifications: [] };
    await result.current.mutateAsync(config);
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/s3/buckets/${BUCKET}/notifications`,
      expect.objectContaining({ method: "PUT", body: JSON.stringify(config) }),
    );
  });
});

// ─── Public Access Block ──────────────────────────────────────────

describe("useS3PublicAccessBlock", () => {
  it("does not call api when bucket is null", async () => {
    const { result } = renderHook(() => useS3PublicAccessBlock(null), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with correct URL when bucket is provided", async () => {
    mockApi.mockResolvedValueOnce({
      bucket: BUCKET,
      blockPublicAcls: false,
      ignorePublicAcls: false,
      blockPublicPolicy: false,
      restrictPublicBuckets: false,
      configured: false,
    });
    const { result } = renderHook(() => useS3PublicAccessBlock(BUCKET), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(`/aws/s3/buckets/${BUCKET}/public-access-block`);
  });
});

describe("useS3UpdatePublicAccessBlock", () => {
  it("calls api with PUT method and serialized config", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useS3UpdatePublicAccessBlock(BUCKET), {
      wrapper: createWrapper(),
    });
    const config = { blockPublicAcls: true };
    await result.current.mutateAsync(config);
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/s3/buckets/${BUCKET}/public-access-block`,
      expect.objectContaining({ method: "PUT", body: JSON.stringify(config) }),
    );
  });
});

describe("useS3DeletePublicAccessBlock", () => {
  it("calls api with DELETE method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useS3DeletePublicAccessBlock(BUCKET), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync();
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/s3/buckets/${BUCKET}/public-access-block`,
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

// ─── Bucket Logging ───────────────────────────────────────────────

describe("useS3BucketLogging", () => {
  it("does not call api when bucket is null", async () => {
    const { result } = renderHook(() => useS3BucketLogging(null), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with correct URL when bucket is provided", async () => {
    mockApi.mockResolvedValueOnce({
      bucket: BUCKET,
      targetBucket: null,
      targetPrefix: null,
      enabled: false,
    });
    const { result } = renderHook(() => useS3BucketLogging(BUCKET), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(`/aws/s3/buckets/${BUCKET}/logging`);
  });
});

describe("useS3UpdateBucketLogging", () => {
  it("calls api with PUT method and serialized config", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useS3UpdateBucketLogging(BUCKET), {
      wrapper: createWrapper(),
    });
    const config = { targetBucket: "logs", targetPrefix: "log/" };
    await result.current.mutateAsync(config);
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/s3/buckets/${BUCKET}/logging`,
      expect.objectContaining({ method: "PUT", body: JSON.stringify(config) }),
    );
  });
});

// ─── Object Tags ──────────────────────────────────────────────────

describe("useS3ObjectTags", () => {
  it("does not call api when bucket is null", async () => {
    const { result } = renderHook(() => useS3ObjectTags(null, KEY), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("does not call api when key is null", async () => {
    const { result } = renderHook(() => useS3ObjectTags(BUCKET, null), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with correct URL when bucket and key are provided", async () => {
    mockApi.mockResolvedValueOnce({ bucket: BUCKET, key: KEY, tags: [], total: 0 });
    const { result } = renderHook(() => useS3ObjectTags(BUCKET, KEY), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/s3/buckets/${BUCKET}/objects/${ENCODED_KEY}/tags`,
    );
  });
});

describe("useS3UpdateObjectTags", () => {
  it("calls api with PUT method and wrapped tags", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useS3UpdateObjectTags(BUCKET, KEY), {
      wrapper: createWrapper(),
    });
    const tags = [{ Key: "k", Value: "v" }];
    await result.current.mutateAsync(tags);
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/s3/buckets/${BUCKET}/objects/${ENCODED_KEY}/tags`,
      expect.objectContaining({ method: "PUT", body: JSON.stringify({ tags }) }),
    );
  });
});

describe("useS3DeleteObjectTags", () => {
  it("calls api with DELETE method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useS3DeleteObjectTags(BUCKET, KEY), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync();
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/s3/buckets/${BUCKET}/objects/${ENCODED_KEY}/tags`,
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

// ─── Object Attributes ────────────────────────────────────────────

describe("useS3ObjectAttributes", () => {
  it("does not call api when bucket is null", async () => {
    const { result } = renderHook(() => useS3ObjectAttributes(null, KEY), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("does not call api when key is null", async () => {
    const { result } = renderHook(() => useS3ObjectAttributes(BUCKET, null), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with correct URL when bucket and key are provided", async () => {
    mockApi.mockResolvedValueOnce({ bucket: BUCKET, key: KEY });
    const { result } = renderHook(() => useS3ObjectAttributes(BUCKET, KEY), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/s3/buckets/${BUCKET}/objects/${ENCODED_KEY}/attributes`,
    );
  });
});

// ─── Head Bucket ──────────────────────────────────────────────────

describe("useS3HeadBucket", () => {
  it("does not call api when bucket is null", async () => {
    const { result } = renderHook(() => useS3HeadBucket(null), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with correct URL when bucket is provided", async () => {
    mockApi.mockResolvedValueOnce({ bucket: BUCKET, exists: true });
    const { result } = renderHook(() => useS3HeadBucket(BUCKET), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(`/aws/s3/buckets/${BUCKET}`);
  });
});
