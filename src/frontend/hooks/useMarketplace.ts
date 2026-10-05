import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface MpAgreementSummary {
  agreementId?: string;
  status?: string;
  agreementType?: string;
  endTime?: string | number;
  startTime?: string | number;
  lastUpdateTime?: string | number;
  acceptor?: Record<string, unknown>;
  proposer?: Record<string, unknown>;
}

export interface MpEntitlement {
  productCode?: string;
  customerIdentifier?: string;
  dimension?: string;
  value?: Record<string, unknown>;
  expirationDate?: string;
}

export function useMpAgreements(agreementType?: string) {
  return useQuery({
    queryKey: ["aws", "marketplace", "agreements", agreementType ?? "PurchaseAgreement"],
    queryFn: () =>
      api<{ agreements: MpAgreementSummary[]; nextToken?: string }>(
        `/aws/marketplace/agreements${agreementType ? `?agreementType=${encodeURIComponent(agreementType)}` : ""}`
      ),
  });
}

export function useMpAgreementDetail() {
  return useMutation({
    mutationFn: (agreementId: string) =>
      api<{ agreement: Record<string, unknown> | null }>(
        "/aws/marketplace/agreements/describe",
        { method: "POST", body: JSON.stringify({ agreementId }) }
      ),
  });
}

export function useMpCancelAgreement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (agreementId: string) =>
      api<{ cancelled: boolean }>("/aws/marketplace/agreements/cancel", {
        method: "POST",
        body: JSON.stringify({ agreementId }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "marketplace", "agreements"] }),
  });
}

export function useMpEntitlements() {
  return useMutation({
    mutationFn: (productCode: string) =>
      api<{ entitlements: MpEntitlement[] }>("/aws/marketplace/entitlements", {
        method: "POST",
        body: JSON.stringify({ productCode }),
      }),
  });
}

export function useMpMeterUsage() {
  return useMutation({
    mutationFn: (input: {
      productCode: string;
      usageDimension: string;
      usageQuantity?: number;
      dryRun?: boolean;
    }) =>
      api<{ meteringRecordId: string }>("/aws/marketplace/metering/usage", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });
}

export function useMpResolveCustomer() {
  return useMutation({
    mutationFn: (registrationToken: string) =>
      api<{
        productCode?: string;
        customerAWSAccountId?: string;
        licenseArn?: string;
      }>("/aws/marketplace/metering/resolve-customer", {
        method: "POST",
        body: JSON.stringify({ registrationToken }),
      }),
  });
}

export function useMpEntities(entityType?: string) {
  return useQuery({
    queryKey: ["aws", "marketplace", "entities", entityType ?? "Agreement"],
    queryFn: () =>
      api<{ entities: Record<string, unknown>[]; nextToken?: string }>(
        `/aws/marketplace/catalog/entities${entityType ? `?entityType=${encodeURIComponent(entityType)}` : ""}`
      ),
  });
}

export function useMpEntityDetail() {
  return useMutation({
    mutationFn: (entityId: string) =>
      api<{ entity: Record<string, unknown> | null }>(
        `/aws/marketplace/catalog/entity?entityId=${encodeURIComponent(entityId)}`,
        { method: "GET" }
      ),
  });
}
