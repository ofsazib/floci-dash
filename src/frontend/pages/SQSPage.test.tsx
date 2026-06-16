// @vitest-environment jsdom
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
const mockSearchParams = vi.fn();

vi.mock("../hooks/useSQS", () => ({
  useSQSQueues: (...args: any[]) => mockSQSQueues(...args),
  useSQSQueueAttributes: (...args: any[]) => mockSQSAttributes(...args),
  useSQSMessages: (...args: any[]) => mockSQSMessages(...args),
  useSQSQueueTags: (...args: any[]) => mockSQSQueueTags(...args),
  useSQSDLQSources: (...args: any[]) => mockSQSDLQSources(...args),
  useCreateSQSQueue: () => ({ mutate: mockCreateQueueMutate, isPending: false }),
  useDeleteSQSQueue: () => ({ mutate: vi.fn(), isPending: false }),
  usePurgeSQSQueue: () => ({ mutate: vi.fn(), isPending: false }),
  useSendSQSMessage: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteSQSMessage: () => ({ mutate: vi.fn(), isPending: false }),
  useSetSQSAttributes: () => ({ mutate: vi.fn(), isPending: false }),
  useSQSTags: () => ({ tag: { mutate: vi.fn(), isPending: false }, untag: { mutate: vi.fn(), isPending: false } }),
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
});
