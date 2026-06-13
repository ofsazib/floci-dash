import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface EventBus {
  Name: string;
  Arn?: string;
  Description?: string;
  CreationTime?: number;
  Policy?: string;
}

export interface EventRule {
  Name: string;
  Arn?: string;
  EventBusName?: string;
  State?: "ENABLED" | "DISABLED";
  EventPattern?: string;
  ScheduleExpression?: string;
  Description?: string;
}

export interface EventTarget {
  Id: string;
  Arn: string;
  Input?: string;
  InputPath?: string;
}

export interface EventArchive {
  ArchiveName: string;
  EventSourceArn: string;
  State?: string;
  EventCount?: number;
  SizeBytes?: number;
  RetentionDays?: number;
  CreationTime?: number;
}

export function useEventBuses() {
  return useQuery<{ eventBuses: EventBus[] }>({
    queryKey: ["aws", "events", "buses"],
    queryFn: () => api("/aws/events/buses"),
    refetchInterval: 15000,
  });
}

export function useEventRules(eventBusName?: string) {
  return useQuery<{ rules: EventRule[] }>({
    queryKey: ["aws", "events", "rules", eventBusName],
    queryFn: () => api(`/aws/events/rules${eventBusName ? `?eventBusName=${encodeURIComponent(eventBusName)}` : ""}`),
    refetchInterval: 10000,
  });
}

export function useEventTargets(rule: string | null, eventBusName?: string) {
  return useQuery<{ targets: EventTarget[] }>({
    queryKey: ["aws", "events", "targets", rule, eventBusName],
    queryFn: () =>
      api(`/aws/events/targets?rule=${encodeURIComponent(rule!)}${eventBusName ? `&eventBusName=${encodeURIComponent(eventBusName)}` : ""}`),
    enabled: !!rule,
  });
}

export function useEventArchives() {
  return useQuery<{ archives: EventArchive[] }>({
    queryKey: ["aws", "events", "archives"],
    queryFn: () => api("/aws/events/archives"),
    refetchInterval: 15000,
  });
}

export function useEventReplays() {
  return useQuery<{ replays: Array<{ ReplayName: string; State: string; EventSourceArn: string }> }>({
    queryKey: ["aws", "events", "replays"],
    queryFn: () => api("/aws/events/replays"),
    refetchInterval: 10000,
  });
}

export function useCreateEventBus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { name: string; description?: string }) =>
      api("/aws/events/buses", { method: "POST", body: JSON.stringify(params) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "events", "buses"] }),
  });
}

export function useDeleteEventBus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api(`/aws/events/buses?name=${encodeURIComponent(name)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "events", "buses"] }),
  });
}

export function usePutEventRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      name: string;
      eventBusName?: string;
      eventPattern?: string;
      scheduleExpression?: string;
      state?: "ENABLED" | "DISABLED";
      description?: string;
    }) => api("/aws/events/rules", { method: "POST", body: JSON.stringify(params) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "events", "rules"] }),
  });
}

export function useDeleteEventRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { name: string; eventBusName?: string }) =>
      api(`/aws/events/rules?name=${encodeURIComponent(params.name)}${params.eventBusName ? `&eventBusName=${encodeURIComponent(params.eventBusName)}` : ""}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "events", "rules"] }),
  });
}

export function useToggleEventRule() {
  const qc = useQueryClient();
  return {
    enable: useMutation({
      mutationFn: (params: { name: string; eventBusName?: string }) =>
        api("/aws/events/rules/enable", { method: "POST", body: JSON.stringify(params) }),
      onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "events", "rules"] }),
    }),
    disable: useMutation({
      mutationFn: (params: { name: string; eventBusName?: string }) =>
        api("/aws/events/rules/disable", { method: "POST", body: JSON.stringify(params) }),
      onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "events", "rules"] }),
    }),
  };
}

export function usePutEventTargets() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { rule: string; eventBusName?: string; targets: EventTarget[] }) =>
      api("/aws/events/targets", { method: "POST", body: JSON.stringify(params) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "events", "targets"] }),
  });
}

export function useRemoveEventTarget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { rule: string; ids: string[]; eventBusName?: string }) =>
      api(`/aws/events/targets?rule=${encodeURIComponent(params.rule)}&ids=${params.ids.join(",")}${params.eventBusName ? `&eventBusName=${encodeURIComponent(params.eventBusName)}` : ""}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "events", "targets"] }),
  });
}

export function usePutEvents() {
  return useMutation({
    mutationFn: (entries: Array<{
      source: string;
      detailType: string;
      detail: string;
      eventBusName?: string;
    }>) =>
      api("/aws/events/put-events", {
        method: "POST",
        body: JSON.stringify({
          entries: entries.map((e) => ({
            Source: e.source,
            DetailType: e.detailType,
            Detail: e.detail,
            EventBusName: e.eventBusName,
          })),
        }),
      }),
  });
}

export function useCreateEventArchive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      archiveName: string;
      eventSourceArn: string;
      description?: string;
      eventPattern?: string;
      retentionDays?: number;
    }) => api("/aws/events/archives", { method: "POST", body: JSON.stringify(params) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "events", "archives"] }),
  });
}

export function useDeleteEventArchive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api(`/aws/events/archives?name=${encodeURIComponent(name)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "events", "archives"] }),
  });
}
