// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

// ─── vi.hoisted mutable states ──────────────────────────

const deleteApiState = vi.hoisted(() => ({
  isPending: false,
  variables: null as string | null,
}));

const createDeployState = vi.hoisted(() => ({
  isPending: false,
}));

// ─── Mock hooks ─────────────────────────────────────────

const mockApis = vi.fn();
const mockDeleteApi = vi.fn();
const mockRoutes = vi.fn();
const mockIntegrations = vi.fn();
const mockStages = vi.fn();
const mockDeployments = vi.fn();
const mockCreateDeployment = vi.fn();
const mockWsRoutes = vi.fn();

vi.mock("../../hooks/useApiGatewayV2", () => ({
  useApiGatewayV2Apis: (...args: any[]) => mockApis(...args),
  useDeleteApiGatewayV2Api: () => ({
    mutateAsync: mockDeleteApi,
    get isPending() { return deleteApiState.isPending; },
    get variables() { return deleteApiState.variables; },
  }),
  useApiGatewayV2Routes: (...args: any[]) => mockRoutes(...args),
  useApiGatewayV2Integrations: (...args: any[]) => mockIntegrations(...args),
  useApiGatewayV2Stages: (...args: any[]) => mockStages(...args),
  useApiGatewayV2Deployments: (...args: any[]) => mockDeployments(...args),
  useCreateApiGatewayV2Deployment: (apiId: string) => ({
    mutateAsync: mockCreateDeployment,
    get isPending() { return createDeployState.isPending; },
  }),
  useApiGatewayV2WebSocketRoutes: (...args: any[]) => mockWsRoutes(...args),
}));

import { ApiGatewayV2Dashboard } from "./ApiGatewayV2Dashboard";

beforeEach(() => {
  vi.clearAllMocks();
  deleteApiState.isPending = false;
  deleteApiState.variables = null;
  createDeployState.isPending = false;

  mockApis.mockReturnValue({ data: { apis: [], total: 0 }, isLoading: false });
  mockRoutes.mockReturnValue({ data: { routes: [], total: 0 } });
  mockIntegrations.mockReturnValue({ data: { integrations: [], total: 0 } });
  mockStages.mockReturnValue({ data: { stages: [], total: 0 } });
  mockDeployments.mockReturnValue({ data: { deployments: [], total: 0 } });
  mockWsRoutes.mockReturnValue({ data: { routes: [], total: 0 } });
});

