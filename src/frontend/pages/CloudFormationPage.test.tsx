// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../test/helpers";
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
  useCreateStack: () => ({ mutate: mockCreateStack, mutateAsync: mockCreateStack, isPending: false, isError: false, error: null }),
  useDeleteStack: () => ({ mutateAsync: mockDeleteStack, isPending: false }),
  useValidateTemplate: () => ({ mutateAsync: mockValidateTemplate, isPending: false }),
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
      data: { stacks: [{ name: "my-stack", status: "CREATE_COMPLETE", creationTime: new Date("2025-01-01"), description: "Test stack", stackId: "arn:aws:cloudformation:us-east-1:123:stack/my-stack/abc" }], total: 1 },
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
    expect(screen.getByText("No stacks")).toBeTruthy();
  });

  it("shows loading state", () => {
    mockStacks.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    render(<CloudFormationPage />, { wrapper: createWrapper() });
    expect(screen.getByRole("heading", { name: /Stacks/i, level: 2 })).toBeTruthy();
  });

  it("renders without crashing in error state", () => {
    mockStacks.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("Failed to load stacks") });
    render(<CloudFormationPage />, { wrapper: createWrapper() });
    expect(screen.getByRole("heading", { name: /Stacks/i, level: 2 })).toBeTruthy();
  });

  it("opens create stack modal when Create stack is clicked", async () => {
    const user = userEvent.setup();
    render(<CloudFormationPage />, { wrapper: createWrapper() });
    await clickButton(user, /Create stack/i);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("my-stack")).toBeTruthy();
    });
  });

  it("creates a stack via modal", async () => {
    mockCreateStack.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<CloudFormationPage />, { wrapper: createWrapper() });
    await clickButton(user, /Create stack/i);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("my-stack")).toBeTruthy();
    });
    await user.type(screen.getByPlaceholderText("my-stack"), "test-stack");
    await clickButton(user, /Create/i, { last: true });
    await waitFor(() => {
      expect(mockCreateStack).toHaveBeenCalled();
    });
  });

  it("validates template in create modal", async () => {
    mockValidateTemplate.mockResolvedValue({ parameters: [] });
    const user = userEvent.setup();
    render(<CloudFormationPage />, { wrapper: createWrapper() });
    await clickButton(user, /Create stack/i);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("my-stack")).toBeTruthy();
    });
    await clickButton(user, /Validate/i);
    await waitFor(() => {
      expect(mockValidateTemplate).toHaveBeenCalled();
    });
  });

  it("opens stack detail modal when View is clicked", async () => {
    const user = userEvent.setup();
    mockStack.mockReturnValue({
      data: { stack: { stackId: "arn:aws:cloudformation:us-east-1:123:stack/my-stack/abc", status: "CREATE_COMPLETE", creationTime: new Date("2025-01-01"), outputs: [], parameters: [], tags: [] }, resources: [], events: [] },
      isLoading: false, isError: false, error: null,
    });
    render(<CloudFormationPage />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getAllByText(/Stack: my-stack/i).length).toBeGreaterThan(0);
    });
  });

  it("shows overview tab with stack details", async () => {
    const user = userEvent.setup();
    mockStack.mockReturnValue({
      data: {
        stack: { stackId: "arn:aws:cloudformation:us-east-1:123:stack/my-stack/abc", status: "CREATE_COMPLETE", creationTime: new Date("2025-01-01"), lastUpdatedTime: new Date("2025-01-02"), outputs: [{ key: "BucketName", value: "my-bucket" }], parameters: [{ key: "Env", value: "prod" }], tags: [{ key: "env", value: "prod" }] },
        resources: [],
        events: [],
      },
      isLoading: false, isError: false, error: null,
    });
    render(<CloudFormationPage />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getByText(/Stack ID:/i)).toBeTruthy();
      expect(screen.getByText(/BucketName/i)).toBeTruthy();
      expect(screen.getAllByText(/Env/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/env: prod/i)).toBeTruthy();
    });
  });

  it("shows no tags message when tags are empty", async () => {
    const user = userEvent.setup();
    mockStack.mockReturnValue({
      data: {
        stack: { stackId: "arn:aws:cloudformation:us-east-1:123:stack/my-stack/abc", status: "CREATE_COMPLETE", creationTime: new Date("2025-01-01"), outputs: [], parameters: [], tags: [] },
        resources: [],
        events: [],
      },
      isLoading: false, isError: false, error: null,
    });
    render(<CloudFormationPage />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getByText("No tags")).toBeTruthy();
    });
  });

  it("shows resources tab in stack detail modal", async () => {
    const user = userEvent.setup();
    mockStack.mockReturnValue({
      data: {
        stack: { stackId: "arn:aws:cloudformation:us-east-1:123:stack/my-stack/abc", status: "CREATE_COMPLETE", creationTime: new Date("2025-01-01"), outputs: [], parameters: [], tags: [] },
        resources: [{ logicalId: "MyBucket", type: "AWS::S3::Bucket", physicalId: "my-bucket", status: "CREATE_COMPLETE" }],
        events: [],
      },
      isLoading: false, isError: false, error: null,
    });
    render(<CloudFormationPage />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getByText(/Stack: my-stack/i)).toBeTruthy();
    });
    await user.click(screen.getByRole("tab", { name: /Resources/i }));
    await waitFor(() => {
      expect(screen.getByText("MyBucket")).toBeTruthy();
      expect(screen.getByText("AWS::S3::Bucket")).toBeTruthy();
    });
  });

  it("shows events tab in stack detail modal", async () => {
    const user = userEvent.setup();
    mockStack.mockReturnValue({
      data: {
        stack: { stackId: "arn:aws:cloudformation:us-east-1:123:stack/my-stack/abc", status: "CREATE_COMPLETE", creationTime: new Date("2025-01-01"), outputs: [], parameters: [], tags: [] },
        resources: [],
        events: [{ eventId: "evt1", logicalId: "MyBucket", status: "CREATE_COMPLETE", timestamp: new Date("2025-01-01") }],
      },
      isLoading: false, isError: false, error: null,
    });
    render(<CloudFormationPage />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getByText(/Stack: my-stack/i)).toBeTruthy();
    });
    await user.click(screen.getByRole("tab", { name: /Events/i }));
    await waitFor(() => {
      expect(screen.getByText("MyBucket")).toBeTruthy();
    });
  });

  it("shows template tab in stack detail modal", async () => {
    const user = userEvent.setup();
    mockStack.mockReturnValue({
      data: {
        stack: { stackId: "arn:aws:cloudformation:us-east-1:123:stack/my-stack/abc", status: "CREATE_COMPLETE", creationTime: new Date("2025-01-01"), outputs: [], parameters: [], tags: [] },
        resources: [],
        events: [],
      },
      isLoading: false, isError: false, error: null,
    });
    mockStackTemplate.mockReturnValue({ data: { template: "AWSTemplateFormatVersion: '2010-09-09'" }, isLoading: false, isError: false, error: null });
    render(<CloudFormationPage />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getByText(/Stack: my-stack/i)).toBeTruthy();
    });
    await user.click(screen.getByRole("tab", { name: /Template/i }));
    await waitFor(() => {
      expect(screen.getByText(/AWSTemplateFormatVersion:/)).toBeTruthy();
    });
  });

  it("shows stack not found when detail has no stack", async () => {
    const user = userEvent.setup();
    render(<CloudFormationPage />, { wrapper: createWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getByText("Stack not found")).toBeTruthy();
    });
  });

  it("deletes a stack via delete button", async () => {
    mockDeleteStack.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<CloudFormationPage />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Delete my-stack/i }));
    await waitFor(() => {
      expect(screen.getByText(/Are you sure/i)).toBeTruthy();
    });
    await clickButton(user, /Delete/i, { last: true });
    await waitFor(() => {
      expect(mockDeleteStack).toHaveBeenCalledWith("my-stack");
    });
  });

  it("shows exports in exports tab", async () => {
    mockExports.mockReturnValue({
      data: { exports: [{ name: "my-export", value: "my-value", exportingStackId: "arn:aws:cloudformation:us-east-1:123:stack/my-stack/abc" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudFormationPage />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Exports/i }));
    await waitFor(() => {
      expect(screen.getByText("my-export")).toBeTruthy();
      expect(screen.getByText("my-value")).toBeTruthy();
    });
  });

  it("shows empty exports state", async () => {
    const user = userEvent.setup();
    render(<CloudFormationPage />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Exports/i }));
    await waitFor(() => {
      expect(screen.getByText("No exports")).toBeTruthy();
    });
  });

  it("shows loading state for exports tab", async () => {
    mockExports.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    const user = userEvent.setup();
    render(<CloudFormationPage />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Exports/i }));
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Exports/i, level: 2 })).toBeTruthy();
    });
  });
});
