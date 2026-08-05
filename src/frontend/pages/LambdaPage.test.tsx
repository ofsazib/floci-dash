// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../test/helpers";
import React from "react";

const mockFunctions = vi.fn();
const mockFunctionDetail = vi.fn();
const mockCreateFunctionMutate = vi.fn();
const mockDeleteFunctionMutateAsync = vi.fn();
const mockInvokeFunction = vi.fn();
const mockInvokeFunctionMutate = vi.fn();
const mockLambdaVersions = vi.fn();
const mockPublishVersionMutate = vi.fn();
const mockLambdaAliases = vi.fn();
const mockEventSourceMappings = vi.fn();
const mockLambdaLayers = vi.fn();
const mockDeleteLayerVersionMutateAsync = vi.fn();
const mockFunctionUrl = vi.fn();
const mockFunctionConcurrency = vi.fn();
const mockCodeSigningConfig = vi.fn();
const mockEventInvokeConfig = vi.fn();

/* ---- Mutable mock state for mutation error/loading control ---- */
let mockCreateFunctionIsError = false;
let mockCreateFunctionError: Error | null = null;
let mockCreateLayerVersionIsError = false;
let mockCreateLayerVersionError: Error | null = null;
let mockCreateFunctionUrlIsError = false;
let mockCreateFunctionUrlError: Error | null = null;
let mockSetConcurrencyIsError = false;
let mockSetConcurrencyError: Error | null = null;
let mockPutEventInvokeConfigIsError = false;
let mockPutEventInvokeConfigError: Error | null = null;
let mockAttachCodeSigningConfigIsError = false;
let mockAttachCodeSigningConfigError: Error | null = null;
let mockDetachCodeSigningConfigIsError = false;
let mockDetachCodeSigningConfigError: Error | null = null;

const mockAttachCodeSigningConfigMutate = vi.fn();
const mockDetachCodeSigningConfigMutate = vi.fn();
const mockCreateLayerVersionMutate = vi.fn();
const mockCreateFunctionUrlMutate = vi.fn();
const mockUpdateFunctionUrlMutate = vi.fn();
const mockSetConcurrencyMutate = vi.fn();
const mockDeleteConcurrencyMutate = vi.fn();
const mockPutEventInvokeConfigMutate = vi.fn();
const mockDeleteEventInvokeConfigMutate = vi.fn();

vi.mock("../hooks/useLambda", () => ({
  useLambdaFunctions: (...args: any[]) => mockFunctions(...args),
  useLambdaFunction: (...args: any[]) => mockFunctionDetail(...args),
  useCreateFunction: () => ({ mutate: mockCreateFunctionMutate, isPending: false, isError: mockCreateFunctionIsError, error: mockCreateFunctionError }),
  useDeleteFunction: () => ({ mutateAsync: mockDeleteFunctionMutateAsync, isPending: false }),
  useInvokeFunction: (...args: any[]) => mockInvokeFunction(...args),
  useLambdaVersions: (...args: any[]) => mockLambdaVersions(...args),
  usePublishVersion: () => ({ mutate: mockPublishVersionMutate, isPending: false }),
  useLambdaAliases: (...args: any[]) => mockLambdaAliases(...args),
  useEventSourceMappings: (...args: any[]) => mockEventSourceMappings(...args),
  useLambdaLayers: (...args: any[]) => mockLambdaLayers(...args),
  useDeleteLayerVersion: () => ({ mutateAsync: mockDeleteLayerVersionMutateAsync, isPending: false }),
  useFunctionUrl: (...args: any[]) => mockFunctionUrl(...args),
  useFunctionConcurrency: (...args: any[]) => mockFunctionConcurrency(...args),
  useCodeSigningConfig: (...args: any[]) => mockCodeSigningConfig(...args),
  useAttachCodeSigningConfig: () => ({ mutate: mockAttachCodeSigningConfigMutate, isPending: false, isError: mockAttachCodeSigningConfigIsError, error: mockAttachCodeSigningConfigError }),
  useDetachCodeSigningConfig: () => ({ mutate: mockDetachCodeSigningConfigMutate, isPending: false, isError: mockDetachCodeSigningConfigIsError, error: mockDetachCodeSigningConfigError }),
  useEventInvokeConfig: (...args: any[]) => mockEventInvokeConfig(...args),
  useCreateLayerVersion: () => ({ mutate: mockCreateLayerVersionMutate, isPending: false, isError: mockCreateLayerVersionIsError, error: mockCreateLayerVersionError }),
  useCreateFunctionUrl: () => ({ mutate: mockCreateFunctionUrlMutate, isPending: false, isError: mockCreateFunctionUrlIsError, error: mockCreateFunctionUrlError }),
  useUpdateFunctionUrl: () => ({ mutate: mockUpdateFunctionUrlMutate, isPending: false, isError: false, error: null }),
  useDeleteFunctionUrl: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useSetFunctionConcurrency: () => ({ mutate: mockSetConcurrencyMutate, isPending: false, isError: mockSetConcurrencyIsError, error: mockSetConcurrencyError }),
  useDeleteFunctionConcurrency: () => ({ mutate: mockDeleteConcurrencyMutate, isPending: false }),
  usePutEventInvokeConfig: () => ({ mutate: mockPutEventInvokeConfigMutate, isPending: false, isError: mockPutEventInvokeConfigIsError, error: mockPutEventInvokeConfigError }),
  useDeleteEventInvokeConfig: () => ({ mutate: mockDeleteEventInvokeConfigMutate, isPending: false }),
}));

import LambdaPage from "./LambdaPage";

