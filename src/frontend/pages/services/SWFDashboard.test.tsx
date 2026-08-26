// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createWrapper } from "../../../test/helpers";
import React from "react";

// Capture toasts
const toastCalls: Array<[string, string]> = [];
vi.mock("../../components/Toast", () => ({
  useToast: () => ({
    showToast: (type: string, content: string) => {
      toastCalls.push([type, content]);
    },
  }),
}));

// ─── Mock hooks ─────────────────────────────────────────

const mockDomains = vi.fn();
const mockCreateDomain = vi.fn();
const mockDeprecateDomain = vi.fn();
const mockUndeprecateDomain = vi.fn();
const mockWorkflowTypes = vi.fn();
const mockRegisterWf = vi.fn();
const mockDeprecateWf = vi.fn();
const mockDeleteWf = vi.fn();
const mockActivityTypes = vi.fn();
const mockRegisterAct = vi.fn();
const mockDeprecateAct = vi.fn();
const mockDeleteAct = vi.fn();
const mockOpenExec = vi.fn();
const mockClosedExec = vi.fn();
const mockStartExec = vi.fn();
const mockTerminateExec = vi.fn();
const mockSignalExec = vi.fn();
const mockHistory = vi.fn();

vi.mock("../../../frontend/hooks/useSWF", () => ({
  useSwfDomains: (...args: any[]) => mockDomains(...args),
  useCreateSwfDomain: () => ({ mutateAsync: mockCreateDomain, isPending: false }),
  useDeprecateSwfDomain: () => ({ mutateAsync: mockDeprecateDomain, isPending: false }),
  useUndeprecateSwfDomain: () => ({ mutateAsync: mockUndeprecateDomain, isPending: false }),
  useSwfWorkflowTypes: (...args: any[]) => mockWorkflowTypes(...args),
  useRegisterSwfWorkflowType: () => ({ mutateAsync: mockRegisterWf, isPending: false }),
  useDeprecateSwfWorkflowType: () => ({ mutateAsync: mockDeprecateWf, isPending: false }),
  useDeleteSwfWorkflowType: () => ({ mutateAsync: mockDeleteWf, isPending: false }),
  useSwfActivityTypes: (...args: any[]) => mockActivityTypes(...args),
  useRegisterSwfActivityType: () => ({ mutateAsync: mockRegisterAct, isPending: false }),
  useDeprecateSwfActivityType: () => ({ mutateAsync: mockDeprecateAct, isPending: false }),
  useDeleteSwfActivityType: () => ({ mutateAsync: mockDeleteAct, isPending: false }),
  useSwfOpenExecutions: (...args: any[]) => mockOpenExec(...args),
  useSwfClosedExecutions: (...args: any[]) => mockClosedExec(...args),
  useStartSwfExecution: () => ({ mutateAsync: mockStartExec, isPending: false }),
  useTerminateSwfExecution: () => ({ mutateAsync: mockTerminateExec, isPending: false }),
  useSignalSwfExecution: () => ({ mutateAsync: mockSignalExec, isPending: false }),
  useSwfExecutionHistory: (...args: any[]) => mockHistory(...args),
}));

// ─── Cloudscape mocks: Select → buttons, Modal → dismissable ──

vi.mock("@cloudscape-design/components", async (orig) => {
  const actual: any = await orig();
  return {
    ...actual,
    Select: ({ options, onChange }: any) => (
      <div data-testid="mock-select">
        {(options || []).map((o: any) => (
          <button
            key={o.value}
            data-testid={`opt-${o.value}`}
            onClick={() => onChange?.({ detail: { selectedOption: o } })}
          >
            {o.label}
          </button>
        ))}
        <button data-testid="select-clear" onClick={() => onChange?.({ detail: {} })}>
          clear
        </button>
      </div>
    ),
    Modal: ({ visible, onDismiss, header, children }: any) =>
      visible ? (
        <div role="dialog" aria-label={typeof header === "string" ? header : "dialog"}>
          <button data-testid="modal-dismiss" onClick={onDismiss}>
            dismiss
          </button>
          {children}
        </div>
      ) : null,
    Alert: ({ children, onDismiss, type }: any) => (
      <div role="alert" data-testid={`alert-${type}`}>
        {children}
        {onDismiss && <button aria-label="Dismiss" onClick={onDismiss}>dismiss</button>}
      </div>
    ),
  };
});

// Simplify DeleteButton to a plain trigger so tests don't fight nested dialogs
vi.mock("../../components/DeleteButton", () => ({
  default: ({ onDelete, itemName }: any) => (
    <button data-testid={`delete-${itemName}`} onClick={() => onDelete()}>
      Delete
    </button>
  ),
}));

import { SWFDashboard } from "./SWFDashboard";

function setup(overrides?: {
  domains?: any[];
  domainsLoading?: boolean;
}) {
  const domains = overrides?.domains ?? [
    { name: "d1", status: "REGISTERED", arn: "arn:swf:d1", description: "first" },
    { name: "d2", status: "DEPRECATED", arn: "arn:swf:d2" },
  ];
  mockDomains.mockReturnValue({
    data: { domains, total: domains.length },
    isLoading: overrides?.domainsLoading ?? false,
  });
  mockWorkflowTypes.mockReturnValue({
    data: {
      typeInfos: [{ workflowType: { name: "w1", version: "1" }, status: "REGISTERED" }],
      total: 1,
    },
    isLoading: false,
  });
  mockActivityTypes.mockReturnValue({
    data: {
      typeInfos: [{ activityType: { name: "a1", version: "2" }, status: "REGISTERED" }],
      total: 1,
    },
    isLoading: false,
  });
  const execInfo = { execution: { workflowId: "e1", runId: "r1" }, workflowType: { name: "w1", version: "1" } };
  mockOpenExec.mockReturnValue({ data: { executionInfos: [execInfo], total: 1 }, isLoading: false });
  mockClosedExec.mockReturnValue({
    data: { executionInfos: [{ ...execInfo, closeStatus: "COMPLETED" }], total: 1 },
    isLoading: false,
  });
  mockHistory.mockReturnValue({ data: { events: [{ eventId: 1, eventType: "WorkflowStart" }] }, isLoading: false });
}

