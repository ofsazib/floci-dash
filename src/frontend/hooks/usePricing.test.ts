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
  usePricingServices,
  usePricingAttributeValues,
  usePricingProducts,
  usePricingPriceLists,
  usePricingPriceListFileUrl,
} from "./usePricing";

beforeEach(() => mockApi.mockReset());

const SERVICE_CODE = "AmazonEC2";

describe("usePricingServices", () => {
  it("calls api with correct URL (no params)", async () => {
    mockApi.mockResolvedValueOnce({ services: [] });
    const { result } = renderHook(() => usePricingServices(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/pricing/services");
  });

  it("calls api with query params when provided", async () => {
    mockApi.mockResolvedValueOnce({ services: [] });
    const { result } = renderHook(() => usePricingServices({ serviceCode: SERVICE_CODE, maxResults: 10 }), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/pricing/services?maxResults=10&serviceCode=AmazonEC2");
  });

  it("calls api with formatVersion param", async () => {
    mockApi.mockResolvedValueOnce({ services: [] });
    const { result } = renderHook(() => usePricingServices({ formatVersion: "aws_v1" }), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/pricing/services?formatVersion=aws_v1");
  });
});

describe("usePricingAttributeValues", () => {
  it("does NOT call api when serviceCode is null", () => {
    renderHook(() => usePricingAttributeValues(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with service code in path", async () => {
    mockApi.mockResolvedValueOnce({ attributeValues: [] });
    const { result } = renderHook(() => usePricingAttributeValues(SERVICE_CODE), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(`/aws/pricing/services/${SERVICE_CODE}/attributes`);
  });
});

describe("usePricingProducts", () => {
  it("does NOT call api when params is null", () => {
    renderHook(() => usePricingProducts(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("does NOT call api when serviceCode is empty", () => {
    renderHook(() => usePricingProducts({ serviceCode: "" }), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with serviceCode and filters", async () => {
    mockApi.mockResolvedValueOnce({ products: [] });
    const params = { serviceCode: SERVICE_CODE, filters: [{ field: "servicecode", value: "AmazonEC2", type: "TERM_MATCH" }] };
    const { result } = renderHook(() => usePricingProducts(params), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/pricing/products?serviceCode=${SERVICE_CODE}&filters=${encodeURIComponent(JSON.stringify(params.filters))}`
    );
  });
});

describe("usePricingPriceLists", () => {
  it("does NOT call api when serviceCode is null", () => {
    renderHook(() => usePricingPriceLists(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });

  it("calls api with serviceCode param", async () => {
    mockApi.mockResolvedValueOnce({ priceLists: [] });
    const { result } = renderHook(() => usePricingPriceLists(SERVICE_CODE), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(`/aws/pricing/price-lists?serviceCode=${SERVICE_CODE}`);
  });
});

describe("usePricingPriceListFileUrl", () => {
  it("calls api with POST and correct URL", async () => {
    mockApi.mockResolvedValueOnce({ url: "https://pricing.us-east-1.amazonaws.com/file.json" });
    const { result } = renderHook(() => usePricingPriceListFileUrl(), { wrapper: createWrapper() });
    const body = { priceListArn: "arn:aws:pricing::123:price-list/abc", fileFormat: "json" };
    await result.current.mutateAsync(body);
    expect(mockApi).toHaveBeenCalledWith("/aws/pricing/price-list-file-url", {
      method: "POST",
      body: JSON.stringify(body),
    });
  });
});
