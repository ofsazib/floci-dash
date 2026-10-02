import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/client";

export interface AaAnalyzer {
  arn?: string;
  name?: string;
  type?: string;
  status?: string;
  createdAt?: string;
}

const enc = encodeURIComponent;

export function useAaAnalyzers() {
  return useQuery({
    queryKey: ["aws", "accessanalyzer", "analyzers"],
    queryFn: () =>
      api<{ analyzers: AaAnalyzer[]; total: number }>(
        "/aws/accessanalyzer/analyzers"
      ),
  });
}

export function useCreateAaAnalyzer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { analyzerName: string; type: string }) =>
      api<{ arn: string }>("/aws/accessanalyzer/analyzers", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "accessanalyzer", "analyzers"] }),
  });
}

export function useDeleteAaAnalyzer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api(`/aws/accessanalyzer/analyzers/${enc(name)}`, { method: "DELETE" }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["aws", "accessanalyzer", "analyzers"] }),
  });
}
