import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

// ─── DB Instance Types ──────────────────────────────────

export interface RDSDBInstance {
  id: string;
  engine: string;
  engineVersion: string;
  status: string;
  dbInstanceClass: string;
  allocatedStorage: number;
  masterUsername: string;
  endpoint?: { address: string; port: number };
  dbName?: string;
  dbClusterIdentifier?: string;
  parameterGroupName?: string;
  iamDatabaseAuthenticationEnabled: boolean;
  createdAt?: string;
  arn?: string;
  vpcSecurityGroups: string[];
  publiclyAccessible: boolean;
  storageType: string;
  multiAZ: boolean;
  autoMinorVersionUpgrade: boolean;
  preferredBackupWindow?: string;
  preferredMaintenanceWindow?: string;
  backupRetentionPeriod: number;
  copyTagsToSnapshot: boolean;
}

export interface DBInstanceListResponse {
  instances: RDSDBInstance[];
  total: number;
}

// ─── DB Cluster Types ──────────────────────────────────

export interface RDSDBCluster {
  id: string;
  engine: string;
  engineVersion: string;
  status: string;
  masterUsername: string;
  databaseName?: string;
  endpoint?: string;
  readerEndpoint?: string;
  port?: number;
  parameterGroupName?: string;
  iamDatabaseAuthenticationEnabled: boolean;
  clusterMembers: string[];
  createdAt?: string;
  arn?: string;
  allocatedStorage?: number;
  backupRetentionPeriod?: number;
  preferredBackupWindow?: string;
  preferredMaintenanceWindow?: string;
  copyTagsToSnapshot?: boolean;
}

export interface DBClusterListResponse {
  clusters: RDSDBCluster[];
  total: number;
}

// ─── Parameter Group Types ─────────────────────────────

export interface RDSParameterGroup {
  name: string;
  family: string;
  description: string;
  arn?: string;
}

export interface RDSParameter {
  name: string;
  value?: string;
  description?: string;
  allowedValues?: string;
  applyType?: string;
  dataType?: string;
  source?: string;
  isModifiable?: boolean;
  minimumEngineVersion?: string;
  applyMethod?: string;
}

export interface ParameterGroupListResponse {
  parameterGroups: RDSParameterGroup[];
  total: number;
}

export interface ParameterListResponse {
  parameterGroup: string;
  parameters: RDSParameter[];
  total: number;
}

export interface ClusterParameterGroupListResponse {
  clusterParameterGroups: RDSParameterGroup[];
  total: number;
}

// ─── DB Instance Hooks ─────────────────────────────────

export function useRDSDBInstances() {
  return useQuery<DBInstanceListResponse>({
    queryKey: ["aws", "rds", "db-instances"],
    queryFn: () => api("/aws/rds/db-instances"),
    refetchInterval: 10000,
  });
}

export function useRDSDBInstance(id: string | null) {
  return useQuery<RDSDBInstance>({
    queryKey: ["aws", "rds", "db-instance", id],
    queryFn: () => api(`/aws/rds/db-instances/${id}`),
    enabled: !!id,
  });
}

export function useRDSCreateDBInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      dbInstanceIdentifier: string;
      dbInstanceClass?: string;
      engine?: string;
      masterUsername?: string;
      masterPassword?: string;
      allocatedStorage?: number;
      dbName?: string;
      dbClusterIdentifier?: string;
      engineVersion?: string;
      publiclyAccessible?: boolean;
      storageType?: string;
      multiAZ?: boolean;
      autoMinorVersionUpgrade?: boolean;
      backupRetentionPeriod?: number;
      iamDatabaseAuthenticationEnabled?: boolean;
      parameterGroupName?: string;
    }) =>
      api("/aws/rds/db-instances", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "rds", "db-instances"] }),
  });
}

export function useRDSDeleteDBInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/aws/rds/db-instances/${id}`, { method: "DELETE" }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "rds", "db-instances"] }),
  });
}

export function useRDSModifyDBInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      masterUserPassword?: string;
      iamDatabaseAuthenticationEnabled?: boolean;
      dbInstanceClass?: string;
      allocatedStorage?: number;
      backupRetentionPeriod?: number;
      preferredMaintenanceWindow?: string;
      publiclyAccessible?: boolean;
      autoMinorVersionUpgrade?: boolean;
      copyTagsToSnapshot?: boolean;
    }) =>
      api(`/aws/rds/db-instances/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aws", "rds", "db-instances"] });
      qc.invalidateQueries({ queryKey: ["aws", "rds", "db-instance"] });
    },
  });
}

