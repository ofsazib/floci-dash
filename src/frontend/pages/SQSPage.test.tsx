// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../test/helpers";
import React from "react";

const mockSQSQueues = vi.fn();
const mockSQSAttributes = vi.fn();
const mockSQSMessages = vi.fn();
const mockSQSQueueTags = vi.fn();
const mockSQSDLQSources = vi.fn();
const mockMoveTasksQuery = vi.fn();
const mockStartMoveTask = vi.fn();
const mockCancelMoveTask = vi.fn();
const cancelMoveState = vi.hoisted(() => ({ isPending: false, variables: null as string | null }));
const mockCreateQueueMutate = vi.fn();
const mockDeleteQueueMutate = vi.fn();
const mockPurgeQueueMutate = vi.fn();
const mockSendMessageMutate = vi.fn();
const mockDeleteMessageMutate = vi.fn();
const mockSetAttrsMutate = vi.fn();
const mockTagMutate = vi.fn();
const mockUntagMutate = vi.fn();
const mockSearchParams = vi.fn();
const mockSetSearchParams = vi.fn();
const mockShowToast = vi.fn();
const mockConfirm = vi.fn();

vi.mock("../hooks/useSQS", () => ({
  useSQSQueues: (...args: any[]) => mockSQSQueues(...args),
  useSQSQueueAttributes: (...args: any[]) => mockSQSAttributes(...args),
  useSQSMessages: (...args: any[]) => mockSQSMessages(...args),
  useSQSQueueTags: (...args: any[]) => mockSQSQueueTags(...args),
  useSQSDLQSources: (...args: any[]) => mockSQSDLQSources(...args),
  useSQSStartMoveTask: () => ({
    mutateAsync: mockStartMoveTask,
    isPending: false,
  }),
  useSQSMoveTasks: (...args: any[]) => mockMoveTasksQuery(...args),
  useSQSCancelMoveTask: () => ({
    mutateAsync: mockCancelMoveTask,
    get isPending() { return cancelMoveState.isPending; },
    get variables() { return cancelMoveState.variables; },
  }),
  useCreateSQSQueue: () => ({ mutate: mockCreateQueueMutate, isPending: false }),
  useDeleteSQSQueue: () => ({ mutate: mockDeleteQueueMutate, isPending: false }),
  usePurgeSQSQueue: () => ({ mutate: mockPurgeQueueMutate, isPending: false }),
  useSendSQSMessage: () => ({ mutate: mockSendMessageMutate, isPending: false }),
  useDeleteSQSMessage: () => ({ mutate: mockDeleteMessageMutate, isPending: false }),
  useSetSQSAttributes: () => ({ mutate: mockSetAttrsMutate, isPending: false }),
  useSQSTags: () => ({ tag: { mutate: mockTagMutate, isPending: false }, untag: { mutate: mockUntagMutate, isPending: false } }),
  extractQueueName: (url: string) => url.split("/").pop() || url,
}));

vi.mock("../hooks/useSystem", () => ({
  useHealth: () => ({ data: { services: { sqs: "running" } } }),
}));

