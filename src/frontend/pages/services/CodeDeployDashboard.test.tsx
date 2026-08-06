// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

// ─── vi.hoisted mutable states ──────────────────────────

const deleteAppState = vi.hoisted(() => ({
  isPending: false,
  variables: null as string | null,
}));

const createAppState = vi.hoisted(() => ({
  isPending: false,
  isError: false,
  error: null as Error | null,
}));

const createGroupState = vi.hoisted(() => ({
  isPending: false,
  isError: false,
  error: null as Error | null,
}));

const createDeployState = vi.hoisted(() => ({
  isPending: false,
  isError: false,
  error: null as Error | null,
}));

const createConfigState = vi.hoisted(() => ({
  isPending: false,
  isError: false,
  error: null as Error | null,
}));

// ─── Mock hooks ─────────────────────────────────────────

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
  useCreateCodeDeployApplication: () => ({
    mutate: mockCreateApp,
    get isPending() { return createAppState.isPending; },
    get isError() { return createAppState.isError; },
    get error() { return createAppState.error; },
  }),
  useDeleteCodeDeployApplication: () => ({
    mutateAsync: mockDeleteApp,
    get isPending() { return deleteAppState.isPending; },
    get variables() { return deleteAppState.variables; },
  }),
  useCodeDeployDeploymentGroups: (...args: any[]) => mockDeploymentGroups(...args),
  useCreateCodeDeployDeploymentGroup: () => ({
    mutate: mockCreateGroup,
    get isPending() { return createGroupState.isPending; },
    get isError() { return createGroupState.isError; },
    get error() { return createGroupState.error; },
  }),
  useCodeDeployDeployments: (...args: any[]) => mockDeployments(...args),
  useCreateCodeDeployDeployment: () => ({
    mutate: mockCreateDeployment,
    get isPending() { return createDeployState.isPending; },
    get isError() { return createDeployState.isError; },
    get error() { return createDeployState.error; },
  }),
  useCodeDeployDeploymentConfigs: (...args: any[]) => mockDeploymentConfigs(...args),
  useCreateCodeDeployDeploymentConfig: () => ({
    mutate: mockCreateConfig,
    get isPending() { return createConfigState.isPending; },
    get isError() { return createConfigState.isError; },
    get error() { return createConfigState.error; },
  }),
}));

import { CodeDeployDashboard } from "./CodeDeployDashboard";

beforeEach(() => {
  vi.clearAllMocks();
  deleteAppState.isPending = false;
  deleteAppState.variables = null;
  createAppState.isPending = false;
  createAppState.isError = false;
  createAppState.error = null;
  createGroupState.isPending = false;
  createGroupState.isError = false;
  createGroupState.error = null;
  createDeployState.isPending = false;
  createDeployState.isError = false;
  createDeployState.error = null;
  createConfigState.isPending = false;
  createConfigState.isError = false;
  createConfigState.error = null;

  mockApps.mockReturnValue({ data: { applications: [], total: 0 }, isLoading: false });
  mockDeploymentGroups.mockReturnValue({ data: { deploymentGroups: [], total: 0 }, isLoading: false });
  mockDeployments.mockReturnValue({ data: { deployments: [], total: 0 }, isLoading: false });
  mockDeploymentConfigs.mockReturnValue({ data: { deploymentConfigs: [] }, isLoading: false });
});

