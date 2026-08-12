// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

const mockStartSession = vi.fn();
const mockGetLatest = vi.fn();
const mockShowToast = vi.fn();

vi.mock("../../hooks/useAppConfigData", () => ({
  useStartConfigurationSession: () => ({ mutateAsync: mockStartSession, isPending: false }),
  useGetLatestConfiguration: () => ({ mutateAsync: mockGetLatest, isPending: false }),
}));

vi.mock("../../components/Toast", () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

import { AppConfigDataDashboard } from "./AppConfigDataDashboard";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AppConfigDataDashboard", () => {
  it("renders start session form", () => {
    render(<AppConfigDataDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Start Configuration Session")).toBeTruthy();
    expect(screen.getByText("Application Identifier")).toBeTruthy();
    expect(screen.getByText("Environment Identifier")).toBeTruthy();
    expect(screen.getByText("Configuration Profile Identifier")).toBeTruthy();
  });

  it("disables start button when fields are empty", () => {
    render(<AppConfigDataDashboard />, { wrapper: createWrapper() });
    expect(screen.getByRole("button", { name: /Start Session/i })).toBeDisabled();
  });

  it("enables start button when all fields filled", async () => {
    const user = userEvent.setup();
    render(<AppConfigDataDashboard />, { wrapper: createWrapper() });

    const appInput = screen.getByPlaceholderText("my-app");
    const envInput = screen.getByPlaceholderText("prod");
    const profileInput = screen.getByPlaceholderText("profile-1");

    await user.type(appInput, "test-app");
    await user.type(envInput, "production");
    await user.type(profileInput, "config-1");

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Start Session/i })).not.toBeDisabled();
    });
  });

  it("shows configuration container after session start", async () => {
    mockStartSession.mockResolvedValue({ initialConfigurationToken: "test-token-abc-123" });
    const user = userEvent.setup();
    render(<AppConfigDataDashboard />, { wrapper: createWrapper() });

    const appInput = screen.getByPlaceholderText("my-app");
    const envInput = screen.getByPlaceholderText("prod");
    const profileInput = screen.getByPlaceholderText("profile-1");

    await user.type(appInput, "test-app");
    await user.type(envInput, "production");
    await user.type(profileInput, "config-1");

    await user.click(screen.getByRole("button", { name: /Start Session/i }));

    await waitFor(() => {
      expect(screen.getByText(/test-token-abc-123/)).toBeTruthy();
    });
  });

  it("shows Get Latest Configuration button after session", async () => {
    mockStartSession.mockResolvedValue({ initialConfigurationToken: "token-xyz" });
    const user = userEvent.setup();
    render(<AppConfigDataDashboard />, { wrapper: createWrapper() });

    await user.type(screen.getByPlaceholderText("my-app"), "app");
    await user.type(screen.getByPlaceholderText("prod"), "env");
    await user.type(screen.getByPlaceholderText("profile-1"), "prof");
    await user.click(screen.getByRole("button", { name: /Start Session/i }));

    await waitFor(() => {
      expect(screen.getByText("Get Latest Configuration")).toBeTruthy();
    });
  });

  it("shows result container after getting config", async () => {
    mockStartSession.mockResolvedValue({ initialConfigurationToken: "token-123" });
    mockGetLatest.mockResolvedValue({
      versionLabel: "v1",
      contentType: "application/json",
      content: '{"key": "value"}',
    });
    const user = userEvent.setup();
    render(<AppConfigDataDashboard />, { wrapper: createWrapper() });

    await user.type(screen.getByPlaceholderText("my-app"), "app");
    await user.type(screen.getByPlaceholderText("prod"), "env");
    await user.type(screen.getByPlaceholderText("profile-1"), "prof");
    await user.click(screen.getByRole("button", { name: /Start Session/i }));
    await waitFor(() => screen.getByText(/token-123/));

    await user.click(screen.getByText("Get Latest Configuration"));
    await waitFor(() => {
      expect(screen.getByText("v1")).toBeTruthy();
      expect(screen.getByText("application/json")).toBeTruthy();
    });
  });

  it("updates token when nextPollConfigurationToken is returned", async () => {
    mockStartSession.mockResolvedValue({ initialConfigurationToken: "token-a" });
    mockGetLatest.mockResolvedValue({ content: "hello", nextPollConfigurationToken: "token-b" });
    const user = userEvent.setup();
    render(<AppConfigDataDashboard />, { wrapper: createWrapper() });

    await user.type(screen.getByPlaceholderText("my-app"), "app");
    await user.type(screen.getByPlaceholderText("prod"), "env");
    await user.type(screen.getByPlaceholderText("profile-1"), "prof");
    await user.click(screen.getByRole("button", { name: /Start Session/i }));
    await waitFor(() => screen.getByText(/token-a/));

    await user.click(screen.getByText("Get Latest Configuration"));
    await waitFor(() => {
      expect(screen.getByText(/token-b/)).toBeTruthy();
    });
  });

  it("shows dash and empty fallbacks for sparse result", async () => {
    mockStartSession.mockResolvedValue({ initialConfigurationToken: "token-c" });
    mockGetLatest.mockResolvedValue({});
    const user = userEvent.setup();
    render(<AppConfigDataDashboard />, { wrapper: createWrapper() });

    await user.type(screen.getByPlaceholderText("my-app"), "app");
    await user.type(screen.getByPlaceholderText("prod"), "env");
    await user.type(screen.getByPlaceholderText("profile-1"), "prof");
    await user.click(screen.getByRole("button", { name: /Start Session/i }));
    await waitFor(() => screen.getByText(/token-c/));

    await user.click(screen.getByText("Get Latest Configuration"));
    await waitFor(() => {
      expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText("(empty)")).toBeTruthy();
    });
  });

  it("shows an error toast when starting a session fails", async () => {
    mockStartSession.mockRejectedValue(new Error("Start boom"));
    const user = userEvent.setup();
    render(<AppConfigDataDashboard />, { wrapper: createWrapper() });
    await user.type(screen.getByPlaceholderText("my-app"), "test-app");
    await user.type(screen.getByPlaceholderText("prod"), "production");
    await user.type(screen.getByPlaceholderText("profile-1"), "config-1");
    await user.click(screen.getByRole("button", { name: /Start Session/i }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Start boom"));
  });

  it("shows an error toast when fetching the latest configuration fails", async () => {
    mockStartSession.mockResolvedValue({ initialConfigurationToken: "token-x" });
    mockGetLatest.mockRejectedValue(new Error("Get boom"));
    const user = userEvent.setup();
    render(<AppConfigDataDashboard />, { wrapper: createWrapper() });
    await user.type(screen.getByPlaceholderText("my-app"), "app");
    await user.type(screen.getByPlaceholderText("prod"), "env");
    await user.type(screen.getByPlaceholderText("profile-1"), "prof");
    await user.click(screen.getByRole("button", { name: /Start Session/i }));
    await waitFor(() => expect(screen.getByText("Get Latest Configuration")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Get Latest Configuration/i }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Get boom"));
  });
});
