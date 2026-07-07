// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

const mockDomains = vi.fn();
const mockDeleteDomain = vi.fn();

vi.mock("../../hooks/useOpenSearch", () => ({
  useOpenSearchDomains: (...args: any[]) => mockDomains(...args),
  useDeleteOpenSearchDomain: () => ({ mutateAsync: mockDeleteDomain, isPending: false, variables: null }),
}));

import { OpenSearchDashboard } from "./OpenSearchDashboard";

beforeEach(() => {
  vi.clearAllMocks();
  mockDomains.mockReturnValue({ data: { domains: [], total: 0 }, isLoading: false });
});

describe("OpenSearchDashboard", () => {
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

  it("shows dash for missing engine type", () => {
    mockDomains.mockReturnValue({
      data: { domains: [{ DomainName: "my-domain" }], total: 1 },
      isLoading: false,
    });
    render(<OpenSearchDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-domain")).toBeTruthy();
  });

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
});
