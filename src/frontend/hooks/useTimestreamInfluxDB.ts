import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface TsInstance {
  id?: string;
  name?: string;
  status?: string;
  dbInstanceType?: string;
  endpoint?: string;
  port?: number;
}

export interface TsCluster {
  id?: string;
  name?: string;
  status?: string;
  endpoint?: string;
  readerEndpoint?: string;
}

export interface TsBackup {
  id?: string;
  name?: string;
  arn?: string;
}

export interface TsParameterGroup {
  id?: string;
  name?: string;
  description?: string;
}

const enc = encodeURIComponent;

export function useTsInstances() {
  return useQuery({
    queryKey: ["aws", "timestreaminfluxdb", "instances"],
    queryFn: () =>
      api<{ instances: TsInstance[]; total: number }>(
        "/aws/timestreaminfluxdb/db-instances"
      ),
  });
}

export function useCreateTsInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      name: string;
      password: string;
      dbInstanceType: string;
      vpcSubnetIds: string[];
      vpcSecurityGroupIds: string[];
      allocatedStorage: number;
    }) =>
      api<{ instance: TsInstance }>("/aws/timestreaminfluxdb/db-instances", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "timestreaminfluxdb", "instances"] }),
  });
}

export function useDeleteTsInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/timestreaminfluxdb/db-instances/${enc(name)}`, { method: "DELETE" }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "timestreaminfluxdb", "instances"] }),
  });
}

export function useRebootTsInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/timestreaminfluxdb/db-instances/${enc(name)}/reboot`, { method: "POST" }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "timestreaminfluxdb", "instances"] }),
  });
}

export function useTsClusters() {
  return useQuery({
    queryKey: ["aws", "timestreaminfluxdb", "clusters"],
    queryFn: () =>
      api<{ clusters: TsCluster[]; total: number }>("/aws/timestreaminfluxdb/db-clusters"),
  });
}

export function useCreateTsCluster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      name: string;
      dbInstanceType: string;
      vpcSubnetIds: string[];
    }) =>
      api<{ cluster: TsCluster }>("/aws/timestreaminfluxdb/db-clusters", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "timestreaminfluxdb", "clusters"] }),
  });
}

export function useDeleteTsCluster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/timestreaminfluxdb/db-clusters/${enc(name)}`, { method: "DELETE" }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "timestreaminfluxdb", "clusters"] }),
  });
}

export function useTsBackups() {
  return useQuery({
    queryKey: ["aws", "timestreaminfluxdb", "backups"],
    queryFn: () =>
      api<{ backups: TsBackup[]; total: number }>("/aws/timestreaminfluxdb/db-backups"),
  });
}

export function useCreateTsBackup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; dbResourceId: string }) =>
      api<{ backup: TsBackup }>("/aws/timestreaminfluxdb/db-backups", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "timestreaminfluxdb", "backups"] }),
  });
}

export function useDeleteTsBackup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/timestreaminfluxdb/db-backups/${enc(name)}`, { method: "DELETE" }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "timestreaminfluxdb", "backups"] }),
  });
}

export function useTsParameterGroups() {
  return useQuery({
    queryKey: ["aws", "timestreaminfluxdb", "parameter-groups"],
    queryFn: () =>
      api<{ parameterGroups: TsParameterGroup[]; total: number }>(
        "/aws/timestreaminfluxdb/db-parameter-groups"
      ),
  });
}

export function useCreateTsParameterGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; description: string; parameters: unknown[] }) =>
      api<{ parameterGroup: TsParameterGroup }>(
        "/aws/timestreaminfluxdb/db-parameter-groups",
        { method: "POST", body: JSON.stringify(body) }
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "timestreaminfluxdb", "parameter-groups"] }),
  });
}
