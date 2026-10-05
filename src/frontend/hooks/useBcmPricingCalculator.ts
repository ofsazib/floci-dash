import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface BcmEstimate {
  id?: string;
  name?: string;
  status?: string;
  rateType?: string;
  totalCost?: number;
  costCurrency?: string;
  createdAt?: number;
  expiresAt?: number;
  rateTimestamp?: number;
}

export interface BcmUsageItem {
  id?: string;
  serviceCode?: string;
  usageType?: string;
  operation?: string;
  location?: string;
  usageAccountId?: string;
  group?: string;
  quantity?: { unit?: string; amount?: number };
  cost?: number;
  currency?: string;
  status?: string;
  key?: string;
}

export interface BcmUsageError {
  key?: string;
  errorCode?: string;
  errorMessage?: string;
}

export function useBcmCreateEstimate() {
  return useMutation({
    mutationFn: (input: {
      name: string;
      rateType?: string;
      clientToken?: string;
      tags?: Record<string, string>;
    }) =>
      api<{ estimate: BcmEstimate }>("/aws/bcm-pricing-calculator/estimates", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });
}

export function useBcmGetEstimate() {
  return useMutation({
    mutationFn: (identifier: string) =>
      api<{ estimate: BcmEstimate }>("/aws/bcm-pricing-calculator/estimates/get", {
        method: "POST",
        body: JSON.stringify({ identifier }),
      }),
  });
}

export function useBcmDeleteEstimate() {
  return useMutation({
    mutationFn: (identifier: string) =>
      api<{ deleted: boolean }>("/aws/bcm-pricing-calculator/estimates", {
        method: "DELETE",
        body: JSON.stringify({ identifier }),
      }),
  });
}

export function useBcmCreateUsage() {
  return useMutation({
    mutationFn: (input: {
      workloadEstimateId: string;
      usage: {
        serviceCode?: string;
        usageType?: string;
        operation?: string;
        key?: string;
        usageAccountId?: string;
        group?: string;
        amount?: number;
      }[];
    }) =>
      api<{ items: BcmUsageItem[]; errors: BcmUsageError[] }>(
        "/aws/bcm-pricing-calculator/estimates/usage",
        { method: "POST", body: JSON.stringify(input) }
      ),
  });
}
