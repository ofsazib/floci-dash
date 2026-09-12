import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface Re2Index {
  arn: string;
  region: string | null;
  type: string | null;
}

export interface Re2View {
  arn: string;
}

export interface Re2Resource {
  arn: string;
  resourceType: string | null;
  region: string | null;
  service: string | null;
  owningAccountId: string | null;
  lastReportedAt?: string | null;
}

export interface Re2ResourceType {
  resourceType: string | null;
  service: string | null;
}

const BASE = "/aws/resourceexplorer2";
const qs = (arn: string) => `?arn=${encodeURIComponent(arn)}`;

// ---------- Indexes ----------

export function useRe2Indexes() {
  return useQuery({
    queryKey: ["re2", "indexes"],
    queryFn: () => api<{ indexes: Re2Index[]; total: number }>(`${BASE}/indexes`),
  });
}

export function useRe2IndexDetail() {
  return useQuery({
    queryKey: ["re2", "indexes", "detail"],
    queryFn: () => api<{ index: any }>(`${BASE}/indexes/detail`),
  });
}

export function useRe2CreateIndex() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { tags?: Record<string, string> | string }) =>
      api(`${BASE}/indexes`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["re2"] }),
  });
}

export function useRe2DeleteIndex() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (arn: string) => api(`${BASE}/indexes${qs(arn)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["re2"] }),
  });
}

export function useRe2UpdateIndexType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { arn: string; type: string }) =>
      api(`${BASE}/indexes/type`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["re2"] }),
  });
}

export function useRe2ServiceConfig() {
  return useQuery({
    queryKey: ["re2", "service-config"],
    queryFn: () => api<any>(`${BASE}/service-config`),
  });
}

// ---------- Views ----------

export function useRe2Views() {
  return useQuery({
    queryKey: ["re2", "views"],
    queryFn: () => api<{ views: Re2View[]; total: number }>(`${BASE}/views`),
  });
}

export function useRe2ViewDetail(arn: string | null) {
  return useQuery({
    queryKey: ["re2", "views", "detail", arn],
    queryFn: () => api<{ view: any; tags: Record<string, string> }>(`${BASE}/views/detail${qs(arn!)}`),
    enabled: !!arn,
  });
}

export function useRe2CreateView() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      viewName: string;
      filters?: string;
      includedProperties?: string;
      scope?: string;
      tags?: Record<string, string>;
    }) => api(`${BASE}/views`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["re2"] }),
  });
}

export function useRe2UpdateView() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { viewArn: string; filters?: string; includedProperties?: string }) =>
      api(`${BASE}/views/update`, { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["re2"] }),
  });
}

export function useRe2DeleteView() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (arn: string) => api(`${BASE}/views${qs(arn)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["re2"] }),
  });
}

export function useRe2DefaultView() {
  return useQuery({
    queryKey: ["re2", "views", "default"],
    queryFn: () => api<{ viewArn: string | null }>(`${BASE}/views/default`),
  });
}

export function useRe2AssociateDefaultView() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (viewArn: string) =>
      api(`${BASE}/views/associate-default`, {
        method: "POST",
        body: JSON.stringify({ viewArn }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["re2"] }),
  });
}

export function useRe2DisassociateDefaultView() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api(`${BASE}/views/disassociate-default`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["re2"] }),
  });
}

// ---------- Search and resource types ----------

export function useRe2Search() {
  return useMutation({
    mutationFn: (body: { queryString: string; viewArn?: string; maxResults?: number }) =>
      api<{ resources: Re2Resource[]; viewArn: string | null; total: number }>(`${BASE}/search`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
  });
}

export function useRe2ResourceTypes() {
  return useQuery({
    queryKey: ["re2", "resource-types"],
    queryFn: () => api<{ types: Re2ResourceType[]; total: number }>(`${BASE}/resource-types`),
  });
}