export function useRDSRebootDBInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/aws/rds/db-instances/${id}/reboot`, { method: "POST" }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "rds", "db-instances"] }),
  });
}

// ─── DB Cluster Hooks ──────────────────────────────────

export function useRDSDBClusters() {
  return useQuery<DBClusterListResponse>({
    queryKey: ["aws", "rds", "db-clusters"],
    queryFn: () => api("/aws/rds/db-clusters"),
    refetchInterval: 10000,
  });
}

export function useRDSDBCluster(id: string | null) {
  return useQuery<RDSDBCluster>({
    queryKey: ["aws", "rds", "db-cluster", id],
    queryFn: () => api(`/aws/rds/db-clusters/${id}`),
    enabled: !!id,
  });
}

export function useRDSCreateDBCluster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      dbClusterIdentifier: string;
      engine?: string;
      engineVersion?: string;
      masterUsername?: string;
      masterPassword?: string;
      databaseName?: string;
      allocatedStorage?: number;
      backupRetentionPeriod?: number;
      iamDatabaseAuthenticationEnabled?: boolean;
      parameterGroupName?: string;
    }) =>
      api("/aws/rds/db-clusters", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "rds", "db-clusters"] }),
  });
}

export function useRDSDeleteDBCluster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/aws/rds/db-clusters/${id}`, { method: "DELETE" }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "rds", "db-clusters"] }),
  });
}

// ─── Parameter Group Hooks ─────────────────────────────

export function useRDSParameterGroups() {
  return useQuery<ParameterGroupListResponse>({
    queryKey: ["aws", "rds", "parameter-groups"],
    queryFn: () => api("/aws/rds/parameter-groups"),
    refetchInterval: 10000,
  });
}

export function useRDSCreateParameterGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      dbParameterGroupName: string;
      dbParameterGroupFamily?: string;
      description?: string;
    }) =>
      api("/aws/rds/parameter-groups", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ["aws", "rds", "parameter-groups"],
      }),
  });
}

export function useRDSDeleteParameterGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/rds/parameter-groups/${name}`, { method: "DELETE" }),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ["aws", "rds", "parameter-groups"],
      }),
  });
}

export function useRDSParameterGroupParameters(name: string | null) {
  return useQuery<ParameterListResponse>({
    queryKey: ["aws", "rds", "parameter-group", name, "parameters"],
    queryFn: () => api(`/aws/rds/parameter-groups/${name}/parameters`),
    enabled: !!name,
  });
}

export function useRDSModifyParameterGroupParameters() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      name,
      parameters,
    }: {
      name: string;
      parameters: Array<{
        parameterName: string;
        parameterValue: string;
        applyMethod?: string;
      }>;
    }) =>
      api(`/aws/rds/parameter-groups/${name}/parameters`, {
        method: "PATCH",
        body: JSON.stringify({ parameters }),
      }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: ["aws", "rds", "parameter-group", variables.name, "parameters"],
      });
    },
  });
}

// ─── Cluster Parameter Group Hooks ─────────────────────

export function useRDSClusterParameterGroups() {
  return useQuery<ClusterParameterGroupListResponse>({
    queryKey: ["aws", "rds", "cluster-parameter-groups"],
    queryFn: () => api("/aws/rds/cluster-parameter-groups"),
    refetchInterval: 10000,
  });
}

export function useRDSCreateClusterParameterGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      dbClusterParameterGroupName: string;
      dbParameterGroupFamily?: string;
      description?: string;
    }) =>
      api("/aws/rds/cluster-parameter-groups", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ["aws", "rds", "cluster-parameter-groups"],
      }),
  });
}

export function useRDSDeleteClusterParameterGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/rds/cluster-parameter-groups/${name}`, { method: "DELETE" }),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ["aws", "rds", "cluster-parameter-groups"],
      }),
  });
}
