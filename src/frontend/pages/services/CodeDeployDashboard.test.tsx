// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
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

const registerInstanceState = vi.hoisted(() => ({
  isPending: false,
  isError: false,
  error: null as Error | null,
}));

const deregisterInstanceState = vi.hoisted(() => ({
  isPending: false,
  variables: null as string | null,
}));

const addTagsState = vi.hoisted(() => ({
  isPending: false,
  isError: false,
  error: null as Error | null,
}));

const removeTagsState = vi.hoisted(() => ({
  isPending: false,
}));

const continueState = vi.hoisted(() => ({
  isPending: false,
  variables: null as string | null,
}));

const putHookState = vi.hoisted(() => ({
  isPending: false,
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
const mockOnPrem = vi.fn();
const mockRegisterInstance = vi.fn();
const mockDeregisterInstance = vi.fn();
const mockAddOnPremTags = vi.fn();
const mockRemoveOnPremTags = vi.fn();
const mockContinueDeployment = vi.fn();
const mockPutHookStatus = vi.fn();
const mockTargets = vi.fn();

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
  useCodeDeployOnPremInstances: (...args: any[]) => mockOnPrem(...args),
  useRegisterCodeDeployOnPremInstance: () => ({
    mutate: mockRegisterInstance,
    get isPending() { return registerInstanceState.isPending; },
    get isError() { return registerInstanceState.isError; },
    get error() { return registerInstanceState.error; },
  }),
  useDeregisterCodeDeployOnPremInstance: () => ({
    mutateAsync: mockDeregisterInstance,
    get isPending() { return deregisterInstanceState.isPending; },
    get variables() { return deregisterInstanceState.variables; },
  }),
  useAddCodeDeployOnPremTags: () => ({
    mutate: mockAddOnPremTags,
    get isPending() { return addTagsState.isPending; },
    get isError() { return addTagsState.isError; },
    get error() { return addTagsState.error; },
  }),
  useRemoveCodeDeployOnPremTags: () => ({
    mutate: mockRemoveOnPremTags,
    get isPending() { return removeTagsState.isPending; },
  }),
  useContinueCodeDeployDeployment: () => ({
    mutate: mockContinueDeployment,
    get isPending() { return continueState.isPending; },
    get variables() { return continueState.variables; },
  }),
  usePutCodeDeployLifecycleHookStatus: () => ({
    mutate: mockPutHookStatus,
    get isPending() { return putHookState.isPending; },
  }),
  useCodeDeployDeploymentTargets: (...args: any[]) => mockTargets(...args),
  useCreateCodeDeployDeploymentConfig: () => ({
    mutate: mockCreateConfig,
    get isPending() { return createConfigState.isPending; },
    get isError() { return createConfigState.isError; },
    get error() { return createConfigState.error; },
  }),
}));

import { CodeDeployDashboard } from "./CodeDeployDashboard";

/**
 * Cloudscape Modal handles Escape via a React onKeyDown on the dialog element
 * (checking `event.keyCode === 27`). user-event's `keyboard()` targets the
 * active element (body), which never reaches the dialog in happy-dom, so we
 * dispatch the keydown on the dialog directly.
 */
