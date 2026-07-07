// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

const mockApps = vi.fn();
const mockCreateApp = vi.fn();
const mockDeleteApp = vi.fn();
const mockDeploymentGroups = vi.fn();
const mockCreateGroup = vi.fn();
const mockDeployments = vi.fn();
const mockCreateDeployment = vi.fn();
const mockDeploymentConfigs = vi.fn();
const mockCreateConfig = vi.fn();

vi.mock("../../hooks/useCodeDeploy", () => ({
  useCodeDeployApplications: (...args: any[]) => mockApps(...args),
  useCreateCodeDeployApplication: () => ({ mutate: mockCreateApp, isPending: false }),
  useDeleteCodeDeployApplication: () => ({ mutateAsync: mockDeleteApp, isPending: false, variables: null }),
  useCodeDeployDeploymentGroups: (...args: any[]) => mockDeploymentGroups(...args),
  useCreateCodeDeployDeploymentGroup: () => ({ mutate: mockCreateGroup, isPending: false }),
  useCodeDeployDeployments: (...args: any[]) => mockDeployments(...args),
  useCreateCodeDeployDeployment: () => ({ mutate: mockCreateDeployment, isPending: false }),
  useCodeDeployDeploymentConfigs: (...args: any[]) => mockDeploymentConfigs(...args),
  useCreateCodeDeployDeploymentConfig: () => ({ mutate: mockCreateConfig, isPending: false }),
}));

import { CodeDeployDashboard } from "./CodeDeployDashboard";

beforeEach(() => {
  vi.clearAllMocks();
  mockApps.mockReturnValue({ data: { applications: [], total: 0 }, isLoading: false });
  mockDeploymentGroups.mockReturnValue({ data: { deploymentGroups: [], total: 0 }, isLoading: false });
  mockDeployments.mockReturnValue({ data: { deployments: [], total: 0 }, isLoading: false });
  mockDeploymentConfigs.mockReturnValue({ data: { deploymentConfigs: [] }, isLoading: false });
});

describe("CodeDeployDashboard", () => {
  it("shows loading skeleton", () => {
    mockApps.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("shows both tabs", () => {
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    expect(screen.getByRole("tab", { name: /Applications/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /Deployment Configs/i })).toBeTruthy();
  });

  it("shows empty message for applications", () => {
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No applications found/i)).toBeTruthy();
  });

  it("renders applications with data", () => {
    mockApps.mockReturnValue({
      data: { applications: [{ applicationName: "my-app", description: "My app", createTime: "2024-01-15T00:00:00Z" }], total: 1 },
      isLoading: false,
    });
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-app")).toBeTruthy();
  });

  it("shows dash for missing description", () => {
    mockApps.mockReturnValue({
      data: { applications: [{ applicationName: "test" }], total: 1 },
      isLoading: false,
    });
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it("opens create application modal and submits", async () => {
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });

    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create application")).toBeTruthy());

    const nameInput = screen.getByPlaceholderText("my-app");
    await user.type(nameInput, "new-app");

    const createBtns = screen.getAllByRole("button", { name: /Create/i });
    await user.click(createBtns[createBtns.length - 1]);

    await waitFor(() => {
      expect(mockCreateApp).toHaveBeenCalledWith(
        expect.objectContaining({ applicationName: "new-app" }),
        expect.any(Object),
      );
    });
  });

  it("cancels create application modal", async () => {
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create application")).toBeTruthy());
    await clickButton(user, /Cancel/i);
    expect(mockCreateApp).not.toHaveBeenCalled();
  });

  it("shows deployment groups when app is selected", async () => {
    mockApps.mockReturnValue({
      data: { applications: [{ applicationName: "my-app", createTime: "2024-01-15T00:00:00Z" }], total: 1 },
      isLoading: false,
    });
    mockDeploymentGroups.mockReturnValue({
      data: { deploymentGroups: [{ deploymentGroupName: "my-group", serviceRoleArn: "arn:aws:iam::123:role/CodeDeploy", deploymentConfigName: "CodeDeployDefault.AllAtOnce" }], total: 1 },
    });
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-app")).toBeTruthy());

    await user.click(screen.getByText("my-app"));
    await waitFor(() => expect(screen.getByText("my-group")).toBeTruthy());
  });

  it("deploys config tab data", async () => {
    mockDeploymentConfigs.mockReturnValue({
      data: { deploymentConfigs: ["CodeDeployDefault.AllAtOnce", "CodeDeployDefault.OneAtATime"] },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Deployment Configs/i }));
    await waitFor(() => expect(screen.getByText("CodeDeployDefault.AllAtOnce")).toBeTruthy());
  });

  it("deletes an application", async () => {
    mockApps.mockReturnValue({
      data: { applications: [{ applicationName: "delete-me", createTime: "2024-01-15T00:00:00Z" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("delete-me")).toBeTruthy());

    const deleteBtn = screen.getByRole("button", { name: /Delete delete-me/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteApp).toHaveBeenCalledWith("delete-me"));
  });

  it("filters apps by name", async () => {
    mockApps.mockReturnValue({
      data: {
        applications: [
          { applicationName: "alpha-app", createTime: "2024-01-15T00:00:00Z" },
          { applicationName: "beta-app", createTime: "2024-01-16T00:00:00Z" },
        ],
        total: 2,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("alpha-app")).toBeTruthy());

    const filterInput = screen.getByPlaceholderText("Find applications by name");
    await user.type(filterInput, "beta");
    await waitFor(() => expect(screen.queryByText("alpha-app")).toBeNull());
  });
});
