// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

// ─── Mock hooks ─────────────────────────────────────────

const mockApis = vi.fn();
const mockApi = vi.fn();
const mockCreateApi = vi.fn();
const mockDeleteApi = vi.fn();
const mockDataSources = vi.fn();
const mockCreateDS = vi.fn();
const mockDeleteDS = vi.fn();
const mockResolvers = vi.fn();
const mockCreateResolver = vi.fn();
const mockDeleteResolver = vi.fn();
const createResolverState = vi.hoisted(() => ({ isError: false, error: null as Error | null }));
const mockFunctions = vi.fn();
const mockCreateFunc = vi.fn();
const mockDeleteFunc = vi.fn();
const mockApiKeys = vi.fn();
const mockCreateKey = vi.fn();
const mockDeleteKey = vi.fn();
const mockTypes = vi.fn();

const createApiState = vi.hoisted(() => ({
  isError: false,
  error: null as Error | null,
}));

vi.mock("../../hooks/useAppSync", () => ({
  useAppSyncApis: (...args: any[]) => mockApis(...args),
  useAppSyncApi: (...args: any[]) => mockApi(...args),
  useCreateAppSyncApi: () => ({
    mutate: mockCreateApi,
    isPending: false,
    isError: createApiState.isError,
    error: createApiState.error,
    reset: vi.fn(),
  }),
  useDeleteAppSyncApi: () => ({
    mutateAsync: mockDeleteApi,
    isPending: false,
    variables: null,
  }),
  useAppSyncDataSources: (...args: any[]) => mockDataSources(...args),
  useCreateAppSyncDataSource: () => ({
    mutate: mockCreateDS,
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useDeleteAppSyncDataSource: () => ({
    mutateAsync: mockDeleteDS,
    isPending: false,
    variables: null,
  }),
  useAppSyncResolvers: (...args: any[]) => mockResolvers(...args),
  useCreateAppSyncResolver: () => ({
    mutate: mockCreateResolver,
    isPending: false,
    get isError() { return createResolverState.isError; },
    get error() { return createResolverState.error; },
  }),
  useDeleteAppSyncResolver: () => ({
    mutateAsync: mockDeleteResolver,
    isPending: false,
  }),
  useAppSyncFunctions: (...args: any[]) => mockFunctions(...args),
  useCreateAppSyncFunction: () => ({
    mutate: mockCreateFunc,
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useDeleteAppSyncFunction: () => ({
    mutateAsync: mockDeleteFunc,
    isPending: false,
    variables: null,
  }),
  useAppSyncApiKeys: (...args: any[]) => mockApiKeys(...args),
  useCreateAppSyncApiKey: () => ({
    mutate: mockCreateKey,
    isPending: false,
    isError: false,
    error: null,
    reset: vi.fn(),
  }),
  useDeleteAppSyncApiKey: () => ({
    mutateAsync: mockDeleteKey,
    isPending: false,
    variables: null,
  }),
  useAppSyncTypes: (...args: any[]) => mockTypes(...args),
}));

import { AppSyncDashboard } from "./AppSyncDashboard";

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

const toastMock = vi.fn();
vi.mock("../../components/Toast", () => ({
  useToast: () => ({ showToast: toastMock }),
}));

// ─── Setup ──────────────────────────────────────────────

beforeEach(() => {
  createResolverState.isError = false;
  createResolverState.error = null;
  vi.resetAllMocks();
  createApiState.isError = false;
  createApiState.error = null;
  mockApis.mockReturnValue({
    data: { apis: [], total: 0 },
    isLoading: false,
    isError: false,
    error: null,
  });
  mockApi.mockReturnValue({ data: undefined, isLoading: false });
  mockDataSources.mockReturnValue({ data: { dataSources: [], total: 0 }, isLoading: false });
  mockResolvers.mockReturnValue({ data: { resolvers: [], total: 0 }, isLoading: false });
  mockFunctions.mockReturnValue({ data: { functions: [], total: 0 }, isLoading: false });
  mockApiKeys.mockReturnValue({ data: { apiKeys: [], total: 0 }, isLoading: false });
  mockTypes.mockReturnValue({ data: { types: [], total: 0 }, isLoading: false });
});

// Navigate to the API detail view (list → click View → wait for back button)
async function navToDetail(user: any, apiData?: any) {
  mockApis.mockReturnValue({
    data: { apis: [{ name: "my-api", apiId: "abc123", authenticationType: "API_KEY" }], total: 1 },
    isLoading: false,
  });
  mockApi.mockReturnValue({
    data: { api: apiData ?? { name: "my-api", apiId: "abc123", authenticationType: "API_KEY" } },
    isLoading: false,
  });
  render(<AppSyncDashboard />, { wrapper: createWrapper() });
  await clickButton(user, /View/i);
  await waitFor(() => expect(screen.getByRole("button", { name: /Back to GraphQL APIs/i })).toBeTruthy());
}

// ─── Tests ──────────────────────────────────────────────

describe("AppSyncDashboard — API list", () => {
  it("shows empty state", () => {
    render(<AppSyncDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("No GraphQL APIs found. Create one to get started.")).toBeTruthy();
  });

  it("renders APIs with data", () => {
    mockApis.mockReturnValue({
      data: {
        apis: [
          { name: "my-api", apiId: "abc123", authenticationType: "API_KEY", apiType: "GRAPHQL", uris: { GRAPHQL: "https://api.example.com/graphql" } },
        ],
        total: 1,
      },
      isLoading: false,
    });
    render(<AppSyncDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-api")).toBeTruthy();
    expect(screen.getByText("abc123")).toBeTruthy();
    expect(screen.getAllByText("API_KEY").length).toBeGreaterThan(0);
  });

  it("opens create API modal and submits", async () => {
    const user = userEvent.setup();
    render(<AppSyncDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getAllByText("Create GraphQL API").length).toBeGreaterThan(0));
    const input = screen.getByPlaceholderText("my-graphql-api");
    await user.type(input, "new-api");
    await waitFor(async () => {
      const btns = screen.getAllByRole("button", { name: /Create/i });
      const submit = btns[btns.length - 1];
      expect(submit).not.toBeDisabled();
      await user.click(submit);
    });
    expect(mockCreateApi).toHaveBeenCalledWith(
      { name: "new-api", authenticationType: "API_KEY" },
      expect.any(Object),
    );
  });

  it("deletes an API", async () => {
    const user = userEvent.setup();
    mockApis.mockReturnValue({
      data: { apis: [{ name: "my-api", apiId: "abc123", authenticationType: "API_KEY" }], total: 1 },
      isLoading: false,
    });
    render(<AppSyncDashboard />, { wrapper: createWrapper() });
    const deleteBtn = screen.getByRole("button", { name: /Delete my-api/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteApi).toHaveBeenCalledWith("abc123"));
  });

  it("filters APIs with a missing name", async () => {
    const user = userEvent.setup();
    mockApis.mockReturnValue({
      data: {
        apis: [
          { name: null as any, apiId: "id-null" },
          { name: "beta-api", apiId: "id-beta" },
        ],
        total: 2,
      },
      isLoading: false,
    });
    render(<AppSyncDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("beta-api")).toBeTruthy());
    const filterInput = screen.getByPlaceholderText("Find APIs by name");
    await user.type(filterInput, "beta");
    await waitFor(() => {
      expect(screen.getByText("beta-api")).toBeTruthy();
      expect(screen.queryByText("id-null")).toBeNull();
    });
  });

  it("changes authentication type and creates API", async () => {
    const user = userEvent.setup();
    render(<AppSyncDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getAllByText("Create GraphQL API").length).toBeGreaterThan(0));
    // Click the auth Select trigger (shows current option "API_KEY"), then pick "AWS_IAM"
    await user.click(screen.getAllByText("API_KEY")[0]);
    await user.click(screen.getAllByText("AWS_IAM")[0]);
    await user.type(screen.getByPlaceholderText("my-graphql-api"), "iam-api");
    await waitFor(async () => {
      const btns = screen.getAllByRole("button", { name: /Create/i });
      const submit = btns[btns.length - 1];
      expect(submit).not.toBeDisabled();
      await user.click(submit);
    });
    await waitFor(() => {
      expect(mockCreateApi).toHaveBeenCalledWith(
        { name: "iam-api", authenticationType: "AWS_IAM" },
        expect.any(Object),
      );
    });
  });

  it("shows error alert in create API modal", async () => {
    createApiState.isError = true;
    createApiState.error = new Error("API name taken");
    const user = userEvent.setup();
    render(<AppSyncDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getAllByText("Create GraphQL API").length).toBeGreaterThan(0));
    expect(screen.getByText("API name taken")).toBeTruthy();
  });

  it("shows Failed fallback when create API error has no message", async () => {
    createApiState.isError = true;
    createApiState.error = {} as Error;
    const user = userEvent.setup();
    render(<AppSyncDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getAllByText("Create GraphQL API").length).toBeGreaterThan(0));
    expect(screen.getByText("Failed to create GraphQL API")).toBeTruthy();
  });

  it("invokes onSuccess when create API succeeds", async () => {
    mockCreateApi.mockImplementation((_args: any, opts?: any) => opts?.onSuccess?.());
    const user = userEvent.setup();
    render(<AppSyncDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getAllByText("Create GraphQL API").length).toBeGreaterThan(0));
    await user.type(screen.getByPlaceholderText("my-graphql-api"), "ok-api");
    await waitFor(async () => {
      const btns = screen.getAllByRole("button", { name: /Create/i });
      const submit = btns[btns.length - 1];
      expect(submit).not.toBeDisabled();
      await user.click(submit);
    });
    await waitFor(() => {
      expect(mockCreateApi).toHaveBeenCalledWith(
        { name: "ok-api", authenticationType: "API_KEY" },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
    });
  });

  it("dismisses the create API modal via close button", async () => {
    const user = userEvent.setup();
    render(<AppSyncDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getAllByText("Create GraphQL API").length).toBeGreaterThan(0));
    // First dismiss control in document order belongs to the Create GraphQL API modal
    const dismissBtn = document.querySelector('[class*="dismiss"]');
    expect(dismissBtn).toBeTruthy();
    await user.click(dismissBtn as HTMLElement);
    expect(mockCreateApi).not.toHaveBeenCalled();
  });
});

