// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const mockSNSTopics = vi.fn();
const mockTopicAttributes = vi.fn();
const mockSubscriptions = vi.fn();
const mockTopicTags = vi.fn();
const mockPlatformApps = vi.fn();

vi.mock("../hooks/useSNS", () => ({
  useSNSTopics: (...args: any[]) => mockSNSTopics(...args),
  useSNSTopicAttributes: (...args: any[]) => mockTopicAttributes(...args),
  useSNSSubscriptions: (...args: any[]) => mockSubscriptions(...args),
  useSNSTopicTags: (...args: any[]) => mockTopicTags(...args),
  useSNSPlatformApps: (...args: any[]) => mockPlatformApps(...args),
  useCreateSNSTopic: () => ({ mutate: vi.fn(), isPending: false }),
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
});
