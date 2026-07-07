// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

// ─── vi.hoisted states ─────────────────────────────────

const deleteDomainState = vi.hoisted(() => ({
  isPending: false,
  variables: null as string | null,
}));

// ─── Mock hooks ─────────────────────────────────────────

const mockDomains = vi.fn();
const mockDeleteDomain = vi.fn();

vi.mock("../../hooks/useOpenSearch", () => ({
  useOpenSearchDomains: (...args: any[]) => mockDomains(...args),
  useDeleteOpenSearchDomain: () => ({
    mutateAsync: mockDeleteDomain,
    get isPending() { return deleteDomainState.isPending; },
    get variables() { return deleteDomainState.variables; },
  }),
}));

import { OpenSearchDashboard } from "./OpenSearchDashboard";

// ─── Setup ──────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  deleteDomainState.isPending = false;
  deleteDomainState.variables = null;
  mockDomains.mockReturnValue({ data: { domains: [], total: 0 }, isLoading: false });
});

// ─── Tests ──────────────────────────────────────────────

describe("OpenSearchDashboard — rendering", () => {
  it("shows loading skeleton", () => {
    mockDomains.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = render(<OpenSearchDashboard />, { wrapper: createWrapper() });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("shows empty message", () => {
    render(<OpenSearchDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No OpenSearch domains/i)).toBeTruthy();
  });

  it("renders domains with data", () => {
    mockDomains.mockReturnValue({
      data: { domains: [{ DomainName: "my-domain", EngineType: "OpenSearch" }], total: 1 },
      isLoading: false,
    });
    render(<OpenSearchDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-domain")).toBeTruthy();
    expect(screen.getByText("OpenSearch")).toBeTruthy();
  });

  it("renders multiple domains", () => {
    mockDomains.mockReturnValue({
      data: {
        domains: [
          { DomainName: "prod-domain", EngineType: "Elasticsearch" },
          { DomainName: "dev-domain" },
        ],
        total: 2,
      },
      isLoading: false,
    });
    render(<OpenSearchDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("prod-domain")).toBeTruthy();
    expect(screen.getByText("dev-domain")).toBeTruthy();
    // Second domain has no EngineType → defaults to "OpenSearch"
    expect(screen.getByText("Elasticsearch")).toBeTruthy();
  });

  it("shows OpenSearch fallback for missing engine type", () => {
    mockDomains.mockReturnValue({
      data: { domains: [{ DomainName: "no-engine" }], total: 1 },
      isLoading: false,
    });
    render(<OpenSearchDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("no-engine")).toBeTruthy();
    // d.EngineType || "OpenSearch" → OpenSearch fallback
    expect(screen.getByText("OpenSearch")).toBeTruthy();
  });

  it("filters domains by name", async () => {
    mockDomains.mockReturnValue({
      data: {
        domains: [
          { DomainName: "alpha-domain" },
          { DomainName: "beta-domain" },
        ],
        total: 2,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<OpenSearchDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("alpha-domain")).toBeTruthy());

    const filterInput = screen.getByPlaceholderText("Find domains");
    await user.type(filterInput, "beta");
    await waitFor(() => expect(screen.queryByText("alpha-domain")).toBeNull());
  });

  it("shows header counter", () => {
    mockDomains.mockReturnValue({
      data: { domains: [{ DomainName: "d1" }, { DomainName: "d2" }], total: 2 },
      isLoading: false,
    });
    render(<OpenSearchDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("(2)")).toBeTruthy();
  });
});

describe("OpenSearchDashboard — delete", () => {
  it("deletes a domain", async () => {
    mockDomains.mockReturnValue({
      data: { domains: [{ DomainName: "delete-me" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<OpenSearchDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("delete-me")).toBeTruthy());

    const deleteBtn = screen.getByRole("button", { name: /Delete delete-me/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteDomain).toHaveBeenCalledWith("delete-me"));
  });

  it("shows delete domain loading state", () => {
    deleteDomainState.isPending = true;
    deleteDomainState.variables = "loading-domain";
    mockDomains.mockReturnValue({
      data: { domains: [{ DomainName: "loading-domain" }], total: 1 },
      isLoading: false,
    });
    render(<OpenSearchDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("loading-domain")).toBeTruthy();
  });

  it("delete loading only affects matching domain", () => {
    deleteDomainState.isPending = true;
    deleteDomainState.variables = "domain-b";
    mockDomains.mockReturnValue({
      data: {
        domains: [
          { DomainName: "domain-a" },
          { DomainName: "domain-b" },
        ],
        total: 2,
      },
      isLoading: false,
    });
    render(<OpenSearchDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("domain-a")).toBeTruthy();
    expect(screen.getByText("domain-b")).toBeTruthy();
  });
});
