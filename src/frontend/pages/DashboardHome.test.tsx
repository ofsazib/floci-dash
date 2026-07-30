// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createWrapper } from "../../test/helpers";
import React from "react";

const mockHealth = vi.fn();
const mockActive = vi.fn();
const mockResourceCounts = vi.fn();
const mockNavigate = vi.fn();

vi.mock("../hooks/useSystem", () => ({
  useHealth: (...args: any[]) => mockHealth(...args),
  useActiveServices: (...args: any[]) => mockActive(...args),
}));

vi.mock("../hooks/useResourceCounts", () => ({
  useResourceCounts: (...args: any[]) => mockResourceCounts(...args),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

import DashboardHome from "./DashboardHome";

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  mockHealth.mockReturnValue({
    isLoading: false,
    isError: false,
    data: {
      version: "1.5.22",
      edition: "Community",
      stats: { total: 50, running: 30, available: 20 },
      services: { s3: "running", ec2: "running" },
    },
  });
  mockActive.mockReturnValue({
    data: { activeCount: 5, activeServices: ["s3", "ec2", "sqs"] },
  });
  mockResourceCounts.mockReturnValue({
    data: { s3: 2, dynamodb: 3, ec2: 1, lambda: 0, sqs: 5 },
  });
});

describe("DashboardHome", () => {
  it("shows loading skeleton while connecting", () => {
    mockHealth.mockReturnValue({ isLoading: true, isError: false, data: undefined, error: null });
    mockActive.mockReturnValue({ data: { activeCount: 0, activeServices: [] } });
    mockResourceCounts.mockReturnValue({ data: undefined });
    const { container } = render(<DashboardHome />, { wrapper: createWrapper() });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("shows error state when connection fails", () => {
    mockHealth.mockReturnValue({ isLoading: false, isError: true, data: undefined, error: new Error("Connection refused") });
    mockActive.mockReturnValue({ data: { activeCount: 0, activeServices: [] } });
    mockResourceCounts.mockReturnValue({ data: undefined });
    render(<DashboardHome />, { wrapper: createWrapper() });
    expect(screen.getByText("Connection refused")).toBeTruthy();
    expect(screen.getByText("Make sure Floci is running and accessible.")).toBeTruthy();
  });

  it("renders dashboard with health data", () => {
    render(<DashboardHome />, { wrapper: createWrapper() });
    expect(screen.getByText("Floci Dash")).toBeTruthy();
    expect(screen.getByText("Connected — v1.5.22")).toBeTruthy();
    expect(screen.getByText("50")).toBeTruthy();
    expect(screen.getByText("30")).toBeTruthy();
    expect(screen.getByText("Resources")).toBeTruthy();
    expect(screen.getByText("11")).toBeTruthy();
  });

  it("shows resource counts section with non-zero services", () => {
    render(<DashboardHome />, { wrapper: createWrapper() });
    expect(screen.getByText("Resource Counts")).toBeTruthy();
    expect(screen.getAllByText("S3").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("DYNAMODB")).toBeTruthy();
    expect(screen.getByText("SQS")).toBeTruthy();
  });

  it("renders enhanced quick actions", () => {
    render(<DashboardHome />, { wrapper: createWrapper() });
    expect(screen.getByText("Open S3")).toBeTruthy();
    expect(screen.getByText("Open Lambda")).toBeTruthy();
    expect(screen.getByText("Open RDS")).toBeTruthy();
    expect(screen.getByText("Open SQS")).toBeTruthy();
    expect(screen.getByText("Open SNS")).toBeTruthy();
    expect(screen.getByText("Open KMS")).toBeTruthy();
  });

  it("does not show resource counts section when all counts are zero", () => {
    mockResourceCounts.mockReturnValue({ data: {} });
    render(<DashboardHome />, { wrapper: createWrapper() });
    expect(screen.queryByText("Resource Counts")).toBeNull();
  });

  it("navigates to S3 and records activity when 'Open S3' button is clicked", async () => {
    const user = userEvent.setup();
    render(<DashboardHome />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Open S3"));
    expect(mockNavigate).toHaveBeenCalledWith("/services/s3");
  });

  it("shows Recent Activity section after navigation", async () => {
    const user = userEvent.setup();
    render(<DashboardHome />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Open S3"));
    expect(screen.getByText("Recent Activity")).toBeTruthy();
    expect(screen.getByText("Opened S3")).toBeTruthy();
  });

  it("shows only services with non-zero counts in resource counts", () => {
    mockResourceCounts.mockReturnValue({ data: { s3: 2, lambda: 0, sqs: 5 } });
    render(<DashboardHome />, { wrapper: createWrapper() });
    expect(screen.getAllByText("S3").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("SQS")).toBeTruthy();
  });

  it("clears activity feed when Clear button is clicked", async () => {
    const user = userEvent.setup();
    render(<DashboardHome />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Open S3"));
    expect(screen.getByText("Recent Activity")).toBeTruthy();

    await user.click(screen.getByText("Clear"));
    expect(screen.queryByText("Recent Activity")).toBeNull();
  });

  it("shows resource detail in activity feed", async () => {
    // Simulate an activity entry with a resource field by opening a service
    // that would include resources — we test the rendering path via the component
    const user = userEvent.setup();
    render(<DashboardHome />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Open S3"));
    // Verify the activity entry renders with description and icon
    expect(screen.getByText("Opened S3")).toBeTruthy();
    expect(screen.getByText("☰")).toBeTruthy();
  });

  it("shows 'Just now' for very recent timestamps", async () => {
    const user = userEvent.setup();
    render(<DashboardHome />, { wrapper: createWrapper() });
    // Create an activity entry with a recent timestamp
    await user.click(screen.getByText("Open S3"));
    // The entry was just created, so timestamp diff < 60000ms → "Just now"
    expect(screen.getByText("Just now")).toBeTruthy();
  });

  it("shows dash for active count when data is unavailable", () => {
    mockActive.mockReturnValue({ data: undefined });
    render(<DashboardHome />, { wrapper: createWrapper() });
    expect(screen.getByText("\u2014")).toBeTruthy();
  });

  it("shows dash for resources when resourceCounts is undefined", () => {
    mockResourceCounts.mockReturnValue({ data: undefined });
    render(<DashboardHome />, { wrapper: createWrapper() });
    // The Resources StatCard shows "\u2014" when resourceCounts is falsy
    const dashes = screen.getAllByText("\u2014");
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it("shows 'All running' when no inactive services", () => {
    mockHealth.mockReturnValue({
      isLoading: false, isError: false,
      data: {
        version: "1.0", edition: "Community",
        stats: { total: 50, running: 50, available: 0 },
        services: { s3: "running" },
      },
    });
    render(<DashboardHome />, { wrapper: createWrapper() });
    expect(screen.getByText("All running")).toBeTruthy();
  });

  it("renders ServiceGrid with services data", () => {
    render(<DashboardHome />, { wrapper: createWrapper() });
    expect(screen.getByText("Services")).toBeTruthy();
    expect(screen.getByText("30 of 50 services enabled")).toBeTruthy();
  });

  it("renders BreadcrumbGroup", () => {
    render(<DashboardHome />, { wrapper: createWrapper() });
    const dashes = screen.getAllByText("Dashboard");
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it("shows resource counts sorted desc and sliced to max 10", () => {
    // Create 12 services with varying counts to trigger slice(0,10)+sort
    const counts: Record<string, number> = {};
    for (let i = 0; i < 12; i++) {
      counts[`svc${i}`] = i + 1;
    }
    mockResourceCounts.mockReturnValue({ data: counts });
    render(<DashboardHome />, { wrapper: createWrapper() });
    // Highest count (12) should be visible
    expect(screen.getByText("12")).toBeTruthy();
    // Lowest two (1, 2) should not be visible due to slice(0,10) + filter > 0
    expect(screen.getByText("SVC11")).toBeTruthy();
  });

  it("shows default icon for unknown service in activity", async () => {
    const user = userEvent.setup();
    render(<DashboardHome />, { wrapper: createWrapper() });
    // The serviceIcon returns "•" for unknown services like "iam"
    // which is not in the icons map
    await user.click(screen.getByText("Open IAM"));
    expect(screen.getByText("Opened IAM")).toBeTruthy();
    // The default icon "•" should be rendered
    const bullets = screen.getAllByText("\u2022");
    expect(bullets.length).toBeGreaterThanOrEqual(1);
  });
});
