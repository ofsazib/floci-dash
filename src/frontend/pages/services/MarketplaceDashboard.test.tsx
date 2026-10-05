// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createWrapper } from "../../../test/helpers";
import React from "react";

const mockHooks = vi.hoisted(() => ({
  useMpAgreements: vi.fn(),
  useMpAgreementDetail: vi.fn(),
  useMpCancelAgreement: vi.fn(),
  useMpEntitlements: vi.fn(),
  useMpMeterUsage: vi.fn(),
  useMpResolveCustomer: vi.fn(),
  useMpEntities: vi.fn(),
  useMpEntityDetail: vi.fn(),
}));

vi.mock("../../hooks/useMarketplace", () => mockHooks);

const mockDetail = vi.fn();
const mockCancel = vi.fn();
const mockEntitlements = vi.fn();
const mockMeterUsage = vi.fn();
const mockResolve = vi.fn();
const mockEntityDetail = vi.fn();

function okMutation(mock: ReturnType<typeof vi.fn>, isPending = false) {
  return { mutateAsync: mock, isPending };
}

function listQuery(key: string, items: unknown[], overrides: Record<string, unknown> = {}) {
  return {
    data: { [key]: items },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  };
}

const AGREEMENT = { agreementId: "agmt-1", status: "ACTIVE", agreementType: "PurchaseAgreement" };
const ENTITY = { EntityId: "e-1", EntityType: "Agreement", EntityArn: "arn:entity" };
const BARE_ENTITY = {};

import MarketplaceDashboard from "./MarketplaceDashboard";

function modalDlg(header: string): HTMLElement {
  return screen
    .getAllByText(header)
    .map((t) => t.closest('[role="dialog"]'))
    .find((d) => d) as HTMLElement;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockHooks.useMpAgreements.mockReturnValue(listQuery("agreements", [AGREEMENT]));
  mockHooks.useMpEntities.mockReturnValue(listQuery("entities", [ENTITY, BARE_ENTITY]));
  mockHooks.useMpAgreementDetail.mockReturnValue(okMutation(mockDetail));
  mockHooks.useMpCancelAgreement.mockReturnValue(okMutation(mockCancel));
  mockHooks.useMpEntitlements.mockReturnValue(okMutation(mockEntitlements));
  mockHooks.useMpMeterUsage.mockReturnValue(okMutation(mockMeterUsage));
  mockHooks.useMpResolveCustomer.mockReturnValue(okMutation(mockResolve));
  mockHooks.useMpEntityDetail.mockReturnValue(okMutation(mockEntityDetail));
});

describe("MarketplaceDashboard — agreements tab", () => {
  it("renders agreements", () => {
    render(<MarketplaceDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("agmt-1")).toBeTruthy();
    expect(screen.getByText("ACTIVE")).toBeTruthy();
    expect(screen.getByText("PurchaseAgreement")).toBeTruthy();
  });

  it("renders with undefined data (loading)", () => {
    mockHooks.useMpAgreements.mockReturnValue(listQuery("agreements", [], { data: undefined }));
    mockHooks.useMpEntities.mockReturnValue(listQuery("entities", [], { data: undefined }));
    render(<MarketplaceDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Agreements (0)")).toBeTruthy();
  });

  it("shows agreement details in a JSON modal", async () => {
    const user = userEvent.setup();
    mockDetail.mockResolvedValueOnce({ agreement: { agreementId: "agmt-1" } });
    render(<MarketplaceDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Details/i }));
    await waitFor(() => expect(mockDetail).toHaveBeenCalledWith("agmt-1"));
    await waitFor(() =>
      expect(screen.getByText("Agreement agmt-1")).toBeTruthy()
    );
    document.querySelectorAll('[class*="awsui_dialog"]').forEach((d) => {
      fireEvent.keyDown(d as HTMLElement, { keyCode: 27, key: "Escape" });
    });
    await waitFor(() =>
      expect(screen.queryByText("Agreement agmt-1")).toBeNull()
    );
  });

  it("shows a fallback error when the detail fetch fails", async () => {
    const user = userEvent.setup();
    mockDetail.mockRejectedValueOnce({});
    render(<MarketplaceDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Details/i }));
    await waitFor(() => expect(screen.getByText("Request failed")).toBeTruthy());
  });

  it("cancels an agreement after confirmation", async () => {
    const user = userEvent.setup();
    mockCancel.mockResolvedValueOnce({ cancelled: true });
    render(<MarketplaceDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Delete agmt-1/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Delete$/i }));
    await waitFor(() => expect(mockCancel).toHaveBeenCalledWith("agmt-1"));
    await waitFor(() =>
      expect(screen.getByText("Agreement agmt-1 cancelled.")).toBeTruthy()
    );
    fireEvent.click(document.querySelector('[class*="awsui_dismiss-button"]') as HTMLElement);
    await waitFor(() =>
      expect(screen.queryByText("Agreement agmt-1 cancelled.")).toBeNull()
    );
  });
});

