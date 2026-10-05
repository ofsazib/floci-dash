import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface ShAdminAccount {
  accountId?: string;
  status?: string;
}

export interface ShHub {
  enabled: boolean;
  hubArn?: string;
  autoEnableControls?: boolean;
  controlFindingGenerator?: string;
}

export interface ShOrgConfiguration {
  autoEnable: boolean;
  autoEnableStandards?: string;
  organizationConfiguration?: { configurationType?: string; status?: string } | null;
}

export interface ShAggregator {
  findingAggregatorArn: string;
  findingAggregationRegion?: string;
  regionLinkingMode?: string;
  regions?: string[];
}

export interface ShPolicySummary {
  arn?: string;
  id?: string;
  name?: string;
  description?: string;
  serviceEnabled?: boolean;
  updatedAt?: string;
}

export interface ShPolicy extends ShPolicySummary {
  configurationPolicy?: Record<string, unknown> | null;
}

export interface ShAssociation {
  associationStatus?: string;
  associationType?: string;
  configurationPolicyId?: string;
  targetId?: string;
  targetType?: string;
  updatedAt?: string;
}

export type ShTarget =
  | { targetAccountId: string }
  | { targetOrganizationalUnitId: string }
  | { targetRootId: string };

export function useShHub() {
  return useQuery({
    queryKey: ["aws", "securityhub", "hub"],
    queryFn: () => api<ShHub>("/aws/securityhub/hub"),
  });
}

export function useShEnableHub() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (controlFindingGenerator?: string) =>
      api<{ enabled: boolean }>("/aws/securityhub/hub/enable", {
        method: "POST",
        body: JSON.stringify({ controlFindingGenerator }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "securityhub", "hub"] }),
  });
}

export function useShUpdateHub() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { autoEnableControls?: boolean; controlFindingGenerator?: string }) =>
      api<{ updated: boolean }>("/aws/securityhub/hub", {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "securityhub", "hub"] }),
  });
}

export function useShAdminAccounts() {
  return useQuery({
    queryKey: ["aws", "securityhub", "admins"],
    queryFn: () =>
      api<{ adminAccounts: ShAdminAccount[]; feature?: string }>(
        "/aws/securityhub/organization/admins"
      ),
  });
}

export function useShEnableAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { accountId: string; feature?: string }) =>
      api<{ adminAccountId: string }>("/aws/securityhub/organization/admins/enable", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aws", "securityhub", "admins"] });
      qc.invalidateQueries({ queryKey: ["aws", "securityhub"] });
    },
  });
}

export function useShOrgConfiguration() {
  return useQuery({
    queryKey: ["aws", "securityhub", "org-configuration"],
    queryFn: () => api<ShOrgConfiguration>("/aws/securityhub/organization/configuration"),
  });
}

export function useShUpdateOrgConfiguration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      autoEnable: boolean;
      autoEnableStandards?: string;
      configurationType?: string;
    }) =>
      api<{ updated: boolean }>("/aws/securityhub/organization/configuration", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "securityhub", "org-configuration"] }),
  });
}

export function useShAggregators() {
  return useQuery({
    queryKey: ["aws", "securityhub", "aggregators"],
    queryFn: () =>
      api<{ findingAggregators: { findingAggregatorArn: string }[] }>(
        "/aws/securityhub/finding-aggregators"
      ),
  });
}

export function useShCreateAggregator() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { regionLinkingMode: string; regions?: string[] }) =>
      api<ShAggregator>("/aws/securityhub/finding-aggregators", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "securityhub", "aggregators"] }),
  });
}

export function useShGetAggregator(arn: string | null) {
  return useQuery({
    queryKey: ["aws", "securityhub", "aggregator", arn],
    queryFn: () =>
      api<ShAggregator>("/aws/securityhub/finding-aggregators/get", {
        method: "POST",
        body: JSON.stringify({ findingAggregatorArn: arn }),
      }),
    enabled: !!arn,
  });
}

export function useShUpdateAggregator() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      findingAggregatorArn: string;
      regionLinkingMode: string;
      regions?: string[];
    }) =>
      api<{ findingAggregatorArn: string }>("/aws/securityhub/finding-aggregators", {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aws", "securityhub", "aggregators"] });
      qc.invalidateQueries({ queryKey: ["aws", "securityhub", "aggregator"] });
    },
  });
}

export function useShPolicies() {
  return useQuery({
    queryKey: ["aws", "securityhub", "policies"],
    queryFn: () =>
      api<{ configurationPolicySummaries: ShPolicySummary[]; nextToken?: string }>(
        "/aws/securityhub/configuration-policies"
      ),
  });
}

export function useShCreatePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      name: string;
      description?: string;
      configurationPolicy: Record<string, unknown>;
    }) =>
      api<ShPolicy>("/aws/securityhub/configuration-policies", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "securityhub", "policies"] }),
  });
}

export function useShUpdatePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: string;
      name?: string;
      description?: string;
      configurationPolicy?: Record<string, unknown>;
    }) =>
      api<ShPolicy>("/aws/securityhub/configuration-policies/update", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "securityhub", "policies"] }),
  });
}

export function useShAssociate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ShTarget & { configurationPolicyIdentifier: string }) =>
      api<ShAssociation>("/aws/securityhub/associations/associate", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "securityhub", "associations"] }),
  });
}

export function useShAssociation(target: ShTarget | null) {
  return useQuery({
    queryKey: ["aws", "securityhub", "association", target],
    queryFn: () =>
      api<ShAssociation>("/aws/securityhub/associations/get", {
        method: "POST",
        body: JSON.stringify(target),
      }),
    enabled: !!target,
  });
}

export function useShDisassociate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ShTarget & { configurationPolicyIdentifier: string }) =>
      api<{ disassociating: boolean }>("/aws/securityhub/associations/disassociate", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "securityhub", "associations"] }),
  });
}

export function useShAssociations() {
  return useQuery({
    queryKey: ["aws", "securityhub", "associations"],
    queryFn: () =>
      api<{ configurationPolicyAssociationSummaries: ShAssociation[]; nextToken?: string }>(
        "/aws/securityhub/associations/list",
        { method: "POST" }
      ),
  });
}
