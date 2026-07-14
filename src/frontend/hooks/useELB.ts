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
    queryFn: () => api("/aws/elasticloadbalancing/load-balancers"),
    refetchInterval: 10000,
  });
}

export function useELBCreateLoadBalancer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; subnets: string[]; securityGroups?: string[]; scheme?: string; type?: string }) =>
      api("/aws/elasticloadbalancing/load-balancers", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "elb", "load-balancers"] }),
  });
}

export function useELBDeleteLoadBalancer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (arn: string) =>
      api(`/aws/elasticloadbalancing/load-balancers/${encodeURIComponent(arn)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "elb", "load-balancers"] }),
  });
}

export function useELBLoadBalancerAttributes(arn: string | null) {
  return useQuery<{ loadBalancerArn: string; attributes: Record<string, string> }>({
    queryKey: ["aws", "elb", "attributes", arn],
    queryFn: () => api(`/aws/elasticloadbalancing/load-balancers/${encodeURIComponent(arn!)}/attributes`),
    enabled: !!arn,
  });
}

export function useELBTargetGroups() {
  return useQuery<{ targetGroups: ELBTargetGroup[]; total: number }>({
    queryKey: ["aws", "elb", "target-groups"],
    queryFn: () => api("/aws/elasticloadbalancing/target-groups"),
    refetchInterval: 10000,
  });
}

export function useELBCreateTargetGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; protocol: string; port: number; vpcId: string; targetType?: string }) =>
      api("/aws/elasticloadbalancing/target-groups", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "elb", "target-groups"] }),
  });
}

export function useELBDeleteTargetGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (arn: string) =>
      api(`/aws/elasticloadbalancing/target-groups/${encodeURIComponent(arn)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "elb", "target-groups"] }),
  });
}

export function useELBTargetHealth(tgArn: string | null) {
  return useQuery<{ targets: Array<{ target: string; port: number; healthState: string; reason: string; description: string }>; total: number }>({
    queryKey: ["aws", "elb", "target-health", tgArn],
    queryFn: () => api(`/aws/elasticloadbalancing/target-groups/${encodeURIComponent(tgArn!)}/health`),
    enabled: !!tgArn,
    refetchInterval: 5000,
  });
}

export function useELBListeners(lbArn: string | null) {
  return useQuery<{ listeners: ELBListener[]; total: number }>({
    queryKey: ["aws", "elb", "listeners", lbArn],
    queryFn: () => api(`/aws/elasticloadbalancing/load-balancers/${encodeURIComponent(lbArn!)}/listeners`),
    enabled: !!lbArn,
  });
}

export function useELBCreateListener(lbArn: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { protocol: string; port: number; defaultActions: any[]; certificates?: any[] }) =>
      api(`/aws/elasticloadbalancing/load-balancers/${encodeURIComponent(lbArn)}/listeners`, {
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
      api(`/aws/elasticloadbalancing/listeners/${encodeURIComponent(arn)}`, { method: "DELETE" }),
  });
}

export function useELBRegisterTargets(tgArn: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (targets: Array<{ id: string; port?: number }>) =>
      api(`/aws/elasticloadbalancing/target-groups/${encodeURIComponent(tgArn)}/register`, {
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
      api(`/aws/elasticloadbalancing/target-groups/${encodeURIComponent(tgArn)}/deregister`, {
        method: "POST",
        body: JSON.stringify({ targets }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "elb", "target-health", tgArn] }),
  });
}

// ─── Advanced LB Settings ────────────────────────────────

export function useELBSetSecurityGroups() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { arn: string; securityGroups: string[] }) =>
      api(`/aws/elasticloadbalancing/load-balancers/${encodeURIComponent(body.arn)}/security-groups`, {
        method: "PUT",
        body: JSON.stringify({ securityGroups: body.securityGroups }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "elb", "load-balancers"] }),
  });
}

export function useELBSetSubnets() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { arn: string; subnets: string[] }) =>
      api(`/aws/elasticloadbalancing/load-balancers/${encodeURIComponent(body.arn)}/subnets`, {
        method: "PUT",
        body: JSON.stringify({ subnets: body.subnets }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "elb", "load-balancers"] }),
  });
}

