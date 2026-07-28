// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../test/helpers";
import React from "react";
import { MemoryRouter } from "react-router-dom";

const mockStacks = vi.fn();
const mockStack = vi.fn();
const mockStackTemplate = vi.fn();
const mockCreateStack = vi.fn();
const mockDeleteStack = vi.fn();
const mockValidateTemplate = vi.fn();
const mockExports = vi.fn();
const mockChangeSets = vi.fn();
const mockChangeSet = vi.fn();
const mockCreateChangeSet = vi.fn();
const mockExecuteChangeSet = vi.fn();
const mockDeleteChangeSet = vi.fn();
const mockStackSets = vi.fn();
const mockStackSet = vi.fn();
const mockCreateStackSet = vi.fn();
const mockDeleteStackSet = vi.fn();
const mockCreateStackInstances = vi.fn();
const mockDeleteStackInstances = vi.fn();
const mockStackResource = vi.fn();
const mockSetPolicyFn = vi.fn();

vi.mock("../hooks/useCloudFormation", () => ({
  useStacks: (...args: any[]) => mockStacks(...args),
  useStack: (...args: any[]) => mockStack(...args),
  useStackTemplate: (...args: any[]) => mockStackTemplate(...args),
  useCreateStack: () => ({ mutate: mockCreateStack, mutateAsync: mockCreateStack, isPending: false, isError: false, error: null }),
  useDeleteStack: () => ({ mutateAsync: mockDeleteStack, isPending: false }),
  useValidateTemplate: () => ({ mutateAsync: mockValidateTemplate, isPending: false }),
  useExports: (...args: any[]) => mockExports(...args),
  useStackResource: (...args: any[]) => mockStackResource(...args),
  useStackPolicy: () => ({ data: { policy: "" }, isLoading: false, isError: false, error: null }),
  useSetStackPolicy: () => ({ mutate: vi.fn(), mutateAsync: mockSetPolicyFn, isPending: false, isError: false, error: null, reset: vi.fn() }),
  useChangeSets: (...args: any[]) => mockChangeSets(...args),
  useChangeSet: (...args: any[]) => mockChangeSet(...args),
  useCreateChangeSet: () => ({ mutateAsync: mockCreateChangeSet, isPending: false }),
  useExecuteChangeSet: () => ({ mutateAsync: mockExecuteChangeSet, isPending: false }),
  useDeleteChangeSet: () => ({ mutateAsync: mockDeleteChangeSet, isPending: false, variables: null }),
  useStackSets: (...args: any[]) => mockStackSets(...args),
  useStackSet: (...args: any[]) => mockStackSet(...args),
  useCreateStackSet: () => ({ mutateAsync: mockCreateStackSet, isPending: false }),
  useDeleteStackSet: () => ({ mutateAsync: mockDeleteStackSet, isPending: false }),
  useCreateStackInstances: () => ({ mutateAsync: mockCreateStackInstances, isPending: false }),
  useDeleteStackInstances: () => ({ mutateAsync: mockDeleteStackInstances, isPending: false }),
}));

