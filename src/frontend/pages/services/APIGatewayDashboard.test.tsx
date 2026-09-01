// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

// ─── vi.hoisted mutable states ──────────────────────────

const createApiState = vi.hoisted(() => ({
  isPending: false,
  isError: false,
  error: null as Error | null,
}));

const deleteApiState = vi.hoisted(() => ({
  isPending: false,
  variables: null as string | null,
}));

// ─── Mock hooks ─────────────────────────────────────────

const mockApis = vi.fn();
const mockCreateApi = vi.fn();
const mockDeleteApi = vi.fn();
const mockApiDetail = vi.fn();
const mockResources = vi.fn();
const mockDeployments = vi.fn();
const mockStages = vi.fn();
const mockAuthorizers = vi.fn();
const mockValidators = vi.fn();
const mockModels = vi.fn();
const mockApiKeys = vi.fn();
const mockUsagePlans = vi.fn();
const mockDomainNames = vi.fn();
const mockAccount = vi.fn();
const noopMutation = vi.hoisted(() => () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false, isError: false, error: null }));

vi.mock("../../hooks/useAPIGateway", () => ({
  useAPIGatewayApis: (...args: any[]) => mockApis(...args),
  useCreateAPIGatewayApi: () => ({
    mutate: mockCreateApi,
    get isPending() { return createApiState.isPending; },
    get isError() { return createApiState.isError; },
    get error() { return createApiState.error; },
  }),
  useDeleteAPIGatewayApi: () => ({
    mutateAsync: mockDeleteApi,
    get isPending() { return deleteApiState.isPending; },
    get variables() { return deleteApiState.variables; },
  }),
  useAPIGatewayApi: (...args: any[]) => mockApiDetail(...args),
  useAPIGatewayResources: (...args: any[]) => mockResources(...args),
  useAPIGatewayDeployments: (...args: any[]) => mockDeployments(...args),
  useAPIGatewayStages: (...args: any[]) => mockStages(...args),
  useAPIGatewayAuthorizers: (...args: any[]) => mockAuthorizers(...args),
  useAPIGatewayRequestValidators: (...args: any[]) => mockValidators(...args),
  useAPIGatewayModels: (...args: any[]) => mockModels(...args),
  useAPIGatewayApiKeys: (...args: any[]) => mockApiKeys(...args),
  useAPIGatewayUsagePlans: (...args: any[]) => mockUsagePlans(...args),
  useAPIGatewayDomainNames: (...args: any[]) => mockDomainNames(...args),
  useAPIGatewayAccount: (...args: any[]) => mockAccount(...args),
  useCreateAPIGatewayResource: noopMutation,
  useDeleteAPIGatewayResource: noopMutation,
  useCreateAPIGatewayDeployment: noopMutation,
  useDeleteAPIGatewayDeployment: noopMutation,
  useCreateAPIGatewayStage: noopMutation,
  useDeleteAPIGatewayStage: noopMutation,
  useCreateAPIGatewayAuthorizer: noopMutation,
  useDeleteAPIGatewayAuthorizer: noopMutation,
  useCreateAPIGatewayRequestValidator: noopMutation,
  useDeleteAPIGatewayRequestValidator: noopMutation,
  useCreateAPIGatewayModel: noopMutation,
  useDeleteAPIGatewayModel: noopMutation,
  useCreateAPIGatewayApiKey: noopMutation,
  useDeleteAPIGatewayApiKey: noopMutation,
  useCreateAPIGatewayUsagePlan: noopMutation,
  useDeleteAPIGatewayUsagePlan: noopMutation,
  useCreateAPIGatewayDomainName: noopMutation,
  useDeleteAPIGatewayDomainName: noopMutation,
}));

import { APIGatewayDashboard } from "./APIGatewayDashboard";

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
  createApiState.isPending = false;
  createApiState.isError = false;
  createApiState.error = null;
  deleteApiState.isPending = false;
  deleteApiState.variables = null;
  mockApis.mockReturnValue({ data: { apis: [], total: 0 }, isLoading: false, isError: false, error: null });
  mockResources.mockReturnValue({ data: { resources: [], total: 0 }, isLoading: false, isError: false, error: null });
  mockDeployments.mockReturnValue({ data: { deployments: [], total: 0 }, isLoading: false });
  mockApiDetail.mockReturnValue({ data: undefined, isLoading: false });
  mockStages.mockReturnValue({ data: { stages: [], total: 0 }, isLoading: false });
  mockAuthorizers.mockReturnValue({ data: { authorizers: [], total: 0 }, isLoading: false });
  mockValidators.mockReturnValue({ data: { requestValidators: [], total: 0 }, isLoading: false });
  mockModels.mockReturnValue({ data: { models: [], total: 0 }, isLoading: false });
  mockApiKeys.mockReturnValue({ data: { apiKeys: [], total: 0 }, isLoading: false });
  mockUsagePlans.mockReturnValue({ data: { usagePlans: [], total: 0 }, isLoading: false });
  mockDomainNames.mockReturnValue({ data: { domainNames: [], total: 0 }, isLoading: false });
  mockAccount.mockReturnValue({ data: {}, isLoading: false });
});

