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
  useThing,
  useCreateThing,
  useDeleteThing,
  useThingTypes,
  useCreateThingType,
  useDeleteThingType,
  useCertificates,
  useCertificate,
  useCreateKeysAndCertificate,
  useUpdateCertificateStatus,
  useDeleteCertificate,
  usePolicies,
  usePolicy,
  useCreatePolicy,
  useDeletePolicy,
  usePolicyVersions,
  useCreatePolicyVersion,
  useTopicRules,
  useTopicRule,
  useCreateTopicRule,
  useDeleteTopicRule,
  useEnableTopicRule,
  useDisableTopicRule,
  useShadow,
  useUpdateShadow,
  useEndpoint,
  useIoTTags,
  useTagIoTResource,
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

describe("useThing", () => {
  it("does NOT call api when thingName is null", () => {
    renderHook(() => useThing(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with thingName in path", async () => {
    mockApi.mockResolvedValueOnce({ thingName: "my-device", thingTypeName: "Sensor" });
    const { result } = renderHook(() => useThing("my-device"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/iot/things/my-device");
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

  it("invalidates things query on success", async () => {
    mockApi.mockResolvedValueOnce({});
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useDeleteThing(), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: qc }, children),
    });
    await result.current.mutateAsync("my-device");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["aws", "iot", "things"] });
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

  it("invalidates thing-types query on success", async () => {
    mockApi.mockResolvedValueOnce({});
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useCreateThingType(), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: qc }, children),
    });
    await result.current.mutateAsync({ thingTypeName: "Sensor" });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["aws", "iot", "thing-types"] });
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

  it("invalidates thing-types query on success", async () => {
    mockApi.mockResolvedValueOnce({});
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useDeleteThingType(), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: qc }, children),
    });
    await result.current.mutateAsync("Sensor");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["aws", "iot", "thing-types"] });
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

describe("useCertificate", () => {
  it("does NOT call api when certificateId is null", () => {
    renderHook(() => useCertificate(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with certificateId in path", async () => {
    mockApi.mockResolvedValueOnce({ certificateId: "cert-123", status: "ACTIVE" });
    const { result } = renderHook(() => useCertificate("cert-123"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/iot/certificates/cert-123");
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

  it("invalidates certificates query on success", async () => {
    mockApi.mockResolvedValueOnce({});
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useUpdateCertificateStatus(), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: qc }, children),
    });
    await result.current.mutateAsync({ certificateId: "cert-123", newStatus: "ACTIVE" });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["aws", "iot", "certificates"] });
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

  it("invalidates certificates query on success", async () => {
    mockApi.mockResolvedValueOnce({});
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useDeleteCertificate(), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: qc }, children),
    });
    await result.current.mutateAsync("cert-123");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["aws", "iot", "certificates"] });
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

describe("usePolicy", () => {
  it("does NOT call api when policyName is null", () => {
    renderHook(() => usePolicy(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with policyName in path", async () => {
    mockApi.mockResolvedValueOnce({ policyName: "MyPolicy", policyDocument: "{}" });
    const { result } = renderHook(() => usePolicy("MyPolicy"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/iot/policies/MyPolicy");
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

  it("invalidates policies query on success", async () => {
    mockApi.mockResolvedValueOnce({});
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useDeletePolicy(), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: qc }, children),
    });
    await result.current.mutateAsync("MyPolicy");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["aws", "iot", "policies"] });
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

describe("useCreatePolicyVersion", () => {
  it("calls api with POST method", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useCreatePolicyVersion(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ policyName: "MyPolicy", policyDocument: "{}" });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/iot/policies/MyPolicy/versions",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("invalidates policy versions query dynamically on success", async () => {
    mockApi.mockResolvedValueOnce({});
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useCreatePolicyVersion(), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: qc }, children),
    });
    await result.current.mutateAsync({ policyName: "MyPolicy", policyDocument: "{}" });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["aws", "iot", "policies", "MyPolicy", "versions"],
    });
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

describe("useTopicRule", () => {
  it("does NOT call api when ruleName is null", () => {
    renderHook(() => useTopicRule(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with ruleName in path", async () => {
    mockApi.mockResolvedValueOnce({ ruleName: "my_rule", sql: "SELECT * FROM 'device/#'" });
    const { result } = renderHook(() => useTopicRule("my_rule"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/iot/topic-rules/my_rule");
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

  it("invalidates topic-rules query on success", async () => {
    mockApi.mockResolvedValueOnce({});
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useCreateTopicRule(), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: qc }, children),
    });
    await result.current.mutateAsync({ ruleName: "my_rule", topicRulePayload: { sql: "SELECT * FROM 'device/#'", actions: [] } });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["aws", "iot", "topic-rules"] });
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

  it("invalidates topic-rules query on success", async () => {
    mockApi.mockResolvedValueOnce({});
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useDeleteTopicRule(), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: qc }, children),
    });
    await result.current.mutateAsync("my_rule");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["aws", "iot", "topic-rules"] });
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

  it("invalidates topic-rules query on success", async () => {
    mockApi.mockResolvedValueOnce({});
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useEnableTopicRule(), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: qc }, children),
    });
    await result.current.mutateAsync("my_rule");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["aws", "iot", "topic-rules"] });
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

  it("invalidates topic-rules query on success", async () => {
    mockApi.mockResolvedValueOnce({});
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useDisableTopicRule(), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: qc }, children),
    });
    await result.current.mutateAsync("my_rule");
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["aws", "iot", "topic-rules"] });
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

  it("invalidates shadow query dynamically on success", async () => {
    mockApi.mockResolvedValueOnce({});
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useUpdateShadow(), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: qc }, children),
    });
    await result.current.mutateAsync({ thingName: "my-device", state: { desired: { color: "green" } } });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["aws", "iot", "things", "my-device", "shadow"],
    });
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

// ─── Tags ────────────────────────────────────────────

describe("useIoTTags", () => {
  it("does NOT call api when resourceArn is null", () => {
    renderHook(() => useIoTTags(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with resourceArn query param", async () => {
    mockApi.mockResolvedValueOnce({ tags: [{ key: "env", value: "prod" }] });
    const { result } = renderHook(() => useIoTTags("arn:aws:iot:us-east-1::thing/my-device"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/iot/tags?resourceArn=arn%3Aaws%3Aiot%3Aus-east-1%3A%3Athing%2Fmy-device"
    );
  });
});

describe("useTagIoTResource", () => {
  it("calls api with POST method and body", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useTagIoTResource(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ resourceArn: "arn:aws:iot:us-east-1::thing/my-device", tags: [{ key: "env", value: "prod" }] });
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/iot/tags",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ resourceArn: "arn:aws:iot:us-east-1::thing/my-device", tags: [{ key: "env", value: "prod" }] }) }),
    );
  });

  it("invalidates tags query on success", async () => {
    mockApi.mockResolvedValueOnce({});
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");
    const { result } = renderHook(() => useTagIoTResource(), {
      wrapper: ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: qc }, children),
    });
    await result.current.mutateAsync({ resourceArn: "arn:aws:iot:us-east-1::thing/my-device", tags: [{ key: "env", value: "prod" }] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["aws", "iot", "tags", "arn:aws:iot:us-east-1::thing/my-device"] });
  });
});
