// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

// ─── vi.hoisted mutable states ──────────────────────────

const createFnState = vi.hoisted(() => ({
  isPending: false,
  isError: false,
  error: null as Error | null,
}));

const deleteFnState = vi.hoisted(() => ({
  isPending: false,
  variables: null as string | null,
}));

const createLayerState = vi.hoisted(() => ({
  isPending: false,
  isError: false,
  error: null as Error | null,
}));

const deleteLayerState = vi.hoisted(() => ({
  isPending: false,
  variables: null as string | null,
}));

const invokeFnState = vi.hoisted(() => ({
  isPending: false,
  isError: false,
  error: null as Error | null,
  data: null as any,
}));

const publishVerState = vi.hoisted(() => ({
  isPending: false,
}));

const addPermState = vi.hoisted(() => ({ isPending: false, isError: false, error: null as Error | null }));
const removePermState = vi.hoisted(() => ({ isPending: false, variables: null as string | null, isError: false, error: null as Error | null }));
const createEsmState = vi.hoisted(() => ({ isPending: false, isError: false, error: null as Error | null }));
const updateEsmState = vi.hoisted(() => ({ isPending: false, isError: false, error: null as Error | null }));
const updateAliasState = vi.hoisted(() => ({ isPending: false, isError: false, error: null as Error | null }));

// ─── Mock hooks ─────────────────────────────────────────

const mockFunctions = vi.fn();
const mockCreateFn = vi.fn();
const mockDeleteFn = vi.fn();
const mockFnDetail = vi.fn();
const mockVersions = vi.fn();
const mockAliases = vi.fn();
const mockEsm = vi.fn();
const mockLayers = vi.fn();
const mockDeleteLayer = vi.fn();
const mockCreateLayer = vi.fn();
const mockPublishVersion = vi.fn();
const mockInvokeFn = vi.fn();
const mockPolicyQuery = vi.fn();
const mockAddPermission = vi.fn();
const mockRemovePermission = vi.fn();
const mockCreateEsm = vi.fn();
const mockUpdateEsm = vi.fn();
const mockUpdateAlias = vi.fn();

vi.mock("../../hooks/useLambda", () => ({
  useLambdaFunctions: (...args: any[]) => mockFunctions(...args),
  useCreateFunction: () => ({
    mutate: mockCreateFn,
    get isPending() { return createFnState.isPending; },
    get isError() { return createFnState.isError; },
    get error() { return createFnState.error; },
  }),
  useDeleteFunction: () => ({
    mutateAsync: mockDeleteFn,
    get isPending() { return deleteFnState.isPending; },
    get variables() { return deleteFnState.variables; },
  }),
  useLambdaFunction: (...args: any[]) => mockFnDetail(...args),
  useLambdaVersions: (...args: any[]) => mockVersions(...args),
  usePublishVersion: () => ({
    mutate: mockPublishVersion,
    get isPending() { return publishVerState.isPending; },
  }),
  useLambdaAliases: (...args: any[]) => mockAliases(...args),
  useEventSourceMappings: (...args: any[]) => mockEsm(...args),
  useLambdaLayers: (...args: any[]) => mockLayers(...args),
  useDeleteLayerVersion: () => ({
    mutateAsync: mockDeleteLayer,
    get isPending() { return deleteLayerState.isPending; },
    get variables() { return deleteLayerState.variables; },
  }),
  useCreateLayerVersion: () => ({
    mutate: mockCreateLayer,
    get isPending() { return createLayerState.isPending; },
    get isError() { return createLayerState.isError; },
    get error() { return createLayerState.error; },
  }),
  useInvokeFunction: () => ({
    mutate: mockInvokeFn,
    get isPending() { return invokeFnState.isPending; },
    get isError() { return invokeFnState.isError; },
    get error() { return invokeFnState.error; },
    get data() { return invokeFnState.data; },
  }),
  useFunctionUrl: () => ({ data: null }),
  useFunctionConcurrency: () => ({ data: null }),
  useEventInvokeConfig: () => ({ data: null }),
  useCodeSigningConfig: () => ({ data: null }),
  useCreateFunctionUrl: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateFunctionUrl: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteFunctionUrl: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useSetFunctionConcurrency: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteFunctionConcurrency: () => ({ mutate: vi.fn(), isPending: false }),
  usePutEventInvokeConfig: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteEventInvokeConfig: () => ({ mutate: vi.fn(), isPending: false }),
  useAttachCodeSigningConfig: () => ({ mutate: vi.fn(), isPending: false }),
  useDetachCodeSigningConfig: () => ({ mutate: vi.fn(), isPending: false }),
  useLambdaPolicy: (...args: any[]) => mockPolicyQuery(...args),
  useAddLambdaPermission: () => ({
    mutateAsync: mockAddPermission,
    get isPending() { return addPermState.isPending; },
    get isError() { return addPermState.isError; },
    get error() { return addPermState.error; },
    reset: vi.fn(),
  }),
  useRemoveLambdaPermission: () => ({
    mutateAsync: mockRemovePermission,
    get isPending() { return removePermState.isPending; },
    get variables() { return removePermState.variables; },
    get isError() { return removePermState.isError; },
    get error() { return removePermState.error; },
    reset: vi.fn(),
  }),
  useCreateEventSourceMapping: () => ({
    mutateAsync: mockCreateEsm,
    get isPending() { return createEsmState.isPending; },
    get isError() { return createEsmState.isError; },
    get error() { return createEsmState.error; },
    reset: vi.fn(),
  }),
  useUpdateEventSourceMapping: () => ({
    mutateAsync: mockUpdateEsm,
    get isPending() { return updateEsmState.isPending; },
    get isError() { return updateEsmState.isError; },
    get error() { return updateEsmState.error; },
    reset: vi.fn(),
  }),
  useUpdateLambdaAlias: () => ({
    mutateAsync: mockUpdateAlias,
    get isPending() { return updateAliasState.isPending; },
    get isError() { return updateAliasState.isError; },
    get error() { return updateAliasState.error; },
    reset: vi.fn(),
  }),
}));

import { LambdaDashboard } from "./LambdaDashboard";

// ─── Modal helpers ───────────────────────────────────────

/** Fire Escape on every mounted Cloudscape dialog (they stay mounted when hidden). */
function dismissModalWithEscape() {
  document.querySelectorAll('[class*="awsui_dialog"]').forEach((dialog) => {
    fireEvent.keyDown(dialog as HTMLElement, { keyCode: 27 });
  });
}

/** Locate a modal dialog by its header text. */
function dialogOf(headerText: string | RegExp): HTMLElement {
  const header = screen.getAllByText(headerText).find((h) => h.closest('[role="dialog"]'));
  return header!.closest('[role="dialog"]') as HTMLElement;
}

/** Assert the modal with the given header is hidden (Cloudscape uses display:none). */
function expectModalHidden(headerText: string | RegExp) {
  expect(dialogOf(headerText).className).toContain("hidden");
}

