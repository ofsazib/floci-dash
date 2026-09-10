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
  useEfsFileSystems,
  useEfsMountTargets,
  useEfsAccessPoints,
  useEfsTags,
  useCreateEfsFileSystem,
  useUpdateEfsFileSystem,
  useDeleteEfsFileSystem,
  useCreateEfsMountTarget,
  useDeleteEfsMountTarget,
  useCreateEfsAccessPoint,
  useDeleteEfsAccessPoint,
  useCreateEfsTags,
  useDeleteEfsTags,
} from "./useEFS";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

describe("useEfsFileSystems", () => {
  it("fetches file systems", async () => {
    mockApi.mockResolvedValueOnce({ fileSystems: [], total: 0 });
    const { result } = renderHook(() => useEfsFileSystems(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/efs/file-systems");
  });
});

describe("useEfsMountTargets", () => {
  it("fetches mount targets for a file system", async () => {
    mockApi.mockResolvedValueOnce({ mountTargets: [], total: 0 });
    const { result } = renderHook(() => useEfsMountTargets("fs-123"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/efs/mount-targets?fileSystemId=fs-123");
  });

  it("is disabled when fileSystemId is null", () => {
    const { result } = renderHook(() => useEfsMountTargets(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
    expect(mockApi).not.toHaveBeenCalled();
  });
});

describe("useEfsAccessPoints", () => {
  it("fetches access points for a file system", async () => {
    mockApi.mockResolvedValueOnce({ accessPoints: [], total: 0 });
    const { result } = renderHook(() => useEfsAccessPoints("fs-123"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/efs/access-points?fileSystemId=fs-123");
  });

  it("is disabled when fileSystemId is null", () => {
    const { result } = renderHook(() => useEfsAccessPoints(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
    expect(mockApi).not.toHaveBeenCalled();
  });
});

describe("useEfsTags", () => {
  it("fetches tags for a file system", async () => {
    mockApi.mockResolvedValueOnce({ tags: [] });
    const { result } = renderHook(() => useEfsTags("fs-123"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/efs/file-systems/fs-123/tags");
  });

  it("is disabled when fileSystemId is null", () => {
    const { result } = renderHook(() => useEfsTags(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
    expect(mockApi).not.toHaveBeenCalled();
  });
});

describe("useCreateEfsFileSystem", () => {
  it("POSTs the creation body", async () => {
    mockApi.mockResolvedValueOnce({ fileSystem: { FileSystemId: "fs-1" } });
    const { result } = renderHook(() => useCreateEfsFileSystem(), { wrapper: createWrapper() });
    result.current.mutate({ creationToken: "tok", encrypted: true });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/efs/file-systems", {
      method: "POST",
      body: JSON.stringify({ creationToken: "tok", encrypted: true }),
    });
  });
});

describe("useUpdateEfsFileSystem", () => {
  it("PUTs throughput update", async () => {
    mockApi.mockResolvedValueOnce({ fileSystem: {} });
    const { result } = renderHook(() => useUpdateEfsFileSystem(), { wrapper: createWrapper() });
    result.current.mutate({ fileSystemId: "fs-123", throughputMode: "provisioned" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/efs/file-systems/fs-123", {
      method: "PUT",
      body: JSON.stringify({ throughputMode: "provisioned" }),
    });
  });
});

describe("useDeleteEfsFileSystem", () => {
  it("DELETEs by id", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteEfsFileSystem(), { wrapper: createWrapper() });
    result.current.mutate("fs-123");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/efs/file-systems/fs-123", { method: "DELETE" });
  });
});

describe("useCreateEfsMountTarget", () => {
  it("POSTs mount target body", async () => {
    mockApi.mockResolvedValueOnce({ mountTarget: {} });
    const { result } = renderHook(() => useCreateEfsMountTarget(), { wrapper: createWrapper() });
    result.current.mutate({ fileSystemId: "fs-123", subnetId: "subnet-1" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/efs/mount-targets", {
      method: "POST",
      body: JSON.stringify({ fileSystemId: "fs-123", subnetId: "subnet-1" }),
    });
  });
});

describe("useDeleteEfsMountTarget", () => {
  it("DELETEs by id", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteEfsMountTarget(), { wrapper: createWrapper() });
    result.current.mutate("fsmt-1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/efs/mount-targets/fsmt-1", { method: "DELETE" });
  });
});

describe("useCreateEfsAccessPoint", () => {
  it("POSTs access point body", async () => {
    mockApi.mockResolvedValueOnce({ accessPoint: {} });
    const { result } = renderHook(() => useCreateEfsAccessPoint(), { wrapper: createWrapper() });
    result.current.mutate({ clientToken: "tok", fileSystemId: "fs-123", name: "ap" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/efs/access-points", {
      method: "POST",
      body: JSON.stringify({ clientToken: "tok", fileSystemId: "fs-123", name: "ap" }),
    });
  });
});

describe("useDeleteEfsAccessPoint", () => {
  it("DELETEs by id", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteEfsAccessPoint(), { wrapper: createWrapper() });
    result.current.mutate("fsap-1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/efs/access-points/fsap-1", { method: "DELETE" });
  });
});

describe("useCreateEfsTags", () => {
  it("POSTs tags", async () => {
    mockApi.mockResolvedValueOnce({ created: true });
    const { result } = renderHook(() => useCreateEfsTags(), { wrapper: createWrapper() });
    result.current.mutate({ fileSystemId: "fs-123", tags: [{ Key: "env", Value: "dev" }] });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/efs/file-systems/fs-123/tags", {
      method: "POST",
      body: JSON.stringify({ tags: [{ Key: "env", Value: "dev" }] }),
    });
  });
});

describe("useDeleteEfsTags", () => {
  it("DELETEs tags by keys", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteEfsTags(), { wrapper: createWrapper() });
    result.current.mutate({ fileSystemId: "fs-123", tagKeys: ["env"] });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/efs/file-systems/fs-123/tags", {
      method: "DELETE",
      body: JSON.stringify({ tagKeys: ["env"] }),
    });
  });
});
