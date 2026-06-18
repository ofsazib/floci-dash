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
