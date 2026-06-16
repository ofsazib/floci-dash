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
const mockDeleteRuleMutate = vi.fn();
const mockCreateBusMutate = vi.fn();
const mockDeleteBusMutate = vi.fn();
const mockCreateArchiveMutate = vi.fn();
const mockDeleteArchiveMutate = vi.fn();
const mockPutEventsMutate = vi.fn();
const mockToggleEnableMutate = vi.fn();
const mockToggleDisableMutate = vi.fn();
const mockPutTargetsMutate = vi.fn();
const mockRemoveTargetMutate = vi.fn();

vi.mock("../hooks/useEvents", () => ({
  useEventBuses: (...args: any[]) => mockEventBuses(...args),
  useEventRules: (...args: any[]) => mockEventRules(...args),
  useEventTargets: (...args: any[]) => mockEventTargets(...args),
  useEventArchives: (...args: any[]) => mockEventArchives(...args),
  useCreateEventBus: () => ({ mutate: mockCreateBusMutate, isPending: false }),
  useDeleteEventBus: () => ({ mutate: mockDeleteBusMutate, isPending: false }),
  usePutEventRule: () => ({ mutate: mockPutRuleMutate, isPending: false }),
  useDeleteEventRule: () => ({ mutate: mockDeleteRuleMutate, isPending: false }),
  useToggleEventRule: () => ({ enable: { mutate: mockToggleEnableMutate }, disable: { mutate: mockToggleDisableMutate } }),
  usePutEvents: () => ({ mutate: mockPutEventsMutate, isPending: false }),
  usePutEventTargets: () => ({ mutate: mockPutTargetsMutate, isPending: false }),
  useRemoveEventTarget: () => ({ mutate: mockRemoveTargetMutate, isPending: false }),
  useCreateEventArchive: () => ({ mutate: mockCreateArchiveMutate, isPending: false }),
  useDeleteEventArchive: () => ({ mutate: mockDeleteArchiveMutate, isPending: false }),
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
    mockEventBuses.mockReturnValue({
      data: { eventBuses: [{ Name: "default", Arn: "arn:aws:..." }] },
      isLoading: false,
    });
    mockEventRules.mockReturnValue({
      data: { rules: [{ Name: "my-rule", State: "ENABLED", EventBusName: "default" }] },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockEventTargets.mockReturnValue({ data: { targets: [] }, isLoading: false });
    mockEventArchives.mockReturnValue({ data: { archives: [] }, isLoading: false });
  });

  // ─── Rules Tab ──────────────────────────────────────────

  it("renders rules tab by default", () => {
    render(<EventsPage />, { wrapper: createWrapper() });
    expect(screen.getByText("EventBridge")).toBeTruthy();
    expect(screen.getAllByText("Rules").length).toBeGreaterThan(0);
    expect(screen.getByText("my-rule")).toBeTruthy();
  });

  it("shows empty rules state", () => {
    mockEventRules.mockReturnValue({
      data: { rules: [] },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<EventsPage />, { wrapper: createWrapper() });
    expect(screen.getByText("No rules found")).toBeTruthy();
  });

  it("shows rules loading state", () => {
    mockEventRules.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });
    render(<EventsPage />, { wrapper: createWrapper() });
    expect(screen.getByText("Loading rules...")).toBeTruthy();
  });

  it("shows rules error state", () => {
    mockEventRules.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("Failed to load rules"),
    });
    render(<EventsPage />, { wrapper: createWrapper() });
    expect(screen.getByText("Failed to load rules")).toBeTruthy();
  });

  it("filters rules by name", async () => {
    const user = userEvent.setup();
    mockEventRules.mockReturnValue({
      data: {
        rules: [
          { Name: "alpha-rule", State: "ENABLED", EventBusName: "default" },
          { Name: "beta-rule", State: "DISABLED", EventBusName: "default" },
        ],
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<EventsPage />, { wrapper: createWrapper() });
    expect(screen.getByText("alpha-rule")).toBeTruthy();
    expect(screen.getByText("beta-rule")).toBeTruthy();
    const searchInput = screen.getByPlaceholderText("Find rules...");
    await user.type(searchInput, "alpha");
    expect(screen.getByText("alpha-rule")).toBeTruthy();
    expect(screen.queryByText("beta-rule")).toBeFalsy();
  });

  // ─── Rules Interaction ──────────────────────────────────

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
    const nameInput = screen.getByPlaceholderText("my-rule");
    await user.type(nameInput, "test-rule");
    const scheduleInput = screen.getByPlaceholderText("rate(5 minutes)");
    await user.type(scheduleInput, "rate(1 hour)");
    await clickButton(user, /Create/i, { last: true });
    expect(mockPutRuleMutate).toHaveBeenCalled();
  });

  it("toggles rule state", async () => {
    const user = userEvent.setup();
    mockEventRules.mockReturnValue({
      data: { rules: [{ Name: "my-rule", State: "ENABLED", EventBusName: "default" }] },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<EventsPage />, { wrapper: createWrapper() });
    const toggles = screen.getAllByRole("checkbox");
    await user.click(toggles[0]);
    expect(mockToggleDisableMutate).toHaveBeenCalledWith(
      { name: "my-rule", eventBusName: "default" },
      expect.anything(),
    );
  });

  // ─── Targets Section ────────────────────────────────────

  it("shows targets section when rule name is clicked", async () => {
    const user = userEvent.setup();
    mockEventTargets.mockReturnValue({
      data: { targets: [{ Id: "fn-target", Arn: "arn:aws:lambda:us-east-1:000000000000:function:my-fn" }] },
      isLoading: false,
    });
    render(<EventsPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-rule"));
    await waitFor(() => {
      expect(screen.getByText("Targets for: my-rule")).toBeTruthy();
    });
    expect(screen.getByText("fn-target")).toBeTruthy();
  });

  it("shows loading state for targets", async () => {
    const user = userEvent.setup();
    mockEventTargets.mockReturnValue({ data: undefined, isLoading: true });
    render(<EventsPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-rule"));
    await waitFor(() => {
      expect(screen.getByText("Targets for: my-rule")).toBeTruthy();
    });
    expect(screen.getByText("Loading targets...")).toBeTruthy();
  });

  it("adds a target to a rule", async () => {
    const user = userEvent.setup();
    mockEventTargets.mockReturnValue({ data: { targets: [] }, isLoading: false });
    render(<EventsPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("my-rule"));
    await waitFor(() => {
      expect(screen.getByText("Targets for: my-rule")).toBeTruthy();
    });
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "test-target");
    await user.type(inputs[1], "arn:aws:lambda:us-east-1:000000000000:function:test");
    await clickButton(user, /Add target/i);
    expect(mockPutTargetsMutate).toHaveBeenCalled();
  });

  // ─── Buses Tab ──────────────────────────────────────────

  it("shows empty buses state", async () => {
    const user = userEvent.setup();
    mockEventBuses.mockReturnValue({ data: { eventBuses: [] }, isLoading: false });
    render(<EventsPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Event Buses"));
    expect(screen.getByText("No event buses")).toBeTruthy();
  });

  it("creates a new event bus", async () => {
    const user = userEvent.setup();
    render(<EventsPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Event Buses"));
    await clickButton(user, /Create bus/i);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("my-bus")).toBeTruthy();
    });
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "my-new-bus");
    await clickButton(user, /Create/i, { last: true });
    expect(mockCreateBusMutate).toHaveBeenCalled();
  });

  it("deletes a non-default event bus", async () => {
    const user = userEvent.setup();
    mockEventBuses.mockReturnValue({
      data: {
        eventBuses: [
          { Name: "default", Arn: "arn:aws:..." },
          { Name: "custom-bus", Arn: "arn:aws:events:...:custom-bus" },
        ],
      },
      isLoading: false,
    });
    render(<EventsPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Event Buses"));
    const deleteButtons = screen.getAllByLabelText("Delete bus");
    await user.click(deleteButtons[0]);
    await waitFor(() => {
      expect(mockDeleteBusMutate).toHaveBeenCalled();
    });
  });

  // ─── Archives Tab ───────────────────────────────────────

  it("shows empty archives state", async () => {
    const user = userEvent.setup();
    mockEventArchives.mockReturnValue({ data: { archives: [] }, isLoading: false });
    render(<EventsPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Archives"));
    expect(screen.getByText("No archives")).toBeTruthy();
  });

  it("renders archive list with data", async () => {
    const user = userEvent.setup();
    mockEventArchives.mockReturnValue({
      data: {
        archives: [
          {
            ArchiveName: "my-archive",
            EventSourceArn: "arn:aws:events:us-east-1:000000000000:event-bus/default",
            State: "ENABLED",
            EventCount: 42,
          },
        ],
      },
      isLoading: false,
    });
    render(<EventsPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Archives"));
    expect(screen.getByText("my-archive")).toBeTruthy();
    expect(screen.getByText("42")).toBeTruthy();
  });

  it("creates a new archive", async () => {
    const user = userEvent.setup();
    render(<EventsPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Archives"));
    await clickButton(user, /Create archive/i);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("my-archive")).toBeTruthy();
    });
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "test-archive");
    await user.type(inputs[1], "arn:aws:events:us-east-1:000000000000:event-bus/default");
    await clickButton(user, /Create/i, { last: true });
    expect(mockCreateArchiveMutate).toHaveBeenCalled();
  });

  // ─── Send Event Tab ─────────────────────────────────────

  it("opens send event modal", async () => {
    const user = userEvent.setup();
    render(<EventsPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Send Event"));
    await clickButton(user, /Send event/i);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("my.app")).toBeTruthy();
    });
    expect(screen.getAllByText("Send event").length).toBeGreaterThan(0);
  });

  it("submits send event form", async () => {
    const user = userEvent.setup();
    render(<EventsPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Send Event"));
    await clickButton(user, /Send event/i);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("my.app")).toBeTruthy();
    });
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "test.app");
    await user.type(inputs[1], "TestEvent");
    await clickButton(user, /Send/i, { last: true });
    expect(mockPutEventsMutate).toHaveBeenCalled();
  });
});
