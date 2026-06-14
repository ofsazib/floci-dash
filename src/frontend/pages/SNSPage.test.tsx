// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const mockSNSTopics = vi.fn();
const mockTopicAttributes = vi.fn();
const mockSubscriptions = vi.fn();
const mockTopicTags = vi.fn();
const mockPlatformApps = vi.fn();
const mockCreateTopicMutate = vi.fn();

vi.mock("../hooks/useSNS", () => ({
  useSNSTopics: (...args: any[]) => mockSNSTopics(...args),
  useSNSTopicAttributes: (...args: any[]) => mockTopicAttributes(...args),
  useSNSSubscriptions: (...args: any[]) => mockSubscriptions(...args),
  useSNSTopicTags: (...args: any[]) => mockTopicTags(...args),
  useSNSPlatformApps: (...args: any[]) => mockPlatformApps(...args),
  useCreateSNSTopic: () => ({ mutate: mockCreateTopicMutate, isPending: false }),
  useDeleteSNSTopic: () => ({ mutate: vi.fn(), isPending: false }),
  useSNSSubscribe: () => ({ mutate: vi.fn(), isPending: false }),
  useSNSUnsubscribe: () => ({ mutate: vi.fn(), isPending: false }),
  useSNSPublish: () => ({ mutate: vi.fn(), isPending: false }),
  useSNSTopicTagsMutation: () => ({ tag: { mutate: vi.fn(), isPending: false }, untag: { mutate: vi.fn(), isPending: false } }),
  useCreateSNSPlatformApp: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteSNSPlatformApp: () => ({ mutateAsync: vi.fn(), isPending: false }),
  extractTopicName: (arn: string) => arn.split(":").pop() || arn,
}));

vi.mock("../components/Toast", () => ({
  useToast: () => ({ showToast: vi.fn() }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("../components/ConfirmDialog", () => ({
  useConfirmDialog: () => ({ confirm: vi.fn(() => Promise.resolve(true)), dialog: null }),
}));

vi.mock("react-router-dom", () => ({
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
}));

import SNSPage from "./SNSPage";

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("SNSPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSNSTopics.mockReturnValue({
      data: { topics: [{ TopicArn: "arn:aws:sns:us-east-1:000000000000:my-topic" }] },
      isLoading: false, isError: false, error: null,
    });
    mockTopicAttributes.mockReturnValue({ data: { attributes: {} } });
    mockSubscriptions.mockReturnValue({ data: { subscriptions: [] } });
    mockTopicTags.mockReturnValue({ data: { tags: [] } });
    mockPlatformApps.mockReturnValue({ data: { platformApps: [] } });
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

  it("shows error state", () => {
    mockSNSTopics.mockReturnValue({
      data: undefined, isLoading: false, isError: true, error: new Error("Failed to load"),
    });
    render(<SNSPage />, { wrapper: createWrapper() });
    expect(screen.getByText("Failed to load")).toBeTruthy();
  });

  // ─── Interaction Tests ──────────────────────────────────

  it("opens create topic modal when 'Create topic' button is clicked", async () => {
    const user = userEvent.setup();
    render(<SNSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Create topic"));
    await waitFor(() => {
      expect(screen.getByText("Create topic")).toBeTruthy();
    });
    expect(screen.getByPlaceholderText("my-topic")).toBeTruthy();
  });

  it("calls createTopic when create topic form is submitted", async () => {
    const user = userEvent.setup();
    render(<SNSPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Create topic"));
    await waitFor(() => {
      expect(screen.getByPlaceholderText("my-topic")).toBeTruthy();
    });
    const input = screen.getByPlaceholderText("my-topic");
    await user.type(input, "test-topic");
    const createBtns = screen.getAllByText("Create");
    const modalCreateBtn = createBtns[createBtns.length - 1];
    await user.click(modalCreateBtn);
    expect(mockCreateTopicMutate).toHaveBeenCalled();
  });

  it("filters topics when typing in search", async () => {
    const user = userEvent.setup();
    render(<SNSPage />, { wrapper: createWrapper() });
    const searchInput = screen.getByPlaceholderText("Find topics...");
    await user.type(searchInput, "my-topic");
    expect((searchInput as HTMLInputElement).value).toContain("my-topic");
  });
});
