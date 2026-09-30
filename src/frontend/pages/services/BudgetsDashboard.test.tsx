// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { clickButton, createWrapper } from "../../../test/helpers";
import React from "react";

const mockHooks = vi.hoisted(() => ({
  useBudgets: vi.fn(),
  useCreateBudget: vi.fn(),
  useDeleteBudget: vi.fn(),
  useBudgetNotifications: vi.fn(),
  useCreateBudgetNotification: vi.fn(),
  useDeleteBudgetNotification: vi.fn(),
  useBudgetSubscribers: vi.fn(),
  useCreateBudgetSubscriber: vi.fn(),
  useDeleteBudgetSubscriber: vi.fn(),
  useBudgetActions: vi.fn(),
  useCreateBudgetAction: vi.fn(),
  useDeleteBudgetAction: vi.fn(),
  useExecuteBudgetAction: vi.fn(),
}));

vi.mock("../../hooks/useBudgets", () => mockHooks);

const mockCreateBudget = vi.fn();
const mockDeleteBudget = vi.fn();
const mockCreateNotification = vi.fn();
const mockDeleteNotification = vi.fn();
const mockCreateSubscriber = vi.fn();
const mockDeleteSubscriber = vi.fn();
const mockCreateAction = vi.fn();
const mockDeleteAction = vi.fn();
const mockExecuteAction = vi.fn();

function okMutation(mock: ReturnType<typeof vi.fn>, isPending = false) {
  return { mutateAsync: mock, isPending };
}

function listQuery(overrides: Record<string, unknown> = {}) {
  return {
    data: { budgets: [], total: 0 },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  };
}

const NOTIFICATION = {
  NotificationType: "ACTUAL",
  ComparisonOperator: "GREATER_THAN",
  Threshold: 80,
  ThresholdType: "PERCENTAGE",
};
const SUBSCRIBER = { SubscriptionType: "EMAIL", Address: "ops@example.com" };
const ACTION = {
  ActionId: "a-1",
  ActionType: "APPLY_IAM_POLICY",
  Status: "STANDBY",
  ActionThreshold: { ActionThresholdValue: 100, ActionThresholdType: "PERCENTAGE" },
};

import BudgetsDashboard from "./BudgetsDashboard";

function modalDialog(header: string): HTMLElement {
  const dialog = screen
    .getAllByText(header)
    .map((t) => t.closest('[role="dialog"]'))
    .find((d) => d) as HTMLElement;
  return dialog;
}

function setupDetail(overrides: Record<string, Record<string, unknown>> = {}) {
  const notifications = overrides.notifications ?? {
    data: { notifications: [NOTIFICATION], total: 1 },
    isLoading: false,
  };
  const subscribers = overrides.subscribers ?? {
    data: { subscribers: [SUBSCRIBER], total: 1 },
    isLoading: false,
  };
  const actions = overrides.actions ?? {
    data: { actions: [ACTION], total: 1 },
    isLoading: false,
  };
  mockHooks.useBudgets.mockReturnValue(
    listQuery({
      data: {
        budgets: [{ BudgetName: "monthly", BudgetType: "COST", TimeUnit: "MONTHLY" }],
        total: 1,
      },
    })
  );
  mockHooks.useBudgetNotifications.mockReturnValue(notifications);
  mockHooks.useBudgetSubscribers.mockReturnValue(subscribers);
  mockHooks.useBudgetActions.mockReturnValue(actions);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockHooks.useCreateBudget.mockReturnValue(okMutation(mockCreateBudget));
  mockHooks.useDeleteBudget.mockReturnValue(okMutation(mockDeleteBudget));
  mockHooks.useCreateBudgetNotification.mockReturnValue(okMutation(mockCreateNotification));
  mockHooks.useDeleteBudgetNotification.mockReturnValue(okMutation(mockDeleteNotification));
  mockHooks.useCreateBudgetSubscriber.mockReturnValue(okMutation(mockCreateSubscriber));
  mockHooks.useDeleteBudgetSubscriber.mockReturnValue(okMutation(mockDeleteSubscriber));
  mockHooks.useCreateBudgetAction.mockReturnValue(okMutation(mockCreateAction));
  mockHooks.useDeleteBudgetAction.mockReturnValue(okMutation(mockDeleteAction));
  mockHooks.useExecuteBudgetAction.mockReturnValue(okMutation(mockExecuteAction));
});

