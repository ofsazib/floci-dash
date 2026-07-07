// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createWrapper } from "../../../test/helpers";
import React from "react";

// ─── vi.hoisted states ─────────────────────────────────

const getUrlState = vi.hoisted(() => ({
  isPending: false,
  data: undefined as any,
}));

// ─── Mock hooks ─────────────────────────────────────────

const mockServices = vi.fn();
const mockAttrValues = vi.fn();
const mockProducts = vi.fn();
const mockPriceLists = vi.fn();
const mockGetUrl = vi.fn();

vi.mock("../../hooks/usePricing", () => ({
  usePricingServices: (...args: any[]) => mockServices(...args),
  usePricingAttributeValues: (...args: any[]) => mockAttrValues(...args),
  usePricingProducts: (...args: any[]) => mockProducts(...args),
  usePricingPriceLists: (...args: any[]) => mockPriceLists(...args),
  usePricingPriceListFileUrl: () => ({
    mutate: mockGetUrl,
    get isPending() { return getUrlState.isPending; },
    get data() { return getUrlState.data; },
  }),
}));

import { PricingDashboard } from "./PricingDashboard";

// ─── Setup ──────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  getUrlState.isPending = false;
  getUrlState.data = undefined;
  mockServices.mockReturnValue({ data: { services: [{ ServiceCode: "AmazonEC2" }] }, isLoading: false });
  mockAttrValues.mockReturnValue({ data: { attributeValues: [] } });
  mockProducts.mockReturnValue({ data: { priceList: [] }, isLoading: false });
  mockPriceLists.mockReturnValue({ data: { priceLists: [] } });
});

// ─── Tests ──────────────────────────────────────────────

describe("PricingDashboard — services", () => {
  it("renders services header", () => {
    render(<PricingDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Services")).toBeTruthy();
  });

  it("shows service count", () => {
    mockServices.mockReturnValue({
      data: { services: [{ ServiceCode: "AmazonEC2" }, { ServiceCode: "AmazonS3" }] },
      isLoading: false,
    });
    render(<PricingDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/Found 2 services/i)).toBeTruthy();
  });

  it("shows spinner when loading services", () => {
    mockServices.mockReturnValue({ data: undefined, isLoading: true });
    render(<PricingDashboard />, { wrapper: createWrapper() });
    // Services header still present; content is a Spinner
    expect(screen.getByText("Services")).toBeTruthy();
  });

  it("renders service code buttons", () => {
    render(<PricingDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("AmazonEC2")).toBeTruthy();
  });

  it("renders multiple service buttons", () => {
    mockServices.mockReturnValue({
      data: {
        services: [
          { ServiceCode: "AmazonEC2" },
          { ServiceCode: "AmazonS3" },
          { ServiceCode: "AWSLambda" },
        ],
      },
      isLoading: false,
    });
    render(<PricingDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("AmazonEC2")).toBeTruthy();
    expect(screen.getByText("AmazonS3")).toBeTruthy();
    expect(screen.getByText("AWSLambda")).toBeTruthy();
  });

  it("shows empty services list", () => {
    mockServices.mockReturnValue({
      data: { services: [] },
      isLoading: false,
    });
    render(<PricingDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/Found 0 services/i)).toBeTruthy();
  });

  it("shows correct count for undefined services array", () => {
    mockServices.mockReturnValue({
      data: { services: undefined },
      isLoading: false,
    });
    render(<PricingDashboard />, { wrapper: createWrapper() });
    // (undefined || []).length = 0
    expect(screen.getByText(/Found 0 services/i)).toBeTruthy();
  });

  it("hides conditional sections when no service selected", () => {
    const { container } = render(<PricingDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("AmazonEC2")).toBeTruthy();
    expect(container.textContent).not.toMatch(/Attributes for/i);
    expect(container.textContent).not.toMatch(/Get Price List File URL/i);
    expect(container.textContent).not.toMatch(/Products/i);
    expect(container.textContent).not.toMatch(/Price Lists/i);
  });
});

describe("PricingDashboard — hook arguments", () => {
  it("calls usePricingServices with default serviceCode", () => {
    render(<PricingDashboard />, { wrapper: createWrapper() });
    expect(mockServices).toHaveBeenCalledWith({ serviceCode: "AmazonEC2" });
  });

  it("calls usePricingAttributeValues with null when no service selected", () => {
    render(<PricingDashboard />, { wrapper: createWrapper() });
    expect(mockAttrValues).toHaveBeenCalledWith(null);
  });

  it("calls usePricingProducts with null when no service selected", () => {
    render(<PricingDashboard />, { wrapper: createWrapper() });
    // selectedServiceCode is null, so passes null
    expect(mockProducts).toHaveBeenCalledWith(null);
  });

  it("calls usePricingPriceLists with null when no service selected", () => {
    render(<PricingDashboard />, { wrapper: createWrapper() });
    expect(mockPriceLists).toHaveBeenCalledWith(null);
  });
});