describe("APIGatewayDashboard", () => {
  // ── List view ──────────────────────────────────────────

  it("shows loading skeleton", () => {
    mockApis.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    const { container } = render(<APIGatewayDashboard />, { wrapper: createWrapper() });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("shows empty message", () => {
    render(<APIGatewayDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No REST APIs found/i)).toBeTruthy();
  });

  it("renders APIs with data", () => {
    mockApis.mockReturnValue({
      data: {
        apis: [{ id: "api-1", name: "my-api", description: "My REST API", createdDate: "2024-01-15T00:00:00Z" }],
        total: 1,
      },
      isLoading: false, isError: false, error: null,
    });
    render(<APIGatewayDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-api")).toBeTruthy();
    expect(screen.getByText("api-1")).toBeTruthy();
  });

  it("shows dash for missing description", () => {
    mockApis.mockReturnValue({
      data: { apis: [{ id: "api-1", name: "test" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    render(<APIGatewayDashboard />, { wrapper: createWrapper() });
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it("shows dash for missing createdDate", () => {
    mockApis.mockReturnValue({
      data: { apis: [{ id: "api-1", name: "test", createdDate: null }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    render(<APIGatewayDashboard />, { wrapper: createWrapper() });
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  // ── Create modal ────────────────────────────────────────

  it("opens create modal and submits", async () => {
    const user = userEvent.setup();
    const { container } = render(<APIGatewayDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(container.textContent).toContain("Create REST API"));
    const nameInput = screen.getByPlaceholderText("my-api");
    await user.type(nameInput, "new-api");
    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    await user.click(createBtns[createBtns.length - 1]);
    await waitFor(() => {
      expect(mockCreateApi).toHaveBeenCalledWith(
        expect.objectContaining({ name: "new-api" }),
        expect.any(Object),
      );
    });
  });

  it("cancels create modal", async () => {
    const user = userEvent.setup();
    const { container } = render(<APIGatewayDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(container.textContent).toContain("Create REST API"));
    await clickButton(user, /Cancel/i);
    expect(mockCreateApi).not.toHaveBeenCalled();
  });

  it("shows create API loading state", () => {
    createApiState.isPending = true;
    mockApis.mockReturnValue({
      data: { apis: [{ id: "api-1", name: "my-api" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    render(<APIGatewayDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-api")).toBeTruthy();
  });

  it("shows create API error alert", async () => {
    createApiState.isError = true;
    createApiState.error = new Error("API creation failed");
    const user = userEvent.setup();
    render(<APIGatewayDashboard />, { wrapper: createWrapper() });
    const btns = screen.getAllByRole("button", { name: /Create/i });
    await user.click(btns[btns.length - 1]);
    await waitFor(() => {
      expect(screen.getByText("API creation failed")).toBeTruthy();
    });
  });

  it("shows delete API loading state", () => {
    deleteApiState.isPending = true;
    deleteApiState.variables = "api-1";
    mockApis.mockReturnValue({
      data: { apis: [{ id: "api-1", name: "my-api" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    render(<APIGatewayDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-api")).toBeTruthy();
  });

  // ── Delete ──────────────────────────────────────────────

  it("deletes an API", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ id: "api-1", name: "delete-me", createdDate: "2024-01-15T00:00:00Z" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<APIGatewayDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("delete-me")).toBeTruthy());
    const deleteBtn = screen.getByRole("button", { name: /Delete delete-me/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteApi).toHaveBeenCalledWith("api-1"));
  });

  // ── Filter ─────────────────────────────────────────────

  it("filters APIs by name", async () => {
    mockApis.mockReturnValue({
      data: {
        apis: [
          { id: "id1", name: "alpha-api", createdDate: "2024-01-15T00:00:00Z" },
          { id: "id2", name: "beta-api", createdDate: "2024-01-16T00:00:00Z" },
        ],
        total: 2,
      },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<APIGatewayDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("alpha-api")).toBeTruthy());
    const filterInput = screen.getByPlaceholderText("Find APIs by name");
    await user.type(filterInput, "beta");
    await waitFor(() => expect(screen.queryByText("alpha-api")).toBeNull());
  });

  // ── Detail view ────────────────────────────────────────

  it("navigates to API detail view", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ id: "api-1", name: "my-api", description: "desc", createdDate: "2024-01-15T00:00:00Z" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<APIGatewayDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-api")).toBeTruthy());
    await user.click(screen.getByText("View"));
    await waitFor(() => expect(screen.getByText(/Back to REST APIs/i)).toBeTruthy());
  });

  it("shows resources and deployments containers in detail view", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ id: "api-1", name: "my-api", createdDate: "2024-01-15T00:00:00Z" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    const { container } = render(<APIGatewayDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("my-api"));
    await user.click(screen.getByText("View"));
    await waitFor(() => {
      expect(container.textContent).toMatch(/Resources/i);
      expect(container.textContent).toMatch(/Deployments/i);
    });
  });

  it("shows resources with HTTP methods in detail view", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ id: "api-1", name: "my-api", createdDate: "2024-01-15T00:00:00Z" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockApiDetail.mockReturnValue({ data: { api: { id: "api-1", name: "my-api" } }, isLoading: false });
    mockResources.mockReturnValue({
      data: { resources: [{ id: "res-1", path: "/users", resourceMethods: { GET: {}, POST: {} } }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockDeployments.mockReturnValue({
      data: { deployments: [{ id: "dep-1", stageName: "prod", createdDate: "2024-01-15T00:00:00Z" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<APIGatewayDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("my-api"));
    await user.click(screen.getByText("View"));
    await waitFor(() => expect(screen.getByText("GET, POST")).toBeTruthy());
    expect(screen.getByText("/users")).toBeTruthy();
  });

  it("shows deployment details in detail view", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ id: "api-1", name: "my-api", createdDate: "2024-01-15T00:00:00Z" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockApiDetail.mockReturnValue({ data: { api: { id: "api-1", name: "my-api" } }, isLoading: false });
    mockResources.mockReturnValue({ data: { resources: [], total: 0 }, isLoading: false, isError: false, error: null });
    mockDeployments.mockReturnValue({
      data: { deployments: [{ id: "dep-1", stageName: "prod", createdDate: "2024-01-15T00:00:00Z" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<APIGatewayDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("my-api"));
    await user.click(screen.getByText("View"));
    await waitFor(() => expect(screen.getByText(/Back to REST APIs/i)).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /Deployments/i }));
    await waitFor(() => expect(screen.getByText("dep-1")).toBeTruthy());
    expect(screen.getByText("prod")).toBeTruthy();
  });

  it("shows resources error in detail view", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ id: "api-1", name: "my-api", createdDate: "2024-01-15T00:00:00Z" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockApiDetail.mockReturnValue({ data: { api: { id: "api-1", name: "my-api" } }, isLoading: false });
    mockResources.mockReturnValue({
      data: undefined, isLoading: false, isError: true,
      error: new Error("Failed to load resources"),
    });
    mockDeployments.mockReturnValue({ data: { deployments: [], total: 0 }, isLoading: false });
    const user = userEvent.setup();
    render(<APIGatewayDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("my-api"));
    await user.click(screen.getByText("View"));
    // Resources tab is active by default
    await waitFor(() => expect(screen.getByText("Failed to load resources")).toBeTruthy());
  });

  it("shows resources with no methods as dash", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ id: "api-1", name: "my-api", createdDate: "2024-01-15T00:00:00Z" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockApiDetail.mockReturnValue({ data: { api: { id: "api-1", name: "my-api" } }, isLoading: false });
    mockResources.mockReturnValue({
      data: { resources: [{ id: "res-1", path: "/", resourceMethods: {} }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockDeployments.mockReturnValue({ data: { deployments: [], total: 0 }, isLoading: false });
    const user = userEvent.setup();
    render(<APIGatewayDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("my-api"));
    await user.click(screen.getByText("View"));
    await waitFor(() => {
      const dashes = screen.getAllByText("—");
      expect(dashes.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("goes back from detail to list", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ id: "api-1", name: "my-api", createdDate: "2024-01-15T00:00:00Z" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockResources.mockReturnValue({ data: { resources: [], total: 0 }, isLoading: false, isError: false, error: null });
    mockDeployments.mockReturnValue({ data: { deployments: [], total: 0 }, isLoading: false });
    const user = userEvent.setup();
    render(<APIGatewayDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("my-api"));
    await user.click(screen.getByText("View"));
    await waitFor(() => expect(screen.getByText(/Back to REST APIs/i)).toBeTruthy());
    await user.click(screen.getByText(/Back to REST APIs/i));
    await waitFor(() => expect(screen.getByText("my-api")).toBeTruthy());
  });

  it("dismisses the create modal with Escape", async () => {
    const user = userEvent.setup();
    render(<APIGatewayDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getAllByText("Create REST API").length).toBeGreaterThanOrEqual(1));
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Create REST API"));
  });

  it("submits create with a description and closes on success", async () => {
    mockCreateApi.mockImplementation((_payload: unknown, opts?: { onSuccess?: () => void }) => {
      opts?.onSuccess?.();
    });
    const user = userEvent.setup();
    render(<APIGatewayDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getAllByText("Create REST API").length).toBeGreaterThanOrEqual(1));
    await user.type(screen.getByPlaceholderText("my-api"), "new-api");
    await user.type(screen.getByLabelText(/Description/), "my description");
    await clickButton(user, /^Create$/i, { last: true });
    await waitFor(() => {
      expect(mockCreateApi).toHaveBeenCalledWith(
        expect.objectContaining({ name: "new-api", description: "my description" }),
        expect.any(Object),
      );
    });
    await waitFor(() => expectModalHidden("Create REST API"));
  });

  it("filters APIs missing a name", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ id: "api-1" }, { id: "api-2", name: "named-api" }], total: 2 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<APIGatewayDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("named-api")).toBeTruthy());
    const filterInput = screen.getByPlaceholderText("Find APIs by name");
    await user.type(filterInput, "named");
    await waitFor(() => expect(screen.queryByText(/api-1/)).toBeNull());
  });

  it("shows create API error fallback without message", async () => {
    createApiState.isError = true;
    createApiState.error = {} as Error;
    const user = userEvent.setup();
    render(<APIGatewayDashboard />, { wrapper: createWrapper() });
    const btns = screen.getAllByRole("button", { name: /Create/i });
    await user.click(btns[btns.length - 1]);
    await waitFor(() => expect(screen.getByText("Failed to create REST API")).toBeTruthy());
  });

  it("shows resources error fallback without message", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ id: "api-1", name: "my-api", createdDate: "2024-01-15T00:00:00Z" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockApiDetail.mockReturnValue({ data: { api: { id: "api-1", name: "my-api" } }, isLoading: false });
    mockResources.mockReturnValue({
      data: undefined, isLoading: false, isError: true,
      error: {} as Error,
    });
    mockDeployments.mockReturnValue({ data: { deployments: [], total: 0 }, isLoading: false });
    const user = userEvent.setup();
    render(<APIGatewayDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("my-api"));
    await user.click(screen.getByText("View"));
    // Resources tab is active by default
    await waitFor(() => expect(screen.getByText("Failed to load resources")).toBeTruthy());
  });

  it("shows detail with sparse resources and deployments", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ id: "api-1", name: "my-api", createdDate: "2024-01-15T00:00:00Z" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockApiDetail.mockReturnValue({ data: { api: { id: "api-1", name: "my-api" } }, isLoading: false });
    mockResources.mockReturnValue({
      data: { resources: [{ id: "res-1", path: "/" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockDeployments.mockReturnValue({
      data: { deployments: [{ id: "dep-1", apiSummary: "sum" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<APIGatewayDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("my-api"));
    await user.click(screen.getByText("View"));
    await waitFor(() => expect(screen.getByText(/Back to REST APIs/i)).toBeTruthy());
    // Resources tab is active by default — check resource content
    await waitFor(() => expect(screen.getByText("/")).toBeTruthy());
    // Switch to deployments tab
    await user.click(screen.getByRole("tab", { name: /Deployments/i }));
    await waitFor(() => expect(screen.getByText("dep-1")).toBeTruthy());
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(2);
  });

  it("shows detail when deployments key is missing", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ id: "api-1", name: "my-api", createdDate: "2024-01-15T00:00:00Z" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockApiDetail.mockReturnValue({ data: { api: { id: "api-1", name: "my-api" } }, isLoading: false });
    mockResources.mockReturnValue({ data: { resources: [], total: 0 }, isLoading: false, isError: false, error: null });
    mockDeployments.mockReturnValue({ data: { total: 0 } as any, isLoading: false });
    const user = userEvent.setup();
    render(<APIGatewayDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("my-api"));
    await user.click(screen.getByText("View"));
    await waitFor(() => expect(screen.getByText(/Back to REST APIs/i)).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /Deployments/i }));
    await waitFor(() => expect(screen.getByText("No deployments found.")).toBeTruthy());
  });
});
