// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

const mockApps = vi.fn();
const mockDeleteApp = vi.fn();
const mockEnvs = vi.fn();
const mockProfiles = vi.fn();
const mockCreateEnv = vi.fn();
const mockDeleteEnv = vi.fn();
const mockCreateProfile = vi.fn();
const mockDeleteProfile = vi.fn();

const deleteAppState = vi.hoisted(() => ({
  isPending: false,
  variables: null as string | null,
}));

const createEnvState = vi.hoisted(() => ({
  isPending: false,
  isError: false,
  error: null as Error | null,
}));

const deleteEnvState = vi.hoisted(() => ({
  isPending: false,
  variables: null as string | null,
}));

const createProfileState = vi.hoisted(() => ({
  isPending: false,
  isError: false,
  error: null as Error | null,
}));

const deleteProfileState = vi.hoisted(() => ({
  isPending: false,
  variables: null as string | null,
}));

vi.mock("../../hooks/useAppConfig", () => ({
  useAppConfigApplications: (...args: any[]) => mockApps(...args),
  useDeleteAppConfigApplication: () => ({
    mutateAsync: mockDeleteApp,
    get isPending() { return deleteAppState.isPending; },
    get variables() { return deleteAppState.variables; },
  }),
  useAppConfigEnvironments: (...args: any[]) => mockEnvs(...args),
  useAppConfigProfiles: (...args: any[]) => mockProfiles(...args),
  useCreateAppConfigEnvironment: () => ({
    mutate: mockCreateEnv,
    get isPending() { return createEnvState.isPending; },
    get isError() { return createEnvState.isError; },
    get error() { return createEnvState.error; },
  }),
  useDeleteAppConfigEnvironment: () => ({
    mutateAsync: mockDeleteEnv,
    get isPending() { return deleteEnvState.isPending; },
    get variables() { return deleteEnvState.variables; },
  }),
  useCreateAppConfigProfile: () => ({
    mutate: mockCreateProfile,
    get isPending() { return createProfileState.isPending; },
    get isError() { return createProfileState.isError; },
    get error() { return createProfileState.error; },
  }),
  useDeleteAppConfigProfile: () => ({
    mutateAsync: mockDeleteProfile,
    get isPending() { return deleteProfileState.isPending; },
    get variables() { return deleteProfileState.variables; },
  }),
}));

import { AppConfigDashboard } from "./AppConfigDashboard";

// ─── Modal helpers ───────────────────────────────────────

/** Fire Escape on every mounted Cloudscape dialog (they stay mounted when hidden). */
function dismissModalWithEscape() {
  document.querySelectorAll('[class*="awsui_dialog"]').forEach((dialog) => {
    fireEvent.keyDown(dialog as HTMLElement, { keyCode: 27 });
  });
}

/** Locate a modal dialog by its header text. */
function dialogOf(headerText: string): HTMLElement {
  const header = screen.getAllByText(headerText).find((h) => h.closest('[role="dialog"]'));
  return header!.closest('[role="dialog"]') as HTMLElement;
}

/** Assert the modal with the given header is hidden (Cloudscape uses display:none). */
function expectModalHidden(headerText: string) {
  expect(dialogOf(headerText).className).toContain("hidden");
}

beforeEach(() => {
  vi.clearAllMocks();
  deleteAppState.isPending = false;
  deleteAppState.variables = null;
  createEnvState.isPending = false;
  createEnvState.isError = false;
  createEnvState.error = null;
  deleteEnvState.isPending = false;
  deleteEnvState.variables = null;
  createProfileState.isPending = false;
  createProfileState.isError = false;
  createProfileState.error = null;
  deleteProfileState.isPending = false;
  deleteProfileState.variables = null;
  mockApps.mockReturnValue({ data: { applications: [], total: 0 }, isLoading: false });
  mockEnvs.mockReturnValue({ data: { environments: [], total: 0 } });
  mockProfiles.mockReturnValue({ data: { profiles: [], total: 0 } });
});