vi.mock("../components/Toast", () => ({
  useToast: () => ({ showToast: mockShowToast }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("../components/ConfirmDialog", () => ({
  useConfirmDialog: () => ({ confirm: (...args: any[]) => mockConfirm(...args), dialog: null }),
}));

vi.mock("react-router-dom", () => ({
  useSearchParams: (...args: any[]) => mockSearchParams(...args),
}));

import SQSPage, { queueUrlToArn } from "./SQSPage";
describe("SQSPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSQSQueues.mockReturnValue({
      data: { queueUrls: ["http://localhost:4566/000000000000/my-queue"] },
      isLoading: false, isError: false, error: null,
    });
    mockSQSAttributes.mockReturnValue({ data: { attributes: {} }, isLoading: false });
    mockSQSMessages.mockReturnValue({ data: { messages: [] }, isLoading: false });
    mockSQSQueueTags.mockReturnValue({ data: { tags: {} }, isLoading: false });
    mockSQSDLQSources.mockReturnValue({ data: { queueUrls: [] }, isLoading: false });
    mockMoveTasksQuery.mockReturnValue({ data: { tasks: [], total: 0 } });
    mockStartMoveTask.mockResolvedValue({ taskHandle: "h-new" });
    mockCancelMoveTask.mockResolvedValue({ moved: 5 });
    mockSearchParams.mockReturnValue([new URLSearchParams(), mockSetSearchParams]);
    mockConfirm.mockResolvedValue(true);
    mockCreateQueueMutate.mockImplementation((_args: any, opts: any) => opts?.onSuccess?.({}));
    mockDeleteQueueMutate.mockImplementation((_args: any, opts: any) => opts?.onSuccess?.());
    mockPurgeQueueMutate.mockImplementation((_args: any, opts: any) => opts?.onSuccess?.());
    mockSendMessageMutate.mockImplementation((_args: any, opts: any) => opts?.onSuccess?.({ messageId: "abc123def456" }));
    mockDeleteMessageMutate.mockImplementation((_args: any, opts: any) => opts?.onSuccess?.());
    mockSetAttrsMutate.mockImplementation((_args: any, opts: any) => opts?.onSuccess?.());
    mockTagMutate.mockImplementation((_args: any, opts: any) => opts?.onSuccess?.());
    mockUntagMutate.mockImplementation((_args: any, opts: any) => opts?.onSuccess?.());
  });

  // ─── Render State Tests ─────────────────────────────────

  it("renders queue list", () => {
    render(<SQSPage />, { wrapper: createWrapper() });
    expect(screen.getByText("SQS")).toBeTruthy();
    expect(screen.getByText("Queues")).toBeTruthy();
    expect(screen.getByText("my-queue")).toBeTruthy();
  });

  it("shows empty state", () => {
    mockSQSQueues.mockReturnValue({
      data: { queueUrls: [] },
      isLoading: false, isError: false, error: null,
    });
    render(<SQSPage />, { wrapper: createWrapper() });
    expect(screen.getByText("No queues found")).toBeTruthy();
  });

  it("shows loading state", () => {
    mockSQSQueues.mockReturnValue({
      data: undefined, isLoading: true, isError: false, error: null,
    });
    render(<SQSPage />, { wrapper: createWrapper() });
    expect(screen.getByText("Loading queues...")).toBeTruthy();
  });

  it("shows error state", () => {
    mockSQSQueues.mockReturnValue({
      data: undefined, isLoading: false, isError: true, error: new Error("Failed to load queues"),
    });
    render(<SQSPage />, { wrapper: createWrapper() });
    expect(screen.getByText("Failed to load queues")).toBeTruthy();
  });

  // ─── Interaction Tests ──────────────────────────────────

  it("opens create queue modal when Create queue button is clicked", async () => {
    const user = userEvent.setup();
    render(<SQSPage />, { wrapper: createWrapper() });
    await clickButton(user, /create queue/i);
    await waitFor(() => {
      const inputs = screen.getAllByPlaceholderText("my-queue");
      expect(inputs.length).toBeGreaterThan(0);
    });
  });

  it("submits create queue form", async () => {
    const user = userEvent.setup();
    render(<SQSPage />, { wrapper: createWrapper() });
    await clickButton(user, /create queue/i);
    await waitFor(() => {
      expect(screen.getAllByPlaceholderText("my-queue").length).toBeGreaterThan(0);
    });
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "test-queue");
    await clickButton(user, /Create/i, { last: true });
    expect(mockCreateQueueMutate).toHaveBeenCalled();
  });

  // ─── Queue Detail Tests ─────────────────────────────────

  it("renders queue detail with tabs", () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("?queueUrl=http://localhost:4566/000000000000/my-queue"), vi.fn()]);
    render(<SQSPage />, { wrapper: createWrapper() });
    expect(screen.getAllByText("Attributes").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Messages").length).toBeGreaterThan(0);
  });

  it("shows queue attributes in detail view", () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("?queueUrl=http://localhost:4566/000000000000/my-queue"), vi.fn()]);
    mockSQSAttributes.mockReturnValue({
      data: { attributes: { QueueArn: "arn:aws:sqs:us-east-1:000000000000:my-queue", VisibilityTimeout: "60", ApproximateNumberOfMessages: "5" } },
      isLoading: false,
    });
    render(<SQSPage />, { wrapper: createWrapper() });
    expect(screen.getByText("arn:aws:sqs:us-east-1:000000000000:my-queue")).toBeTruthy();
    expect(screen.getByText("5")).toBeTruthy();
  });

  it("shows messages in detail view", async () => {
    const user = userEvent.setup();
    mockSearchParams.mockReturnValue([new URLSearchParams("?queueUrl=http://localhost:4566/000000000000/my-queue"), vi.fn()]);
    mockSQSMessages.mockReturnValue({
      data: { messages: [{ MessageId: "abc123def456", Body: "Hello world message", MD5OfBody: "md5hash", ReceiptHandle: "handle123", Attributes: { ApproximateReceiveCount: "1", SentTimestamp: "1700000000000" } }] },
      isLoading: false,
    });
    render(<SQSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Messages"));
    await waitFor(() => {
      expect(screen.getByText("Hello world message")).toBeTruthy();
    });
  });

  it("shows tags in detail view", async () => {
    const user = userEvent.setup();
    mockSearchParams.mockReturnValue([new URLSearchParams("?queueUrl=http://localhost:4566/000000000000/my-queue"), vi.fn()]);
    mockSQSQueueTags.mockReturnValue({
      data: { tags: { Environment: "production" } },
      isLoading: false,
    });
    render(<SQSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Tags"));
    await waitFor(() => {
      expect(screen.getByText("Environment")).toBeTruthy();
      expect(screen.getByText("production")).toBeTruthy();
    });
  });

  // ─── DLQ Tab Tests ───────────────────────────────────────

  it("shows DLQ sources in DLQ tab", async () => {
    const user = userEvent.setup();
    mockSearchParams.mockReturnValue([new URLSearchParams("?queueUrl=http://localhost:4566/000000000000/my-queue"), vi.fn()]);
    mockSQSDLQSources.mockReturnValue({
      data: { queueUrls: ["http://localhost:4566/000000000000/source-queue"] },
      isLoading: false,
    });
    render(<SQSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("DLQ"));
    await waitFor(() => {
      expect(screen.getByText("Dead Letter Queue Sources")).toBeTruthy();
      expect(screen.getByText("source-queue")).toBeTruthy();
    });
  });

  it("shows DLQ empty state when no sources", async () => {
    const user = userEvent.setup();
    mockSearchParams.mockReturnValue([new URLSearchParams("?queueUrl=http://localhost:4566/000000000000/my-queue"), vi.fn()]);
    mockSQSDLQSources.mockReturnValue({ data: { queueUrls: [] }, isLoading: false });
    render(<SQSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("DLQ"));
    await waitFor(() => {
      expect(screen.getByText("No queues are using this queue as a dead letter queue")).toBeTruthy();
    });
  });

  it("shows DLQ loading spinner", async () => {
    const user = userEvent.setup();
    mockSearchParams.mockReturnValue([new URLSearchParams("?queueUrl=http://localhost:4566/000000000000/my-queue"), vi.fn()]);
    mockSQSDLQSources.mockReturnValue({ data: undefined, isLoading: true });
    render(<SQSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("DLQ"));
    expect(screen.getByText("Dead Letter Queue Sources")).toBeTruthy();
  });

  // ─── Send Message Modal Tests ───────────────────────────

  it("opens send message modal and submits", async () => {
    const user = userEvent.setup();
    mockSearchParams.mockReturnValue([new URLSearchParams("?queueUrl=http://localhost:4566/000000000000/my-queue"), vi.fn()]);
    mockSQSMessages.mockReturnValue({ data: { messages: [] }, isLoading: false });
    render(<SQSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Messages"));
    await clickButton(user, /send message/i);
    const textarea = screen.getByPlaceholderText("Enter message content...");
    await user.type(textarea, "Test message body");
    await clickButton(user, "Send");
    await waitFor(() => {
      expect(mockSendMessageMutate).toHaveBeenCalled();
    });
  });

  // ─── AttributesTab Tests ───────────────────────────────

  it("shows loading skeleton when attributes are loading", () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("?queueUrl=http://localhost:4566/000000000000/my-queue"), vi.fn()]);
    mockSQSAttributes.mockReturnValue({ data: undefined, isLoading: true });
    render(<SQSPage />, { wrapper: createWrapper() });
    expect(screen.queryByText("Queue attributes")).toBeNull();
  });

  it("shows redrive policy warning when RedrivePolicy is present", () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("?queueUrl=http://localhost:4566/000000000000/my-queue"), vi.fn()]);
    mockSQSAttributes.mockReturnValue({
      data: { attributes: { RedrivePolicy: '{"deadLetterTargetArn":"arn:aws:sqs:us-east-1:000000000000:dlq"}' } },
      isLoading: false,
    });
    render(<SQSPage />, { wrapper: createWrapper() });
    expect(screen.getByText(/deadLetterTargetArn/)).toBeTruthy();
  });

  it("shows not configured when no redrive policy", () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("?queueUrl=http://localhost:4566/000000000000/my-queue"), vi.fn()]);
    mockSQSAttributes.mockReturnValue({ data: { attributes: {} }, isLoading: false });
    render(<SQSPage />, { wrapper: createWrapper() });
    expect(screen.getByText("Not configured")).toBeTruthy();
  });

  it("edits and saves queue attributes", async () => {
    const user = userEvent.setup();
    mockSearchParams.mockReturnValue([new URLSearchParams("?queueUrl=http://localhost:4566/000000000000/my-queue"), vi.fn()]);
    mockSQSAttributes.mockReturnValue({
      data: { attributes: { VisibilityTimeout: "30", DelaySeconds: "0", MessageRetentionPeriod: "345600" } },
      isLoading: false,
    });
    render(<SQSPage />, { wrapper: createWrapper() });
    await clickButton(user, "Edit");
    await clickButton(user, "Save");
    await waitFor(() => {
      expect(mockSetAttrsMutate).toHaveBeenCalled();
    });
  });

  it("cancels attribute editing without saving", async () => {
    const user = userEvent.setup();
    mockSearchParams.mockReturnValue([new URLSearchParams("?queueUrl=http://localhost:4566/000000000000/my-queue"), vi.fn()]);
    mockSQSAttributes.mockReturnValue({
      data: { attributes: { VisibilityTimeout: "30" } },
      isLoading: false,
    });
    render(<SQSPage />, { wrapper: createWrapper() });
    await clickButton(user, "Edit");
    await clickButton(user, "Cancel");
    expect(mockSetAttrsMutate).not.toHaveBeenCalled();
  });

  // ─── QueueList Interactions ─────────────────────────────

  it("filters queues by search term", async () => {
    const user = userEvent.setup();
    mockSQSQueues.mockReturnValue({
      data: {
        queueUrls: [
          "http://localhost:4566/000000000000/alpha-queue",
          "http://localhost:4566/000000000000/beta-queue",
        ],
      },
      isLoading: false, isError: false, error: null,
    });
    render(<SQSPage />, { wrapper: createWrapper() });
    expect(screen.getByText("alpha-queue")).toBeTruthy();
    expect(screen.getByText("beta-queue")).toBeTruthy();
    const filter = screen.getByPlaceholderText("Find queues...");
    await user.type(filter, "alpha");
    await waitFor(() => {
      expect(screen.getByText("alpha-queue")).toBeTruthy();
      expect(screen.queryByText("beta-queue")).toBeNull();
    });
  });

  it("deletes queue via delete button", async () => {
    const user = userEvent.setup();
    render(<SQSPage />, { wrapper: createWrapper() });
    await clickButton(user, /delete queue/i);
    await waitFor(() => {
      expect(mockDeleteQueueMutate).toHaveBeenCalled();
    });
  });

  it("shows FIFO badge for fifo queues", () => {
    mockSQSQueues.mockReturnValue({
      data: { queueUrls: ["http://localhost:4566/000000000000/my-queue.fifo"] },
      isLoading: false, isError: false, error: null,
    });
    render(<SQSPage />, { wrapper: createWrapper() });
    expect(screen.getByText("FIFO")).toBeTruthy();
  });

  // ─── TagsTab Add/Remove Tests ───────────────────────────

  it("adds a new tag", async () => {
    const user = userEvent.setup();
    mockSearchParams.mockReturnValue([new URLSearchParams("?queueUrl=http://localhost:4566/000000000000/my-queue"), vi.fn()]);
    mockSQSQueueTags.mockReturnValue({
      data: { tags: { Existing: "tag" } },
      isLoading: false,
    });
    render(<SQSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Tags"));
    await waitFor(() => {
      expect(screen.getByText("Existing")).toBeTruthy();
    });
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "Team");
    await user.type(inputs[1], "backend");
    await clickButton(user, /add tag/i);
    await waitFor(() => {
      expect(mockTagMutate).toHaveBeenCalled();
    });
  });

  it("removes a tag", async () => {
    const user = userEvent.setup();
    mockSearchParams.mockReturnValue([new URLSearchParams("?queueUrl=http://localhost:4566/000000000000/my-queue"), vi.fn()]);
    mockSQSQueueTags.mockReturnValue({
      data: { tags: { Environment: "production" } },
      isLoading: false,
    });
    render(<SQSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Tags"));
    await waitFor(() => {
      expect(screen.getByText("Environment")).toBeTruthy();
    });
    await clickButton(user, /remove tag/i);
    await waitFor(() => {
      expect(mockUntagMutate).toHaveBeenCalled();
    });
  });

  it("shows empty tag state when no tags", async () => {
    const user = userEvent.setup();
    mockSearchParams.mockReturnValue([new URLSearchParams("?queueUrl=http://localhost:4566/000000000000/my-queue"), vi.fn()]);
    mockSQSQueueTags.mockReturnValue({ data: { tags: {} }, isLoading: false });
    render(<SQSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Tags"));
    await waitFor(() => {
      expect(screen.getByText("No tags on this queue")).toBeTruthy();
    });
  });

  // ─── CreateQueueModal Edge Cases ────────────────────────

  it("toggles FIFO mode adding .fifo suffix", async () => {
    const user = userEvent.setup();
    render(<SQSPage />, { wrapper: createWrapper() });
    await clickButton(user, /create queue/i);
    await waitFor(() => {
      expect(screen.getAllByPlaceholderText("my-queue").length).toBeGreaterThan(0);
    });
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "test-fifo");
    const fifoToggle = screen.getByText(/Enable FIFO/);
    await user.click(fifoToggle);
    await clickButton(user, /Create/i, { last: true });
    expect(mockCreateQueueMutate).toHaveBeenCalled();
    const callArgs = mockCreateQueueMutate.mock.calls[0][0];
    expect(callArgs.queueName).toBe("test-fifo.fifo");
    expect(callArgs.attributes.FifoQueue).toBe("true");
  });

  it("shows JSON parse error for invalid tags", async () => {
    const user = userEvent.setup();
    render(<SQSPage />, { wrapper: createWrapper() });
    await clickButton(user, /create queue/i);
    await waitFor(() => {
      expect(screen.getAllByPlaceholderText("my-queue").length).toBeGreaterThan(0);
    });
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "test-queue");
    const textarea = screen.getByPlaceholderText(/team.*backend/);
    await user.type(textarea, "not-valid-json");
    await clickButton(user, /Create/i, { last: true });
    expect(mockCreateQueueMutate).not.toHaveBeenCalled();
  });

  // ─── Modal Cancel Tests ──────────────────────────────────

  it("cancels create queue modal", async () => {
    const user = userEvent.setup();
    render(<SQSPage />, { wrapper: createWrapper() });
    await clickButton(user, /create queue/i);
    await waitFor(() => {
      expect(screen.getAllByPlaceholderText("my-queue").length).toBeGreaterThan(0);
    });
    await clickButton(user, /Cancel/i);
    expect(mockCreateQueueMutate).not.toHaveBeenCalled();
  });

  it("cancels send message modal", async () => {
    const user = userEvent.setup();
    mockSearchParams.mockReturnValue([new URLSearchParams("?queueUrl=http://localhost:4566/000000000000/my-queue"), vi.fn()]);
    mockSQSMessages.mockReturnValue({ data: { messages: [] }, isLoading: false });
    render(<SQSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Messages"));
    await clickButton(user, /send message/i);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("Enter message content...")).toBeTruthy();
    });
    await clickButton(user, /Cancel/i);
    expect(mockSendMessageMutate).not.toHaveBeenCalled();
  });

  // ─── Tags Loading State ──────────────────────────────────

  it("shows tags loading spinner", async () => {
    const user = userEvent.setup();
    mockSearchParams.mockReturnValue([new URLSearchParams("?queueUrl=http://localhost:4566/000000000000/my-queue"), vi.fn()]);
    mockSQSQueueTags.mockReturnValue({ data: undefined, isLoading: true });
    render(<SQSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Tags"));
    await waitFor(() => {
      expect(screen.getAllByText("Tags").length).toBeGreaterThanOrEqual(1);
    });
  });

  // ─── Send Message FIFO Fields ────────────────────────────

  it("sends message with FIFO fields", async () => {
    const user = userEvent.setup();
    mockSearchParams.mockReturnValue([new URLSearchParams("?queueUrl=http://localhost:4566/000000000000/my-queue.fifo"), vi.fn()]);
    mockSQSMessages.mockReturnValue({ data: { messages: [] }, isLoading: false });
    render(<SQSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Messages"));
    await clickButton(user, /send message/i);
    await waitFor(() => {
      expect(screen.getByText("Message group ID")).toBeTruthy();
    });
    const textarea = screen.getByPlaceholderText("Enter message content...");
    await user.type(textarea, "FIFO message");
    await clickButton(user, "Send");
    await waitFor(() => {
      expect(mockSendMessageMutate).toHaveBeenCalled();
    });
  });

  // ─── Page-level Navigation Tests ───────────────────────

  it("selects a queue from the list", async () => {
    const user = userEvent.setup();
    render(<SQSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "my-queue" }));
    await waitFor(() => {
      expect(mockSetSearchParams).toHaveBeenCalledWith({ queueUrl: "http://localhost:4566/000000000000/my-queue" });
    });
  });

  it("clears queueUrl when the SQS breadcrumb is clicked", async () => {
    const user = userEvent.setup();
    mockSearchParams.mockReturnValue([new URLSearchParams("?queueUrl=http://localhost:4566/000000000000/my-queue"), mockSetSearchParams]);
    render(<SQSPage />, { wrapper: createWrapper() });
    await user.click(screen.getAllByText("SQS")[0]);
    await waitFor(() => {
      expect(mockSetSearchParams).toHaveBeenCalled();
    });
  });

  it("does not clear queueUrl when the Dashboard breadcrumb is clicked", async () => {
    const user = userEvent.setup();
    mockSearchParams.mockReturnValue([new URLSearchParams("?queueUrl=http://localhost:4566/000000000000/my-queue"), mockSetSearchParams]);
    render(<SQSPage />, { wrapper: createWrapper() });
    await user.click(screen.getAllByText("Dashboard")[0]);
    await waitFor(() => {
      expect(mockSetSearchParams).not.toHaveBeenCalled();
    });
  });

  it("goes back to the queue list via the back button", async () => {
    const user = userEvent.setup();
    mockSearchParams.mockReturnValue([new URLSearchParams("?queueUrl=http://localhost:4566/000000000000/my-queue"), mockSetSearchParams]);
    render(<SQSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /back to queues/i }));
    await waitFor(() => {
      expect(mockSetSearchParams).toHaveBeenCalled();
    });
  });

  it("opens the create queue modal from the empty state", async () => {
    const user = userEvent.setup();
    mockSQSQueues.mockReturnValue({
      data: { queueUrls: [] },
      isLoading: false, isError: false, error: null,
    });
    render(<SQSPage />, { wrapper: createWrapper() });
    await clickButton(user, /create queue/i, { last: true });
    await waitFor(() => {
      expect(screen.getAllByPlaceholderText("my-queue").length).toBeGreaterThan(0);
    });
  });

  it("shows the fallback message when the queues error has no message", () => {
    mockSQSQueues.mockReturnValue({
      data: undefined, isLoading: false, isError: true, error: {} as Error,
    });
    render(<SQSPage />, { wrapper: createWrapper() });
    expect(screen.getByText("Failed to load queues")).toBeTruthy();
  });

  // ─── Delete Queue Variants ──────────────────────────────

  it("shows a success toast after deleting a queue", async () => {
    const user = userEvent.setup();
    render(<SQSPage />, { wrapper: createWrapper() });
    await clickButton(user, /delete queue/i);
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith("success", 'Queue "my-queue" deleted');
    });
  });

  it("shows an error toast when queue deletion fails", async () => {
    const user = userEvent.setup();
    mockDeleteQueueMutate.mockImplementation((_args: any, opts: any) => opts?.onError?.(new Error("boom")));
    render(<SQSPage />, { wrapper: createWrapper() });
    await clickButton(user, /delete queue/i);
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith("error", "Delete failed: boom");
    });
  });

  it("does not delete a queue when confirmation is declined", async () => {
    const user = userEvent.setup();
    mockConfirm.mockResolvedValue(false);
    render(<SQSPage />, { wrapper: createWrapper() });
    await clickButton(user, /delete queue/i);
    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalled();
    });
    expect(mockDeleteQueueMutate).not.toHaveBeenCalled();
  });

  // ─── Create Queue Modal Variants ────────────────────────

  it("submits custom attribute values from the create form", async () => {
    const user = userEvent.setup();
    render(<SQSPage />, { wrapper: createWrapper() });
    await clickButton(user, /create queue/i);
    await waitFor(() => {
      expect(screen.getAllByPlaceholderText("my-queue").length).toBeGreaterThan(0);
    });
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "test-queue");
    await user.clear(inputs[1]);
    await user.type(inputs[1], "60");
    await user.clear(inputs[2]);
    await user.type(inputs[2], "5");
    await user.clear(inputs[3]);
    await user.type(inputs[3], "1000");
    await user.clear(inputs[4]);
    await user.type(inputs[4], "100");
    await clickButton(user, /Create/i, { last: true });
    await waitFor(() => {
      expect(mockCreateQueueMutate).toHaveBeenCalled();
    });
    const callArgs = mockCreateQueueMutate.mock.calls[0][0];
    expect(callArgs.queueName).toBe("test-queue");
    expect(callArgs.attributes).toEqual({
      VisibilityTimeout: "60",
      DelaySeconds: "5",
      MaximumMessageSize: "1000",
      MessageRetentionPeriod: "100",
    });
  });

  it("omits cleared attribute fields from the create payload", async () => {
    const user = userEvent.setup();
    render(<SQSPage />, { wrapper: createWrapper() });
    await clickButton(user, /create queue/i);
    await waitFor(() => {
      expect(screen.getAllByPlaceholderText("my-queue").length).toBeGreaterThan(0);
    });
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "test-queue");
    await user.clear(inputs[1]);
    await user.clear(inputs[2]);
    await user.clear(inputs[3]);
    await user.clear(inputs[4]);
    await clickButton(user, /Create/i, { last: true });
    await waitFor(() => {
      expect(mockCreateQueueMutate).toHaveBeenCalled();
    });
    expect(mockCreateQueueMutate.mock.calls[0][0].attributes).toEqual({});
  });

  it("shows a success toast and closes the modal after creating a queue", async () => {
    const user = userEvent.setup();
    render(<SQSPage />, { wrapper: createWrapper() });
    await clickButton(user, /create queue/i);
    await waitFor(() => {
      expect(screen.getAllByPlaceholderText("my-queue").length).toBeGreaterThan(0);
    });
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "test-queue");
    await clickButton(user, /Create/i, { last: true });
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith("success", 'Queue "test-queue" created');
    });
    await waitFor(() => {
      expect(screen.queryByPlaceholderText("my-queue")).toBeNull();
    });
  });

  it("shows an error toast when queue creation fails", async () => {
    const user = userEvent.setup();
    mockCreateQueueMutate.mockImplementation((_args: any, opts: any) => opts?.onError?.(new Error("boom")));
    render(<SQSPage />, { wrapper: createWrapper() });
    await clickButton(user, /create queue/i);
    await waitFor(() => {
      expect(screen.getAllByPlaceholderText("my-queue").length).toBeGreaterThan(0);
    });
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "test-queue");
    await clickButton(user, /Create/i, { last: true });
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith("error", "Create failed: boom");
    });
  });

  // ─── Purge Tests ────────────────────────────────────────

  it("purges the queue after confirmation", async () => {
    const user = userEvent.setup();
    mockSearchParams.mockReturnValue([new URLSearchParams("?queueUrl=http://localhost:4566/000000000000/my-queue"), mockSetSearchParams]);
    render(<SQSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Messages"));
    await clickButton(user, "Purge");
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith("success", "Queue purged");
    });
    expect(mockPurgeQueueMutate).toHaveBeenCalledWith("http://localhost:4566/000000000000/my-queue", expect.anything());
  });

  it("shows an error toast when purging fails", async () => {
    const user = userEvent.setup();
    mockPurgeQueueMutate.mockImplementation((_args: any, opts: any) => opts?.onError?.(new Error("boom")));
    mockSearchParams.mockReturnValue([new URLSearchParams("?queueUrl=http://localhost:4566/000000000000/my-queue"), mockSetSearchParams]);
    render(<SQSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Messages"));
    await clickButton(user, "Purge");
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith("error", "Purge failed: boom");
    });
  });

  it("does not purge when confirmation is declined", async () => {
    const user = userEvent.setup();
    mockConfirm.mockResolvedValue(false);
    mockSearchParams.mockReturnValue([new URLSearchParams("?queueUrl=http://localhost:4566/000000000000/my-queue"), mockSetSearchParams]);
    render(<SQSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Messages"));
    await clickButton(user, "Purge");
    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalled();
    });
    expect(mockPurgeQueueMutate).not.toHaveBeenCalled();
  });

  // ─── Attributes Variants ────────────────────────────────

  it("shows FIFO for a queue with the FifoQueue attribute", () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("?queueUrl=http://localhost:4566/000000000000/my-queue.fifo"), mockSetSearchParams]);
    mockSQSAttributes.mockReturnValue({
      data: { attributes: { FifoQueue: "true" } },
      isLoading: false,
    });
    render(<SQSPage />, { wrapper: createWrapper() });
    expect(screen.getByText("FIFO")).toBeTruthy();
  });

  it("formats created and last modified timestamps", () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("?queueUrl=http://localhost:4566/000000000000/my-queue"), mockSetSearchParams]);
    mockSQSAttributes.mockReturnValue({
      data: { attributes: { CreatedTimestamp: "1700000000", LastModifiedTimestamp: "1700000100" } },
      isLoading: false,
    });
    render(<SQSPage />, { wrapper: createWrapper() });
    expect(screen.getByText(new Date(1700000000000).toLocaleString())).toBeTruthy();
    expect(screen.getByText(new Date(1700000100000).toLocaleString())).toBeTruthy();
  });

  it("shows a success toast and exits edit mode after saving attributes", async () => {
    const user = userEvent.setup();
    mockSearchParams.mockReturnValue([new URLSearchParams("?queueUrl=http://localhost:4566/000000000000/my-queue"), mockSetSearchParams]);
    mockSQSAttributes.mockReturnValue({
      data: { attributes: { VisibilityTimeout: "30", DelaySeconds: "0", MessageRetentionPeriod: "345600" } },
      isLoading: false,
    });
    render(<SQSPage />, { wrapper: createWrapper() });
    await clickButton(user, "Edit");
    await clickButton(user, "Save");
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith("success", "Attributes updated");
    });
  });

  it("shows an error toast when saving attributes fails", async () => {
    const user = userEvent.setup();
    mockSetAttrsMutate.mockImplementation((_args: any, opts: any) => opts?.onError?.(new Error("boom")));
    mockSearchParams.mockReturnValue([new URLSearchParams("?queueUrl=http://localhost:4566/000000000000/my-queue"), mockSetSearchParams]);
    mockSQSAttributes.mockReturnValue({
      data: { attributes: { VisibilityTimeout: "30" } },
      isLoading: false,
    });
    render(<SQSPage />, { wrapper: createWrapper() });
    await clickButton(user, "Edit");
    await clickButton(user, "Save");
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith("error", "Update failed: boom");
    });
  });

  it("saves edited attribute values", async () => {
    const user = userEvent.setup();
    mockSearchParams.mockReturnValue([new URLSearchParams("?queueUrl=http://localhost:4566/000000000000/my-queue"), mockSetSearchParams]);
    mockSQSAttributes.mockReturnValue({
      data: { attributes: { VisibilityTimeout: "30", DelaySeconds: "0", MessageRetentionPeriod: "345600" } },
      isLoading: false,
    });
    render(<SQSPage />, { wrapper: createWrapper() });
    await clickButton(user, "Edit");
    const inputs = screen.getAllByRole("textbox");
    await user.clear(inputs[0]);
    await user.type(inputs[0], "60");
    await user.clear(inputs[1]);
    await user.type(inputs[1], "5");
    await user.clear(inputs[2]);
    await user.type(inputs[2], "100");
    await clickButton(user, "Save");
    await waitFor(() => {
      expect(mockSetAttrsMutate).toHaveBeenCalled();
    });
    expect(mockSetAttrsMutate.mock.calls[0][0].attributes).toEqual({
      VisibilityTimeout: "60",
      DelaySeconds: "5",
      MessageRetentionPeriod: "100",
    });
  });

  // ─── Messages Variants ──────────────────────────────────

  it("shows empty state when messages data is missing", async () => {
    const user = userEvent.setup();
    mockSearchParams.mockReturnValue([new URLSearchParams("?queueUrl=http://localhost:4566/000000000000/my-queue"), mockSetSearchParams]);
    mockSQSMessages.mockReturnValue({ data: {}, isLoading: false });
    render(<SQSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Messages"));
    await waitFor(() => {
      expect(screen.getByText("No messages in queue")).toBeTruthy();
    });
  });

  it("renders truncated bodies and sparse message fallbacks", async () => {
    const user = userEvent.setup();
    mockSearchParams.mockReturnValue([new URLSearchParams("?queueUrl=http://localhost:4566/000000000000/my-queue"), mockSetSearchParams]);
    mockSQSMessages.mockReturnValue({
      data: {
        messages: [
          { MessageId: "a".repeat(8), Body: "x".repeat(150), MD5OfBody: "m", ReceiptHandle: "rh", Attributes: {} },
          { MessageId: "b".repeat(8), Body: "short", MD5OfBody: "m" },
        ],
      },
      isLoading: false,
    });
    render(<SQSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Messages"));
    await waitFor(() => {
      expect(screen.getByText("x".repeat(100) + "…")).toBeTruthy();
      expect(screen.getByText("short")).toBeTruthy();
    });
    // Only the message with a ReceiptHandle renders a delete button
    expect(screen.getAllByLabelText("Delete message").length).toBe(1);
  });

  it("shows message group IDs for FIFO messages", async () => {
    const user = userEvent.setup();
    mockSearchParams.mockReturnValue([new URLSearchParams("?queueUrl=http://localhost:4566/000000000000/my-queue.fifo"), mockSetSearchParams]);
    mockSQSMessages.mockReturnValue({
      data: {
        messages: [
          { MessageId: "abc123def456", Body: "Hello", MD5OfBody: "m", ReceiptHandle: "rh", Attributes: { MessageGroupId: "group-1" } },
          { MessageId: "aaaabbbbcccc", Body: "Two", MD5OfBody: "m", ReceiptHandle: "rh2" },
        ],
      },
      isLoading: false,
    });
    render(<SQSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Messages"));
    await waitFor(() => {
      expect(screen.getByText("group-1")).toBeTruthy();
      expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(2);
    });
  });

  it("deletes a message after confirmation", async () => {
    const user = userEvent.setup();
    mockSearchParams.mockReturnValue([new URLSearchParams("?queueUrl=http://localhost:4566/000000000000/my-queue"), mockSetSearchParams]);
    mockSQSMessages.mockReturnValue({
      data: { messages: [{ MessageId: "abc123def456", Body: "Hello", MD5OfBody: "m", ReceiptHandle: "handle123" }] },
      isLoading: false,
    });
    render(<SQSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Messages"));
    await waitFor(() => {
      expect(screen.getByText("Hello")).toBeTruthy();
    });
    await clickButton(user, /delete message/i);
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith("success", "Message deleted");
    });
    expect(mockDeleteMessageMutate).toHaveBeenCalledWith(
      { queueUrl: "http://localhost:4566/000000000000/my-queue", receiptHandle: "handle123" },
      expect.anything()
    );
  });

  it("shows an error toast when message deletion fails", async () => {
    const user = userEvent.setup();
    mockDeleteMessageMutate.mockImplementation((_args: any, opts: any) => opts?.onError?.(new Error("boom")));
    mockSearchParams.mockReturnValue([new URLSearchParams("?queueUrl=http://localhost:4566/000000000000/my-queue"), mockSetSearchParams]);
    mockSQSMessages.mockReturnValue({
      data: { messages: [{ MessageId: "abc123def456", Body: "Hello", MD5OfBody: "m", ReceiptHandle: "handle123" }] },
      isLoading: false,
    });
    render(<SQSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Messages"));
    await waitFor(() => {
      expect(screen.getByText("Hello")).toBeTruthy();
    });
    await clickButton(user, /delete message/i);
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith("error", "Delete failed: boom");
    });
  });

  it("does not delete a message when confirmation is declined", async () => {
    const user = userEvent.setup();
    mockConfirm.mockResolvedValue(false);
    mockSearchParams.mockReturnValue([new URLSearchParams("?queueUrl=http://localhost:4566/000000000000/my-queue"), mockSetSearchParams]);
    mockSQSMessages.mockReturnValue({
      data: { messages: [{ MessageId: "abc123def456", Body: "Hello", MD5OfBody: "m", ReceiptHandle: "handle123" }] },
      isLoading: false,
    });
    render(<SQSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Messages"));
    await waitFor(() => {
      expect(screen.getByText("Hello")).toBeTruthy();
    });
    await clickButton(user, /delete message/i);
    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalled();
    });
    expect(mockDeleteMessageMutate).not.toHaveBeenCalled();
  });

  it("shows a success toast and closes the send message modal", async () => {
    const user = userEvent.setup();
    mockSearchParams.mockReturnValue([new URLSearchParams("?queueUrl=http://localhost:4566/000000000000/my-queue"), mockSetSearchParams]);
    mockSQSMessages.mockReturnValue({ data: { messages: [] }, isLoading: false });
    render(<SQSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Messages"));
    await clickButton(user, /send message/i);
    const textarea = screen.getByPlaceholderText("Enter message content...");
    await user.type(textarea, "Test message body");
    await clickButton(user, "Send");
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith("success", "Message sent: abc123de…");
    });
    await waitFor(() => {
      expect(screen.queryByPlaceholderText("Enter message content...")).toBeNull();
    });
  });

  it("shows an error toast when sending a message fails", async () => {
    const user = userEvent.setup();
    mockSendMessageMutate.mockImplementation((_args: any, opts: any) => opts?.onError?.(new Error("boom")));
    mockSearchParams.mockReturnValue([new URLSearchParams("?queueUrl=http://localhost:4566/000000000000/my-queue"), mockSetSearchParams]);
    mockSQSMessages.mockReturnValue({ data: { messages: [] }, isLoading: false });
    render(<SQSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Messages"));
    await clickButton(user, /send message/i);
    const textarea = screen.getByPlaceholderText("Enter message content...");
    await user.type(textarea, "Test message body");
    await clickButton(user, "Send");
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith("error", "Send failed: boom");
    });
  });

  it("sends a message with a custom delay", async () => {
    const user = userEvent.setup();
    mockSearchParams.mockReturnValue([new URLSearchParams("?queueUrl=http://localhost:4566/000000000000/my-queue"), mockSetSearchParams]);
    mockSQSMessages.mockReturnValue({ data: { messages: [] }, isLoading: false });
    render(<SQSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Messages"));
    await clickButton(user, /send message/i);
    const textarea = screen.getByPlaceholderText("Enter message content...");
    await user.type(textarea, "Test message body");
    const inputs = screen.getAllByRole("textbox");
    await user.clear(inputs[1]);
    await user.type(inputs[1], "5");
    await clickButton(user, "Send");
    await waitFor(() => {
      expect(mockSendMessageMutate).toHaveBeenCalled();
    });
    expect(mockSendMessageMutate.mock.calls[0][0].delaySeconds).toBe(5);
  });

  it("sends a FIFO message with group and deduplication IDs", async () => {
    const user = userEvent.setup();
    mockSearchParams.mockReturnValue([new URLSearchParams("?queueUrl=http://localhost:4566/000000000000/my-queue.fifo"), mockSetSearchParams]);
    mockSQSMessages.mockReturnValue({ data: { messages: [] }, isLoading: false });
    render(<SQSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Messages"));
    await clickButton(user, /send message/i);
    await waitFor(() => {
      expect(screen.getByText("Message group ID")).toBeTruthy();
    });
    const textarea = screen.getByPlaceholderText("Enter message content...");
    await user.type(textarea, "FIFO message");
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[2], "group-1");
    await user.type(inputs[3], "dedup-1");
    await clickButton(user, "Send");
    await waitFor(() => {
      expect(mockSendMessageMutate).toHaveBeenCalled();
    });
    expect(mockSendMessageMutate.mock.calls[0][0].messageGroupId).toBe("group-1");
    expect(mockSendMessageMutate.mock.calls[0][0].messageDeduplicationId).toBe("dedup-1");
  });

  // ─── Tags Variants ──────────────────────────────────────

  it("shows a success toast and clears inputs after adding a tag", async () => {
    const user = userEvent.setup();
    mockSearchParams.mockReturnValue([new URLSearchParams("?queueUrl=http://localhost:4566/000000000000/my-queue"), mockSetSearchParams]);
    mockSQSQueueTags.mockReturnValue({ data: { tags: { Existing: "tag" } }, isLoading: false });
    render(<SQSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Tags"));
    await waitFor(() => {
      expect(screen.getByText("Existing")).toBeTruthy();
    });
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "Team");
    await user.type(inputs[1], "backend");
    await clickButton(user, /add tag/i);
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith("success", "Tag added");
    });
    expect(mockTagMutate).toHaveBeenCalledWith(
      { queueUrl: "http://localhost:4566/000000000000/my-queue", tags: { Team: "backend" } },
      expect.anything()
    );
  });

  it("shows an error toast when adding a tag fails", async () => {
    const user = userEvent.setup();
    mockTagMutate.mockImplementation((_args: any, opts: any) => opts?.onError?.(new Error("boom")));
    mockSearchParams.mockReturnValue([new URLSearchParams("?queueUrl=http://localhost:4566/000000000000/my-queue"), mockSetSearchParams]);
    mockSQSQueueTags.mockReturnValue({ data: { tags: { Existing: "tag" } }, isLoading: false });
    render(<SQSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Tags"));
    await waitFor(() => {
      expect(screen.getByText("Existing")).toBeTruthy();
    });
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "Team");
    await user.type(inputs[1], "backend");
    await clickButton(user, /add tag/i);
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith("error", "Tag failed: boom");
    });
  });

  it("shows a success toast after removing a tag", async () => {
    const user = userEvent.setup();
    mockSearchParams.mockReturnValue([new URLSearchParams("?queueUrl=http://localhost:4566/000000000000/my-queue"), mockSetSearchParams]);
    mockSQSQueueTags.mockReturnValue({ data: { tags: { Environment: "production" } }, isLoading: false });
    render(<SQSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Tags"));
    await waitFor(() => {
      expect(screen.getByText("Environment")).toBeTruthy();
    });
    await clickButton(user, /remove tag/i);
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith("success", "Tag removed");
    });
    expect(mockUntagMutate).toHaveBeenCalledWith(
      { queueUrl: "http://localhost:4566/000000000000/my-queue", tagKeys: ["Environment"] },
      expect.anything()
    );
  });

  it("shows an error toast when removing a tag fails", async () => {
    const user = userEvent.setup();
    mockUntagMutate.mockImplementation((_args: any, opts: any) => opts?.onError?.(new Error("boom")));
    mockSearchParams.mockReturnValue([new URLSearchParams("?queueUrl=http://localhost:4566/000000000000/my-queue"), mockSetSearchParams]);
    mockSQSQueueTags.mockReturnValue({ data: { tags: { Environment: "production" } }, isLoading: false });
    render(<SQSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Tags"));
    await waitFor(() => {
      expect(screen.getByText("Environment")).toBeTruthy();
    });
    await clickButton(user, /remove tag/i);
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith("error", "Remove failed: boom");
    });
  });
});

