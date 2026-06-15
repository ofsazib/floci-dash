// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../test/helpers";
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
    await clickButton(user, /Create rule/i);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("my-rule")).toBeTruthy();
    });
  });

  it("calls putRule when create rule form is submitted", async () => {
    const user = userEvent.setup();
    render(<EventsPage />, { wrapper: createWrapper() });
    await clickButton(user, /Create rule/i);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("my-rule")).toBeTruthy();
    });
    // Fill required fields: rule name + schedule expression (to pass form validation)
    const nameInput = screen.getByPlaceholderText("my-rule");
    await user.type(nameInput, "test-rule");
    const scheduleInput = screen.getByPlaceholderText("rate(5 minutes)");
    await user.type(scheduleInput, "rate(1 hour)");
    await clickButton(user, /Create/i, { last: true });
    expect(mockPutRuleMutate).toHaveBeenCalled();
  });
});
