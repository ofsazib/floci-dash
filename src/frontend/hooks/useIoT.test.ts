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
  useThings,
  useCreateThing,
  useDeleteThing,
  useThingTypes,
  useCreateThingType,
  useDeleteThingType,
  useCertificates,
  useCreateKeysAndCertificate,
  useUpdateCertificateStatus,
  useDeleteCertificate,
  usePolicies,
  useCreatePolicy,
  useDeletePolicy,
  usePolicyVersions,
  useCreatePolicyVersion,
  useTopicRules,
  useCreateTopicRule,
  useDeleteTopicRule,
  useEnableTopicRule,
  useDisableTopicRule,
  useShadow,
  useUpdateShadow,
  useEndpoint,
  useThingJobs,
} from "./useIoT";

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockApi.mockReset();
});

// ─── Endpoint ────────────────────────────────────────

describe("useEndpoint", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ endpointAddress: "test.iot.us-east-1.amazonaws.com" });
    const { result } = renderHook(() => useEndpoint(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/iot/endpoint");
  });
});

// ─── Things ──────────────────────────────────────────

describe("useThings", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ things: [], total: 0 });
    const { result } = renderHook(() => useThings(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/iot/things");
  });
});

describe("useCreateThing", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateThing(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ thingName: "my-device" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/iot/things",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("invalidates things query on success", async () => {
    mockApi.mockResolvedValueOnce({});
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useCreateThing(), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: qc }, children),
    });
    await result.current.mutateAsync({ thingName: "my-device" });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["aws", "iot", "things"] });
  });
});

describe("useDeleteThing", () => {
  it("calls api with DELETE method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteThing(), { wrapper: createWrapper() });
    await result.current.mutateAsync("my-device");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/iot/things/my-device",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

// ─── Thing Types ─────────────────────────────────────

describe("useThingTypes", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ thingTypes: [], total: 0 });
    const { result } = renderHook(() => useThingTypes(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/iot/thing-types");
  });
});

describe("useCreateThingType", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateThingType(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ thingTypeName: "Sensor" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/iot/thing-types",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

describe("useDeleteThingType", () => {
  it("calls api with DELETE method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteThingType(), { wrapper: createWrapper() });
    await result.current.mutateAsync("Sensor");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/iot/thing-types/Sensor",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

// ─── Certificates ────────────────────────────────────

describe("useCertificates", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ certificates: [], total: 0 });
    const { result } = renderHook(() => useCertificates(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/iot/certificates");
  });
});

describe("useCreateKeysAndCertificate", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateKeysAndCertificate(), { wrapper: createWrapper() });
    await result.current.mutateAsync();
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/iot/certificates/keys-and-certificate",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("invalidates certificates query on success", async () => {
    mockApi.mockResolvedValueOnce({});
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useCreateKeysAndCertificate(), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: qc }, children),
    });
    await result.current.mutateAsync();
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["aws", "iot", "certificates"] });
  });
});

describe("useUpdateCertificateStatus", () => {
  it("calls api with PUT method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useUpdateCertificateStatus(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ certificateId: "cert-123", newStatus: "ACTIVE" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/iot/certificates/cert-123",
      expect.objectContaining({ method: "PUT" }),
    );
  });
});

describe("useDeleteCertificate", () => {
  it("calls api with DELETE method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteCertificate(), { wrapper: createWrapper() });
    await result.current.mutateAsync("cert-123");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/iot/certificates/cert-123",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

// ─── Policies ────────────────────────────────────────

describe("usePolicies", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ policies: [], total: 0 });
    const { result } = renderHook(() => usePolicies(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/iot/policies");
  });
});

describe("useCreatePolicy", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreatePolicy(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ policyName: "MyPolicy", policyDocument: "{}" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/iot/policies",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("invalidates policies query on success", async () => {
    mockApi.mockResolvedValueOnce({});
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useCreatePolicy(), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: qc }, children),
    });
    await result.current.mutateAsync({ policyName: "MyPolicy", policyDocument: "{}" });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["aws", "iot", "policies"] });
  });
});

describe("useDeletePolicy", () => {
  it("calls api with DELETE method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeletePolicy(), { wrapper: createWrapper() });
    await result.current.mutateAsync("MyPolicy");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/iot/policies/MyPolicy",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

// ─── Policy Versions ─────────────────────────────────

describe("usePolicyVersions", () => {
  it("does NOT call api when policyName is null", () => {
    renderHook(() => usePolicyVersions(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with policyName in path", async () => {
    mockApi.mockResolvedValueOnce({ policyVersions: [], total: 0 });
    const { result } = renderHook(() => usePolicyVersions("MyPolicy"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/iot/policies/MyPolicy/versions");
  });
});

// ─── Topic Rules ─────────────────────────────────────

describe("useTopicRules", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ rules: [], total: 0 });
    const { result } = renderHook(() => useTopicRules(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/iot/topic-rules");
  });
});

describe("useCreateTopicRule", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreateTopicRule(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ ruleName: "my_rule", topicRulePayload: { sql: "SELECT * FROM 'device/#'", actions: [] } });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/iot/topic-rules",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

describe("useDeleteTopicRule", () => {
  it("calls api with DELETE method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDeleteTopicRule(), { wrapper: createWrapper() });
    await result.current.mutateAsync("my_rule");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/iot/topic-rules/my_rule",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

describe("useEnableTopicRule", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useEnableTopicRule(), { wrapper: createWrapper() });
    await result.current.mutateAsync("my_rule");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/iot/topic-rules/my_rule/enable",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

describe("useDisableTopicRule", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useDisableTopicRule(), { wrapper: createWrapper() });
    await result.current.mutateAsync("my_rule");
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/iot/topic-rules/my_rule/disable",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

// ─── Shadows ─────────────────────────────────────────

describe("useShadow", () => {
  it("does NOT call api when thingName is null", () => {
    renderHook(() => useShadow(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with thingName in path", async () => {
    mockApi.mockResolvedValueOnce({ shadow: { state: { reported: { color: "green" } } } });
    const { result } = renderHook(() => useShadow("my-device"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/iot/things/my-device/shadow");
  });
});

describe("useUpdateShadow", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useUpdateShadow(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ thingName: "my-device", state: { desired: { color: "green" } } });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/iot/things/my-device/shadow",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

// ─── Jobs ────────────────────────────────────────────

describe("useThingJobs", () => {
  it("does NOT call api when thingName is null", () => {
    renderHook(() => useThingJobs(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with thingName in path", async () => {
    mockApi.mockResolvedValueOnce({ executionSummaries: [] });
    const { result } = renderHook(() => useThingJobs("my-device"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/iot/things/my-device/jobs");
  });
});