describe("BudgetsDashboard — list view", () => {
  it("renders budgets with limit and spend", async () => {
    mockHooks.useBudgets.mockReturnValue(
      listQuery({
        data: {
          budgets: [
            {
              BudgetName: "monthly",
              BudgetType: "COST",
              TimeUnit: "MONTHLY",
              BudgetLimit: { Amount: "100", Unit: "USD" },
              CalculatedSpend: { ActualSpend: { Amount: "50", Unit: "USD" } },
            },
          ],
          total: 1,
        },
      })
    );
    render(<BudgetsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("monthly")).toBeTruthy());
    expect(screen.getAllByText("COST").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("100 USD")).toBeTruthy();
    expect(screen.getByText("50 USD")).toBeTruthy();
  });

  it("renders dash fallbacks when limit and spend are absent", async () => {
    mockHooks.useBudgets.mockReturnValue(
      listQuery({
        data: {
          budgets: [{ BudgetName: "bare", BudgetType: "USAGE", TimeUnit: "DAILY" }],
          total: 1,
        },
      })
    );
    render(<BudgetsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("bare")).toBeTruthy());
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  it("shows the empty table message when no budgets exist", () => {
    mockHooks.useBudgets.mockReturnValue(listQuery());
    render(<BudgetsDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("No budgets found")).toBeTruthy();
  });

  it("renders with undefined query data (loading)", () => {
    mockHooks.useBudgets.mockReturnValue(
      listQuery({ data: undefined, isLoading: true })
    );
    render(<BudgetsDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Budgets")).toBeTruthy();
  });

  it("shows the error alert with fallback message", () => {
    mockHooks.useBudgets.mockReturnValue(
      listQuery({ isError: true, error: null })
    );
    render(<BudgetsDashboard />, { wrapper: createWrapper() });
    expect(screen.getByText("Failed to load budgets")).toBeTruthy();
  });

  it("creates a budget without limit and shows the success alert", async () => {
    const user = userEvent.setup();
    mockCreateBudget.mockResolvedValueOnce({ ok: true });
    render(<BudgetsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create budget/i }));
    const nameInput = screen.getByPlaceholderText("monthly-spend");
    await user.type(nameInput, "monthly");
    await user.click(screen.getByRole("button", { name: /^Create$/i }));
    await waitFor(() =>
      expect(mockCreateBudget).toHaveBeenCalledWith({
        BudgetName: "monthly",
        BudgetType: "COST",
        TimeUnit: "MONTHLY",
      })
    );
    await waitFor(() =>
      expect(screen.getByText("Budget monthly created.")).toBeTruthy()
    );
  });

  it("includes the limit when amount is set and dismisses the success alert", async () => {
    const user = userEvent.setup();
    mockCreateBudget.mockResolvedValueOnce({ ok: true });
    render(<BudgetsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create budget/i }));
    await user.type(screen.getByPlaceholderText("monthly-spend"), "monthly");
    await user.type(screen.getByPlaceholderText("100"), "200");
    await user.click(screen.getByRole("button", { name: /^Create$/i }));
    await waitFor(() =>
      expect(mockCreateBudget).toHaveBeenCalledWith({
        BudgetName: "monthly",
        BudgetType: "COST",
        TimeUnit: "MONTHLY",
        BudgetLimit: { Amount: "200", Unit: "USD" },
      })
    );
    await waitFor(() =>
      expect(screen.getByText("Budget monthly created.")).toBeTruthy()
    );
    const dismiss = document.querySelector('[class*="awsui_dismiss-button"]') as HTMLElement;
    fireEvent.click(dismiss);
    await waitFor(() =>
      expect(screen.queryByText("Budget monthly created.")).toBeNull()
    );
  });

  it("shows a fallback error alert when create fails", async () => {
    const user = userEvent.setup();
    mockCreateBudget.mockRejectedValueOnce({});
    render(<BudgetsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create budget/i }));
    await user.type(screen.getByPlaceholderText("monthly-spend"), "monthly");
    await user.click(screen.getByRole("button", { name: /^Create$/i }));
    await waitFor(() =>
      expect(screen.getByText("Failed to create budget")).toBeTruthy()
    );
  });

  it("keeps Create disabled until a name is typed", async () => {
    const user = userEvent.setup();
    render(<BudgetsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create budget/i }));
    const createBtn = screen.getByRole("button", { name: /^Create$/i }) as HTMLButtonElement;
    expect(createBtn.disabled).toBe(true);
    await user.type(screen.getByPlaceholderText("monthly-spend"), "m");
    expect(createBtn.disabled).toBe(false);
  });

  it("changes type/time-unit selects and limit unit in the create modal", async () => {
    const user = userEvent.setup();
    render(<BudgetsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create budget/i }));
    await user.click(screen.getAllByText("COST")[0]);
    await user.click(screen.getByRole("option", { name: "USAGE" }));
    await user.click(screen.getAllByText("MONTHLY")[0]);
    await user.click(screen.getByRole("option", { name: "DAILY" }));
    const unitInput = screen.getByDisplayValue("USD");
    await user.type(unitInput, "EUR");
    await waitFor(() => expect(screen.getAllByText("USAGE").length).toBeGreaterThanOrEqual(1));
  });

  it("deletes a budget after confirmation", async () => {
    const user = userEvent.setup();
    mockDeleteBudget.mockResolvedValueOnce({ ok: true });
    mockHooks.useBudgets.mockReturnValue(
      listQuery({
        data: {
          budgets: [{ BudgetName: "monthly", BudgetType: "COST", TimeUnit: "MONTHLY" }],
          total: 1,
        },
      })
    );
    render(<BudgetsDashboard />, { wrapper: createWrapper() });
    await waitFor(() => expect(screen.getByText("monthly")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete monthly/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() => expect(mockDeleteBudget).toHaveBeenCalledWith("monthly"));
  });

  it("closes the create modal with Cancel", async () => {
    const user = userEvent.setup();
    render(<BudgetsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /Create budget/i }));
    const dlg = modalDialog("Create budget");
    await user.click(within(dlg).getByRole("button", { name: /^Cancel$/i }));
    await waitFor(() => expect(dlg.className).toContain("hidden"));
  });
});

