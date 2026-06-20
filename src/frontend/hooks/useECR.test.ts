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
  useECRRepositories,
  useECRCreateRepository,
  useECRDeleteRepository,
  useECRImages,
  useECRDeleteImages,
  useECRRepositoryPolicy,
  useECRSetRepositoryPolicy,
  useECRDeleteRepositoryPolicy,
  useECRLifecyclePolicy,
  useECRPutLifecyclePolicy,
} from "./useECR";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

// ─── REPOSITORIES ─────────────────────────────────────────

describe("useECRRepositories", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ repositories: [], total: 0 });
    const { result } = renderHook(() => useECRRepositories(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ecr/repositories");
  });

  it("forwards error", async () => {
    mockApi.mockRejectedValueOnce(new Error("fail"));
    const { result } = renderHook(() => useECRRepositories(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// ─── CREATE REPOSITORY ────────────────────────────────────

describe("useECRCreateRepository", () => {
  it("calls api with POST method and body", async () => {
    mockApi.mockResolvedValueOnce({ repository: { repositoryName: "my-repo" } });
    const { result } = renderHook(() => useECRCreateRepository(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "my-repo" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ecr/repositories",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ repositoryName: "my-repo", tags: undefined }),
      })
    );
  });
});

// ─── DELETE REPOSITORY ────────────────────────────────────

describe("useECRDeleteRepository", () => {
  it("calls api with DELETE method", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useECRDeleteRepository(), { wrapper: createWrapper() });
    await result.current.mutateAsync("my-repo");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ecr/repositories/my-repo",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

// ─── IMAGES ───────────────────────────────────────────────

describe("useECRImages", () => {
  it("does NOT call api when repoName is null", () => {
    renderHook(() => useECRImages(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with repoName in path", async () => {
    mockApi.mockResolvedValueOnce({ images: [], total: 0 });
    const { result } = renderHook(() => useECRImages("my-repo"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ecr/repositories/my-repo/images");
  });
});

// ─── DELETE IMAGES ─────────────────────────────────────────

describe("useECRDeleteImages", () => {
  it("calls api with DELETE method and imageIds in body", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useECRDeleteImages("my-repo"), { wrapper: createWrapper() });
    await result.current.mutateAsync([{ imageDigest: "sha256:abc" }]);
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ecr/repositories/my-repo/images",
      expect.objectContaining({
        method: "DELETE",
        body: JSON.stringify({ imageIds: [{ imageDigest: "sha256:abc" }] }),
      })
    );
  });
});

// ─── SET REPOSITORY POLICY ─────────────────────────────────

describe("useECRSetRepositoryPolicy", () => {
  it("calls api with PUT method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useECRSetRepositoryPolicy("my-repo"), { wrapper: createWrapper() });
    await result.current.mutateAsync('{"Version":"2012-10-17"}');
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ecr/repositories/my-repo/policy",
      expect.objectContaining({ method: "PUT" })
    );
  });
});

// ─── DELETE REPOSITORY POLICY ──────────────────────────────

describe("useECRDeleteRepositoryPolicy", () => {
  it("calls api with DELETE method", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useECRDeleteRepositoryPolicy("my-repo"), { wrapper: createWrapper() });
    await result.current.mutateAsync();
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ecr/repositories/my-repo/policy",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

// ─── PUT LIFECYCLE POLICY ──────────────────────────────────

describe("useECRPutLifecyclePolicy", () => {
  it("calls api with PUT method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useECRPutLifecyclePolicy("my-repo"), { wrapper: createWrapper() });
    await result.current.mutateAsync('{"rules":[]}');
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/ecr/repositories/my-repo/lifecycle",
      expect.objectContaining({ method: "PUT" })
    );
  });
});

// ─── REPOSITORY POLICY ────────────────────────────────────

describe("useECRRepositoryPolicy", () => {
  it("does NOT call api when repoName is null", () => {
    renderHook(() => useECRRepositoryPolicy(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api when repoName provided", async () => {
    mockApi.mockResolvedValueOnce({ repositoryName: "my-repo", policyText: "{}" });
    const { result } = renderHook(() => useECRRepositoryPolicy("my-repo"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ecr/repositories/my-repo/policy");
  });
});

// ─── LIFECYCLE POLICY ─────────────────────────────────────

describe("useECRLifecyclePolicy", () => {
  it("does NOT call api when repoName is null", () => {
    renderHook(() => useECRLifecyclePolicy(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api when repoName provided", async () => {
    mockApi.mockResolvedValueOnce({ repositoryName: "my-repo", lifecyclePolicyText: "{}" });
    const { result } = renderHook(() => useECRLifecyclePolicy("my-repo"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/ecr/repositories/my-repo/lifecycle");
  });
});
