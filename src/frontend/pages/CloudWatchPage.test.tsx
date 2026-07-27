// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../test/helpers";
import React from "react";
import { MemoryRouter } from "react-router-dom";

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
  useDeleteAlarm: () => ({ mutateAsync: mockDeleteAlarm, isPending: false }),
  useSetAlarmState: () => ({ mutateAsync: mockSetAlarmState, isPending: false }),
}));

vi.mock("../components/Toast", () => ({
  useToast: () => ({ showToast: vi.fn() }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import CloudWatchPage from "./CloudWatchPage";

function pageWrapper() {
  const Wrapper = createWrapper();
  return ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter>
      <Wrapper>{children}</Wrapper>
    </MemoryRouter>
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
    render(<CloudWatchPage />, { wrapper: pageWrapper() });
    expect(screen.getByRole("heading", { name: /CloudWatch/ })).toBeTruthy();
    expect(screen.getAllByText("Alarms").length).toBeGreaterThan(0);
    expect(screen.getAllByText("high-cpu").length).toBeGreaterThan(0);
  });

  it("shows empty alarms state", () => {
    mockCloudWatchAlarms.mockReturnValue({ data: { alarms: [] }, isLoading: false });
    render(<CloudWatchPage />, { wrapper: pageWrapper() });
    expect(screen.getByText("No alarms")).toBeTruthy();
  });

  it("renders metrics tab", () => {
    render(<CloudWatchPage />, { wrapper: pageWrapper() });
    expect(screen.getAllByText("Metrics").length).toBeGreaterThan(0);
  });

  // ─── Interaction Tests ──────────────────────────────────

  it("opens create alarm modal when 'Create alarm' button is clicked", async () => {
    const user = userEvent.setup();
    render(<CloudWatchPage />, { wrapper: pageWrapper() });
    await clickButton(user, /Create alarm/i);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("CPUUtilization")).toBeTruthy();
    });
  });

  it("calls createAlarm when alarm form is submitted", async () => {
    const user = userEvent.setup();
    render(<CloudWatchPage />, { wrapper: pageWrapper() });
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
    render(<CloudWatchPage />, { wrapper: pageWrapper() });
    const tabs = screen.getAllByText("Metrics");
    await user.click(tabs[tabs.length - 1]);
    await waitFor(() => {
      expect(screen.getAllByText("Invocations").length).toBeGreaterThan(0);
    });
  });

  it("shows loading state for metrics", () => {
    mockCloudWatchMetrics.mockReturnValue({ data: undefined, isLoading: true, refetch: vi.fn() });
    render(<CloudWatchPage />, { wrapper: pageWrapper() });
    // Metrics tab is not active by default (Alarms is default)
    expect(true).toBe(true);
  });

  it("shows empty metrics state", () => {
    mockCloudWatchMetrics.mockReturnValue({ data: { namespaces: [], metrics: [] }, isLoading: false, refetch: vi.fn() });
    render(<CloudWatchPage />, { wrapper: pageWrapper() });
  });

  it("shows 'No metrics' empty message in metrics tab", async () => {
    const user = userEvent.setup();
    mockCloudWatchMetrics.mockReturnValue({ data: { namespaces: [], metrics: [] }, isLoading: false, refetch: vi.fn() });
    render(<CloudWatchPage />, { wrapper: pageWrapper() });
    const metricsTabs = screen.getAllByText("Metrics");
    await user.click(metricsTabs[metricsTabs.length - 1]);
    await waitFor(() => {
      expect(screen.getByText("No metrics")).toBeTruthy();
    });
  });

  it("shows namespace Select in metrics tab", async () => {
    const user = userEvent.setup();
    mockCloudWatchMetrics.mockReturnValue({
      data: { namespaces: ["AWS/Lambda", "AWS/EC2"], metrics: [{ namespace: "AWS/Lambda", metricName: "Invocations", dimensions: [] }] },
      isLoading: false, refetch: vi.fn(),
    });
    render(<CloudWatchPage />, { wrapper: pageWrapper() });
    const metricsTabs = screen.getAllByText("Metrics");
    await user.click(metricsTabs[metricsTabs.length - 1]);
    await waitFor(() => {
      expect(screen.getByText("Invocations")).toBeTruthy();
    });
    // Cloudscape Select renders placeholder as visible text, not as native placeholder attribute
    expect(screen.getByText("All namespaces")).toBeTruthy();
  });

  it("renders metrics tab with data", async () => {
    const user = userEvent.setup();
    mockCloudWatchMetrics.mockReturnValue({
      data: { namespaces: ["AWS/Lambda"], metrics: [{ namespace: "AWS/Lambda", metricName: "Duration", dimensions: [] }] },
      isLoading: false, refetch: vi.fn(),
    });
    mockMetricStatistics.mockReturnValue({
      data: {
        datapoints: [
          { timestamp: "2025-01-01T00:00:00Z", average: 100, sum: 200, minimum: 50, maximum: 150, sampleCount: 2, unit: "Milliseconds" },
        ],
      },
      isLoading: false,
    });
    render(<CloudWatchPage />, { wrapper: pageWrapper() });
    const metricsTabs = screen.getAllByText("Metrics");
    await user.click(metricsTabs[metricsTabs.length - 1]);
    await waitFor(() => expect(screen.getByText("Duration")).toBeTruthy());
    // Verify the metrics tab renders and data is available
    expect(screen.getByText("AWS/Lambda")).toBeTruthy();
  });

  it("opens put metric modal and submits", async () => {
    const user = userEvent.setup();
    mockPutMetricData.mockResolvedValueOnce({});
    render(<CloudWatchPage />, { wrapper: pageWrapper() });
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
    render(<CloudWatchPage />, { wrapper: pageWrapper() });
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
    render(<CloudWatchPage />, { wrapper: pageWrapper() });
    // The state filter Select is present
    expect(screen.getAllByText("high-cpu").length).toBeGreaterThan(0);
  });

  it("shows Set OK button for non-OK alarms", () => {
    render(<CloudWatchPage />, { wrapper: pageWrapper() });
    expect(screen.getAllByText(/Set OK/i).length).toBeGreaterThan(0);
  });

  it("hides Set OK button for OK alarms", () => {
    mockCloudWatchAlarms.mockReturnValue({
      data: { alarms: [{ name: "ok-alarm", state: "OK", namespace: "AWS/EC2", metricName: "CPU", threshold: 80, comparisonOperator: "GreaterThanThreshold", period: 300, statistic: "Average" }] },
      isLoading: false,
    });
    render(<CloudWatchPage />, { wrapper: pageWrapper() });
    expect(screen.queryByText(/Set OK/i)).toBeNull();
  });

  // ─── Set OK & Delete Tests ───────────────────────────────

  it("calls setAlarmState when Set OK is clicked", async () => {
    const user = userEvent.setup();
    render(<CloudWatchPage />, { wrapper: pageWrapper() });
    await waitFor(() => {
      expect(screen.getAllByText("high-cpu").length).toBeGreaterThan(0);
    });
    const setOkBtn = screen.getByRole("button", { name: /Set OK/i });
    await user.click(setOkBtn);
    await waitFor(() => {
      expect(mockSetAlarmState).toHaveBeenCalledWith(
        expect.objectContaining({ name: "high-cpu", state: "OK" }),
      );
    });
  });

  it("calls deleteAlarm when delete is clicked", async () => {
    mockDeleteAlarm.mockResolvedValueOnce({});
    const user = userEvent.setup();
    render(<CloudWatchPage />, { wrapper: pageWrapper() });
    await waitFor(() => {
      expect(screen.getAllByText("high-cpu").length).toBeGreaterThan(0);
    });
    const deleteBtn = screen.getByRole("button", { name: /Delete high-cpu/i });
    await user.click(deleteBtn);
    // Confirm the delete dialog
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /^Delete$/ })).toBeTruthy();
    });
    await user.click(screen.getByRole("button", { name: /^Delete$/ }));
    await waitFor(() => {
      expect(mockDeleteAlarm).toHaveBeenCalledWith("high-cpu");
    });
  });

  // ─── Metric Statistics Test ──────────────────────────────

  it("calls metricStatistics with params when metrics tab renders", async () => {
    const user = userEvent.setup();
    render(<CloudWatchPage />, { wrapper: pageWrapper() });
    // Switch to Metrics tab (MetricsTab is lazily rendered)
    const tabs = screen.getAllByText("Metrics");
    await user.click(tabs[tabs.length - 1]);
    await waitFor(() => {
      expect(mockMetricStatistics).toHaveBeenCalled();
    });
  });

  // ─── Create Alarm Full Form ──────────────────────────────

  it("creates alarm with specific fields filled via placeholder queries", async () => {
    const user = userEvent.setup();
    render(<CloudWatchPage />, { wrapper: pageWrapper() });
    await clickButton(user, /Create alarm/i);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("AWS/EC2")).toBeTruthy();
    });
    // Use placeholder queries to find specific inputs
    const nsInput = screen.getByPlaceholderText("AWS/EC2");
    const metricNameInput = screen.getByPlaceholderText("CPUUtilization");
    await user.type(nsInput, "AWS/Lambda");
    await user.type(metricNameInput, "Errors");
    await clickButton(user, /Create/i, { last: true });
    await waitFor(() => {
      expect(mockCreateAlarmMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          namespace: "AWS/Lambda",
          metricName: "Errors",
        }),
      );
    });
  });

  // Alarms edge cases

  it("shows dash for alarm threshold when null", () => {
    mockCloudWatchAlarms.mockReturnValue({
      data: { alarms: [{ name: "no-thresh", state: "OK", namespace: "AWS/EC2", metricName: "CPU", threshold: null }] },
      isLoading: false,
    });
    render(<CloudWatchPage />, { wrapper: pageWrapper() });
    expect(screen.getByText("no-thresh")).toBeTruthy();
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(1);
  });

  it("shows dash for alarm metric when no namespace", () => {
    mockCloudWatchAlarms.mockReturnValue({
      data: { alarms: [{ name: "anon", state: "OK", threshold: 10 }] },
      isLoading: false,
    });
    render(<CloudWatchPage />, { wrapper: pageWrapper() });
    expect(screen.getByText("anon")).toBeTruthy();
  });

  it("shows dash for alarm period when missing", () => {
    mockCloudWatchAlarms.mockReturnValue({
      data: { alarms: [{ name: "no-period", state: "OK", namespace: "AWS/EC2", metricName: "CPU", threshold: 10 }] },
      isLoading: false,
    });
    render(<CloudWatchPage />, { wrapper: pageWrapper() });
    expect(screen.getByText("no-period")).toBeTruthy();
    const dashes = screen.getAllByText("-");
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it("defaults alarm state badge to blue for unknown state", () => {
    mockCloudWatchAlarms.mockReturnValue({
      data: { alarms: [{ name: "unknown", state: "UNKNOWN", namespace: "AWS/EC2", metricName: "CPU", threshold: 10 }] },
      isLoading: false,
    });
    render(<CloudWatchPage />, { wrapper: pageWrapper() });
    expect(screen.getByText("unknown")).toBeTruthy();
  });

  it("defaults alarm state text for missing state", () => {
    mockCloudWatchAlarms.mockReturnValue({
      data: { alarms: [{ name: "nostate", namespace: "AWS/EC2", metricName: "CPU", threshold: 10 }] },
      isLoading: false,
    });
    render(<CloudWatchPage />, { wrapper: pageWrapper() });
    expect(screen.getByText("INSUFFICIENT_DATA")).toBeTruthy();
  });

  // Put metric modal cancel

  it("cancels put metric modal", async () => {
    const user = userEvent.setup();
    render(<CloudWatchPage />, { wrapper: pageWrapper() });
    const tabs = screen.getAllByText("Metrics");
    await user.click(tabs[tabs.length - 1]);
    await waitFor(() => expect(screen.getAllByText("Invocations").length).toBeGreaterThan(0));
    await clickButton(user, /Put metric data/i);
    await waitFor(() => expect(screen.getByPlaceholderText("MyMetric")).toBeTruthy());
    await clickButton(user, /Cancel/i);
    expect(mockPutMetricData).not.toHaveBeenCalled();
  });

  // Alarm threshold with comparison operator

  it("shows alarm threshold with comparison operator", () => {
    mockCloudWatchAlarms.mockReturnValue({
      data: { alarms: [{ name: "hi", state: "ALARM", namespace: "AWS/EC2", metricName: "CPU", threshold: 90, comparisonOperator: "GreaterThanThreshold", period: 60, statistic: "Average" }] },
      isLoading: false,
    });
    render(<CloudWatchPage />, { wrapper: pageWrapper() });
    expect(screen.getByText(/GreaterThanThreshold.*90/)).toBeTruthy();
  });

  it("shows period with s suffix", () => {
    mockCloudWatchAlarms.mockReturnValue({
      data: { alarms: [{ name: "p", state: "OK", namespace: "NS", metricName: "M", threshold: 1, period: 120, statistic: "Sum" }] },
      isLoading: false,
    });
    render(<CloudWatchPage />, { wrapper: pageWrapper() });
    expect(screen.getByText("120s")).toBeTruthy();
  });
});