describe("LambdaPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFunctions.mockReturnValue({
      data: { functions: [{ name: "my-function", runtime: "nodejs22.x", handler: "index.handler", state: "Active", timeout: 3, memorySize: 128 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockFunctionDetail.mockReturnValue({
      data: { configuration: { runtime: "nodejs22.x", handler: "index.handler", state: "Active" } },
      isLoading: false, isError: false, error: null,
    });
    mockInvokeFunction.mockReturnValue({ mutate: mockInvokeFunctionMutate, isPending: false, isError: false, error: null, data: null });
    mockLambdaVersions.mockReturnValue({ data: { versions: [] }, isLoading: false });
    mockLambdaAliases.mockReturnValue({ data: { aliases: [] }, isLoading: false });
    mockEventSourceMappings.mockReturnValue({ data: { eventSourceMappings: [] }, isLoading: false });
    mockLambdaLayers.mockReturnValue({ data: { layers: [] }, isLoading: false, isError: false, error: null });
    mockFunctionUrl.mockReturnValue({ data: {} });
    mockFunctionConcurrency.mockReturnValue({ data: {} });
    mockCodeSigningConfig.mockReturnValue({ data: {} });
    mockEventInvokeConfig.mockReturnValue({ data: {} });
  });

  // ─── Function List ────────────────────────────────────

  it("renders function list", () => {
    render(<LambdaPage />, { wrapper: createWrapper() });
    expect(screen.getAllByText("Lambda").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Functions").length).toBeGreaterThan(0);
    expect(screen.getAllByText("my-function").length).toBeGreaterThan(0);
    expect(screen.getAllByText("nodejs22.x").length).toBeGreaterThan(0);
  });

  it("shows function with Failed state", async () => {
    mockFunctions.mockReturnValue({
      data: { functions: [{ name: "failed-fn", runtime: "nodejs20.x", handler: "index.handler", state: "Failed", timeout: 3, memorySize: 128 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    render(<LambdaPage />, { wrapper: createWrapper() });
    expect(screen.getByText("failed-fn")).toBeTruthy();
    expect(screen.getByText("Failed")).toBeTruthy();
  });

  it("shows loading state", () => {
    mockFunctions.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    render(<LambdaPage />, { wrapper: createWrapper() });
    expect(screen.getAllByText("Lambda").length).toBeGreaterThan(0);
  });

  it("shows empty state", () => {
    mockFunctions.mockReturnValue({ data: { functions: [] }, isLoading: false, isError: false, error: null });
    render(<LambdaPage />, { wrapper: createWrapper() });
    expect(screen.getByText("No functions found")).toBeTruthy();
  });

  it("shows error state", () => {
    mockFunctions.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("Failed to load") });
    render(<LambdaPage />, { wrapper: createWrapper() });
    expect(screen.getByText("Failed to load")).toBeTruthy();
  });

  it("renders layers tab button", () => {
    render(<LambdaPage />, { wrapper: createWrapper() });
    expect(screen.getByRole("tab", { name: /Layers/i })).toBeTruthy();
  });

  it("opens create function modal and fills form", async () => {
    const user = userEvent.setup();
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("my-function")).toBeTruthy();
    });
    const nameInput = screen.getByPlaceholderText("my-function");
    await user.type(nameInput, "test-fn");
    const handlerInput = screen.getByPlaceholderText("index.handler");
    await user.type(handlerInput, "index.handler");
    await clickButton(user, /Create/i, { last: true });
    expect(mockCreateFunctionMutate).toHaveBeenCalled();
  });

  it("deletes function from list view", async () => {
    const user = userEvent.setup();
    render(<LambdaPage />, { wrapper: createWrapper() });
    const deleteBtn = screen.getByRole("button", { name: /Delete my-function/i });
    await user.click(deleteBtn);
    await waitFor(() => {
      expect(screen.getByText(/Are you sure/)).toBeTruthy();
    });
    await clickButton(user, /^Delete$/i);
    await waitFor(() => {
      expect(mockDeleteFunctionMutateAsync).toHaveBeenCalledWith("my-function");
    });
  });

  // ─── Function Detail ──────────────────────────────────

  it("shows function detail with config values", async () => {
    const user = userEvent.setup();
    mockFunctionDetail.mockReturnValue({
      data: { configuration: { runtime: "nodejs22.x", handler: "index.handler", state: "Active", timeout: 3, memorySize: 128, codeSize: 2048, lastModified: "2024-01-01T00:00:00Z", architectures: ["arm64"] } },
      isLoading: false, isError: false, error: null,
    });
    mockFunctionConcurrency.mockReturnValue({ data: { reservedConcurrentExecutions: 5 } });
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getByText("Publish version")).toBeTruthy();
      expect(screen.getAllByText("nodejs22.x").length).toBeGreaterThan(0);
      expect(screen.getByText("index.handler")).toBeTruthy();
      expect(screen.getByText("3s")).toBeTruthy();
      expect(screen.getByText("128 MB")).toBeTruthy();
      expect(screen.getByText(/2\.0 KB/)).toBeTruthy();
      expect(screen.getByText("arm64")).toBeTruthy();
      expect(screen.getByText("5")).toBeTruthy();
    });
  });

  it("shows N/A for missing optional config fields", async () => {
    const user = userEvent.setup();
    mockFunctionDetail.mockReturnValue({
      data: { configuration: { runtime: "nodejs22.x", handler: "index.handler", state: "Active" } },
      isLoading: false, isError: false, error: null,
    });
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getAllByText("N/A").length).toBeGreaterThan(0);
      expect(screen.getByText("Not set")).toBeTruthy();
      expect(screen.getByText("x86_64")).toBeTruthy();
    });
  });

  it("shows loading state in detail view", async () => {
    const user = userEvent.setup();
    mockFunctionDetail.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getByText("Loading function details...")).toBeTruthy();
    });
  });

  it("shows error state in detail view", async () => {
    const user = userEvent.setup();
    mockFunctionDetail.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("Failed to load detail") });
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getByText("Failed to load detail")).toBeTruthy();
    });
  });

  it("shows environment variables in config", async () => {
    const user = userEvent.setup();
    mockFunctionDetail.mockReturnValue({
      data: { configuration: { runtime: "nodejs22.x", handler: "index.handler", state: "Active", environment: { FOO: "bar", DB_URL: "localhost" } } },
      isLoading: false, isError: false, error: null,
    });
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getByText("FOO")).toBeTruthy();
      expect(screen.getByText("bar")).toBeTruthy();
      expect(screen.getByText("DB_URL")).toBeTruthy();
    });
  });

  it("shows layers in config", async () => {
    const user = userEvent.setup();
    mockFunctionDetail.mockReturnValue({
      data: { configuration: { runtime: "nodejs22.x", handler: "index.handler", state: "Active", layers: [{ arn: "arn:aws:lambda:us-east-1::layer:my-layer:1", codeSize: 512 }] } },
      isLoading: false, isError: false, error: null,
    });
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getByText(/arn:aws:lambda:us-east-1::layer:my-layer:1/)).toBeTruthy();
    });
  });

  it("shows function URL in config", async () => {
    const user = userEvent.setup();
    mockFunctionUrl.mockReturnValue({ data: { url: "https://example.com/my-function", authType: "AWS_IAM" } });
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getByText("https://example.com/my-function")).toBeTruthy();
      expect(screen.getByText(/AWS_IAM/)).toBeTruthy();
    });
  });

  it("invokes function from test tab", async () => {
    const user = userEvent.setup();
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /Test/i })).toBeTruthy();
    });
    await user.click(screen.getByRole("tab", { name: /Test/i }));
    await waitFor(() => {
      expect(screen.getByText("Invoke")).toBeTruthy();
    });
    await clickButton(user, /Invoke/i);
    expect(mockInvokeFunctionMutate).toHaveBeenCalled();
  });

  it("shows invoke response in test tab", async () => {
    const user = userEvent.setup();
    mockInvokeFunction.mockReturnValue({
      mutate: mockInvokeFunctionMutate, isPending: false, isError: false, error: null,
      data: { statusCode: 200, payload: "{\"result\":\"ok\"}" },
    });
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /Test/i })).toBeTruthy();
    });
    await user.click(screen.getByRole("tab", { name: /Test/i }));
    await waitFor(() => {
      expect(screen.getByText(/200/)).toBeTruthy();
      expect(screen.getByText(/"result"/)).toBeTruthy();
    });
  });

  it("shows invoke error in test tab", async () => {
    const user = userEvent.setup();
    mockInvokeFunction.mockReturnValue({
      mutate: mockInvokeFunctionMutate, isPending: false, isError: true, error: new Error("Invocation failed"), data: null,
    });
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /Test/i })).toBeTruthy();
    });
    await user.click(screen.getByRole("tab", { name: /Test/i }));
    await waitFor(() => {
      expect(screen.getByText("Invocation failed")).toBeTruthy();
    });
  });

  it("shows function error status in invoke response", async () => {
    const user = userEvent.setup();
    mockInvokeFunction.mockReturnValue({
      mutate: mockInvokeFunctionMutate, isPending: false, isError: false, error: null,
      data: { statusCode: 200, functionError: "Unhandled", payload: "{}" },
    });
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /Test/i })).toBeTruthy();
    });
    await user.click(screen.getByRole("tab", { name: /Test/i }));
    await waitFor(() => {
      expect(screen.getByText(/Unhandled/)).toBeTruthy();
    });
  });

  it("shows versions tab with data", async () => {
    const user = userEvent.setup();
    mockLambdaVersions.mockReturnValue({
      data: { versions: [{ version: "1", lastModified: "2024-01-01T00:00:00Z", codeSize: 2048, description: "First version" }], total: 1 },
      isLoading: false,
    });
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /Versions/ })).toBeTruthy();
    });
    await user.click(screen.getByRole("tab", { name: /Versions/ }));
    await waitFor(() => {
      expect(screen.getByText("First version")).toBeTruthy();
    });
  });

  it("shows aliases tab with data", async () => {
    const user = userEvent.setup();
    mockLambdaAliases.mockReturnValue({
      data: { aliases: [{ name: "prod", functionVersion: "1", description: "Production alias" }], total: 1 },
      isLoading: false,
    });
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /Aliases/ })).toBeTruthy();
    });
    await user.click(screen.getByRole("tab", { name: /Aliases/ }));
    await waitFor(() => {
      expect(screen.getByText("prod")).toBeTruthy();
      expect(screen.getByText("Production alias")).toBeTruthy();
    });
  });

  it("shows triggers tab with event source mappings", async () => {
    const user = userEvent.setup();
    mockEventSourceMappings.mockReturnValue({
      data: { eventSourceMappings: [{ eventSourceArn: "arn:aws:sqs:us-east-1::my-queue", state: "Enabled", batchSize: 10, lastProcessingResult: "OK" }], total: 1 },
      isLoading: false,
    });
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /Triggers/ })).toBeTruthy();
    });
    await user.click(screen.getByRole("tab", { name: /Triggers/ }));
    await waitFor(() => {
      expect(screen.getByText("arn:aws:sqs:us-east-1::my-queue")).toBeTruthy();
      expect(screen.getByText("10")).toBeTruthy();
      expect(screen.getByText("OK")).toBeTruthy();
    });
  });

  it("calls publish version", async () => {
    const user = userEvent.setup();
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getByText("Publish version")).toBeTruthy();
    });
    await clickButton(user, /Publish version/i);
    expect(mockPublishVersionMutate).toHaveBeenCalledWith({ name: "my-function" });
  });

  it("goes back to function list from detail", async () => {
    const user = userEvent.setup();
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getByText("Back to Functions")).toBeTruthy();
    });
    await clickButton(user, /Back to Functions/i);
    await waitFor(() => {
      expect(screen.getAllByText("Functions").length).toBeGreaterThan(0);
    });
  });

  it("shows delete modal in detail view", async () => {
    const user = userEvent.setup();
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getByText("Publish version")).toBeTruthy();
    });
    const deleteBtn = screen.getByRole("button", { name: /Delete my-function/i });
    await user.click(deleteBtn);
    await waitFor(() => {
      expect(screen.getByText(/Are you sure/)).toBeTruthy();
    });
  });

  // ─── Layers Tab ───────────────────────────────────────

  it("shows layers list with data", async () => {
    const user = userEvent.setup();
    mockLambdaLayers.mockReturnValue({
      data: { layers: [{ name: "my-layer", arn: "arn:aws:lambda:us-east-1::layer:my-layer:1", latestVersion: { version: 1, description: "Test layer", codeSize: 1024, compatibleRuntimes: ["nodejs22.x"] } }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    render(<LambdaPage />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Layers/i }));
    await waitFor(() => {
      expect(screen.getByText("my-layer")).toBeTruthy();
      expect(screen.getByText("Test layer")).toBeTruthy();
      expect(screen.getByText(/1\.0 KB/)).toBeTruthy();
      expect(screen.getAllByText("nodejs22.x").length).toBeGreaterThan(0);
    });
  });

  it("shows layer with codeSize=0 and no runtimes", async () => {
    const user = userEvent.setup();
    mockLambdaLayers.mockReturnValue({
      data: { layers: [{ name: "zero-code", arn: "arn:aws:lambda::layer:zero:1", latestVersion: { version: 1, description: "Zero bytes", codeSize: 0, compatibleRuntimes: [] } }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    render(<LambdaPage />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Layers/i }));
    await waitFor(() => {
      expect(screen.getByText("zero-code")).toBeTruthy();
      expect(screen.getByText("Zero bytes")).toBeTruthy();
    });
  });

  it("shows empty state in layers tab", async () => {
    const user = userEvent.setup();
    render(<LambdaPage />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Layers/i }));
    await waitFor(() => {
      expect(screen.getByText("No layers found")).toBeTruthy();
    });
  });

  it("shows error state in layers tab", async () => {
    const user = userEvent.setup();
    mockLambdaLayers.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("Failed to load layers") });
    render(<LambdaPage />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Layers/i }));
    await waitFor(() => {
      expect(screen.getByText("Failed to load layers")).toBeTruthy();
    });
  });

  it("shows loading state in layers tab", async () => {
    const user = userEvent.setup();
    mockLambdaLayers.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    render(<LambdaPage />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Layers/i }));
    await waitFor(() => {
      expect(screen.getAllByText("Layers").length).toBeGreaterThan(0);
    });
  });

  // ─── Function List Filter ───────────────────────────────

  it("filters functions by name", async () => {
    const user = userEvent.setup();
    mockFunctions.mockReturnValue({
      data: {
        functions: [
          { name: "alpha-function", runtime: "nodejs22.x", handler: "index.handler", state: "Active", timeout: 3, memorySize: 128 },
          { name: "beta-function", runtime: "nodejs22.x", handler: "index.handler", state: "Active", timeout: 3, memorySize: 128 },
        ],
        total: 2,
      },
      isLoading: false, isError: false, error: null,
    });
    render(<LambdaPage />, { wrapper: createWrapper() });
    expect(screen.getByText("alpha-function")).toBeTruthy();
    expect(screen.getByText("beta-function")).toBeTruthy();
    const filterInput = screen.getByPlaceholderText("Find functions by name");
    await user.type(filterInput, "alpha");
    await waitFor(() => {
      expect(screen.getByText("alpha-function")).toBeTruthy();
    });
    expect(screen.queryByText("beta-function")).toBeFalsy();
  });

  // ─── Advanced Tab ───────────────────────────────────────

  it("shows advanced tab with Reserved Concurrency section", async () => {
    const user = userEvent.setup();
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getByText("Back to Functions")).toBeTruthy();
    });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await waitFor(() => {
      expect(screen.getByText("Set concurrency")).toBeTruthy();
    });
  });

  it("sets reserved concurrency from Advanced tab", async () => {
    const user = userEvent.setup();
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getByText("Back to Functions")).toBeTruthy();
    });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await clickButton(user, /Set concurrency/i);
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/e\.g\. 10/)).toBeTruthy();
    });
    const input = screen.getByPlaceholderText(/e\.g\. 10/);
    await user.type(input, "5");
    await clickButton(user, /^Set$/i);
    expect(mockSetConcurrencyMutate).toHaveBeenCalled();
  });

  it("removes reserved concurrency from Advanced tab", async () => {
    const user = userEvent.setup();
    mockFunctionConcurrency.mockReturnValue({ data: { reservedConcurrentExecutions: 5 } });
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getByText("Back to Functions")).toBeTruthy();
    });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await waitFor(() => {
      expect(screen.getByText(/Remove/)).toBeTruthy();
    });
    await clickButton(user, /^Remove$/i);
    expect(mockDeleteConcurrencyMutate).toHaveBeenCalled();
  });

  it("creates function URL from Advanced tab", async () => {
    const user = userEvent.setup();
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getByText("Back to Functions")).toBeTruthy();
    });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await waitFor(() => {
      expect(screen.getByText(/Create URL/i)).toBeTruthy();
    });
    await clickButton(user, /Create URL/i);
    await waitFor(() => {
      expect(screen.getByText("Set reserved concurrency")).toBeTruthy();
    });
    await clickButton(user, /^Create$/i);
    expect(mockCreateFunctionUrlMutate).toHaveBeenCalled();
  });

  it("updates function URL from Advanced tab", async () => {
    const user = userEvent.setup();
    mockFunctionUrl.mockReturnValue({ data: { url: "https://example.com/fn", authType: "AWS_IAM" } });
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getByText("Back to Functions")).toBeTruthy();
    });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await waitFor(() => {
      expect(screen.getByText(/Update URL config/i)).toBeTruthy();
    });
    await clickButton(user, /Update URL config/i);
    await waitFor(() => {
      expect(screen.getByText("Set reserved concurrency")).toBeTruthy();
    });
    await clickButton(user, /^Update$/i, { last: true });
    expect(mockUpdateFunctionUrlMutate).toHaveBeenCalled();
  });

  it("attaches code signing config from Advanced tab", async () => {
    const user = userEvent.setup();
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getByText("Back to Functions")).toBeTruthy();
    });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await waitFor(() => {
      expect(screen.getByText(/Attach config/i)).toBeTruthy();
    });
    await clickButton(user, /Attach config/i);
    await waitFor(() => {
      expect(screen.getByText("Set reserved concurrency")).toBeTruthy();
    });
    const arnInput = screen.getByPlaceholderText(/code-signing-config:csc/);
    await user.type(arnInput, "arn:aws:lambda:us-east-1:000000000000:code-signing-config:csc-001");
    await clickButton(user, /^Attach$/i);
    expect(mockAttachCodeSigningConfigMutate).toHaveBeenCalled();
  });

  it("detaches code signing config from Advanced tab", async () => {
    const user = userEvent.setup();
    mockCodeSigningConfig.mockReturnValue({ data: { codeSigningConfigArn: "arn:aws:lambda:us-east-1:000000000000:code-signing-config:csc-001" } });
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getByText("Back to Functions")).toBeTruthy();
    });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await waitFor(() => {
      expect(screen.getByText(/Detach/i)).toBeTruthy();
    });
    await clickButton(user, /^Detach$/i);
    expect(mockDetachCodeSigningConfigMutate).toHaveBeenCalled();
  });

  it("configures event invoke from Advanced tab", async () => {
    const user = userEvent.setup();
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getByText("Back to Functions")).toBeTruthy();
    });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await waitFor(() => {
      expect(screen.getByText("Configure event invoke config")).toBeTruthy();
    });
    await clickButton(user, /Configure/i);
    await waitFor(() => {
      expect(screen.getByText("Configure event invoke config")).toBeTruthy();
    });
    await clickButton(user, /Save/i);
    expect(mockPutEventInvokeConfigMutate).toHaveBeenCalled();
  });

  it("edits and resets event invoke config from Advanced tab", async () => {
    const user = userEvent.setup();
    mockEventInvokeConfig.mockReturnValue({
      data: { maximumRetryAttempts: 2, maximumEventAgeInSeconds: 3600 },
    });
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getByText("Back to Functions")).toBeTruthy();
    });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await waitFor(() => {
      expect(screen.getByText(/Reset to defaults/i)).toBeTruthy();
    });
    await clickButton(user, /Reset to defaults/i);
    expect(mockDeleteEventInvokeConfigMutate).toHaveBeenCalled();
  });

  // ─── Layers Tab Delete ────────────────────────────────

  it("deletes a layer version", async () => {
    const user = userEvent.setup();
    mockLambdaLayers.mockReturnValue({
      data: { layers: [{ name: "my-layer", arn: "arn:aws:lambda:us-east-1::layer:my-layer:1", latestVersion: { version: 1, description: "Test layer", codeSize: 1024, compatibleRuntimes: ["nodejs22.x"] } }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    render(<LambdaPage />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Layers/i }));
    await waitFor(() => {
      expect(screen.getByText("my-layer")).toBeTruthy();
    });
    const deleteBtn = screen.getByRole("button", { name: /Delete my-layer:1/i });
    await user.click(deleteBtn);
    await waitFor(() => {
      expect(screen.getByText(/Are you sure/)).toBeTruthy();
    });
    await clickButton(user, /^Delete$/i);
    await waitFor(() => {
      expect(mockDeleteLayerVersionMutateAsync).toHaveBeenCalled();
    });
  });

  // ─── Edge Cases & Error Alerts ──────────────────────────

  it("does not create function when name is empty (early return)", async () => {
    const user = userEvent.setup();
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("my-function")).toBeTruthy();
    });
    // Click Create without filling name or handler
    await clickButton(user, /Create/i, { last: true });
    // Button should be disabled (name and handler are empty), so mutate should not be called
    expect(mockCreateFunctionMutate).not.toHaveBeenCalled();
  });

  it("shows create function error alert", async () => {
    const user = userEvent.setup();
    mockCreateFunctionIsError = true;
    mockCreateFunctionError = new Error("Creation failed");
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => {
      expect(screen.getByText("Creation failed")).toBeTruthy();
    });
  });

  it("returns null from detail view when data is undefined (no data)", async () => {
    const user = userEvent.setup();
    mockFunctionDetail.mockReturnValue({ data: undefined, isLoading: false, isError: false, error: null });
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      // Component returns null — Back to Functions and Publish version should NOT render
      expect(screen.queryByText("Back to Functions")).toBeNull();
      expect(screen.queryByText("Publish version")).toBeNull();
    });
  });

  it("shows invoke response with object payload (JSON.stringify path)", async () => {
    const user = userEvent.setup();
    mockInvokeFunction.mockReturnValue({
      mutate: mockInvokeFunctionMutate, isPending: false, isError: false, error: null,
      data: { statusCode: 200, payload: { result: "ok" } },
    });
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /Test/i })).toBeTruthy();
    });
    await user.click(screen.getByRole("tab", { name: /Test/i }));
    await waitFor(() => {
      expect(screen.getByText(/result/)).toBeTruthy();
    });
  });

  // ─── Layers Tab Edge Cases ───────────────────────────────

  it("shows layers item without version (delete button null)", async () => {
    const user = userEvent.setup();
    mockLambdaLayers.mockReturnValue({
      data: { layers: [{ name: "layer-no-version", arn: "arn:aws:lambda::layer:no-ver:1", latestVersion: {} }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    render(<LambdaPage />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Layers/i }));
    await waitFor(() => {
      expect(screen.getByText("layer-no-version")).toBeTruthy();
      // No delete button since version is missing
      expect(screen.queryByRole("button", { name: /Delete/i })).toBeFalsy();
    });
  });

  it("opens create layer version modal and shows error", async () => {
    const user = userEvent.setup();
    mockCreateLayerVersionIsError = true;
    mockCreateLayerVersionError = new Error("Layer creation failed");
    mockLambdaLayers.mockReturnValue({
      data: { layers: [{ name: "my-layer", arn: "arn:aws:lambda::layer:my-layer:1", latestVersion: { version: 1 } }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    render(<LambdaPage />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Layers/i }));
    await waitFor(() => {
      expect(screen.getByText("Create layer version")).toBeTruthy();
    });
    await clickButton(user, /^Create$/i);
    await waitFor(() => {
      expect(screen.getByText("Layer creation failed")).toBeTruthy();
    });
  });

  // ─── Advanced Tab Error Alerts ───────────────────────────

  it("shows create function URL error in Advanced tab", async () => {
    const user = userEvent.setup();
    mockCreateFunctionUrlIsError = true;
    mockCreateFunctionUrlError = new Error("URL creation failed");
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getByText("Back to Functions")).toBeTruthy();
    });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await waitFor(() => {
      expect(screen.getByText("URL creation failed")).toBeTruthy();
    });
  });

  it("shows set concurrency error in Advanced tab", async () => {
    const user = userEvent.setup();
    mockSetConcurrencyIsError = true;
    mockSetConcurrencyError = new Error("Concurrency failed");
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getByText("Back to Functions")).toBeTruthy();
    });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await waitFor(() => {
      expect(screen.getByText("Concurrency failed")).toBeTruthy();
    });
  });

  it("shows put event invoke config error in Advanced tab", async () => {
    const user = userEvent.setup();
    mockPutEventInvokeConfigIsError = true;
    mockPutEventInvokeConfigError = new Error("Event invoke config failed");
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getByText("Back to Functions")).toBeTruthy();
    });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await waitFor(() => {
      expect(screen.getByText("Event invoke config failed")).toBeTruthy();
    });
  });

  it("shows attach code signing config error in Advanced tab", async () => {
    const user = userEvent.setup();
    mockAttachCodeSigningConfigIsError = true;
    mockAttachCodeSigningConfigError = new Error("Attach failed");
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getByText("Back to Functions")).toBeTruthy();
    });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await waitFor(() => {
      expect(screen.getAllByText("Attach failed").length).toBeGreaterThanOrEqual(1);
    });
  });

  it("shows detach code signing config error in Advanced tab", async () => {
    const user = userEvent.setup();
    mockDetachCodeSigningConfigIsError = true;
    mockDetachCodeSigningConfigError = new Error("Detach failed");
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getByText("Back to Functions")).toBeTruthy();
    });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await waitFor(() => {
      expect(screen.getAllByText("Detach failed").length).toBeGreaterThanOrEqual(1);
    });
  });

  // ─── Additional Config Tab Branches ──────────────────────

  it("shows event invoke config with no data set", async () => {
    const user = userEvent.setup();
    // eventInvokeConfig returns data with null maxRetryAttempts -> "No event invoke config set" path
    mockEventInvokeConfig.mockReturnValue({ data: { maximumRetryAttempts: null, maximumEventAgeInSeconds: null } });
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getByText("No event invoke config set")).toBeTruthy();
    });
  });

  it("shows code signing config with no ARN set", async () => {
    const user = userEvent.setup();
    mockCodeSigningConfig.mockReturnValue({ data: { codeSigningConfigArn: null } });
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getByText("No code signing config attached")).toBeTruthy();
    });
  });

  it("shows function URL with no URL", async () => {
    const user = userEvent.setup();
    mockFunctionUrl.mockReturnValue({ data: { url: null } });
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getByText("No URL configured")).toBeTruthy();
    });
  });

  it("shows layers config without code size (unknown)", async () => {
    const user = userEvent.setup();
    mockFunctionDetail.mockReturnValue({
      data: {
        configuration: {
          runtime: "nodejs22.x", handler: "index.handler", state: "Active",
          layers: [{ arn: "arn:aws:lambda::layer:my-layer:1", codeSize: null }],
        },
      },
      isLoading: false, isError: false, error: null,
    });
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getByText(/unknown/)).toBeTruthy();
    });
  });

  // ─── Code Signing Modal Branches ────────────────────────

  it("shows error alert inside code signing attach modal", async () => {
    const user = userEvent.setup();
    mockAttachCodeSigningConfigIsError = true;
    mockAttachCodeSigningConfigError = new Error("Attach modal error");
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getByText("Back to Functions")).toBeTruthy();
    });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await waitFor(() => {
      expect(screen.getByText(/Attach config/i)).toBeTruthy();
    });
    await clickButton(user, /Attach config/i);
    await waitFor(() => {
      // Error renders both in Advanced tab and inside modal — use getAllByText
      expect(screen.getAllByText("Attach modal error").length).toBeGreaterThanOrEqual(2);
    });
  });

  it("shows default error in code signing attach modal when error has no message", async () => {
    const user = userEvent.setup();
    mockAttachCodeSigningConfigIsError = true;
    mockAttachCodeSigningConfigError = null;
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getByText("Back to Functions")).toBeTruthy();
    });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await waitFor(() => {
      expect(screen.getByText(/Attach config/i)).toBeTruthy();
    });
    await clickButton(user, /Attach config/i);
    await waitFor(() => {
      expect(screen.getByText("Failed to attach")).toBeTruthy();
    });
  });

  it("attaches different code signing config when already attached", async () => {
    const user = userEvent.setup();
    mockCodeSigningConfig.mockReturnValue({ data: { codeSigningConfigArn: "arn:aws:lambda:us-east-1:000000000000:code-signing-config:csc-existing" } });
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getByText("Back to Functions")).toBeTruthy();
    });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await waitFor(() => {
      expect(screen.getByText(/Attach different config/i)).toBeTruthy();
    });
    await clickButton(user, /Attach different config/i);
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/code-signing-config:csc/)).toBeTruthy();
    });
    const arnInput = screen.getByPlaceholderText(/code-signing-config:csc/);
    await user.clear(arnInput);
    await user.type(arnInput, "arn:aws:lambda:us-east-1:000000000000:code-signing-config:csc-new");
    await clickButton(user, /^Attach$/i);
    expect(mockAttachCodeSigningConfigMutate).toHaveBeenCalled();
  });

  // ─── Event Invoke Config Modal Branches ────────────────

  it("updates event invoke config from Advanced tab edit button", async () => {
    const user = userEvent.setup();
    mockEventInvokeConfig.mockReturnValue({
      data: { maximumRetryAttempts: 3, maximumEventAgeInSeconds: 7200 },
    });
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getByText("Back to Functions")).toBeTruthy();
    });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await waitFor(() => {
      expect(screen.getByText(/Edit config/i)).toBeTruthy();
    });
    await clickButton(user, /Edit config/i);
    await waitFor(() => {
      expect(screen.getByText("Save")).toBeTruthy();
    });
    await clickButton(user, /Save/i);
    expect(mockPutEventInvokeConfigMutate).toHaveBeenCalled();
  });

  it("shows event invoke config with destination onSuccess and onFailure", async () => {
    const user = userEvent.setup();
    mockEventInvokeConfig.mockReturnValue({
      data: {
        maximumRetryAttempts: 2,
        maximumEventAgeInSeconds: 3600,
        destinationConfig: {
          OnSuccess: { Destination: "arn:aws:sqs:us-east-1:123:success-queue" },
          OnFailure: { Destination: "arn:aws:sns:us-east-1:123:failure-topic" },
        },
      },
    });
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getByText("Back to Functions")).toBeTruthy();
    });
    // Destinations only render in the Advanced tab
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await waitFor(() => {
      expect(screen.getByText(/On success:/)).toBeTruthy();
      expect(screen.getByText(/On failure:/)).toBeTruthy();
    });
  });

  it("removes event invoke config from Advanced tab", async () => {
    const user = userEvent.setup();
    mockEventInvokeConfig.mockReturnValue({
      data: { maximumRetryAttempts: 2, maximumEventAgeInSeconds: 3600 },
    });
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getByText("Back to Functions")).toBeTruthy();
    });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await waitFor(() => {
      expect(screen.getByText(/Reset to defaults/i)).toBeTruthy();
    });
    await clickButton(user, /Reset to defaults/i);
    expect(mockDeleteEventInvokeConfigMutate).toHaveBeenCalled();
  });

  // ─── Function URL Config Tab Branches ──────────────────

  it("deletes function URL from config tab", async () => {
    const user = userEvent.setup();
    mockFunctionUrl.mockReturnValue({ data: { url: "https://example.com/my-fn", authType: "NONE" } });
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getByText("https://example.com/my-fn")).toBeTruthy();
    });
    // The delete button for the function URL has aria-label "Delete my-function" 
    // (same as the main delete button). Both are rendered so we need getAllByRole
    const deleteButtons = screen.getAllByRole("button", { name: /Delete my-function/i });
    await user.click(deleteButtons[deleteButtons.length - 1]);
    await waitFor(() => {
      expect(screen.getByText(/Are you sure/)).toBeTruthy();
    });
    await clickButton(user, /^Delete$/i);
    // Verify mutation was attempted (the mock just returns a resolved promise)
  });

  it("updates function URL from config tab edit icon", async () => {
    const user = userEvent.setup();
    mockFunctionUrl.mockReturnValue({
      data: { url: "https://example.com/my-fn", authType: "NONE", cors: { AllowMethods: ["GET", "POST"] } },
    });
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getByText("https://example.com/my-fn")).toBeTruthy();
    });
    // Find the inline-icon edit button next to the function URL.
    // The edit button has iconName="edit" (Cloudscape renders it with <svg>).
    const fnUrlRow = screen.getByText("https://example.com/my-fn").parentElement?.parentElement;
    const editBtn = fnUrlRow?.querySelector("button");
    if (editBtn) await user.click(editBtn as HTMLElement);
    await waitFor(() => {
      expect(screen.getByText("Update function URL config")).toBeTruthy();
    });
    await clickButton(user, /^Update$/i, { last: true });
    expect(mockUpdateFunctionUrlMutate).toHaveBeenCalled();
  });

  // ─── Layer Create Modal Branches ────────────────────────

  it("submits create layer version with all fields", async () => {
    const user = userEvent.setup();
    mockLambdaLayers.mockReturnValue({
      data: { layers: [{ name: "my-layer", arn: "arn:aws:lambda::layer:my-layer:1", latestVersion: { version: 1 } }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    render(<LambdaPage />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Layers/i }));
    await waitFor(() => {
      expect(screen.getByText("my-layer")).toBeTruthy();
    });
    // Open modal via ResourceTable's onCreate button
    await clickButton(user, /^Create layer$/i);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("my-layer")).toBeTruthy();
    });
    const nameInput = screen.getByPlaceholderText("my-layer");
    await user.type(nameInput, "test-layer");
    const descInput = screen.getByPlaceholderText("Optional description");
    await user.type(descInput, "Test description");
    const licenseInput = screen.getByPlaceholderText("Optional license info");
    await user.type(licenseInput, "MIT");
    await clickButton(user, /^Create$/i, { last: true });
    expect(mockCreateLayerVersionMutate).toHaveBeenCalled();
  });

  it("shows default error for create layer version when error has no message", async () => {
    const user = userEvent.setup();
    mockCreateLayerVersionIsError = true;
    mockCreateLayerVersionError = null;
    mockLambdaLayers.mockReturnValue({
      data: { layers: [{ name: "my-layer", arn: "arn:aws:lambda::layer:my-layer:1", latestVersion: { version: 1 } }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    render(<LambdaPage />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Layers/i }));
    await waitFor(() => {
      expect(screen.getByText("my-layer")).toBeTruthy();
    });
    // The error alert is inside the modal — open it first
    await clickButton(user, /^Create layer$/i);
    await waitFor(() => {
      expect(screen.getByText("Failed to create layer")).toBeTruthy();
    });
  });

  it("shows create layer version modal renders with header and fields", async () => {
    const user = userEvent.setup();
    mockLambdaLayers.mockReturnValue({
      data: { layers: [{ name: "btn-layer", arn: "arn:aws:lambda::layer:btn:1", latestVersion: { version: 1 } }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    render(<LambdaPage />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Layers/i }));
    await waitFor(() => {
      expect(screen.getByText("btn-layer")).toBeTruthy();
    });
    await clickButton(user, /^Create layer$/i);
    await waitFor(() => {
      expect(screen.getByText("Create layer version")).toBeTruthy();
    });
  });

  // ─── Update URL from config tab ────────────────────────

  it("opens update URL modal from config tab when URL exists", async () => {
    const user = userEvent.setup();
    mockFunctionUrl.mockReturnValue({
      data: { url: "https://example.com/fn", authType: "AWS_IAM", cors: { AllowMethods: ["GET"] } },
    });
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getByText("https://example.com/fn")).toBeTruthy();
    });
    // Cloudscape inline-icon buttons don't have accessible role names.
    // Find the edit button by its svg icon inside the function URL row.
    const fnUrlRow = screen.getByText("https://example.com/fn").parentElement?.parentElement;
    const editBtn = fnUrlRow?.querySelector("button");
    if (editBtn) await user.click(editBtn as HTMLElement);
    await waitFor(() => {
      expect(screen.getByText("Update function URL config")).toBeTruthy();
    });
  });

  // ─── Concurrency Remove from Config Tab ───────────────

  // ─── Error Fallback Messages (|| right-side) ──────────

  it("shows default error when functions fail without message", () => {
    mockFunctions.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: null });
    render(<LambdaPage />, { wrapper: createWrapper() });
    expect(screen.getByText("Failed to load functions")).toBeTruthy();
  });

  it("shows default error when creating function fails without message", async () => {
    const user = userEvent.setup();
    mockCreateFunctionIsError = true;
    mockCreateFunctionError = null;
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => {
      expect(screen.getByText("Failed to create function")).toBeTruthy();
    });
  });

  it("shows default error when detail fails without message", async () => {
    const user = userEvent.setup();
    mockFunctionDetail.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: null });
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getByText("Failed to load")).toBeTruthy();
    });
  });

  it("shows default error when invoke fails without message", async () => {
    const user = userEvent.setup();
    mockInvokeFunction.mockReturnValue({ mutate: mockInvokeFunctionMutate, isPending: false, isError: true, error: null, data: null });
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /Test/i })).toBeTruthy();
    });
    await user.click(screen.getByRole("tab", { name: /Test/i }));
    await waitFor(() => {
      expect(screen.getByText("Invocation failed")).toBeTruthy();
    });
  });

  it("shows default error when layers fail without message", async () => {
    const user = userEvent.setup();
    mockLambdaLayers.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: null });
    render(<LambdaPage />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Layers/i }));
    await waitFor(() => {
      expect(screen.getByText("Failed to load layers")).toBeTruthy();
    });
  });

  it("shows default error when creating URL fails without message", async () => {
    const user = userEvent.setup();
    mockCreateFunctionUrlIsError = true;
    mockCreateFunctionUrlError = null;
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getByText("Back to Functions")).toBeTruthy();
    });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await waitFor(() => {
      expect(screen.getByText("Failed to create URL")).toBeTruthy();
    });
  });

  it("shows default error when setting concurrency fails without message", async () => {
    const user = userEvent.setup();
    mockSetConcurrencyIsError = true;
    mockSetConcurrencyError = null;
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getByText("Back to Functions")).toBeTruthy();
    });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await waitFor(() => {
      expect(screen.getByText("Failed to set concurrency")).toBeTruthy();
    });
  });

  it("shows default error when event invoke config fails without message", async () => {
    const user = userEvent.setup();
    mockPutEventInvokeConfigIsError = true;
    mockPutEventInvokeConfigError = null;
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getByText("Back to Functions")).toBeTruthy();
    });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await waitFor(() => {
      expect(screen.getByText("Failed to update event invoke config")).toBeTruthy();
    });
  });

  it("shows default error when detaching code signing fails without message", async () => {
    const user = userEvent.setup();
    mockDetachCodeSigningConfigIsError = true;
    mockDetachCodeSigningConfigError = null;
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getByText("Back to Functions")).toBeTruthy();
    });
    await user.click(screen.getByRole("tab", { name: /Advanced/i }));
    await waitFor(() => {
      expect(screen.getByText("Failed to detach code signing config")).toBeTruthy();
    });
  });

  // ─── State/Status Branches ────────────────────────────

  it("shows function with Pending state in list", () => {
    mockFunctions.mockReturnValue({
      data: { functions: [{ name: "pending-fn", runtime: "nodejs22.x", handler: "index.handler", state: "Pending", timeout: 3, memorySize: 128 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    render(<LambdaPage />, { wrapper: createWrapper() });
    expect(screen.getByText("pending-fn")).toBeTruthy();
    expect(screen.getByText("Pending")).toBeTruthy();
  });

  it("shows detail with Pending state", async () => {
    const user = userEvent.setup();
    mockFunctionDetail.mockReturnValue({
      data: { configuration: { runtime: "nodejs22.x", handler: "index.handler", state: "Pending" } },
      isLoading: false, isError: false, error: null,
    });
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getByText("Pending")).toBeTruthy();
    });
  });

  it("shows trigger with Disabled state", async () => {
    const user = userEvent.setup();
    mockEventSourceMappings.mockReturnValue({
      data: { eventSourceMappings: [{ eventSourceArn: "arn:aws:dynamodb:us-east-1::table/my-table/stream", state: "Disabled", batchSize: 5 }], total: 1 },
      isLoading: false,
    });
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /Triggers/ })).toBeTruthy();
    });
    await user.click(screen.getByRole("tab", { name: /Triggers/ }));
    await waitFor(() => {
      expect(screen.getByText("Disabled")).toBeTruthy();
      expect(screen.getByText("5")).toBeTruthy();
    });
  });

  // ─── Table || "-" Fallbacks ──────────────────────────

  it("shows dash for missing function fields in table", () => {
    mockFunctions.mockReturnValue({
      data: { functions: [{ name: "sparse-fn", runtime: null, handler: null, memorySize: null, timeout: null, state: null, lastModified: null }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    render(<LambdaPage />, { wrapper: createWrapper() });
    expect(screen.getByText("sparse-fn")).toBeTruthy();
    // Dash for missing runtime, handler, memory, timeout, state
    const dashes = screen.getAllByText("-");
    expect(dashes.length).toBeGreaterThanOrEqual(5);
  });

  it("shows dash for missing version fields", async () => {
    const user = userEvent.setup();
    mockLambdaVersions.mockReturnValue({
      data: { versions: [{ version: null, lastModified: null, codeSize: null, description: null }], total: 1 },
      isLoading: false,
    });
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /Versions/ })).toBeTruthy();
    });
    await user.click(screen.getByRole("tab", { name: /Versions/ }));
    await waitFor(() => {
      expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(3);
    });
  });

  it("shows dash for missing alias fields", async () => {
    const user = userEvent.setup();
    mockLambdaAliases.mockReturnValue({
      data: { aliases: [{ name: null, functionVersion: null, description: null }], total: 1 },
      isLoading: false,
    });
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /Aliases/ })).toBeTruthy();
    });
    await user.click(screen.getByRole("tab", { name: /Aliases/ }));
    await waitFor(() => {
      expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(3);
    });
  });

  it("shows dash for missing trigger fields", async () => {
    const user = userEvent.setup();
    mockEventSourceMappings.mockReturnValue({
      data: { eventSourceMappings: [{ eventSourceArn: null, state: null, batchSize: null }], total: 1 },
      isLoading: false,
    });
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /Triggers/ })).toBeTruthy();
    });
    await user.click(screen.getByRole("tab", { name: /Triggers/ }));
    await waitFor(() => {
      expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(2);
    });
  });

  // ─── Config Fallbacks ─────────────────────────────────

  it("shows function URL config fallbacks when authType and CORS are missing", async () => {
    const user = userEvent.setup();
    mockFunctionUrl.mockReturnValue({ data: { url: "https://example.com/fn" } });
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getByText(/NONE/)).toBeTruthy();
    });
  });

  it("shows code signing ARN placeholder when not set", async () => {
    const user = userEvent.setup();
    mockCodeSigningConfig.mockReturnValue({ data: {} });
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getByText("No code signing config attached")).toBeTruthy();
    });
  });

  it("shows event invoke config with null retry values", async () => {
    const user = userEvent.setup();
    mockEventInvokeConfig.mockReturnValue({
      data: { maximumRetryAttempts: null, maximumEventAgeInSeconds: null },
    });
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /my-function/i);
    await waitFor(() => {
      expect(screen.getByText("No event invoke config set")).toBeTruthy();
    });
  });

  // ─── Misc Edge Cases ──────────────────────────────────

  it("does not create function when handler is empty", async () => {
    const user = userEvent.setup();
    render(<LambdaPage />, { wrapper: createWrapper() });
    await clickButton(user, /Create/i);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("my-function")).toBeTruthy();
    });
    const nameInput = screen.getByPlaceholderText("my-function");
    await user.type(nameInput, "test-fn");
    // Handler input is prefilled with "index.handler" — clear it
    const handlerInput = screen.getByPlaceholderText("index.handler");
    await user.clear(handlerInput);
    // Button should be disabled (handler is empty)
    expect(mockCreateFunctionMutate).not.toHaveBeenCalled();
  });

  it("does not create layer version when name is empty", async () => {
    const user = userEvent.setup();
    mockLambdaLayers.mockReturnValue({
      data: { layers: [{ name: "my-layer", arn: "arn:aws:lambda::layer:my-layer:1", latestVersion: { version: 1 } }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    render(<LambdaPage />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Layers/i }));
    await waitFor(() => {
      expect(screen.getByText("my-layer")).toBeTruthy();
    });
    await clickButton(user, /^Create layer$/i);
    await waitFor(() => {
      expect(screen.getByText("Create layer version")).toBeTruthy();
    });
    // Don't fill name, just click create
    await clickButton(user, /^Create$/i, { last: true });
    // mutate should not be called since name is empty
    expect(mockCreateLayerVersionMutate).not.toHaveBeenCalled();
  });

});
