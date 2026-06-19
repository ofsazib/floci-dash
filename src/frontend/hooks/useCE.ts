import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

const CE_KEY = ["aws", "ce"];

export function useCostAndUsage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/ce/cost-and-usage", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: CE_KEY }),
  });
}

export function useDimensionValues() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/ce/dimension-values", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: CE_KEY }),
  });
}

export function useCETags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/ce/tags", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: CE_KEY }),
  });
}

export function useReservationCoverage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/ce/reservation-coverage", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: CE_KEY }),
  });
}

export function useReservationUtilization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/ce/reservation-utilization", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: CE_KEY }),
  });
}

export function useSavingsPlansCoverage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/ce/savings-plans-coverage", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: CE_KEY }),
  });
}

export function useSavingsPlansUtilization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/ce/savings-plans-utilization", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: CE_KEY }),
  });
}

export function useCostCategories() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/ce/cost-categories", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: CE_KEY }),
  });
}
