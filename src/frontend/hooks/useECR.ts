import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface ECRRepository {
  repositoryName: string;
  repositoryUri: string | null;
  createdAt: string | null;
  imageTagMutability: string | null;
  encryptionConfiguration: any;
  tags: Array<{ Key: string; Value: string }>;
}

export interface ECRImage {
  imageDigest: string | null;
  imageTags: string[];
  imageSizeInBytes: number | null;
  imagePushedAt: string | null;
  imageScanStatus: string | null;
  imageScanFindingsSummary: any;
}

export function useECRRepositories() {
  return useQuery<{ repositories: ECRRepository[]; total: number }>({
    queryKey: ["aws", "ecr", "repositories"],
    queryFn: () => api("/aws/ecr/repositories"),
    refetchInterval: 10000,
  });
}

export function useECRCreateRepository() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, tags }: { name: string; tags?: Record<string, string> }) =>
      api("/aws/ecr/repositories", {
        method: "POST",
        body: JSON.stringify({ repositoryName: name, tags }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ecr", "repositories"] }),
  });
}

export function useECRDeleteRepository() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/ecr/repositories/${encodeURIComponent(name)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ecr", "repositories"] }),
  });
}

export function useECRImages(repoName: string | null) {
  return useQuery<{ images: ECRImage[]; total: number }>({
    queryKey: ["aws", "ecr", "images", repoName],
    queryFn: () => api(`/aws/ecr/repositories/${encodeURIComponent(repoName!)}/images`),
    enabled: !!repoName,
    refetchInterval: 10000,
  });
}

export function useECRDeleteImages(repoName: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (imageIds: Array<{ imageDigest?: string; imageTag?: string }>) =>
      api(`/aws/ecr/repositories/${encodeURIComponent(repoName)}/images`, {
        method: "DELETE",
        body: JSON.stringify({ imageIds }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ecr", "images", repoName] }),
  });
}

export function useECRRepositoryPolicy(repoName: string | null) {
  return useQuery<{ repositoryName: string; policyText: string | null }>({
    queryKey: ["aws", "ecr", "policy", repoName],
    queryFn: () => api(`/aws/ecr/repositories/${encodeURIComponent(repoName!)}/policy`),
    enabled: !!repoName,
  });
}

export function useECRSetRepositoryPolicy(repoName: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (policyText: string) =>
      api(`/aws/ecr/repositories/${encodeURIComponent(repoName)}/policy`, {
        method: "PUT",
        body: JSON.stringify({ policyText }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ecr", "policy", repoName] }),
  });
}

export function useECRDeleteRepositoryPolicy(repoName: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api(`/aws/ecr/repositories/${encodeURIComponent(repoName)}/policy`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ecr", "policy", repoName] }),
  });
}

export function useECRLifecyclePolicy(repoName: string | null) {
  return useQuery<{ repositoryName: string; lifecyclePolicyText: string | null }>({
    queryKey: ["aws", "ecr", "lifecycle", repoName],
    queryFn: () => api(`/aws/ecr/repositories/${encodeURIComponent(repoName!)}/lifecycle`),
    enabled: !!repoName,
  });
}

export function useECRPutLifecyclePolicy(repoName: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (lifecyclePolicyText: string) =>
      api(`/aws/ecr/repositories/${encodeURIComponent(repoName)}/lifecycle`, {
        method: "PUT",
        body: JSON.stringify({ lifecyclePolicyText }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ecr", "lifecycle", repoName] }),
  });
}
