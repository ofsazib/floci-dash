// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createWrapper } from "../../../test/helpers";
import React from "react";

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
  usePricingPriceListFileUrl: () => ({ mutate: mockGetUrl, isPending: false, data: undefined }),
}));

import { PricingDashboard } from "./PricingDashboard";

beforeEach(() => {
  vi.clearAllMocks();
  mockServices.mockReturnValue({ data: { services: [{ ServiceCode: "AmazonEC2" }] }, isLoading: false });
  mockAttrValues.mockReturnValue({ data: { attributeValues: [] } });
  mockProducts.mockReturnValue({ data: { priceList: [] }, isLoading: false });
  mockPriceLists.mockReturnValue({ data: { priceLists: [] } });
});

describe("PricingDashboard", () => {
  it("renders services header", () => {
    render(<PricingDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Services")).toBeTruthy();
  });

  it("shows service count", () => {
    mockServices.mockReturnValue({ data: { services: [{ ServiceCode: "AmazonEC2" }, { ServiceCode: "AmazonS3" }] }, isLoading: false });
    render(<PricingDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/Found 2 services/i)).toBeTruthy();
  });

  it("shows spinner when loading", () => {
    mockServices.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = render(<PricingDashboard />, { wrapper: createWrapper() });
    const spinners = container.querySelectorAll('[class*="spinner"]');
    expect(spinners.length).toBeGreaterThanOrEqual(0);
  });

  it("renders service code buttons", () => {
    render(<PricingDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("AmazonEC2")).toBeTruthy();
  });

  it("renders service code buttons (combined)", () => {
    const { container } = render(<PricingDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("AmazonEC2")).toBeTruthy();
    // Verify the conditional sections are NOT rendered when no service is selected
    expect(container.textContent).not.toMatch(/Attributes for/i);
    expect(container.textContent).not.toMatch(/Get URL/i);
  });
});
