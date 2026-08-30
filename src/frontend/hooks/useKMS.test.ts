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
  useKeyPolicy,
  usePutKeyPolicy,
  useSign,
  useVerify,
  useRotateKeyOnDemand,
  useKMSKeyPolicies,
  useKMSRetirableGrants,
  useKMSReEncrypt,
  useKMSGenerateDataKeyNoPlaintext,
  useKMSUpdateAlias,
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

describe("useKeyPolicy", () => {
  it("fetches the key policy", async () => {
    mockApi.mockResolvedValueOnce({ policy: "{}" });
    const { result } = renderHook(() => useKeyPolicy("k1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/kms/keys/k1/policy");
  });

  it("is disabled without a key id", () => {
    const { result } = renderHook(() => useKeyPolicy(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("usePutKeyPolicy", () => {
  it("puts the policy", async () => {
    mockApi.mockResolvedValueOnce({ updated: true });
    const { result } = renderHook(() => usePutKeyPolicy(), { wrapper: createWrapper() });
    result.current.mutate({ keyId: "k1", policy: "{}" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/kms/keys/k1/policy", {
      method: "PUT",
      body: JSON.stringify({ policy: "{}" }),
    });
  });
});

describe("useSign", () => {
  it("posts to the sign endpoint", async () => {
    mockApi.mockResolvedValueOnce({ signature: "abc" });
    const { result } = renderHook(() => useSign(), { wrapper: createWrapper() });
    result.current.mutate({ keyId: "k1", message: "bWVzc2FnZQ==" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/kms/keys/k1/sign", {
      method: "POST",
      body: JSON.stringify({ keyId: "k1", message: "bWVzc2FnZQ==" }),
    });
  });
});

describe("useVerify", () => {
  it("posts to the verify endpoint", async () => {
    mockApi.mockResolvedValueOnce({ signatureValid: true });
    const { result } = renderHook(() => useVerify(), { wrapper: createWrapper() });
    result.current.mutate({ keyId: "k1", message: "bQ==", signature: "c2ln" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/kms/keys/k1/verify", {
      method: "POST",
      body: JSON.stringify({ keyId: "k1", message: "bQ==", signature: "c2ln" }),
    });
  });
});

describe("useRotateKeyOnDemand", () => {
  it("posts rotate-on-demand", async () => {
    mockApi.mockResolvedValueOnce({ keyId: "k1" });
    const { result } = renderHook(() => useRotateKeyOnDemand(), { wrapper: createWrapper() });
    result.current.mutate("k1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/kms/keys/k1/rotate-on-demand", { method: "POST" });
  });
});

// ─── P1 gap audit — KMS extras ───────────────────────────
describe("useKMS extras", () => {
  it("key policies query + disabled arm", async () => {
    mockApi.mockResolvedValueOnce({ policyNames: ["default"], truncate: false });
    const { result } = renderHook(() => useKMSKeyPolicies("k1"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/kms/keys/k1/policies");
    const idle = renderHook(() => useKMSKeyPolicies(null), { wrapper: createWrapper() });
    expect(idle.result.current.fetchStatus).toBe("idle");
  });

  it("retirable grants mutation", async () => {
    mockApi.mockResolvedValueOnce({ grants: [], truncate: false, marker: null });
    const { result } = renderHook(() => useKMSRetirableGrants(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ retiringPrincipal: "arn:r" });
    expect(mockApi).toHaveBeenCalledWith("/aws/kms/keys/retirable", {
      method: "POST",
      body: JSON.stringify({ retiringPrincipal: "arn:r" }),
    });
  });

  it("re-encrypt mutation", async () => {
    mockApi.mockResolvedValueOnce({ ciphertextBlob: "AQICAH", keyId: "k2" });
    const { result } = renderHook(() => useKMSReEncrypt("k1"), { wrapper: createWrapper() });
    await result.current.mutateAsync({ ciphertextBlob: "AQICAH", destinationKeyId: "k2" });
    expect(mockApi).toHaveBeenCalledWith("/aws/kms/keys/k1/re-encrypt", {
      method: "POST",
      body: JSON.stringify({ ciphertextBlob: "AQICAH", destinationKeyId: "k2" }),
    });
  });

  it("data key without plaintext", async () => {
    mockApi.mockResolvedValueOnce({ ciphertextBlob: "AQICAH", keyId: "k1" });
    const { result } = renderHook(() => useKMSGenerateDataKeyNoPlaintext("k1"), { wrapper: createWrapper() });
    await result.current.mutateAsync({ keySpec: "AES_256" });
    expect(mockApi).toHaveBeenCalledWith("/aws/kms/keys/k1/data-key-plaintext-free", {
      method: "POST",
      body: JSON.stringify({ keySpec: "AES_256" }),
    });
  });

  it("update alias", async () => {
    mockApi.mockResolvedValueOnce({ updated: true });
    const { result } = renderHook(() => useKMSUpdateAlias(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ aliasName: "prod-key", targetKeyId: "k2" });
    expect(mockApi).toHaveBeenCalledWith("/aws/kms/aliases/prod-key", {
      method: "PUT",
      body: JSON.stringify({ targetKeyId: "k2" }),
    });
  });
});
