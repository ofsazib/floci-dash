// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const mockApi = vi.fn();
vi.mock("../lib/client", () => ({
  api: (...args: any[]) => mockApi(...args),
}));

import {
  useBudgets,
  useCreateBudget,
  useDeleteBudget,
  useBudgetNotifications,
  useCreateBudgetNotification,
  useDeleteBudgetNotification,
  useBudgetSubscribers,
  useCreateBudgetSubscriber,
  useDeleteBudgetSubscriber,
  useBudgetActions,
  useCreateBudgetAction,
  useDeleteBudgetAction,
  useExecuteBudgetAction,
} from "./useBudgets";

const NOTIFICATION = {
  NotificationType: "ACTUAL",
  ComparisonOperator: "GREATER_THAN",
  Threshold: 80,
  ThresholdType: "PERCENTAGE",
};
const SUBSCRIBER = { SubscriptionType: "EMAIL", Address: "ops@example.com" };

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useBudgets", () => {
  it("fetches budgets list", async () => {
    mockApi.mockResolvedValueOnce({ budgets: [{ BudgetName: "monthly" }], total: 1 });
    const { result } = renderHook(() => useBudgets(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/budgets");
  });
});

describe("useCreateBudget", () => {
  it("POSTs the budget body", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useCreateBudget(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ BudgetName: "monthly", BudgetType: "COST" });
    expect(mockApi).toHaveBeenCalledWith("/aws/budgets", {
      method: "POST",
      body: JSON.stringify({ budget: { BudgetName: "monthly", BudgetType: "COST" } }),
    });
  });
});

describe("useDeleteBudget", () => {
  it("DELETEs with encoded name", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useDeleteBudget(), { wrapper: createWrapper() });
    await result.current.mutateAsync("my budget");
    expect(mockApi).toHaveBeenCalledWith("/aws/budgets/my%20budget", { method: "DELETE" });
  });
});