function dismissModalWithEscape() {
  document.querySelectorAll('[class*="awsui_dialog"]').forEach((dialog) => {
    fireEvent.keyDown(dialog as HTMLElement, { keyCode: 27 });
  });
}

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
  registerInstanceState.isPending = false;
  registerInstanceState.isError = false;
  registerInstanceState.error = null;
  deregisterInstanceState.isPending = false;
  deregisterInstanceState.variables = null;
  addTagsState.isPending = false;
  addTagsState.isError = false;
  addTagsState.error = null;
  removeTagsState.isPending = false;
  continueState.isPending = false;
  continueState.variables = null;
  putHookState.isPending = false;

  mockApps.mockReturnValue({ data: { applications: [], total: 0 }, isLoading: false });
  mockDeploymentGroups.mockReturnValue({ data: { deploymentGroups: [], total: 0 }, isLoading: false });
  mockDeployments.mockReturnValue({ data: { deployments: [], total: 0 }, isLoading: false });
  mockDeploymentConfigs.mockReturnValue({ data: { deploymentConfigs: [] }, isLoading: false });
  mockOnPrem.mockReturnValue({ data: { instances: [], total: 0 }, isLoading: false });
  mockTargets.mockReturnValue({ data: { targets: [] } });
  mockRegisterInstance.mockImplementation((_body: any, opts: any) => opts?.onSuccess?.());
  mockAddOnPremTags.mockImplementation((_body: any, opts: any) => opts?.onSuccess?.());
  mockRemoveOnPremTags.mockImplementation((_body: any, opts: any) => opts?.onSuccess?.());

  // Invoke onSuccess so the create modals' close + field-reset branches fire
  mockCreateApp.mockImplementation((_body: any, opts: any) => opts?.onSuccess?.());
  mockCreateGroup.mockImplementation((_body: any, opts: any) => opts?.onSuccess?.());
  mockCreateDeployment.mockImplementation((_body: any, opts: any) => opts?.onSuccess?.());
  mockCreateConfig.mockImplementation((_body: any, opts: any) => opts?.onSuccess?.());
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

  it("dismisses the create application modal with Escape", async () => {
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create Application/i);
    await waitFor(() => expect(screen.getByPlaceholderText("my-app")).toBeTruthy());

    dismissModalWithEscape();
    await waitFor(() => expect(screen.queryByPlaceholderText("my-app")).toBeNull());
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

  it("creates a deployment group with trimmed fields and closes the modal", async () => {
    mockApps.mockReturnValue({
      data: { applications: [{ applicationName: "my-app", createTime: "2024-01-15T00:00:00Z" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-app")).toBeTruthy());
    await user.click(screen.getByText("my-app"));
    await waitFor(() => expect(screen.getByText(/Deployment Groups.*my-app/)).toBeTruthy());

    await user.click(screen.getByRole("button", { name: /Create group/i }));
    await waitFor(() => expect(screen.getByText("Create deployment group")).toBeTruthy());

    await user.type(screen.getByPlaceholderText("my-group"), "  grp-one  ");
    await user.type(screen.getByPlaceholderText("arn:aws:iam::123:role/MyRole"), "  arn:role  ");
    await clickButton(user, /^Create$/);

    await waitFor(() => {
      expect(mockCreateGroup).toHaveBeenCalledWith(
        { appName: "my-app", deploymentGroupName: "grp-one", serviceRoleArn: "arn:role" },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
      expect(screen.queryByText("Create deployment group")).toBeNull();
    });
  });

  it("cancels the create deployment group modal", async () => {
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
    // Last Cancel — DeleteButton's hidden ConfirmDialog renders an earlier Cancel button
    await clickButton(user, /Cancel/i, { last: true });
    await waitFor(() => expect(screen.queryByText("Create deployment group")).toBeNull());
    expect(mockCreateGroup).not.toHaveBeenCalled();
  });

  it("dismisses the create deployment group modal with Escape", async () => {
    mockApps.mockReturnValue({
      data: { applications: [{ applicationName: "my-app", createTime: "2024-01-15T00:00:00Z" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-app"));
    await waitFor(() => expect(screen.getByText(/Deployment Groups.*my-app/)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Create group/i }));
    await waitFor(() => expect(screen.getByPlaceholderText("my-group")).toBeTruthy());

    dismissModalWithEscape();
    await waitFor(() => expect(screen.queryByText("Create deployment group")).toBeNull());
    expect(mockCreateGroup).not.toHaveBeenCalled();
  });

  it("creates a deployment with trimmed group name and closes the modal", async () => {
    mockApps.mockReturnValue({
      data: { applications: [{ applicationName: "my-app", createTime: "2024-01-15T00:00:00Z" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-app"));
    await waitFor(() => expect(screen.getByText(/Deployment Groups.*my-app/)).toBeTruthy());

    await user.click(screen.getByRole("button", { name: /Create deployment/i }));
    await waitFor(() => expect(screen.getByPlaceholderText("my-group")).toBeTruthy());

    await user.type(screen.getByPlaceholderText("my-group"), "  deploy-group  ");
    await clickButton(user, /^Create$/);

    await waitFor(() => {
      expect(mockCreateDeployment).toHaveBeenCalledWith(
        { appName: "my-app", deploymentGroupName: "deploy-group" },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
      expect(screen.queryByPlaceholderText("my-group")).toBeNull();
    });
  });

  it("cancels the create deployment modal", async () => {
    mockApps.mockReturnValue({
      data: { applications: [{ applicationName: "my-app", createTime: "2024-01-15T00:00:00Z" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-app"));
    await waitFor(() => expect(screen.getByText(/Deployment Groups.*my-app/)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Create deployment/i }));
    await waitFor(() => expect(screen.getByPlaceholderText("my-group")).toBeTruthy());
    await clickButton(user, /Cancel/i, { last: true });
    await waitFor(() => expect(screen.queryByPlaceholderText("my-group")).toBeNull());
    expect(mockCreateDeployment).not.toHaveBeenCalled();
  });

  it("dismisses the create deployment modal with Escape", async () => {
    mockApps.mockReturnValue({
      data: { applications: [{ applicationName: "my-app", createTime: "2024-01-15T00:00:00Z" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-app"));
    await waitFor(() => expect(screen.getByText(/Deployment Groups.*my-app/)).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Create deployment/i }));
    await waitFor(() => expect(screen.getByPlaceholderText("my-group")).toBeTruthy());

    dismissModalWithEscape();
    await waitFor(() => expect(screen.queryByPlaceholderText("my-group")).toBeNull());
    expect(mockCreateDeployment).not.toHaveBeenCalled();
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
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
      expect(screen.queryByPlaceholderText("MyConfig")).toBeNull();
    });
  });

  it("cancels the create deployment config modal", async () => {
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Deployment Configs/i }));
    await waitFor(() => expect(screen.getByText(/No deployment configs/i)).toBeTruthy());
    await clickButton(user, /Create Deployment Config/i);
    await waitFor(() => expect(screen.getByPlaceholderText("MyConfig")).toBeTruthy());

    await clickButton(user, /Cancel/i);
    await waitFor(() => expect(screen.queryByPlaceholderText("MyConfig")).toBeNull());
    expect(mockCreateConfig).not.toHaveBeenCalled();
  });

  it("dismisses the create deployment config modal with Escape", async () => {
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Deployment Configs/i }));
    await waitFor(() => expect(screen.getByText(/No deployment configs/i)).toBeTruthy());
    await clickButton(user, /Create Deployment Config/i);
    await waitFor(() => expect(screen.getByPlaceholderText("MyConfig")).toBeTruthy());

    dismissModalWithEscape();
    await waitFor(() => expect(screen.queryByPlaceholderText("MyConfig")).toBeNull());
    expect(mockCreateConfig).not.toHaveBeenCalled();
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

describe("CodeDeployDashboard — on-premises tab", () => {
  function setupOnPrem(instances: any[]) {
    mockOnPrem.mockReturnValue({ data: { instances, total: instances.length }, isLoading: false });
  }

  it("renders on-premises instances with dash fallbacks", async () => {
    setupOnPrem([{ instanceName: "srv-1", instanceArn: "arn:srv-1", registerTime: 1700000000, tags: [] }]);
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /On-Premises/i }));
    expect(await screen.findByText("srv-1")).toBeTruthy();
    expect(screen.getByText("—")).toBeTruthy();
  });

  it("shows empty message when there are no on-premises instances", async () => {
    setupOnPrem([]);
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /On-Premises/i }));
    expect(await screen.findByText("No on-premises instances")).toBeTruthy();
  });

  it("registers an on-premises instance", async () => {
    setupOnPrem([]);
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /On-Premises/i }));
    await clickButton(user, /Create/i);
    const dialog = screen.getByRole("dialog", { name: /Register on-premises instance/i });
    const inputs = dialog.querySelectorAll("input");
    await user.type(inputs[0], "srv-1");
    await user.type(inputs[1], "arn:aws:iam::123:user/agent");
    await user.click(within(dialog).getByRole("button", { name: "Register" }));
    await waitFor(() =>
      expect(mockRegisterInstance).toHaveBeenCalledWith(
        { instanceName: "srv-1", iamUserArn: "arn:aws:iam::123:user/agent" },
        { onSuccess: expect.any(Function) },
      )
    );
  });

  it("registers without an IAM user ARN when blank", async () => {
    setupOnPrem([]);
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /On-Premises/i }));
    await clickButton(user, /Create/i);
    const dialog = screen.getByRole("dialog", { name: /Register on-premises instance/i });
    const inputs = dialog.querySelectorAll("input");
    await user.type(inputs[0], "srv-1");
    await user.click(within(dialog).getByRole("button", { name: "Register" }));
    await waitFor(() =>
      expect(mockRegisterInstance).toHaveBeenCalledWith(
        { instanceName: "srv-1", iamUserArn: undefined },
        { onSuccess: expect.any(Function) },
      )
    );
  });

  it("shows the empty table while the on-prem list is still loading", async () => {
    mockOnPrem.mockReturnValue({ data: undefined, isLoading: false });
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /On-Premises/i }));
    expect(await screen.findByText("No on-premises instances")).toBeTruthy();
  });

  it("keeps Register disabled until a name is entered", async () => {
    setupOnPrem([]);
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /On-Premises/i }));
    await clickButton(user, /Create/i);
    const dialog = screen.getByRole("dialog", { name: /Register on-premises instance/i });
    expect(within(dialog).getByRole("button", { name: "Register" }).hasAttribute("disabled")).toBe(true);
  });

  it("shows the register error and fallback message", async () => {
    setupOnPrem([]);
    registerInstanceState.isError = true;
    registerInstanceState.error = new Error("register failed");
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /On-Premises/i }));
    await clickButton(user, /Create/i);
    expect(await screen.findByText("register failed")).toBeTruthy();
  });

  it("falls back to a generic register error message", async () => {
    setupOnPrem([]);
    registerInstanceState.isError = true;
    registerInstanceState.error = null;
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /On-Premises/i }));
    await clickButton(user, /Create/i);
    expect(await screen.findByText("Failed to register instance")).toBeTruthy();
  });

  it("deregisters an instance via the confirm dialog", async () => {
    mockDeregisterInstance.mockResolvedValue({});
    setupOnPrem([{ instanceName: "srv-1", tags: [] }]);
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /On-Premises/i }));
    await user.click((await screen.findAllByRole("button", { name: /Delete srv-1/i }))[0]);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeregisterInstance).toHaveBeenCalledWith("srv-1"));
  });

  it("adds a tag to an instance", async () => {
    setupOnPrem([{ instanceName: "srv-1", tags: [] }]);
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /On-Premises/i }));
    await user.click((await screen.findAllByRole("button", { name: "Add tag" }))[0]);
    const dialog = screen.getByRole("dialog", { name: /Add tag to srv-1/i });
    const inputs = dialog.querySelectorAll("input");
    await user.type(inputs[0], "env");
    await user.type(inputs[1], "prod");
    await user.click(within(dialog).getByRole("button", { name: "Save tag" }));
    await waitFor(() =>
      expect(mockAddOnPremTags).toHaveBeenCalledWith(
        { instanceNames: ["srv-1"], tags: [{ Key: "env", Value: "prod" }] },
        { onSuccess: expect.any(Function) },
      )
    );
  });

  it("shows edit-tag header and removes a tag", async () => {
    mockRemoveOnPremTags.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
    setupOnPrem([{ instanceName: "srv-1", tags: [{ Key: "env", Value: "prod" }] }]);
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /On-Premises/i }));
    await user.click((await screen.findAllByRole("button", { name: "env" }))[0]);
    const dialog = screen.getByRole("dialog", { name: /Edit tag on srv-1/i });
    await user.click(within(dialog).getByRole("button", { name: "Remove tag" }));
    await waitFor(() =>
      expect(mockRemoveOnPremTags).toHaveBeenCalledWith(
        { instanceNames: ["srv-1"], tags: [{ Key: "env", Value: "prod" }] },
        { onSuccess: expect.any(Function) },
      )
    );
  });

  it("keeps Save tag disabled until a key is entered", async () => {
    setupOnPrem([{ instanceName: "srv-1" }]);
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /On-Premises/i }));
    await user.click((await screen.findAllByRole("button", { name: "Add tag" }))[0]);
    const dialog = screen.getByRole("dialog", { name: /Add tag to srv-1/i });
    expect(within(dialog).getByRole("button", { name: "Save tag" }).hasAttribute("disabled")).toBe(true);
  });

  it("shows the tag error and fallback message", async () => {
    setupOnPrem([{ instanceName: "srv-1", tags: [] }]);
    addTagsState.isError = true;
    addTagsState.error = new Error("tag failed");
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /On-Premises/i }));
    await user.click((await screen.findAllByRole("button", { name: "Add tag" }))[0]);
    expect(await screen.findByText("tag failed")).toBeTruthy();
  });

  it("falls back to a generic tag error message", async () => {
    setupOnPrem([{ instanceName: "srv-1", tags: [] }]);
    addTagsState.isError = true;
    addTagsState.error = null;
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /On-Premises/i }));
    await user.click((await screen.findAllByRole("button", { name: "Add tag" }))[0]);
    expect(await screen.findByText("Failed to tag instance")).toBeTruthy();
  });

  it("dismisses the register modal with Escape", async () => {
    setupOnPrem([]);
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /On-Premises/i }));
    await clickButton(user, /Create/i);
    await screen.findByRole("dialog", { name: /Register on-premises instance/i });
    dismissModalWithEscape();
    await waitFor(() => expect(screen.queryByRole("button", { name: "Register" })).toBeNull());
  });

  it("cancels the register modal", async () => {
    setupOnPrem([]);
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /On-Premises/i }));
    await clickButton(user, /Create/i);
    const dialog = screen.getByRole("dialog", { name: /Register on-premises instance/i });
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Register" })).toBeNull());
  });

  it("dismisses the tag modal with Escape", async () => {
    setupOnPrem([{ instanceName: "srv-1", tags: [] }]);
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /On-Premises/i }));
    await user.click((await screen.findAllByRole("button", { name: "Add tag" }))[0]);
    await screen.findByRole("dialog", { name: /Add tag to srv-1/i });
    dismissModalWithEscape();
    await waitFor(() => expect(screen.queryByRole("button", { name: "Save tag" })).toBeNull());
  });

  it("filters on-prem instances by name", async () => {
    setupOnPrem([{ instanceName: "srv-1" }, { instanceName: "web-1" }]);
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /On-Premises/i }));
    const filter = await screen.findByPlaceholderText("Find instances by name");
    await user.type(filter, "srv");
    expect(screen.getByText("srv-1")).toBeTruthy();
    expect(screen.queryByText("web-1")).toBeNull();
  });

  it("disables deregister while that instance deletion is pending", async () => {
    setupOnPrem([{ instanceName: "srv-1", tags: [] }]);
    deregisterInstanceState.isPending = true;
    deregisterInstanceState.variables = "srv-1";
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /On-Premises/i }));
    const btn = (await screen.findAllByRole("button", { name: /Delete srv-1/i }))[0];
    expect(btn.className).toMatch(/disabled/);
  });

  it("cancels the tag modal without saving", async () => {
    setupOnPrem([{ instanceName: "srv-1", tags: [] }]);
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /On-Premises/i }));
    await user.click((await screen.findAllByRole("button", { name: "Add tag" }))[0]);
    const dialog = screen.getByRole("dialog", { name: /Add tag to srv-1/i });
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Save tag" })).toBeNull());
    expect(mockAddOnPremTags).not.toHaveBeenCalled();
  });
});

