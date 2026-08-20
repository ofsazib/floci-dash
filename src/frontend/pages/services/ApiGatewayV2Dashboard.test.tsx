// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";

/** Dispatch Escape to all Cloudscape modal dialogs (fires onDismiss). */
function dismissModalWithEscape() {
  document.querySelectorAll('[class*="awsui_dialog"]').forEach((dialog) => {
    fireEvent.keyDown(dialog as HTMLElement, { keyCode: 27 });
  });
}

/** Assert the modal with the given header is hidden (Cloudscape uses display:none). */
function expectModalHidden(headerText: string) {
  const headers = screen.getAllByText(headerText);
  const dialog = headers.find((h) => h.closest('[role="dialog"]'))?.closest('[role="dialog"]') as HTMLElement;
  expect(dialog).toBeTruthy();
  expect(dialog.className).toContain("hidden");
}
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
const mockAuthorizers = vi.fn();
const mockCreateAuthorizer = vi.fn();
const mockUpdateAuthorizer = vi.fn();
const mockDeleteAuthorizer = vi.fn();
const mockModels = vi.fn();
const mockCreateModel = vi.fn();
const mockUpdateModel = vi.fn();
const mockDeleteModel = vi.fn();
const mockUpdateRoute = vi.fn();
const mockUpdateIntegration = vi.fn();
const mockUpdateStage = vi.fn();
const mockUpdateDeployment = vi.fn();
const mockTags = vi.fn();
const mockTagResource = vi.fn();
const mockUntagResource = vi.fn();
const mockRouteResponses = vi.fn();
const mockCreateRouteResponse = vi.fn();
const mockDeleteRouteResponse = vi.fn();
const mockIntegrationResponses = vi.fn();
const mockCreateIntegrationResponse = vi.fn();
const mockDeleteIntegrationResponse = vi.fn();

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
  useApiGatewayV2Authorizers: (...args: any[]) => mockAuthorizers(...args),
  useCreateApiGatewayV2Authorizer: () => ({ mutate: mockCreateAuthorizer, isPending: false }),
  useUpdateApiGatewayV2Authorizer: () => ({ mutate: mockUpdateAuthorizer, isPending: false }),
  useDeleteApiGatewayV2Authorizer: () => ({ mutateAsync: mockDeleteAuthorizer, isPending: false }),
  useApiGatewayV2Models: (...args: any[]) => mockModels(...args),
  useCreateApiGatewayV2Model: () => ({ mutate: mockCreateModel, isPending: false }),
  useUpdateApiGatewayV2Model: () => ({ mutate: mockUpdateModel, isPending: false }),
  useDeleteApiGatewayV2Model: () => ({ mutateAsync: mockDeleteModel, isPending: false }),
  useUpdateApiGatewayV2Route: () => ({ mutate: mockUpdateRoute, isPending: false }),
  useUpdateApiGatewayV2Integration: () => ({ mutate: mockUpdateIntegration, isPending: false }),
  useUpdateApiGatewayV2Stage: () => ({ mutate: mockUpdateStage, isPending: false }),
  useUpdateApiGatewayV2Deployment: () => ({ mutate: mockUpdateDeployment, isPending: false }),
  useApiGatewayV2Tags: (...args: any[]) => mockTags(...args),
  useTagApiGatewayV2Resource: () => ({ mutate: mockTagResource, isPending: false }),
  useUntagApiGatewayV2Resource: () => ({ mutate: mockUntagResource, isPending: false }),
  useApiGatewayV2RouteResponses: (...args: any[]) => mockRouteResponses(...args),
  useCreateApiGatewayV2RouteResponse: () => ({ mutate: mockCreateRouteResponse, isPending: false }),
  useDeleteApiGatewayV2RouteResponse: () => ({ mutateAsync: mockDeleteRouteResponse, isPending: false }),
  useApiGatewayV2IntegrationResponses: (...args: any[]) => mockIntegrationResponses(...args),
  useCreateApiGatewayV2IntegrationResponse: () => ({ mutate: mockCreateIntegrationResponse, isPending: false }),
  useDeleteApiGatewayV2IntegrationResponse: () => ({ mutateAsync: mockDeleteIntegrationResponse, isPending: false }),
}));

vi.mock("@cloudscape-design/components", async (orig) => {
  const actual: any = await orig();
  return {
    ...actual,
    Select: ({ selectedOption, onChange, options }: any) => (
      <div data-testid="mock-select">
        {options?.map((o: any) => (
          <button key={o.value} data-testid={`opt-${o.value}`} onClick={() => onChange?.({ detail: { selectedOption: o } })}>
            {o.label}
          </button>
        ))}
      </div>
    ),
  };
});

import { ApiGatewayV2Dashboard } from "./ApiGatewayV2Dashboard";

const toastMock = vi.fn();
vi.mock("../../components/Toast", () => ({
  useToast: () => ({ showToast: toastMock }),
}));

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
  mockAuthorizers.mockReturnValue({ data: { authorizers: [], total: 0 } });
  mockModels.mockReturnValue({ data: { models: [], total: 0 } });
  mockTags.mockReturnValue({ data: { tags: {} } });
  mockRouteResponses.mockReturnValue({ data: { routeResponses: [], total: 0 } });
  mockIntegrationResponses.mockReturnValue({ data: { integrationResponses: [], total: 0 } });
  mockCreateAuthorizer.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
  mockUpdateAuthorizer.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
  mockDeleteAuthorizer.mockResolvedValue({});
  mockCreateModel.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
  mockUpdateModel.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
  mockDeleteModel.mockResolvedValue({});
  mockUpdateRoute.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
  mockUpdateIntegration.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
  mockUpdateStage.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
  mockUpdateDeployment.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
  mockTagResource.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
  mockUntagResource.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
  mockCreateRouteResponse.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
  mockDeleteRouteResponse.mockResolvedValue({});
  mockCreateIntegrationResponse.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
  mockDeleteIntegrationResponse.mockResolvedValue({});
});

/** Render the dashboard, click the first API, wait for the detail tabs. */
async function openApi(user: ReturnType<typeof userEvent.setup>) {
  render(<ApiGatewayV2Dashboard />, { wrapper: createWrapper() });
  await waitFor(() => expect(screen.getByText("my-api")).toBeTruthy());
  await user.click(screen.getByText("my-api"));
  await waitFor(() => expect(screen.getByRole("tab", { name: /Authorizers/i })).toBeTruthy());
}

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
    await waitFor(() => expect(screen.getAllByText("AWS_PROXY").length).toBeGreaterThan(0));
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
    await waitFor(() => expect(screen.getAllByText("AWS_PROXY").length).toBeGreaterThan(0));
    const filterInput = screen.getByPlaceholderText("Find integrations");
    await user.type(filterInput, "HTTP");
    await waitFor(() => expect(screen.getAllByText("AWS_PROXY")).toHaveLength(1));
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
    expect(screen.getAllByText("NONE").length).toBeGreaterThan(0);
    expect(screen.getAllByText("-").length).toBeGreaterThan(0);
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
      expect(screen.getAllByText("HTTP_PROXY").length).toBeGreaterThanOrEqual(1);
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

  // ─── API list: data.apis undefined ──────────────────────

  it("handles data with undefined apis array", () => {
    mockApis.mockReturnValue({ data: { total: 0 } as any, isLoading: false });
    render(<ApiGatewayV2Dashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No APIs/i)).toBeTruthy();
  });

  // ─── Routes tab: explicit JWT auth ──────────────────────

  it("shows custom AuthorizationType for route", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ ApiId: "api-1", Name: "my-api", ProtocolType: "HTTP" }], total: 1 },
      isLoading: false,
    });
    mockRoutes.mockReturnValue({
      data: { routes: [{ RouteId: "r-1", RouteKey: "GET /secure", AuthorizationType: "JWT", Target: "integ-1" }], total: 1 },
    });
    const user = userEvent.setup();
    render(<ApiGatewayV2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-api"));
    await waitFor(() => expect(screen.getAllByText("JWT").length).toBeGreaterThanOrEqual(1));
  });

  // ─── Integrations tab: filter to 0 results ──────────────

  it("filters integrations to 0 results", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ ApiId: "api-1", Name: "my-api", ProtocolType: "HTTP" }], total: 1 },
      isLoading: false,
    });
    mockIntegrations.mockReturnValue({
      data: { integrations: [{ IntegrationId: "i-1", IntegrationType: "AWS_PROXY", IntegrationUri: "arn:...", IntegrationMethod: "POST" }], total: 1 },
    });
    const user = userEvent.setup();
    render(<ApiGatewayV2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-api"));
    await user.click(screen.getByRole("tab", { name: /Integrations/i }));
    await waitFor(() => expect(screen.getAllByText("AWS_PROXY").length).toBeGreaterThan(0));

    const filter = screen.getByPlaceholderText("Find integrations");
    await user.type(filter, "ZZZ_NO_MATCH");
    await waitFor(() => expect(screen.getAllByText("AWS_PROXY")).toHaveLength(1));
  });

  // ─── Deployments: FAILED status + filter to 0 ───────────

  it("shows FAILED deployment status", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ ApiId: "api-1", Name: "my-api", ProtocolType: "HTTP" }], total: 1 },
      isLoading: false,
    });
    mockDeployments.mockReturnValue({
      data: { deployments: [{ DeploymentId: "d-fail", DeploymentStatus: "FAILED", Description: "Failed deploy" }], total: 1 },
    });
    const user = userEvent.setup();
    render(<ApiGatewayV2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-api"));
    await user.click(screen.getByRole("tab", { name: /Deployments/i }));
    await waitFor(() => {
      expect(screen.getByText("d-fail")).toBeTruthy();
      expect(screen.getByText("FAILED")).toBeTruthy();
    });
  });

  it("filters deployments to 0 results", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ ApiId: "api-1", Name: "my-api", ProtocolType: "HTTP" }], total: 1 },
      isLoading: false,
    });
    mockDeployments.mockReturnValue({
      data: { deployments: [{ DeploymentId: "deploy-1", DeploymentStatus: "SUCCEEDED" }], total: 1 },
    });
    const user = userEvent.setup();
    render(<ApiGatewayV2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-api"));
    await user.click(screen.getByRole("tab", { name: /Deployments/i }));
    await waitFor(() => expect(screen.getByText("deploy-1")).toBeTruthy());

    const filter = screen.getByPlaceholderText("Find deployments");
    await user.type(filter, "ZZZ");
    await waitFor(() => expect(screen.queryByText("deploy-1")).toBeNull());
  });

  // ─── WS Routes: integration with null IntegrationUri ────

  it("shows dash for WS route integration with null URI", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ ApiId: "api-1", Name: "my-api", ProtocolType: "WEBSOCKET" }], total: 1 },
      isLoading: false,
    });
    mockWsRoutes.mockReturnValue({
      data: {
        routes: [{ RouteId: "r-1", RouteKey: "$default", isWellKnown: true, integration: { IntegrationType: "MOCK", IntegrationUri: null }, authorizationType: "CUSTOM" }],
        total: 1,
      },
    });
    const user = userEvent.setup();
    render(<ApiGatewayV2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-api"));
    await user.click(screen.getByRole("tab", { name: /WebSocket Routes/i }));
    await waitFor(() => {
      expect(screen.getByText("MOCK")).toBeTruthy();
      expect(screen.getByText("CUSTOM")).toBeTruthy();
      const dashes = screen.getAllByText("-");
      expect(dashes.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ─── WS Routes: filter by key ───────────────────────────

  it("filters WebSocket routes by key", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ ApiId: "api-1", Name: "my-api", ProtocolType: "WEBSOCKET" }], total: 1 },
      isLoading: false,
    });
    mockWsRoutes.mockReturnValue({
      data: {
        routes: [
          { RouteId: "r-1", RouteKey: "$connect", isWellKnown: true },
          { RouteId: "r-2", RouteKey: "sendmessage", isWellKnown: false },
        ],
        total: 2,
      },
    });
    const user = userEvent.setup();
    render(<ApiGatewayV2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-api"));
    await user.click(screen.getByRole("tab", { name: /WebSocket Routes/i }));
    await waitFor(() => expect(screen.getByText("$connect")).toBeTruthy());

    const filter = screen.getByPlaceholderText("Find WebSocket routes");
    await user.type(filter, "send");
    await waitFor(() => expect(screen.queryByText("$connect")).toBeNull());
  });

});

