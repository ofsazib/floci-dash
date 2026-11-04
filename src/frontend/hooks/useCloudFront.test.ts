// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createWrapper } from "../../test/helpers";

const mockApi = vi.hoisted(() => vi.fn());

vi.mock("../lib/client", () => ({
  api: (...args: any[]) => mockApi(...args),
}));

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: vi.fn(),
    }),
  };
});

import {
  useCloudFrontDistributions,
  useCloudFrontDistribution,
  useCreateCloudFrontDistribution,
  useDeleteCloudFrontDistribution,
  useCloudFrontInvalidations,
  useCreateCloudFrontInvalidation,
  useCloudFrontCachePolicies,
  useCloudFrontOriginAccessControls,
  useCloudFrontFunctions,
  useCloudFrontTags,
  useCopyCloudFrontDistribution,
  useCFMonitoringSubscription,
  usePutCFMonitoringSubscription,
  useCFRealtimeLogConfigs,
  useCreateCFRealtimeLogConfig,
  useDeleteCFRealtimeLogConfig,
  useCFContinuousDeploymentPolicies,
  useDeleteCFContinuousDeploymentPolicy,
  useCFSimpleFamily,
  useCreateCFSimpleFamily,
  useDeleteCFSimpleFamily,
} from "./useCloudFront";

beforeEach(() => {
  mockApi.mockReset();
});

