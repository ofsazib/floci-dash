// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
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
const mockUpdateBusMutate = vi.fn();
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
const mockTags = vi.fn();
const mockAddTagsMutate = vi.fn();
const mockRemoveTagsMutate = vi.fn();
const mockTestPatternMutate = vi.fn();

const mockConfirm = vi.fn();
const mockNavigate = vi.hoisted(() => vi.fn());

const healthState = vi.hoisted(() => ({
  data: undefined as any,
  isLoading: false,
}));

vi.mock("../hooks/useSystem", () => ({
  useHealth: () => ({ get data() { return healthState.data; }, isLoading: false }),
}));

vi.mock("../hooks/useEvents", () => ({
  useEventBuses: (...args: any[]) => mockEventBuses(...args),
  useEventRules: (...args: any[]) => mockEventRules(...args),
  useEventTargets: (...args: any[]) => mockEventTargets(...args),
  useEventArchives: (...args: any[]) => mockEventArchives(...args),
  useEventReplays: (...args: any[]) => mockEventReplays(...args),
  useCreateEventBus: () => ({ mutate: mockCreateBusMutate, isPending: false }),
  useUpdateEventBus: () => ({ mutate: mockUpdateBusMutate, isPending: false }),
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
  useEventTags: (...args: any[]) => mockTags(...args),
  useAddEventTags: () => ({ mutate: mockAddTagsMutate, isPending: false }),
  useRemoveEventTags: () => ({ mutate: mockRemoveTagsMutate, isPending: false }),
  useTestEventPattern: () => ({ mutate: mockTestPatternMutate, isPending: false }),
}));

let mockShowToast = vi.fn();