beforeEach(() => {
  vi.clearAllMocks();
  createFnState.isPending = false;
  createFnState.isError = false;
  createFnState.error = null;
  deleteFnState.isPending = false;
  deleteFnState.variables = null;
  createLayerState.isPending = false;
  createLayerState.isError = false;
  createLayerState.error = null;
  deleteLayerState.isPending = false;
  deleteLayerState.variables = null;
  invokeFnState.isPending = false;
  invokeFnState.isError = false;
  invokeFnState.error = null;
  invokeFnState.data = null;
  publishVerState.isPending = false;

  addPermState.isPending = false;
  addPermState.isError = false;
  addPermState.error = null;
  removePermState.isPending = false;
  removePermState.variables = null;
  removePermState.isError = false;
  removePermState.error = null;
  createEsmState.isPending = false;
  createEsmState.isError = false;
  createEsmState.error = null;
  updateEsmState.isPending = false;
  updateEsmState.isError = false;
  updateEsmState.error = null;
  updateAliasState.isPending = false;
  updateAliasState.isError = false;
  updateAliasState.error = null;
  mockAddPermission.mockResolvedValue({});
  mockRemovePermission.mockResolvedValue({});
  mockCreateEsm.mockResolvedValue({});
  mockUpdateEsm.mockResolvedValue({});
  mockUpdateAlias.mockResolvedValue({});
  mockPolicyQuery.mockReturnValue({
    data: { policy: null, revisionId: null },
    isLoading: false,
  });

  mockFunctions.mockReturnValue({ data: { functions: [], total: 0 }, isLoading: false, isError: false, error: null });
  mockLayers.mockReturnValue({ data: { layers: [], total: 0 }, isLoading: false, isError: false, error: null });
  mockFnDetail.mockReturnValue({ data: undefined, isLoading: false, isError: false, error: null });
  mockVersions.mockReturnValue({ data: { versions: [], total: 0 } });
  mockAliases.mockReturnValue({ data: { aliases: [], total: 0 } });
  mockEsm.mockReturnValue({ data: { eventSourceMappings: [], total: 0 } });
});

