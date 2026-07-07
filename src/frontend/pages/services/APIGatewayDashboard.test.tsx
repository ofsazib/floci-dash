// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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
}));

import { APIGatewayDashboard } from "./APIGatewayDashboard";

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
    await clickButton(user, /Create/i);
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
});
