import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface ServiceQuotaSummary {
  serviceCode?: string;
  serviceName?: string;
  quotaCode?: string;
  quotaName?: string;
  quotaArn?: string;
  value?: number;
  unit?: string;
  adjustable?: boolean;
  globalQuota?: boolean;
  quotaAppliedAtLevel?: string;
}

export function useServiceQuotas(serviceCode: string | null, defaults = false) {
  return useQuery<{ quotas: ServiceQuotaSummary[]; total: number; nextToken: string | null; defaults: boolean }>({
    queryKey: ["aws", "servicequotas", "quotas", serviceCode, defaults],
    queryFn: () =>
      api(
        `/aws/servicequotas/quotas?serviceCode=${encodeURIComponent(serviceCode!)}&defaults=${defaults}`
      ),
    enabled: !!serviceCode,
  });
}

export function useRequestServiceQuotaIncrease() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { serviceCode: string; quotaCode: string; desiredValue: number }) =>
      api("/aws/servicequotas/quotas/request-increase", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "servicequotas", "quotas"] }),
  });
}
