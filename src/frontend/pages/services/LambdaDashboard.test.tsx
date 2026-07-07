// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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
}));

import { LambdaDashboard } from "./LambdaDashboard";

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
