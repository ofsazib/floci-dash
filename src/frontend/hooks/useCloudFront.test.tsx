// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const mockApi = vi.hoisted(() => vi.fn());
vi.mock("../lib/client", () => ({ api: (...args: any[]) => mockApi(...args) }));

import {
  useCloudFrontDistributions,
  useCloudFrontDistribution,
  useCreateCloudFrontDistribution,
  useDeleteCloudFrontDistribution,
  useCloudFrontInvalidations,
  useCreateCloudFrontInvalidation,
  useCloudFrontCachePolicies,
  useCloudFrontOriginAccessControls,
  useCloudFrontFunctions,
  useCloudFrontTags,
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
    // publish without ifMatch — headers omit If-Match
    mockApi.mockResolvedValueOnce({ functionSummary: {} });
    await pubR.current.mutateAsync({ name: "fn1" });
    expect(mockApi).toHaveBeenLastCalledWith("/aws/cloudfront/functions/fn1/publish", {
      method: "POST",
      headers: {},
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

describe("useCloudFront — remaining P1 hooks", () => {
  it("policy update (origin-request family)", async () => {
    mockApi.mockResolvedValueOnce({ policy: {} });
    const { result } = renderHook(() => useUpdateCFPolicy("origin-request-policies"), { wrapper: createWrapper() });
    await result.current.mutateAsync({ id: "orp-1", ifMatch: "E", name: "n" });
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudfront/origin-request-policies/orp-1", {
      method: "PUT",
      body: JSON.stringify({ ifMatch: "E", name: "n" }),
    });
  });
});

describe("useCloudFront — legacy hooks (P1)", () => {
  it("distributions + distribution + invalidations + tags queries", async () => {
    mockApi.mockResolvedValueOnce({ distributions: [], total: 0 });
    const dists = renderHook(() => useCloudFrontDistributions(), { wrapper: createWrapper() });
    await waitFor(() => expect(dists.result.current.isSuccess).toBe(true));
    mockApi.mockResolvedValueOnce({ distribution: {} });
    const dist = renderHook(() => useCloudFrontDistribution("d1"), { wrapper: createWrapper() });
    await waitFor(() => expect(dist.result.current.isSuccess).toBe(true));
    const distIdle = renderHook(() => useCloudFrontDistribution(null), { wrapper: createWrapper() });
    expect(distIdle.result.current.fetchStatus).toBe("idle");
    mockApi.mockResolvedValueOnce({ invalidations: [], total: 0 });
    const inv = renderHook(() => useCloudFrontInvalidations("d1"), { wrapper: createWrapper() });
    await waitFor(() => expect(inv.result.current.isSuccess).toBe(true));
    const invIdle = renderHook(() => useCloudFrontInvalidations(null), { wrapper: createWrapper() });
    expect(invIdle.result.current.fetchStatus).toBe("idle");
    mockApi.mockResolvedValueOnce({ tags: {} });
    const tags = renderHook(() => useCloudFrontTags("arn:d"), { wrapper: createWrapper() });
    await waitFor(() => expect(tags.result.current.isSuccess).toBe(true));
    const tagsIdle = renderHook(() => useCloudFrontTags(null), { wrapper: createWrapper() });
    expect(tagsIdle.result.current.fetchStatus).toBe("idle");
  });

  it("distribution create/delete", async () => {
    mockApi.mockResolvedValueOnce({ id: "d1" });
    const { result: createR } = renderHook(() => useCreateCloudFrontDistribution(), { wrapper: createWrapper() });
    await createR.current.mutateAsync({});
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result: delR } = renderHook(() => useDeleteCloudFrontDistribution(), { wrapper: createWrapper() });
    await delR.current.mutateAsync("d1");
  });

  it("invalidation create", async () => {
    mockApi.mockResolvedValueOnce({ invalidation: {} });
    const { result } = renderHook(() => useCreateCloudFrontInvalidation("d1"), { wrapper: createWrapper() });
    await result.current.mutateAsync({ paths: ["/*"] });
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudfront/distributions/d1/invalidations", {
      method: "POST",
      body: JSON.stringify({ paths: ["/*"] }),
    });
  });

  it("cache/ORP/OAC/functions list queries", async () => {
    mockApi.mockResolvedValue({ cachePolicies: [], originAccessControls: [], functions: [] });
    const cp = renderHook(() => useCloudFrontCachePolicies(), { wrapper: createWrapper() });
    await waitFor(() => expect(cp.result.current.isSuccess).toBe(true));
    const oac = renderHook(() => useCloudFrontOriginAccessControls(), { wrapper: createWrapper() });
    await waitFor(() => expect(oac.result.current.isSuccess).toBe(true));
    const fn = renderHook(() => useCloudFrontFunctions(), { wrapper: createWrapper() });
    await waitFor(() => expect(fn.result.current.isSuccess).toBe(true));
  });
});

describe("useCloudFront — delete hooks without ifMatch", () => {
  it("covers the default-ifMatch arm for all delete hooks", async () => {
    mockApi.mockResolvedValue({ deleted: true });
    const pairs: Array<[() => ReturnType<any>, unknown]> = [];
    const dPol = renderHook(() => useDeleteCFPolicy("cache-policies"), { wrapper: createWrapper() });
    await dPol.result.current.mutateAsync({ id: "x" });
    const oai = renderHook(() => useDeleteCFOriginAccessIdentity(), { wrapper: createWrapper() });
    await oai.result.current.mutateAsync({ id: "x" });
    const fn = renderHook(() => useDeleteCFFunction(), { wrapper: createWrapper() });
    await fn.result.current.mutateAsync({ name: "f" });
    const { result: pk } = renderHook(() => useDeleteCFPublicKey(), { wrapper: createWrapper() });
    await pk.current.mutateAsync({ id: "x" });
    const { result: kg } = renderHook(() => useDeleteCFKeyGroup(), { wrapper: createWrapper() });
    await kg.current.mutateAsync({ id: "x" });
    expect(mockApi).toHaveBeenCalledTimes(5);
    for (const call of mockApi.mock.calls) {
      expect(String(call[0]).endsWith("ifMatch=")).toBe(true);
    }
  });
});