describe("ApiGatewayV2Dashboard — API list", () => {
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

  it("shows dash for missing endpoint and created date", () => {
    mockApis.mockReturnValue({
      data: { apis: [{ ApiId: "api-1", Name: "minimal", ProtocolType: "HTTP" }], total: 1 },
      isLoading: false,
    });
    render(<ApiGatewayV2Dashboard />, { wrapper: createWrapper() });
    const dashes = screen.getAllByText("-");
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  it("renders multiple APIs and filters by name", async () => {
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

  it("shows delete API loading state", () => {
    deleteApiState.isPending = true;
    deleteApiState.variables = "api-1";
    mockApis.mockReturnValue({
      data: { apis: [{ ApiId: "api-1", Name: "del-me", ProtocolType: "HTTP" }], total: 1 },
      isLoading: false,
    });
    render(<ApiGatewayV2Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("del-me")).toBeTruthy();
  });
});

describe("ApiGatewayV2Dashboard — detail tabs", () => {
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
      expect(screen.getByRole("tab", { name: /^Routes$/i })).toBeTruthy();
      expect(screen.getByRole("tab", { name: /Integrations/i })).toBeTruthy();
      expect(screen.getByRole("tab", { name: /Stages/i })).toBeTruthy();
      expect(screen.getByRole("tab", { name: /Deployments/i })).toBeTruthy();
      expect(screen.getByRole("tab", { name: /WebSocket Routes/i })).toBeTruthy();
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

  // ─── Routes tab ──────────────────────────────────────────

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

  it("shows no routes empty message", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ ApiId: "api-1", Name: "my-api", ProtocolType: "HTTP" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ApiGatewayV2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-api"));
    await waitFor(() => expect(screen.getByText(/No routes/i)).toBeTruthy());
  });

  it("shows dash for missing route target", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ ApiId: "api-1", Name: "my-api", ProtocolType: "HTTP" }], total: 1 },
      isLoading: false,
    });
    mockRoutes.mockReturnValue({
      data: { routes: [{ RouteId: "r-1", RouteKey: "GET /items", AuthorizationType: "NONE" }], total: 1 },
    });
    const user = userEvent.setup();
    render(<ApiGatewayV2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-api"));
    await waitFor(() => {
      const dashes = screen.getAllByText("-");
      expect(dashes.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("filters routes by key", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ ApiId: "api-1", Name: "my-api", ProtocolType: "HTTP" }], total: 1 },
      isLoading: false,
    });
    mockRoutes.mockReturnValue({
      data: {
        routes: [
          { RouteId: "r-1", RouteKey: "GET /items", AuthorizationType: "NONE", Target: "i-1" },
          { RouteId: "r-2", RouteKey: "POST /items", AuthorizationType: "NONE", Target: "i-2" },
        ],
        total: 2,
      },
    });
    const user = userEvent.setup();
    render(<ApiGatewayV2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-api"));
    await waitFor(() => expect(screen.getByText("GET /items")).toBeTruthy());

    const filterInput = screen.getByPlaceholderText("Find routes");
    await user.type(filterInput, "POST");
    await waitFor(() => expect(screen.queryByText("GET /items")).toBeNull());
  });

  // ─── Integrations tab ────────────────────────────────────

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

  it("shows empty integrations and filter", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ ApiId: "api-1", Name: "my-api", ProtocolType: "HTTP" }], total: 1 },
      isLoading: false,
    });
    mockIntegrations.mockReturnValue({
      data: {
        integrations: [
          { IntegrationId: "i-1", IntegrationType: "AWS_PROXY", IntegrationUri: "arn:...", IntegrationMethod: "POST" },
          { IntegrationId: "i-2", IntegrationType: "HTTP", IntegrationUri: "https://...", IntegrationMethod: "GET" },
        ],
        total: 2,
      },
    });
    const user = userEvent.setup();
    render(<ApiGatewayV2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-api"));
    await user.click(screen.getByRole("tab", { name: /Integrations/i }));
    await waitFor(() => expect(screen.getByText("AWS_PROXY")).toBeTruthy());
    const filterInput = screen.getByPlaceholderText("Find integrations");
    await user.type(filterInput, "HTTP");
    await waitFor(() => expect(screen.queryByText("AWS_PROXY")).toBeNull());
  });

  it("shows dash for missing integration fields", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ ApiId: "api-1", Name: "my-api", ProtocolType: "HTTP" }], total: 1 },
      isLoading: false,
    });
    mockIntegrations.mockReturnValue({
      data: { integrations: [{ IntegrationId: "i-1", IntegrationType: "AWS_PROXY" }], total: 1 },
    });
    const user = userEvent.setup();
    render(<ApiGatewayV2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-api"));
    await user.click(screen.getByRole("tab", { name: /Integrations/i }));
    await waitFor(() => {
      const dashes = screen.getAllByText("-");
      expect(dashes.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ─── Stages tab ──────────────────────────────────────────

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
    await user.click(screen.getByText("my-api"));
    await user.click(screen.getByRole("tab", { name: /Stages/i }));
    await waitFor(() => expect(screen.getByText("$default")).toBeTruthy());
  });

  it("shows dash for missing stage fields", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ ApiId: "api-1", Name: "my-api", ProtocolType: "HTTP" }], total: 1 },
      isLoading: false,
    });
    mockStages.mockReturnValue({
      data: { stages: [{ StageName: "minimal" }], total: 1 },
    });
    const user = userEvent.setup();
    render(<ApiGatewayV2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-api"));
    await user.click(screen.getByRole("tab", { name: /Stages/i }));
    await waitFor(() => {
      const dashes = screen.getAllByText("-");
      expect(dashes.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("filters stages by name", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ ApiId: "api-1", Name: "my-api", ProtocolType: "HTTP" }], total: 1 },
      isLoading: false,
    });
    mockStages.mockReturnValue({
      data: {
        stages: [
          { StageName: "prod", AutoDeploy: true, DeploymentId: "d-1" },
          { StageName: "dev", AutoDeploy: false, DeploymentId: "d-2" },
        ],
        total: 2,
      },
    });
    const user = userEvent.setup();
    render(<ApiGatewayV2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-api"));
    await user.click(screen.getByRole("tab", { name: /Stages/i }));
    await waitFor(() => expect(screen.getByText("prod")).toBeTruthy());

    const filterInput = screen.getByPlaceholderText("Find stages");
    await user.type(filterInput, "dev");
    await waitFor(() => expect(screen.queryByText("prod")).toBeNull());
  });

  // ─── Deployments tab ─────────────────────────────────────

  it("renders deployments in detail tab", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ ApiId: "api-1", Name: "my-api", ProtocolType: "HTTP" }], total: 1 },
      isLoading: false,
    });
    mockDeployments.mockReturnValue({
      data: { deployments: [{ DeploymentId: "d-1", DeploymentStatus: "SUCCEEDED", Description: "First deploy", CreatedDate: 1705000000 }], total: 1 },
    });
    const user = userEvent.setup();
    render(<ApiGatewayV2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-api"));
    await user.click(screen.getByRole("tab", { name: /Deployments/i }));
    await waitFor(() => expect(screen.getByText("d-1")).toBeTruthy());
  });

  it("shows deployments empty message and creates a deployment", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ ApiId: "api-1", Name: "my-api", ProtocolType: "HTTP" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ApiGatewayV2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-api"));
    await user.click(screen.getByRole("tab", { name: /Deployments/i }));
    await waitFor(() => expect(screen.getByText(/No deployments/i)).toBeTruthy());

    await clickButton(user, /Create deployment/i);
    await waitFor(() => {
      expect(mockCreateDeployment).toHaveBeenCalledWith({});
    });
  });

  it("shows dash for missing deployment fields", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ ApiId: "api-1", Name: "my-api", ProtocolType: "HTTP" }], total: 1 },
      isLoading: false,
    });
    mockDeployments.mockReturnValue({
      data: { deployments: [{ DeploymentId: "d-1" }], total: 1 },
    });
    const user = userEvent.setup();
    render(<ApiGatewayV2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-api"));
    await user.click(screen.getByRole("tab", { name: /Deployments/i }));
    await waitFor(() => {
      const dashes = screen.getAllByText("-");
      expect(dashes.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("filters deployments by ID", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ ApiId: "api-1", Name: "my-api", ProtocolType: "HTTP" }], total: 1 },
      isLoading: false,
    });
    mockDeployments.mockReturnValue({
      data: {
        deployments: [
          { DeploymentId: "deploy-alpha", DeploymentStatus: "SUCCEEDED", Description: "Alpha" },
          { DeploymentId: "deploy-beta", DeploymentStatus: "FAILED", Description: "Beta" },
        ],
        total: 2,
      },
    });
    const user = userEvent.setup();
    render(<ApiGatewayV2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-api"));
    await user.click(screen.getByRole("tab", { name: /Deployments/i }));
    await waitFor(() => expect(screen.getByText("deploy-alpha")).toBeTruthy());

    const filterInput = screen.getByPlaceholderText("Find deployments");
    await user.type(filterInput, "beta");
    await waitFor(() => expect(screen.queryByText("deploy-alpha")).toBeNull());
  });
});

