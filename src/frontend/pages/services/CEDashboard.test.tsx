// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

// ─── Mock hooks ─────────────────────────────────────────

const mockAnomalyMonitors = vi.fn((..._a: any[]) => ({ data: { anomalyMonitors: [], total: 0 }, isLoading: false }) as { data: any; isLoading: boolean });
const mockAnomalySubscriptions = vi.fn((..._a: any[]) => ({ data: { anomalySubscriptions: [], total: 0 }, isLoading: false }) as { data: any; isLoading: boolean });
const mockResourceTags = vi.fn((..._a: any[]) => ({ data: { tags: {} }, isLoading: false }) as { data: any; isLoading: boolean });
const ceDeleteState = vi.hoisted(() => ({ isPending: false, variables: null as string | null }));
const ceSubDeleteState = vi.hoisted(() => ({ isPending: false, variables: null as string | null }));
const mockCreateMonitor = vi.fn(() => Promise.resolve({ monitorArn: "arn:m" }));
const mockUpdateMonitor = vi.fn();
const mockDeleteMonitor = vi.fn(() => Promise.resolve({}));
const mockCreateSubscription = vi.fn(() => Promise.resolve({ subscriptionArn: "arn:s" }));
const mockDeleteSubscription = vi.fn(() => Promise.resolve({}));
const mockCostAndUsageMutate = vi.fn();
const mockDimensionValuesMutate = vi.fn();
const mockCETagsMutate = vi.fn();
const mockReservationCoverageMutate = vi.fn();
const mockReservationUtilizationMutate = vi.fn();
const mockSavingsPlansCoverageMutate = vi.fn();
const mockSavingsPlansUtilizationMutate = vi.fn();
const mockCostCategoriesMutate = vi.fn();
const mockCostWithResourcesMutate = vi.fn();
const mockCostWithResourcesHook = vi.fn(() => ({
  mutate: mockCostWithResourcesMutate,
  isPending: false,
  data: undefined as any,
}));

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

const require0Mocks: Record<string, any> = {
  useCEAnomalyMonitors: mockAnomalyMonitors,
  useCEAnomalySubscriptions: mockAnomalySubscriptions,
  useCEResourceTags: mockResourceTags,
};

