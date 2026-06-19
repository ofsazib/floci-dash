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
  useTransferServers,
  useCreateTransferServer,
  useTransferServer,
  useDeleteTransferServer,
  useStartTransferServer,
  useStopTransferServer,
  useTransferUsers,
  useCreateTransferUser,
  useTransferUser,
  useDeleteTransferUser,
  useTransferTags,
} from "./useTransfer";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

// ─── Servers ──────────────────────────────────────────

describe("useTransferServers", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ servers: [] });
    const { result } = renderHook(() => useTransferServers(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/transfer/servers");
  });
});

describe("useCreateTransferServer", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateTransferServer(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ serverName: "my-server" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/transfer/servers",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("invalidates servers query on success", async () => {
    mockApi.mockResolvedValueOnce({});
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useCreateTransferServer(), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: qc }, children),
    });
    await result.current.mutateAsync({ serverName: "s" });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["aws", "transfer", "servers"] });
  });
});

describe("useTransferServer", () => {
  it("does NOT call api when serverId is null", () => {
    renderHook(() => useTransferServer(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with serverId in path when provided", async () => {
    mockApi.mockResolvedValueOnce({ server: {} });
    const { result } = renderHook(() => useTransferServer("s-12345"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/transfer/servers/s-12345");
  });
});

describe("useDeleteTransferServer", () => {
  it("calls api with DELETE method and serverId in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteTransferServer(), { wrapper: createWrapper() });
    await result.current.mutateAsync("s-12345");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/transfer/servers/s-12345",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

describe("useStartTransferServer", () => {
  it("calls api with POST method and serverId in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useStartTransferServer(), { wrapper: createWrapper() });
    await result.current.mutateAsync("s-12345");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/transfer/servers/s-12345/start",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

describe("useStopTransferServer", () => {
  it("calls api with POST method and serverId in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useStopTransferServer(), { wrapper: createWrapper() });
    await result.current.mutateAsync("s-12345");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/transfer/servers/s-12345/stop",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

// ─── Users ────────────────────────────────────────────

describe("useTransferUsers", () => {
  it("does NOT call api when serverId is null", () => {
    renderHook(() => useTransferUsers(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with serverId in path when provided", async () => {
    mockApi.mockResolvedValueOnce({ users: [] });
    const { result } = renderHook(() => useTransferUsers("s-12345"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/transfer/servers/s-12345/users");
  });
});

describe("useCreateTransferUser", () => {
  it("calls api with POST method and serverId in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateTransferUser(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ serverId: "s-12345", userName: "alice", role: "arn:role" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/transfer/servers/s-12345/users",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

describe("useTransferUser", () => {
  it("does NOT call api when serverId is null", () => {
    renderHook(() => useTransferUser(null, "alice"), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("does NOT call api when userName is null", () => {
    renderHook(() => useTransferUser("s-12345", null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with both serverId and userName in path when provided", async () => {
    mockApi.mockResolvedValueOnce({ user: {} });
    const { result } = renderHook(() => useTransferUser("s-12345", "alice"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/transfer/servers/s-12345/users/alice");
  });
});

describe("useDeleteTransferUser", () => {
  it("calls api with DELETE method and serverId/userName in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteTransferUser(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ serverId: "s-12345", userName: "alice" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/transfer/servers/s-12345/users/alice",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

// ─── Tags ─────────────────────────────────────────────

describe("useTransferTags", () => {
  it("does NOT call api when resourceArn is null", () => {
    renderHook(() => useTransferTags(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with resourceArn query param when provided", async () => {
    mockApi.mockResolvedValueOnce({ tags: {} });
    const { result } = renderHook(() => useTransferTags("arn:aws:transfer:us-east-1:123:server/s-1"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/transfer/tags?resourceArn=arn%3Aaws%3Atransfer%3Aus-east-1%3A123%3Aserver%2Fs-1",
    );
  });
});
