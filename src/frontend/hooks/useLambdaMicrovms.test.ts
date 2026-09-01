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
  useMicrovmImages,
  useMicrovmImage,
  useCreateMicrovmImage,
  useUpdateMicrovmImage,
  useDeleteMicrovmImage,
  useMicrovmImageVersions,
  useMicrovmBuilds,
  useManagedMicrovmImages,
  useMicrovms,
  useMicrovm,
  useRunMicrovm,
  useTerminateMicrovm,
} from "./useLambdaMicrovms";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

describe("useMicrovmImages", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ items: [], nextToken: null });
    const { result } = renderHook(() => useMicrovmImages(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/lambda/microvms/microvm-images");
    expect(result.current.data?.items).toEqual([]);
  });
});

describe("useMicrovmImage", () => {
  it("fetches when id provided", async () => {
    mockApi.mockResolvedValueOnce({ imageId: "img-1" });
    const { result } = renderHook(() => useMicrovmImage("img-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/lambda/microvms/microvm-images/img-1");
  });

  it("disabled when id is null", () => {
    const { result } = renderHook(() => useMicrovmImage(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
    expect(mockApi).not.toHaveBeenCalled();
  });
});

describe("useCreateMicrovmImage", () => {
  it("calls POST and invalidates cache", async () => {
    mockApi.mockResolvedValueOnce({ imageId: "new" });
    const { result } = renderHook(() => useCreateMicrovmImage(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ name: "test" });
    expect(mockApi).toHaveBeenCalledWith("/aws/lambda/microvms/microvm-images", {
      method: "POST",
      body: JSON.stringify({ name: "test" }),
    });
  });
});

describe("useUpdateMicrovmImage", () => {
  it("calls PUT with id", async () => {
    mockApi.mockResolvedValueOnce({ imageId: "img-1" });
    const { result } = renderHook(() => useUpdateMicrovmImage(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ id: "img-1", body: { name: "updated" } });
    expect(mockApi).toHaveBeenCalledWith("/aws/lambda/microvms/microvm-images/img-1", {
      method: "PUT",
      body: JSON.stringify({ name: "updated" }),
    });
  });
});

describe("useDeleteMicrovmImage", () => {
  it("calls DELETE and invalidates cache", async () => {
    mockApi.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useDeleteMicrovmImage(), { wrapper: createWrapper() });
    await result.current.mutateAsync("img-1");
    expect(mockApi).toHaveBeenCalledWith("/aws/lambda/microvms/microvm-images/img-1", { method: "DELETE" });
  });
});

describe("useMicrovmImageVersions", () => {
  it("fetches versions when imageId provided", async () => {
    mockApi.mockResolvedValueOnce({ items: [] });
    const { result } = renderHook(() => useMicrovmImageVersions("img-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/lambda/microvms/microvm-images/img-1/versions");
  });

  it("disabled when imageId is null", () => {
    const { result } = renderHook(() => useMicrovmImageVersions(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useMicrovmBuilds", () => {
  it("fetches when both params provided", async () => {
    mockApi.mockResolvedValueOnce({ items: [] });
    const { result } = renderHook(() => useMicrovmBuilds("img-1", "v1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/lambda/microvms/microvm-images/img-1/versions/v1/builds");
  });

  it("disabled when imageId is null", () => {
    const { result } = renderHook(() => useMicrovmBuilds(null, "v1"), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("disabled when version is null", () => {
    const { result } = renderHook(() => useMicrovmBuilds("img-1", null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useManagedMicrovmImages", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ items: [] });
    const { result } = renderHook(() => useManagedMicrovmImages(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/lambda/microvms/managed-microvm-images");
  });
});

describe("useMicrovms", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ items: [], nextToken: null });
    const { result } = renderHook(() => useMicrovms(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/lambda/microvms/microvms");
  });
});

describe("useMicrovm", () => {
  it("fetches when id provided", async () => {
    mockApi.mockResolvedValueOnce({ microvmId: "vm-1" });
    const { result } = renderHook(() => useMicrovm("vm-1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/lambda/microvms/microvms/vm-1");
  });

  it("disabled when id is null", () => {
    const { result } = renderHook(() => useMicrovm(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("useRunMicrovm", () => {
  it("calls POST and invalidates cache", async () => {
    mockApi.mockResolvedValueOnce({ microvmId: "vm-new" });
    const { result } = renderHook(() => useRunMicrovm(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ imageIdentifier: "img-1" });
    expect(mockApi).toHaveBeenCalledWith("/aws/lambda/microvms/microvms", {
      method: "POST",
      body: JSON.stringify({ imageIdentifier: "img-1" }),
    });
  });
});

describe("useTerminateMicrovm", () => {
  it("calls DELETE and invalidates cache", async () => {
    mockApi.mockResolvedValueOnce(undefined);
    const { result } = renderHook(() => useTerminateMicrovm(), { wrapper: createWrapper() });
    await result.current.mutateAsync("vm-1");
    expect(mockApi).toHaveBeenCalledWith("/aws/lambda/microvms/microvms/vm-1", { method: "DELETE" });
  });
});