describe("LambdaDashboard — functions tab", () => {
  it("shows functions and layers tabs", () => {
    render(<LambdaDashboard />, { wrapper: createWrapper() });
    expect(screen.getByRole("tab", { name: /Functions/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /Layers/i })).toBeTruthy();
  });

  it("shows loading skeleton", () => {
    mockFunctions.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    const { container } = render(<LambdaDashboard />, { wrapper: createWrapper() });
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });

  it("shows empty message for functions", () => {
    render(<LambdaDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText(/No functions found/i)).toBeTruthy();
  });

  it("renders functions with data", () => {
    mockFunctions.mockReturnValue({
      data: {
        functions: [{ name: "my-fn", runtime: "nodejs22.x", handler: "index.handler", timeout: 3, memorySize: 128, state: "Active", lastModified: "2024-01-15T00:00:00Z" }],
        total: 1,
      },
      isLoading: false, isError: false, error: null,
    });
    render(<LambdaDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-fn")).toBeTruthy();
    expect(screen.getAllByText("nodejs22.x").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("index.handler")).toBeTruthy();
  });

  it("shows dash for missing fields", () => {
    mockFunctions.mockReturnValue({
      data: { functions: [{ name: "bare-fn", state: "Active" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    render(<LambdaDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("bare-fn")).toBeTruthy();
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it("shows Failed state indicator", () => {
    mockFunctions.mockReturnValue({
      data: { functions: [{ name: "failed-fn", state: "Failed" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    render(<LambdaDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Failed")).toBeTruthy();
  });

  it("shows function load error", () => {
    mockFunctions.mockReturnValue({
      data: undefined, isLoading: false, isError: true,
      error: new Error("Failed to load functions"),
    });
    render(<LambdaDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Failed to load functions")).toBeTruthy();
  });

  it("opens create function modal and submits", async () => {
    const user = userEvent.setup();
    const { container } = render(<LambdaDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(container.textContent).toContain("Create Function"));
    const nameInput = screen.getByPlaceholderText("my-function");
    await user.type(nameInput, "new-fn");
    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    await user.click(createBtns[createBtns.length - 1]);
    await waitFor(() => {
      expect(mockCreateFn).toHaveBeenCalledWith(
        expect.objectContaining({ name: "new-fn" }),
        expect.any(Object),
      );
    });
  });

  it("cancels create function modal", async () => {
    const user = userEvent.setup();
    const { container } = render(<LambdaDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(container.textContent).toContain("Create Function"));
    await clickButton(user, /Cancel/i);
    expect(mockCreateFn).not.toHaveBeenCalled();
  });

  it("shows create function loading state", () => {
    createFnState.isPending = true;
    mockFunctions.mockReturnValue({
      data: { functions: [{ name: "my-fn", state: "Active" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    render(<LambdaDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("my-fn")).toBeTruthy();
  });

  it("shows create function error alert", async () => {
    createFnState.isError = true;
    createFnState.error = new Error("Creation failed");
    const user = userEvent.setup();
    render(<LambdaDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => {
      expect(screen.getByText("Creation failed")).toBeTruthy();
    });
  });

  it("shows delete function loading state", () => {
    deleteFnState.isPending = true;
    deleteFnState.variables = "del-fn";
    mockFunctions.mockReturnValue({
      data: { functions: [{ name: "del-fn", state: "Active" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    render(<LambdaDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("del-fn")).toBeTruthy();
  });

  it("deletes a function", async () => {
    mockFunctions.mockReturnValue({
      data: { functions: [{ name: "delete-me", state: "Active" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<LambdaDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("delete-me")).toBeTruthy());
    const deleteBtn = screen.getByRole("button", { name: /Delete delete-me/i });
    await user.click(deleteBtn);
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteFn).toHaveBeenCalledWith("delete-me"));
  });

  it("filters functions by name", async () => {
    mockFunctions.mockReturnValue({
      data: {
        functions: [
          { name: "alpha-fn", state: "Active" },
          { name: "beta-fn", state: "Active" },
        ],
        total: 2,
      },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<LambdaDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("alpha-fn")).toBeTruthy());
    const filterInput = screen.getByPlaceholderText("Find functions by name");
    await user.type(filterInput, "beta");
    await waitFor(() => expect(screen.queryByText("alpha-fn")).toBeNull());
  });

  // ─── Detail view ────────────────────────────────────────

  it("navigates to function detail view", async () => {
    mockFunctions.mockReturnValue({
      data: { functions: [{ name: "my-fn", runtime: "nodejs22.x", handler: "index.handler", state: "Active", timeout: 3, memorySize: 128, lastModified: "2024-01-15T00:00:00Z" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockFnDetail.mockReturnValue({
      data: { configuration: { runtime: "nodejs22.x", handler: "index.handler", timeout: 3, memorySize: 128, state: "Active", codeSize: 1024, lastModified: "2024-01-15T00:00:00Z" } },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<LambdaDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("my-fn"));
    await user.click(screen.getByText("my-fn"));
    await waitFor(() => expect(screen.getByText(/Back to Functions/i)).toBeTruthy());
  });

  it("shows detail config with tabs", async () => {
    mockFunctions.mockReturnValue({
      data: { functions: [{ name: "my-fn", state: "Active" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockFnDetail.mockReturnValue({
      data: { configuration: { runtime: "nodejs22.x", handler: "index.handler", timeout: 5, memorySize: 256, state: "Active", codeSize: 2048, lastModified: "2024-06-15T12:00:00Z" } },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<LambdaDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("my-fn"));
    await user.click(screen.getByText("my-fn"));
    await waitFor(() => {
      expect(screen.getByText("nodejs22.x")).toBeTruthy();
      expect(screen.getByText(/Back to Functions/i)).toBeTruthy();
    });
  });

  it("shows config N/A for missing fields and failed state", async () => {
    mockFunctions.mockReturnValue({
      data: { functions: [{ name: "my-fn", state: "Active" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockFnDetail.mockReturnValue({
      data: { configuration: { state: "Failed" } },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<LambdaDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-fn"));
    await waitFor(() => {
      expect(screen.getAllByText("N/A").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Failed")).toBeTruthy();
    });
  });

  it("shows detail loading state", async () => {
    mockFunctions.mockReturnValue({
      data: { functions: [{ name: "my-fn", state: "Active" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockFnDetail.mockReturnValue({
      data: undefined, isLoading: true, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<LambdaDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-fn"));
    await waitFor(() => {
      expect(screen.getByText(/Loading function details/i)).toBeTruthy();
    });
  });

  it("shows detail error state", async () => {
    mockFunctions.mockReturnValue({
      data: { functions: [{ name: "my-fn", state: "Active" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockFnDetail.mockReturnValue({
      data: undefined, isLoading: false, isError: true,
      error: new Error("Detail load failed"),
    });
    const user = userEvent.setup();
    render(<LambdaDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-fn"));
    await waitFor(() => {
      expect(screen.getByText("Detail load failed")).toBeTruthy();
    });
  });

  it("shows detail versions tab with data", async () => {
    mockFunctions.mockReturnValue({
      data: { functions: [{ name: "my-fn", state: "Active" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockFnDetail.mockReturnValue({
      data: { configuration: { runtime: "nodejs22.x", handler: "index.handler", state: "Active" } },
      isLoading: false, isError: false, error: null,
    });
    mockVersions.mockReturnValue({
      data: { versions: [{ version: "1", lastModified: "2024-01-15T00:00:00Z", codeSize: 1024, description: "Initial version" }], total: 1 },
    });
    const user = userEvent.setup();
    render(<LambdaDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("my-fn"));
    await user.click(screen.getByText("my-fn"));
    await waitFor(() => expect(screen.getByRole("tab", { name: /Versions/ })).toBeTruthy());
  });

  it("shows detail version dashes for missing fields", async () => {
    mockFunctions.mockReturnValue({
      data: { functions: [{ name: "my-fn", state: "Active" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockFnDetail.mockReturnValue({
      data: { configuration: { runtime: "nodejs22.x", handler: "index.handler", state: "Active" } },
      isLoading: false, isError: false, error: null,
    });
    mockVersions.mockReturnValue({
      data: { versions: [{ }], total: 1 },
    });
    const user = userEvent.setup();
    render(<LambdaDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-fn"));
    await user.click(screen.getByRole("tab", { name: /Versions/ }));
    await waitFor(() => {
      const dashes = screen.getAllByText("—");
      expect(dashes.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("shows detail aliases tab with data", async () => {
    mockFunctions.mockReturnValue({
      data: { functions: [{ name: "my-fn", state: "Active" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockFnDetail.mockReturnValue({
      data: { configuration: { runtime: "nodejs22.x", handler: "index.handler", state: "Active" } },
      isLoading: false, isError: false, error: null,
    });
    mockAliases.mockReturnValue({
      data: { aliases: [{ name: "prod", functionVersion: "1", description: "Prod alias" }], total: 1 },
    });
    const user = userEvent.setup();
    render(<LambdaDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-fn"));
    await user.click(screen.getByRole("tab", { name: /Aliases/ }));
    await waitFor(() => expect(screen.getByText("prod")).toBeTruthy());
  });

  it("shows detail triggers tab with data", async () => {
    mockFunctions.mockReturnValue({
      data: { functions: [{ name: "my-fn", state: "Active" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockFnDetail.mockReturnValue({
      data: { configuration: { runtime: "nodejs22.x", handler: "index.handler", state: "Active" } },
      isLoading: false, isError: false, error: null,
    });
    mockEsm.mockReturnValue({
      data: { eventSourceMappings: [{ eventSourceArn: "arn:aws:sqs:...", state: "Enabled", batchSize: 10, lastProcessingResult: "OK" }], total: 1 },
    });
    const user = userEvent.setup();
    render(<LambdaDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-fn"));
    await user.click(screen.getByRole("tab", { name: /Triggers/ }));
    await waitFor(() => expect(screen.getByText("arn:aws:sqs:...")).toBeTruthy());
  });

  it("shows detail invoke tab with error alert", async () => {
    mockFunctions.mockReturnValue({
      data: { functions: [{ name: "my-fn", state: "Active" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockFnDetail.mockReturnValue({
      data: { configuration: { runtime: "nodejs22.x", handler: "index.handler", state: "Active" } },
      isLoading: false, isError: false, error: null,
    });
    invokeFnState.isError = true;
    invokeFnState.error = new Error("Invoke failed");
    const user = userEvent.setup();
    render(<LambdaDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-fn"));
    await user.click(screen.getByRole("tab", { name: /Test/ }));
    await waitFor(() => expect(screen.getByText("Invoke failed")).toBeTruthy());
  });

  it("shows detail invoke response data", async () => {
    mockFunctions.mockReturnValue({
      data: { functions: [{ name: "my-fn", state: "Active" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockFnDetail.mockReturnValue({
      data: { configuration: { runtime: "nodejs22.x", handler: "index.handler", state: "Active" } },
      isLoading: false, isError: false, error: null,
    });
    invokeFnState.data = { statusCode: 200, functionError: undefined };
    const user = userEvent.setup();
    render(<LambdaDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-fn"));
    await user.click(screen.getByRole("tab", { name: /Test/ }));
    await waitFor(() => expect(screen.getByText(/200/)).toBeTruthy());
  });

  it("shows invoke response with functionError", async () => {
    mockFunctions.mockReturnValue({
      data: { functions: [{ name: "my-fn", state: "Active" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockFnDetail.mockReturnValue({
      data: { configuration: { runtime: "nodejs22.x", handler: "index.handler", state: "Active" } },
      isLoading: false, isError: false, error: null,
    });
    invokeFnState.data = { statusCode: 500, functionError: "Unhandled" };
    const user = userEvent.setup();
    render(<LambdaDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-fn"));
    await user.click(screen.getByRole("tab", { name: /Test/ }));
    await waitFor(() => {
      expect(screen.getByText(/Unhandled/)).toBeTruthy();
    });
  });

  it("shows publish version loading state", async () => {
    publishVerState.isPending = true;
    mockFunctions.mockReturnValue({
      data: { functions: [{ name: "my-fn", state: "Active" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockFnDetail.mockReturnValue({
      data: { configuration: { runtime: "nodejs22.x", handler: "index.handler", state: "Active" } },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<LambdaDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-fn"));
    await waitFor(() => expect(screen.getByText(/Publish version/)).toBeTruthy());
  });

  it("goes back from detail to list", async () => {
    mockFunctions.mockReturnValue({
      data: { functions: [{ name: "my-fn", state: "Active" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockFnDetail.mockReturnValue({
      data: { configuration: { runtime: "nodejs22.x", handler: "index.handler", state: "Active" } },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<LambdaDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("my-fn"));
    await user.click(screen.getByText("my-fn"));
    await waitFor(() => expect(screen.getByText(/Back to Functions/i)).toBeTruthy());
    await user.click(screen.getByText(/Back to Functions/i));
    await waitFor(() => expect(screen.getByText("my-fn")).toBeTruthy());
  });

  it("shows detail config with architecture", async () => {
    mockFunctions.mockReturnValue({
      data: { functions: [{ name: "my-fn", state: "Active" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockFnDetail.mockReturnValue({
      data: { configuration: { runtime: "nodejs22.x", handler: "index.handler", timeout: 3, memorySize: 256, state: "Active", codeSize: 2048, lastModified: "2024-01-15T00:00:00Z", architectures: ["arm64"] } },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<LambdaDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-fn"));
    await waitFor(() => expect(screen.getByText("arm64")).toBeTruthy());
  });
});

describe("LambdaDashboard — layers tab", () => {
  it("shows layers tab", () => {
    render(<LambdaDashboard />, { wrapper: createWrapper() });
    expect(screen.getByRole("tab", { name: /Layers/i })).toBeTruthy();
  });

  it("shows empty message for layers", async () => {
    const user = userEvent.setup();
    render(<LambdaDashboard />, { wrapper: createWrapper() });
    const layersTab = screen.getByRole("tab", { name: /Layers/i });
    await user.click(layersTab);
    await waitFor(() => expect(screen.getByText(/No layers found/i)).toBeTruthy());
  });

  it("renders layers with data", async () => {
    mockLayers.mockReturnValue({
      data: {
        layers: [{ name: "my-layer", arn: "arn:aws:lambda:...", latestVersion: { version: 1, description: "My layer", codeSize: 512, compatibleRuntimes: ["nodejs22.x"] } }],
        total: 1,
      },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<LambdaDashboard />, { wrapper: createWrapper() });
    const layersTab = screen.getByRole("tab", { name: /Layers/i });
    await user.click(layersTab);
    await waitFor(() => expect(screen.getByText("my-layer")).toBeTruthy());
    expect(screen.getByText("1")).toBeTruthy();
    expect(screen.getAllByText("nodejs22.x").length).toBeGreaterThanOrEqual(1);
  });

  it("shows load error for layers", async () => {
    mockLayers.mockReturnValue({
      data: undefined, isLoading: false, isError: true,
      error: new Error("Failed to load layers"),
    });
    const user = userEvent.setup();
    render(<LambdaDashboard />, { wrapper: createWrapper() });
    const layersTab = screen.getByRole("tab", { name: /Layers/i });
    await user.click(layersTab);
    await waitFor(() => expect(screen.getByText("Failed to load layers")).toBeTruthy());
  });

  it("shows dash for missing layer fields", async () => {
    mockLayers.mockReturnValue({
      data: { layers: [{ name: "bare-layer", arn: "arn:..." }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<LambdaDashboard />, { wrapper: createWrapper() });
    const layersTab = screen.getByRole("tab", { name: /Layers/i });
    await user.click(layersTab);
    await waitFor(() => expect(screen.getByText("bare-layer")).toBeTruthy());
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it("shows delete layer loading state", async () => {
    deleteLayerState.isPending = true;
    deleteLayerState.variables = "my-layer:1";
    mockLayers.mockReturnValue({
      data: { layers: [{ name: "my-layer", arn: "arn:...", latestVersion: { version: 1 } }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<LambdaDashboard />, { wrapper: createWrapper() });
    const layersTab = screen.getByRole("tab", { name: /Layers/i });
    await user.click(layersTab);
    await waitFor(() => expect(screen.getByText("my-layer")).toBeTruthy());
  });

  it("filters layers by name", async () => {
    mockLayers.mockReturnValue({
      data: {
        layers: [
          { name: "alpha-layer", arn: "arn:alpha" },
          { name: "beta-layer", arn: "arn:beta" },
        ],
        total: 2,
      },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<LambdaDashboard />, { wrapper: createWrapper() });
    const layersTab = screen.getByRole("tab", { name: /Layers/i });
    await user.click(layersTab);
    await waitFor(() => expect(screen.getByText("alpha-layer")).toBeTruthy());
    const filterInput = screen.getByPlaceholderText("Find layers by name");
    await user.type(filterInput, "beta");
    await waitFor(() => expect(screen.queryByText("alpha-layer")).toBeNull());
  });
});

// ─── Remaining branch targets ───────────────────────────

describe("LambdaDashboard — remaining branches", () => {
  const fnListWith = (functions: any[]) =>
    mockFunctions.mockReturnValue({
      data: { functions, total: functions.length },
      isLoading: false, isError: false, error: null,
    });

  const defaultDetail = () =>
    mockFnDetail.mockReturnValue({
      data: { configuration: { runtime: "nodejs22.x", handler: "index.handler", state: "Active" } },
      isLoading: false, isError: false, error: null,
    });

  const openDetail = async (user: any) => {
    await waitFor(() => expect(screen.getByText("my-fn")).toBeTruthy());
    await user.click(screen.getByText("my-fn"));
    await waitFor(() => expect(screen.getByText(/Back to Functions/i)).toBeTruthy());
  };

  it("shows fallback message when function load error has no message", () => {
    mockFunctions.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: undefined });
    render(<LambdaDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Failed to load functions")).toBeTruthy();
  });

  it("shows Active fallback for unknown function state", () => {
    fnListWith([{ name: "pending-fn", state: undefined }]);
    render(<LambdaDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("pending-fn")).toBeTruthy();
    expect(screen.getByText("Active")).toBeTruthy();
  });

  it("shows fallback create function error message", async () => {
    createFnState.isError = true;
    createFnState.error = new Error("");
    const user = userEvent.setup();
    render(<LambdaDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Failed to create function")).toBeTruthy());
  });

  it("changes runtime select in create function modal", async () => {
    fnListWith([{ name: "my-fn", state: "Active" }]);
    const user = userEvent.setup();
    render(<LambdaDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("nodejs22.x")).toBeTruthy());
    await user.click(screen.getByText("nodejs22.x"));
    await user.click(screen.getByText("python3.12"));
    const nameInput = screen.getByPlaceholderText("my-function");
    await user.type(nameInput, "rt-fn");
    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    await user.click(createBtns[createBtns.length - 1]);
    await waitFor(() => {
      expect(mockCreateFn).toHaveBeenCalledWith(
        expect.objectContaining({ name: "rt-fn", runtime: "python3.12" }),
        expect.any(Object),
      );
    });
  });

  it("updates timeout and memory in create function modal", async () => {
    const user = userEvent.setup();
    const { container } = render(<LambdaDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(container.textContent).toContain("Create Function"));
    const nameInput = screen.getByPlaceholderText("my-function");
    await user.type(nameInput, "cfg-fn");
    const timeoutInput = screen.getByLabelText("Timeout (seconds)");
    fireEvent.change(timeoutInput, { target: { value: "5" } });
    const memInput = screen.getByLabelText("Memory (MB)");
    fireEvent.change(memInput, { target: { value: "256" } });
    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    await user.click(createBtns[createBtns.length - 1]);
    await waitFor(() => {
      expect(mockCreateFn).toHaveBeenCalledWith(
        expect.objectContaining({ name: "cfg-fn", timeout: 5, memorySize: 256 }),
        expect.any(Object),
      );
    });
  });

  it("falls back to default timeout and memory when cleared", async () => {
    const user = userEvent.setup();
    const { container } = render(<LambdaDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(container.textContent).toContain("Create Function"));
    const nameInput = screen.getByPlaceholderText("my-function");
    await user.type(nameInput, "cfg-fn2");
    fireEvent.change(screen.getByLabelText("Timeout (seconds)"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("Memory (MB)"), { target: { value: "" } });
    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    await user.click(createBtns[createBtns.length - 1]);
    await waitFor(() => {
      expect(mockCreateFn).toHaveBeenCalledWith(
        expect.objectContaining({ name: "cfg-fn2", timeout: 3, memorySize: 128 }),
        expect.any(Object),
      );
    });
  });

  it("shows fallback detail error message", async () => {
    fnListWith([{ name: "my-fn", state: "Active" }]);
    mockFnDetail.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: undefined });
    const user = userEvent.setup();
    render(<LambdaDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("my-fn"));
    await user.click(screen.getByText("my-fn"));
    await waitFor(() => expect(screen.getByText("Failed to load")).toBeTruthy());
  });

  it("returns null when detail data is undefined without loading or error", async () => {
    fnListWith([{ name: "my-fn", state: "Active" }]);
    mockFnDetail.mockReturnValue({ data: undefined, isLoading: false, isError: false, error: null });
    const user = userEvent.setup();
    render(<LambdaDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("my-fn"));
    await user.click(screen.getByText("my-fn"));
    await waitFor(() => {
      expect(screen.queryByText(/Back to Functions/i)).toBeNull();
    });
  });

  it("shows Active fallback for unknown config state", async () => {
    fnListWith([{ name: "my-fn", state: "Active" }]);
    mockFnDetail.mockReturnValue({ data: { configuration: { state: undefined } }, isLoading: false, isError: false, error: null });
    const user = userEvent.setup();
    render(<LambdaDashboard />, { wrapper: createWrapper() });
    await openDetail(user);
    await waitFor(() => expect(screen.getByText("Active")).toBeTruthy());
  });

  it("shows fallback invoke error message", async () => {
    fnListWith([{ name: "my-fn", state: "Active" }]);
    defaultDetail();
    invokeFnState.isError = true;
    invokeFnState.error = new Error("");
    const user = userEvent.setup();
    render(<LambdaDashboard />, { wrapper: createWrapper() });
    await openDetail(user);
    await user.click(screen.getByRole("tab", { name: /Test/ }));
    await waitFor(() => expect(screen.getByText("Invocation failed")).toBeTruthy());
  });

  it("shows empty versions when versions key missing", async () => {
    fnListWith([{ name: "my-fn", state: "Active" }]);
    defaultDetail();
    mockVersions.mockReturnValue({ data: { total: 0 } });
    const user = userEvent.setup();
    render(<LambdaDashboard />, { wrapper: createWrapper() });
    await openDetail(user);
    await user.click(screen.getByRole("tab", { name: /Versions/ }));
    await waitFor(() => expect(screen.getByText("No published versions")).toBeTruthy());
  });

  it("shows version details when present", async () => {
    fnListWith([{ name: "my-fn", state: "Active" }]);
    defaultDetail();
    mockVersions.mockReturnValue({ data: { versions: [{ version: "2", lastModified: "2024-02-15T00:00:00Z", codeSize: 2048, description: "v2" }], total: 1 } });
    const user = userEvent.setup();
    render(<LambdaDashboard />, { wrapper: createWrapper() });
    await openDetail(user);
    await user.click(screen.getByRole("tab", { name: /Versions/ }));
    await waitFor(() => expect(screen.getByText("2")).toBeTruthy());
    expect(screen.getByText("v2")).toBeTruthy();
    expect(screen.getByText(/KB/)).toBeTruthy();
  });

  it("shows empty aliases when aliases key missing", async () => {
    fnListWith([{ name: "my-fn", state: "Active" }]);
    defaultDetail();
    mockAliases.mockReturnValue({ data: { total: 0 } });
    const user = userEvent.setup();
    render(<LambdaDashboard />, { wrapper: createWrapper() });
    await openDetail(user);
    await user.click(screen.getByRole("tab", { name: /Aliases/ }));
    await waitFor(() => expect(screen.getByText("No aliases")).toBeTruthy());
  });

  it("shows dashes for sparse aliases", async () => {
    fnListWith([{ name: "my-fn", state: "Active" }]);
    defaultDetail();
    mockAliases.mockReturnValue({ data: { aliases: [{}], total: 1 } });
    const user = userEvent.setup();
    render(<LambdaDashboard />, { wrapper: createWrapper() });
    await openDetail(user);
    await user.click(screen.getByRole("tab", { name: /Aliases/ }));
    await waitFor(() => {
      const dashes = screen.getAllByText("—");
      expect(dashes.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("shows empty triggers when esm key missing", async () => {
    fnListWith([{ name: "my-fn", state: "Active" }]);
    defaultDetail();
    mockEsm.mockReturnValue({ data: { total: 0 } });
    const user = userEvent.setup();
    render(<LambdaDashboard />, { wrapper: createWrapper() });
    await openDetail(user);
    await user.click(screen.getByRole("tab", { name: /Triggers/ }));
    await waitFor(() => expect(screen.getByText("No event source mappings")).toBeTruthy());
  });

  it("shows Enabling and dashes for sparse triggers", async () => {
    fnListWith([{ name: "my-fn", state: "Active" }]);
    defaultDetail();
    mockEsm.mockReturnValue({ data: { eventSourceMappings: [{}], total: 1 } });
    const user = userEvent.setup();
    render(<LambdaDashboard />, { wrapper: createWrapper() });
    await openDetail(user);
    await user.click(screen.getByRole("tab", { name: /Triggers/ }));
    await waitFor(() => expect(screen.getByText("Enabling")).toBeTruthy());
  });

  it("shows fallback layers error message", async () => {
    mockLayers.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: undefined });
    const user = userEvent.setup();
    render(<LambdaDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Layers/i }));
    await waitFor(() => expect(screen.getByText("Failed to load layers")).toBeTruthy());
  });

  it("creates a layer version with description and license", async () => {
    const user = userEvent.setup();
    const { container } = render(<LambdaDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Layers/i }));
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByPlaceholderText("my-layer")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("my-layer"), "layer-1");
    await user.type(screen.getByPlaceholderText("Optional description"), "my desc");
    await user.type(screen.getByPlaceholderText("Optional license info"), "MIT");
    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    await user.click(createBtns[createBtns.length - 1]);
    await waitFor(() => {
      expect(mockCreateLayer).toHaveBeenCalledWith(
        expect.objectContaining({ name: "layer-1", description: "my desc", licenseInfo: "MIT", compatibleRuntimes: ["nodejs22.x"] }),
        expect.any(Object),
      );
    });
  });

  it("creates a layer version without description or license", async () => {
    const user = userEvent.setup();
    const { container } = render(<LambdaDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Layers/i }));
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByPlaceholderText("my-layer")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("my-layer"), "layer-2");
    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    await user.click(createBtns[createBtns.length - 1]);
    await waitFor(() => {
      expect(mockCreateLayer).toHaveBeenCalledWith(
        expect.objectContaining({ name: "layer-2", description: undefined, licenseInfo: undefined }),
        expect.any(Object),
      );
    });
  });

  it("shows create layer error alert", async () => {
    createLayerState.isError = true;
    createLayerState.error = new Error("Layer create failed");
    const user = userEvent.setup();
    render(<LambdaDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Layers/i }));
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Layer create failed")).toBeTruthy());
  });

  it("shows fallback create layer error message", async () => {
    createLayerState.isError = true;
    createLayerState.error = new Error("");
    const user = userEvent.setup();
    render(<LambdaDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Layers/i }));
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByText("Failed to create layer")).toBeTruthy());
  });

  it("changes compatible runtime select in create layer modal", async () => {
    const user = userEvent.setup();
    const { container } = render(<LambdaDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Layers/i }));
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByPlaceholderText("my-layer")).toBeTruthy());
    await user.click(screen.getByText("nodejs22.x"));
    await user.click(screen.getByText("python3.13"));
    await user.type(screen.getByPlaceholderText("my-layer"), "layer-3");
    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    await user.click(createBtns[createBtns.length - 1]);
    await waitFor(() => {
      expect(mockCreateLayer).toHaveBeenCalledWith(
        expect.objectContaining({ name: "layer-3", compatibleRuntimes: ["python3.13"] }),
        expect.any(Object),
      );
    });
  });

  it("types handler and description in create function modal", async () => {
    const user = userEvent.setup();
    const { container } = render(<LambdaDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(container.textContent).toContain("Create Function"));
    await user.type(screen.getByPlaceholderText("my-function"), "cfg-fn");
    const handlerInput = screen.getByPlaceholderText("index.handler");
    await user.clear(handlerInput);
    await user.type(handlerInput, "app.handler");
    await user.type(screen.getByPlaceholderText("Optional description"), "My function");
    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    await user.click(createBtns[createBtns.length - 1]);
    await waitFor(() => {
      expect(mockCreateFn).toHaveBeenCalledWith(
        expect.objectContaining({ name: "cfg-fn", handler: "app.handler", description: "My function" }),
        expect.any(Object),
      );
    });
  });

  it("dismisses create function modal with Escape", async () => {
    const user = userEvent.setup();
    const { container } = render(<LambdaDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(container.textContent).toContain("Create Function"));
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Create function"));
  });

  it("closes create function modal on success", async () => {
    mockCreateFn.mockImplementation((_body: any, opts: any) => opts?.onSuccess?.());
    const user = userEvent.setup();
    const { container } = render(<LambdaDashboard />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => expect(container.textContent).toContain("Create Function"));
    await user.type(screen.getByPlaceholderText("my-function"), "ok-fn");
    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    await user.click(createBtns[createBtns.length - 1]);
    await waitFor(() => expectModalHidden("Create function"));
  });

  it("invokes a function with a typed payload", async () => {
    mockFunctions.mockReturnValue({
      data: { functions: [{ name: "my-fn", state: "Active" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockFnDetail.mockReturnValue({
      data: { configuration: { runtime: "nodejs22.x", handler: "index.handler", state: "Active" } },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<LambdaDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-fn"));
    await user.click(screen.getByRole("tab", { name: /Test/ }));
    await waitFor(() => expect(screen.getByRole("button", { name: /Invoke/i })).toBeTruthy());
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: '{"hello":"world"}' } });
    await user.click(screen.getByRole("button", { name: /Invoke/i }));
    await waitFor(() =>
      expect(mockInvokeFn).toHaveBeenCalledWith({ name: "my-fn", payload: '{"hello":"world"}' })
    );
  });

  it("publishes a function version", async () => {
    mockFunctions.mockReturnValue({
      data: { functions: [{ name: "my-fn", state: "Active" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockFnDetail.mockReturnValue({
      data: { configuration: { runtime: "nodejs22.x", handler: "index.handler", state: "Active" } },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<LambdaDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-fn"));
    await waitFor(() => expect(screen.getByRole("button", { name: /Publish version/i })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Publish version/i }));
    await waitFor(() => expect(mockPublishVersion).toHaveBeenCalledWith({ name: "my-fn" }));
  });

  it("deletes a layer version after confirmation", async () => {
    mockLayers.mockReturnValue({
      data: { layers: [{ name: "my-layer", arn: "arn:...", latestVersion: { version: 2, description: "L", codeSize: 512, compatibleRuntimes: ["nodejs22.x"] } }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<LambdaDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Layers/i }));
    await waitFor(() => expect(screen.getByText("my-layer")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete my-layer:2/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() =>
      expect(mockDeleteLayer).toHaveBeenCalledWith({ name: "my-layer", version: 2 })
    );
  });

  it("dismisses create layer modal with Escape", async () => {
    const user = userEvent.setup();
    render(<LambdaDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Layers/i }));
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByPlaceholderText("my-layer")).toBeTruthy());
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Create layer version"));
  });

  it("cancels create layer modal and closes on success", async () => {
    mockCreateLayer.mockImplementation((_body: any, opts: any) => opts?.onSuccess?.());
    const user = userEvent.setup();
    render(<LambdaDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Layers/i }));
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByPlaceholderText("my-layer")).toBeTruthy());
    await clickButton(user, /Cancel/i, { last: true });
    await waitFor(() => expectModalHidden("Create layer version"));
    // Reopen and submit with onSuccess
    await clickButton(user, /Create/i);
    await waitFor(() => expect(screen.getByPlaceholderText("my-layer")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("my-layer"), "ok-layer");
    const createBtns = screen.getAllByRole("button", { name: /^Create$/i });
    await user.click(createBtns[createBtns.length - 1]);
    await waitFor(() => expectModalHidden("Create layer version"));
  });
});

// ─── G.63: permissions / triggers / alias edit ──────────

describe("LambdaDashboard — G.63 detail features", () => {
  function setupDetail() {
    mockFunctions.mockReturnValue({
      data: { functions: [{ name: "my-fn", runtime: "nodejs22.x", handler: "index.handler", state: "Active" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockFnDetail.mockReturnValue({
      data: { configuration: { runtime: "nodejs22.x", handler: "index.handler", timeout: 3, memorySize: 128, state: "Active" } },
      isLoading: false, isError: false, error: null,
    });
    return userEvent.setup();
  }

  async function openTab(user: ReturnType<typeof userEvent.setup>, tabName: RegExp) {
    render(<LambdaDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("my-fn"));
    await user.click(screen.getByText("my-fn"));
    await waitFor(() => expect(screen.getByText(/Back to Functions/i)).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: tabName }));
  }

  it("renders Permissions tab with empty state when no policy", async () => {
    const user = setupDetail();
    await openTab(user, /^Permissions/);
    await waitFor(() =>
      expect(screen.getByText(/No policy statements/i)).toBeTruthy()
    );
  });

  it("renders policy statements with service and ARN principals", async () => {
    const user = setupDetail();
    mockPolicyQuery.mockReturnValue({
      data: {
        policy: {
          Statement: [
            { Sid: "s1", Effect: "Allow", Principal: { Service: "s3.amazonaws.com" }, Action: "lambda:InvokeFunction" },
            { Sid: "s2", Effect: "Allow", Principal: "arn:aws:iam::123:role/r", Action: ["lambda:InvokeFunction", "lambda:GetFunction"] },
            { Sid: "s3", Effect: "Deny", Principal: { AWS: "arn:aws:iam::456:user/u" }, Action: "lambda:InvokeFunction" },
          ],
        },
        revisionId: "rev-1",
      },
      isLoading: false,
    });
    await openTab(user, /^Permissions \(3\)/);
    await waitFor(() => {
      expect(screen.getByText("s1")).toBeTruthy();
      expect(screen.getByText("s3.amazonaws.com")).toBeTruthy();
      expect(screen.getAllByText(/arn:aws:iam/).length).toBeGreaterThan(0);
    });
  });

  it("adds a permission with trimmed fields and clears optionals", async () => {
    const user = setupDetail();
    await openTab(user, /^Permissions/);
    await clickButton(user, /Create permission|Add/i);
    await waitFor(() => expect(screen.getByText("Add permission")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("s3-invoke-access"), " stmt-1 ");
    await user.type(screen.getByPlaceholderText("s3.amazonaws.com"), " s3.amazonaws.com ");
    await user.click(screen.getAllByRole("button", { name: /^Add$/i }).slice(-1)[0]);
    await waitFor(() =>
      expect(mockAddPermission).toHaveBeenCalledWith({
        statementId: "stmt-1",
        principal: "s3.amazonaws.com",
        action: "lambda:InvokeFunction",
        sourceArn: undefined,
        sourceAccount: undefined,
      })
    );
    await waitFor(() => expectModalHidden("Add permission"));
  });

  it("adds a permission with source arn and account", async () => {
    const user = setupDetail();
    await openTab(user, /^Permissions/);
    await clickButton(user, /Create permission|Add/i);
    await user.type(screen.getByPlaceholderText("s3-invoke-access"), "s1");
    await user.type(screen.getByPlaceholderText("s3.amazonaws.com"), "sns.amazonaws.com");
    await user.type(screen.getByPlaceholderText("arn:aws:s3:::my-bucket"), "arn:aws:sns:::t");
    await user.type(screen.getByPlaceholderText("123456789012"), "123456789012");
    await user.click(screen.getAllByRole("button", { name: /^Add$/i }).slice(-1)[0]);
    await waitFor(() =>
      expect(mockAddPermission).toHaveBeenCalledWith({
        statementId: "s1",
        principal: "sns.amazonaws.com",
        action: "lambda:InvokeFunction",
        sourceArn: "arn:aws:sns:::t",
        sourceAccount: "123456789012",
      })
    );
  });

  it("disables Add until statementId and principal typed", async () => {
    const user = setupDetail();
    await openTab(user, /^Permissions/);
    await clickButton(user, /Create permission|Add/i);
    const addBtn = screen
      .getAllByRole("button", { name: /^Add$/i })
      .slice(-1)[0] as HTMLButtonElement;
    expect(addBtn.disabled).toBe(true);
    await user.type(screen.getByPlaceholderText("s3-invoke-access"), "s1");
    expect(addBtn.disabled).toBe(true);
    await user.type(screen.getByPlaceholderText("s3.amazonaws.com"), "p");
    expect(addBtn.disabled).toBe(false);
  });

  it("cancels the add-permission modal", async () => {
    const user = setupDetail();
    await openTab(user, /^Permissions/);
    await clickButton(user, /Create permission|Add/i);
    await user.click(screen.getAllByRole("button", { name: /^Cancel$/i }).slice(-1)[0]);
    await waitFor(() => expectModalHidden("Add permission"));
  });

  it("removes a permission via delete confirmation", async () => {
    const user = setupDetail();
    mockPolicyQuery.mockReturnValue({
      data: { policy: { Statement: [{ Sid: "kill-me", Effect: "Allow", Principal: "p", Action: "a" }] } },
      isLoading: false,
    });
    await openTab(user, /^Permissions \(1\)/);
    await user.click(screen.getByRole("button", { name: /Delete kill-me/i }));
    const confirm = await screen.findByRole("button", { name: /Delete$/i });
    await user.click(confirm);
    await waitFor(() => expect(mockRemovePermission).toHaveBeenCalledWith("kill-me"));
  });

  it("shows add-permission error alert and dismisses", async () => {
    const user = setupDetail();
    addPermState.isError = true;
    addPermState.error = new Error("perm denied");
    await openTab(user, /^Permissions/);
    expect(screen.getByText(/perm denied/i)).toBeTruthy();
    const dismiss = document.querySelector('[class*="awsui_dismiss-button"]') as HTMLElement;
    await user.click(dismiss);
  });

  it("shows add-permission fallback message for message-less errors", async () => {
    const user = setupDetail();
    addPermState.isError = true;
    addPermState.error = new Error("");
    await openTab(user, /^Permissions/);
    expect(screen.getByText(/Failed to add permission/i)).toBeTruthy();
  });

  it("shows remove-permission error alert with fallback", async () => {
    const user = setupDetail();
    removePermState.isError = true;
    removePermState.error = new Error("");
    await openTab(user, /^Permissions/);
    expect(screen.getByText(/Failed to remove permission/i)).toBeTruthy();
  });

  it("shows remove not-loading when variables differ", async () => {
    const user = setupDetail();
    removePermState.isPending = true;
    removePermState.variables = "other";
    mockPolicyQuery.mockReturnValue({
      data: { policy: { Statement: [{ Sid: "s1", Effect: "Allow", Principal: "p", Action: "a" }] } },
      isLoading: false,
    });
    await openTab(user, /^Permissions \(1\)/);
    expect(screen.getByText("s1")).toBeTruthy();
  });

  it("creates a trigger from the Triggers tab", async () => {
    const user = setupDetail();
    await openTab(user, /^Triggers/);
    await clickButton(user, /Create trigger/i);
    await waitFor(() =>
      expect(screen.getByText("Create event source mapping")).toBeTruthy()
    );
    const dlg = () => within(dialogOf("Create event source mapping"));
    await user.type(
      dlg().getByPlaceholderText("arn:aws:sqs:us-east-1:123456789012:my-queue"),
      "arn:aws:sqs:us-east-1::q"
    );
    // pick LATEST starting position (dropdown options render at body level)
    await user.click(dlg().getAllByText(/TRIM_HORIZON/)[0]);
    await waitFor(() => expect(screen.getAllByText("LATEST").length).toBeGreaterThan(0));
    await user.click(screen.getAllByText("LATEST").slice(-1)[0]);
    await user.type(dlg().getByPlaceholderText("10"), "7");
    await user.click(dlg().getByRole("button", { name: /^Create$/i }));
    await waitFor(() =>
      expect(mockCreateEsm).toHaveBeenCalledWith({
        eventSourceArn: "arn:aws:sqs:us-east-1::q",
        functionName: "my-fn",
        startingPosition: "LATEST",
        batchSize: 7,
      })
    );
    await waitFor(() => expectModalHidden("Create event source mapping"));
  });

  it("disables Create trigger until source ARN typed; Cancel closes", async () => {
    const user = setupDetail();
    await openTab(user, /^Triggers/);
    await clickButton(user, /Create trigger/i);
    const dlg = () => within(dialogOf("Create event source mapping"));
    const btn = dlg().getByRole("button", { name: /^Create$/i }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    await user.type(
      dlg().getByPlaceholderText("arn:aws:sqs:us-east-1:123456789012:my-queue"),
      "arn"
    );
    expect(btn.disabled).toBe(false);
    await user.click(dlg().getByRole("button", { name: /^Cancel$/i }));
    await waitFor(() => expectModalHidden("Create event source mapping"));
  });

  it("shows create-trigger error alert with fallback and dismisses", async () => {
    const user = setupDetail();
    createEsmState.isError = true;
    createEsmState.error = new Error("");
    await openTab(user, /^Triggers/);
    expect(screen.getByText(/Failed to create trigger/i)).toBeTruthy();
    const dismiss = document.querySelector('[class*="awsui_dismiss-button"]') as HTMLElement;
    await user.click(dismiss);
  });

  it("edits an existing mapping (batch size, enabled off, max concurrency)", async () => {
    const user = setupDetail();
    mockEsm.mockReturnValue({
      data: {
        eventSourceMappings: [
          { uuid: "u1", eventSourceArn: "arn:aws:sqs::q", state: "Enabled", batchSize: 10 },
        ],
        total: 1,
      },
    });
    await openTab(user, /^Triggers \(1\)/);
    await user.click(screen.getByRole("button", { name: /^Edit$/i }));
    await waitFor(() =>
      expect(screen.getByText("Edit event source mapping")).toBeTruthy()
    );
    const dlg = () => within(dialogOf("Edit event source mapping"));
    const tens = dlg().getAllByPlaceholderText("10") as HTMLInputElement[];
    const batchInput = tens[0];
    expect(batchInput.value).toBe("10");
    await user.clear(batchInput);
    await user.type(batchInput, "25");
    // uncheck enabled
    const checkboxes = dialogOf("Edit event source mapping").querySelectorAll('input[type="checkbox"]');
    fireEvent.click(checkboxes[checkboxes.length - 1]);
    await user.type(tens[tens.length - 1], "5");
    await user.click(dlg().getByRole("button", { name: /^Save$/i }));
    await waitFor(() =>
      expect(mockUpdateEsm).toHaveBeenCalledWith({
        uuid: "u1",
        batchSize: 25,
        enabled: false,
        maximumConcurrency: 5,
      })
    );
    await waitFor(() => expectModalHidden("Edit event source mapping"));
  });

  it("keeps NaN batch/concurrency undefined in mapping edit", async () => {
    const user = setupDetail();
    mockEsm.mockReturnValue({
      data: {
        eventSourceMappings: [
          { uuid: "u2", eventSourceArn: "arn:aws:kinesis::s", state: "Disabled" },
        ],
        total: 1,
      },
    });
    await openTab(user, /^Triggers \(1\)/);
    await user.click(screen.getByRole("button", { name: /^Edit$/i }));
    await waitFor(() =>
      expect(screen.getByText("Edit event source mapping")).toBeTruthy()
    );
    await user.click(
      within(dialogOf("Edit event source mapping")).getByRole("button", { name: /^Save$/i })
    );
    await waitFor(() =>
      expect(mockUpdateEsm).toHaveBeenCalledWith({
        uuid: "u2",
        batchSize: undefined,
        enabled: false,
        maximumConcurrency: undefined,
      })
    );
  });

  it("shows update-trigger error alert with fallback and dismisses", async () => {
    const user = setupDetail();
    updateEsmState.isError = true;
    updateEsmState.error = new Error("");
    await openTab(user, /^Triggers/);
    expect(screen.getByText(/Failed to update trigger/i)).toBeTruthy();
    const dismiss = document.querySelector('[class*="awsui_dismiss-button"]') as HTMLElement;
    await user.click(dismiss);
  });

  it("edits an alias version and description", async () => {
    const user = setupDetail();
    mockAliases.mockReturnValue({
      data: {
        aliases: [{ name: "prod", functionVersion: "1", description: "" }],
        total: 1,
      },
    });
    await openTab(user, /^Aliases \(1\)/);
    await user.click(screen.getByRole("button", { name: /^Edit$/i }));
    await waitFor(() => expect(screen.getByText(/Edit alias/)).toBeTruthy());
    const dlg = () => within(dialogOf(/Edit alias/));
    const versionInput = dlg().getByPlaceholderText("$LATEST") as HTMLInputElement;
    const descInput = dlg().getByPlaceholderText("Production alias") as HTMLInputElement;
    await user.clear(versionInput);
    await user.type(versionInput, "3");
    await user.type(descInput, "live traffic");
    await user.click(dlg().getByRole("button", { name: /^Save$/i }));
    await waitFor(() =>
      expect(mockUpdateAlias).toHaveBeenCalledWith({
        aliasName: "prod",
        functionVersion: "3",
        description: "live traffic",
      })
    );
    await waitFor(() => expectModalHidden(/Edit alias/));
  });

  it("cancels the alias edit modal", async () => {
    const user = setupDetail();
    mockAliases.mockReturnValue({
      data: { aliases: [{ name: "prod", functionVersion: "1" }], total: 1 },
    });
    await openTab(user, /^Aliases \(1\)/);
    await waitFor(() => expect(screen.getByText("prod")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Edit$/i }));
    await waitFor(() => expect(screen.getByText("Edit alias — prod")).toBeTruthy());
    await user.click(
      within(dialogOf("Edit alias — prod")).getByRole("button", { name: /^Cancel$/i })
    );
    await waitFor(() => expectModalHidden(/Edit alias/));
  });

  it("shows alias-update error alert with fallback and dismisses", async () => {
    const user = setupDetail();
    updateAliasState.isError = true;
    updateAliasState.error = new Error("");
    await openTab(user, /^Aliases/);
    expect(screen.getByText(/Failed to update alias/i)).toBeTruthy();
    const dismiss = document.querySelector('[class*="awsui_dismiss-button"]') as HTMLElement;
    await user.click(dismiss);
  });
});

describe("LambdaDashboard — G.63 remaining branches", () => {
  function setupDetail() {
    mockFunctions.mockReturnValue({
      data: { functions: [{ name: "my-fn", runtime: "nodejs22.x", handler: "index.handler", state: "Active" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockFnDetail.mockReturnValue({
      data: { configuration: { runtime: "nodejs22.x", handler: "index.handler", timeout: 3, memorySize: 128, state: "Active" } },
      isLoading: false, isError: false, error: null,
    });
    return userEvent.setup();
  }

  async function openTab(user: ReturnType<typeof userEvent.setup>, tabName: RegExp) {
    render(<LambdaDashboard />, { wrapper: createWrapper() });
    await waitFor(() => screen.getByText("my-fn"));
    await user.click(screen.getByText("my-fn"));
    await waitFor(() => expect(screen.getByText(/Back to Functions/i)).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: tabName }));
  }

  it("dismisses the add-permission modal with Escape", async () => {
    const user = setupDetail();
    await openTab(user, /^Permissions/);
    await clickButton(user, /Create permission|Add/i);
    await waitFor(() => expect(screen.getByText("Add permission")).toBeTruthy());
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Add permission"));
  });

  it("dismisses the remove-permission error alert", async () => {
    const user = setupDetail();
    removePermState.isError = true;
    removePermState.error = new Error("rm boom");
    await openTab(user, /^Permissions/);
    const dismiss = document.querySelector('[class*="awsui_dismiss-button"]') as HTMLElement;
    await user.click(dismiss);
  });

  it("stringifies object principals without Service or AWS keys and dashes bare principals", async () => {
    const user = setupDetail();
    mockPolicyQuery.mockReturnValue({
      data: {
        policy: {
          Statement: [
            { Sid: "s-obj", Effect: "Allow", Principal: { Username: "u" }, Action: "a" },
            { Sid: "s-bare", Effect: "Allow", Action: "a" },
          ],
        },
      },
      isLoading: false,
    });
    await openTab(user, /^Permissions \(2\)/);
    await waitFor(() => {
      expect(screen.getByText('{"Username":"u"}')).toBeTruthy();
      expect(screen.getByText("s-bare")).toBeTruthy();
    });
  });

  it("creates a trigger with default batch size omitted", async () => {
    const user = setupDetail();
    await openTab(user, /^Triggers/);
    await clickButton(user, /Create trigger/i);
    const dlg = () => within(dialogOf("Create event source mapping"));
    await user.type(
      dlg().getByPlaceholderText("arn:aws:sqs:us-east-1:123456789012:my-queue"),
      "arn"
    );
    await user.click(dlg().getByRole("button", { name: /^Create$/i }));
    await waitFor(() =>
      expect(mockCreateEsm).toHaveBeenCalledWith({
        eventSourceArn: "arn",
        functionName: "my-fn",
        startingPosition: "TRIM_HORIZON",
        batchSize: undefined,
      })
    );
  });

  it("dismisses the create-trigger modal with Escape", async () => {
    const user = setupDetail();
    await openTab(user, /^Triggers/);
    await clickButton(user, /Create trigger/i);
    await waitFor(() =>
      expect(screen.getByText("Create event source mapping")).toBeTruthy()
    );
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Create event source mapping"));
  });

  it("cancels the edit-mapping modal and dismisses it with Escape", async () => {
    const user = setupDetail();
    mockEsm.mockReturnValue({
      data: {
        eventSourceMappings: [
          { uuid: "u1", eventSourceArn: "arn:aws:sqs::q", state: "Enabled", batchSize: 10 },
        ],
        total: 1,
      },
    });
    await openTab(user, /^Triggers \(1\)/);
    await waitFor(() => expect(screen.getByText("arn:aws:sqs::q")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Edit$/i }));
    await waitFor(() =>
      expect(screen.getByText("Edit event source mapping")).toBeTruthy()
    );
    await user.click(
      within(dialogOf("Edit event source mapping")).getByRole("button", { name: /^Cancel$/i })
    );
    await waitFor(() => expectModalHidden("Edit event source mapping"));
    // reopen then Escape
    fireEvent.click(screen.getByRole("button", { name: /^Edit$/i }));
    await waitFor(() =>
      expect(screen.getByText("Edit event source mapping")).toBeTruthy()
    );
    dismissModalWithEscape();
    await waitFor(() => expectModalHidden("Edit event source mapping"));
  });

  it("edits an alias without version or description and escapes the modal", async () => {
    const user = setupDetail();
    mockAliases.mockReturnValue({
      data: {
        aliases: [
          { name: "with-version", functionVersion: "1", description: "d" },
          { name: "noversion" },
        ],
        total: 2,
      },
    });
    await openTab(user, /^Aliases \(2\)/);
    await waitFor(() => expect(screen.getByText("with-version")).toBeTruthy());
    // Row WITH version and description
    await user.click(screen.getAllByRole("button", { name: /^Edit$/i })[0]);
    await waitFor(() => expect(screen.getByText(/Edit alias/)).toBeTruthy());
    const dlg = () => within(dialogOf(/Edit alias/));
    const versionInput = dlg().getByPlaceholderText("$LATEST") as HTMLInputElement;
    const descInput = dlg().getByPlaceholderText("Production alias") as HTMLInputElement;
    expect(versionInput.value).toBe("1");
    await user.clear(versionInput);
    await user.clear(descInput);
    await user.click(dlg().getByRole("button", { name: /^Save$/i }));
    await waitFor(() =>
      expect(mockUpdateAlias).toHaveBeenCalledWith({
        aliasName: "with-version",
        functionVersion: undefined,
        description: undefined,
      })
    );
    await waitFor(() => expectModalHidden(/Edit alias/));
    // Row WITHOUT version — fires the String() falsy arm
    const editBtns = screen.getAllByRole("button", { name: /^Edit$/i });
    await user.click(editBtns[editBtns.length - 1]);
    await waitFor(() => expect(screen.getByText(/Edit alias/)).toBeTruthy());
    dismissModalWithEscape();
    await waitFor(() => {
      const dialogs = document.querySelectorAll('[role="dialog"]');
      expect(
        Array.from(dialogs).every((d) => (d as HTMLElement).className.includes("hidden"))
      ).toBe(true);
    });
  });
});
