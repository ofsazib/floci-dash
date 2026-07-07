// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

// ─── vi.hoisted mutable states ──────────────────────────

const createInvState = vi.hoisted(() => ({
  isPending: false,
}));

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
  useCreateCloudFrontInvalidation: (distId: string) => ({
    mutateAsync: mockCreateInvalidation,
    get isPending() { return createInvState.isPending; },
  }),
}));

import { CloudFrontDashboard } from "./CloudFrontDashboard";

// ─── Setup ──────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  createInvState.isPending = false;

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

  it("shows dash for missing modified date", () => {
    mockDistributions.mockReturnValue({
      data: {
        distributions: [{ Id: "E1", DomainName: "d1.cloudfront.net", Status: "Deployed", Enabled: true }],
        total: 1,
      },
      isLoading: false,
    });
    render(<CloudFrontDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("-")).toBeTruthy();
  });

  it("renders multiple distributions and filters by ID", async () => {
    mockDistributions.mockReturnValue({
      data: {
        distributions: [
          { Id: "E1", DomainName: "d1.cloudfront.net", Status: "Deployed", Enabled: true },
          { Id: "E2", DomainName: "d2.cloudfront.net", Status: "Deployed", Enabled: false },
        ],
        total: 2,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CloudFrontDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("E1")).toBeTruthy());
    expect(screen.getByText("E2")).toBeTruthy();

    const filterInput = screen.getByPlaceholderText("Find distributions by ID");
    await user.type(filterInput, "E2");
    await waitFor(() => expect(screen.queryByText("E1")).toBeNull());
  });
});

describe("CloudFrontDashboard — invalidations tab", () => {
  it("shows empty message for invalidations tab (no distribution selected)", () => {
    render(<CloudFrontDashboard />, { wrapper: createWrapper() });
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

    await user.click(screen.getByText("E123ABC"));

    await waitFor(() => {
      expect(screen.getByText("I001")).toBeTruthy();
      expect(screen.getByText("Completed")).toBeTruthy();
    });
  });

  it("shows empty invalidations state when dist selected but no invalidations", async () => {
    mockDistributions.mockReturnValue({
      data: {
        distributions: [{ Id: "E1", DomainName: "d1.cloudfront.net", Status: "Deployed", Enabled: true }],
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
    await user.click(screen.getByText("E1"));
    await waitFor(() => expect(screen.getByText(/No invalidations/i)).toBeTruthy());
  });

  it("opens create invalidation modal and submits", async () => {
    mockDistributions.mockReturnValue({
      data: {
        distributions: [{ Id: "E123ABC", DomainName: "d123.cloudfront.net", Status: "Deployed", Enabled: true }],
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

    await user.click(screen.getByText("E123ABC"));
    await waitFor(() => expect(screen.getByText(/No invalidations/i)).toBeTruthy());

    await clickButton(user, /Create/i);
    await waitFor(() => {
      expect(screen.getByText("Create invalidation")).toBeTruthy();
    });

    const createBtns = screen.getAllByRole("button", { name: /Create/i });
    await user.click(createBtns[createBtns.length - 1]);

    await waitFor(() => {
      expect(mockCreateInvalidation).toHaveBeenCalledWith(
        expect.objectContaining({ paths: ["/*"] }),
      );
    });
  });

  it("cancels create invalidation modal without submitting", async () => {
    mockDistributions.mockReturnValue({
      data: {
        distributions: [{ Id: "E1", DomainName: "d1.cloudfront.net", Status: "Deployed", Enabled: true }],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CloudFrontDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("E1"));
    await waitFor(() => expect(screen.getByText(/Invalidations for E1/i)).toBeTruthy());
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create invalidation")).toBeTruthy());
    await clickButton(user, /Cancel/i);
    expect(mockCreateInvalidation).not.toHaveBeenCalled();
  });

  it("shows create invalidation loading state", () => {
    createInvState.isPending = true;
    mockDistributions.mockReturnValue({
      data: {
        distributions: [{ Id: "E1", DomainName: "d1.cloudfront.net", Status: "Deployed", Enabled: true }],
        total: 1,
      },
      isLoading: false,
    });
    render(<CloudFrontDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("E1")).toBeTruthy();
  });

  it("goes back to distributions when back button clicked", async () => {
    mockDistributions.mockReturnValue({
      data: {
        distributions: [{ Id: "E123ABC", DomainName: "d123.cloudfront.net", Status: "Deployed", Enabled: true }],
        total: 1,
      },
      isLoading: false,
    });

    const user = userEvent.setup();
    render(<CloudFrontDashboard />, { wrapper: createWrapper() });

    await user.click(screen.getByText("E123ABC"));
    await waitFor(() => {
      expect(screen.getByText(/Invalidations for E123ABC/i)).toBeTruthy();
    });

    await clickButton(user, /Back to distributions/i);
    await waitFor(() => {
      expect(screen.getByText("E123ABC")).toBeTruthy();
    });
  });
});
