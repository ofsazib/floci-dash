import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface NfwRef {
  arn?: string;
  name?: string;
}

export interface NfwFirewall {
  name: string | null;
  arn: string;
  policyArn: string | null;
  vpcId: string | null;
  subnetMappings: any[];
}

const BASE = "/aws/networkfirewall";

const refQ = (ref: NfwRef) => {
  const parts: string[] = [];
  if (ref.arn) parts.push(`arn=${encodeURIComponent(ref.arn)}`);
  if (ref.name) parts.push(`name=${encodeURIComponent(ref.name)}`);
  return parts.length ? `?${parts.join("&")}` : "";
};

export function useNfwFirewalls() {
  return useQuery({
    queryKey: ["networkfirewall", "firewalls"],
    queryFn: () => api<{ firewalls: NfwFirewall[]; total: number }>(`${BASE}/firewalls`),
  });
}

export function useNfwFirewallDetail(ref: NfwRef | null) {
  return useQuery({
    queryKey: ["networkfirewall", "firewalls", "detail", ref],
    queryFn: () => api<{ firewall: any; firewallStatus: any }>(`${BASE}/firewalls/detail${refQ(ref!)}`),
    enabled: !!(ref?.arn || ref?.name),
  });
}

function useNfwMutation() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["networkfirewall"] });
}

export function useNfwCreateFirewall() {
  const run = useNfwMutation();
  return useMutation({
    mutationFn: (body: {
      name: string;
      vpcId: string;
      subnetMappings: string[];
      policyArn?: string;
      description?: string;
    }) => api(`${BASE}/firewalls`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: run,
  });
}

export function useNfwDeleteFirewall() {
  const run = useNfwMutation();
  return useMutation({
    mutationFn: (ref: NfwRef) => api(`${BASE}/firewalls${refQ(ref)}`, { method: "DELETE" }),
    onSuccess: run,
  });
}

function useNfwProtection(kind: string) {
  const run = useNfwMutation();
  return useMutation({
    mutationFn: (body: NfwRef & { enabled?: boolean; description?: string }) =>
      api(`${BASE}/firewalls/${kind}`, { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: run,
  });
}

export function useNfwDeleteProtection() {
  return useNfwProtection("delete-protection");
}
export function useNfwPolicyChangeProtection() {
  return useNfwProtection("policy-change-protection");
}
export function useNfwSubnetChangeProtection() {
  return useNfwProtection("subnet-change-protection");
}
export function useNfwAzChangeProtection() {
  return useNfwProtection("az-change-protection");
}
export function useNfwUpdateDescription() {
  return useNfwProtection("description");
}

export function useNfwAnalysisSettings() {
  const run = useNfwMutation();
  return useMutation({
    mutationFn: (body: NfwRef & { analysisSettings?: string }) =>
      api(`${BASE}/firewalls/analysis-settings`, { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: run,
  });
}

export function useNfwAssociateSubnets() {
  const run = useNfwMutation();
  return useMutation({
    mutationFn: (body: NfwRef & { subnetIds: string[] }) =>
      api(`${BASE}/firewalls/subnets/associate`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: run,
  });
}

export function useNfwDisassociateSubnets() {
  const run = useNfwMutation();
  return useMutation({
    mutationFn: (body: NfwRef & { subnetIds: string[] }) =>
      api(`${BASE}/firewalls/subnets/disassociate`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: run,
  });
}

export function useNfwAssociateZones() {
  const run = useNfwMutation();
  return useMutation({
    mutationFn: (body: NfwRef & { zoneMappings?: any[] }) =>
      api(`${BASE}/firewalls/zones/associate`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: run,
  });
}

export function useNfwDisassociateZones() {
  const run = useNfwMutation();
  return useMutation({
    mutationFn: (body: NfwRef & { zoneMappings?: any[] }) =>
      api(`${BASE}/firewalls/zones/disassociate`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: run,
  });
}

export function useNfwAssociatePolicy() {
  const run = useNfwMutation();
  return useMutation({
    mutationFn: (body: NfwRef & { policyArn: string }) =>
      api(`${BASE}/firewalls/policy`, { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: run,
  });
}

export function useNfwUpdateLogging() {
  const run = useNfwMutation();
  return useMutation({
    mutationFn: (body: NfwRef & { loggingConfiguration?: string | object }) =>
      api(`${BASE}/firewalls/logging`, { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: run,
  });
}

export function useNfwLoggingConfig(ref: NfwRef | null) {
  return useQuery({
    queryKey: ["networkfirewall", "logging", ref],
    queryFn: () => api<{ loggingConfiguration: any }>(`${BASE}/firewalls/logging${refQ(ref!)}`),
    enabled: !!(ref?.arn || ref?.name),
  });
}

export function useNfwPolicies() {
  return useQuery({
    queryKey: ["networkfirewall", "policies"],
    queryFn: () =>
      api<{ policies: { name: string | null; arn: string }[]; total: number }>(`${BASE}/policies`),
  });
}

export function useNfwPolicyDetail(ref: NfwRef | null) {
  return useQuery({
    queryKey: ["networkfirewall", "policies", "detail", ref],
    queryFn: () => api<{ policyResponse: any; policy: any }>(`${BASE}/policies/detail${refQ(ref!)}`),
    enabled: !!(ref?.arn || ref?.name),
  });
}

export function useNfwCreatePolicy() {
  const run = useNfwMutation();
  return useMutation({
    mutationFn: (body: { name: string; firewallPolicy?: any }) =>
      api(`${BASE}/policies`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: run,
  });
}

export function useNfwUpdatePolicy() {
  const run = useNfwMutation();
  return useMutation({
    mutationFn: (body: NfwRef & { firewallPolicy?: any }) =>
      api(`${BASE}/policies`, { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: run,
  });
}

export function useNfwDeletePolicy() {
  const run = useNfwMutation();
  return useMutation({
    mutationFn: (ref: NfwRef) => api(`${BASE}/policies${refQ(ref)}`, { method: "DELETE" }),
    onSuccess: run,
  });
}

export function useNfwRuleGroups(type?: string) {
  return useQuery({
    queryKey: ["networkfirewall", "rule-groups", type],
    queryFn: () =>
      api<{ ruleGroups: { name: string | null; arn: string; type: string | null }[]; total: number }>(
        `${BASE}/rule-groups${type ? `?type=${encodeURIComponent(type)}` : ""}`,
      ),
  });
}

export function useNfwRuleGroupDetail(ref: NfwRef | null) {
  return useQuery({
    queryKey: ["networkfirewall", "rule-groups", "detail", ref],
    queryFn: () =>
      api<{ ruleGroupResponse: any; ruleGroup: any }>(`${BASE}/rule-groups/detail${refQ(ref!)}`),
    enabled: !!(ref?.arn || ref?.name),
  });
}

export function useNfwCreateRuleGroup() {
  const run = useNfwMutation();
  return useMutation({
    mutationFn: (body: { name: string; type: string; capacity: string; ruleGroup?: string }) =>
      api(`${BASE}/rule-groups`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: run,
  });
}

export function useNfwUpdateRuleGroup() {
  const run = useNfwMutation();
  return useMutation({
    mutationFn: (body: NfwRef & { ruleGroup?: string }) =>
      api(`${BASE}/rule-groups`, { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: run,
  });
}

export function useNfwDeleteRuleGroup() {
  const run = useNfwMutation();
  return useMutation({
    mutationFn: (ref: NfwRef) => api(`${BASE}/rule-groups${refQ(ref)}`, { method: "DELETE" }),
    onSuccess: run,
  });
}
