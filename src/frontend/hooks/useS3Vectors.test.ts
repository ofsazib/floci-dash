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
  useS3VectorsBuckets,
  useS3VectorsBucket,
  useS3VectorsCreateBucket,
  useS3VectorsDeleteBucket,
  useS3VectorsIndexes,
  useS3VectorsCreateIndex,
  useS3VectorsDeleteIndex,
  useS3VectorsQuery,
} from "./useS3Vectors";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

describe("useS3VectorsBuckets", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ buckets: [], total: 0 });
    const { result } = renderHook(() => useS3VectorsBuckets(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/s3vectors/buckets");
  });

  it("forwards error", async () => {
    mockApi.mockRejectedValueOnce(new Error("fail"));
    const { result } = renderHook(() => useS3VectorsBuckets(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useS3VectorsBucket", () => {
  it("calls api with correct URL when bucketName is provided", async () => {
    mockApi.mockResolvedValueOnce({ bucket: { vectorBucketName: "b1" } });
    const { result } = renderHook(() => useS3VectorsBucket("b1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/s3vectors/buckets/b1");
  });

  it("does NOT call api when bucketName is null", () => {
    renderHook(() => useS3VectorsBucket(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });
});

describe("useS3VectorsCreateBucket", () => {
  it("sends POST with correct body", async () => {
    mockApi.mockResolvedValueOnce({ bucket: { vectorBucketArn: "arn:test" } });
    const { result } = renderHook(() => useS3VectorsCreateBucket(), { wrapper: createWrapper() });
    result.current.mutate({ vectorBucketName: "bucket1" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/s3vectors/buckets", {
      method: "POST",
      body: JSON.stringify({ vectorBucketName: "bucket1" }),
    });
  });
});

describe("useS3VectorsDeleteBucket", () => {
  it("sends DELETE with bucket name", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useS3VectorsDeleteBucket(), { wrapper: createWrapper() });
    result.current.mutate("bucket1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/s3vectors/buckets/bucket1", { method: "DELETE" });
  });
});

describe("useS3VectorsIndexes", () => {
  it("calls api with correct URL when bucketName is provided", async () => {
    mockApi.mockResolvedValueOnce({ indexes: [], total: 0 });
    const { result } = renderHook(() => useS3VectorsIndexes("b1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/s3vectors/buckets/b1/indexes");
  });

  it("does NOT call api when bucketName is null", () => {
    renderHook(() => useS3VectorsIndexes(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });
});

describe("useS3VectorsCreateIndex", () => {
  it("sends POST with correct body", async () => {
    mockApi.mockResolvedValueOnce({ index: { indexArn: "arn:test" } });
    const { result } = renderHook(() => useS3VectorsCreateIndex(), { wrapper: createWrapper() });
    result.current.mutate({ bucketName: "b1", indexName: "idx1", dimension: 128 });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/s3vectors/buckets/b1/indexes", {
      method: "POST",
      body: JSON.stringify({ indexName: "idx1", dimension: 128, dataType: undefined, distanceMetric: undefined }),
    });
  });
});

describe("useS3VectorsDeleteIndex", () => {
  it("sends DELETE with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useS3VectorsDeleteIndex(), { wrapper: createWrapper() });
    result.current.mutate({ bucketName: "b1", indexName: "idx1" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/s3vectors/buckets/b1/indexes/idx1", { method: "DELETE" });
  });
});

describe("useS3VectorsQuery", () => {
  it("sends POST with correct body", async () => {
    mockApi.mockResolvedValueOnce({ vectors: [], distanceMetric: "cosine" });
    const { result } = renderHook(() => useS3VectorsQuery(), { wrapper: createWrapper() });
    result.current.mutate({
      bucketName: "b1",
      indexName: "idx1",
      queryVector: [0.1, 0.2],
      topK: 5,
      returnMetadata: true,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/s3vectors/buckets/b1/indexes/idx1/query", {
      method: "POST",
      body: JSON.stringify({
        queryVector: [0.1, 0.2],
        topK: 5,
        filter: undefined,
        returnMetadata: true,
      }),
    });
  });
});
