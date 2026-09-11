import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface ResolverEndpoint {
  id: string;
  arn: string;
  name: string | null;
  direction: string | null;
  status: string | null;
  ipAddressCount: number;
  hostVpcId: string | null;
  securityGroupIds: string[];
  endpointType: string | null;
}

export interface ResolverRule {
  id: string;
  arn: string;
  name: string | null;
  domainName: string | null;
  ruleType: string | null;
  status: string | null;
  resolverEndpointId: string | null;
  targetIps: { Ip?: string; Port?: number }[];
  shareStatus: string | null;
}

export interface ResolverRuleAssociation {
  id: string;
  resolverRuleId: string | null;
  name: string | null;
  vpcId: string | null;
  status: string | null;
}

export interface FirewallDomainList {
  id: string;
  arn: string;
  name: string;
  managedOwnerName: string | null;
  creatorRequestId: string | null;
  domainCount: number | null;
  status: string | null;
}

const BASE = "/aws/route53resolver";

// ---------- Resolver endpoints ----------

export function useResolverEndpoints() {
  return useQuery({
    queryKey: ["route53resolver", "endpoints"],
    queryFn: () => api<{ endpoints: ResolverEndpoint[]; total: number }>(`${BASE}/endpoints`),
  });
}

export function useCreateResolverEndpoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      name: string;
      direction: string;
      ipAddresses: { SubnetId: string; Ip?: string }[];
      securityGroupIds?: string[];
    }) => api(`${BASE}/endpoints`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["route53resolver", "endpoints"] }),
  });
}

export function useUpdateResolverEndpoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; name?: string; endpointType?: string }) =>
      api(`${BASE}/endpoints/${vars.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: vars.name, endpointType: vars.endpointType }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["route53resolver", "endpoints"] }),
  });
}

export function useDeleteResolverEndpoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`${BASE}/endpoints/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["route53resolver", "endpoints"] }),
  });
}

// ---------- Resolver rules ----------

export function useResolverRules() {
  return useQuery({
    queryKey: ["route53resolver", "rules"],
    queryFn: () => api<{ rules: ResolverRule[]; total: number }>(`${BASE}/rules`),
  });
}

export function useCreateResolverRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      name: string;
      ruleType: string;
      domainName?: string;
      targetIps?: { Ip: string; Port?: number }[];
      resolverEndpointId?: string;
    }) => api(`${BASE}/rules`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["route53resolver", "rules"] }),
  });
}

export function useUpdateResolverRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; name?: string; targetIps?: { Ip: string; Port?: number }[] }) =>
      api(`${BASE}/rules/${vars.id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: vars.name, targetIps: vars.targetIps }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["route53resolver", "rules"] }),
  });
}

export function useDeleteResolverRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`${BASE}/rules/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["route53resolver", "rules"] }),
  });
}

// ---------- Resolver rule associations ----------

export function useResolverRuleAssociations() {
  return useQuery({
    queryKey: ["route53resolver", "associations"],
    queryFn: () =>
      api<{ associations: ResolverRuleAssociation[]; total: number }>(`${BASE}/rule-associations`),
  });
}

export function useAssociateResolverRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { resolverRuleId: string; vpcId: string; name?: string }) =>
      api(`${BASE}/rule-associations`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["route53resolver", "associations"] }),
  });
}

export function useDisassociateResolverRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { resolverRuleId: string; vpcId: string }) =>
      api(`${BASE}/rule-associations/disassociate`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["route53resolver", "associations"] }),
  });
}

// ---------- Firewall domain lists ----------

export function useFirewallDomainLists() {
  return useQuery({
    queryKey: ["route53resolver", "domain-lists"],
    queryFn: () => api<{ domainLists: FirewallDomainList[]; total: number }>(`${BASE}/firewall-domain-lists`),
  });
}

export function useCreateFirewallDomainList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string }) =>
      api(`${BASE}/firewall-domain-lists`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["route53resolver", "domain-lists"] }),
  });
}

export function useDeleteFirewallDomainList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`${BASE}/firewall-domain-lists/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["route53resolver", "domain-lists"] }),
  });
}
