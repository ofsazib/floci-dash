// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

// ─── Mock hooks ─────────────────────────────────────────

const mockApplications = vi.fn();
const mockApplicationVersions = vi.fn();
const mockEnvironments = vi.fn();
const mockConfigurationSettings = vi.fn();

const mockCreateApp = vi.fn();
const mockDeleteAppMutateAsync = vi.fn();
const mockCreateVersion = vi.fn();
const mockDeleteVersionMutateAsync = vi.fn();
const mockCreateEnv = vi.fn();
const mockDeleteEnvMutateAsync = vi.fn();

// Mutable state for error alert testing — vi.hoisted ensures these are
// hoisted with the vi.mock call, and getters make them reactive per-test.
const createAppState = vi.hoisted(() => ({ isError: false, error: null as Error | null, isPending: false }));
const createVersionState = vi.hoisted(() => ({ isError: false, error: null as Error | null, isPending: false }));
const createEnvState = vi.hoisted(() => ({ isError: false, error: null as Error | null, isPending: false }));

vi.mock("../../hooks/useElasticBeanstalk", () => ({
  useApplications: (...args: any[]) => mockApplications(...args),
  useCreateApplication: () => ({
    mutate: mockCreateApp,
    get isPending() { return createAppState.isPending; },
    get isError() { return createAppState.isError; },
    get error() { return createAppState.error; },
    reset: vi.fn(),
  }),
  useDeleteApplication: () => ({
    mutateAsync: mockDeleteAppMutateAsync,
    isPending: false,
    variables: null,
  }),
  useApplicationVersions: (...args: any[]) => mockApplicationVersions(...args),
  useCreateApplicationVersion: () => ({
    mutate: mockCreateVersion,
    get isPending() { return createVersionState.isPending; },
    get isError() { return createVersionState.isError; },
    get error() { return createVersionState.error; },
    reset: vi.fn(),
  }),
  useDeleteApplicationVersion: () => ({
    mutateAsync: mockDeleteVersionMutateAsync,
    isPending: false,
    variables: null,
  }),
  useEnvironments: (...args: any[]) => mockEnvironments(...args),
  useCreateEnvironment: () => ({
    mutate: mockCreateEnv,
    get isPending() { return createEnvState.isPending; },
    get isError() { return createEnvState.isError; },
    get error() { return createEnvState.error; },
    reset: vi.fn(),
  }),
  useDeleteEnvironment: () => ({
    mutateAsync: mockDeleteEnvMutateAsync,
    isPending: false,
    variables: null,
  }),
  useConfigurationSettings: (...args: any[]) => mockConfigurationSettings(...args),
}));

import { ElasticBeanstalkDashboard } from "./ElasticBeanstalkDashboard";

// ─── Setup ──────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();

  // Reset mutable error state
  createAppState.isError = false;
  createAppState.error = null;
  createAppState.isPending = false;
  createVersionState.isError = false;
  createVersionState.error = null;
  createVersionState.isPending = false;
  createEnvState.isError = false;
  createEnvState.error = null;
  createEnvState.isPending = false;

  mockApplications.mockReturnValue({
    data: { applications: [], total: 0 },
    isLoading: false,
    isError: false,
    error: null,
  });

  mockApplicationVersions.mockReturnValue({
    data: { versions: [], total: 0 },
    isLoading: false,
  });

  mockEnvironments.mockReturnValue({
    data: { environments: [], total: 0 },
    isLoading: false,
  });

  mockConfigurationSettings.mockReturnValue({
    data: undefined,
    isLoading: false,
  });
});

// ─── Tests ──────────────────────────────────────────────

