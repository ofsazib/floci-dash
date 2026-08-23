// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createWrapper } from "../../test/helpers";

const mockApi = vi.hoisted(() => vi.fn());
vi.mock("../lib/client", () => ({ api: (...args: any[]) => mockApi(...args) }));
vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual: any = await importOriginal();
  return { ...actual, useQueryClient: () => ({ invalidateQueries: vi.fn() }) };
});

import {
  useOpenSearchDomains,
  useOpenSearchDomain,
  useCreateOpenSearchDomain,
  useDeleteOpenSearchDomain,
  useOpenSearchVersions,
  useUpdateOpenSearchDomainConfig,
  useUpgradeOpenSearchDomain,
  useOpenSearchDomainTags,
  useAddOpenSearchDomainTags,
} from "./useOpenSearch";

beforeEach(() => mockApi.mockReset());

describe("useOpenSearch hooks", () => {
  it("useOpenSearchDomains calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ domains: [], total: 0 });
    const { result } = renderHook(() => useOpenSearchDomains(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/opensearch/domains");
  });

  it("useOpenSearchDomain calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ domain: {} });
    const { result } = renderHook(() => useOpenSearchDomain("my-domain"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/opensearch/domains/my-domain");
  });

  it("useOpenSearchDomain disabled when null", () => {
    const { result } = renderHook(() => useOpenSearchDomain(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useCreateOpenSearchDomain calls POST", async () => {
    mockApi.mockResolvedValueOnce({ domain: {} });
    const { result } = renderHook(() => useCreateOpenSearchDomain(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ domainName: "new-domain" });
    expect(mockApi).toHaveBeenCalledWith("/aws/opensearch/domains", {
      method: "POST",
      body: JSON.stringify({ domainName: "new-domain" }),
    });
  });

  it("useDeleteOpenSearchDomain calls DELETE", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteOpenSearchDomain(), { wrapper: createWrapper() });
    await result.current.mutateAsync("my-domain");
    expect(mockApi).toHaveBeenCalledWith("/aws/opensearch/domains/my-domain", { method: "DELETE" });
  });

  it("useOpenSearchVersions calls correct URL", async () => {
    mockApi.mockResolvedValueOnce({ versions: [], total: 0 });
    const { result } = renderHook(() => useOpenSearchVersions(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/opensearch/versions");
  });
});

describe("OpenSearch manage hooks", () => {
  it("useUpdateOpenSearchDomainConfig puts config", async () => {
    mockApi.mockResolvedValueOnce({ changeId: "ch-1" });
    const { result } = renderHook(() => useUpdateOpenSearchDomainConfig(), { wrapper: createWrapper() });
    result.current.mutate({ domainName: "d 1", clusterConfig: { InstanceType: "r6g" } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/opensearch/domains/d%201/config", {
      method: "PUT",
      body: JSON.stringify({ clusterConfig: { InstanceType: "r6g" }, ebsOptions: undefined, accessPolicies: undefined }),
    });
  });

  it("useUpgradeOpenSearchDomain posts upgrade", async () => {
    mockApi.mockResolvedValueOnce({ upgradeStarted: true });
    const { result } = renderHook(() => useUpgradeOpenSearchDomain(), { wrapper: createWrapper() });
    result.current.mutate({ domainName: "d1", targetVersion: "OpenSearch_2.11" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/opensearch/domains/d1/upgrade", {
      method: "POST",
      body: JSON.stringify({ targetVersion: "OpenSearch_2.11", performCheckOnly: undefined }),
    });
  });

  it("useOpenSearchDomainTags fetches with encoded arn", async () => {
    mockApi.mockResolvedValueOnce({ tags: [] });
    const { result } = renderHook(() => useOpenSearchDomainTags("arn:d 1", "d1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/opensearch/domains/d1/tags?arn=arn%3Ad%201");
  });

  it("useOpenSearchDomainTags disabled without arn", () => {
    const { result } = renderHook(() => useOpenSearchDomainTags(null, "d1"), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useAddOpenSearchDomainTags posts tags", async () => {
    mockApi.mockResolvedValueOnce({ tagged: true });
    const { result } = renderHook(() => useAddOpenSearchDomainTags(), { wrapper: createWrapper() });
    result.current.mutate({ domainName: "d1", arn: "arn:x", tags: { env: "prod" } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/opensearch/domains/d1/tags?arn=arn%3Ax", {
      method: "POST",
      body: JSON.stringify({ tags: { env: "prod" } }),
    });
  });
});
