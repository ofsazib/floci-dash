// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const mockApi = vi.fn();
vi.mock("../lib/client", () => ({
  api: (...args: any[]) => mockApi(...args),
}));

import {
  useS3Buckets,
  useS3Objects,
  useS3ObjectDetail,
  useS3CreateBucket,
  useS3DeleteBucket,
  useS3UploadFiles,
  useS3DeleteObject,
  useS3CreateFolder,
  useS3BatchDeleteObjects,
  useS3DeleteFolder,
} from "./useS3";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

// ─── BUCKETS ─────────────────────────────────────────────

describe("useS3Buckets", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ buckets: [], total: 0 });
    const { result } = renderHook(() => useS3Buckets(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/s3/buckets");
  });

  it("forwards error", async () => {
    mockApi.mockRejectedValueOnce(new Error("fail"));
    const { result } = renderHook(() => useS3Buckets(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// ─── OBJECTS ─────────────────────────────────────────────

describe("useS3Objects", () => {
  it("does NOT call api when bucket is null", () => {
    renderHook(() => useS3Objects(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with bucket in path when provided", async () => {
    mockApi.mockResolvedValueOnce({ bucket: "b", objects: [], total: 0 });
    const { result } = renderHook(() => useS3Objects("my-bucket"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/s3/buckets/my-bucket/objects");
  });
});

describe("useS3ObjectDetail", () => {
  it("does NOT call api when bucket is null", () => {
    renderHook(() => useS3ObjectDetail(null, "key"), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("does NOT call api when key is null", () => {
    renderHook(() => useS3ObjectDetail("b", null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with bucket + encoded key in path when both provided", async () => {
    mockApi.mockResolvedValueOnce({
      bucket: "b",
      key: "k",
      contentType: "text/plain",
      size: 1,
      lastModified: "now",
      etag: "e",
      body: "",
      bodyEncoding: "utf-8",
    });
    const { result } = renderHook(() => useS3ObjectDetail("my-bucket", "a b/c"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/s3/buckets/my-bucket/objects/${encodeURIComponent("a b/c")}`
    );
  });
});

// ─── BUCKET MUTATIONS ────────────────────────────────────

describe("useS3CreateBucket", () => {
  it("calls api with POST method and serialized body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useS3CreateBucket(), { wrapper: createWrapper() });
    await result.current.mutateAsync("my-bucket");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/s3/buckets",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "my-bucket" }),
      })
    );
  });
});

describe("useS3DeleteBucket", () => {
  it("calls api with DELETE method and name in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useS3DeleteBucket(), { wrapper: createWrapper() });
    await result.current.mutateAsync("my-bucket");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/s3/buckets/my-bucket",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

// ─── OBJECT MUTATIONS ────────────────────────────────────

describe("useS3DeleteObject", () => {
  it("calls api with DELETE method, bucket + encoded key in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useS3DeleteObject("my-bucket"), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync("a b/c");
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/s3/buckets/my-bucket/objects/${encodeURIComponent("a b/c")}`,
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

// ─── UPLOAD (uses fetch directly, not api()) ─────────────

describe("useS3UploadFiles", () => {
  const realFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = realFetch;
  });

  it("POSTs FormData to upload endpoint and parses JSON on success", async () => {
    const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ bucket: "b", prefix: "", uploaded: 1, failed: 0, results: [] }),
    } as Response);
    const { result } = renderHook(() => useS3UploadFiles("my-bucket"), {
      wrapper: createWrapper(),
    });
    const file = new File(["hello"], "hello.txt", { type: "text/plain" });
    const res = await result.current.mutateAsync({ files: [file] });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/aws/s3/buckets/my-bucket/objects/upload");
    expect(init).toEqual(
      expect.objectContaining({ method: "POST", body: expect.any(FormData) })
    );
    expect(res.uploaded).toBe(1);
  });

  it("appends prefix as encoded query string when provided", async () => {
    const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ bucket: "b", prefix: "p", uploaded: 0, failed: 0, results: [] }),
    } as Response);
    const { result } = renderHook(() => useS3UploadFiles("my-bucket"), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({ files: [], prefix: "a/b" });
    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe(
      `/api/aws/s3/buckets/my-bucket/objects/upload?prefix=${encodeURIComponent("a/b")}`
    );
  });

  it("throws with server-provided error message on failure", async () => {
    const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce({
      ok: false,
      statusText: "Bad Request",
      json: async () => ({ error: "too big" }),
    } as Response);
    const { result } = renderHook(() => useS3UploadFiles("my-bucket"), {
      wrapper: createWrapper(),
    });
    await expect(
      result.current.mutateAsync({ files: [] })
    ).rejects.toThrow("too big");
  });

  it("falls back to statusText when server body has no error field", async () => {
    const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>;
    fetchMock.mockResolvedValueOnce({
      ok: false,
      statusText: "Internal Server Error",
      json: async () => ({}),
    } as Response);
    const { result } = renderHook(() => useS3UploadFiles("my-bucket"), {
      wrapper: createWrapper(),
    });
    await expect(
      result.current.mutateAsync({ files: [] })
    ).rejects.toThrow("Upload failed: Internal Server Error");
  });
});

// ─── CREATE FOLDER ────────────────────────────────────────

describe("useS3CreateFolder", () => {
  it("calls api with PUT method, bucket in path, and prefix in body", async () => {
    mockApi.mockResolvedValueOnce({ bucket: "my-bucket", prefix: "logs/2024/", created: true });
    const { result } = renderHook(() => useS3CreateFolder("my-bucket"), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync("logs/2024/");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/s3/buckets/my-bucket/folders",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ prefix: "logs/2024/" }),
      })
    );
  });

  it("invalidates objects query on success", async () => {
    mockApi.mockResolvedValueOnce({ bucket: "my-bucket", prefix: "a/", created: true });
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useS3CreateFolder("my-bucket"), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: qc }, children),
    });
    await result.current.mutateAsync("a/");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["aws", "s3", "objects", "my-bucket"] });
  });
});

// ─── BATCH DELETE OBJECTS ─────────────────────────────────

describe("useS3BatchDeleteObjects", () => {
  it("calls api with POST method, bucket in path, and keys in body", async () => {
    mockApi.mockResolvedValueOnce({ deleted: ["a.txt", "b.txt"], errors: [] });
    const { result } = renderHook(() => useS3BatchDeleteObjects("my-bucket"), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync(["a.txt", "b.txt"]);
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/s3/buckets/my-bucket/objects/batch-delete",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ keys: ["a.txt", "b.txt"] }),
      })
    );
  });

  it("invalidates objects query on success", async () => {
    mockApi.mockResolvedValueOnce({ deleted: ["a.txt"], errors: [] });
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useS3BatchDeleteObjects("my-bucket"), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: qc }, children),
    });
    await result.current.mutateAsync(["a.txt"]);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["aws", "s3", "objects", "my-bucket"] });
  });
});

// ─── DELETE FOLDER ────────────────────────────────────────

describe("useS3DeleteFolder", () => {
  it("calls api with POST method, bucket in path, and prefix in body", async () => {
    mockApi.mockResolvedValueOnce({ totalDeleted: 3, deleted: [], errors: [] });
    const { result } = renderHook(() => useS3DeleteFolder("my-bucket"), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync("myfolder/");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/s3/buckets/my-bucket/folders/delete",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ prefix: "myfolder/" }),
      })
    );
  });

  it("invalidates objects query on success", async () => {
    mockApi.mockResolvedValueOnce({ totalDeleted: 1, deleted: [], errors: [] });
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useS3DeleteFolder("my-bucket"), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: qc }, children),
    });
    await result.current.mutateAsync("myfolder/");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["aws", "s3", "objects", "my-bucket"] });
  });
});
