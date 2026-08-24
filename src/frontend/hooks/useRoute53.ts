import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

// ─── Hosted Zones ────────────────────────────────────────

export function useRoute53HostedZones() {
  return useQuery({
    queryKey: ["aws", "route53", "hosted-zones"],
    queryFn: () =>
      api<{ hostedZones: any[]; total: number }>("/aws/route53/hosted-zones"),
    refetchInterval: 15000,
  });
}

export function useRoute53HostedZone(id: string | null) {
  return useQuery({
    queryKey: ["aws", "route53", "hosted-zones", id],
    queryFn: () => api<{ hostedZone: any; delegationSet: any }>(`/aws/route53/hosted-zones/${id}`),
    enabled: !!id,
  });
}

export function useCreateRoute53HostedZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/route53/hosted-zones", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "route53", "hosted-zones"] }),
  });
}

export function useDeleteRoute53HostedZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/aws/route53/hosted-zones/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "route53", "hosted-zones"] }),
  });
}

// ─── Resource Record Sets ────────────────────────────────

export function useRoute53RecordSets(zoneId: string | null) {
  return useQuery({
    queryKey: ["aws", "route53", "hosted-zones", zoneId, "record-sets"],
    queryFn: () =>
      api<{ recordSets: any[]; total: number }>(`/aws/route53/hosted-zones/${zoneId}/record-sets`),
    enabled: !!zoneId,
  });
}

export function useCreateRoute53RecordSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ zoneId, ...body }: any) =>
      api(`/aws/route53/hosted-zones/${zoneId}/record-sets`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "route53", "hosted-zones"] }),
  });
}

export function useDeleteRoute53RecordSet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ zoneId, name, type }: { zoneId: string; name: string; type: string }) =>
      api(
        `/aws/route53/hosted-zones/${zoneId}/record-sets?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`,
        { method: "DELETE" }
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "route53", "hosted-zones"] }),
  });
}

// ─── Health Checks ───────────────────────────────────────

export function useRoute53HealthChecks() {
  return useQuery({
    queryKey: ["aws", "route53", "health-checks"],
    queryFn: () =>
      api<{ healthChecks: any[]; total: number }>("/aws/route53/health-checks"),
  });
}

export function useCreateRoute53HealthCheck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/route53/health-checks", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "route53", "health-checks"] }),
  });
}

export function useDeleteRoute53HealthCheck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api(`/aws/route53/health-checks/${encodeURIComponent(id)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "route53", "health-checks"] }),
  });
}

// ── Tags ───────────────────────────────────────────────

export function useRoute53Tags(resourceType: string, resourceId: string | null) {
  return useQuery<{ tags: { key: string; value: string }[] }>({
    queryKey: ["aws", "route53", "tags", resourceType, resourceId],
    queryFn: () =>
      api(`/aws/route53/tags/${encodeURIComponent(resourceType)}/${encodeURIComponent(resourceId!)}`),
    enabled: !!resourceId,
  });
}

export function useAddRoute53Tags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { resourceType: string; resourceId: string; tags: Record<string, string> }) =>
      api(`/aws/route53/tags/${encodeURIComponent(params.resourceType)}/${encodeURIComponent(params.resourceId)}`, {
        method: "POST",
        body: JSON.stringify({ tags: params.tags }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "route53", "tags"] }),
  });
}

export function useRemoveRoute53Tags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { resourceType: string; resourceId: string; tagKeys: string[] }) =>
      api(`/aws/route53/tags/${encodeURIComponent(params.resourceType)}/${encodeURIComponent(params.resourceId)}`, {
        method: "DELETE",
        body: JSON.stringify({ tagKeys: params.tagKeys }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "route53", "tags"] }),
  });
}

// ── Change status + DNSSEC + limits ────────────────────

export function useRoute53Change(changeId: string | null) {
  return useQuery<any>({
    queryKey: ["aws", "route53", "changes", changeId],
    queryFn: () => api(`/aws/route53/changes/${encodeURIComponent(changeId!)}`),
    enabled: !!changeId,
  });
}

export function useRoute53Dnssec(hostedZoneId: string | null) {
  return useQuery<any>({
    queryKey: ["aws", "route53", "dnssec", hostedZoneId],
    queryFn: () => api(`/aws/route53/hostedzones/${encodeURIComponent(hostedZoneId!)}/dnssec`),
    enabled: !!hostedZoneId,
  });
}

export function useRoute53AccountLimit(type: string) {
  return useQuery<any>({
    queryKey: ["aws", "route53", "account-limit", type],
    queryFn: () => api(`/aws/route53/account-limit/${encodeURIComponent(type)}`),
  });
}