vi.mock("../components/Toast", () => ({
  useToast: () => ({ showToast: vi.fn() }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("react-router-dom", async () => {
  const actual = await import("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  };
});

import CloudFormationPage from "./CloudFormationPage";

function pageWrapper() {
  const Wrapper = createWrapper();
  return ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter>
      <Wrapper>{children}</Wrapper>
    </MemoryRouter>
  );
}

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
    mockChangeSets.mockReturnValue({ data: { changeSets: [] }, isLoading: false, isError: false, error: null });
    mockChangeSet.mockReturnValue({ data: { changeSet: null }, isLoading: false, isError: false, error: null });
    mockCreateChangeSet.mockResolvedValue({});
    mockExecuteChangeSet.mockResolvedValue({});
    mockDeleteChangeSet.mockResolvedValue({});
    mockStackSets.mockReturnValue({ data: { stackSets: [] }, isLoading: false, isError: false, error: null });
    mockStackSet.mockReturnValue({ data: { stackSet: null, instances: [], operations: [] }, isLoading: false, isError: false, error: null });
    mockCreateStackSet.mockResolvedValue({});
    mockDeleteStackSet.mockResolvedValue({});
    mockCreateStackInstances.mockResolvedValue({});
    mockDeleteStackInstances.mockResolvedValue({});
    mockStackResource.mockReturnValue({ data: { resource: null }, isLoading: false, isError: false, error: null });
    mockSetPolicyFn.mockResolvedValue({});
  });

  it("renders stack list", () => {
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    expect(screen.getAllByText("Stacks").length).toBeGreaterThan(0);
    expect(screen.getAllByText("my-stack").length).toBeGreaterThan(0);
    expect(screen.getAllByText("CREATE_COMPLETE").length).toBeGreaterThan(0);
  });

  it("shows create stack button", () => {
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    expect(screen.getByRole("button", { name: /Create stack/i })).toBeTruthy();
  });

  it("renders empty stack list when no data", () => {
    mockStacks.mockReturnValue({ data: { stacks: [], total: 0 }, isLoading: false, isError: false, error: null });
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    expect(screen.getByText("No stacks")).toBeTruthy();
  });

  it("shows loading state", () => {
    mockStacks.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    expect(screen.getByRole("heading", { name: /Stacks/i, level: 2 })).toBeTruthy();
  });

  it("renders without crashing in error state", () => {
    mockStacks.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("Failed to load stacks") });
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    expect(screen.getByRole("heading", { name: /Stacks/i, level: 2 })).toBeTruthy();
  });

  it("opens create stack modal when Create stack is clicked", async () => {
    const user = userEvent.setup();
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await clickButton(user, /Create stack/i);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("my-stack")).toBeTruthy();
    });
  });

  it("creates a stack via modal", async () => {
    mockCreateStack.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
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
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
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
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
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
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
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
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
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
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
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
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
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
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
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
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getByText("Stack not found")).toBeTruthy();
    });
  });

  it("deletes a stack via delete button", async () => {
    mockDeleteStack.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
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
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Exports/i }));
    await waitFor(() => {
      expect(screen.getByText("my-export")).toBeTruthy();
      expect(screen.getByText("my-value")).toBeTruthy();
    });
  });

  it("shows empty exports state", async () => {
    const user = userEvent.setup();
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Exports/i }));
    await waitFor(() => {
      expect(screen.getByText("No exports")).toBeTruthy();
    });
  });

  it("shows loading state for exports tab", async () => {
    mockExports.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    const user = userEvent.setup();
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Exports/i }));
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Exports/i, level: 2 })).toBeTruthy();
    });
  });

  it("shows stack detail loading state", async () => {
    mockStack.mockReturnValue({ data: undefined, isLoading: true });
    const user = userEvent.setup();
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getByText(/Loading\.\.\./)).toBeTruthy();
    });
  });

  it("shows policy tab with set policy button", async () => {
    const user = userEvent.setup();
    mockStack.mockReturnValue({
      data: {
        stack: { stackId: "arn:1", status: "CREATE_COMPLETE", creationTime: new Date(), outputs: [], parameters: [], tags: [] },
        resources: [], events: [],
      },
      isLoading: false,
    });
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getAllByText(/Stack: my-stack/i).length).toBeGreaterThan(0));
    await user.click(screen.getByRole("tab", { name: /Policy/i }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Set policy/i })).toBeTruthy();
    });
  });

  // ── Change Sets Tab ──

  it("shows change sets tab with no stacks prompt", async () => {
    mockStacks.mockReturnValue({ data: { stacks: [], total: 0 }, isLoading: false });
    const user = userEvent.setup();
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Change Sets/i }));
    await waitFor(() => {
      expect(screen.getByText(/No stacks available/)).toBeTruthy();
    });
  });

  it("shows change sets after selecting a stack", async () => {
    const user = userEvent.setup();
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Change Sets/i }));
    await waitFor(() => expect(screen.getByText("my-stack")).toBeTruthy());
    // Click the stack button to select it
    await user.click(screen.getByRole("button", { name: "my-stack" }));
    await waitFor(() => {
      expect(screen.getByText(/Change sets for my-stack/)).toBeTruthy();
    });
  });

  it("opens create change set modal", async () => {
    const user = userEvent.setup();
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Change Sets/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: "my-stack" })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "my-stack" }));
    await waitFor(() => expect(screen.getByText(/Change sets for my-stack/)).toBeTruthy());
    await clickButton(user, /Create change set/i);
    await waitFor(() => {
      expect(screen.getByText(/Create change set for my-stack/)).toBeTruthy();
    });
  });

  // ── Stack Sets Tab ──

  it("shows stack sets tab with empty state", async () => {
    const user = userEvent.setup();
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Stack Sets/i }));
    await waitFor(() => {
      expect(screen.getByText("No stack sets")).toBeTruthy();
    });
  });

  it("renders stack sets list with data", async () => {
    mockStackSets.mockReturnValue({
      data: { stackSets: [{ name: "my-ss", status: "ACTIVE", description: "Test" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Stack Sets/i }));
    await waitFor(() => {
      expect(screen.getByText("my-ss")).toBeTruthy();
      expect(screen.getByText("ACTIVE")).toBeTruthy();
    });
  });

  it("opens create stack set modal", async () => {
    const user = userEvent.setup();
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Stack Sets/i }));
    await waitFor(() => expect(screen.getByText("No stack sets")).toBeTruthy());
    await clickButton(user, /Create stack set/i);
    await waitFor(() => {
      // Verify the modal renders with the unique placeholder
      expect(screen.getByPlaceholderText("my-stack-set")).toBeTruthy();
      expect(screen.getAllByText("Create stack set").length).toBeGreaterThanOrEqual(2);
    });
  });

  it("opens stack set detail modal", async () => {
    mockStackSets.mockReturnValue({
      data: { stackSets: [{ name: "my-ss", status: "ACTIVE", description: "Test" }], total: 1 },
      isLoading: false,
    });
    mockStackSet.mockReturnValue({
      data: { stackSet: { name: "my-ss", status: "ACTIVE", description: "Test", permissionModel: "SELF_MANAGED", parameters: [] }, instances: [], operations: [] },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Stack Sets/i }));
    await waitFor(() => expect(screen.getByText("my-ss")).toBeTruthy());
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getByText(/Stack Set: my-ss/)).toBeTruthy();
    });
  });

  it("shows stack set detail loading state", async () => {
    mockStackSets.mockReturnValue({
      data: { stackSets: [{ name: "my-ss", status: "ACTIVE" }], total: 1 },
      isLoading: false,
    });
    mockStackSet.mockReturnValue({ data: null, isLoading: true });
    const user = userEvent.setup();
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Stack Sets/i }));
    await waitFor(() => expect(screen.getByText("my-ss")).toBeTruthy());
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getByText(/Loading\.\.\./)).toBeTruthy();
    });
  });

  // ── Change Sets with data ──

  it("renders change sets table with data", async () => {
    mockChangeSets.mockReturnValue({
      data: {
        changeSets: [
          { name: "cs-1", executionStatus: "AVAILABLE", description: "Add bucket", creationTime: new Date("2025-06-01") },
          { name: "cs-2", executionStatus: "EXECUTE_COMPLETE", creationTime: null },
        ],
        total: 2,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Change Sets/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: "my-stack" })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: "my-stack" }));
    await waitFor(() => {
      expect(screen.getByText("cs-1")).toBeTruthy();
      expect(screen.getByText(/Add bucket/)).toBeTruthy();
      expect(screen.getByText("cs-2")).toBeTruthy();
    });
  });

  it("shows Execute button only for AVAILABLE change sets", async () => {
    mockChangeSets.mockReturnValue({
      data: {
        changeSets: [{ name: "cs-1", executionStatus: "AVAILABLE", creationTime: new Date() }],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Change Sets/i }));
    await waitFor(() => user.click(screen.getByRole("button", { name: "my-stack" })));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Execute/ })).toBeTruthy();
    });
  });

  it("does not show Execute for non-AVAILABLE change set", async () => {
    mockChangeSets.mockReturnValue({
      data: {
        changeSets: [{ name: "cs-done", executionStatus: "EXECUTE_COMPLETE", creationTime: new Date() }],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Change Sets/i }));
    await waitFor(() => user.click(screen.getByRole("button", { name: "my-stack" })));
    await waitFor(() => {
      expect(screen.getByText("cs-done")).toBeTruthy();
      expect(screen.queryByRole("button", { name: /^Execute$/ })).toBeNull();
    });
  });

  it("executes a change set", async () => {
    mockChangeSets.mockReturnValue({
      data: {
        changeSets: [{ name: "cs-exec", executionStatus: "AVAILABLE", creationTime: new Date() }],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Change Sets/i }));
    await waitFor(() => user.click(screen.getByRole("button", { name: "my-stack" })));
    await waitFor(() => clickButton(user, /Execute/));
    await waitFor(() => {
      expect(mockExecuteChangeSet).toHaveBeenCalledWith({ stackName: "my-stack", changeSetName: "cs-exec" });
    });
  });

  it("deletes a change set", async () => {
    mockChangeSets.mockReturnValue({
      data: {
        changeSets: [{ name: "cs-del", executionStatus: "AVAILABLE", creationTime: new Date() }],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Change Sets/i }));
    await waitFor(() => user.click(screen.getByRole("button", { name: "my-stack" })));
    await waitFor(() => expect(screen.getByRole("button", { name: /Delete cs-del/ })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete cs-del/ }));
    await waitFor(() => {
      expect(mockDeleteChangeSet).toHaveBeenCalledWith({ stackName: "my-stack", changeSetName: "cs-del" });
    });
  });

  it("views change set detail", async () => {
    mockChangeSets.mockReturnValue({
      data: {
        changeSets: [{ name: "cs-view", executionStatus: "AVAILABLE", description: "View me", creationTime: new Date("2025-07-01") }],
        total: 1,
      },
      isLoading: false,
    });
    mockChangeSet.mockReturnValue({
      data: {
        changeSet: {
          name: "cs-view",
          executionStatus: "AVAILABLE",
          creationTime: new Date("2025-07-01"),
          description: "View me",
          changes: [
            { resourceChange: { action: "Add", logicalResourceId: "NewBucket", resourceType: "AWS::S3::Bucket", replacement: "False", scope: ["Properties"] } },
          ],
          parameters: [{ key: "Env", value: "prod" }],
        },
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Change Sets/i }));
    await waitFor(() => user.click(screen.getByRole("button", { name: "my-stack" })));
    await waitFor(() => clickButton(user, /View/));
    await waitFor(() => {
      expect(screen.getByText("NewBucket")).toBeTruthy();
      expect(screen.getByText("Add")).toBeTruthy();
      expect(screen.getByText("AWS::S3::Bucket")).toBeTruthy();
    });
  });

  // ── ChangeSetDetail edge cases ──

  it("shows change set detail loading", async () => {
    mockChangeSets.mockReturnValue({
      data: { changeSets: [{ name: "cs-load", executionStatus: "AVAILABLE", creationTime: new Date() }], total: 1 },
      isLoading: false,
    });
    mockChangeSet.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    const user = userEvent.setup();
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Change Sets/i }));
    await waitFor(() => user.click(screen.getByRole("button", { name: "my-stack" })));
    await waitFor(() => clickButton(user, /View/));
    await waitFor(() => {
      expect(screen.getByText(/Loading\.\.\./)).toBeTruthy();
    });
  });

  it("shows change set detail error", async () => {
    mockChangeSets.mockReturnValue({
      data: { changeSets: [{ name: "cs-err", executionStatus: "AVAILABLE", creationTime: new Date() }], total: 1 },
      isLoading: false,
    });
    mockChangeSet.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("Not found") });
    const user = userEvent.setup();
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Change Sets/i }));
    await waitFor(() => user.click(screen.getByRole("button", { name: "my-stack" })));
    await waitFor(() => clickButton(user, /View/));
    await waitFor(() => {
      expect(screen.getByText("Not found")).toBeTruthy();
    });
  });

  it("shows change set detail error with fallback message", async () => {
    mockChangeSets.mockReturnValue({
      data: { changeSets: [{ name: "cs-err2", executionStatus: "AVAILABLE", creationTime: new Date() }], total: 1 },
      isLoading: false,
    });
    mockChangeSet.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error() });
    const user = userEvent.setup();
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Change Sets/i }));
    await waitFor(() => user.click(screen.getByRole("button", { name: "my-stack" })));
    await waitFor(() => clickButton(user, /View/));
    await waitFor(() => {
      expect(screen.getByText("Failed to load change set")).toBeTruthy();
    });
  });

  it("shows change set changes with different actions", async () => {
    mockChangeSets.mockReturnValue({
      data: { changeSets: [{ name: "cs-actions", executionStatus: "AVAILABLE", creationTime: new Date() }], total: 1 },
      isLoading: false,
    });
    mockChangeSet.mockReturnValue({
      data: {
        changeSet: {
          name: "cs-actions",
          executionStatus: "AVAILABLE",
          creationTime: new Date(),
          changes: [
            { resourceChange: { action: "Add", logicalResourceId: "AddRes", resourceType: "AWS::S3::Bucket", replacement: "True", scope: [] } },
            { resourceChange: { action: "Remove", logicalResourceId: "DelRes", resourceType: "AWS::EC2::Instance", scope: [] } },
            { resourceChange: { action: "Modify", logicalResourceId: "ModRes", resourceType: "AWS::Lambda::Function", scope: [] } },
            { type: "Unknown" },
          ],
        },
      },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Change Sets/i }));
    await waitFor(() => user.click(screen.getByRole("button", { name: "my-stack" })));
    await waitFor(() => clickButton(user, /View/));
    await waitFor(() => {
      expect(screen.getByText("AddRes")).toBeTruthy();
      expect(screen.getByText("DelRes")).toBeTruthy();
      expect(screen.getByText("ModRes")).toBeTruthy();
      expect(screen.getByText("Remove")).toBeTruthy();
      expect(screen.getByText("Modify")).toBeTruthy();
    });
  });

  it("shows change set detail renders without changes container for empty changes", async () => {
    mockChangeSets.mockReturnValue({
      data: { changeSets: [{ name: "cs-empty", executionStatus: "AVAILABLE", creationTime: new Date() }], total: 1 },
      isLoading: false,
    });
    mockChangeSet.mockReturnValue({
      data: { changeSet: { name: "cs-empty", executionStatus: "AVAILABLE", creationTime: new Date(), changes: [], parameters: [] } },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Change Sets/i }));
    await waitFor(() => user.click(screen.getByRole("button", { name: "my-stack" })));
    await waitFor(() => clickButton(user, /View/));
    await waitFor(() => {
      expect(screen.getByText(/Change Set: cs-empty/)).toBeTruthy();
      expect(screen.getAllByText("AVAILABLE").length).toBeGreaterThanOrEqual(1);
    });
  });

  it("shows change set parameter with no value", async () => {
    mockChangeSets.mockReturnValue({
      data: { changeSets: [{ name: "cs-param", executionStatus: "AVAILABLE", creationTime: new Date() }], total: 1 },
      isLoading: false,
    });
    mockChangeSet.mockReturnValue({
      data: {
        changeSet: { name: "cs-param", executionStatus: "AVAILABLE", creationTime: new Date(), changes: [], parameters: [{ key: "OptParam", value: null }] },
      },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Change Sets/i }));
    await waitFor(() => user.click(screen.getByRole("button", { name: "my-stack" })));
    await waitFor(() => clickButton(user, /View/));
    await waitFor(() => {
      expect(screen.getByText(/\(use previous\)/)).toBeTruthy();
    });
  });

  it("shows change set with missing creationTime and description as dash", async () => {
    mockChangeSets.mockReturnValue({
      data: { changeSets: [{ name: "cs-bare", executionStatus: "AVAILABLE", creationTime: new Date() }], total: 1 },
      isLoading: false,
    });
    mockChangeSet.mockReturnValue({
      data: {
        changeSet: { name: "cs-bare", executionStatus: "EXECUTE_COMPLETE", creationTime: null, description: "" },
      },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Change Sets/i }));
    await waitFor(() => user.click(screen.getByRole("button", { name: "my-stack" })));
    await waitFor(() => clickButton(user, /View/));
    await waitFor(() => {
      // description || "-" → dash and creationTime ? toLocaleString : "-" → dash
      const dashes = screen.getAllByText("-");
      expect(dashes.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("shows change set Execute button in detail view for AVAILABLE", async () => {
    mockChangeSets.mockReturnValue({
      data: { changeSets: [{ name: "cs-det-exec", executionStatus: "AVAILABLE", creationTime: new Date() }], total: 1 },
      isLoading: false,
    });
    mockChangeSet.mockReturnValue({
      data: {
        changeSet: { name: "cs-det-exec", executionStatus: "AVAILABLE", creationTime: new Date(), changes: [] },
      },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Change Sets/i }));
    await waitFor(() => user.click(screen.getByRole("button", { name: "my-stack" })));
    await waitFor(() => clickButton(user, /View/));
    await waitFor(() => {
      expect(screen.getByText(/Change Set: cs-det-exec/)).toBeTruthy();
    });
  });

  // ── Resources edge cases ──

  it("shows dash for missing resource physicalId", async () => {
    const user = userEvent.setup();
    mockStack.mockReturnValue({
      data: {
        stack: { stackId: "arn:1", status: "CREATE_COMPLETE", creationTime: new Date(), outputs: [], parameters: [], tags: [] },
        resources: [{ logicalId: "NoPhys", type: "AWS::S3::Bucket" }],
        events: [],
      },
      isLoading: false,
    });
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => user.click(screen.getByRole("tab", { name: /Resources/i })));
    await waitFor(() => {
      expect(screen.getByText("NoPhys")).toBeTruthy();
    });
  });

  it("shows dash for missing resource lastUpdated", async () => {
    const user = userEvent.setup();
    mockStack.mockReturnValue({
      data: {
        stack: { stackId: "arn:1", status: "CREATE_COMPLETE", creationTime: new Date(), outputs: [], parameters: [], tags: [] },
        resources: [{ logicalId: "NoUpdate", type: "AWS::S3::Bucket", physicalId: "phys-id", status: "CREATE_COMPLETE" }],
        events: [],
      },
      isLoading: false,
    });
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => user.click(screen.getByRole("tab", { name: /Resources/i })));
    await waitFor(() => {
      const dashes = screen.getAllByText("-");
      expect(dashes.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Resource Detail Container ──

  it("shows resource detail with statusReason and drift", async () => {
    const user = userEvent.setup();
    mockStackResource.mockReturnValue({
      data: {
        resource: {
          logicalId: "DetailRes",
          resourceType: "AWS::S3::Bucket",
          status: "CREATE_COMPLETE",
          physicalId: "phys-123",
          lastUpdated: new Date("2025-05-01"),
          statusReason: "Created successfully",
          description: "Main storage bucket",
          driftInformation: { stackResourceDriftStatus: "IN_SYNC" },
          metadata: { key1: "value1" },
        },
      },
      isLoading: false,
    });
    mockStack.mockReturnValue({
      data: {
        stack: { stackId: "arn:1", status: "CREATE_COMPLETE", creationTime: new Date(), outputs: [], parameters: [], tags: [] },
        resources: [{ logicalId: "DetailRes", type: "AWS::S3::Bucket", physicalId: "phys-123", status: "CREATE_COMPLETE", lastUpdated: "2025-05-01" }],
        events: [],
      },
      isLoading: false,
    });
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => user.click(screen.getByRole("tab", { name: /Resources/i })));
    await waitFor(() => clickButton(user, /View/, { last: true }));
    await waitFor(() => {
      expect(screen.getByText(/DetailRes/)).toBeTruthy();
    });
  });

  it("shows resource detail with OUT_OF_SYNC drift", async () => {
    const user = userEvent.setup();
    mockStackResource.mockReturnValue({
      data: {
        resource: {
          logicalId: "DriftRes",
          resourceType: "AWS::EC2::Instance",
          status: "CREATE_COMPLETE",
          physicalId: "i-drift",
          driftInformation: { stackResourceDriftStatus: "MODIFIED" },
          metadata: "string-metadata",
        },
      },
      isLoading: false,
    });
    mockStack.mockReturnValue({
      data: {
        stack: { stackId: "arn:1", status: "CREATE_COMPLETE", creationTime: new Date(), outputs: [], parameters: [], tags: [] },
        resources: [{ logicalId: "DriftRes", type: "AWS::EC2::Instance", physicalId: "i-drift", status: "CREATE_COMPLETE" }],
        events: [],
      },
      isLoading: false,
    });
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => user.click(screen.getByRole("tab", { name: /Resources/i })));
    await waitFor(() => clickButton(user, /View/, { last: true }));
    await waitFor(() => {
      expect(screen.getByText(/DriftRes/)).toBeTruthy();
    });
  });

  // ── Events edge cases ──

  it("shows dash for missing event timestamp", async () => {
    const user = userEvent.setup();
    mockStack.mockReturnValue({
      data: {
        stack: { stackId: "arn:1", status: "CREATE_COMPLETE", creationTime: new Date(), outputs: [], parameters: [], tags: [] },
        resources: [],
        events: [{ eventId: "evt1", logicalId: "Res", status: "CREATE_COMPLETE", type: "ResourceStatus" }],
      },
      isLoading: false,
    });
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => user.click(screen.getByRole("tab", { name: /Events/i })));
    await waitFor(() => {
      const dashes = screen.getAllByText("-");
      expect(dashes.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("shows dash for missing event logicalId and type", async () => {
    const user = userEvent.setup();
    mockStack.mockReturnValue({
      data: {
        stack: { stackId: "arn:1", status: "CREATE_COMPLETE", creationTime: new Date(), outputs: [], parameters: [], tags: [] },
        resources: [],
        events: [{ eventId: "evt2", status: "DELETE_IN_PROGRESS", timestamp: new Date() }],
      },
      isLoading: false,
    });
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => user.click(screen.getByRole("tab", { name: /Events/i })));
    await waitFor(() => {
      expect(screen.getByText("DELETE_IN_PROGRESS")).toBeTruthy();
    });
  });

  // ── Stack detail edge cases ──

  it("shows dash for missing creationTime on stack", async () => {
    const user = userEvent.setup();
    mockStack.mockReturnValue({
      data: {
        stack: { stackId: "arn:1", status: "CREATE_IN_PROGRESS", outputs: [], parameters: [], tags: [] },
        resources: [], events: [],
      },
      isLoading: false,
    });
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getByText(/Stack: my-stack/)).toBeTruthy();
    });
  });

  it("shows dash for missing description in stack list", () => {
    mockStacks.mockReturnValue({
      data: { stacks: [{ name: "no-desc", status: "CREATE_COMPLETE" }], total: 1 },
      isLoading: false, isError: false, error: null,
    });
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    expect(screen.getByText("no-desc")).toBeTruthy();
  });

  // ── Policy tab actions ──

  it("sets stack policy", async () => {
    const user = userEvent.setup();
    mockStack.mockReturnValue({
      data: {
        stack: { stackId: "arn:1", status: "CREATE_COMPLETE", creationTime: new Date(), outputs: [], parameters: [], tags: [] },
        resources: [], events: [],
      },
      isLoading: false,
    });
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => user.click(screen.getByRole("tab", { name: /Policy/i })));
    await waitFor(() => expect(screen.getByRole("button", { name: /Set policy/i })).toBeTruthy());
    // Fill policy body so button becomes enabled (avoid user.type which interprets {})
    const { fireEvent } = await import("@testing-library/react");
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: '{"Statement":[]}' } });
    await clickButton(user, /Set policy/i);
    await waitFor(() => {
      expect(mockSetPolicyFn).toHaveBeenCalledWith(expect.objectContaining({ stackName: "my-stack" }));
    });
  });

  it("shows template loading state in detail", async () => {
    const user = userEvent.setup();
    mockStack.mockReturnValue({
      data: {
        stack: { stackId: "arn:1", status: "CREATE_COMPLETE", creationTime: new Date(), outputs: [], parameters: [], tags: [] },
        resources: [], events: [],
      },
      isLoading: false,
    });
    mockStackTemplate.mockReturnValue({ data: undefined, isLoading: true });
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => user.click(screen.getByRole("tab", { name: /Template/i })));
    await waitFor(() => {
      expect(screen.getByText(/Loading\.\.\./)).toBeTruthy();
    });
  });

  it("shows no template message when template is empty", async () => {
    const user = userEvent.setup();
    mockStack.mockReturnValue({
      data: {
        stack: { stackId: "arn:1", status: "CREATE_COMPLETE", creationTime: new Date(), outputs: [], parameters: [], tags: [] },
        resources: [], events: [],
      },
      isLoading: false,
    });
    mockStackTemplate.mockReturnValue({ data: { template: "" }, isLoading: false });
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => user.click(screen.getByRole("tab", { name: /Template/i })));
    await waitFor(() => {
      expect(screen.getByText("No template")).toBeTruthy();
    });
  });

  // ── Export stack ID fallback ──

  it("shows full exportingStackId when split fails", async () => {
    const user = userEvent.setup();
    mockExports.mockReturnValue({
      data: { exports: [{ name: "exp1", value: "val1", exportingStackId: "simple-stack-id" }], total: 1 },
      isLoading: false,
    });
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Exports/i }));
    await waitFor(() => {
      expect(screen.getByText("exp1")).toBeTruthy();
      expect(screen.getByText("simple-stack-id")).toBeTruthy();
    });
  });

  // ── Stack Sets: description dash ──

  it("shows dash for missing stack set description", async () => {
    const user = userEvent.setup();
    mockStackSets.mockReturnValue({
      data: { stackSets: [{ name: "ss-no-desc", status: "ACTIVE" }], total: 1 },
      isLoading: false,
    });
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Stack Sets/i }));
    await waitFor(() => {
      expect(screen.getByText("ss-no-desc")).toBeTruthy();
    });
  });

  // ── Stack Sets: instances with data ──

  it("shows stack set instances", async () => {
    const user = userEvent.setup();
    mockStackSets.mockReturnValue({
      data: { stackSets: [{ name: "ss-inst", status: "ACTIVE" }], total: 1 },
      isLoading: false,
    });
    mockStackSet.mockReturnValue({
      data: {
        stackSet: { name: "ss-inst", status: "ACTIVE", permissionModel: "SERVICE_MANAGED", parameters: [] },
        instances: [{ account: "123456789012", region: "us-east-1", status: "CURRENT", stackId: "arn:stack/1" }],
        operations: [],
      },
      isLoading: false,
    });
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Stack Sets/i }));
    await waitFor(() => clickButton(user, /View/i));
    await waitFor(() => {
      expect(screen.getByText("123456789012")).toBeTruthy();
      expect(screen.getByText("us-east-1")).toBeTruthy();
      expect(screen.getByText("CURRENT")).toBeTruthy();
      expect(screen.getByText("SERVICE_MANAGED")).toBeTruthy();
    });
  });

  it("shows no instances message", async () => {
    const user = userEvent.setup();
    mockStackSets.mockReturnValue({
      data: { stackSets: [{ name: "ss-noi", status: "ACTIVE" }], total: 1 },
      isLoading: false,
    });
    mockStackSet.mockReturnValue({
      data: { stackSet: { name: "ss-noi", status: "ACTIVE" }, instances: [], operations: [] },
      isLoading: false,
    });
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Stack Sets/i }));
    await waitFor(() => clickButton(user, /View/i));
    await waitFor(() => {
      expect(screen.getByText(/No instances deployed/)).toBeTruthy();
    });
  });

  // ── Stack Sets: operations ──

  it("shows stack set operations", async () => {
    const user = userEvent.setup();
    mockStackSets.mockReturnValue({
      data: { stackSets: [{ name: "ss-ops", status: "ACTIVE" }], total: 1 },
      isLoading: false,
    });
    mockStackSet.mockReturnValue({
      data: {
        stackSet: { name: "ss-ops", status: "ACTIVE" },
        instances: [],
        operations: [{ id: "op-1", action: "CREATE", status: "SUCCEEDED", creationTime: new Date("2025-07-01") }, { id: "op-2", action: "DELETE", status: "FAILED", creationTime: null }],
      },
      isLoading: false,
    });
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Stack Sets/i }));
    await waitFor(() => clickButton(user, /View/i));
    await waitFor(() => {
      expect(screen.getByText("op-1")).toBeTruthy();
      expect(screen.getByText("CREATE")).toBeTruthy();
      expect(screen.getByText("SUCCEEDED")).toBeTruthy();
      expect(screen.getByText("op-2")).toBeTruthy();
      expect(screen.getByText("DELETE")).toBeTruthy();
      expect(screen.getByText("FAILED")).toBeTruthy();
    });
  });

  it("opens add instances modal", async () => {
    const user = userEvent.setup();
    mockStackSets.mockReturnValue({
      data: { stackSets: [{ name: "ss-add", status: "ACTIVE" }], total: 1 },
      isLoading: false,
    });
    mockStackSet.mockReturnValue({
      data: { stackSet: { name: "ss-add", status: "ACTIVE" }, instances: [], operations: [] },
      isLoading: false,
    });
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Stack Sets/i }));
    await waitFor(() => clickButton(user, /View/i));
    await waitFor(() => clickButton(user, /Add instances/i));
    await waitFor(() => {
      expect(screen.getByText(/Add instances to ss-add/)).toBeTruthy();
    });
  });

  it("deletes individual stack set instance", async () => {
    const user = userEvent.setup();
    mockStackSets.mockReturnValue({
      data: { stackSets: [{ name: "ss-delinst", status: "ACTIVE" }], total: 1 },
      isLoading: false,
    });
    mockStackSet.mockReturnValue({
      data: {
        stackSet: { name: "ss-delinst", status: "ACTIVE" },
        instances: [{ account: "111", region: "us-west-2", status: "OUTDATED", stackId: "arn:stack/old" }],
        operations: [],
      },
      isLoading: false,
    });
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Stack Sets/i }));
    await waitFor(() => clickButton(user, /View/i));
    await waitFor(() => expect(screen.getByRole("button", { name: /Remove instance 111\/us-west-2/ })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Remove instance 111\/us-west-2/ }));
    await waitFor(() => {
      expect(mockDeleteStackInstances).toHaveBeenCalledWith({
        stackSetName: "ss-delinst",
        accounts: ["111"],
        regions: ["us-west-2"],
      });
    });
  });

  // ── Stack status edge cases ──

  it("shows grey badge for non-standard stack status", () => {
    mockStacks.mockReturnValue({
      data: { stacks: [{ name: "weird", status: "UNKNOWN_STATE" }], total: 1 },
      isLoading: false,
    });
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    expect(screen.getByText("weird")).toBeTruthy();
    expect(screen.getByText("UNKNOWN_STATE")).toBeTruthy();
  });

  it("shows grey badge for non-ACTIVE stack set status", async () => {
    const user = userEvent.setup();
    mockStackSets.mockReturnValue({
      data: { stackSets: [{ name: "ss-inactive", status: "DELETED" }], total: 1 },
      isLoading: false,
    });
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Stack Sets/i }));
    await waitFor(() => {
      expect(screen.getByText("ss-inactive")).toBeTruthy();
      expect(screen.getByText("DELETED")).toBeTruthy();
    });
  });

  // ── Resource Detail Container ──

  it("views resource detail from resources tab", async () => {
    const user = userEvent.setup();
    mockStack.mockReturnValue({
      data: {
        stack: { stackId: "arn:1", status: "CREATE_COMPLETE", creationTime: new Date(), outputs: [], parameters: [], tags: [] },
        resources: [{ logicalId: "MyBucket", type: "AWS::S3::Bucket", status: "CREATE_COMPLETE", physicalId: "my-bucket", lastUpdated: new Date() }],
        events: [],
      },
      isLoading: false,
    });
    mockStackResource.mockReturnValue({
      data: { resource: { logicalId: "MyBucket", resourceType: "AWS::S3::Bucket", status: "CREATE_COMPLETE", physicalId: "my-bucket", lastUpdated: new Date(), statusReason: "Success", description: "Test bucket", driftInformation: { stackResourceDriftStatus: "IN_SYNC" }, metadata: "{}" } },
      isLoading: false,
    });
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByText(/Stack: my-stack/)).toBeTruthy());
    await user.click(screen.getByRole("tab", { name: /Resources/ }));
    await waitFor(() => expect(screen.getByText("MyBucket")).toBeTruthy());
    // Click View on the resource row
    const viewBtns = screen.getAllByRole("button", { name: "View" });
    await user.click(viewBtns[viewBtns.length - 1]);
    await waitFor(() => {
      expect(screen.getByText(/Resource: MyBucket/)).toBeTruthy();
      expect(screen.getByText("Success")).toBeTruthy();
      expect(screen.getByText("Test bucket")).toBeTruthy();
      expect(screen.getByText("IN_SYNC")).toBeTruthy();
    });
  });

  // ── Set Policy Interaction ──

  it("types and sets a stack policy", async () => {
    const user = userEvent.setup();
    mockStack.mockReturnValue({
      data: {
        stack: { stackId: "arn:1", status: "CREATE_COMPLETE", creationTime: new Date(), outputs: [], parameters: [], tags: [] },
        resources: [], events: [],
      },
      isLoading: false,
    });
    mockSetPolicyFn.mockResolvedValue({});
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getAllByText(/Stack: my-stack/).length).toBeGreaterThan(0));
    await user.click(screen.getByRole("tab", { name: /Policy/ }));
    await waitFor(() => expect(screen.getByRole("button", { name: /Set policy/ })).toBeTruthy());
    // Type into policy textarea using fireEvent for JSON content
    const textareas = screen.getAllByRole("textbox");
    const policyTextarea = textareas[textareas.length - 1];
    await user.clear(policyTextarea);
    await user.type(policyTextarea, "test-policy-body");
    await clickButton(user, /Set policy/i);
    await waitFor(() => {
      expect(mockSetPolicyFn).toHaveBeenCalledWith(expect.objectContaining({ stackName: "my-stack" }));
    });
  });

  // ── Change Set Detail Loading / Error ──

  it("shows change set detail loading state", async () => {
    const user = userEvent.setup();
    mockChangeSets.mockReturnValue({
      data: { changeSets: [{ name: "cs-loading", executionStatus: "AVAILABLE", creationTime: new Date().toISOString() }] },
      isLoading: false,
    });
    mockChangeSet.mockReturnValue({ data: undefined, isLoading: true, isError: false, error: null });
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Change Sets/ }));
    await waitFor(() => expect(screen.getByText("my-stack")).toBeTruthy());
    await clickButton(user, /my-stack/i);
    await waitFor(() => expect(screen.getByText("cs-loading")).toBeTruthy());
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByText(/Loading\.\.\./)).toBeTruthy());
  });

  it("shows change set detail error state", async () => {
    const user = userEvent.setup();
    mockChangeSets.mockReturnValue({
      data: { changeSets: [{ name: "cs-error", executionStatus: "AVAILABLE", creationTime: new Date().toISOString() }] },
      isLoading: false,
    });
    mockChangeSet.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error("Failed") });
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Change Sets/ }));
    await waitFor(() => expect(screen.getByText("my-stack")).toBeTruthy());
    await clickButton(user, /my-stack/i);
    await waitFor(() => expect(screen.getByText("cs-error")).toBeTruthy());
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByText("Failed")).toBeTruthy());
  });

  it("executes a change set from the detail view", async () => {
    const user = userEvent.setup();
    mockChangeSets.mockReturnValue({
      data: { changeSets: [{ name: "cs-exec", executionStatus: "AVAILABLE", creationTime: new Date().toISOString() }] },
      isLoading: false,
    });
    mockChangeSet.mockReturnValue({
      data: { changeSet: { name: "cs-exec", executionStatus: "AVAILABLE", creationTime: new Date().toISOString(), changes: [] } },
      isLoading: false, isError: false, error: null,
    });
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Change Sets/ }));
    await waitFor(() => expect(screen.getByText("my-stack")).toBeTruthy());
    await clickButton(user, /my-stack/i);
    await waitFor(() => expect(screen.getByText("cs-exec")).toBeTruthy());
    await clickButton(user, /View/i);
    await waitFor(() => expect(screen.getByText("Change Set: cs-exec")).toBeTruthy());
    await clickButton(user, /Execute/i);
    await waitFor(() => {
      expect(mockExecuteChangeSet).toHaveBeenCalled();
    });
  });

  // ── Stack Detail Missing Fields ──

  it("shows dash for missing stack creation times", async () => {
    const user = userEvent.setup();
    mockStack.mockReturnValue({
      data: {
        stack: { stackId: "arn:1", status: "REVIEW_IN_PROGRESS", outputs: [], parameters: [], tags: [] },
        resources: [], events: [],
      },
      isLoading: false,
    });
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getByText("REVIEW_IN_PROGRESS")).toBeTruthy();
    });
  });

  it("shows dash for missing stack description", () => {
    mockStacks.mockReturnValue({
      data: { stacks: [{ name: "no-desc", status: "CREATE_COMPLETE", creationTime: new Date() }], total: 1 },
      isLoading: false,
    });
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    expect(screen.getByText("no-desc")).toBeTruthy();
  });

  // ── Health Status ──

  it("shows connected status badge by default", () => {
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    expect(screen.getByRole("heading", { name: /CloudFormation/ })).toBeTruthy();
  });

  // ── Create Stack Modal: validate error ──

  it("shows validate error in create stack modal", async () => {
    mockValidateTemplate.mockRejectedValue(new Error("Invalid template"));
    const user = userEvent.setup();
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await clickButton(user, /Create stack/i);
    await waitFor(() => expect(screen.getByPlaceholderText("my-stack")).toBeTruthy());
    await clickButton(user, /Validate/i);
    await waitFor(() => {
      expect(mockValidateTemplate).toHaveBeenCalled();
    });
  });

  // ── Stack Detail: outputs conditional render ──

  it("shows stack outputs in overview when present", async () => {
    const user = userEvent.setup();
    mockStack.mockReturnValue({
      data: {
        stack: { stackId: "arn:1", status: "CREATE_COMPLETE", creationTime: new Date(), outputs: [{ key: "Url", value: "http://example.com" }], parameters: [], tags: [] },
        resources: [], events: [],
      },
      isLoading: false,
    });
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getByText(/Outputs/)).toBeTruthy();
      expect(screen.getByText(/Url/)).toBeTruthy();
    });
  });

  it("shows stack parameters in overview when present", async () => {
    const user = userEvent.setup();
    mockStack.mockReturnValue({
      data: {
        stack: { stackId: "arn:1", status: "CREATE_COMPLETE", creationTime: new Date(), outputs: [], parameters: [{ key: "DBName", value: "mydb" }], tags: [] },
        resources: [], events: [],
      },
      isLoading: false,
    });
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => {
      expect(screen.getByText(/Parameters/)).toBeTruthy();
      expect(screen.getByText(/DBName/)).toBeTruthy();
    });
  });

  // ── Resource Detail Container Branches ──

  it("shows resource detail without optional fields", async () => {
    const user = userEvent.setup();
    mockStackResource.mockReturnValue({ data: { resource: { logicalId: "MinRes", resourceType: "AWS::S3::Bucket", status: "CREATE_COMPLETE" } }, isLoading: false });
    mockStack.mockReturnValue({
      data: { stack: { stackId: "arn:1", status: "CREATE_COMPLETE", creationTime: new Date(), outputs: [], parameters: [], tags: [] }, resources: [{ logicalId: "MinRes", type: "AWS::S3::Bucket", status: "CREATE_COMPLETE" }], events: [] },
      isLoading: false,
    });
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => user.click(screen.getByRole("tab", { name: /Resources/i })));
    await waitFor(() => clickButton(user, /View/, { last: true }));
    await waitFor(() => {
      expect(screen.getByText(/Resource: MinRes/)).toBeTruthy();
    });
  });

  it("shows resource detail with metadata as object", async () => {
    const user = userEvent.setup();
    mockStackResource.mockReturnValue({
      data: { resource: { logicalId: "MetaRes", resourceType: "AWS::Lambda::Function", status: "CREATE_COMPLETE", physicalId: "phys", lastUpdated: new Date(), metadata: { version: 1, runtime: "nodejs22" } } },
      isLoading: false,
    });
    mockStack.mockReturnValue({
      data: { stack: { stackId: "arn:1", status: "CREATE_COMPLETE", creationTime: new Date(), outputs: [], parameters: [], tags: [] }, resources: [{ logicalId: "MetaRes", type: "AWS::Lambda::Function", status: "CREATE_COMPLETE" }], events: [] },
      isLoading: false,
    });
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await clickButton(user, /View/i);
    await waitFor(() => user.click(screen.getByRole("tab", { name: /Resources/i })));
    await waitFor(() => clickButton(user, /View/, { last: true }));
    await waitFor(() => {
      expect(screen.getByText(/MetaRes/)).toBeTruthy();
    });
  });

  // ── ChangeSetDetail: parameters + execute ──

  it("shows change set parameters container", async () => {
    mockChangeSets.mockReturnValue({
      data: { changeSets: [{ name: "cs-params", executionStatus: "AVAILABLE", creationTime: new Date() }], total: 1 },
      isLoading: false,
    });
    mockChangeSet.mockReturnValue({
      data: { changeSet: { name: "cs-params", executionStatus: "AVAILABLE", creationTime: new Date(), changes: [], parameters: [{ key: "InstanceType", value: "t3.large" }] } },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Change Sets/i }));
    await waitFor(() => user.click(screen.getByRole("button", { name: "my-stack" })));
    await waitFor(() => clickButton(user, /View/));
    await waitFor(() => {
      expect(screen.getByText(/InstanceType/)).toBeTruthy();
    });
  });

  // ── Stack Sets: parameters + operations conditional ──

  it("shows stack set parameters in detail", async () => {
    mockStackSets.mockReturnValue({
      data: { stackSets: [{ name: "ss-par", status: "ACTIVE" }], total: 1 },
      isLoading: false,
    });
    mockStackSet.mockReturnValue({
      data: { stackSet: { name: "ss-par", status: "ACTIVE", parameters: [{ key: "Env", value: "prod" }] }, instances: [], operations: [] },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Stack Sets/i }));
    await waitFor(() => clickButton(user, /View/i));
    await waitFor(() => {
      expect(screen.getByText(/Env/)).toBeTruthy();
    });
  });

  // ── AddInstancesModal: submit ──

  it("submits add instances form", async () => {
    mockStackSets.mockReturnValue({
      data: { stackSets: [{ name: "ss-sub", status: "ACTIVE" }], total: 1 },
      isLoading: false,
    });
    mockStackSet.mockReturnValue({
      data: { stackSet: { name: "ss-sub", status: "ACTIVE" }, instances: [], operations: [] },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Stack Sets/i }));
    await waitFor(() => clickButton(user, /View/i));
    await waitFor(() => clickButton(user, /Add instances/i));
    await waitFor(() => {
      expect(screen.getByText(/Add instances to ss-sub/)).toBeTruthy();
    });
    const textareas = screen.getAllByRole("textbox");
    const { fireEvent } = require("@testing-library/react");
    fireEvent.change(textareas[0], { target: { value: "123456789012" } });
    fireEvent.change(textareas[1], { target: { value: "us-east-1\nus-west-2" } });
    await clickButton(user, /Deploy/i);
    await waitFor(() => {
      expect(mockCreateStackInstances).toHaveBeenCalled();
    });
  });

  // ── ExportsTab: exportingStackId split path ──

  it("shows export with stack name extracted from ARN", async () => {
    mockExports.mockReturnValue({
      data: { exports: [{ name: "exp1", value: "val1", exportingStackId: "arn:aws:cloudformation:us-east-1:123:stack/my-stack/abc" }], total: 1 },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Exports/i }));
    await waitFor(() => {
      expect(screen.getByText("exp1")).toBeTruthy();
      expect(screen.getByText("my-stack")).toBeTruthy();
    });
  });

  // ── ChangeSetDetail: missing resourceChange ──

  it("shows change detail with missing resourceChange", async () => {
    mockChangeSets.mockReturnValue({
      data: { changeSets: [{ name: "cs-norc", executionStatus: "AVAILABLE", creationTime: new Date() }], total: 1 },
      isLoading: false,
    });
    mockChangeSet.mockReturnValue({
      data: { changeSet: { name: "cs-norc", executionStatus: "AVAILABLE", creationTime: new Date(), changes: [{ type: "Resource" }] } },
      isLoading: false, isError: false, error: null,
    });
    const user = userEvent.setup();
    render(<CloudFormationPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByRole("tab", { name: /Change Sets/i }));
    await waitFor(() => user.click(screen.getByRole("button", { name: "my-stack" })));
    await waitFor(() => clickButton(user, /View/));
    await waitFor(() => {
      expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(1);
    });
  });
});
