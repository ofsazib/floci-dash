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
  useRe2Indexes,
  useRe2IndexDetail,
  useRe2CreateIndex,
  useRe2DeleteIndex,
  useRe2UpdateIndexType,
  useRe2ServiceConfig,
  useRe2Views,
  useRe2ViewDetail,
  useRe2CreateView,
  useRe2UpdateView,
  useRe2DeleteView,
  useRe2DefaultView,
  useRe2AssociateDefaultView,
  useRe2DisassociateDefaultView,
  useRe2Search,
  useRe2ResourceTypes,
} from "./useResourceExplorer2";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

describe("useRe2Indexes", () => {
  it("fetches indexes", async () => {
    mockApi.mockResolvedValueOnce({ indexes: [], total: 0 });
    const { result } = renderHook(() => useRe2Indexes(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/resourceexplorer2/indexes");
  });
});

describe("useRe2IndexDetail", () => {
  it("fetches index detail", async () => {
    mockApi.mockResolvedValueOnce({ index: { Arn: "arn" } });
    const { result } = renderHook(() => useRe2IndexDetail(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/resourceexplorer2/indexes/detail");
  });
});

describe("useRe2CreateIndex", () => {
  it("posts create body", async () => {
    mockApi.mockResolvedValueOnce({ arn: "arn" });
    const { result } = renderHook(() => useRe2CreateIndex(), { wrapper: createWrapper() });
    result.current.mutate({ tags: { env: "dev" } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/resourceexplorer2/indexes", {
      method: "POST",
      body: JSON.stringify({ tags: { env: "dev" } }),
    });
  });
});

describe("useRe2DeleteIndex", () => {
  it("deletes by encoded arn", async () => {
    mockApi.mockResolvedValueOnce({ state: "DELETED" });
    const { result } = renderHook(() => useRe2DeleteIndex(), { wrapper: createWrapper() });
    result.current.mutate("arn:idx/1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/resourceexplorer2/indexes?arn=arn%3Aidx%2F1", {
      method: "DELETE",
    });
  });
});

describe("useRe2UpdateIndexType", () => {
  it("posts type change", async () => {
    mockApi.mockResolvedValueOnce({ type: "AGGREGATOR" });
    const { result } = renderHook(() => useRe2UpdateIndexType(), { wrapper: createWrapper() });
    result.current.mutate({ arn: "arn:idx/1", type: "AGGREGATOR" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/resourceexplorer2/indexes/type", {
      method: "POST",
      body: JSON.stringify({ arn: "arn:idx/1", type: "AGGREGATOR" }),
    });
  });
});

describe("useRe2ServiceConfig", () => {
  it("fetches service config", async () => {
    mockApi.mockResolvedValueOnce({ OrgConfiguration: {} });
    const { result } = renderHook(() => useRe2ServiceConfig(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/resourceexplorer2/service-config");
  });
});

describe("useRe2Views", () => {
  it("fetches views", async () => {
    mockApi.mockResolvedValueOnce({ views: [], total: 0 });
    const { result } = renderHook(() => useRe2Views(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/resourceexplorer2/views");
  });
});

describe("useRe2ViewDetail", () => {
  it("fetches view detail with encoded arn", async () => {
    mockApi.mockResolvedValueOnce({ view: {}, tags: {} });
    const { result } = renderHook(() => useRe2ViewDetail("arn:view/1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/resourceexplorer2/views/detail?arn=arn%3Aview%2F1");
  });

  it("is disabled without an arn", () => {
    const { result } = renderHook(() => useRe2ViewDetail(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
    expect(mockApi).not.toHaveBeenCalled();
  });
});

describe("useRe2CreateView", () => {
  it("posts create body", async () => {
    mockApi.mockResolvedValueOnce({ view: {} });
    const { result } = renderHook(() => useRe2CreateView(), { wrapper: createWrapper() });
    const body = { viewName: "v", filters: "service eq s3" };
    result.current.mutate(body);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/resourceexplorer2/views", {
      method: "POST",
      body: JSON.stringify(body),
    });
  });
});

describe("useRe2UpdateView", () => {
  it("puts update body", async () => {
    mockApi.mockResolvedValueOnce({ view: {} });
    const { result } = renderHook(() => useRe2UpdateView(), { wrapper: createWrapper() });
    result.current.mutate({ viewArn: "arn:v", filters: "f" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/resourceexplorer2/views/update", {
      method: "PUT",
      body: JSON.stringify({ viewArn: "arn:v", filters: "f" }),
    });
  });
});

describe("useRe2DeleteView", () => {
  it("deletes by encoded arn", async () => {
    mockApi.mockResolvedValueOnce({ viewArn: "arn:v" });
    const { result } = renderHook(() => useRe2DeleteView(), { wrapper: createWrapper() });
    result.current.mutate("arn:v");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/resourceexplorer2/views?arn=arn%3Av", { method: "DELETE" });
  });
});

describe("useRe2DefaultView", () => {
  it("fetches default view", async () => {
    mockApi.mockResolvedValueOnce({ viewArn: null });
    const { result } = renderHook(() => useRe2DefaultView(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/resourceexplorer2/views/default");
  });
});

describe("useRe2AssociateDefaultView", () => {
  it("posts association", async () => {
    mockApi.mockResolvedValueOnce({ viewArn: "arn:v" });
    const { result } = renderHook(() => useRe2AssociateDefaultView(), { wrapper: createWrapper() });
    result.current.mutate("arn:v");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/resourceexplorer2/views/associate-default", {
      method: "POST",
      body: JSON.stringify({ viewArn: "arn:v" }),
    });
  });
});

describe("useRe2DisassociateDefaultView", () => {
  it("posts disassociation", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useRe2DisassociateDefaultView(), { wrapper: createWrapper() });
    result.current.mutate();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/resourceexplorer2/views/disassociate-default", {
      method: "POST",
    });
  });
});

describe("useRe2Search", () => {
  it("posts search body", async () => {
    mockApi.mockResolvedValueOnce({ resources: [], total: 0 });
    const { result } = renderHook(() => useRe2Search(), { wrapper: createWrapper() });
    result.current.mutate({ queryString: "service:s3", maxResults: 10 });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/resourceexplorer2/search", {
      method: "POST",
      body: JSON.stringify({ queryString: "service:s3", maxResults: 10 }),
    });
  });
});

describe("useRe2ResourceTypes", () => {
  it("fetches resource types", async () => {
    mockApi.mockResolvedValueOnce({ types: [], total: 0 });
    const { result } = renderHook(() => useRe2ResourceTypes(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/resourceexplorer2/resource-types");
  });
});