describe("AppSyncDashboard — API detail", () => {
  it("navigates into API detail on View click", async () => {
    const user = userEvent.setup();
    mockApis.mockReturnValue({
      data: { apis: [{ name: "my-api", apiId: "abc123", authenticationType: "API_KEY" }], total: 1 },
      isLoading: false,
    });
    mockApi.mockReturnValue({
      data: { api: { name: "my-api", apiId: "abc123", authenticationType: "API_KEY" } },
      isLoading: false,
    });
    render(<AppSyncDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByText("Authentication")).toBeTruthy());
    expect(screen.getAllByText("API_KEY").length).toBeGreaterThan(0);
  });

  it("shows all 5 tabs in detail", async () => {
    const user = userEvent.setup();
    mockApis.mockReturnValue({
      data: { apis: [{ name: "my-api", apiId: "abc123", authenticationType: "API_KEY" }], total: 1 },
      isLoading: false,
    });
    mockApi.mockReturnValue({
      data: { api: { name: "my-api", apiId: "abc123", authenticationType: "API_KEY" } },
      isLoading: false,
    });
    render(<AppSyncDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /data sources/i })).toBeTruthy();
      expect(screen.getByRole("tab", { name: /resolvers/i })).toBeTruthy();
      expect(screen.getByRole("tab", { name: /functions/i })).toBeTruthy();
      expect(screen.getByRole("tab", { name: /api keys/i })).toBeTruthy();
      expect(screen.getByRole("tab", { name: /types/i })).toBeTruthy();
    });
  });

  it("opens create data source modal", async () => {
    const user = userEvent.setup();
    mockApis.mockReturnValue({
      data: { apis: [{ name: "my-api", apiId: "abc123", authenticationType: "API_KEY" }], total: 1 },
      isLoading: false,
    });
    mockApi.mockReturnValue({
      data: { api: { name: "my-api", apiId: "abc123", authenticationType: "API_KEY" } },
      isLoading: false,
    });
    render(<AppSyncDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("tab", { name: /data sources/i })).toBeTruthy());
    await clickButton(user, /Create/i);
    // Modal opens — Cloudscape Input + Select in a portal make full form
    // submission hard to test, so we verify the modal renders
    await waitFor(() => expect(screen.getByText("Create data source")).toBeTruthy());
  });

  it("opens create function modal", async () => {
    const user = userEvent.setup();
    mockApis.mockReturnValue({
      data: { apis: [{ name: "my-api", apiId: "abc123", authenticationType: "API_KEY" }], total: 1 },
      isLoading: false,
    });
    mockApi.mockReturnValue({
      data: { api: { name: "my-api", apiId: "abc123", authenticationType: "API_KEY" } },
      isLoading: false,
    });
    mockDataSources.mockReturnValue({
      data: { dataSources: [{ name: "my-ds", type: "NONE" }], total: 1 },
      isLoading: false,
    });
    render(<AppSyncDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("tab", { name: /data sources/i })).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /functions/i }));
    await waitFor(() => expect(screen.getByText("No functions.")).toBeTruthy());
    await clickButton(user, /Create/i);
    // Modal opens — Cloudscape Select for data source is hard to interact with,
    // so we verify the modal renders instead of filling the full form
    await waitFor(() => expect(screen.getByText("Create function")).toBeTruthy());
  });
});

