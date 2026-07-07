// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

const mockApps = vi.fn();
const mockDeleteApp = vi.fn();
const mockEnvs = vi.fn();
const mockProfiles = vi.fn();

vi.mock("../../hooks/useAppConfig", () => ({
  useAppConfigApplications: (...args: any[]) => mockApps(...args),
  useDeleteAppConfigApplication: () => ({ mutateAsync: mockDeleteApp, isPending: false, variables: null }),
  useAppConfigEnvironments: (...args: any[]) => mockEnvs(...args),
  useAppConfigProfiles: (...args: any[]) => mockProfiles(...args),
}));

import { AppConfigDashboard } from "./AppConfigDashboard";

beforeEach(() => {
  vi.clearAllMocks();
  mockApps.mockReturnValue({ data: { applications: [], total: 0 }, isLoading: false });
  mockEnvs.mockReturnValue({ data: { environments: [], total: 0 } });
  mockProfiles.mockReturnValue({ data: { profiles: [], total: 0 } });
});

describe("AppConfigDashboard", () => {
  it("shows loading skeleton", () => {
    mockApps.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = render(<AppConfigDashboard />, { wrapper: createWrapper() });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("shows empty message", () => {
    render(<AppConfigDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No AppConfig applications/i)).toBeTruthy();
  });

  it("renders applications with data", () => {
    mockApps.mockReturnValue({
      data: { applications: [{ Id: "app-1", Name: "my-app", Description: "My app config app" }], total: 1 },
      isLoading: false,
    });
    render(<AppConfigDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-app")).toBeTruthy();
    expect(screen.getByText("app-1")).toBeTruthy();
  });

  it("shows dash for missing description", () => {
    mockApps.mockReturnValue({
      data: { applications: [{ Id: "app-1", Name: "test" }], total: 1 },
      isLoading: false,
    });
    render(<AppConfigDashboard />, { wrapper: createWrapper() });
    const dashes = screen.getAllByText("-");
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it("navigates to app detail showing tabs", async () => {
    mockApps.mockReturnValue({
      data: { applications: [{ Id: "app-1", Name: "click-app" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<AppConfigDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("click-app")).toBeTruthy());

    await user.click(screen.getByText("click-app"));
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /Environments/i })).toBeTruthy();
      expect(screen.getByRole("tab", { name: /Configuration Profiles/i })).toBeTruthy();
    });
  });

  it("shows back button in detail", async () => {
    mockApps.mockReturnValue({
      data: { applications: [{ Id: "app-1", Name: "test" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<AppConfigDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("test"));
    await user.click(screen.getByText("test"));
    await waitFor(() => expect(screen.getByText(/Back to applications/i)).toBeTruthy());
  });

  it("renders environment detail tab", async () => {
    mockEnvs.mockReturnValue({
      data: { environments: [{ Id: "env-1", Name: "prod", State: "ACTIVE", Description: "Production" }], total: 1 },
    });
    mockApps.mockReturnValue({
      data: { applications: [{ Id: "app-1", Name: "my-app" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<AppConfigDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("my-app"));
    await user.click(screen.getByText("my-app"));
    await waitFor(() => expect(screen.getByText("prod")).toBeTruthy());
  });

  it("renders profiles detail tab", async () => {
    mockProfiles.mockReturnValue({
      data: { profiles: [{ Id: "prof-1", Name: "my-profile", Type: "AWS.Freeform", LocationUri: "ssm-param" }], total: 1 },
    });
    mockApps.mockReturnValue({
      data: { applications: [{ Id: "app-1", Name: "my-app" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<AppConfigDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("my-app"));
    await user.click(screen.getByText("my-app"));
    await user.click(screen.getByRole("tab", { name: /Profiles/i }));
    await waitFor(() => expect(screen.getByText("my-profile")).toBeTruthy());
  });

  it("deletes an application", async () => {
    mockApps.mockReturnValue({
      data: { applications: [{ Id: "app-1", Name: "delete-me" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<AppConfigDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("delete-me")).toBeTruthy());

    const deleteBtn = screen.getByRole("button", { name: /Delete delete-me/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteApp).toHaveBeenCalledWith("app-1"));
  });

  it("filters applications by name", async () => {
    mockApps.mockReturnValue({
      data: {
        applications: [
          { Id: "id1", Name: "alpha-app" },
          { Id: "id2", Name: "beta-app" },
        ],
        total: 2,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<AppConfigDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("alpha-app")).toBeTruthy());

    const filterInput = screen.getByPlaceholderText("Find applications");
    await user.type(filterInput, "beta");
    await waitFor(() => expect(screen.queryByText("alpha-app")).toBeNull());
  });
});
