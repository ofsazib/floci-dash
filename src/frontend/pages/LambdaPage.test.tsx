// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const mockFunctions = vi.fn();
const mockFunctionDetail = vi.fn();
const mockCreateFunctionMutate = vi.fn();
const mockDeleteFunction = vi.fn();
const mockInvokeFunction = vi.fn();
const mockLambdaVersions = vi.fn();
const mockPublishVersion = vi.fn();
const mockLambdaAliases = vi.fn();
const mockEventSourceMappings = vi.fn();
const mockLambdaLayers = vi.fn();
const mockDeleteLayerVersion = vi.fn();
const mockFunctionUrl = vi.fn();
const mockFunctionConcurrency = vi.fn();

vi.mock("../hooks/useLambda", () => ({
  useLambdaFunctions: (...args: any[]) => mockFunctions(...args),
  useLambdaFunction: (...args: any[]) => mockFunctionDetail(...args),
  useCreateFunction: () => ({ mutate: mockCreateFunctionMutate, isPending: false, isError: false, error: null }),
  useDeleteFunction: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useInvokeFunction: () => ({ mutate: vi.fn(), isPending: false, isError: false, error: null, data: null }),
  useLambdaVersions: (...args: any[]) => mockLambdaVersions(...args),
  usePublishVersion: () => ({ mutate: vi.fn(), isPending: false }),
  useLambdaAliases: (...args: any[]) => mockLambdaAliases(...args),
  useEventSourceMappings: (...args: any[]) => mockEventSourceMappings(...args),
  useLambdaLayers: (...args: any[]) => mockLambdaLayers(...args),
  useDeleteLayerVersion: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useFunctionUrl: (...args: any[]) => mockFunctionUrl(...args),
  useFunctionConcurrency: (...args: any[]) => mockFunctionConcurrency(...args),
}));

import LambdaPage from "./LambdaPage";

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("LambdaPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFunctions.mockReturnValue({
      data: { functions: [{ name: "my-function", runtime: "nodejs22.x", handler: "index.handler", state: "Active", timeout: 3, memorySize: 128 }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockFunctionDetail.mockReturnValue({ data: { configuration: { runtime: "nodejs22.x", handler: "index.handler", state: "Active" } }, isLoading: false, isError: false, error: null });
    mockLambdaVersions.mockReturnValue({ data: { versions: [] }, isLoading: false });
    mockLambdaAliases.mockReturnValue({ data: { aliases: [] }, isLoading: false });
    mockEventSourceMappings.mockReturnValue({ data: { eventSourceMappings: [] }, isLoading: false });
    mockLambdaLayers.mockReturnValue({ data: { layers: [] }, isLoading: false, isError: false, error: null });
    mockFunctionUrl.mockReturnValue({ data: {} });
    mockFunctionConcurrency.mockReturnValue({ data: {} });
  });

  // ─── Render State Tests ─────────────────────────────────

  it("renders function list", () => {
    render(<LambdaPage />, { wrapper: createWrapper() });
    expect(screen.getAllByText("Lambda").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Functions").length).toBeGreaterThan(0);
    expect(screen.getAllByText("my-function").length).toBeGreaterThan(0);
    expect(screen.getAllByText("nodejs22.x").length).toBeGreaterThan(0);
  });

  it("shows empty state", () => {
    mockFunctions.mockReturnValue({
      data: { functions: [] },
      isLoading: false, isError: false, error: null,
    });
    render(<LambdaPage />, { wrapper: createWrapper() });
    expect(screen.getByText("No functions found")).toBeTruthy();
  });

  it("shows error state", () => {
    mockFunctions.mockReturnValue({
      data: undefined, isLoading: false, isError: true, error: new Error("Failed to load"),
    });
    render(<LambdaPage />, { wrapper: createWrapper() });
    expect(screen.getByText("Failed to load")).toBeTruthy();
  });

  it("renders layers tab", () => {
    render(<LambdaPage />, { wrapper: createWrapper() });
    expect(screen.getByText("Layers")).toBeTruthy();
  });

  // ─── Interaction Tests ──────────────────────────────────

  it("opens create function modal and fills form", async () => {
    const user = userEvent.setup();
    render(<LambdaPage />, { wrapper: createWrapper() });
    const createBtns = screen.getAllByText("Create");
    await user.click(createBtns[0]); // "Create" button in function list
    await waitFor(() => {
      expect(screen.getByPlaceholderText("my-function")).toBeTruthy();
    });
    // Fill function name
    const nameInput = screen.getByPlaceholderText("my-function");
    await user.type(nameInput, "test-fn");
    // Fill handler
    const handlerInput = screen.getByPlaceholderText("index.handler");
    await user.type(handlerInput, "index.handler");
    // Submit
    const modalBtns = screen.getAllByText("Create");
    await user.click(modalBtns[modalBtns.length - 1]);
    expect(mockCreateFunctionMutate).toHaveBeenCalled();
  });
});