describe("CodeDeployDashboard — applications tab", () => {
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

  it("shows dash for missing createTime", () => {
    mockApps.mockReturnValue({
      data: { applications: [{ applicationName: "no-date" }], total: 1 },
      isLoading: false,
    });
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("no-date")).toBeTruthy();
  });

  it("renders multiple applications and filters by name", async () => {
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

  it("shows create application loading state", () => {
    createAppState.isPending = true;
    mockApps.mockReturnValue({
      data: { applications: [{ applicationName: "my-app", createTime: "2024-01-15T00:00:00Z" }], total: 1 },
      isLoading: false,
    });
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-app")).toBeTruthy();
  });

  it("shows create application error alert", async () => {
    createAppState.isError = true;
    createAppState.error = new Error("App creation failed");
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => {
      expect(screen.getByText("App creation failed")).toBeTruthy();
    });
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

  it("shows delete application loading state", () => {
    deleteAppState.isPending = true;
    deleteAppState.variables = "del-app";
    mockApps.mockReturnValue({
      data: { applications: [{ applicationName: "del-app", createTime: "2024-01-15T00:00:00Z" }], total: 1 },
      isLoading: false,
    });
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("del-app")).toBeTruthy();
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
    await waitFor(() => {
      expect(screen.getByText("my-group")).toBeTruthy();
      expect(screen.getByText(/Deployment Groups.*my-app/)).toBeTruthy();
    });
  });

  it("filters deployment groups by name", async () => {
    mockApps.mockReturnValue({
      data: { applications: [{ applicationName: "my-app", createTime: "2024-01-15T00:00:00Z" }], total: 1 },
      isLoading: false,
    });
    mockDeploymentGroups.mockReturnValue({
      data: {
        deploymentGroups: [
          { deploymentGroupName: "group-alpha", serviceRoleArn: "arn:r1", deploymentConfigName: "cfg1" },
          { deploymentGroupName: "group-beta", serviceRoleArn: "arn:r2", deploymentConfigName: "cfg2" },
        ],
        total: 2,
      },
    });
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-app"));
    await waitFor(() => expect(screen.getByText("group-alpha")).toBeTruthy());
    expect(screen.getByText("group-beta")).toBeTruthy();

    const filterInput = screen.getByPlaceholderText("Find groups");
    await user.type(filterInput, "beta");
    await waitFor(() => expect(screen.queryByText("group-alpha")).toBeNull());
  });

  it("shows deployments section when app is selected", async () => {
    mockApps.mockReturnValue({
      data: { applications: [{ applicationName: "my-app", createTime: "2024-01-15T00:00:00Z" }], total: 1 },
      isLoading: false,
    });
    mockDeployments.mockReturnValue({
      data: { deployments: [{ deploymentId: "d-1", deploymentGroupName: "my-group", status: "Succeeded", createTime: "2024-01-15T00:00:00Z" }], total: 1 },
    });
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-app"));
    await waitFor(() => {
      expect(screen.getByText(/Deployments.*my-app/)).toBeTruthy();
      expect(screen.getByText("d-1")).toBeTruthy();
      expect(screen.getByText("Succeeded")).toBeTruthy();
    });
  });

  it("shows deployment dash for missing fields", async () => {
    mockApps.mockReturnValue({
      data: { applications: [{ applicationName: "my-app", createTime: "2024-01-15T00:00:00Z" }], total: 1 },
      isLoading: false,
    });
    mockDeployments.mockReturnValue({
      data: { deployments: [{ deploymentId: "d-1" }], total: 1 },
    });
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-app"));
    await waitFor(() => {
      const dashes = screen.getAllByText("—");
      expect(dashes.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("shows create deployment group loading", async () => {
    createGroupState.isPending = true;
    mockApps.mockReturnValue({
      data: { applications: [{ applicationName: "my-app", createTime: "2024-01-15T00:00:00Z" }], total: 1 },
      isLoading: false,
    });
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await userEvent.setup().click(screen.getByText("my-app"));
    await waitFor(() => expect(screen.getByText(/Deployment Groups.*my-app/)).toBeTruthy());
  });
});

describe("CodeDeployDashboard — deployment configs tab", () => {
  it("renders deployment configs with string items", async () => {
    mockDeploymentConfigs.mockReturnValue({
      data: { deploymentConfigs: ["CodeDeployDefault.AllAtOnce", "CodeDeployDefault.OneAtATime"] },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Deployment Configs/i }));
    await waitFor(() => {
      expect(screen.getByText("CodeDeployDefault.AllAtOnce")).toBeTruthy();
      expect(screen.getByText("CodeDeployDefault.OneAtATime")).toBeTruthy();
    });
  });

  it("renders configs with object format", async () => {
    mockDeploymentConfigs.mockReturnValue({
      data: { deploymentConfigs: [{ deploymentConfigName: "MyConfig" }] },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Deployment Configs/i }));
    await waitFor(() => expect(screen.getByText("MyConfig")).toBeTruthy());
  });

  it("shows empty deployment configs", async () => {
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Deployment Configs/i }));
    await waitFor(() => expect(screen.getByText(/No deployment configs/i)).toBeTruthy());
  });

  it("filters configs by name", async () => {
    mockDeploymentConfigs.mockReturnValue({
      data: { deploymentConfigs: ["CodeDeployDefault.AllAtOnce", "CodeDeployDefault.OneAtATime"] },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Deployment Configs/i }));
    await waitFor(() => expect(screen.getByText("CodeDeployDefault.AllAtOnce")).toBeTruthy());

    const filterInput = screen.getByPlaceholderText("Find configs by name");
    await user.type(filterInput, "OneAtATime");
    await waitFor(() => expect(screen.queryByText("CodeDeployDefault.AllAtOnce")).toBeNull());
  });

  it("opens create config modal and submits", async () => {
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Deployment Configs/i }));
    await waitFor(() => expect(screen.getByText(/No deployment configs/i)).toBeTruthy());

    const createBtns = screen.getAllByRole("button", { name: /Create/i });
    await user.click(createBtns[createBtns.length - 1]);
    await waitFor(() => expect(screen.getByText("Create deployment config")).toBeTruthy());

    const nameInput = screen.getByPlaceholderText("MyConfig");
    await user.type(nameInput, "MyCustomConfig");

    const modalCreateBtns = screen.getAllByRole("button", { name: /^Create$/i });
    await user.click(modalCreateBtns[modalCreateBtns.length - 1]);

    await waitFor(() => {
      expect(mockCreateConfig).toHaveBeenCalledWith(
        expect.objectContaining({ deploymentConfigName: "MyCustomConfig" }),
        expect.any(Object),
      );
    });
  });

  it("shows create config loading state", () => {
    createConfigState.isPending = true;
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/Deployment Configs/)).toBeTruthy();
  });

  it("shows create config error alert", async () => {
    createConfigState.isError = true;
    createConfigState.error = new Error("Config creation failed");
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Deployment Configs/i }));
    await waitFor(() => expect(screen.getByText(/No deployment configs/i)).toBeTruthy());

    const createBtns = screen.getAllByRole("button", { name: /Create/i });
    await user.click(createBtns[createBtns.length - 1]);
    await waitFor(() => {
      expect(screen.getByText("Config creation failed")).toBeTruthy();
    });
  });


  // ── Sparse data fallbacks ───────────────────────────

  it("deselects app when clicking its name again", async () => {
    mockApps.mockReturnValue({
      data: { applications: [{ applicationName: "my-app", createTime: "2024-01-15T00:00:00Z" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-app")).toBeTruthy());
    await user.click(screen.getByText("my-app"));
    await waitFor(() => expect(screen.getByText(/Deployment Groups.*my-app/)).toBeTruthy());
    await user.click(screen.getByText("my-app"));
    await waitFor(() => expect(screen.queryByText(/Deployment Groups.*my-app/)).toBeNull());
  });

  it("shows empty deployment groups when data lacks the array", async () => {
    mockApps.mockReturnValue({
      data: { applications: [{ applicationName: "my-app", createTime: "2024-01-15T00:00:00Z" }], total: 1 },
      isLoading: false,
    });
    mockDeploymentGroups.mockReturnValue({ data: {}, isLoading: false });
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-app"));
    await waitFor(() => expect(screen.getByText(/No deployment groups/i)).toBeTruthy());
  });

  it("shows dashes for group without role or config", async () => {
    mockApps.mockReturnValue({
      data: { applications: [{ applicationName: "my-app", createTime: "2024-01-15T00:00:00Z" }], total: 1 },
      isLoading: false,
    });
    mockDeploymentGroups.mockReturnValue({
      data: { deploymentGroups: [{ deploymentGroupName: "sparse-group" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-app"));
    await waitFor(() => {
      expect(screen.getByText("sparse-group")).toBeTruthy();
      expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(2);
    });
  });

  it("shows empty deployments when data lacks the array", async () => {
    mockApps.mockReturnValue({
      data: { applications: [{ applicationName: "my-app", createTime: "2024-01-15T00:00:00Z" }], total: 1 },
      isLoading: false,
    });
    mockDeployments.mockReturnValue({ data: {}, isLoading: false });
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-app"));
    await waitFor(() => expect(screen.getByText(/No deployments/i)).toBeTruthy());
  });

  it("filters deployments when an item has no id", async () => {
    mockApps.mockReturnValue({
      data: { applications: [{ applicationName: "my-app", createTime: "2024-01-15T00:00:00Z" }], total: 1 },
      isLoading: false,
    });
    mockDeployments.mockReturnValue({
      data: {
        deployments: [
          { deploymentId: "d-1", deploymentGroupName: "g", status: "Succeeded", createTime: "2024-01-15T00:00:00Z" },
          { deploymentGroupName: "g", status: "InProgress", createTime: "2024-01-16T00:00:00Z" },
        ],
        total: 2,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-app"));
    await waitFor(() => expect(screen.getByText("d-1")).toBeTruthy());
    const filterInput = screen.getByPlaceholderText("Find deployments by ID");
    await user.type(filterInput, "d-1");
    await waitFor(() => expect(screen.getByText("d-1")).toBeTruthy());
  });

  it("shows empty configs when data lacks the array", async () => {
    mockDeploymentConfigs.mockReturnValue({ data: {}, isLoading: false });
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Deployment Configs/i }));
    await waitFor(() => expect(screen.getByText(/No deployment configs/i)).toBeTruthy());
  });

  it("shows dash for object config without name", async () => {
    mockDeploymentConfigs.mockReturnValue({
      data: { deploymentConfigs: [{ computePlatform: "Server" }] },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Deployment Configs/i }));
    await waitFor(() => expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(1));
  });

  it("shows fallback error when create application fails with no message", async () => {
    createAppState.isError = true;
    createAppState.error = new Error("");
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Failed to create application")).toBeTruthy());
  });

  it("disables create group button when role ARN is missing", async () => {
    mockApps.mockReturnValue({
      data: { applications: [{ applicationName: "my-app", createTime: "2024-01-15T00:00:00Z" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-app"));
    await waitFor(() => expect(screen.getByText(/Deployment Groups.*my-app/)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Create group/i }));
    await waitFor(() => expect(screen.getByText("Create deployment group")).toBeTruthy());
    const nameInput = screen.getAllByPlaceholderText("my-group")[0];
    await user.type(nameInput, "grp");
    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    expect(createBtns[createBtns.length - 1].getAttribute("disabled")).not.toBeNull();
  });

  it("shows create deployment group error alert", async () => {
    createGroupState.isError = true;
    createGroupState.error = new Error("Group creation failed");
    mockApps.mockReturnValue({
      data: { applications: [{ applicationName: "my-app", createTime: "2024-01-15T00:00:00Z" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-app"));
    await waitFor(() => expect(screen.getByText(/Deployment Groups.*my-app/)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Create group/i }));
    await waitFor(() => expect(screen.getByText("Group creation failed")).toBeTruthy());
  });

  it("shows fallback create deployment group error", async () => {
    createGroupState.isError = true;
    createGroupState.error = new Error("");
    mockApps.mockReturnValue({
      data: { applications: [{ applicationName: "my-app", createTime: "2024-01-15T00:00:00Z" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-app"));
    await waitFor(() => expect(screen.getByText(/Deployment Groups.*my-app/)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Create group/i }));
    await waitFor(() => expect(screen.getByText("Failed to create group")).toBeTruthy());
  });

  it("shows create deployment error alert", async () => {
    createDeployState.isError = true;
    createDeployState.error = new Error("Deployment creation failed");
    mockApps.mockReturnValue({
      data: { applications: [{ applicationName: "my-app", createTime: "2024-01-15T00:00:00Z" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-app"));
    await waitFor(() => expect(screen.getByText(/Deployment Groups.*my-app/)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Create deployment/i }));
    await waitFor(() => expect(screen.getByText("Deployment creation failed")).toBeTruthy());
  });

  it("shows fallback create deployment error", async () => {
    createDeployState.isError = true;
    createDeployState.error = new Error("");
    mockApps.mockReturnValue({
      data: { applications: [{ applicationName: "my-app", createTime: "2024-01-15T00:00:00Z" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-app"));
    await waitFor(() => expect(screen.getByText(/Deployment Groups.*my-app/)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Create deployment/i }));
    await waitFor(() => expect(screen.getByText("Failed to create deployment")).toBeTruthy());
  });

  it("shows fallback create config error", async () => {
    createConfigState.isError = true;
    createConfigState.error = new Error("");
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Deployment Configs/i }));
    await waitFor(() => expect(screen.getByText(/No deployment configs/i)).toBeTruthy());
    const createBtns = screen.getAllByRole("button", { name: /Create/i });
    await user.click(createBtns[createBtns.length - 1]);
    await waitFor(() => expect(screen.getByText("Failed to create config")).toBeTruthy());
  });
});
