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
  useAMPWorkspaces,
  useAMPWorkspace,
  useCreateAMPWorkspace,
  useDeleteAMPWorkspace,
  useUpdateAMPWorkspaceAlias,
  useAMPTags,
  useAMPTagResource,
  useAMPUntagResource,
} from "./useAMP";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

describe("useAMPWorkspaces", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ workspaces: [], total: 0 });
    const { result } = renderHook(() => useAMPWorkspaces(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/amp/workspaces");
  });
});

describe("useAMPWorkspace", () => {
  it("does NOT call api when workspaceId is null", () => {
    renderHook(() => useAMPWorkspace(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with encoded workspaceId when provided", async () => {
    mockApi.mockResolvedValueOnce({ workspace: { workspaceId: "ws-1" } });
    const { result } = renderHook(() => useAMPWorkspace("ws-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/amp/workspaces/ws-1");
  });
});

describe("useCreateAMPWorkspace", () => {
  it("POSTs body and invalidates workspaces on success", async () => {
    mockApi.mockResolvedValueOnce({ workspaceId: "ws-new" });
    const { result } = renderHook(() => useCreateAMPWorkspace(), { wrapper: createWrapper() });
    result.current.mutate({ alias: "lawful" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/amp/workspaces", {
      method: "POST",
      body: JSON.stringify({ alias: "lawful" }),
    });
  });
});

describe("useDeleteAMPWorkspace", () => {
  it("DELETEs by workspaceId", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteAMPWorkspace(), { wrapper: createWrapper() });
    result.current.mutate("ws-1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/amp/workspaces/ws-1", { method: "DELETE" });
  });
});

describe("useUpdateAMPWorkspaceAlias", () => {
  it("PUTs alias and invalidates on success", async () => {
    mockApi.mockResolvedValueOnce({ updated: true });
    const { result } = renderHook(() => useUpdateAMPWorkspaceAlias(), {
      wrapper: createWrapper(),
    });
    result.current.mutate({ workspaceId: "ws-1", alias: "renamed" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/amp/workspaces/ws-1/alias", {
      method: "PUT",
      body: JSON.stringify({ alias: "renamed" }),
    });
  });
});

describe("useAMPTags", () => {
  it("does NOT call api when resourceArn is null", () => {
    renderHook(() => useAMPTags(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with encoded ARN when provided", async () => {
    mockApi.mockResolvedValueOnce({ tags: { env: "prod" } });
    const { result } = renderHook(() => useAMPTags("arn:aws:aps:ws-1"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/amp/tags?resourceArn=" + encodeURIComponent("arn:aws:aps:ws-1")
    );
  });
});

describe("useAMPTagResource", () => {
  it("POSTs tags and invalidates the tag query", async () => {
    mockApi.mockResolvedValueOnce({ tagged: true });
    const { result } = renderHook(() => useAMPTagResource(), { wrapper: createWrapper() });
    result.current.mutate({ resourceArn: "arn:aws:aps:ws-1", tags: { a: "b" } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/amp/tags", {
      method: "POST",
      body: JSON.stringify({ resourceArn: "arn:aws:aps:ws-1", tags: { a: "b" } }),
    });
  });
});

describe("useAMPUntagResource", () => {
  it("POSTs tagKeys and invalidates the tag query", async () => {
    mockApi.mockResolvedValueOnce({ untagged: true });
    const { result } = renderHook(() => useAMPUntagResource(), { wrapper: createWrapper() });
    result.current.mutate({ resourceArn: "arn:aws:aps:ws-1", tagKeys: ["a"] });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/amp/tags/untag", {
      method: "POST",
      body: JSON.stringify({ resourceArn: "arn:aws:aps:ws-1", tagKeys: ["a"] }),
    });
  });
});
