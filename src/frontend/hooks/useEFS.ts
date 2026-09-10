import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface EfsFileSystem {
  FileSystemId: string;
  Name?: string;
  LifeCycleState: string;
  Encrypted?: boolean;
  PerformanceMode?: string;
  ThroughputMode?: string;
  NumberOfMountTargets?: number;
  SizeInBytes?: { Value: number };
  CreationTime?: number;
  Tags?: { Key: string; Value: string }[];
}

export interface EfsMountTarget {
  MountTargetId: string;
  FileSystemId: string;
  SubnetId: string;
  IpAddress?: string;
  LifeCycleState?: string;
}

export interface EfsAccessPoint {
  AccessPointId: string;
  FileSystemId: string;
  Name?: string;
  LifeCycleState?: string;
}

export function useEfsFileSystems() {
  return useQuery({
    queryKey: ["efs", "file-systems"],
    queryFn: async () => {
      const data = await api<{ fileSystems: EfsFileSystem[]; total: number }>(
        "/aws/efs/file-systems"
      );
      return data;
    },
  });
}

export function useEfsMountTargets(fileSystemId: string | null) {
  return useQuery({
    queryKey: ["efs", "mount-targets", fileSystemId],
    queryFn: async () => {
      const data = await api<{ mountTargets: EfsMountTarget[]; total: number }>(
        `/aws/efs/mount-targets?fileSystemId=${encodeURIComponent(fileSystemId!)}`
      );
      return data;
    },
    enabled: !!fileSystemId,
  });
}

export function useEfsAccessPoints(fileSystemId: string | null) {
  return useQuery({
    queryKey: ["efs", "access-points", fileSystemId],
    queryFn: async () => {
      const data = await api<{ accessPoints: EfsAccessPoint[]; total: number }>(
        `/aws/efs/access-points?fileSystemId=${encodeURIComponent(fileSystemId!)}`
      );
      return data;
    },
    enabled: !!fileSystemId,
  });
}

export function useEfsTags(fileSystemId: string | null) {
  return useQuery({
    queryKey: ["efs", "tags", fileSystemId],
    queryFn: async () => {
      const data = await api<{ tags: { Key: string; Value: string }[] }>(
        `/aws/efs/file-systems/${encodeURIComponent(fileSystemId!)}/tags`
      );
      return data;
    },
    enabled: !!fileSystemId,
  });
}

export function useCreateEfsFileSystem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      creationToken: string;
      performanceMode?: string;
      encrypted?: boolean;
      throughputMode?: string;
      provisionedThroughputInMibps?: number;
      backup?: boolean;
      tags?: { Key: string; Value: string }[];
    }) => {
      const data = await api<{ fileSystem: EfsFileSystem }>(
        "/aws/efs/file-systems",
        { method: "POST", body: JSON.stringify(body) }
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["efs"] });
    },
  });
}

export function useUpdateEfsFileSystem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      fileSystemId,
      ...body
    }: {
      fileSystemId: string;
      throughputMode?: string;
      provisionedThroughputInMibps?: number;
    }) => {
      const data = await api<{ fileSystem: EfsFileSystem }>(
        `/aws/efs/file-systems/${encodeURIComponent(fileSystemId)}`,
        { method: "PUT", body: JSON.stringify(body) }
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["efs"] });
    },
  });
}

export function useDeleteEfsFileSystem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (fileSystemId: string) => {
      const data = await api<{ deleted: boolean }>(
        `/aws/efs/file-systems/${encodeURIComponent(fileSystemId)}`,
        { method: "DELETE" }
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["efs"] });
    },
  });
}

export function useCreateEfsMountTarget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      fileSystemId: string;
      subnetId: string;
      ipAddress?: string;
      securityGroups?: string[];
    }) => {
      const data = await api<{ mountTarget: EfsMountTarget }>(
        "/aws/efs/mount-targets",
        { method: "POST", body: JSON.stringify(body) }
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["efs"] });
    },
  });
}

export function useDeleteEfsMountTarget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (mountTargetId: string) => {
      const data = await api<{ deleted: boolean }>(
        `/aws/efs/mount-targets/${encodeURIComponent(mountTargetId)}`,
        { method: "DELETE" }
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["efs"] });
    },
  });
}

export function useCreateEfsAccessPoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      clientToken: string;
      fileSystemId: string;
      name?: string;
      posixUser?: Record<string, unknown>;
      rootDirectory?: Record<string, unknown>;
      tags?: { Key: string; Value: string }[];
    }) => {
      const data = await api<{ accessPoint: EfsAccessPoint }>(
        "/aws/efs/access-points",
        { method: "POST", body: JSON.stringify(body) }
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["efs"] });
    },
  });
}

export function useDeleteEfsAccessPoint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (accessPointId: string) => {
      const data = await api<{ deleted: boolean }>(
        `/aws/efs/access-points/${encodeURIComponent(accessPointId)}`,
        { method: "DELETE" }
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["efs"] });
    },
  });
}

export function useCreateEfsTags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      fileSystemId,
      tags,
    }: {
      fileSystemId: string;
      tags: { Key: string; Value: string }[];
    }) => {
      const data = await api<{ created: boolean }>(
        `/aws/efs/file-systems/${encodeURIComponent(fileSystemId)}/tags`,
        { method: "POST", body: JSON.stringify({ tags }) }
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["efs"] });
    },
  });
}

export function useDeleteEfsTags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      fileSystemId,
      tagKeys,
    }: {
      fileSystemId: string;
      tagKeys: string[];
    }) => {
      const data = await api<{ deleted: boolean }>(
        `/aws/efs/file-systems/${encodeURIComponent(fileSystemId)}/tags`,
        { method: "DELETE", body: JSON.stringify({ tagKeys }) }
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["efs"] });
    },
  });
}