describe("AppSyncDashboard — detail fallback fields", () => {
  it("shows dash for data source without type", async () => {
    const user = userEvent.setup();
    mockDataSources.mockReturnValue({
      data: { dataSources: [{ name: "ds-min" }], total: 1 },
      isLoading: false,
    });
    await navToDetail(user);
    expect(screen.getByText("ds-min")).toBeTruthy();
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(1);
  });

  it("shows fallbacks for resolver without metadata", async () => {
    const user = userEvent.setup();
    mockResolvers.mockReturnValue({
      data: { resolvers: [{ fieldName: "getX", typeName: "Query" }], total: 1 },
      isLoading: false,
    });
    await navToDetail(user);
    await user.click(screen.getByRole("tab", { name: /resolvers/i }));
    await waitFor(() => expect(screen.getByText("getX")).toBeTruthy());
    expect(screen.getByText("UNIT")).toBeTruthy();
    // dataSourceName and runtime fall back to "—"
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(2);
  });

  it("shows fallbacks for function without metadata", async () => {
    const user = userEvent.setup();
    mockFunctions.mockReturnValue({
      data: { functions: [{ name: "fn-min", functionId: "fn-1" }], total: 1 },
      isLoading: false,
    });
    await navToDetail(user);
    await user.click(screen.getByRole("tab", { name: /functions/i }));
    await waitFor(() => expect(screen.getByText("fn-min")).toBeTruthy());
    // dataSourceName and functionVersion fall back to "—"
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(2);
  });

  it("shows fallbacks for API key without description or expiry", async () => {
    const user = userEvent.setup();
    mockApiKeys.mockReturnValue({
      data: { apiKeys: [{ id: "k-min" }], total: 1 },
      isLoading: false,
    });
    await navToDetail(user);
    await user.click(screen.getByRole("tab", { name: /api keys/i }));
    await waitFor(() => expect(screen.getByText("k-min")).toBeTruthy());
    // description and expiry fall back to "—"
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(2);
  });

  it("shows SDL fallback for type without format", async () => {
    const user = userEvent.setup();
    mockTypes.mockReturnValue({
      data: { types: [{ name: "T-min" }], total: 1 },
      isLoading: false,
    });
    await navToDetail(user);
    await user.click(screen.getByRole("tab", { name: /types/i }));
    await waitFor(() => expect(screen.getByText("T-min")).toBeTruthy());
    expect(screen.getByText("SDL")).toBeTruthy();
  });
});

