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
  useRepositoryAssociations,
  useRepositoryAssociation,
  useAssociateRepository,
  useDisassociateRepository,
  useCodeGuruTags,
  useCodeGuruTagResource,
  useCodeGuruUntagResource,
} from "./useCodeGuruReviewer";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

describe("useRepositoryAssociations", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ associations: [], total: 0 });
    const { result } = renderHook(() => useRepositoryAssociations(), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/codegurureviewer/associations");
  });
});

describe("useRepositoryAssociation", () => {
  it("does NOT call api when associationArn is null", () => {
    renderHook(() => useRepositoryAssociation(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with encoded ARN when provided", async () => {
    mockApi.mockResolvedValueOnce({ repositoryAssociation: {}, tags: {} });
    const { result } = renderHook(
      () => useRepositoryAssociation("arn:aws:codeguru-reviewer:assoc/1"),
      { wrapper: createWrapper() }
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/codegurureviewer/associations/" +
        encodeURIComponent("arn:aws:codeguru-reviewer:assoc/1")
    );
  });
});

describe("useAssociateRepository", () => {
  it("POSTs body and invalidates associations", async () => {
    mockApi.mockResolvedValueOnce({ repositoryAssociation: {} });
    const { result } = renderHook(() => useAssociateRepository(), { wrapper: createWrapper() });
    result.current.mutate({ Repository: { GitHub: { Name: "repo" } } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/codegurureviewer/associations", {
      method: "POST",
      body: JSON.stringify({ Repository: { GitHub: { Name: "repo" } } }),
    });
  });
});

describe("useDisassociateRepository", () => {
  it("DELETEs by encoded ARN", async () => {
    mockApi.mockResolvedValueOnce({ repositoryAssociation: {} });
    const { result } = renderHook(() => useDisassociateRepository(), { wrapper: createWrapper() });
    result.current.mutate("arn:aws:codeguru-reviewer:assoc/1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/codegurureviewer/associations/" + encodeURIComponent("arn:aws:codeguru-reviewer:assoc/1"),
      { method: "DELETE" }
    );
  });
});

describe("useCodeGuruTags", () => {
  it("does NOT call api when resourceArn is null", () => {
    renderHook(() => useCodeGuruTags(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with encoded ARN when provided", async () => {
    mockApi.mockResolvedValueOnce({ tags: { env: "prod" } });
    const { result } = renderHook(() => useCodeGuruTags("arn:aws:codeguru-reviewer:assoc/1"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/codegurureviewer/tags?resourceArn=" +
        encodeURIComponent("arn:aws:codeguru-reviewer:assoc/1")
    );
  });
});

describe("useCodeGuruTagResource", () => {
  it("POSTs tags", async () => {
    mockApi.mockResolvedValueOnce({ tagged: true });
    const { result } = renderHook(() => useCodeGuruTagResource(), { wrapper: createWrapper() });
    result.current.mutate({ resourceArn: "arn:1", tags: { a: "b" } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/codegurureviewer/tags", {
      method: "POST",
      body: JSON.stringify({ resourceArn: "arn:1", tags: { a: "b" } }),
    });
  });
});

describe("useCodeGuruUntagResource", () => {
  it("POSTs tagKeys", async () => {
    mockApi.mockResolvedValueOnce({ untagged: true });
    const { result } = renderHook(() => useCodeGuruUntagResource(), { wrapper: createWrapper() });
    result.current.mutate({ resourceArn: "arn:1", tagKeys: ["a"] });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/codegurureviewer/tags/untag", {
      method: "POST",
      body: JSON.stringify({ resourceArn: "arn:1", tagKeys: ["a"] }),
    });
  });
});
