// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createWrapper } from "../../test/helpers";

const mockApi = vi.fn();
vi.mock("../lib/client", () => ({
  api: (...args: any[]) => mockApi(...args),
}));

import {
  useS3TableBuckets,
  useCreateS3TableBucket,
  useDeleteS3TableBucket,
  useS3TableNamespaces,
  useCreateS3TableNamespace,
  useDeleteS3TableNamespace,
  useS3Tables,
  useCreateS3Table,
  useDeleteS3Table,
} from "./useS3Tables";

const ARN = "arn:aws:s3tables:us-east-1:123:bucket/b1";
const ENC = encodeURIComponent(ARN);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("S3 Tables hooks", () => {
  it("useS3TableBuckets fetches", async () => {
    mockApi.mockResolvedValueOnce({ buckets: [], total: 0, nextToken: null });
    const { result } = renderHook(() => useS3TableBuckets(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/s3tables/buckets");
  });

  it("useCreateS3TableBucket posts name", async () => {
    mockApi.mockResolvedValueOnce({ arn: "a" });
    const { result } = renderHook(() => useCreateS3TableBucket(), {
      wrapper: createWrapper(),
    });
    result.current.mutate("b1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/s3tables/buckets", {
      method: "POST",
      body: JSON.stringify({ name: "b1" }),
    });
  });

  it("useDeleteS3TableBucket deletes encoded arn", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteS3TableBucket(), {
      wrapper: createWrapper(),
    });
    result.current.mutate(ARN);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(`/aws/s3tables/buckets/${ENC}`, {
      method: "DELETE",
    });
  });

  it("useS3TableNamespaces gated + encoded", async () => {
    mockApi.mockResolvedValueOnce({ namespaces: [], total: 0 });
    const { result } = renderHook(() => useS3TableNamespaces(ARN), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(`/aws/s3tables/namespaces/${ENC}`);

    const idle = renderHook(() => useS3TableNamespaces(null), { wrapper: createWrapper() });
    expect(idle.result.current.fetchStatus).toBe("idle");
  });

  it("useCreateS3TableNamespace posts", async () => {
    mockApi.mockResolvedValueOnce({ namespace: ["n"] });
    const { result } = renderHook(() => useCreateS3TableNamespace(ARN), {
      wrapper: createWrapper(),
    });
    result.current.mutate("ns1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(`/aws/s3tables/namespaces/${ENC}`, {
      method: "POST",
      body: JSON.stringify({ namespace: "ns1" }),
    });
  });

  it("useDeleteS3TableNamespace deletes nested path", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteS3TableNamespace(ARN), {
      wrapper: createWrapper(),
    });
    result.current.mutate("ns 1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/s3tables/namespaces/${ENC}/ns%201`,
      { method: "DELETE" }
    );
  });

  it("useS3Tables gated on bucket+namespace", async () => {
    mockApi.mockResolvedValueOnce({ tables: [], total: 0 });
    const { result } = renderHook(() => useS3Tables(ARN, "ns1"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(`/aws/s3tables/tables/${ENC}/ns1`);

    const idle = renderHook(() => useS3Tables(ARN, null), { wrapper: createWrapper() });
    expect(idle.result.current.fetchStatus).toBe("idle");
    const idle2 = renderHook(() => useS3Tables(null, "ns1"), { wrapper: createWrapper() });
    expect(idle2.result.current.fetchStatus).toBe("idle");
  });

  it("useCreateS3Table posts body", async () => {
    mockApi.mockResolvedValueOnce({ tableArn: "arn:t" });
    const { result } = renderHook(() => useCreateS3Table(ARN, "ns1"), {
      wrapper: createWrapper(),
    });
    result.current.mutate({ name: "t1", format: "ICEBERG" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(`/aws/s3tables/tables/${ENC}/ns1`, {
      method: "POST",
      body: JSON.stringify({ name: "t1", format: "ICEBERG" }),
    });
  });

  it("useDeleteS3Table deletes triple path", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteS3Table(ARN, "ns1"), {
      wrapper: createWrapper(),
    });
    result.current.mutate("t 1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/s3tables/tables/${ENC}/ns1/t%201`,
      { method: "DELETE" }
    );
  });
});
