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
  useOamSinks,
  useCreateOamSink,
  useDeleteOamSink,
  useOamSinkPolicy,
  usePutOamSinkPolicy,
  useOamAttachedLinks,
  useOamLinks,
  useCreateOamLink,
  useDeleteOamLink,
  useOamResourceTags,
  useAddOamResourceTags,
  useRemoveOamResourceTags,
} from "./useOAM";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useOamSinks", () => {
  it("fetches sinks", async () => {
    mockApi.mockResolvedValueOnce({ sinks: [], total: 0 });
    const { result } = renderHook(() => useOamSinks(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/oam/sinks");
  });
});

describe("useCreateOamSink", () => {
  it("POSTs the name", async () => {
    mockApi.mockResolvedValueOnce({ sink: {} });
    const { result } = renderHook(() => useCreateOamSink(), { wrapper: createWrapper() });
    await result.current.mutateAsync("monitor");
    expect(mockApi).toHaveBeenCalledWith("/aws/oam/sinks", {
      method: "POST",
      body: JSON.stringify({ name: "monitor" }),
    });
  });
});

describe("useDeleteOamSink", () => {
  it("DELETEs with encoded identifier", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useDeleteOamSink(), { wrapper: createWrapper() });
    await result.current.mutateAsync("arn:x/y");
    expect(mockApi).toHaveBeenCalledWith("/aws/oam/sinks/arn%3Ax%2Fy", { method: "DELETE" });
  });
});

describe("useOamSinkPolicy", () => {
  it("fetches the policy", async () => {
    mockApi.mockResolvedValueOnce({ policy: null, sinkArn: "a", sinkId: "s" });
    const { result } = renderHook(() => useOamSinkPolicy("arn a"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/oam/sinks/arn%20a/policy");
  });

  it("does not fetch when identifier is null", () => {
    renderHook(() => useOamSinkPolicy(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });
});

describe("usePutOamSinkPolicy", () => {
  it("PUTs the policy", async () => {
    mockApi.mockResolvedValueOnce({ policy: "p" });
    const { result } = renderHook(() => usePutOamSinkPolicy(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ identifier: "a", policy: "p" });
    expect(mockApi).toHaveBeenCalledWith("/aws/oam/sinks/a/policy", {
      method: "PUT",
      body: JSON.stringify({ policy: "p" }),
    });
  });
});

describe("useOamAttachedLinks", () => {
  it("fetches attached links", async () => {
    mockApi.mockResolvedValueOnce({ links: [], total: 0 });
    const { result } = renderHook(() => useOamAttachedLinks("a"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/oam/sinks/a/attached-links");
  });

  it("does not fetch when identifier is null", () => {
    renderHook(() => useOamAttachedLinks(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });
});

describe("useOamLinks", () => {
  it("fetches links", async () => {
    mockApi.mockResolvedValueOnce({ links: [], total: 0 });
    const { result } = renderHook(() => useOamLinks(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/oam/links");
  });
});

describe("useCreateOamLink", () => {
  it("POSTs the link body", async () => {
    mockApi.mockResolvedValueOnce({ link: {} });
    const { result } = renderHook(() => useCreateOamLink(), { wrapper: createWrapper() });
    await result.current.mutateAsync({
      sinkIdentifier: "s1",
      labelTemplate: "$AccountName",
      resourceTypes: ["AWS::Metric"],
    });
    expect(mockApi).toHaveBeenCalledWith("/aws/oam/links", {
      method: "POST",
      body: JSON.stringify({
        sinkIdentifier: "s1",
        labelTemplate: "$AccountName",
        resourceTypes: ["AWS::Metric"],
      }),
    });
  });
});

describe("useDeleteOamLink", () => {
  it("DELETEs with encoded identifier", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useDeleteOamLink(), { wrapper: createWrapper() });
    await result.current.mutateAsync("arn:x/y");
    expect(mockApi).toHaveBeenCalledWith("/aws/oam/links/arn%3Ax%2Fy", { method: "DELETE" });
  });
});

describe("useOamResourceTags", () => {
  it("fetches tags with encoded arn", async () => {
    mockApi.mockResolvedValueOnce({ tags: { env: "dev" } });
    const { result } = renderHook(() => useOamResourceTags("arn:x"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/oam/resources/tags?arn=arn%3Ax");
  });

  it("does not fetch when arn is null", () => {
    renderHook(() => useOamResourceTags(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });
});

describe("useAddOamResourceTags", () => {
  it("POSTs arn and tags", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useAddOamResourceTags(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ arn: "arn:x", tags: { env: "dev" } });
    expect(mockApi).toHaveBeenCalledWith("/aws/oam/resources/tags", {
      method: "POST",
      body: JSON.stringify({ arn: "arn:x", tags: { env: "dev" } }),
    });
  });
});

describe("useRemoveOamResourceTags", () => {
  it("POSTs arn and tagKeys", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useRemoveOamResourceTags(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ arn: "arn:x", tagKeys: ["env"] });
    expect(mockApi).toHaveBeenCalledWith("/aws/oam/resources/tags/untag", {
      method: "POST",
      body: JSON.stringify({ arn: "arn:x", tagKeys: ["env"] }),
    });
  });
});