function setupOneApp() {
  mockApps.mockReturnValue({
    data: { applications: [{ Id: "app-1", Name: "my-app", Description: "Test app" }], total: 1 },
    isLoading: false,
  });
}

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

async function navigateToDetail(user: any) {
  setupOneApp();
  render(<AppConfigDashboard />, { wrapper: createWrapper() });
  await waitFor(() => screen.getByText("my-app"));
  await user.click(screen.getByText("my-app"));
  await waitFor(() => expect(screen.getByRole("tab", { name: /Environments/i })).toBeTruthy());
}

async function navigateToProfiles(user: any) {
  setupOneApp();
  render(<AppConfigDashboard />, { wrapper: createWrapper() });
  await waitFor(() => screen.getByText("my-app"));
  await user.click(screen.getByText("my-app"));
  await waitFor(() => screen.getByRole("tab", { name: /Configuration Profiles/i }));
  await user.click(screen.getByRole("tab", { name: /Configuration Profiles/i }));
}

// ─── App Detail — Environments Tab ──────────────────────

describe("AppConfigDashboard — environments", () => {

  it("opens create environment modal", async () => {
    const user = userEvent.setup();
    await navigateToDetail(user);
    await clickButton(user, /Create/i);
    await waitFor(() => {
      expect(screen.getByText("Create environment")).toBeTruthy();
    });
  });

  it("environment modal shows required fields", async () => {
    const user = userEvent.setup();
    await navigateToDetail(user);
    await clickButton(user, /Create/i);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("production")).toBeTruthy();
      expect(screen.getByText("Environment name")).toBeTruthy();
    });
  });

  it("create env button disabled when name empty", async () => {
    const user = userEvent.setup();
    await navigateToDetail(user);
    await clickButton(user, /Create/i);
    await waitFor(() => screen.getByText("Create environment"));
    const createBtns = screen.getAllByRole("button", { name: /^Create$/ });
    // The last "Create" button is the one in the modal footer
    const createBtn = createBtns[createBtns.length - 1];
    expect((createBtn as HTMLButtonElement).disabled || createBtn.getAttribute("aria-disabled") === "true").toBe(true);
  });

  it("shows create env error alert", async () => {
    createEnvState.isError = true;
    createEnvState.error = new Error("Env creation denied");
    const user = userEvent.setup();
    await navigateToDetail(user);
    await clickButton(user, /Create/i);
    await waitFor(() => {
      expect(screen.getByText("Env creation denied")).toBeTruthy();
    });
  });

  it("deletes an environment", async () => {
    mockEnvs.mockReturnValue({
      data: { environments: [{ Id: "env-del", Name: "dev", State: "ACTIVE" }], total: 1 },
    });
    const user = userEvent.setup();
    await navigateToDetail(user);
    await waitFor(() => screen.getByText("dev"));
    const deleteBtn = screen.getByRole("button", { name: /Delete dev/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteEnv).toHaveBeenCalledWith("env-del"));
  });

  it("shows dash for null state and description in env", async () => {
    mockEnvs.mockReturnValue({
      data: { environments: [{ Id: "env-null", Name: "empty-env" }], total: 1 },
    });
    const user = userEvent.setup();
    await navigateToDetail(user);
    await waitFor(() => {
      expect(screen.getByText("empty-env")).toBeTruthy();
    });
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(2);
  });

  it("filters environments by name", async () => {
    mockEnvs.mockReturnValue({
      data: {
        environments: [
          { Id: "e1", Name: "prod", State: "ACTIVE" },
          { Id: "e2", Name: "staging", State: "ACTIVE" },
        ],
        total: 2,
      },
    });
    const user = userEvent.setup();
    await navigateToDetail(user);
    await waitFor(() => screen.getByText("prod"));
    const filterInput = screen.getByPlaceholderText("Find environments");
    await user.type(filterInput, "stage");
    await waitFor(() => expect(screen.queryByText("prod")).toBeNull());
  });
});

