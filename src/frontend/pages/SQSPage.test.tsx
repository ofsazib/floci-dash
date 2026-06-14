// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const mockSQSQueues = vi.fn();
const mockSQSAttributes = vi.fn();
const mockSQSMessages = vi.fn();
const mockSQSQueueTags = vi.fn();
const mockSQSDLQSources = vi.fn();
const mockCreateQueueMutate = vi.fn();

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
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
}));

import SQSPage from "./SQSPage";

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

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
    // Use role-based selector to find the Create queue button
    const createBtns = screen.getAllByRole("button", { name: /create queue/i });
    await user.click(createBtns[0]);
    await waitFor(() => {
      const inputs = screen.getAllByPlaceholderText("my-queue");
      expect(inputs.length).toBeGreaterThan(0);
    });
  });
});