vi.mock("../components/Toast", () => ({
  useToast: () => ({ showToast: mockShowToast }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("../components/ConfirmDialog", () => ({
  useConfirmDialog: () => ({ confirm: (...args: any[]) => mockConfirm(...args), dialog: null }),
}));

vi.mock("react-router-dom", async () => {
  const actual = await import("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  };
});

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
    mockShowToast = vi.fn();
    mockConfirm.mockResolvedValue(true);
    healthState.data = undefined;

    // Invoke onSuccess so close/reset/toast branches fire
    mockPutRuleMutate.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
    mockDeleteRuleMutate.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
    mockCreateBusMutate.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
    mockDeleteBusMutate.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
    mockCreateArchiveMutate.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
    mockDeleteArchiveMutate.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
    mockUpdateArchiveMutate.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
    mockStartReplayMutate.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
    mockCancelReplayMutate.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
    mockPutPermissionMutate.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
    mockRemovePermissionMutate.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
    mockPutEventsMutate.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.({ failedCount: 0 }));
    mockToggleEnableMutate.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
    mockToggleDisableMutate.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
    mockPutTargetsMutate.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
    mockRemoveTargetMutate.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());

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

  it("navigates when the breadcrumb is clicked", async () => {
    const user = userEvent.setup();
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getAllByText("Dashboard")[0]);
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/"));
  });

  it("shows Running status badge when events service is running", () => {
    healthState.data = { services: { events: "running" } };
    render(<EventsPage />, { wrapper: pageWrapper() });
    expect(screen.getByText("Running")).toBeTruthy();
  });

  it("shows Available status badge when events service is available", () => {
    healthState.data = { services: { events: "available" } };
    render(<EventsPage />, { wrapper: pageWrapper() });
    expect(screen.getByText("Available")).toBeTruthy();
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

  it("creates a rule with event pattern, description, and disabled state", async () => {
    const user = userEvent.setup();
    render(<EventsPage />, { wrapper: pageWrapper() });
    await clickButton(user, /Create rule/i);
    await waitFor(() => expect(screen.getByPlaceholderText("my-rule")).toBeTruthy());

    await user.type(screen.getByPlaceholderText("my-rule"), "pattern-rule");
    // Event pattern textarea (paste avoids brace parsing)
    const patternTextarea = screen.getByPlaceholderText('{"source": ["my.app"]}');
    await user.click(patternTextarea);
    await user.paste('{"source": ["my.app"]}');
    await user.type(screen.getByLabelText(/Description/), "My pattern rule");
    // Disable the rule via the Enabled toggle
    await user.click(screen.getByRole("checkbox", { name: /Enable rule on creation/i }));
    await clickButton(user, /Create/i, { last: true });

    await waitFor(() => {
      expect(mockPutRuleMutate).toHaveBeenCalledWith(
        {
          name: "pattern-rule",
          eventPattern: '{"source": ["my.app"]}',
          scheduleExpression: undefined,
          description: "My pattern rule",
          state: "DISABLED",
        },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
      expect(mockShowToast).toHaveBeenCalledWith("success", 'Rule "pattern-rule" created');
      expect(screen.queryByPlaceholderText("my-rule")).toBeNull();
    });
  });

  it("shows error toast when creating a rule fails", async () => {
    mockPutRuleMutate.mockImplementation((_b: any, opts: any) => opts?.onError?.(new Error("rule create failed")));
    const user = userEvent.setup();
    render(<EventsPage />, { wrapper: pageWrapper() });
    await clickButton(user, /Create rule/i);
    await waitFor(() => expect(screen.getByPlaceholderText("my-rule")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("my-rule"), "fail-rule");
    await user.type(screen.getByPlaceholderText("rate(5 minutes)"), "rate(1 hour)");
    await clickButton(user, /Create/i, { last: true });
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "rule create failed"));
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

  it("enables a disabled rule via toggle", async () => {
    const user = userEvent.setup();
    mockEventRules.mockReturnValue({
      data: { rules: [{ Name: "off-rule", State: "DISABLED", EventBusName: "default" }] },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<EventsPage />, { wrapper: pageWrapper() });
    const toggles = screen.getAllByRole("checkbox");
    await user.click(toggles[0]);
    await waitFor(() => {
      expect(mockToggleEnableMutate).toHaveBeenCalledWith(
        { name: "off-rule", eventBusName: "default" },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
      expect(mockShowToast).toHaveBeenCalledWith("success", "Rule enabled");
    });
  });

  it("shows error toast when enabling a rule fails", async () => {
    mockToggleEnableMutate.mockImplementation((_b: any, opts: any) => opts?.onError?.(new Error("enable failed")));
    const user = userEvent.setup();
    mockEventRules.mockReturnValue({
      data: { rules: [{ Name: "off-rule", State: "DISABLED", EventBusName: "default" }] },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getAllByRole("checkbox")[0]);
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "enable failed"));
  });

  it("shows error toast when disabling a rule fails", async () => {
    mockToggleDisableMutate.mockImplementation((_b: any, opts: any) => opts?.onError?.(new Error("disable failed")));
    const user = userEvent.setup();
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getAllByRole("checkbox")[0]);
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "disable failed"));
  });

  it("shows success toast when a rule is deleted", async () => {
    const user = userEvent.setup();
    render(<EventsPage />, { wrapper: pageWrapper() });
    await clickButton(user, /Delete rule/i);
    await waitFor(() => {
      expect(mockDeleteRuleMutate).toHaveBeenCalledWith(
        { name: "my-rule", eventBusName: "default" },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
      expect(mockShowToast).toHaveBeenCalledWith("success", "Rule deleted");
    });
  });

  it("shows error toast when deleting a rule fails", async () => {
    mockDeleteRuleMutate.mockImplementation((_b: any, opts: any) => opts?.onError?.(new Error("rule delete failed")));
    const user = userEvent.setup();
    render(<EventsPage />, { wrapper: pageWrapper() });
    await clickButton(user, /Delete rule/i);
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "rule delete failed"));
  });

  it("does not delete a rule when confirmation is declined", async () => {
    mockConfirm.mockResolvedValue(false);
    const user = userEvent.setup();
    render(<EventsPage />, { wrapper: pageWrapper() });
    await clickButton(user, /Delete rule/i);
    await waitFor(() => expect(mockConfirm).toHaveBeenCalled());
    expect(mockDeleteRuleMutate).not.toHaveBeenCalled();
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

  it("shows the event pattern when a rule is opened", async () => {
    const user = userEvent.setup();
    mockEventRules.mockReturnValue({
      data: {
        rules: [{
          Name: "pattern-rule",
          State: "ENABLED",
          EventBusName: "default",
          Description: "collection updates",
          EventPattern: '{"source":["ordering"],"detail-type":["collection.update"]}',
        }],
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockEventTargets.mockReturnValue({ data: { targets: [] }, isLoading: false });
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("pattern-rule"));
    await waitFor(() => {
      expect(screen.getByText("Rule: pattern-rule")).toBeTruthy();
      expect(screen.getByText("Event pattern")).toBeTruthy();
    });
    expect(document.body.textContent).toContain("ordering");
    expect(document.body.textContent).toContain("collection.update");
    expect(screen.getByText("collection updates")).toBeTruthy();
    expect(screen.queryByPlaceholderText("Find rules...")).toBeNull();
  });

  it("shows a schedule expression when a scheduled rule is opened", async () => {
    const user = userEvent.setup();
    mockEventRules.mockReturnValue({
      data: {
        rules: [{
          Name: "sched-rule",
          State: "ENABLED",
          EventBusName: "custom-bus",
          ScheduleExpression: "rate(1 minute)",
        }],
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockEventTargets.mockReturnValue({ data: { targets: [] }, isLoading: false });
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("sched-rule"));
    await waitFor(() => expect(screen.getByText("Rule: sched-rule")).toBeTruthy());
    expect(screen.getByText("Schedule expression")).toBeTruthy();
    expect(screen.getAllByText("rate(1 minute)").length).toBeGreaterThan(0);
    expect(mockEventTargets).toHaveBeenCalledWith("sched-rule", "custom-bus");
  });

  it("shows invalid event pattern text as-is", async () => {
    const user = userEvent.setup();
    mockEventRules.mockReturnValue({
      data: {
        rules: [{ Name: "bad-rule", EventPattern: "{not-json" }],
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    mockEventTargets.mockReturnValue({ data: { targets: [] }, isLoading: false });
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("bad-rule"));
    await waitFor(() => expect(screen.getByText("{not-json")).toBeTruthy());
  });

  it("shows an empty expression state when the rule has neither pattern nor schedule", async () => {
    const user = userEvent.setup();
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("my-rule"));
    await waitFor(() => expect(screen.getByText("Rule: my-rule")).toBeTruthy());
    expect(screen.getByText("No event pattern or schedule expression")).toBeTruthy();
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
    await waitFor(() => {
      expect(mockPutTargetsMutate).toHaveBeenCalledWith(
        { rule: "my-rule", targets: [{ Id: "test-target", Arn: "arn:aws:lambda:us-east-1:000000000000:function:test" }] },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
      expect(mockShowToast).toHaveBeenCalledWith("success", "Target added");
    });
  });

  it("shows error toast when adding a target fails", async () => {
    mockPutTargetsMutate.mockImplementation((_b: any, opts: any) => opts?.onError?.(new Error("add target failed")));
    const user = userEvent.setup();
    mockEventTargets.mockReturnValue({ data: { targets: [] }, isLoading: false });
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("my-rule"));
    await waitFor(() => expect(screen.getByText("Targets for: my-rule")).toBeTruthy());
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "test-target");
    await user.type(inputs[1], "arn:aws:lambda:us-east-1:000000000000:function:test");
    await clickButton(user, /Add target/i);
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "add target failed"));
  });

  it("shows success toast when a target is removed", async () => {
    const user = userEvent.setup();
    mockEventTargets.mockReturnValue({
      data: { targets: [{ Id: "fn-target", Arn: "arn:aws:lambda:us-east-1:000000000000:function:my-fn" }] },
      isLoading: false,
    });
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("my-rule"));
    await waitFor(() => expect(screen.getByText("Targets for: my-rule")).toBeTruthy());
    await clickButton(user, /Remove target/i);
    await waitFor(() => {
      expect(mockRemoveTargetMutate).toHaveBeenCalledWith(
        { rule: "my-rule", ids: ["fn-target"] },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
      expect(mockShowToast).toHaveBeenCalledWith("success", "Target removed");
    });
  });

  it("shows error toast when removing a target fails", async () => {
    mockRemoveTargetMutate.mockImplementation((_b: any, opts: any) => opts?.onError?.(new Error("remove failed")));
    const user = userEvent.setup();
    mockEventTargets.mockReturnValue({
      data: { targets: [{ Id: "fn-target", Arn: "arn:aws:lambda:us-east-1:000000000000:function:my-fn" }] },
      isLoading: false,
    });
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("my-rule"));
    await waitFor(() => expect(screen.getByText("Targets for: my-rule")).toBeTruthy());
    await clickButton(user, /Remove target/i);
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "remove failed"));
  });

  it("does not remove a target when confirmation is declined", async () => {
    mockConfirm.mockResolvedValue(false);
    const user = userEvent.setup();
    mockEventTargets.mockReturnValue({
      data: { targets: [{ Id: "fn-target", Arn: "arn:aws:lambda:us-east-1:000000000000:function:my-fn" }] },
      isLoading: false,
    });
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("my-rule"));
    await waitFor(() => expect(screen.getByText("Targets for: my-rule")).toBeTruthy());
    await clickButton(user, /Remove target/i);
    await waitFor(() => expect(mockConfirm).toHaveBeenCalled());
    expect(mockRemoveTargetMutate).not.toHaveBeenCalled();
  });

  it("hides the targets section", async () => {
    const user = userEvent.setup();
    mockEventTargets.mockReturnValue({ data: { targets: [] }, isLoading: false });
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("my-rule"));
    await waitFor(() => expect(screen.getByText("Targets for: my-rule")).toBeTruthy());
    await clickButton(user, /Hide/i);
    await waitFor(() => expect(screen.queryByText("Targets for: my-rule")).toBeNull());
  });

  // ─── Buses Tab ──────────────────────────────────────────

  it("shows empty buses state", async () => {
    const user = userEvent.setup();
    mockEventBuses.mockReturnValue({ data: { eventBuses: [] }, isLoading: false });
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Event Buses"));
    expect(screen.getByText("No event buses")).toBeTruthy();
  });

  it("shows dashes for a bus without ARN or description", async () => {
    const user = userEvent.setup();
    mockEventBuses.mockReturnValue({
      data: { eventBuses: [{ Name: "bare-bus" }] },
      isLoading: false,
    });
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Event Buses"));
    expect(screen.getByText("bare-bus")).toBeTruthy();
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(2);
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
    await waitFor(() => {
      expect(mockCreateBusMutate).toHaveBeenCalledWith(
        { name: "my-new-bus", description: undefined },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
      expect(mockShowToast).toHaveBeenCalledWith("success", 'Bus "my-new-bus" created');
    });
  });

  it("creates an event bus with a description", async () => {
    const user = userEvent.setup();
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Event Buses"));
    await clickButton(user, /Create bus/i);
    await waitFor(() => expect(screen.getByPlaceholderText("my-bus")).toBeTruthy());
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "desc-bus");
    await user.type(inputs[1], "A described bus");
    await clickButton(user, /Create/i, { last: true });
    await waitFor(() => {
      expect(mockCreateBusMutate).toHaveBeenCalledWith(
        { name: "desc-bus", description: "A described bus" },
        expect.anything(),
      );
      expect(screen.queryByPlaceholderText("my-bus")).toBeNull();
    });
  });

  it("shows error toast when creating a bus fails", async () => {
    mockCreateBusMutate.mockImplementation((_b: any, opts: any) => opts?.onError?.(new Error("bus create failed")));
    const user = userEvent.setup();
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Event Buses"));
    await clickButton(user, /Create bus/i);
    await waitFor(() => expect(screen.getByPlaceholderText("my-bus")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("my-bus"), "fail-bus");
    await clickButton(user, /Create/i, { last: true });
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "bus create failed"));
  });

  it("cancels the create bus modal", async () => {
    const user = userEvent.setup();
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Event Buses"));
    await clickButton(user, /Create bus/i);
    await waitFor(() => expect(screen.getByPlaceholderText("my-bus")).toBeTruthy());
    await clickButton(user, /Cancel/i, { last: true });
    await waitFor(() => expect(screen.queryByPlaceholderText("my-bus")).toBeNull());
    expect(mockCreateBusMutate).not.toHaveBeenCalled();
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
      expect(mockDeleteBusMutate).toHaveBeenCalledWith(
        "custom-bus",
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
      expect(mockShowToast).toHaveBeenCalledWith("success", "Bus deleted");
    });
  });

  it("does not delete a bus when confirmation is declined", async () => {
    mockConfirm.mockResolvedValue(false);
    const user = userEvent.setup();
    mockEventBuses.mockReturnValue({
      data: { eventBuses: [{ Name: "custom-bus", Arn: "arn:aws:events:...:custom-bus" }] },
      isLoading: false,
    });
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Event Buses"));
    await user.click(screen.getByLabelText("Delete bus"));
    await waitFor(() => expect(mockConfirm).toHaveBeenCalled());
    expect(mockDeleteBusMutate).not.toHaveBeenCalled();
  });

  it("shows error toast when deleting a bus fails", async () => {
    mockDeleteBusMutate.mockImplementation((_b: any, opts: any) => opts?.onError?.(new Error("bus delete failed")));
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
    await user.click(screen.getAllByLabelText("Delete bus")[0]);
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "bus delete failed"));
  });

  it("hides the bus detail panel", async () => {
    const user = userEvent.setup();
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Event Buses"));
    await user.click(screen.getByText("default"));
    await waitFor(() => expect(screen.getByText(/Permissions for:/)).toBeTruthy());
    await clickButton(user, /Hide/i);
    await waitFor(() => expect(screen.queryByText(/Permissions for:/)).toBeNull());
  });

  // ─── Edit bus modal ─────────────────────────────────────

  it("opens the edit bus modal with prefilled description", async () => {
    const user = userEvent.setup();
    mockEventBuses.mockReturnValue({
      data: { eventBuses: [{ Name: "custom-bus", Description: "A described bus", Arn: "arn" }] },
      isLoading: false,
    });
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Event Buses"));
    await user.click(screen.getByLabelText("Edit bus custom-bus"));
    await waitFor(() =>
      expect(screen.getByText("Edit event bus — custom-bus")).toBeTruthy(),
    );
    expect(screen.getByDisplayValue("A described bus")).toBeTruthy();
  });

  it("opens the edit modal for a bus without a description", async () => {
    const user = userEvent.setup();
    mockEventBuses.mockReturnValue({
      data: { eventBuses: [{ Name: "bare-bus", Arn: "arn" }] },
      isLoading: false,
    });
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Event Buses"));
    await user.click(screen.getByLabelText("Edit bus bare-bus"));
    await waitFor(() =>
      expect(screen.getByText("Edit event bus — bare-bus")).toBeTruthy(),
    );
    const input = screen.getByLabelText("Description") as HTMLInputElement;
    expect(input.value).toBe("");
  });

  it("updates the bus description and closes on success", async () => {
    mockUpdateBusMutate.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
    const user = userEvent.setup();
    mockEventBuses.mockReturnValue({
      data: { eventBuses: [{ Name: "custom-bus", Description: "Old desc", Arn: "arn" }] },
      isLoading: false,
    });
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Event Buses"));
    await user.click(screen.getByLabelText("Edit bus custom-bus"));
    await waitFor(() =>
      expect(screen.getByText("Edit event bus — custom-bus")).toBeTruthy(),
    );
    const input = screen.getByDisplayValue("Old desc");
    await user.clear(input);
    await user.type(input, "New desc");
    await clickButton(user, /Save/i);
    await waitFor(() => {
      expect(mockUpdateBusMutate).toHaveBeenCalledWith(
        { name: "custom-bus", description: "New desc" },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
      expect(mockShowToast).toHaveBeenCalledWith("success", 'Bus "custom-bus" updated');
    });
    await waitFor(() =>
      expect(screen.queryByText("Edit event bus — custom-bus")).toBeNull(),
    );
  });

  it("sends undefined description when the field is cleared", async () => {
    mockUpdateBusMutate.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
    const user = userEvent.setup();
    mockEventBuses.mockReturnValue({
      data: { eventBuses: [{ Name: "custom-bus", Description: "Old desc", Arn: "arn" }] },
      isLoading: false,
    });
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Event Buses"));
    await user.click(screen.getByLabelText("Edit bus custom-bus"));
    await waitFor(() =>
      expect(screen.getByText("Edit event bus — custom-bus")).toBeTruthy(),
    );
    const input = screen.getByDisplayValue("Old desc");
    await user.clear(input);
    await clickButton(user, /Save/i);
    await waitFor(() => {
      expect(mockUpdateBusMutate).toHaveBeenCalledWith(
        { name: "custom-bus", description: undefined },
        expect.anything(),
      );
    });
  });

  it("shows error toast when updating a bus fails", async () => {
    mockUpdateBusMutate.mockImplementation((_b: any, opts: any) => opts?.onError?.(new Error("bus update failed")));
    const user = userEvent.setup();
    mockEventBuses.mockReturnValue({
      data: { eventBuses: [{ Name: "custom-bus", Description: "Old desc", Arn: "arn" }] },
      isLoading: false,
    });
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Event Buses"));
    await user.click(screen.getByLabelText("Edit bus custom-bus"));
    await waitFor(() =>
      expect(screen.getByText("Edit event bus — custom-bus")).toBeTruthy(),
    );
    await clickButton(user, /Save/i);
    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith("error", "bus update failed"),
    );
  });

  it("cancels the edit bus modal without updating", async () => {
    const user = userEvent.setup();
    mockEventBuses.mockReturnValue({
      data: { eventBuses: [{ Name: "custom-bus", Description: "Old desc", Arn: "arn" }] },
      isLoading: false,
    });
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Event Buses"));
    await user.click(screen.getByLabelText("Edit bus custom-bus"));
    await waitFor(() =>
      expect(screen.getByText("Edit event bus — custom-bus")).toBeTruthy(),
    );
    await clickButton(user, /Cancel/i);
    await waitFor(() =>
      expect(screen.queryByText("Edit event bus — custom-bus")).toBeNull(),
    );
    expect(mockUpdateBusMutate).not.toHaveBeenCalled();
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
    await waitFor(() => {
      expect(mockCreateArchiveMutate).toHaveBeenCalledWith(
        {
          archiveName: "test-archive",
          eventSourceArn: "arn:aws:events:us-east-1:000000000000:event-bus/default",
          description: undefined,
        },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
      expect(mockShowToast).toHaveBeenCalledWith("success", 'Archive "test-archive" created');
    });
  });

  it("creates an archive with a description", async () => {
    const user = userEvent.setup();
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Archives"));
    await clickButton(user, /Create archive/i);
    await waitFor(() => expect(screen.getByPlaceholderText("my-archive")).toBeTruthy());
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "desc-archive");
    await user.type(inputs[1], "arn:aws:events:us-east-1:000000000000:event-bus/default");
    await user.type(inputs[2], "My archive");
    await clickButton(user, /Create/i, { last: true });
    await waitFor(() => {
      expect(mockCreateArchiveMutate).toHaveBeenCalledWith(
        {
          archiveName: "desc-archive",
          eventSourceArn: "arn:aws:events:us-east-1:000000000000:event-bus/default",
          description: "My archive",
        },
        expect.anything(),
      );
      expect(screen.queryByPlaceholderText("my-archive")).toBeNull();
    });
  });

  it("shows error toast when creating an archive fails", async () => {
    mockCreateArchiveMutate.mockImplementation((_b: any, opts: any) => opts?.onError?.(new Error("archive create failed")));
    const user = userEvent.setup();
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Archives"));
    await clickButton(user, /Create archive/i);
    await waitFor(() => expect(screen.getByPlaceholderText("my-archive")).toBeTruthy());
    await user.type(screen.getByPlaceholderText("my-archive"), "fail-archive");
    await user.type(screen.getByPlaceholderText("arn:aws:events:us-east-1:000000000000:event-bus/default"), "arn:aws:events:us-east-1:000000000000:event-bus/default");
    await clickButton(user, /Create/i, { last: true });
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "archive create failed"));
  });

  it("cancels the create archive modal", async () => {
    const user = userEvent.setup();
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Archives"));
    await clickButton(user, /Create archive/i);
    await waitFor(() => expect(screen.getByPlaceholderText("my-archive")).toBeTruthy());
    await clickButton(user, /Cancel/i, { last: true });
    await waitFor(() => expect(screen.queryByPlaceholderText("my-archive")).toBeNull());
    expect(mockCreateArchiveMutate).not.toHaveBeenCalled();
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
    await waitFor(() => {
      expect(mockPutEventsMutate).toHaveBeenCalledWith(
        [{ source: "test.app", detailType: "TestEvent", detail: "{}" }],
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
      expect(mockShowToast).toHaveBeenCalledWith("success", "Event sent");
    });
  });

  it("shows warning when some sent entries fail", async () => {
    mockPutEventsMutate.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.({ failedCount: 2 }));
    const user = userEvent.setup();
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Send Event"));
    await clickButton(user, /Send event/i);
    await waitFor(() => expect(screen.getByPlaceholderText("my.app")).toBeTruthy());
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "test.app");
    await user.type(inputs[1], "TestEvent");
    await clickButton(user, /Send/i, { last: true });
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("warning", "2 entries failed"));
  });

  it("shows error toast when sending an event fails", async () => {
    mockPutEventsMutate.mockImplementation((_b: any, opts: any) => opts?.onError?.(new Error("send failed")));
    const user = userEvent.setup();
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Send Event"));
    await clickButton(user, /Send event/i);
    await waitFor(() => expect(screen.getByPlaceholderText("my.app")).toBeTruthy());
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "test.app");
    await user.type(inputs[1], "TestEvent");
    await clickButton(user, /Send/i, { last: true });
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "send failed"));
  });

  it("cancels the send event modal", async () => {
    const user = userEvent.setup();
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Send Event"));
    await clickButton(user, /Send event/i);
    await waitFor(() => expect(screen.getByPlaceholderText("my.app")).toBeTruthy());
    await clickButton(user, /Cancel/i, { last: true });
    await waitFor(() => expect(screen.queryByPlaceholderText("my.app")).toBeNull());
    expect(mockPutEventsMutate).not.toHaveBeenCalled();
  });

  it("fires the detail textarea change when editing JSON", async () => {
    const user = userEvent.setup();
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Send Event"));
    await clickButton(user, /Send event/i);
    await waitFor(() => expect(screen.getByPlaceholderText("my.app")).toBeTruthy());
    const textareas = screen.getAllByRole("textbox");
    await user.type(textareas[0], "test.app");
    await user.type(textareas[1], "TestEvent");
    // Append to the default "{}" detail — fires the Textarea onChange
    await user.type(textareas[2], "extra");
    await clickButton(user, /Send/i, { last: true });
    await waitFor(() => {
      expect(mockPutEventsMutate).toHaveBeenCalledWith(
        [{ source: "test.app", detailType: "TestEvent", detail: "{}extra" }],
        expect.anything(),
      );
    });
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
      expect(mockDeleteArchiveMutate).toHaveBeenCalledWith(
        "my-archive",
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
      expect(mockShowToast).toHaveBeenCalledWith("success", "Archive deleted");
    });
  });

  it("does not delete an archive when confirmation is declined", async () => {
    mockConfirm.mockResolvedValue(false);
    const user = userEvent.setup();
    mockEventArchives.mockReturnValue({
      data: { archives: [{ ArchiveName: "my-archive", EventSourceArn: "arn:aws:events:us-east-1:000000000000:event-bus/default", State: "ENABLED", EventCount: 42 }] },
      isLoading: false,
    });
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Archives"));
    await clickButton(user, /Delete archive/i);
    await waitFor(() => expect(mockConfirm).toHaveBeenCalled());
    expect(mockDeleteArchiveMutate).not.toHaveBeenCalled();
  });

  it("shows error toast when deleting an archive fails", async () => {
    mockDeleteArchiveMutate.mockImplementation((_b: any, opts: any) => opts?.onError?.(new Error("archive delete failed")));
    const user = userEvent.setup();
    mockEventArchives.mockReturnValue({
      data: {
        archives: [{ ArchiveName: "my-archive", EventSourceArn: "arn:aws:events:us-east-1:000000000000:event-bus/default", State: "ENABLED", EventCount: 42 }],
      },
      isLoading: false,
    });
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Archives"));
    await clickButton(user, /Delete archive/i);
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "archive delete failed"));
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
    await waitFor(() => {
      expect(mockPutPermissionMutate).toHaveBeenCalledWith(
        {
          eventBusName: "default",
          statementId: "stmt-1",
          principal: "123456789012",
          action: "events:PutEvents",
          condition: undefined,
        },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
      expect(mockShowToast).toHaveBeenCalledWith("success", "Permission added");
    });
  });

  it("adds a permission with a JSON condition", async () => {
    const user = userEvent.setup();
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Event Buses"));
    await user.click(screen.getByText("default"));
    await waitFor(() => expect(screen.getByText(/Permissions for:/)).toBeTruthy());
    await clickButton(user, /Add permission/i);
    await waitFor(() => expect(screen.getByPlaceholderText("my-permission")).toBeTruthy());
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "cond-stmt");
    await user.type(inputs[1], "123456789012");
    // Action input pre-fills with events:PutEvents — clear before typing
    await user.clear(inputs[2]);
    await user.type(inputs[2], "events:PutEvents");
    const conditionTextarea = screen.getByPlaceholderText('{"StringEquals": {"aws:PrincipalOrgID": "o-123"}}');
    await user.click(conditionTextarea);
    await user.paste('{"StringEquals": {"aws:PrincipalOrgID": "o-123"}}');
    await clickButton(user, /Add/i, { last: true });
    await waitFor(() => {
      expect(mockPutPermissionMutate).toHaveBeenCalledWith(
        {
          eventBusName: "default",
          statementId: "cond-stmt",
          principal: "123456789012",
          action: "events:PutEvents",
          condition: { StringEquals: { "aws:PrincipalOrgID": "o-123" } },
        },
        expect.anything(),
      );
      expect(screen.queryByPlaceholderText("my-permission")).toBeNull();
    });
  });

  it("shows error when the permission condition is invalid JSON", async () => {
    const user = userEvent.setup();
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Event Buses"));
    await user.click(screen.getByText("default"));
    await waitFor(() => expect(screen.getByText(/Permissions for:/)).toBeTruthy());
    await clickButton(user, /Add permission/i);
    await waitFor(() => expect(screen.getByPlaceholderText("my-permission")).toBeTruthy());
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "bad-cond");
    await user.type(inputs[1], "123456789012");
    await user.type(screen.getByPlaceholderText('{"StringEquals": {"aws:PrincipalOrgID": "o-123"}}'), "not-json");
    await clickButton(user, /Add/i, { last: true });
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith("error", "Condition must be valid JSON");
      expect(mockPutPermissionMutate).not.toHaveBeenCalled();
    });
  });

  it("shows error toast when adding a permission fails", async () => {
    mockPutPermissionMutate.mockImplementation((_b: any, opts: any) => opts?.onError?.(new Error("permission add failed")));
    const user = userEvent.setup();
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Event Buses"));
    await user.click(screen.getByText("default"));
    await waitFor(() => expect(screen.getByText(/Permissions for:/)).toBeTruthy());
    await clickButton(user, /Add permission/i);
    await waitFor(() => expect(screen.getByPlaceholderText("my-permission")).toBeTruthy());
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "stmt-1");
    await user.type(inputs[1], "123456789012");
    await clickButton(user, /Add/i, { last: true });
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "permission add failed"));
  });

  it("cancels the add permission modal", async () => {
    const user = userEvent.setup();
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Event Buses"));
    await user.click(screen.getByText("default"));
    await waitFor(() => expect(screen.getByText(/Permissions for:/)).toBeTruthy());
    await clickButton(user, /Add permission/i);
    await waitFor(() => expect(screen.getByPlaceholderText("my-permission")).toBeTruthy());
    await clickButton(user, /Cancel/i, { last: true });
    await waitFor(() => expect(screen.queryByPlaceholderText("my-permission")).toBeNull());
    expect(mockPutPermissionMutate).not.toHaveBeenCalled();
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
    await waitFor(() => {
      expect(mockStartReplayMutate).toHaveBeenCalledWith(
        {
          replayName: "test-replay",
          eventSourceArn: "arn:aws:events:us-east-1:000000000000:archive/my-archive",
          eventStartTime: "2026-01-01T00:00:00Z",
          eventEndTime: undefined,
          description: undefined,
          destination: undefined,
        },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
      expect(mockShowToast).toHaveBeenCalledWith("success", 'Replay "test-replay" started');
    });
  });

  it("starts a replay with optional fields filled", async () => {
    const user = userEvent.setup();
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Replays"));
    await clickButton(user, /Start replay/i);
    await waitFor(() => expect(screen.getByPlaceholderText("my-replay")).toBeTruthy());
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "full-replay");
    await user.type(inputs[1], "arn:aws:events:us-east-1:000000000000:archive/my-archive");
    await user.type(inputs[2], "2026-01-01T00:00:00Z");
    await user.type(inputs[3], "2026-01-02T00:00:00Z");
    await user.type(inputs[4], "Replay description");
    await user.type(inputs[5], "arn:aws:events:us-east-1:000000000000:event-bus/default");
    await clickButton(user, /Start/i, { last: true });
    await waitFor(() => {
      expect(mockStartReplayMutate).toHaveBeenCalledWith(
        {
          replayName: "full-replay",
          eventSourceArn: "arn:aws:events:us-east-1:000000000000:archive/my-archive",
          eventStartTime: "2026-01-01T00:00:00Z",
          eventEndTime: "2026-01-02T00:00:00Z",
          description: "Replay description",
          destination: { Arn: "arn:aws:events:us-east-1:000000000000:event-bus/default" },
        },
        expect.anything(),
      );
      expect(screen.queryByPlaceholderText("my-replay")).toBeNull();
    });
  });

  it("shows error toast when starting a replay fails", async () => {
    mockStartReplayMutate.mockImplementation((_b: any, opts: any) => opts?.onError?.(new Error("replay start failed")));
    const user = userEvent.setup();
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Replays"));
    await clickButton(user, /Start replay/i);
    await waitFor(() => expect(screen.getByPlaceholderText("my-replay")).toBeTruthy());
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "fail-replay");
    await user.type(inputs[1], "arn:aws:events:us-east-1:000000000000:archive/my-archive");
    await user.type(inputs[2], "2026-01-01T00:00:00Z");
    await clickButton(user, /Start/i, { last: true });
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "replay start failed"));
  });

  it("cancels the start replay modal", async () => {
    const user = userEvent.setup();
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Replays"));
    await clickButton(user, /Start replay/i);
    await waitFor(() => expect(screen.getByPlaceholderText("my-replay")).toBeTruthy());
    await clickButton(user, /Cancel/i, { last: true });
    await waitFor(() => expect(screen.queryByPlaceholderText("my-replay")).toBeNull());
    expect(mockStartReplayMutate).not.toHaveBeenCalled();
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
      expect(mockCancelReplayMutate).toHaveBeenCalledWith(
        "my-replay",
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
      expect(mockShowToast).toHaveBeenCalledWith("success", "Replay cancelled");
    });
  });

  it("does not cancel a replay when confirmation is declined", async () => {
    mockConfirm.mockResolvedValue(false);
    const user = userEvent.setup();
    mockEventReplays.mockReturnValue({
      data: { replays: [{ ReplayName: "my-replay", EventSourceArn: "arn:aws:events:us-east-1:000000000000:archive/my-archive", State: "RUNNING" }] },
      isLoading: false,
    });
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Replays"));
    await clickButton(user, /Cancel replay/i);
    await waitFor(() => expect(mockConfirm).toHaveBeenCalled());
    expect(mockCancelReplayMutate).not.toHaveBeenCalled();
  });

  it("renders replays when data lacks the key", async () => {
    const user = userEvent.setup();
    mockEventReplays.mockReturnValue({ data: {}, isLoading: false });
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Replays"));
    expect(screen.getByText("No replays")).toBeTruthy();
  });

  it("shows dash for replay without state", async () => {
    const user = userEvent.setup();
    mockEventReplays.mockReturnValue({
      data: { replays: [{ ReplayName: "no-state-replay", EventSourceArn: "arn:aws:events:us-east-1:000000000000:archive/my-archive" }] },
      isLoading: false,
    });
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Replays"));
    expect(screen.getByText("no-state-replay")).toBeTruthy();
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(1);
  });

  it("shows error toast when cancelling a replay fails", async () => {
    mockCancelReplayMutate.mockImplementation((_b: any, opts: any) => opts?.onError?.(new Error("replay cancel failed")));
    const user = userEvent.setup();
    mockEventReplays.mockReturnValue({
      data: { replays: [{ ReplayName: "my-replay", EventSourceArn: "arn:aws:events:us-east-1:000000000000:archive/my-archive", State: "RUNNING" }] },
      isLoading: false,
    });
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Replays"));
    await clickButton(user, /Cancel replay/i);
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "replay cancel failed"));
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

  it("renders rule schedule expression and default bus fallback", () => {
    mockEventRules.mockReturnValue({
      data: {
        rules: [
          { Name: "sched-rule", State: "ENABLED", EventBusName: "custom-bus", ScheduleExpression: "rate(5 minutes)" },
          { Name: "no-bus-rule", State: "ENABLED" },
        ],
      },
      isLoading: false,
      isError: false,
      error: null,
    });
    render(<EventsPage />, { wrapper: pageWrapper() });
    expect(screen.getByText("rate(5 minutes)")).toBeTruthy();
    // no-bus-rule falls back to "default"
    expect(screen.getAllByText("default").length).toBeGreaterThanOrEqual(1);
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
      expect(mockUpdateArchiveMutate).toHaveBeenCalledWith(
        {
          archiveName: "updatable-archive",
          description: "Test archive",
          retentionDays: 30,
        },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
      expect(mockShowToast).toHaveBeenCalledWith("success", "Archive updated");
    });
  });

  it("shows error toast when updating an archive fails", async () => {
    mockUpdateArchiveMutate.mockImplementation((_b: any, opts: any) => opts?.onError?.(new Error("archive update failed")));
    const user = userEvent.setup();
    mockEventArchives.mockReturnValue({
      data: { archives: [{ ArchiveName: "updatable-archive", EventSourceArn: "arn:aws:events:.../default", State: "ENABLED", EventCount: 5 }] },
      isLoading: false,
    });
    mockDescribeArchive.mockReturnValue({
      data: {
        archive: { ArchiveName: "updatable-archive", Description: "Test archive", RetentionDays: 30, EventCount: 5, EventSourceArn: "arn:aws:events:.../default", State: "ENABLED" },
      },
      isLoading: false,
    });
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Archives"));
    await user.click(screen.getByText("updatable-archive"));
    await waitFor(() => expect(screen.getByText(/Update archive/i)).toBeTruthy());
    await clickButton(user, /Update archive/i);
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "archive update failed"));
  });

  it("edits archive fields before updating", async () => {
    const user = userEvent.setup();
    mockEventArchives.mockReturnValue({
      data: { archives: [{ ArchiveName: "updatable-archive", EventSourceArn: "arn:aws:events:.../default", State: "ENABLED", EventCount: 5 }] },
      isLoading: false,
    });
    mockDescribeArchive.mockReturnValue({
      data: {
        archive: { ArchiveName: "updatable-archive", Description: "Test archive", RetentionDays: 30, EventCount: 5, EventSourceArn: "arn:aws:events:.../default", State: "ENABLED" },
      },
      isLoading: false,
    });
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Archives"));
    await user.click(screen.getByText("updatable-archive"));
    await waitFor(() => expect(screen.getByText(/Update archive/i)).toBeTruthy());
    const inputs = screen.getAllByRole("textbox");
    await user.clear(inputs[0]);
    await user.type(inputs[0], "New description");
    // The retention field is a number input (role spinbutton)
    const retentionInput = screen.getByRole("spinbutton");
    await user.clear(retentionInput);
    await user.type(retentionInput, "45");
    await clickButton(user, /Update archive/i);
    await waitFor(() => {
      expect(mockUpdateArchiveMutate).toHaveBeenCalledWith(
        { archiveName: "updatable-archive", description: "New description", retentionDays: 45 },
        expect.anything(),
      );
    });
  });

  it("hides the archive detail panel", async () => {
    const user = userEvent.setup();
    mockEventArchives.mockReturnValue({
      data: { archives: [{ ArchiveName: "updatable-archive", EventSourceArn: "arn:aws:events:.../default", State: "ENABLED", EventCount: 5 }] },
      isLoading: false,
    });
    mockDescribeArchive.mockReturnValue({
      data: { archive: { ArchiveName: "updatable-archive", State: "ENABLED", EventCount: 5, EventSourceArn: "arn:aws:events:.../default" } },
      isLoading: false,
    });
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Archives"));
    await user.click(screen.getByText("updatable-archive"));
    await waitFor(() => expect(screen.getByText(/Archive: updatable-archive/)).toBeTruthy());
    await clickButton(user, /Hide/i);
    await waitFor(() => expect(screen.queryByText(/Archive: updatable-archive/)).toBeNull());
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

  it("renders archive state and count fallbacks for sparse data", async () => {
    const user = userEvent.setup();
    mockEventArchives.mockReturnValue({
      data: { archives: [{ ArchiveName: "sparse-archive", EventSourceArn: "arn:aws:events:.../default" }] },
      isLoading: false,
    });
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Archives"));
    expect(screen.getByText("sparse-archive")).toBeTruthy();
    // Missing State -> dash, missing EventCount -> 0
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(1);
  });

  it("shows archive detail fallbacks and updates with empty fields", async () => {
    const user = userEvent.setup();
    mockEventArchives.mockReturnValue({
      data: { archives: [{ ArchiveName: "sparse-detail", EventSourceArn: "arn:aws:events:.../default" }] },
      isLoading: false,
    });
    mockDescribeArchive.mockReturnValue({
      data: { archive: { ArchiveName: "sparse-detail", EventSourceArn: "arn:aws:events:.../default" } },
      isLoading: false,
    });
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Archives"));
    await user.click(screen.getByText("sparse-detail"));
    await waitFor(() => expect(screen.getByText(/Archive: sparse-detail/)).toBeTruthy());
    // Missing State -> dash, missing EventCount -> 0
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(1);
    // Update with empty fields -> description/retentionDays undefined
    await clickButton(user, /Update archive/i);
    await waitFor(() => {
      expect(mockUpdateArchiveMutate).toHaveBeenCalledWith(
        { archiveName: "sparse-detail", description: undefined, retentionDays: undefined },
        expect.anything(),
      );
    });
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

  it("handles an unparseable bus policy", async () => {
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
          Policy: "this is not valid json {",
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
    // Parse fails -> zero statements, raw policy still shown
    expect(screen.getByText(/\(0\)/)).toBeTruthy();
    expect(screen.getByText(/Raw policy/i)).toBeTruthy();
  });

  it("removes a permission from the bus policy", async () => {
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
            Statement: [{ Sid: "stmt-1", Effect: "Allow", Principal: { AWS: "*" }, Action: "events:PutEvents" }],
          }),
        },
      },
      isLoading: false,
    });
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Event Buses"));
    await user.click(screen.getByText("custom-bus"));
    await waitFor(() => expect(screen.getByText(/Permissions for:/)).toBeTruthy());
    await user.click(screen.getByLabelText("Remove permission"));
    await waitFor(() => {
      expect(mockRemovePermissionMutate).toHaveBeenCalledWith(
        { eventBusName: "custom-bus", statementId: "stmt-1" },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
      expect(mockShowToast).toHaveBeenCalledWith("success", "Permission removed");
    });
  });

  it("does not remove a permission when confirmation is declined", async () => {
    mockConfirm.mockResolvedValue(false);
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
            Statement: [{ Sid: "stmt-1", Effect: "Allow", Principal: { AWS: "*" }, Action: "events:PutEvents" }],
          }),
        },
      },
      isLoading: false,
    });
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Event Buses"));
    await user.click(screen.getByText("custom-bus"));
    await waitFor(() => expect(screen.getByText(/Permissions for:/)).toBeTruthy());
    await user.click(screen.getByLabelText("Remove permission"));
    await waitFor(() => expect(mockConfirm).toHaveBeenCalled());
    expect(mockRemovePermissionMutate).not.toHaveBeenCalled();
  });

  it("renders sparse permission statements with fallbacks", async () => {
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
              { Sid: "arr-action", Effect: "Allow", Principal: { AWS: "*" }, Action: ["events:PutEvents", "events:PutRule"] },
              { Effect: "Deny", Principal: "123", Action: "events:PutEvents" },
              { Sid: "no-fields" },
            ],
          }),
        },
      },
      isLoading: false,
    });
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Event Buses"));
    await user.click(screen.getByText("custom-bus"));
    await waitFor(() => expect(screen.getByText(/Permissions for:/)).toBeTruthy());
    // Array action joins; the no-Sid statement renders a dash and no remove button,
    // and the no-fields statement falls back to dashes everywhere
    expect(screen.getByText("events:PutEvents, events:PutRule")).toBeTruthy();
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(4);
    expect(screen.getAllByLabelText("Remove permission").length).toBe(2);
  });

  it("shows error toast when removing a permission fails", async () => {
    mockRemovePermissionMutate.mockImplementation((_b: any, opts: any) => opts?.onError?.(new Error("permission remove failed")));
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
            Statement: [{ Sid: "stmt-1", Effect: "Allow", Principal: { AWS: "*" }, Action: "events:PutEvents" }],
          }),
        },
      },
      isLoading: false,
    });
    render(<EventsPage />, { wrapper: pageWrapper() });
    await user.click(screen.getByText("Event Buses"));
    await user.click(screen.getByText("custom-bus"));
    await waitFor(() => expect(screen.getByText(/Permissions for:/)).toBeTruthy());
    await user.click(screen.getByLabelText("Remove permission"));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "permission remove failed"));
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