describe("ApiGatewayV2Dashboard — G.96 authorizers, models, responses, tags", () => {
  beforeEach(() => {
    mockApis.mockReturnValue({
      data: { apis: [{ ApiId: "api-1", Name: "my-api", ProtocolType: "HTTP" }], total: 1 },
      isLoading: false,
    });
    toastMock.mockClear();
  });

  it("lists authorizers and creates one via modal", async () => {
    const user = userEvent.setup();
    mockAuthorizers.mockReturnValue({
      data: { authorizers: [{ AuthorizerId: "a-1", Name: "my-auth", AuthorizerType: "REQUEST", AuthorizerUri: "arn:lambda" }], total: 1 },
    });
    await openApi(user);
    await user.click(screen.getByRole("tab", { name: /Authorizers/i }));
    await waitFor(() => expect(screen.getByText("my-auth")).toBeTruthy());
    expect(screen.getAllByText("REQUEST").length).toBeGreaterThan(0);

    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create authorizer")).toBeTruthy());
    const dlg = screen.getByText("Create authorizer").closest('[role="dialog"]') as HTMLElement;
    await user.type(dlg.querySelector("input") as HTMLElement, "auth-2");
    await clickButton(user, /Create/i, { last: true });
    await waitFor(() =>
      expect(mockCreateAuthorizer).toHaveBeenCalledWith(
        { name: "auth-2", authorizerType: "REQUEST", identitySource: undefined, authorizerUri: undefined },
        expect.any(Object),
      ),
    );
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("success", 'Authorizer "auth-2" created'));
  });

  it("creates an authorizer with identity source and uri, and shows error fallback", async () => {
    const user = userEvent.setup();
    mockCreateAuthorizer.mockImplementationOnce((_b: any, opts: any) => opts?.onError?.("boom"));
    await openApi(user);
    await user.click(screen.getByRole("tab", { name: /Authorizers/i }));
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create authorizer")).toBeTruthy());
    const dlg = screen.getByText("Create authorizer").closest('[role="dialog"]') as HTMLElement;
    const inputs = dlg.querySelectorAll("input");
    await user.type(inputs[0], "auth-3");
    await user.type(inputs[1], "$request.header.Authorization");
    await user.type(inputs[2], "arn:lambda:fn");
    await clickButton(user, /Create/i, { last: true });
    await waitFor(() =>
      expect(mockCreateAuthorizer).toHaveBeenCalledWith(
        { name: "auth-3", authorizerType: "REQUEST", identitySource: ["$request.header.Authorization"], authorizerUri: "arn:lambda:fn" },
        expect.any(Object),
      ),
    );
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("error", "Failed to create authorizer"));
  });

  it("edits and deletes an authorizer", async () => {
    const user = userEvent.setup();
    mockAuthorizers.mockReturnValue({
      data: { authorizers: [{ AuthorizerId: "a-1", Name: "my-auth", AuthorizerType: "REQUEST", AuthorizerUri: "arn:lambda" }], total: 1 },
    });
    mockUpdateAuthorizer.mockImplementationOnce((_b: any, opts: any) => opts?.onError?.("boom"));
    mockDeleteAuthorizer.mockRejectedValueOnce("boom");
    await openApi(user);
    await user.click(screen.getByRole("tab", { name: /Authorizers/i }));
    await waitFor(() => expect(screen.getByText("my-auth")).toBeTruthy());
    await clickButton(user, /Edit/i);
    await waitFor(() => expect(screen.getByText("Edit authorizer")).toBeTruthy());
    await clickButton(user, /Save/i, { last: true });
    await waitFor(() =>
      expect(mockUpdateAuthorizer).toHaveBeenCalledWith(
        expect.objectContaining({ authorizerId: "a-1", name: "my-auth", authorizerType: "REQUEST" }),
        expect.any(Object),
      ),
    );
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("error", "Failed to update authorizer"));
    // Successful update on reopen
    await clickButton(user, /Edit/i);
    await waitFor(() => expect(screen.getByText("Edit authorizer")).toBeTruthy());
    await clickButton(user, /Save/i, { last: true });
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("success", "Authorizer updated"));
    // Delete with error then success
    const del = screen.getByRole("button", { name: /Delete my-auth/i });
    await user.click(del);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("error", "Failed to delete authorizer"));
    await user.click(screen.getByRole("button", { name: /Delete my-auth/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() =>
      expect(mockDeleteAuthorizer).toHaveBeenCalledWith("a-1"),
    );
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("success", 'Authorizer "my-auth" deleted'));
  });

  it("filters authorizers by name", async () => {
    const user = userEvent.setup();
    mockAuthorizers.mockReturnValue({
      data: { authorizers: [{ AuthorizerId: "a-1", Name: "alpha", AuthorizerType: "REQUEST" }, { AuthorizerId: "a-2", Name: "beta", AuthorizerType: "JWT" }], total: 2 },
    });
    await openApi(user);
    await user.click(screen.getByRole("tab", { name: /Authorizers/i }));
    await waitFor(() => expect(screen.getByText("alpha")).toBeTruthy());
    const filter = screen.getByPlaceholderText("Find authorizers");
    await user.type(filter, "beta");
    await waitFor(() => expect(screen.queryByText("alpha")).toBeNull());
    expect(screen.getByText("beta")).toBeTruthy();
  });

  it("creates, edits, and deletes models", async () => {
    const user = userEvent.setup();
    mockModels.mockReturnValue({
      data: { models: [{ ModelId: "m-1", Name: "pet", ContentType: "application/json" }], total: 1 },
    });
    mockCreateModel.mockImplementationOnce((_b: any, opts: any) => opts?.onError?.("boom"));
    mockUpdateModel.mockImplementationOnce((_b: any, opts: any) => opts?.onError?.("boom"));
    mockDeleteModel.mockRejectedValueOnce("boom");
    await openApi(user);
    await user.click(screen.getByRole("tab", { name: /Models/i }));
    await waitFor(() => expect(screen.getByText("pet")).toBeTruthy());

    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create model")).toBeTruthy());
    const dlg = screen.getByText("Create model").closest('[role="dialog"]') as HTMLElement;
    const inputs = dlg.querySelectorAll("input");
    await user.type(inputs[0], "dog");
    await user.clear(inputs[1]);
    await user.type(inputs[1], "application/json");
    fireEvent.change(dlg.querySelector("textarea") as HTMLElement, { target: { value: '{"type":"object"}' } });
    await clickButton(user, /Create/i, { last: true });
    await waitFor(() =>
      expect(mockCreateModel).toHaveBeenCalledWith(
        { name: "dog", contentType: "application/json", schema: '{"type":"object"}' },
        expect.any(Object),
      ),
    );
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("error", "Failed to create model"));

    await clickButton(user, /Edit/i);
    await waitFor(() => expect(screen.getByText("Edit model")).toBeTruthy());
    await clickButton(user, /Save/i, { last: true });
    await waitFor(() =>
      expect(mockUpdateModel).toHaveBeenCalledWith(
        expect.objectContaining({ modelId: "m-1", name: "pet" }),
        expect.any(Object),
      ),
    );
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("error", "Failed to update model"));

    const del = screen.getByRole("button", { name: /Delete pet/i });
    await user.click(del);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("error", "Failed to delete model"));
    await user.click(screen.getByRole("button", { name: /Delete pet/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteModel).toHaveBeenCalledWith("m-1"));
  });

  it("manages route responses from the routes tab", async () => {
    const user = userEvent.setup();
    mockRoutes.mockReturnValue({
      data: { routes: [{ RouteId: "r-1", RouteKey: "GET /items", AuthorizationType: "NONE", Target: "integrations/i-1" }], total: 1 },
    });
    mockRouteResponses.mockReturnValue({
      data: { routeResponses: [{ RouteResponseId: "rr-1", RouteResponseKey: "200" }], total: 1 },
    });
    mockDeleteRouteResponse.mockRejectedValueOnce("boom");
    await openApi(user);
    await user.click(screen.getByRole("tab", { name: /^Routes$/i }));
    await waitFor(() => expect(screen.getByText("GET /items")).toBeTruthy());

    await clickButton(user, /Responses/i);
    await waitFor(() => expect(screen.getByText("Route responses")).toBeTruthy());
    expect(screen.getByText("200")).toBeTruthy();
    // Create a response
    await clickButton(user, /Create response/i);
    await waitFor(() => expect(screen.getByText("Create route response")).toBeTruthy());
    const dlg = screen.getByText("Create route response").closest('[role="dialog"]') as HTMLElement;
    await user.type(dlg.querySelector("input") as HTMLElement, "default");
    await clickButton(user, /Create/i, { last: true });
    await waitFor(() =>
      expect(mockCreateRouteResponse).toHaveBeenCalledWith(
        { routeResponseKey: "default" },
        expect.any(Object),
      ),
    );
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("success", "Route response created"));
    // Delete with error
    const del = screen.getByRole("button", { name: /Delete 200/i });
    await user.click(del);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("error", "Failed to delete route response"));
    // Close the container
    await clickButton(user, /Close/i);
    await waitFor(() => expect(screen.queryByText("Route responses")).toBeNull());
  });

  it("edits a route from the routes tab", async () => {
    const user = userEvent.setup();
    mockRoutes.mockReturnValue({
      data: { routes: [{ RouteId: "r-1", RouteKey: "GET /items", AuthorizationType: "NONE", Target: "integrations/i-1" }], total: 1 },
    });
    mockUpdateRoute.mockImplementationOnce((_b: any, opts: any) => opts?.onError?.("boom"));
    await openApi(user);
    await user.click(screen.getByRole("tab", { name: /^Routes$/i }));
    await waitFor(() => expect(screen.getByText("GET /items")).toBeTruthy());
    await clickButton(user, /Edit/i);
    await waitFor(() => expect(screen.getByText("Edit route")).toBeTruthy());
    const dlg = screen.getByText("Edit route").closest('[role="dialog"]') as HTMLElement;
    const inputs = dlg.querySelectorAll("input");
    await user.clear(inputs[0]);
    await user.type(inputs[0], "GET /pets");
    await user.clear(inputs[1]);
    await user.type(inputs[1], "integrations/i-9");
    await clickButton(user, /Save/i, { last: true });
    await waitFor(() =>
      expect(mockUpdateRoute).toHaveBeenCalledWith(
        expect.objectContaining({ routeId: "r-1", routeKey: "GET /pets", target: "integrations/i-9" }),
        expect.any(Object),
      ),
    );
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("error", "Failed to update route"));
  });

  it("manages integration responses and edits an integration", async () => {
    const user = userEvent.setup();
    mockIntegrations.mockReturnValue({
      data: { integrations: [{ IntegrationId: "i-1", IntegrationType: "AWS_PROXY", IntegrationUri: "https://x", IntegrationMethod: "POST" }], total: 1 },
    });
    mockIntegrationResponses.mockReturnValue({
      data: { integrationResponses: [{ IntegrationResponseId: "ir-1", IntegrationResponseKey: "200" }], total: 1 },
    });
    mockUpdateIntegration.mockImplementationOnce((_b: any, opts: any) => opts?.onError?.("boom"));
    mockCreateIntegrationResponse.mockImplementationOnce((_b: any, opts: any) => opts?.onError?.("boom"));
    mockDeleteIntegrationResponse.mockRejectedValueOnce("boom");
    await openApi(user);
    await user.click(screen.getByRole("tab", { name: /Integrations/i }));
    await waitFor(() => expect(screen.getAllByText("AWS_PROXY").length).toBeGreaterThan(0));

    await clickButton(user, /Responses/i);
    await waitFor(() => expect(screen.getByText("Integration responses")).toBeTruthy());
    await clickButton(user, /Create response/i);
    await waitFor(() => expect(screen.getByText("Create integration response")).toBeTruthy());
    const dlg = screen.getByText("Create integration response").closest('[role="dialog"]') as HTMLElement;
    await user.type(dlg.querySelector("input") as HTMLElement, "default");
    await clickButton(user, /Create/i, { last: true });
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("error", "Failed to create integration response"));
    const del = screen.getByRole("button", { name: /Delete 200/i });
    await user.click(del);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("error", "Failed to delete integration response"));
    await clickButton(user, /Close/i);
    await waitFor(() => expect(screen.queryByText("Integration responses")).toBeNull());

    // Edit integration
    await clickButton(user, /Edit/i);
    await waitFor(() => expect(screen.getByText("Edit integration")).toBeTruthy());
    const editDlg = screen.getByText("Edit integration").closest('[role="dialog"]') as HTMLElement;
    const inputs = editDlg.querySelectorAll("input");
    await user.clear(inputs[0]);
    await user.type(inputs[0], "https://y");
    await user.clear(inputs[1]);
    await user.type(inputs[1], "GET");
    await clickButton(user, /Save/i, { last: true });
    await waitFor(() =>
      expect(mockUpdateIntegration).toHaveBeenCalledWith(
        expect.objectContaining({ integrationId: "i-1", integrationType: "AWS_PROXY", integrationUri: "https://y", integrationMethod: "GET" }),
        expect.any(Object),
      ),
    );
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("error", "Failed to update integration"));
  });

  it("edits a stage and a deployment", async () => {
    const user = userEvent.setup();
    mockStages.mockReturnValue({
      data: { stages: [{ StageName: "prod", AutoDeploy: true, DeploymentId: "d-1", CreatedDate: 1705000000 }], total: 1 },
    });
    mockDeployments.mockReturnValue({
      data: { deployments: [{ DeploymentId: "d-1", DeploymentStatus: "DEPLOYED", Description: "first", CreatedDate: 1705000000 }], total: 1 },
    });
    mockUpdateStage.mockImplementationOnce((_b: any, opts: any) => opts?.onError?.("boom"));
    mockUpdateDeployment.mockImplementationOnce((_b: any, opts: any) => opts?.onError?.("boom"));
    await openApi(user);
    await user.click(screen.getByRole("tab", { name: /Stages/i }));
    await waitFor(() => expect(screen.getByText("prod")).toBeTruthy());
    await clickButton(user, /Edit/i);
    await waitFor(() => expect(screen.getByText("Edit stage")).toBeTruthy());
    const stageDlg = screen.getByText("Edit stage").closest('[role="dialog"]') as HTMLElement;
    await user.click(stageDlg.querySelector('input[type="checkbox"]') as HTMLElement);
    await user.clear(stageDlg.querySelectorAll("input")[1] as HTMLElement);
    await user.type(stageDlg.querySelectorAll("input")[1] as HTMLElement, "d-9");
    await user.clear(stageDlg.querySelectorAll("input")[2] as HTMLElement);
    await user.type(stageDlg.querySelectorAll("input")[2] as HTMLElement, "v2");
    await clickButton(user, /Save/i, { last: true });
    await waitFor(() =>
      expect(mockUpdateStage).toHaveBeenCalledWith(
        expect.objectContaining({ stageName: "prod", autoDeploy: false, deploymentId: "d-9", description: "v2" }),
        expect.any(Object),
      ),
    );
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("error", "Failed to update stage"));

    await user.click(screen.getByRole("tab", { name: /Deployments/i }));
    await waitFor(() => expect(screen.getByText("first")).toBeTruthy());
    await clickButton(user, /Edit/i);
    await waitFor(() => expect(screen.getByText("Edit deployment")).toBeTruthy());
    const depDlg = screen.getByText("Edit deployment").closest('[role="dialog"]') as HTMLElement;
    const depInput = depDlg.querySelector("input") as HTMLElement;
    await user.clear(depInput);
    await user.type(depInput, "v2 release");
    await clickButton(user, /Save/i, { last: true });
    await waitFor(() =>
      expect(mockUpdateDeployment).toHaveBeenCalledWith(
        { deploymentId: "d-1", description: "v2 release" },
        expect.any(Object),
      ),
    );
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("error", "Failed to update deployment"));
  });

  it("manages tags from the tags modal", async () => {
    const user = userEvent.setup();
    mockTags.mockReturnValue({ data: { tags: { env: "dev" } } });
    mockTagResource.mockImplementationOnce((_b: any, opts: any) => opts?.onError?.("boom"));
    mockUntagResource.mockImplementationOnce((_b: any, opts: any) => opts?.onError?.("boom"));
    await openApi(user);
    await clickButton(user, /Tags/i);
    await waitFor(() => expect(screen.getByText(/Tags — api-1/i)).toBeTruthy());
    expect(screen.getByText(/env: dev/i)).toBeTruthy();
    // Add a tag with error then success
    const dlg = screen.getByText(/Tags — api-1/i).closest('[role="dialog"]') as HTMLElement;
    const inputs = dlg.querySelectorAll("input");
    await user.type(inputs[0], "team");
    await user.type(inputs[1], "x-val");
    await clickButton(user, /Add tag/i);
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("error", "Failed to add tag"));
    await clickButton(user, /Add tag/i);
    await waitFor(() =>
      expect(mockTagResource).toHaveBeenCalledWith(
        { env: "dev", team: "x-val" },
        expect.any(Object),
      ),
    );
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("success", "Tag added"));
    // Remove the env tag with error then success
    await clickButton(user, /env: dev/i);
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("error", "Failed to remove tag"));
    await clickButton(user, /env: dev/i);
    await waitFor(() => expect(mockUntagResource).toHaveBeenCalledWith(["env"], expect.any(Object)));
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("success", 'Tag "env" removed'));
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Tags — api-1"));
  });

  it("shows the no-tags empty state", async () => {
    const user = userEvent.setup();
    await openApi(user);
    await clickButton(user, /Tags/i);
    await waitFor(() => expect(screen.getByText("No tags")).toBeTruthy());
  });

  // ─── G.96 coverage-closing batch ──────────────────────

  it("creates a route response via modal and cancels", async () => {
    const user = userEvent.setup();
    mockRoutes.mockReturnValue({ data: { routes: [{ RouteId: "r-1", RouteKey: "GET /items", AuthorizationType: "NONE", Target: "integrations/i-1" }], total: 1 } });
    mockRouteResponses.mockReturnValue({ data: { routeResponses: [], total: 0 } });
    await openApi(user);
    await user.click(screen.getByRole("tab", { name: /^Routes$/i }));
    await waitFor(() => expect(screen.getByText("GET /items")).toBeTruthy());
    // Open route responses
    await clickButton(user, /Responses/i);
    await waitFor(() => expect(screen.queryByText("Integration responses")).toBeNull());
    // Create route response
    await clickButton(user, /Create response/i);
    await waitFor(() => expect(screen.getByText("Create route response")).toBeTruthy());
    // Cancel
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Create route response"));
    // Reopen, type key, create with success
    await clickButton(user, /Create response/i);
    await waitFor(() => expect(screen.getByText("Create route response")).toBeTruthy());
    const dlg = screen.getByText("Create route response").closest('[role="dialog"]') as HTMLElement;
    await user.type(dlg.querySelector("input") as HTMLElement, "200");
    await clickButton(user, /Create/i, { last: true });
    await waitFor(() => expect(mockCreateRouteResponse).toHaveBeenCalledWith({ routeResponseKey: "200" }, expect.any(Object)));
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("success", "Route response created"));
  });

  it("creates a route response with error", async () => {
    const user = userEvent.setup();
    mockRoutes.mockReturnValue({ data: { routes: [{ RouteId: "r-1", RouteKey: "GET /items", AuthorizationType: "NONE", Target: "integrations/i-1" }], total: 1 } });
    mockRouteResponses.mockReturnValue({ data: { routeResponses: [], total: 0 } });
    mockCreateRouteResponse.mockImplementationOnce((_b: any, opts: any) => opts?.onError?.("boom"));
    await openApi(user);
    await user.click(screen.getByRole("tab", { name: /^Routes$/i }));
    await waitFor(() => expect(screen.getByText("GET /items")).toBeTruthy());
    await clickButton(user, /Responses/i);
    await clickButton(user, /Create response/i);
    await waitFor(() => expect(screen.getByText("Create route response")).toBeTruthy());
    const dlg = screen.getByText("Create route response").closest('[role="dialog"]') as HTMLElement;
    await user.type(dlg.querySelector("input") as HTMLElement, "400");
    await clickButton(user, /Create/i, { last: true });
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("error", "Failed to create route response"));
  });

  it("edits a route with select onChange and cancel", async () => {
    const user = userEvent.setup();
    mockRoutes.mockReturnValue({ data: { routes: [{ RouteId: "r-1", RouteKey: "GET /pets", AuthorizationType: "NONE", Target: "integrations/i-1" }], total: 1 } });
    await openApi(user);
    await user.click(screen.getByRole("tab", { name: /^Routes$/i }));
    await waitFor(() => expect(screen.getByText("GET /pets")).toBeTruthy());
    await clickButton(user, /Edit/i);
    await waitFor(() => expect(screen.getByText("Edit route")).toBeTruthy());
    // Cancel
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Edit route"));
    // Reopen, change target, save
    await clickButton(user, /Edit/i);
    await waitFor(() => expect(screen.getByText("Edit route")).toBeTruthy());
    const dlg = screen.getByText("Edit route").closest('[role="dialog"]') as HTMLElement;
    const targetInput = dlg.querySelector('input[placeholder*="integrations"]') as HTMLElement;
    await user.clear(targetInput);
    await user.type(targetInput, "integrations/i-9");
    await clickButton(user, /Save/i, { last: true });
    await waitFor(() => expect(mockUpdateRoute).toHaveBeenCalledWith(
      expect.objectContaining({ routeId: "r-1", target: "integrations/i-9" }),
      expect.any(Object),
    ));
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("success", "Route updated"));
  });

  it("deletes a route response with success", async () => {
    const user = userEvent.setup();
    mockRoutes.mockReturnValue({ data: { routes: [{ RouteId: "r-1", RouteKey: "GET /items", AuthorizationType: "NONE", Target: "integrations/i-1" }], total: 1 } });
    mockRouteResponses.mockReturnValue({ data: { routeResponses: [{ RouteResponseId: "rr-1", RouteResponseKey: "200" }], total: 1 } });
    await openApi(user);
    await user.click(screen.getByRole("tab", { name: /^Routes$/i }));
    await waitFor(() => expect(screen.getByText("GET /items")).toBeTruthy());
    await clickButton(user, /Responses/i);
    await waitFor(() => expect(screen.getByText("200")).toBeTruthy());
    // Delete route response
    await clickButton(user, /Delete 200/i);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("success", 'Route response "200" deleted'));
  });

  it("creates an integration response via modal and cancels", async () => {
    const user = userEvent.setup();
    mockIntegrations.mockReturnValue({ data: { integrations: [{ IntegrationId: "i-1", IntegrationType: "AWS_PROXY", IntegrationUri: "https://x", IntegrationMethod: "POST" }], total: 1 } });
    mockIntegrationResponses.mockReturnValue({ data: { integrationResponses: [], total: 0 } });
    await openApi(user);
    await user.click(screen.getByRole("tab", { name: /Integrations/i }));
    await waitFor(() => expect(screen.getAllByText("AWS_PROXY").length).toBeGreaterThan(0));
    await clickButton(user, /Responses/i);
    await waitFor(() => expect(screen.getByText("Integration responses")).toBeTruthy());
    // Create integration response
    await clickButton(user, /Create response/i);
    await waitFor(() => expect(screen.getByText("Create integration response")).toBeTruthy());
    // Cancel
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Create integration response"));
    // Reopen, type key, create with success
    await clickButton(user, /Create response/i);
    await waitFor(() => expect(screen.getByText("Create integration response")).toBeTruthy());
    const dlg = screen.getByText("Create integration response").closest('[role="dialog"]') as HTMLElement;
    await user.type(dlg.querySelector("input") as HTMLElement, "200");
    await clickButton(user, /Create/i, { last: true });
    await waitFor(() => expect(mockCreateIntegrationResponse).toHaveBeenCalledWith({ integrationResponseKey: "200" }, expect.any(Object)));
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("success", "Integration response created"));
  });

  it("edits an integration with select onChange and cancel", async () => {
    const user = userEvent.setup();
    mockIntegrations.mockReturnValue({ data: { integrations: [{ IntegrationId: "i-1", IntegrationType: "AWS_PROXY", IntegrationUri: "https://x", IntegrationMethod: "POST" }], total: 1 } });
    await openApi(user);
    await user.click(screen.getByRole("tab", { name: /Integrations/i }));
    await waitFor(() => expect(screen.getAllByText("AWS_PROXY").length).toBeGreaterThan(0));
    await clickButton(user, /Edit/i);
    await waitFor(() => expect(screen.getByText("Edit integration")).toBeTruthy());
    // Cancel
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Edit integration"));
    // Reopen, change URI, save
    await clickButton(user, /Edit/i);
    await waitFor(() => expect(screen.getByText("Edit integration")).toBeTruthy());
    const dlg = screen.getByText("Edit integration").closest('[role="dialog"]') as HTMLElement;
    const inputs = dlg.querySelectorAll("input");
    await user.clear(inputs[0]);
    await user.type(inputs[0], "https://y");
    await clickButton(user, /Save/i, { last: true });
    await waitFor(() => expect(mockUpdateIntegration).toHaveBeenCalledWith(
      expect.objectContaining({ integrationId: "i-1", integrationUri: "https://y" }),
      expect.any(Object),
    ));
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("success", "Integration updated"));
  });

  it("deletes an integration response with success", async () => {
    const user = userEvent.setup();
    mockIntegrations.mockReturnValue({ data: { integrations: [{ IntegrationId: "i-1", IntegrationType: "AWS_PROXY", IntegrationUri: "https://x", IntegrationMethod: "POST" }], total: 1 } });
    mockIntegrationResponses.mockReturnValue({ data: { integrationResponses: [{ IntegrationResponseId: "ir-1", IntegrationResponseKey: "200" }], total: 1 } });
    await openApi(user);
    await user.click(screen.getByRole("tab", { name: /Integrations/i }));
    await waitFor(() => expect(screen.getAllByText("AWS_PROXY").length).toBeGreaterThan(0));
    await clickButton(user, /Responses/i);
    await waitFor(() => expect(screen.getByText("200")).toBeTruthy());
    await clickButton(user, /Delete 200/i);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("success", 'Integration response "200" deleted'));
  });

  it("edits a stage with cancel and success", async () => {
    const user = userEvent.setup();
    mockStages.mockReturnValue({ data: { stages: [{ StageName: "prod", DeploymentId: "d-1", StageArn: "arn:stg" }], total: 1 } });
    await openApi(user);
    await user.click(screen.getByRole("tab", { name: /Stages/i }));
    await waitFor(() => expect(screen.getByText("prod")).toBeTruthy());
    await clickButton(user, /Edit/i);
    await waitFor(() => expect(screen.getByText("Edit stage")).toBeTruthy());
    // Cancel
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Edit stage"));
    // Reopen, save with success
    await clickButton(user, /Edit/i);
    await waitFor(() => expect(screen.getByText("Edit stage")).toBeTruthy());
    await clickButton(user, /Save/i, { last: true });
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("success", "Stage updated"));
  });

  it("edits a deployment with cancel and success", async () => {
    const user = userEvent.setup();
    mockDeployments.mockReturnValue({ data: { deployments: [{ DeploymentId: "d-1", DeploymentStatus: "DEPLOYED", Description: "first", CreatedDate: 1705000000 }], total: 1 } });
    await openApi(user);
    await user.click(screen.getByRole("tab", { name: /Deployments/i }));
    await waitFor(() => expect(screen.getByText("first")).toBeTruthy());
    await clickButton(user, /Edit/i);
    await waitFor(() => expect(screen.getByText("Edit deployment")).toBeTruthy());
    // Cancel
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Edit deployment"));
    // Reopen, save with success
    await clickButton(user, /Edit/i);
    await waitFor(() => expect(screen.getByText("Edit deployment")).toBeTruthy());
    await clickButton(user, /Save/i, { last: true });
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("success", "Deployment updated"));
  });

  it("creates an authorizer via modal with identity source and cancel", async () => {
    const user = userEvent.setup();
    mockAuthorizers.mockReturnValue({ data: { authorizers: [], total: 0 } });
    await openApi(user);
    await user.click(screen.getByRole("tab", { name: /Authorizers/i }));
    await waitFor(() => expect(screen.getByText("No authorizers")).toBeTruthy());
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create authorizer")).toBeTruthy());
    // Cancel
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Create authorizer"));
    // Reopen, fill fields, create
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create authorizer")).toBeTruthy());
    const dlg = screen.getByText("Create authorizer").closest('[role="dialog"]') as HTMLElement;
    const inputs = dlg.querySelectorAll("input");
    // Name
    await user.type(inputs[0], "my-auth");
    // Identity source
    await user.type(inputs[1], "$request.header.Authorization");
    // URI
    await user.type(inputs[2], "arn:aws:lambda:us-east-1:123:function:auth");
    await clickButton(user, /Create/i, { last: true });
    await waitFor(() => expect(mockCreateAuthorizer).toHaveBeenCalledWith(
      expect.objectContaining({ name: "my-auth", identitySource: ["$request.header.Authorization"] }),
      expect.any(Object),
    ));
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("success", 'Authorizer "my-auth" created'));
  });

  it("edits an authorizer with cancel and success", async () => {
    const user = userEvent.setup();
    mockAuthorizers.mockReturnValue({ data: { authorizers: [{ AuthorizerId: "a-1", Name: "my-auth", AuthorizerType: "REQUEST", AuthorizerUri: "arn:lambda" }], total: 1 } });
    await openApi(user);
    await user.click(screen.getByRole("tab", { name: /Authorizers/i }));
    await waitFor(() => expect(screen.getByText("my-auth")).toBeTruthy());
    await clickButton(user, /Edit/i);
    await waitFor(() => expect(screen.getByText("Edit authorizer")).toBeTruthy());
    // Cancel
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Edit authorizer"));
    // Reopen, change name, save
    await clickButton(user, /Edit/i);
    await waitFor(() => expect(screen.getByText("Edit authorizer")).toBeTruthy());
    const dlg = screen.getByText("Edit authorizer").closest('[role="dialog"]') as HTMLElement;
    await user.clear(dlg.querySelector("input") as HTMLElement);
    await user.type(dlg.querySelector("input") as HTMLElement, "renamed-auth");
    await clickButton(user, /Save/i, { last: true });
    await waitFor(() => expect(mockUpdateAuthorizer).toHaveBeenCalledWith(
      expect.objectContaining({ authorizerId: "a-1", name: "renamed-auth" }),
      expect.any(Object),
    ));
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("success", "Authorizer updated"));
  });

  it("creates a model via modal with cancel and success", async () => {
    const user = userEvent.setup();
    mockModels.mockReturnValue({ data: { models: [], total: 0 } });
    await openApi(user);
    await user.click(screen.getByRole("tab", { name: /Models/i }));
    await waitFor(() => expect(screen.getByText("No models")).toBeTruthy());
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create model")).toBeTruthy());
    // Cancel
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Create model"));
    // Reopen, fill fields, create
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create model")).toBeTruthy());
    const dlg = screen.getByText("Create model").closest('[role="dialog"]') as HTMLElement;
    const inputs = dlg.querySelectorAll("input");
    await user.type(inputs[0], "pet-model");
    await user.clear(inputs[1]);
    await user.type(inputs[1], "application/json");
    fireEvent.change(dlg.querySelector("textarea") as HTMLElement, { target: { value: '{"type":"object"}' } });
    await clickButton(user, /Create/i, { last: true });
    await waitFor(() => expect(mockCreateModel).toHaveBeenCalledWith(
      expect.objectContaining({ name: "pet-model", contentType: "application/json" }),
      expect.any(Object),
    ));
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("success", 'Model "pet-model" created'));
  });

  it("edits a model with cancel and success", async () => {
    const user = userEvent.setup();
    mockModels.mockReturnValue({ data: { models: [{ ModelId: "m-1", Name: "pet", ContentType: "application/json" }], total: 1 } });
    await openApi(user);
    await user.click(screen.getByRole("tab", { name: /Models/i }));
    await waitFor(() => expect(screen.getByText("pet")).toBeTruthy());
    await clickButton(user, /Edit/i);
    await waitFor(() => expect(screen.getByText("Edit model")).toBeTruthy());
    // Cancel
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Edit model"));
    // Reopen, change name, save
    await clickButton(user, /Edit/i);
    await waitFor(() => expect(screen.getByText("Edit model")).toBeTruthy());
    const dlg = screen.getByText("Edit model").closest('[role="dialog"]') as HTMLElement;
    const inputs = dlg.querySelectorAll("input");
    await user.clear(inputs[0]);
    await user.type(inputs[0], "renamed-model");
    await user.clear(inputs[1]);
    await user.type(inputs[1], "text/plain");
    await clickButton(user, /Save/i, { last: true });
    await waitFor(() => expect(mockUpdateModel).toHaveBeenCalledWith(
      expect.objectContaining({ modelId: "m-1", name: "renamed-model", contentType: "text/plain" }),
      expect.any(Object),
    ));
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("success", "Model updated"));
  });

  // ─── Cancel button onClick coverage ──────────────────

  it("covers Cancel button onClick for create route response", async () => {
    const user = userEvent.setup();
    mockRoutes.mockReturnValue({ data: { routes: [{ RouteId: "r-1", RouteKey: "GET /items", AuthorizationType: "NONE", Target: "integrations/i-1" }], total: 1 } });
    mockRouteResponses.mockReturnValue({ data: { routeResponses: [], total: 0 } });
    await openApi(user);
    await user.click(screen.getByRole("tab", { name: /^Routes$/i }));
    await waitFor(() => expect(screen.getByText("GET /items")).toBeTruthy());
    await clickButton(user, /Responses/i);
    await clickButton(user, /Create response/i);
    await waitFor(() => expect(screen.getByText("Create route response")).toBeTruthy());
    // Click Cancel button (not Escape)
    const cancelDlg = screen.getByText("Create route response").closest('[role="dialog"]') as HTMLElement;
    const cancelBtn = Array.from(cancelDlg.querySelectorAll("button")).find(b => b.textContent?.trim() === "Cancel") as HTMLElement;
    await user.click(cancelBtn);
    await waitFor(() => expectModalHidden("Create route response"));
  });

  it("covers Cancel button onClick for edit route", async () => {
    const user = userEvent.setup();
    mockRoutes.mockReturnValue({ data: { routes: [{ RouteId: "r-1", RouteKey: "GET /pets", AuthorizationType: "NONE", Target: "integrations/i-1" }], total: 1 } });
    await openApi(user);
    await user.click(screen.getByRole("tab", { name: /^Routes$/i }));
    await waitFor(() => expect(screen.getByText("GET /pets")).toBeTruthy());
    await clickButton(user, /Edit/i);
    await waitFor(() => expect(screen.getByText("Edit route")).toBeTruthy());
    const cancelDlg = screen.getByText("Edit route").closest('[role="dialog"]') as HTMLElement;
    const cancelBtn = Array.from(cancelDlg.querySelectorAll("button")).find(b => b.textContent?.trim() === "Cancel") as HTMLElement;
    await user.click(cancelBtn);
    await waitFor(() => expectModalHidden("Edit route"));
  });

  it("covers Cancel button onClick for create integration response", async () => {
    const user = userEvent.setup();
    mockIntegrations.mockReturnValue({ data: { integrations: [{ IntegrationId: "i-1", IntegrationType: "AWS_PROXY", IntegrationUri: "https://x", IntegrationMethod: "POST" }], total: 1 } });
    mockIntegrationResponses.mockReturnValue({ data: { integrationResponses: [], total: 0 } });
    await openApi(user);
    await user.click(screen.getByRole("tab", { name: /Integrations/i }));
    await waitFor(() => expect(screen.getAllByText("AWS_PROXY").length).toBeGreaterThan(0));
    await clickButton(user, /Responses/i);
    await clickButton(user, /Create response/i);
    await waitFor(() => expect(screen.getByText("Create integration response")).toBeTruthy());
    const cancelDlg = screen.getByText("Create integration response").closest('[role="dialog"]') as HTMLElement;
    const cancelBtn = Array.from(cancelDlg.querySelectorAll("button")).find(b => b.textContent?.trim() === "Cancel") as HTMLElement;
    await user.click(cancelBtn);
    await waitFor(() => expectModalHidden("Create integration response"));
  });

  it("covers Cancel button onClick for edit integration", async () => {
    const user = userEvent.setup();
    mockIntegrations.mockReturnValue({ data: { integrations: [{ IntegrationId: "i-1", IntegrationType: "AWS_PROXY", IntegrationUri: "https://x", IntegrationMethod: "POST" }], total: 1 } });
    await openApi(user);
    await user.click(screen.getByRole("tab", { name: /Integrations/i }));
    await waitFor(() => expect(screen.getAllByText("AWS_PROXY").length).toBeGreaterThan(0));
    await clickButton(user, /Edit/i);
    await waitFor(() => expect(screen.getByText("Edit integration")).toBeTruthy());
    const cancelDlg = screen.getByText("Edit integration").closest('[role="dialog"]') as HTMLElement;
    const cancelBtn = Array.from(cancelDlg.querySelectorAll("button")).find(b => b.textContent?.trim() === "Cancel") as HTMLElement;
    await user.click(cancelBtn);
    await waitFor(() => expectModalHidden("Edit integration"));
  });

  it("covers Cancel button onClick for edit stage", async () => {
    const user = userEvent.setup();
    mockStages.mockReturnValue({ data: { stages: [{ StageName: "prod", DeploymentId: "d-1", StageArn: "arn:stg" }], total: 1 } });
    await openApi(user);
    await user.click(screen.getByRole("tab", { name: /Stages/i }));
    await waitFor(() => expect(screen.getByText("prod")).toBeTruthy());
    await clickButton(user, /Edit/i);
    await waitFor(() => expect(screen.getByText("Edit stage")).toBeTruthy());
    const cancelDlg = screen.getByText("Edit stage").closest('[role="dialog"]') as HTMLElement;
    const cancelBtn = Array.from(cancelDlg.querySelectorAll("button")).find(b => b.textContent?.trim() === "Cancel") as HTMLElement;
    await user.click(cancelBtn);
    await waitFor(() => expectModalHidden("Edit stage"));
  });

  it("covers Cancel button onClick for edit deployment", async () => {
    const user = userEvent.setup();
    mockDeployments.mockReturnValue({ data: { deployments: [{ DeploymentId: "d-1", DeploymentStatus: "DEPLOYED", Description: "first", CreatedDate: 1705000000 }], total: 1 } });
    await openApi(user);
    await user.click(screen.getByRole("tab", { name: /Deployments/i }));
    await waitFor(() => expect(screen.getByText("first")).toBeTruthy());
    await clickButton(user, /Edit/i);
    await waitFor(() => expect(screen.getByText("Edit deployment")).toBeTruthy());
    const cancelDlg = screen.getByText("Edit deployment").closest('[role="dialog"]') as HTMLElement;
    const cancelBtn = Array.from(cancelDlg.querySelectorAll("button")).find(b => b.textContent?.trim() === "Cancel") as HTMLElement;
    await user.click(cancelBtn);
    await waitFor(() => expectModalHidden("Edit deployment"));
  });

  it("covers Cancel button onClick for create authorizer", async () => {
    const user = userEvent.setup();
    mockAuthorizers.mockReturnValue({ data: { authorizers: [], total: 0 } });
    await openApi(user);
    await user.click(screen.getByRole("tab", { name: /Authorizers/i }));
    await waitFor(() => expect(screen.getByText("No authorizers")).toBeTruthy());
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create authorizer")).toBeTruthy());
    const cancelDlg = screen.getByText("Create authorizer").closest('[role="dialog"]') as HTMLElement;
    const cancelBtn = Array.from(cancelDlg.querySelectorAll("button")).find(b => b.textContent?.trim() === "Cancel") as HTMLElement;
    await user.click(cancelBtn);
    await waitFor(() => expectModalHidden("Create authorizer"));
  });

  it("covers Cancel button onClick for edit authorizer", async () => {
    const user = userEvent.setup();
    mockAuthorizers.mockReturnValue({ data: { authorizers: [{ AuthorizerId: "a-1", Name: "my-auth", AuthorizerType: "REQUEST", AuthorizerUri: "arn:lambda" }], total: 1 } });
    await openApi(user);
    await user.click(screen.getByRole("tab", { name: /Authorizers/i }));
    await waitFor(() => expect(screen.getByText("my-auth")).toBeTruthy());
    await clickButton(user, /Edit/i);
    await waitFor(() => expect(screen.getByText("Edit authorizer")).toBeTruthy());
    const cancelDlg = screen.getByText("Edit authorizer").closest('[role="dialog"]') as HTMLElement;
    const cancelBtn = Array.from(cancelDlg.querySelectorAll("button")).find(b => b.textContent?.trim() === "Cancel") as HTMLElement;
    await user.click(cancelBtn);
    await waitFor(() => expectModalHidden("Edit authorizer"));
  });

  it("covers Cancel button onClick for create model", async () => {
    const user = userEvent.setup();
    mockModels.mockReturnValue({ data: { models: [], total: 0 } });
    await openApi(user);
    await user.click(screen.getByRole("tab", { name: /Models/i }));
    await waitFor(() => expect(screen.getByText("No models")).toBeTruthy());
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create model")).toBeTruthy());
    const cancelDlg = screen.getByText("Create model").closest('[role="dialog"]') as HTMLElement;
    const cancelBtn = Array.from(cancelDlg.querySelectorAll("button")).find(b => b.textContent?.trim() === "Cancel") as HTMLElement;
    await user.click(cancelBtn);
    await waitFor(() => expectModalHidden("Create model"));
  });

  it("covers Cancel button onClick for edit model", async () => {
    const user = userEvent.setup();
    mockModels.mockReturnValue({ data: { models: [{ ModelId: "m-1", Name: "pet", ContentType: "application/json" }], total: 1 } });
    await openApi(user);
    await user.click(screen.getByRole("tab", { name: /Models/i }));
    await waitFor(() => expect(screen.getByText("pet")).toBeTruthy());
    await clickButton(user, /Edit/i);
    await waitFor(() => expect(screen.getByText("Edit model")).toBeTruthy());
    const cancelDlg = screen.getByText("Edit model").closest('[role="dialog"]') as HTMLElement;
    const cancelBtn = Array.from(cancelDlg.querySelectorAll("button")).find(b => b.textContent?.trim() === "Cancel") as HTMLElement;
    await user.click(cancelBtn);
    await waitFor(() => expectModalHidden("Edit model"));
  });

  it("covers Tags Close button onClick", async () => {
    const user = userEvent.setup();
    await openApi(user);
    await clickButton(user, /Tags/i);
    await waitFor(() => expect(screen.getByText(/Tags — api-1/i)).toBeTruthy());
    // Click the Close button (not Escape)
    const closeDlg = screen.getByText(/Tags — api-1/i).closest('[role="dialog"]') as HTMLElement;
    const closeBtn = Array.from(closeDlg.querySelectorAll("button")).find(b => b.textContent?.trim() === "Close") as HTMLElement;
    await user.click(closeBtn);
    await waitFor(() => expectModalHidden("Tags — api-1"));
  });

  it("covers authorizer identity source comma split", async () => {
    const user = userEvent.setup();
    mockAuthorizers.mockReturnValue({ data: { authorizers: [], total: 0 } });
    await openApi(user);
    await user.click(screen.getByRole("tab", { name: /Authorizers/i }));
    await waitFor(() => expect(screen.getByText("No authorizers")).toBeTruthy());
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create authorizer")).toBeTruthy());
    const dlg = screen.getByText("Create authorizer").closest('[role="dialog"]') as HTMLElement;
    const inputs = dlg.querySelectorAll("input");
    await user.type(inputs[0], "multi-auth");
    await user.type(inputs[1], "$request.header.Authorization, $request.header.X-Api-Key");
    await user.type(inputs[2], "arn:aws:lambda:us-east-1:123:function:auth");
    await clickButton(user, /Create/i, { last: true });
    await waitFor(() => expect(mockCreateAuthorizer).toHaveBeenCalledWith(
      expect.objectContaining({ identitySource: ["$request.header.Authorization", "$request.header.X-Api-Key"] }),
      expect.any(Object),
    ));
  });

  it("covers models tab filter function", async () => {
    const user = userEvent.setup();
    mockModels.mockReturnValue({ data: { models: [{ ModelId: "m-1", Name: "pet-model", ContentType: "application/json" }, { ModelId: "m-2", Name: "car-model", ContentType: "text/plain" }], total: 2 } });
    await openApi(user);
    await user.click(screen.getByRole("tab", { name: /Models/i }));
    await waitFor(() => expect(screen.getByText("pet-model")).toBeTruthy());
    expect(screen.getByText("car-model")).toBeTruthy();
    // Type in filter
    const filterInput = screen.getByPlaceholderText("Find models");
    await user.type(filterInput, "pet");
    await waitFor(() => {
      expect(screen.getByText("pet-model")).toBeTruthy();
      expect(screen.queryByText("car-model")).toBeNull();
    });
  });

});

