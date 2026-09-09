import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export function useRedshiftClusters(identifier?: string) {
  return useQuery({
    queryKey: ["aws", "redshift", "clusters", identifier ?? null],
    queryFn: () =>
      api<{ clusters: any[]; total: number }>(
        `/aws/redshift/clusters${identifier ? `?identifier=${encodeURIComponent(identifier)}` : ""}`
      ),
  });
}

export function useCreateRedshiftCluster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/redshift/clusters", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "redshift", "clusters"] }),
  });
}

export function useModifyRedshiftCluster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & any) =>
      api(`/aws/redshift/clusters/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "redshift", "clusters"] }),
  });
}

export function useRebootRedshiftCluster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/aws/redshift/clusters/${encodeURIComponent(id)}/reboot`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "redshift", "clusters"] }),
  });
}

export function useDeleteRedshiftCluster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/aws/redshift/clusters/${encodeURIComponent(id)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "redshift", "clusters"] }),
  });
}

export function useRedshiftSnapshots(identifier?: string) {
  return useQuery({
    queryKey: ["aws", "redshift", "snapshots", identifier ?? null],
    queryFn: () =>
      api<{ snapshots: any[]; total: number }>(
        `/aws/redshift/snapshots${identifier ? `?identifier=${encodeURIComponent(identifier)}` : ""}`
      ),
  });
}

export function useCreateRedshiftSnapshot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/redshift/snapshots", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "redshift", "snapshots"] }),
  });
}

export function useDeleteRedshiftSnapshot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/aws/redshift/snapshots/${encodeURIComponent(id)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "redshift", "snapshots"] }),
  });
}

export function useRestoreRedshiftSnapshot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/redshift/snapshots/restore", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aws", "redshift", "clusters"] });
      qc.invalidateQueries({ queryKey: ["aws", "redshift", "snapshots"] });
    },
  });
}

export function useRedshiftParameterGroups() {
  return useQuery({
    queryKey: ["aws", "redshift", "parameter-groups"],
    queryFn: () =>
      api<{ parameterGroups: any[]; total: number }>("/aws/redshift/parameter-groups"),
  });
}

export function useCreateRedshiftParameterGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/redshift/parameter-groups", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "redshift", "parameter-groups"] }),
  });
}

export function useRedshiftParameters(name: string | null) {
  return useQuery({
    queryKey: ["aws", "redshift", "parameters", name],
    queryFn: () =>
      api<{ parameters: any[]; total: number }>(
        `/aws/redshift/parameter-groups/${encodeURIComponent(name!)}/parameters`
      ),
    enabled: !!name,
  });
}

export function useModifyRedshiftParameterGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, ...body }: { name: string } & any) =>
      api(`/aws/redshift/parameter-groups/${encodeURIComponent(name)}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "redshift", "parameters"] }),
  });
}

export function useDeleteRedshiftParameterGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/redshift/parameter-groups/${encodeURIComponent(name)}`, { method: "DELETE" }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "redshift", "parameter-groups"] }),
  });
}

export function useRedshiftSubnetGroups() {
  return useQuery({
    queryKey: ["aws", "redshift", "subnet-groups"],
    queryFn: () =>
      api<{ subnetGroups: any[]; total: number }>("/aws/redshift/subnet-groups"),
  });
}

export function useCreateRedshiftSubnetGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/redshift/subnet-groups", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "redshift", "subnet-groups"] }),
  });
}

export function useModifyRedshiftSubnetGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, ...body }: { name: string } & any) =>
      api(`/aws/redshift/subnet-groups/${encodeURIComponent(name)}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "redshift", "subnet-groups"] }),
  });
}

export function useDeleteRedshiftSubnetGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/redshift/subnet-groups/${encodeURIComponent(name)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "redshift", "subnet-groups"] }),
  });
}

export function useRedshiftTagResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { resourceName: string; tags: { key: string; value: string }[] }) =>
      api("/aws/redshift/tags", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aws", "redshift", "clusters"] });
      qc.invalidateQueries({ queryKey: ["aws", "redshift", "snapshots"] });
    },
  });
}

export function useRedshiftUntagResource() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { resourceName: string; tagKeys: string[] }) =>
      api("/aws/redshift/tags/untag", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aws", "redshift", "clusters"] });
      qc.invalidateQueries({ queryKey: ["aws", "redshift", "snapshots"] });
    },
  });
}

export function useRedshiftTags() {
  return useQuery({
    queryKey: ["aws", "redshift", "tags"],
    queryFn: () =>
      api<{ taggedResources: any[]; total: number }>("/aws/redshift/tags"),
  });
}