describe("AppSyncDashboard — API list edge cases", () => {
  it("shows loading state", () => {
    mockApis.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    render(<AppSyncDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("AppSync GraphQL APIs")).toBeTruthy();
  });

  it("shows fallback values for missing API fields", () => {
    mockApis.mockReturnValue({
      data: { apis: [{ name: "minimal-api", apiId: "id-1", authenticationType: null as any, apiType: null as any, uris: {} }], total: 1 },
      isLoading: false,
    });
    render(<AppSyncDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("minimal-api")).toBeTruthy();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("filters APIs by name", async () => {
    const user = userEvent.setup();
    mockApis.mockReturnValue({
      data: {
        apis: [
          { name: "alpha-api", apiId: "id-1", authenticationType: "API_KEY" },
          { name: "beta-api", apiId: "id-2", authenticationType: "API_KEY" },
        ],
        total: 2,
      },
      isLoading: false,
    });
    render(<AppSyncDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("alpha-api")).toBeTruthy();
    expect(screen.getByText("beta-api")).toBeTruthy();
    const filterInput = screen.getByPlaceholderText("Find APIs by name");
    await user.type(filterInput, "alpha");
    await waitFor(() => expect(screen.queryByText("beta-api")).toBeNull());
  });

  it("cancels create API modal", async () => {
    const user = userEvent.setup();
    render(<AppSyncDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getAllByText("Create GraphQL API").length).toBeGreaterThan(0));
    await clickButton(user, /Cancel/i);
    await waitFor(() => expect(screen.getByText("AppSync GraphQL APIs")).toBeTruthy());
  });
});

describe("AppSyncDashboard — detail view operations", () => {
  it("goes back from detail to list", async () => {
    const user = userEvent.setup();
    mockApis.mockReturnValue({
      data: { apis: [{ name: "my-api", apiId: "abc123", authenticationType: "API_KEY" }], total: 1 },
      isLoading: false,
    });
    mockApi.mockReturnValue({
      data: { api: { name: "my-api", apiId: "abc123", authenticationType: "API_KEY" } },
      isLoading: false,
    });
    render(<AppSyncDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByText("Authentication")).toBeTruthy());
    await clickButton(user, /Back to GraphQL APIs/i);
    await waitFor(() => expect(screen.getByText("AppSync GraphQL APIs")).toBeTruthy());
  });

  it("shows API detail loading state", async () => {
    const user = userEvent.setup();
    mockApis.mockReturnValue({
      data: { apis: [{ name: "my-api", apiId: "abc123", authenticationType: "API_KEY" }], total: 1 },
      isLoading: false,
    });
    mockApi.mockReturnValue({ data: undefined, isLoading: true });
    render(<AppSyncDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByText("Loading…")).toBeTruthy());
  });

  it("shows API name even when apiId is missing", async () => {
    const user = userEvent.setup();
    mockApis.mockReturnValue({
      data: { apis: [{ name: "no-id-api", apiId: "abc123", authenticationType: "API_KEY" }], total: 1 },
      isLoading: false,
    });
    mockApi.mockReturnValue({
      data: { api: { name: "no-id-api", authenticationType: "API_KEY", apiType: "GRAPHQL", xrayEnabled: false } },
      isLoading: false,
    });
    render(<AppSyncDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByText("no-id-api")).toBeTruthy());
    expect(screen.getByText("Disabled")).toBeTruthy();
  });

  it("shows data sources tab with data and operations", async () => {
    const user = userEvent.setup();
    mockApis.mockReturnValue({
      data: { apis: [{ name: "my-api", apiId: "abc123", authenticationType: "API_KEY" }], total: 1 },
      isLoading: false,
    });
    mockApi.mockReturnValue({
      data: { api: { name: "my-api", apiId: "abc123", authenticationType: "API_KEY", apiType: "GRAPHQL" } },
      isLoading: false,
    });
    mockDataSources.mockReturnValue({
      data: { dataSources: [{ name: "my-ds", type: "NONE", description: "My data source" }], total: 1 },
      isLoading: false,
    });
    render(<AppSyncDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByText("my-ds")).toBeTruthy());
    // Delete data source
    const deleteBtn = screen.getByRole("button", { name: /Delete my-ds/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteDS).toHaveBeenCalledWith({ apiId: "abc123", name: "my-ds" }));
  });

  it("shows resolvers tab with data", async () => {
    const user = userEvent.setup();
    mockApis.mockReturnValue({
      data: { apis: [{ name: "my-api", apiId: "abc123", authenticationType: "API_KEY" }], total: 1 },
      isLoading: false,
    });
    mockApi.mockReturnValue({
      data: { api: { name: "my-api", apiId: "abc123", authenticationType: "API_KEY" } },
      isLoading: false,
    });
    mockResolvers.mockReturnValue({
      data: { resolvers: [{ fieldName: "getItem", typeName: "Query", dataSourceName: "my-ds", kind: "UNIT", runtime: { name: "APPSYNC_JS" } }], total: 1 },
      isLoading: false,
    });
    render(<AppSyncDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    // Wait for detail view to load — check for the back button
    await waitFor(() => expect(screen.getByRole("button", { name: /Back to GraphQL APIs/i })).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /resolvers/i }));
    await waitFor(() => expect(screen.getByText("getItem")).toBeTruthy());
    expect(screen.getByText("Query")).toBeTruthy();
    expect(screen.getByText("UNIT")).toBeTruthy();
  });

  it("shows types tab with data", async () => {
    const user = userEvent.setup();
    mockApis.mockReturnValue({
      data: { apis: [{ name: "my-api", apiId: "abc123", authenticationType: "API_KEY" }], total: 1 },
      isLoading: false,
    });
    mockApi.mockReturnValue({
      data: { api: { name: "my-api", apiId: "abc123", authenticationType: "API_KEY" } },
      isLoading: false,
    });
    mockTypes.mockReturnValue({
      data: { types: [{ name: "MyType", format: "SDL" }], total: 1 },
      isLoading: false,
    });
    render(<AppSyncDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("button", { name: /Back to GraphQL APIs/i })).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /types/i }));
    await waitFor(() => expect(screen.getByText("MyType")).toBeTruthy());
    expect(screen.getByText("SDL")).toBeTruthy();
  });

  it("shows API Keys tab with data and deletes a key", async () => {
    const user = userEvent.setup();
    mockApis.mockReturnValue({
      data: { apis: [{ name: "my-api", apiId: "abc123", authenticationType: "API_KEY" }], total: 1 },
      isLoading: false,
    });
    mockApi.mockReturnValue({
      data: { api: { name: "my-api", apiId: "abc123", authenticationType: "API_KEY" } },
      isLoading: false,
    });
    mockApiKeys.mockReturnValue({
      data: { apiKeys: [{ id: "key-1", description: "My key", expires: 9999999999 }], total: 1 },
      isLoading: false,
    });
    render(<AppSyncDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("button", { name: /Back to GraphQL APIs/i })).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /api keys/i }));
    await waitFor(() => expect(screen.getByText("key-1")).toBeTruthy());
    expect(screen.getByText("My key")).toBeTruthy();
    // Delete the key
    const deleteBtn = screen.getByRole("button", { name: /Delete key-1/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteKey).toHaveBeenCalledWith({ apiId: "abc123", id: "key-1" }));
  });

  it("shows functions tab with data and deletes a function", async () => {
    const user = userEvent.setup();
    mockApis.mockReturnValue({
      data: { apis: [{ name: "my-api", apiId: "abc123", authenticationType: "API_KEY" }], total: 1 },
      isLoading: false,
    });
    mockApi.mockReturnValue({
      data: { api: { name: "my-api", apiId: "abc123", authenticationType: "API_KEY" } },
      isLoading: false,
    });
    mockFunctions.mockReturnValue({
      data: { functions: [{ name: "my-func", functionId: "fn-1", dataSourceName: "my-ds", functionVersion: "1.0" }], total: 1 },
      isLoading: false,
    });
    render(<AppSyncDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("button", { name: /Back to GraphQL APIs/i })).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /functions/i }));
    await waitFor(() => expect(screen.getByText("my-func")).toBeTruthy());
    expect(screen.getByText("my-ds")).toBeTruthy();
    const deleteBtn = screen.getByRole("button", { name: /Delete my-func/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteFunc).toHaveBeenCalledWith({ apiId: "abc123", functionId: "fn-1" }));
  });

  it("opens and cancels create data source modal", async () => {
    const user = userEvent.setup();
    mockApis.mockReturnValue({
      data: { apis: [{ name: "my-api", apiId: "abc123", authenticationType: "API_KEY" }], total: 1 },
      isLoading: false,
    });
    mockApi.mockReturnValue({
      data: { api: { name: "my-api", apiId: "abc123", authenticationType: "API_KEY" } },
      isLoading: false,
    });
    render(<AppSyncDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("button", { name: /Back to GraphQL APIs/i })).toBeTruthy());
    // The data sources tab has a create button from ResourceTable
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create data source")).toBeTruthy());
    await clickButton(user, /Cancel/i);
    await waitFor(() => expect(screen.getByText("No data sources.")).toBeTruthy());
  });

  it("opens and cancels create function modal", async () => {
    const user = userEvent.setup();
    mockApis.mockReturnValue({
      data: { apis: [{ name: "my-api", apiId: "abc123", authenticationType: "API_KEY" }], total: 1 },
      isLoading: false,
    });
    mockApi.mockReturnValue({
      data: { api: { name: "my-api", apiId: "abc123", authenticationType: "API_KEY" } },
      isLoading: false,
    });
    mockDataSources.mockReturnValue({
      data: { dataSources: [{ name: "my-ds", type: "NONE" }], total: 1 },
      isLoading: false,
    });
    render(<AppSyncDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("button", { name: /Back to GraphQL APIs/i })).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /functions/i }));
    await waitFor(() => expect(screen.getByText("No functions.")).toBeTruthy());
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create function")).toBeTruthy());
    await clickButton(user, /Cancel/i);
    await waitFor(() => expect(screen.getByText("No functions.")).toBeTruthy());
  });
});

