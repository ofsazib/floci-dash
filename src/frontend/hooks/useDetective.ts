import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface DtAdminAccount {
  accountId?: string;
}

export interface DtGraph {
  arn?: string;
}

export interface DtMember {
  accountId?: string;
  emailAddress?: string;
  status?: string;
  graphArn?: string;
  administratorId?: string;
  invitationType?: string;
}

export function useDtAdminAccounts() {
  return useQuery({
    queryKey: ["aws", "detective", "admins"],
    queryFn: () =>
      api<{ administrators: DtAdminAccount[] }>("/aws/detective/organization/admins", {
        method: "POST",
      }),
  });
}

export function useDtEnableAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (accountId: string) =>
      api<{ enabled: boolean }>("/aws/detective/organization/admins/enable", {
        method: "POST",
        body: JSON.stringify({ accountId }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aws", "detective", "admins"] });
      qc.invalidateQueries({ queryKey: ["aws", "detective", "graphs"] });
    },
  });
}

export function useDtGraphs() {
  return useQuery({
    queryKey: ["aws", "detective", "graphs"],
    queryFn: () => api<{ graphList: DtGraph[] }>("/aws/detective/graphs", { method: "POST" }),
  });
}

export function useDtOrgConfiguration(graphArn: string | null) {
  return useQuery({
    queryKey: ["aws", "detective", "org-configuration", graphArn],
    queryFn: () =>
      api<{ autoEnable: boolean }>("/aws/detective/organization/configuration/get", {
        method: "POST",
        body: JSON.stringify({ graphArn }),
      }),
    enabled: !!graphArn,
  });
}

export function useDtUpdateOrgConfiguration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { graphArn: string; autoEnable: boolean }) =>
      api<{ updated: boolean }>("/aws/detective/organization/configuration", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "detective", "org-configuration"] }),
  });
}

export function useDtMembers(graphArn: string | null) {
  return useQuery({
    queryKey: ["aws", "detective", "members", graphArn],
    queryFn: () =>
      api<{ memberDetails: DtMember[] }>("/aws/detective/members", {
        method: "POST",
        body: JSON.stringify({ graphArn }),
      }),
    enabled: !!graphArn,
  });
}

export function useDtCreateMembers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      graphArn: string;
      accounts: { accountId: string; emailAddress?: string }[];
    }) =>
      api<{ members: DtMember[]; unprocessedAccounts: unknown[] }>(
        "/aws/detective/members/create",
        { method: "POST", body: JSON.stringify(input) }
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "detective", "members"] }),
  });
}

export function useDtStartMonitoring() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { graphArn: string; accountId: string }) =>
      api<{ monitoring: boolean }>("/aws/detective/members/monitoring", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "detective", "members"] }),
  });
}
