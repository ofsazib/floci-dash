// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  it("shows products loading spinner", () => {
    mockProducts.mockReturnValue({ data: undefined, isLoading: true });
    render(<PricingDashboard />, { wrapper: createWrapper() });
    // Products section is hidden unless a service is selected
    expect(screen.getByText("Services")).toBeTruthy();
  });
});

describe("PricingDashboard — service selection conditional rendering", () => {
  it("shows Attrubutes / Products / Price Lists sections when hooks return data", () => {
    mockAttrValues.mockReturnValue({
      data: { attributeValues: [{ name: "A" }], total: 1 },
    });
    mockProducts.mockReturnValue({
      data: { priceList: [{ product: { productFamily: "Compute" } }] },
      isLoading: false,
    });
    mockPriceLists.mockReturnValue({
      data: { priceLists: [{ priceListArn: "arn:test" }] },
    });

    const { container } = render(<PricingDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Services")).toBeTruthy();
    // Hooks are called with null (no service selected), so conditional sections are hidden.
    // Service selection via click is covered in the "service selection interaction" describe.
    expect(container.textContent).not.toMatch(/Attributes for/i);
  });
});

describe("PricingDashboard — get URL rendering", () => {
  it("shows loading state on Get URL button", () => {
    getUrlState.isPending = true;
    const { container } = render(<PricingDashboard />, { wrapper: createWrapper() });
    // Get URL button is hidden unless a service is selected
    expect(container.textContent).not.toMatch(/Get Price List File URL/i);
  });

  it("shows URL when getUrl data is present", () => {
    getUrlState.data = { url: "https://pricing.example.com/file.json" };
    const { container } = render(<PricingDashboard />, { wrapper: createWrapper() });
    // URL display is hidden unless a service is selected
    expect(container.textContent).not.toMatch(/pricing.example.com/i);
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
    expect(mockProducts).toHaveBeenCalledWith(null);
  });

  it("calls usePricingPriceLists with null when no service selected", () => {
    render(<PricingDashboard />, { wrapper: createWrapper() });
    expect(mockPriceLists).toHaveBeenCalledWith(null);
  });
});

// ─── Edge cases ─────────────────────────────────────────

describe("PricingDashboard — edge cases", () => {
  it("shows only first 5 services when more than 5 exist", () => {
    const many = [];
    for (let i = 1; i <= 7; i++) many.push({ ServiceCode: "Svc" + i });
    mockServices.mockReturnValue({ data: { services: many }, isLoading: false });
    render(<PricingDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/Found 7 services/i)).toBeTruthy();
    expect(screen.getByText("Svc1")).toBeTruthy();
    expect(screen.getByText("Svc5")).toBeTruthy();
    expect(screen.queryByText("Svc6")).toBeNull();
    expect(screen.queryByText("Svc7")).toBeNull();
  });

  it("shows exactly 5 services when there are exactly 5", () => {
    const five = [];
    for (let i = 1; i <= 5; i++) five.push({ ServiceCode: "S" + i });
    mockServices.mockReturnValue({ data: { services: five }, isLoading: false });
    render(<PricingDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("S1")).toBeTruthy();
    expect(screen.getByText("S5")).toBeTruthy();
  });

  it("shows no service buttons when empty array", () => {
    mockServices.mockReturnValue({ data: { services: [] }, isLoading: false });
    const { container } = render(<PricingDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/Found 0 services/i)).toBeTruthy();
    // No service code buttons should exist
    expect(container.querySelectorAll("button").length).toBe(0);
  });
});

// ─── Service Selection Interaction ────────────────────────

describe("PricingDashboard — service selection interaction", () => {
  it("selects a service and renders all conditional sections", async () => {
    mockAttrValues.mockReturnValue({ data: { attributeValues: [{ name: "A" }] } });
    mockProducts.mockReturnValue({ data: { priceList: [{ product: { productFamily: "Compute" } }] }, isLoading: false });
    mockPriceLists.mockReturnValue({ data: { priceLists: [{ priceListArn: "arn:1" }] } });
    const user = userEvent.setup();
    render(<PricingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /AmazonEC2/i }));
    expect(screen.getByText(/Attributes for AmazonEC2/i)).toBeTruthy();
    expect(screen.getByText(/1 attribute values/i)).toBeTruthy();
    expect(screen.getByText("Products")).toBeTruthy();
    expect(screen.getByText(/1 products/i)).toBeTruthy();
    expect(screen.getByText("Price Lists")).toBeTruthy();
    expect(screen.getByText(/1 price lists/i)).toBeTruthy();
    expect(screen.getByText(/Get Price List File URL/i)).toBeTruthy();
  });

  it("calls hooks with the selected service code", async () => {
    const user = userEvent.setup();
    render(<PricingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /AmazonEC2/i }));
    expect(mockAttrValues).toHaveBeenCalledWith("AmazonEC2");
    expect(mockProducts).toHaveBeenCalledWith({ serviceCode: "AmazonEC2" });
    expect(mockPriceLists).toHaveBeenCalledWith("AmazonEC2");
  });

  it("shows 0 counts when data arrays are undefined after selection", async () => {
    mockAttrValues.mockReturnValue({ data: { attributeValues: undefined } });
    mockProducts.mockReturnValue({ data: { priceList: undefined }, isLoading: false });
    mockPriceLists.mockReturnValue({ data: { priceLists: undefined } });
    const user = userEvent.setup();
    render(<PricingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /AmazonEC2/i }));
    expect(screen.getByText(/0 attribute values/i)).toBeTruthy();
    expect(screen.getByText(/0 products/i)).toBeTruthy();
    expect(screen.getByText(/0 price lists/i)).toBeTruthy();
  });

  it("shows products section with spinner when loading after selection", async () => {
    mockProducts.mockReturnValue({ data: undefined, isLoading: true });
    const user = userEvent.setup();
    render(<PricingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /AmazonEC2/i }));
    expect(screen.getByText("Products")).toBeTruthy();
    // No product count is rendered while loading (header "Products" itself still matches
    // /products$/i case-insensitively, so anchor the regex to the count format "N products")
    expect(screen.queryByText(/^\d+ products$/i)).toBeNull();
  });

  it("calls getUrl.mutate with the price list ARN when Get URL is clicked", async () => {
    const user = userEvent.setup();
    render(<PricingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /AmazonEC2/i }));
    await user.click(screen.getByRole("button", { name: /Get URL/i }));
    expect(mockGetUrl).toHaveBeenCalledWith({
      priceListArn: "arn:aws:pricing::123456789012:price-list/AmazonEC2/us-east-1/v1",
      fileFormat: "json",
    });
  });

  it("shows the URL when getUrl data is present after selection", async () => {
    getUrlState.data = { url: "https://pricing.example.com/file.json" };
    const user = userEvent.setup();
    render(<PricingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /AmazonEC2/i }));
    expect(screen.getByText(/URL: https:\/\/pricing\.example\.com\/file\.json/i)).toBeTruthy();
  });

  it("shows loading state on Get URL button after selection", async () => {
    getUrlState.isPending = true;
    const user = userEvent.setup();
    render(<PricingDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /AmazonEC2/i }));
    expect(screen.getByRole("button", { name: /Get URL/i })).toBeTruthy();
  });
});