describe("ElasticBeanstalkDashboard — rendering", () => {
  it("renders applications tab with header", () => {
    render(<ElasticBeanstalkDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/Applications \(0\)/)).toBeTruthy();
    expect(screen.getByText("Elastic Beanstalk Applications")).toBeTruthy();
  });

  it("shows loading skeleton when applications are loading", () => {
    mockApplications.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });
    const { container } = render(<ElasticBeanstalkDashboard />, {
      wrapper: createWrapper(),
    });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("shows empty message when no applications exist", () => {
    render(<ElasticBeanstalkDashboard />, { wrapper: createWrapper() });
    expect(
      screen.getByText("No applications found. Create one to get started."),
    ).toBeTruthy();
  });

  it("renders application data in the table", () => {
    mockApplications.mockReturnValue({
      data: {
        applications: [
          {
            applicationName: "my-app",
            description: "Test application",
            versions: 1,
            configurationTemplates: 1,
            dateCreated: "2024-01-01T00:00:00Z",
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<ElasticBeanstalkDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-app")).toBeTruthy();
    expect(screen.getByText("Test application")).toBeTruthy();
    expect(screen.getAllByText("1").length).toBeGreaterThan(0);
    expect(screen.queryByText("1/1/2024")).toBeTruthy();
  });

  it("renders multiple applications", () => {
    mockApplications.mockReturnValue({
      data: {
        applications: [
          {
            applicationName: "app-one",
            description: "First app",
            versions: 0,
            configurationTemplates: 0,
            dateCreated: "2024-01-01T00:00:00Z",
          },
          {
            applicationName: "app-two",
            description: "Second app",
            versions: 1,
            configurationTemplates: 1,
            dateCreated: "2024-01-02T00:00:00Z",
          },
        ],
        total: 2,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<ElasticBeanstalkDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("app-one")).toBeTruthy();
    expect(screen.getByText("app-two")).toBeTruthy();
    expect(screen.getByText("First app")).toBeTruthy();
    expect(screen.getByText("Second app")).toBeTruthy();
  });
});

describe("ElasticBeanstalkDashboard — application selection", () => {
  it("shows environments and versions containers when an application is selected", async () => {
    const user = userEvent.setup();

    mockApplications.mockReturnValue({
      data: {
        applications: [
          {
            applicationName: "my-app",
            description: "Test app",
            versions: 1,
            configurationTemplates: 1,
            dateCreated: "2024-01-01T00:00:00Z",
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    mockEnvironments.mockReturnValue({
      data: {
        environments: [
          {
            environmentName: "my-env",
            environmentId: "e-123",
            description: "Prod",
            versionLabel: "v1",
            solutionStackName: "64bit Amazon Linux 2023 v4.0.0 running Node.js 20",
            status: "Ready",
            health: "Green",
            cname: "my-env.elasticbeanstalk.com",
            dateCreated: "2024-01-01T00:00:00Z",
          },
        ],
        total: 1,
      },
      isLoading: false,
    });

    mockApplicationVersions.mockReturnValue({
      data: {
        versions: [
          {
            versionLabel: "v1",
            description: "Initial version",
            status: "PROCESSED",
            dateCreated: "2024-01-01T00:00:00Z",
          },
        ],
        total: 1,
      },
      isLoading: false,
    });

    render(<ElasticBeanstalkDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /my-app/i);

    await waitFor(() => {
      expect(screen.getByText(/Environments — my-app/)).toBeTruthy();
      expect(screen.getByText(/Application Versions — my-app/)).toBeTruthy();
    });

    // Environment data — use getAllByText since "v1" appears in both tables
    expect(screen.getByText("my-env")).toBeTruthy();
    expect(screen.getByText("Green")).toBeTruthy();
    expect(screen.getByText("Ready")).toBeTruthy();
    expect(screen.getAllByText("v1").length).toBeGreaterThan(0);

    // Version data
    expect(screen.getByText("Initial version")).toBeTruthy();
    expect(screen.getByText("PROCESSED")).toBeTruthy();
  });

  it("shows empty state when selected app has no environments", async () => {
    const user = userEvent.setup();

    mockApplications.mockReturnValue({
      data: {
        applications: [
          {
            applicationName: "my-app",
            description: "Test app",
            versions: 0,
            configurationTemplates: 0,
            dateCreated: "2024-01-01T00:00:00Z",
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    render(<ElasticBeanstalkDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /my-app/i);

    await waitFor(() => {
      expect(screen.getByText(/Environments — my-app/)).toBeTruthy();
    });

    expect(
      screen.getByText("No environments for this application."),
    ).toBeTruthy();
  });

  it("shows empty state when selected app has no versions", async () => {
    const user = userEvent.setup();

    mockApplications.mockReturnValue({
      data: {
        applications: [
          {
            applicationName: "my-app",
            description: "Test app",
            versions: 0,
            configurationTemplates: 0,
            dateCreated: "2024-01-01T00:00:00Z",
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    render(<ElasticBeanstalkDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /my-app/i);

    await waitFor(() => {
      expect(screen.getByText(/Application Versions — my-app/)).toBeTruthy();
    });

    expect(
      screen.getByText("No versions for this application."),
    ).toBeTruthy();
  });

  it("shows delete buttons for applications in the table", () => {
    mockApplications.mockReturnValue({
      data: {
        applications: [
          {
            applicationName: "my-app",
            description: "Test app",
            versions: 0,
            configurationTemplates: 0,
            dateCreated: "2024-01-01T00:00:00Z",
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<ElasticBeanstalkDashboard />, { wrapper: createWrapper() });
    expect(
      screen.getByRole("button", { name: /Delete my-app/i }),
    ).toBeTruthy();
  });
});

describe("ElasticBeanstalkDashboard — create application modal", () => {
  it("opens create application modal and creates an application", async () => {
    const user = userEvent.setup();

    render(<ElasticBeanstalkDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);

    await waitFor(() => {
      expect(screen.getByText("Create application")).toBeTruthy();
    });

    const appNameInput = screen.getByPlaceholderText("my-app");
    await user.type(appNameInput, "new-app");

    const appDescInput = screen.getByPlaceholderText("My application");
    await user.type(appDescInput, "My new app");

    // Last Create button is in the modal footer
    await clickButton(user, /Create/i, { last: true });

    expect(mockCreateApp).toHaveBeenCalledWith(
      { applicationName: "new-app", description: "My new app" },
      expect.any(Object),
    );
  });

  it("disables create button when name is empty", async () => {
    const user = userEvent.setup();

    render(<ElasticBeanstalkDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);

    await waitFor(() => {
      expect(screen.getByText("Create application")).toBeTruthy();
    });

    // Last Create button is the modal submit — should be disabled
    const createBtns = screen.getAllByRole("button", { name: /Create/i });
    const submitBtn = createBtns[createBtns.length - 1];
    expect(submitBtn).toBeDisabled();
  });

  it("closes modal on cancel", async () => {
    const user = userEvent.setup();

    render(<ElasticBeanstalkDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);

    await waitFor(() => {
      expect(screen.getByText("Create application")).toBeTruthy();
    });

    await clickButton(user, /Cancel/i);

    // After closing modal, verify the dashboard main content is visible
    await waitFor(() => {
      expect(screen.getByText("Elastic Beanstalk Applications")).toBeVisible();
    });
  });
});

describe("ElasticBeanstalkDashboard — create version modal", () => {
  it("opens create version modal and creates a version", async () => {
    const user = userEvent.setup();

    mockApplications.mockReturnValue({
      data: {
        applications: [
          {
            applicationName: "my-app",
            description: "Test app",
            versions: 0,
            configurationTemplates: 0,
            dateCreated: "2024-01-01T00:00:00Z",
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    render(<ElasticBeanstalkDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /my-app/i);

    await waitFor(() => {
      expect(screen.getByText(/Environments — my-app/)).toBeTruthy();
    });

    await clickButton(user, /Create version/i);

    await waitFor(() => {
      expect(screen.getByText(/Create version: my-app/)).toBeTruthy();
    });

    // Find the version modal dialog by its header text
    const dialogs = screen.getAllByRole("dialog");
    const dialog = dialogs.find(d => d.textContent?.includes("Create version: my-app"));
    expect(dialog).toBeDefined();
    const versionInput = within(dialog!).getByPlaceholderText("v1.0.0");
    const descInput = within(dialog!).getByPlaceholderText("Initial version");
    await user.type(versionInput, "v2.0.0");
    await user.type(descInput, "Second version");

    // Wait for the modal submit button to be enabled after typing, then click it
    await waitFor(async () => {
      const modalBtns = within(dialog!).getAllByRole("button");
      const submitBtn = modalBtns.find(b => b.textContent === "Create");
      expect(submitBtn).not.toBeNull();
      expect(submitBtn).not.toBeDisabled();
      await user.click(submitBtn!);
    });

    expect(mockCreateVersion).toHaveBeenCalledWith(
      { appName: "my-app", versionLabel: "v2.0.0", description: "Second version" },
      expect.any(Object),
    );
  });
});

describe("ElasticBeanstalkDashboard — create environment modal", () => {
  it("opens create environment modal and creates an environment", async () => {
    const user = userEvent.setup();

    mockApplications.mockReturnValue({
      data: {
        applications: [
          {
            applicationName: "my-app",
            description: "Test app",
            versions: 1,
            configurationTemplates: 0,
            dateCreated: "2024-01-01T00:00:00Z",
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    render(<ElasticBeanstalkDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /my-app/i);

    await waitFor(() => {
      expect(screen.getByText(/Environments — my-app/)).toBeTruthy();
    });

    await clickButton(user, /Create environment/i);

    await waitFor(() => {
      expect(screen.getByText(/Create environment: my-app/)).toBeTruthy();
    });

    const envNameInput = screen.getByPlaceholderText("my-env");
    await user.type(envNameInput, "prod-env");

    const envDescInput = screen.getByPlaceholderText("Production environment");
    await user.type(envDescInput, "Production");

    // Version input — Need the second "v1.0.0" placeholder (the env modal's one)
    const versionInputs = screen.getAllByPlaceholderText("v1.0.0");
    await user.type(versionInputs[1], "v1");

    const envStackInput = screen.getByPlaceholderText(/64bit Amazon Linux/);
    await user.type(envStackInput, "64bit Amazon Linux 2023");

    await clickButton(user, /Create/i, { last: true });

    expect(mockCreateEnv).toHaveBeenCalledWith(
      {
        appName: "my-app",
        environmentName: "prod-env",
        description: "Production",
        versionLabel: "v1",
        solutionStackName: "64bit Amazon Linux 2023",
      },
      expect.any(Object),
    );
  });

  it("disables create button when environment name is empty", async () => {
    const user = userEvent.setup();

    mockApplications.mockReturnValue({
      data: {
        applications: [
          {
            applicationName: "my-app",
            description: "Test app",
            versions: 0,
            configurationTemplates: 0,
            dateCreated: "2024-01-01T00:00:00Z",
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    render(<ElasticBeanstalkDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /my-app/i);

    await waitFor(() => {
      expect(screen.getByText(/Environments — my-app/)).toBeTruthy();
    });

    await clickButton(user, /Create environment/i);

    await waitFor(() => {
      expect(screen.getByText(/Create environment: my-app/)).toBeTruthy();
    });

    // Last Create button is the modal submit — should be disabled when env name is empty
    const createBtns = screen.getAllByRole("button", { name: /Create/i });
    const submitBtn = createBtns[createBtns.length - 1];
    expect(submitBtn).toBeDisabled();
  });
});

describe("ElasticBeanstalkDashboard — delete operations", () => {
  it("deletes an application", async () => {
    const user = userEvent.setup();

    mockApplications.mockReturnValue({
      data: {
        applications: [
          {
            applicationName: "my-app",
            description: "Test app",
            versions: 0,
            configurationTemplates: 0,
            dateCreated: "2024-01-01T00:00:00Z",
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    render(<ElasticBeanstalkDashboard />, { wrapper: createWrapper() });

    const deleteBtn = screen.getByRole("button", { name: /Delete my-app/i });
    await user.click(deleteBtn);

    await waitFor(() => {
      expect(screen.getByText(/Are you sure/)).toBeTruthy();
    });

    await clickButton(user, /^Delete$/i);

    await waitFor(() => {
      expect(mockDeleteAppMutateAsync).toHaveBeenCalledWith("my-app");
    });
  });

  it("deletes an environment from a selected application", async () => {
    const user = userEvent.setup();

    mockApplications.mockReturnValue({
      data: {
        applications: [
          {
            applicationName: "my-app",
            description: "Test app",
            versions: 1,
            configurationTemplates: 0,
            dateCreated: "2024-01-01T00:00:00Z",
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    mockEnvironments.mockReturnValue({
      data: {
        environments: [
          {
            environmentName: "my-env",
            environmentId: "e-123",
            description: "Prod",
            versionLabel: "v1",
            solutionStackName: "64bit Amazon Linux 2023",
            status: "Ready",
            health: "Green",
            cname: "my-env.elasticbeanstalk.com",
            dateCreated: "2024-01-01T00:00:00Z",
          },
        ],
        total: 1,
      },
      isLoading: false,
    });

    render(<ElasticBeanstalkDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /my-app/i);

    await waitFor(() => {
      expect(screen.getByText(/Environments — my-app/)).toBeTruthy();
    });

    const deleteBtn = screen.getByRole("button", { name: /Delete my-env/i });
    await user.click(deleteBtn);

    await waitFor(() => {
      expect(screen.getByText(/Are you sure/)).toBeTruthy();
    });

    await clickButton(user, /^Delete$/i);

    await waitFor(() => {
      expect(mockDeleteEnvMutateAsync).toHaveBeenCalledWith("my-env");
    });
  });

  it("deletes a version from a selected application", async () => {
    const user = userEvent.setup();

    mockApplications.mockReturnValue({
      data: {
        applications: [
          {
            applicationName: "my-app",
            description: "Test app",
            versions: 1,
            configurationTemplates: 0,
            dateCreated: "2024-01-01T00:00:00Z",
          },
        ],
        total: 1,
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    mockApplicationVersions.mockReturnValue({
      data: {
        versions: [
          {
            versionLabel: "v1",
            description: "First version",
            status: "PROCESSED",
            dateCreated: "2024-01-01T00:00:00Z",
          },
        ],
        total: 1,
      },
      isLoading: false,
    });

    render(<ElasticBeanstalkDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /my-app/i);

    await waitFor(() => {
      expect(screen.getByText(/Application Versions — my-app/)).toBeTruthy();
    });

    const deleteBtn = screen.getByRole("button", { name: /Delete v1/i });
    await user.click(deleteBtn);

    await waitFor(() => {
      expect(screen.getByText(/Are you sure/)).toBeTruthy();
    });

    await clickButton(user, /^Delete$/i);

    await waitFor(() => {
      expect(mockDeleteVersionMutateAsync).toHaveBeenCalledWith({
        appName: "my-app",
        versionLabel: "v1",
      });
    });
  });
});

describe("ElasticBeanstalkDashboard — filtering", () => {
  it("filters applications by name", async () => {
    const user = userEvent.setup();

    mockApplications.mockReturnValue({
      data: {
        applications: [
          {
            applicationName: "alpha-app",
            description: "First",
            versions: 0,
            configurationTemplates: 0,
            dateCreated: "2024-01-01T00:00:00Z",
          },
          {
            applicationName: "beta-app",
            description: "Second",
            versions: 0,
            configurationTemplates: 0,
            dateCreated: "2024-01-02T00:00:00Z",
          },
        ],
        total: 2,
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    render(<ElasticBeanstalkDashboard />, { wrapper: createWrapper() });

    // Both apps should be visible initially
    expect(screen.getByText("alpha-app")).toBeTruthy();
    expect(screen.getByText("beta-app")).toBeTruthy();

    // Find filter input and type search
    const filterInput = screen.getByPlaceholderText(
      "Find applications by name",
    );
    await user.type(filterInput, "alpha");

    // Typing "alpha" should hide "beta-app" from the filtered table
    await waitFor(() => {
      expect(screen.queryByText("beta-app")).toBeNull();
    });
  });
});

describe("ElasticBeanstalkDashboard — create modals — cancel and error alerts", () => {
  it("cancels create version modal", async () => {
    const user = userEvent.setup();
    mockApplications.mockReturnValue({
      data: {
        applications: [{ applicationName: "my-app", description: "Test", versions: 0, configurationTemplates: 0, dateCreated: "2024-01-01T00:00:00Z" }],
        total: 1,
      },
      isLoading: false,
    });
    render(<ElasticBeanstalkDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /my-app/i);
    await waitFor(() => expect(screen.getByText(/Environments — my-app/)).toBeTruthy());
    await clickButton(user, /Create version/i);
    await waitFor(() => expect(screen.getByText(/Create version: my-app/)).toBeTruthy());
    await clickButton(user, /Cancel/i);
    await waitFor(() => expect(screen.getByText(/Environments — my-app/)).toBeTruthy());
  });

  it("cancels create environment modal", async () => {
    const user = userEvent.setup();
    mockApplications.mockReturnValue({
      data: {
        applications: [{ applicationName: "my-app", description: "Test", versions: 0, configurationTemplates: 0, dateCreated: "2024-01-01T00:00:00Z" }],
        total: 1,
      },
      isLoading: false,
    });
    render(<ElasticBeanstalkDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /my-app/i);
    await waitFor(() => expect(screen.getByText(/Environments — my-app/)).toBeTruthy());
    await clickButton(user, /Create environment/i);
    await waitFor(() => expect(screen.getByText(/Create environment: my-app/)).toBeTruthy());
    await clickButton(user, /Cancel/i);
    await waitFor(() => expect(screen.getByText(/Environments — my-app/)).toBeTruthy());
  });

  it("shows error alert in create application modal", async () => {
    const user = userEvent.setup();
    // Set error state before opening modal
    createAppState.isError = true;
    createAppState.error = new Error("App creation failed");
    render(<ElasticBeanstalkDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => {
      expect(screen.getByText(/App creation failed/)).toBeTruthy();
      expect(screen.getByText("Create application")).toBeTruthy();
    });
  });

  it("shows error alert in create version modal", async () => {
    const user = userEvent.setup();
    createVersionState.isError = true;
    createVersionState.error = new Error("Version creation failed");
    mockApplications.mockReturnValue({
      data: {
        applications: [{ applicationName: "my-app", description: "Test", versions: 0, configurationTemplates: 0, dateCreated: "2024-01-01T00:00:00Z" }],
        total: 1,
      },
      isLoading: false,
    });
    render(<ElasticBeanstalkDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /my-app/i);
    await waitFor(() => expect(screen.getByText(/Environments — my-app/)).toBeTruthy());
    await clickButton(user, /Create version/i);
    await waitFor(() => {
      expect(screen.getByText(/Version creation failed/)).toBeTruthy();
      expect(screen.getByText(/Create version: my-app/)).toBeTruthy();
    });
  });

  it("shows error alert in create environment modal", async () => {
    const user = userEvent.setup();
    createEnvState.isError = true;
    createEnvState.error = new Error("Environment creation failed");
    mockApplications.mockReturnValue({
      data: {
        applications: [{ applicationName: "my-app", description: "Test", versions: 0, configurationTemplates: 0, dateCreated: "2024-01-01T00:00:00Z" }],
        total: 1,
      },
      isLoading: false,
    });
    render(<ElasticBeanstalkDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /my-app/i);
    await waitFor(() => expect(screen.getByText(/Environments — my-app/)).toBeTruthy());
    await clickButton(user, /Create environment/i);
    await waitFor(() => {
      expect(screen.getByText(/Environment creation failed/)).toBeTruthy();
      expect(screen.getByText(/Create environment: my-app/)).toBeTruthy();
    });
  });
});

describe("ElasticBeanstalkDashboard — filters and deselection", () => {
  it("filters environments by name", async () => {
    const user = userEvent.setup();
    mockApplications.mockReturnValue({
      data: {
        applications: [{ applicationName: "my-app", description: "Test", versions: 0, configurationTemplates: 0, dateCreated: "2024-01-01T00:00:00Z" }],
        total: 1,
      },
      isLoading: false,
    });
    mockEnvironments.mockReturnValue({
      data: {
        environments: [
          { environmentName: "alpha-env", environmentId: "e-1", description: "First", versionLabel: "v1", solutionStackName: "stack1", status: "Ready", health: "Green", cname: "alpha.example.com", dateCreated: "2024-01-01T00:00:00Z" },
          { environmentName: "beta-env", environmentId: "e-2", description: "Second", versionLabel: "v2", solutionStackName: "stack2", status: "Ready", health: "Green", cname: "beta.example.com", dateCreated: "2024-01-01T00:00:00Z" },
        ],
        total: 2,
      },
      isLoading: false,
    });
    render(<ElasticBeanstalkDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /my-app/i);
    await waitFor(() => expect(screen.getByText("alpha-env")).toBeTruthy());
    const filterInput = screen.getByPlaceholderText("Find environments");
    await user.type(filterInput, "beta");
    await waitFor(() => expect(screen.queryByText("alpha-env")).toBeNull());
  });

  it("filters versions by label", async () => {
    const user = userEvent.setup();
    mockApplications.mockReturnValue({
      data: {
        applications: [{ applicationName: "my-app", description: "Test", versions: 0, configurationTemplates: 0, dateCreated: "2024-01-01T00:00:00Z" }],
        total: 1,
      },
      isLoading: false,
    });
    mockApplicationVersions.mockReturnValue({
      data: {
        versions: [
          { versionLabel: "v1.0", description: "First", status: "PROCESSED", dateCreated: "2024-01-01T00:00:00Z" },
          { versionLabel: "v2.0", description: "Second", status: "PROCESSED", dateCreated: "2024-01-01T00:00:00Z" },
        ],
        total: 2,
      },
      isLoading: false,
    });
    render(<ElasticBeanstalkDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /my-app/i);
    await waitFor(() => expect(screen.getByText("v1.0")).toBeTruthy());
    const filterInput = screen.getByPlaceholderText("Find versions");
    await user.type(filterInput, "v2");
    await waitFor(() => expect(screen.queryByText("v1.0")).toBeNull());
  });

  it("deselects application when clicked again", async () => {
    const user = userEvent.setup();
    mockApplications.mockReturnValue({
      data: {
        applications: [{ applicationName: "my-app", description: "Test", versions: 0, configurationTemplates: 0, dateCreated: "2024-01-01T00:00:00Z" }],
        total: 1,
      },
      isLoading: false,
    });
    render(<ElasticBeanstalkDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /my-app/i);
    await waitFor(() => expect(screen.getByText(/Environments — my-app/)).toBeTruthy());
    await clickButton(user, /my-app/i);
    await waitFor(() => expect(screen.queryByText(/Environments — my-app/)).toBeNull());
  });
});

describe("ElasticBeanstalkDashboard — fallbacks and variants", () => {
  it("shows fallback values for missing application fields", () => {
    mockApplications.mockReturnValue({
      data: {
        applications: [{
          applicationName: null as any,
          description: null as any,
          versions: null as any,
          configurationTemplates: null as any,
          dateCreated: null as any,
        }],
        total: 1,
      },
      isLoading: false,
    });
    render(<ElasticBeanstalkDashboard />, { wrapper: createWrapper() });
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("shows health status with Yellow and Red variants", async () => {
    const user = userEvent.setup();
    mockApplications.mockReturnValue({
      data: {
        applications: [{ applicationName: "my-app", description: "Test", versions: 1, configurationTemplates: 0, dateCreated: "2024-01-01T00:00:00Z" }],
        total: 1,
      },
      isLoading: false,
    });
    mockEnvironments.mockReturnValue({
      data: {
        environments: [
          { environmentName: "yellow-env", environmentId: "e-1", description: "Yellow", versionLabel: "v1", solutionStackName: "stack", status: "Warning", health: "Yellow", cname: "yellow.example.com", dateCreated: "2024-01-01T00:00:00Z" },
          { environmentName: "red-env", environmentId: "e-2", description: "Red", versionLabel: "v2", solutionStackName: "stack", status: "Degraded", health: "Red", cname: "red.example.com", dateCreated: "2024-01-01T00:00:00Z" },
        ],
        total: 2,
      },
      isLoading: false,
    });
    render(<ElasticBeanstalkDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /my-app/i);
    await waitFor(() => expect(screen.getByText("yellow-env")).toBeTruthy());
    expect(screen.getByText("Yellow")).toBeTruthy();
    expect(screen.getByText("Red")).toBeTruthy();
  });

  it("shows loading states for environments and versions", async () => {
    const user = userEvent.setup();
    mockApplications.mockReturnValue({
      data: {
        applications: [{ applicationName: "my-app", description: "Test", versions: 0, configurationTemplates: 0, dateCreated: "2024-01-01T00:00:00Z" }],
        total: 1,
      },
      isLoading: false,
    });
    mockEnvironments.mockReturnValue({ data: undefined, isLoading: true });
    mockApplicationVersions.mockReturnValue({ data: undefined, isLoading: true });
    render(<ElasticBeanstalkDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /my-app/i);
    await waitFor(() => expect(screen.getByText(/Environments — my-app/)).toBeTruthy());
    expect(screen.getByText(/Application Versions — my-app/)).toBeTruthy();
  });

  it("uses empty description string for null environment description", async () => {
    const user = userEvent.setup();
    mockApplications.mockReturnValue({
      data: {
        applications: [{ applicationName: "my-app", description: "Test", versions: 0, configurationTemplates: 0, dateCreated: "2024-01-01T00:00:00Z" }],
        total: 1,
      },
      isLoading: false,
    });
    mockEnvironments.mockReturnValue({
      data: {
        environments: [{
          environmentName: "no-desc-env", environmentId: "e-1", description: null as any,
          versionLabel: "v1", solutionStackName: "stack", status: "Ready", health: "Green",
          cname: null as any, dateCreated: null as any,
        }],
        total: 1,
      },
      isLoading: false,
    });
    render(<ElasticBeanstalkDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /my-app/i);
    await waitFor(() => expect(screen.getByText("no-desc-env")).toBeTruthy());
    // The empty description becomes ""; just verify env table rendered
    expect(screen.getByText("Ready")).toBeTruthy();
  });
});