describe("useBudgetNotifications", () => {
  it("fetches notifications with encoded name", async () => {
    mockApi.mockResolvedValueOnce({ notifications: [NOTIFICATION], total: 1 });
    const { result } = renderHook(() => useBudgetNotifications("my budget"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/budgets/my%20budget/notifications");
  });

  it("does not fetch when budgetName is null", () => {
    renderHook(() => useBudgetNotifications(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });
});

describe("useCreateBudgetNotification", () => {
  it("POSTs notification and subscribers", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useCreateBudgetNotification(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({
      budgetName: "monthly",
      notification: NOTIFICATION,
      subscribers: [SUBSCRIBER],
    });
    expect(mockApi).toHaveBeenCalledWith("/aws/budgets/monthly/notifications", {
      method: "POST",
      body: JSON.stringify({ notification: NOTIFICATION, subscribers: [SUBSCRIBER] }),
    });
  });
});

describe("useDeleteBudgetNotification", () => {
  it("DELETEs the notification body", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useDeleteBudgetNotification(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({ budgetName: "monthly", notification: NOTIFICATION });
    expect(mockApi).toHaveBeenCalledWith("/aws/budgets/monthly/notifications", {
      method: "DELETE",
      body: JSON.stringify({ notification: NOTIFICATION }),
    });
  });
});

describe("useBudgetSubscribers", () => {
  it("fetches subscribers with encoded notification JSON", async () => {
    mockApi.mockResolvedValueOnce({ subscribers: [SUBSCRIBER], total: 1 });
    const { result } = renderHook(() => useBudgetSubscribers("monthly", NOTIFICATION), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith(
      `/aws/budgets/monthly/subscribers?notification=${encodeURIComponent(JSON.stringify(NOTIFICATION))}`
    );
  });

  it("does not fetch when notification is null", () => {
    renderHook(() => useBudgetSubscribers("monthly", null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });
});

describe("useCreateBudgetSubscriber", () => {
  it("POSTs notification and subscriber", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useCreateBudgetSubscriber(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({
      budgetName: "monthly",
      notification: NOTIFICATION,
      subscriber: SUBSCRIBER,
    });
    expect(mockApi).toHaveBeenCalledWith("/aws/budgets/monthly/subscribers", {
      method: "POST",
      body: JSON.stringify({ notification: NOTIFICATION, subscriber: SUBSCRIBER }),
    });
  });
});

describe("useDeleteBudgetSubscriber", () => {
  it("DELETEs notification and subscriber", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useDeleteBudgetSubscriber(), {
      wrapper: createWrapper(),
    });
    await result.current.mutateAsync({
      budgetName: "monthly",
      notification: NOTIFICATION,
      subscriber: SUBSCRIBER,
    });
    expect(mockApi).toHaveBeenCalledWith("/aws/budgets/monthly/subscribers", {
      method: "DELETE",
      body: JSON.stringify({ notification: NOTIFICATION, subscriber: SUBSCRIBER }),
    });
  });
});

describe("useBudgetActions", () => {
  it("fetches actions with encoded name", async () => {
    mockApi.mockResolvedValueOnce({ actions: [{ ActionId: "a-1" }], total: 1 });
    const { result } = renderHook(() => useBudgetActions("my budget"), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockApi).toHaveBeenCalledWith("/aws/budgets/my%20budget/actions");
  });

  it("does not fetch when budgetName is null", () => {
    renderHook(() => useBudgetActions(null), { wrapper: createWrapper() });
    expect(mockApi).not.toHaveBeenCalled();
  });
});

describe("useCreateBudgetAction", () => {
  it("POSTs action body without budgetName", async () => {
    mockApi.mockResolvedValueOnce({ actionId: "a-1" });
    const { result } = renderHook(() => useCreateBudgetAction(), { wrapper: createWrapper() });
    await result.current.mutateAsync({
      budgetName: "monthly",
      actionType: "APPLY_IAM_POLICY",
      notificationType: "ACTUAL",
      actionThreshold: { ActionThresholdValue: 100, ActionThresholdType: "PERCENTAGE" },
      definition: { IamActionDefinition: { PolicyArn: "arn:aws:iam::aws:policy/p" } },
      executionRoleArn: "arn:aws:iam::aws:role/r",
      approvalModel: "AUTOMATIC",
      subscribers: [SUBSCRIBER],
    });
    expect(mockApi).toHaveBeenCalledWith("/aws/budgets/monthly/actions", {
      method: "POST",
      body: JSON.stringify({
        actionType: "APPLY_IAM_POLICY",
        notificationType: "ACTUAL",
        actionThreshold: { ActionThresholdValue: 100, ActionThresholdType: "PERCENTAGE" },
        definition: { IamActionDefinition: { PolicyArn: "arn:aws:iam::aws:policy/p" } },
        executionRoleArn: "arn:aws:iam::aws:role/r",
        approvalModel: "AUTOMATIC",
        subscribers: [SUBSCRIBER],
      }),
    });
  });
});

describe("useDeleteBudgetAction", () => {
  it("DELETEs with encoded ids", async () => {
    mockApi.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useDeleteBudgetAction(), { wrapper: createWrapper() });
    await result.current.mutateAsync({ budgetName: "monthly", actionId: "a 1" });
    expect(mockApi).toHaveBeenCalledWith("/aws/budgets/monthly/actions/a%201", {
      method: "DELETE",
    });
  });
});

describe("useExecuteBudgetAction", () => {
  it("POSTs executionType", async () => {
    mockApi.mockResolvedValueOnce({ executionType: "APPROVE_BUDGET_ACTION" });
    const { result } = renderHook(() => useExecuteBudgetAction(), { wrapper: createWrapper() });
    await result.current.mutateAsync({
      budgetName: "monthly",
      actionId: "a-1",
      executionType: "APPROVE_BUDGET_ACTION",
    });
    expect(mockApi).toHaveBeenCalledWith("/aws/budgets/monthly/actions/a-1/execute", {
      method: "POST",
      body: JSON.stringify({ executionType: "APPROVE_BUDGET_ACTION" }),
    });
  });
});
