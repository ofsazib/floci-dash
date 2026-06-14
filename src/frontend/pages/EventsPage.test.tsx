// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const mockEventBuses = vi.fn();
const mockEventRules = vi.fn();
const mockEventTargets = vi.fn();
const mockEventArchives = vi.fn();
const mockPutRuleMutate = vi.fn();
const mockCreateBusMutate = vi.fn();
const mockCreateArchiveMutate = vi.fn();
const mockPutEventsMutate = vi.fn();

vi.mock("../hooks/useEvents", () => ({
  useEventBuses: (...args: any[]) => mockEventBuses(...args),
  useEventRules: (...args: any[]) => mockEventRules(...args),
  useEventTargets: (...args: any[]) => mockEventTargets(...args),
  useEventArchives: (...args: any[]) => mockEventArchives(...args),
  useCreateEventBus: () => ({ mutate: mockCreateBusMutate, isPending: false }),
  useDeleteEventBus: () => ({ mutate: vi.fn(), isPending: false }),
  usePutEventRule: () => ({ mutate: mockPutRuleMutate, isPending: false }),
  useDeleteEventRule: () => ({ mutate: vi.fn(), isPending: false }),
  useToggleEventRule: () => ({ enable: { mutate: vi.fn() }, disable: { mutate: vi.fn() } }),
  usePutEvents: () => ({ mutate: mockPutEventsMutate, isPending: false }),
  usePutEventTargets: () => ({ mutate: vi.fn(), isPending: false }),
  useRemoveEventTarget: () => ({ mutate: vi.fn(), isPending: false }),
  useCreateEventArchive: () => ({ mutate: mockCreateArchiveMutate, isPending: false }),
  useDeleteEventArchive: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("../components/Toast", () => ({
  useToast: () => ({ showToast: vi.fn() }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("../components/ConfirmDialog", () => ({
  useConfirmDialog: () => ({ confirm: vi.fn(() => Promise.resolve(true)), dialog: null }),
}));

import EventsPage from "./EventsPage";

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("EventsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEventBuses.mockReturnValue({ data: { eventBuses: [{ Name: "default", Arn: "arn:aws:..." }] }, isLoading: false });
    mockEventRules.mockReturnValue({ data: { rules: [{ Name: "my-rule", State: "ENABLED", EventBusName: "default" }] }, isLoading: false, isError: false, error: null });
    mockEventTargets.mockReturnValue({ data: { targets: [] }, isLoading: false });
    mockEventArchives.mockReturnValue({ data: { archives: [] }, isLoading: false });
  });

  // ─── Render State Tests ─────────────────────────────────

  it("renders rules tab by default", () => {
    render(<EventsPage />, { wrapper: createWrapper() });
    expect(screen.getByText("EventBridge")).toBeTruthy();
    expect(screen.getAllByText("Rules").length).toBeGreaterThan(0);
    expect(screen.getByText("my-rule")).toBeTruthy();
  });

  it("shows empty rules state", () => {
    mockEventRules.mockReturnValue({ data: { rules: [] }, isLoading: false, isError: false, error: null });
    render(<EventsPage />, { wrapper: createWrapper() });
    expect(screen.getByText("No rules found")).toBeTruthy();
  });

  it("renders event buses tab", () => {
    render(<EventsPage />, { wrapper: createWrapper() });
    expect(screen.getByText("Event Buses")).toBeTruthy();
  });

  it("shows send event tab", () => {
    render(<EventsPage />, { wrapper: createWrapper() });
    expect(screen.getByText("Send Event")).toBeTruthy();
  });

  it("shows archives tab", () => {
    render(<EventsPage />, { wrapper: createWrapper() });
    expect(screen.getByText("Archives")).toBeTruthy();
  });

  // ─── Interaction Tests ──────────────────────────────────

  it("opens create rule modal from rules tab", async () => {
    const user = userEvent.setup();
    render(<EventsPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Create rule"));
    await waitFor(() => {
      expect(screen.getByText("Create rule")).toBeTruthy();
    });
    expect(screen.getByPlaceholderText("my-rule")).toBeTruthy();
    expect(screen.getByText("Enabled")).toBeTruthy();
  });

  it("calls putRule when create rule form is submitted", async () => {
    const user = userEvent.setup();
    render(<EventsPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Create rule"));
    await waitFor(() => {
      expect(screen.getByPlaceholderText("my-rule")).toBeTruthy();
    });
    const input = screen.getByPlaceholderText("my-rule");
    await user.type(input, "test-rule");
    const createBtns = screen.getAllByText("Create");
    const modalBtn = createBtns[createBtns.length - 1];
    await user.click(modalBtn);
    expect(mockPutRuleMutate).toHaveBeenCalled();
  });
});
