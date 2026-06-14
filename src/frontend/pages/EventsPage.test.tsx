// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const mockEventBuses = vi.fn();
const mockEventRules = vi.fn();
const mockEventTargets = vi.fn();
const mockEventArchives = vi.fn();

vi.mock("../hooks/useEvents", () => ({
  useEventBuses: (...args: any[]) => mockEventBuses(...args),
  useEventRules: (...args: any[]) => mockEventRules(...args),
  useEventTargets: (...args: any[]) => mockEventTargets(...args),
  useEventArchives: (...args: any[]) => mockEventArchives(...args),
  useCreateEventBus: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteEventBus: () => ({ mutate: vi.fn(), isPending: false }),
  usePutEventRule: () => ({ mutate: vi.fn(), isPending: false }),
  useDeleteEventRule: () => ({ mutate: vi.fn(), isPending: false }),
  useToggleEventRule: () => ({ enable: { mutate: vi.fn() }, disable: { mutate: vi.fn() } }),
  usePutEvents: () => ({ mutate: vi.fn(), isPending: false }),
  usePutEventTargets: () => ({ mutate: vi.fn(), isPending: false }),
  useRemoveEventTarget: () => ({ mutate: vi.fn(), isPending: false }),
  useCreateEventArchive: () => ({ mutate: vi.fn(), isPending: false }),
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
});
