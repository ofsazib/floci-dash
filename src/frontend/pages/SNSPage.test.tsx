// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../test/helpers";
import React from "react";

const mockSNSTopics = vi.fn();
const mockTopicAttributes = vi.fn();
const mockSubscriptions = vi.fn();
const mockTopicTags = vi.fn();
const mockPlatformApps = vi.fn();
const mockCreateTopicMutate = vi.fn();
const mockDeleteTopicMutate = vi.fn();
const mockSubscribeMutate = vi.fn();
const mockUnsubscribeMutate = vi.fn();
const mockPublishMutate = vi.fn();
const mockTagMutate = vi.fn();
const mockUntagMutate = vi.fn();
const mockConfirm = vi.fn(() => Promise.resolve(true));
const mockShowToast = vi.fn();
const mockSetSearchParams = vi.fn();
const mockSearchParams = vi.fn();

vi.mock("../hooks/useSNS", () => ({
  useSNSTopics: (...args: any[]) => mockSNSTopics(...args),
  useSNSTopicAttributes: (...args: any[]) => mockTopicAttributes(...args),
  useSNSSubscriptions: (...args: any[]) => mockSubscriptions(...args),
  useSNSTopicTags: (...args: any[]) => mockTopicTags(...args),
  useSNSPlatformApps: (...args: any[]) => mockPlatformApps(...args),
  useCreateSNSTopic: () => ({ mutate: mockCreateTopicMutate, isPending: false }),
  useDeleteSNSTopic: () => ({ mutate: mockDeleteTopicMutate, isPending: false }),
  useSNSSubscribe: () => ({ mutate: mockSubscribeMutate, isPending: false }),
  useSNSUnsubscribe: () => ({ mutate: mockUnsubscribeMutate, isPending: false }),
  useSNSPublish: () => ({ mutate: mockPublishMutate, isPending: false }),
  useSNSTopicTagsMutation: () => ({ tag: { mutate: mockTagMutate, isPending: false }, untag: { mutate: mockUntagMutate, isPending: false } }),
  useCreateSNSPlatformApp: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteSNSPlatformApp: () => ({ mutateAsync: vi.fn(), isPending: false }),
  extractTopicName: (arn: string) => arn.split(":").pop() || arn,
}));

