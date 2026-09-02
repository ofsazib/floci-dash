import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

const PRICING_KEY = ["aws", "pricing"];

// ─── Queries ──────────────────────────────────────────────

export function usePricingServices(params?: { formatVersion?: string; maxResults?: number; serviceCode?: string }) {
  const qs = new URLSearchParams();
  if (params?.formatVersion) qs.set("formatVersion", params.formatVersion);
  if (params?.maxResults != null) qs.set("maxResults", String(params.maxResults));
  if (params?.serviceCode) qs.set("serviceCode", params.serviceCode);
  const q = qs.toString();
  return useQuery({
    queryKey: [...PRICING_KEY, "services", q],
    queryFn: () => api<any>(`/aws/pricing/services${q ? `?${q}` : ""}`),
  });
}

export function usePricingAttributeValues(serviceCode: string | null) {
  return useQuery({
    queryKey: [...PRICING_KEY, "attribute-values", serviceCode],
    queryFn: () => api<any>(`/aws/pricing/services/${serviceCode}/attributes`),
    enabled: !!serviceCode,
  });
}

export function usePricingProducts(params: { serviceCode: string; filters?: any; maxResults?: number } | null) {
  const qs = new URLSearchParams();
  if (params?.serviceCode) qs.set("serviceCode", params.serviceCode);
  if (params?.filters) qs.set("filters", JSON.stringify(params.filters));
  if (params?.maxResults != null) qs.set("maxResults", String(params.maxResults));
  const q = qs.toString();
  return useQuery({
    queryKey: [...PRICING_KEY, "products", q],
    queryFn: () => api<any>(`/aws/pricing/products?${q}`),
    enabled: !!params?.serviceCode,
  });
}

export function usePricingPriceLists(serviceCode: string | null) {
  return useQuery({
    queryKey: [...PRICING_KEY, "price-lists", serviceCode],
    queryFn: () => api<any>(`/aws/pricing/price-lists?serviceCode=${serviceCode}`),
    enabled: !!serviceCode,
  });
}

// ─── Mutation ─────────────────────────────────────────────

export function usePricingPriceListFileUrl() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/pricing/price-list-file-url", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: PRICING_KEY }),
  });
}