// ── G.96 branch + function coverage batch ───────────────────────────
// Covers: || []/|| {} fallbacks, !== "-" ternary false arms, trim()||undefined
// fallbacks, and .map() callback anonymous functions for routeResponses,
// integrationResponses, authorizers, models, and tags.

describe("ApiGatewayV2Dashboard — branch coverage (|| fallbacks, ternary arms)", () => {
  beforeEach(() => {
    mockApis.mockReturnValue({
      data: { apis: [{ ApiId: "api-1", Name: "my-api", ProtocolType: "HTTP" }], total: 1 },
      isLoading: false,
    });
    toastMock.mockClear();
  });

  it("renders route responses when clicking Responses on a route with data", async () => {
    const user = userEvent.setup();
    mockRoutes.mockReturnValue({
      data: { routes: [{ RouteId: "r-1", RouteKey: "GET /pets", AuthorizationType: "NONE", Target: "integrations/i-1" }], total: 1 },
    });
    mockRouteResponses.mockReturnValue({
      data: { routeResponses: [{ RouteResponseId: "rr-1", RouteResponseKey: "200" }, { RouteResponseId: "rr-2", RouteResponseKey: "404" }], total: 2 },
    });
    await openApi(user);
    await user.click(screen.getByRole("tab", { name: /^Routes$/i }));
    await waitFor(() => expect(screen.getByText("GET /pets")).toBeTruthy());
    // Click "Responses" on the route
    const responsesBtn = screen.getByRole("button", { name: /Responses/i });
    await user.click(responsesBtn);
    await waitFor(() => expect(screen.getByText("200")).toBeTruthy());
    expect(screen.getByText("404")).toBeTruthy();
  });

  it("renders route responses empty when routeResponsesQuery.data has no routeResponses key", async () => {
    const user = userEvent.setup();
    mockRoutes.mockReturnValue({
      data: { routes: [{ RouteId: "r-1", RouteKey: "GET /pets", AuthorizationType: "NONE", Target: "integrations/i-1" }], total: 1 },
    });
    mockRouteResponses.mockReturnValue({
      data: { total: 0 },
    });
    await openApi(user);
    await user.click(screen.getByRole("tab", { name: /^Routes$/i }));
    await waitFor(() => expect(screen.getByText("GET /pets")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Responses/i }));
    await waitFor(() => expect(screen.getByText("No route responses")).toBeTruthy());
  });

  it("renders integration responses when clicking Responses on an integration", async () => {
    const user = userEvent.setup();
    mockIntegrations.mockReturnValue({
      data: { integrations: [{ IntegrationId: "i-1", IntegrationType: "AWS_PROXY", IntegrationUri: "arn:lambda", IntegrationMethod: "POST" }], total: 1 },
    });
    mockIntegrationResponses.mockReturnValue({
      data: { integrationResponses: [{ IntegrationResponseId: "ir-1", IntegrationResponseKey: "200" }], total: 1 },
    });
    await openApi(user);
    await user.click(screen.getByRole("tab", { name: /Integrations/i }));
    await waitFor(() => expect(screen.getByText("arn:lambda")).toBeTruthy());
    const responsesBtn = screen.getByRole("button", { name: /Responses/i });
    await user.click(responsesBtn);
    await waitFor(() => expect(screen.getByText("200")).toBeTruthy());
  });

  it("renders integration responses with undefined integrationResponses in data", async () => {
    const user = userEvent.setup();
    mockIntegrations.mockReturnValue({
      data: { integrations: [{ IntegrationId: "i-1", IntegrationType: "AWS_PROXY", IntegrationUri: "arn:lambda", IntegrationMethod: "POST" }], total: 1 },
    });
    mockIntegrationResponses.mockReturnValue({ data: { total: 0 } });
    await openApi(user);
    await user.click(screen.getByRole("tab", { name: /Integrations/i }));
    await waitFor(() => expect(screen.getByText("arn:lambda")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Responses/i }));
    await waitFor(() => expect(screen.getByText("No integration responses")).toBeTruthy());
  });

  it("edits a route with target '-' (fallback arm)", async () => {
    const user = userEvent.setup();
    mockRoutes.mockReturnValue({
      data: { routes: [{ RouteId: "r-2", RouteKey: "GET /items", AuthorizationType: "NONE", Target: "-" }], total: 1 },
    });
    await openApi(user);
    await user.click(screen.getByRole("tab", { name: /^Routes$/i }));
    await waitFor(() => expect(screen.getByText("GET /items")).toBeTruthy());
    await clickButton(user, /Edit/i);
    await waitFor(() => expect(screen.getByText("Edit route")).toBeTruthy());
    const dlg = screen.getByText("Edit route").closest('[role="dialog"]') as HTMLElement;
    const inputs = dlg.querySelectorAll("input");
    // target should be empty (fallback from "-")
    expect((inputs[1] as HTMLInputElement).value).toBe("");
    await clickButton(user, /Save/i, { last: true });
    await waitFor(() =>
      expect(mockUpdateRoute).toHaveBeenCalledWith(
        expect.objectContaining({ routeId: "r-2", authorizationType: undefined, target: undefined }),
        expect.any(Object),
      ),
    );
  });

  it("saves a route with NONE auth and empty target", async () => {
    const user = userEvent.setup();
    mockRoutes.mockReturnValue({
      data: { routes: [{ RouteId: "r-1", RouteKey: "GET /pets", AuthorizationType: "JWT", Target: "integrations/i-1" }], total: 1 },
    });
    await openApi(user);
    await user.click(screen.getByRole("tab", { name: /^Routes$/i }));
    await waitFor(() => expect(screen.getByText("GET /pets")).toBeTruthy());
    await clickButton(user, /Edit/i);
    await waitFor(() => expect(screen.getByText("Edit route")).toBeTruthy());
    const dlg = screen.getByText("Edit route").closest('[role="dialog"]') as HTMLElement;
    const inputs = dlg.querySelectorAll("input");
    // Clear target to test trim() || undefined
    await user.clear(inputs[1]);
    await clickButton(user, /Save/i, { last: true });
    await waitFor(() =>
      expect(mockUpdateRoute).toHaveBeenCalledWith(
        expect.objectContaining({ routeId: "r-1", target: undefined }),
        expect.any(Object),
      ),
    );
  });

  it("edits an integration with uri '-' and method '-' (fallback arms)", async () => {
    const user = userEvent.setup();
    mockIntegrations.mockReturnValue({
      data: { integrations: [{ IntegrationId: "i-1", IntegrationType: "AWS_PROXY", IntegrationUri: "-", IntegrationMethod: "-" }], total: 1 },
    });
    await openApi(user);
    await user.click(screen.getByRole("tab", { name: /Integrations/i }));
    await waitFor(() => expect(screen.getAllByText("AWS_PROXY").length).toBeGreaterThan(0));
    // Click the Edit button in the integrations table (not the hidden Select)
    const integrationRows = document.querySelectorAll(".awsui_body-cell-content");
    const editBtn = [...document.querySelectorAll("button")].find(b => b.textContent === "Edit" && b.closest("td"))!;
    await user.click(editBtn);
    await waitFor(() => expect(screen.getByText("Edit integration")).toBeTruthy());
    // The Edit integration form has: Select (type), Input (uri), Input (method)
    // When uri and method are "-", they get cleared to "" on edit
    await clickButton(user, /Save/i, { last: true });
    await waitFor(() =>
      expect(mockUpdateIntegration).toHaveBeenCalledWith(
        expect.objectContaining({ integrationId: "i-1", integrationUri: undefined, integrationMethod: undefined }),
        expect.any(Object),
      ),
    );
  });

  it("saves an integration with empty uri and method (trim fallbacks)", async () => {
    const user = userEvent.setup();
    mockIntegrations.mockReturnValue({
      data: { integrations: [{ IntegrationId: "i-1", IntegrationType: "AWS_PROXY", IntegrationUri: "https://x", IntegrationMethod: "POST" }], total: 1 },
    });
    await openApi(user);
    await user.click(screen.getByRole("tab", { name: /Integrations/i }));
    await waitFor(() => expect(screen.getByText("https://x")).toBeTruthy());
    await clickButton(user, /Edit/i);
    await waitFor(() => expect(screen.getByText("Edit integration")).toBeTruthy());
    const dlg = screen.getByText("Edit integration").closest('[role="dialog"]') as HTMLElement;
    const inputs = dlg.querySelectorAll("input");
    await user.clear(inputs[0]);
    await user.clear(inputs[1]);
    await clickButton(user, /Save/i, { last: true });
    await waitFor(() =>
      expect(mockUpdateIntegration).toHaveBeenCalledWith(
        expect.objectContaining({ integrationId: "i-1", integrationUri: undefined, integrationMethod: undefined }),
        expect.any(Object),
      ),
    );
  });

  it("edits a stage with deployment '-' (fallback arm)", async () => {
    const user = userEvent.setup();
    mockStages.mockReturnValue({
      data: { stages: [{ StageName: "prod", AutoDeploy: true, DeploymentId: "-", CreatedDate: 1705000000 }], total: 1 },
    });
    await openApi(user);
    await user.click(screen.getByRole("tab", { name: /Stages/i }));
    await waitFor(() => expect(screen.getByText("prod")).toBeTruthy());
    await clickButton(user, /Edit/i);
    await waitFor(() => expect(screen.getByText("Edit stage")).toBeTruthy());
    const dlg = screen.getByText("Edit stage").closest('[role="dialog"]') as HTMLElement;
    // The Edit stage form: Checkbox (autoDeploy), Input (deploymentId), Input (description)
    // When DeploymentId is "-", the input is cleared to ""
    await clickButton(user, /Save/i, { last: true });
    await waitFor(() =>
      expect(mockUpdateStage).toHaveBeenCalledWith(
        expect.objectContaining({ stageName: "prod", deploymentId: undefined }),
        expect.any(Object),
      ),
    );
  });

  it("saves a stage with empty deploymentId (trim fallback)", async () => {
    const user = userEvent.setup();
    mockStages.mockReturnValue({
      data: { stages: [{ StageName: "prod", AutoDeploy: true, DeploymentId: "d-1", Description: "live", CreatedDate: 1705000000 }], total: 1 },
    });
    await openApi(user);
    await user.click(screen.getByRole("tab", { name: /Stages/i }));
    await waitFor(() => expect(screen.getByText("prod")).toBeTruthy());
    await clickButton(user, /Edit/i);
    await waitFor(() => expect(screen.getByText("Edit stage")).toBeTruthy());
    const dlg = screen.getByText("Edit stage").closest('[role="dialog"]') as HTMLElement;
    const inputs = dlg.querySelectorAll("input");
    await user.clear(inputs[1]);
    await user.clear(inputs[2]);
    await clickButton(user, /Save/i, { last: true });
    await waitFor(() =>
      expect(mockUpdateStage).toHaveBeenCalledWith(
        expect.objectContaining({ stageName: "prod", deploymentId: undefined, description: undefined }),
        expect.any(Object),
      ),
    );
  });

  it("edits a deployment with description '-' (fallback arm)", async () => {
    const user = userEvent.setup();
    mockDeployments.mockReturnValue({
      data: { deployments: [{ DeploymentId: "d-1", DeploymentStatus: "DEPLOYED", Description: "-", CreatedDate: 1705000000 }], total: 1 },
    });
    await openApi(user);
    await user.click(screen.getByRole("tab", { name: /Deployments/i }));
    await waitFor(() => expect(screen.getByText("d-1")).toBeTruthy());
    await clickButton(user, /Edit/i);
    await waitFor(() => expect(screen.getByText("Edit deployment")).toBeTruthy());
    const dlg = screen.getByText("Edit deployment").closest('[role="dialog"]') as HTMLElement;
    const input = dlg.querySelector("input") as HTMLElement;
    // description should be empty (fallback from "-")
    expect((input as HTMLInputElement).value).toBe("");
    await clickButton(user, /Save/i, { last: true });
    await waitFor(() =>
      expect(mockUpdateDeployment).toHaveBeenCalledWith(
        { deploymentId: "d-1", description: "" },
        expect.any(Object),
      ),
    );
  });

  it("renders authorizers with items and edits one with '-' type/uri", async () => {
    const user = userEvent.setup();
    mockAuthorizers.mockReturnValue({
      data: { authorizers: [
        { AuthorizerId: "a-1", Name: "req-auth", AuthorizerType: "REQUEST", IdentitySource: "$header.auth", AuthorizerUri: "arn:lambda:auth" },
        { AuthorizerId: "a-2", Name: "bare-auth", AuthorizerType: "-", IdentitySource: "-", AuthorizerUri: "-" },
      ], total: 2 },
    });
    await openApi(user);
    await user.click(screen.getByRole("tab", { name: /Authorizers/i }));
    await waitFor(() => expect(screen.getByText("req-auth")).toBeTruthy());
    expect(screen.getByText("bare-auth")).toBeTruthy();
    // Edit the bare-auth authorizer (has "-" type and uri)
    const editBtns = screen.getAllByRole("button", { name: /Edit/i });
    await user.click(editBtns[1]);
    await waitFor(() => expect(screen.getByText("Edit authorizer")).toBeTruthy());
    // The edit authorizer form has: Name input, AuthorizerType Select (no URI field)
    // When type is "-", it falls back to "REQUEST" in the form state
    await clickButton(user, /Save/i, { last: true });
    await waitFor(() =>
      expect(mockUpdateAuthorizer).toHaveBeenCalledWith(
        expect.objectContaining({ authorizerId: "a-2", authorizerType: "REQUEST" }),
        expect.any(Object),
      ),
    );
  });

  it("saves an authorizer with empty URI (trim fallback)", async () => {
    const user = userEvent.setup();
    mockAuthorizers.mockReturnValue({
      data: { authorizers: [{ AuthorizerId: "a-1", Name: "req-auth", AuthorizerType: "REQUEST", IdentitySource: "$header.auth", AuthorizerUri: "arn:lambda:auth" }], total: 1 },
    });
    await openApi(user);
    await user.click(screen.getByRole("tab", { name: /Authorizers/i }));
    await waitFor(() => expect(screen.getByText("req-auth")).toBeTruthy());
    const editBtn = screen.getAllByRole("button", { name: /Edit/i })[0];
    await user.click(editBtn);
    await waitFor(() => expect(screen.getByText("Edit authorizer")).toBeTruthy());
    // The edit authorizer form only has Name + Select, no URI input field
    // The URI comes from the row data, the form always sends authorizerUri from state
    await clickButton(user, /Save/i, { last: true });
    await waitFor(() =>
      expect(mockUpdateAuthorizer).toHaveBeenCalledWith(
        expect.objectContaining({ authorizerId: "a-1" }),
        expect.any(Object),
      ),
    );
  });

  it("renders models with items and edits one with '-' content type", async () => {
    const user = userEvent.setup();
    mockModels.mockReturnValue({
      data: { models: [
        { ModelId: "m-1", Name: "pet-model", ContentType: "application/json" },
        { ModelId: "m-2", Name: "bare-model", ContentType: "-" },
      ], total: 2 },
    });
    await openApi(user);
    await user.click(screen.getByRole("tab", { name: /Models/i }));
    await waitFor(() => expect(screen.getByText("pet-model")).toBeTruthy());
    expect(screen.getByText("bare-model")).toBeTruthy();
    // Edit the bare-model (has "-" content type)
    const editBtns = screen.getAllByRole("button", { name: /Edit/i });
    await user.click(editBtns[1]);
    await waitFor(() => expect(screen.getByText("Edit model")).toBeTruthy());
    // The edit model form: Name input, Content Type input, Schema textarea
    // When ContentType is "-", it falls back to "application/json" in form state
    await clickButton(user, /Save/i, { last: true });
    await waitFor(() =>
      expect(mockUpdateModel).toHaveBeenCalledWith(
        expect.objectContaining({ modelId: "m-2" }),
        expect.any(Object),
      ),
    );
  });

  it("saves a model with empty schema (trim fallback)", async () => {
    const user = userEvent.setup();
    mockModels.mockReturnValue({
      data: { models: [{ ModelId: "m-1", Name: "pet-model", ContentType: "application/json", Schema: "{}" }], total: 1 },
    });
    await openApi(user);
    await user.click(screen.getByRole("tab", { name: /Models/i }));
    await waitFor(() => expect(screen.getByText("pet-model")).toBeTruthy());
    const editBtn = screen.getAllByRole("button", { name: /Edit/i })[0];
    await user.click(editBtn);
    await waitFor(() => expect(screen.getByText("Edit model")).toBeTruthy());
    const dlg = screen.getByText("Edit model").closest('[role="dialog"]') as HTMLElement;
    // Clear the schema textarea using fireEvent
    const textarea = dlg.querySelector("textarea");
    if (textarea) fireEvent.change(textarea, { target: { value: "" } });
    await clickButton(user, /Save/i, { last: true });
    await waitFor(() =>
      expect(mockUpdateModel).toHaveBeenCalledWith(
        expect.objectContaining({ modelId: "m-1", schema: undefined }),
        expect.any(Object),
      ),
    );
  });

  it("shows 'No tags' when tags data has empty tags object", async () => {
    const user = userEvent.setup();
    mockTags.mockReturnValue({ data: { tags: {} } });
    await openApi(user);
    await clickButton(user, /Tags/i);
    await waitFor(() => expect(screen.getByText(/Tags — api-1/i)).toBeTruthy());
    await waitFor(() => expect(screen.getByText("No tags")).toBeTruthy());
  });

  it("shows 'No tags' when tags data has undefined tags", async () => {
    const user = userEvent.setup();
    mockTags.mockReturnValue({ data: {} });
    await openApi(user);
    await clickButton(user, /Tags/i);
    await waitFor(() => expect(screen.getByText(/Tags — api-1/i)).toBeTruthy());
    await waitFor(() => expect(screen.getByText("No tags")).toBeTruthy());
  });

  it("renders tags with data and removes one", async () => {
    const user = userEvent.setup();
    mockTags.mockReturnValue({ data: { tags: { env: "dev", team: "platform" } } });
    await openApi(user);
    await clickButton(user, /Tags/i);
    await waitFor(() => expect(screen.getByText(/env: dev/i)).toBeTruthy());
    expect(screen.getByText(/team: platform/i)).toBeTruthy();
    // Remove a tag
    await user.click(screen.getByText(/env: dev/i));
    await waitFor(() =>
      expect(mockUntagResource).toHaveBeenCalledWith(["env"], expect.any(Object)),
    );
  });

  it("adds a tag when tags data was empty", async () => {
    const user = userEvent.setup();
    mockTags.mockReturnValue({ data: { tags: {} } });
    mockTagResource.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
    await openApi(user);
    await clickButton(user, /Tags/i);
    await waitFor(() => expect(screen.getByText(/Tags — api-1/i)).toBeTruthy());
    const dlg = screen.getByText(/Tags — api-1/i).closest('[role="dialog"]') as HTMLElement;
    const inputs = dlg.querySelectorAll("input");
    await user.type(inputs[0], "env");
    await user.type(inputs[1], "dev");
    await clickButton(user, /Add tag/i);
    await waitFor(() =>
      expect(mockTagResource).toHaveBeenCalledWith(
        expect.objectContaining({ env: "dev" }),
        expect.any(Object),
      ),
    );
  });

  it("renders authorizers with empty data (no authorizers key in response)", async () => {
    const user = userEvent.setup();
    mockAuthorizers.mockReturnValue({ data: { total: 0 } });
    await openApi(user);
    await user.click(screen.getByRole("tab", { name: /Authorizers/i }));
    await waitFor(() => expect(screen.getByText("No authorizers")).toBeTruthy());
  });

  it("renders authorizer with falsy AuthorizerType (triggers || fallback)", async () => {
    const user = userEvent.setup();
    mockAuthorizers.mockReturnValue({
      data: { authorizers: [
        { AuthorizerId: "a-3", Name: "no-type", AuthorizerType: "", IdentitySource: "$h.x", AuthorizerUri: "arn:x" },
      ], total: 1 },
    });
    await openApi(user);
    await user.click(screen.getByRole("tab", { name: /Authorizers/i }));
    await waitFor(() => expect(screen.getByText("no-type")).toBeTruthy());
    // The type column should show "-" fallback
    expect(screen.getByText("-")).toBeTruthy();
  });

  it("renders models with empty data (no models key in response)", async () => {
    const user = userEvent.setup();
    mockModels.mockReturnValue({ data: { total: 0 } });
    await openApi(user);
    await user.click(screen.getByRole("tab", { name: /Models/i }));
    await waitFor(() => expect(screen.getByText("No models")).toBeTruthy());
  });

  it("renders model with falsy ContentType (triggers || fallback)", async () => {
    const user = userEvent.setup();
    mockModels.mockReturnValue({
      data: { models: [
        { ModelId: "m-3", Name: "no-ct", ContentType: "" },
      ], total: 1 },
    });
    await openApi(user);
    await user.click(screen.getByRole("tab", { name: /Models/i }));
    await waitFor(() => expect(screen.getByText("no-ct")).toBeTruthy());
    // The content type column should show "-" fallback
    expect(screen.getByText("-")).toBeTruthy();
  });

  it("creates a model with empty schema (trim || undefined on create)", async () => {
    const user = userEvent.setup();
    await openApi(user);
    await user.click(screen.getByRole("tab", { name: /Models/i }));
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByRole("dialog", { name: /Create model/i })).toBeTruthy());
    const dlg = screen.getByRole("dialog", { name: /Create model/i });
    const inputs = dlg.querySelectorAll("input");
    // Fill name but leave schema empty
    await user.type(inputs[0], "empty-schema-model");
    await clickButton(user, /Create/i, { last: true });
    await waitFor(() =>
      expect(mockCreateModel).toHaveBeenCalledWith(
        expect.objectContaining({ name: "empty-schema-model", schema: undefined }),
        expect.any(Object),
      ),
    );
  });

  it("adds a tag when tags data has no tags key (triggers || {} fallback)", async () => {
    const user = userEvent.setup();
    mockTags.mockReturnValue({ data: {} });
    mockTagResource.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
    await openApi(user);
    await clickButton(user, /Tags/i);
    await waitFor(() => expect(screen.getByText(/Tags — api-1/i)).toBeTruthy());
    const dlg = screen.getByText(/Tags — api-1/i).closest('[role="dialog"]') as HTMLElement;
    const inputs = dlg.querySelectorAll("input");
    await user.type(inputs[0], "env");
    await user.type(inputs[1], "prod");
    await clickButton(user, /Add tag/i);
    await waitFor(() =>
      expect(mockTagResource).toHaveBeenCalledWith(
        expect.objectContaining({ env: "prod" }),
        expect.any(Object),
      ),
    );
  });
});

