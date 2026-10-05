import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface CaDomain {
  name?: string;
  arn?: string;
  status?: string;
  owner?: string;
  encryptionKey?: string;
  createdTime?: string;
}

export interface CaRepository {
  name?: string;
  arn?: string;
  domainName?: string;
  domainOwner?: string;
  description?: string;
  upstreams?: { repositoryName: string }[];
  externalConnections?: { externalConnectionName: string }[];
}

export function useCaDomains() {
  return useQuery({
    queryKey: ["aws", "codeartifact", "domains"],
    queryFn: () =>
      api<{ domains: CaDomain[]; nextToken?: string }>("/aws/codeartifact/domains"),
  });
}

export function useCaCreateDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; encryptionKey?: string }) =>
      api<{ domain: CaDomain | null }>("/aws/codeartifact/domains", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "codeartifact", "domains"] }),
  });
}

export function useCaDeleteDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api<{ domain: CaDomain | null }>("/aws/codeartifact/domains", {
        method: "DELETE",
        body: JSON.stringify({ name }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aws", "codeartifact", "domains"] });
      qc.invalidateQueries({ queryKey: ["aws", "codeartifact", "repositories"] });
    },
  });
}

export function useCaAuthToken() {
  return useMutation({
    mutationFn: (domain: string) =>
      api<{ authorizationToken: string; expiration: number }>(
        "/aws/codeartifact/authorization-token",
        { method: "POST", body: JSON.stringify({ domain }) }
      ),
  });
}

export function useCaRepositories(prefix?: string) {
  return useQuery({
    queryKey: ["aws", "codeartifact", "repositories", prefix ?? ""],
    queryFn: () =>
      api<{ repositories: CaRepository[]; nextToken?: string }>(
        `/aws/codeartifact/repositories${prefix ? `?prefix=${encodeURIComponent(prefix)}` : ""}`
      ),
  });
}

export function useCaCreateRepository() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      domain: string;
      name: string;
      description?: string;
      upstreams?: string[];
    }) =>
      api<{ repository: CaRepository | null }>("/aws/codeartifact/repositories", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "codeartifact", "repositories"] }),
  });
}

export function useCaDeleteRepository() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { domain: string; name: string }) =>
      api<{ repository: CaRepository | null }>("/aws/codeartifact/repositories", {
        method: "DELETE",
        body: JSON.stringify(input),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "codeartifact", "repositories"] }),
  });
}

export function useCaRepositoryEndpoint(domain: string | null, repository: string | null) {
  return useQuery({
    queryKey: ["aws", "codeartifact", "endpoint", domain, repository],
    queryFn: () =>
      api<{ repositoryEndpoint: string }>(
        `/aws/codeartifact/repositories/endpoint?domain=${encodeURIComponent(domain!)}&repository=${encodeURIComponent(repository!)}`
      ),
    enabled: !!domain && !!repository,
  });
}

export function useCaFetchEndpoint() {
  return useMutation({
    mutationFn: (input: { domain: string; repository: string }) =>
      api<{ repositoryEndpoint: string }>(
        `/aws/codeartifact/repositories/endpoint?domain=${encodeURIComponent(input.domain)}&repository=${encodeURIComponent(input.repository)}`
      ),
  });
}

export function useCaAssociateExternalConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { domain: string; repository: string; externalConnection: string }) =>
      api<{ repository: CaRepository | null }>("/aws/codeartifact/external-connections", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "codeartifact", "repositories"] }),
  });
}

export function useCaDisassociateExternalConnection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { domain: string; repository: string; externalConnection: string }) =>
      api<{ repository: CaRepository | null }>("/aws/codeartifact/external-connections", {
        method: "DELETE",
        body: JSON.stringify(input),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "codeartifact", "repositories"] }),
  });
}
