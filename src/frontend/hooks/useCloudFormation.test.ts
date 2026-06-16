// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const mockApi = vi.fn();
vi.mock("../lib/client", () => ({
  api: (...args: any[]) => mockApi(...args),
}));

import {
  useStacks,
  useStack,
  useStackTemplate,
  useCreateStack,
  useDeleteStack,
  useValidateTemplate,
  useExports,
} from "./useCloudFormation";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

// ─── Stacks list ────────────────────────────────────────

describe("useStacks", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ stacks: [], total: 0 });
    const { result } = renderHook(() => useStacks(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudformation/stacks");
  });
});

// ─── Stack detail ───────────────────────────────────────

describe("useStack", () => {
  it("does NOT call api when name is null", () => {
    renderHook(() => useStack(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with stack name in path when provided", async () => {
    mockApi.mockResolvedValueOnce({ stack: {}, resources: [], events: [] });
    const { result } = renderHook(() => useStack("my-stack"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudformation/stacks/my-stack");
  });
});

// ─── Stack template ─────────────────────────────────────

describe("useStackTemplate", () => {
  it("does NOT call api when name is null", () => {
    renderHook(() => useStackTemplate(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with template URL when name provided", async () => {
    mockApi.mockResolvedValueOnce({ name: "my-stack", template: "{}" });
    const { result } = renderHook(() => useStackTemplate("my-stack"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/cloudformation/stacks/my-stack/template"
    );
  });
});

// ─── Create stack ───────────────────────────────────────

describe("useCreateStack", () => {
  it("calls api with POST method and serialized body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateStack(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({ stackName: "s1", templateBody: "{}" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/cloudformation/stacks",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ stackName: "s1", templateBody: "{}" }),
      })
    );
  });
});

// ─── Delete stack ───────────────────────────────────────

describe("useDeleteStack", () => {
  it("calls api with DELETE method and name in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteStack(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync("s1");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/cloudformation/stacks/s1",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

// ─── Validate template ──────────────────────────────────

describe("useValidateTemplate", () => {
  it("calls api with POST method and serialized body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useValidateTemplate(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({ templateBody: "{}" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/cloudformation/validate-template",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ templateBody: "{}" }),
      })
    );
  });
});

// ─── Exports ────────────────────────────────────────────

describe("useExports", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ exports: [], total: 0 });
    const { result } = renderHook(() => useExports(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudformation/exports");
  });
});