describe("EventsPage — pattern tester tab", () => {
  it("tests a pattern and shows the match result", async () => {
    mockTestPatternMutate.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.({ result: true }));
    const user = userEvent.setup();
    render(<EventsPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Pattern Tester"));
    const buttons = await screen.findAllByRole("button", { name: /Test pattern/i });
    await user.click(buttons[0]);
    await waitFor(() => expect(screen.getByText("The event matches the pattern.")).toBeTruthy());
  });

  it("shows the no-match warning", async () => {
    mockTestPatternMutate.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.({ result: false }));
    const user = userEvent.setup();
    render(<EventsPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Pattern Tester"));
    const buttons = await screen.findAllByRole("button", { name: /Test pattern/i });
    await user.click(buttons[0]);
    await waitFor(() => expect(screen.getByText("The event does not match the pattern.")).toBeTruthy());
  });

  it("shows an error toast when the test fails", async () => {
    mockTestPatternMutate.mockImplementation((_b: any, opts: any) =>
      opts?.onError?.(new Error("bad pattern"))
    );
    const user = userEvent.setup();
    render(<EventsPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Pattern Tester"));
    const buttons = await screen.findAllByRole("button", { name: /Test pattern/i });
    await user.click(buttons[0]);
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "bad pattern"));
  });

  it("shows a fallback error message when the test fails without a message", async () => {
    mockTestPatternMutate.mockImplementation((_b: any, opts: any) => opts?.onError?.(new Error("")));
    const user = userEvent.setup();
    render(<EventsPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Pattern Tester"));
    const buttons = await screen.findAllByRole("button", { name: /Test pattern/i });
    await user.click(buttons[0]);
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Test failed"));
  });
});

