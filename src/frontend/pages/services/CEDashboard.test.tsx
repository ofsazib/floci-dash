// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

// ─── Mock hooks ─────────────────────────────────────────

const mockCostAndUsageMutate = vi.fn();
const mockDimensionValuesMutate = vi.fn();
const mockCETagsMutate = vi.fn();
const mockReservationCoverageMutate = vi.fn();
const mockReservationUtilizationMutate = vi.fn();
const mockSavingsPlansCoverageMutate = vi.fn();
const mockSavingsPlansUtilizationMutate = vi.fn();
const mockCostCategoriesMutate = vi.fn();

// Hook mock functions that can be overridden per test
const mockCostAndUsageHook = vi.fn(() => ({
  mutate: mockCostAndUsageMutate,
  isPending: false,
  data: undefined,
}));
const mockDimensionValuesHook = vi.fn(() => ({
  mutate: mockDimensionValuesMutate,
  isPending: false,
  data: undefined,
}));
const mockCETagsHook = vi.fn(() => ({
  mutate: mockCETagsMutate,
  isPending: false,
  data: undefined,
}));
const mockReservationCoverageHook = vi.fn(() => ({
  mutate: mockReservationCoverageMutate,
  isPending: false,
  data: undefined,
}));
const mockReservationUtilizationHook = vi.fn(() => ({
  mutate: mockReservationUtilizationMutate,
  isPending: false,
  data: undefined,
}));
const mockSavingsPlansCoverageHook = vi.fn(() => ({
  mutate: mockSavingsPlansCoverageMutate,
  isPending: false,
  data: undefined,
}));
const mockSavingsPlansUtilizationHook = vi.fn(() => ({
  mutate: mockSavingsPlansUtilizationMutate,
  isPending: false,
  data: undefined,
}));
const mockCostCategoriesHook = vi.fn(() => ({
  mutate: mockCostCategoriesMutate,
  isPending: false,
  data: undefined,
}));

vi.mock("../../hooks/useCE", () => ({
  useCostAndUsage: () => mockCostAndUsageHook(),
  useDimensionValues: () => mockDimensionValuesHook(),
  useCETags: () => mockCETagsHook(),
  useReservationCoverage: () => mockReservationCoverageHook(),
  useReservationUtilization: () => mockReservationUtilizationHook(),
  useSavingsPlansCoverage: () => mockSavingsPlansCoverageHook(),
  useSavingsPlansUtilization: () => mockSavingsPlansUtilizationHook(),
  useCostCategories: () => mockCostCategoriesHook(),
}));

import { CEDashboard } from "./CEDashboard";

// ─── Setup ──────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  // Reset all hooks to default (data: undefined)
  mockCostAndUsageHook.mockReturnValue({
    mutate: mockCostAndUsageMutate,
    isPending: false,
    data: undefined,
  });
  mockDimensionValuesHook.mockReturnValue({
    mutate: mockDimensionValuesMutate,
    isPending: false,
    data: undefined,
  });
  mockCETagsHook.mockReturnValue({
    mutate: mockCETagsMutate,
    isPending: false,
    data: undefined,
  });
  mockReservationCoverageHook.mockReturnValue({
    mutate: mockReservationCoverageMutate,
    isPending: false,
    data: undefined,
  });
  mockReservationUtilizationHook.mockReturnValue({
    mutate: mockReservationUtilizationMutate,
    isPending: false,
    data: undefined,
  });
  mockSavingsPlansCoverageHook.mockReturnValue({
    mutate: mockSavingsPlansCoverageMutate,
    isPending: false,
    data: undefined,
  });
  mockSavingsPlansUtilizationHook.mockReturnValue({
    mutate: mockSavingsPlansUtilizationMutate,
    isPending: false,
    data: undefined,
  });
  mockCostCategoriesHook.mockReturnValue({
    mutate: mockCostCategoriesMutate,
    isPending: false,
    data: undefined,
  });
});

// ─── Tests ──────────────────────────────────────────────

describe("CEDashboard — rendering", () => {
  it("renders the info alert", () => {
    render(<CEDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/Cost Explorer provides read-only cost/i)).toBeTruthy();
  });

  it("renders all section headers", () => {
    render(<CEDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Cost & Usage")).toBeTruthy();
    expect(screen.getByText("Dimension Values")).toBeTruthy();
    expect(screen.getByText("Tags")).toBeTruthy();
    expect(screen.getByText("Reservation & Savings Plans")).toBeTruthy();
    expect(screen.getByText("Cost Categories")).toBeTruthy();
  });

  it("renders all query buttons", () => {
    render(<CEDashboard />, { wrapper: createWrapper() });
    expect(screen.getByRole("button", { name: /Get Cost & Usage/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Get Dimensions/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Get Tags/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Reservation Coverage/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Reservation Utilization/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Savings Plans Coverage/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Savings Plans Utilization/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Get Cost Categories/i })).toBeTruthy();
  });
});