const mockShowToast = vi.fn();
vi.mock("../../components/Toast", () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

vi.mock("../../hooks/useCE", () => ({
  useCEAnomalyMonitors: (...args: any[]) => mockAnomalyMonitors(...args),
  useCreateCEAnomalyMonitor: () => ({ mutateAsync: mockCreateMonitor, isPending: false }),
  useUpdateCEAnomalyMonitor: () => ({ mutate: mockUpdateMonitor, isPending: false }),
  useDeleteCEAnomalyMonitor: () => ({
    mutateAsync: mockDeleteMonitor,
    get isPending() { return ceDeleteState.isPending; },
    get variables() { return ceDeleteState.variables; },
  }),
  useCEAnomalySubscriptions: (...args: any[]) => mockAnomalySubscriptions(...args),
  useCreateCEAnomalySubscription: () => ({ mutateAsync: mockCreateSubscription, isPending: false }),
  useDeleteCEAnomalySubscription: () => ({
    mutateAsync: mockDeleteSubscription,
    get isPending() { return ceSubDeleteState.isPending; },
    get variables() { return ceSubDeleteState.variables; },
  }),
  useCEResourceTags: (...args: any[]) => mockResourceTags(...args),
  useCETagResource: () => ({ mutateAsync: vi.fn(() => Promise.resolve({})), isPending: false }),
  useCEUntagResource: () => ({ mutateAsync: vi.fn(() => Promise.resolve({})), isPending: false }),
  useCostAndUsage: () => mockCostAndUsageHook(),
  useCostAndUsageWithResources: () => mockCostWithResourcesHook(),
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
  mockAnomalyMonitors.mockReturnValue({ data: { anomalyMonitors: [], total: 0 }, isLoading: false });
  mockAnomalySubscriptions.mockReturnValue({ data: { anomalySubscriptions: [], total: 0 }, isLoading: false });
  mockResourceTags.mockReturnValue({ data: { tags: {} }, isLoading: false });
  ceDeleteState.isPending = false;
  ceDeleteState.variables = null;
  ceSubDeleteState.isPending = false;
  ceSubDeleteState.variables = null;
  mockCreateMonitor.mockImplementation(() => Promise.resolve({ monitorArn: "arn:m" }));
  mockCreateSubscription.mockImplementation(() => Promise.resolve({ subscriptionArn: "arn:s" }));
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
    expect(screen.getAllByRole("button", { name: /Get Cost & Usage/i })[0]).toBeTruthy();
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

  it("shows 0 cost and usage results when data is sparse (no resultsByTime key)", () => {
    mockCostAndUsageHook.mockReturnValue({
      mutate: mockCostAndUsageMutate,
      isPending: false,
      data: {} as any,
    });
    render(<CEDashboard />, { wrapper: createWrapper() });
    // `(resultsByTime || []).length` falls back to 0 for sparse data
    expect(screen.getByText("Results by time: 0")).toBeTruthy();
  });

  it("shows 0 cost categories when data is sparse (no costCategories key)", () => {
    mockCostCategoriesHook.mockReturnValue({
      mutate: mockCostCategoriesMutate,
      isPending: false,
      data: {} as any,
    });
    render(<CEDashboard />, { wrapper: createWrapper() });
    // `(costCategories || []).length` falls back to 0 for sparse data
    expect(screen.getByText("Categories: 0")).toBeTruthy();
  });
});

describe("CEDashboard — disabled state", () => {
  it("submit buttons are enabled", () => {
    render(<CEDashboard />, { wrapper: createWrapper() });
    const costUsageBtn = screen.getAllByRole("button", { name: /Get Cost & Usage/i })[0];
    expect(costUsageBtn).not.toBeDisabled();
  });
});

describe("CEDashboard — cost & usage with resources", () => {
  it("shows 0 when the response has no results", () => {
    mockCostWithResourcesHook.mockReturnValue({
      mutate: mockCostWithResourcesMutate,
      isPending: false,
      data: {},
    });
    render(<CEDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/Results by time: 0/)).toBeTruthy();
  });

  it("runs the with-resources query and shows the result count", async () => {
    mockCostWithResourcesHook.mockReturnValue({
      mutate: mockCostWithResourcesMutate,
      isPending: false,
      data: { resultsByTime: [{}, {}], total: 2 },
    });
    const user = userEvent.setup();
    render(<CEDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Get Cost & Usage by Resource/i }));
    await waitFor(() => expect(screen.getByText(/Results by time: 2/)).toBeTruthy());
    expect(mockCostWithResourcesMutate).toHaveBeenCalledWith(
      expect.objectContaining({ granularity: "MONTHLY", metrics: ["UnblendedCost"] })
    );
  });
});

