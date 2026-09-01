import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface EC2FlowLog {
  flowLogId: string;
  resourceId: string;
  resourceType: string;
  trafficType: string;
  logDestinationType: string;
  logDestination: string;
  logFormat: string;
  maxAggregationInterval: number;
  flowLogStatus: string;
  deliverLogsStatus: string;
  creationTime: string | null;
  deliverCrossAccountRole: string | null;
  tags: Array<{ key: string; value: string }>;
}

export function useEC2FlowLogs(resourceId?: string | null) {
  return useQuery<{ flowLogs: EC2FlowLog[]; total: number }>({
    queryKey: ["aws", "ec2", "flow-logs", resourceId],
    queryFn: () => {
      const params = new URLSearchParams();
      if (resourceId) params.set("resourceId", resourceId);
/* istanbul ignore next */
      return api(`/aws/ec2/flow-logs?${params.toString()}`);
    },
    refetchInterval: 15000,
  });
}

export function useEC2CreateFlowLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      resourceId: string;
      resourceType: string;
      trafficType: string;
      logDestinationType?: string;
      logDestination?: string;
      logFormat?: string;
      maxAggregationInterval?: number;
    }) =>
      api("/aws/ec2/flow-logs", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "ec2", "flow-logs"] }),
  });
}

export function useEC2DeleteFlowLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (flowLogId: string) =>
      api(`/aws/ec2/flow-logs/${flowLogId}`, { method: "DELETE" }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "ec2", "flow-logs"] }),
  });
}
