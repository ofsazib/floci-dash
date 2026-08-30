// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const mockApi = vi.hoisted(() => vi.fn());
vi.mock("../lib/client", () => ({ api: (...args: any[]) => mockApi(...args) }));

import {
  useCreateCFPolicy,
  useDeleteCFPolicy,
  useUpdateCFPolicy,
  useCreateCFOriginAccessIdentity,
  useDeleteCFOriginAccessIdentity,
  useCreateCFFunction,
  usePublishCFFunction,
  useDeleteCFFunction,
  useCreateCFPublicKey,
  useDeleteCFPublicKey,
  useCreateCFKeyGroup,
  useDeleteCFKeyGroup,
  useCreateCFDistributionWithTags,
  useGetCFDistributionConfig,
  useAssociateCFAlias,
  useTagCFResource,
  useUntagCFResource,
} from "./useCloudFront";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: qc }, children);
  };
}

beforeEach(() => {
  mockApi.mockReset();
});

describe("useCloudFront — P1 gap hooks", () => {
  it("policy create/delete/update per family", async () => {
    mockApi.mockResolvedValueOnce({ policy: {} });
    const { result: createR } = renderHook(() => useCreateCFPolicy("cache-policies"), { wrapper: createWrapper() });
    await createR.current.mutateAsync({ name: "cp1" });
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudfront/cache-policies", {
      method: "POST",
      body: JSON.stringify({ name: "cp1" }),
    });
    mockApi.mockResolvedValueOnce({ policy: {} });
    const { result: updateR } = renderHook(() => useUpdateCFPolicy("cache-policies"), { wrapper: createWrapper() });
    await updateR.current.mutateAsync({ id: "cp1", ifMatch: "E", name: "cp1" });
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudfront/cache-policies/cp1", {
      method: "PUT",
      body: JSON.stringify({ ifMatch: "E", name: "cp1" }),
    });
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result: delR } = renderHook(() => useDeleteCFPolicy("cache-policies"), { wrapper: createWrapper() });
    await delR.current.mutateAsync({ id: "cp1", ifMatch: "E" });
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudfront/cache-policies/cp1?ifMatch=E", { method: "DELETE" });
  });

  it("OAI create/delete", async () => {
    mockApi.mockResolvedValueOnce({ originAccessIdentity: {} });
    const { result: createR } = renderHook(() => useCreateCFOriginAccessIdentity(), { wrapper: createWrapper() });
    await createR.current.mutateAsync({ callerReference: "c1" });
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudfront/oai", {
      method: "POST",
      body: JSON.stringify({ callerReference: "c1" }),
    });
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result: delR } = renderHook(() => useDeleteCFOriginAccessIdentity(), { wrapper: createWrapper() });
    await delR.current.mutateAsync({ id: "oai-1", ifMatch: "E" });
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudfront/oai/oai-1?ifMatch=E", { method: "DELETE" });
  });

  it("functions create/publish/delete", async () => {
    mockApi.mockResolvedValueOnce({ functionSummary: {} });
    const { result: createR } = renderHook(() => useCreateCFFunction(), { wrapper: createWrapper() });
    await createR.current.mutateAsync({ name: "fn1", functionCode: "c" });
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudfront/functions", {
      method: "POST",
      body: JSON.stringify({ name: "fn1", functionCode: "c" }),
    });
    mockApi.mockResolvedValueOnce({ functionSummary: {} });
    const { result: pubR } = renderHook(() => usePublishCFFunction(), { wrapper: createWrapper() });
    await pubR.current.mutateAsync({ name: "fn1", ifMatch: "E" });
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudfront/functions/fn1/publish", {
      method: "POST",
      headers: { "If-Match": "E" },
      body: "{}",
    });
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result: delR } = renderHook(() => useDeleteCFFunction(), { wrapper: createWrapper() });
    await delR.current.mutateAsync({ name: "fn1", ifMatch: "E" });
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudfront/functions/fn1?ifMatch=E", { method: "DELETE" });
  });

  it("public keys + key groups create/delete", async () => {
    mockApi.mockResolvedValueOnce({ publicKey: {} });
    const { result: pk } = renderHook(() => useCreateCFPublicKey(), { wrapper: createWrapper() });
    await pk.current.mutateAsync({ name: "k", encodedKey: "x" });
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudfront/public-keys", {
      method: "POST",
      body: JSON.stringify({ name: "k", encodedKey: "x" }),
    });
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result: pkDel } = renderHook(() => useDeleteCFPublicKey(), { wrapper: createWrapper() });
    await pkDel.current.mutateAsync({ id: "pk-1", ifMatch: "E" });
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudfront/public-keys/pk-1?ifMatch=E", { method: "DELETE" });
    mockApi.mockResolvedValueOnce({ keyGroup: {} });
    const { result: kg } = renderHook(() => useCreateCFKeyGroup(), { wrapper: createWrapper() });
    await kg.current.mutateAsync({ name: "kg" });
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result: kgDel } = renderHook(() => useDeleteCFKeyGroup(), { wrapper: createWrapper() });
    await kgDel.current.mutateAsync({ id: "kg-1", ifMatch: "E" });
  });

  it("distribution with tags + config query + alias + tag hooks", async () => {
    mockApi.mockResolvedValueOnce({ distribution: {} });
    const { result: createR } = renderHook(() => useCreateCFDistributionWithTags(), { wrapper: createWrapper() });
    await createR.current.mutateAsync({ distributionConfig: {}, tags: [{ Key: "a", Value: "b" }] });
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudfront/distributions-with-tags", {
      method: "POST",
      body: JSON.stringify({ distributionConfig: {}, tags: [{ Key: "a", Value: "b" }] }),
    });
    mockApi.mockResolvedValueOnce({ distributionConfig: {}, etag: "E" });
    const cfg = renderHook(() => useGetCFDistributionConfig("d1"), { wrapper: createWrapper() });
    await waitFor(() => expect(cfg.result.current.isSuccess).toBe(true));
    const idle = renderHook(() => useGetCFDistributionConfig(null), { wrapper: createWrapper() });
    expect(idle.result.current.fetchStatus).toBe("idle");
    mockApi.mockResolvedValueOnce({ associated: true });
    const { result: alias } = renderHook(() => useAssociateCFAlias("d1"), { wrapper: createWrapper() });
    await alias.current.mutateAsync({ alias: "cdn.x" });
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudfront/distributions/d1/alias", {
      method: "POST",
      body: JSON.stringify({ alias: "cdn.x" }),
    });
    mockApi.mockResolvedValueOnce({ tagged: true });
    const { result: tag } = renderHook(() => useTagCFResource(), { wrapper: createWrapper() });
    await tag.current.mutateAsync({ resourceArn: "arn:d", tags: [{ Key: "a", Value: "b" }] });
    mockApi.mockResolvedValueOnce({ untagged: true });
    const { result: untag } = renderHook(() => useUntagCFResource(), { wrapper: createWrapper() });
    await untag.current.mutateAsync({ resourceArn: "arn:d", tagKeys: ["a"] });
  });
});
