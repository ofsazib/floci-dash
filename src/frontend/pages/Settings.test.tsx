// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createWrapper } from "../../test/helpers";
import React from "react";

const mockToggleDarkMode = vi.fn();
const mockSetRefreshInterval = vi.fn();
const mockSetFlociEndpoint = vi.fn();
const mockUseSettings = vi.fn();

vi.mock("../stores/settings", () => ({
  useSettings: () => mockUseSettings(),
}));

const mockApi = vi.hoisted(() => vi.fn());
vi.mock("../lib/client", () => ({
  api: (...args: any[]) => mockApi(...args),
}));

import Settings from "./Settings";

describe("Settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSettings.mockReturnValue({
      darkMode: false,
      refreshInterval: 10000,
      flociEndpoint: "http://localhost:4566",
      toggleDarkMode: mockToggleDarkMode,
      setRefreshInterval: mockSetRefreshInterval,
      setFlociEndpoint: mockSetFlociEndpoint,
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
      flociEndpoint: "http://localhost:4566",
      toggleDarkMode: mockToggleDarkMode,
      setRefreshInterval: mockSetRefreshInterval,
      setFlociEndpoint: mockSetFlociEndpoint,
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

  // ─── Floci Endpoint Configuration ───────────────────────

  it("renders Floci Connection section with endpoint input", () => {
    render(<Settings />, { wrapper: createWrapper() });
    expect(screen.getByText("Floci Connection")).toBeTruthy();
    expect(screen.getByDisplayValue("http://localhost:4566")).toBeTruthy();
    expect(screen.getByText("Save endpoint")).toBeTruthy();
  });

  it("updates the endpoint input when typed", async () => {
    const user = userEvent.setup();
    render(<Settings />, { wrapper: createWrapper() });
    const input = screen.getByDisplayValue("http://localhost:4566");
    await user.clear(input);
    await user.type(input, "http://my-floci:4566");
    expect(screen.getByDisplayValue("http://my-floci:4566")).toBeTruthy();
  });

  it("calls API and setFlociEndpoint on save success", async () => {
    mockApi.mockResolvedValueOnce({ endpoint: "http://my-floci:4566" });
    const user = userEvent.setup();
    render(<Settings />, { wrapper: createWrapper() });
    const input = screen.getByDisplayValue("http://localhost:4566");
    await user.clear(input);
    await user.type(input, "http://my-floci:4566");
    await user.click(screen.getByText("Save endpoint"));
    await waitFor(() => {
      expect(mockApi).toHaveBeenCalledWith("/system/floci-endpoint", {
        method: "PUT",
        body: JSON.stringify({ endpoint: "http://my-floci:4566" }),
      });
    });
    expect(mockSetFlociEndpoint).toHaveBeenCalledWith("http://my-floci:4566");
  });

  it("shows success alert after save", async () => {
    mockApi.mockResolvedValueOnce({ endpoint: "http://my-floci:4566" });
    const user = userEvent.setup();
    render(<Settings />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Save endpoint"));
    await waitFor(() => {
      expect(screen.getByText(/Endpoint updated/)).toBeTruthy();
    });
  });

  it("shows error alert when save fails", async () => {
    mockApi.mockRejectedValueOnce(new Error("Connection refused"));
    const user = userEvent.setup();
    render(<Settings />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Save endpoint"));
    await waitFor(() => {
      expect(screen.getByText(/Connection refused/)).toBeTruthy();
    });
    expect(mockSetFlociEndpoint).not.toHaveBeenCalled();
  });

  it("shows default placeholder when no endpoint stored", () => {
    mockUseSettings.mockReturnValue({
      darkMode: false,
      refreshInterval: 10000,
      flociEndpoint: undefined,
      toggleDarkMode: mockToggleDarkMode,
      setRefreshInterval: mockSetRefreshInterval,
      setFlociEndpoint: mockSetFlociEndpoint,
    });
    render(<Settings />, { wrapper: createWrapper() });
    expect(screen.getByDisplayValue("http://localhost:4566")).toBeTruthy();
  });
});
