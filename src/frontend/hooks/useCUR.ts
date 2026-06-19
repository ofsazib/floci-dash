import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export function useReportDefinitions() {
  return useQuery({
    queryKey: ["aws", "cur", "report-definitions"],
    queryFn: () => api<{ reportDefinitions: any[]; total: number }>("/aws/cur/report-definitions"),
  });
}

export function useCreateReportDefinition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/cur/report-definitions", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "cur", "report-definitions"] }),
  });
}

export function useModifyReportDefinition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/cur/report-definitions", { method: "PUT", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "cur", "report-definitions"] }),
  });
}

export function useDeleteReportDefinition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/cur/report-definitions/${name}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "cur", "report-definitions"] }),
  });
}