describe("BudgetsDashboard — detail view", () => {
  function setupForDetail() {
    setupDetail();
    render(<BudgetsDashboard />, { wrapper: createWrapper() });
  }

  it("navigates to detail and shows notifications and actions", async () => {
    const user = userEvent.setup();
    setupForDetail();
    await user.click(screen.getByRole("button", { name: /^View$/i }));
    await waitFor(() =>
      expect(screen.getByText("Back to budgets")).toBeTruthy()
    );
    await user.click(screen.getByRole("tab", { name: /Notifications/i }));
    await waitFor(() => expect(screen.getAllByText("GREATER_THAN").length).toBeGreaterThanOrEqual(1));
    await user.click(screen.getByRole("tab", { name: /Actions/i }));
    await waitFor(() => expect(screen.getByText("a-1")).toBeTruthy());
  });

  it("returns to the list from the detail back button", async () => {
    const user = userEvent.setup();
    setupForDetail();
    await user.click(screen.getByRole("button", { name: /^View$/i }));
    await waitFor(() => expect(screen.getByText("Back to budgets")).toBeTruthy());
    await user.click(screen.getByText("Back to budgets"));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Create budget/i })).toBeTruthy()
    );
  });

  it("creates a notification and dismisses the success alert", async () => {
    const user = userEvent.setup();
    mockCreateNotification.mockResolvedValueOnce({ ok: true });
    setupForDetail();
    await user.click(screen.getByRole("button", { name: /^View$/i }));
    await user.click(screen.getByRole("tab", { name: /Notifications/i }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Create notification/i })).toBeTruthy()
    );
    await user.click(screen.getByRole("button", { name: /Create notification/i }));
    const dlg = modalDialog("Create notification");
    await user.type(within(dlg).getByPlaceholderText("owner@example.com"), "ops@example.com");
    await user.click(within(dlg).getByRole("button", { name: /^Create$/i }));
    await waitFor(() =>
      expect(mockCreateNotification).toHaveBeenCalledWith({
        budgetName: "monthly",
        notification: {
          NotificationType: "ACTUAL",
          ComparisonOperator: "GREATER_THAN",
          Threshold: 80,
          ThresholdType: "PERCENTAGE",
        },
        subscribers: [{ SubscriptionType: "EMAIL", Address: "ops@example.com" }],
      })
    );
    await waitFor(() => expect(screen.getByText("Notification created.")).toBeTruthy());
    const dismiss = document.querySelector('[class*="awsui_dismiss-button"]') as HTMLElement;
    fireEvent.click(dismiss);
    await waitFor(() =>
      expect(screen.queryByText("Notification created.")).toBeNull()
    );
  });

  it("shows a fallback error alert when notification creation fails", async () => {
    const user = userEvent.setup();
    mockCreateNotification.mockRejectedValueOnce({});
    setupForDetail();
    await user.click(screen.getByRole("button", { name: /^View$/i }));
    await user.click(screen.getByRole("tab", { name: /Notifications/i }));
    await user.click(screen.getByRole("button", { name: /Create notification/i }));
    const dlg = modalDialog("Create notification");
    await user.type(within(dlg).getByPlaceholderText("owner@example.com"), "ops@example.com");
    await user.click(within(dlg).getByRole("button", { name: /^Create$/i }));
    await waitFor(() =>
      expect(screen.getByText("Failed to create notification")).toBeTruthy()
    );
  });

  it("opens subscribers panel and adds a subscriber", async () => {
    const user = userEvent.setup();
    mockCreateSubscriber.mockResolvedValueOnce({ ok: true });
    setupForDetail();
    await user.click(screen.getByRole("button", { name: /^View$/i }));
    await user.click(screen.getByRole("tab", { name: /Notifications/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: /^Subscribers$/i })).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Subscribers$/i }));
    await waitFor(() => expect(screen.getByText("Add subscriber")).toBeTruthy());
    const input = screen.getByPlaceholderText("add-subscriber@example.com");
    await user.type(input, "new@example.com");
    await user.click(screen.getByRole("button", { name: /Add subscriber/i }));
    await waitFor(() =>
      expect(mockCreateSubscriber).toHaveBeenCalledWith({
        budgetName: "monthly",
        notification: NOTIFICATION,
        subscriber: { SubscriptionType: "EMAIL", Address: "new@example.com" },
      })
    );
  });

  it("keeps Add subscriber disabled until an email is typed", async () => {
    const user = userEvent.setup();
    setupForDetail();
    await user.click(screen.getByRole("button", { name: /^View$/i }));
    await user.click(screen.getByRole("tab", { name: /Notifications/i }));
    await user.click(screen.getByRole("button", { name: /^Subscribers$/i }));
    await waitFor(() => expect(screen.getByText("Add subscriber")).toBeTruthy());
    const addBtn = screen.getByRole("button", { name: /Add subscriber/i }) as HTMLButtonElement;
    expect(addBtn.disabled).toBe(true);
  });

  it("closes the subscribers panel", async () => {
    const user = userEvent.setup();
    setupForDetail();
    await user.click(screen.getByRole("button", { name: /^View$/i }));
    await user.click(screen.getByRole("tab", { name: /Notifications/i }));
    await user.click(screen.getByRole("button", { name: /^Subscribers$/i }));
    await waitFor(() => expect(screen.getByText("Add subscriber")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /^Close$/i }));
    await waitFor(() => expect(screen.queryByText("Add subscriber")).toBeNull());
  });

  it("creates an action with policy, role and subscriber", async () => {
    const user = userEvent.setup();
    mockCreateAction.mockResolvedValueOnce({ actionId: "a-1" });
    setupForDetail();
    await user.click(screen.getByRole("button", { name: /^View$/i }));
    await user.click(screen.getByRole("tab", { name: /Actions/i }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Create action/i })).toBeTruthy()
    );
    await user.click(screen.getByRole("button", { name: /Create action/i }));
    const dlg = modalDialog("Create action");
    const inputs = dlg.querySelectorAll("input");
    await user.type(inputs[0] as HTMLElement, "arn:aws:iam::aws:policy/p");
    await user.type(inputs[1] as HTMLElement, "arn:aws:iam::aws:role/r");
    await user.type(inputs[2] as HTMLElement, "ops@example.com");
    await user.click(within(dlg).getByRole("button", { name: /^Create$/i }));
    await waitFor(() =>
      expect(mockCreateAction).toHaveBeenCalledWith({
        budgetName: "monthly",
        actionType: "APPLY_IAM_POLICY",
        notificationType: "ACTUAL",
        actionThreshold: { ActionThresholdValue: 80, ActionThresholdType: "PERCENTAGE" },
        definition: { IamActionDefinition: { PolicyArn: "arn:aws:iam::aws:policy/p" } },
        executionRoleArn: "arn:aws:iam::aws:role/r",
        approvalModel: "AUTOMATIC",
        subscribers: [{ SubscriptionType: "EMAIL", Address: "ops@example.com" }],
      })
    );
    await waitFor(() => expect(screen.getByText("Action created.")).toBeTruthy());
  });

  it("keeps Create action disabled until fields are filled and closes on Cancel", async () => {
    const user = userEvent.setup();
    setupForDetail();
    await user.click(screen.getByRole("button", { name: /^View$/i }));
    await user.click(screen.getByRole("tab", { name: /Actions/i }));
    await user.click(screen.getByRole("button", { name: /Create action/i }));
    const dlg = modalDialog("Create action");
    const createBtn = Array.from(dlg.querySelectorAll("button")).find(
      (b) => b.textContent === "Create"
    ) as HTMLButtonElement;
    expect(createBtn.disabled).toBe(true);
    await user.click(within(dlg).getByRole("button", { name: /^Cancel$/i }));
    await waitFor(() => expect(dlg.className).toContain("hidden"));
  });

  it("shows a fallback error alert when action creation fails", async () => {
    const user = userEvent.setup();
    mockCreateAction.mockRejectedValueOnce({});
    setupForDetail();
    await user.click(screen.getByRole("button", { name: /^View$/i }));
    await user.click(screen.getByRole("tab", { name: /Actions/i }));
    await user.click(screen.getByRole("button", { name: /Create action/i }));
    const dlg = modalDialog("Create action");
    const inputs = dlg.querySelectorAll("input");
    await user.type(inputs[0] as HTMLElement, "p");
    await user.type(inputs[1] as HTMLElement, "r");
    await user.type(inputs[2] as HTMLElement, "e@x.com");
    await user.click(within(dlg).getByRole("button", { name: /^Create$/i }));
    await waitFor(() =>
      expect(screen.getByText("Failed to create action")).toBeTruthy()
    );
  });

  it("deletes a notification after confirmation", async () => {
    const user = userEvent.setup();
    mockDeleteNotification.mockResolvedValueOnce({ ok: true });
    setupForDetail();
    await user.click(screen.getByRole("button", { name: /^View$/i }));
    await user.click(screen.getByRole("tab", { name: /Notifications/i }));
    await waitFor(() => expect(screen.getAllByText("GREATER_THAN").length).toBeGreaterThanOrEqual(1));
    await user.click(screen.getByRole("button", { name: /Delete ACTUAL GREATER_THAN/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() =>
      expect(mockDeleteNotification).toHaveBeenCalledWith({
        budgetName: "monthly",
        notification: NOTIFICATION,
      })
    );
  });

  it("deletes a subscriber after confirmation", async () => {
    const user = userEvent.setup();
    mockDeleteSubscriber.mockResolvedValueOnce({ ok: true });
    setupForDetail();
    await user.click(screen.getByRole("button", { name: /^View$/i }));
    await user.click(screen.getByRole("tab", { name: /Notifications/i }));
    await user.click(screen.getByRole("button", { name: /^Subscribers$/i }));
    await waitFor(() => expect(screen.getByText("Add subscriber")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete ops@example.com/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() =>
      expect(mockDeleteSubscriber).toHaveBeenCalledWith({
        budgetName: "monthly",
        notification: NOTIFICATION,
        subscriber: SUBSCRIBER,
      })
    );
  });

  it("changes notification type and comparison selects, types threshold, cancels", async () => {
    const user = userEvent.setup();
    setupForDetail();
    await user.click(screen.getByRole("button", { name: /^View$/i }));
    await user.click(screen.getByRole("tab", { name: /Notifications/i }));
    await user.click(screen.getByRole("button", { name: /Create notification/i }));
    const dlg = modalDialog("Create notification");
    await user.click(within(dlg).getAllByText("ACTUAL")[0]);
    await user.click(screen.getByRole("option", { name: "FORECASTED" }));
    await user.click(within(dlg).getAllByText("GREATER_THAN")[0]);
    await user.click(screen.getByRole("option", { name: "LESS_THAN" }));
    await user.type(within(dlg).getByDisplayValue("80"), "95");
    await user.click(within(dlg).getByRole("button", { name: /^Cancel$/i }));
    await waitFor(() => expect(dlg.className).toContain("hidden"));
  });

  it("closes the notification modal via dismiss and opens the action modal", async () => {
    const user = userEvent.setup();
    setupForDetail();
    await user.click(screen.getByRole("button", { name: /^View$/i }));
    await user.click(screen.getByRole("tab", { name: /Notifications/i }));
    await user.click(screen.getByRole("button", { name: /Create notification/i }));
    const dlg = modalDialog("Create notification");
    document.querySelectorAll('[class*="awsui_dialog"]').forEach((d) => {
      fireEvent.keyDown(d as HTMLElement, { keyCode: 27, key: "Escape" });
    });
    await waitFor(() => expect(dlg.className).toContain("hidden"));
  });

  it("approves an action", async () => {
    const user = userEvent.setup();
    mockExecuteAction.mockResolvedValueOnce({ executionType: "APPROVE_BUDGET_ACTION" });
    setupForDetail();
    await user.click(screen.getByRole("button", { name: /^View$/i }));
    await user.click(screen.getByRole("tab", { name: /Actions/i }));
    await waitFor(() => expect(screen.getByText("a-1")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Approve/i }));
    await waitFor(() =>
      expect(mockExecuteAction).toHaveBeenCalledWith({
        budgetName: "monthly",
        actionId: "a-1",
        executionType: "APPROVE_BUDGET_ACTION",
      })
    );
  });

  it("deletes an action after confirmation", async () => {
    const user = userEvent.setup();
    mockDeleteAction.mockResolvedValueOnce({ ok: true });
    setupForDetail();
    await user.click(screen.getByRole("button", { name: /^View$/i }));
    await user.click(screen.getByRole("tab", { name: /Actions/i }));
    await waitFor(() => expect(screen.getByText("a-1")).toBeTruthy());
    await user.click(screen.getByRole("button", { name: /Delete a-1/i }));
    await waitFor(() => expect(screen.getByText(/Are you sure/)).toBeTruthy());
    await clickButton(user, /^Delete$/i);
    await waitFor(() =>
      expect(mockDeleteAction).toHaveBeenCalledWith({ budgetName: "monthly", actionId: "a-1" })
    );
  });

  it("changes the action type select and cancels the action modal", async () => {
    const user = userEvent.setup();
    setupForDetail();
    await user.click(screen.getByRole("button", { name: /^View$/i }));
    await user.click(screen.getByRole("tab", { name: /Actions/i }));
    await user.click(screen.getByRole("button", { name: /Create action/i }));
    const dlg = modalDialog("Create action");
    await user.click(within(dlg).getAllByText("APPLY_IAM_POLICY")[0]);
    await user.click(screen.getByRole("option", { name: "APPLY_IAM_POLICY" }));
    await user.click(within(dlg).getByRole("button", { name: /^Cancel$/i }));
    await waitFor(() => expect(dlg.className).toContain("hidden"));
  });

  it("renders empty detail tables when query data is undefined", async () => {
    const user = userEvent.setup();
    setupDetail({
      notifications: { data: undefined, isLoading: false },
      subscribers: {
        data: { subscribers: [SUBSCRIBER], total: 1 },
        isLoading: false,
      },
      actions: { data: undefined, isLoading: true },
    });
    render(<BudgetsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /^View$/i }));
    await user.click(screen.getByRole("tab", { name: /Notifications/i }));
    await waitFor(() => expect(screen.getByText("No notifications found")).toBeTruthy());
  });

  it("renders dash fallbacks for a sparse notification row", async () => {
    const user = userEvent.setup();
    setupDetail({
      notifications: {
        data: { notifications: [{}], total: 1 },
        isLoading: false,
      },
      subscribers: { data: undefined, isLoading: true },
      actions: { data: undefined, isLoading: true },
    });
    render(<BudgetsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /^View$/i }));
    await user.click(screen.getByRole("tab", { name: /Notifications/i }));
    await waitFor(() => expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(2));
    expect(screen.getByText("—%")).toBeTruthy();
  });

  it("renders dash threshold for actions without ActionThreshold", async () => {
    const user = userEvent.setup();
    setupDetail({
      actions: {
        data: {
          actions: [{ ActionId: "a-2", ActionType: "APPLY_IAM_POLICY", Status: "STANDBY" }],
          total: 1,
        },
        isLoading: false,
      },
    });
    render(<BudgetsDashboard />, { wrapper: createWrapper() });
    await user.click(screen.getByRole("button", { name: /^View$/i }));
    await user.click(screen.getByRole("tab", { name: /Actions/i }));
    await waitFor(() => expect(screen.getByText("a-2")).toBeTruthy());
  });
});