describe("ApiGatewayV2Dashboard — WebSocket Routes tab", () => {
  it("shows resolved integration for a route", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ ApiId: "api-1", Name: "my-api", ProtocolType: "WEBSOCKET" }], total: 1 },
      isLoading: false,
    });
    mockWsRoutes.mockReturnValue({
      data: {
        routes: [
          {
            RouteId: "r-1",
            RouteKey: "$connect",
            target: "integrations/int-1",
            integrationId: "int-1",
            integration: {
              IntegrationId: "int-1",
              IntegrationType: "AWS_PROXY",
              IntegrationUri: "arn:aws:lambda:us-east-1:123:function:connect",
              IntegrationMethod: "POST",
            },
            isWellKnown: true,
            authorizationType: "NONE",
          },
        ],
        total: 1,
      },
    });
    const user = userEvent.setup();
    render(<ApiGatewayV2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-api"));
    await user.click(screen.getByRole("tab", { name: /WebSocket Routes/i }));
    await waitFor(() => expect(screen.getByText("$connect")).toBeTruthy());
    expect(screen.getByText("AWS_PROXY")).toBeTruthy();
    expect(mockWsRoutes).toHaveBeenCalledWith("api-1");
  });

  it("shows @connections limitation alert", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ ApiId: "api-1", Name: "my-api", ProtocolType: "WEBSOCKET" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ApiGatewayV2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-api"));
    await user.click(screen.getByRole("tab", { name: /WebSocket Routes/i }));
    await waitFor(() => expect(screen.getByText(/@connections/i)).toBeTruthy());
  });

  it("shows empty message when no WebSocket routes", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ ApiId: "api-1", Name: "my-api", ProtocolType: "WEBSOCKET" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ApiGatewayV2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-api"));
    await user.click(screen.getByRole("tab", { name: /WebSocket Routes/i }));
    await waitFor(() => expect(screen.getByText(/No WebSocket routes/i)).toBeTruthy());
  });

  it("shows dash for WS route missing integration", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ ApiId: "api-1", Name: "my-api", ProtocolType: "WEBSOCKET" }], total: 1 },
      isLoading: false,
    });
    mockWsRoutes.mockReturnValue({
      data: {
        routes: [{ RouteId: "r-1", RouteKey: "$default", isWellKnown: false }],
        total: 1,
      },
    });
    const user = userEvent.setup();
    render(<ApiGatewayV2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-api"));
    await user.click(screen.getByRole("tab", { name: /WebSocket Routes/i }));
    await waitFor(() => {
      const dashes = screen.getAllByText("-");
      expect(dashes.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("shows No for WS route not well-known", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ ApiId: "api-1", Name: "my-api", ProtocolType: "WEBSOCKET" }], total: 1 },
      isLoading: false,
    });
    mockWsRoutes.mockReturnValue({
      data: {
        routes: [{ RouteId: "r-1", RouteKey: "sendmessage", isWellKnown: false, authorizationType: "CUSTOM" }],
        total: 1,
      },
    });
    const user = userEvent.setup();
    render(<ApiGatewayV2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-api"));
    await user.click(screen.getByRole("tab", { name: /WebSocket Routes/i }));
    await waitFor(() => expect(screen.getByText("No")).toBeTruthy());
  });

  it("defaults WS route auth to NONE when missing", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ ApiId: "api-1", Name: "my-api", ProtocolType: "WEBSOCKET" }], total: 1 },
      isLoading: false,
    });
    mockWsRoutes.mockReturnValue({
      data: {
        routes: [{ RouteId: "r-1", RouteKey: "$disconnect", isWellKnown: true }],
        total: 1,
      },
    });
    const user = userEvent.setup();
    render(<ApiGatewayV2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-api"));
    await user.click(screen.getByRole("tab", { name: /WebSocket Routes/i }));
    await waitFor(() => expect(screen.getByText("NONE")).toBeTruthy());
  });
});