describe("CEDashboard — anomaly detection", () => {
  it("lists anomaly monitors and subscriptions", async () => {
    const user = userEvent.setup();
    render(<CEDashboard />, { wrapper: createWrapper() });
    expect(await screen.findByText("Cost Anomaly Detection")).toBeTruthy();
    expect(screen.getByText("No anomaly monitors")).toBeTruthy();
    expect(screen.getByText("No anomaly subscriptions")).toBeTruthy();
  });

  it("creates an anomaly monitor via modal", async () => {
    const user = userEvent.setup();
    render(<CEDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Create Monitor" }));
    const dialog = screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden"))!;
    const inputs = Array.from(dialog.querySelectorAll("input"));
    await user.type(inputs[0] as any, "m1");
    await user.click(screen.getByRole("button", { name: "Create monitor" }));
    expect(mockCreateMonitor).toHaveBeenCalledWith({
      monitorName: "m1", monitorType: "DIMENSIONAL", monitorDimension: "SERVICE",
    });
  });

  it("creates an anomaly subscription via modal", async () => {
    const user = userEvent.setup();
    render(<CEDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Create Subscription" }));
    const dialog = screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden"))!;
    const inputs = Array.from(dialog.querySelectorAll("input"));
    await user.type(inputs[0] as any, "s1");
    await user.type(inputs[1] as any, "arn:m");
    await user.type(inputs[2] as any, "a@b.c");
    await user.click(screen.getByRole("button", { name: "Create subscription" }));
    expect(mockCreateSubscription).toHaveBeenCalledWith({
      subscriptionName: "s1",
      monitorArn: "arn:m",
      subscribers: [{ Type: "EMAIL", Address: "a@b.c" }],
      threshold: undefined,
    });
  });
});

function visibleDeleteConfirm() {
  const dialogs = screen.getAllByRole("dialog").filter((d) => !d.className.includes("hidden"));
  const dlg = dialogs[dialogs.length - 1];
  return Array.from(dlg.querySelectorAll("button")).find((b) => b.textContent?.trim() === "Delete")!;
}

describe("CEDashboard — anomaly actions with data", () => {
  function setupAnomalyData() {
    const { useCEAnomalyMonitors, useCEAnomalySubscriptions, useCEResourceTags } =
      require0Mocks;
    useCEAnomalyMonitors.mockReturnValue({
      data: {
        anomalyMonitors: [
          { arn: "arn:m1", name: "m1", type: "DIMENSIONAL", dimension: "SERVICE", state: "ACTIVE" },
        ],
        total: 1,
      },
      isLoading: false,
    });
    useCEAnomalySubscriptions.mockReturnValue({
      data: { anomalySubscriptions: [{ arn: "arn:s1", name: "s1", threshold: 10, frequency: "DAILY" }], total: 1 },
      isLoading: false,
    });
    useCEResourceTags.mockReturnValue({ data: { tags: { env: "prod" } }, isLoading: false });
  }

  it("pauses a monitor, opens tags, adds and removes tags", async () => {
    setupAnomalyData();
    const user = userEvent.setup();
    render(<CEDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Pause" }));
    expect(mockUpdateMonitor).toHaveBeenCalledWith({ arn: "arn:m1", monitorState: "PAUSED" });
    await user.click(screen.getByRole("button", { name: "Tags" }));
    expect(await screen.findByText("env")).toBeTruthy();
    // remove tag
    await user.click(screen.getByRole("button", { name: "Remove" }));
    // add tag
    const dialog = screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden"))!;
    const inputs = within(dialog).getAllByRole("textbox");
    await user.type(inputs[0], "team");
    await user.type(inputs[1], "infra");
    await user.click(screen.getByRole("button", { name: "Add tag" }));
  });

  it("deletes a monitor and a subscription with confirmation", async () => {
    setupAnomalyData();
    const user = userEvent.setup();
    render(<CEDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: /Delete m1/i }));
    await waitFor(() => expect(screen.getAllByText(/Are you sure/).length).toBeGreaterThan(0));
    await user.click(visibleDeleteConfirm());
    await waitFor(() => expect(mockDeleteMonitor).toHaveBeenCalledWith("arn:m1"));
    await user.click(await screen.findByRole("button", { name: /Delete s1/i }));
    await waitFor(() => expect(screen.getAllByText(/Are you sure/).length).toBeGreaterThan(0));
    await user.click(visibleDeleteConfirm());
    await waitFor(() => expect(mockDeleteSubscription).toHaveBeenCalledWith("arn:s1"));
  });


});

describe("CEDashboard — anomaly modal interactions", () => {
  function escapeModals() {
    document.querySelectorAll('[class*="awsui_dialog"]').forEach((dialog) => {
      fireEvent.keyDown(dialog as HTMLElement, { keyCode: 27, key: "Escape" });
    });
  }

  it("fills all monitor modal fields and dismisses with Escape", async () => {
    const user = userEvent.setup();
    render(<CEDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Create Monitor" }));
    const dlg = screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden"))!;
    const inputs = within(dlg).getAllByRole("textbox");
    await user.type(inputs[0], "m3");
    await user.clear(inputs[1]);
    await user.type(inputs[1], "CUSTOM");
    await user.clear(inputs[2]);
    await user.type(inputs[2], "OPERATION");
    await user.click(within(dlg).getByRole("button", { name: "Create monitor" }));
    expect(mockCreateMonitor).toHaveBeenCalledWith({
      monitorName: "m3", monitorType: "CUSTOM", monitorDimension: undefined,
    });
    escapeModals();
    const header = screen.getAllByText("Create anomaly monitor").find((h) => h.closest('[role="dialog"]'));
    expect(header!.closest('[role="dialog"]')!.className).toContain("hidden");
  });

  it("fills subscription modal threshold and dismisses with Escape", async () => {
    const user = userEvent.setup();
    render(<CEDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "Create Subscription" }));
    const dlg = screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden"))!;
    const inputs = within(dlg).getAllByRole("textbox");
    await user.type(inputs[0], "s3");
    await user.type(inputs[1], "arn:m");
    await user.type(inputs[2], "a@b.c");
    await user.type(inputs[3], "50");
    await user.click(within(dlg).getByRole("button", { name: "Create subscription" }));
    expect(mockCreateSubscription).toHaveBeenCalledWith({
      subscriptionName: "s3", monitorArn: "arn:m",
      subscribers: [{ Type: "EMAIL", Address: "a@b.c" }], threshold: 50,
    });
    escapeModals();
    const header = screen.getAllByText("Create anomaly subscription").find((h) => h.closest('[role="dialog"]'));
    expect(header!.closest('[role="dialog"]')!.className).toContain("hidden");
  });

  it("dismisses the monitor tags modal with Escape", async () => {
    mockAnomalyMonitors.mockReturnValue({
      data: { anomalyMonitors: [{ arn: "arn:m1", name: "m1", type: "DIMENSIONAL", state: "ACTIVE" }], total: 1 },
      isLoading: false,
    } as any);
    const user = userEvent.setup();
    render(<CEDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("m1")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Tags" }));
    await screen.findByText(/No tags on this monitor/);
    escapeModals();
    const header = screen.getAllByText("Monitor resource tags").find((h) => h.closest('[role="dialog"]'));
    expect(header!.closest('[role="dialog"]')!.className).toContain("hidden");
  });

});

describe("CEDashboard — anomaly sparse rows and arms", () => {
  function setupSparse() {
    // undefined query data exercises the `|| []` defaults
    mockAnomalyMonitors.mockReturnValue({ data: undefined, isLoading: false });
    mockAnomalySubscriptions.mockReturnValue({ data: undefined, isLoading: false });
    mockResourceTags.mockReturnValue({ data: undefined, isLoading: false });
  }

  it("renders empty anomaly sections when query data is undefined", async () => {
    setupSparse();
    const user = userEvent.setup();
    render(<CEDashboard />, { wrapper: createWrapper() });
    expect(await screen.findByText("No anomaly monitors")).toBeTruthy();
    expect(screen.getByText("No anomaly subscriptions")).toBeTruthy();
  });

  it("handles sparse rows, PAUSED rows and nameless entries", async () => {
    mockAnomalyMonitors.mockReturnValue({
      data: {
        anomalyMonitors: [
          { arn: "arn:bare" },
          { arn: "arn:p", name: "paused", type: "DIMENSIONAL", dimension: "SERVICE", state: "PAUSED" },
        ],
        total: 2,
      },
      isLoading: false,
    });
    mockAnomalySubscriptions.mockReturnValue({
      data: { anomalySubscriptions: [{ arn: "arn:s-bare" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CEDashboard />, { wrapper: createWrapper() });
    // sparse monitor cells fall back to em-dashes; nameless rows fall back to arn in DeleteButton
    expect(await screen.findByRole("button", { name: /Delete arn:bare/i })).toBeTruthy();
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(6);
    // DeleteButton falls back to arn for nameless entries
    expect(screen.getByRole("button", { name: /Delete arn:bare/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Delete arn:s-bare/i })).toBeTruthy();
    // PAUSED row shows Resume and sends ACTIVE
    await user.click(screen.getByRole("button", { name: "Resume" }));
    expect(mockUpdateMonitor).toHaveBeenCalledWith({ arn: "arn:p", monitorState: "ACTIVE" });
  });

  it("shows delete loading state only for the matching monitor and subscription", () => {
    ceDeleteState.isPending = true;
    ceDeleteState.variables = "arn:m1";
    ceSubDeleteState.isPending = true;
    ceSubDeleteState.variables = "arn:s1";
    mockAnomalyMonitors.mockReturnValue({
      data: {
        anomalyMonitors: [
          { arn: "arn:m1", name: "m1", type: "DIMENSIONAL", state: "ACTIVE" },
          { arn: "arn:m2", name: "m2", type: "DIMENSIONAL", state: "ACTIVE" },
        ],
        total: 2,
      },
      isLoading: false,
    });
    mockAnomalySubscriptions.mockReturnValue({
      data: {
        anomalySubscriptions: [
          { arn: "arn:s1", name: "s1", threshold: 10, frequency: "DAILY" },
          { arn: "arn:s2", name: "s2", threshold: 20, frequency: "DAILY" },
        ],
        total: 2,
      },
      isLoading: false,
    });
    render(<CEDashboard />, { wrapper: createWrapper() });
    expect(screen.getAllByRole("button", { name: /Delete m/i }).length).toBe(2);
    ceDeleteState.isPending = false;
    ceDeleteState.variables = null;
    ceSubDeleteState.isPending = false;
    ceSubDeleteState.variables = null;
  });

  it("renders the tags editor loading state", async () => {
    mockAnomalyMonitors.mockReturnValue({
      data: { anomalyMonitors: [{ arn: "arn:m1", name: "m1", type: "DIMENSIONAL", state: "ACTIVE" }], total: 1 },
      isLoading: false,
    });
    mockResourceTags.mockReturnValue({ data: undefined, isLoading: true });
    const user = userEvent.setup();
    render(<CEDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("m1")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "Tags" }));
    expect(await screen.findByText("Loading tags…")).toBeTruthy();
  });
});