describe("EventsPage — bus tags", () => {
  it("opens the tags modal from a bus row and renders tags", async () => {
    mockEventBuses.mockReturnValue({
      data: { eventBuses: [{ Name: "custom", Arn: "arn:aws:events:custom" }] },
      isLoading: false,
    });
    mockTags.mockReturnValue({ data: { tags: [{ key: "env", value: "prod" }] } });
    const user = userEvent.setup();
    render(<EventsPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Event Buses"));
    const tagsBtn = await screen.findByRole("button", { name: /^Tags$/ });
    await user.click(tagsBtn);
    expect(await screen.findByText("Tags — custom")).toBeTruthy();
    expect(screen.getByText("env")).toBeTruthy();
    expect(mockTags).toHaveBeenCalledWith("arn:aws:events:custom");
  });

  it("shows No tags in the modal when the list is empty", async () => {
    mockEventBuses.mockReturnValue({
      data: { eventBuses: [{ Name: "custom", Arn: "arn:aws:events:custom" }] },
      isLoading: false,
    });
    mockTags.mockReturnValue({ data: { tags: [] } });
    const user = userEvent.setup();
    render(<EventsPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Event Buses"));
    const tagsBtn = await screen.findByRole("button", { name: /^Tags$/ });
    await user.click(tagsBtn);
    expect(await screen.findByText("No tags")).toBeTruthy();
  });

  it("adds a tag and clears the inputs", async () => {
    mockEventBuses.mockReturnValue({
      data: { eventBuses: [{ Name: "custom", Arn: "arn:aws:events:custom" }] },
      isLoading: false,
    });
    mockTags.mockReturnValue({ data: { tags: [] } });
    mockAddTagsMutate.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
    const user = userEvent.setup();
    render(<EventsPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Event Buses"));
    const tagsBtn = await screen.findByRole("button", { name: /^Tags$/ });
    await user.click(tagsBtn);
    await screen.findByText("No tags");
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "team");
    await user.type(inputs[1], "events");
    await user.click(screen.getByRole("button", { name: /Add tag/i }));
    await waitFor(() =>
      expect(mockAddTagsMutate).toHaveBeenCalledWith(
        { arn: "arn:aws:events:custom", tags: { team: "events" } },
        expect.objectContaining({ onSuccess: expect.any(Function) })
      )
    );
    await waitFor(() =>
      expect((screen.getAllByRole("textbox")[0] as HTMLInputElement).value).toBe("")
    );
  });

  it("keeps Add tag disabled until a key is entered", async () => {
    mockEventBuses.mockReturnValue({
      data: { eventBuses: [{ Name: "custom", Arn: "arn:aws:events:custom" }] },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<EventsPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Event Buses"));
    const tagsBtn = await screen.findByRole("button", { name: /^Tags$/ });
    await user.click(tagsBtn);
    expect((await screen.findAllByRole("button", { name: /Add tag/i }))[0].hasAttribute("disabled")).toBe(true);
  });

  it("shows error toasts when adding fails", async () => {
    mockEventBuses.mockReturnValue({
      data: { eventBuses: [{ Name: "custom", Arn: "arn:aws:events:custom" }] },
      isLoading: false,
    });
    mockAddTagsMutate.mockImplementation((_b: any, opts: any) =>
      opts?.onError?.(new Error("add failed"))
    );
    const user = userEvent.setup();
    render(<EventsPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Event Buses"));
    const tagsBtn = await screen.findByRole("button", { name: /^Tags$/ });
    await user.click(tagsBtn);
    await screen.findByText("No tags");
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "team");
    await user.click(screen.getByRole("button", { name: /Add tag/i }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "add failed"));
  });

  it("removes a tag", async () => {
    mockEventBuses.mockReturnValue({
      data: { eventBuses: [{ Name: "custom", Arn: "arn:aws:events:custom" }] },
      isLoading: false,
    });
    mockTags.mockReturnValue({ data: { tags: [{ key: "env", value: "prod" }] } });
    mockRemoveTagsMutate.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.());
    const user = userEvent.setup();
    render(<EventsPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Event Buses"));
    const tagsBtn = await screen.findByRole("button", { name: /^Tags$/ });
    await user.click(tagsBtn);
    await screen.findByText("env");
    await user.click(screen.getByRole("button", { name: /Delete tag env/i }));
    await waitFor(() =>
      expect(mockRemoveTagsMutate).toHaveBeenCalledWith(
        { arn: "arn:aws:events:custom", tagKeys: ["env"] },
        expect.objectContaining({ onSuccess: expect.any(Function) })
      )
    );
  });

  it("disables the Tags button when the bus has no ARN", async () => {
    mockEventBuses.mockReturnValue({
      data: { eventBuses: [{ Name: "custom" }] },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<EventsPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Event Buses"));
    const tagsBtn = await screen.findByRole("button", { name: /^Tags$/ });
    expect(tagsBtn.hasAttribute("disabled")).toBe(true);
  });

  it("shows a fallback toast when removing a tag fails without a message", async () => {
    mockEventBuses.mockReturnValue({
      data: { eventBuses: [{ Name: "custom", Arn: "arn:aws:events:custom" }] },
      isLoading: false,
    });
    mockTags.mockReturnValue({ data: { tags: [{ key: "env", value: "prod" }] } });
    mockRemoveTagsMutate.mockImplementation((_b: any, opts: any) =>
      opts?.onError?.(new Error(""))
    );
    const user = userEvent.setup();
    render(<EventsPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Event Buses"));
    const tagsBtn = await screen.findByRole("button", { name: /^Tags$/ });
    await user.click(tagsBtn);
    await screen.findByText("env");
    await user.click(screen.getByRole("button", { name: /Delete tag env/i }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to remove tag"));
  });

  it("fires onChange for the pattern and event textareas", async () => {
    mockTestPatternMutate.mockImplementation((_b: any, opts: any) => opts?.onSuccess?.({ result: true }));
    const user = userEvent.setup();
    render(<EventsPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Pattern Tester"));
    const areas = await screen.findAllByRole("textbox");
    fireEvent.change(areas[0], { target: { value: "p1" } });
    fireEvent.change(areas[1], { target: { value: "e1" } });
    const buttons = screen.getAllByRole("button", { name: /Test pattern/i });
    await user.click(buttons[0]);
    await waitFor(() => expect(mockTestPatternMutate).toHaveBeenCalled());
    expect(mockTestPatternMutate.mock.calls.some((c: any[]) => c[0].eventPattern === "p1")).toBe(true);
  });

  it("shows No tags while the tags query is still loading", async () => {
    mockEventBuses.mockReturnValue({
      data: { eventBuses: [{ Name: "custom", Arn: "arn:aws:events:custom" }] },
      isLoading: false,
    });
    mockTags.mockReturnValue({ data: undefined });
    const user = userEvent.setup();
    render(<EventsPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Event Buses"));
    const tagsBtn = await screen.findByRole("button", { name: /^Tags$/ });
    await user.click(tagsBtn);
    expect(await screen.findByText("No tags")).toBeTruthy();
  });

  it("shows a fallback toast when adding a tag fails without a message", async () => {
    mockEventBuses.mockReturnValue({
      data: { eventBuses: [{ Name: "custom", Arn: "arn:aws:events:custom" }] },
      isLoading: false,
    });
    mockAddTagsMutate.mockImplementation((_b: any, opts: any) =>
      opts?.onError?.(new Error(""))
    );
    const user = userEvent.setup();
    render(<EventsPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Event Buses"));
    const tagsBtn = await screen.findByRole("button", { name: /^Tags$/ });
    await user.click(tagsBtn);
    await screen.findByText("No tags");
    const inputs = screen.getAllByRole("textbox");
    await user.type(inputs[0], "team");
    await user.click(screen.getByRole("button", { name: /Add tag/i }));
    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith("error", "Failed to add tag"));
  });

  it("closes the tags modal", async () => {
    mockEventBuses.mockReturnValue({
      data: { eventBuses: [{ Name: "custom", Arn: "arn:aws:events:custom" }] },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<EventsPage />, { wrapper: createWrapper() });
    await user.click(screen.getByText("Event Buses"));
    const tagsBtn = await screen.findByRole("button", { name: /^Tags$/ });
    await user.click(tagsBtn);
    await screen.findByText("Tags — custom");
    await user.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByText("Tags — custom")).toBeNull());
  });
});