// ─── G.73: native redrive (message move tasks) ──────────

const RUNNING_TASK = {
  taskHandle: "handle-abcdefghijklmnopqrstuvwxyz",
  sourceArn: "arn:aws:sqs:us-east-1:000000000000:my-queue",
  destinationArn: "arn:aws:sqs:us-east-1:000000000000:source-queue",
  maxRate: 3,
  status: "RUNNING",
  moved: 12,
  toMove: 88,
  startedTimestamp: 1700000000000,
  failureReason: null,
};

function dialogOf(headerText: string | RegExp): HTMLElement {
  const header = screen
    .getAllByText(headerText)
    .find((h) => h.closest('[role="dialog"]'));
  return header!.closest('[role="dialog"]') as HTMLElement;
}

/** Row-level Cancel buttons live outside dialogs (hidden modals keep theirs mounted). */
function rowCancelButtons() {
  return screen
    .queryAllByRole("button", { name: /^Cancel$/i })
    .filter((b) => !b.closest('[role="dialog"]'));
}

describe("SQSPage — DLQ redrive (G.73)", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    vi.clearAllMocks();
    user = userEvent.setup();
    mockSQSQueues.mockReturnValue({
      data: { queueUrls: ["http://localhost:4566/000000000000/my-queue"] },
      isLoading: false, isError: false, error: null,
    });
    mockSQSAttributes.mockReturnValue({ data: { attributes: {} }, isLoading: false });
    mockSQSMessages.mockReturnValue({ data: { messages: [] }, isLoading: false });
    mockSQSQueueTags.mockReturnValue({ data: { tags: {} }, isLoading: false });
    mockSQSDLQSources.mockReturnValue({ data: { queueUrls: [] }, isLoading: false });
    mockMoveTasksQuery.mockReturnValue({ data: { tasks: [], total: 0 } });
    mockStartMoveTask.mockResolvedValue({ taskHandle: "h-new" });
    mockCancelMoveTask.mockResolvedValue({ moved: 5 });
    cancelMoveState.isPending = false;
    cancelMoveState.variables = null;
    mockSearchParams.mockReturnValue([
      new URLSearchParams("?queueUrl=http://localhost:4566/000000000000/my-queue"),
      vi.fn(),
    ]);
    mockConfirm.mockResolvedValue(true);
  });

  async function openDlqTab() {
    render(<SQSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("DLQ"));
    await waitFor(() =>
      expect(screen.getByText(/Message move tasks/)).toBeTruthy()
    );
  }

  it("renders the move-tasks container with count and empty state", async () => {
    await openDlqTab();
    expect(screen.getByText(/Message move tasks \(0\)/)).toBeTruthy();
    expect(screen.getByText(/No message move tasks/i)).toBeTruthy();
  });

  it("renders running task rows with all mapped fields", async () => {
    mockMoveTasksQuery.mockReturnValue({ data: { tasks: [RUNNING_TASK], total: 1 } });
    await openDlqTab();
    expect(screen.getByText(/Message move tasks \(1\)/)).toBeTruthy();
    expect(screen.getByText("RUNNING")).toBeTruthy();
    expect(screen.getByText("source-queue")).toBeTruthy();
    expect(screen.getByText("12")).toBeTruthy();
    expect(screen.getByText("88")).toBeTruthy();
    expect(screen.getByText(/handle-abcdefghijklmnop/)).toBeTruthy();
    expect(screen.getByText(new Date(1700000000000).toLocaleString())).toBeTruthy();
    // failureReason null -> dash
    expect(rowCancelButtons().length).toBe(1);
  });

  it("shows dashes and zero fallbacks for sparse task rows", async () => {
    mockMoveTasksQuery.mockReturnValue({
      data: { tasks: [{ taskHandle: "short", status: "" }], total: 1 },
    });
    await openDlqTab();
    expect(screen.getByText("short")).toBeTruthy();
    expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("RUNNING")).toBeTruthy(); // status || "RUNNING"
  });

  it("shows terminal-status rows without a row Cancel button", async () => {
    mockMoveTasksQuery.mockReturnValue({
      data: {
        tasks: [
          { ...RUNNING_TASK, status: "COMPLETED" },
          { ...RUNNING_TASK, taskHandle: "h-failed", status: "FAILED", failureReason: "boom" },
        ],
        total: 2,
      },
    });
    await openDlqTab();
    expect(screen.getByText("COMPLETED")).toBeTruthy();
    expect(screen.getByText("FAILED")).toBeTruthy();
    expect(screen.getByText("boom")).toBeTruthy();
    expect(rowCancelButtons().length).toBe(0);
  });

  it("cancels a running task and shows a success toast", async () => {
    mockMoveTasksQuery.mockReturnValue({ data: { tasks: [RUNNING_TASK], total: 1 } });
    await openDlqTab();
    await user.click(rowCancelButtons()[0]);
    await waitFor(() => {
      expect(mockCancelMoveTask).toHaveBeenCalledWith(
        "handle-abcdefghijklmnopqrstuvwxyz"
      );
      expect(mockShowToast).toHaveBeenCalledWith(
        "success",
        "Redrive cancelled — 5 messages moved"
      );
    });
  });

  it("shows an error toast when cancel fails", async () => {
    mockMoveTasksQuery.mockReturnValue({ data: { tasks: [RUNNING_TASK], total: 1 } });
    mockCancelMoveTask.mockRejectedValueOnce(new Error(""));
    await openDlqTab();
    await user.click(rowCancelButtons()[0]);
    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to cancel task")
    );
  });

  it("opens the start-redrive modal, validates, submits full payload, and toasts", async () => {
    await openDlqTab();
    await user.click(screen.getByRole("button", { name: /Start redrive/i }));
    await waitFor(() =>
      expect(screen.getByText("Start redrive from this DLQ")).toBeTruthy()
    );
    const startBtn = screen.getByRole("button", { name: /^Start$/i }) as HTMLButtonElement;
    expect(startBtn.disabled).toBe(true);
    await user.type(
      screen.getByPlaceholderText("http://localhost:4566/000000000000/source-queue"),
      "http://localhost:4566/000000000000/src"
    );
    await user.type(screen.getByPlaceholderText("10"), "9");
    expect(startBtn.disabled).toBe(false);
    await user.click(startBtn);
    await waitFor(() => {
      expect(mockStartMoveTask).toHaveBeenCalledWith({
        sourceArn: "arn:aws:sqs:us-east-1:000000000000:my-queue",
        destinationArn: "arn:aws:sqs:us-east-1:000000000000:src",
        maxNumberOfMessagesPerSecond: 9,
      });
      expect(mockShowToast).toHaveBeenCalledWith("success", "Redrive task started");
    });
  });

  it("submits redrive without a max rate and closes via modal Cancel", async () => {
    await openDlqTab();
    await user.click(screen.getByRole("button", { name: /Start redrive/i }));
    await user.type(
      screen.getByPlaceholderText("http://localhost:4566/000000000000/source-queue"),
      "http://localhost:4566/000000000000/src"
    );
    await user.click(screen.getByRole("button", { name: /^Start$/i }));
    await waitFor(() =>
      expect(mockStartMoveTask).toHaveBeenCalledWith({
        sourceArn: "arn:aws:sqs:us-east-1:000000000000:my-queue",
        destinationArn: "arn:aws:sqs:us-east-1:000000000000:src",
        maxNumberOfMessagesPerSecond: undefined,
      })
    );
    // reopen and close with the modal-scoped Cancel
    await user.click(screen.getByRole("button", { name: /Start redrive/i }));
    await waitFor(() =>
      expect(screen.getByText("Start redrive from this DLQ")).toBeTruthy()
    );
    await user.click(
      within(dialogOf("Start redrive from this DLQ")).getByRole("button", { name: /^Cancel$/i })
    );
  });

  it("shows an error toast when starting redrive fails", async () => {
    mockStartMoveTask.mockRejectedValueOnce(new Error("redrive boom"));
    await openDlqTab();
    await user.click(screen.getByRole("button", { name: /Start redrive/i }));
    await user.type(
      screen.getByPlaceholderText("http://localhost:4566/000000000000/source-queue"),
      "x"
    );
    await user.click(screen.getByRole("button", { name: /^Start$/i }));
    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith("error", "redrive boom")
    );
  });
});

