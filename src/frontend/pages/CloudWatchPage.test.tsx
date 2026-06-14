// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const mockCloudWatchMetrics = vi.fn();
const mockPutMetricData = vi.fn();
const mockMetricStatistics = vi.fn();
const mockCloudWatchAlarms = vi.fn();
const mockCreateAlarmMutate = vi.fn();
const mockDeleteAlarm = vi.fn();
const mockSetAlarmState = vi.fn();

vi.mock("../hooks/useCloudWatch", () => ({
  useCloudWatchMetrics: (...args: any[]) => mockCloudWatchMetrics(...args),
  usePutMetricData: () => ({ mutateAsync: mockPutMetricData, isPending: false }),
  useMetricStatistics: (...args: any[]) => mockMetricStatistics(...args),
  useCloudWatchAlarms: (...args: any[]) => mockCloudWatchAlarms(...args),
  useCreateAlarm: () => ({ mutateAsync: mockCreateAlarmMutate, isPending: false }),
  useDeleteAlarm: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useSetAlarmState: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("../components/Toast", () => ({
  useToast: () => ({ showToast: vi.fn() }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import CloudWatchPage from "./CloudWatchPage";

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("CloudWatchPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCloudWatchMetrics.mockReturnValue({ data: { namespaces: ["AWS/Lambda"], metrics: [{ namespace: "AWS/Lambda", metricName: "Invocations", dimensions: [] }] }, isLoading: false, refetch: vi.fn() });
    mockMetricStatistics.mockReturnValue({ data: { datapoints: [] }, isLoading: false });
    mockCloudWatchAlarms.mockReturnValue({ data: { alarms: [{ name: "high-cpu", state: "ALARM", namespace: "AWS/EC2", metricName: "CPUUtilization", threshold: 80, comparisonOperator: "GreaterThanThreshold", period: 300, statistic: "Average" }] }, isLoading: false });
  });

  // ─── Render State Tests ─────────────────────────────────

  it("renders alarms tab by default", () => {
    render(<CloudWatchPage />, { wrapper: createWrapper() });
    expect(screen.getByText("CloudWatch")).toBeTruthy();
    expect(screen.getAllByText("Alarms").length).toBeGreaterThan(0);
    expect(screen.getAllByText("high-cpu").length).toBeGreaterThan(0);
  });

  it("shows empty alarms state", () => {
    mockCloudWatchAlarms.mockReturnValue({ data: { alarms: [] }, isLoading: false });
    render(<CloudWatchPage />, { wrapper: createWrapper() });
    expect(screen.getByText("No alarms")).toBeTruthy();
  });

  it("renders metrics tab", () => {
    render(<CloudWatchPage />, { wrapper: createWrapper() });
    expect(screen.getAllByText("Metrics").length).toBeGreaterThan(0);
  });

  // ─── Interaction Tests ──────────────────────────────────

  it("opens create alarm modal when 'Create alarm' button is clicked", async () => {
    const user = userEvent.setup();
    render(<CloudWatchPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Create alarm"));
    await waitFor(() => {
      expect(screen.getByText("Create alarm")).toBeTruthy();
    });
    expect(screen.getByPlaceholderText("CPUUtilization")).toBeTruthy();
  });

  it("calls createAlarm when alarm form is submitted", async () => {
    const user = userEvent.setup();
    render(<CloudWatchPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Create alarm"));
    await waitFor(() => {
      expect(screen.getByPlaceholderText("AWS/EC2")).toBeTruthy();
    });
    // Fill alarm name
    const nameInput = screen.getAllByRole("textbox")[0];
    await user.type(nameInput, "test-alarm");
    const createBtns = screen.getAllByText("Create");
    await user.click(createBtns[createBtns.length - 1]);
    expect(mockCreateAlarmMutate).toHaveBeenCalled();
  });
});
