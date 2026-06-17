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
  useSecrets,
  useSecret,
  useSecretValue,
  useCreateSecret,
  useUpdateSecret,
  useDeleteSecret,
  useRestoreSecret,
  useRotateSecret,
  usePutSecretValue,
  useRandomPassword,
} from "./useSecrets";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

// ─── QUERIES ─────────────────────────────────────────────

describe("useSecrets", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ secrets: [], total: 0 });
    const { result } = renderHook(() => useSecrets(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/secretsmanager/secrets");
  });

  it("forwards error", async () => {
    mockApi.mockRejectedValueOnce(new Error("fail"));
    const { result } = renderHook(() => useSecrets(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useSecret", () => {
  it("does NOT call api when id is null", () => {
    renderHook(() => useSecret(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with id in path when provided", async () => {
    mockApi.mockResolvedValueOnce({ secret: {}, versions: [], versionIdsToStages: {} });
    const { result } = renderHook(() => useSecret("my-id"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/secretsmanager/secrets/my-id");
  });
});

describe("useSecretValue", () => {
  it("does NOT call api when id is null", () => {
    renderHook(() => useSecretValue(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with id in path and no query string when versionId omitted", async () => {
    mockApi.mockResolvedValueOnce({
      name: "n",
      versionId: "v1",
      secretString: "",
      secretBinary: "",
      versionStages: [],
    });
    const { result } = renderHook(() => useSecretValue("my-id"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/secretsmanager/secrets/my-id/value");
  });

  it("appends versionId as query string when provided", async () => {
    mockApi.mockResolvedValueOnce({
      name: "n",
      versionId: "v2",
      secretString: "",
      secretBinary: "",
      versionStages: [],
    });
    const { result } = renderHook(() => useSecretValue("my-id", "v2"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/secretsmanager/secrets/my-id/value?versionId=v2"
    );
  });
});

// ─── MUTATIONS ───────────────────────────────────────────

describe("useCreateSecret", () => {
  it("calls api with POST method and serialized body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateSecret(), { wrapper: createWrapper() });
    const body = { name: "s", secretString: "v" };
    await result.current.mutateAsync(body);
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/secretsmanager/secrets",
      expect.objectContaining({ method: "POST", body: JSON.stringify(body) })
    );
  });
});

describe("useUpdateSecret", () => {
  it("calls api with PUT method, id in path, remaining fields in body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useUpdateSecret(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ id: "my-id", secretString: "v" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/secretsmanager/secrets/my-id",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ secretString: "v" }),
      })
    );
  });
});

describe("useDeleteSecret", () => {
  it("calls api with DELETE method, id in path, force=false by default", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteSecret(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ id: "my-id" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/secretsmanager/secrets/my-id?force=false",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("calls api with force=true when force requested", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteSecret(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ id: "my-id", force: true });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/secretsmanager/secrets/my-id?force=true",
      expect.objectContaining({ method: "DELETE" })
    );
  });
});

describe("useRestoreSecret", () => {
  it("calls api with POST method and id in path", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useRestoreSecret(), { wrapper: createWrapper() });
    await result.current.mutateAsync("my-id");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/secretsmanager/secrets/my-id/restore",
      expect.objectContaining({ method: "POST" })
    );
  });
});

describe("useRotateSecret", () => {
  it("calls api with POST method, id in path, remaining fields in body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useRotateSecret(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ id: "my-id", rotationLambdaARN: "arn:lambda:fn" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/secretsmanager/secrets/my-id/rotate",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ rotationLambdaARN: "arn:lambda:fn" }),
      })
    );
  });
});

describe("usePutSecretValue", () => {
  it("calls api with POST method, id in path, remaining fields in body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => usePutSecretValue(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ id: "my-id", secretString: "v" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/secretsmanager/secrets/my-id/value",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ secretString: "v" }),
      })
    );
  });
});

describe("useRandomPassword", () => {
  it("calls api with POST method and serialized body", async () => {
    mockApi.mockResolvedValueOnce({ randomPassword: "abc" });
    const { result } = renderHook(() => useRandomPassword(), { wrapper: createWrapper() });
    const body = { length: 32 };
    await result.current.mutateAsync(body);
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/secretsmanager/random-password",
      expect.objectContaining({ method: "POST", body: JSON.stringify(body) })
    );
  });
});
