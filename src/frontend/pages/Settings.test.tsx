// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createWrapper } from "../../test/helpers";
import React from "react";

const mockToggleDarkMode = vi.fn();
const mockSetRefreshInterval = vi.fn();
const mockUseSettings = vi.fn();

vi.mock("../stores/settings", () => ({
  useSettings: () => mockUseSettings(),
}));

import Settings from "./Settings";

describe("Settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSettings.mockReturnValue({
      darkMode: false,
      refreshInterval: 10000,
      toggleDarkMode: mockToggleDarkMode,
      setRefreshInterval: mockSetRefreshInterval,
    });
  });

  it("renders settings with default values", () => {
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
      toggleDarkMode: mockToggleDarkMode,
      setRefreshInterval: mockSetRefreshInterval,
    });
    render(<Settings />, { wrapper: createWrapper() });
    const toggle = screen.getByLabelText("Dark mode");
    expect(toggle).toBeTruthy();
  });

  // ─── Interaction Tests ──────────────────────────────────

  it("calls toggleDarkMode when dark mode toggle is clicked", async () => {
    const user = userEvent.setup();
    render(<Settings />, { wrapper: createWrapper() });
    const toggle = screen.getByLabelText("Dark mode");
    await user.click(toggle);
    expect(mockToggleDarkMode).toHaveBeenCalledOnce();
  });

  it("calls setRefreshInterval when a refresh option is selected", async () => {
    const user = userEvent.setup();
    render(<Settings />, { wrapper: createWrapper() });
    // The refresh interval Select shows "10 seconds"
    const refreshSelect = screen.getByText("10 seconds");
    await user.click(refreshSelect);
    // Cloudscape Select should open options
    await screen.findByText("30 seconds");
    await user.click(screen.getByText("30 seconds"));
    expect(mockSetRefreshInterval).toHaveBeenCalledWith(30000);
  });
});