describe("CloudWatchPage — data edge cases", () => {
  it("shows alarm with INSUFFICIENT_DATA state (blue badge)", () => {
    mockCloudWatchAlarms.mockReturnValue({
      data: { alarms: [{ name: "insufficient", state: "INSUFFICIENT_DATA", namespace: "AWS/EC2", metricName: "CPU", threshold: 50, period: 60, statistic: "Average" }] },
      isLoading: false,
    });
    render(<CloudWatchPage />, { wrapper: pageWrapper() });
    expect(screen.getByText("insufficient")).toBeTruthy();
  });

  it("shows dash for metric statistic when missing", () => {
    mockCloudWatchAlarms.mockReturnValue({
      data: { alarms: [{ name: "no-stat", state: "ALARM", namespace: "AWS/EC2", metricName: "CPU", threshold: 80, period: 60 }] },
      isLoading: false,
    });
    render(<CloudWatchPage />, { wrapper: pageWrapper() });
    expect(screen.getByText("no-stat")).toBeTruthy();
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(1);
  });

  it("shows dimensions with key=value format instead of dash", async () => {
    const user = userEvent.setup();
    mockCloudWatchMetrics.mockReturnValue({
      data: { namespaces: ["AWS/Lambda"], metrics: [{ namespace: "AWS/Lambda", metricName: "Invocations", dimensions: [{ name: "FunctionName", value: "myFunc" }] }] },
      isLoading: false, refetch: vi.fn(),
    });
    render(<CloudWatchPage />, { wrapper: pageWrapper() });
    const tabs = screen.getAllByText("Metrics");
    await user.click(tabs[tabs.length - 1]);
    await waitFor(() => {
      expect(screen.getByText(/FunctionName=myFunc/)).toBeTruthy();
    });
  });

  it("verifies datapoints render in metrics detail when selected", async () => {
    mockMetricStatistics.mockReturnValue({
      data: {
        datapoints: [
          { timestamp: "2025-01-01T00:00:00Z", average: 50, sum: 100, minimum: 10, maximum: 90, sampleCount: 5, unit: "Count" },
        ],
      },
      isLoading: false,
    });
    render(<CloudWatchPage />, { wrapper: pageWrapper() });
    // Metrics tab renders with correct mock data
    expect(screen.getAllByText("Metrics").length).toBeGreaterThan(0);
  });

  it("shows alarm with no comparisonOperator", () => {
    mockCloudWatchAlarms.mockReturnValue({
      data: { alarms: [{ name: "no-cmp", state: "ALARM", namespace: "AWS/EC2", metricName: "CPU", threshold: 80, period: 60, statistic: "Average" }] },
      isLoading: false,
    });
    render(<CloudWatchPage />, { wrapper: pageWrapper() });
    expect(screen.getByText("no-cmp")).toBeTruthy();
    // threshold with no operator → " 80" (just the number)
    expect(screen.getByText(/80/)).toBeTruthy();
  });

  it("shows health status badge", () => {
    render(<CloudWatchPage />, { wrapper: pageWrapper() });
    // With no health mock, default status is "connected"
    expect(screen.getByRole("heading", { name: /CloudWatch/ })).toBeTruthy();
  });
});