describe("useCloudFront hooks", () => {
  describe("useCloudFrontDistributions", () => {
    it("calls correct URL", async () => {
      mockApi.mockResolvedValueOnce({ distributions: [], total: 0 });
      const { result } = renderHook(() => useCloudFrontDistributions(), {
        wrapper: createWrapper(),
      });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi).toHaveBeenCalledWith("/aws/cloudfront/distributions");
    });
  });

  describe("useCloudFrontDistribution", () => {
    it("calls correct URL when id provided", async () => {
      mockApi.mockResolvedValueOnce({ distribution: {}, eTag: "" });
      const { result } = renderHook(() => useCloudFrontDistribution("E123"), {
        wrapper: createWrapper(),
      });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi).toHaveBeenCalledWith("/aws/cloudfront/distributions/E123");
    });

    it("disabled when id is null", () => {
      const { result } = renderHook(() => useCloudFrontDistribution(null), {
        wrapper: createWrapper(),
      });
      expect(result.current.fetchStatus).toBe("idle");
    });
  });

  describe("useCreateCloudFrontDistribution", () => {
    it("calls POST with correct params", async () => {
      mockApi.mockResolvedValueOnce({ distribution: {} });
      const { result } = renderHook(() => useCreateCloudFrontDistribution(), {
        wrapper: createWrapper(),
      });
      await result.current.mutateAsync({ distributionConfig: { enabled: true } });
      expect(mockApi).toHaveBeenCalledWith("/aws/cloudfront/distributions", {
        method: "POST",
        body: JSON.stringify({ distributionConfig: { enabled: true } }),
      });
    });
  });

  describe("useDeleteCloudFrontDistribution", () => {
    it("calls DELETE with If-Match header", async () => {
      mockApi.mockResolvedValueOnce({ deleted: true });
      const { result } = renderHook(() => useDeleteCloudFrontDistribution(), {
        wrapper: createWrapper(),
      });
      await result.current.mutateAsync({ id: "E123", eTag: "ETAG" });
      expect(mockApi).toHaveBeenCalledWith("/aws/cloudfront/distributions/E123", {
        method: "DELETE",
        headers: { "If-Match": "ETAG" },
      });
    });
  });

  describe("useCloudFrontInvalidations", () => {
    it("calls correct URL when distributionId provided", async () => {
      mockApi.mockResolvedValueOnce({ invalidations: [], total: 0 });
      const { result } = renderHook(() => useCloudFrontInvalidations("E123"), {
        wrapper: createWrapper(),
      });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi).toHaveBeenCalledWith("/aws/cloudfront/distributions/E123/invalidations");
    });

    it("disabled when distributionId is null", () => {
      const { result } = renderHook(() => useCloudFrontInvalidations(null), {
        wrapper: createWrapper(),
      });
      expect(result.current.fetchStatus).toBe("idle");
    });
  });

  describe("useCreateCloudFrontInvalidation", () => {
    it("calls POST with correct params", async () => {
      mockApi.mockResolvedValueOnce({ invalidation: {} });
      const { result } = renderHook(() => useCreateCloudFrontInvalidation("E123"), {
        wrapper: createWrapper(),
      });
      await result.current.mutateAsync({ paths: ["/api/*"] });
      expect(mockApi).toHaveBeenCalledWith("/aws/cloudfront/distributions/E123/invalidations", {
        method: "POST",
        body: JSON.stringify({ paths: ["/api/*"] }),
      });
    });
  });

  describe("useCloudFrontCachePolicies", () => {
    it("calls correct URL", async () => {
      mockApi.mockResolvedValueOnce({ cachePolicies: [], total: 0 });
      const { result } = renderHook(() => useCloudFrontCachePolicies(), {
        wrapper: createWrapper(),
      });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi).toHaveBeenCalledWith("/aws/cloudfront/cache-policies");
    });
  });

  describe("useCloudFrontOriginAccessControls", () => {
    it("calls correct URL", async () => {
      mockApi.mockResolvedValueOnce({ originAccessControls: [], total: 0 });
      const { result } = renderHook(() => useCloudFrontOriginAccessControls(), {
        wrapper: createWrapper(),
      });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi).toHaveBeenCalledWith("/aws/cloudfront/origin-access-controls");
    });
  });

  describe("useCloudFrontFunctions", () => {
    it("calls correct URL", async () => {
      mockApi.mockResolvedValueOnce({ functions: [], total: 0 });
      const { result } = renderHook(() => useCloudFrontFunctions(), {
        wrapper: createWrapper(),
      });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi).toHaveBeenCalledWith("/aws/cloudfront/functions");
    });
  });

  describe("useCloudFrontTags", () => {
    it("calls correct URL when resource provided", async () => {
      mockApi.mockResolvedValueOnce({ tags: [] });
      const { result } = renderHook(
        () => useCloudFrontTags("arn:aws:cloudfront::123:distribution/E123"),
        { wrapper: createWrapper() }
      );
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi).toHaveBeenCalledWith(
        "/aws/cloudfront/tags?resource=arn%3Aaws%3Acloudfront%3A%3A123%3Adistribution%2FE123"
      );
    });

    it("disabled when resource is null", () => {
      const { result } = renderHook(() => useCloudFrontTags(null), {
        wrapper: createWrapper(),
      });
      expect(result.current.fetchStatus).toBe("idle");
    });
  });
});

  describe("useCopyCloudFrontDistribution", () => {
    it("posts staging flag to copy endpoint", async () => {
      mockApi.mockResolvedValueOnce({ distribution: { Id: "E-COPY" } });
      const { result } = renderHook(() => useCopyCloudFrontDistribution("E123"), { wrapper: createWrapper() });
      await result.current.mutateAsync({ staging: true, ifMatch: "ETAG" });
      expect(mockApi).toHaveBeenCalledWith("/aws/cloudfront/distributions/E123/copy", {
        method: "POST",
        body: JSON.stringify({ staging: true, ifMatch: "ETAG" }),
      });
    });
  });

  describe("useCFMonitoringSubscription", () => {
    it("disabled when distribution id is null", async () => {
      const { result } = renderHook(() => useCFMonitoringSubscription(null), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
      expect(mockApi).not.toHaveBeenCalled();
    });

    it("calls correct URL", async () => {
      mockApi.mockResolvedValueOnce({ monitoringSubscription: null });
      const { result } = renderHook(() => useCFMonitoringSubscription("E123"), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi).toHaveBeenCalledWith("/aws/cloudfront/distributions/E123/monitoring-subscription");
    });
  });

  describe("usePutCFMonitoringSubscription", () => {
    it("puts monitoring subscription", async () => {
      mockApi.mockResolvedValueOnce({ monitoringSubscription: {}, updated: true });
      const { result } = renderHook(() => usePutCFMonitoringSubscription("E123"), { wrapper: createWrapper() });
      const sub = { RealtimeMetricsSubscriptionConfig: { RealtimeMetricsSubscriptionStatus: "Enabled" } };
      await result.current.mutateAsync(sub);
      expect(mockApi).toHaveBeenCalledWith("/aws/cloudfront/distributions/E123/monitoring-subscription", {
        method: "PUT",
        body: JSON.stringify({ monitoringSubscription: sub }),
      });
    });
  });

  describe("useCFRealtimeLogConfigs", () => {
    it("calls correct URL", async () => {
      mockApi.mockResolvedValueOnce({ realtimeLogConfigs: [], total: 0 });
      const { result } = renderHook(() => useCFRealtimeLogConfigs(), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi).toHaveBeenCalledWith("/aws/cloudfront/realtime-log-configs");
    });
  });

  describe("useCreateCFRealtimeLogConfig", () => {
    it("posts name and sampling rate", async () => {
      mockApi.mockResolvedValueOnce({ realtimeLogConfig: {} });
      const { result } = renderHook(() => useCreateCFRealtimeLogConfig(), { wrapper: createWrapper() });
      await result.current.mutateAsync({ name: "rt", samplingRate: 50000 });
      expect(mockApi).toHaveBeenCalledWith("/aws/cloudfront/realtime-log-configs", {
        method: "POST",
        body: JSON.stringify({ name: "rt", samplingRate: 50000 }),
      });
    });
  });

  describe("useDeleteCFRealtimeLogConfig", () => {
    it("sends DELETE with encoded name", async () => {
      mockApi.mockResolvedValueOnce({ deleted: true });
      const { result } = renderHook(() => useDeleteCFRealtimeLogConfig(), { wrapper: createWrapper() });
      await result.current.mutateAsync("rt-log");
      expect(mockApi).toHaveBeenCalledWith("/aws/cloudfront/realtime-log-configs/rt-log", { method: "DELETE" });
    });
  });

  describe("useCFContinuousDeploymentPolicies", () => {
    it("calls correct URL", async () => {
      mockApi.mockResolvedValueOnce({ policies: [], total: 0 });
      const { result } = renderHook(() => useCFContinuousDeploymentPolicies(), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi).toHaveBeenCalledWith("/aws/cloudfront/continuous-deployment-policies");
    });
  });

  describe("useDeleteCFContinuousDeploymentPolicy", () => {
    it("sends DELETE with ifMatch query param", async () => {
      mockApi.mockResolvedValueOnce({ deleted: true });
      const { result } = renderHook(() => useDeleteCFContinuousDeploymentPolicy(), { wrapper: createWrapper() });
      await result.current.mutateAsync({ id: "CDP1", ifMatch: "ETAG" });
      expect(mockApi).toHaveBeenCalledWith("/aws/cloudfront/continuous-deployment-policies/CDP1?ifMatch=ETAG", { method: "DELETE" });
    });
  });

  describe.each([
    ["field-level-encryption-configs"],
    ["field-level-encryption-profiles"],
    ["streaming-distributions"],
  ])("simple family %s", (family) => {
    it("lists family and unwraps dynamic key", async () => {
      mockApi.mockResolvedValueOnce({ [family]: [{ Id: "X1" }], total: 1 });
      const { result } = renderHook(() => useCFSimpleFamily(family), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApi).toHaveBeenCalledWith(`/aws/cloudfront/${family}`);
      expect(result.current.data).toEqual({ items: [{ Id: "X1" }], total: 1 });
    });

    it("unwraps to empty items when key missing", async () => {
      mockApi.mockResolvedValueOnce({ total: 0 });
      const { result } = renderHook(() => useCFSimpleFamily(family), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual({ items: [], total: 0 });
    });

    it("creates family config", async () => {
      mockApi.mockResolvedValueOnce({});
      const { result } = renderHook(() => useCreateCFSimpleFamily(family), { wrapper: createWrapper() });
      await result.current.mutateAsync({ Name: "x" });
      expect(mockApi).toHaveBeenCalledWith(`/aws/cloudfront/${family}`, {
        method: "POST",
        body: JSON.stringify({ config: { Name: "x" } }),
      });
    });

    it("deletes family item with ifMatch", async () => {
      mockApi.mockResolvedValueOnce({ deleted: true });
      const { result } = renderHook(() => useDeleteCFSimpleFamily(family), { wrapper: createWrapper() });
      await result.current.mutateAsync({ id: "X1", ifMatch: "ETAG" });
      expect(mockApi).toHaveBeenCalledWith(`/aws/cloudfront/${family}/X1?ifMatch=ETAG`, { method: "DELETE" });
    });
  });

// Extra arms (no ifMatch)
describe("useCloudFront — delete without ifMatch", () => {
  it("useDeleteCFContinuousDeploymentPolicy sends empty ifMatch param", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteCFContinuousDeploymentPolicy(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ id: "CDP2" });
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudfront/continuous-deployment-policies/CDP2?ifMatch=", { method: "DELETE" });
  });

  it("useDeleteCFSimpleFamily sends empty ifMatch param", async () => {
    mockApi.mockResolvedValueOnce({ deleted: true });
    const { result } = renderHook(() => useDeleteCFSimpleFamily("field-level-encryption-configs"), { wrapper: createWrapper() });
    await result.current.mutateAsync({ id: "FLE9" });
    expect(mockApi).toHaveBeenCalledWith("/aws/cloudfront/field-level-encryption-configs/FLE9?ifMatch=", { method: "DELETE" });
  });
});
