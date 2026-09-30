import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface Budget {
  BudgetName?: string;
  BudgetType?: string;
  BudgetLimit?: { Amount?: string; Unit?: string };
  TimeUnit?: string;
  TimePeriod?: { Start?: number; End?: number };
  CalculatedSpend?: {
    ActualSpend?: { Amount?: string; Unit?: string };
    ForecastedSpend?: { Amount?: string; Unit?: string };
  };
}

export interface BudgetNotification {
  NotificationType?: string;
  ComparisonOperator?: string;
  Threshold?: number;
  ThresholdType?: string;
}

export interface BudgetSubscriber {
  SubscriptionType?: string;
  Address?: string;
}

export interface BudgetAction {
  ActionId?: string;
  ActionType?: string;
  Status?: string;
  NotificationType?: string;
  ActionThreshold?: { ActionThresholdValue?: number; ActionThresholdType?: string };
  ApprovalModel?: string;
}

export function useBudgets() {
  return useQuery({
    queryKey: ["aws", "budgets"],
    queryFn: () => api<{ budgets: Budget[]; total: number }>("/aws/budgets"),
  });
}

export function useCreateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (budget: Budget) =>
      api("/aws/budgets", { method: "POST", body: JSON.stringify({ budget }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "budgets"] }),
  });
}

export function useDeleteBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/budgets/${encodeURIComponent(name)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "budgets"] }),
  });
}

export function useBudgetNotifications(budgetName: string | null) {
  return useQuery({
    queryKey: ["aws", "budgets", budgetName, "notifications"],
    queryFn: () =>
      api<{ notifications: BudgetNotification[]; total: number }>(
        `/aws/budgets/${encodeURIComponent(budgetName!)}/notifications`
      ),
    enabled: !!budgetName,
  });
}

export function useCreateBudgetNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      budgetName,
      notification,
      subscribers,
    }: {
      budgetName: string;
      notification: BudgetNotification;
      subscribers: BudgetSubscriber[];
    }) =>
      api(`/aws/budgets/${encodeURIComponent(budgetName)}/notifications`, {
        method: "POST",
        body: JSON.stringify({ notification, subscribers }),
      }),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({
        queryKey: ["aws", "budgets", v.budgetName, "notifications"],
      }),
  });
}

export function useDeleteBudgetNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      budgetName,
      notification,
    }: {
      budgetName: string;
      notification: BudgetNotification;
    }) =>
      api(`/aws/budgets/${encodeURIComponent(budgetName)}/notifications`, {
        method: "DELETE",
        body: JSON.stringify({ notification }),
      }),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({
        queryKey: ["aws", "budgets", v.budgetName, "notifications"],
      }),
  });
}

export function useBudgetSubscribers(
  budgetName: string | null,
  notification: BudgetNotification | null
) {
  return useQuery({
    queryKey: ["aws", "budgets", budgetName, "subscribers", notification],
    queryFn: () =>
      api<{ subscribers: BudgetSubscriber[]; total: number }>(
        `/aws/budgets/${encodeURIComponent(budgetName!)}/subscribers?notification=${encodeURIComponent(
          JSON.stringify(notification)
        )}`
      ),
    enabled: !!budgetName && !!notification,
  });
}

export function useCreateBudgetSubscriber() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      budgetName,
      notification,
      subscriber,
    }: {
      budgetName: string;
      notification: BudgetNotification;
      subscriber: BudgetSubscriber;
    }) =>
      api(`/aws/budgets/${encodeURIComponent(budgetName)}/subscribers`, {
        method: "POST",
        body: JSON.stringify({ notification, subscriber }),
      }),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({
        queryKey: ["aws", "budgets", v.budgetName, "subscribers"],
      }),
  });
}

export function useDeleteBudgetSubscriber() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      budgetName,
      notification,
      subscriber,
    }: {
      budgetName: string;
      notification: BudgetNotification;
      subscriber: BudgetSubscriber;
    }) =>
      api(`/aws/budgets/${encodeURIComponent(budgetName)}/subscribers`, {
        method: "DELETE",
        body: JSON.stringify({ notification, subscriber }),
      }),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({
        queryKey: ["aws", "budgets", v.budgetName, "subscribers"],
      }),
  });
}

export function useBudgetActions(budgetName: string | null) {
  return useQuery({
    queryKey: ["aws", "budgets", budgetName, "actions"],
    queryFn: () =>
      api<{ actions: BudgetAction[]; total: number }>(
        `/aws/budgets/${encodeURIComponent(budgetName!)}/actions`
      ),
    enabled: !!budgetName,
  });
}

export function useCreateBudgetAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      budgetName,
      ...body
    }: {
      budgetName: string;
      actionType: string;
      notificationType: string;
      actionThreshold: { ActionThresholdValue: number; ActionThresholdType: string };
      definition: Record<string, unknown>;
      executionRoleArn: string;
      approvalModel: string;
      subscribers: BudgetSubscriber[];
    }) =>
      api(`/aws/budgets/${encodeURIComponent(budgetName)}/actions`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ["aws", "budgets", v.budgetName, "actions"] }),
  });
}

export function useDeleteBudgetAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ budgetName, actionId }: { budgetName: string; actionId: string }) =>
      api(`/aws/budgets/${encodeURIComponent(budgetName)}/actions/${encodeURIComponent(actionId)}`, {
        method: "DELETE",
      }),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ["aws", "budgets", v.budgetName, "actions"] }),
  });
}

export function useExecuteBudgetAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      budgetName,
      actionId,
      executionType,
    }: {
      budgetName: string;
      actionId: string;
      executionType: string;
    }) =>
      api(
        `/aws/budgets/${encodeURIComponent(budgetName)}/actions/${encodeURIComponent(actionId)}/execute`,
        { method: "POST", body: JSON.stringify({ executionType }) }
      ),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ["aws", "budgets", v.budgetName, "actions"] }),
  });
}
