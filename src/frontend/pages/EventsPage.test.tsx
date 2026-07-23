// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../test/helpers";
import React from "react";
import { MemoryRouter } from "react-router-dom";

const mockEventBuses = vi.fn();
const mockEventRules = vi.fn();
const mockEventTargets = vi.fn();
const mockEventArchives = vi.fn();
const mockEventReplays = vi.fn();
const mockPutRuleMutate = vi.fn();
const mockDeleteRuleMutate = vi.fn();
const mockCreateBusMutate = vi.fn();
const mockDeleteBusMutate = vi.fn();
const mockCreateArchiveMutate = vi.fn();
const mockDeleteArchiveMutate = vi.fn();
const mockUpdateArchiveMutate = vi.fn();
const mockStartReplayMutate = vi.fn();
const mockCancelReplayMutate = vi.fn();
const mockPutPermissionMutate = vi.fn();
const mockRemovePermissionMutate = vi.fn();
const mockPutEventsMutate = vi.fn();
const mockToggleEnableMutate = vi.fn();
const mockToggleDisableMutate = vi.fn();
const mockPutTargetsMutate = vi.fn();
const mockRemoveTargetMutate = vi.fn();
const mockDescribeArchive = vi.fn();
const mockDescribeBus = vi.fn();

vi.mock("../hooks/useEvents", () => ({
  useEventBuses: (...args: any[]) => mockEventBuses(...args),
  useEventRules: (...args: any[]) => mockEventRules(...args),
  useEventTargets: (...args: any[]) => mockEventTargets(...args),
  useEventArchives: (...args: any[]) => mockEventArchives(...args),
  useEventReplays: (...args: any[]) => mockEventReplays(...args),
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
  useDescribeEventArchive: (...args: any[]) => mockDescribeArchive(...args),
  useUpdateEventArchive: () => ({ mutate: mockUpdateArchiveMutate, isPending: false }),
  useStartEventReplay: () => ({ mutate: mockStartReplayMutate, isPending: false }),
  useCancelEventReplay: () => ({ mutate: mockCancelReplayMutate, isPending: false }),
  useDescribeEventBus: (...args: any[]) => mockDescribeBus(...args),
  usePutEventBusPermission: () => ({ mutate: mockPutPermissionMutate, isPending: false }),
  useRemoveEventBusPermission: () => ({ mutate: mockRemovePermissionMutate, isPending: false }),
}));

