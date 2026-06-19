import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export function useBCMExports() {
  return useQuery({
    queryKey: ["aws", "bcmdataexports", "exports"],
    queryFn: () => api<{ exports: any[]; total: number }>("/aws/bcmdataexports/exports"),
  });
}

export function useBCMExport(exportArn: string | null) {
  return useQuery({
    queryKey: ["aws", "bcmdataexports", "exports", exportArn],
    queryFn: () =>
      api<{ export: any }>(`/aws/bcmdataexports/exports/${encodeURIComponent(exportArn!)}`),
    enabled: !!exportArn,
  });
}

export function useCreateBCMExport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: any) =>
      api("/aws/bcmdataexports/exports", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "bcmdataexports", "exports"] }),
  });
}

export function useUpdateBCMExport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ exportArn, ...body }: { exportArn: string } & any) =>
      api(`/aws/bcmdataexports/exports/${encodeURIComponent(exportArn)}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "bcmdataexports", "exports"] }),
  });
}

export function useDeleteBCMExport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (exportArn: string) =>
      api(`/aws/bcmdataexports/exports/${encodeURIComponent(exportArn)}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["aws", "bcmdataexports", "exports"] }),
  });
}

export function useBCMExportExecutions(exportArn: string | null) {
  return useQuery({
    queryKey: ["aws", "bcmdataexports", "exports", exportArn, "executions"],
    queryFn: () =>
      api<{ executions: any[]; total: number }>(
        `/aws/bcmdataexports/exports/${encodeURIComponent(exportArn!)}/executions`
      ),
    enabled: !!exportArn,
  });
}

export function useBCMTables() {
  return useQuery({
    queryKey: ["aws", "bcmdataexports", "tables"],
    queryFn: () => api<{ tables: any[]; total: number }>("/aws/bcmdataexports/tables"),
  });
}