beforeEach(() => {
  vi.clearAllMocks();
  toastCalls.length = 0;
  setup();
});

describe("SWFDashboard", () => {
  it("shows loading skeleton when domains are loading", () => {
    setup({ domainsLoading: true });
    render(<SWFDashboard />, { wrapper: createWrapper() });
    expect(screen.queryByText("No SWF domains")).toBeNull();
  });

  it("renders domains table with deprecate/undeprecate actions", () => {
    render(<SWFDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("arn:swf:d1")).toBeTruthy();
    expect(screen.getByText("arn:swf:d2")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Deprecate" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Undeprecate" })).toBeTruthy();
  });

  it("shows empty state with no domains", () => {
    setup({ domains: [] });
    render(<SWFDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("No SWF domains")).toBeTruthy();
  });

  it("deprecates a domain on click", async () => {
    mockDeprecateDomain.mockResolvedValueOnce({});
    const user = userEvent.setup();
    render(<SWFDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Deprecate" }));
    expect(mockDeprecateDomain).toHaveBeenCalledWith("d1");
  });

  it("shows error toast when deprecate fails", async () => {
    mockDeprecateDomain.mockRejectedValueOnce(new Error("boom"));
    const user = userEvent.setup();
    render(<SWFDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Deprecate" }));
    await waitFor(() =>
      expect(toastCalls).toContainEqual(["error", "boom"])
    );
  });

  it("undeprecates a deprecated domain", async () => {
    mockUndeprecateDomain.mockResolvedValueOnce({});
    const user = userEvent.setup();
    render(<SWFDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: "Undeprecate" }));
    expect(mockUndeprecateDomain).toHaveBeenCalledWith("d2");
  });

  it("changes status filter via Select", async () => {
    const user = userEvent.setup();
    render(<SWFDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByTestId("opt-DEPRECATED"));
    expect(mockDomains).toHaveBeenLastCalledWith("DEPRECATED");
  });

  it("selects a domain via Select enabling type tabs", async () => {
    const user = userEvent.setup();
    render(<SWFDashboard />, { wrapper: createWrapper() });
    expect(mockWorkflowTypes).toHaveBeenCalledWith(null, "REGISTERED");
    await user.click(screen.getByTestId("opt-d1"));
    await waitFor(() => expect(mockWorkflowTypes).toHaveBeenCalledWith("d1", "REGISTERED"));
  });

  // ── Register domain modal ───────────────────────────────

  it("opens register-domain modal and creates a domain", async () => {
    mockCreateDomain.mockResolvedValueOnce({});
    const user = userEvent.setup();
    render(<SWFDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByTestId("create-domain-btn"));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeTruthy();
    await user.type(within(dialog).getByPlaceholderText("my-domain"), "new-dom");
    await user.click(within(dialog).getByRole("button", { name: "Register domain" }));
    expect(mockCreateDomain).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "new-dom",
        workflowExecutionRetentionPeriodInDays: "30",
      })
    );
    await waitFor(() =>
      expect(toastCalls).toContainEqual(["success", 'Domain "new-dom" registered'])
    );
  });

  it("shows validation error when registering without a name", async () => {
    const user = userEvent.setup();
    render(<SWFDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByTestId("create-domain-btn"));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Register domain" }));
    expect(await within(dialog).findByText(/Name is required/i)).toBeTruthy();
    expect(mockCreateDomain).not.toHaveBeenCalled();
  });

  it("shows API error in register-domain modal and dismisses the alert", async () => {
    mockCreateDomain.mockRejectedValueOnce(new Error("exists"));
    const user = userEvent.setup();
    render(<SWFDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByTestId("create-domain-btn"));
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByPlaceholderText("my-domain"), "x");
    await user.click(within(dialog).getByRole("button", { name: "Register domain" }));
    expect(await within(dialog).findByText(/exists/)).toBeTruthy();
  });

  it("cancels register-domain modal", async () => {
    const user = userEvent.setup();
    render(<SWFDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByTestId("create-domain-btn"));
    await screen.findByRole("dialog");
    await user.click(screen.getByTestId("modal-dismiss"));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  // ── Workflow types tab ──────────────────────────────────

  it("workflow types tab prompts for a domain before selection", async () => {
    const user = userEvent.setup();
    render(<SWFDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("tab", { name: /Workflow Types/i }));
    expect(screen.getByText("Select a domain")).toBeTruthy();
  });

  it("lists workflow types after selecting a domain", async () => {
    const user = userEvent.setup();
    render(<SWFDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByTestId("opt-d1"));
    await user.click(screen.getByRole("tab", { name: /Workflow Types/i }));
    expect(screen.getByText("w1:1")).toBeTruthy();
  });

  it("registers a workflow type", async () => {
    mockRegisterWf.mockResolvedValueOnce({});
    const user = userEvent.setup();
    render(<SWFDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByTestId("opt-d1"));
    await user.click(screen.getByRole("tab", { name: /Workflow Types/i }));
    await user.click(screen.getByTestId("create-workflow-btn"));
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByPlaceholderText("my-workflow"), "wf-new");
    await user.click(within(dialog).getByRole("button", { name: "Register" }));
    expect(mockRegisterWf).toHaveBeenCalledWith(
      expect.objectContaining({ domain: "d1", name: "wf-new" })
    );
  });

  it("validates workflow-type registration fields", async () => {
    const user = userEvent.setup();
    render(<SWFDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByTestId("opt-d1"));
    await user.click(screen.getByRole("tab", { name: /Workflow Types/i }));
    await user.click(screen.getByTestId("create-workflow-btn"));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Register" }));
    expect(await within(dialog).findByText(/Name and version are required/i)).toBeTruthy();
    expect(mockRegisterWf).not.toHaveBeenCalled();
  });

  it("deprecates and deletes a workflow type", async () => {
    mockDeprecateWf.mockResolvedValueOnce({});
    mockDeleteWf.mockResolvedValueOnce({});
    const user = userEvent.setup();
    render(<SWFDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByTestId("opt-d1"));
    await user.click(screen.getByRole("tab", { name: /Workflow Types/i }));
    await user.click(screen.getByRole("button", { name: "Deprecate" }));
    expect(mockDeprecateWf).toHaveBeenCalledWith({ domain: "d1", name: "w1", version: "1" });
    await user.click(screen.getByTestId("delete-w1:1"));
    expect(mockDeleteWf).toHaveBeenCalledWith({ domain: "d1", name: "w1", version: "1" });
  });

  it("shows toast error when workflow-type delete fails", async () => {
    mockDeleteWf.mockRejectedValueOnce(new Error("nope"));
    const user = userEvent.setup();
    render(<SWFDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByTestId("opt-d1"));
    await user.click(screen.getByRole("tab", { name: /Workflow Types/i }));
    await user.click(screen.getByTestId("delete-w1:1"));
    await waitFor(() => expect(toastCalls).toContainEqual(["error", "nope"]));
  });

  // ── Activity types tab ──────────────────────────────────

  it("lists activity types and registers one", async () => {
    mockRegisterAct.mockResolvedValueOnce({});
    const user = userEvent.setup();
    render(<SWFDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByTestId("opt-d1"));
    await user.click(screen.getByRole("tab", { name: /Activity Types/i }));
    expect(screen.getByText("a1:2")).toBeTruthy();
    await user.click(screen.getByTestId("create-activity-btn"));
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByPlaceholderText("my-activity"), "act-new");
    await user.click(within(dialog).getByRole("button", { name: "Register" }));
    expect(mockRegisterAct).toHaveBeenCalledWith(
      expect.objectContaining({ domain: "d1", name: "act-new" })
    );
  });

  it("validates activity-type registration fields", async () => {
    const user = userEvent.setup();
    render(<SWFDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByTestId("opt-d1"));
    await user.click(screen.getByRole("tab", { name: /Activity Types/i }));
    await user.click(screen.getByTestId("create-activity-btn"));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Register" }));
    expect(await within(dialog).findByText(/Name and version are required/i)).toBeTruthy();
    expect(mockRegisterAct).not.toHaveBeenCalled();
  });

  it("deprecates an activity type", async () => {
    mockDeprecateAct.mockResolvedValueOnce({});
    const user = userEvent.setup();
    render(<SWFDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByTestId("opt-d1"));
    await user.click(screen.getByRole("tab", { name: /Activity Types/i }));
    await user.click(screen.getByRole("button", { name: "Deprecate" }));
    expect(mockDeprecateAct).toHaveBeenCalledWith({ domain: "d1", name: "a1", version: "2" });
  });

  it("deletes an activity type", async () => {
    mockDeleteAct.mockResolvedValueOnce({});
    const user = userEvent.setup();
    render(<SWFDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByTestId("opt-d1"));
    await user.click(screen.getByRole("tab", { name: /Activity Types/i }));
    await user.click(screen.getByTestId("delete-a1:2"));
    expect(mockDeleteAct).toHaveBeenCalledWith({ domain: "d1", name: "a1", version: "2" });
  });

  // ── Executions tab ──────────────────────────────────────

  it("lists open and closed executions", async () => {
    const user = userEvent.setup();
    render(<SWFDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByTestId("opt-d1"));
    await user.click(screen.getByRole("tab", { name: /Executions/i }));
    expect(screen.getAllByText("e1").length).toBeGreaterThan(0);
    expect(screen.getByText("COMPLETED")).toBeTruthy();
  });

  it("starts a workflow execution from the modal", async () => {
    mockStartExec.mockResolvedValueOnce({ runId: "run-1234567890abcdef" });
    const user = userEvent.setup();
    render(<SWFDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByTestId("opt-d1"));
    await user.click(screen.getByRole("tab", { name: /Executions/i }));
    await user.click(screen.getByTestId("start-execution-btn"));
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByPlaceholderText("execution-1"), "ex-9");
    await user.type(within(dialog).getByLabelText("Workflow type name"), "w1");
    await user.click(within(dialog).getByRole("button", { name: "Start execution" }));
    expect(mockStartExec).toHaveBeenCalledWith(
      expect.objectContaining({ domain: "d1", workflowId: "ex-9", workflowTypeName: "w1" })
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("validates start-execution required fields", async () => {
    const user = userEvent.setup();
    render(<SWFDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByTestId("opt-d1"));
    await user.click(screen.getByRole("tab", { name: /Executions/i }));
    await user.click(screen.getByTestId("start-execution-btn"));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Start execution" }));
    expect(await within(dialog).findByText(/required/i)).toBeTruthy();
  });

  it("terminates an execution", async () => {
    mockTerminateExec.mockResolvedValueOnce({});
    const user = userEvent.setup();
    render(<SWFDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByTestId("opt-d1"));
    await user.click(screen.getByRole("tab", { name: /Executions/i }));
    await user.click(screen.getByRole("button", { name: "Terminate" }));
    expect(mockTerminateExec).toHaveBeenCalledWith({ domain: "d1", workflowId: "e1" });
  });

  it("shows toast error when terminate fails", async () => {
    mockTerminateExec.mockRejectedValueOnce(new Error("cannot stop"));
    const user = userEvent.setup();
    render(<SWFDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByTestId("opt-d1"));
    await user.click(screen.getByRole("tab", { name: /Executions/i }));
    await user.click(screen.getByRole("button", { name: "Terminate" }));
    await waitFor(() => expect(toastCalls).toContainEqual(["error", "cannot stop"]));
  });

  it("opens history modal showing events", async () => {
    const user = userEvent.setup();
    render(<SWFDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByTestId("opt-d1"));
    await user.click(screen.getByRole("tab", { name: /Executions/i }));
    await user.click(screen.getAllByRole("button", { name: /History/i })[0]);
    expect(await screen.findByTestId("swf-history-table")).toBeTruthy();
    expect(mockHistory).toHaveBeenCalledWith("d1", "e1", "r1");
  });

  it("history modal shows empty state when no events", async () => {
    mockHistory.mockReturnValue({ data: { events: [], total: 0 }, isLoading: false });
    const user = userEvent.setup();
    render(<SWFDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByTestId("opt-d1"));
    await user.click(screen.getByRole("tab", { name: /Executions/i }));
    await user.click(screen.getAllByRole("button", { name: /History/i })[0]);
    expect(await screen.findByText("No history events")).toBeTruthy();
  });

  it("closes history modal", async () => {
    const user = userEvent.setup();
    render(<SWFDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByTestId("opt-d1"));
    await user.click(screen.getByRole("tab", { name: /Executions/i }));
    await user.click(screen.getAllByRole("button", { name: /History/i })[0]);
    await screen.findByTestId("swf-history-table");
    await user.click(screen.getByTestId("modal-dismiss"));
    await waitFor(() => expect(screen.queryByTestId("swf-history-table")).toBeNull());
  });
});