// ─── App Detail — Profiles Tab ──────────────────────────

describe("AppConfigDashboard — profiles", () => {

  it("opens create profile modal", async () => {
    const user = userEvent.setup();
    await navigateToProfiles(user);
    await clickButton(user, /Create/i);
    await waitFor(() => {
      expect(screen.getByText("Create configuration profile")).toBeTruthy();
    });
  });

  it("submits create profile with all fields", async () => {
    const user = userEvent.setup();
    await navigateToProfiles(user);
    await clickButton(user, /Create$/i);
    await waitFor(() => screen.getByText("Create configuration profile"));
    const nameInput = screen.getByPlaceholderText("my-config");
    const locInput = screen.getByPlaceholderText("hosted");
    fireEvent.change(nameInput, { target: { value: "app-cfg" } });
    fireEvent.change(locInput, { target: { value: "ssm-param-store" } });
    const createBtns = screen.getAllByRole("button", { name: /^Create$/ });
    await user.click(createBtns[createBtns.length - 1]);
    expect(mockCreateProfile).toHaveBeenCalledWith(
      { name: "app-cfg", locationUri: "ssm-param-store", description: undefined },
      expect.any(Object)
    );
  });

  it("create profile defaults locationUri to hosted", async () => {
    const user = userEvent.setup();
    await navigateToProfiles(user);
    await clickButton(user, /Create$/i);
    await waitFor(() => screen.getByText("Create configuration profile"));
    const nameInput = screen.getByPlaceholderText("my-config");
    fireEvent.change(nameInput, { target: { value: "simple-cfg" } });
    const createBtns = screen.getAllByRole("button", { name: /^Create$/ });
    await user.click(createBtns[createBtns.length - 1]);
    expect(mockCreateProfile).toHaveBeenCalledWith(
      expect.objectContaining({ locationUri: "hosted" }),
      expect.any(Object)
    );
  });

  it("create profile button disabled when name empty", async () => {
    const user = userEvent.setup();
    await navigateToProfiles(user);
    await clickButton(user, /Create$/i);
    await waitFor(() => screen.getByText("Create configuration profile"));
    const createBtns = screen.getAllByRole("button", { name: /^Create$/ });
    const createBtn = createBtns[createBtns.length - 1];
    expect((createBtn as HTMLButtonElement).disabled || createBtn.getAttribute("aria-disabled") === "true").toBe(true);
  });

  it("shows create profile error alert", async () => {
    createProfileState.isError = true;
    createProfileState.error = new Error("Profile creation denied");
    const user = userEvent.setup();
    await navigateToProfiles(user);
    await clickButton(user, /Create/i);
    await waitFor(() => {
      expect(screen.getByText("Profile creation denied")).toBeTruthy();
    });
  });

  it("deletes a profile", async () => {
    mockProfiles.mockReturnValue({
      data: { profiles: [{ Id: "prof-del", Name: "old-config", Type: "AWS.Freeform" }], total: 1 },
    });
    const user = userEvent.setup();
    await navigateToProfiles(user);
    await waitFor(() => screen.getByText("old-config"));
    const deleteBtn = screen.getByRole("button", { name: /Delete old-config/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteProfile).toHaveBeenCalledWith("prof-del"));
  });

  it("shows dash for null type and location in profile", async () => {
    mockProfiles.mockReturnValue({
      data: { profiles: [{ Id: "prof-null", Name: "bare-profile" }], total: 1 },
    });
    const user = userEvent.setup();
    await navigateToProfiles(user);
    await waitFor(() => {
      expect(screen.getByText("bare-profile")).toBeTruthy();
    });
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(2);
  });

  it("filters profiles by name", async () => {
    mockProfiles.mockReturnValue({
      data: {
        profiles: [
          { Id: "p1", Name: "feature-flags", Type: "AWS.Freeform" },
          { Id: "p2", Name: "ui-config", Type: "AWS.Freeform" },
        ],
        total: 2,
      },
    });
    const user = userEvent.setup();
    await navigateToProfiles(user);
    await waitFor(() => screen.getByText("feature-flags"));
    const filterInput = screen.getByPlaceholderText("Find profiles");
    await user.type(filterInput, "ui");
    await waitFor(() => expect(screen.queryByText("feature-flags")).toBeNull());
  });

  it("goes back to the applications list from the detail view", async () => {
    mockApps.mockReturnValue({
      data: { applications: [{ Id: "app-1", Name: "my-app" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<AppConfigDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("my-app"));
    await user.click(screen.getByText("my-app"));
    await waitFor(() => expect(screen.getByText(/Back to applications/i)).toBeTruthy());
    await user.click(screen.getByText(/Back to applications/i));
    await waitFor(() => expect(screen.getByText("AppConfig Applications")).toBeTruthy());
  });

  it("dismisses and cancels the create environment modal", async () => {
    mockApps.mockReturnValue({
      data: { applications: [{ Id: "app-1", Name: "my-app" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<AppConfigDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("my-app"));
    await user.click(screen.getByText("my-app"));
    await waitFor(() => expect(screen.getByRole("tab", { name: /Environments/i })).toBeTruthy());
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create environment")).toBeTruthy());
    await user.click(within(dialogOf("Create environment")).getByRole("button", { name: /Cancel/i }));
    expect(mockCreateEnv).not.toHaveBeenCalled();
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create environment")).toBeTruthy());
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Create environment"));
  });

  it("creates an environment with name and description and closes on success", async () => {
    mockCreateEnv.mockImplementation((_payload: unknown, opts?: { onSuccess?: () => void }) => {
      opts?.onSuccess?.();
    });
    mockApps.mockReturnValue({
      data: { applications: [{ Id: "app-1", Name: "my-app" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<AppConfigDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("my-app"));
    await user.click(screen.getByText("my-app"));
    await waitFor(() => expect(screen.getByRole("tab", { name: /Environments/i })).toBeTruthy());
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create environment")).toBeTruthy());
    const dialog = dialogOf("Create environment");
    await user.type(within(dialog).getByPlaceholderText("production"), "prod");
    await user.type(within(dialog).getByLabelText(/Description/), "Production env");
    await user.click(within(dialog).getByRole("button", { name: /^Create$/ }));
    await waitFor(() => expectModalHidden("Create environment"));
    expect(mockCreateEnv).toHaveBeenCalledWith(
      expect.objectContaining({ name: "prod", description: "Production env" }),
      expect.any(Object),
    );
  });

  it("dismisses and cancels the create profile modal", async () => {
    mockApps.mockReturnValue({
      data: { applications: [{ Id: "app-1", Name: "my-app" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<AppConfigDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("my-app"));
    await user.click(screen.getByText("my-app"));
    await waitFor(() => screen.getByRole("tab", { name: /Configuration Profiles/i }));
    await user.click(screen.getByRole("tab", { name: /Configuration Profiles/i }));
    await clickButton(user, /Create$/i);
    await waitFor(() => expect(screen.getByText("Create configuration profile")).toBeTruthy());
    await user.click(within(dialogOf("Create configuration profile")).getByRole("button", { name: /Cancel/i }));
    expect(mockCreateProfile).not.toHaveBeenCalled();
    await clickButton(user, /Create$/i);
    await waitFor(() => expect(screen.getByText("Create configuration profile")).toBeTruthy());
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Create configuration profile"));
  });

  it("creates a profile with a description and closes on success", async () => {
    mockCreateProfile.mockImplementation((_payload: unknown, opts?: { onSuccess?: () => void }) => {
      opts?.onSuccess?.();
    });
    mockApps.mockReturnValue({
      data: { applications: [{ Id: "app-1", Name: "my-app" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<AppConfigDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("my-app"));
    await user.click(screen.getByText("my-app"));
    await waitFor(() => screen.getByRole("tab", { name: /Configuration Profiles/i }));
    await user.click(screen.getByRole("tab", { name: /Configuration Profiles/i }));
    await clickButton(user, /Create$/i);
    await waitFor(() => expect(screen.getByText("Create configuration profile")).toBeTruthy());
    const dialog = dialogOf("Create configuration profile");
    await user.type(within(dialog).getByPlaceholderText("my-config"), "app-cfg");
    await user.type(within(dialog).getByLabelText(/Description/), "Profile description");
    await user.click(within(dialog).getByRole("button", { name: /^Create$/ }));
    await waitFor(() => expectModalHidden("Create configuration profile"));
    expect(mockCreateProfile).toHaveBeenCalledWith(
      expect.objectContaining({ name: "app-cfg", description: "Profile description" }),
      expect.any(Object),
    );
  });
});

describe("AppConfigDashboard — branch coverage", () => {
  it("renders empty list when applications key is missing", () => {
    mockApps.mockReturnValue({ data: { total: 0 } as any, isLoading: false });
    render(<AppConfigDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("No AppConfig applications")).toBeTruthy();
  });

  it("shows delete-app loading state on matching row", () => {
    deleteAppState.isPending = true;
    deleteAppState.variables = "app-1";
    mockApps.mockReturnValue({
      data: { applications: [{ Id: "app-1", Name: "my-app", Description: "Test app" }], total: 1 },
      isLoading: false,
    });
    render(<AppConfigDashboard />, { wrapper: createWrapper() });
    expect(screen.getByRole("button", { name: /Delete my-app/i })).toBeTruthy();
  });

  it("renders empty environments when environments key is missing", async () => {
    const user = userEvent.setup();
    mockApps.mockReturnValue({ data: { applications: [{ Id: "app-1", Name: "my-app" }], total: 1 }, isLoading: false });
    mockEnvs.mockReturnValue({ data: { total: 0 } as any });
    render(<AppConfigDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("my-app"));
    await user.click(screen.getByText("my-app"));
    await waitFor(() => screen.getByRole("tab", { name: /Environments/i }));
    await user.click(screen.getByRole("tab", { name: /Environments/i }));
    await waitFor(() => expect(screen.getByText("No environments")).toBeTruthy());
  });

  it("shows delete-environment loading state on matching row", async () => {
    deleteEnvState.isPending = true;
    deleteEnvState.variables = "env-del";
    mockApps.mockReturnValue({ data: { applications: [{ Id: "app-1", Name: "my-app" }], total: 1 }, isLoading: false });
    mockEnvs.mockReturnValue({ data: { environments: [{ Id: "env-del", Name: "dev", State: "ACTIVE" }], total: 1 } });
    const user = userEvent.setup();
    render(<AppConfigDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("my-app"));
    await user.click(screen.getByText("my-app"));
    await waitFor(() => screen.getByRole("tab", { name: /Environments/i }));
    await user.click(screen.getByRole("tab", { name: /Environments/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: /Delete dev/i })).toBeTruthy());
  });

  it("renders empty profiles when profiles key is missing", async () => {
    const user = userEvent.setup();
    mockApps.mockReturnValue({ data: { applications: [{ Id: "app-1", Name: "my-app" }], total: 1 }, isLoading: false });
    mockProfiles.mockReturnValue({ data: { total: 0 } as any });
    render(<AppConfigDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("my-app"));
    await user.click(screen.getByText("my-app"));
    await waitFor(() => screen.getByRole("tab", { name: /Configuration Profiles/i }));
    await user.click(screen.getByRole("tab", { name: /Configuration Profiles/i }));
    await waitFor(() => expect(screen.getByText("No configuration profiles")).toBeTruthy());
  });

  it("shows delete-profile loading state on matching row", async () => {
    deleteProfileState.isPending = true;
    deleteProfileState.variables = "prof-del";
    mockApps.mockReturnValue({ data: { applications: [{ Id: "app-1", Name: "my-app" }], total: 1 }, isLoading: false });
    mockProfiles.mockReturnValue({ data: { profiles: [{ Id: "prof-del", Name: "old-config", Type: "AWS.Freeform" }], total: 1 } });
    const user = userEvent.setup();
    render(<AppConfigDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("my-app"));
    await user.click(screen.getByText("my-app"));
    await waitFor(() => screen.getByRole("tab", { name: /Configuration Profiles/i }));
    await user.click(screen.getByRole("tab", { name: /Configuration Profiles/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: /Delete old-config/i })).toBeTruthy());
  });

  it("creates environment with empty description payload", async () => {
    mockCreateEnv.mockImplementation((_payload: unknown, opts?: { onSuccess?: () => void }) => {
      opts?.onSuccess?.();
    });
    mockApps.mockReturnValue({ data: { applications: [{ Id: "app-1", Name: "my-app" }], total: 1 }, isLoading: false });
    const user = userEvent.setup();
    render(<AppConfigDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("my-app"));
    await user.click(screen.getByText("my-app"));
    await waitFor(() => screen.getByRole("tab", { name: /Environments/i }));
    await user.click(screen.getByRole("tab", { name: /Environments/i }));
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create environment")).toBeTruthy());
    const dialog = dialogOf("Create environment");
    await user.type(within(dialog).getByPlaceholderText("production"), "empty-desc");
    await user.click(within(dialog).getByRole("button", { name: /^Create$/ }));
    await waitFor(() => expect(mockCreateEnv).toHaveBeenCalled());
    expect(mockCreateEnv).toHaveBeenCalledWith(
      expect.objectContaining({ name: "empty-desc", description: undefined }),
      expect.any(Object),
    );
  });

  it("shows create env error fallback without message", async () => {
    createEnvState.isError = true;
    createEnvState.error = {} as Error;
    const user = userEvent.setup();
    await navigateToDetail(user);
    await clickButton(user, /Create/i);
    await waitFor(() => {
      expect(screen.getByText("Failed to create environment")).toBeTruthy();
    });
  });

  it("creates profile with empty locationUri falling back to hosted", async () => {
    mockCreateProfile.mockImplementation((_payload: unknown, opts?: { onSuccess?: () => void }) => {
      opts?.onSuccess?.();
    });
    mockApps.mockReturnValue({ data: { applications: [{ Id: "app-1", Name: "my-app" }], total: 1 }, isLoading: false });
    const user = userEvent.setup();
    render(<AppConfigDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("my-app"));
    await user.click(screen.getByText("my-app"));
    await waitFor(() => screen.getByRole("tab", { name: /Configuration Profiles/i }));
    await user.click(screen.getByRole("tab", { name: /Configuration Profiles/i }));
    await clickButton(user, /Create$/i);
    await waitFor(() => expect(screen.getByText("Create configuration profile")).toBeTruthy());
    const dialog = dialogOf("Create configuration profile");
    await user.type(within(dialog).getByPlaceholderText("my-config"), "empty-loc");
    const locInput = within(dialog).getByPlaceholderText("hosted");
    fireEvent.change(locInput, { target: { value: "" } });
    await user.click(within(dialog).getByRole("button", { name: /^Create$/ }));
    await waitFor(() => expect(mockCreateProfile).toHaveBeenCalled());
    expect(mockCreateProfile).toHaveBeenCalledWith(
      expect.objectContaining({ name: "empty-loc", locationUri: "hosted" }),
      expect.any(Object),
    );
  });

  it("shows create profile error fallback without message", async () => {
    createProfileState.isError = true;
    createProfileState.error = {} as Error;
    const user = userEvent.setup();
    await navigateToProfiles(user);
    await clickButton(user, /Create/i);
    await waitFor(() => {
      expect(screen.getByText("Failed to create profile")).toBeTruthy();
    });
  });
});