describe("MarketplaceDashboard — entitlements tab", () => {
  it("disables Fetch without a product code and fetches entitlements", async () => {
    const user = userEvent.setup();
    mockEntitlements.mockResolvedValueOnce({ entitlements: [{ productCode: "prod-1" }] });
    render(<MarketplaceDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Entitlements/ }));
    const fetchBtn = screen.getByRole("button", { name: /^Fetch$/i }) as HTMLButtonElement;
    expect(fetchBtn.disabled).toBe(true);
    await user.type(screen.getByPlaceholderText("prod-abc123"), "prod-1");
    expect(fetchBtn.disabled).toBe(false);
    await user.click(fetchBtn);
    await waitFor(() => expect(mockEntitlements).toHaveBeenCalledWith("prod-1"));
    await waitFor(() => expect(screen.getByText(/"productCode": "prod-1"/)).toBeTruthy());
  });

  it("shows a fallback error when the entitlement fetch fails", async () => {
    const user = userEvent.setup();
    mockEntitlements.mockRejectedValueOnce({});
    render(<MarketplaceDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Entitlements/ }));
    await user.type(screen.getByPlaceholderText("prod-abc123"), "prod-1");
    await user.click(screen.getByRole("button", { name: /^Fetch$/i }));
    await waitFor(() => expect(screen.getByText("Request failed")).toBeTruthy());
  });
});

describe("MarketplaceDashboard — metering tab", () => {
  it("disables Submit until product code and dimension are typed, then meters usage", async () => {
    const user = userEvent.setup();
    mockMeterUsage.mockResolvedValueOnce({ meteringRecordId: "mr-9" });
    render(<MarketplaceDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Metering/ }));
    const submitBtn = screen.getByRole("button", { name: /^Submit$/i }) as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(true);
    await user.type(screen.getByPlaceholderText("prod-abc123"), "prod-1");
    await user.type(screen.getByPlaceholderText("hours"), "hours");
    expect(submitBtn.disabled).toBe(false);
    const quantityInput = screen
      .getAllByRole("textbox")
      .find((el) => (el as HTMLInputElement).value === "1") as HTMLElement;
    await user.clear(quantityInput);
    await user.click(submitBtn);
    await waitFor(() =>
      expect(mockMeterUsage).toHaveBeenCalledWith({
        productCode: "prod-1",
        usageDimension: "hours",
        usageQuantity: 1,
      })
    );
    await waitFor(() => expect(screen.getByText(/"meteringRecordId": "mr-9"/)).toBeTruthy());
  });

  it("shows a fallback error when metering fails", async () => {
    const user = userEvent.setup();
    mockMeterUsage.mockRejectedValueOnce({});
    render(<MarketplaceDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Metering/ }));
    await user.type(screen.getByPlaceholderText("prod-abc123"), "prod-1");
    await user.type(screen.getByPlaceholderText("hours"), "hours");
    await user.click(screen.getByRole("button", { name: /^Submit$/i }));
    await waitFor(() => expect(screen.getByText("Request failed")).toBeTruthy());
  });

  it("resolves a customer from a registration token", async () => {
    const user = userEvent.setup();
    mockResolve.mockResolvedValueOnce({
      productCode: "prod-9",
      customerAWSAccountId: "444444444444",
    });
    render(<MarketplaceDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Metering/ }));
    const resolveBtn = screen.getByRole("button", { name: /^Resolve$/i }) as HTMLButtonElement;
    expect(resolveBtn.disabled).toBe(true);
    await user.type(screen.getByPlaceholderText("token"), "tok-1");
    expect(resolveBtn.disabled).toBe(false);
    await user.click(resolveBtn);
    await waitFor(() => expect(mockResolve).toHaveBeenCalledWith("tok-1"));
    await waitFor(() =>
      expect(screen.getByText(/"customerAWSAccountId": "444444444444"/)).toBeTruthy()
    );
  });

  it("shows a fallback error when resolving fails", async () => {
    const user = userEvent.setup();
    mockResolve.mockRejectedValueOnce({});
    render(<MarketplaceDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Metering/ }));
    await user.type(screen.getByPlaceholderText("token"), "tok-1");
    await user.click(screen.getByRole("button", { name: /^Resolve$/i }));
    await waitFor(() => expect(screen.getByText("Request failed")).toBeTruthy());
  });
});

describe("MarketplaceDashboard — catalog tab", () => {
  it("renders catalog entities", async () => {
    const user = userEvent.setup();
    render(<MarketplaceDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Catalog/ }));
    await waitFor(() => expect(screen.getByText("e-1")).toBeTruthy());
    expect(screen.getByText("arn:entity")).toBeTruthy();
  });

  it("shows entity details in a modal", async () => {
    const user = userEvent.setup();
    mockEntityDetail.mockResolvedValueOnce({ entity: { EntityId: "e-1", Name: "prod" } });
    render(<MarketplaceDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Catalog/ }));
    const detailsButtons = screen.getAllByRole("button", { name: /Details/i });
    await user.click(detailsButtons[0]);
    await waitFor(() => expect(mockEntityDetail).toHaveBeenCalledWith("e-1"));
    await waitFor(() => expect(screen.getByText("Entity e-1")).toBeTruthy());
    document.querySelectorAll('[class*="awsui_dialog"]').forEach((d) => {
      fireEvent.keyDown(d as HTMLElement, { keyCode: 27, key: "Escape" });
    });
    await waitFor(() => expect(screen.queryByText("Entity e-1")).toBeNull());
  });

  it("shows a fallback error when the entity fetch fails", async () => {
    const user = userEvent.setup();
    mockEntityDetail.mockRejectedValueOnce({});
    render(<MarketplaceDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /^Catalog/ }));
    const detailsButtons = screen.getAllByRole("button", { name: /Details/i });
    await user.click(detailsButtons[0]);
    await waitFor(() => expect(screen.getByText("Request failed")).toBeTruthy());
  });
});
