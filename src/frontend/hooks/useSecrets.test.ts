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
  useSecretResourcePolicy,
  usePutSecretResourcePolicy,
  useDeleteSecretResourcePolicy,
  useBatchGetSecretValue,
  useUpdateSecretVersionStage,
  useCancelSecretRotation,
  useReplicateSecret,
  useRemoveSecretReplicaRegions,
  useStopSecretReplication,
  useValidateSecretResourcePolicy,
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

describe("useSecretResourcePolicy", () => {
  it("fetches the policy with encoded id", async () => {
    mockApi.mockResolvedValueOnce({ resourcePolicy: "{}" });
    const { result } = renderHook(() => useSecretResourcePolicy("my secret"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/secretsmanager/secrets/my%20secret/resource-policy");
  });

  it("is disabled without an id", () => {
    const { result } = renderHook(() => useSecretResourcePolicy(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe("idle");
  });
});

describe("usePutSecretResourcePolicy", () => {
  it("puts the policy", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => usePutSecretResourcePolicy(), { wrapper: createWrapper() });
    result.current.mutate({ secretId: "s1", resourcePolicy: "{}" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/secretsmanager/secrets/s1/resource-policy", {
      method: "PUT",
      body: JSON.stringify({ resourcePolicy: "{}" }),
    });
  });
});

describe("useDeleteSecretResourcePolicy", () => {
  it("deletes the policy", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteSecretResourcePolicy(), { wrapper: createWrapper() });
    result.current.mutate("s1");
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/secretsmanager/secrets/s1/resource-policy", {
      method: "DELETE",
    });
  });
});

describe("useBatchGetSecretValue", () => {
  it("posts the batch request", async () => {
    mockApi.mockResolvedValueOnce({ secretValues: [] });
    const { result } = renderHook(() => useBatchGetSecretValue(), { wrapper: createWrapper() });
    result.current.mutate({ secretIdList: ["s1"] });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/secretsmanager/secrets/batch-value", {
      method: "POST",
      body: JSON.stringify({ secretIdList: ["s1"] }),
    });
  });
});

describe("useUpdateSecretVersionStage", () => {
  it("posts the stage update", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useUpdateSecretVersionStage(), { wrapper: createWrapper() });
    result.current.mutate({ secretId: "s1", versionStage: "AWSCURRENT", moveToVersionId: "v2" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/secretsmanager/secrets/s1/version-stage", {
      method: "POST",
      body: JSON.stringify({ versionStage: "AWSCURRENT", moveToVersionId: "v2", removeFromVersionId: undefined }),
    });
  });
});

describe("secrets rotation/replication/policy hooks (E.9 batch 2)", () => {
  it("useCancelSecretRotation calls POST cancel-rotate", async () => {
    mockApi.mockResolvedValueOnce({ cancelled: true });
    const { result } = renderHook(() => useCancelSecretRotation(), { wrapper: createWrapper() });
    await result.current.mutateAsync("s1");
    expect(mockApi).toHaveBeenCalledWith("/aws/secretsmanager/secrets/s1/cancel-rotate", { method: "POST" });
  });

  it("useReplicateSecret calls POST replicate with body", async () => {
    mockApi.mockResolvedValueOnce({ arn: "arn:s1" });
    const { result } = renderHook(() => useReplicateSecret(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ id: "s1", regions: [{ region: "us-west-2" }], force: true });
    expect(mockApi).toHaveBeenCalledWith("/aws/secretsmanager/secrets/s1/replicate", {
      method: "POST",
      body: JSON.stringify({ regions: [{ region: "us-west-2" }], force: true }),
    });
  });

  it("useRemoveSecretReplicaRegions calls POST replication/remove", async () => {
    mockApi.mockResolvedValueOnce({ arn: "arn:s1" });
    const { result } = renderHook(() => useRemoveSecretReplicaRegions(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ id: "s1", regions: ["us-west-2"] });
    expect(mockApi).toHaveBeenCalledWith("/aws/secretsmanager/secrets/s1/replication/remove", {
      method: "POST",
      body: JSON.stringify({ regions: ["us-west-2"] }),
    });
  });

  it("useStopSecretReplication calls POST replication/stop", async () => {
    mockApi.mockResolvedValueOnce({ stopped: true });
    const { result } = renderHook(() => useStopSecretReplication(), { wrapper: createWrapper() });
    await result.current.mutateAsync("s1");
    expect(mockApi).toHaveBeenCalledWith("/aws/secretsmanager/secrets/s1/replication/stop", { method: "POST" });
  });

  it("useValidateSecretResourcePolicy calls POST validate-policy", async () => {
    mockApi.mockResolvedValueOnce({ policyValidationPassed: true });
    const { result } = renderHook(() => useValidateSecretResourcePolicy(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ id: "s1", resourcePolicy: "{}" });
    expect(mockApi).toHaveBeenCalledWith("/aws/secretsmanager/secrets/s1/validate-policy", {
      method: "POST",
      body: JSON.stringify({ resourcePolicy: "{}" }),
    });
  });
});
