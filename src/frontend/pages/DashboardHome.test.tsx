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
    expect(screen.getByText("Floci Dashboard")).toBeTruthy();
    expect(screen.getByText("Connected — v1.5.22")).toBeTruthy();
    expect(screen.getByText("50")).toBeTruthy();
    expect(screen.getByText("30")).toBeTruthy();
    expect(screen.getByText("Community")).toBeTruthy();
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
});
