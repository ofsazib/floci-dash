import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

const RGT_KEY = ["aws", "resourcegroupstagging"];

// ─── Queries ──────────────────────────────────────────────

export function useRGTResources(params?: { tagFilters?: any; resourceTypeFilters?: string[] }) {
  const qs = new URLSearchParams();
  if (params?.tagFilters) qs.set("tagFilters", JSON.stringify(params.tagFilters));
  if (params?.resourceTypeFilters?.length) {
    params.resourceTypeFilters.forEach((t) => qs.append("resourceTypeFilters", t));
  }
  const q = qs.toString();
  return useQuery({
    queryKey: [...RGT_KEY, "resources", q],
    queryFn: () => api<any>(`/aws/tagging/resources${q ? `?${q}` : ""}`),
  });
}

export function useRGTTagKeys() {
  return useQuery({
    queryKey: [...RGT_KEY, "tag-keys"],
    queryFn: () => api<any>("/aws/tagging/tag-keys"),
  });
}

export function useRGTTagValues(key: string | null) {
  return useQuery({
    queryKey: [...RGT_KEY, "tag-values", key],
    queryFn: () => api<any>(`/aws/tagging/tag-values?key=${key}`),
    enabled: !!key,
  });
}

// ─── Mutations ────────────────────────────────────────────

export function useRGTTagResources() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/tagging/tag", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: RGT_KEY }),
  });
}

export function useRGTUntagResources() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/tagging/untag", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: RGT_KEY }),
  });
}
