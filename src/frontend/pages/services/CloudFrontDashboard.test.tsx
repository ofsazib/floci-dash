// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
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

  it("submits custom invalidation paths typed in the textarea", async () => {
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

    fireEvent.change(screen.getByLabelText(/Paths/), {
      target: { value: "/images/*\n/about/*" },
    });

    const createBtns = screen.getAllByRole("button", { name: /Create/i });
    await user.click(createBtns[createBtns.length - 1]);

    await waitFor(() => {
      expect(mockCreateInvalidation).toHaveBeenCalledWith(
        expect.objectContaining({ paths: ["/images/*", "/about/*"] }),
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

  it("dismisses create invalidation modal with Escape", async () => {
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
    document.querySelectorAll('[class*="awsui_dialog"]').forEach((d) => fireEvent.keyDown(d as HTMLElement, { keyCode: 27 }));
    await waitFor(() => {
      const header = screen.getAllByText("Create invalidation").find((h) => h.closest('[role="dialog"]'));
      expect(header!.closest('[role="dialog"]')!.className).toContain("hidden");
    });
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

describe("CloudFrontDashboard — cache policies", () => {
  it("shows empty message for cache policies tab", async () => {
    const user = userEvent.setup();
    render(<CloudFrontDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Cache Policies/i }));
    await waitFor(() => {
      expect(screen.getByText(/No cache policies/i)).toBeTruthy();
    });
  });

  it("renders cache policies with data", async () => {
    mockCachePolicies.mockReturnValue({
      data: {
        cachePolicies: [
          {
            CachePolicy: { Id: "cp-1", CachePolicyConfig: { Name: "ManagedPolicy", Comment: "Default" } },
            Type: "managed",
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CloudFrontDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Cache Policies/i }));
    await waitFor(() => {
      expect(screen.getByText("cp-1")).toBeTruthy();
      expect(screen.getByText("ManagedPolicy")).toBeTruthy();
      expect(screen.getByText("managed")).toBeTruthy();
      expect(screen.getByText("Default")).toBeTruthy();
    });
  });

  it("shows dash for missing cache policy comment", async () => {
    mockCachePolicies.mockReturnValue({
      data: {
        cachePolicies: [
          {
            CachePolicy: { Id: "cp-2", CachePolicyConfig: { Name: "MinimalPolicy" } },
            Type: "custom",
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CloudFrontDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Cache Policies/i }));
    await waitFor(() => {
      expect(screen.getByText("cp-2")).toBeTruthy();
      expect(screen.getByText("MinimalPolicy")).toBeTruthy();
      expect(screen.getByText("-")).toBeTruthy();
    });
  });

  it("filters cache policies by name", async () => {
    mockCachePolicies.mockReturnValue({
      data: {
        cachePolicies: [
          {
            CachePolicy: { Id: "cp-a", CachePolicyConfig: { Name: "PolicyAlpha" } },
            Type: "managed",
          },
          {
            CachePolicy: { Id: "cp-b", CachePolicyConfig: { Name: "PolicyBeta" } },
            Type: "custom",
          },
        ],
        total: 2,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CloudFrontDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Cache Policies/i }));
    await waitFor(() => expect(screen.getByText("cp-a")).toBeTruthy());

    const filterInput = screen.getByPlaceholderText("Find policies");
    await user.type(filterInput, "Beta");
    await waitFor(() => expect(screen.queryByText("cp-a")).toBeNull());
  });
});

describe("CloudFrontDashboard — functions", () => {
  it("shows empty message for functions tab", async () => {
    const user = userEvent.setup();
    render(<CloudFrontDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /functions/i }));
    await waitFor(() => {
      expect(screen.getByText(/No CloudFront functions/i)).toBeTruthy();
    });
  });

  it("renders functions with data", async () => {
    mockFunctions.mockReturnValue({
      data: {
        functions: [
          {
            Name: "my-function",
            FunctionARN: "arn:aws:cloudfront::123:function/my-function",
            FunctionMetadata: { Stage: "LIVE", CreatedTime: "2024-01-15T00:00:00Z" },
            FunctionConfig: { Runtime: "cloudfront-js-2.0" },
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CloudFrontDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /functions/i }));
    await waitFor(() => {
      expect(screen.getByText("my-function")).toBeTruthy();
      expect(screen.getByText("LIVE")).toBeTruthy();
      expect(screen.getByText("cloudfront-js-2.0")).toBeTruthy();
    });
  });

  it("shows dashes for missing function fields", async () => {
    mockFunctions.mockReturnValue({
      data: {
        functions: [
          {
            Name: "minimal-fn",
          },
        ],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CloudFrontDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /functions/i }));
    await waitFor(() => {
      expect(screen.getByText("minimal-fn")).toBeTruthy();
      const dashes = screen.getAllByText("-");
      expect(dashes.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("filters functions by name", async () => {
    mockFunctions.mockReturnValue({
      data: {
        functions: [
          { Name: "fn-alpha", FunctionARN: "arn:1", FunctionMetadata: { Stage: "LIVE" }, FunctionConfig: { Runtime: "js-2.0" } },
          { Name: "fn-beta", FunctionARN: "arn:2", FunctionMetadata: { Stage: "DEVELOPMENT" }, FunctionConfig: { Runtime: "js-2.0" } },
        ],
        total: 2,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CloudFrontDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /functions/i }));
    await waitFor(() => expect(screen.getByText("fn-alpha")).toBeTruthy());

    const filterInput = screen.getByPlaceholderText("Find functions");
    await user.type(filterInput, "beta");
    await waitFor(() => expect(screen.queryByText("fn-alpha")).toBeNull());
  });
});