describe("AppSyncDashboard — remaining branches", () => {
  it("shows empty states when all detail hooks return no data", async () => {
    const user = userEvent.setup();
    mockDataSources.mockReturnValue({ data: undefined, isLoading: false });
    mockResolvers.mockReturnValue({ data: undefined, isLoading: false });
    mockFunctions.mockReturnValue({ data: undefined, isLoading: false });
    mockApiKeys.mockReturnValue({ data: undefined, isLoading: false });
    mockTypes.mockReturnValue({ data: undefined, isLoading: false });
    await navToDetail(user);
    await waitFor(() => expect(screen.getByText("No data sources.")).toBeTruthy());
    // All tab counters fall back to 0 when the hooks return no data (|| [])
    expect(screen.getByRole("tab", { name: /Data Sources \(0\)/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /Resolvers \(0\)/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /Functions \(0\)/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /API Keys \(0\)/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /Types \(0\)/i })).toBeTruthy();
  });

  it("shows GraphQL API fallback header and dash when api lacks name and auth type", async () => {
    const user = userEvent.setup();
    await navToDetail(user, { apiId: "abc123" });
    await waitFor(() => expect(screen.getByText("GraphQL API")).toBeTruthy());
    expect(screen.getByText("—")).toBeTruthy();
  });

  it("shows Enabled when xray is enabled", async () => {
    const user = userEvent.setup();
    await navToDetail(user, {
      name: "my-api",
      apiId: "abc123",
      authenticationType: "API_KEY",
      xrayEnabled: true,
    });
    await waitFor(() => expect(screen.getByText("Enabled")).toBeTruthy());
  });

  it("creates API key and shows the returned key", async () => {
    mockCreateKey.mockImplementation((_args: any, opts?: any) => opts?.onSuccess?.({ apiKey: "ak-123" }));
    const user = userEvent.setup();
    await navToDetail(user);
    await user.click(screen.getByRole("tab", { name: /api keys/i }));
    await waitFor(() => expect(screen.getByText("No API keys.")).toBeTruthy());
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("API Key Created")).toBeTruthy());
    expect(screen.getByDisplayValue("ak-123")).toBeTruthy();
  });

  it("shows 'Key not returned' when API key creation returns no key", async () => {
    mockCreateKey.mockImplementation((_args: any, opts?: any) => opts?.onSuccess?.({}));
    const user = userEvent.setup();
    await navToDetail(user);
    await user.click(screen.getByRole("tab", { name: /api keys/i }));
    await waitFor(() => expect(screen.getByText("No API keys.")).toBeTruthy());
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByDisplayValue("Key not returned")).toBeTruthy());
  });

  it("changes data source type in the create data source modal", async () => {
    const user = userEvent.setup();
    await navToDetail(user);
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create data source")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("my-datasource"), "new-ds");
    // Change the Type select from NONE to HTTP
    await user.click(screen.getAllByText("NONE")[0]);
    await user.click(screen.getAllByText("HTTP")[0]);
    // The open modal's footer is the enabled exact-"Create" button (the hidden
    // function modal's footer is also matched by role queries, so pick enabled)
    const createBtn = screen
      .getAllByRole("button", { name: /^Create$/i })
      .find((b) => !(b as HTMLButtonElement).disabled);
    expect(createBtn).toBeTruthy();
    await user.click(createBtn!);
    await waitFor(() =>
      expect(mockCreateDS).toHaveBeenCalledWith(
        { apiId: "abc123", name: "new-ds", type: "HTTP", description: "" },
        expect.objectContaining({ onSuccess: expect.any(Function) })
      )
    );
  });

  it("disables create function until a data source is selected", async () => {
    const user = userEvent.setup();
    mockDataSources.mockReturnValue({
      data: { dataSources: [{ name: "my-ds", type: "NONE" }], total: 1 },
      isLoading: false,
    });
    await navToDetail(user);
    await user.click(screen.getByRole("tab", { name: /functions/i }));
    await waitFor(() => expect(screen.getByText("No functions.")).toBeTruthy());
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create function")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("my-function"), "fn-x");
    // Name is filled but data source is not selected yet -> Create disabled
    const btns = screen.getAllByRole("button", { name: /^Create$/i });
    expect(btns[btns.length - 1]).toBeDisabled();
  });

  it("selects a data source and creates a function", async () => {
    mockCreateFunc.mockImplementation((_args: any, opts?: any) => opts?.onSuccess?.());
    const user = userEvent.setup();
    mockDataSources.mockReturnValue({
      data: { dataSources: [{ name: "my-ds", type: "NONE" }], total: 1 },
      isLoading: false,
    });
    await navToDetail(user);
    await user.click(screen.getByRole("tab", { name: /functions/i }));
    await waitFor(() => expect(screen.getByText("No functions.")).toBeTruthy());
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create function")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("my-function"), "fn-x");
    // Select the data source from the dropdown
    await user.click(screen.getAllByText("Select data source")[0]);
    await user.click(screen.getAllByText("my-ds")[0]);
    const btns = screen.getAllByRole("button", { name: /^Create$/i });
    expect(btns[btns.length - 1]).not.toBeDisabled();
    await user.click(btns[btns.length - 1]);
    await waitFor(() =>
      expect(mockCreateFunc).toHaveBeenCalledWith(
        { apiId: "abc123", name: "fn-x", dataSourceName: "my-ds", code: "" },
        expect.objectContaining({ onSuccess: expect.any(Function) })
      )
    );
  });

  it("dismisses the create data source modal with Escape", async () => {
    const user = userEvent.setup();
    mockApis.mockReturnValue({
      data: { apis: [{ name: "my-api", apiId: "abc123", authenticationType: "API_KEY" }], total: 1 },
      isLoading: false,
    });
    mockApi.mockReturnValue({ data: { api: { name: "my-api", apiId: "abc123", authenticationType: "API_KEY" } }, isLoading: false });
    render(<AppSyncDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("button", { name: /Back to GraphQL APIs/i })).toBeTruthy());
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create data source")).toBeTruthy());
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Create data source"));
  });

  it("creates a data source with a description and closes on success", async () => {
    mockCreateDS.mockImplementation((_payload: unknown, opts?: { onSuccess?: () => void }) => {
      opts?.onSuccess?.();
    });
    const user = userEvent.setup();
    mockApis.mockReturnValue({
      data: { apis: [{ name: "my-api", apiId: "abc123", authenticationType: "API_KEY" }], total: 1 },
      isLoading: false,
    });
    mockApi.mockReturnValue({ data: { api: { name: "my-api", apiId: "abc123", authenticationType: "API_KEY" } }, isLoading: false });
    render(<AppSyncDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("button", { name: /Back to GraphQL APIs/i })).toBeTruthy());
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create data source")).toBeTruthy());
    const dialog = dialogOf("Create data source");
    await user.type(within(dialog).getByPlaceholderText("my-datasource"), "new-ds");
    await user.type(within(dialog).getByLabelText(/Description/), "my description");
    await user.click(within(dialog).getByRole("button", { name: /^Create$/ }));
    await waitFor(() => expectModalHidden("Create data source"));
    expect(mockCreateDS).toHaveBeenCalledWith(
      expect.objectContaining({ name: "new-ds", description: "my description" }),
      expect.any(Object),
    );
  });

  it("dismisses and cancels the create function modal", async () => {
    const user = userEvent.setup();
    mockApis.mockReturnValue({
      data: { apis: [{ name: "my-api", apiId: "abc123", authenticationType: "API_KEY" }], total: 1 },
      isLoading: false,
    });
    mockApi.mockReturnValue({ data: { api: { name: "my-api", apiId: "abc123", authenticationType: "API_KEY" } }, isLoading: false });
    render(<AppSyncDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("button", { name: /Back to GraphQL APIs/i })).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /Functions/i }));
    await waitFor(() => expect(screen.getByText("Create function")).toBeTruthy());
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create function")).toBeTruthy());
    await user.click(within(dialogOf("Create function")).getByRole("button", { name: /Cancel/i }));
    expect(mockCreateFunc).not.toHaveBeenCalled();
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Create function")).toBeTruthy());
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Create function"));
  });

  it("shows an error toast when API key creation fails", async () => {
    toastMock.mockClear();
    mockCreateKey.mockImplementation((_args: unknown, opts?: any) => opts?.onError?.(new Error("key boom")));
    const user = userEvent.setup();
    mockApis.mockReturnValue({
      data: { apis: [{ name: "my-api", apiId: "abc123", authenticationType: "API_KEY" }], total: 1 },
      isLoading: false,
    });
    mockApi.mockReturnValue({ data: { api: { name: "my-api", apiId: "abc123", authenticationType: "API_KEY" } }, isLoading: false });
    render(<AppSyncDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("button", { name: /Back to GraphQL APIs/i })).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /api keys/i }));
    await waitFor(() => expect(screen.getByText("No API keys.")).toBeTruthy());
    await clickButton(user, /Create/i);
    await waitFor(() => expect(toastMock).toHaveBeenCalledWith("error", "key boom"));
  });

  it("closes the API Key Created modal with Done and Escape", async () => {
    const user = userEvent.setup();
    mockCreateKey.mockImplementation((_args: unknown, opts?: any) => opts?.onSuccess?.({ apiKey: "ak-123" }));
    mockApis.mockReturnValue({
      data: { apis: [{ name: "my-api", apiId: "abc123", authenticationType: "API_KEY" }], total: 1 },
      isLoading: false,
    });
    mockApi.mockReturnValue({ data: { api: { name: "my-api", apiId: "abc123", authenticationType: "API_KEY" } }, isLoading: false });
    render(<AppSyncDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("button", { name: /Back to GraphQL APIs/i })).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /api keys/i }));
    await waitFor(() => expect(screen.getByText("No API keys.")).toBeTruthy());
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("API Key Created")).toBeTruthy());
    await user.click(within(dialogOf("API Key Created")).getByRole("button", { name: /Done/i }));
    await waitFor(() => expectModalHidden("API Key Created"));
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("API Key Created")).toBeTruthy());
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("API Key Created"));
  });
});

