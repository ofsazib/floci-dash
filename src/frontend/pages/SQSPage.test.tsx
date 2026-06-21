// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../test/helpers";
import React from "react";

const mockSQSQueues = vi.fn();
const mockSQSAttributes = vi.fn();
const mockSQSMessages = vi.fn();
const mockSQSQueueTags = vi.fn();
const mockSQSDLQSources = vi.fn();
const mockCreateQueueMutate = vi.fn();
const mockDeleteQueueMutate = vi.fn();
const mockSendMessageMutate = vi.fn();
const mockSetAttrsMutate = vi.fn();
const mockTagMutate = vi.fn();
const mockUntagMutate = vi.fn();
const mockSearchParams = vi.fn();

vi.mock("../hooks/useSQS", () => ({
  useSQSQueues: (...args: any[]) => mockSQSQueues(...args),
  useSQSQueueAttributes: (...args: any[]) => mockSQSAttributes(...args),
  useSQSMessages: (...args: any[]) => mockSQSMessages(...args),
  useSQSQueueTags: (...args: any[]) => mockSQSQueueTags(...args),
  useSQSDLQSources: (...args: any[]) => mockSQSDLQSources(...args),
  useCreateSQSQueue: () => ({ mutate: mockCreateQueueMutate, isPending: false }),
  useDeleteSQSQueue: () => ({ mutate: mockDeleteQueueMutate, isPending: false }),
  usePurgeSQSQueue: () => ({ mutate: vi.fn(), isPending: false }),
  useSendSQSMessage: () => ({ mutate: mockSendMessageMutate, isPending: false }),
  useDeleteSQSMessage: () => ({ mutate: vi.fn(), isPending: false }),
  useSetSQSAttributes: () => ({ mutate: mockSetAttrsMutate, isPending: false }),
  useSQSTags: () => ({ tag: { mutate: mockTagMutate, isPending: false }, untag: { mutate: mockUntagMutate, isPending: false } }),
  extractQueueName: (url: string) => url.split("/").pop() || url,
}));

vi.mock("../hooks/useSystem", () => ({
  useHealth: () => ({ data: { services: { sqs: "running" } } }),
}));

vi.mock("../components/Toast", () => ({
  useToast: () => ({ showToast: vi.fn() }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("../components/ConfirmDialog", () => ({
  useConfirmDialog: () => ({ confirm: vi.fn(() => Promise.resolve(true)), dialog: null }),
}));

vi.mock("react-router-dom", () => ({
  useSearchParams: (...args: any[]) => mockSearchParams(...args),
}));

import SQSPage from "./SQSPage";
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
    mockSearchParams.mockReturnValue([new URLSearchParams(), vi.fn()]);
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
});