// ─── Select onChange handler coverage ──────────────────────

describe("ApiGatewayV2Dashboard — Select onChange handlers", () => {
  beforeEach(() => {
    mockStages.mockReturnValue({ data: { stages: [], total: 0 } });
    mockDeployments.mockReturnValue({ data: { deployments: [], total: 0 } });
    mockAuthorizers.mockReturnValue({ data: { authorizers: [], total: 0 } });
    mockModels.mockReturnValue({ data: { models: [], total: 0 } });
    mockTags.mockReturnValue({ data: { tags: {} } });
    mockRouteResponses.mockReturnValue({ data: { routeResponses: [], total: 0 } });
    mockIntegrationResponses.mockReturnValue({ data: { integrationResponses: [], total: 0 } });
  });

  it("fires route auth type Select onChange", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ ApiId: "api-1", Name: "my-api", ProtocolType: "HTTP" }], total: 1 },
      isLoading: false,
    });
    mockRoutes.mockReturnValue({
      data: { routes: [{ RouteId: "r-1", RouteKey: "GET /path", AuthorizationType: "NONE", Target: "integ-1" }], total: 1 },
    });
    const user = userEvent.setup();
    render(<ApiGatewayV2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-api"));
    // Routes tab is default active — just click the tab to ensure it's rendered
    await user.click(screen.getByRole("tab", { name: /^Routes$/i }));
    await waitFor(() => expect(screen.getByText("GET /path")).toBeTruthy());
    // Click Edit on the route row
    const editButtons = screen.getAllByRole("button", { name: /Edit/i });
    await user.click(editButtons[0]);
    await waitFor(() => expect(screen.getByRole("heading", { name: /Edit route/i })).toBeTruthy());
    // Click the JWT option in the auth type Select
    const jwtBtn = document.querySelector('[data-testid="opt-JWT"]');
    expect(jwtBtn).toBeTruthy();
    fireEvent.click(jwtBtn!);
  });

  it("fires integration type Select onChange", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ ApiId: "api-1", Name: "my-api", ProtocolType: "HTTP" }], total: 1 },
      isLoading: false,
    });
    mockIntegrations.mockReturnValue({
      data: { integrations: [{ IntegrationId: "i-1", IntegrationType: "AWS_PROXY", IntegrationUri: "arn:aws:lambda:us-east-1:123:function:my-fn", IntegrationMethod: "POST" }], total: 1 },
    });
    const user = userEvent.setup();
    render(<ApiGatewayV2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-api"));
    await user.click(screen.getByRole("tab", { name: /^Integrations$/i }));
    await waitFor(() => expect(screen.getAllByText("AWS_PROXY").length).toBeGreaterThanOrEqual(1));
    // Click Edit on the integration row
    const editButtons = screen.getAllByRole("button", { name: /Edit/i });
    await user.click(editButtons[0]);
    await waitFor(() => expect(screen.getByRole("heading", { name: /Edit integration/i })).toBeTruthy());
    // Click the HTTP_PROXY option in the integration type Select
    const httpProxyBtn = document.querySelector('[data-testid="opt-HTTP_PROXY"]');
    expect(httpProxyBtn).toBeTruthy();
    fireEvent.click(httpProxyBtn!);
  });

  it("fires authorizer type Select onChange in create modal", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ ApiId: "api-1", Name: "my-api", ProtocolType: "HTTP" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<ApiGatewayV2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-api"));
    await user.click(screen.getByRole("tab", { name: /^Authorizers$/i }));
    await waitFor(() => expect(screen.getByText(/Authorizers in api-1/i)).toBeTruthy());
    await clickButton(user, /Create authorizer/i);
    await waitFor(() => expect(screen.getByRole("heading", { name: /Create authorizer/i })).toBeTruthy());
    // Click the JWT option in the authorizer type Select
    const jwtBtn = document.querySelector('[data-testid="opt-JWT"]');
    expect(jwtBtn).toBeTruthy();
    fireEvent.click(jwtBtn!);
  });

  it("fires authorizer type Select onChange in edit modal", async () => {
    mockApis.mockReturnValue({
      data: { apis: [{ ApiId: "api-1", Name: "my-api", ProtocolType: "HTTP" }], total: 1 },
      isLoading: false,
    });
    mockAuthorizers.mockReturnValue({
      data: { authorizers: [{ Id: "a-1", Name: "my-auth", AuthorizerType: "REQUEST", AuthorizerUri: "https://example.com/auth" }], total: 1 },
    });
    const user = userEvent.setup();
    render(<ApiGatewayV2Dashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-api"));
    await user.click(screen.getByRole("tab", { name: /Authorizers/i }));
    await waitFor(() => expect(screen.getByText("my-auth")).toBeTruthy());
    // Click Edit on the authorizer row
    const editButtons = screen.getAllByRole("button", { name: /Edit/i });
    await user.click(editButtons[0]);
    await waitFor(() => expect(screen.getByRole("heading", { name: /Edit authorizer/i })).toBeTruthy());
    // Click the JWT option in the authorizer type Select
    const jwtBtn = document.querySelector('[data-testid="opt-JWT"]');
    expect(jwtBtn).toBeTruthy();
    fireEvent.click(jwtBtn!);
  });
});