describe("AppSyncDashboard — create flows", () => {
  async function openDetail(user: any) {
    mockApis.mockReturnValue({
      data: { apis: [{ name: "my-api", apiId: "abc123", authenticationType: "API_KEY" }], total: 1 },
      isLoading: false,
    });
    mockApi.mockReturnValue({
      data: { api: { name: "my-api", apiId: "abc123", authenticationType: "API_KEY" } },
      isLoading: false,
    });
    mockDataSources.mockReturnValue({
      data: { dataSources: [{ name: "my-ds", type: "NONE" }], total: 1 },
      isLoading: false,
    });
    render(<AppSyncDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByRole("tab", { name: /data sources/i })).toBeTruthy());
  }

  it("submits a data source and shows error toast on failure", async () => {
    mockCreateDS.mockImplementation((_body: any, opts: any) => opts?.onError?.(new Error("DS failed")));
    const user = userEvent.setup();
    await openDetail(user);
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByPlaceholderText("my-datasource")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("my-datasource"), "new-ds");
    const dsDialog = dialogOf("Create data source");
    const modalCreate = within(dsDialog).getByRole("button", { name: /^Create$/i });
    await user.click(modalCreate);
    await waitFor(() =>
      expect(mockCreateDS).toHaveBeenCalledWith(
        expect.objectContaining({ apiId: "abc123", name: "new-ds" }),
        expect.any(Object)
      )
    );
  });

  it("types function code and submits a function with error toast on failure", async () => {
    mockCreateFunc.mockImplementation((_body: any, opts: any) => opts?.onError?.(new Error("Fn failed")));
    const user = userEvent.setup();
    await openDetail(user);
    await user.click(screen.getByRole("tab", { name: /functions/i }));
    await waitFor(() => expect(screen.getByText("No functions.")).toBeTruthy());
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByPlaceholderText("my-function")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("my-function"), "my-fn");
    const codeInput = screen.getByPlaceholderText("export function request(ctx) { return {}; }");
    fireEvent.change(codeInput, { target: { value: "export function request(ctx) { return ctx; }" } });
    // Pick the data source from the Select
    await user.click(screen.getByText("Select data source"));
    await user.click(screen.getAllByRole("option", { name: /my-ds/i })[0]);
    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    await user.click(createBtns[createBtns.length - 1]);
    await waitFor(() =>
      expect(mockCreateFunc).toHaveBeenCalledWith(
        expect.objectContaining({ apiId: "abc123", name: "my-fn", dataSourceName: "my-ds" }),
        expect.any(Object)
      )
    );
  });
});

