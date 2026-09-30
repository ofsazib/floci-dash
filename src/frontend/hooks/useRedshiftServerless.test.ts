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
  useServerlessNamespaces,
  useCreateServerlessNamespace,
  useUpdateServerlessNamespace,
  useDeleteServerlessNamespace,
  useServerlessNamespaceTags,
  useAddServerlessNamespaceTags,
  useRemoveServerlessNamespaceTags,
} from "./useRedshiftServerless";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useServerlessNamespaces", () => {
  it("fetches namespaces", async () => {
    mockApi.mockResolvedValueOnce({ namespaces: [], total: 0 });
    const { result } = renderHook(() => useServerlessNamespaces(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/redshiftserverless/namespaces");
  });
});

describe("useCreateServerlessNamespace", () => {
  it("POSTs the namespace body", async () => {
    mockApi.mockResolvedValueOnce({ namespace: {} });
    const { result } = renderHook(() => useCreateServerlessNamespace(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({ namespaceName: "n", dbName: "dev", adminUsername: "admin" });
    expect(mockApi).toHaveBeenCalledWith("/aws/redshiftserverless/namespaces", {
      method: "POST",
      body: JSON.stringify({ namespaceName: "n", dbName: "dev", adminUsername: "admin" }),
    });
  });
});

describe("useUpdateServerlessNamespace", () => {
  it("PUTs adminUsername with encoded name", async () => {
    mockApi.mockResolvedValueOnce({ namespace: {} });
    const { result } = renderHook(() => useUpdateServerlessNamespace(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({ namespaceName: "my ns", adminUsername: "new" });
    expect(mockApi).toHaveBeenCalledWith("/aws/redshiftserverless/namespaces/my%20ns", {
      method: "PUT",
      body: JSON.stringify({ adminUsername: "new" }),
    });
  });
});

describe("useDeleteServerlessNamespace", () => {
  it("DELETEs with encoded name", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useDeleteServerlessNamespace(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync("my ns");
    expect(mockApi).toHaveBeenCalledWith("/aws/redshiftserverless/namespaces/my%20ns", {
      method: "DELETE",
    });
  });
});

describe("useServerlessNamespaceTags", () => {
  it("fetches tags with encoded name and arn", async () => {
    mockApi.mockResolvedValueOnce({ tags: [] });
    const { result } = renderHook(
      () => useServerlessNamespaceTags("my ns", "arn:aws"),
      { wrapper: createWrapper() }
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/redshiftserverless/namespaces/my%20ns/tags?arn=arn%3Aaws"
    );
  });

  it("does not fetch when arn is null", () => {
    renderHook(() => useServerlessNamespaceTags("n", null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });
});

describe("useAddServerlessNamespaceTags", () => {
  it("POSTs arn and tags", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useAddServerlessNamespaceTags(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({
      namespaceName: "n",
      arn: "arn:aws",
      tags: [{ key: "env", value: "dev" }],
    });
    expect(mockApi).toHaveBeenCalledWith("/aws/redshiftserverless/namespaces/n/tags", {
      method: "POST",
      body: JSON.stringify({ arn: "arn:aws", tags: [{ key: "env", value: "dev" }] }),
    });
  });
});

describe("useRemoveServerlessNamespaceTags", () => {
  it("POSTs arn and tagKeys", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useRemoveServerlessNamespaceTags(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({ namespaceName: "n", arn: "arn:aws", tagKeys: ["env"] });
    expect(mockApi).toHaveBeenCalledWith("/aws/redshiftserverless/namespaces/n/tags/untag", {
      method: "POST",
      body: JSON.stringify({ arn: "arn:aws", tagKeys: ["env"] }),
    });
  });
});
