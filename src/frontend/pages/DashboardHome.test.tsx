// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const mockHealth = vi.fn();
const mockActive = vi.fn();

vi.mock("../hooks/useSystem", () => ({
  useHealth: (...args: any[]) => mockHealth(...args),
  useActiveServices: (...args: any[]) => mockActive(...args),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

import DashboardHome from "./DashboardHome";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("DashboardHome", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    render(<DashboardHome />, { wrapper: createWrapper() });
    expect(screen.getByText("Floci Dashboard")).toBeTruthy();
    expect(screen.getByText("Connected — v1.5.22")).toBeTruthy();
    expect(screen.getByText("50")).toBeTruthy();
    expect(screen.getByText("30")).toBeTruthy();
    expect(screen.getByText("Community")).toBeTruthy();
    expect(screen.getByText("Open S3")).toBeTruthy();
    expect(screen.getByText("Open EC2")).toBeTruthy();
  });
});
