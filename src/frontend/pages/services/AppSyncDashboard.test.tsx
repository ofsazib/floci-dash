// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
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
const mockFunctions = vi.fn();
const mockCreateFunc = vi.fn();
const mockDeleteFunc = vi.fn();
const mockApiKeys = vi.fn();
const mockCreateKey = vi.fn();
const mockDeleteKey = vi.fn();
const mockTypes = vi.fn();

vi.mock("../../hooks/useAppSync", () => ({
  useAppSyncApis: (...args: any[]) => mockApis(...args),
  useAppSyncApi: (...args: any[]) => mockApi(...args),
  useCreateAppSyncApi: () => ({
    mutate: mockCreateApi,
    isPending: false,
    isError: false,
    error: null,
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

vi.mock("../../components/Toast", () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

// ─── Setup ──────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
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
