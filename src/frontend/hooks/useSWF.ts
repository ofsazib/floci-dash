import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface SwfDomainInfo {
  name: string;
  status: string;
  description?: string;
  arn: string;
}

export interface SwfTypeNode {
  name: string;
  version: string;
}

export interface SwfTypeInfo {
  workflowType?: SwfTypeNode;
  activityType?: SwfTypeNode;
  status: string;
  description?: string;
  creationDate?: number;
  deprecationDate?: number;
}

export interface SwfExecutionInfo {
  execution: { workflowId: string; runId: string };
  workflowType: SwfTypeNode;
  startTimestamp?: number;
  closeTimestamp?: number;
  executionStatus: string;
  closeStatus?: string;
  tagList?: string[];
  cancelRequested?: boolean;
}

export interface SwfHistoryEvent {
  eventId: number;
  eventType: string;
  eventTimestamp?: number;
}

export function useSwfDomains(registrationStatus = "REGISTERED") {
  return useQuery<{ domains: SwfDomainInfo[]; total: number }>({
    queryKey: ["aws", "swf", "domains", registrationStatus],
    queryFn: () => api(`/aws/swf/domains?registrationStatus=${registrationStatus}`),
    refetchInterval: 10000,
  });
}

export function useSwfDomain(name: string | null) {
  return useQuery<{ domain: { domainInfo: SwfDomainInfo; configuration: { workflowExecutionRetentionPeriodInDays?: string } } }>({
    queryKey: ["aws", "swf", "domain", name],
    queryFn: () => api(`/aws/swf/domains/${encodeURIComponent(name!)}`),
    enabled: !!name,
  });
}

export function useCreateSwfDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      name: string;
      description?: string;
      workflowExecutionRetentionPeriodInDays?: string;
      tags?: Record<string, string>;
    }) =>
      api("/aws/swf/domains", { method: "POST", body: JSON.stringify(params) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "swf"] }),
  });
}

export function useDeprecateSwfDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/swf/domains/${encodeURIComponent(name)}/deprecate`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "swf"] }),
  });
}

export function useUndeprecateSwfDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/swf/domains/${encodeURIComponent(name)}/undeprecate`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "swf"] }),
  });
}

function typeQueryString(domain: string | null) {
  return new URLSearchParams({ domain: domain! }).toString();
}

export function useSwfWorkflowTypes(domain: string | null, registrationStatus = "REGISTERED") {
  return useQuery<{ typeInfos: SwfTypeInfo[]; total: number }>({
    queryKey: ["aws", "swf", "workflow-types", domain, registrationStatus],
    queryFn: () =>
      api(
        `/aws/swf/workflow-types?${typeQueryString(domain)}&registrationStatus=${registrationStatus}`
      ),
    enabled: !!domain,
  });
}

export function useSwfActivityTypes(domain: string | null, registrationStatus = "REGISTERED") {
  return useQuery<{ typeInfos: SwfTypeInfo[]; total: number }>({
    queryKey: ["aws", "swf", "activity-types", domain, registrationStatus],
    queryFn: () =>
      api(
        `/aws/swf/activity-types?${typeQueryString(domain)}&registrationStatus=${registrationStatus}`
      ),
    enabled: !!domain,
  });
}

export function useRegisterSwfWorkflowType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      domain: string;
      name: string;
      version: string;
      description?: string;
      defaultTaskStartToCloseTimeout?: string;
      defaultExecutionStartToCloseTimeout?: string;
      defaultTaskList?: string;
      defaultChildPolicy?: string;
    }) =>
      api("/aws/swf/workflow-types", { method: "POST", body: JSON.stringify(params) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "swf"] }),
  });
}

export function useDeprecateSwfWorkflowType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { domain: string; name: string; version: string }) =>
      api("/aws/swf/workflow-types/deprecate", {
        method: "POST",
        body: JSON.stringify(params),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "swf"] }),
  });
}

export function useDeleteSwfWorkflowType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { domain: string; name: string; version: string }) =>
      api("/aws/swf/workflow-types", { method: "DELETE", body: JSON.stringify(params) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "swf"] }),
  });
}

export function useRegisterSwfActivityType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      domain: string;
      name: string;
      version: string;
      description?: string;
      defaultTaskStartToCloseTimeout?: string;
      defaultTaskHeartbeatTimeout?: string;
      defaultTaskList?: string;
      defaultTaskScheduleToStartTimeout?: string;
      defaultTaskScheduleToCloseTimeout?: string;
    }) =>
      api("/aws/swf/activity-types", { method: "POST", body: JSON.stringify(params) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "swf"] }),
  });
}

export function useDeprecateSwfActivityType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { domain: string; name: string; version: string }) =>
      api("/aws/swf/activity-types/deprecate", {
        method: "POST",
        body: JSON.stringify(params),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "swf"] }),
  });
}

export function useDeleteSwfActivityType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { domain: string; name: string; version: string }) =>
      api("/aws/swf/activity-types", { method: "DELETE", body: JSON.stringify(params) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "swf"] }),
  });
}

export function useSwfOpenExecutions(domain: string | null) {
  return useQuery<{ executionInfos: SwfExecutionInfo[]; total: number }>({
    queryKey: ["aws", "swf", "executions", "open", domain],
    queryFn: () =>
      api(`/aws/swf/executions/open?domain=${encodeURIComponent(domain!)}`),
    enabled: !!domain,
    refetchInterval: 10000,
  });
}

export function useSwfClosedExecutions(domain: string | null) {
  return useQuery<{ executionInfos: SwfExecutionInfo[]; total: number }>({
    queryKey: ["aws", "swf", "executions", "closed", domain],
    queryFn: () =>
      api(`/aws/swf/executions/closed?domain=${encodeURIComponent(domain!)}`),
    enabled: !!domain,
  });
}

export function useSwfExecutionHistory(
  domain: string | null,
  workflowId: string | null,
  runId: string | null
) {
  const qs = new URLSearchParams();
  qs.set("domain", domain!);
  qs.set("workflowId", workflowId!);
  qs.set("runId", runId!);
  return useQuery<{ events: SwfHistoryEvent[]; total: number }>({
    queryKey: ["aws", "swf", "history", domain, workflowId, runId],
    queryFn: () => api(`/aws/swf/executions/history?${qs.toString()}`),
    enabled: !!domain && !!workflowId && !!runId,
  });
}

export function useStartSwfExecution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      domain: string;
      workflowId: string;
      workflowTypeName: string;
      workflowTypeVersion: string;
      taskList?: string;
      input?: string;
      executionStartToCloseTimeout?: string;
      taskStartToCloseTimeout?: string;
      childPolicy?: string;
      tagList?: string[];
    }) =>
      api("/aws/swf/executions", { method: "POST", body: JSON.stringify(params) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "swf"] }),
  });
}

export function useTerminateSwfExecution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      domain: string;
      workflowId: string;
      runId?: string;
      reason?: string;
    }) =>
      api("/aws/swf/executions/terminate", {
        method: "POST",
        body: JSON.stringify(params),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "swf"] }),
  });
}

export function useSignalSwfExecution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      domain: string;
      workflowId: string;
      runId?: string;
      signalName: string;
      input?: string;
    }) =>
      api("/aws/swf/executions/signal", {
        method: "POST",
        body: JSON.stringify(params),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "swf"] }),
  });
}