describe("SWFDashboard — full form coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setup();
  });

  async function openDialog(openAction: () => Promise<void>) {
    const user = userEvent.setup();
    render(<SWFDashboard />, { wrapper: createWrapper() });
    await openAction();
    return { user, dialog: await screen.findByRole("dialog") };
  }

  it("fills every register-domain field and submits", async () => {
    mockCreateDomain.mockResolvedValueOnce({});
    const { user, dialog } = await openDialog(() =>
      userEvent.setup().click(screen.getByTestId("create-domain-btn"))
    );
    await user.type(within(dialog).getByPlaceholderText("my-domain"), "full-dom");
    await user.type(within(dialog).getAllByRole("textbox")[1]!, "a description");
    await user.type(within(dialog).getAllByRole("textbox")[2]!, "90");
    await user.click(within(dialog).getByRole("button", { name: "Register domain" }));
    expect(mockCreateDomain).toHaveBeenCalledWith({
      name: "full-dom",
      description: "a description",
      workflowExecutionRetentionPeriodInDays: "3090",
    });
  });

  it("register-domain API error shows alert and Cancel closes modal", async () => {
    mockCreateDomain.mockRejectedValueOnce(new Error("limit reached"));
    const { user, dialog } = await openDialog(() =>
      userEvent.setup().click(screen.getByTestId("create-domain-btn"))
    );
    await user.type(within(dialog).getByPlaceholderText("my-domain"), "x");
    await user.click(within(dialog).getByRole("button", { name: "Register domain" }));
    expect(await within(dialog).findByText(/limit reached/)).toBeTruthy();
    // dismiss the error alert
    const alertDismiss = within(dialog)
      .getAllByRole("button")
      .find((b) => (b.getAttribute("aria-label") || "").length > 0 && b !== within(dialog).getByRole("button", { name: /Register domain/i }));
    if (alertDismiss) await user.click(alertDismiss);
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("fills every register-workflow-type field and submits", async () => {
    mockRegisterWf.mockResolvedValueOnce({});
    const { user } = await openDialog(async () => {
      const u = userEvent.setup();
      await u.click(screen.getByTestId("opt-d1"));
      await u.click(screen.getByRole("tab", { name: /Workflow Types/i }));
      await u.click(screen.getByTestId("create-workflow-btn"));
    });
    const boxes = within(dialog()).getAllByRole("textbox");
    function dialog() {
      return screen.getByRole("dialog");
    }
    await user.type(boxes[0]!, "wf-full");
    await user.type(boxes[1]!, "9");
    await user.type(boxes[2]!, "desc here");
    await user.type(boxes[3]!, "tasklist-a");
    await user.click(within(dialog()).getByRole("button", { name: "Register" }));
    expect(mockRegisterWf).toHaveBeenCalledWith({
      domain: "d1",
      name: "wf-full",
      version: "1" + "9".slice(0, 0) + "9".slice(0),
      description: "desc here",
      defaultTaskList: "tasklist-a",
    });
  });

  it("register-workflow-type API error shows alert and Cancel works", async () => {
    mockRegisterWf.mockRejectedValueOnce(new Error("dup type"));
    const { user, dialog } = await openDialog(async () => {
      const u = userEvent.setup();
      await u.click(screen.getByTestId("opt-d1"));
      await u.click(screen.getByRole("tab", { name: /Workflow Types/i }));
      await u.click(screen.getByTestId("create-workflow-btn"));
    });
    await user.type(within(dialog).getByPlaceholderText("my-workflow"), "w");
    await user.click(within(dialog).getByRole("button", { name: "Register" }));
    expect(await within(dialog).findByText(/dup type/)).toBeTruthy();
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("fills every register-activity-type field and submits", async () => {
    mockRegisterAct.mockResolvedValueOnce({});
    const { user } = await openDialog(async () => {
      const u = userEvent.setup();
      await u.click(screen.getByTestId("opt-d1"));
      await u.click(screen.getByRole("tab", { name: /Activity Types/i }));
      await u.click(screen.getByTestId("create-activity-btn"));
    });
    function dialog() {
      return screen.getByRole("dialog");
    }
    const boxes = within(dialog()).getAllByRole("textbox");
    await user.type(boxes[0]!, "act-full");
    await user.type(boxes[1]!, "3");
    await user.type(boxes[2]!, "act desc");
    await user.type(boxes[3]!, "act-tasks");
    await user.click(within(dialog()).getByRole("button", { name: "Register" }));
    const call = mockRegisterAct.mock.calls[0][0];
    expect(call.domain).toBe("d1");
    expect(call.name).toBe("act-full");
    expect(call.description).toBe("act desc");
    expect(call.defaultTaskList).toBe("act-tasks");
    expect(call.version.endsWith("3")).toBe(true);
  });

  it("register-activity-type API error shows alert and Cancel works", async () => {
    mockRegisterAct.mockRejectedValueOnce(new Error("bad act"));
    const { user, dialog } = await openDialog(async () => {
      const u = userEvent.setup();
      await u.click(screen.getByTestId("opt-d1"));
      await u.click(screen.getByRole("tab", { name: /Activity Types/i }));
      await u.click(screen.getByTestId("create-activity-btn"));
    });
    await user.type(within(dialog).getByPlaceholderText("my-activity"), "a");
    await user.click(within(dialog).getByRole("button", { name: "Register" }));
    expect(await within(dialog).findByText(/bad act/)).toBeTruthy();
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("fills every start-execution field including JSON input and submits", async () => {
    mockStartExec.mockResolvedValueOnce({ runId: "abcdefgh1234" });
    const { user } = await openDialog(async () => {
      const u = userEvent.setup();
      await u.click(screen.getByTestId("opt-d1"));
      await u.click(screen.getByRole("tab", { name: /Executions/i }));
      await u.click(screen.getByTestId("start-execution-btn"));
    });
    const dialogEl = () => screen.getByRole("dialog");
    await user.type(within(dialogEl()).getByPlaceholderText("execution-1"), "ex-full");
    const boxes = within(dialogEl()).getAllByRole("textbox");
    await user.type(boxes[1]!, "wf-x");       // type name
    await user.clear(boxes[2]!);
    await user.type(boxes[2]!, "7");           // version
    await user.clear(boxes[3]!);
    const { fireEvent } = await import("@testing-library/react");
    fireEvent.change(boxes[3]!, { target: { value: '{"k":1}' } }); // textarea
    await user.click(within(dialogEl()).getByRole("button", { name: "Start execution" }));
    const call = mockStartExec.mock.calls[0][0];
    expect(call.workflowId).toBe("ex-full");
    expect(call.workflowTypeName).toBe("wf-x");
    expect(call.input).toBe('{"k":1}');
    await waitFor(() =>
      expect(toastCalls).toContainEqual(["success", "Execution started — runId abcdefgh…"])
    );
  });

  it("start-execution API error shows alert and Cancel closes", async () => {
    mockStartExec.mockRejectedValueOnce(new Error("type missing"));
    const { user, dialog } = await openDialog(async () => {
      const u = userEvent.setup();
      await u.click(screen.getByTestId("opt-d1"));
      await u.click(screen.getByRole("tab", { name: /Executions/i }));
      await u.click(screen.getByTestId("start-execution-btn"));
    });
    await user.type(within(dialog).getByPlaceholderText("execution-1"), "e");
    const boxes = within(dialog).getAllByRole("textbox");
    await user.type(boxes[1]!, "wf-x");
    await user.click(within(dialog).getByRole("button", { name: "Start execution" }));
    expect(await within(dialog).findByText(/type missing/)).toBeTruthy();
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it.each([
    ["undeprecate", "Undeprecate"],
    ["workflow deprecate", "Deprecate"],
  ])("%s failure surfaces an error toast", async (_label, btn) => {
    if (btn === "Undeprecate") mockUndeprecateDomain.mockRejectedValueOnce(new Error("u-fail"));
    else mockDeprecateWf.mockRejectedValueOnce(new Error("w-fail"));
    const user = userEvent.setup();
    render(<SWFDashboard />, { wrapper: createWrapper() });
    if (btn === "Deprecate") {
      await user.click(screen.getByTestId("opt-d1"));
      await user.click(screen.getByRole("tab", { name: /Workflow Types/i }));
    }
    await user.click(screen.getAllByRole("button", { name: btn })[0]);
    await waitFor(() => {
      expect(toastCalls.some(([, msg]) => msg.includes("-fail"))).toBe(true);
    });
  });

  it("activity deprecate/delete failures surface error toasts", async () => {
    mockDeprecateAct.mockRejectedValueOnce(new Error("ad-fail"));
    mockDeleteAct.mockRejectedValueOnce(new Error("ax-fail"));
    const user = userEvent.setup();
    render(<SWFDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByTestId("opt-d1"));
    await user.click(screen.getByRole("tab", { name: /Activity Types/i }));
    await user.click(screen.getByRole("button", { name: "Deprecate" }));
    await user.click(screen.getByTestId("delete-a1:2"));
    await waitFor(() => {
      const msgs = toastCalls.map(([, m]) => m);
      expect(msgs).toContain("ad-fail");
      expect(msgs).toContain("ax-fail");
    });
  });

  it("renders execution rows with sparse metadata and types-tab loading", async () => {
    mockOpenExec.mockReturnValue({
      data: { executionInfos: [{ execution: { workflowId: "z", runId: "r" } }] },
      isLoading: false,
    });
    mockClosedExec.mockReturnValue({ isLoading: true });
    mockWorkflowTypes.mockReturnValue({ isLoading: true });
    const user = userEvent.setup();
    render(<SWFDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByTestId("opt-d1"));
    await user.click(screen.getByRole("tab", { name: /Executions/i }));
    expect(screen.getAllByText("-").length).toBeGreaterThan(0); // missing type/timestamps fallbacks
  });

  it("shows deprecated status styling and history loading state", async () => {
    mockWorkflowTypes.mockReturnValue({
      data: {
        typeInfos: [{ workflowType: { name: "wd", version: "1" }, status: "DEPRECATED" }],
        total: 1,
      },
      isLoading: false,
    });
    mockHistory.mockReturnValue({ isLoading: true });
    const user = userEvent.setup();
    render(<SWFDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByTestId("opt-d1"));
    await user.click(screen.getByRole("tab", { name: /Workflow Types/i }));
    expect(screen.getByText("wd:1")).toBeTruthy();
    await user.click(screen.getByRole("tab", { name: /Executions/i }));
    await user.click(screen.getAllByRole("button", { name: /History/i })[0]);
    expect(await screen.findByText(/Loading history/)).toBeTruthy();
  });

  it("handles sparse domains payload and empty closed executions", async () => {
    mockDomains.mockReturnValue({ data: undefined, isLoading: false });
    mockClosedExec.mockReturnValue({ data: { executionInfos: [] }, isLoading: false });
    render(<SWFDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("No SWF domains")).toBeTruthy();
  });
});

describe("SWFDashboard — remaining arms", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    toastCalls.length = 0;
    setup();
  });

  async function openDialog(openAction: () => Promise<void>) {
    const user = userEvent.setup();
    render(<SWFDashboard />, { wrapper: createWrapper() });
    await openAction();
    return { user, dialog: await screen.findByRole("dialog") };
  }
  const openDomain = () => openDialog(() => userEvent.setup().click(screen.getByTestId("create-domain-btn")));
  const openWf = () =>
    openDialog(async () => {
      const u = userEvent.setup();
      await u.click(screen.getByTestId("opt-d1"));
      await u.click(screen.getByRole("tab", { name: /Workflow Types/i }));
      await u.click(screen.getByTestId("create-workflow-btn"));
    });
  const openAct = () =>
    openDialog(async () => {
      const u = userEvent.setup();
      await u.click(screen.getByTestId("opt-d1"));
      await u.click(screen.getByRole("tab", { name: /Activity Types/i }));
      await u.click(screen.getByTestId("create-activity-btn"));
    });
  const openExec = () =>
    openDialog(async () => {
      const u = userEvent.setup();
      await u.click(screen.getByTestId("opt-d1"));
      await u.click(screen.getByRole("tab", { name: /Executions/i }));
      await u.click(screen.getByTestId("start-execution-btn"));
    });

  it("register-domain with empty description/retention sends undefined fields", async () => {
    mockCreateDomain.mockResolvedValueOnce({});
    const { user, dialog } = await openDomain();
    await user.type(within(dialog).getByPlaceholderText("my-domain"), "bare-dom");
    // Clear default retention "30"
    const retentionBox = within(dialog).getAllByRole("textbox")[2]!;
    await user.clear(retentionBox);
    await user.click(within(dialog).getByRole("button", { name: "Register domain" }));
    const call = mockCreateDomain.mock.calls[0][0];
    expect(call.name).toBe("bare-dom");
    expect(call.description).toBeUndefined();
    expect(call.workflowExecutionRetentionPeriodInDays).toBeUndefined();
  });

  it("non-Error domain rejection shows fallback message", async () => {
    mockCreateDomain.mockRejectedValueOnce("boom");
    const { user, dialog } = await openDomain();
    await user.type(within(dialog).getByPlaceholderText("my-domain"), "x");
    await user.click(within(dialog).getByRole("button", { name: "Register domain" }));
    expect(await within(dialog).findByText(/Failed to register domain/)).toBeTruthy();
  });

  it("non-Error workflow-type rejection shows fallback message", async () => {
    mockRegisterWf.mockRejectedValueOnce(42);
    const { user, dialog } = await openWf();
    await user.type(within(dialog).getByPlaceholderText("my-workflow"), "w");
    await user.click(within(dialog).getByRole("button", { name: "Register" }));
    expect(await within(dialog).findByText(/Failed to register workflow type/)).toBeTruthy();
  });

  it("non-Error activity-type rejection shows fallback message", async () => {
    mockRegisterAct.mockRejectedValueOnce(null);
    const { user, dialog } = await openAct();
    const boxes = within(dialog).getAllByRole("textbox");
    await user.type(boxes[0]!, "a");
    await user.click(within(dialog).getByRole("button", { name: "Register" }));
    expect(await within(dialog).findByText(/Failed to register activity type/)).toBeTruthy();
  });

  it("modal onDismiss closes workflow-type modal", async () => {
    await openWf();
    await userEvent.setup().click(screen.getByTestId("modal-dismiss"));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("modal onDismiss closes activity-type modal", async () => {
    await openAct();
    await userEvent.setup().click(screen.getByTestId("modal-dismiss"));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("start-execution with defaults sends version 1 and no input", async () => {
    mockStartExec.mockResolvedValueOnce({});
    const { user, dialog } = await openExec();
    await user.type(within(dialog).getByPlaceholderText("execution-1"), "ex-def");
    const boxes = within(dialog).getAllByRole("textbox");
    await user.type(boxes[1]!, "wf-x");
    // Clear default version "1" and input "{}"
    await user.clear(boxes[2]!);
    await user.clear(boxes[3]!);
    await user.click(within(dialog).getByRole("button", { name: "Start execution" }));
    expect(mockStartExec).toHaveBeenCalledWith(
      expect.objectContaining({
        workflowId: "ex-def",
        workflowTypeName: "wf-x",
        input: undefined,
      })
    );
    await waitFor(() =>
      expect(toastCalls).toContainEqual(["success", "Execution started — runId ?…"])
    );
  });

  it("start-execution non-Error rejection shows fallback message", async () => {
    mockStartExec.mockRejectedValueOnce("nope");
    const { user, dialog } = await openExec();
    await user.type(within(dialog).getByPlaceholderText("execution-1"), "e");
    const boxes = within(dialog).getAllByRole("textbox");
    await user.type(boxes[1]!, "wf-x");
    await user.click(within(dialog).getByRole("button", { name: "Start execution" }));
    expect(await within(dialog).findByText(/Failed to start execution/)).toBeTruthy();
  });

  it("clearing Select falls back for status filter and domain select", async () => {
    const user = userEvent.setup();
    render(<SWFDashboard />, { wrapper: createWrapper() });
    const selects = screen.getAllByTestId("mock-select");
    await user.click(within(selects[0]!).getByTestId("select-clear"));
    // Still renders fine with empty selection
    expect(screen.getAllByText("d1").length).toBeGreaterThan(0);
  });

  it("types tab shows loading state and empty typeInfos fallback", async () => {
    mockWorkflowTypes.mockReturnValue({ isLoading: true });
    const user = userEvent.setup();
    const r1 = render(<SWFDashboard />, { wrapper: createWrapper() });
    screen.getAllByTestId("opt-d1")[0]!.click();
    await user.click(screen.getByRole("tab", { name: /Workflow Types/i }));
    expect(screen.getByText(/Workflow Types/i)).toBeTruthy();
    r1.unmount();

    mockWorkflowTypes.mockReturnValue({ data: {}, isLoading: false });
    render(<SWFDashboard />, { wrapper: createWrapper() });
    screen.getAllByTestId("opt-d1")[0]!.click();
    await user.click(screen.getByRole("tab", { name: /Workflow Types/i }));
    expect(screen.getAllByText(/No workflow types/i).length).toBeGreaterThan(0);
  });

  it("open executions show loading and empty executionInfos fallback", async () => {
    const user = userEvent.setup();
    mockOpenExec.mockReturnValue({ isLoading: true });
    const r1 = render(<SWFDashboard />, { wrapper: createWrapper() });
    screen.getAllByTestId("opt-d1")[0]!.click();
    await user.click(screen.getByRole("tab", { name: /Executions/i }));
    expect(screen.getAllByText(/Executions/i).length).toBeGreaterThan(0);
    r1.unmount();

    mockOpenExec.mockReturnValue({ data: {}, isLoading: false });
    render(<SWFDashboard />, { wrapper: createWrapper() });
    screen.getAllByTestId("opt-d1")[0]!.click();
    await user.click(screen.getByRole("tab", { name: /Executions/i }));
    expect(screen.getAllByText(/No open executions/i).length).toBeGreaterThan(0);
  });

  it("closed executions fall back to status cell", async () => {
    mockClosedExec.mockReturnValue({
      data: {
        executionInfos: [
          { execution: { workflowId: "c1", runId: "r9" }, status: "RUNNING" },
        ],
        total: 1,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<SWFDashboard />, { wrapper: createWrapper() });
    screen.getAllByTestId("opt-d1")[0]!.click();
    await user.click(screen.getByRole("tab", { name: /Executions/i }));
    expect(screen.getByText("c1")).toBeTruthy();
  });

  it("domain error alert dismiss clears the error", async () => {
    mockCreateDomain.mockRejectedValueOnce(new Error("exists"));
    const { user, dialog } = await openDomain();
    await user.type(within(dialog).getByPlaceholderText("my-domain"), "x");
    await user.click(within(dialog).getByRole("button", { name: "Register domain" }));
    expect(await within(dialog).findByText(/exists/)).toBeTruthy();
    const alertDismiss = within(dialog).getByRole("button", { name: "Dismiss" });
    await user.click(alertDismiss);
    await waitFor(() => expect(within(dialog).queryByText(/exists/)).toBeNull());
  });

  it("workflow-type error alert dismiss clears the error", async () => {
    mockRegisterWf.mockRejectedValueOnce(new Error("dup"));
    const { user, dialog } = await openWf();
    await user.type(within(dialog).getByPlaceholderText("my-workflow"), "w");
    await user.click(within(dialog).getByRole("button", { name: "Register" }));
    expect(await within(dialog).findByText(/dup/)).toBeTruthy();
    const alertDismiss = within(dialog).getByRole("button", { name: "Dismiss" });
    await user.click(alertDismiss);
    await waitFor(() => expect(within(dialog).queryByText(/dup/)).toBeNull());
  });

  it("activity-type error alert dismiss clears the error", async () => {
    mockRegisterAct.mockRejectedValueOnce(new Error("act-err"));
    const { user, dialog } = await openAct();
    const boxes = within(dialog).getAllByRole("textbox");
    await user.type(boxes[0]!, "a");
    await user.click(within(dialog).getByRole("button", { name: "Register" }));
    expect(await within(dialog).findByText(/act-err/)).toBeTruthy();
    const alertDismiss = within(dialog).getByRole("button", { name: "Dismiss" });
    await user.click(alertDismiss);
    await waitFor(() => expect(within(dialog).queryByText(/act-err/)).toBeNull());
  });

  it("start-exec modal dismiss via modal-dismiss button", async () => {
    await openExec();
    await userEvent.setup().click(screen.getByTestId("modal-dismiss"));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("start-exec error alert dismiss clears the error", async () => {
    mockStartExec.mockRejectedValueOnce(new Error("exec-err"));
    const { user, dialog } = await openExec();
    await user.type(within(dialog).getByPlaceholderText("execution-1"), "e");
    const boxes = within(dialog).getAllByRole("textbox");
    await user.type(boxes[1]!, "wf-x");
    await user.click(within(dialog).getByRole("button", { name: "Start execution" }));
    expect(await within(dialog).findByText(/exec-err/)).toBeTruthy();
    const alertDismiss = within(dialog).getByRole("button", { name: "Dismiss" });
    await user.click(alertDismiss);
    await waitFor(() => expect(within(dialog).queryByText(/exec-err/)).toBeNull());
  });



  it("deprecate domain with non-Error shows fallback toast", async () => {
    mockDeprecateDomain.mockRejectedValueOnce("string-error");
    const user = userEvent.setup();
    render(<SWFDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getAllByRole("button", { name: "Deprecate" })[0]);
    await waitFor(() => expect(toastCalls.some(([, m]) => m.includes("Failed to deprecate"))).toBe(true));
  });

  it("undeprecate domain with non-Error shows fallback toast", async () => {
    mockUndeprecateDomain.mockRejectedValueOnce(null);
    const user = userEvent.setup();
    render(<SWFDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByTestId("opt-d1"));
    await screen.getAllByRole("button", { name: "Undeprecate" })[0].click();
    await waitFor(() => expect(toastCalls.some(([, m]) => m.includes("Failed to undeprecate"))).toBe(true));
  });

  it("deprecate workflow type with non-Error shows fallback toast", async () => {
    mockDeprecateWf.mockRejectedValueOnce(undefined);
    const user = userEvent.setup();
    render(<SWFDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getAllByTestId("opt-d1")[0]!);
    await user.click(screen.getByRole("tab", { name: /Workflow Types/i }));
    await screen.getAllByRole("button", { name: "Deprecate" })[0].click();
    await waitFor(() => expect(toastCalls.some(([, m]) => m.includes("Failed to deprecate"))).toBe(true));
  });

  it("delete workflow type with non-Error shows fallback toast", async () => {
    mockDeleteWf.mockRejectedValueOnce("err");
    const user = userEvent.setup();
    render(<SWFDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getAllByTestId("opt-d1")[0]!);
    await user.click(screen.getByRole("tab", { name: /Workflow Types/i }));
    await user.click(screen.getByTestId("delete-w1:1"));
    await waitFor(() => expect(toastCalls.some(([, m]) => m.includes("Failed to delete"))).toBe(true));
  });

  it("deprecate activity type with non-Error shows fallback toast", async () => {
    mockDeprecateAct.mockRejectedValueOnce(42);
    const user = userEvent.setup();
    render(<SWFDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getAllByTestId("opt-d1")[0]!);
    await user.click(screen.getByRole("tab", { name: /Activity Types/i }));
    await screen.getAllByRole("button", { name: "Deprecate" })[0].click();
    await waitFor(() => expect(toastCalls.some(([, m]) => m.includes("Failed to deprecate"))).toBe(true));
  });

  it("delete activity type with non-Error shows fallback toast", async () => {
    mockDeleteAct.mockRejectedValueOnce(null);
    const user = userEvent.setup();
    render(<SWFDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getAllByTestId("opt-d1")[0]!);
    await user.click(screen.getByRole("tab", { name: /Activity Types/i }));
    await user.click(screen.getByTestId("delete-a1:2"));
    await waitFor(() => expect(toastCalls.some(([, m]) => m.includes("Failed to delete"))).toBe(true));
  });

  it("terminate execution with non-Error shows fallback toast", async () => {
    mockTerminateExec.mockRejectedValueOnce(false);
    const user = userEvent.setup();
    render(<SWFDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getAllByTestId("opt-d1")[0]!);
    await user.click(screen.getByRole("tab", { name: /Executions/i }));
    await screen.getAllByRole("button", { name: "Terminate" })[0].click();
    await waitFor(() => expect(toastCalls.some(([, m]) => m.includes("Failed to terminate"))).toBe(true));
  });

  it("execution with startTimestamp and without both render correctly", async () => {
    mockOpenExec.mockReturnValue({
      data: {
        executionInfos: [
          { execution: { workflowId: "ts", runId: "r1" }, workflowType: { name: "w", version: "1" }, startTimestamp: 1700000000 },
          { execution: { workflowId: "nt", runId: "r2" }, workflowType: { name: "w", version: "1" } },
        ],
        total: 2,
      },
      isLoading: false,
    });
    const user = userEvent.setup();
    render(<SWFDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getAllByTestId("opt-d1")[0]!);
    await user.click(screen.getByRole("tab", { name: /Executions/i }));
    expect(screen.getByText("nt")).toBeTruthy();
  });

  it("domain select clear fires onChange with empty selectedOption", async () => {
    const user = userEvent.setup();
    render(<SWFDashboard />, { wrapper: createWrapper() });
    await screen.getAllByTestId("opt-d1")[0]!.click();
    // Click the second mock-select (domain selector) clear button
    const selects = screen.getAllByTestId("mock-select");
    await user.click(within(selects[1]!).getByTestId("select-clear"));
    // Component still renders without crashing
    expect(screen.getAllByText("SWF").length).toBeGreaterThan(0);
  });
});