describe("ApiGatewayV2Dashboard — edge cases", () => {
  it("defaults protocol to HTTP when missing", () => {
    mockApis.mockReturnValue({
      data: { apis: [{ ApiId: "api-1", Name: "just-http" }], total: 1 },
      isLoading: false,
    });
    render(<ApiGatewayV2Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("just-http")).toBeTruthy();
    expect(screen.getByText("HTTP")).toBeTruthy();
  });

  it("shows Yes for stage AutoDeploy", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ ApiId: "api-1", Name: "my-api", ProtocolType: "HTTP" }], total: 1 },
      isLoading: false,
    });
    mockStages.mockReturnValue({
      data: { stages: [{ StageName: "auto", AutoDeploy: true }], total: 1 },
    });
    const user = userEvent.setup();
    render(<ApiGatewayV2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-api"));
    await user.click(screen.getByRole("tab", { name: /Stages/i }));
    await waitFor(() => expect(screen.getByText("Yes")).toBeTruthy());
  });

  it("shows No for stage AutoDeploy when false", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ ApiId: "api-1", Name: "my-api", ProtocolType: "HTTP" }], total: 1 },
      isLoading: false,
    });
    mockStages.mockReturnValue({
      data: { stages: [{ StageName: "manual", AutoDeploy: false }], total: 1 },
    });
    const user = userEvent.setup();
    render(<ApiGatewayV2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-api"));
    await user.click(screen.getByRole("tab", { name: /Stages/i }));
    await waitFor(() => expect(screen.getByText("No")).toBeTruthy());
  });

  it("shows delete API not-loading when isPending but different variable", () => {
    deleteApiState.isPending = true;
    deleteApiState.variables = "other-id";
    mockApis.mockReturnValue({
      data: { apis: [{ ApiId: "api-1", Name: "my-api", ProtocolType: "HTTP" }], total: 1 },
      isLoading: false,
    });
    render(<ApiGatewayV2Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-api")).toBeTruthy();
  });
});

