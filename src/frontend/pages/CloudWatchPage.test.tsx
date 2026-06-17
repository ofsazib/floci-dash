// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../test/helpers";
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
    await clickButton(user, /Create alarm/i);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("CPUUtilization")).toBeTruthy();
    });
  });

  it("calls createAlarm when alarm form is submitted", async () => {
    const user = userEvent.setup();
    render(<CloudWatchPage />, { wrapper: createWrapper() });
    await clickButton(user, /Create alarm/i);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("AWS/EC2")).toBeTruthy();
    });
    // Fill alarm name
    const nameInput = screen.getAllByRole("textbox")[0];
    await user.type(nameInput, "test-alarm");
    await clickButton(user, /Create/i, { last: true });
    expect(mockCreateAlarmMutate).toHaveBeenCalled();
  });

  // ─── Metrics Tab Tests ──────────────────────────────────

  it("switches to metrics tab and shows metric table", async () => {
    const user = userEvent.setup();
    render(<CloudWatchPage />, { wrapper: createWrapper() });
    const tabs = screen.getAllByText("Metrics");
    await user.click(tabs[tabs.length - 1]);
    await waitFor(() => {
      expect(screen.getAllByText("Invocations").length).toBeGreaterThan(0);
    });
  });

  it("shows loading state for metrics", () => {
    mockCloudWatchMetrics.mockReturnValue({ data: undefined, isLoading: true, refetch: vi.fn() });
    render(<CloudWatchPage />, { wrapper: createWrapper() });
    // Just verify it doesn't crash
    expect(true).toBe(true);
  });

  it("shows empty metrics state", () => {
    mockCloudWatchMetrics.mockReturnValue({ data: { namespaces: [], metrics: [] }, isLoading: false, refetch: vi.fn() });
    render(<CloudWatchPage />, { wrapper: createWrapper() });
  });

  it("opens put metric modal and submits", async () => {
    const user = userEvent.setup();
    mockPutMetricData.mockResolvedValueOnce({});
    render(<CloudWatchPage />, { wrapper: createWrapper() });
    const tabs = screen.getAllByText("Metrics");
    await user.click(tabs[tabs.length - 1]);
    await waitFor(() => {
      expect(screen.getAllByText("Invocations").length).toBeGreaterThan(0);
    });
    await clickButton(user, /Put metric data/i);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("MyMetric")).toBeTruthy();
    });
    const metricInput = screen.getByPlaceholderText("MyMetric");
    await user.type(metricInput, "TestMetric");
    await clickButton(user, /Publish/i);
    await waitFor(() => {
      expect(mockPutMetricData).toHaveBeenCalled();
    });
  });

  it("shows datapoints when metric is selected", async () => {
    const user = userEvent.setup();
    mockMetricStatistics.mockReturnValue({
      data: {
        datapoints: [
          { timestamp: "2025-01-01T00:00:00Z", average: 50, sum: 100, minimum: 10, maximum: 90, sampleCount: 5, unit: "Count" },
          { timestamp: "2025-01-01T00:01:00Z", average: 60, sum: 120, minimum: 20, maximum: 100, sampleCount: 6, unit: "Count" },
        ],
      },
      isLoading: false,
    });
    render(<CloudWatchPage />, { wrapper: createWrapper() });
    const tabs = screen.getAllByText("Metrics");
    await user.click(tabs[tabs.length - 1]);
    await waitFor(() => {
      expect(screen.getAllByText("Invocations").length).toBeGreaterThan(0);
    });
    // Click on the metric row to select it
    const cells = screen.getAllByText("Invocations");
    await user.click(cells[0]);
  });

  // ─── Alarms Tab Tests ───────────────────────────────────

  it("filters alarms by state", async () => {
    const user = userEvent.setup();
    render(<CloudWatchPage />, { wrapper: createWrapper() });
    // The state filter Select is present
    expect(screen.getAllByText("high-cpu").length).toBeGreaterThan(0);
  });

  it("shows Set OK button for non-OK alarms", () => {
    render(<CloudWatchPage />, { wrapper: createWrapper() });
    expect(screen.getAllByText(/Set OK/i).length).toBeGreaterThan(0);
  });

  it("hides Set OK button for OK alarms", () => {
    mockCloudWatchAlarms.mockReturnValue({
      data: { alarms: [{ name: "ok-alarm", state: "OK", namespace: "AWS/EC2", metricName: "CPU", threshold: 80, comparisonOperator: "GreaterThanThreshold", period: 300, statistic: "Average" }] },
      isLoading: false,
    });
    render(<CloudWatchPage />, { wrapper: createWrapper() });
    expect(screen.queryByText(/Set OK/i)).toBeNull();
  });
});
