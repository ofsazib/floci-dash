// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { createWrapper } from "../../test/helpers";
import React from "react";

const mockStacks = vi.fn();
const mockStack = vi.fn();
const mockStackTemplate = vi.fn();
const mockCreateStack = vi.fn();
const mockDeleteStack = vi.fn();
const mockValidateTemplate = vi.fn();
const mockExports = vi.fn();

vi.mock("../hooks/useCloudFormation", () => ({
  useStacks: (...args: any[]) => mockStacks(...args),
  useStack: (...args: any[]) => mockStack(...args),
  useStackTemplate: (...args: any[]) => mockStackTemplate(...args),
  useCreateStack: () => ({ mutate: mockCreateStack, isPending: false, isError: false, error: null }),
  useDeleteStack: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useValidateTemplate: () => ({ mutate: vi.fn(), isPending: false }),
  useExports: (...args: any[]) => mockExports(...args),
}));

vi.mock("../components/Toast", () => ({
  useToast: () => ({ showToast: vi.fn() }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
}));

import CloudFormationPage from "./CloudFormationPage";

describe("CloudFormationPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStacks.mockReturnValue({
      data: { stacks: [{ name: "my-stack", status: "CREATE_COMPLETE", creationTime: new Date("2025-01-01"), description: "Test stack" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    mockStack.mockReturnValue({ data: { stack: null, resources: [], events: [] }, isLoading: false, isError: false, error: null });
    mockStackTemplate.mockReturnValue({ data: { template: "{}" }, isLoading: false, isError: false, error: null });
    mockExports.mockReturnValue({ data: { exports: [] }, isLoading: false, isError: false, error: null });
  });

  it("renders stack list", () => {
    render(<CloudFormationPage />, { wrapper: createWrapper() });
    expect(screen.getAllByText("Stacks").length).toBeGreaterThan(0);
    expect(screen.getAllByText("my-stack").length).toBeGreaterThan(0);
    expect(screen.getAllByText("CREATE_COMPLETE").length).toBeGreaterThan(0);
  });

  it("shows create stack button", () => {
    render(<CloudFormationPage />, { wrapper: createWrapper() });
    expect(screen.getByRole("button", { name: /Create stack/i })).toBeTruthy();
  });

  it("renders empty stack list when no data", () => {
    mockStacks.mockReturnValue({ data: { stacks: [], total: 0 }, isLoading: false, isError: false, error: null });
    render(<CloudFormationPage />, { wrapper: createWrapper() });
    expect(screen.getByRole("heading", { name: /Stacks/i, level: 2 })).toBeTruthy();
  });

  it("shows loading state", () => {
    mockStacks.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    render(<CloudFormationPage />, { wrapper: createWrapper() });
    expect(screen.getByRole("heading", { name: /Stacks/i, level: 2 })).toBeTruthy();
  });
});