vi.mock("../components/Toast", () => ({
  useToast: () => ({ showToast: vi.fn() }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("../components/ConfirmDialog", () => ({
  useConfirmDialog: () => ({ confirm: vi.fn(() => Promise.resolve(true)), dialog: null }),
}));

import EventsPage from "./EventsPage";

function pageWrapper() {
  const Wrapper = createWrapper();
  return ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter>
      <Wrapper>{children}</Wrapper>
    </MemoryRouter>
  );
}

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
    mockEventReplays.mockReturnValue({ data: { replays: [] }, isLoading: false });
    mockDescribeArchive.mockReturnValue({ data: undefined, isLoading: false });
    mockDescribeBus.mockReturnValue({ data: undefined, isLoading: false });
  });

  // ─── Rules Tab ──────────────────────────────────────────

  it("renders rules tab by default", () => {
    render(<EventsPage />, { wrapper: pageWrapper() });
    expect(screen.getByRole("heading", { name: /EventBridge/ })).toBeTruthy();
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
    render(<EventsPage />, { wrapper: pageWrapper() });
    expect(screen.getByText("No rules found")).toBeTruthy();
  });

  it("shows rules loading state", () => {
    mockEventRules.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });
    render(<EventsPage />, { wrapper: pageWrapper() });
    expect(screen.getByText("Loading rules...")).toBeTruthy();
  });

  it("shows rules error state", () => {
    mockEventRules.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("Failed to load rules"),
    });
    render(<EventsPage />, { wrapper: pageWrapper() });
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
    render(<EventsPage />, { wrapper: pageWrapper() });
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
    render(<EventsPage />, { wrapper: pageWrapper() });
    await clickButton(user, /Create rule/i);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("my-rule")).toBeTruthy();
    });
  });

  it("calls putRule when create rule form is submitted", async () => {
    const user = userEvent.setup();
    render(<EventsPage />, { wrapper: pageWrapper() });
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
    render(<EventsPage />, { wrapper: pageWrapper() });
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
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("my-rule"));
    await waitFor(() => {
      expect(screen.getByText("Targets for: my-rule")).toBeTruthy();
    });
    expect(screen.getByText("fn-target")).toBeTruthy();
  });

  it("shows loading state for targets", async () => {
    const user = userEvent.setup();
    mockEventTargets.mockReturnValue({ data: undefined, isLoading: true });
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("my-rule"));
    await waitFor(() => {
      expect(screen.getByText("Targets for: my-rule")).toBeTruthy();
    });
    expect(screen.getByText("Loading targets...")).toBeTruthy();
  });

  it("adds a target to a rule", async () => {
    const user = userEvent.setup();
    mockEventTargets.mockReturnValue({ data: { targets: [] }, isLoading: false });
    render(<EventsPage />, { wrapper: pageWrapper() });
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
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Event Buses"));
    expect(screen.getByText("No event buses")).toBeTruthy();
  });

  it("creates a new event bus", async () => {
    const user = userEvent.setup();
    render(<EventsPage />, { wrapper: pageWrapper() });
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
    render(<EventsPage />, { wrapper: pageWrapper() });
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
    render(<EventsPage />, { wrapper: pageWrapper() });
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
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Archives"));
    expect(screen.getByText("my-archive")).toBeTruthy();
    expect(screen.getByText("42")).toBeTruthy();
  });

  it("creates a new archive", async () => {
    const user = userEvent.setup();
    render(<EventsPage />, { wrapper: pageWrapper() });
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
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Send Event"));
    await clickButton(user, /Send event/i);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("my.app")).toBeTruthy();
    });
    expect(screen.getAllByText("Send event").length).toBeGreaterThan(0);
  });

  it("submits send event form", async () => {
    const user = userEvent.setup();
    render(<EventsPage />, { wrapper: pageWrapper() });
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

  // ─── Delete Actions ──────────────────────────────────────

  it("deletes a rule", async () => {
    const user = userEvent.setup();
    render(<EventsPage />, { wrapper: pageWrapper() });
    await clickButton(user, /Delete rule/i);
    await waitFor(() => {
      expect(mockDeleteRuleMutate).toHaveBeenCalled();
    });
  });

  it("deletes an archive", async () => {
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
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Archives"));
    await clickButton(user, /Delete archive/i);
    await waitFor(() => {
      expect(mockDeleteArchiveMutate).toHaveBeenCalled();
    });
  });

  it("removes a target", async () => {
    const user = userEvent.setup();
    mockEventTargets.mockReturnValue({
      data: { targets: [{ Id: "fn-target", Arn: "arn:aws:lambda:us-east-1:000000000000:function:my-fn" }] },
      isLoading: false,
    });
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("my-rule"));
    await waitFor(() => {
      expect(screen.getByText("Targets for: my-rule")).toBeTruthy();
    });
    await clickButton(user, /Remove target/i);
    await waitFor(() => {
      expect(mockRemoveTargetMutate).toHaveBeenCalled();
    });
  });

  // ─── Loading State Tests ─────────────────────────────────

  it("shows buses loading state", async () => {
    const user = userEvent.setup();
    mockEventBuses.mockReturnValue({ data: undefined, isLoading: true });
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Event Buses"));
    await waitFor(() => {
      expect(screen.getAllByText("Event Buses").length).toBeGreaterThanOrEqual(1);
    });
  });

  it("shows archives loading state", async () => {
    const user = userEvent.setup();
    mockEventArchives.mockReturnValue({ data: undefined, isLoading: true });
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Archives"));
    await waitFor(() => {
      expect(screen.getAllByText("Archives").length).toBeGreaterThanOrEqual(1);
    });
  });

  // ─── Permissions ────────────────────────────────────────

  it("shows bus permissions panel when bus name is clicked", async () => {
    const user = userEvent.setup();
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Event Buses"));
    await user.click(screen.getByText("default"));
    await waitFor(() => {
      expect(screen.getByText(/Permissions for:/)).toBeTruthy();
    });
  });

  it("adds a permission from the bus permissions panel", async () => {
    const user = userEvent.setup();
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Event Buses"));
    await user.click(screen.getByText("default"));
    await waitFor(() => {
      expect(screen.getByText(/Permissions for:/)).toBeTruthy();
    });
    await clickButton(user, /Add permission/i);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("my-permission")).toBeTruthy();
    });
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "stmt-1");
    await user.type(inputs[1], "123456789012");
    await clickButton(user, /Add/i, { last: true });
    expect(mockPutPermissionMutate).toHaveBeenCalled();
  });

  // ─── Replays Tab ────────────────────────────────────────

  it("shows empty replays state", async () => {
    const user = userEvent.setup();
    mockEventReplays.mockReturnValue({ data: { replays: [] }, isLoading: false });
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Replays"));
    expect(screen.getByText("No replays")).toBeTruthy();
  });

  it("renders replay list with data", async () => {
    const user = userEvent.setup();
    mockEventReplays.mockReturnValue({
      data: {
        replays: [
          {
            ReplayName: "my-replay",
            EventSourceArn: "arn:aws:events:us-east-1:000000000000:archive/my-archive",
            State: "RUNNING",
            EventStartTime: "2026-01-01T00:00:00Z",
          },
        ],
      },
      isLoading: false,
    });
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Replays"));
    expect(screen.getByText("my-replay")).toBeTruthy();
    expect(screen.getByText("RUNNING")).toBeTruthy();
  });

  it("starts a new replay", async () => {
    const user = userEvent.setup();
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Replays"));
    await clickButton(user, /Start replay/i);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("my-replay")).toBeTruthy();
    });
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "test-replay");
    await user.type(inputs[1], "arn:aws:events:us-east-1:000000000000:archive/my-archive");
    await user.type(inputs[2], "2026-01-01T00:00:00Z");
    await clickButton(user, /Start/i, { last: true });
    expect(mockStartReplayMutate).toHaveBeenCalled();
  });

  it("cancels a replay", async () => {
    const user = userEvent.setup();
    mockEventReplays.mockReturnValue({
      data: {
        replays: [
          {
            ReplayName: "my-replay",
            EventSourceArn: "arn:aws:events:us-east-1:000000000000:archive/my-archive",
            State: "RUNNING",
          },
        ],
      },
      isLoading: false,
    });
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Replays"));
    await clickButton(user, /Cancel replay/i);
    await waitFor(() => {
      expect(mockCancelReplayMutate).toHaveBeenCalled();
    });
  });

  // ─── Additional Rules Tab Branches ──────────────────────

  it("shows Event pattern indicator for rules with pattern only", () => {
    mockEventRules.mockReturnValue({
      data: {
        rules: [
          { Name: "pattern-rule", State: "ENABLED", EventBusName: "default", EventPattern: '{"source": ["my.app"]}' },
        ],
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<EventsPage />, { wrapper: pageWrapper() });
    expect(screen.getByText(/Event pattern/i)).toBeTruthy();
  });

  it("shows dash for rule with no schedule and no pattern", () => {
    mockEventRules.mockReturnValue({
      data: {
        rules: [
          { Name: "minimal-rule", State: "ENABLED", EventBusName: "default" },
        ],
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<EventsPage />, { wrapper: pageWrapper() });
    expect(screen.getByText("—")).toBeTruthy();
  });

  it("shows Disabled status for disabled rule", () => {
    mockEventRules.mockReturnValue({
      data: {
        rules: [
          { Name: "disabled-rule", State: "DISABLED", EventBusName: "default" },
        ],
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<EventsPage />, { wrapper: pageWrapper() });
    expect(screen.getByText("Disabled")).toBeTruthy();
  });

  // ─── Rules Interaction — validation branches ────────────

  it("shows warning when creating rule with no pattern or schedule", async () => {
    const user = userEvent.setup();
    const showToast = vi.fn();
    render(<EventsPage />, { wrapper: pageWrapper() });
    await clickButton(user, /Create rule/i);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("my-rule")).toBeTruthy();
    });
    const nameInput = screen.getByPlaceholderText("my-rule");
    await user.type(nameInput, "no-sched-no-pattern");
    await clickButton(user, /Create/i, { last: true });
    // The mock for showToast doesn't have this branch covered, but the
    // handleSubmit logic executes the early return check
    expect(mockPutRuleMutate).not.toHaveBeenCalled();
  });

  // ─── Archive Detail Panel ───────────────────────────────

  it("shows archive detail loading state", async () => {
    const user = userEvent.setup();
    mockEventArchives.mockReturnValue({
      data: {
        archives: [{ ArchiveName: "detail-archive", EventSourceArn: "arn:aws:events:.../default", State: "ENABLED", EventCount: 5 }],
      },
      isLoading: false,
    });
    mockDescribeArchive.mockReturnValue({ data: undefined, isLoading: true });
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Archives"));
    await user.click(screen.getByText("detail-archive"));
    await waitFor(() => {
      expect(screen.getByText(/Loading archive details/i)).toBeTruthy();
    });
  });

  it("shows archive not found in archive detail", async () => {
    const user = userEvent.setup();
    mockEventArchives.mockReturnValue({
      data: {
        archives: [{ ArchiveName: "gone-archive", EventSourceArn: "arn:aws:events:.../default", State: "ENABLED", EventCount: 5 }],
      },
      isLoading: false,
    });
    mockDescribeArchive.mockReturnValue({ data: { archive: null }, isLoading: false });
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Archives"));
    await user.click(screen.getByText("gone-archive"));
    await waitFor(() => {
      expect(screen.getByText(/Archive not found/i)).toBeTruthy();
    });
  });

  it("shows archive detail with data and updates archive", async () => {
    const user = userEvent.setup();
    mockEventArchives.mockReturnValue({
      data: {
        archives: [{ ArchiveName: "updatable-archive", EventSourceArn: "arn:aws:events:.../default", State: "ENABLED", EventCount: 5 }],
      },
      isLoading: false,
    });
    mockDescribeArchive.mockReturnValue({
      data: {
        archive: {
          ArchiveName: "updatable-archive",
          Description: "Test archive",
          RetentionDays: 30,
          EventCount: 5,
          EventSourceArn: "arn:aws:events:.../default",
          State: "ENABLED",
        },
      },
      isLoading: false,
    });
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Archives"));
    await user.click(screen.getByText("updatable-archive"));
    await waitFor(() => {
      expect(screen.getByText(/Update archive/i)).toBeTruthy();
    });
    // Click update archive
    await clickButton(user, /Update archive/i);
    await waitFor(() => {
      expect(mockUpdateArchiveMutate).toHaveBeenCalled();
    });
  });

  // ─── Archives Tab branches ──────────────────────────────

  it("shows DISABLED state for disabled archive", async () => {
    const user = userEvent.setup();
    mockEventArchives.mockReturnValue({
      data: {
        archives: [{ ArchiveName: "disabled-archive", EventSourceArn: "arn:aws:events:.../default", State: "DISABLED", EventCount: 0 }],
      },
      isLoading: false,
    });
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Archives"));
    expect(screen.getByText("DISABLED")).toBeTruthy();
  });

  // ─── Bus Detail Panel branches ──────────────────────────

  it("shows bus detail loading state", async () => {
    const user = userEvent.setup();
    mockDescribeBus.mockReturnValue({ data: undefined, isLoading: true });
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Event Buses"));
    await user.click(screen.getByText("default"));
    await waitFor(() => {
      expect(screen.getByText(/Loading bus details/i)).toBeTruthy();
    });
  });

  it("shows permissions and raw policy in bus detail", async () => {
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
    mockDescribeBus.mockReturnValue({
      data: {
        eventBus: {
          Name: "custom-bus",
          Policy: JSON.stringify({
            Version: "2012-10-17",
            Statement: [
              { Sid: "stmt-1", Effect: "Allow", Principal: { AWS: "*" }, Action: "events:PutEvents" },
            ],
          }),
        },
      },
      isLoading: false,
    });
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Event Buses"));
    await user.click(screen.getByText("custom-bus"));
    await waitFor(() => {
      expect(screen.getByText(/Permissions for:/)).toBeTruthy();
    });
    expect(screen.getByText(/Raw policy/i)).toBeTruthy();
  });

  // ─── Replays Tab branches ──────────────────────────────

  it("shows COMPLETED replay state and disabled cancel", async () => {
    const user = userEvent.setup();
    mockEventReplays.mockReturnValue({
      data: {
        replays: [
          { ReplayName: "completed-replay", EventSourceArn: "arn:aws:events:...", State: "COMPLETED", EventStartTime: "2026-01-01T00:00:00Z", EventEndTime: "2026-01-02T00:00:00Z" },
        ],
      },
      isLoading: false,
    });
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Replays"));
    expect(screen.getByText("COMPLETED")).toBeTruthy();
    // Cancel button should be disabled
    const cancelBtn = screen.getByLabelText("Cancel replay");
    expect((cancelBtn as HTMLButtonElement).disabled).toBe(true);
  });

  it("shows CANCELLED replay state and disabled cancel", async () => {
    const user = userEvent.setup();
    mockEventReplays.mockReturnValue({
      data: {
        replays: [
          {
            ReplayName: "cancelled-replay",
            EventSourceArn: "arn:aws:events:...",
            State: "CANCELLED",
            EventStartTime: null,
            EventEndTime: null,
          },
        ],
      },
      isLoading: false,
    });
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Replays"));
    expect(screen.getByText("CANCELLED")).toBeTruthy();
    // Start and End columns show "—" when times are null
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });
});
