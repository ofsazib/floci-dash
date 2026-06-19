import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface OpenSearchDomain {
  DomainName: string;
  EngineType?: string;
}

export interface OpenSearchDomainStatus {
  DomainName: string;
  DomainId?: string;
  ARN?: string;
  EngineVersion?: string;
  Processing?: boolean;
  Deleted?: boolean;
  Endpoint?: string;
  ClusterConfig?: {
    InstanceType?: string;
    InstanceCount?: number;
    DedicatedMasterEnabled?: boolean;
    ZoneAwarenessEnabled?: boolean;
  };
  EBSOptions?: {
    EBSEnabled?: boolean;
    VolumeType?: string;
    VolumeSize?: number;
  };
  CreatedAt?: number;
}

// ── Domains ──────────────────────────────────────────────

export function useOpenSearchDomains() {
  return useQuery<{ domains: OpenSearchDomain[]; total: number }>({
    queryKey: ["aws", "opensearch", "domains"],
    queryFn: () => api("/aws/opensearch/domains"),
    refetchInterval: 15000,
  });
}

export function useOpenSearchDomain(name: string | null) {
  return useQuery<{ domain: OpenSearchDomainStatus }>({
    queryKey: ["aws", "opensearch", "domain", name],
    queryFn: () => api(`/aws/opensearch/domains/${encodeURIComponent(name!)}`),
    enabled: !!name,
  });
}

export function useCreateOpenSearchDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { domainName: string; engineVersion?: string }) =>
      api("/aws/opensearch/domains", { method: "POST", body: JSON.stringify(params) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "opensearch", "domains"] }),
  });
}

export function useDeleteOpenSearchDomain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/opensearch/domains/${encodeURIComponent(name)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "opensearch", "domains"] }),
  });
}

// ── Versions ─────────────────────────────────────────────

export function useOpenSearchVersions() {
  return useQuery<{ versions: string[]; total: number }>({
    queryKey: ["aws", "opensearch", "versions"],
    queryFn: () => api("/aws/opensearch/versions"),
  });
}
