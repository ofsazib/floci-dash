// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createWrapper } from "../../test/helpers";
import React from "react";

const mockHealth = vi.fn();
const mockActive = vi.fn();
const mockNavigate = vi.fn();

vi.mock("../hooks/useSystem", () => ({
  useHealth: (...args: any[]) => mockHealth(...args),
  useActiveServices: (...args: any[]) => mockActive(...args),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

import DashboardHome from "./DashboardHome";

describe("DashboardHome", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
  });

  it("shows loading spinner while connecting", () => {
    mockHealth.mockReturnValue({ isLoading: true, isError: false, data: undefined, error: null });
    mockActive.mockReturnValue({ data: { activeCount: 0, activeServices: [] } });
    render(<DashboardHome />, { wrapper: createWrapper() });
    expect(screen.getByText("Connecting to Floci...")).toBeTruthy();
  });

  it("shows error state when connection fails", () => {
    mockHealth.mockReturnValue({ isLoading: false, isError: true, data: undefined, error: new Error("Connection refused") });
    mockActive.mockReturnValue({ data: { activeCount: 0, activeServices: [] } });
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
    expect(screen.getByText("Open S3")).toBeTruthy();
    expect(screen.getByText("Open EC2")).toBeTruthy();
  });

  // ─── Interaction Tests ──────────────────────────────────

  it("navigates to S3 when 'Open S3' button is clicked", async () => {
    const user = userEvent.setup();
    render(<DashboardHome />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Open S3"));
    expect(mockNavigate).toHaveBeenCalledWith("/services/s3");
  });

  it("navigates to DynamoDB when 'Open DynamoDB' button is clicked", async () => {
    const user = userEvent.setup();
    render(<DashboardHome />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Open DynamoDB"));
    expect(mockNavigate).toHaveBeenCalledWith("/services/dynamodb");
  });

  it("navigates to EC2 when 'Open EC2' button is clicked", async () => {
    const user = userEvent.setup();
    render(<DashboardHome />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Open EC2"));
    expect(mockNavigate).toHaveBeenCalledWith("/services/ec2");
  });

  it("navigates to IAM when 'Open IAM' button is clicked", async () => {
    const user = userEvent.setup();
    render(<DashboardHome />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Open IAM"));
    expect(mockNavigate).toHaveBeenCalledWith("/services/iam");
  });
});