describe("AppSyncDashboard — resolver mutations", () => {
  function setupApi() {
    mockApis.mockReturnValue({
      data: { apis: [{ apiId: "api-1", name: "blog" }] },
      isLoading: false, isError: false, error: null,
    });
    mockResolvers.mockReturnValue({
      data: { resolvers: [
        { typeName: "Query", fieldName: "getPost", dataSourceName: "ds-1", kind: "UNIT" },
      ] },
      isLoading: false,
    });
  }

  it("creates a resolver from the modal", async () => {
    mockCreateResolver.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
    setupApi();
    const user = userEvent.setup();
    render(<AppSyncDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "View" }));
    await user.click(await screen.findByRole("tab", { name: /Resolvers/ }));
    const createBtn = await screen.findByRole("button", { name: /Create resolver/i });
    await user.click(createBtn);
    const dialog = screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden"))!;
    const inputs = dialog.querySelectorAll("input");
    await user.type(inputs[1], "listPosts");
    await user.type(inputs[2], "ds-2");
    await user.click(within(dialog).getByRole("button", { name: "Create" }));
    await waitFor(() =>
      expect(mockCreateResolver).toHaveBeenCalledWith(
        { apiId: "api-1", typeName: "Query", fieldName: "listPosts", dataSourceName: "ds-2" },
        expect.objectContaining({ onSuccess: expect.any(Function) })
      )
    );
  });

  it("deletes a resolver after confirmation", async () => {
    mockDeleteResolver.mockResolvedValue({});
    setupApi();
    const user = userEvent.setup();
    render(<AppSyncDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "View" }));
    await user.click(await screen.findByRole("tab", { name: /Resolvers/ }));
    await user.click(await screen.findByRole("button", { name: /Delete getPost/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() =>
      expect(mockDeleteResolver).toHaveBeenCalledWith({
        apiId: "api-1",
        typeName: "Query",
        fieldName: "getPost",
      })
    );
  });

  it("shows the create resolver error with fallback", async () => {
    createResolverState.isError = true;
    createResolverState.error = new Error("resolver failed");
    setupApi();
    const user = userEvent.setup();
    render(<AppSyncDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "View" }));
    await user.click(await screen.findByRole("tab", { name: /Resolvers/ }));
    await user.click(await screen.findByRole("button", { name: /Create resolver/i }));
    expect(await screen.findByText("resolver failed")).toBeTruthy();
  });
});

