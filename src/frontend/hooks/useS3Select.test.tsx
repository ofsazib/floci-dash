// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useS3Select } from "./useS3Select";

vi.mock("../lib/client", () => ({
  api: vi.fn(),
}));

import { api } from "../lib/client";

const mockApi = api as ReturnType<typeof vi.fn>;

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

describe("useS3Select", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls the correct URL when bucket is provided", async () => {
    mockApi.mockResolvedValueOnce({
      result: "name,age\nAlice,30\n",
      stats: { bytesScanned: 100, bytesProcessed: 100, bytesReturned: 50 },
    });

    const { result } = renderHook(() => useS3Select("my-bucket"), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      key: "test.csv",
      expression: "SELECT * FROM S3Object LIMIT 10",
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApi).toHaveBeenCalledWith("/aws/s3/buckets/my-bucket/select", {
      method: "POST",
      body: JSON.stringify({
        key: "test.csv",
        expression: "SELECT * FROM S3Object LIMIT 10",
      }),
    });
  });

  it("includes inputType when specified", async () => {
    mockApi.mockResolvedValueOnce({
      result: '{"name":"Alice"}\n',
      stats: null,
    });

    const { result } = renderHook(() => useS3Select("my-bucket"), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      key: "data.json",
      expression: "SELECT * FROM S3Object s",
      inputType: "JSON",
      outputFormat: "JSON",
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApi).toHaveBeenCalledWith("/aws/s3/buckets/my-bucket/select", {
      method: "POST",
      body: JSON.stringify({
        key: "data.json",
        expression: "SELECT * FROM S3Object s",
        inputType: "JSON",
        outputFormat: "JSON",
      }),
    });
  });

  it("includes fileHeaderInfo when specified", async () => {
    mockApi.mockResolvedValueOnce({
      result: "",
      stats: { bytesScanned: 50, bytesProcessed: 50, bytesReturned: 0 },
    });

    const { result } = renderHook(() => useS3Select("my-bucket"), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      key: "data.csv",
      expression: "SELECT name FROM S3Object WHERE age > 30",
      fileHeaderInfo: "USE",
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApi).toHaveBeenCalledWith("/aws/s3/buckets/my-bucket/select", {
      method: "POST",
      body: JSON.stringify({
        key: "data.csv",
        expression: "SELECT name FROM S3Object WHERE age > 30",
        fileHeaderInfo: "USE",
      }),
    });
  });

  it("returns error state on failure", async () => {
    mockApi.mockRejectedValueOnce(new Error("Query failed"));

    const { result } = renderHook(() => useS3Select("my-bucket"), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      key: "test.csv",
      expression: "SELECT * FROM S3Object",
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });

  it("returns loading state while mutating", async () => {
    mockApi.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ result: "ok", stats: null }), 100))
    );

    const { result } = renderHook(() => useS3Select("my-bucket"), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      key: "test.csv",
      expression: "SELECT * FROM S3Object",
    });

    await waitFor(() => expect(result.current.isPending).toBe(true));
  });

  it("allows bucket to be null (mutation not enabled until called)", () => {
    const { result } = renderHook(() => useS3Select(null as any), {
      wrapper: createWrapper(),
    });

    // Mutations can be called even with null bucket - just passes to URL
    expect(result.current.isIdle).toBe(true);
  });
});
