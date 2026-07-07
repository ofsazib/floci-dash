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
const mockAttachCodeSigningConfigMutate = vi.fn();
const mockDetachCodeSigningConfigMutate = vi.fn();
const mockEventInvokeConfig = vi.fn();
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
  useCreateFunction: () => ({ mutate: mockCreateFunctionMutate, isPending: false, isError: false, error: null }),
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
  useAttachCodeSigningConfig: () => ({ mutate: mockAttachCodeSigningConfigMutate, isPending: false, isError: false, error: null }),
  useDetachCodeSigningConfig: () => ({ mutate: mockDetachCodeSigningConfigMutate, isPending: false, isError: false, error: null }),
  useEventInvokeConfig: (...args: any[]) => mockEventInvokeConfig(...args),
  useCreateLayerVersion: () => ({ mutate: mockCreateLayerVersionMutate, isPending: false, isError: false, error: null }),
  useCreateFunctionUrl: () => ({ mutate: mockCreateFunctionUrlMutate, isPending: false, isError: false, error: null }),
  useUpdateFunctionUrl: () => ({ mutate: mockUpdateFunctionUrlMutate, isPending: false, isError: false, error: null }),
  useDeleteFunctionUrl: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useSetFunctionConcurrency: () => ({ mutate: mockSetConcurrencyMutate, isPending: false, isError: false, error: null }),
  useDeleteFunctionConcurrency: () => ({ mutate: mockDeleteConcurrencyMutate, isPending: false }),
  usePutEventInvokeConfig: () => ({ mutate: mockPutEventInvokeConfigMutate, isPending: false, isError: false, error: null }),
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
});
