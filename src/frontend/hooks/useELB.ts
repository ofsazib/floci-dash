import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface ELBLoadBalancer {
  loadBalancerArn: string;
  loadBalancerName: string;
  dnsName: string;
  scheme: string;
  vpcId: string;
  state: string;
  type: string;
  availabilityZones: string[];
  ipAddressType: string;
  createdTime: string | null;
}

export interface ELBTargetGroup {
  targetGroupArn: string;
  targetGroupName: string;
  protocol: string;
  port: number;
  vpcId: string;
  targetType: string;
  healthCheckProtocol: string;
  healthCheckPort: string;
  healthCheckEnabled: boolean;
  healthCheckIntervalSeconds: number;
  healthyThresholdCount: number;
  unhealthyThresholdCount: number;
}

export interface ELBListener {
  listenerArn: string;
  loadBalancerArn: string;
  protocol: string;
  port: number;
  defaultActions: any[];
  certificates: any[];
}

export function useELBLoadBalancers() {
  return useQuery<{ loadBalancers: ELBLoadBalancer[]; total: number }>({
    queryKey: ["aws", "elb", "load-balancers"],
    queryFn: () => api("/aws/elb/load-balancers"),
    refetchInterval: 10000,
  });
}

export function useELBCreateLoadBalancer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; subnets: string[]; securityGroups?: string[]; scheme?: string; type?: string }) =>
      api("/aws/elb/load-balancers", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "elb", "load-balancers"] }),
  });
}

export function useELBDeleteLoadBalancer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (arn: string) =>
      api(`/aws/elb/load-balancers/${encodeURIComponent(arn)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "elb", "load-balancers"] }),
  });
}

export function useELBLoadBalancerAttributes(arn: string | null) {
  return useQuery<{ loadBalancerArn: string; attributes: Record<string, string> }>({
    queryKey: ["aws", "elb", "attributes", arn],
    queryFn: () => api(`/aws/elb/load-balancers/${encodeURIComponent(arn!)}/attributes`),
    enabled: !!arn,
  });
}

export function useELBTargetGroups() {
  return useQuery<{ targetGroups: ELBTargetGroup[]; total: number }>({
    queryKey: ["aws", "elb", "target-groups"],
    queryFn: () => api("/aws/elb/target-groups"),
    refetchInterval: 10000,
  });
}

export function useELBCreateTargetGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; protocol: string; port: number; vpcId: string; targetType?: string }) =>
      api("/aws/elb/target-groups", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "elb", "target-groups"] }),
  });
}

export function useELBDeleteTargetGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (arn: string) =>
      api(`/aws/elb/target-groups/${encodeURIComponent(arn)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "elb", "target-groups"] }),
  });
}

export function useELBTargetHealth(tgArn: string | null) {
  return useQuery<{ targets: Array<{ target: string; port: number; healthState: string; reason: string; description: string }>; total: number }>({
    queryKey: ["aws", "elb", "target-health", tgArn],
    queryFn: () => api(`/aws/elb/target-groups/${encodeURIComponent(tgArn!)}/health`),
    enabled: !!tgArn,
    refetchInterval: 5000,
  });
}

export function useELBListeners(lbArn: string | null) {
  return useQuery<{ listeners: ELBListener[]; total: number }>({
    queryKey: ["aws", "elb", "listeners", lbArn],
    queryFn: () => api(`/aws/elb/load-balancers/${encodeURIComponent(lbArn!)}/listeners`),
    enabled: !!lbArn,
  });
}

export function useELBCreateListener(lbArn: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { protocol: string; port: number; defaultActions: any[]; certificates?: any[] }) =>
      api(`/aws/elb/load-balancers/${encodeURIComponent(lbArn)}/listeners`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "elb", "listeners", lbArn] }),
  });
}

export function useELBDeleteListener() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (arn: string) =>
      api(`/aws/elb/listeners/${encodeURIComponent(arn)}`, { method: "DELETE" }),
  });
}

export function useELBRegisterTargets(tgArn: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (targets: Array<{ id: string; port?: number }>) =>
      api(`/aws/elb/target-groups/${encodeURIComponent(tgArn)}/register`, {
        method: "POST",
        body: JSON.stringify({ targets }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "elb", "target-health", tgArn] }),
  });
}

export function useELBDeregisterTargets(tgArn: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (targets: Array<{ id: string; port?: number }>) =>
      api(`/aws/elb/target-groups/${encodeURIComponent(tgArn)}/deregister`, {
        method: "POST",
        body: JSON.stringify({ targets }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "elb", "target-health", tgArn] }),
  });
}
