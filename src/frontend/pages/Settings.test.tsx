// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const mockUseSettings = vi.fn();

vi.mock("../stores/settings", () => ({
  useSettings: () => mockUseSettings(),
}));

import Settings from "./Settings";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("Settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders settings with default values", () => {
    mockUseSettings.mockReturnValue({
      darkMode: false,
      refreshInterval: 10000,
      toggleDarkMode: vi.fn(),
      setRefreshInterval: vi.fn(),
    });
    render(<Settings />, { wrapper: createWrapper() });
    expect(screen.getByText("Settings")).toBeTruthy();
    expect(screen.getByText("Appearance")).toBeTruthy();
    expect(screen.getByText("Dark mode")).toBeTruthy();
    expect(screen.getByText("Data Refresh")).toBeTruthy();
    expect(screen.getByText("10 seconds")).toBeTruthy();
    expect(screen.getByText("About")).toBeTruthy();
    expect(screen.getByText("Floci Dashboard v0.1.0")).toBeTruthy();
  });

  it("shows dark mode toggle is checked when enabled", () => {
    mockUseSettings.mockReturnValue({
      darkMode: true,
      refreshInterval: 5000,
      toggleDarkMode: vi.fn(),
      setRefreshInterval: vi.fn(),
    });
    render(<Settings />, { wrapper: createWrapper() });
    const toggle = screen.getByLabelText("Dark mode");
    expect(toggle).toBeTruthy();
  });
});
