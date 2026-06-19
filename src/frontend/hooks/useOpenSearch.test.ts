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