describe("SQSPage — redrive remaining branches", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    vi.clearAllMocks();
    user = userEvent.setup();
    mockSQSQueues.mockReturnValue({
      data: { queueUrls: ["http://localhost:4566/000000000000/my-queue"] },
      isLoading: false, isError: false, error: null,
    });
    mockSQSAttributes.mockReturnValue({ data: { attributes: {} }, isLoading: false });
    mockSQSMessages.mockReturnValue({ data: { messages: [] }, isLoading: false });
    mockSQSQueueTags.mockReturnValue({ data: { tags: {} }, isLoading: false });
    mockSQSDLQSources.mockReturnValue({ data: { queueUrls: [] }, isLoading: false });
    mockMoveTasksQuery.mockReturnValue({ data: { tasks: [], total: 0 } });
    mockStartMoveTask.mockResolvedValue({ taskHandle: "h" });
    mockCancelMoveTask.mockResolvedValue({ moved: 0 });
    cancelMoveState.isPending = false;
    cancelMoveState.variables = null;
    mockSearchParams.mockReturnValue([
      new URLSearchParams("?queueUrl=http://localhost:4566/000000000000/my-queue"),
      vi.fn(),
    ]);
    mockConfirm.mockResolvedValue(true);
  });

  async function openDlq() {
    render(<SQSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("DLQ"));
    await waitFor(() => expect(screen.getByText(/Message move tasks/)).toBeTruthy());
  }

  it("handles undefined move-tasks data", async () => {
    mockMoveTasksQuery.mockReturnValue({ data: undefined });
    await openDlq();
    expect(screen.getByText(/Message move tasks \(0\)/)).toBeTruthy();
  });

  it("renders a task without taskHandle and with sourceArn-only destination", async () => {
    mockMoveTasksQuery.mockReturnValue({
      data: {
        tasks: [{ sourceArn: "arn:aws:sqs:us-east-1:000000000000:my-queue", status: "RUNNING" }],
        total: 1,
      },
    });
    await openDlq();
    expect(screen.getAllByText("my-queue").length).toBeGreaterThanOrEqual(2);
    const cancels = screen
      .queryAllByRole("button", { name: /^Cancel$/i })
      .filter((b) => !b.closest('[role="dialog"]'));
    expect(cancels.length).toBe(1);
  });

  it("shows cancel not-loading when pending with a different handle", async () => {
    cancelMoveState.isPending = true;
    cancelMoveState.variables = "other-handle";
    mockMoveTasksQuery.mockReturnValue({
      data: {
        tasks: [{ taskHandle: "h1", sourceArn: "arn:1", status: "RUNNING" }],
        total: 1,
      },
    });
    await openDlq();
    const cancels = screen
      .queryAllByRole("button", { name: /^Cancel$/i })
      .filter((b) => !b.closest('[role="dialog"]'));
    expect(cancels.length).toBe(1);
  });

  it("closes the start-redrive modal with Escape", async () => {
    await openDlq();
    await user.click(screen.getByRole("button", { name: /Start redrive/i }));
    await waitFor(() =>
      expect(screen.getByText("Start redrive from this DLQ")).toBeTruthy()
    );
    document.querySelectorAll('[class*="awsui_dialog"]').forEach((d) => {
      fireEvent.keyDown(d as HTMLElement, { keyCode: 27 });
    });
    await waitFor(() => {
      const dlg = screen
        .getAllByText("Start redrive from this DLQ")
        .map((h) => h.closest('[role="dialog"]'))
        .find(Boolean) as HTMLElement | undefined;
      expect(dlg?.className.includes("hidden")).toBe(true);
    });
  });

  it("shows the fallback toast when start fails without a message", async () => {
    mockStartMoveTask.mockRejectedValueOnce(new Error(""));
    await openDlq();
    await user.click(screen.getByRole("button", { name: /Start redrive/i }));
    await user.type(
      screen.getByPlaceholderText("http://localhost:4566/000000000000/source-queue"),
      "http://localhost:4566/000000000000/src"
    );
    await user.click(screen.getByRole("button", { name: /^Start$/i }));
    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to start redrive")
    );
  });

  it("falls back to account and empty name for root-path URLs", () => {
    expect(queueUrlToArn("http://localhost:4566/")).toBe(
      "arn:aws:sqs:us-east-1:000000000000:"
    );
  });
});