describe("CEDashboard — mutation buttons", () => {
  it("calls cost and usage mutation on click", async () => {
    const user = userEvent.setup();
    render(<CEDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Get Cost & Usage/i);
    await waitFor(() => {
      expect(mockCostAndUsageMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          timePeriod: { start: "2026-01-01", end: "2026-06-30" },
          granularity: "MONTHLY",
          metrics: ["BlendedCost"],
        }),
      );
    });
  });

  it("calls dimension values mutation on click", async () => {
    const user = userEvent.setup();
    render(<CEDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Get Dimensions/i);
    await waitFor(() => {
      expect(mockDimensionValuesMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          timePeriod: { start: "2026-01-01", end: "2026-06-30" },
          dimension: "SERVICE",
        }),
      );
    });
  });

  it("calls tags mutation on click", async () => {
    const user = userEvent.setup();
    render(<CEDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Get Tags/i);
    await waitFor(() => {
      expect(mockCETagsMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          timePeriod: { start: "2026-01-01", end: "2026-06-30" },
        }),
      );
    });
  });

  it("calls reservation coverage mutation on click", async () => {
    const user = userEvent.setup();
    render(<CEDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Reservation Coverage/i);
    await waitFor(() => {
      expect(mockReservationCoverageMutate).toHaveBeenCalledWith(
        expect.objectContaining({ granularity: "MONTHLY" }),
      );
    });
  });

  it("calls reservation utilization mutation on click", async () => {
    const user = userEvent.setup();
    render(<CEDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Reservation Utilization/i);
    await waitFor(() => {
      expect(mockReservationUtilizationMutate).toHaveBeenCalledWith(
        expect.objectContaining({ granularity: "MONTHLY" }),
      );
    });
  });

  it("calls savings plans coverage mutation on click", async () => {
    const user = userEvent.setup();
    render(<CEDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Savings Plans Coverage/i);
    await waitFor(() => {
      expect(mockSavingsPlansCoverageMutate).toHaveBeenCalledWith(
        expect.objectContaining({ granularity: "MONTHLY" }),
      );
    });
  });

  it("calls savings plans utilization mutation on click", async () => {
    const user = userEvent.setup();
    render(<CEDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Savings Plans Utilization/i);
    await waitFor(() => {
      expect(mockSavingsPlansUtilizationMutate).toHaveBeenCalledWith(
        expect.objectContaining({ granularity: "MONTHLY" }),
      );
    });
  });

  it("calls cost categories mutation on click", async () => {
    const user = userEvent.setup();
    render(<CEDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Get Cost Categories/i);
    await waitFor(() => {
      expect(mockCostCategoriesMutate).toHaveBeenCalledWith({});
    });
  });
});

describe("CEDashboard — result display branches", () => {
  it("shows cost and usage results when data is returned", () => {
    mockCostAndUsageHook.mockReturnValue({
      mutate: mockCostAndUsageMutate,
      isPending: false,
      data: { resultsByTime: [{ timePeriod: { start: "2026-01" } }, { timePeriod: { start: "2026-02" } }] } as any,
    });
    render(<CEDashboard />, { wrapper: createWrapper() });
    // Full text rendered from: `Results by time: ${length}`
    expect(screen.getByText("Results by time: 2")).toBeTruthy();
  });

  it("shows cost categories results when data is returned", () => {
    mockCostCategoriesHook.mockReturnValue({
      mutate: mockCostCategoriesMutate,
      isPending: false,
      data: { costCategories: [{ name: "Category1" }, { name: "Category2" }, { name: "Category3" }] } as any,
    });
    render(<CEDashboard />, { wrapper: createWrapper() });
    // Full text rendered from: `Categories: ${length}`
    expect(screen.getByText("Categories: 3")).toBeTruthy();
  });

  it("does not show cost and usage results when data is undefined", () => {
    render(<CEDashboard />, { wrapper: createWrapper() });
    expect(screen.queryByText("Results by time:")).toBeNull();
  });

  it("does not show cost categories results when data is undefined", () => {
    render(<CEDashboard />, { wrapper: createWrapper() });
    expect(screen.queryByText("Categories:")).toBeNull();
  });
});

describe("CEDashboard — disabled state", () => {
  it("submit buttons are enabled", () => {
    render(<CEDashboard />, { wrapper: createWrapper() });
    const costUsageBtn = screen.getByRole("button", { name: /Get Cost & Usage/i });
    expect(costUsageBtn).not.toBeDisabled();
  });
});
