// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createWrapper } from "../../test/helpers";

const mockApi = vi.hoisted(() => vi.fn());
vi.mock("../lib/client", () => ({ api: (...args: any[]) => mockApi(...args) }));
vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual: any = await importOriginal();
  return { ...actual, useQueryClient: () => ({ invalidateQueries: vi.fn() }) };
});

import {
  useRGTResources,
  useRGTTagKeys,
  useRGTTagValues,
  useRGTTagResources,
  useRGTUntagResources,
} from "./useRGT";

beforeEach(() => mockApi.mockReset());

const RESOURCE_ARN = "arn:aws:s3:::my-bucket";

describe("useRGTResources", () => {
  it("calls api with correct URL (no filters)", async () => {
    mockApi.mockResolvedValueOnce({ resourceTagMappingList: [] });
    const { result } = renderHook(() => useRGTResources(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/tagging/resources");
  });

  it("calls api with tagFilters param", async () => {
    mockApi.mockResolvedValueOnce({ resourceTagMappingList: [] });
    const filters = [{ key: "Env", values: ["prod"] }];
    const { result } = renderHook(() => useRGTResources({ tagFilters: filters }), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/tagging/resources?tagFilters=${encodeURIComponent(JSON.stringify(filters))}`
    );
  });

  it("calls api with resourceTypeFilters param", async () => {
    mockApi.mockResolvedValueOnce({ resourceTagMappingList: [] });
    const { result } = renderHook(() => useRGTResources({ resourceTypeFilters: ["AWS::S3::Bucket", "AWS::EC2::Instance"] }), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      "/aws/tagging/resources?resourceTypeFilters=AWS%3A%3AS3%3A%3ABucket&resourceTypeFilters=AWS%3A%3AEC2%3A%3AInstance"
    );
  });
});

describe("useRGTTagKeys", () => {
  it("calls api with correct URL", async () => {
    mockApi.mockResolvedValueOnce({ tagKeys: [] });
    const { result } = renderHook(() => useRGTTagKeys(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/tagging/tag-keys");
  });
});

describe("useRGTTagValues", () => {
  it("does NOT call api when key is null", () => {
    renderHook(() => useRGTTagValues(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with key param when provided", async () => {
    mockApi.mockResolvedValueOnce({ tagValues: [] });
    const { result } = renderHook(() => useRGTTagValues("Environment"), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/tagging/tag-values?key=Environment");
  });
});

describe("useRGTTagResources", () => {
  it("calls api with POST and correct URL", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useRGTTagResources(), { wrapper: createWrapper() });
    const body = { resourceARNList: [RESOURCE_ARN], tags: { Env: "prod" } };
    await result.current.mutateAsync(body);
    expect(mockApi).toHaveBeenCalledWith("/aws/tagging/tag", {
      method: "POST",
      body: JSON.stringify(body),
    });
  });
});

describe("useRGTUntagResources", () => {
  it("calls api with POST and correct URL", async () => {
    mockApi.mockResolvedValueOnce({});
    const { result } = renderHook(() => useRGTUntagResources(), { wrapper: createWrapper() });
    const body = { resourceARNList: [RESOURCE_ARN], tagKeys: ["Env"] };
    await result.current.mutateAsync(body);
    expect(mockApi).toHaveBeenCalledWith("/aws/tagging/untag", {
      method: "POST",
      body: JSON.stringify(body),
    });
  });
});