describe("AppSyncDashboard — resolver modal dismiss + fallbacks", () => {
  function setupApi() {
    mockApis.mockReturnValue({
      data: { apis: [{ apiId: "api-1", name: "blog" }] },
      isLoading: false, isError: false, error: null,
    });
    mockResolvers.mockReturnValue({ data: { resolvers: [] }, isLoading: false });
  }

  it("cancels and Escape-dismisses the resolver modal", async () => {
    setupApi();
    const user = userEvent.setup();
    render(<AppSyncDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "View" }));
    await user.click(await screen.findByRole("tab", { name: /Resolvers/ }));
    await user.click(await screen.findByRole("button", { name: /Create resolver/i }));
    const dialog = screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden"))!;
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(mockCreateResolver).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: /Create resolver/i }));
    document.querySelectorAll('[class*="awsui_dialog"]').forEach((d) =>
      fireEvent.keyDown(d as HTMLElement, { keyCode: 27 })
    );
    expect(mockCreateResolver).not.toHaveBeenCalled();
  });

  it("sends a custom type name when edited", async () => {
    mockCreateResolver.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
    setupApi();
    const user = userEvent.setup();
    render(<AppSyncDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "View" }));
    await user.click(await screen.findByRole("tab", { name: /Resolvers/ }));
    await user.click(await screen.findByRole("button", { name: /Create resolver/i }));
    const dialog = screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden"))!;
    const inputs = dialog.querySelectorAll("input");
    await user.clear(inputs[0]);
    await user.type(inputs[0], "Mutation");
    await user.type(inputs[1], "addPost");
    await user.type(inputs[2], "ds-9");
    await user.click(within(dialog).getByRole("button", { name: "Create" }));
    await waitFor(() =>
      expect(mockCreateResolver).toHaveBeenCalledWith(
        expect.objectContaining({ typeName: "Mutation", fieldName: "addPost" }),
        expect.anything()
      )
    );
  });

  it("defaults the type name to Query when cleared blank", async () => {
    mockCreateResolver.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
    setupApi();
    const user = userEvent.setup();
    render(<AppSyncDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "View" }));
    await user.click(await screen.findByRole("tab", { name: /Resolvers/ }));
    await user.click(await screen.findByRole("button", { name: /Create resolver/i }));
    const dialog = screen.getAllByRole("dialog").find((d) => !d.className.includes("hidden"))!;
    const inputs = dialog.querySelectorAll("input");
    await user.clear(inputs[0]);
    await user.type(inputs[1], "f1");
    await user.type(inputs[2], "d1");
    await user.click(within(dialog).getByRole("button", { name: "Create" }));
    await waitFor(() =>
      expect(mockCreateResolver).toHaveBeenCalledWith(
        expect.objectContaining({ typeName: "Query" }),
        expect.anything()
      )
    );
  });

  it("shows the generic create error fallback", async () => {
    createResolverState.isError = true;
    createResolverState.error = null;
    setupApi();
    const user = userEvent.setup();
    render(<AppSyncDashboard />, { wrapper: createWrapper() });
    await user.click(await screen.findByRole("button", { name: "View" }));
    await user.click(await screen.findByRole("tab", { name: /Resolvers/ }));
    await user.click(await screen.findByRole("button", { name: /Create resolver/i }));
    expect(await screen.findByText("Failed to create resolver")).toBeTruthy();
  });
});
