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
  useKMSKeys,
  useKMSKey,
  useCreateKey,
  useScheduleKeyDeletion,
  useCancelKeyDeletion,
  useToggleKey,
  useToggleRotation,
  useUpdateKeyDescription,
  useKMSAliases,
  useCreateAlias,
  useDeleteAlias,
  useEncrypt,
  useDecrypt,
} from "./useKMS";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

describe("useKMSKeys", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ keys: [], total: 0 });
    const { result } = renderHook(() => useKMSKeys(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/kms/keys");
  });
});

describe("useKMSKey", () => {
  it("does NOT call api when id is null", () => {
    renderHook(() => useKMSKey(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with id in path when provided", async () => {
    mockApi.mockResolvedValueOnce({ key: {}, tags: {}, aliases: [], grants: [], rotationEnabled: false });
    const { result } = renderHook(() => useKMSKey("my-key"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/kms/keys/my-key");
  });
});

describe("useCreateKey", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateKey(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ description: "test" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/kms/keys",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

describe("useScheduleKeyDeletion", () => {
  it("calls api with POST method and id in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useScheduleKeyDeletion(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ id: "key-1", pendingWindowInDays: 7 });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/kms/keys/key-1/schedule-deletion",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

describe("useCancelKeyDeletion", () => {
  it("calls api with POST method and id in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCancelKeyDeletion(), { wrapper: createWrapper() });
    await result.current.mutateAsync("key-1");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/kms/keys/key-1/cancel-deletion",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

describe("useToggleKey", () => {
  it("calls api with enable path when enable=true", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useToggleKey(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ id: "key-1", enable: true });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/kms/keys/key-1/enable",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("calls api with disable path when enable=false", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useToggleKey(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ id: "key-1", enable: false });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/kms/keys/key-1/disable",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

describe("useToggleRotation", () => {
  it("calls api with enable-rotation path when enable=true", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useToggleRotation(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ id: "key-1", enable: true });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/kms/keys/key-1/enable-rotation",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("calls api with disable-rotation path when enable=false", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useToggleRotation(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ id: "key-1", enable: false });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/kms/keys/key-1/disable-rotation",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

describe("useUpdateKeyDescription", () => {
  it("calls api with PUT method and description in body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useUpdateKeyDescription(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ id: "key-1", description: "new desc" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/kms/keys/key-1/description",
      expect.objectContaining({ method: "PUT" }),
    );
  });
});

describe("useKMSAliases", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ aliases: [], total: 0 });
    const { result } = renderHook(() => useKMSAliases(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/kms/aliases");
  });
});

describe("useCreateAlias", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateAlias(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ aliasName: "alias/my-key", targetKeyId: "key-1" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/kms/aliases",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

describe("useDeleteAlias", () => {
  it("calls api with DELETE method and name in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteAlias(), { wrapper: createWrapper() });
    await result.current.mutateAsync("alias/my-key");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/kms/aliases/alias/my-key",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

describe("useEncrypt", () => {
  it("calls api with POST method and id in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useEncrypt(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ id: "key-1", plaintext: "hello" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/kms/keys/key-1/encrypt",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

describe("useDecrypt", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDecrypt(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ ciphertextBlob: "cipher" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/kms/decrypt",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
