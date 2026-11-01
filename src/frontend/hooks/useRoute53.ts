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
    mutationFn: ({
      zoneId,
      name,
      type,
      ttl,
      records,
    }: {
      zoneId: string;
      name: string;
      type: string;
      ttl?: number;
      records?: string[];
    }) => {
      const qs = new URLSearchParams({ name, type });
      if (ttl != null && records?.length) {
        qs.set("ttl", String(ttl));
        qs.set("records", records.join(","));
      }
      return api(`/aws/route53/hosted-zones/${zoneId}/record-sets?${qs.toString()}`, {
        method: "DELETE",
      });
    },
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

// ─── Hosted zone comment & VPC association ──────────────

export function useUpdateRoute53HostedZoneComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { id: string; comment: string }) =>
      api(`/aws/route53/hosted-zones/${encodeURIComponent(body.id)}/comment`, {
        method: "PUT",
        body: JSON.stringify({ comment: body.comment }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["route53"] }),
  });
}

export function useAssociateRoute53VPC() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { id: string; vpcId: string; vpcRegion: string }) =>
      api(`/aws/route53/hosted-zones/${encodeURIComponent(body.id)}/associate-vpc`, {
        method: "POST",
        body: JSON.stringify({ vpcId: body.vpcId, vpcRegion: body.vpcRegion }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["route53"] }),
  });
}

export function useDisassociateRoute53VPC() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { id: string; vpcId: string; vpcRegion: string }) =>
      api(`/aws/route53/hosted-zones/${encodeURIComponent(body.id)}/disassociate-vpc`, {
        method: "POST",
        body: JSON.stringify({ vpcId: body.vpcId, vpcRegion: body.vpcRegion }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["route53"] }),
  });
}

// ─── VPC association authorizations ─────────────────────

export function useRoute53VPCAuthorizations(zoneId: string | null) {
  return useQuery({
    queryKey: ["route53", "hosted-zones", zoneId, "vpc-authorizations"],
    queryFn: () => api<{ authorizations: any[]; total: number }>(
      `/aws/route53/hosted-zones/${encodeURIComponent(zoneId!)}/vpc-authorizations`
    ),
    enabled: !!zoneId,
  });
}

export function useCreateRoute53VPCAuthorization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { id: string; vpcId: string; vpcRegion: string }) =>
      api(`/aws/route53/hosted-zones/${encodeURIComponent(body.id)}/vpc-authorizations`, {
        method: "POST",
        body: JSON.stringify({ vpcId: body.vpcId, vpcRegion: body.vpcRegion }),
      }),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ["route53", "hosted-zones", v.id, "vpc-authorizations"] }),
  });
}

export function useDeleteRoute53VPCAuthorization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { id: string; vpcId: string; vpcRegion: string }) =>
      api(`/aws/route53/hosted-zones/${encodeURIComponent(body.id)}/vpc-authorizations`, {
        method: "DELETE",
        body: JSON.stringify({ vpcId: body.vpcId, vpcRegion: body.vpcRegion }),
      }),
    onSuccess: (_d, v) =>
      qc.invalidateQueries({ queryKey: ["route53", "hosted-zones", v.id, "vpc-authorizations"] }),
  });
}

export function useRoute53HostedZonesByVPC(vpcId: string | null) {
  return useQuery({
    queryKey: ["route53", "hosted-zones-by-vpc", vpcId],
    queryFn: () =>
      api<{ hostedZoneSummaries: any[]; total: number }>(
        `/aws/route53/hosted-zones-by-vpc?vpcId=${encodeURIComponent(vpcId!)}`
      ),
    enabled: !!vpcId,
  });
}

// ─── Health check status & hosted zone limit ────────────

export function useRoute53HealthCheckStatus(healthCheckId: string | null) {
  return useQuery({
    queryKey: ["route53", "health-checks", healthCheckId, "status"],
    queryFn: () => api<{ observations: any[]; total: number }>(
      `/aws/route53/health-checks/${encodeURIComponent(healthCheckId!)}/status`
    ),
    enabled: !!healthCheckId,
  });
}

export function useRoute53HostedZoneLimit(zoneId: string | null, type: string) {
  return useQuery({
    queryKey: ["route53", "hosted-zones", zoneId, "limit", type],
    queryFn: () => api<{ limit: string; value: number | null; count: number | null }>(
      `/aws/route53/hosted-zones/${encodeURIComponent(zoneId!)}/limit/${encodeURIComponent(type)}`
    ),
    enabled: !!zoneId,
  });
}