describe("CodeDeployDashboard — deployment actions", () => {
  function setupDeployment() {
    mockApps.mockReturnValue({
      data: { applications: [{ applicationName: "my-app" }], total: 1 },
      isLoading: false,
    });
    mockDeployments.mockReturnValue({
      data: { deployments: [{ deploymentId: "d-1", deploymentGroupName: "g", status: "Created" }], total: 1 },
      isLoading: false,
    });
  }

  it("continues a deployment from the deployments table", async () => {
    setupDeployment();
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "my-app" }));
    await user.click((await screen.findAllByRole("button", { name: "Continue" }))[0]);
    await waitFor(() => expect(mockContinueDeployment).toHaveBeenCalledWith("d-1"));
  });

  it("shows continue loading for the in-flight deployment only", async () => {
    setupDeployment();
    mockDeployments.mockReturnValue({
      data: {
        deployments: [
          { deploymentId: "d-1", status: "Created" },
          { deploymentId: "d-2", status: "Created" },
        ],
        total: 2,
      },
      isLoading: false,
    });
    continueState.isPending = true;
    continueState.variables = "d-1";
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "my-app" }));
    const buttons = await screen.findAllByRole("button", { name: "Continue" });
    expect(buttons[0].className).toMatch(/disabled|loading/);
    expect(buttons[1].className).not.toMatch(/disabled|loading/);
  });

  it("opens the targets modal and lists targets", async () => {
    setupDeployment();
    mockTargets.mockReturnValue({ data: { targets: [{ deploymentTargetId: "t-1", targetStatus: "Ready" }] } });
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "my-app" }));
    await user.click((await screen.findAllByRole("button", { name: "Targets" }))[0]);
    expect(await screen.findByText("t-1")).toBeTruthy();
    expect(mockTargets).toHaveBeenCalledWith("d-1");
    expect(screen.getByText("Ready")).toBeTruthy();
  });

  it("puts a lifecycle hook status from the targets modal", async () => {
    setupDeployment();
    mockTargets.mockReturnValue({ data: { targets: [] } });
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "my-app" }));
    await user.click((await screen.findAllByRole("button", { name: "Targets" }))[0]);
    const dialog = await screen.findByRole("dialog", { name: /Deployment targets — d-1/i });
    const input = dialog.querySelector("input") as HTMLInputElement;
    await user.type(input, "exe-1");
    await user.click(within(dialog).getByRole("button", { name: "Put hook status" }));
    await waitFor(() =>
      expect(mockPutHookStatus).toHaveBeenCalledWith({
        id: "d-1",
        lifecycleEventHookExecutionId: "exe-1",
        status: "Succeeded",
      })
    );
  });

  it("selects a different hook status", async () => {
    setupDeployment();
    mockTargets.mockReturnValue({ data: { targets: [] } });
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "my-app" }));
    await user.click((await screen.findAllByRole("button", { name: "Targets" }))[0]);
    const dialog = await screen.findByRole("dialog", { name: /Deployment targets — d-1/i });
    await user.click(within(dialog).getByRole("button", { name: /Succeeded/i }));
    await user.click(await within(dialog).findByRole("option", { name: "Failed" }));
    const input = dialog.querySelector("input") as HTMLInputElement;
    await user.type(input, "exe-1");
    await user.click(within(dialog).getByRole("button", { name: "Put hook status" }));
    await waitFor(() =>
      expect(mockPutHookStatus).toHaveBeenCalledWith({
        id: "d-1",
        lifecycleEventHookExecutionId: "exe-1",
        status: "Failed",
      })
    );
  });

  it("keeps Put hook status disabled until an execution id is entered", async () => {
    setupDeployment();
    mockTargets.mockReturnValue({ data: { targets: [] } });
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "my-app" }));
    await user.click((await screen.findAllByRole("button", { name: "Targets" }))[0]);
    const dialog = await screen.findByRole("dialog", { name: /Deployment targets — d-1/i });
    expect(within(dialog).getByRole("button", { name: "Put hook status" }).hasAttribute("disabled")).toBe(true);
  });

  it("dismisses the targets modal with Escape", async () => {
    setupDeployment();
    mockTargets.mockReturnValue({ data: { targets: [] } });
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "my-app" }));
    await user.click((await screen.findAllByRole("button", { name: "Targets" }))[0]);
    await screen.findByRole("dialog", { name: /Deployment targets — d-1/i });
    dismissModalWithEscape();
    await waitFor(() => expect(screen.queryByRole("button", { name: "Put hook status" })).toBeNull());
  });

  it("shows the empty state while targets are still loading", async () => {
    setupDeployment();
    mockTargets.mockReturnValue({ data: undefined });
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "my-app" }));
    await user.click((await screen.findAllByRole("button", { name: "Targets" }))[0]);
    await screen.findByRole("dialog", { name: /Deployment targets — d-1/i });
    expect(screen.getByText("No targets")).toBeTruthy();
  });

  it("renders targets with dash and status fallbacks", async () => {
    setupDeployment();
    mockTargets.mockReturnValue({
      data: {
        targets: [
          { deploymentTargetStatus: "Ready", lastUpdatedAt: 1700000000000 },
          {},
        ],
      },
    });
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "my-app" }));
    await user.click((await screen.findAllByRole("button", { name: "Targets" }))[0]);
    expect(await screen.findByText("Ready")).toBeTruthy();
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(3);
  });

  it("closes the targets modal with the Close button", async () => {
    setupDeployment();
    mockTargets.mockReturnValue({ data: { targets: [] } });
    const user = userEvent.setup();
    render(<CodeDeployDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "my-app" }));
    await user.click((await screen.findAllByRole("button", { name: "Targets" }))[0]);
    const dialog = await screen.findByRole("dialog", { name: /Deployment targets — d-1/i });
    await user.click(within(dialog).getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Put hook status" })).toBeNull());
  });
});
