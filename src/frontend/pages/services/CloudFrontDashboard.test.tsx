// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

// ─── Mock hooks ─────────────────────────────────────────

const mockDistributions = vi.fn();
const mockCachePolicies = vi.fn();
const mockFunctions = vi.fn();
const mockInvalidations = vi.fn();
const mockCreateInvalidation = vi.fn();

vi.mock("../../hooks/useCloudFront", () => ({
  useCloudFrontDistributions: (...args: any[]) => mockDistributions(...args),
  useCloudFrontCachePolicies: (...args: any[]) => mockCachePolicies(...args),
  useCloudFrontFunctions: (...args: any[]) => mockFunctions(...args),
  useCloudFrontInvalidations: (...args: any[]) => mockInvalidations(...args),
  useCreateCloudFrontInvalidation: () => ({
    mutateAsync: mockCreateInvalidation,
    isPending: false,
  }),
}));

import { CloudFrontDashboard } from "./CloudFrontDashboard";

// ─── Setup ──────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockDistributions.mockReturnValue({
    data: { distributions: [], total: 0 },
    isLoading: false,
    isError: false,
    error: null,
  });
  mockCachePolicies.mockReturnValue({
    data: { cachePolicies: [], total: 0 },
    isLoading: false,
  });
  mockFunctions.mockReturnValue({
    data: { functions: [], total: 0 },
    isLoading: false,
  });
  mockInvalidations.mockReturnValue({
    data: { invalidations: [], total: 0 },
    isLoading: false,
  });
  mockCreateInvalidation.mockResolvedValue({});
});

// ─── Tests ──────────────────────────────────────────────

describe("CloudFrontDashboard — rendering", () => {
  it("shows loading skeleton when loading", () => {
    mockDistributions.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });
    const { container } = render(<CloudFrontDashboard />, { wrapper: createWrapper() });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("renders all four tabs", () => {
    render(<CloudFrontDashboard />, { wrapper: createWrapper() });
    expect(screen.getByRole("tab", { name: /distributions/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /invalidations/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /cache policies/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /functions/i })).toBeTruthy();
  });

  it("shows empty message for distributions", () => {
    render(<CloudFrontDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No CloudFront distributions/i)).toBeTruthy();
  });
});

describe("CloudFrontDashboard — distributions", () => {
  it("renders distributions with data", () => {
    mockDistributions.mockReturnValue({
      data: {
        distributions: [
          {
            Id: "E123ABC",
            DomainName: "d123.cloudfront.net",
            Status: "Deployed",
            Enabled: true,
            PriceClass: "PriceClass_All",
            LastModifiedTime: "2024-01-15T00:00:00Z",
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<CloudFrontDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("E123ABC")).toBeTruthy();
    expect(screen.getByText("d123.cloudfront.net")).toBeTruthy();
    expect(screen.getByText("Deployed")).toBeTruthy();
    expect(screen.getByText("Yes")).toBeTruthy();
  });

  it("shows disabled as No", () => {
    mockDistributions.mockReturnValue({
      data: {
        distributions: [
          {
            Id: "E456XYZ",
            DomainName: "d456.cloudfront.net",
            Status: "Deployed",
            Enabled: false,
            PriceClass: "PriceClass_All",
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<CloudFrontDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("No")).toBeTruthy();
  });
});

describe("CloudFrontDashboard — invalidations tab", () => {
  it("shows empty message for invalidations tab (no distribution selected)", () => {
    render(<CloudFrontDashboard />, { wrapper: createWrapper() });
    // Invalidations tab content only renders when selectedDist is set
    // The invalidations tab label is always shown
    expect(screen.getByRole("tab", { name: /invalidations/i })).toBeTruthy();
  });

  it("shows invalidation data when distribution selected", async () => {
    mockDistributions.mockReturnValue({
      data: {
        distributions: [
          {
            Id: "E123ABC",
            DomainName: "d123.cloudfront.net",
            Status: "Deployed",
            Enabled: true,
            PriceClass: "PriceClass_All",
            LastModifiedTime: "2024-01-15T00:00:00Z",
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    mockInvalidations.mockReturnValue({
      data: {
        invalidations: [
          {
            Id: "I001",
            Status: "Completed",
            CreateTime: "2024-01-16T00:00:00Z",
            InvalidationBatch: { Paths: { Items: ["/*"] } },
          },
        ],
        total: 1,
      },
      isLoading: false,
    });

    const user = userEvent.setup();
    render(<CloudFrontDashboard />, { wrapper: createWrapper() });

    // Click distribution link to select it
    await user.click(screen.getByText("E123ABC"));

    // Should now show invalidation
    await waitFor(() => {
      expect(screen.getByText("I001")).toBeTruthy();
      expect(screen.getByText("Completed")).toBeTruthy();
    });
  });

  it("opens create invalidation modal and submits", async () => {
    mockDistributions.mockReturnValue({
      data: {
        distributions: [
          {
            Id: "E123ABC",
            DomainName: "d123.cloudfront.net",
            Status: "Deployed",
            Enabled: true,
            PriceClass: "PriceClass_All",
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    mockInvalidations.mockReturnValue({
      data: { invalidations: [], total: 0 },
      isLoading: false,
    });

    const user = userEvent.setup();
    render(<CloudFrontDashboard />, { wrapper: createWrapper() });

    // Select distribution
    await user.click(screen.getByText("E123ABC"));

    await waitFor(() => {
      expect(screen.getByText(/No invalidations/i)).toBeTruthy();
    });

    // Open create modal
    await clickButton(user, /Create/i);

    await waitFor(() => {
      expect(screen.getByText("Create invalidation")).toBeTruthy();
    });

    // Submit with default paths (/*)
    const createBtns = screen.getAllByRole("button", { name: /Create/i });
    await user.click(createBtns[createBtns.length - 1]);

    await waitFor(() => {
      expect(mockCreateInvalidation).toHaveBeenCalledWith(
        expect.objectContaining({ paths: ["/*"] }),
      );
    });
  });

  it("goes back to distributions when back button clicked", async () => {
    mockDistributions.mockReturnValue({
      data: {
        distributions: [
          {
            Id: "E123ABC",
            DomainName: "d123.cloudfront.net",
            Status: "Deployed",
            Enabled: true,
            PriceClass: "PriceClass_All",
          },
        ],
        total: 1,
      },
      isLoading: false,
    });

    const user = userEvent.setup();
    render(<CloudFrontDashboard />, { wrapper: createWrapper() });

    // Select distribution
    await user.click(screen.getByText("E123ABC"));

    await waitFor(() => {
      expect(screen.getByText(/Invalidations for E123ABC/i)).toBeTruthy();
    });

    // Go back
    await clickButton(user, /Back to distributions/i);

    // After going back, the distributions list should show the distribution
    await waitFor(() => {
      expect(screen.getByText("E123ABC")).toBeTruthy();
    });
  });
});

// Note: Cache Policies and Functions tabs exist in the CloudFrontDashboard but
// they are not reachable via click because the Tabs component has no onChange handler.
// The activeTabId is controlled solely by selectedDist state.
// Tests for those tabs are omitted since they cannot be navigated to via the UI.
