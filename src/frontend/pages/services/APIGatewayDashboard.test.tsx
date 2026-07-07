// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

const mockApis = vi.fn();
const mockCreateApi = vi.fn();
const mockDeleteApi = vi.fn();
const mockApiDetail = vi.fn();
const mockResources = vi.fn();
const mockDeployments = vi.fn();

vi.mock("../../hooks/useAPIGateway", () => ({
  useAPIGatewayApis: (...args: any[]) => mockApis(...args),
  useCreateAPIGatewayApi: () => ({ mutate: mockCreateApi, isPending: false }),
  useDeleteAPIGatewayApi: () => ({ mutateAsync: mockDeleteApi, isPending: false, variables: null }),
  useAPIGatewayApi: (...args: any[]) => mockApiDetail(...args),
  useAPIGatewayResources: (...args: any[]) => mockResources(...args),
  useAPIGatewayDeployments: (...args: any[]) => mockDeployments(...args),
}));

import { APIGatewayDashboard } from "./APIGatewayDashboard";

beforeEach(() => {
  vi.clearAllMocks();
  mockApis.mockReturnValue({ data: { apis: [], total: 0 }, isLoading: false });
  mockResources.mockReturnValue({ data: { resources: [], total: 0 }, isLoading: false });
  mockDeployments.mockReturnValue({ data: { deployments: [], total: 0 }, isLoading: false });
  mockApiDetail.mockReturnValue({ data: undefined, isLoading: false });
});

describe("APIGatewayDashboard", () => {
  it("shows loading skeleton", () => {
    mockApis.mockReturnValue({ data: undefined, isLoading: true });
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
      isLoading: false,
    });
    render(<APIGatewayDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-api")).toBeTruthy();
    expect(screen.getByText("api-1")).toBeTruthy();
  });

  it("shows dash for missing description", () => {
    mockApis.mockReturnValue({
      data: { apis: [{ id: "api-1", name: "test" }], total: 1 },
      isLoading: false,
    });
    render(<APIGatewayDashboard />, { wrapper: createWrapper() });
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

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

  it("navigates to API detail view", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ id: "api-1", name: "my-api", description: "desc", createdDate: "2024-01-15T00:00:00Z" }], total: 1 },
      isLoading: false,
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
      isLoading: false,
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

  it("deletes an API", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ id: "api-1", name: "delete-me", createdDate: "2024-01-15T00:00:00Z" }], total: 1 },
      isLoading: false,
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

  it("filters APIs by name", async () => {
    mockApis.mockReturnValue({
      data: {
        apis: [
          { id: "id1", name: "alpha-api", createdDate: "2024-01-15T00:00:00Z" },
          { id: "id2", name: "beta-api", createdDate: "2024-01-16T00:00:00Z" },
        ],
        total: 2,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<APIGatewayDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("alpha-api")).toBeTruthy());

    const filterInput = screen.getByPlaceholderText("Find APIs by name");
    await user.type(filterInput, "beta");
    await waitFor(() => expect(screen.queryByText("alpha-api")).toBeNull());
  });
});
