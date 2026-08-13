// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
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

  // ─── Modal Cancel Tests ──────────────────────────────────

  it("cancels create topic modal", async () => {
    const user = userEvent.setup();
    render(<SNSPage />, { wrapper: createWrapper() });
    await clickButton(user, /^Create topic$/i);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("my-topic")).toBeTruthy();
    });
    await clickButton(user, /Cancel/i);
    expect(mockCreateTopicMutate).not.toHaveBeenCalled();
  });

  it("cancels publish modal", async () => {
    const user = userEvent.setup();
    mockSearchParams.mockReturnValue([new URLSearchParams("?topicArn=arn:aws:sns:us-east-1:000000000000:my-topic"), mockSetSearchParams]);
    render(<SNSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Publish"));
    await clickButton(user, /Publish message/i);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("Enter message content...")).toBeTruthy();
    });
    await clickButton(user, /Cancel/i);
    expect(mockPublishMutate).not.toHaveBeenCalled();
  });

  it("cancels subscribe modal", async () => {
    const user = userEvent.setup();
    mockSearchParams.mockReturnValue([new URLSearchParams("?topicArn=arn:aws:sns:us-east-1:000000000000:my-topic"), mockSetSearchParams]);
    render(<SNSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Subscriptions"));
    await clickButton(user, /Create subscription/i);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("arn:aws:sqs:us-east-1:000000000000:my-queue")).toBeTruthy();
    });
    await clickButton(user, /Cancel/i);
    expect(mockSubscribeMutate).not.toHaveBeenCalled();
  });

  // ─── Loading State Tests ─────────────────────────────────

  it("shows loading state in subscriptions tab", async () => {
    const user = userEvent.setup();
    mockSubscriptions.mockReturnValue({ data: undefined, isLoading: true });
    mockSearchParams.mockReturnValue([new URLSearchParams("?topicArn=arn:aws:sns:us-east-1:000000000000:my-topic"), mockSetSearchParams]);
    render(<SNSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Subscriptions"));
    expect(screen.getAllByText("Subscriptions").length).toBeGreaterThanOrEqual(1);
  });

  it("shows loading state in tags tab", async () => {
    const user = userEvent.setup();
    mockTopicTags.mockReturnValue({ data: undefined, isLoading: true });
    mockSearchParams.mockReturnValue([new URLSearchParams("?topicArn=arn:aws:sns:us-east-1:000000000000:my-topic"), mockSetSearchParams]);
    render(<SNSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Tags"));
    await waitFor(() => {
      expect(screen.getAllByText("Tags").length).toBeGreaterThan(0);
    });
  });

  // ─── Attributes Fallback Tests ────────────────────────────

  it("shows — for missing attribute fields", () => {
    mockSearchParams.mockReturnValue([new URLSearchParams("?topicArn=arn:aws:sns:us-east-1:000000000000:my-topic"), mockSetSearchParams]);
    render(<SNSPage />, { wrapper: createWrapper() });
    // Owner and DisplayName default to "—" when attributes are empty
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  // ─── Remaining branch coverage (2026) ────────────────────

  it("selects a topic from the list", async () => {
    const user = userEvent.setup();
    render(<SNSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-topic"));
    expect(mockSetSearchParams).toHaveBeenCalledWith({ topicArn: "arn:aws:sns:us-east-1:000000000000:my-topic" });
  });

  it("shows delete topic success toast", async () => {
    const user = userEvent.setup();
    mockDeleteTopicMutate.mockImplementation((_arn: any, opts: any) => opts?.onSuccess?.());
    render(<SNSPage />, { wrapper: createWrapper() });
    await clickButton(user, "Delete topic");
    await waitFor(() => expect(mockDeleteTopicMutate).toHaveBeenCalled());
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("success", "Topic deleted"));
  });

  it("shows delete topic error toast", async () => {
    const user = userEvent.setup();
    mockDeleteTopicMutate.mockImplementation((_arn: any, opts: any) => opts?.onError?.(new Error("boom")));
    render(<SNSPage />, { wrapper: createWrapper() });
    await clickButton(user, "Delete topic");
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Delete failed: boom"));
  });

  it("opens create topic modal from empty state", async () => {
    const user = userEvent.setup();
    render(<SNSPage />, { wrapper: createWrapper() });
    const searchInput = screen.getByPlaceholderText("Find topics...");
    await user.type(searchInput, "zzz");
    await waitFor(() => expect(screen.getByText("No topics found")).toBeTruthy());
    await clickButton(user, /^Create topic$/i, { last: true });
    await waitFor(() => expect(screen.getByPlaceholderText("my-topic")).toBeTruthy());
  });

  it("creates a FIFO topic with display name", async () => {
    const user = userEvent.setup();
    mockCreateTopicMutate.mockImplementation((_body: any, opts: any) => opts?.onSuccess?.());
    render(<SNSPage />, { wrapper: createWrapper() });
    await clickButton(user, /^Create topic$/i);
    await waitFor(() => expect(screen.getByPlaceholderText("my-topic")).toBeTruthy());
    const dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByPlaceholderText("my-topic"), "orders");
    await user.type(within(dialog).getAllByRole("textbox")[1], "Order Feed");
    await user.click(within(dialog).getByRole("button", { name: /Standard/i }));
    await user.click(await screen.findByRole("option", { name: /FIFO/i }));
    await clickButton(user, /^Create$/i);
    await waitFor(() =>
      expect(mockCreateTopicMutate).toHaveBeenCalledWith(
        { name: "orders.fifo", attributes: { DisplayName: "Order Feed", FifoTopic: "true" } },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      ),
    );
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("success", 'Topic "orders.fifo" created'));
    await waitFor(() => expect(screen.queryByPlaceholderText("my-topic")).toBeNull());
  });

  it("shows create topic error toast", async () => {
    const user = userEvent.setup();
    mockCreateTopicMutate.mockImplementation((_body: any, opts: any) => opts?.onError?.(new Error("boom")));
    render(<SNSPage />, { wrapper: createWrapper() });
    await clickButton(user, /^Create topic$/i);
    await waitFor(() => expect(screen.getByPlaceholderText("my-topic")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("my-topic"), "orders");
    await clickButton(user, /^Create$/i);
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Create failed: boom"));
  });

  it("shows unsubscribe success toast", async () => {
    const user = userEvent.setup();
    mockSubscriptions.mockReturnValue({
      data: { subscriptions: [
        { SubscriptionArn: "arn:aws:sns:us-east-1:000000000000:my-topic:sub-1", Protocol: "sqs", Endpoint: "arn:aws:sqs:us-east-1:000000000000:my-queue", TopicArn: "arn:aws:sns:us-east-1:000000000000:my-topic" },
      ] },
      isLoading: false,
    });
    mockUnsubscribeMutate.mockImplementation((_body: any, opts: any) => opts?.onSuccess?.());
    mockSearchParams.mockReturnValue([new URLSearchParams("?topicArn=arn:aws:sns:us-east-1:000000000000:my-topic"), mockSetSearchParams]);
    render(<SNSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Subscriptions"));
    await waitFor(() => expect(screen.getByText("sqs")).toBeTruthy());
    await clickButton(user, "Unsubscribe");
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("success", "Subscription deleted"));
  });

  it("shows unsubscribe error toast", async () => {
    const user = userEvent.setup();
    mockSubscriptions.mockReturnValue({
      data: { subscriptions: [
        { SubscriptionArn: "arn:aws:sns:us-east-1:000000000000:my-topic:sub-1", Protocol: "sqs", Endpoint: "arn:aws:sqs:us-east-1:000000000000:my-queue", TopicArn: "arn:aws:sns:us-east-1:000000000000:my-topic" },
      ] },
      isLoading: false,
    });
    mockUnsubscribeMutate.mockImplementation((_body: any, opts: any) => opts?.onError?.(new Error("boom")));
    mockSearchParams.mockReturnValue([new URLSearchParams("?topicArn=arn:aws:sns:us-east-1:000000000000:my-topic"), mockSetSearchParams]);
    render(<SNSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Subscriptions"));
    await waitFor(() => expect(screen.getByText("sqs")).toBeTruthy());
    await clickButton(user, "Unsubscribe");
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Delete failed: boom"));
  });

  it("subscribes with a different protocol", async () => {
    const user = userEvent.setup();
    mockSubscribeMutate.mockImplementation((_body: any, opts: any) => opts?.onSuccess?.());
    mockSearchParams.mockReturnValue([new URLSearchParams("?topicArn=arn:aws:sns:us-east-1:000000000000:my-topic"), mockSetSearchParams]);
    render(<SNSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Subscriptions"));
    await clickButton(user, /Create subscription/i);
    await waitFor(() => expect(screen.getByPlaceholderText("arn:aws:sqs:us-east-1:000000000000:my-queue")).toBeTruthy());
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /SQS/i }));
    await user.click(await screen.findByRole("option", { name: /Lambda/i }));
    await user.type(within(dialog).getByPlaceholderText("arn:aws:sqs:us-east-1:000000000000:my-queue"), "arn:aws:lambda:us-east-1:000000000000:fn");
    await clickButton(user, /^Subscribe$/i);
    await waitFor(() =>
      expect(mockSubscribeMutate).toHaveBeenCalledWith(
        { topicArn: "arn:aws:sns:us-east-1:000000000000:my-topic", protocol: "lambda", endpoint: "arn:aws:lambda:us-east-1:000000000000:fn" },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      ),
    );
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("success", "Subscription created"));
    await waitFor(() => expect(screen.queryByPlaceholderText("arn:aws:lambda:us-east-1:000000000000:fn")).toBeNull());
  });

  it("shows subscribe error toast", async () => {
    const user = userEvent.setup();
    mockSubscribeMutate.mockImplementation((_body: any, opts: any) => opts?.onError?.(new Error("boom")));
    mockSearchParams.mockReturnValue([new URLSearchParams("?topicArn=arn:aws:sns:us-east-1:000000000000:my-topic"), mockSetSearchParams]);
    render(<SNSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Subscriptions"));
    await clickButton(user, /Create subscription/i);
    await waitFor(() => expect(screen.getByPlaceholderText("arn:aws:sqs:us-east-1:000000000000:my-queue")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("arn:aws:sqs:us-east-1:000000000000:my-queue"), "arn:aws:sqs:us-east-1:000000000000:test-queue");
    await clickButton(user, /^Subscribe$/i);
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Subscribe failed: boom"));
  });

  it("publishes to FIFO topic with subject and group id", async () => {
    const user = userEvent.setup();
    mockTopicAttributes.mockReturnValue({ data: { attributes: { FifoTopic: "true" } }, isLoading: false });
    mockPublishMutate.mockImplementation((_body: any, opts: any) => opts?.onSuccess?.({ messageId: "abc12345xyz" }));
    mockSearchParams.mockReturnValue([new URLSearchParams("?topicArn=arn:aws:sns:us-east-1:000000000000:my-topic.fifo"), mockSetSearchParams]);
    render(<SNSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Publish"));
    await clickButton(user, /Publish message/i);
    await waitFor(() => expect(screen.getByPlaceholderText("Enter message content...")).toBeTruthy());
    const dialog = screen.getByRole("dialog");
    const inputs = within(dialog).getAllByRole("textbox");
    await user.type(inputs[0], "Hello");
    await user.type(inputs[1], "Hello SNS");
    await user.type(within(dialog).getByPlaceholderText("group-1"), "g1");
    await clickButton(user, /^Publish$/i, { last: true });
    await waitFor(() =>
      expect(mockPublishMutate).toHaveBeenCalledWith(
        { topicArn: "arn:aws:sns:us-east-1:000000000000:my-topic.fifo", message: "Hello SNS", subject: "Hello", messageGroupId: "g1" },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      ),
    );
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("success", "Published: abc12345…"));
  });

  it("shows publish error toast", async () => {
    const user = userEvent.setup();
    mockPublishMutate.mockImplementation((_body: any, opts: any) => opts?.onError?.(new Error("boom")));
    mockSearchParams.mockReturnValue([new URLSearchParams("?topicArn=arn:aws:sns:us-east-1:000000000000:my-topic"), mockSetSearchParams]);
    render(<SNSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Publish"));
    await clickButton(user, /Publish message/i);
    await waitFor(() => expect(screen.getByPlaceholderText("Enter message content...")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("Enter message content..."), "Hello SNS");
    await clickButton(user, /^Publish$/i, { last: true });
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Publish failed: boom"));
  });

  it("shows tag added toast", async () => {
    const user = userEvent.setup();
    mockTagMutate.mockImplementation((_body: any, opts: any) => opts?.onSuccess?.());
    mockSearchParams.mockReturnValue([new URLSearchParams("?topicArn=arn:aws:sns:us-east-1:000000000000:my-topic"), mockSetSearchParams]);
    render(<SNSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Tags"));
    await waitFor(() => expect(screen.getAllByRole("textbox").length).toBeGreaterThanOrEqual(2));
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "my-key");
    await user.type(inputs[1], "my-value");
    await clickButton(user, /Add tag/i);
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("success", "Tag added"));
  });

  it("shows tag error toast", async () => {
    const user = userEvent.setup();
    mockTagMutate.mockImplementation((_body: any, opts: any) => opts?.onError?.(new Error("boom")));
    mockSearchParams.mockReturnValue([new URLSearchParams("?topicArn=arn:aws:sns:us-east-1:000000000000:my-topic"), mockSetSearchParams]);
    render(<SNSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Tags"));
    await waitFor(() => expect(screen.getAllByRole("textbox").length).toBeGreaterThanOrEqual(2));
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "my-key");
    await clickButton(user, /Add tag/i);
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Tag failed: boom"));
  });

  it("shows tag removed toast", async () => {
    const user = userEvent.setup();
    mockTopicTags.mockReturnValue({ data: { tags: [{ Key: "Environment", Value: "production" }] }, isLoading: false });
    mockUntagMutate.mockImplementation((_body: any, opts: any) => opts?.onSuccess?.());
    mockSearchParams.mockReturnValue([new URLSearchParams("?topicArn=arn:aws:sns:us-east-1:000000000000:my-topic"), mockSetSearchParams]);
    render(<SNSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Tags"));
    await waitFor(() => expect(screen.getByText("Environment")).toBeTruthy());
    await clickButton(user, "Remove tag");
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("success", "Tag removed"));
  });

  it("shows remove tag error toast", async () => {
    const user = userEvent.setup();
    mockTopicTags.mockReturnValue({ data: { tags: [{ Key: "Environment", Value: "production" }] }, isLoading: false });
    mockUntagMutate.mockImplementation((_body: any, opts: any) => opts?.onError?.(new Error("boom")));
    mockSearchParams.mockReturnValue([new URLSearchParams("?topicArn=arn:aws:sns:us-east-1:000000000000:my-topic"), mockSetSearchParams]);
    render(<SNSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Tags"));
    await waitFor(() => expect(screen.getByText("Environment")).toBeTruthy());
    await clickButton(user, "Remove tag");
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Remove failed: boom"));
  });

  // ─── Remaining branch coverage (2026) ────────────────────

  it("skips deleting a topic when confirm is declined", async () => {
    const user = userEvent.setup();
    mockConfirm.mockResolvedValueOnce(false);
    render(<SNSPage />, { wrapper: createWrapper() });
    await clickButton(user, "Delete topic");
    await waitFor(() => expect(mockConfirm).toHaveBeenCalled());
    expect(mockDeleteTopicMutate).not.toHaveBeenCalled();
  });

  it("skips unsubscribing when confirm is declined", async () => {
    const user = userEvent.setup();
    mockSubscriptions.mockReturnValue({
      data: { subscriptions: [
        { SubscriptionArn: "arn:aws:sns:us-east-1:000000000000:my-topic:sub-1", Protocol: "sqs", Endpoint: "arn:aws:sqs:us-east-1:000000000000:my-queue", TopicArn: "arn:aws:sns:us-east-1:000000000000:my-topic" },
      ] },
      isLoading: false,
    });
    mockConfirm.mockResolvedValueOnce(false);
    mockSearchParams.mockReturnValue([new URLSearchParams("?topicArn=arn:aws:sns:us-east-1:000000000000:my-topic"), mockSetSearchParams]);
    render(<SNSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Subscriptions"));
    await waitFor(() => expect(screen.getByText("sqs")).toBeTruthy());
    await clickButton(user, "Unsubscribe");
    await waitFor(() => expect(mockConfirm).toHaveBeenCalled());
    expect(mockUnsubscribeMutate).not.toHaveBeenCalled();
  });

  it("shows generic error text when error has no message", () => {
    mockSNSTopics.mockReturnValue({
      data: undefined, isLoading: false, isError: true, error: {} as Error,
    });
    render(<SNSPage />, { wrapper: createWrapper() });
    expect(screen.getByText("Failed to load topics")).toBeTruthy();
  });

  it("falls back to empty attributes when data is undefined", () => {
    mockTopicAttributes.mockReturnValue({ data: undefined, isLoading: true });
    mockSearchParams.mockReturnValue([new URLSearchParams("?topicArn=arn:aws:sns:us-east-1:000000000000:my-topic"), mockSetSearchParams]);
    render(<SNSPage />, { wrapper: createWrapper() });
    // Defaults render: Type card shows "Standard", Owner/DisplayName show "—"
    expect(screen.getAllByText("Standard").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(2);
  });

  it("publishes to FIFO topic without a group id", async () => {
    const user = userEvent.setup();
    mockTopicAttributes.mockReturnValue({ data: { attributes: { FifoTopic: "true" } }, isLoading: false });
    mockPublishMutate.mockImplementation((_body: any, opts: any) => opts?.onSuccess?.({ messageId: "abc12345xyz" }));
    mockSearchParams.mockReturnValue([new URLSearchParams("?topicArn=arn:aws:sns:us-east-1:000000000000:my-topic.fifo"), mockSetSearchParams]);
    render(<SNSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Publish"));
    await clickButton(user, /Publish message/i);
    await waitFor(() => expect(screen.getByPlaceholderText("Enter message content...")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("Enter message content..."), "Hello SNS");
    await clickButton(user, /^Publish$/i, { last: true });
    await waitFor(() =>
      expect(mockPublishMutate).toHaveBeenCalledWith(
        { topicArn: "arn:aws:sns:us-east-1:000000000000:my-topic.fifo", message: "Hello SNS", subject: undefined, messageGroupId: undefined },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      ),
    );
  });
});
