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
  useCodeBuildProjects,
  useCreateCodeBuildProject,
  useCodeBuildProject,
  useDeleteCodeBuildProject,
  useStartCodeBuildBuild,
  useCodeBuildProjectBuilds,
  useCodeBuildBuilds,
  useCodeBuildBuild,
  useStopCodeBuildBuild,
  useCodeBuildSourceCredentials,
  useImportCodeBuildSourceCredentials,
  useDeleteCodeBuildSourceCredentials,
  useCodeBuildCuratedImages,
} from "./useCodeBuild";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

// ─── Projects ─────────────────────────────────────────

describe("useCodeBuildProjects", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ projects: [] });
    const { result } = renderHook(() => useCodeBuildProjects(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/codebuild/projects");
  });
});

describe("useCreateCodeBuildProject", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateCodeBuildProject(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "my-project" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/codebuild/projects",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("invalidates projects query on success", async () => {
    mockApi.mockResolvedValueOnce({});
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useCreateCodeBuildProject(), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: qc }, children),
    });
    await result.current.mutateAsync({ name: "p" });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["aws", "codebuild", "projects"] });
  });
});

describe("useCodeBuildProject", () => {
  it("does NOT call api when name is null", () => {
    renderHook(() => useCodeBuildProject(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with name in path when provided", async () => {
    mockApi.mockResolvedValueOnce({ project: {} });
    const { result } = renderHook(() => useCodeBuildProject("my-project"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/codebuild/projects/my-project");
  });
});

describe("useDeleteCodeBuildProject", () => {
  it("calls api with DELETE method and name in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteCodeBuildProject(), { wrapper: createWrapper() });
    await result.current.mutateAsync("my-project");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/codebuild/projects/my-project",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

describe("useStartCodeBuildBuild", () => {
  it("calls api with POST method and name in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useStartCodeBuildBuild(), { wrapper: createWrapper() });
    await result.current.mutateAsync("my-project");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/codebuild/projects/my-project/build",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

describe("useCodeBuildProjectBuilds", () => {
  it("does NOT call api when name is null", () => {
    renderHook(() => useCodeBuildProjectBuilds(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with name in path when provided", async () => {
    mockApi.mockResolvedValueOnce({ builds: [] });
    const { result } = renderHook(() => useCodeBuildProjectBuilds("my-project"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/codebuild/projects/my-project/builds");
  });
});

// ─── Builds ───────────────────────────────────────────

describe("useCodeBuildBuilds", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ builds: [] });
    const { result } = renderHook(() => useCodeBuildBuilds(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/codebuild/builds");
  });
});

describe("useCodeBuildBuild", () => {
  it("does NOT call api when id is null", () => {
    renderHook(() => useCodeBuildBuild(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with id in path when provided", async () => {
    mockApi.mockResolvedValueOnce({ build: {} });
    const { result } = renderHook(() => useCodeBuildBuild("build-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/codebuild/builds/build-1");
  });
});

describe("useStopCodeBuildBuild", () => {
  it("calls api with POST method and id in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useStopCodeBuildBuild(), { wrapper: createWrapper() });
    await result.current.mutateAsync("build-1");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/codebuild/builds/build-1/stop",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

// ─── Source Credentials ───────────────────────────────

describe("useCodeBuildSourceCredentials", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ sourceCredentialsInfo: [] });
    const { result } = renderHook(() => useCodeBuildSourceCredentials(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/codebuild/source-credentials");
  });
});

describe("useImportCodeBuildSourceCredentials", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useImportCodeBuildSourceCredentials(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ token: "abc", serverType: "GITHUB" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/codebuild/source-credentials",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

describe("useDeleteCodeBuildSourceCredentials", () => {
  it("calls api with DELETE method and encoded arn in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteCodeBuildSourceCredentials(), { wrapper: createWrapper() });
    await result.current.mutateAsync("arn:aws:codebuild:us-east-1:123:project/my-project");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/codebuild/source-credentials/arn%3Aaws%3Acodebuild%3Aus-east-1%3A123%3Aproject%2Fmy-project",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

// ─── Curated Images ──────────────────────────────────

describe("useCodeBuildCuratedImages", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ images: [] });
    const { result } = renderHook(() => useCodeBuildCuratedImages(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/codebuild/curated-images");
  });
});