export function useELBSetIpAddressType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { arn: string; ipAddressType: string }) =>
      api(`/aws/elasticloadbalancing/load-balancers/${encodeURIComponent(body.arn)}/ip-address-type`, {
        method: "PUT",
        body: JSON.stringify({ ipAddressType: body.ipAddressType }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "elb", "load-balancers"] }),
  });
}

// ─── SSL Policies ────────────────────────────────────────

export function useELBSSLPolicies() {
  return useQuery<{ sslPolicies: Array<{ name: string; sslProtocols: string[]; ciphers: string[] }>; total: number }>({
    queryKey: ["aws", "elb", "ssl-policies"],
    queryFn: () => api("/aws/elasticloadbalancing/ssl-policies"),
  });
}

// ─── Listener Certificates ───────────────────────────────

export function useELBListenerCertificates(listenerArn: string | null) {
  return useQuery<{ certificates: any[]; total: number }>({
    queryKey: ["aws", "elb", "listener-certificates", listenerArn],
    queryFn: () => api(`/aws/elasticloadbalancing/listeners/${encodeURIComponent(listenerArn!)}/certificates`),
    enabled: !!listenerArn,
  });
}

export function useELBAddListenerCertificate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { listenerArn: string; certificateArn: string }) =>
      api(`/aws/elasticloadbalancing/listeners/${encodeURIComponent(body.listenerArn)}/certificates`, {
        method: "POST",
        body: JSON.stringify({ certificateArn: body.certificateArn }),
      }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ["aws", "elb", "listener-certificates", variables.listenerArn] }),
  });
}

export function useELBRemoveListenerCertificate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { listenerArn: string; certificateArn: string }) =>
      api(`/aws/elasticloadbalancing/listeners/${encodeURIComponent(body.listenerArn)}/certificates/remove`, {
        method: "POST",
        body: JSON.stringify({ certificateArn: body.certificateArn }),
      }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ["aws", "elb", "listener-certificates", variables.listenerArn] }),
  });
}

// ─── Listener Attributes ─────────────────────────────────

export function useELBListenerAttributes(listenerArn: string | null) {
  return useQuery<{ listenerArn: string; attributes: Record<string, string> }>({
    queryKey: ["aws", "elb", "listener-attributes", listenerArn],
    queryFn: () => api(`/aws/elasticloadbalancing/listeners/${encodeURIComponent(listenerArn!)}/attributes`),
    enabled: !!listenerArn,
  });
}

export function useELBModifyListenerAttributes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { arn: string; attributes: Record<string, string> }) =>
      api(`/aws/elasticloadbalancing/listeners/${encodeURIComponent(body.arn)}/attributes`, {
        method: "PUT",
        body: JSON.stringify({ attributes: body.attributes }),
      }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ["aws", "elb", "listener-attributes", variables.arn] }),
  });
}

// ─── Target Group Attributes ─────────────────────────────

export function useELBTargetGroupAttributes(tgArn: string | null) {
  return useQuery<{ targetGroupArn: string; attributes: Record<string, string> }>({
    queryKey: ["aws", "elb", "tg-attributes", tgArn],
    queryFn: () => api(`/aws/elasticloadbalancing/target-groups/${encodeURIComponent(tgArn!)}/attributes`),
    enabled: !!tgArn,
  });
}

export function useELBModifyTargetGroupAttributes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { arn: string; attributes: Record<string, string> }) =>
      api(`/aws/elasticloadbalancing/target-groups/${encodeURIComponent(body.arn)}/attributes`, {
        method: "PUT",
        body: JSON.stringify({ attributes: body.attributes }),
      }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ["aws", "elb", "tg-attributes", variables.arn] }),
  });
}

// ─── Account Limits ─────────────────────────────────────

export function useELBAccountLimits() {
  return useQuery<{ limits: Array<{ name: string; max: string }>; total: number }>({
    queryKey: ["aws", "elb", "account-limits"],
    queryFn: () => api("/aws/elasticloadbalancing/account-limits"),
  });
}