describe("ApiGatewayV2Dashboard — data edge cases", () => {
  it("handles undefined routes data", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ ApiId: "api-1", Name: "my-api", ProtocolType: "HTTP" }], total: 1 },
      isLoading: false,
    });
    mockRoutes.mockReturnValue({ data: undefined });
    const user = userEvent.setup();
    render(<ApiGatewayV2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-api"));
    await waitFor(() => expect(screen.getByText(/No routes/i)).toBeTruthy());
  });

  it("handles null routes data", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ ApiId: "api-1", Name: "my-api", ProtocolType: "HTTP" }], total: 1 },
      isLoading: false,
    });
    mockRoutes.mockReturnValue({ data: { routes: null } });
    const user = userEvent.setup();
    render(<ApiGatewayV2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-api"));
    await waitFor(() => expect(screen.getByText(/No routes/i)).toBeTruthy());
  });

  it("handles undefined integrations data", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ ApiId: "api-1", Name: "my-api", ProtocolType: "HTTP" }], total: 1 },
      isLoading: false,
    });
    mockIntegrations.mockReturnValue({ data: undefined });
    const user = userEvent.setup();
    render(<ApiGatewayV2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-api"));
    await user.click(screen.getByRole("tab", { name: /Integrations/i }));
    await waitFor(() => expect(screen.getByText(/No integrations/i)).toBeTruthy());
  });

  it("handles undefined stages data", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ ApiId: "api-1", Name: "my-api", ProtocolType: "HTTP" }], total: 1 },
      isLoading: false,
    });
    mockStages.mockReturnValue({ data: undefined });
    const user = userEvent.setup();
    render(<ApiGatewayV2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-api"));
    await user.click(screen.getByRole("tab", { name: /Stages/i }));
    await waitFor(() => expect(screen.getByText(/No stages/i)).toBeTruthy());
  });

  it("handles undefined deployments data", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ ApiId: "api-1", Name: "my-api", ProtocolType: "HTTP" }], total: 1 },
      isLoading: false,
    });
    mockDeployments.mockReturnValue({ data: undefined });
    const user = userEvent.setup();
    render(<ApiGatewayV2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-api"));
    await user.click(screen.getByRole("tab", { name: /Deployments/i }));
    await waitFor(() => expect(screen.getByText(/No deployments/i)).toBeTruthy());
  });

  it("handles undefined WebSocket routes data", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ ApiId: "api-1", Name: "my-api", ProtocolType: "WEBSOCKET" }], total: 1 },
      isLoading: false,
    });
    mockWsRoutes.mockReturnValue({ data: undefined });
    const user = userEvent.setup();
    render(<ApiGatewayV2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-api"));
    await user.click(screen.getByRole("tab", { name: /WebSocket Routes/i }));
    await waitFor(() => expect(screen.getByText(/No WebSocket routes/i)).toBeTruthy());
  });

  it("shows create deployment loading state", async () => {
    createDeployState.isPending = true;
    mockApis.mockReturnValue({
      data: { apis: [{ ApiId: "api-1", Name: "my-api", ProtocolType: "HTTP" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ApiGatewayV2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-api"));
    await user.click(screen.getByRole("tab", { name: /Deployments/i }));
    await waitFor(() => expect(screen.getByText(/Deployments in/)).toBeTruthy());
  });

  // ─── Route auth/target fallbacks ────────────────────────

  it("defaults route auth to NONE when AuthorizationType is missing", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ ApiId: "api-1", Name: "my-api", ProtocolType: "HTTP" }], total: 1 },
      isLoading: false,
    });
    mockRoutes.mockReturnValue({
      data: { routes: [{ RouteId: "r-1", RouteKey: "ANY /path" }], total: 1 },
    });
    const user = userEvent.setup();
    render(<ApiGatewayV2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-api"));
    await waitFor(() => expect(screen.getByText("ANY /path")).toBeTruthy());
    // Route column shows auth defaulted to NONE and target to "-"
    expect(screen.getByText("NONE")).toBeTruthy();
    expect(screen.getByText("-")).toBeTruthy();
  });

  // ─── Integration with all fields present ─────────────────

  it("renders integration with all fields including method", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ ApiId: "api-1", Name: "my-api", ProtocolType: "HTTP" }], total: 1 },
      isLoading: false,
    });
    mockIntegrations.mockReturnValue({
      data: { integrations: [{ IntegrationId: "i-full", IntegrationType: "HTTP_PROXY", IntegrationUri: "https://example.com", IntegrationMethod: "POST" }], total: 1 },
    });
    const user = userEvent.setup();
    render(<ApiGatewayV2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-api"));
    await user.click(screen.getByRole("tab", { name: /Integrations/i }));
    await waitFor(() => {
      expect(screen.getByText("HTTP_PROXY")).toBeTruthy();
      expect(screen.getByText("https://example.com")).toBeTruthy();
      expect(screen.getByText("POST")).toBeTruthy();
    });
  });

  // ─── Back button click ──────────────────────────────────

  it("clicks Back to APIs and returns to list view", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ ApiId: "api-1", Name: "my-api", ProtocolType: "HTTP" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ApiGatewayV2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-api"));
    await waitFor(() => expect(screen.getByText(/Back to APIs/i)).toBeTruthy());

    await user.click(screen.getByText(/Back to APIs/i));
    await waitFor(() => {
      expect(screen.getByText(/API Gateway V2 APIs/i)).toBeTruthy();
      expect(screen.queryByText(/Back to APIs/i)).toBeNull();
    });
  });

  // ─── Deployment with all fields missing ─────────────────

  it("shows dash for deployment missing status/description/created", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ ApiId: "api-1", Name: "my-api", ProtocolType: "HTTP" }], total: 1 },
      isLoading: false,
    });
    mockDeployments.mockReturnValue({
      data: { deployments: [{ DeploymentId: "d-bare" }], total: 1 },
    });
    const user = userEvent.setup();
    render(<ApiGatewayV2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-api"));
    await user.click(screen.getByRole("tab", { name: /Deployments/i }));
    await waitFor(() => {
      expect(screen.getByText("d-bare")).toBeTruthy();
      const dashes = screen.getAllByText("-");
      expect(dashes.length).toBeGreaterThanOrEqual(3);
    });
  });

  // ─── API with WEBSOCKET protocol ────────────────────────

  it("renders API with WEBSOCKET protocol in list", () => {
    mockApis.mockReturnValue({
      data: {
        apis: [{ ApiId: "api-1", Name: "ws-api", ProtocolType: "WEBSOCKET", ApiEndpoint: "wss://abc.execute-api.amazonaws.com", CreatedDate: 1705000000 }],
        total: 1,
      },
      isLoading: false,
    });
    render(<ApiGatewayV2Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("ws-api")).toBeTruthy();
    expect(screen.getByText("WEBSOCKET")).toBeTruthy();
  });

});
