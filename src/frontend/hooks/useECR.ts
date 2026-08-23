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

export interface ECRScanningConfiguration {
  repositoryArn: string | null;
  scanOnPush: boolean;
  scanFrequency: string | null;
  appliedScanFilters: Array<{ filter?: string; filterType?: string }>;
}

export interface ECRScanningConfigurationResponse {
  repositoryName: string;
  scanningConfiguration: ECRScanningConfiguration | null;
  failure: { repositoryName?: string; failureCode?: string; failureReason?: string } | null;
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

export function useECRScanningConfiguration(repoName: string | null) {
  return useQuery<ECRScanningConfigurationResponse>({
    queryKey: ["aws", "ecr", "scanning-configuration", repoName],
    queryFn: () =>
      api(`/aws/ecr/repositories/${encodeURIComponent(repoName!)}/scanning-configuration`),
    enabled: !!repoName,
  });
}

export interface ECRImageManifest {
  repositoryName: string;
  image: {
    registryId?: string;
    repositoryName?: string;
    imageId?: { imageDigest?: string; imageTag?: string };
    imageManifest?: string;
    imageManifestMediaType?: string;
  } | null;
}

export interface ECRManifestParams {
  repoName: string;
  tag?: string;
  digest?: string;
}

export function useECRImageManifest() {
  return useMutation<ECRImageManifest, Error, ECRManifestParams>({
    mutationFn: ({ repoName, tag, digest }) => {
      const params = new URLSearchParams();
      if (tag) params.set("tag", tag);
      if (digest) params.set("digest", digest);
      return api(
        `/aws/ecr/repositories/${encodeURIComponent(repoName)}/images/manifest?${params.toString()}`,
      );
    },
  });
}

export interface ECRAuthToken {
  authorizationToken: string | null;
  expiresAt: string | null;
  proxyEndpoint: string | null;
}

export function useECRAuthToken() {
  return useQuery<ECRAuthToken>({
    queryKey: ["aws", "ecr", "auth-token"],
    queryFn: () => api("/aws/ecr/auth-token"),
    enabled: false,
  });
}


export function usePutECRImageTagMutability() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { repositoryName: string; tagMutability: string }) =>
      api(`/aws/ecr/repositories/${encodeURIComponent(params.repositoryName)}/tag-mutability`, {
        method: "PUT",
        body: JSON.stringify({ tagMutability: params.tagMutability }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "ecr", "repositories"] }),
  });
}
