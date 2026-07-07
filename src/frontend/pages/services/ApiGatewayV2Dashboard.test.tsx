// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

const mockApis = vi.fn();
const mockDeleteApi = vi.fn();
const mockRoutes = vi.fn();
const mockIntegrations = vi.fn();
const mockStages = vi.fn();
const mockDeployments = vi.fn();
const mockCreateDeployment = vi.fn();

vi.mock("../../hooks/useApiGatewayV2", () => ({
  useApiGatewayV2Apis: (...args: any[]) => mockApis(...args),
  useDeleteApiGatewayV2Api: () => ({ mutateAsync: mockDeleteApi, isPending: false, variables: null }),
  useApiGatewayV2Routes: (...args: any[]) => mockRoutes(...args),
  useApiGatewayV2Integrations: (...args: any[]) => mockIntegrations(...args),
  useApiGatewayV2Stages: (...args: any[]) => mockStages(...args),
  useApiGatewayV2Deployments: (...args: any[]) => mockDeployments(...args),
  useCreateApiGatewayV2Deployment: (apiId: string) => ({ mutateAsync: mockCreateDeployment, isPending: false }),
}));

import { ApiGatewayV2Dashboard } from "./ApiGatewayV2Dashboard";

beforeEach(() => {
  vi.clearAllMocks();
  mockApis.mockReturnValue({ data: { apis: [], total: 0 }, isLoading: false });
  mockRoutes.mockReturnValue({ data: { routes: [], total: 0 } });
  mockIntegrations.mockReturnValue({ data: { integrations: [], total: 0 } });
  mockStages.mockReturnValue({ data: { stages: [], total: 0 } });
  mockDeployments.mockReturnValue({ data: { deployments: [], total: 0 } });
});

describe("ApiGatewayV2Dashboard", () => {
  it("shows loading skeleton", () => {
    mockApis.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = render(<ApiGatewayV2Dashboard />, { wrapper: createWrapper() });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("shows empty message", () => {
    render(<ApiGatewayV2Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No APIs/i)).toBeTruthy();
  });

  it("renders APIs with data", () => {
    mockApis.mockReturnValue({
      data: {
        apis: [{ ApiId: "api-1", Name: "my-api", ProtocolType: "HTTP", ApiEndpoint: "https://abc.execute-api.amazonaws.com", CreatedDate: 1705000000 }],
        total: 1,
      },
      isLoading: false,
    });
    render(<ApiGatewayV2Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-api")).toBeTruthy();
    expect(screen.getByText("HTTP")).toBeTruthy();
  });

  it("navigates to API detail with tabs", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ ApiId: "api-1", Name: "my-api", ProtocolType: "HTTP", CreatedDate: 1705000000 }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ApiGatewayV2Dashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("my-api")).toBeTruthy());

    await user.click(screen.getByText("my-api"));
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /Routes/i })).toBeTruthy();
      expect(screen.getByRole("tab", { name: /Integrations/i })).toBeTruthy();
      expect(screen.getByRole("tab", { name: /Stages/i })).toBeTruthy();
      expect(screen.getByRole("tab", { name: /Deployments/i })).toBeTruthy();
    });
  });

  it("shows back button in detail", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ ApiId: "api-1", Name: "test", ProtocolType: "HTTP" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ApiGatewayV2Dashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("test"));
    await user.click(screen.getByText("test"));
    await waitFor(() => expect(screen.getByText(/Back to APIs/i)).toBeTruthy());
  });

  it("renders routes in detail tab", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ ApiId: "api-1", Name: "my-api", ProtocolType: "HTTP" }], total: 1 },
      isLoading: false,
    });
    mockRoutes.mockReturnValue({
      data: { routes: [{ RouteId: "r-1", RouteKey: "GET /items", AuthorizationType: "NONE", Target: "integ-1" }], total: 1 },
    });
    const user = userEvent.setup();
    render(<ApiGatewayV2Dashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("my-api"));
    await user.click(screen.getByText("my-api"));
    await waitFor(() => expect(screen.getByText("GET /items")).toBeTruthy());
  });

  it("renders integrations in detail tab", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ ApiId: "api-1", Name: "my-api", ProtocolType: "HTTP" }], total: 1 },
      isLoading: false,
    });
    mockIntegrations.mockReturnValue({
      data: { integrations: [{ IntegrationId: "i-1", IntegrationType: "AWS_PROXY", IntegrationUri: "arn:aws:lambda:...", IntegrationMethod: "POST" }], total: 1 },
    });
    const user = userEvent.setup();
    render(<ApiGatewayV2Dashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("my-api"));
    await user.click(screen.getByText("my-api"));
    await user.click(screen.getByRole("tab", { name: /Integrations/i }));
    await waitFor(() => expect(screen.getByText("AWS_PROXY")).toBeTruthy());
  });

  it("renders stages in detail tab", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ ApiId: "api-1", Name: "my-api", ProtocolType: "HTTP" }], total: 1 },
      isLoading: false,
    });
    mockStages.mockReturnValue({
      data: { stages: [{ StageName: "$default", AutoDeploy: true, DeploymentId: "d-1", CreatedDate: 1705000000 }], total: 1 },
    });
    const user = userEvent.setup();
    render(<ApiGatewayV2Dashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("my-api"));
    await user.click(screen.getByText("my-api"));
    await user.click(screen.getByRole("tab", { name: /Stages/i }));
    await waitFor(() => expect(screen.getByText("$default")).toBeTruthy());
  });

  it("deletes an API", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ ApiId: "api-1", Name: "delete-me", ProtocolType: "HTTP" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ApiGatewayV2Dashboard />, { wrapper: createWrapper() });
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
          { ApiId: "id1", Name: "alpha-api", ProtocolType: "HTTP" },
          { ApiId: "id2", Name: "beta-api", ProtocolType: "HTTP" },
        ],
        total: 2,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ApiGatewayV2Dashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("alpha-api")).toBeTruthy());

    const filterInput = screen.getByPlaceholderText("Find APIs by name");
    await user.type(filterInput, "beta");
    await waitFor(() => expect(screen.queryByText("alpha-api")).toBeNull());
  });
});