vi.mock("../components/Toast", () => ({
  useToast: () => ({ showToast: mockShowToast }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("../components/ConfirmDialog", () => ({
  useConfirmDialog: () => ({ confirm: mockConfirm, dialog: null }),
}));

vi.mock("react-router-dom", () => ({
  useSearchParams: (...args: any[]) => mockSearchParams(...args),
}));

import SNSPage from "./SNSPage";

describe("SNSPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSNSTopics.mockReturnValue({
      data: { topics: [{ TopicArn: "arn:aws:sns:us-east-1:000000000000:my-topic" }] },
      isLoading: false, isError: false, error: null,
    });
    mockTopicAttributes.mockReturnValue({ data: { attributes: {} }, isLoading: false });
    mockSubscriptions.mockReturnValue({ data: { subscriptions: [] }, isLoading: false });
    mockTopicTags.mockReturnValue({ data: { tags: [] }, isLoading: false });
    mockPlatformApps.mockReturnValue({ data: { platformApps: [] } });
    mockSearchParams.mockReturnValue([new URLSearchParams(), mockSetSearchParams]);
  });

  // ─── Render State Tests ─────────────────────────────────

  it("renders topic list", () => {
    render(<SNSPage />, { wrapper: createWrapper() });
    expect(screen.getByText("SNS")).toBeTruthy();
    expect(screen.getByText("Topics")).toBeTruthy();
    expect(screen.getByText("my-topic")).toBeTruthy();
  });

  it("shows empty state", () => {
    mockSNSTopics.mockReturnValue({
      data: { topics: [] },
      isLoading: false, isError: false, error: null,
    });
    render(<SNSPage />, { wrapper: createWrapper() });
    expect(screen.getByText("No topics found")).toBeTruthy();
  });

  it("shows loading state", () => {
    mockSNSTopics.mockReturnValue({
      data: undefined, isLoading: true, isError: false, error: null,
    });
    render(<SNSPage />, { wrapper: createWrapper() });
    expect(screen.getByText("Loading topics...")).toBeTruthy();
  });

  it("shows error state", () => {
    mockSNSTopics.mockReturnValue({
      data: undefined, isLoading: false, isError: true, error: new Error("Failed to load"),
    });
    render(<SNSPage />, { wrapper: createWrapper() });
    expect(screen.getByText("Failed to load")).toBeTruthy();
  });

  it("shows Standard type indicator", () => {
    render(<SNSPage />, { wrapper: createWrapper() });
    expect(screen.getByText("Standard")).toBeTruthy();
  });

  it("shows FIFO type indicator", () => {
    mockSNSTopics.mockReturnValue({
      data: { topics: [{ TopicArn: "arn:aws:sns:us-east-1:000000000000:my-topic.fifo" }] },
      isLoading: false, isError: false, error: null,
    });
    render(<SNSPage />, { wrapper: createWrapper() });
    expect(screen.getByText("FIFO")).toBeTruthy();
  });

  // ─── Interaction Tests ──────────────────────────────────

  it("opens create topic modal when Create topic button is clicked", async () => {
    const user = userEvent.setup();
    render(<SNSPage />, { wrapper: createWrapper() });
    await clickButton(user, /^Create topic$/i);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("my-topic")).toBeTruthy();
    });
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("calls createTopic when create topic form is submitted", async () => {
    const user = userEvent.setup();
    render(<SNSPage />, { wrapper: createWrapper() });
    await clickButton(user, /^Create topic$/i);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("my-topic")).toBeTruthy();
    });
    const input = screen.getByPlaceholderText("my-topic");
    await user.type(input, "test-topic");
    await clickButton(user, /^Create$/i);
    expect(mockCreateTopicMutate).toHaveBeenCalled();
  });

  it("filters topics when typing in search", async () => {
    const user = userEvent.setup();
    mockSNSTopics.mockReturnValue({
      data: { topics: [
        { TopicArn: "arn:aws:sns:us-east-1:000000000000:alpha" },
        { TopicArn: "arn:aws:sns:us-east-1:000000000000:beta" },
      ] },
      isLoading: false, isError: false, error: null,
    });
    render(<SNSPage />, { wrapper: createWrapper() });
    expect(screen.getByText("(2)")).toBeTruthy();
    const searchInput = screen.getByPlaceholderText("Find topics...");
    await user.type(searchInput, "alpha");
    expect(screen.getByText("(1)")).toBeTruthy();
  });

  it("deletes a topic via confirm dialog", async () => {
    const user = userEvent.setup();
    render(<SNSPage />, { wrapper: createWrapper() });
    await clickButton(user, "Delete topic");
    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(mockDeleteTopicMutate).toHaveBeenCalled();
    });
  });

  // ─── Topic Detail Tests ─────────────────────────────────

  it("renders topic detail with back button", () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("?topicArn=arn:aws:sns:us-east-1:000000000000:my-topic"), mockSetSearchParams]);
    render(<SNSPage />, { wrapper: createWrapper() });
    expect(screen.getByText("← Back to topics")).toBeTruthy();
  });

  it("navigates back from topic detail", async () => {
    const user = userEvent.setup();
    mockSearchParams.mockReturnValue([new URLSearchParams("?topicArn=arn:aws:sns:us-east-1:000000000000:my-topic"), mockSetSearchParams]);
    render(<SNSPage />, { wrapper: createWrapper() });
    await clickButton(user, /← Back to topics/i);
    expect(mockSetSearchParams).toHaveBeenCalled();
  });

  it("shows topic detail stat cards", () => {
    mockTopicAttributes.mockReturnValue({
      data: { attributes: {
        SubscriptionsConfirmed: "3",
        SubscriptionsPending: "1",
        SubscriptionsDeleted: "5",
        FifoTopic: "false",
      } },
      isLoading: false,
    });
    mockSearchParams.mockReturnValue([new URLSearchParams("?topicArn=arn:aws:sns:us-east-1:000000000000:my-topic"), mockSetSearchParams]);
    render(<SNSPage />, { wrapper: createWrapper() });
    expect(screen.getByText("3")).toBeTruthy();
    expect(screen.getByText("1")).toBeTruthy();
    expect(screen.getByText("5")).toBeTruthy();
    expect(screen.getAllByText("Standard").length).toBeGreaterThanOrEqual(2);
  });

  it("shows attributes tab content", () => {
    mockTopicAttributes.mockReturnValue({
      data: { attributes: {
        Owner: "123456789012",
        DisplayName: "My Topic",
        FifoTopic: "false",
      } },
      isLoading: false,
    });
    mockSearchParams.mockReturnValue([new URLSearchParams("?topicArn=arn:aws:sns:us-east-1:000000000000:my-topic"), mockSetSearchParams]);
    render(<SNSPage />, { wrapper: createWrapper() });
    expect(screen.getByText("arn:aws:sns:us-east-1:000000000000:my-topic")).toBeTruthy();
    expect(screen.getByText("123456789012")).toBeTruthy();
    expect(screen.getByText("My Topic")).toBeTruthy();
  });

  it("shows subscriptions tab empty", async () => {
    const user = userEvent.setup();
    mockSearchParams.mockReturnValue([new URLSearchParams("?topicArn=arn:aws:sns:us-east-1:000000000000:my-topic"), mockSetSearchParams]);
    render(<SNSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Subscriptions"));
    await waitFor(() => {
      expect(screen.getByText("No subscriptions")).toBeTruthy();
    });
  });

  it("shows subscriptions with data", async () => {
    const user = userEvent.setup();
    mockSubscriptions.mockReturnValue({
      data: { subscriptions: [
        { SubscriptionArn: "arn:aws:sns:us-east-1:000000000000:my-topic:sub-1", Protocol: "sqs", Endpoint: "arn:aws:sqs:us-east-1:000000000000:my-queue", TopicArn: "arn:aws:sns:us-east-1:000000000000:my-topic" },
      ] },
      isLoading: false,
    });
    mockSearchParams.mockReturnValue([new URLSearchParams("?topicArn=arn:aws:sns:us-east-1:000000000000:my-topic"), mockSetSearchParams]);
    render(<SNSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Subscriptions"));
    await waitFor(() => {
      expect(screen.getByText("sqs")).toBeTruthy();
    });
    expect(screen.getByText("arn:aws:sqs:us-east-1:000000000000:my-queue")).toBeTruthy();
  });

  it("shows pending subscription status", async () => {
    const user = userEvent.setup();
    mockSubscriptions.mockReturnValue({
      data: { subscriptions: [
        { SubscriptionArn: "PendingConfirmation", Protocol: "email", Endpoint: "test@example.com", TopicArn: "arn:aws:sns:us-east-1:000000000000:my-topic" },
      ] },
      isLoading: false,
    });
    mockSearchParams.mockReturnValue([new URLSearchParams("?topicArn=arn:aws:sns:us-east-1:000000000000:my-topic"), mockSetSearchParams]);
    render(<SNSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Subscriptions"));
    await waitFor(() => {
      expect(screen.getAllByText("Pending").length).toBeGreaterThanOrEqual(1);
    });
  });

  it("unsubscribes from a subscription", async () => {
    const user = userEvent.setup();
    mockSubscriptions.mockReturnValue({
      data: { subscriptions: [
        { SubscriptionArn: "arn:aws:sns:us-east-1:000000000000:my-topic:sub-1", Protocol: "sqs", Endpoint: "arn:aws:sqs:us-east-1:000000000000:my-queue", TopicArn: "arn:aws:sns:us-east-1:000000000000:my-topic" },
      ] },
      isLoading: false,
    });
    mockSearchParams.mockReturnValue([new URLSearchParams("?topicArn=arn:aws:sns:us-east-1:000000000000:my-topic"), mockSetSearchParams]);
    render(<SNSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Subscriptions"));
    await waitFor(() => {
      expect(screen.getByText("sqs")).toBeTruthy();
    });
    await clickButton(user, "Unsubscribe");
    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(mockUnsubscribeMutate).toHaveBeenCalled();
    });
  });

  it("opens subscribe modal from detail", async () => {
    const user = userEvent.setup();
    mockSearchParams.mockReturnValue([new URLSearchParams("?topicArn=arn:aws:sns:us-east-1:000000000000:my-topic"), mockSetSearchParams]);
    render(<SNSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Subscriptions"));
    await clickButton(user, /Create subscription/i);
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeTruthy();
    });
  });

  it("subscribes from modal", async () => {
    const user = userEvent.setup();
    mockSearchParams.mockReturnValue([new URLSearchParams("?topicArn=arn:aws:sns:us-east-1:000000000000:my-topic"), mockSetSearchParams]);
    render(<SNSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Subscriptions"));
    await clickButton(user, /Create subscription/i);
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeTruthy();
    });
    const endpointInput = screen.getByPlaceholderText("arn:aws:sqs:us-east-1:000000000000:my-queue");
    await user.type(endpointInput, "arn:aws:sqs:us-east-1:000000000000:test-queue");
    await clickButton(user, /^Subscribe$/i);
    expect(mockSubscribeMutate).toHaveBeenCalled();
  });

  it("opens publish modal and publishes", async () => {
    const user = userEvent.setup();
    mockSearchParams.mockReturnValue([new URLSearchParams("?topicArn=arn:aws:sns:us-east-1:000000000000:my-topic"), mockSetSearchParams]);
    render(<SNSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Publish"));
    await clickButton(user, /Publish message/i);
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeTruthy();
    });
    const textarea = screen.getByPlaceholderText("Enter message content...");
    await user.type(textarea, "Hello SNS");
    await clickButton(user, /^Publish$/i, { last: true });
    expect(mockPublishMutate).toHaveBeenCalled();
  });

  it("shows message group ID field for FIFO topics", async () => {
    const user = userEvent.setup();
    mockTopicAttributes.mockReturnValue({
      data: { attributes: { FifoTopic: "true" } },
      isLoading: false,
    });
    mockSearchParams.mockReturnValue([new URLSearchParams("?topicArn=arn:aws:sns:us-east-1:000000000000:my-topic.fifo"), mockSetSearchParams]);
    render(<SNSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Publish"));
    await clickButton(user, /Publish message/i);
    await waitFor(() => {
      expect(screen.getByText("Message group ID")).toBeTruthy();
    });
  });

  it("shows tags tab with tags", async () => {
    const user = userEvent.setup();
    mockTopicTags.mockReturnValue({
      data: { tags: [{ Key: "Environment", Value: "production" }] },
      isLoading: false,
    });
    mockSearchParams.mockReturnValue([new URLSearchParams("?topicArn=arn:aws:sns:us-east-1:000000000000:my-topic"), mockSetSearchParams]);
    render(<SNSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Tags"));
    await waitFor(() => {
      expect(screen.getByText("Environment")).toBeTruthy();
      expect(screen.getByText("production")).toBeTruthy();
    });
  });

  it("adds a tag", async () => {
    const user = userEvent.setup();
    mockSearchParams.mockReturnValue([new URLSearchParams("?topicArn=arn:aws:sns:us-east-1:000000000000:my-topic"), mockSetSearchParams]);
    render(<SNSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Tags"));
    await waitFor(() => {
      expect(screen.getAllByRole("textbox").length).toBeGreaterThanOrEqual(2);
    });
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "my-key");
    await user.type(inputs[1], "my-value");
    await clickButton(user, /Add tag/i);
    expect(mockTagMutate).toHaveBeenCalled();
  });

  it("removes a tag", async () => {
    const user = userEvent.setup();
    mockTopicTags.mockReturnValue({
      data: { tags: [{ Key: "Environment", Value: "production" }] },
      isLoading: false,
    });
    mockSearchParams.mockReturnValue([new URLSearchParams("?topicArn=arn:aws:sns:us-east-1:000000000000:my-topic"), mockSetSearchParams]);
    render(<SNSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Tags"));
    await waitFor(() => {
      expect(screen.getByText("Environment")).toBeTruthy();
    });
    await clickButton(user, "Remove tag");
    expect(mockUntagMutate).toHaveBeenCalled();
  });
});
